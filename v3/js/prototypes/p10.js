// v3 Prototype 10 — Guided Path
// Hypothesis: what happens if the player always knows where the next Ayah
// Gem is? Highly directed, cinematic, almost no navigation decisions. A single
// unbroken corridor: the noor-seed trail leads tile-by-tile from start to gem 1
// to gem 2 … to the campfire, arcing over every obstacle exactly where the foot
// should land. Al-Falaq gathered in order, the way a procession gathers.
// The control condition against Prototype 9's open world.
(function () {
  const GOL = window.GOL;

  GOL.PROTOTYPES[10] = {
    id: 10, key: 'guided', name: 'guided path',
    surahId: 113,
    palette: 'nas', // the lively village garden, lanterns down the way
    w: 99, h: 16,
    build(b) {
      b.ground(0, 98, 13);

      // Scene 1 — the first gem, framed by two lanterns like a doorway
      b.gem(1, 13, 11);
      b.prop('lantern', 10).prop('lantern', 16).prop('cypress', 8);

      // Scene 2 — a gentle rise; the second gem waits at the top of the step
      b.block(24, 28, 12, 12);
      b.gem(2, 26, 10);
      b.prop('lantern', 22).prop('lantern', 30).prop('flowers', 27, { v: 1 });

      // Scene 3 — a shallow stream, two stones set right where the trail arcs;
      // the third gem on the far bank, olives leaning in to greet it
      b.water(33, 37, 13);
      b.stone(34).stone(36);
      b.gem(3, 44, 11);
      b.prop('olive', 40).prop('cypress', 47).prop('flowers', 43);

      // Scene 4 — a bounce blossom, and straight above it the hidden Rahma
      // blossom (the one gentle deviation the guided walk allows); the fourth
      // gem sits just past it, still on the level path
      b.bounce(50);
      b.blossom(50, 6);
      b.gem(4, 55, 11);
      b.prop('lantern', 53).prop('lantern', 57);

      // Scene 5 — a short slab stair up to a flowered dais; the last gem
      b.slab(61, 63, 11);
      b.block(65, 69, 11, 12);
      b.gem(5, 67, 9);
      b.prop('lantern', 64).prop('lantern', 71).prop('flowers', 66, { v: 2 });

      // the campfire clearing, and the shrine door a walk beyond it
      b.campfire(84);
      b.door(90);
      b.prop('lantern', 80).prop('olive', 87);

      b.start(3);

      // the signature: one unbroken trail, no branch, no doubt
      b.seedRun(4, 11);
      b.seedRun(13, 21, 3);
      b.seedRun(24, 30);
      b.seedArc(31, 12, 39, 12, 5, 2); // over the stream
      b.seedRun(40, 49, 3);
      b.seedRun(50, 58);
      b.seedRun(59, 69, 3);
      b.seedRun(72, 84, 3);

      // the procession: birds ahead, butterflies loitering by the lanterns,
      // a tortoise ambling the whole length — company, never obstacle
      b.creature('tortoise', 6, null, { range: 90 });
      b.creature('bird', 20).creature('bird', 48).creature('bird', 78)
       .creature('butterfly', 26, 7).creature('butterfly', 44, 8)
       .creature('butterfly', 55, 7).creature('butterfly', 82, 9);
    }
  };
})();
