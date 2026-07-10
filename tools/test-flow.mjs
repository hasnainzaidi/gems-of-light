// Flow tests that need real timers: the full-surah recitation sequence and
// the gate ceremony advancing on its own.  node tools/test-flow.mjs
// Requires @napi-rs/canvas (same as preview.mjs).
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

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
global.addEventListener = () => {};
global.location = { protocol: 'file:' };
global.document = { getElementById: () => main, createElement: () => createCanvas(1, 1) };
global.localStorage = { _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = v; }, removeItem(k) { delete this._m[k]; } };

class FakeAudio {
  constructor() { this.paused = true; this.readyState = 4; this.currentTime = 0; this._ls = {}; }
  addEventListener(ev, fn) { (this._ls[ev] = this._ls[ev] || []).push(fn); }
  removeEventListener(ev, fn) { if (this._ls[ev]) this._ls[ev] = this._ls[ev].filter((f) => f !== fn); }
  play() {
    this.paused = false;
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
global.Audio = FakeAudio;

for (const f of ['data', 'art', 'props', 'actors', 'audio', 'engine', 'levels', 'scenes', 'level', 'gate', 'room', 'main']) {
  require(path.join(ROOT, 'js', f + '.js'));
}
const GOL = global.GOL;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function pumpFor(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    NOW += 1000 / 60;
    rafQ.splice(0).forEach((fn) => fn(NOW));
    await sleep(8);
  }
}
let failures = 0;
const check = (name, ok) => {
  console.log((ok ? '✓ ' : '✗ ') + name);
  if (!ok) failures++;
};

// ---- 1. playSurah runs every verse, then ends
{
  const surah = GOL.GOL_DATA_SHIM || window.GOL_DATA.surahs[0]; // Al-Kawthar, 3 verses
  const verses = [];
  let ended = false;
  GOL.audio.playSurah(surah, { onVerse: (i) => verses.push(i), onend: () => (ended = true) });
  await sleep(3 * (120 + 420) + 800);
  check('playSurah recites all ' + surah.verses.length + ' verses (got ' + verses.join(',') + ')', verses.join(',') === '0,1,2');
  check('playSurah calls onend', ended);
}

// ---- 2. the gate ceremony advances by itself: ignite → recite → open → walk
{
  GOL.go('gate', { index: 0 });
  await pumpFor(900); // transition + enter
  const gate = GOL.SCENES.gate;
  check('gate begins in sort', gate.phase === 'sort');
  for (const g of gate.gems) g.placed = g.ayah - 1;
  gate.checkDone();
  check('gate ignites when all placed', gate.phase === 'ignite');
  await pumpFor(2200);
  check('gate reaches recite', gate.phase === 'recite' || gate.phase === 'open' || gate.phase === 'walk');
  await pumpFor(3200);
  check('gate reaches open/walk after recitation (phase: ' + gate.phase + ')', gate.phase === 'open' || gate.phase === 'walk');
  await pumpFor(4200);
  const st = GOL.store.level(108);
  check('surah marked completed', st.completed === true);
  check('next level unlocked', GOL.store.data.unlocked >= 1);
}

// ---- 3. a lone verse replay still stops a running sequence cleanly
{
  const surah = window.GOL_DATA.surahs[1]; // Al-Ikhlas
  let seqEnded = false;
  GOL.audio.playSurah(surah, { onend: () => (seqEnded = true) });
  await sleep(160);
  GOL.audio.playVerse(surah.id, 1, null); // tap replay interrupts
  await sleep(1200);
  check('interrupted sequence stays stopped', !seqEnded && !GOL.audio._seq);
  GOL.audio.stopRecitation();
}

console.log(failures ? failures + ' FAILURES' : 'all flow tests passed');
process.exit(failures ? 1 : 0);
