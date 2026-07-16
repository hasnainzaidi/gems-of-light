// World Thirteen — Al-Fil · The Birds
// Protection fills the sky. This is the most kid-delightful world of the wave:
// every gathered ayah adds wings, until the whole air is alive with a wheeling
// flock (the ababil, Wave-P engine hook) turning around one still, distant
// elephant-shaped rock on the far horizon. Nothing is scary — the flock is joy,
// the rock is only quiet background sky-scenery. A gentle cozy-garden stroll:
// a bird-bath clearing, a rise into open sky, a shallow pond, a low terrace,
// and the fifth gem waiting right under the flock's anchor.
(function () {
  const GOL = window.GOL;
  const TILE = GOL.TILE;

  GOL.registerWorld(13, {
    id: 23, key: 'fil', name: 'the birds',
    surahId: 105,
    palette: 'fil', // the wide bright bird-sky; this world rests, it does not drift
    w: 86, h: 16,
    density: 0.15,

    // ── The ababil flock (LOCKED Wave-P contract) ──────────────────────────
    // The anchor sits high over the world's far third, so the sky fills toward
    // the journey's end: birds grow with collection, wheeling around this point.
    flock: { x: 70, y: 4, max: 26 },

    // ── The elephant rock ──────────────────────────────────────────────────
    // A SMALL distant shape in the sky band: a far hill that happens to hold
    // an elephant's gentle silhouette — one domed back, a small head bump, a
    // soft dropped trunk on the left. ~2.8 tiles wide, ~1.7 tall, floating in
    // world rows ~5.8–7.5: well left-and-below the sun glow at the upper
    // right, and with ~5.5 tiles of open air between it and the walkable
    // ground (row 13), so no child could read it as a platform. Hazed into
    // the distance like the far hills. Still and constant — it takes no prog.
    drawLandmark(ctx, t, P, L) {
      const C = GOL.color;
      const cx = 70 * TILE;          // over the far third, beneath the flock anchor
      const baseY = 7.5 * TILE;      // the silhouette's underside, high in the sky
      const hw = 1.4 * TILE;         // half-width — ~2.8 tiles across in all
      // a hazy far-grey drawn FROM the palette (never a hardcoded dark)
      const grey = C.mix(P.hillFar, '#8C8C86', 0.62);

      ctx.save();

      // three quadratic curves, right to left: back dome → head bump → trunk
      ctx.beginPath();
      ctx.moveTo(cx + hw, baseY);                                    // rear base
      ctx.quadraticCurveTo(cx + hw * 0.35, 5.75 * TILE,              // the domed back
                           cx - hw * 0.10, 6.15 * TILE);             // dip at the neck
      ctx.quadraticCurveTo(cx - hw * 0.35, 5.95 * TILE,              // small head bump
                           cx - hw * 0.58, 6.35 * TILE);             // down to the brow
      ctx.quadraticCurveTo(cx - hw * 0.98, 6.70 * TILE,              // the trunk drops
                           cx - hw, 7.35 * TILE);                    // softly to its tip
      ctx.lineTo(cx - hw * 0.8, baseY);                              // under the trunk
      ctx.closePath();                                               // along the base
      ctx.fillStyle = C.alpha(grey, 0.52);
      ctx.fill();

      // a faint mist wash over its lower third, so it sits behind the air the
      // way the far hills do
      ctx.clip();
      ctx.fillStyle = C.alpha(P.mist, 0.28);
      ctx.fillRect(cx - hw - 2, baseY - 0.55 * TILE, hw * 2 + 4, 0.55 * TILE + 2);
      ctx.restore();
    },

    build(b) {
      b.ground(0, 85, 13);

      // ── BEAT 1 · THE BIRD-BATH CLEARING (ayah 1) ─────────────────────────
      // No opening flowered mound — the world opens on its own image: a still
      // fountain with two friendly birds already down ON THE GROUND beside it,
      // the first wings, close at hand. The first gem shines low over the flat.
      b.prop('fountain', 8);
      b.prop('flowers', 5, { v: 1 }).prop('bush', 14, { v: 2 });
      b.creature('bird', 6, 12).creature('bird', 10, 12);
      b.gem(1, 12, 11);

      // ── BEAT 2 · THE RISE INTO OPEN SKY (ayah 2) ─────────────────────────
      // Two easy garden steps lift onto a bright open ledge — nothing overhead,
      // so the first flock birds appear cleanly in the sky as this gem is taken.
      b.slab(22, 24, 11).slab(26, 29, 9);
      b.gem(2, 28, 7);
      b.prop('cypress', 19).prop('olive', 31, { v: 1 });
      b.seed(20, 11).seed(23, 10).seed(26, 8).seed(28, 6);

      // ── BEAT 3 · THE SHALLOW POND (ayah 3) ───────────────────────────────
      // Down off the ledge, a shallow pond crossed on two stepping stones; the
      // third gem waits on a low mound on the far bank.
      b.water(36, 40, 13);
      b.stone(37).stone(39);
      b.block(43, 45, 12, 12);
      b.gem(3, 44, 10);
      b.prop('flowers', 34, { v: 2 }).prop('palm', 46);
      b.seed(31, 11).seed(34, 11);
      b.seedArc(36, 11, 40, 11, 4, 1); // over the water
      b.seed(42, 11);

      // ── THE SECRET · behind the pond ─────────────────────────────────────
      // A bounce pad on the open flat just past the far bank; the hidden
      // Rahma blossom waits straight above it in clear sky.
      b.bounce(50);
      b.blossom(50, 7);
      b.seed(47, 11).seed(50, 11).seed(50, 9);

      // ── BEAT 4 · THE LOW TERRACE (ayah 4) ────────────────────────────────
      // A gentle two-step terrace; the fourth gem rests atop it, the elephant
      // rock now clear on the horizon ahead and the sky beginning to fill.
      b.block(56, 58, 12, 12);
      b.block(60, 63, 11, 12);
      b.gem(4, 60, 9);
      b.prop('olive', 54).prop('flowers', 62, { v: 1 });
      b.seed(53, 11).seed(56, 11).seed(58, 11).seed(60, 9);

      // ── BEAT 5 · UNDER THE ANCHOR (ayah 5) ───────────────────────────────
      // The fifth gem sits on a low mound directly under the flock's anchor —
      // collecting it brings the whole flock to its full wheel overhead.
      b.block(71, 73, 12, 12);
      b.gem(5, 72, 10);
      b.prop('flowers', 69, { v: 2 }).prop('cypress', 75);
      b.seedRun(63, 72, 3);

      // ── THE RESTING CLEARING ─────────────────────────────────────────────
      // The earned campfire and the shrine door beyond it, flat and open under
      // the wheeling sky. Nothing floats in either column.
      b.campfire(78);
      b.door(82);
      b.prop('lantern', 76).prop('olive', 84, { v: 1 });
      b.seed(74, 11).seed(76, 11);

      b.start(3);
      b.seedRun(4, 10, 2);

      // ambient life: butterflies through the garden, no tortoise here — the
      // sky belongs to the flock.
      b.creature('butterfly', 17, 7).creature('butterfly', 48, 6)
       .creature('butterfly', 65, 7).creature('butterfly', 79, 8);
    }
  });
})();
