// Screens (stubs — ugly but working). Phase 3 replaces the look and adds the
// campus map; the data each screen needs is already computed by the engine.

import { h, s } from './dom.js';
import { campusMap } from './map.js';
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

export function homeScreen({ status, buildings, mode, primary, hint, secondary, celebrate = [], onBuilding }) {
  const interactive = mode !== 'interview' && mode !== 'after';
  const byId = new Map(status.map((x) => [x.id, x]));
  const just = celebrate.map((id) => buildings.find((b) => b.id === id)).filter(Boolean);
  return h(
    'main',
    { class: 'home' },
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

export function buildingScreen({ building, topics, cardCount, onDrill, onBack }) {
  const own = topics.filter((t) => t.area === building.area);
  return h(
    'main',
    { class: 'building-view' },
    h('button', { class: 'btn back', type: 'button', onclick: onBack }, '← Campus'),
    h('h2', {}, building.name),
    h('p', { class: 'quote' }, `“${building.quote}”`),
    h(
      'ul',
      { class: 'topic-list' },
      own.map((t) =>
        h(
          'li',
          { class: `rating-${t.rating.replace(/\s+/g, '-').toLowerCase()}` },
          h('div', { class: 't-head' }, h('b', {}, t.id), ` ${t.topic}`),
          h('div', { class: 't-meta' }, `${t.weight} · ${t.rating} (${POINTS[t.rating]}) · streak ${t.streak} · tests ${t.tests} · next ${t.next_review || '—'}`),
          t.last_result ? h('div', { class: 't-last' }, `Last: ${t.last_result}`) : null,
          h('button', { class: 'btn', type: 'button', disabled: !cardCount(t.id), onclick: () => onDrill(t.id) }, cardCount(t.id) ? `Drill this (${cardCount(t.id)} card${cardCount(t.id) > 1 ? 's' : ''})` : 'No cards yet'),
        ),
      ),
    ),
  );
}

export function debriefScreen({ headline, before, after, weakest, planRow, energized, kind, moreAvailable, onKeepGoing, onHome, onSource, onBlitz, onStory }) {
  return h(
    'main',
    { class: 'debrief' },
    h('h2', {}, kind === 'daily' ? 'Shift debrief' : 'Debrief'),
    h('p', { class: 'headline' }, headline.text),
    h(
      'p',
      { class: 'delta' },
      `Readiness ${formatPercent(before.overall)} → ${formatPercent(after.overall)} overall · ${formatPercent(before.onTested)} → ${formatPercent(after.onTested)} on tested · ${after.tested} of ${after.total} tested`,
    ),
    energized.length ? h('div', { class: 'energized' }, energized.map((b) => h('p', {}, h('b', {}, `${b.name} energized. `), `“${b.quote}”`))) : null,
    weakest.length
      ? h(
          'section',
          {},
          h('h3', {}, 'Re-read tonight'),
          h('ul', {}, weakest.map((w) => h('li', {}, h('b', {}, `${w.topic.id} · ${w.topic.rating}`), ` ${w.topic.topic} — `, w.source ? h('a', { href: '#', onclick: (e) => { e.preventDefault(); onSource(w.source); } }, w.source) : ''))),
        )
      : null,
    planRow ? h('section', {}, h('h3', {}, "Tonight's plan"), h('p', {}, `Day ${planRow.day} · ${planRow.technical}${planRow.interview && planRow.interview !== '—' ? ` · ${planRow.interview}` : ''}`)) : null,
    h(
      'div',
      { class: 'actions' },
      moreAvailable ? h('button', { class: 'btn primary big', type: 'button', onclick: onKeepGoing }, 'Keep going · 5 more') : h('p', {}, 'Queue empty for today.'),
      !moreAvailable ? h('button', { class: 'btn', type: 'button', onclick: onBlitz }, 'Number Blitz') : null,
      !moreAvailable ? h('button', { class: 'btn', type: 'button', onclick: onStory }, 'A story') : null,
      h('button', { class: 'btn', type: 'button', onclick: onHome }, 'Campus'),
    ),
  );
}

export function finalScreen({ checklist, rd, stats, after }) {
  return h(
    'main',
    { class: 'final' },
    after ? h('h2', {}, 'The campus is commissioned.') : h('h2', { class: 'go' }, "Stop. You're ready. Go win it."),
    h('p', {}, `Readiness ${formatPercent(rd.overall)} overall · ${formatPercent(rd.onTested)} on tested · ${rd.tested} of ${rd.total} tested`),
    stats ? h('p', {}, stats) : null,
    checklist.length ? h('section', {}, h('h3', {}, 'Day-of checklist'), h('ul', { class: 'checklist' }, checklist.map((c, i) => h('li', {}, h('label', {}, h('input', { type: 'checkbox', id: `dc${i}` }), ' ', c))))) : null,
  );
}

export function storyListScreen({ cards, topics, onPick, onBack }) {
  const stories = cards.filter((c) => c.type === 'story');
  return h(
    'main',
    {},
    h('button', { class: 'btn back', type: 'button', onclick: onBack }, '← Campus'),
    h('h2', {}, 'Stories'),
    stories.length
      ? h('ul', { class: 'topic-list' }, stories.map((c) => {
          const t = topics.find((x) => x.id === c.topicId);
          return h('li', {}, h('button', { class: 'btn', type: 'button', onclick: () => onPick(c) }, `${t ? t.topic : c.topicId} — ${t ? t.rating : ''}`));
        }))
      : h('p', {}, 'No story cards in the bank yet.'),
  );
}

export function mockStub({ mock, onBack }) {
  return h(
    'main',
    {},
    h('button', { class: 'btn back', type: 'button', onclick: onBack }, '← Campus'),
    h('h2', {}, 'Mock interview'),
    h('p', {}, mock && mock.decks ? `${mock.decks.length} deck(s) loaded from src/data/mock.json. The boss fight UI arrives in Phase 3.` : 'src/data/mock.json is written in Phase 2d; the boss fight UI arrives in Phase 3.'),
  );
}

export function blitzScreen({ deck, best, onDone, onBack }) {
  const root = h('main', { class: 'blitz' });
  if (!deck.length) {
    root.append(
      h('button', { class: 'btn back', type: 'button', onclick: onBack }, '← Campus'),
      h('h2', {}, 'Number Blitz'),
      h('p', {}, 'Blitz uses number cards from Minor Refresh and Locked In topics. None in the bank yet.'),
    );
    return root;
  }
  let score = 0;
  let seen = 0;
  let i = 0;
  const t0 = performance.now();
  const clock = h('p', { class: 'timer-label' });
  const slot = h('div', {});
  const tick = setInterval(() => {
    const left = 60 - (performance.now() - t0) / 1000;
    clock.textContent = `${Math.max(0, Math.ceil(left))} s · ${score} knew · best ${best}`;
    if (left <= 0) end();
  }, 200);
  function end() {
    clearInterval(tick);
    slot.replaceChildren(h('h3', {}, `${score} of ${seen}`), h('button', { class: 'btn primary', type: 'button', onclick: () => onDone(score) }, 'Done'));
  }
  function show() {
    const c = deck[i++ % deck.length];
    const answer = [...c.answer.fields.map((f) => `${f.label}: ${f.value}`), c.answer.codeRef ? `code: ${c.answer.codeRef}` : null].filter(Boolean).join(' · ');
    const reveal = h('button', { class: 'btn primary big', type: 'button' }, 'Reveal');
    reveal.addEventListener('click', () => {
      reveal.replaceWith(
        h('p', { class: 'blitz-answer' }, answer),
        h('div', { class: 'actions' },
          h('button', { class: 'btn primary', type: 'button', onclick: () => { score++; seen++; show(); } }, 'Knew it'),
          h('button', { class: 'btn', type: 'button', onclick: () => { seen++; show(); } }, 'Nope')),
      );
    });
    slot.replaceChildren(h('p', { class: 'prompt' }, c.prompt), reveal);
  }
  root.append(h('button', { class: 'btn back', type: 'button', onclick: () => { clearInterval(tick); onBack(); } }, '← Campus'), h('h2', {}, 'Number Blitz'), clock, slot);
  show();
  return root;
}

export function settingsScreen({ settings, onSetting, onImport, onExport, onReset, onBack, buildInfo, storageOk }) {
  const paste = h('textarea', { class: 'paste', rows: 4, placeholder: 'Paste topics.json or state.json here' });
  const file = h('input', { type: 'file', accept: 'application/json,.json' });
  const msg = h('p', { class: 'msg', id: 'settings-msg' });
  const say = (t, bad) => {
    msg.textContent = t;
    msg.classList.toggle('bad', !!bad);
  };
  file.addEventListener('change', async () => {
    const f = file.files && file.files[0];
    if (f) say(onImport(await f.text()));
  });
  const out = h('textarea', { class: 'paste', rows: 4, readonly: true, id: 'export-text' });
  const sel = h('select', { id: 'cards-per-shift' }, [['', 'Day default (15 · 10 cutover · 20 sweep)'], ['5', '5'], ['10', '10'], ['15', '15'], ['20', '20'], ['25', '25']].map(([v, l]) => h('option', { value: v, selected: String(settings.cardsPerShift ?? '') === v }, l)));
  sel.addEventListener('change', () => onSetting('cardsPerShift', sel.value ? Number(sel.value) : null));
  const toggle = (key, label) => {
    const box = h('input', { type: 'checkbox', checked: !!settings[key] });
    box.addEventListener('change', () => onSetting(key, box.checked));
    return h('label', { class: 'row-check' }, box, ` ${label}`);
  };
  return h(
    'main',
    { class: 'settings' },
    h('button', { class: 'btn back', type: 'button', onclick: onBack }, '← Campus'),
    h('h2', {}, 'Settings'),
    storageOk ? null : h('p', { class: 'msg bad' }, 'This browser is blocking local storage — progress will not survive a reload. Export before you close.'),
    h('section', {}, h('h3', {}, 'Shift'), h('label', { class: 'row' }, h('span', {}, 'Cards per shift'), sel), toggle('sound', 'Sound'), toggle('haptics', 'Haptics')),
    h(
      'section',
      {},
      h('h3', {}, 'Import'),
      h('p', { class: 'hint' }, 'topics.json carries tracker ratings over (history and XP kept). state.json replaces everything.'),
      file,
      paste,
      h('button', { class: 'btn', type: 'button', id: 'import-paste', onclick: () => { try { say(onImport(paste.value)); } catch (e) { say(e.message, true); } } }, 'Import pasted JSON'),
      msg,
    ),
    h(
      'section',
      {},
      h('h3', {}, 'Export'),
      h('div', { class: 'actions' },
        h('button', { class: 'btn', type: 'button', id: 'export-state', onclick: () => { out.value = onExport('state'); } }, 'state.json'),
        h('button', { class: 'btn', type: 'button', id: 'export-topics', onclick: () => { out.value = onExport('topics'); } }, 'topics.json (for the tracker)')),
      out,
    ),
    h('section', {}, h('h3', {}, 'Reset'), h('button', { class: 'btn danger', type: 'button', onclick: () => { if (confirm('Reset all progress back to the shipped topics.json?')) onReset(); } }, 'Reset progress')),
    h('p', { class: 'build' }, buildInfo),
  );
}

export function browseScreen({ docs, onBack, target }) {
  const tabs = { guide: 'Study guide', scripts: 'Story scripts' };
  let current = target?.doc || 'guide';
  const content = h('div', { class: 'doc' });
  const results = h('ul', { class: 'search-results' });
  const search = h('input', { type: 'search', class: 'field', placeholder: 'Search the guide and scripts', id: 'browse-search' });
  const tabBtns = Object.entries(tabs).map(([k, label]) => h('button', { class: 'btn tab', type: 'button', onclick: () => show(k) }, label));

  function show(doc, anchor) {
    current = doc;
    tabBtns.forEach((b, i) => b.classList.toggle('on', Object.keys(tabs)[i] === doc));
    content.replaceChildren(docs[doc].template.content.cloneNode(true));
    if (anchor) {
      const el = content.querySelector(`#${CSS.escape(anchor)}`);
      if (el) setTimeout(() => el.scrollIntoView({ block: 'start' }), 0);
    } else window.scrollTo(0, 0);
  }

  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    results.replaceChildren();
    if (q.length < 2) return;
    for (const [doc, d] of Object.entries(docs)) {
      for (const s of d.sections) {
        const i = s.text.toLowerCase().indexOf(q);
        if (i < 0) continue;
        const snip = s.text.slice(Math.max(0, i - 50), i + 70).replace(/\s+/g, ' ');
        results.append(h('li', {}, h('a', { href: '#', onclick: (e) => { e.preventDefault(); show(doc, s.id); results.replaceChildren(); } }, `${tabs[doc]} › ${s.path}`), h('small', {}, ` …${snip}…`)));
      }
    }
    if (!results.children.length) results.append(h('li', {}, 'No match.'));
  });

  const root = h('main', { class: 'browse' }, h('button', { class: 'btn back', type: 'button', onclick: onBack }, '← Back'), h('div', { class: 'tabs' }, tabBtns), search, results, content);
  show(current, target?.id);
  return root;
}

