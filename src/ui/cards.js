// The six card types (spec §4) and the result shown after every card.
// Each renderer returns an element and calls onSubmit(response, seconds) once.
// Scenario and story cards may carry a follow-up chain (GAME_SPEC_ROUND2 §5).

import { h, s, mount, highlightScript, seededShuffle, mmss, pill } from './dom.js';
import { DEFAULT_MATRIX_OPTIONS, DEFAULT_STORY_TIMING, beatLabel, beatKind, followUpsOf } from '../engine/grader.js';
import { canRecord, startRecording } from './audio.js';

const TYPE_NAMES = { number: 'Cold number', order: 'Order the steps', matrix: 'Build the matrix', scenario: 'Interviewer scenario', story: 'Story rehearsal', defect: 'Spot the defect' };
export const KIND_NAMES = { 'why-not': 'Why not', 'what-if': 'What if', number: 'The number', 'own-it': 'Your own work', 'find-out': 'Find out', drill: 'Drill-down' };
const FOLLOW_UP_SECONDS = 45;
// Interrupt mode: follow-up 1 cuts in at a random moment 40–70 s into the main answer.
export const INTERRUPT_WINDOW = [40, 70];

export function typeName(type, card = null) {
  if (card && card.walkthrough) return 'Walkthrough';
  return TYPE_NAMES[type] || type;
}

// Timers and the microphone stop when the screen changes (app.go calls this).
const live = new Set();
export function stopCardActivity() {
  for (const stop of live) {
    try {
      stop();
    } catch {
      /* already stopped */
    }
  }
  live.clear();
}

function stopwatch() {
  const t0 = performance.now();
  return () => (performance.now() - t0) / 1000;
}

function submitButton(label, onClick, { disabled = false } = {}) {
  return h('button', { class: 'btn primary big', type: 'button', disabled, onclick: onClick }, label);
}

// The spoken cards are graded by what you tap, never by listening. When nothing
// is tapped, the card asks before it grades a blank — the usual reason is that
// the beats were spoken but not tapped.
function nudgeBox(text, onMiss) {
  return h(
    'div',
    { class: 'nudge', id: 'nudge', role: 'alert' },
    h('span', {}, text),
    h('button', { class: 'btn small', type: 'button', id: 'grade-miss', onclick: onMiss }, 'Grade as a miss'),
  );
}

const isFillIn = (b) => !!(b && typeof b === 'object' && b.fillIn);

// A bar that fills over `total` seconds. countdown: shows time left, then
// "+0:12 over" (amber — overtime is a slip, never red). window: shows elapsed
// time against a shaded target band [min, max] and a limit marker.
export function timerBar({ total, band = null, limit = null, kind = 'countdown' }) {
  const fill = h('div', { class: 'timer-fill' });
  const text = h('span', { class: 'timer-label num' });
  const pct = (x) => `${Math.max(0, Math.min(100, (x / total) * 100))}%`;
  const el = h(
    'div',
    { class: `timer ${kind}`, role: 'timer', 'aria-live': 'off' },
    band ? h('div', { class: 'timer-band', style: { left: pct(band[0]), width: `calc(${pct(band[1])} - ${pct(band[0])})` } }) : null,
    fill,
    limit ? h('div', { class: 'timer-limit', style: { left: pct(limit) } }) : null,
    text,
  );
  // pause() / resume() hold the clock while a follow-up cuts in (interrupt mode).
  let t0 = performance.now();
  let carried = 0;
  let paused = false;
  let stopped = false;
  const elapsed = () => carried + (paused ? 0 : (performance.now() - t0) / 1000);
  const tick = () => {
    const sec = elapsed();
    fill.style.width = pct(sec);
    if (kind === 'countdown') {
      text.textContent = sec <= total ? `${mmss(total - sec)} left` : `+${mmss(sec - total)} over`;
      el.classList.toggle('over', sec > total);
    } else {
      const state = sec < band[0] ? 'under' : sec <= band[1] ? 'in' : limit && sec > limit ? 'ramble' : 'over';
      el.dataset.state = state;
      text.textContent = `${mmss(sec)} · target ${mmss(band[0])}–${mmss(band[1])}`;
    }
  };
  const id = setInterval(tick, 250);
  const stop = () => {
    if (!stopped) clearInterval(id);
    stopped = true;
    live.delete(stop);
  };
  const pause = () => {
    if (paused || stopped) return;
    carried = elapsed();
    paused = true;
    el.classList.add('paused');
  };
  const resume = () => {
    if (!paused || stopped) return;
    t0 = performance.now();
    paused = false;
    el.classList.remove('paused');
  };
  live.add(stop);
  tick();
  return { el, elapsed, stop, pause, resume };
}

// ---------- follow-up chains (GAME_SPEC_ROUND2 §5) ----------

