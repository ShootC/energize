import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createState, recordResult, completeShift, currentDayStreak, save, load, clear, exportState, exportTopics, importJson,
  validateTopics, STORAGE_KEY, setBlitzScore,
} from '../src/engine/state.js';
import { gradeCard } from '../src/engine/grader.js';
import { readiness } from '../src/engine/rating.js';
import { shippedTopics, sampleCards, MemoryStorage, readText } from './helpers.js';

const cards = sampleCards();
const byId = Object.fromEntries(cards.map((c) => [c.id, c]));

test('createState imports topics.json as the starting state', () => {
  const s = createState(shippedTopics());
  assert.equal(s.topics.length, 65);
  assert.deepEqual(s.topics, shippedTopics());
  assert.deepEqual(s.history, []);
  assert.equal(s.xp, 0);
  assert.deepEqual(s.energized, []);
  assert.deepEqual(s.settings, { cardsPerShift: null, sound: true, haptics: true, nextRound: { label: 'Round 2', focus: 'technical', date: null }, interrupt: null });
});

// tests/fixtures/state-v1.0.json was exported by the v1.0 engine (before the round-2
// changes): P2 Locked In over two days, a C1 miss, two completed shifts, Blitz best 7,
// 10-card shifts, sound off. It has no nextRound setting.
const V1 = readText('tests/fixtures/state-v1.0.json');

function assertV1Intact(state) {
  const v1 = JSON.parse(V1);
  assert.deepEqual(state.topics, v1.topics, 'ratings untouched');
  assert.deepEqual(state.history, v1.history, 'history untouched');
  assert.equal(state.xp, 161);
  assert.equal(state.dayStreak, 2);
  assert.equal(state.lastShiftDate, '2026-10-25');
  assert.equal(state.blitzBest, 7);
  assert.deepEqual(state.energized, v1.energized);
  assert.deepEqual(state.snapshots, v1.snapshots);
  assert.equal(state.topics.find((t) => t.id === 'P2').rating, 'Locked In');
  assert.equal(state.settings.cardsPerShift, 10);
  assert.equal(state.settings.sound, false);
  assert.deepEqual(state.settings.nextRound, { label: 'Round 2', focus: 'technical', date: null });
  assert.equal(state.settings.interrupt, null);
}

test('a v1.0 state.json imports with the round-2 defaults: no rating reset, history, XP and streaks intact', () => {
  const { state, kind } = importJson(createState(shippedTopics()), V1);
  assert.equal(kind, 'state');
  assertV1Intact(state);
  // The export shape is unchanged: topic records are exactly the topics.json shape.
  assert.deepEqual(JSON.parse(exportTopics(state)), JSON.parse(V1).topics);
  assert.deepEqual(Object.keys(JSON.parse(exportState(state))), Object.keys(JSON.parse(V1)));
});

test('a v1.0 save in localStorage loads with the round-2 defaults (a stale shift is kept, not replayed)', () => {
  const storage = new MemoryStorage();
  const saved = { ...JSON.parse(V1), currentShift: { date: '2026-10-25', mode: 'normal', kind: 'daily', size: 10, slots: [{ topicId: 'C1', cardId: 'C1-num-01', type: 'number', slot: 'redo', done: false }] }, createdOn: '2026-10-24' };
  storage.setItem(STORAGE_KEY, JSON.stringify(saved));
  const state = load(storage);
  assertV1Intact(state);
  assert.equal(state.currentShift.date, '2026-10-25');
  // A partial nextRound (e.g. from a hand-edited backup) is completed with the defaults.
  storage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, settings: { ...saved.settings, nextRound: { date: '2026-11-12' } } }));
  assert.deepEqual(load(storage).settings.nextRound, { label: 'Round 2', focus: 'technical', date: '2026-11-12' });
});

