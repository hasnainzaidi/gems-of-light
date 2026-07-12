// v3 Prototype 7 — Storm to Sunrise
// Hypothesis: can emotional contrast improve memorability? The world opens
// dark and rain-veiled (Al-Falaq's stormy night), and every gem gathered
// thins the rain and lets the deep night-blue drift toward the fullest
// morning — the restoration IS the daybreak the surah seeks refuge in.
// The land itself rises gently toward the east, where the campfire waits
// in the first clear light.
(function () {
  const GOL = window.GOL;

  GOL.PROTOTYPES[7] = {
    id: 7, key: 'sunrise', name: 'storm to sunrise',
    surahId: 113,
    palette: 'qadrEnd', endPalette: 'fatiha', // storm night → radiant morning
    weather: 'rain', // gentle rain + grey veil, both thinning as gems return
    w: 88, h: 16,
    build(b) {
      b.ground(0, 87, 13);

      // the land climbs eastward in soft one-tile steps toward the light
      b.block(30, 44, 12, 12); // first rise
      b.block(45, 62, 11, 12); // second rise
      b.block(63, 87, 10, 12); // the eastern plateau where dawn breaks

      // gem 1 — low in the rain-soaked west, on a flowered mound
      b.block(10, 12, 12, 12);
      b.gem(1, 11, 10);
      b.prop('bush', 8, { v: 1 }).prop('flowers', 13).prop('olive', 16);

      // a sheltered pond; a tortoise waits out the rain on the near bank
      b.water(25, 29, 13);
      b.stone(26).stone(28);
      b.creature('tortoise', 22, null, { range: 40 });
      b.seedArc(24, 11, 30, 11, 5, 1); // seeds arc over the water

      // gem 2 — on the first rise, the rain already a shade lighter
      b.gem(2, 36, 10);
      b.prop('cypress', 40).prop('flowers', 33, { v: 2 });

      // gem 3 — higher on the second rise
      b.gem(3, 50, 9);
      b.prop('bush', 46);

      // a bounce blossom springs up into the clearing sky; the hidden
      // Rahma blossom rides high above it, revealed only to the curious
      b.bounce(55);
      b.blossom(55, 5);
      b.seed(55, 9).seed(55, 7);

      // gem 4 — near the crest, birds beginning to stir
      b.gem(4, 60, 9);
      b.prop('flowers', 62, { v: 1 });

      // gem 5 — the sunrise gem, up on the eastern plateau
      b.gem(5, 66, 8);
      b.prop('flowers', 68);

      // the campfire clearing and the shrine door, out in the full morning
      b.campfire(72);
      b.door(78);
      b.prop('lantern', 70).prop('olive', 81).prop('bush', 84, { v: 2 });

      b.start(4);

      // noor-seed trails threading the whole climb
      b.seedRun(4, 10);
      b.seedRun(31, 43);
      b.seedRun(46, 61);
      b.seedRun(64, 70);

      // creatures: the tortoise shelters low; birds return toward the east
      // as the sky clears; a few butterflies venture out in the new light
      b.creature('bird', 64).creature('bird', 74).creature('bird', 83)
       .creature('butterfly', 14, 6).creature('butterfly', 52, 6);
    }
  };
})();
