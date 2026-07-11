// Headless preview — renders real frames of the game without a browser.
// Usage:  npm i @napi-rs/canvas   then   node --expose-gc tools/preview.mjs [outDir]
// Produces PNG screenshots of every scene for visual QA.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { createCanvas, GlobalFonts, Image } = require('@napi-rs/canvas');

// @napi-rs/canvas retains a pixel snapshot for every canvas-as-source
// drawImage call (leaks GBs over thousands of frames). Image sources don't
// leak, and all our drawImage sources are static once built — so convert
// canvas sources to cached Images transparently.
function patchDrawImage(protoOwner) {
  // @napi-rs/canvas decodes Image on the next event-loop turn (drawing one
  // synchronously after setting src paints nothing), so: cache an Image per
  // source canvas, draw the raw canvas until the Image is ready, then swap.
  // await pump() yields to the event loop so decodes actually complete.
  const proto = Object.getPrototypeOf(protoOwner);
  const raw = proto.drawImage;
  const cache = new WeakMap();
  proto.drawImage = function (src, ...args) {
    if (src && typeof src.toBuffer === 'function') {
      let ent = cache.get(src);
      if (!ent) {
        ent = { img: new Image(), ready: false };
        ent.img.src = src.toBuffer('image/png');
        setImmediate(() => { ent.ready = true; });
        cache.set(src, ent);
      }
      if (ent.ready) return raw.call(this, ent.img, ...args);
      return raw.call(this, src, ...args);
    }
    return raw.call(this, src, ...args);
  };
}
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
patchDrawImage(main.getContext('2d'));
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

for (const f of ['data', 'voice-lines', 'art', 'props', 'actors', 'audio', 'engine', 'levels', 'scenes', 'level', 'gate', 'room', 'modes', 'main']) {
  require(path.join(ROOT, 'js', f + '.js'));
}
const GOL = global.GOL;

async function pump(seconds) {
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps; i++) {
    NOW += 1000 / 60;
    const q = rafQ.splice(0);
    for (const fn of q) fn(NOW);
    // yield so Image decodes land and native canvas memory can settle
    if (i % 10 === 9) await new Promise((r) => setImmediate(r));
    if (global.gc && i % 30 === 0) global.gc();
  }
  await new Promise((r) => setImmediate(r));
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
await pump(1.2);
shot('01-title');

console.log('— map');
tap(VIEW_W / 2, VIEW_H / 2);
await pump(0.1); await pump(1.4);
shot('02-map');

console.log('— level: Al-Kawthar');
GOL.go('level', { index: 0 });
await pump(1.6);
shot('03-kawthar-intro');
await pump(2.2); // intro card fades
keys({ ArrowRight: true });
await pump(1.9);
keys({ ArrowRight: false });
shot('04-kawthar-walk');
// walk to gem 1 (col 10) and hop
keys({ ArrowRight: true });
await pump(0.7);
Input.queueJump();
await pump(0.5);
keys({ ArrowRight: false });
await pump(1.0);
const lvl = GOL.SCENES.level;
shot('05-kawthar-near-gem');
if (!lvl.overlay && lvl.found.length === 0) {
  // ensure the collect moment for the shot
  const g = lvl.L.gems[0];
  lvl.player.x = g.x; lvl.player.y = g.y + 20;
  await pump(0.15);
}
await pump(0.85); // into recite phase
shot('06-collect-recite');
if (lvl.overlay) { lvl.overlay.audioDone = true; lvl.overlay.t = 99; }
await pump(0.5); await pump(0.9);
shot('07-after-collect-hud');

console.log('— gate: sorting');
GOL.go('gate', { index: 0 });
await pump(1.5);
shot('08-gate-sort');
const gate = GOL.SCENES.gate;
// drag one gem correctly for the held/placed look
const g1 = gate.gems.find((g) => g.ayah === 1);
g1.placed = 0;
await pump(0.6);
shot('09-gate-one-placed');
for (const g of gate.gems) g.placed = g.ayah - 1;
gate.checkDone();
await pump(1.8);
shot('10-gate-ignite');
gate.phase = 'open'; gate.openT = 0;
GOL.audio.sfx && await pump(1.2);
shot('11-gate-open');
gate.phase = 'walk'; gate.walkT = 1.2;
await pump(0.4);
shot('12-gate-walkthrough');

