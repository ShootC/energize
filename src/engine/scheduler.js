// Queue building and the daily shift (spec §3, §5; procedure-notes "Building
// a quiz" and "Special days").

import { addDays, daysBetween } from './dates.js';
import {
  RATING_ORDER, WEIGHT_ORDER, NOT_READY, NEEDS_IMPROVEMENT, NOT_TESTED, MINOR_REFRESH, LOCKED_IN,
  REVIEW_CAP, INTERVIEW_DATE, cleanCardsRequired, levelOf, LEVEL_CLEAN,
} from './rating.js';
import { OUT_LOUD } from './grader.js';

export const CUTOVER_START = '2026-10-26';
export const CUTOVER_END = '2026-10-30';
export const SWEEP_DATE = REVIEW_CAP; // 2026-11-01

export const DEFAULT_SHIFT = 15;
export const CUTOVER_SHIFT = 10;
export const SWEEP_MAX = 20;
export const KEEP_GOING_BATCH = 5;
export const INTERVIEW_CONFIDENCE_CARDS = 6;
export const SPOT_CHECK_DAYS = 3;
export const FEEDBACK_SECONDS = 15; // reading the result between cards

export const DEFAULT_PAR = { number: 25, order: 45, matrix: 60, scenario: 90, story: 120, defect: 40 };

// normal | cutover | sweep | interview | after
export function dayMode(today) {
  if (today > INTERVIEW_DATE) return 'after';
  if (today === INTERVIEW_DATE) return 'interview';
  if (today === SWEEP_DATE) return 'sweep';
  if (today >= CUTOVER_START && today <= CUTOVER_END) return 'cutover';
  return 'normal';
}

export function daysToInterview(today) {
  return Math.max(0, daysBetween(today, INTERVIEW_DATE));
}

function reviewDate(topic) {
  if (topic.next_review) return topic.next_review;
  // Not tested and no date: the morning after its plan day.
  return topic.plan_date ? addDays(topic.plan_date, 1) : '';
}

export function isDue(topic, today) {
  const d = reviewDate(topic);
  return !!d && d <= today;
}

// Not Tested topics whose plan date is after yesterday haven't been studied yet.
export function isStudied(topic, today) {
  return !topic.plan_date || topic.plan_date <= addDays(today, -1);
}

function rank(list, value) {
  const i = list.indexOf(value);
  return i < 0 ? list.length : i;
}

// Queue order: rating (Not Ready → … → Locked In), then weight (Core →
// Support → Light), then plan day, then topics.json order.
export function compareQueue(a, b) {
  return (
    rank(RATING_ORDER, a.rating) - rank(RATING_ORDER, b.rating) ||
    rank(WEIGHT_ORDER, a.weight) - rank(WEIGHT_ORDER, b.weight) ||
    (a.day ?? 0) - (b.day ?? 0) ||
    (a._index ?? 0) - (b._index ?? 0)
  );
}

function indexed(topics) {
  return topics.map((t, i) => ({ ...t, _index: i }));
}

function strip(t) {
  const { _index, ...rest } = t;
  return rest;
}

export function dueQueue(topics, today) {
  return indexed(topics)
    .filter((t) => isDue(t, today))
    .filter((t) => t.rating !== NOT_TESTED || isStudied(t, today))
    .sort(compareQueue)
    .map(strip);
}

// ---------- card picking ----------

export function cardsByTopic(cards) {
  const m = new Map();
  for (const c of cards) {
    if (!m.has(c.topicId)) m.set(c.topicId, []);
    m.get(c.topicId).push(c);
  }
  return m;
}

function historyFor(history, topicId) {
  return history.filter((h) => h.topicId === topicId && h.rated !== false);
}

export function todaysResults(history, topicId, today) {
  return historyFor(history, topicId).filter((h) => h.date === today);
}

// Card results from the most recent earlier session on this topic.
export function lastSession(history, topicId, today) {
  const earlier = historyFor(history, topicId).filter((h) => h.date < today);
  if (!earlier.length) return [];
  const last = earlier.reduce((d, h) => (h.date > d ? h.date : d), '');
  return earlier.filter((h) => h.date === last);
}

function lastSeen(history, cardId) {
  let d = '';
  for (const h of history) if (h.cardId === cardId && h.date > d) d = h.date;
  return d;
}

