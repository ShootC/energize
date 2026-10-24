// Grading for every card type. Pure functions: (card, response) → grade.
//
// A grade is { result: 'clean'|'slipped'|'missed', framework, note, detail,
// codeUnprompted }. `framework` only matters on a miss: true means the
// framework was right but a key number / step / reason was missing (Needs
// Improvement); false means wrong, guessed or blank (Not Ready).

export const CARD_TYPES = ['number', 'order', 'matrix', 'scenario', 'story', 'defect'];
export const SELF_GRADED = ['scenario', 'story'];
export const OUT_LOUD = ['scenario', 'story'];

export const DEFAULT_MATRIX_OPTIONS = ['●', '—', 'per BOD'];
export const DEFAULT_STORY_TIMING = { min: 90, max: 120, limit: 150 };

function grade(result, framework, note, detail, extra = {}) {
  return { result, framework: result === 'missed' ? !!framework : true, note, detail, codeUnprompted: false, ...extra };
}

// ---------- numbers ----------

// Pull the first number out of free text: "1,560 gpm" → 1560, "≤ 1.5" → 1.5.
export function parseNumber(text) {
  if (typeof text === 'number') return Number.isFinite(text) ? text : NaN;
  if (typeof text !== 'string') return NaN;
  const s = text.replace(/[−–]/g, '-').replace(/(\d),(?=\d{3}\b)/g, '$1');
  const m = s.match(/-?\d*\.?\d+(?:e-?\d+)?/i);
  return m ? Number(m[0]) : NaN;
}

// Integers must be exact and decimals are ±2% unless the field sets an
// absolute `tolerance`.
export function numberMatches(given, field) {
  const g = parseNumber(given);
  if (Number.isNaN(g)) return false;
  const v = Number(field.value);
  const eps = 1e-9;
  if (field.tolerance != null) return Math.abs(g - v) <= Number(field.tolerance) + eps;
  if (Number.isInteger(v)) return Math.abs(g - v) <= eps;
  return Math.abs(g - v) <= Math.abs(v) * 0.02 + eps;
}

