// Gems of Light — actors.js  (v2: concept-art edition)
// The gems (one per ayah, each with its own crystal cut), Lightling — the
// small leaf-cloaked creature of light the child inhabits — and the soft
// parchment-and-gold interface ornaments.
(function () {
  const GOL = window.GOL;
  const { mix, shade, tint, alpha } = GOL.color;
  const { blob, leafShape } = GOL.paint;

  // ---------------------------------------------------------------- gems ---
  // Faceted stones, glowing from within, the brightest things on screen.
  // Every ayah position has its own silhouette, as on the ordering board:
  // hex, prism, kite, drop, oval, shield, brilliant.
  // (x,y) = center. r ≈ 16 in-level. Light from upper-right.

  function cutPoints(cut, r) {
    const w = r * 1.02, h = r * 1.26;
    switch (cut) {
      case 'hex': // sixfold, slightly elongated
        return [[0, -h], [w * 0.88, -h * 0.42], [w * 0.88, h * 0.42], [0, h], [-w * 0.88, h * 0.42], [-w * 0.88, -h * 0.42]];
      case 'prism': { // tall emerald cut with clipped corners
        const W2 = w * 0.8;
        return [[-W2 * 0.55, -h], [W2 * 0.55, -h], [W2, -h * 0.6], [W2, h * 0.6], [W2 * 0.55, h], [-W2 * 0.55, h], [-W2, h * 0.6], [-W2, -h * 0.6]];
      }
      case 'kite': // long lozenge, heavier below the waist
        return [[0, -h * 0.92], [w * 0.85, -h * 0.12], [0, h * 1.04], [-w * 0.85, -h * 0.12]];
      case 'drop': // teardrop, point up (approximated with straight facets)
        return [[0, -h], [w * 0.52, -h * 0.38], [w * 0.85, h * 0.28], [w * 0.4, h * 0.92], [-w * 0.4, h * 0.92], [-w * 0.85, h * 0.28], [-w * 0.52, -h * 0.38]];
      case 'oval': // eight-sided rounded oval
        return [[0, -h], [w * 0.66, -h * 0.66], [w * 0.94, 0], [w * 0.66, h * 0.66], [0, h], [-w * 0.66, h * 0.66], [-w * 0.94, 0], [-w * 0.66, -h * 0.66]];
      case 'shield': // pentagon, point down
        return [[-w * 0.62, -h * 0.85], [w * 0.62, -h * 0.85], [w * 0.95, -h * 0.05], [0, h], [-w * 0.95, -h * 0.05]];
      default: { // brilliant: table, crown, pavilion
        const W2 = w * 1.02;
        return [[-W2 * 0.52, -h * 0.62], [W2 * 0.52, -h * 0.62], [W2, -h * 0.14], [0, h], [-W2, -h * 0.14]];
      }
    }
  }

  function drawGem(ctx, x, y, r, C, t, opts) {
    opts = opts || {};
    const glowAmt = opts.glow != null ? opts.glow : 1;
    const pulse = 0.82 + 0.18 * Math.sin(t * 2.1 + (opts.phase || 0));
    const cut = opts.cut || C.cut || 'brilliant';
    const pts = cutPoints(cut, r);
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

    const sil = () => {
      ctx.beginPath();
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
      ctx.closePath();
    };
    sil();
    const bodyG = ctx.createLinearGradient(-r, -r * 1.2, r, r * 1.2);
    bodyG.addColorStop(0, C.dark);
    bodyG.addColorStop(0.55, C.base);
    bodyG.addColorStop(1, C.light);
    ctx.fillStyle = bodyG;
    ctx.fill();

    // facets: fan from a spark point; faces toward the sun read lighter
    const q = [r * 0.14, -r * 0.22];
    ctx.save();
    sil(); ctx.clip();
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      // outward normal of this edge
      const ex = b[0] - a[0], ey = b[1] - a[1];
      let nx = ey, ny = -ex;
      const mxp = (a[0] + b[0]) / 2, myp = (a[1] + b[1]) / 2;
      if (nx * mxp + ny * myp < 0) { nx = -nx; ny = -ny; }
      const len = Math.hypot(nx, ny) || 1;
      const lit = (nx / len) * 0.707 + (ny / len) * -0.707; // dot with upper-right light
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(q[0], q[1]);
      ctx.closePath();
      ctx.fillStyle = lit > 0 ? alpha(C.lighter, 0.16 + 0.34 * lit) : alpha(C.darker, 0.12 + 0.3 * -lit);
      ctx.fill();
    }
    // a small bright table near the top
    ctx.beginPath();
    pts.forEach((p, i) => {
      const tx = q[0] + (p[0] - q[0]) * 0.42, ty = q[1] + (p[1] - q[1]) * 0.42;
      i === 0 ? ctx.moveTo(tx, ty) : ctx.lineTo(tx, ty);
    });
    ctx.closePath();
    ctx.fillStyle = alpha(C.lighter, 0.32);
    ctx.fill();
    ctx.restore();

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
      const sx = -r + sweep * 2 * r;
      const sg = ctx.createLinearGradient(sx - r * 0.5, 0, sx + r * 0.5, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)');
      sg.addColorStop(0.5, 'rgba(255,255,255,0.4)');
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.rotate(-0.4);
      ctx.fillRect(-r * 2.2, -r * 2.6, r * 4.4, r * 5.2);
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
      const tx = r * 0.4, ty = -r * 0.52, tr2 = r * 0.34 * a;
      ctx.beginPath();
      ctx.moveTo(tx - tr2, ty); ctx.lineTo(tx + tr2, ty);
      ctx.moveTo(tx, ty - tr2); ctx.lineTo(tx, ty + tr2);
      ctx.stroke();
    }
    ctx.restore();
  }
  GOL.drawGem = drawGem;

  // ----------------------------------------------------------- Lightling ---
  // The hero of the boards: a small round creature with a matte cream body,
  // a single sprout-leaf on top, a mantle of leaves at its back, and a subtle
  // inner warmth that brightens in moments of discovery. (x,y) = feet center.
  // s: {vx, vy, grounded, facing, t, idleT, blink, squashX, squashY, moving,
  //     groundDist?, glow? (0..1 extra warmth), happy? (closed smiling eyes)}
  const LL = {
    cream: '#FFFAE4', creamMid: '#FBEDC2', creamLow: '#EFD795',
    rim: '#D9B36A', heart: '#FFDE9E',
    leaf: '#79B369', leafLight: '#9CCB7C', leafDark: '#54904D', leafDeep: '#41763F',
    stem: '#5E9450', foot: '#D2A360', footDark: '#B9884C',
    eye: '#3E362A', cheek: '#EFAF88', mouth: '#8A6B4F'
  };
  function drawSprite(ctx, x, y, s) {
    const R = 17;
    const t = s.t || 0;
    const glow = Math.max(0, Math.min(1, s.glow || 0));
    ctx.save();
    ctx.translate(x, y);

    // soft ground shadow
    if (s.groundDist != null) {
      const d = Math.min(1, Math.max(0, 1 - s.groundDist / 160));
      ctx.fillStyle = alpha('#3E5C42', 0.16 * d);
      ctx.beginPath();
      ctx.ellipse(0, (s.groundDist || 0), R * (0.75 + 0.2 * d), 4.5 * d + 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const sx = s.squashX || 1, sy = s.squashY || 1;
    const bob = s.moving && s.grounded ? Math.abs(Math.sin(t * 9)) * -2.2 : Math.sin(t * 1.6) * -1.2;
    ctx.translate(0, bob);
    // lean into movement
    ctx.rotate((s.vx || 0) / 220 * 0.12);

    // glow halo — kept modest so the gems stay the brightest things alive
    const halo = ctx.createRadialGradient(0, -R, R * 0.3, 0, -R, R * 2.6);
    const breathe = 0.8 + 0.2 * Math.sin(t * 1.8);
    const hA = 0.2 + glow * 0.3;
    halo.addColorStop(0, alpha('#FFF3C4', hA * breathe));
    halo.addColorStop(0.5, alpha('#FFF3C4', hA * 0.36 * breathe));
    halo.addColorStop(1, alpha('#FFF3C4', 0));
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0, -R, R * 2.6, 0, Math.PI * 2); ctx.fill();

    const f = s.facing || 1;
    const inAir = !s.grounded;
    const walk = s.moving && s.grounded ? Math.sin(t * 11) : 0;

    // ---- the leaf mantle, draped from the shoulders down the back
    ctx.save();
    ctx.scale(sx, sy);
    const sway = Math.sin(t * 2.3) * 1.6 + (s.vx || 0) / 220 * -4 + (inAir ? -(s.vy || 0) / 300 * 4 : 0);
    const capeLift = inAir ? 4 : Math.abs(walk) * 1.6;
    const nx = -f * R * 0.28, nyTop = -R * 1.62;         // where it gathers at the neck
    const hemX = -f * (R * 1.18 + Math.abs(sway) * 0.6); // trailing hem behind
    const hemY = -R * 0.16 - capeLift;
    ctx.fillStyle = LL.leafDark;
    ctx.beginPath();
    ctx.moveTo(nx, nyTop);
    ctx.quadraticCurveTo(-f * R * 1.28, -R * 1.5, hemX + sway * 0.4, hemY);
    ctx.quadraticCurveTo(-f * R * 0.95, R * 0.06, -f * R * 0.2, -R * 0.04);
    ctx.quadraticCurveTo(f * R * 0.5, -R * 0.5, nx, nyTop);
    ctx.closePath();
    ctx.fill();
    // inner lighter leaf-layer + midrib
    ctx.fillStyle = alpha(LL.leaf, 0.9);
    ctx.beginPath();
    ctx.moveTo(nx, nyTop + 2);
    ctx.quadraticCurveTo(-f * R * 1.06, -R * 1.32, hemX * 0.82 + sway * 0.3, hemY - 1);
    ctx.quadraticCurveTo(-f * R * 0.7, -R * 0.06, -f * R * 0.16, -R * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = alpha(LL.leafDeep, 0.7);
    ctx.lineWidth = 1.2; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(nx, nyTop + 3);
    ctx.quadraticCurveTo(-f * R * 0.9, -R * 0.9, hemX * 0.7, hemY + 1);
    ctx.stroke();
    ctx.restore();

    // ---- feet: little rounded stubs with a happy walk cycle
    ctx.fillStyle = LL.foot;
    for (const side of [-1, 1]) {
      const lift = inAir ? -3 : Math.max(0, walk * side) * 4.5;
      const lx = side * 6.5 * sx;
      ctx.beginPath();
      ctx.ellipse(lx, -3 - lift, 4.4, 5.4, side * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = alpha(LL.footDark, 0.5);
    for (const side of [-1, 1]) {
      const lift = inAir ? -3 : Math.max(0, walk * side) * 4.5;
      ctx.beginPath();
      ctx.ellipse(side * 6.5 * sx, -1.6 - lift, 3.2, 2, side * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- body: a soft egg of matte cream, light from the upper-right
    ctx.save();
    ctx.scale(sx, sy);
    const top = -R * 1.98, beltY = -R * 0.72;
    const bodyPath = () => {
      ctx.beginPath();
      ctx.moveTo(0, top);
      ctx.quadraticCurveTo(R * 0.92, top + R * 0.22, R * 0.99, beltY);
      ctx.quadraticCurveTo(R * 1.06, -R * 0.12, 0, -1);
      ctx.quadraticCurveTo(-R * 1.06, -R * 0.12, -R * 0.99, beltY);
      ctx.quadraticCurveTo(-R * 0.92, top + R * 0.22, 0, top);
      ctx.closePath();
    };
    const bg = ctx.createRadialGradient(R * 0.3, -R * 1.3, R * 0.15, 0, -R * 0.95, R * 1.25);
    bg.addColorStop(0, LL.cream);
    bg.addColorStop(0.55, LL.creamMid);
    bg.addColorStop(1, LL.creamLow);
    bodyPath();
    ctx.fillStyle = bg;
    ctx.fill();
    // the warmth at its heart — brightens with discovery
    const heart = ctx.createRadialGradient(0, -R * 0.66, 0, 0, -R * 0.66, R * 0.8);
    heart.addColorStop(0, alpha(LL.heart, 0.28 + glow * 0.45));
    heart.addColorStop(1, alpha(LL.heart, 0));
    bodyPath();
    ctx.fillStyle = heart;
    ctx.fill();
    // soft warm rim — never black
    bodyPath();
    ctx.strokeStyle = alpha(LL.rim, 0.5);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // a hint of the mantle's collar curling around each shoulder
    for (const side of [-1, 1]) {
      leafShape(ctx, side * R * 0.94, -R * 1.18, R * 0.5, R * 0.17, side > 0 ? 2.8 : 0.35, alpha(LL.leaf, 0.9));
      leafShape(ctx, side * R * 0.9, -R * 1.02, R * 0.38, R * 0.14, side > 0 ? 2.55 : 0.6, alpha(LL.leafDark, 0.8));
    }
    ctx.restore();

    // ---- the sprout: one earnest leaf on a curved stem, always fluttering
    ctx.save();
    ctx.translate(0, -R * 2 * sy + 2.5);
    const flut = (s.vx || 0) / 220 * 0.55 + Math.sin(t * 3.1) * 0.14 + (inAir ? -0.2 * Math.sign(s.vy || 1) : 0);
    ctx.rotate(flut);
    ctx.strokeStyle = LL.stem; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 2); ctx.quadraticCurveTo(-f * 1.5, -3, -f * 0.5, -5.5); ctx.stroke();
    // the big leaf, tipping the way it's going
    leafShape(ctx, -f * 0.5, -5.5, 11, 3.6, f > 0 ? -0.5 + flut * 0.5 : Math.PI + 0.5 + flut * 0.5, LL.leaf);
    leafShape(ctx, -f * 0.5, -5.5, 8.5, 2.4, f > 0 ? -0.42 + flut * 0.5 : Math.PI + 0.42 + flut * 0.5, alpha(LL.leafLight, 0.9));
    // a small counter-leaflet
    leafShape(ctx, -f * 0.5, -4.6, 5.5, 2, f > 0 ? Math.PI + 0.85 : -0.85, alpha(LL.leafDark, 0.9));
    ctx.restore();

    // ---- face
    const lookUp = Math.min(1, Math.max(0, (s.idleT || 0) - 2) / 0.6);   // it looks up when it rests
    const eyeY = -R * 1.18 - lookUp * 3.5;
    const eyeX = f * 4.4;
    const happy = !!s.happy;
    if (happy) {
      // closed, upward-curved eyes — the reverent collection pose
      ctx.strokeStyle = LL.eye;
      ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(eyeX + side * 5.4, eyeY + 1.2, 3, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }
    } else {
      const blink = s.blink ? 0.12 : 1;
      ctx.fillStyle = LL.eye;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(eyeX + side * 5.4, eyeY, 2.6, 3.5 * blink, 0, 0, Math.PI * 2);
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
    }
    // cheeks — the faintest blush
    ctx.fillStyle = alpha(LL.cheek, 0.32);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(eyeX + side * 9.5, eyeY + 4.5, 2.6, 1.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // small content smile
    ctx.strokeStyle = alpha(LL.mouth, 0.75);
    ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY + 4.4 - lookUp, happy ? 3.8 : 3.2, 0.25 * Math.PI, 0.75 * Math.PI);
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
    // corner stars with tiny leaf flourishes
    if (!opts.plain) {
      for (const cx of [x + 16, x + w - 16]) {
        for (const cy of [y + 16, y + h - 16]) {
          GOL.star8Path(ctx, cx, cy, 5, Math.PI / 8);
          ctx.fillStyle = alpha('#C89B55', 0.8);
          ctx.fill();
          const dx = cx < x + w / 2 ? 1 : -1, dy = cy < y + h / 2 ? 1 : -1;
          leafShape(ctx, cx + dx * 7, cy + dy * 2, 6, 2, dx > 0 ? (dy > 0 ? 0.5 : -0.5) : (dy > 0 ? Math.PI - 0.5 : Math.PI + 0.5), alpha('#8FAF74', 0.55));
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
  function drawHudBand(ctx, cx, y, slots, found, t) {
    const gap = 44, w = slots * gap + 34, h = 52;
    const x = cx - w / 2;
    drawPanel(ctx, x, y, w, h, { radius: 26, alpha: 0.82, plain: true });
    for (let i = 0; i < slots; i++) {
      const sx = x + 26 + i * gap + gap / 2 - gap / 2;
      const sy = y + h / 2;
      if (found.includes(i)) {
        drawGem(ctx, sx, sy, 10, GOL.GEMS[i % GOL.GEMS.length], t, { glow: 0.55, phase: i });
      } else {
        GOL.star8Path(ctx, sx, sy, 8, Math.PI / 8);
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

  // Round soft button. icon: 'pause'|'sound'|'soundOff'|'map'|'back'|'play'|'book'|'mic'
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
    } else if (icon === 'mic') {
      ctx.beginPath();
      GOL.roundRect(ctx, x - s * 0.42, y - s, s * 0.84, s * 1.42, s * 0.42);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y - s * 0.12, s * 0.78, 0.18, Math.PI - 0.18);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.66); ctx.lineTo(x, y + s);
      ctx.moveTo(x - s * 0.52, y + s); ctx.lineTo(x + s * 0.52, y + s);
      ctx.stroke();
    }
    ctx.restore();
    return { x, y, r: r * 1.35 }; // generous hit circle
  }
  GOL.drawButton = drawButton;

  // Touch movement controls: two soft circles, and a jump hint on the right.
  function drawTouchControls(ctx, W, H, input, showHint) {
    ctx.save();
    const r = 52, y = H - 74;
    for (const side of [0, 1]) {
      const x = 78 + side * 130;
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
