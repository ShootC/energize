#!/usr/bin/env node
// Headless smoke test of dist/index.html in real Chrome, over the DevTools
// protocol (no npm dependencies). Plays a full shift at 390×844 with the
// network disabled, then checks persistence, export/import and special days.
//
//   node tools/smoke.js [--chrome <path>] [--shots <dir>] [--keep]
//
// Exit code 0 = all checks passed.

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readiness, formatPercent } from '../src/engine/rating.js';
import { readFileSync } from 'node:fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, dflt) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : dflt;
};
const CHROME_CANDIDATES = [
  arg('--chrome'),
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const SHOTS = resolve(arg('--shots', join(tmpdir(), 'energize-smoke')));
const PAGE = pathToFileURL(join(ROOT, 'dist/index.html')).href;

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.handlers = [];
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve: ok, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(`${msg.error.message}`)) : ok(msg.result);
      } else if (msg.method) for (const h of this.handlers) h(msg);
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((ok, reject) => this.pending.set(id, { resolve: ok, reject }));
  }
  on(fn) {
    this.handlers.push(fn);
  }
  waitFor(method, timeout = 10000) {
    return new Promise((ok, reject) => {
      const t = setTimeout(() => reject(new Error(`timeout waiting for ${method}`)), timeout);
      this.on((m) => {
        if (m.method === method) {
          clearTimeout(t);
          ok(m.params);
        }
      });
    });
  }
}

async function launch() {
  const exe = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!exe) throw new Error('No Chrome/Edge found; pass --chrome <path>');
  const profile = mkdtempSync(join(tmpdir(), 'energize-chrome-'));
  const proc = spawn(exe, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((ok, reject) => {
    let buf = '';
    const t = setTimeout(() => reject(new Error('Chrome did not report a DevTools port')), 20000);
    proc.stderr.on('data', (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) {
        clearTimeout(t);
        ok(m[1]);
      }
    });
  });
  const port = new URL(wsUrl).port;
  const list = await (await globalThis.fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((ok) => ws.addEventListener('open', ok));
  return { proc, profile, cdp: new CDP(ws), ws, exe };
}

