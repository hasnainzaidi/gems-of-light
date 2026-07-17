// Headless smoke test for scene-only prototype labs — run from repo root:
//   node v3/tools/lab-smoke.mjs 20
// (check.mjs pN only understands level-building prototypes; this harness is
// the machine gate for pure SCENE labs like the Quraysh learning rooms.)
//
// It stubs the browser surface (canvas ctx, Audio, GOL.Input, GOL.audio),
// loads the real art/dsl/word-timing modules, then drives the scene the way
// boot.js would: enter → ~12 simulated seconds of update/draw at 60fps with
// bursts of random taps and drags → exit. Any thrown error fails the run.
// Fake audio "finishes" each play a few frames later so onend-driven scene
// logic advances. This can't judge feel — only that the room never crashes
// and always keeps drawing.
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const V3 = join(dirname(fileURLToPath(import.meta.url)), '..');

const N = parseInt(process.argv[2] || '', 10);
if (!N) { console.log('usage: node v3/tools/lab-smoke.mjs <labNumber>'); process.exit(2); }

// ------------------------------------------------------- browser stubs ----
global.window = global;
global.addEventListener = () => {};
global.location = { search: '' };
Object.defineProperty(global, 'navigator', { value: {}, configurable: true });
class FakeAudio {
  constructor() { this.paused = true; this.readyState = 4; this.currentTime = 0; this.ended = false; }
  play() { this.paused = false; return { catch: () => {} }; }
  pause() { this.paused = true; }
  load() { if (this.onloadedmetadata) this.onloadedmetadata(); }
  setAttribute() {}
  addEventListener() {}
  removeEventListener() {}
}
global.Audio = FakeAudio;
global.document = { createElement: () => ({ getContext: () => null, width: 0, height: 0 }) };

// a canvas 2d context that absorbs everything
const ctxStub = new Proxy({}, {
  get(t, prop) {
    if (prop === 'canvas') return { width: 800, height: 450 };
    if (prop === 'createLinearGradient' || prop === 'createRadialGradient')
      return () => ({ addColorStop() {} });
    if (prop === 'measureText') return () => ({ width: 10 });
    if (prop === 'getTransform') return () => ({ a: 1, d: 1 });
    return typeof t[prop] !== 'undefined' ? t[prop] : () => {};
  },
  set(t, prop, v) { t[prop] = v; return true; }
});

// -------------------------------------------------------- real modules ----
require(join(V3, '..', 'js', 'data.js'));
require(join(V3, 'js', 'core', 'art.js'));
require(join(V3, 'js', 'dsl.js'));
const GOL = global.GOL;

GOL.DEBUG = false;
GOL.SAFE = { l: 0, r: 0, t: 0, b: 0 };
// helpers that live in engine.js / actors.js / props.js (not loaded here:
// they attach to a real canvas) — faithful math, no-op drawing
GOL.dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
GOL.rnd = (a, b) => a + Math.random() * (b - a);
GOL.ease = { inOut: (t) => t * t * (3 - 2 * t), out: (t) => 1 - Math.pow(1 - t, 3), in: (t) => t * t * t };
for (const fn of ['drawArch', 'drawBird', 'drawBounceBlossom', 'drawButterfly', 'drawButton',
  'drawDriftLeaf', 'drawFountain', 'drawFirefly', 'drawGem', 'drawHudBand', 'drawMoon',
  'drawPanel', 'drawRahmaBlossom', 'drawSeed', 'drawSprite', 'drawTortoise',
  'drawTouchControls', 'drawVeiledGem', 'drawWater', 'drawWaterfall']) GOL[fn] = () => {};
