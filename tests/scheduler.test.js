import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dueQueue, buildShift, afterResult, keepGoing, drillPlan, dayOfPlan, pickCard, cardsByTopic,
  shiftProfile, blitzDeck, isDue, technicalRank, AREA_PRIORITY,
} from '../src/engine/scheduler.js';
import { createState, recordResult } from '../src/engine/state.js';
import { shippedTopics, syntheticBank, topic } from './helpers.js';

const ids = (xs) => xs.map((x) => x.topicId ?? x.id);
const slotsOf = (shift, kind) => shift.slots.filter((s) => s.slot === kind).map((s) => s.topicId);

// Every shipped topic is due by Nov 3, so the shifts below are built on Thu Nov 5 with no
// date set for the next round (the rolling + 7 cap).
const TODAY = '2026-11-05';
const technical = { nextRound: { label: 'Round 2', focus: 'technical', date: null } };
const behavioral = { nextRound: { label: 'Round 3', focus: 'behavioral', date: null } };

// The synthetic bank plus what the round-2 shift looks for: one walkthrough (E2), one story
// with follow-ups (I4). The I8 backups are the synthetic I8-sty-01/02.
function roundBank(topics) {
  return [
    ...syntheticBank(topics),
    { id: 'E2-scn-02', topicId: 'E2', type: 'scenario', walkthrough: true, par: 120, answer: { beats: ['a', 'b'] } },
    { id: 'I4-sty-03', topicId: 'I4', type: 'story', par: 120, answer: { beats: [], followUps: [{ id: 'I4-sty-03-f1', kind: 'drill', prompt: 'Why?', beats: ['x'], par: 20 }] } },
  ];
}

const withRatings = (changes) =>
  shippedTopics().map((t) => (changes[t.id] ? { ...t, tests: 1, last_tested: '2026-11-04', next_review: TODAY, ...changes[t.id] } : t));

test('area priority for technical slots: Cx → Pre-action → Emergency power → Smoke control → Gaseous → BESS → Fire pump → Sprinkler → Applied', () => {
  assert.deepEqual(AREA_PRIORITY, ['Cx framework', 'Pre-action', 'Emergency power', 'Smoke control & FA FPT', 'Gaseous & ASD', 'BESS, gas & mist', 'Fire pump', 'Sprinkler & underground', 'Applied & refresher']);
});

test('shift profiles: technical 6 redos + 6 coverage + 1 walkthrough + 2 behavioral; behavioral 8 interview + 6 technical + 1 walkthrough', () => {
  assert.deepEqual(shiftProfile('technical', 15), { focus: 'technical', size: 15, technical: 12, redoCap: 6, walkthrough: 1, interview: 2 });
  assert.deepEqual(shiftProfile('behavioral', 15), { focus: 'behavioral', size: 15, technical: 6, redoCap: 3, walkthrough: 1, interview: 8 });
  // Other sizes scale (Settings → cards per shift).
  assert.deepEqual(shiftProfile('technical', 10), { focus: 'technical', size: 10, technical: 8, redoCap: 4, walkthrough: 1, interview: 1 });
  assert.deepEqual(shiftProfile('behavioral', 20), { focus: 'behavioral', size: 20, technical: 8, redoCap: 4, walkthrough: 1, interview: 11 });
});

