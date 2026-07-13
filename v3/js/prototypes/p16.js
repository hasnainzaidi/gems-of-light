// Journey lab · P16 — The Sky Above the Path
//
// One screen, two altitudes, no zoom. The path below carries only the
// chapter being learned — five discs in the journey's existing language
// (Grand Gems, breathing next-star, buds, stepping stones, Noor, moon).
// Finished chapters live overhead as constellation figures of Grand-Gem
// stars. Completing a chapter's last world sends its five gems up to JOIN
// the sky (the stanza-crest compression story, one scale larger); tapping
// a sky figure brings those worlds gently back down for a visit.
//
// Pure presentation lab: it never reads or writes progression and never
// launches a real world. Direct: ?lab=16
(function () {
  const GOL = window.GOL;
  const TAU = Math.PI * 2;
  const GRAND = {
    base: '#F0C878', light: '#FFE9A8', lighter: '#FFF6DC',
    dark: '#D9A44A', darker: '#B98A3E', glow: '#FFE9A8'
  };

  // Four simulated five-world chapters. `shape` is each star's offset from
  // the chapter's sky slot — every figure is deliberately its own small
  // drawing, so a returning child can recognize "the one we finished first".
  const CHAPTERS = [
    { seed: 3, shape: [[-40, 10], [-20, -22], [2, -6], [24, -28], [40, 12]] },
    { seed: 7, shape: [[-40, -8], [-22, 14], [0, 18], [22, 12], [38, -14]], moonWorld: 2 },
    { seed: 11, shape: [[-38, 14], [-19, -18], [0, 6], [19, -24], [38, 10]] },
    { seed: 15, shape: [[-38, 0], [-19, -16], [0, 2], [19, -18], [38, -2]] }
  ];

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function ease(v) { return v * v * (3 - 2 * v); }
  function lerp(a, b, k) { return a + (b - a) * k; }

  function safeRect(W, H) {
    const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
    return { l: sa.l + 32, r: W - sa.r - 32, t: sa.t * 0.5 + 22, b: H - sa.b * 0.5 - 22 };
  }

  // The four sky slots, spread across the upper third.
  function skySlot(W, H, i) {
    const q = safeRect(W, H);
    const left = q.l + 84;
    const right = q.r - 76;
    return { x: left + (right - left) * (i / 3), y: H * 0.22 + (i % 2 ? 15 : -7) };
  }

  function skyStar(W, H, ci, i) {
    const c = skySlot(W, H, ci);
    const p = CHAPTERS[ci].shape[i];
    return { x: c.x + p[0], y: c.y + p[1] };
  }

  // The path: the same five-disc rhythm as the near journey, low on the
  // meadow so the sky above it stays open.
  function pathNodes(W, H) {
    const q = safeRect(W, H);
    const left = q.l + 67;
    const right = q.r - 51;
    const ys = [0.66, 0.57, 0.68, 0.58, 0.65];
    return ys.map((yf, i) => ({ x: left + (right - left) * (i / 4), y: H * yf }));
  }

  function drawNight(ctx, W, H, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#172944');
    sky.addColorStop(0.62, '#30455A');
    sky.addColorStop(1, '#556356');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    // Stable pinpricks: no randomness in draw, so the sky remains restful.
    for (let i = 0; i < 54; i++) {
      const x = (i * 137.23 + 41) % W;
      const y = 14 + ((i * 71.71 + 23) % (H * 0.6));
      const a = 0.14 + 0.2 * (0.5 + 0.5 * Math.sin(t * 0.7 + i * 1.9));
      ctx.fillStyle = 'rgba(255,246,220,' + a + ')';
      ctx.beginPath(); ctx.arc(x, y, i % 9 === 0 ? 1.4 : 0.8, 0, TAU); ctx.fill();
    }
    // The low meadow keeps the path a garden path, not a menu bar.
    const gy = H * 0.8;
    const meadow = ctx.createLinearGradient(0, gy - 20, 0, H);
    meadow.addColorStop(0, 'rgba(73,102,78,0.74)');
    meadow.addColorStop(1, 'rgba(36,64,52,0.96)');
    ctx.fillStyle = meadow;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    for (let x = 0; x <= W + 24; x += 24) ctx.lineTo(x, gy + Math.sin(x * 0.015 + t * 0.08) * 5);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  }

  function drawMemoryHaze(ctx, x, y, t) {
    const breathe = 0.5 + 0.5 * Math.sin(t * 1.35);
    const haze = ctx.createRadialGradient(x, y, 8, x, y, 70 + breathe * 8);
    haze.addColorStop(0, 'rgba(207,224,255,' + (0.15 + breathe * 0.05) + ')');
    haze.addColorStop(0.58, 'rgba(154,188,235,0.09)');
    haze.addColorStop(1, 'rgba(154,188,235,0)');
    ctx.fillStyle = haze;
    ctx.beginPath(); ctx.arc(x, y, 82, 0, TAU); ctx.fill();
  }

  function drawStarDust(ctx, a, b, lit, t) {
    const count = Math.max(3, Math.round(Math.abs(b.x - a.x) / 26));
    for (let i = 1; i < count; i++) {
      const k = i / count;
      const x = a.x + (b.x - a.x) * k;
      const y = a.y + (b.y - a.y) * k + Math.sin(k * Math.PI) * -9;
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.7 + i);
      ctx.fillStyle = lit
        ? 'rgba(255,233,168,' + (0.22 + pulse * 0.18) + ')'
        : 'rgba(185,201,214,0.08)';
      ctx.beginPath(); ctx.ellipse(x, y, 2.6, 1.8, -0.2, 0, TAU); ctx.fill();
    }
  }

  function drawSteppingStones(ctx, a, b, lit, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha;
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
    ctx.restore();
  }

  function drawBud(ctx, x, y, alpha, sway) {
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.translate(x, y); ctx.rotate((sway || 0) * 0.2); ctx.translate(-x, -y);
    ctx.fillStyle = '#859A8A';
    ctx.beginPath(); ctx.ellipse(x, y + 2, 8, 12, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#687E71';
    ctx.beginPath(); ctx.ellipse(x - 4.5, y + 3, 4.5, 10, 0.5, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 4.5, y + 3, 4.5, 10, -0.5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  const skyPathLab = {
    t: 0,
    progress: null,     // per-chapter completed worlds (simulated, never saved)
    pathCh: 2,          // chapter whose worlds are down on the path (null = none)
    moonWaxed: false,   // lab-local stand-in for "remembered today"
    swap: null,         // { t, dur, up, down } — chapters exchanging altitude
    ceremony: null,     // { t, seg } — the ascension timeline
    pulseI: -1, pulseT: 0, moonPulse: 0,

    enter() {
      this.t = 0;
      this.progress = [5, 5, 3, 0];
      this.pathCh = 2;
      this.moonWaxed = false;
      this.swap = null;
      this.ceremony = null;
      this.pulseI = -1; this.pulseT = 0; this.moonPulse = 0;
    },

    // The chapter still being learned — where "home" is.
    homeCh() {
      const i = this.progress.findIndex((p) => p < 5);
      return i === -1 ? null : i;
    },

    figureFormed(ci) {
      // A figure exists in the sky only once its ceremony has run.
      return this.progress[ci] === 5 && !(this.ceremony && this.ceremony.ch === ci);
    },

    beginSwap(down) {
      this.swap = { t: 0, dur: 1.35, up: this.pathCh, down };
      if (GOL.audio) GOL.audio.sfx(down === this.homeCh() ? 'drift' : 'door');
    },

    beginCeremony() {
      this.ceremony = { t: 0, ch: this.pathCh, seg: 0 };
      if (GOL.audio) GOL.audio.sfx('door');
    },

    // --- the ascension timeline (seconds from ceremony start) ---
    // settle 0–0.9 · rise 0.9–3.3 · join 3.3–4.9 · path breathes 4.9–6.7
    riseK(i, t) { return ease(clamp((t - (0.9 + i * 0.22)) / 1.15, 0, 1)); },
    joinK(t) { return clamp((t - 3.3) / 1.6, 0, 1); },
    shiftK(t) { return ease(clamp((t - 4.9) / 1.8, 0, 1)); },

    update(dt, W, H) {
      this.t += dt;
      this.pulseT = Math.max(0, this.pulseT - dt * 1.7);
      this.moonPulse = Math.max(0, this.moonPulse - dt * 1.5);

      if (this.ceremony) {
        this.ceremony.t += dt;
        // A soft tick as each figure line joins star to star.
        const seg = Math.floor(this.joinK(this.ceremony.t) * 4);
        if (seg > this.ceremony.seg) {
          this.ceremony.seg = seg;
          if (GOL.audio) GOL.audio.sfx(seg >= 4 ? 'praise' : 'tap');
        }
        if (this.ceremony.t >= 6.7) {
          const next = this.ceremony.ch + 1;
          this.pathCh = next < CHAPTERS.length ? next : null;
          this.ceremony = null;
          if (this.pathCh != null && GOL.audio) GOL.audio.sfx('unlockLevel');
        }
        // The ceremony owns input; taps during it cannot accidentally select.
        for (const tap of GOL.Input.taps) tap.ui = true;
        return;
      }

      if (this.swap) {
        this.swap.t += dt;
        if (this.swap.t >= this.swap.dur) {
          this.pathCh = this.swap.down;
          this.swap = null;
        }
        for (const tap of GOL.Input.taps) tap.ui = true;
        return;
      }

      const q = safeRect(W, H);
      const back = { x: q.l + 8, y: q.t + 12, r: 31 };
      const home = this.homeCh();
      const nodes = pathNodes(W, H);

      for (const tap of GOL.Input.taps) {
        if (tap.ui) continue;

        // Back: a visit returns home first; home leaves the lab.
        if (GOL.dist(tap.x, tap.y, back.x, back.y) < back.r) {
          tap.ui = true;
          if (this.pathCh !== home && home != null) this.beginSwap(home);
          else GOL.go('title');
          return;
        }

        // Sky: tapping any figure (or the waiting home group) brings it down.
        for (let ci = 0; ci < CHAPTERS.length; ci++) {
          if (ci === this.pathCh) continue;
          const reachable = this.figureFormed(ci) || ci === home;
          if (!reachable) continue;
          const c = skySlot(W, H, ci);
          if (GOL.dist(tap.x, tap.y, c.x, c.y) < 58) {
            tap.ui = true;
            this.beginSwap(ci);
            return;
          }
        }

        if (this.pathCh == null) continue;
        const ch = CHAPTERS[this.pathCh];
        const prog = this.progress[this.pathCh];

        // The Remembering Moon beside its own disc — the haze overhead
        // resolves HERE, to one exact moon, never to an aggregate door.
        if (ch.moonWorld != null && !this.moonWaxed && prog === 5) {
          const n = nodes[ch.moonWorld];
          if (GOL.dist(tap.x, tap.y, n.x - 28, n.y - 28) < 19) {
            tap.ui = true;
            this.moonPulse = 1;
            this.moonWaxed = true; // session-local: the moon rests, the haze fades
            if (GOL.audio) GOL.audio.sfx('yourTurn');
            return;
          }
        }

        const hit = nodes.findIndex((n) => GOL.dist(tap.x, tap.y, n.x, n.y) < 40);
        if (hit >= 0) {
          tap.ui = true;
          if (hit === prog && this.pathCh === home) {
            // The lab's stand-in for finishing a world: the star becomes a
            // Grand Gem; the fifth one starts the ascension.
            this.progress[this.pathCh]++;
            this.pulseI = hit; this.pulseT = 1;
            if (GOL.audio) GOL.audio.sfx('blossom');
            if (this.progress[this.pathCh] === 5) this.beginCeremony();
          } else {
            this.pulseI = hit; this.pulseT = 1;
            if (GOL.audio) GOL.audio.sfx(hit < prog ? 'tap' : 'drift');
          }
          return;
        }
      }
    },

    // A formed constellation figure at its sky slot.
    drawFigure(ctx, W, H, ci, alpha) {
      const ch = CHAPTERS[ci];
      const pts = ch.shape.map((p, i) => skyStar(W, H, ci, i));
      ctx.save(); ctx.globalAlpha *= alpha;
      if (ch.moonWorld != null && !this.moonWaxed) {
        const c = skySlot(W, H, ci);
        drawMemoryHaze(ctx, c.x, c.y, this.t);
      }
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,226,143,0.7)';
      ctx.lineWidth = 2;
      for (let i = 0; i < pts.length - 1; i++) {
        ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[i + 1].x, pts[i + 1].y); ctx.stroke();
      }
      for (let i = 0; i < pts.length; i++) {
        GOL.drawGem(ctx, pts[i].x, pts[i].y, 6.8, GRAND, this.t, { phase: ch.seed + i, glow: 0.8 });
      }
      // A broad, wordless tap invitation: the whole figure breathes as one.
      const c = skySlot(W, H, ci);
      const r = 52 + Math.sin(this.t * 1.5 + ch.seed) * 3;
      ctx.strokeStyle = 'rgba(207,224,255,0.14)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(c.x, c.y, r, 40, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    },

    // The home chapter waiting overhead during a visit: a dim promise of the
    // figure to come, with Noor resting beside it to lead the way back.
    drawWaitingHome(ctx, W, H, ci) {
      const ch = CHAPTERS[ci];
      const prog = this.progress[ci];
      const pts = ch.shape.map((p, i) => skyStar(W, H, ci, i));
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 0; i < pts.length - 1; i++) {
        ctx.strokeStyle = i < prog - 1 ? 'rgba(255,226,143,0.4)' : 'rgba(173,193,211,0.14)';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[i + 1].x, pts[i + 1].y); ctx.stroke();
      }
      for (let i = 0; i < pts.length; i++) {
        if (i < prog) {
          GOL.drawGem(ctx, pts[i].x, pts[i].y, 5.4, GRAND, this.t, { phase: ch.seed + i, glow: 0.5 });
        } else {
          GOL.star8Path(ctx, pts[i].x, pts[i].y, 5, Math.PI / 8);
          ctx.fillStyle = 'rgba(207,216,215,0.16)'; ctx.fill();
          ctx.strokeStyle = 'rgba(200,214,220,0.26)'; ctx.lineWidth = 1; ctx.stroke();
        }
      }
      const c = skySlot(W, H, ci);
      const r = 52 + Math.sin(this.t * 1.5 + ch.seed) * 3;
      ctx.strokeStyle = 'rgba(255,233,168,0.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(c.x, c.y, r, 40, 0, 0, TAU); ctx.stroke();
      ctx.restore();
      GOL.drawFirefly(ctx,
        c.x + 56 + Math.cos(this.t * 0.9) * 8,
        c.y - 8 + Math.sin(this.t * 1.5) * 10,
        this.t, 1.15);
    },

    // Five barely-there sockets where the current chapter's figure will one
    // day join — a promise, deliberately too faint to read as a button.
    drawHintSockets(ctx, W, H, ci) {
      const ch = CHAPTERS[ci];
      for (let i = 0; i < ch.shape.length; i++) {
        const p = skyStar(W, H, ci, i);
        GOL.star8Path(ctx, p.x, p.y, 4.4, Math.PI / 8);
        ctx.fillStyle = 'rgba(173,193,211,0.09)'; ctx.fill();
      }
    },

    // One chapter's five worlds laid on the path, in the journey's language.
    drawPathChapter(ctx, W, H, ci, alpha, opts) {
      const o = opts || {};
      const ch = CHAPTERS[ci];
      const prog = this.progress[ci];
      const home = ci === this.homeCh();
      const nodes = pathNodes(W, H);
      ctx.save(); ctx.globalAlpha *= alpha;

      for (let i = 0; i < nodes.length - 1; i++) {
        drawSteppingStones(ctx, nodes[i], nodes[i + 1], i < prog, 1);
      }
      for (let i = 0; i < nodes.length; i++) {
        const n = { x: nodes[i].x, y: nodes[i].y + (o.sink || 0) };
        const done = i < prog;
        const current = home && i === prog;
        const gemGone = o.gemsGone; // during the rise, discs stay but empty
        const pulse = this.pulseI === i ? this.pulseT : 0;

        ctx.fillStyle = 'rgba(26,39,54,0.24)';
        ctx.beginPath(); ctx.ellipse(n.x + 2, n.y + 30, 34, 10, 0, 0, TAU); ctx.fill();
        const disc = ctx.createLinearGradient(n.x, n.y - 34, n.x, n.y + 34);
        disc.addColorStop(0, done || current ? '#EDE5D1' : '#A6AFAD');
        disc.addColorStop(1, done || current ? '#CFC29F' : '#7D8A89');
        ctx.fillStyle = disc;
        ctx.beginPath(); ctx.arc(n.x, n.y, 34 + pulse * 3, 0, TAU); ctx.fill();
        ctx.strokeStyle = done || current ? 'rgba(240,200,120,0.82)' : 'rgba(166,183,189,0.42)';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(n.x, n.y, 30 + pulse * 3, 0, TAU); ctx.stroke();

        if (done && !gemGone) {
          GOL.drawGem(ctx, n.x, n.y, 16 + pulse * 3, GRAND, this.t, { phase: ch.seed + i, glow: 0.85 });
        } else if (current) {
          const p = 0.72 + 0.28 * Math.sin(this.t * 2.4);
          GOL.star8Path(ctx, n.x, n.y, 14 + p * 1.5, Math.PI / 8);
          ctx.fillStyle = 'rgba(240,200,120,' + (0.32 + p * 0.30) + ')'; ctx.fill();
          ctx.strokeStyle = 'rgba(185,138,62,0.92)'; ctx.lineWidth = 2; ctx.stroke();
        } else if (!done) {
          drawBud(ctx, n.x, n.y, 0.72, pulse * Math.sin(this.t * 9));
        }
      }

      // The moon keeps its identity: beside its own disc, never aggregated.
      if (ch.moonWorld != null && prog === 5 && !this.moonWaxed) {
        const n = nodes[ch.moonWorld];
        const breathe = 0.5 + 0.5 * Math.sin(this.t * 1.8);
        ctx.fillStyle = 'rgba(207,224,255,' + (0.15 + breathe * 0.12 + this.moonPulse * 0.25) + ')';
        ctx.beginPath(); ctx.arc(n.x - 28, n.y - 28, 17 + breathe * 2 + this.moonPulse * 4, 0, TAU); ctx.fill();
        GOL.drawMoon(ctx, n.x - 28, n.y - 28, 9 + this.moonPulse * 2, 0.62, this.t, { glow: false });
      } else if (ch.moonWorld != null && prog === 5 && this.moonWaxed) {
        GOL.drawMoon(ctx, nodes[ch.moonWorld].x - 28, nodes[ch.moonWorld].y - 28, 8, 0.62, this.t, { glow: false });
      }

      // Noor points at the next thing to do, exactly as on the title journey.
      if (home && prog < 5) {
        const g = nodes[prog];
        GOL.drawFirefly(ctx,
          g.x + 42 + Math.cos(this.t * 0.9) * 9,
          g.y - 24 + Math.sin(this.t * 1.7) * 9,
          this.t, 1.1);
      }
      ctx.restore();
    },

    // A chapter mid-flight between the path and its sky slot.
    drawSwapChapter(ctx, W, H, ci, k, goingDown) {
      const ch = CHAPTERS[ci];
      const prog = this.progress[ci];
      const nodes = pathNodes(W, H);
      const rise = goingDown ? 1 - k : k; // 0 = on path, 1 = in sky
      for (let i = 0; i < 5; i++) {
        const s = skyStar(W, H, ci, i);
        const kk = ease(clamp(rise * 1.25 - i * 0.06, 0, 1));
        const x = lerp(nodes[i].x, s.x, kk);
        const y = lerp(nodes[i].y, s.y, kk) - Math.sin(kk * Math.PI) * 24;
        const r = lerp(16, 6.8, kk);
        // The ground doesn't fly: each disc waits at its path place and
        // breathes away (or back in) with its own world's flight.
        if (kk < 1) {
          ctx.save(); ctx.globalAlpha *= (1 - kk);
          const n = nodes[i];
          ctx.fillStyle = 'rgba(26,39,54,0.24)';
          ctx.beginPath(); ctx.ellipse(n.x + 2, n.y + 30, 34, 10, 0, 0, TAU); ctx.fill();
          const disc = ctx.createLinearGradient(n.x, n.y - 34, n.x, n.y + 34);
          disc.addColorStop(0, '#EDE5D1');
          disc.addColorStop(1, '#CFC29F');
          ctx.fillStyle = disc;
          ctx.beginPath(); ctx.arc(n.x, n.y, 34, 0, TAU); ctx.fill();
          ctx.strokeStyle = 'rgba(240,200,120,0.82)'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(n.x, n.y, 30, 0, TAU); ctx.stroke();
          ctx.restore();
        }
        if (i < prog) {
          GOL.drawGem(ctx, x, y, r, GRAND, this.t, { phase: ch.seed + i, glow: 0.8 });
        } else {
          GOL.star8Path(ctx, x, y, r * 0.7, Math.PI / 8);
          ctx.fillStyle = 'rgba(207,216,215,0.2)'; ctx.fill();
        }
      }
    },

    draw(ctx, W, H) {
      drawNight(ctx, W, H, this.t);
      // While the ascension runs, the next chapter must not appear anywhere
      // yet — its dawn belongs to the ceremony's final breath.
      const home = this.ceremony ? null : this.homeCh();

      // Faint star-dust carries the reading order between formed figures.
      for (let ci = 0; ci < CHAPTERS.length - 1; ci++) {
        if (this.figureFormed(ci)) {
          drawStarDust(ctx, skySlot(W, H, ci), skySlot(W, H, ci + 1),
            this.figureFormed(ci + 1), this.t);
        }
      }

      // --- the sky ---
      const swapUp = this.swap ? this.swap.up : null;
      const swapDown = this.swap ? this.swap.down : null;
      for (let ci = 0; ci < CHAPTERS.length; ci++) {
        if (this.ceremony && this.ceremony.ch === ci) continue; // drawn below
        if (ci === this.pathCh || ci === swapDown) continue;    // it's down / flying
        if (ci === swapUp) continue;                            // flying
        if (this.figureFormed(ci)) this.drawFigure(ctx, W, H, ci, 1);
        else if (ci === home && this.pathCh !== ci) this.drawWaitingHome(ctx, W, H, ci);
        else if (ci === home) this.drawHintSockets(ctx, W, H, ci);
        // future chapters: nothing yet — dark sky is calm promise, not a button
      }

      // --- the path & flights ---
      if (this.ceremony) {
        this.drawCeremony(ctx, W, H);
      } else if (this.swap) {
        const k = ease(clamp(this.swap.t / this.swap.dur, 0, 1));
        if (this.swap.up != null) this.drawSwapChapter(ctx, W, H, this.swap.up, k, false);
        if (this.swap.down != null) this.drawSwapChapter(ctx, W, H, this.swap.down, k, true);
      } else if (this.pathCh != null) {
        this.drawPathChapter(ctx, W, H, this.pathCh, 1);
      } else {
        // Every chapter rests in the sky; Noor drifts over the quiet meadow.
        GOL.drawFirefly(ctx,
          W / 2 + Math.cos(this.t * 0.5) * W * 0.22,
          H * 0.62 + Math.sin(this.t * 1.1) * 14,
          this.t, 1.2);
      }

      const q = safeRect(W, H);
      GOL.drawButton(ctx, q.l + 8, q.t + 12, 22, 'back', { alpha: 0.76 });
      GOL.drawVignette(ctx, W, H, 0.18);
    },

    // The ascension: gems lift off their discs, join star to star overhead,
    // and the figure's light wakes the next chapter on the path below.
    drawCeremony(ctx, W, H) {
      const ci = this.ceremony.ch;
      const ch = CHAPTERS[ci];
      const t = this.ceremony.t;
      const nodes = pathNodes(W, H);
      const shift = this.shiftK(t);
      const anyRisen = this.riseK(0, t) > 0;

      // The chapter's ground: discs dim and settle as their gems leave.
      if (shift < 1) {
        ctx.save();
        ctx.globalAlpha = 1 - shift;
        this.drawPathChapter(ctx, W, H, ci, 1, { gemsGone: anyRisen, sink: shift * 26 });
        ctx.restore();
      }

      // Landed stars and the lines joining them.
      const pts = ch.shape.map((p, i) => skyStar(W, H, ci, i));
      const jk = this.joinK(t);
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const segK = clamp(jk * 4 - i, 0, 1);
        if (segK <= 0) break;
        ctx.strokeStyle = 'rgba(255,226,143,' + (0.5 + segK * 0.3) + ')';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(lerp(pts[i].x, pts[i + 1].x, segK), lerp(pts[i].y, pts[i + 1].y, segK));
        ctx.stroke();
      }
      ctx.restore();

      // The five gems in flight, each on its own gentle arc.
      for (let i = 0; i < 5; i++) {
        const k = this.riseK(i, t);
        if (k <= 0) continue;
        const a = nodes[i];
        const b = pts[i];
        const x = lerp(a.x, b.x, k);
        const y = lerp(a.y, b.y, k) - Math.sin(k * Math.PI) * 56;
        GOL.drawGem(ctx, x, y, lerp(16, 6.8, k), GRAND, this.t, { phase: ch.seed + i, glow: 0.9 });
      }

      // Once joined, the figure breathes and its light falls to the path.
      if (jk >= 1) {
        const c = skySlot(W, H, ci);
        const glow = 0.5 + 0.5 * Math.sin(this.t * 2);
        ctx.strokeStyle = 'rgba(255,233,168,' + (0.2 + glow * 0.15) + ')';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(c.x, c.y, 54 + glow * 4, 42 + glow * 3, 0, 0, TAU); ctx.stroke();
      }

      // The next chapter's discs breathe in from the figure's falling light.
      if (shift > 0 && ci + 1 < CHAPTERS.length) {
        ctx.save();
        ctx.globalAlpha = shift;
        ctx.translate((1 - shift) * 70, 0);
        this.drawPathChapter(ctx, W, H, ci + 1, 1);
        ctx.restore();
      }
    }
  };

  GOL.PROTOTYPES[16] = {
    key: 'sky-path',
    name: 'the sky above the path',
    scene: 'skyPathLab'
  };
  GOL.registerScene('skyPathLab', skyPathLab);
})();
