// v3 Prototype 3 — Ancient Ruins
// Hypothesis: can environmental mystery alone create intrinsic motivation?
// No signs, no arrows — just a temple that was clearly whole once. A
// processional colonnade, a collapsed wall, a half-buried chamber, a flooded
// cistern crossed on old stones, and a fountain courtyard at the far end.
// The child follows the ruin's own broken geometry, and the gems are what the
// stones were guarding. Carved cream flagstone (tile 4, b.stoneBlock) is the
// signature material — the bones of the temple showing through the green.
(function () {
  const GOL = window.GOL;

  GOL.PROTOTYPES[3] = {
    id: 3, key: 'ruins', name: 'ancient ruins',
    surahId: 113,
    palette: 'bayyinah', // luminous cream colonnades in a warm overgrown haze
    w: 76, h: 16,
    build(b) {
      b.ground(0, 75, 13);

      // ── The threshold: a processional line of columns leading in, the first
      // gem resting on a broken pedestal between the first two.
      b.prop('column', 5).prop('column', 8);
      b.stoneBlock(9, 11, 12, 12); // toppled pedestal
      b.gem(1, 10, 10);
      b.prop('flowers', 6, { v: 1 }).prop('bush', 13, { v: 2 });
      b.creature('tortoise', 4, null, { range: 60 });

      // ── The colonnade climbs: a taller flagstone step where a plinth still
      // stands, columns flanking it like the aisle they once framed.
      b.prop('column', 15).prop('column', 20);
      b.stoneBlock(17, 19, 11, 12);
      b.gem(2, 18, 9);
      b.prop('olive', 14).prop('flowers', 21, { v: 2 });

      // ── A collapsed wall, half its stones spilled into the grass. You climb
      // over what's left and drop into a half-buried chamber the temple sealed:
      // low wall to step in over, taller wall on the far side to climb back out.
      b.prop('wall', 22, { n: 3 }).prop('wall', 24, { n: 2 });
      b.stoneBlock(26, 26, 11, 12); // near wall (2 tall) — step in here
      b.stoneBlock(31, 31, 10, 12); // far wall (3 tall) — climb out here
      b.gem(3, 28, 11);
      b.prop('bush', 29, { v: 1 }).prop('flowers', 27, { v: 0 });
      b.seed(28, 10).seed(30, 10);

      // ── A flooded cistern: the old basin overtopped and green, crossed on the
      // heads of fallen stones. The fourth gem hovers above the middle stone.
      b.water(33, 41, 13);
      b.stone(34).stone(36).stone(38).stone(40);
      b.gem(4, 38, 11);
      b.prop('cypress', 32).prop('bush', 42, { v: 2 });
      b.creature('butterfly', 37, 8);

      // ── A fallen arch, its keystone long gone. A springy blossom pad has
      // grown up where the arch came down; straight above it, hidden in the
      // high air, the Rahma blossom.
      b.prop('column', 44).prop('column', 47);
      b.prop('wall', 45, { n: 2 });
      b.bounce(45);
      b.blossom(45, 7); // ≈6 rows straight up off the bounce pad
      b.seed(45, 11).seed(45, 9);

      // ── The inner sanctuary: the last gem on a standing plinth, the final
      // pair of columns still holding their line.
      b.prop('column', 52).prop('column', 56);
      b.stoneBlock(53, 55, 11, 12);
      b.gem(5, 54, 9);
      b.prop('olive', 51).prop('flowers', 57, { v: 1 });

      // ── The fountain courtyard: a calm, level clearing where the old fountain
      // still runs. The campfire rests here; the shrine door stands beyond it.
      b.prop('fountain', 61);
      b.campfire(64);
      b.door(70);
      b.prop('lantern', 67).prop('cypress', 73).prop('flowers', 62, { v: 2 });

      b.start(3);

      // Noor seeds tracing the processional route through the ruin.
      b.seedRun(4, 8);
      b.seedRun(14, 20);
      b.seedArc(33, 11, 41, 11, 5, 1); // across the cistern
      b.seedRun(43, 49);
      b.seedRun(51, 57);
      b.seed(60, 11).seed(66, 11);

      b.creature('bird', 12).creature('bird', 30).creature('bird', 56)
       .creature('butterfly', 19, 7).creature('butterfly', 54, 7)
       .creature('butterfly', 62, 9);
    }
  };
})();
