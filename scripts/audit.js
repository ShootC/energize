#!/usr/bin/env node
// scripts/audit.js — Phase 4 accuracy audit for ENERGIZE.
//
//   node scripts/audit.js                   → audit-report.md in the repo root; exit 1 if it has findings
//   node scripts/audit.js --review          → also append the fuzzy "review" lists (paraphrased beats, etc.)
//   node scripts/audit.js --card P2-num-01  → print every fact the audit extracted from one card and where it found it
//   node scripts/audit.js --out <file>
//
// For every card in src/data/questions.json (and every question in src/data/mock.json)
// the audit extracts the facts the card teaches — numbers with their units, section
// references, identifiers (L4, 9540A, EST3), word answers, order steps, beats and defect
// lines — and looks for each one, verbatim or trivially reformatted (1,560 = 1560, 24-hour
// = 24 h, "sixteen" = 16, "annually" = every 1 yr / 12 mo, a table cell's unit taken from
// its column header), first in the section the card's `source` names (in
// content/study-guide.md or content/story-scripts.md), then in the whole file.
//
// The report lists: facts that could not be located; graded facts (number fields, codeRef,
// order steps) found only outside the card's section; references the guide hedges
// ("confirm in your edition") on cards that do not carry confirmInEdition; order cards
// whose step order differs from the guide; story cards whose script or beat quotes differ
// from the source; matrix cells that differ from the guide's table; prompts that read as
// multiple choice or give the answer away; topics under the per-weight card minimum; source
// labels that do not resolve; and the same checks on mock.json. Softer signals (paraphrased
// beats, prompt numbers found in another section, matrices built from prose) go to the
// review appendix (--review) for the reading pass.
//
// scripts/audit-allow.json lists the items that are deliberately not guide facts (the
// hypothetical numbers in interviewer prompts, planted defect values repeated in an
// explanation), each with a reason. They are counted in the report, never hidden.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { plainText } from '../tools/markdown.js';
import { validateBank, SOURCE_SEP } from '../src/engine/schema.js';
import { normalizeText } from '../src/engine/grader.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name, dflt) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : dflt;
};

// ---------------------------------------------------------------------------
// Source documents → sections
// ---------------------------------------------------------------------------

