// World Eleven — Al-Masad · The Palm Grove
// The gentlest consequence-surah stance: this world never dramatizes the
// warning. It is simply a warm, quiet date-palm grove where the surah is
// heard. Five ayat, five gems, each resting near a palm in its own way —
// flat ground, a sand-soft dune, a small pond crossing, a shaded hollow,
// and finally the campfire clearing itself. The grove rests; it does not
// transform (no endPalette).
(function () {
  const GOL = window.GOL;

  GOL.registerWorld(11, {
    id: 21, key: 'masad', name: 'the palm grove',
    surahId: 111,
    palette: 'maun', // this grove rests — no drift, no endPalette
    w: 78, h: 16,
    density: 0.12,
    build(b) {
      b.ground(0, 77, 13);

      // Cluster 1 — flat ground: the plainest cluster, no mound, no rise.
      // A single palm, dates at its foot, the first gem simply hovering
      // chest-high over the open path.
      b.prop('palm', 6).creature('bird', 7);
      b.gem(1, 10, 11);
      b.prop('fruit', 12);
      b.seedRun(4, 9);
      b.seed(9, 11).seed(11, 10);

      b.seedRun(13, 17);

      // Cluster 2 — a low dune-mound: sand-soft, no flowers dressing it,
      // just a bare rise the palm grows straight out of.
      b.block(19, 22, 12, 12);
      b.prop('palm', 20).creature('bird', 19);
      b.gem(2, 21, 10);
      b.prop('fruit', 22);
      b.seed(19, 11).seed(21, 9);

      // A low woven wall, mid-world — a quiet nod to the palm-fiber rope,
      // scenery only, nothing to read.
      b.seedRun(24, 29);
      b.prop('wall', 30, { n: 3 });

      // Cluster 3 — across a small pond: the grove's only water, crossed
      // on two stepping stones, the third gem waiting on the far bank.
      b.water(35, 38, 13);
      b.stone(36).stone(38);
      b.block(40, 43, 12, 12);
      b.prop('palm', 41).creature('tortoise', 33, null, { range: 50 });
      b.gem(3, 42, 10);
      b.prop('fruit', 43);
      b.seedArc(34, 11, 41, 11, 5, 1); // over the crossing
      b.seed(43, 9);

      // Secret — hidden just past the pond cluster: step off the far bank
      // and look up.
      b.seed(44, 12).seed(47, 9);
      b.bounce(46);
      b.blossom(46, 7);
      b.creature('bird', 47);

      // Cluster 4 — a shaded hollow between two palms, the date cluster
      // resting in the dip's shade.
      b.seedRun(48, 51);
      b.carve(52, 55, 13, 13);
      b.prop('palm', 51);
      b.gem(4, 53, 12);
      b.prop('fruit', 54);
      b.prop('palm', 56);
      b.seed(53, 11);
      b.seedRun(57, 60);

      // Cluster 5 — by the campfire clearing: one gentle step up, then
      // the last two palms that frame the resting place.
      b.slab(61, 63, 12);
      b.gem(5, 62, 10);
      b.seed(61, 11).seed(63, 9);
      b.prop('palm', 64).creature('bird', 65);

      // The campfire clearing, and the shrine door beyond it — framed by
      // the grove's last two palms, dates hanging warm overhead.
      b.campfire(66);
      b.door(72);
      b.prop('flowers', 68).creature('bird', 73);
      b.prop('palm', 74);
      b.seedRun(67, 71);

      b.start(3);
      b.creature('butterfly', 69, 8);
    }
  });
})();
