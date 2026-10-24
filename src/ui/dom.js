// Tiny DOM helpers shared by every screen.

const SVG_NS = 'http://www.w3.org/2000/svg';

function setAttrs(el, attrs, isSvg) {
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') isSvg ? el.setAttribute('class', v) : (el.className = v);
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'style' && typeof v === 'object') {
      for (const [p, val] of Object.entries(v)) {
        if (p.startsWith('--')) el.style.setProperty(p, val);
        else el.style[p] = val;
      }
    } else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
}

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  setAttrs(el, attrs, false);
  append(el, children);
  return el;
}

// SVG twin of h().
export function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  setAttrs(el, attrs, true);
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function mount(root, ...children) {
  root.replaceChildren();
  append(root, children);
  return root;
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// "Needs Improvement" → "r-needs-improvement" (the pill / colour class).
export function ratingClass(rating) {
  return `r-${String(rating || 'Not Tested').toLowerCase().replace(/\s+/g, '-')}`;
}

export function pill(rating, text = rating) {
  return h('span', { class: `pill ${ratingClass(rating)}` }, text);
}

// Wrap numbers in <mark> and [bracketed] open items in fill-in chips.
export function highlightScript(text) {
  return escapeHtml(text)
    .split('\n\n')
    .map((p) =>
      `<p>${p
        .replace(/\[([^\]]+)\]/g, '<span class="fill-in" title="Still open — fill in before you say it">fill in: $1</span>')
        .replace(/(?<![\w-])(~?\d[\d,.]*\s?(?:%|s\b|h\b|psi\b|V\b)?)/g, '<mark>$1</mark>')
        .replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|twenty|hundred|thousand)\b/gi, '<mark>$1</mark>')}</p>`,
    )
    .join('');
}

export function vibrate(enabled, pattern = 15) {
  try {
    if (enabled && navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* not supported */
  }
}

// A soft two-note chime on a clean card (Settings → Sound). Web Audio only,
// created lazily after a tap; silent wherever it isn't available.
let audioCtx = null;
export function chime(enabled) {
  if (!enabled) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = audioCtx || new AC();
    const t0 = audioCtx.currentTime;
    [659.25, 987.77].forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      const at = t0 + i * 0.09;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.05, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(at);
      osc.stop(at + 0.3);
    });
  } catch {
    /* no audio */
  }
}

export function reducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

// Seeded shuffle so a card (or a building's windows) doesn't reshuffle on every render.
export function seededShuffle(items, seed) {
  let x = 2166136261;
  for (const ch of String(seed)) x = Math.imul(x ^ ch.charCodeAt(0), 16777619);
  const rand = () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function mmss(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
