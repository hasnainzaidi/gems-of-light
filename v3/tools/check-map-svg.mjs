#!/usr/bin/env node
// Validate the programmable artist contract in MAP-ART-BRIEF.md.
// Dependency-free by design: this runs anywhere the existing v3 checkers run.
import fs from 'node:fs';
import path from 'node:path';

const target = process.argv[2] || 'map-artist-pack/journey-map.svg';
const file = path.resolve(process.cwd(), target);
const xml = fs.readFileSync(file, 'utf8');
const bytes = Buffer.byteLength(xml);
const errors = [];
const warnings = [];
const fail = (s) => errors.push(s);
const warn = (s) => warnings.push(s);

function attrs(source) {
  const out = {};
  const re = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(source))) out[m[1]] = m[2] ?? m[3];
  return out;
}

const tags = [];
const tagRe = /<([A-Za-z][\w:.-]*)\b([^>]*)>/g;
let tm;
while ((tm = tagRe.exec(xml))) {
  if (tm[0].startsWith('<!--')) continue;
  tags.push({ tag: tm[1].split(':').pop().toLowerCase(), attrs: attrs(tm[2]), raw: tm[0] });
}
const byId = new Map();
for (const t of tags) {
  if (!t.attrs.id) continue;
  if (byId.has(t.attrs.id)) fail(`duplicate id #${t.attrs.id}`);
  else byId.set(t.attrs.id, t);
}

function required(id, tag) {
  const t = byId.get(id);
  if (!t) { fail(`missing <${tag}> #${id}`); return null; }
  if (t.tag !== tag) fail(`#${id} must be <${tag}>, found <${t.tag}>`);
  return t;
}

function numberAttr(t, name, id) {
  const v = Number(t && t.attrs[name]);
  if (!Number.isFinite(v)) fail(`#${id} needs finite ${name}`);
  return v;
}

if (/<!DOCTYPE|<!ENTITY/i.test(xml)) fail('DOCTYPE/entity declarations are not allowed');
const root = tags.find((t) => t.tag === 'svg');
if (!root) fail('missing root <svg>');
if (root && root.attrs.version !== '1.1') fail('root version must be SVG 1.1');
const vb = (root?.attrs.viewBox || '').trim().split(/[ ,]+/).map(Number);
if (vb.length !== 4 || vb.some((v) => !Number.isFinite(v)) || vb[2] <= 0 || vb[3] <= 0) {
  fail('viewBox must contain four finite values with positive width/height');
}
const W = vb[2] || 0, H = vb[3] || 0;
if (W && H && (W / H < 1.8 || W / H > 2.3)) fail(`viewBox aspect ${String(W / H)} is outside the brief's roughly 2:1 range`);
if (bytes > 1_500_000) fail(`file is ${bytes} bytes; delivery ceiling is 1,500,000`);

