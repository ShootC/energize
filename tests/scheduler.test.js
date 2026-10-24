import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dayMode, dueQueue, buildShift, afterResult, keepGoing, drillPlan, interviewDayPlan, pickCard, cardsByTopic,
  shiftComposition, daysToInterview, blitzDeck, isDue,
} from '../src/engine/scheduler.js';
import { createState, recordResult } from '../src/engine/state.js';
import { shippedTopics, syntheticBank, topic } from './helpers.js';

const ids = (xs) => xs.map((x) => x.topicId ?? x.id);

test('special days by date', () => {
  assert.equal(dayMode('2026-10-24'), 'normal');
  assert.equal(dayMode('2026-10-25'), 'normal');
  assert.equal(dayMode('2026-10-26'), 'cutover');
  assert.equal(dayMode('2026-10-30'), 'cutover');
  assert.equal(dayMode('2026-10-31'), 'normal');
  assert.equal(dayMode('2026-11-01'), 'sweep');
  assert.equal(dayMode('2026-11-02'), 'interview');
  assert.equal(dayMode('2026-11-03'), 'after');
  assert.equal(daysToInterview('2026-10-24'), 9);
  assert.equal(daysToInterview('2026-11-05'), 0);
});

test('shift composition: 15 → 6 redos + 8 coverage + 1 out loud; cutover 10 with 2 stories', () => {
  assert.deepEqual(shiftComposition('normal', 15), { size: 15, outLoud: 1, outLoudTypes: ['story', 'scenario'], redoCap: 6 });
  assert.deepEqual(shiftComposition('cutover', 10), { size: 10, outLoud: 2, outLoudTypes: ['story'], redoCap: 4 });
});

// Hand-computed due queue for the morning of Sat Oct 24 from the shipped
// topics.json: next_review ≤ Oct 24; Not Tested skipped if plan_date > Oct 23;
// order rating → weight → plan day → file order.
const QUEUE_OCT24 = [
  // Needs Improvement, all Core
  'C1', 'C2', 'C4', 'C7', 'S2', 'S3', 'I3',
  // Not Tested · Core · day 2, day 3, day 4
  'S6', 'P1', 'P2', 'P3', 'P5', 'P6', 'P8',
  'F1', 'F2', 'F3', 'F8', 'E1', 'E2', 'I4',
  'K1', 'K2', 'K3', 'I5', 'I6',
  // Not Tested · Support · day 1, 2, 3, 4
  'C6', 'S1', 'S7', 'P4', 'P7', 'F4', 'F5', 'F6', 'E3', 'K4',
  // Not Tested · Light
  'S5', 'S8', 'F7', 'F9',
];

test('due queue for Oct 24 matches the hand-built order', () => {
  assert.deepEqual(ids(dueQueue(shippedTopics(), '2026-10-24')), QUEUE_OCT24);
});

test('Not Tested topics studied after yesterday are skipped; Minor Refresh not yet due is not in the queue', () => {
  const q = ids(dueQueue(shippedTopics(), '2026-10-23'));
  // K1 plan date Oct 23 is after yesterday (Oct 22) — skipped (and not due).
  assert.ok(!q.includes('K1'));
  assert.ok(!q.includes('C3')); // Minor Refresh, due Oct 25
  const t = [topic({ id: 'N1', plan_date: '2026-10-24', next_review: '2026-10-24' })];
  assert.deepEqual(dueQueue(t, '2026-10-24'), []);
  assert.deepEqual(ids(dueQueue(t, '2026-10-25')), ['N1']);
});

test('the Oct 24 shift: 6 redos, 8 coverage by plan day, 1 story out loud', () => {
  const topics = shippedTopics();
  const cards = syntheticBank(topics);
  const shift = buildShift({ topics, cards, history: [], today: '2026-10-24' });
  assert.equal(shift.mode, 'normal');
  assert.equal(shift.size, 15);
  assert.equal(shift.slots.length, 15);
  assert.deepEqual(ids(shift.slots), [
    'C1', 'C2', 'C4', 'C7', 'S2', 'S3', // redos (I3 is the 7th — it goes out loud)
    'C6', 'S6', 'P1', 'P2', 'P3', 'P5', 'P6', 'P8', // coverage: Not Tested by plan day (C6 is day 1)
    'I3', // out loud: the due story
  ]);
  assert.deepEqual(shift.slots.map((s) => s.slot), [...Array(6).fill('redo'), ...Array(8).fill('coverage'), 'outloud']);
  // Ordinary slots get auto-graded cards; the out-loud slot gets the story.
  assert.ok(shift.slots.slice(0, 14).every((s) => s.type === 'number'));
  assert.equal(shift.slots[14].cardId, 'I3-sty-01');
  // 14 × (30 + 15) + (30 + 15) s = 675 s → 12 min
  assert.equal(shift.estimatedMinutes, 12);
});

