// ENERGIZE app controller: boot, state, the shift loop and screen routing.
// All game rules live in src/engine; this file only wires them to the DOM.

import { h, mount, vibrate, chime, pill } from './dom.js';
import { renderCard, renderResult, renderHook, stopCardActivity } from './cards.js';
import { mockScreen } from './boss.js';
import { campusMap } from './map.js';
import { setupPwa, promptInstall } from './pwa.js';
import {
  header, homeScreen, buildingScreen, debriefScreen, finalScreen, roundDoneScreen, settingsScreen, browseScreen, blitzScreen, storyListScreen,
} from './screens.js';
import { isIsoDate, localToday, formatDay } from '../engine/dates.js';
import { readiness, shiftHeadline, POINTS } from '../engine/rating.js';
import { gradeCard } from '../engine/grader.js';
import { BUILDINGS, campusStatus } from '../engine/campus.js';
import { buildShift, afterResult, keepGoing, drillPlan, blitzDeck } from '../engine/scheduler.js';
import { dayMode, daysToRound, normalizeNextRound, interruptOn, FOCUSES } from '../engine/round.js';
import {
  createState, recordResult, completeShift, currentDayStreak, save, load, clear, exportState, exportTopics, importJson, setBlitzScore,
} from '../engine/state.js';

const app = {};

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

function pickStorage() {
  try {
    const k = '__energize_probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return { storage: window.localStorage, ok: true };
  } catch {
    return { storage: memoryStorage(), ok: false };
  }
}

function readData() {
  const el = document.getElementById('energize-data');
  return JSON.parse(el.textContent);
}

// ?date=2026-11-11 overrides today's date for testing special days.
function resolveToday() {
  const q = new URLSearchParams(location.search).get('date');
  if (q && isIsoDate(q)) return { today: q, devDate: true };
  return { today: localToday(), devDate: false };
}

// QA overrides, never saved: ?round=YYYY-MM-DD|none sets the next round's date,
// ?focus=technical|behavioral its focus; ?interruptAt=<s> makes follow-up 1 cut in at
// that second instead of a random one in 40–70 s.
function resolveDev() {
  const p = new URLSearchParams(location.search);
  const round = {};
  const r = p.get('round');
  if (r === 'none') round.date = null;
  else if (r && isIsoDate(r)) round.date = r;
  const f = p.get('focus');
  if (FOCUSES.includes(f)) round.focus = f;
  const at = Number(p.get('interruptAt'));
  return { devRound: Object.keys(round).length ? round : null, interruptAt: p.has('interruptAt') && Number.isFinite(at) ? at : null };
}

// The settings the engine sees: saved settings with any ?round= / ?focus= override.
function effectiveSettings() {
  const s = app.state.settings;
  return { ...s, nextRound: normalizeNextRound({ ...s.nextRound, ...(app.devRound || {}) }) };
}
const nextRound = () => effectiveSettings().nextRound;
const modeToday = () => dayMode(app.today, nextRound());

function persist() {
  try {
    save(app.storage, app.state);
  } catch (e) {
    console.warn('save failed', e);
  }
}

// Text with a space between every text node, so table cells don't run together.
function spacedText(node) {
  const walker = node.ownerDocument.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const parts = [];
  while (walker.nextNode()) parts.push(walker.currentNode.nodeValue);
  return parts.join(' ').replace(/\s+/g, ' ');
}

function docSections(template, headings) {
  const pathById = new Map(headings.map((x) => [x.id, x.path]));
  const sections = [];
  let cur = null;
  for (const node of template.content.children) {
    if (/^H[1-4]$/.test(node.tagName)) {
      cur = { id: node.id, path: pathById.get(node.id) || node.textContent, text: node.textContent };
      sections.push(cur);
    } else if (cur) cur.text += ` ${spacedText(node)}`;
  }
  return sections;
}

// A card's `source` ("Pre-action › Data center points to make") → the best
// heading: the longest heading path it starts with, else the first segment.
export function findSource(source, docs) {
  const s = String(source || '').trim();
  let best = null;
  for (const [doc, d] of Object.entries(docs)) {
    for (const hd of d.headings) {
      const hit = s === hd.path || s.startsWith(`${hd.path} › `) || s === hd.text || s.startsWith(`${hd.text} › `);
      if (hit && (!best || hd.path.length > best.len)) best = { doc, id: hd.id, len: hd.path.length };
    }
  }
  return best;
}

