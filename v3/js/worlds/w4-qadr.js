// World Four — Al-Qadr · The Blessed Night
// The first climb of the journey, and the one where the sky itself changes.
// Five ayat, five gems, gathered IN ORDER while ASCENDING a night mountain —
// so the surah is built by height, never by wandering. This is the vertical
// grammar (see prototype p2): one base floor, a single readable switchback
// rising up-and-right on solid terraces then up-and-left on slab ledges, a
// broad flat summit cap. You never go back down; you only rise.
//
// The soul of the world is the palette drift. 'qadr' is dusk; 'qadrEnd' is the
// deep starred night. Each gem gathered turns the sky one shade further, so as
// the child climbs the blessed night arrives around them — "Laylat al-Qadr...
// peace until the rising of dawn." The summit sits under full stars, where the
// campfire and the shrine door wait.
//
// Paced in five rungs: two on the lower solid face (gems 1–2), the shoulder
// (gem 3), the high slab buttress (gem 4), the peak in sight (gem 5).
(function () {
  const GOL = window.GOL;

  GOL.registerWorld(4, {
    id: 14, key: 'qadr', name: 'the blessed night',
    surahId: 97,
    palette: 'qadr', endPalette: 'qadrEnd', // dusk deepens to starred night as gems are gathered
    w: 44, h: 44,
    build(b) {
      // the whole world stands on one base floor; the mountain grows UP from it
      b.ground(0, 43, 41);
      b.water(38, 41, 41); // a still pool at the foot of the falls (never a hazard)

      // ── the lower face: a solid switchback stair climbing up-and-right ──
      // NOTE (p2's hard-won lesson): block(x0,x1,y0,y1) fills y0..y1 ascending,
      // so y0 is the TOP row — the walkable surface of each terrace.
      b.block(8, 11, 38, 41);  // step 1 — the trailhead rise
      b.block(12, 15, 35, 41); // step 2
      b.block(16, 19, 32, 41); // step 3
      b.block(20, 23, 29, 41); // step 4
      b.block(24, 27, 26, 41); // step 5 — the outer shoulder of the mountain

      // ── the upper face: floating slab ledges switch back up-and-left ──
      b.slab(22, 24, 23); // ledge 6
      b.slab(19, 21, 20); // ledge 7
      b.slab(16, 18, 17); // ledge 8
      b.slab(13, 15, 14); // ledge 9
      b.slab(9, 11, 11);  // ledge 10 — the high left buttress, past the falls
      b.slab(11, 13, 8);  // ledge 11 — the last rung, the peak in sight

      // ── the summit plateau: a broad flat cap of carved stone under full
      // stars, nothing floating above it so b.surface lands right on the cap ──
      b.stoneBlock(14, 26, 5, 7);

      // BEAT — five gems, one per ayah, each a rung higher than the last, so
      // the surah is gathered in order as the night deepens overhead
      b.gem(1, 9, 37);   // just off the first step (ayah 1 — the sending down)
      b.gem(2, 17, 31);  // step 3, mid the lower face
      b.gem(3, 26, 25);  // the shoulder — better than a thousand months
      b.gem(4, 17, 16);  // high on the slab face — the angels descend
      b.gem(5, 12, 7);   // the buttress, the peak in sight — peace till dawn

      // the resting place and the shrine door, far apart on the flat summit
      b.campfire(17);
      b.door(23);

      // a secret at the mountain's foot: climb, then drop down the far side to
      // the bounce blossom; the hidden Rahma bloom waits straight up (6 rows)
      b.bounce(34);
      b.blossom(34, 35);

      // a welcoming leaf lift by the trailhead, rising gently near the start
      b.leafV(6, 35, 40);

      // noor seeds trace the ascent — arcs leaping between the rungs, sparks
      // marking each landing (≥18 so the trail sings the whole way up)
      b.seedArc(5, 40, 10, 37, 4, 2);  // floor → step 1
      b.seedArc(13, 34, 16, 31, 3, 2); // step 2 → step 3
      b.seedArc(21, 28, 25, 25, 3, 2); // step 4 → the shoulder
      b.seedArc(22, 22, 19, 19, 3, 1); // the switchback turn, ledge 6 → 7
      b.seedArc(15, 16, 13, 13, 3, 1); // ledge 8 → 9
      b.seed(7, 39);  // a first spark by the trailhead
      b.seed(10, 10); // on the high left buttress
      b.seed(12, 6);  // the last rung
      b.seed(16, 4);  // cresting the summit under stars

      // waterfalls give the climb life, pouring past the ledges into the pool
      b.waterfall(7, 24);  // the left face, past the high buttress
      b.waterfall(29, 10); // spilling off the shoulder cliff
      b.waterfall(39, 8);  // the tall fall into the still pool

      // set dressing: lantern and cypress crown the starlit summit, an olive
      // clings to a high ledge, a fallen column and flowers rest at the base
      b.prop('lantern', 16).prop('cypress', 25).prop('olive', 9)
       .prop('bush', 13).prop('lantern', 4).prop('column', 30)
       .prop('flowers', 5, { v: 1 }).prop('flowers', 33);

      // creatures: butterflies low, birds higher, and the summit kept quiet
      b.creature('butterfly', 12, 36).creature('butterfly', 24, 27)
       .creature('bird', 18, 14).creature('bird', 9, 9)
       .creature('bird', 8, 6);

      b.start(4); // at the very bottom, looking up into the gathering night
    }
  });
})();
