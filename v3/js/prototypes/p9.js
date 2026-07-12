// v3 Prototype 9 — Open World
// Hypothesis: what happens if all five Ayah Gems are reachable from the very
// beginning, with almost nothing gating them? The child starts in the CENTER
// of a wide meadow that opens on both sides, and every gem sits in a different
// direction with its own character — nothing forces an order. The emotion is
// freedom: my own path. (Direct counterpart to P10's fully guided trail —
// the two are meant to be compared for what order-freedom does to memory.)
(function () {
  const GOL = window.GOL;

  GOL.PROTOTYPES[9] = {
    id: 9, key: 'open', name: 'open world',
    surahId: 113,
    palette: 'ikhlas', // one calm sky over one wide-open meadow
    w: 124, h: 16,
    build(b) {
      b.ground(0, 123, 13);

      // The child begins in the middle of the meadow — the world runs off in
      // both directions, and the first choice is simply "which way?".
      b.start(62);

      // WEST, past a shallow pond on stepping stones — a gem on a lone rise.
      b.water(36, 42, 13);
      b.stone(37).stone(39).stone(41);
      b.block(26, 30, 12, 12);
      b.gem(3, 28, 10);
      b.prop('cypress', 22).prop('olive', 8).prop('flowers', 35, { v: 2 });

      // WEST-CENTER, high on a stepped mound — a small climb rewards the eye
      // that looks up.
      b.block(49, 55, 12, 12);
      b.block(50, 54, 10, 11);
      b.gem(2, 52, 8);
      b.prop('fruit', 45, { v: 1 }).prop('bush', 57, { v: 1 });

      // EAST of the start, in plain sight on a low knoll — the easy early win
      // for a child who just wants to grab something and go.
      b.block(68, 72, 12, 12);
      b.gem(1, 70, 10);
      b.prop('flowers', 66).prop('bush', 74, { v: 2 });

      // FURTHER EAST, up off a bounce blossom — the airy one.
      b.bounce(84);
      b.gem(4, 84, 8);
      b.blossom(85, 6); // the hidden Rahma blossom, straight up off the bounce
      b.prop('flowers', 80, { v: 1 });

      // FAR EAST, tucked under a lone tree — the quiet corner of the meadow.
      b.gem(5, 104, 11);
      b.prop('cypress', 104).prop('bush', 100).prop('fruit', 108, { v: 1 });

      // The clearing and the shrine door sit deliberately at the eastern edge;
      // the firefly only leads here once every gem has been found, so until
      // then the ending never pulls the child out of their own wandering.
      b.campfire(116);
      b.door(120);
      b.prop('lantern', 118).prop('palm', 111);

      // Noor seeds as INVITATIONS, not a trail — little constellations pointing
      // several ways at once so any direction the child picks pays off.
      b.seed(59, 11).seed(64, 11).seed(66, 11);   // right where they stand
      b.seedRun(44, 48, 2);                        // drawing westward
      b.seedArc(35, 11, 43, 11, 4, 1);             // a gentle arc over the pond
      b.seed(50, 9).seed(52, 7);                   // climbing the high mound
      b.seed(80, 11).seed(82, 11).seed(84, 10);    // toward the bounce
      b.seedRun(96, 102, 2);                       // out to the lone tree
      b.seed(110, 11).seed(112, 11);               // easing toward the clearing

      // A living meadow — creatures wandering every quarter of it.
      b.creature('tortoise', 46, null, { range: 40 });
      b.creature('bird', 20).creature('bird', 56).creature('bird', 90)
       .creature('butterfly', 33, 6).creature('butterfly', 70, 7)
       .creature('butterfly', 100, 8).creature('butterfly', 60, 9);
    }
  };
})();
