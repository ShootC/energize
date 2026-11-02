import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  POINTS, INTERVAL_DAYS, WEIGHTS, applySession, readiness, weightedReadiness,
  shiftHeadline, xpForResult, cleanCardsRequired, sessionOutcome, formatPercent,
} from '../src/engine/rating.js';
import { shippedTopics, topic, result } from './helpers.js';

const TODAY = '2026-10-24';

test('rating ladder: points and review intervals match procedure-notes', () => {
  assert.deepEqual(POINTS, { 'Locked In': 100, 'Minor Refresh': 75, 'Needs Improvement': 40, 'Not Ready': 10, 'Not Tested': 0 });
  assert.deepEqual(INTERVAL_DAYS, { 'Locked In': 4, 'Minor Refresh': 2, 'Needs Improvement': 1, 'Not Ready': 1 });
  assert.deepEqual(WEIGHTS, { Core: 3, Support: 2, Light: 1 });
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

// The review cap (date − 1, or a rolling + 7 with no date) is tested in round.test.js.

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

// Round 2 (GAME_SPEC_ROUND2 §3), the same formula over two slices of the shipped topics.json:
//   technical = every area except Interview: 54 topics, 33 Core, 15 Support, 6 Light
//     → Σ w·100 = (99 + 30 + 6) × 100 = 13500. Tested: C1 C2 C4 C7 S2 S3 at Needs
//     Improvement and C3 C5 S4 at Minor Refresh, all Core → 3 × (6 × 40 + 3 × 75) = 1395.
//     1395 / 13500 = 10.33 %, 9 of 54 tested; 30 Core technical topics below Minor Refresh.
//   interview = I1–I11: 9 Core, 2 Support → Σ w·100 = (27 + 4) × 100 = 3100. Tested: I3 at
//     Needs Improvement → 3 × 40 = 120. 120 / 3100 = 3.87 %, 1 of 11 tested.
//   The slices add back up to overall: 1395 + 120 = 1515, 13500 + 3100 = 16600.
test('technical readiness leaves out I1–I11; interview readiness is I1–I11 only (hand-computed)', () => {
  const r = readiness(shippedTopics());
  assert.equal(r.technical.earned, 1395);
  assert.equal(r.technical.possible, 13500);
  assert.equal(r.technical.value, 1395 / 13500);
  assert.equal(r.technical.tested, 9);
  assert.equal(r.technical.total, 54);
  assert.equal(formatPercent(r.technical.value), '10.3%');
  assert.equal(r.technical.coreBelowMinor.length, 30);
  assert.ok(!r.technical.coreBelowMinor.some((id) => id.startsWith('I')));
  assert.equal(r.technical.targetMet, false);
  assert.equal(r.interview.earned, 120);
  assert.equal(r.interview.possible, 3100);
  assert.equal(r.interview.value, 120 / 3100);
  assert.equal(r.interview.tested, 1);
  assert.equal(r.interview.total, 11);
  assert.equal(formatPercent(r.interview.value), '3.9%');
  // Overall and on tested are exactly as before.
  assert.equal(r.overall, 1515 / 16600);
  assert.equal(r.onTested, 0.505);
  assert.equal(r.technical.earned + r.interview.earned, r.earned);
});

test('technical target: ≥ 85% technical and no Core technical topic below Minor Refresh (Interview ignored)', () => {
  const ts = shippedTopics().map((t) => (t.area === 'Interview' ? { ...t, rating: 'Not Ready' } : { ...t, rating: 'Locked In' }));
  const r = readiness(ts);
  assert.equal(r.technical.value, 1);
  assert.equal(r.technical.targetMet, true);
  assert.equal(r.targetMet, false);
  const one = ts.map((t) => (t.id === 'K2' ? { ...t, rating: 'Needs Improvement' } : t));
  assert.equal(readiness(one).technical.targetMet, false);
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
