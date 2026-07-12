// World Five — Al-Kawthar · The River of Abundance
// Kawthar IS a river — a gift of endless good — so this is the shortest, most
// generous world: a bright gentle brook walked left-to-right, three ayat, three
// gems. A narrow braid crossed on stepping stones, a wider reach ferried bank to
// bank on a little raft, and everywhere the water touches the ground pours out
// flowers — the restoration flavor turned all the way up. It ends at a fountain-
// dressed campfire clearing: the feeling of receiving a gift. A quiet stone
// beside the fire remembers an earlier surah (the engine aims it).
(function () {
  const GOL = window.GOL;

  GOL.registerWorld(5, {
    id: 15, key: 'kawthar', name: 'the river of abundance',
    surahId: 108,
    palette: 'kawthar', endPalette: 'falaqEnd', // fresh spring warming to gold
    w: 62, h: 16,
    build(b) {
      b.ground(0, 61, 13);

      // BEAT ONE — the brook's edge. A low flowered mound holds the first gem,
      // and abundance already spills from the ground beside the water.
      b.block(8, 11, 12, 12);
      b.gem(1, 9, 10);
      b.prop('olive', 5).prop('flowers', 6, { v: 1 }).prop('bush', 12, { v: 1 });
      b.prop('flowers', 13, { v: 2 });

      // a bounce pad among the blossoms lifts to the hidden Rahma blossom,
      // straight up in open sky — the secret gift of this generous place
      b.bounce(15);
      b.blossom(15, 7);
      b.seed(15, 11).seed(15, 9);
      b.prop('flowers', 17, { v: 1 }).prop('cypress', 19);

      // BEAT TWO — the first water: a narrow braid crossed on stepping stones,
      // the second gem hanging over the middle stone, flowers on both banks
      b.water(22, 28, 13);
      b.stone(23).stone(25).stone(27);
      b.gem(2, 25, 11);
      b.prop('flowers', 21, { v: 2 }).prop('flowers', 29, { v: 1 });
      b.prop('olive', 30);
      b.creature('tortoise', 20, null, { range: 40 });

      // BEAT THREE — the wider reach: a little ferry raft carries the wanderer
      // bank to bank, riding just above the waterline. Blossoms crowd the shore.
      b.water(33, 43, 13);
      b.raft(34, 42, 12);
      b.prop('flowers', 32, { v: 1 }).prop('flowers', 44, { v: 2 });
      b.prop('cypress', 31).prop('bush', 45, { v: 1 });

      // the far rise, and the third gem waiting where the river opens wide
      b.block(46, 49, 12, 12);
      b.gem(3, 47, 10);
      b.seed(47, 10);
      b.prop('flowers', 46, { v: 2 }).prop('olive', 49);
      b.creature('tortoise', 44, null, { range: 30 });

      // the fountain-dressed campfire clearing, and the shrine door beyond.
      // Beside the fire, up one low stone step off the walking line (flat, air
      // above), an ancient setting waits — unaimed: after this river's own
      // surah has been heard, the journey chooses which earlier surah it
      // remembers (the one longest un-recalled — WORLDS-PLAN §1).
      b.slab(52, 52, 12);
      b.memory(52);
      b.prop('fountain', 50);
      b.campfire(55);
      b.door(59);
      b.prop('flowers', 53, { v: 1 }).prop('lantern', 54).prop('lantern', 57)
       .prop('cypress', 58);

      b.start(3);
      b.seedRun(4, 8);
      b.seed(12, 10).seed(18, 11);
      b.seedArc(21, 11, 29, 11, 5, 1); // over the stepping-stone braid
      b.seedArc(32, 11, 44, 11, 6, 1); // over the ferry reach
      b.seedRun(49, 53);
      b.creature('bird', 10).creature('bird', 36).creature('bird', 56)
       .creature('butterfly', 13, 6).creature('butterfly', 27, 7)
       .creature('butterfly', 51, 6);
    }
  });
})();