function boot() {
  app.data = readData();
  app.root = document.getElementById('app');
  const { storage, ok } = pickStorage();
  app.storage = storage;
  app.storageOk = ok;
  Object.assign(app, resolveToday(), resolveDev());

  // ?deck=sample forces the sample deck (tools/smoke.js uses it); otherwise the
  // sample deck is only a fallback while questions.json is empty.
  app.usingSample = !app.data.questions.length || new URLSearchParams(location.search).get('deck') === 'sample';
  app.bank = app.usingSample ? app.data.sample : app.data.questions;
  app.cardById = new Map(app.bank.map((c) => [c.id, c]));
  app.countByTopic = {};
  for (const c of app.bank) app.countByTopic[c.topicId] = (app.countByTopic[c.topicId] || 0) + 1;

  // The rendered guide stays inert in its <template>; the search index over it is
  // built the first time Browse opens (it is not needed to draw the home screen).
  app.docs = {};
  for (const doc of ['guide', 'scripts']) {
    const template = document.getElementById(`doc-${doc}`);
    const headings = app.data.docs[doc].headings;
    app.docs[doc] = { template, headings, sections: null };
  }

  app.state = load(app.storage) || createState(app.data.topics, { today: app.today });
  persist();
  window.energize = app; // debugging / headless checks
  app.go = go;
  app.updateReady = false;
  app.pwa = setupPwa({
    onUpdateReady: () => {
      app.updateReady = true;
      if (app.route === 'home') home();
    },
    onInstallable: () => {
      if (app.route === 'settings') settings();
    },
  });
  // ?card=P2-num-01 opens that one card as a practice drill (QA, audits).
  const devCard = app.cardById.get(new URLSearchParams(location.search).get('card') || '');
  if (devCard) return startShift('single', { card: devCard });
  go('home');
  app.bootMs = Math.round(performance.now());
}

function ensureDocIndex() {
  for (const d of Object.values(app.docs)) if (!d.sections) d.sections = docSections(d.template, d.headings);
  return app.docs;
}

// ---------- routing ----------

function go(route, arg) {
  stopCardActivity();
  if (app.stopBlitz) {
    app.stopBlitz();
    app.stopBlitz = null;
  }
  releaseAudio();
  app.route = route;
  window.scrollTo(0, 0);
  const screens = { home, shift: showSlot, building, browse, settings, blitz, stories, mock, final };
  (screens[route] || home)(arg);
}

function topBar({ settingsButton = false } = {}) {
  return header({
    onSettings: settingsButton ? () => go('settings') : null,
    today: app.today,
    devDate: app.devDate,
    devRound: !!app.devRound,
    daysLeft: daysToRound(app.today, nextRound()),
    nextRound: nextRound(),
    rd: readiness(app.state.topics),
    mode: modeToday(),
    xp: app.state.xp,
    dayStreak: currentDayStreak(app.state, app.today),
    deckNote: app.usingSample ? `Sample deck — ${app.bank.length} cards (${app.data.questions.length ? '?deck=sample' : 'src/data/questions.json is empty'})` : '',
  });
}

const shiftCtx = () => ({ topics: app.state.topics, cards: app.bank, history: app.state.history, today: app.today, settings: effectiveSettings() });

function activeShift() {
  const s = app.state.currentShift;
  if (!s || s.date !== app.today) return null;
  return s.slots.some((x) => !x.done) ? s : null;
}

function dayOfHint(plan, focus) {
  const quick = plan.slots.filter((x) => x.slot === 'confidence').length;
  const lead = `${quick} quick confidence card${quick === 1 ? '' : 's'} from your strongest topics`;
  if (focus === 'technical') return `${lead}${plan.slots.some((x) => x.slot === 'warmup') ? ', then one walkthrough as a 90-second warm-up' : ''}. Nothing else today.`;
  const hooks = plan.slots.filter((x) => x.slot === 'hook').length;
  return `${lead}${plan.slots.some((x) => x.slot === 'intro') ? ', then the 60-second intro' : ''}${hooks ? ` and the hook line${hooks > 1 ? 's' : ''} of Story 1 and Story 3` : ''}. Nothing else today.`;
}

