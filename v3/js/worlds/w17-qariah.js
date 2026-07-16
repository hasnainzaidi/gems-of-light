// World Seventeen — Al-Qari'ah · The Weighing Light
// The first spot of the third island, and the wave's most atmospheric world:
// a high, windy moor in shimmering pre-evening light. Eleven ayat, eleven
// gems, walked left-to-right over rolling ridges and three still tarns. The
// ground breathes in low swells; seed-lights drift up off every crest like
// moths caught on the wind; pale moth-butterflies wander the hush. On the far
// skyline, a great balanced stone rests on a slender pedestal — the scales,
// visual only, never walked to. Awe without fear: a vast, quiet place that
// simply asks the child to keep walking gently upward toward the light.
(function () {
  const GOL = window.GOL;

  GOL.registerWorld(17, {
    id: 27, key: 'qariah', name: 'the weighing light',
    surahId: 101,
    palette: 'qariah', // the shimmer is constant — no drift
    w: 120, h: 16,
    density: 0.09, // moorland is spare: tufts and bushes over flowers

    // The balanced stone on the far-third skyline — a broad rounded stone
    // resting on a slender pedestal, the scales read from a distance. It is
    // pure paint: drawn high in the sky above the hill line, never a tile, so
    // it can never be walked to. Constant, no prog — the scales do not move,
    // they only breathe faintly on the wind.
    drawLandmark(ctx, t, P) {
      const TILE = GOL.TILE;
      const shade = GOL.color.shade, alpha = GOL.color.alpha;
      const cx = 100.5 * TILE;
      const sway = Math.sin(t * 0.4) * 2.4; // the barely-perceptible balance
      const far = shade(P.hillFar, 0.12);   // hazy distance tone
      const farDk = shade(P.hillFar, 0.26);

      ctx.save();
      // the weighing light — a soft shimmer halo cradiating from the stones
      const haloY = 4.3 * TILE;
      const g = ctx.createRadialGradient(cx, haloY, 6, cx, haloY, 160);
      g.addColorStop(0, alpha(P.mist, 0.55));
      g.addColorStop(1, alpha(P.mist, 0));
      ctx.fillStyle = g;
      ctx.fillRect(cx - 180, haloY - 140, 360, 280);

      // the slender pedestal rising from the skyline
      const baseY = 6.5 * TILE;
      const neckY = 4.85 * TILE;
      ctx.fillStyle = far;
      ctx.beginPath();
      ctx.moveTo(cx - 10, baseY);
      ctx.lineTo(cx - 5 + sway * 0.35, neckY);
      ctx.lineTo(cx + 5 + sway * 0.35, neckY);
      ctx.lineTo(cx + 10, baseY);
      ctx.closePath();
      ctx.fill();

      // the broad rounded stone balanced on the neck — the scales
      const topY = neckY - 22;
      ctx.fillStyle = far;
      ctx.beginPath();
      ctx.ellipse(cx + sway, topY, 70, 32, 0, 0, Math.PI * 2);
      ctx.fill();
      // an underside shadow so the great stone reads as weight, gently held
      ctx.fillStyle = alpha(farDk, 0.55);
      ctx.beginPath();
      ctx.ellipse(cx + sway, topY + 12, 56, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },

    build(b) {
      b.ground(0, 119, 13);

      // ── THE OPEN MOOR (ayahs 1–3) ────────────────────────────────────
      // No flowered mound: the world opens on bare wind-scoured moor, one low
      // ridge shouldering up under the first light.

      // 1 — first ridge crest. A broad low swell, the moor's first breath.
      b.block(6, 12, 12, 12);
      b.gem(1, 8, 10);
      b.prop('bush', 5, { v: 1 }).prop('tuft', 11);

      // 2 — the first tarn, still water in the dip, crossed on three stones.
      b.water(14, 20, 13);
      b.stone(15).stone(17).stone(19);
      b.gem(2, 17, 11); // hangs over the middle stone
      b.prop('tuft', 13).prop('bush', 21, { v: 2 });

      // 3 — second ridge, a little higher-shouldered.
      b.block(24, 30, 12, 12);
      b.gem(3, 27, 10);
      b.prop('bush', 25).prop('tuft', 29, { v: 1 });

      // ── THE DRIFTING DIP (ayahs 4–5) ────────────────────────────────
      // 4 — a short crest before the second tarn.
      b.block(32, 36, 12, 12);
      b.gem(4, 35, 10);
      b.prop('tuft', 33, { v: 2 });

      // The second tarn's dip: shallow water either side of a small stone
      // island. The hidden secret waits here — a bounce on the island, the
      // one blossom straight above it in the open moor sky.
      b.water(37, 39, 13);
      b.stone(38);
      b.water(41, 43, 13);
      b.stone(42);
      b.bounce(40);
      b.blossom(40, 6);

      // 5 — third ridge, rising out of the dip.
      b.block(45, 52, 12, 12);
      b.gem(5, 47, 10);
      b.prop('bush', 49, { v: 1 }).prop('tuft', 51);

      // ── THE WIND-LEAF CROSSING (ayah 6) ─────────────────────────────
      // The widest tarn: too broad for stones. A single wind-leaf ferries it
      // at row 11 — the wind made visible and rideable, bank to bank.
      b.water(57, 66, 13);
      b.leafH(57, 66, 11);
      b.gem(6, 61, 9); // gathered from the leaf, mid-channel
      b.prop('tuft', 55).prop('bush', 68, { v: 2 });

      // ── THE FAR RIDGES (ayahs 7–8) ──────────────────────────────────
      // 7 — fourth ridge.
      b.block(67, 74, 12, 12);
      b.gem(7, 71, 10);
      b.prop('bush', 73).prop('tuft', 69, { v: 1 });

      // 8 — the foot of the long final rise.
      b.block(78, 83, 12, 12);
      b.gem(8, 80, 10);
      b.prop('tuft', 82, { v: 2 });

      // ── THE LONG RISE TO THE SCALES (ayahs 9–11) ────────────────────
      // The ground climbs the last long shoulder toward the balanced stone's
      // stretch of sky; the last three gems pass beneath it — it stays far
      // background, untouchable, high above the walk.
      b.block(84, 91, 11, 12);
      b.gem(9, 86, 9);
      b.prop('bush', 89, { v: 1 });

      b.block(92, 119, 10, 12); // the summit shoulder and meadow
      b.gem(10, 94, 8);
      b.gem(11, 100, 8); // under the scales
      b.prop('tuft', 96).prop('bush', 103, { v: 2 }).prop('tuft', 107, { v: 1 });

      // The listening clearing on the flat summit meadow past the last ridge.
      b.campfire(110);
      b.door(115);
      b.prop('bush', 108).prop('flowers', 112, { v: 1 })
       .prop('tuft', 113).prop('flowers', 117, { v: 2 });

      b.start(2);

      // ── THE DRIFTING LIGHTS ─────────────────────────────────────────
      // This world leans hardest on seeds: rising arcs off every ridge crest
      // and over every water crossing, so the trail reads as lights adrift on
      // the wind, not a breadcrumb line.
      b.seedRun(2, 5, 1);                    // out of the start
      b.seedArc(6, 11, 12, 11, 6, 2.2);      // ridge 1
      b.seedArc(14, 12, 20, 12, 5, 1);       // over the first tarn
      b.seedArc(24, 11, 30, 11, 6, 2.2);     // ridge 2
      b.seedArc(32, 11, 36, 11, 4, 1.8);     // the crest before the dip
      b.seedArc(37, 12, 44, 12, 5, 1);       // over the second tarn
      b.seedArc(45, 11, 52, 11, 6, 2.2);     // ridge 3
      b.seedArc(57, 10, 66, 10, 6, 1.6);     // over the wind-leaf reach
      b.seedArc(67, 11, 74, 11, 6, 2.2);     // ridge 4
      b.seedArc(78, 11, 83, 11, 4, 1.8);     // foot of the rise
      b.seedArc(84, 10, 91, 10, 5, 1.8);     // up the long shoulder
      b.seedArc(92, 9, 100, 9, 6, 1.8);      // toward the scales
      b.seedRun(102, 114, 2);                // across the summit meadow

      // ── THE MOTHS ───────────────────────────────────────────────────
      // Six pale moth-butterflies wander the hush — the surah's fluttering
      // moths, colA in the pale '#EDE6C8' family.
      const moth = { colA: '#EDE6C8', colB: '#F7F2E4' };
      const moth2 = { colA: '#E8E2C0', colB: '#F4EFDC' };
      b.creature('butterfly', 10, 7, moth)
       .creature('butterfly', 27, 7, moth2)
       .creature('butterfly', 40, 6, moth)
       .creature('butterfly', 61, 6, moth2)
       .creature('butterfly', 80, 7, moth)
       .creature('butterfly', 100, 6, moth2);
    }
  });
})();
