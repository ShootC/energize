// Queue building and the daily shift (spec §3, §5; procedure-notes "Building a quiz"),
// retargeted for round 2 (GAME_SPEC_ROUND2 §2 and §4): the special days hang off the next
// round's date, the shift is mostly technical and mostly out loud, and plan-date gating is
// off (every topic has been studied).

import { daysBetween, minDate } from './dates.js';
import {
  RATING_ORDER, WEIGHT_ORDER, NOT_READY, NEEDS_IMPROVEMENT, NOT_TESTED, MINOR_REFRESH, LOCKED_IN,
  INTERVIEW_AREA, cleanCardsRequired, levelOf, LEVEL_CLEAN,
} from './rating.js';
import { OUT_LOUD, followUpsOf } from './grader.js';
import { dayMode, reviewCap, normalizeNextRound } from './round.js';

export const DEFAULT_SHIFT = 15;
export const SWEEP_MAX = 20;
export const KEEP_GOING_BATCH = 5;
export const DAYOF_CONFIDENCE_CARDS = 6;
export const DAYOF_WALKTHROUGH_PAR = 90;
export const SPOT_CHECK_DAYS = 3;
export const FEEDBACK_SECONDS = 15; // reading the result between cards
export const FOLLOW_UP_PAR = 45;

export const DEFAULT_PAR = { number: 25, order: 45, matrix: 60, scenario: 90, story: 120, defect: 40 };

// Area priority for technical slots — data-hall relevance first (§4).
export const AREA_PRIORITY = ['Cx framework', 'Pre-action', 'Emergency power', 'Smoke control & FA FPT', 'Gaseous & ASD', 'BESS, gas & mist', 'Fire pump', 'Sprinkler & underground', 'Applied & refresher'];

const QUICK_TYPES = ['number', 'order', 'defect', 'matrix'];

export const isTechnical = (t) => t.area !== INTERVIEW_AREA;

// Not Tested topics are always due (plan-date gating is off); any other topic is due on
// its review date, pulled in to the cap (the day before the round) when it lies beyond.
export function isDue(topic, today, cap = null) {
  if (topic.rating === NOT_TESTED) return true;
  const d = topic.next_review;
  if (!d) return true;
  return (cap ? minDate(d, cap) : d) <= today;
}

function rank(list, value) {
  const i = list.indexOf(value);
  return i < 0 ? list.length : i;
}

// The normal queue order: rating (Not Ready → … → Locked In), then weight (Core →
// Support → Light), then plan day, then topics.json order.
export function compareQueue(a, b) {
  return (
    rank(RATING_ORDER, a.rating) - rank(RATING_ORDER, b.rating) ||
    rank(WEIGHT_ORDER, a.weight) - rank(WEIGHT_ORDER, b.weight) ||
    (a.day ?? 0) - (b.day ?? 0) ||
    (a._index ?? 0) - (b._index ?? 0)
  );
}

// Technical topics: rating, then weight, then area priority instead of plan day.
export function compareTechnical(a, b) {
  return (
    rank(RATING_ORDER, a.rating) - rank(RATING_ORDER, b.rating) ||
    rank(WEIGHT_ORDER, a.weight) - rank(WEIGHT_ORDER, b.weight) ||
    rank(AREA_PRIORITY, a.area) - rank(AREA_PRIORITY, b.area) ||
    (a._index ?? 0) - (b._index ?? 0)
  );
}

// Not Tested coverage runs by area priority first (§4), then weight.
function compareCoverage(a, b) {
  return rank(AREA_PRIORITY, a.area) - rank(AREA_PRIORITY, b.area) || rank(WEIGHT_ORDER, a.weight) - rank(WEIGHT_ORDER, b.weight) || a._index - b._index;
}

function indexed(topics) {
  return topics.map((t, i) => ({ ...t, _index: i }));
}

function strip(t) {
  const { _index, ...rest } = t;
  return rest;
}

