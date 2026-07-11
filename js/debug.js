// Gems of Light — debug.js
// Speed-run mode for testing mechanics end to end. Opt in with ?debug=1.
// It never touches the real save (writes stay in memory), and it strips the
// waits: no recitation audio, no collect cards or echo, no gate sorting.
//
//   1–6  jump straight into that level        G  collect every gem at once
//   M    back to the world map                E  warp to the arch
//   hold Shift — sprint
//
(function () {
  const GOL = window.GOL;
  const qs = (window.location && window.location.search) || '';
  if (!/[?&]debug=1\b/.test(qs)) return;
  GOL.DEBUG = true;

  // ------------------------------------------------ the save is sacred ----
  // Debug sessions read the real progress but never write it back, so a
  // child's garden can't be trampled by a test run. Everything still works
  // within the session (unlock chain, room shelves) — it just isn't kept.
  GOL.store.save = function () {};
  // every level and mode is open
  GOL.store.isOpen = function () { return true; };

  // ------------------------------------------------ recitation stubbed ----
  // Callbacks still fire (in order, almost instantly) so everything gated
  // on audio — the gate chain, ceremonies, trial prompts — flows through.
  const TICK = 60; // ms per stubbed verse
  GOL.audio.preloadSurah = function () {};
  GOL.audio.playVerse = function (surahId, n, onend) {
    this.stopRecitation();
    const h = { done: false, finish() { this.done = true; } };
    if (onend) setTimeout(() => { if (!h.done) onend(); }, TICK);
    return h;
  };
  GOL.audio.playSurah = function (surah, cb) {
    this.stopRecitation();
    const seq = { i: 0, stopped: false, el: null };
    const step = () => {
      if (seq.stopped) return;
      if (seq.i >= surah.verses.length) {
        if (cb && cb.onend) cb.onend();
        return;
      }
      if (cb && cb.onVerse) cb.onVerse(seq.i);
      seq.i++;
      setTimeout(step, TICK);
    };
    setTimeout(step, TICK);
    return seq;
  };
  // narration voice lines, likewise silent and instant
  if (GOL.audio.speak) {
    GOL.audio.speak = function (id, onend) {
      if (onend) setTimeout(onend, TICK);
      return null;
    };
  }
  if (GOL.audio.preloadVoice) GOL.audio.preloadVoice = function () {};

  // ------------------------------------------------- map: all ways in -----
  // Arriving at (or tapping) any garden opens the full ways-in panel —
  // walk, star walk, trial, story, meanings — completed or not.
  const map = GOL.SCENES && GOL.SCENES.map;
  if (map && typeof map.arrive === 'function') {
    map.arrive = function (nLocal) {
      this.pendingEnter = null;
      this.panelNode = nLocal;
      GOL.audio.sfx('land');
    };
  }

  // --------------------------------------------------------- hotkeys ------
  const PH = GOL.PHYS;
  const BASE = { WALK: PH.WALK, ACCEL: PH.ACCEL, DECEL: PH.DECEL };
  addEventListener('keydown', (e) => {
    if (e.key === 'Shift') { // sprint
      PH.WALK = BASE.WALK * 2.4;
      PH.ACCEL = BASE.ACCEL * 2.4;
      PH.DECEL = BASE.DECEL * 2.4;
      return;
    }
    if (e.repeat || !GOL.go) return;
    const k = e.key.toLowerCase();
    if (k >= '1' && k <= '6') {
      GOL.go('level', { index: +k - 1 });
    } else if (k === 'm') {
      GOL.go('map');
    } else if (k === 'g' && GOL.sceneName === 'level') {
      const s = GOL.SCENES.level;
      if (s.debugCollectAll) s.debugCollectAll();
    } else if (k === 'e' && GOL.sceneName === 'level') {
      const s = GOL.SCENES.level;
      if (s.debugWarpArch) s.debugWarpArch();
    }
  });
  addEventListener('keyup', (e) => {
    if (e.key === 'Shift') {
      PH.WALK = BASE.WALK;
      PH.ACCEL = BASE.ACCEL;
      PH.DECEL = BASE.DECEL;
    }
  });

  // ----------------------------------------------------------- badge ------
  GOL.debugDraw = function (ctx, W, H) {
    ctx.save();
    ctx.font = '800 10px ' + (GOL.fonts ? GOL.fonts.ui : 'sans-serif');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const label = 'DEBUG';
    const hint = '  1–6 levels · G gems · E arch · shift sprint · M map';
    const lw = ctx.measureText(label).width;
    const y = H - 28;
    ctx.fillStyle = 'rgba(180,70,60,0.85)';
    const r = 8, x = 10, w = lw + 14, h = 16;
    ctx.beginPath();
    ctx.moveTo(x + r, y - h / 2);
    ctx.arcTo(x + w, y - h / 2, x + w, y + h / 2, r);
    ctx.arcTo(x + w, y + h / 2, x, y + h / 2, r);
    ctx.arcTo(x, y + h / 2, x, y - h / 2, r);
    ctx.arcTo(x, y - h / 2, x + w, y - h / 2, r);
    ctx.fill();
    ctx.fillStyle = '#FFF6DC';
    ctx.fillText(label, x + 7, y + 0.5);
    ctx.fillStyle = 'rgba(255,246,220,0.6)';
    ctx.fillText(hint, x + w, y + 0.5);
    ctx.restore();
  };
})();
