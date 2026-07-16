// World Twelve — Quraish · The Caravan of Two Seasons
// The winter journey and the summer journey, and the House that makes them
// both safe. The road runs a hundred tiles from cool to warm: a pale, still
// winter half — a braided ford, a rolling ridge under leaning cypress — then
// the caravan's great water-crossing on a bank-to-bank ferry, and out into a
// warming summer half where flowers thicken and fruit hangs on the bough. The
// palette itself is the two seasons: it lerps from `quraishWinter` (cool light)
// toward `quraysh` (golden summer dust) as the four gems are gathered. The
// road ends at the House — a plain, noble cube of warm stone that never
// changes, for the seasons move and the House does not.
(function () {
  const GOL = window.GOL;
  const T = GOL.TILE;

  GOL.registerWorld(12, {
    id: 22, key: 'quraish', name: 'the caravan of two seasons',
    surahId: 106,
    // the drift IS the two seasons — cool winter warming to summer gold
    palette: 'quraishWinter', endPalette: 'quraysh',
    w: 100, h: 16,
    density: 0.13,

    // THE HOUSE — a quiet cube of warm stone at x≈92, drawn behind the props so
    // the caravan's life gathers in front of it. A single gold band near its
    // top; a dark, sheltering doorway at its foot where the campfire rests.
    // Constant: no prog. The seasons move; the House does not.
    drawLandmark(ctx, t, P) {
      const cx = 92 * T;            // house center (world px)
      const groundY = 13 * T;       // the walkable ground surface
      const bw = 4.6 * T;           // body width
      const bh = 3.5 * T;           // body height
      const depth = 0.95 * T;       // right-side face, a little perspective
      const left = cx - bw / 2;
      const top = groundY - bh;

      ctx.save();

      // a soft footprint of shade so the cube reads as sitting ON the ground
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = P.stoneDark || '#9C9A82';
      ctx.beginPath();
      ctx.ellipse(cx + depth * 0.4, groundY + 5, bw * 0.66, T * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // right side face (depth) — behind the front plane
      ctx.fillStyle = P.stoneShade || '#BFBCA2';
      ctx.beginPath();
      ctx.moveTo(left + bw, top);
      ctx.lineTo(left + bw + depth, top - depth * 0.5);
      ctx.lineTo(left + bw + depth, groundY - depth * 0.5);
      ctx.lineTo(left + bw, groundY);
      ctx.closePath();
      ctx.fill();

      // the flat roof, catching the most light
      ctx.fillStyle = P.mist || '#E2E8DC';
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(left + depth, top - depth * 0.5);
      ctx.lineTo(left + bw + depth, top - depth * 0.5);
      ctx.lineTo(left + bw, top);
      ctx.closePath();
      ctx.fill();

      // the front face — plain warm stone
      ctx.fillStyle = P.stone || '#DFDCC8';
      ctx.fillRect(left, top, bw, bh);

      // the single gold band near the top — the House's one adornment
      const bandY = top + bh * 0.17;
      const bandH = T * 0.26;
      ctx.fillStyle = P.gold || '#E8C382';
      ctx.fillRect(left, bandY, bw, bandH);
      ctx.fillStyle = P.goldDeep || '#C9A050';
      ctx.fillRect(left, bandY + bandH, bw, Math.max(2, T * 0.05));

      // the sheltering doorway — a dark arch at the foot, where the fire waits
      const dw = 1.2 * T, dh = 1.9 * T;
      const dLeft = cx - dw / 2;
      const dTop = groundY - dh;
      ctx.fillStyle = P.stoneDark || '#9C9A82';
      ctx.beginPath();
      ctx.moveTo(dLeft, groundY);
      ctx.lineTo(dLeft, dTop + dw / 2);
      ctx.arc(cx, dTop + dw / 2, dw / 2, Math.PI, 0);
      ctx.lineTo(dLeft + dw, groundY);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    },

    build(b) {
      b.ground(0, 99, 13);

      // ========================= WINTER HALF (x 0–48) — pale, still ========
      // The road sets out cool and quiet: a lantern, a low roadside wall, a
      // little grass. Nothing hurried; winter light.
      b.prop('lantern', 3).prop('wall', 6, { n: 2 })
       .prop('flowers', 8, { v: 1 }).prop('tuft', 10, { v: 1 });
      b.start(2);

      // The braided ford — a narrow winter stream crossed on three stones,
      // the first gem hanging over the middle stone.
      b.water(12, 18, 13);
      b.stone(13).stone(15).stone(17);
      b.gem(1, 15, 11);
      b.prop('cypress', 20).prop('flowers', 22, { v: 2 });

      // The rolling ridge — a long low swell with a crown, a leaning cypress
      // pair standing over the second gem.
      b.block(29, 42, 12, 12);       // the broad base of the ridge
      b.block(33, 39, 11, 11);       // its crown, one row higher
      b.gem(2, 34, 9);
      b.prop('cypress', 33).prop('cypress', 38).prop('bush', 41, { v: 1 });
      b.creature('bird', 20);

      // ========================= THE WIDE REACH (x 48–66) ==================
      // The caravan's great crossing: a broad channel ferried bank-to-bank on
      // a raft that rides one row above the water and lands at each shore. The
      // third gem waits over mid-channel, gathered from the deck.
      b.water(48, 65, 13);
      b.raft(49, 64, 12);
      b.gem(3, 57, 11);
      b.prop('olive', 46).prop('flowers', 44, { v: 1 });

      // ========================= SUMMER HALF (x 66–99) — warmth arriving ====
      // The far bank is where the raft lands — and where the secret waits: a
      // pad right at the landing, its blossom straight overhead.
      b.bounce(67);
      b.blossom(67, 7);
      b.prop('flowers', 66, { v: 2 });

      // Fruit trees and thickening flowers — the golden season.
      b.prop('olive', 70).prop('fruit', 72, { v: 1 }).prop('flowers', 74, { v: 2 })
       .prop('olive', 76).prop('fruit', 79, { v: 2 });
      b.creature('bird', 73);

      // The caravan rest — a wall and lantern, and two tortoises walking east
      // in file: the caravan itself, ambient, plodding home. The fourth gem
      // rests at the wayside.
      b.gem(4, 80, 11);
      b.prop('lantern', 78).prop('wall', 82, { n: 3 }).prop('flowers', 83, { v: 1 });
      b.creature('tortoise', 84, null, { range: 46, dir: 1, facing: 1 });
      b.creature('tortoise', 86, null, { range: 46, dir: 1, facing: 1 });

      // ========================= THE HOUSE & THE REST =====================
      // The campfire at the House's door; the shrine door a few steps on, the
      // way onward. Both flat, open-skied, nothing floating above.
      b.prop('lantern', 87);
      b.campfire(88);
      b.door(93);
      b.prop('cypress', 96).prop('flowers', 97, { v: 2 });

      // ========================= THE SINGING TRAIL ========================
      b.seedRun(4, 10, 2);                 // the winter road out
      b.seedArc(12, 11, 18, 11, 5, 1.5);   // arc over the braided ford
      b.seedRun(20, 26, 2);                // up toward the ridge
      b.seed(30, 11).seed(34, 8).seed(41, 11); // over the ridge crown
      b.seedArc(48, 11, 65, 11, 7, 1.6);   // the whole wide reach
      b.seed(67, 11).seed(67, 9);          // the landing and its secret
      b.seedRun(70, 86, 2);                // into summer, toward the House
    }
  });
})();
