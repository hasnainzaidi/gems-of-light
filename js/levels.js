// Gems of Light — levels.js
// Seventeen hand-designed gardens across three worlds, described as small recipes.
// World One: The Garden (morning) · World Two: The Orchard (afternoon) ·
// World Three: The Courtyard (late light, architecture, the first revelation).
// Tile codes: 0 air, 1 ground/stone, 2 one-way slab, 3 water, 4 carved stone.
// The grid is 16 rows tall; the main walking surface sits on top of row 13.
(function () {
  const GOL = window.GOL;
  const TILE = GOL.TILE;

  function makeBuilder(w, h) {
    const tiles = new Uint8Array(w * h);
    const b = {
      w, h, tiles,
      gems: [], props: [], creatures: [], waterfalls: [],
      seeds: [], pads: [], moverDefs: [], blossomPos: null,
      startPos: null, archPos: null,
      set(x, y, v) { if (x >= 0 && x < w && y >= 0 && y < h) tiles[y * w + x] = v; },
      get(x, y) { return x < 0 || x >= w || y < 0 || y >= h ? 0 : tiles[y * w + x]; },
      // solid earth from row `top` to the bottom
      ground(x0, x1, top) { for (let x = x0; x <= x1; x++) for (let y = top; y < h; y++) this.set(x, y, 1); return b; },
      // carve air (hollows, caves)
      carve(x0, x1, y0, y1) { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) this.set(x, y, 0); return b; },
      // water pool from row `top` down
      water(x0, x1, top) {
        top = top == null ? 13 : top;
        for (let x = x0; x <= x1; x++) for (let y = top; y < h; y++) this.set(x, y, 3);
        return b;
      },
      slab(x0, x1, row) { for (let x = x0; x <= x1; x++) this.set(x, row, 2); return b; },
      block(x0, x1, y0, y1) { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) this.set(x, y, 1); return b; },
      // carved cream stone (garden houses, hollow brows, towers)
      stoneBlock(x0, x1, y0, y1) { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) this.set(x, y, 4); return b; },
      // a stepping stone sitting at water level
      stone(x, row) {
        row = row == null ? 13 : row;
        this.set(x, row, 2);
        this.props.push({ type: 'stepStone', x: (x + 0.5) * TILE, y: row * TILE + 10, v: x % 2 });
        return b;
      },
      gem(ayah, x, row) { this.gems.push({ ayah, x: (x + 0.5) * TILE, y: (row + 0.5) * TILE }); return b; },
      prop(type, x, opts) {
        const p = Object.assign({ type, x: (x + 0.5) * TILE, y: this.surface(x) * TILE, v: 0 }, opts || {});
        this.props.push(p); return b;
      },
      creature(type, x, row, opts) {
        const y = row != null ? (row + 1) * TILE : this.surface(x) * TILE;
        this.creatures.push(Object.assign({
          type, x: (x + 0.5) * TILE, y, homeX: (x + 0.5) * TILE, homeY: y,
          phase: Math.random() * 7, facing: 1, dir: 1, range: 60, t: 0
        }, opts || {}));
        return b;
      },
      start(x) { this.startPos = { x: (x + 0.5) * TILE, y: this.surface(x) * TILE - 0.01 }; return b; },
      arch(x) { this.archPos = { x: (x + 0.5) * TILE, y: this.surface(x) * TILE }; return b; },
      // --- journey ingredients ------------------------------------------
      // a single noor seed hanging in the air
      seed(x, row) { this.seeds.push({ x: (x + 0.5) * TILE, y: (row + 0.5) * TILE }); return b; },
      // a run of seeds hovering just above the walking surface
      seedRun(x0, x1, every) {
        for (let x = x0; x <= x1; x += every || 2) {
          const s = this.surface(x);
          if (s < h) this.seeds.push({ x: (x + 0.5) * TILE, y: (s - 1.4) * TILE });
        }
        return b;
      },
      // an arc of seeds between two points (lift = how high the arc swells)
      seedArc(x0, row0, x1, row1, n, lift) {
        for (let i = 0; i < n; i++) {
          const k = n === 1 ? 0.5 : i / (n - 1);
          const x = x0 + (x1 - x0) * k;
          const row = row0 + (row1 - row0) * k - Math.sin(Math.PI * k) * (lift == null ? 2.1 : lift);
          this.seeds.push({ x: (x + 0.5) * TILE, y: (row + 0.5) * TILE });
        }
        return b;
      },
      // a springy bounce blossom on the surface at x
      bounce(x) {
        const s = this.surface(x);
        this.pads.push({ x: (x + 0.5) * TILE, y: s * TILE, tx: x, ty: s });
        return b;
      },
      // the level's one hidden Rahma blossom
      blossom(x, row) { this.blossomPos = { x: (x + 0.5) * TILE, y: (row + 0.5) * TILE, tx: x, ty: row }; return b; },
      // a drifting leaf platform, floating side to side
      leafH(x0, x1, row, phase) {
        this.moverDefs.push({ kind: 'h', x0: (x0 + 0.5) * TILE, x1: (x1 + 0.5) * TILE, y: (row + 0.4) * TILE, hw: 46, speed: 0.32, phase: phase || 0 });
        return b;
      },
      // a drifting leaf platform, bobbing up and down
      leafV(x, row0, row1, phase) {
        this.moverDefs.push({ kind: 'v', x: (x + 0.5) * TILE, y0: (row0 + 0.4) * TILE, y1: (row1 + 0.4) * TILE, hw: 46, speed: 0.3, phase: phase || 0 });
        return b;
      },
      waterfall(x, rowTop) {
        // falls from rowTop until it meets something
        let y1 = rowTop;
        while (y1 < h && this.get(x, y1) === 0) y1++;
        this.waterfalls.push({ x: (x + 0.5) * TILE, y: rowTop * TILE, h: (y1 - rowTop) * TILE });
        return b;
      },
      // first standable row (top of ground/slab/stone) in a column
      surface(x) {
        for (let y = 0; y < h; y++) { const t = this.get(x, y); if (t === 1 || t === 2 || t === 4) return y; }
        return h;
      }
    };
    return b;
  }

  // Sprinkle grass tufts, flowers and the occasional butterfly on walkable tops.
  function decorate(b, seed, density) {
    const r = GOL.rng(seed);
    for (let x = 1; x < b.w - 1; x++) {
      const s = b.surface(x);
      if (s >= b.h || b.get(x, s) !== 1) continue;
      if (b.get(x, s - 1) !== 0) continue;
      if (r() < (density || 0.16)) {
        const roll = r();
        if (roll < 0.45) b.props.push({ type: 'tuft', x: (x + 0.5) * TILE, y: s * TILE, v: Math.floor(r() * 3) });
        else if (roll < 0.75) b.props.push({ type: 'flowers', x: (x + 0.5) * TILE, y: s * TILE, v: Math.floor(r() * 3) });
        else if (roll < 0.9) b.props.push({ type: 'bush', x: (x + 0.5) * TILE, y: s * TILE, v: Math.floor(r() * 3) });
        else b.creatures.push({ type: 'butterfly', x: (x + 0.5) * TILE, y: (s - 2.2) * TILE, homeX: (x + 0.5) * TILE, homeY: (s - 2.2) * TILE, phase: r() * 7, t: 0, colA: ['#F0C878', '#E8896B', '#C9A8E0'][Math.floor(r() * 3)], colB: '#F7EFDA' });
      }
    }
  }

  const defs = [
    // ---------------------------------------------------- 1 · Al-Kawthar ---
    {
      surahId: 108, key: 'kawthar', title: 'The Spring',
      subtitle: 'a river of endless good',
      w: 66, h: 16,
      build(b) {
        b.ground(0, 65, 13);
        b.block(9, 11, 12, 12);              // flowered mound
        b.block(16, 22, 12, 12);             // gentle rise
        b.gem(1, 10, 10);
        b.slab(20, 21, 11).slab(23, 25, 9);
        b.gem(2, 24, 7);
        b.water(30, 35, 13);                 // the stream
        b.stone(31).stone(33);
        b.water(50, 55, 13);                 // the spring pool
        b.stone(51).stone(53).stone(55);
        b.slab(52, 54, 6);                   // old aqueduct overhead
        b.waterfall(53, 7);
        b.gem(3, 53, 11);                    // behind the falling water
        b.start(3);
        b.arch(61);
        // the journey: a first bounce blossom, and seeds tracing the way
        b.bounce(14);
        b.seed(14, 11).seed(14, 9);
        b.blossom(14, 7);                    // high above the bounce — the first secret
        b.seedRun(4, 8);
        b.seedArc(8, 11, 12, 11, 4, 1.6);    // over the flowered mound
        b.seedRun(17, 22);
        b.seed(20, 10).seed(23, 8).seed(25, 8);
        b.seedArc(29, 11, 36, 11, 5, 1);     // over the stream
        b.seedRun(38, 47);
        b.seedArc(49, 11, 56, 11, 5, 1);     // over the spring pool
        b.seedRun(57, 59);
        b.prop('olive', 19).prop('fountain', 27).prop('bush', 14)
         .prop('flowers', 6).prop('flowers', 37, { v: 1 }).prop('cypress', 46)
         .prop('flowers', 47, { v: 2 }).prop('lantern', 58).prop('flowers', 63, { v: 1 });
        b.creature('bird', 40).creature('tortoise', 43, null, { range: 70 })
         .creature('bird', 12).creature('butterfly', 21, 6).creature('butterfly', 44, 8);
      }
    },
    // ----------------------------------------------------- 2 · Al-Ikhlas ---
    {
      surahId: 112, key: 'ikhlas', title: 'The Meadow',
      subtitle: 'one sky over one meadow',
      w: 78, h: 16,
      build(b) {
        b.ground(0, 77, 13);
        b.block(12, 16, 12, 12);             // rolling mounds
        b.block(30, 36, 12, 12);
        b.block(52, 57, 12, 12);
        b.carve(42, 45, 13, 13);             // the hollow — a soft dip
        b.gem(1, 8, 11);
        b.gem(2, 33, 10);
        b.slab(59, 60, 11).slab(62, 64, 9);
        b.gem(3, 63, 7);
        b.gem(4, 43, 13);                    // tucked in the hollow
        b.start(3);
        b.arch(73);
        // the journey: a bounce from the middle mound guards the secret
        b.bounce(33);                        // right under gem 2 — bounce to reach it
        b.seed(33, 8);
        b.blossom(33, 6);
        b.seedRun(4, 10);
        b.seedArc(11, 11, 17, 11, 4, 1.7);   // over the first mound
        b.seedRun(20, 28);
        b.seed(42, 12).seed(43, 12).seed(44, 12).seed(45, 12); // the hollow glows
        b.seedRun(47, 51);
        b.seedRun(53, 56);
        b.seed(59, 10).seed(60, 10).seed(62, 8).seed(64, 8);   // up to the high gem
        b.seedRun(66, 71);
        b.prop('olive', 24).prop('wall', 19, { n: 2 }).prop('wall', 49, { n: 3 })
         .prop('cypress', 38).prop('cypress', 68).prop('bush', 44, { v: 2 })
         .prop('flowers', 6, { v: 1 }).prop('flowers', 15).prop('flowers', 34, { v: 2 })
         .prop('flowers', 55).prop('lantern', 70);
        b.creature('bird', 27).creature('bird', 60).creature('tortoise', 47, null, { range: 90 })
         .creature('butterfly', 14, 8).creature('butterfly', 33, 7).creature('butterfly', 65, 9);
      }
    },
    // ------------------------------------------------------- 3 · Al-'Asr ---
    {
      surahId: 103, key: 'asr', title: 'The Old Olive',
      subtitle: 'time passes through the garden',
      w: 84, h: 16,
      build(b) {
        b.ground(0, 83, 13);
        b.block(34, 36, 12, 12);             // stepped hill
        b.block(37, 49, 11, 12);
        b.block(50, 52, 12, 12);
        b.gem(1, 14, 11);
        b.slab(39, 40, 8).slab(43, 45, 6);   // the olive's great branches
        b.gem(2, 44, 4);                     // atop the old tree
        b.water(58, 63, 13);
        b.stone(59).stone(61).stone(63);
        b.slab(69, 70, 11);
        b.gem(3, 70, 9);
        b.start(3);
        b.arch(78);
        // the journey: a drifting leaf ferries you across the water,
        // and a bounce near the sundial hides the secret
        b.leafH(57, 64, 11, 2.1);
        b.bounce(24);
        b.seed(24, 11).seed(24, 9);
        b.blossom(24, 7);
        b.seedRun(5, 12);
        b.seedRun(16, 22);
        b.seedRun(28, 33);
        b.seedRun(37, 49);                   // along the hilltop
        b.seed(39, 7).seed(40, 7).seed(43, 5).seed(45, 5); // the olive's branches
        b.seed(58, 10).seed(60, 10).seed(62, 10);          // riding the leaf
        b.seedRun(66, 68);
        b.seed(69, 10).seed(70, 10);
        b.seedRun(73, 77);
        b.prop('sundial', 20).prop('olive', 43).prop('wall', 8, { n: 2 })
         .prop('cypress', 26).prop('cypress', 55).prop('bush', 30)
         .prop('flowers', 11, { v: 2 }).prop('flowers', 47).prop('flowers', 66, { v: 1 })
         .prop('lantern', 74).prop('bush', 72, { v: 1 });
        b.creature('bird', 17).creature('bird', 48).creature('tortoise', 66, null, { range: 60 })
         .creature('butterfly', 21, 8).creature('butterfly', 44, 2).creature('bird', 71);
      }
    },
    // ------------------------------------------------------ 4 · Al-Falaq ---
    {
      surahId: 113, key: 'falaq', title: 'Daybreak Hollow',
      subtitle: 'walking out of the dark into the light',
      w: 92, h: 16,
      build(b) {
        b.ground(0, 91, 13);
        b.gem(1, 8, 11);
        b.block(24, 26, 12, 12);             // climb before the hollow
        b.slab(28, 30, 10);
        b.gem(2, 29, 8);
        // the hollow: a low stone brow you walk beneath
        b.stoneBlock(38, 52, 3, 8);
        b.stoneBlock(38, 40, 9, 10);         // left jamb, leaves a doorway
        b.stoneBlock(50, 52, 9, 10);         // right jamb
        b.gem(3, 45, 11);                    // glowing in the dim
        b.prop('lantern', 42).prop('lantern', 48);
        b.water(58, 63, 13);
        b.stone(59).stone(61).stone(63);
        b.slab(60, 62, 6);
        b.waterfall(61, 7);
        b.gem(4, 61, 11);                    // behind the veil of water
        b.slab(74, 75, 11).slab(77, 79, 9).slab(81, 82, 7);
        b.gem(5, 81, 5);                     // high in the morning air
        b.start(3);
        b.arch(87);
        // the journey: a bounce before the hollow lifts you into the last of night
        b.bounce(34);
        b.seed(34, 11).seed(34, 9);
        b.blossom(34, 7);
        b.seedRun(4, 12);
        b.seedRun(15, 21);
        b.seed(24, 11).seed(25, 11).seed(28, 9).seed(30, 9);
        b.seed(41, 12).seed(43, 12).seed(47, 12).seed(49, 12); // lantern-lit trail
        b.seedArc(56, 11, 65, 11, 6, 1);     // over the water
        b.seed(74, 10).seed(75, 10).seed(77, 8).seed(79, 8).seed(81, 6).seed(82, 6);
        b.seedRun(84, 86);
        b.prop('cypress', 15).prop('olive', 33).prop('bush', 21, { v: 1 })
         .prop('flowers', 11).prop('flowers', 55, { v: 1 }).prop('flowers', 70, { v: 2 })
         .prop('wall', 67, { n: 2 }).prop('lantern', 84).prop('bush', 69, { v: 2 });
        b.creature('bird', 30).creature('bird', 71).creature('tortoise', 18, null, { range: 50 })
         .creature('butterfly', 33, 7).creature('butterfly', 76, 6);
      }
    },
    // -------------------------------------------------------- 5 · An-Nas ---
    {
      surahId: 114, key: 'nas', title: 'The Village Garden',
      subtitle: 'where everyone gathers',
      w: 96, h: 16,
      build(b) {
        b.ground(0, 95, 13);
        b.gem(1, 10, 11);
        // first garden house
        b.stoneBlock(18, 18, 12, 12);
        b.stoneBlock(20, 26, 11, 12);
        b.slab(19, 27, 10);
        b.gem(2, 23, 8);
        // shared courtyard
        b.prop('fountain', 33);
        // second, taller house
        b.stoneBlock(38, 38, 12, 12);
        b.stoneBlock(39, 39, 11, 12);
        b.stoneBlock(41, 47, 10, 12);
        b.slab(40, 48, 9);
        b.gem(3, 44, 7);
        b.gem(4, 55, 11);
        // the little tower
        b.stoneBlock(66, 66, 12, 12);
        b.stoneBlock(67, 67, 11, 12);
        b.stoneBlock(68, 68, 10, 12);
        b.stoneBlock(69, 69, 9, 12);
        b.stoneBlock(70, 71, 8, 12);
        b.gem(5, 70, 6);
        b.gem(6, 82, 11);
        b.start(3);
        b.arch(90);
        // the journey: a bobbing leaf beside the tower, a bounce with a secret
        b.leafV(62, 9, 12, 1.2);
        b.bounce(58);
        b.seed(58, 11).seed(58, 9);
        b.blossom(58, 7);
        b.seedRun(4, 9);
        b.seed(19, 9).seed(21, 9).seed(23, 9).seed(25, 9).seed(27, 9); // along house one
        b.seed(31, 11).seed(35, 11);         // around the fountain
        b.seed(40, 8).seed(42, 8).seed(44, 8).seed(46, 8).seed(48, 8); // house two rooftop
        b.seedRun(51, 56);
        b.seed(62, 8);                       // riding the leaf up
        b.seed(66, 11).seed(67, 10).seed(68, 9).seed(69, 8).seed(70, 7); // tower steps
        b.seedRun(74, 81);
        b.seedRun(84, 88);
        b.prop('wall', 14, { n: 2 }).prop('olive', 31).prop('cypress', 51)
         .prop('flowers', 7, { v: 1 }).prop('flowers', 29, { v: 2 }).prop('flowers', 36)
         .prop('flowers', 57).prop('flowers', 83, { v: 2 }).prop('bush', 61, { v: 1 })
         .prop('lantern', 63).prop('lantern', 86).prop('bush', 76).prop('wall', 79, { n: 3 });
        // a village of birds
        b.creature('bird', 16).creature('bird', 29).creature('bird', 35)
         .creature('bird', 53).creature('bird', 74).creature('bird', 84)
         .creature('tortoise', 59, null, { range: 80 })
         .creature('butterfly', 23, 6).creature('butterfly', 44, 5).creature('butterfly', 70, 4);
      }
    },
    // ------------------------------------------------------ 6 · Al-Fatiha --
    {
      surahId: 1, key: 'fatiha', title: 'The Garden Gate',
      subtitle: 'every path gathers into one',
      w: 110, h: 16,
      build(b) {
        b.ground(0, 109, 13);
        b.gem(1, 9, 11);
        // stream with stones
        b.water(16, 20, 13);
        b.stone(17).stone(19);
        // flowered mound
        b.block(26, 29, 12, 12);
        b.gem(2, 27, 10);
        // the climb
        b.block(36, 38, 12, 12);
        b.slab(40, 42, 10);
        b.gem(3, 41, 8);
        // orchard walk
        b.gem(4, 52, 11);
        // the hollow nook
        b.stoneBlock(60, 68, 3, 8);
        b.stoneBlock(60, 61, 9, 10);
        b.stoneBlock(67, 68, 9, 10);
        b.gem(5, 64, 11);
        b.prop('lantern', 62).prop('lantern', 66);
        // the falls
        b.water(74, 79, 13);
        b.stone(75).stone(77).stone(79);
        b.slab(76, 78, 6);
        b.waterfall(77, 7);
        b.gem(6, 77, 11);
        // high terrace before the courtyard
        b.slab(84, 85, 11).slab(87, 89, 9);
        b.gem(7, 88, 7);
        // the courtyard
        b.prop('fountain', 97);
        b.start(3);
        b.arch(104);
        // the journey: everything learned gathers — bounces, a leaf, a high secret
        b.bounce(32);
        b.seed(32, 11).seed(32, 9).seed(32, 7);
        b.bounce(94);
        b.seed(94, 11).seed(94, 9);
        b.leafH(73, 80, 11, 0.7);
        b.blossom(77, 8);                    // hidden inside the falls — leap from the leaf
        b.seedRun(4, 8);
        b.seedArc(15, 11, 21, 11, 4, 1.7);   // over the stream
        b.seedRun(22, 25);
        b.seed(26, 10).seed(28, 10);
        b.seedRun(30, 35, 3);
        b.seed(37, 11).seed(40, 9).seed(42, 9);
        b.seedRun(44, 51);
        b.seed(60, 12).seed(62, 12).seed(64, 12).seed(66, 12).seed(68, 12); // the nook
        b.seed(74, 10).seed(76, 10).seed(78, 10);  // across the leaf
        b.seed(84, 10).seed(87, 8).seed(89, 8);
        b.seedRun(92, 102, 3);
        b.prop('olive', 33).prop('olive', 56).prop('cypress', 13).prop('cypress', 46)
         .prop('cypress', 93).prop('cypress', 100, { v: 1 })
         .prop('wall', 23, { n: 2 }).prop('wall', 82, { n: 2 })
         .prop('flowers', 6).prop('flowers', 31, { v: 2 }).prop('flowers', 44, { v: 1 })
         .prop('flowers', 54).prop('flowers', 71, { v: 2 }).prop('flowers', 91, { v: 1 })
         .prop('bush', 49, { v: 2 }).prop('bush', 86).prop('sundial', 95)
         .prop('lantern', 101).prop('lantern', 107);
        b.creature('bird', 22).creature('bird', 45).creature('bird', 58)
         .creature('bird', 92).creature('bird', 99)
         .creature('tortoise', 50, null, { range: 70 })
         .creature('butterfly', 27, 7).creature('butterfly', 64, 5)
         .creature('butterfly', 88, 4).creature('butterfly', 97, 8);
      }
    },

    // ══════════════════════════════════ WORLD TWO · THE ORCHARD ═══════════
    // ----------------------------------------------------- 7 · Al-Ma'un ---
    {
      surahId: 107, key: 'maun', title: 'The Shared Table',
      subtitle: 'what we give comes back as light',
      w: 96, h: 16,
      build(b) {
        b.ground(0, 95, 13);
        b.block(14, 18, 12, 12);             // first orchard rise
        b.gem(1, 16, 10);
        b.gem(2, 26, 11);                    // among the fruit trees
        b.water(34, 38, 13);                 // the giving channel
        b.stone(35).stone(37);
        b.slab(44, 46, 10);
        b.gem(3, 45, 8);
        b.stoneBlock(52, 58, 12, 12);        // the long shared table
        b.gem(4, 55, 10);
        b.prop('fountain', 61);
        b.stoneBlock(66, 66, 12, 12);        // the little granary tower
        b.stoneBlock(67, 68, 11, 12);
        b.slab(70, 72, 9);
        b.gem(5, 71, 7);
        b.gem(6, 80, 11);
        b.water(84, 88, 13);                 // the orchard well
        b.stone(85).stone(87);
        b.slab(86, 88, 6);
        b.waterfall(87, 7);
        b.gem(7, 87, 11);                    // behind the well's veil of water
        b.start(3);
        b.arch(92);
        b.bounce(31);
        b.seed(31, 11).seed(31, 9);
        b.blossom(31, 7);
        b.seedRun(4, 12);
        b.seedArc(13, 11, 19, 11, 4, 1.6);
        b.seedRun(21, 29);
        b.seedArc(33, 11, 39, 11, 5, 1);
        b.seed(44, 9).seed(46, 9);
        b.seed(53, 10).seed(55, 10).seed(57, 10);
        b.seedRun(60, 64);
        b.seed(67, 10).seed(70, 8).seed(72, 8);
        b.seedRun(75, 83, 2);
        b.seedArc(83, 11, 89, 11, 5, 1);
        b.seed(90, 11);
        b.prop('fruit', 9).prop('fruit', 22, { v: 1 }).prop('fruit', 42, { v: 2 })
         .prop('fruit', 75, { v: 0 }).prop('wall', 29, { n: 2 })
         .prop('flowers', 6, { v: 1 }).prop('flowers', 40, { v: 2 }).prop('flowers', 63)
         .prop('lantern', 59).prop('lantern', 90).prop('bush', 49, { v: 2 })
         .prop('bush', 77, { v: 1 });
        b.creature('bird', 20).creature('bird', 49).creature('bird', 78)
         .creature('tortoise', 58, null, { range: 60 })
         .creature('butterfly', 16, 8).creature('butterfly', 55, 8).creature('butterfly', 86, 7);
      }
    },
    // ------------------------------------------------------ 8 · Quraysh ---
    {
      surahId: 106, key: 'quraysh', title: 'The Caravan Rest',
      subtitle: 'fed against hunger, safe from fear',
      w: 88, h: 16,
      build(b) {
        b.ground(0, 87, 13);
        b.gem(1, 10, 11);
        b.block(16, 20, 12, 12);             // the winter road climbs
        b.block(21, 24, 11, 12);
        b.gem(2, 22, 9);
        b.water(30, 35, 13);                 // the oasis
        b.stone(31).stone(33).stone(35);
        b.gem(3, 33, 11);                    // fed from the oasis
        b.leafH(29, 36, 10, 1.3);
        b.prop('palm', 28).prop('palm', 37, { v: 1 });
        // the caravan camp
        b.prop('wall', 44, { n: 2 }).prop('wall', 48, { n: 3 }).prop('lantern', 46);
        b.bounce(41);
        b.seed(41, 11).seed(41, 9);
        b.blossom(41, 7);
        // the house of safety
        b.stoneBlock(62, 68, 11, 12);
        b.slab(61, 69, 10);
        b.gem(4, 65, 8);
        b.start(3);
        b.arch(80);
        b.seedRun(4, 9);
        b.seedArc(14, 11, 20, 11, 4, 1.5);
        b.seed(22, 10).seed(24, 10);
        b.seedArc(29, 11, 36, 11, 5, 1);     // over the oasis
        b.seedRun(39, 43);
        b.seedRun(50, 58, 2);
        b.seed(61, 9).seed(63, 9).seed(65, 9).seed(67, 9).seed(69, 9);
        b.seedRun(72, 78);
        b.prop('fruit', 13, { v: 2 }).prop('bush', 52, { v: 1 })
         .prop('flowers', 7).prop('flowers', 55, { v: 2 }).prop('flowers', 74, { v: 1 })
         .prop('lantern', 71).prop('palm', 76);
        b.creature('bird', 18).creature('bird', 54).creature('tortoise', 45, null, { range: 80 })
         .creature('butterfly', 33, 8).creature('butterfly', 65, 6);
      }
    },
    // ------------------------------------------------------- 9 · Al-Fil ---
    {
      surahId: 105, key: 'fil', title: 'The Bird Sky',
      subtitle: 'little wings over the proud army',
      w: 100, h: 16,
      build(b) {
        b.ground(0, 99, 13);
        b.gem(1, 9, 11);
        b.block(15, 16, 12, 12);             // crumbled like nibbled straw
        b.block(19, 20, 12, 12);
        b.gem(2, 19, 10);
        b.slab(26, 28, 10);                  // the flight of the flocks
        b.slab(31, 33, 8);
        b.slab(36, 38, 6);
        b.gem(3, 37, 4);                     // highest, where the birds fly
        b.water(46, 50, 13);
        b.stone(47).stone(49);
        b.leafH(45, 51, 10, 0.5);
        b.stoneBlock(58, 63, 11, 12);        // the kneeling elephant mound
        b.gem(4, 60, 9);
        b.bounce(70);
        b.seed(70, 11).seed(70, 9);
        b.blossom(70, 7);
        b.gem(5, 78, 11);
        b.start(3);
        b.arch(93);
        b.seedRun(4, 13);
        b.seed(19, 11).seed(20, 11);
        b.seed(27, 8).seed(32, 6).seed(36, 4).seed(38, 4);   // climbing with the birds
        b.seed(39, 5).seed(41, 10).seed(43, 11);   // gliding back down
        b.seed(47, 9).seed(49, 9);           // riding the leaf
        b.seedRun(53, 56);
        b.seed(59, 9).seed(61, 9);
        b.seedRun(64, 68);
        b.seedRun(73, 77);
        b.seedRun(80, 90, 2);
        b.prop('fruit', 12, { v: 0 }).prop('fruit', 43, { v: 1 }).prop('fruit', 85, { v: 2 })
         .prop('wall', 54, { n: 2 }).prop('bush', 66, { v: 2 })
         .prop('flowers', 6, { v: 1 }).prop('flowers', 30).prop('flowers', 75, { v: 2 })
         .prop('lantern', 88);
        // the sky full of little birds
        b.creature('bird', 17).creature('bird', 24).creature('bird', 42)
         .creature('bird', 56).creature('bird', 74).creature('bird', 83)
         .creature('butterfly', 27, 6).creature('butterfly', 37, 2)
         .creature('butterfly', 61, 7).creature('tortoise', 65, null, { range: 50 });
      }
    },
    // -------------------------------------------------- 10 · Al-Humazah ---
    {
      surahId: 104, key: 'humazah', title: 'The Deep Shade',
      subtitle: 'kind words weigh more than gold',
      w: 110, h: 16,
      build(b) {
        b.ground(0, 109, 13);
        b.gem(1, 8, 11);
        b.block(14, 17, 12, 12);
        b.gem(2, 15, 10);
        b.gem(3, 24, 11);                    // deep in the grove
        b.slab(32, 34, 10);                  // the climb to the roof
        b.gem(4, 33, 8);
        b.slab(37, 39, 8);
        b.slab(41, 41, 5);
        // the counting house: a hollow of hoarded cool stone
        b.stoneBlock(42, 54, 4, 8);
        b.stoneBlock(42, 44, 9, 10);
        b.stoneBlock(52, 54, 9, 10);
        b.gem(5, 48, 11);                    // locked away in the dim
        b.prop('lantern', 46, { y: 13 * 48 }).prop('lantern', 50, { y: 13 * 48 });
        b.gem(6, 47, 2);                     // gold left out on the roof
        b.water(60, 64, 13);
        b.stone(61).stone(63);
        b.gem(7, 67, 11);
        b.stoneBlock(74, 74, 12, 12);        // the counting tower
        b.stoneBlock(75, 75, 11, 12);
        b.stoneBlock(76, 77, 10, 12);
        b.slab(79, 81, 8);
        b.gem(8, 80, 6);
        b.bounce(87);
        b.seed(87, 11).seed(87, 9);
        b.blossom(87, 7);
        b.gem(9, 92, 11);
        b.start(3);
        b.arch(103);
        b.seedRun(4, 12);
        b.seed(15, 11).seed(17, 11);
        b.seedRun(20, 29);
        b.seed(33, 9).seed(38, 7).seed(41, 4);
        b.seed(44, 3).seed(48, 3).seed(52, 3);   // along the rooftop
        b.seed(46, 12).seed(48, 12).seed(50, 12); // the dim treasury trail
        b.seedArc(59, 11, 65, 11, 5, 1);
        b.seedRun(67, 71);
        b.seed(75, 10).seed(77, 9).seed(79, 7).seed(81, 7);
        b.seedRun(90, 100, 2);
        b.prop('fruit', 11, { v: 1 }).prop('fruit', 21, { v: 0 }).prop('fruit', 27, { v: 1 })
         .prop('fruit', 69, { v: 2 }).prop('bush', 30, { v: 2 }).prop('bush', 58)
         .prop('wall', 84, { n: 2 }).prop('flowers', 6).prop('flowers', 56, { v: 1 })
         .prop('flowers', 95, { v: 2 }).prop('lantern', 98);
        b.creature('bird', 19).creature('bird', 71).creature('tortoise', 25, null, { range: 60 })
         .creature('butterfly', 33, 6).creature('butterfly', 63, 8).creature('butterfly', 90, 7);
      }
    },
    // ------------------------------------------------- 11 · At-Takathur ---
    {
      surahId: 102, key: 'takathur', title: 'The Laden Boughs',
      subtitle: 'the heart is filled by remembering',
      w: 118, h: 16,
      build(b) {
        b.ground(0, 117, 13);
        b.gem(1, 9, 11);
        // the racing terraces — always one more step up
        b.block(16, 20, 12, 12);
        b.gem(2, 18, 10);
        b.block(24, 28, 11, 12);
        b.gem(3, 26, 9);
        b.block(32, 36, 10, 12);
        b.gem(4, 34, 8);
        b.slab(39, 41, 8);
        b.gem(5, 40, 6);                     // the top of more, more, more
        b.bounce(47);
        b.seed(47, 11).seed(47, 9);
        b.blossom(47, 7);
        // the quiet hollow — where the racing stops
        b.stoneBlock(52, 62, 3, 8);
        b.stoneBlock(52, 54, 9, 10);
        b.stoneBlock(60, 62, 9, 10);
        b.gem(6, 57, 11);                    // stillness, glowing softly
        b.prop('lantern', 55, { y: 13 * 48 }).prop('lantern', 59, { y: 13 * 48 });
        b.prop('fountain', 68);              // the heart, filled
        b.gem(7, 74, 11);
        b.water(80, 84, 13);
        b.stone(81).stone(83);
        b.slab(82, 84, 6);
        b.waterfall(83, 7);
        b.gem(8, 83, 11);                    // behind the falls
        b.start(3);
        b.arch(110);
        b.seedRun(4, 13);
        b.seed(17, 11).seed(19, 11).seed(25, 10).seed(27, 10);
        b.seed(33, 9).seed(35, 9).seed(39, 7).seed(41, 7);
        b.seed(53, 12).seed(55, 12).seed(57, 12).seed(59, 12).seed(61, 12);
        b.seedRun(65, 71, 2);
        b.seedRun(73, 77);
        b.seedArc(79, 11, 85, 11, 5, 1);
        b.seedRun(88, 106, 3);
        b.prop('fruit', 7, { v: 0 }).prop('fruit', 13, { v: 1 }).prop('fruit', 22, { v: 2 })
         .prop('fruit', 30, { v: 0 }).prop('fruit', 45, { v: 1 }).prop('fruit', 66, { v: 2 })
         .prop('fruit', 72, { v: 0 }).prop('fruit', 78, { v: 1 })
         .prop('sundial', 95).prop('wall', 91, { n: 2 })
         .prop('flowers', 10, { v: 1 }).prop('flowers', 64).prop('flowers', 100, { v: 2 })
         .prop('lantern', 104).prop('bush', 88, { v: 2 });
        b.creature('bird', 15).creature('bird', 44).creature('bird', 76)
         .creature('bird', 98).creature('tortoise', 69, null, { range: 70 })
         .creature('butterfly', 26, 7).creature('butterfly', 57, 6).creature('butterfly', 93, 8);
      }
    },
    // ------------------------------------------------- 12 · Al-Qari'ah ---
    {
      surahId: 101, key: 'qariah', title: 'The Weighing Light',
      subtitle: 'small kindnesses, heavy and bright',
      w: 128, h: 16,
      build(b) {
        b.ground(0, 127, 13);
        b.gem(1, 8, 11);
        // wool-soft mounds
        b.block(14, 17, 12, 12);
        b.gem(2, 15, 10);
        b.block(21, 25, 11, 12);
        b.gem(3, 23, 9);
        b.gem(4, 33, 11);                    // the moth meadow
        // the great scales
        b.block(37, 38, 12, 12);
        b.slab(40, 42, 9);                   // the heavy pan, lifted by good
        b.stoneBlock(44, 45, 7, 12);         // the pillar of the balance
        b.slab(47, 49, 11);
        b.gem(5, 41, 7);
        b.gem(6, 48, 9);
        b.water(56, 61, 13);
        b.stone(57).stone(59).stone(61);
        b.leafH(55, 62, 9, 1.7);
        b.gem(7, 59, 11);
        b.block(68, 72, 12, 12);
        b.gem(8, 70, 10);
        b.block(75, 76, 11, 12);
        b.slab(78, 80, 9);
        b.slab(83, 85, 7);
        b.gem(9, 84, 5);
        b.bounce(90);
        b.seed(90, 11).seed(90, 9);
        b.blossom(90, 7);
        b.gem(10, 96, 11);
        b.slab(103, 105, 11);
        b.gem(11, 104, 9);
        b.start(3);
        b.arch(120);
        b.seedRun(4, 12);
        b.seed(15, 11).seed(22, 10).seed(24, 10);
        b.seedRun(28, 35, 2);
        b.seed(38, 11).seed(40, 8).seed(42, 8).seed(44, 6).seed(48, 10);
        b.seedArc(54, 11, 63, 11, 6, 1);
        b.seedRun(64, 66);
        b.seed(69, 10).seed(71, 10);
        b.seed(76, 10).seed(79, 8).seed(84, 6);
        b.seedRun(93, 101, 2);
        b.seed(103, 10).seed(105, 10);
        b.seedRun(108, 118, 3);
        b.prop('fruit', 11, { v: 2 }).prop('fruit', 29, { v: 0 }).prop('fruit', 65, { v: 1 })
         .prop('fruit', 99, { v: 2 }).prop('wall', 52, { n: 2 })
         .prop('flowers', 6).prop('flowers', 31, { v: 1 }).prop('flowers', 74, { v: 2 })
         .prop('flowers', 108).prop('lantern', 112).prop('bush', 92, { v: 1 })
         .prop('lantern', 50);
        // moths of the Striking Hour — butterflies everywhere
        b.creature('butterfly', 18, 8).creature('butterfly', 30, 6).creature('butterfly', 34, 9)
         .creature('butterfly', 44, 4).creature('butterfly', 59, 7).creature('butterfly', 71, 8)
         .creature('butterfly', 86, 5).creature('butterfly', 97, 8).creature('butterfly', 110, 7)
         .creature('bird', 27).creature('bird', 94).creature('tortoise', 115, null, { range: 60 });
      }
    },

    // ═════════════════════════════════ WORLD THREE · THE COURTYARD ════════
    // ------------------------------------------------ 13 · Az-Zalzalah ---
    {
      surahId: 99, key: 'zalzalah', title: 'The Trembling Steps',
      subtitle: 'no speck of good is ever lost',
      w: 118, h: 16,
      build(b) {
        b.ground(0, 117, 13);
        b.gem(1, 8, 11);
        // the shaken terraces — stone steps jolted out of line
        b.stoneBlock(14, 17, 12, 12);
        b.stoneBlock(18, 21, 11, 12);
        b.stoneBlock(22, 25, 12, 12);
        b.gem(2, 19, 9);
        b.water(30, 33, 13);                 // the crack where the earth opened
        b.stone(31).stone(33);
        b.gem(3, 32, 11);
        // the colonnade bridge
        b.stoneBlock(36, 37, 11, 12);
        b.slab(38, 46, 8);
        b.gem(4, 42, 6);
        b.gem(5, 44, 11);                    // sheltered beneath the bridge
        b.prop('column', 39, { y: 13 * 48 }).prop('column', 43, { y: 13 * 48 });
        // the tilted plaza
        b.stoneBlock(54, 58, 11, 12);
        b.stoneBlock(59, 63, 12, 12);
        b.gem(6, 56, 9);
        b.bounce(68);
        b.seed(68, 11).seed(68, 9);
        b.blossom(68, 7);
        // the ledge over the lower water
        b.stoneBlock(71, 72, 11, 12);
        b.water(74, 79, 13);
        b.stone(75).stone(77).stone(79);
        b.slab(74, 79, 9);
        b.gem(7, 77, 7);
        b.gem(8, 90, 11);
        b.start(3);
        b.arch(110);
        // specks of light everywhere — no seed of good is lost
        b.seedRun(4, 12);
        b.seed(15, 11).seed(19, 10).seed(23, 11);
        b.seedArc(29, 11, 34, 11, 4, 1);
        b.seed(37, 10).seed(39, 7).seed(42, 7).seed(45, 7);
        b.seed(41, 12).seed(43, 12).seed(45, 12);
        b.seedRun(48, 52);
        b.seed(55, 10).seed(57, 10).seed(61, 11);
        b.seedRun(65, 67);
        b.seed(72, 10).seed(75, 8).seed(77, 8).seed(79, 8);
        b.seedRun(82, 88, 2);
        b.seedRun(92, 108, 3);
        b.prop('column', 86, { y: 13 * 48 }).prop('column', 94, { y: 13 * 48 })
         .prop('wall', 98, { n: 2 }).prop('fruit', 11, { v: 1 })
         .prop('flowers', 6, { v: 2 }).prop('flowers', 50).prop('flowers', 83, { v: 1 })
         .prop('flowers', 102, { v: 2 }).prop('lantern', 48).prop('lantern', 105)
         .prop('bush', 64, { v: 1 });
        b.creature('bird', 27).creature('bird', 66).creature('bird', 96)
         .creature('tortoise', 50, null, { range: 60 })
         .creature('butterfly', 20, 7).creature('butterfly', 58, 7).creature('butterfly', 88, 8);
      }
    },
    // ------------------------------------------------- 14 · Al-'Adiyat ---
    {
      surahId: 100, key: 'adiyat', title: 'The Dawn Chargers',
      subtitle: 'give thanks with your whole heart',
      w: 126, h: 16,
      build(b) {
        b.ground(0, 125, 13);
        b.gem(1, 8, 11);
        // the gallop — hoofbeat mounds
        b.block(14, 15, 12, 12);
        b.block(19, 20, 12, 12);
        b.block(24, 25, 12, 12);
        b.gem(2, 19, 10);
        b.gem(3, 28, 11);
        // sparks struck from stone — rising slabs
        b.slab(33, 34, 10);
        b.slab(37, 38, 8);
        b.slab(41, 42, 6);
        b.gem(4, 41, 4);
        // the dust hollow
        b.stoneBlock(48, 58, 3, 8);
        b.stoneBlock(48, 50, 9, 10);
        b.stoneBlock(56, 58, 9, 10);
        b.gem(5, 53, 11);
        b.prop('lantern', 51, { y: 13 * 48 }).prop('lantern', 55, { y: 13 * 48 });
        b.gem(6, 64, 11);
        // the stable colonnade
        b.stoneBlock(65, 66, 11, 12);
        b.slab(67, 77, 9);
        b.gem(7, 72, 7);
        b.gem(8, 75, 11);                    // resting in the stable's shade
        b.prop('column', 69, { y: 13 * 48 }).prop('column', 74, { y: 13 * 48 });
        // the water trough
        b.water(82, 86, 13);
        b.stone(83).stone(85);
        b.gem(9, 84, 11);
        b.bounce(89);
        b.seed(89, 11).seed(89, 9);
        b.blossom(89, 7);
        // the last charge
        b.block(92, 93, 12, 12);
        b.block(97, 98, 12, 12);
        b.gem(10, 97, 10);
        b.slab(104, 106, 10);
        b.gem(11, 105, 8);
        b.start(3);
        b.arch(118);
        b.seedRun(4, 12);
        b.seed(14, 11).seed(19, 11).seed(24, 11);  // hoofbeat rhythm
        b.seedRun(27, 31);
        b.seed(33, 9).seed(37, 7).seed(41, 5);
        b.seed(50, 12).seed(52, 12).seed(54, 12).seed(56, 12);
        b.seedRun(60, 63);
        b.seed(68, 8).seed(70, 8).seed(72, 8).seed(74, 8).seed(76, 8);
        b.seedArc(81, 11, 87, 11, 5, 1);
        b.seedRun(94, 100, 3);
        b.seed(104, 9).seed(106, 9);
        b.seedRun(109, 116, 2);
        b.prop('wall', 79, { n: 2 }).prop('fruit', 11, { v: 0 })
         .prop('flowers', 6, { v: 1 }).prop('flowers', 46, { v: 2 }).prop('flowers', 101)
         .prop('lantern', 62).prop('lantern', 112).prop('bush', 108, { v: 2 })
         .prop('palm', 87);
        // birds scatter before the chargers
        b.creature('bird', 16).creature('bird', 26).creature('bird', 45)
         .creature('bird', 80).creature('bird', 100).creature('bird', 110)
         .creature('tortoise', 60, null, { range: 50 })
         .creature('butterfly', 35, 6).creature('butterfly', 72, 5).creature('butterfly', 95, 8);
      }
    },
    // ------------------------------------------------ 15 · Al-Bayyinah ---
    {
      surahId: 98, key: 'bayyinah', title: 'The Hall of Light',
      subtitle: 'pure pages, straight and clear',
      w: 122, h: 16,
      build(b) {
        b.ground(0, 121, 13);
        b.gem(1, 9, 11);
        // the first hall
        b.stoneBlock(12, 13, 11, 12);
        b.slab(14, 24, 9);
        b.gem(2, 19, 7);
        b.gem(3, 21, 11);                    // lamplight under the gallery
        b.prop('column', 15, { y: 13 * 48 }).prop('column', 19, { y: 13 * 48 })
         .prop('column', 23, { y: 13 * 48 });
        b.water(30, 33, 13);                 // the runnel of clear water
        b.stone(31).stone(33);
        // the high gallery
        b.stoneBlock(36, 37, 12, 12);
        b.stoneBlock(40, 50, 11, 12);
        b.slab(44, 46, 9);
        b.slab(40, 50, 6);
        b.gem(4, 44, 4);
        b.gem(5, 56, 11);
        // the pure pages — bright steps of stone
        b.slab(62, 63, 10);
        b.slab(66, 67, 8);
        b.slab(70, 71, 6);
        b.gem(6, 70, 4);
        b.bounce(76);
        b.seed(76, 11).seed(76, 9);
        b.blossom(76, 7);
        b.prop('fountain', 80);
        b.gem(7, 82, 11);
        // the last colonnade
        b.stoneBlock(85, 86, 11, 12);
        b.slab(87, 93, 9);
        b.gem(8, 90, 7);
        b.prop('column', 88, { y: 13 * 48 }).prop('column', 92, { y: 13 * 48 });
        b.water(98, 102, 13);
        b.stone(99).stone(101);
        b.start(3);
        b.arch(114);
        b.seedRun(4, 10);
        b.seed(14, 8).seed(17, 8).seed(21, 8).seed(24, 8);
        b.seed(19, 12).seed(21, 12).seed(23, 12);
        b.seedArc(29, 11, 34, 11, 4, 1);
        b.seed(37, 11).seed(41, 10).seed(44, 8).seed(43, 5).seed(46, 5).seed(49, 5);
        b.seedRun(52, 59, 2);
        b.seed(62, 9).seed(66, 7).seed(70, 5);
        b.seedRun(73, 79, 3);
        b.seedRun(82, 84);
        b.seed(88, 8).seed(90, 8).seed(92, 8);
        b.seedArc(97, 11, 103, 11, 5, 1);
        b.seedRun(105, 112, 2);
        b.prop('wall', 27, { n: 2 }).prop('fruit', 7, { v: 2 })
         .prop('flowers', 34, { v: 1 }).prop('flowers', 60).prop('flowers', 96, { v: 2 })
         .prop('flowers', 106, { v: 1 }).prop('lantern', 54).prop('lantern', 108)
         .prop('bush', 64, { v: 1 }).prop('palm', 104);
        b.creature('bird', 26).creature('bird', 58).creature('bird', 95)
         .creature('tortoise', 82, null, { range: 60 })
         .creature('butterfly', 20, 5).creature('butterfly', 45, 3)
         .creature('butterfly', 70, 3).creature('butterfly', 107, 8);
      }
    },
    // --------------------------------------------------- 16 · Al-Qadr ---
    {
      surahId: 97, key: 'qadr', title: 'The Night of Peace',
      subtitle: 'walking into the blessed night',
      w: 108, h: 16,
      build(b) {
        b.ground(0, 107, 13);
        b.gem(1, 10, 11);
        b.slab(22, 24, 10);
        b.gem(2, 23, 8);
        b.water(32, 38, 13);                 // the mirror pool
        b.stone(33).stone(35).stone(37);
        b.gem(3, 35, 11);
        // the minaret steps
        b.stoneBlock(46, 46, 12, 12);
        b.stoneBlock(47, 47, 11, 12);
        b.stoneBlock(48, 48, 10, 12);
        b.stoneBlock(49, 50, 9, 12);
        b.slab(52, 54, 7);
        b.gem(4, 53, 5);
        // the descent of light — leaves drifting down like the angels' hour
        b.leafV(60, 7, 11, 0.6);
        b.leafV(66, 6, 10, 1.9);
        b.leafH(70, 76, 9, 1.1);
        b.gem(5, 84, 11);
        b.bounce(92);
        b.seed(92, 11).seed(92, 9);
        b.blossom(92, 7);
        b.start(3);
        b.arch(100);
        b.seedRun(4, 9);
        b.seedRun(12, 20, 2);
        b.seed(22, 9).seed(24, 9);
        b.seedArc(31, 11, 39, 11, 6, 1);
        b.seedRun(41, 44);
        b.seed(47, 10).seed(49, 8).seed(53, 6);
        b.seed(60, 6).seed(60, 9);           // riding the falling light
        b.seed(66, 5).seed(66, 8);
        b.seed(71, 7).seed(73, 7).seed(75, 7);
        b.seedRun(79, 89, 2);
        b.seedRun(95, 98);
        b.prop('lantern', 14).prop('lantern', 20).prop('lantern', 28)
         .prop('lantern', 44).prop('lantern', 80).prop('lantern', 86)
         .prop('column', 96, { y: 13 * 48 }).prop('lantern', 104)
         .prop('flowers', 7, { v: 1 }).prop('flowers', 57, { v: 2 }).prop('flowers', 90)
         .prop('bush', 42, { v: 1 }).prop('palm', 30).prop('palm', 40, { v: 1 });
        // a hushed night: moths and one slow tortoise
        b.creature('butterfly', 18, 8).creature('butterfly', 36, 7)
         .creature('butterfly', 63, 6).creature('butterfly', 82, 8)
         .creature('tortoise', 76, null, { range: 50 }).creature('bird', 55);
      }
    },
    // --------------------------------------------------- 17 · Al-'Alaq ---
    {
      surahId: 96, key: 'alaq', title: 'The Mountain of Light',
      subtitle: 'the very first word: Read!',
      w: 170, h: 16,
      build(b) {
        b.ground(0, 169, 13);
        b.gem(1, 7, 11);
        b.block(12, 15, 12, 12);
        b.gem(2, 13, 10);
        b.block(19, 23, 11, 12);
        b.gem(3, 21, 9);
        b.gem(4, 29, 11);
        b.water(34, 38, 13);
        b.stone(35).stone(37);
        b.gem(5, 36, 11);
        b.bounce(41);
        b.seed(41, 11).seed(41, 9);
        b.blossom(41, 7);
        b.slab(43, 45, 10);
        b.gem(6, 44, 8);
        b.block(50, 53, 12, 12);
        b.gem(7, 51, 10);
        // the scriptorium — where the pen is honored
        b.stoneBlock(58, 68, 3, 8);
        b.stoneBlock(58, 60, 9, 10);
        b.stoneBlock(66, 68, 9, 10);
        b.gem(8, 63, 11);
        b.prop('lantern', 61, { y: 13 * 48 }).prop('lantern', 65, { y: 13 * 48 });
        b.gem(9, 74, 11);
        // the grand stair — the mountain begins
        b.stoneBlock(80, 82, 12, 12);
        b.stoneBlock(83, 85, 11, 12);
        b.stoneBlock(86, 88, 10, 12);
        b.stoneBlock(89, 91, 9, 12);
        b.gem(10, 84, 9);
        b.gem(11, 90, 7);
        b.slab(94, 96, 7);
        b.gem(12, 95, 5);
        // the mountain spring
        b.water(102, 107, 13);
        b.stone(103).stone(105).stone(107);
        b.slab(104, 106, 6);
        b.waterfall(105, 7);
        b.gem(13, 105, 11);                  // behind the spring's veil
        b.bounce(112);
        b.seed(112, 11).seed(112, 9);
        b.gem(14, 114, 11);
        // the colonnade of the pen
        b.stoneBlock(118, 124, 11, 12);
        b.gem(15, 121, 9);
        b.prop('column', 119).prop('column', 123);
        b.slab(127, 129, 9);
        b.gem(16, 128, 7);
        b.slab(132, 134, 7);
        b.gem(17, 133, 5);
        // the cave of Hira, high on the mountain's shoulder
        b.stoneBlock(140, 155, 12, 12);
        b.stoneBlock(140, 152, 2, 7);
        b.stoneBlock(140, 141, 8, 9);
        b.stoneBlock(150, 152, 8, 9);
        b.gem(18, 145, 10);                  // the first word, waiting inside
        b.prop('lantern', 143, { y: 12 * 48 }).prop('lantern', 147, { y: 12 * 48 });
        b.leafV(159, 8, 12, 1.0);
        b.gem(19, 162, 11);                  // the walk home, comforted
        b.start(3);
        b.arch(166);
        b.seedRun(4, 10);
        b.seed(13, 11).seed(20, 10).seed(22, 10);
        b.seedRun(26, 31, 2);
        b.seedArc(33, 11, 39, 11, 5, 1);
        b.seed(44, 9);
        b.seed(51, 11).seed(53, 11);
        b.seed(59, 12).seed(61, 12).seed(63, 12).seed(65, 12).seed(67, 12);
        b.seedRun(71, 78, 2);
        b.seed(81, 10).seed(84, 9).seed(87, 8).seed(90, 7).seed(95, 6);
        b.seedArc(101, 11, 108, 11, 5, 1);
        b.seedRun(110, 116, 2);
        b.seed(119, 10).seed(121, 10).seed(123, 10);
        b.seed(128, 8).seed(133, 6);
        b.seed(138, 12).seed(143, 10).seed(147, 10);   // into the cave
        b.seed(159, 9).seed(159, 11);        // drifting down the far side
        b.seedRun(157, 164, 2);
        b.prop('fruit', 10, { v: 0 }).prop('wall', 32, { n: 2 })
         .prop('cypress', 48).prop('bush', 56, { v: 1 })
         .prop('flowers', 6).prop('flowers', 47, { v: 2 }).prop('flowers', 76, { v: 1 })
         .prop('flowers', 99).prop('lantern', 70).prop('lantern', 110)
         .prop('lantern', 158).prop('lantern', 164)
         .prop('palm', 116).prop('flowers', 160, { v: 2 });
        b.creature('bird', 17).creature('bird', 46).creature('bird', 72)
         .creature('bird', 98).creature('bird', 137)
         .creature('tortoise', 27, null, { range: 60 })
         .creature('butterfly', 36, 8).creature('butterfly', 63, 7)
         .creature('butterfly', 95, 3).creature('butterfly', 145, 8)
         .creature('butterfly', 162, 8);
      }
    }
  ];

  // ------------------------------------------------------------- worlds ---
  // Each world is a stretch of the journey with its own map. To add a world:
  //   1. append its level defs above (order = unlock order),
  //   2. add an entry here listing those level keys.
  // The map scene reads everything else (node count, gateways between
  // worlds, banner, backdrop) from this table. Keys whose level defs don't
  // exist yet are skipped with a console warning, so worlds can be listed
  // ahead of their gardens and grow node by node as the defs land.
  const worldDefs = [
    {
      name: 'World One · The Garden',
      sub: 'six surahs are waiting among the leaves',
      palette: 'ikhlas',   // backdrop palette for this world's map
      seed: 7,             // backdrop hills seed
      levels: ['kawthar', 'ikhlas', 'asr', 'falaq', 'nas', 'fatiha']
    },
    {
      name: 'World Two · The Orchard',
      sub: 'six surahs ripen in the afternoon shade',
      palette: 'takathur',
      seed: 21,
      levels: ['maun', 'quraysh', 'fil', 'humazah', 'takathur', 'qariah']
    },
    {
      name: 'World Three · The Courtyard',
      sub: 'five surahs glow in the evening stone',
      palette: 'zalzalah',
      seed: 35,
      levels: ['zalzalah', 'adiyat', 'bayyinah', 'qadr', 'alaq']
    }
  ];

  // Build all levels into ready structures.
  GOL.LEVELS = defs.map((d, i) => {
    const b = makeBuilder(d.w, d.h);
    d.build(b);
    decorate(b, 1000 + i * 77, 0.15);
    const surah = window.GOL_DATA.surahs.find((s) => s.id === d.surahId);
    return {
      index: i, key: d.key, title: d.title, subtitle: d.subtitle,
      surah, surahId: d.surahId,
      w: b.w, h: b.h, tiles: b.tiles,
      gems: b.gems.sort((a, g) => a.ayah - g.ayah),
      props: b.props, creatures: b.creatures, waterfalls: b.waterfalls,
      seeds: b.seeds, pads: b.pads, moverDefs: b.moverDefs, blossom: b.blossomPos,
      start: b.startPos, arch: b.archPos,
      surface: (x) => b.surface(x)
    };
  });

  // Resolve world level keys into global level indices. Unknown keys are
  // skipped (their gardens haven't been planted yet); empty worlds wait
  // unseen until their first garden exists.
  GOL.WORLDS = worldDefs.map((w) => ({
    name: w.name, sub: w.sub, palette: w.palette, seed: w.seed,
    levels: w.levels.map((key) => {
      const L = GOL.LEVELS.find((l) => l.key === key);
      if (!L && typeof console !== 'undefined') console.warn('world "' + w.name + '": level "' + key + '" not built yet');
      return L ? L.index : -1;
    }).filter((i) => i >= 0)
  })).filter((w) => w.levels.length > 0);
  GOL.WORLDS.forEach((w, wi) => (w.index = wi));
  // which world a global level index lives in
  GOL.worldOfLevel = function (i) {
    for (const w of GOL.WORLDS) if (w.levels.includes(i)) return w.index;
    return 0;
  };
})();
