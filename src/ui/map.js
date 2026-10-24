// The campus map: an original flat isometric SVG of the ten buildings (spec §2).
// Windows light in proportion to each area's weighted readiness; a building
// whose energize rule (§3) is met turns warm white and glows. The conference
// room (Interview) sits front and center.

import { s, seededShuffle } from './dom.js';
import { formatPercent } from '../engine/rating.js';

const U = 17; // px per campus unit
const COS30 = 0.8660254;
const OX = 180;
const OY = 30;
export const MAP_W = 360;
export const MAP_H = 238;

// Campus units → SVG px. x runs right-and-down, y left-and-down, z up.
function P(x, y, z = 0) {
  return [OX + (x - y) * COS30 * U, OY + (x + y) * 0.5 * U - z * U];
}

function pts(list) {
  return list.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');
}

// Footprints in campus units: x:[x0,x1], y:[y0,y1], z (base), h (height).
// `win` = windows on the two visible faces; `kind` = pad | detail for flat or
// decorative boxes; the first box with windows anchors the label.
const WIN = { spacing: 0.48, w: 0.26, h: 0.2, row: 0.42, z0: 0.22 };
const LEDS = { spacing: 0.38, w: 0.12, h: 0.12, rows: 1, z0: 0.42 };
const GLASS = { spacing: 0.6, w: 0.42, h: 0.34, row: 0.46, rows: 2, z0: 0.2 };

export const LAYOUT = {
  hall1: {
    label: 'HALL 1',
    boxes: [
      { x: [1.2, 6.6], y: [0.3, 2.7], h: 1.5, win: WIN },
      { x: [2.0, 2.6], y: [0.9, 1.5], z: 1.5, h: 0.25, kind: 'detail' },
      { x: [2.9, 3.5], y: [0.9, 1.5], z: 1.5, h: 0.25, kind: 'detail' },
      { x: [5.2, 5.8], y: [0.9, 1.5], z: 1.5, h: 0.25, kind: 'detail' },
    ],
  },
  pump: {
    label: 'PUMP',
    boxes: [
      { x: [7.45, 8.0], y: [0.95, 1.25], h: 0.3, kind: 'detail' },
      { x: [8.0, 9.4], y: [0.4, 1.8], h: 0.9, win: WIN },
    ],
  },
  gen: {
    label: 'GEN',
    boxes: [
      { x: [9.6, 11.6], y: [2.6, 4.6], h: 1.1, win: WIN },
      { x: [10.0, 10.25], y: [2.85, 3.1], z: 1.1, h: 0.75, kind: 'detail' },
      { x: [10.6, 10.85], y: [2.85, 3.1], z: 1.1, h: 0.75, kind: 'detail' },
    ],
  },
  hall2: {
    label: 'HALL 2',
    boxes: [
      { x: [0.3, 2.7], y: [3.2, 8.6], h: 1.5, win: WIN },
      { x: [1.0, 1.6], y: [3.9, 4.5], z: 1.5, h: 0.25, kind: 'detail' },
      { x: [1.0, 1.6], y: [7.2, 7.8], z: 1.5, h: 0.25, kind: 'detail' },
    ],
  },
  hq: {
    label: 'HQ',
    boxes: [
      { x: [4.6, 7.0], y: [4.6, 5.6], h: 0.7, win: WIN },
      { x: [6.55, 6.65], y: [4.75, 4.85], z: 0.7, h: 0.55, kind: 'detail' },
    ],
  },
  field: {
    label: 'FIELD',
    boxes: [{ x: [3.0, 4.1], y: [5.9, 6.9], h: 0.8, win: WIN }],
  },
  office: {
    label: 'OFFICE',
    boxes: [
      { x: [9.4, 11.6], y: [5.8, 7.8], h: 2.2, win: WIN },
      { x: [11.0, 11.6], y: [7.8, 8.5], h: 2.7, win: WIN },
    ],
  },
  yard: {
    label: 'YARD',
    boxes: [
      { x: [3.6, 7.2], y: [7.4, 9.6], h: 0.04, kind: 'pad' },
      { x: [4.0, 5.2], y: [7.8, 9.0], h: 1.0, win: WIN },
      { x: [6.5, 6.75], y: [8.9, 9.15], h: 0.35, kind: 'detail' },
    ],
  },
  energy: {
    label: 'ENERGY',
    boxes: [
      { x: [0.6, 2.5], y: [9.3, 10.05], h: 0.75, win: LEDS },
      { x: [0.6, 2.5], y: [10.35, 11.1], h: 0.75, win: LEDS },
      { x: [2.9, 4.1], y: [9.6, 11.1], h: 1.05, win: WIN },
      { x: [3.3, 3.55], y: [9.9, 10.15], z: 1.05, h: 0.6, kind: 'detail' },
    ],
  },
  conf: {
    label: 'CONF',
    boxes: [{ x: [8.4, 10.6], y: [8.4, 10.6], h: 1.2, win: GLASS }],
  },
};

