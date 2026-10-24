// Screens: header, home, building, debrief, final, stories, Blitz, settings,
// browse. The data each screen needs is computed by the engine; these only draw.

import { h, s, mount, pill, ratingClass, mmss } from './dom.js';
import { campusMap, buildingArt } from './map.js';
import { formatPercent, POINTS } from '../engine/rating.js';
import { formatDay } from '../engine/dates.js';

const MODE_LABEL = {
  normal: '',
  cutover: 'Cutover week — 10-card shifts, 2 of them stories',
  sweep: 'Nov 1 — the sweep: every topic not Locked In, up to 20 cards, misses redone before it ends',
  interview: 'Interview day — six quick cards and your 60-second intro, then stop',
  after: 'After the interview',
};

const FLAME = 'M7 0c1 4 6 6 6 10.5a6 6 0 0 1-12 0C1 8 3 6.5 4 5c.5 2 1.5 3 2.5 3C6 5 7 2.5 7 0Z';

function flame(on) {
  return s('svg', { class: `flame${on ? ' on' : ''}`, viewBox: '0 0 14 17', 'aria-hidden': 'true' }, s('path', { d: FLAME }));
}

function gearIcon() {
  return s(
    'svg',
    { class: 'icon', viewBox: '0 0 24 24', 'aria-hidden': 'true' },
    s('path', { d: 'M4 7h9M17 7h3M4 17h3M11 17h9', 'stroke-width': '2', 'stroke-linecap': 'round' }),
    s('circle', { cx: '15', cy: '7', r: '2.4', 'stroke-width': '2' }),
    s('circle', { cx: '9', cy: '17', r: '2.4', 'stroke-width': '2' }),
  );
}

function statTile({ id, value, label, fill, target, full }) {
  return h(
    'div',
    { class: 'stat' },
    h('b', { id }, value),
    h('span', {}, label),
    h('div', { class: `bar${full ? ' full' : ''}`, 'aria-hidden': 'true' }, h('i', { style: { width: `${Math.round(Math.max(0, Math.min(1, fill)) * 1000) / 10}%` } })),
    target != null ? h('div', { class: 'target', style: { left: `${target * 100}%` }, title: 'Target 85% by Nov 1' }) : null,
  );
}

