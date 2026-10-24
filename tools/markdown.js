// Build-time Markdown → HTML for the Browse screen. Handles what
// content/study-guide.md and content/story-scripts.md actually use: headings,
// paragraphs, nested lists, task checkboxes, tables, bold / italic, links,
// inline code, backslash escapes, numeric entities and ```latex formulas.

const SEP = ' › ';

export function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function slugify(text) {
  return String(text)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'section';
}

function decodeEntities(s) {
  return s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

// Plain heading text: what a card's `source` field must match.
export function plainText(md) {
  return decodeEntities(String(md))
    .replace(/\\([\\`*_{}\[\]()#+\-.!~|&])/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

export function renderInline(md) {
  const stash = [];
  const keep = (html) => `\u0000${stash.push(html) - 1}\u0000`;
  let s = decodeEntities(String(md));
  s = s.replace(/\\([\\`*_{}\[\]()#+\-.!~|&<>])/g, (_, c) => keep(escapeHtml(c)));
  s = s.replace(/`([^`]+)`/g, (_, c) => keep(`<code>${escapeHtml(c)}</code>`));
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) => keep(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${renderInline(text)}</a>`));
  s = escapeHtml(s);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/(^|[^\w])_(?!\s)(.+?)(?<!\s)_(?!\w)/g, '$1<em>$2</em>');
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => stash[Number(i)]);
  return s;
}

// ---------- TeX subset → HTML ----------

const TEX_SYMBOLS = {
  times: '×', le: '≤', ge: '≥', leq: '≤', geq: '≥', Delta: 'Δ', delta: 'δ', pi: 'π', chi: 'χ', alpha: 'α',
  rho: 'ρ', sum: '∑', cdot: '·', pm: '±', infty: '∞', approx: '≈', log: 'log', ln: 'ln', mu: 'μ', theta: 'θ',
};
const TEX_SPACES = { qquad: '  ', quad: ' ', ',': ' ', ' ': ' ', ';': ' ', ':': ' ', '!': '' };

export function renderTex(src) {
  let i = 0;
  const s = String(src).trim();

  function readCommand() {
    // at '\'
    i++;
    if (i < s.length && !/[a-zA-Z]/.test(s[i])) return s[i++];
    let name = '';
    while (i < s.length && /[a-zA-Z]/.test(s[i])) name += s[i++];
    return name;
  }

  function readArg() {
    while (s[i] === ' ') i++;
    if (s[i] === '{') {
      i++;
      const html = parse('}');
      i++; // '}'
      return html;
    }
    if (s[i] === '\\') return atomFromCommand(readCommand());
    return escapeHtml(s[i++] ?? '');
  }

  function readRawGroup() {
    while (s[i] === ' ') i++;
    if (s[i] !== '{') return '';
    let depth = 0;
    let out = '';
    for (; i < s.length; i++) {
      if (s[i] === '{') {
        if (depth++ === 0) continue;
      } else if (s[i] === '}') {
        if (--depth === 0) {
          i++;
          break;
        }
      }
      out += s[i];
    }
    return out;
  }

  function atomFromCommand(name) {
    if (name in TEX_SPACES) return TEX_SPACES[name];
    if (name === 'frac' || name === 'tfrac' || name === 'dfrac') {
      const num = readArg();
      const den = readArg();
      return `<span class="tex-frac"><span class="tex-num">${num}</span><span class="tex-den">${den}</span></span>`;
    }
    if (name === 'sqrt') return `√<span class="tex-sqrt">${readArg()}</span>`;
    if (name === 'text' || name === 'mathrm') return escapeHtml(readRawGroup());
    if (name === 'dot') return `${readArg()}̇`;
    if (name === 'left' || name === 'right') {
      const d = s[i] === '\\' ? (i++, s[i++]) : s[i++];
      return d === '.' ? '' : escapeHtml(d);
    }
    if (name in TEX_SYMBOLS) return TEX_SYMBOLS[name];
    return escapeHtml(name);
  }

  function parse(stop) {
    let out = '';
    while (i < s.length && s[i] !== stop) {
      const c = s[i];
      if (c === '\\') out += atomFromCommand(readCommand());
      else if (c === '^') {
        i++;
        out += `<sup>${readArg()}</sup>`;
      } else if (c === '_') {
        i++;
        out += `<sub>${readArg()}</sub>`;
      } else if (c === '{') {
        i++;
        out += parse('}');
        i++;
      } else if (c === '~') {
        out += ' ';
        i++;
      } else {
        out += escapeHtml(c);
        i++;
      }
    }
    return out;
  }

  return parse(null).replace(/ {2,}/g, ' ');
}