GOL.roundRect = () => {};
// helpers that live in ui.js (which needs a real DOM) — harmless fallbacks
GOL.text = () => {};
GOL.todayKey = () => '2026-01-01';
GOL.hitButtons = () => null;
GOL.muteButton = () => ({ x: 0, y: 0, w: 0, h: 0 });
GOL.homeButton = () => ({ x: 0, y: 0, w: 0, h: 0 });
GOL.touchZones = () => ({});
GOL.drawBackdrop = () => {};
GOL.TUNE = GOL.TUNE || {};
GOL.SCENES = {};
GOL.registerScene = (name, s) => (GOL.SCENES[name] = s);
GOL.PROTOTYPES = GOL.PROTOTYPES || {};
GOL.sceneName = '';
GOL.go = () => {};
GOL.store = { data: {}, save() {}, reset() {} };
GOL.V3 = GOL.V3 || { reciter: 'alafasy', surah: null };
GOL.RECITERS = GOL.RECITERS || {
  alafasy: { name: 'Mishary Alafasy', local: '../audio/alafasy/', remote: '' }
};
GOL.Input = {
  taps: [], releases: [], pointers: new Map(), drag: null, touchMode: true,
  endFrame() { this.taps.length = 0; this.releases.length = 0; }
};

// fake audio pipeline: every play "ends" a few frames later
const pendingEnds = [];
const later = (fn) => { if (fn) pendingEnds.push({ frames: 6, fn }); };
GOL.audio = {
  muted: false, reciting: false, unlocked: true,
  unlock() {}, tick() {}, sfx() {}, duck() {},
  playVerse(s, n, onend) { later(onend); return { el: new FakeAudio(), finish() {} }; },
  echoVerse() { return { el: new FakeAudio() }; },
  speak() { return null; }, stopSpeak() {}, stopRecitation() {},
  playSurah(surah, cb) { later(() => cb && cb.onDone && cb.onDone()); },
  key(s, n) { return ('00' + s).slice(-3) + ('00' + n).slice(-3); }
};

require(join(V3, 'js', 'worlds', 'follow-estimated.js'));
require(join(V3, 'js', 'prototypes', 'quraysh-rooms.js'));

// FakeAudio never advances currentTime, so QROOMS.playSlice's cut-poll (and
// its real setTimeout guards, which would outlive the synchronous frame
// loop) never fire. Route slices through the same simulated-completion
// queue as full verses so onend-driven scene logic always advances.
GOL.QROOMS.playSlice = (n, i0, i1, opts) => {
  later(opts && opts.onend);
  return { done: false, stop() { this.done = true; } };
};
GOL.QROOMS.firstWord = (n, opts) => GOL.QROOMS.playSlice(n, 0, 0, opts);
GOL.QROOMS.openingPhrase = (n, opts) => GOL.QROOMS.playSlice(n, 0, 1, opts);
GOL.QROOMS.stopSlice = () => {};

// ---------------------------------------------------------- load the lab --
require(join(V3, 'js', 'prototypes', 'p' + N + '.js'));
const def = GOL.PROTOTYPES[N];
if (!def) { console.log('✗ p' + N + ' did not register GOL.PROTOTYPES[' + N + ']'); process.exit(1); }
const scene = GOL.SCENES[def.scene];
if (!scene) { console.log('✗ p' + N + ' scene "' + def.scene + '" not registered'); process.exit(1); }

const W = 800, H = 450;
let frames = 0;
try {
  scene.enter({ proto: N });
  for (let f = 0; f < 720; f++) {
    // tap bursts across the screen; occasional drags
    if (f % 45 === 17) {
      GOL.Input.taps.push({ x: Math.random() * W, y: Math.random() * H });
    }
    if (f % 120 === 60) {
      GOL.Input.drag = { id: 1, x: Math.random() * W, y: Math.random() * H, startX: W / 2, startY: H / 2 };
    } else if (f % 120 === 90) {
      if (GOL.Input.drag) GOL.Input.releases && GOL.Input.releases.push({ x: GOL.Input.drag.x, y: GOL.Input.drag.y });
      GOL.Input.drag = null;
    }
    for (let i = pendingEnds.length - 1; i >= 0; i--) {
      if (--pendingEnds[i].frames <= 0) { const fn = pendingEnds[i].fn; pendingEnds.splice(i, 1); fn(); }
    }
    scene.update(1 / 60, W, H);
    scene.draw(ctxStub, W, H);
    GOL.Input.endFrame();
    frames++;
  }
  if (scene.exit) scene.exit();
} catch (e) {
  console.log('✗ p' + N + ' crashed at frame ' + frames + ': ' + e.message);
  console.log(e.stack.split('\n').slice(0, 4).join('\n'));
  process.exit(1);
}
console.log('✓ p' + N + ' (' + def.name + ') survived ' + frames + ' frames, taps, drags, and audio ends');
