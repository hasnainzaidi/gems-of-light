// Gems of Light — art.js  (v2: concept-art edition)
// The painterly core: palette, gouache helpers, skies, parallax hills, tile atlas.
// Art directed by the storyboards in concept-art/: warm cream masonry, layered
// garden greens, restrained gold, watercolor paper grain. Light from the
// upper-right. No hard black outlines anywhere — edges are darker tones of the
// same hue, softly wobbled, the way a brush leaves them.
(function () {
  const GOL = (window.GOL = window.GOL || {});
  const TILE = (GOL.TILE = 48);

  // ---------------------------------------------------------------- rng ----
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  GOL.rng = mulberry32;

  // -------------------------------------------------------------- colors ---
  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r, g, b) {
    const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return '#' + c(r) + c(g) + c(b);
  }
  function mix(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  }
  const shade = (h, t) => mix(h, '#243626', t);   // darken toward deep garden green
  const tint = (h, t) => mix(h, '#FFFCEF', t);    // lighten toward warm cream
  function alpha(h, a) {
    const c = hexToRgb(h);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }
  GOL.color = { mix, shade, tint, alpha };

  // ------------------------------------------------------------- palettes --
  // World One: The Garden, tuned against the concept boards — soft blue-green
  // skies settling into warm parchment, cream-tan masonry, mossy layered greens.
  const BASE_PAL = {
    skyTop: '#AFD6C4', skyMid: '#DEEEC9', skyLow: '#F9E9BC',
    sun: '#FFF6D9', sunGlow: '#FFE9A6',
    cloud: '#FCF5E2',
    hillFar: '#B9D6AF', hillMid: '#8FBC88', hillNear: '#6BA96F',
    mist: '#F3EDD5',
    grass: '#7FB56A', grassLight: '#A8D488', grassDark: '#5C9450',
    moss: '#6FA55B', mossDeep: '#4C8348',
    soil: '#C7AB80', soilDark: '#A28359', pebble: '#DAC8A4',
    stone: '#E9DDB6', stoneLight: '#F4EBCE', stoneShade: '#CDBD93', stoneDark: '#A99771',
    mortar: '#B4A27B',
    waterHi: '#CBECDC', water: '#84C6B2', waterDeep: '#4F9E90',
    trunk: '#8C6D50', trunkDark: '#6F5441',
    leaf: '#79B369', leafLight: '#A6D68A', leafDark: '#54904D', leafDeep: '#3E7A44',
    blossom: '#FAF3E1', lavender: '#9D9BC8',
    gold: '#EEC67C', goldDeep: '#C89B55',
    dew: '#EAF6E9',
    ray: '#FFF3C4'
  };
  function pal(over) { return Object.assign({}, BASE_PAL, over || {}); }

  GOL.PALETTES = {
    // The Spring — fresh mint, lots of water light.
    kawthar: pal({ skyTop: '#A8D4C8', skyMid: '#D9EDD0', hillFar: '#B5D8BA', waterHi: '#D2F1E2' }),
    // The Meadow — airy, pale, wide open.
    ikhlas: pal({ skyTop: '#B7DCC4', skyMid: '#E4F0CC', skyLow: '#FAECC0', hillFar: '#C2DBB1' }),
    // The Old Olive — later morning, warmer golds.
    asr: pal({ skyTop: '#B0D2B0', skyMid: '#E7EBBC', skyLow: '#F7DFA2', grass: '#86BC66', stone: '#EBDCAE', gold: '#F1C471' }),
    // Daybreak Hollow — starts dusky; scenes lerp toward `falaqEnd` across the level.
    falaq: pal({ skyTop: '#7FA0A8', skyMid: '#A8C2B2', skyLow: '#E2C69A', sun: '#FFEFC2', hillFar: '#94B4A2', hillMid: '#78A181', hillNear: '#5A9062', grass: '#6CAA5F', grassLight: '#90C77D', mist: '#DEDBC0', stone: '#DCCFA8' }),
    falaqEnd: pal({ skyTop: '#B1DCC2', skyMid: '#E6F2CA', skyLow: '#FBE9B2' }),
    // The Village Garden — lively, full green.
    nas: pal({ skyTop: '#A5D4C2', skyMid: '#D7ECC4', hillNear: '#65A96C', grass: '#78BC64' }),
    // The Garden Gate — radiant, the fullest morning.
    fatiha: pal({ skyTop: '#A1D2C4', skyMid: '#E0F0C6', skyLow: '#FBE7AC', sunGlow: '#FFE99E', grassLight: '#AEDE8E', gold: '#F3CC7C' })
  };

  // Gem greens — one per ayah position. Each carries its own crystal cut now,
  // matching the varied silhouettes on the ordering-gate board.
  GOL.GEMS = [
    { name: 'mint',    base: '#96E2B4', cut: 'hex' },
    { name: 'seafoam', base: '#72D6C3', cut: 'prism' },
    { name: 'jade',    base: '#4FC08D', cut: 'kite' },
    { name: 'spring',  base: '#9AD468', cut: 'drop' },
    { name: 'moss',    base: '#71A94C', cut: 'oval' },
    { name: 'pine',    base: '#3D8E70', cut: 'shield' },
    { name: 'emerald', base: '#2EA45B', cut: 'brilliant' }
  ].map((g) => ({
    name: g.name, base: g.base, cut: g.cut,
    light: tint(g.base, 0.55), lighter: tint(g.base, 0.8),
    dark: shade(g.base, 0.3), darker: shade(g.base, 0.5),
    glow: tint(g.base, 0.35)
  }));

  // ------------------------------------------------------- gouache helpers -
  // A wobbled polygon: hand-cut paper edges instead of geometric perfection.
  function wobblePath(ctx, pts, seed, amt) {
    const r = mulberry32(seed);
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const x = p[0] + (r() - 0.5) * amt, y = p[1] + (r() - 0.5) * amt;
      if (i === 0) ctx.moveTo(x, y);
      else {
        const q = pts[i - 1];
        const mx = (q[0] + p[0]) / 2 + (r() - 0.5) * amt;
        const my = (q[1] + p[1]) / 2 + (r() - 0.5) * amt;
        ctx.quadraticCurveTo(mx, my, x, y);
      }
    }
    ctx.closePath();
  }
  // Paint dabs: little strokes of light/dark that make a flat fill feel brushed.
  function dabs(ctx, x, y, w, h, color, n, seed, rMin, rMax) {
    const r = mulberry32(seed);
    ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const px = x + r() * w, py = y + r() * h;
      const rad = rMin + r() * (rMax - rMin);
      ctx.beginPath();
      ctx.ellipse(px, py, rad * (0.7 + r() * 0.6), rad * 0.6, r() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Soft round blob (canopies, clouds, mist).
  function blob(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // A little painted leaf, the recurring signature of the boards.
  function leafShape(ctx, x, y, len, wid, rot, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.45, -wid, len, 0);
    ctx.quadraticCurveTo(len * 0.45, wid, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    return c;
  }
  GOL.paint = { wobblePath, dabs, blob, leafShape, makeCanvas };

  // ------------------------------------------------------------- the sky ---
  // Drawn live each frame (cheap), with sun bloom, watercolor mottle, drifting
  // clouds and — far off — the tiny birds from the first board.
  const _mottleCache = {};
  function skyMottle(P) {
    const key = P.skyTop + P.skyMid;
    if (_mottleCache[key]) return _mottleCache[key];
    const c = makeCanvas(420, 280);
    const x = c.getContext('2d');
    const r = mulberry32(99);
    // soft irregular washes, like pigment settling into paper
    for (let i = 0; i < 26; i++) {
      const col = i % 3 === 0 ? tint(P.skyMid, 0.5) : i % 3 === 1 ? P.skyTop : tint(P.skyLow, 0.3);
      x.fillStyle = alpha(col, 0.05 + r() * 0.05);
      x.beginPath();
      x.ellipse(r() * 420, r() * 280, 40 + r() * 90, 18 + r() * 40, r() * Math.PI, 0, Math.PI * 2);
      x.fill();
    }
    _mottleCache[key] = c;
    return c;
  }
  function drawSky(ctx, w, h, P, t, camX) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, P.skyTop);
    g.addColorStop(0.55, P.skyMid);
    g.addColorStop(1, P.skyLow);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // watercolor mottle, barely there
    const m = skyMottle(P);
    ctx.save();
    ctx.globalAlpha = 0.55;
    for (let mx = 0; mx < w; mx += m.width)
      for (let my = 0; my < h * 0.8; my += m.height)
        ctx.drawImage(m, mx, my);
    ctx.restore();

    // morning sun, upper right, gentle bloom
    const sx = w * 0.78, sy = h * 0.22;
    const bloom = ctx.createRadialGradient(sx, sy, 0, sx, sy, h * 0.58);
    bloom.addColorStop(0, alpha(P.sunGlow, 0.52));
    bloom.addColorStop(0.35, alpha(P.sunGlow, 0.17));
    bloom.addColorStop(1, alpha(P.sunGlow, 0));
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = alpha(P.sun, 0.92);
    ctx.beginPath(); ctx.arc(sx, sy, h * 0.052, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = alpha(P.sun, 0.35);
    ctx.beginPath(); ctx.arc(sx, sy, h * 0.085, 0, Math.PI * 2); ctx.fill();

    // clouds: three slow bands, parallax barely-there
    for (let band = 0; band < 3; band++) {
      const speed = 4 + band * 3;
      const y = h * (0.12 + band * 0.13);
      const off = ((t * speed + camX * (0.02 + band * 0.015)) % (w + 420)) - 210;
      drawCloud(ctx, w - off, y, 1 - band * 0.18, P);
      drawCloud(ctx, w - off - w * 0.55, y + h * 0.05, 0.8 - band * 0.15, P);
    }

    // distant birds — two or three slow specks circling the morning
    ctx.strokeStyle = alpha(shade(P.skyTop, 0.45), 0.5);
    ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const bt = t * 0.021 + i * 2.1;
      const bx = w * (0.18 + 0.6 * ((Math.sin(bt) + 1) / 2)) + Math.cos(bt * 3.1) * 30;
      const by = h * (0.1 + 0.1 * i) + Math.sin(bt * 2.3) * 14;
      const fl = Math.sin(t * 3 + i * 2) * 2.2;
      const s = 4 - i * 0.8;
      ctx.beginPath();
      ctx.moveTo(bx - s, by + fl * 0.4);
      ctx.quadraticCurveTo(bx, by - s * 0.8 - fl, bx, by);
      ctx.quadraticCurveTo(bx, by - s * 0.8 - fl, bx + s, by + fl * 0.4);
      ctx.stroke();
    }
  }
  function drawCloud(ctx, x, y, s, P) {
    if (s <= 0) return;
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    blob(ctx, 0, 0, 26, alpha(P.cloud, 0.7));
    blob(ctx, 28, 6, 20, alpha(P.cloud, 0.65));
    blob(ctx, -30, 8, 18, alpha(P.cloud, 0.65));
    blob(ctx, 8, 12, 24, alpha(P.cloud, 0.75));
    blob(ctx, -8, -8, 17, alpha(tint(P.cloud, 0.5), 0.55));
    // underside shading — warm, not grey
    blob(ctx, 4, 16, 18, alpha(P.skyLow, 0.35));
    ctx.restore();
  }
  GOL.drawSky = drawSky;

  // ----------------------------------------------------------- hill strips -
  // Tileable parallax hills, pre-rendered once per level. Summed integer-cycle
  // sines keep the left and right edges continuous.
  function buildHillStrip(W, H, opts) {
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    const r = mulberry32(opts.seed);
    const ks = [1, 2, 3, 5].map((k) => ({
      k, amp: (opts.amp * (0.5 + r() * 0.8)) / k, ph: r() * Math.PI * 2
    }));
    const ridge = (x) => {
      let y = opts.base;
      for (const s of ks) y += s.amp * Math.sin((2 * Math.PI * s.k * x) / W + s.ph);
      return y;
    };
    // body
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 6) ctx.lineTo(x, ridge(x));
    ctx.lineTo(W, H);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, opts.base - opts.amp, 0, H);
    g.addColorStop(0, tint(opts.color, 0.18));
    g.addColorStop(0.6, opts.color);
    g.addColorStop(1, shade(opts.color, 0.12));
    ctx.fillStyle = g;
    ctx.fill();
    // brushed texture on the slope
    ctx.save();
    ctx.clip();
    dabs(ctx, 0, opts.base - opts.amp, W, H - (opts.base - opts.amp), alpha(tint(opts.color, 0.3), 0.25), Math.round(W / 14), opts.seed + 1, 5, 16);
    dabs(ctx, 0, opts.base, W, H - opts.base, alpha(shade(opts.color, 0.2), 0.18), Math.round(W / 18), opts.seed + 2, 6, 18);
    // hedgerow shadows following the ridge
    ctx.fillStyle = alpha(shade(opts.color, 0.25), 0.12);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 12) ctx.lineTo(x, ridge(x) + 12 + i * 16 + Math.sin(x * 0.05 + i) * 4);
      ctx.lineTo(W, H);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // trees / shrubs standing on the ridge: round garden trees and the odd cypress
    if (opts.trees) {
      for (let i = 0; i < opts.trees; i++) {
        const x = (i + 0.3 + r() * 0.5) * (W / opts.trees);
        const y = ridge(x) + 2;
        const s = 0.5 + r() * 0.9;
        const col = mix(opts.color, opts.treeColor || shade(opts.color, 0.25), 0.8);
        if (r() < 0.28) {
          // cypress: the calm exclamation mark of the boards
          ctx.fillStyle = alpha(shade(col, 0.15), 0.95);
          ctx.beginPath();
          ctx.moveTo(x, y - 30 * s);
          ctx.quadraticCurveTo(x + 5 * s, y - 16 * s, x + 3.5 * s, y);
          ctx.lineTo(x - 3.5 * s, y);
          ctx.quadraticCurveTo(x - 5 * s, y - 16 * s, x, y - 30 * s);
          ctx.fill();
          blob(ctx, x - 1 * s, y - 22 * s, 2.6 * s, alpha(tint(col, 0.2), 0.8));
        } else {
          ctx.fillStyle = alpha(shade(col, 0.1), 0.9);
          ctx.fillRect(x - 1.5 * s, y - 10 * s, 3 * s, 10 * s);
          blob(ctx, x, y - 15 * s, 8 * s, alpha(col, 0.95));
          blob(ctx, x - 6 * s, y - 11 * s, 5.5 * s, alpha(col, 0.9));
          blob(ctx, x + 6 * s, y - 11 * s, 5.5 * s, alpha(col, 0.9));
          blob(ctx, x - 2 * s, y - 18 * s, 4.5 * s, alpha(tint(col, 0.18), 0.85));
        }
      }
    }
    // mist along the bottom edge
    const m = ctx.createLinearGradient(0, H * 0.55, 0, H);
    m.addColorStop(0, alpha(opts.mist, 0));
    m.addColorStop(1, alpha(opts.mist, 0.55));
    ctx.fillStyle = m;
    ctx.fillRect(0, 0, W, H);
    return c;
  }

  // Draw a tileable strip with parallax offset, anchored to a horizon line.
  function drawStrip(ctx, strip, camX, factor, y, viewW) {
    const w = strip.width;
    let off = (-camX * factor) % w;
    if (off > 0) off -= w;
    for (let x = off; x < viewW; x += w) ctx.drawImage(strip, Math.round(x), Math.round(y));
  }
  GOL.buildHillStrip = buildHillStrip;
  GOL.drawStrip = drawStrip;

  // ------------------------------------------------------------ tile atlas -
  // The boards build their garden out of old cream masonry: sun-warmed brick
  // courses, moss settling in the joints, grass crowning every walkable edge.
  // Ground autotiles keyed by exposure mask (up,right,down,left bits), plus
  // one-way stone slabs and carved blocks. Everything pre-rendered per palette.
  function buildTileAtlas(P, seed) {
    const atlas = {};
    const T = TILE;

    // paint one weathered brick with a hand-cut edge
    function brick(x, bx, by, bw, bh, rs, base) {
      const r = mulberry32(rs);
      const tone = mix(base, r() < 0.5 ? P.stoneShade : P.stoneLight, r() * 0.5);
      wobblePath(x, [[bx + 1, by + 1], [bx + bw - 1, by + 1], [bx + bw - 1, by + bh - 1], [bx + 1, by + bh - 1]], rs, 2);
      const g = x.createLinearGradient(bx, by, bx + bw * 0.4, by + bh);
      g.addColorStop(0, tint(tone, 0.16));
      g.addColorStop(1, shade(tone, 0.08));
      x.fillStyle = g;
      x.fill();
      // settle: a soft lower shadow inside the brick
      x.fillStyle = alpha(shade(tone, 0.22), 0.25);
      x.beginPath();
      x.ellipse(bx + bw * 0.3, by + bh - 2.5, bw * 0.32, 2, 0, 0, Math.PI * 2);
      x.fill();
      if (r() < 0.4) dabs(x, bx + 2, by + 2, bw - 4, bh - 4, alpha(P.stoneDark, 0.14), 2, rs + 5, 1, 2.2);
      if (r() < 0.22) blob(x, bx + bw * (0.2 + r() * 0.6), by + bh * 0.5, 1.6, alpha(P.moss, 0.5));
    }

    // fill a tile with two offset brick courses over mortar
    function brickBody(x, rs, dim) {
      x.fillStyle = dim ? shade(P.mortar, 0.24) : P.mortar;
      x.fillRect(0, 0, T, T);
      const base = dim ? shade(P.stone, 0.18) : P.stone;
      for (let row = 0; row < 2; row++) {
        const by = row * (T / 2);
        const offs = row % 2 ? -T / 4 : 0;
        for (let col = -1; col < 3; col++) {
          const bx = offs + col * (T / 2);
          if (bx + T / 2 < -2 || bx > T + 2) continue;
          brick(x, bx, by, T / 2, T / 2, rs + row * 31 + col * 7, base);
        }
      }
    }

    // moss + grass crown draped along the top of a tile
    function crown(x, rs) {
      const gh = 14;
      const gpts = [[-3, 1], [T + 3, 1], [T + 2, gh], [-2, gh]];
      wobblePath(x, gpts, rs + 3, 5);
      const gg = x.createLinearGradient(0, 0, 0, gh + 5);
      gg.addColorStop(0, P.grassLight);
      gg.addColorStop(0.45, P.grass);
      gg.addColorStop(1, P.mossDeep);
      x.fillStyle = gg;
      x.fill();
      x.save(); wobblePath(x, gpts, rs + 3, 5); x.clip();
      dabs(x, 0, 0, T, gh, alpha(tint(P.grassLight, 0.35), 0.55), 6, rs + 4, 1.5, 3);
      dabs(x, 0, gh - 5, T, 6, alpha(P.mossDeep, 0.5), 4, rs + 6, 2, 4);
      x.restore();
      // scalloped moss fringe hanging below the crown line
      const rr = mulberry32(rs + 12);
      x.fillStyle = alpha(P.moss, 0.85);
      for (let i = 0; i < 4; i++) {
        const fx = 5 + rr() * (T - 10);
        x.beginPath();
        x.ellipse(fx, gh + 1.5, 3.5 + rr() * 2.5, 3 + rr() * 2, 0, 0, Math.PI);
        x.fill();
      }
      // blades reaching up past the tile top
      const r = mulberry32(rs + 5);
      for (let i = 0; i < 6; i++) {
        const bx = 3 + r() * (T - 6), bh = 4 + r() * 8, lean = (r() - 0.5) * 5;
        x.strokeStyle = alpha(r() < 0.5 ? P.grass : P.grassLight, 0.9);
        x.lineWidth = 1.6; x.lineCap = 'round';
        x.beginPath(); x.moveTo(bx, 4); x.quadraticCurveTo(bx + lean, 4 - bh * 0.6, bx + lean * 1.6, 3 - bh); x.stroke();
      }
      // now and then: a tiny white blossom or a dew drop catching the sun
      if (r() < 0.4) {
        const fx = 6 + r() * (T - 12);
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2;
          blob(x, fx + Math.cos(a) * 2.1, 2.5 + Math.sin(a) * 2.1, 1.5, alpha(P.blossom, 0.95));
        }
        blob(x, fx, 2.5, 1.1, alpha(P.gold, 0.9));
      }
      if (r() < 0.45) {
        const dx2 = 6 + r() * (T - 12);
        blob(x, dx2, 6 + r() * 5, 1.8, alpha(P.dew, 0.85));
        blob(x, dx2 - 0.5, 5.4 + r() * 5, 0.7, 'rgba(255,255,255,0.95)');
      }
    }

    // -- ground: weathered masonry with a living crown where the top is exposed
    for (let mask = 0; mask < 16; mask++) {
      const up = mask & 1, right = mask & 2, down = mask & 4, left = mask & 8;
      const c = makeCanvas(T, T);
      const x = c.getContext('2d');
      const rseed = seed + mask * 7;

      brickBody(x, rseed, false);

      // side shading + weathering when exposed
      if (left) {
        const gg = x.createLinearGradient(0, 0, 10, 0);
        gg.addColorStop(0, alpha(shade(P.stoneDark, 0.28), 0.5)); gg.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = gg; x.fillRect(0, 0, 10, T);
      }
      if (right) {
        const gg = x.createLinearGradient(T, 0, T - 10, 0);
        gg.addColorStop(0, alpha(tint(P.stoneLight, 0.4), 0.5)); gg.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = gg; x.fillRect(T - 10, 0, 10, T);
      }
      if (down) {
        const gg = x.createLinearGradient(0, T, 0, T - 9);
        gg.addColorStop(0, alpha(shade(P.stoneDark, 0.4), 0.55)); gg.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = gg; x.fillRect(0, T - 9, T, 9);
      }

      // ivy strands trailing down exposed faces
      const rv = mulberry32(rseed + 21);
      const ivySide = (ex, dir) => {
        if (rv() > 0.55) return;
        x.strokeStyle = alpha(P.leafDeep, 0.75);
        x.lineWidth = 1.5; x.lineCap = 'round';
        const len = 14 + rv() * 22;
        x.beginPath();
        x.moveTo(ex, 2);
        x.quadraticCurveTo(ex + dir * 4, len * 0.5, ex + dir * (2 + rv() * 4), len);
        x.stroke();
        for (let i = 1; i < 4; i++) {
          leafShape(x, ex + dir * 3, (len / 4) * i, 5, 2.4, dir * 0.9 + i * 0.4, alpha(i % 2 ? P.leaf : P.leafDark, 0.85));
        }
      };
      if (up && left) ivySide(3, 1);
      if (up && right) ivySide(T - 3, -1);

      if (up) crown(x, rseed);

      // grass ears draping over exposed shoulders
      if (up && (left || right)) {
        const drape = (ex, dir) => {
          x.fillStyle = P.grass;
          x.beginPath();
          x.moveTo(ex, 3);
          x.quadraticCurveTo(ex + dir * 8, 9, ex + dir * 5, 22);
          x.quadraticCurveTo(ex + dir * 9, 13, ex + dir * 10, 4);
          x.closePath(); x.fill();
          x.fillStyle = alpha(P.mossDeep, 0.6);
          x.beginPath();
          x.ellipse(ex + dir * 4.5, 16, 2.2, 4.5, dir * 0.3, 0, Math.PI * 2);
          x.fill();
        };
        if (left) drape(2, 1);
        if (right) drape(T - 2, -1);
      }
      atlas['g' + mask] = c;
    }

    // -- deep ground (2+ below the surface): same masonry, sunk in shadow
    const dc = makeCanvas(T, T);
    {
      const x = dc.getContext('2d');
      brickBody(x, seed + 90, true);
      x.fillStyle = alpha(shade(P.stoneDark, 0.35), 0.3);
      x.fillRect(0, 0, T, T);
      dabs(x, 0, 0, T, T, alpha(shade(P.stoneDark, 0.3), 0.24), 4, seed + 91, 1.5, 3.2);
    }
    atlas.deep = dc;

    // -- one-way stone slab: a mossy garden shelf; end pieces trail ferns
    ['L', 'M', 'R', 'S'].forEach((kind, ki) => {
      const c = makeCanvas(T, T);
      const x = c.getContext('2d');
      const rs = seed + 300 + ki * 11;
      const y0 = 8, hgt = 27;
      const rounded = (side) => kind === 'S' || kind === side;
      x.save();
      x.beginPath();
      const rl = rounded('L') ? 9 : 0, rr2 = rounded('R') ? 9 : 0;
      x.moveTo(rl ? 2 + rl : -2, y0);
      x.lineTo(rr2 ? T - 2 - rr2 : T + 2, y0);
      if (rr2) x.quadraticCurveTo(T - 2, y0, T - 2, y0 + rr2);
      x.lineTo(rr2 ? T - 2 : T + 2, y0 + hgt - (rr2 ? 6 : 0));
      if (rr2) x.quadraticCurveTo(T - 2, y0 + hgt, T - 2 - rr2, y0 + hgt);
      x.lineTo(rl ? 2 + rl : -2, y0 + hgt);
      if (rl) x.quadraticCurveTo(2, y0 + hgt, 2, y0 + hgt - 6);
      x.lineTo(rl ? 2 : -2, y0 + rl);
      if (rl) x.quadraticCurveTo(2, y0, 2 + rl, y0);
      x.closePath();
      const g = x.createLinearGradient(0, y0, 0, y0 + hgt);
      g.addColorStop(0, tint(P.stone, 0.42));
      g.addColorStop(0.4, P.stone);
      g.addColorStop(1, shade(P.stoneShade, 0.12));
      x.fillStyle = g; x.fill();
      x.clip();
      dabs(x, 0, y0, T, hgt, alpha(P.stoneDark, 0.22), 4, rs, 1.5, 3.5);
      dabs(x, 0, y0, T, 8, alpha(tint(P.stoneLight, 0.5), 0.6), 3, rs + 1, 2, 4);
      // a mortar seam and settled underside shadow
      x.strokeStyle = alpha(P.stoneDark, 0.4); x.lineWidth = 1.6;
      x.beginPath(); x.moveTo(0, y0 + hgt - 7); x.lineTo(T, y0 + hgt - 7); x.stroke();
      x.fillStyle = alpha(shade(P.stoneDark, 0.35), 0.5);
      x.fillRect(0, y0 + hgt - 3, T, 3);
      // a thin line of moss along the sunlit top edge
      const rm = mulberry32(rs + 8);
      x.fillStyle = alpha(P.moss, 0.75);
      for (let i = 0; i < 4; i++) {
        x.beginPath();
        x.ellipse(4 + rm() * (T - 8), y0 + 1.5, 3 + rm() * 3, 1.6, 0, 0, Math.PI * 2);
        x.fill();
      }
      x.restore();
      // soft cast shadow just below the slab
      const shg = x.createLinearGradient(0, y0 + hgt, 0, y0 + hgt + 8);
      shg.addColorStop(0, 'rgba(46,64,50,0.22)');
      shg.addColorStop(1, 'rgba(46,64,50,0)');
      x.fillStyle = shg;
      x.fillRect(2, y0 + hgt, T - 4, 8);
      // trailing moss + a small fern frond on the ends
      if (kind !== 'M') {
        const r = mulberry32(rs + 2);
        const edges = kind === 'S' ? ['L', 'R'] : [kind];
        for (const e of edges) {
          const ex = e === 'L' ? 6 : T - 6;
          x.fillStyle = alpha(P.grass, 0.85);
          for (let i = 0; i < 3; i++) {
            const mx = ex + (r() - 0.5) * 8;
            x.beginPath();
            x.ellipse(mx, y0 + 3 + i * 3, 4 - i, 6 - i * 1.5, 0, 0, Math.PI * 2);
            x.fill();
          }
          const dir = e === 'L' ? -1 : 1;
          for (let i = 0; i < 3; i++) {
            leafShape(x, ex + dir * 3, y0 + 6 + i * 5, 7 - i, 2.6, dir * (0.5 + i * 0.35), alpha(i % 2 ? P.leaf : P.leafDark, 0.8));
          }
        }
      }
      atlas['slab' + kind] = c;
    });

    // -- carved cream blocks (garden houses, hollows, towers).
    // Smooth ashlar, a quiet carved frame; the eight-point star only here
    // and there, with a whisper of green-tile inlay as on the gate board.
    const mkBlock = (withStar, vseed) => {
      const c = makeCanvas(T, T);
      const x = c.getContext('2d');
      wobblePath(x, [[1.5, 1.5], [T - 1.5, 1.5], [T - 1.5, T - 1.5], [1.5, T - 1.5]], vseed, 2.5);
      const g = x.createLinearGradient(0, 0, T, T);
      g.addColorStop(0, tint(P.stoneLight, 0.3));
      g.addColorStop(1, P.stoneShade);
      x.fillStyle = g; x.fill();
      x.save();
      wobblePath(x, [[1.5, 1.5], [T - 1.5, 1.5], [T - 1.5, T - 1.5], [1.5, T - 1.5]], vseed, 2.5);
      x.clip();
      dabs(x, 0, 0, T, T, alpha(P.stoneDark, 0.13), 4, vseed + 1, 1.5, 3.5);
      dabs(x, 0, 0, T, 14, alpha(tint(P.stoneLight, 0.5), 0.4), 3, vseed + 2, 2, 4);
      x.strokeStyle = alpha(P.stoneDark, 0.26); x.lineWidth = 1.5;
      x.strokeRect(7, 7, T - 14, T - 14);
      if (withStar) {
        star8(x, T / 2, T / 2, 7, Math.PI / 8, alpha(mix(P.stoneDark, '#5E8F72', 0.5), 0.4));
        star8(x, T / 2, T / 2, 4.2, Math.PI / 8, alpha(tint(P.stoneLight, 0.4), 0.75));
      }
      x.restore();
      return c;
    };
    atlas.block = mkBlock(true, seed + 500);
    atlas.blockPlain = mkBlock(false, seed + 520);
    atlas.blockPlain2 = mkBlock(false, seed + 540);

    return atlas;
  }
  GOL.buildTileAtlas = buildTileAtlas;

  // Eight-point star (two overlapping rotated squares) — the ornament motif.
  function star8(ctx, cx, cy, r, rot, fill) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = fill;
    for (let k = 0; k < 2; k++) {
      ctx.save();
      ctx.rotate(rot + (k * Math.PI) / 4);
      ctx.beginPath();
      ctx.rect(-r, -r, r * 2, r * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
  GOL.star8 = star8;

  // Filled eight-point star outline version (for rosettes / sockets)
  function star8Path(ctx, cx, cy, r, rot) {
    const pts = [];
    for (let i = 0; i < 16; i++) {
      const a = rot + (i * Math.PI) / 8;
      const rad = i % 2 === 0 ? r : r * 0.72;
      pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
    }
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.closePath();
  }
  GOL.star8Path = star8Path;

  // --------------------------------------------------- paper grain overlay -
  // The whole game sits on watercolor paper. A pre-rendered grain tile is laid
  // over the finished frame (from drawVignette, which every scene calls last).
  let _grain = null;
  function grainTile() {
    if (_grain) return _grain;
    const c = makeCanvas(256, 256);
    const x = c.getContext('2d');
    const r = mulberry32(4242);
    for (let i = 0; i < 420; i++) {
      const px = r() * 256, py = r() * 256;
      const warm = r() < 0.5;
      x.fillStyle = warm ? 'rgba(120,100,60,' + (0.02 + r() * 0.035) + ')' : 'rgba(255,252,238,' + (0.02 + r() * 0.045) + ')';
      x.beginPath();
      x.ellipse(px, py, 0.6 + r() * 1.7, 0.5 + r() * 1.2, r() * Math.PI, 0, Math.PI * 2);
      x.fill();
    }
    // a few longer paper fibres
    x.strokeStyle = 'rgba(140,120,80,0.03)';
    x.lineWidth = 0.8;
    for (let i = 0; i < 30; i++) {
      const px = r() * 256, py = r() * 256;
      x.beginPath();
      x.moveTo(px, py);
      x.quadraticCurveTo(px + (r() - 0.5) * 20, py + (r() - 0.5) * 20, px + (r() - 0.5) * 34, py + (r() - 0.5) * 34);
      x.stroke();
    }
    _grain = c;
    return c;
  }

  // ------------------------------------------------------------ vignette ---
  function drawVignette(ctx, w, h, strength) {
    // paper grain first, then the gentle darkening toward the corners
    const g0 = grainTile();
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let x = 0; x < w; x += 256)
      for (let y = 0; y < h; y += 256)
        ctx.drawImage(g0, x, y);
    ctx.restore();
    const g = ctx.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.75);
    g.addColorStop(0, 'rgba(30,43,34,0)');
    g.addColorStop(1, 'rgba(30,43,34,' + (strength || 0.16) + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  GOL.drawVignette = drawVignette;

  // Godrays from the sun corner — very soft, drawn over the far layers.
  function drawRays(ctx, w, h, P, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const sx = w * 0.78, sy = h * 0.18;
    for (let i = 0; i < 4; i++) {
      const a = Math.PI * 0.62 + i * 0.09 + Math.sin(t * 0.13 + i * 1.7) * 0.012;
      const len = h * 1.35, wid = 0.055 + 0.02 * Math.sin(t * 0.21 + i);
      const g = ctx.createLinearGradient(sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len);
      const pulse = 0.05 + 0.025 * Math.sin(t * 0.4 + i * 2.1);
      g.addColorStop(0, alpha(P.ray, pulse));
      g.addColorStop(1, alpha(P.ray, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(a - wid) * len, sy + Math.sin(a - wid) * len);
      ctx.lineTo(sx + Math.cos(a + wid) * len, sy + Math.sin(a + wid) * len);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  GOL.drawRays = drawRays;

  // Lerp two palettes (for Al-Falaq's daybreak drift across the level).
  function lerpPal(A, B, t) {
    if (t <= 0) return A;
    if (t >= 1) return B;
    const out = {};
    for (const k in A) out[k] = B[k] && A[k] !== B[k] ? mix(A[k], B[k], t) : A[k];
    return out;
  }
  GOL.lerpPal = lerpPal;
})();
