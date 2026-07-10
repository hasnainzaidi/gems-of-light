// Gems of Light — kawthar.js
// Surat Al-Kawthar, end-to-end, in the painterly pipeline:
// wander the garden → three ayah gems (one across the spring stones, one
// behind the waterfall) → each collection is a small ceremony with the real
// recitation → set the gems in order at the arch → hear it whole → walk
// through into the light.
// Generated gouache assets carry the look; code carries motion and light.
// arch.png / spring.png are optional — painted placeholders stand in until
// they exist in assets/paint/proc/.
(function () {
  const K = (window.KAWTHAR = {});

  // ------------------------------------------------------------- data -----
  const SURAH = {
    name: 'Al-Kawthar', ar: 'الكوثر',
    verses: [
      { n: 1, ar: 'إِنَّآ أَعْطَيْنَـٰكَ ٱلْكَوْثَرَ', tr: 'innā aʿṭaynāka l-kawthara', meaning: 'We gave you, dear Prophet, Al-Kawthar — endless, endless good.' },
      { n: 2, ar: 'فَصَلِّ لِرَبِّكَ وَٱنْحَرْ', tr: 'faṣalli lirabbika wa-inḥar', meaning: 'So pray to your Lord, and give in thanks.' },
      { n: 3, ar: 'إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ', tr: 'inna shāniʾaka huwa l-abtaru', meaning: 'The one who hates you — he is the one cut off.' }
    ]
  };
  const AUDIO_LOCAL = 'audio/';
  const AUDIO_REMOTE = 'https://everyayah.com/data/Alafasy_128kbps/';
  const vfile = (n) => '108' + String(n).padStart(3, '0') + '.mp3';

  // ------------------------------------------------------------- assets ---
  const FILES = {
    bgFar: 'assets/paint/proc/bg-far.png',
    bgMid: 'assets/paint/proc/bg-mid.png',
    wall: 'assets/paint/proc/wall.png',
    groundFill: 'assets/paint/proc/ground-fill.png',
    platform: 'assets/paint/proc/platform.png',
    tree: 'assets/paint/proc/tree-olive.png',
    plant0: 'assets/paint/proc/plant-0.png',
    plant1: 'assets/paint/proc/plant-1.png',
    plant2: 'assets/paint/proc/plant-2.png',
    gem1: 'assets/paint/proc/gem-1.png',
    gem2: 'assets/paint/proc/gem-2.png',
    gem3: 'assets/paint/proc/gem-3.png',
    llIdle: 'assets/paint/proc/ll-idle.png',
    llWalkA: 'assets/paint/proc/ll-walk-a.png',
    llWalkB: 'assets/paint/proc/ll-walk-b.png',
    llJump: 'assets/paint/proc/ll-jump.png',
    llCollect: 'assets/paint/proc/ll-collect.png',
    fringe: 'assets/paint/proc/grass-fringe.png'
  };
  const OPTIONAL = {
    arch: 'assets/paint/proc/arch.png',
    spring: 'assets/paint/proc/spring.png'
  };
  K.FILES = FILES;
  K.OPTIONAL = OPTIONAL;

  // ------------------------------------------------------------- world ----
  const GY = 560;                 // walkable ground line
  const WY = GY + 64;             // water surface in the pools
  const WORLD_W = 5400;
  // pools are single-jump gaps now: leap them clean, catch the gem mid-air
  const POOLS = [{ x0: 1780, x1: 2080 }, { x0: 3200, x1: 3500 }];
  const STONES = [];               // no stepping path — the spring is a leap
  const PLAT1 = { x: 1030, w: 440, y: GY - 190 };  // gem-1 shelf
  const SLAB = { x: 3160, w: 430, y: GY - 296 };   // old aqueduct, above jump reach
  const FALL_X = 3350;                              // waterfall veil center
  const ARCH_X = 4980;
  const GEMS = [
    { n: 1, x: PLAT1.x + PLAT1.w / 2, y: PLAT1.y - 128 },
    { n: 2, x: 1930, y: GY - 245 },                 // riding the arc over the spring
    { n: 3, x: FALL_X, y: GY - 245 }                // behind the falling water
  ];
  const SPRITE_H = 118;

  // surfaces you can stand on
  const SURFACES = [
    { x0: 0, x1: POOLS[0].x0, y: GY },
    { x0: POOLS[0].x1, x1: POOLS[1].x0, y: GY },
    { x0: POOLS[1].x1, x1: WORLD_W, y: GY },
    { x0: PLAT1.x, x1: PLAT1.x + PLAT1.w, y: PLAT1.y },
    { x0: SLAB.x, x1: SLAB.x + SLAB.w, y: SLAB.y },
    ...STONES.map((s) => ({ x0: s.x - s.w / 2, x1: s.x + s.w / 2, y: s.y }))
  ];
  function floorAt(px, py) {
    let f = Infinity;
    for (const s of SURFACES) {
      if (px >= s.x0 - 8 && px <= s.x1 + 8 && py <= s.y + 48 && s.y < f) f = s.y;
    }
    return f;
  }
  K.hasFloor = (px) => floorAt(px, GY) < Infinity;

  // ------------------------------------------------------------- state ----
  const S = {
    img: null, W: 1180, H: 720, t: 0,
    px: 240, py: GY, vx: 0, vy: 0, grounded: true, facing: 1, moving: false,
    stepT: 0, camX: 0, fx: [],
    found: [],                    // ayah numbers collected
    ceremony: null,               // {verse, t, phase}
    rescue: null,                 // water rescue {t, fromX, fromY, toX}
    mode: 'play',                 // play | order | recite | open | walk | done
    order: null,                  // {gems:[{n,x,y,homeX,homeY,placed,drift}], sockets, held}
    reciteI: -1, openT: 0, walkT: 0, doneT: 0,
    input: { left: false, right: false, jump: false },
    drag: null,                   // {x,y} world coords while pointer down
    demo: false, muted: false
  };
  K.state = S;

  // The world is composed for a fixed design height (as v1 was); the canvas
  // scales to fit any window, so the camera never reveals undesigned ground.
  const DESIGN_H = 800;
  K.init = function (images, viewportW, viewportH) {
    S.img = images;
    S.scale = viewportH / DESIGN_H;
    S.W = viewportW / S.scale;
    S.H = DESIGN_H;
  };

  // ------------------------------------------------------------- audio ----
  // iOS Safari only allows audio playback that starts synchronously inside
  // a real user-gesture handler; every recitation here is actually kicked
  // off later, from the game loop (once the character reaches a gem/arch).
  // So the very first tap must "unlock" the page: create + resume the
  // AudioContext, and — the part that matters most — successfully .play()
  // a real <audio> element once, which tells Safari the whole page may
  // play media from here on, even from calls with no gesture behind them.
  let audioUnlocked = false;
  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state !== 'running') AC.resume().catch(() => {});
    } catch (e) {}
    try {
      // a 0.05s silent WAV — no asset needed, just to prime <audio> playback
      const rate = 8000, n = 400;
      const bytes = new Uint8Array(44 + n * 2);
      const dv = new DataView(bytes.buffer);
      const wr = (o, s) => { for (let i = 0; i < s.length; i++) bytes[o + i] = s.charCodeAt(i); };
      wr(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); wr(8, 'WAVEfmt ');
      dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
      dv.setUint32(24, rate, true); dv.setUint32(28, rate * 2, true);
      dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
      wr(36, 'data'); dv.setUint32(40, n * 2, true);
      let b64 = '';
      for (let i = 0; i < bytes.length; i++) b64 += String.fromCharCode(bytes[i]);
      const el = new Audio('data:audio/wav;base64,' + btoa(b64));
      el.volume = 0.01;
      const p = el.play();
      if (p && p.catch) p.catch(() => { audioUnlocked = false; });
    } catch (e) {}
  }
  K.unlockAudio = unlockAudio;

  let currentAudio = null;
  function playVerse(n, onend) {
    if (S.muted || typeof Audio === 'undefined') { if (onend) setTimeout(onend, 1200); return; }
    stopAudio();
    const tryPlay = (src, fallback) => {
      const a = new Audio(src);
      currentAudio = a;
      a.addEventListener('ended', () => { if (onend) onend(); });
      a.addEventListener('error', () => { if (fallback) fallback(); else if (onend) onend(); });
      const p = a.play();
      if (p && p.catch) p.catch(() => { if (fallback) fallback(); else if (onend) onend(); });
    };
    tryPlay(AUDIO_LOCAL + vfile(n), () => tryPlay(AUDIO_REMOTE + vfile(n), null));
  }
  function stopAudio() {
    if (currentAudio) { try { currentAudio.pause(); } catch (e) {} currentAudio = null; }
  }
  // gentle chime (WebAudio, optional)
  let AC = null;
  function chime(i) {
    if (S.muted) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99];
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = 'sine'; o.frequency.value = notes[i % 3];
      g.gain.setValueAtTime(0.0001, AC.currentTime);
      g.gain.exponentialRampToValueAtTime(0.12, AC.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + 0.9);
      o.connect(g); g.connect(AC.destination);
      o.start(); o.stop(AC.currentTime + 1);
    } catch (e) {}
  }

  // --------------------------------------------------------------- fx -----
  const rnd = (a, b) => a + Math.random() * (b - a);
  function spawn(type, x, y, o) {
    const p = { type, x, y, age: 0, ...(o || {}) };
    if (type === 'mote') Object.assign(p, { vx: rnd(-8, 8), vy: rnd(-6, -2), life: rnd(4, 7), size: rnd(1.4, 3) });
    if (type === 'leaf') Object.assign(p, { vx: rnd(-18, 4), vy: rnd(10, 24), life: rnd(4, 7), size: rnd(4, 7), spin: rnd(1, 3), ph: rnd(0, 7) });
    if (type === 'sparkle') Object.assign(p, { vx: rnd(-24, 24), vy: rnd(-40, -6), life: rnd(0.5, 1.1), size: rnd(2, 4) });
    if (type === 'burst') Object.assign(p, { life: rnd(0.7, 1.2), size: rnd(2.5, 5) });
    if (type === 'splash') Object.assign(p, { vx: rnd(-60, 60), vy: rnd(-180, -60), life: rnd(0.4, 0.8), size: rnd(2, 4.5), grav: 420 });
    S.fx.push(p);
  }

  // ------------------------------------------------------------- update ---
  K.tick = function (dt) {
    S.t += dt;
    const inp = S.input;

    if (S.demo) pilot(inp);

    // ---- ceremony (collect moment)
    if (S.ceremony) {
      const c = S.ceremony;
      c.t += dt;
      S.vx = 0; S.moving = false;
      if (Math.random() < dt * 24) spawn('sparkle', S.px + rnd(-40, 40), S.py - 60 + rnd(-50, 50));
      if (c.phase === 'fly' && c.t > 0.8) { c.phase = 'recite'; c.t = 0; playVerse(c.verse.n, () => (c.audioDone = true)); }
      else if (c.phase === 'recite' && ((c.audioDone && c.t > 1.4) || c.t > 14)) { c.phase = 'settle'; c.t = 0; }
      else if (c.phase === 'settle' && c.t > 0.7) S.ceremony = null;
      updateFx(dt); updateCam(dt);
      return;
    }
    // ---- water rescue: the spring lifts you gently back
    if (S.rescue) {
      const r = S.rescue;
      r.t += dt / 1.3;
      const e = 1 - Math.pow(1 - Math.min(1, r.t), 3);
      S.px = r.fromX + (r.toX - r.fromX) * e;
      S.py = r.fromY + (GY - r.fromY) * e - Math.sin(Math.PI * Math.min(1, r.t)) * 60;
      if (Math.random() < dt * 20) spawn('sparkle', S.px + rnd(-20, 20), S.py + rnd(-30, 10), { col: '#CFEDE0' });
      if (r.t >= 1) { S.rescue = null; S.vy = 0; S.grounded = true; }
      updateFx(dt); updateCam(dt);
      return;
    }

    // ---- ordering / recite / open / walk / done at the arch
    if (S.mode !== 'play') { updateArchModes(dt); updateFx(dt); updateCam(dt); return; }

    // ---- normal movement (tuned to the larger painted character:
    // brisk walk, light held-rise, a floaty apex, a firmer fall — v1's feel)
    const acc = 1600, max = 340;
    if (inp.left) { S.vx = Math.max(S.vx - acc * dt, -max); S.facing = -1; }
    else if (inp.right) { S.vx = Math.min(S.vx + acc * dt, max); S.facing = 1; }
    else S.vx *= Math.pow(0.000001, dt);
    S.moving = Math.abs(S.vx) > 30;
    // coyote time + edge-triggered jump
    S._coyote = S.grounded ? 0.12 : Math.max(0, (S._coyote || 0) - dt);
    if (inp.jump && !S._jumpLatch && S._coyote > 0) {
      S.vy = -880; S.grounded = false; S._coyote = 0;
    }
    S._jumpLatch = inp.jump;
    let grav;
    if (S.vy < -60) grav = inp.jump ? 1450 : 2300;   // rising: lighter while held
    else if (S.vy < 90) grav = 820;                   // the generous apex
    else grav = 1950;                                 // falling, with more hang
    S.vy = Math.min(780, S.vy + grav * dt);
    S.px = Math.max(80, Math.min(WORLD_W - 80, S.px + S.vx * dt));
    S.py += S.vy * dt;
    S.grounded = false;
    const fy = floorAt(S.px, S.py);
    if (fy < Infinity && S.py >= fy && S.vy >= 0) { S.py = fy; S.vy = 0; S.grounded = true; }
    // fell into a pool → splash, then the water carries you back
    if (S.py > WY + 26) {
      for (let i = 0; i < 14; i++) spawn('splash', S.px, WY + 4);
      const pool = POOLS.find((p) => S.px > p.x0 - 30 && S.px < p.x1 + 30) || POOLS[0];
      S.rescue = { t: 0, fromX: S.px, fromY: WY + 10, toX: pool.x0 - 70 };
      S.vx = 0; S.vy = 0;
      return;
    }
    if (S.moving && S.grounded) S.stepT += dt; else S.stepT = 0;

    // a caught gem waits for the landing, then the world hushes
    if (S.pendingCeremony && S.grounded) {
      S.ceremony = { verse: S.pendingCeremony.verse, t: 0, phase: 'fly', gem: S.pendingCeremony.gem, audioDone: false };
      S.pendingCeremony = null;
      S.vx = 0;
    }

    // gems
    for (const g of GEMS) {
      if (S.found.includes(g.n)) continue;
      if (Math.hypot(S.px - g.x, (S.py - 70) - g.y) < 108) {
        S.found.push(g.n);
        // hold the ceremony until Lightling has landed — no freezing mid-air
        S.pendingCeremony = { verse: SURAH.verses[g.n - 1], gem: g };
        chime(g.n - 1);
        for (let i = 0; i < 22; i++) {
          const a = (i / 22) * Math.PI * 2;
          spawn('burst', g.x, g.y, { vx: Math.cos(a) * rnd(40, 150), vy: Math.sin(a) * rnd(40, 150) });
        }
      }
    }
    // the arch: begins the ordering when every gem is found
    if (S.found.length === 3 && S.px > ARCH_X - 150) {
      S.mode = 'order';
      S.px = Math.min(S.px, ARCH_X - 400); S.facing = 1;
      S.vx = 0; S.moving = false;
      const shuffled = [2, 3, 1];  // never spells the answer
      S.order = {
        gems: shuffled.map((n, i) => ({
          n, placed: -1, drift: null, ph: rnd(0, 7),
          homeX: ARCH_X - 690 + i * 165 + rnd(-14, 14),
          homeY: 170 + (i % 2) * 85 + rnd(-10, 10),
          x: 0, y: 0
        })),
        sockets: [0, 1, 2].map((i) => ({ i, x: ARCH_X - 150 + i * 130, y: GY - 102 })),
        held: null, autoT: 0, attempts: 0
      };
    }
    updateFx(dt); updateCam(dt);
  };

  function updateArchModes(dt) {
    if (S.mode === 'order') {
      const O = S.order;
      for (const g of O.gems) {
        if (g.placed >= 0) { const s = O.sockets[g.placed]; g.x = s.x; g.y = s.y + 4; continue; }
        if (g.drift) {
          g.drift.t += dt / 0.7;
          const e = 1 - Math.pow(1 - Math.min(1, g.drift.t), 3);
          g.x = g.drift.fromX + (g.homeX - g.drift.fromX) * e;
          g.y = g.drift.fromY + (g.homeY - g.drift.fromY) * e;
          if (g.drift.t >= 1) g.drift = null;
          continue;
        }
        if (O.held === g && S.drag) { g.x = S.drag.x; g.y = S.drag.y; continue; }
        g.x = g.homeX + Math.sin(S.t * 0.7 + g.ph) * 12;
        g.y = g.homeY + Math.sin(S.t * 0.9 + g.ph * 1.7) * 9;
      }
      // demo: gems find their own places, one a second
      if (S.demo) {
        O.autoT += dt;
        if (O.autoT > 1.0) {
          O.autoT = 0;
          const need = [1, 2, 3].find((n) => !O.gems.some((g) => g.placed === n - 1));
          if (need) placeGem(O.gems.find((g) => g.n === need), O.sockets[need - 1]);
        }
      }
      return;
    }
    if (S.mode === 'recite') {
      // dt-driven so it works both in-browser and headless
      if (S.reciteI === -1) {
        S.reciteI = 0; S.reciteT = 0; S._verseEnded = false;
        playVerse(SURAH.verses[0].n, () => (S._verseEnded = true));
      } else {
        S.reciteT += dt;
        if ((S._verseEnded && S.reciteT > 0.4) || S.reciteT > 12) {
          S.reciteI++;
          if (S.reciteI >= SURAH.verses.length) { S.mode = 'open'; S.openT = 0; return; }
          S.reciteT = 0; S._verseEnded = false;
          playVerse(SURAH.verses[S.reciteI].n, () => (S._verseEnded = true));
        }
      }
      return;
    }
    if (S.mode === 'open') {
      S.openT = Math.min(1, S.openT + dt / 1.6);
      if (Math.random() < dt * 18) spawn('sparkle', ARCH_X + rnd(-70, 70), GY - rnd(40, 260), { col: '#FFE9A8' });
      if (S.openT >= 1) { S.mode = 'walk'; S.walkT = 0; }
      return;
    }
    if (S.mode === 'walk') {
      S.walkT += dt;
      S.moving = true; S.facing = 1; S.stepT += dt;
      S.px += 190 * dt;
      if (S.walkT > 2.6) { S.mode = 'done'; S.doneT = 0; S.moving = false; }
      return;
    }
    if (S.mode === 'done') { S.doneT += dt; }
  }

  function placeGem(g, socket) {
    const O = S.order;
    if (!g || O.gems.some((o) => o.placed === socket.i)) return;
    if (g.n === socket.i + 1) {
      g.placed = socket.i; g.drift = null;
      chime(socket.i);
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        spawn('burst', socket.x + Math.cos(a) * 16, socket.y + Math.sin(a) * 12, { vx: Math.cos(a) * 40, vy: Math.sin(a) * 40 - 30 });
      }
      if (O.gems.every((o) => o.placed >= 0)) beginRecite();
    } else {
      O.attempts++;
      g.drift = { t: 0, fromX: g.x, fromY: g.y };
    }
  }
  K.placeGem = placeGem;

  function beginRecite() {
    S.mode = 'recite';
    S.reciteI = -1;   // the recite handler in updateArchModes takes it from here
  }

  // pointer interaction during ordering (pick up / release over sockets)
  K.pointerDown = function (wx, wy) {
    if (S.mode !== 'order') return;
    const O = S.order;
    for (const g of O.gems) {
      if (g.placed < 0 && !g.drift && Math.hypot(wx - g.x, wy - g.y) < 56) { O.held = g; break; }
    }
    // tapping a gem replays its ayah
    if (!O.held) {
      for (const g of O.gems) {
        if (Math.hypot(wx - g.x, wy - g.y) < 56) playVerse(g.n, null);
      }
    }
  };
  K.pointerUp = function (wx, wy) {
    if (S.mode !== 'order' || !S.order.held) return;
    const g = S.order.held;
    S.order.held = null;
    const s = S.order.sockets.find((s2) => Math.hypot(wx - s2.x, wy - s2.y) < 60);
    if (s) placeGem(g, s);
    else g.drift = { t: 0, fromX: g.x, fromY: g.y };
  };

  function updateFx(dt) {
    if (Math.random() < dt * 3) spawn('mote', S.camX + Math.random() * S.W, rnd(S.H * 0.15, S.H * 0.75));
    if (Math.random() < dt * 0.5) spawn('leaf', S.camX + Math.random() * S.W, -10);
    for (let i = S.fx.length - 1; i >= 0; i--) {
      const p = S.fx[i];
      p.age += dt;
      if (p.age >= p.life) { S.fx.splice(i, 1); continue; }
      p.vy = (p.vy || 0) + (p.grav || (p.type === 'sparkle' ? -14 : p.type === 'burst' ? 26 : 0)) * dt;
      p.x += (p.vx || 0) * dt + (p.type === 'leaf' ? Math.sin(p.age * p.spin * 2 + p.ph) * 26 * dt : 0);
      p.y += (p.vy || 0) * dt;
    }
  }
  function updateCam(dt) {
    const focus = S.mode === 'play' || S.mode === 'walk' || S.mode === 'done' ? S.px + S.facing * 90 : ARCH_X - 40;
    const target = Math.max(0, Math.min(WORLD_W - S.W, focus - S.W / 2));
    S.camX += (target - S.camX) * Math.min(1, dt * (S.mode === 'play' ? 4 : 1.6));
  }

  // demo pilot: walks the whole surah, hands-free (for headless renders)
  function pilot(inp) {
    inp.left = inp.right = false; inp.jump = false;
    if (S.ceremony || S.rescue || S.mode !== 'play') return;
    inp.right = true;
    // hold the jump while rising, the way a child would
    if (!S.grounded) { if (S.vy < 0) inp.jump = true; return; }
    // hop onto the gem-1 shelf
    if (S.px > PLAT1.x - 130 && S.px < PLAT1.x - 40 && S.py >= GY - 1 && !S.found.includes(1)) inp.jump = true;
    // gap-ahead detection: jump any time the ground disappears in front
    const ahead = S.px + 70;
    if (floorAt(ahead, S.py) === Infinity || floorAt(ahead, S.py) > S.py + 20) inp.jump = true;
    // hold the jump while rising, the way a child would
    if (!S.grounded && S.vy < 0) inp.jump = true;
  }

  // -------------------------------------------------------------- draw ----
  let grain = null;
  function grainTile(mk) {
    if (grain) return grain;
    grain = mk(256, 256);
    const x = grain.getContext('2d');
    let s = 4242;
    const r = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let i = 0; i < 420; i++) {
      x.fillStyle = r() < 0.5 ? 'rgba(120,100,60,' + (0.02 + r() * 0.035) + ')' : 'rgba(255,252,238,' + (0.02 + r() * 0.04) + ')';
      x.beginPath();
      x.ellipse(r() * 256, r() * 256, 0.6 + r() * 1.6, 0.5 + r() * 1.2, r() * Math.PI, 0, Math.PI * 2);
      x.fill();
    }
    return grain;
  }
  const gemImg = (n) => S.img['gem' + n];

  K.draw = function (ctx, makeCanvas) {
    const { img } = S, W = S.W, H = S.H, t = S.t, cam = S.camX;
    ctx.save();
    ctx.scale(S.scale || 1, S.scale || 1);

    // ---------- backdrop
    {
      const im = img.bgFar;
      const sc = Math.max(W / im.width, H / im.height) * 1.06;
      ctx.drawImage(im, -cam * 0.04 - (im.width * sc - W) * 0.3, H - im.height * sc, im.width * sc, im.height * sc);
    }
    drawRays(ctx, W, H, t);
    {
      const im = img.bgMid, sc = 0.68;
      for (const ox of [-140, 1400, 2940, 4480]) {
        const dx = ox - cam * 0.2;
        if (dx > -im.width * sc && dx < W + 40) ctx.drawImage(im, dx, GY - 118 - im.height * sc * 0.62, im.width * sc, im.height * sc);
      }
    }

    // ---------- world
    ctx.save();
    ctx.translate(-cam, 0);

    // ground strips (skipping the pools)
    drawGround(ctx, img, cam, W, H);
    // pools: water first (behind stones), banks carved into the strip edge
    for (const p of POOLS) drawPool(ctx, img, p, t);
    // stepping stones
    for (const s of STONES) drawStone(ctx, img, s);

    // props, back to front
    const prop = (im, x, baseY, h, flip) => {
      const sc = h / im.height, w2 = im.width * sc;
      ctx.save(); ctx.translate(x, baseY);
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(im, -w2 / 2, -h, w2, h);
      ctx.restore();
    };
    const shadow = (x, y, w2) => {
      const sg = ctx.createRadialGradient(x, y + 4, 2, x, y + 4, w2);
      sg.addColorStop(0, 'rgba(52,72,50,0.16)'); sg.addColorStop(1, 'rgba(52,72,50,0)');
      ctx.save(); ctx.translate(x, y + 4); ctx.scale(1, 0.14); ctx.translate(-x, -(y + 4));
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(x, y + 4, w2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    };
    shadow(700, GY + 6, 170);  prop(img.tree, 700, GY + 34, 560);
    shadow(4340, GY + 6, 170); prop(img.tree, 4340, GY + 34, 540, true);
    shadow(430, GY, 80);   prop(img.plant1, 430, GY + 6, 150);
    shadow(1000, GY, 95);  prop(img.plant0, 1000, GY + 6, 140);
    shadow(1620, GY, 70);  prop(img.plant2, 1620, GY + 6, 135, true);
    shadow(2520, GY, 80);  prop(img.plant1, 2520, GY + 6, 145, true);
    shadow(2760, GY, 90);  prop(img.plant2, 2760, GY + 6, 140);
    shadow(3900, GY, 95);  prop(img.plant0, 3900, GY + 6, 150, true);
    shadow(4620, GY, 80);  prop(img.plant1, 4620, GY + 6, 140);
    shadow(5300, GY, 95);  prop(img.plant0, 5300, GY + 6, 150);

    // shelves
    drawShelf(ctx, img, PLAT1);
    drawShelf(ctx, img, SLAB);

    // the arch (image if provided, painted placeholder otherwise)
    drawArch(ctx, img, t);

    // ordering furniture
    if (S.mode !== 'play') drawSockets(ctx, t);

    // gems in the world
    for (const g of GEMS) {
      if (S.found.includes(g.n)) continue;
      drawGem(ctx, gemImg(g.n), g.x, g.y + Math.sin(t * 1.4 + g.n) * 9, 62, t, 1);
      if (Math.random() < 0.08) spawn('sparkle', g.x + rnd(-24, 24), g.y + rnd(-30, 30));
    }
    // ordering gems float above the courtyard
    if (S.mode === 'order' || S.mode === 'recite' || S.mode === 'open' || S.mode === 'walk') {
      for (const g of S.order.gems) {
        const hot = S.mode === 'recite' && S.reciteI === g.placed;
        drawGem(ctx, gemImg(g.n), g.x, g.y, g.placed >= 0 ? (hot ? 76 : 62) : 86, t, g.placed >= 0 ? 0.8 : 1.5);
      }
    }

    // the waterfall veils gem 3
    drawWaterfall(ctx, FALL_X, SLAB.y + 10, 64, GY + 40 - SLAB.y, t);

    // Lightling
    drawHero(ctx, img, t);

    // particles
    drawFx(ctx);
    ctx.restore();

    // ---------- interface
    if (S.mode === 'play') drawHud(ctx, W, t); // at the arch the gems live on the bench
    if (S.ceremony && S.ceremony.phase !== 'fly') {
      // fade in during recite, fade out through settle — one smooth arc
      const cAlpha = S.ceremony.phase === 'settle'
        ? Math.max(0, 1 - S.ceremony.t / 0.45)
        : Math.min(1, S.ceremony.t / 0.4);
      drawVerseCard(ctx, W, H, S.ceremony.verse, cAlpha);
    }
    if (S.mode === 'recite' && S.reciteI >= 0 && S.reciteI < 3) drawVerseCard(ctx, W, H, SURAH.verses[S.reciteI], 1);
    if (S.mode === 'order') drawBanner(ctx, W, 'set the gems in the order of the surah', 'drag each gem to its place · tap one to hear its ayah again');
    if (S.mode === 'open' || S.mode === 'walk') drawBanner(ctx, W, 'Al-Kawthar — whole and in order', 'walk through');
    if (S.ceremony) {
      const c = S.ceremony;
      const k = c.phase === 'fly' ? Math.min(1, c.t / 0.5) : c.phase === 'settle' ? Math.max(0, 1 - c.t / 0.6) : 1;
      ctx.fillStyle = 'rgba(34,53,42,' + 0.34 * k + ')';
      ctx.fillRect(0, 0, W, H);
      // the gem held up in the hush, easing away with the veil
      const gx = W / 2, gy = H * 0.14;
      ctx.save();
      ctx.globalAlpha = k;
      drawGem(ctx, gemImg(c.gem.n), gx, gy, 92, t, k);
      ctx.restore();
    }
    if (S.mode === 'walk' || S.mode === 'done') {
      const k = S.mode === 'done' ? 1 : Math.min(1, S.walkT / 2.6);
      ctx.fillStyle = 'rgba(255,246,208,' + 0.5 * k * k + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (S.mode === 'done') drawDone(ctx, W, H);

    // grain + vignette
    const gt = grainTile(makeCanvas);
    ctx.save(); ctx.globalAlpha = 0.5;
    for (let x = 0; x < W; x += 256) for (let y = 0; y < H; y += 256) ctx.drawImage(gt, x, y);
    ctx.restore();
    const v = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(30,43,34,0)'); v.addColorStop(1, 'rgba(30,43,34,0.18)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  };

  // ---------- draw helpers ----------
  function drawRays(ctx, W, H, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const sx = W * 0.86, sy = H * 0.14;
    for (let i = 0; i < 4; i++) {
      const a = Math.PI * 0.6 + i * 0.1 + Math.sin(t * 0.13 + i * 1.7) * 0.012;
      const len = H * 1.4;
      const g = ctx.createLinearGradient(sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len);
      g.addColorStop(0, 'rgba(255,243,196,' + (0.05 + 0.025 * Math.sin(t * 0.4 + i * 2.1)) + ')');
      g.addColorStop(1, 'rgba(255,243,196,0)');
      ctx.fillStyle = g;
      const wid = 0.05 + 0.02 * Math.sin(t * 0.21 + i);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(a - wid) * len, sy + Math.sin(a - wid) * len);
      ctx.lineTo(sx + Math.cos(a + wid) * len, sy + Math.sin(a + wid) * len);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function drawGround(ctx, img, cam, W, H) {
    // one pre-baked seamless wall slice, scaled so the masonry reads at a
    // believable size beside the character (~40px brick courses)
    const im = img.wall, sc = 0.36;
    const tw = im.width * sc;
    const x0 = Math.floor(cam / tw) * tw;
    ctx.save();
    // the wall and its coping run continuously — the basin painting sits on
    // top and covers its own junction, so there is nothing to carve
    ctx.beginPath();
    ctx.rect(cam - 8, GY - 60, W + 16, H);
    ctx.clip();
    for (let x = x0; x < cam + W; x += tw) {
      ctx.drawImage(im, x, GY, tw, im.height * sc);
    }
    // the coping ledge crowning the wall: color-matched to the masonry,
    // capped by moss, grounded by its own cast shadow on the wall face
    const fr = img.fringe, fsc = 58 / fr.height;
    const fw = fr.width * fsc * 0.84;
    // cast shadow of the overhang, drawn first along the whole wall face
    const shl = ctx.createLinearGradient(0, GY + 30, 0, GY + 52);
    shl.addColorStop(0, 'rgba(90,78,48,0.34)');
    shl.addColorStop(1, 'rgba(90,78,48,0)');
    ctx.fillStyle = shl;
    ctx.fillRect(cam - 8, GY + 30, W + 16, 24);
    let k = Math.floor(cam / fw);
    for (let x = Math.floor(cam / fw) * fw; x < cam + W + fw; x += fw, k++) {
      const jx = ((k * 53) % 13) - 6;
      ctx.save();
      if (k % 2) { ctx.translate(x + jx + fr.width * fsc / 2, 0); ctx.scale(-1, 1); ctx.translate(-(x + jx + fr.width * fsc / 2), 0); }
      ctx.drawImage(fr, x + jx, GY - 22, fr.width * fsc, fr.height * fsc);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawPool(ctx, img, p, t) {
    const span = p.x1 - p.x0, cx = (p.x0 + p.x1) / 2;
    const waterLine = GY + 22;   // painted waterline sits just under the bank lip
    // the wall runs flush behind; the basin bulges proud of it and lays
    // its own soft shadow on the masonry beneath its belly
    ctx.save();
    ctx.translate(cx, GY + 150);
    ctx.scale(1, 0.34);
    const cast = ctx.createRadialGradient(0, 0, 8, 0, 0, span * 0.66);
    cast.addColorStop(0, 'rgba(52,62,42,0.4)');
    cast.addColorStop(0.7, 'rgba(52,62,42,0.18)');
    cast.addColorStop(1, 'rgba(52,62,42,0)');
    ctx.fillStyle = cast;
    ctx.beginPath(); ctx.arc(0, 0, span * 0.66, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (img.spring) {
      // the painted basin, its waterline seated on the bank line
      const im = img.spring, sc = (span + 170) / im.width;
      const dy = waterLine - 300 * sc;   // art's water surface sits ~300px into the painting
      ctx.drawImage(im, cx - (im.width * sc) / 2, dy, im.width * sc, im.height * sc);
      // living light on the painted water, clipped to the basin
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, waterLine + 10 * sc, span * 0.46, 34 * sc + 14, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = 'rgba(220,245,232,0.5)';
      ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const sx = p.x0 + ((i * 137 + t * 26) % Math.max(1, span));
        const sy = waterLine + 2 + (i % 3) * 9;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + 12, sy - 2, sx + 26, sy); ctx.stroke();
      }
      // slow breathing sheen
      const sh = ctx.createRadialGradient(cx + Math.sin(t * 0.5) * span * 0.2, waterLine + 6, 4, cx, waterLine + 8, span * 0.4);
      sh.addColorStop(0, 'rgba(235,250,240,' + (0.1 + 0.05 * Math.sin(t * 1.3)) + ')');
      sh.addColorStop(1, 'rgba(235,250,240,0)');
      ctx.fillStyle = sh;
      ctx.fillRect(p.x0, waterLine - 24, span, 70);
      // occasional dragonfly-touch ripple ring
      const rp = (t * 0.4 + p.x0 * 0.001) % 1;
      if (rp < 0.6) {
        ctx.strokeStyle = 'rgba(220,245,232,' + 0.4 * (1 - rp / 0.6) + ')';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(cx - span * 0.18, waterLine + 8, 6 + rp * 60, (6 + rp * 60) * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }
    // ---- placeholder pool (no spring.png yet)
    const g = ctx.createLinearGradient(0, WY, 0, WY + 260);
    g.addColorStop(0, 'rgba(132,198,178,0.92)');
    g.addColorStop(1, 'rgba(64,140,128,0.95)');
    ctx.fillStyle = g;
    ctx.fillRect(p.x0, WY, span, 300);
    ctx.strokeStyle = 'rgba(203,236,220,0.95)';
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let x = p.x0; x <= p.x1; x += 10) {
      const yy = WY + Math.sin(x * 0.05 + t * 2.2) * 1.8;
      x === p.x0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }

  function drawStone(ctx, img, s) {
    const im = img.platform;
    const sc = (s.w * 1.9) / im.width;
    ctx.drawImage(im, s.x - (im.width * sc) / 2, s.y - 150 * sc, im.width * sc, im.height * sc);
  }

  function drawShelf(ctx, img, P) {
    const im = img.platform;
    const sc = P.w / (im.width * 0.94);
    const w = im.width * sc, h = im.height * sc;
    ctx.drawImage(im, P.x + P.w / 2 - w / 2, P.y - 150 * sc, w, h);
    ctx.fillStyle = 'rgba(52,72,50,0.12)';
    ctx.beginPath(); ctx.ellipse(P.x + P.w / 2, GY + 8, P.w * 0.4, 13, 0, 0, Math.PI * 2); ctx.fill();
  }

  function drawArch(ctx, img, t) {
    const open = S.mode === 'open' || S.mode === 'walk' || S.mode === 'done' ? S.openT : S.mode === 'recite' ? 0.1 : 0;
    const glow = S.found.length === 3 ? 0.4 + 0.25 * Math.sin(t * 2) + open * 0.6 : 0.08;
    // light within
    const g = ctx.createRadialGradient(ARCH_X, GY - 140, 6, ARCH_X, GY - 140, 260);
    g.addColorStop(0, 'rgba(255,233,168,' + 0.55 * glow + ')');
    g.addColorStop(1, 'rgba(255,233,168,0)');
    ctx.fillStyle = g;
    ctx.fillRect(ARCH_X - 280, GY - 420, 560, 460);
    if (img.arch) {
      const im = img.arch, hgt = 430, sc = hgt / im.height, w = im.width * sc;
      // doors opening = brighten the interior through the painted doors
      ctx.drawImage(im, ARCH_X - w / 2, GY + 10 - hgt, w, hgt);
      if (open > 0.02) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const ig = ctx.createRadialGradient(ARCH_X, GY - 130, 4, ARCH_X, GY - 130, 150);
        ig.addColorStop(0, 'rgba(255,240,190,' + 0.8 * open + ')');
        ig.addColorStop(1, 'rgba(255,240,190,0)');
        ctx.fillStyle = ig;
        ctx.fillRect(ARCH_X - 160, GY - 320, 320, 340);
        ctx.restore();
      }
      return;
    }
    // ---- painted placeholder (swapped out when arch.png exists)
    const W2 = 320, H2 = 400, inW = 150, inH = 270;
    ctx.save();
    ctx.translate(ARCH_X, GY + 6);
    const archPath = (w, h) => {
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2, -h + w * 0.42);
      ctx.quadraticCurveTo(-w / 2, -h, 0, -h);
      ctx.quadraticCurveTo(w / 2, -h, w / 2, -h + w * 0.42);
      ctx.lineTo(w / 2, 0); ctx.closePath();
    };
    // interior
    const ig = ctx.createLinearGradient(0, -inH, 0, 0);
    ig.addColorStop(0, open > 0 ? 'rgba(255,238,180,1)' : '#6E5F49');
    ig.addColorStop(1, open > 0 ? 'rgba(255,246,208,1)' : '#8A7A5F');
    ctx.fillStyle = ig;
    archPath(inW, inH); ctx.fill();
    // doors
    if (open < 0.97) {
      const leaf = (inW / 2) * (1 - open);
      ctx.save(); archPath(inW, inH); ctx.clip();
      ctx.fillStyle = '#8C6D50';
      ctx.fillRect(-inW / 2, -inH, leaf, inH);
      ctx.fillRect(inW / 2 - leaf, -inH, leaf, inH);
      ctx.strokeStyle = 'rgba(111,84,65,0.6)'; ctx.lineWidth = 2;
      for (const sde of [-1, 1]) for (let i = 1; i < 3; i++) {
        const lx = sde * (inW / 2 - leaf) + sde * (leaf / 3) * i;
        ctx.beginPath(); ctx.moveTo(lx, -inH); ctx.lineTo(lx, 0); ctx.stroke();
      }
      ctx.restore();
    }
    // frame
    ctx.fillStyle = '#E5D8B2';
    archPath(W2 * 0.72, H2 * 0.78);
    archPath(inW + 8, inH + 6);
    ctx.fill('evenodd');
    ctx.strokeStyle = 'rgba(169,151,113,0.5)'; ctx.lineWidth = 2;
    archPath(W2 * 0.72, H2 * 0.78); ctx.stroke();
    // moss + rosette
    ctx.fillStyle = 'rgba(111,165,91,0.85)';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.ellipse(i * 34, -H2 * 0.78 + Math.abs(i) * 12 + 6, 16 - Math.abs(i) * 3, 7, 0, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(238,198,124,' + (0.75 + 0.25 * Math.sin(t * 2)) + ')';
    ctx.save();
    for (let k2 = 0; k2 < 2; k2++) {
      ctx.save(); ctx.translate(0, -inH - 42); ctx.rotate(Math.PI / 8 + (k2 * Math.PI) / 4);
      ctx.fillRect(-13, -13, 26, 26); ctx.restore();
    }
    ctx.restore();
    ctx.restore();
  }

  function drawSockets(ctx, t) {
    const O = S.order;
    if (!O || !S.img.platform) return;
    // the settings bench is the painted stone shelf itself, resting on the
    // ground before the arch, its mossy top holding the three sockets
    const im = S.img.platform;
    const cx = (O.sockets[0].x + O.sockets[2].x) / 2;
    const w = (O.sockets[2].x - O.sockets[0].x) + 300;
    const sc = w / im.width, h = im.height * sc;
    const topY = O.sockets[0].y + 26;         // the art's walkable moss line
    // settled shadow on the ground
    ctx.fillStyle = 'rgba(46,64,50,0.18)';
    ctx.beginPath(); ctx.ellipse(cx, GY + 4, w * 0.42, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(im, cx - w / 2, topY - 150 * sc, w, h);
    O.sockets.forEach((s, i) => {
      const placed = O.gems.some((g2) => g2.placed === i);
      const lit = placed || S.mode !== 'order';
      const holding = !!O.held;
      const pulse = 0.75 + 0.25 * Math.sin(t * 2.4 + i);
      // a shallow carved stone dish set into the shelf's top
      // rim: a ring of pale stone, sunlit on top, shadowed below
      const rim = ctx.createLinearGradient(0, topY - 18, 0, topY + 16);
      rim.addColorStop(0, '#F4EBCB');
      rim.addColorStop(0.55, '#D9CBA2');
      rim.addColorStop(1, '#A99771');
      ctx.fillStyle = rim;
      ctx.beginPath(); ctx.ellipse(s.x, topY, 42, 19, 0, 0, Math.PI * 2); ctx.fill();
      // the dish hollow
      const dish = ctx.createRadialGradient(s.x, topY - 3, 3, s.x, topY + 2, 34);
      if (placed) {
        dish.addColorStop(0, 'rgba(255,243,196,' + 0.85 * pulse + ')');
        dish.addColorStop(0.75, 'rgba(240,200,120,0.5)');
        dish.addColorStop(1, 'rgba(180,140,70,0.55)');
      } else {
        dish.addColorStop(0, '#8E7C56');
        dish.addColorStop(0.8, '#75653F');
        dish.addColorStop(1, '#5E5033');
      }
      ctx.fillStyle = dish;
      ctx.beginPath(); ctx.ellipse(s.x, topY + 1, 33, 14, 0, 0, Math.PI * 2); ctx.fill();
      // inner rim shadow (top) and light catch (bottom)
      ctx.strokeStyle = 'rgba(74,62,40,0.55)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(s.x, topY + 1, 33, 14, 0, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,250,228,0.7)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(s.x, topY + 1, 33, 14, 0, Math.PI * 0.12, Math.PI * 0.88); ctx.stroke();
      // while a gem is held, every empty dish breathes gold: "put it here"
      if (holding && !placed) {
        ctx.strokeStyle = 'rgba(240,200,120,' + (0.45 + 0.45 * Math.sin(t * 5 + i)) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(s.x, topY, 46 + Math.sin(t * 5 + i) * 3, 21, 0, 0, Math.PI * 2); ctx.stroke();
      }
      if (lit && placed) {
        // light spilling out under a set gem
        const gl = ctx.createRadialGradient(s.x, topY, 4, s.x, topY, 60);
        gl.addColorStop(0, 'rgba(255,240,190,' + 0.4 * pulse + ')');
        gl.addColorStop(1, 'rgba(255,240,190,0)');
        ctx.fillStyle = gl;
        ctx.beginPath(); ctx.ellipse(s.x, topY, 60, 26, 0, 0, Math.PI * 2); ctx.fill();
      }
      if (!placed) {
        ctx.font = '800 19px Nunito, system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(34,28,16,0.45)';
        ctx.fillText(String(i + 1), s.x + 1, topY + 2.5);
        ctx.fillStyle = 'rgba(250,244,224,0.92)';
        ctx.fillText(String(i + 1), s.x, topY + 1);
      }
    });
  }

  function drawWaterfall(ctx, x, y, w, h, t) {
    ctx.save();
    const back = ctx.createLinearGradient(0, y, 0, y + h);
    back.addColorStop(0, 'rgba(203,236,220,0.3)');
    back.addColorStop(0.5, 'rgba(132,198,178,0.34)');
    back.addColorStop(1, 'rgba(203,236,220,0.45)');
    ctx.fillStyle = back;
    ctx.fillRect(x - w * 0.72, y, w * 1.44, h);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(203,236,220,0.5)');
    g.addColorStop(0.25, 'rgba(132,198,178,0.58)');
    g.addColorStop(1, 'rgba(203,236,220,0.7)');
    ctx.fillStyle = g;
    ctx.fillRect(x - w / 2, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x - w * 0.22, y, w * 0.44, h);
    ctx.lineCap = 'round';
    const n = Math.max(4, Math.round(w / 7));
    for (let i = 0; i < n; i++) {
      const depth = i % 3;
      const sx = x - w / 2 + (i + 0.5) * (w / n) + Math.sin(i * 3.7) * 2;
      const phase = (t * (170 + depth * 55) + i * 61) % h;
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.28 + depth * 0.14) + ')';
      ctx.lineWidth = 1.8 + depth * 0.7;
      for (let k = -1; k < 2; k++) {
        const sy = y + (((phase + k * h * 0.45) % h) + h) % h;
        const len = 14 + depth * 10;
        if (sy + len < y + h) { ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.sin(t + i) * 1.2, sy + len); ctx.stroke(); }
      }
    }
    for (let i = 0; i < n + 2; i++) {
      const fx = x - w / 2 - 8 + i * ((w + 16) / (n + 1));
      const r = 5 + Math.sin(t * 3 + i * 2.2) * 2.2;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(fx, y + h - 3 + Math.sin(t * 4 + i) * 1.5, Math.max(2.5, r), 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i < 4; i++) {
      const mr = 13 + i * 8 + Math.sin(t * 0.9 + i * 2) * 3;
      ctx.fillStyle = 'rgba(243,237,213,0.12)';
      ctx.beginPath(); ctx.arc(x + Math.sin(t * 0.6 + i * 2.3) * w * 0.5, y + h - 8 - i * 10, mr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawGem(ctx, im, x, y, hgt, t, glow) {
    if (glow > 0.02) {
      const pulse = 0.8 + 0.2 * Math.sin(t * 2.1 + x * 0.01);
      const halo = ctx.createRadialGradient(x, y, 6, x, y, hgt * 2);
      halo.addColorStop(0, 'rgba(190,240,190,' + 0.38 * pulse * glow + ')');
      halo.addColorStop(0.5, 'rgba(190,240,190,' + 0.12 * pulse * glow + ')');
      halo.addColorStop(1, 'rgba(190,240,190,0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(x, y, hgt * 2, 0, Math.PI * 2); ctx.fill();
    }
    const w = hgt * (im.width / im.height);
    ctx.drawImage(im, x - w / 2, y - hgt / 2, w, hgt);
    if (Math.sin(t * 3.2 + x * 0.02) > 0.6) {
      const a = (Math.sin(t * 3.2 + x * 0.02) - 0.6) / 0.4;
      ctx.strokeStyle = 'rgba(255,255,255,' + 0.9 * a + ')';
      ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      const tx = x + w * 0.22, ty = y - hgt * 0.28, r2 = hgt * 0.12 * a;
      ctx.beginPath();
      ctx.moveTo(tx - r2, ty); ctx.lineTo(tx + r2, ty);
      ctx.moveTo(tx, ty - r2); ctx.lineTo(tx, ty + r2);
      ctx.stroke();
    }
  }

  // each frame's true foot line (from the sheet slicing) — anchoring on these
  // instead of the image bottom keeps the body and eyes steady across frames
  const LL_BASE = new Map();
  function llBase(img) {
    if (!LL_BASE.size) {
      LL_BASE.set(img.llIdle, 399); LL_BASE.set(img.llWalkA, 412);
      LL_BASE.set(img.llWalkB, 402); LL_BASE.set(img.llJump, 395);
      LL_BASE.set(img.llCollect, 395);
    }
    return LL_BASE;
  }

  function drawHero(ctx, img, t) {
    const inAir = !S.grounded && !S.rescue;
    let im = img.llIdle;
    if (S.ceremony) im = img.llCollect;
    else if (S.mode === 'done') im = img.llCollect;
    else if (S.rescue) im = img.llJump;
    else if (inAir) im = img.llJump;
    else if (S.moving) im = Math.floor(S.stepT / 0.11) % 2 ? img.llWalkB : img.llWalkA;
    const h = SPRITE_H;
    // scale each frame so its baseline (foot line) spans the same height,
    // and anchor the feet on that line — body and eyes stay steady
    const base = llBase(img).get(im) || im.height;
    const sc = h / base;
    const w = im.width * sc, hh = im.height * sc;
    const bob = S.moving && S.grounded ? Math.abs(Math.sin(t * 9)) * -3 : Math.sin(t * 1.6) * -1.5;
    const fy = floorAt(S.px, S.py);
    if (fy < Infinity) {
      const gd = Math.max(0, Math.min(1, 1 - (fy - S.py) / 260));
      ctx.fillStyle = 'rgba(52,72,50,' + 0.22 * gd + ')';
      ctx.beginPath(); ctx.ellipse(S.px, fy + 6, 34 * gd + 14, 7 * gd + 2, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.save();
    ctx.translate(S.px, S.py + bob);
    ctx.rotate(S.vx / 230 * 0.06);
    // the walk frames were painted striding leftward; mirror them relative
    // to the other poses so the leading foot matches the direction of travel
    // walk AND jump frames were painted moving leftward on the sheet;
    // mirror them relative to the other poses so they lead the right way
    const leftPainted = im === img.llWalkA || im === img.llWalkB || im === img.llJump;
    ctx.scale(leftPainted ? -S.facing : S.facing, 1);
    if (S.ceremony || S.mode === 'done') {
      const wg = ctx.createRadialGradient(0, -hh * 0.45, 4, 0, -hh * 0.45, hh);
      wg.addColorStop(0, 'rgba(255,236,170,0.45)');
      wg.addColorStop(1, 'rgba(255,236,170,0)');
      ctx.fillStyle = wg;
      ctx.beginPath(); ctx.arc(0, -hh * 0.45, hh, 0, Math.PI * 2); ctx.fill();
    }
    ctx.drawImage(im, -w / 2, -h, w, hh); // top at -h; feet land on the baseline
    ctx.restore();
  }

  function drawFx(ctx) {
    for (const p of S.fx) {
      const k = 1 - p.age / p.life;
      ctx.globalAlpha = Math.min(1, k * 1.6) * 0.85;
      if (p.type === 'leaf') {
        ctx.save(); ctx.translate(p.x, p.y);
        ctx.rotate(Math.sin(p.age * p.spin + p.ph) * 0.9);
        ctx.fillStyle = '#9CBF7E';
        ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.45, 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (p.type === 'sparkle' || p.type === 'burst') {
        ctx.strokeStyle = p.col || (p.type === 'burst' ? '#BDEBB8' : '#FFF3C4');
        ctx.lineWidth = 1.4; ctx.lineCap = 'round';
        const s2 = p.size * (0.5 + k * 0.5);
        ctx.beginPath();
        ctx.moveTo(p.x - s2, p.y); ctx.lineTo(p.x + s2, p.y);
        ctx.moveTo(p.x, p.y - s2); ctx.lineTo(p.x, p.y + s2);
        ctx.stroke();
      } else if (p.type === 'splash') {
        ctx.fillStyle = 'rgba(203,236,220,0.9)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * k, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = '#FFF6DC';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * k, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  function panel(ctx, x, y, w, h, r) {
    ctx.fillStyle = 'rgba(46,64,50,0.18)';
    rr(ctx, x + 3, y + 5, w, h, r); ctx.fill();
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(250,244,224,0.95)');
    g.addColorStop(1, 'rgba(242,231,200,0.95)');
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, r); ctx.fill();
    ctx.strokeStyle = 'rgba(200,155,85,0.85)'; ctx.lineWidth = 2;
    rr(ctx, x + 5, y + 5, w - 10, h - 10, r - 5); ctx.stroke();
  }
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
  const text = (ctx, str, x, y, size, weight, color, ar) => {
    ctx.save();
    ctx.font = weight + ' ' + size + 'px ' + (ar ? '"Scheherazade New", "Geeza Pro", serif' : 'Nunito, "Trebuchet MS", system-ui, sans-serif');
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(46,64,50,0.18)';
    ctx.fillText(str, x + 1.5, y + 2);
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
    ctx.restore();
  };

  function drawHud(ctx, W, t) {
    const w = 3 * 46 + 40, x = W / 2 - w / 2;
    panel(ctx, x, 12, w, 54, 27);
    for (let i = 0; i < 3; i++) {
      const sx = x + 33 + i * 46, sy = 39;
      if (S.found.includes(i + 1)) drawGem(ctx, gemImg(i + 1), sx, sy, 30, t, 0.4);
      else {
        ctx.strokeStyle = 'rgba(150,128,84,0.4)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(sx, sy, 11, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }

  function drawVerseCard(ctx, W, H, v, k) {
    ctx.save();
    ctx.globalAlpha = k;
    const pw = Math.min(660, W - 80), py = H * 0.3;
    panel(ctx, W / 2 - pw / 2, py, pw, 168, 20);
    ctx.fillStyle = '#F5EDD4';
    ctx.strokeStyle = 'rgba(185,138,62,0.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(W / 2, py, 17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    text(ctx, String(v.n), W / 2, py + 1, 14, '800', '#B98A3E');
    text(ctx, v.ar, W / 2, py + 56, 34, '400', '#2E4032', true);
    text(ctx, v.tr, W / 2, py + 102, 15, '600', '#B98A3E');
    text(ctx, v.meaning, W / 2, py + 134, 15.5, '700', '#6B7D66');
    ctx.restore();
  }

  function drawBanner(ctx, W, a, b) {
    panel(ctx, W / 2 - 260, 78, 520, 60, 26);
    text(ctx, a, W / 2, 100, 17, '800', '#3E5340');
    text(ctx, b, W / 2, 122, 12.5, '600', '#6B7D66');
  }

  function drawDone(ctx, W, H) {
    const k = Math.min(1, S.doneT / 0.8);
    ctx.globalAlpha = k;
    panel(ctx, W / 2 - 250, H * 0.34, 500, 150, 24);
    text(ctx, 'Al-Kawthar ✦ whole and in order', W / 2, H * 0.34 + 52, 24, '800', '#3E5340');
    text(ctx, 'the garden kept every gem for you', W / 2, H * 0.34 + 92, 15, '600', '#6B7D66');
    text(ctx, 'tap to wander again', W / 2, H * 0.34 + 122, 13, '700', '#B98A3E');
    ctx.globalAlpha = 1;
  }
})();