function beatChecklist(beats, prefix) {
  const boxes = beats.map((b, i) => (isFillIn(b) ? null : h('input', { type: 'checkbox', id: `${prefix}${i}` })));
  const list = h(
    'ul',
    { class: 'beats' },
    beats.map((b, i) =>
      isFillIn(b)
        ? h('li', { class: 'beat fill' }, h('span', { class: 'fill-in' }, `fill in: ${beatLabel(b)}`))
        : h('li', { class: 'beat' }, h('label', { for: `${prefix}${i}` }, boxes[i], h('span', {}, beatLabel(b)))),
    ),
  );
  return { list, boxes, hits: () => boxes.map((x) => !!(x && x.checked)), any: () => boxes.some((x) => x && x.checked), gradable: boxes.some(Boolean), lock: () => boxes.forEach((x) => x && (x.disabled = true)) };
}

// After the main answer is ticked, each follow-up slides in: its prompt and a timer, then
// Reveal and tick, then the next. A layer in `answered` was already asked when it cut in
// (interrupt mode), so it goes straight to the ticks. Calls onDone([{ hits }…]) once.
export function runChain(body, followUps, { answered = new Set(), onDone }) {
  const results = [];
  const step = (k) => {
    if (k >= followUps.length) return onDone(results);
    const f = followUps[k];
    const last = k === followUps.length - 1;
    const panel = h('section', { class: 'followup-panel', id: `followup-${k + 1}`, 'aria-live': 'polite' });
    const head = h('p', { class: 'fu-head' }, h('span', { class: 'fu-count num' }, `Follow-up ${k + 1} of ${followUps.length}`), f.kind ? h('span', { class: `fu-kind k-${f.kind}` }, KIND_NAMES[f.kind] || f.kind) : null);
    const prompt = h('p', { class: 'fu-prompt' }, `“${f.prompt}”`);
    const ticks = () => {
      const c = beatChecklist(f.beats || [], `f${k + 1}b`);
      const done = () => {
        c.lock();
        btn.remove();
        nudge.remove();
        panel.classList.add('answered');
        results.push({ hits: c.hits() });
        step(k + 1);
      };
      const nudge = nudgeBox('Nothing ticked. Tick what you actually said — or grade this follow-up as a miss.', done);
      const btn = submitButton(last ? 'Grade it' : 'Next follow-up', () => {
        if (btn.disabled) return;
        if (c.gradable && !c.any()) {
          if (!nudge.isConnected) btn.before(nudge);
          nudge.scrollIntoView({ block: 'nearest' });
          return;
        }
        btn.disabled = true;
        done();
      });
      btn.id = `followup-${k + 1}-next`;
      return [h('p', { class: 'hint' }, 'Tick only what you said.'), c.list, btn];
    };
    if (answered.has(k)) {
      mount(panel, head, prompt, h('p', { class: 'hint' }, 'They asked this when they cut in. You already answered it.'), ...ticks());
    } else {
      const timer = timerBar({ total: f.par || FOLLOW_UP_SECONDS, kind: 'countdown' });
      const reveal = h('button', { class: 'btn primary big', type: 'button', id: `followup-${k + 1}-reveal` }, 'Reveal');
      reveal.addEventListener('click', () => {
        timer.stop();
        reveal.replaceWith(...ticks());
      });
      mount(panel, h('p', { class: 'fu-lead' }, 'They follow up…'), head, prompt, timer.el, reveal);
    }
    body.append(panel);
    panel.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  step(0);
}

// ---------- 4.1 cold number ----------

export function renderNumber(card, { onSubmit }) {
  const elapsed = stopwatch();
  const fields = card.answer.fields;
  const hasCode = !!card.answer.codeRef;
  const inputs = fields.map((f, i) =>
    h('input', {
      class: 'field',
      id: `f${i}`,
      type: 'text',
      inputmode: typeof f.value === 'number' ? 'decimal' : 'text',
      autocomplete: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      enterkeyhint: 'next',
      'aria-label': f.label,
    }),
  );
  const code = hasCode
    ? h('input', { class: 'field', id: 'fcode', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'done', placeholder: card.confirmInEdition ? 'standard, e.g. NFPA 110' : 'e.g. NFPA 13 §29.2.2', 'aria-label': 'code section' })
    : null;
  const all = [...inputs, ...(code ? [code] : [])];
  const count = h('p', { class: 'blank-count', 'aria-live': 'polite' });
  const btn = submitButton('Submit', () => {
    if (btn.disabled) return;
    btn.disabled = true;
    onSubmit({ fields: inputs.map((x) => x.value.trim()), codeRef: code ? code.value.trim() : '' }, elapsed());
  });
  const refresh = () => {
    const blank = all.filter((x) => !x.value.trim()).length;
    btn.disabled = blank > 0;
    count.textContent = blank ? `${blank} of ${all.length} blank${all.length > 1 ? 's' : ''} left — every blank must be filled` : `All ${all.length} filled`;
    count.classList.toggle('full', !blank);
    all.forEach((x) => x.classList.toggle('filled', !!x.value.trim()));
  };
  all.forEach((x) => x.addEventListener('input', refresh));
  all.forEach((x, i) =>
    x.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const next = all[i + 1];
      if (next) next.focus();
      else if (!btn.disabled) btn.click();
    }),
  );
  refresh();
  return h(
    'div',
    { class: 'card-body number' },
    h('p', { class: 'hint' }, `${all.length} blank${all.length > 1 ? 's' : ''}${hasCode ? ', including the code section' : ''}. Submit unlocks when every one is filled.`),
    h(
      'div',
      { class: 'fields' },
      fields.map((f, i) => h('label', { class: 'field-row', for: `f${i}` }, h('span', { class: 'field-label' }, f.label), inputs[i])),
      code ? h('label', { class: 'field-row code', for: 'fcode' }, h('span', { class: 'field-label' }, card.confirmInEdition ? 'Standard (name only — the guide hedges the section)' : 'Code section'), code) : null,
    ),
    count,
    btn,
  );
}

