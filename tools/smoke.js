#!/usr/bin/env node
// Headless smoke test of dist/index.html in real Chrome, over the DevTools
// protocol (no npm dependencies). Plays a full shift at 390×844 with the
// network disabled, then checks persistence, export/import and special days.
// The first pass pins the sample deck (?deck=sample) so its expectations are
// stable; the second pass plays the real bank (src/data/questions.json); the
// third visits every screen and card type, checking none scrolls sideways.
// The Phase 5 passes add 430×932 and landscape, topics.json import by paste and
// by file picker, a full reset, story recording with the microphone granted
// (Chrome's fake device) and refused, the installable app served over http
// (service worker, offline reload, a new build's Reload note), boot time under
// 4× CPU throttling, and card-top stability across a shift.
//
//   node tools/smoke.js [--chrome <path>] [--shots <dir>] [--keep]
//
// Exit code 0 = all checks passed.

import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, extname } from 'node:path';
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
  // Every call times out, so a page promise that never settles fails the run instead of hanging it.
  send(method, params = {}, timeout = 30000) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((ok, reject) => {
      const t = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out after ${timeout} ms`));
      }, timeout);
      this.pending.set(id, {
        resolve: (v) => {
          clearTimeout(t);
          ok(v);
        },
        reject: (e) => {
          clearTimeout(t);
          reject(e);
        },
      });
    });
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
  // The fake media flags give the story card a microphone to record from.
  const proc = spawn(exe, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
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

// Serve dist/ over http for the installable-app checks. `site.variant`, once set,
// serves a "new build": sw.js with that version and index.html with a marker.
function serveDist(dir) {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
  const site = { variant: null, hits: [] };
  const srv = createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p === '/') p = '/index.html';
    const file = join(dir, p.replace(/^\/+/, ''));
    site.hits.push(p);
    if (!existsSync(file)) {
      res.writeHead(404);
      res.end();
      return;
    }
    let body = readFileSync(file);
    if (site.variant && p === '/sw.js') body = Buffer.from(body.toString('utf8').replace(/const VERSION = '[^']+'/, `const VERSION = '${site.variant}'`));
    if (site.variant && p === '/index.html') body = Buffer.concat([body, Buffer.from(`\n<!-- ${site.variant} -->\n`)]);
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(body);
  });
  return new Promise((ok) =>
    srv.listen(0, '127.0.0.1', () => {
      site.srv = srv;
      site.url = `http://127.0.0.1:${srv.address().port}/`;
      ok(site);
    }),
  );
}

let browser = null;

