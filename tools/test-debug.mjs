// Debug-mode (?debug=1) speed-run tests: every level open, no recitation,
// no collect cards, no gate sorting — the whole game traversable in seconds,
// and the real save never written.
//   node tools/test-debug.mjs           run everything
//   node tools/test-debug.mjs 7         run one test (comma list works)
//   LEVELS=3-5 node tools/test-debug.mjs 7   speed-run only some levels
//   (LEVELS chunks keep long runs inside tight-memory sandboxes)
// Requires @napi-rs/canvas (same as preview.mjs / test-flow.mjs).
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

if (typeof global.gc !== 'function') {
  const r = spawnSync(process.execPath, ['--expose-gc', fileURLToPath(import.meta.url), ...process.argv.slice(2)], { stdio: 'inherit' });
  process.exit(r.status == null ? 1 : r.status);
}

const require = createRequire(import.meta.url);
const { createCanvas } = require('@napi-rs/canvas');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const VIEW_W = 1180, VIEW_H = 820;
const main = createCanvas(VIEW_W, VIEW_H);
main.style = {};
main.addEventListener = () => {};
main.getBoundingClientRect = () => ({ left: 0, top: 0, width: VIEW_W, height: VIEW_H });
main.setPointerCapture = () => {};

let NOW = 0;
const rafQ = [];
global.window = global;
global.devicePixelRatio = 1;
global.innerWidth = VIEW_W;
global.innerHeight = VIEW_H;
global.performance = { now: () => NOW };
global.requestAnimationFrame = (fn) => rafQ.push(fn);
// functional window listeners, so the debug hotkeys can be exercised
const winListeners = {};
global.addEventListener = (ev, fn) => (winListeners[ev] = winListeners[ev] || []).push(fn);
global.dispatchKey = (type, key) => (winListeners[type] || []).forEach((fn) => fn({ key, repeat: false, preventDefault() {} }));
global.location = { protocol: 'file:', search: '?debug=1' }; // <-- debug on
global.document = { getElementById: () => main, createElement: () => createCanvas(1, 1) };
global.localStorage = {
  _m: {}, writes: 0,
  getItem(k) { return this._m[k] || null; },
  setItem(k, v) { this._m[k] = v; this.writes++; },
  removeItem(k) { delete this._m[k]; }
};

class FakeAudio {
  constructor() { this.paused = true; this.readyState = 4; this.currentTime = 0; this._ls = {}; }
  addEventListener(ev, fn) { (this._ls[ev] = this._ls[ev] || []).push(fn); }
  removeEventListener(ev, fn) { if (this._ls[ev]) this._ls[ev] = this._ls[ev].filter((f) => f !== fn); }
  play() {
    this.paused = false;
    FakeAudio.plays++;
    this._t = setTimeout(() => {
      if (this.paused) return;
      this.paused = true;
      (this._ls.ended || []).slice().forEach((f) => f());
    }, 120);
    return { catch() {} };
  }
  pause() { this.paused = true; clearTimeout(this._t); }
  load() {}
}
FakeAudio.plays = 0;
global.Audio = FakeAudio;

for (const f of ['data', 'art', 'props', 'actors', 'audio', 'engine', 'levels', 'scenes', 'level', 'gate', 'room', 'modes', 'debug', 'main']) {
  require(path.join(ROOT, 'js', f + '.js'));
}
const GOL = global.GOL;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let _frames = 0;
async function pumpFor(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    NOW += 1000 / 60;
    rafQ.splice(0).forEach((fn) => fn(NOW));
    // sweep native canvas snapshots every few frames — the sandbox this
    // runs in is tighter on memory than a laptop, and six full levels of
    // prepainted terrain add up fast
    if (global.gc && ++_frames % 10 === 0) global.gc();
    await sleep(8);
  }
}
async function pumpUntil(cond, maxMs, label) {
  const end = Date.now() + maxMs;
  while (Date.now() < end) {
    if (cond()) return true;
    await pumpFor(60);
  }
  console.log('  … timed out waiting for ' + label);
  return false;
}
let failures = 0;
const ONLY = process.argv[2] || '';
const runTest = (id) => !ONLY || ONLY.split(',').includes(String(id));
const check = (name, ok) => {
  console.log((ok ? '✓ ' : '✗ ') + name);
  if (!ok) failures++;
};

// The world map is mid-rewrite (walk-along-path, multi-world); its draw is
// not under test here, so keep the harness clear of its WIP internals.
GOL.SCENES.map.draw = function () {};

// ---- 1. debug flag, open world, protected save
if (runTest(1)) {
  check('GOL.DEBUG is on under ?debug=1', GOL.DEBUG === true);
  check('every level reads as open (even the last)', GOL.store.isOpen(5) && GOL.store.isOpen(3));
  GOL.store.save();
  check('store.save is inert (no localStorage writes)', global.localStorage.writes === 0);
}

// ---- 2. title → map, fast fades (always runs: it boots the game)
await pumpFor(800);
GOL.Input.taps.push({ x: 600, y: 420 });
const toMap = await pumpUntil(() => GOL.sceneName === 'map', 2500, 'map');
if (runTest(2)) check('title tap reaches the map quickly', toMap);

