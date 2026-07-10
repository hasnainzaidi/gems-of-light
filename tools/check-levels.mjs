// Level integrity checker — run with: node tools/check-levels.mjs
// Simulates reachability with the game's generous jump (≈3 tiles up, ≈4 across)
// and verifies every gem and the arch can be reached from the start.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

global.window = global;
global.addEventListener = () => {};
global.document = { createElement: () => ({ getContext: () => null, width: 0, height: 0 }) };

require('../js/data.js');
require('../js/art.js');
require('../js/engine.js');
require('../js/levels.js');

const GOL = global.GOL;
const TILE = GOL.TILE;
let failures = 0;

for (const L of GOL.LEVELS) {
  const errs = [];
  const get = (x, y) => (x < 0 || x >= L.w || y < 0 || y >= L.h ? (y >= L.h ? 3 : 1) : L.tiles[y * L.w + x]);
  const standable = (x, y) =>
    (get(x, y) === 1 || get(x, y) === 2 || get(x, y) === 4) && get(x, y - 1) === 0 && get(x, y - 2) === 0;

  // collect standable cells
  const nodes = new Set();
  for (let x = 0; x < L.w; x++) for (let y = 0; y < L.h; y++) if (standable(x, y)) nodes.add(x + ',' + y);
  if (!L.start) errs.push('no start');
  if (!L.arch) errs.push('no arch');

  // BFS over walk/jump/drop moves
  const startX = Math.floor(L.start.x / TILE);
  const startY = L.surface(startX);
  const key = startX + ',' + startY;
  if (!nodes.has(key)) errs.push('start not standable at ' + key);
  const seen = new Set([key]);
  const q = [[startX, startY]];
  const JUMP_UP = 3, JUMP_ACROSS = 4;
  while (q.length) {
    const [x, y] = q.shift();
    for (let dx = -JUMP_ACROSS; dx <= JUMP_ACROSS; dx++) {
      for (let dy = -JUMP_UP; dy <= L.h; dy++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= L.w || ny < 0 || ny >= L.h) continue;
        // generosity envelope: high jumps can't also be max distance
        if (dy < 0 && Math.abs(dx) + Math.abs(dy) > 5) continue;
        if (dy > 0 && Math.abs(dx) > JUMP_ACROSS) continue;
        const k = nx + ',' + ny;
        if (!nodes.has(k) || seen.has(k)) continue;
        seen.add(k);
        q.push([nx, ny]);
      }
    }
  }

  // every gem needs a reachable standable cell close enough to touch it
  const verses = L.surah.verses.length;
  if (L.gems.length !== verses)
    errs.push(`gem count ${L.gems.length} != verses ${verses}`);
  const ayahs = new Set(L.gems.map((g) => g.ayah));
  for (let n = 1; n <= verses; n++) if (!ayahs.has(n)) errs.push('missing gem for ayah ' + n);

  for (const g of L.gems) {
    const gx = Math.floor(g.x / TILE), gy = Math.floor(g.y / TILE);
    if (get(gx, gy) !== 0) errs.push(`gem ${g.ayah} embedded in tile ${get(gx, gy)} at ${gx},${gy}`);
    let ok = false;
    for (const k of seen) {
      const [sx, sy] = k.split(',').map(Number);
      const dx = Math.abs(sx - gx), up = sy - gy;
      // touchable if standing nearby or via a small jump (apex reach ~2.5 tiles)
      if (dx <= 1 && up >= -1 && up <= 3) { ok = true; break; }
      if (dx <= 2 && up >= 0 && up <= 2) { ok = true; break; }
    }
    if (!ok) errs.push(`gem ${g.ayah} unreachable at tile ${gx},${gy}`);
  }

  // arch: reachable, on flat ground, with headroom
  const ax = Math.floor(L.arch.x / TILE);
  const ay = L.surface(ax);
  let archOk = false;
  for (const k of seen) {
    const [sx, sy] = k.split(',').map(Number);
    if (Math.abs(sx - ax) <= 2 && Math.abs(sy - ay) <= 1) { archOk = true; break; }
  }
  if (!archOk) errs.push('arch unreachable');
  for (let dy = 1; dy <= 4; dy++) if (get(ax, ay - dy) !== 0) errs.push('arch lacks headroom at -' + dy);
  for (const dx of [-1, 1]) if (Math.abs(L.surface(ax + dx) - ay) > 0) errs.push('arch ground not flat at ' + (ax + dx));

  // stones must sit in water; waterfalls must land on something
  for (const p of L.props) {
    if (p.type === 'stepStone') {
      const sx = Math.floor(p.x / TILE), sy = Math.floor(p.y / TILE);
      if (get(sx, sy + 1) !== 3) errs.push('stepping stone not over water at ' + sx);
    }
  }
  for (const wf of L.waterfalls) {
    if (wf.h <= 0) errs.push('degenerate waterfall at ' + wf.x);
  }
  // start headroom & flat
  const sx0 = Math.floor(L.start.x / TILE);
  for (let dy = 1; dy <= 3; dy++) if (get(sx0, startY - dy) !== 0) errs.push('start lacks headroom');

  const label = `${L.index + 1}. ${L.surah.englishName} (${L.title}) ${L.w}x${L.h}, ${L.gems.length} gems`;
  if (errs.length) { failures++; console.log('✗ ' + label); errs.forEach((e) => console.log('   - ' + e)); }
  else console.log('✓ ' + label + ` — reachable cells: ${seen.size}`);
}

process.exit(failures ? 1 : 0);
