// Bakes the Al-Falaq (Daybreak Hollow) assets from the existing painted set,
// per the playbook rules: never splice raw — build in post from the same
// masonry/moss paintings so everything shares palette and course height.
//   gem-f1..f5.png   five dawn-arc recolors of the three painted gem cuts
//   hollow.png       the stone brow/doorway, wall.png masonry + fringe moss
//   lantern.png      a small bronze lantern (code adds the living glow)
// node tools/bake-falaq-assets.mjs
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROC = path.join(ROOT, 'assets', 'paint', 'proc');
const save = (cv, name) => {
  fs.writeFileSync(path.join(PROC, name), cv.toBuffer('image/png'));
  console.log('✓', name, cv.width + 'x' + cv.height);
};

// ---------------------------------------------------------- hue helpers ----
function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (mx === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s, l];
}
function hsl2rgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0) { const v = l * 255; return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    t = ((t % 1) + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

// dominant hue of an image, weighted by saturation and alpha
function dominantHue(data) {
  let sx = 0, sy = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3] / 255;
    if (a < 0.2) continue;
    const [h, s] = rgb2hsl(data[i], data[i + 1], data[i + 2]);
    const w = s * a;
    sx += Math.cos((h * Math.PI) / 180) * w;
    sy += Math.sin((h * Math.PI) / 180) * w;
  }
  return ((Math.atan2(sy, sx) * 180) / Math.PI + 360) % 360;
}

async function bakeGems() {
  // five ayah gems on a dawn arc: gold (Lord of daybreak) → garden green
  // (all He created) → deep night indigo → dusky plum → first-light rose.
  // Cuts reuse the three painted crystals (4 & 5 mirrored = new cuts).
  const plan = [
    { out: 'gem-f1.png', src: 'gem-1.png', hue: 46,  mirror: false, sat: 1.06, lig: 1.04 },
    { out: 'gem-f2.png', src: 'gem-2.png', hue: 138, mirror: false, sat: 1.0,  lig: 1.0 },
    { out: 'gem-f3.png', src: 'gem-3.png', hue: 232, mirror: false, sat: 0.96, lig: 0.9 },
    { out: 'gem-f4.png', src: 'gem-1.png', hue: 286, mirror: true,  sat: 0.92, lig: 0.96 },
    { out: 'gem-f5.png', src: 'gem-2.png', hue: 348, mirror: true,  sat: 0.95, lig: 1.02 }
  ];
  for (const p of plan) {
    const im = await loadImage(path.join(PROC, p.src));
    const cv = createCanvas(im.width, im.height);
    const x = cv.getContext('2d');
    if (p.mirror) { x.translate(im.width, 0); x.scale(-1, 1); }
    x.drawImage(im, 0, 0);
    x.setTransform(1, 0, 0, 1, 0, 0);
    const id = x.getImageData(0, 0, cv.width, cv.height);
    const d = id.data;
    const delta = p.hue - dominantHue(d);
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      let [h, s, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
      // rotate strongly where the crystal is saturated, gently on the pale
      // sparkle highlights so they stay near-white
      const k = Math.min(1, s * 2.2);
      h += delta * k;
      s = Math.min(1, s * p.sat);
      l = Math.min(1, l * (1 + (p.lig - 1) * k));
      const [r, g, b] = hsl2rgb(h, s, l);
      d[i] = r; d[i + 1] = g; d[i + 2] = b;
    }
    x.putImageData(id, 0, 0);
    save(cv, p.out);
  }
}

