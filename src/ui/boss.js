// Mock Interview — the boss fight (spec §4.8), retargeted for the remaining rounds
// (GAME_SPEC_ROUND2 §7): decks from src/data/mock.json grouped by their `round` (r2 peer
// technical, r3 behavioral drill-down); the v1 Mock 1–3 (no round) are hidden. Each
// question runs against a clock, then its follow-ups one after another, then you tick the
// beats you hit — main answer and every follow-up with beats. Practice only: never
// changes topic ratings.

import { h, mount, mmss } from './dom.js';
import { timerBar, KIND_NAMES, layerDots, INTERRUPT_WINDOW } from './cards.js';
import { beatLabel } from '../engine/grader.js';
import { gradeMockAnswer, mockHeadline, weakestAnswer, mockRequiresNumber, mockFollowUps } from '../engine/mock.js';

const FOLLOW_UP_SECONDS = 45;
const RESULT_WORD = { clean: 'Clean', slipped: 'Close', missed: 'Missed' };
const KIND_LABEL = { intro: 'Warm-up', technical: 'Technical', experience: 'Your experience', values: 'Values', close: 'Your questions' };
const KIND_LETTER = { intro: 'I', technical: 'T', experience: 'E', values: 'V', close: 'Q' };
export const ROUNDS = [
  { id: 'r2', title: 'Round 2 · Peer technical', blurb: 'About 45 minutes with a fellow engineer: your intro, five technical questions with two follow-ups each — one walkthrough, one troubleshooting, one about your own work — then your questions for them.' },
  { id: 'r3', title: 'Round 3 · Behavioral drill-down', blurb: 'About 30 minutes with a senior manager: your hardest challenge, drilled five layers deep, two values questions with follow-ups, then your questions for them.' },
];
// Questions where follow-up 1 may cut in mid-answer (interrupt mode).
const INTERRUPTIBLE = ['technical', 'experience'];

function deckMinutes(deck) {
  const secs = deck.questions.reduce((s, q) => s + q.par + 30 + mockFollowUps(q).reduce((t, f) => t + (f.par || FOLLOW_UP_SECONDS), 0), 0);
  return Math.round(secs / 60);
}