// Hand-built expectations. Technical queue order: rating → weight → area priority → file
// order. Not Tested coverage: area priority → weight → file order, every topic eligible
// (plan-date gating is off): C6 · P1 P2 P3 P5 P6 P8 P4 P7 · E1 E2 E3 · K1 …
// The walkthrough (E2, the only walkthrough card) is picked first and goes after the
// technical slots; the two behavioral slots close the shift. Interview queue (normal order:
// rating → weight → plan day): I3 (Needs Improvement) · I4 d3 · I5 d4 · I6 d4 · I1 · I2 ·
// I7 d5 · I10 · I11 d9 · I9 d5 · I8 d9 (Support). Slot A = the first with a story that has
// follow-ups (I4); slot B = a drill ladder or a backup story (I8).
const TECH_CASES = [
  {
    name: '6+ redos (P1 P2 Not Ready, six Needs Improvement)',
    topics: () => withRatings({ P1: { rating: 'Not Ready', points: 10 }, P2: { rating: 'Not Ready', points: 10 } }),
    redo: ['P1', 'P2', 'C1', 'C2', 'C4', 'C7'],
    coverage: ['C6', 'P3', 'P5', 'P6', 'P8', 'P4'],
  },
  {
    name: '3 redos (C4 C7 S2 moved up to Minor Refresh)',
    topics: () => withRatings({ C4: { rating: 'Minor Refresh', points: 75, streak: 1 }, C7: { rating: 'Minor Refresh', points: 75, streak: 1 }, S2: { rating: 'Minor Refresh', points: 75, streak: 1 } }),
    redo: ['C1', 'C2', 'S3'],
    coverage: ['C6', 'P1', 'P2', 'P3', 'P5', 'P6', 'P8', 'P4', 'P7'],
  },
  {
    name: '0 redos, one stale Locked In topic (K1, tested 4 days ago)',
    topics: () =>
      withRatings({
        ...Object.fromEntries(['C1', 'C2', 'C4', 'C7', 'S2', 'S3', 'I3'].map((id) => [id, { rating: 'Minor Refresh', points: 75, streak: 1 }])),
        K1: { rating: 'Locked In', points: 100, streak: 2, tests: 2, last_tested: '2026-11-01' },
      }),
    redo: [],
    coverage: ['C6', 'P1', 'P2', 'P3', 'P5', 'P6', 'P8', 'P4', 'P7', 'E1', 'E3'],
    spot: ['K1'],
  },
];

for (const c of TECH_CASES) {
  test(`technical shift, ${c.name}`, () => {
    const topics = c.topics();
    const shift = buildShift({ topics, cards: roundBank(topics), history: [], today: TODAY, settings: technical });
    assert.equal(shift.mode, 'normal');
    assert.equal(shift.size, 15);
    assert.equal(shift.slots.length, 15);
    assert.deepEqual(slotsOf(shift, 'redo'), c.redo);
    assert.deepEqual(slotsOf(shift, 'coverage'), c.coverage);
    assert.deepEqual(slotsOf(shift, 'spot'), c.spot || []);
    assert.deepEqual(slotsOf(shift, 'walkthrough'), ['E2']);
    assert.deepEqual(slotsOf(shift, 'story'), ['I4']);
    assert.deepEqual(slotsOf(shift, 'drill'), ['I8']);
    // Order in the shift: redos, coverage (spot check last), walkthrough, then the two behavioral.
    assert.deepEqual(shift.slots.map((s) => s.slot), [...c.redo.map(() => 'redo'), ...c.coverage.map(() => 'coverage'), ...(c.spot || []).map(() => 'spot'), 'walkthrough', 'story', 'drill']);
    assert.equal(shift.slots.find((s) => s.slot === 'walkthrough').cardId, 'E2-scn-02');
    assert.equal(shift.slots.find((s) => s.slot === 'story').cardId, 'I4-sty-03');
    // Technical slots take the scenario first (the synthetic bank has no defect / matrix
    // cards), so every card in this shift is said out loud.
    assert.equal(shift.outLoud, 15);
    assert.ok(shift.slots.every((s) => topics.find((t) => t.id === s.topicId).area !== 'Interview' || ['story', 'drill'].includes(s.slot)));
  });
}

const BEH_CASES = [
  { name: '6+ redos', topics: TECH_CASES[0].topics, redo: ['P1', 'P2', 'C1'], coverage: ['C6', 'P3', 'P5'] },
  { name: '3 redos', topics: TECH_CASES[1].topics, redo: ['C1', 'C2', 'S3'], coverage: ['C6', 'P1', 'P2'] },
  { name: '0 redos', topics: TECH_CASES[2].topics, redo: [], coverage: ['C6', 'P1', 'P2', 'P3', 'P5'], spot: ['K1'] },
];

