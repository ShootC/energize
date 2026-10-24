import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  gradeCard, parseNumber, numberMatches, codeRefMatches, codeTokens, swapDistance, longestInOrder, textMatches,
} from '../src/engine/grader.js';
import { sampleCards } from './helpers.js';

const cards = Object.fromEntries(sampleCards().map((c) => [c.id, c]));
const airTest = cards['P2-num-01'];

test('parseNumber reads loose input', () => {
  assert.equal(parseNumber('40'), 40);
  assert.equal(parseNumber(' 1.5 psi'), 1.5);
  assert.equal(parseNumber('≤ 1.5'), 1.5);
  assert.equal(parseNumber('1,560 gpm'), 1560);
  assert.equal(parseNumber('1,500,000'), 1500000);
  assert.equal(parseNumber('.5'), 0.5);
  assert.ok(Number.isNaN(parseNumber('')));
  assert.ok(Number.isNaN(parseNumber('forty')));
});

test('number tolerance: integers exact, decimals ±2%, explicit tolerance is absolute', () => {
  assert.equal(numberMatches('40', { value: 40 }), true);
  assert.equal(numberMatches('41', { value: 40 }), false);
  assert.equal(numberMatches('0.433', { value: 0.433 }), true);
  assert.equal(numberMatches('0.44', { value: 0.433 }), true); // within 2%
  assert.equal(numberMatches('0.45', { value: 0.433 }), false);
  assert.equal(numberMatches('1.5', { value: 1.5, tolerance: 0.01 }), true);
  assert.equal(numberMatches('1.52', { value: 1.5, tolerance: 0.01 }), false);
  assert.equal(numberMatches('25', { value: 24, tolerance: 1 }), true);
});

test('word fields match on normalized text and aliases', () => {
  const f = { value: 'detection and loss of air', aliases: ['detection plus loss of air'] };
  assert.equal(textMatches('Detection & loss of air', f), true);
  assert.equal(textMatches('detection plus loss of air', f), true);
  assert.equal(textMatches('detection or loss of air', f), false);
});

test('code-section match is loose but not sloppy', () => {
  const exp = 'NFPA 13 §29.2.2';
  const aliases = airTest.answer.codeRefAliases;
  for (const ok of ['NFPA 13 §29.2.2', 'NFPA 13 29.2.2', '13 §29.2.2', '13 29.2.2', '29.2.2', 'nfpa13 29.2.2', 'NFPA 13-2022 §29.2.2', 'NFPA 13 section 29.2.2', '§ 29.2.2']) {
    assert.equal(codeRefMatches(ok, exp, aliases), true, ok);
  }
  for (const bad of ['', 'NFPA 13', '29.2.1', 'NFPA 25 29.2.2', '13 29.2', '8.2.6.3']) {
    assert.equal(codeRefMatches(bad, exp, aliases), false, bad);
  }
  assert.equal(codeRefMatches('NFPA 24 table 10.10.2.1.3', 'NFPA 24 Table 10.10.2.1.3'), true);
  assert.equal(codeRefMatches('10.10.2.1.3', 'NFPA 24 Table 10.10.2.1.3'), true);
  assert.equal(codeRefMatches('NFPA 110', 'NFPA 110'), true);
  assert.equal(codeRefMatches('110', 'NFPA 110'), true);
  assert.equal(codeRefMatches('NFPA 111', 'NFPA 110'), false);
  assert.equal(codeRefMatches('FM 5-32', 'FM Data Sheet 5-32'), true);
  assert.equal(codeRefMatches('UL 5-32', 'FM Data Sheet 5-32'), false);
  assert.deepEqual(codeTokens('NFPA 13-2022 §29.2.1'), ['13', '29.2.1']);
});

test('number card: all right = clean', () => {
  const g = gradeCard(airTest, { fields: ['40', '24', '1.5'], codeRef: '13 29.2.2' });
  assert.equal(g.result, 'clean');
  assert.equal(g.note, 'clean');
});

test('number card: numbers right, code section wrong = slipped (the second-half miss)', () => {
  const g = gradeCard(airTest, { fields: ['40', '24', '1.5'], codeRef: '' });
  assert.equal(g.result, 'slipped');
  assert.equal(g.note, 'slipped: code section');
});