test('recordResult caps the review date at the next round’s date − 1, and keeps every follow-up layer', () => {
  let s = createState(shippedTopics());
  s.settings.nextRound = { label: 'Round 2', focus: 'technical', date: '2026-11-12' };
  const card = byId['P2-num-01'];
  s = recordResult(s, { card, grade: gradeCard(card, { fields: ['40', '24', '1.5'], codeRef: '29.2.2' }), date: '2026-11-10', cards }).state;
  assert.equal(s.topics.find((t) => t.id === 'P2').next_review, '2026-11-11');
  const chain = cards.find((c) => (c.answer.followUps || []).length && !c.walkthrough);
  const a = chain.answer;
  const grade = gradeCard(chain, { hits: a.beats.map(() => true), saidNumber: true, saidCode: true, followUps: a.followUps.map((f) => ({ hits: f.beats.map(() => true) })) });
  s = recordResult(s, { card: chain, grade, seconds: 80, date: '2026-11-10', cards }).state;
  const last = s.history[s.history.length - 1];
  assert.equal(last.result, 'clean');
  assert.deepEqual(last.layers.map((l) => l.id), ['main', ...a.followUps.map((f) => f.id)]);
  assert.ok(last.layers.every((l) => l.result === 'clean'));
});

test('recordResult logs the card and updates the topic, readiness and XP', () => {
  let s = createState(shippedTopics());
  const card = byId['P2-num-01'];
  const grade = gradeCard(card, { fields: ['40', '24', '1.5'], codeRef: '' });
  const r = recordResult(s, { card, grade, seconds: 20, date: '2026-10-24', cards });
  s = r.state;
  assert.deepEqual(
    { ...s.history[0] },
    { topicId: 'P2', cardId: 'P2-num-01', type: 'number', result: 'slipped', framework: true, note: 'slipped: code section', seconds: 20, date: '2026-10-24', mode: 'shift', rated: true, codeUnprompted: false, xp: 10 },
  );
  assert.equal(s.xp, 10); // slipped 5 + under par 5
  const p2 = s.topics.find((t) => t.id === 'P2');
  assert.equal(p2.rating, 'Minor Refresh');
  assert.equal(p2.points, 75);
  assert.equal(p2.tests, 1);
  assert.equal(p2.next_review, '2026-10-26');
  assert.equal(r.topicBefore.rating, 'Not Tested');
  // P2 is Core (×3): +3 × 75 = 225 → (1515 + 225) / 16600, and now 11 tested.
  const rd = readiness(s.topics);
  assert.equal(rd.earned, 1740);
  assert.equal(rd.tested, 11);
});

test('one card in the bank for a topic is enough for a clean session (sample deck)', () => {
  const s0 = createState(shippedTopics());
  const card = byId['P2-num-01'];
  const { state } = recordResult(s0, { card, grade: gradeCard(card, { fields: ['40', '24', '1.5'], codeRef: '29.2.2' }), seconds: 30, date: '2026-10-24', cards });
  const p2 = state.topics.find((t) => t.id === 'P2');
  assert.equal(p2.streak, 1);
  assert.equal(p2.rating, 'Minor Refresh');
});

test('results through a day re-apply from the morning snapshot, so later cards can only pull a topic down', () => {
  let s = createState(shippedTopics());
  const card = byId['S3-num-01'];
  s = recordResult(s, { card, grade: gradeCard(card, { fields: ['90', '100', '5', '2'], codeRef: '7.7' }), date: '2026-10-24', cards }).state;
  assert.equal(s.topics.find((t) => t.id === 'S3').rating, 'Minor Refresh');
  s = recordResult(s, { card, grade: gradeCard(card, { fields: ['60', '100', '5', '2'], codeRef: '' }), date: '2026-10-24', cards }).state;
  const s3 = s.topics.find((t) => t.id === 'S3');
  assert.equal(s3.rating, 'Needs Improvement');
  assert.equal(s3.tests, 3); // was 2 in topics.json; one session today
  assert.equal(s.snapshots.S3.record.tests, 2);
});

