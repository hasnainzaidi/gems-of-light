#!/usr/bin/env node
// Validate the programmable artist contract (v2.1, round 4) in
// MAP-ART-BRIEF.md as amended by map-artist-pack/drafts/r1/LOG.md:
// islands in sky, fountain hearts (water only in `water-R` groups),
// NO stream, spots ON the walk, adaptive region shape (heart-4 present
// = four islands × 6 spots; absent = three × 8), gates = islands − 1.
// Dependency-free by design: runs anywhere the existing v3 checkers run.
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
const vb = (root?.attrs.viewBox || '').trim().split(/[ ,]+/).map(Number);
if (vb.length !== 4 || vb.some((v) => !Number.isFinite(v)) || vb[2] <= 0 || vb[3] <= 0) {
  fail('viewBox must contain four finite values with positive width/height');
}
const W = vb[2] || 0, H = vb[3] || 0;
if (W && H && (W / H < 1.7 || W / H > 2.6)) fail(`viewBox aspect ${String(W / H)} is outside the roughly 2:1 range`);
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

// v2.1: the region shape comes from the map itself
const nRegions = byId.has('heart-4') ? 4 : 3;
const perRegion = 24 / nRegions;

const walkTag = required('walk', 'path');
if (byId.has('stream')) fail('#stream is not part of contract v2.1 — the map has no watercourse');
required('over', 'g');
for (let r = 1; r <= nRegions; r++) {
  required(`water-${r}`, 'g');
  required(`heart-${r}`, 'circle');
  for (let n = 1; n <= perRegion; n++) required(`spot-${r}-${n}`, 'circle');
}
for (let g = 1; g < nRegions; g++) required(`gate-${g}`, 'circle');
required('moon', 'circle');
const groupIds = ['over'];
for (let r = 1; r <= nRegions; r++) groupIds.push(`water-${r}`);
for (const id of groupIds) {
  const re = new RegExp(`<g\\b[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/g>`);
  const m = xml.match(re);
  if (!m || !m[1].replace(/<!--[^]*?-->/g, '').trim()) fail(`#${id} must be a nonempty group`);
}

const anchorIds = [];
for (let r = 1; r <= nRegions; r++) {
  anchorIds.push(`heart-${r}`);
  for (let n = 1; n <= perRegion; n++) anchorIds.push(`spot-${r}-${n}`);
}
for (let g = 1; g < nRegions; g++) anchorIds.push(`gate-${g}`);
anchorIds.push('moon');

const circles = new Map();
for (const id of anchorIds) {
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
  if (!walkTag?.attrs.d?.trim()) fail('#walk needs a nonempty d attribute');
  if (walkTag && (walkTag.attrs.d.match(/[mM]/g) || []).length !== 1) fail('#walk must contain one subpath');
  if (walkTag?.attrs.d) {
    const walk = pathSamples(walkTag.attrs.d);
    // spots: ON the walk, in walking order, evenly breathable per island
    let prior = -1;
    for (let r = 1; r <= nRegions; r++) {
      let prevHit = null;
      for (let n = 1; n <= perRegion; n++) {
        const id = `spot-${r}-${n}`;
        const s = circles.get(id);
        if (!s) continue;
        const hit = nearest(walk, s);
        if (hit.distance > 9) fail(`${id} is ${hit.distance.toFixed(1)} units off #walk (must sit on the road)`);
        if (hit.index <= prior) fail(`${id} is out of walking order`);
        prior = hit.index;
        if (prevHit != null) {
          const gap = walk[hit.index].l - walk[prevHit].l;
          if (gap < 70) fail(`${id} is only ${gap.toFixed(1)} walk-units after its predecessor (breathing minimum 70)`);
        }
        prevHit = hit.index;
      }
    }
    // gates: on the walk, in order
    let gPrior = -1;
    for (let g = 1; g < nRegions; g++) {
      const gate = circles.get(`gate-${g}`);
      if (!gate) continue;
      const hit = nearest(walk, gate);
      if (hit.distance > 40) fail(`#gate-${g} is ${hit.distance.toFixed(1)} units from #walk`);
      if (hit.index <= gPrior) fail(`#gate-${g} is out of order along #walk`);
      gPrior = hit.index;
    }
    // hearts: near (walked-by) but never ON the walk
    for (let r = 1; r <= nRegions; r++) {
      const h = circles.get(`heart-${r}`);
      if (!h) continue;
      const hit = nearest(walk, h);
      if (hit.distance < 20) fail(`#heart-${r} is ${hit.distance.toFixed(1)} units from #walk — the path walks BY the fountain, never through it`);
      if (hit.distance > 160) warn(`#heart-${r} is ${hit.distance.toFixed(1)} units from #walk — meant to be nestled in the sweep's elbow`);
    }
  }
} catch (err) {
  fail(`path geometry could not be checked: ${err.message}`);
}

const hearts = [];
for (let r = 1; r <= nRegions; r++) hearts.push(circles.get(`heart-${r}`));
if (hearts.every(Boolean)) {
  for (let i = 1; i < hearts.length; i++) {
    if (!(hearts[i - 1].x < hearts[i].x && hearts[i - 1].y > hearts[i].y)) {
      fail('heart anchors must progress lower-left → upper-right');
      break;
    }
  }
}

for (const w of warnings) console.warn(`⚠ ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`);
  console.error(`\n${errors.length} map contract error${errors.length === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log(`✓ ${path.relative(process.cwd(), file)} · ${W}×${H} · ${(W / H).toFixed(2)}:1 · ${nRegions}×${perRegion} spots · ${bytes.toLocaleString()} bytes`);
