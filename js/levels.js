// Gems of Light — levels.js
// Six hand-designed World One gardens, described as small recipes.
// Tile codes: 0 air, 1 ground/stone, 2 one-way slab, 3 water.
// The grid is 16 rows tall; the main walking surface sits on top of row 13.
(function () {
  const GOL = window.GOL;
  const TILE = GOL.TILE;

  function makeBuilder(w, h) {
    const tiles = new Uint8Array(w * h);
    const b = {
      w, h, tiles,
      gems: [], props: [], creatures: [], waterfalls: [],
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
      start: b.startPos, arch: b.archPos,
      surface: (x) => b.surface(x)
    };
  });
})();