// Spread `n` windows of width w along a face of length len.
function along(len, spec) {
  const n = Math.max(1, Math.floor((len - 0.3) / spec.spacing));
  const start = (len - n * spec.spacing) / 2 + (spec.spacing - spec.w) / 2;
  return Array.from({ length: n }, (_, i) => start + i * spec.spacing);
}

function windowsFor(box) {
  const spec = box.win;
  const z0 = box.z || 0;
  const rows = spec.rows || Math.max(1, Math.floor((box.h - 0.25) / spec.row));
  const out = [];
  for (let r = 0; r < rows; r++) {
    const za = z0 + spec.z0 + r * (spec.row || 0);
    const zb = za + spec.h;
    // Left-front face (y = y1), running along x.
    for (const off of along(box.x[1] - box.x[0], spec)) {
      const xa = box.x[0] + off;
      const xb = xa + spec.w;
      const y = box.y[1];
      out.push([P(xa, y, za), P(xb, y, za), P(xb, y, zb), P(xa, y, zb)]);
    }
    // Right-front face (x = x1), running along y.
    for (const off of along(box.y[1] - box.y[0], spec)) {
      const ya = box.y[0] + off;
      const yb = ya + spec.w;
      const x = box.x[1];
      out.push([P(x, ya, za), P(x, yb, za), P(x, yb, zb), P(x, ya, zb)]);
    }
  }
  return out;
}

function boxFaces(box) {
  const [x0, x1] = box.x;
  const [y0, y1] = box.y;
  const z0 = box.z || 0;
  const z1 = z0 + box.h;
  return {
    top: [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)],
    left: [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)],
    right: [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)],
  };
}

const depth = (box) => (box.x[0] + box.x[1]) / 2 + (box.y[0] + box.y[1]) / 2 + (box.z || 0) * 0.01;

function readinessTone(st) {
  if (st.energized) return 'energized';
  return st.readiness > 0 ? 'warm' : 'dark';
}

// One building as an SVG group. Returns the group and every projected point
// (for viewBox fitting in the single-building view).
function buildingGroup(id, st, { interactive, celebrate, onBuilding, name }) {
  const def = LAYOUT[id];
  const tone = readinessTone(st);
  const g = s('g', {
    class: `bld ${tone}${celebrate ? ' celebrate' : ''}`,
    'data-building': id,
  });
  const all = [];
  const boxes = [...def.boxes].sort((a, b) => depth(a) - depth(b));

  // Every window of the building, shuffled per building so lights scatter
  // like a real office instead of filling row by row.
  const winBoxes = def.boxes.filter((b) => b.win);
  const windows = winBoxes.flatMap(windowsFor);
  const order = seededShuffle(windows.map((_, i) => i), id);
  const litCount = Math.round(Math.max(0, Math.min(1, st.readiness)) * windows.length);
  const litRank = new Map(order.slice(0, litCount).map((wi, rank) => [wi, rank]));

  if (st.energized) {
    const main = winBoxes[0];
    const [cx, cy] = P((main.x[0] + main.x[1]) / 2, (main.y[0] + main.y[1]) / 2);
    const rx = ((main.x[1] - main.x[0]) + (main.y[1] - main.y[0])) * COS30 * U * 0.62;
    g.append(s('ellipse', { class: 'halo', cx: cx.toFixed(1), cy: (cy + 2).toFixed(1), rx: rx.toFixed(1), ry: (rx * 0.5).toFixed(1), fill: 'url(#halo)' }));
  }

  // Index of each window box's first window in `windows` (flatMap order).
  const firstWindow = new Map();
  winBoxes.reduce((n, b) => (firstWindow.set(b, n), n + windowsFor(b).length), 0);

  for (const box of boxes) {
    const f = boxFaces(box);
    all.push(...f.top, ...f.left, ...f.right);
    const kind = box.kind || 'block';
    g.append(
      s('polygon', { class: `face lf ${kind}`, points: pts(f.left) }),
      s('polygon', { class: `face rf ${kind}`, points: pts(f.right) }),
      s('polygon', { class: `face top ${kind}`, points: pts(f.top) }),
    );
    if (box.win) {
      const base = firstWindow.get(box);
      const wg = s('g', { class: 'wins', filter: st.energized ? 'url(#winGlow)' : null });
      windowsFor(box).forEach((quad, k) => {
        const rank = litRank.get(base + k);
        wg.append(s('polygon', { class: rank != null ? 'win on' : 'win', points: pts(quad), style: rank != null ? { '--i': String(rank) } : null }));
      });
      g.append(wg);
    }
  }

  const main = winBoxes[0];
  const [lx, ly] = P((main.x[0] + main.x[1]) / 2, (main.y[0] + main.y[1]) / 2, (main.z || 0) + main.h);
  g.append(s('text', { class: 'label', x: lx.toFixed(1), y: (ly + 2.6).toFixed(1) }, def.label));

  if (interactive) {
    const xs = all.map((p) => p[0]);
    const ys = all.map((p) => p[1]);
    const pad = 4;
    g.prepend(s('rect', { class: 'hit', x: (Math.min(...xs) - pad).toFixed(1), y: (Math.min(...ys) - pad).toFixed(1), width: (Math.max(...xs) - Math.min(...xs) + 2 * pad).toFixed(1), height: (Math.max(...ys) - Math.min(...ys) + 2 * pad).toFixed(1) }));
    g.setAttribute('role', 'button');
    g.setAttribute('tabindex', '0');
    g.setAttribute('aria-label', `${name} — ${formatPercent(st.readiness, 0)} ready${st.energized ? ', energized' : ''}`);
    g.addEventListener('click', () => onBuilding(id));
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onBuilding(id);
      }
    });
  }
  g.append(s('title', {}, `${name} · ${formatPercent(st.readiness, 0)}${st.energized ? ' · energized' : ''}`));
  return { g, points: all, windows: windows.length, lit: litCount };
}

