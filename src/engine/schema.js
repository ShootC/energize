// questions.json / mock.json schema. Used by validate.js, build.js and tests.
// Errors break the build; warnings are content-quality nudges (Phase 2/4).

import { CARD_TYPES, CHAIN_TYPES, DEFAULT_MATRIX_OPTIONS, FOLLOW_UP_KINDS, normalizeCell } from './grader.js';

export const TYPE_ABBR = { number: 'num', order: 'ord', matrix: 'mat', scenario: 'scn', story: 'sty', defect: 'def' };
// Round-2 cards carry an -r2 suffix (P5-scn-04-r2); later rounds -r3 and so on.
export const ID_RE = /^([A-Z]\d{1,2})-(num|ord|mat|scn|sty|def)-(\d{2})(-r\d)?$/;
export const SOURCE_SEP = ' › ';
export const CARD_MINIMUMS = { Core: [6, 10], Support: [4, 6], Light: [2, 3] };
export const MIN_TYPES_CORE = 3;
export const WALKTHROUGH_PAR = 120;
// Sources that are not a heading in the guide or the scripts but are allowed as the first
// segment: the debrief cards (GAME_SPEC_ROUND2 §6), and whole files for a follow-up whose
// beats draw on a document rather than one section.
export const EXTRA_SOURCES = ['Round 1 debrief', 'study-guide.md', 'story-scripts.md', 'round1-debrief.md'];
export const MOCK_ROUNDS = ['r2', 'r3'];
export const MOCK_KINDS = ['technical', 'values', 'intro', 'experience', 'close'];

const CARD_KEYS = ['id', 'topicId', 'type', 'prompt', 'interviewerPhrasing', 'answer', 'hook', 'source', 'par', 'confirmInEdition', 'walkthrough', 'ladder'];
const FOLLOW_UP_KEYS = ['id', 'kind', 'prompt', 'beats', 'source', 'par'];
const MULTIPLE_CHOICE = /(^|[\s(])[A-D]\)\s|\(a\)\s|\bA\.\s.*\bB\.\s|which of the following/i;

const isStr = (x) => typeof x === 'string' && x.trim().length > 0;
const isNum = (x) => typeof x === 'number' && Number.isFinite(x);

// The first segment of a `source` must be a heading in study-guide.md or
// story-scripts.md (later segments may be sub-headings, bold labels or "table").
export function sourceHeading(source) {
  return String(source || '').split(SOURCE_SEP)[0].trim();
}

function sourceKnown(source, headings) {
  const first = sourceHeading(source);
  return !headings || headings.has(first) || EXTRA_SOURCES.includes(first);
}

// answer.followUps on a scenario or story card: [{ id: <cardId>-f<n>, kind, prompt, beats, source, par }].
function checkFollowUps(card, where, errors) {
  const list = card.answer.followUps;
  if (list == null) return;
  if (!Array.isArray(list)) return errors.push(`${where}: answer.followUps must be an array`);
  if (!CHAIN_TYPES.includes(card.type)) errors.push(`${where}: answer.followUps only on scenario and story cards`);
  const seen = new Set();
  list.forEach((f, k) => {
    const fw = `${where} follow-up ${k + 1}`;
    if (!f || typeof f !== 'object') return errors.push(`${fw}: not an object`);
    for (const key of Object.keys(f)) if (!FOLLOW_UP_KEYS.includes(key)) errors.push(`${fw}: unknown key "${key}"`);
    if (!isStr(f.id) || !new RegExp(`^${String(card.id).replace(/[-]/g, '\\-')}-f\\d+$`).test(f.id)) errors.push(`${fw}: id must be ${card.id}-f<n>`);
    else if (seen.has(f.id)) errors.push(`${fw}: duplicate follow-up id ${f.id}`);
    seen.add(f.id);
    if (!FOLLOW_UP_KINDS.includes(f.kind)) errors.push(`${fw}: kind must be one of ${FOLLOW_UP_KINDS.join(', ')}`);
    if (!isStr(f.prompt)) errors.push(`${fw}: prompt is required`);
    else if (MULTIPLE_CHOICE.test(f.prompt)) errors.push(`${fw}: prompt reads as multiple choice — follow-ups are open recall`);
    if (!Array.isArray(f.beats) || !f.beats.length) errors.push(`${fw}: beats needs at least one beat`);
    else
      f.beats.forEach((b, i) => {
        if (typeof b === 'string') {
          if (!isStr(b)) errors.push(`${fw}: beats[${i}] is empty`);
        } else if (!b || typeof b !== 'object' || !isStr(b.label)) errors.push(`${fw}: beats[${i}] needs a label`);
      });
    if (!isStr(f.source)) errors.push(`${fw}: source is required`);
    if (!isNum(f.par) || f.par <= 0) errors.push(`${fw}: par (seconds) must be a positive number`);
    if (f.kind === 'find-out' && !card.confirmInEdition) errors.push(`${fw}: find-out follow-ups only on confirmInEdition cards`);
    if (card.ladder && f.kind !== 'drill') errors.push(`${fw}: ladder cards take drill follow-ups only`);
  });
}

