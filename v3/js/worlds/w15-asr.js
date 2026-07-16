// World Fifteen — Al-'Asr · Golden Hour
// Three ayat, three gems, and the shortest, most cinematic walk of the wave:
// about forty seconds of level road that ends on a sunset headland. The soul
// is the light. 'asr' is a plain, bright afternoon; 'qariah' is the deep gold
// of the hour before dusk — and the sky drifts from one to the other GEM BY
// GEM (the engine lerps palette → endPalette as ayat are gathered), never by
// any clock. There is no timer in this world and there must not be: time here
// is beauty, not threat, and decline is reframed as glory. By the third gem
// the whole world is bathed in golden hour, and the earned campfire burns on
// a small promontory that looks straight into the setting sun.
//
// One landmark carries the surah wordlessly: the sundial at mid-world says
// "time lives here" without a syllable of text. The path is guided and calm —
// a long level opening, one broad rise to the sundial terrace, a slow descent
// facing the light, then the headland. Resist adding beats: the drift and the
// headland do the work.
(function () {
  const GOL = window.GOL;

  GOL.registerWorld(15, {
    id: 25, key: 'asr', name: 'golden hour',
    surahId: 103,
    palette: 'asr', endPalette: 'qariah', // bright afternoon deepens to golden hour, gem by gem
    w: 56, h: 16,
    density: 0.12,
    build(b) {
      // One continuous, forgiving floor — every rise is only a soft step above it.
      b.ground(0, 55, 13);

      // THE SECRET BEHIND YOU — a bounce pad west of the start, its hidden
      // blossom straight overhead with open sky. The treasure at your back:
      // time you can still turn around and catch.
      b.bounce(6);
      b.blossom(6, 7);

      // AYAH 1 — the long level opening, plain afternoon light. The first gem
      // rests low between two olives; a quiet beginning, no jump asked.
      b.gem(1, 12, 11);
      b.prop('olive', 10).prop('olive', 14, { v: 1 })
       .prop('flowers', 8, { v: 1 });

      // AYAH 2 — one broad rise of two slab steps lifts the road onto the
      // sundial terrace. The sundial is the mid-world landmark ('Asr, the
      // afternoon prayer — time lives here), framed by two calm cypresses.
      b.slab(16, 18, 12).slab(19, 21, 11);
      b.block(22, 34, 11, 12); // the broad flat terrace the sundial stands on
      b.prop('cypress', 24).prop('sundial', 26).prop('cypress', 30, { v: 1 });
      b.gem(2, 28, 9);
      b.prop('flowers', 32, { v: 2 });

      // AYAH 3 — a slow descent that looks into the sun. The road steps down
      // off the terrace and runs west-facing toward the light; the third gem
      // waits on it, backlit, as the gold arrives with its gathering.
      b.slab(35, 37, 12);
      b.gem(3, 42, 11);
      b.prop('olive', 39, { v: 2 });

      // THE SUNSET HEADLAND — the level ends on a small flat promontory, a
      // two-row rise with a broad top. The endPalette's deep golds paint the
      // sunset; the earned campfire burns here between two cypresses, with
      // flowers and a lantern so the clearing reads as a beloved place, and
      // the shrine door stands clear of it at the headland's far edge. Nothing
      // floats in the columns above campfire or door.
      b.slab(44, 45, 12); // the gentle step up onto the headland
      b.block(46, 54, 11, 12);
      b.campfire(48);
      b.door(52);
      b.prop('cypress', 46).prop('cypress', 50)
       .prop('flowers', 47, { v: 1 }).prop('flowers', 49, { v: 2 })
       .prop('flowers', 53).prop('lantern', 51);

      b.start(9); // between the secret pad and the first gem, facing the light

      // A singing thread of noor traces the one road: a low pulse along the
      // level opening, an arc up onto the sundial terrace, across the crest,
      // an arc down the west-facing descent, then up onto the headland.
      b.seedArc(4, 11, 15, 11, 6, 0);   // the opening level (and a spark by the secret)
      b.seedArc(16, 11, 22, 9, 5, 1.5); // rising to the sundial terrace
      b.seed(26, 9).seed(28, 9).seed(31, 9); // across the crest, past the sundial
      b.seedArc(34, 10, 42, 11, 6, 0); // the slow descent into the light
      b.seedArc(43, 11, 48, 9, 5, 1.5); // up onto the sunset headland

      // Creatures: butterflies only, warm golden-hour tones — no tortoise,
      // no bird; the stillness is part of the beauty.
      b.creature('butterfly', 13, 7, { colA: '#F3C671', colB: '#F7EFDA' })
       .creature('butterfly', 29, 7, { colA: '#E8896B', colB: '#F7EFDA' })
       .creature('butterfly', 44, 7, { colA: '#F0C878', colB: '#F7EFDA' });
    }
  });
})();
