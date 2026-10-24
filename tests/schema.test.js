import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateBank, validateCard, validateMock, sourceHeading } from '../src/engine/schema.js';
import { loadReference, validateFile } from '../validate.js';
import { ROOT, sampleCards, readJson } from './helpers.js';
import { join } from 'node:path';

const ref = loadReference(ROOT);

test('sample.json and questions.json validate clean (no errors)', () => {
  const sample = validateFile(join(ROOT, 'src/data/sample.json'), ROOT);
  assert.equal(sample.kind, 'cards');
  assert.deepEqual(sample.errors, []);
  const bank = validateFile(join(ROOT, 'src/data/questions.json'), ROOT);
  assert.deepEqual(bank.errors, []);
  assert.ok(Array.isArray(readJson('src/data/questions.json')), 'questions.json is an array (coverage is checked in bank.test.js)');
});

test('sample deck: 10 cards covering all six types', () => {
  const cards = sampleCards();
  assert.equal(cards.length, 10);
  assert.deepEqual([...new Set(cards.map((c) => c.type))].sort(), ['defect', 'matrix', 'number', 'order', 'scenario', 'story']);
});

test('every sample source names a real heading', () => {
  for (const c of sampleCards()) assert.ok(ref.headings.has(sourceHeading(c.source)), c.source);
});

const good = () => structuredClone(sampleCards()[0]);

test('schema catches the mistakes a question-bank session is likely to make', () => {
  const cases = [
    [(c) => { c.codeRef = 'NFPA 13'; }, /codeRef lives in answer.codeRef/],
    [(c) => { c.id = 'P2-number-1'; }, /id must look like/],
    [(c) => { c.topicId = 'P9'; c.id = 'P9-num-01'; }, /not in content\/topics.json/],
    [(c) => { c.type = 'mcq'; }, /type must be one of/],
    [(c) => { delete c.hook; }, /hook is required/],
    [(c) => { c.source = 'Sprinklers › table'; }, /not a heading/],
    [(c) => { c.par = 0; }, /par/],
    [(c) => { delete c.answer.codeRef; }, /must set answer.codeRef/],
    [(c) => { c.answer.fields = []; }, /at least one field/],
    [(c) => { c.confirmInEdition = true; }, /standard name only/],
    [(c) => { c.answer.fields[0].value = null; }, /must be a number/],
  ];
  for (const [mutate, re] of cases) {
    const c = good();
    mutate(c);
    const { errors } = validateCard(c, { topicIds: new Set(ref.topics.map((t) => t.id)), headings: ref.headings });
    assert.ok(errors.some((e) => re.test(e)), `${re} not in ${JSON.stringify(errors)}`);
  }
});

test('type-specific answer shapes are checked', () => {
  const byType = Object.fromEntries(sampleCards().map((c) => [c.type, c]));
  const bad = (type, mutate, re) => {
    const c = structuredClone(byType[type]);
    mutate(c.answer);
    const { errors } = validateCard(c, {});
    assert.ok(errors.some((e) => re.test(e)), `${type}: ${re} not in ${JSON.stringify(errors)}`);
  };
  bad('order', (a) => { a.steps = ['one', 'two']; }, /at least 3/);
  bad('order', (a) => { a.steps.push(a.steps[0]); }, /duplicates/);
  bad('matrix', (a) => { a.grid.cells[0].pop(); }, /must have 4 cells/);
  bad('matrix', (a) => { a.grid.cells[0][0] = 'maybe'; }, /is not one of/);
  bad('defect', (a) => { a.defectIndex = 99; }, /defectIndex/);
  bad('story', (a) => { delete a.script; }, /script/);
  bad('story', (a) => { a.beats = ['Hook', 'Lesson']; }, /must be an object/);
  bad('story', (a) => { a.timing = { min: 120, max: 90, limit: 150 }; }, /timing/);
  bad('scenario', (a) => { a.beats = ['only one']; }, /at least 2 beats/);
});

test('bank-level: duplicate ids are errors, coverage gaps are warnings', () => {
  const cards = [good(), good()];
  const r = validateBank(cards, ref);
  assert.ok(r.errors.some((e) => /duplicate id/.test(e)));
  assert.ok(r.warnings.some((w) => /P2 \(Core\): 2 cards, spec wants 6–10/.test(w)));
  assert.deepEqual(validateBank({}, ref).errors, ['questions.json must be a JSON array of cards']);
});

test('mock.json schema', () => {
  const q = (i, kind) => ({ id: `m1-q${i}`, kind, prompt: 'Something you owned end to end.', followUp: 'What would you do differently?', par: 105, beats: ['Hook', 'Lesson'], source: 'Likely questions and day-of checklist › Values and judgment (the 65%)' });
  const mock = { decks: [{ id: 'mock-1', title: 'Mock 1', questions: [q(1, 'technical'), q(2, 'values'), q(3, 'values'), q(4, 'technical'), q(5, 'values')] }] };
  assert.deepEqual(validateMock(mock, ref), { errors: [], warnings: [] });
  mock.decks[0].questions[0].par = 10;
  mock.decks[0].questions[1].kind = 'other';
  const r = validateMock(mock, ref);
  assert.ok(r.errors.some((e) => /par/.test(e)));
  assert.ok(r.errors.some((e) => /kind/.test(e)));
});