async function main() {
  mkdirSync(SHOTS, { recursive: true });
  const { proc, profile, cdp, ws, exe } = await launch();
  browser = proc;
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
  const online = (on) => cdp.send('Network.emulateNetworkConditions', { offline: !on, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  const open = async (query = '') => {
    const loaded = cdp.waitFor('Page.loadEventFired');
    await cdp.send('Page.navigate', { url: /^https?:/.test(query) ? query : PAGE + query });
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
  await open('?date=2026-10-24&deck=sample');
  await evaluate('localStorage.clear()');
  await open('?date=2026-10-24&deck=sample');
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
      btn('Grade it').click(); await sleep(20);
      document.getElementById('grade-miss')?.click(); // a blank answer asks first
    } else if (card.type === 'story') {
      document.querySelectorAll('.chip').forEach((c) => c.click());
      btn('Done speaking').click(); await sleep(50);
      document.getElementById('grade-miss')?.click();
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
  await open('?date=2026-10-24&deck=sample');
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
  await open('?date=2026-10-24&deck=sample');
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
    await open(`?date=${d}&deck=sample`);
    const t = await evaluate('document.body.innerText');
    check(`special day: ${name}`, expect.test(t), (t.match(expect) || [''])[0]);
    await shot(`08-${d}`);
  }
  await open('?date=2026-11-02&deck=sample');
  const interviewSlots = await evaluate('(() => { document.getElementById("start-shift")?.click(); return energize.state.currentShift?.slots.map((s) => s.slot) || []; })()');
  // The sample deck has no I1 card, so no intro slot here.
  check('Nov 2: six confidence cards from Locked In / Minor Refresh topics', interviewSlots.length === 6 && interviewSlots.every((s) => s === 'confidence'), JSON.stringify(interviewSlots));
  await open('?date=2026-11-03');
  const finalText = await evaluate('document.body.innerText');
  check('after Nov 2: final campus screen', /The campus is commissioned/.test(finalText));

  // ---- the real bank: play the Oct 24 shift with right answers ----
  await open('?date=2026-10-24');
  await evaluate('localStorage.clear()');
  await open('?date=2026-10-24');
  const bankInfo = await evaluate('({ n: energize.bank.length, sample: energize.usingSample, label: document.querySelector("#start-shift")?.textContent })');
  check('bank: the app uses questions.json', bankInfo.sample === false && bankInfo.n >= 300, `${bankInfo.n} cards · ${bankInfo.label}`);
  check('bank: the Oct 24 shift is 15 cards', /· 15 cards ·/.test(bankInfo.label || ''), bankInfo.label);
  await click('#start-shift');
  const bankPlanned = await evaluate('energize.state.currentShift.slots.map((s) => s.topicId + ":" + s.type + ":" + s.slot)');
  console.log(`  bank shift: ${bankPlanned.join(' ')}`);
  const bankPlayed = [];
  for (let i = 0; i < 40; i++) {
    const onCard = await evaluate('!!document.querySelector(".card")');
    if (!onCard) break;
    const r = await evaluate(`(${playCard})(false)`);
    bankPlayed.push(r);
    if (i === 0) await shot('09-bank-card');
    const next = await evaluate(`(() => { const b = [...document.querySelectorAll('.result button')].pop(); b.click(); return b.textContent; })()`);
    await evaluate('new Promise((r) => setTimeout(r, 30))');
    if (next === 'Finish') break;
  }
  console.log(`  bank played: ${bankPlayed.map((p) => `${p.id}=${p.result}`).join(' ')}`);
  const notClean = bankPlayed.filter((p) => p.result !== 'Clean' && !(/-sty-/.test(p.id) && p.result === 'Slipped'));
  check('bank: every card in the shift rendered and graded', bankPlayed.length >= 15 && bankPlayed.every((p) => /^(Clean|Slipped|Missed)$/.test(p.result || '')), `${bankPlayed.length} cards`);
  check('bank: right answers grade clean (a 0-second story may slip)', notClean.length === 0, notClean.map((p) => `${p.id}=${p.result}`).join(' '));
  await shot('10-bank-debrief');
  const bankHeadline = await text('.debrief .headline');
  check('bank: debrief headline', /^\d+ of \d+ framework right · \d+ close · \d+ clean$/.test(bankHeadline || ''), bankHeadline);
  await open('?date=2026-11-02');
  const bankNov2 = await evaluate('(() => { document.getElementById("start-shift")?.click(); return energize.state.currentShift?.slots.map((s) => s.slot) || []; })()');
  check('bank: Nov 2 = six confidence cards, then the 60-second intro', bankNov2.length === 7 && bankNov2.slice(0, 6).every((s) => s === 'confidence') && bankNov2[6] === 'intro', JSON.stringify(bankNov2));

  // ---- Phase 3: every screen reachable at 390×844 (real bank, offline) ----
  const fits = () => evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1');
  const settle = (ms = 80) => evaluate(`new Promise((r) => setTimeout(r, ${ms}))`);
  const screenCheck = async (name, ok, detail = '') => {
    const noScroll = await fits();
    check(`screen: ${name}`, ok && noScroll, `${detail}${noScroll ? '' : ' · scrolls sideways'}`);
    await shot(`20-${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`);
  };

  await open('?date=2026-10-24');
  await evaluate('localStorage.clear()');
  await open('?date=2026-10-24');
  const homeInfo = await evaluate('({ blds: document.querySelectorAll(".map .bld").length, rows: document.querySelectorAll(".bld-row").length, lit: document.querySelectorAll(".map .win.on").length, gear: !!document.getElementById("nav-settings"), nav: document.querySelectorAll("nav.secondary .btn").length })');
  await screenCheck('home campus map', homeInfo.blds === 10 && homeInfo.rows === 10 && homeInfo.lit > 0 && homeInfo.gear && homeInfo.nav === 4, JSON.stringify(homeInfo));

  // Building view from a tap on the map, then Drill this.
  await evaluate('document.querySelector(".map .bld[data-building=\\"hq\\"]").dispatchEvent(new MouseEvent("click", { bubbles: true }))');
  await settle();
  const bInfo = await evaluate('({ title: document.querySelector(".building-view h1")?.textContent, topics: document.querySelectorAll(".building-view .topic").length, art: !!document.querySelector(".map.art") })');
  await screenCheck('building view', bInfo.title === 'Commissioning trailer' && bInfo.topics === 7 && bInfo.art, JSON.stringify(bInfo));
  await click('.building-view .btn.drill');
  await settle();
  check('building: Drill this starts a drill', (await evaluate('energize.state.currentShift?.kind')) === 'drill' && !!(await text('.card')));
  await click('#pause-shift');
  await settle();

  // Every card type renders with its control.
  for (const [type, id, control] of [
    ['number', 'S3-num-01', '#fcode'],
    ['order', 'P5-ord-01', '.pool .btn.step'],
    ['matrix', 'C4-mat-02', 'button.cell'],
    ['scenario', 'P6-scn-01', '.timer'],
    ['story', 'I3-sty-01', '.chip'],
    ['defect', 'P5-def-02', '.lines .line'],
  ]) {
    await open(`?date=2026-10-24&card=${id}`);
    const ok = await evaluate(`!!document.querySelector(".card.type-${type}") && !!document.querySelector(${JSON.stringify(control)})`);
    await screenCheck(`card ${type}`, ok, id);
  }

  // Spoken cards are graded by taps: with nothing tapped they ask first, and "Grade as a miss" grades a blank.
  await open('?date=2026-10-24&card=I3-sty-01');
  await evaluate(`[...document.querySelectorAll('button')].find((b) => b.textContent === 'Done speaking').click()`);
  await settle(300);
  const storyAsked = await evaluate('!!document.querySelector("#nudge") && !document.querySelector(".result") && [...document.querySelectorAll("button")].some((b) => b.textContent === "Grade it")');
  await shot('20-story-nothing-tapped');
  await click('#grade-miss');
  await settle(300);
  check('story: Done speaking with no beat tapped asks first; Grade as a miss grades it Missed', storyAsked && /^Missed/.test((await text('.result h2')) || ''), `${storyAsked} · ${await text('.result h2')}`);
  await open('?date=2026-10-24&card=I3-sty-01');
  await evaluate(`[...document.querySelectorAll('button')].find((b) => b.textContent === 'Done speaking').click()`);
  await settle(200);
  await evaluate('document.querySelectorAll(".chip:not(.fill-in)").forEach((c) => c.click())');
  await evaluate(`[...document.querySelectorAll('button')].find((b) => b.textContent === 'Grade it').click()`);
  await settle(300);
  check('story: tapping the beats after Done, then Grade it, grades the beats (clock stopped at Done)', !!(await text('.result h2')) && !/^Missed/.test((await text('.result h2')) || ''), await text('.result h2'));
  await open('?date=2026-10-24&card=P6-scn-01');
  await evaluate(`[...document.querySelectorAll('button')].find((b) => b.textContent === 'Reveal').click()`);
  await settle(100);
  await evaluate(`[...document.querySelectorAll('button')].find((b) => b.textContent === 'Grade it').click()`);
  await settle(200);
  const scnAsked = await evaluate('!!document.querySelector("#nudge") && !document.querySelector(".result")');
  await click('#grade-miss');
  await settle(300);
  check('scenario: Grade it with nothing ticked asks first; Grade as a miss grades it Missed', scnAsked && /^Missed/.test((await text('.result h2')) || ''), `${scnAsked} · ${await text('.result h2')}`);

  // A miss shows the hook and a re-read link that deep-links into Browse.
  await open('?date=2026-10-24&card=S3-num-01');
  await evaluate(`(() => { ['90','100','4','2'].forEach((v, i) => { const e = document.getElementById('f' + i); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }); const c = document.getElementById('fcode'); c.value = 'NFPA 72'; c.dispatchEvent(new Event('input', { bubbles: true })); [...document.querySelectorAll('button')].find((b) => b.textContent === 'Submit').click(); })()`);
  await settle();
  const rInfo = await evaluate('({ head: document.querySelector(".result h2")?.firstChild?.textContent, hook: !!document.querySelector(".result .hook"), level: document.querySelector(".result").className })');
  await screenCheck('result after a miss', rInfo.head === 'Missed' && rInfo.hook && /lvl-ni/.test(rInfo.level), JSON.stringify(rInfo));
  await click('.result .reread a');
  await settle(300);
  const dl = await evaluate('({ flashed: document.querySelector(".doc .flash")?.textContent, y: Math.round(scrollY) })');
  await screenCheck('browse deep link', dl.flashed === 'Sprinkler and underground' && dl.y > 1000, JSON.stringify(dl));
  await click('.browse-bar .btn.back');
  await settle();
  // A one-card drill is finished, so Back from Browse lands on its debrief.
  check('browse: Back returns to the shift (its debrief, the drill being done)', !!(await text('.debrief, .card')));

  // Stories, Blitz, settings from the home screen.
  await open('?date=2026-10-24');
  await click('#nav-stories');
  await settle();
  await screenCheck('stories', (await evaluate('document.querySelectorAll(".story-row").length')) === 10, '10 story cards');
  await open('?date=2026-10-24');
  await click('#nav-blitz');
  await settle();
  await click('.blitz-card .btn.primary');
  await settle();
  await screenCheck('number blitz', (await evaluate('!![...document.querySelectorAll(".blitz button")].find((b) => b.textContent === "Knew it")')), 'reveal → Knew it / Nope');
  await open('?date=2026-10-24');
  await click('#nav-settings');
  await settle();
  await screenCheck('settings', (await evaluate('!!document.getElementById("cards-per-shift") && !!document.getElementById("set-sound") && !!document.getElementById("set-haptics")')), 'cards per shift · sound · haptics');

  // Mock interview: a whole deck to the debrief.
  await open('?date=2026-10-25');
  await click('#nav-mock');
  await settle();
  await screenCheck('mock deck list', (await evaluate('document.querySelectorAll(".deck-row").length')) === 3 && (await evaluate('!!document.querySelector(".deck-row.today")')), 'Mock 1 flagged on Oct 25');
  await click('#deck-mock-1');
  await settle();
  await screenCheck('mock question', !!(await text('.mock-q')) && !!(await text('#mock-done')), 'prompt + timer');
  for (let k = 0; k < 5; k++) {
    await click('#mock-done');
    await click('#mock-reveal');
    await evaluate('(() => { document.querySelectorAll(".beats input").forEach((b) => (b.checked = true)); const n = document.getElementById("mbnum"); if (n) n.checked = true; })()');
    await click('#mock-grade');
  }
  await settle();
  const mh = await text('#mock-headline');
  await screenCheck('mock debrief', /^5 of 5 framework right · 0 close · 5 clean$/.test(mh || ''), mh);

  // Interview-day home offers nothing but the shift.
  await open('?date=2026-11-02');
  const nov2 = await evaluate('({ gear: !!document.getElementById("nav-settings"), nav: document.querySelectorAll("nav.secondary .btn").length, list: document.querySelectorAll(".bld-row").length, interactive: !!document.querySelector(".map.interactive") })');
  await screenCheck('Nov 2 home', !nov2.gear && nov2.nav === 0 && nov2.list === 0 && !nov2.interactive, JSON.stringify(nov2));

  // ---- Phase 5: other phone sizes and landscape ----
  for (const [w, hgt, label] of [[430, 932, '430×932'], [844, 390, 'landscape 844×390']]) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: hgt, deviceScaleFactor: 2, mobile: true });
    await open('?date=2026-10-24');
    await screenCheck(`home at ${label}`, (await evaluate('document.querySelectorAll(".map .bld").length')) === 10 && !!(await text('#start-shift')), label);
    await open('?date=2026-10-24&card=S3-num-01');
    const reach = await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent === 'Submit'); if (!b) return false; b.scrollIntoView({ block: 'end' }); const r = b.getBoundingClientRect(); return r.width > 0 && r.bottom <= innerHeight + 1; })()`);
    await screenCheck(`number card at ${label}`, reach, 'Submit reachable');
    await open('?date=2026-10-24&card=I3-sty-01');
    await screenCheck(`story card at ${label}`, !!(await text('.chip')) && (await evaluate('[...document.querySelectorAll("button")].some((b) => b.textContent === "Done speaking")')), 'chips + Done speaking');
  }
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

  // ---- Phase 5: import content/topics.json by paste and by file picker; full reset ----
  await open('?date=2026-10-24');
  await evaluate('localStorage.clear()');
  await open('?date=2026-10-24');
  await click('#nav-settings');
  const topicsText = readFileSync(join(ROOT, 'content/topics.json'), 'utf8');
  const fileShape = JSON.stringify(topics.map((t) => [t.id, t.rating, t.points, t.next_review]));
  await evaluate(`(() => { const t = document.querySelector('textarea.paste'); t.value = ${JSON.stringify(topicsText)}; document.getElementById('import-paste').click(); })()`);
  const pasteMsg = await text('#settings-msg');
  const pasted = await evaluate(`JSON.stringify(energize.state.topics.map((t) => [t.id, t.rating, t.points, t.next_review])) === ${JSON.stringify(fileShape)}`);
  check('import: content/topics.json pasted → 65 topics with the file\'s ratings', /Imported 65 topics/.test(pasteMsg || '') && pasted, pasteMsg);
  const doc = await cdp.send('DOM.getDocument', { depth: -1 });
  const fileInput = await cdp.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: 'input.file' });
  await evaluate('document.getElementById("settings-msg").textContent = ""');
  await cdp.send('DOM.setFileInputFiles', { nodeId: fileInput.nodeId, files: [join(ROOT, 'content/topics.json')] });
  await settle(300);
  const fileMsg = await text('#settings-msg');
  check('import: topics.json through the file picker', /Imported 65 topics/.test(fileMsg || ''), fileMsg);
  await evaluate(`[...document.querySelectorAll('button')].find((b) => b.textContent === 'Reset progress').click()`);
  await settle(100);
  const afterReset = await evaluate('(() => { const s = JSON.parse(localStorage.getItem("energize.state.v1")); return { history: s.history.length, xp: s.xp, c1: s.topics.find((t) => t.id === "C1").rating }; })()');
  check('reset: a fresh state in localStorage — no history, 0 XP, shipped ratings', afterReset.history === 0 && afterReset.xp === 0 && afterReset.c1 === 'Needs Improvement', JSON.stringify(afterReset));

  // ---- Phase 5: story recording — microphone granted (fake device), then refused ----
  await open('?date=2026-10-24&card=I6-sty-01');
  check('audio: Record is offered where MediaRecorder exists', !!(await evaluate('document.querySelector(".btn.rec")')));
  await click('.btn.rec');
  await settle(600);
  const recLabel = await text('.btn.rec');
  await evaluate('document.querySelectorAll(".chip").forEach((c) => c.click())');
  await evaluate(`[...document.querySelectorAll('button')].find((b) => b.textContent === 'Done speaking').click()`);
  await settle(600);
  const audio = await evaluate('(() => { const a = document.querySelector(".result audio"); return a ? { blob: a.src.startsWith("blob:"), controls: a.controls } : null; })()');
  await screenCheck('audio: Record → Done speaking → playback of the take', /Recording/.test(recLabel || '') && !!audio && audio.blob && audio.controls, `${recLabel} · ${JSON.stringify(audio)}`);
  const denyScript = await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: 'navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("denied", "NotAllowedError"));' });
  await open('?date=2026-10-24&card=I6-sty-01');
  await click('.btn.rec');
  await settle(300);
  const refused = await evaluate('document.body.innerText.includes("Microphone not available here")');
  await evaluate('document.querySelectorAll(".chip").forEach((c) => c.click())');
  await evaluate(`[...document.querySelectorAll('button')].find((b) => b.textContent === 'Done speaking').click()`);
  await settle(300);
  const gradedWithout = await evaluate('!!document.querySelector(".result h2") && !document.querySelector(".result audio")');
  check('audio: a refused microphone says so and the card still grades', refused && gradedWithout);
  await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: denyScript.identifier });

  // ---- Phase 5: performance — boot under 4× CPU throttling; card top stable across a shift ----
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await open('?date=2026-10-24');
  await evaluate('localStorage.clear()');
  await open('?date=2026-10-24');
  const perf = await evaluate('(() => { const nav = performance.getEntriesByType("navigation")[0]; const paint = performance.getEntriesByType("paint").find((p) => p.name === "first-contentful-paint"); return { fcp: paint ? Math.round(paint.startTime) : null, dcl: Math.round(nav.domContentLoadedEventEnd), boot: energize.bootMs }; })()');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  console.log(`  perf at 4× CPU throttle (file://): first contentful paint ${perf.fcp} ms · DOMContentLoaded ${perf.dcl} ms · home screen drawn at ${perf.boot} ms`);
  check('perf: home screen drawn under 1 s at 4× CPU throttle', perf.boot != null && perf.boot < 1000, `${perf.boot} ms`);
  await click('#start-shift');
  const tops = [];
  for (let i = 0; i < 8; i++) {
    if (!(await evaluate('!!document.querySelector(".card")'))) break;
    // offsetTop ignores the card's 260 ms entrance transform (translateY) and the scroll position:
    // this measures where the card sits in the layout, which is what must not move.
    tops.push(await evaluate('(() => { let el = document.querySelector(".card"); let y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; })()'));
    await evaluate(`(${playCard})(false)`);
    await evaluate(`(() => { const b = [...document.querySelectorAll('.result button')].pop(); b.click(); })()`);
    await settle(30);
  }
  check('layout: the card starts at the same height on every swap', tops.length >= 6 && Math.max(...tops) - Math.min(...tops) <= 2, `card tops ${tops.join(' ')}`);
  await click('#pause-shift');

  // ---- Phase 5: the installable app over http — service worker, offline reload, update ----
  const site = await serveDist(join(ROOT, 'dist'));
  await online(true);
  const manifest = await (await globalThis.fetch(`${site.url}manifest.webmanifest`)).json();
  const iconsOk = (await Promise.all(manifest.icons.map((i) => globalThis.fetch(site.url + i.src).then((r) => r.ok)))).every(Boolean);
  check('pwa: manifest served with its icons', manifest.display === 'standalone' && manifest.start_url === './' && iconsOk, `${manifest.icons.length} icons`);
  await open(`${site.url}index.html?date=2026-10-24`);
  await evaluate('localStorage.clear()');
  const sw = await evaluate(`(async () => { const reg = await navigator.serviceWorker.ready; for (let i = 0; i < 100 && !navigator.serviceWorker.controller; i++) await new Promise((r) => setTimeout(r, 100)); const keys = await caches.keys(); const hit = await caches.match('./index.html', { ignoreSearch: true }); return { active: !!reg.active, controller: !!navigator.serviceWorker.controller, keys, cached: !!hit, version: energize.data.build.version }; })()`);
  check('pwa: service worker registered, page controlled, shell cached under the build version', sw.active && sw.controller && sw.cached && sw.keys.includes(`energize-${sw.version}`), JSON.stringify(sw));
  await click('#nav-settings');
  await settle();
  const appPanel = await text('#app-panel');
  await screenCheck('pwa: Settings explains Add to Home Screen when served', /Add to Home Screen/.test(appPanel || ''), (appPanel || '').slice(0, 70));
  await online(false);
  await open(`${site.url}index.html?date=2026-10-26`);
  const offlineInfo = await evaluate('({ cards: energize.bank.length, cutover: document.body.innerText.includes("Cutover week"), controller: !!navigator.serviceWorker.controller })');
  check('pwa: opens offline from the cache, whatever the ?query', offlineInfo.cards >= 300 && offlineInfo.cutover && offlineInfo.controller, JSON.stringify(offlineInfo));
  const offlineAssets = await evaluate(`Promise.all(['./manifest.webmanifest', './icon-192.png', './apple-touch-icon.png'].map((u) => fetch(u).then((r) => r.ok).catch(() => false)))`);
  check('pwa: manifest and icons come from the cache offline', offlineAssets.every(Boolean), JSON.stringify(offlineAssets));
  await online(true);
  await settle(500);
  site.variant = 'smoke-v2';
  await open(`${site.url}index.html?date=2026-10-24`);
  const noteShown = await evaluate(`(async () => { for (let i = 0; i < 200; i++) { if (document.getElementById('update-note')) return true; await new Promise((r) => setTimeout(r, 100)); } return false; })()`);
  const swDiag = noteShown ? '' : await evaluate(`(async () => { const reg = await navigator.serviceWorker.getRegistration(); return JSON.stringify({ installing: reg?.installing?.state, waiting: reg?.waiting?.state, active: reg?.active?.state, controller: !!navigator.serviceWorker.controller, updateReady: energize.updateReady, route: energize.route, keys: await caches.keys() }); })()`);
  await screenCheck('pwa: a new build shows the Reload note on the campus screen', noteShown, noteShown ? 'update-note' : `no note within 20 s · ${swDiag} · server hits: ${site.hits.slice(-12).join(' ')}`);
  const reloaded = cdp.waitFor('Page.loadEventFired');
  await click('#reload-app');
  await reloaded;
  await settle(300);
  // The marker is a comment after </html>, which the parser hangs off the document itself.
  const v2 = await evaluate('(async () => ({ marker: [...document.childNodes].some((n) => n.nodeType === 8 && n.nodeValue.includes("smoke-v2")), keys: await caches.keys(), cards: energize.bank.length }))()');
  check('pwa: Reload runs the new build and only its cache remains', v2.marker && v2.cards >= 300 && v2.keys.length === 1 && v2.keys[0] === 'energize-smoke-v2', JSON.stringify(v2));
  await online(false);
  site.srv.close();

  check('no console errors or exceptions', errors.length === 0, errors.slice(0, 3).join(' | '));
  const remote = requests.filter((u) => !/^(file|data|blob|about|chrome):/.test(u) && !u.startsWith(site.url));
  check('no network requests beyond the local test server', remote.length === 0, remote.slice(0, 3).join(' '));

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
  if (browser) browser.kill();
  process.exitCode = 1;
});
