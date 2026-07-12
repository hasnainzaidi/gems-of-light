// Gems of Light v3 — boot.js
// Boot, the render loop, soft scene transitions, safe-area measurement,
// and the v3 tunables (?p= prototype, ?echo=, ?rows=, ?ar=, ?surah=, ?debug=1).
(function () {
  const GOL = window.GOL;
  GOL.VERSION = 'v3.0';
  GOL.AUDIO_BASE = '../audio/'; // narration/voice files live at the repo root

  // ------------------------------------------------------------ reciters --
  // one voice at a time, chosen in the tuning panel; local files first,
  // everyayah.com streaming as the fallback
  GOL.RECITERS = {
    basit: { name: 'Abdul Basit (Murattal)', local: '../audio/basit/', remote: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/' },
    alafasy: { name: 'Mishary Alafasy', local: '../audio/', remote: 'https://everyayah.com/data/Alafasy_128kbps/' }
  };

  // ------------------------------------------------------------ tunables --
  const q = new URLSearchParams(location.search);
  GOL.DEBUG = q.get('debug') === '1';
  // The ayah recites when its gem is collected (see adventure.collect). The
  // *ambient* echo — an uncollected ayah softly calling from its direction —
  // playtested as confusing/random, so it's off by default; the tuning panel
  // still exposes near/world for further experiments.
  GOL.V3 = {
    proto: parseInt(q.get('p') || '5', 10),
    echo: ['off', 'near', 'world'].includes(q.get('echo')) ? q.get('echo') : 'off',
    echoEvery: parseFloat(q.get('echoEvery') || '14'),
    rows: parseFloat(q.get('rows') || '11.5'), // tile rows visible on screen
    arabic: q.get('ar') !== '0',               // ayah script glow on collect
    surah: q.get('surah') ? parseInt(q.get('surah'), 10) : null,
    reciter: GOL.RECITERS[q.get('reciter')] ? q.get('reciter') : 'basit',
    // YOUR TURN at the campfire on a surah's FIRST learning: after each ayah
    // a soft chime opens a short breath — the wordless invitation to say it —
    // while listening rings ripple from the seated child. 'chime' by default;
    // 'off' gives the tight single recitation. (Supersedes the world-echo,
    // which playtested as broken/laborious — PLAN §10.)
    campTurn: ['off', 'chime'].includes(q.get('turn')) ? q.get('turn') : 'chime'
  };
  // the in-app tuning panel persists its choices; a URL param still wins as
  // an explicit override for that key. CFG_V lets a default change (like the
  // echo one above) reset a stale persisted echo instead of stranding it.
  const CFG_V = 2;
  try {
    const saved = JSON.parse(localStorage.getItem('gemsOfLight.v3cfg') || '{}');
    if (!q.has('echo') && saved.echo && saved.v === CFG_V) GOL.V3.echo = saved.echo;
    if (!q.has('ar') && saved.arabic != null) GOL.V3.arabic = saved.arabic;
    if (!q.has('rows') && saved.rows) GOL.V3.rows = saved.rows;
    if (!q.has('reciter') && GOL.RECITERS[saved.reciter]) GOL.V3.reciter = saved.reciter;
    // campTurn is a plain toggle: a missing saved key just keeps the default
    // (an old saved campEcho key is simply ignored — that experiment is gone)
    if (!q.has('turn') && (saved.campTurn === 'off' || saved.campTurn === 'chime')) GOL.V3.campTurn = saved.campTurn;
  } catch (e) { /* private mode: play on */ }
  GOL.saveV3cfg = function () {
    try {
      localStorage.setItem('gemsOfLight.v3cfg', JSON.stringify({ v: CFG_V, echo: GOL.V3.echo, arabic: GOL.V3.arabic, rows: GOL.V3.rows, reciter: GOL.V3.reciter, campTurn: GOL.V3.campTurn }));
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
  if (GOL.DEBUG) {
    addEventListener('keydown', (e) => {
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
  switchTo('title');

  // --------------------------------------------------------------- loop ---
  let last = performance.now();
  let frameCount = 0;
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

    const portrait = H > W && GOL.Input.touchMode;
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
    if (GOL.DEBUG) {
      GOL.text(ctx, 'DEBUG', W - 8 - (GOL.SAFE.r || 0), H - 10, { size: 10, weight: '800', color: 'rgba(220,80,60,0.9)', align: 'right', shadow: false });
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
