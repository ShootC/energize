// Game state: load / save / export / import, topics.json import, history.
// Storage is injected (anything with getItem / setItem / removeItem), so this
// module runs in Node tests and in the browser alike.

import { applySession, xpForResult, XP } from './rating.js';
import { campusStatus } from './campus.js';
import { addDays } from './dates.js';

export const STATE_VERSION = 1;
export const STORAGE_KEY = 'energize.state.v1';

export const TOPIC_FIELDS = ['id', 'area', 'topic', 'day', 'plan_date', 'weight', 'studied', 'rating', 'points', 'tests', 'streak', 'last_tested', 'next_review', 'last_result'];
const RATINGS = ['Locked In', 'Minor Refresh', 'Needs Improvement', 'Not Ready', 'Not Tested'];
const WEIGHT_NAMES = ['Core', 'Support', 'Light'];

export const DEFAULT_SETTINGS = {
  cardsPerShift: null, // null = the day's default (15, 10 in cutover week, 20 on Nov 1)
  sound: true,
  haptics: true,
};

function clone(x) {
  return JSON.parse(JSON.stringify(x));
}

// Keep only the topics.json fields, in topics.json order.
export function topicRecord(t) {
  const out = {};
  for (const k of TOPIC_FIELDS) out[k] = t[k] ?? (k === 'points' || k === 'tests' || k === 'streak' || k === 'day' ? 0 : '');
  return out;
}

export function validateTopics(topics) {
  const errors = [];
  if (!Array.isArray(topics)) return ['topics must be an array'];
  const ids = new Set();
  topics.forEach((t, i) => {
    const where = `topic[${i}]${t && t.id ? ` (${t.id})` : ''}`;
    if (!t || typeof t !== 'object') return errors.push(`${where}: not an object`);
    for (const k of TOPIC_FIELDS) if (!(k in t)) errors.push(`${where}: missing ${k}`);
    if (ids.has(t.id)) errors.push(`${where}: duplicate id`);
    ids.add(t.id);
    if (!RATINGS.includes(t.rating)) errors.push(`${where}: unknown rating ${JSON.stringify(t.rating)}`);
    if (!WEIGHT_NAMES.includes(t.weight)) errors.push(`${where}: unknown weight ${JSON.stringify(t.weight)}`);
  });
  return errors;
}

export function createState(topics, { today = null } = {}) {
  const errors = validateTopics(topics);
  if (errors.length) throw new Error(`Invalid topics: ${errors.slice(0, 5).join('; ')}`);
  const state = {
    version: STATE_VERSION,
    topics: topics.map(topicRecord),
    history: [],
    xp: 0,
    dayStreak: 0,
    lastShiftDate: null,
    blitzBest: 0,
    energized: [],
    settings: { ...DEFAULT_SETTINGS },
    // Per-topic record as it stood before today's first result, so a day's
    // results can be re-applied as one session.
    snapshots: {},
    currentShift: null,
    createdOn: today,
  };
  state.energized = campusStatus(state.topics).filter((b) => b.energized).map((b) => b.id);
  return state;
}

// Cards in the bank per topic (for the "2 distinct clean cards" rule).
function countByTopic(cards) {
  const m = {};
  for (const c of cards || []) m[c.topicId] = (m[c.topicId] || 0) + 1;
  return m;
}

// Record one graded card. `rated: false` (Blitz, interview-day confidence
// cards) logs history but never touches ratings.
// Returns { state, topicBefore, topicAfter, xp, newlyEnergized }.
export function recordResult(state, { card, grade, seconds = null, date, mode = 'shift', rated = true, cards = [] }) {
  const next = clone(state);
  const entry = {
    topicId: card.topicId,
    cardId: card.id,
    type: card.type,
    result: grade.result,
    framework: grade.framework,
    note: grade.note,
    seconds: seconds == null ? null : Math.round(seconds),
    date,
    mode,
    rated,
    codeUnprompted: !!grade.codeUnprompted,
  };
  entry.xp = xpForResult(entry, card);
  next.history.push(entry);
  next.xp += entry.xp;

  const idx = next.topics.findIndex((t) => t.id === card.topicId);
  if (idx < 0) throw new Error(`Card ${card.id} points at unknown topic ${card.topicId}`);
  const topicBefore = next.topics[idx];
  let topicAfter = topicBefore;

  if (rated) {
    const snap = next.snapshots[card.topicId];
    if (!snap || snap.date !== date) next.snapshots[card.topicId] = { date, record: clone(topicBefore) };
    const before = next.snapshots[card.topicId].record;
    const results = next.history.filter((h) => h.topicId === card.topicId && h.date === date && h.rated !== false);
    const available = countByTopic(cards)[card.topicId] || Infinity;
    topicAfter = applySession(before, results, date, { cardsAvailable: available });
    next.topics[idx] = topicAfter;
  }

  const was = new Set(next.energized);
  const nowOn = campusStatus(next.topics).filter((b) => b.energized).map((b) => b.id);
  next.energized = nowOn;
  const newlyEnergized = nowOn.filter((id) => !was.has(id));

  return { state: next, topicBefore, topicAfter, xp: entry.xp, newlyEnergized };
}

