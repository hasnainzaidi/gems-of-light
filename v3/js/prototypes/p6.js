// v3 Prototype 6 — Hidden World
// Hypothesis: does rewarding curiosity increase engagement? The garden looks
// complete from the path — but the rock is hollow. Push into a dark curtain
// and it softens away, revealing a chamber the world was keeping for you.
// Al-Falaq, the surah of seeking refuge in what is hidden, learned by finding
// what is hidden. The open path already holds most of what you need; the
// caves are for the ones who wonder what's behind the shadow.
(function () {
  const GOL = window.GOL;

  GOL.PROTOTYPES[6] = {
    id: 6, key: 'hidden', name: 'hidden world',
    surahId: 113,
    palette: 'qadr', endPalette: 'qadrEnd', // dusky, mysterious — secrets keep to shade
    w: 90, h: 16,
    build(b) {
      b.ground(0, 89, 13);

      // — the open path holds gems 1, 2, 4, 5; only gem 3 hides in shadow —

      // gem 1: a low flowered mound, right out in the open
      b.block(8, 10, 12, 12);
      b.gem(1, 9, 10);
      b.prop('olive', 6).prop('flowers', 11, { v: 1 }).prop('bush', 12, { v: 2 });

      // gem 2: two garden steps climb into the dusk air
      b.slab(14, 16, 11).slab(19, 21, 9);
      b.gem(2, 20, 7);
      b.prop('cypress', 17);

      // SECRET ONE — a treasure of light. A short mound the path climbs over;
      // duck into the curtain at its base and a pocket full of noor seeds
      // opens. Skippable, and pure reward.
      b.block(24, 30, 10, 12);
      b.carve(25, 29, 11, 12); // the pocket
      b.carve(24, 25, 11, 12); // its low mouth on the left
      b.seed(26, 12).seed(27, 12).seed(28, 12).seed(26, 11).seed(28, 11);
      b.occluder(24, 30, 10, 12, '#2a1f38');
      b.prop('flowers', 23, { v: 2 }).prop('tuft', 31); // the quiet tell

      // SECRET TWO — a gem the path walks straight through without knowing.
      // A tunnel bored through a hill; a curtain hangs across it so it reads
      // as solid rock. Step in and gem 3 is waiting in a raised alcove.
      b.block(34, 46, 7, 12);
      b.carve(34, 46, 11, 12); // the through-tunnel, open both ends
      b.carve(37, 42, 9, 12);  // a taller alcove in the middle
      b.gem(3, 39, 11);
      b.seed(35, 12).seed(44, 12).seed(38, 10).seed(40, 10);
      b.occluder(34, 46, 7, 12, '#241a2e');
      b.prop('lantern', 32).prop('flowers', 33, { v: 1 }); // a crack that hints

      // gem 4: an open step-up mound past the hill
      b.block(49, 51, 12, 12);
      b.gem(4, 50, 10);
      b.prop('fruit', 48, { v: 1 });

      // SECRET THREE — the deepest secret in the whole game. A tall mesa the
      // path must climb over; almost no one looks below. Its base-left mouth
      // is buried under the darkest curtain, and inside, tucked right beneath
      // the ceiling, hangs the hidden Rahma blossom.
      b.slab(52, 53, 11); // the steps the traveller takes up and over
      b.block(55, 71, 9, 12);
      b.carve(57, 69, 10, 12); // the vault
      b.carve(55, 57, 11, 12); // the hidden mouth
      b.blossom(63, 10);       // straight up under the roof, above the vault floor
      b.seed(59, 12).seed(61, 12).seed(66, 12).seed(67, 11);
      b.occluder(55, 71, 9, 12, '#151021'); // the darkest veil
      b.prop('tuft', 54);                    // the faintest tell

      // gem 5: a last open mound before the resting place
      b.block(74, 76, 12, 12);
      b.gem(5, 75, 10);
      b.prop('olive', 78);

      // the ember clearing, and the shrine door beyond it — flat and open
      b.campfire(82);
      b.door(87);
      b.prop('lantern', 80).prop('cypress', 84);

      b.start(3);

      // the noor-seed trail sings along the open path
      b.seedRun(4, 7);
      b.seedRun(31, 33);
      b.seedRun(47, 52);
      b.seedRun(72, 79);

      // gentle life, no danger
      b.creature('tortoise', 12, null, { range: 60 })
       .creature('bird', 18).creature('bird', 47).creature('bird', 77)
       .creature('butterfly', 9, 8).creature('butterfly', 50, 8)
       .creature('butterfly', 75, 8);
    }
  };
})();