export function dueQueue(topics, today, { cap = null, compare = compareQueue } = {}) {
  return indexed(topics)
    .filter((t) => isDue(t, today, cap))
    .sort(compare)
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

// Card choice within a technical topic (§4): scenario with follow-ups → scenario → defect
// → order → matrix → number. Walkthroughs are kept for their own slot; stories last.
export function technicalRank(card) {
  if (card.type === 'scenario') {
    if (card.walkthrough) return 6;
    return followUpsOf(card).length ? 0 : 1;
  }
  return { defect: 2, order: 3, matrix: 4, number: 5 }[card.type] ?? 7;
}

// The topic's most recent miss was a number or a code section → serve a Cold Number card.
export function lastMissWasNumber(history, topicId) {
  const mine = historyFor(history, topicId);
  for (let i = mine.length - 1; i >= 0; i--) {
    const h = mine[i];
    if (levelOf(h) === LEVEL_CLEAN) continue;
    return h.type === 'number' || /code section|no number/.test(h.note || '');
  }
  return false;
}

// Pick the next card for a topic: never a card already used today; not a card from the
// previous session if the topic has alternatives. Then, by `order`:
//  - 'technical' (§4): a Cold Number card if the last miss was a number or code section,
//    else technicalRank; then least recently seen; then bank order;
//  - default (drills, follow-up cards, spec §3.3): the type missed last time; then
//    auto-graded types before out-loud ones for ordinary slots; then least recently seen.
export function pickCard(topicId, ctx, { slot = 'coverage', exclude = [], avoidType = null, order = null } = {}) {
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

  const bankOrder = new Map(all.map((c, i) => [c.id, i]));
  let key;
  if (order === 'technical') {
    const numberFirst = lastMissWasNumber(history, topicId);
    key = (c) => [numberFirst && c.type === 'number' ? 0 : 1, technicalRank(c), lastSeen(history, c.id), bankOrder.get(c.id)];
  } else {
    const missedTypes = new Set(prev.filter((h) => levelOf(h) < LEVEL_CLEAN).map((h) => h.type));
    key = (c) => [
      missedTypes.has(c.type) ? 0 : 1,
      avoidType && c.type === avoidType ? 1 : 0,
      slot !== 'outloud' && OUT_LOUD.includes(c.type) ? 1 : 0,
      lastSeen(history, c.id),
      bankOrder.get(c.id),
    ];
  }
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

// §4. Technical focus, 15 cards: 6 redos + 6 coverage (12 technical), 1 walkthrough, 2
// behavioral. Behavioral focus, 15 cards: 8 Interview, 6 technical maintenance, 1
// walkthrough. Other sizes (Settings → cards per shift) scale.
export function shiftProfile(focus, size) {
  if (focus === 'behavioral') {
    const interview = Math.round((size * 8) / 15);
    const walkthrough = 1;
    const technical = Math.max(0, size - interview - walkthrough);
    return { focus, size, technical, redoCap: Math.round(technical / 2), walkthrough, interview };
  }
  const walkthrough = 1;
  const interview = Math.max(1, Math.round((size * 2) / 15));
  const technical = Math.max(0, size - walkthrough - interview);
  return { focus: 'technical', size, technical, redoCap: Math.round((size * 6) / 15), walkthrough, interview };
}

function makeCtx({ topics, cards, history = [], today }) {
  return { topics, cards, byTopic: cardsByTopic(cards), history, today, cardById: new Map(cards.map((c) => [c.id, c])) };
}

const cardSlot = (topicId, card, slot, extra = {}) => ({ topicId, cardId: card.id, type: card.type, slot, ...extra });

function slotFor(ctx, topic, slot, opts = {}) {
  const card = pickCard(topic.id, ctx, { slot: slot === 'outloud' ? 'outloud' : 'coverage', ...opts });
  return card ? cardSlot(topic.id, card, slot) : null;
}

// Seconds for a card and its follow-up layers, plus reading the result after each.
function slotSeconds(slot, card) {
  const main = (slot.par || card?.par || DEFAULT_PAR[card?.type] || 30) + FEEDBACK_SECONDS;
  if (!card || slot.chain === false) return main;
  return main + followUpsOf(card).reduce((s, f) => s + (f.par || FOLLOW_UP_PAR) + FEEDBACK_SECONDS, 0);
}

export function estimateMinutes(slots, cardById) {
  const secs = slots.reduce((s, x) => s + slotSeconds(x, cardById.get(x.cardId)), 0);
  return Math.max(1, Math.ceil(secs / 60));
}

const countOutLoud = (slots) => slots.filter((s) => OUT_LOUD.includes(s.type)).length;

function testedToday(history, today) {
  return new Set(history.filter((h) => h.date === today && h.rated !== false).map((h) => h.topicId));
}

function finish(shift, ctx) {
  return { ...shift, slots: shift.slots.map((s) => ({ ...s, done: false })), estimatedMinutes: estimateMinutes(shift.slots, ctx.cardById), outLoud: countOutLoud(shift.slots) };
}

// Topics still unclaimed in this shift. `take` claims a topic for one slot.
function claimer(ctx, done) {
  const used = new Set();
  const free = (t) => !used.has(t.id) && !done.has(t.id) && (ctx.byTopic.get(t.id) || []).length > 0;
  const take = (t, slot, opts) => {
    if (!free(t)) return null;
    const s = slotFor(ctx, t, slot, opts);
    if (s) used.add(t.id);
    return s;
  };
  // The first topic in `list` with a card passing `filter`, picked by the usual rules.
  const takeWhere = (list, filter, slot, opts = {}) => {
    for (const t of list) {
      if (!free(t)) continue;
      const pool = (ctx.byTopic.get(t.id) || []).filter(filter);
      if (!pool.length) continue;
      const card = pickCard(t.id, { ...ctx, byTopic: new Map([[t.id, pool]]) }, { slot: 'outloud', ...opts });
      if (card) {
        used.add(t.id);
        return cardSlot(t.id, card, slot);
      }
    }
    return null;
  };
  return { used, free, take, takeWhere };
}

// The walkthrough slot (§4): a card tagged walkthrough, rotating (least recently seen),
// preferring topics below Locked In. With no walkthrough card yet, a technical scenario
// (with follow-ups first) on a due topic below Locked In.
function walkthroughSlot(ctx, claim, techQueue) {
  const { history, cards } = ctx;
  const byTopic = new Map(ctx.topics.map((t) => [t.id, t]));
  const order = new Map(cards.map((c, i) => [c.id, i]));
  const usedToday = new Set(history.filter((h) => h.date === ctx.today).map((h) => h.cardId));
  const candidates = cards
    .filter((c) => c.walkthrough && byTopic.has(c.topicId) && isTechnical(byTopic.get(c.topicId)) && !usedToday.has(c.id))
    .sort((a, b) => {
      const below = (c) => (byTopic.get(c.topicId).rating === LOCKED_IN ? 1 : 0);
      return below(a) - below(b) || lastSeen(history, a.id).localeCompare(lastSeen(history, b.id)) || order.get(a.id) - order.get(b.id);
    });
  for (const c of candidates) {
    const t = byTopic.get(c.topicId);
    if (!claim.free(t)) continue;
    claim.used.add(t.id);
    return cardSlot(t.id, c, 'walkthrough');
  }
  const below = techQueue.filter((t) => t.rating !== LOCKED_IN);
  return claim.takeWhere(below, (c) => c.type === 'scenario' && followUpsOf(c).length, 'walkthrough') || claim.takeWhere(below, (c) => c.type === 'scenario', 'walkthrough');
}

// Technical slots (redos, coverage with one spot check, then anything else due), by the
// technical rules. Used by both profiles.
function technicalSlots(ctx, claim, { count, redoCap, techQueue, today }) {
  const opts = { order: 'technical' };
  const redos = [];
  for (const t of techQueue.filter((q) => q.rating === NOT_READY || q.rating === NEEDS_IMPROVEMENT)) {
    if (redos.length >= redoCap) break;
    const s = claim.take(t, 'redo', opts);
    if (s) redos.push(s);
  }
  const coverageCount = count - redos.length;
  const notTested = indexed(techQueue.filter((q) => q.rating === NOT_TESTED)).sort(compareCoverage).map(strip);
  const minorDue = techQueue.filter((q) => q.rating === MINOR_REFRESH);
  const spotCandidates = indexed(ctx.topics.filter(isTechnical))
    .filter((t) => t.rating === LOCKED_IN && t.last_tested && daysBetween(t.last_tested, today) >= SPOT_CHECK_DAYS)
    .sort((a, b) => (techQueue.some((q) => q.id === b.id) - techQueue.some((q) => q.id === a.id)) || rank(WEIGHT_ORDER, a.weight) - rank(WEIGHT_ORDER, b.weight) || a.last_tested.localeCompare(b.last_tested) || a._index - b._index)
    .map(strip);
  let spot = null;
  for (const t of spotCandidates) {
    if (coverageCount <= 0) break;
    spot = claim.take(t, 'spot', opts);
    if (spot) break;
  }
  const coverage = [];
  const room = coverageCount - (spot ? 1 : 0);
  for (const t of [...notTested, ...minorDue]) {
    if (coverage.length >= room) break;
    const s = claim.take(t, 'coverage', opts);
    if (s) coverage.push(s);
  }
  if (spot) coverage.push(spot);
  // Coverage ran short: whatever else is due, in queue order.
  for (const t of techQueue) {
    if (redos.length + coverage.length >= count) break;
    const s = claim.take(t, 'fill', opts);
    if (s) coverage.push(s);
  }
  return [...redos, ...coverage];
}

// The Interview queue in the normal order: due topics first, then the rest, least
// recently tested first, so the behavioral slots always have somewhere to go.
function interviewQueue(topics, today, cap) {
  const all = topics.filter((t) => !isTechnical(t));
  const due = dueQueue(all, today, { cap });
  const rest = indexed(all.filter((t) => !due.some((d) => d.id === t.id)))
    .sort((a, b) => (a.last_tested || '').localeCompare(b.last_tested || '') || compareQueue(a, b))
    .map(strip);
  return [...due, ...rest];
}

const isStory = (c) => c.type === 'story';
const hasChain = (c) => followUpsOf(c).length > 0;
const isBackupTopic = (c) => c.topicId === 'I8'; // the backup stories (story-scripts "Backups")

// Interview slots in a technical shift (§4): one story with follow-ups, then one drill
// ladder or backup story.
function behavioralPair(claim, queue) {
  const story =
    claim.takeWhere(queue, (c) => isStory(c) && hasChain(c) && !c.ladder, 'story') ||
    claim.takeWhere(queue, (c) => isStory(c) && !c.ladder, 'story') ||
    claim.takeWhere(queue, (c) => OUT_LOUD.includes(c.type), 'story');
  const drill =
    claim.takeWhere(queue, (c) => isStory(c) && (c.ladder || isBackupTopic(c)), 'drill') ||
    claim.takeWhere(queue, isStory, 'drill') ||
    claim.takeWhere(queue, (c) => OUT_LOUD.includes(c.type), 'drill');
  return [story, drill].filter(Boolean);
}

// Interview card choice in a behavioral shift: stories with follow-ups (ladders included)
// → stories → scenarios → anything else; then the usual rules.
function interviewRank(c) {
  if (isStory(c)) return hasChain(c) ? 0 : 1;
  if (c.type === 'scenario') return hasChain(c) ? 2 : 3;
  return 4;
}

function interviewSlots(ctx, claim, queue, count) {
  const slots = [];
  for (const t of queue) {
    if (slots.length >= count) break;
    if (!claim.free(t)) continue;
    const ranks = [...new Set((ctx.byTopic.get(t.id) || []).map(interviewRank))].sort((a, b) => a - b);
    for (const r of ranks) {
      const s = claim.takeWhere([t], (c) => interviewRank(c) === r, 'interview', { slot: 'coverage' });
      if (s) {
        slots.push(s);
        break;
      }
    }
  }
  return slots;
}

// The daily shift. Returns a plain object (safe to persist mid-shift).
export function buildShift({ topics, cards, history = [], today, settings = {} }) {
  const nextRound = normalizeNextRound(settings.nextRound);
  const mode = dayMode(today, nextRound);
  const ctx = makeCtx({ topics, cards, history, today });
  if (mode === 'dayof') return dayOfPlan({ topics, cards, history, today, focus: nextRound.focus });
  if (mode === 'after') return { date: today, mode, focus: nextRound.focus, size: 0, slots: [], estimatedMinutes: 0, outLoud: 0 };

  const cap = reviewCap(today, nextRound);
  const claim = claimer(ctx, testedToday(history, today));
  const techQueue = dueQueue(topics.filter(isTechnical), today, { cap, compare: compareTechnical });

  if (mode === 'sweep') {
    // date − 1: every topic not Locked In (technical topics only in technical focus), up to 20.
    const pool = indexed(topics.filter((t) => t.rating !== LOCKED_IN && (nextRound.focus === 'behavioral' || isTechnical(t))))
      .sort(nextRound.focus === 'behavioral' ? compareQueue : compareTechnical)
      .map(strip);
    const slots = [];
    for (const t of pool) {
      if (slots.length >= SWEEP_MAX) break;
      const s = claim.take(t, 'sweep', { order: isTechnical(t) ? 'technical' : null });
      if (s) slots.push(s);
    }
    return finish({ date: today, mode, focus: nextRound.focus, size: SWEEP_MAX, slots }, ctx);
  }

  const size = settings.cardsPerShift || DEFAULT_SHIFT;
  const p = shiftProfile(nextRound.focus, size);
  const iq = interviewQueue(topics, today, cap);
  // The walkthrough is chosen first so its topic isn't spent on an ordinary slot.
  const walk = walkthroughSlot(ctx, claim, techQueue);
  let slots;
  if (p.focus === 'behavioral') {
    const interview = interviewSlots(ctx, claim, iq, p.interview);
    const tech = technicalSlots(ctx, claim, { count: p.technical, redoCap: p.redoCap, techQueue, today });
    slots = [...interview, ...tech, ...(walk ? [walk] : [])];
  } else {
    const tech = technicalSlots(ctx, claim, { count: p.technical, redoCap: p.redoCap, techQueue, today });
    const pair = behavioralPair(claim, iq).slice(0, p.interview);
    slots = [...tech, ...(walk ? [walk] : []), ...pair];
  }
  return finish({ date: today, mode, focus: p.focus, size, slots }, ctx);
}

// Called after every graded card in a shift. `history` already contains the
// new result. Returns the updated shift:
//  - a clean first answer on a topic that needs 2 distinct clean cards gets a
//    follow-up card on the same topic right after it (the "follow-up handled"
//    of Locked In); the shift grows by one card — nothing is displaced, so
//    `slots.length` can exceed the planned `size`;
//  - on the sweep day a missed card gets one redo at the end of the shift.
export function afterResult(shift, slotIndex, { topics, cards, history, today }) {
  const ctx = makeCtx({ topics, cards, history, today });
  const slots = shift.slots.map((s, i) => (i === slotIndex ? { ...s, done: true } : { ...s }));
  const current = slots[slotIndex];
  const topic = topics.find((t) => t.id === current.topicId);
  const results = todaysResults(history, current.topicId, today);
  const last = results[results.length - 1];
  if (!topic || !last || shift.mode === 'dayof') return { ...shift, slots };

  const available = (ctx.byTopic.get(topic.id) || []).length;
  const required = cleanCardsRequired(topic.weight, available);
  const allClean = results.every((r) => levelOf(r) === LEVEL_CLEAN);
  const cleanCards = new Set(results.map((r) => r.cardId)).size;
  const laterSameTopic = slots.some((s, i) => i > slotIndex && !s.done && s.topicId === topic.id);

  if (allClean && cleanCards < required && !laterSameTopic) {
    const planned = slots.filter((s) => !s.done).map((s) => s.cardId);
    const card = pickCard(topic.id, ctx, { exclude: planned, avoidType: current.type });
    if (card) slots.splice(slotIndex + 1, 0, { ...cardSlot(topic.id, card, 'followup'), done: false });
  }

  if (shift.mode === 'sweep' && last.result === 'missed' && current.slot !== 'redo') {
    const already = slots.some((s) => s.slot === 'redo' && s.topicId === topic.id);
    if (!already) {
      const planned = slots.filter((s) => !s.done).map((s) => s.cardId);
      const card = pickCard(topic.id, ctx, { exclude: planned }) || ctx.cardById.get(current.cardId);
      slots.push({ ...cardSlot(topic.id, card, 'redo'), done: false });
    }
  }

  const left = slots.filter((s) => !s.done);
  return { ...shift, slots, estimatedMinutes: estimateMinutes(left, ctx.cardById), outLoud: countOutLoud(slots) };
}

// "Keep going": the next 5 due topics not yet tested today. Technical focus takes the
// technical queue first (technical card choice), then the Interview queue.
export function keepGoing({ topics, cards, history = [], today, settings = {}, exclude = [], count = KEEP_GOING_BATCH }) {
  const nextRound = normalizeNextRound(settings.nextRound);
  const cap = reviewCap(today, nextRound);
  const ctx = makeCtx({ topics, cards, history, today });
  const done = testedToday(history, today);
  const skip = new Set(exclude);
  const queue =
    nextRound.focus === 'technical'
      ? [...dueQueue(topics.filter(isTechnical), today, { cap, compare: compareTechnical }), ...dueQueue(topics.filter((t) => !isTechnical(t)), today, { cap })]
      : dueQueue(topics, today, { cap });
  const slots = [];
  for (const t of queue) {
    if (slots.length >= count) break;
    if (done.has(t.id) || skip.has(t.id)) continue;
    const s = slotFor(ctx, t, 'coverage', isTechnical(t) ? { order: 'technical' } : {});
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
    slots.push(cardSlot(topicId, card, 'drill'));
  }
  return finish({ date: today, mode: 'drill', size: slots.length, slots }, ctx);
}

// The hook-line card of "Story N" (its story card, not a drill ladder).
function storyCard(cards, n) {
  const re = new RegExp(`^Story ${n}\\b`);
  return cards.find((c) => isStory(c) && !c.ladder && re.test(c.prompt || '') && (c.answer?.beats || []).some((b) => b && b.kind === 'hook')) || null;
}

// Day-of mode (the round's date, §2). Results are recorded but never rated.
//  - technical focus: six quick confidence cards from Locked In technical topics (Minor
//    Refresh if short), then one walkthrough as a 90 s warm-up (main answer only);
//  - behavioral focus: six quick Locked In cards, the 60-second intro (I1), then the hook
//    lines of Story 1 and Story 3.
export function dayOfPlan({ topics, cards, history = [], today, focus = 'technical' }) {
  const ctx = makeCtx({ topics, cards, history, today });
  const strong = [LOCKED_IN, MINOR_REFRESH];
  const pool = indexed(topics.filter((t) => strong.includes(t.rating) && (focus === 'behavioral' || isTechnical(t))))
    .sort((a, b) => rank(strong, a.rating) - rank(strong, b.rating) || rank(WEIGHT_ORDER, a.weight) - rank(WEIGHT_ORDER, b.weight) || (focus === 'technical' ? rank(AREA_PRIORITY, a.area) - rank(AREA_PRIORITY, b.area) : 0) || a._index - b._index)
    .map(strip);
  const slots = [];
  for (const t of pool) {
    if (slots.length >= DAYOF_CONFIDENCE_CARDS) break;
    const own = (ctx.byTopic.get(t.id) || []).filter((c) => QUICK_TYPES.includes(c.type));
    if (!own.length) continue;
    const card = pickCard(t.id, { ...ctx, byTopic: new Map([[t.id, own]]) });
    if (card) slots.push(cardSlot(t.id, card, 'confidence'));
  }
  if (focus === 'technical') {
    const tById = new Map(topics.map((t) => [t.id, t]));
    const strength = (c) => rank(strong, tById.get(c.topicId)?.rating);
    const order = new Map(cards.map((c, i) => [c.id, i]));
    const walks = cards.filter((c) => c.walkthrough && tById.has(c.topicId)).sort((a, b) => strength(a) - strength(b) || lastSeen(history, a.id).localeCompare(lastSeen(history, b.id)) || order.get(a.id) - order.get(b.id));
    const warm = walks[0] || cards.find((c) => c.type === 'scenario' && tById.has(c.topicId) && isTechnical(tById.get(c.topicId)) && strength(c) < strong.length);
    if (warm) slots.push(cardSlot(warm.topicId, warm, 'warmup', { par: DAYOF_WALKTHROUGH_PAR, chain: false }));
  } else {
    const intro = (ctx.byTopic.get('I1') || []).find(isStory);
    if (intro) slots.push(cardSlot('I1', intro, 'intro'));
    for (const n of [1, 3]) {
      const c = storyCard(cards, n);
      if (c) slots.push(cardSlot(c.topicId, c, 'hook'));
    }
  }
  return finish({ date: today, mode: 'dayof', focus, size: slots.length, slots }, ctx);
}

// Number Blitz deck: number cards from Locked In and Minor Refresh topics.
export function blitzDeck({ topics, cards }) {
  const ok = new Set(topics.filter((t) => t.rating === LOCKED_IN || t.rating === MINOR_REFRESH).map((t) => t.id));
  return cards.filter((c) => c.type === 'number' && ok.has(c.topicId));
}