console.log('— map celebrate');
await pump(1.6);
shot('13-map-celebrate');

console.log('— recitation room');
// pretend two surahs are gathered
const st1 = GOL.store.level(108); st1.found = [1, 2, 3]; st1.completed = true;
const st2 = GOL.store.level(112); st2.found = [1, 3];
GOL.go('room');
await pump(1.4);
shot('14-room');

console.log('— parents');
GOL.go('parents');
await pump(1.2);
shot('15-parents-gate');
GOL.SCENES.parents.open = true;
await pump(0.3);
shot('16-parents-stats');

console.log('— Al-Falaq dawn gradient');
GOL.go('level', { index: 3 });
await pump(1.2);
const l4 = GOL.SCENES.level;
l4.intro = 0;
l4.player.x = GOL.LEVELS[3].w * GOL.TILE * 0.16;
l4.cam = null;
await pump(0.6);
shot('17-falaq-dim');
l4.player.x = GOL.LEVELS[3].w * GOL.TILE * 0.62;
l4.cam = null;
await pump(0.6);
shot('18-falaq-bright');

console.log('— An-Nas village');
GOL.go('level', { index: 4 });
await pump(1.2);
const l5 = GOL.SCENES.level;
l5.intro = 0;
l5.player.x = 42 * GOL.TILE; l5.cam = null;
await pump(0.7);
shot('19-nas-village');

console.log('— Al-Fatiha courtyard');
GOL.go('level', { index: 5 });
await pump(1.2);
const l6 = GOL.SCENES.level;
l6.intro = 0;
l6.player.x = 97 * GOL.TILE; l6.cam = null;
await pump(0.7);
shot('20-fatiha-courtyard');

console.log('— journey: bounce blossom + seeds + leaf');
GOL.go('level', { index: 2 });
await pump(1.4);
const l3 = GOL.SCENES.level;
l3.intro = 0;
l3.player.x = 22 * GOL.TILE; l3.cam = null;
await pump(0.6);
shot('21-asr-bounce-and-seeds');
l3.player.x = 60 * GOL.TILE; l3.player.y = 10 * GOL.TILE; l3.cam = null;
await pump(0.5);
shot('22-asr-drift-leaf');

console.log('— echo moment');
GOL.store.level(103).completed = false;
GOL.go('level', { index: 0 });
await pump(1.3);
const le = GOL.SCENES.level;
le.intro = 0;
const ge = le.L.gems[0];
le.player.x = ge.x; le.player.y = ge.y + 20;
await pump(0.95);
if (le.overlay) { le.overlay.audioDone = true; le.overlay.t = 99; }
await pump(0.1);
shot('23-echo-your-turn');

console.log('— star walk (recall)');
GOL.store.level(108).completed = true;
GOL.go('level', { index: 0, recall: true });
await pump(1.5);
const lr = GOL.SCENES.level;
lr.intro = 0;
lr.player.x = 9 * GOL.TILE; lr.cam = null;
await pump(0.6);
shot('24-star-walk-veiled');

console.log('— map: ways-in panel + blooms');
const stm = GOL.store.level(108);
stm.completed = true; stm.heardFull = 4; stm.blossom = true; stm.moon = 0.6;
GOL.go('map', { focus: 0 });
await pump(1.4);
GOL.SCENES.map.panelNode = 0;
await pump(0.4);
shot('25-map-ways-in');