function checkBeats(beats, where, errors, { objects = false } = {}) {
  if (!Array.isArray(beats) || beats.length < 2) return errors.push(`${where}: answer.beats needs at least 2 beats`);
  beats.forEach((b, i) => {
    if (typeof b === 'string') {
      if (objects) errors.push(`${where}: answer.beats[${i}] must be an object {label, quote?, kind?, fillIn?}`);
      else if (!isStr(b)) errors.push(`${where}: answer.beats[${i}] is empty`);
      return;
    }
    if (!b || typeof b !== 'object' || !isStr(b.label || b.text)) errors.push(`${where}: answer.beats[${i}] needs a label`);
    if (b && b.kind && !['hook', 'decision', 'number', 'lesson', 'beat'].includes(b.kind)) errors.push(`${where}: answer.beats[${i}].kind must be hook|decision|number|lesson|beat`);
  });
}

export function validateCard(card, { topicIds = null, headings = null } = {}) {
  const errors = [];
  const warnings = [];
  const where = card && card.id ? card.id : '(card without id)';
  if (!card || typeof card !== 'object' || Array.isArray(card)) return { errors: [`${where}: not an object`], warnings };

  for (const k of Object.keys(card)) if (!CARD_KEYS.includes(k)) errors.push(`${where}: unknown key "${k}"${k === 'codeRef' ? ' (codeRef lives in answer.codeRef)' : ''}`);
  if (!isStr(card.id)) errors.push(`${where}: id is required`);
  if (!CARD_TYPES.includes(card.type)) errors.push(`${where}: type must be one of ${CARD_TYPES.join(', ')}`);
  if (!isStr(card.topicId)) errors.push(`${where}: topicId is required`);
  else if (topicIds && !topicIds.has(card.topicId)) errors.push(`${where}: topicId ${card.topicId} is not in content/topics.json`);

  const m = isStr(card.id) ? card.id.match(ID_RE) : null;
  if (isStr(card.id) && !m) errors.push(`${where}: id must look like P2-num-01 (<topicId>-<num|ord|mat|scn|sty|def>-<2 digits>)`);
  if (m && card.topicId && m[1] !== card.topicId) errors.push(`${where}: id prefix ${m[1]} ≠ topicId ${card.topicId}`);
  if (m && CARD_TYPES.includes(card.type) && m[2] !== TYPE_ABBR[card.type]) errors.push(`${where}: id says ${m[2]} but type is ${card.type} (${TYPE_ABBR[card.type]})`);

  if (!isStr(card.prompt)) errors.push(`${where}: prompt is required`);
  if (card.interviewerPhrasing != null && !isStr(card.interviewerPhrasing)) errors.push(`${where}: interviewerPhrasing must be a non-empty string when present`);
  if (!isStr(card.hook)) errors.push(`${where}: hook is required`);
  if (!isStr(card.source)) errors.push(`${where}: source is required`);
  else if (!sourceKnown(card.source, headings)) errors.push(`${where}: source heading "${sourceHeading(card.source)}" is not a heading in study-guide.md or story-scripts.md`);
  if (!isNum(card.par) || card.par <= 0) errors.push(`${where}: par (seconds) must be a positive number`);
  if (card.confirmInEdition != null && typeof card.confirmInEdition !== 'boolean') errors.push(`${where}: confirmInEdition must be true or false`);
  if (card.walkthrough != null) {
    if (typeof card.walkthrough !== 'boolean') errors.push(`${where}: walkthrough must be true or false`);
    else if (card.walkthrough && card.type !== 'scenario') errors.push(`${where}: walkthrough only on scenario cards`);
    else if (card.walkthrough && card.par !== WALKTHROUGH_PAR) warnings.push(`${where}: walkthrough cards run par ${WALKTHROUGH_PAR} (has ${card.par})`);
  }
  if (card.ladder != null) {
    if (typeof card.ladder !== 'boolean') errors.push(`${where}: ladder must be true or false`);
    else if (card.ladder && card.type !== 'story') errors.push(`${where}: ladder only on story cards`);
  }

  const a = card.answer;
  if (!a || typeof a !== 'object') {
    errors.push(`${where}: answer is required`);
    return { errors, warnings };
  }
  if (!isStr(a.explanation)) errors.push(`${where}: answer.explanation is required`);
  if (a.codeRef != null && !isStr(a.codeRef)) errors.push(`${where}: answer.codeRef must be a string or null`);
  if (a.codeRefAliases != null && (!Array.isArray(a.codeRefAliases) || !a.codeRefAliases.every(isStr))) errors.push(`${where}: answer.codeRefAliases must be an array of strings`);
  if (card.confirmInEdition && isStr(a.codeRef) && /§|\d+\.\d+/.test(a.codeRef)) {
    errors.push(`${where}: confirmInEdition cards take the standard name only in codeRef (no section number): ${a.codeRef}`);
  }
  checkFollowUps(card, where, errors);
  if (a.dontSay != null && !isStr(a.dontSay) && !(Array.isArray(a.dontSay) && a.dontSay.length && a.dontSay.every(isStr))) errors.push(`${where}: answer.dontSay must be a string or an array of strings`);

  switch (card.type) {
    case 'number': {
      if (!('codeRef' in a)) errors.push(`${where}: number cards must set answer.codeRef (null if the guide gives none)`);
      if (!Array.isArray(a.fields) || !a.fields.length) errors.push(`${where}: answer.fields needs at least one field`);
      else
        a.fields.forEach((f, i) => {
          if (!f || !isStr(f.label)) errors.push(`${where}: answer.fields[${i}].label is required`);
          if (!f || !(isNum(f.value) || isStr(f.value))) errors.push(`${where}: answer.fields[${i}].value must be a number (or a string for a word answer)`);
          if (f && f.tolerance != null && (!isNum(f.tolerance) || f.tolerance < 0)) errors.push(`${where}: answer.fields[${i}].tolerance must be ≥ 0`);
          if (f && f.aliases != null && (!Array.isArray(f.aliases) || !f.aliases.every(isStr))) errors.push(`${where}: answer.fields[${i}].aliases must be strings`);
        });
      if (isStr(a.codeRef) && !(a.codeRefAliases || []).length) warnings.push(`${where}: add 3–5 codeRefAliases`);
      break;
    }
    case 'order': {
      if (!Array.isArray(a.steps) || a.steps.length < 3 || !a.steps.every(isStr)) errors.push(`${where}: answer.steps needs at least 3 non-empty strings`);
      else {
        if (a.steps.length < 4 || a.steps.length > 8) warnings.push(`${where}: order cards should have 4–8 steps (has ${a.steps.length})`);
        if (new Set(a.steps).size !== a.steps.length) errors.push(`${where}: answer.steps has duplicates`);
      }
      break;
    }
    case 'matrix': {
      const g = a.grid;
      if (!g || !Array.isArray(g.inputs) || !Array.isArray(g.outputs) || !Array.isArray(g.cells)) {
        errors.push(`${where}: answer.grid needs inputs[], outputs[] and cells[][]`);
        break;
      }
      const options = g.options || DEFAULT_MATRIX_OPTIONS;
      const allowed = new Set(options.map(normalizeCell));
      if (g.cells.length !== g.inputs.length) errors.push(`${where}: grid.cells has ${g.cells.length} rows for ${g.inputs.length} inputs`);
      g.cells.forEach((row, r) => {
        if (!Array.isArray(row) || row.length !== g.outputs.length) errors.push(`${where}: grid.cells[${r}] must have ${g.outputs.length} cells`);
        else row.forEach((v, c) => {
          if (!allowed.has(normalizeCell(v))) errors.push(`${where}: grid.cells[${r}][${c}] = ${JSON.stringify(v)} is not one of ${options.join(' / ')}`);
        });
      });
      if (g.notes != null && (!Array.isArray(g.notes) || g.notes.length !== g.inputs.length)) errors.push(`${where}: grid.notes must mirror grid.cells (use "" for no note)`);
      if (g.prefilled != null && (!Array.isArray(g.prefilled) || !g.prefilled.every((p) => Array.isArray(p) && p.length === 2))) errors.push(`${where}: grid.prefilled must be [[row, col], …]`);
      break;
    }
    case 'scenario':
      checkBeats(a.beats, where, errors);
      if (a.requiresNumber != null && typeof a.requiresNumber !== 'boolean') errors.push(`${where}: answer.requiresNumber must be boolean`);
      break;
    case 'story': {
      checkBeats(a.beats, where, errors, { objects: true });
      if (!isStr(a.script)) errors.push(`${where}: answer.script (verbatim from story-scripts.md) is required`);
      const t = a.timing;
      if (t != null && (!isNum(t.min) || !isNum(t.max) || !isNum(t.limit) || !(t.min <= t.max && t.max <= t.limit))) errors.push(`${where}: answer.timing must be {min ≤ max ≤ limit} in seconds`);
      if (Array.isArray(a.beats) && !a.beats.some((b) => b && b.kind === 'lesson') && !t) warnings.push(`${where}: no beat has kind "lesson" — the no-lesson rule can't fire`);
      break;
    }
    case 'defect': {
      if (!Array.isArray(a.lines) || !a.lines.every(isStr) || a.lines.length < 3) errors.push(`${where}: answer.lines needs at least 3 lines`);
      else {
        if (a.lines.length < 6 || a.lines.length > 8) warnings.push(`${where}: defect scripts should be 6–8 lines (has ${a.lines.length})`);
        if (!Number.isInteger(a.defectIndex) || a.defectIndex < 0 || a.defectIndex >= a.lines.length) errors.push(`${where}: answer.defectIndex must index into answer.lines`);
      }
      break;
    }
    default:
      break;
  }
  return { errors, warnings };
}