export function header({ today, devDate, daysLeft, rd, mode, xp, dayStreak, deckNote, onSettings }) {
  const when = mode === 'interview' ? 'Interview day' : mode === 'after' ? 'After the interview' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} to the interview · Nov 2`;
  return h(
    'header',
    { class: 'top' },
    h(
      'div',
      { class: 'top-line' },
      h(
        'div',
        { class: 'when' },
        h('div', { class: 'date' }, formatDay(today), devDate ? h('span', { class: 'badge dev', title: 'Date overridden with ?date=' }, 'dev date') : null),
        h('div', { class: 'days' }, when),
      ),
      h(
        'div',
        { class: 'top-right' },
        h('span', { class: 'xp num', title: 'Day streak · XP' }, flame(dayStreak > 0), `${dayStreak} · ${xp} XP`),
        onSettings ? h('button', { class: 'btn ghost icon-btn', type: 'button', id: 'nav-settings', 'aria-label': 'Settings', onclick: onSettings }, gearIcon()) : null,
      ),
    ),
    h(
      'div',
      { class: 'readiness' },
      statTile({ id: 'r-overall', value: formatPercent(rd.overall), label: 'overall', fill: rd.overall, target: 0.85, full: rd.targetMet }),
      statTile({ id: 'r-tested', value: formatPercent(rd.onTested), label: 'on tested', fill: rd.onTested }),
      statTile({ id: 'r-count', value: `${rd.tested} of ${rd.total}`, label: 'tested', fill: rd.total ? rd.tested / rd.total : 0 }),
    ),
    h(
      'div',
      { class: 'top-meta' },
      h('span', {}, 'Target 85% by Nov 1'),
      h('span', {}, rd.coreBelowMinor.length ? `${rd.coreBelowMinor.length} Core below Minor Refresh` : 'No Core below Minor Refresh'),
    ),
    MODE_LABEL[mode] ? h('div', { class: 'mode' }, MODE_LABEL[mode]) : null,
    deckNote ? h('div', { class: 'deck-note' }, deckNote) : null,
  );
}

function legend() {
  return h(
    'div',
    { class: 'legend', 'aria-hidden': 'true' },
    h('span', {}, h('i', { class: 'sw dark' }), 'dark'),
    h('span', {}, h('i', { class: 'sw warm' }), 'coming up'),
    h('span', {}, h('i', { class: 'sw lit' }), 'energized'),
  );
}

function buildingRow(b, st, onBuilding) {
  const pct = Math.round(st.readiness * 100);
  return h(
    'li',
    {},
    h(
      'button',
      { class: `bld-row ${st.energized ? 'energized' : st.readiness > 0 ? 'warm' : 'dark'}`, type: 'button', onclick: () => onBuilding(b.id) },
      h('span', { class: 'bld-name' }, b.name),
      h('span', { class: 'bld-pct num' }, st.energized ? 'energized' : `${pct}%`),
      h('span', { class: 'bld-area' }, `${b.area} · ${st.topics} topics · ${Math.round(st.lockedShare * 100)}% Locked In`),
      h('span', { class: 'bld-bar', 'aria-hidden': 'true' }, h('i', { style: { width: `${pct}%` } })),
    ),
  );
}

export function homeScreen({ status, buildings, mode, primary, hint, secondary, celebrate = [], updateReady = false, onReload, onBuilding }) {
  const interactive = mode !== 'interview' && mode !== 'after';
  const byId = new Map(status.map((x) => [x.id, x]));
  const just = celebrate.map((id) => buildings.find((b) => b.id === id)).filter(Boolean);
  return h(
    'main',
    { class: 'home' },
    updateReady
      ? h(
          'div',
          { class: 'update-note', role: 'status', id: 'update-note' },
          h('span', {}, 'A newer build is ready.'),
          h('button', { class: 'btn small', type: 'button', id: 'reload-app', onclick: onReload }, 'Reload'),
        )
      : null,
    h(
      'figure',
      { class: 'campus' },
      campusMap({ status, buildings, interactive, celebrate, onBuilding }),
      just.length
        ? h('figcaption', { class: 'energized-note' }, just.map((b) => h('p', {}, h('b', {}, `${b.name} energized. `), `“${b.quote}”`)))
        : h('figcaption', {}, legend()),
    ),
    h('div', { class: 'primary-actions' }, primary, hint ? h('p', { class: 'hint center' }, hint) : null),
    secondary.length ? h('nav', { class: 'secondary', 'aria-label': 'More' }, secondary) : null,
    interactive
      ? h(
          'section',
          { class: 'buildings' },
          h('h2', { class: 'section-title' }, 'Buildings'),
          h('ul', { class: 'bld-list' }, buildings.map((b) => buildingRow(b, byId.get(b.id), onBuilding))),
          h('p', { class: 'tiny' }, 'Windows light with each area' + "'" + 's weighted readiness. A building energizes when every topic in it is at least Minor Refresh and 60% of its weight is Locked In.'),
        )
      : null,
  );
}

// ---------- building view ----------

function shortDate(iso) {
  if (!iso) return '—';
  try {
    return formatDay(iso).replace(/^\w+\s/, '');
  } catch {
    return iso;
  }
}

function topicCard(t, count, onDrill) {
  return h(
    'li',
    { class: `topic ${ratingClass(t.rating)}` },
    h('div', { class: 'topic-head' }, h('b', { class: 'topic-id' }, t.id), h('span', { class: 'topic-name' }, t.topic)),
    h('div', { class: 'topic-meta' }, pill(t.rating, `${t.rating} · ${POINTS[t.rating]}`), h('span', {}, t.weight), h('span', {}, `streak ${t.streak}`), h('span', {}, `${t.tests} test${t.tests === 1 ? '' : 's'}`), h('span', {}, `next ${shortDate(t.next_review)}`)),
    t.last_result ? h('p', { class: 'topic-last' }, `Last: ${t.last_result}`) : null,
    h('button', { class: 'btn small drill', type: 'button', disabled: !count, onclick: () => onDrill(t.id) }, count ? `Drill this · ${count} card${count > 1 ? 's' : ''}` : 'No cards yet'),
  );
}

export function buildingScreen({ building, status, topics, cardCount, onDrill, onBack }) {
  const own = topics.filter((t) => t.area === building.area);
  const below = own.filter((t) => POINTS[t.rating] < POINTS['Minor Refresh']).length;
  const rule = status.energized
    ? h('p', { class: 'rule met' }, 'Energized: every topic is at least Minor Refresh and ', h('b', {}, `${Math.round(status.lockedShare * 100)}%`), ' of the weight is Locked In.')
    : h(
        'p',
        { class: 'rule' },
        'To energize: ',
        below ? h('b', {}, `${below} topic${below > 1 ? 's' : ''} below Minor Refresh`) : 'every topic at Minor Refresh or better ✓',
        ' · Locked In weight ',
        h('b', {}, `${Math.round(status.lockedShare * 100)}%`),
        ' of 60%.',
      );
  return h(
    'main',
    { class: 'building-view' },
    h('button', { class: 'btn back', type: 'button', onclick: onBack }, '← Campus'),
    h('div', { class: `building-hero ${status.energized ? 'energized' : status.readiness > 0 ? 'warm' : 'dark'}` }, buildingArt({ id: building.id, status, name: building.name })),
    h('h1', {}, building.name),
    h('p', { class: 'b-sub' }, `${building.area} · ${formatPercent(status.readiness, 0)} weighted readiness`),
    rule,
    h('blockquote', { class: 'quote' }, `“${building.quote}”`, h('cite', {}, building.quoteSource)),
    h('h2', { class: 'section-title' }, `${own.length} topics`),
    h('ul', { class: 'topic-list' }, own.map((t) => topicCard(t, cardCount(t.id), onDrill))),
  );
}

// ---------- shift debrief ----------

function deltaTile(label, before, after) {
  const up = after - before;
  return h(
    'div',
    { class: 'stat delta-tile' },
    h('b', { class: 'num' }, formatPercent(after)),
    h('span', {}, label, h('em', { class: up > 0 ? 'up' : 'flat' }, up > 0 ? ` +${(up * 100).toFixed(1)}` : ' ±0')),
  );
}

export function debriefScreen({ headline, before, after, weakest, planRow, energized, kind, moreAvailable, onKeepGoing, onHome, onSource, onBlitz, onStory }) {
  return h(
    'main',
    { class: 'debrief' },
    h('h1', {}, kind === 'daily' ? 'Shift debrief' : 'Debrief'),
    h('p', { class: 'headline' }, headline.text),
    h('div', { class: 'readiness' }, deltaTile('overall', before.overall, after.overall), deltaTile('on tested', before.onTested, after.onTested), h('div', { class: 'stat' }, h('b', { class: 'num' }, `${after.tested} of ${after.total}`), h('span', {}, 'tested'))),
    h('p', { class: 'delta' }, `Readiness ${formatPercent(before.overall)} → ${formatPercent(after.overall)} overall · ${formatPercent(before.onTested)} → ${formatPercent(after.onTested)} on tested · ${after.tested} of ${after.total} tested`),
    energized.length ? h('div', { class: 'energized-note static' }, energized.map((b) => h('p', {}, h('b', {}, `${b.name} energized. `), `“${b.quote}”`))) : null,
    weakest.length
      ? h(
          'section',
          { class: 'panel' },
          h('h2', { class: 'section-title' }, 'Re-read tonight'),
          h(
            'ul',
            { class: 'reread-list' },
            weakest.map((w) =>
              h(
                'li',
                {},
                h('div', {}, h('b', {}, w.topic.id), ' ', pill(w.topic.rating)),
                h('div', { class: 'rr-topic' }, w.topic.topic),
                w.source ? h('a', { href: '#', onclick: (e) => { e.preventDefault(); onSource(w.source); } }, w.source) : null,
              ),
            ),
          ),
        )
      : h('p', { class: 'hint' }, 'Every topic in this shift had a clean session.'),
    planRow
      ? h(
          'section',
          { class: 'panel' },
          h('h2', { class: 'section-title' }, `Tonight · day ${planRow.day} of the plan`),
          h('p', {}, planRow.technical),
          planRow.interview && planRow.interview !== '—' ? h('p', { class: 'hint' }, planRow.interview) : null,
        )
      : null,
    h(
      'div',
      { class: 'actions stack' },
      moreAvailable ? h('button', { class: 'btn primary big', type: 'button', onclick: onKeepGoing }, 'Keep going · 5 more') : h('p', { class: 'hint center' }, 'Queue empty for today.'),
      !moreAvailable ? h('button', { class: 'btn', type: 'button', onclick: onBlitz }, 'Number Blitz') : null,
      !moreAvailable ? h('button', { class: 'btn', type: 'button', onclick: onStory }, 'Rehearse a story') : null,
      h('button', { class: 'btn', type: 'button', onclick: onHome }, 'Campus'),
    ),
  );
}

// ---------- final screens (Nov 2 and after) ----------

export function finalScreen({ checklist, rd, stats, after, map }) {
  const boxes = checklist.map((c, i) =>
    h('li', {}, h('label', { class: 'row-check', for: `dc${i}` }, h('input', { type: 'checkbox', id: `dc${i}` }), h('span', {}, c))),
  );
  return h(
    'main',
    { class: `final${after ? ' after' : ' go-day'}` },
    after ? h('h1', {}, 'The campus is commissioned.') : h('h1', { class: 'go' }, "Stop. You're ready. Go win it."),
    map ? h('figure', { class: 'campus' }, map) : null,
    h('p', { class: 'final-stats' }, `Readiness ${formatPercent(rd.overall)} overall · ${formatPercent(rd.onTested)} on tested · ${rd.tested} of ${rd.total} tested`),
    stats ? h('p', { class: 'hint' }, stats) : null,
    checklist.length && !after ? h('section', { class: 'panel' }, h('h2', { class: 'section-title' }, 'Day-of checklist'), h('ul', { class: 'checklist' }, boxes)) : null,
  );
}

// ---------- stories ----------

export function storyListScreen({ cards, topics, onPick, onBack }) {
  const stories = cards.filter((c) => c.type === 'story');
  const timing = (c) => {
    const t = { min: 90, max: 120, ...(c.answer.timing || {}) };
    return `${mmss(t.min)}–${mmss(t.max)}`;
  };
  return h(
    'main',
    { class: 'stories' },
    h('button', { class: 'btn back', type: 'button', onclick: onBack }, '← Campus'),
    h('h1', {}, 'Stories'),
    h('p', { class: 'hint' }, 'Rehearse one out loud. It counts toward the topic like any card: hook, decision with reason, a number, the lesson.'),
    stories.length
      ? h(
          'ul',
          { class: 'story-list' },
          stories.map((c) => {
            const t = topics.find((x) => x.id === c.topicId);
            return h(
              'li',
              {},
              h(
                'button',
                { class: 'story-row', type: 'button', onclick: () => onPick(c) },
                h('span', { class: 'sr-title' }, c.prompt.split(' — ')[0].split('. ')[0]),
                h('span', { class: 'sr-time num' }, timing(c)),
                h('span', { class: 'sr-meta' }, t ? pill(t.rating) : null, h('span', {}, c.interviewerPhrasing || '')),
              ),
            );
          }),
        )
      : h('p', {}, 'No story cards in the bank yet.'),
  );
}

// ---------- Number Blitz (§4.7) ----------

export function blitzScreen({ deck, best, onDone, onBack, onTick = () => {} }) {
  const root = h('main', { class: 'blitz' });
  const back = h('button', { class: 'btn back', type: 'button' }, '← Campus');
  if (!deck.length) {
    back.addEventListener('click', onBack);
    root.append(back, h('h1', {}, 'Number Blitz'), h('p', {}, 'Blitz draws number cards from Minor Refresh and Locked In topics only. Get a topic to Minor Refresh and its numbers join the deck.'));
    return root;
  }
  const order = [...deck].sort(() => Math.random() - 0.5);
  const SECONDS = 60;
  let score = 0;
  let seen = 0;
  let i = 0;
  let over = false;
  let started = null;
  let tick = null;
  const scoreEl = h('span', { class: 'b-score num' }, '0');
  const timer = h('div', { class: 'timer countdown' }, h('div', { class: 'timer-fill' }), h('span', { class: 'timer-label num' }, `${SECONDS} s`));
  const slot = h('div', { class: 'blitz-card' });
  const stop = () => tick && clearInterval(tick);
  onTick(stop);
  back.addEventListener('click', () => {
    stop();
    onBack();
  });

  function end() {
    over = true;
    stop();
    const newBest = score > best;
    mount(
      slot,
      h('p', { class: 'b-final num' }, `${score}`),
      h('p', { class: 'center' }, `knew it on ${score} of ${seen} · best ${Math.max(best, score)}${newBest ? ' · new best' : ''}`),
      h('button', { class: 'btn primary big', type: 'button', onclick: () => onDone(score) }, 'Done'),
    );
  }
  function startClock() {
    started = performance.now();
    tick = setInterval(() => {
      const sec = (performance.now() - started) / 1000;
      const left = Math.max(0, SECONDS - sec);
      timer.firstChild.style.width = `${Math.min(100, (sec / SECONDS) * 100)}%`;
      timer.lastChild.textContent = `${Math.ceil(left)} s`;
      if (left <= 0) end();
    }, 200);
  }
  function show() {
    if (over) return;
    const c = order[i++ % order.length];
    const reveal = h('button', { class: 'btn primary big', type: 'button' }, 'Reveal');
    reveal.addEventListener('click', () => {
      if (!started) startClock();
      reveal.replaceWith(
        h(
          'div',
          { class: 'b-answer' },
          h('ul', {}, c.answer.fields.map((f) => h('li', {}, h('span', {}, f.label), h('b', {}, String(f.value)))), c.answer.codeRef ? h('li', {}, h('span', {}, 'code'), h('b', {}, c.answer.codeRef)) : null),
          h(
            'div',
            { class: 'actions' },
            h('button', { class: 'btn', type: 'button', onclick: () => { seen++; show(); } }, 'Nope'),
            h('button', { class: 'btn primary', type: 'button', onclick: () => { score++; seen++; scoreEl.textContent = String(score); show(); } }, 'Knew it'),
          ),
        ),
      );
    });
    mount(slot, h('p', { class: 'tiny' }, c.topicId), h('p', { class: 'b-prompt' }, c.prompt), reveal);
  }
  root.append(
    back,
    h('div', { class: 'blitz-head' }, h('h1', {}, 'Number Blitz'), h('span', { class: 'b-best' }, 'knew it ', scoreEl, ` · best ${best}`)),
    h('p', { class: 'hint' }, `60 seconds of numbers from ${deck.length} cards on Minor Refresh and Locked In topics. The clock starts on the first reveal. Doesn't change ratings.`),
    timer,
    slot,
  );
  show();
  return root;
}

