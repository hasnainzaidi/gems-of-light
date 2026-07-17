// Quraysh learning-loop lab · P21 — Raising the House
//
// Room 2 of QURAYSH-PROTOTYPE-ROOMS.md — a constructive, hands-on building
// paradigm. The child raises the Bayt of ayah 3 course by course, with their
// hands. Each stone carries one PHRASE of one ayah; the wall has one open slot
// at a time, in reading order. The slot sings the ayah from its beginning up to
// the gap and waits; the child finds the stone that continues it. This is the
// room that finally works INSIDE an ayah, at phrase-seam granularity — the
// COMPLETE stage of the progression.
//
// Doctrine (LEARNING-LOOPS-STRATEGY.md), honored by construction:
//  · No malformed Quran. Auditioning a stone plays its phrase ALONE (a real
//    contiguous cut); the wall only ever replays a true prefix (0..placedEnd).
//    Stones never sound in wall-context until correctly placed.
//  · Mistakes raise support, never lower status. A wrong stone hops back in
//    silence — no buzz, no shake, nothing dims. The wall built with maximum
//    help is pixel-identical to the wall built alone.
//  · The mic (if already live) only decorates; it never gates.
//
// Surah 106 phrase-stone split (word indices, 0-based, for QROOMS.playSlice):
//   ayah 1 (2w): [0,0] لإيلاف · [1,1] قريش
//   ayah 2 (4w): [0,0] إيلافهم · [1,1] رحلة · [2,3] الشتاء والصيف
//   ayah 3 (4w): [0,0] فليعبدوا · [1,3] رب هذا البيت
//   ayah 4 (7w): [0,3] الذي أطعمهم من جوع · [4,6] وآمنهم من خوف
//
// Direct: ?lab=21   (add &debug=1 for fast hesitation windows + slot readouts)
(function () {
  const GOL = window.GOL;
  const Q = GOL.QROOMS;
  const TAU = Math.PI * 2;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (v) => v * v * (3 - 2 * v);

  // fx is pure decoration; the headless smoke harness doesn't load engine.js
  // (where makeFx lives), so fall back to a silent stub there.
  const NOFX = { spawn() {}, burst() {}, update() {}, draw() {} };
  const makeFx = () => (GOL.makeFx ? GOL.makeFx() : NOFX);

  // Local rounded rect — the smoke harness loads only art.js, so GOL.roundRect
  // (actors.js) isn't present there. Mirrors its arcTo shape.
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Courses rise bottom→top in ayah order: course 0 (ayah 1) is the foundation,
  // course 3 (ayah 4) crowns the House. Each stone is a [i0,i1] word range.
  const COURSES = [
    { n: 1, stones: [[0, 0], [1, 1]] },
    { n: 2, stones: [[0, 0], [1, 1], [2, 3]] },
    { n: 3, stones: [[0, 0], [1, 3]] },
    { n: 4, stones: [[0, 3], [4, 6]] }
  ];
  const NC = COURSES.length;

  const STONE = {
    base: '#E9DEC2', light: '#F6EED6', dark: '#C4B58F',
    seam: '#D9B877', seamDeep: '#B98A3E', glow: '#FFE9A8'
  };

  // ---- word timing (for driving pacing without waiting on audio onends) ----
  function sliceDur(n, a, b) {
    const ws = Q.words(n);
    if (!ws.length || !ws[a] || !ws[b]) return 1.2;
    return Math.max(0.35, (ws[b].to - ws[a].from) + 0.25);
  }

  const lab = {
    // ------------------------------------------------------------- enter ----
    enter() {
      this.t = 0;
      this.phase = 'build';               // build · courseDone · final · rest
      this.ci = 0;                         // active course index
      this.filled = 0;                     // slots settled in the active course
      this.placed = [];                    // per course: count of settled stones
      for (let c = 0; c < NC; c++) this.placed[c] = 0;

      this.loose = null;                   // pickable stones of the active course
      this.settled = [];                   // { c, j, i0, i1, kindle } all placed
      this.ladder = null;
      this.settle = null;                  // { t, stone, joinAt, joinDur, done }
      this.courseAnim = null;              // { t } course-complete flourish
      this.finale = null;                  // { t, ayah, lanterns }

      this.carry = null;                   // stone being dragged
      this.dragId = null;
      this.dragMoved = false;
      this.lifted = null;                  // tap-lifted stone (tap-slot to place)

      this.audioBusy = false;
      this.audioBusyT = 0;
      this.builder = { pose: 'point', arm: 0, bow: 0, ear: 0 };
      this.fx = makeFx();

      // Return-visit fade: last visit's max support per slot. A slot the child
      // handled well is met with MORE patience this time (support fades across
      // visits — the doctrine's spaced weaning), never with a head start of help.
      this.priorRungs = (Q.load && Q.load('raising-house')) || {};

      this.startCourse(0);
    },
    exit() { if (Q.stopSlice) Q.stopSlice(); this.audioBusy = false; },

    // --------------------------------------------------------- geometry -----
    geom(W, H) {
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
      const groundY = H * 0.74 - sa.b * 0.3;
      const courseH = Math.min(58, H * 0.12);
      const houseW = Math.min(330, W * 0.42);
      const houseCX = clamp(W * 0.605, sa.l + houseW * 0.6 + 120, W - sa.r - houseW * 0.5 - 24);
      const houseLeft = houseCX - houseW / 2;
      // pile of loose stones rests on the ground below the House
      const pileY = groundY + 46;
      return { W, H, sa, groundY, courseH, houseW, houseCX, houseLeft, pileY };
    },
    slotRect(g, c, j) {
      const course = COURSES[c];
      const k = course.stones.length;
      const yb = g.groundY - c * g.courseH;      // bottom edge of the course
      const top = yb - g.courseH;
      const sw = g.houseW / k;
      // reading order 0 sits at the RIGHT end (Arabic reads right→left)
      const x0 = g.houseLeft + (k - 1 - j) * sw;
      return { x: x0 + 2, y: top + 2, w: sw - 4, h: g.courseH - 4, cx: x0 + sw / 2, cy: top + g.courseH / 2 };
    },
    pileSpot(g, spot, count) {
      const spread = count > 1 ? Math.min(g.houseW * 0.62, 150) : 0;
      const x = g.houseCX + (count > 1 ? lerp(-spread, spread, spot / (count - 1)) : 0);
      const y = g.pileY + Math.sin(spot * 1.7) * 6;
      return { x, y };
    },
    stoneSize(g, c) {
      const k = COURSES[c].stones.length;
      return { w: Math.min(g.houseW / k - 8, 96), h: g.courseH * 0.82 };
    },

    // --------------------------------------------------------- course setup -
    startCourse(c) {
      this.ci = c;
      this.filled = 0;
      const course = COURSES[c];
      // the active course's stones become the loose pile, shuffled across spots
      const spots = course.stones.map((_, j) => j);
      for (let i = spots.length - 1; i > 0; i--) {
        const r = Math.floor(Math.random() * (i + 1));
        const tmp = spots[i]; spots[i] = spots[r]; spots[r] = tmp;
      }
      this.loose = course.stones.map((st, j) => ({
        c, j, i0: st[0], i1: st[1], spot: spots[j],
        placed: false, hop: 0, lift: 0, kindle: 0, px: 0, py: 0
      }));
      this.lifted = null;
      this.carry = null;
      this.armSlot();
    },

    slotKey(c, j) { return c + ':' + j; },

    // --------------------------------------------------------- the ladder ---
    // rung 0: run-up (words before the gap) then wait — or, for a course's
    //         first slot, just the glowing socket, nothing to hum yet.
    // rung 1: run-up + the FIRST WORD of the missing phrase.
    // rung 2: run-up + MOST of the phrase, trailing off one word early.
    // rung 3: the correct stone lifts itself and settles, full model plays.
    armSlot() {
      const self = this;
      const c = this.ci, j = this.filled;
      const course = COURSES[c];
      const st = course.stones[j];
      const i0 = st[0], i1 = st[1];
      const n = course.n;
      const prior = this.priorRungs[this.slotKey(c, j)] || 0;
      // a slot handled independently last time is given a longer first breath
      const patience = prior <= 1 ? 1.6 : 0.3;
      const base = GOL.DEBUG ? 2.0 : 4.5;

      const play = (a, b) => {
        const dur = sliceDur(n, a, b);
        self.startBusy(dur);
        Q.playSlice(n, a, b, { onend: () => self.endBusy() });
        if (self.ladder) self.ladder.hold(dur + 0.5);
      };

      this.builder.pose = 'point';
      this.ladder = Q.ladder({
        delays: [base + patience, base, base],
        rungs: [
          () => { if (i0 > 0) play(0, i0 - 1); /* else: silent, expectant socket */ },
          () => play(0, i0),
          () => play(0, Math.max(i0, i1 - 1)),
          () => self.autoPlace()             // last rung: full model + settle
        ],
        onExhausted: () => { /* autoPlace already resolved the slot */ }
      });
      this.ladder.arm();
      Q.log && Q.log('raising-house', 'slot-open', { course: c, slot: j, prior: prior });
    },

    // the correct stone drifts home on its own — the top of the support ladder
    autoPlace() {
      const stone = this.loose && this.loose.find((s) => !s.placed && s.j === this.filled);
      if (stone) { stone.lift = 1; this.resolveSlot(stone, 3, true); }
    },

    // --------------------------------------------------------- resolve ------
    resolveSlot(stone, rung, auto) {
      this.ladder = null;
      this.lifted = null;
      this.carry = null;
      stone.placed = true;
      const c = this.ci, j = stone.j;
      const course = COURSES[c];
      this.placed[c] = j + 1;
      this.filled = j + 1;
      if (GOL.audio) GOL.audio.sfx('place');

      // the immediate correct model: replay the whole ayah SO FAR from the top
      const joinDur = sliceDur(course.n, 0, stone.i1);
      this.settled.push({ c, j, i0: stone.i0, i1: stone.i1, kindle: 0 });
      this.settle = { t: 0, stone: this.settled[this.settled.length - 1],
        joinAt: 0.42, joinDur, played: false, ends: 0.42 + joinDur + 0.6 };

      // honest telemetry + persistence: this slot needed `rung` support
      const key = this.slotKey(c, j);
      this.priorRungs[key] = Math.max(this.priorRungs[key] || 0, rung);
      Q.log && Q.log('raising-house', 'slot-filled', { course: c, slot: j, rung: rung, auto: !!auto });
      Q.save && Q.save('raising-house', this.priorRungs);

      this.fx.burst(this.slotRect(this._g, c, j).cx, this.slotRect(this._g, c, j).cy, STONE.glow, 8);
    },

    // ------------------------------------------------------------- update ---
    update(dt, W, H) {
      this.t += dt;
      const g = this.geom(W, H);
      this._g = g;
      this.fx.update(dt);

      // audio watchdog so a dropped onend can never wedge the room
      if (this.audioBusy) {
        this.audioBusyT += dt;
        if (this.audioBusyT > 16) this.endBusy();
      }
      // rooms must silence the mic while the model sounds (speakers self-trigger)
      if (Q.mic && Q.mic.active) Q.mic.gate = !this.audioBusy;

      // builder pose easing
      const b = this.builder;
      b.bow += ((b.pose === 'bow' ? 1 : 0) - b.bow) * Math.min(1, dt * 6);
      b.ear += ((b.pose === 'ear' ? 1 : 0) - b.ear) * Math.min(1, dt * 6);
      b.arm += ((b.pose === 'point' ? 1 : 0) - b.arm) * Math.min(1, dt * 5);

      // kindle the just-laid stones (mic makes it eager; otherwise it still glows)
      const micLive = Q.mic && Q.mic.active && Q.mic.speaking;
      for (const s of this.settled) {
        const want = (this.settle && this.settle.stone === s && this.settle.played)
          ? (micLive ? 1 : 0.7) : s.kindle;
        s.kindle += (want - s.kindle) * Math.min(1, dt * 3);
      }

      // hop-back easing for wrong offerings
      if (this.loose) for (const s of this.loose) if (s.hop > 0) s.hop = Math.max(0, s.hop - dt * 2.6);

      // ---- phase machines -------------------------------------------------
      if (this.phase === 'build') this.updateBuild(dt, g);
      else if (this.phase === 'courseDone') this.updateCourseDone(dt);
      else if (this.phase === 'final') this.updateFinal(dt);
      else this.updateRest(dt);

      // Noor / audio unlock happen inside input; consume any stray taps so a
      // tap never leaks between phases.
    },

    startBusy(dur) { this.audioBusy = true; this.audioBusyT = 0; this._busyEst = dur; },
    endBusy() { this.audioBusy = false; this.audioBusyT = 0; },

    // ---- BUILD ----------------------------------------------------------
    updateBuild(dt, g) {
      // drive the settle → join-replay → advance sequence
      if (this.settle) {
        this.settle.t += dt;
        if (!this.settle.played && this.settle.t >= this.settle.joinAt) {
          this.settle.played = true;
          this.builder.pose = 'ear';
          this.startBusy(this.settle.joinDur);
          const course = COURSES[this.ci];
          Q.playSlice(course.n, 0, this.settle.stone.i1, { onend: () => this.endBusy() });
        }
        if (this.settle.t >= this.settle.ends) {
          const wasLast = this.filled >= COURSES[this.ci].stones.length;
          this.settle = null;
          if (wasLast) this.beginCourseDone();
          else this.armSlot();
        }
        this.readInput(g, /*allowPick=*/false);
        return;
      }
      // the ladder only breathes while the child is free to act
      if (this.ladder) this.ladder.update(dt);
      this.readInput(g, /*allowPick=*/true);
    },

    beginCourseDone() {
      this.phase = 'courseDone';
      this.courseAnim = { t: 0 };
      this.builder.pose = 'bow';
      const course = COURSES[this.ci];
      this.startBusy(sliceDur(course.n, 0, course.stones[course.stones.length - 1][1]));
      Q.playAyah(course.n, () => this.endBusy());
      Q.log && Q.log('raising-house', 'course-done', { course: this.ci });
      // course-line light: a soft shower of gold along the fresh course
      const g = this._g;
      const yb = g.groundY - this.ci * g.courseH;
      for (let i = 0; i < 10; i++) {
        this.fx.spawn('spark', g.houseLeft + Math.random() * g.houseW, yb - g.courseH, { color: STONE.glow });
      }
    },
    updateCourseDone(dt) {
      this.courseAnim.t += dt;
      this.readInput(this._g, false);
      if (this.courseAnim.t >= 1.9) {
        this.courseAnim = null;
        const next = this.ci + 1;
        if (next < NC) { this.phase = 'build'; this.builder.pose = 'point'; this.startCourse(next); }
        else this.beginFinal();
      }
    },

    beginFinal() {
      this.phase = 'final';
      this.builder.pose = 'bow';
      this.finale = { t: 0, ayah: 0, lanterns: [], glow: 0 };
      const g = this._g;
      for (let i = 0; i < 6; i++) {
        this.finale.lanterns.push({
          x: g.houseLeft + g.houseW * (0.1 + 0.8 * (i / 5)) + (Math.random() - 0.5) * 20,
          y: g.groundY - Math.random() * g.courseH * 0.5, rise: 0, sway: Math.random() * TAU
        });
      }
      this.chainAyah(0);
      Q.log && Q.log('raising-house', 'house-complete', {});
    },
    // chain the whole surah, ayah by ayah, as the closing ceremony
    chainAyah(k) {
      if (k >= NC) { this.finale.ayah = NC; return; }
      this.finale.ayah = k;
      this.startBusy(sliceDur(COURSES[k].n, 0, COURSES[k].stones[COURSES[k].stones.length - 1][1]));
      Q.playAyah(COURSES[k].n, () => { this.endBusy(); if (this.finale) this.chainAyah(k + 1); });
    },
    updateFinal(dt) {
      const f = this.finale;
      f.t += dt;
      f.glow = Math.min(1, f.glow + dt * 0.5);
      for (const L of f.lanterns) { L.rise = Math.min(1, L.rise + dt * 0.28); L.sway += dt; }
      if (Math.random() < dt * 4) {
        const g = this._g;
        this.fx.spawn('mote', g.houseLeft + Math.random() * g.houseW, g.groundY - Math.random() * g.courseH * NC, { color: STONE.glow });
      }
      this.readInput(this._g, false);
      if (f.ayah >= NC && f.t > 3 && !this.audioBusy) this.phase = 'rest';
    },
    updateRest(dt) { this.readInput(this._g, false); },

    // ------------------------------------------------------------- input ----
    // One reader for every phase. `allowPick` gates stone handling so a tap
    // can never grab a stone mid-ceremony; the home star always works.
    readInput(g, allowPick) {
      const In = GOL.Input;
      if (In.taps.length && GOL.audio) GOL.audio.unlock();

      const home = { x: g.sa.l + 40, y: g.sa.t * 0.5 + 34, r: 30 };
      const drag = In.drag;

      // --- carry a stone by drag ---
      if (allowPick && drag) {
        if (this.dragId !== drag.id) {
          this.dragId = drag.id;
          this.dragMoved = false;
          this.carry = this.stoneAt(g, drag.startX, drag.startY);
          if (this.carry) this.lifted = null;
        }
        if (this.carry) {
          this.carry.px = drag.x; this.carry.py = drag.y; this.carry.lift = 1;
          if (GOL.dist(drag.x, drag.y, drag.startX, drag.startY) > 14) this.dragMoved = true;
        }
      } else if (!drag) {
        this.dragId = null;
      }

      // consume taps (we act on releases, p18's proven idiom for draggable scenes)
      for (const tap of In.taps) tap.ui = true;

      // --- a drag that ended without a release record (iOS can drop it) ---
      if (this.carry && !drag && In.releases.length === 0) {
        this.dropCarry(g, this.carry.px, this.carry.py, this.dragMoved);
        this.carry = null;
      }

      for (const rel of In.releases) {
        // home star: leave the lab
        if (GOL.dist(rel.x, rel.y, home.x, home.y) < home.r + 8) {
          if (Q.stopSlice) Q.stopSlice();
          GOL.go('title');
          return;
        }
        if (this.carry) {
          this.dropCarry(g, rel.x, rel.y, this.dragMoved);
          this.carry = null;
          continue;
        }
        if (!allowPick) continue;
        // a stationary tap not on a stone
        const onStone = this.stoneAt(g, rel.x, rel.y);
        if (onStone) { this.audition(onStone); this.lifted = onStone; onStone.lift = 1; continue; }
        // tap on the active slot
        const slot = this.slotRect(g, this.ci, this.filled);
        if (this.filled < COURSES[this.ci].stones.length &&
            GOL.dist(rel.x, rel.y, slot.cx, slot.cy) < Math.max(slot.w, slot.h) * 0.7) {
          if (this.lifted) this.attemptPlace(this.lifted);
          else this.replayPrompt();
          continue;
        }
        // tap in empty space: set the lifted stone gently back down
        if (this.lifted) { this.lifted.lift = 0; this.lifted = null; }
      }
    },

    // the pickable stone under a point (only loose, unplaced ones)
    stoneAt(g, x, y) {
      if (!this.loose) return null;
      const sz = this.stoneSize(g, this.ci);
      for (const s of this.loose) {
        if (s.placed) continue;
        const p = this.pileSpot(g, s.spot, this.loose.length);
        const cx = s.lift > 0.5 && (this.carry === s) ? s.px : p.x;
        const cy = s.lift > 0.5 && (this.carry === s) ? s.py : p.y - s.lift * 14;
        if (Math.abs(x - cx) < sz.w * 0.6 && Math.abs(y - cy) < sz.h * 0.75) return s;
      }
      return null;
    },

    dropCarry(g, x, y, moved) {
      const stone = this.carry;
      stone.lift = 0;
      if (!moved) { this.audition(stone); this.lifted = stone; stone.lift = 1; return; }
      const slot = this.slotRect(g, this.ci, this.filled);
      if (this.filled < COURSES[this.ci].stones.length &&
          GOL.dist(x, y, slot.cx, slot.cy) < Math.max(slot.w, slot.h) * 0.85) {
        this.attemptPlace(stone);
      } else {
        stone.hop = 1; // the quiet neutral return — no sound, nothing dims
      }
    },

    attemptPlace(stone) {
      if (stone.j === this.filled) {
        const rung = this.ladder ? Math.max(0, this.ladder.rung) : 0;
        if (this.ladder) this.ladder.answer();
        this.resolveSlot(stone, rung, false);
      } else {
        stone.hop = 1;                 // wrong stone: the slot won't grip it
        if (this.lifted === stone) { this.lifted = null; }
      }
    },

    // auditioning ALWAYS plays the phrase alone — a real fragment, never a wall
    audition(stone) {
      const n = COURSES[stone.c].n;
      const dur = sliceDur(n, stone.i0, stone.i1);
      this.startBusy(dur);
      Q.playSlice(n, stone.i0, stone.i1, { onend: () => this.endBusy() });
      if (this.ladder) this.ladder.hold(dur + 0.3);
      Q.log && Q.log('raising-house', 'audition', { course: stone.c, slot: stone.j });
    },
    // tapping the slot with empty hands re-sings the run-up (rung 0)
    replayPrompt() {
      if (!this.ladder) return;
      const c = this.ci, j = this.filled;
      const i0 = COURSES[c].stones[j][0];
      if (i0 > 0) {
        const dur = sliceDur(COURSES[c].n, 0, i0 - 1);
        this.startBusy(dur);
        Q.playSlice(COURSES[c].n, 0, i0 - 1, { onend: () => this.endBusy() });
        this.ladder.hold(dur + 0.5);
      }
    },

    // =============================================================== draw ===
    draw(ctx, W, H) {
      const g = this.geom(W, H); this._g = g;
      this.drawScene(ctx, g);
      this.drawHouse(ctx, g);
      this.drawBuilder(ctx, g);
      if (this.phase === 'build') this.drawLoose(ctx, g);
      if (this.phase === 'final') this.drawFinal(ctx, g);
      this.fx.draw(ctx);
      // Noor rests over the pile while the child is choosing
      if (this.phase === 'build' && !this.settle && GOL.drawFirefly) {
        const slot = this.slotRect(g, this.ci, this.filled);
        GOL.drawFirefly(ctx, slot.cx + 34 + Math.cos(this.t * 0.9) * 8, slot.cy - 20 + Math.sin(this.t * 1.6) * 8, this.t, 1.0);
      }
      if (GOL.drawButton) GOL.drawButton(ctx, g.sa.l + 40, g.sa.t * 0.5 + 34, 22, 'back', { alpha: 0.78 });
      GOL.drawVignette(ctx, W, H, 0.16);
      if (GOL.DEBUG) this.drawDebug(ctx, g);
    },

    // hilltop at a warm hour — sky, distant ridges, the foundation ground
    drawScene(ctx, g) {
      const W = g.W, H = g.H;
      const P = GOL.PALETTES.quraysh;
      GOL.drawSky(ctx, W, H, P, this.t, 0);
      GOL.drawRays(ctx, W, H, P, this.t);
      // two soft ridges below the sun
      for (let r = 0; r < 2; r++) {
        const hy = H * (0.5 + r * 0.08);
        const col = r === 0 ? P.hillFar : P.hillMid;
        ctx.fillStyle = GOL.color.alpha(col, 0.9);
        ctx.beginPath();
        ctx.moveTo(0, hy + 40);
        for (let x = 0; x <= W; x += 26) ctx.lineTo(x, hy + Math.sin(x * 0.006 + r * 2) * 22 - r * 6);
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      }
      // the hilltop the House sits on
      const gy = g.groundY;
      const gg = ctx.createLinearGradient(0, gy - 30, 0, H);
      gg.addColorStop(0, GOL.color.tint(P.grass, 0.12));
      gg.addColorStop(0.4, P.grass);
      gg.addColorStop(1, GOL.color.shade(P.grass, 0.28));
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.moveTo(0, gy + 26);
      ctx.quadraticCurveTo(W * 0.5, gy - 30, W, gy + 26);
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      // the packed-earth foundation pad under the wall
      const padW = g.houseW + 46, padX = g.houseCX - padW / 2, padY = gy - 6;
      ctx.fillStyle = GOL.color.alpha(P.soilDark || '#A08159', 0.5);
      ctx.beginPath(); ctx.ellipse(g.houseCX, padY + 14, padW / 2, 20, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = P.soil || '#CDAB7C';
      rr(ctx, padX, padY, padW, 18, 6); ctx.fill();
    },

    // one warm-stone block, gouache-brushed, with an optional gold seam
    drawStoneBlock(ctx, x, y, w, h, opts) {
      opts = opts || {};
      const sq = opts.settle == null ? 1 : opts.settle;   // 0..1 settling squash
      const sy = lerp(0.7, 1, ease(sq));
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, sy);
      const gl = opts.glow || 0;
      if (gl > 0.01) {
        const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, w * 0.9);
        halo.addColorStop(0, GOL.color.alpha(STONE.glow, 0.5 * gl));
        halo.addColorStop(1, GOL.color.alpha(STONE.glow, 0));
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(0, 0, w * 0.9, 0, TAU); ctx.fill();
      }
      const body = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      body.addColorStop(0, GOL.color.tint(STONE.light, gl * 0.4));
      body.addColorStop(0.5, STONE.base);
      body.addColorStop(1, STONE.dark);
      ctx.fillStyle = body;
      rr(ctx, -w / 2, -h / 2, w, h, Math.min(9, h * 0.24)); ctx.fill();
      // top-right catch of light (sun in the east)
      ctx.fillStyle = GOL.color.alpha(STONE.light, 0.55);
      rr(ctx, -w / 2 + 3, -h / 2 + 3, w - 6, h * 0.26, 5); ctx.fill();
      // a quiet gold seam across the stone's middle
      ctx.strokeStyle = GOL.color.alpha(STONE.seam, 0.7 + gl * 0.3);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-w / 2 + 6, 2); ctx.lineTo(w / 2 - 6, 2); ctx.stroke();
      ctx.strokeStyle = GOL.color.alpha(STONE.seamDeep, 0.35);
      ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-w / 2 + 6, 4); ctx.lineTo(w / 2 - 6, 4); ctx.stroke();
      // the inner-light kindle after a stone is laid
      if (gl > 0.4) GOL.star8(ctx, 0, 0, 4 + gl * 2, this.t * 0.6, GOL.color.alpha('#FFF6DC', gl * 0.8));
      ctx.restore();
    },

    // the rising wall: settled courses, the active glowing socket, empty gaps
    drawHouse(ctx, g) {
      const built = this.phase === 'final' ? NC : this.ci + 1;
      // draw courses bottom→top so upper stones overlap lower ones
      for (let c = 0; c < built; c++) {
        const course = COURSES[c];
        for (let j = 0; j < course.stones.length; j++) {
          const rect = this.slotRect(g, c, j);
          const isPlaced = j < this.placed[c];
          if (isPlaced) {
            const s = this.settled.find((z) => z.c === c && z.j === j);
            let settleK = 1;
            if (this.settle && this.settle.stone === s) settleK = clamp(this.settle.t / this.settle.joinAt, 0, 1);
            const houseGlow = this.phase === 'final' ? this.finale.glow * (0.4 + 0.2 * Math.sin(this.t * 2 + c)) : 0;
            this.drawStoneBlock(ctx, rect.cx, rect.cy, rect.w, rect.h,
              { settle: settleK, glow: Math.max(houseGlow, s ? s.kindle * 0.7 : 0) });
          } else if (c === this.ci && j === this.filled && this.phase === 'build') {
            this.drawSocket(ctx, rect, true);
          } else if (c === this.ci) {
            this.drawSocket(ctx, rect, false);   // gaps still to come this course
          }
        }
        // course-line: a gold rule that lights when the course completes
        if (this.placed[c] >= course.stones.length) {
          const yb = g.groundY - c * g.courseH - g.courseH;
          const fresh = this.phase === 'courseDone' && c === this.ci;
          const a = fresh ? 0.4 + 0.5 * Math.sin(this.courseAnim.t * 5) : 0.4;
          ctx.strokeStyle = GOL.color.alpha(STONE.seam, a);
          ctx.lineWidth = fresh ? 3 : 2;
          ctx.beginPath(); ctx.moveTo(g.houseLeft, yb); ctx.lineTo(g.houseLeft + g.houseW, yb); ctx.stroke();
        }
      }
    },

    // an empty slot: a recessed socket; active → a breathing gold invitation
    drawSocket(ctx, rect, active) {
      ctx.save();
      ctx.fillStyle = 'rgba(46,44,36,0.35)';
      rr(ctx, rect.x, rect.y, rect.w, rect.h, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(46,44,36,0.4)';
      ctx.lineWidth = 1.5; rr(ctx, rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4, 6); ctx.stroke();
      if (active) {
        const p = 0.6 + 0.4 * Math.sin(this.t * 2.4);
        const glow = ctx.createRadialGradient(rect.cx, rect.cy, 2, rect.cx, rect.cy, rect.w * 0.7);
        glow.addColorStop(0, GOL.color.alpha(STONE.glow, 0.28 * p));
        glow.addColorStop(1, GOL.color.alpha(STONE.glow, 0));
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(rect.cx, rect.cy, rect.w * 0.7, 0, TAU); ctx.fill();
        GOL.star8Path(ctx, rect.cx, rect.cy, 7 + p * 2, Math.PI / 8);
        ctx.fillStyle = GOL.color.alpha('#F0C878', 0.3 + p * 0.3); ctx.fill();
        ctx.strokeStyle = GOL.color.alpha(STONE.seamDeep, 0.85); ctx.lineWidth = 2;
        rr(ctx, rect.x, rect.y, rect.w, rect.h, 7); ctx.stroke();
      }
      ctx.restore();
    },

    // the loose stones waiting in the pile (lifted / carried ones ride higher)
    drawLoose(ctx, g) {
      if (!this.loose) return;
      const sz = this.stoneSize(g, this.ci);
      for (const s of this.loose) {
        if (s.placed) continue;
        const p = this.pileSpot(g, s.spot, this.loose.length);
        let x = p.x, y = p.y;
        if (this.carry === s) { x = s.px; y = s.py; }
        else {
          y -= s.lift * 14;
          if (s.hop > 0) { const k = Math.sin(s.hop * Math.PI); y -= k * 22; x += Math.sin(this.t * 20) * k * 3; }
        }
        // resting shadow
        ctx.fillStyle = 'rgba(46,44,36,0.22)';
        ctx.beginPath(); ctx.ellipse(p.x, p.y + sz.h * 0.5, sz.w * 0.5, 6, 0, 0, TAU); ctx.fill();
        const isNext = s.j === this.filled;
        const glow = (this.carry === s || s.lift > 0.5) ? 0.6 : (isNext ? 0.18 + 0.12 * Math.sin(this.t * 2 + s.spot) : 0.08);
        this.drawStoneBlock(ctx, x, y, sz.w, sz.h, { glow });
      }
    },

    // a soft procedural master-builder: robe body, round head, one working arm.
    // Three poses — point-at-slot, delighted bow, ear-cup — eased in update.
    drawBuilder(ctx, g) {
      const b = this.builder;
      const bx = g.houseLeft - Math.min(96, g.houseW * 0.32);
      const feetY = g.groundY + 2;
      const bow = b.bow, ear = b.ear;
      const lean = bow * 0.18;
      ctx.save();
      ctx.translate(bx, feetY);
      ctx.rotate(lean);
      // ground shadow
      ctx.fillStyle = 'rgba(46,44,36,0.2)';
      ctx.beginPath(); ctx.ellipse(0, 2, 30, 8, 0, 0, TAU); ctx.fill();
      // robe
      const robe = ctx.createLinearGradient(0, -84, 0, 0);
      robe.addColorStop(0, '#C9A6D8');
      robe.addColorStop(1, '#8E6BA8');
      ctx.fillStyle = robe;
      ctx.beginPath();
      ctx.moveTo(-26, 0); ctx.quadraticCurveTo(-20, -60, -12, -74);
      ctx.quadraticCurveTo(0, -84, 12, -74);
      ctx.quadraticCurveTo(20, -60, 26, 0);
      ctx.closePath(); ctx.fill();
      // a warm sash
      ctx.strokeStyle = GOL.color.alpha('#E8C382', 0.9); ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-18, -34); ctx.quadraticCurveTo(0, -26, 18, -38); ctx.stroke();
      // head
      const headY = -92 - bow * 4;
      ctx.fillStyle = '#E8C9A0';
      ctx.beginPath(); ctx.arc(0, headY, 14, 0, TAU); ctx.fill();
      // simple head-wrap
      ctx.fillStyle = '#B99BC9';
      ctx.beginPath(); ctx.arc(0, headY - 2, 14, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
      ctx.fillRect(-14, headY - 4, 28, 4);
      // arms by pose
      ctx.strokeStyle = '#B388C4'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      const slot = this.slotRect(g, Math.min(this.ci, NC - 1), Math.min(this.filled, COURSES[Math.min(this.ci, NC - 1)].stones.length - 1));
      if (ear > 0.4) {
        // ear-cup: hand rises to the head
        ctx.beginPath(); ctx.moveTo(8, -60); ctx.quadraticCurveTo(20, -78, 12, headY + 2); ctx.stroke();
        ctx.fillStyle = '#E8C9A0'; ctx.beginPath(); ctx.arc(12, headY + 2, 5, 0, TAU); ctx.fill();
      } else if (bow > 0.4) {
        // bow: both arms sweep low and open
        ctx.beginPath(); ctx.moveTo(-14, -58); ctx.quadraticCurveTo(-26, -30, -18, -6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(14, -58); ctx.quadraticCurveTo(26, -30, 18, -6); ctx.stroke();
      } else {
        // point: the working arm reaches toward the active socket
        const tx = clamp((slot.cx - bx) * 0.16, 10, 40);
        const ty = clamp((slot.cy - feetY) * 0.5, -70, -20) * b.arm - 46 * (1 - b.arm);
        ctx.beginPath(); ctx.moveTo(10, -58); ctx.quadraticCurveTo(tx * 0.7, -66, tx, ty); ctx.stroke();
        ctx.fillStyle = '#E8C9A0'; ctx.beginPath(); ctx.arc(tx, ty, 5, 0, TAU); ctx.fill();
        // resting arm
        ctx.strokeStyle = '#B388C4';
        ctx.beginPath(); ctx.moveTo(-12, -58); ctx.quadraticCurveTo(-20, -34, -14, -10); ctx.stroke();
      }
      ctx.restore();
    },

    // the closing ceremony: lanterns rise around the finished, inwardly-lit House
    drawFinal(ctx, g) {
      const f = this.finale;
      for (const L of f.lanterns) {
        const y = L.y - L.rise * (g.courseH * NC + 40) + Math.sin(L.sway) * 6;
        const x = L.x + Math.cos(L.sway * 0.7) * 8;
        const a = 0.5 + 0.5 * Math.sin(this.t * 3 + L.sway);
        const glow = ctx.createRadialGradient(x, y, 1, x, y, 20);
        glow.addColorStop(0, GOL.color.alpha('#FFE9A8', 0.55 * a));
        glow.addColorStop(1, GOL.color.alpha('#FFE9A8', 0));
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 20, 0, TAU); ctx.fill();
        ctx.fillStyle = '#FFF6DC'; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill();
        ctx.strokeStyle = GOL.color.alpha('#C9A050', 0.7); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x, y - 4); ctx.stroke();
      }
    },

    drawDebug(ctx, g) {
      const lines = [
        'phase=' + this.phase + ' course=' + this.ci + ' filled=' + this.filled,
        'busy=' + this.audioBusy + ' rung=' + (this.ladder ? this.ladder.rung : '-') +
          ' lifted=' + (this.lifted ? this.lifted.j : '-'),
        'priorRungs=' + JSON.stringify(this.priorRungs)
      ];
      lines.forEach((s, i) => GOL.text(ctx, s, g.sa.l + 12, g.H - 44 + i * 14,
        { size: 11, weight: '600', color: 'rgba(255,255,255,0.6)', align: 'left', shadow: false }));
    }
  };

  GOL.PROTOTYPES[21] = { key: 'raising-house', name: 'raising the house', scene: 'raisingHouseLab' };
  GOL.registerScene('raisingHouseLab', lab);
})();
