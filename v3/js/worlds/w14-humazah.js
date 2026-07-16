// World Fourteen — Al-Humazah · Gathered To Give
// Nine dull grey hoard-piles line the road, each one a low stone cairn with
// an open pocket the child simply walks into. Lift the gem out and the engine
// blooms flowers over the abandoned grey heap (bloomScale 3): generosity told
// entirely through restoration. The world never scolds — it blooms. The sky
// warms from humazah's deep shade to the shared table of maun as each gift is
// carried away, and two open stretches breathe between the hoards.
(function () {
  const GOL = window.GOL;

  GOL.registerWorld(14, {
    id: 24, key: 'humazah', name: 'gathered to give',
    surahId: 104,
    palette: 'humazah', endPalette: 'maun', // deep shade → the shared table
    w: 108, h: 16,
    density: 0.1,      // the ground starts spare; the BLOOMS supply the flowers
    bloomScale: 3,     // every freed gem bursts flowers over the grey pile

    build(b) {
      b.ground(0, 107, 13);
      b.start(2);

      // HOARD 1 — a knee-high heap. One low row of stone with a west-open
      // notch at its foot; the child steps straight in and lifts the gem.
      b.stoneBlock(6, 9, 12, 12).stoneBlock(9, 9, 11, 11);
      b.carve(6, 6, 12, 12);
      b.gem(1, 6, 12);
      b.prop('tuft', 3, { v: 1 }).prop('bush', 11, { v: 1 });

      // HOARD 2 — twin heaps flanking. Two small cairns stand shoulder to
      // shoulder with the gem waiting in the open channel between them.
      b.stoneBlock(14, 15, 11, 12).stoneBlock(17, 18, 11, 12);
      b.gem(2, 16, 12);
      b.prop('flowers', 20, { v: 2 }).prop('tuft', 22, { v: 0 });

      // HOARD 3 — a pocket in a hollow. The ground itself dips into a shallow
      // stone-rimmed bowl; the child drops in, gathers, and climbs back out.
      b.stoneBlock(24, 25, 12, 12).stoneBlock(29, 30, 12, 12);
      b.carve(26, 28, 13, 13);
      b.gem(3, 27, 13);
      b.prop('olive', 32);

      // --- OPEN STRETCH ONE (x ~31–40): pure ground, seeds only ---
      b.prop('flowers', 34, { v: 1 }).prop('tuft', 37, { v: 2 });

      // HOARD 4 — atop a mound reached by two garden steps. A tall grey pile
      // holds the gem in an open slot on its crown; climb the slabs to it.
      b.slab(40, 41, 11);
      b.stoneBlock(44, 48, 10, 12);
      b.carve(46, 46, 10, 10);
      b.gem(4, 46, 10);
      b.prop('cypress', 43);

      // HOARD 5 — behind a low woven wall. A run of wall props screens the
      // cairn; the gem nests in a roofed pocket that opens toward the road.
      b.prop('wall', 52, { n: 3 });
      b.stoneBlock(55, 57, 11, 12);
      b.carve(56, 56, 12, 12);
      b.gem(5, 56, 12);
      b.prop('flowers', 59, { v: 0 });

      // HOARD 6 — half-ringed by column stubs, a hoard of fallen grandeur.
      // Broken columns curl around a small cairn with its west pocket open.
      b.prop('column', 63).prop('column', 68);
      b.stoneBlock(65, 67, 11, 12);
      b.carve(66, 66, 12, 12);
      b.gem(6, 66, 12);
      b.prop('tuft', 70, { v: 1 });

      // --- OPEN STRETCH TWO (x ~69–82): the secret lives here ---
      // The one treasure that was never hoarded: a bounce pad in the open,
      // its blossom straight overhead, no grey stone anywhere near it.
      b.bounce(76);
      b.blossom(76, 7);
      b.prop('flowers', 72, { v: 2 }).prop('bush', 80, { v: 2 });

      // HOARD 7 — small and mean. The tightest pile of all: a cramped two-wide
      // pocket, roofed low, the gem crammed into its shadow.
      b.stoneBlock(84, 85, 11, 12);
      b.carve(84, 84, 12, 12);
      b.gem(7, 84, 12);

      // HOARD 8 — wide and sprawling. A long low ridge of grey with a raised
      // back shoulder; its walk-in pocket yawns open at the near end.
      b.stoneBlock(88, 92, 12, 12).stoneBlock(91, 92, 11, 11);
      b.carve(88, 88, 12, 12);
      b.gem(8, 88, 12);
      b.prop('tuft', 87, { v: 2 });

      // HOARD 9 — right beside the campfire clearing. The last gift blooms
      // over the resting place: a modest cairn two tiles shy of the fire.
      b.stoneBlock(95, 96, 11, 12);
      b.carve(95, 95, 12, 12);
      b.gem(9, 95, 12);

      // THE RESTING PLACE — a calm, flat clearing. The whole surah is heard at
      // the fire, the door waits open ground beyond it. Nothing floats above.
      b.campfire(98);
      b.door(103);
      b.prop('lantern', 100).prop('cypress', 106)
       .prop('flowers', 101, { v: 1 });

      // A singing seed thread traces the whole road: open runs on bare ground,
      // arcs up onto the mound and up the secret's bounce.
      b.seedRun(2, 5, 1);
      b.seed(10, 11).seed(12, 11);
      b.seed(16, 11);
      b.seed(19, 11).seed(22, 11);
      b.seed(26, 12).seed(28, 12);          // into the hollow
      b.seedRun(31, 40, 2);                  // open stretch one
      b.seedArc(41, 11, 46, 9, 4, 1);        // up the two steps to the crown
      b.seed(49, 11).seed(51, 11);
      b.seed(54, 11);                         // toward the walled pocket
      b.seed(59, 11).seed(62, 11);
      b.seed(64, 11);                         // toward the columns
      b.seedRun(69, 74, 2);                  // open stretch two
      b.seed(76, 11).seed(76, 9).seed(76, 8); // up the bounce to the blossom
      b.seedRun(78, 82, 2);
      b.seed(86, 11).seed(87, 11);
      b.seed(93, 11).seed(94, 11);

      // The cast: one tortoise ambling the middle road, butterflies scattered
      // mid-world (blooms gather no creatures — this is the nearest we wire).
      b.creature('tortoise', 50, null, { range: 44 });
      b.creature('butterfly', 21, 8).creature('butterfly', 47, 7)
       .creature('butterfly', 61, 8).creature('butterfly', 79, 7)
       .creature('bird', 33).creature('bird', 90);
    }
  });
})();