for (const c of BEH_CASES) {
  test(`behavioral shift, ${c.name}: 8 interview, 6 technical maintenance, 1 walkthrough`, () => {
    const topics = c.topics();
    const shift = buildShift({ topics, cards: roundBank(topics), history: [], today: TODAY, settings: behavioral });
    assert.equal(shift.slots.length, 15);
    const interview = shift.slots.filter((s) => s.slot === 'interview');
    assert.equal(interview.length, 8);
    // Interview queue in the normal order; I3 is at Minor Refresh in the 0-redo case, so it sorts after the Not Tested ones.
    const expected = c.redo.length === 0 ? ['I4', 'I5', 'I6', 'I1', 'I2', 'I7', 'I10', 'I11'] : ['I3', 'I4', 'I5', 'I6', 'I1', 'I2', 'I7', 'I10'];
    assert.deepEqual(ids(interview), expected);
    assert.equal(interview.find((s) => s.topicId === 'I4').cardId, 'I4-sty-03', 'a story with follow-ups first');
    assert.deepEqual(slotsOf(shift, 'redo'), c.redo);
    assert.deepEqual(slotsOf(shift, 'coverage'), c.coverage);
    assert.deepEqual(slotsOf(shift, 'spot'), c.spot || []);
    assert.equal(c.redo.length + c.coverage.length + (c.spot || []).length, 6);
    assert.deepEqual(slotsOf(shift, 'walkthrough'), ['E2']);
    assert.deepEqual(shift.slots.map((s) => s.slot).slice(0, 8), Array(8).fill('interview'));
    assert.equal(shift.slots[14].slot, 'walkthrough');
  });
}

test('no walkthrough card in the bank: the walkthrough slot takes a scenario on a topic below Locked In', () => {
  const topics = shippedTopics();
  const shift = buildShift({ topics, cards: syntheticBank(topics), today: TODAY, settings: technical });
  const w = shift.slots.find((s) => s.slot === 'walkthrough');
  assert.equal(w.type, 'scenario');
  assert.notEqual(topics.find((t) => t.id === w.topicId).rating, 'Locked In');
  // No story has follow-ups: slot A falls back to any story, slot B to a backup (I8).
  assert.equal(shift.slots.find((s) => s.slot === 'story').type, 'story');
  assert.equal(shift.slots.find((s) => s.slot === 'drill').topicId, 'I8');
});

test('walkthroughs rotate and prefer topics below Locked In', () => {
  const topics = shippedTopics().map((t) => (t.id === 'P5' ? { ...t, rating: 'Locked In', points: 100, streak: 2, tests: 2, last_tested: '2026-11-04', next_review: '2026-11-08' } : t));
  const cards = [
    ...syntheticBank(topics),
    { id: 'P5-scn-02', topicId: 'P5', type: 'scenario', walkthrough: true, par: 120 },
    { id: 'K2-scn-02', topicId: 'K2', type: 'scenario', walkthrough: true, par: 120 },
    { id: 'E2-scn-02', topicId: 'E2', type: 'scenario', walkthrough: true, par: 120 },
  ];
  const pick = (history) => buildShift({ topics, cards, history, today: TODAY, settings: technical }).slots.find((s) => s.slot === 'walkthrough').cardId;
  // P5 is Locked In → skipped while others are below it; K2 before E2 in bank order.
  assert.equal(pick([]), 'K2-scn-02');
  // K2's walkthrough was done two days ago → E2's has never been seen, so it rotates in.
  assert.equal(pick([{ topicId: 'K2', cardId: 'K2-scn-02', type: 'scenario', result: 'clean', date: '2026-11-03' }]), 'E2-scn-02');
});