async function main() {
  mkdirSync(SHOTS, { recursive: true });
  const { proc, profile, cdp, ws, exe } = await launch();
  console.log(`Chrome: ${exe}\nPage: ${PAGE}\nScreenshots: ${SHOTS}\n`);
  const errors = [];
  const requests = [];
  cdp.on((m) => {
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) errors.push(`console.${m.params.type}: ${m.params.args.map((a) => a.value ?? a.description).join(' ')}`);
    if (m.method === 'Network.requestWillBeSent') requests.push(m.params.request.url);
    if (m.method === 'Page.javascriptDialogOpening') cdp.send('Page.handleJavaScriptDialog', { accept: true });
  });
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

  const evaluate = async (expression) => {
    const r = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(`page eval failed: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
    return r.result.value;
  };
  const open = async (query = '') => {
    const loaded = cdp.waitFor('Page.loadEventFired');
    await cdp.send('Page.navigate', { url: PAGE + query });
    await loaded;
    await evaluate('new Promise((r) => setTimeout(r, 150))');
  };
  const shot = async (name) => {
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(SHOTS, `${name}.png`), Buffer.from(data, 'base64'));
  };
  const text = (sel) => evaluate(`document.querySelector(${JSON.stringify(sel)})?.textContent ?? null`);
  const click = (sel) => evaluate(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.click(); return true; })()`);

  // ---- first run: fresh state, Sat Oct 24 ----
  await open('?date=2026-10-24');
  await evaluate('localStorage.clear()');
  await open('?date=2026-10-24');
  await shot('01-home');

  const topics = JSON.parse(readFileSync(join(ROOT, 'content/topics.json'), 'utf8'));
  const engine = readiness(topics);
  const hand = { overall: 1515 / 16600, onTested: 1515 / 3000, tested: 10 };
  const shown = { overall: await text('#r-overall'), onTested: await text('#r-tested'), count: await text('#r-count') };
  console.log('\nReadiness for the shipped topics.json');
  console.log(`  by hand : overall 1515/16600 = ${formatPercent(hand.overall, 2)} · on tested 1515/3000 = ${formatPercent(hand.onTested, 2)} · ${hand.tested} of 65 tested`);
  console.log(`  engine  : overall ${engine.earned}/${engine.possible} = ${formatPercent(engine.overall, 2)} · on tested ${engine.testedEarned}/${engine.testedPossible} = ${formatPercent(engine.onTested, 2)} · ${engine.tested} of ${engine.total} tested`);
  console.log(`  page    : overall ${shown.overall} · on tested ${shown.onTested} · ${shown.count} tested\n`);
  check('readiness: engine = hand computation', engine.earned === 1515 && engine.possible === 16600 && engine.testedPossible === 3000 && engine.tested === 10);
  check('readiness: page shows the same numbers', shown.overall === '9.1%' && shown.onTested === '50.5%' && shown.count === '10 of 65', JSON.stringify(shown));

  const startLabel = await text('#start-shift');
  check('home: Start shift shows card count and minutes', /Start shift · \d+ cards · ~\d+ min/.test(startLabel || ''), startLabel);

  // ---- play the shift: right answers, with deliberate misses on two cards ----
  await click('#start-shift');
  const planned = await evaluate('energize.state.currentShift.slots.map((s) => s.topicId + ":" + s.type)');
  console.log(`  shift: ${planned.join(' ')}`);
  check('shift: queue built from the due topics with sample cards', planned.join(' ') === 'C1:order C4:matrix S2:number S3:number P2:number P5:order P8:scenario S1:number I3:story', planned.join(' '));

  const playCard = `async (wrong) => {
    const s = energize.state.currentShift; const slot = s.slots.find((x) => !x.done);
    const card = energize.cardById.get(slot.cardId); const a = card.answer;
    const fire = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    const btn = (label) => [...document.querySelectorAll('button')].find((b) => b.textContent === label);
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    if (card.type === 'number') {
      a.fields.forEach((f, i) => fire(document.getElementById('f' + i), wrong && i === 0 ? '999' : String(f.value)));
      const code = document.getElementById('fcode'); if (code) fire(code, wrong ? 'NFPA 25' : a.codeRef);
      btn('Submit').click();
    } else if (card.type === 'order') {
      const order = wrong ? [...a.steps].reverse() : a.steps;
      for (const step of order) [...document.querySelectorAll('.pool button')].find((b) => b.textContent === step).click();
      btn('Submit order').click();
    } else if (card.type === 'matrix') {
      const cells = [...document.querySelectorAll('button.cell')];
      a.grid.cells.flat().forEach((v, i) => { let n = 0; while (cells[i].textContent !== v && n++ < 5) cells[i].click(); });
      btn('Submit matrix').click();
    } else if (card.type === 'scenario') {
      btn('Reveal').click(); await sleep(20);
      document.querySelectorAll('.beats input, #bnum, #bcode').forEach((x) => { x.checked = !wrong; });
      btn('Grade it').click();
    } else if (card.type === 'story') {
      document.querySelectorAll('.chip').forEach((c) => c.click());
      btn('Done speaking').click();
    } else if (card.type === 'defect') {
      document.querySelectorAll('.lines button')[wrong ? 0 : a.defectIndex].click();
      btn('This line').click();
    }
    await sleep(20);
    return { id: card.id, result: document.querySelector('.result h2')?.firstChild?.textContent };
  }`;
  const played = [];
  for (let i = 0; i < 30; i++) {
    const onCard = await evaluate('!!document.querySelector(".card")');
    if (!onCard) break;
    if (i === 0) await shot('02-card-order');
    const r = await evaluate(`(${playCard})(${i === 2 || i === 6})`);
    played.push(`${r.id}=${r.result}`);
    if (i === 2) await shot('03-result-missed');
    if (i === 8) await shot('04-result-story');
    const next = await evaluate(`(() => { const b = [...document.querySelectorAll('.result button')].pop(); b.click(); return b.textContent; })()`);
    await evaluate('new Promise((r) => setTimeout(r, 30))');
    if (next === 'Finish') break;
  }
  console.log(`  played: ${played.join(' ')}`);
  check('shift: every card rendered and graded', played.length === 9 && played.every((p) => /=(Clean|Slipped|Missed)$/.test(p)), `${played.length} cards`);
  check('grading: deliberate misses graded as missed', played[2].endsWith('Missed') && played[6].endsWith('Missed'));
  check('grading: right answers graded clean', played.filter((_, i) => i !== 2 && i !== 6 && i !== 8).every((p) => p.endsWith('Clean')));
  check('grading: a 0-second story is not clean (under 90 s)', played[8].endsWith('Slipped'), played[8]);

  await shot('05-debrief');
  const headline = await text('.debrief .headline');
  check('debrief: headline in the morning-quiz format', /^\d+ of \d+ framework right · \d+ close · \d+ clean$/.test(headline || ''), headline);
  const delta = await text('.debrief .delta');
  check('debrief: readiness before → after', /9\.1% → [\d.]+% overall/.test(delta || ''), delta);

  const after = await evaluate('({ s2: energize.state.topics.find((t) => t.id === "S2"), p8: energize.state.topics.find((t) => t.id === "P8"), c1: energize.state.topics.find((t) => t.id === "C1"), history: energize.state.history.length, xp: energize.state.xp, last: energize.state.lastShiftDate })');
  // S2: one of four numbers wrong and the code wrong = 3 of 5 right → framework right.
  check('ratings: missed S2 (a number + the code) → Needs Improvement, next review tomorrow', after.s2.rating === 'Needs Improvement' && after.s2.next_review === '2026-10-25' && after.s2.tests === 3, `${after.s2.rating} ${after.s2.next_review} tests ${after.s2.tests}`);
  check('ratings: missed scenario P8 (no beats) → Not Ready', after.p8.rating === 'Not Ready', after.p8.rating);
  check('ratings: clean C1 (only card in the sample bank) → Minor Refresh +2', after.c1.rating === 'Minor Refresh' && after.c1.streak === 1 && after.c1.next_review === '2026-10-26', `${after.c1.rating} streak ${after.c1.streak} ${after.c1.next_review}`);
  check('state: 9 results in history, shift completed, XP awarded', after.history === 9 && after.last === '2026-10-24' && after.xp > 50, `xp ${after.xp}`);

  // ---- persistence ----
  await open('?date=2026-10-24');
  const persisted = await evaluate('({ history: energize.state.history.length, label: document.querySelector("#start-shift")?.textContent || document.querySelector(".done")?.textContent })');
  check('persistence: reload keeps history and knows the shift is done', persisted.history === 9 && /Shift done/.test(persisted.label), persisted.label);
  const overallAfter = await text('#r-overall');
  check('persistence: readiness updated on the home screen', overallAfter !== '9.1%', overallAfter);

  // ---- export / import round trip through the Settings UI ----
  await click('#nav-settings');
  await click('#export-state');
  const exported = await evaluate('document.getElementById("export-text").value');
  await shot('06-settings');
  await evaluate(`(() => { [...document.querySelectorAll('button')].find((b) => b.textContent === 'Reset progress').click(); })()`);
  await evaluate('new Promise((r) => setTimeout(r, 50))');
  const resetHistory = await evaluate('energize.state.history.length');
  await click('#nav-settings');
  await evaluate(`(() => { const t = document.querySelector('textarea.paste'); t.value = ${JSON.stringify(exported)}; document.getElementById('import-paste').click(); })()`);
  const importMsg = await text('#settings-msg');
  const reExported = await evaluate('energize.__export = null, (() => { document.getElementById("export-state").click(); return document.getElementById("export-text").value; })()');
  check('reset: progress cleared', resetHistory === 0);
  check('export → import JSON round-trips exactly', reExported === exported, importMsg);
  await click('#export-topics');
  const topicsOut = JSON.parse(await evaluate('document.getElementById("export-text").value'));
  check('topics export has the topics.json shape', Array.isArray(topicsOut) && topicsOut.length === 65 && Object.keys(topicsOut[0]).join() === Object.keys(topics[0]).join());

  // ---- Browse + deep link ----
  await open('?date=2026-10-24');
  await click('#nav-browse');
  const headings = await evaluate('document.querySelectorAll(".doc h2").length');
  check('browse: study guide rendered', headings > 10, `${headings} sections`);
  await evaluate(`(() => { const s = document.getElementById('browse-search'); s.value = '29.2.2'; s.dispatchEvent(new Event('input')); })()`);
  const hits = await evaluate('document.querySelectorAll(".search-results li a").length');
  check('browse: search finds "29.2.2"', hits > 0, `${hits} hits`);
  await shot('07-browse');

  // ---- special days ----
  for (const [d, expect, name] of [
    ['2026-10-26', /Cutover week/, 'Oct 26 cutover'],
    ['2026-11-01', /the sweep/, 'Nov 1 sweep'],
    ['2026-11-02', /Interview day/, 'Nov 2 interview day'],
  ]) {
    await open(`?date=${d}`);
    const t = await evaluate('document.body.innerText');
    check(`special day: ${name}`, expect.test(t), (t.match(expect) || [''])[0]);
    await shot(`08-${d}`);
  }
  await open('?date=2026-11-02');
  const interviewSlots = await evaluate('(() => { document.getElementById("start-shift")?.click(); return energize.state.currentShift?.slots.map((s) => s.slot) || []; })()');
  // The sample deck has no I1 card, so no intro slot here.
  check('Nov 2: six confidence cards from Locked In / Minor Refresh topics', interviewSlots.length === 6 && interviewSlots.every((s) => s === 'confidence'), JSON.stringify(interviewSlots));
  await open('?date=2026-11-03');
  const finalText = await evaluate('document.body.innerText');
  check('after Nov 2: final campus screen', /The campus is commissioned/.test(finalText));

  check('no console errors or exceptions', errors.length === 0, errors.slice(0, 3).join(' | '));
  const remote = requests.filter((u) => !/^(file|data|blob|about|chrome):/.test(u));
  check('no network requests (network disabled the whole run)', remote.length === 0, remote.slice(0, 3).join(' '));

  ws.close();
  proc.kill();
  await new Promise((r) => setTimeout(r, 300));
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    /* Chrome may still hold the profile on Windows */
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exitCode = failed.length ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
