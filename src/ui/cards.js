// Card components for the six card types (ugly-but-working; Phase 3 restyles).
// Each renderer returns an element and calls onSubmit(response, seconds) once.

import { h, highlightScript, seededShuffle } from './dom.js';
import { DEFAULT_MATRIX_OPTIONS, DEFAULT_STORY_TIMING, beatLabel } from '../engine/grader.js';

const TYPE_NAMES = { number: 'Cold Number', order: 'Order the Steps', matrix: 'Build the Matrix', scenario: 'Interviewer Scenario', story: 'Story Rehearsal', defect: 'Spot the Defect' };

export function typeName(type) {
  return TYPE_NAMES[type] || type;
}

function stopwatch() {
  const t0 = performance.now();
  return () => (performance.now() - t0) / 1000;
}

function submitButton(label, onClick) {
  return h('button', { class: 'btn primary big', type: 'button', onclick: onClick }, label);
}

export function renderNumber(card, { onSubmit }) {
  const elapsed = stopwatch();
  const fields = card.answer.fields;
  const hasCode = !!card.answer.codeRef;
  const inputs = fields.map((f, i) =>
    h('input', { class: 'field', id: `f${i}`, type: 'text', inputmode: typeof f.value === 'number' ? 'decimal' : 'text', autocomplete: 'off', 'aria-label': f.label }),
  );
  const code = hasCode ? h('input', { class: 'field', id: 'fcode', type: 'text', autocomplete: 'off', placeholder: card.confirmInEdition ? 'standard, e.g. NFPA 72' : 'e.g. NFPA 13 §29.2.2', 'aria-label': 'code section' }) : null;
  const all = [...inputs, ...(code ? [code] : [])];
  const count = h('p', { class: 'blank-count' });
  const btn = submitButton('Submit', () => {
    if (btn.disabled) return;
    btn.disabled = true;
    onSubmit({ fields: inputs.map((x) => x.value.trim()), codeRef: code ? code.value.trim() : '' }, elapsed());
  });
  const refresh = () => {
    const blank = all.filter((x) => !x.value.trim()).length;
    btn.disabled = blank > 0;
    count.textContent = blank ? `${blank} of ${all.length} blank${all.length > 1 ? 's' : ''} left — every blank must be filled` : `All ${all.length} filled`;
  };
  all.forEach((x) => x.addEventListener('input', refresh));
  all.forEach((x, i) => x.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') (all[i + 1] || btn).focus();
  }));
  refresh();
  return h(
    'div',
    { class: 'card-body number' },
    h('p', { class: 'hint' }, `This card has ${all.length} blank${all.length > 1 ? 's' : ''}${hasCode ? ', including the code section' : ''}.`),
    fields.map((f, i) => h('label', { class: 'row', for: `f${i}` }, h('span', {}, f.label), inputs[i])),
    code ? h('label', { class: 'row', for: 'fcode' }, h('span', {}, card.confirmInEdition ? 'Standard' : 'Code section'), code) : null,
    count,
    btn,
  );
}

export function renderOrder(card, { onSubmit, seed }) {
  const elapsed = stopwatch();
  const steps = card.answer.steps;
  let shuffled = seededShuffle(steps.map((_, i) => i), `${card.id}:${seed}`);
  if (shuffled.every((x, i) => x === i)) shuffled = [...shuffled.slice(1), shuffled[0]];
  const placed = [];
  const answer = h('ol', { class: 'placed' });
  const pool = h('div', { class: 'pool' });
  const undo = h('button', { class: 'btn', type: 'button', onclick: () => { placed.pop(); draw(); } }, 'Undo');
  const btn = submitButton('Submit order', () => {
    if (btn.disabled) return;
    btn.disabled = true;
    onSubmit({ order: [...placed] }, elapsed());
  });
  function draw() {
    answer.replaceChildren(...placed.map((i) => h('li', {}, steps[i])));
    pool.replaceChildren(
      ...shuffled.filter((i) => !placed.includes(i)).map((i) => h('button', { class: 'btn step', type: 'button', onclick: () => { placed.push(i); draw(); } }, steps[i])),
    );
    undo.disabled = placed.length === 0;
    btn.disabled = placed.length !== steps.length;
  }
  draw();
  return h('div', { class: 'card-body order' }, h('p', { class: 'hint' }, `Tap the ${steps.length} steps in order.`), answer, pool, h('div', { class: 'actions' }, undo, btn));
}

