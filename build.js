#!/usr/bin/env node
// Build dist/index.html: one self-contained file, no external requests.
//
//   node build.js                 → dist/index.html
//   node build.js --out x.html    → somewhere else
//
// Inlines: src/ui/styles.css, every JS module reachable from src/ui/app.js
// (bundled with a tiny module registry), src/data/questions.json, sample.json,
// mock.json (if present), content/topics.json, and content/study-guide.md +
// story-scripts.md rendered to HTML for the Browse screen.
//
// Module rules the bundler relies on (keep to them in src/):
//   import { a, b as c } from './relative.js';     — named imports only
//   export function / export const / export class / export { a, b };

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMarkdown, plainText } from './tools/markdown.js';
import { validateBank, validateMock } from './src/engine/schema.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const ENTRY = 'src/ui/app.js';

const IMPORT_RE = /^import\s*\{([^}]*)\}\s*from\s*['"](\.{1,2}\/[^'"]+)['"];?[ \t]*$/gm;

function rel(root, abs) {
  return relative(root, abs).split('\\').join('/');
}

// Depth-first: dependencies before dependents.
export function collectModules(root, entry = ENTRY) {
  const order = [];
  const seen = new Set();
  const visiting = new Set();
  const visit = (path) => {
    if (seen.has(path)) return;
    if (visiting.has(path)) throw new Error(`Circular import at ${path}`);
    visiting.add(path);
    const code = readFileSync(join(root, path), 'utf8').replace(/\r\n?/g, '\n');
    for (const m of code.matchAll(IMPORT_RE)) visit(posix.normalize(posix.join(posix.dirname(path), m[2])));
    visiting.delete(path);
    seen.add(path);
    order.push({ path, code });
  };
  visit(entry);
  return order;
}

export function transformModule(path, code) {
  const names = [];
  let out = code.replace(IMPORT_RE, (_, list, from) => {
    const dep = posix.normalize(posix.join(posix.dirname(path), from));
    const binds = list
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/^(\w+)\s+as\s+(\w+)$/, '$1: $2'));
    return `const { ${binds.join(', ')} } = __m[${JSON.stringify(dep)}];`;
  });
  if (/^\s*import\s/m.test(out)) throw new Error(`${path}: unsupported import syntax (use: import { a } from './x.js';)`);
  out = out.replace(/^export\s+((?:async\s+)?function\*?\s+(\w+))/gm, (_, decl, name) => {
    names.push(name);
    return decl;
  });
  out = out.replace(/^export\s+((?:const|let|var|class)\s+(\w+))/gm, (_, decl, name) => {
    names.push(name);
    return decl;
  });
  out = out.replace(/^export\s*\{([^}]*)\};?[ \t]*$/gm, (_, list) => {
    for (const s of list.split(',').map((x) => x.trim()).filter(Boolean)) {
      const m = s.match(/^(\w+)(?:\s+as\s+(\w+))?$/);
      names.push(m[2] ? `${m[2]}: ${m[1]}` : m[1]);
    }
    return '';
  });
  if (/^\s*export\s/m.test(out)) throw new Error(`${path}: unsupported export syntax (no default exports)`);
  return `__m[${JSON.stringify(path)}] = (function () {\n'use strict';\n${out}\nreturn { ${names.join(', ')} };\n})();`;
}

// run: false returns the module registry instead of starting the app (tests).
export function bundle(root = ROOT, entry = ENTRY, { run = true } = {}) {
  const mods = collectModules(root, entry);
  const body = mods.map((m) => `// ---- ${m.path}\n${transformModule(m.path, m.code)}`).join('\n\n');
  return {
    modules: mods.map((m) => m.path),
    code: `(function () {\nconst __m = {};\n${body}\n${run ? `__m[${JSON.stringify(entry)}].start();` : 'return __m;'}\n})();`,
  };
}

const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

