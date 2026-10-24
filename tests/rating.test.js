import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  POINTS, INTERVAL_DAYS, WEIGHTS, REVIEW_CAP, applySession, nextReview, readiness, weightedReadiness,
  shiftHeadline, xpForResult, cleanCardsRequired, sessionOutcome, formatPercent,
} from '../src/engine/rating.js';
import { addDays } from '../src/engine/dates.js';
import { shippedTopics, topic, result } from './helpers.js';

const TODAY = '2026-10-24';

test('rating ladder: points and review intervals match procedure-notes', () => {
  assert.deepEqual(POINTS, { 'Locked In': 100, 'Minor Refresh': 75, 'Needs Improvement': 40, 'Not Ready': 10, 'Not Tested': 0 });
  assert.deepEqual(INTERVAL_DAYS, { 'Locked In': 4, 'Minor Refresh': 2, 'Needs Improvement': 1, 'Not Ready': 1 });
  assert.deepEqual(WEIGHTS, { Core: 3, Support: 2, Light: 1 });
  assert.equal(REVIEW_CAP, '2026-11-01');
});

test('a clean session with streak 1 → Minor Refresh, +2 days', () => {
  const t = applySession(topic({ streak: 0 }), [result('a', 'clean'), result('b', 'clean')], TODAY);
  assert.equal(t.streak, 1);
  assert.equal(t.rating, 'Minor Refresh');
  assert.equal(t.points, 75);
  assert.equal(t.next_review, '2026-10-26');
  assert.equal(t.last_result, 'clean');
});

test('a clean session reaching streak 2 → Locked In, +4 days', () => {
  const t = applySession(topic({ rating: 'Minor Refresh', points: 75, tests: 1, streak: 1, last_tested: '2026-10-22' }), [result('a', 'clean'), result('b', 'clean')], TODAY);
  assert.equal(t.streak, 2);
  assert.equal(t.rating, 'Locked In');
  assert.equal(t.points, 100);
  assert.equal(t.next_review, '2026-10-28');
  assert.equal(t.tests, 2);
  assert.equal(t.last_tested, TODAY);
});

test('slipped → Minor Refresh +2, streak resets to 0', () => {
  const t = applySession(topic({ rating: 'Minor Refresh', streak: 1, last_tested: '2026-10-22' }), [result('a', 'clean'), result('b', 'slipped', { note: 'slipped: code section' })], TODAY);
  assert.equal(t.rating, 'Minor Refresh');
  assert.equal(t.streak, 0);
  assert.equal(t.next_review, '2026-10-26');
  assert.equal(t.last_result, 'slipped: code section');
});

test('missed with the framework right → Needs Improvement +1; wrong or blank → Not Ready +1', () => {
  const ni = applySession(topic(), [result('a', 'missed', { framework: true })], TODAY);
  assert.equal(ni.rating, 'Needs Improvement');
  assert.equal(ni.points, 40);
  assert.equal(ni.next_review, '2026-10-25');
  const nr = applySession(topic(), [result('a', 'missed', { framework: false })], TODAY);
  assert.equal(nr.rating, 'Not Ready');
  assert.equal(nr.points, 10);
  assert.equal(nr.next_review, '2026-10-25');
});

test('the worst card in the session sets the topic rating', () => {
  const t = applySession(topic({ rating: 'Minor Refresh', streak: 1 }), [result('a', 'clean'), result('b', 'clean'), result('c', 'missed', { framework: false })], TODAY);
  assert.equal(t.rating, 'Not Ready');
  assert.equal(t.streak, 0);
});

