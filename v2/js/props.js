// Gems of Light — props.js  (v2: concept-art edition)
// The garden's furniture: trees, walls, water, the arch — and its inhabitants.
// Everything drawn to the boards: layered gouache greens, dew on the leaves,
// masonry warmed by morning light. Static props are pre-rendered at level load;
// moving water and creatures are drawn live. Anchors are bottom-center.
(function () {
  const GOL = window.GOL;
  const { mix, shade, tint, alpha } = GOL.color;
  const { wobblePath, dabs, blob, leafShape, makeCanvas } = GOL.paint;
  const TILE = GOL.TILE;

  // ------------------------------------------------------------- sprites ---
  function buildPropSprites(P, seed) {
    const S = {};

    // -- olive tree: broad, layered, generous — dew catching in the crown
    S.olive = [0, 1, 2].map((v) => {
      const w = 180, h = 172;
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
      // roots settling into the ground
      x.strokeStyle = alpha(P.trunkDark, 0.5); x.lineWidth = 4;
      for (const side of [-1, 1]) {
        x.beginPath(); x.moveTo(cx + side * 3, gy - 6);
        x.quadraticCurveTo(cx + side * 9, gy - 2, cx + side * 14, gy);
        x.stroke();
      }
      // branches
      x.strokeStyle = P.trunk; x.lineWidth = 6;
      x.beginPath(); x.moveTo(cx, gy - 58); x.quadraticCurveTo(cx - 26, gy - 76, cx - 40, gy - 84); x.stroke();
      x.beginPath(); x.moveTo(cx, gy - 60); x.quadraticCurveTo(cx + 24, gy - 80, cx + 38, gy - 88); x.stroke();
      // canopy: four passes deep→light (light upper-right), like the boards
      const cy = gy - 102;
      const layer = (col, dr, n, rad, ox, oy) => {
        const rr = GOL.rng(seed + 77 + v * 13 + n);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + rr() * 0.8;
          const dist = dr * (0.55 + rr() * 0.6);
          blob(x, cx + ox + Math.cos(a) * dist * 1.35, cy + oy + Math.sin(a) * dist * 0.75, rad * (0.8 + rr() * 0.5), col);
        }
      };
      layer(alpha(shade(P.leafDeep, 0.1), 0.95), 36, 10, 23, -4, 3);
      layer(alpha(P.leafDark, 0.95), 32, 9, 20, 0, 0);
      layer(P.leaf, 28, 9, 18, 2, -2);
      layer(P.leafLight, 22, 7, 12, 7, -7);
      // bright dabs toward the sun + a few dew sparks
      dabs(x, cx - 6, cy - 40, 62, 34, alpha(tint(P.leafLight, 0.4), 0.8), 9, seed + v * 7, 3, 7);
      const rd = GOL.rng(seed + v * 3 + 5);
      for (let i = 0; i < 4; i++) {
        const dxp = cx - 30 + rd() * 70, dyp = cy - 20 + rd() * 40;
        blob(x, dxp, dyp, 1.7, alpha(P.dew, 0.8));
        blob(x, dxp - 0.5, dyp - 0.5, 0.7, 'rgba(255,255,255,0.9)');
      }
      // a few hanging olives
      const ro = GOL.rng(seed + v * 91);
      x.fillStyle = alpha(shade(P.leafDeep, 0.25), 0.9);
      for (let i = 0; i < 5; i++) {
        x.beginPath(); x.ellipse(cx - 40 + ro() * 80, cy + 6 + ro() * 22, 2.2, 3, 0.4, 0, Math.PI * 2); x.fill();
      }
      c._anchor = { x: cx, y: gy + 2 };
      return c;
    });

    // -- cypress: tall, calm exclamation marks along the paths
    S.cypress = [0, 1].map((v) => {
      const w = 64, h = 196;
      const c = makeCanvas(w, h);
      const x = c.getContext('2d');
      const r = GOL.rng(seed + 61 + v * 17);
      const cx = w / 2, gy = h - 4;
      x.fillStyle = P.trunk;
      x.fillRect(cx - 3, gy - 16, 6, 16);
      // one soft flame-shaped silhouette first, then feathered tiers
      const topY = gy - 178;
      x.fillStyle = alpha(shade(P.leafDeep, 0.08), 0.95);
      x.beginPath();
      x.moveTo(cx, topY);
      x.quadraticCurveTo(cx + 21, gy - 90, cx + 13, gy - 18);
      x.lineTo(cx - 13, gy - 18);
      x.quadraticCurveTo(cx - 21, gy - 90, cx, topY);
      x.closePath(); x.fill();
      const tiers = 7;
      for (let i = 0; i < tiers; i++) {
        const tY = gy - 26 - i * 21;
        const tw = 19 * (1 - i / tiers) + 4;
        const col = i % 2 ? mix(P.leafDark, P.leafDeep, 0.5) : mix(P.leafDark, P.leaf, 0.45);
        x.beginPath();
        x.ellipse(cx + (r() - 0.5) * 3, tY, tw, 14, 0, 0, Math.PI * 2);
        x.fillStyle = col; x.fill();
        blob(x, cx + tw * 0.4, tY - 5, tw * 0.42, alpha(tint(col, 0.32), 0.85));
      }
      blob(x, cx, topY + 8, 6, mix(P.leafDark, P.leaf, 0.5));
      blob(x, cx + 2, topY + 6, 3, alpha(tint(P.leaf, 0.3), 0.9));
      c._anchor = { x: cx, y: gy + 2 };
      return c;
    });

    // -- bush: mounded leaves; variant 2 carries berries, all get blossoms
    S.bush = [0, 1, 2].map((v) => {
      const w = 96, h = 60;
      const c = makeCanvas(w, h);
      const x = c.getContext('2d');
      const r = GOL.rng(seed + 313 + v * 17);
      const gy = h - 4;
      for (let i = 0; i < 7; i++) {
        const bx = 12 + i * 11 + (r() - 0.5) * 8;
        const rad = 12 + r() * 8;
        blob(x, bx, gy - 10 - r() * 10, rad, i % 2 ? P.leaf : shade(P.leaf, 0.16));
      }
      dabs(x, 10, 8, w - 20, 24, alpha(P.leafLight, 0.8), 8, seed + v * 5, 2.5, 5);
      // leaf detailing: a few drawn leaves over the mounds
      for (let i = 0; i < 5; i++) {
        leafShape(x, 14 + r() * (w - 28), gy - 12 - r() * 16, 7, 2.8, r() * Math.PI, alpha(i % 2 ? P.leafLight : P.leafDark, 0.85));
      }
      if (v === 2) { // berries
        const rr = GOL.rng(seed + 99);
        x.fillStyle = '#E8896B';
        for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(16 + rr() * 60, gy - 12 - rr() * 14, 2.4, 0, Math.PI * 2); x.fill(); }
      } else if (v === 0) { // white blossoms tucked in
        const rr = GOL.rng(seed + 98);
        for (let i = 0; i < 3; i++) {
          const fx = 16 + rr() * 60, fy = gy - 14 - rr() * 12;
          for (let p = 0; p < 5; p++) {
            const a = (p / 5) * Math.PI * 2;
            blob(x, fx + Math.cos(a) * 2.4, fy + Math.sin(a) * 2.4, 1.7, alpha(P.blossom, 0.95));
          }
          blob(x, fx, fy, 1.2, alpha(P.gold, 0.9));
        }
      }
      // dew
      const rd = GOL.rng(seed + v * 7 + 44);
      for (let i = 0; i < 2; i++) {
        const dxp = 14 + rd() * (w - 28), dyp = gy - 8 - rd() * 14;
        blob(x, dxp, dyp, 1.5, alpha(P.dew, 0.85));
        blob(x, dxp - 0.4, dyp - 0.4, 0.6, 'rgba(255,255,255,0.9)');
      }
      c._anchor = { x: w / 2, y: gy + 2 };
      return c;
    });

    // -- flower patches, straight from the boards:
    //    v0 white blossoms · v1 lavender spikes · v2 golden buttercups
    S.flowers = [0, 1, 2].map((v) => {
      const w = 76, h = 52;
      const c = makeCanvas(w, h);
      const x = c.getContext('2d');
      const r = GOL.rng(seed + 421 + v * 23);
      const gy = h - 3;
      for (let i = 0; i < 6; i++) {
        const fx = 8 + i * 12 + (r() - 0.5) * 6, fh = 15 + r() * 16;
        x.strokeStyle = alpha(P.grassDark, 0.9); x.lineWidth = 1.6; x.lineCap = 'round';
        x.beginPath(); x.moveTo(fx, gy); x.quadraticCurveTo(fx + 2, gy - fh * 0.6, fx + (r() - 0.5) * 6, gy - fh); x.stroke();
        const hx = fx + (r() - 0.5) * 6, hy = gy - fh;
        // a leaf or two on the stem
        leafShape(x, fx + 1, gy - fh * 0.45, 6, 2.2, -0.9 + r() * 0.4, alpha(P.leaf, 0.9));
        if (v === 1) {
          // lavender: a spike of tiny florets
          for (let p = 0; p < 6; p++) {
            const py = hy + p * 2.6, sw2 = 2.6 - p * 0.28;
            blob(x, hx + (r() - 0.5) * 1.6, py, Math.max(1, sw2), alpha(p % 2 ? P.lavender : tint(P.lavender, 0.25), 0.95));
          }
        } else {
          const headCol = v === 0 ? P.blossom : P.gold;
          for (let p = 0; p < 5; p++) {
            const a = (p / 5) * Math.PI * 2 + r();
            blob(x, hx + Math.cos(a) * 3.1, hy + Math.sin(a) * 3.1, 2.9, alpha(headCol, 0.95));
          }
          blob(x, hx, hy, 1.9, v === 0 ? alpha(P.gold, 0.95) : alpha(tint(P.gold, 0.5), 0.95));
        }
      }
      c._anchor = { x: w / 2, y: gy + 1 };
      return c;
    });

    // -- low stone wall builder (n tiles wide): drystone courses, mossy cap
    S.wall = function (nTiles) {
      const w = nTiles * TILE, h = 48;
      const c = makeCanvas(w, h);
      const x = c.getContext('2d');
      const r = GOL.rng(seed + 87 + nTiles);
      const gy = h - 2;
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
          if (r() < 0.3) blob(x, sx + sw * 0.5, y + 8, 1.8, alpha(P.moss, 0.6));
          sx += sw + 2.5;
        }
      }
      x.fillStyle = alpha(P.stoneDark, 0.7);
      x.fillRect(2, gy - 30, w - 4, 3);
      // moss tufts and a trailing strand of ivy
      x.fillStyle = alpha(P.moss, 0.85);
      for (let i = 0; i < nTiles * 2; i++) {
        const mx = 6 + r() * (w - 12);
        x.beginPath(); x.ellipse(mx, gy - 29, 4 + r() * 3, 3, 0, Math.PI, 0); x.fill();
      }
      for (let i = 0; i < Math.max(1, nTiles - 1); i++) {
        const ix = 10 + r() * (w - 20);
        x.strokeStyle = alpha(P.leafDeep, 0.7); x.lineWidth = 1.4; x.lineCap = 'round';
        x.beginPath(); x.moveTo(ix, gy - 28);
        x.quadraticCurveTo(ix + 3, gy - 18, ix - 2 + r() * 5, gy - 8);
        x.stroke();
        leafShape(x, ix + 1, gy - 18, 5, 2.2, 0.8 + r(), alpha(P.leaf, 0.85));
      }
      c._anchor = { x: w / 2, y: gy + 1 };
      return c;
    };

    // -- lantern on a post, wound with a climbing vine
    {
      const w = 44, h = 100;
      const c = makeCanvas(w, h);
      const x = c.getContext('2d');
      const cx = w / 2, gy = h - 3;
      x.strokeStyle = P.trunkDark; x.lineWidth = 5; x.lineCap = 'round';
      x.beginPath(); x.moveTo(cx, gy); x.lineTo(cx, gy - 52); x.stroke();
      // vine winding up the post
      x.strokeStyle = alpha(P.leafDeep, 0.85); x.lineWidth = 1.8;
      x.beginPath();
      x.moveTo(cx - 3, gy);
      x.quadraticCurveTo(cx + 6, gy - 14, cx - 4, gy - 26);
      x.quadraticCurveTo(cx + 5, gy - 38, cx - 2, gy - 48);
      x.stroke();
      leafShape(x, cx + 3, gy - 18, 6, 2.4, -0.5, alpha(P.leaf, 0.9));
      leafShape(x, cx - 4, gy - 34, 6, 2.4, Math.PI + 0.4, alpha(P.leafLight, 0.9));
      // lantern body
      const ly = gy - 66;
      const g = x.createRadialGradient(cx, ly, 1, cx, ly, 17);
      g.addColorStop(0, alpha('#FFE9A8', 0.55));
      g.addColorStop(1, alpha('#FFE9A8', 0));
      x.fillStyle = g; x.beginPath(); x.arc(cx, ly, 17, 0, Math.PI * 2); x.fill();
      x.fillStyle = shade(P.goldDeep, 0.25);
      x.beginPath();
      x.moveTo(cx - 8, ly + 10); x.lineTo(cx + 8, ly + 10); x.lineTo(cx + 6, ly - 8); x.lineTo(cx, ly - 13); x.lineTo(cx - 6, ly - 8);
      x.closePath(); x.fill();
      x.fillStyle = alpha('#FFEFC2', 0.9);
      x.beginPath();
      x.moveTo(cx - 5, ly + 8); x.lineTo(cx + 5, ly + 8); x.lineTo(cx + 4, ly - 6); x.lineTo(cx - 4, ly - 6);
      x.closePath(); x.fill();
      // little flame
      x.fillStyle = alpha(P.gold, 0.95);
      x.beginPath(); x.ellipse(cx, ly + 2, 1.8, 3, 0, 0, Math.PI * 2); x.fill();
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
      // a carved ring on the pedestal
      x.strokeStyle = alpha(P.stoneDark, 0.4); x.lineWidth = 1.4;
      x.beginPath(); x.moveTo(cx - 11, gy - 12); x.lineTo(cx + 11, gy - 12); x.stroke();
      // moss at the foot
      x.fillStyle = alpha(P.moss, 0.8);
      x.beginPath(); x.ellipse(cx - 9, gy - 1, 5, 2.5, 0, Math.PI, 0); x.fill();
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

    // -- stepping stone (in water), mossy and sure
    S.stepStone = [0, 1].map((v) => {
      const w = 56, h = 26;
      const c = makeCanvas(w, h);
      const x = c.getContext('2d');
      const r = GOL.rng(seed + 55 + v * 7);
      wobblePath(x, [[6, 8], [w - 6, 8], [w - 10, h - 4], [10, h - 4]], seed + 56 + v, 3);
      const g = x.createLinearGradient(0, 6, 0, h);
      g.addColorStop(0, tint(P.stone, 0.3)); g.addColorStop(1, P.stoneShade);
      x.fillStyle = g; x.fill();
      dabs(x, 8, 8, w - 16, 10, alpha(P.stoneDark, 0.25), 3, seed + v, 1.5, 3);
      x.fillStyle = alpha(P.moss, 0.85);
      x.beginPath(); x.ellipse(14 + r() * 20, 9.5, 4 + r() * 2, 2, 0, Math.PI, 0); x.fill();
      blob(x, 34 + r() * 8, 11, 1.4, alpha(P.dew, 0.9));
      c._anchor = { x: w / 2, y: h - 6 };
      return c;
    });

    return S;
  }
  GOL.buildPropSprites = buildPropSprites;

  // --------------------------------------------------------------- water ---
  // Animated water body: fills a rect from surfaceY down. Drawn live.
  // Still pools carry lily pads now, the way the courtyard board does.
  function drawWater(ctx, x, y, w, h, t, P) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, alpha(P.water, 0.88));
    g.addColorStop(0.5, alpha(mix(P.water, P.waterDeep, 0.6), 0.92));
    g.addColorStop(1, alpha(shade(P.waterDeep, 0.15), 0.95));
    ctx.fillStyle = g;
    ctx.fillRect(x, y + 3, w, h - 3);
    // sunken glow — light entering the water from the surface
    const gl = ctx.createLinearGradient(0, y, 0, y + Math.min(40, h));
    gl.addColorStop(0, alpha(P.waterHi, 0.3));
    gl.addColorStop(1, alpha(P.waterHi, 0));
    ctx.fillStyle = gl;
    ctx.fillRect(x, y + 3, w, Math.min(40, h));
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
    // lily pads on wider, calmer water
    if (w >= 140) {
      const n = Math.floor(w / 150);
      for (let i = 0; i < n; i++) {
        const px = x + 55 + ((i * 173) % Math.max(1, w - 110));
        const bobb = Math.sin(t * 1.1 + i * 2.4) * 1.4;
        const py = y + 4 + bobb;
        ctx.fillStyle = alpha(mix(P.leaf, P.water, 0.25), 0.95);
        ctx.beginPath();
        ctx.ellipse(px, py, 12, 4.6, 0, 0, Math.PI * 2);
        ctx.fill();
        // the notch
        ctx.fillStyle = alpha(mix(P.waterDeep, P.leafDark, 0.3), 0.8);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + 12, py - 2.6);
        ctx.lineTo(px + 12, py + 2.2);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = alpha(tint(P.leaf, 0.35), 0.8);
        ctx.beginPath();
        ctx.ellipse(px - 3, py - 1.3, 6, 2, -0.1, 0, Math.PI * 2);
        ctx.fill();
        // every third pad holds a white lotus
        if (i % 3 === 0) {
          for (let p = 0; p < 5; p++) {
            const a = -Math.PI / 2 + (p - 2) * 0.5;
            ctx.fillStyle = alpha('#FBF4E2', 0.95);
            ctx.beginPath();
            ctx.ellipse(px + Math.cos(a) * 3.4, py - 4 + Math.sin(a) * 2.6, 2.4, 4, a + Math.PI / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          blob(ctx, px, py - 3.4, 1.6, alpha(P.gold, 0.9));
        }
      }
    }
  }
  GOL.drawWater = drawWater;

  // Waterfall: a layered translucent veil with foam and mist, board panel 5.
  // (x,y)=top-center, falls h px.
  function drawWaterfall(ctx, x, y, w, h, t, P) {
    ctx.save();
    // widest, most transparent back sheet
    const back = ctx.createLinearGradient(0, y, 0, y + h);
    back.addColorStop(0, alpha(P.waterHi, 0.3));
    back.addColorStop(0.5, alpha(P.water, 0.34));
    back.addColorStop(1, alpha(P.waterHi, 0.45));
    ctx.fillStyle = back;
    ctx.fillRect(x - w * 0.72, y, w * 1.44, h);
    // main veil
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, alpha(P.waterHi, 0.5));
    g.addColorStop(0.25, alpha(P.water, 0.6));
    g.addColorStop(1, alpha(P.waterHi, 0.72));
    ctx.fillStyle = g;
    ctx.fillRect(x - w / 2, y, w, h);
    // bright center column where the water runs fastest
    const cg = ctx.createLinearGradient(0, y, 0, y + h);
    cg.addColorStop(0, alpha('#FFFFFF', 0.16));
    cg.addColorStop(1, alpha('#FFFFFF', 0.3));
    ctx.fillStyle = cg;
    ctx.fillRect(x - w * 0.22, y, w * 0.44, h);
    // falling streaks, three depths
    ctx.lineCap = 'round';
    const n = Math.max(4, Math.round(w / 7));
    for (let i = 0; i < n; i++) {
      const depth = i % 3;
      const sx = x - w / 2 + (i + 0.5) * (w / n) + Math.sin(i * 3.7) * 2;
      const phase = ((t * (170 + depth * 55) + i * 61) % h);
      ctx.strokeStyle = alpha('#FFFFFF', 0.28 + depth * 0.14);
      ctx.lineWidth = 1.8 + depth * 0.7;
      for (let k = -1; k < 2; k++) {
        const sy = y + (((phase + k * h * 0.45) % h) + h) % h;
        const len = 14 + depth * 10;
        if (sy + len < y + h) {
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.sin(t + i) * 1.2, sy + len); ctx.stroke();
        }
      }
    }
    // shimmering droplets peeling off the veil
    const rr = GOL.rng(1 + Math.floor(t * 8));
    for (let i = 0; i < 3; i++) {
      blob(ctx, x - w / 2 + rr() * w, y + rr() * h, 1.3, alpha('#FFFFFF', 0.5 + rr() * 0.3));
    }
    // foam at the base
    for (let i = 0; i < n + 2; i++) {
      const fx = x - w / 2 - 8 + i * ((w + 16) / (n + 1));
      const r = 5 + Math.sin(t * 3 + i * 2.2) * 2.2;
      blob(ctx, fx, y + h - 3 + Math.sin(t * 4 + i) * 1.5, Math.max(2.5, r), alpha('#FFFFFF', 0.5));
    }
    // mist drifting off the fall
    for (let i = 0; i < 4; i++) {
      const mr = 13 + i * 8 + Math.sin(t * 0.9 + i * 2) * 3;
      blob(ctx, x + Math.sin(t * 0.6 + i * 2.3) * w * 0.5, y + h - 8 - i * 10, mr, alpha(P.mist, 0.12));
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
    // basin: carved cream stone with a thin green-tile ring
    const g = ctx.createLinearGradient(0, -26, 0, 0);
    g.addColorStop(0, tint(P.stone, 0.3)); g.addColorStop(1, P.stoneShade);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, -6, 52, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = P.stoneShade;
    ctx.beginPath(); ctx.ellipse(0, -2, 58, 15, 0, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = alpha(mix(P.stoneDark, '#5E8F72', 0.55), 0.5);
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.ellipse(0, -7, 48, 12, 0, 0, Math.PI * 2); ctx.stroke();
    // pool
    ctx.fillStyle = alpha(P.water, 0.92);
    ctx.beginPath(); ctx.ellipse(0, -8, 44, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = alpha(P.waterHi, 0.6);
    ctx.beginPath(); ctx.ellipse(-10, -10, 16, 3.5, -0.15, 0, Math.PI * 2); ctx.fill();
    // a lily pad riding the ripples
    ctx.fillStyle = alpha(mix(P.leaf, P.water, 0.3), 0.95);
    ctx.beginPath(); ctx.ellipse(22 + Math.sin(t * 0.9) * 2, -8.5, 7, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    // pillar + jets
    ctx.fillStyle = P.stone;
    ctx.fillRect(-4, -30, 8, 22);
    ctx.fillStyle = alpha(tint(P.stone, 0.5), 0.8);
    ctx.fillRect(-4, -30, 3, 22);
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
  // The level-ending gate: cream masonry, a band of brick voussoirs, moss on
  // every ledge, ivy curtains, the star rosette burning quietly at the crown.
  // (x,y)=ground at arch center. openAmount 0..1.
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
    // stone frame: pillars + arch band
    const pw = (W - inW) / 2 - 6;
    pillar(ctx, -inW / 2 - 6 - pw, -H + 26, pw, H - 26, P);
    pillar(ctx, inW / 2 + 6, -H + 26, pw, H - 26, P);
    // arch band (outer minus inner, as one even-odd path) — filled, then
    // divided into brick voussoirs radiating around the curve
    ctx.save();
    archPath(ctx, 0, 0, inW + 26, inH + 22);
    archPath(ctx, 0, 0, inW + 4, inH + 2, true);
    ctx.clip('evenodd');
    const bg = ctx.createLinearGradient(0, -inH - 24, 0, 0);
    bg.addColorStop(0, tint(P.stone, 0.3)); bg.addColorStop(1, P.stoneShade);
    ctx.fillStyle = bg;
    ctx.fillRect(-W / 2, -H, W, H);
    dabs(ctx, -inW / 2 - 12, -inH - 20, inW + 24, 30, alpha(P.stoneDark, 0.2), 6, 1234, 2, 4);
    // voussoir joints, fanning from the arch's spring line
    ctx.strokeStyle = alpha(P.stoneDark, 0.32); ctx.lineWidth = 1.6;
    const springY = -inH + (inW + 26) * 0.42;
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      const cxr = Math.cos(a), syr = Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(cxr * (inW / 2 + 2), springY * 0.4 + syr * (inH * 0.62));
      ctx.lineTo(cxr * (inW / 2 + 15), springY * 0.4 + syr * (inH * 0.62 + 24));
      ctx.stroke();
    }
    // moss creeping into the joints
    const rms = GOL.rng(77);
    ctx.fillStyle = alpha(P.moss, 0.6);
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + rms() * Math.PI;
      blob(ctx, Math.cos(a) * (inW / 2 + 6 + rms() * 10), springY * 0.4 + Math.sin(a) * (inH * 0.6 + rms() * 16), 2 + rms() * 2, alpha(P.moss, 0.5));
    }
    ctx.restore();
    // a mossy brow along the top of the arch
    ctx.fillStyle = alpha(P.moss, 0.9);
    for (let i = -3; i <= 3; i++) {
      const bx = i * 11, by = -inH - 20 - Math.cos(i * 0.5) * 8;
      ctx.beginPath();
      ctx.ellipse(bx, by, 7 - Math.abs(i), 3.5, i * 0.1, Math.PI, 0);
      ctx.fill();
    }
    dabs(ctx, -30, -inH - 34, 60, 12, alpha(P.grassLight, 0.7), 5, 555, 1.5, 3);
    // keystone rosette
    ctx.fillStyle = tint(P.stone, 0.35);
    GOL.star8Path(ctx, 0, -inH - 26, 17, Math.PI / 8);
    ctx.fill();
    ctx.strokeStyle = alpha(P.goldDeep, 0.8); ctx.lineWidth = 2;
    GOL.star8Path(ctx, 0, -inH - 26, 17, Math.PI / 8);
    ctx.stroke();
    ctx.fillStyle = alpha(P.gold, 0.9 + 0.1 * Math.sin(t * 2));
    ctx.beginPath(); ctx.arc(0, -inH - 26, 5, 0, Math.PI * 2); ctx.fill();
    // ivy curtains down both pillars
    vine(ctx, -inW / 2 - 8 - pw / 2, 0, H - 40, t, P, 1);
    vine(ctx, inW / 2 + 6 + pw / 2, 0, H - 46, t, P, -1);
    // flowers nestled at the feet
    for (const side of [-1, 1]) {
      const fx = side * (inW / 2 + 6 + pw / 2);
      blob(ctx, fx - 4, -3, 4, alpha(P.leaf, 0.9));
      blob(ctx, fx + 4, -4, 4.5, alpha(P.leafDark, 0.9));
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        blob(ctx, fx + Math.cos(a) * 2.2, -8 + Math.sin(a) * 2.2, 1.6, alpha(P.blossom, 0.95));
      }
      blob(ctx, fx, -8, 1.1, alpha(P.gold, 0.9));
    }
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
    // masonry joints
    ctx.strokeStyle = alpha(P.stoneDark, 0.24); ctx.lineWidth = 1.3;
    for (let i = 1; i < 5; i++) {
      const jy = y + (h / 5) * i;
      ctx.beginPath(); ctx.moveTo(x + 2, jy); ctx.lineTo(x + w - 2, jy); ctx.stroke();
    }
    // capital + base
    ctx.fillStyle = tint(P.stone, 0.25);
    ctx.fillRect(x - 4, y, w + 8, 10);
    ctx.fillRect(x - 4, y + h - 12, w + 8, 12);
    ctx.fillStyle = alpha(P.stoneDark, 0.3);
    ctx.fillRect(x + 3, y + 14, 2.5, h - 30);
    ctx.fillRect(x + w - 6, y + 14, 2.5, h - 30);
    // moss on the capital
    ctx.fillStyle = alpha(P.moss, 0.75);
    ctx.beginPath(); ctx.ellipse(x + w * 0.3, y + 1, 4, 2, 0, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + w * 0.75, y + 1, 3, 1.6, 0, Math.PI, 0); ctx.fill();
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
      // paired leaflet for fullness
      ctx.fillStyle = alpha(P.leafDark, 0.75);
      ctx.beginPath();
      ctx.ellipse(nx - 4 * dir - sway * 0.5, ny + 4, 4, 2.3, -dir * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  GOL.drawArch = drawArch;

  // ----------------------------------------------------------- creatures ---
  // Inhabitants, never enemies. All draw at (x, groundY), facing = ±1.
  // The little teal moonbirds of the boards.
  function drawBird(ctx, x, y, t, P, state) {
    // state: {phase, pecking, fleeing, flap, facing}
    const f = state.facing || 1;
    const hop = state.fleeing ? 0 : Math.max(0, Math.sin(t * 3 + state.phase)) * 2;
    ctx.save();
    ctx.translate(x, y - 8 - hop);
    ctx.scale(f, 1);
    const body = state.col || '#85BCAE';
    // tail
    ctx.fillStyle = shade(body, 0.25);
    ctx.beginPath(); ctx.moveTo(-8, -2); ctx.lineTo(-15, -6); ctx.lineTo(-14, 0); ctx.closePath(); ctx.fill();
    // body
    const gg = ctx.createLinearGradient(0, -10, 0, 6);
    gg.addColorStop(0, tint(body, 0.3)); gg.addColorStop(1, body);
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.ellipse(0, 0, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
    // cream breast
    ctx.fillStyle = alpha('#F7EFDA', 0.9);
    ctx.beginPath(); ctx.ellipse(2.5, 2, 4.5, 4, 0, 0, Math.PI * 2); ctx.fill();
    // wing (flaps when fleeing) — leaf-veined like the boards' moonbird
    const wingA = state.fleeing ? Math.sin(t * 26 + state.phase) * 0.9 : 0.15;
    ctx.save();
    ctx.translate(-1, -2);
    ctx.rotate(-wingA);
    ctx.fillStyle = shade(body, 0.18);
    ctx.beginPath(); ctx.ellipse(-2, 0, 7, 3.6, -0.35, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = alpha(shade(body, 0.4), 0.6);
    ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(2, -1.5); ctx.lineTo(-6, 1.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, 0.5); ctx.lineTo(-5, 2.8); ctx.stroke();
    ctx.restore();
    // head
    const peck = state.pecking ? Math.max(0, Math.sin(t * 9 + state.phase)) * 3 : 0;
    ctx.fillStyle = tint(body, 0.15);
    ctx.beginPath(); ctx.arc(7, -6 + peck, 4.6, 0, Math.PI * 2); ctx.fill();
    // crest feathers
    ctx.strokeStyle = shade(body, 0.2); ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(6, -10 + peck); ctx.quadraticCurveTo(6.5, -13 + peck, 8.5, -13.5 + peck); ctx.stroke();
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
    // a shine on the shell's sun side
    ctx.fillStyle = alpha(tint('#7C8F4A', 0.5), 0.5);
    ctx.beginPath(); ctx.ellipse(4, -14, 5, 2.6, -0.3, 0, Math.PI * 2); ctx.fill();
    // head with slow bob
    const bob = Math.sin(t * 1.2) * 1.5;
    ctx.fillStyle = '#A8B06A';
    ctx.beginPath(); ctx.ellipse(16, -8 + bob, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3D3428';
    ctx.beginPath(); ctx.arc(18, -9 + bob, 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  GOL.drawTortoise = drawTortoise;

  // The patient snail from the first board, riding its cream-and-tan shell.
  function drawSnail(ctx, x, y, t, P, facing) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing || 1, 1);
    const stretch = 1 + Math.sin(t * 2.2) * 0.08;
    // body: a soft warm foot
    ctx.fillStyle = '#D9B98A';
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.quadraticCurveTo(-2, -4.5, 7 * stretch, -4);
    ctx.quadraticCurveTo(11 * stretch, -3.5, 11 * stretch, -1);
    ctx.quadraticCurveTo(4, 0.5, -8, 0);
    ctx.closePath(); ctx.fill();
    // eye stalks
    ctx.strokeStyle = '#C6A26E'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    const nod = Math.sin(t * 1.7) * 0.8;
    for (const side of [0, 1]) {
      const bx2 = 9 * stretch + side * 1.5, tip = -8.5 - side * 0.8 + nod;
      ctx.beginPath(); ctx.moveTo(bx2, -3.5); ctx.quadraticCurveTo(bx2 + 1, tip + 2, bx2 + 1.6, tip); ctx.stroke();
      ctx.fillStyle = '#3D3428';
      ctx.beginPath(); ctx.arc(bx2 + 1.7, tip, 0.9, 0, Math.PI * 2); ctx.fill();
    }
    // shell: cream spiral with tan bands
    const sg = ctx.createRadialGradient(-2, -8.5, 1, -1, -7.5, 8);
    sg.addColorStop(0, tint('#C99E62', 0.55));
    sg.addColorStop(1, '#B58A52');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(-1.5, -7.5, 7.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = alpha('#8A6B3E', 0.75); ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 4.2; a += 0.3) {
      const rr = 0.9 + a * 1.35;
      const px = -1.5 + Math.cos(a + 1) * rr * 0.92, py = -7.5 + Math.sin(a + 1) * rr * 0.85;
      a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = alpha('#FFF6DC', 0.6);
    ctx.beginPath(); ctx.ellipse(1, -10.5, 2.6, 1.5, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  GOL.drawSnail = drawSnail;

  // The soft-eyed rabbit who watches from the bank in the last panel.
  function drawRabbit(ctx, x, y, t, P, state) {
    state = state || {};
    const f = state.facing || 1;
    const hop = state.hopT != null ? Math.sin(Math.min(1, state.hopT) * Math.PI) * 8 : 0;
    ctx.save();
    ctx.translate(x, y - hop);
    ctx.scale(f, 1);
    const fur = '#B99B78', furLight = tint('#B99B78', 0.35), furDark = shade('#B99B78', 0.2);
    // haunch
    ctx.fillStyle = fur;
    ctx.beginPath(); ctx.ellipse(-4, -8, 8.5, 8, -0.15, 0, Math.PI * 2); ctx.fill();
    // body → chest
    ctx.fillStyle = furLight;
    ctx.beginPath(); ctx.ellipse(3, -7, 6.5, 6.2, 0.2, 0, Math.PI * 2); ctx.fill();
    // head
    ctx.fillStyle = fur;
    ctx.beginPath(); ctx.ellipse(7, -14, 5.2, 4.6, 0.1, 0, Math.PI * 2); ctx.fill();
    // ears: one up, one relaxed, twitching now and then
    const twitch = Math.sin(t * 1.3) > 0.92 ? Math.sin(t * 26) * 0.14 : 0;
    for (const e of [0, 1]) {
      ctx.save();
      ctx.translate(6 + e * 2.6, -17.5);
      ctx.rotate((e ? -0.34 : -0.06) + (e ? twitch : 0));
      ctx.fillStyle = e ? furDark : fur;
      ctx.beginPath(); ctx.ellipse(0, -6.4, 2.1, 6.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = alpha('#E8C6B2', 0.75);
      ctx.beginPath(); ctx.ellipse(0, -5.6, 1, 4.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // tail
    blob(ctx, -11, -6, 3, alpha('#F4EBD8', 0.95));
    // front paws
    ctx.fillStyle = furDark;
    ctx.beginPath(); ctx.ellipse(6.5, -2, 2.4, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(9.5, -2, 2.2, 1.9, 0, 0, Math.PI * 2); ctx.fill();
    // face: calm dark eye, small nose, whiskers
    ctx.fillStyle = '#3D3428';
    ctx.beginPath(); ctx.arc(8.2, -14.6, 1.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = alpha('#FFFFFF', 0.9);
    ctx.beginPath(); ctx.arc(8.6, -15, 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8A6B4F';
    ctx.beginPath(); ctx.ellipse(11.8, -13.4, 1, 0.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = alpha('#8A6B4F', 0.5); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(11.5, -12.8); ctx.lineTo(14.5, -12.2); ctx.moveTo(11.5, -13); ctx.lineTo(14.5, -13.8); ctx.stroke();
    // nibbling bob of the head is left to the caller via t
    ctx.restore();
  }
  GOL.drawRabbit = drawRabbit;
})();