// ------------------------------------------------------------- hollow ------
// The stone brow you walk beneath: two jambs and a lintel of the same wall
// masonry, moss crown from the fringe painting, a quiet gold sun-disc relief
// (the daybreak motif) on the brow. Interior dimness + lantern light is code.
async function bakeHollow() {
  const wall = await loadImage(path.join(PROC, 'wall.png'));
  const fringe = await loadImage(path.join(PROC, 'grass-fringe.png'));
  const W = 1720, H = 800;
  const cv = createCanvas(W, H);
  const x = cv.getContext('2d');

  // geometry (canvas px; drawn in-game at ~0.5 scale)
  const browH = 250;                       // lintel slab depth
  const jambW = 250;
  const doorX0 = jambW, doorX1 = W - jambW;
  const archDip = 120;                     // shoulder-arch curve into the brow

  // masonry pattern at the scale the game shows the ground wall
  // (game wall: 0.36 world-scale; hollow drawn at ~0.5 canvas→world,
  //  so 0.72 here keeps brick courses identical beside it)
  const pat = (() => {
    const t = createCanvas(Math.round(wall.width * 0.72), Math.round(wall.height * 0.72));
    const tx = t.getContext('2d');
    tx.drawImage(wall, 0, 0, t.width, t.height);
    return x.createPattern(t, 'repeat');
  })();

  const structure = () => {
    x.beginPath();
    // outer outline with softly rounded shoulders
    const r = 46;
    x.moveTo(8, H);
    x.lineTo(8, browH * 0.5 + r);
    x.quadraticCurveTo(8, browH * 0.5, 8 + r, browH * 0.5);
    x.lineTo(W - 8 - r, browH * 0.5);
    x.quadraticCurveTo(W - 8, browH * 0.5, W - 8, browH * 0.5 + r);
    x.lineTo(W - 8, H);
    // doorway carved out (drawn as a hole via evenodd) — a soft shoulder arch
    x.moveTo(doorX0, H);
    x.lineTo(doorX0, browH + archDip + 40);
    x.quadraticCurveTo(doorX0 + 4, browH + 26, doorX0 + 210, browH + 10);
    x.lineTo(doorX1 - 210, browH + 10);
    x.quadraticCurveTo(doorX1 - 4, browH + 26, doorX1, browH + archDip + 40);
    x.lineTo(doorX1, H);
    x.closePath();
  };

  // fill masonry
  x.save();
  structure();
  x.clip('evenodd');
  x.fillStyle = pat;
  x.fillRect(0, 0, W, H);

  // painterly light: sun from upper right, ambient occlusion low + inner edges
  let g = x.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, 'rgba(58,52,30,0.16)');
  g.addColorStop(0.55, 'rgba(58,52,30,0)');
  g.addColorStop(1, 'rgba(255,242,200,0.1)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(255,246,214,0.12)');
  g.addColorStop(0.42, 'rgba(58,52,30,0)');
  g.addColorStop(1, 'rgba(58,52,30,0.2)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);

  // shadow under the brow, hugging the arch curve (the doorway's dim brow-line)
  x.save();
  x.beginPath();
  x.moveTo(doorX0 - 30, H);
  x.lineTo(doorX0 - 30, browH + archDip);
  x.quadraticCurveTo(doorX0, browH - 10, doorX0 + 210, browH - 20);
  x.lineTo(doorX1 - 210, browH - 20);
  x.quadraticCurveTo(doorX1, browH - 10, doorX1 + 30, browH + archDip);
  x.lineTo(doorX1 + 30, H);
  x.closePath();
  x.clip();
  g = x.createLinearGradient(0, browH - 30, 0, browH + 190);
  g.addColorStop(0, 'rgba(52,44,26,0.42)');
  g.addColorStop(1, 'rgba(52,44,26,0)');
  x.fillStyle = g;
  x.fillRect(0, browH - 40, W, 260);
  x.restore();

  // jamb inner-edge weathering — a soft dark line where the doorway opens
  for (const [ex, dir] of [[doorX0, 1], [doorX1, -1]]) {
    g = x.createLinearGradient(ex, 0, ex + dir * 56, 0);
    g.addColorStop(0, 'rgba(52,44,26,0.34)');
    g.addColorStop(1, 'rgba(52,44,26,0)');
    x.fillStyle = g;
    x.fillRect(Math.min(ex, ex + dir * 56), browH, 56, H - browH);
  }
  x.restore();

  // a rising half-sun relief seated on the doorway line — the daybreak
  // motif, embossed shallow into the brow (light above, shadow below)
  x.save();
  x.beginPath();
  x.rect(doorX0 + 210, 0, doorX1 - doorX0 - 420, browH + 10);   // stay on the brow
  x.clip();
  const sx = W / 2, sy = browH + 8, sr = 64;
  x.globalAlpha = 0.55;
  x.strokeStyle = '#8A6B34';
  x.lineWidth = 11; x.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const a = Math.PI + (Math.PI * (i + 0.5)) / 5;
    x.beginPath();
    x.moveTo(sx + Math.cos(a) * (sr + 16), sy + Math.sin(a) * (sr + 16));
    x.lineTo(sx + Math.cos(a) * (sr + 42), sy + Math.sin(a) * (sr + 42));
    x.stroke();
  }
  x.fillStyle = '#8A6B34';
  x.beginPath(); x.arc(sx - 3, sy - 3, sr, Math.PI, Math.PI * 2); x.closePath(); x.fill();
  g = x.createRadialGradient(sx - 10, sy - 26, 6, sx, sy, sr);
  g.addColorStop(0, '#F2D28C');
  g.addColorStop(1, '#B98A3E');
  x.fillStyle = g;
  x.beginPath(); x.arc(sx, sy, sr, Math.PI, Math.PI * 2); x.closePath(); x.fill();
  x.restore();

  // moss crown along the brow top (mirrored fringe tiles, like the coping)
  const fsc = 96 / fringe.height;
  const fw = fringe.width * fsc * 0.84;
  let k = 0;
  for (let fx = 14; fx < W - 10; fx += fw, k++) {
    const jx = ((k * 53) % 17) - 8;
    x.save();
    if (k % 2) {
      x.translate(fx + jx + (fringe.width * fsc) / 2, 0);
      x.scale(-1, 1);
      x.translate(-(fx + jx + (fringe.width * fsc) / 2), 0);
    }
    x.drawImage(fringe, fx + jx, browH * 0.5 - 66, fringe.width * fsc, fringe.height * fsc);
    x.restore();
  }
  // moss shadow cast onto the brow face just under the crown
  x.save();
  structure(); x.clip('evenodd');
  g = x.createLinearGradient(0, browH * 0.5 + 18, 0, browH * 0.5 + 44);
  g.addColorStop(0, 'rgba(90,78,48,0.3)');
  g.addColorStop(1, 'rgba(90,78,48,0)');
  x.fillStyle = g;
  x.fillRect(0, browH * 0.5 + 16, W, 30);
  x.restore();

  // feather the very bottom so the jambs seat into the ground (playbook §1)
  const idB = x.getImageData(0, 0, W, H);
  const db = idB.data;
  for (let y = Math.round(H * 0.94); y < H; y++) {
    const f = 1 - ((y - H * 0.94) / (H * 0.06)) * 0.5;
    for (let px = 0; px < W; px++) db[(y * W + px) * 4 + 3] *= f;
  }
  x.putImageData(idB, 0, 0);
  save(cv, 'hollow.png');
}

