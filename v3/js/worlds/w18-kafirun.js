// World Eighteen — Al-Kafirun · Your Own Path
// "for you is your way, and for me is mine." The child walks a bright,
// lantern-lit road — the noor-lit way, gently raised on a low terrace bank.
// There is deliberately NO endPalette here: the theology is steadfastness,
// and this road remains visually constant from beginning to end.
(function () {
  const GOL = window.GOL;

  GOL.registerWorld(18, {
    id: 28, key: 'kafirun', name: 'your own path',
    surahId: 109,
    // The luminous dusk lane. NO endPalette — deliberately: steadfastness.
    // The lit road stays the lit road; it never warms into the other way.
    palette: 'bayyinah',
    w: 88, h: 16,
    density: 0.12,

    build(b) {
      // One continuous, forgiving floor. The road rises only in gentle one-row
      // banks above it — a raised terrace rhythm, never a climb.
      b.ground(0, 87, 13);

      // ── THE ROAD SETS OUT ────────────────────────────────────────────────
      // Open on the surah's own image: the noor-lit lane, a lantern lighting
      // the way ahead. No flowered mound.
      b.start(2);
      b.prop('lantern', 4).prop('tuft', 6, { v: 1 }).prop('flowers', 8, { v: 2 });

      // ── AYAH 1 (odd · the lit way affirmed) ──────────────────────────────
      // A small lantern-pair rise — a one-row bank flanked by two lanterns.
      // The first gem rests on the lit road, lifted a step above the flat.
      b.block(10, 14, 12, 12);
      b.prop('lantern', 10).prop('lantern', 14, { v: 1 });
      b.gem(1, 12, 10);

      // ── AYAH 2 (even · the other way, passed) ────────────────────────────
      // A quiet flat stretch of the lantern-lit road.
      b.prop('cypress', 26).prop('flowers', 22, { v: 1 });
      b.gem(2, 24, 11);
      b.creature('bird', 28, 12, { range: 0 }); // one roosting bird on the road

      // ── AYAH 3 (odd · the lit way affirmed) ──────────────────────────────
      b.block(35, 39, 12, 12);
      b.prop('lantern', 35).prop('lantern', 39, { v: 1 });
      b.gem(3, 37, 10);

      // ── THE SECRET · mid-road ────────────────────────────────────────────
      // A bounce pad on the open road, the hidden blossom straight overhead.
      b.bounce(44);
      b.blossom(44, 7);
      b.prop('flowers', 42, { v: 2 });

      // ── AYAH 4 (even · the other way, passed) ────────────────────────────
      // A quiet flat stretch of the lantern-lit road.
      b.prop('cypress', 52, { v: 1 }).prop('flowers', 48, { v: 1 });
      b.gem(4, 50, 11);

      // ── AYAH 5 (odd · the lit way affirmed) ──────────────────────────────
      b.block(61, 65, 12, 12);
      b.prop('lantern', 61).prop('lantern', 65, { v: 1 });
      b.gem(5, 63, 10);

      // ── AYAH 6 (even · the other way, passed) ────────────────────────────
      // The last flat stretch before the road turns homeward to the rest.
      b.prop('cypress', 72).prop('flowers', 76, { v: 2 });
      b.gem(6, 74, 11);

      // ── THE REST ─────────────────────────────────────────────────────────
      // The earned campfire and the shrine door beyond it, flat and open,
      // nothing floating in either column. The lit road simply arrives home.
      b.campfire(80);
      b.door(84);
      b.prop('cypress', 86, { v: 1 }).prop('flowers', 82, { v: 1 });

      // ── THE SINGING TRAIL ────────────────────────────────────────────────
      // A thread of noor pacing the whole lit way, arcing up onto each bank.
      b.seedRun(4, 8, 2);
      b.seedArc(9, 11, 15, 10, 5, 0.9);   // up onto rise 1
      b.seedRun(17, 23, 2);
      b.seed(24, 10);                      // over gem 2
      b.seedRun(27, 33, 2);
      b.seedArc(34, 11, 40, 10, 5, 0.9);  // up onto rise 3
      b.seed(44, 11).seed(44, 9);         // the secret pad and its blossom line
      b.seedRun(46, 49, 2);
      b.seed(50, 10);                     // over gem 4
      b.seedRun(52, 59, 2);
      b.seedArc(60, 11, 66, 10, 5, 0.9);  // up onto rise 5
      b.seedRun(68, 76, 2);                // stop before the campfire trigger

      // ── FIREFLIES · warm noor glow drifting the road ahead ───────────────
      b.creature('butterfly', 18, 7, { colA: '#FFE9A8', colB: '#FFF6DA' })
       .creature('butterfly', 46, 6, { colA: '#FFE4A0', colB: '#FFF6DA' })
       .creature('butterfly', 70, 7, { colA: '#FFEDB4', colB: '#FFF6DA' });
    }
  });
})();