test('number card: one of several numbers wrong = slipped (partial credit)', () => {
  const g = gradeCard(airTest, { fields: ['40', '2', '1.5'], codeRef: '29.2.2' });
  assert.equal(g.result, 'slipped');
  assert.match(g.note, /hours/);
});

test('number card: half right = missed with framework (Needs Improvement); mostly wrong or blank = Not Ready', () => {
  const half = gradeCard(airTest, { fields: ['40', '24', '3'], codeRef: '' });
  assert.equal(half.result, 'missed');
  assert.equal(half.framework, true);
  const wrong = gradeCard(airTest, { fields: ['50', '12', '3'], codeRef: '29.2.2' });
  assert.equal(wrong.result, 'missed');
  assert.equal(wrong.framework, false);
  const blank = gradeCard(airTest, { fields: ['', '', ''], codeRef: '' });
  assert.equal(blank.result, 'missed');
  assert.equal(blank.framework, false);
});

test('number card: the only number wrong is never just "slipped"', () => {
  const card = { type: 'number', answer: { fields: [{ label: 'psi', value: 40 }], codeRef: 'NFPA 13 §29.2.2' } };
  const g = gradeCard(card, { fields: ['50'], codeRef: '29.2.2' });
  assert.equal(g.result, 'missed');
  assert.equal(g.framework, true); // knew where to look
  const noCode = { type: 'number', answer: { fields: [{ label: 'psi', value: 40 }], codeRef: null } };
  assert.equal(gradeCard(noCode, { fields: ['40'] }).result, 'clean');
  assert.equal(gradeCard(noCode, { fields: ['41'] }).framework, false);
});

test('swap distance and in-order length', () => {
  assert.equal(swapDistance([0, 1, 2, 3]), 0);
  assert.equal(swapDistance([1, 0, 2, 3]), 1);
  assert.equal(swapDistance([3, 1, 2, 0]), 1);
  assert.equal(swapDistance([1, 2, 0, 3]), 2);
  assert.equal(longestInOrder([1, 2, 3, 4, 0]), 4);
});

test('order card: exact = clean; one swap = slipped; more = missed', () => {
  const card = cards['P5-ord-01'];
  assert.equal(gradeCard(card, { order: [0, 1, 2, 3, 4, 5, 6] }).result, 'clean');
  assert.equal(gradeCard(card, { order: [0, 2, 1, 3, 4, 5, 6] }).result, 'slipped');
  assert.equal(gradeCard(card, { order: [6, 1, 2, 3, 4, 5, 0] }).result, 'slipped'); // any single swap
  const two = gradeCard(card, { order: [1, 0, 3, 2, 4, 5, 6] });
  assert.equal(two.result, 'missed');
  assert.equal(two.framework, true); // 5 of 7 still in order
  const scrambled = gradeCard(card, { order: [6, 5, 4, 3, 2, 1, 0] });
  assert.equal(scrambled.result, 'missed');
  assert.equal(scrambled.framework, false);
  assert.equal(gradeCard(card, { order: [0, 1, 2] }).result, 'missed');
});

test('matrix card: blank cells count; untouched cells never pass', () => {
  const card = cards['C4-mat-01'];
  const right = card.answer.grid.cells.map((r) => [...r]);
  assert.equal(gradeCard(card, { cells: right }).result, 'clean');

  const oneOff = right.map((r) => [...r]);
  oneOff[0][3] = '●'; // ASD Alert must NOT drive HVAC
  const g1 = gradeCard(card, { cells: oneOff });
  assert.equal(g1.result, 'slipped');
  assert.equal(g1.detail.wrongBlank, 1);
  assert.match(g1.note, /should not happen/);

  const allOn = right.map((r) => r.map(() => '●'));
  const g2 = gradeCard(card, { cells: allOn });
  assert.equal(g2.result, 'missed');
  assert.equal(g2.framework, false);

  const untouched = right.map((r) => r.map(() => ''));
  assert.equal(gradeCard(card, { cells: untouched }).detail.wrong, 16);

  const threeOff = right.map((r) => [...r]);
  threeOff[0][0] = '●';
  threeOff[1][2] = '●';
  threeOff[3][2] = '●';
  const g3 = gradeCard(card, { cells: threeOff });
  assert.equal(g3.result, 'missed');
  assert.equal(g3.framework, true); // 3 of 16 ≤ 20%
});