// With no date set, a standing banner asks for one (until then: a rolling 7-day horizon).
function roundBanner(mode) {
  const nr = nextRound();
  if (nr.date || mode !== 'normal') return null;
  return h(
    'div',
    { class: 'round-banner', id: 'round-banner', role: 'status' },
    h('span', {}, h('b', {}, `${nr.label} has no date yet.`), ' Set it when the recruiter gives you one — the day before becomes the sweep. Until then, reviews run on a rolling 7-day horizon.'),
    h('button', { class: 'btn small', type: 'button', id: 'set-round-date', onclick: () => go('settings') }, 'Set the date'),
  );
}

function home() {
  const mode = modeToday();
  const nr = nextRound();
  if (mode === 'after') return go('final', { after: true });
  const resume = activeShift();
  const shiftDone = app.state.lastShiftDate === app.today;
  let primary;
  let hint = '';
  if (resume) {
    const left = resume.slots.filter((x) => !x.done).length;
    primary = h('button', { class: 'btn primary huge', id: 'start-shift', type: 'button', onclick: () => go('shift') }, `Resume ${resume.kind === 'daily' ? 'shift' : resume.kind} · ${left} card${left > 1 ? 's' : ''} left`);
  } else if (mode === 'dayof' && shiftDone) {
    return go('final', { after: false });
  } else if (shiftDone) {
    const more = keepGoing(shiftCtx());
    primary = more.slots.length
      ? h('button', { class: 'btn primary huge', id: 'start-shift', type: 'button', onclick: () => startShift('keep') }, `Shift done · Keep going · ${more.slots.length} more`)
      : h('p', { class: 'done' }, "Shift done and today's queue is empty.");
    if (more.slots.length) hint = 'Keep going pulls the next five due topics. Ratings move the same way.';
  } else {
    const plan = buildShift(shiftCtx());
    const label = mode === 'dayof' ? `${nr.label} today · ${plan.slots.length} cards` : `Start shift · ${plan.slots.length} card${plan.slots.length === 1 ? '' : 's'} · ~${plan.estimatedMinutes} min`;
    primary = plan.slots.length
      ? h('button', { class: 'btn primary huge', id: 'start-shift', type: 'button', onclick: () => startShift('daily') }, label)
      : h('p', { class: 'done' }, `Nothing due today in the ${app.usingSample ? 'sample deck' : 'question bank'}.`);
    if (plan.slots.length && mode !== 'dayof') hint = `${plan.outLoud} of ${plan.slots.length} out loud. A clean first answer adds a follow-up card on the same topic.`;
    if (mode === 'dayof') hint = dayOfHint(plan, nr.focus);
  }
  const secondary =
    mode === 'dayof'
      ? []
      : [
          h('button', { class: 'btn nav', type: 'button', id: 'nav-blitz', onclick: () => go('blitz') }, 'Number Blitz'),
          h('button', { class: 'btn nav', type: 'button', id: 'nav-stories', onclick: () => go('stories') }, 'Stories'),
          h('button', { class: 'btn nav', type: 'button', id: 'nav-mock', onclick: () => go('mock') }, 'Mock interview'),
          h('button', { class: 'btn nav', type: 'button', id: 'nav-browse', onclick: () => go('browse') }, 'Browse'),
        ];
  const celebrate = app.pendingCelebrate || [];
  app.pendingCelebrate = [];
  mount(
    app.root,
    topBar({ settingsButton: mode !== 'dayof' }),
    homeScreen({
      banner: roundBanner(mode),
      status: campusStatus(app.state.topics),
      buildings: BUILDINGS,
      mode,
      primary,
      hint,
      secondary,
      celebrate,
      updateReady: app.updateReady,
      onReload: () => location.reload(),
      onBuilding: (id) => go('building', id),
    }),
  );
}

// ---------- the shift loop ----------

function startShift(kind, opts = {}) {
  const ctx = shiftCtx();
  let shift;
  if (kind === 'daily') shift = buildShift(ctx);
  else if (kind === 'keep') shift = keepGoing(ctx);
  else if (kind === 'drill') shift = drillPlan({ ...ctx, topicId: opts.topicId });
  else if (kind === 'single') shift = { date: app.today, mode: 'drill', size: 1, slots: [{ topicId: opts.card.topicId, cardId: opts.card.id, type: opts.card.type, slot: 'drill', done: false }], estimatedMinutes: 2 };
  if (!shift || !shift.slots.length) return go('home');
  app.state.currentShift = { ...shift, kind, readinessBefore: readiness(app.state.topics), energizedDuring: [] };
  persist();
  go('shift');
}

