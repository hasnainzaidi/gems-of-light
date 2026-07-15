// World Two — An-Nas · The Village
// Al-Falaq's revealed twin, answered in reverse: its garden beats return in
// mirrored order, but every gem belongs to a lived-in people-place — dooryard,
// rooftops, fountain square, lantern lane, and the village-edge rise.
(function () {
  const GOL = window.GOL;

  GOL.registerWorld(2, {
    id: 12, key: 'nas', name: 'the village',
    surahId: 114,
    palette: 'nas', // restoration still blooms the flowers, no palette drift
    w: 100, h: 16,
    build(b) {
      b.ground(0, 99, 13);

      // Falaq ends its gem-walk on steps; its twin begins there. The first
      // steps rise into a small dooryard, with the first gem at its lantern.
      b.slab(8, 10, 11).slab(12, 15, 9);
      b.gem(1, 14, 7);
      b.prop('wall', 7, { n: 2 }).prop('lantern', 13)
       .prop('olive', 16).prop('flowers', 11, { v: 2 });

      // A pad in the street lifts toward a blossom at rooftop height. The
      // open-sky secret and the two little house roofs form one village beat;
      // gems two and three carry the natural hop east across the pair.
      b.bounce(22);
      b.blossom(22, 7);
      b.stoneBlock(25, 28, 10, 12).stoneBlock(31, 34, 9, 12);
      b.gem(2, 27, 8);
      b.gem(3, 33, 7);
      b.prop('lantern', 20).prop('wall', 24, { n: 2 })
       .prop('flowers', 29, { v: 1 }).prop('lantern', 35);

      // The middle of the mirror is the village's gathering place: a shallow
      // fountain basin crossed on stones, with gem four over the spring.
      b.water(42, 49, 13);
      b.stone(43).stone(46).stone(49);
      b.gem(4, 46, 10);
      b.prop('lantern', 41).prop('fountain', 51)
       .prop('wall', 52, { n: 3 }).prop('flowers', 50, { v: 1 });
      b.creature('tortoise', 54, null, { range: 55 });

      // Garden steps now answer Falaq's early climb. Here they are a warm
      // lantern lane between homes, with the fifth gem where neighbors pass.
      b.slab(58, 60, 11).slab(63, 66, 9);
      b.gem(5, 65, 7);
      b.prop('bush', 57, { v: 1 }).prop('lantern', 61)
       .prop('lantern', 66).prop('wall', 68, { n: 3 })
       .prop('cypress', 69);

      // Falaq begins on a mound; Nas reaches its answering mound at the far
      // village edge. The final gem looks back over all the people-places.
      b.block(74, 77, 12, 12);
      b.gem(6, 76, 10);
      b.prop('olive', 72).prop('flowers', 73)
       .prop('bush', 79, { v: 2 });

      // Beyond the village edge, the familiar stone quietly remembers Falaq.
      // The campfire clearing and shrine door remain calm, flat, and spacious.
      b.slab(83, 83, 12);
      b.memory(83, 113);
      b.campfire(89);
      b.door(96);
      b.prop('lantern', 86).prop('wall', 92, { n: 3 })
       .prop('lantern', 94);

      b.start(3);
      b.seedRun(4, 7);
      b.seedArc(8, 10, 15, 8, 5, 1);
      b.seedRun(17, 21);
      b.seed(22, 11).seed(22, 9);
      b.seedArc(25, 9, 34, 8, 6, 1); // across the two rooftops
      b.seedRun(36, 40);
      b.seedArc(42, 11, 49, 11, 6, 1); // through the fountain square
      b.seedRun(52, 57);
      b.seedArc(58, 10, 66, 8, 5, 1); // up the lantern lane
      b.seedRun(68, 73);
      b.seedArc(74, 11, 77, 11, 3, 0.5);
      b.seedRun(79, 88);
      b.creature('bird', 17).creature('bird', 38).creature('bird', 67)
       .creature('bird', 80)
       .creature('butterfly', 19, 7).creature('butterfly', 40, 7)
       .creature('butterfly', 55, 8).creature('butterfly', 75, 7);
    }
  });
})();
