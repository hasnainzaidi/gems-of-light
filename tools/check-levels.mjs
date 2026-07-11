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
  const padAt = new Set((L.pads || []).map((p) => p.tx + ',' + p.ty));
  while (q.length) {
    const [x, y] = q.shift();
    const onPad = padAt.has(x + ',' + y);
    // a bounce blossom springs you far higher than a jump
    const upMax = onPad ? 6 : JUMP_UP;
    for (let dx = -JUMP_ACROSS; dx <= JUMP_ACROSS; dx++) {
      for (let dy = -upMax; dy <= L.h; dy++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= L.w || ny < 0 || ny >= L.h) continue;
        // generosity envelope: high jumps can't also be max distance
        if (dy < 0 && Math.abs(dx) + Math.abs(dy) > (onPad ? 8 : 5)) continue;
        if (dy > 0 && Math.abs(dx) > JUMP_ACROSS) continue;
        const k = nx + ',' + ny;
        if (!nodes.has(k) || seen.has(k)) continue;
        seen.add(k);
        q.push([nx, ny]);
      }
    }
  }
  // air cells touchable from the reachable set (walk-by, jump, pad launch,
  // or riding a drifting leaf)
  const airReach = (gx, gy) => {
    for (const k of seen) {
      const [sx, sy] = k.split(',').map(Number);
      const dx = Math.abs(sx - gx), up = sy - gy;
      if (dx <= 1 && up >= -1 && up <= 3) return true;
      if (dx <= 2 && up >= 0 && up <= 2) return true;
      if (padAt.has(k) && dx <= 1 && up >= 0 && up <= 7) return true; // straight up off a bounce
    }
    for (const m of L.moverDefs || []) {
      if (m.kind === 'h') {
        const row = Math.floor(m.y / TILE);
        const x0 = Math.floor(m.x0 / TILE) - 1, x1 = Math.floor(m.x1 / TILE) + 1;
        if (gx >= x0 && gx <= x1 && row - gy >= -1 && row - gy <= 4) return true;
      } else {
        const col = Math.floor(m.x / TILE);
        const r0 = Math.floor(m.y0 / TILE), r1 = Math.floor(m.y1 / TILE);
        if (Math.abs(gx - col) <= 1 && gy >= r0 - 4 && gy <= r1 + 1) return true;
      }
    }
    return false;
  };

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

  // journey ingredients: pads stand on reachable ground with sky above,
  // every seed is gatherable, the hidden blossom can truly be found
  for (const p of L.pads || []) {
    if (!seen.has(p.tx + ',' + p.ty)) errs.push('bounce blossom unreachable at ' + p.tx);
    for (let dy = 1; dy <= 5; dy++) if (get(p.tx, p.ty - dy) !== 0) errs.push('bounce blossom lacks sky at ' + p.tx + ' (-' + dy + ')');
  }
  let seedsLost = 0;
  for (const s of L.seeds || []) {
    const sx = Math.floor(s.x / TILE), sy = Math.floor(s.y / TILE);
    if (get(sx, sy) !== 0 && get(sx, sy) !== 2) errs.push('seed embedded in tile ' + get(sx, sy) + ' at ' + sx + ',' + sy);
    if (!airReach(sx, sy)) { seedsLost++; errs.push('seed out of reach at ' + sx + ',' + sy); }
  }
  if (L.blossom) {
    const bx = Math.floor(L.blossom.x / TILE), by = Math.floor(L.blossom.y / TILE);
    if (get(bx, by) !== 0) errs.push('blossom embedded in tile at ' + bx + ',' + by);
    if (!airReach(bx, by)) errs.push('hidden blossom unreachable at ' + bx + ',' + by);
  } else {
    errs.push('level has no hidden blossom');
  }
  if ((L.seeds || []).length < 14) errs.push('too few noor seeds (' + (L.seeds || []).length + ') — the trail should sing');
  // start headroom & flat
  const sx0 = Math.floor(L.start.x / TILE);
  for (let dy = 1; dy <= 3; dy++) if (get(sx0, startY - dy) !== 0) errs.push('start lacks headroom');

  const label = `${L.index + 1}. ${L.surah.englishName} (${L.title}) ${L.w}x${L.h}, ` +
    `${L.gems.length} gems, ${(L.seeds || []).length} seeds, ${(L.pads || []).length} bounce, ${(L.moverDefs || []).length} leaf`;
  if (errs.length) { failures++; console.log('✗ ' + label); errs.forEach((e) => console.log('   - ' + e)); }
  else console.log('✓ ' + label + ` — reachable cells: ${seen.size}`);
}

// ---- worlds: every built level must live in exactly one world, in order
{
  const errs = [];
  const covered = GOL.WORLDS.flatMap((w) => w.levels);
  if (new Set(covered).size !== covered.length) errs.push('a level is listed in more than one world');
  for (const L of GOL.LEVELS) if (!covered.includes(L.index)) errs.push(`level "${L.key}" (${L.index}) belongs to no world`);
  GOL.WORLDS.forEach((w, wi) => {
    for (let i = 1; i < w.levels.length; i++) {
      if (w.levels[i] !== w.levels[i - 1] + 1) errs.push(`world ${wi + 1} levels are not consecutive (${w.levels.join(',')}) — unlock order walks the path left to right`);
    }
    if (wi > 0) {
      const prev = GOL.WORLDS[wi - 1];
      if (w.levels[0] !== prev.levels[prev.levels.length - 1] + 1) errs.push(`world ${wi + 1} does not continue where world ${wi} ends`);
    }
    if (!GOL.PALETTES[w.palette]) errs.push(`world ${wi + 1} names unknown palette "${w.palette}"`);
  });
  const label = `worlds: ${GOL.WORLDS.map((w) => w.name + ' (' + w.levels.length + ')').join(' · ')}`;
  if (errs.length) { failures++; console.log('✗ ' + label); errs.forEach((e) => console.log('   - ' + e)); }
  else console.log('✓ ' + label);
}

process.exit(failures ? 1 : 0);
