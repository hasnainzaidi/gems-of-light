// Gems of Light — art.js
// The painterly core: palette, gouache helpers, skies, parallax hills, tile atlas.
// Light comes from the upper-right (morning sun in the east). No hard black
// outlines anywhere — edges are darker tones of the same hue, softly wobbled.
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
  const shade = (h, t) => mix(h, '#1E2B22', t);   // darken toward deep green-black
  const tint = (h, t) => mix(h, '#FFFBEE', t);    // lighten toward warm cream
  function alpha(h, a) {
    const c = hexToRgb(h);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }
  GOL.color = { mix, shade, tint, alpha };

  // ------------------------------------------------------------- palettes --
  // World One: The Garden. Morning gold. Each level bends the base gently.
  const BASE_PAL = {
    skyTop: '#A9D8C8', skyMid: '#DCEDCB', skyLow: '#F9E8B8',
    sun: '#FFF4D6', sunGlow: '#FFE9A8',
    cloud: '#FDF6E4',
    hillFar: '#BCD8B2', hillMid: '#93C08D', hillNear: '#6FAD72',
    mist: '#F4EFD8',
    grass: '#7CBF6B', grassLight: '#A6DA8C', grassDark: '#5B9C52',
    soil: '#C4A981', soilDark: '#A08159', pebble: '#D8C6A2',
    stone: '#EAE0C6', stoneShade: '#CBBC97', stoneDark: '#AB9C78',
    waterHi: '#BFE8DC', water: '#8FCFC2', waterDeep: '#57A79E',
    trunk: '#8A6B4F', trunkDark: '#6E5340',
    leaf: '#77B368', leafLight: '#A3D488', leafDark: '#54904D',
    gold: '#F0C878', goldDeep: '#D9A44A',
    ray: '#FFF3C4'
  };
  function pal(over) { return Object.assign({}, BASE_PAL, over || {}); }

  GOL.PALETTES = {
    // The Spring — fresh mint, lots of water light.
    kawthar: pal({ skyTop: '#A5D6CC', skyMid: '#D8EDD2', hillFar: '#B7D9BC', waterHi: '#CBEFE2' }),
    // The Meadow — airy, pale, wide open.
    ikhlas: pal({ skyTop: '#B4DCC6', skyMid: '#E3F0CE', skyLow: '#FAECC2', hillFar: '#C4DCB4' }),
    // The Old Olive — later morning, warmer golds.
    asr: pal({ skyTop: '#AFD2B4', skyMid: '#E6EBBE', skyLow: '#F7DFA4', grass: '#84BC68', soil: '#C9A87B', gold: '#F3C671' }),
    // Daybreak Hollow — starts dusky; scenes lerp toward `falaqEnd` across the level.
    falaq: pal({ skyTop: '#7FA3AC', skyMid: '#A9C4B4', skyLow: '#E3C79C', sun: '#FFEFC2', hillFar: '#96B6A4', hillMid: '#7AA383', hillNear: '#5C9264', grass: '#6BAA60', grassLight: '#8FC77E', mist: '#DFDCC2' }),
    falaqEnd: pal({ skyTop: '#AFDCC4', skyMid: '#E5F2CC', skyLow: '#FBE9B4' }),
    // The Village Garden — lively, full green.
    nas: pal({ skyTop: '#A2D4C4', skyMid: '#D6ECC6', hillNear: '#67A96E', grass: '#76BC66' }),
    // The Garden Gate — radiant, the fullest morning.
    fatiha: pal({ skyTop: '#9ED2C6', skyMid: '#DFF0C8', skyLow: '#FBE7AE', sunGlow: '#FFE9A0', grassLight: '#ACDE90', gold: '#F4CD7E' })
  };

  // World Two: The Orchard. Afternoon light, dappled shade, fruit on the bough.
  const ORCHARD = {
    skyTop: '#A3CBAB', skyMid: '#DCE8B4', skyLow: '#F8DCA2',
    sun: '#FFF2CC', sunGlow: '#FFE29A', ray: '#FFEFB4',
    hillFar: '#B5CFA0', hillMid: '#8CB47F', hillNear: '#699F63',
    grass: '#7CB863', grassLight: '#A4D384', grassDark: '#5A954D',
    leaf: '#6FAA58', leafLight: '#98CB77', leafDark: '#4E8746',
    soil: '#C7A87A', gold: '#F2C46E'
  };
  const palO = (over) => Object.assign({}, BASE_PAL, ORCHARD, over || {});

  // World Three: The Courtyard. Late afternoon, warm stone, long shadows.
  const COURTYARD = {
    skyTop: '#B3C9A9', skyMid: '#E7DFAE', skyLow: '#F6CE92',
    sun: '#FFEFC0', sunGlow: '#FFD98E', ray: '#FFE9AC',
    hillFar: '#C1C69E', hillMid: '#9AAC7C', hillNear: '#77975F',
    mist: '#F0E3C4',
    grass: '#8CB061', grassLight: '#B0CC80', grassDark: '#6A8F4C',
    stone: '#F0E0BE', stoneShade: '#D2BC90', stoneDark: '#B29768',
    soil: '#CCA678', trunk: '#8F6E50',
    gold: '#F3C572', goldDeep: '#DCA346',
    waterHi: '#C4E4D2', water: '#8FC9B8', waterDeep: '#5A9E92'
  };
  const palC = (over) => Object.assign({}, BASE_PAL, COURTYARD, over || {});

  Object.assign(GOL.PALETTES, {
    // -------------------------------------------------- World Two · Orchard
    // The Shared Table — the orchard gate, generous and open.
    maun: palO({ waterHi: '#C9ECDD' }),
    // The Caravan Rest — dust of the road, warm and settled.
    quraysh: palO({ skyLow: '#F5D294', soil: '#CDAB7C', hillFar: '#BBCB97', mist: '#F2E8CC' }),
    // The Bird Sky — wide bright air over the grove.
    fil: palO({ skyTop: '#9ECFC0', skyMid: '#DFEDC0', cloud: '#FFF8E6' }),
    // The Deep Shade — cool under heavy branches.
    humazah: palO({ skyMid: '#D3E2AC', hillNear: '#5F9459', grassDark: '#528A47', leafDark: '#47793F' }),
    // The Laden Boughs — everything golden and heavy with fruit.
    takathur: palO({ skyLow: '#F9D794', gold: '#F5CB74', leafLight: '#A2CE7E' }),
    // The Weighing Light — shimmer before evening.
    qariah: palO({ skyTop: '#A9C3A4', skyMid: '#E3DEA8', skyLow: '#F4C98E', mist: '#EFE0BC' }),
    // ------------------------------------------------ World Three · Courtyard
    // The Trembling Steps — warm stone, the courtyard opens.
    zalzalah: palC({}),
    // The Dawn Chargers — rose-gold air, dust of hooves.
    adiyat: palC({ skyLow: '#F7C795', sunGlow: '#FFD9A0', soil: '#D0A97C', mist: '#EFDDBC' }),
    // The Hall of Light — luminous cream colonnades.
    bayyinah: palC({ skyMid: '#EDE6BC', stone: '#F4E6C6', ray: '#FFF0BE' }),
    // The Night of Qadr — dusk deepening into a starred, peaceful night.
    qadr: palC({
      skyTop: '#7E93A2', skyMid: '#A9AF9E', skyLow: '#E8B77E',
      sun: '#FFE9B0', sunGlow: '#F5CE96',
      hillFar: '#93A88C', hillMid: '#77926F', hillNear: '#5C7D57',
      grass: '#6FA05B', grassLight: '#8FC077', mist: '#DCD2B4'
    }),
    qadrEnd: palC({
      skyTop: '#2E4058', skyMid: '#4A5B72', skyLow: '#8A7B94',
      sun: '#F4E9C8', sunGlow: '#C9D4E8', cloud: '#93A0B4', ray: '#BFCDE8',
      hillFar: '#4E6258', hillMid: '#41544C', hillNear: '#35473F',
      grass: '#4C7350', grassLight: '#699668', grassDark: '#3A5C40', mist: '#6C7C86'
    }),
    // The Cave of Hira — pre-dawn stone, then the first light of Read.
    alaq: palC({
      skyTop: '#8FA8A6', skyMid: '#C4C6A8', skyLow: '#F2CE96',
      hillFar: '#9FB096', hillMid: '#7E9678', hillNear: '#617E5C',
      stone: '#E9DCC0', sunGlow: '#FFE1A0', ray: '#FFEDB0'
    }),
    alaqEnd: palC({ skyTop: '#A8D0C0', skyMid: '#E0EEC8', skyLow: '#FAE5AC', sunGlow: '#FFE9A0' })
  });

  // Gem greens — one per ayah position, chosen to read distinctly at a glance.
  GOL.GEMS = [
    { name: 'mint',    base: '#96E2B4' },
    { name: 'seafoam', base: '#72D6C3' },
    { name: 'jade',    base: '#4FC08D' },
    { name: 'spring',  base: '#9AD468' },
    { name: 'moss',    base: '#71A94C' },
    { name: 'pine',    base: '#3D8E70' },
    { name: 'emerald', base: '#2EA45B' }
  ].map((g) => ({
    name: g.name, base: g.base,
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
  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    return c;
  }
  GOL.paint = { wobblePath, dabs, blob, makeCanvas };

  // ------------------------------------------------------------- the sky ---
  // Drawn live each frame (cheap), with sun bloom and slow drifting clouds.
  function drawSky(ctx, w, h, P, t, camX) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, P.skyTop);
    g.addColorStop(0.55, P.skyMid);
    g.addColorStop(1, P.skyLow);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // morning sun, upper right, gentle bloom
    const sx = w * 0.78, sy = h * 0.22;
    const bloom = ctx.createRadialGradient(sx, sy, 0, sx, sy, h * 0.55);
    bloom.addColorStop(0, alpha(P.sunGlow, 0.5));
    bloom.addColorStop(0.35, alpha(P.sunGlow, 0.16));
    bloom.addColorStop(1, alpha(P.sunGlow, 0));
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = alpha(P.sun, 0.9);
    ctx.beginPath(); ctx.arc(sx, sy, h * 0.055, 0, Math.PI * 2); ctx.fill();
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
  }
  function drawCloud(ctx, x, y, s, P) {
    if (s <= 0) return;
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = alpha(P.cloud, 0.75);
    blob(ctx, 0, 0, 26, alpha(P.cloud, 0.75));
    blob(ctx, 28, 6, 20, alpha(P.cloud, 0.7));
    blob(ctx, -30, 8, 18, alpha(P.cloud, 0.7));
    blob(ctx, 8, 12, 24, alpha(P.cloud, 0.8));
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
    ctx.restore();
    // trees / shrubs standing on the ridge
    if (opts.trees) {
      for (let i = 0; i < opts.trees; i++) {
        const x = (i + 0.3 + r() * 0.5) * (W / opts.trees);
        const y = ridge(x) + 2;
        const s = 0.5 + r() * 0.9;
        const col = mix(opts.color, opts.treeColor || shade(opts.color, 0.25), 0.8);
        // simple round-top garden tree silhouette
        ctx.fillStyle = alpha(shade(col, 0.1), 0.9);
        ctx.fillRect(x - 1.5 * s, y - 10 * s, 3 * s, 10 * s);
        blob(ctx, x, y - 15 * s, 8 * s, alpha(col, 0.95));
        blob(ctx, x - 6 * s, y - 11 * s, 5.5 * s, alpha(col, 0.9));
        blob(ctx, x + 6 * s, y - 11 * s, 5.5 * s, alpha(col, 0.9));
        blob(ctx, x - 2 * s, y - 18 * s, 4.5 * s, alpha(tint(col, 0.18), 0.85));
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

  // A tiny far-horizon herd: atmosphere only, never a foreground creature.
  function drawChargers(ctx, x, y, t, P, c, scale) {
    const s = scale || 1;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = shade(P.hillFar, 0.22);
    ctx.strokeStyle = shade(P.hillFar, 0.22);
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(0.7, 1.1 * s);
    for (let d = 0; d < 7; d++) {
      ctx.beginPath();
      ctx.arc(x - ((c.count || 3) * 22 + 8 + d * 7) * s, y - (d % 3) * 1.3 * s, (1.2 + d % 2) * s, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < (c.count || 3); i++) {
      const hx = x - i * 22 * s, bob = Math.sin(t * 11 + i * 1.7) * 1.2 * s;
      ctx.beginPath(); ctx.ellipse(hx, y - 7 * s + bob, 7.5 * s, 3.2 * s, -0.08, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(hx + 7 * s, y - 11 * s + bob, 2.8 * s, 2 * s, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(hx + 4 * s, y - 8 * s + bob); ctx.lineTo(hx + 6.5 * s, y - 11 * s + bob); ctx.stroke();
      const stride = Math.sin(t * 14 + i) * 2.4 * s;
      ctx.beginPath();
      ctx.moveTo(hx - 4 * s, y - 5 * s + bob); ctx.lineTo(hx - 5 * s - stride, y);
      ctx.moveTo(hx + 3 * s, y - 5 * s + bob); ctx.lineTo(hx + 4 * s + stride, y);
      ctx.stroke();
    }
    ctx.restore();
  }
  GOL.drawChargers = drawChargers;

  // ------------------------------------------------------------ tile atlas -
  // Ground autotiles keyed by exposure mask (up,right,down,left bits), plus
  // stone slabs and carved blocks. Everything pre-rendered per palette.
  function buildTileAtlas(P, seed) {
    const atlas = {};
    const T = TILE;

    // -- ground: soil body + grass crown where the top is exposed.
    // Three tones give the earth its depth: crowned tiles are lit, exposed
    // faces are a mid tone, and buried earth settles darker beneath.
    const BODY = mix(P.soil, P.soilDark, 0.45);
    for (let mask = 0; mask < 16; mask++) {
      const up = mask & 1, right = mask & 2, down = mask & 4, left = mask & 8;
      const c = makeCanvas(T, T);
      const x = c.getContext('2d');
      const rseed = seed + mask * 7;

      // soil body with softly wobbled exposed edges (unexposed edges overfill)
      const inset = 2.5;
      const pts = [
        [left ? inset : -4, up ? inset : -4],
        [right ? T - inset : T + 4, up ? inset : -4],
        [right ? T - inset : T + 4, down ? T - inset : T + 4],
        [left ? inset : -4, down ? T - inset : T + 4]
      ];
      wobblePath(x, pts, rseed, up || down || left || right ? 3.5 : 0);
      if (up) {
        const sg = x.createLinearGradient(0, 0, 0, T);
        sg.addColorStop(0, P.soil);
        sg.addColorStop(1, BODY);
        x.fillStyle = sg;
      } else {
        // one body tone; depth shading is painted over the whole terrain later
        x.fillStyle = BODY;
      }
      x.fill();
      x.save();
      wobblePath(x, pts, rseed, up || down || left || right ? 3.5 : 0);
      x.clip();
      // speckles: pebbles and darker grains
      dabs(x, 0, 0, T, T, alpha(P.pebble, 0.32), 5, rseed + 1, 1.2, 2.6);
      dabs(x, 0, 0, T, T, alpha(shade(P.soilDark, 0.25), 0.26), 6, rseed + 2, 1, 2.2);
      // side shading when exposed
      if (left) { const gg = x.createLinearGradient(0, 0, 8, 0); gg.addColorStop(0, alpha(shade(P.soilDark, 0.3), 0.5)); gg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gg; x.fillRect(0, 0, 8, T); }
      if (right) { const gg = x.createLinearGradient(T, 0, T - 8, 0); gg.addColorStop(0, alpha(tint(P.soil, 0.25), 0.5)); gg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gg; x.fillRect(T - 8, 0, 8, T); }
      if (down) { const gg = x.createLinearGradient(0, T, 0, T - 8); gg.addColorStop(0, alpha(shade(P.soilDark, 0.4), 0.55)); gg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gg; x.fillRect(0, T - 8, T, 8); }
      x.restore();

      // grass crown
      if (up) {
        const gh = 13;
        const gpts = [[left ? 1 : -2, 2], [right ? T - 1 : T + 2, 2], [right ? T - 3 : T + 2, gh], [left ? 3 : -2, gh]];
        wobblePath(x, gpts, rseed + 3, 4);
        const gg = x.createLinearGradient(0, 0, 0, gh + 4);
        gg.addColorStop(0, P.grassLight);
        gg.addColorStop(0.5, P.grass);
        gg.addColorStop(1, P.grassDark);
        x.fillStyle = gg;
        x.fill();
        x.save(); wobblePath(x, gpts, rseed + 3, 4); x.clip();
        dabs(x, 0, 0, T, gh, alpha(tint(P.grassLight, 0.3), 0.55), 5, rseed + 4, 1.5, 3);
        x.restore();
        // a few blades reaching up past the tile top
        const r = mulberry32(rseed + 5);
        for (let i = 0; i < 5; i++) {
          const bx = 4 + r() * (T - 8), bh = 4 + r() * 7, lean = (r() - 0.5) * 4;
          x.strokeStyle = alpha(r() < 0.5 ? P.grass : P.grassLight, 0.9);
          x.lineWidth = 1.6; x.lineCap = 'round';
          x.beginPath(); x.moveTo(bx, 4); x.quadraticCurveTo(bx + lean, 4 - bh * 0.6, bx + lean * 1.6, 3 - bh); x.stroke();
        }
        // grass ears draping over exposed shoulders
        if (left || right) {
          const drape = (ex, dir) => {
            x.fillStyle = P.grass;
            x.beginPath();
            x.moveTo(ex, 3);
            x.quadraticCurveTo(ex + dir * 7, 8, ex + dir * 5, 20);
            x.quadraticCurveTo(ex + dir * 8, 12, ex + dir * 9, 4);
            x.closePath(); x.fill();
            x.fillStyle = alpha(P.grassDark, 0.55);
            x.beginPath();
            x.ellipse(ex + dir * 4, 15, 2.2, 4.5, dir * 0.3, 0, Math.PI * 2);
            x.fill();
          };
          if (left) drape(2, 1);
          if (right) drape(T - 2, -1);
        }
      }
      atlas['g' + mask] = c;
    }

    // -- deep ground (2+ below the surface): same body, quieter marks
    const dc = makeCanvas(T, T);
    {
      const x = dc.getContext('2d');
      x.fillStyle = BODY;
      x.fillRect(0, 0, T, T);
      dabs(x, 0, 0, T, T, alpha(shade(P.soilDark, 0.3), 0.28), 4, seed + 90, 1.5, 3.2);
      dabs(x, 0, 0, T, T, alpha(tint(P.soilDark, 0.2), 0.22), 3, seed + 91, 2, 4);
    }
    atlas.deep = dc;

    // -- one-way stone slab, end pieces get trailing moss
    ['L', 'M', 'R', 'S'].forEach((kind, ki) => {
      const c = makeCanvas(T, T);
      const x = c.getContext('2d');
      const rs = seed + 300 + ki * 11;
      const y0 = 8, hgt = 27;
      const rounded = (side) => kind === 'S' || kind === side;
      x.save();
      x.beginPath();
      const rl = rounded('L') ? 9 : 0, rr = rounded('R') ? 9 : 0;
      x.moveTo(rl ? 2 + rl : -2, y0);
      x.lineTo(rr ? T - 2 - rr : T + 2, y0);
      if (rr) x.quadraticCurveTo(T - 2, y0, T - 2, y0 + rr);
      x.lineTo(rr ? T - 2 : T + 2, y0 + hgt - (rr ? 6 : 0));
      if (rr) x.quadraticCurveTo(T - 2, y0 + hgt, T - 2 - rr, y0 + hgt);
      x.lineTo(rl ? 2 + rl : -2, y0 + hgt);
      if (rl) x.quadraticCurveTo(2, y0 + hgt, 2, y0 + hgt - 6);
      x.lineTo(rl ? 2 : -2, y0 + rl);
      if (rl) x.quadraticCurveTo(2, y0, 2 + rl, y0);
      x.closePath();
      const g = x.createLinearGradient(0, y0, 0, y0 + hgt);
      g.addColorStop(0, tint(P.stone, 0.4));
      g.addColorStop(0.4, P.stone);
      g.addColorStop(1, shade(P.stoneShade, 0.12));
      x.fillStyle = g; x.fill();
      x.clip();
      dabs(x, 0, y0, T, hgt, alpha(P.stoneDark, 0.25), 4, rs, 1.5, 3.5);
      dabs(x, 0, y0, T, 8, alpha(tint(P.stone, 0.6), 0.6), 3, rs + 1, 2, 4);
      // carved line detail + settled underside shadow
      x.strokeStyle = alpha(P.stoneDark, 0.45); x.lineWidth = 1.6;
      x.beginPath(); x.moveTo(0, y0 + hgt - 7); x.lineTo(T, y0 + hgt - 7); x.stroke();
      x.fillStyle = alpha(shade(P.stoneDark, 0.35), 0.5);
      x.fillRect(0, y0 + hgt - 3, T, 3);
      x.restore();
      // soft cast shadow just below the slab
      const shg = x.createLinearGradient(0, y0 + hgt, 0, y0 + hgt + 8);
      shg.addColorStop(0, 'rgba(46,64,50,0.22)');
      shg.addColorStop(1, 'rgba(46,64,50,0)');
      x.fillStyle = shg;
      x.fillRect(2, y0 + hgt, T - 4, 8);
      // moss drapes on ends
      if (kind !== 'M') {
        const r = mulberry32(rs + 2);
        x.fillStyle = alpha(P.grass, 0.85);
        const edges = kind === 'S' ? ['L', 'R'] : [kind];
        for (const e of edges) {
          const ex = e === 'L' ? 6 : T - 6;
          for (let i = 0; i < 3; i++) {
            const mx = ex + (r() - 0.5) * 8;
            x.beginPath();
            x.ellipse(mx, y0 + 3 + i * 3, 4 - i, 6 - i * 1.5, 0, 0, Math.PI * 2);
            x.fill();
          }
        }
      }
      atlas['slab' + kind] = c;
    });

    // -- carved cream blocks (garden houses, hollows, towers).
    // Mostly quiet panels; the eight-point star appears only here and there.
    const mkBlock = (withStar, vseed) => {
      const c = makeCanvas(T, T);
      const x = c.getContext('2d');
      wobblePath(x, [[1.5, 1.5], [T - 1.5, 1.5], [T - 1.5, T - 1.5], [1.5, T - 1.5]], vseed, 2.5);
      const g = x.createLinearGradient(0, 0, T, T);
      g.addColorStop(0, tint(P.stone, 0.22));
      g.addColorStop(1, P.stoneShade);
      x.fillStyle = g; x.fill();
      x.save();
      wobblePath(x, [[1.5, 1.5], [T - 1.5, 1.5], [T - 1.5, T - 1.5], [1.5, T - 1.5]], vseed, 2.5);
      x.clip();
      dabs(x, 0, 0, T, T, alpha(P.stoneDark, 0.16), 4, vseed + 1, 1.5, 3.5);
      dabs(x, 0, 0, T, 14, alpha(tint(P.stone, 0.5), 0.4), 3, vseed + 2, 2, 4);
      x.strokeStyle = alpha(P.stoneDark, 0.28); x.lineWidth = 1.5;
      x.strokeRect(7, 7, T - 14, T - 14);
      if (withStar) star8(x, T / 2, T / 2, 7, Math.PI / 8, alpha(P.stoneDark, 0.3));
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

  // ------------------------------------------------------------ vignette ---
  function drawVignette(ctx, w, h, strength) {
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
