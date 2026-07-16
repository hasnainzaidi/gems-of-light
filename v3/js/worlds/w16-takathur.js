// World Sixteen — At-Takathur · The True Garden
// Rivalry-in-increase (takathur) piles clutter over a garden that was always
// there. Six dusty foreground veils hang across the path; walking into each
// one softens it (engine occluder behavior) and the pocket it hid — flowers,
// a fruit tree, a fountain, carved columns — is simply revealed. No text tells
// the child anything: distraction resolves into clarity, one gathered ayah at
// a time. The last stretch wears no veil at all — the true garden stands open
// in the endPalette's fullest light, and that contrast is the whole message.
(function () {
  const GOL = window.GOL;

  GOL.registerWorld(16, {
    id: 26, key: 'takathur', name: 'the true garden',
    surahId: 102,
    // laden gold clearing into the garden-gate light as the veils fall away
    palette: 'takathur', endPalette: 'fatiha',
    w: 96, h: 16,
    // the garden UNDER the veils must be genuinely rich — real beauty, hidden
    density: 0.16,
    build(b) {
      b.ground(0, 95, 13);

      // ── SIX VEILED POCKETS (ayahs 1–6) ────────────────────────────────
      // Each occluder is a dull, dusty curtain (stoneDark/soilDark family,
      // never near-black) hanging row 5 → row 12. The child steps behind it,
      // the engine fades it, and the furniture placed here appears in full.

      // 1 — a fruiting tree and a flower bank hide behind the first grey veil.
      b.occluder(5, 11, 5, 12, '#8A7B62');
      b.gem(1, 8, 11);
      b.prop('fruit', 8, { v: 1 })
       .prop('flowers', 6, { v: 2 }).prop('flowers', 10, { v: 1 })
       .prop('bush', 11, { v: 1 });

      // A low heap of "increase" — piled carved stone as terrain rhythm,
      // climbable in a single easy step, never walling the way.
      b.stoneBlock(14, 16, 12, 12);

      // 2 — a quiet garden fountain waits under the second, cooler veil.
      b.occluder(19, 25, 5, 12, '#75705C');
      b.gem(2, 22, 11);
      b.prop('fountain', 23)
       .prop('flowers', 20, { v: 1 }).prop('lantern', 25);

      b.stoneBlock(28, 30, 11, 12);

      // 3 — two carved columns stand behind the third veil (fallen grandeur,
      // disarmed scenery). A pair, framing the gem between them.
      b.occluder(33, 39, 5, 12, '#847558');
      b.gem(3, 36, 11);
      b.prop('column', 34).prop('column', 38)
       .prop('flowers', 36, { v: 2 });

      b.stoneBlock(42, 44, 12, 12);

      // 4 — an olive and a flowered rest. The secret hides HERE, inside the
      // hidden: a bounce pad lifts to a blossom that lives behind the veil.
      b.occluder(47, 54, 5, 12, '#6E6B58');
      b.gem(4, 51, 11);
      b.bounce(52);
      b.blossom(52, 6);
      b.prop('olive', 49).prop('flowers', 53, { v: 1 }).prop('lantern', 47);
      // life behind the veil — the pocket is not empty, it was only covered.
      b.creature('butterfly', 50, 8).creature('butterfly', 53, 7);

      b.stoneBlock(56, 57, 12, 12);

      // 5 — a fruit tree, a bush, dense flowers: the ripest pocket of all.
      b.occluder(59, 65, 5, 12, '#8F8168');
      b.gem(5, 62, 11);
      b.prop('fruit', 64, { v: 1 }).prop('bush', 60, { v: 2 })
       .prop('flowers', 61, { v: 1 }).prop('flowers', 63, { v: 2 });
      b.creature('butterfly', 61, 8).creature('butterfly', 64, 7);

      b.stoneBlock(67, 68, 11, 12);

      // 6 — a cypress pair over a flower bank behind the last veil. It ends by
      // x77, so the next hidden thing (the campfire) stays > 8 tiles clear.
      b.occluder(70, 76, 5, 12, '#726A55');
      b.gem(6, 73, 11);
      b.prop('cypress', 71).prop('cypress', 75)
       .prop('flowers', 73, { v: 2 }).prop('bush', 70, { v: 1 });

      // ── THE OPEN FINALE (ayahs 7–8) ───────────────────────────────────
      // No veil at all past here: the true garden, unhidden, in the endPalette's
      // fullest light. Gems 7 and 8 stand in plain open air — the reveal.
      b.gem(7, 79, 11);
      b.gem(8, 83, 11);
      b.prop('olive', 78).prop('fruit', 81, { v: 1 })
       .prop('flowers', 80, { v: 2 }).prop('flowers', 84, { v: 1 });
      // one unhurried tortoise ambles the open garden — the only creature that
      // never needed to be uncovered.
      b.creature('tortoise', 80, null, { range: 60 });

      // The listening fire and the shrine door, both in fully open sky — no
      // occluder within 8 tiles of the fire, nothing floating in their columns.
      b.campfire(86);
      b.door(92);
      b.prop('lantern', 88).prop('flowers', 90, { v: 2 });

      b.start(3);

      // ── THE SINGING SEED TRAIL ────────────────────────────────────────
      // Traces the whole route, arcing over every heap of increase.
      b.seedRun(4, 13, 1);
      b.seedArc(14, 11, 16, 11, 3, 0.8);        // over heap 1 (top row 12)
      b.seedRun(18, 26, 2);
      b.seedArc(28, 10, 30, 10, 3, 0.9);        // over heap 2 (top row 11)
      b.seedRun(32, 40, 2);
      b.seedArc(42, 11, 44, 11, 3, 0.8);        // over heap 3 (top row 12)
      b.seedRun(46, 51, 1);
      b.seed(52, 11).seed(52, 9);                // up the hidden bounce
      b.seedArc(56, 11, 57, 11, 2, 0.6);        // over heap 4 (top row 12)
      b.seedRun(59, 66, 2);
      b.seedArc(67, 10, 68, 10, 2, 0.7);        // over heap 5 (top row 11)
      b.seedRun(70, 90, 2);                      // through the open finale

      // Ambient life beyond the two veiled pockets: sparse butterflies and a
      // couple of birds drifting over the unveiled garden.
      b.creature('bird', 38).creature('bird', 82)
       .creature('butterfly', 30, 7).creature('butterfly', 85, 7);
    }
  });
})();