test('card choice in a technical topic: scenario with follow-ups → defect → order → matrix → number; walkthroughs only in their slot', () => {
  const fu = { followUps: [{ id: 'f', kind: 'why-not', prompt: 'p', beats: ['b'], par: 45 }] };
  const cards = [
    { id: 'X1-num-01', topicId: 'X1', type: 'number' },
    { id: 'X1-num-02', topicId: 'X1', type: 'number' },
    { id: 'X1-mat-01', topicId: 'X1', type: 'matrix' },
    { id: 'X1-ord-01', topicId: 'X1', type: 'order' },
    { id: 'X1-def-01', topicId: 'X1', type: 'defect' },
    { id: 'X1-scn-01', topicId: 'X1', type: 'scenario', answer: {} },
    { id: 'X1-scn-02', topicId: 'X1', type: 'scenario', answer: fu },
    { id: 'X1-scn-03', topicId: 'X1', type: 'scenario', walkthrough: true, answer: fu },
  ];
  assert.deepEqual(['X1-scn-02', 'X1-scn-01', 'X1-def-01', 'X1-ord-01', 'X1-mat-01', 'X1-num-01', 'X1-scn-03'].map((id) => technicalRank(cards.find((c) => c.id === id))), [0, 1, 2, 3, 4, 5, 6]);
  const byTopic = cardsByTopic(cards);
  const pick = (history) => pickCard('X1', { byTopic, history, today: TODAY }, { order: 'technical' }).id;
  assert.equal(pick([]), 'X1-scn-02');
  // Not the same card two shifts running when the topic has others.
  const y = (cardId, type, res, extra = {}) => ({ topicId: 'X1', cardId, type, result: res, framework: true, date: '2026-11-04', ...extra });
  assert.equal(pick([y('X1-scn-02', 'scenario', 'clean')]), 'X1-scn-01');
  assert.equal(pick([y('X1-scn-02', 'scenario', 'clean'), y('X1-scn-01', 'scenario', 'clean')]), 'X1-def-01');
  // The last miss was a number or a code section → a Cold Number card.
  assert.equal(pick([y('X1-scn-02', 'scenario', 'slipped', { note: 'slipped: no code section' })]), 'X1-num-01');
  assert.equal(pick([y('X1-num-01', 'number', 'missed', { note: 'missed: psi, hours' })]), 'X1-num-02');
  assert.equal(pick([y('X1-scn-02', 'scenario', 'missed', { note: 'missed: 2 beats missed' })]), 'X1-scn-01');
  // Only the most recent miss counts.
  const older = { topicId: 'X1', cardId: 'X1-num-01', type: 'number', result: 'missed', framework: true, note: 'missed: psi', date: '2026-11-01' };
  assert.equal(pick([older, y('X1-def-01', 'defect', 'missed', { framework: false, note: 'missed the planted defect' })]), 'X1-scn-02');
});

test('plan-date gating is off: a Not Tested topic is eligible from day one', () => {
  const t = [topic({ id: 'N1', plan_date: '2026-12-01', next_review: '2026-12-02' })];
  assert.deepEqual(ids(dueQueue(t, TODAY)), ['N1']);
  assert.equal(isDue(t[0], TODAY), true);
});

test('a review date past the cap comes due on the cap (date − 1)', () => {
  const t = topic({ id: 'M1', rating: 'Minor Refresh', tests: 1, streak: 1, last_tested: '2026-11-03', next_review: '2026-11-14' });
  assert.equal(isDue(t, '2026-11-10', '2026-11-11'), false);
  assert.equal(isDue(t, '2026-11-11', '2026-11-11'), true);
  assert.equal(isDue(t, '2026-11-11'), false);
});

