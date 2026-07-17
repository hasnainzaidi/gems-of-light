// Quraysh learning-loop lab · P23 — The Night Watch
//
// Room 4 of the Quraysh rooms (spec: v3/QURAYSH-PROTOTYPE-ROOMS.md). The
// ROLE REVERSAL room: everywhere else the game recites and the child
// performs — here the GAME performs (in sequence only) and the child
// MONITORS. A night camp, a low fire, a sleepy elder, and a string of four
// lanterns (lantern n = ayah n). The caravan sings its night-song; some
// nights the song STALLS (an ayah repeats, the next lantern stays dark) or
// SKIPS (a lantern is passed over dark while the song jumps ahead). The
// child's single job is the night watch: tap the lantern that SHOULD sing.
//
// Doctrine held by construction: NO malformed Qur'an ever. The only faults
// are REPEAT and SKIP of perfectly-recorded ayaat — both built by chaining
// QROOMS.playAyah's onend ourselves. A "wrong" tap only ever plays more
// correct Qur'an. No failure state exists: every watch ends with the whole
// line lit. Deliberately mic-free.
//
// Pure scene lab. Direct: ?lab=23
(function () {
  const GOL = window.GOL;
  const Q = GOL.QROOMS;
  const TAU = Math.PI * 2;
  const alpha = GOL.color.alpha;
  const AYAHS = 4;

  // ---- local math (engine.js helpers aren't loaded in the smoke harness) --
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (v) => v * v * (3 - 2 * v);
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

  // The session's watches. Ordered gentlest → richer: a maximally-legible
  // repeat first, then a skip, then the same two faults deeper in the line.
  //   type 'repeat' at p: ayahs 1..p sound (lanterns kindle), then ayah p
  //     sounds AGAIN and lantern p+1 stays dark. Target = p+1.
  //   type 'skip'   at p: ayahs 1..p-1 sound, ayah p is skipped (lantern p
  //     dark), the song jumps to p+1. Target = p.
  // Either way the child taps a DARK lantern; the repair replays from there.
  const WATCHES = [
    { type: 'repeat', at: 2 },
    { type: 'skip', at: 2 },
    { type: 'repeat', at: 3 },
    { type: 'skip', at: 3 }
  ];

  // ---------------------------------------------------------- geometry -----
  function safeRect(W, H) {
    const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
    return { l: sa.l, r: W - sa.r, t: sa.t * 0.5, b: H - sa.b * 0.5 };
  }
  // The two poles the lantern string hangs between.
  function poles(W, H) {
    const q = safeRect(W, H);
    const inset = Math.max(64, W * 0.12);
    return { lx: q.l + inset, rx: q.r - inset, topY: H * 0.20 };
  }
  // Lantern i (0..3) hangs from the string with a gentle catenary sag.
  function lanternPos(W, H, i) {
    const p = poles(W, H);
    const k = i / (AYAHS - 1);
    const x = lerp(p.lx, p.rx, k);
    const y = p.topY + 34 + Math.sin(k * Math.PI) * 20;
    return { x, y };
  }
  function fireCenter(W, H) { return { x: W * 0.5, y: H * 0.80 }; }
  function elderPos(W, H) { return { x: W * 0.5 - Math.max(78, W * 0.14), y: H * 0.74 }; }
  // A dozing singer sits under each lantern.
  function singerPos(W, H, i) { const l = lanternPos(W, H, i); return { x: l.x, y: H * 0.60 }; }
  function backStar(W, H) { const q = safeRect(W, H); return { x: q.l + 34, y: q.t + 30, r: 26 }; }

  const lab = {
    // ---------------------------------------------------------- lifecycle --
    enter(params) {
      this.t = 0;
      this.chainId = 0;
      this.wait = null;          // { t, cb } — the single breath/beat timer
      this.audioGuard = null;    // { id, t, cb } — force-advance if audio is silent
      this.ladderM = null;

      this.lit = [false, false, false, false];
      this.kindleT = [0, 0, 0, 0];
      this.flickT = [0, 0, 0, 0];
      this.sounding = 0;         // ayah currently sounding (0 = silence)
      this.soundT = 0;

      this.watchI = -1;
      this.faultType = null; this.faultAt = 0;
      this.target = 0; this.stalled = 0;
      this.beats = []; this.beatI = 0; this.calI = 0;
      this.faultStartT = 0;

      this.sway = 0;             // rung 1: dark target lantern sways
      this.pulseRhythm = false;  // rung 2: dark target pulses in rhythm
      this.startleT = 0; this.startleLantern = 0;

      this.elderPose = 'sleep';  // sleep | hmm | reach | handover | deepNod | watch
      this.hmmT = 0;
      this.hasStaff = false; this.staffK = 0;

      this.fireCalm = 0;         // 0 lively .. 1 settled (session end)
      this.introT = 0;

      // Later-visit model: after a first session, faults arrive after only
      // the OPENING PHRASE of each pre-fault ayah — a faster internal model.
      const saved = (Q && Q.load && Q.load('night-watch')) || null;
      this.visits = (saved && saved.visits) || 0;
      this.openingCue = this.visits >= 1;

      this.phase = 'intro';
      this.setWait(1.3, () => this.startCalibration());
    },

    exit() {
      this.chainId++;
      this.wait = null; this.audioGuard = null;
      if (Q && Q.stopSlice) Q.stopSlice();
      if (GOL.audio && GOL.audio.stopRecitation) GOL.audio.stopRecitation();
    },

    // ---------------------------------------------------------- helpers ----
    setWait(sec, cb) { this.wait = { t: sec, cb }; },

    kindle(n) {
      if (!this.lit[n - 1]) { this.lit[n - 1] = true; if (GOL.audio) GOL.audio.sfx('bloom'); }
      this.kindleT[n - 1] = 1;
    },
    flick(n) { this.flickT[n - 1] = 1; },

    // The single audio entry point. Chains onend ourselves; a watchdog
    // force-advances if the recording never reports back (muted / offline /
    // a clipped slice), so the watch can never wedge and never double-fire.
    play(n, cb, useCue) {
      const id = ++this.chainId;
      this.sounding = n; this.soundT = 0;
      let fired = false;
      const done = () => {
        if (fired || id !== this.chainId) return;
        fired = true;
        if (this.audioGuard && this.audioGuard.id === id) this.audioGuard = null;
        if (this.sounding === n) this.sounding = 0;
        if (cb) cb();
      };
      const cue = useCue && this.openingCue;
      if (cue) Q.openingPhrase(n, { onend: done });
      else Q.playAyah(n, done);
      this.audioGuard = { id, t: cue ? 3.4 : 7.5, cb: done };
    },

    saveRung(n, rung) {
      if (!Q || !Q.save) return;
      const saved = (Q.load && Q.load('night-watch')) || {};
      saved.visits = this.visits;
      saved.rungs = saved.rungs || {};
      const key = this.faultType + '@' + this.faultAt;
      // Next visit each fault starts one rung less supported (remembered here,
      // read back by future tuning). Keep the gentlest (lowest) seen.
      saved.rungs[key] = Math.min(saved.rungs[key] == null ? 9 : saved.rungs[key], rung);
      Q.save('night-watch', saved);
    },

    // ------------------------------------------------------- calibration ---
    // One clean, correct performance — pure LISTEN, every lantern kindling
    // in order. Then the elder hands over the staff.
    startCalibration() {
      this.phase = 'calibration';
      this.lit = [false, false, false, false];
      this.calI = 0;
      this.elderPose = 'watch';
      this.calStep();
    },
    calStep() {
      if (this.calI >= AYAHS) { this.enterHandover(); return; }
      const n = this.calI + 1;
      this.kindle(n);
      this.play(n, () => { this.calI++; this.setWait(0.35, () => this.calStep()); });
    },

    enterHandover() {
      this.phase = 'handover';
      this.elderPose = 'handover';
      this.staffK = 0;
      if (GOL.audio) GOL.audio.sfx('nearby');
      this.setWait(1.9, () => {
        this.hasStaff = true;
        this.elderPose = 'sleep';
        if (GOL.audio) GOL.audio.sfx('place');
        this.watchI = 0;
        this.startWatch(0);
      });
    },

    // ---------------------------------------------------------- a watch ----
    startWatch(w) {
      const spec = WATCHES[w];
      this.faultType = spec.type; this.faultAt = spec.at;
      this.lit = [false, false, false, false];
      this.sway = 0; this.pulseRhythm = false;
      this.elderPose = 'sleep';

      const beats = [];
      if (spec.type === 'repeat') {
        for (let n = 1; n <= spec.at; n++) beats.push(n);
        this.stalled = spec.at; this.target = spec.at + 1;
      } else { // skip
        for (let n = 1; n < spec.at; n++) beats.push(n);
        beats.push(spec.at + 1);          // the song jumps ahead over the gap
        this.stalled = spec.at + 1; this.target = spec.at;
      }
      this.beats = beats; this.beatI = 0;
      this.phase = 'playback';
      this.playBeat();
    },
    playBeat() {
      if (this.beatI >= this.beats.length) { this.enterWaiting(); return; }
      const n = this.beats[this.beatI];
      this.kindle(n);                      // the lantern kindles as its ayah sounds
      this.play(n, () => { this.beatI++; this.setWait(0.3, () => this.playBeat()); }, true);
    },

    enterWaiting() {
      this.phase = 'waiting';
      this.faultStartT = this.t;
      this.armLadder();
      this.loopStalled();                  // the song gently loops the stalled ayah
    },
    loopStalled() {
      if (this.phase !== 'waiting') return;
      this.flick(this.stalled);            // the lit lantern re-flickers as it re-sounds
      this.play(this.stalled, () => {
        if (this.phase !== 'waiting') return;
        this.setWait(1.2, () => this.loopStalled()); // a breath between
      }, true);
    },

    // The gentle-support ladder while a fault sits unnoticed. Scenic rungs:
    //   0 bare — the stall just sits (loop already running)
    //   1 the dark target lantern sways (a wordless first-word cue)
    //   2 the elder's questioning "hmm" + the dark lantern pulses in rhythm
    //   exhausted → the elder reaches over and taps it himself (full model)
    armLadder() {
      const self = this;
      this.ladderM = Q.ladder({
        delays: [4.5, 4.5, 5.0],
        rungs: [
          function () { /* bare prompt */ },
          function () { self.sway = 1; if (GOL.audio) GOL.audio.sfx('drift'); },
          function () { self.pulseRhythm = true; self.elderPose = 'hmm'; self.hmmT = 1; if (GOL.audio) GOL.audio.sfx('hint'); }
        ],
        onExhausted: function () { self.elderRepair(); }
      });
      this.ladderM.arm();
    },

    resolveByChild() {
      const rung = this.ladderM ? Math.max(0, this.ladderM.rung) : 0;
      if (this.ladderM) this.ladderM.answer();
      Q.log('night-watch', 'fault-detected', {
        watch: this.watchI, type: this.faultType, at: this.faultAt,
        rung: rung, latency: +(this.t - this.faultStartT).toFixed(2), byElder: false
      });
      this.saveRung(this.watchI, rung);
      this.beginRepair(this.target);
    },
    elderRepair() {
      if (this.phase !== 'waiting') return;
      Q.log('night-watch', 'fault-detected', {
        watch: this.watchI, type: this.faultType, at: this.faultAt,
        rung: 3, latency: +(this.t - this.faultStartT).toFixed(2), byElder: true
      });
      this.saveRung(this.watchI, 3);
      this.phase = 'repair';
      this.chainId++;                      // silence the stalled loop
      this.wait = null; this.audioGuard = null;
      this.sway = 0; this.pulseRhythm = false;
      this.elderPose = 'reach';
      this.setWait(0.95, () => this.beginRepair(this.target));
    },

    // The song resumes correctly from the target ayah through to completion.
    beginRepair(t) {
      this.phase = 'repair';
      this.wait = null;
      this.sway = 0; this.pulseRhythm = false;
      if (this.ladderM) this.ladderM.cancel();
      this.startleT = 1; this.startleLantern = t; // the sleepy singer startles awake
      if (GOL.audio) GOL.audio.sfx('yourTurn');
      this.repairFrom(t);
    },
    repairFrom(n) {
      this.kindle(n);
      this.play(n, () => {
        if (n < AYAHS) this.setWait(0.32, () => this.repairFrom(n + 1));
        else this.completeWatch();
      });
    },
    completeWatch() {
      this.elderPose = 'watch';
      this.watchI++;
      if (this.watchI >= WATCHES.length) this.setWait(1.5, () => this.enterSessionEnd());
      else this.setWait(1.5, () => this.startWatch(this.watchI));
    },

    enterSessionEnd() {
      this.phase = 'sessionEnd';
      this.lit = [true, true, true, true];
      this.elderPose = 'deepNod';
      this.visits += 1;
      const saved = (Q.load && Q.load('night-watch')) || {};
      saved.visits = this.visits;
      saved.rungs = saved.rungs || {};
      Q.save('night-watch', saved);
      Q.log('night-watch', 'session-end', { watches: WATCHES.length, visits: this.visits });
      if (GOL.audio) GOL.audio.sfx('praise');
    },

    // ------------------------------------------------------------ update ---
    update(dt, W, H) {
      this.t += dt;
      this.soundT += dt;
      this.introT += dt;
      for (let i = 0; i < AYAHS; i++) {
        this.kindleT[i] = Math.max(0, this.kindleT[i] - dt * 2.2);
        this.flickT[i] = Math.max(0, this.flickT[i] - dt * 2.6);
      }
      this.startleT = Math.max(0, this.startleT - dt * 1.5);
      this.hmmT = Math.max(0, this.hmmT - dt * 0.8);
      if (this.phase === 'handover') this.staffK = Math.min(1, this.staffK + dt * 0.7);
      if (this.phase === 'sessionEnd') this.fireCalm = Math.min(1, this.fireCalm + dt * 0.5);
      else this.fireCalm = Math.max(0, this.fireCalm - dt * 0.5);

      // audio watchdog — advances even in silence, guarded against double-fire
      if (this.audioGuard) {
        this.audioGuard.t -= dt;
        if (this.audioGuard.t <= 0) { const g = this.audioGuard; this.audioGuard = null; g.cb(); }
      }
      // the single breath/beat sequencer
      if (this.wait) {
        this.wait.t -= dt;
        if (this.wait.t <= 0) { const cb = this.wait.cb; this.wait = null; cb(); }
      }
      // the gentle-support ladder only escalates while a fault sits waiting
      if (this.phase === 'waiting' && this.ladderM) this.ladderM.update(dt);

      this.handleInput(W, H);
    },

    handleInput(W, H) {
      const back = backStar(W, H);
      for (const tap of GOL.Input.taps) {
        if (tap.ui) continue;
        if (GOL.audio && GOL.audio.unlock) GOL.audio.unlock();

        if (dist(tap.x, tap.y, back.x, back.y) < back.r + 12) {
          tap.ui = true; GOL.go('title'); return;
        }

        if (this.phase === 'sessionEnd') {
          tap.ui = true; GOL.go('title'); return;
        }

        if (this.phase !== 'waiting') { tap.ui = true; continue; }

        // The whole watch turns on ONE gesture: tap the lantern that should sing.
        let hit = -1;
        for (let i = 0; i < AYAHS; i++) {
          const l = lanternPos(W, H, i);
          if (dist(tap.x, tap.y, l.x, l.y) < 44) { hit = i; break; }
        }
        if (hit < 0) { continue; }
        tap.ui = true;
        if (hit === this.target - 1) {
          this.resolveByChild();
        } else {
          // A "wrong" tap is never punished — that lantern just replays its
          // own ayah (more correct Qur'an, and it disambiguates the order),
          // then the stalled loop quietly resumes.
          if (GOL.audio) GOL.audio.sfx('tap');
          this.wait = null;                // drop any pending loop-breath timer
          this.flick(hit + 1);
          this.play(hit + 1, () => {
            if (this.phase === 'waiting') this.setWait(0.7, () => this.loopStalled());
          });
        }
        return;
      }
    },

    // ============================================================= DRAW ====
    draw(ctx, W, H) {
      const t = this.t;
      this.drawNight(ctx, W, H, t);
      this.drawDunes(ctx, W, H, t);
      this.drawGround(ctx, W, H);
      this.drawTents(ctx, W, H, t);
      this.drawFire(ctx, W, H, t);
      this.drawElder(ctx, W, H, t);
      for (let i = 0; i < AYAHS; i++) this.drawSinger(ctx, W, H, i, t);
      this.drawString(ctx, W, H, t);
      for (let i = 0; i < AYAHS; i++) this.drawLantern(ctx, W, H, i, t);
      if (this.phase === 'handover' || this.hasStaff) this.drawStaff(ctx, W, H, t);
      this.drawBack(ctx, W, H, t);
      GOL.drawVignette(ctx, W, H, 0.26);

      if (GOL.DEBUG) {
        GOL.text(ctx, this.phase + ' · watch ' + (this.watchI + 1) + '/' + WATCHES.length +
          ' · ' + (this.faultType || '-') + '@' + this.faultAt +
          ' · target ' + this.target + ' · rung ' + (this.ladderM ? this.ladderM.rung : '-') +
          (this.openingCue ? ' · cue' : ''),
          W / 2, H - 12, { size: 11, weight: '700', color: 'rgba(255,246,220,0.6)' });
      }
    },

    // A deep, restful desert night with a stable starfield (no draw-time RNG).
    drawNight(ctx, W, H, t) {
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#141F33');
      sky.addColorStop(0.55, '#20304A');
      sky.addColorStop(1, '#2C3A44');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 76; i++) {
        const x = (i * 137.23 + 41) % W;
        const y = 12 + ((i * 71.71 + 23) % (H * 0.55));
        const tw = 0.5 + 0.5 * Math.sin(t * 0.8 + i * 1.7);
        ctx.fillStyle = 'rgba(255,246,220,' + (0.12 + tw * 0.24) + ')';
        ctx.beginPath(); ctx.arc(x, y, i % 11 === 0 ? 1.5 : 0.85, 0, TAU); ctx.fill();
      }
      // a low waxing moon, resting witness to the watch
      const mx = W * 0.82, my = H * 0.15;
      const halo = ctx.createRadialGradient(mx, my, 3, mx, my, 46);
      halo.addColorStop(0, 'rgba(255,246,220,0.22)');
      halo.addColorStop(1, 'rgba(255,246,220,0)');
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(mx, my, 46, 0, TAU); ctx.fill();
      ctx.fillStyle = '#F6ECCC';
      ctx.beginPath(); ctx.arc(mx, my, 13, 0, TAU); ctx.fill();
      ctx.fillStyle = '#20304A';
      ctx.beginPath(); ctx.arc(mx + 5, my - 2, 12, 0, TAU); ctx.fill();
    },
    drawDunes(ctx, W, H, t) {
      const rows = [
        { y: H * 0.60, c: '#28323E', a: 0.9, amp: 16, ph: 0 },
        { y: H * 0.66, c: '#222B36', a: 1, amp: 22, ph: 1.7 }
      ];
      for (const r of rows) {
        ctx.fillStyle = alpha(r.c, r.a);
        ctx.beginPath(); ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 22) {
          ctx.lineTo(x, r.y + Math.sin(x * 0.006 + r.ph) * r.amp + Math.sin(x * 0.02 + r.ph * 2) * 5);
        }
        ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      }
    },
    drawGround(ctx, W, H) {
      const g = ctx.createLinearGradient(0, H * 0.66, 0, H);
      g.addColorStop(0, '#2A2F30');
      g.addColorStop(1, '#171C1E');
      ctx.fillStyle = g; ctx.fillRect(0, H * 0.63, W, H * 0.37);
      // warm firelight pooled on the sand
      const f = fireCenter(W, H);
      const glow = ctx.createRadialGradient(f.x, f.y, 8, f.x, f.y, Math.max(W, H) * 0.5);
      glow.addColorStop(0, 'rgba(255,176,84,' + (0.20 - this.fireCalm * 0.08) + ')');
      glow.addColorStop(0.5, 'rgba(220,130,60,0.06)');
      glow.addColorStop(1, 'rgba(220,130,60,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, H * 0.5, W, H * 0.5);
    },
    drawTents(ctx, W, H, t) {
      // a ring of simple tents, dark against the night, warmed on the fire side
      const spots = [
        { x: W * 0.14, y: H * 0.70, s: 1.05 },
        { x: W * 0.30, y: H * 0.66, s: 0.8 },
        { x: W * 0.72, y: H * 0.66, s: 0.85 },
        { x: W * 0.88, y: H * 0.71, s: 1.1 }
      ];
      for (const p of spots) {
        const wdt = 58 * p.s, hgt = 46 * p.s;
        ctx.fillStyle = '#20272B';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - hgt);
        ctx.lineTo(p.x + wdt, p.y);
        ctx.lineTo(p.x - wdt, p.y);
        ctx.closePath(); ctx.fill();
        // fire-lit slope
        ctx.fillStyle = 'rgba(255,170,90,0.10)';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - hgt);
        ctx.lineTo(p.x + (p.x < W * 0.5 ? wdt : -wdt) * 0.02 + (p.x < W * 0.5 ? wdt : 0), p.y);
        ctx.lineTo(p.x, p.y);
        ctx.closePath(); ctx.fill();
        // a dim doorway
        ctx.fillStyle = '#12181A';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - hgt * 0.5);
        ctx.lineTo(p.x + 8 * p.s, p.y);
        ctx.lineTo(p.x - 8 * p.s, p.y);
        ctx.closePath(); ctx.fill();
        // a little finial
        ctx.strokeStyle = '#2A3236'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(p.x, p.y - hgt); ctx.lineTo(p.x, p.y - hgt - 7 * p.s); ctx.stroke();
      }
    },
    drawFire(ctx, W, H, t) {
      const f = fireCenter(W, H);
      const calm = this.fireCalm;
      const life = 1 - calm * 0.55;
      // embers / log base
      ctx.fillStyle = '#3A2A20';
      ctx.beginPath(); ctx.ellipse(f.x, f.y + 6, 26, 8, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#5A3A22'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(f.x - 18, f.y + 8); ctx.lineTo(f.x + 16, f.y + 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(f.x - 14, f.y + 2); ctx.lineTo(f.x + 18, f.y + 8); ctx.stroke();
      // glow
      const gr = ctx.createRadialGradient(f.x, f.y - 6, 4, f.x, f.y - 6, 70 * life);
      gr.addColorStop(0, 'rgba(255,210,120,' + (0.5 * life) + ')');
      gr.addColorStop(1, 'rgba(255,150,60,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(f.x, f.y - 6, 70 * life, 0, TAU); ctx.fill();
      // flames — layered time-based flicker (deterministic, restful)
      const flames = [
        { dx: 0, h: 34, w: 12, c: '#FFE39A', sp: 13 },
        { dx: -7, h: 24, w: 9, c: '#FFB255', sp: 17 },
        { dx: 7, h: 26, w: 9, c: '#FF9A45', sp: 11 }
      ];
      for (const fl of flames) {
        const flick = (0.8 + 0.2 * Math.sin(t * fl.sp)) * life;
        const hx = f.x + fl.dx + Math.sin(t * fl.sp * 0.6) * 2;
        const top = f.y - fl.h * flick;
        ctx.fillStyle = fl.c;
        ctx.beginPath();
        ctx.moveTo(hx - fl.w * 0.5, f.y + 2);
        ctx.quadraticCurveTo(hx - fl.w * 0.6, f.y - fl.h * 0.4 * flick, hx + Math.sin(t * fl.sp) * 3, top);
        ctx.quadraticCurveTo(hx + fl.w * 0.6, f.y - fl.h * 0.4 * flick, hx + fl.w * 0.5, f.y + 2);
        ctx.closePath(); ctx.fill();
      }
      // a couple of rising sparks
      if (calm < 0.5) {
        for (let i = 0; i < 3; i++) {
          const pv = (t * (0.4 + i * 0.13) + i * 0.7) % 1;
          ctx.fillStyle = 'rgba(255,200,120,' + (0.6 * (1 - pv)) + ')';
          ctx.beginPath();
          ctx.arc(f.x + Math.sin(pv * 6 + i) * 10, f.y - 10 - pv * 46, 1.4, 0, TAU); ctx.fill();
        }
      }
    },

    // The sleepy elder: a soft, hooded, seated figure. Poses shift the head
    // tilt, add a questioning bob, or extend a reaching arm.
    drawElder(ctx, W, H, t) {
      const p = elderPos(W, H);
      const pose = this.elderPose;
      let headTilt = 0.5, headDrop = 6, bob = Math.sin(t * 1.1) * 1.5;
      if (pose === 'sleep') { headTilt = 0.55; headDrop = 9 + Math.sin(t * 0.9) * 1.5; }
      else if (pose === 'watch') { headTilt = 0.05; headDrop = 2; }
      else if (pose === 'hmm') { headTilt = -0.35; headDrop = 3; bob = Math.sin(t * 3) * 2 * (0.4 + this.hmmT); }
      else if (pose === 'reach') { headTilt = -0.1; headDrop = 2; }
      else if (pose === 'handover') { headTilt = -0.05; headDrop = 2; }
      else if (pose === 'deepNod') { headTilt = 0.4; headDrop = 13 + Math.sin(t * 0.6) * 1.2; }

      ctx.save();
      ctx.translate(p.x, p.y + bob);
      // seated cloak body
      const bg = ctx.createLinearGradient(0, -34, 0, 6);
      bg.addColorStop(0, '#5A6B72');
      bg.addColorStop(1, '#39464C');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(-24, 6);
      ctx.quadraticCurveTo(-20, -30, 0, -34);
      ctx.quadraticCurveTo(20, -30, 24, 6);
      ctx.closePath(); ctx.fill();
      // firelit edge (facing the fire, to the right)
      ctx.fillStyle = 'rgba(255,180,100,0.14)';
      ctx.beginPath();
      ctx.moveTo(24, 6); ctx.quadraticCurveTo(20, -30, 0, -34);
      ctx.quadraticCurveTo(12, -22, 14, 6); ctx.closePath(); ctx.fill();

      // reaching / offering arm toward the target lantern (or forward)
      if (pose === 'reach' || pose === 'handover') {
        let ax = 26, ay = -20;
        if (pose === 'reach' && this.target) {
          const l = lanternPos(W, H, this.target - 1);
          const k = 0.5;
          ax = (l.x - p.x) * k; ay = (l.y - p.y) * k;
        } else { ax = 40; ay = -6; }
        ctx.strokeStyle = '#48555B'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(4, -14); ctx.quadraticCurveTo(ax * 0.6, ay * 0.6 - 6, ax, ay); ctx.stroke();
      }

      // head + hood
      ctx.save();
      ctx.translate(2, -34);
      ctx.rotate(headTilt * 0.5);
      ctx.translate(0, headDrop - 6);
      ctx.fillStyle = '#C9A98A';
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
      // hood
      ctx.fillStyle = '#4C5A60';
      ctx.beginPath();
      ctx.arc(0, -1, 11, Math.PI * 0.92, Math.PI * 2.08, false);
      ctx.closePath(); ctx.fill();
      // a soft beard hint
      ctx.fillStyle = 'rgba(230,230,225,0.5)';
      ctx.beginPath(); ctx.ellipse(0, 6, 5, 6, 0, 0, TAU); ctx.fill();
      ctx.restore();

      // sleepy 'z's rising when nodding off
      if (pose === 'sleep' || pose === 'deepNod') {
        for (let i = 0; i < 2; i++) {
          const pv = ((t * 0.5 + i * 0.5) % 1);
          ctx.fillStyle = 'rgba(220,232,236,' + (0.5 * (1 - pv)) + ')';
          ctx.font = (9 + i * 3) + 'px sans-serif';
          ctx.fillText('z', 14 + i * 6, -40 - pv * 20);
        }
      }
      // a questioning mark when puzzling over the stall
      if (pose === 'hmm' && this.hmmT > 0.02) {
        ctx.fillStyle = 'rgba(255,233,168,' + (0.5 + 0.4 * Math.sin(t * 6)) + ')';
        ctx.font = 'bold 18px serif';
        ctx.fillText('?', 16, -46);
      }
      ctx.restore();
    },

    // A small dozing singer under each lantern; startles comically awake when
    // its lantern is repaired.
    drawSinger(ctx, W, H, i, t) {
      const p = singerPos(W, H, i);
      const startled = (this.startleLantern === i + 1) ? this.startleT : 0;
      const awake = this.lit[i] ? 1 : 0;
      const bob = startled > 0 ? -startled * 10 : Math.sin(t * 1.3 + i) * 1.2;
      ctx.save();
      ctx.translate(p.x, p.y + bob);
      const s = 1 + startled * 0.12;
      ctx.scale(s, s);
      // body
      const warm = 0.06 + awake * 0.16;
      ctx.fillStyle = '#2C363B';
      ctx.beginPath();
      ctx.moveTo(-15, 4); ctx.quadraticCurveTo(-12, -18, 0, -20);
      ctx.quadraticCurveTo(12, -18, 15, 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,180,100,' + warm + ')';
      ctx.beginPath();
      ctx.moveTo(15, 4); ctx.quadraticCurveTo(12, -18, 0, -20);
      ctx.quadraticCurveTo(8, -12, 9, 4); ctx.closePath(); ctx.fill();
      // head
      const hy = -22 + (startled > 0 ? -2 : 0);
      ctx.fillStyle = '#B79A80';
      ctx.beginPath(); ctx.arc(0, hy, 6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3A464C';
      ctx.beginPath(); ctx.arc(0, hy - 1, 7, Math.PI, TAU, false); ctx.closePath(); ctx.fill();
      // startle: two little arms flung up + a spark
      if (startled > 0.1) {
        ctx.strokeStyle = '#B79A80'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-6, -10); ctx.lineTo(-12, -20 - startled * 4);
        ctx.moveTo(6, -10); ctx.lineTo(12, -20 - startled * 4);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,233,168,' + startled + ')';
        ctx.font = 'bold 15px serif'; ctx.fillText('!', 10, hy - 12);
      } else if (!this.lit[i]) {
        // dozing 'z'
        const pv = ((t * 0.5 + i * 0.3) % 1);
        ctx.fillStyle = 'rgba(220,232,236,' + (0.4 * (1 - pv)) + ')';
        ctx.font = '9px sans-serif'; ctx.fillText('z', 8, hy - 8 - pv * 12);
      }
      ctx.restore();
    },

    drawString(ctx, W, H, t) {
      const p = poles(W, H);
      // the two poles
      ctx.strokeStyle = '#3B3026'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (const px of [p.lx, p.rx]) {
        ctx.beginPath(); ctx.moveTo(px, p.topY); ctx.lineTo(px, H * 0.6); ctx.stroke();
      }
      // the hanging cord, a gentle catenary through the lantern tops
      ctx.strokeStyle = 'rgba(40,32,24,0.9)'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.lx, p.topY);
      for (let x = 0; x <= 1.001; x += 0.05) {
        const px = lerp(p.lx, p.rx, x);
        const py = p.topY + Math.sin(x * Math.PI) * 22;
        ctx.lineTo(px, py);
      }
      ctx.lineTo(p.rx, p.topY);
      ctx.stroke();
    },

    // Lantern i (ayah i+1). Lit lanterns glow warm with soft falloff; a dark
    // lantern is a dim frame that sways / pulses under the support ladder.
    drawLantern(ctx, W, H, i, t) {
      const base = lanternPos(W, H, i);
      const lit = this.lit[i];
      const kindle = this.kindleT[i];
      const flick = this.flickT[i];
      const isTarget = (this.phase === 'waiting' && this.target === i + 1);
      const sounding = (this.sounding === i + 1);

      // sway (rung 1) rocks the dark target lantern; pulse (rung 2) breathes it
      let x = base.x, y = base.y;
      if (isTarget && this.sway > 0) x += Math.sin(t * 3.2) * 6 * this.sway;
      const pulse = isTarget && this.pulseRhythm ? 0.5 + 0.5 * Math.sin(t * 2.4) : 0;

      ctx.save();
      // hanger
      ctx.strokeStyle = '#3B3026'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(base.x, base.y - 22); ctx.lineTo(x, y - 12); ctx.stroke();

      // warm glow when lit (or briefly re-flickering)
      const warm = lit ? (0.85 + kindle * 0.4 + (sounding ? 0.25 + 0.15 * Math.sin(t * 9) : 0) + flick * 0.3) : 0;
      if (warm > 0) {
        const r = 46 + kindle * 16 + (sounding ? 6 : 0);
        const g = ctx.createRadialGradient(x, y, 3, x, y, r);
        g.addColorStop(0, 'rgba(255,214,130,' + Math.min(0.85, 0.5 * warm) + ')');
        g.addColorStop(0.5, 'rgba(255,170,80,' + Math.min(0.4, 0.22 * warm) + ')');
        g.addColorStop(1, 'rgba(255,170,80,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      }
      // a soft invitation halo around a dark target so it reads as tappable
      if (isTarget) {
        const a = 0.14 + pulse * 0.22 + this.sway * 0.10;
        ctx.strokeStyle = 'rgba(207,224,255,' + a + ')';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, 30 + pulse * 5, 0, TAU); ctx.stroke();
      }

      // the lantern body — a little metal cage
      const bodyW = 20, bodyH = 26;
      ctx.strokeStyle = lit ? '#7A5A2E' : '#3C4247';
      ctx.fillStyle = lit
        ? 'rgba(255,224,150,' + (0.55 + kindle * 0.35) + ')'
        : 'rgba(38,46,50,0.85)';
      ctx.lineWidth = 2;
      // cap
      ctx.beginPath();
      ctx.moveTo(x - 7, y - 13); ctx.lineTo(x + 7, y - 13);
      ctx.lineTo(x + 4, y - 16); ctx.lineTo(x - 4, y - 16); ctx.closePath();
      ctx.fillStyle = lit ? '#8A6634' : '#333A3F'; ctx.fill();
      // glass housing
      ctx.beginPath();
      GOL.roundRectSafe(ctx, x - bodyW / 2, y - bodyH / 2, bodyW, bodyH, 6);
      ctx.fillStyle = lit
        ? 'rgba(255,226,150,' + (0.6 + kindle * 0.3) + ')'
        : 'rgba(40,48,52,0.9)';
      ctx.fill();
      ctx.strokeStyle = lit ? '#8A6634' : '#454C51';
      ctx.stroke();
      // the little flame inside
      if (lit) {
        const fl = 0.7 + 0.3 * Math.sin(t * 8 + i);
        ctx.fillStyle = 'rgba(255,244,205,' + (0.85 * fl) + ')';
        ctx.beginPath(); ctx.ellipse(x, y + 2, 3.2, 5 * fl, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,196,110,0.8)';
        ctx.beginPath(); ctx.ellipse(x, y + 4, 4.5, 4, 0, 0, TAU); ctx.fill();
      } else {
        // a cold, unlit wick
        ctx.fillStyle = 'rgba(120,132,138,0.5)';
        ctx.beginPath(); ctx.arc(x, y + 2, 2, 0, TAU); ctx.fill();
      }
      // base ring
      ctx.strokeStyle = lit ? '#8A6634' : '#3C4247'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x - 8, y + bodyH / 2); ctx.lineTo(x + 8, y + bodyH / 2); ctx.stroke();
      ctx.restore();
    },

    // The watchman's staff — offered by the elder during handover, then
    // resting as a quiet token that the watch is the child's.
    drawStaff(ctx, W, H, t) {
      const el = elderPos(W, H);
      const rest = { x: W * 0.5, y: H * 0.90 };
      let x, y, ang;
      if (this.phase === 'handover') {
        const k = ease(this.staffK);
        x = lerp(el.x + 30, rest.x, k);
        y = lerp(el.y - 10, rest.y, k);
        ang = lerp(-0.5, 0, k);
      } else {
        x = rest.x; y = rest.y; ang = Math.sin(t * 1.2) * 0.04;
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      // a soft glow so the token reads
      const g = ctx.createRadialGradient(0, -16, 2, 0, -16, 26);
      g.addColorStop(0, 'rgba(255,233,168,0.5)');
      g.addColorStop(1, 'rgba(255,233,168,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -16, 26, 0, TAU); ctx.fill();
      // shaft
      ctx.strokeStyle = '#8A6B4A'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(0, -22); ctx.stroke();
      // a little eight-point star crowning it
      GOL.star8(ctx, 0, -26, 6, Math.PI / 8 + t * 0.2, 'rgba(255,233,168,0.95)');
      ctx.restore();
    },

    drawBack(ctx, W, H, t) {
      const b = backStar(W, H);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,233,168,0.5)'; ctx.lineWidth = 1.4;
      GOL.star8Path(ctx, b.x, b.y, b.r * 0.6, Math.PI / 8 + t * 0.08);
      ctx.fillStyle = 'rgba(20,31,51,0.55)'; ctx.fill();
      ctx.stroke();
      // a little back-chevron in the star's heart
      ctx.strokeStyle = 'rgba(255,246,220,0.85)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.x + 5, b.y - 6); ctx.lineTo(b.x - 5, b.y); ctx.lineTo(b.x + 5, b.y + 6);
      ctx.stroke();
      ctx.restore();
    }
  };

  // A rounded-rect path helper that also works in the smoke harness, where
  // actors.js (GOL.roundRect) isn't loaded. Kept private to this lab.
  GOL.roundRectSafe = GOL.roundRectSafe || function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  GOL.PROTOTYPES[23] = { key: 'night-watch', name: 'the night watch', scene: 'nightWatchLab' };
  GOL.registerScene('nightWatchLab', lab);
})();
