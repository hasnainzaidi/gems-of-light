// World Eight — Al-Fatiha · The Straight Path
// Seven ayat, seven gems, and one unmistakable garden way from left to right.
// Al-Fatiha is short enough to remain one whole adventure and one whole shrine:
// there are no stanza gates, checkpoints, forks, labels, or alternate routes.
//
// The first four ayat move through a close, sheltered morning garden. After
// ayah 4, two old columns quietly mark a threshold: the path does not branch,
// but the space beyond them grows broader and brighter as the recitation turns
// from praise toward worship, help, and guidance. The last ayah waits on the
// widest, stillest landing so its longer recitation has a calm place to breathe.
(function () {
  const GOL = window.GOL;

  GOL.registerWorld(8, {
    id: 18, key: 'fatiha', name: 'the straight path',
    surahId: 1,
    palette: 'ikhlas', endPalette: 'fatiha', // pale morning opens into the fullest garden light
    w: 118, h: 16,
    density: 0.03, // let the deliberate close-to-open prop rhythm stay legible
    build(b) {
      // One continuous floor keeps the route forgiving and legible on a phone.
      // Every raised surface is only a soft garden step above this safe ground.
      b.ground(0, 117, 13);

      // AYAH 1 — the small garden entrance. The first gem rests on a low,
      // flowered sill: a clear beginning without asking the child to jump far.
      b.block(9, 13, 12, 12);
      b.gem(1, 11, 10);
      b.prop('olive', 6).prop('flowers', 8, { v: 1 })
       .prop('bush', 15, { v: 1 });

      // AYAH 2 — praise rises by two gentle, closely spaced garden steps.
      // The steps are broad enough that a short thumb-jump lands comfortably.
      b.slab(18, 21, 11).slab(23, 27, 10);
      b.gem(2, 24, 8);
      b.prop('lantern', 17).prop('flowers', 22, { v: 2 })
       .prop('cypress', 29);

      // AYAH 3 — mercy is carried into the warm air. The bounce is part of the
      // visible forward route; its higher hidden blossom is the one optional
      // secret, reached by the same safe lift with open sky overhead.
      b.bounce(36);
      b.gem(3, 36, 8);
      b.blossom(36, 6);
      b.prop('flowers', 33).prop('flowers', 40, { v: 1 });

      // AYAH 4 — the end of the opening praise settles on a broad low stone.
      // Nothing moves here: it is a small breath before the surah turns.
      b.stoneBlock(46, 53, 12, 12);
      b.gem(4, 49, 10);
      b.prop('lantern', 45).prop('flowers', 54, { v: 2 });

      // QUIET THRESHOLD AFTER AYAH 4 — paired columns and lanterns read as an
      // opening, not a choice. They have no collision, instruction, or locked
      // gate; the single seed-lit path simply continues through their center.
      b.prop('lantern', 57).prop('column', 58)
       .prop('column', 62, { v: 1 }).prop('lantern', 63);

      // AYAH 5 — beyond the threshold the garden becomes visibly wider and
      // less enclosed. A long, low terrace keeps "You alone" at the center of
      // the one path rather than turning the idea into two literal choices.
      b.block(66, 73, 12, 12);
      b.gem(5, 69, 10);
      b.prop('flowers', 65, { v: 1 }).prop('cypress', 75, { v: 1 });

      // AYAH 6 — the request for guidance follows the straightest rising line
      // in the level: two wide steps, no gap, detour, moving platform, or fork.
      b.slab(79, 83, 11).slab(85, 89, 10);
      b.gem(6, 87, 8);
      b.prop('lantern', 78).prop('cypress', 92);

      // AYAH 7 — the guided path arrives on its broadest safe landing. This
      // unusually long ayah has ten flat tiles, open headroom, and no nearby
      // mechanism, so the child can stand still while the recitation finishes.
      b.stoneBlock(96, 105, 11, 12);
      b.gem(7, 102, 9);
      b.prop('flowers', 95, { v: 1 }).prop('cypress', 106);

      // The earned whole-surah listening place and the shrine door stand in a
      // separate, level clearing with generous air and walking space between.
      b.campfire(108);
      b.door(114);
      b.prop('lantern', 112);

      b.start(4);

      // A continuous thread of singing light traces the only route. Before the
      // columns it keeps a close two-tile pulse at row 11; through the opening
      // it rises, then holds row 9 in wider breaths across the brighter garden.
      b.seedArc(4, 11, 56, 11, 27, 0);
      b.seedArc(58, 11, 63, 10, 6, 0);
      b.seed(69, 9).seed(74, 9).seed(80, 9).seed(87, 9)
       .seed(96, 9).seed(103, 9);

      // Gentle life gathers along the route but never blocks or redirects it.
      b.creature('bird', 17).creature('bird', 45).creature('bird', 76)
       .creature('bird', 105)
       .creature('butterfly', 22, 6).creature('butterfly', 60, 7)
       .creature('butterfly', 91, 6);
    }
  });
})();
