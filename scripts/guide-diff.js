#!/usr/bin/env node
// scripts/guide-diff.js — what changed between two exports of the study guide and the
// story scripts, heading by heading.
//
//   node scripts/guide-diff.js                      archive (Oct 23) vs content/ → content/guide-diff.md
//   node scripts/guide-diff.js --old <dir> --out <file>
//
// Each file is cut into sections at its headings (outside code fences); a section is keyed
// by its heading path, the same path a card's `source` starts with ("Pre-action › Data
// center points to make"). A section whose text changed, was added or was removed is
// listed, and so is every table inside a kept section whose rows changed. The cards and
// mock questions whose `source` falls in a listed section are listed under it: those are
// the ones the audit session re-checks.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { plainText } from '../tools/markdown.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SEP = ' › ';

export const PAIRS = [
  { name: 'study-guide.md', old: 'content/archive/study-guide-2026-10-23.md', now: 'content/study-guide.md' },
  { name: 'story-scripts.md', old: 'content/archive/story-scripts-2026-10-23.md', now: 'content/story-scripts.md' },
];

const norm = (s) => s.replace(/\s+/g, ' ').trim();

// Sections in file order: { path, level, body: [lines], tables: [[lines]] }. The body is
// everything up to the next heading of any level, so a change is reported once, at the
// heading closest to it.
export function sections(md) {
  const lines = String(md).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  const trail = [];
  const seen = new Map();
  let cur = { path: '(before the first heading)', level: 0, body: [] };
  out.push(cur);
  let fenced = false;
  for (const line of lines) {
    if (/^```/.test(line)) fenced = !fenced;
    const h = !fenced && line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (!h) {
      cur.body.push(line);
      continue;
    }
    const level = h[1].length;
    trail.length = level - 1;
    trail[level - 1] = plainText(h[2]);
    let path = trail.filter(Boolean).slice(level > 1 ? 1 : 0).join(SEP);
    const n = (seen.get(path) || 0) + 1;
    seen.set(path, n);
    if (n > 1) path = `${path} (${n})`;
    cur = { path, level, body: [] };
    out.push(cur);
  }
  for (const s of out) {
    s.text = norm(s.body.join('\n'));
    s.tables = [];
    let t = null;
    for (const line of s.body) {
      if (/^\s*\|/.test(line)) (t ||= s.tables[s.tables.push([]) - 1]).push(norm(line));
      else t = null;
    }
  }
  return out.filter((s) => s.level > 0 || s.text);
}

function tableLabel(rows) {
  const head = (rows[0] || '').split('|').map((c) => c.trim()).filter(Boolean);
  return head.slice(0, 3).join(' · ') || 'table';
}

export function diffFiles(oldMd, newMd) {
  const a = sections(oldMd);
  const b = sections(newMd);
  const byPath = (xs) => new Map(xs.map((s) => [s.path, s]));
  const A = byPath(a);
  const B = byPath(b);
  const changes = [];
  for (const s of b) {
    const o = A.get(s.path);
    if (!o) {
      changes.push({ path: s.path, change: 'added' });
      continue;
    }
    if (o.text === s.text) continue;
    const tables = [];
    const n = Math.max(o.tables.length, s.tables.length);
    for (let i = 0; i < n; i++) {
      const ot = o.tables[i];
      const nt = s.tables[i];
      if (!ot) tables.push({ label: tableLabel(nt), change: 'added' });
      else if (!nt) tables.push({ label: tableLabel(ot), change: 'removed' });
      else if (ot.join('\n') !== nt.join('\n')) {
        const rows = nt.filter((r) => !ot.includes(r)).length + ot.filter((r) => !nt.includes(r)).length;
        tables.push({ label: tableLabel(nt), change: `changed (${rows} row${rows === 1 ? '' : 's'} differ)` });
      }
    }
    const prose = norm(o.body.filter((l) => !/^\s*\|/.test(l)).join('\n')) !== norm(s.body.filter((l) => !/^\s*\|/.test(l)).join('\n'));
    changes.push({ path: s.path, change: 'changed', prose, tables });
  }
  for (const s of a) if (!B.has(s.path)) changes.push({ path: s.path, change: 'removed' });
  return { changes, oldCount: a.length, newCount: b.length };
}

// Cards (and mock questions) whose source falls in a changed section: the source starts
// with the section's path, or the section sits under the source's heading.
export function affected(changes, items) {
  const hit = (src, path) => {
    const p = path.replace(/ \(\d+\)$/, '');
    return src === p || src.startsWith(`${p}${SEP}`) || p.startsWith(`${src}${SEP}`) || src.split(SEP)[0] === p;
  };
  return changes.map((c) => ({ ...c, items: items.filter((x) => hit(String(x.source || ''), c.path)).map((x) => x.id) }));
}

function readItems(root) {
  const items = [];
  const q = join(root, 'src/data/questions.json');
  if (existsSync(q)) for (const c of JSON.parse(readFileSync(q, 'utf8'))) items.push({ id: c.id, source: c.source });
  const m = join(root, 'src/data/mock.json');
  if (existsSync(m)) for (const d of JSON.parse(readFileSync(m, 'utf8')).decks || []) for (const x of d.questions || []) items.push({ id: x.id, source: x.source });
  return items;
}

export function report(root = ROOT, pairs = PAIRS) {
  const items = readItems(root);
  const out = ['# Guide diff', '', 'Generated by `node scripts/guide-diff.js`. Old export → current export, heading by heading. A section is listed when its text changed (with any table inside it whose rows changed), or when it was added or removed. The cards and mock questions whose `source` falls in a listed section are named under it — the audit session re-checks those.', ''];
  let total = 0;
  for (const p of pairs) {
    const oldPath = join(root, p.old);
    const newPath = join(root, p.now);
    out.push(`## ${p.name}`, '', `\`${p.old}\` → \`${p.now}\``, '');
    if (!existsSync(oldPath) || !existsSync(newPath)) {
      out.push(`Not compared: ${existsSync(oldPath) ? p.now : p.old} is missing.`, '');
      continue;
    }
    const oldMd = readFileSync(oldPath, 'utf8');
    const newMd = readFileSync(newPath, 'utf8');
    const { changes, oldCount, newCount } = diffFiles(oldMd, newMd);
    total += changes.length;
    if (oldMd === newMd) out.push(`**No changes.** The two files are byte-identical (${newCount} sections).`, '');
    else if (!changes.length) out.push(`**No section changed** (${oldCount} → ${newCount} sections; the files differ only in whitespace).`, '');
    else {
      out.push(`${changes.length} of ${newCount} sections changed, added or removed.`, '', '| Section | Change | Tables | Cards and mock questions citing it |', '| --- | --- | --- | --- |');
      for (const c of affected(changes, items)) {
        const tables = (c.tables || []).map((t) => `${t.label}: ${t.change}`).join('<br>') || (c.change === 'changed' ? '—' : '');
        const what = c.change === 'changed' ? (c.prose ? 'text changed' : 'tables only') : c.change;
        out.push(`| ${c.path.replace(/\|/g, '\\|')} | ${what} | ${tables.replace(/\|/g, '\\|')} | ${c.items.join(', ') || '—'} |`);
      }
      out.push('');
    }
  }
  out.push(`**Total: ${total} section change${total === 1 ? '' : 's'}.**`, '');
  return { text: out.join('\n'), total };
}

function main(argv) {
  const outArg = argv.indexOf('--out');
  const oldArg = argv.indexOf('--old');
  const out = resolve(outArg >= 0 ? argv[outArg + 1] : join(ROOT, 'content/guide-diff.md'));
  const pairs = oldArg >= 0 ? PAIRS.map((p) => ({ ...p, old: join(relative(ROOT, resolve(argv[oldArg + 1])), p.name) })) : PAIRS;
  const { text, total } = report(ROOT, pairs);
  writeFileSync(out, text);
  console.log(`${relative(ROOT, out)} · ${total} section change${total === 1 ? '' : 's'}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