const prohibited = new Set([
  'text', 'tspan', 'textpath', 'image', 'feimage', 'filter', 'mask',
  'foreignobject', 'a', 'script', 'animate', 'animatemotion', 'animatetransform', 'set'
]);
for (const t of tags) {
  if (prohibited.has(t.tag)) fail(`<${t.tag}> is not allowed`);
  for (const [k, v] of Object.entries(t.attrs)) {
    if (/^on/i.test(k)) fail(`event attribute ${k} is not allowed`);
    if (k === 'filter' || k === 'mask') fail(`${k} attributes are not allowed`);
    if (k === 'href' || k === 'xlink:href') {
      if (!v.startsWith('#')) fail(`external reference ${k}="${v}" is not allowed`);
    }
  }
}
if (/@import|@font-face/i.test(xml)) fail('external CSS/font declarations are not allowed');
for (const match of xml.matchAll(/url\(([^)]+)\)/g)) {
  const value = match[1].trim().replace(/^['"]|['"]$/g, '');
  if (!value.startsWith('#')) fail(`external url(${value}) is not allowed`);
}

const walkTag = required('walk', 'path');
const streamTag = required('stream', 'path');
required('over', 'g');
for (let r = 1; r <= 3; r++) {
  required(`water-${r}`, 'g');
  required(`heart-${r}`, 'circle');
  for (let n = 1; n <= 7; n++) required(`spot-${r}-${n}`, 'circle');
}
required('gate-1', 'circle');
required('gate-2', 'circle');
required('moon', 'circle');
for (const id of ['water-1', 'water-2', 'water-3', 'over']) {
  const re = new RegExp(`<g\\b[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/g>`);
  const m = xml.match(re);
  if (!m || !m[1].replace(/<!--[^]*?-->/g, '').trim()) fail(`#${id} must be a nonempty group`);
}

const circles = new Map();
for (const id of [...Array.from({ length: 3 }, (_, r) => Array.from({ length: 7 }, (_, n) => `spot-${r + 1}-${n + 1}`)).flat(),
  'heart-1', 'heart-2', 'heart-3', 'gate-1', 'gate-2', 'moon']) {
  const t = byId.get(id);
  if (!t) continue;
  if ('transform' in t.attrs) fail(`#${id} must use raw root-space cx/cy (no transform)`);
  const x = numberAttr(t, 'cx', id), y = numberAttr(t, 'cy', id);
  if (Number.isFinite(x) && Number.isFinite(y) && (x < vb[0] || x > vb[0] + W || y < vb[1] || y > vb[1] + H)) {
    fail(`#${id} (${x},${y}) lies outside the viewBox`);
  }
  if (Number.isFinite(x) && Number.isFinite(y) && W && H &&
      (x < vb[0] + W * 0.03 || x > vb[0] + W * 0.97 ||
       y < vb[1] + H * 0.03 || y > vb[1] + H * 0.97)) {
    fail(`#${id} (${x},${y}) lies inside the outer 3% safe margin`);
  }
  circles.set(id, { x, y });
}

function pathSamples(d, spacing = 1.5) {
  const tokens = d.match(/[A-Za-z]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi) || [];
  const out = [];
  let i = 0, cmd = null, x = 0, y = 0, start = null, length = 0;
  const add = (nx, ny) => {
    if (!out.length) out.push({ x: nx, y: ny, l: 0 });
    else { length += Math.hypot(nx - out.at(-1).x, ny - out.at(-1).y); out.push({ x: nx, y: ny, l: length }); }
  };
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[i])) cmd = tokens[i++];
    if (!cmd || cmd !== cmd.toUpperCase()) throw new Error('checker supports absolute path commands only');
    if (cmd === 'M') {
      x = num(); y = num(); add(x, y); start = { x, y }; cmd = 'L';
    } else if (cmd === 'L') {
      const nx = num(), ny = num();
      const n = Math.max(1, Math.ceil(Math.hypot(nx - x, ny - y) / spacing));
      const ox = x, oy = y;
      for (let s = 1; s <= n; s++) add(ox + (nx - ox) * s / n, oy + (ny - oy) * s / n);
      x = nx; y = ny;
    } else if (cmd === 'H' || cmd === 'V') {
      const nx = cmd === 'H' ? num() : x, ny = cmd === 'V' ? num() : y;
      const n = Math.max(1, Math.ceil(Math.hypot(nx - x, ny - y) / spacing));
      const ox = x, oy = y;
      for (let s = 1; s <= n; s++) add(ox + (nx - ox) * s / n, oy + (ny - oy) * s / n);
      x = nx; y = ny;
    } else if (cmd === 'C') {
      const x1 = num(), y1 = num(), x2 = num(), y2 = num(), nx = num(), ny = num();
      const estimate = Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(nx - x2, ny - y2);
      const n = Math.max(3, Math.ceil(estimate / spacing));
      const ox = x, oy = y;
      for (let s = 1; s <= n; s++) {
        const t = s / n, u = 1 - t;
        add(u ** 3 * ox + 3 * u ** 2 * t * x1 + 3 * u * t ** 2 * x2 + t ** 3 * nx,
          u ** 3 * oy + 3 * u ** 2 * t * y1 + 3 * u * t ** 2 * y2 + t ** 3 * ny);
      }
      x = nx; y = ny;
    } else if (cmd === 'Z') {
      if (start) add(start.x, start.y);
      cmd = null;
    } else {
      throw new Error(`unsupported path command ${cmd}`);
    }
  }
  return out;
}