// Pick the next card for a topic (spec §3.3): never a card already used today;
// not a card from the previous session if the topic has alternatives; prefer
// the card type the topic missed last time; then (for ordinary slots)
// auto-graded types before out-loud ones; then least recently seen.
export function pickCard(topicId, ctx, { slot = 'coverage', exclude = [], avoidType = null } = {}) {
  const { byTopic, history, today } = ctx;
  const all = byTopic.get(topicId) || [];
  const usedToday = new Set([...todaysResults(history, topicId, today).map((h) => h.cardId), ...exclude]);
  let pool = all.filter((c) => !usedToday.has(c.id));
  if (slot === 'outloud') pool = pool.filter((c) => OUT_LOUD.includes(c.type));
  if (!pool.length) return null;

  const prev = lastSession(history, topicId, today);
  const prevIds = new Set(prev.map((h) => h.cardId));
  const fresh = pool.filter((c) => !prevIds.has(c.id));
  if (fresh.length) pool = fresh;

  const missedTypes = new Set(prev.filter((h) => levelOf(h) < LEVEL_CLEAN).map((h) => h.type));
  const order = new Map(all.map((c, i) => [c.id, i]));
  const key = (c) => [
    missedTypes.has(c.type) ? 0 : 1,
    avoidType && c.type === avoidType ? 1 : 0,
    slot !== 'outloud' && OUT_LOUD.includes(c.type) ? 1 : 0,
    lastSeen(history, c.id),
    order.get(c.id),
  ];
  pool.sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] < kb[i]) return -1;
      if (ka[i] > kb[i]) return 1;
    }
    return 0;
  });
  return pool[0];
}

// ---------- shift composition ----------

export function shiftComposition(mode, size) {
  const outLoud = mode === 'cutover' ? 2 : 1;
  const outLoudTypes = mode === 'cutover' ? ['story'] : ['story', 'scenario'];
  // "Up to 6 redos" in a 15-card shift; scaled for other shift sizes.
  const redoCap = Math.round((size * 6) / 15);
  return { size, outLoud, outLoudTypes, redoCap };
}

export function defaultShiftSize(mode, settings = {}) {
  if (mode === 'sweep') return SWEEP_MAX;
  if (settings.cardsPerShift) return settings.cardsPerShift;
  return mode === 'cutover' ? CUTOVER_SHIFT : DEFAULT_SHIFT;
}

function makeCtx({ topics, cards, history = [], today }) {
  return { topics, cards, byTopic: cardsByTopic(cards), history, today, cardById: new Map(cards.map((c) => [c.id, c])) };
}

function slotFor(ctx, topic, slot, opts = {}) {
  const card = pickCard(topic.id, ctx, { slot: slot === 'outloud' ? 'outloud' : 'coverage', ...opts });
  return card ? { topicId: topic.id, cardId: card.id, type: card.type, slot } : null;
}

export function estimateMinutes(slots, cardById) {
  const secs = slots.reduce((s, x) => {
    const c = cardById.get(x.cardId);
    return s + (c?.par || DEFAULT_PAR[c?.type] || 30) + FEEDBACK_SECONDS;
  }, 0);
  return Math.max(1, Math.ceil(secs / 60));
}

function testedToday(history, today) {
  return new Set(history.filter((h) => h.date === today && h.rated !== false).map((h) => h.topicId));
}

