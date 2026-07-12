// v3 Prototype 1 — Dense Forest Exploration
// Hypothesis: can wandering and discovery alone make collecting Ayah Gems
// enjoyable? No pressure, no direction — just branching lanes, hidden
// clearings, and a forest thick enough that every gem feels found, not
// handed over. Three ways through the trees: the forest floor, a canopy of
// slabs up among the leaves, and a carved hollow in the earth below.
(function () {
  const GOL = window.GOL;

  GOL.PROTOTYPES[1] = {
    id: 1, key: 'forest', name: 'dense forest',
    surahId: 113, // Al-Falaq
    palette: 'humazah', // deep orchard shade
    w: 110, h: 16,
    build(b) {
      b.ground(0, 109, 13);

      // --- the way in: a flowered mound cradles the first gem ---
      b.block(8, 10, 12, 12);
      b.gem(1, 9, 10);
      b.prop('olive', 5).prop('cypress', 14, { v: 1 })
       .prop('bush', 12, { v: 1 }).prop('flowers', 6);

      // --- lane one, the canopy: step up onto slabs strung through leaves ---
      b.block(16, 17, 12, 12); // a low step onto the branches
      b.slab(20, 27, 10);
      b.gem(2, 23, 8); // tucked in the crown of an olive
      b.prop('cypress', 18).prop('palm', 21, { v: 1 }).prop('olive', 25)
       .prop('flowers', 26, { v: 2 });
      b.seed(17, 11).seed(19, 9).seed(22, 7); // a rising trail of light

      // --- lane two, a carved hollow: dip below the roots to a quiet clearing ---
      b.carve(33, 39, 12, 14); // an air pocket in the earth, floor at row 15
      b.gem(3, 36, 14);
      b.prop('lantern', 36).prop('bush', 32, { v: 2 }).prop('cypress', 41);
      b.seed(33, 12).seed(36, 13).seed(39, 12);

      // --- a still pond, safe to wade, one stepping stone across ---
      b.water(45, 47, 13);
      b.stone(46);
      b.prop('flowers', 43, { v: 1 }).prop('olive', 50);
      b.creature('tortoise', 30, null, { range: 60 });

      // --- the hidden bounce clearing: a blossom straight up, a gem below it ---
      b.bounce(53);
      b.gem(4, 53, 8); // high in the soft air, reached by the springing pad
      b.blossom(53, 6); // the hidden Rahma blossom, straight up off the bounce
      b.seed(53, 11).seed(53, 9);
      b.prop('cypress', 56).prop('flowers', 51, { v: 2 });

      // --- a last stair of branches to the fifth gem ---
      b.slab(60, 62, 11).slab(65, 68, 9);
      b.gem(5, 66, 7);
      b.prop('palm', 58).prop('olive', 69).prop('bush', 63, { v: 1 })
       .prop('flowers', 70);
      b.seed(64, 10).seed(66, 8);

      // --- the campfire clearing, calm and sparse, the shrine door beyond ---
      b.campfire(88);
      b.door(96);
      b.prop('lantern', 85).prop('olive', 101).prop('flowers', 92);

      b.start(3);
      b.seedRun(4, 8);
      b.seedRun(29, 31);
      b.seedArc(44, 11, 49, 11, 5, 1); // over the pond
      b.seedRun(58, 62);
      b.seedRun(80, 90); // the trail warming toward the fire
      b.creature('bird', 22, 6).creature('bird', 52, 5).creature('bird', 67, 5)
       .creature('butterfly', 9, 9).creature('butterfly', 36, 12)
       .creature('butterfly', 90, 9);
    }
  };
})();
