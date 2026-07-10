// Headless preview — renders real frames of the game without a browser.
// Usage:  npm i @napi-rs/canvas   then   node tools/preview.mjs [outDir]
// Produces PNG screenshots of every scene for visual QA.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] || '/tmp/gol-shots';
fs.mkdirSync(OUT, { recursive: true });

// try to register fonts so headless text approximates the real thing
for (const dir of ['/usr/share/fonts', '/usr/local/share/fonts']) {
  try {
    for (const f of fs.readdirSync(dir, { recursive: true })) {
      if (/\.(ttf|otf)$/i.test(f)) GlobalFonts.registerFromPath(path.join(dir, String(f)));
    }
  } catch (e) {}
}

// ------------------------------------------------------------ browser shims
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
global.addEventListener = () => {};
global.location = { protocol: 'file:' };
try { global.navigator = {}; } catch (e) { /* node ≥21 exposes a getter-only navigator */ }
global.document = {
  getElementById: () => main,
  createElement: (tag) => {
    const c = createCanvas(1, 1);
    return c;
  }
};
global.localStorage = {
  _m: {},
  getItem(k) { return this._m[k] || null; },
  setItem(k, v) { this._m[k] = v; },
  removeItem(k) { delete this._m[k]; }
};
class FakeAudio {
  constructor() { this.paused = true; this.readyState = 4; this.currentTime = 0; this._ls = {}; }
  addEventListener(ev, fn) { (this._ls[ev] = this._ls[ev] || []).push(fn); }
  removeEventListener(ev, fn) { if (this._ls[ev]) this._ls[ev] = this._ls[ev].filter((f) => f !== fn); }
  play() {
    this.paused = false;
    // pretend each verse lasts ~250ms so full sequences really run
    this._t = setTimeout(() => {
      if (this.paused) return;
      this.paused = true;
      (this._ls.ended || []).slice().forEach((f) => f());
    }, 250);
    return { catch() {} };
  }
  pause() { this.paused = true; clearTimeout(this._t); }
  load() {}
}
global.Audio = FakeAudio;

for (const f of ['data', 'art', 'props', 'actors', 'audio', 'engine', 'levels', 'scenes', 'level', 'gate', 'room', 'main']) {
  require(path.join(ROOT, 'js', f + '.js'));
}
const GOL = global.GOL;

function pump(seconds) {
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps; i++) {
    NOW += 1000 / 60;
    const q = rafQ.splice(0);
    for (const fn of q) fn(NOW);
  }
}
function shot(name) {
  fs.writeFileSync(path.join(OUT, name + '.png'), main.toBuffer('image/png'));
  console.log('  📷 ' + name);
}
function scene() { // current scene name
  for (const k in GOL.SCENES) if (GOL.SCENES[k] === currentScene()) return k;
  return '?';
}
function currentScene() {
  // peek via the fade state: easiest is to check which scene's draw is running;
  // instead we track by GOL.go — good enough: read internal via title heuristics.
  return null;
}
const Input = GOL.Input;
const tap = (x, y) => Input.taps.push({ x, y });
const keys = (o) => { Object.assign(Input._keys, o); Input._syncKeys(); };

console.log('— title');
pump(1.2);
shot('01-title');

console.log('— map');
tap(VIEW_W / 2, VIEW_H / 2);
pump(0.1); pump(1.4);
shot('02-map');

console.log('— level: Al-Kawthar');
GOL.go('level', { index: 0 });
pump(1.6);
shot('03-kawthar-intro');
pump(2.2); // intro card fades
keys({ ArrowRight: true });
pump(1.9);
keys({ ArrowRight: false });
shot('04-kawthar-walk');
// walk to gem 1 (col 10) and hop
keys({ ArrowRight: true });
pump(0.7);
Input.queueJump();
pump(0.5);
keys({ ArrowRight: false });
pump(1.0);
const lvl = GOL.SCENES.level;
shot('05-kawthar-near-gem');
if (!lvl.overlay && lvl.found.length === 0) {
  // ensure the collect moment for the shot
  const g = lvl.L.gems[0];
  lvl.player.x = g.x; lvl.player.y = g.y + 20;
  pump(0.15);
}
pump(0.85); // into recite phase
shot('06-collect-recite');
if (lvl.overlay) { lvl.overlay.audioDone = true; lvl.overlay.t = 99; }
pump(0.5); pump(0.9);
shot('07-after-collect-hud');

console.log('— gate: sorting');
GOL.go('gate', { index: 0 });
pump(1.5);
shot('08-gate-sort');
const gate = GOL.SCENES.gate;
// drag one gem correctly for the held/placed look
const g1 = gate.gems.find((g) => g.ayah === 1);
g1.placed = 0;
pump(0.6);
shot('09-gate-one-placed');
for (const g of gate.gems) g.placed = g.ayah - 1;
gate.checkDone();
pump(1.8);
shot('10-gate-ignite');
gate.phase = 'open'; gate.openT = 0;
GOL.audio.sfx && pump(1.2);
shot('11-gate-open');
gate.phase = 'walk'; gate.walkT = 1.2;
pump(0.4);
shot('12-gate-walkthrough');

console.log('— map celebrate');
pump(1.6);
shot('13-map-celebrate');

console.log('— recitation room');
// pretend two surahs are gathered
const st1 = GOL.store.level(108); st1.found = [1, 2, 3]; st1.completed = true;
const st2 = GOL.store.level(112); st2.found = [1, 3];
GOL.go('room');
pump(1.4);
shot('14-room');

console.log('— parents');
GOL.go('parents');
pump(1.2);
shot('15-parents-gate');
GOL.SCENES.parents.open = true;
pump(0.3);
shot('16-parents-stats');

console.log('— Al-Falaq dawn gradient');
GOL.go('level', { index: 3 });
pump(1.2);
const l4 = GOL.SCENES.level;
l4.intro = 0;
l4.player.x = GOL.LEVELS[3].w * GOL.TILE * 0.16;
l4.cam = null;
pump(0.6);
shot('17-falaq-dim');
l4.player.x = GOL.LEVELS[3].w * GOL.TILE * 0.62;
l4.cam = null;
pump(0.6);
shot('18-falaq-bright');

console.log('— An-Nas village');
GOL.go('level', { index: 4 });
pump(1.2);
const l5 = GOL.SCENES.level;
l5.intro = 0;
l5.player.x = 42 * GOL.TILE; l5.cam = null;
pump(0.7);
shot('19-nas-village');

console.log('— Al-Fatiha courtyard');
GOL.go('level', { index: 5 });
pump(1.2);
const l6 = GOL.SCENES.level;
l6.intro = 0;
l6.player.x = 97 * GOL.TILE; l6.cam = null;
pump(0.7);
shot('20-fatiha-courtyard');

console.log('done →', OUT);
