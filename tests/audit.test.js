// The Phase 4 accuracy audit (scripts/audit.js) is a verification gate: every fact in
// src/data/questions.json and src/data/mock.json must be located in the source docs, or
// be listed with a reason in scripts/audit-allow.json. Items marked "decision" there are
// the open questions mirrored in PROGRESS.md; they do not fail the build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT, readJson } from './helpers.js';

test('scripts/audit.js reports no findings against the current bank and mock decks', () => {
  const dir = mkdtempSync(join(tmpdir(), 'energize-audit-'));
  try {
    const out = join(dir, 'audit-report.md');
    const r = spawnSync(process.execPath, [join(ROOT, 'scripts/audit.js'), '--out', out], { cwd: ROOT, encoding: 'utf8' });
    assert.equal(r.status, 0, `audit exit ${r.status}\n${r.stdout}\n${r.stderr}`);
    const report = readFileSync(out, 'utf8');
    assert.match(report, /\*\*0 findings\.\*\*/, report.split('\n').slice(0, 6).join('\n'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('every allowlist entry names a card that exists and says why', () => {
  const allow = readJson('scripts/audit-allow.json');
  const ids = new Set(readJson('src/data/questions.json').map((c) => c.id));
  for (const a of allow) {
    assert.ok(ids.has(a.card), `${a.card}: no such card`);
    assert.ok(typeof a.why === 'string' && a.why.length > 20, `${a.card}: needs a reason`);
  }
});