// The daily shift. Returns a plain object (safe to persist mid-shift).
export function buildShift({ topics, cards, history = [], today, settings = {} }) {
  const mode = dayMode(today);
  const ctx = makeCtx({ topics, cards, history, today });
  if (mode === 'interview') return interviewDayPlan({ topics, cards, history, today });
  if (mode === 'after') return { date: today, mode, size: 0, slots: [], estimatedMinutes: 0 };

  const size = defaultShiftSize(mode, settings);
  const done = testedToday(history, today);
  const has = (t) => (ctx.byTopic.get(t.id) || []).length > 0;
  const used = new Set();
  const take = (t, slot, opts) => {
    if (used.has(t.id) || done.has(t.id) || !has(t)) return null;
    const s = slotFor(ctx, t, slot, opts);
    if (s) used.add(t.id);
    return s;
  };

  if (mode === 'sweep') {
    // Nov 1: every topic not Locked In, in queue order, up to 20 cards.
    const sweep = indexed(topics).filter((t) => t.rating !== LOCKED_IN).sort(compareQueue).map(strip);
    const slots = [];
    for (const t of sweep) {
      if (slots.length >= size) break;
      const s = take(t, 'sweep');
      if (s) slots.push(s);
    }
    return finish({ date: today, mode, size, slots }, ctx);
  }

  const comp = shiftComposition(mode, size);
  const queue = dueQueue(topics, today);

  // Out-loud card(s) are chosen first so a story topic isn't spent on an
  // ordinary slot; they go last in the shift. Due story topics first, then due
  // scenario topics, then the least recently tested studied topic.
  const outLoud = [];
  const typesOf = (t) => new Set((ctx.byTopic.get(t.id) || []).map((c) => c.type));
  const notDue = indexed(topics)
    .filter((t) => !queue.some((q) => q.id === t.id) && (t.rating !== NOT_TESTED || isStudied(t, today)))
    .sort((a, b) => (a.last_tested || '').localeCompare(b.last_tested || '') || compareQueue(a, b))
    .map(strip);
  const outLoudCandidates = [];
  for (const group of [queue, notDue]) {
    for (const type of comp.outLoudTypes) outLoudCandidates.push(...group.filter((t) => typesOf(t).has(type)).map((t) => [t, type]));
  }
  for (const [t, type] of outLoudCandidates) {
    if (outLoud.length >= comp.outLoud) break;
    if (used.has(t.id) || done.has(t.id)) continue;
    const pool = (ctx.byTopic.get(t.id) || []).filter((c) => c.type === type);
    const card = pickCard(t.id, { ...ctx, byTopic: new Map([[t.id, pool]]) }, { slot: 'outloud' });
    if (card) {
      used.add(t.id);
      outLoud.push({ topicId: t.id, cardId: card.id, type: card.type, slot: 'outloud' });
    }
  }

  const regular = size - outLoud.length;
  const redos = [];
  for (const t of queue.filter((q) => q.rating === NOT_READY || q.rating === NEEDS_IMPROVEMENT)) {
    if (redos.length >= comp.redoCap) break;
    const s = take(t, 'redo');
    if (s) redos.push(s);
  }

  const coverageCount = regular - redos.length;
  const notTested = indexed(queue.filter((q) => q.rating === NOT_TESTED))
    .sort((a, b) => (a.day ?? 0) - (b.day ?? 0) || rank(WEIGHT_ORDER, a.weight) - rank(WEIGHT_ORDER, b.weight) || a._index - b._index)
    .map(strip);
  const minorDue = queue.filter((q) => q.rating === MINOR_REFRESH);
  const spotCandidates = indexed(topics)
    .filter((t) => t.rating === LOCKED_IN && t.last_tested && daysBetween(t.last_tested, today) >= SPOT_CHECK_DAYS)
    .sort((a, b) => (isDue(b, today) - isDue(a, today)) || rank(WEIGHT_ORDER, a.weight) - rank(WEIGHT_ORDER, b.weight) || a.last_tested.localeCompare(b.last_tested) || a._index - b._index)
    .map(strip);

  const coverage = [];
  let spot = null;
  for (const t of spotCandidates) {
    if (coverageCount <= 0) break;
    spot = take(t, 'spot');
    if (spot) break;
  }
  const coverageRoom = coverageCount - (spot ? 1 : 0);
  for (const t of [...notTested, ...minorDue]) {
    if (coverage.length >= coverageRoom) break;
    const s = take(t, 'coverage');
    if (s) coverage.push(s);
  }
  if (spot) coverage.push(spot);
  // Coverage ran short: fill with whatever else is due, in queue order.
  for (const t of queue) {
    if (redos.length + coverage.length >= regular) break;
    const s = take(t, 'fill');
    if (s) coverage.push(s);
  }

  return finish({ date: today, mode, size, slots: [...redos, ...coverage, ...outLoud] }, ctx);
}

function finish(shift, ctx) {
  return { ...shift, slots: shift.slots.map((s) => ({ ...s, done: false })), estimatedMinutes: estimateMinutes(shift.slots, ctx.cardById) };
}

