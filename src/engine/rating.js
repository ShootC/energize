// Rating ladder, points, streaks, review dates, readiness and XP.
// Must reproduce content/procedure-notes.md exactly — the game and the chat
// tracker have to report the same ratings and the same readiness numbers.

import { addDays, minDate } from './dates.js';

export const LOCKED_IN = 'Locked In';
export const MINOR_REFRESH = 'Minor Refresh';
export const NEEDS_IMPROVEMENT = 'Needs Improvement';
export const NOT_READY = 'Not Ready';
export const NOT_TESTED = 'Not Tested';

// Queue order (procedure-notes "Building a quiz" step 1).
export const RATING_ORDER = [NOT_READY, NEEDS_IMPROVEMENT, NOT_TESTED, MINOR_REFRESH, LOCKED_IN];

export const POINTS = {
  [LOCKED_IN]: 100,
  [MINOR_REFRESH]: 75,
  [NEEDS_IMPROVEMENT]: 40,
  [NOT_READY]: 10,
  [NOT_TESTED]: 0,
};

// Days until the next review after a graded session.
export const INTERVAL_DAYS = {
  [LOCKED_IN]: 4,
  [MINOR_REFRESH]: 2,
  [NEEDS_IMPROVEMENT]: 1,
  [NOT_READY]: 1,
};

export const WEIGHT_ORDER = ['Core', 'Support', 'Light'];
export const WEIGHTS = { Core: 3, Support: 2, Light: 1 };

// No review date goes past the final sweep.
export const REVIEW_CAP = '2026-11-01';
export const INTERVIEW_DATE = '2026-11-02';
export const READINESS_TARGET = 0.85;

// Card outcome levels, best to worst. A card result is clean / slipped /
// missed; a miss is split by whether the framework was right, because the
// ladder separates Needs Improvement (framework right) from Not Ready.
export const LEVEL_CLEAN = 3;
export const LEVEL_SLIPPED = 2;
export const LEVEL_FRAMEWORK = 1;
export const LEVEL_WRONG = 0;

export function levelOf(result) {
  if (result.result === 'clean') return LEVEL_CLEAN;
  if (result.result === 'slipped') return LEVEL_SLIPPED;
  return result.framework ? LEVEL_FRAMEWORK : LEVEL_WRONG;
}

function ratingForLevel(level) {
  if (level >= LEVEL_SLIPPED) return MINOR_REFRESH;
  if (level === LEVEL_FRAMEWORK) return NEEDS_IMPROVEMENT;
  return NOT_READY;
}

export function nextReview(rating, today) {
  return minDate(addDays(today, INTERVAL_DAYS[rating]), REVIEW_CAP);
}

// How many distinct clean cards a topic needs in one session for the session
// to count as clean (spec §3): 2, or 1 for Light topics — and never more than
// the bank actually holds for that topic.
export function cleanCardsRequired(weight, cardsAvailable = Infinity) {
  if (weight === 'Light') return 1;
  return Math.max(1, Math.min(2, cardsAvailable));
}

// Summarise one session (one calendar day) of card results on one topic.
export function sessionOutcome(results, weight, cardsAvailable = Infinity) {
  const worst = Math.min(...results.map(levelOf));
  const cleanCards = new Set(results.filter((r) => levelOf(r) === LEVEL_CLEAN).map((r) => r.cardId)).size;
  const required = cleanCardsRequired(weight, cardsAvailable);
  return { worst, cleanCards, required, clean: worst === LEVEL_CLEAN && cleanCards >= required };
}

function wordsMax(text, n) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  return words.slice(0, n).join(' ');
}

