// Gems of Light v3 — boot.js
// Boot, the render loop, soft scene transitions, safe-area measurement,
// and the v3 tunables (?echo=, ?rows=, ?ar=, ?surah=, ?debug=1, ?fps=1).
// Debug labs may be opened directly with ?debug=1&proto=N.
(function () {
  const GOL = window.GOL;
  GOL.VERSION = 'v3.0';
  GOL.AUDIO_BASE = '../audio/'; // narration/voice files live at the repo root

  // Is the game running as an installed PWA (home-screen launch) rather than a
  // browser tab? Drives the install nudge — installed players never see it.
  // Defined here (boot runs before any frame) so scenes can call it at runtime.
  // Guarded for private mode; errs toward "browser tab" only when we can tell.
  GOL.isStandalone = function () {
    try {
      return (window.matchMedia &&
        (matchMedia('(display-mode: standalone)').matches ||
         matchMedia('(display-mode: fullscreen)').matches)) ||
        navigator.standalone === true;
    } catch (e) { return false; }
  };

  // ------------------------------------------------------------ reciters --
  // one voice at a time, chosen in the tuning panel; local files first,
  // everyayah.com streaming as the fallback. Mishary is the default voice
  // (2026-07-15); Abdul Basit remains one tap away in the tuning panel.
  GOL.RECITERS = {
    basit: { name: 'Abdul Basit (Murattal)', local: '../audio/basit/', remote: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/' },
    alafasy: { name: 'Mishary Alafasy', local: '../audio/alafasy/', remote: 'https://everyayah.com/data/Alafasy_128kbps/' }
  };

  // ------------------------------------------------------------ tunables --
  const q = new URLSearchParams(location.search);
  GOL.DEBUG = q.get('debug') === '1';
  // Long-surah labs need the debug doorway without the usual one-gem shrine
  // shortcut. `full=1` keeps the complete recall round for real playtests.
  // DEBUG_ACCEL (speed runs skip recitation + the one-gem shrine) must track
  // DEBUG whenever it changes — from saved config below or the tuning panel
  // mid-session — not just the boot-time ?debug=1. Derive it through this
  // helper so the two flags never drift apart. `full=1` is a boot-only gate.
  GOL.DEBUG_FULL = q.get('full') === '1';
  GOL.applyDebug = function () { GOL.DEBUG_ACCEL = GOL.DEBUG && !GOL.DEBUG_FULL; };
  GOL.applyDebug();
  const directLab = q.get('lab') ? parseInt(q.get('lab'), 10) : null;
  const directProto = q.get('proto') ? parseInt(q.get('proto'), 10) : directLab;
  const directShrine = q.get('shrine') === '1';
  const directFocus = q.get('focus') === '1';
  const directCamp = q.get('camp') ? Math.max(1, parseInt(q.get('camp'), 10)) : null;
  const directGate = q.get('gate') ? Math.max(1, parseInt(q.get('gate'), 10)) : null;
  GOL.FPS = q.get('fps') === '1'; // on-device frame-time readout (judder hunts)
  // The ayah recites when its gem is collected (see adventure.collect). The
  // *ambient* echo — an uncollected ayah softly calling from its direction —
  // playtested as confusing/random, so it's off by default; the tuning panel
  // still exposes near/world for further experiments.
  GOL.V3 = {
    echo: ['off', 'near', 'world'].includes(q.get('echo')) ? q.get('echo') : 'off',
    echoEvery: parseFloat(q.get('echoEvery') || '14'),
    rows: parseFloat(q.get('rows') || '11.5'), // tile rows visible on screen
    maxCols: parseFloat(q.get('cols') || '16'), // horizontal FOV cap — stops wide phones zooming out (iPad's ~15 cols never hit it, so iPad is unchanged); 'near' (14) is one tap away and persists per device
    // Vertical seat. Keep this LOW: the camera's bottom clamp (never show below
    // the level floor) is what anchors the frame to the ground, and a tall view
    // (iPad) always hits it. A high bias on a short phone view floats the camera
    // OFF the clamp, leaving a big dead sky above the sprite that wrecks jumps.
    // Low bias lets the clamp govern on every device — each self-frames.
    groundBias: parseFloat(q.get('groundY') || '0.50'),
    arabic: q.get('ar') !== '0',               // ayah script glow on collect
    surah: q.get('surah') ? parseInt(q.get('surah'), 10) : null,
    reciter: GOL.RECITERS[q.get('reciter')] ? q.get('reciter') : 'alafasy'
  };
  if (GOL.EXPERIENCE.showcase) {
    GOL.V3.echo = 'off';
    GOL.V3.arabic = false;
  }
  // the in-app tuning panel persists its choices; a URL param still wins as
  // an explicit override for that key. CFG_V lets a default change (like the
  // echo one above, or the 2026-07-15 Mishary default) reset a stale
  // persisted choice instead of stranding it.
  const CFG_V = 3;
  try {
    const saved = JSON.parse(localStorage.getItem(GOL.EXPERIENCE.configKey) || '{}');
    if (!q.has('echo') && saved.echo && saved.v === CFG_V) GOL.V3.echo = saved.echo;
    if (!q.has('ar') && saved.arabic != null) GOL.V3.arabic = saved.arabic;
    if (!q.has('rows') && saved.rows) GOL.V3.rows = saved.rows;
    if (!q.has('cols') && saved.maxCols) GOL.V3.maxCols = saved.maxCols;
    if (!q.has('groundY') && saved.groundBias) GOL.V3.groundBias = saved.groundBias;
    if (!q.has('reciter') && saved.v === CFG_V && GOL.RECITERS[saved.reciter]) GOL.V3.reciter = saved.reciter;
    // debug toggled from the tuning panel persists; ?debug=1 stays the boss
    if (!q.has('debug') && saved.debug != null) GOL.DEBUG = !!saved.debug;
  } catch (e) { /* private mode: play on */ }
  GOL.applyDebug(); // saved debug may have flipped DEBUG on — resync DEBUG_ACCEL
  GOL.saveV3cfg = function () {
    try {
      localStorage.setItem(GOL.EXPERIENCE.configKey, JSON.stringify({ v: CFG_V, echo: GOL.V3.echo, arabic: GOL.V3.arabic, rows: GOL.V3.rows, maxCols: GOL.V3.maxCols, groundBias: GOL.V3.groundBias, reciter: GOL.V3.reciter, debug: GOL.DEBUG }));
    } catch (e) { /* ignore */ }
  };

  // ----------------------------------------------------------- safe area --
  // measure env(safe-area-inset-*) with a probe div; the Dynamic Island sits
  // in the left/right inset in landscape, the home indicator in the bottom
  GOL.SAFE = { l: 0, r: 0, t: 0, b: 0 };
  function measureSafe() {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;' +
      'padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right);' +
      'padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);';
    document.body.appendChild(el);
    const cs = getComputedStyle(el);
    GOL.SAFE = {
      l: parseFloat(cs.paddingLeft) || 0,
      r: parseFloat(cs.paddingRight) || 0,
      t: parseFloat(cs.paddingTop) || 0,
      b: parseFloat(cs.paddingBottom) || 0
    };
    document.body.removeChild(el);
  }
  measureSafe();

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1); // 3x on a 6.1" phone is wasted work
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    measureSafe();
  }
  addEventListener('resize', resize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  resize();

  GOL.store.load();
  // install-nudge memory: { greeted } once boot's one-time invitation has been
  // met; { ribbonHidden } once a grown-up dismisses the quiet map reminder.
  // Both persist in the save; init here so every reader can trust it exists.
  GOL.store.data.install = GOL.store.data.install || {};
  // The grown-up porch is additive and save-safe. Existing families should
  // never be sent backward through setup merely because their save predates
  // this schema; any real journey trace counts as an already-started child.
  GOL.hasJourneyProgress = function () {
    const d = GOL.store.data || {};
    return !!(
      (d.grand && Object.keys(d.grand).length) ||
      (d.levels && Object.keys(d.levels).length) ||
      (d.opened && d.opened.length) ||
      (d.unlocked && d.unlocked > 0)
    );
  };
  {
    const hadJourney = GOL.hasJourneyProgress();
    const ob = (GOL.store.data.onboarding = GOL.store.data.onboarding || {});
    // Showcase originally shipped without a porch. Give every existing guest
    // save the new secular onboarding exactly once, while retaining its worlds.
    // The marker is persisted when the handoff completes; leaving early means
    // the calm invitation returns next time.
    if (GOL.EXPERIENCE.showcase && ob.showcaseV !== 1) {
      ob.v = 1; ob.showcaseV = 1;
      ob.parentComplete = false; ob.childStarted = false;
    } else {
      if (ob.v == null) ob.v = 1;
      if (ob.parentComplete == null) ob.parentComplete = hadJourney;
      if (ob.childStarted == null) ob.childStarted = hadJourney;
    }
  }
  GOL.onboardingStatus = () => GOL.store.data.onboarding;
  GOL.completeParentOnboarding = function () {
    const ob = GOL.store.data.onboarding;
    // Commit the grown-up's draft only at handoff. Before this boundary the
    // family can leave setup without creating child progress or a half-made
    // journey that would bypass the porch on reload.
    if (!GOL.EXPERIENCE.showcase && GOL.applyJourneyStage) {
      const stage = ob.journeyStageDraft != null ? ob.journeyStageDraft : (ob.journeyStage || 0);
      GOL.applyJourneyStage(stage, Date.now());
    }
    delete ob.journeyStageDraft;
    delete ob.knownSurahsDraft;
    ob.v = 1; ob.parentComplete = true;
    GOL.store.save();
  };
  GOL.markChildStarted = function () {
    const ob = GOL.store.data.onboarding;
    if (ob.childStarted) return;
    ob.v = 1; ob.parentComplete = true; ob.childStarted = true;
    GOL.store.save();
  };
  GOL.preserveVisitedWorlds();
  GOL.Input.init(canvas);

  const wake = () => {
    GOL.audio.unlock();
    GOL.audio.setMuted(GOL.store.data.settings.muted);
  };
  for (const ev of ['pointerdown', 'touchend', 'mousedown', 'click', 'keydown']) {
    canvas.addEventListener(ev, wake);
    if (ev === 'keydown') window.addEventListener(ev, wake);
  }

  // ------------------------------------------------------ debug hotkeys ---
  // G: collect / place the next thing · E: warp to campfire/door · M: title
  // (registered always, gated at press time — debug can now be toggled from
  // the tuning panel mid-session, not only at boot via ?debug=1)
  {
    addEventListener('keydown', (e) => {
      if (!GOL.DEBUG) return;
      const s = current;
      if (!s) return;
      if (e.key === 'g' || e.key === 'G') { if (s.debugCollectAll) s.debugCollectAll(); }
      if (e.key === 'e' || e.key === 'E') { if (s.debugWarp) s.debugWarp(); }
      if (e.key === 'm' || e.key === 'M') GOL.go('title');
    });
  }

  // ------------------------------------------------------ scene handling --
  let current = null;
  let fade = { phase: 'in', t: 1, next: null, params: null };
  GOL.go = function (name, params) {
    if (fade.phase === 'out') return;
    fade = { phase: 'out', t: 0, next: name, params };
  };
  function switchTo(name, params) {
    if (current && current.exit) current.exit();
    current = GOL.SCENES[name];
    GOL.sceneName = name;
    current.enter(params || {});
  }
  // A clean family begins on the grown-up porch, where value still comes before
  // installation. On later browser launches, an uninstalled family meets the
  // full-screen setup checkpoint before the child-facing doorway. Installed
  // launches, debug labs, and the first value-first visit never see that gate.
  const directDef = (GOL.DEBUG || !!directLab) && directProto && GOL.PROTOTYPES[directProto];
  // A targeted clean start for prototype playtests. It never touches real
  // world progress, and removes itself from the URL so a later refresh resumes
  // normally instead of resetting again.
  if (directDef && directLab && q.get('fresh') === '1' && directDef.labSaveKey) {
    delete GOL.store.data.levels[directDef.labSaveKey];
    if (GOL.store.data.grand) delete GOL.store.data.grand[directDef.labSaveKey];
    GOL.store.save();
    q.delete('fresh');
    try { history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q.toString() : '')); } catch (e) { /* play on */ }
  }
  const directParams = directDef ? { proto: directProto, labFocus: directFocus } : null;
  if (directParams && directGate) directParams.viewGate = directGate;
  if (directParams && directCamp && directDef.campShrines && directDef.campShrines[directCamp - 1]) {
    const c = directDef.campShrines[directCamp - 1];
    const start = directCamp === 1 ? 1 : directDef.campShrines[directCamp - 2].afterAyah;
    directParams.checkpoint = { index: directCamp - 1, start, len: c.afterAyah - start + 1, afterAyah: c.afterAyah };
  }
  const forceOnboarding = q.get('onboarding') === '1';
  const needsPorch = GOL.EXPERIENCE.onboarding && (forceOnboarding ||
    (!GOL.onboardingStatus().parentComplete && !GOL.hasJourneyProgress()));
  const needsInstallCheckpoint = !needsPorch && GOL.EXPERIENCE.install &&
    !GOL.isStandalone() && !GOL.DEBUG;
  const initialScene = directDef
    ? (directDef.scene || ((directShrine || directFocus || directParams.checkpoint) ? 'shrine' : 'adventure'))
    : (needsPorch ? 'onboarding' : (needsInstallCheckpoint ? 'install' : 'title'));
  switchTo(initialScene, directParams);

  // --------------------------------------------------------------- loop ---
  let last = performance.now();
  let frameCount = 0;
  // ?fps=1 readout state (rolling second: average fps + worst frame)
  let fpsAcc = 0, fpsN = 0, fpsWorst = 0, fpsShown = '', fpsFrameStart = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    frameCount++;
    let dt = Math.min(0.033, (now - last) / 1000);
    last = now;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (fade.phase === 'out') {
      fade.t += dt / (GOL.DEBUG ? 0.08 : 0.32);
      if (fade.t >= 1) {
        switchTo(fade.next, fade.params);
        fade = { phase: 'in', t: 0 };
      }
    } else if (fade.phase === 'in') {
      fade.t = Math.min(1, fade.t + dt / (GOL.DEBUG ? 0.08 : 0.38));
      if (fade.t >= 1) fade.phase = 'idle';
    }

    // scenes that paint their own portrait composition (the title's postcard
    // is the rotate invitation itself) opt out of the sideways curtain
    const portrait = H > W && GOL.Input.touchMode && !(current && current.ownsPortrait);
    if (!portrait || !current) {
      current.update(dt, W, H);
      current.draw(ctx, W, H);
    }
    GOL.audio.tick(dt);

    if (portrait) {
      ctx.fillStyle = '#2E4032';
      ctx.fillRect(0, 0, W, H);
      GOL.star8(ctx, W / 2, H * 0.36, 26, performance.now() / 3000, 'rgba(240,200,120,0.85)');
      GOL.text(ctx, 'turn me sideways', W / 2, H * 0.5, { size: 24, weight: '800', color: '#F5EDD4' });
    }

    if (fade.phase !== 'idle') {
      const a = fade.phase === 'out' ? GOL.ease.inOut(Math.min(1, fade.t)) : 1 - GOL.ease.inOut(fade.t);
      if (a > 0.002) {
        ctx.fillStyle = 'rgba(243,233,205,' + (a * 0.98).toFixed(3) + ')';
        ctx.fillRect(0, 0, W, H);
      }
    }
    if (GOL.DEBUG && !GOL.EXPERIENCE.showcase) {
      GOL.text(ctx, 'DEBUG', W - 8 - (GOL.SAFE.r || 0), H - 10, { size: 10, weight: '800', color: 'rgba(220,80,60,0.9)', align: 'right', shadow: false });
    }
    // ?fps=1 — an on-device frame-time readout for judder hunts: shows the
    // rolling average AND the worst frame of the last second (spikes are what
    // the eye reads as judder; averages hide them). Dev-only, never for kids.
    if (GOL.FPS) {
      fpsAcc += dt; fpsN++;
      const ms = (now - fpsFrameStart);
      if (ms > fpsWorst) fpsWorst = ms;
      fpsFrameStart = now;
      if (fpsAcc >= 1) {
        fpsShown = Math.round(fpsN / fpsAcc) + 'fps · worst ' + fpsWorst.toFixed(0) + 'ms';
        fpsAcc = 0; fpsN = 0; fpsWorst = 0;
      }
      if (fpsShown) GOL.text(ctx, fpsShown, W / 2, 14, { size: 11, weight: '800', color: 'rgba(220,80,60,0.9)', shadow: false });
    }
    GOL.Input.endFrame();
  }
  requestAnimationFrame(frame);

  // uncaught errors are easy to miss on a phone — surface them, and keep the
  // loop alive if the rAF chain is ever dropped (some embedded webviews do)
  addEventListener('error', (e) => {
    try { console.error('[gol]', e.message, e.filename + ':' + e.lineno); } catch (_) {}
  });
  let lastSeen = 0;
  setInterval(() => {
    if (frameCount === lastSeen) {
      console.warn('[gol] render loop stalled at frame ' + frameCount + ' — rekicking');
      requestAnimationFrame(frame);
    }
    lastSeen = frameCount;
  }, 1000);
})();
