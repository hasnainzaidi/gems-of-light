// v3 Prototype 5 — Cozy Exploration
// Hypothesis: how little challenge can the game contain while remaining
// engaging? Almost no danger, friendly creatures, beautiful scenery,
// emphasis on wonder. Al-Falaq's dawn breaks a little more with every
// gem found (the restoration IS the daybreak).
(function () {
  const GOL = window.GOL;

  GOL.PROTOTYPES[5] = {
    id: 5, key: 'cozy', name: 'cozy exploration',
    surahId: 113,
    palette: 'falaq', endPalette: 'falaqEnd', // dawn driven by restoration
    w: 78, h: 16,
    build(b) {
      b.ground(0, 77, 13);

      // a flowered mound with the first gem
      b.block(10, 13, 12, 12);
      b.gem(1, 11, 10);
      b.prop('olive', 7).prop('flowers', 5).prop('bush', 14, { v: 1 });

      // two easy garden steps up to the second
      b.slab(18, 20, 11).slab(22, 24, 9);
      b.gem(2, 23, 7);
      b.seed(19, 10).seed(21, 9).seed(23, 8);

      // a shallow pond with stepping stones; the third gem on the far rise
      b.water(30, 33, 13);
      b.stone(31).stone(33);
      b.block(36, 38, 12, 12);
      b.gem(3, 37, 10);
      b.prop('cypress', 41).prop('flowers', 35, { v: 2 });
      b.creature('tortoise', 27, null, { range: 50 });

      // a bounce blossom lifts to the fourth, high in the soft air
      b.bounce(45);
      b.gem(4, 45, 8);
      b.seed(45, 11).seed(45, 9);
      b.blossom(46, 6); // the hidden Rahma blossom, straight up off the bounce

      // gentle steps to the last gem
      b.slab(53, 54, 11).slab(56, 57, 9);
      b.gem(5, 57, 7);
      b.prop('fruit', 51, { v: 1 }).prop('flowers', 59);

      // the campfire clearing, and the shrine door beyond it
      b.campfire(66);
      b.door(73);
      b.prop('lantern', 63).prop('olive', 70);

      b.start(3);
      b.seedRun(4, 8);
      b.seedArc(29, 11, 35, 11, 5, 1); // over the pond
      b.seedRun(40, 43);
      b.seedRun(48, 52);
      b.seedRun(59, 62);
      b.creature('bird', 16).creature('bird', 43).creature('bird', 61)
       .creature('butterfly', 21, 6).creature('butterfly', 47, 7)
       .creature('butterfly', 68, 9);
    }
  };
})();