test('scenario card: all beats + a number + the code = clean; one short = slipped; framework only = missed', () => {
  const card = cards['P8-scn-01'];
  const all = card.answer.beats.map(() => true);
  const clean = gradeCard(card, { hits: all, saidNumber: true, saidCode: true });
  assert.equal(clean.result, 'clean');
  assert.equal(clean.codeUnprompted, true);

  assert.equal(gradeCard(card, { hits: all, saidNumber: true, saidCode: false }).result, 'slipped');
  const oneBeat = [...all];
  oneBeat[2] = false;
  assert.equal(gradeCard(card, { hits: oneBeat, saidNumber: true, saidCode: true }).result, 'slipped');

  const framework = gradeCard(card, { hits: [true, true, true, false, false, false], saidNumber: false, saidCode: false });
  assert.equal(framework.result, 'missed');
  assert.equal(framework.framework, true);
  const nothing = gradeCard(card, { hits: [true, false, false, false, false, false] });
  assert.equal(nothing.result, 'missed');
  assert.equal(nothing.framework, false);
});

test('story card: four beats in 90–120 s = clean; over time or no number = slipped; past 150 s or no lesson = missed', () => {
  const card = cards['I3-sty-01'];
  const all = [true, true, true, true];
  assert.equal(gradeCard(card, { hits: all, seconds: 105 }).result, 'clean');
  assert.equal(gradeCard(card, { hits: all, seconds: 90 }).result, 'clean');
  assert.equal(gradeCard(card, { hits: all, seconds: 120 }).result, 'clean');
  assert.equal(gradeCard(card, { hits: all, seconds: 135 }).result, 'slipped');
  assert.equal(gradeCard(card, { hits: all, seconds: 75 }).result, 'slipped');
  assert.equal(gradeCard(card, { hits: [true, true, false, true], seconds: 110 }).result, 'slipped');
  const ramble = gradeCard(card, { hits: all, seconds: 151 });
  assert.equal(ramble.result, 'missed');
  assert.equal(ramble.framework, true);
  const noLesson = gradeCard(card, { hits: [true, true, true, false], seconds: 100 });
  assert.equal(noLesson.result, 'missed');
  assert.match(noLesson.note, /no lesson/);
  assert.equal(gradeCard(card, { hits: [true, false, false, false], seconds: 100 }).framework, false);
  // Over time AND a missing number: two problems.
  assert.equal(gradeCard(card, { hits: [true, true, false, true], seconds: 130 }).result, 'missed');
});

test('story card: custom timing (60 s intro) and fill-in beats are not graded', () => {
  const card = {
    type: 'story',
    answer: {
      timing: { min: 45, max: 60, limit: 75 },
      beats: [{ label: 'Hook', kind: 'hook' }, { label: 'Result', kind: 'number', fillIn: true }, { label: 'Lesson', kind: 'lesson' }],
    },
  };
  assert.equal(gradeCard(card, { hits: [true, false, true], seconds: 55 }).result, 'clean');
  assert.equal(gradeCard(card, { hits: [true, false, true], seconds: 70 }).result, 'slipped');
  assert.equal(gradeCard(card, { hits: [true, false, true], seconds: 80 }).result, 'missed');
});

test('defect card: the planted line = clean, anything else = missed', () => {
  const card = cards['C3-def-01'];
  assert.equal(gradeCard(card, { index: 5 }).result, 'clean');
  const g = gradeCard(card, { index: 1 });
  assert.equal(g.result, 'missed');
  assert.equal(g.framework, false);
});

test('every sample card grades its own answer clean', () => {
  for (const card of Object.values(cards)) {
    const a = card.answer;
    const response = {
      number: () => ({ fields: a.fields.map((f) => String(f.value)), codeRef: a.codeRef || '' }),
      order: () => ({ order: a.steps.map((_, i) => i) }),
      matrix: () => ({ cells: a.grid.cells }),
      scenario: () => ({ hits: a.beats.map(() => true), saidNumber: true, saidCode: true }),
      story: () => ({ hits: a.beats.map(() => true), seconds: 100 }),
      defect: () => ({ index: a.defectIndex }),
    }[card.type]();
    assert.equal(gradeCard(card, response).result, 'clean', card.id);
  }
});
