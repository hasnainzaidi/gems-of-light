// World Five — Al-Kawthar · The River of Abundance
// The shortest surah opens on its gift immediately: the child steps from a
// tiny bank straight onto the river, follows its flower-waking shore, then
// rides a broad ferry reach toward the sparkle waiting over the far bank.
// Three gems are enough to leave both reaches overflowing with new flowers.
(function () {
  const GOL = window.GOL;

  GOL.registerWorld(5, {
    id: 15, key: 'kawthar', name: 'the river of abundance',
    surahId: 108,
    palette: 'kawthar', endPalette: 'falaqEnd', // fresh spring warming to gold
    w: 68, h: 16,

    // Each gift wakes a generous ring around itself and sends another handful
    // to the solid banks touching both water reaches. The water's edges fill
    // over the life of the level, even when a gem hangs out above the channel.
    bloomScale: 3,
    bloomBanks: [[0, 4], [12, 24], [40, 49]],

    build(b) {
      b.ground(0, 67, 13);

      // THE GIFT, IMMEDIATELY — only a few tiles of bank before the first
      // water. Gem one hangs low over the middle stepping stone: no opening
      // mound, no preamble, just the river offered at the first touch.
      b.water(5, 11, 13);
      b.stone(6).stone(8).stone(10);
      b.gem(1, 8, 11);
      b.prop('tuft', 1, { v: 1 }).prop('olive', 3)
       .prop('flowers', 4, { v: 1 }).prop('flowers', 12, { v: 2 });

      // THE BANK WALK — a little breathing room between the two reaches. Its
      // flat, seed-lit shore lets the child's first bloom trail stay visible.
      b.prop('bush', 14, { v: 1 }).prop('lantern', 17)
       .prop('cypress', 20).prop('flowers', 23, { v: 1 });
      b.creature('tortoise', 18, null, { range: 42 });

      // THE WIDE REACH — the ferry rides one row above the water and turns at
      // each bank. Gem two waits over mid-channel, gathered from the raft.
      b.water(25, 39, 13);
      b.raft(26, 38, 12);
      b.gem(2, 32, 11);
      b.prop('olive', 24).prop('flowers', 40, { v: 2 });

      // The ferry lands beneath the secret. Its blossom glints overhead for
      // the whole approach, then the pad at the far bank lifts straight to it.
      b.bounce(40);
      b.blossom(40, 6);
      b.seed(40, 11).seed(40, 9);

      // THE FAR RISE — one low fountain terrace holds the final gem. From its
      // crest the path pours directly into the hawd-like resting clearing.
      b.block(44, 48, 12, 12);
      b.gem(3, 46, 10);
      b.prop('fountain', 46).prop('flowers', 43, { v: 1 })
       .prop('flowers', 49, { v: 2 });

      // THE HAWD — a second fountain dresses the earned campfire. The old
      // unaimed memory setting remains quiet scenery beside it; the door waits
      // well beyond the fire on the same broad, open bank.
      b.slab(51, 51, 12);
      b.memory(51);
      b.prop('fountain', 54).prop('lantern', 56);
      b.campfire(58);
      b.door(64);
      b.prop('flowers', 52, { v: 1 }).prop('cypress', 62)
       .prop('lantern', 63).prop('flowers', 66, { v: 2 });

      // A singing thread across both channels, up the far-bank secret, and
      // onward to the fire makes every intended crossing readable without UI.
      b.start(2);
      b.seedArc(4, 11, 12, 11, 5, 1);   // first stepping-stone crossing
      b.seedRun(13, 23, 2);             // bank walk
      b.seedArc(24, 11, 40, 11, 7, 1); // ferry reach
      b.seed(43, 10).seed(46, 9);       // far rise and fountain gem
      b.seedRun(49, 56, 2);             // hawd approach

      b.creature('bird', 15).creature('bird', 47).creature('bird', 61);
    }
  });
})();