// The 14-day plan table → [{ day, date, technical, interview, doneWhen }].
export function parsePlan(md, year = 2026) {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const start = lines.findIndex((l) => /^##\s+14-day plan/.test(l));
  const rows = [];
  for (let i = start + 1; i < lines.length && !/^##\s/.test(lines[i]); i++) {
    const l = lines[i].trim();
    if (!l.startsWith('|') || /^\|\s*-/.test(l) || /^\|\s*Day\s*\|/.test(l)) continue;
    const c = l.replace(/^\||\|$/g, '').split('|').map((x) => plainText(x.trim()));
    const m = c[1].match(/(\w{3})\s+(\d{1,2})$/);
    if (!m || !MONTHS[m[1]]) continue;
    rows.push({
      day: Number.parseInt(c[0], 10),
      date: `${year}-${String(MONTHS[m[1]]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`,
      technical: c[2],
      interview: c[3],
      doneWhen: c[4],
    });
  }
  return rows;
}

export function parseChecklist(md) {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const start = lines.findIndex((l) => /^###\s+Day-of checklist/.test(l));
  if (start < 0) return [];
  const out = [];
  for (let i = start + 1; i < lines.length && !/^#/.test(lines[i]); i++) {
    const m = lines[i].match(/^\s*-\s+\[[ xX]\]\s+(.*)$/);
    if (m) out.push(plainText(m[1]));
  }
  return out;
}

// Anything that would make the page reach the network.
export function checkOffline(html) {
  const problems = [];
  const rules = [
    [/<script\b[^>]*\bsrc\s*=/i, '<script src>'],
    [/<link\b[^>]*\bhref\s*=/i, '<link href>'],
    [/<(img|iframe|source|audio|video|embed|object|track)\b[^>]*\b(src|data|srcset)\s*=\s*["']?(https?:)?\/\//i, 'remote media element'],
    [/url\(\s*['"]?(https?:)?\/\//i, 'CSS url() to the network'],
    [/@import\b/i, 'CSS @import'],
    [/\bfetch\s*\(/, 'fetch()'],
    [/XMLHttpRequest/, 'XMLHttpRequest'],
    [/navigator\.sendBeacon/, 'sendBeacon'],
    [/new\s+WebSocket/, 'WebSocket'],
  ];
  for (const [re, what] of rules) if (re.test(html)) problems.push(what);
  return problems;
}

function readJson(root, p, fallback) {
  const f = join(root, p);
  if (!existsSync(f)) return fallback;
  return JSON.parse(readFileSync(f, 'utf8'));
}

const scriptSafe = (s) => s.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');

export function build({ root = ROOT, out = join(ROOT, 'dist/index.html'), write = true, log = console.log } = {}) {
  const topics = readJson(root, 'content/topics.json');
  const questions = readJson(root, 'src/data/questions.json', []);
  const sample = readJson(root, 'src/data/sample.json', []);
  const mock = readJson(root, 'src/data/mock.json', null);
  const guideMd = readFileSync(join(root, 'content/study-guide.md'), 'utf8');
  const scriptsMd = readFileSync(join(root, 'content/story-scripts.md'), 'utf8');

  const guide = renderMarkdown(guideMd, { idPrefix: 'g-' });
  const scripts = renderMarkdown(scriptsMd, { idPrefix: 's-' });
  const headings = new Set([...guide.headings, ...scripts.headings].map((x) => x.text));

  const problems = [];
  const warnings = [];
  for (const [name, cards] of [['questions.json', questions], ['sample.json', sample]]) {
    const r = validateBank(cards, { topics: name === 'sample.json' ? null : topics, headings });
    problems.push(...r.errors.map((e) => `${name}: ${e}`));
    warnings.push(...r.warnings.map((w) => `${name}: ${w}`));
  }
  if (mock) {
    const r = validateMock(mock, { topics, headings });
    problems.push(...r.errors.map((e) => `mock.json: ${e}`));
    warnings.push(...r.warnings.map((w) => `mock.json: ${w}`));
  }
  if (problems.length) throw new Error(`Build stopped — invalid data:\n  ${problems.join('\n  ')}\n(run: node validate.js src/data/questions.json)`);

  const data = {
    questions,
    sample,
    mock,
    topics,
    docs: { guide: { headings: guide.headings }, scripts: { headings: scripts.headings } },
    plan: parsePlan(guideMd),
    checklist: parseChecklist(guideMd),
    build: { time: new Date().toISOString().slice(0, 16).replace('T', ' ') },
  };

  const js = bundle(root);
  const css = readFileSync(join(root, 'src/ui/styles.css'), 'utf8');
  const template = readFileSync(join(root, 'src/ui/index.html'), 'utf8');
  const docs = `<template id="doc-guide">${guide.html}</template>\n<template id="doc-scripts">${scripts.html}</template>`;

  const html = template
    .replace('/*__STYLES__*/', () => css)
    .replace('<!--__DOCS__-->', () => docs)
    .replace('/*__DATA__*/', () => JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'))
    .replace('/*__SCRIPT__*/', () => scriptSafe(js.code));

  const offline = checkOffline(html.replace(/<template[\s\S]*?<\/template>/g, ''));
  if (offline.length) throw new Error(`Build stopped — the page would reach the network: ${offline.join(', ')}`);

  if (write) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
    log(`✓ ${rel(root, resolve(out))} · ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB · ${js.modules.length} modules · ${questions.length} questions${questions.length ? '' : ` (sample deck: ${sample.length})`}${mock ? ` · ${mock.decks.length} mock decks` : ''} · ${data.plan.length} plan days`);
    if (warnings.length) log(`  ${warnings.length} content warning(s) — node validate.js src/data/questions.json for details`);
  }
  return { html, data, modules: js.modules, warnings };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--out');
  try {
    build({ out: i > 0 ? resolve(process.argv[i + 1]) : join(ROOT, 'dist/index.html') });
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
