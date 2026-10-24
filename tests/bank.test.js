// The question bank (src/data/questions.json) as shipped: coverage per spec
// §7.4, and every card must be answerable — its own model answer grades clean
// and every alias it offers is accepted by the grader.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { ROOT, readJson, readText, shippedTopics } from './helpers.js';
import { validateFile } from '../validate.js';
import { CARD_MINIMUMS, MIN_TYPES_CORE } from '../src/engine/schema.js';
import { gradeCard, codeRefMatches, textMatches, DEFAULT_STORY_TIMING, beatKind } from '../src/engine/grader.js';

const bank = readJson('src/data/questions.json');
const topics = shippedTopics();

function perfect(card) {
  const a = card.answer;
  switch (card.type) {
    case 'number':
      return { fields: a.fields.map((f) => String(f.value)), codeRef: a.codeRef || '' };
    case 'order':
      return { order: a.steps.map((_, i) => i) };
    case 'matrix':
      return { cells: a.grid.cells.map((r) => [...r]) };
    case 'scenario':
      return { hits: a.beats.map(() => true), saidNumber: true, saidCode: true };
    case 'story': {
      const t = { ...DEFAULT_STORY_TIMING, ...(a.timing || {}) };
      return { hits: a.beats.map(() => true), seconds: t.max };
    }
    case 'defect':
      return { index: a.defectIndex };
    default:
      throw new Error(`unknown type ${card.type}`);
  }
}

// Markdown escapes resolved the way the story cards resolve them.
const sources = (readText('content/study-guide.md') + '\n' + readText('content/story-scripts.md'))
  .replace(/\\([[\]_~*])/g, '$1')
  .replace(/&#91;/g, '[')
  .replace(/&#93;/g, ']');

test('questions.json is written and validates with no errors and no warnings', () => {
  const r = validateFile(join(ROOT, 'src/data/questions.json'), ROOT);
  assert.equal(r.kind, 'cards');
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  assert.ok(bank.length >= 300, `${bank.length} cards`);
});

test('every topic has cards within the spec range, ≥3 types on Core, and an interviewer phrasing', () => {
  const r = validateFile(join(ROOT, 'src/data/questions.json'), ROOT);
  for (const t of topics) {
    const n = r.counts[t.id];
    assert.ok(n, `${t.id} has no cards`);
    const [lo, hi] = CARD_MINIMUMS[t.weight];
    assert.ok(n.total >= lo && n.total <= hi, `${t.id} (${t.weight}): ${n.total} cards, spec wants ${lo}–${hi}`);
    if (t.weight === 'Core') assert.ok(Object.keys(n.types).length >= MIN_TYPES_CORE, `${t.id}: types ${Object.keys(n.types).join(', ')}`);
    assert.ok(n.interviewer >= 1, `${t.id}: no card has interviewerPhrasing`);
  }
});

test('every card grades clean on its own model answer', () => {
  for (const card of bank) {
    const g = gradeCard(card, perfect(card));
    assert.equal(g.result, 'clean', `${card.id}: ${g.note}`);
  }
});

test('number cards: the codeRef, every codeRef alias and every field alias are accepted', () => {
  for (const card of bank.filter((c) => c.type === 'number')) {
    const a = card.answer;
    if (a.codeRef) {
      assert.ok(codeRefMatches(a.codeRef, a.codeRef, a.codeRefAliases), `${card.id}: codeRef "${a.codeRef}" does not match itself`);
      for (const alias of a.codeRefAliases || []) assert.ok(codeRefMatches(alias, a.codeRef, a.codeRefAliases), `${card.id}: alias "${alias}" not accepted for ${a.codeRef}`);
    }
    for (const f of a.fields) {
      if (typeof f.value === 'string') for (const alias of f.aliases || []) assert.ok(textMatches(alias, f), `${card.id}: field "${f.label}" alias "${alias}" not accepted`);
    }
  }
});

test('scenario cards with a codeRef accept their aliases', () => {
  for (const card of bank.filter((c) => c.type === 'scenario' && c.answer.codeRef)) {
    for (const alias of card.answer.codeRefAliases || []) assert.ok(codeRefMatches(alias, card.answer.codeRef, card.answer.codeRefAliases), `${card.id}: alias "${alias}"`);
  }
});

test('story cards: script paragraphs and beat quotes are verbatim from the source docs; exactly one lesson beat', () => {
  for (const card of bank.filter((c) => c.type === 'story')) {
    const a = card.answer;
    for (const para of a.script.split(/\n\n+/)) {
      const p = para.trim();
      if (p) assert.ok(sources.includes(p), `${card.id}: paragraph not verbatim: "${p.slice(0, 60)}…"`);
    }
    const lessons = a.beats.filter((b) => !b.fillIn && beatKind(b) === 'lesson');
    assert.equal(lessons.length, 1, `${card.id}: ${lessons.length} lesson beats`);
    for (const b of a.beats) if (b.quote) assert.ok(a.script.includes(b.quote) || sources.includes(b.quote), `${card.id}: quote not in script: "${String(b.quote).slice(0, 60)}…"`);
    for (const b of a.beats) if (/\[/.test(b.quote || '') && !b.fillIn) assert.fail(`${card.id}: a graded beat quotes a bracketed (open) line: ${b.label}`);
  }
});

test('confirmInEdition cards name the standard only; number cards with a codeRef have aliases', () => {
  for (const card of bank) {
    const a = card.answer;
    if (card.confirmInEdition) assert.ok(!/§|\d+\.\d+/.test(a.codeRef || ''), `${card.id}: ${a.codeRef}`);
    if (card.type === 'number' && a.codeRef) assert.ok((a.codeRefAliases || []).length >= 3, `${card.id}: ${(a.codeRefAliases || []).length} aliases`);
  }
});

test('order steps and defect lines are unique; prompts are not multiple choice', () => {
  for (const card of bank) {
    const a = card.answer;
    if (card.type === 'order') assert.equal(new Set(a.steps).size, a.steps.length, card.id);
    if (card.type === 'defect') assert.equal(new Set(a.lines).size, a.lines.length, card.id);
    if (card.type !== 'matrix' && card.type !== 'defect') assert.ok(!/(^|[\s(])[A-D]\)\s|\(a\)\s|\bA\.\s.*\bB\.\s/.test(card.prompt), `${card.id}: prompt looks like multiple choice`);
  }
});
