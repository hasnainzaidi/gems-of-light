// GIF frames for the Al-Kawthar run: node tools/render-kawthar-frames.mjs <out> <simS> <durS> <fps>
import { createRequire } from 'module';
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const [OUT, simS, durS, fpsA] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const W = 880, H = 540;
global.window = global;
const live = [];
global.Audio = class {
  constructor() { this._ls = {}; this._t = 0; this.paused = true; }
  addEventListener(e, f) { (this._ls[e] = this._ls[e] || []).push(f); }
  play() { this._t = 0; this.paused = false; if (!live.includes(this)) live.push(this); return { catch() {} }; }
  pause() { this.paused = true; }
};
const stepAudio = (dt) => {
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
K.state.demo = true;
const mk = (w, h) => createCanvas(w, h);
let t = 0, n = 0, fi = 0;
const fps = +fpsA || 15, every = Math.round(60 / fps);
while (t < +simS) { K.tick(1 / 60); stepAudio(1 / 60); t += 1 / 60; }
while (t < +simS + +durS) {
  K.tick(1 / 60); stepAudio(1 / 60); t += 1 / 60; fi++;
  if (fi % every === 0) {
    K.draw(ctx, mk);
    fs.writeFileSync(path.join(OUT, 'f' + String(n).padStart(4, '0') + '.png'), cv.toBuffer('image/png'));
    n++;
  }
}
console.log('frames', n);
