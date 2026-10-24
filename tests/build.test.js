import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { build, bundle, transformModule, checkOffline, parsePlan } from '../build.js';
import { readiness } from '../src/engine/rating.js';
import { ROOT, shippedTopics, readText } from './helpers.js';

test('build produces one self-contained page with the data inlined', () => {
  const { html, data, modules } = build({ root: ROOT, write: false });
  assert.ok(html.startsWith('<!doctype html>'));
  assert.deepEqual(checkOffline(html.replace(/<template[\s\S]*?<\/template>/g, '')), []);
  assert.ok(!/<script[^>]+src=/i.test(html));
  assert.ok(!/<link[^>]+href=/i.test(html));
  assert.ok(html.includes('<template id="doc-guide">') && html.includes('<template id="doc-scripts">'));
  assert.equal(data.topics.length, 65);
  assert.equal(data.sample.length, 10);
  assert.deepEqual(data.questions, []);
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

test('offline check catches network references', () => {
  assert.deepEqual(checkOffline('<script src="https://cdn.x/y.js"></script>'), ['<script src>']);
  assert.deepEqual(checkOffline('<link rel="stylesheet" href="https://fonts.x">'), ['<link href>']);
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