test('a clean session needs 2 distinct clean cards (1 for Light, never more than the bank has)', () => {
  assert.equal(cleanCardsRequired('Core'), 2);
  assert.equal(cleanCardsRequired('Support'), 2);
  assert.equal(cleanCardsRequired('Light'), 1);
  assert.equal(cleanCardsRequired('Core', 1), 1);

  // The same card twice is still one card.
  const same = applySession(topic({ streak: 1, rating: 'Minor Refresh', last_tested: '2026-10-22' }), [result('a', 'clean'), result('a', 'clean')], TODAY);
  assert.equal(same.streak, 0);
  assert.equal(same.rating, 'Minor Refresh');
  assert.match(same.last_result, /second clean card/);

  const light = applySession(topic({ weight: 'Light' }), [result('a', 'clean')], TODAY);
  assert.equal(light.streak, 1);
  assert.equal(light.rating, 'Minor Refresh');

  const onlyCard = applySession(topic(), [result('a', 'clean')], TODAY, { cardsAvailable: 1 });
  assert.equal(onlyCard.streak, 1);

  assert.deepEqual(sessionOutcome([result('a', 'clean'), result('b', 'clean')], 'Core'), { worst: 3, cleanCards: 2, required: 2, clean: true });
});

test('Locked In needs streak ≥ 2 on different days — two clean sessions the same day do not stack', () => {
  // Day 1: clean session → streak 1.
  const before = topic();
  const d1 = applySession(before, [result('a', 'clean'), result('b', 'clean')], '2026-10-24');
  // More clean cards the same day are the same session: re-applied from the
  // pre-day snapshot, the result is unchanged.
  const d1again = applySession(before, [result('a', 'clean'), result('b', 'clean'), result('c', 'clean'), result('d', 'clean')], '2026-10-24');
  assert.equal(d1.streak, 1);
  assert.deepEqual(d1again, d1);
  // Day 2: second clean session → Locked In.
  const d2 = applySession(d1, [result('c', 'clean', { date: '2026-10-25' }), result('d', 'clean', { date: '2026-10-25' })], '2026-10-25');
  assert.equal(d2.rating, 'Locked In');
  assert.equal(d2.tests, 2);
});

test('tests counts sessions, not cards', () => {
  const t = applySession(topic({ tests: 2 }), [result('a', 'clean'), result('b', 'slipped'), result('c', 'clean')], TODAY);
  assert.equal(t.tests, 3);
});

test('imported topic already quizzed today by the tracker: same session, no double count', () => {
  const tracker = topic({ rating: 'Minor Refresh', points: 75, tests: 3, streak: 1, last_tested: TODAY, next_review: '2026-10-26' });
  const clean = applySession(tracker, [result('a', 'clean'), result('b', 'clean')], TODAY);
  assert.equal(clean.streak, 1);
  assert.equal(clean.rating, 'Minor Refresh');
  assert.equal(clean.tests, 3);
  const worse = applySession(tracker, [result('a', 'missed', { framework: true })], TODAY);
  assert.equal(worse.rating, 'Needs Improvement');
  assert.equal(worse.streak, 0);
  assert.equal(worse.tests, 3);
});

test('nothing ever schedules past 2026-11-01', () => {
  for (let d = '2026-10-20'; d <= '2026-11-05'; d = addDays(d, 1)) {
    for (const r of ['Locked In', 'Minor Refresh', 'Needs Improvement', 'Not Ready']) {
      assert.ok(nextReview(r, d) <= '2026-11-01', `${r} on ${d} → ${nextReview(r, d)}`);
    }
  }
  assert.equal(nextReview('Locked In', '2026-10-30'), '2026-11-01');
  assert.equal(nextReview('Minor Refresh', '2026-10-31'), '2026-11-01');
  assert.equal(nextReview('Needs Improvement', '2026-11-01'), '2026-11-01');
  assert.equal(nextReview('Locked In', '2026-10-28'), '2026-11-01');
  assert.equal(nextReview('Locked In', '2026-10-27'), '2026-10-31');
  const t = applySession(topic({ streak: 1, rating: 'Minor Refresh', last_tested: '2026-10-29' }), [result('a', 'clean', { date: '2026-10-31' }), result('b', 'clean', { date: '2026-10-31' })], '2026-10-31');
  assert.equal(t.rating, 'Locked In');
  assert.equal(t.next_review, '2026-11-01');
});

