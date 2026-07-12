// Gems of Light — actors.js
// The gems (one per ayah), the little light-sprite the child inhabits,
// and the soft parchment-and-gold interface ornaments.
(function () {
  const GOL = window.GOL;
  const { mix, shade, tint, alpha } = GOL.color;
  const { blob } = GOL.paint;

  // ---------------------------------------------------------------- gems ---
  // A faceted stone, glowing from within, brightest thing on screen.
  // (x,y) = center. r ≈ 16 in-level. Light from upper-right.
  function drawGem(ctx, x, y, r, C, t, opts) {
    opts = opts || {};
    const glowAmt = opts.glow != null ? opts.glow : 1;
    const pulse = 0.82 + 0.18 * Math.sin(t * 2.1 + (opts.phase || 0));
    ctx.save();
    ctx.translate(x, y);

    // inner-light halo
    if (glowAmt > 0.01) {
      const g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 3.1);
      g.addColorStop(0, alpha(C.glow, 0.5 * pulse * glowAmt));
      g.addColorStop(0.45, alpha(C.glow, 0.17 * pulse * glowAmt));
      g.addColorStop(1, alpha(C.glow, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r * 3.1, 0, Math.PI * 2); ctx.fill();
    }

    // silhouette: a classic brilliant cut — table, crown, pavilion
    const w = r * 1.06, h = r * 1.28;
    const P = {
      tl: [-w * 0.52, -h * 0.62], tr: [w * 0.52, -h * 0.62],       // table edge
      ml: [-w, -h * 0.14], mr: [w, -h * 0.14],                     // girdle
      bt: [0, h]                                                   // culet
    };
    const sil = () => {
      ctx.beginPath();
      ctx.moveTo(P.tl[0], P.tl[1]);
      ctx.lineTo(P.tr[0], P.tr[1]);
      ctx.lineTo(P.mr[0], P.mr[1]);
      ctx.lineTo(P.bt[0], P.bt[1]);
      ctx.lineTo(P.ml[0], P.ml[1]);
      ctx.closePath();
    };
    sil();
    const bodyG = ctx.createLinearGradient(-w, -h, w, h);
    bodyG.addColorStop(0, C.dark);
    bodyG.addColorStop(0.55, C.base);
    bodyG.addColorStop(1, C.light);
    ctx.fillStyle = bodyG;
    ctx.fill();

    // facets
    const tri = (a, b, c, col) => {
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]);
      ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    };
    tri(P.tl, P.tr, [0, -h * 0.1], alpha(C.lighter, 0.85));          // table
    tri(P.tl, [0, -h * 0.1], P.ml, alpha(C.dark, 0.55));             // left crown
    tri(P.tr, [0, -h * 0.1], P.mr, alpha(C.lighter, 0.5));           // right crown
    tri(P.ml, [0, -h * 0.1], P.bt, alpha(C.darker, 0.42));           // left pavilion
    tri(P.mr, [0, -h * 0.1], P.bt, alpha(C.light, 0.42));            // right pavilion

    // living inner light
    const ig = ctx.createRadialGradient(r * 0.12, -r * 0.18, 0, 0, 0, r * 1.15);
    ig.addColorStop(0, alpha('#FFFFFF', 0.5 * pulse));
    ig.addColorStop(0.4, alpha(C.glow, 0.24 * pulse));
    ig.addColorStop(1, alpha(C.glow, 0));
    sil(); ctx.fillStyle = ig; ctx.fill();

    // slow specular sweep
    const sweep = ((t * 0.35 + (opts.phase || 0)) % 2) - 0.5;
    if (sweep > -0.2 && sweep < 1.2) {
      ctx.save();
      sil(); ctx.clip();
      const sx = -w + sweep * 2 * w;
      const sg = ctx.createLinearGradient(sx - r * 0.5, 0, sx + r * 0.5, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)');
      sg.addColorStop(0.5, 'rgba(255,255,255,0.4)');
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.rotate(-0.4);
      ctx.fillRect(-w * 2, -h * 2, w * 4, h * 4);
      ctx.restore();
    }

    // rim: darker tone of itself, never black
    sil();
    ctx.strokeStyle = alpha(C.darker, 0.8);
    ctx.lineWidth = Math.max(1.2, r * 0.09);
    ctx.lineJoin = 'round';
    ctx.stroke();

    // twinkle
    const tw = Math.sin(t * 3.2 + (opts.phase || 0) * 5);
    if (tw > 0.65) {
      const a = (tw - 0.65) / 0.35;
      ctx.strokeStyle = alpha('#FFFFFF', 0.9 * a);
      ctx.lineWidth = 1.4; ctx.lineCap = 'round';
      const tx = w * 0.38, ty = -h * 0.42, tr2 = r * 0.34 * a;
      ctx.beginPath();
      ctx.moveTo(tx - tr2, ty); ctx.lineTo(tx + tr2, ty);
      ctx.moveTo(tx, ty - tr2); ctx.lineTo(tx, ty + tr2);
      ctx.stroke();
    }
    ctx.restore();
  }
  GOL.drawGem = drawGem;

  // A gem wrapped in light — pearl-soft, all alike, until it is known.
  // Used at the listening gate, on Star Walks, and in the Moon Trials.
  function drawVeiledGem(ctx, x, y, r, t, phase, pulse, heard) {
    ctx.save();
    ctx.translate(x, y);
    const breathe = 0.85 + 0.15 * Math.sin(t * 2 + (phase || 0));
    const halo = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 2.6);
    halo.addColorStop(0, alpha('#FFF6DC', 0.5 * breathe));
    halo.addColorStop(1, alpha('#FFF6DC', 0));
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0, 0, r * 2.6, 0, Math.PI * 2); ctx.fill();
    // pearl body
    const bg = ctx.createRadialGradient(r * 0.28, -r * 0.3, r * 0.1, 0, 0, r * 1.1);
    bg.addColorStop(0, '#FFFDF4');
    bg.addColorStop(0.6, '#F7ECCB');
    bg.addColorStop(1, '#E8D5A0');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = alpha('#D9A44A', 0.55);
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(0, 0, r - 0.8, 0, Math.PI * 2); ctx.stroke();
    // a slow star turning inside the light
    GOL.star8Path(ctx, 0, 0, r * 0.5, t * 0.4 + (phase || 0));
    ctx.fillStyle = alpha('#EBC77E', 0.7 + (pulse || 0) * 0.3);
    ctx.fill();
    // sound-ripples when it is speaking
    if ((pulse || 0) > 0.01) {
      ctx.strokeStyle = alpha('#FFE9A8', 0.6 * pulse);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r + 8 + (1 - pulse) * 26, 0, Math.PI * 2); ctx.stroke();
    }
    // an unheard gem waves shyly for attention
    if (!heard) {
      const tw = Math.sin(t * 2.6 + (phase || 0) * 3);
      if (tw > 0.4) GOL.star8(ctx, r * 0.75, -r * 0.95, 4 * (tw - 0.4) / 0.6, Math.PI / 8, alpha('#FFFFFF', 0.9));
    }
    ctx.restore();
  }
  GOL.drawVeiledGem = drawVeiledGem;

  // The remembering moon: it waxes as a surah settles into the heart.
  // k = 0 (new) .. 1 (full). Drawn small beside map nodes and in trials.
  function drawMoon(ctx, x, y, r, k, t, opts) {
    opts = opts || {};
    ctx.save();
    ctx.translate(x, y);
    if (opts.glow !== false && k > 0.02) {
      const halo = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 2.4);
      halo.addColorStop(0, alpha('#FFF6DC', 0.28 * k));
      halo.addColorStop(1, alpha('#FFF6DC', 0));
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(0, 0, r * 2.4, 0, Math.PI * 2); ctx.fill();
    }
    // dark disc (the not-yet-remembered part)
    ctx.fillStyle = alpha('#57685B', 0.55);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    // lit part: crescent → full, carved with an offset shadow disc
    if (k > 0.01) {
      ctx.save();
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
      const lg = ctx.createLinearGradient(-r, -r, r, r);
      lg.addColorStop(0, '#FFFBEA'); lg.addColorStop(1, '#F3D492');
      ctx.fillStyle = lg;
      if (k >= 0.98) {
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      } else {
        // shadow disc slides away as k grows
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'destination-out';
        const off = (1 - k) * r * 1.9;
        ctx.beginPath(); ctx.arc(-off, 0, r * (1 + (1 - k) * 0.12), 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    ctx.strokeStyle = alpha('#D9A44A', 0.7);
    ctx.lineWidth = Math.max(1, r * 0.09);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  GOL.drawMoon = drawMoon;

  // ------------------------------------------------------------- the hero --
  // A small round creature made of light. (x,y) = feet center.
  // s: {vx, vy, grounded, facing, t, idleT, blink, squashX, squashY, moving}
  function drawSprite(ctx, x, y, s) {
    const R = 17;
    const t = s.t;
    ctx.save();
    ctx.translate(x, y);

    // soft ground shadow
    if (s.groundDist != null) {
      const d = Math.min(1, Math.max(0, 1 - s.groundDist / 160));
      ctx.fillStyle = alpha('#3E5C42', 0.16 * d);
      ctx.beginPath();
      ctx.ellipse(0, s.groundDist * 0 + (s.groundDist || 0), R * (0.75 + 0.2 * d), 4.5 * d + 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const sx = s.squashX || 1, sy = s.squashY || 1;
    const bob = s.moving && s.grounded ? Math.abs(Math.sin(t * 9)) * -2.2 : Math.sin(t * 1.6) * -1.2;
    ctx.translate(0, bob);
    // lean into movement
    ctx.rotate((s.vx || 0) / 220 * 0.12);

    // glow halo
    const halo = ctx.createRadialGradient(0, -R, R * 0.3, 0, -R, R * 2.6);
    const breathe = 0.8 + 0.2 * Math.sin(t * 1.8);
    halo.addColorStop(0, alpha('#FFF3C4', 0.38 * breathe));
    halo.addColorStop(0.5, alpha('#FFF3C4', 0.13 * breathe));
    halo.addColorStop(1, alpha('#FFF3C4', 0));
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0, -R, R * 2.6, 0, Math.PI * 2); ctx.fill();

    // legs (under body): little rounded stubs with a happy walk cycle
    const walk = s.moving && s.grounded ? Math.sin(t * 11) : 0;
    const inAir = !s.grounded;
    ctx.fillStyle = '#E3B76F';
    for (const side of [-1, 1]) {
      const lift = inAir ? -3 : Math.max(0, walk * side) * 4.5;
      const lx = side * 6.5 * sx;
      ctx.beginPath();
      ctx.ellipse(lx, -3 - lift, 4.2, 5.5, side * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    // body
    ctx.save();
    ctx.scale(sx, sy);
    const bg = ctx.createRadialGradient(R * 0.25, -R * 1.25, R * 0.15, 0, -R, R * 1.15);
    bg.addColorStop(0, '#FFFBEA');
    bg.addColorStop(0.55, '#FFF1CC');
    bg.addColorStop(1, '#F3D492');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(0, -R, R, 0, Math.PI * 2); ctx.fill();
    // soft rim, warm — never black
    ctx.strokeStyle = alpha('#D9A44A', 0.55);
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(0, -R, R - 0.6, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // sprout: two little leaves that flutter as it moves
    ctx.save();
    ctx.translate(0, -R * 2 * sy + 2);
    const flut = (s.vx || 0) / 220 * 0.5 + Math.sin(t * 3.1) * 0.12;
    ctx.rotate(flut);
    ctx.strokeStyle = '#6DA84E'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 2); ctx.quadraticCurveTo(0.5, -2, 0, -4); ctx.stroke();
    for (const side of [-1, 1]) {
      ctx.fillStyle = side < 0 ? '#77B368' : '#A3D488';
      ctx.beginPath();
      ctx.ellipse(side * 4, -5.5, 4.6, 2.6, side * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // face
    const f = s.facing || 1;
    const lookUp = Math.min(1, Math.max(0, (s.idleT || 0) - 2) / 0.6);   // it looks up when it rests
    const eyeY = -R * 1.15 - lookUp * 3.5;
    const eyeX = f * 4.2;
    const blink = s.blink ? 0.12 : 1;
    ctx.fillStyle = '#4A3B2A';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(eyeX + side * 5.4, eyeY, 2.5, 3.4 * blink, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!s.blink) {
      ctx.fillStyle = alpha('#FFFFFF', 0.95);
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(eyeX + side * 5.4 + 0.9, eyeY - 1.1 - lookUp, 0.95, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // cheeks
    ctx.fillStyle = alpha('#F0A987', 0.4);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(eyeX + side * 9.5, eyeY + 4.5, 2.6, 1.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // small content smile
    ctx.strokeStyle = alpha('#8A6B4F', 0.75);
    ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY + 4.4 - lookUp, 3.2, 0.25 * Math.PI, 0.75 * Math.PI);
    ctx.stroke();

    ctx.restore();
  }
  GOL.drawSprite = drawSprite;

  // -------------------------------------------------------------- panels ---
  // Parchment panel with soft gold double-frame and star corners.
  function drawPanel(ctx, x, y, w, h, opts) {
    opts = opts || {};
    const rad = opts.radius || 18;
    ctx.save();
    // shadow
    ctx.fillStyle = 'rgba(46,64,50,0.18)';
    rr(ctx, x + 3, y + 5, w, h, rad); ctx.fill();
    // parchment
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, opts.dark ? 'rgba(40,56,46,0.92)' : 'rgba(250,244,224,' + (opts.alpha != null ? opts.alpha : 0.96) + ')');
    g.addColorStop(1, opts.dark ? 'rgba(30,43,36,0.92)' : 'rgba(242,231,200,' + (opts.alpha != null ? opts.alpha : 0.96) + ')');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, rad); ctx.fill();
    // double gold frame
    ctx.strokeStyle = alpha('#C89B55', 0.85);
    ctx.lineWidth = 2;
    rr(ctx, x + 5, y + 5, w - 10, h - 10, rad - 5); ctx.stroke();
    ctx.strokeStyle = alpha('#C89B55', 0.4);
    ctx.lineWidth = 1;
    rr(ctx, x + 9, y + 9, w - 18, h - 18, Math.max(4, rad - 9)); ctx.stroke();
    // corner stars
    if (!opts.plain) {
      for (const cx of [x + 16, x + w - 16]) {
        for (const cy of [y + 16, y + h - 16]) {
          GOL.star8Path(ctx, cx, cy, 5, Math.PI / 8);
          ctx.fillStyle = alpha('#C89B55', 0.8);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  GOL.drawPanel = drawPanel;
  GOL.roundRect = rr;

  // The band at the top of the screen where collected ayat come to rest.
  // slots: total; found: array of gem indices collected (in ayah order 0-based).
  function drawHudBand(ctx, cx, y, slots, found, t, maxW) {
    // the band squeezes gently for long surahs (Al-'Alaq carries 19 gems)
    const gap = Math.max(22, Math.min(44, maxW ? (maxW - 34) / slots : 44));
    const w = slots * gap + 34, h = 52;
    const gr = Math.min(10, gap * 0.36), sr = Math.min(8, gap * 0.3);
    const x = cx - w / 2;
    drawPanel(ctx, x, y, w, h, { radius: 26, alpha: 0.82, plain: true });
    for (let i = 0; i < slots; i++) {
      const sx = x + 26 + i * gap;
      const sy = y + h / 2;
      if (found.includes(i)) {
        drawGem(ctx, sx, sy, gr, GOL.GEMS[i % GOL.GEMS.length], t, { glow: 0.55, phase: i });
      } else {
        GOL.star8Path(ctx, sx, sy, sr, Math.PI / 8);
        ctx.fillStyle = 'rgba(120,104,70,0.14)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(150,128,84,0.35)';
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }
    }
    return { x, y, w, h, slotX: (i) => x + 26 + i * gap, slotY: y + h / 2 };
  }
  GOL.drawHudBand = drawHudBand;

  // Round soft button. icon: 'pause'|'sound'|'soundOff'|'map'|'back'|'play'|'book'
  function drawButton(ctx, x, y, r, icon, opts) {
    opts = opts || {};
    ctx.save();
    ctx.fillStyle = 'rgba(250,244,224,' + (opts.alpha != null ? opts.alpha : 0.85) + ')';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = alpha('#C89B55', 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r - 2, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#7A6238';
    ctx.fillStyle = '#7A6238';
    ctx.lineWidth = Math.max(2.5, r * 0.14);
    ctx.lineCap = 'round';
    const s = r * 0.42;
    if (icon === 'pause') {
      ctx.beginPath(); ctx.moveTo(x - s * 0.5, y - s); ctx.lineTo(x - s * 0.5, y + s);
      ctx.moveTo(x + s * 0.5, y - s); ctx.lineTo(x + s * 0.5, y + s); ctx.stroke();
    } else if (icon === 'play') {
      ctx.beginPath(); ctx.moveTo(x - s * 0.6, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x - s * 0.6, y + s); ctx.closePath(); ctx.fill();
    } else if (icon === 'sound' || icon === 'soundOff') {
      ctx.beginPath();
      ctx.moveTo(x - s, y - s * 0.45); ctx.lineTo(x - s * 0.3, y - s * 0.45); ctx.lineTo(x + s * 0.25, y - s);
      ctx.lineTo(x + s * 0.25, y + s); ctx.lineTo(x - s * 0.3, y + s * 0.45); ctx.lineTo(x - s, y + s * 0.45);
      ctx.closePath(); ctx.fill();
      if (icon === 'sound') {
        ctx.beginPath(); ctx.arc(x + s * 0.55, y, s * 0.75, -0.9, 0.9); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(x + s * 0.5, y - s * 0.6); ctx.lineTo(x + s * 1.15, y + s * 0.6);
        ctx.moveTo(x + s * 1.15, y - s * 0.6); ctx.lineTo(x + s * 0.5, y + s * 0.6); ctx.stroke();
      }
    } else if (icon === 'map') {
      ctx.beginPath(); ctx.moveTo(x - s, y + s * 0.7); ctx.lineTo(x - s, y - s * 0.7); ctx.lineTo(x - s * 0.33, y - s * 0.4);
      ctx.lineTo(x + s * 0.33, y - s * 0.9); ctx.lineTo(x + s, y - s * 0.55); ctx.lineTo(x + s, y + s * 0.55);
      ctx.lineTo(x + s * 0.33, y + s * 0.2); ctx.lineTo(x - s * 0.33, y + s * 0.95); ctx.closePath();
      ctx.lineWidth = 2; ctx.stroke();
    } else if (icon === 'back') {
      ctx.beginPath(); ctx.moveTo(x + s * 0.6, y - s); ctx.lineTo(x - s * 0.6, y); ctx.lineTo(x + s * 0.6, y + s); ctx.stroke();
    } else if (icon === 'book') {
      ctx.beginPath();
      ctx.moveTo(x, y - s * 0.7); ctx.quadraticCurveTo(x - s * 0.9, y - s * 1.05, x - s * 1.05, y - s * 0.55);
      ctx.lineTo(x - s * 1.05, y + s * 0.75); ctx.quadraticCurveTo(x - s * 0.6, y + s * 0.45, x, y + s * 0.75);
      ctx.quadraticCurveTo(x + s * 0.6, y + s * 0.45, x + s * 1.05, y + s * 0.75);
      ctx.lineTo(x + s * 1.05, y - s * 0.55); ctx.quadraticCurveTo(x + s * 0.9, y - s * 1.05, x, y - s * 0.7);
      ctx.moveTo(x, y - s * 0.7); ctx.lineTo(x, y + s * 0.75);
      ctx.lineWidth = 2; ctx.stroke();
    } else if (icon === 'star') {
      GOL.star8Path(ctx, x, y, s * 1.15, Math.PI / 8);
      ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, s * 0.28, 0, Math.PI * 2); ctx.fill();
    } else if (icon === 'moon') {
      ctx.beginPath(); ctx.arc(x, y, s * 1.05, Math.PI * 0.32, Math.PI * 1.68, false);
      ctx.arc(x + s * 0.62, y, s * 0.72, Math.PI * 1.55, Math.PI * 0.45, true);
      ctx.closePath();
      ctx.lineWidth = 2; ctx.stroke();
    } else if (icon === 'story') {
      // an open scroll
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - s * 0.95, y - s * 0.75); ctx.lineTo(x + s * 0.7, y - s * 0.75);
      ctx.quadraticCurveTo(x + s * 1.1, y - s * 0.75, x + s * 1.1, y - s * 0.35);
      ctx.moveTo(x - s * 0.95, y - s * 0.75); ctx.quadraticCurveTo(x - s * 1.3, y - s * 0.7, x - s * 0.95, y - s * 0.4);
      ctx.lineTo(x - s * 0.95, y + s * 0.8); ctx.lineTo(x + s * 0.75, y + s * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.55, y - s * 0.25); ctx.lineTo(x + s * 0.4, y - s * 0.25);
      ctx.moveTo(x - s * 0.55, y + s * 0.12); ctx.lineTo(x + s * 0.4, y + s * 0.12);
      ctx.moveTo(x - s * 0.55, y + s * 0.48); ctx.lineTo(x + s * 0.1, y + s * 0.48);
      ctx.lineWidth = 1.6; ctx.stroke();
    } else if (icon === 'check') {
      ctx.beginPath(); ctx.moveTo(x - s * 0.8, y + s * 0.05); ctx.lineTo(x - s * 0.15, y + s * 0.7); ctx.lineTo(x + s * 0.9, y - s * 0.6); ctx.stroke();
    } else if (icon === 'replay') {
      ctx.beginPath(); ctx.arc(x, y, s * 0.85, -0.5, Math.PI * 1.35); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + s * 1.15, y - s * 0.75); ctx.lineTo(x + s * 0.55, y - s * 0.55); ctx.lineTo(x + s * 1.05, y - s * 0.05);
      ctx.closePath(); ctx.fill();
    } else if (icon === 'match') {
      // a gem meeting a heart: meanings
      GOL.star8Path(ctx, x - s * 0.55, y, s * 0.6, Math.PI / 8);
      ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.55, y + s * 0.5);
      ctx.bezierCurveTo(x - s * 0.1, y - s * 0.1, x + s * 0.15, y - s * 0.75, x + s * 0.55, y - s * 0.28);
      ctx.bezierCurveTo(x + s * 0.95, y - s * 0.75, x + s * 1.2, y - s * 0.1, x + s * 0.55, y + s * 0.5);
      ctx.stroke();
    }
    ctx.restore();
    return { x, y, r: r * 1.35 }; // generous hit circle
  }
  GOL.drawButton = drawButton;

  // Touch movement controls: two soft circles, and a jump hint on the right.
  function drawTouchControls(ctx, W, H, input, showHint) {
    ctx.save();
    // hug the safe areas: island in the side insets, home bar in the bottom
    const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
    const r = 52, y = H - 74 - sa.b * 0.5;
    for (const side of [0, 1]) {
      const x = 78 + sa.l + side * 130;
      const active = side === 0 ? input.left : input.right;
      ctx.fillStyle = 'rgba(250,244,224,' + (active ? 0.5 : 0.24) + ')';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(250,244,224,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, r - 3, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(90,74,46,' + (active ? 0.8 : 0.55) + ')';
      const d = side === 0 ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(x + d * 16, y); ctx.lineTo(x - d * 8, y - 16); ctx.lineTo(x - d * 8, y + 16);
      ctx.closePath(); ctx.fill();
    }
    if (showHint) {
      ctx.fillStyle = 'rgba(250,244,224,0.75)';
      ctx.font = '600 15px Nunito, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('tap this side to jump', W * 0.75, H - 40);
      const hx = W * 0.75, hy = H - 86;
      ctx.strokeStyle = 'rgba(250,244,224,0.8)';
      ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx, hy + 14); ctx.lineTo(hx, hy - 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx - 7, hy - 2); ctx.lineTo(hx, hy - 12); ctx.lineTo(hx + 7, hy - 2); ctx.stroke();
    }
    ctx.restore();
  }
  GOL.drawTouchControls = drawTouchControls;
})();
