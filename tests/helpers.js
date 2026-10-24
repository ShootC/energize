import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function readJson(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}

export function readText(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

export const shippedTopics = () => readJson('content/topics.json');
export const sampleCards = () => readJson('src/data/sample.json');

// A synthetic bank for scheduler tests: every technical topic gets two number
// cards, an order card and a scenario; every Interview topic gets two stories.
export function syntheticBank(topics) {
  const cards = [];
  for (const t of topics) {
    const mk = (type, abbr, n, extra = {}) => ({ id: `${t.id}-${abbr}-0${n}`, topicId: t.id, type, par: 30, ...extra });
    if (t.area === 'Interview') {
      cards.push(mk('story', 'sty', 1), mk('story', 'sty', 2));
    } else {
      cards.push(mk('number', 'num', 1), mk('number', 'num', 2), mk('order', 'ord', 1), mk('scenario', 'scn', 1));
    }
  }
  return cards;
}

export function topic(overrides = {}) {
  return {
    id: 'X1',
    area: 'Cx framework',
    topic: 'test topic',
    day: 1,
    plan_date: '2026-10-20',
    weight: 'Core',
    studied: 'Done',
    rating: 'Not Tested',
    points: 0,
    tests: 0,
    streak: 0,
    last_tested: '',
    next_review: '2026-10-21',
    last_result: '',
    ...overrides,
  };
}

export function result(cardId, res, extra = {}) {
  return { cardId, topicId: extra.topicId || 'X1', type: extra.type || 'number', result: res, framework: res !== 'missed' || !!extra.framework, date: extra.date || '2026-10-24', note: extra.note || res, ...extra };
}

export class MemoryStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(k) {
    return this.map.has(k) ? this.map.get(k) : null;
  }
  setItem(k, v) {
    this.map.set(k, String(v));
  }
  removeItem(k) {
    this.map.delete(k);
  }
}