test('unrated results (Blitz, interview day) never touch ratings', () => {
  const s0 = createState(shippedTopics());
  const card = byId['P2-num-01'];
  const { state } = recordResult(s0, { card, grade: gradeCard(card, { fields: ['1', '1', '1'] }), date: '2026-11-02', rated: false, mode: 'interview', cards });
  assert.deepEqual(state.topics, s0.topics);
  assert.equal(state.history.length, 1);
});

test('day streak: consecutive completed shifts; +50 XP once per day; breaks never touch ratings', () => {
  let s = createState(shippedTopics());
  s = completeShift(s, '2026-10-24');
  s = completeShift(s, '2026-10-24');
  assert.equal(s.xp, 50);
  assert.equal(s.dayStreak, 1);
  s = completeShift(s, '2026-10-25');
  assert.equal(s.dayStreak, 2);
  assert.equal(currentDayStreak(s, '2026-10-26'), 2);
  assert.equal(currentDayStreak(s, '2026-10-27'), 0);
  s = completeShift(s, '2026-10-28');
  assert.equal(s.dayStreak, 1);
  assert.deepEqual(s.topics, shippedTopics());
  assert.equal(setBlitzScore(setBlitzScore(s, 12), 7).blitzBest, 12);
});

test('save / load round-trips through storage; garbage loads as null', () => {
  const storage = new MemoryStorage();
  assert.equal(load(storage), null);
  let s = createState(shippedTopics());
  const card = byId['C3-def-01'];
  s = recordResult(s, { card, grade: gradeCard(card, { index: 5 }), date: '2026-10-25', cards }).state;
  save(storage, s);
  assert.deepEqual(load(storage), s);
  storage.setItem(STORAGE_KEY, '{not json');
  assert.equal(load(storage), null);
  clear(storage);
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test('export / import JSON round-trips', () => {
  let s = createState(shippedTopics());
  for (const [id, resp] of [['P2-num-01', { fields: ['40', '24', '1.5'], codeRef: '29.2.2' }], ['C1-ord-01', { order: [1, 0, 2, 3, 4] }]]) {
    s = recordResult(s, { card: byId[id], grade: gradeCard(byId[id], resp), seconds: 12, date: '2026-10-24', cards }).state;
  }
  s = completeShift(s, '2026-10-24');
  const text = exportState(s);
  const back = importJson(createState(shippedTopics()), text);
  assert.equal(back.kind, 'state');
  assert.equal(exportState(back.state), text);
  assert.deepEqual(back.state.topics, s.topics);
  assert.deepEqual(back.state.history, s.history);
  assert.equal(back.state.xp, s.xp);
});

test('exportTopics is exactly the topics.json shape, and importing it carries ratings over', () => {
  let s = createState(shippedTopics());
  s = recordResult(s, { card: byId['P2-num-01'], grade: gradeCard(byId['P2-num-01'], { fields: ['40', '24', '1.5'], codeRef: '29.2.2' }), date: '2026-10-24', cards }).state;
  const arr = JSON.parse(exportTopics(s));
  assert.equal(arr.length, 65);
  assert.deepEqual(Object.keys(arr[0]), Object.keys(shippedTopics()[0]));
  assert.equal(validateTopics(arr).length, 0);

  const fresh = createState(shippedTopics());
  const { state, kind } = importJson(fresh, JSON.stringify(arr));
  assert.equal(kind, 'topics');
  assert.equal(state.topics.find((t) => t.id === 'P2').rating, 'Minor Refresh');
});

test('import rejects bad input with a readable message', () => {
  const s = createState(shippedTopics());
  assert.throws(() => importJson(s, '{oops'), /Not valid JSON/);
  assert.throws(() => importJson(s, '[{"id":"C1"}]'), /missing area/);
  assert.throws(() => importJson(s, '{"hello":1}'), /Expected a topics.json array/);
  const bad = shippedTopics();
  bad[0].rating = 'Great';
  assert.throws(() => importJson(s, JSON.stringify(bad)), /unknown rating/);
});
