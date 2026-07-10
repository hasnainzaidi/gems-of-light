// Headless run of the Al-Falaq level: snapshots at story beats.
// node tools/render-falaq.mjs <outdir>
import { createRequire } from 'module';
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] || '/tmp/falaq-shots';
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
require(path.join(ROOT, 'js', 'falaq.js'));
const K = global.FALAQ;
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
  ['01-predawn-dark', () => !S.ceremony && S.t > 0.7 && S.px > 300],
  ['02-gem1-ceremony', () => S.ceremony && S.ceremony.gem.n === 1 && S.ceremony.phase === 'recite' && S.ceremony.t > 0.5],
  ['03-hollow-lanterns', () => !S.ceremony && S.found.includes(2) && S.px > 2270 && S.px < 2620],
  ['04-gem3-in-the-dim', () => S.ceremony && S.ceremony.gem.n === 3 && S.ceremony.t > 0.3],
  ['05-waterfall-gem4', () => S.ceremony && S.ceremony.gem.n === 4 && S.ceremony.t > 0.3],
  ['06-morning-stairs', () => !S.ceremony && S.found.includes(4) && S.px > 4460 && S.px < 4900],
  ['07-gem5-morning-air', () => S.ceremony && S.ceremony.gem.n === 5 && S.ceremony.t > 0.3],
  ['08-arch-order', () => S.mode === 'order' && S.order && S.order.gems.filter((g) => g.placed >= 0).length === 3],
  ['09-recite', () => S.mode === 'recite' && S.reciteI === 2 && S.reciteT > 0.5],
  ['10-walk-through', () => S.mode === 'walk' && S.walkT > 1.1],
  ['11-done', () => S.mode === 'done' && S.doneT > 0.9]
];
let bi = 0, t = 0;
while (bi < beats.length && t < 160) {
  K.tick(1 / 60); global.stepAudio(1 / 60); t += 1 / 60;
  if (beats[bi][1]()) {
    K.draw(ctx, mk);
    fs.writeFileSync(path.join(OUT, beats[bi][0] + '.png'), cv.toBuffer('image/png'));
    console.log('📷', beats[bi][0], 't=' + t.toFixed(1), 'px=' + Math.round(S.px), 'mode=' + S.mode);
    bi++;
  }
}
if (bi < beats.length) console.log('STALLED at', beats[bi][0], 't=' + t.toFixed(1), 'px=' + Math.round(S.px), 'mode=' + S.mode, 'found=' + S.found, 'grounded=' + S.grounded);