function nearest(points, p) {
  let best = null, d = Infinity, index = -1;
  points.forEach((q, i) => {
    const qd = Math.hypot(q.x - p.x, q.y - p.y);
    if (qd < d) { best = q; d = qd; index = i; }
  });
  return { point: best, distance: d, index };
}

try {
  for (const [id, t] of [['walk', walkTag], ['stream', streamTag]]) {
    if (!t?.attrs.d?.trim()) fail(`#${id} needs a nonempty d attribute`);
    if (t && (t.attrs.d.match(/[mM]/g) || []).length !== 1) fail(`#${id} must contain one subpath`);
  }
  if (walkTag?.attrs.d && streamTag?.attrs.d) {
    const walk = pathSamples(walkTag.attrs.d);
    const stream = pathSamples(streamTag.attrs.d);
    if (walk[0].x > vb[0] + W * 0.01 || walk[0].y < vb[1] + H * 0.75) {
      fail('#walk must begin at the lower-left edge');
    }
    if (walk.at(-1).x < vb[0] + W * 0.99 || walk.at(-1).y > vb[1] + H * 0.25) {
      fail('#walk must exit at the upper-right edge');
    }
    if (stream.at(-1).x < vb[0] + W * 0.99 || stream.at(-1).y > vb[1] + H * 0.25) {
      fail('#stream must reach the upper-right edge');
    }
    if (nearest(stream, circles.get('heart-1')).distance > 5) fail('#stream must begin at the valley spring / #heart-1');
    const spots = [];
    for (let r = 1; r <= 3; r++) for (let n = 1; n <= 7; n++) spots.push({ id: `spot-${r}-${n}`, ...circles.get(`spot-${r}-${n}`) });
    for (let a = 0; a < spots.length; a++) for (let b = a + 1; b < spots.length; b++) {
      const d = Math.hypot(spots[a].x - spots[b].x, spots[a].y - spots[b].y);
      if (d < 90) fail(`${spots[a].id} and ${spots[b].id} are only ${d.toFixed(1)} units apart`);
    }
    let prior = -1;
    for (const s of spots) {
      const hit = nearest(walk, s);
      if (hit.distance > 45) warn(`${s.id} is ${hit.distance.toFixed(1)} units from #walk`);
      if (hit.index <= prior) fail(`${s.id} is out of walking order`);
      prior = hit.index;
    }
    const g1 = nearest(stream, circles.get('gate-1'));
    const g2 = nearest(stream, circles.get('gate-2'));
    if (g1.distance > 40) fail(`#gate-1 is ${g1.distance.toFixed(1)} units from #stream`);
    if (g2.distance > 40) fail(`#gate-2 is ${g2.distance.toFixed(1)} units from #stream`);
    if (g2.index <= g1.index) fail('#gate-2 must follow #gate-1 along #stream');
  }
} catch (err) {
  fail(`path geometry could not be checked: ${err.message}`);
}

const hearts = [1, 2, 3].map((i) => circles.get(`heart-${i}`));
if (hearts.every(Boolean) && !(
  hearts[0].x < hearts[1].x && hearts[1].x < hearts[2].x &&
  hearts[0].y > hearts[1].y && hearts[1].y > hearts[2].y
)) fail('heart anchors must progress lower-left → upper-right');

for (const w of warnings) console.warn(`⚠ ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`);
  console.error(`\n${errors.length} map contract error${errors.length === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log(`✓ ${path.relative(process.cwd(), file)} · ${W}×${H} · ${(W / H).toFixed(2)}:1 · ${bytes.toLocaleString()} bytes`);
console.log('✓ 2D overworld contract · 21 ordered spots · 3 hearts · 2 gates · 3 water layers · foreground over layer');
