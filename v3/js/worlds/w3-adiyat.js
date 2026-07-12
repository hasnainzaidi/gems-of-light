// World Three — Al-'Adiyat · The Chargers
// The longest road yet, and the one that runs. Eleven ayat, eleven gems,
// walked left-to-right in surah order along a rose-gold dawn where the dust of
// hooves still hangs in the air. The land itself charges eastward: rolling
// dune-mounds that climb a little with each step, a dry riverbed to cross, an
// old caravan track between ruined walls, then a real ridge to breast before
// the ground finally quiets into the campfire clearing. Paced in breaths of
// three or four gems so eleven never drags. And an old stone waits mid-road
// that remembers An-Nas's Grand Gem — a child carrying it wakes the surah again.
(function () {
  const GOL = window.GOL;

  GOL.registerWorld(3, {
    id: 13, key: 'adiyat', name: 'the chargers',
    surahId: 100,
    palette: 'adiyat', // dust of hooves, rose-gold dawn air
    w: 156, h: 16,
    build(b) {
      b.ground(0, 155, 13);

      // BEAT ONE — three rolling dune-mounds, each a little higher than the
      // last, the runner's ground rising eastward under the first three gems
      b.block(9, 12, 12, 12);
      b.gem(1, 10, 10);
      b.prop('olive', 6).prop('flowers', 5, { v: 1 }).prop('bush', 14, { v: 1 });

      b.block(17, 20, 11, 12);
      b.gem(2, 18, 9);
      b.seed(10, 9).seed(18, 8);
      b.prop('cypress', 15).prop('flowers', 22, { v: 2 });

      b.block(25, 28, 10, 12);
      b.gem(3, 26, 8);
      b.seed(26, 7);
      b.prop('fruit', 30, { v: 1 }).prop('flowers', 24);
      b.creature('tortoise', 32, null, { range: 60 });

      // BEAT TWO — the dry riverbed. First a shallow braid on stepping stones,
      // then a wider channel a small raft ferries across, bank to bank
      b.water(36, 42, 13);
      b.stone(37).stone(39).stone(41);
      b.gem(4, 39, 11); // a gem hangs over the middle stone
      b.prop('cypress', 34).prop('flowers', 43, { v: 1 });

      b.water(48, 58, 13);
      b.raft(49, 57, 13); // ends its run at each bank — step off, step on
      b.gem(5, 53, 11);
      b.prop('olive', 46).prop('flowers', 60);
      b.creature('tortoise', 62, null, { range: 50 });

      // BEAT THREE — the old caravan track: flat going between ruined low walls,
      // lantern-lit, three gems on the roadside stones
      b.block(67, 69, 12, 12);
      b.gem(6, 68, 11);
      b.prop('lantern', 66).prop('wall', 71, { n: 3 });

      b.block(73, 73, 11, 12); // a low wall to hop
      b.block(76, 79, 11, 12);
      b.gem(7, 77, 9);
      b.seed(77, 8);
      b.prop('lantern', 74).prop('flowers', 81, { v: 2 });

      b.block(84, 87, 12, 12);
      b.gem(8, 86, 11);
      b.prop('cypress', 83).prop('wall', 89, { n: 2 });

      // MID-ROAD — a lantern-lit wayside rest
      // (a memory stone lived here once — parked pending redesign)
      b.prop('lantern', 91).prop('lantern', 93).prop('flowers', 92, { v: 1 });
      b.seed(92, 11).seed(92, 10);
      b.creature('tortoise', 95, null, { range: 40 });

      // BEAT FOUR — the ridge climb: two slabs up to a high crest to breast,
      // the summit of the dawn charge, then the land falls away east
      b.slab(99, 101, 11);
      b.gem(9, 100, 9);
      b.seed(100, 8);
      b.prop('bush', 97, { v: 2 });

      b.slab(104, 106, 9);
      b.gem(10, 105, 7);
      b.seed(105, 6);

      b.block(109, 114, 8, 12); // the crest — cross the top, then descend
      b.prop('cypress', 112).prop('flowers', 110, { v: 2 });

      // a bounce blossom lifts to the eleventh, high in the settling dust
      b.bounce(121);
      b.gem(11, 121, 8);
      b.seed(121, 11).seed(121, 9);
      b.blossom(121, 6); // the hidden Rahma blossom, straight up off the bounce
      b.prop('olive', 118).prop('flowers', 123);

      // the campfire clearing, and the shrine door beyond it — calm and sparse
      b.campfire(138);
      b.door(146);
      b.prop('lantern', 135).prop('cypress', 142).prop('lantern', 144);

      b.start(4);
      b.seedRun(5, 8);
      b.seedRun(30, 34);
      b.seedArc(36, 11, 42, 11, 5, 1); // over the stepping-stone braid
      b.seedRun(44, 46);
      b.seedArc(48, 11, 58, 11, 5, 1); // over the ferry channel
      b.seedRun(60, 64);
      b.seedRun(80, 90);
      b.seedRun(115, 119);
      b.seedRun(124, 132);
      b.creature('bird', 13).creature('bird', 33).creature('bird', 64)
       .creature('bird', 90).creature('bird', 108).creature('bird', 128)
       .creature('butterfly', 21, 6).creature('butterfly', 52, 7)
       .creature('butterfly', 85, 6).creature('butterfly', 126, 8);
    }
  });
})();