export function renderMatrix(card, { onSubmit }) {
  const elapsed = stopwatch();
  const g = card.answer.grid;
  const options = g.options || DEFAULT_MATRIX_OPTIONS;
  const fixed = new Set((g.prefilled || []).map(([r, c]) => `${r},${c}`));
  const cells = g.cells.map((row, r) => row.map((v, c) => (fixed.has(`${r},${c}`) ? v : '')));
  const btn = submitButton('Submit matrix', () => {
    if (btn.disabled) return;
    btn.disabled = true;
    onSubmit({ cells: cells.map((r) => [...r]) }, elapsed());
  });
  const left = h('p', { class: 'blank-count' });
  const refresh = () => {
    const n = cells.flat().filter((v) => v === '').length;
    left.textContent = n ? `${n} cells left` : 'All cells set';
    btn.disabled = n > 0;
  };
  const table = h(
    'table',
    { class: 'matrix' },
    h('thead', {}, h('tr', {}, h('th', {}, 'Input ↓ · Output →'), g.outputs.map((o) => h('th', {}, o)))),
    h(
      'tbody',
      {},
      g.inputs.map((input, r) =>
        h(
          'tr',
          {},
          h('th', {}, input),
          g.outputs.map((_, c) => {
            const b = h('button', { class: 'cell', type: 'button', disabled: fixed.has(`${r},${c}`) }, cells[r][c] || '·');
            b.addEventListener('click', () => {
              const i = options.indexOf(cells[r][c]);
              cells[r][c] = options[(i + 1) % options.length];
              b.textContent = cells[r][c];
              refresh();
            });
            return h('td', {}, b);
          }),
        ),
      ),
    ),
  );
  refresh();
  return h(
    'div',
    { class: 'card-body matrix-card' },
    h('p', { class: 'hint' }, `Tap a cell to cycle ${options.join(' / ')}. The blank cells count — proving an output does not happen is half the job.`),
    h('div', { class: 'table-wrap' }, table),
    left,
    btn,
  );
}

function countdown(seconds) {
  const bar = h('div', { class: 'timer-fill' });
  const label = h('span', { class: 'timer-label' }, `${seconds} s`);
  const el = h('div', { class: 'timer' }, bar, label);
  const t0 = performance.now();
  let id = null;
  const tick = () => {
    const s = (performance.now() - t0) / 1000;
    bar.style.width = `${Math.min(100, (s / seconds) * 100)}%`;
    label.textContent = s <= seconds ? `${Math.ceil(seconds - s)} s` : `+${Math.floor(s - seconds)} s over`;
    el.classList.toggle('over', s > seconds);
  };
  id = setInterval(tick, 250);
  tick();
  return { el, elapsed: () => (performance.now() - t0) / 1000, stop: () => clearInterval(id) };
}

