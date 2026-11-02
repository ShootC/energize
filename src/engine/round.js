// The next round (GAME_SPEC_ROUND2 §2): a label, a focus and a date the player sets in
// Settings. Every special day hangs off that date — there are no hard-coded dates left.
//
//   no date      → review cap = today + 7 (rolling), no special days
//   date − 1     → the sweep; also the review cap
//   date         → day-of mode
//   after date   → "Round done — set the next one" (ratings carry over; never retire)

import { addDays, daysBetween, isIsoDate } from './dates.js';

export const FOCUSES = ['technical', 'behavioral'];
export const DEFAULT_NEXT_ROUND = { label: 'Round 2', focus: 'technical', date: null };
export const ROLLING_CAP_DAYS = 7;

// Fill in anything missing or malformed with the defaults (old saves have no nextRound).
export function normalizeNextRound(nr) {
  const n = nr && typeof nr === 'object' ? nr : {};
  return {
    label: typeof n.label === 'string' && n.label.trim() ? n.label.trim() : DEFAULT_NEXT_ROUND.label,
    focus: FOCUSES.includes(n.focus) ? n.focus : DEFAULT_NEXT_ROUND.focus,
    date: isIsoDate(n.date) ? n.date : null,
  };
}

// No review date goes past the day before the round. With no date (or one already
// passed), the cap rolls: today + 7, which the longest interval (4 days) never reaches.
export function reviewCap(today, nextRound) {
  const { date } = normalizeNextRound(nextRound);
  if (date && today < date) return addDays(date, -1);
  return addDays(today, ROLLING_CAP_DAYS);
}

export function sweepDate(nextRound) {
  const { date } = normalizeNextRound(nextRound);
  return date ? addDays(date, -1) : null;
}

// normal | sweep | dayof | after
export function dayMode(today, nextRound) {
  const { date } = normalizeNextRound(nextRound);
  if (!date) return 'normal';
  if (today > date) return 'after';
  if (today === date) return 'dayof';
  if (today === addDays(date, -1)) return 'sweep';
  return 'normal';
}

// Whole days until the round, or null when no date is set.
export function daysToRound(today, nextRound) {
  const { date } = normalizeNextRound(nextRound);
  return date ? Math.max(0, daysBetween(today, date)) : null;
}

// Interrupt mode (§5): on by default in technical focus, off in behavioral, unless set.
export function interruptOn(settings = {}) {
  if (typeof settings.interrupt === 'boolean') return settings.interrupt;
  return normalizeNextRound(settings.nextRound).focus === 'technical';
}
