// Gems of Light — props.js
// The garden's furniture: trees, walls, water, the arch — and its inhabitants.
// Static props are pre-rendered to sprites at level load; moving water and
// creatures are drawn live. Anchors are bottom-center unless noted.
(function () {
  const GOL = window.GOL;
  const { mix, shade, tint, alpha } = GOL.color;
  const { wobblePath, dabs, blob, makeCanvas } = GOL.paint;
  const TILE = GOL.TILE;

  // ------------------------------------------------------------- sprites ---
  function buildPropSprites(P, seed) {
    const S = {};

    // -- olive tree: broad, layered, generous
    S.olive = [0, 1, 2].map((v) => {
      const w = 170, h = 165;
      const c = makeCanvas(w, h);
      const x = c.getContext('2d');
      const r = GOL.rng(seed + 11 + v * 31);
      const cx = w / 2, gy = h - 4;
      // trunk: a gentle S-curve, two tones
      x.strokeStyle = P.trunk; x.lineCap = 'round';
      x.lineWidth = 13;
      x.beginPath(); x.moveTo(cx - 2, gy);
      x.quadraticCurveTo(cx + (r() - 0.5) * 26, gy - 38, cx + (r() - 0.5) * 18, gy - 66);
      x.stroke();
      x.strokeStyle = alpha(P.trunkDark, 0.55); x.lineWidth = 5;
      x.beginPath(); x.moveTo(cx - 4, gy - 4);
      x.quadraticCurveTo(cx - 8, gy - 30, cx - 3, gy - 52);
      x.stroke();
      // branches
      x.strokeStyle = P.trunk; x.lineWidth = 6;
      x.beginPath(); x.moveTo(cx, gy - 58); x.quadraticCurveTo(cx - 26, gy - 76, cx - 40, gy - 84); x.stroke();
      x.beginPath(); x.moveTo(cx, gy - 60); x.quadraticCurveTo(cx + 24, gy - 80, cx + 38, gy - 88); x.stroke();
      // canopy: dark base, mid, light dabs (light upper-right)
      const cy = gy - 100;
      const layer = (col, dr, n, rad) => {
        const rr = GOL.rng(seed + 77 + v * 13 + n);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + rr() * 0.8;
          const dist = dr * (0.55 + rr() * 0.6);
          blob(x, cx + Math.cos(a) * dist * 1.35, cy + Math.sin(a) * dist * 0.75, rad * (0.8 + rr() * 0.5), col);
        }
      };
      layer(shade(P.leafDark, 0.12), 34, 9, 22);
      layer(P.leaf, 30, 9, 19);
      layer(P.leafLight, 24, 7, 13);
      // bright dabs toward the sun
      dabs(x, cx - 10, cy - 38, 62, 34, alpha(tint(P.leafLight, 0.35), 0.8), 8, seed + v * 7, 3, 7);
      // a few hanging olives
      const ro = GOL.rng(seed + v * 91);
      x.fillStyle = alpha(shade(P.leafDark, 0.3), 0.9);
      for (let i = 0; i < 5; i++) {
        x.beginPath(); x.ellipse(cx - 40 + ro() * 80, cy + 6 + ro() * 22, 2.2, 3, 0.4, 0, Math.PI * 2); x.fill();
      }
      c._anchor = { x: cx, y: gy + 2 };
      return c;
    });

    // -- cypress: tall, calm exclamation marks along the paths
    S.cypress = [0, 1].map((v) => {
      const w = 64, h = 190;
      const c = makeCanvas(w, h);
      const x = c.getContext('2d');
      const cx = w / 2, gy = h - 4;
      x.fillStyle = P.trunk;
      x.fillRect(cx - 3, gy - 16, 6, 16);
      const tiers = 7;
      for (let i = 0; i < tiers; i++) {
        const tY = gy - 18 - i * 22;
        const tw = 22 * (1 - i / tiers) + 5;
        const col = i % 2 ? shade(P.leafDark, 0.08) : mix(P.leafDark, P.leaf, 0.45);
        x.beginPath();
        x.ellipse(cx, tY, tw, 15, 0, 0, Math.PI * 2);
        x.fillStyle = col; x.fill();
        blob(x, cx + tw * 0.35, tY - 4, tw * 0.4, alpha(tint(col, 0.3), 0.8));
      }
      blob(x, cx, gy - 18 - tiers * 22 + 6, 7, mix(P.leafDark, P.leaf, 0.5));
      c._anchor = { x: cx, y: gy + 2 };
      return c;
    });

    // -- bush
    S.bush = [0, 1, 2].map((v) => {
      const w = 92, h = 56;
      const c = makeCanvas(w, h);
      const x = c.getContext('2d');
      const r = GOL.rng(seed + 313 + v * 17);
      const gy = h - 4;
      for (let i = 0; i < 6; i++) {
        const bx = 14 + i * 12 + (r() - 0.5) * 8;
        const rad = 12 + r() * 8;
        blob(x, bx, gy - 10 - r() * 10, rad, i % 2 ? P.leaf : shade(P.leaf, 0.12));
      }
      dabs(x, 10, 8, w - 20, 22, alpha(P.leafLight, 0.8), 7, seed + v * 5, 2.5, 5);
      if (v === 2) { // berries
        const rr = GOL.rng(seed + 99);
        x.fillStyle = '#E8896B';
        for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(16 + rr() * 60, gy - 12 - rr() * 14, 2.4, 0, Math.PI * 2); x.fill(); }
      }
      c._anchor = { x: w / 2, y: gy + 2 };
      return c;
    });

    // -- flower patches (poppies / daisies / gold)
    S.flowers = ['#E8896B', '#F7EFDA', '#F0C878'].map((headCol, v) => {
      const w = 72, h = 46;
      const c = makeCanvas(w, h);
      const x = c.getContext('2d');
      const r = GOL.rng(seed + 421 + v * 23);
      const gy = h - 3;
      for (let i = 0; i < 6; i++) {
        const fx = 8 + i * 11 + (r() - 0.5) * 6, fh = 14 + r() * 14;
        x.strokeStyle = alpha(P.grassDark, 0.9); x.lineWidth = 1.6; x.lineCap = 'round';
        x.beginPath(); x.moveTo(fx, gy); x.quadraticCurveTo(fx + 2, gy - fh * 0.6, fx + (r() - 0.5) * 6, gy - fh); x.stroke();
        const hx = fx + (r() - 0.5) * 6, hy = gy - fh;
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2 + r();
          blob(x, hx + Math.cos(a) * 3, hy + Math.sin(a) * 3, 2.8, alpha(headCol, 0.95));
        }
        blob(x, hx, hy, 1.8, v === 1 ? P.gold : tint(headCol, 0.4));
      }
      c._anchor = { x: w / 2, y: gy + 1 };
      return c;
    });

    // -- low stone wall builder (n tiles wide)
    S.wall = function (nTiles) {
      const w = nTiles * TILE, h = 46;
      const c = makeCanvas(w, h);
      const x = c.getContext('2d');
      const r = GOL.rng(seed + 87 + nTiles);
      const gy = h - 2;
      // two rough courses of stones + cap
      let sx = 2;
      for (let course = 0; course < 2; course++) {
        const y = gy - 14 - course * 13;
        sx = 2 + (course % 2) * 10;
        while (sx < w - 4) {
          const sw = 18 + r() * 16;
          const col = mix(P.stone, P.stoneShade, r() * 0.7);
          wobblePath(x, [[sx, y], [sx + sw, y], [sx + sw, y + 12], [sx, y + 12]], seed + sx + course * 999, 2.5);
          x.fillStyle = col; x.fill();
          x.fillStyle = alpha(tint(col, 0.4), 0.5);
          x.fillRect(sx + 2, y + 1.5, sw - 6, 2.5);
          sx += sw + 2.5;
        }
      }
      x.fillStyle = alpha(P.stoneDark, 0.7);
      x.fillRect(2, gy - 30, w - 4, 3);
      // moss tufts
      x.fillStyle = alpha(P.grass, 0.85);
      for (let i = 0; i < nTiles * 2; i++) {
        const mx = 6 + r() * (w - 12);
        x.beginPath(); x.ellipse(mx, gy - 29, 4 + r() * 3, 3, 0, Math.PI, 0); x.fill();
      }
      c._anchor = { x: w / 2, y: gy + 1 };
      return c;
    };

    // -- lantern on a post
    {
      const w = 40, h = 96;
      const c = makeCanvas(w, h);
      const x = c.getContext('2d');
      const cx = w / 2, gy = h - 3;
      x.strokeStyle = P.trunkDark; x.lineWidth = 5; x.lineCap = 'round';
      x.beginPath(); x.moveTo(cx, gy); x.lineTo(cx, gy - 52); x.stroke();
      // lantern body
      const ly = gy - 66;
      const g = x.createRadialGradient(cx, ly, 1, cx, ly, 16);
      g.addColorStop(0, alpha('#FFE9A8', 0.5));
      g.addColorStop(1, alpha('#FFE9A8', 0));
      x.fillStyle = g; x.beginPath(); x.arc(cx, ly, 16, 0, Math.PI * 2); x.fill();
      x.fillStyle = shade(P.goldDeep, 0.25);
      x.beginPath();
      x.moveTo(cx - 8, ly + 10); x.lineTo(cx + 8, ly + 10); x.lineTo(cx + 6, ly - 8); x.lineTo(cx, ly - 13); x.lineTo(cx - 6, ly - 8);
      x.closePath(); x.fill();
      x.fillStyle = alpha('#FFEFC2', 0.9);
      x.beginPath();
      x.moveTo(cx - 5, ly + 8) ; x.lineTo(cx + 5, ly + 8); x.lineTo(cx + 4, ly - 6); x.lineTo(cx - 4, ly - 6);
      x.closePath(); x.fill();
      x.fillStyle = shade(P.goldDeep, 0.25);
      x.beginPath(); x.arc(cx, ly - 14, 2.5, 0, Math.PI * 2); x.fill();
      c._anchor = { x: cx, y: gy + 1 };
      S.lantern = c;
    }

    // -- sundial (for Al-'Asr)
    {
      const w = 80, h = 74;
      const c = makeCanvas(w, h);
      const x = c.getContext('2d');
      const cx = w / 2, gy = h - 3;
      // pedestal
      const g = x.createLinearGradient(0, gy - 40, 0, gy);
      g.addColorStop(0, P.stone); g.addColorStop(1, P.stoneShade);
      x.fillStyle = g;
      wobblePath(x, [[cx - 10, gy - 40], [cx + 10, gy - 40], [cx + 14, gy], [cx - 14, gy]], seed + 71, 2);
      x.fill();
      // dial disc
      x.beginPath(); x.ellipse(cx, gy - 42, 26, 10, 0, 0, Math.PI * 2);
      x.fillStyle = tint(P.stone, 0.3); x.fill();
      x.beginPath(); x.ellipse(cx, gy - 44, 26, 10, 0, 0, Math.PI * 2);
      x.fillStyle = P.stone; x.fill();
      x.strokeStyle = alpha(P.stoneDark, 0.5); x.lineWidth = 1.3;
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * (0.15 + (i / 6) * 0.7);
        x.beginPath(); x.moveTo(cx, gy - 44);
        x.lineTo(cx + Math.cos(a) * 22, gy - 44 - Math.sin(a) * 8); x.stroke();
      }
      // gnomon + its long morning shadow
      x.fillStyle = P.goldDeep;
      x.beginPath(); x.moveTo(cx - 2, gy - 44); x.lineTo(cx + 2, gy - 44); x.lineTo(cx, gy - 58); x.closePath(); x.fill();
      x.fillStyle = alpha(P.stoneDark, 0.35);
      x.beginPath(); x.ellipse(cx - 12, gy - 43, 12, 3, 0.2, 0, Math.PI * 2); x.fill();
      c._anchor = { x: cx, y: gy + 1 };
      S.sundial = c;
    }

    // -- stepping stone (in water)
    S.stepStone = [0, 1].map((v) => {
      const w = 56, h = 26;
      const c = makeCanvas(w, h);
      const x = c.getContext('2d');
      const r = GOL.rng(seed + 55 + v * 7);
      wobblePath(x, [[6, 8], [w - 6, 8], [w - 10, h - 4], [10, h - 4]], seed + 56 + v, 3);
      const g = x.createLinearGradient(0, 6, 0, h);
      g.addColorStop(0, tint(P.stone, 0.25)); g.addColorStop(1, P.stoneShade);
      x.fillStyle = g; x.fill();
      dabs(x, 8, 8, w - 16, 10, alpha(P.stoneDark, 0.25), 3, seed + v, 1.5, 3);
      blob(x, 14 + r() * 20, 10, 3, alpha(P.grass, 0.8));
      c._anchor = { x: w / 2, y: h - 6 };
      return c;
    });

    return S;
  }
  GOL.buildPropSprites = buildPropSprites;

  // --------------------------------------------------------------- water ---
  // Animated water body: fills a rect from surfaceY down. Drawn live.
  function drawWater(ctx, x, y, w, h, t, P) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, alpha(P.water, 0.88));
    g.addColorStop(1, alpha(P.waterDeep, 0.94));
    ctx.fillStyle = g;
    ctx.fillRect(x, y + 3, w, h - 3);
    // surface line with moving light
    ctx.strokeStyle = alpha(P.waterHi, 0.95);
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let px = 0; px <= w; px += 10) {
      const yy = y + 3 + Math.sin(px * 0.06 + t * 2.2) * 1.6;
      px === 0 ? ctx.moveTo(x + px, yy) : ctx.lineTo(x + px, yy);
    }
    ctx.stroke();
    // drifting highlight streaks
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.strokeStyle = alpha(P.waterHi, 0.35);
    ctx.lineWidth = 2;
    for (let i = 0; i < Math.max(2, w / 90); i++) {
      const sx = x + ((i * 137 + t * 26) % (w + 60)) - 30;
      const sy = y + 12 + ((i * 53) % Math.max(1, h - 20));
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + 12, sy - 2, sx + 26, sy); ctx.stroke();
    }
    ctx.restore();
  }
  GOL.drawWater = drawWater;

  // Waterfall column with foam and mist. (x,y)=top-center, falls h px.
  function drawWaterfall(ctx, x, y, w, h, t, P) {
    ctx.save();
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, alpha(P.waterHi, 0.5));
    g.addColorStop(0.25, alpha(P.water, 0.62));
    g.addColorStop(1, alpha(P.waterHi, 0.72));
    ctx.fillStyle = g;
    ctx.fillRect(x - w / 2, y, w, h);
    // falling streaks
    ctx.strokeStyle = alpha('#FFFFFF', 0.5);
    ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    const n = Math.max(3, Math.round(w / 9));
    for (let i = 0; i < n; i++) {
      const sx = x - w / 2 + (i + 0.5) * (w / n) + Math.sin(i * 3.7) * 2;
      const phase = ((t * 210 + i * 61) % h);
      for (let k = -1; k < 2; k++) {
        const sy = y + ((phase + k * h * 0.45) % h + h) % h;
        const len = 16 + (i % 3) * 9;
        if (sy + len < y + h) {
          ctx.globalAlpha = 0.25 + 0.3 * ((i + k + 20) % 3) / 2;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.sin(t + i) * 1.2, sy + len); ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    // foam at the base
    for (let i = 0; i < n + 2; i++) {
      const fx = x - w / 2 - 6 + i * ((w + 12) / (n + 1));
      const r = 5 + Math.sin(t * 3 + i * 2.2) * 2.2;
      blob(ctx, fx, y + h - 3 + Math.sin(t * 4 + i) * 1.5, Math.max(2.5, r), alpha('#FFFFFF', 0.5));
    }
    // mist
    for (let i = 0; i < 3; i++) {
      const mr = 14 + i * 8 + Math.sin(t * 0.9 + i * 2) * 3;
      blob(ctx, x + Math.sin(t * 0.6 + i * 2.3) * w * 0.4, y + h - 8 - i * 9, mr, alpha(P.mist, 0.13));
    }
    ctx.restore();
  }
  GOL.drawWaterfall = drawWaterfall;

  // The spring of Kawthar / courtyard fountain. (x,y)=ground at basin center.
  function drawFountain(ctx, x, y, t, P, scale) {
    const s = scale || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    // basin
    const g = ctx.createLinearGradient(0, -26, 0, 0);
    g.addColorStop(0, tint(P.stone, 0.25)); g.addColorStop(1, P.stoneShade);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, -6, 52, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = P.stoneShade;
    ctx.beginPath(); ctx.ellipse(0, -2, 58, 15, 0, 0, Math.PI); ctx.fill();
    // pool
    ctx.fillStyle = alpha(P.water, 0.92);
    ctx.beginPath(); ctx.ellipse(0, -8, 44, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = alpha(P.waterHi, 0.6);
    ctx.beginPath(); ctx.ellipse(-10, -10, 16, 3.5, -0.15, 0, Math.PI * 2); ctx.fill();
    // pillar + jet
    ctx.fillStyle = P.stone;
    ctx.fillRect(-4, -30, 8, 22);
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i - 1) * 0.5;
      ctx.strokeStyle = alpha(P.waterHi, 0.75);
      ctx.lineWidth = 2.6; ctx.lineCap = 'round';
      ctx.beginPath();
      const ph = (t * 2 + i * 1.3) % 1;
      ctx.moveTo(0, -30);
      ctx.quadraticCurveTo(Math.cos(a) * 20, -46, Math.cos(a) * 32, -12);
      ctx.stroke();
      // droplets riding each arc
      const dx = Math.cos(a) * (8 + 24 * ph), dy = -30 - 16 * Math.sin(Math.PI * ph) + 18 * ph * ph;
      blob(ctx, dx, dy, 2.2, alpha('#FFFFFF', 0.85 * (1 - ph * 0.5)));
    }
    // sparkle on the pool
    const r = GOL.rng(Math.floor(t * 6));
    for (let i = 0; i < 3; i++) blob(ctx, -30 + r() * 60, -10 + r() * 5, 1.4, alpha('#FFFFFF', 0.8));
    ctx.restore();
  }
  GOL.drawFountain = drawFountain;

  // ------------------------------------------------------------ the arch ---
  // The level-ending gate. (x,y)=ground at arch center. openAmount 0..1.
  function drawArch(ctx, x, y, t, P, openAmount, glow) {
    const W = 150, H = 190, inW = 74, inH = 128;
    ctx.save();
    ctx.translate(x, y);
    // the light within
    if (glow > 0.01) {
      const g = ctx.createRadialGradient(0, -inH * 0.45, 4, 0, -inH * 0.45, 130);
      g.addColorStop(0, alpha('#FFE9A8', 0.75 * glow));
      g.addColorStop(0.5, alpha('#FFE9A8', 0.25 * glow));
      g.addColorStop(1, alpha('#FFE9A8', 0));
      ctx.fillStyle = g;
      ctx.fillRect(-150, -H - 60, 300, H + 80);
    }
    // recessed interior
    const ig = ctx.createLinearGradient(0, -inH, 0, 0);
    const dim = mix(shade(P.stoneDark, 0.5), '#FFE9A8', Math.min(1, openAmount * 1.1));
    ig.addColorStop(0, dim);
    ig.addColorStop(1, mix(shade(P.stoneDark, 0.35), '#FFF6D0', Math.min(1, openAmount * 1.15)));
    ctx.fillStyle = ig;
    archPath(ctx, 0, 0, inW, inH);
    ctx.fill();
    // doors (two leaves) close over the interior, swing apart as it opens
    if (openAmount < 0.98) {
      const leaf = inW / 2 * (1 - openAmount);
      ctx.save();
      archPath(ctx, 0, 0, inW, inH);
      ctx.clip();
      const dg = ctx.createLinearGradient(-inW / 2, 0, inW / 2, 0);
      dg.addColorStop(0, shade(P.trunk, 0.15));
      dg.addColorStop(0.5, P.trunk);
      dg.addColorStop(1, shade(P.trunk, 0.2));
      ctx.fillStyle = dg;
      ctx.fillRect(-inW / 2, -inH - 4, leaf, inH + 4);
      ctx.fillRect(inW / 2 - leaf, -inH - 4, leaf, inH + 4);
      // plank lines + star handles
      ctx.strokeStyle = alpha(P.trunkDark, 0.55); ctx.lineWidth = 2;
      for (const side of [-1, 1]) {
        const cxx = side * (inW / 2 - leaf / 2);
        for (let i = 1; i < 3; i++) {
          const lx = cxx - leaf / 2 + (leaf / 3) * i;
          ctx.beginPath(); ctx.moveTo(lx, -inH); ctx.lineTo(lx, 0); ctx.stroke();
        }
        GOL.star8(ctx, cxx, -inH * 0.42, 5, Math.PI / 8, alpha(P.gold, 0.9));
      }
      ctx.restore();
    }
    // stone frame: pillars + pointed arch
    ctx.fillStyle = P.stone;
    const pw = (W - inW) / 2 - 6;
    pillar(ctx, -inW / 2 - 6 - pw, -H + 26, pw, H - 26, P);
    pillar(ctx, inW / 2 + 6, -H + 26, pw, H - 26, P);
    // arch band (outer minus inner, as one even-odd path)
    ctx.save();
    archPath(ctx, 0, 0, inW + 26, inH + 22);
    archPath(ctx, 0, 0, inW + 4, inH + 2, true);
    ctx.clip('evenodd');
    const bg = ctx.createLinearGradient(0, -inH - 24, 0, 0);
    bg.addColorStop(0, tint(P.stone, 0.3)); bg.addColorStop(1, P.stoneShade);
    ctx.fillStyle = bg;
    ctx.fillRect(-W / 2, -H, W, H);
    dabs(ctx, -inW / 2 - 12, -inH - 20, inW + 24, 30, alpha(P.stoneDark, 0.2), 6, 1234, 2, 4);
    ctx.restore();
    // keystone rosette
    ctx.fillStyle = tint(P.stone, 0.35);
    GOL.star8Path(ctx, 0, -inH - 26, 17, Math.PI / 8);
    ctx.fill();
    ctx.strokeStyle = alpha(P.goldDeep, 0.8); ctx.lineWidth = 2;
    GOL.star8Path(ctx, 0, -inH - 26, 17, Math.PI / 8);
    ctx.stroke();
    ctx.fillStyle = alpha(P.gold, 0.9 + 0.1 * Math.sin(t * 2));
    ctx.beginPath(); ctx.arc(0, -inH - 26, 5, 0, Math.PI * 2); ctx.fill();
    // vines curling up the pillars
    vine(ctx, -inW / 2 - 8 - pw / 2, 0, H - 40, t, P, 1);
    vine(ctx, inW / 2 + 6 + pw / 2, 0, H - 46, t, P, -1);
    ctx.restore();
  }
  function archPath(ctx, cx, groundY, w, h, continuePath) {
    if (!continuePath) ctx.beginPath();
    ctx.moveTo(cx - w / 2, groundY);
    ctx.lineTo(cx - w / 2, groundY - h + w * 0.42);
    ctx.quadraticCurveTo(cx - w / 2, groundY - h, cx, groundY - h);
    ctx.quadraticCurveTo(cx + w / 2, groundY - h, cx + w / 2, groundY - h + w * 0.42);
    ctx.lineTo(cx + w / 2, groundY);
    ctx.closePath();
  }
  function pillar(ctx, x, y, w, h, P) {
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, P.stoneShade);
    g.addColorStop(0.4, tint(P.stone, 0.15));
    g.addColorStop(1, P.stoneShade);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    // capital + base
    ctx.fillStyle = tint(P.stone, 0.25);
    ctx.fillRect(x - 4, y, w + 8, 10);
    ctx.fillRect(x - 4, y + h - 12, w + 8, 12);
    ctx.fillStyle = alpha(P.stoneDark, 0.3);
    ctx.fillRect(x + 3, y + 14, 2.5, h - 30);
    ctx.fillRect(x + w - 6, y + 14, 2.5, h - 30);
  }
  function vine(ctx, x, groundY, h, t, P, dir) {
    ctx.strokeStyle = alpha(P.leafDark, 0.85);
    ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath();
    let px = x, py = groundY;
    ctx.moveTo(px, py);
    const segs = Math.floor(h / 26);
    for (let i = 1; i <= segs; i++) {
      const ny = groundY - (h / segs) * i;
      const nx = x + Math.sin(i * 1.7) * 8 * dir;
      ctx.quadraticCurveTo(px + Math.sin(i) * 10 * dir, (py + ny) / 2, nx, ny);
      px = nx; py = ny;
    }
    ctx.stroke();
    for (let i = 1; i <= segs; i++) {
      const ny = groundY - (h / segs) * i + 6;
      const nx = x + Math.sin(i * 1.7) * 8 * dir;
      const sway = Math.sin(t * 1.4 + i) * 1.5;
      ctx.fillStyle = alpha(i % 2 ? P.leaf : P.leafLight, 0.92);
      ctx.beginPath();
      ctx.ellipse(nx + 6 * dir + sway, ny, 6, 3.2, dir * 0.5 + sway * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  GOL.drawArch = drawArch;

  // ----------------------------------------------------------- creatures ---
  // Inhabitants, never enemies. All draw at (x, groundY), facing = ±1.
  function drawBird(ctx, x, y, t, P, state) {
    // state: {phase, pecking, fleeing, flap, facing}
    const f = state.facing || 1;
    const hop = state.fleeing ? 0 : Math.max(0, Math.sin(t * 3 + state.phase)) * 2;
    ctx.save();
    ctx.translate(x, y - 8 - hop);
    ctx.scale(f, 1);
    const body = state.col || '#7FB8A8';
    // tail
    ctx.fillStyle = shade(body, 0.25);
    ctx.beginPath(); ctx.moveTo(-8, -2); ctx.lineTo(-15, -6); ctx.lineTo(-14, 0); ctx.closePath(); ctx.fill();
    // body
    const gg = ctx.createLinearGradient(0, -10, 0, 6);
    gg.addColorStop(0, tint(body, 0.25)); gg.addColorStop(1, body);
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.ellipse(0, 0, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
    // breast
    ctx.fillStyle = alpha('#F7EFDA', 0.85);
    ctx.beginPath(); ctx.ellipse(2.5, 2, 4.5, 4, 0, 0, Math.PI * 2); ctx.fill();
    // wing (flaps when fleeing)
    const wingA = state.fleeing ? Math.sin(t * 26 + state.phase) * 0.9 : 0.15;
    ctx.save();
    ctx.translate(-1, -2);
    ctx.rotate(-wingA);
    ctx.fillStyle = shade(body, 0.18);
    ctx.beginPath(); ctx.ellipse(-2, 0, 7, 3.6, -0.35, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // head
    const peck = state.pecking ? Math.max(0, Math.sin(t * 9 + state.phase)) * 3 : 0;
    ctx.fillStyle = tint(body, 0.15);
    ctx.beginPath(); ctx.arc(7, -6 + peck, 4.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#E8A64B';
    ctx.beginPath(); ctx.moveTo(10.5, -6 + peck); ctx.lineTo(15, -4.6 + peck); ctx.lineTo(10.5, -3.6 + peck); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3D3428';
    ctx.beginPath(); ctx.arc(8.2, -7 + peck, 1.1, 0, Math.PI * 2); ctx.fill();
    // legs
    if (!state.fleeing) {
      ctx.strokeStyle = '#B98A4F'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-2, 6); ctx.lineTo(-2, 8 + hop); ctx.moveTo(3, 6); ctx.lineTo(3, 8 + hop); ctx.stroke();
    }
    ctx.restore();
  }
  GOL.drawBird = drawBird;

  function drawButterfly(ctx, x, y, t, phase, colA, colB) {
    const flap = Math.sin(t * 12 + phase) * 0.75;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * 1.3 + phase) * 0.2);
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.scale(s, 1);
      ctx.rotate(flap * s * 0.5 + 0.2);
      ctx.fillStyle = alpha(colA, 0.92);
      ctx.beginPath(); ctx.ellipse(5.5, -2, 6, 4, 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = alpha(colB, 0.92);
      ctx.beginPath(); ctx.ellipse(4.5, 3, 4.5, 3, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = alpha('#FFFBEE', 0.7);
      ctx.beginPath(); ctx.arc(6.5, -3, 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#5A4632';
    ctx.beginPath(); ctx.ellipse(0, 0, 1.4, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  GOL.drawButterfly = drawButterfly;

  function drawTortoise(ctx, x, y, t, P, facing) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);
    const shuffle = Math.sin(t * 5) * 1.2;
    // legs
    ctx.fillStyle = '#9AA25C';
    ctx.beginPath(); ctx.ellipse(-10 + shuffle, -3, 3.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(8 - shuffle, -3, 3.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    // shell
    const g = ctx.createLinearGradient(0, -20, 0, -2);
    g.addColorStop(0, tint('#7C8F4A', 0.25)); g.addColorStop(1, '#66793C');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, -9, 15, 10, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = alpha('#4E5D2E', 0.6); ctx.lineWidth = 1.4;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 8, -18 + Math.abs(i) * 4); ctx.lineTo(i * 6, -2); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0, -9, 15, 10, 0, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    // head with slow bob
    const bob = Math.sin(t * 1.2) * 1.5;
    ctx.fillStyle = '#A8B06A';
    ctx.beginPath(); ctx.ellipse(16, -8 + bob, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3D3428';
    ctx.beginPath(); ctx.arc(18, -9 + bob, 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  GOL.drawTortoise = drawTortoise;
})();
