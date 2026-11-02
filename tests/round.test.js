// The next round's date replaces the Nov 1 / Nov 2 hard-coding (GAME_SPEC_ROUND2 §2):
// cap = date − 1 (rolling today + 7 when no date), sweep = date − 1, day-of = date,
// after the date = "set the next round". The cutover rule is gone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_NEXT_ROUND, normalizeNextRound, reviewCap, sweepDate, dayMode, daysToRound, interruptOn,
} from '../src/engine/round.js';
import { nextReview, applySession } from '../src/engine/rating.js';
import { addDays } from '../src/engine/dates.js';
import { topic, result } from './helpers.js';

const R2 = { label: 'Round 2', focus: 'technical', date: '2026-11-12' };

test('default next round: Round 2, technical, no date; bad values fall back to the defaults', () => {
  assert.deepEqual(DEFAULT_NEXT_ROUND, { label: 'Round 2', focus: 'technical', date: null });
  assert.deepEqual(normalizeNextRound(undefined), DEFAULT_NEXT_ROUND);
  assert.deepEqual(normalizeNextRound({ focus: 'behavioral' }), { label: 'Round 2', focus: 'behavioral', date: null });
  assert.deepEqual(normalizeNextRound({ label: '  ', focus: 'exec', date: '2026-02-30' }), DEFAULT_NEXT_ROUND);
  assert.deepEqual(normalizeNextRound({ label: 'Round 3', focus: 'behavioral', date: '2026-11-20' }), { label: 'Round 3', focus: 'behavioral', date: '2026-11-20' });
});

test('a set date: cap = date − 1, sweep = date − 1, day-of = date, after = the day after', () => {
  assert.equal(reviewCap('2026-11-03', R2), '2026-11-11');
  assert.equal(reviewCap('2026-11-11', R2), '2026-11-11');
  assert.equal(sweepDate(R2), '2026-11-11');
  assert.equal(dayMode('2026-11-03', R2), 'normal');
  assert.equal(dayMode('2026-11-10', R2), 'normal');
  assert.equal(dayMode('2026-11-11', R2), 'sweep');
  assert.equal(dayMode('2026-11-12', R2), 'dayof');
  assert.equal(dayMode('2026-11-13', R2), 'after');
  assert.equal(dayMode('2026-12-25', R2), 'after');
  assert.equal(daysToRound('2026-11-05', R2), 7);
  assert.equal(daysToRound('2026-11-12', R2), 0);
  assert.equal(daysToRound('2026-11-14', R2), 0);
});

test('no date: a rolling today + 7 cap, never a special day', () => {
  const none = { ...R2, date: null };
  assert.equal(reviewCap('2026-11-03', none), '2026-11-10');
  assert.equal(sweepDate(none), null);
  for (let d = '2026-10-20'; d <= '2026-12-31'; d = addDays(d, 1)) assert.equal(dayMode(d, none), 'normal', d);
  assert.equal(daysToRound('2026-11-03', none), null);
  // A date that has passed and was never replaced does not cap anything into the past.
  assert.equal(reviewCap('2026-11-20', R2), '2026-11-27');
});

test('the Oct 26–30 cutover and the Nov 1 / Nov 2 days are gone', () => {
  for (const d of ['2026-10-26', '2026-10-30', '2026-11-01', '2026-11-02', '2026-11-03']) assert.equal(dayMode(d, DEFAULT_NEXT_ROUND), 'normal', d);
});

test('nothing schedules past date − 1; the intervals are unchanged before that', () => {
  for (let d = '2026-11-03'; d <= '2026-11-11'; d = addDays(d, 1)) {
    const cap = reviewCap(d, R2);
    for (const r of ['Locked In', 'Minor Refresh', 'Needs Improvement', 'Not Ready']) {
      assert.ok(nextReview(r, d, cap) <= '2026-11-11', `${r} on ${d} → ${nextReview(r, d, cap)}`);
    }
  }
  assert.equal(nextReview('Locked In', '2026-11-03', reviewCap('2026-11-03', R2)), '2026-11-07');
  assert.equal(nextReview('Locked In', '2026-11-08', reviewCap('2026-11-08', R2)), '2026-11-11');
  assert.equal(nextReview('Minor Refresh', '2026-11-10', reviewCap('2026-11-10', R2)), '2026-11-11');
  assert.equal(nextReview('Needs Improvement', '2026-11-11', reviewCap('2026-11-11', R2)), '2026-11-11');
  // Rolling: the + 7 cap never bites (the longest interval is 4 days).
  assert.equal(nextReview('Locked In', '2026-11-03', reviewCap('2026-11-03', { date: null })), '2026-11-07');
  const t = applySession(topic({ streak: 1, rating: 'Minor Refresh', last_tested: '2026-11-07' }), [result('a', 'clean', { date: '2026-11-09' }), result('b', 'clean', { date: '2026-11-09' })], '2026-11-09', { cap: reviewCap('2026-11-09', R2) });
  assert.equal(t.rating, 'Locked In');
  assert.equal(t.next_review, '2026-11-11');
});

test('interrupt mode defaults on in technical focus, off in behavioral, unless set', () => {
  assert.equal(interruptOn({ nextRound: { focus: 'technical' } }), true);
  assert.equal(interruptOn({ nextRound: { focus: 'behavioral' } }), false);
  assert.equal(interruptOn({}), true);
  assert.equal(interruptOn({ interrupt: false, nextRound: { focus: 'technical' } }), false);
  assert.equal(interruptOn({ interrupt: true, nextRound: { focus: 'behavioral' } }), true);
});
