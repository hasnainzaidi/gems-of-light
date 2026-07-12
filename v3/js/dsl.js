// Gems of Light v3 — dsl.js
// The level-recipe builder, carried over from v1's levels.js, plus the two
// spots every v3 world needs: the campfire clearing and the shrine door.
// Tile codes: 0 air, 1 ground/stone, 2 one-way slab, 3 water, 4 carved stone.
(function () {
  const GOL = window.GOL;
  const TILE = GOL.TILE;

  function makeBuilder(w, h) {
    const tiles = new Uint8Array(w * h);
    const b = {
      w, h, tiles,
      gems: [], props: [], creatures: [], waterfalls: [],
      seeds: [], pads: [], moverDefs: [], occluders: [], blossomPos: null,
      memoryPos: null,
      startPos: null, campfirePos: null, doorPos: null,
      set(x, y, v) { if (x >= 0 && x < w && y >= 0 && y < h) tiles[y * w + x] = v; },
      get(x, y) { return x < 0 || x >= w || y < 0 || y >= h ? 0 : tiles[y * w + x]; },
      ground(x0, x1, top) { for (let x = x0; x <= x1; x++) for (let y = top; y < h; y++) this.set(x, y, 1); return b; },
      carve(x0, x1, y0, y1) { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) this.set(x, y, 0); return b; },
      water(x0, x1, top) {
        top = top == null ? 13 : top;
        for (let x = x0; x <= x1; x++) for (let y = top; y < h; y++) this.set(x, y, 3);
        return b;
      },
      slab(x0, x1, row) { for (let x = x0; x <= x1; x++) this.set(x, row, 2); return b; },
      block(x0, x1, y0, y1) { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) this.set(x, y, 1); return b; },
      stoneBlock(x0, x1, y0, y1) { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) this.set(x, y, 4); return b; },
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
      // the resting place where the whole surah is heard once
      campfire(x) { this.campfirePos = { x: (x + 0.5) * TILE, y: this.surface(x) * TILE }; return b; },
      // the way onward to the shrine, revealed after the campfire
      door(x) { this.doorPos = { x: (x + 0.5) * TILE, y: this.surface(x) * TILE }; return b; },
      seed(x, row) { this.seeds.push({ x: (x + 0.5) * TILE, y: (row + 0.5) * TILE }); return b; },
      seedRun(x0, x1, every) {
        for (let x = x0; x <= x1; x += every || 2) {
          const s = this.surface(x);
          if (s < h) this.seeds.push({ x: (x + 0.5) * TILE, y: (s - 1.4) * TILE });
        }
        return b;
      },
      seedArc(x0, row0, x1, row1, n, lift) {
        for (let i = 0; i < n; i++) {
          const k = n === 1 ? 0.5 : i / (n - 1);
          const x = x0 + (x1 - x0) * k;
          const row = row0 + (row1 - row0) * k - Math.sin(Math.PI * k) * (lift == null ? 2.1 : lift);
          this.seeds.push({ x: (x + 0.5) * TILE, y: (row + 0.5) * TILE });
        }
        return b;
      },
      bounce(x) {
        const s = this.surface(x);
        this.pads.push({ x: (x + 0.5) * TILE, y: s * TILE, tx: x, ty: s });
        return b;
      },
      blossom(x, row) { this.blossomPos = { x: (x + 0.5) * TILE, y: (row + 0.5) * TILE, tx: x, ty: row }; return b; },
      leafH(x0, x1, row, phase) {
        this.moverDefs.push({ kind: 'h', x0: (x0 + 0.5) * TILE, x1: (x1 + 0.5) * TILE, y: (row + 0.4) * TILE, hw: 46, speed: 0.32, phase: phase || 0 });
        return b;
      },
      leafV(x, row0, row1, phase) {
        this.moverDefs.push({ kind: 'v', x: (x + 0.5) * TILE, y0: (row0 + 0.4) * TILE, y1: (row1 + 0.4) * TILE, hw: 46, speed: 0.3, phase: phase || 0 });
        return b;
      },
      // a raft drifting steadily downstream (x0 → x1), then slipping back to
      // begin again — end its run AT a bank so riders simply step off
      raft(x0, x1, row, speed) {
        this.moverDefs.push({ kind: 'raft', x0: (x0 + 0.5) * TILE, x1: (x1 + 0.5) * TILE, y: (row + 0.4) * TILE, hw: 56, speed: speed || 64 });
        return b;
      },
      // a memory stone: an ancient setting shaped for an earlier surah's
      // Grand Gem. A child who carries that gem wakes it — the whole surah
      // sounds again and the garden blooms (spaced repetition as discovery)
      memory(x, surahId) {
        this.memoryPos = { x: (x + 0.5) * TILE, y: this.surface(x) * TILE, surahId };
        return b;
      },
      // a foreground curtain (cave dark, hanging leaves) that softens when
      // the wanderer steps behind it — secrets live inside
      occluder(x0, x1, y0, y1, color) {
        this.occluders.push({ x: x0 * TILE, y: y0 * TILE, w: (x1 - x0 + 1) * TILE, h: (y1 - y0 + 1) * TILE, color: color || '#2E4032' });
        return b;
      },
      waterfall(x, rowTop) {
        let y1 = rowTop;
        while (y1 < h && this.get(x, y1) === 0) y1++;
        this.waterfalls.push({ x: (x + 0.5) * TILE, y: rowTop * TILE, h: (y1 - rowTop) * TILE });
        return b;
      },
      surface(x) {
        for (let y = 0; y < h; y++) { const t = this.get(x, y); if (t === 1 || t === 2 || t === 4) return y; }
        return h;
      }
    };
    return b;
  }
  GOL.makeBuilder = makeBuilder;

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
  GOL.decorate = decorate;

  // Prototype registry: p<N>.js files add themselves here.
  GOL.PROTOTYPES = {};

  // Build a prototype's recipe into a ready level structure.
  GOL.buildPrototype = function (def) {
    const b = makeBuilder(def.w, def.h);
    def.build(b);
    decorate(b, 1000 + def.id * 77, def.density != null ? def.density : 0.15);
    const surahId = GOL.V3.surah || def.surahId;
    const surah = window.GOL_DATA.surahs.find((s) => s.id === surahId);
    if (surah && surah.verses.length !== b.gems.length && typeof console !== 'undefined') {
      console.warn('prototype ' + def.id + ': ' + b.gems.length + ' gems vs ' + surah.verses.length + ' ayat');
    }
    return {
      id: def.id, key: def.key, name: def.name,
      palette: def.palette, endPalette: def.endPalette,
      surah, surahId,
      w: b.w, h: b.h, tiles: b.tiles,
      gems: b.gems.sort((a, g) => a.ayah - g.ayah),
      props: b.props, creatures: b.creatures, waterfalls: b.waterfalls,
      seeds: b.seeds, pads: b.pads, moverDefs: b.moverDefs, blossom: b.blossomPos,
      occluders: b.occluders,
      memory: b.memoryPos,
      start: b.startPos, campfire: b.campfirePos, door: b.doorPos,
      // per-prototype flavor hooks (all optional):
      //   weather: 'rain' — rain that thins as restoration rises
      //   drawLandmark(ctx, t, P, L) — a huge fixture drawn in world space
      weather: def.weather || null,
      drawLandmark: def.drawLandmark || null,
      surface: (x) => b.surface(x)
    };
  };
})();
