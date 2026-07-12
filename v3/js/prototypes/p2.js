// v3 Prototype 2 — Vertical Climb
// Hypothesis: does a single upward journey create a stronger sense of
// progression? Not a meadow to wander but a mountain to summit — the
// Mountain of Light (hence the alaq → alaqEnd dawn drift): each Ayah Gem is a
// landmark of height, waterfalls pour past the ledges, and every jump is a
// rung gained. You never go back down; you only rise.
(function () {
  const GOL = window.GOL;

  GOL.PROTOTYPES[2] = {
    id: 2, key: 'climb', name: 'vertical climb',
    surahId: 113,
    palette: 'alaq', endPalette: 'alaqEnd', // dawn rises as the gems are gathered
    w: 44, h: 44,
    build(b) {
      // the whole world stands on one base floor; the mountain grows UP from it
      b.ground(0, 43, 41);
      b.water(36, 41, 41); // a safe pool at the foot of the falls (never a hazard)

      // ── the lower face: a solid switchback stair climbing up-and-right ──
      b.block(10, 12, 38, 41); // step 1
      b.block(13, 15, 35, 41); // step 2
      b.block(16, 18, 32, 41); // step 3
      b.block(19, 21, 29, 41); // step 4
      b.block(22, 24, 26, 41); // step 5 — the outer shoulder of the mountain

      // ── the upper face: floating slab ledges switch back up-and-left ──
      b.slab(20, 22, 23); // ledge 6
      b.slab(17, 19, 20); // ledge 7
      b.slab(14, 16, 17); // ledge 8
      b.slab(11, 13, 14); // ledge 9
      b.slab(8, 10, 11);  // ledge 10 — the high left buttress
      b.slab(10, 12, 8);  // ledge 11 — the last rung before the top

      // ── the summit plateau: a broad flat cap, nothing floating above it ──
      b.stoneBlock(14, 26, 5, 7);

      // five gems, one per ayah, each a landmark of height above a ledge
      b.gem(1, 11, 36); // just off the first step
      b.gem(2, 17, 30); // mid stair
      b.gem(3, 23, 24); // the shoulder
      b.gem(4, 15, 15); // high on the slab face
      b.gem(5, 9, 9);   // the buttress, the peak in sight

      // the resting place and the shrine door, far apart on the flat summit
      b.campfire(17);
      b.door(23);

      // a secret at the mountain's foot: drop down the far side to a bounce
      // blossom, and the hidden Rahma bloom waits straight up in the open air
      b.bounce(30);
      b.blossom(30, 35);

      // noor seeds trace the ascent — arcs leaping between the ledges
      b.seedArc(8, 40, 11, 37, 3, 2);  // floor → step 1
      b.seedArc(14, 34, 17, 31, 3, 2); // step 2 → step 3
      b.seedArc(20, 28, 23, 25, 3, 2); // step 4 → the shoulder
      b.seedArc(21, 22, 18, 19, 3, 1); // the switchback turn, ledge 6 → 7
      b.seedArc(15, 16, 12, 13, 3, 1); // ledge 8 → 9
      b.seed(7, 39);  // a first spark by the trailhead
      b.seed(9, 10);  // on the high buttress
      b.seed(11, 7);  // the last rung
      b.seed(14, 4);  // cresting the summit

      // waterfalls give the climb life, pouring past the ledges into the pool
      b.waterfall(7, 25);  // the left face
      b.waterfall(25, 8);  // spilling off the summit cliff
      b.waterfall(38, 7);  // the tall fall into the pool

      // set dressing: cypress and lantern crown the summit, an olive clings to
      // a high ledge, a fallen column and flowers rest at the base
      b.prop('lantern', 16).prop('cypress', 25).prop('flowers', 15)
       .prop('olive', 9).prop('bush', 12)
       .prop('column', 33).prop('flowers', 6);

      b.creature('bird', 20, 3).creature('bird', 30, 6)
       .creature('butterfly', 12, 12).creature('butterfly', 22, 24);

      b.start(6); // at the very bottom, looking up
    }
  };
})();
