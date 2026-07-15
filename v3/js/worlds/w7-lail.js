// World Seven — Al-Lail · The Night and the Two Ways
// Twenty-one ayat, one long night ascent under the stars. This is the vertical
// grammar (THE CLIMB, see w4-qadr) stretched tall and broken into the surah's
// four thematic movements (maqati'). Between the movements the climb pauses at
// small flat REST LEDGES — night camps, a lantern and a still moment — so the
// legs feel the same chunking the campfire and the STANZA SHRINE breathe:
//   stanzas: [4, 7, 5, 5]  (the oaths · the two ways · guidance · the pleased)
//
// The soul of the world is the braid in the middle stretch. "Your striving is
// diverse" is told wordlessly three times: lush and quiet-stone arms part
// around small rock knuckles, then BOTH meet at the next gem (no wrong way, no
// dead end, no punishment). Every parting arrives at the same light.
//
// You never climb down; you only rise, from the dark valley floor to a broad
// starred summit cap where the campfire and the shrine door wait.
(function () {
  const GOL = window.GOL;

  GOL.registerWorld(7, {
    id: 17, key: 'lail', name: 'the night and the two ways',
    surahId: 92,
    stanzas: [4, 7, 5, 5], // the four movements — the stanza shrine chunks the recall
    palette: 'qadr', endPalette: 'qadrEnd', // dusk deepens to deep starred night as gems are gathered
    w: 48, h: 72,
    build(b) {
      // the whole night mountain stands on one dark valley floor
      b.ground(0, 47, 69);
      b.water(43, 47, 69); // a still pool at the foot (mercy; never a hazard)

      // ── STANZA 1 · THE OATHS (vv1–4) — the trailhead rise ──
      // gentle solid terraces climbing up-and-right out of the dark valley.
      // NOTE (the climb's hard-won lesson): block(x0,x1,y0,y1) fills y0..y1
      // ascending, so y0 is the TOP row — the walkable surface of the terrace.
      b.block(8, 12, 66, 69);  // T1 — trailhead
      b.block(14, 18, 63, 69); // T2
      b.block(20, 24, 60, 69); // T3
      b.block(26, 30, 57, 69); // T4 — the outer shoulder

      // ── REST LEDGE 1 — the first night camp ──
      b.slab(28, 35, 54); // a broad flat shelf, a lantern, a still moment

      // ── STANZA 2 · THE TWO WAYS (vv5–11) — the long middle face ──
      // Three equal two-way cells: each lush left arm and quiet-stone right
      // arm parts around a small knuckle, then meets one jump higher at the
      // next gem. The last meeting touches (but does not descend onto) REJOIN.
      b.stoneBlock(31, 32, 54, 55); // K1 — the fork mouth on rest ledge 1
      b.slab(23, 27, 53); // cell 1 · lush left arm
      b.slab(36, 40, 53); // cell 1 · quiet-stone right arm
      b.slab(28, 35, 51); // M1 — shared meeting, g6

      b.stoneBlock(34, 35, 51, 52); // K2 — the ways part again from M1
      b.slab(29, 33, 50); // cell 2 · lush left arm
      b.slab(37, 41, 50); // cell 2 · quiet-stone right arm
      b.slab(35, 40, 47); // M2 — shared meeting, g7

      b.stoneBlock(39, 40, 47, 48); // K3 — the final parting from M2
      b.slab(34, 38, 47); // cell 3 · lush left arm
      b.slab(41, 45, 47); // cell 3 · quiet-stone right arm
      b.slab(39, 41, 44); // M3 — shared meeting, g8
      // the rejoin: a wide ledge bridging over the rock where both arms meet
      b.block(24, 38, 43, 44); // REJOIN
      b.slab(28, 32, 41); // S1 — rising on toward the second camp
      b.slab(31, 35, 38); // S2

      // ── REST LEDGE 2 — the second night camp ──
      b.slab(29, 39, 35);

      // ── STANZA 3 · GUIDANCE AND WARNING (vv12–16) — the high slab face ──
      // floating slab ledges switching back, up-left then up-right.
      b.slab(26, 30, 32); // B1
      b.slab(21, 25, 29); // B2
      b.slab(24, 28, 26); // B3
      b.slab(20, 24, 23); // B4
      b.slab(23, 27, 20); // B5

      // ── REST LEDGE 3 — the last night camp before the summit ──
      b.slab(24, 37, 17); // porch reaches out past the summit's overhang

      // ── STANZA 4 · THE GIVER PLEASED (vv17–21) — the last rungs ──
      b.slab(19, 23, 14); // C1
      b.slab(14, 18, 11); // C2
      // C3 overlaps all of C2 and continues well to the right: the jump to
      // gem 19 has open sky, with no summit stone anywhere near its arc. Only
      // after landing does a thin one-way rung lead onward to the summit.
      b.slab(9, 20, 8);   // C3 — broad open-sky landing porch
      b.slab(19, 21, 6);  // C4 — forgiving crest rung, safely to the right
      // the broad flat summit cap of carved stone under full stars — nothing
      // floats above the campfire/door columns so b.surface lands on the cap
      // The solid wall begins four full tiles past C2's right edge. Earlier
      // fixes kept this needlessly close; here the clearance is unmistakable.
      b.stoneBlock(22, 34, 5, 7);

      // BEAT — 21 gems, one per ayah, gathered IN ORDER as the night deepens,
      // the climb never descends (the last meeting and rejoin share a height)
      b.gem(1, 10, 65);  // the oaths begin — the night when it covers
      b.gem(2, 16, 62);  // and the day when it shines
      b.gem(3, 22, 59);  // and the making of the male and female
      b.gem(4, 28, 56);  // "indeed your striving is diverse"
      b.gem(5, 31, 53);  // fork mouth — the giver, the mindful of Allah
      b.gem(6, 34, 50);  // M1 — both ways believe in the best
      b.gem(7, 39, 46);  // M2 — both ways are eased onward
      b.gem(8, 40, 43);  // M3 — both ways meet before the rejoin
      b.gem(9, 30, 42);  // the rejoin — the ways meet toward the light
      b.gem(10, 30, 40); // We will ease him toward hardship
      b.gem(11, 33, 37); // and his wealth will not avail him when he falls
      b.gem(12, 28, 31); // indeed, upon Us is the guidance
      b.gem(13, 23, 28); // and indeed, to Us belong the last and the first
      b.gem(14, 26, 25); // so I have warned you of a blazing fire
      b.gem(15, 22, 22); // none will enter it but the most wretched
      b.gem(16, 25, 19); // who denied and turned away
      b.gem(17, 21, 13); // and the most righteous will be spared it
      b.gem(18, 16, 10); // who gives his wealth to purify himself
      b.gem(19, 11, 7);  // owing no favor that must be repaid
      b.gem(20, 21, 5);  // seeking only the face of his Lord, Most High
      b.gem(21, 23, 4);  // "and he is going to be pleased"

      // the resting place and the shrine door, far apart on the flat summit
      b.campfire(26);
      b.door(31);

      // a secret at the mountain's foot: the bounce blossom on the far-left
      // flank, its hidden bloom straight up (6 rows) in open sky
      b.bounce(2);
      b.blossom(2, 63);

      // a welcoming leaf lift by the trailhead, rising gently out of the dark
      b.leafV(6, 68, 63);

      // noor seeds trace the whole ascent — an arc marking every leap, both
      // arms of the fork sparked, so the trail sings the long way up
      b.seedArc(10, 65, 16, 62, 3, 2); // g1 → g2
      b.seedArc(16, 62, 22, 59, 3, 2); // g2 → g3
      b.seedArc(22, 59, 28, 56, 3, 2); // g3 → g4
      b.seedArc(28, 56, 31, 53, 3, 1); // g4 → g5, the fork mouth
      // cell 1: equally sparked arms converge on M1 / g6
      b.seedArc(31, 53, 25, 52, 3, 1);
      b.seedArc(25, 52, 34, 50, 3, 1);
      b.seedArc(31, 53, 40, 52, 3, 1);
      b.seedArc(40, 52, 34, 50, 3, 1);
      // cell 2: the same parting and meeting at M2 / g7
      b.seedArc(34, 50, 31, 49, 3, 1);
      b.seedArc(31, 49, 39, 46, 3, 2);
      b.seedArc(34, 50, 39, 49, 3, 1);
      b.seedArc(39, 49, 39, 46, 3, 2);
      // cell 3: both arms rise without descent to M3 / g8, then REJOIN / g9
      b.seedArc(39, 46, 38, 46, 3, 1);
      b.seedArc(38, 46, 40, 43, 3, 1);
      b.seedArc(39, 46, 43, 46, 3, 1);
      b.seedArc(43, 46, 40, 43, 3, 1);
      b.seedArc(40, 43, 30, 42, 4, 1);
      b.seedArc(30, 42, 30, 40, 2, 1); // rejoin → S1
      b.seedArc(30, 40, 33, 37, 3, 1); // S1 → S2 → camp 2
      b.seedArc(33, 37, 28, 31, 4, 2); // camp 2 → high slab face
      b.seedArc(28, 31, 23, 28, 3, 1);
      b.seedArc(23, 28, 26, 25, 3, 1);
      b.seedArc(26, 25, 22, 22, 3, 1);
      b.seedArc(22, 22, 25, 19, 3, 1);
      b.seedArc(25, 19, 21, 13, 4, 2); // up to camp 3 → the last rungs
      b.seedArc(21, 13, 16, 10, 3, 1);
      b.seedArc(16, 10, 11, 7, 3, 1);
      b.seedArc(11, 7, 21, 5, 4, 0.5); // C3 → the open crest rung
      // a first spark by the trailhead and one by the secret flank
      b.seed(7, 68).seed(3, 67).seed(21, 3).seed(30, 3);

      // waterfalls give the climb life, pouring past the faces into the pool
      b.waterfall(44, 26); // the tall fall into the still pool
      b.waterfall(9, 40);  // the left face
      b.waterfall(33, 58); // spilling off the trailhead shoulder

      // set dressing: lanterns crown the three shared night camps (never an
      // arm); explicit rows keep stacked climb surfaces from pulling them up
      b.prop('lantern', 33, { y: 54 * GOL.TILE })
       .prop('lantern', 34, { y: 35 * GOL.TILE })
       .prop('lantern', 31, { y: 17 * GOL.TILE })
       .prop('cypress', 25).prop('olive', 13).prop('bush', 22)
       .prop('flowers', 26, { y: 53 * GOL.TILE, v: 1 })
       .prop('olive', 33, { y: 50 * GOL.TILE })
       .prop('column', 44, { y: 47 * GOL.TILE })
       .prop('column', 1).prop('flowers', 5, { v: 1 });

      // creatures: butterflies low over the trailhead, night birds higher
      b.creature('butterfly', 12, 64).creature('butterfly', 24, 58)
       .creature('bird', 20, 40).creature('bird', 30, 24)
       .creature('bird', 22, 12);

      b.start(4); // at the very bottom of the dark valley, looking up
    }
  });
})();