// Whole-bank checks: per-card checks, unique ids, and per-topic coverage
// against spec §7.4 (reported as warnings — the bank is written in parts).
export function validateBank(cards, { topics = null, headings = null } = {}) {
  const errors = [];
  const warnings = [];
  if (!Array.isArray(cards)) return { errors: ['questions.json must be a JSON array of cards'], warnings, counts: {} };
  const topicIds = topics ? new Set(topics.map((t) => t.id)) : null;
  const seen = new Set();
  for (const c of cards) {
    const r = validateCard(c, { topicIds, headings });
    errors.push(...r.errors);
    warnings.push(...r.warnings);
    if (c && c.id) {
      if (seen.has(c.id)) errors.push(`${c.id}: duplicate id`);
      seen.add(c.id);
    }
  }
  const counts = {};
  for (const c of cards) if (c && c.topicId) {
    counts[c.topicId] ??= { total: 0, types: {}, interviewer: 0 };
    counts[c.topicId].total++;
    counts[c.topicId].types[c.type] = (counts[c.topicId].types[c.type] || 0) + 1;
    if (c.interviewerPhrasing) counts[c.topicId].interviewer++;
  }
  if (topics && cards.length) {
    for (const t of topics) {
      const n = counts[t.id];
      if (!n) continue; // topic not written yet — another session's job
      const [lo, hi] = CARD_MINIMUMS[t.weight];
      if (n.total < lo || n.total > hi) warnings.push(`${t.id} (${t.weight}): ${n.total} cards, spec wants ${lo}–${hi}`);
      if (t.weight === 'Core' && Object.keys(n.types).length < MIN_TYPES_CORE) warnings.push(`${t.id} (Core): ${Object.keys(n.types).length} card types, spec wants ≥ ${MIN_TYPES_CORE}`);
      if (!n.interviewer) warnings.push(`${t.id}: no card has interviewerPhrasing`);
    }
  }
  return { errors, warnings, counts };
}