function cleanLine(l) {
  return l
    .replace(/&#91;/g, '[')
    .replace(/&#93;/g, ']')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\[([^\]]+)\]\(https?:[^)\s]+\)/g, '$1') // links → their text
    .replace(/\\([\\`*_{}\[\]()#+\-.!~|&<>])/g, '$1')
    .replace(/\*/g, '')
    .replace(/(\d)½/g, '$1.5')
    .replace(/½/g, '0.5');
}

const SMALL = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const MULT = { hundred: 100, thousand: 1000, million: 1e6, billion: 1e9 };
const NUMWORDS = [...Object.keys(SMALL), ...Object.keys(MULT), 'half'].join('|');
const NUMWORD_RE = new RegExp(`\\b((?:(?:${NUMWORDS})(?:[\\s-]+(?=(?:${NUMWORDS})\\b)|\\b))+)`, 'gi');

function parseNumberWords(words) {
  let total = 0;
  let cur = 0;
  for (const w of words) {
    const lw = w.toLowerCase();
    if (lw in SMALL) cur += SMALL[lw];
    else if (lw === 'hundred') cur = (cur || 1) * 100;
    else if (lw in MULT) {
      cur = (cur || 1) * MULT[lw];
      total += cur;
      cur = 0;
    } else if (lw === 'half') cur += 0.5;
  }
  return total + cur;
}

// "sixteen nodes and about fifteen hundred devices" → "16 nodes and about 1500 devices"
export function wordsToDigits(text) {
  return String(text).replace(NUMWORD_RE, (m) => {
    const words = m.trim().split(/[\s-]+/).filter(Boolean);
    if (words.length === 1 && words[0].toLowerCase() === 'half') return m;
    const v = parseNumberWords(words);
    const trailing = m.match(/\s+$/)?.[0] || '';
    return `${v}${trailing}`;
  });
}

function loadDoc(file) {
  const raw = readFileSync(join(ROOT, file), 'utf8').replace(/\r\n?/g, '\n');
  const rawLines = raw.split('\n');
  const lines = rawLines.map(cleanLine);
  const heads = [];
  rawLines.forEach((l, i) => {
    const m = l.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (m) heads.push({ level: m[1].length, text: plainText(m[2]), line: i });
  });
  const sections = heads.map((h, k) => {
    let end = rawLines.length;
    for (let j = k + 1; j < heads.length; j++) {
      if (heads[j].level <= h.level) {
        end = heads[j].line;
        break;
      }
    }
    return { ...h, file, start: h.line, end };
  });
  return { file, rawLines, lines, sections };
}

const DOCS = [loadDoc('content/study-guide.md'), loadDoc('content/story-scripts.md')];
const SECTION_BY_HEADING = new Map();
for (const d of DOCS) for (const s of d.sections) if (!SECTION_BY_HEADING.has(s.text)) SECTION_BY_HEADING.set(s.text, s);
// The round 1 debrief (GAME_SPEC_ROUND2 §6, §8): only its "Facts about my own work" list may
// feed own-it / drill beats. It is not a source for anything else, so it stays out of DOCS.
const DEBRIEF_FILE = 'content/round1-debrief.md';
const DEBRIEF = existsSync(join(ROOT, DEBRIEF_FILE)) ? loadDoc(DEBRIEF_FILE) : null;
const EXTRA_DOCS = DEBRIEF ? [DEBRIEF] : [];
const docOf = (file) => DOCS.find((d) => d.file === file) || EXTRA_DOCS.find((d) => d.file === file);

const isTableRow = (raw) => /^\s*\|/.test(raw);
const isSeparatorRow = (raw) => /^\s*\|?\s*:?-{3,}/.test(raw) && /^[\s|:\-]+$/.test(raw);
const splitCells = (text) => text.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());

// Frequency words → the numbers a card may render them as.
const FREQ = [
  [/\b(?:annual(?:ly)?|yearly|every year|each year|per year)\b/i, [['1', 'yr'], ['12', 'mo']]],
  [/\bsemi-?annual(?:ly)?\b|\btwice a year\b/i, [['6', 'mo'], ['2', 'yr']]],
  [/\bmonthly\b|\bevery month\b|\beach month\b/i, [['1', 'mo']]],
  [/\bquarterly\b/i, [['3', 'mo']]],
  [/\bweekly\b|\bevery week\b|\beach week\b/i, [['1', 'wk']]],
  [/\bdaily\b|\bevery day\b/i, [['1', 'day']]],
  [/\bhalf\b/i, [['0.5', null], ['50', '%']]],
];

// A scope is an ordered set of (file, line index) pairs with cached extraction.
const scopeCache = new Map();
function makeScope(file, idxs, label) {
  const key = `${file}:${idxs.join(',')}:${label}`;
  if (scopeCache.has(key)) return scopeCache.get(key);
  const doc = docOf(file);
  const lines = idxs.map((i) => ({ i, raw: doc.rawLines[i], plain: doc.lines[i], text: wordsToDigits(doc.lines[i]) }));
  const scope = { file, label, lines };
  scope.text = lines.map((l) => l.text).join('\n');
  scope.plainText = lines.map((l) => l.plain).join('\n');
  scope.norm = normalizeText(scope.text.replace(/\n/g, ' '));
  scope.normPlain = normalizeText(scope.plainText.replace(/\n/g, ' '));
  scope.values = new Set();
  scope.pairs = new Set();
  scope.refs = new Set();
  scope.idents = new Set();
  let header = null; // column units of the table we are inside
  scope.byLine = lines.map((l, k) => {
    let toks;
    if (isTableRow(l.raw)) {
      const next = lines[k + 1];
      if (next && isSeparatorRow(next.raw)) {
        header = splitCells(l.text).map((h) => unitInText(h));
        toks = extractTokens(l.text);
      } else if (isSeparatorRow(l.raw)) {
        toks = [];
      } else {
        toks = [];
        splitCells(l.text).forEach((cell, j) => {
          for (const t of extractTokens(cell)) {
            if (t.kind === 'num' && !t.unit && header && header[j]) {
              t.unit = header[j].unit;
              t.unitKind = header[j].kind;
              t.fromHeader = true;
            }
            toks.push(t);
          }
        });
      }
    } else {
      header = null;
      toks = extractTokens(l.text);
    }
    for (const [re, adds] of FREQ) if (re.test(l.text)) for (const [v, u] of adds) toks.push({ kind: 'num', text: l.text.match(re)[0], value: v, unit: u, unitKind: u ? 'measure' : null, synthetic: true });
    for (const t of toks) {
      if (t.kind === 'num') {
        scope.values.add(t.value);
        if (t.unit) scope.pairs.add(`${t.value}|${t.unit}`);
      } else if (t.kind === 'ref') {
        scope.refs.add(t.text.toLowerCase());
        for (const d of t.text.match(/\d+(?:\.\d+)?/g) || []) scope.values.add(canon(d));
      } else if (t.kind === 'ident') {
        scope.idents.add(t.text.toLowerCase());
        for (const d of t.text.match(/\d+(?:\.\d+)?/g) || []) scope.values.add(canon(d));
      }
    }
    return toks;
  });
  scopeCache.set(key, scope);
  return scope;
}

function sectionScope(section) {
  const idxs = [];
  for (let i = section.start; i < section.end; i++) idxs.push(i);
  return makeScope(section.file, idxs, section.text);
}

function fileScope(file) {
  const doc = docOf(file);
  return makeScope(file, doc.lines.map((_, i) => i), file);
}

let bothScope = null;
// Everything in both files (hooks are mnemonic and may pull a number from anywhere).
function allScope() {
  if (bothScope) return bothScope;
  const parts = DOCS.map((d) => fileScope(d.file));
  bothScope = {
    file: '*',
    label: 'both files',
    lines: parts.flatMap((p) => p.lines),
    text: parts.map((p) => p.text).join('\n'),
    plainText: parts.map((p) => p.plainText).join('\n'),
    norm: parts.map((p) => p.norm).join(' '),
    normPlain: parts.map((p) => p.normPlain).join(' '),
    values: new Set(parts.flatMap((p) => [...p.values])),
    pairs: new Set(parts.flatMap((p) => [...p.pairs])),
    refs: new Set(parts.flatMap((p) => [...p.refs])),
    idents: new Set(parts.flatMap((p) => [...p.idents])),
    byLine: parts.flatMap((p) => p.byLine),
  };
  return bothScope;
}
const isFileScope = (s) => s.label === s.file || s.label === 'both files';

// Resolve "Heading › sub-heading or bold label or table or list number or table row" to
// { section, sub (scope or null), missing: [labels that did not resolve] }.
function resolveSource(source) {
  const segs = String(source || '')
    .split(SOURCE_SEP)
    .map((s) => s.trim())
    .filter(Boolean);
  const section = SECTION_BY_HEADING.get(segs[0]);
  if (!section) return { section: null, sub: null, missing: segs };
  let cur = section;
  let sub = null;
  const missing = [];
  for (const seg of segs.slice(1)) {
    const asHeading = SECTION_BY_HEADING.get(seg);
    if (asHeading && asHeading.file === cur.file && asHeading.start >= cur.start && asHeading.end <= cur.end) {
      cur = asHeading;
      sub = null;
      continue;
    }
    const found = findLabel(cur, seg, sub);
    if (found) sub = found;
    else missing.push(seg);
  }
  return { section: cur, sub, missing };
}

function findLabel(section, label, within = null) {
  const doc = docOf(section.file);
  const lab = label.replace(/[.:]+$/, '').trim().toLowerCase();
  const idxs = within ? within.lines.map((l) => l.i) : [];
  if (!within) for (let i = section.start + 1; i < section.end; i++) idxs.push(i);
  if (lab === 'table') {
    const t = idxs.filter((i) => isTableRow(doc.rawLines[i]));
    return t.length ? makeScope(section.file, t, `${section.text} › table`) : null;
  }
  const num = lab.match(/^(\d+)(?:[.)]|$)/);
  if (num) {
    const start = idxs.find((i) => new RegExp(`^\\s*${num[1]}[.)]\\s`).test(doc.rawLines[i]));
    if (start == null) return null;
    const out = [start];
    for (let j = start + 1; j < section.end && /^\s{2,}\S/.test(doc.rawLines[j]); j++) out.push(j);
    return makeScope(section.file, out, `${section.text} › ${label}`);
  }
  // A table row whose first cell is the label ("Facts to know cold › Dropped").
  const row = idxs.find((i) => isTableRow(doc.rawLines[i]) && !isSeparatorRow(doc.rawLines[i]) && normalizeText(splitCells(doc.lines[i])[0]) === normalizeText(lab));
  if (row != null) return makeScope(section.file, [row], `${section.text} › ${label}`);
  const start = idxs.find((i) => {
    const t = doc.lines[i].trim().toLowerCase();
    return t.startsWith(lab) || t.replace(/^(\d+[.)]|[-*])\s+/, '').startsWith(lab);
  });
  if (start == null) return null;
  const out = [start];
  for (let j = start + 1; j < section.end; j++) {
    const r = doc.rawLines[j];
    if (/^\*\*/.test(r) || /^#/.test(r)) break; // next bold label or heading
    if (within && !idxs.includes(j)) break;
    out.push(j);
  }
  return makeScope(section.file, out, `${section.text} › ${label}`);
}

// ---------------------------------------------------------------------------
// Token extraction: numbers (+units), section refs, identifiers
// ---------------------------------------------------------------------------

// [pattern, canonical, kind]. Order matters: longer / more specific first.
const UNIT_DEFS = [
  ['%\\s*/\\s*ft', '%/ft', 'measure'],
  ['%|percent|per cent', '%', 'measure'],
  ['psi\\s*/\\s*ft', 'psi/ft', 'measure'],
  ['psig?', 'psi', 'measure'],
  ['gpm\\s*/\\s*(?:ft²|ft2|sq\\.? ?ft)', 'gpm/ft2', 'measure'],
  ['gpm', 'gpm', 'measure'],
  ['gph', 'gph', 'measure'],
  ['cfm\\s*/\\s*(?:ft²|ft2|sq\\.? ?ft)', 'cfm/ft2', 'measure'],
  ['cfm', 'cfm', 'measure'],
  ['ft\\s*/\\s*s(?:ec)?', 'ft/s', 'measure'],
  ['ft\\s*/\\s*min', 'ft/min', 'measure'],
  ['ft²|ft2|sq\\.? ?ft|square[ -]f(?:ee|oo)t', 'ft2', 'measure'],
  ['ft|feet|foot', 'ft', 'measure'],
  ['in\\.? ?w\\.? ?c\\.?|inch(?:es)? (?:of )?water(?: column)?|in\\. of water', 'inwc', 'measure'],
  ['in\\.|inch(?:es)?', 'in', 'measure'],
  ['lbf|pounds?(?:-force)?', 'lbf', 'measure'],
  ['kW\\s*/\\s*s²', 'kW/s2', 'measure'],
  ['kWh', 'kWh', 'measure'],
  ['kW', 'kW', 'measure'],
  ['MW', 'MW', 'measure'],
  ['GW', 'GW', 'measure'],
  ['gal(?:lons?)?', 'gal', 'measure'],
  ['µm|um|microns?', 'um', 'measure'],
  ['cd', 'cd', 'measure'],
  ['dBA?', 'dB', 'measure'],
  ['V|volts?', 'V', 'measure'],
  ['Hz', 'Hz', 'measure'],
  ['AWG', 'awg', 'measure'],
  ['°\\s*F', 'F', 'measure'],
  ['h|hrs?|hours?', 'h', 'measure'],
  ['s|secs?|seconds?', 's', 'measure'],
  ['min|mins?|minutes?', 'min', 'measure'],
  ['ms', 'ms', 'measure'],
  ['yrs?|years?', 'yr', 'measure'],
  ['months?', 'mo', 'measure'],
  ['weeks?|wks?', 'wk', 'measure'],
  ['days?', 'day', 'measure'],
  ['[Aa]ir [Cc]hanges(?: per (?:hour|minute)| an hour| / hour|/h|/hr)?|ACH', 'ach', 'measure'],
  ['pipe diameters?', 'pd', 'measure'],
  ['turns?', 'turn', 'count'],
  ['sprinklers?', 'sprinkler', 'count'],
  ['spares?', 'spare', 'count'],
  ['detectors?', 'detector', 'count'],
  ['nodes?', 'node', 'count'],
  ['devices?', 'device', 'count'],
  ['people|persons?|techs?', 'people', 'count'],
  ['parts?', 'part', 'count'],
  ['towers?', 'tower', 'count'],
  ['floors?', 'floor', 'count'],
  ['COLOs?', 'colo', 'count'],
  ['VESDAs?', 'vesda', 'count'],
  ['playbooks?', 'playbook', 'count'],
  ['modules?', 'module', 'count'],
  ['items?', 'item', 'count'],
  ['questions?', 'question', 'count'],
  ['steps?', 'step', 'count'],
  ['levels?', 'level', 'count'],
  ['starts?', 'start', 'count'],
  ['belts?', 'belt', 'count'],
  ['designs?', 'design', 'count'],
  ['variations?', 'variation', 'count'],
  ['networks?', 'network', 'count'],
  ['stories|story', 'story', 'count'],
  ['beats?', 'beat', 'count'],
  ['hydrants?', 'hydrant', 'count'],
  ['batter(?:y|ies)', 'battery', 'count'],
  ['heads?', 'head', 'count'],
  ['holes?', 'hole', 'count'],
  ['pipes?', 'pipe', 'count'],
  ['zones?', 'zone', 'count'],
  ['cylinders?', 'cylinder', 'count'],
  ['nozzles?', 'nozzle', 'count'],
  ['generators?', 'generator', 'count'],
  ['panels?', 'panel', 'count'],
  ['sites?', 'site', 'count'],
  ['halls?', 'hall', 'count'],
  ['words?', 'word', 'count'],
];
const UNITS = UNIT_DEFS.map(([p, c, k]) => [new RegExp(`^\\s*-?\\s*(?:${p})(?![A-Za-z])`), c, k, p]);
// Units that are unambiguous anywhere in a label; the rest (min, s, h, V, in, ft, cd, yr…) must end the label.
const UNAMBIGUOUS = new Set(['%/ft', '%', 'psi/ft', 'psi', 'gpm/ft2', 'gpm', 'gph', 'cfm/ft2', 'cfm', 'ft/s', 'ft/min', 'ft2', 'inwc', 'lbf', 'kW/s2', 'kWh', 'kW', 'MW', 'GW', 'gal', 'um', 'dB', 'Hz', 'awg', 'F', 'ach', 'pd']);

function unitAfter(text, pos) {
  const rest = text.slice(pos, pos + 40);
  for (const [re, canon, kind] of UNITS) {
    const m = rest.match(re);
    if (m) return { unit: canon, kind, len: m[0].length };
  }
  return null;
}

// The unit a table header cell carries: "Air changes / hour" → ach (not h), "ft² per detector or hole" → ft2
// (a measurement beats a count noun; among measurements the longest match wins).
function unitInText(text) {
  const t = String(text || '');
  let best = null;
  for (const [, canon, kind, src] of UNITS) {
    const m = t.match(new RegExp(`(^|[^A-Za-z])(${src})(?![A-Za-z])`));
    if (!m) continue;
    const score = (kind === 'measure' ? 1000 : 0) + m[2].length;
    if (!best || score > best.score) best = { unit: canon, kind, score };
  }
  return best ? { unit: best.unit, kind: best.kind } : null;
}

// The unit a number field's label carries: "max loss psi" → psi; "dedicated, months" → mo;
// "150% flow, min % of rated pressure" → % (unambiguous); "STI (min)" → none (min = minimum);
// "second threshold, sprinklers" → none (a count noun; "second" is an ordinal here).
function unitInLabel(label) {
  let t = String(label || '')
    .replace(/\((?:min|max|minimum|maximum)\)/gi, ' ')
    .replace(/^\s*(?:min|max|minimum|maximum)\s+/i, '')
    .replace(/\$\s*([kKMB])\b/g, ' $$$1 ')
    .trim();
  const money = t.match(/\$([kKMB])/);
  if (money) return { unit: money[1].toUpperCase(), kind: 'measure' };
  const words = t.replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean);
  for (let k = Math.min(3, words.length); k >= 1; k--) {
    const tail = words.slice(words.length - k).join(' ').replace(/[,;:]+$/, '');
    for (const [, canon, kind, src] of UNITS) {
      if (kind === 'measure' && new RegExp(`^(?:${src})$`).test(tail)) return { unit: canon, kind };
    }
  }
  for (const [, canon, kind, src] of UNITS) {
    if (UNAMBIGUOUS.has(canon) && new RegExp(`(^|[^A-Za-z])(?:${src})(?![A-Za-z])`).test(t)) return { unit: canon, kind };
  }
  return null;
}

export function canon(n) {
  const v = Number(String(n).replace(/,/g, ''));
  return Number.isFinite(v) ? String(v) : null;
}

const TOKEN_RE = /[A-Za-z]+-\d[\dA-Za-z.,\-–—/]*|[A-Za-z]+\d[\dA-Za-z.,\-–—/]*|\d[\dA-Za-z.,\-–—/]*/g;
const isYear = (v) => Number(v) >= 1900 && Number(v) <= 2100 && Number.isInteger(Number(v));

// Returns [{ kind: 'num'|'ref'|'ident', text, value?, unit?, unitKind?, index }]
export function extractTokens(input, { words = true } = {}) {
  const halves = String(input ?? '').replace(/(\d)½/g, '$1.5').replace(/½/g, '0.5');
  const text = words ? wordsToDigits(halves) : halves;
  const out = [];
  let m;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(text))) {
    let tok = m[0].replace(/[.,/\-–—]+$/, '');
    if (!tok) continue;
    const start = m.index;
    const after = start + tok.length;
    // Letter-led: acronym identifiers stay whole (HFC-227ea, IG-541, FK-5-1-12, EST3, L4);
    // an English word glued to a number is just the number ("regulated-24", "Point-3").
    if (/^[A-Za-z]/.test(tok)) {
      const lm = tok.match(/^([A-Za-z]+)-(.*)$/);
      if (lm && !/^[A-Z][A-Z0-9]*$/.test(lm[1])) {
        for (const part of lm[2].split(/[-–—/]/).filter(Boolean)) pushNumberish(out, part, start, null, text, after);
        continue;
      }
      for (const p of tok.split(/[–—]/).filter(Boolean)) out.push({ kind: 'ident', text: p, index: start });
      continue;
    }
    // Edition tags and hyphenated references: 13-2022, 72-2019, 5-32, 60335-2-40.
    if (/^\d+(?:\.\d+)?-\d/.test(tok) && !/[–—]/.test(tok) && !/-[A-Za-z]/.test(tok)) {
      out.push({ kind: 'ref', text: tok, index: start });
      continue;
    }
    // "95/5", "13/24", "5/60" → two numbers.
    if (/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/.test(tok)) {
      for (const p of tok.split('/')) pushNumberish(out, p, start, null, text, after);
      continue;
    }
    // Ranges: 0.10–0.35, 2–30, 90–120, 300,000–400,000, $220–300k
    if (/[–—]|(?<=\d)-(?=\d)/.test(tok)) {
      const parts = tok.split(/[–—]|(?<=\d)-(?=\d)/).filter(Boolean);
      const u = unitAfter(text, after);
      const before = out.length;
      for (const p of parts) pushNumberish(out, p, start, u, text, after);
      const added = out.slice(before);
      const money = added.find((t) => t.kind === 'num' && /^[KMB]$/.test(t.unit || ''));
      if (money) for (const t of added) if (t.kind === 'num' && !t.unit) t.unit = money.unit, (t.unitKind = 'measure');
      continue;
    }
    pushNumberish(out, tok, start, null, text, after);
  }
  return out;
}

function pushNumberish(out, tok, start, rangeUnit, text, after) {
  tok = tok.replace(/[.,]+$/, '');
  if (!tok) return;
  // "$830M" "7.5B" "300k" → number with a money suffix as its unit
  const money = tok.match(/^(\d+(?:,\d{3})*(?:\.\d+)?)([kKMB])$/);
  if (money) return out.push({ kind: 'num', text: tok, value: canon(money[1]), unit: money[2].toUpperCase(), unitKind: 'measure', index: start });
  if (/^\d+(?:\.\d+){2,}[A-Za-z]?$/.test(tok)) return out.push({ kind: 'ref', text: tok, index: start });
  let glued = null;
  let num = tok;
  const g = tok.match(/^(\d+(?:,\d{3})*(?:\.\d+)?)-([A-Za-z][A-Za-z.\-]*)$/); // 24-hour, 0.4-volt, 1-in., one-square-foot
  if (g) {
    num = g[1];
    glued = g[2];
  }
  const ord = tok.match(/^(\d+)(?:st|nd|rd|th)$/);
  if (ord) num = ord[1];
  const oneLetter = tok.match(/^(\d{1,3})[A-Za-z]$/); // "2L" in a formula → 2
  if (oneLetter) num = oneLetter[1];
  if (/^\d+(?:,\d{3})*(?:\.\d+)?$/.test(num)) {
    const value = canon(num);
    let u = rangeUnit;
    if (!u && glued) u = unitAfter(glued, 0);
    if (!u && !glued && !ord && !oneLetter) u = unitAfter(text, after);
    if (u && u.unit === 'yr' && isYear(value)) u = null;
    return out.push({ kind: 'num', text: tok, value, unit: u ? u.unit : null, unitKind: u ? u.kind : null, index: start });
  }
  return out.push({ kind: 'ident', text: tok, index: start });
}

// Code reference tokens: "NFPA 13 §29.2.2" → ["nfpa", "13", "29.2.2"]; "FM Data Sheet 5-32" → ["fm", "5-32"].
const REF_STOP = new Set(['section', 'sect', 'sec', 'table', 'tbl', 'chapter', 'ch', 'para', 'paragraph', 'standard', 'std', 'of', 'the', 'and', 'per', 'data', 'sheet', 'approval', 'article', 'art', 'edition', 'ed']);
export function refTokens(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/§/g, ' ')
    .replace(/[-–]\s*(19|20)\d\d\b/g, ' ')
    .replace(/\((19|20)\d\d\)/g, ' ')
    .replace(/[^a-z0-9.\-]+/g, ' ')
    .split(' ')
    .map((x) => x.replace(/^[.\-]+|[.\-]+$/g, ''))
    .filter((x) => x && !REF_STOP.has(x));
}

function tokenRe(tok) {
  const esc = tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^0-9A-Za-z])${esc}(?![0-9A-Za-z]|\\.\\d)`, 'i');
}

function lineHasAllTokens(line, toks) {
  return toks.every((t) => tokenRe(t).test(line));
}

// "NFPA 13 §29.2.2", "FM Data Sheet 5-32", "IFC 1207.5.5", "UL 9540A", "NFPA 20 Chapter 14", "NFPA 2001 Annex C"
const REF_PHRASE_RE =
  /\b(NFPA|NEC|IFC|IBC|IMC|CFC|UL|FM(?: Data Sheet| Approval Standard| DS)?|ASHRAE|EPA|OSHA)\s+(\d[\dA-Za-z.\-–]*)(?:\s*(?:\([^)]*\)|-\d{4}))?((?:\s*(?:§|Section|Sec\.|Chapter|Ch\.|Table|Tbl\.|Annex|Article|Art\.)\s*[A-Z0-9][\dA-Za-z.\-]*)*)/g;

export function extractRefPhrases(text) {
  const out = [];
  let m;
  REF_PHRASE_RE.lastIndex = 0;
  while ((m = REF_PHRASE_RE.exec(String(text ?? '')))) {
    out.push({ text: m[0].trim(), tokens: refTokens(m[0]), index: m.index });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Locating facts in a scope
// ---------------------------------------------------------------------------

function lineHasValue(scope, li, value) {
  return scope.byLine[li].some((t) => t.kind === 'num' && t.value === value);
}

function unitRe(unit) {
  const entry = UNITS.find(([, c]) => c === unit);
  if (!entry) return null;
  return new RegExp(`(^|[^A-Za-z])(?:${entry[3]})(?![A-Za-z])`);
}

// Returns { level: 'pair'|'line'|'value'|'value-only'|'none', lines }
function findNumber(scope, value, unit) {
  const lines = [];
  for (let li = 0; li < scope.byLine.length; li++) if (lineHasValue(scope, li, value)) lines.push(li);
  // A number that only occurs inside an identifier or a reference (227 in HFC-227ea, 1207 in IFC 1207.5.5).
  if (!lines.length) return { level: !unit && scope.values.has(value) ? 'value' : 'none', lines };
  if (!unit) return { level: 'value', lines };
  if (scope.pairs.has(`${value}|${unit}`)) {
    const l2 = lines.filter((li) => scope.byLine[li].some((t) => t.kind === 'num' && t.value === value && t.unit === unit));
    return { level: 'pair', lines: l2 };
  }
  const ure = unitRe(unit);
  const l3 = lines.filter((li) => ure && ure.test(scope.lines[li].text));
  if (l3.length) return { level: 'line', lines: l3 };
  return { level: 'value-only', lines };
}

function findVerbatim(scope, tok) {
  const re = tokenRe(tok);
  const lines = [];
  scope.lines.forEach((l, li) => {
    if (re.test(l.text) || re.test(l.plain)) lines.push(li);
  });
  return lines;
}

function findRefPhrase(scope, toks) {
  const lines = [];
  scope.lines.forEach((l, li) => {
    if (lineHasAllTokens(l.text, toks)) lines.push(li);
  });
  return lines;
}

function findWords(scope, value) {
  const v = normalizeText(value);
  return !!v && (scope.norm.includes(v) || scope.normPlain.includes(v));
}

// normalizeText keeps ".", "%" and "/" (for 29.2.2, 95%, ft/s); for word matching a period that
// is not inside a number is punctuation.
const normWords = (s) => normalizeText(s).replace(/(?<!\d)\.|\.(?!\d)/g, ' ').replace(/\s+/g, ' ').trim();

const STOP = new Set(['the', 'and', 'for', 'with', 'per', 'that', 'this', 'from', 'into', 'then', 'than', 'are', 'its', 'your', 'you', 'not', 'but', 'all', 'any', 'one', 'each', 'every', 'has', 'have', 'was', 'were', 'will', 'can', 'out', 'off', 'our', 'what', 'how', 'who', 'they', 'them', 'their', 'there', 'where', 'when', 'which', 'before', 'after', 'about', 'against', 'only', 'just', 'also', 'still', 'both']);
const contentWords = (s) => normWords(s).split(' ').filter((w) => w.length >= 3 && !STOP.has(w));
const wordHit = (w, set) => set.has(w) || (w.length >= 4 && [...set].some((x) => x.length >= 4 && (x.startsWith(w) || w.startsWith(x))));

// Where in `scope` does this step or beat live? Bag-of-words against each line.
// Returns { ratio, best: lineIdx, candidates: [{ li, pos }], snippet }.
function locatePhrase(phrase, scope) {
  const words = contentWords(phrase);
  if (!words.length) return { ratio: 1, best: -1, candidates: [], snippet: '' };
  if (!scope.lines.length) return { ratio: 0, best: -1, candidates: [], snippet: '', words: words.length };
  const scored = scope.lines.map((l, li) => {
    const set = new Set(contentWords(l.text));
    const hit = words.filter((w) => wordHit(w, set)).length;
    return { li, ratio: hit / words.length };
  });
  const bestRatio = Math.max(...scored.map((s) => s.ratio));
  const candidates = scored
    .filter((s) => s.ratio > 0 && s.ratio >= Math.max(0.5, bestRatio - 0.15))
    .map(({ li }) => {
      const lineNorm = normWords(scope.lines[li].text);
      const w = longestWindow(phrase, lineNorm);
      return { li, pos: li * 1e6 + (w.positions[0] ?? 0), snippet: w.snippet };
    });
  const best = scored.find((s) => s.ratio === bestRatio);
  return { ratio: bestRatio, best: best ? best.li : -1, candidates, snippet: candidates[0]?.snippet || '', words: words.length };
}

// Longest run of consecutive words of `needle` that appears in `hay` (both normalized).
function longestWindow(needle, hay) {
  const hayNorm = normWords(hay);
  const words = normWords(needle).split(' ').filter(Boolean);
  const total = words.length;
  for (let k = total; k >= 1; k--) {
    for (let i = 0; i + k <= total; i++) {
      const win = words.slice(i, i + k).join(' ');
      if (win.length < 3 && k === 1) continue;
      const re = new RegExp(`(^| )${win.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`);
      if (re.test(hayNorm)) {
        const positions = [];
        let from = 0;
        for (;;) {
          const m = hayNorm.slice(from).match(re);
          if (!m) break;
          const at = from + m.index + m[1].length;
          positions.push(at);
          from = at + 1;
        }
        return { words: k, total, positions, snippet: win };
      }
    }
  }
  return { words: 0, total, positions: [], snippet: '' };
}

// ---------------------------------------------------------------------------
// Hedges: "confirm in your edition" and friends
// ---------------------------------------------------------------------------

const HEDGE_RE = /confirm (?:sections?|table numbers?|them|it|the (?:section|table|numbers?)) in (?:your|the) edition|check whether your edition|confirm the edition's wording|confirm (?:in|them in) the edition/i;
const STD_NAME_RE = /\b(NFPA \d+|IBC|IFC|NEC|UL \d+[A-Z]?|FM)\b/g;

function hedgeSpans(doc) {
  // [{ line, cell: string|null }] — a hedged line, or one hedged table cell.
  const spans = [];
  const sourcesSection = doc.sections.find((s) => s.text === 'Sources');
  const blocks = [];
  let cur = null;
  doc.rawLines.forEach((l, i) => {
    if (l.trim()) {
      if (!cur) cur = { start: i, end: i };
      cur.end = i;
    } else if (cur) {
      blocks.push(cur);
      cur = null;
    }
  });
  if (cur) blocks.push(cur);
  const blockOf = (i) => blocks.findIndex((b) => i >= b.start && i <= b.end);
  const addBlock = (b, onlyStandards = null) => {
    for (let i = b.start; i <= b.end; i++) {
      if (onlyStandards && isTableRow(doc.rawLines[i])) {
        const cells = splitCells(doc.lines[i]);
        if (!onlyStandards.some((s) => cells[0].includes(s) || cells.some((c) => c.includes(s)))) continue;
      }
      spans.push({ line: i, cell: null });
    }
  };
  doc.lines.forEach((l, i) => {
    if (!HEDGE_RE.test(l)) return;
    if (sourcesSection && i >= sourcesSection.start && i < sourcesSection.end) return;
    if (isTableRow(doc.rawLines[i])) {
      // a table row: only the cell that carries the hedge
      const cell = splitCells(l).find((c) => HEDGE_RE.test(c));
      spans.push({ line: i, cell });
      return;
    }
    const bi = blockOf(i);
    const b = blocks[bi];
    addBlock(b);
    if (/above/i.test(l) && bi > 0) addBlock(blocks[bi - 1], l.match(STD_NAME_RE));
    // A bold label that ends in the hedge — "Generator numbers (NFPA 110 — confirm sections in your edition)" — hedges the list or table under it.
    if ((b.start === b.end || i === b.end) && bi + 1 < blocks.length && /\)\.?$|:\s*$/.test(l.trim())) addBlock(blocks[bi + 1]);
  });
  return spans;
}
const HEDGES = new Map(DOCS.map((d) => [d.file, hedgeSpans(d)]));

// Is every occurrence of this value (within these scope lines) inside a hedged span?
function hedgedIn(scope, lineIdxs, value) {
  if (!lineIdxs.length) return false;
  const spans = HEDGES.get(scope.file) || [];
  return lineIdxs.every((li) => {
    const abs = scope.lines[li].i;
    const hits = spans.filter((s) => s.line === abs);
    if (!hits.length) return false;
    if (hits.some((h) => h.cell === null)) return true;
    const outside = splitCells(scope.lines[li].text)
      .filter((c) => c && !hits.some((h) => h.cell === c))
      .join(' | ');
    return !extractTokens(outside).some((t) => t.kind === 'num' && t.value === value) && !findVerbatimText(outside, value);
  });
}
const findVerbatimText = (text, tok) => tokenRe(tok).test(text);

// ---------------------------------------------------------------------------
// Matrix tables
// ---------------------------------------------------------------------------

function parseTables(scope) {
  const tables = [];
  let cur = null;
  scope.lines.forEach((l) => {
    if (isTableRow(l.raw)) {
      const cells = splitCells(l.plain);
      if (isSeparatorRow(l.raw)) return;
      if (!cur) cur = { header: cells, rows: [] };
      else cur.rows.push(cells);
    } else if (cur) {
      tables.push(cur);
      cur = null;
    }
  });
  if (cur) tables.push(cur);
  return tables;
}

function labelScore(a, b) {
  const x = normalizeText(a);
  const y = normalizeText(b);
  if (!x || !y) return 0;
  if (x === y) return 3;
  if (x.includes(y) || y.includes(x)) return 2 + Math.min(x.length, y.length) / Math.max(x.length, y.length);
  const xs = new Set(x.split(' '));
  const ys = y.split(' ');
  const overlap = ys.filter((w) => xs.has(w)).length / Math.max(xs.size, ys.length);
  return overlap >= 0.6 ? 1 + overlap : 0;
}

function bestIndex(label, candidates) {
  let best = -1;
  let bestScore = 0;
  candidates.forEach((c, i) => {
    const s = labelScore(c, label);
    if (s > bestScore) {
      bestScore = s;
      best = i;
    }
  });
  return best;
}

function cellState(cell) {
  const c = String(cell ?? '').trim();
  if (c === '' || c === '—' || c === '-' || c === '–') return '—';
  if (c === '●' || c === '•') return '●';
  if (/per bod/i.test(c)) return 'per BOD';
  if (/^supervisory/i.test(c)) return 'Supervisory';
  if (/^trouble/i.test(c)) return 'Trouble';
  return '●';
}

function checkMatrix(card, scopes) {
  const g = card.answer.grid;
  const out = [];
  let table = null;
  let colMap = null;
  let rowMap = null;
  for (const scope of scopes) {
    for (const t of parseTables(scope)) {
      const cm = g.outputs.map((o) => {
        const i = bestIndex(o, t.header.slice(1));
        return i < 0 ? -1 : i + 1;
      });
      const rm = g.inputs.map((inp) => bestIndex(inp, t.rows.map((r) => r[0])));
      if (cm.every((i) => i >= 0) && rm.every((i) => i >= 0) && new Set(rm).size === rm.length && new Set(cm).size === cm.length) {
        table = t;
        colMap = cm;
        rowMap = rm;
        break;
      }
    }
    if (table) break;
  }
  if (!table) {
    review.push({ kind: 'matrix', card: card.id, where: 'grid', token: `${g.inputs.length}×${g.outputs.length}`, detail: 'no table in the source has these inputs and outputs — built from prose, check by eye' });
    return out;
  }
  const defaultStates = new Set(['●', '—', 'per BOD', 'Supervisory', 'Trouble']);
  g.inputs.forEach((inp, r) => {
    g.outputs.forEach((o, c) => {
      const want = String(g.cells[r][c]).trim();
      const have = table.rows[rowMap[r]][colMap[c]] ?? '';
      const ok = defaultStates.has(want) ? cellState(have) === want : normalizeText(have).includes(normalizeText(want)) || normalizeText(want).includes(normalizeText(have));
      if (!ok) out.push({ kind: 'matrix', card: card.id, where: `grid[${inp} × ${o}]`, token: want, detail: `guide cell reads "${have}" (row "${table.rows[rowMap[r]][0]}", column "${table.header[colMap[c]]}")` });
    });
  });
  return out;
}

// ---------------------------------------------------------------------------
// Allowlist
// ---------------------------------------------------------------------------

const ALLOW_PATH = join(ROOT, 'scripts/audit-allow.json');
const ALLOW = existsSync(ALLOW_PATH) ? JSON.parse(readFileSync(ALLOW_PATH, 'utf8')) : [];
const allowUsed = new Map(ALLOW.map((a) => [a, 0]));
function allowed(f) {
  for (const a of ALLOW) {
    if (a.card !== f.card) continue;
    if (a.where && a.where !== f.where && !(f.where || '').startsWith(a.where)) continue;
    if (a.token && !(String(f.token) === a.token || String(f.token).includes(a.token))) continue;
    if (a.kind && a.kind !== f.kind) continue;
    allowUsed.set(a, allowUsed.get(a) + 1);
    return a;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Auditing one card
// ---------------------------------------------------------------------------

const findings = []; // hard findings
const review = []; // fuzzy, informational
const trace = []; // --card mode

function report(f) {
  const a = allowed(f);
  if (a) f.allowed = a;
  findings.push(f);
}

const stripNumbering = (s) => String(s).replace(/^\s*\d{1,2}[.)]\s+/, '');

// Check every token in a piece of text against the scope chain [sub?, section, file].
//   mnemonic: hooks — hyphens and slashes split, only numbers and acronym identifiers are checked, in both files
//   outsideHard: a fact found only outside the card's section is a finding (graded facts); otherwise a review note
function checkText(card, where, text, chain, { mnemonic = false, outsideHard = false } = {}) {
  const fileOnly = mnemonic;
  // Hooks: "200-for-2", "buck-50", "13/24" split at letters and slashes; "5-32" and "29.2.2" stay references;
  // number words are mnemonic wording, not facts ("a quarter-thousand gallons a minute" = 250 gpm).
  const src = mnemonic ? String(text).replace(/(?<=[A-Za-z])[-–—/]|[-–—/](?=[A-Za-z])|(?<=\d)\/(?=\d)/g, ' ') : stripNumbering(text);
  const toks = extractTokens(src, { words: !mnemonic });
  const phrases = mnemonic ? [] : extractRefPhrases(src);
  const covered = new Set();
  const outside = (f) => (outsideHard ? report(f) : review.push(f));
  for (const p of phrases) {
    const res = locateRef(p.tokens, chain, fileOnly);
    trace.push({ card: card.id, where, token: p.text, result: res.level, at: res.at });
    if (res.level === 'none') report({ kind: 'facts', card: card.id, where, token: p.text, detail: `reference not found in ${chain[chain.length - 1].label}` });
    else if (res.level === 'file') outside({ kind: 'outside', card: card.id, where, token: p.text, detail: `reference found only outside the card's section (${res.at})` });
    for (const t of toks) if (t.index >= p.index && t.index < p.index + p.text.length) covered.add(t);
  }
  for (const t of toks) {
    if (covered.has(t)) continue;
    if (t.kind === 'num') {
      const res = locateNumber(t.value, t.unit, chain, fileOnly);
      trace.push({ card: card.id, where, token: `${t.text}${t.unit ? ` [${t.unit}]` : ''}`, result: res.level, at: res.at });
      const label = `${t.text}${t.unit && !t.text.toLowerCase().includes(t.unit.toLowerCase()) ? ` ${t.unit}` : ''}`;
      if (res.level === 'none') report({ kind: 'facts', card: card.id, where, token: label, detail: `number not found in ${chain[chain.length - 1].label}` });
      else if (res.level === 'value-only') {
        if (t.unitKind === 'measure') report({ kind: 'facts', card: card.id, where, token: label, detail: `${t.value} is in ${res.at} but never with the unit "${t.unit}"` });
        else review.push({ kind: 'unit', card: card.id, where, token: label, detail: `${t.value} is in ${res.at}, the count noun "${t.unit}" is not on the same line` });
      } else if (res.level === 'file') outside({ kind: 'outside', card: card.id, where, token: label, detail: `found only outside the card's section (${res.at})` });
    } else if (t.kind === 'ref' || t.kind === 'ident') {
      if (mnemonic && t.kind === 'ident' && !/^[A-Z]{2,}\d|^\d+[A-Z]$/.test(t.text)) continue;
      // Single-letter identifiers (L4, Q11, I3) are checked in the whole file.
      const single = /^[A-Za-z]\d/.test(t.text);
      let res = locateVerbatim(t.text, chain, fileOnly || single);
      // A hook's "20-14" (NFPA 20 Chapter 14) is two numbers if it is not a reference the guide writes.
      if (res.level === 'none' && mnemonic && t.kind === 'ref') {
        const parts = t.text.split(/[-–—.]/).filter(Boolean);
        if (parts.every((p) => locateNumber(canon(p), null, chain, true).level !== 'none')) res = { level: 'ok', at: 'as separate numbers' };
      }
      trace.push({ card: card.id, where, token: t.text, result: res.level, at: res.at });
      if (res.level === 'none') {
        if (t.kind === 'ident' && single) review.push({ kind: 'ident', card: card.id, where, token: t.text, detail: 'identifier not in either source file' });
        else report({ kind: 'facts', card: card.id, where, token: t.text, detail: `${t.kind === 'ref' ? 'section reference' : 'identifier'} not found in ${chain[chain.length - 1].label}` });
      } else if (res.level === 'file' && !single) outside({ kind: 'outside', card: card.id, where, token: t.text, detail: `found only outside the card's section (${res.at})` });
    }
  }
}

// Walk the chain: a hit in a section-level scope is 'ok'; a hit only in a file scope is 'file';
// a value seen without its unit anywhere is 'value-only'; otherwise 'none'.
function locateNumber(value, unit, chain, fileOnly) {
  const scopes = fileOnly ? [chain[chain.length - 1]] : chain;
  let valueOnly = null;
  for (const s of scopes) {
    const r = findNumber(s, value, unit);
    if (r.level === 'pair' || r.level === 'line' || r.level === 'value') return { level: isFileScope(s) && !fileOnly ? 'file' : 'ok', at: s.label, lines: r.lines, scope: s };
    if (r.level === 'value-only' && !valueOnly) valueOnly = { level: 'value-only', at: s.label, lines: r.lines, scope: s };
  }
  return valueOnly || { level: 'none', at: null };
}

function locateVerbatim(tok, chain, fileOnly) {
  const scopes = fileOnly ? [chain[chain.length - 1]] : chain;
  for (const s of scopes) {
    const lines = findVerbatim(s, tok);
    if (lines.length) return { level: isFileScope(s) && !fileOnly ? 'file' : 'ok', at: s.label, lines, scope: s };
  }
  return { level: 'none', at: null };
}

function locateRef(toks, chain, fileOnly) {
  const scopes = fileOnly ? [chain[chain.length - 1]] : chain;
  for (const s of scopes) {
    const lines = findRefPhrase(s, toks);
    if (lines.length) return { level: isFileScope(s) && !fileOnly ? 'file' : 'ok', at: s.label, lines, scope: s };
  }
  return { level: 'none', at: null };
}

const MC_RE = /(^|\s)[A-Da-d][).]\s[^\n]{1,80}?\s[A-Da-d][).]\s|\(a\)\s[^\n]{1,80}?\(b\)\s|which of (?:the following|these)|\btrue or false\b|\byes or no\b|\bmultiple choice\b|\bpick one\b|\bchoose (?:one|from)\b/i;

function auditCard(card) {
  const { section, sub, missing } = resolveSource(card.source);
  if (!section) {
    report({ kind: 'source', card: card.id, where: 'source', token: card.source, detail: 'first segment is not a heading in either source file' });
    return;
  }
  for (const m of missing) report({ kind: 'source', card: card.id, where: 'source', token: m, detail: `label not found under "${section.text}"` });
  const sec = sectionScope(section);
  const fil = fileScope(section.file);
  // sub-label → section → its file → both files (a fact in the other file is "outside", not missing)
  const chain = sub ? [sub, sec, fil, allScope()] : [sec, fil, allScope()];
  const a = card.answer;

  // Prompt and interviewer phrasing (hypothetical numbers live in the allowlist).
  checkText(card, 'prompt', card.prompt, chain);
  if (card.interviewerPhrasing) checkText(card, 'interviewerPhrasing', card.interviewerPhrasing, chain);

  // Explanation — the correction the player reads ("Line 6 — …" on a defect card is a line number, not a fact).
  checkText(card, 'explanation', card.type === 'defect' ? a.explanation.replace(/\blines? \d+(?:(?:,| and| or) \d+)*\b/gi, 'line') : a.explanation, chain);

  // Hook — mnemonic; its numbers must at least exist somewhere in the two files.
  checkText(card, 'hook', card.hook, [allScope()], { mnemonic: true });

  // codeRef — the standard and section must co-occur on one line of the source.
  let hedged = false;
  if (a.codeRef) {
    const toks = refTokens(a.codeRef);
    const res = locateRef(toks, chain, false);
    trace.push({ card: card.id, where: 'codeRef', token: a.codeRef, result: res.level, at: res.at });
    if (res.level === 'none') report({ kind: 'facts', card: card.id, where: 'codeRef', token: a.codeRef, detail: `standard and section never on one line of ${section.file}` });
    else if (res.level === 'file') report({ kind: 'outside', card: card.id, where: 'codeRef', token: a.codeRef, detail: `found only outside the card's section (${res.at})` });
    else if (/\d\.\d|chapter|table|annex|§/i.test(a.codeRef) && hedgedIn(res.scope, res.lines, toks[toks.length - 1])) hedged = true;
  }

  // Facts by type.
  switch (card.type) {
    case 'number': {
      a.fields.forEach((f, i) => {
        const where = `fields[${i}] "${f.label}"`;
        if (typeof f.value === 'number') {
          let u = unitInLabel(f.label);
          const value = canon(f.value);
          if (u && u.unit === 'yr' && isYear(value)) u = null;
          let res = locateNumber(value, u ? u.unit : null, chain, false);
          // "design-review level, L" = 0 → the identifier L0
          if (res.level !== 'ok') {
            const pre = f.label.match(/\b([A-Z])$/);
            if (pre && locateVerbatim(`${pre[1]}${f.value}`, chain, false).level === 'ok') res = { level: 'ok', at: `identifier ${pre[1]}${f.value}`, lines: [], scope: sec };
          }
          trace.push({ card: card.id, where, token: `${value}${u ? ` [${u.unit}]` : ''}`, result: res.level, at: res.at });
          const label = `${f.value}${u ? ` ${u.unit}` : ''}`;
          if (res.level === 'none') report({ kind: 'facts', card: card.id, where, token: label, detail: `number not found in ${section.file}` });
          else if (res.level === 'value-only') report({ kind: 'facts', card: card.id, where, token: label, detail: `${value} is in ${res.at} but never with the unit "${u.unit}"` });
          else if (res.level === 'file') report({ kind: 'outside', card: card.id, where, token: label, detail: `found only outside the card's section (${res.at})` });
          else if (res.lines.length && hedgedIn(res.scope, res.lines, value)) hedged = true;
          // Prompt gives the answer away? (the same number with no unit, or with this field's unit — "10 in." is not "10 ft/s")
          if (extractTokens(card.prompt).some((t) => t.kind === 'num' && t.value === value && (!t.unit || !u || t.unit === u.unit)) && !/^[0-5]$/.test(value)) {
            report({ kind: 'mc', card: card.id, where: 'prompt', token: String(f.value), detail: `the prompt contains the answer to "${f.label}"` });
          }
        } else {
          const inSec = findWords(sec, f.value) || (sub && findWords(sub, f.value));
          const ok = inSec || findWords(fil, f.value);
          trace.push({ card: card.id, where, token: f.value, result: ok ? (inSec ? 'ok' : 'file') : 'none', at: ok ? (inSec ? section.text : section.file) : null });
          if (!ok) report({ kind: 'facts', card: card.id, where, token: f.value, detail: `word answer not found in ${section.file}` });
          else if (!inSec) report({ kind: 'outside', card: card.id, where, token: f.value, detail: `word answer found only outside the card's section` });
          // Secretly multiple choice: the word answer (or an alias) is offered in the prompt.
          const p = normalizeText(card.prompt);
          const offered = [f.value, ...(f.aliases || [])].filter((v) => normalizeText(v).length > 2 && new RegExp(`(^| )${normalizeText(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(p));
          if (offered.length && /\bor\b|\//.test(card.prompt)) report({ kind: 'mc', card: card.id, where: 'prompt', token: offered[0], detail: `the prompt offers the word answer as an option` });
        }
      });
      break;
    }
    case 'order': {
      // Locate every step in one scope (positions are only comparable within a scope): the
      // sub-label block if it holds all the steps, otherwise the whole section.
      const phrases = a.steps.map(stripNumbering);
      let scope = sub || sec;
      let located = phrases.map((p) => locatePhrase(p, scope));
      if (sub && located.some((l) => l.ratio < 0.5)) {
        const inSec = phrases.map((p) => locatePhrase(p, sec));
        if (inSec.filter((l) => l.ratio >= 0.5).length > located.filter((l) => l.ratio >= 0.5).length) {
          scope = sec;
          located = inSec;
        }
      }
      a.steps.forEach((s, i) => {
        checkText(card, `steps[${i}]`, s, chain, { outsideHard: true });
        const loc = located[i];
        trace.push({ card: card.id, where: `steps[${i}]`, token: s, result: `${Math.round(loc.ratio * 100)}% of words`, at: `${loc.candidates.map((c) => c.pos).join('/')} · ${loc.best >= 0 ? scope.lines[loc.best]?.text?.slice(0, 60) : ''}` });
        if (loc.ratio < 0.5) report({ kind: 'order', card: card.id, where: `steps[${i}]`, token: s, detail: `step not located in "${scope.label}" (${Math.round(loc.ratio * 100)}% of its words on the best line: "${loc.snippet}")` });
        else if (loc.ratio < 0.75) review.push({ kind: 'paraphrase', card: card.id, where: `steps[${i}]`, token: s, detail: `paraphrased (${Math.round(loc.ratio * 100)}% of words on one line of "${scope.label}")` });
      });
      // Monotone selection of positions across candidate lines.
      let prev = -1;
      let broke = null;
      for (let i = 0; i < located.length; i++) {
        const cands = located[i].candidates.map((c) => c.pos).sort((x, y) => x - y);
        if (!cands.length || located[i].ratio < 0.5) continue; // unlocated: skip (already reported)
        const next = cands.find((p) => p > prev);
        if (next == null) {
          broke = i;
          break;
        }
        prev = next;
      }
      if (broke != null) report({ kind: 'order', card: card.id, where: `steps[${broke}]`, token: a.steps[broke], detail: `comes before "${a.steps[broke - 1] ?? ''}" in the guide — order differs from "${scope.label}"` });
      break;
    }
    case 'matrix': {
      for (const f of checkMatrix(card, chain)) report(f);
      break;
    }
    case 'scenario': {
      a.beats.forEach((b, i) => {
        if (typeof b !== 'string' && b.fillIn) return;
        const label = typeof b === 'string' ? b : b.label || b.text;
        checkText(card, `beats[${i}]`, label, chain);
        const loc = locatePhrase(label, sec);
        if (loc.ratio < 0.5 && (loc.words || 0) >= 3) review.push({ kind: 'paraphrase', card: card.id, where: `beats[${i}]`, token: label, detail: `paraphrased (${Math.round(loc.ratio * 100)}% of words on one line of "${sec.label}")` });
      });
      if (card.walkthrough) checkWalkthroughOrder(card, sec, sub);
      break;
    }
    case 'story': {
      for (const para of a.script.split(/\n\n+/)) {
        const p = para.trim();
        if (!p) continue;
        if (!sec.plainText.includes(p) && !fil.plainText.includes(p)) {
          const best = bestParagraph(p, fil.plainText);
          report({ kind: 'story', card: card.id, where: 'script', token: p.slice(0, 70), detail: `paragraph is not verbatim; it diverges from the source at "${best}"` });
        } else if (!sec.plainText.includes(p)) report({ kind: 'outside', card: card.id, where: 'script', token: p.slice(0, 70), detail: "paragraph is verbatim but not in the card's section" });
      }
      a.beats.forEach((b, i) => {
        if (b.quote && !a.script.includes(b.quote) && !fil.plainText.includes(b.quote)) report({ kind: 'story', card: card.id, where: `beats[${i}]`, token: b.quote.slice(0, 70), detail: 'quote not in the script or the source' });
        if (b.quote && /\[/.test(b.quote) && !b.fillIn) report({ kind: 'story', card: card.id, where: `beats[${i}]`, token: b.label, detail: 'a graded beat quotes a bracketed (open) line' });
        if (!b.fillIn) checkText(card, `beats[${i}]`, b.label, chain);
      });
      if (a.beats.filter((b) => !b.fillIn && b.kind === 'lesson').length !== 1) report({ kind: 'story', card: card.id, where: 'beats', token: 'lesson', detail: 'needs exactly one lesson beat' });
      break;
    }
    case 'defect': {
      a.lines.forEach((l, i) => {
        if (i === a.defectIndex) {
          // Informational: does the planted line carry a number the guide does not? (a wrong-number defect)
          const toks = extractTokens(stripNumbering(l)).filter((t) => t.kind === 'num');
          const allFound = toks.every((t) => locateNumber(t.value, t.unit, chain, false).level !== 'none');
          if (toks.length && allFound) review.push({ kind: 'defect', card: card.id, where: `lines[${i}] (planted)`, token: l, detail: 'every number in the planted line exists in the source — the defect must be non-numeric' });
          return;
        }
        checkText(card, `lines[${i}]`, l, chain);
      });
      break;
    }
    default:
      break;
  }

  // Hedges.
  if (hedged && !card.confirmInEdition) report({ kind: 'hedge', card: card.id, where: 'confirmInEdition', token: a.codeRef || '(no codeRef)', detail: 'the guide hedges this fact ("confirm in your edition"); set confirmInEdition: true and codeRef to the standard name only' });
  if (card.confirmInEdition && a.codeRef && /§|\d+\.\d+|chapter|table/i.test(a.codeRef)) report({ kind: 'hedge', card: card.id, where: 'codeRef', token: a.codeRef, detail: 'confirmInEdition cards carry the standard name only' });
  if (card.confirmInEdition && !hedged && card.type === 'number') review.push({ kind: 'hedge', card: card.id, where: 'confirmInEdition', token: a.codeRef || '', detail: 'confirmInEdition is set but no hedge was found on the lines this card draws from' });

  // Multiple choice.
  for (const [where, text] of [['prompt', card.prompt], ['interviewerPhrasing', card.interviewerPhrasing || '']]) {
    if (card.type !== 'matrix' && card.type !== 'defect' && MC_RE.test(text)) report({ kind: 'mc', card: card.id, where, token: text.match(MC_RE)[0].trim(), detail: 'prompt reads as multiple choice' });
  }

  // Round 2: the follow-up chain and the "Don't say" note.
  auditFollowUps(card, sec, sub);
  if (a.dontSay != null) checkDontSay(card, chain);
}

function bestParagraph(p, hay) {
  // Longest prefix of p that occurs in hay, then the next few words.
  let lo = 0;
  let hi = p.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (hay.includes(p.slice(0, mid))) lo = mid;
    else hi = mid - 1;
  }
  const prefix = p.slice(Math.max(0, lo - 25), lo);
  return `…${prefix}‹›${p.slice(lo, lo + 40)}`;
}

// ---------------------------------------------------------------------------
// mock.json
// ---------------------------------------------------------------------------

function auditMock(mock, cardsById, cards) {
  for (const deck of mock.decks) {
    for (const q of deck.questions) {
      const fake = { id: q.id, prompt: q.prompt, hook: '', source: q.source, answer: { explanation: '' } };
      const { section, missing } = resolveSource(q.source);
      if (!section) {
        report({ kind: 'mock', card: q.id, where: 'source', token: q.source, detail: 'not a heading in either source file' });
        continue;
      }
      for (const m of missing) report({ kind: 'mock', card: q.id, where: 'source', token: m, detail: `label not found under "${section.text}"` });
      // Scope: the question's section + the linked card's section + every section the topic's cards cite.
      const secs = new Map([[section.text, section]]);
      const linked = q.cardId ? cardsById.get(q.cardId) : null;
      if (q.cardId && !linked) report({ kind: 'mock', card: q.id, where: 'cardId', token: q.cardId, detail: 'no such card in the bank' });
      const related = cards.filter((c) => c.topicId === q.topicId);
      for (const c of [linked, ...related].filter(Boolean)) {
        const r = resolveSource(c.source);
        if (r.section) secs.set(r.section.text, r.section);
      }
      const chain = [...secs.values()].map(sectionScope);
      const files = [...new Set(chain.map((s) => s.file))].map(fileScope);
      const full = [...chain, ...files, allScope()];
      const before = findings.length;
      checkText(fake, 'prompt', q.prompt, full);
      checkText(fake, 'followUp', q.followUp, full);
      const joined = { label: 'related sections', lines: chain.flatMap((s) => s.lines), text: chain.map((s) => s.text).join('\n') };
      q.beats.forEach((b, i) => {
        const label = typeof b === 'string' ? b : b.label || b.text;
        checkText(fake, `beats[${i}]`, label, full);
        const loc = locatePhrase(label, joined);
        if ((loc.words || 0) >= 3 && loc.ratio < 0.5) review.push({ kind: 'paraphrase', card: q.id, where: `beats[${i}]`, token: label, detail: `paraphrased (${Math.round(loc.ratio * 100)}% of words on one line of the related sections)` });
      });
      // Round 2: the question's follow-up layers.
      if (deck.round) auditMockFollowUps(q, fake, linked, chain, files);
      for (let k = before; k < findings.length; k++) {
        findings[k].kind = 'mock';
        if (deck.round) findings[k].round2 = true;
      }
      const loc = locatePhrase(q.prompt, allScope());
      if ((loc.words || 0) >= 3 && loc.ratio < 0.6) review.push({ kind: 'paraphrase', card: q.id, where: 'prompt', token: q.prompt, detail: `prompt paraphrases the guide (${Math.round(loc.ratio * 100)}% of words on one line)` });
      if (MC_RE.test(q.prompt)) report({ kind: 'mock', card: q.id, where: 'prompt', token: q.prompt, detail: 'reads as multiple choice', round2: !!deck.round });
    }
  }
}

// ---------------------------------------------------------------------------
// Round 2: follow-up chains (GAME_SPEC_ROUND2 §5, §8), mock follow-ups, coverage targets
// ---------------------------------------------------------------------------

// Everything a round-2 check reports is tagged `round2` so audit-report-r2.md can list it.
const reportR2 = (f) => report({ ...f, round2: true });
const reviewR2 = (f) => review.push({ ...f, round2: true });

// Several section-level scopes as one scope that still counts as "in a section" (not a file scope).
function mergeScopes(label, parts) {
  return {
    file: '*',
    label,
    lines: parts.flatMap((p) => p.lines),
    text: parts.map((p) => p.text).join('\n'),
    plainText: parts.map((p) => p.plainText).join('\n'),
    norm: parts.map((p) => p.norm).join(' '),
    normPlain: parts.map((p) => p.normPlain).join(' '),
    values: new Set(parts.flatMap((p) => [...p.values])),
    pairs: new Set(parts.flatMap((p) => [...p.pairs])),
    refs: new Set(parts.flatMap((p) => [...p.refs])),
    idents: new Set(parts.flatMap((p) => [...p.idents])),
    byLine: parts.flatMap((p) => p.byLine),
  };
}

const EMPTY_SCOPE = (label) => ({ file: '*', label, lines: [], text: '', plainText: '', norm: '', normPlain: '', values: new Set(), pairs: new Set(), refs: new Set(), idents: new Set(), byLine: [] });

// The debrief's "Facts about my own work" list items (the template's own prose is not a fact).
let factsScope = null;
function debriefFactsScope() {
  if (factsScope) return factsScope;
  const label = 'round1-debrief.md › Facts about my own work';
  const section = DEBRIEF && DEBRIEF.sections.find((s) => s.text === 'Facts about my own work');
  if (!section) return (factsScope = EMPTY_SCOPE(label));
  const idxs = [];
  for (let i = section.start + 1; i < section.end; i++) if (/^\s*[-*]\s+\S/.test(DEBRIEF.rawLines[i])) idxs.push(i);
  factsScope = idxs.length ? makeScope(DEBRIEF_FILE, idxs, label) : EMPTY_SCOPE(label);
  return factsScope;
}

// Where Brandon's experience may come from (GAME_SPEC_ROUND2 §8.1): the story scripts (without
// their "Open questions" list, which names what is still unknown), the guide's Interview playbook,
// and the debrief facts. A hit here is "in a section", never "outside".
let expScope = null;
function experienceScope() {
  if (expScope) return expScope;
  const scripts = docOf('content/story-scripts.md');
  const open = scripts.sections.find((s) => s.text === 'Open questions to finish the stories');
  const idxs = scripts.lines.map((_, i) => i).filter((i) => !open || i < open.start || i >= open.end);
  const playbook = SECTION_BY_HEADING.get('Interview playbook');
  expScope = mergeScopes('story-scripts.md + Interview playbook + debrief facts', [makeScope(scripts.file, idxs, 'story-scripts.md (without the open questions)'), playbook ? sectionScope(playbook) : EMPTY_SCOPE('Interview playbook'), debriefFactsScope()]);
  return expScope;
}

// Bracketed [open] items in the sources: a graded beat must never restate one.
const BRACKETS = [];
for (const d of [...DOCS, ...EXTRA_DOCS]) {
  d.lines.forEach((l, i) => {
    for (const m of l.matchAll(/\[([^\]]+)\]/g)) {
      const words = contentWords(m[1]);
      if (words.length >= 3) BRACKETS.push({ file: d.file.replace(/^content\//, ''), line: i + 1, text: m[1].trim(), words: new Set(words) });
    }
  });
}
function bracketHit(text) {
  const words = contentWords(text);
  if (words.length < 3) return null;
  let best = null;
  for (const b of BRACKETS) {
    const hit = words.filter((w) => wordHit(w, b.words)).length / words.length;
    if (hit >= 0.6 && (!best || hit > best.hit)) best = { ...b, hit };
  }
  return best;
}

// A follow-up's `source`: a heading path (as a card's), or one of the whole-document sources the
// validator accepts (EXTRA_SOURCES). Returns section-level scopes, narrowest first.
function resolveFollowUpSource(source) {
  const first = String(source || '').split(SOURCE_SEP)[0].trim();
  if (first === 'story-scripts.md' || first === 'study-guide.md') {
    const file = `content/${first}`;
    const doc = docOf(file);
    return { scopes: [makeScope(file, doc.lines.map((_, i) => i), `${first} (whole file)`)], file, missing: [], label: first };
  }
  if (first === 'round1-debrief.md' || first === 'Round 1 debrief') return { scopes: [debriefFactsScope()], file: DEBRIEF_FILE, missing: [], label: first };
  const { section, sub, missing } = resolveSource(source);
  if (!section) return { scopes: [], file: null, missing: [first], label: source, unresolved: true };
  return { scopes: sub ? [sub, sectionScope(section)] : [sectionScope(section)], file: section.file, missing, label: sub ? sub.label : section.text, section };
}

const EXPERIENCE_KINDS = new Set(['own-it', 'drill']);
// The common block's shape for a test no story covers: "say plainly I haven't done that exact thing".
const DISCLAIMER_RE = /\b(?:no direct story|haven'?t (?:done|run|had|seen|commissioned)|have not (?:done|run)|not something I'?ve done|never (?:run|done)|say plainly|say it straight)\b/i;
// First-person experience: a claim about work he did, not a procedure he would follow.
const EXPERIENCE_RE = /\b(?:I|we)\s+(?:ran|run|tested|found|built|proved|programmed|commissioned|did|was|were|had|have|caught|measured|set|wrote|laid|verified|corrected|owned|own|led|lead|flew|bought|pulled|installed|walked|checked|reviewed|modeled|designed|diagnosed|fixed|repaired|re-pulled|trained|treat|blew|silenced|confirmed|waited|ordered|gave|held|broke|went|saw|flagged|let|put|started|got|work|build|write)\b|\bon the (?:\w+[- ])?(?:job|site|towers|lab|campus)\b|\bmy (?:job|crew|bar|company|fix|tools?|career|own)\b/i;

const FOLLOW_UP_PAR = { drill: 20 };
const DEFAULT_FOLLOW_UP_PAR = 45;
// "Pass, or punch item?" — a prompt that ends by naming two outcomes (not multiple choice by
// decision 46, but worth a look: the beats, not the choice, are what is graded).
const TWO_OPTION_RE = /[.!]\s+([A-Za-z][\w' -]{1,30},? or [A-Za-z][\w' -]{1,30}\?)\s*$/;

// A story card's "Don't say" note is the script's own "Keep out" line (session C).
function checkDontSay(card, chain) {
  const list = Array.isArray(card.answer.dontSay) ? card.answer.dontSay : [card.answer.dontSay];
  list.forEach((d, i) => {
    const found = chain.some((s) => findWords(s, d));
    trace.push({ card: card.id, where: `dontSay[${i}]`, token: d, result: found ? 'ok' : 'none', at: found ? 'verbatim' : null });
    if (!found) reportR2({ kind: 'followup-source', card: card.id, where: `dontSay[${i}]`, token: d, detail: 'not a verbatim line of the scripts (the story\'s "Keep out" line) or the guide' });
  });
}

// An own-it or drill beat must trace to the scripts, the playbook or the debrief facts; the only
// other things it may be are the common block's disclaimer and a "how I'd run it" line from the guide.
function checkExperienceBeat(card, where, label, guideScopes) {
  const exp = experienceScope();
  const loc = locatePhrase(label, exp);
  const pct = Math.round(loc.ratio * 100);
  trace.push({ card: card.id, where, token: label, result: `${pct}% of words in the experience sources`, at: loc.snippet });
  if (loc.ratio >= 0.75) return 'traced';
  if (loc.ratio >= 0.5) {
    reviewR2({ kind: 'paraphrase', card: card.id, where, token: label, detail: `paraphrases the scripts / playbook (${pct}% of its words on one line: "${loc.snippet}")` });
    return 'traced';
  }
  // A beat that joins clauses from two script lines ("…no drawings — I pulled the configuration…"):
  // every clause of three or more content words must trace on its own.
  const clauses = label.split(/\s[—–]\s|;\s|:\s/).filter((c) => contentWords(c).length >= 3);
  if (clauses.length > 1) {
    const each = clauses.map((c) => locatePhrase(c, exp));
    if (each.every((l) => l.ratio >= 0.5)) {
      reviewR2({ kind: 'paraphrase', card: card.id, where, token: label, detail: `joins ${clauses.length} clauses from separate script lines (${each.map((l) => `${Math.round(l.ratio * 100)}%`).join(' / ')} of their words)` });
      return 'traced';
    }
  }
  if (DISCLAIMER_RE.test(label)) {
    reviewR2({ kind: 'bridge', card: card.id, where, token: label, detail: 'the "say plainly there\'s no direct story" bridge (common block) — not an experience claim' });
    return 'bridge';
  }
  let best = { ratio: 0 };
  for (const s of guideScopes) {
    const l = locatePhrase(label, s);
    if (l.ratio > best.ratio) best = { ...l, scope: s };
  }
  if (best.ratio >= 0.5) {
    if (EXPERIENCE_RE.test(label)) {
      reportR2({ kind: 'experience', card: card.id, where, token: label, detail: `reads as experience but is found only in the guide ("${best.scope.label}"), not in the scripts, the playbook or the debrief facts` });
      return 'invented';
    }
    reviewR2({ kind: 'bridge', card: card.id, where, token: label, detail: `the "how I'd run it" bridge — guide procedure from "${best.scope.label}" (${Math.round(best.ratio * 100)}% of its words), not an experience claim` });
    return 'bridge';
  }
  reportR2({ kind: 'experience', card: card.id, where, token: label, detail: `own-it / drill beat traces to neither the scripts, the playbook, the debrief facts nor the guide (${pct}% of its words on the best scripts line: "${loc.snippet}")` });
  return 'invented';
}

const beatLabel = (b) => (typeof b === 'string' ? b : b.label || b.text);
const isFillIn = (b) => typeof b !== 'string' && !!b.fillIn;

// One graded follow-up beat: facts in the chain, no bracketed item, own-it / drill traced.
// `graded`: a `number` follow-up's beats are its criterion and section — graded facts, like a
// number card's fields — so a number or reference found only outside the follow-up's source and
// the card's section is a finding, not a note (a wrong value that happens to exist elsewhere in
// the guide, "loss ≤ 2.5 psi", must not pass).
function checkFollowUpBeat(card, where, label, chain, { experience, guideScopes, home, cardScope, graded = false }) {
  if (/\[[^\]]*\]/.test(label)) reportR2({ kind: 'bracket', card: card.id, where, token: label, detail: 'a graded beat carries a bracketed (open) item — make it a fill-in' });
  const bh = bracketHit(label);
  if (bh) reportR2({ kind: 'bracket', card: card.id, where, token: label, detail: `restates a bracketed (open) line of ${bh.file} line ${bh.line}: "[${bh.text}]" — make it a fill-in` });
  checkText(card, where, label, chain, { outsideHard: graded });
  if (experience) return checkExperienceBeat(card, where, label, guideScopes);
  const loc = locatePhrase(label, home);
  if (loc.ratio < 0.5 && (loc.words || 0) >= 3) {
    const inCard = cardScope && cardScope !== home ? locatePhrase(label, cardScope) : { ratio: 0 };
    if (inCard.ratio >= 0.5) reviewR2({ kind: 'outside', card: card.id, where, token: label, detail: `the beat's words sit in the card's section "${cardScope.label}", not in the follow-up's source "${home.label}"` });
    else reviewR2({ kind: 'paraphrase', card: card.id, where, token: label, detail: `paraphrased (${Math.round(loc.ratio * 100)}% of words on one line of "${home.label}")` });
  }
  return 'ok';
}

// A number follow-up's prompt must not hand over the criterion it asks for. Numbers inside a
// reference ("NFPA 92") are the standard's name, not a criterion.
function checkNumberLeak(card, where, prompt, beats) {
  const nums = (t) => {
    const refs = extractRefPhrases(t);
    return extractTokens(t)
      .filter((x) => x.kind === 'num' && !isYear(x.value) && !refs.some((r) => x.index >= r.index && x.index < r.index + r.text.length))
      .map((x) => x.value);
  };
  const beatNums = new Set(beats.flatMap(nums));
  const leaked = [...new Set(nums(prompt).filter((v) => beatNums.has(v)))];
  if (!leaked.length) return;
  if (leaked.length >= beatNums.size) reportR2({ kind: 'followup-mc', card: card.id, where, token: leaked.join(', '), detail: 'the prompt contains every number the beats teach' });
  else reviewR2({ kind: 'leak', card: card.id, where, token: leaked.join(', '), detail: `the prompt repeats ${leaked.join(', ')} from the beats — a setup number or the answer? (check by eye)` });
}

function auditFollowUps(card, sec, sub) {
  const list = card.answer.followUps;
  if (!Array.isArray(list) || !list.length) return;
  const cardScopes = sub ? [sub, sec] : [sec];
  const guideFile = fileScope('content/study-guide.md');
  const scriptsFile = fileScope('content/story-scripts.md');
  list.forEach((f, k) => {
    const fid = f.id || `${card.id}-f${k + 1}`;
    const fk = fid.startsWith(`${card.id}-`) ? fid.slice(card.id.length + 1) : fid;
    const r = resolveFollowUpSource(f.source);
    if (r.unresolved) reportR2({ kind: 'followup-source', card: card.id, where: `${fk}.source`, token: f.source, detail: 'first segment is neither a heading in the source files nor a whole-document source' });
    for (const m of r.missing) reportR2({ kind: 'followup-source', card: card.id, where: `${fk}.source`, token: m, detail: `label not found under "${r.label}"` });
    const experience = EXPERIENCE_KINDS.has(f.kind);
    // Scope chain: the follow-up's own source → (the experience sources for own-it / drill) → the
    // card's section → the files (a hit there is a review note, as for scenario beats) → both files.
    const sectionScopes = [...r.scopes, ...(experience ? [experienceScope()] : []), ...cardScopes.filter((s) => !r.scopes.includes(s))];
    const files = r.file === 'content/story-scripts.md' ? [scriptsFile, guideFile] : [guideFile, scriptsFile];
    const chain = [...sectionScopes, ...files, allScope()];
    const home = r.scopes[r.scopes.length - 1] || sec;
    const guideScopes = [...r.scopes.filter((s) => s.file === 'content/study-guide.md'), ...cardScopes, guideFile];

    // Kind rules.
    if (f.kind === 'find-out' && !card.confirmInEdition) reportR2({ kind: 'followup-kind', card: card.id, where: `${fk}.kind`, token: f.kind, detail: 'find-out follow-ups belong only on confirmInEdition: true cards' });
    if (card.ladder && f.kind !== 'drill') reportR2({ kind: 'followup-kind', card: card.id, where: `${fk}.kind`, token: f.kind, detail: 'a ladder layer must be a drill' });
    const wantPar = FOLLOW_UP_PAR[f.kind] ?? DEFAULT_FOLLOW_UP_PAR;
    if (f.par !== wantPar) reviewR2({ kind: 'par', card: card.id, where: `${fk}.par`, token: String(f.par), detail: `${f.kind} follow-ups run ${wantPar} s elsewhere` });

    // Prompt: open recall in a peer's voice; its numbers are facts too (hypotheticals go in the allowlist).
    checkText(card, `${fk}.prompt`, f.prompt, chain);
    if (MC_RE.test(f.prompt)) reportR2({ kind: 'followup-mc', card: card.id, where: `${fk}.prompt`, token: f.prompt.match(MC_RE)[0].trim(), detail: 'prompt reads as multiple choice' });
    else if (TWO_OPTION_RE.test(f.prompt)) reviewR2({ kind: 'options', card: card.id, where: `${fk}.prompt`, token: f.prompt.match(TWO_OPTION_RE)[1].trim(), detail: 'ends by naming two outcomes — the beats are the grade, not the choice; kept as peer speech (check by eye)' });

    // Beats: fill-ins are open items (shown, never graded, never checked as fact).
    const graded = [];
    f.beats.forEach((b, i) => {
      const where = `${fk}.beats[${i}]`;
      const label = beatLabel(b);
      if (isFillIn(b)) {
        trace.push({ card: card.id, where, token: label, result: 'fill-in (not graded)', at: null });
        return;
      }
      graded.push(label);
      checkFollowUpBeat(card, where, label, chain, { experience, guideScopes, home, cardScope: sec, graded: f.kind === 'number' });
    });
    if (!graded.length) reviewR2({ kind: 'fillin', card: card.id, where: `${fk}.beats`, token: `${f.beats.length} fill-in${f.beats.length === 1 ? '' : 's'}`, detail: 'every beat is a fill-in — the layer is shown and not graded' });
    if (f.kind === 'number') checkNumberLeak(card, `${fk}.prompt`, f.prompt, graded);
  });
}

// Walkthrough cards: the beats are the guide's steps in order (common block). Each beat opens with
// the step ("Main drain baseline — record static and residual…"), then carries that level's numbers
// from elsewhere in the section (decision 80), so the step names — not the whole beats — must sit in
// the guide's order: monotone positions in the sub-label block (the list or line the source names),
// else in the section. A matrix row turned into steps has no line order to check (one table row).
function checkWalkthroughOrder(card, sec, sub) {
  const beats = card.answer.beats.filter((b) => !isFillIn(b)).map(beatLabel);
  const names = beats.map((b) => {
    const head = b.split(/\s[—–]\s|:\s|;\s/)[0];
    const n = contentWords(head).length;
    return n >= 2 || (n === 1 && head.split(/\s+/).length <= 4) ? head : b;
  });
  const scope = sub || sec;
  const located = names.map((p) => locatePhrase(p, scope));
  const rows = new Set(located.filter((l) => l.ratio >= 0.5).map((l) => l.best));
  if (rows.size === 1 && scope.lines.length && isTableRow(scope.lines[[...rows][0]].raw)) {
    reviewR2({ kind: 'coverage', card: card.id, where: 'beats', token: scope.label, detail: 'walkthrough built from one table row — cell order cannot be checked by line position, read it by eye' });
    return;
  }
  let prev = -1;
  for (let i = 0; i < located.length; i++) {
    const cands = located[i].candidates.map((c) => c.pos).sort((x, y) => x - y);
    trace.push({ card: card.id, where: `walkthrough step ${i}`, token: names[i], result: `${Math.round(located[i].ratio * 100)}% of words`, at: `positions ${cands.join('/') || '—'} in "${scope.label}"` });
    if (!cands.length || located[i].ratio < 0.5) {
      reviewR2({ kind: 'paraphrase', card: card.id, where: `beats[${i}]`, token: beats[i], detail: `walkthrough step "${names[i]}" not located in "${scope.label}" (${Math.round(located[i].ratio * 100)}% of its words) — order not checked for this beat` });
      continue;
    }
    const next = cands.find((p) => p > prev);
    if (next == null) {
      reportR2({ kind: 'walkthrough', card: card.id, where: `beats[${i}]`, token: beats[i], detail: `step "${names[i]}" comes before "${names[i - 1] ?? ''}" in "${scope.label}" — a walkthrough's beats are the guide's steps in order` });
      return;
    }
    prev = next;
  }
}

// Mock follow-ups: no source of their own. Scope = the question's chain plus, when the question
// copies a card (decision 84), that card's follow-up sources; own-it / drill layers also get the
// experience sources. Beats copied from the card are compared with the card's (a difference is a note).
function auditMockFollowUps(q, fake, linked, chain, files) {
  if (!Array.isArray(q.followUps)) return;
  const guideFile = fileScope('content/study-guide.md');
  const linkedFu = linked && Array.isArray(linked.answer.followUps) ? linked.answer.followUps : [];
  const linkedBeats = new Set(linkedFu.flatMap((lf) => lf.beats.map(beatLabel)));
  const extra = [];
  for (const lf of linkedFu) for (const s of resolveFollowUpSource(lf.source).scopes) if (!chain.includes(s) && !extra.includes(s)) extra.push(s);
  q.followUps.forEach((f, k) => {
    const fk = `followUps[${k}]`;
    const experience = EXPERIENCE_KINDS.has(f.kind);
    const sectionScopes = [...chain, ...extra, ...(experience ? [experienceScope()] : [])];
    const fchain = [...sectionScopes, ...files, allScope()];
    const home = { label: 'the related sections', lines: sectionScopes.flatMap((s) => s.lines) };
    checkText(fake, `${fk}.prompt`, f.prompt, fchain);
    if (MC_RE.test(f.prompt)) reportR2({ kind: 'mock', card: q.id, where: `${fk}.prompt`, token: f.prompt.match(MC_RE)[0].trim(), detail: 'follow-up prompt reads as multiple choice' });
    if (f.kind === 'find-out' && !(linked && linked.confirmInEdition)) reportR2({ kind: 'mock', card: q.id, where: `${fk}.kind`, token: f.kind, detail: 'find-out follow-ups belong only on confirmInEdition cards' });
    if (f.par != null) {
      const wantPar = FOLLOW_UP_PAR[f.kind] ?? DEFAULT_FOLLOW_UP_PAR;
      if (f.par !== wantPar) reviewR2({ kind: 'par', card: q.id, where: `${fk}.par`, token: String(f.par), detail: `${f.kind || 'follow-up'} layers run ${wantPar} s elsewhere` });
    }
    if (!Array.isArray(f.beats) || !f.beats.length) {
      reviewR2({ kind: 'fillin', card: q.id, where: `${fk}.beats`, token: f.prompt, detail: 'spoken follow-up without beats — asked, not graded' });
      return;
    }
    const graded = [];
    f.beats.forEach((b, i) => {
      const where = `${fk}.beats[${i}]`;
      const label = beatLabel(b);
      if (isFillIn(b)) return;
      graded.push(label);
      checkFollowUpBeat(fake, where, label, fchain, { experience, guideScopes: [...sectionScopes.filter((s) => s.file === 'content/study-guide.md'), guideFile], home, cardScope: null, graded: f.kind === 'number' });
      if (linkedFu.length && !linkedBeats.has(label)) reviewR2({ kind: 'copy', card: q.id, where, token: label, detail: `not a verbatim copy of a beat on ${linked.id}'s follow-ups (decision 84) — scoped as a mock beat instead` });
    });
    if (!graded.length) reviewR2({ kind: 'fillin', card: q.id, where: `${fk}.beats`, token: f.prompt, detail: 'every beat is a fill-in — the layer is shown and not graded' });
    if (f.kind === 'number') checkNumberLeak(fake, `${fk}.prompt`, f.prompt, graded);
  });
}

// The session B common block's coverage targets, per technical topic, plus session C's shape for
// the Interview topics. Returns one row per topic for the round-2 report.
function checkCoverageR2(cards, topics) {
  const rows = [];
  const ownItByArea = new Map();
  const problem = (id, text) => reportR2({ kind: 'coverage-r2', card: id, where: 'coverage', token: text, detail: 'session B common block (ROUND2_UPDATE_PROMPT.md)' });
  for (const t of topics) {
    const mine = cards.filter((c) => c.topicId === t.id);
    const fus = (c) => (Array.isArray(c.answer.followUps) ? c.answer.followUps : []);
    const scn = mine.filter((c) => c.type === 'scenario');
    const withFu = mine.filter((c) => fus(c).length);
    const kinds = {};
    for (const c of mine) for (const f of fus(c)) kinds[f.kind] = (kinds[f.kind] || 0) + 1;
    const r2 = mine.filter((c) => /-r\d$/.test(c.id)).map((c) => c.id);
    const walk = mine.filter((c) => c.walkthrough);
    const ladders = mine.filter((c) => c.ladder);
    ownItByArea.set(t.area, (ownItByArea.get(t.area) || 0) + (kinds['own-it'] || 0));
    const notes = [];
    for (const c of walk) {
      if (c.type !== 'scenario') problem(c.id, 'walkthrough is not a scenario card');
      if (c.par !== 120) problem(c.id, `walkthrough par is ${c.par}, the brief says 120`);
      if (fus(c).length < 1 || fus(c).length > 2) problem(c.id, `walkthrough wants 1–2 follow-ups (has ${fus(c).length})`);
    }
    if (t.area === 'Interview') {
      for (const c of ladders) {
        if (fus(c).length !== 5) problem(c.id, `drill ladder wants 5 layers (has ${fus(c).length})`);
        if (fus(c).some((f) => f.kind !== 'drill')) problem(c.id, 'drill ladder layers must all be drills');
      }
      for (const c of withFu) if (c.type === 'story' && fus(c).some((f) => f.kind !== 'drill')) problem(c.id, 'story follow-ups are drills (session C)');
      if (['I3', 'I4', 'I5', 'I6', 'I7'].includes(t.id) && !mine.some((c) => c.type === 'story' && !c.ladder && fus(c).length)) problem(t.id, "story card has no scripted follow-ups (session C: each story's \"Follow-ups, 15 seconds each\")");
      if (t.id === 'I8' && withFu.length) problem(t.id, 'the backup stories have no scripted follow-ups — leave I8 as it was');
    } else if (t.weight === 'Core') {
      for (const c of scn) {
        const n = fus(c).length;
        if (c.walkthrough) continue;
        if (n < 2) problem(c.id, `Core scenario card wants 2 follow-ups (has ${n})`);
        if (n && !fus(c).some((f) => f.kind === 'why-not' || f.kind === 'what-if')) problem(c.id, 'no why-not or what-if follow-up');
        if (c.confirmInEdition && !fus(c).some((f) => f.kind === 'find-out')) problem(c.id, 'Core confirmInEdition scenario without a find-out follow-up');
      }
      const scnFu = scn.filter((c) => fus(c).length);
      if (scnFu.length < 2) problem(t.id, `Core topic wants ≥ 2 scenario cards with follow-ups (has ${scnFu.length})`);
    } else if (t.weight === 'Support') {
      const ok = scn.filter((c) => fus(c).length >= 1 && fus(c).length <= 2);
      if (!ok.length) problem(t.id, 'Support topic wants at least one scenario card with 1–2 follow-ups');
      for (const c of scn) if (fus(c).length > 2) notes.push(`${c.id} has ${fus(c).length} follow-ups (the brief says 1–2 on Support)`);
      for (const c of scn) if (c.confirmInEdition && fus(c).length && !fus(c).some((f) => f.kind === 'find-out')) notes.push(`${c.id} is confirmInEdition without a find-out (required on Core only)`);
    } else if (t.weight === 'Light') {
      if (withFu.length || r2.length) problem(t.id, `Light topic changed (${[...withFu.map((c) => c.id), ...r2].join(', ')}) — the brief says no changes`);
    }
    for (const n of notes) reviewR2({ kind: 'coverage', card: t.id, where: 'coverage', token: n, detail: 'worth a look, not a target' });
    rows.push({ topic: t.id, area: t.area, weight: t.weight, cards: mine.length, scenario: scn.length, withFu: withFu.length, followUps: mine.reduce((n, c) => n + fus(c).length, 0), kinds, r2, walkthroughs: walk.map((c) => c.id), ladders: ladders.map((c) => c.id) });
  }
  for (const [area, n] of ownItByArea) if (area !== 'Interview' && !n) problem(area, `area "${area}" has no own-it follow-up`);
  return rows;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const SECTIONS = [
  ['facts', 'Facts that could not be located in the source'],
  ['outside', "Graded facts found only outside the card's section (fix the source label or the fact)"],
  ['hedge', 'Hedged references (confirmInEdition)'],
  ['order', "Order cards whose steps are not the guide's sequence"],
  ['story', 'Story cards whose text differs from the source'],
  ['matrix', "Matrix cells that differ from the guide's table"],
  ['mc', 'Prompts that read as multiple choice or give the answer away'],
  ['coverage', 'Topics under (or over) the per-weight card minimum'],
  ['source', 'Source labels that do not resolve'],
  ['mock', 'mock.json'],
  // Round 2 (follow-up chains); the same findings are laid out in audit-report-r2.md.
  ['experience', 'own-it / drill beats that do not trace to the scripts, the playbook or the debrief facts'],
  ['followup-kind', 'Follow-up kinds out of place (find-out off a confirmInEdition card, a non-drill ladder layer)'],
  ['bracket', 'Bracketed (open) items presented as fact'],
  ['followup-mc', 'Follow-up prompts that read as multiple choice or hand over the answer'],
  ['followup-source', 'Follow-up sources that do not resolve'],
  ['walkthrough', "Walkthrough beats out of the guide's order"],
  ['coverage-r2', 'Round-2 coverage targets (session B common block) not met'],
];

// audit-report-r2.md — the round-2 view: every check the audit session added, over every card
// with follow-ups, every -r2 card and every round deck, with the reading-pass notes always included.
const R2_SECTIONS = [
  ['facts', 'Follow-up facts (numbers, units, references, steps) not located in the source they name'],
  ['outside', "Follow-up graded facts found only outside the section"],
  ['experience', 'own-it / drill beats that do not trace to story-scripts.md, the Interview playbook or the debrief facts'],
  ['followup-kind', 'find-out follow-ups off confirmInEdition cards, non-drill ladder layers'],
  ['bracket', 'Bracketed (open) items presented as fact'],
  ['followup-mc', 'Follow-up prompts that read as multiple choice or hand over the answer'],
  ['followup-source', 'Follow-up sources that do not resolve'],
  ['walkthrough', "Walkthrough beats out of the guide's order"],
  ['coverage-r2', 'Coverage targets (session B common block, session C shape) not met'],
  ['mock', 'Round 2 / Round 3 mock decks (questions and follow-up layers)'],
];
const R2_REVIEW = [
  ['bridge', 'own-it / drill beats that are bridges, not experience (the "no direct story" line and "how I\'d run it" guide procedure) — read each one'],
  ['paraphrase', 'Beats and steps that paraphrase their source (follow-ups and their cards; checked by eye)'],
  ['outside', "Facts found outside the named source (a follow-up's beat in the card's section, a card's fact elsewhere in the files)"],
  ['unit', 'Counts whose noun is not on the same source line'],
  ['ident', 'Identifiers not in either source file'],
  ['leak', 'Number follow-ups whose prompt repeats a beat number (setup number or the answer?)'],
  ['options', 'Follow-up prompts that end by naming two outcomes ("Pass, or punch item?") — kept as peer speech, the beats are the grade'],
  ['copy', "Mock follow-up beats that are not verbatim copies of the linked card's (decision 84)"],
  ['fillin', 'Layers that are shown and not graded (every beat a fill-in, or no beats)'],
  ['par', 'Follow-ups whose par differs from the convention (45 technical, 20 drill)'],
  ['coverage', 'Coverage notes (not targets)'],
];

function writeR2Report(outPath, { cards, mock, rows, active, decisions, allowedList, stamp }) {
  const inScope = new Set(cards.filter((c) => (Array.isArray(c.answer.followUps) && c.answer.followUps.length) || /-r\d$/.test(c.id)).map((c) => c.id));
  const roundDecks = mock.decks.filter((d) => d.round);
  const roundQ = new Set(roundDecks.flatMap((d) => d.questions.map((q) => q.id)));
  const r2 = (f) => f.round2 || inScope.has(f.card) || roundQ.has(f.card);
  const mine = active.filter(r2);
  const dec = decisions.filter(r2);
  const allow = allowedList.filter(r2);
  const notes = review.filter(r2);
  const fuCards = cards.filter((c) => Array.isArray(c.answer.followUps) && c.answer.followUps.length);
  const fus = fuCards.flatMap((c) => c.answer.followUps);
  const byKind = {};
  for (const f of fus) byKind[f.kind] = (byKind[f.kind] || 0) + 1;
  const r2Cards = cards.filter((c) => /-r\d$/.test(c.id));
  const walks = cards.filter((c) => c.walkthrough);
  const ladders = cards.filter((c) => c.ladder);
  const fillIns = fus.reduce((n, f) => n + f.beats.filter(isFillIn).length, 0);
  const deckLine = (d) => `\`${d.id}\` (${d.round}) · ${d.questions.length} questions · ${d.questions.reduce((n, q) => n + (q.followUps || []).length, 0)} follow-up layers (${d.questions.reduce((n, q) => n + (q.followUps || []).filter((f) => Array.isArray(f.beats) && f.beats.length).length, 0)} graded)`;
  const out = [];
  out.push(`# ENERGIZE round-2 audit — ${stamp}`);
  out.push('');
  out.push('Generated by `node scripts/audit.js` beside `audit-report.md`. This is the round-2 view (session D of `ROUND2_UPDATE_PROMPT.md`): every card with `answer.followUps`, every `-r2` card and every mock deck with a `round`, checked against `content/study-guide.md`, `content/story-scripts.md` and the "Facts about my own work" list of `content/round1-debrief.md`.');
  out.push('');
  out.push(`**Scope.** ${fuCards.length} cards with follow-ups · ${fus.length} follow-ups (${Object.entries(byKind).map(([k, n]) => `${k} ${n}`).join(' · ')}) · ${fillIns} fill-in beats · ${r2Cards.length} \`-r2\` cards · ${walks.length} walkthroughs · ${ladders.length} drill ladders · ${roundDecks.length} round decks: ${roundDecks.map(deckLine).join('; ')}.`);
  out.push('');
  out.push(`**${mine.length} finding${mine.length === 1 ? '' : 's'}.** ${dec.length} item${dec.length === 1 ? '' : 's'} need${dec.length === 1 ? 's' : ''} your decision. ${allow.length} item${allow.length === 1 ? '' : 's'} allowlisted. ${notes.length} review note${notes.length === 1 ? '' : 's'} for the reading pass (appendix).`);
  out.push('');
  out.push('## What is checked');
  out.push('');
  out.push("- **Every follow-up beat and prompt** goes through the same fact extraction as a main answer — numbers with units, section references, identifiers, steps — and each fact must be found, verbatim or trivially reformatted, in the chain: the follow-up's `source` (a heading path, bold label, table or list number, or a whole document: `story-scripts.md`, `study-guide.md`, `round1-debrief.md`) → the experience sources for own-it / drill layers → the card's own section → the files → both files. Not found anywhere is a finding; found only outside the named source is a review note (as for scenario beats) — except in a `number` follow-up, whose numbers and references are its graded criterion: there it is a finding.");
  out.push('- **own-it and drill beats** must trace (≥ 50% of their content words on one line) to `story-scripts.md` (its "Open questions" list excluded), the guide\'s Interview playbook, or the debrief\'s "Facts about my own work" list. A beat that does not is accepted only as the common block\'s disclaimer ("say plainly there\'s no direct story…") or as a "how I\'d run it" procedure that sits in the guide and does not read as first-person experience; anything else is a finding. Every bridge is listed in the appendix for the reading pass.');
  out.push('- **find-out** layers only on `confirmInEdition: true` cards; a `ladder` card\'s layers are all drills.');
  out.push('- **Bracketed items**: a graded beat may not carry `[…]` and may not restate a bracketed (open) line of the sources (≥ 60% of its content words in one bracket). Fill-in beats (`{ "label", "fillIn": true }`) are open items — shown, never graded — and are not checked as fact.');
  out.push("- **Prompts**: no multiple choice (option markers, \"which of the following\", yes/no…); a `number` follow-up's prompt may not contain every number its beats teach.");
  out.push("- **Walkthrough cards**: the beats' positions in the card's section are monotone (the guide's steps in order).");
  out.push('- **Mock decks with a round**: each follow-up layer with beats is checked like a card follow-up, scoped to the question\'s section plus every section its topic\'s cards cite plus, when the question copies a card (`cardId`, decision 84), that card\'s follow-up sources; own-it / drill layers add the experience sources. A layer beat that is not a verbatim copy of the linked card\'s is noted.');
  out.push('- **Coverage targets** (session B common block): every Core scenario card (walkthroughs aside) has 2 follow-ups with a why-not or what-if; every Core topic has ≥ 2 scenario cards with follow-ups; every Core `confirmInEdition` scenario has a find-out; every technical area has an own-it; every Support topic has a scenario card with 1–2 follow-ups; Light topics unchanged; walkthroughs are scenario cards at par 120 with 1–2 follow-ups. Session C: the I3–I7 story cards carry drill follow-ups, the two ladders have five drill layers, I8 is untouched.');
  out.push('- **Not mechanical**: whether a beat that traces to a story line says something the story does not (a true clause with an invented tail), and whether a guide-procedure bridge is the right procedure. Those are the reading pass; the appendix lists every candidate.');
  out.push('');
  out.push(`## Needs your decision (${dec.length})`);
  out.push('');
  if (!dec.length) out.push('_none_');
  for (const f of dec) out.push(`${fmt(f)} · _${f.allowed.why}_`);
  out.push('');
  const listed = new Set();
  for (const [kind, title] of R2_SECTIONS) {
    const list = mine.filter((f) => f.kind === kind);
    list.forEach((f) => listed.add(f));
    out.push(`## ${title} (${list.length})`);
    out.push('');
    if (!list.length) out.push('_none_');
    else for (const f of list) out.push(fmt(f));
    out.push('');
  }
  const rest = mine.filter((f) => !listed.has(f));
  out.push(`## Other findings on round-2 cards (${rest.length})`);
  out.push('');
  if (!rest.length) out.push('_none_');
  else for (const f of rest) out.push(`${fmt(f)} _(${f.kind})_`);
  out.push('');
  out.push('## Coverage per topic');
  out.push('');
  out.push('| Topic | Area | Weight | Cards | Scenario | With follow-ups | Follow-ups by kind | New cards | Walkthrough / ladder |');
  out.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const r of rows) {
    const kinds = Object.entries(r.kinds).map(([k, n]) => `${k} ${n}`).join(' · ') || '—';
    out.push(`| ${r.topic} | ${r.area} | ${r.weight} | ${r.cards} | ${r.scenario} | ${r.withFu} (${r.followUps}) | ${kinds} | ${r.r2.join(', ') || '—'} | ${[...r.walkthroughs, ...r.ladders].join(', ') || '—'} |`);
  }
  out.push('');
  out.push('## Appendix — allowlisted round-2 items');
  out.push('');
  if (!allow.length) out.push('_none_');
  for (const f of allow) out.push(`${fmt(f)} · _allowed: ${f.allowed.why}_`);
  out.push('');
  out.push('## Appendix — review notes for the reading pass');
  out.push('');
  for (const [kind, title] of R2_REVIEW) {
    const list = notes.filter((f) => f.kind === kind);
    out.push(`### ${title} (${list.length})`);
    out.push('');
    if (!list.length) out.push('_none_');
    else for (const f of list) out.push(fmt(f));
    out.push('');
  }
  writeFileSync(outPath, out.join('\n'));
  return mine.length;
}

function fmt(f) {
  const tok = String(f.token).replace(/\n/g, ' ');
  return `- **${f.card}** · ${f.where} · \`${tok.length > 90 ? `${tok.slice(0, 90)}…` : tok}\` — ${f.detail}`;
}

function main() {
  const cards = JSON.parse(readFileSync(join(ROOT, 'src/data/questions.json'), 'utf8'));
  const mock = JSON.parse(readFileSync(join(ROOT, 'src/data/mock.json'), 'utf8'));
  const topics = JSON.parse(readFileSync(join(ROOT, 'content/topics.json'), 'utf8'));
  const cardsById = new Map(cards.map((c) => [c.id, c]));

  const only = opt('--card');
  for (const card of cards) if (!only || card.id === only) auditCard(card);
  let rows = [];
  if (!only) {
    const v = validateBank(cards, { topics });
    for (const w of v.warnings) if (/spec wants|card types|interviewerPhrasing/.test(w)) findings.push({ kind: 'coverage', card: w.split(':')[0].split(' ')[0], where: 'bank', token: w.split(': ')[1] || w, detail: w });
    for (const e of v.errors) findings.push({ kind: 'coverage', card: 'bank', where: 'schema', token: e, detail: 'schema error' });
    auditMock(mock, cardsById, cards);
    rows = checkCoverageR2(cards, topics);
  }

  if (only) {
    const card = cardsById.get(only);
    if (!card) {
      console.error(`No card ${only}`);
      process.exitCode = 2;
      return;
    }
    const { section, sub, missing } = resolveSource(card.source);
    console.log(`${card.id} (${card.type}) — source "${card.source}"`);
    console.log(`  section: ${section ? `${section.file} lines ${section.start + 1}–${section.end} "${section.text}"` : 'NOT FOUND'}${sub ? ` · sub-scope "${sub.label}" (${sub.lines.length} lines)` : ''}${missing.length ? ` · unresolved labels: ${missing.join(', ')}` : ''}`);
    for (const t of trace) console.log(`  ${t.result === 'ok' ? '✓' : t.result === 'none' ? '✗' : '·'} ${t.where} · ${String(t.token).slice(0, 80)} → ${t.result}${t.at ? ` (${String(t.at).slice(0, 70)})` : ''}`);
    const mine = findings.filter((f) => f.card === only);
    console.log(`\n${mine.length} finding(s)${mine.length ? ':' : ''}`);
    for (const f of mine) console.log(fmt(f) + (f.allowed ? `  [allowed: ${f.allowed.why}]` : ''));
    const rev = review.filter((f) => f.card === only);
    if (rev.length) {
      console.log(`\n${rev.length} review note(s):`);
      for (const f of rev) console.log(fmt(f));
    }
    return;
  }

  // Allowlist entries with "decision": true are not accepted facts — they are the items that need the
  // player's decision (mirrored under Open questions in PROGRESS.md) and get their own section.
  const active = findings.filter((f) => !f.allowed);
  const decisions = findings.filter((f) => f.allowed && f.allowed.decision);
  const allowedList = findings.filter((f) => f.allowed && !f.allowed.decision);
  const unused = ALLOW.filter((a) => !allowUsed.get(a));
  const stamp = new Date().toISOString().slice(0, 10);
  const out = [];
  out.push(`# ENERGIZE accuracy audit — ${stamp}`);
  out.push('');
  out.push(`Generated by \`node scripts/audit.js\`. ${cards.length} cards in \`src/data/questions.json\` and ${mock.decks.reduce((n, d) => n + d.questions.length, 0)} mock questions in \`src/data/mock.json\`, checked against \`content/study-guide.md\` and \`content/story-scripts.md\`.`);
  out.push('');
  out.push(`**${active.length} finding${active.length === 1 ? '' : 's'}.** ${decisions.length} item${decisions.length === 1 ? '' : 's'} need${decisions.length === 1 ? 's' : ''} your decision (next section). ${allowedList.length} item${allowedList.length === 1 ? '' : 's'} allowlisted in \`scripts/audit-allow.json\` (listed in the appendix).${unused.length ? ` ${unused.length} allowlist entr${unused.length === 1 ? 'y' : 'ies'} no longer match${unused.length === 1 ? 'es' : ''} anything.` : ''}`);
  out.push('');
  out.push(`## Needs your decision (${decisions.length})`);
  out.push('');
  if (!decisions.length) out.push('_none_');
  for (const f of decisions) out.push(`${fmt(f)} · _${f.allowed.why}_`);
  out.push('');
  for (const [kind, title] of SECTIONS) {
    const list = active.filter((f) => f.kind === kind);
    out.push(`## ${title} (${list.length})`);
    out.push('');
    if (!list.length) out.push('_none_');
    else for (const f of list) out.push(fmt(f));
    out.push('');
  }
  out.push('## Appendix — allowlisted items');
  out.push('');
  if (!allowedList.length) out.push('_none_');
  for (const f of allowedList) out.push(`${fmt(f)} · _allowed: ${f.allowed.why}_`);
  if (unused.length) {
    out.push('');
    out.push('Unused allowlist entries (remove them):');
    for (const a of unused) out.push(`- ${a.card} · ${a.where || '*'} · ${a.token || '*'} — ${a.why}`);
  }
  out.push('');
  if (flag('--review')) {
    out.push('## Appendix — review notes (fuzzy, informational)');
    out.push('');
    const groups = [
      ['paraphrase', 'Beats and steps that paraphrase the guide (checked by eye)'],
      ['outside', "Prompt / explanation / beat / line facts found only outside the card's section"],
      ['unit', 'Counts whose noun is not on the same source line'],
      ['ident', 'Identifiers not in either source file'],
      ['matrix', 'Matrices built from prose (no matching table)'],
      ['defect', 'Planted defect lines whose numbers all exist in the source'],
      ['hedge', 'confirmInEdition set without a hedge on the source lines'],
    ];
    for (const [kind, title] of groups) {
      const list = review.filter((f) => f.kind === kind);
      out.push(`### ${title} (${list.length})`);
      out.push('');
      if (!list.length) out.push('_none_');
      else for (const f of list) out.push(fmt(f));
      out.push('');
    }
  }
  const outPath = resolve(opt('--out', join(ROOT, 'audit-report.md')));
  writeFileSync(outPath, out.join('\n'));
  const r2Path = resolve(opt('--out-r2', join(dirname(outPath), 'audit-report-r2.md')));
  const r2Count = writeR2Report(r2Path, { cards, mock, rows, active, decisions, allowedList, stamp });
  console.log(`${active.length} finding(s), ${allowedList.length} allowlisted, ${review.length} review note(s) → ${outPath}`);
  console.log(`${r2Count} round-2 finding(s) → ${r2Path}`);
  for (const [kind, title] of SECTIONS) {
    const n = active.filter((f) => f.kind === kind).length;
    if (n) console.log(`  ${String(n).padStart(3)}  ${title}`);
  }
  process.exitCode = active.length ? 1 : 0;
}

main();
