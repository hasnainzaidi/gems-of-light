// Guiding-Light Prototype · P15 — The Daybreak Through the Dark
//
// Al-Falaq is the daybreak — refuge sought in the Lord of the dawn "from the
// evil of the darkness when it settles" (min sharri ghāsiqin idhā waqab). This
// prototype makes that image playable: the same gentle Falaq garden, walked in
// the settled night. Along the way sit closed BOXES OF LIGHT; reaching one
// opens it and frees an orb of noor that flies ahead and kindles the seed
// trail into a bright, slowly-expiring lit path toward the next ayah. The
// child follows the light. Nothing gates and nothing fails: the child's own
// aura always lights the ground and Noor the firefly still points the way —
// the orb only makes the way shine. And as each ayah is gathered the dawn
// itself breaks (falaqNoor → falaqEnd), lifting the dark until the final gem
// is found in full daybreak. Occlusion reframed from hiding to guiding.
//
// Lives in the debug lab (?proto=15&debug=1), on its own save (labSaveKey), so
// it never touches World One's real Al-Falaq Grand Gem. Awaiting child
// playtest before any of this graduates into a shipping world.
(function () {
  const GOL = window.GOL;

  GOL.PROTOTYPES[15] = {
    id: 115, key: 'guiding-light', name: 'the guiding light',
    surahId: 113,
    palette: 'falaqNoor', endPalette: 'falaqEnd', // night lifting to daybreak
    night: 0.82, // darkness the guiding light and the dawn both push back
    labSaveKey: 'falaq-noor',
    w: 82, h: 16,
    build(b) {
      b.ground(0, 81, 13);
      b.start(3);

      // the first box of light waits just ahead — opening it lights the way in
      b.lightbox(9);
      b.prop('cypress', 6).prop('olive', 12, { v: 1 });

      // a flowered mound with the first gem
      b.block(14, 17, 12, 12);
      b.gem(1, 15, 10);
      b.prop('flowers', 13);

      // a second box, then two garden steps up to the second gem
      b.lightbox(22);
      b.slab(26, 28, 11).slab(31, 33, 9);
      b.gem(2, 32, 7);

      // a third box before the shallow pond (water is safe — a rescue, never a
      // fall); stepping stones cross it to the third gem on the far rise
      b.lightbox(38);
      b.prop('cypress', 40);
      b.water(42, 45, 13);
      b.stone(43).stone(45);
      b.block(48, 50, 12, 12);
      b.gem(3, 49, 10);

      // a bounce lifts to the fourth, high in the dark air; the hidden Rahma
      // blossom waits straight above the pad for a curious climber
      b.bounce(54);
      b.gem(4, 54, 8);
      b.blossom(55, 6);

      // gentle steps to the last gem, gathered as the daybreak fills in
      b.slab(58, 59, 11).slab(62, 63, 9);
      b.gem(5, 63, 7);
      b.prop('olive', 60, { v: 2 });

      // the last box lights the walk to the earned campfire, and the door beyond
      b.lightbox(68);
      b.prop('lantern', 70);
      b.campfire(73);
      b.door(79);

      // the singing seed trail — the very path the orbs kindle through the dark
      b.seedRun(4, 8);
      b.seed(11, 11).seed(13, 11);
      b.seedRun(18, 21);
      b.seed(27, 10).seed(30, 8).seed(33, 8);
      b.seedRun(36, 40);
      b.seedArc(41, 11, 46, 11, 6, 1.4); // over the pond
      b.seedRun(50, 52);
      b.seed(54, 11).seed(54, 9);
      b.seed(58, 10).seed(62, 8);
      b.seedRun(64, 71);

      // a little ambient night-life, calm and unhurried
      b.creature('tortoise', 24, null, { range: 46 });
      b.creature('bird', 47).creature('bird', 66);
    }
  };
})();