// mock.json: { decks: [ { id, title, round?, questions: [ { id, kind, prompt,
// followUp | followUps[], par, beats, source, topicId?, cardId? } ] } ] }.
// The v1 decks (no round) are 5 questions, 2 technical / 3 values, one spoken followUp
// each. Round decks (round: r2 | r3, GAME_SPEC_ROUND2 §7) mix intro / technical /
// experience / values / close questions; followUps[] = { prompt, beats?, kind?, par? },
// graded as layers when they carry beats.
function checkMockFollowUps(q, qw, errors) {
  if (q.followUps == null) return;
  if (!Array.isArray(q.followUps)) return errors.push(`${qw}: followUps must be an array`);
  q.followUps.forEach((f, k) => {
    const fw = `${qw} follow-up ${k + 1}`;
    if (!f || typeof f !== 'object') return errors.push(`${fw}: not an object`);
    if (!isStr(f.prompt)) errors.push(`${fw}: prompt is required`);
    else if (MULTIPLE_CHOICE.test(f.prompt)) errors.push(`${fw}: prompt reads as multiple choice`);
    if (f.kind != null && !FOLLOW_UP_KINDS.includes(f.kind)) errors.push(`${fw}: kind must be one of ${FOLLOW_UP_KINDS.join(', ')}`);
    if (f.beats != null && (!Array.isArray(f.beats) || !f.beats.length || !f.beats.every((b) => isStr(typeof b === 'string' ? b : b && b.label)))) errors.push(`${fw}: beats must be a non-empty list of beats`);
    if (f.par != null && (!isNum(f.par) || f.par < 10 || f.par > 120)) errors.push(`${fw}: par must be 10–120 seconds`);
  });
}