// ---------- 4.2 order the steps ----------

export function renderOrder(card, { onSubmit, seed }) {
  const elapsed = stopwatch();
  const steps = card.answer.steps;
  let shuffled = seededShuffle(steps.map((_, i) => i), `${card.id}:${seed}`);
  if (shuffled.every((x, i) => x === i)) shuffled = [...shuffled.slice(1), shuffled[0]];
  const placed = [];
  const list = h('ol', { class: 'placed', 'aria-label': 'Your order' });
  const pool = h('div', { class: 'pool', 'aria-label': 'Steps to place' });
  const undo = h('button', { class: 'btn', type: 'button', onclick: () => { placed.pop(); draw(); } }, 'Undo');
  const btn = submitButton('Submit order', () => {
    if (btn.disabled) return;
    btn.disabled = true;
    onSubmit({ order: [...placed] }, elapsed());
  });
  function draw() {
    list.replaceChildren(
      ...placed.map((i, pos) =>
        h('li', { class: 'slot filled' }, h('span', { class: 'slot-n num' }, String(pos + 1)), h('button', { class: 'placed-step', type: 'button', title: 'Tap to send back', onclick: () => { placed.splice(pos, 1); draw(); } }, steps[i])),
      ),
      ...steps.slice(placed.length).map((_, k) => h('li', { class: 'slot ghost', 'aria-hidden': 'true' }, h('span', { class: 'slot-n num' }, String(placed.length + k + 1)))),
    );
    pool.replaceChildren(...shuffled.filter((i) => !placed.includes(i)).map((i) => h('button', { class: 'btn step', type: 'button', onclick: () => { placed.push(i); draw(); } }, steps[i])));
    undo.disabled = placed.length === 0;
    btn.disabled = placed.length !== steps.length;
  }
  draw();
  return h(
    'div',
    { class: 'card-body order' },
    h('p', { class: 'hint' }, `Tap the ${steps.length} steps in order. Tap a placed step to send it back.`),
    list,
    pool,
    h('div', { class: 'actions' }, undo),
    btn,
  );
}

// ---------- 4.3 build the matrix ----------

function cellClass(v) {
  if (v === '●') return 'v-dot';
  if (v === '—') return 'v-dash';
  if (!v) return 'v-empty';
  return 'v-word';
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
  const left = h('p', { class: 'blank-count', 'aria-live': 'polite' });
  const refresh = () => {
    const n = cells.flat().filter((v) => v === '').length;
    left.textContent = n ? `${n} cell${n > 1 ? 's' : ''} left` : 'All cells set';
    left.classList.toggle('full', !n);
    btn.disabled = n > 0;
  };
  const blocks = g.inputs.map((input, r) =>
    h(
      'section',
      { class: 'mx-input' },
      h('h3', { class: 'mx-title' }, input),
      h(
        'ul',
        { class: 'mx-cells' },
        g.outputs.map((out, c) => {
          const b = h('button', { class: `cell ${cellClass(cells[r][c])}`, type: 'button', disabled: fixed.has(`${r},${c}`), 'aria-label': `${input} → ${out}` }, cells[r][c] || '·');
          b.addEventListener('click', () => {
            const i = options.indexOf(cells[r][c]);
            cells[r][c] = options[(i + 1) % options.length];
            b.textContent = cells[r][c];
            b.className = `cell ${cellClass(cells[r][c])}`;
            refresh();
          });
          return h('li', {}, h('span', { class: 'mx-out' }, out), b);
        }),
      ),
    ),
  );
  refresh();
  return h(
    'div',
    { class: 'card-body matrix-card' },
    h('p', { class: 'hint' }, `Tap each cell to cycle ${options.join(' / ')}. A “—” is a test step too: proving an output does not happen is half the job.`),
    blocks,
    left,
    btn,
  );
}

