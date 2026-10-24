import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createState, recordResult, completeShift, currentDayStreak, save, load, clear, exportState, exportTopics, importJson,
  validateTopics, STORAGE_KEY, setBlitzScore,
} from '../src/engine/state.js';
import { gradeCard } from '../src/engine/grader.js';
import { readiness } from '../src/engine/rating.js';
import { shippedTopics, sampleCards, MemoryStorage } from './helpers.js';

const cards = sampleCards();
const byId = Object.fromEntries(cards.map((c) => [c.id, c]));

test('createState imports topics.json as the starting state', () => {
  const s = createState(shippedTopics());
  assert.equal(s.topics.length, 65);
  assert.deepEqual(s.topics, shippedTopics());
  assert.deepEqual(s.history, []);
  assert.equal(s.xp, 0);
  assert.deepEqual(s.energized, []);
  assert.deepEqual(s.settings, { cardsPerShift: null, sound: true, haptics: true });
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