export function validateMock(mock, { topics = null, headings = null } = {}) {
  const errors = [];
  const warnings = [];
  if (!mock || typeof mock !== 'object' || !Array.isArray(mock.decks)) return { errors: ['mock.json must be an object with decks[]'], warnings };
  const topicIds = topics ? new Set(topics.map((t) => t.id)) : null;
  const ids = new Set();
  mock.decks.forEach((d, di) => {
    const dw = d && d.id ? d.id : `decks[${di}]`;
    if (!d || !isStr(d.id) || !isStr(d.title)) errors.push(`${dw}: deck needs id and title`);
    if (d && d.round != null && !MOCK_ROUNDS.includes(d.round)) errors.push(`${dw}: round must be ${MOCK_ROUNDS.join(' or ')}`);
    if (!d || !Array.isArray(d.questions) || !d.questions.length) return errors.push(`${dw}: deck needs questions[]`);
    const roundDeck = d.round != null;
    if (!roundDeck) {
      if (d.questions.length !== 5) warnings.push(`${dw}: spec wants 5 questions (has ${d.questions.length})`);
      const tech = d.questions.filter((q) => q && q.kind === 'technical').length;
      if (tech !== 2) warnings.push(`${dw}: spec mix is 2 technical / 3 values (has ${tech} technical)`);
    }
    d.questions.forEach((q, qi) => {
      const qw = `${dw} q${qi + 1}${q && q.id ? ` (${q.id})` : ''}`;
      if (!q || typeof q !== 'object') return errors.push(`${qw}: not an object`);
      if (!isStr(q.id)) errors.push(`${qw}: id is required`);
      else if (ids.has(q.id)) errors.push(`${qw}: duplicate id`);
      ids.add(q.id);
      const kinds = roundDeck ? MOCK_KINDS : ['technical', 'values'];
      if (!kinds.includes(q.kind)) errors.push(`${qw}: kind must be ${kinds.join(' | ')}`);
      if (!isStr(q.prompt)) errors.push(`${qw}: prompt is required`);
      const needsFollowUp = !roundDeck || !['intro', 'close'].includes(q.kind);
      if (q.followUp != null && !isStr(q.followUp)) errors.push(`${qw}: followUp must be a non-empty string`);
      if (needsFollowUp && !isStr(q.followUp) && !(Array.isArray(q.followUps) && q.followUps.length)) errors.push(`${qw}: needs followUp or followUps`);
      checkMockFollowUps(q, qw, errors);
      if (!isNum(q.par) || q.par < 60 || q.par > 150) errors.push(`${qw}: par must be seconds (90–120 typical)`);
      checkBeats(q.beats, qw, errors);
      if (!isStr(q.source)) errors.push(`${qw}: source is required`);
      else if (!sourceKnown(q.source, headings)) errors.push(`${qw}: source heading "${sourceHeading(q.source)}" not found`);
      if (q.topicId != null && topicIds && !topicIds.has(q.topicId)) errors.push(`${qw}: unknown topicId ${q.topicId}`);
    });
  });
  return { errors, warnings };
}
