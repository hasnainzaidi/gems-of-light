// Journey lab · P17 — The Great Garden
//
// The daylight answer to P16's night sky. Same structure — chapters of five
// worlds, each with a shape identity, filling with earned light — but the
// pattern lives in a sunlit walled garden instead of a dark sky. Four
// geometric flowerbeds (a charbagh: the classical fourfold paradise garden)
// sit along one water channel. Every finished world is a gem-hearted bloom
// in its bed; a finished bed flowers into its full figure, its gate swings
// open, and the water runs on to wake the next bed. Night stays where it
// belongs: the small daytime moon over a finished bed is the only trace of
// the Remembering here.
//
// Pure presentation lab: it never reads or writes progression and never
// launches a real world. Tap the breathing star to "finish" a world; the
// fifth runs the blooming ceremony. Direct: ?lab=17
(function () {
  const GOL = window.GOL;
  const TAU = Math.PI * 2;
  const { alpha, tint, shade } = GOL.color;
  const P = GOL.PALETTES.fatiha; // the fullest morning the game owns
  const GRAND = {
    base: '#F0C878', light: '#FFE9A8', lighter: '#FFF6DC',
    dark: '#D9A44A', darker: '#B98A3E', glow: '#FFE9A8'
  };
  const TILT = 0.52; // the storybook lean: ground shapes squash to this

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function ease(v) { return v * v * (3 - 2 * v); }
  function lerp(a, b, k) { return a + (b - a) * k; }

  // Four simulated five-world chapters. Each bed is deliberately its own
  // small figure — a returning child should recognize "the star bed we
  // finished first" the way she'd recognize a constellation.
  const BEDS = [
    {
      key: 'star', seed: 3, bloom: '#F5B8C4', moon: true,
      spots: [[0, 0], [-30, -30], [30, -30], [30, 30], [-30, 30]],
      outline(ctx, R) { GOL.star8Path(ctx, 0, 0, R, Math.PI / 8); }
    },
    {
      key: 'quatrefoil', seed: 7, bloom: '#DCC5EE',
      spots: [[0, -42], [42, 0], [0, 42], [-42, 0], [0, 0]],
      outline(ctx, R) {
        // four petal arcs, the classic clover of Islamic garden beds
        const d = R * 0.44, r = R * 0.58;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2 - Math.PI / 2;
          ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r, a - Math.PI * 0.78, a + Math.PI * 0.78);
        }
        ctx.closePath();
      }
    },
    {
      key: 'ring', seed: 11, bloom: '#FDF6E4',
      spots: [[0, -34], [32, -10], [20, 30], [-20, 30], [-32, -10]],
      outline(ctx, R) { ctx.beginPath(); ctx.arc(0, 0, R * 0.94, 0, TAU); }
    },
    {
      key: 'crescent', seed: 15, bloom: '#BCD9F0',
      spots: [[-36, 14], [-20, -14], [0, -24], [20, -14], [36, 14]],
      outline(ctx, R) {
        ctx.beginPath();
        ctx.arc(0, -R * 0.34, R * 1.02, Math.PI * 0.12, Math.PI * 0.88);
        ctx.arc(0, -R * 0.62, R * 0.86, Math.PI * 0.84, Math.PI * 0.16, true);
        ctx.closePath();
      }
    }
  ];

  function safeRect(W, H) {
    const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
    return { l: sa.l + 32, r: W - sa.r - 32, t: sa.t * 0.5 + 22, b: H - sa.b * 0.5 - 22 };
  }

  // The four beds along the charbagh axis, spread across the garden floor.
  function bedPos(W, H, i) {
    const q = safeRect(W, H);
    const left = q.l + 86;
    const right = q.r - 86;
    return { x: left + (right - left) * (i / 3), y: H * 0.63 + (i % 2 ? 8 : -4) };
  }
  const BED_R = 56;

  function spotPos(W, H, bi, j) {
    const c = bedPos(W, H, bi);
    const s = BEDS[bi].spots[j];
    return { x: c.x + s[0], y: c.y + s[1] * TILT };
  }

  // A garden bloom with a Grand Gem at its heart — the daylight form of
  // P16's constellation star. Petal color is the bed's identity.
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

  const gardenLab = {
    t: 0,
    progress: null,   // per-bed completed worlds (simulated, never saved)
    moonWaxed: false, // lab-local stand-in for "remembered today"
    ceremony: null,   // { t, bed } — the blooming timeline
    pulses: null,     // per-bed tap pulse
    spotPulse: null,  // { bed, j, t }
    fx: null,

    enter() {
      this.t = 0;
      this.progress = [5, 5, 3, 0];
      this.moonWaxed = false;
      this.ceremony = null;
      this.pulses = [0, 0, 0, 0];
      this.spotPulse = null;
      this.fx = GOL.makeFx();
    },

    activeBed() {
      const i = this.progress.findIndex((p) => p < 5);
      return i === -1 ? null : i;
    },

    // Which channel segments carry water: as far as the journey has opened.
    segmentLit(i) {
      if (this.ceremony && this.ceremony.bed === i) return this.waterK(this.ceremony.t) > 0;
      const a = this.activeBed();
      return a == null || i < a;
    },

    // --- the blooming ceremony (seconds from start) ---
    // trace 0–1.6 · burst 1.6–2.4 · gate + water 2.4–3.8 · settle to 4.2
    traceK(t) { return ease(clamp(t / 1.6, 0, 1)); },
    burstK(t) { return clamp((t - 1.6) / 0.8, 0, 1); },
    waterK(t) { return ease(clamp((t - 2.4) / 1.4, 0, 1)); },

    update(dt, W, H) {
      this.t += dt;
      this.fx.update(dt);
      for (let i = 0; i < 4; i++) this.pulses[i] = Math.max(0, this.pulses[i] - dt * 2.2);
      if (this.spotPulse) {
        this.spotPulse.t -= dt * 1.7;
        if (this.spotPulse.t <= 0) this.spotPulse = null;
      }

      if (this.ceremony) {
        const c = this.ceremony;
        const wasBurst = this.burstK(c.t) > 0;
        const wasWater = this.waterK(c.t) > 0;
        c.t += dt;
        if (!wasBurst && this.burstK(c.t) > 0) {
          if (GOL.audio) GOL.audio.sfx('praise');
          for (let j = 0; j < 5; j++) {
            const p = spotPos(W, H, c.bed, j);
            for (let k = 0; k < 4; k++) {
              this.fx.spawn('petal', p.x + GOL.rnd(-8, 8), p.y - 12, { color: Math.random() < 0.5 ? BEDS[c.bed].bloom : '#FFE9A8' });
            }
          }
        }
        if (!wasWater && this.waterK(c.t) > 0 && GOL.audio) GOL.audio.sfx('door');
        if (this.waterK(c.t) >= 1 && this.waterK(c.t - dt) < 1 && c.bed < 3 && GOL.audio) {
          GOL.audio.sfx('unlockLevel');
        }
        if (c.t >= 4.2) this.ceremony = null;
        // the ceremony owns input; taps during it cannot accidentally select
        for (const tap of GOL.Input.taps) tap.ui = true;
        return;
      }

      const q = safeRect(W, H);
      const back = { x: q.l + 8, y: q.t + 12, r: 31 };
      const active = this.activeBed();

      for (const tap of GOL.Input.taps) {
        if (tap.ui) continue;

        if (GOL.dist(tap.x, tap.y, back.x, back.y) < back.r) {
          tap.ui = true;
          GOL.go('title');
          return;
        }

        // The daytime moon over the first finished bed — the Remembering's
        // door, unchanged, resting pale in a morning sky.
        if (!this.moonWaxed && this.progress[0] === 5) {
          const c = bedPos(W, H, 0);
          if (GOL.dist(tap.x, tap.y, c.x + BED_R * 0.5, c.y - BED_R * 1.9) < 22) {
            tap.ui = true;
            this.moonWaxed = true;
            if (GOL.audio) GOL.audio.sfx('yourTurn');
            return;
          }
        }

        // Blooming the next world: only the active bed's breathing star.
        if (active != null) {
          for (let j = 0; j < 5; j++) {
            const p = spotPos(W, H, active, j);
            if (GOL.dist(tap.x, tap.y, p.x, p.y) < 22) {
              tap.ui = true;
              const prog = this.progress[active];
              if (j === prog) {
                this.progress[active]++;
                this.spotPulse = { bed: active, j, t: 1 };
                if (GOL.audio) GOL.audio.sfx('blossom');
                for (let k = 0; k < 5; k++) {
                  this.fx.spawn('petal', p.x + GOL.rnd(-6, 6), p.y - 10, { color: BEDS[active].bloom });
                }
                if (this.progress[active] === 5) this.ceremony = { t: 0, bed: active };
              } else {
                this.spotPulse = { bed: active, j, t: 1 };
                if (GOL.audio) GOL.audio.sfx(j < prog ? 'tap' : 'drift');
              }
              return;
            }
          }
        }

        // Any bed answers a tap with a gentle lean — the future zoom's seat.
        for (let i = 0; i < 4; i++) {
          const c = bedPos(W, H, i);
          if (GOL.dist(tap.x, tap.y, c.x, c.y) < BED_R + 12) {
            tap.ui = true;
            this.pulses[i] = 1;
            if (GOL.audio) GOL.audio.sfx(this.progress[i] === 0 && i !== active ? 'drift' : 'tap');
            return;
          }
        }
      }
    },

    // ------------------------------------------------------------ drawing --

    drawChannel(ctx, W, H) {
      // The charbagh axis: one stone-edged runnel threading the four beds.
      // Water flows as far as the journey has opened; beyond, the channel
      // waits dry in the sun.
      for (let i = 0; i < 3; i++) {
        const a = bedPos(W, H, i), b = bedPos(W, H, i + 1);
        const lit = this.segmentLit(i);
        const x1 = a.x + BED_R * 0.92, x2 = b.x - BED_R * 0.92;
        const midY = (a.y + b.y) / 2;
        const h = 7; // half-height of the tilted runnel
        // stone lips
        ctx.fillStyle = P.stoneShade;
        ctx.fillRect(x1, midY - h - 3, x2 - x1, h * 2 + 6);
        ctx.fillStyle = P.stone;
        ctx.fillRect(x1, midY - h - 3, x2 - x1, 2.4);
        // during this segment's ceremony the water fills BEHIND the bright
        // ripple, so the child watches it arrive rather than find it there
        let fillK = 1;
        if (this.ceremony && this.ceremony.bed === i) fillK = this.waterK(this.ceremony.t);
        if (fillK < 1) { // still dry ahead of the arriving water
          ctx.fillStyle = shade(P.soil, 0.08);
          ctx.fillRect(x1, midY - h, x2 - x1, h * 2);
        }
        if (lit) {
          const wg = ctx.createLinearGradient(0, midY - h, 0, midY + h);
          wg.addColorStop(0, P.waterHi);
          wg.addColorStop(1, P.water);
          ctx.fillStyle = wg;
          ctx.fillRect(x1, midY - h, (x2 - x1) * fillK, h * 2);
          // running glints
          for (let g = 0; g < 5; g++) {
            const k = ((this.t * 0.14 + g * 0.2 + i * 0.37) % 1);
            if (k > fillK) continue; // no sparkle ahead of the water
            const gx = x1 + (x2 - x1) * k;
            ctx.fillStyle = alpha('#FFFFFF', 0.35 + 0.25 * Math.sin(this.t * 3 + g * 2));
            ctx.beginPath(); ctx.ellipse(gx, midY + Math.sin(k * 9 + i) * 2, 5, 1.6, 0, 0, TAU); ctx.fill();
          }
        } else {
          ctx.fillStyle = shade(P.soil, 0.08);
          ctx.fillRect(x1, midY - h, x2 - x1, h * 2);
          ctx.fillStyle = alpha(P.pebble, 0.5);
          for (let g = 0; g < 6; g++) {
            ctx.beginPath();
            ctx.ellipse(x1 + (x2 - x1) * ((g + 0.5) / 6), midY + ((g % 2) * 4 - 2), 3, 1.6, 0, 0, TAU);
            ctx.fill();
          }
        }
        // the ceremony's gift travels the channel as one bright ripple
        if (this.ceremony && this.ceremony.bed === i) {
          const k = this.waterK(this.ceremony.t);
          if (k > 0 && k < 1) {
            const gx = x1 + (x2 - x1) * k;
            const glow = ctx.createRadialGradient(gx, midY, 1, gx, midY, 26);
            glow.addColorStop(0, 'rgba(255,246,220,0.85)');
            glow.addColorStop(1, 'rgba(255,246,220,0)');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(gx, midY, 26, 0, TAU); ctx.fill();
          }
        }
      }
    },

    drawGate(ctx, W, H, i) {
      // A small garden gate on the channel past bed i: open once the water
      // runs, closed while the next bed still sleeps. Warm wood, never a wall.
      const a = bedPos(W, H, i), b = bedPos(W, H, i + 1);
      const gx = (a.x + b.x) / 2, gy = (a.y + b.y) / 2;
      let openK = this.segmentLit(i) ? 1 : 0;
      if (this.ceremony && this.ceremony.bed === i) openK = this.waterK(this.ceremony.t);
      const lift = 26; // gate straddles the channel
      ctx.save();
      // posts
      ctx.fillStyle = P.stoneShade;
      ctx.fillRect(gx - 15, gy - lift, 5, lift + 6);
      ctx.fillRect(gx + 10, gy - lift, 5, lift + 6);
      ctx.fillStyle = P.stone;
      ctx.fillRect(gx - 15, gy - lift, 2, lift + 6);
      ctx.fillRect(gx + 10, gy - lift, 2, lift + 6);
      // arch
      ctx.strokeStyle = P.stoneDark; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(gx, gy - lift + 2, 13, Math.PI, 0); ctx.stroke();
      ctx.strokeStyle = P.gold; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(gx, gy - lift + 2, 13, Math.PI, 0); ctx.stroke();
      // doors fold back as the gate opens
      const dw = lerp(9.5, 1.8, ease(openK));
      const doorH = lift - 4;
      const wood = ctx.createLinearGradient(0, gy - doorH - 4, 0, gy + 2);
      wood.addColorStop(0, P.trunk);
      wood.addColorStop(1, P.trunkDark);
      ctx.fillStyle = wood;
      ctx.fillRect(gx - 10, gy - doorH - 4, dw, doorH + 6);
      ctx.fillRect(gx + 10 - dw, gy - doorH - 4, dw, doorH + 6);
      if (openK < 0.5) {
        ctx.fillStyle = alpha(P.gold, 0.9); // the small ring that promises opening
        ctx.beginPath(); ctx.arc(gx - 2.5, gy - doorH * 0.45, 1.8, 0, TAU); ctx.fill();
      }
      ctx.restore();
    },

    drawBed(ctx, W, H, i) {
      const bed = BEDS[i];
      const c = bedPos(W, H, i);
      const prog = this.progress[i];
      // while a ceremony runs, the next bed must not wake anywhere yet —
      // its morning belongs to the water's arrival (P16's lesson, kept)
      const active = !this.ceremony && i === this.activeBed();
      const asleep = prog === 0 && !active;
      const pulse = this.pulses[i];
      const scale = 1 + pulse * 0.05;
      const cerHere = this.ceremony && this.ceremony.bed === i;

      // --- the ground shape, drawn in tilted garden space ---
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(scale, TILT * scale);
      // soft ground shadow
      ctx.save(); ctx.translate(2, 7);
      bed.outline(ctx, BED_R + 7);
      ctx.fillStyle = alpha('#3E5340', 0.13); ctx.fill();
      ctx.restore();
      // stone rim
      bed.outline(ctx, BED_R + 7);
      ctx.fillStyle = asleep ? shade(P.stone, 0.14) : P.stone;
      ctx.fill();
      bed.outline(ctx, BED_R + 7);
      ctx.strokeStyle = asleep ? alpha(P.stoneDark, 0.5) : P.stoneShade;
      ctx.lineWidth = 3; ctx.stroke();
      // the bed itself: earth still asleep, or green and growing
      bed.outline(ctx, BED_R - 2);
      if (asleep) {
        const sg = ctx.createLinearGradient(0, -BED_R, 0, BED_R);
        sg.addColorStop(0, P.soil);
        sg.addColorStop(1, P.soilDark);
        ctx.fillStyle = sg;
      } else {
        const gg = ctx.createLinearGradient(0, -BED_R, 0, BED_R);
        gg.addColorStop(0, prog === 5 ? tint(P.grassLight, 0.18) : P.grassLight);
        gg.addColorStop(1, P.grass);
        ctx.fillStyle = gg;
      }
      ctx.fill();
      // a finished bed's rim carries the earned gold, breathing gently
      if (prog === 5 && !cerHere) {
        bed.outline(ctx, BED_R + 7);
        ctx.strokeStyle = alpha(P.gold, 0.5 + 0.2 * Math.sin(this.t * 1.6 + bed.seed));
        ctx.lineWidth = 2.4; ctx.stroke();
      }
      // the ceremony traces the figure in light, the way a constellation
      // joined star to star — but this light runs around a flowerbed at noon
      if (cerHere) {
        const k = this.traceK(this.ceremony.t);
        if (k > 0) {
          bed.outline(ctx, BED_R + 7);
          ctx.strokeStyle = alpha('#FFE9A8', 0.25 + k * 0.6);
          ctx.lineWidth = 2 + k * 3; ctx.stroke();
        }
      }
      ctx.restore();

      // the tracing glint circles the rim in screen space
      if (cerHere) {
        const k = this.traceK(this.ceremony.t);
        if (k > 0 && k < 1) {
          const a = -Math.PI / 2 + k * TAU;
          const gx = c.x + Math.cos(a) * (BED_R + 9) * scale;
          const gy = c.y + Math.sin(a) * (BED_R + 9) * TILT * scale;
          const glow = ctx.createRadialGradient(gx, gy, 1, gx, gy, 18);
          glow.addColorStop(0, 'rgba(255,246,220,0.95)');
          glow.addColorStop(1, 'rgba(255,246,220,0)');
          ctx.fillStyle = glow;
          ctx.beginPath(); ctx.arc(gx, gy, 18, 0, TAU); ctx.fill();
        }
      }

      // --- what grows in it, upright like the storybook it is ---
      const burst = cerHere ? this.burstK(this.ceremony.t) : 0;
      for (let j = 0; j < 5; j++) {
        const p = spotPos(W, H, i, j);
        const sp = this.spotPulse && this.spotPulse.bed === i && this.spotPulse.j === j
          ? this.spotPulse.t : 0;
        if (j < prog) {
          drawBloom(ctx, p.x, p.y, 10, this.t + bed.seed + j, bed.bloom,
            sp + (burst > 0 ? Math.sin(burst * Math.PI) * 0.8 : 0));
        } else if (active && j === prog) {
          // the breathing star: the journey's "next" idiom, in the grass
          const b = 0.72 + 0.28 * Math.sin(this.t * 2.4);
          GOL.star8Path(ctx, p.x, p.y, 9 + b * 1.5 + sp * 2, Math.PI / 8);
          ctx.fillStyle = alpha('#F0C878', 0.35 + b * 0.3); ctx.fill();
          ctx.strokeStyle = alpha('#B98A3E', 0.9); ctx.lineWidth = 1.8; ctx.stroke();
        } else if (!asleep) {
          drawBud(ctx, p.x, p.y, 0.8);
        } else {
          // a sleeping bed only hints at its five places
          ctx.fillStyle = alpha(P.soilDark, 0.55);
          ctx.beginPath(); ctx.ellipse(p.x, p.y, 4.5, 2.6, 0, 0, TAU); ctx.fill();
        }
      }

      // the daytime moon: pale, resting over the first finished bed —
      // proof the Remembering's door survives the morning
      if (i === 0 && prog === 5 && bed.moon) {
        // a real daytime moon: high over its bed, pale against the hills —
        // a white crescent on a wisp of sky
        const mx = c.x + BED_R * 0.5, my = c.y - BED_R * 1.9;
        ctx.save();
        if (this.moonWaxed) ctx.globalAlpha *= 0.5;
        else {
          const breathe = 0.5 + 0.5 * Math.sin(this.t * 1.6);
          ctx.fillStyle = alpha('#FFFFFF', 0.28 + breathe * 0.2);
          ctx.beginPath(); ctx.arc(mx, my, 16 + breathe * 2.5, 0, TAU); ctx.fill();
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(mx, my, 8.5, 0, TAU); ctx.fill();
        ctx.fillStyle = tint(P.skyTop, 0.4); // the sky bites the waning side
        ctx.beginPath(); ctx.arc(mx + 4.2, my - 1.2, 7, 0, TAU); ctx.fill();
        ctx.restore();
      }
    },

    draw(ctx, W, H) {
      // The game's own morning: sky, hills, rays, meadow — nothing new.
      if (!this.bd) this.bd = GOL.buildBackdrop('fatiha', 17);
      GOL.drawBackdrop(ctx, this.bd, W, H, this.t, this.t * 6, 0.36);

      // a low garden wall on the horizon line: cream stone, mostly light
      const wy = H * 0.38;
      ctx.fillStyle = alpha(P.stone, 0.55);
      ctx.fillRect(0, wy - 7, W, 7);
      ctx.fillStyle = alpha(P.stoneShade, 0.45);
      ctx.fillRect(0, wy - 2, W, 2);
      for (let x = 30; x < W; x += 120) {
        ctx.fillStyle = alpha(P.stone, 0.7);
        ctx.fillRect(x, wy - 13, 8, 13);
        GOL.star8(ctx, x + 4, wy - 17, 2.6, Math.PI / 8, alpha(P.gold, 0.6));
      }

      // the meadow floor is alive but quiet: deterministic tufts and tiny
      // wildflowers in bands above and below the beds (never in draw()'s
      // randomness, so the field holds still)
      const FLOWER_COLORS = ['#F5B8C4', '#FFE9A8', '#FDF6E4'];
      for (let i = 0; i < 46; i++) {
        const fx = (i * 193.7 + 57) % W;
        const band = i % 2 ? [0.43, 0.52] : [0.79, 0.95];
        const fy = H * (band[0] + ((i * 71.3 + 13) % 100) / 100 * (band[1] - band[0]));
        const sway = Math.sin(this.t * 1.4 + i) * 0.8;
        ctx.strokeStyle = alpha(P.grassDark, 0.5);
        ctx.lineWidth = 1.3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(fx, fy + 4); ctx.quadraticCurveTo(fx + sway, fy - 1, fx + sway * 1.4, fy - 5); ctx.stroke();
        if (i % 3 === 0) {
          ctx.fillStyle = alpha(FLOWER_COLORS[(i / 3) % 3 | 0], 0.75);
          for (let k = 0; k < 5; k++) {
            const a = (k / 5) * TAU + i;
            ctx.beginPath();
            ctx.arc(fx + sway * 1.4 + Math.cos(a) * 2.4, fy - 6 + Math.sin(a) * 2.4, 1.5, 0, TAU);
            ctx.fill();
          }
          ctx.fillStyle = alpha('#FFF3C4', 0.85);
          ctx.beginPath(); ctx.arc(fx + sway * 1.4, fy - 6, 1.3, 0, TAU); ctx.fill();
        }
      }

      this.drawChannel(ctx, W, H);
      for (let i = 0; i < 3; i++) this.drawGate(ctx, W, H, i);
      for (let i = 0; i < 4; i++) this.drawBed(ctx, W, H, i);

      // Noor rests beside the next thing to do, exactly as on the journey.
      const active = this.ceremony ? null : this.activeBed();
      if (active != null) {
        const p = spotPos(W, H, active, this.progress[active]);
        GOL.drawFirefly(ctx,
          p.x + 30 + Math.cos(this.t * 0.9) * 8,
          p.y - 22 + Math.sin(this.t * 1.7) * 8,
          this.t, 1.1);
      } else if (!this.ceremony) {
        GOL.drawFirefly(ctx,
          W / 2 + Math.cos(this.t * 0.5) * W * 0.2,
          H * 0.5 + Math.sin(this.t * 1.1) * 12,
          this.t, 1.2);
      }

      this.fx.draw(ctx);
      const q = safeRect(W, H);
      GOL.drawButton(ctx, q.l + 8, q.t + 12, 22, 'back', { alpha: 0.76 });
      GOL.drawVignette(ctx, W, H, 0.12);
    }
  };

  GOL.PROTOTYPES[17] = {
    key: 'great-garden',
    name: 'the great garden',
    scene: 'gardenLab'
  };
  GOL.registerScene('gardenLab', gardenLab);
})();
