// World Ten — An-Nasr · The Opening Gate
// Three ayat, three gems, one guided garden road that climbs in broad terraces
// toward a great stone gate at the world's end. An-Nasr is help arriving and
// the people streaming in: victory as homecoming, not conquest. So the whole
// world leans toward the gate — birds drift right, tortoises walk right, and
// the last stretch carries a wind at the child's back. The gate's doors are
// bands of light that swing open one third per gem; by the final ayah the arch
// is full of sky and the way onward stands wide open, and the child simply
// walks home through it.
(function () {
  const GOL = window.GOL;
  const C = GOL.color;

  // The great gate, drawn in world space behind the props. It stands on the
  // top terrace (row 11) at x≈58; the shrine door sits in its very mouth, so
  // walking through the opened gate IS the way onward. Its three door-leaves
  // are soft-dark when no gem is held and retreat one third per gem gathered;
  // at prog 1 the mouth is full of sky-light and rays pour through the arch.
  function drawLandmark(ctx, t, P, L, prog) {
    prog = prog || 0;
    const T = 48;
    const cx = 58 * T;            // gateway centre (the shrine-door column)
    const groundY = 11 * T;       // top-terrace surface the gate stands on
    const halfGap = 3.4 * T;      // half the clear opening
    const pw = 1.7 * T;           // pillar thickness
    const springY = 3.4 * T;      // where the arch springs from the pillars
    const crownY = 2.1 * T;       // the arch crown, high in the sky
    const leftInner = cx - halfGap;
    const rightInner = cx + halfGap;
    const openW = rightInner - leftInner;
    const breath = 0.5 + 0.5 * Math.sin(t * 1.1);

    // ---- the light living behind the opening (grows as the gate opens) -----
    const glow = ctx.createLinearGradient(0, springY, 0, groundY);
    glow.addColorStop(0, C.alpha(P.ray, 0.22 + 0.55 * prog));
    glow.addColorStop(0.5, C.alpha(P.sunGlow, 0.18 + 0.5 * prog));
    glow.addColorStop(1, C.alpha(P.skyLow, 0.15 + 0.42 * prog));
    ctx.fillStyle = glow;
    ctx.fillRect(leftInner, springY, openW, groundY - springY);

    // rays fanning down from the crown once the gate begins to open
    if (prog > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const rayA = (0.10 + 0.16 * breath) * prog;
      for (let i = 0; i < 5; i++) {
        const fx = leftInner + openW * (i + 0.5) / 5;
        ctx.fillStyle = C.alpha(P.ray, rayA);
        ctx.beginPath();
        ctx.moveTo(cx, crownY + 0.4 * T);
        ctx.lineTo(fx - 0.5 * T, groundY);
        ctx.lineTo(fx + 0.5 * T, groundY);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // ---- three door-leaves, side by side; each retreats a gem at a time ----
    const doorTop = springY + 0.2 * T;
    const leafDark = C.shade(P.stoneDark, 0.42);
    for (let i = 0; i < 3; i++) {
      const openness = Math.max(0, Math.min(1, prog * 3 - i));
      if (openness >= 1) continue;                 // this band is fully open
      const lx = leftInner + (openW / 3) * i;
      const lw = openW / 3;
      // the leaf slides down and fades as it opens
      const h = (groundY - doorTop) * (1 - openness);
      ctx.fillStyle = C.alpha(leafDark, 0.85 * (1 - 0.25 * openness));
      ctx.fillRect(lx + 1, groundY - h, lw - 2, h);
      // a soft seam of light down each leaf edge
      ctx.fillStyle = C.alpha(P.gold, 0.18 * (1 - openness));
      ctx.fillRect(lx + lw - 2, groundY - h, 2, h);
    }

    // ---- the stone pillars, framing the mouth ------------------------------
    const drawPillar = (x0) => {
      const g = ctx.createLinearGradient(x0, 0, x0 + pw, 0);
      g.addColorStop(0, C.shade(P.stoneDark, 0.12));
      g.addColorStop(0.4, P.stone);
      g.addColorStop(0.6, P.stoneShade);
      g.addColorStop(1, C.shade(P.stoneDark, 0.18));
      ctx.fillStyle = g;
      ctx.fillRect(x0, springY - 0.3 * T, pw, groundY - (springY - 0.3 * T));
      // a plain capital and base band in the shaded stone
      ctx.fillStyle = P.stoneShade;
      ctx.fillRect(x0 - 0.16 * T, springY - 0.3 * T, pw + 0.32 * T, 0.34 * T);
      ctx.fillRect(x0 - 0.16 * T, groundY - 0.3 * T, pw + 0.32 * T, 0.3 * T);
    };
    drawPillar(leftInner - pw);
    drawPillar(rightInner);

    // ---- the arch spanning the pillars -------------------------------------
    ctx.fillStyle = P.stone;
    ctx.beginPath();
    ctx.moveTo(leftInner - pw - 0.16 * T, springY - 0.12 * T);
    ctx.quadraticCurveTo(cx, crownY, rightInner + pw + 0.16 * T, springY - 0.12 * T);
    ctx.lineTo(rightInner, springY - 0.12 * T);
    ctx.quadraticCurveTo(cx, crownY + 1.25 * T, leftInner, springY - 0.12 * T);
    ctx.closePath();
    ctx.fill();
    // a warm keystone catching the light
    ctx.fillStyle = C.alpha(P.gold, 0.5 + 0.3 * prog);
    ctx.beginPath();
    ctx.moveTo(cx - 0.32 * T, crownY + 0.55 * T);
    ctx.lineTo(cx + 0.32 * T, crownY + 0.55 * T);
    ctx.lineTo(cx + 0.18 * T, crownY + 1.15 * T);
    ctx.lineTo(cx - 0.18 * T, crownY + 1.15 * T);
    ctx.closePath();
    ctx.fill();
  }

  GOL.registerWorld(10, {
    id: 20, key: 'nasr', name: 'the opening gate',
    surahId: 110,
    palette: 'nas', endPalette: 'fatiha', // the village green opening into gate-light
    w: 64, h: 16,
    density: 0.14,
    drawLandmark,
    build(b) {
      // One safe road the whole way; every rise is a broad soft terrace, never
      // a jump the child could miss. The road climbs 13 → 12 → 11 in three
      // long beats and holds that height as it reaches the gate.
      b.ground(0, 63, 13);

      // THE START — a low walled forecourt. Right at the mouth of the road a
      // hidden lift waits: look back before you set out. Its blossom is the one
      // secret of this world, straight up in open sky.
      b.bounce(8);
      b.blossom(8, 7);
      b.seed(8, 11).seed(8, 9);
      b.prop('wall', 3).prop('olive', 5).prop('cypress', 6, { v: 1 })
       .prop('flowers', 11, { v: 1 });

      // FIRST TERRACE (row 12) — AYAH 1. A broad step up, flowers at its lip.
      b.block(11, 24, 12, 12);
      b.gem(1, 14, 10);
      b.prop('lantern', 12).prop('flowers', 17, { v: 2 })
       .prop('cypress', 22).prop('bush', 20, { v: 1 });

      // SECOND TERRACE (row 11) — AYAH 2, standing between a lantern pair. The
      // wind begins here: moving on now feels like a gentle push toward the gate.
      b.block(25, 40, 11, 12);
      b.gem(2, 32, 9);
      b.prop('lantern', 30).prop('lantern', 34)
       .prop('olive', 27).prop('flowers', 37, { v: 1 });

      // TOP TERRACE (row 11, held) — AYAH 3, the gate now looming ahead. The
      // broad landing runs on to the campfire clearing and the gate's mouth.
      b.block(41, 63, 11, 12);
      b.gem(3, 48, 9);
      b.prop('lantern', 45).prop('cypress', 43, { v: 1 })
       .prop('flowers', 50, { v: 2 }).prop('wall', 62);

      // Wind at the child's back across the last long stretch (second terrace
      // through the gate) — the people streaming home.
      b.gallop(30, 52);

      // The earned listening place, then the shrine door standing IN the
      // gateway: the opened gate is the way onward. Both flat, air above (the
      // gate is drawn scenery — nothing collidable floats over either column).
      b.campfire(54);
      b.door(58);
      b.prop('lantern', 56);

      b.start(4);

      // A continuous thread of singing light climbs the terraces to the gate.
      b.seedArc(5, 11, 14, 10, 6, 0.8);
      b.seedArc(16, 10, 31, 9, 8, 0.7);
      b.seedArc(34, 9, 48, 9, 8, 1.2);
      b.seedArc(50, 9, 57, 9, 5, 1.0);

      // The homecoming: everything moving RIGHT, toward the opening gate.
      // Birds drift down the road, tortoises walk it in file, butterflies
      // gather in the gate-light.
      b.creature('bird', 12, null, { dir: 1, facing: 1, range: 120 })
       .creature('bird', 30, null, { dir: 1, facing: 1, range: 120 })
       .creature('bird', 46, null, { dir: 1, facing: 1, range: 120 });
      b.creature('tortoise', 18, null, { dir: 1, facing: 1, range: 90 })
       .creature('tortoise', 36, null, { dir: 1, facing: 1, range: 90 });
      b.creature('butterfly', 52, 7).creature('butterfly', 56, 8)
       .creature('butterfly', 60, 7);
    }
  });
})();