const SLOT_LABEL = {
  redo: 'Redo', coverage: 'Coverage', spot: 'Spot check', outloud: 'Out loud', followup: 'Follow-up card', fill: 'Coverage', sweep: 'Sweep',
  walkthrough: 'Walkthrough', story: 'Story', ladder: 'Drill-down', interview: 'Interview',
  confidence: 'Confidence', intro: 'Your 60-second intro', warmup: 'Warm-up', hook: 'Hook line', drill: 'Drill', keep: 'Keep going',
};

function shiftProgress(shift, idx, { onPause = null } = {}) {
  const done = shift.slots.filter((s) => s.done).length;
  return h(
    'div',
    { class: 'progress' },
    h(
      'div',
      { class: 'progress-top' },
      h('div', { class: 'progress-label num' }, `Card ${idx + 1} of ${shift.slots.length}`),
      onPause ? h('button', { class: 'btn ghost small', type: 'button', id: 'pause-shift', onclick: onPause }, 'Pause') : null,
    ),
    h(
      'div',
      { class: 'dots', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(shift.slots.length), 'aria-valuenow': String(done) },
      shift.slots.map((s, i) => h('span', { class: `dot${s.done ? ' is-done' : ''}${i === idx ? ' now' : ''}${s.slot === 'followup' ? ' follow' : ''}` })),
    ),
  );
}

// A story recording is a blob URL held in memory; drop it when the screen changes.
function releaseAudio() {
  if (app.audioUrl) {
    try {
      URL.revokeObjectURL(app.audioUrl);
    } catch {
      /* gone already */
    }
    app.audioUrl = null;
  }
}

function showSlot() {
  const shift = app.state.currentShift;
  if (!shift) return go('home');
  const idx = shift.slots.findIndex((s) => !s.done);
  if (idx < 0) return finishShift();
  const slot = shift.slots[idx];
  const card = app.cardById.get(slot.cardId);
  if (!card) {
    // The bank changed under a saved shift: skip the stale slot.
    shift.slots[idx] = { ...slot, done: true, skipped: true };
    persist();
    return showSlot();
  }
  const t = app.state.topics.find((x) => x.id === card.topicId);
  // Day-of: a story's hook line is said, not graded.
  const view =
    slot.slot === 'hook'
      ? renderHook(card, {
          onDone: () => {
            shift.slots[idx] = { ...slot, done: true };
            persist();
            go('shift');
          },
        })
      : renderCard(card, {
          seed: app.today,
          par: slot.par || null,
          chain: slot.chain !== false,
          interrupt: interruptOn(effectiveSettings()),
          interruptAt: app.interruptAt,
          onSubmit: (response, seconds) => onGraded(idx, card, response, seconds),
        });
  mount(
    app.root,
    shiftProgress(shift, idx, { onPause: () => go('home') }),
    h(
      'div',
      { class: 'slot-label' },
      h('span', { class: `slot-kind s-${slot.slot}` }, SLOT_LABEL[slot.slot] || slot.slot),
      t ? h('span', { class: 'slot-topic' }, h('b', {}, t.id), ` ${t.topic}`) : h('span', { class: 'slot-topic' }, card.topicId),
      t ? pill(t.rating) : null,
    ),
    view,
  );
  const first = view.querySelector('input, button.step, button.cell, button.line, button.chip, button.primary');
  if (first && first.tagName === 'INPUT') first.focus();
}