export function renderScenario(card, { onSubmit }) {
  const timer = countdown(card.par || 90);
  const body = h('div', { class: 'card-body scenario' });
  let answeredIn = null;
  const reveal = h('button', { class: 'btn primary big', type: 'button' }, 'Reveal');
  reveal.addEventListener('click', () => {
    answeredIn = timer.elapsed();
    timer.stop();
    const beats = card.answer.beats;
    const boxes = beats.map((b, i) => h('input', { type: 'checkbox', id: `b${i}` }));
    const num = h('input', { type: 'checkbox', id: 'bnum' });
    const code = h('input', { type: 'checkbox', id: 'bcode' });
    const grade = submitButton('Grade it', () => {
      grade.disabled = true;
      onSubmit({ hits: boxes.map((x) => x.checked), saidNumber: num.checked, saidCode: code.checked }, answeredIn);
    });
    body.replaceChildren(
      h('p', { class: 'hint' }, `You answered in ${Math.round(answeredIn)} s. Tick only what you actually said.`),
      h('ul', { class: 'beats' }, beats.map((b, i) => h('li', {}, h('label', { for: `b${i}` }, boxes[i], ' ', beatLabel(b))))),
      card.answer.requiresNumber !== false ? h('label', { class: 'row-check', for: 'bnum' }, num, ' I said a number') : null,
      card.answer.codeRef ? h('label', { class: 'row-check', for: 'bcode' }, code, ` I named the code reference (${card.answer.codeRef})`) : null,
      grade,
    );
  });
  body.append(h('p', { class: 'hint' }, 'Answer out loud (or type bullets on paper), then reveal the model answer.'), timer.el, reveal);
  return body;
}

export function renderStory(card, { onSubmit }) {
  const timing = { ...DEFAULT_STORY_TIMING, ...(card.answer.timing || {}) };
  const timer = countdown(timing.max);
  const beats = card.answer.beats;
  const hits = beats.map(() => false);
  const chips = beats.map((b, i) => {
    const chip = h('button', { class: `chip${b.fillIn ? ' fill-in' : ''}`, type: 'button', disabled: !!b.fillIn }, b.fillIn ? `fill in: ${beatLabel(b)}` : beatLabel(b));
    chip.addEventListener('click', () => {
      hits[i] = !hits[i];
      chip.classList.toggle('on', hits[i]);
    });
    return chip;
  });
  const done = submitButton('Done speaking', () => {
    done.disabled = true;
    timer.stop();
    const seconds = timer.elapsed();
    onSubmit({ hits: [...hits], seconds }, seconds);
  });
  return h(
    'div',
    { class: 'card-body story' },
    h('p', { class: 'hint' }, `Say it out loud. Tap each beat as you hit it. Clean = every beat in ${timing.min}–${timing.max} s; past ${timing.limit} s is a ramble.`),
    timer.el,
    h('div', { class: 'chips' }, chips),
    done,
  );
}

export function renderDefect(card, { onSubmit }) {
  const elapsed = stopwatch();
  let selected = null;
  const btn = submitButton('This line', () => {
    if (btn.disabled) return;
    btn.disabled = true;
    onSubmit({ index: selected }, elapsed());
  });
  btn.disabled = true;
  const lines = card.answer.lines.map((line, i) => {
    const b = h('button', { class: 'btn line', type: 'button' }, line);
    b.addEventListener('click', () => {
      selected = i;
      lines.forEach((x, j) => x.classList.toggle('on', j === i));
      btn.disabled = false;
    });
    return b;
  });
  return h('div', { class: 'card-body defect' }, h('p', { class: 'hint' }, 'One line breaks a rule. Tap it, then confirm.'), h('div', { class: 'lines' }, lines), btn);
}

const RENDERERS = { number: renderNumber, order: renderOrder, matrix: renderMatrix, scenario: renderScenario, story: renderStory, defect: renderDefect };

export function renderCard(card, opts) {
  const r = RENDERERS[card.type];
  return h(
    'section',
    { class: `card type-${card.type}` },
    h('p', { class: 'card-type' }, typeName(card.type)),
    card.interviewerPhrasing && card.interviewerPhrasing !== card.prompt ? h('p', { class: 'interviewer' }, `“${card.interviewerPhrasing}”`) : null,
    h('h2', { class: 'prompt' }, card.prompt),
    r ? r(card, opts) : h('p', {}, `Unknown card type ${card.type}`),
  );
}

// ---------- after the card ----------

const RESULT_LABEL = { clean: 'Clean', slipped: 'Slipped', missed: 'Missed' };

