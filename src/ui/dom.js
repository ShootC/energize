// Tiny DOM helpers. Phase 3 replaces the look, not necessarily these.

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
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

// Seeded shuffle so a card doesn't reshuffle on every re-render.
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