// ---------- settings ----------

function appPanel(pwa) {
  if (!pwa) return null;
  let line;
  if (pwa.standalone) line = h('p', { class: 'hint' }, 'Installed on this phone. It opens offline; a newer build shows a Reload note on the campus screen.');
  else if (!pwa.served) line = h('p', { class: 'hint' }, 'Opened as a file: everything works, and progress stays in this browser. For a home-screen icon that opens offline, open the hosted link instead (see README).');
  else line = h('p', { class: 'hint' }, 'iPhone: Share → Add to Home Screen. Android: menu → Install app (or the button below). Works offline once installed.');
  return h(
    'section',
    { class: 'panel', id: 'app-panel' },
    h('h2', { class: 'section-title' }, 'App'),
    line,
    pwa.canInstall ? h('button', { class: 'btn', type: 'button', id: 'install-app', onclick: pwa.onInstall }, 'Install on this phone') : null,
  );
}

export function settingsScreen({ settings, onSetting, onImport, onExport, onReset, onBack, buildInfo, storageOk, pwa = null }) {
  const paste = h('textarea', { class: 'paste', rows: 4, placeholder: 'Paste topics.json or state.json here' });
  const file = h('input', { type: 'file', accept: 'application/json,.json', class: 'file' });
  const msg = h('p', { class: 'msg', id: 'settings-msg', 'aria-live': 'polite' });
  const say = (t, bad) => {
    msg.textContent = t;
    msg.classList.toggle('bad', !!bad);
  };
  file.addEventListener('change', async () => {
    const f = file.files && file.files[0];
    if (!f) return;
    try {
      say(onImport(await f.text()));
    } catch (e) {
      say(e.message, true);
    }
  });
  const out = h('textarea', { class: 'paste', rows: 4, readonly: true, id: 'export-text', placeholder: 'Exported JSON appears here (and downloads)' });
  const sel = h(
    'select',
    { id: 'cards-per-shift' },
    [['', 'Day default (15, 10, or 20)'], ['5', '5'], ['10', '10'], ['15', '15'], ['20', '20'], ['25', '25']].map(([v, l]) => h('option', { value: v, selected: String(settings.cardsPerShift ?? '') === v }, l)),
  );
  sel.addEventListener('change', () => onSetting('cardsPerShift', sel.value ? Number(sel.value) : null));
  const toggle = (key, label, sub) => {
    const box = h('input', { type: 'checkbox', checked: !!settings[key], id: `set-${key}` });
    box.addEventListener('change', () => onSetting(key, box.checked));
    return h('label', { class: 'row-check toggle', for: `set-${key}` }, box, h('span', {}, label, sub ? h('small', { class: 'block' }, sub) : null));
  };
  return h(
    'main',
    { class: 'settings' },
    h('button', { class: 'btn back', type: 'button', onclick: onBack }, '← Campus'),
    h('h1', {}, 'Settings'),
    storageOk ? null : h('p', { class: 'msg bad' }, 'This browser is blocking local storage — progress will not survive a reload. Export before you close.'),
    h(
      'section',
      { class: 'panel' },
      h('h2', { class: 'section-title' }, 'Shift'),
      h('label', { class: 'row', for: 'cards-per-shift' }, h('span', {}, 'Cards per shift'), sel),
      toggle('sound', 'Sound', 'A soft chime on a clean answer'),
      toggle('haptics', 'Haptics', 'A tick on a clean answer, where the phone supports it'),
    ),
    h(
      'section',
      { class: 'panel' },
      h('h2', { class: 'section-title' }, 'Import'),
      h('p', { class: 'hint' }, 'topics.json carries tracker ratings over (history and XP kept). state.json replaces everything.'),
      file,
      paste,
      h('button', { class: 'btn', type: 'button', id: 'import-paste', onclick: () => { try { say(onImport(paste.value)); } catch (e) { say(e.message, true); } } }, 'Import pasted JSON'),
      msg,
    ),
    h(
      'section',
      { class: 'panel' },
      h('h2', { class: 'section-title' }, 'Export'),
      h('p', { class: 'hint' }, 'topics.json is the tracker shape — paste it back into the chat tracker. state.json is a full backup.'),
      h(
        'div',
        { class: 'actions' },
        h('button', { class: 'btn', type: 'button', id: 'export-topics', onclick: () => { out.value = onExport('topics'); } }, 'topics.json'),
        h('button', { class: 'btn', type: 'button', id: 'export-state', onclick: () => { out.value = onExport('state'); } }, 'state.json'),
      ),
      out,
    ),
    h(
      'section',
      { class: 'panel' },
      h('h2', { class: 'section-title' }, 'Reset'),
      h('p', { class: 'hint' }, 'Back to the shipped topics.json ratings. History and XP are cleared.'),
      h('button', { class: 'btn quiet', type: 'button', onclick: () => { if (confirm('Reset all progress back to the shipped topics.json?')) onReset(); } }, 'Reset progress'),
    ),
    appPanel(pwa),
    h('p', { class: 'build tiny' }, buildInfo),
  );
}

