import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown, renderInline, renderTex, plainText, slugify } from '../tools/markdown.js';
import { BUILDINGS } from '../src/engine/campus.js';
import { readText } from './helpers.js';

test('inline: bold, italic, code, links, escapes, entities', () => {
  assert.equal(renderInline('**Governing:** NFPA 13'), '<strong>Governing:</strong> NFPA 13');
  assert.equal(renderInline('*How did you split the twelve?*'), '<em>How did you split the twelve?</em>');
  assert.equal(renderInline('\\[Fill in\\] \\_\\_\\_'), '[Fill in] ___');
  assert.equal(renderInline('&#91;Result'), '[Result');
  assert.equal(renderInline('a < b & c'), 'a &lt; b &amp; c');
  assert.equal(renderInline('[IFC 1207](https://x.test/a)'), '<a href="https://x.test/a" target="_blank" rel="noopener">IFC 1207</a>');
  assert.equal(plainText('Story 1 — Three occupied towers, one cutover'), 'Story 1 — Three occupied towers, one cutover');
  assert.equal(slugify('Aspirating smoke detection (ASD)'), 'aspirating-smoke-detection-asd');
});

test('blocks: headings with paths, tables, nested lists, task boxes', () => {
  const md = '# Doc\n\n## Pre-action\n\nIntro **bold**.\n\n### Sub\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n- one\n  - nested\n- two\n\n1. first\n2. second\n\n- [ ] open\n- [x] done\n';
  const { html, headings } = renderMarkdown(md, { idPrefix: 'g-' });
  assert.deepEqual(headings.map((h) => [h.level, h.text, h.id, h.path]), [
    [1, 'Doc', 'g-doc', 'Doc'],
    [2, 'Pre-action', 'g-pre-action', 'Pre-action'],
    [3, 'Sub', 'g-sub', 'Pre-action › Sub'],
  ]);
  assert.match(html, /<table><thead><tr><th>A<\/th><th>B<\/th><\/tr><\/thead><tbody><tr><td>1<\/td><td>2<\/td><\/tr><\/tbody><\/table>/);
  assert.match(html, /<ul><li>one<ul><li>nested<\/li><\/ul><\/li><li>two<\/li><\/ul>/);
  assert.match(html, /<ol><li>first<\/li><li>second<\/li><\/ol>/);
  assert.match(html, /<li class="task"><input type="checkbox" disabled> open<\/li><li class="task"><input type="checkbox" disabled checked> done<\/li>/);
});

test('TeX subset renders the guide formulas without leftover commands', () => {
  const html = renderTex('\\frac{Q_2}{Q_1} = \\frac{N_2}{N_1} \\qquad P_{net} = P_{discharge} - P_{suction}');
  assert.match(html, /tex-frac/);
  assert.match(html, /P<sub>net<\/sub>/);
  const guide = readText('content/study-guide.md');
  const blocks = [...guide.matchAll(/```latex\n([\s\S]*?)```/g)].map((m) => m[1]);
  assert.ok(blocks.length >= 20);
  for (const b of blocks) {
    const out = renderTex(b);
    assert.ok(!/\\[a-zA-Z]/.test(out), `leftover TeX command in: ${b}`);
    assert.ok(!/[{}]/.test(out.replace(/<[^>]+>/g, '')), `stray brace in: ${b}`);
  }
});

test('the study guide and story scripts render fully', () => {
  for (const [file, prefix] of [['content/study-guide.md', 'g-'], ['content/story-scripts.md', 's-']]) {
    const { html, headings } = renderMarkdown(readText(file), { idPrefix: prefix });
    assert.ok(headings.length >= 10, file);
    assert.equal(new Set(headings.map((h) => h.id)).size, headings.length, `${file}: duplicate heading ids`);
    const text = html.replace(/<[^>]+>/g, '');
    assert.ok(!/\*\*/.test(text), `${file}: leftover bold markers`);
    assert.ok(!/\\[\[\]_~]/.test(text), `${file}: leftover backslash escapes`);
    assert.ok(!/^\s*\|/m.test(text), `${file}: an unrendered table row`);
  }
});

test('every building quote is verbatim from the study guide', () => {
  const guide = plainText(readText('content/study-guide.md').replace(/\r\n?/g, '\n'));
  for (const b of BUILDINGS) assert.ok(guide.includes(b.quote.replace(/\.$/, '')), `${b.id}: ${b.quote}`);
});
