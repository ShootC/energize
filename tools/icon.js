// The ENERGIZE app icon: a dark campus building with its windows coming on.
// One geometry (axis-aligned rectangles in a 512-unit square), drawn two ways:
// as SVG for dist/icon.svg and rasterised by hand into PNG for the home-screen
// icons (Android, and apple-touch-icon for iOS, which ignores SVG). No
// dependencies, no external assets — the PNG encoder is node:zlib plus a CRC.
//
// Everything stays inside the central 80% of the square so the 512 icon can be
// declared "maskable" (Android crops adaptive icons to a circle or squircle).

import { deflateSync } from 'node:zlib';

export const ICON_UNITS = 512;

const BG = '#0c0e11'; // --bg
const WALL = '#1d2128'; // --panel-2
const EDGE = '#343a45'; // --line-2
const DIM = '#262b33'; // --line: a dark window
const AMBER = '#f2a93b'; // --amber: coming up
const LIT = '#fff3d6'; // --lit: energized

// [x, y, w, h, fill] in icon units.
export function iconShapes() {
  const shapes = [[0, 0, 512, 512, BG]];
  // Ground, kept inside the safe zone.
  shapes.push([104, 412, 304, 8, DIM]);
  // The building: 208 wide, from y 96 to the ground.
  const bx = 152;
  const by = 96;
  const bw = 208;
  const bh = 316;
  shapes.push([bx, by, bw, bh, WALL]);
  shapes.push([bx, by, bw, 8, EDGE]); // roof edge
  shapes.push([bx - 8, 404, bw + 16, 8, EDGE]); // plinth
  // Roof block and the antenna: the "energized" halo lives up here.
  shapes.push([232, 72, 48, 24, WALL]);
  shapes.push([252, 48, 8, 24, EDGE]);
  shapes.push([250, 40, 12, 8, LIT]);
  // Windows: 4 columns × 6 rows. The top rows are energized (warm white), the
  // middle rows are coming up (amber), the bottom row is still dark.
  const cols = 4;
  const rows = 6;
  const ww = 32;
  const wh = 28;
  const gx = (bw - cols * ww) / (cols + 1);
  const top = by + 32;
  const gy = (bh - 32 - 64 - rows * wh) / (rows + 1);
  const pattern = ['1111', '1101', '1011', '2122', '2021', '0200']; // 1 lit, 2 amber, 0 dark
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = bx + gx + c * (ww + gx);
      const y = top + gy + r * (wh + gy);
      const code = pattern[r][c];
      shapes.push([Math.round(x), Math.round(y), ww, wh, code === '1' ? LIT : code === '2' ? AMBER : DIM]);
    }
  }
  // The door, lit.
  shapes.push([236, 364, 40, 40, AMBER]);
  return shapes;
}

export function iconSvg() {
  const rects = iconShapes()
    .map(([x, y, w, h, fill]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ICON_UNITS} ${ICON_UNITS}" width="${ICON_UNITS}" height="${ICON_UNITS}">${rects}</svg>\n`;
}

// ---------- PNG ----------

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const hex = (color) => [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));

// Rasterise the shapes at `size` pixels (RGB, no alpha). Rectangle edges land on
// whole pixels once scaled, so no anti-aliasing is needed for a crisp icon.
export function iconPng(size) {
  const scale = size / ICON_UNITS;
  const px = Buffer.alloc(size * size * 3);
  for (const [x, y, w, h, fill] of iconShapes()) {
    const [r, g, b] = hex(fill);
    const x0 = Math.max(0, Math.round(x * scale));
    const x1 = Math.min(size, Math.round((x + w) * scale));
    const y0 = Math.max(0, Math.round(y * scale));
    const y1 = Math.min(size, Math.round((y + h) * scale));
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) {
        const i = (yy * size + xx) * 3;
        px[i] = r;
        px[i + 1] = g;
        px[i + 2] = b;
      }
    }
  }
  // One filter byte (0 = none) in front of every scanline.
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let yy = 0; yy < size; yy++) {
    raw[yy * (size * 3 + 1)] = 0;
    px.copy(raw, yy * (size * 3 + 1) + 1, yy * size * 3, (yy + 1) * size * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// The files build.js writes next to index.html.
export function iconFiles() {
  return {
    'icon.svg': iconSvg(),
    'icon-192.png': iconPng(192),
    'icon-512.png': iconPng(512),
    'apple-touch-icon.png': iconPng(180),
  };
}