function onGraded(idx, card, response, seconds) {
  const shift = app.state.currentShift;
  const slot = shift.slots[idx];
  const rated = shift.mode !== 'dayof';
  const grade = gradeCard(card, response, { followUps: slot.chain !== false });
  const rec = recordResult(app.state, { card, grade, seconds, date: app.today, mode: shift.kind === 'daily' ? shift.mode : shift.kind, rated, cards: app.bank, nextRound: nextRound() });
  app.state = rec.state;
  const next = afterResult(shift, idx, { topics: app.state.topics, cards: app.bank, history: app.state.history, today: app.today });
  app.state.currentShift = { ...shift, ...next, energizedDuring: [...(shift.energizedDuring || []), ...rec.newlyEnergized] };
  persist();
  if (grade.result === 'clean') {
    vibrate(app.state.settings.haptics);
    chime(app.state.settings.sound);
  }
  const remaining = app.state.currentShift.slots.filter((s) => !s.done).length;
  releaseAudio();
  app.audioUrl = response.audioUrl || null;
  window.scrollTo(0, 0);
  mount(
    app.root,
    shiftProgress(app.state.currentShift, idx),
    renderResult({
      card,
      grade,
      seconds,
      response,
      audioUrl: app.audioUrl,
      topicBefore: rec.topicBefore,
      topicAfter: rec.topicAfter,
      xp: rec.xp,
      rated,
      par: slot.par || null,
      onNext: () => go('shift'),
      onSource: (src) => go('browse', { source: src, back: 'shift' }),
      nextLabel: remaining ? 'Next card' : 'Finish',
    }),
  );
}

function finishShift() {
  const shift = app.state.currentShift;
  if (shift.kind === 'daily') app.state = completeShift(app.state, app.today);
  app.state.currentShift = null;
  persist();
  app.pendingCelebrate = [...new Set(shift.energizedDuring || [])].filter((id) => app.state.energized.includes(id));
  if (shift.mode === 'dayof') return go('final', { after: false });

  const touched = [...new Set(shift.slots.filter((s) => s.done && !s.skipped).map((s) => s.topicId))];
  const topicsAfter = touched.map((id) => app.state.topics.find((t) => t.id === id)).filter(Boolean);
  const worstSource = (id) => {
    const todays = app.state.history.filter((x) => x.topicId === id && x.date === app.today);
    const rank = { missed: 0, slipped: 1, clean: 2 };
    todays.sort((a, b) => rank[a.result] - rank[b.result]);
    return todays.length ? app.cardById.get(todays[0].cardId)?.source : null;
  };
  // Weakest = topics that did not get a clean session today.
  const weakest = [...topicsAfter]
    .filter((t) => t.streak === 0)
    .sort((a, b) => POINTS[a.rating] - POINTS[b.rating] || ['Core', 'Support', 'Light'].indexOf(a.weight) - ['Core', 'Support', 'Light'].indexOf(b.weight))
    .slice(0, 3)
    .map((t) => ({ topic: t, source: worstSource(t.id) }));
  const more = keepGoing(shiftCtx());
  mount(
    app.root,
    topBar(),
    debriefScreen({
      headline: shiftHeadline(topicsAfter),
      before: shift.readinessBefore,
      after: readiness(app.state.topics),
      weakest,
      planRow: app.data.plan.find((p) => p.date === app.today),
      energized: (shift.energizedDuring || []).map((id) => BUILDINGS.find((b) => b.id === id)).filter(Boolean),
      kind: shift.kind,
      moreAvailable: more.slots.length > 0,
      onKeepGoing: () => startShift('keep'),
      onHome: () => go('home'),
      onSource: (src) => go('browse', { source: src, back: 'home' }),
      onBlitz: () => go('blitz'),
      onStory: () => go('stories'),
    }),
  );
}

// ---------- other screens ----------

function building(id) {
  const b = BUILDINGS.find((x) => x.id === id);
  if (!b) return go('home');
  const status = campusStatus(app.state.topics).find((x) => x.id === b.id);
  mount(app.root, topBar(), buildingScreen({ building: b, status, topics: app.state.topics, cardCount: (tid) => app.countByTopic[tid] || 0, onDrill: (topicId) => startShift('drill', { topicId }), onBack: () => go('home') }));
}

function browse(arg = {}) {
  const docs = ensureDocIndex();
  const target = arg.source ? findSource(arg.source, docs) : null;
  mount(app.root, browseScreen({ docs, target, onBack: () => go(['shift', 'mock'].includes(arg.back) ? arg.back : 'home') }));
}

// Saving a next round: a fresh date or focus starts the new schedule; ratings carry over.
function saveNextRound(nr) {
  app.state.settings = { ...app.state.settings, nextRound: normalizeNextRound(nr) };
  persist();
  const s = app.state.settings.nextRound;
  return s.date ? `Saved: ${s.label} on ${formatDay(s.date)}, ${s.focus} focus. The sweep is the day before.` : `Saved: ${s.label}, ${s.focus} focus, no date yet.`;
}

