// v3 level integrity checker — run from the repo root:
//   node v3/tools/check.mjs        (checks every prototype AND world present)
//   node v3/tools/check.mjs 7      (checks only prototype p7)
//   node v3/tools/check.mjs w2     (checks only world 2)
// Simulates reachability with the game's generous jump (≈3 tiles up, ≈4
// across; bounce blossoms higher), including riding leaves and rafts, and
// verifies every gem, the campfire, and the shrine door can be reached.
import { createRequire } from 'module';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const V3 = join(dirname(fileURLToPath(import.meta.url)), '..');

global.window = global;
global.addEventListener = () => {};
global.document = { createElement: () => ({ getContext: () => null, width: 0, height: 0 }) };

require(join(V3, '..', 'js', 'data.js'));
require(join(V3, 'js', 'core', 'art.js'));
require(join(V3, 'js', 'dsl.js'));

const GOL = global.GOL;
GOL.V3 = { surah: null };
const TILE = GOL.TILE;

// GOL.store is only touched by worlds.js helpers at runtime; stub it here
GOL.store = { data: {} };
const arg = process.argv[2] || null;
const worldMode = arg && arg[0] === 'w';
const only = arg && !worldMode ? parseInt(arg, 10) : null;
const onlyWorld = worldMode ? parseInt(arg.slice(1), 10) : null;

// load the world registry + any world recipe files present
require(join(V3, 'js', 'worlds.js'));
import { readdirSync } from 'fs';
const worldFiles = existsSync(join(V3, 'js', 'worlds'))
  ? readdirSync(join(V3, 'js', 'worlds')).filter((f) => f.endsWith('.js'))
  : [];
for (const f of worldFiles) require(join(V3, 'js', 'worlds', f));

let failures = 0, checked = 0;

const targets = [];
if (only) targets.push({ kind: 'p', id: only });
else if (onlyWorld) targets.push({ kind: 'w', id: onlyWorld });
else {
  // (the ten prototypes retired 2026-07-12 — worlds are the only default
  // targets now; `check.mjs pN` still errors helpfully if asked for one)
  (GOL.WORLDS3 || []).forEach((w) => { if (w && w.build) targets.push({ kind: 'w', id: w.n }); });
}

