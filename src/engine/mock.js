// Mock interview (spec §4.8): five questions, self-graded on beats like a
// scenario card, then a one-screen debrief. Never changes topic ratings.

import { beatLabel } from './grader.js';

const isFillIn = (b) => !!(b && typeof b === 'object' && b.fillIn);

// A question needs "I said a number" unless it says otherwise; by default only
// when the model answer itself carries a number (stories always do).
export function mockRequiresNumber(question) {
  if (typeof question.requiresNumber === 'boolean') return question.requiresNumber;
  return question.beats.some((b) => !isFillIn(b) && /\d/.test(beatLabel(b)));
}

// response = { hits: [bool per beat], saidNumber, seconds }.
// Problems = beats missed + no number (when required) + over par (rambling).
// 0 = clean, 1 = slipped (close), more = missed; framework if ≥ half the beats.
export function gradeMockAnswer(question, response = {}) {
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