export function normalizeText(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[&+]/g, ' and ')
    .replace(/[^a-z0-9.%/ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function textMatches(given, field) {
  const g = normalizeText(given);
  if (!g) return false;
  return [field.value, ...(field.aliases || [])].some((a) => normalizeText(a) === g);
}

export function fieldMatches(given, field) {
  return typeof field.value === 'string' ? textMatches(given, field) : numberMatches(given, field);
}

// ---------- code references ----------

const CODE_STOPWORDS = new Set(['nfpa', 'section', 'sect', 'sec', 'table', 'tbl', 'chapter', 'ch', 'para', 'paragraph', 'standard', 'std', 'no', 'of', 'the', 'and', 'per']);

export function codeTokens(s) {
  let t = String(s ?? '').toLowerCase();
  t = t.replace(/§/g, ' ');
  t = t.replace(/data\s*sheet/g, ' ds ');
  // Edition years: "13-2022", "(2022)", "2022 edition".
  t = t.replace(/[-–]\s*(19|20)\d\d\b/g, ' ');
  t = t.replace(/\((19|20)\d\d\)/g, ' ');
  t = t.replace(/\b(19|20)\d\d\s*(ed\.?|edition)\b/g, ' ');
  t = t.replace(/([a-z])(\d)/g, '$1 $2').replace(/(\d)([a-z])/g, '$1 $2');
  return t
    .replace(/[^a-z0-9.\-]+/g, ' ')
    .split(' ')
    .map((x) => x.replace(/^[.\-]+|[.\-]+$/g, ''))
    .filter((x) => x && !CODE_STOPWORDS.has(x));
}

// Loose code-section match: "NFPA 13 29.2.2", "13 §29.2.2" and "29.2.2" all
// match "NFPA 13 §29.2.2"; "NFPA 25 29.2.2" does not.
export function codeRefMatches(given, expected, aliases = []) {
  const g = codeTokens(given);
  if (!g.length || !expected) return false;
  const candidates = [expected, ...aliases].map(codeTokens).filter((c) => c.length);
  if (candidates.some((c) => c.length === g.length && c.every((x, i) => x === g[i]))) return true;
  const exp = codeTokens(expected);
  const key = exp[exp.length - 1];
  if (!g.includes(key)) return false;
  if (g.length >= 2 && exp.length >= 2 && g[0] !== key) {
    const standards = new Set(candidates.map((c) => c[0]));
    if (!standards.has(g[0])) return false;
  }
  return true;
}

// ---------- card types ----------

export function gradeNumber(card, response = {}) {
  const fields = card.answer.fields;
  const given = response.fields || [];
  const fieldResults = fields.map((f, i) => ({
    label: f.label,
    expected: f.value,
    given: given[i] ?? '',
    ok: fieldMatches(given[i] ?? '', f),
  }));
  const codeRef = card.answer.codeRef || null;
  const code = codeRef
    ? { expected: codeRef, given: response.codeRef ?? '', ok: codeRefMatches(response.codeRef ?? '', codeRef, card.answer.codeRefAliases) }
    : null;

  const items = fieldResults.length + (code ? 1 : 0);
  const wrongFields = fieldResults.filter((f) => !f.ok);
  const wrong = wrongFields.length + (code && !code.ok ? 1 : 0);
  const right = items - wrong;
  const missedLabels = [...wrongFields.map((f) => f.label), ...(code && !code.ok ? ['code section'] : [])];
  const detail = { fields: fieldResults, code };

  if (wrong === 0) return grade('clean', true, 'clean', detail);
  // One detail slipped — unless that one detail is the card's only number.
  if (wrong === 1 && (wrongFields.length === 0 || fields.length >= 2)) {
    return grade('slipped', true, `slipped: ${missedLabels.join(', ')}`, detail);
  }
  return grade('missed', right * 2 >= items, `missed: ${missedLabels.join(', ')}`, detail);
}

// Minimum number of swaps that turns `perm` into the identity.
export function swapDistance(perm) {
  const seen = new Array(perm.length).fill(false);
  let cycles = 0;
  for (let i = 0; i < perm.length; i++) {
    if (seen[i]) continue;
    cycles++;
    for (let j = i; !seen[j]; j = perm[j]) seen[j] = true;
  }
  return perm.length - cycles;
}

// Longest increasing subsequence: how many steps are already in relative order.
export function longestInOrder(seq) {
  const tails = [];
  for (const x of seq) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = x;
  }
  return tails.length;
}

// response.order = the original step indices in the order the player placed them.
export function gradeOrder(card, response = {}) {
  const n = card.answer.steps.length;
  const order = response.order || [];
  const isPerm = order.length === n && new Set(order).size === n && order.every((x) => Number.isInteger(x) && x >= 0 && x < n);
  if (!isPerm) return grade('missed', false, 'missed: order incomplete', { order, swaps: null });
  const swaps = swapDistance(order);
  const inOrder = longestInOrder(order);
  const detail = { order, swaps, inOrder, misplaced: order.map((x, i) => x !== i) };
  if (swaps === 0) return grade('clean', true, 'clean', detail);
  if (swaps === 1) return grade('slipped', true, 'slipped: one swap in the order', detail);
  const out = order.filter((x, i) => x !== i).length;
  return grade('missed', inOrder >= Math.ceil((2 * n) / 3), `missed: ${out} of ${n} steps out of place`, detail);
}

// An untouched cell is '' and never matches — "must not happen" has to be
// asserted, not defaulted.
export function normalizeCell(v) {
  const s = String(v ?? '').trim().toLowerCase();
  if (s === '') return '';
  if (s === '●' || s === '•' || s === 'x' || s === 'yes') return '●';
  if (s === '—' || s === '-' || s === '–' || s === 'no') return '—';
  if (s.replace(/\s+/g, ' ') === 'per bod' || s === 'bod') return 'per BOD';
  return String(v).trim();
}

export function gradeMatrix(card, response = {}) {
  const { cells, prefilled = [] } = card.answer.grid;
  const given = response.cells || [];
  const fixed = new Set(prefilled.map(([r, c]) => `${r},${c}`));
  const results = cells.map((row, r) =>
    row.map((expected, c) => {
      const g = given[r]?.[c];
      return { expected, given: g ?? null, ok: fixed.has(`${r},${c}`) || normalizeCell(g) === normalizeCell(expected), graded: !fixed.has(`${r},${c}`) };
    }),
  );
  const graded = results.flat().filter((x) => x.graded);
  const wrong = graded.filter((x) => !x.ok);
  const wrongBlank = wrong.filter((x) => normalizeCell(x.expected) === '—').length;
  const detail = { cells: results, wrong: wrong.length, wrongBlank, total: graded.length };
  if (wrong.length === 0) return grade('clean', true, 'clean', detail);
  const note = `${wrong.length} cell${wrong.length > 1 ? 's' : ''} wrong${wrongBlank ? `, ${wrongBlank} should not happen` : ''}`;
  if (wrong.length === 1) return grade('slipped', true, `slipped: ${note}`, detail);
  return grade('missed', wrong.length <= Math.floor(graded.length * 0.2), `missed: ${note}`, detail);
}

export function beatLabel(beat) {
  return typeof beat === 'string' ? beat : beat.label || beat.text || '';
}

export function beatKind(beat) {
  if (typeof beat !== 'string' && beat.kind) return beat.kind;
  const l = beatLabel(beat).toLowerCase();
  if (/^lesson/.test(l)) return 'lesson';
  if (/^(a )?number/.test(l)) return 'number';
  if (/^hook/.test(l)) return 'hook';
  if (/^decision/.test(l)) return 'decision';
  return 'beat';
}

// Beats marked fillIn are bracketed, still-open items: shown, never graded.
function gradedBeats(beats) {
  return beats.map((b, i) => ({ b, i })).filter(({ b }) => !(typeof b !== 'string' && b.fillIn));
}

// Self-graded: response = { hits: [bool per beat], saidNumber, saidCode }.
export function gradeScenario(card, response = {}) {
  const beats = gradedBeats(card.answer.beats);
  const hits = response.hits || [];
  const hit = beats.filter(({ i }) => hits[i]).length;
  const requiresNumber = card.answer.requiresNumber !== false;
  const requiresCode = !!card.answer.codeRef;
  const misses = [];
  const beatMisses = beats.length - hit;
  if (beatMisses) misses.push(`${beatMisses} beat${beatMisses > 1 ? 's' : ''} missed`);
  if (requiresNumber && !response.saidNumber) misses.push('no number');
  if (requiresCode && !response.saidCode) misses.push('no code section');
  const detail = { hit, beats: beats.length, requiresNumber, requiresCode };
  const extra = { codeUnprompted: requiresCode && !!response.saidCode };
  if (misses.length === 0) return grade('clean', true, 'clean', detail, extra);
  const missing = beatMisses + (requiresNumber && !response.saidNumber ? 1 : 0) + (requiresCode && !response.saidCode ? 1 : 0);
  if (missing === 1) return grade('slipped', true, `slipped: ${misses.join(', ')}`, detail, extra);
  return grade('missed', hit >= Math.ceil(beats.length / 2), `missed: ${misses.join(', ')}`, detail, extra);
}

// Self-graded and timed: response = { hits: [bool per beat], seconds }.
// Clean = every beat inside the window (default 90–120 s). Over the window or
// one beat short = slipped. Past the limit (150 s) or no lesson = missed.
export function gradeStory(card, response = {}) {
  const timing = { ...DEFAULT_STORY_TIMING, ...(card.answer.timing || {}) };
  const beats = gradedBeats(card.answer.beats);
  const hits = response.hits || [];
  const hit = beats.filter(({ i }) => hits[i]).length;
  const missedBeats = beats.filter(({ i }) => !hits[i]);
  const seconds = response.seconds;
  const timed = typeof seconds === 'number';
  const outOfWindow = timed && (seconds < timing.min || seconds > timing.max);
  const overLimit = timed && seconds > timing.limit;
  const noLesson = missedBeats.some(({ b }) => beatKind(b) === 'lesson');
  const detail = { hit, beats: beats.length, seconds: timed ? seconds : null, timing };

  const notes = missedBeats.map(({ b }) => `no ${beatKind(b) === 'beat' ? 'beat' : beatKind(b)}`);
  if (timed && seconds < timing.min) notes.push(`short at ${Math.round(seconds)} s`);
  if (timed && seconds > timing.max) notes.push(`long at ${Math.round(seconds)} s`);
  const note = notes.join(', ');

  const framework = hit >= Math.ceil(beats.length / 2);
  if (overLimit || noLesson) return grade('missed', framework, `missed: ${note}`, detail);
  const problems = missedBeats.length + (outOfWindow ? 1 : 0);
  if (problems === 0) return grade('clean', true, 'clean', detail);
  if (problems === 1) return grade('slipped', true, `slipped: ${note}`, detail);
  return grade('missed', framework, `missed: ${note}`, detail);
}

// response = { index } — the line the player tapped and confirmed.
export function gradeDefect(card, response = {}) {
  const ok = response.index === card.answer.defectIndex;
  const detail = { given: response.index ?? null, expected: card.answer.defectIndex };
  return ok ? grade('clean', true, 'clean', detail) : grade('missed', false, 'missed the planted defect', detail);
}

const GRADERS = {
  number: gradeNumber,
  order: gradeOrder,
  matrix: gradeMatrix,
  scenario: gradeScenario,
  story: gradeStory,
  defect: gradeDefect,
};

export function gradeCard(card, response) {
  const g = GRADERS[card.type];
  if (!g) throw new Error(`No grader for card type ${JSON.stringify(card.type)}`);
  return g(card, response);
}