// ---- 3. arriving at any garden — locked, fresh, whatever — offers all ways
if (runTest(3)) {
  const map = GOL.SCENES.map;
  if (typeof map.arrive === 'function') {
    map.arrive(5); // Al-Fatiha — normally locked at first boot
    check('arrive() opens the ways-in panel for an uncompleted garden', map.panelNode === 5);
    map.panelNode = -1;
  } else {
    console.log('  (map has no arrive() — skipping panel check)');
  }
  GOL.go('level', { index: 5 });
  const inLevel = await pumpUntil(() => GOL.sceneName === 'level' && GOL.SCENES.level.L && GOL.SCENES.level.L.index === 5, 2500, 'level 6');
  check('a normally-locked level opens directly', inLevel);
}

// ---- 4. debug collect: no card, no echo, no recitation
if (runTest(4)) {
  const lvl = GOL.SCENES.level;
  check('no intro card in debug', lvl.intro <= 0);
  const before = FakeAudio.plays;
  const g0 = lvl.L.gems[0];
  lvl.player.x = g0.x; lvl.player.y = g0.y + 16; lvl.player.vy = 0;
  await pumpFor(200);
  check('gem collects by touch with no overlay card', lvl.found.length === 1 && !lvl.overlay);
  check('no recitation audio was played', FakeAudio.plays === before);
  lvl.debugCollectAll();
  check('G sweeps up every gem (' + lvl.found.length + '/' + lvl.L.gems.length + ')', lvl.found.length === lvl.L.gems.length);
  lvl.debugWarpArch();
  const atGate = await pumpUntil(() => GOL.sceneName === 'gate', 2500, 'gate');
  check('E warps to the arch and the gate opens', atGate);
}

// ---- 5. the gate: no sorting, ceremony compressed, unlocks still chain
if (runTest(5)) {
  const gate = GOL.SCENES.gate;
  check('gate skips the sorting (gems arrive placed)', gate.prePlaced && gate.phase !== 'sort');
  const t0 = NOW;
  const done = await pumpUntil(() => GOL.sceneName === 'map', 9000, 'map after ceremony');
  const secs = ((NOW - t0) / 1000).toFixed(1);
  check('ceremony flows through on its own (' + secs + 's simulated)', done && NOW - t0 < 6000);
  check('completion + unlock chain still work in memory', GOL.store.level(1).completed === true && GOL.store.data.unlocked === 5);
  check('…but the real save was never written', global.localStorage.writes === 0);
}

// ---- 6. hotkeys: level jump and sprint
if (runTest(6)) {
  global.dispatchKey('keydown', '3');
  const jumped = await pumpUntil(() => GOL.sceneName === 'level' && GOL.SCENES.level.L.index === 2, 2500, 'level 3 via hotkey');
  check('pressing 3 jumps straight into level 3', jumped);
  const base = GOL.PHYS.WALK;
  global.dispatchKey('keydown', 'Shift');
  const sprinting = GOL.PHYS.WALK > base * 2;
  global.dispatchKey('keyup', 'Shift');
  check('Shift sprints (walk ' + base + ' → ' + Math.round(base * 2.4) + ') and releases', sprinting && GOL.PHYS.WALK === base);
}

// ---- 7. the full speed run: every garden, end to end
if (runTest(7)) {
  const [L0, L1] = (process.env.LEVELS || '0-5').split('-').map(Number);
  const t0 = NOW;
  for (let i = L0; i <= L1; i++) {
    GOL.go('level', { index: i });
    await pumpUntil(() => GOL.sceneName === 'level' && GOL.SCENES.level.L.index === i, 2500, 'level ' + (i + 1));
    const lvl = GOL.SCENES.level;
    lvl.debugCollectAll();
    lvl.debugWarpArch();
    await pumpUntil(() => GOL.sceneName === 'map', 9000, 'map after level ' + (i + 1));
  }
  const secs = ((NOW - t0) / 1000).toFixed(1);
  const range = GOL.LEVELS.slice(L0, L1 + 1);
  const allDone = range.every((L) => GOL.store.level(L.surahId).completed);
  check('levels ' + (L0 + 1) + '–' + (L1 + 1) + ' speed-run end to end in ' + secs + 's simulated', allDone && NOW - t0 < 60000);
  if (L1 >= 5) check('completing the last garden leaves everything unlocked', GOL.store.data.unlocked === 5);
  check('save still untouched after the run', global.localStorage.writes === 0);
}

// ---- 8. moon trial in debug: prompts are silent, rewards are quick
if (runTest(8)) {
  GOL.go('trial', { index: 0 });
  await pumpUntil(() => GOL.sceneName === 'trial', 2500, 'trial');
  const trial = GOL.SCENES.trial;
  const before = FakeAudio.plays;
  trial.picked = trial.choiceState.find((c) => c.ayah === trial.q.correct);
  trial.judge(VIEW_W, VIEW_H);
  check('trial judges without recitation audio', FakeAudio.plays === before && trial.phase === 'reward');
  const advanced = await pumpUntil(() => trial.qi === 1 && trial.phase === 'ask', 2500, 'next question');
  check('reward passes quickly to the next question', advanced);
}

console.log(failures ? '\n' + failures + ' failing' : '\nall good');
process.exit(failures ? 1 : 0);