function correctAnswer(card, grade) {
  const a = card.answer;
  switch (card.type) {
    case 'number':
      return h(
        'ul',
        { class: 'answer-list' },
        grade.detail.fields.map((f) => h('li', { class: f.ok ? 'ok' : 'bad' }, `${f.label}: ${f.expected}`, f.ok ? '' : ` (you: ${f.given || 'blank'})`)),
        grade.detail.code ? h('li', { class: grade.detail.code.ok ? 'ok' : 'bad' }, `code: ${grade.detail.code.expected}`, grade.detail.code.ok ? '' : ` (you: ${grade.detail.code.given || 'blank'})`) : null,
      );
    case 'order':
      return h('ol', { class: 'answer-list' }, a.steps.map((s, i) => h('li', { class: grade.detail.order?.[i] === i ? 'ok' : 'bad' }, s)));
    case 'matrix':
      return h(
        'div',
        { class: 'table-wrap' },
        h(
          'table',
          { class: 'matrix' },
          h('thead', {}, h('tr', {}, h('th', {}, ''), a.grid.outputs.map((o) => h('th', {}, o)))),
          h('tbody', {}, a.grid.inputs.map((inp, r) => h('tr', {}, h('th', {}, inp), a.grid.cells[r].map((v, c) => {
            const d = grade.detail.cells[r][c];
            const note = a.grid.notes?.[r]?.[c];
            return h('td', { class: d.ok ? 'ok' : 'bad', title: note || '' }, v, note ? h('small', {}, ` ${note}`) : null, d.ok ? '' : h('small', {}, ` (you: ${d.given || '·'})`));
          })))),
        ),
      );
    case 'scenario':
      return h('ul', { class: 'answer-list' }, a.beats.map((b) => h('li', {}, beatLabel(b))));
    case 'story':
      return h(
        'div',
        {},
        h('ul', { class: 'answer-list' }, a.beats.map((b) => h('li', {}, h('strong', {}, `${beatLabel(b)}: `), b.quote || ''))),
        a.script ? h('details', { class: 'script', open: true }, h('summary', {}, 'Script'), h('div', { html: highlightScript(a.script) })) : null,
      );
    case 'defect':
      return h('ol', { class: 'answer-list lines-result', start: '1' }, a.lines.map((l, i) => h('li', { class: i === a.defectIndex ? 'bad' : i === grade.detail.given ? 'mine' : '' }, l)));
    default:
      return null;
  }
}

export function renderResult({ card, grade, seconds, topicBefore, topicAfter, xp, rated, onNext, onSource, nextLabel = 'Next card' }) {
  // The hook is for Needs Improvement / Not Ready (procedure-notes).
  const showHook = grade.result === 'missed';
  const level = grade.result === 'missed' ? (grade.framework ? 'Needs Improvement level' : 'Not Ready level') : grade.result === 'slipped' ? 'Minor Refresh level' : 'clean';
  return h(
    'section',
    { class: `result result-${grade.result}` },
    h('h2', {}, RESULT_LABEL[grade.result], h('small', {}, ` · ${level}${seconds != null ? ` · ${Math.round(seconds)} s (par ${card.par})` : ''} · +${xp} XP`)),
    grade.note && grade.note !== 'clean' ? h('p', { class: 'note' }, grade.note) : null,
    h('p', { class: 'explanation' }, card.answer.explanation),
    showHook ? h('p', { class: 'hook' }, 'Hook: ', card.hook) : null,
    card.confirmInEdition ? h('p', { class: 'confirm' }, 'The guide says: confirm this section in your edition before you quote it.') : null,
    correctAnswer(card, grade),
    rated && topicBefore && topicAfter
      ? h('p', { class: 'topic-change' }, `${topicAfter.id} · ${topicBefore.rating} → ${topicAfter.rating} · streak ${topicAfter.streak} · next ${topicAfter.next_review}`)
      : h('p', { class: 'topic-change' }, 'Not rated — practice only.'),
    h('p', {}, h('a', { href: '#', class: 'source', onclick: (e) => { e.preventDefault(); onSource(card.source); } }, `Re-read: ${card.source}`)),
    h('button', { class: 'btn primary big', type: 'button', onclick: onNext, autofocus: true }, nextLabel),
  );
}