// Apply one session of results to a topic record. `before` is the record as
// it stood before the session's first result; calling this again with the
// day's growing result list always gives the same answer as grading once at
// the end, which is what lets a day's shift, Keep going and drills all count
// as one session.
export function applySession(before, results, today, { cardsAvailable = Infinity } = {}) {
  if (!results.length) return { ...before };
  const outcome = sessionOutcome(results, before.weight, cardsAvailable);
  const worstResult = results.reduce((w, r) => (levelOf(r) < levelOf(w) ? r : w), results[0]);

  let rating;
  let streak;
  let tests = (before.tests || 0) + 1;

  if (before.last_tested === today) {
    // Imported from the tracker after it already quizzed this topic today:
    // same session, so streak and tests are already counted. A clean game
    // result keeps the tracker's grade; anything worse pulls it down.
    tests = before.tests || 0;
    const priorLevel = before.rating === NOT_TESTED ? LEVEL_CLEAN : ratingLevel(before.rating);
    if (outcome.clean && (before.streak || 0) >= 1) {
      rating = before.rating;
      streak = before.streak;
    } else {
      rating = ratingForLevel(Math.min(priorLevel, outcome.clean ? LEVEL_SLIPPED : outcome.worst));
      streak = 0;
    }
  } else if (outcome.clean) {
    streak = (before.streak || 0) + 1;
    rating = streak >= 2 ? LOCKED_IN : MINOR_REFRESH;
  } else {
    streak = 0;
    rating = ratingForLevel(outcome.worst);
  }

  let lastResult;
  if (outcome.clean) lastResult = 'clean';
  else if (outcome.worst === LEVEL_CLEAN) lastResult = 'clean, but one card — needs a second clean card';
  else lastResult = worstResult.note || worstResult.result;

  return {
    ...before,
    rating,
    points: POINTS[rating],
    tests,
    streak,
    last_tested: today,
    next_review: nextReview(rating, today),
    last_result: wordsMax(lastResult, 12),
  };
}

function ratingLevel(rating) {
  if (rating === LOCKED_IN || rating === MINOR_REFRESH) return rating === LOCKED_IN ? LEVEL_CLEAN : LEVEL_SLIPPED;
  if (rating === NEEDS_IMPROVEMENT) return LEVEL_FRAMEWORK;
  return LEVEL_WRONG;
}

export function weightOf(topic) {
  const w = WEIGHTS[topic.weight];
  if (!w) throw new Error(`Unknown weight ${JSON.stringify(topic.weight)} on ${topic.id}`);
  return w;
}

// Weighted readiness = Σ(weight × points) / Σ(weight × 100).
export function weightedReadiness(topics) {
  let earned = 0;
  let possible = 0;
  for (const t of topics) {
    const w = weightOf(t);
    earned += w * (POINTS[t.rating] ?? 0);
    possible += w * 100;
  }
  return { earned, possible, value: possible ? earned / possible : 0 };
}

export function readiness(topics) {
  const tested = topics.filter((t) => (t.tests || 0) >= 1);
  const overall = weightedReadiness(topics);
  const onTested = weightedReadiness(tested);
  const coreBelowMinor = topics
    .filter((t) => t.weight === 'Core' && POINTS[t.rating] < POINTS[MINOR_REFRESH])
    .map((t) => t.id);
  return {
    overall: overall.value,
    onTested: onTested.value,
    tested: tested.length,
    total: topics.length,
    earned: overall.earned,
    possible: overall.possible,
    testedEarned: onTested.earned,
    testedPossible: onTested.possible,
    coreBelowMinor,
    targetMet: overall.value >= READINESS_TARGET && coreBelowMinor.length === 0,
  };
}

export function formatPercent(x, digits = 1) {
  return `${(x * 100).toFixed(digits)}%`;
}

// Shift debrief headline in the morning-quiz format, over the topics graded in
// the session: framework right = Needs Improvement or better; close = Minor
// Refresh without a clean session; clean = a clean session (streak ≥ 1, which
// includes Locked In).
export function shiftHeadline(topicsAfter) {
  const n = topicsAfter.length;
  const framework = topicsAfter.filter((t) => POINTS[t.rating] >= POINTS[NEEDS_IMPROVEMENT]).length;
  // A graded session leaves streak ≥ 1 only when it was clean.
  const clean = topicsAfter.filter((t) => t.streak >= 1).length;
  const close = topicsAfter.filter((t) => t.rating === MINOR_REFRESH && t.streak === 0).length;
  return {
    total: n,
    framework,
    close,
    clean,
    text: `${framework} of ${n} framework right · ${close} close · ${clean} clean`,
  };
}

// XP (spec §3 fun layer). Never feeds back into ratings.
export const XP = { clean: 10, slipped: 5, missed: 1, underPar: 5, codeUnprompted: 10, shiftComplete: 50 };

// The under-par bonus needs a right answer: a fast miss earns nothing extra.
export function xpForResult(result, card) {
  let xp = XP[result.result] ?? 0;
  if (result.result !== 'missed' && card && card.par && result.seconds != null && result.seconds < card.par) xp += XP.underPar;
  if (result.codeUnprompted) xp += XP.codeUnprompted;
  return xp;
}