// ---------- blocks ----------

function splitRow(line) {
  let l = line.trim();
  if (l.startsWith('|')) l = l.slice(1);
  if (l.endsWith('|')) l = l.slice(0, -1);
  return l.split('|').map((c) => c.trim());
}

const LIST_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

function renderList(lines) {
  // lines: [{indent, ordered, text}]
  let html = '';
  const stack = [];
  const open = (item) => {
    const tag = item.ordered ? 'ol' : 'ul';
    stack.push({ indent: item.indent, tag });
    html += `<${tag}>`;
  };
  for (const item of lines) {
    if (!stack.length) open(item);
    else if (item.indent > stack[stack.length - 1].indent) open(item);
    else {
      while (stack.length > 1 && item.indent < stack[stack.length - 1].indent) html += `</li></${stack.pop().tag}>`;
      html += '</li>';
    }
    let text = item.text;
    let box = '';
    const task = text.match(/^\[( |x|X)\]\s+(.*)$/);
    if (task) {
      box = `<input type="checkbox" disabled${task[1] !== ' ' ? ' checked' : ''}> `;
      text = task[2];
    }
    html += `<li${task ? ' class="task"' : ''}>${box}${renderInline(text)}`;
  }
  while (stack.length) html += `</li></${stack.pop().tag}>`;
  return html;
}

// Returns { html, headings: [{ level, text, id, path }] }. `path` is the
// heading trail joined with " › " (what a card's `source` field names).
export function renderMarkdown(md, { idPrefix = '' } = {}) {
  const lines = String(md).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  const headings = [];
  const usedIds = new Set();
  const trail = [];
  let para = [];

  const flushPara = () => {
    if (para.length) out.push(`<p>${renderInline(para.join(' '))}</p>`);
    para = [];
  };

  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];

    const fence = line.match(/^```\s*([\w-]*)\s*$/);
    if (fence) {
      flushPara();
      const body = [];
      for (n++; n < lines.length && !/^```\s*$/.test(lines[n]); n++) body.push(lines[n]);
      if (fence[1] === 'latex' || fence[1] === 'tex' || fence[1] === 'math') {
        out.push(`<div class="math" data-tex="${escapeHtml(body.join(' '))}">${renderTex(body.join(' '))}</div>`);
      } else {
        out.push(`<pre><code>${escapeHtml(body.join('\n'))}</code></pre>`);
      }
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (h) {
      flushPara();
      const level = h[1].length;
      const text = plainText(h[2]);
      let id = `${idPrefix}${slugify(text)}`;
      for (let k = 2; usedIds.has(id); k++) id = `${idPrefix}${slugify(text)}-${k}`;
      usedIds.add(id);
      trail.length = level - 1;
      trail[level - 1] = text;
      const path = trail.filter(Boolean).slice(level > 1 ? 1 : 0).join(SEP);
      headings.push({ level, text, id, path });
      out.push(`<h${level} id="${id}">${renderInline(h[2])}</h${level}>`);
      continue;
    }

    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushPara();
      out.push('<hr>');
      continue;
    }

    if (/^\s*\|/.test(line) && n + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[n + 1])) {
      flushPara();
      const head = splitRow(line);
      const rows = [];
      for (n += 2; n < lines.length && /^\s*\|/.test(lines[n]); n++) rows.push(splitRow(lines[n]));
      n--;
      out.push(
        `<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${renderInline(c)}</th>`).join('')}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table></div>`,
      );
      continue;
    }

    if (LIST_RE.test(line)) {
      flushPara();
      const items = [];
      for (; n < lines.length; n++) {
        const m = lines[n].match(LIST_RE);
        if (m) items.push({ indent: m[1].length, ordered: /\d/.test(m[2]), text: m[3] });
        else if (lines[n].trim() && /^\s{2,}/.test(lines[n]) && items.length) items[items.length - 1].text += ` ${lines[n].trim()}`;
        else break;
      }
      n--;
      out.push(renderList(items));
      continue;
    }

    if (!line.trim()) {
      flushPara();
      continue;
    }
    if (/^>\s?/.test(line)) {
      flushPara();
      out.push(`<blockquote>${renderInline(line.replace(/^>\s?/, ''))}</blockquote>`);
      continue;
    }
    para.push(line.trim());
  }
  flushPara();
  return { html: out.join('\n'), headings };
}

// Headings only (validate.js needs these without rendering).
export function extractHeadings(md) {
  return renderMarkdown(md).headings;
}