console.log('— map: walking the path, gateway east');
{
  GOL.store.data.unlocked = GOL.WORLDS[0].levels.length; // World One walked; the Orchard opens
  GOL.go('map', { focus: GOL.WORLDS[0].levels.length - 1 });
  await pump(1.4);
  const mp = GOL.SCENES.map;
  mp.panelNode = -1; mp._panel = null; mp.pendingEnter = null;
  mp.s = GOL.WORLDS[0].levels.length - 1.55; mp.facing = 1; mp.vpx = 180; // caught mid-stride
  await pump(0.05);
  shot('25b-map-walking-gateway');
  // step through the arch into World Two
  GOL.go('map', { world: 1, edge: 'left' });
  await pump(1.7);
  GOL.SCENES.map.pendingEnter = null;
  await pump(0.05);
  shot('25c-map-world-two');
}

console.log('— moon trial');
GOL.go('trial', { index: 0 });
await pump(1.4);
shot('26-trial-question');
const tr = GOL.SCENES.trial;
tr.picked = tr.choiceState[0];
tr.choiceState[0].heard = true;
await pump(0.3);
shot('27-trial-picked');
tr.moonFrom = 0.2; tr.moonTo = 0.7; tr.phase = 'moon'; tr.moonT = 0; tr.firstTries = 4;
await pump(2.4);
shot('28-trial-moon');

console.log('— story');
GOL.go('story', { index: 0 });
await pump(1.4);
shot('29-story-page1');
GOL.SCENES.story.page = 3; GOL.SCENES.story.pageK = 0;
await pump(0.6);
shot('30-story-lastpage');

console.log('— meaning match');
GOL.go('meanings', { index: 1 });
await pump(1.4);
const mm = GOL.SCENES.meanings;
const mg = mm.gems.find((g) => g.ayah === 1);
mg.matched = true;
mm.cards.find((c) => c.ayah === 1).matched = true;
const mlay = mm.layout(VIEW_W, VIEW_H);
const mcp = mlay.cards.find((c) => c.c.ayah === 1);
mg.x = mcp.x + 34; mg.y = mcp.y + mcp.h / 2;
await pump(0.5);
shot('31-meaning-match');

// ---------------------------------------------- Worlds Two & Three gardens
const lvlShot = async (key, name, px, py) => {
  const i = GOL.LEVELS.findIndex((L) => L.key === key);
  if (i < 0) return;
  GOL.go('level', { index: i });
  await pump(1.3);
  const l = GOL.SCENES.level;
  l.intro = 0;
  l.player.x = px * GOL.TILE;
  if (py != null) l.player.y = py * GOL.TILE;
  l.cam = null;
  await pump(0.7);
  shot(name);
  return l;
};

console.log('— World Two: the Orchard');
await lvlShot('maun', '32-maun-shared-table', 55);
await lvlShot('fil', '33-fil-bird-slabs', 32);
await lvlShot('humazah', '34-humazah-counting-house', 48);
await lvlShot('qariah', '35-qariah-scales', 44);

console.log('— World Three: the Courtyard');
await lvlShot('zalzalah', '36-zalzalah-colonnade', 42);
await lvlShot('bayyinah', '37-bayyinah-hall', 20);
await lvlShot('qadr', '38-qadr-dusk', 14);
await lvlShot('qadr', '39-qadr-night', 92);
await lvlShot('alaq', '40-alaq-scriptorium', 63);
await lvlShot('alaq', '41-alaq-cave', 146);

console.log('— the long gate: Al-\'Alaq sorts 19 gems in two rows');
{
  const i = GOL.LEVELS.findIndex((L) => L.key === 'alaq');
  GOL.go('gate', { index: i });
  await pump(1.5);
  shot('42-alaq-gate-sort');
  const bg = GOL.SCENES.gate;
  for (const g of bg.gems) if (g.ayah <= 9) { g.placed = g.ayah - 1; g.veiled = false; g.reveal = 1; }
  await pump(0.5);
  shot('43-alaq-gate-halfway');
}

console.log('— the Orchard shelf wall');
{
  for (const key of ['maun', 'quraysh', 'fil']) {
    const L = GOL.LEVELS.find((l) => l.key === key);
    const st = GOL.store.level(L.surahId);
    st.found = L.surah.verses.map((v) => v.n);
    st.completed = true;
  }
  GOL.go('room', { world: 1 });
  await pump(1.4);
  shot('44-room-orchard');
}

console.log('done →', OUT);