test('fewer than 6 redos → the slots fill with coverage; a stale Locked In topic gets one spot check', () => {
  const topics = [
    topic({ id: 'R1', rating: 'Not Ready', tests: 1, next_review: '2026-10-24' }),
    topic({ id: 'L1', rating: 'Locked In', tests: 3, streak: 2, last_tested: '2026-10-20', next_review: '2026-10-24' }),
    topic({ id: 'L2', rating: 'Locked In', tests: 3, streak: 2, last_tested: '2026-10-22', next_review: '2026-10-26' }),
    topic({ id: 'M1', rating: 'Minor Refresh', tests: 1, streak: 1, last_tested: '2026-10-22', next_review: '2026-10-24' }),
    topic({ id: 'I1', area: 'Interview', next_review: '2026-10-24' }),
    ...Array.from({ length: 10 }, (_, i) => topic({ id: `N${i + 1}`, day: 1 + (i % 3), plan_date: `2026-10-2${i % 3}` })),
  ];
  const cards = syntheticBank(topics);
  const slots = buildShift({ topics, cards, today: '2026-10-24' }).slots;
  assert.deepEqual(slots.filter((s) => s.slot === 'redo').map((s) => s.topicId), ['R1']);
  assert.deepEqual(slots.filter((s) => s.slot === 'outloud').map((s) => s.topicId), ['I1']);
  // Coverage room = 15 − 1 out loud − 1 redo − 1 spot = 12: ten Not Tested by
  // plan day, then the due Minor Refresh, then the spot check (L2 was tested
  // only 2 days ago). Nothing else is due, so the shift runs 14 cards.
  assert.deepEqual(
    slots.filter((s) => s.slot === 'coverage' || s.slot === 'spot').map((s) => s.topicId),
    ['N1', 'N4', 'N7', 'N10', 'N2', 'N5', 'N8', 'N3', 'N6', 'N9', 'M1', 'L1'],
  );
  assert.equal(slots.find((s) => s.topicId === 'L1').slot, 'spot');
  assert.equal(slots.length, 14);
  assert.equal(slots[slots.length - 1].slot, 'outloud');
});

test('with no story due, the top due topic with a scenario takes the out-loud slot', () => {
  const topics = [
    topic({ id: 'R1', rating: 'Not Ready', tests: 1, next_review: '2026-10-24' }),
    topic({ id: 'R2', rating: 'Needs Improvement', tests: 1, next_review: '2026-10-24' }),
  ];
  const slots = buildShift({ topics, cards: syntheticBank(topics), today: '2026-10-24' }).slots;
  assert.deepEqual(slots.map((s) => [s.topicId, s.slot, s.type]), [['R2', 'redo', 'number'], ['R1', 'outloud', 'scenario']]);
});

test('cutover week: 10 cards, 2 of them stories', () => {
  const topics = shippedTopics();
  const cards = syntheticBank(topics);
  const shift = buildShift({ topics, cards, today: '2026-10-26' });
  assert.equal(shift.mode, 'cutover');
  assert.equal(shift.slots.length, 10);
  const out = shift.slots.filter((s) => s.slot === 'outloud');
  assert.equal(out.length, 2);
  assert.ok(out.every((s) => s.type === 'story'));
  assert.equal(shift.slots.filter((s) => s.slot === 'redo').length, 4);
});

test('cards per shift setting overrides the default', () => {
  const topics = shippedTopics();
  const shift = buildShift({ topics, cards: syntheticBank(topics), today: '2026-10-24', settings: { cardsPerShift: 20 } });
  assert.equal(shift.slots.length, 20);
  // Cap scales to 8, but only 6 NI topics are left once I3 goes out loud.
  assert.equal(shift.slots.filter((s) => s.slot === 'redo').length, 6);
});

