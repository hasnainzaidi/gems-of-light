// World Six — Ad-Duha · The Morning Brightness
// "By the morning brightness, and the night when it grows still — your Lord has
// not forsaken you." The gentlest world in the journey: a wide, unhurried
// garden wander with no trial and no urgency. Eleven ayat, eleven gems, walked
// left-to-right in calm beats of one gem each.
//
// The soul of the world is the light. It opens in deep-blue starlit stillness
// ('qadrEnd' — the night when it grows still) and warms GEM BY GEM toward the
// fullest golden forenoon ('fatiha' — the morning brightness), the engine
// lerping the sky from palette to endPalette as gems are gathered. This is
// prototype p7's night→morning palette driver, reused whole: the reassurance
// of the surah lives entirely in the warming light, never in a word. Soft
// creatures wake as the morning comes; the walk ends in a warm sunrise clearing.
(function () {
  const GOL = window.GOL;

  GOL.registerWorld(6, {
    id: 16, key: 'duha', name: 'the morning brightness',
    surahId: 93,
    palette: 'qadrEnd', endPalette: 'fatiha', // still starred night → golden forenoon
    w: 150, h: 16,
    build(b) {
      b.ground(0, 149, 13);

      // ── beat 1 (ayah 1): a flowered mound in the last of the night ──
      b.block(9, 11, 12, 12);
      b.gem(1, 10, 10);
      b.prop('olive', 6).prop('flowers', 8, { v: 1 }).prop('bush', 13, { v: 1 });
      b.creature('tortoise', 4, null, { range: 40 }); // asleep on the near bank

      // ── beat 2 (ayah 2): two gentle garden steps up ──
      b.slab(16, 18, 11).slab(20, 22, 9);
      b.gem(2, 21, 7);
      b.seedArc(15, 11, 22, 7, 4, 1);
      b.prop('lantern', 15).prop('flowers', 24, { v: 2 });

      // ── beat 3 (ayah 3): a low grassy mound ──
      b.block(33, 35, 12, 12);
      b.gem(3, 34, 10);
      b.prop('cypress', 27).prop('flowers', 31);

      // ── beat 4 (ayah 4): a shallow pond crossed on stepping stones ──
      b.water(40, 46, 13);
      b.stone(41).stone(43).stone(45);
      b.block(47, 49, 12, 12); // the far bank rise
      b.gem(4, 48, 10);
      b.seedArc(39, 11, 47, 11, 5, 1); // over the still water
      b.prop('fountain', 38).prop('flowers', 50, { v: 1 });

      // ── beat 5 (ayah 5): a bounce blossom lifts to a high gem ──
      b.bounce(59);
      b.gem(5, 59, 8);
      b.blossom(59, 6); // the hidden Rahma blossom, straight up off the pad
      b.seed(59, 11).seed(59, 9);
      b.prop('bush', 55, { v: 2 }).prop('flowers', 62);

      // ── beat 6 (ayah 6): two steps up as the sky lightens ──
      b.slab(65, 67, 11).slab(69, 71, 9);
      b.gem(6, 70, 7);
      b.seedArc(64, 11, 70, 7, 4, 1);
      b.prop('lantern', 63).prop('flowers', 73, { v: 1 });

      // ── beat 7 (ayah 7): a flowered mound, birds beginning to stir ──
      b.block(82, 84, 12, 12);
      b.gem(7, 83, 10);
      b.prop('olive', 78).prop('flowers', 86);

      // ── beat 8 (ayah 8): a single soft rise ──
      b.slab(92, 94, 11);
      b.gem(8, 93, 9);
      b.prop('bush', 89, { v: 1 }).prop('flowers', 96, { v: 2 });

      // ── beat 9 (ayah 9): a garden mound in the forenoon warmth ──
      b.block(104, 106, 12, 12);
      b.gem(9, 105, 10);
      b.prop('cypress', 100).prop('flowers', 108);

      // ── beat 10 (ayah 10): the last steps up ──
      b.slab(110, 112, 11).slab(114, 116, 9);
      b.gem(10, 115, 7);
      b.seedArc(109, 11, 116, 7, 4, 1);
      b.prop('lantern', 109).prop('flowers', 118, { v: 1 });

      // ── beat 11 (ayah 11): the final mound in full golden light ──
      b.block(127, 129, 12, 12);
      b.gem(11, 128, 10);
      b.prop('olive', 124).prop('flowers', 131, { v: 2 });

      // the warm sunrise clearing: a low step just off the walking line holds
      // an ancient memory setting — unaimed: after this morning's own surah
      // has been heard, the journey chooses which earlier surah it remembers
      // (the one longest un-recalled — WORLDS-PLAN §1) — then the campfire
      // and the shrine door, out in the fullest morning.
      b.slab(134, 134, 12);
      b.memory(134);
      b.campfire(139);
      b.door(144);
      b.prop('lantern', 137).prop('flowers', 141).prop('bush', 147, { v: 2 });

      b.start(4);

      // noor-seed trails threading the whole gentle wander (well above the
      // floor; arcs marking the leaps, runs singing the flat stretches)
      b.seedRun(4, 8);
      b.seedRun(24, 32);
      b.seedRun(50, 57);
      b.seedRun(73, 81);
      b.seedRun(85, 92);
      b.seedRun(96, 103);
      b.seedRun(118, 126);
      b.seedRun(130, 135);

      // creatures: a tortoise sleeps low in the west; birds and butterflies
      // wake and venture out as the morning brightness spreads eastward
      b.creature('butterfly', 27, 6).creature('butterfly', 76, 6)
       .creature('butterfly', 120, 5)
       .creature('bird', 88).creature('bird', 112).creature('bird', 133);
    }
  });
})();