export function mockScreen({ mock, onBack, onSource, onCard, interrupt = false, interruptAt = null }) {
  const root = h('main', { class: 'mock' });
  const decks = ((mock && mock.decks) || []).filter((d) => d.round);
  showList();
  return root;

  function showList() {
    window.scrollTo(0, 0);
    mount(
      root,
      h('button', { class: 'btn back', type: 'button', onclick: onBack }, '← Campus'),
      h('h1', {}, 'Mock interview'),
      h('p', { class: 'hint' }, 'Answer out loud against the clock, take each follow-up, then tick the beats you actually hit. Practice only — ratings don’t move.'),
      ROUNDS.map((r) => {
        const own = decks.filter((d) => d.round === r.id);
        return h(
          'section',
          { class: 'round-group', id: `round-${r.id}` },
          h('h2', { class: 'section-title' }, r.title),
          h('p', { class: 'hint' }, r.blurb),
          own.length
            ? h(
                'ul',
                { class: 'deck-list' },
                own.map((d) =>
                  h(
                    'li',
                    {},
                    h(
                      'button',
                      { class: 'deck-row', type: 'button', id: `deck-${d.id}`, onclick: () => run(d) },
                      h('span', { class: 'dr-title' }, d.title),
                      h('span', { class: 'dr-time num' }, `~${deckMinutes(d)} min`),
                      h('span', { class: 'dr-qs' }, d.questions.map((q) => KIND_LETTER[q.kind] || '·').join(' · ')),
                    ),
                  ),
                ),
              )
            : h('p', { class: 'coming' }, 'Decks for this round are coming in a later session.'),
        );
      }),
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
        h('p', { class: 'mock-kind' }, h('span', { class: `kind k-${q.kind}` }, KIND_LABEL[q.kind] || q.kind), h('span', { class: 'stage' }, stage)),
      );
    }

    function ask() {
      window.scrollTo(0, 0);
      const q = deck.questions[i];
      const fus = mockFollowUps(q);
      const timer = timerBar({ total: q.par, kind: 'countdown' });
      const cutIn = new Set();
      const next = h('button', { class: 'btn primary big', type: 'button', id: 'mock-done' }, fus.length ? 'Done — take the follow-up' : 'Done — grade it');
      const card = h('section', { class: 'card mock-card' }, h('p', { class: 'mock-q' }, `“${q.prompt}”`), h('p', { class: 'hint' }, `Out loud, about ${mmss(q.par)}.${fus.length ? ` ${fus.length === 1 ? 'One follow-up' : `${fus.length} follow-ups`} after.` : ''}`), timer.el, next);
      let done = false;
      if (interrupt && fus.length && INTERRUPTIBLE.includes(q.kind)) {
        const at = interruptAt != null ? interruptAt : INTERRUPT_WINDOW[0] + Math.random() * (INTERRUPT_WINDOW[1] - INTERRUPT_WINDOW[0]);
        const watch = setInterval(() => {
          if (done || !timer.el.isConnected) return clearInterval(watch);
          if (timer.elapsed() < at) return;
          clearInterval(watch);
          timer.pause();
          next.disabled = true;
          const fuTimer = timerBar({ total: fus[0].par || FOLLOW_UP_SECONDS, kind: 'countdown' });
          const back = h('button', { class: 'btn primary big', type: 'button', id: 'interrupt-back' }, 'Done — back to your answer');
          const panel = h('section', { class: 'followup-panel interrupt', id: 'interrupt', role: 'alert' }, h('p', { class: 'fu-lead' }, 'They cut in…'), h('p', { class: 'fu-prompt' }, `“${fus[0].prompt}”`), fuTimer.el, back);
          back.addEventListener('click', () => {
            fuTimer.stop();
            cutIn.add(0);
            panel.replaceWith(h('p', { class: 'interrupt-note', id: 'interrupt-done' }, `They cut in: “${fus[0].prompt}” — answered. Back to your main answer.`));
            next.disabled = false;
            timer.resume();
          });
          timer.el.after(panel);
        }, 200);
      }
      next.addEventListener('click', () => {
        if (next.disabled) return;
        done = true;
        const seconds = timer.elapsed();
        timer.stop();
        follow(seconds, 0, cutIn);
      });
      mount(root, header('Answer'), card);
    }

    // Follow-ups in turn (one already answered when it cut in is skipped), then the grade.
    function follow(seconds, k, cutIn) {
      const q = deck.questions[i];
      const fus = mockFollowUps(q);
      while (k < fus.length && cutIn.has(k)) k++;
      if (k >= fus.length) return reveal(seconds);
      window.scrollTo(0, 0);
      const f = fus[k];
      const timer = timerBar({ total: f.par || FOLLOW_UP_SECONDS, kind: 'countdown' });
      const lastOne = fus.slice(k + 1).every((_, j) => cutIn.has(k + 1 + j));
      const next = h('button', { class: 'btn primary big', type: 'button', id: lastOne ? 'mock-reveal' : `mock-next-${k + 1}` }, lastOne ? 'Reveal the model answer' : 'Next follow-up');
      next.addEventListener('click', () => {
        timer.stop();
        follow(seconds, k + 1, cutIn);
      });
      mount(
        root,
        header(`Follow-up ${k + 1} of ${fus.length}`),
        h(
          'section',
          { class: 'card mock-card' },
          h('p', { class: 'hint' }, k === 0 ? `They follow up (your answer ran ${mmss(seconds)}):` : 'And then:'),
          f.kind ? h('p', { class: 'fu-head' }, h('span', { class: `fu-kind k-${f.kind}` }, KIND_NAMES[f.kind] || f.kind)) : null,
          h('p', { class: 'mock-q' }, `“${f.prompt}”`),
          h('p', { class: 'hint' }, 'Answer it straight.'),
          timer.el,
          next,
        ),
      );
    }

    function reveal(seconds) {
      window.scrollTo(0, 0);
      const q = deck.questions[i];
      const fus = mockFollowUps(q);
      const boxes = q.beats.map((b, k) => h('input', { type: 'checkbox', id: `mb${k}` }));
      const fuBoxes = fus.map((f, j) => (f.beats || []).map((b, k) => h('input', { type: 'checkbox', id: `mf${j + 1}b${k}` })));
      const needNumber = mockRequiresNumber(q);
      const num = h('input', { type: 'checkbox', id: 'mbnum' });
      const grade = h('button', { class: 'btn primary big', type: 'button', id: 'mock-grade' }, i + 1 < deck.questions.length ? 'Grade it · next question' : 'Grade it · debrief');
      grade.addEventListener('click', () => {
        grades.push(gradeMockAnswer(q, { hits: boxes.map((x) => x.checked), saidNumber: needNumber ? num.checked : true, seconds, followUps: fuBoxes.map((bs) => ({ hits: bs.map((x) => x.checked) })) }));
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
          fus.map((f, j) =>
            (f.beats || []).length
              ? h(
                  'section',
                  { class: 'fu-result' },
                  h('p', { class: 'fu-head' }, h('span', { class: 'fu-count num' }, `Follow-up ${j + 1}`), f.kind ? h('span', { class: `fu-kind k-${f.kind}` }, KIND_NAMES[f.kind] || f.kind) : null),
                  h('p', { class: 'fu-prompt small' }, `“${f.prompt}”`),
                  h('ul', { class: 'beats' }, f.beats.map((b, k) => h('li', { class: 'beat' }, h('label', { for: `mf${j + 1}b${k}` }, fuBoxes[j][k], h('span', {}, beatLabel(b)))))),
                )
              : null,
          ),
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
              grades[k].layers ? layerDots(grades[k].layers.map((l, j) => ({ ...l, kind: j === 0 ? 'main' : (mockFollowUps(q).filter((f) => (f.beats || []).length)[j - 1] || {}).kind }))) : null,
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
                    q.cardId ? h('button', { class: 'btn small', type: 'button', onclick: () => onCard(q.cardId) }, 'Practice the card') : null,
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
