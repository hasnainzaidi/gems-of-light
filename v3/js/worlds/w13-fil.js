// World Thirteen — Al-Fil · The Birds
// Protection fills the sky. This is the most kid-delightful world of the wave:
// every gathered ayah adds wings, until the whole air is alive with a wheeling
// flock (the ababil, Wave-P engine hook). A gentle cozy-garden stroll: a
// bird-bath clearing, a rise into open sky, a shallow pond, a low terrace, and
// the fifth gem waiting right under the flock's anchor.
(function () {
  const GOL = window.GOL;

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

    build(b) {
      b.ground(0, 85, 13);

      // ── BEAT 1 · THE BIRD-BATH CLEARING (ayah 1) ─────────────────────────
      // No opening flowered mound — the world opens on its own image: a still
      // fountain with two friendly birds already down ON THE GROUND beside it,
      // the first wings, close at hand. The first gem shines low over the flat.
      // The renderer's lower tray reaches 13px below its anchor; lift it so
      // the tray meets the soil instead of painting across its front face.
      b.prop('fountain', 8, { y: b.surface(8) * GOL.TILE - 13 });
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
      b.prop('flowers', 34, { v: 2 });
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
      // A gentle two-step terrace; the fourth gem rests atop it as the sky
      // begins to fill.
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
      b.seed(74, 11); // final seed stays clear of the campfire trigger

      b.start(3);
      b.seedRun(4, 10, 2);

      // ambient life: butterflies through the garden, no tortoise here — the
      // sky belongs to the flock.
      b.creature('butterfly', 17, 7).creature('butterfly', 48, 6)
       .creature('butterfly', 65, 7).creature('butterfly', 79, 8);
    }
  });
})();