// ---------- browse ----------

function highlightSnippet(text, q) {
  const i = text.toLowerCase().indexOf(q);
  if (i < 0) return text.slice(0, 120);
  const from = Math.max(0, i - 50);
  const pre = (from > 0 ? '…' : '') + text.slice(from, i);
  const hit = text.slice(i, i + q.length);
  const post = text.slice(i + q.length, i + q.length + 70) + '…';
  return [pre, h('mark', { class: 'hit' }, hit), post];
}

export function browseScreen({ docs, onBack, target }) {
  const tabs = { guide: 'Study guide', scripts: 'Story scripts' };
  let current = target?.doc || 'guide';
  const content = h('div', { class: 'doc' });
  const results = h('ul', { class: 'search-results' });
  const search = h('input', { type: 'search', class: 'field', placeholder: 'Search the guide and scripts', id: 'browse-search', autocomplete: 'off', enterkeyhint: 'search' });
  const toc = h('details', { class: 'toc' }, h('summary', {}, 'Contents'));
  const tocList = h('ol', {});
  toc.append(tocList);
  const tabBtns = Object.entries(tabs).map(([k, label]) => h('button', { class: 'btn tab', type: 'button', onclick: () => show(k) }, label));

  function jump(id) {
    const el = content.querySelector(`#${CSS.escape(id)}`);
    if (!el) return;
    el.scrollIntoView({ block: 'start' });
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }

  function show(doc, anchor) {
    current = doc;
    tabBtns.forEach((b, i) => b.classList.toggle('on', Object.keys(tabs)[i] === doc));
    content.replaceChildren(docs[doc].template.content.cloneNode(true));
    mount(
      tocList,
      docs[doc].headings
        .filter((x) => x.level >= 2 && x.level <= 3)
        .map((x) => h('li', { class: `lv${x.level}` }, h('a', { href: '#', onclick: (e) => { e.preventDefault(); toc.open = false; jump(x.id); } }, x.text))),
    );
    if (anchor) setTimeout(() => jump(anchor), 0);
    else window.scrollTo(0, 0);
  }

  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    results.replaceChildren();
    if (q.length < 2) return;
    let n = 0;
    for (const [doc, d] of Object.entries(docs)) {
      for (const s of d.sections) {
        if (!s.text.toLowerCase().includes(q)) continue;
        n++;
        results.append(
          h(
            'li',
            {},
            h('a', { href: '#', onclick: (e) => { e.preventDefault(); show(doc, s.id); results.replaceChildren(); } }, `${tabs[doc]} › ${s.path}`),
            h('p', { class: 'snip' }, highlightSnippet(s.text.replace(/\s+/g, ' '), q)),
          ),
        );
      }
    }
    if (!n) results.append(h('li', { class: 'none' }, 'No match.'));
  });

  const root = h(
    'main',
    { class: 'browse' },
    h('div', { class: 'browse-bar' }, h('button', { class: 'btn back', type: 'button', onclick: onBack }, '← Back'), h('div', { class: 'tabs' }, tabBtns)),
    search,
    results,
    toc,
    content,
  );
  show(current, target?.id);
  return root;
}
