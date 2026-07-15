// Journey lab · P18 — The Terraced Valley
//
// P17's garden, un-flattened. One continuous landscape instead of four
// stamped beds: three terraces climbing a sunlit hillside, each a PLACE
// with its own character and palette family (Garden morning → Orchard
// afternoon → Courtyard warm stone — the world palettes the game already
// owns). The camera drifts over a map wider than the screen; there are no
// pages, just ground that continues. Every finished world is a gem-hearted
// bloom on the path; each region keeps a geometric HEART (spring-star,
// quatrefoil clearing, octagon court) as its shape identity. Water flows
// exactly as far as the journey has opened; stepped water-stairs (chadars,
// the classical Persian garden device) climb between terraces, and the
// blooming ceremony sends one bright ripple up them to wake the next region.
//
// Regions are DATA over contiguous WORLD_ORDER runs — growing past 17
// surahs later means appending one entry here; the terrain simply continues
// off the right edge and nothing a child knows ever moves.
//
// Pure presentation lab: simulated progress, no saves, no real worlds.
// Tap the breathing star to "finish" a world; drag to look around.
// Direct: ?lab=18
(function () {
  const GOL = window.GOL;
  const TAU = Math.PI * 2;
  const { alpha, tint, shade } = GOL.color;
  const GRAND = {
    base: '#F0C878', light: '#FFE9A8', lighter: '#FFF6DC',
    dark: '#D9A44A', darker: '#B98A3E', glow: '#FFE9A8'
  };
  const TILT = 0.5;

  const REGIONS = [
    { key: 'valley', pal: 'fatiha', count: 5, bloom: '#F5B8C4', heart: 'star', moon: true },
    { key: 'orchard', pal: 'maun', count: 6, bloom: '#FFD9A0', heart: 'quatrefoil' },
    { key: 'court', pal: 'zalzalah', count: 6, bloom: '#DCC5EE', heart: 'octagon' }
  ];

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function ease(v) { return v * v * (3 - 2 * v); }
  function lerp(a, b, k) { return a + (b - a) * k; }

  // World-space layout, H-dependent. Each region's width comes from its
  // count, each terrace stands a step higher than the last.
  function layout(H) {
    if (layout.cache && layout.cache.H === H) return layout.cache;
    let x = 0;
    const regs = REGIONS.map((r, i) => {
      const w = 320 + r.count * 100;
      const gy = H * (0.78 - i * 0.135);
      const spots = [];
      for (let j = 0; j < r.count; j++) {
        const k = r.count === 1 ? 0.5 : j / (r.count - 1);
        spots.push({ x: x + 150 + (w - 300) * k, y: gy - 24 + Math.sin(j * 2.3 + i * 1.7) * 8 });
      }
      const reg = Object.assign({}, r, {
        i, x0: x, x1: x + w, gy, spots,
        hx: x + w / 2, hy: gy - 74, P: GOL.PALETTES[r.pal]
      });
      x += w;
      return reg;
    });
    layout.cache = { H, regs, mapW: x };
    return layout.cache;
  }

  function drawBloom(ctx, x, y, r, t, color, pulse) {
    const rr = r * (1 + (pulse || 0) * 0.22);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * 1.3 + x * 0.07) * 0.05);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + t * 0.1;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * rr * 0.62, Math.sin(a) * rr * 0.62, rr * 0.52, rr * 0.3, a, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    GOL.drawGem(ctx, x, y, r * 0.52 + (pulse || 0) * 2, GRAND, t, { phase: x * 0.1, glow: 0.7 });
  }

  function drawBud(ctx, x, y, a) {
    ctx.save(); ctx.globalAlpha *= a;
    ctx.strokeStyle = '#6DA84E'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.quadraticCurveTo(x + 1, y - 2, x, y - 6); ctx.stroke();
    ctx.fillStyle = '#C9DCAE';
    ctx.beginPath(); ctx.ellipse(x, y - 8, 4, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#B0CB94';
    ctx.beginPath(); ctx.ellipse(x - 2.2, y - 7, 2.2, 4.8, 0.5, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 2.2, y - 7, 2.2, 4.8, -0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#FDF0E4';
    ctx.beginPath(); ctx.ellipse(x, y - 11, 1.9, 2.5, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // A region's geometric heart, in local ground space (call inside the
  // tilt transform). The outline IS the region's shape identity.
  function heartPath(ctx, kind, R) {
    if (kind === 'star') { GOL.star8Path(ctx, 0, 0, R, Math.PI / 8); return; }
    if (kind === 'quatrefoil') {
      const d = R * 0.44, r = R * 0.58;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 - Math.PI / 2;
        ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r, a - Math.PI * 0.78, a + Math.PI * 0.78);
      }
      ctx.closePath();
      return;
    }
    ctx.beginPath(); // octagon
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + Math.PI / 8;
      const px = Math.cos(a) * R, py = Math.sin(a) * R;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  }

  const valleyLab = {
    t: 0, cam: 0, camFree: 0, dragPrev: null, dragMoved: false,
    progress: null, moonWaxed: false, ceremony: null,
    heartPulse: null, spotPulse: null, fx: null, bd: null,

    enter() {
      this.t = 0;
      this.progress = [5, 4, 0];
      this.moonWaxed = false;
      this.ceremony = null;
      this.heartPulse = [0, 0, 0];
      this.spotPulse = null;
      this.cam = null; // set on first update, once W is known
      this.camFree = 0;
      this.dragPrev = null;
      this.dragMoved = false;
      this.fx = GOL.makeFx();
    },

    activeRegion() {
      const i = this.progress.findIndex((p, j) => p < REGIONS[j].count);
      return i === -1 ? null : i;
    },
    // A region is awake once the journey's water has reached it. While a
    // ceremony runs, everything past it still sleeps (P16's rule, kept).
    awake(i) {
      if (this.ceremony && i > this.ceremony.ri) return false;
      const a = this.activeRegion();
      return a == null || i <= a;
    },

    // --- the blooming ceremony ---
    // trace 0–1.6 · burst 1.6–2.4 · the ripple travels 2.4–4.6 · settle 5.0
    traceK(t) { return ease(clamp(t / 1.6, 0, 1)); },
    burstK(t) { return clamp((t - 1.6) / 0.8, 0, 1); },
    travelK(t) { return ease(clamp((t - 2.4) / 2.2, 0, 1)); },

    // The ripple's road: heart → down to the path → along the stream →
    // up the water-stair → to the next region's first world.
    ripplePath(H, ri) {
      const { regs } = layout(H);
      const a = regs[ri], b = regs[ri + 1];
      if (!b) return null;
      const ry = a.gy - 10;
      const pts = [
        { x: a.hx, y: a.hy }, { x: a.hx, y: ry }, { x: a.x1 - 34, y: ry },
        { x: a.x1 + 13, y: b.gy + (a.gy - b.gy) * 0.5 },
        { x: a.x1 + 30, y: b.gy - 10 }, { x: b.spots[0].x, y: b.gy - 10 }
      ];
      let len = 0;
      const segs = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const d = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
        segs.push({ a: pts[i], b: pts[i + 1], d });
        len += d;
      }
      return { segs, len };
    },
    ripplePos(H, ri, k) {
      const p = this.ripplePath(H, ri);
      if (!p) return null;
      let rest = k * p.len;
      for (const s of p.segs) {
        if (rest <= s.d) {
          const kk = s.d ? rest / s.d : 0;
          return { x: lerp(s.a.x, s.b.x, kk), y: lerp(s.a.y, s.b.y, kk) };
        }
        rest -= s.d;
      }
      const last = p.segs[p.segs.length - 1];
      return { x: last.b.x, y: last.b.y };
    },

    update(dt, W, H) {
      this.t += dt;
      this.fx.update(dt);
      const { regs, mapW } = layout(H);
      const camMax = Math.max(0, mapW - W);
      for (let i = 0; i < 3; i++) this.heartPulse[i] = Math.max(0, this.heartPulse[i] - dt * 2.2);
      if (this.spotPulse) {
        this.spotPulse.t -= dt * 1.7;
        if (this.spotPulse.t <= 0) this.spotPulse = null;
      }
      this.camFree = Math.max(0, this.camFree - dt);

      // --- drag to look around; a barely-moved touch is a tap on release ---
      const drag = GOL.Input.drag;
      if (drag && !this.ceremony) {
        if (this.dragPrev && this.dragPrev.id === drag.id) {
          this.cam = clamp(this.cam - (drag.x - this.dragPrev.x), 0, camMax);
        }
        this.dragPrev = { id: drag.id, x: drag.x };
        if (Math.abs(drag.x - drag.startX) > 12) { this.dragMoved = true; this.camFree = 2.5; }
      }
      const released = GOL.Input.releases.length > 0 && this.dragPrev != null;
      const wasClick = released && !this.dragMoved;
      const clickAt = wasClick ? GOL.Input.releases[0] : null;
      if (released) { this.dragPrev = null; this.dragMoved = false; }

      // --- the camera: follow the journey (or the ripple), unless the
      // grown hand just panned away for a look ---
      let focus = null;
      if (this.ceremony) {
        const rp = this.ripplePos(H, this.ceremony.ri, this.travelK(this.ceremony.t));
        focus = rp ? rp.x : regs[this.ceremony.ri].hx;
      } else {
        const a = this.activeRegion();
        const r = a == null ? regs[regs.length - 1] : regs[a];
        focus = a == null ? r.hx : r.spots[this.progress[a]].x;
      }
      const target = clamp(focus - W * 0.46, 0, camMax);
      if (this.cam == null) this.cam = target;
      if (this.camFree <= 0 && !drag) this.cam += (target - this.cam) * Math.min(1, dt * 1.8);

      if (this.ceremony) {
        const c = this.ceremony;
        const wasBurst = this.burstK(c.t) > 0;
        const wasTravel = this.travelK(c.t) > 0;
        c.t += dt;
        if (!wasBurst && this.burstK(c.t) > 0) {
          if (GOL.audio) GOL.audio.sfx('praise');
          for (const s of regs[c.ri].spots) {
            for (let k = 0; k < 4; k++) {
              this.fx.spawn('petal', s.x - this.cam + GOL.rnd(-8, 8), s.y - 12,
                { color: Math.random() < 0.5 ? regs[c.ri].bloom : '#FFE9A8' });
            }
          }
        }
        if (!wasTravel && this.travelK(c.t) > 0 && GOL.audio) GOL.audio.sfx('door');
        if (this.travelK(c.t) >= 1 && this.travelK(c.t - dt) < 1 && GOL.audio) GOL.audio.sfx('unlockLevel');
        if (c.t >= 5.0) this.ceremony = null;
        for (const tap of GOL.Input.taps) tap.ui = true;
        return;
      }
      // taps fire on pointerdown; in a draggable scene only releases count
      for (const tap of GOL.Input.taps) tap.ui = true;
      if (!clickAt) return;

      const wx = clickAt.x + this.cam, wy = clickAt.y;
      const q = (GOL.SAFE || { l: 0, t: 0 });
      if (GOL.dist(clickAt.x, clickAt.y, q.l + 40, q.t * 0.5 + 34) < 31) {
        GOL.go('title');
        return;
      }

      // the daytime moon over the valley's heart
      if (!this.moonWaxed && this.progress[0] === REGIONS[0].count) {
        if (GOL.dist(wx, wy, regs[0].hx + 46, regs[0].hy - 92) < 24) {
          this.moonWaxed = true;
          if (GOL.audio) GOL.audio.sfx('yourTurn');
          return;
        }
      }

      // the breathing star: finish the next world of the active region
      const a = this.activeRegion();
      if (a != null && this.awake(a)) {
        const reg = regs[a];
        for (let j = 0; j < reg.count; j++) {
          const s = reg.spots[j];
          if (GOL.dist(wx, wy, s.x, s.y) < 24) {
            const prog = this.progress[a];
            if (j === prog) {
              this.progress[a]++;
              this.spotPulse = { ri: a, j, t: 1 };
              if (GOL.audio) GOL.audio.sfx('blossom');
              for (let k = 0; k < 5; k++) {
                this.fx.spawn('petal', s.x - this.cam + GOL.rnd(-6, 6), s.y - 10, { color: reg.bloom });
              }
              if (this.progress[a] === reg.count) {
                if (a + 1 < regs.length) this.ceremony = { t: 0, ri: a };
                else if (GOL.audio) GOL.audio.sfx('praise');
              }
            } else {
              this.spotPulse = { ri: a, j, t: 1 };
              if (GOL.audio) GOL.audio.sfx(j < prog ? 'tap' : 'drift');
            }
            return;
          }
        }
      }

      // a region's heart answers with a gentle lean — the future zoom's seat
      for (const reg of regs) {
        if (GOL.dist(wx, wy, reg.hx, reg.hy) < 56) {
          this.heartPulse[reg.i] = 1;
          if (GOL.audio) GOL.audio.sfx(this.awake(reg.i) ? 'tap' : 'drift');
          return;
        }
      }
    },

    // ------------------------------------------------------------ drawing --

    // The sky's palette drifts across the regions as the camera travels —
    // morning gold into orchard afternoon into warm courtyard stone.
    skyPal(W, H) {
      const { regs, mapW } = layout(H);
      const f = clamp((this.cam + W / 2) / mapW, 0, 1);
      const k = f * (regs.length - 1);
      const i = Math.min(regs.length - 2, Math.floor(k));
      return GOL.lerpPal(regs[i].P, regs[i + 1].P, ease(clamp(k - i, 0, 1)));
    },

    drawTerrace(ctx, W, H, reg) {
      const P = reg.P;
      const cam = this.cam;
      const x0 = reg.x0 - (reg.i === 0 ? 400 : 0);
      const x1 = reg.x1 + (reg.i === REGIONS.length - 1 ? 400 : 26);
      if (x1 - cam < -40 || x0 - cam > W + 40) return;
      // the back slope: hazier rising ground behind the path, so each
      // terrace has depth of its own instead of sitting flat on a lawn
      ctx.fillStyle = alpha(tint(P.grassLight, 0.28), 0.85);
      ctx.beginPath();
      ctx.moveTo(x0 - cam, reg.gy);
      for (let x = x0; x <= x1; x += 26) {
        ctx.lineTo(x - cam, reg.gy - 96 + Math.sin(x * 0.011 + reg.i * 3) * 10);
      }
      ctx.lineTo(x1 - cam, reg.gy);
      ctx.closePath(); ctx.fill();
      // the terrace floor
      const g = ctx.createLinearGradient(0, reg.gy - 14, 0, H);
      g.addColorStop(0, tint(P.grass, 0.14));
      g.addColorStop(0.3, P.grass);
      g.addColorStop(1, shade(P.grass, 0.24));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x0 - cam, H);
      ctx.lineTo(x0 - cam, reg.gy);
      for (let x = x0; x <= x1; x += 24) {
        ctx.lineTo(x - cam, reg.gy + Math.sin(x * 0.014 + 2) * 5 - 3);
      }
      ctx.lineTo(x1 - cam, reg.gy);
      ctx.lineTo(x1 - cam, H);
      ctx.closePath(); ctx.fill();
      // quiet grass tufts, deterministic so the hillside holds still
      ctx.strokeStyle = alpha(P.grassDark, 0.45);
      ctx.lineWidth = 1.3; ctx.lineCap = 'round';
      for (let i = 0; i < 30; i++) {
        const tx = reg.x0 + ((i * 149.3 + reg.i * 61) % (reg.x1 - reg.x0));
        const ty = reg.gy + 26 + ((i * 83.7) % (H - reg.gy - 46));
        const sx = tx - cam;
        if (sx < -10 || sx > W + 10) continue;
        const sway = Math.sin(this.t * 1.4 + i) * 0.8;
        ctx.beginPath(); ctx.moveTo(sx, ty + 4); ctx.quadraticCurveTo(sx + sway, ty - 1, sx + sway * 1.4, ty - 5); ctx.stroke();
      }
    },

    drawLandmarks(ctx, W, H, reg) {
      const P = reg.P;
      const cam = this.cam;
      if (reg.key === 'orchard') {
        // laden boughs on the back slope, behind the path
        for (let i = 0; i < 4; i++) {
          const tx = reg.x0 + 120 + i * ((reg.x1 - reg.x0 - 240) / 3) - cam;
          if (tx < -60 || tx > W + 60) continue;
          const ty = reg.gy - 40 - (i % 2) * 14;
          ctx.fillStyle = P.trunk;
          ctx.fillRect(tx - 4.5, ty - 26, 9, 30);
          ctx.fillStyle = P.trunkDark;
          ctx.fillRect(tx + 1.5, ty - 26, 3, 30);
          for (let b = 0; b < 3; b++) {
            const ba = (b / 3) * TAU + i;
            ctx.fillStyle = b % 2 ? P.leaf : P.leafLight;
            ctx.beginPath();
            ctx.ellipse(tx + Math.cos(ba) * 12, ty - 34 + Math.sin(ba) * 8, 17, 13, 0, 0, TAU);
            ctx.fill();
          }
          ctx.fillStyle = P.gold;
          for (let f = 0; f < 3; f++) {
            ctx.beginPath();
            ctx.arc(tx - 10 + f * 10, ty - 34 + (f % 2) * 9, 2.2, 0, TAU);
            ctx.fill();
          }
        }
      }
      if (reg.key === 'court') {
        // warm stone arches along the back slope — the courtyard's walls
        for (let i = 0; i < 2; i++) {
          const ax = reg.hx + (i ? 150 : -150) - cam;
          if (ax < -80 || ax > W + 80) continue;
          const ay = reg.gy - 34;
          ctx.fillStyle = P.stoneShade;
          ctx.fillRect(ax - 26, ay - 46, 9, 46);
          ctx.fillRect(ax + 17, ay - 46, 9, 46);
          ctx.strokeStyle = P.stone; ctx.lineWidth = 9; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.arc(ax, ay - 44, 22, Math.PI, 0); ctx.stroke();
          ctx.strokeStyle = alpha(P.stoneDark, 0.6); ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(ax, ay - 44, 26, Math.PI, 0); ctx.stroke();
          GOL.star8(ctx, ax, ay - 70, 3.2, Math.PI / 8, alpha(P.gold, 0.8));
        }
      }
      if (reg.key === 'valley') {
        // rushes around the spring
        for (let i = 0; i < 5; i++) {
          const rx = reg.hx + (i - 2) * 30 + Math.sin(i * 7) * 8 - cam;
          if (rx < -20 || rx > W + 20) continue;
          const ry = reg.hy + 26 + (i % 2) * 5;
          const sway = Math.sin(this.t * 1.2 + i) * 2;
          ctx.strokeStyle = '#7FA968'; ctx.lineWidth = 2; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(rx, ry); ctx.quadraticCurveTo(rx + sway, ry - 12, rx + sway * 1.6, ry - 22); ctx.stroke();
          ctx.fillStyle = '#B99B6B';
          ctx.beginPath(); ctx.ellipse(rx + sway * 1.6, ry - 24, 2.4, 5, 0.1, 0, TAU); ctx.fill();
        }
      }
    },

    drawStream(ctx, W, H, reg) {
      // the terrace's runnel: alive as far as the journey has opened
      const cam = this.cam;
      const lit = this.awake(reg.i);
      const x1 = reg.x0 + 90, x2 = reg.x1 - 30;
      const y = reg.gy - 10;
      if (x2 - cam < 0 || x1 - cam > W) return;
      // during the ceremony the new region's water fills behind the ripple
      let fillK = 1;
      if (this.ceremony && reg.i === this.ceremony.ri + 1) {
        const p = this.ripplePath(H, this.ceremony.ri);
        const last = p.segs[p.segs.length - 1];
        const k = this.travelK(this.ceremony.t) * p.len - (p.len - last.d);
        fillK = clamp(k / last.d, 0, 1);
        if (fillK <= 0 && !lit) { /* still dry */ }
      }
      ctx.fillStyle = alpha(reg.P.stoneShade, 0.6);
      ctx.fillRect(x1 - cam, y - 5, x2 - x1, 10);
      if (lit || fillK < 1) {
        // dry bed first; water covers it as it arrives
        ctx.fillStyle = alpha(shade(reg.P.soil, 0.08), lit ? 1 : 0.9);
        ctx.fillRect(x1 - cam, y - 3.5, x2 - x1, 7);
      }
      const wet = lit ? 1 : 0;
      const wk = this.ceremony && reg.i === this.ceremony.ri + 1 ? fillK : wet;
      if (wk > 0) {
        const wg = ctx.createLinearGradient(0, y - 3.5, 0, y + 3.5);
        wg.addColorStop(0, reg.P.waterHi);
        wg.addColorStop(1, reg.P.water);
        ctx.fillStyle = wg;
        ctx.fillRect(x1 - cam, y - 3.5, (x2 - x1) * wk, 7);
        for (let g = 0; g < 6; g++) {
          const k = ((this.t * 0.1 + g * 0.167 + reg.i * 0.37) % 1);
          if (k > wk) continue;
          const gx = x1 + (x2 - x1) * k - cam;
          if (gx < -6 || gx > W + 6) continue;
          ctx.fillStyle = alpha('#FFFFFF', 0.3 + 0.22 * Math.sin(this.t * 3 + g * 2));
          ctx.beginPath(); ctx.ellipse(gx, y + Math.sin(k * 9) * 1.5, 4, 1.3, 0, 0, TAU); ctx.fill();
        }
      }
    },

    drawChadar(ctx, W, H, lower, upper) {
      // the water-stair between terraces, with the little gate at its crest
      const cam = this.cam;
      const bx = upper.x0;
      if (bx - cam < -80 || bx - cam > W + 80) return;
      const steps = 4;
      const drop = lower.gy - upper.gy;
      // wet once the upper region has woken; during the ceremony the climb
      // fraction follows the ripple
      let wetK = this.awake(upper.i) ? 1 : 0;
      let gateK = wetK;
      if (this.ceremony && this.ceremony.ri === lower.i) {
        const p = this.ripplePath(H, lower.i);
        const climbSeg = p.segs[2].d + p.segs[3].d; // along + up
        const before = p.segs[0].d + p.segs[1].d + p.segs[2].d;
        const k = this.travelK(this.ceremony.t) * p.len;
        wetK = clamp((k - before) / p.segs[3].d, 0, 1);
        gateK = wetK;
      }
      // full-height retaining wall: the terrace's whole face is warm stone,
      // never a bare cliff of grass-on-grass
      const wallG = ctx.createLinearGradient(0, upper.gy, 0, H);
      wallG.addColorStop(0, upper.P.stone);
      wallG.addColorStop(0.35, upper.P.stoneShade);
      wallG.addColorStop(1, shade(upper.P.stoneShade, 0.25));
      ctx.fillStyle = wallG;
      ctx.fillRect(bx - cam - 2, upper.gy - 6, 32, H - upper.gy + 6);
      ctx.fillStyle = alpha(upper.P.stoneDark, 0.35);
      for (let i = 1; i < 7; i++) {
        ctx.fillRect(bx - cam - 2, upper.gy - 6 + (H - upper.gy + 6) * (i / 7), 32, 1.2);
      }
      // the steps, climbing right-to-left toward the upper rim
      for (let s = 0; s < steps; s++) {
        const sy = upper.gy + drop * (s / steps);
        const sx = bx - cam - 2 + 30 * (s / steps) * 0;
        ctx.fillStyle = upper.P.stone;
        ctx.fillRect(bx - cam - 6, sy, 34, 5);
        // water sheets down each wet step (bottom-up as the ripple climbs)
        const stepWet = wetK >= 1 - (s + 0.5) / steps;
        if (stepWet) {
          ctx.fillStyle = alpha(upper.P.waterHi, 0.75 + 0.2 * Math.sin(this.t * 5 + s * 2));
          ctx.fillRect(bx - cam - 4, sy + 1.4, 30, 2.6);
        }
      }
      // the gate on the upper rim
      const gx = bx - cam + 40, gy = upper.gy - 2;
      const openK = ease(gateK);
      const lift = 24;
      ctx.fillStyle = upper.P.stoneShade;
      ctx.fillRect(gx - 14, gy - lift, 5, lift + 4);
      ctx.fillRect(gx + 9, gy - lift, 5, lift + 4);
      ctx.strokeStyle = upper.P.stoneDark; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(gx, gy - lift + 2, 12, Math.PI, 0); ctx.stroke();
      ctx.strokeStyle = upper.P.gold; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(gx, gy - lift + 2, 12, Math.PI, 0); ctx.stroke();
      const dw = lerp(8.5, 1.6, openK);
      const wood = ctx.createLinearGradient(0, gy - lift, 0, gy + 2);
      wood.addColorStop(0, upper.P.trunk);
      wood.addColorStop(1, upper.P.trunkDark);
      ctx.fillStyle = wood;
      ctx.fillRect(gx - 9, gy - lift + 2, dw, lift - 2);
      ctx.fillRect(gx + 9 - dw, gy - lift + 2, dw, lift - 2);
      if (openK < 0.5) {
        ctx.fillStyle = alpha(upper.P.gold, 0.9);
        ctx.beginPath(); ctx.arc(gx - 2.2, gy - lift * 0.5, 1.6, 0, TAU); ctx.fill();
      }
    },

    drawHeart(ctx, W, H, reg) {
      const cam = this.cam;
      const hx = reg.hx - cam, hy = reg.hy;
      if (hx < -120 || hx > W + 120) return;
      const P = reg.P;
      const done = this.progress[reg.i] === reg.count;
      const isAwake = this.awake(reg.i);
      const pulse = this.heartPulse[reg.i];
      const scale = 1 + pulse * 0.05;
      const cerHere = this.ceremony && this.ceremony.ri === reg.i;
      const R = 44;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.scale(scale, TILT * scale);
      ctx.save(); ctx.translate(2, 7);
      heartPath(ctx, reg.heart, R + 7);
      ctx.fillStyle = alpha('#3E5340', 0.12); ctx.fill();
      ctx.restore();
      heartPath(ctx, reg.heart, R + 7);
      ctx.fillStyle = isAwake ? P.stone : shade(P.stone, 0.14); ctx.fill();
      heartPath(ctx, reg.heart, R + 7);
      ctx.strokeStyle = isAwake ? P.stoneShade : alpha(P.stoneDark, 0.5);
      ctx.lineWidth = 3; ctx.stroke();
      heartPath(ctx, reg.heart, R - 2);
      if (reg.heart === 'star' && isAwake) {
        // the spring: the valley's heart is the water's own beginning
        const wg = ctx.createLinearGradient(0, -R, 0, R);
        wg.addColorStop(0, P.waterHi);
        wg.addColorStop(1, P.waterDeep);
        ctx.fillStyle = wg;
      } else if (reg.heart === 'octagon' && isAwake) {
        const sg = ctx.createLinearGradient(0, -R, 0, R);
        sg.addColorStop(0, tint(P.stone, 0.2));
        sg.addColorStop(1, P.stoneShade);
        ctx.fillStyle = sg;
      } else if (isAwake) {
        const gg = ctx.createLinearGradient(0, -R, 0, R);
        gg.addColorStop(0, done ? tint(P.grassLight, 0.18) : P.grassLight);
        gg.addColorStop(1, P.grass);
        ctx.fillStyle = gg;
      } else {
        const sg = ctx.createLinearGradient(0, -R, 0, R);
        sg.addColorStop(0, P.soil);
        sg.addColorStop(1, P.soilDark);
        ctx.fillStyle = sg;
      }
      ctx.fill();
      if (done && !cerHere) {
        heartPath(ctx, reg.heart, R + 7);
        ctx.strokeStyle = alpha(P.gold, 0.5 + 0.2 * Math.sin(this.t * 1.6 + reg.i * 3));
        ctx.lineWidth = 2.4; ctx.stroke();
      }
      if (cerHere) {
        const k = this.traceK(this.ceremony.t);
        if (k > 0) {
          heartPath(ctx, reg.heart, R + 7);
          ctx.strokeStyle = alpha('#FFE9A8', 0.25 + k * 0.6);
          ctx.lineWidth = 2 + k * 3; ctx.stroke();
        }
      }
      ctx.restore();
      // spring glints
      if (reg.heart === 'star' && isAwake) {
        for (let g = 0; g < 3; g++) {
          const a = this.t * 0.7 + g * 2.1;
          ctx.fillStyle = alpha('#FFFFFF', 0.3 + 0.2 * Math.sin(this.t * 3 + g * 2));
          ctx.beginPath();
          ctx.ellipse(hx + Math.cos(a) * 18, hy + Math.sin(a) * 18 * TILT, 3.5, 1.3, 0, 0, TAU);
          ctx.fill();
        }
      }
      // the tracing glint circles the heart in screen space
      if (cerHere) {
        const k = this.traceK(this.ceremony.t);
        if (k > 0 && k < 1) {
          const a = -Math.PI / 2 + k * TAU;
          const gx2 = hx + Math.cos(a) * (R + 9) * scale;
          const gy2 = hy + Math.sin(a) * (R + 9) * TILT * scale;
          const glow = ctx.createRadialGradient(gx2, gy2, 1, gx2, gy2, 18);
          glow.addColorStop(0, 'rgba(255,246,220,0.95)');
          glow.addColorStop(1, 'rgba(255,246,220,0)');
          ctx.fillStyle = glow;
          ctx.beginPath(); ctx.arc(gx2, gy2, 18, 0, TAU); ctx.fill();
        }
      }
      // the daytime moon over the valley's finished heart
      if (reg.moon && done) {
        const mx = hx + 46, my = hy - 92;
        ctx.save();
        if (this.moonWaxed) ctx.globalAlpha *= 0.5;
        else {
          const breathe = 0.5 + 0.5 * Math.sin(this.t * 1.6);
          ctx.fillStyle = alpha('#FFFFFF', 0.28 + breathe * 0.2);
          ctx.beginPath(); ctx.arc(mx, my, 16 + breathe * 2.5, 0, TAU); ctx.fill();
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(mx, my, 8.5, 0, TAU); ctx.fill();
        ctx.fillStyle = tint(this.skyPal(W, H).skyTop, 0.4);
        ctx.beginPath(); ctx.arc(mx + 4.2, my - 1.2, 7, 0, TAU); ctx.fill();
        ctx.restore();
      }
    },

    drawSpots(ctx, W, H, reg) {
      const cam = this.cam;
      const prog = this.progress[reg.i];
      const isAwake = this.awake(reg.i);
      const active = !this.ceremony && reg.i === this.activeRegion();
      const burst = this.ceremony && this.ceremony.ri === reg.i ? this.burstK(this.ceremony.t) : 0;
      // stepping stones stroll along the path between the worlds
      for (let j = 0; j < reg.count - 1; j++) {
        const a = reg.spots[j], b = reg.spots[j + 1];
        for (let s = 1; s <= 3; s++) {
          const k = s / 4;
          const px = a.x + (b.x - a.x) * k - cam;
          if (px < -12 || px > W + 12) continue;
          const py = a.y + (b.y - a.y) * k + 28 + Math.sin(k * Math.PI) * 3;
          ctx.fillStyle = alpha(j < prog - (isAwake ? 0 : 1) && isAwake ? '#F5EDD4' : '#B7BFBE', j < prog && isAwake ? 0.7 : 0.25);
          ctx.beginPath(); ctx.ellipse(px, py, 6.4, 3.6, 0, 0, TAU); ctx.fill();
        }
      }
      for (let j = 0; j < reg.count; j++) {
        const s = reg.spots[j];
        const sx = s.x - cam;
        if (sx < -30 || sx > W + 30) continue;
        const sp = this.spotPulse && this.spotPulse.ri === reg.i && this.spotPulse.j === j
          ? this.spotPulse.t : 0;
        if (j < prog) {
          drawBloom(ctx, sx, s.y, 10, this.t + reg.i * 7 + j, reg.bloom,
            sp + (burst > 0 ? Math.sin(burst * Math.PI) * 0.8 : 0));
        } else if (active && j === prog) {
          const b = 0.72 + 0.28 * Math.sin(this.t * 2.4);
          GOL.star8Path(ctx, sx, s.y, 9 + b * 1.5 + sp * 2, Math.PI / 8);
          ctx.fillStyle = alpha('#F0C878', 0.35 + b * 0.3); ctx.fill();
          ctx.strokeStyle = alpha('#B98A3E', 0.9); ctx.lineWidth = 1.8; ctx.stroke();
        } else if (isAwake) {
          drawBud(ctx, sx, s.y, 0.8);
        } else {
          ctx.fillStyle = alpha(reg.P.soilDark, 0.5);
          ctx.beginPath(); ctx.ellipse(sx, s.y, 4.5, 2.6, 0, 0, TAU); ctx.fill();
        }
      }
    },

    draw(ctx, W, H) {
      const { regs } = layout(H);
      if (this.cam == null) this.cam = 0;
      const P = this.skyPal(W, H);
      GOL.drawSky(ctx, W, H, P, this.t, this.cam);
      if (!this.bd) {
        this.bd = {
          far: GOL.buildHillStrip(1400, 260, { seed: 19, base: 150, amp: 42, color: P.hillFar, mist: P.mist, trees: 12, treeColor: shade(P.hillFar, 0.22) }),
          mid: GOL.buildHillStrip(1200, 230, { seed: 20, base: 120, amp: 52, color: P.hillMid, mist: P.mist, trees: 9, treeColor: shade(P.hillMid, 0.22) })
        };
      }
      const hillY = H * 0.56;
      GOL.drawStrip(ctx, this.bd.far, this.cam, 0.08, hillY - 250, W);
      GOL.drawRays(ctx, W, H, P, this.t);
      GOL.drawStrip(ctx, this.bd.mid, this.cam, 0.18, hillY - 186, W);

      // terraces from the heights down, so lower ground overlaps higher
      for (let i = regs.length - 1; i >= 0; i--) {
        this.drawTerrace(ctx, W, H, regs[i]);
      }
      for (let i = 0; i < regs.length - 1; i++) {
        this.drawChadar(ctx, W, H, regs[i], regs[i + 1]);
      }
      for (const reg of regs) {
        this.drawLandmarks(ctx, W, H, reg);
        this.drawStream(ctx, W, H, reg);
        this.drawHeart(ctx, W, H, reg);
        this.drawSpots(ctx, W, H, reg);
      }

      // the ceremony's ripple, riding its whole road
      if (this.ceremony) {
        const k = this.travelK(this.ceremony.t);
        if (k > 0 && k < 1) {
          const rp = this.ripplePos(H, this.ceremony.ri, k);
          if (rp) {
            const gx = rp.x - this.cam, gy = rp.y;
            const glow = ctx.createRadialGradient(gx, gy, 1, gx, gy, 26);
            glow.addColorStop(0, 'rgba(255,246,220,0.9)');
            glow.addColorStop(1, 'rgba(255,246,220,0)');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(gx, gy, 26, 0, TAU); ctx.fill();
          }
        }
      }

      // Noor rests beside the next thing to do
      const a = this.ceremony ? null : this.activeRegion();
      if (a != null) {
        const s = layout(H).regs[a].spots[this.progress[a]];
        GOL.drawFirefly(ctx,
          s.x - this.cam + 30 + Math.cos(this.t * 0.9) * 8,
          s.y - 22 + Math.sin(this.t * 1.7) * 8,
          this.t, 1.1);
      }

      this.fx.draw(ctx);
      const q = (GOL.SAFE || { l: 0, t: 0 });
      GOL.drawButton(ctx, q.l + 40, q.t * 0.5 + 34, 22, 'back', { alpha: 0.76 });
      GOL.drawVignette(ctx, W, H, 0.12);
    }
  };

  GOL.PROTOTYPES[18] = {
    key: 'terraced-valley',
    name: 'the terraced valley',
    scene: 'valleyLab'
  };
  GOL.registerScene('valleyLab', valleyLab);
})();