function defs() {
  return s(
    'defs',
    {},
    s(
      'radialGradient',
      { id: 'halo' },
      s('stop', { offset: '0%', 'stop-color': '#fff1cf', 'stop-opacity': '0.42' }),
      s('stop', { offset: '60%', 'stop-color': '#f2c46f', 'stop-opacity': '0.12' }),
      s('stop', { offset: '100%', 'stop-color': '#f2a93b', 'stop-opacity': '0' }),
    ),
    s(
      'filter',
      { id: 'winGlow', x: '-50%', y: '-50%', width: '200%', height: '200%' },
      s('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '1.1', result: 'b' }),
      s('feMerge', {}, s('feMergeNode', { in: 'b' }), s('feMergeNode', { in: 'SourceGraphic' })),
    ),
  );
}

function ground() {
  const lo = -0.2;
  const hi = 11.8;
  const g = s('g', { class: 'ground-layer', 'aria-hidden': 'true' });
  g.append(s('polygon', { class: 'ground', points: pts([P(lo, lo), P(hi, lo), P(hi, hi), P(lo, hi)]) }));
  for (let i = 1; i < 12; i++) {
    g.append(s('line', { class: 'grid', x1: P(i, lo)[0], y1: P(i, lo)[1], x2: P(i, hi)[0], y2: P(i, hi)[1] }));
    g.append(s('line', { class: 'grid', x1: P(lo, i)[0], y1: P(lo, i)[1], x2: P(hi, i)[0], y2: P(hi, i)[1] }));
  }
  return g;
}

// The whole campus. `status` = campusStatus(topics); `buildings` = BUILDINGS
// (for names); `celebrate` = ids that just energized (they play the light-up).
export function campusMap({ status, buildings, interactive = true, celebrate = [], onBuilding = () => {} }) {
  const byId = new Map(status.map((st) => [st.id, st]));
  const names = new Map(buildings.map((b) => [b.id, b.name]));
  const svgEl = s('svg', {
    class: `map${interactive ? ' interactive' : ''}`,
    viewBox: `0 0 ${MAP_W} ${MAP_H}`,
    role: 'img',
    'aria-label': `Campus map: ${status.filter((x) => x.energized).length} of ${status.length} buildings energized`,
  });
  svgEl.append(defs(), ground());
  // Flat pads first so nothing standing is painted over by the ground.
  const ordered = Object.keys(LAYOUT)
    .filter((id) => byId.has(id))
    .sort((a, b) => Math.min(...LAYOUT[a].boxes.filter((x) => x.kind !== 'pad').map(depth)) - Math.min(...LAYOUT[b].boxes.filter((x) => x.kind !== 'pad').map(depth)));
  for (const id of ordered) {
    const { g } = buildingGroup(id, byId.get(id), { interactive, celebrate: celebrate.includes(id), onBuilding, name: names.get(id) || id });
    svgEl.append(g);
  }
  return svgEl;
}

// One building on its own, fitted to its bounds (the Building view).
export function buildingArt({ id, status, name }) {
  if (!LAYOUT[id]) return null;
  const { g, points } = buildingGroup(id, status, { interactive: false, celebrate: false, name });
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const pad = 14;
  const x = Math.min(...xs) - pad;
  const y = Math.min(...ys) - pad;
  const w = Math.max(...xs) - Math.min(...xs) + 2 * pad;
  const hgt = Math.max(...ys) - Math.min(...ys) + 2 * pad;
  return s('svg', { class: 'map art', viewBox: `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${hgt.toFixed(1)}`, role: 'img', 'aria-label': name }, defs(), g);
}

// Window counts per building (tests and the legend).
export function windowCounts() {
  const out = {};
  for (const [id, def] of Object.entries(LAYOUT)) out[id] = def.boxes.filter((b) => b.win).flatMap(windowsFor).length;
  return out;
}