test('last_result is 12 words max', () => {
  const t = applySession(topic(), [result('a', 'missed', { framework: true, note: 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen' })], TODAY);
  assert.equal(t.last_result.split(' ').length, 12);
});

// Hand-computed from content/topics.json (as of the Oct 23 quiz):
//   tested (tests ≥ 1): C1 C2 C4 C7 S2 S3 I3 at Needs Improvement (40) and
//   C3 C5 S4 at Minor Refresh (75) — all ten are Core (×3).
//   Σ w·p = 3 × (7 × 40 + 3 × 75) = 3 × 505 = 1515
//   all 65: 42 Core, 17 Support, 6 Light → Σ w·100 = (126 + 34 + 6) × 100 = 16600
//   overall = 1515 / 16600 = 9.13 %   on tested = 1515 / 3000 = 50.5 %
test('readiness for the shipped topics.json matches the hand computation', () => {
  const topics = shippedTopics();
  assert.equal(topics.length, 65);
  const counts = { Core: 0, Support: 0, Light: 0 };
  for (const t of topics) counts[t.weight]++;
  assert.deepEqual(counts, { Core: 42, Support: 17, Light: 6 });

  const r = readiness(topics);
  assert.equal(r.earned, 1515);
  assert.equal(r.possible, 16600);
  assert.equal(r.testedEarned, 1515);
  assert.equal(r.testedPossible, 3000);
  assert.equal(r.overall, 1515 / 16600);
  assert.equal(r.onTested, 0.505);
  assert.equal(r.tested, 10);
  assert.equal(r.total, 65);
  assert.equal(formatPercent(r.overall), '9.1%');
  assert.equal(formatPercent(r.onTested), '50.5%');
  // Every Core topic except C3, C5, S4 is below Minor Refresh.
  assert.equal(r.coreBelowMinor.length, 39);
  assert.equal(r.targetMet, false);
});

test('readiness formula on a small fixture', () => {
  const ts = [
    topic({ id: 'A', weight: 'Core', rating: 'Locked In', tests: 2 }),
    topic({ id: 'B', weight: 'Support', rating: 'Needs Improvement', tests: 1 }),
    topic({ id: 'C', weight: 'Light', rating: 'Not Tested' }),
  ];
  // (3×100 + 2×40 + 1×0) / (600) = 380/600 ; on tested 380/500
  const r = readiness(ts);
  assert.equal(r.overall, 380 / 600);
  assert.equal(r.onTested, 380 / 500);
  assert.equal(weightedReadiness([]).value, 0);
});

test('shift headline in the morning-quiz format', () => {
  const h = shiftHeadline([
    topic({ rating: 'Minor Refresh', streak: 1 }),
    topic({ rating: 'Locked In', streak: 2 }),
    topic({ rating: 'Minor Refresh', streak: 0 }),
    topic({ rating: 'Needs Improvement', streak: 0 }),
    topic({ rating: 'Not Ready', streak: 0 }),
  ]);
  assert.equal(h.text, '4 of 5 framework right · 1 close · 2 clean');
});

test('XP: clean 10, slipped 5, missed 1, +5 under par, +10 code unprompted', () => {
  const card = { par: 30 };
  assert.equal(xpForResult({ result: 'clean', seconds: 40 }, card), 10);
  assert.equal(xpForResult({ result: 'clean', seconds: 20 }, card), 15);
  assert.equal(xpForResult({ result: 'slipped', seconds: 40 }, card), 5);
  assert.equal(xpForResult({ result: 'missed', seconds: 40 }, card), 1);
  assert.equal(xpForResult({ result: 'missed', seconds: 5 }, card), 1); // no speed bonus on a miss
  assert.equal(xpForResult({ result: 'slipped', seconds: 5 }, card), 10);
  assert.equal(xpForResult({ result: 'clean', seconds: 80, codeUnprompted: true }, { par: 90 }), 25);
});
