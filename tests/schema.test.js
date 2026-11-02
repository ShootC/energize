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

test('sample deck: 12 cards covering all six types, two of them with follow-up chains (one a walkthrough)', () => {
  const cards = sampleCards();
  assert.equal(cards.length, 12);
  assert.deepEqual([...new Set(cards.map((c) => c.type))].sort(), ['defect', 'matrix', 'number', 'order', 'scenario', 'story']);
  const chains = cards.filter((c) => (c.answer.followUps || []).length);
  assert.equal(chains.length, 2);
  assert.equal(chains.filter((c) => c.walkthrough).length, 1);
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

// Round 2 fields (GAME_SPEC_ROUND2 §5): answer.followUps on scenario and story cards,
// walkthrough on scenarios, ladder on stories, answer.dontSay, -r2 ids, "Round 1 debrief".
test('follow-up chains: kind enum, non-empty beats, par, source; find-out only on confirmInEdition cards', () => {
  const scenario = () => structuredClone(sampleCards().find((c) => c.type === 'scenario' && !c.answer.followUps));
  const fu = (over = {}) => ({ id: 'P8-scn-01-f1', kind: 'why-not', prompt: 'Okay, but why not just single-interlock?', beats: ['One false signal can’t put water on IT'], source: 'Pre-action › Data center points to make', par: 45, ...over });
  const check = (mutate) => {
    const c = scenario();
    mutate(c);
    return validateCard(c, { topicIds: new Set(ref.topics.map((t) => t.id)), headings: ref.headings });
  };
  assert.deepEqual(check((c) => { c.answer.followUps = [fu(), fu({ id: 'P8-scn-01-f2', kind: 'own-it', source: 'story-scripts.md', beats: [{ label: 'the closest thing I have done', fillIn: true }] })]; }).errors, []);
  const bad = (mutate, re) => {
    const { errors } = check(mutate);
    assert.ok(errors.some((e) => re.test(e)), `${re} not in ${JSON.stringify(errors)}`);
  };
  bad((c) => { c.answer.followUps = [fu({ kind: 'trivia' })]; }, /kind must be one of why-not, what-if, number, own-it, find-out, drill/);
  bad((c) => { c.answer.followUps = [fu({ beats: [] })]; }, /beats needs at least one beat/);
  bad((c) => { c.answer.followUps = [fu({ beats: [''] })]; }, /beats\[0\] is empty/);
  bad((c) => { c.answer.followUps = [fu({ par: 0 })]; }, /par/);
  bad((c) => { c.answer.followUps = [fu({ source: '' })]; }, /source is required/);
  bad((c) => { c.answer.followUps = [fu({ prompt: '' })]; }, /prompt is required/);
  bad((c) => { c.answer.followUps = [fu({ id: 'P8-scn-02-f1' })]; }, /id must be P8-scn-01-f<n>/);
  bad((c) => { c.answer.followUps = [fu(), fu()]; }, /duplicate follow-up id/);
  bad((c) => { c.answer.followUps = [fu({ kind: 'find-out' })]; }, /find-out follow-ups only on confirmInEdition cards/);
  bad((c) => { c.answer.followUps = {}; }, /followUps must be an array/);
  bad((c) => { c.answer.followUps = [fu({ prompt: 'Is it A) 40 psi or B) 50 psi?' })]; }, /multiple choice/);
  // find-out is fine on a hedged card.
  const hedged = check((c) => { c.confirmInEdition = true; c.answer.codeRef = 'NFPA 110'; c.answer.codeRefAliases = ['110']; c.answer.followUps = [fu({ kind: 'find-out' })]; });
  assert.deepEqual(hedged.errors, []);
  // Follow-ups live on scenario and story cards only.
  const num = structuredClone(sampleCards().find((c) => c.type === 'number'));
  num.answer.followUps = [fu({ id: `${num.id}-f1` })];
  assert.ok(validateCard(num, {}).errors.some((e) => /followUps only on scenario and story cards/.test(e)));
});

test('walkthrough, ladder, dontSay, -r2 ids and the Round 1 debrief source', () => {
  const opts = { topicIds: new Set(ref.topics.map((t) => t.id)), headings: ref.headings };
  const scenario = structuredClone(sampleCards().find((c) => c.type === 'scenario' && !c.answer.followUps));
  const wt = { ...structuredClone(scenario), id: 'P8-scn-04-r2', walkthrough: true, par: 120, source: 'Round 1 debrief' };
  assert.deepEqual(validateCard(wt, opts).errors, []);
  assert.deepEqual(validateCard({ ...wt, par: 90 }, opts).warnings.filter((w) => /walkthrough/.test(w)).length, 1);
  assert.ok(validateCard({ ...wt, walkthrough: 'yes' }, opts).errors.some((e) => /walkthrough must be true or false/.test(e)));
  const story = structuredClone(sampleCards().find((c) => c.type === 'story'));
  assert.ok(validateCard({ ...story, walkthrough: true }, opts).errors.some((e) => /walkthrough only on scenario cards/.test(e)));
  const drill = (n) => Array.from({ length: n }, (_, i) => ({ id: `${story.id}-f${i + 1}`, kind: 'drill', prompt: 'Why that call?', beats: ['because'], source: 'Story 1 — Three occupied towers, one cutover', par: 20 }));
  const ladder = { ...structuredClone(story), ladder: true };
  ladder.answer.followUps = drill(5);
  ladder.answer.dontSay = 'Blame the previous contractor.';
  assert.deepEqual(validateCard(ladder, opts).errors, []);
  ladder.answer.followUps[2].kind = 'why-not';
  assert.ok(validateCard(ladder, opts).errors.some((e) => /ladder cards take drill follow-ups only/.test(e)));
  assert.ok(validateCard({ ...scenario, ladder: true }, opts).errors.some((e) => /ladder only on story cards/.test(e)));
  assert.ok(validateCard({ ...story, answer: { ...story.answer, dontSay: 3 } }, opts).errors.some((e) => /dontSay/.test(e)));
  assert.ok(validateCard({ ...scenario, id: 'P8-scn-01-r' }, opts).errors.some((e) => /id must look like/.test(e)));
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

test('mock.json round decks: round r2 | r3, intro / experience / close kinds, follow-ups with beats', () => {
  const src = 'Likely questions and day-of checklist › Commissioning technical (the 35%)';
  const fu = (over = {}) => ({ prompt: 'Okay, but why not just add agent?', beats: ['It changes concentration against NOAEL'], kind: 'why-not', par: 45, ...over });
  const q = (i, kind, over = {}) => ({ id: `r2-a-q${i}`, kind, prompt: 'Walk me through it.', par: 120, beats: ['one', 'two'], source: src, followUps: [fu(), fu({ kind: 'what-if' })], ...over });
  const deck = { id: 'r2-a', round: 'r2', title: 'Round 2 · A', questions: [q(1, 'intro', { followUps: undefined, followUp: undefined, par: 60 }), q(2, 'technical'), q(3, 'technical'), q(4, 'experience'), q(5, 'technical'), q(6, 'technical'), q(7, 'close', { followUps: undefined, par: 60 })] };
  const mock = { decks: [deck] };
  assert.deepEqual(validateMock(mock, ref), { errors: [], warnings: [] }, 'round decks skip the five-question / 2-technical warnings');
  const bad = (mutate, re) => {
    const m = structuredClone(mock);
    mutate(m.decks[0]);
    const r = validateMock(m, ref);
    assert.ok(r.errors.some((e) => re.test(e)), `${re} not in ${JSON.stringify(r.errors)}`);
  };
  bad((d) => { d.round = 'r9'; }, /round must be r2 or r3/);
  bad((d) => { d.questions[1].followUps = [fu({ prompt: '' })]; }, /follow-up 1: prompt is required/);
  bad((d) => { d.questions[1].followUps = [fu({ kind: 'quiz' })]; }, /follow-up 1: kind/);
  bad((d) => { d.questions[1].followUps = [fu({ beats: [] })]; }, /follow-up 1: beats/);
  bad((d) => { d.questions[1].followUps = 'Why?'; }, /followUps must be an array/);
  bad((d) => { delete d.questions[1].followUps; d.questions[1].kind = 'technical'; }, /needs followUp or followUps/);
});