// Called after every graded card in a shift. `history` already contains the
// new result. Returns the updated shift:
//  - a clean first answer on a topic that needs 2 distinct clean cards gets a
//    follow-up card on the same topic right after it (the "follow-up handled"
//    of Locked In); the shift grows by one card — nothing is displaced, so
//    `slots.length` can exceed the planned `size`;
//  - on Nov 1 (sweep) a missed card gets one redo at the end of the shift.
export function afterResult(shift, slotIndex, { topics, cards, history, today }) {
  const ctx = makeCtx({ topics, cards, history, today });
  const slots = shift.slots.map((s, i) => (i === slotIndex ? { ...s, done: true } : { ...s }));
  const current = slots[slotIndex];
  const topic = topics.find((t) => t.id === current.topicId);
  const results = todaysResults(history, current.topicId, today);
  const last = results[results.length - 1];
  if (!topic || !last || shift.mode === 'interview') return { ...shift, slots };

  const available = (ctx.byTopic.get(topic.id) || []).length;
  const required = cleanCardsRequired(topic.weight, available);
  const allClean = results.every((r) => levelOf(r) === LEVEL_CLEAN);
  const cleanCards = new Set(results.map((r) => r.cardId)).size;
  const laterSameTopic = slots.some((s, i) => i > slotIndex && !s.done && s.topicId === topic.id);

  if (allClean && cleanCards < required && !laterSameTopic) {
    const planned = slots.filter((s) => !s.done).map((s) => s.cardId);
    const card = pickCard(topic.id, ctx, { exclude: planned, avoidType: current.type });
    if (card) {
      slots.splice(slotIndex + 1, 0, { topicId: topic.id, cardId: card.id, type: card.type, slot: 'followup', done: false });
    }
  }

  if (shift.mode === 'sweep' && last.result === 'missed' && current.slot !== 'redo') {
    const already = slots.some((s) => s.slot === 'redo' && s.topicId === topic.id);
    if (!already) {
      const planned = slots.filter((s) => !s.done).map((s) => s.cardId);
      const card = pickCard(topic.id, ctx, { exclude: planned }) || ctx.cardById.get(current.cardId);
      slots.push({ topicId: topic.id, cardId: card.id, type: card.type, slot: 'redo', done: false });
    }
  }

  return { ...shift, slots, estimatedMinutes: estimateMinutes(slots.filter((s) => !s.done), ctx.cardById) };
}

// "Keep going": the next 5 due topics not yet tested today, in queue order.
export function keepGoing({ topics, cards, history = [], today, exclude = [], count = KEEP_GOING_BATCH }) {
  const ctx = makeCtx({ topics, cards, history, today });
  const done = testedToday(history, today);
  const skip = new Set(exclude);
  const slots = [];
  for (const t of dueQueue(topics, today)) {
    if (slots.length >= count) break;
    if (done.has(t.id) || skip.has(t.id)) continue;
    const s = slotFor(ctx, t, 'coverage');
    if (s) slots.push(s);
  }
  return finish({ date: today, mode: 'keep', size: slots.length, slots }, ctx);
}

// "Drill this": every card of one topic, best-first by the same picking rules.
export function drillPlan({ topicId, cards, history = [], today, topics = [] }) {
  const ctx = makeCtx({ topics, cards, history, today });
  const slots = [];
  const picked = [];
  for (;;) {
    const card = pickCard(topicId, { ...ctx, history: history.filter((h) => !(h.date === today && h.topicId === topicId)) }, { exclude: picked });
    if (!card) break;
    picked.push(card.id);
    slots.push({ topicId, cardId: card.id, type: card.type, slot: 'drill' });
  }
  return finish({ date: today, mode: 'drill', size: slots.length, slots }, ctx);
}

// Nov 2: six quick confidence cards from Locked In topics (Minor Refresh if
// short), then the 60-second intro. Results are recorded but never rated.
export function interviewDayPlan({ topics, cards, history = [], today }) {
  const ctx = makeCtx({ topics, cards, history, today });
  const quick = ['number', 'order', 'defect', 'matrix'];
  const pool = indexed(topics)
    .filter((t) => t.rating === LOCKED_IN || t.rating === MINOR_REFRESH)
    .sort((a, b) => rank([LOCKED_IN, MINOR_REFRESH], a.rating) - rank([LOCKED_IN, MINOR_REFRESH], b.rating) || rank(WEIGHT_ORDER, a.weight) - rank(WEIGHT_ORDER, b.weight) || a._index - b._index)
    .map(strip);
  const slots = [];
  for (const t of pool) {
    if (slots.length >= INTERVIEW_CONFIDENCE_CARDS) break;
    const own = (ctx.byTopic.get(t.id) || []).filter((c) => quick.includes(c.type));
    if (!own.length) continue;
    const card = pickCard(t.id, { ...ctx, byTopic: new Map([[t.id, own]]) });
    if (card) slots.push({ topicId: t.id, cardId: card.id, type: card.type, slot: 'confidence' });
  }
  const intro = (ctx.byTopic.get('I1') || []).find((c) => c.type === 'story');
  if (intro) slots.push({ topicId: 'I1', cardId: intro.id, type: intro.type, slot: 'intro' });
  return finish({ date: today, mode: 'interview', size: slots.length, slots }, ctx);
}

// Number Blitz deck: number cards from Locked In and Minor Refresh topics.
export function blitzDeck({ topics, cards }) {
  const ok = new Set(topics.filter((t) => t.rating === LOCKED_IN || t.rating === MINOR_REFRESH).map((t) => t.id));
  return cards.filter((c) => c.type === 'number' && ok.has(c.topicId));
}
