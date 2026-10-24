import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { build, bundle, transformModule, checkOffline, linkedFiles, parsePlan, COMPANION_FILES } from '../build.js';
import { readiness } from '../src/engine/rating.js';
import { ROOT, shippedTopics, readText, readJson } from './helpers.js';

test('build produces one self-contained page with the data inlined', () => {
  const { html, data, modules, files } = build({ root: ROOT, write: false });
  assert.ok(html.startsWith('<!doctype html>'));
  assert.deepEqual(checkOffline(html.replace(/<template[\s\S]*?<\/template>/g, '')), []);
  assert.ok(!/<script[^>]+src=/i.test(html));
  // The only <link>s point at files the build writes beside index.html (manifest, icons).
  const links = linkedFiles(html);
  assert.ok(links.length >= 3, links.join());
  for (const href of links) assert.ok(href in files, `${href} is not a companion file`);
  assert.ok(html.includes('<template id="doc-guide">') && html.includes('<template id="doc-scripts">'));
  assert.equal(data.topics.length, 65);
  assert.equal(data.sample.length, 10);
  // The real bank and the mock decks are inlined as written (Phase 2).
  assert.equal(data.questions.length, readJson('src/data/questions.json').length);
  assert.ok(data.questions.length >= 300, `${data.questions.length} questions`);
  assert.equal(data.mock.decks.length, 3);
  assert.equal(data.plan.length, 14);
  assert.equal(data.checklist.length, 5);
  assert.ok(modules.includes('src/engine/scheduler.js') && modules.includes('src/ui/app.js'));
  // Embedded JSON survives the script-tag escaping.
  const json = html.match(/<script type="application\/json" id="energize-data">([\s\S]*?)<\/script>/)[1];
  assert.deepEqual(JSON.parse(json).topics, shippedTopics());
});

test('the bundled engine behaves exactly like the source modules', () => {
  const { code } = bundle(ROOT, 'src/engine/state.js', { run: false });
  const mods = vm.runInNewContext(code, {});
  const topics = shippedTopics();
  // JSON compare: objects from the vm realm have their own prototypes.
  assert.equal(JSON.stringify(mods['src/engine/rating.js'].readiness(topics)), JSON.stringify(readiness(topics)));
  const s = mods['src/engine/state.js'].createState(topics);
  assert.equal(s.topics.length, 65);
  assert.equal(typeof mods['src/engine/dates.js'].addDays, 'function');
});

test('bundler transforms the supported import/export forms and rejects the rest', () => {
  const out = transformModule('src/x/a.js', "import { b, c as d } from './b.js';\nexport function f() {}\nexport const K = 1;\nexport class C {}\nconst z = 2;\nexport { z, K as K2 };\n");
  assert.match(out, /const \{ b, c: d \} = __m\["src\/x\/b.js"\];/);
  assert.match(out, /return \{ f, K, C, z, K2: K \};/);
  assert.throws(() => transformModule('a.js', "import x from './x.js';"), /unsupported import/);
  assert.throws(() => transformModule('a.js', 'export default 1;'), /unsupported export/);
});

test('the installable-app files: manifest, service worker and icons', () => {
  const { files, version, data } = build({ root: ROOT, write: false });
  assert.deepEqual(Object.keys(files).sort(), [...COMPANION_FILES].sort());
  assert.match(version, /^[0-9a-f]{10}$/);
  assert.equal(data.build.version, version);
  const manifest = JSON.parse(files['manifest.webmanifest']);
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  for (const icon of manifest.icons) assert.ok(icon.src in files, icon.src);
  assert.ok(files['sw.js'].includes(`'${version}'`) && !files['sw.js'].includes('__VERSION__'));
  for (const name of ['./index.html', './manifest.webmanifest', './icon-192.png']) assert.ok(files['sw.js'].includes(`'${name}'`), `sw.js precaches ${name}`);
  assert.ok(files['icon.svg'].startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  // PNGs: signature, then IHDR with the expected square size, 8-bit RGB.
  for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
    const png = files[name];
    assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], `${name} signature`);
    assert.equal(png.subarray(12, 16).toString('ascii'), 'IHDR');
    assert.equal(png.readUInt32BE(16), size, `${name} width`);
    assert.equal(png.readUInt32BE(20), size, `${name} height`);
    assert.equal(png[24], 8, `${name} bit depth`);
    assert.equal(png[25], 2, `${name} colour type`);
    assert.equal(png.subarray(png.length - 8, png.length - 4).toString('ascii'), 'IEND');
  }
});

test('offline check catches network references', () => {
  assert.deepEqual(checkOffline('<script src="https://cdn.x/y.js"></script>'), ['<script src>']);
  assert.deepEqual(checkOffline('<link rel="stylesheet" href="https://fonts.x">'), ["<link href> off the page's folder"]);
  assert.deepEqual(checkOffline('<link rel="stylesheet" href="//fonts.x/a.css">'), ["<link href> off the page's folder"]);
  assert.deepEqual(checkOffline('<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon.svg">'), []);
  assert.deepEqual(checkOffline('<style>a{background:url(https://x/y.png)}</style>'), ['CSS url() to the network']);
  assert.deepEqual(checkOffline('<script>fetch("/x")</script>'), ['fetch()']);
  assert.deepEqual(checkOffline('<a href="https://example.test">a link is fine</a>'), []);
});

test('the 14-day plan table parses to dated rows', () => {
  const plan = parsePlan(readText('content/study-guide.md'));
  assert.deepEqual(plan[0], { day: 1, date: '2026-10-20', technical: 'Cx language, IST matrix, AHJ inspections', interview: 'List six projects; draft Story 1', doneWhen: 'You can say what each level proves and turn an IST matrix into test steps' });
  assert.equal(plan[13].date, '2026-11-02');
  assert.equal(plan.find((p) => p.date === '2026-10-31').day, 12);
});