for (const tgt of targets) {
  const id = tgt.id;
  let def, tag;
  if (tgt.kind === 'p') {
    tag = 'p' + id;
    const file = join(V3, 'js', 'prototypes', 'p' + id + '.js');
    if (!existsSync(file)) {
      if (only) { console.log('✗ p' + id + '.js does not exist'); failures++; }
      continue;
    }
    require(file);
    def = GOL.PROTOTYPES[id];
    if (!def) { console.log('✗ p' + id + '.js did not register GOL.PROTOTYPES[' + id + ']'); failures++; continue; }
  } else {
    tag = 'w' + id;
    def = (GOL.WORLDS3 || [])[id - 1];
    if (!def || !def.build) { console.log('✗ world ' + id + ' has no build() recipe registered'); failures++; continue; }
  }
  checked++;

  let L;
  try { L = GOL.buildPrototype(def); }
  catch (e) { console.log('✗ ' + tag + ' build threw: ' + e.message); failures++; continue; }

  const errs = [];
  if (!GOL.PALETTES[def.palette]) errs.push('unknown palette "' + def.palette + '"');
  if (def.endPalette && !GOL.PALETTES[def.endPalette]) errs.push('unknown endPalette "' + def.endPalette + '"');

  const get = (x, y) => (x < 0 || x >= L.w ? 1 : y < 0 ? 0 : y >= L.h ? 3 : L.tiles[y * L.w + x]);
  // 5 is the offering stone: solid (standable) until stood upon, then its
  // whole contiguous group opens — the walk below runs to fixpoint over that
  const standable = (x, y) =>
    (get(x, y) === 1 || get(x, y) === 2 || get(x, y) === 4 || get(x, y) === 5) && get(x, y - 1) === 0 && get(x, y - 2) === 0;

  // offering-stone lids: gather the contiguous 4-neighbor tile-5 groups now,
  // so reaching a standing spot on any group can open it (tiles → air)
  const lidGroups = [];
  {
    const grouped = new Set();
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
      if (get(x, y) !== 5 || grouped.has(x + ',' + y)) continue;
      const cells = [];
      const lq = [[x, y]];
      grouped.add(x + ',' + y);
      while (lq.length) {
        const [cx, cy] = lq.pop();
        cells.push([cx, cy]);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy, k = nx + ',' + ny;
          if (nx < 0 || nx >= L.w || ny < 0 || ny >= L.h || grouped.has(k)) continue;
          if (get(nx, ny) !== 5) continue;
          grouped.add(k);
          lq.push([nx, ny]);
        }
      }
      lidGroups.push({ cells, open: false });
    }
  }

  if (!L.start) errs.push('no start');
  if (!L.campfire) errs.push('no campfire');
  if (!L.door) errs.push('no door');

  const startX = Math.floor(L.start.x / TILE);
  const startY = L.surface(startX);
  const key = startX + ',' + startY;
  const JUMP_UP = 3, JUMP_ACROSS = 4;
  const padAt = new Set((L.pads || []).map((p) => p.tx + ',' + p.ty));

  // flood-fill to fixpoint: whenever the walker can stand on a closed lid
  // group, the group opens (its tiles become air) and the flood runs again —
  // opening a lid may reveal standing room that reaches the next one
  let seen;
  for (let pass = 0; ; pass++) {
    // nodes: standable cells, plus cells along every mover's path (leaf/raft
    // tops are places the player can stand)
    const nodes = new Set();
    for (let x = 0; x < L.w; x++) for (let y = 0; y < L.h; y++) if (standable(x, y)) nodes.add(x + ',' + y);
    for (const m of L.moverDefs || []) {
      if (m.kind === 'h' || m.kind === 'raft') {
        const row = Math.floor(m.y / TILE);
        for (let x = Math.floor(m.x0 / TILE); x <= Math.floor(m.x1 / TILE); x++) nodes.add(x + ',' + row);
      } else {
        const col = Math.floor(m.x / TILE);
        for (let r = Math.floor(m.y0 / TILE); r <= Math.floor(m.y1 / TILE); r++) nodes.add(col + ',' + r);
      }
    }
    if (pass === 0 && !nodes.has(key)) errs.push('start not standable at ' + key);
    seen = new Set([key]);
    const q = [[startX, startY]];
    while (q.length) {
      const [x, y] = q.shift();
      const onPad = padAt.has(x + ',' + y);
      const upMax = onPad ? 6 : JUMP_UP;
      for (let dx = -JUMP_ACROSS; dx <= JUMP_ACROSS; dx++) {
        for (let dy = -upMax; dy <= L.h; dy++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= L.w || ny < 0 || ny >= L.h) continue;
          if (dy < 0 && Math.abs(dx) + Math.abs(dy) > (onPad ? 8 : 5)) continue;
          if (dy > 0 && Math.abs(dx) > JUMP_ACROSS) continue;
          const k = nx + ',' + ny;
          if (!nodes.has(k) || seen.has(k)) continue;
          seen.add(k);
          q.push([nx, ny]);
        }
      }
    }
    let openedAny = false;
    for (const g of lidGroups) {
      if (g.open || !g.cells.some(([cx, cy]) => seen.has(cx + ',' + cy))) continue;
      g.open = true;
      openedAny = true;
      for (const [cx, cy] of g.cells) L.tiles[cy * L.w + cx] = 0;
    }
    if (!openedAny) break;
  }
  for (const g of lidGroups) {
    if (!g.open) errs.push('offering stone never openable (no reachable standing spot) at ' + g.cells[0][0] + ',' + g.cells[0][1]);
  }

  const airReach = (gx, gy) => {
    for (const k of seen) {
      const [sx, sy] = k.split(',').map(Number);
      const dx = Math.abs(sx - gx), up = sy - gy;
      if (dx <= 1 && up >= -1 && up <= 3) return true;
      if (dx <= 2 && up >= 0 && up <= 2) return true;
      if (padAt.has(k) && dx <= 1 && up >= 0 && up <= 7) return true;
    }
    return false;
  };

  const verses = L.surah.verses.length;
  if (L.gems.length !== verses) errs.push(`gem count ${L.gems.length} != verses ${verses}`);
  const ayahs = new Set(L.gems.map((g) => g.ayah));
  for (let n = 1; n <= verses; n++) if (!ayahs.has(n)) errs.push('missing gem for ayah ' + n);

  for (const g of L.gems) {
    const gx = Math.floor(g.x / TILE), gy = Math.floor(g.y / TILE);
    if (get(gx, gy) !== 0) errs.push(`gem ${g.ayah} embedded in tile ${get(gx, gy)} at ${gx},${gy}`);
    if (!airReach(gx, gy)) errs.push(`gem ${g.ayah} unreachable at tile ${gx},${gy}`);
  }

  // campfire and door: reachable, flat, headroom (the arch is ~4 tiles tall,
  // the campfire scene needs sky for the flame and the seated hero)
  const spotCheck = (pos, name, headroom) => {
    if (!pos) return;
    const ax = Math.floor(pos.x / TILE);
    const ay = L.surface(ax);
    let ok = false;
    for (const k of seen) {
      const [sx, sy] = k.split(',').map(Number);
      if (Math.abs(sx - ax) <= 2 && Math.abs(sy - ay) <= 1) { ok = true; break; }
    }
    if (!ok) errs.push(name + ' unreachable');
    for (let dy = 1; dy <= headroom; dy++) if (get(ax, ay - dy) !== 0) errs.push(name + ' lacks headroom at -' + dy);
    for (const dx of [-1, 1]) if (Math.abs(L.surface(ax + dx) - ay) > 0) errs.push(name + ' ground not flat at ' + (ax + dx));
  };
  spotCheck(L.campfire, 'campfire', 3);
  spotCheck(L.door, 'door', 4);
  if (L.campfire && L.door && L.door.x <= L.campfire.x + TILE * 2) {
    errs.push('door should stand a few tiles past the campfire (walk onward after the recitation)');
  }

  // Resumable camp shrines are real gates, so their metadata must describe a
  // strictly rising, reachable sequence before the final ayah/campfire.
  if (L.campShrines && L.campShrines.length) {
    let prevAyah = 0;
    for (let i = 0; i < L.campShrines.length; i++) {
      const c = L.campShrines[i];
      if (!Number.isInteger(c.afterAyah) || c.afterAyah <= prevAyah || c.afterAyah >= verses) {
        errs.push(`camp shrine ${i + 1} has invalid afterAyah ${c.afterAyah}`);
      }
      if (!Number.isInteger(c.x) || c.x < 0 || c.x >= L.w || !Number.isInteger(c.row) || c.row < 1 || c.row >= L.h) {
        errs.push(`camp shrine ${i + 1} has invalid position ${c.x},${c.row}`);
      } else {
        const ck = c.x + ',' + c.row;
        if (!nodes.has(ck)) errs.push(`camp shrine ${i + 1} not standable at ${ck}`);
        if (!seen.has(ck)) errs.push(`camp shrine ${i + 1} unreachable at ${ck}`);
      }
      const start = i === 0 ? 1 : prevAyah;
      if (c.afterAyah - start + 1 <= 0) errs.push(`camp shrine ${i + 1} has empty recall range`);
      prevAyah = c.afterAyah;
    }
  }

  // the memory stone (a callback to an earlier surah) must be reachable
  if (L.memory) {
    const mx = Math.floor(L.memory.x / TILE);
    const my = L.surface(mx);
    let ok = false;
    for (const k of seen) {
      const [sx, sy] = k.split(',').map(Number);
      if (Math.abs(sx - mx) <= 2 && Math.abs(sy - my) <= 1) { ok = true; break; }
    }
    if (!ok) errs.push('memory stone unreachable');
    for (let dy = 1; dy <= 2; dy++) if (get(mx, my - dy) !== 0) errs.push('memory stone lacks air at -' + dy);
    // an unaimed stone (surahId null) is valid — the engine aims it at the
    // least-recently-remembered completed surah (adventure.enter)
    if (L.memory.surahId != null && !window.GOL_DATA.surahs.find((s) => s.id === L.memory.surahId)) errs.push('memory stone names unknown surah ' + L.memory.surahId);
  }

  for (const p of L.props) {
    if (p.type === 'stepStone') {
      const sx = Math.floor(p.x / TILE), sy = Math.floor(p.y / TILE);
      if (get(sx, sy + 1) !== 3) errs.push('stepping stone not over water at ' + sx);
    }
  }
  for (const wf of L.waterfalls) if (wf.h <= 0) errs.push('degenerate waterfall at ' + wf.x);
  // a raft must ride ABOVE the waterline: its deck row in air, water beneath
  // (a deck row inside the water bounces the rider into the rescue — w3 bug)
  for (const m of L.moverDefs || []) {
    if (m.kind !== 'raft') continue;
    const row = Math.floor(m.y / TILE);
    for (let x = Math.floor(m.x0 / TILE); x <= Math.floor(m.x1 / TILE); x++) {
      if (get(x, row) === 3) { errs.push('raft deck is underwater at ' + x + ',' + row + ' — use the row above the water surface'); break; }
    }
  }
  for (const p of L.pads || []) {
    if (!seen.has(p.tx + ',' + p.ty)) errs.push('bounce blossom unreachable at ' + p.tx);
    for (let dy = 1; dy <= 5; dy++) if (get(p.tx, p.ty - dy) !== 0) errs.push('bounce blossom lacks sky at ' + p.tx + ' (-' + dy + ')');
  }
  for (const s of L.seeds || []) {
    const sx = Math.floor(s.x / TILE), sy = Math.floor(s.y / TILE);
    if (get(sx, sy) !== 0 && get(sx, sy) !== 2) errs.push('seed embedded in tile ' + get(sx, sy) + ' at ' + sx + ',' + sy);
    if (!airReach(sx, sy)) errs.push('seed out of reach at ' + sx + ',' + sy);
  }
  if (L.blossom) {
    const bx = Math.floor(L.blossom.x / TILE), by = Math.floor(L.blossom.y / TILE);
    if (get(bx, by) !== 0) errs.push('blossom embedded in tile at ' + bx + ',' + by);
    if (!airReach(bx, by)) errs.push('hidden blossom unreachable at ' + bx + ',' + by);
  } else errs.push('level has no hidden blossom');
  if ((L.seeds || []).length < 14) errs.push('too few noor seeds (' + (L.seeds || []).length + ') — the trail should sing');
  const sx0 = Math.floor(L.start.x / TILE);
  for (let dy = 1; dy <= 3; dy++) if (get(sx0, startY - dy) !== 0) errs.push('start lacks headroom');

  const label = `${tag} ${def.name} (${def.key}) ${L.w}x${L.h}, ${L.gems.length} gems, ` +
    `${(L.seeds || []).length} seeds, ${(L.pads || []).length} bounce, ${(L.moverDefs || []).length} movers` +
    (L.weather ? ', weather:' + L.weather : '') + (L.occluders && L.occluders.length ? ', ' + L.occluders.length + ' occluders' : '') +
    (lidGroups.length ? ', ' + lidGroups.length + ' lids' : '');
  if (errs.length) { failures++; console.log('✗ ' + label); errs.forEach((e) => console.log('   - ' + e)); }
  else console.log('✓ ' + label + ` — reachable cells: ${seen.size}`);
}

if (!checked && !only) console.log('(no prototype files found)');

// entry-point cache-version parity is a whole-repo invariant, so a full run
// (no arg) also verifies root and /v3/ never drift out of sync.
if (!arg) {
  const { execFileSync } = require('child_process');
  try {
    execFileSync(process.execPath, [join(V3, 'tools', 'check-entry-parity.mjs')], { stdio: 'inherit' });
    execFileSync(process.execPath, [join(V3, 'tools', 'test-onboarding-contract.mjs')], { stdio: 'inherit' });
    execFileSync(process.execPath, [join(V3, 'tools', 'test-journey-stage-onboarding.mjs')], { stdio: 'inherit' });
    execFileSync(process.execPath, [join(V3, 'tools', 'test-showcase-contract.mjs')], { stdio: 'inherit' });
  } catch (e) {
    failures++;
  }
}

process.exit(failures ? 1 : 0);
