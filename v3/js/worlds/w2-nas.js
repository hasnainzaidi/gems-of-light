// World Two — An-Nas · The Village
// Al-Falaq's twin: refuge sought not in the dawn but among people. So this is
// the liveliest garden yet — a lived-in village of low walls, a fountain
// square, lantern-lit lanes and little houses to hop across. Six ayat, six
// gems, walked left-to-right in surah order. And here the first memory stone
// appears: an old setting that remembers Al-Falaq's Grand Gem, waiting up a
// step in a walled dooryard for a child who carries that gem to wake it.
(function () {
  const GOL = window.GOL;

  GOL.registerWorld(2, {
    id: 12, key: 'nas', name: 'the village',
    surahId: 114,
    palette: 'nas', // restoration still blooms the flowers, no palette drift
    w: 100, h: 16,
    build(b) {
      b.ground(0, 99, 13);

      // the village edge — a flowered mound holds the first gem
      b.block(9, 11, 12, 12);
      b.gem(1, 10, 10);
      b.prop('olive', 6).prop('flowers', 5, { v: 1 }).prop('wall', 13, { n: 3 });

      // two garden steps up between the walls to the second
      b.slab(16, 18, 11).slab(21, 23, 9);
      b.gem(2, 22, 7);
      b.seed(17, 10).seed(19, 9).seed(22, 8);
      b.prop('bush', 15, { v: 1 }).prop('lantern', 20).prop('flowers', 25, { v: 2 });

      // the fountain square — a shallow basin with stepping stones, the
      // village spring beside it, and the third gem on the rise beyond
      b.water(27, 31, 13);
      b.stone(28).stone(30);
      b.prop('fountain', 34).prop('lantern', 26).prop('flowers', 35, { v: 1 });
      b.prop('wall', 37, { n: 4 });
      b.block(40, 42, 12, 12);
      b.gem(3, 41, 10);
      b.prop('cypress', 44).prop('flowers', 39);
      b.creature('tortoise', 36, null, { range: 60 });

      // a walled dooryard, up one lantern-lit step off the lane — an old
      // stone rests here that remembers Al-Falaq's Grand Gem (the memory
      // stone; a child carrying that gem wakes the whole surah again)
      b.stoneBlock(46, 49, 12, 12);
      b.memory(47, 113);
      b.prop('wall', 45, { n: 2 }).prop('lantern', 46).prop('lantern', 49)
       .prop('flowers', 48, { v: 2 });
      b.seed(47, 10);

      // a bounce blossom lifts to the fourth, high in the village air
      b.bounce(56);
      b.gem(4, 56, 8);
      b.seed(56, 11).seed(56, 9);
      b.blossom(57, 6); // the hidden Rahma blossom, straight up off the bounce
      b.prop('lantern', 52).prop('flowers', 59);

      // gentle steps up to the fifth
      b.slab(62, 63, 11).slab(66, 67, 9);
      b.gem(5, 67, 7);
      b.seed(63, 10).seed(66, 8);
      b.prop('cypress', 60).prop('bush', 69, { v: 2 });

      // two little village houses to hop across
      b.stoneBlock(72, 74, 11, 12).stoneBlock(78, 80, 10, 12);
      b.prop('lantern', 71).prop('wall', 76, { n: 2 }).prop('flowers', 81);

      // the last gem on a final garden step
      b.block(84, 86, 12, 12);
      b.gem(6, 85, 10);
      b.prop('olive', 88).prop('flowers', 83);

      // the campfire clearing, and the shrine door beyond it — calm and sparse
      b.campfire(90);
      b.door(96);
      b.prop('lantern', 87).prop('wall', 93, { n: 3 }).prop('lantern', 94);

      b.start(3);
      b.seedRun(4, 8);
      b.seedArc(26, 11, 32, 11, 5, 1); // over the fountain basin
      b.seedRun(43, 45);
      b.seedRun(58, 61);
      b.seedArc(72, 10, 80, 9, 5, 1); // over the rooftops
      b.seedRun(87, 89);
      b.creature('bird', 16).creature('bird', 44).creature('bird', 75)
       .creature('bird', 88)
       .creature('butterfly', 20, 6).creature('butterfly', 34, 7)
       .creature('butterfly', 53, 6).creature('butterfly', 81, 8);
    }
  });
})();
