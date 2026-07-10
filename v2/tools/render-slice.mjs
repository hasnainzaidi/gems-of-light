// Headless renders of the painterly slice.
// usage: node tools/render-slice.mjs stills <outdir>
//        node tools/render-slice.mjs frames <outdir> <simSeconds> <drawSeconds> [fps] [W] [H]
import { createRequire } from 'module';
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const [mode, OUT, simS, drawS, fpsA, WA, HA] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const W = +WA || 1180, H = +HA || 720;
global.window = global;
require(path.join(ROOT, 'js', 'slice.js'));
const S = global.SLICE;
const img = {};
for (const [k, f] of Object.entries(S.FILES)) img[k] = await loadImage(path.join(ROOT, f));
const cv = createCanvas(W, H);
const ctx = cv.getContext('2d');
S.init(img, W, H);
S.state.demo = true;
const mk = (w, h) => createCanvas(w, h);
const step = () => S.tick(1 / 60);
if (mode === 'stills') {
  const marks = { '01-walk': 4.2, '02-jump': 7.75, '03-collect': 8.75, '04-after': 11.5 };
  let t = 0;
  for (const [name, at] of Object.entries(marks)) {
    while (t < at) { step(); t += 1 / 60; }
    S.draw(ctx, mk);
    fs.writeFileSync(path.join(OUT, name + '.png'), cv.toBuffer('image/png'));
    console.log('📷', name, 'px', Math.round(S.state.px));
  }
} else {
  const fps = +fpsA || 24;
  let t = 0;
  while (t < +simS) { step(); t += 1 / 60; }
  let n = 0;
  const every = Math.round(60 / fps);
  let fi = 0;
  while (t < +simS + +drawS) {
    step(); t += 1 / 60; fi++;
    if (fi % every === 0) {
      S.draw(ctx, mk);
      fs.writeFileSync(path.join(OUT, 'f' + String(n).padStart(4, '0') + '.png'), cv.toBuffer('image/png'));
      n++;
    }
  }
  console.log('frames:', n);
}
