// Mock interview (spec §4.8): questions self-graded on beats like a scenario
// card, then a one-screen debrief. Never changes topic ratings. Round decks
// (GAME_SPEC_ROUND2 §7) ask follow-ups with beats; each is graded as a layer and
// the question takes the worst, like a card's follow-up chain.

import { beatLabel, gradeLayer } from './grader.js';

const isFillIn = (b) => !!(b && typeof b === 'object' && b.fillIn);

// A question needs "I said a number" unless it says otherwise; by default only
// when the model answer itself carries a number (stories always do).
export function mockRequiresNumber(question) {
  if (typeof question.requiresNumber === 'boolean') return question.requiresNumber;
  return question.beats.some((b) => !isFillIn(b) && /\d/.test(beatLabel(b)));
}

// The follow-ups a question asks: the v1 single `followUp` string, or `followUps[]`.
export function mockFollowUps(question) {
  if (Array.isArray(question.followUps)) return question.followUps;
  return question.followUp ? [{ prompt: question.followUp }] : [];
}

const LEVEL = (g) => (g.result === 'clean' ? 3 : g.result === 'slipped' ? 2 : g.framework ? 1 : 0);

// response = { hits: [bool per beat], saidNumber, seconds, followUps: [{ hits }] }.
// Main answer: problems = beats missed + no number (when required) + over par
// (rambling); 0 = clean, 1 = slipped (close), more = missed; framework if ≥ half
// the beats. Follow-ups with beats are layers; the question takes the worst.
export function gradeMockAnswer(question, response = {}) {
  const main = gradeMain(question, response);
  const graded = mockFollowUps(question)
    .map((f, k) => ({ f, k }))
    .filter(({ f }) => Array.isArray(f.beats) && f.beats.length);
  if (!graded.length) return main;
  const given = response.followUps || [];
  const layers = [{ id: 'main', ...main }, ...graded.map(({ f, k }) => ({ id: `f${k + 1}`, k, kind: f.kind || null, ...gradeLayer(f, given[k]) }))];
  let worst = 0;
  layers.forEach((l, i) => {
    if (l.graded !== false && LEVEL(l) < LEVEL(layers[worst])) worst = i;
  });
  const w = layers[worst];
  const hit = main.hit + layers.slice(1).reduce((s, l) => s + l.detail.hit, 0);
  const beats = main.beats + layers.slice(1).reduce((s, l) => s + l.detail.beats, 0);
  const note = worst === 0 ? main.note : `follow-up ${w.k + 1}: ${w.note.replace(/^\w+: /, '')}`;
  return {
    ...main,
    result: w.result,
    framework: w.result === 'missed' ? w.framework : true,
    hit,
    beats,
    note,
    layers: layers.map((l) => ({ id: l.id, result: l.result, framework: l.framework })),
  };
}

function gradeMain(question, response) {
  const hits = response.hits || [];
  const graded = question.beats.map((b, i) => ({ b, i })).filter(({ b }) => !isFillIn(b));
  const hit = graded.filter(({ i }) => hits[i]).length;
  const missedBeats = graded.length - hit;
  const requiresNumber = mockRequiresNumber(question);
  const noNumber = requiresNumber && !response.saidNumber;
  const seconds = typeof response.seconds === 'number' ? response.seconds : null;
  const overPar = seconds != null && question.par != null && seconds > question.par;
  const problems = missedBeats + (noNumber ? 1 : 0) + (overPar ? 1 : 0);
  const result = problems === 0 ? 'clean' : problems === 1 ? 'slipped' : 'missed';
  const framework = result !== 'missed' || hit >= Math.ceil(graded.length / 2);
  const notes = [];
  if (missedBeats) notes.push(`${missedBeats} beat${missedBeats > 1 ? 's' : ''} missed`);
  if (noNumber) notes.push('no number');
  if (overPar) notes.push(`over par by ${Math.round(seconds - question.par)} s`);
  return { result, framework, hit, beats: graded.length, requiresNumber, overPar, seconds, problems, note: notes.join(', ') || 'clean' };
}

// The morning-quiz headline over the questions answered.
export function mockHeadline(grades) {
  const n = grades.length;
  const framework = grades.filter((g) => g.framework).length;
  const close = grades.filter((g) => g.result === 'slipped').length;
  const clean = grades.filter((g) => g.result === 'clean').length;
  return { total: n, framework, close, clean, text: `${framework} of ${n} framework right · ${close} close · ${clean} clean` };
}

const RANK = { missed: 0, slipped: 1, clean: 2 };

// Weakest answer: worst result, then fewest beats hit (as a share), then the
// longest overrun. Returns the index into grades, or -1.
export function weakestAnswer(grades) {
  let best = -1;
  grades.forEach((g, i) => {
    if (best < 0) return void (best = i);
    const b = grades[best];
    const key = (x) => [RANK[x.result], x.beats ? x.hit / x.beats : 1, -(x.overPar ? x.seconds : 0)];
    const [r1, s1, o1] = key(g);
    const [r2, s2, o2] = key(b);
    if (r1 < r2 || (r1 === r2 && (s1 < s2 || (s1 === s2 && o1 < o2)))) best = i;
  });
  return best;
}