function settings() {
  mount(
    app.root,
    settingsScreen({
      settings: app.state.settings,
      nextRound: app.state.settings.nextRound,
      today: app.today,
      interruptDefault: interruptOn({ nextRound: nextRound() }),
      devRound: !!app.devRound,
      onNextRound: (nr) => {
        const msg = saveNextRound(nr);
        app.state.currentShift = null;
        persist();
        return msg;
      },
      storageOk: app.storageOk,
      pwa: {
        served: app.pwa.served,
        standalone: app.pwa.standalone,
        canInstall: !!app.pwa.installPrompt,
        onInstall: () => promptInstall(app.pwa).then(() => settings()),
      },
      buildInfo: `Build ${app.data.build.time} · v${app.data.build.version || '?'} · ${app.bank.length} cards (${app.usingSample ? 'sample deck' : 'questions.json'})`,
      onSetting: (k, v) => {
        app.state.settings = { ...app.state.settings, [k]: v };
        persist();
      },
      onImport: (text) => {
        const r = importJson(app.state, text);
        app.state = r.state;
        persist();
        return r.kind === 'topics' ? `Imported ${r.state.topics.length} topics — ratings carried over.` : `Restored state: ${r.state.history.length} card results, ${r.state.xp} XP.`;
      },
      onExport: (kind) => {
        const text = kind === 'topics' ? exportTopics(app.state) : exportState(app.state);
        download(`energize-${kind}-${app.today}.json`, text);
        return text;
      },
      onReset: () => {
        clear(app.storage);
        app.state = createState(app.data.topics, { today: app.today });
        persist();
        go('home');
      },
      onBack: () => go('home'),
    }),
  );
}

function download(name, text) {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = h('a', { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    console.warn('download failed; use the text box', e);
  }
}

function blitz() {
  const deck = blitzDeck({ topics: app.state.topics, cards: app.bank });
  mount(
    app.root,
    blitzScreen({
      deck,
      best: app.state.blitzBest || 0,
      onTick: (stop) => (app.stopBlitz = stop),
      onDone: (score) => {
        app.state = setBlitzScore(app.state, score);
        persist();
        go('home');
      },
      onBack: () => go('home'),
    }),
  );
}

function stories() {
  mount(app.root, storyListScreen({ cards: app.bank, topics: app.state.topics, onPick: (card) => startShift('single', { card }), onBack: () => go('home') }));
}

function mock() {
  mount(
    app.root,
    mockScreen({
      mock: app.data.mock,
      interrupt: interruptOn(effectiveSettings()),
      interruptAt: app.interruptAt,
      onBack: () => go('home'),
      onSource: (src) => go('browse', { source: src, back: 'mock' }),
      onCard: (cardId) => {
        const card = app.cardById.get(cardId);
        if (card) startShift('single', { card });
      },
    }),
  );
}

// "Round 2" → "Round 3"; anything else is kept for the player to rename.
function nextLabel(label) {
  const m = /^(.*?)(\d+)\s*$/.exec(label || '');
  return m ? `${m[1]}${Number(m[2]) + 1}` : label;
}

function final(arg = {}) {
  const rd = readiness(app.state.topics);
  const stats = `${app.state.history.length} cards answered · ${app.state.xp} XP · best Blitz ${app.state.blitzBest || 0}`;
  if (!arg.after) {
    // Day-of, after the last card: stop. Nothing else is offered.
    mount(app.root, topBar(), finalScreen({ checklist: app.data.checklist, rd, stats }));
    return;
  }
  // After the round: set the next one. The gear stays so state can be exported.
  const nr = nextRound();
  const map = campusMap({ status: campusStatus(app.state.topics), buildings: BUILDINGS, interactive: false });
  mount(
    app.root,
    topBar({ settingsButton: true }),
    roundDoneScreen({
      doneLabel: nr.label,
      nextRound: { ...nr, label: nextLabel(nr.label) },
      today: app.today,
      rd,
      stats,
      map,
      onSave: (next) => {
        saveNextRound(next);
        app.devRound = null;
        go('home');
        return '';
      },
      onSettings: () => go('settings'),
    }),
  );
}

export function start() {
  try {
    boot();
  } catch (e) {
    console.error(e);
    const el = document.getElementById('app');
    if (el) el.textContent = `ENERGIZE failed to start: ${e && e.message}`;
  }
}