// ------------------------------------------------------------- lantern -----
// A small bronze garden lantern with warm glass; the game draws its living
// glow. Painterly = soft edges, grain, no hard black lines.
async function bakeLantern() {
  // supersample 2x, then downscale — the halving is what melts hard vector
  // edges into something closer to a brushed shape
  const W = 300, H = 440, SS = 2;
  const big = createCanvas(W * SS, H * SS);
  const x = big.getContext('2d');
  x.scale(SS, SS);
  const cx = W / 2;
  const bronzeD = '#54452F', bronze = '#75634280', bronzeM = '#756342', bronzeL = '#9A8458';

  // hanging ring
  x.strokeStyle = bronzeM; x.lineWidth = 8; x.lineCap = 'round';
  x.beginPath(); x.arc(cx, 28, 13, 0, Math.PI * 2); x.stroke();
  x.beginPath(); x.moveTo(cx, 42); x.lineTo(cx, 58); x.stroke();

  // dome cap — a soft onion curve
  let g = x.createLinearGradient(cx - 64, 0, cx + 64, 0);
  g.addColorStop(0, bronzeD); g.addColorStop(0.38, bronzeL); g.addColorStop(0.72, bronzeM); g.addColorStop(1, bronzeD);
  x.fillStyle = g;
  x.beginPath();
  x.moveTo(cx - 62, 108);
  x.bezierCurveTo(cx - 62, 66, cx - 30, 54, cx, 54);
  x.bezierCurveTo(cx + 30, 54, cx + 62, 66, cx + 62, 108);
  x.closePath(); x.fill();
  // cap rim — one soft band
  g = x.createLinearGradient(0, 98, 0, 122);
  g.addColorStop(0, bronzeL); g.addColorStop(1, bronzeD);
  x.fillStyle = g;
  x.beginPath(); x.ellipse(cx, 110, 70, 12, 0, 0, Math.PI * 2); x.fill();

  // glass body — gently curved sides, warm from within
  const topY = 116, botY = 316, midY = (topY + botY) / 2, topR = 56, botR = 48;
  g = x.createRadialGradient(cx, midY, 6, cx, midY, 116);
  g.addColorStop(0, '#FFF4CC');
  g.addColorStop(0.5, '#F0CD8E');
  g.addColorStop(1, '#C29A5C');
  x.fillStyle = g;
  x.beginPath();
  x.moveTo(cx - topR, topY);
  x.quadraticCurveTo(cx - topR - 10, midY, cx - botR, botY);
  x.lineTo(cx + botR, botY);
  x.quadraticCurveTo(cx + topR + 10, midY, cx + topR, topY);
  x.closePath(); x.fill();
  // inner flame hint
  g = x.createRadialGradient(cx, midY + 18, 2, cx, midY + 18, 42);
  g.addColorStop(0, 'rgba(255,252,238,0.95)');
  g.addColorStop(1, 'rgba(255,252,238,0)');
  x.fillStyle = g;
  x.beginPath(); x.arc(cx, midY + 18, 42, 0, Math.PI * 2); x.fill();
  // a soft vertical sheen on the left pane
  g = x.createLinearGradient(cx - topR, 0, cx - topR * 0.3, 0);
  g.addColorStop(0, 'rgba(255,255,245,0.34)');
  g.addColorStop(1, 'rgba(255,255,245,0)');
  x.fillStyle = g;
  x.fillRect(cx - topR, topY + 8, topR * 0.7, botY - topY - 16);

  // three slender ribs
  x.strokeStyle = 'rgba(84,69,47,0.85)'; x.lineCap = 'round';
  for (const [ox, w2] of [[-1, 7], [0, 5], [1, 7]]) {
    x.lineWidth = w2;
    x.beginPath();
    x.moveTo(cx + ox * topR, topY + 2);
    x.quadraticCurveTo(cx + ox * (topR + 10), midY, cx + ox * botR, botY - 2);
    x.stroke();
  }

  // base dish + short foot
  g = x.createLinearGradient(0, botY - 4, 0, botY + 22);
  g.addColorStop(0, bronzeL); g.addColorStop(1, bronzeD);
  x.fillStyle = g;
  x.beginPath(); x.ellipse(cx, botY + 6, botR + 18, 13, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = bronzeM;
  x.beginPath();
  x.moveTo(cx - 11, botY + 14); x.lineTo(cx + 11, botY + 14);
  x.lineTo(cx + 15, botY + 56); x.lineTo(cx - 15, botY + 56);
  x.closePath(); x.fill();
  g = x.createLinearGradient(0, botY + 52, 0, botY + 76);
  g.addColorStop(0, bronzeL); g.addColorStop(1, bronzeD);
  x.fillStyle = g;
  x.beginPath(); x.ellipse(cx, botY + 62, 42, 11, 0, 0, Math.PI * 2); x.fill();

  // downscale + paper-grain speckle
  const cv = createCanvas(W, H);
  const fx = cv.getContext('2d');
  fx.drawImage(big, 0, 0, W, H);
  let s = 777;
  const r = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const id = fx.getImageData(0, 0, W, H);
  for (let i = 0; i < 2600; i++) {
    const px = Math.floor(r() * W), py = Math.floor(r() * H);
    const o = (py * W + px) * 4;
    if (id.data[o + 3] < 40) continue;
    const dv = (r() - 0.5) * 22;
    id.data[o] += dv; id.data[o + 1] += dv; id.data[o + 2] += dv;
  }
  fx.putImageData(id, 0, 0);
  save(cv, 'lantern.png');
}

await bakeGems();
await bakeHollow();
await bakeLantern();
console.log('done.');
