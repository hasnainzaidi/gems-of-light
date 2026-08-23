// Gems of Light v3 — level-map.js
// A flattened picture of a whole world: the level as it is BUILT, not as it is
// walked. The recipe (v3/js/worlds/wN-*.js) is poured through the same DSL the
// game uses, then painted once onto a canvas the size of the world itself
// (w×h tiles × 48px) with the game's own art code — same tile atlas, same prop
// sprites, same creatures, same palette drift. The viewer on top of it only
// pans and zooms, so what you are looking at is the real thing, laid flat.
//
// Two honest departures from play, both unavoidable when you flatten a world:
//   · the sky and its clouds are SCREEN-anchored in play (they never move with
//     the camera), so here they are painted once across the world's own sky.
//     The parallax hills, by contrast, ARE world-anchored (horizon = row 13.4)
//     and land exactly where a player sees them.
//   · everything is shown awake at once: all gems lit, the campfire burning,
//     the shrine door open, secrets revealed. In play those arrive in order.
// A `night` world (darkness that the guiding lights push back) is drawn lit —
// the note panel says so, since the map is for reading construction.
(function () {
  const GOL = window.GOL;
  const TILE = GOL.TILE;
  const { alpha } = GOL.color;

  // ----------------------------------------------------------- the render --
  // Paint one world onto a canvas of exactly world size. `k` is restoration
  // (0 = first breath, 1 = every gem gathered) which drives the palette drift;
  // `t` is a frozen moment of world-time, so flames and water have a shape.
  function paintWorld(def, k, t) {
    const L = GOL.buildPrototype(def);
    const W = L.w * TILE, H = L.h * TILE;
    const c = GOL.paint.makeCanvas(W, H);
    const ctx = c.getContext('2d');

    const P0 = GOL.PALETTES[L.palette];
    const P1 = L.endPalette ? GOL.PALETTES[L.endPalette] : null;
    const P = P1 ? GOL.lerpPal(P0, P1, k) : P0;
    // the game bakes its tiles at the midpoint of the drift, once per visit
    const tilePal = P1 ? GOL.lerpPal(P0, P1, 0.5) : P0;
    const atlas = GOL.buildTileAtlas(tilePal, 7 + L.id * 13);
    const sprites = GOL.buildPropSprites(tilePal, 31 + L.id * 7);

    // ---- backdrop: sky over the world's own upper air, hills on the horizon
    const horizon = 13.4 * TILE;
    const sky = GOL.paint.makeCanvas(W, Math.round(horizon));
    // the three cloud bands drift at 4/7/10 px per second, so at a small
    // frozen `t` they sit almost on top of each other — one column of cloud
    // over every world. A far-on sky time spreads them the way play does.
    GOL.drawSky(sky.getContext('2d'), W, Math.round(horizon), P, t + 137, 0);
    ctx.drawImage(sky, 0, 0);
    ctx.fillStyle = P.skyLow;
    ctx.fillRect(0, Math.round(horizon), W, H - Math.round(horizon));

    const mkStrips = (Q, s) => ({
      far: GOL.buildHillStrip(1400, 260, { seed: s + 1, base: 150, amp: 40, color: Q.hillFar, mist: Q.mist, trees: 11, treeColor: GOL.color.shade(Q.hillFar, 0.22) }),
      mid: GOL.buildHillStrip(1150, 230, { seed: s + 2, base: 118, amp: 50, color: Q.hillMid, mist: Q.mist, trees: 8, treeColor: GOL.color.shade(Q.hillMid, 0.2) }),
      near: GOL.buildHillStrip(950, 205, { seed: s + 3, base: 90, amp: 46, color: Q.hillNear, mist: Q.mist, trees: 0 })
    });
    const dstrips = (S, a) => {
      if (a <= 0) return;
      ctx.globalAlpha = a;
      GOL.drawStrip(ctx, S.far, 0, 0.06, horizon - 258, W);
      // (the sun's ray fan is skipped: it is a screen effect, and flattened
      // into world space it reads as a shaft of light built into the level)
      GOL.drawStrip(ctx, S.mid, 0, 0.14, horizon - 208, W);
      GOL.drawStrip(ctx, S.near, 0, 0.26, horizon - 158, W);
      ctx.globalAlpha = 1;
    };
    dstrips(mkStrips(P0, 100 + L.id * 11), 1);
    if (P1) dstrips(mkStrips(GOL.PALETTES[L.endPalette], 100 + L.id * 11), k);

    // Below the hills a player only ever sees terrain; a tall world flattened
    // leaves that band bare, so it is carried down as valley mist deepening
    // into distance rather than a flat slab of sky colour.
    const nearBottom = horizon - 158 + 205;
    if (H > nearBottom) {
      const deep = ctx.createLinearGradient(0, nearBottom, 0, Math.min(H, nearBottom + 560));
      // the near hills' own mass continues for a moment so their lower edge
      // never reads as a cut, then dissolves into mist and distance
      deep.addColorStop(0, alpha(GOL.color.shade(P.hillNear, 0.18), 0.92));
      deep.addColorStop(0.11, alpha(P.mist, 0.5));
      deep.addColorStop(0.4, alpha(GOL.color.shade(P.skyLow, 0.16), 0.82));
      deep.addColorStop(1, GOL.color.shade(P.skyLow, 0.4));
      ctx.fillStyle = deep;
      ctx.fillRect(0, nearBottom, W, H - nearBottom);
    }

    // ---- terrain: the same single composite pass the adventure scene bakes
    const stoneTiles = new Set();
    for (const p of L.props) {
      if (p.type === 'stepStone') stoneTiles.add(Math.floor(p.x / TILE) + ',' + Math.floor(p.y / TILE));
    }
    for (let x = 0; x < L.w; x++) {
      for (let y = 0; y < L.h; y++) {
        const v = L.tiles[y * L.w + x];
        if (v === 4) {
          const h = (x * 7 + y * 13) % 5;
          ctx.drawImage(h === 0 ? atlas.block : h % 2 ? atlas.blockPlain : atlas.blockPlain2, x * TILE, y * TILE);
        } else if (v === 1) {
          const solid = (xx, yy) => {
            if (xx < 0 || xx >= L.w) return true;
            if (yy < 0) return false;
            if (yy >= L.h) return true;
            const tt = L.tiles[yy * L.w + xx];
            return tt === 1 || tt === 4;
          };
          let mask = 0;
          if (!solid(x, y - 1)) mask |= 1;
          if (!solid(x + 1, y)) mask |= 2;
          if (!solid(x, y + 1)) mask |= 4;
          if (!solid(x - 1, y)) mask |= 8;
          const deepDown = solid(x, y - 1) && solid(x, y - 2);
          ctx.drawImage(mask === 0 && deepDown ? atlas.deep : atlas['g' + mask], x * TILE, y * TILE);
        } else if (v === 2 && !stoneTiles.has(x + ',' + y)) {
          const isSlab = (xx) => xx >= 0 && xx < L.w && L.tiles[y * L.w + xx] === 2 && !stoneTiles.has(xx + ',' + y);
          const l = isSlab(x - 1), r = isSlab(x + 1);
          const kind = l && r ? 'M' : l ? 'R' : r ? 'L' : 'S';
          ctx.drawImage(atlas['slab' + kind], x * TILE, y * TILE);
        }
      }
    }
    // the depth wash that darkens everything below each surface
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    for (let x = 0; x < L.w; x++) {
      let surf = L.h;
      for (let y = 0; y < L.h; y++) {
        const tt = L.tiles[y * L.w + x];
        if (tt === 1 || tt === 4) { surf = y; break; }
      }
      if (surf >= L.h) continue;
      const top = (surf + 0.6) * TILE;
      const g = ctx.createLinearGradient(0, top, 0, H);
      g.addColorStop(0, 'rgba(38,50,40,0)');
      g.addColorStop(1, 'rgba(38,50,40,0.34)');
      ctx.fillStyle = g;
      ctx.fillRect(x * TILE, top, TILE, H - top);
    }
    ctx.restore();

    // ---- water bodies (same top-edge run merge as the scene)
    const waterRects = [];
    const seen = new Set();
    for (let y = 0; y < L.h; y++) {
      for (let x = 0; x < L.w; x++) {
        if (L.tiles[y * L.w + x] !== 3 || seen.has(x + ',' + y)) continue;
        if (y > 0 && L.tiles[(y - 1) * L.w + x] === 3) { seen.add(x + ',' + y); continue; }
        let x1 = x;
        while (x1 + 1 < L.w && L.tiles[y * L.w + x1 + 1] === 3 && !(y > 0 && L.tiles[(y - 1) * L.w + x1 + 1] === 3)) x1++;
        for (let xx = x; xx <= x1; xx++) seen.add(xx + ',' + y);
        waterRects.push({ x: x * TILE, y: y * TILE, w: (x1 - x + 1) * TILE, h: (L.h - y) * TILE });
      }
    }
    for (const w of waterRects) GOL.drawWater(ctx, w.x, w.y, w.w, w.h, t, P);

    // ---- offering stones: painted live in play, so painted here too (closed,
    // with the breathing seam of light along each group's top edge)
    const lidGroups = lids(L);
    for (const g of lidGroups) {
      for (const cell of g.cells) ctx.drawImage(atlas.lid, cell.x * TILE, cell.y * TILE);
      ctx.fillStyle = alpha('#FFE9A8', 0.26);
      for (const cell of g.tops) ctx.fillRect(cell.x * TILE + 4, cell.y * TILE + 1, TILE - 8, 3);
    }

    // ---- the world's own great fixture, drawn at full restoration
    if (L.drawLandmark) {
      try { L.drawLandmark(ctx, t, P, L, k); } catch (e) { /* a landmark that wants live scene state simply sits this out */ }
    }

    // ---- props, then the fixed beats, then life
    for (const p of L.props) drawProp(ctx, p, t, P, sprites);
    if (L.campfire) drawCampfire(ctx, L.campfire.x, L.campfire.y, t);
    if (L.memory) drawMemoryStone(ctx, L.memory, t, P);
    if (L.door) GOL.drawArch(ctx, L.door.x, L.door.y, t, P, 0.24, 0.7);
    for (const cr of L.creatures) {
      if (cr.type === 'bird') GOL.drawBird(ctx, cr.x, cr.y, t + cr.phase, P, cr);
      else if (cr.type === 'butterfly') GOL.drawButterfly(ctx, cr.x, cr.y, t, cr.phase, cr.colA || '#F0C878', cr.colB || '#F7EFDA');
      else if (cr.type === 'tortoise') GOL.drawTortoise(ctx, cr.x, cr.y, t + cr.phase, P, cr.dir);
    }
    for (const p of L.pads) GOL.drawBounceBlossom(ctx, p.x, p.y, t, 0);
    // drifting leaves and rafts, frozen at the middle of their run
    for (const m of L.moverDefs) {
      const pos = moverMid(m);
      GOL.drawDriftLeaf(ctx, pos.x, pos.y, m.hw, t, m.phase || 0, 0);
    }
    for (let i = 0; i < L.seeds.length; i++) GOL.drawSeed(ctx, L.seeds[i].x, L.seeds[i].y, t, i * 1.7);
    for (const bx of L.lightboxes || []) drawLightbox(ctx, bx, t);
    if (L.blossom) GOL.drawRahmaBlossom(ctx, L.blossom.x, L.blossom.y, 13, t);
    L.gems.forEach((g, i) => {
      GOL.drawGem(ctx, g.x, g.y, 15, GOL.GEMS[(g.ayah - 1) % 7], t, { phase: i * 1.7 });
    });
    for (const wf of L.waterfalls) GOL.drawWaterfall(ctx, wf.x, wf.y, 34, wf.h, t, P);
    // the wanderer, standing where the world begins
    if (L.start) {
      GOL.drawSprite(ctx, L.start.x, L.start.y, {
        vx: 0, vy: 0, grounded: true, facing: 1, t, idleT: 2, blink: 0,
        squashX: 1, squashY: 1, moving: false
      });
    }
    // Foreground curtains. In play these are nearly opaque until the child
    // steps behind them — painted that way here they would hide a third of a
    // world like Takathur, which is exactly what the map exists to show. So
    // they are drawn as the map's one deliberate x-ray: a ghost of the
    // curtain, with the beats overlay outlining where it really falls.
    for (const o of L.occluders || []) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = o.color;
      GOL.roundRect(ctx, o.x, o.y, o.w, o.h, 26);
      ctx.fill();
      ctx.restore();
    }

    // ---- the veils the scene lays over everything (screen-space in play)
    if (!L.night && P1 && k < 1) {
      ctx.fillStyle = alpha('#25333E', 0.26 * (1 - k));
      ctx.fillRect(0, 0, W, H);
    }
    if (L.weather === 'rain' && k < 1) {
      ctx.fillStyle = alpha('#2E3B48', 0.2 * (1 - k));
      ctx.fillRect(0, 0, W, H);
    }

    return { canvas: c, L, P };
  }

  // the flattener itself, exposed so a sweep can paint every world at once
  // (a contact sheet, a regression eye) without driving this page's UI
  GOL.levelMapPaint = paintWorld;

  // contiguous groups of offering stones (tile 5), with their open top edges
  function lids(L) {
    const groups = [], grouped = new Set();
    for (let y = 0; y < L.h; y++) {
      for (let x = 0; x < L.w; x++) {
        if (L.tiles[y * L.w + x] !== 5 || grouped.has(x + ',' + y)) continue;
        const g = { cells: [], tops: [] };
        const q = [[x, y]];
        grouped.add(x + ',' + y);
        while (q.length) {
          const [cx, cy] = q.pop();
          g.cells.push({ x: cx, y: cy });
          if (cy === 0 || L.tiles[(cy - 1) * L.w + cx] !== 5) g.tops.push({ x: cx, y: cy });
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = cx + dx, ny = cy + dy, kk = nx + ',' + ny;
            if (nx < 0 || nx >= L.w || ny < 0 || ny >= L.h || grouped.has(kk)) continue;
            if (L.tiles[ny * L.w + nx] !== 5) continue;
            grouped.add(kk);
            q.push([nx, ny]);
          }
        }
        groups.push(g);
      }
    }
    return groups;
  }

  function moverMid(m) {
    if (m.kind === 'v') return { x: m.x, y: (m.y0 + m.y1) / 2 };
    return { x: (m.x0 + m.x1) / 2, y: m.y };
  }

  // props / campfire / memory stone / lightbox, lifted from adventure.js so the
  // map shows exactly the sprites the game draws
  function drawProp(ctx, p, t, P, S) {
    const spr = {
      olive: () => S.olive[p.v % 3], cypress: () => S.cypress[p.v % 2],
      bush: () => S.bush[p.v % 3], flowers: () => S.flowers[p.v % 3],
      lantern: () => S.lantern, sundial: () => S.sundial,
      stepStone: () => S.stepStone[p.v % 2],
      fruit: () => S.fruit[p.v % 3], palm: () => S.palm[p.v % 2],
      fig: () => S.fig[p.v % 2], column: () => S.column[p.v % 2]
    }[p.type];
    if (p.type === 'wall') {
      const c = p._c || (p._c = S.wall(p.n || 2));
      ctx.drawImage(c, p.x - c._anchor.x, p.y - c._anchor.y);
    } else if (p.type === 'fountain') {
      GOL.drawFountain(ctx, p.x, p.y, t, P, 1);
    } else if (p.type === 'tuft') {
      const sway = Math.sin(t * 1.6 + p.x * 0.05) * 2.5;
      ctx.strokeStyle = alpha(p.v === 1 ? P.grassLight : P.grass, 0.95);
      ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(p.x + i * 3, p.y);
        ctx.quadraticCurveTo(p.x + i * 3 + sway * 0.4, p.y - 8, p.x + i * 2.2 + sway, p.y - 13 - Math.abs(i));
        ctx.stroke();
      }
    } else if (spr) {
      const c = spr();
      ctx.drawImage(c, p.x - c._anchor.x, p.y - c._anchor.y);
    }
  }

  function drawCampfire(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#C9BC9A';
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 26, -3 + Math.sin(a) * 7, 6.5, 4.5, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#8A6B4F';
    ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-16, -4); ctx.lineTo(14, -14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(16, -4); ctx.lineTo(-14, -14); ctx.stroke();
    const fl = (w, h, c, sp, ph) => {
      const sway = Math.sin(t * sp + ph) * 3;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(-w, -10);
      ctx.quadraticCurveTo(-w * 0.7, -10 - h * 0.5, sway, -10 - h);
      ctx.quadraticCurveTo(w * 0.7, -10 - h * 0.5, w, -10);
      ctx.closePath();
      ctx.fill();
    };
    const glow = ctx.createRadialGradient(0, -22, 4, 0, -22, 90);
    glow.addColorStop(0, alpha('#FFD98E', 0.44));
    glow.addColorStop(1, alpha('#FFD98E', 0));
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, -22, 90, 0, Math.PI * 2); ctx.fill();
    fl(13, 30 + Math.sin(t * 4) * 3, alpha('#E8896B', 0.85), 3.4, 0);
    fl(9, 24 + Math.sin(t * 5.2) * 3, alpha('#F7D98C', 0.9), 4.2, 1.4);
    fl(5, 16 + Math.sin(t * 6) * 2, alpha('#FFFBEA', 0.95), 5, 2.6);
    ctx.restore();
  }

  function drawMemoryStone(ctx, m, t, P) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.fillStyle = GOL.color.shade(P.stone || '#B9AE92', 0.06);
    ctx.beginPath();
    ctx.moveTo(-24, 0); ctx.lineTo(-19, -34); ctx.lineTo(19, -36); ctx.lineTo(24, 0);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = alpha('#FFE9A8', 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -19, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function drawLightbox(ctx, bx, t) {
    ctx.save();
    ctx.translate(bx.x, bx.y);
    ctx.fillStyle = '#8A6B4F';
    GOL.roundRect(ctx, -17, -30, 34, 30, 6);
    ctx.fill();
    ctx.fillStyle = alpha('#FFE9A8', 0.55 + 0.2 * Math.sin(t * 2));
    ctx.fillRect(-14, -18, 28, 3);
    ctx.restore();
  }

  // ----------------------------------------------------------- the viewer --
  const el = (id) => document.getElementById(id);
  const view = el('view');
  const vctx = view.getContext('2d');
  const cam = { x: 0, y: 0, z: 1 };
  let art = null;       // { canvas, L, P }
  let def = null;       // the world recipe
  let worldN = 4;       // Al-Qadr is the test subject

  const TILE_COLORS = {
    1: '#7BB07B', // ground / stone — solid, climbable
    2: '#F0C878', // one-way slab — you rise through it, land on it
    3: '#5AA9D6', // water — never a hazard
    4: '#C9A8E0', // carved stone
    5: '#F7EFDA'  // offering stone (opens underfoot)
  };
  const TILE_NAMES = { 0: 'air', 1: 'ground', 2: 'slab', 3: 'water', 4: 'carved stone', 5: 'offering stone' };

  function worldList() {
    return (GOL.WORLDS3 || []).filter((w) => w && w.build);
  }

  function fit() {
    if (!art) return;
    const r = view.getBoundingClientRect();
    const z = Math.min(r.width / art.canvas.width, (r.height - 26) / art.canvas.height);
    cam.z = z;
    cam.x = (art.canvas.width - r.width / z) / 2;
    cam.y = (art.canvas.height - (r.height - 26) / z) / 2;
    draw();
  }

  function zoomAt(sx, sy, factor) {
    const before = { x: cam.x + sx / cam.z, y: cam.y + sy / cam.z };
    cam.z = Math.max(0.05, Math.min(6, cam.z * factor));
    cam.x = before.x - sx / cam.z;
    cam.y = before.y - sy / cam.z;
    draw();
  }

  function resize() {
    const r = view.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    view.width = Math.max(1, Math.round(r.width * dpr));
    view.height = Math.max(1, Math.round(r.height * dpr));
    draw();
  }

  // ------------------------------------------------------------- overlays --
  function s(v) { return v * cam.z; }
  function sx(wx) { return (wx - cam.x) * cam.z; }
  function sy(wy) { return (wy - cam.y) * cam.z; }

  function pill(ctx, x, y, text, color) {
    ctx.font = '600 12px Nunito, system-ui, sans-serif';
    const w = ctx.measureText(text).width + 12;
    ctx.fillStyle = 'rgba(20,27,22,.78)';
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - 9, w, 18, 9);
    ctx.fill();
    ctx.strokeStyle = alpha(color, 0.75);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + 1);
  }

  function marker(ctx, wx, wy, label, color, dy) {
    const x = sx(wx), y = sy(wy);
    if (x < -140 || y < -90 || x > vwCss + 140 || y > vhCss + 90) return;
    ctx.strokeStyle = alpha(color, 0.9);
    ctx.fillStyle = alpha(color, 0.16);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // the label rides above the pin, but never behind the column ruler
    const ly = Math.max(28, y - 9 + (dy || -16) - 10);
    ctx.beginPath();
    ctx.moveTo(x, y - 9); ctx.lineTo(x, ly + 9);
    ctx.stroke();
    pill(ctx, x, ly, label, color);
  }

  let vwCss = 0, vhCss = 0; // viewport in CSS px — overlays are drawn there

  function drawOverlay(ctx) {
    const L = art.L;
    const dpr = view.width / view.getBoundingClientRect().width;
    ctx.save();
    ctx.scale(dpr, dpr);
    const vw = vwCss = view.width / dpr, vh = vhCss = view.height / dpr;

    // ---- tile-type wash
    if (el('tTiles').checked) {
      const x0 = Math.max(0, Math.floor(cam.x / TILE)), x1 = Math.min(L.w - 1, Math.ceil((cam.x + vw / cam.z) / TILE));
      const y0 = Math.max(0, Math.floor(cam.y / TILE)), y1 = Math.min(L.h - 1, Math.ceil((cam.y + vh / cam.z) / TILE));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const v = L.tiles[y * L.w + x];
          if (!v) continue;
          ctx.fillStyle = alpha(TILE_COLORS[v] || '#FFFFFF', 0.42);
          ctx.fillRect(sx(x * TILE), sy(y * TILE), s(TILE) + 0.5, s(TILE) + 0.5);
        }
      }
    }

    // ---- tile grid
    if (el('tGrid').checked) {
      const step = s(TILE) < 7 ? 4 : 1;
      ctx.lineWidth = 1;
      for (let x = 0; x <= L.w; x += step) {
        ctx.strokeStyle = alpha('#F5EDD4', x % 4 === 0 ? 0.22 : 0.08);
        ctx.beginPath(); ctx.moveTo(Math.round(sx(x * TILE)) + 0.5, sy(0)); ctx.lineTo(Math.round(sx(x * TILE)) + 0.5, sy(L.h * TILE)); ctx.stroke();
      }
      for (let y = 0; y <= L.h; y += step) {
        ctx.strokeStyle = alpha('#F5EDD4', y % 4 === 0 ? 0.22 : 0.08);
        ctx.beginPath(); ctx.moveTo(sx(0), Math.round(sy(y * TILE)) + 0.5); ctx.lineTo(sx(L.w * TILE), Math.round(sy(y * TILE)) + 0.5); ctx.stroke();
      }
    }

    // ---- the collection route: gem 1 → 2 → 3 …, the order the surah is built
    if (el('tRoute').checked && L.gems.length) {
      ctx.setLineDash([7, 6]);
      ctx.strokeStyle = alpha('#FFF3C4', 0.62);
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (L.start) ctx.moveTo(sx(L.start.x), sy(L.start.y - 20));
      else ctx.moveTo(sx(L.gems[0].x), sy(L.gems[0].y));
      for (const g of L.gems) ctx.lineTo(sx(g.x), sy(g.y));
      if (L.campfire) ctx.lineTo(sx(L.campfire.x), sy(L.campfire.y - 20));
      if (L.door) ctx.lineTo(sx(L.door.x), sy(L.door.y - 20));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ---- the beats
    if (el('tBeats').checked) {
      L.gems.forEach((g) => {
        const x = sx(g.x), y = sy(g.y);
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20,27,22,.72)';
        ctx.fill();
        ctx.strokeStyle = '#F0C878';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#F0C878';
        ctx.font = '800 12px Nunito, system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(g.ayah), x, y + 1);
      });
      if (L.start) marker(ctx, L.start.x, L.start.y, 'start', '#FFFBEE', -26);
      if (L.campfire) marker(ctx, L.campfire.x, L.campfire.y, 'campfire', '#E8896B', -40);
      if (L.door) marker(ctx, L.door.x, L.door.y, 'shrine door', '#C9A8E0', -60);
      if (L.memory) marker(ctx, L.memory.x, L.memory.y, 'memory stone', '#8FD3C7', -30);
      if (L.blossom) marker(ctx, L.blossom.x, L.blossom.y, 'secret bloom', '#F2A0C0', -22);
      for (const p of L.pads) marker(ctx, p.x, p.y, 'bounce', '#9BD98C', -22);
      for (const b of L.lightboxes || []) marker(ctx, b.x, b.y, 'guiding light', '#FFE9A8', -26);
      for (const wf of L.waterfalls) marker(ctx, wf.x, wf.y, 'waterfall', '#7EC8E8', -18);
      // movers: the leaf's or raft's whole run, drawn as its travel line
      ctx.strokeStyle = alpha('#8FD3C7', 0.85);
      ctx.lineWidth = 2;
      for (const m of L.moverDefs) {
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        if (m.kind === 'v') { ctx.moveTo(sx(m.x), sy(m.y0)); ctx.lineTo(sx(m.x), sy(m.y1)); }
        else { ctx.moveTo(sx(m.x0), sy(m.y)); ctx.lineTo(sx(m.x1), sy(m.y)); }
        ctx.stroke();
        ctx.setLineDash([]);
        const mid = moverMid(m);
        pill(ctx, sx(mid.x), sy(mid.y) - 20, m.kind === 'raft' ? 'raft' : 'leaf lift', '#8FD3C7');
      }
      // gallop runs: the stretches where the wind is at her back
      for (const g of L.gallops || []) {
        ctx.fillStyle = alpha('#F0C878', 0.14);
        ctx.fillRect(sx(g.x0), sy(0), s(g.x1 - g.x0), s(L.h * TILE));
      }
      // foreground curtains: where the near-opaque cloth really falls (the
      // art layer only ghosts it, so what it hides can still be read)
      ctx.strokeStyle = alpha('#B9C9AE', 0.8);
      ctx.lineWidth = 1.5;
      for (const o of L.occluders || []) {
        ctx.setLineDash([6, 5]);
        ctx.strokeRect(sx(o.x), sy(o.y), s(o.w), s(o.h));
        ctx.setLineDash([]);
        pill(ctx, sx(o.x + o.w / 2), sy(o.y) - 11, 'curtain', '#B9C9AE');
      }
      // offering stones: one label per contiguous group, on its top edge
      for (const g of lids(L)) {
        const top = g.tops[0] || g.cells[0];
        const cx = g.cells.reduce((a, c) => a + c.x, 0) / g.cells.length;
        marker(ctx, (cx + 0.5) * TILE, top.y * TILE, 'offering stone', '#F7EFDA', -18);
      }
    }

    // ---- the notes we have pinned on this level
    if (el('tNotes').checked) drawNotes(ctx);

    // ---- rulers, pinned to the viewport edges
    ctx.fillStyle = 'rgba(20,27,22,.72)';
    ctx.fillRect(0, 0, vw, 17);
    ctx.fillRect(0, 0, 27, vh);
    ctx.font = '600 10px Nunito, system-ui, sans-serif';
    ctx.fillStyle = '#A9B3A0';
    ctx.textBaseline = 'middle';
    const tstep = s(TILE) >= 26 ? 1 : s(TILE) >= 13 ? 2 : s(TILE) >= 6 ? 4 : 8;
    ctx.textAlign = 'center';
    for (let x = 0; x <= L.w; x += tstep) {
      const px = sx(x * TILE + TILE / 2);
      if (px < 28 || px > vw) continue;
      ctx.fillText(String(x), px, 9);
    }
    ctx.textAlign = 'right';
    for (let y = 0; y <= L.h; y += tstep) {
      const py = sy(y * TILE + TILE / 2);
      if (py < 18 || py > vh - 24) continue; // clear of the status strip
      ctx.fillText(String(y), 23, py);
    }
    ctx.restore();
  }

  function draw() {
    if (!art) return;
    const dpr = view.width / Math.max(1, view.getBoundingClientRect().width);
    vctx.setTransform(1, 0, 0, 1, 0, 0);
    vctx.fillStyle = '#141B16';
    vctx.fillRect(0, 0, view.width, view.height);
    if (el('tArt').checked) {
      vctx.imageSmoothingEnabled = true;
      vctx.setTransform(cam.z * dpr, 0, 0, cam.z * dpr, -cam.x * cam.z * dpr, -cam.y * cam.z * dpr);
      vctx.drawImage(art.canvas, 0, 0);
    }
    vctx.setTransform(1, 0, 0, 1, 0, 0);
    // the level's outer edge, so you can see where the world stops
    vctx.strokeStyle = 'rgba(245,237,212,.35)';
    vctx.lineWidth = 1;
    vctx.strokeRect(sx(0) * dpr, sy(0) * dpr, s(art.canvas.width) * dpr, s(art.canvas.height) * dpr);
    drawOverlay(vctx);
    placeEditor();
    el('stZoom').textContent = Math.round(cam.z * 100) + '%';
  }

  // --------------------------------------------------------------- notes ---
  // Pinned annotations: the whole point of the map is that Hasnain and an
  // agent can point at the SAME spot. A note is a tile coordinate plus a
  // sentence, kept in this browser and shared two ways:
  //   · Copy   → markdown (+ a json block) to paste straight into chat
  //   · ⤓ / ⤒ → a json file that can be committed to
  //             v3/reviews/level-notes/wN-<key>.json, which this page then
  //             loads as the shared baseline for everyone who opens it.
  const NOTE_KEY = 'gemsOfLight.v3.levelNotes';
  const store = { author: '', notes: {}, deleted: {} };
  let repoNotes = [];   // the committed baseline for the world on screen
  let selected = null;  // id of the note the editor is showing
  let addMode = false;

  function loadStore() {
    try {
      const raw = JSON.parse(localStorage.getItem(NOTE_KEY) || '{}');
      Object.assign(store, { author: raw.author || '', notes: raw.notes || {}, deleted: raw.deleted || {} });
    } catch (e) { /* a corrupt draft is not worth blocking the viewer over */ }
  }
  function saveStore() {
    try { localStorage.setItem(NOTE_KEY, JSON.stringify(store)); } catch (e) { /* private mode */ }
  }
  // the committed notes for this world, if the file exists (404 is normal —
  // most worlds have never been reviewed). Fetched once per world per visit.
  const repoCache = {};
  function loadRepoNotes(n) {
    repoNotes = repoCache[n] || [];
    const w = GOL.WORLDS3[n - 1];
    if (!w || repoCache[n]) return Promise.resolve();
    return fetch('reviews/level-notes/w' + n + '-' + w.key + '.json', { cache: 'no-store' })
      .then((r) => (r.ok && /json/.test(r.headers.get('content-type') || '') ? r.json() : null))
      .then((j) => { repoNotes = repoCache[n] = Array.isArray(j) ? j : []; })
      .catch(() => { repoNotes = repoCache[n] = []; });
  }
  // repo baseline first, this browser's edits on top, tombstones removed
  function notesFor(n) {
    const m = new Map();
    for (const nt of repoNotes) if (nt && nt.id && nt.world === n) m.set(nt.id, Object.assign({ source: 'repo' }, nt));
    for (const id of Object.keys(store.notes)) {
      const nt = store.notes[id];
      if (nt && nt.world === n) m.set(id, nt);
    }
    for (const id of Object.keys(store.deleted)) m.delete(id);
    return [...m.values()].sort((a, b) => (a.ts || 0) - (b.ts || 0));
  }
  function noteById(id) {
    return notesFor(worldN).find((nt) => nt.id === id) || null;
  }

  function drawNotes(ctx) {
    const list = notesFor(worldN);
    list.forEach((nt, i) => {
      const x = sx(nt.tx * TILE), y = sy(nt.ty * TILE);
      if (x < -60 || y < -60 || x > vwCss + 60 || y > vhCss + 60) return;
      const col = nt.done ? '#9BD98C' : '#FFC46B';
      const on = nt.id === selected;
      ctx.beginPath();
      ctx.moveTo(x, y);                 // the pin's point sits ON the spot
      ctx.lineTo(x - 6, y - 11);
      ctx.lineTo(x + 6, y - 11);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(x - 11, y - 33, 22, 22, 7);
      ctx.fillStyle = on ? col : 'rgba(20,27,22,.86)';
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = on ? 2.5 : 1.8;
      ctx.stroke();
      ctx.fillStyle = on ? '#1D271F' : col;
      ctx.font = '800 12px Nunito, system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), x, y - 21);
    });
  }

  function hitNote(px, py) {
    const list = notesFor(worldN);
    for (let i = list.length - 1; i >= 0; i--) {
      const nt = list[i];
      const x = sx(nt.tx * TILE), y = sy(nt.ty * TILE);
      if (Math.abs(px - x) < 13 && py > y - 35 && py < y + 4) return nt;
    }
    return null;
  }

  function openEditor(nt) {
    selected = nt.id;
    const ed = el('editor');
    ed.hidden = false;
    el('noteText').value = nt.text || '';
    el('noteAuthor').value = nt.author || store.author || '';
    el('noteDone').checked = !!nt.done;
    el('noteWhere').textContent = 'tile ' + Math.floor(nt.tx) + ', ' + Math.floor(nt.ty) +
      (nt.source === 'repo' ? ' · from the repo' : '');
    placeEditor();
    el('noteText').focus();
    renderNotes();
    draw();
  }
  function placeEditor() {
    const ed = el('editor');
    if (ed.hidden || !selected) return;
    const nt = noteById(selected);
    if (!nt) return;
    const r = el('stage').getBoundingClientRect();
    const x = Math.max(8, Math.min(r.width - 276, sx(nt.tx * TILE) - 134));
    const y = Math.max(24, Math.min(r.height - 190, sy(nt.ty * TILE) + 14));
    ed.style.left = x + 'px';
    ed.style.top = y + 'px';
  }
  function closeEditor() {
    el('editor').hidden = true;
    selected = null;
    renderNotes();
    draw();
  }
  function saveEditor() {
    if (!selected) return;
    const nt = Object.assign({}, noteById(selected));
    nt.text = el('noteText').value.trim();
    nt.author = el('noteAuthor').value.trim() || 'hasnain';
    nt.done = el('noteDone').checked;
    nt.ts = nt.ts || Date.now();
    delete nt.source;
    store.author = nt.author;
    if (!nt.text) { deleteNote(nt.id); return; }
    store.notes[nt.id] = nt;
    delete store.deleted[nt.id];
    saveStore();
    closeEditor();
  }
  function deleteNote(id) {
    delete store.notes[id];
    store.deleted[id] = true; // tombstone, so a repo note stays deleted here
    saveStore();
    closeEditor();
  }
  // a note that came from the repo becomes this browser's copy as soon as it
  // is touched, so edits and drags never fight the committed file
  function mutable(nt) {
    if (!store.notes[nt.id]) {
      const c = Object.assign({}, nt);
      delete c.source;
      store.notes[nt.id] = c;
    }
    return store.notes[nt.id];
  }

  function addNoteAt(wx, wy) {
    const nt = {
      id: 'n' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
      world: worldN, key: art.L.key,
      tx: Math.round((wx / TILE) * 100) / 100, ty: Math.round((wy / TILE) * 100) / 100,
      text: '', author: store.author || 'hasnain', done: false, ts: Date.now()
    };
    store.notes[nt.id] = nt;
    openEditor(nt);
  }

  function renderNotes() {
    const list = notesFor(worldN);
    const open = list.filter((n) => !n.done).length;
    el('panelNotes').innerHTML =
      '<h2>Notes on this level <span class="note">(' + open + ' open / ' + list.length + ')</span></h2>' +
      (list.length ? list.map((nt, i) =>
        '<div class="noteRow' + (nt.done ? ' done' : '') + '" data-id="' + nt.id + '">' +
        '<b>' + (i + 1) + '</b><span><em>(' + Math.floor(nt.tx) + ', ' + Math.floor(nt.ty) + ')</em> ' +
        esc(nt.text || '…') + '<br><span class="who">' + esc(nt.author || '') +
        (nt.source === 'repo' ? ' · repo' : '') + '</span></span></div>'
      ).join('')
        : '<p class="note">No notes yet. Press <b>＋ Pin</b> (or N), then click the spot you want to talk about.</p>');
    [...el('panelNotes').querySelectorAll('.noteRow')].forEach((row) => {
      row.addEventListener('click', () => {
        const nt = noteById(row.dataset.id);
        if (!nt) return;
        // bring the spot into view, then open it
        const r = view.getBoundingClientRect();
        cam.x = nt.tx * TILE - r.width / (2 * cam.z);
        cam.y = nt.ty * TILE - r.height / (2 * cam.z);
        draw();
        openEditor(nt);
      });
    });
  }

  function notesMarkdown() {
    const L = art.L, list = notesFor(worldN);
    const head = '### ' + ((L.surah && L.surah.englishName) || L.key) + ' — level notes (world ' +
      worldN + ', v3/js/worlds/' + fileFor(worldN) + ')';
    const lines = list.map((nt, i) =>
      '- [' + (nt.done ? 'x' : ' ') + '] **' + (i + 1) + '. tile (' + Math.floor(nt.tx) + ', ' +
      Math.floor(nt.ty) + ')** — ' + (nt.text || '') + ' _(' + (nt.author || '?') + ')_');
    const json = JSON.stringify(list.map((nt) => {
      const c = Object.assign({}, nt); delete c.source; return c;
    }), null, 1);
    return head + '\n' + (lines.join('\n') || '_(none)_') +
      '\n\n<details><summary>notes json — commit to v3/reviews/level-notes/w' + worldN + '-' + L.key +
      '.json</summary>\n\n```json\n' + json + '\n```\n</details>\n';
  }

  // --------------------------------------------------------------- panel ---
  function fillPanel() {
    const L = art.L, p = el('panelBuild');
    const surah = L.surah || {};
    const counts = { ground: 0, slab: 0, water: 0, carved: 0, lid: 0 };
    for (let i = 0; i < L.tiles.length; i++) {
      const v = L.tiles[i];
      if (v === 1) counts.ground++;
      else if (v === 2) counts.slab++;
      else if (v === 3) counts.water++;
      else if (v === 4) counts.carved++;
      else if (v === 5) counts.lid++;
    }
    const tile = (x, y) => '(' + x + ', ' + y + ')';
    const gemRows = L.gems.map((g) => {
      const v = (surah.verses || []).find((vv) => vv.n === g.ayah);
      return '<div class="gem"><b>' + g.ayah + '</b><span><em>' +
        tile(Math.floor(g.x / TILE), Math.floor(g.y / TILE)) + '</em> · ' +
        (v ? esc(v.meaning || v.tr || '') : '') + '</span></div>';
    }).join('');
    const propTally = tally(L.props.map((x) => x.type));
    const creatureTally = tally(L.creatures.map((x) => x.type));
    const notes = [];
    if (L.night) notes.push('This world plays in darkness — the map shows it fully lit so the construction reads.');
    if (L.occluders && L.occluders.length) {
      notes.push(L.occluders.length + ' foreground curtain(s), nearly opaque in play, are ghosted here so what they hide can be read — the dashed outline is where the cloth really falls.');
    }
    if (L.flock) notes.push('An ambient flock wheels in this sky during play; the map leaves it out.');
    if (L.endPalette) notes.push('Palette drifts <b>' + L.palette + ' → ' + L.endPalette + '</b> as gems are gathered; drag the Gems slider.');
    if (L.weather) notes.push('Weather: ' + L.weather + ' (thins as the world is restored).');
    if (L.campShrines) notes.push('Night camps: ' + L.campShrines.length + ' checkpoint shrine(s) along the way.');
    notes.push('Sky and clouds are screen-anchored in play; here they are painted once across the world, and the sun\'s ray fan is left out entirely. The parallax hills sit on the world horizon (row 13.4) exactly as a player sees them.');

    p.innerHTML =
      '<h1>' + esc(surah.englishName || L.key) + ' — ' + esc(L.name || '') + '</h1>' +
      '<p class="sub">' + esc(surah.meaningName || '') + ' · surah ' + (L.surahId || '?') + ' · world ' + worldN + '</p>' +
      '<h2>Build</h2><table>' +
      row('recipe', 'v3/js/worlds/' + fileFor(worldN)) +
      row('size', L.w + ' × ' + L.h + ' tiles (' + (L.w * TILE) + ' × ' + (L.h * TILE) + ' px)') +
      row('palette', swatch(GOL.PALETTES[L.palette].skyMid) + L.palette + (L.endPalette ? ' → ' + swatch(GOL.PALETTES[L.endPalette].skyMid) + L.endPalette : '')) +
      row('gems / ayat', L.gems.length + ' / ' + ((surah.verses || []).length || '?')) +
      row('tiles', counts.ground + ' ground · ' + counts.slab + ' slab · ' + counts.water + ' water' +
        (counts.carved ? ' · ' + counts.carved + ' carved' : '') + (counts.lid ? ' · ' + counts.lid + ' offering' : '')) +
      row('props', L.props.length + ' <span class="note">(' + propTally + ')</span>') +
      row('creatures', L.creatures.length + ' <span class="note">(' + creatureTally + ')</span>') +
      row('noor seeds', L.seeds.length) +
      row('waterfalls', L.waterfalls.length) +
      row('movers', L.moverDefs.length) +
      row('start', L.start ? tile(Math.floor(L.start.x / TILE), Math.floor(L.start.y / TILE)) : '—') +
      row('campfire', L.campfire ? tile(Math.floor(L.campfire.x / TILE), Math.floor(L.campfire.y / TILE)) : '—') +
      row('shrine door', L.door ? tile(Math.floor(L.door.x / TILE), Math.floor(L.door.y / TILE)) : '—') +
      row('secret', L.blossom ? tile(L.blossom.tx, L.blossom.ty) + ' (bloom)' : '—') +
      '</table>' +
      '<h2>Gems, in order</h2>' + gemRows +
      '<h2>Reading the map</h2><p class="note">' + notes.join('</p><p class="note">') + '</p>';
  }
  function row(k, v) { return '<tr><td class="k">' + k + '</td><td>' + v + '</td></tr>'; }
  function swatch(c) { return '<span class="swatch" style="background:' + c + '"></span>'; }
  function esc(s2) { return String(s2).replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])); }
  function tally(list) {
    const m = {};
    for (const x of list) m[x] = (m[x] || 0) + 1;
    return Object.keys(m).sort((a, b) => m[b] - m[a]).map((k2) => m[k2] + ' ' + k2).join(', ');
  }
  function fileFor(n) {
    const w = GOL.WORLDS3[n - 1];
    return 'w' + n + '-' + (w ? w.key : '?') + '.js';
  }

  // ---------------------------------------------------------------- load ---
  function load(n, keepView) {
    worldN = n;
    def = GOL.WORLDS3[n - 1];
    if (!def || !def.build) return;
    el('busy').classList.add('on');
    closeEditor();
    loadRepoNotes(n).then(() => { if (art) renderNotes(); });
    // let the browser paint "painting…" before the (heavy) atlas build
    setTimeout(() => {
      const k = parseFloat(el('restore').value);
      art = paintWorld(def, k, 1.35);
      el('stSize').textContent = art.L.w + '×' + art.L.h + ' tiles';
      const total = art.L.gems.length;
      el('restoreLabel').textContent = 'Gems ' + Math.round(k * total) + '/' + total;
      fillPanel();
      renderNotes();
      el('busy').classList.remove('on');
      if (keepView) draw(); else fit();
    }, 16);
  }

  // --------------------------------------------------------------- events --
  const bar = {
    world: el('world'), restore: el('restore')
  };
  worldList().forEach((w) => {
    const o = document.createElement('option');
    const surah = GOL.surahForWorld ? GOL.surahForWorld(w) : null;
    o.value = w.n;
    o.textContent = w.n + ' · ' + (surah ? surah.englishName : w.key) + ' — ' + (w.name || '');
    bar.world.appendChild(o);
  });
  // …and the same on the way back: extension-less on Pages (whose .html
  // redirect is fatal inside the root service worker), .html on a file server.
  const backLink = document.querySelector('a.back');
  if (backLink) backLink.href = 'levels' + (/\.html$/.test(location.pathname) ? '.html' : '');

  const q = new URLSearchParams(location.search);
  worldN = parseInt(q.get('w') || '4', 10);
  if (!GOL.WORLDS3[worldN - 1] || !GOL.WORLDS3[worldN - 1].build) worldN = 4;
  bar.world.value = String(worldN);

  bar.world.addEventListener('change', () => {
    const n = parseInt(bar.world.value, 10);
    history.replaceState(null, '', '?w=' + n);
    load(n);
  });
  bar.restore.addEventListener('input', () => {
    if (!art) return;
    const total = art.L.gems.length;
    el('restoreLabel').textContent = 'Gems ' + Math.round(parseFloat(bar.restore.value) * total) + '/' + total;
  });
  bar.restore.addEventListener('change', () => load(worldN, true));
  ['tBeats', 'tRoute', 'tGrid', 'tTiles', 'tArt', 'tNotes'].forEach((id) => el(id).addEventListener('change', draw));

  // ---- notes: drop, edit, share
  function setAddMode(on) {
    addMode = on;
    el('addNote').classList.toggle('on', on);
    view.classList.toggle('pin', on);
    el('stHint').textContent = on
      ? 'click the spot you want to note'
      : 'drag to pan · wheel or pinch to zoom · double-click to zoom in';
  }
  el('addNote').addEventListener('click', () => setAddMode(!addMode));
  el('noteSave').addEventListener('click', saveEditor);
  el('noteCancel').addEventListener('click', () => {
    // an untouched, never-saved pin should not linger on the map
    const nt = selected ? noteById(selected) : null;
    if (nt && !nt.text) deleteNote(nt.id); else closeEditor();
  });
  el('noteDelete').addEventListener('click', () => { if (selected) deleteNote(selected); });
  el('noteText').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); saveEditor(); }
    if (e.key === 'Escape') { e.preventDefault(); el('noteCancel').click(); }
  });
  el('copyNotes').addEventListener('click', () => {
    const md = notesMarkdown();
    const done = () => { const b = el('copyNotes'); b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy'; }, 1400); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(md).then(done, () => window.prompt('Copy the notes:', md));
    else window.prompt('Copy the notes:', md);
  });
  el('exportNotes').addEventListener('click', () => {
    const list = notesFor(worldN).map((nt) => { const c = Object.assign({}, nt); delete c.source; return c; });
    const blob = new Blob([JSON.stringify(list, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.download = 'w' + worldN + '-' + art.L.key + '.json';
    a.href = URL.createObjectURL(blob);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
  el('importBtn').addEventListener('click', () => el('importNotes').click());
  el('importNotes').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    f.text().then((txt) => {
      let list;
      try { list = JSON.parse(txt); } catch (err) { window.alert('That file is not notes JSON.'); return; }
      if (!Array.isArray(list)) { window.alert('That file is not notes JSON.'); return; }
      for (const nt of list) {
        if (!nt || !nt.id) continue;
        store.notes[nt.id] = nt;
        delete store.deleted[nt.id];
      }
      saveStore();
      renderNotes();
      draw();
    });
    e.target.value = '';
  });
  el('fit').addEventListener('click', fit);
  el('one').addEventListener('click', () => { cam.z = 1; draw(); });
  el('zoomIn').addEventListener('click', () => zoomAt(view.getBoundingClientRect().width / 2, view.getBoundingClientRect().height / 2, 1.3));
  el('zoomOut').addEventListener('click', () => zoomAt(view.getBoundingClientRect().width / 2, view.getBoundingClientRect().height / 2, 1 / 1.3));
  el('togglePanel').addEventListener('click', () => { el('panel').classList.toggle('hide'); resize(); });
  el('png').addEventListener('click', () => {
    if (!art) return;
    const a = document.createElement('a');
    a.download = 'gems-of-light-' + (art.L.key || 'world') + '-map.png';
    a.href = art.canvas.toDataURL('image/png');
    a.click();
  });

  // pan / zoom — mouse, trackpad and touch
  let drag = null;
  const pointers = new Map();
  let pinch = null;
  let downAt = null;   // start of a press, so a click can be told from a drag
  let noteDrag = null; // the pin currently being carried to a better spot
  view.addEventListener('pointerdown', (e) => {
    view.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    downAt = { x: e.clientX, y: e.clientY };
    // pressing an existing pin picks it up instead of panning the map
    if (art && pointers.size === 1 && el('tNotes').checked) {
      const r = view.getBoundingClientRect();
      const hit = hitNote(e.clientX - r.left, e.clientY - r.top);
      if (hit) { noteDrag = { id: hit.id }; return; }
    }
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z };
      drag = null;
    } else {
      drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y };
      view.classList.add('drag');
    }
  });
  view.addEventListener('pointermove', (e) => {
    const r = view.getBoundingClientRect();
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top };
      const target = Math.max(0.05, Math.min(6, pinch.z * (d / pinch.d)));
      zoomAt(mid.x, mid.y, target / cam.z);
      return;
    }
    if (noteDrag) {
      const nt = mutable(noteById(noteDrag.id) || { id: noteDrag.id });
      nt.tx = Math.round(((cam.x + (e.clientX - r.left) / cam.z) / TILE) * 100) / 100;
      nt.ty = Math.round(((cam.y + (e.clientY - r.top) / cam.z) / TILE) * 100) / 100;
      draw();
      return;
    }
    if (drag) {
      cam.x = drag.cx - (e.clientX - drag.x) / cam.z;
      cam.y = drag.cy - (e.clientY - drag.y) / cam.z;
      draw();
    }
    if (!art) return;
    const wx = cam.x + (e.clientX - r.left) / cam.z, wy = cam.y + (e.clientY - r.top) / cam.z;
    const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
    el('stTile').textContent = tx >= 0 && ty >= 0 && tx < art.L.w && ty < art.L.h
      ? 'tile ' + tx + ', ' + ty + ' · ' + TILE_NAMES[art.L.tiles[ty * art.L.w + tx]]
      : '—';
  });
  const up = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!pointers.size) { drag = null; view.classList.remove('drag'); }
    // a press that never travelled is a click: open a pin, or drop a new one
    if (!art || !downAt) { noteDrag = null; return; }
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (noteDrag) {
      const id = noteDrag.id;
      noteDrag = null;
      if (moved > 4) { saveStore(); renderNotes(); draw(); return; } // carried
      const nt = noteById(id);
      if (nt) { openEditor(nt); return; }
    }
    if (moved > 4) return;
    const r = view.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const hit = el('tNotes').checked ? hitNote(px, py) : null;
    if (hit) { openEditor(hit); return; }
    if (addMode) {
      el('tNotes').checked = true;
      addNoteAt(cam.x + px / cam.z, cam.y + py / cam.z);
      setAddMode(false);
      return;
    }
    if (selected) closeEditor();
  };
  view.addEventListener('pointerup', up);
  view.addEventListener('pointercancel', up);
  view.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = view.getBoundingClientRect();
    zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.12 : 1 / 1.12);
  }, { passive: false });
  view.addEventListener('dblclick', (e) => {
    const r = view.getBoundingClientRect();
    zoomAt(e.clientX - r.left, e.clientY - r.top, 1.9);
  });
  window.addEventListener('keydown', (e) => {
    const tag = e.target && e.target.tagName;
    if (tag === 'SELECT') return;
    if (tag === 'TEXTAREA' || tag === 'INPUT') return; // typing a note
    if (e.key === 'Escape') { setAddMode(false); el('noteCancel').click(); return; }
    const k = e.key.toLowerCase();
    if (k === 'n') { setAddMode(!addMode); return; }
    if (k === 'f') fit();
    else if (k === '0') { cam.z = 1; draw(); }
    else if (k === '+' || k === '=') zoomAt(view.getBoundingClientRect().width / 2, view.getBoundingClientRect().height / 2, 1.3);
    else if (k === '-') zoomAt(view.getBoundingClientRect().width / 2, view.getBoundingClientRect().height / 2, 1 / 1.3);
    else if (k === 'g') { el('tGrid').checked = !el('tGrid').checked; draw(); }
    else if (k === 'b') { el('tBeats').checked = !el('tBeats').checked; draw(); }
    else if (k === 't') { el('tTiles').checked = !el('tTiles').checked; draw(); }
  });
  window.addEventListener('resize', resize);

  loadStore();
  resize();
  load(worldN);
})();
