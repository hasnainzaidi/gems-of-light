// Quraysh learning-loop rooms — shared plumbing (GOL.QROOMS)
//
// Five prototype rooms (p20–p24, ?lab=20..24) explore the learning-loop
// strategy (v3/LEARNING-LOOPS-STRATEGY.md) on Surah Quraysh (106). This
// module is the plumbing they share so each room file stays a pure scene:
//
//   QROOMS.playAyah(n, onend)          — full ayah, real recitation pipeline
//   QROOMS.echoAyah(n, vol)            — soft distant hearing
//   QROOMS.playSlice(n, i0, i1, opts)  — word-range cut (first-word / phrase
//                                        cues) via the estimated read-along
//                                        timings; ALWAYS alafasy audio, since
//                                        the timings were fit to those mp3s
//   QROOMS.firstWord(n, opts)          — sugar for playSlice(n, 0, 0)
//   QROOMS.openingPhrase(n, opts)      — first half of the ayah's words
//   QROOMS.ladder(spec)                — the gentle-support ladder timer
//   QROOMS.mic                         — Level 1/2 voice-activity detection
//   QROOMS.log(room, event, data)      — honest independence telemetry
//   QROOMS.save(key, obj) / load(key)  — per-room persistence (support rungs)
//
// Doctrine (enforced by construction here, honored by every room): no
// malformed Quran ever — slices are contiguous word runs of a real
// recording; mistakes raise support, never lower status; the mic proves
// participation (L1) or attempt shape (L2), never correctness.
(function () {
  const GOL = window.GOL;

  const SURAH = 106;
  const AYAHS = 4;

  // ---------------------------------------------------------- word timing --
  function table() {
    const wf = GOL.WORD_FOLLOW && GOL.WORD_FOLLOW.alafasy && GOL.WORD_FOLLOW.alafasy[SURAH];
    return wf || null;
  }
  function words(n) {
    const wf = table();
    return (wf && wf.verses && wf.verses[n]) || [];
  }

  // ------------------------------------------------------------- slices ----
  // One reused element, like audio.js's verse element: iOS is only happy
  // with a small, gesture-unlocked pool. Slices always cut ALAFASY audio
  // (the timing tables' source); the full-ayah path honors the chosen
  // reciter as usual.
  let sliceEl = null;
  let sliceRun = null; // { stop(), done }
  function sliceAudio() {
    if (!sliceEl && typeof Audio !== 'undefined') {
      sliceEl = new Audio();
      sliceEl.preload = 'auto';
      sliceEl.setAttribute && sliceEl.setAttribute('playsinline', '');
    }
    return sliceEl;
  }
  function key(n) {
    return ('00' + SURAH).slice(-3) + ('00' + n).slice(-3);
  }
  // Play words i0..i1 (inclusive, 0-based) of ayah n. opts: { vol, pad,
  // onend }. `pad` (s) breathes past the estimated cut so a word is never
  // clipped mid-sound (default 0.12). Always eventually calls onend once.
  function playSlice(n, i0, i1, opts) {
    opts = opts || {};
    const ws = words(n);
    if (!ws.length) { if (opts.onend) setTimeout(opts.onend, 0); return null; }
    i0 = Math.max(0, Math.min(ws.length - 1, i0 | 0));
    i1 = Math.max(i0, Math.min(ws.length - 1, i1 == null ? i0 : i1 | 0));
    const from = ws[i0].from;
    const to = ws[i1].to + (opts.pad == null ? 0.12 : opts.pad);
    const el = sliceAudio();
    if (!el) { if (opts.onend) setTimeout(opts.onend, 0); return null; }
    if (sliceRun) sliceRun.stop();

    const rec = (GOL.RECITERS && GOL.RECITERS.alafasy) ||
      { local: '../audio/alafasy/', remote: 'https://everyayah.com/data/Alafasy_128kbps/' };
    const run = { done: false, timer: 0, guard: 0, poll: 0 };
    const finish = () => {
      if (run.done) return;
      run.done = true;
      clearTimeout(run.timer); clearTimeout(run.guard); clearInterval(run.poll);
      try { el.pause(); } catch (e) { /* fine */ }
      if (GOL.audio && GOL.audio.duck) GOL.audio.duck(false);
      if (sliceRun === run) sliceRun = null;
      if (opts.onend) opts.onend();
    };
    run.stop = finish;

    let triedRemote = false;
    const begin = () => {
      try { el.currentTime = from; } catch (e) { /* seek again on playing */ }
      const p = el.play();
      if (p && p.catch) p.catch(() => {});
    };
    el.onerror = () => {
      if (!triedRemote) {
        triedRemote = true;
        el.src = rec.remote + key(n) + '.mp3';
        el.load();
        begin();
      } else finish();
    };
    el.onloadedmetadata = begin;
    el.muted = !!(GOL.audio && GOL.audio.muted);
    el.volume = Math.max(0.05, Math.min(1, opts.vol == null ? 1 : opts.vol));
    el.src = rec.local + key(n) + '.mp3';
    el.load();
    // stop at the cut — polled, because 'timeupdate' is too coarse on iOS
    run.poll = setInterval(() => {
      if (el.currentTime >= to || el.ended) finish();
    }, 40);
    run.timer = setTimeout(() => { if (el.paused || el.readyState < 2) finish(); }, 7000);
    run.guard = setTimeout(finish, 25000);
    if (GOL.audio && GOL.audio.duck) GOL.audio.duck(true);
    sliceRun = run;
    return run;
  }

  // ------------------------------------------------------ support ladder ---
  // The gentle failure model as a small machine. spec.rungs is an array of
  // functions — rung 0 is the bare prompt, each later rung adds support,
  // the LAST rung must supply the complete model. spec.delays[i] (s) is the
  // hesitation window after rung i (default 4.5). The room calls:
  //   l.arm()        — (re)start at rung 0 (fires rungs[0])
  //   l.update(dt)   — every frame; escalates after hesitation
  //   l.answer()     — the child acted: stop escalating; l.rung says how
  //                    much support they needed (the telemetry payload)
  //   l.hold(sec)    — push the next escalation back (e.g. while audio plays)
  //   l.cancel()     — leave the room / stop silently
  function ladder(spec) {
    const delays = spec.delays || [];
    return {
      rung: -1, waiting: false, t: 0, done: false,
      arm() {
        this.rung = 0; this.t = 0; this.waiting = true; this.done = false;
        if (spec.rungs[0]) spec.rungs[0]();
      },
      delayFor(i) { return delays[i] != null ? delays[i] : (spec.delay != null ? spec.delay : 4.5); },
      hold(sec) { this.t = Math.min(this.t, -Math.abs(sec || 0)); },
      update(dt) {
        if (!this.waiting || this.done) return;
        this.t += dt;
        if (this.t >= this.delayFor(this.rung)) {
          this.t = 0;
          if (this.rung + 1 < spec.rungs.length) {
            this.rung++;
            spec.rungs[this.rung]();
          } else {
            this.done = true; this.waiting = false;
            if (spec.onExhausted) spec.onExhausted();
          }
        }
      },
      answer() { this.waiting = false; this.done = true; },
      cancel() { this.waiting = false; this.done = true; }
    };
  }

  // ---------------------------------------------------------------- mic ----
  // Level 1 (speech detected) and Level 2 (attempt shape: a speech run's
  // duration) ONLY. No recognition, no correctness. Adaptive noise floor;
  // hangover so word gaps don't end a run. Rooms must set mic.gate = false
  // while the reciter's model is playing (speakers would self-trigger), and
  // must keep working with mic.available === false (tap fallback).
  const mic = {
    available: null,   // null = not asked yet; false = denied/absent
    active: false,     // stream live
    gate: true,        // rooms: set false while model audio plays
    level: 0,          // smoothed 0..1-ish RMS above floor
    speaking: false,   // currently in a speech run (gated)
    attemptDur: 0,     // seconds of the current/last speech run
    onSpeechStart: null,
    onSpeechEnd: null, // called with (durSeconds) when a run ends
    _floor: 0.008, _hang: 0, _ctx: null, _an: null, _buf: null, _timer: 0,
    request(cb) {
      if (this.active) { if (cb) cb(true); return; }
      const gum = (typeof navigator !== 'undefined') && navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia;
      if (!gum) { this.available = false; if (cb) cb(false); return; }
      navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      }).then((stream) => {
        try {
          this._ctx = new (window.AudioContext || window.webkitAudioContext)();
          const src = this._ctx.createMediaStreamSource(stream);
          this._an = this._ctx.createAnalyser();
          this._an.fftSize = 1024;
          this._buf = new Float32Array(this._an.fftSize);
          src.connect(this._an);
          this._stream = stream;
          this.available = true; this.active = true;
          clearInterval(this._timer);
          this._timer = setInterval(() => this._tick(0.05), 50);
          if (cb) cb(true);
        } catch (e) {
          this.available = false; if (cb) cb(false);
        }
      }).catch(() => { this.available = false; if (cb) cb(false); });
    },
    stop() {
      clearInterval(this._timer); this._timer = 0;
      if (this._stream) { for (const t of this._stream.getTracks()) t.stop(); this._stream = null; }
      if (this._ctx) { try { this._ctx.close(); } catch (e) {} this._ctx = null; }
      this.active = false; this.speaking = false; this.level = 0;
    },
    _tick(dt) {
      if (!this._an) return;
      if (this._ctx && this._ctx.state === 'suspended') { try { this._ctx.resume(); } catch (e) {} }
      this._an.getFloatTimeDomainData(this._buf);
      let sum = 0;
      for (let i = 0; i < this._buf.length; i++) sum += this._buf[i] * this._buf[i];
      const rms = Math.sqrt(sum / this._buf.length);
      // the floor drifts up slowly through quiet, snaps down through quieter
      if (rms < this._floor) this._floor = Math.max(0.004, this._floor * 0.98 + rms * 0.02);
      else this._floor = Math.min(0.06, this._floor + 0.00004);
      const over = Math.max(0, rms - this._floor * 2.2);
      this.level = this.level * 0.7 + Math.min(1, over * 18) * 0.3;
      const loud = this.gate && this.level > 0.12;
      if (loud) {
        this._hang = 0.4;
        if (!this.speaking) {
          this.speaking = true; this.attemptDur = 0;
          if (this.onSpeechStart) this.onSpeechStart();
        }
        this.attemptDur += dt;
      } else if (this.speaking) {
        this._hang -= dt;
        this.attemptDur += dt;
        if (this._hang <= 0) {
          this.speaking = false;
          const dur = Math.max(0, this.attemptDur - 0.4);
          if (this.onSpeechEnd) this.onSpeechEnd(dur);
        }
      }
    },
    // Level 2 heuristic: did the last run have roughly phrase shape?
    phraseShaped(dur) { return dur >= 0.9; }
  };

  // ------------------------------------------------------------ telemetry --
  const telemetry = [];
  function log(room, event, data) {
    const row = Object.assign({ t: Date.now(), room, event }, data || {});
    telemetry.push(row);
    if (telemetry.length > 400) telemetry.shift();
    if (GOL.DEBUG && typeof console !== 'undefined') console.info('[qrooms]', room, event, data || '');
  }

  // ---------------------------------------------------------- persistence --
  function save(roomKey, obj) {
    if (!GOL.store || !GOL.store.data) return;
    GOL.store.data.qrooms = GOL.store.data.qrooms || {};
    GOL.store.data.qrooms[roomKey] = obj;
    GOL.store.save();
  }
  function load(roomKey) {
    return (GOL.store && GOL.store.data && GOL.store.data.qrooms &&
      GOL.store.data.qrooms[roomKey]) || null;
  }

  GOL.QROOMS = {
    SURAH, AYAHS, words, table, playSlice,
    playAyah(n, onend) { return GOL.audio.playVerse(SURAH, n, onend); },
    echoAyah(n, vol) { return GOL.audio.echoVerse(SURAH, n, vol); },
    firstWord(n, opts) { return playSlice(n, 0, 0, opts); },
    openingPhrase(n, opts) {
      const half = Math.max(0, Math.ceil(words(n).length / 2) - 1);
      return playSlice(n, 0, half, opts);
    },
    stopSlice() { if (sliceRun) sliceRun.stop(); },
    ladder, mic, log, telemetry, save, load
  };
})();