test('Nov 1 sweep: every topic not Locked In, up to 20 cards, missed cards come back before the end', () => {
  const topics = shippedTopics();
  const cards = syntheticBank(topics);
  const shift = buildShift({ topics, cards, today: '2026-11-01' });
  assert.equal(shift.mode, 'sweep');
  assert.equal(shift.slots.length, 20);
  assert.deepEqual(ids(shift.slots).slice(0, 8), ['C1', 'C2', 'C4', 'C7', 'S2', 'S3', 'I3', 'S6']);

  let state = createState(topics);
  const card = cards.find((c) => c.id === shift.slots[0].cardId);
  ({ state } = recordResult(state, { card, grade: { result: 'missed', framework: true, note: 'missed' }, date: '2026-11-01', cards }));
  const next = afterResult(shift, 0, { topics: state.topics, cards, history: state.history, today: '2026-11-01' });
  assert.equal(next.slots.length, 21);
  assert.equal(next.slots[20].topicId, 'C1');
  assert.equal(next.slots[20].slot, 'redo');
  assert.notEqual(next.slots[20].cardId, card.id); // a different card when there is one
});

test('Nov 2: six confidence cards from Locked In topics plus the 60-second intro; after Nov 2 nothing', () => {
  const topics = shippedTopics().map((t, i) => (i < 8 ? { ...t, rating: 'Locked In', points: 100, streak: 2 } : t));
  const cards = [...syntheticBank(topics)];
  const shift = buildShift({ topics, cards, today: '2026-11-02' });
  assert.equal(shift.mode, 'interview');
  assert.equal(shift.slots.length, 7);
  assert.ok(shift.slots.slice(0, 6).every((s) => s.slot === 'confidence' && topics.find((t) => t.id === s.topicId).rating === 'Locked In'));
  assert.deepEqual(shift.slots[6], { topicId: 'I1', cardId: 'I1-sty-01', type: 'story', slot: 'intro', done: false });
  assert.deepEqual(buildShift({ topics, cards, today: '2026-11-03' }).slots, []);
  assert.equal(interviewDayPlan({ topics, cards, today: '2026-11-02' }).slots.length, 7);
});

test('a clean first card brings a follow-up on the same topic and the shift grows by one (nothing displaced)', () => {
  const topics = shippedTopics();
  const cards = syntheticBank(topics);
  const today = '2026-10-24';
  const shift = buildShift({ topics, cards, today });
  let state = createState(topics);
  const first = cards.find((c) => c.id === shift.slots[0].cardId);
  ({ state } = recordResult(state, { card: first, grade: { result: 'clean', framework: true, note: 'clean' }, date: today, cards }));
  const next = afterResult(shift, 0, { topics: state.topics, cards, history: state.history, today });

  assert.equal(next.slots.length, 16, 'the follow-up extends the shift');
  assert.equal(next.size, 15, 'the planned size is unchanged');
  assert.equal(next.slots[0].done, true);
  assert.equal(next.slots[1].topicId, 'C1');
  assert.equal(next.slots[1].slot, 'followup');
  assert.equal(next.slots[1].cardId, 'C1-ord-01'); // a different card, preferring a different type
  assert.ok(ids(next.slots).includes('P8'), 'the last coverage card is kept');
  assert.deepEqual(ids(next.slots).filter((id, i) => i !== 1), ids(shift.slots), 'every planned card is still there, in order');
  assert.equal(next.slots[15].slot, 'outloud', 'the out-loud card still closes the shift');

  // Second clean card → clean session → no more follow-ups; topic at Minor Refresh streak 1.
  const second = cards.find((c) => c.id === 'C1-ord-01');
  ({ state } = recordResult(state, { card: second, grade: { result: 'clean', framework: true, note: 'clean' }, date: today, cards }));
  const after2 = afterResult(next, 1, { topics: state.topics, cards, history: state.history, today });
  assert.equal(after2.slots.length, 16);
  assert.equal(after2.slots[2].topicId, 'C2');
  const c1 = state.topics.find((t) => t.id === 'C1');
  assert.equal(c1.rating, 'Minor Refresh');
  assert.equal(c1.streak, 1);
  assert.equal(c1.next_review, '2026-10-26');
});