test('sweep day (date − 1), technical focus: every technical topic not Locked In, up to 20; misses come back', () => {
  const topics = shippedTopics();
  const cards = syntheticBank(topics);
  const settings = { nextRound: { label: 'Round 2', focus: 'technical', date: '2026-11-12' } };
  const shift = buildShift({ topics, cards, today: '2026-11-11', settings });
  assert.equal(shift.mode, 'sweep');
  assert.equal(shift.slots.length, 20);
  assert.deepEqual(ids(shift.slots), ['C1', 'C2', 'C4', 'C7', 'S2', 'S3', 'P1', 'P2', 'P3', 'P5', 'P6', 'P8', 'E1', 'E2', 'K1', 'K2', 'K3', 'G1', 'G2', 'G5']);
  assert.ok(shift.slots.every((s) => s.slot === 'sweep'));

  let state = createState(topics);
  const card = cards.find((c) => c.id === shift.slots[0].cardId);
  ({ state } = recordResult(state, { card, grade: { result: 'missed', framework: true, note: 'missed' }, date: '2026-11-11', cards }));
  const next = afterResult(shift, 0, { topics: state.topics, cards, history: state.history, today: '2026-11-11' });
  assert.equal(next.slots.length, 21);
  assert.equal(next.slots[20].topicId, 'C1');
  assert.equal(next.slots[20].slot, 'redo');
  assert.notEqual(next.slots[20].cardId, card.id);
});

test('sweep day, behavioral focus: every topic not Locked In, Interview included, in the normal order', () => {
  const topics = shippedTopics();
  const settings = { nextRound: { label: 'Round 3', focus: 'behavioral', date: '2026-11-12' } };
  const shift = buildShift({ topics, cards: syntheticBank(topics), today: '2026-11-11', settings });
  assert.equal(shift.slots.length, 20);
  assert.deepEqual(ids(shift.slots).slice(0, 8), ['C1', 'C2', 'C4', 'C7', 'S2', 'S3', 'I3', 'S6']);
});

function storyBank(topics) {
  const hook = (q) => ({ beats: [{ label: 'Hook', kind: 'hook', quote: q }, { label: 'Lesson', kind: 'lesson', quote: 'l' }] });
  return syntheticBank(topics)
    .map((c) => (c.id === 'I3-sty-01' ? { ...c, prompt: 'Story 1 — three occupied towers', answer: hook('Three towers…') } : c))
    .map((c) => (c.id === 'I5-sty-01' ? { ...c, prompt: 'Story 3 — ground faults', answer: hook('Once more than about seven…') } : c))
    .concat([{ id: 'E2-scn-02', topicId: 'E2', type: 'scenario', walkthrough: true, par: 120 }]);
}

test('day-of, technical focus: six quick cards from Locked In technical topics, then a 90 s walkthrough warm-up', () => {
  const topics = shippedTopics().map((t, i) => (i < 8 || t.area === 'Interview' ? { ...t, rating: 'Locked In', points: 100, streak: 2 } : t));
  const cards = storyBank(topics);
  const settings = { nextRound: { label: 'Round 2', focus: 'technical', date: '2026-11-12' } };
  const shift = buildShift({ topics, cards, today: '2026-11-12', settings });
  assert.equal(shift.mode, 'dayof');
  assert.deepEqual(ids(shift.slots), ['C1', 'C2', 'C3', 'C4', 'C5', 'C7', 'E2']);
  assert.ok(shift.slots.slice(0, 6).every((s) => s.slot === 'confidence' && ['number', 'order', 'defect', 'matrix'].includes(s.type)));
  assert.deepEqual(shift.slots[6], { topicId: 'E2', cardId: 'E2-scn-02', type: 'scenario', slot: 'warmup', par: 90, chain: false, done: false });
  assert.deepEqual(dayOfPlan({ topics, cards, today: '2026-11-12', focus: 'technical' }).slots.length, 7);
});

test('day-of, behavioral focus: six Locked In cards, the 60-second intro, then the hook lines of Story 1 and Story 3', () => {
  const topics = shippedTopics().map((t, i) => (i < 8 ? { ...t, rating: 'Locked In', points: 100, streak: 2 } : t));
  const cards = storyBank(topics);
  const settings = { nextRound: { label: 'Round 3', focus: 'behavioral', date: '2026-11-12' } };
  const shift = buildShift({ topics, cards, today: '2026-11-12', settings });
  assert.deepEqual(shift.slots.map((s) => [s.topicId, s.slot]), [
    ['C1', 'confidence'], ['C2', 'confidence'], ['C3', 'confidence'], ['C4', 'confidence'], ['C5', 'confidence'], ['C7', 'confidence'],
    ['I1', 'intro'], ['I3', 'hook'], ['I5', 'hook'],
  ]);
  assert.equal(shift.slots[7].cardId, 'I3-sty-01');
  assert.equal(shift.slots[8].cardId, 'I5-sty-01');
});