// ---------- 4.4 interviewer scenario ----------

// opts.par overrides the card's par (the 90 s day-of warm-up); opts.chain = false skips the
// follow-ups; opts.interrupt lets follow-up 1 cut in mid-answer (opts.interruptAt seconds,
// else a random moment in INTERRUPT_WINDOW).
export function renderScenario(card, { onSubmit, par = null, chain = true, interrupt = false, interruptAt = null }) {
  const total = par || card.par || 90;
  const followUps = chain ? followUpsOf(card) : [];
  const timer = timerBar({ total, kind: 'countdown' });
  const body = h('div', { class: 'card-body scenario' });
  const notes = h('textarea', { class: 'notes', rows: 4, placeholder: 'Bullets, if you’d rather type than talk' });
  const reveal = h('button', { class: 'btn primary big', type: 'button' }, 'Reveal');
  const answered = new Set();
  let revealed = false;

  // Interrupt mode: the main clock pauses while follow-up 1 is answered, then resumes.
  if (interrupt && followUps.length) {
    const at = interruptAt != null ? interruptAt : INTERRUPT_WINDOW[0] + Math.random() * (INTERRUPT_WINDOW[1] - INTERRUPT_WINDOW[0]);
    const watch = setInterval(() => {
      if (revealed) return clearInterval(watch);
      if (timer.elapsed() < at) return;
      clearInterval(watch);
      cutIn(followUps[0]);
    }, 200);
    live.add(() => clearInterval(watch));
  }
  function cutIn(f) {
    timer.pause();
    reveal.disabled = true;
    const fuTimer = timerBar({ total: f.par || FOLLOW_UP_SECONDS, kind: 'countdown' });
    const back = h('button', { class: 'btn primary big', type: 'button', id: 'interrupt-back' }, 'Done — back to your answer');
    const panel = h(
      'section',
      { class: 'followup-panel interrupt', id: 'interrupt', role: 'alert' },
      h('p', { class: 'fu-lead' }, 'They cut in…'),
      h('p', { class: 'fu-head' }, f.kind ? h('span', { class: `fu-kind k-${f.kind}` }, KIND_NAMES[f.kind] || f.kind) : null),
      h('p', { class: 'fu-prompt' }, `“${f.prompt}”`),
      h('p', { class: 'hint' }, 'Answer it, then pick your main answer back up — its clock is paused.'),
      fuTimer.el,
      back,
    );
    back.addEventListener('click', () => {
      fuTimer.stop();
      answered.add(0);
      panel.replaceWith(h('p', { class: 'interrupt-note', id: 'interrupt-done' }, `They cut in: “${f.prompt}” — answered. Back to your main answer.`));
      reveal.disabled = false;
      timer.resume();
    });
    timer.el.after(panel);
    panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  reveal.addEventListener('click', () => {
    if (reveal.disabled) return;
    revealed = true;
    const answeredIn = timer.elapsed();
    timer.stop();
    const beats = card.answer.beats;
    const boxes = beats.map((b, i) => (isFillIn(b) ? null : h('input', { type: 'checkbox', id: `b${i}` })));
    const num = h('input', { type: 'checkbox', id: 'bnum' });
    const code = h('input', { type: 'checkbox', id: 'bcode' });
    const asksNumber = card.answer.requiresNumber !== false;
    const asksCode = !!card.answer.codeRef;
    const mainResponse = () => ({ hits: boxes.map((x) => !!(x && x.checked)), saidNumber: num.checked, saidCode: code.checked, notes: notes.value.trim() });
    const submit = () => {
      grade.disabled = true;
      if (!followUps.length) return onSubmit(mainResponse(), answeredIn);
      const main = mainResponse();
      [...boxes, num, code].forEach((x) => x && (x.disabled = true));
      grade.remove();
      nudge.remove();
      runChain(body, followUps, { answered, onDone: (layers) => onSubmit({ ...main, followUps: layers }, answeredIn) });
    };
    const nudge = nudgeBox('Nothing ticked. Tick what you actually said, then Grade it — or grade this one as a miss.', submit);
    const grade = submitButton(followUps.length ? 'Next — they follow up' : 'Grade it', () => {
      if (grade.disabled) return;
      const anything = boxes.some((x) => x && x.checked) || (asksNumber && num.checked) || (asksCode && code.checked);
      if (!anything) {
        if (!nudge.isConnected) grade.before(nudge);
        nudge.scrollIntoView({ block: 'nearest' });
        return;
      }
      submit();
    });
    grade.id = 'grade-main';
    const cutNote = body.querySelector('#interrupt-done');
    mount(
      body,
      h('p', { class: 'instruct' }, h('b', {}, 'The ticks are the grade.'), ` You answered in ${mmss(answeredIn)}${answeredIn > total ? ` — over the ${total} s par` : ''}. Tick only what you actually said.${followUps.length ? ` Then ${followUps.length === 1 ? 'a follow-up' : `${followUps.length} follow-ups`}.` : ''}`),
      cutNote,
      notes.value.trim() ? h('blockquote', { class: 'typed' }, notes.value.trim()) : null,
      h(
        'ul',
        { class: 'beats' },
        beats.map((b, i) =>
          isFillIn(b)
            ? h('li', { class: 'beat fill' }, h('span', { class: 'fill-in' }, `fill in: ${beatLabel(b)}`))
            : h('li', { class: 'beat' }, h('label', { for: `b${i}` }, boxes[i], h('span', {}, beatLabel(b)))),
        ),
      ),
      asksNumber ? h('label', { class: 'row-check extra', for: 'bnum' }, num, h('span', {}, 'I said a number')) : null,
      asksCode ? h('label', { class: 'row-check extra', for: 'bcode' }, code, h('span', {}, `I named the code reference (${card.answer.codeRef})`)) : null,
      grade,
    );
    body.scrollIntoView({ block: 'start', behavior: 'smooth' });
  });
  const lead = card.walkthrough
    ? ' Walk it through out loud, step by step and in order, as if they just asked you. Then Reveal and tick what you said — the ticks are the grade.'
    : ' Answer out loud as if they just asked you, then Reveal and tick what you said — the ticks are the grade.';
  body.append(
    h('p', { class: 'instruct' }, h('b', {}, 'Nobody is listening.'), lead),
    followUps.length ? h('p', { class: 'hint chain-hint' }, `${followUps.length === 1 ? 'A follow-up comes' : `${followUps.length} follow-ups come`} after you grade the main answer${interrupt ? ' — and the first may cut in while you are still talking' : ''}.`) : null,
    timer.el,
    h('details', { class: 'type-instead' }, h('summary', {}, 'Type bullets instead'), notes),
    reveal,
  );
  return body;
}

// ---------- 4.5 story rehearsal ----------

export function renderStory(card, { onSubmit, chain = true }) {
  const timing = { ...DEFAULT_STORY_TIMING, ...(card.answer.timing || {}) };
  const followUps = chain ? followUpsOf(card) : [];
  const body = h('div', { class: 'card-body story' });
  const timer = timerBar({ total: timing.limit, band: [timing.min, timing.max], limit: timing.max, kind: 'window' });
  const beats = card.answer.beats;
  const hits = beats.map(() => false);
  const chips = beats.map((b, i) => {
    if (isFillIn(b)) return h('button', { class: 'chip fill-in', type: 'button', disabled: true, title: 'Still open — not graded' }, `fill in: ${beatLabel(b)}`);
    const chip = h('button', { class: `chip k-${beatKind(b)}`, type: 'button', 'aria-pressed': 'false' }, beatLabel(b));
    chip.addEventListener('click', () => {
      hits[i] = !hits[i];
      chip.classList.toggle('on', hits[i]);
      chip.setAttribute('aria-pressed', String(hits[i]));
    });
    return chip;
  });

  // Optional local recording.
  let recorder = null;
  const recStatus = h('span', { class: 'rec-status', 'aria-live': 'polite' });
  const recBtn = canRecord() ? h('button', { class: 'btn rec', type: 'button' }, h('span', { class: 'rec-dot', 'aria-hidden': 'true' }), 'Record') : null;
  if (recBtn) {
    recBtn.addEventListener('click', async () => {
      if (recorder) return;
      recBtn.disabled = true;
      try {
        recorder = await startRecording();
        live.add(recorder.cancel);
        recBtn.classList.add('on');
        recBtn.lastChild.textContent = 'Recording';
        recStatus.textContent = 'On this phone only — plays back after the card.';
      } catch {
        recStatus.textContent = 'Microphone not available here. Rehearse without it.';
      }
    });
  }

  // Speaking ends on the first Done: the clock and the recording stop there, so
  // tapping the beats afterwards (if they were spoken but not tapped) costs no time.
  let ended = null;
  const endSpeaking = async () => {
    if (ended) return ended;
    timer.stop();
    const seconds = timer.elapsed();
    if (recBtn) recBtn.disabled = true;
    let audioUrl = null;
    if (recorder) {
      live.delete(recorder.cancel);
      audioUrl = await recorder.stop();
    }
    ended = { seconds, audioUrl };
    return ended;
  };
  const submit = () => {
    done.disabled = true;
    const main = { hits: [...hits], seconds: ended.seconds, audioUrl: ended.audioUrl };
    if (!followUps.length) return onSubmit(main, ended.seconds);
    // The drill-down: lock the beats, then each follow-up in turn.
    chips.forEach((c) => (c.disabled = true));
    done.remove();
    nudge.remove();
    runChain(body, followUps, { onDone: (layers) => onSubmit({ ...main, followUps: layers }, ended.seconds) });
  };
  const nudge = nudgeBox('No beat tapped. Tap the beats you hit, then Grade it — or grade this one as a miss.', submit);
  const done = submitButton('Done speaking', async () => {
    if (done.disabled) return;
    await endSpeaking();
    if (!hits.some(Boolean)) {
      if (!nudge.isConnected) done.before(nudge);
      done.textContent = followUps.length ? 'Next — they follow up' : 'Grade it';
      nudge.scrollIntoView({ block: 'nearest' });
      return;
    }
    submit();
  });
  body.append(
    h('p', { class: 'instruct' }, h('b', {}, 'The taps are the grade.'), ' Say it out loud and tap each beat below the moment you say it. Nobody is listening — a beat you spoke but did not tap counts as missed.'),
    h('p', { class: 'hint' }, `Clean = every beat tapped inside ${mmss(timing.min)}–${mmss(timing.max)}; past ${mmss(timing.limit)} is a ramble.${followUps.length ? ` Then they drill down: ${followUps.length} follow-up${followUps.length > 1 ? 's' : ''}.` : ''}`),
    timer.el,
    h('div', { class: 'chips' }, chips),
    recBtn ? h('div', { class: 'rec-row' }, recBtn, recStatus) : null,
    done,
  );
  return body;
}

// ---------- day-of: a story's hook line (not graded) ----------

export function renderHook(card, { onDone }) {
  const hook = (card.answer.beats || []).find((b) => b && b.kind === 'hook');
  const title = String(card.prompt || '').split(' — ')[0];
  const body = h('div', { class: 'card-body hook-card' });
  const reveal = h('button', { class: 'btn primary big', type: 'button', id: 'hook-reveal' }, 'Reveal the hook');
  reveal.addEventListener('click', () => {
    reveal.replaceWith(
      h('blockquote', { class: 'hook-line' }, hook && hook.quote ? `“${hook.quote}”` : beatLabel(hook || 'Hook')),
      submitButton('Next', onDone),
    );
  });
  body.append(h('p', { class: 'instruct' }, h('b', {}, 'Just the first line.'), ` Say the hook of ${title} out loud, the way you'll open it today. Not graded.`), reveal);
  return h('section', { class: 'card type-story' }, h('div', { class: 'card-head' }, h('span', { class: 'card-type' }, 'Hook line'), h('span', { class: 'card-meta' }, 'not graded')), h('h2', { class: 'prompt' }, `${title} — the hook`), body);
}

// ---------- 4.6 spot the defect ----------

export function renderDefect(card, { onSubmit }) {
  const elapsed = stopwatch();
  let selected = null;
  const btn = submitButton(
    'This line',
    () => {
      if (btn.disabled) return;
      btn.disabled = true;
      onSubmit({ index: selected }, elapsed());
    },
    { disabled: true },
  );
  const lines = card.answer.lines.map((line, i) => {
    const b = h('button', { class: 'line', type: 'button', 'aria-pressed': 'false' }, line);
    b.addEventListener('click', () => {
      selected = i;
      lines.forEach((x, j) => {
        x.classList.toggle('on', j === i);
        x.setAttribute('aria-pressed', String(j === i));
      });
      btn.disabled = false;
    });
    return b;
  });
  return h('div', { class: 'card-body defect' }, h('p', { class: 'hint' }, 'One line breaks a rule. Tap it, then confirm.'), h('div', { class: 'lines' }, lines), btn);
}

const RENDERERS = { number: renderNumber, order: renderOrder, matrix: renderMatrix, scenario: renderScenario, story: renderStory, defect: renderDefect };

export function renderCard(card, opts) {
  stopCardActivity();
  const r = RENDERERS[card.type];
  const layers = opts.chain === false ? 0 : followUpsOf(card).length;
  return h(
    'section',
    { class: `card type-${card.type}${card.walkthrough ? ' walkthrough' : ''}` },
    h('div', { class: 'card-head' }, h('span', { class: 'card-type' }, typeName(card.type, card)), h('span', { class: 'card-meta num' }, `par ${opts.par || card.par} s${layers ? ` · ${layers} follow-up${layers > 1 ? 's' : ''}` : ''}`)),
    card.interviewerPhrasing && card.interviewerPhrasing !== card.prompt ? h('p', { class: 'interviewer' }, `“${card.interviewerPhrasing}”`) : null,
    h('h2', { class: 'prompt' }, card.prompt),
    r ? r(card, opts) : h('p', {}, `Unknown card type ${card.type}`),
  );
}

// ---------- after the card ----------

const RESULT_LABEL = { clean: 'Clean', slipped: 'Slipped', missed: 'Missed' };

function mark(ok) {
  return h('span', { class: `mk ${ok ? 'ok' : 'bad'}`, 'aria-label': ok ? 'right' : 'wrong' }, ok ? '✓' : '✗');
}

function correctAnswer(card, grade, response = {}) {
  const a = card.answer;
  switch (card.type) {
    case 'number':
      return h(
        'ul',
        { class: 'answer-list' },
        grade.detail.fields.map((f) => h('li', { class: f.ok ? 'ok' : 'bad' }, mark(f.ok), h('span', { class: 'al-label' }, f.label), h('b', { class: 'al-value' }, String(f.expected)), f.ok ? null : h('span', { class: 'al-you' }, `you: ${f.given || 'blank'}`))),
        grade.detail.code
          ? h('li', { class: grade.detail.code.ok ? 'ok' : 'bad' }, mark(grade.detail.code.ok), h('span', { class: 'al-label' }, 'code'), h('b', { class: 'al-value' }, grade.detail.code.expected), grade.detail.code.ok ? null : h('span', { class: 'al-you' }, `you: ${grade.detail.code.given || 'blank'}`))
          : null,
      );
    case 'order': {
      const order = grade.detail.order || [];
      return h(
        'ol',
        { class: 'answer-list steps' },
        a.steps.map((st, j) => {
          const pos = order.indexOf(j);
          const ok = pos === j;
          return h('li', { class: ok ? 'ok' : 'bad' }, mark(ok), h('span', {}, st), ok || pos < 0 ? null : h('span', { class: 'al-you' }, `you placed it ${pos + 1}`));
        }),
      );
    }
    case 'matrix':
      return h(
        'div',
        { class: 'mx-result' },
        a.grid.inputs.map((inp, r) =>
          h(
            'section',
            { class: 'mx-input' },
            h('h3', { class: 'mx-title' }, inp),
            h(
              'ul',
              { class: 'mx-cells' },
              a.grid.outputs.map((out, c) => {
                const d = grade.detail.cells[r][c];
                const note = a.grid.notes?.[r]?.[c];
                return h(
                  'li',
                  { class: d.ok ? 'ok' : 'bad' },
                  h('span', { class: 'mx-out' }, out, note ? h('small', { class: 'mx-note' }, note) : null),
                  h('span', { class: 'mx-val' }, mark(d.ok), h('b', { class: cellClass(a.grid.cells[r][c]) }, a.grid.cells[r][c]), d.ok ? null : h('span', { class: 'al-you' }, `you: ${d.given || '·'}`)),
                );
              }),
            ),
          ),
        ),
      );
    case 'scenario': {
      const hits = response.hits || [];
      return h(
        'ul',
        { class: 'answer-list beats-result' },
        a.beats.map((b, i) => (isFillIn(b) ? h('li', { class: 'fill' }, h('span', { class: 'fill-in' }, `fill in: ${beatLabel(b)}`)) : h('li', { class: hits[i] ? 'ok' : 'bad' }, mark(!!hits[i]), h('span', {}, beatLabel(b))))),
      );
    }
    case 'story': {
      const hits = response.hits || [];
      return h(
        'div',
        {},
        h(
          'ul',
          { class: 'answer-list beats-result' },
          a.beats.map((b, i) =>
            isFillIn(b)
              ? h('li', { class: 'fill' }, h('span', { class: 'fill-in' }, `fill in: ${beatLabel(b)}`))
              : h('li', { class: hits[i] ? 'ok' : 'bad' }, mark(!!hits[i]), h('span', {}, h('strong', {}, beatLabel(b)), b.quote ? h('span', { class: 'quote' }, ` “${b.quote}”`) : null)),
          ),
        ),
        a.script ? h('details', { class: 'script', open: true }, h('summary', {}, 'The script — numbers highlighted'), h('div', { class: 'script-text', html: highlightScript(a.script) })) : null,
      );
    }
    case 'defect':
      return h(
        'ol',
        { class: 'answer-list lines-result' },
        a.lines.map((l, i) => h('li', { class: i === a.defectIndex ? 'defect' : i === grade.detail.given ? 'mine' : '' }, i === a.defectIndex ? h('span', { class: 'tag' }, 'the defect') : i === grade.detail.given ? h('span', { class: 'tag' }, 'your pick') : null, h('span', {}, l))),
      );
    default:
      return null;
  }
}

function checkIcon() {
  return s('svg', { class: 'check', viewBox: '0 0 24 24', 'aria-hidden': 'true' }, s('path', { d: 'M5 12.5l4.2 4.2L19 7' }));
}

const layerClass = (l) => (l.graded === false ? 'l-open' : l.result === 'missed' ? (l.framework ? 'l-missed' : 'l-missed nr') : `l-${l.result}`);
const LAYER_WORD = { clean: 'clean', slipped: 'slipped', missed: 'missed' };

// One dot per layer — the main answer and each follow-up — so a dropped follow-up shows.
export function layerDots(layers, followUps = []) {
  return h(
    'ol',
    { class: 'layer-dots', 'aria-label': 'Each layer of the answer' },
    layers.map((l, i) => {
      const name = i === 0 ? 'Main answer' : KIND_NAMES[l.kind] || followUps[i - 1]?.kind || `Follow-up ${i}`;
      const word = l.graded === false ? 'not graded' : LAYER_WORD[l.result];
      return h('li', { class: `ldot ${layerClass(l)}`, title: `${name}: ${word}` }, h('i', { 'aria-hidden': 'true' }), h('span', {}, name), h('small', {}, word));
    }),
  );
}

function followUpResults(card, grade, response) {
  const followUps = followUpsOf(card);
  if (!grade.layers || !followUps.length) return null;
  const given = response.followUps || [];
  return h(
    'div',
    { class: 'fu-results' },
    layerDots(grade.layers, followUps),
    followUps.map((f, k) => {
      const hits = (given[k] && given[k].hits) || [];
      return h(
        'section',
        { class: 'fu-result' },
        h('p', { class: 'fu-head' }, h('span', { class: 'fu-count num' }, `Follow-up ${k + 1}`), f.kind ? h('span', { class: `fu-kind k-${f.kind}` }, KIND_NAMES[f.kind] || f.kind) : null),
        h('p', { class: 'fu-prompt small' }, `“${f.prompt}”`),
        h(
          'ul',
          { class: 'answer-list beats-result' },
          (f.beats || []).map((b, i) => (isFillIn(b) ? h('li', { class: 'fill' }, h('span', { class: 'fill-in' }, `fill in: ${beatLabel(b)}`)) : h('li', { class: hits[i] ? 'ok' : 'bad' }, mark(!!hits[i]), h('span', {}, beatLabel(b))))),
        ),
      );
    }),
  );
}

function dontSayNote(card) {
  const d = card.answer && card.answer.dontSay;
  if (!d) return null;
  const items = Array.isArray(d) ? d : [d];
  return h('div', { class: 'dont-say' }, h('span', { class: 'label' }, 'Don’t say'), items.length > 1 ? h('ul', {}, items.map((x) => h('li', {}, x))) : h('p', {}, items[0]));
}

export function renderResult({ card, grade, seconds, response = {}, topicBefore, topicAfter, xp, rated, onNext, onSource, nextLabel = 'Next card', audioUrl = null, par = null }) {
  // The hook is for Needs Improvement / Not Ready (procedure-notes).
  const showHook = grade.result === 'missed';
  const level = grade.result === 'missed' ? (grade.framework ? 'ni' : 'nr') : grade.result === 'slipped' ? 'minor' : 'clean';
  const levelText = { clean: 'clean', minor: 'Minor Refresh level', ni: 'Needs Improvement level', nr: 'Not Ready level' }[level];
  return h(
    'section',
    { class: `result result-${grade.result} lvl-${level}` },
    h(
      'div',
      { class: 'result-head' },
      grade.result === 'clean' ? checkIcon() : null,
      h('h2', {}, RESULT_LABEL[grade.result], h('small', {}, ` · ${levelText}`)),
      h('span', { class: 'xp-gain num' }, `+${xp} XP`),
    ),
    h('p', { class: 'result-meta num' }, seconds != null ? `${mmss(seconds)} · par ${par || card.par} s${seconds < (par || card.par) && grade.result !== 'missed' && card.type !== 'story' ? ' · under par' : ''}` : ''),
    grade.note && grade.note !== 'clean' ? h('p', { class: 'note' }, grade.note) : null,
    h('div', { class: 'correction' }, h('span', { class: 'label' }, 'From the guide'), h('p', { class: 'explanation' }, card.answer.explanation)),
    showHook ? h('p', { class: 'hook' }, h('span', { class: 'label' }, 'Hook'), card.hook) : null,
    card.confirmInEdition ? h('p', { class: 'confirm' }, 'The guide says: confirm this section in your edition before you quote it.') : null,
    correctAnswer(card, grade, response),
    followUpResults(card, grade, response),
    dontSayNote(card),
    audioUrl ? h('div', { class: 'playback' }, h('span', { class: 'label' }, 'Your take'), h('audio', { controls: true, src: audioUrl, preload: 'auto' })) : null,
    rated && topicBefore && topicAfter
      ? h(
          'p',
          { class: 'topic-change' },
          h('b', {}, topicAfter.id),
          ' ',
          pill(topicBefore.rating),
          ' → ',
          pill(topicAfter.rating),
          h('span', { class: 'tc-meta' }, ` streak ${topicAfter.streak} · next ${topicAfter.next_review || '—'}`),
        )
      : h('p', { class: 'topic-change' }, 'Not rated — practice only.'),
    h('p', { class: 'reread' }, h('a', { href: '#', class: 'source', onclick: (e) => { e.preventDefault(); onSource(card.source); } }, `Re-read: ${card.source}`)),
    h('button', { class: 'btn primary big', type: 'button', onclick: onNext, autofocus: true }, nextLabel),
  );
}
