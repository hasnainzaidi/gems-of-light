// Quraysh learning-loop lab · P20 — The Caravan Road
//
// A walkable memory palace for Surah Quraysh (106). One long side-scrolling
// road; four landmarks in fixed order — the city gate (ayah 1), the two-weather
// pass (ayah 2, snow left / sun right), the House on the hill (ayah 3, w12's
// cube), the lantern feast garden (ayah 4). HOLD anywhere = the caravan walks;
// release = it rests. The road only carries the caravan through a landmark
// while that landmark's ayah is sounding: each ayah begins as the caravan
// enters its zone, and a soft gate holds forward progress until the ayah has
// been heard. Bind ayah → place; the method of loci for a five-year-old.
//
//   Traversal 1  LISTEN — walk the road, each landmark sings its ayah; the
//                two-weather pass glitters snow on «الشتاء», flares sun on
//                «الصيف» (per-word timings from the read-along table).
//   Traversal 2  RECOGNIZE — each landmark waits dim and hums its first word;
//                two floating lights hover (one carries this landmark's ayah,
//                one another ayah OF THIS SURAH). Audition either by tapping
//                (never wrong, never punished); place the right one — drag it
//                in, or tap it then the landmark — and the landmark blooms as
//                its full ayah plays. The gentle ladder (dim+first-word hum →
//                opening phrase → the correct light pulses in rhythm → it
//                drifts into place itself) supplies help without ever marking
//                the work. Support rungs persist, so a return visit starts a
//                beat more independent.
//
// No mic required (optional flourish: shimmer the camel bells while someone
// speaks — this room never asks for the mic). No child-facing text. Direct:
// ?lab=20 (add &debug=1 for fast fades).
(function () {
  const GOL = window.GOL;
  const TAU = Math.PI * 2;
  const { mix, shade, tint, alpha } = GOL.color;
  const Q = GOL.QROOMS;

  // ---- small math (engine.js isn't loaded in the smoke harness) -----------
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (v) => v * v * (3 - 2 * v);
  const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); };

  const GRAND = { base: '#F0C878', light: '#FFE9A8', lighter: '#FFF6DC', dark: '#D9A44A', darker: '#B98A3E', glow: '#FFE9A8' };
  const WINTER = GOL.PALETTES.quraishWinter;
  const SUMMER = GOL.PALETTES.quraysh;   // note: the summer dust palette key is 'quraysh'

  // ---- world geometry (world px; the camera scrolls horizontally) ---------
  const ROAD_LEN = 4200;
  const START_X = 240;
  const REST_X = 4060;
  const WALK_SPEED = 156;
  const GROUND_FRAC = 0.74;
  // each landmark: center x, the ayah it sings, its kind (its own drawing)
  const MARKS = [
    { ayah: 1, x: 660, kind: 'gate' },
    { ayah: 2, x: 1700, kind: 'pass' },
    { ayah: 3, x: 2720, kind: 'house' },
    { ayah: 4, x: 3680, kind: 'garden' }
  ];
  // a different ayah OF THIS SURAH for each landmark's distractor light
  const OTHER = { 1: 2, 2: 3, 3: 4, 4: 1 };
  const MARK_TOP = 176; // px the tallest landmark rises above the ground line

  // ---- optional-helper fallbacks (real ones live in actors/props) ---------
  function gem(ctx, x, y, r, C, t, o) {
    if (GOL.drawGem) return GOL.drawGem(ctx, x, y, r, C, t, o);
    o = o || {};
    const glow = o.glow == null ? 1 : o.glow;
    ctx.save(); ctx.translate(x, y);
    if (glow > 0.01) {
      const g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 3);
      g.addColorStop(0, alpha(C.glow, 0.5 * glow)); g.addColorStop(1, alpha(C.glow, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 3, 0, TAU); ctx.fill();
    }
    ctx.rotate(t * 0.2 + (o.phase || 0));
    const bg = ctx.createLinearGradient(-r, -r, r, r);
    bg.addColorStop(0, C.dark); bg.addColorStop(0.55, C.base); bg.addColorStop(1, C.light);
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(0, -r); ctx.lineTo(r * 0.8, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.8, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function firefly(ctx, x, y, t, g) {
    if (GOL.drawFirefly) return GOL.drawFirefly(ctx, x, y, t, g);
    const k = 0.7 + 0.3 * Math.sin(t * 5);
    ctx.save(); ctx.translate(x, y);
    const h = ctx.createRadialGradient(0, 0, 0.5, 0, 0, 15);
    h.addColorStop(0, alpha('#FFF3C4', 0.6 * k * (g || 1))); h.addColorStop(1, alpha('#FFF3C4', 0));
    ctx.fillStyle = h; ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.fill();
    ctx.fillStyle = '#FFFBEA'; ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // A soft chime helper that never throws when the audio layer is absent.
  function sfx(name) { if (GOL.audio && GOL.audio.sfx) GOL.audio.sfx(name); }

  // =========================================================================
  const lab = {
    // ---- lifecycle --------------------------------------------------------
    enter(params) {
      this.t = 0;
      this.fast = /[?&]debug=1/.test((GOL.location && GOL.location.search) || (typeof location !== 'undefined' ? location.search : ''));
      this.unlocked = false;
      this.phase = 'listen';          // listen → turn → recognize → done
      this.phaseT = 0;
      this.camX = 0;
      this.W = 800; this.H = 450; this.groundY = this.H * GROUND_FRAC;
      this.caravan = { x: START_X, vx: 0, stepT: 0 };
      this.grab = null;               // { li, si } while a light follows a drag
      this.ay2 = null;                // { t } sparkle clock while ayah 2 sounds

      // persistence: which support rung each landmark needed last time, so a
      // return visit can wait a beat longer where the child was already strong
      const saved = (Q && Q.load && Q.load('caravan-road')) || {};
      this.best = (saved.best && saved.best.slice(0, 4)) || [null, null, null, null];
      this.visits = (saved.visits || 0) + 1;
      if (Q && Q.log) Q.log('caravan-road', 'enter', { visit: this.visits });

      this.marks = MARKS.map((m, i) => this.freshMark(m, i));
    },

    freshMark(m, i) {
      // delay bonus: independent last time (low rung) → longer hesitation now
      const b = this.best[i];
      const bonus = b == null ? 0 : b <= 0 ? 1.6 : b <= 1 ? 1.0 : b <= 2 ? 0.4 : 0;
      return {
        ayah: m.ayah, x: m.x, kind: m.kind, i,
        triggered: false, heard: false, playT: 0, playing: false,
        lit: 0,                       // road-glow memory (listen) / bloom (recognize)
        // recognize state
        armed: false, placed: false, ready: false, delayBonus: bonus,
        lights: null, ladder: null, pulseCorrect: false, placing: null, autoPlaced: false,
        lantern: 0                    // garden lanterns lit 0..1 (drawn as count)
      };
    },

    exit() { if (Q && Q.stopSlice) Q.stopSlice(); },

    // ---- geometry ---------------------------------------------------------
    computeCam(W, H) {
      this.camX = clamp(this.caravan.x - W * 0.4, 0, Math.max(0, ROAD_LEN - W));
    },
    sx(worldX) { return worldX - this.camX; },
    socketPos(m) { return { x: this.sx(m.x), y: this.groundY - 118 }; },
    lightHover(m, si, t) {
      const side = si === 0 ? -1 : 1;
      const bx = this.sx(m.x) + side * 74;
      const by = this.groundY - 168 + Math.sin(t * 1.6 + si * 1.7) * 7;
      return { x: bx, y: by };
    },
    lightPos(m, si, t) {
      const h = this.lightHover(m, si, t);
      const L = m.lights[si];
      return { x: h.x + (L.dx || 0), y: h.y + (L.dy || 0) };
    },

    // The x beyond which the caravan may not pass yet (a gentle gate).
    barrier() {
      for (const m of this.marks) {
        if (this.phase === 'listen' && !m.heard) return m.x + 70;
        if (this.phase === 'recognize' && !m.placed) return m.x - 128;
      }
      return REST_X;
    },

    // ---- update -----------------------------------------------------------
    update(dt, W, H) {
      if (this.fast) dt = Math.min(dt * 1.6, 0.05);
      this.t += dt; this.phaseT += dt;
      this.W = W; this.H = H; this.groundY = H * GROUND_FRAC;
      this.computeCam(W, H);
      if (this.ay2) this.ay2.t += dt;

      // walking: hold anywhere carries the caravan; release rests it. When a
      // landmark blocks the way, the clamp simply stops the walk — never a jolt.
      const holding = !!(GOL.Input && GOL.Input.drag) && this.phase !== 'turn';
      const targetV = holding ? WALK_SPEED : 0;
      const car = this.caravan;
      car.vx += (targetV - car.vx) * Math.min(1, dt * 6);
      const bar = Math.min(this.barrier(), REST_X);
      car.x = clamp(car.x + car.vx * dt, START_X, bar);
      const moving = Math.abs(car.vx) > 10 && car.x < bar - 0.5;
      if (moving) {
        car.stepT += dt;
        if (car.stepT > 0.32) { car.stepT = 0; sfx('step'); }
      } else car.vx *= 0.6;
      this.moving = moving;

      // landmark triggers as the caravan enters each zone
      for (const m of this.marks) {
        const near = car.x >= m.x - 250;
        if (this.phase === 'listen' && near && !m.triggered) this.beginListen(m);
        if (this.phase === 'recognize' && near && !m.armed) this.armRecognize(m);
      }

      // per-landmark listen playback bookkeeping (+ a never-stuck fallback)
      for (const m of this.marks) {
        if (m.playing) {
          m.playT += dt;
          if (m.lit < 1) m.lit = Math.min(1, m.lit + dt * 0.8);
          if (m.playT > 18) { m.playing = false; m.heard = true; }
        }
        if (m.kind === 'garden' && this.phase === 'listen' && m.playing) {
          m.lantern = Math.min(1, m.playT / 6);
        }
      }

      // phase advance
      if (this.phase === 'listen' && this.marks.every((m) => m.heard)) {
        this.phase = 'turn'; this.phaseT = 0; sfx('settle');
        if (Q && Q.log) Q.log('caravan-road', 'listen-complete', {});
      } else if (this.phase === 'turn' && (this.phaseT > (this.fast ? 1.2 : 2.6))) {
        this.beginRecognize();
      } else if (this.phase === 'recognize' && this.marks.every((m) => m.placed) &&
                 !this.marks.some((m) => m.placing)) {
        if (car.x >= REST_X - 2) {
          if (this.phase !== 'done') { this.phase = 'done'; this.phaseT = 0; sfx('praise'); this.finish(); }
        }
      }

      // the active recognize landmark drives its own support ladder
      const act = this.activeMark();
      if (act && act.ladder && !act.placed && !act.placing) act.ladder.update(dt);

      // ease every light's displacement home (drift-back), unless it's grabbed
      for (const m of this.marks) {
        if (!m.lights) continue;
        for (let si = 0; si < m.lights.length; si++) {
          const L = m.lights[si];
          const grabbed = this.grab && this.grab.li === m.i && this.grab.si === si && GOL.Input.drag;
          if (!grabbed) { L.dx = (L.dx || 0) * (1 - Math.min(1, dt * 6)); L.dy = (L.dy || 0) * (1 - Math.min(1, dt * 6)); }
        }
        if (m.placing) this.stepPlacing(m, dt);
        if (m.placed && m.lit < 1) m.lit = Math.min(1, m.lit + dt * 1.4);
      }

      this.handleInput(W, H);
    },

    activeMark() {
      if (this.phase !== 'recognize') return null;
      return this.marks.find((m) => m.armed && !m.placed) || null;
    },

    // ---- listen (traversal 1) --------------------------------------------
    beginListen(m) {
      m.triggered = true; m.playing = true; m.playT = 0;
      sfx('nearby');
      if (m.kind === 'pass') this.ay2 = { t: 0 };
      if (Q && Q.log) Q.log('caravan-road', 'listen-ayah', { ayah: m.ayah });
      Q.playAyah(m.ayah, () => { m.playing = false; m.heard = true; m.lit = 1; sfx('settle'); });
    },

    // ---- recognize (traversal 2) -----------------------------------------
    beginRecognize() {
      this.phase = 'recognize'; this.phaseT = 0;
      this.caravan.x = START_X; this.caravan.vx = 0;
      for (const m of this.marks) {
        m.triggered = false; m.playing = false; m.playT = 0;
        m.lit = 0.22;                 // waits dim
        m.armed = false; m.placed = false; m.ready = false;
        m.lights = null; m.ladder = null; m.pulseCorrect = false; m.placing = null; m.autoPlaced = false;
        m.lantern = 0;
      }
      if (Q && Q.log) Q.log('caravan-road', 'recognize-begin', {});
    },

    armRecognize(m) {
      m.armed = true;
      const correctSide = m.ayah % 2;   // varies per landmark, not a tell
      m.lights = [0, 1].map((si) => ({
        ayah: si === correctSide ? m.ayah : OTHER[m.ayah],
        correct: si === correctSide, dx: 0, dy: 0
      }));
      const self = this;
      const d = (this.fast ? 2.2 : 4.0) + m.delayBonus;
      m.ladder = Q.ladder({
        delays: [d, d, d],
        rungs: [
          function () { m.pulseCorrect = false; Q.firstWord(m.ayah); sfx('hint'); },          // dim + first-word hum
          function () { Q.openingPhrase(m.ayah); sfx('hint'); },                               // a longer opening phrase
          function () { m.pulseCorrect = true; Q.firstWord(m.ayah); sfx('yourTurn'); },        // the correct light pulses in rhythm
          function () { self.beginPlacing(m, m.lights.find((L) => L.correct), true); }         // it drifts into place itself
        ]
      });
      m.ladder.arm();
      sfx('yourTurn');
      if (Q && Q.log) Q.log('caravan-road', 'recognize-arm', { ayah: m.ayah });
    },

    audition(light) { if (light) Q.playAyah(light.ayah); },

    beginPlacing(m, light, auto) {
      if (!light || m.placing || m.placed) return;
      const from = this.lightPos(m, m.lights.indexOf(light), this.t);
      m.placing = { light, t: 0, dur: this.fast ? 0.3 : 0.6, fx: from.x, fy: from.y };
      m.autoPlaced = !!auto;
      if (m.ladder) m.ladder.answer();
      m.pulseCorrect = false;
      sfx('place');
    },
    stepPlacing(m, dt) {
      const p = m.placing;
      p.t += dt;
      if (p.t >= p.dur) {
        m.placing = null; m.placed = true; m.lit = Math.max(m.lit, 0.4);
        m.lantern = 1;
        if (m.kind === 'pass') this.ay2 = { t: 0 };
        sfx('bloom');
        const rung = m.autoPlaced ? 3 : (m.ladder ? Math.max(0, m.ladder.rung) : 0);
        this.best[m.i] = this.best[m.i] == null ? rung : Math.min(this.best[m.i], rung);
        if (Q && Q.log) Q.log('caravan-road', 'placed', { ayah: m.ayah, rung, auto: m.autoPlaced });
        Q.playAyah(m.ayah);           // the full ayah plays as the caravan passes
        this.persist();
      }
    },

    finish() {
      for (const m of this.marks) m.lit = 1;
      if (Q && Q.log) Q.log('caravan-road', 'recognize-complete', { best: this.best.slice() });
      this.persist();
    },
    persist() { if (Q && Q.save) Q.save('caravan-road', { best: this.best, visits: this.visits }); },

    // ---- input ------------------------------------------------------------
    handleInput(W, H) {
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
      const home = { x: 34 + sa.l, y: 34 + sa.t * 0.5, r: 24 };
      const taps = (GOL.Input && GOL.Input.taps) || [];
      const drag = GOL.Input && GOL.Input.drag;
      const releases = (GOL.Input && GOL.Input.releases) || [];
      this.homeBtn = home;

      // a light released from a drag: place it (if correct) over the socket
      if (this.grab && !drag) {
        const m = this.marks[this.grab.li];
        const L = m && m.lights && m.lights[this.grab.si];
        const rel = releases[releases.length - 1];
        if (m && L && rel) {
          const s = this.socketPos(m);
          if (dist2(rel.x, rel.y, s.x, s.y) < 54 && L.correct && !m.placed) {
            this.beginPlacing(m, L, false);
          } else if (!L.correct && dist2(rel.x, rel.y, s.x, s.y) < 54) {
            this.audition(L); sfx('drift');   // hearing more Quran is never a penalty
          }
        }
        this.grab = null;
      } else if (this.grab && drag) {
        const m = this.marks[this.grab.li];
        const L = m && m.lights && m.lights[this.grab.si];
        if (m && L) {
          const h = this.lightHover(m, this.grab.si, this.t);
          L.dx = drag.x - h.x; L.dy = drag.y - h.y;
        } else this.grab = null;
      }

      const act = this.activeMark();
      for (const tap of taps) {
        if (tap.ui) continue;
        if (!this.unlocked) { if (GOL.audio && GOL.audio.unlock) GOL.audio.unlock(); this.unlocked = true; }

        if (dist2(tap.x, tap.y, home.x, home.y) < home.r + 12) { tap.ui = true; GOL.go('title'); return; }

        if (act) {
          // tap a hovering light — audition it (never wrong), and let it be dragged
          let hitLight = false;
          for (let si = 0; si < act.lights.length; si++) {
            const p = this.lightPos(act, si, this.t);
            if (dist2(tap.x, tap.y, p.x, p.y) < 34) {
              tap.ui = true; hitLight = true;
              const L = act.lights[si];
              this.audition(L);
              act.ready = L.correct ? L : false;
              if (act.ladder) act.ladder.hold(this.fast ? 1.5 : 3);
              if (drag) this.grab = { li: act.i, si };
              if (Q && Q.log) Q.log('caravan-road', 'audition', { ayah: L.ayah, correct: L.correct });
              break;
            }
          }
          if (hitLight) continue;
          // tap the landmark itself — place the auditioned correct light
          const s = this.socketPos(act);
          if (dist2(tap.x, tap.y, s.x, s.y) < 52) {
            tap.ui = true;
            if (act.ready && act.ready.correct && !act.placed) this.beginPlacing(act, act.ready, false);
            else { Q.firstWord(act.ayah); if (act.ladder) act.ladder.hold(this.fast ? 1.5 : 3); }
            continue;
          }
        }
      }
    },

    // ---- draw =============================================================
    draw(ctx, W, H) {
      this.W = W; this.H = H; this.groundY = H * GROUND_FRAC;
      this.computeCam(W, H);
      const t = this.t, gy = this.groundY;

      // the two seasons ARE the palette: cool winter warming to summer gold
      const seasonK = clamp((this.caravan.x - 500) / (REST_X - 900), 0, 1);
      const P = GOL.lerpPal ? GOL.lerpPal(WINTER, SUMMER, seasonK) : SUMMER;

      if (GOL.drawSky) GOL.drawSky(ctx, W, H, P, t, this.camX);
      else { ctx.fillStyle = P.skyMid; ctx.fillRect(0, 0, W, H); }
      this.drawHills(ctx, W, H, gy, P, t);
      this.drawGround(ctx, W, H, gy, P, t, seasonK);

      // faint warm seeds trace the road already walked (the glow behind you)
      this.drawTrail(ctx, gy, t);

      // landmarks, far to near along the road
      for (const m of this.marks) this.drawMark(ctx, m, gy, P, t);

      // the caravan: a lead camel and two little ones
      this.drawCaravan(ctx, gy, t);

      // recognize: the floating candidate lights + the wordless cue point
      if (this.phase === 'recognize') {
        const act = this.activeMark();
        for (const m of this.marks) {
          if (!m.lights || m.placed) continue;
          const isAct = act && act.i === m.i;
          for (let si = 0; si < m.lights.length; si++) {
            if (m.placing && m.placing.light === m.lights[si]) continue;
            const p = this.lightPos(m, si, t);
            const L = m.lights[si];
            const pulse = isAct && m.pulseCorrect && L.correct;
            this.drawLight(ctx, p.x, p.y, t, si, pulse);
          }
          if (m.placing) {
            const p = m.placing; const k = ease(clamp(p.t / p.dur, 0, 1));
            const s = this.socketPos(m);
            this.drawLight(ctx, lerp(p.fx, s.x, k), lerp(p.fy, s.y, k), t, 0, false, 1 - k * 0.3);
          }
        }
      }

      // gentle "your turn / rest" firefly — the shared your-turn signifier
      if (this.phase === 'recognize') {
        const act = this.activeMark();
        if (act) { const s = this.socketPos(act); firefly(ctx, s.x + Math.cos(t) * 10, s.y - 60 + Math.sin(t * 1.4) * 8, t, 1.1); }
      } else if (this.phase === 'listen' || this.phase === 'turn') {
        const cx = this.sx(this.caravan.x) + 40;
        firefly(ctx, cx + Math.cos(t * 0.8) * 10, gy - 96 + Math.sin(t * 1.6) * 8, t, 1);
      }

      // the two-weather sparkle (owned by the pass, timed to «الشتاء»/«الصيف»)
      this.drawSeasonSparkle(ctx, gy, t);

      // home star — small, unobtrusive, top-left in the safe area
      this.drawHome(ctx, t);
      if (GOL.drawVignette) GOL.drawVignette(ctx, W, H, 0.14);

      if (GOL.DEBUG && GOL.text) {
        GOL.text(ctx, this.phase + ' · v' + this.visits + ' · best ' + this.best.join(','),
          W / 2, H - 12, { size: 10, weight: '700', color: 'rgba(255,255,255,0.5)' });
      }
    },

    // ---- scenery ----------------------------------------------------------
    drawHills(ctx, W, H, gy, P, t) {
      const ridge = (color, base, amp, factor, k) => {
        const off = -this.camX * factor;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W + 20; x += 20) {
          const wx = x - off;
          const y = base + Math.sin(wx * 0.0016 + k) * amp + Math.sin(wx * 0.006 + k * 2) * amp * 0.35;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      };
      ridge(P.hillFar, gy - 96, 26, 0.06, 0.6);
      ridge(shade(P.hillMid, 0.04), gy - 54, 32, 0.14, 2.1);
    },

    drawGround(ctx, W, H, gy, P, t, seasonK) {
      const g = ctx.createLinearGradient(0, gy - 30, 0, H);
      g.addColorStop(0, tint(P.grass, 0.15));
      g.addColorStop(0.28, P.grass);
      g.addColorStop(1, shade(P.grass, 0.22));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      for (let x = 0; x <= W; x += 24) ctx.lineTo(x, gy + Math.sin((x - this.camX * 0.3) * 0.012 + 2) * 5 - 3);
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      // the dusty road ribbon the caravan treads
      const rg = ctx.createLinearGradient(0, gy, 0, gy + 34);
      rg.addColorStop(0, tint(P.soil, 0.12));
      rg.addColorStop(1, shade(P.soil, 0.14));
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.moveTo(0, gy + 2);
      for (let x = 0; x <= W; x += 24) ctx.lineTo(x, gy + 4 + Math.sin((x - this.camX * 0.3) * 0.02) * 2);
      for (let x = W; x >= 0; x -= 24) ctx.lineTo(x, gy + 30 + Math.sin((x + 40) * 0.02) * 2);
      ctx.closePath(); ctx.fill();
    },

    drawTrail(ctx, gy, t) {
      // how far the road has been carried (glows behind the caravan)
      let upto = START_X;
      for (const m of this.marks) {
        const done = this.phase === 'listen' ? m.heard : m.placed;
        if (this.phase === 'done') upto = REST_X;
        else if (done) upto = Math.max(upto, m.x + 60);
      }
      if (this.phase === 'turn' || this.phase === 'done') upto = REST_X;
      for (let wx = START_X; wx <= upto; wx += 64) {
        const x = this.sx(wx);
        if (x < -20 || x > this.W + 20) continue;
        const k = 0.5 + 0.5 * Math.sin(t * 2 + wx * 0.02);
        const h = ctx.createRadialGradient(x, gy + 14, 0, x, gy + 14, 12);
        h.addColorStop(0, alpha('#FFE9A8', 0.4 * k));
        h.addColorStop(1, alpha('#FFE9A8', 0));
        ctx.fillStyle = h; ctx.beginPath(); ctx.arc(x, gy + 14, 12, 0, TAU); ctx.fill();
      }
    },

    // ---- landmarks --------------------------------------------------------
    drawMark(ctx, m, gy, P, t) {
      const x = this.sx(m.x);
      if (x < -260 || x > this.W + 260) return;
      const lit = m.lit;
      if (m.kind === 'gate') this.drawGate(ctx, x, gy, P, t, lit);
      else if (m.kind === 'pass') this.drawPass(ctx, x, gy, P, t, lit);
      else if (m.kind === 'house') this.drawHouse(ctx, x, gy, P, t, lit);
      else if (m.kind === 'garden') this.drawGarden(ctx, x, gy, P, t, lit, m.lantern, m);
      // the landmark's ayah-gem crowns it once it is known
      if (lit > 0.5) {
        const s = this.socketPos(m);
        gem(ctx, s.x, s.y - 6, 9 + (lit - 0.5) * 6, GRAND, t, { phase: m.i * 1.7, glow: 0.5 + lit * 0.5 });
      }
    },

    glow(ctx, x, y, r, k, col) {
      if (k <= 0.01) return;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, alpha(col || '#FFE9A8', 0.5 * k));
      g.addColorStop(1, alpha(col || '#FFE9A8', 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    },

    drawGate(ctx, x, gy, P, t, lit) {
      this.glow(ctx, x, gy - 90, 120, lit, '#FFE9A8');
      const pw = 22, ph = 132, gap = 58;
      const stone = ctx.createLinearGradient(0, gy - ph, 0, gy);
      stone.addColorStop(0, tint(P.stone, 0.2)); stone.addColorStop(1, shade(P.stoneShade, 0.1));
      ctx.fillStyle = stone;
      for (const s of [-1, 1]) {
        GOL.paint.wobblePath(ctx, [[x + s * gap - pw, gy - ph], [x + s * gap + pw, gy - ph], [x + s * gap + pw, gy], [x + s * gap - pw, gy]], 11 + (s + 1) * 3, 3);
        ctx.fill();
      }
      // the arch across the top
      ctx.fillStyle = stone;
      ctx.beginPath();
      ctx.moveTo(x - gap - pw, gy - ph);
      ctx.quadraticCurveTo(x, gy - ph - 54, x + gap + pw, gy - ph);
      ctx.lineTo(x + gap + pw, gy - ph + 16);
      ctx.quadraticCurveTo(x, gy - ph - 30, x - gap - pw, gy - ph + 16);
      ctx.closePath(); ctx.fill();
      // one gold band + the keystone star
      ctx.fillStyle = alpha(P.gold, 0.9);
      ctx.fillRect(x - gap - pw, gy - ph + 20, 2 * (gap + pw), 7);
      GOL.star8(ctx, x, gy - ph - 6, 8 + lit * 2, Math.PI / 8 + t * 0.1, alpha(mix(P.gold, '#FFF6DC', lit), 0.9));
    },

    drawPass(ctx, x, gy, P, t, lit) {
      // two peaks with a cleft the road runs through: snow left, sun right
      const drawPeak = (cx, w, h, coolK, warmK) => {
        const base = mix(P.hillMid, coolK ? '#DDE7EC' : shade(P.hillNear, 0.05), coolK ? 0.5 : 0.2);
        const g = ctx.createLinearGradient(cx, gy - h, cx, gy);
        g.addColorStop(0, coolK ? '#F2F6F8' : tint(P.gold, 0.3));
        g.addColorStop(0.4, base);
        g.addColorStop(1, shade(base, 0.14));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(cx - w, gy);
        ctx.quadraticCurveTo(cx - w * 0.3, gy - h * 0.8, cx, gy - h);
        ctx.quadraticCurveTo(cx + w * 0.3, gy - h * 0.8, cx + w, gy);
        ctx.closePath(); ctx.fill();
        if (coolK) { // snow cap
          ctx.fillStyle = alpha('#FFFFFF', 0.9);
          ctx.beginPath();
          ctx.moveTo(cx - w * 0.34, gy - h * 0.66);
          ctx.quadraticCurveTo(cx, gy - h, cx + w * 0.34, gy - h * 0.66);
          ctx.quadraticCurveTo(cx, gy - h * 0.5, cx - w * 0.34, gy - h * 0.66);
          ctx.closePath(); ctx.fill();
        }
      };
      this.glow(ctx, x, gy - 80, 130, lit * 0.7, '#FFF3D6');
      drawPeak(x - 70, 92, 150, true, false);   // winter side
      drawPeak(x + 74, 96, 138, false, true);    // summer side
      // a warm sun disc resting over the sunny peak
      const sun = 0.6 + 0.4 * Math.sin(t * 1.2);
      this.glow(ctx, x + 96, gy - 150, 44, 0.5 + lit * 0.4, '#FFE6A8');
      ctx.fillStyle = alpha('#FFF0C6', 0.85 * sun); ctx.beginPath(); ctx.arc(x + 96, gy - 150, 12, 0, TAU); ctx.fill();
    },

    drawHouse(ctx, x, gy, P, t, lit) {
      // a small hill mound, then w12's plain noble cube of warm stone
      ctx.fillStyle = shade(P.hillNear, 0.02);
      ctx.beginPath();
      ctx.moveTo(x - 150, gy + 2);
      ctx.quadraticCurveTo(x, gy - 62, x + 150, gy + 2);
      ctx.closePath(); ctx.fill();
      const groundY = gy - 34;         // the cube sits atop the mound
      this.glow(ctx, x, groundY - 60, 120, lit, '#FFE9B8');
      const bw = 116, bh = 96, depth = 26;
      const left = x - bw / 2, top = groundY - bh;
      // right face
      ctx.fillStyle = P.stoneShade || '#BFBCA2';
      ctx.beginPath();
      ctx.moveTo(left + bw, top); ctx.lineTo(left + bw + depth, top - depth * 0.5);
      ctx.lineTo(left + bw + depth, groundY - depth * 0.5); ctx.lineTo(left + bw, groundY);
      ctx.closePath(); ctx.fill();
      // roof
      ctx.fillStyle = P.mist || '#E2E8DC';
      ctx.beginPath();
      ctx.moveTo(left, top); ctx.lineTo(left + depth, top - depth * 0.5);
      ctx.lineTo(left + bw + depth, top - depth * 0.5); ctx.lineTo(left + bw, top);
      ctx.closePath(); ctx.fill();
      // front face
      ctx.fillStyle = P.stone || '#DFDCC8';
      ctx.fillRect(left, top, bw, bh);
      // the single gold band
      ctx.fillStyle = mix(P.gold || '#E8C382', '#FFF6DC', lit * 0.5);
      ctx.fillRect(left, top + bh * 0.17, bw, 8);
      ctx.fillStyle = P.goldDeep || '#C9A050';
      ctx.fillRect(left, top + bh * 0.17 + 8, bw, 2);
      // the sheltering doorway
      const dw = 30, dh = 48, dLeft = x - dw / 2, dTop = groundY - dh;
      ctx.fillStyle = shade(P.stoneDark || '#9C9A82', lit * 0.2);
      ctx.beginPath();
      ctx.moveTo(dLeft, groundY); ctx.lineTo(dLeft, dTop + dw / 2);
      ctx.arc(x, dTop + dw / 2, dw / 2, Math.PI, 0);
      ctx.lineTo(dLeft + dw, groundY); ctx.closePath(); ctx.fill();
      if (lit > 0.3) { this.glow(ctx, x, groundY - 12, 26, lit, '#FFE0A0'); }
    },

    drawGarden(ctx, x, gy, P, t, lit, lantern, m) {
      this.glow(ctx, x, gy - 70, 140, lit * 0.8, '#FFDFA0');
      // a low feast mat
      ctx.fillStyle = alpha(mix(P.gold, '#B5723C', 0.4), 0.8);
      ctx.beginPath(); ctx.ellipse(x, gy - 4, 78, 15, 0, 0, TAU); ctx.fill();
      // four lantern posts; they kindle one by one with the ayah / on bloom
      const posts = 4;
      const litCount = this.phase === 'listen' ? lantern * posts : (m.placed ? posts : 0.4);
      for (let i = 0; i < posts; i++) {
        const px = x - 66 + i * 44;
        ctx.strokeStyle = shade(P.trunk || '#8A6B4F', 0.1); ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(px, gy - 4); ctx.lineTo(px, gy - 66); ctx.stroke();
        const on = clamp(litCount - i, 0, 1);
        this.glow(ctx, px, gy - 74, 26, on, '#FFD98A');
        const lg = ctx.createRadialGradient(px, gy - 74, 1, px, gy - 74, 9);
        lg.addColorStop(0, on > 0.2 ? alpha('#FFF3C4', 0.95) : alpha(P.stone, 0.5));
        lg.addColorStop(1, on > 0.2 ? alpha('#F0B858', 0.6) : alpha(P.stoneShade, 0.4));
        ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(px, gy - 74, 6, 8, 0, 0, TAU); ctx.fill();
      }
    },

    // ---- the caravan ------------------------------------------------------
    drawCaravan(ctx, gy, t) {
      const cx = this.sx(this.caravan.x);
      const moving = this.moving;
      const shimmer = !!(Q && Q.mic && Q.mic.active && Q.mic.speaking);
      // two little ones trail behind the lead
      this.drawCamel(ctx, cx - 78, gy, 0.6, t, moving, 1.9, shimmer);
      this.drawCamel(ctx, cx - 42, gy, 0.72, t, moving, 0.9, shimmer);
      this.drawCamel(ctx, cx, gy, 1.0, t, moving, 0, shimmer);
    },

    drawCamel(ctx, x, gy, s, t, walk, phase, shimmer) {
      const warm = '#CBA877';
      const body = warm, dark = shade(warm, 0.26), lite = tint(warm, 0.3);
      const bob = walk ? Math.abs(Math.sin(t * 7 + phase)) * -2.4 * s : Math.sin(t * 1.4 + phase) * -0.8 * s;
      ctx.save();
      ctx.translate(x, gy + bob);
      // soft ground shadow
      ctx.fillStyle = 'rgba(46,64,50,0.16)';
      ctx.beginPath(); ctx.ellipse(0, 2 - bob, 20 * s, 4.5 * s, 0, 0, TAU); ctx.fill();
      // legs
      ctx.strokeStyle = dark; ctx.lineWidth = 3.4 * s; ctx.lineCap = 'round';
      const feet = [-9, -4, 6, 11];
      for (let i = 0; i < feet.length; i++) {
        const ph = phase + (i % 2 ? Math.PI : 0);
        const sw = walk ? Math.sin(t * 7 + ph) * 3.2 * s : 0;
        ctx.beginPath(); ctx.moveTo(feet[i] * s, -15 * s); ctx.lineTo(feet[i] * s + sw, -bob); ctx.stroke();
      }
      // body
      const bg = ctx.createLinearGradient(0, -30 * s, 0, -12 * s);
      bg.addColorStop(0, lite); bg.addColorStop(1, shade(body, 0.06));
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.ellipse(0, -21 * s, 16 * s, 9.5 * s, 0, 0, TAU); ctx.fill();
      // hump
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.ellipse(-3 * s, -29 * s, 8.5 * s, 7.5 * s, 0, 0, TAU); ctx.fill();
      // neck + head (facing right)
      ctx.strokeStyle = body; ctx.lineWidth = 7 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(10 * s, -24 * s); ctx.quadraticCurveTo(19 * s, -30 * s, 20 * s, -38 * s); ctx.stroke();
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.ellipse(21 * s, -39 * s, 5.5 * s, 4.2 * s, 0.5, 0, TAU); ctx.fill();
      // ear + snout + eye
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(17 * s, -43 * s, 1.8 * s, 2.6 * s, 0.3, 0, TAU); ctx.fill();
      ctx.fillStyle = shade(body, 0.12);
      ctx.beginPath(); ctx.ellipse(25 * s, -37 * s, 3 * s, 2.4 * s, 0.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3E3020';
      ctx.beginPath(); ctx.arc(22 * s, -40 * s, 0.9 * s, 0, TAU); ctx.fill();
      // tail
      ctx.strokeStyle = dark; ctx.lineWidth = 2 * s;
      ctx.beginPath(); ctx.moveTo(-15 * s, -22 * s); ctx.quadraticCurveTo(-20 * s, -16 * s, -18 * s, -10 * s); ctx.stroke();
      // bells beneath the neck — shimmer when someone joins in aloud
      const bk = shimmer ? (0.6 + 0.4 * Math.sin(t * 12 + phase)) : 0.4;
      GOL.star8(ctx, 12 * s, -16 * s, (shimmer ? 2.4 : 1.8) * s, Math.PI / 8, alpha('#F3D28A', bk));
      ctx.restore();
    },

    // ---- floating candidate light ----------------------------------------
    drawLight(ctx, x, y, t, si, pulse, fade) {
      ctx.save();
      ctx.globalAlpha = fade == null ? 1 : fade;
      const breath = 0.85 + 0.15 * Math.sin(t * 2 + si * 1.4);
      const r = 15 * breath * (pulse ? 1.1 + 0.12 * Math.sin(t * 7) : 1);
      if (pulse) {
        ctx.strokeStyle = alpha('#FFE9A8', 0.5 + 0.3 * Math.sin(t * 7));
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, r + 10 + 4 * Math.sin(t * 7), 0, TAU); ctx.stroke();
      }
      const h = ctx.createRadialGradient(x, y, 1, x, y, r * 2.4);
      h.addColorStop(0, alpha('#FFF6DC', 0.55 * breath));
      h.addColorStop(1, alpha('#FFF6DC', 0));
      ctx.fillStyle = h; ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, TAU); ctx.fill();
      const bg = ctx.createRadialGradient(x + r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
      bg.addColorStop(0, '#FFFDF4'); bg.addColorStop(0.6, '#F7ECCB'); bg.addColorStop(1, '#E8D5A0');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      GOL.star8Path(ctx, x, y, r * 0.5, t * 0.5 + si);
      ctx.fillStyle = alpha('#EBC77E', 0.8); ctx.fill();
      ctx.restore();
    },

    // ---- the two-weather sparkle -----------------------------------------
    drawSeasonSparkle(ctx, gy, t) {
      if (!this.ay2) return;
      const pass = this.marks.find((m) => m.kind === 'pass');
      if (!pass) return;
      const x = this.sx(pass.x);
      if (x < -200 || x > this.W + 200) return;
      const ws = Q.words(2);
      if (!ws.length) return;
      const clk = this.ay2.t;
      const inWord = (i) => ws[i] && clk >= ws[i].from && clk <= ws[i].to + 0.15;
      // «الشتاء» — word index 2 — glitters the snowy (left) side
      if (inWord(2)) {
        for (let i = 0; i < 10; i++) {
          const a = i * 2.3 + t * 3;
          const px = x - 70 + Math.cos(a) * 42;
          const py = gy - 70 - ((i * 13 + t * 40) % 90);
          const k = 0.5 + 0.5 * Math.sin(t * 6 + i);
          GOL.star8(ctx, px, py, 2.4 * k, Math.PI / 8, alpha('#FFFFFF', 0.85 * k));
        }
      }
      // «والصيف» — word index 3 — flares the sunny (right) side
      if (inWord(3)) {
        const k = 0.5 + 0.5 * Math.sin(t * 8);
        this.glow(ctx, x + 96, gy - 150, 60 + k * 14, 0.7, '#FFE29A');
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU + t * 0.6;
          GOL.star8(ctx, x + 96 + Math.cos(a) * (26 + k * 6), gy - 150 + Math.sin(a) * (26 + k * 6), 2 + k * 1.5, Math.PI / 8, alpha('#FFF0C6', 0.8 * k));
        }
      }
      // let the clock rest once the ayah's words are past
      if (ws.length && clk > ws[ws.length - 1].to + 1.5 && !pass.playing && this.phase !== 'recognize') this.ay2 = null;
    },

    // ---- the home star ----------------------------------------------------
    drawHome(ctx, t) {
      const b = this.homeBtn || { x: 34, y: 34, r: 24 };
      ctx.save();
      ctx.fillStyle = 'rgba(250,244,224,0.5)';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
      ctx.strokeStyle = alpha('#C89B55', 0.6); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 2, 0, TAU); ctx.stroke();
      GOL.star8(ctx, b.x, b.y, 7, Math.PI / 8 + t * 0.1, alpha('#B98A3E', 0.85));
      ctx.restore();
    }
  };

  GOL.PROTOTYPES[20] = { key: 'caravan-road', name: 'the caravan road', scene: 'caravanRoadLab' };
  GOL.registerScene('caravanRoadLab', lab);
})();