test('after the date: no shift (the app asks for the next round)', () => {
  const topics = shippedTopics();
  const settings = { nextRound: { label: 'Round 2', focus: 'technical', date: '2026-11-12' } };
  const shift = buildShift({ topics, cards: syntheticBank(topics), today: '2026-11-13', settings });
  assert.equal(shift.mode, 'after');
  assert.deepEqual(shift.slots, []);
});

test('the estimate counts each follow-up layer', () => {
  const topics = [topic({ id: 'X1' })];
  const plain = [{ id: 'X1-scn-01', topicId: 'X1', type: 'scenario', par: 90, answer: {} }];
  const chain = [{ id: 'X1-scn-01', topicId: 'X1', type: 'scenario', par: 90, answer: { followUps: [{ id: 'a', par: 45 }, { id: 'b', par: 45 }] } }];
  const settings = { ...technical, cardsPerShift: 5 };
  // 90 + 15 = 105 s → 2 min; with two layers + 2 × (45 + 15) = 225 s → 4 min.
  assert.equal(buildShift({ topics, cards: plain, today: TODAY, settings }).estimatedMinutes, 2);
  assert.equal(buildShift({ topics, cards: chain, today: TODAY, settings }).estimatedMinutes, 4);
});

test('a clean first card brings a follow-up card on the same topic and the shift grows by one (nothing displaced)', () => {
  const topics = shippedTopics();
  const cards = roundBank(topics);
  const shift = buildShift({ topics, cards, today: TODAY, settings: technical });
  let state = createState(topics);
  const first = cards.find((c) => c.id === shift.slots[0].cardId);
  assert.equal(first.id, 'C1-scn-01');
  ({ state } = recordResult(state, { card: first, grade: { result: 'clean', framework: true, note: 'clean' }, date: TODAY, cards }));
  const next = afterResult(shift, 0, { topics: state.topics, cards, history: state.history, today: TODAY });

  assert.equal(next.slots.length, 16, 'the follow-up extends the shift');
  assert.equal(next.size, 15, 'the planned size is unchanged');
  assert.equal(next.slots[1].topicId, 'C1');
  assert.equal(next.slots[1].slot, 'followup');
  assert.equal(next.slots[1].cardId, 'C1-num-01'); // a different card, preferring a different type
  assert.deepEqual(ids(next.slots).filter((id, i) => i !== 1), ids(shift.slots), 'every planned card is still there, in order');

  const second = cards.find((c) => c.id === 'C1-num-01');
  ({ state } = recordResult(state, { card: second, grade: { result: 'clean', framework: true, note: 'clean' }, date: TODAY, cards }));
  const after2 = afterResult(next, 1, { topics: state.topics, cards, history: state.history, today: TODAY });
  assert.equal(after2.slots.length, 16);
  const c1 = state.topics.find((t) => t.id === 'C1');
  assert.equal(c1.rating, 'Minor Refresh');
  assert.equal(c1.streak, 1);
  assert.equal(c1.next_review, '2026-11-07');
});

test('a missed first card brings no follow-up card', () => {
  const topics = shippedTopics();
  const cards = roundBank(topics);
  const shift = buildShift({ topics, cards, today: TODAY, settings: technical });
  let state = createState(topics);
  const first = cards.find((c) => c.id === shift.slots[0].cardId);
  ({ state } = recordResult(state, { card: first, grade: { result: 'missed', framework: false, note: 'missed' }, date: TODAY, cards }));
  const next = afterResult(shift, 0, { topics: state.topics, cards, history: state.history, today: TODAY });
  assert.deepEqual(ids(next.slots), ids(shift.slots));
  assert.equal(state.topics.find((t) => t.id === 'C1').rating, 'Not Ready');
});

