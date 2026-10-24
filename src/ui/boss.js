// Mock Interview — the boss fight (spec §4.8). Five questions from
// src/data/mock.json, each with a timer and a follow-up, self-graded on beats,
// then a one-screen debrief. Practice only: never changes topic ratings.

import { h, mount, mmss } from './dom.js';
import { timerBar } from './cards.js';
import { beatLabel } from '../engine/grader.js';
import { gradeMockAnswer, mockHeadline, weakestAnswer, mockRequiresNumber } from '../engine/mock.js';

const FOLLOW_UP_SECONDS = 45;
const RESULT_WORD = { clean: 'Clean', slipped: 'Close', missed: 'Missed' };

function deckMinutes(deck) {
  return Math.round(deck.questions.reduce((s, q) => s + q.par + FOLLOW_UP_SECONDS + 30, 0) / 60);
}

export function mockScreen({ mock, todaysDeck = null, onBack, onSource, onCard }) {
  const root = h('main', { class: 'mock' });
  const decks = (mock && mock.decks) || [];
  showList();
  return root;

  function showList() {
    window.scrollTo(0, 0);
    mount(
      root,
      h('button', { class: 'btn back', type: 'button', onclick: onBack }, '← Campus'),
      h('h1', {}, 'Mock interview'),
      h('p', { class: 'hint' }, 'Five questions: two technical, three values. Answer out loud against the clock, take the follow-up, then tick the beats you actually hit. Practice only — ratings don’t move.'),
      decks.length
        ? h(
            'ul',
            { class: 'deck-list' },
            decks.map((d, i) =>
              h(
                'li',
                {},
                h(
                  'button',
                  { class: `deck-row${todaysDeck === i + 1 ? ' today' : ''}`, type: 'button', id: `deck-${d.id}`, onclick: () => run(d) },
                  h('span', { class: 'dr-title' }, d.title),
                  h('span', { class: 'dr-time num' }, `~${deckMinutes(d)} min`),
                  h('span', { class: 'dr-qs' }, d.questions.map((q) => (q.kind === 'technical' ? 'T' : 'V')).join(' · ')),
                  todaysDeck === i + 1 ? h('span', { class: 'dr-today' }, 'on today’s plan') : null,
                ),
              ),
            ),
          )
        : h('p', {}, 'No mock decks in src/data/mock.json.'),
    );
  }

  function run(deck) {
    const grades = [];
    let i = 0;
    ask();

    function header(stage) {
      const q = deck.questions[i];
      return h(
        'div',
        { class: 'mock-head' },
        h('div', { class: 'progress-top' }, h('span', { class: 'progress-label num' }, `${deck.title} · question ${i + 1} of ${deck.questions.length}`), h('button', { class: 'btn ghost small', type: 'button', onclick: showList }, 'Quit')),
        h('div', { class: 'dots' }, deck.questions.map((_, k) => h('span', { class: `dot${k < i ? ' is-done' : ''}${k === i ? ' now' : ''}` }))),
        h('p', { class: 'mock-kind' }, h('span', { class: `kind k-${q.kind}` }, q.kind === 'technical' ? 'Technical' : 'Values'), h('span', { class: 'stage' }, stage)),
      );
    }

    function ask() {
      window.scrollTo(0, 0);
      const q = deck.questions[i];
      const timer = timerBar({ total: q.par, kind: 'countdown' });
      const next = h('button', { class: 'btn primary big', type: 'button', id: 'mock-done' }, 'Done — take the follow-up');
      next.addEventListener('click', () => {
        const seconds = timer.elapsed();
        timer.stop();
        follow(seconds);
      });
      mount(
        root,
        header('Answer'),
        h('section', { class: 'card mock-card' }, h('p', { class: 'mock-q' }, `“${q.prompt}”`), h('p', { class: 'hint' }, `Out loud, ${mmss(Math.min(90, q.par))}–${mmss(q.par)}. Hook, decision with a reason, a number, the lesson — then stop.`), timer.el, next),
      );
    }

    function follow(seconds) {
      window.scrollTo(0, 0);
      const q = deck.questions[i];
      const timer = timerBar({ total: FOLLOW_UP_SECONDS, kind: 'countdown' });
      const next = h('button', { class: 'btn primary big', type: 'button', id: 'mock-reveal' }, 'Reveal the model answer');
      next.addEventListener('click', () => {
        timer.stop();
        reveal(seconds);
      });
      mount(
        root,
        header('Follow-up'),
        h('section', { class: 'card mock-card' }, h('p', { class: 'hint' }, `They follow up (your answer ran ${mmss(seconds)}):`), h('p', { class: 'mock-q' }, `“${q.followUp}”`), h('p', { class: 'hint' }, 'Fifteen seconds is plenty. Answer it straight.'), timer.el, next),
      );
    }

    function reveal(seconds) {
      window.scrollTo(0, 0);
      const q = deck.questions[i];
      const boxes = q.beats.map((b, k) => h('input', { type: 'checkbox', id: `mb${k}` }));
      const needNumber = mockRequiresNumber(q);
      const num = h('input', { type: 'checkbox', id: 'mbnum' });
      const grade = h('button', { class: 'btn primary big', type: 'button', id: 'mock-grade' }, i + 1 < deck.questions.length ? 'Grade it · next question' : 'Grade it · debrief');
      grade.addEventListener('click', () => {
        grades.push(gradeMockAnswer(q, { hits: boxes.map((x) => x.checked), saidNumber: needNumber ? num.checked : true, seconds }));
        i += 1;
        if (i < deck.questions.length) ask();
        else debrief();
      });
      mount(
        root,
        header('Grade it'),
        h(
          'section',
          { class: 'card mock-card' },
          h('p', { class: 'mock-q small' }, `“${q.prompt}”`),
          h('p', { class: 'hint' }, `Answer ran ${mmss(seconds)} against a par of ${mmss(q.par)}${seconds > q.par ? ' — over par counts as a slip' : ''}. Tick only what you said.`),
          h('ul', { class: 'beats' }, q.beats.map((b, k) => h('li', { class: 'beat' }, h('label', { for: `mb${k}` }, boxes[k], h('span', {}, beatLabel(b)))))),
          needNumber ? h('label', { class: 'row-check extra', for: 'mbnum' }, num, h('span', {}, 'I said a number')) : null,
          grade,
        ),
      );
    }

    function debrief() {
      window.scrollTo(0, 0);
      const head = mockHeadline(grades);
      const w = weakestAnswer(grades);
      const weak = w >= 0 ? deck.questions[w] : null;
      const reread = [];
      deck.questions.forEach((q, k) => {
        if (grades[k].result !== 'clean' && !reread.some((r) => r.source === q.source && r.cardId === q.cardId)) reread.push(q);
      });
      mount(
        root,
        h('h1', {}, `${deck.title} · debrief`),
        h('p', { class: 'headline', id: 'mock-headline' }, head.text),
        h(
          'ol',
          { class: 'mock-results' },
          deck.questions.map((q, k) =>
            h(
              'li',
              { class: `mr-${grades[k].result}${grades[k].result === 'missed' && !grades[k].framework ? ' nr' : ''}` },
              h('span', { class: 'mr-word' }, RESULT_WORD[grades[k].result]),
              h('span', { class: 'mr-q' }, q.prompt),
              h('span', { class: 'mr-note num' }, `${grades[k].hit}/${grades[k].beats} beats · ${mmss(grades[k].seconds || 0)}${grades[k].note !== 'clean' ? ` · ${grades[k].note}` : ''}`),
            ),
          ),
        ),
        weak && grades[w].result !== 'clean'
          ? h(
              'section',
              { class: 'panel' },
              h('h2', { class: 'section-title' }, 'Weakest answer'),
              h('p', {}, `“${weak.prompt}”`),
              h('ul', { class: 'answer-list' }, weak.beats.map((b) => h('li', {}, h('span', {}, beatLabel(b))))),
            )
          : h('p', { class: 'hint' }, 'No weak answer this round.'),
        reread.length
          ? h(
              'section',
              { class: 'panel' },
              h('h2', { class: 'section-title' }, 'Re-read tonight'),
              h(
                'ul',
                { class: 'reread-list' },
                reread.map((q) =>
                  h(
                    'li',
                    {},
                    h('a', { href: '#', onclick: (e) => { e.preventDefault(); onSource(q.source); } }, q.source),
                    q.cardId ? h('button', { class: 'btn small', type: 'button', onclick: () => onCard(q.cardId) }, 'Rehearse the story') : null,
                  ),
                ),
              ),
            )
          : null,
        h('div', { class: 'actions stack' }, h('button', { class: 'btn primary big', type: 'button', onclick: () => run(deck) }, 'Run it again'), h('button', { class: 'btn', type: 'button', onclick: showList }, 'Other decks'), h('button', { class: 'btn', type: 'button', onclick: onBack }, 'Campus')),
      );
    }
  }
}