// Daily shift completed: +50 XP once per day and the day streak flame.
export function completeShift(state, date) {
  const next = clone(state);
  if (next.lastShiftDate === date) return next;
  next.xp += XP.shiftComplete;
  next.dayStreak = next.lastShiftDate === addDays(date, -1) ? next.dayStreak + 1 : 1;
  next.lastShiftDate = date;
  return next;
}

// The flame shows a broken streak as 0 without ever touching ratings.
export function currentDayStreak(state, today) {
  if (!state.lastShiftDate) return 0;
  if (state.lastShiftDate === today || state.lastShiftDate === addDays(today, -1)) return state.dayStreak;
  return 0;
}

export function setBlitzScore(state, score) {
  const next = clone(state);
  next.blitzBest = Math.max(next.blitzBest || 0, score);
  return next;
}

// ---------- persistence ----------

export function save(storage, state) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Returns the saved state, or null if there is none or it can't be read.
export function load(storage) {
  let raw;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    return migrate(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clear(storage) {
  storage.removeItem(STORAGE_KEY);
}

function migrate(s) {
  if (!s || typeof s !== 'object' || !Array.isArray(s.topics)) throw new Error('Not an ENERGIZE state');
  return {
    version: STATE_VERSION,
    history: [],
    xp: 0,
    dayStreak: 0,
    lastShiftDate: null,
    blitzBest: 0,
    energized: [],
    snapshots: {},
    currentShift: null,
    createdOn: null,
    ...s,
    settings: { ...DEFAULT_SETTINGS, ...(s.settings || {}) },
  };
}

// ---------- export / import ----------

// Full state.json: the topic records exactly as in topics.json plus history,
// xp, dayStreak, blitzBest, energized and settings.
export function exportState(state) {
  return JSON.stringify(
    {
      version: STATE_VERSION,
      topics: state.topics.map(topicRecord),
      history: state.history,
      xp: state.xp,
      dayStreak: state.dayStreak,
      lastShiftDate: state.lastShiftDate,
      blitzBest: state.blitzBest,
      energized: state.energized,
      settings: state.settings,
      snapshots: state.snapshots,
    },
    null,
    1,
  );
}

// topics.json shape only — to paste back into the chat tracker.
export function exportTopics(state) {
  return JSON.stringify(state.topics.map(topicRecord), null, 1);
}

// Accepts either a topics.json array (ratings carry over; history, XP and
// settings are kept) or a full state.json object (replaces everything).
export function importJson(state, text) {
  let data;
  try {
    data = typeof text === 'string' ? JSON.parse(text) : text;
  } catch (e) {
    throw new Error(`Not valid JSON: ${e.message}`);
  }
  if (Array.isArray(data)) {
    const errors = validateTopics(data);
    if (errors.length) throw new Error(`Not a valid topics.json: ${errors.slice(0, 5).join('; ')}`);
    const next = clone(state);
    next.topics = data.map(topicRecord);
    next.snapshots = {};
    next.currentShift = null;
    next.energized = campusStatus(next.topics).filter((b) => b.energized).map((b) => b.id);
    return { state: next, kind: 'topics' };
  }
  if (data && typeof data === 'object' && Array.isArray(data.topics)) {
    const errors = validateTopics(data.topics);
    if (errors.length) throw new Error(`Not a valid state.json: ${errors.slice(0, 5).join('; ')}`);
    const next = migrate(data);
    next.topics = data.topics.map(topicRecord);
    next.currentShift = null;
    return { state: next, kind: 'state' };
  }
  throw new Error('Expected a topics.json array or a state.json object');
}
