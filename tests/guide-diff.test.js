import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sections, diffFiles, affected } from '../scripts/guide-diff.js';

const OLD = `# Guide

## Pre-action

Air test: 40 psi for 24 h.

| Test | Value |
| --- | --- |
| Air | 40 psi |
| Trip | 60 s |

**Data center points to make**

- Double-interlock.

## Fire pump

Churn, 100%, 150%.

\`\`\`latex
# not a heading
\`\`\`
`;

test('sections are keyed by heading path, the way a card source names them; code fences are not headings', () => {
  const s = sections(OLD);
  assert.deepEqual(s.map((x) => x.path), ['Guide', 'Pre-action', 'Fire pump']);
  assert.equal(s[1].tables.length, 1);
  assert.equal(s[1].tables[0].length, 4);
});

test('changed text, changed table rows, added and removed sections are reported; identical files report nothing', () => {
  assert.deepEqual(diffFiles(OLD, OLD).changes, []);
  const NEW = OLD.replace('| Trip | 60 s |', '| Trip | 70 s |').replace('## Fire pump', '## Fire pumps').concat('\n## Water mist\n\nNew.\n');
  const { changes } = diffFiles(OLD, NEW);
  assert.deepEqual(changes.map((c) => [c.path, c.change]), [['Pre-action', 'changed'], ['Fire pumps', 'added'], ['Water mist', 'added'], ['Fire pump', 'removed']]);
  assert.equal(changes[0].prose, false, 'only the table changed');
  assert.deepEqual(changes[0].tables, [{ label: 'Test · Value', change: 'changed (2 rows differ)' }]);
});

test('cards citing a changed section (or a label inside it) are listed under it', () => {
  const NEW = OLD.replace('40 psi for 24 h', '40 psi for 24 hours');
  const cards = [
    { id: 'P2-num-01', source: 'Pre-action › table' },
    { id: 'P5-ord-01', source: 'Pre-action › Data center points to make' },
    { id: 'F1-num-01', source: 'Fire pump' },
  ];
  const [c] = affected(diffFiles(OLD, NEW).changes, cards);
  assert.deepEqual(c.items, ['P2-num-01', 'P5-ord-01']);
});
