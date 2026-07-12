// v3 Prototype 4 — River Journey
// Hypothesis: how does continuous forward movement change pacing? The signature
// mechanic is the raft — a platform that drifts steadily downstream and slips
// back to run again. The journey breathes: bank walk → raft drift → island →
// bridge → island → raft drift → bank. Falling in is a gentle lift back to the
// bank, so the whole river is friendly — Al-Falaq, five gems along the water.
(function () {
  const GOL = window.GOL;

  GOL.PROTOTYPES[4] = {
    id: 4, key: 'river', name: 'river journey',
    surahId: 113,
    palette: 'kawthar', // fresh mint, water light
    w: 88, h: 16,
    build(b) {
      // Banks are dry ground at row 13; the river fills the gaps as water.
      b.ground(0, 13, 13);   // left bank (the setting-off shore)
      b.water(14, 24, 13);   // first river reach
      b.ground(25, 33, 13);  // island of the second gem
      b.water(34, 43, 13);   // river beneath the plank bridge
      b.ground(44, 52, 13);  // island of the bounce blossom
      b.water(53, 63, 13);   // last river reach
      b.ground(64, 87, 13);  // right bank, campfire clearing beyond

      // Gem 1 — waiting on the shore before the first crossing.
      b.gem(1, 8, 11);
      b.prop('palm', 4).prop('flowers', 10, { v: 1 });

      // First raft: board from the left bank, drift across, step onto the island.
      // Row 12 rides just above the waterline (surface row 13); the run ends AT
      // the island bank (x25) so the child simply walks off.
      b.raft(14, 25, 12);
      b.waterfall(20, 8); // a little fall spilling into the reach

      // Gem 2 — on the far island, reached by stepping off the raft.
      b.gem(2, 29, 11);
      b.prop('cypress', 32).prop('flowers', 27, { v: 2 });
      b.creature('tortoise', 30, null, { range: 44 });

      // A plank bridge (slab span) over the second reach — walking again, so the
      // pacing breathes between flowing and stepping.
      b.slab(34, 43, 12);
      b.gem(3, 38, 10); // resting on the bridge planks, two rows up
      b.prop('lantern', 34).prop('lantern', 43);

      // Island of the blossom: a bounce pad lifts high into the calm air.
      b.gem(4, 46, 11);
      b.bounce(48);
      b.blossom(48, 7); // the hidden Rahma blossom, straight up off the bounce
      b.prop('palm', 51).prop('bush', 45, { v: 1 });

      // Second raft: board from this island, drift the last reach to the right bank.
      b.raft(53, 64, 12);
      b.waterfall(59, 8);

      // Gem 5 — on the home shore.
      b.gem(5, 68, 11);
      b.prop('olive', 65).prop('flowers', 70, { v: 2 });

      // The campfire clearing and the shrine door beyond, on flat dry ground.
      b.campfire(76);
      b.door(81);
      b.prop('lantern', 73).prop('cypress', 84);

      b.start(3);

      // Noor seeds — trails on the banks and beautiful arcs over the water.
      b.seedRun(2, 10);
      b.seedArc(14, 11, 24, 11, 5, 2);   // arc over the first reach
      b.seedRun(35, 41);                 // along the bridge planks
      b.seedArc(53, 11, 63, 11, 5, 2);   // arc over the last reach
      b.seedRun(65, 71);

      // Life along the river.
      b.creature('bird', 12).creature('bird', 50).creature('bird', 72)
       .creature('butterfly', 28, 8).creature('butterfly', 47, 7)
       .creature('firefly', 78, 9);
    }
  };
})();