test('a missed first card brings no follow-up (the worst result already decides the topic)', () => {
  const topics = shippedTopics();
  const cards = syntheticBank(topics);
  const today = '2026-10-24';
  const shift = buildShift({ topics, cards, today });
  let state = createState(topics);
  const first = cards.find((c) => c.id === shift.slots[0].cardId);
  ({ state } = recordResult(state, { card: first, grade: { result: 'missed', framework: false, note: 'missed' }, date: today, cards }));
  const next = afterResult(shift, 0, { topics: state.topics, cards, history: state.history, today });
  assert.deepEqual(ids(next.slots), ids(shift.slots));
  assert.equal(state.topics.find((t) => t.id === 'C1').rating, 'Not Ready');
});

test('Light topics need no follow-up', () => {
  const topics = [topic({ id: 'L1', weight: 'Light' })];
  const cards = syntheticBank(topics);
  const shift = buildShift({ topics, cards, today: '2026-10-24' });
  let state = createState(topics);
  const card = cards.find((c) => c.id === shift.slots[0].cardId);
  ({ state } = recordResult(state, { card, grade: { result: 'clean', framework: true, note: 'clean' }, date: '2026-10-24', cards }));
  const next = afterResult(shift, 0, { topics: state.topics, cards, history: state.history, today: '2026-10-24' });
  assert.equal(next.slots.length, shift.slots.length);
  assert.equal(state.topics[0].streak, 1);
});

test('card picking: not the same card two sessions running, prefer the type missed last time', () => {
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
  const pick = pickCard('X1', { byTopic, history: yesterday, today: '2026-10-24' });
  assert.equal(pick.id, 'X1-ord-02');
  // No history: auto-graded before out loud, then bank order.
  assert.equal(pickCard('X1', { byTopic, history: [], today: '2026-10-24' }).id, 'X1-num-01');
  // Out-loud slot only takes story / scenario.
  assert.equal(pickCard('X1', { byTopic, history: [], today: '2026-10-24' }, { slot: 'outloud' }).id, 'X1-scn-01');
  // Only one card, shown last session: still shown (no alternative).
  const one = cardsByTopic([cards[0]]);
  assert.equal(pickCard('X1', { byTopic: one, history: yesterday, today: '2026-10-24' }).id, 'X1-num-01');
  // Least recently seen first among equals.
  const older = [
    { topicId: 'X1', cardId: 'X1-num-01', type: 'number', result: 'clean', date: '2026-10-20' },
    { topicId: 'X1', cardId: 'X1-num-02', type: 'number', result: 'clean', date: '2026-10-21' },
    { topicId: 'X1', cardId: 'X1-ord-01', type: 'order', result: 'clean', date: '2026-10-21' },
    { topicId: 'X1', cardId: 'X1-ord-02', type: 'order', result: 'clean', date: '2026-10-21' },
  ];
  assert.equal(pickCard('X1', { byTopic, history: older, today: '2026-10-24' }).id, 'X1-num-01');
});

test('Keep going: next 5 due topics not yet tested today, until the queue is empty', () => {
  const topics = shippedTopics();
  const cards = syntheticBank(topics);
  const today = '2026-10-24';
  const shift = buildShift({ topics, cards, today });
  const more = keepGoing({ topics, cards, history: [], today, exclude: ids(shift.slots) });
  assert.deepEqual(ids(more.slots), ['F1', 'F2', 'F3', 'F8', 'E1']);
  const none = keepGoing({ topics, cards, history: [], today, exclude: QUEUE_OCT24 });
  assert.equal(none.slots.length, 0);
});

test('Drill this: every card of the topic', () => {
  const topics = shippedTopics();
  const cards = syntheticBank(topics);
  const d = drillPlan({ topicId: 'P2', cards, today: '2026-10-24', topics });
  assert.equal(d.slots.length, 4);
  assert.deepEqual(d.slots.map((s) => s.cardId).sort(), ['P2-num-01', 'P2-num-02', 'P2-ord-01', 'P2-scn-01']);
});

test('Blitz deck: number cards from Locked In and Minor Refresh topics only', () => {
  const topics = shippedTopics();
  const deck = blitzDeck({ topics, cards: syntheticBank(topics) });
  assert.deepEqual([...new Set(deck.map((c) => c.topicId))].sort(), ['C3', 'C5', 'S4']);
});

test('isDue falls back to the morning after plan day when next_review is empty', () => {
  assert.equal(isDue(topic({ next_review: '', plan_date: '2026-10-22' }), '2026-10-23'), true);
  assert.equal(isDue(topic({ next_review: '', plan_date: '2026-10-22' }), '2026-10-22'), false);
});
