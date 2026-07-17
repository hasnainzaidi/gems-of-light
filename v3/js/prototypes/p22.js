// Quraysh learning-loop lab · P22 — The Hungry Little Camel
//
// Room 3 of the Quraysh rooms (spec: v3/QURAYSH-PROTOTYPE-ROOMS.md). A social,
// nurturing, turn-taking room — the child recites *for someone*. A camel calf
// has strayed from the caravan and sits alone in the dusk, hungry and a little
// afraid (ayah 4's two conditions — fed, and made safe — made flesh). It only
// knows how each ayah *starts*: it hums the opening in its small warbling
// voice, then looks at the child and waits. A firefly drifts out front: the
// wordless "your turn." The child speaks; the calf calms; the reciter's full
// correct model then plays warmly and the bowl gains a share of food. Four
// turns, then the calf is fed and unafraid and trots home to its caravan.
//
// FIRST-BUILD SCOPE (Levels 1/2 only). The Level 3 recognizer is out of scope.
// The calf's "hum" is NOT Quran and NOT the reciter — it is a short melodic
// phrase of soft synthesized bells (sequenced GOL.audio.sfx tones), a first
// stand-in for the real creature-voice audio (a later asset task). Every actual
// Quranic model stays in the reciter's voice via GOL.QROOMS.playAyah.
//
// The room NEVER judges correctness. Any sincere vocal turn advances the
// fiction and is followed by the correct model; silence only escalates gentle
// support. No mic / denied → the firefly still hovers and a tap on the calf
// takes the turn (logged 'no-vocal'); the room is fully playable that way.
//
// Direct: ?lab=22
(function () {
  const GOL = window.GOL;
  const TAU = Math.PI * 2;
  const { alpha, mix, shade, tint } = GOL.color;
  const blob = GOL.paint.blob;

  // engine.js (GOL.ease/GOL.dist) and props/actors/ui draw helpers are NOT
  // loaded under the headless smoke harness, so everything this room needs is
  // self-contained here.
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (v) => { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); };
  const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);

  const AYAHS = 4;
  // Hesitation window before support escalates (seconds). Exposed on the tuning
  // panel in a real build; a gentle 4.2s here.
  const HES = (GOL.TUNE && GOL.TUNE.camelHesitate) || 4.2;

  // The calf's per-ayah bell "hum" — a short melodic phrase, distinct per ayah
  // so the opening's shape is recognizable. [timeSeconds, sfxName]. This is the
  // deliberate first-build stand-in for real creature-voice audio.
  const HUMS = {
    1: [[0.00, 'hint'], [0.34, 'drift'], [0.62, 'hint']],
    2: [[0.00, 'drift'], [0.30, 'hint'], [0.58, 'drift'], [0.86, 'hint']],
    3: [[0.00, 'hint'], [0.30, 'nearby'], [0.60, 'drift']],
    4: [[0.00, 'drift'], [0.28, 'hint'], [0.54, 'drift'], [0.82, 'settle']]
  };
  // The distant caravan bells as the calf departs home.
  const BELLS = [[0.0, 'nearby'], [0.5, 'drift'], [1.05, 'hint'], [1.7, 'settle'], [2.5, 'drift']];

  function sfx(name) { if (GOL.audio && GOL.audio.sfx) GOL.audio.sfx(name); }

  const lab = {
    // ------------------------------------------------------------ lifecycle --
    enter() {
      this.t = 0;
      this.ayah = 0;
      this.completed = 0;          // ayaat whose model has finished (bowl shares)
      this.mode = 'idle';          // idle|hum|wait|model|gap|depart|rest
      this.lad = null;
      this.micHoldT = 0;           // >0 keeps the mic gate shut (cue playing)
      this._speech = null;         // pending speech-run duration from the mic
      this._micAsked = false;

      // persistence: visits so far + best (lowest) support rung per ayah — the
      // cue-withdrawal memory. Later visits hum less.
      this.data = (GOL.QROOMS && GOL.QROOMS.load('hungry-camel')) || { visits: 0, rungs: {} };

      // hum sequencing
      this.humNotes = [];
      this.humI = 0;
      this.humT = 0;
      this.humEnd = 0;
      this.humPulse = 0;           // mouth/throat pulse when a bell sounds

      // bowl
      this.bowl = 0;               // animated fill 0..1
      this.bowlTarget = 0;

      // the your-turn firefly + celebration motes
      this.fly = { x: 0, y: 0, tx: 0, ty: 0, k: 0, home: true };
      this.motes = [];             // {a, r, spin, life, max, sz}
      this.stir = 0;               // fireflies stirring as speech begins

      // calf posture (springs)
      this.earA = 0.85;            // ear angle (droopy when crying)
      this.earV = 0;
      this.earTarget = 0.85;
      this.eyeOpen = 1;            // 1 open, 0 shut (happy)
      this.eyeTarget = 1;
      this.happyT = 0;             // lingering closed-eyes warmth after a good turn
      this.sit = 1;               // 1 folded/sitting, 0 standing
      this.sitTarget = 1;
      this.headTilt = 0;
      this.tremble = this.data.visits > 0 ? 0 : 1; // returning calf is calmer
      this.cryT = 2.4;             // countdown to the next soft cry
      this.leanNuzzle = 0;         // toward the child during departure

      // departure
      this.departT = 0;
      this.departX = 0;            // walk-off offset
      this.departFade = 1;
      this.bellI = 0;

      // wire the mic (Level 1/2 only). Callbacks fire only while the gate is
      // open; we open it solely during 'wait'. Set up here, torn down in exit.
      const mic = GOL.QROOMS && GOL.QROOMS.mic;
      if (mic) {
        mic.gate = false;
        mic.onSpeechStart = () => { if (this.mode === 'wait') this.stir = 1; };
        mic.onSpeechEnd = (dur) => { if (this.mode === 'wait') this._speech = dur; };
      }
    },

    exit() {
      // Do NOT stop the shared mic (other rooms may use it). Only drop our own
      // callbacks and stop our own audio loops.
      const mic = GOL.QROOMS && GOL.QROOMS.mic;
      if (mic) { mic.onSpeechStart = null; mic.onSpeechEnd = null; mic.gate = true; }
      if (GOL.QROOMS && GOL.QROOMS.stopSlice) GOL.QROOMS.stopSlice();
    },

    // --------------------------------------------------------------- geometry --
    layout(W, H) {
      const gy = H * 0.82;
      return {
        gy,
        calfX: W * 0.44,
        calfY: gy,
        sc: Math.min(W, H) / 460,           // gentle scale to fit
        bowlX: W * 0.44 - 118 * (Math.min(W, H) / 460),
        frontX: W * 0.57,                    // your-turn firefly rest, out front
        frontY: gy - 46
      };
    },

    // ----------------------------------------------------------- loop control --
    beginVisit() {
      this.completed = 0;
      this.bowl = 0; this.bowlTarget = 0;
      this.tremble = 0;             // being sat-with already soothes it
      this.sitTarget = 1;
      sfx('settle');
      this.beginAyah(1);
    },

    // How full a hum this ayah gets, given prior independence (cue withdrawal).
    // 2 = full opening phrase · 1 = first bell only · 0 = just a look + ear flick.
    humLevelFor(n) {
      const v = this.data.visits || 0;
      const best = this.data.rungs ? this.data.rungs[n] : undefined;
      let lvl = 2;
      if (v >= 1) lvl = 1;
      if (v >= 2) lvl = 0;
      if (best === 0 && v >= 1) lvl = 0;   // was independent here → fade faster
      return lvl;
    },

    beginAyah(n) {
      this.ayah = n;
      this.mode = 'hum';
      this.eyeTarget = 1;
      this.earTarget = 0.12;         // ears come up mid as it starts to sing
      this.headTilt = 0.06;
      this.fly.home = true;          // firefly nestles by the calf during the hum
      this.stir = 0;
      const lvl = this.humLevelFor(n);
      const pattern = HUMS[n] || HUMS[1];
      if (lvl === 2) this.humNotes = pattern.slice();
      else if (lvl === 1) this.humNotes = pattern.slice(0, 1);
      else this.humNotes = [];       // look-only: no bells, just an ear flick
      this.humI = 0;
      this.humT = 0;
      const last = this.humNotes.length ? this.humNotes[this.humNotes.length - 1][0] : 0.2;
      this.humEnd = last + 0.45;
      if (lvl === 0) { this.earTarget = -0.3; this.earV += 3.2; } // an expectant flick
    },

    startWait() {
      this.mode = 'wait';
      this.micHoldT = 0;
      this.earTarget = -0.34;        // ears forward, eyes on the player
      this.eyeTarget = 1;
      this.headTilt = -0.02;
      // the firefly drifts out front: the wordless "your turn"
      this.fly.home = false;
      sfx('yourTurn');
      const n = this.ayah;
      const self = this;
      // The gentle-support ladder. rung 0 = the bare prompt (hum already sang +
      // firefly waits); each later rung adds the reciter softly; exhaustion
      // plays the full model and feeds the calf just the same.
      this.lad = GOL.QROOMS.ladder({
        delays: [HES, HES, HES],
        rungs: [
          function () { /* bare prompt — the hum and the firefly are the ask */ },
          function () {
            // re-hum + the reciter's FIRST WORD riding softly on top
            sfx('hint');
            self.humPulse = 1;
            self.micHoldT = 1.5;
            self.lad && self.lad.hold(1.5);
            GOL.QROOMS.firstWord(n, {
              vol: 0.5,
              onend: function () { if (self.mode === 'wait') self.micHoldT = 0; }
            });
          },
          function () {
            // the reciter quietly joins for the opening phrase — sing along
            self.micHoldT = 8;
            self.lad && self.lad.hold(2.6);
            GOL.QROOMS.openingPhrase(n, {
              vol: 0.62,
              onend: function () { if (self.mode === 'wait') self.micHoldT = 0; }
            });
          }
        ],
        onExhausted: function () { if (self.mode === 'wait') self.takeTurn('no-vocal'); }
      });
      this.lad.arm();
    },

    // The child took the turn (by voice, or by tapping the calf when there's no
    // mic). Whatever the evidence, the calf calms and the correct model follows.
    takeTurn(evidence) {
      if (this.mode !== 'wait') return;
      const n = this.ayah;
      const rung = this.lad ? Math.max(0, this.lad.rung) : 0;
      if (this.lad) { this.lad.answer(); this.lad = null; }

      // honest telemetry: what the machine actually knows
      if (GOL.QROOMS && GOL.QROOMS.log) {
        GOL.QROOMS.log('hungry-camel', 'turn', { ayah: n, rung: rung, evidence: evidence });
      }
      // persist the best (lowest) rung this ayah has ever needed
      this.data.rungs = this.data.rungs || {};
      const prev = this.data.rungs[n];
      this.data.rungs[n] = prev == null ? rung : Math.min(prev, rung);

      // warmth, scaled to the evidence tier
      this.earTarget = 0.42;         // ears relax
      this.headTilt = 0.05;
      if (evidence === 'phrase-shaped') {
        this.eyeTarget = 0; this.happyT = 1.6; this.burstMotes(14, 1.0); sfx('bloom');
      } else if (evidence === 'turn-taken') {
        this.happyT = 0.8; this.burstMotes(9, 0.8); sfx('blossom');
      } else { // no-vocal (silence exhausted, or a tap took the turn)
        this.burstMotes(4, 0.6);
      }

      // ALWAYS play the reciter's full correct model, warmly. The bowl gains a
      // share of food while it sounds. mic.gate stays shut so it can't self-fire.
      this.mode = 'model';
      this.micHoldT = 99;
      this.fly.home = true;          // the firefly drifts back toward the calf
      this.bowlTarget = n / AYAHS;
      const self = this;
      GOL.QROOMS.playAyah(n, function () { self.onModelDone(); });
    },

    onModelDone() {
      this.completed = this.ayah;
      this.bowl = this.bowlTarget;
      if (this.ayah >= AYAHS) this.finishVisit();
      else { this.mode = 'gap'; this.gapT = 0; }
    },

    finishVisit() {
      // a completed visit: remember it (cue withdrawal), and let the calf go home
      this.data.visits = (this.data.visits || 0) + 1;
      if (GOL.QROOMS && GOL.QROOMS.save) GOL.QROOMS.save('hungry-camel', this.data);
      this.mode = 'depart';
      this.departT = 0; this.departX = 0; this.departFade = 1; this.bellI = 0;
      this.sitTarget = 0;            // stands to leave
      this.earTarget = -0.15;
      this.eyeTarget = 1;
    },

    burstMotes(n, strength) {
      for (let i = 0; i < n; i++) {
        this.motes.push({
          a: Math.random() * TAU,
          r: 6 + Math.random() * 10,
          spin: (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 1.4),
          life: 0, max: 0.9 + Math.random() * 0.9,
          sz: (0.7 + Math.random() * 0.7) * strength,
          rise: 22 + Math.random() * 40
        });
      }
    },

    // --------------------------------------------------------------- update ---
    update(dt, W, H) {
      this.t += dt;
      const L = this.layout(W, H);

      // ---- input --------------------------------------------------------
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
      const homeX = sa.l + 34, homeY = sa.t * 0.5 + 30;
      for (const tap of GOL.Input.taps) {
        if (tap.ui) continue;
        if (dist(tap.x, tap.y, homeX, homeY) < 30) { tap.ui = true; GOL.go('title'); return; }
        tap.ui = true;
        if (GOL.audio && GOL.audio.unlock) GOL.audio.unlock();
        if (!this._micAsked) {
          this._micAsked = true;
          if (GOL.QROOMS && GOL.QROOMS.mic) GOL.QROOMS.mic.request(function () {});
        }
        if (this.mode === 'idle' || this.mode === 'rest') {
          this.beginVisit();
        } else if (this.mode === 'wait') {
          // a gentle tap on the calf takes the turn (the no-mic path, and a
          // fine escape hatch even with a mic) — honestly logged as no-vocal
          this.takeTurn('no-vocal');
        }
      }

      // ---- mic gate -----------------------------------------------------
      const mic = GOL.QROOMS && GOL.QROOMS.mic;
      if (this.micHoldT > 0) this.micHoldT -= dt;
      if (mic) mic.gate = (this.mode === 'wait' && this.micHoldT <= 0);

      // process a completed speech run
      if (this.mode === 'wait' && this._speech != null) {
        const dur = this._speech; this._speech = null;
        const ev = (mic && mic.phraseShaped(dur)) ? 'phrase-shaped' : 'turn-taken';
        this.takeTurn(ev);
      }

      // ---- mode timelines ----------------------------------------------
      if (this.mode === 'hum') {
        this.humT += dt;
        while (this.humI < this.humNotes.length && this.humT >= this.humNotes[this.humI][0]) {
          sfx(this.humNotes[this.humI][1]);
          this.humPulse = 1;
          this.humI++;
        }
        if (this.humT >= this.humEnd) this.startWait();
      } else if (this.mode === 'wait') {
        if (this.lad) this.lad.update(dt);
      } else if (this.mode === 'gap') {
        this.gapT += dt;
        if (this.gapT >= 0.75) this.beginAyah(this.ayah + 1);
      } else if (this.mode === 'model') {
        // ease the bowl up while the model sounds (a smoothing floor toward the
        // target; snapped exact on model end)
        this.bowl = lerp(this.bowl, this.bowlTarget, Math.min(1, dt * 1.4));
      } else if (this.mode === 'depart') {
        this.updateDepart(dt);
      }

      // ---- cry cadence (only a truly untended calf cries) ---------------
      if (this.mode === 'idle' && this.tremble > 0.3) {
        this.cryT -= dt;
        if (this.cryT <= 0) { this.cryT = 3.0 + Math.random() * 1.6; sfx('veil'); this.headTilt = 0.12; this.earV -= 2.0; }
      }

      // ---- posture springs ---------------------------------------------
      this.updateSprings(dt);

      // ---- firefly + motes ---------------------------------------------
      this.updateFly(dt, L);
      for (let i = this.motes.length - 1; i >= 0; i--) {
        const m = this.motes[i];
        m.life += dt; m.a += m.spin * dt; m.r += dt * 14;
        if (m.life >= m.max) this.motes.splice(i, 1);
      }
      this.stir = Math.max(0, this.stir - dt * 1.4);
      this.humPulse = Math.max(0, this.humPulse - dt * 3.2);
      this.happyT = Math.max(0, this.happyT - dt);
      // bowl smoothing outside model too (idle settle)
      this.bowl = lerp(this.bowl, this.bowlTarget, Math.min(1, dt * 2));
    },

    updateSprings(dt) {
      // ears: a light, springy joint with a gentle idle flick
      const target = this.earTarget + Math.sin(this.t * 0.7) * 0.02;
      const k = (target - this.earA);
      this.earV += k * 46 * dt;
      this.earV -= this.earV * 7 * dt;
      this.earA += this.earV * dt;
      // eyes (with lingering happy-closed warmth)
      const eyeGoal = this.happyT > 0.05 ? 0 : this.eyeTarget;
      this.eyeOpen = lerp(this.eyeOpen, eyeGoal, Math.min(1, dt * 8));
      // sit/stand + tremble decay
      this.sit = lerp(this.sit, this.sitTarget, Math.min(1, dt * 4));
      if (this.mode !== 'idle') this.tremble = Math.max(0, this.tremble - dt * 0.8);
      this.headTilt = lerp(this.headTilt, this.mode === 'idle' && this.tremble > 0.3 ? 0.09 : 0, Math.min(1, dt * 3));
    },

    updateFly(dt, L) {
      const f = this.fly;
      if (f.home) { f.tx = L.calfX + 30 * L.sc; f.ty = L.calfY - 96 * L.sc; f.k = Math.max(0, f.k - dt * 1.6); }
      else { f.tx = L.frontX; f.ty = L.frontY; f.k = Math.min(1, f.k + dt * 1.6); }
      // drift toward target with a little life
      const wob = f.home ? 0 : 1;
      const gx = f.tx + Math.cos(this.t * 0.9) * 7 * wob;
      const gy = f.ty + Math.sin(this.t * 1.5) * 8 * wob;
      f.x = lerp(f.x || gx, gx, Math.min(1, dt * 3));
      f.y = lerp(f.y || gy, gy, Math.min(1, dt * 3));
    },

    updateDepart(dt) {
      this.departT += dt;
      const T = this.departT;
      // bells ring out as it turns for home
      while (this.bellI < BELLS.length && T >= BELLS[this.bellI][0]) { sfx(BELLS[this.bellI][1]); this.bellI++; }
      // 0.0–0.7 stand · 0.7–1.5 nuzzle the child · 1.5+ trot off to the right
      this.leanNuzzle = Math.sin(clamp((T - 0.7) / 0.8, 0, 1) * Math.PI) ;
      if (T > 1.5) {
        const w = ease(clamp((T - 1.5) / 2.6, 0, 1));
        this.departX = w * 260;
        this.departFade = 1 - ease(clamp((T - 3.2) / 1.0, 0, 1));
        this.earTarget = -0.1;
      }
      if (T > 4.4) {
        // settle into a content rest; a tap sits with it again
        this.mode = 'rest';
        this.departX = 0; this.departFade = 1;
        this.sitTarget = 1; this.earTarget = 0.3; this.eyeTarget = 1;
        this.bowlTarget = 0; this.bowl = 0;
      }
    },

    // ---------------------------------------------------------------- draw ---
    draw(ctx, W, H) {
      const L = this.layout(W, H);
      this.drawDusk(ctx, W, H);
      this.drawGround(ctx, W, H, L);
      this.drawBowl(ctx, L.bowlX, L.gy, L.sc);
      // calf (skip while fully departed/faded)
      if (this.departFade > 0.02) {
        ctx.save();
        ctx.globalAlpha *= this.departFade;
        this.drawCalf(ctx, L.calfX + this.departX, L.calfY, L.sc);
        ctx.restore();
      }
      this.drawFireflies(ctx, W, H, L);
      if (typeof GOL.drawVignette === 'function') GOL.drawVignette(ctx, W, H, 0.26);
      else this.drawVignetteFallback(ctx, W, H, 0.26);
      this.drawHome(ctx);
      if (GOL.DEBUG) this.drawDebug(ctx, W, H);
    },

    drawDusk(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#2B2A46');
      g.addColorStop(0.5, '#4A3D5C');
      g.addColorStop(0.82, '#8A5E62');
      g.addColorStop(1, '#B57A55');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // the set sun's afterglow, low and to the right
      const sx = W * 0.8, sy = H * 0.7;
      const bloom = ctx.createRadialGradient(sx, sy, 0, sx, sy, H * 0.6);
      bloom.addColorStop(0, 'rgba(247,206,150,0.5)');
      bloom.addColorStop(0.4, 'rgba(230,150,110,0.16)');
      bloom.addColorStop(1, 'rgba(230,150,110,0)');
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, W, H);
      // stars: stable pinpricks, brighter up top
      for (let i = 0; i < 60; i++) {
        const x = (i * 149.3 + 33) % W;
        const y = 8 + ((i * 83.7 + 17) % (H * 0.55));
        const a = 0.1 + 0.28 * (0.5 + 0.5 * Math.sin(this.t * 0.6 + i * 1.7));
        ctx.fillStyle = 'rgba(255,246,220,' + a + ')';
        ctx.beginPath(); ctx.arc(x, y, i % 11 === 0 ? 1.5 : 0.85, 0, TAU); ctx.fill();
      }
      // distant dune ridge + the far caravan already gone over it
      const ry = H * 0.66;
      ctx.fillStyle = '#3A2F49';
      ctx.beginPath();
      ctx.moveTo(0, ry + 24);
      for (let x = 0; x <= W + 20; x += 24) ctx.lineTo(x, ry + Math.sin(x * 0.006 + 1.4) * 14);
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      this.drawFarCaravan(ctx, W * 0.86, ry - 2);
    },

    // a few tiny camel humps trailing over the horizon — atmosphere only
    drawFarCaravan(ctx, x, y) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#2C2338';
      for (let i = 0; i < 4; i++) {
        const hx = x + i * 15;
        const s = 1 - i * 0.12;
        ctx.beginPath();
        ctx.moveTo(hx - 6 * s, y);
        ctx.quadraticCurveTo(hx - 3 * s, y - 6 * s, hx, y - 4 * s);
        ctx.quadraticCurveTo(hx + 3 * s, y - 7 * s, hx + 6 * s, y);
        ctx.closePath(); ctx.fill();
        ctx.fillRect(hx - 5 * s, y, 1.3, 4 * s);
        ctx.fillRect(hx + 3.5 * s, y, 1.3, 4 * s);
      }
      ctx.restore();
    },

    drawGround(ctx, W, H, L) {
      const g = ctx.createLinearGradient(0, L.gy - 30, 0, H);
      g.addColorStop(0, 'rgba(96,74,68,0.9)');
      g.addColorStop(1, 'rgba(58,44,44,0.98)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, L.gy);
      for (let x = 0; x <= W + 20; x += 22) ctx.lineTo(x, L.gy + Math.sin(x * 0.02 + this.t * 0.05) * 4);
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      // warm ground-glow pooling under the calf (where the fireflies gather)
      const gx = L.calfX, gyy = L.gy;
      const pool = ctx.createRadialGradient(gx, gyy - 10, 4, gx, gyy - 10, 150 * L.sc);
      pool.addColorStop(0, 'rgba(255,214,140,0.14)');
      pool.addColorStop(1, 'rgba(255,214,140,0)');
      ctx.fillStyle = pool;
      ctx.fillRect(0, L.gy - 120, W, 160);
    },

    // ---- the food bowl, four fill states (smoothly animated) --------------
    drawBowl(ctx, x, gy, sc) {
      ctx.save();
      ctx.translate(x, gy);
      ctx.scale(sc, sc);
      // shadow
      ctx.fillStyle = 'rgba(30,24,24,0.3)';
      ctx.beginPath(); ctx.ellipse(0, 2, 26, 6, 0, 0, TAU); ctx.fill();
      // the food inside (rises with fill), clipped to the bowl bowl-shape
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-22, -8); ctx.quadraticCurveTo(0, 16, 22, -8);
      ctx.closePath(); ctx.clip();
      if (this.bowl > 0.01) {
        const fy = 6 - this.bowl * 16;
        const fg = ctx.createLinearGradient(0, fy, 0, 8);
        fg.addColorStop(0, '#F0C878');
        fg.addColorStop(1, '#C99A50');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.moveTo(-22, fy);
        for (let px = -22; px <= 22; px += 4) ctx.lineTo(px, fy + Math.sin(px * 0.4 + this.t * 3) * 1.1);
        ctx.lineTo(22, 10); ctx.lineTo(-22, 10); ctx.closePath(); ctx.fill();
        // a couple of glints of grain
        ctx.fillStyle = 'rgba(255,247,220,0.7)';
        for (let i = 0; i < 3; i++) {
          const dx = -14 + i * 13;
          ctx.beginPath(); ctx.arc(dx, fy + 3, 1.4, 0, TAU); ctx.fill();
        }
      }
      ctx.restore();
      // the bowl rim + body
      ctx.strokeStyle = '#B8956A';
      ctx.lineWidth = 3.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-24, -8); ctx.quadraticCurveTo(0, 18, 24, -8); ctx.stroke();
      ctx.strokeStyle = '#E7CDA0';
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(-24, -8); ctx.quadraticCurveTo(-16, -12, 0, -12); ctx.quadraticCurveTo(16, -12, 24, -8); ctx.stroke();
      ctx.restore();
    },

    // ---- the calf: big eyes, soft trembles, ear physics -------------------
    drawCalf(ctx, cx, gy, sc) {
      const t = this.t;
      const trem = this.tremble;
      // trembling shiver, and a slow breathing bob
      const shiver = trem > 0.02 ? Math.sin(t * 26) * 1.1 * trem : 0;
      const breathe = Math.sin(t * 1.7) * 1.4 + this.humPulse * 1.6;
      const nuzzle = this.leanNuzzle * 14;   // lean toward the child on departure

      ctx.save();
      ctx.translate(cx + shiver + nuzzle, gy);
      ctx.scale(sc, sc);

      // soft ground shadow
      ctx.fillStyle = 'rgba(30,24,24,0.28)';
      ctx.beginPath(); ctx.ellipse(0, 2, 60, 12, 0, 0, TAU); ctx.fill();

      const BODY = '#E4CBA0', BELLY = '#F2E4C6', SH = '#C7A87C', DK = '#8A6B4F';
      const sitK = this.sit;                 // 1 sitting, 0 standing
      const bodyY = -46 + sitK * 10;         // sits a little lower
      const legLen = (1 - sitK) * 26;        // legs extend when standing

      // --- back legs (drawn first) ---
      this.drawLegs(ctx, bodyY, legLen, sitK, -1, DK, SH, t);

      // --- body: a soft rounded barrel with a little hump ---
      ctx.save();
      ctx.translate(0, bodyY + breathe * 0.4);
      const bg = ctx.createLinearGradient(0, -40, 0, 34);
      bg.addColorStop(0, tint(BODY, 0.18));
      bg.addColorStop(0.6, BODY);
      bg.addColorStop(1, SH);
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(-46, 20);
      ctx.quadraticCurveTo(-56, -14, -30, -26);
      ctx.quadraticCurveTo(-18, -44, 0, -34);   // hump
      ctx.quadraticCurveTo(18, -46, 40, -30);
      ctx.quadraticCurveTo(58, -18, 50, 16);
      ctx.quadraticCurveTo(40, 30, 0, 30);
      ctx.quadraticCurveTo(-32, 30, -46, 20);
      ctx.closePath();
      ctx.fill();
      // belly light + soft flank dabs
      ctx.fillStyle = alpha(BELLY, 0.6);
      ctx.beginPath(); ctx.ellipse(-2, 16, 34, 12, 0, 0, TAU); ctx.fill();
      blob(ctx, 20, -18, 12, alpha(tint(BODY, 0.3), 0.5));
      // little tail
      ctx.strokeStyle = SH; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(48, 6);
      ctx.quadraticCurveTo(60 + Math.sin(t * 2) * 3, 12, 56, 26);
      ctx.stroke();
      ctx.fillStyle = DK;
      ctx.beginPath(); ctx.arc(56, 27, 3.2, 0, TAU); ctx.fill();
      ctx.restore();

      // --- front legs ---
      this.drawLegs(ctx, bodyY, legLen, sitK, 1, DK, SH, t);

      // --- neck + head ---
      const headTilt = this.headTilt + this.leanNuzzle * 0.18;
      ctx.save();
      ctx.translate(-30, bodyY - 20 + breathe * 0.5);
      ctx.rotate(headTilt);
      // neck
      const ng = ctx.createLinearGradient(0, 0, -6, -34);
      ng.addColorStop(0, SH); ng.addColorStop(1, BODY);
      ctx.fillStyle = ng;
      ctx.beginPath();
      ctx.moveTo(4, 6);
      ctx.quadraticCurveTo(-10, -18, -8, -40);
      ctx.quadraticCurveTo(0, -48, 14, -42);
      ctx.quadraticCurveTo(14, -18, 18, 4);
      ctx.closePath(); ctx.fill();

      // head group
      ctx.save();
      ctx.translate(2, -50);
      // ears (physics) — behind the head, mirrored
      this.drawEar(ctx, -10, -8, -1, DK);
      this.drawEar(ctx, 12, -10, 1, DK);
      // skull
      const hg = ctx.createLinearGradient(0, -18, 0, 20);
      hg.addColorStop(0, tint(BODY, 0.2));
      hg.addColorStop(1, SH);
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.ellipse(0, -2, 20, 18, 0, 0, TAU); ctx.fill();
      // long soft muzzle
      ctx.fillStyle = mix(BODY, '#D8BE94', 0.5);
      ctx.beginPath();
      ctx.moveTo(-16, 2);
      ctx.quadraticCurveTo(-24, 16, -16, 26);
      ctx.quadraticCurveTo(-6, 32, 2, 24);
      ctx.quadraticCurveTo(6, 12, -2, 4);
      ctx.closePath(); ctx.fill();
      // nostrils + a small mouth that opens a touch while humming
      ctx.fillStyle = alpha(DK, 0.75);
      ctx.beginPath(); ctx.ellipse(-15, 20, 2, 3, 0.3, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-9, 23, 1.8, 2.6, 0.3, 0, TAU); ctx.fill();
      const mo = this.humPulse * 2.4;
      ctx.strokeStyle = alpha(DK, 0.6); ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-16, 26 - mo * 0.3); ctx.quadraticCurveTo(-11, 28 + mo, -6, 25); ctx.stroke();

      // eyes — big and dark, endearing; close to a happy curve on warmth
      this.drawEye(ctx, -6, -4, DK);
      this.drawEye(ctx, 10, -4, DK);
      // long lashes / brow
      ctx.strokeStyle = alpha(DK, 0.55); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(-6, -6, 8, Math.PI * 1.15, Math.PI * 1.5); ctx.stroke();
      ctx.beginPath(); ctx.arc(10, -6, 8, Math.PI * 1.5, Math.PI * 1.85); ctx.stroke();

      // a teary glint when it is crying and untended
      if (this.mode === 'idle' && trem > 0.35) {
        const tw = 0.5 + 0.5 * Math.sin(t * 2.2);
        ctx.fillStyle = alpha('#CFE6FF', 0.6 + tw * 0.3);
        ctx.beginPath(); ctx.arc(-8, 4 + tw * 2, 1.8, 0, TAU); ctx.fill();
      }
      ctx.restore(); // head
      ctx.restore(); // neck

      ctx.restore(); // calf
    },

    drawEye(ctx, x, y, DK) {
      const open = clamp(this.eyeOpen, 0, 1);
      if (open < 0.25) {
        // a happy closed curve (‿)
        ctx.strokeStyle = DK; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(x, y - 1, 3.6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
        return;
      }
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.ellipse(x, y, 4.4, 4.8 * open, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2E241C';
      ctx.beginPath(); ctx.ellipse(x + 0.4, y + 0.4, 3.2, 3.6 * open, 0, 0, TAU); ctx.fill();
      // catchlight
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath(); ctx.arc(x + 1.4, y - 1.4, 1.1, 0, TAU); ctx.fill();
      ctx.restore();
    },

    drawEar(ctx, x, y, side, DK) {
      // ear angle from the spring; each ear mirrors, with a small flick
      const a = this.earA * side;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.fillStyle = '#D7BC90';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(side * 12, -6, side * 9, -18);
      ctx.quadraticCurveTo(side * 3, -12, 0, 0);
      ctx.closePath(); ctx.fill();
      // inner ear (warm pink)
      ctx.fillStyle = alpha('#E6A79E', 0.8);
      ctx.beginPath();
      ctx.moveTo(side * 2, -3);
      ctx.quadraticCurveTo(side * 8, -7, side * 7, -15);
      ctx.quadraticCurveTo(side * 3, -11, side * 2, -3);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    },

    drawLegs(ctx, bodyY, legLen, sitK, front, DK, SH, t) {
      // two legs on the given side of the body; folded (sitting) or extended
      const baseX = front > 0 ? -24 : 30;
      for (let i = 0; i < 2; i++) {
        const lx = baseX + i * 16 * (front > 0 ? 1 : -1);
        ctx.save();
        ctx.translate(lx, bodyY + 18);
        if (sitK > 0.5) {
          // folded knee tucked under
          ctx.fillStyle = SH;
          ctx.beginPath();
          ctx.moveTo(-5, 0); ctx.quadraticCurveTo(-10, 8, 2, 12);
          ctx.quadraticCurveTo(10, 10, 6, 0); ctx.closePath(); ctx.fill();
          ctx.fillStyle = DK;
          ctx.beginPath(); ctx.ellipse(3, 12, 5, 3.4, 0, 0, TAU); ctx.fill();
        } else {
          // standing: a thin leg with a soft hoof, small walk sway on depart
          const sway = this.mode === 'depart' ? Math.sin(t * 8 + i * 2 + (front > 0 ? 0 : 1.5)) * 3 : 0;
          ctx.strokeStyle = SH; ctx.lineWidth = 7; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sway, legLen); ctx.stroke();
          ctx.fillStyle = DK;
          ctx.beginPath(); ctx.ellipse(sway, legLen + 1, 5, 3.2, 0, 0, TAU); ctx.fill();
        }
        ctx.restore();
      }
    },

    // ---- fireflies: ambient dusk motes + the your-turn light + celebration --
    drawFireflies(ctx, W, H, L) {
      // ambient drifting motes
      for (let i = 0; i < 7; i++) {
        const x = (i * 0.17 + 0.08) * W + Math.sin(this.t * 0.5 + i * 2.1) * 40;
        const y = L.gy - 40 - ((i * 61) % 130) + Math.sin(this.t * 0.9 + i) * 16;
        const bl = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(this.t * 3 + i * 1.7));
        this.mote(ctx, x, y, 2.2, alpha('#FFE9A8', 0.28 * bl));
      }
      // the your-turn firefly (brighter, with tiny wings), when out front
      const f = this.fly;
      if (f.k > 0.02) {
        this.drawFly(ctx, f.x, f.y, f.k);
      }
      // celebration motes swirling from the calf's warmth
      const cx = L.calfX, cy = L.calfY - 60 * L.sc;
      for (const m of this.motes) {
        const k = m.life / m.max;
        const fade = Math.sin(k * Math.PI);
        const mx = cx + Math.cos(m.a) * m.r;
        const my = cy - m.rise * k + Math.sin(m.a) * m.r * 0.5;
        this.mote(ctx, mx, my, 2 + m.sz * 2, alpha('#FFF0C0', 0.7 * fade));
      }
    },

    mote(ctx, x, y, r, col) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      g.addColorStop(0, col);
      g.addColorStop(1, alpha('#FFE9A8', 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r * 3, 0, TAU); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    },

    drawFly(ctx, x, y, k) {
      ctx.save();
      ctx.globalAlpha *= clamp(k, 0, 1);
      const blink = 0.7 + 0.3 * Math.sin(this.t * 5.2);
      const halo = ctx.createRadialGradient(x, y, 0.5, x, y, 18);
      halo.addColorStop(0, alpha('#FFF3C4', 0.7 * blink));
      halo.addColorStop(1, alpha('#FFF3C4', 0));
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(x, y, 18, 0, TAU); ctx.fill();
      // wings
      const flap = Math.sin(this.t * 21) * 0.7;
      ctx.fillStyle = alpha('#F7EFDA', 0.7);
      for (const s of [-1, 1]) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(s * (0.5 + flap * 0.4));
        ctx.beginPath(); ctx.ellipse(s * 3.4, -3.6, 4.6, 2.2, s * 0.8, 0, TAU); ctx.fill();
        ctx.restore();
      }
      // body
      const bg = ctx.createRadialGradient(x + 0.6, y - 0.8, 0.3, x, y, 4);
      bg.addColorStop(0, '#FFFBEA'); bg.addColorStop(1, '#F0C878');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(x, y, 3.8, 0, TAU); ctx.fill();
      // a soft downward nudge — "over here, your turn" — pulsing when waiting
      if (this.mode === 'wait') {
        const p = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(this.t * 3));
        ctx.strokeStyle = alpha('#FFE9A8', 0.5 * p);
        ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 5, y + 10); ctx.lineTo(x, y + 16); ctx.lineTo(x + 5, y + 10);
        ctx.stroke();
      }
      ctx.restore();
    },

    drawHome(ctx) {
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
      const x = sa.l + 34, y = sa.t * 0.5 + 30;
      if (typeof GOL.drawButton === 'function') { GOL.drawButton(ctx, x, y, 22, 'back', { alpha: 0.7 }); return; }
      // fallback (smoke / early boot): a small soft star-disc
      ctx.save();
      ctx.fillStyle = 'rgba(250,244,224,0.7)';
      ctx.beginPath(); ctx.arc(x, y, 22, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(122,98,56,0.7)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + 6, y - 8); ctx.lineTo(x - 7, y); ctx.lineTo(x + 6, y + 8); ctx.stroke();
      ctx.restore();
    },

    drawVignetteFallback(ctx, W, H, s) {
      const g = ctx.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(20,16,28,0)');
      g.addColorStop(1, 'rgba(20,16,28,' + s + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    },

    drawDebug(ctx, W, H) {
      const mic = GOL.QROOMS && GOL.QROOMS.mic;
      const lvl = mic ? mic.level : 0;
      const rung = this.lad ? this.lad.rung : '-';
      GOL.text(ctx, 'mode:' + this.mode + ' ayah:' + this.ayah + '/' + AYAHS +
        ' rung:' + rung + ' bowl:' + this.bowl.toFixed(2) +
        ' visits:' + (this.data.visits || 0) +
        ' mic:' + (mic ? (mic.available === false ? 'off' : (mic.gate ? 'open' : 'shut')) : 'n/a'),
        10, H - 26, { size: 11, weight: '700', color: 'rgba(255,255,255,0.7)', align: 'left', shadow: false });
      // mic level meter
      const bw = 160, bx = 10, by = H - 12;
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(bx, by, bw, 6);
      ctx.fillStyle = mic && mic.speaking ? 'rgba(120,230,150,0.9)' : 'rgba(240,200,120,0.8)';
      ctx.fillRect(bx, by, bw * clamp(lvl, 0, 1), 6);
    }
  };

  GOL.PROTOTYPES[22] = { key: 'hungry-camel', name: 'the hungry little camel', scene: 'hungryCamelLab' };
  GOL.registerScene('hungryCamelLab', lab);
})();