test('Light topics need no follow-up card', () => {
  const topics = [topic({ id: 'L1', weight: 'Light' })];
  const cards = syntheticBank(topics);
  const shift = buildShift({ topics, cards, today: TODAY, settings: technical });
  let state = createState(topics);
  const card = cards.find((c) => c.id === shift.slots[0].cardId);
  ({ state } = recordResult(state, { card, grade: { result: 'clean', framework: true, note: 'clean' }, date: TODAY, cards }));
  const next = afterResult(shift, 0, { topics: state.topics, cards, history: state.history, today: TODAY });
  assert.equal(next.slots.length, shift.slots.length);
  assert.equal(state.topics[0].streak, 1);
});

test('default card picking (drills, follow-up cards): not the same card two sessions running, prefer the type missed last time', () => {
  const cards = [
    { id: 'X1-num-01', topicId: 'X1', type: 'number' },
    { id: 'X1-num-02', topicId: 'X1', type: 'number' },
    { id: 'X1-ord-01', topicId: 'X1', type: 'order' },
    { id: 'X1-ord-02', topicId: 'X1', type: 'order' },
    { id: 'X1-scn-01', topicId: 'X1', type: 'scenario' },
  ];
  const byTopic = cardsByTopic(cards);
  const yesterday = [
    { topicId: 'X1', cardId: 'X1-num-01', type: 'number', result: 'clean', date: '2026-10-23' },
    { topicId: 'X1', cardId: 'X1-ord-01', type: 'order', result: 'missed', framework: true, date: '2026-10-23' },
  ];
  assert.equal(pickCard('X1', { byTopic, history: yesterday, today: '2026-10-24' }).id, 'X1-ord-02');
  assert.equal(pickCard('X1', { byTopic, history: [], today: '2026-10-24' }).id, 'X1-num-01');
  assert.equal(pickCard('X1', { byTopic, history: [], today: '2026-10-24' }, { slot: 'outloud' }).id, 'X1-scn-01');
  const one = cardsByTopic([cards[0]]);
  assert.equal(pickCard('X1', { byTopic: one, history: yesterday, today: '2026-10-24' }).id, 'X1-num-01');
});

test('Keep going: in technical focus the next five due technical topics not yet in today’s shift', () => {
  const topics = shippedTopics();
  const cards = roundBank(topics);
  const shift = buildShift({ topics, cards, today: TODAY, settings: technical });
  const more = keepGoing({ topics, cards, history: [], today: TODAY, settings: technical, exclude: ids(shift.slots) });
  // The shift took E2 (walkthrough), the six Needs Improvement redos, and C6 P1 P2 P3 P5 P6
  // as coverage. Keep going follows the technical due queue (rating → weight → area
  // priority): the Core Not Tested topics the shift did not reach.
  assert.deepEqual(ids(shift.slots), ['C1', 'C2', 'C4', 'C7', 'S2', 'S3', 'C6', 'P1', 'P2', 'P3', 'P5', 'P6', 'E2', 'I4', 'I8']);
  assert.deepEqual(ids(more.slots), ['P8', 'E1', 'K1', 'K2', 'K3']);
  assert.ok(more.slots.every((s) => s.type === 'scenario'));
  const none = keepGoing({ topics, cards, history: [], today: TODAY, settings: technical, exclude: topics.map((t) => t.id) });
  assert.equal(none.slots.length, 0);
});

test('Drill this: every card of the topic', () => {
  const topics = shippedTopics();
  const cards = syntheticBank(topics);
  const d = drillPlan({ topicId: 'P2', cards, today: TODAY, topics });
  assert.deepEqual(d.slots.map((s) => s.cardId).sort(), ['P2-num-01', 'P2-num-02', 'P2-ord-01', 'P2-scn-01']);
});

test('Blitz deck: number cards from Locked In and Minor Refresh topics only', () => {
  const topics = shippedTopics();
  const deck = blitzDeck({ topics, cards: syntheticBank(topics) });
  assert.deepEqual([...new Set(deck.map((c) => c.topicId))].sort(), ['C3', 'C5', 'S4']);
});
