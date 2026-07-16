// The Journey Map — the game's home (promoted from lab P19, 2026-07-15).
//
// The painted four-island journey, bound to the REAL save: every spot is a
// surah by WORLD_ORDER position; blooms are earned Grand Gems, the breathing
// star is the next world, buds are worlds still growing, islands wake as
// their built worlds complete. Standing on the star enters its world;
// resting on an old bloom re-enters after a visible hesitation; each done
// spot carries its Remembering Moon (tap to dream, once a day). The title
// is only a splash now — this scene is where the child lives.
(function () {
  const GOL = window.GOL;
  const TAU = Math.PI * 2;
  const { alpha } = GOL.color;
  const scriptUrl = document.currentScript ? document.currentScript.src : location.href;
  const ASSET_URL = new URL('../map-artist-pack/journey-map.svg?v=358', scriptUrl).href;
  // Contract v2.1 (round 4): the region shape is read from the MAP ITSELF —
  // a heart-4 anchor means four islands × 6 spots (the 6/6/6/6 cut of the
  // 24-key WORLD_ORDER); otherwise three × 8. The live tree stays loadable
  // whichever map is staged (the false-alarm rule, engineered away).
  const BLOOMS = ['#F5B8C4', '#F2C46E', '#E7C6A0', '#F3E9C9'];
  let REGIONS = [
    { count: 8, bloom: BLOOMS[0] },
    { count: 8, bloom: BLOOMS[1] },
    { count: 8, bloom: BLOOMS[2] }
  ];
  const GRAND = {
    base: '#F0C878', light: '#FFE9A8', lighter: '#FFF6DC',
    dark: '#D9A44A', darker: '#B98A3E', glow: '#FFE9A8'
  };
  let assetPromise = null;
  // camera/hero preserved across a world visit (state itself re-reads the save)
  let returnState = null;
  // session memory for arrival celebrations: which regions were awake and
  // which spots were bloomed the last time the map looked at the save
  let lastAwake = null;
  let lastDone = null;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function ease(v) { return v * v * (3 - 2 * v); }
  function lerp(a, b, k) { return a + (b - a) * k; }

  function imageFromRoot(root) {
    const xml = new XMLSerializer().serializeToString(root);
    const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }));
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG layer did not rasterize')); };
      img.src = url;
    });
  }

  // Isolate one named group as its own renderable document, wherever the
  // artist nested it: strip every sibling along its ancestor chain (keeping
  // defs), so ancestor transforms still apply to the survivor.
  function layerRoot(root, id) {
    const clone = root.cloneNode(true);
    let node = clone.querySelector('#' + id);
    if (!node) throw new Error('map contract: #' + id + ' missing at layer split');
    while (node && node !== clone) {
      const parent = node.parentNode;
      for (const sib of Array.from(parent.children)) {
        const tag = sib.localName && sib.localName.toLowerCase();
        if (sib !== node && tag !== 'defs') sib.remove();
      }
      node = parent;
    }
    return clone;
  }

  function requireElement(root, id, tag) {
    const matches = root.querySelectorAll('#' + id);
    if (matches.length !== 1 || matches[0].localName.toLowerCase() !== tag) {
      throw new Error('map contract: #' + id + ' must be one <' + tag + '>');
    }
    return matches[0];
  }

  function circlePoint(root, id) {
    const c = requireElement(root, id, 'circle');
    return { x: parseFloat(c.getAttribute('cx')), y: parseFloat(c.getAttribute('cy')) };
  }

  function samplePath(path, step) {
    const len = path.getTotalLength();
    const n = Math.max(2, Math.ceil(len / step));
    const out = [];
    for (let i = 0; i <= n; i++) {
      const l = len * i / n;
      const p = path.getPointAtLength(l);
      out.push({ x: p.x, y: p.y, l });
    }
    return { len, pts: out };
  }

  function nearestLength(samples, point) {
    let best = samples.pts[0], bd = Infinity;
    for (const p of samples.pts) {
      const d = (p.x - point.x) ** 2 + (p.y - point.y) ** 2;
      if (d < bd) { bd = d; best = p; }
    }
    return best.l;
  }

  function pointAtSamples(samples, length) {
    const l = clamp(length, 0, samples.len);
    const k = l / samples.len * (samples.pts.length - 1);
    const i = Math.min(samples.pts.length - 2, Math.floor(k));
    const f = k - i;
    const a = samples.pts[i], b = samples.pts[i + 1];
    return { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) };
  }

  async function loadAsset() {
    if (assetPromise) return assetPromise;
    assetPromise = (async () => {
      const response = await fetch(ASSET_URL, { cache: 'no-cache' });
      if (!response.ok) throw new Error('map fetch failed: ' + response.status);
      const text = await response.text();
      const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
      if (doc.querySelector('parsererror')) throw new Error('map SVG did not parse');
      const root = doc.documentElement;
      const vb = (root.getAttribute('viewBox') || '').trim().split(/[ ,]+/).map(Number);
      if (vb.length !== 4 || vb.some((v) => !Number.isFinite(v)) || vb[2] <= 0 || vb[3] <= 0) {
        throw new Error('map contract: invalid viewBox');
      }
      // Explicit intrinsic dimensions keep Safari's SVG-to-image rasterization
      // predictable even though the artist file only needs a viewBox.
      root.setAttribute('width', String(vb[2]));
      root.setAttribute('height', String(vb[3]));
      // Contract v2.1: no stream — the map's only water is the fountain
      // hearts, and the ceremony's light travels the walk itself. Region
      // count comes from the map: heart-4 present = 4×6, absent = 3×8.
      requireElement(root, 'walk', 'path');
      requireElement(root, 'over', 'g');
      const nRegions = root.querySelector('#heart-4') ? 4 : 3;
      const perRegion = 24 / nRegions;
      for (let r = 1; r <= nRegions; r++) {
        requireElement(root, 'water-' + r, 'g');
        requireElement(root, 'heart-' + r, 'circle');
        for (let n = 1; n <= perRegion; n++) requireElement(root, 'spot-' + r + '-' + n, 'circle');
      }
      for (let g = 1; g < nRegions; g++) requireElement(root, 'gate-' + g, 'circle');
      requireElement(root, 'moon', 'circle');

      // Mount invisibly for Safari's geometry APIs, then remove after sampling.
      root.style.cssText = 'position:absolute;left:-10000px;top:0;width:' + vb[2] + 'px;height:' + vb[3] + 'px;visibility:hidden;pointer-events:none';
      document.body.appendChild(root);
      const spots = [];
      const hearts = [];
      for (let r = 1; r <= nRegions; r++) {
        const row = [];
        for (let n = 1; n <= perRegion; n++) row.push(circlePoint(root, 'spot-' + r + '-' + n));
        spots.push(row);
        hearts.push(circlePoint(root, 'heart-' + r));
      }
      const moon = circlePoint(root, 'moon');
      const walkSamples = samplePath(requireElement(root, 'walk', 'path'), 3);
      root.removeAttribute('style');
      root.remove();

      const base = root.cloneNode(true);
      requireElement(base, 'over', 'g').remove();
      for (let r = 1; r <= nRegions; r++) requireElement(base, 'water-' + r, 'g').remove();
      const jobs = [imageFromRoot(base)];
      for (let r = 1; r <= nRegions; r++) jobs.push(imageFromRoot(layerRoot(root, 'water-' + r)));
      jobs.push(imageFromRoot(layerRoot(root, 'over')));
      const layers = await Promise.all(jobs);
      return {
        w: vb[2], h: vb[3], spots, hearts, moon, walkSamples,
        regions: Array.from({ length: nRegions }, (_, i) => ({ count: perRegion, bloom: BLOOMS[i] })),
        images: { base: layers[0], water: layers.slice(1, 1 + nRegions), over: layers[layers.length - 1] }
      };
    })();
    return assetPromise;
  }

  function drawBloom(ctx, x, y, r, t, color, pulse) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * 1.2 + x * 0.03) * 0.06);
    ctx.strokeStyle = '#6DA84E';
    ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 8); ctx.quadraticCurveTo(1, 0, 0, -7); ctx.stroke();
    ctx.translate(0, -8);
    const rr = r * (1 + pulse * 0.18);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + t * 0.08;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * rr * 0.58, Math.sin(a) * rr * 0.58,
        rr * 0.5, rr * 0.28, a, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    GOL.drawGem(ctx, x, y - 8, r * 0.48, GRAND, t, { phase: x * 0.02, glow: 0.7 });
  }

  function drawBud(ctx, x, y, a) {
    ctx.save(); ctx.globalAlpha *= a;
    ctx.strokeStyle = '#6DA84E'; ctx.lineWidth = 1.7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y + 7); ctx.quadraticCurveTo(x + 1, y - 3, x, y - 8); ctx.stroke();
    ctx.fillStyle = '#AFCB91';
    ctx.beginPath(); ctx.ellipse(x - 3, y - 10, 4, 7, 0.45, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 3, y - 10, 4, 7, -0.45, 0, TAU); ctx.fill();
    ctx.fillStyle = '#D7E3B7';
    ctx.beginPath(); ctx.ellipse(x, y - 13, 3.2, 5.5, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // Contract v2: an awake island's fountain PLAYS — the engine's living
  // water over the artist's painted basin, gentle arcs and a soft sparkle.
  // An asleep island keeps its dry basin (its water layer is hidden).
  function drawFountain(ctx, x, y, t, a) {
    if (a <= 0.02) return;
    ctx.save();
    ctx.globalAlpha *= a;
    const glow = ctx.createRadialGradient(x, y - 4, 1, x, y - 4, 20);
    glow.addColorStop(0, 'rgba(255,246,220,0.30)');
    glow.addColorStop(1, 'rgba(255,246,220,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y - 4, 20, 0, TAU); ctx.fill();
    for (let i = 0; i < 7; i++) {
      const k = (t * 0.55 + i / 7) % 1;
      const dir = i % 2 ? 1 : -1;
      const dx = dir * (2 + (i % 3) * 2.4) * k;
      const dy = -14 * Math.sin(k * Math.PI) * (0.7 + (i % 3) * 0.15);
      const fade = Math.sin(k * Math.PI);
      ctx.fillStyle = alpha(i % 2 ? '#BFE8DC' : '#FFF6DC', 0.15 + 0.55 * fade);
      ctx.beginPath();
      ctx.ellipse(x + dx, y - 3 + dy, 1.7, 2.6 - k, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function heartPath(ctx, ri, x, y) {
    if (ri === 0) {
      GOL.star8Path(ctx, x, y, 58, Math.PI / 8);
      return;
    }
    if (ri === 3) {
      // the summit's ring pool — a halo of water
      ctx.beginPath();
      ctx.ellipse(x, y, 54, 30, 0, 0, TAU);
      return;
    }
    ctx.beginPath();
    if (ri === 1) {
      ctx.moveTo(x, y - 46);
      ctx.bezierCurveTo(x + 22, y - 46, x + 35, y - 32, x + 35, y - 16);
      ctx.bezierCurveTo(x + 52, y - 32, x + 84, y - 24, x + 84, y);
      ctx.bezierCurveTo(x + 84, y + 24, x + 52, y + 32, x + 35, y + 16);
      ctx.bezierCurveTo(x + 35, y + 38, x + 22, y + 50, x, y + 50);
      ctx.bezierCurveTo(x - 22, y + 50, x - 35, y + 38, x - 35, y + 16);
      ctx.bezierCurveTo(x - 52, y + 32, x - 84, y + 24, x - 84, y);
      ctx.bezierCurveTo(x - 84, y - 24, x - 52, y - 32, x - 35, y - 16);
      ctx.bezierCurveTo(x - 35, y - 32, x - 22, y - 46, x, y - 46);
      ctx.closePath();
      return;
    }
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU - Math.PI / 2;
      const px = x + Math.cos(a) * 62;
      const py = y + Math.sin(a) * 42;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  }

  // The lightling's MAP FORM (round-3 verdict): the same soul — warm pearl
  // glow, sprout, little face — rebuilt for the overworld's high camera.
  // The side-view sprite never appears on the map: here she is grounded by
  // her shadow, read from above and slightly in front, bobbing as she walks.
  function drawMapLightling(ctx, x, y, t, moving, facing) {
    const bob = moving ? Math.abs(Math.sin(t * 7)) * 3.2 : Math.sin(t * 1.8) * 1.1;
    const r = 15;
    ctx.fillStyle = 'rgba(62,83,64,0.20)';
    ctx.beginPath(); ctx.ellipse(x, y + 6, r * 0.86, r * 0.36, 0, 0, TAU); ctx.fill();
    ctx.save();
    ctx.translate(x, y - 9 - bob);
    if (facing < 0) ctx.scale(-1, 1);
    const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.9);
    aura.addColorStop(0, 'rgba(255,246,220,0.5)');
    aura.addColorStop(1, 'rgba(255,246,220,0)');
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.arc(0, 0, r * 1.9, 0, TAU); ctx.fill();
    const body = ctx.createRadialGradient(-r * 0.25, -r * 0.55, r * 0.2, 0, 0, r * 1.05);
    body.addColorStop(0, '#FFFDF4');
    body.addColorStop(0.6, '#FFF3D6');
    body.addColorStop(1, '#F0D9A0');
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.88, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#6DA84E'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(1, -r * 0.8); ctx.quadraticCurveTo(2, -r * 1.12, 1, -r * 1.28); ctx.stroke();
    ctx.fillStyle = '#8FC77E';
    ctx.beginPath(); ctx.ellipse(-3.4, -r * 1.3, 4.6, 2.5, -0.55, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6DA84E';
    ctx.beginPath(); ctx.ellipse(4.6, -r * 1.26, 4.2, 2.3, 0.5, 0, TAU); ctx.fill();
    // her face sits low on the pearl — seen a little from above
    const fy = r * 0.22;
    const blink = Math.sin(t * 0.7) > 0.985;
    ctx.fillStyle = '#4A4038';
    if (blink) {
      ctx.fillRect(-6.2, fy - 0.6, 3.4, 1.3);
      ctx.fillRect(2.8, fy - 0.6, 3.4, 1.3);
    } else {
      ctx.beginPath(); ctx.arc(-4.6, fy, 1.7, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(4.6, fy, 1.7, 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = '#4A4038'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(0, fy + 1.5, 3.4, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke();
    ctx.fillStyle = 'rgba(245,184,196,0.55)';
    ctx.beginPath(); ctx.ellipse(-8.2, fy + 2.5, 2.6, 1.6, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(8.2, fy + 2.5, 2.6, 1.6, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  const journeyMap = {
    t: 0, map: null, loadError: null, progress: null, cam: null,
    dragPrev: null, dragMoved: false, camFree: 0, ceremony: null,
    hero: null, spotPulse: null, pendingBloom: false,

    enter() {
      // from here on, "home" means the map — for worlds, shrines, dreams
      GOL.homeScene = 'journeyMap';
      this.t = 0;
      this.map = null;
      this.loadError = null;
      this.progress = [8, 3, 0];
      this.cam = null;
      this.dragPrev = null;
      this.dragMoved = false;
      this.camFree = 0;
      this.ceremony = null;
      this.hero = null;
      this.spotPulse = null;
      this.pendingBloom = false;
      this.kbdFollow = 0;
      this.kbdActHeld = false;
      this.railS = null;
      this.spotS = null;
      this.waypoints = null;
      this.stepCool = 0;
      this.dwell = null;
      this.startAnchorS = null;
      this.heroArrived = true; // no arrival event on scene entry/return
      loadAsset().then((map) => {
        this.map = map;
        REGIONS = map.regions;
        // every spot's position along the walk, and the flat waypoint
        // ladder she steps between (snap-to-waypoint walking)
        this.spotS = map.spots.map((row) => row.map((sp) => nearestLength(map.walkSamples, sp)));
        this.waypoints = this.spotS.flat().sort((a, b) => a - b);
        this.readSave();
        // A brand-new journey (the breathing star is the very first spot and
        // nothing has bloomed yet) stands her at the TRAILHEAD — the start of
        // the painted walk, a step shy of Al-Fatiha — and adds it to the
        // waypoint ladder. Her first, obvious action is then a step FORWARD,
        // which walks her INTO the first bloom and opens it. Before this she
        // spawned ON the star with both walk buttons dead and only a
        // non-obvious tap to enter — a new child could get stuck on world one.
        if (this.star && this.star.ri === 0 && this.star.j === 0 && !this.lastBloom()) {
          this.startAnchorS = 0;
          if (this.waypoints[0] !== 0) this.waypoints = [0, ...this.waypoints];
        }
        if (returnState) {
          // back from a world: she stands exactly where she left, and the
          // save may have grown — celebrate what's new
          this.cam = returnState.cam;
          this.hero = { s: returnState.heroS, sT: returnState.heroS };
          returnState = null;
          this.celebrateNews();
          return;
        }
        this.celebrateNews();
        const st = this.star || this.lastBloom() || { ri: 0, j: 0 };
        const here = this.startAnchorS != null ? this.startAnchorS : this.spotS[st.ri][st.j];
        this.hero = { s: here, sT: here };
      }).catch((err) => {
        this.loadError = err;
        try { console.error('[gol] P19', err); } catch (_) {}
      });
    },

    // ── the journey, read from the real save ──────────────────────
    // spotInfo[ri][j] = {n, key, surahId, done, open} or null (still growing)
    readSave() {
      this.spotInfo = [];
      this.star = null;
      const worlds = GOL.WORLDS3 || [];
      let k = 0;
      for (let ri = 0; ri < REGIONS.length; ri++) {
        const row = [];
        for (let j = 0; j < REGIONS[ri].count; j++, k++) {
          const key = GOL.WORLD_ORDER && GOL.WORLD_ORDER[k];
          const w = key && worlds.find((x) => x && x.key === key && x.build);
          row.push(w ? {
            n: w.n, key: w.key, surahId: w.surahId,
            done: GOL.worldDone(w.n), open: GOL.worldOpen(w.n)
          } : null);
        }
        this.spotInfo.push(row);
      }
      // the breathing star: the next world of the natural journey
      const seq = GOL.orderedWorlds ? GOL.orderedWorlds() : [];
      const next = seq.find((w) => w.build && !GOL.worldDone(w.n));
      if (next) {
        for (let ri = 0; ri < REGIONS.length && !this.star; ri++) {
          for (let j = 0; j < REGIONS[ri].count; j++) {
            const sp = this.spotInfo[ri][j];
            if (sp && sp.n === next.n) { this.star = { ri, j }; break; }
          }
        }
      }
      // an island wakes when every built world before it is done
      this.awake = [];
      let priorDone = true;
      for (let ri = 0; ri < REGIONS.length; ri++) {
        this.awake.push(ri === 0 ? true : priorDone);
        for (const sp of this.spotInfo[ri]) if (sp && !sp.done) priorDone = false;
      }
      // the Remembering's doors (one dream per surah per day) and the
      // done garden that misses its child (>20h unheard, oldest first)
      this.moonBtns = [];
      this.missSpot = null;
      let oldest = Infinity;
      for (let ri = 0; ri < REGIONS.length; ri++) {
        for (let j = 0; j < REGIONS[ri].count; j++) {
          const sp = this.spotInfo[ri][j];
          if (!sp || !sp.done || !this.map) continue;
          const pos = this.map.spots[ri][j];
          const st = GOL.store.level(sp.surahId);
          if (st.moonWaxedDay !== GOL.todayKey()) {
            this.moonBtns.push({ x: pos.x - 18, y: pos.y - 26, surahId: sp.surahId, ri, j });
          }
          const lp = st.lastPlayed || 0;
          if (Date.now() - lp > 20 * 3600 * 1000 && lp < oldest) {
            oldest = lp;
            this.missSpot = { ri, j };
          }
        }
      }
    },

    lastBloom() {
      let last = null;
      for (let ri = 0; ri < REGIONS.length; ri++) {
        for (let j = 0; j < REGIONS[ri].count; j++) {
          const sp = this.spotInfo[ri][j];
          if (sp && sp.done) last = { ri, j };
        }
      }
      return last;
    },

    // returning with news: a fresh Grand Gem pulses its bloom open; a
    // newly-awake island runs its wake ceremony (session memory only)
    celebrateNews() {
      const doneNow = new Set();
      for (let ri = 0; ri < REGIONS.length; ri++) {
        for (let j = 0; j < REGIONS[ri].count; j++) {
          const sp = this.spotInfo[ri][j];
          if (sp && sp.done) doneNow.add(ri + '-' + j);
        }
      }
      if (lastDone) {
        for (const id of doneNow) {
          if (!lastDone.has(id)) {
            const [ri, j] = id.split('-').map(Number);
            this.spotPulse = { ri, j, t: 1 };
            if (GOL.audio) GOL.audio.sfx('blossom');
          }
        }
      }
      if (lastAwake) {
        for (let ri = 1; ri < REGIONS.length; ri++) {
          if (this.awake[ri] && !lastAwake[ri]) { this.ceremony = { ri: ri - 1, t: 0 }; break; }
        }
      }
      lastDone = doneNow;
      lastAwake = this.awake.slice();
    },

    activeRegion() { return this.star ? this.star.ri : null; },
    // Debug wakes every island so a grown-up can walk the whole journey and
    // audit each world's art without earning it first.
    regionAwake(i) { return GOL.DEBUG || !!(this.awake && this.awake[i]); },

    // A spot is a door when its world is finished (a bloom re-opens on rest) —
    // or, in debug, any built-and-open world (worldOpen is universally true in
    // debug), so every level is reachable. The breathing star is separate.
    isDoor(sp) { return !!(sp && (sp.done || (GOL.DEBUG && sp.open))); },

    traceK() { return this.ceremony ? ease(clamp(this.ceremony.t / 1.5, 0, 1)) : 0; },
    travelK() { return this.ceremony ? ease(clamp((this.ceremony.t - 1.7) / 2.4, 0, 1)) : 0; },

    waterAlpha(i) {
      // during a wake ceremony the NEXT island's water rises with the light
      if (this.ceremony && i === this.ceremony.ri + 1) return this.travelK();
      return this.regionAwake(i) ? 1 : 0;
    },

    // Tap the breathing star: she walks the trail there FIRST, and the
    // world opens when she arrives (motion belongs to the path).
    walkToStar() {
      if (!this.star || !this.map || !this.hero || this.ceremony) return;
      const sT = this.spotS[this.star.ri][this.star.j];
      // A fresh journey spawns her right ON the breathing star (Al-Fatiha),
      // where the walk buttons have nowhere to step. Tapping the star she
      // already stands on must OPEN it — the same act the keyboard grants —
      // never a silent no-op that traps a new child on the first surah.
      if (Math.abs(this.hero.s - sT) <= 2 && Math.abs(this.hero.sT - sT) <= 2) {
        this.enterWorld(this.star.ri, this.star.j);
        return;
      }
      this.hero.sT = sT;
      if (GOL.audio) GOL.audio.sfx('tap');
    },

    // A spot is a door when its world is built AND open in the real save
    // (natural progression or parent-opened practice). Home inside the
    // world leads back here — GOL.homeScene is the map now.
    enterWorld(ri, j) {
      const sp = this.spotInfo && this.spotInfo[ri] && this.spotInfo[ri][j];
      if (!sp || !sp.open) return false;
      returnState = {
        cam: { x: this.cam.x, y: this.cam.y },
        heroS: this.hero.s
      };
      GOL.audio.unlock();
      if (GOL.audio) GOL.audio.sfx('unlockLevel');
      GOL.go('adventure', { world: sp.n });
      return true;
    },

    // Landing on a waypoint: the breathing star opens its world at once;
    // an old bloom arms the visible hesitation, then re-enters.
    _onArrive() {
      if (!this.map || !this.spotS || this.ceremony) return;
      if (this.star && Math.abs(this.hero.s - this.spotS[this.star.ri][this.star.j]) <= 2) {
        this.pendingBloom = false;
        this.enterWorld(this.star.ri, this.star.j);
        return;
      }
      for (let ri = 0; ri < REGIONS.length; ri++) {
        if (!this.regionAwake(ri)) continue;
        for (let j = 0; j < REGIONS[ri].count; j++) {
          const sp = this.spotInfo[ri][j];
          if (this.isDoor(sp) && Math.abs(this.hero.s - this.spotS[ri][j]) <= 2) {
            this.dwell = { t: 0, ri, j };
            return;
          }
        }
      }
    },

    // Keyboard navigation (r4 verdict): enter/space acts on whatever she
    // stands beside — the breathing star blooms, a finished bloom opens
    // its world.
    kbdAct() {
      if (!this.map || !this.hero) return;
      const pos = pointAtSamples(this.map.walkSamples, this.hero.s);
      if (this.star) {
        const star = this.map.spots[this.star.ri][this.star.j];
        if (GOL.dist(pos.x, pos.y, star.x, star.y) <= 40) {
          this.enterWorld(this.star.ri, this.star.j);
          return;
        }
      }
      for (let ri = 0; ri < REGIONS.length; ri++) {
        if (!this.regionAwake(ri)) continue;
        for (let j = 0; j < REGIONS[ri].count; j++) {
          const sp = this.spotInfo[ri][j];
          const b = this.map.spots[ri][j];
          if (this.isDoor(sp) && GOL.dist(pos.x, pos.y, b.x, b.y) < 40) {
            this.enterWorld(ri, j);
            return;
          }
        }
      }
    },

    mapScale(H) { return clamp(H / 393, 0.88, 1.12); },

    // Touch walk buttons (r4.1 verdict): simple back/forward along the
    // trail, bottom-right, touch only — no full joystick.
    walkButtons(W, H) {
      if (!GOL.Input.touchMode) return null;
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
      const y = H - 58 - sa.b * 0.5;
      const x2 = W - 60 - sa.r;
      return [
        { x: x2 - 74, y, r: 30, dir: -1 },
        { x: x2, y, r: 30, dir: 1 }
      ];
    },

    mapCamMax(W, H) {
      const scale = this.mapScale(H);
      return {
        x: Math.max(0, this.map.w - W / scale),
        y: Math.max(0, this.map.h - H / scale)
      };
    },

    targetCam(W, H) {
      const scale = this.mapScale(H);
      const viewW = W / scale;
      const viewH = H / scale;
      let point;
      if (this.ceremony) {
        // v2: the light travels the WALK — from the heart's walk-by point,
        // over the bridge, through the gate, to the next island's first spot.
        const ri = this.ceremony.ri;
        const a = nearestLength(this.map.walkSamples, this.map.hearts[ri]);
        const b = nearestLength(this.map.walkSamples, this.map.spots[ri + 1][0]);
        point = pointAtSamples(this.map.walkSamples, lerp(a, b, this.travelK()));
      } else if (this.kbdFollow > 0 && this.hero) {
        point = pointAtSamples(this.map.walkSamples, this.hero.s);
      } else if (this.camFree > 0 && this.railS != null) {
        // the rail (r4.1 verdict): looking around slides along the journey's
        // own axis — you can scroll, but never get lost in empty sky
        point = pointAtSamples(this.map.walkSamples, this.railS);
      } else if (this.star) {
        point = this.map.spots[this.star.ri][this.star.j];
      } else {
        const lb = this.lastBloom();
        point = lb ? this.map.spots[lb.ri][lb.j]
          : this.map.spots[REGIONS.length - 1][REGIONS[REGIONS.length - 1].count - 1];
      }
      const max = this.mapCamMax(W, H);
      return {
        x: clamp(point.x - viewW * 0.46, 0, max.x),
        y: clamp(point.y - viewH * 0.58, 0, max.y)
      };
    },

    // The quiet home-screen reminder: a small parchment ribbon at top-center,
    // shown to any un-installed browser visit (this is the landscape counterpart
    // to the portrait "add to home screen" card). Tapping it opens the install
    // steps; the little × dismisses it for good. Installed players, debug, and
    // anyone who's hidden it never see it. One geometry source for tap + draw.
    installNudge(W, H) {
      if (GOL.isStandalone() || GOL.DEBUG) return null;
      const ins = GOL.store.data.install || {};
      if (ins.ribbonHidden) return null;
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
      const w = Math.min(236, W - 140), h = 34;
      const x = (W - w) / 2, y = sa.t * 0.5 + 14;
      return { x, y, w, h, close: { x: x + w - 16, y: y + h / 2, r: 13 } };
    },

    // the ribbon itself, in the map's cream-and-gold chrome language: a small
    // parchment pill with a gem-star, one gentle line, and a dismiss ×
    drawInstallNudge(ctx, W, H) {
      const n = this.installNudge(W, H);
      if (!n) return;
      const midY = n.y + n.h / 2;
      // a soft breathing glow so the eye finds it once, then lets it be
      const pulse = 0.5 + 0.5 * Math.sin(this.t * 1.6);
      ctx.save();
      ctx.shadowColor = alpha('#F0C878', 0.35 + 0.2 * pulse);
      ctx.shadowBlur = 10;
      ctx.fillStyle = 'rgba(250,244,224,0.92)';
      GOL.roundRect(ctx, n.x, n.y, n.w, n.h, n.h / 2); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = alpha('#C89B55', 0.8); ctx.lineWidth = 1.6;
      GOL.roundRect(ctx, n.x, n.y, n.w, n.h, n.h / 2); ctx.stroke();
      // a little gem-star at the left, matching the map's bloom stars
      const starX = n.x + 22;
      GOL.star8Path(ctx, starX, midY, 8, Math.PI / 8 + this.t * 0.2);
      const sg = ctx.createLinearGradient(0, midY - 8, 0, midY + 8);
      sg.addColorStop(0, GRAND.light); sg.addColorStop(1, GRAND.dark);
      ctx.fillStyle = sg; ctx.fill();
      // the line, gold-ink, sitting between the star and the ×
      GOL.text(ctx, 'Add to home screen', starX + 14 + (n.w - 78) / 2, midY,
        { size: 12.5, weight: '800', color: '#7A5A24', shadow: false });
      // the dismiss × — a faint ring with a soft cross
      const c = n.close;
      ctx.strokeStyle = alpha('#8A7A55', 0.5); ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = alpha('#7A6238', 0.8); ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      const k = 3.4;
      ctx.beginPath();
      ctx.moveTo(c.x - k, c.y - k); ctx.lineTo(c.x + k, c.y + k);
      ctx.moveTo(c.x + k, c.y - k); ctx.lineTo(c.x - k, c.y + k);
      ctx.stroke(); ctx.lineCap = 'butt';
    },

    update(dt, W, H) {
      this.t += dt;
      this.camFree = Math.max(0, this.camFree - dt);
      if (this.spotPulse) {
        this.spotPulse.t = Math.max(0, this.spotPulse.t - dt * 1.7);
        if (!this.spotPulse.t) this.spotPulse = null;
      }
      for (const tap of GOL.Input.taps) tap.ui = true;
      if (!this.map) {
        if (this.loadError && GOL.Input.taps.length) GOL.go('title');
        return;
      }
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
      const nudge = this.installNudge(W, H); // the home-screen reminder (or null)
      // The grown-ups doorway lives here on the home map now — the splash is
      // too fleeting to hold it. A quiet star at top-left, beside the back
      // arrow, that opens only on a patient ~1s press-and-hold. A plain tap
      // just pulses; the hold gate keeps children out gently.
      const gb = (this.grownBtn = { x: sa.l + 40 + 58, y: sa.t * 0.5 + 34, r: 15 });
      {
        let holding = false;
        for (const [, p] of GOL.Input.pointers) {
          if (GOL.dist(p.x, p.y, gb.x, gb.y) < gb.r + 14) { holding = true; break; }
        }
        for (const tap of GOL.Input.taps) {
          if (GOL.dist(tap.x, tap.y, gb.x, gb.y) < gb.r + 14) this.grownPulse = 1;
        }
        this.grownHold = holding ? Math.min(1, (this.grownHold || 0) + dt) : Math.max(0, (this.grownHold || 0) - dt * 2.2);
        this.grownPulse = Math.max(0, (this.grownPulse || 0) - dt * 2.5);
        if (this.grownHold >= 1) { this.grownHold = 0; GOL.audio.sfx('unlockLevel'); GOL.go('grownups'); return; }
      }
      const scale = this.mapScale(H);
      const camMax = this.mapCamMax(W, H);
      if (this.cam == null) this.cam = this.targetCam(W, H);

      if (this.hero) {
        // she travels the trail itself, never as the crow flies
        const d = this.hero.sT - this.hero.s;
        if (Math.abs(d) > 1) this.hero.s += Math.sign(d) * Math.min(Math.abs(d), dt * 170);
      }
      const arrived = this.hero ? Math.abs(this.hero.sT - this.hero.s) <= 1 : true;

      // Waypoint walk (r4.2 verdict): she STEPS spot to spot — a subtle
      // snap, never resting between waypoints. Held input chains steps.
      const walkBtnsNow = this.walkButtons(W, H);
      if (this.hero && !this.ceremony) {
        const K = GOL.Input._keys || {};
        let dir = (K.ArrowRight || K.d || K.D ? 1 : 0) - (K.ArrowLeft || K.a || K.A ? 1 : 0);
        if (!dir && walkBtnsNow) {
          for (const p of GOL.Input.pointers.values()) {
            for (const b of walkBtnsNow) {
              if (GOL.dist(p.x, p.y, b.x, b.y) < b.r + 8) dir = b.dir;
            }
          }
        }
        this.stepCool = Math.max(0, (this.stepCool || 0) - dt);
        if (dir && arrived && this.stepCool <= 0 && this.waypoints) {
          // Debug lifts the star's cap so a grown-up can step to any built
          // world along the whole trail; normal play stops at the next star.
          const maxS = (this.star && !GOL.DEBUG)
            ? this.spotS[this.star.ri][this.star.j]
            : this.map.walkSamples.len;
          let target = null;
          if (dir > 0) {
            target = this.waypoints.find((s) => s > this.hero.sT + 2 && s <= maxS + 1);
          } else {
            for (const s of this.waypoints) if (s < this.hero.sT - 2) target = s;
          }
          if (target != null) {
            this.hero.sT = target;
            this.pendingBloom = false;
            this.dwell = null;
            this.stepCool = 0.12;
            this.kbdFollow = 2.2;
          }
        }
        if (!arrived) this.kbdFollow = Math.max(this.kbdFollow, 0.8);
        const act = !!(K.Enter || K[' ']);
        if (act && !this.kbdActHeld) { this.kbdActHeld = true; this.kbdAct(); }
        else if (!act) this.kbdActHeld = false;
      }
      this.kbdFollow = Math.max(0, (this.kbdFollow || 0) - dt);

      // Arrival semantics (r4.2 verdict): landing on the NEW bloom enters
      // its world at once; resting on an old bloom hesitates visibly, then
      // enters. Walking through never triggers.
      if (this.hero && arrived && !this.heroArrived) {
        this.heroArrived = true;
        this._onArrive();
      } else if (!arrived) {
        this.heroArrived = false;
        this.dwell = null;
      }
      if (this.dwell && !this.ceremony) {
        this.dwell.t += dt;
        if (this.dwell.t >= 1.0) {
          const d = this.dwell;
          this.dwell = null;
          this.enterWorld(d.ri, d.j);
          return;
        }
      }

      const drag = GOL.Input.drag;
      // NB: the install ribbon is deliberately NOT excluded here. Excluding a
      // region from the rail-drag also stops dragPrev being set for it, which is
      // exactly what turns a press-release into a clickAt — so excluding the
      // ribbon would make its tap (× and body alike) do nothing. A clean tap on
      // it moves <12px, so it never scrolls; only a real drag-from-ribbon does.
      const dragOnBtns = drag && (
        (walkBtnsNow && walkBtnsNow.some((b) => GOL.dist(drag.startX, drag.startY, b.x, b.y) < b.r + 10)) ||
        GOL.dist(drag.startX, drag.startY, gb.x, gb.y) < gb.r + 14);
      if (drag && !this.ceremony && !dragOnBtns) {
        if (this.dragPrev && this.dragPrev.id === drag.id) {
          // rail scroll: project the drag onto the trail's local direction
          // and slide along it — never free into open sky
          if (this.railS == null) {
            const center = {
              x: this.cam.x + (W / scale) * 0.46,
              y: this.cam.y + (H / scale) * 0.58
            };
            this.railS = nearestLength(this.map.walkSamples, center);
          }
          const ahead = pointAtSamples(this.map.walkSamples, this.railS + 8);
          const here = pointAtSamples(this.map.walkSamples, this.railS - 8);
          const tl = Math.hypot(ahead.x - here.x, ahead.y - here.y) || 1;
          const tx = (ahead.x - here.x) / tl, ty = (ahead.y - here.y) / tl;
          const ds = -((drag.x - this.dragPrev.x) * tx + (drag.y - this.dragPrev.y) * ty) / scale;
          this.railS = clamp(this.railS + ds, 0, this.map.walkSamples.len);
        }
        this.dragPrev = { id: drag.id, x: drag.x, y: drag.y };
        if (Math.hypot(drag.x - drag.startX, drag.y - drag.startY) > 12) {
          this.dragMoved = true;
          this.camFree = 2.5;
        }
      }
      const released = GOL.Input.releases.length > 0 && this.dragPrev != null;
      const clickAt = released && !this.dragMoved ? GOL.Input.releases[0] : null;
      if (released) { this.dragPrev = null; this.dragMoved = false; }

      if (this.ceremony) {
        this.ceremony.t += dt;
        if (this.ceremony.t >= 4.8) this.ceremony = null;
      } else {
        if (this.camFree <= 0) this.railS = null;
        const target = this.targetCam(W, H);
        // the rail follows the finger promptly; the journey ease is calm
        const k = Math.min(1, dt * (this.camFree > 0 ? 6 : 1.8));
        this.cam.x += (target.x - this.cam.x) * k;
        this.cam.y += (target.y - this.cam.y) * k;
      }

      if (!clickAt || this.ceremony) return;
      // the home-screen ribbon: its × dismisses for good, its body re-opens the
      // install steps (returning here afterward)
      if (nudge) {
        if (GOL.dist(clickAt.x, clickAt.y, nudge.close.x, nudge.close.y) < nudge.close.r) {
          GOL.audio.sfx('tap');
          GOL.store.data.install.ribbonHidden = true;
          GOL.store.save();
          return;
        }
        if (clickAt.x >= nudge.x && clickAt.x <= nudge.x + nudge.w &&
            clickAt.y >= nudge.y && clickAt.y <= nudge.y + nudge.h) {
          GOL.audio.sfx('tap');
          GOL.go('install', { from: 'journeyMap' });
          return;
        }
      }
      // a plain tap on the grown-ups star only pulses — it opens on hold
      if (GOL.dist(clickAt.x, clickAt.y, gb.x, gb.y) < gb.r + 14) { this.grownPulse = 1; return; }
      if (GOL.dist(clickAt.x, clickAt.y, sa.l + 40, sa.t * 0.5 + 34) < 31) {
        GOL.go('title');
        return;
      }
      const wx = clickAt.x / scale + this.cam.x;
      const wy = clickAt.y / scale + this.cam.y;
      // the Remembering Moon over a bloom's shoulder: tapping it dreams
      // rather than re-entering (test before the bloom, like the old title)
      for (const m of this.moonBtns || []) {
        if (GOL.dist(wx, wy, m.x, m.y) < 24) {
          GOL.audio.unlock();
          GOL.audio.sfx('yourTurn');
          GOL.go('shrine', { memory: { surahId: m.surahId, returnWorld: null } });
          return;
        }
      }
      if (this.star) {
        const s = this.map.spots[this.star.ri][this.star.j];
        if (GOL.dist(wx, wy, s.x, s.y) <= 34) {
          this.walkToStar();
          return;
        }
      }
      // every finished bloom is a door into its world; home leads back here
      if (this.hero) {
        for (let ri = 0; ri < REGIONS.length; ri++) {
          if (!this.regionAwake(ri)) continue;
          for (let j = 0; j < REGIONS[ri].count; j++) {
            const sp = this.spotInfo[ri][j];
            const b = this.map.spots[ri][j];
            if (this.isDoor(sp) && GOL.dist(wx, wy, b.x, b.y) < 36) {
              this.enterWorld(ri, j);
              return;
            }
          }
        }
      }
    },

    drawMoon(ctx) {
      if (!this.map || !this.regionAwake(1)) return;
      const m = this.map.moon;
      const breathe = 0.5 + 0.5 * Math.sin(this.t * 1.5);
      ctx.fillStyle = alpha('#FFFFFF', 0.16 + breathe * 0.13);
      ctx.beginPath(); ctx.arc(m.x, m.y, 22 + breathe * 2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FFFBEA';
      ctx.beginPath(); ctx.arc(m.x, m.y, 12, 0, TAU); ctx.fill();
      ctx.fillStyle = '#BFDCC2';
      ctx.beginPath(); ctx.arc(m.x + 6, m.y - 2, 10, 0, TAU); ctx.fill();
    },

    drawLiving(ctx) {
      const active = this.activeRegion();
      for (let ri = 0; ri < REGIONS.length; ri++) {
        const wa = this.waterAlpha(ri);
        if (wa > 0.05) {
          const h = this.map.hearts[ri];
          drawFountain(ctx, h.x, h.y, this.t + ri * 2.1, wa);
        }
      }
      for (let ri = 0; ri < REGIONS.length; ri++) {
        const awake = this.regionAwake(ri);
        for (let j = 0; j < REGIONS[ri].count; j++) {
          const s = this.map.spots[ri][j];
          const sp = this.spotInfo[ri][j];
          const isStar = this.star && this.star.ri === ri && this.star.j === j;
          const pulse = this.spotPulse && this.spotPulse.ri === ri && this.spotPulse.j === j
            ? this.spotPulse.t : 0;
          if (sp && sp.done) {
            drawBloom(ctx, s.x, s.y, 11, this.t + ri * 5 + j, REGIONS[ri].bloom, pulse);
            const st = GOL.store.level(sp.surahId);
            // the hidden Rahma blossom, once found, blooms at the brow
            if (st.blossom) GOL.drawRahmaBlossom(ctx, s.x + 16, s.y - 24, 5, this.t + j);
            // the Remembering Moon over the other shoulder; while it can
            // still wax today it breathes its moonlit invitation
            const inviting = (this.moonBtns || []).some((m) => m.ri === ri && m.j === j);
            if (inviting) {
              const br = 0.2 + 0.12 * Math.sin(this.t * 1.8);
              ctx.fillStyle = alpha('#CFE0FF', br);
              ctx.beginPath(); ctx.arc(s.x - 18, s.y - 26, 12 + Math.sin(this.t * 1.8) * 1.5, 0, TAU); ctx.fill();
            }
            if (inviting || (st.moon || 0) > 0.01) {
              GOL.drawMoon(ctx, s.x - 18, s.y - 26, 7, st.moon || 0, this.t, { glow: false });
            }
            // a done garden long unheard breathes a soft golden ring
            if (this.missSpot && this.missSpot.ri === ri && this.missSpot.j === j) {
              const br = 0.35 + 0.3 * Math.sin(this.t * 2.2);
              ctx.strokeStyle = alpha('#FFE9A8', br);
              ctx.lineWidth = 2.5;
              ctx.beginPath(); ctx.arc(s.x, s.y - 6, 22 + Math.sin(this.t * 2.2) * 2, 0, TAU); ctx.stroke();
            }
          } else if (isStar) {
            const b = 0.72 + 0.28 * Math.sin(this.t * 2.4);
            GOL.star8Path(ctx, s.x, s.y - 7, 11 + b * 2 + pulse * 2, Math.PI / 8);
            ctx.fillStyle = alpha('#F0C878', 0.35 + b * 0.34); ctx.fill();
            ctx.strokeStyle = alpha('#B98A3E', 0.9); ctx.lineWidth = 2; ctx.stroke();
          } else if (awake) {
            // a bud: built-but-waiting stirs; a still-growing key sleeps soft
            drawBud(ctx, s.x, s.y, sp ? 0.82 : 0.5);
          }
        }
      }

      if (this.ceremony) {
        const h = this.map.hearts[this.ceremony.ri];
        const hk = this.traceK();
        if (hk > 0) {
          ctx.strokeStyle = alpha('#FFE9A8', 0.25 + hk * 0.6);
          ctx.lineWidth = 3 + hk * 3;
          ctx.save();
          // r4's fountain courts are smaller than the old painting's hearts;
          // the trace scales down to hug the basin.
          const pulse = (1 + Math.sin(hk * Math.PI) * 0.12) * 0.55;
          ctx.translate(h.x, h.y); ctx.scale(pulse, pulse); ctx.translate(-h.x, -h.y);
          heartPath(ctx, this.ceremony.ri, h.x, h.y); ctx.stroke();
          ctx.restore();
        }
        const tk = this.travelK();
        if (tk > 0 && tk < 1) {
          const a = nearestLength(this.map.walkSamples, this.map.hearts[this.ceremony.ri]);
          const b = nearestLength(this.map.walkSamples, this.map.spots[this.ceremony.ri + 1][0]);
          const p = pointAtSamples(this.map.walkSamples, lerp(a, b, tk));
          const glow = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 26);
          glow.addColorStop(0, 'rgba(255,246,220,0.96)');
          glow.addColorStop(1, 'rgba(255,246,220,0)');
          ctx.fillStyle = glow;
          ctx.beginPath(); ctx.arc(p.x, p.y, 26, 0, TAU); ctx.fill();
        }
      }

      this.drawMoon(ctx);
      if (this.hero) {
        const pos = pointAtSamples(this.map.walkSamples, this.hero.s);
        const ahead = pointAtSamples(this.map.walkSamples, this.hero.s + 6);
        const moving = Math.abs(this.hero.sT - this.hero.s) > 1;
        drawMapLightling(ctx, pos.x, pos.y, this.t, moving,
          ahead.x >= pos.x ? 1 : -1);
        if (this.dwell) {
          // the hesitation, visible: a ring closing in as entry nears
          const k = clamp(this.dwell.t / 1.0, 0, 1);
          ctx.strokeStyle = alpha('#FFE9A8', 0.25 + 0.55 * k);
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y + 2, 16 + (1 - k) * 14, 0, TAU);
          ctx.stroke();
        }
      }
      const nest = this.missSpot || this.star;
      if (nest && !this.ceremony) {
        const s = this.map.spots[nest.ri][nest.j];
        GOL.drawFirefly(ctx,
          s.x + 32 + Math.cos(this.t * 0.9) * 8,
          s.y - 32 + Math.sin(this.t * 1.7) * 8,
          this.t, 1.15);
      }
    },

    draw(ctx, W, H) {
      if (!this.map) {
        ctx.fillStyle = '#DFF0C8'; ctx.fillRect(0, 0, W, H);
        const a = this.loadError ? 0.35 : 0.7 + Math.sin(this.t * 2) * 0.18;
        GOL.star8(ctx, W / 2, H / 2, 24, Math.PI / 8 + this.t * 0.12, alpha('#F0C878', a));
        return;
      }
      const scale = this.mapScale(H);
      if (this.cam == null) this.cam = this.targetCam(W, H);
      const dx = -this.cam.x * scale;
      const dy = -this.cam.y * scale;
      const dw = this.map.w * scale;
      const dh = this.map.h * scale;
      ctx.drawImage(this.map.images.base, dx, dy, dw, dh);
      for (let i = 0; i < 3; i++) {
        const a = this.waterAlpha(i);
        if (a <= 0.001) continue;
        ctx.save(); ctx.globalAlpha = a; ctx.drawImage(this.map.images.water[i], dx, dy, dw, dh); ctx.restore();
      }

      // The lab's engine wash makes every unreached island sleep; the SVG
      // itself remains fully awake, exactly as the artist contract requires.
      // Data-driven: a soft dome over each asleep island, sized from its
      // own spots, fading as its wake ceremony arrives.
      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(-this.cam.x, -this.cam.y);
      for (let ri = 0; ri < REGIONS.length; ri++) {
        if (this.regionAwake(ri)) continue;
        const reveal = this.ceremony && this.ceremony.ri === ri - 1 ? this.travelK() : 0;
        const a = 0.30 * (1 - reveal);
        if (a <= 0.01) continue;
        const h = this.map.hearts[ri];
        let rr = 0;
        for (const sp of this.map.spots[ri]) {
          rr = Math.max(rr, Math.hypot(sp.x - h.x, sp.y - h.y));
        }
        rr += 170;
        const wash = ctx.createRadialGradient(h.x, h.y, rr * 0.35, h.x, h.y, rr);
        wash.addColorStop(0, alpha('#E8E6D1', a));
        wash.addColorStop(1, 'rgba(232,230,209,0)');
        ctx.fillStyle = wash;
        ctx.beginPath(); ctx.arc(h.x, h.y, rr, 0, TAU); ctx.fill();
      }
      ctx.restore();

      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(-this.cam.x, -this.cam.y);
      this.drawLiving(ctx);
      ctx.restore();
      ctx.drawImage(this.map.images.over, dx, dy, dw, dh);

      const sa = GOL.SAFE || { l: 0, t: 0 };
      GOL.drawButton(ctx, sa.l + 40, sa.t * 0.5 + 34, 22, 'back', { alpha: 0.76 });

      // the grown-ups doorway, beside the back arrow — a cream chip with a
      // quiet star, a hold-progress ring, and a small label
      const gb = this.grownBtn;
      if (gb) {
        const gp = this.grownHold || 0;
        if (this.grownPulse > 0) {
          ctx.strokeStyle = alpha('#C89B55', 0.6 * this.grownPulse);
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(gb.x, gb.y, gb.r + 6 + (1 - this.grownPulse) * 7, 0, TAU); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(250,244,224,0.76)';
        ctx.beginPath(); ctx.arc(gb.x, gb.y, gb.r + 1, 0, TAU); ctx.fill();
        ctx.strokeStyle = alpha('#C89B55', 0.7); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(gb.x, gb.y, gb.r - 1, 0, TAU); ctx.stroke();
        GOL.star8Path(ctx, gb.x, gb.y, gb.r * 0.5, Math.PI / 8 + this.t * 0.12);
        ctx.fillStyle = '#7A6238'; ctx.fill();
        if (gp > 0.01) {
          ctx.strokeStyle = alpha('#B8862E', 0.95);
          ctx.lineWidth = 2.6; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.arc(gb.x, gb.y, gb.r + 4, -Math.PI / 2, -Math.PI / 2 + gp * TAU); ctx.stroke();
          ctx.lineCap = 'butt';
        }
        GOL.text(ctx, 'for grown-ups', gb.x, gb.y + gb.r + 12, { size: 9.5, weight: '700', color: alpha('#3B2E14', 0.55), shadow: false });
      }

      this.drawInstallNudge(ctx, W, H);

      // touch walk buttons: back / forward along the trail
      const btns = this.walkButtons(W, H);
      if (btns && this.map && !this.ceremony) {
        for (const b of btns) {
          ctx.save();
          ctx.globalAlpha = 0.78;
          ctx.fillStyle = '#FDF6E4';
          ctx.strokeStyle = '#C9B98F'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 4, 0, TAU); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = '#8A7A55'; ctx.lineWidth = 4;
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          const d = b.dir * 5;
          ctx.beginPath();
          ctx.moveTo(b.x - d, b.y - 9);
          ctx.lineTo(b.x + d, b.y);
          ctx.lineTo(b.x - d, b.y + 9);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  };

  GOL.registerScene('journeyMap', journeyMap);
})();
