// Journey lab · P15 — Living Constellations
//
// Twenty simulated surah worlds at two spatial scales: a four-constellation
// atlas and one familiar five-world journey at a time. This scene is a pure
// presentation lab: it never reads or writes progression and never launches a
// real world.
(function () {
  const GOL = window.GOL;
  const TAU = Math.PI * 2;
  const GRAND = {
    base: '#F0C878', light: '#FFE9A8', lighter: '#FFF6DC',
    dark: '#D9A44A', darker: '#B98A3E', glow: '#FFE9A8'
  };

  const GROUPS = [
    {
      state: 'complete', progress: 5, seed: 3,
      shape: [[-42, 12], [-24, -25], [4, -7], [27, -31], [43, 16]]
    },
    {
      state: 'active', progress: 3, seed: 7,
      shape: [[-43, -14], [-17, -30], [2, 5], [28, -18], [43, 22]]
    },
    {
      state: 'sleeping', progress: 0, seed: 11,
      shape: [[-38, 20], [-27, -20], [0, -5], [20, -32], [42, 12]]
    },
    {
      state: 'sleeping', progress: 0, seed: 15,
      shape: [[-42, 2], [-20, -27], [4, -17], [18, 18], [43, -7]]
    }
  ];

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function ease(v) { return v * v * (3 - 2 * v); }

  function safeRect(W, H) {
    const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
    return {
      l: sa.l + 32, r: W - sa.r - 32,
      t: sa.t * 0.5 + 22, b: H - sa.b * 0.5 - 22,
      sa
    };
  }

  function groupCenters(W, H) {
    const q = safeRect(W, H);
    const left = q.l + 70;
    const right = q.r - 58;
    const span = Math.max(1, right - left);
    return GROUPS.map((g, i) => ({
      x: left + span * (i / 3),
      y: H * 0.54 + (i % 2 ? -22 : 19)
    }));
  }

  function nearNodes(W, H) {
    const q = safeRect(W, H);
    const left = q.l + 67;
    const right = q.r - 51;
    const ys = [0.60, 0.48, 0.62, 0.49, 0.59];
    return ys.map((yf, i) => ({
      x: left + (right - left) * (i / 4),
      y: H * yf,
      r: 34
    }));
  }

  function drawNight(ctx, W, H, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#172944');
    sky.addColorStop(0.62, '#30455A');
    sky.addColorStop(1, '#556356');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Stable pinpricks: no randomness in draw, so the sky remains restful.
    ctx.save();
    for (let i = 0; i < 54; i++) {
      const x = (i * 137.23 + 41) % W;
      const y = 14 + ((i * 71.71 + 23) % (H * 0.68));
      const a = 0.16 + 0.22 * (0.5 + 0.5 * Math.sin(t * 0.7 + i * 1.9));
      ctx.fillStyle = 'rgba(255,246,220,' + a + ')';
      ctx.beginPath(); ctx.arc(x, y, i % 9 === 0 ? 1.4 : 0.8, 0, TAU); ctx.fill();
    }
    ctx.restore();

    // A low meadow keeps the atlas tied to the game's garden, not a menu.
    const gy = H * 0.82;
    const meadow = ctx.createLinearGradient(0, gy - 20, 0, H);
    meadow.addColorStop(0, 'rgba(73,102,78,0.74)');
    meadow.addColorStop(1, 'rgba(36,64,52,0.96)');
    ctx.fillStyle = meadow;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    for (let x = 0; x <= W + 24; x += 24) {
      ctx.lineTo(x, gy + Math.sin(x * 0.015 + t * 0.08) * 5);
    }
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  }

  function drawBridge(ctx, a, b, lit, t) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const count = Math.max(3, Math.round(Math.abs(dx) / 23));
    for (let i = 1; i < count; i++) {
      const k = i / count;
      const x = a.x + dx * k;
      const y = a.y + dy * k + Math.sin(k * Math.PI) * -12;
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.7 + i);
      ctx.fillStyle = lit
        ? 'rgba(255,233,168,' + (0.38 + pulse * 0.28) + ')'
        : 'rgba(185,201,214,0.11)';
      ctx.beginPath(); ctx.ellipse(x, y, 3.2, 2.1, -0.2, 0, TAU); ctx.fill();
    }
  }

  function drawMemoryHaze(ctx, x, y, t) {
    const breathe = 0.5 + 0.5 * Math.sin(t * 1.35);
    const haze = ctx.createRadialGradient(x, y, 8, x, y, 73 + breathe * 8);
    haze.addColorStop(0, 'rgba(207,224,255,' + (0.15 + breathe * 0.05) + ')');
    haze.addColorStop(0.58, 'rgba(154,188,235,0.09)');
    haze.addColorStop(1, 'rgba(154,188,235,0)');
    ctx.fillStyle = haze;
    ctx.beginPath(); ctx.arc(x, y, 84, 0, TAU); ctx.fill();
  }

  function drawFigure(ctx, group, c, t, drift) {
    const sleeping = group.state === 'sleeping';
    const wobble = drift > 0 ? Math.sin((1 - drift) * Math.PI * 3) * 5 * drift : 0;
    const pts = group.shape.map((p) => ({ x: c.x + p[0] + wobble, y: c.y + p[1] }));

    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < pts.length - 1; i++) {
      const lit = i < group.progress - 1;
      ctx.strokeStyle = lit ? 'rgba(255,226,143,0.8)' : 'rgba(173,193,211,0.18)';
      ctx.lineWidth = lit ? 2.4 : 1.4;
      ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[i + 1].x, pts[i + 1].y); ctx.stroke();
    }

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const done = i < group.progress;
      const current = group.state === 'active' && i === group.progress;
      if (done) {
        GOL.drawGem(ctx, p.x, p.y, 7.2, GRAND, t, { phase: group.seed + i, glow: 0.8 });
      } else if (current) {
        const pulse = 0.75 + 0.25 * Math.sin(t * 2.2);
        GOL.star8Path(ctx, p.x, p.y, 7.5 + pulse * 1.8, Math.PI / 8);
        ctx.fillStyle = 'rgba(240,200,120,' + (0.26 + pulse * 0.24) + ')'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,233,168,0.82)'; ctx.lineWidth = 1.5; ctx.stroke();
      } else {
        GOL.star8Path(ctx, p.x, p.y, sleeping ? 5.2 : 6.1, Math.PI / 8);
        ctx.fillStyle = sleeping ? 'rgba(163,177,184,0.14)' : 'rgba(207,216,215,0.18)'; ctx.fill();
        ctx.strokeStyle = sleeping ? 'rgba(173,193,211,0.20)' : 'rgba(200,214,220,0.28)';
        ctx.lineWidth = 1; ctx.stroke();
      }
    }

    // A broad tap invitation without words: reachable figures breathe as one.
    if (!sleeping) {
      const r = 54 + Math.sin(t * 1.5 + group.seed) * 3;
      ctx.strokeStyle = group.state === 'active'
        ? 'rgba(255,233,168,0.19)'
        : 'rgba(207,224,255,0.14)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(c.x + wobble, c.y, r, 43, 0, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }

  function drawSteppingStones(ctx, a, b, lit) {
    for (let s = 1; s <= 4; s++) {
      const k = s / 5;
      const x = a.x + (b.x - a.x) * k;
      const y = a.y + (b.y - a.y) * k + Math.sin(k * Math.PI) * 12;
      ctx.fillStyle = lit ? 'rgba(245,237,212,0.68)' : 'rgba(183,191,190,0.18)';
      ctx.beginPath(); ctx.ellipse(x, y, 7.2, 4.1, (s - 2) * 0.1, 0, TAU); ctx.fill();
      if (lit) {
        ctx.fillStyle = 'rgba(255,251,234,0.34)';
        ctx.beginPath(); ctx.ellipse(x - 1.5, y - 1.1, 2.8, 1.2, 0, 0, TAU); ctx.fill();
      }
    }
  }

  function drawBud(ctx, x, y, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = '#859A8A';
    ctx.beginPath(); ctx.ellipse(x, y + 2, 8, 12, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#687E71';
    ctx.beginPath(); ctx.ellipse(x - 4.5, y + 3, 4.5, 10, 0.5, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 4.5, y + 3, 4.5, 10, -0.5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  const constellationLab = {
    t: 0,
    zoom: 0,
    zoomDir: 0,
    groupI: null,
    drift: [0, 0, 0, 0],
    pulseI: -1,
    pulseT: 0,
    moonPulse: 0,

    enter() {
      this.t = 0;
      this.zoom = 0;
      this.zoomDir = 0;
      this.groupI = null;
      this.drift = [0, 0, 0, 0];
      this.pulseI = -1;
      this.pulseT = 0;
      this.moonPulse = 0;
    },

    beginClose(i) {
      this.groupI = i;
      this.zoomDir = 1;
      if (GOL.audio) GOL.audio.sfx('unlockLevel');
    },

    beginFar() {
      this.zoomDir = -1;
      if (GOL.audio) GOL.audio.sfx('drift');
    },

    update(dt, W, H) {
      this.t += dt;
      this.pulseT = Math.max(0, this.pulseT - dt * 1.7);
      this.moonPulse = Math.max(0, this.moonPulse - dt * 1.5);
      for (let i = 0; i < this.drift.length; i++) this.drift[i] = Math.max(0, this.drift[i] - dt * 1.65);

      if (this.zoomDir) {
        this.zoom = clamp(this.zoom + this.zoomDir * dt / 0.72, 0, 1);
        if (this.zoom === 1) this.zoomDir = 0;
        if (this.zoom === 0) {
          this.zoomDir = 0;
          this.groupI = null;
        }
        // The flight owns input; taps during it cannot accidentally select.
        for (const tap of GOL.Input.taps) tap.ui = true;
        return;
      }

      const q = safeRect(W, H);
      const back = { x: q.l + 8, y: q.t + 12, r: 31 };
      for (const tap of GOL.Input.taps) {
        if (tap.ui) continue;
        if (GOL.dist(tap.x, tap.y, back.x, back.y) < back.r) {
          tap.ui = true;
          if (this.zoom >= 1 && this.groupI != null) this.beginFar();
          else GOL.go('title');
          return;
        }

        if (this.groupI == null) {
          const centers = groupCenters(W, H);
          const hit = centers.findIndex((c) => GOL.dist(tap.x, tap.y, c.x, c.y) < 62);
          if (hit >= 0) {
            tap.ui = true;
            if (GROUPS[hit].state === 'sleeping') {
              this.drift[hit] = 1;
              if (GOL.audio) GOL.audio.sfx('drift');
            } else {
              this.beginClose(hit);
            }
            return;
          }
        } else {
          const nodes = nearNodes(W, H);
          // The close-view moon is its own invitation, but remains a safe lab pulse.
          if (this.groupI === 0) {
            const moon = { x: nodes[1].x - 27, y: nodes[1].y - 27 };
            if (GOL.dist(tap.x, tap.y, moon.x, moon.y) < 19) {
              tap.ui = true;
              this.moonPulse = 1;
              if (GOL.audio) GOL.audio.sfx('yourTurn');
              return;
            }
          }
          const hit = nodes.findIndex((n) => GOL.dist(tap.x, tap.y, n.x, n.y) < 40);
          if (hit >= 0) {
            tap.ui = true;
            this.pulseI = hit;
            this.pulseT = 1;
            if (GOL.audio) GOL.audio.sfx(hit < GROUPS[this.groupI].progress ? 'tap' : 'drift');
            return;
          }
        }
      }
    },

    drawFar(ctx, W, H, alpha) {
      const centers = groupCenters(W, H);
      ctx.save(); ctx.globalAlpha *= alpha;

      // The inter-constellation journey. Only the bridge grown from the fully
      // completed first figure is awake; later crossings still sleep.
      for (let i = 0; i < centers.length - 1; i++) {
        drawBridge(ctx, centers[i], centers[i + 1], i === 0, this.t);
      }
      drawMemoryHaze(ctx, centers[0].x, centers[0].y, this.t);

      for (let i = 0; i < GROUPS.length; i++) {
        drawFigure(ctx, GROUPS[i], centers[i], this.t, this.drift[i]);
      }

      // Noor waits beside the open constellation and makes the next scale
      // change discoverable without a label.
      const active = centers[1];
      GOL.drawFirefly(ctx,
        active.x + 58 + Math.cos(this.t * 0.9) * 9,
        active.y - 12 + Math.sin(this.t * 1.5) * 11,
        this.t, 1.25);
      ctx.restore();
    },

    drawNear(ctx, W, H, alpha, scale) {
      if (this.groupI == null) return;
      const group = GROUPS[this.groupI];
      const nodes = nearNodes(W, H);
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.translate(W / 2, H / 2);
      ctx.scale(scale, scale);
      ctx.translate(-W / 2, -H / 2);

      for (let i = 0; i < nodes.length - 1; i++) {
        const lit = i < group.progress;
        drawSteppingStones(ctx, nodes[i], nodes[i + 1], lit);
      }

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const done = i < group.progress;
        const current = group.state === 'active' && i === group.progress;
        const pulse = this.pulseI === i ? this.pulseT : 0;

        ctx.fillStyle = 'rgba(26,39,54,0.24)';
        ctx.beginPath(); ctx.ellipse(n.x + 2, n.y + 30, 34, 10, 0, 0, TAU); ctx.fill();
        const disc = ctx.createLinearGradient(n.x, n.y - 34, n.x, n.y + 34);
        disc.addColorStop(0, current || done ? '#EDE5D1' : '#A6AFAD');
        disc.addColorStop(1, current || done ? '#CFC29F' : '#7D8A89');
        ctx.fillStyle = disc;
        ctx.beginPath(); ctx.arc(n.x, n.y, 34 + pulse * 3, 0, TAU); ctx.fill();
        ctx.strokeStyle = done || current ? 'rgba(240,200,120,0.82)' : 'rgba(166,183,189,0.42)';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(n.x, n.y, 30 + pulse * 3, 0, TAU); ctx.stroke();

        if (done) {
          GOL.drawGem(ctx, n.x, n.y, 16 + pulse * 3, GRAND, this.t, { phase: i + this.groupI * 5, glow: 0.85 });
        } else if (current) {
          const p = 0.72 + 0.28 * Math.sin(this.t * 2.4);
          GOL.star8Path(ctx, n.x, n.y, 14 + p * 1.5, Math.PI / 8);
          ctx.fillStyle = 'rgba(240,200,120,' + (0.32 + p * 0.30) + ')'; ctx.fill();
          ctx.strokeStyle = 'rgba(185,138,62,0.92)'; ctx.lineWidth = 2; ctx.stroke();
        } else {
          drawBud(ctx, n.x, n.y, group.state === 'sleeping' ? 0.55 : 0.72);
        }
      }

      // The overview only carried a moonlit haze. Here the invitation resolves
      // to one particular old world, preserving the Remembering's identity.
      if (this.groupI === 0) {
        const n = nodes[1];
        const breathe = 0.5 + 0.5 * Math.sin(this.t * 1.8);
        ctx.fillStyle = 'rgba(207,224,255,' + (0.15 + breathe * 0.12 + this.moonPulse * 0.25) + ')';
        ctx.beginPath(); ctx.arc(n.x - 27, n.y - 27, 17 + breathe * 2 + this.moonPulse * 4, 0, TAU); ctx.fill();
        GOL.drawMoon(ctx, n.x - 27, n.y - 27, 9 + this.moonPulse * 2, 0.62, this.t, { glow: false });
      }

      const guideI = group.state === 'active' ? group.progress : 0;
      const guide = nodes[guideI];
      GOL.drawFirefly(ctx,
        guide.x + 42 + Math.cos(this.t * 0.9) * 9,
        guide.y - 24 + Math.sin(this.t * 1.7) * 9,
        this.t, 1.1);
      ctx.restore();
    },

    draw(ctx, W, H) {
      drawNight(ctx, W, H, this.t);
      const k = ease(this.zoom);

      if (this.groupI != null && k > 0) {
        const centers = groupCenters(W, H);
        const c = centers[this.groupI];
        ctx.save();
        ctx.globalAlpha = 1 - k;
        const farScale = 1 + k * 0.8;
        ctx.translate(W / 2, H / 2);
        ctx.scale(farScale, farScale);
        ctx.translate(-c.x, -c.y);
        this.drawFar(ctx, W, H, 1);
        ctx.restore();
        this.drawNear(ctx, W, H, k, 0.82 + k * 0.18);
      } else {
        this.drawFar(ctx, W, H, 1);
      }

      const q = safeRect(W, H);
      GOL.drawButton(ctx, q.l + 8, q.t + 12, 22, 'back', { alpha: 0.76 });
      GOL.drawVignette(ctx, W, H, 0.18);
    }
  };

  GOL.PROTOTYPES[15] = {
    key: 'constellation-atlas',
    name: 'living constellations',
    scene: 'constellationLab'
  };
  GOL.registerScene('constellationLab', constellationLab);
})();
