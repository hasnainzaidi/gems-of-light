// Journey lab · P19 — The Painted Journey
//
// The artist-contract SVG from map-artist-pack/, staged as a read-only lab.
// The file is rasterized once into a background, three independently wakeable
// water layers, and one foreground occlusion layer. Engine-drawn life sits
// between them: blooms, the breathing next star, Noor, the light-child, and
// the pale daytime moon. No production journey state is read or changed.
//
// Direct: ?lab=19
(function () {
  const GOL = window.GOL;
  const TAU = Math.PI * 2;
  const { alpha } = GOL.color;
  const scriptUrl = document.currentScript ? document.currentScript.src : location.href;
  // Which stage to inspect: the finished painting is the default; ?map=stub
  // (or another draft key) keeps the parallel artist-draft harness available.
  const MAP_KEY = (new URLSearchParams(location.search).get('map') || 'final')
    .replace(/[^A-Za-z0-9_-]/g, '');
  const ASSET_URL = new URL(MAP_KEY === 'final'
    ? '../../map-artist-pack/journey-map.svg?v=358'
    : '../../map-artist-pack/drafts/' + MAP_KEY + '/journey-map.svg?v=358',
  scriptUrl).href;
  // Contract v2 (round 4): 8 spots per region — the adopted 8/8/8 cut of
  // the 24-key WORLD_ORDER (Valley 1–8, Orchard 9–16, Heights 17–24).
  const REGIONS = [
    { count: 8, bloom: '#F5B8C4' },
    { count: 8, bloom: '#F2C46E' },
    { count: 8, bloom: '#E7C6A0' }
  ];
  const GRAND = {
    base: '#F0C878', light: '#FFE9A8', lighter: '#FFF6DC',
    dark: '#D9A44A', darker: '#B98A3E', glow: '#FFE9A8'
  };
  let assetPromise = null;
  // The map<->world toggle (round-3 verdict): entering a real world from
  // the map must come back to the map, sim state intact.
  let origHomeButton = null; // stashed while a world entered from the map
  let returnState = null;    // progress/camera/hero preserved across it

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
      // Contract v2: there is no stream — the map's only water is the three
      // fountain hearts, and the ceremony's light travels the walk itself.
      requireElement(root, 'walk', 'path');
      requireElement(root, 'over', 'g');
      for (let r = 1; r <= 3; r++) {
        requireElement(root, 'water-' + r, 'g');
        requireElement(root, 'heart-' + r, 'circle');
        for (let n = 1; n <= 8; n++) requireElement(root, 'spot-' + r + '-' + n, 'circle');
      }
      requireElement(root, 'gate-1', 'circle');
      requireElement(root, 'gate-2', 'circle');
      requireElement(root, 'moon', 'circle');

      // Mount invisibly for Safari's geometry APIs, then remove after sampling.
      root.style.cssText = 'position:absolute;left:-10000px;top:0;width:' + vb[2] + 'px;height:' + vb[3] + 'px;visibility:hidden;pointer-events:none';
      document.body.appendChild(root);
      const spots = [];
      for (let r = 1; r <= 3; r++) {
        const row = [];
        for (let n = 1; n <= 8; n++) row.push(circlePoint(root, 'spot-' + r + '-' + n));
        spots.push(row);
      }
      const hearts = [1, 2, 3].map((r) => circlePoint(root, 'heart-' + r));
      const moon = circlePoint(root, 'moon');
      const walkSamples = samplePath(requireElement(root, 'walk', 'path'), 3);
      root.removeAttribute('style');
      root.remove();

      const base = root.cloneNode(true);
      requireElement(base, 'over', 'g').remove();
      for (let r = 1; r <= 3; r++) requireElement(base, 'water-' + r, 'g').remove();
      const [baseImg, water1, water2, water3, overImg] = await Promise.all([
        imageFromRoot(base),
        imageFromRoot(layerRoot(root, 'water-1')),
        imageFromRoot(layerRoot(root, 'water-2')),
        imageFromRoot(layerRoot(root, 'water-3')),
        imageFromRoot(layerRoot(root, 'over'))
      ]);
      return {
        w: vb[2], h: vb[3], spots, hearts, moon, walkSamples,
        images: { base: baseImg, water: [water1, water2, water3], over: overImg }
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

  const paintedMapLab = {
    t: 0, map: null, loadError: null, progress: null, cam: null,
    dragPrev: null, dragMoved: false, camFree: 0, ceremony: null,
    hero: null, spotPulse: null, pendingBloom: false,

    enter() {
      // home again: the world's home button goes back to being the title's
      if (origHomeButton) { GOL.homeButton = origHomeButton; origHomeButton = null; }
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
      loadAsset().then((map) => {
        this.map = map;
        if (returnState) {
          // back from a world: the journey stands exactly where she left it
          this.progress = returnState.progress;
          this.cam = returnState.cam;
          this.hero = { s: returnState.heroS, sT: returnState.heroS };
          returnState = null;
          return;
        }
        const a = this.activeRegion();
        const j = a == null ? REGIONS[2].count - 1 : Math.max(0, this.progress[a] - 1);
        const s = map.spots[a == null ? 2 : a][j];
        const here = nearestLength(map.walkSamples, s);
        this.hero = { s: here, sT: here };
      }).catch((err) => {
        this.loadError = err;
        try { console.error('[gol] P19', err); } catch (_) {}
      });
    },

    activeRegion() {
      const i = this.progress.findIndex((p, j) => p < REGIONS[j].count);
      return i < 0 ? null : i;
    },

    regionAwake(i) {
      if (i === 0) return true;
      if (i === 1) return this.progress[0] >= REGIONS[0].count;
      return this.progress[1] >= REGIONS[1].count;
    },

    traceK() { return this.ceremony ? ease(clamp(this.ceremony.t / 1.5, 0, 1)) : 0; },
    travelK() { return this.ceremony ? ease(clamp((this.ceremony.t - 1.7) / 2.4, 0, 1)) : 0; },

    waterAlpha(i) {
      if (i < 2 || !this.ceremony || this.ceremony.ri !== 1 || i !== 2) {
        return this.regionAwake(i) ? 1 : 0;
      }
      return this.travelK();
    },

    // Tap the breathing star: she walks the trail there FIRST, and the
    // bloom opens when she arrives (round-3: motion belongs to the path).
    bloomAtStar(instant) {
      const a = this.activeRegion();
      if (a == null || !this.map || !this.hero || !this.regionAwake(a) || this.ceremony) return;
      const spot = this.map.spots[a][this.progress[a]];
      const sT = nearestLength(this.map.walkSamples, spot);
      if (instant) {
        this.hero.s = this.hero.sT = sT;
        this._doBloom();
        return;
      }
      this.hero.sT = sT;
      this.pendingBloom = true;
      if (GOL.audio) GOL.audio.sfx('tap');
    },
    _doBloom() {
      const a = this.activeRegion();
      if (a == null) return;
      this.progress[a]++;
      this.spotPulse = { ri: a, j: this.progress[a] - 1, t: 1 };
      if (GOL.audio) GOL.audio.sfx('blossom');
      if (this.progress[a] === REGIONS[a].count && a < REGIONS.length - 1) {
        this.ceremony = { ri: a, t: 0 };
      }
    },

    // Boot's G hotkey means “the next thing” in debug. This also makes the
    // embedded browser's interaction-throttled canvas practical to inspect.
    debugCollectAll() { this.bloomAtStar(true); },

    // The toggle: a bloomed spot is a door into the real game; home inside
    // the world leads back here, journey intact. Shared by tap and keyboard.
    enterWorld() {
      returnState = {
        progress: this.progress.slice(),
        cam: { x: this.cam.x, y: this.cam.y },
        heroS: this.hero.s
      };
      if (!origHomeButton) {
        origHomeButton = GOL.homeButton;
        GOL.homeButton = function () {
          const btn = origHomeButton.apply(GOL, arguments);
          btn.fn = () => GOL.go('paintedMapLab');
          return btn;
        };
      }
      GOL.audio.unlock();
      if (GOL.audio) GOL.audio.sfx('unlockLevel');
      GOL.go('adventure', { world: GOL.currentWorld ? GOL.currentWorld() : 1 });
    },

    // Keyboard navigation (r4 verdict): enter/space acts on whatever she
    // stands beside — the breathing star blooms, a finished bloom opens
    // its world.
    kbdAct() {
      if (!this.map || !this.hero) return;
      const pos = pointAtSamples(this.map.walkSamples, this.hero.s);
      const a = this.activeRegion();
      if (a != null && this.regionAwake(a) && !this.pendingBloom) {
        const star = this.map.spots[a][this.progress[a]];
        if (GOL.dist(pos.x, pos.y, star.x, star.y) <= 40) {
          this.bloomAtStar(false);
          return;
        }
      }
      for (let ri = 0; ri < REGIONS.length; ri++) {
        if (!this.regionAwake(ri)) continue;
        for (let j = 0; j < this.progress[ri]; j++) {
          const b = this.map.spots[ri][j];
          if (GOL.dist(pos.x, pos.y, b.x, b.y) < 40) {
            this.enterWorld();
            return;
          }
        }
      }
    },

    mapScale(H) { return clamp(H / 393, 0.88, 1.12); },

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
      } else {
        const ri = this.activeRegion();
        point = ri == null
          ? this.map.spots[2][REGIONS[2].count - 1]
          : this.map.spots[ri][this.progress[ri]];
      }
      const max = this.mapCamMax(W, H);
      return {
        x: clamp(point.x - viewW * 0.46, 0, max.x),
        y: clamp(point.y - viewH * 0.58, 0, max.y)
      };
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
      const scale = this.mapScale(H);
      const camMax = this.mapCamMax(W, H);
      if (this.cam == null) this.cam = this.targetCam(W, H);

      if (this.hero) {
        // she travels the trail itself, never as the crow flies
        const d = this.hero.sT - this.hero.s;
        if (Math.abs(d) > 1) {
          this.hero.s += Math.sign(d) * Math.min(Math.abs(d), dt * 170);
        } else if (this.pendingBloom) {
          this.pendingBloom = false;
          this._doBloom();
        }
      }

      // Keyboard walk (r4 verdict): arrows carry her along the trail (the
      // camera follows her), stopping at the journey's breathing edge.
      if (this.hero && !this.ceremony) {
        const K = GOL.Input._keys || {};
        const dir = (K.ArrowRight || K.d || K.D ? 1 : 0) - (K.ArrowLeft || K.a || K.A ? 1 : 0);
        if (dir) {
          const a = this.activeRegion();
          const maxS = a == null
            ? this.map.walkSamples.len
            : nearestLength(this.map.walkSamples, this.map.spots[a][this.progress[a]]);
          this.hero.s = this.hero.sT = clamp(this.hero.s + dir * dt * 190, 0, maxS);
          this.pendingBloom = false;
          this.kbdFollow = 2.2;
        }
        const act = !!(K.Enter || K[' ']);
        if (act && !this.kbdActHeld) { this.kbdActHeld = true; this.kbdAct(); }
        else if (!act) this.kbdActHeld = false;
      }
      this.kbdFollow = Math.max(0, (this.kbdFollow || 0) - dt);

      const drag = GOL.Input.drag;
      if (drag && !this.ceremony) {
        if (this.dragPrev && this.dragPrev.id === drag.id) {
          this.cam.x = clamp(this.cam.x - (drag.x - this.dragPrev.x) / scale, 0, camMax.x);
          this.cam.y = clamp(this.cam.y - (drag.y - this.dragPrev.y) / scale, 0, camMax.y);
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
      } else if (this.camFree <= 0 && !drag) {
        const target = this.targetCam(W, H);
        const k = Math.min(1, dt * 1.8);
        this.cam.x += (target.x - this.cam.x) * k;
        this.cam.y += (target.y - this.cam.y) * k;
      }

      if (!clickAt || this.ceremony) return;
      const sa = GOL.SAFE || { l: 0, t: 0 };
      if (GOL.dist(clickAt.x, clickAt.y, sa.l + 40, sa.t * 0.5 + 34) < 31) {
        GOL.go('title');
        return;
      }
      const wx = clickAt.x / scale + this.cam.x;
      const wy = clickAt.y / scale + this.cam.y;
      const a = this.activeRegion();
      if (a != null && this.regionAwake(a) && !this.pendingBloom) {
        const s = this.map.spots[a][this.progress[a]];
        if (GOL.dist(wx, wy, s.x, s.y) <= 34) {
          this.bloomAtStar(false);
          return;
        }
      }
      // The toggle test: every finished bloom is a door into the real
      // game. Home inside the world leads back HERE, journey intact.
      if (this.hero) {
        for (let ri = 0; ri < REGIONS.length; ri++) {
          if (!this.regionAwake(ri)) continue;
          for (let j = 0; j < this.progress[ri]; j++) {
            const b = this.map.spots[ri][j];
            if (GOL.dist(wx, wy, b.x, b.y) < 36) {
              this.enterWorld();
              return;
            }
          }
        }
      }
    },

    drawMoon(ctx) {
      if (!this.map || this.progress[0] < REGIONS[0].count) return;
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
          const pulse = this.spotPulse && this.spotPulse.ri === ri && this.spotPulse.j === j
            ? this.spotPulse.t : 0;
          if (j < this.progress[ri]) {
            drawBloom(ctx, s.x, s.y, 11, this.t + ri * 5 + j, REGIONS[ri].bloom, pulse);
          } else if (ri === active && j === this.progress[ri]) {
            const b = 0.72 + 0.28 * Math.sin(this.t * 2.4);
            GOL.star8Path(ctx, s.x, s.y - 7, 11 + b * 2 + pulse * 2, Math.PI / 8);
            ctx.fillStyle = alpha('#F0C878', 0.35 + b * 0.34); ctx.fill();
            ctx.strokeStyle = alpha('#B98A3E', 0.9); ctx.lineWidth = 2; ctx.stroke();
          } else if (awake) {
            drawBud(ctx, s.x, s.y, 0.82);
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
      }
      if (active != null && !this.ceremony) {
        const s = this.map.spots[active][this.progress[active]];
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

      // The lab's engine wash makes the unreached terrace sleep; the SVG
      // itself remains fully awake, exactly as the artist contract requires.
      if (!this.regionAwake(2)) {
        const reveal = this.ceremony && this.ceremony.ri === 1 ? this.travelK() : 0;
        ctx.save();
        ctx.scale(scale, scale);
        ctx.translate(-this.cam.x, -this.cam.y);
        // aimed at r4's Courtyard Heights (center ≈ 1320,135)
        const wash = ctx.createLinearGradient(1060, 460, 1340, 140);
        wash.addColorStop(0, 'rgba(232,230,209,0)');
        wash.addColorStop(1, alpha('#E8E6D1', 0.32 * (1 - reveal)));
        ctx.fillStyle = wash;
        ctx.beginPath();
        ctx.moveTo(1010, 0);
        ctx.lineTo(this.map.w, 0);
        ctx.lineTo(this.map.w, 500);
        ctx.lineTo(1330, 470);
        ctx.lineTo(1060, 320);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(-this.cam.x, -this.cam.y);
      this.drawLiving(ctx);
      ctx.restore();
      ctx.drawImage(this.map.images.over, dx, dy, dw, dh);

      const sa = GOL.SAFE || { l: 0, t: 0 };
      GOL.drawButton(ctx, sa.l + 40, sa.t * 0.5 + 34, 22, 'back', { alpha: 0.76 });
    }
  };

  GOL.PROTOTYPES[19] = {
    key: 'painted-journey',
    name: 'the painted journey',
    scene: 'paintedMapLab'
  };
  GOL.registerScene('paintedMapLab', paintedMapLab);
})();
