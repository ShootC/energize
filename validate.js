#!/usr/bin/env node
// Validate a question bank or mock-interview file against the ENERGIZE schema.
//
//   node validate.js src/data/questions.json        cards (array)
//   node validate.js src/data/mock.json             mock decks ({ decks: [] })
//   node validate.js <file> --strict                warnings fail too
//
// Exit code 0 = clean (warnings allowed unless --strict), 1 = errors.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateBank, validateMock } from './src/engine/schema.js';
import { extractHeadings } from './tools/markdown.js';

const ROOT = dirname(fileURLToPath(import.meta.url));

export function loadReference(root = ROOT) {
  const topics = JSON.parse(readFileSync(join(root, 'content/topics.json'), 'utf8'));
  const headings = new Set();
  for (const f of ['content/study-guide.md', 'content/story-scripts.md']) {
    for (const h of extractHeadings(readFileSync(join(root, f), 'utf8'))) headings.add(h.text);
  }
  return { topics, headings };
}

export function validateFile(file, root = ROOT) {
  const ref = loadReference(root);
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    return { kind: 'unreadable', errors: [`${file}: ${e.message}`], warnings: [] };
  }
  if (Array.isArray(data)) return { kind: 'cards', ...validateBank(data, ref), cards: data };
  if (data && Array.isArray(data.decks)) return { kind: 'mock', ...validateMock(data, ref) };
  return { kind: 'unknown', errors: [`${file}: expected a JSON array of cards or an object with decks[]`], warnings: [] };
}

function main(argv) {
  const args = argv.filter((a) => !a.startsWith('--'));
  const strict = argv.includes('--strict');
  if (argv.includes('--headings')) {
    // Every heading a card's `source` may start with.
    for (const f of ['content/study-guide.md', 'content/story-scripts.md']) {
      console.log(`\n${f}`);
      for (const hd of extractHeadings(readFileSync(join(ROOT, f), 'utf8'))) console.log(`${'  '.repeat(hd.level - 1)}${hd.text}`);
    }
    return 0;
  }
  if (!args.length) {
    console.error('usage: node validate.js <questions.json|mock.json> [--strict]   ·   node validate.js --headings');
    return 2;
  }
  let failed = false;
  for (const f of args) {
    const file = resolve(f);
    const r = validateFile(file);
    console.log(`\n${f} — ${r.kind}`);
    if (r.kind === 'cards') {
      const byType = {};
      for (const c of r.cards) byType[c.type] = (byType[c.type] || 0) + 1;
      console.log(`  ${r.cards.length} cards · ${Object.entries(byType).map(([k, v]) => `${k} ${v}`).join(' · ') || 'empty'}`);
      const topics = Object.keys(r.counts).sort();
      if (topics.length) console.log(`  topics with cards (${topics.length}): ${topics.map((t) => `${t}:${r.counts[t].total}`).join(' ')}`);
    }
    for (const e of r.errors) console.log(`  ERROR   ${e}`);
    for (const w of r.warnings) console.log(`  warning ${w}`);
    const bad = r.errors.length > 0 || (strict && r.warnings.length > 0);
    console.log(bad ? `  ✗ ${r.errors.length} error(s), ${r.warnings.length} warning(s)` : `  ✓ valid (${r.warnings.length} warning(s))`);
    failed ||= bad;
  }
  return failed ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
