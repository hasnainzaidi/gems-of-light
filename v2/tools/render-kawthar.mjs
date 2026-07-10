// Headless run of the Al-Kawthar slice: snapshots at story beats.
// node tools/render-kawthar.mjs <outdir>
import { createRequire } from 'module';
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] || '/tmp/kawthar-shots';
fs.mkdirSync(OUT, { recursive: true });
const W = +(process.env.SHOT_W||1180), H = +(process.env.SHOT_H||720);
global.window = global;
// sim-time audio: fires 'ended' after ~1.6 simulated seconds
const live = [];
global.Audio = class {
  constructor() { this._ls = {}; this._t = 0; this.paused = true; }
  addEventListener(e, f) { (this._ls[e] = this._ls[e] || []).push(f); }
  play() { this._t = 0; this.paused = false; if (!live.includes(this)) live.push(this); return { catch() {} }; }
  pause() { this.paused = true; }
};
global.stepAudio = (dt) => {
  for (const a of live.slice()) {
    if (a.paused) continue;
    a._t += dt;
    if (a._t > 1.6) { a.paused = true; (a._ls.ended || []).forEach((f) => f()); }
  }
};
require(path.join(ROOT, 'js', 'kawthar.js'));
const K = global.KAWTHAR;
const img = {};
for (const [k, f] of Object.entries(K.FILES)) img[k] = await loadImage(path.join(ROOT, f));
for (const [k, f] of Object.entries(K.OPTIONAL)) {
  try { img[k] = await loadImage(path.join(ROOT, f)); } catch (e) { img[k] = null; }
}
const cv = createCanvas(W, H);
const ctx = cv.getContext('2d');
K.init(img, W, H);
const S = K.state;
S.demo = true;
const mk = (w, h) => createCanvas(w, h);
const beats = [
  ['01-gem1-ceremony', () => S.ceremony && S.ceremony.gem.n === 1 && S.ceremony.phase === 'recite' && S.ceremony.t > 0.5],
  ['02-spring-stones', () => !S.ceremony && S.found.includes(1) && S.px > 1850 && S.px < 2250],
  ['03-waterfall-gem', () => S.ceremony && S.ceremony.gem.n === 3 && S.ceremony.t > 0.3],
  ['04-arch-order', () => S.mode === 'order' && S.order && S.order.gems.filter((g) => g.placed >= 0).length === 2],
  ['05-recite', () => S.mode === 'recite' && S.reciteI === 1 && S.reciteT > 0.5],
  ['06-walk-through', () => S.mode === 'walk' && S.walkT > 1.1],
  ['07-done', () => S.mode === 'done' && S.doneT > 0.9]
];
let bi = 0, t = 0;
while (bi < beats.length && t < 120) {
  K.tick(1 / 60); global.stepAudio(1 / 60); t += 1 / 60;
  if (beats[bi][1]()) {
    K.draw(ctx, mk);
    fs.writeFileSync(path.join(OUT, beats[bi][0] + '.png'), cv.toBuffer('image/png'));
    console.log('📷', beats[bi][0], 't=' + t.toFixed(1), 'px=' + Math.round(S.px), 'mode=' + S.mode);
    bi++;
  }
}
if (bi < beats.length) console.log('STALLED at', beats[bi][0], 't=' + t.toFixed(1), 'px=' + Math.round(S.px), 'mode=' + S.mode, 'found=' + S.found, 'grounded=' + S.grounded);
