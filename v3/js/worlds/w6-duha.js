// World Six — Ad-Duha · The Morning Brightness
// Qadr ends under full stars with peace until dawn; this world begins in that
// exact starred stillness and lets dawn arrive one gathered ayah at a time.
// Its terrain follows the surah's three movements: promise (1–5), shelter
// (6–8), then giving forward (9–11). Nothing changes with time and nothing
// tests the child — the path simply grows warmer, safer, and more generous.
(function () {
  const GOL = window.GOL;

  GOL.registerWorld(6, {
    id: 16, key: 'duha', name: 'the morning brightness',
    surahId: 93,
    palette: 'qadrEnd', endPalette: 'fatiha',
    w: 159, h: 16,
    // All ambient life is placed deliberately below so the west stays asleep
    // and the east wakes in a clean bird-then-butterfly gradient.
    density: 0.000001,
    // From the first outward-turning ayah, restoration runs ahead of the child.
    bloomAhead: { from: 9, tiles: 7 },
    build(b) {
      b.ground(0, 158, 13);

      // ── MOVEMENT I · THE OATHS AND THE PROMISE (ayahs 1–5) ───────────

      // 1 — morning brightness held inside the last of Qadr's night. There is
      // no opening mound: only Qadr's summit lantern, a sleeping tortoise, and
      // the first low gem shining more brightly than anything around it.
      b.gem(1, 10, 11);
      b.prop('lantern', 7);
      b.creature('tortoise', 4, null, { range: 18 });

      // 2 — the night when it grows still. A long pond, five plain stones, no
      // nearby creature, and only a few sparks leave this the quietest beat.
      b.water(20, 32, 13);
      b.stone(21).stone(24).stone(26).stone(28).stone(31);
      b.gem(2, 26, 10);

      // 3 — "not forsaken": two soft steps make the first clear turn upward.
      // From here the guiding sparks become dense and never thin again.
      b.slab(37, 41, 11).slab(43, 47, 9);
      b.gem(3, 45, 7);
      b.prop('flowers', 36, { v: 1 }).prop('lantern', 48);

      // 4 — "better than the first": the broadest, tallest mound so far rises
      // in gentle shoulders, with its gem resting on the high central crest.
      b.block(51, 52, 11, 12);
      b.block(53, 54, 10, 12);
      b.block(55, 59, 9, 12);
      b.block(60, 61, 10, 12);
      b.block(62, 63, 11, 12);
      b.gem(4, 57, 7);
      b.prop('olive', 52).prop('flowers', 61, { v: 2 });

      // 5 — "He will give, and you will be pleased": a high gem and an onward
      // landing reached by a bounce. This is route, not the familiar secret —
      // there is deliberately no blossom over this pad.
      b.bounce(66);
      b.gem(5, 66, 6);
      b.slab(69, 71, 9);

      // ── MOVEMENT II · THE THREE SHELTERS (ayahs 6–8) ─────────────────

      // 6 — orphan, then sheltered. The bounce route lands on the low roof;
      // the child drops at its open eastern face, then walks inside without a
      // jump. A back wall and roof hold the gem and one warm lantern lightly —
      // an alcove, never a cave or foreground occluder.
      b.stoneBlock(73, 73, 9, 12);
      b.stoneBlock(74, 80, 9, 9);
      b.gem(6, 77, 11);
      b.prop('lantern', 79);

      // 7 — lost, then guided. Olives and cypresses flank one level lane while
      // its dense seed-line runs absolutely straight through the middle.
      b.gem(7, 94, 11);
      b.prop('olive', 84).prop('cypress', 88)
       .prop('olive', 99, { v: 1 }).prop('cypress', 103, { v: 1 });

      // 8 — poor, then enriched. Low garden walls, a fruiting tree, and a thick
      // pocket of flowers hold the gem; three birds resting here lift together
      // as the child reaches it, the waking world's fullest beat so far.
      b.gem(8, 111, 11);
      b.prop('wall', 106, { n: 3 }).prop('wall', 115, { n: 3 })
       .prop('fruit', 111, { v: 1 })
       .prop('flowers', 107).prop('flowers', 109, { v: 2 })
       .prop('flowers', 113, { v: 1 }).prop('flowers', 116, { v: 2 });
      // Their shared x makes the proximity wake-up atomic; the small height
      // offsets keep all three bodies visible around the tree before takeoff.
      b.creature('bird', 111, 11.55).creature('bird', 111, 11.8)
       .creature('bird', 111, 12);

      // ── MOVEMENT III · GIVING FORWARD (ayahs 9–11) ───────────────────

      // Three open, gentle rises in full forenoon. The bloomAhead declaration
      // above makes each collection flower the next seven tiles, so by ayah 11
      // the walk toward the listening fire is already restored.
      b.block(119, 123, 12, 12);
      b.gem(9, 121, 10);
      b.slab(126, 130, 11);
      b.gem(10, 128, 9);
      b.block(133, 139, 10, 12);
      b.gem(11, 137, 8);
      b.prop('flowers', 120, { v: 1 }).prop('olive', 124)
       .prop('flowers', 132, { v: 2 }).prop('cypress', 140);

      // The one hidden Rahma blossom waits at the very end in open morning sky:
      // the old bounce-and-secret pairing becomes the last bright blessing,
      // not the route beat at ayah 5.
      b.bounce(145);
      b.blossom(145, 6);

      // A quiet, unaimed memory setting and a sparse golden listening clearing.
      // The stone remains scenery under PLAN §10; the campfire and door keep
      // their wide, flat headroom.
      b.slab(148, 148, 12);
      b.memory(148);
      b.campfire(152);
      b.door(157);
      b.prop('lantern', 150).prop('flowers', 155, { v: 1 });

      b.start(3);

      // Sparse under the opening stars and across the still pond…
      b.seedRun(4, 16, 4);
      b.seedArc(19, 11, 31, 11, 4, 0.5);

      // …then visibly thick from the promise onward, tracing every landing,
      // the shelter curl, the dead-straight tree lane, and all three rises.
      b.seedArc(33, 11, 45, 7, 8, 1);
      b.seedRun(46, 50, 1);
      b.seedArc(51, 10, 57, 7, 6, 0.6);
      b.seedRun(59, 65, 1);
      b.seedArc(66, 11, 70, 8, 6, 1.2);
      b.seedRun(70, 79, 1);
      b.seedArc(80, 8, 82, 11, 3, 0);
      b.seed(80, 11).seed(78, 11).seed(76, 11);
      b.seedRun(83, 103, 1);
      b.seedRun(104, 117, 1);
      b.seedArc(117, 11, 121, 10, 5, 0.4);
      b.seedArc(123, 10, 128, 9, 6, 0.5);
      b.seedArc(130, 9, 137, 8, 8, 0.5);
      b.seedRun(139, 144, 1);
      b.seed(145, 11).seed(145, 9);
      b.seedRun(146, 150, 1);

      // Eastward waking: birds begin only after the shelters start, and the
      // first ambient butterflies wait until the garden has become abundant.
      b.creature('bird', 82).creature('bird', 97).creature('bird', 126)
       .creature('butterfly', 104, 7).creature('butterfly', 121, 6)
       .creature('butterfly', 139, 7);
    }
  });
})();
