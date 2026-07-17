// Quraysh learning-loop lab · P24 — the feast of the house
// Spec: v3/QURAYSH-PROTOTYPE-ROOMS.md §"Room 5 — The Feast of the House"
// Doctrine: v3/LEARNING-LOOPS-STRATEGY.md · shared plumbing: quraysh-rooms.js
// Direct: ?lab=24
//
// The terminal room of the Quraysh arc, and the one that INVERTS the game:
// nothing prompts, cues, or leads. A silent dawn courtyard before the House
// waits, and the CHILD begins. As they recite, the courtyard wakes FOLLOWING
// their voice — one awakening zone per ayah, left to right: the gates and a
// brazier (1), two high windows of snow-melt and sun (2), the House's own
// doors opening with light (3), and the feast itself — mats, bread, small
// creatures padding in, lanterns rising (4). The game helps ONLY on a stall,
// and only ever with more Quran, delivered as weather: a breeze carrying the
// first word, then the opening phrase, then the reciter warmly taking the
// whole ayah "together." An awakening is never revoked; braziers never cool;
// creatures never leave. All four awake → dawn floods and the reciter takes
// the surah once from the top as celebration, everything the child fed aglow.
//
// The awakening honestly rewards PARTICIPATION AND FLOW — sustained vocal
// activity (Level 1/2). It never judges correctness. No-mic → a listening
// feast: the firefly conducts, a tap performs the ayah, the room still gives
// the place. Never a locked door.
(function () {
  const GOL = window.GOL;
  const Q = GOL.QROOMS;
  const TAU = Math.PI * 2;
  const C = GOL.color;
  const alpha = C.alpha, tint = C.tint, shade = C.shade;

  const AYAHS = [1, 2, 3, 4];              // zone i teaches ayah i+1
  const ROOM = 'feast-house';

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function ease(v) { return v * v * (3 - 2 * v); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  // simple hex lerp for the long dawn light
  function mix(a, b, k) {
    k = clamp(k, 0, 1);
    const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
    const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
    const to = (n) => ('0' + Math.round(n).toString(16)).slice(-2);
    return '#' + to(lerp(pa[0], pb[0], k)) + to(lerp(pa[1], pb[1], k)) + to(lerp(pa[2], pb[2], k));
  }

  // -------------------------------------------------------------- geometry --
  // One source of truth so update() hit-tests exactly what draw() paints.
  function geo(W, H) {
    const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
    const q = { l: sa.l + 26, r: W - sa.r - 26, t: sa.t * 0.5 + 20, b: H - sa.b * 0.5 - 18 };
    const horizon = H * 0.52;
    const cx = (q.l + q.r) / 2;
    // The House: a plain noble cube of warm stone, sitting on the horizon.
    const houseW = Math.min(W * 0.30, 260);
    const houseH = houseW * 0.72;
    const house = { cx, top: horizon - houseH, w: houseW, h: houseH, ground: horizon, depth: houseW * 0.16 };
    // Four courtyard anchors, left→right — where the firefly rests and each
    // zone's brazier stands. Zone features are drawn where they belong (the
    // windows and doors ride the House itself); the anchor is the warm hearth.
    const fr = [0.13, 0.39, 0.62, 0.87];
    const cyY = H * 0.72;
    const anchors = fr.map((f, i) => ({
      x: q.l + (q.r - q.l) * f,
      y: cyY + Math.sin(f * Math.PI) * -10
    }));
    return { q, horizon, house, anchors, cx, cyY };
  }

  const lab = {
    // ---- lifecycle
    t: 0,
    started: false,          // first gesture taken (audio unlocked, mic asked)
    miced: null,             // null=asking, true=voice engine, false=listening feast
    resting: false,          // post-crescendo calm
    playing: false,          // reciter model is sounding → mic gated, no escalation

    zones: null,             // per-ayah awakening state
    active: 0,               // the zone the courtyard is waiting on
    fireflyT: 0,             // target zone index for the drifting firefly (fractional)
    fx: 0, fy: 0,            // firefly live position

    lad: null,               // the stall ladder for the active zone (voice path)
    ladRung: 0,              // rung the ladder currently sits at (for telemetry)
    sinceSpeech: 0,

    dawn: 0,                 // 0 pre-dawn → 1 full morning; follows what's awake
    crescendo: 0,            // 0..1 the final flood

    motes: null,             // drifting warm dust
    lanterns: null,          // rising feast lanterns
    saved: null,

    enter() {
      this.t = 0;
      this.started = false;
      this.miced = null;
      this.resting = false;
      this.playing = false;
      this.active = 0;
      this.fireflyT = 0;
      this.lad = null; this.ladRung = 0; this.sinceSpeech = 0;
      this.dawn = 0; this.crescendo = 0; this.crescendoStarted = false;

      // ayah durations from the real read-along timings → the flow target.
      this.zones = AYAHS.map((a) => {
        const ws = Q.words(a);
        const dur = ws.length ? ws[ws.length - 1].to : 5;
        return {
          ayah: a,
          dur,
          need: Math.max(1.6, dur * 0.6),   // ~60% of an ayah's speech = awake (generous)
          warmth: 0,
          glow: 0,                          // eased visible warmth (never falls)
          state: 'cold',                    // cold → glimmering → awake
          rung: -1,                         // telemetry: support needed (-1 none)
          evidence: null                    // 'flow' | 'together' | 'no-vocal'
        };
      });

      // Family-8 middle start: a child who needed little help last time is
      // sometimes woken mid-courtyard (begin from the House threshold).
      this.saved = Q.load(ROOM);
      if (this.saved && Array.isArray(this.saved.rungs)) {
        const done = this.saved.rungs.filter((r) => r != null && r >= 0);
        const avg = done.length ? done.reduce((s, r) => s + r, 0) / done.length : 9;
        if (avg <= 1 && Math.random() < 0.5) {
          // zones 1 & 2 (ayah 1,2) are remembered awake; begin at zone 3.
          for (let i = 0; i < 2; i++) { this.zones[i].state = 'awake'; this.zones[i].glow = 0.82; this.zones[i].warmth = this.zones[i].need; }
          this.active = 2;
          this.fireflyT = 2;
        }
      }

      const g = geo(800, 450);
      this.fx = g.cx; this.fy = g.cyY - 40;

      this.motes = [];
      for (let i = 0; i < 40; i++) {
        this.motes.push({
          x: Math.random(), y: Math.random(),
          s: 0.4 + Math.random() * 0.9, ph: Math.random() * TAU,
          drift: 0.15 + Math.random() * 0.25
        });
      }
      this.lanterns = [];

      Q.log(ROOM, 'enter', { middleStart: this.active === 2 });
    },

    exit() {
      // Stop only OUR audio; leave the shared mic running for the next room.
      if (Q.stopSlice) Q.stopSlice();
      if (GOL.audio && GOL.audio.stopRecitation) GOL.audio.stopRecitation();
    },

    // --------------------------------------------------------------- input --
    firstGesture() {
      this.started = true;
      if (GOL.audio && GOL.audio.unlock) GOL.audio.unlock();
      Q.mic.gate = true;
      Q.mic.request((ok) => {
        this.miced = !!ok;
        Q.log(ROOM, 'mic', { available: !!ok });
      });
    },

    update(dt, W, H) {
      this.t += dt;
      const g = geo(W, H);

      // motes & lanterns drift regardless of state
      for (const m of this.motes) {
        m.y -= dt * m.drift * 0.06;
        if (m.y < -0.05) { m.y = 1.05; m.x = Math.random(); }
      }
      for (let i = this.lanterns.length - 1; i >= 0; i--) {
        const L = this.lanterns[i];
        L.y -= dt * L.rise;
        L.sway += dt;
        if (L.y < -60) this.lanterns.splice(i, 1);
      }

      // the firefly eases toward its target zone (or center at idle)
      const targetX = this.started ? g.anchors[clamp(Math.round(this.fireflyT), 0, 3)].x : g.cx;
      const targetY = this.started ? g.anchors[clamp(Math.round(this.fireflyT), 0, 3)].y - 46 : g.cyY - 40;
      this.fx += (targetX - this.fx) * Math.min(1, dt * 2.4);
      this.fy += (targetY - this.fy + Math.sin(this.t * 1.6) * 4) * Math.min(1, dt * 2.4);

      // ---- taps: home star always; otherwise gesture / fallback conduct
      const home = { x: g.q.l + 26, y: g.q.t + 20, r: 30 };
      for (const tap of GOL.Input.taps) {
        if (tap.ui) continue;
        if (GOL.dist(tap.x, tap.y, home.x, home.y) < home.r) {
          tap.ui = true;
          if (GOL.audio) GOL.audio.sfx('tap');
          GOL.go('title');
          return;
        }
        tap.ui = true;
        if (!this.started) { this.firstGesture(); continue; }
        // In the listening feast, a tap performs the active zone's ayah.
        if (this.miced === false && !this.playing && !this.resting) {
          this.performActive('no-vocal');
        }
      }

      // ---- awakening logic
      if (this.started && !this.resting) {
        if (this.miced === true) this.updateVoice(dt, g);
        // ease each zone's visible glow up toward its warmth/state (never down)
        for (const z of this.zones) {
          let tgt = z.state === 'awake' ? 1 : (z.state === 'glimmering' ? 0.35 + 0.45 * clamp(z.warmth / z.need, 0, 1) : 0.06 + 0.2 * clamp(z.warmth / z.need, 0, 1));
          z.glow = Math.max(z.glow, z.glow + (tgt - z.glow) * Math.min(1, dt * 2.2));
        }
        // all awake → crescendo (once)
        if (!this.crescendoStarted && this.zones.every((z) => z.state === 'awake')) {
          this.beginCrescendo();
        }
      }

      // dawn follows how much of the courtyard is alive
      const awakeFrac = this.zones.reduce((s, z) => s + z.glow, 0) / 4;
      this.dawn += (Math.max(awakeFrac, this.crescendo) - this.dawn) * Math.min(1, dt * 1.5);
      if (this.crescendoStarted) this.crescendo += (1 - this.crescendo) * Math.min(1, dt * 0.8);
    },

    // The child leads; the game follows and only helps on a stall.
    updateVoice(dt, g) {
      const z = this.zones[this.active];
      if (!z || z.state === 'awake') return;
      if (this.playing) return;              // his voice is sounding; wait, don't escalate

      const mic = Q.mic;
      if (mic.speaking) {
        // participation & flow warm the CURRENT zone; short breaths are fine.
        this.sinceSpeech = 0;
        z.warmth += dt * (0.7 + 0.5 * clamp(mic.level, 0, 1));
        if (z.state === 'cold' && z.warmth >= z.need * 0.28) {
          z.state = 'glimmering';
          if (GOL.audio) GOL.audio.sfx('nearby');
        }
        // the child took the lead → retire the support ladder, note the rung
        if (this.lad) { z.rung = this.lad.rung; this.lad = null; }
        if (z.warmth >= z.need) this.awaken(this.active, 'flow');
      } else {
        this.sinceSpeech += dt;
        if (!this.lad && z.warmth < z.need) this.armLadder(this.active);
        if (this.lad) this.lad.update(dt);
      }
    },

    // The stall ladder, delivered as weather. Armed whenever the active zone
    // is waiting with no speech; every rung is more Quran, never a rebuke.
    armLadder(i) {
      const z = this.zones[i];
      const a = z.ayah;
      this.lad = Q.ladder({
        delays: [3.2, 4.2, 4.6],
        rungs: [
          () => { /* rung 0 — the silent wait; the firefly is the only cue */ },
          () => this.breeze('firstWord', i),   // rung 1 — first word from inside the House
          () => this.breeze('phrase', i),      // rung 2 — opening phrase + the zone glimmers ahead
          () => this.together(i)               // rung 3 — the reciter takes this whole ayah
        ],
        onExhausted: () => { /* rung 3 (together) awakens the zone in its onend */ }
      });
      this.lad.arm();
    },

    // A breeze carries a cue from within the House. Gate the mic while it
    // sounds (speakers would self-trigger), reopen when it fades.
    breeze(kind, i) {
      const z = this.zones[i];
      this.playing = true;
      Q.mic.gate = false;
      const done = () => { this.playing = false; Q.mic.gate = true; };
      if (GOL.audio) GOL.audio.sfx('drift');
      if (kind === 'firstWord') {
        Q.firstWord(z.ayah, { vol: 0.45, onend: done });
      } else {
        if (z.state === 'cold') z.state = 'glimmering';   // the way ahead shimmers
        Q.openingPhrase(z.ayah, { vol: 0.6, onend: done });
      }
    },

    // "Let's hear this part together" — the reciter warmly takes the whole
    // ayah; the zone awakens fully to HIS voice, identical to the child's.
    together(i) {
      const z = this.zones[i];
      this.playing = true;
      Q.mic.gate = false;
      z.rung = 3;
      Q.playAyah(z.ayah, () => {
        this.playing = false;
        Q.mic.gate = true;
        this.lad = null;
        this.awaken(i, 'together');
      });
    },

    // Listening-feast (no mic): a tap performs the active ayah, the zone
    // awakens to his voice, and the firefly conducts onward.
    performActive(evidence) {
      const i = this.active;
      const z = this.zones[i];
      if (!z || z.state === 'awake') return;
      this.playing = true;
      Q.mic.gate = false;
      Q.playAyah(z.ayah, () => {
        this.playing = false;
        this.awaken(i, evidence || 'no-vocal');
      });
    },

    // A zone comes fully to life — never revoked. Confirm softly, log the
    // honest evidence, drift the firefly on to the next stretch for the child.
    awaken(i, evidence) {
      const z = this.zones[i];
      if (z.state === 'awake') return;
      z.state = 'awake';
      z.warmth = Math.max(z.warmth, z.need);
      z.evidence = evidence;
      // telemetry rung: no-vocal counts as full support (won't earn a middle
      // start next time); a voice awakening with no cue used is independent (0)
      if (evidence === 'no-vocal') z.rung = 3;
      else if (z.rung < 0) z.rung = 0;
      if (GOL.audio) GOL.audio.sfx(evidence === 'flow' ? 'blossom' : 'settle');
      // zone 4 lands the feast: creatures pad in, lanterns lift
      if (i === 3) this.landFeast();
      Q.log(ROOM, 'zone-awake', { zone: i, ayah: z.ayah, rung: z.rung, evidence });
      this.persist();
      // advance the lead to the next un-awake zone
      const next = this.zones.findIndex((zz) => zz.state !== 'awake');
      if (next >= 0) { this.active = next; this.fireflyT = next; }
      this.lad = null; this.sinceSpeech = 0;
    },

    landFeast() {
      for (let k = 0; k < 4; k++) {
        this.lanterns.push({ x: 0.28 + k * 0.16 + (Math.random() - 0.5) * 0.05, y: 1.0 + k * 0.05, rise: 14 + Math.random() * 8, sway: Math.random() * TAU, hue: k });
      }
    },

    persist() {
      Q.save(ROOM, {
        rungs: this.zones.map((z) => (z.state === 'awake' ? z.rung : null)),
        visits: (this.saved && this.saved.visits || 0) + 1
      });
    },

    // All four awake → the reciter takes the surah once, from the top, as
    // celebration (not correction) while everything the child fed glows.
    beginCrescendo() {
      this.crescendoStarted = true;
      this.playing = true;
      Q.mic.gate = false;
      if (GOL.audio) GOL.audio.sfx('praise');
      // fill the sky with lanterns for the feast
      for (let k = 0; k < 6; k++) {
        this.lanterns.push({ x: 0.16 + k * 0.13, y: 1.05 + Math.random() * 0.3, rise: 12 + Math.random() * 10, sway: Math.random() * TAU, hue: k });
      }
      const chain = (n) => {
        if (n > 4) { this.playing = false; Q.mic.gate = true; this.resting = true; Q.log(ROOM, 'crescendo-done', {}); return; }
        Q.playAyah(n, () => chain(n + 1));
      };
      Q.log(ROOM, 'crescendo', {});
      chain(1);
    },

    // ================================================================ draw ==
    draw(ctx, W, H) {
      const g = geo(W, H);
      this.drawSky(ctx, W, H, g);
      this.drawHills(ctx, W, H, g);
      this.drawHouse(ctx, W, H, g);
      this.drawCourtyard(ctx, W, H, g);
      this.drawZoneFeatures(ctx, W, H, g);
      this.drawFeast(ctx, W, H, g);
      this.drawLanterns(ctx, W, H, g);
      this.drawMotes(ctx, W, H, g);
      // the firefly — the same your-turn signifier as Room 3 (props.js may be
      // absent in the headless smoke harness, so guard it)
      if (GOL.drawFirefly) {
        if (this.resting) {
          GOL.drawFirefly(ctx, g.cx + Math.cos(this.t * 0.5) * g.house.w * 0.5, g.cyY - 30 + Math.sin(this.t * 1.1) * 12, this.t, 1.0);
        } else {
          GOL.drawFirefly(ctx, this.fx, this.fy, this.t, 1.15);
        }
      }

      // home star (p16/p18 leaving idiom), quiet at top-left
      this.drawHomeStar(ctx, g);
      GOL.drawVignette(ctx, W, H, 0.16 * (1 - this.dawn * 0.5));

      if (GOL.DEBUG) this.drawDebug(ctx, W, H, g);
    },

    drawSky(ctx, W, H, g) {
      const d = this.dawn;
      const sky = ctx.createLinearGradient(0, 0, 0, g.horizon + 40);
      sky.addColorStop(0, mix('#1C2540', '#3E5F86', d));
      sky.addColorStop(0.55, mix('#33324E', '#8FA9C0', d));
      sky.addColorStop(1, mix('#5A4A5A', '#F6D79A', d));
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, g.horizon + 40);

      // fading stars (calm, deterministic)
      const starA = clamp(0.5 - d * 0.6, 0, 0.5);
      if (starA > 0.01) {
        for (let i = 0; i < 46; i++) {
          const x = (i * 131.7 + 30) % W;
          const y = 12 + ((i * 67.3 + 19) % (g.horizon * 0.7));
          const tw = 0.5 + 0.5 * Math.sin(this.t * 0.8 + i * 1.7);
          ctx.fillStyle = 'rgba(255,246,220,' + (starA * (0.4 + tw * 0.5)) + ')';
          ctx.beginPath(); ctx.arc(x, y, i % 7 === 0 ? 1.3 : 0.8, 0, TAU); ctx.fill();
        }
      }

      // the rising sun's long warm light behind the House
      const glowY = g.horizon - 6;
      const sunR = (0.28 + d * 0.55) * W;
      const sg = ctx.createRadialGradient(g.cx, glowY, 8, g.cx, glowY, sunR);
      sg.addColorStop(0, 'rgba(255,241,205,' + (0.18 + d * 0.5) + ')');
      sg.addColorStop(0.4, 'rgba(255,214,150,' + (0.1 + d * 0.28) + ')');
      sg.addColorStop(1, 'rgba(255,214,150,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, W, g.horizon + 60);

      // long dawn god-rays as the morning breaks
      if (d > 0.35) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const ra = (d - 0.35) * 0.14;
        for (let i = 0; i < 5; i++) {
          const ang = -Math.PI / 2 + (i - 2) * 0.26 + Math.sin(this.t * 0.2 + i) * 0.02;
          ctx.save();
          ctx.translate(g.cx, glowY);
          ctx.rotate(ang);
          const rg = ctx.createLinearGradient(0, 0, 0, -H);
          rg.addColorStop(0, 'rgba(255,235,190,' + ra + ')');
          rg.addColorStop(1, 'rgba(255,235,190,0)');
          ctx.fillStyle = rg;
          ctx.fillRect(-24 - i * 4, -H, 48 + i * 8, H);
          ctx.restore();
        }
        ctx.restore();
      }
    },

    drawHills(ctx, W, H, g) {
      const d = this.dawn;
      const far = mix('#2C3A48', '#B7C79C', d);
      const near = mix('#243449', '#93B084', d);
      ctx.fillStyle = far;
      ctx.beginPath();
      ctx.moveTo(0, g.horizon);
      for (let x = 0; x <= W; x += 26) ctx.lineTo(x, g.horizon - 14 - Math.sin(x * 0.006 + 1.3) * 12);
      ctx.lineTo(W, g.horizon); ctx.closePath(); ctx.fill();
      ctx.fillStyle = near;
      ctx.beginPath();
      ctx.moveTo(0, g.horizon + 6);
      for (let x = 0; x <= W; x += 22) ctx.lineTo(x, g.horizon - 2 - Math.sin(x * 0.009 + 4) * 8);
      ctx.lineTo(W, g.horizon + 6); ctx.closePath(); ctx.fill();
    },

    // The House — a plain, noble cube of warm stone that never changes; its
    // windows (zone 2) and doors (zone 3) wake with the child's voice.
    drawHouse(ctx, W, H, g) {
      const P = GOL.PALETTES.quraysh;
      const h = g.house;
      const left = h.cx - h.w / 2;
      const d = this.dawn;
      ctx.save();

      // shade footprint
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = mix('#20303C', (P.stoneDark || '#9C9A82'), d);
      ctx.beginPath();
      ctx.ellipse(h.cx + h.depth * 0.4, h.ground + 6, h.w * 0.62, 12, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;

      // right depth face
      ctx.fillStyle = mix('#33414E', (P.stoneShade || '#BFBCA2'), d);
      ctx.beginPath();
      ctx.moveTo(left + h.w, h.top);
      ctx.lineTo(left + h.w + h.depth, h.top - h.depth * 0.5);
      ctx.lineTo(left + h.w + h.depth, h.ground - h.depth * 0.5);
      ctx.lineTo(left + h.w, h.ground);
      ctx.closePath(); ctx.fill();

      // roof
      ctx.fillStyle = mix('#3E4C5A', (P.mist || '#E2E8DC'), d);
      ctx.beginPath();
      ctx.moveTo(left, h.top);
      ctx.lineTo(left + h.depth, h.top - h.depth * 0.5);
      ctx.lineTo(left + h.w + h.depth, h.top - h.depth * 0.5);
      ctx.lineTo(left + h.w, h.top);
      ctx.closePath(); ctx.fill();

      // front face — plain warm stone
      ctx.fillStyle = mix('#2E3B49', (P.stone || '#DFDCC8'), d);
      ctx.fillRect(left, h.top, h.w, h.h);

      // the single gold band, the House's one adornment
      const bandY = h.top + h.h * 0.16;
      ctx.fillStyle = mix('#6E5A34', (P.gold || '#E8C382'), d);
      ctx.fillRect(left, bandY, h.w, h.h * 0.07);
      ctx.fillStyle = mix('#4E3E22', (P.goldDeep || '#C9A050'), d);
      ctx.fillRect(left, bandY + h.h * 0.07, h.w, Math.max(2, h.h * 0.014));

      ctx.restore();
    },

    // Zone features that ride the House: two high windows (ayah 2), the doors
    // (ayah 3). Zone 1's gate arch stands at the courtyard's left edge.
    drawZoneFeatures(ctx, W, H, g) {
      const h = g.house;
      const left = h.cx - h.w / 2;

      // ---- zone 1 (ayah 1): the gate arch + first brazier at the left
      this.drawGate(ctx, g, this.zones[0].glow);

      // ---- zone 2 (ayah 2): two high windows — snow-melt light & sun stream
      const w2 = this.zones[1].glow;
      const wy = h.top + h.h * 0.34;
      const ww = h.w * 0.15, wh = h.h * 0.3;
      const wx = [left + h.w * 0.24, left + h.w * 0.61];
      // cool window (winter snow-melt) then warm (summer sun)
      const cols = [['#B9D6E4', '#7FB0C8'], ['#FFE4A6', '#F1B45E']];
      for (let k = 0; k < 2; k++) {
        ctx.save();
        // recess
        ctx.fillStyle = 'rgba(30,34,40,' + (0.55 - w2 * 0.2) + ')';
        this.archPath(ctx, wx[k], wy, ww, wh);
        ctx.fill();
        if (w2 > 0.02) {
          const glow = ctx.createLinearGradient(wx[k], wy - wh, wx[k], wy);
          glow.addColorStop(0, alpha(cols[k][0], 0.35 + w2 * 0.55));
          glow.addColorStop(1, alpha(cols[k][1], 0.2 + w2 * 0.5));
          ctx.fillStyle = glow;
          this.archPath(ctx, wx[k], wy, ww * 0.82, wh * 0.86);
          ctx.fill();
          // light spilling onto the wall
          ctx.globalCompositeOperation = 'lighter';
          const spill = ctx.createRadialGradient(wx[k], wy - wh * 0.3, 2, wx[k], wy - wh * 0.3, ww * 2.4);
          spill.addColorStop(0, alpha(cols[k][0], w2 * 0.3));
          spill.addColorStop(1, alpha(cols[k][0], 0));
          ctx.fillStyle = spill;
          ctx.beginPath(); ctx.arc(wx[k], wy - wh * 0.3, ww * 2.4, 0, TAU); ctx.fill();
        }
        ctx.restore();
      }

      // ---- zone 3 (ayah 3): the House doors open with light
      const w3 = this.zones[2].glow;
      const dw = h.w * 0.26, dh = h.h * 0.5;
      const dcx = h.cx, dTop = h.ground - dh;
      const open = ease(clamp(w3, 0, 1));       // doors swing wide as it wakes
      ctx.save();
      // the bright doorway behind the leaves
      const dg = ctx.createLinearGradient(dcx, dTop, dcx, h.ground);
      dg.addColorStop(0, alpha('#FFF3CE', 0.2 + w3 * 0.7));
      dg.addColorStop(1, alpha('#F3C878', 0.15 + w3 * 0.6));
      ctx.fillStyle = w3 > 0.02 ? dg : 'rgba(26,28,32,0.7)';
      this.doorPath(ctx, dcx, dTop, dw, dh);
      ctx.fill();
      // light spilling out across the courtyard step
      if (w3 > 0.05) {
        ctx.globalCompositeOperation = 'lighter';
        const spill = ctx.createRadialGradient(dcx, h.ground, 4, dcx, h.ground, dw * 3);
        spill.addColorStop(0, alpha('#FFE7A6', w3 * 0.34));
        spill.addColorStop(1, alpha('#FFE7A6', 0));
        ctx.fillStyle = spill;
        ctx.beginPath(); ctx.ellipse(dcx, h.ground + 4, dw * 3, dw * 1.2, 0, 0, TAU); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      // the two door leaves, ajar by `open`
      const P = GOL.PALETTES.quraysh;
      const leafCol = mix('#3A2E22', (P.goldDeep || '#C9A050'), this.dawn * 0.5);
      for (const s of [-1, 1]) {
        ctx.save();
        ctx.translate(dcx + s * dw * 0.5, dTop);
        ctx.transform(1, 0, s * -open * 0.5, 1, 0, 0);
        ctx.fillStyle = leafCol;
        ctx.fillRect(s < 0 ? -dw * 0.5 : 0, 0, dw * 0.5, dh);
        ctx.strokeStyle = alpha('#2A2016', 0.5); ctx.lineWidth = 1.5;
        ctx.strokeRect(s < 0 ? -dw * 0.5 : 0, 0, dw * 0.5, dh);
        ctx.restore();
      }
      ctx.restore();

      // ---- braziers at each courtyard anchor (the universal warmth signifier)
      for (let i = 0; i < 4; i++) {
        this.drawBrazier(ctx, g.anchors[i].x, g.anchors[i].y, this.zones[i].glow);
      }
    },

    archPath(ctx, cx, baseY, w, h) {
      const l = cx - w / 2, r = cx + w / 2, topY = baseY - h;
      ctx.beginPath();
      ctx.moveTo(l, baseY);
      ctx.lineTo(l, topY + w / 2);
      ctx.arc(cx, topY + w / 2, w / 2, Math.PI, 0);
      ctx.lineTo(r, baseY);
      ctx.closePath();
    },
    doorPath(ctx, cx, topY, w, h) {
      const l = cx - w / 2, r = cx + w / 2;
      ctx.beginPath();
      ctx.moveTo(l, topY + h);
      ctx.lineTo(l, topY + w / 2);
      ctx.arc(cx, topY + w / 2, w / 2, Math.PI, 0);
      ctx.lineTo(r, topY + h);
      ctx.closePath();
    },

    drawGate(ctx, g, glow) {
      const x = g.q.l + 20;
      const baseY = g.cyY + 6;
      const gh = 78, gw = 40;
      const P = GOL.PALETTES.quraysh;
      ctx.save();
      // two posts + lintel of warm stone
      ctx.fillStyle = mix('#2C3948', (P.stone || '#DFDCC8'), this.dawn);
      ctx.fillRect(x - gw / 2 - 6, baseY - gh, 10, gh);
      ctx.fillRect(x + gw / 2 - 4, baseY - gh, 10, gh);
      ctx.fillRect(x - gw / 2 - 8, baseY - gh - 8, gw + 18, 12);
      // the gate stands OPEN — a warm slot of light widening with the zone
      if (glow > 0.02) {
        const lg = ctx.createLinearGradient(x, baseY - gh, x, baseY);
        lg.addColorStop(0, alpha('#FFE9A8', 0.2 + glow * 0.5));
        lg.addColorStop(1, alpha('#F0C878', 0.1 + glow * 0.4));
        ctx.fillStyle = lg;
        ctx.fillRect(x - gw / 2, baseY - gh + 4, gw, gh - 4);
      }
      ctx.restore();
    },

    // A brazier bowl on a low post; cold ember → low flicker → full flame.
    drawBrazier(ctx, x, y, glow) {
      ctx.save();
      const postH = 20, bowlW = 16;
      // post
      ctx.fillStyle = 'rgba(58,46,34,0.9)';
      ctx.fillRect(x - 3, y, 6, postH);
      // bowl
      ctx.fillStyle = '#5A4632';
      ctx.beginPath(); ctx.ellipse(x, y, bowlW / 2, 5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3A2E22';
      ctx.beginPath(); ctx.ellipse(x, y + 1.5, bowlW / 2 - 2, 3, 0, 0, TAU); ctx.fill();
      if (glow > 0.03) {
        // flame — height & warmth follow glow
        const fl = 8 + glow * 26;
        const flick = 0.85 + 0.15 * Math.sin(this.t * 12 + x);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const fg = ctx.createRadialGradient(x, y - fl * 0.4, 1, x, y - fl * 0.4, fl * 1.6);
        fg.addColorStop(0, alpha('#FFF3C4', 0.6 * glow));
        fg.addColorStop(0.5, alpha('#FFC864', 0.4 * glow));
        fg.addColorStop(1, alpha('#F0902A', 0));
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.arc(x, y - fl * 0.4, fl * 1.6, 0, TAU); ctx.fill();
        ctx.restore();
        // flame tongue
        ctx.fillStyle = alpha('#FFD070', 0.85 * glow);
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 2);
        ctx.quadraticCurveTo(x - 3, y - fl * flick, x, y - fl * flick - 3);
        ctx.quadraticCurveTo(x + 3, y - fl * flick, x + 5, y - 2);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = alpha('#FFF3D0', 0.9 * glow);
        ctx.beginPath();
        ctx.moveTo(x - 2.4, y - 3);
        ctx.quadraticCurveTo(x, y - fl * 0.7 * flick, x + 2.4, y - 3);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    },

    drawCourtyard(ctx, W, H, g) {
      const d = this.dawn;
      const floor = ctx.createLinearGradient(0, g.horizon, 0, H);
      floor.addColorStop(0, mix('#2A3A3A', '#CDB489', d));
      floor.addColorStop(0.5, mix('#25322E', '#C1A87C', d));
      floor.addColorStop(1, mix('#1E2A26', '#A98F63', d));
      ctx.fillStyle = floor;
      ctx.fillRect(0, g.horizon, W, H - g.horizon);
      // faint paving seams for depth
      ctx.strokeStyle = alpha('#000000', 0.05 + d * 0.05);
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        const y = g.horizon + (H - g.horizon) * (i / 5);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
    },

    // The feast (ayah 4): mats, bread, small creatures padding in to eat.
    drawFeast(ctx, W, H, g) {
      const z = this.zones[3];
      const lit = z.glow;
      if (lit < 0.02 && !this.crescendoStarted) return;
      const P = GOL.PALETTES.quraysh;
      const baseY = H * 0.86;
      ctx.save();
      // three or four mats spread across the foreground
      const mats = [g.q.l + (g.q.r - g.q.l) * 0.28, g.cx, g.q.l + (g.q.r - g.q.l) * 0.72];
      for (let m = 0; m < mats.length; m++) {
        const mx = mats[m], my = baseY + (m === 1 ? 10 : 0);
        ctx.globalAlpha = clamp(lit * 1.3, 0, 1);
        // mat
        ctx.fillStyle = mix('#3A2E22', '#C98A4E', this.dawn);
        ctx.beginPath(); ctx.ellipse(mx, my, 34, 12, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = alpha('#7A4A24', 0.5); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(mx, my, 34, 12, 0, 0, TAU); ctx.stroke();
        // rounds of bread
        for (let b = 0; b < 3; b++) {
          const bx = mx - 14 + b * 14, by = my - 2 - (b % 2) * 2;
          ctx.fillStyle = mix('#4A3A28', '#EBC888', this.dawn);
          ctx.beginPath(); ctx.ellipse(bx, by, 6, 4, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = alpha('#FFF3D0', 0.4 * lit);
          ctx.beginPath(); ctx.ellipse(bx - 1, by - 1, 2.4, 1.4, 0, 0, TAU); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // creature cameos padding in to eat — reuse the bestiary; they arrive as
      // the zone wakes and NEVER leave. A bird, two tortoises, a butterfly.
      const arrive = ease(clamp(lit * 1.2, 0, 1));
      const off = (1 - arrive) * 120;
      if ((lit > 0.05 || this.crescendoStarted) && GOL.drawBird) {
        GOL.drawBird(ctx, mats[0] - 24 + off, baseY + 6, this.t, P, { phase: 1, pecking: lit > 0.6, facing: 1, col: '#C99A5E' });
        GOL.drawTortoise(ctx, mats[1] - 30 - off, baseY + 20, this.t, P, 1);
        GOL.drawTortoise(ctx, mats[2] + 30 + off, baseY + 18, this.t, P, -1);
        if (GOL.drawButterfly) GOL.drawButterfly(ctx, mats[2] - 6 + off * 0.5, baseY - 34 + Math.sin(this.t * 1.4) * 8, this.t, 2, '#F0B0C0', '#F5D08A');
      }
      ctx.restore();
    },

    drawLanterns(ctx, W, H, g) {
      for (const L of this.lanterns) {
        const x = g.q.l + (g.q.r - g.q.l) * L.x + Math.sin(L.sway * 1.2) * 6;
        const y = H * L.y;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const gr = ctx.createRadialGradient(x, y, 1, x, y, 22);
        gr.addColorStop(0, 'rgba(255,224,150,0.6)');
        gr.addColorStop(1, 'rgba(255,224,150,0)');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(x, y, 22, 0, TAU); ctx.fill();
        ctx.restore();
        // lantern body
        ctx.fillStyle = 'rgba(255,214,120,0.92)';
        ctx.beginPath(); ctx.ellipse(x, y, 5, 7, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(160,110,50,0.7)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x, y - 12); ctx.stroke();
      }
    },

    drawMotes(ctx, W, H, g) {
      const a = 0.1 + this.dawn * 0.28;
      for (const m of this.motes) {
        const x = m.x * W + Math.sin(this.t * 0.4 + m.ph) * 10;
        const y = m.y * (H - g.horizon * 0.4) + g.horizon * 0.4;
        const tw = 0.5 + 0.5 * Math.sin(this.t * 1.3 + m.ph);
        ctx.fillStyle = 'rgba(255,240,200,' + (a * tw * m.s) + ')';
        ctx.beginPath(); ctx.arc(x, y, m.s * 1.4, 0, TAU); ctx.fill();
      }
    },

    drawHomeStar(ctx, g) {
      const x = g.q.l + 26, y = g.q.t + 20;
      ctx.save();
      ctx.fillStyle = 'rgba(250,244,224,0.16)';
      ctx.beginPath(); ctx.arc(x, y, 20, 0, TAU); ctx.fill();
      GOL.star8(ctx, x, y, 9, Math.PI / 8 + this.t * 0.1, 'rgba(245,237,212,0.7)');
      ctx.restore();
    },

    drawDebug(ctx, W, H, g) {
      const mic = Q.mic;
      // mic level meter
      const mx = g.q.r - 130, my = g.q.t + 8;
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(mx, my, 120, 10);
      ctx.fillStyle = mic.speaking ? '#8CE08C' : '#E0C864';
      ctx.fillRect(mx, my, 120 * clamp(mic.level, 0, 1), 10);
      const mode = this.miced === true ? 'voice' : (this.miced === false ? 'listen-feast' : 'asking');
      GOL.text(ctx, 'mode:' + mode + ' active:' + this.active + (this.lad ? ' rung:' + this.lad.rung : ''),
        mx + 60, my + 26, { size: 10, weight: '700', color: '#F5EDD4' });
      for (let i = 0; i < 4; i++) {
        const z = this.zones[i];
        GOL.text(ctx, 'z' + i + ' ' + z.state[0] + ' ' + z.warmth.toFixed(1) + '/' + z.need.toFixed(1),
          g.anchors[i].x, g.anchors[i].y + 30, { size: 9, weight: '700', color: '#F5EDD4' });
      }
    }
  };

  GOL.PROTOTYPES[24] = { key: 'feast-house', name: 'the feast of the house', scene: 'feastHouseLab' };
  GOL.registerScene('feastHouseLab', lab);
})();
