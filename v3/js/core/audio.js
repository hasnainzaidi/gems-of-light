// Gems of Light — audio.js
// One voice, treated with care. Verse recitations are mp3s (local file first,
// everyayah.com Alafasy as fallback). Everything else — breeze, birdsong,
// water, chimes — is synthesized quietly with WebAudio, and ducks to near
// silence whenever the Qur'an is being recited.
(function () {
  const GOL = window.GOL;
  const REMOTE = 'https://everyayah.com/data/Alafasy_128kbps/';

  const A = {
    ctx: null, master: null, amb: null, sfxBus: null,
    windGain: null, waterGain: null,
    muted: false, unlocked: false,
    _els: {}, _current: null, _birdTimer: 0, _birdsOn: false,
    _seq: null,

    // -------------------------------------------------------------- boot --
    unlock() {
      if (!this.ctx) {
        try {
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) { return; }
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 1;
        this.master.connect(this.ctx.destination);
        this.amb = this.ctx.createGain();
        this.amb.gain.value = 0;
        this.amb.connect(this.master);
        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = 0.9;
        this.sfxBus.connect(this.master);
        this._makeWind();
        this._makeWater();
      }
      // iOS: resume inside the gesture, kick a silent buffer through the
      // graph, and greet the very first successful unlock with a soft bell —
      // so the "tap anywhere to begin" tap is also the sound turning on.
      const welcome = () => {
        if (this._welcomed || this.ctx.state !== 'running') return;
        this._welcomed = true;
        try {
          const b = this.ctx.createBuffer(1, 1, 22050);
          const s = this.ctx.createBufferSource();
          s.buffer = b; s.connect(this.ctx.destination); s.start(0);
        } catch (e) {}
        this._mediaKick();
        if (!this.muted) this._bell(783.99, 0, 1.2, 0.06);
      };
      // iOS parks contexts in 'interrupted' (not just 'suspended') —
      // resume from ANY non-running state, on every gesture.
      if (this.ctx.state !== 'running') {
        const p = this.ctx.resume();
        if (p && p.then) p.then(welcome).catch(() => {});
      }
      welcome();
      this.unlocked = true;
    },
    // iOS mutes WebAudio (the "ambient" channel) when the silent switch is
    // on, while <audio> media plays regardless. Looping a silent media file
    // promotes the whole session to playback, so the chimes and breeze are
    // heard even in silent mode. (The same trick unmute.js uses.)
    _mediaKick() {
      if (this._kick) return;
      try {
        // a 0.05s silent WAV, built by hand — no asset needed
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
        el.loop = true;
        el.volume = 0.01;
        const p = el.play();
        if (p && p.catch) p.catch(() => {});
        this._kick = el;
      } catch (e) {}
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.05);
      if (this._current) this._current.el.muted = m;
      if (this._seq && this._seq.el) this._seq.el.muted = m;
      if (this._speaking) this._speaking.el.muted = m;
    },

    // -------------------------------------------------------- recitation --
    key(surahId, n) {
      return String(surahId).padStart(3, '0') + String(n).padStart(3, '0');
    },
    // the current reciter's paths (falls back to the legacy constants)
    _reciter() {
      return (GOL.RECITERS && GOL.V3 && GOL.RECITERS[GOL.V3.reciter]) ||
        { local: (GOL.AUDIO_BASE || 'audio/'), remote: REMOTE };
    },
    _el(key) {
      const rec = this._reciter();
      const ck = ((GOL.V3 && GOL.V3.reciter) || 'x') + ':' + key;
      if (!this._els[ck]) {
        const el = new Audio(rec.local + key + '.mp3');
        el.preload = 'auto';
        el._triedRemote = false;
        el.addEventListener('error', () => {
          if (!el._triedRemote) {
            el._triedRemote = true;
            el.src = rec.remote + key + '.mp3';
            el.load();
            // if a play was already in flight when the local file failed,
            // resume it on the remote — otherwise the fallback loads but
            // stays silent (the child pauses and hears nothing)
            if (el._wantPlay) { const p = el.play(); if (p && p.catch) p.catch(() => {}); }
          }
        });
        this._els[ck] = el;
      }
      return this._els[ck];
    },
    preloadSurah(surah) {
      for (const v of surah.verses) this._el(this.key(surah.id, v.n));
    },
    // Play one ayah. Always eventually calls onend (never blocks the child).
    playVerse(surahId, n, onend) {
      this.stopSpeak(); // narration always yields to the Qur'an
      this.stopRecitation();
      return this._verse(surahId, n, onend, false);
    },
    // A soft, distant hearing of an ayah — the world gently calling the
    // child toward its gem. Quieter than a recitation and never allowed
    // to interrupt one.
    echoVerse(surahId, n, vol) {
      if (this.reciting || this._speaking) return null;
      const h = this._verse(surahId, n, null, false);
      h.el.volume = Math.max(0.05, Math.min(1, vol == null ? 0.3 : vol));
      return h;
    },
    // The raw player. inSeq skips the stop/unduck so a running surah
    // recitation can call it verse after verse without ending itself.
    _verse(surahId, n, onend, inSeq) {
      const el = this._el(this.key(surahId, n));
      const h = { el, done: false, timer: null, guard: null };
      const finish = () => {
        if (h.done) return;
        h.done = true;
        clearTimeout(h.timer);
        clearTimeout(h.guard);
        el._wantPlay = false;
        el.removeEventListener('ended', finish);
        if (this._current === h) this._current = null;
        if (!inSeq) this.duck(false);
        if (onend) onend();
      };
      h.finish = finish;
      el.muted = this.muted;
      el.volume = 1;
      el.currentTime = 0;
      el.addEventListener('ended', finish);
      // if audio can't load at all (fully offline + streamed surah), move on
      h.timer = setTimeout(() => { if (el.paused || el.readyState < 2) finish(); }, 7000);
      // and nothing may stall the garden forever, no matter what
      h.guard = setTimeout(finish, 30000);
      this.duck(true);
      el._wantPlay = true;
      const p = el.play();
      if (p && p.catch) p.catch(() => { h.timer = setTimeout(finish, 2500); });
      this._current = h;
      return h;
    },
    // Recite a whole surah, verse by verse. cb.onVerse(i) fires before each
    // ayah at full voice. cb.breath sets the pause (seconds) BETWEEN ayat —
    // default 0.42s; cb.onBreath(i) fires as each pause begins (a wordless
    // "your turn"). The breath/onBreath mechanism is retained but unused by
    // the campfire, which now uses THE WORLD ECHOES instead:
    //
    // cb.echoVol (e.g. 0.3) — when set, after each ayah finishes at full voice
    // the SAME ayah plays again SOFT (an echo off the hills) before the normal
    // gap and the next ayah; the final ayah is echoed too. cb.onEcho(i) fires
    // as each echo begins. Nothing is ever silent — talqeen modeled, not asked
    // for. When echoVol is absent, behavior is exactly as before (breath path).
    playSurah(surah, cb) {
      this.stopSpeak();
      this.stopRecitation();
      const breathMs = (cb && cb.breath != null ? cb.breath : 0.42) * 1000;
      const echoVol = cb && cb.echoVol != null ? cb.echoVol : null;
      const seq = { i: 0, stopped: false, el: null };
      this._seq = seq;
      // the same ayah returning soft, then the normal gap into the next
      const echoStep = (heard) => {
        if (seq.stopped) return;
        const v = surah.verses[heard];
        if (cb && cb.onEcho) cb.onEcho(heard);
        const h = this._verse(surah.id, v.n, () => {
          seq.i++;
          const last = seq.i >= surah.verses.length;
          setTimeout(step, last ? 420 : breathMs);
        }, true);
        // _verse resets el.volume = 1 at start; drop it to the echo now that
        // playback has begun (same trick echoVerse uses)
        h.el.volume = Math.max(0.05, Math.min(1, echoVol));
        seq.el = h.el;
      };
      const step = () => {
        if (seq.stopped) return;
        if (seq.i >= surah.verses.length) {
          this._seq = null;
          this.duck(false);
          if (cb && cb.onend) cb.onend();
          return;
        }
        const v = surah.verses[seq.i];
        if (cb && cb.onVerse) cb.onVerse(seq.i);
        const h = this._verse(surah.id, v.n, () => {
          const heard = seq.i; // the ayah just finished at full voice
          if (echoVol != null) { echoStep(heard); return; }
          seq.i++;
          const last = seq.i >= surah.verses.length;
          // the breath (and its "your turn") sits between ayat, never after
          // the final one — the surah should end cleanly into what follows.
          // cb.breathFor(i) may vary the gap per ayah (stanza worlds breathe
          // long at stanza ends and flow tight within one — WORLDS-PLAN §1)
          const gap = last ? 420
            : (cb && cb.breathFor ? Math.max(0.05, cb.breathFor(heard)) * 1000 : breathMs);
          if (!last && cb && cb.onBreath) cb.onBreath(heard);
          setTimeout(step, gap);
        }, true);
        seq.el = h.el;
      };
      step();
      return seq;
    },
    stopRecitation() {
      if (this._seq) { this._seq.stopped = true; this._seq = null; }
      if (this._current) {
        const h = this._current;
        h.el.pause();
        h.done = true;
        clearTimeout(h.timer);
        this._current = null;
      }
      this.duck(false);
    },

    // -------------------------------------------------------- narration ---
    // A warm human voice for the English lines (stories, gentle instructions),
    // pre-generated with ElevenLabs into audio/voice/<id>.mp3 and cached like
    // recitations. If a file is missing the garden simply stays quiet —
    // NO synthetic/robot voice fallback, ever. Never speaks over the Qur'an.
    _speakEls: {}, _speakMissing: {}, _speaking: null,
    speak(id, onend) {
      if (this.reciting) { if (onend) onend(); return null; } // the Qur'an has the room
      if (this._speakMissing[id]) { if (onend) onend(); return null; }
      this.stopSpeak();
      let el = this._speakEls[id];
      if (!el) {
        el = new Audio((GOL.AUDIO_BASE || 'audio/') + 'voice/' + id + '.mp3');
        el.preload = 'auto';
        this._speakEls[id] = el;
      }
      const h = { el, id, done: false };
      const finish = (missing) => {
        if (h.done) return;
        h.done = true;
        clearTimeout(h.guard);
        el.removeEventListener('ended', onEnded);
        el.removeEventListener('error', onError);
        if (missing) this._speakMissing[id] = true;
        if (this._speaking === h) {
          this._speaking = null;
          if (!this.reciting) this.duck(false);
        }
        if (onend) onend();
      };
      const onEnded = () => finish(false);
      const onError = () => finish(true);
      el.muted = this.muted;
      el.currentTime = 0;
      el.addEventListener('ended', onEnded);
      el.addEventListener('error', onError);
      h.guard = setTimeout(() => finish(false), 30000);
      this._speaking = h;
      this.duck(true);
      const p = el.play();
      if (p && p.catch) p.catch(() => finish(true));
      return h;
    },
    stopSpeak() {
      if (!this._speaking) return;
      const h = this._speaking;
      this._speaking = null;
      h.done = true;
      clearTimeout(h.guard);
      try { h.el.pause(); } catch (e) {}
      if (!this.reciting) this.duck(false);
    },
    preloadVoice(ids) {
      for (const id of ids || []) {
        if (!this._speakEls[id] && !this._speakMissing[id]) {
          const el = new Audio((GOL.AUDIO_BASE || 'audio/') + 'voice/' + id + '.mp3');
          el.preload = 'auto';
          el.addEventListener('error', () => { this._speakMissing[id] = true; });
          this._speakEls[id] = el;
        }
      }
    },
    get reciting() { return !!(this._current || this._seq); },
    duck(on) {
      if (!this.ctx) return;
      this.amb.gain.setTargetAtTime(on ? 0.04 : this._ambTarget, this.ctx.currentTime, on ? 0.15 : 0.8);
      this.sfxBus.gain.setTargetAtTime(on ? 0.15 : 0.9, this.ctx.currentTime, 0.15);
    },

    // ---------------------------------------------------------- ambience --
    _ambTarget: 0,
    _makeWind() {
      const ctx = this.ctx;
      const len = 2 * ctx.sampleRate;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02; // brown-ish
        d[i] = last * 3.2;
      }
      this._noiseBuf = buf;
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 380; bp.Q.value = 0.6;
      this.windGain = ctx.createGain();
      this.windGain.gain.value = 0.34;
      src.connect(bp).connect(this.windGain).connect(this.amb);
      src.start();
      // slow breathing of the breeze
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoG = ctx.createGain();
      lfoG.gain.value = 0.22;
      lfo.connect(lfoG).connect(this.windGain.gain);
      lfo.start();
    },
    _makeWater() {
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      src.buffer = this._noiseBuf; src.loop = true;
      src.playbackRate.value = 1.7;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 1600; bp.Q.value = 0.8;
      this.waterGain = ctx.createGain();
      this.waterGain.gain.value = 0;
      src.connect(bp).connect(this.waterGain).connect(this.amb);
      src.start();
    },
    startAmbience(level) {
      if (!this.ctx) return;
      this._ambTarget = 0.3;
      this._birdsOn = level !== 'quiet';
      this._birdTimer = Math.min(this._birdTimer, 0.9); // the garden answers quickly
      if (!this.reciting) this.amb.gain.setTargetAtTime(this._ambTarget, this.ctx.currentTime, 0.35);
    },
    // A soft rising bell motif when a level opens — it tells small ears
    // that the garden has sound, before the first gem is ever found.
    enterFlourish() {
      if (!this.ctx || this.muted) return;
      const steps = [0, 4, 7];
      steps.forEach((s, i) => this._bell(523.25 * Math.pow(2, s / 12), i * 0.13, 1.1, 0.055));
    },
    stopAmbience() {
      if (!this.ctx) return;
      this._ambTarget = 0;
      this._birdsOn = false;
      this.amb.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
    },
    setWaterNearness(k) { // 0..1
      if (this.waterGain) this.waterGain.gain.setTargetAtTime(k * 0.28, this.ctx.currentTime, 0.4);
    },
    tick(dt) {
      if (!this.ctx || !this._birdsOn || this.reciting || this.muted) return;
      this._birdTimer -= dt;
      if (this._birdTimer <= 0) {
        this._birdTimer = 3.5 + Math.random() * 6;
        this._chirp();
      }
    },
    _chirp() {
      const ctx = this.ctx, t0 = ctx.currentTime;
      const notes = 2 + Math.floor(Math.random() * 3);
      const base = 2300 + Math.random() * 900;
      for (let i = 0; i < notes; i++) {
        const t = t0 + i * (0.09 + Math.random() * 0.07);
        const o = ctx.createOscillator();
        o.type = 'sine';
        const f = base * (1 + (Math.random() - 0.3) * 0.25);
        o.frequency.setValueAtTime(f, t);
        o.frequency.exponentialRampToValueAtTime(f * (1.1 + Math.random() * 0.25), t + 0.05);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.035, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        o.connect(g).connect(this.amb);
        o.start(t); o.stop(t + 0.1);
      }
    },

    // --------------------------------------------------------------- sfx --
    _bell(freq, when, dur, vol, dest) {
      const ctx = this.ctx;
      const t = ctx.currentTime + (when || 0);
      dest = dest || this.sfxBus;
      for (const [ratio, amp] of [[1, 1], [2.76, 0.22], [5.4, 0.08]]) {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = freq * ratio;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol * amp, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur * (ratio === 1 ? 1 : 0.4));
        o.connect(g).connect(dest);
        o.start(t); o.stop(t + dur + 0.1);
      }
    },
    // pentatonic ladder so collecting gems in any order still sounds musical
    chime(i, opts) {
      if (!this.ctx) return;
      const scale = [0, 2, 4, 7, 9, 12, 14, 16];
      const f = 523.25 * Math.pow(2, scale[i % scale.length] / 12);
      this._bell(f, 0, opts && opts.short ? 0.5 : 1.4, opts && opts.soft ? 0.05 : 0.14);
    },
    // noor seeds: quick pentatonic ticks that climb as a trail is gathered
    seedTick(step) {
      if (!this.ctx || this.muted) return;
      const scale = [0, 2, 4, 7, 9];
      const f = 1046.5 * Math.pow(2, (scale[step % 5] + 12 * Math.floor((step % 15) / 5)) / 12);
      this._bell(f, 0, 0.32, 0.035);
    },
    sfx(name) {
      if (!this.ctx || this.muted) return;
      const ctx = this.ctx, t = ctx.currentTime;
      const quick = (type, f0, f1, dur, vol, curve) => {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.setValueAtTime(f0, t);
        if (f1) o.frequency[curve || 'exponentialRampToValueAtTime'](f1, t + dur);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(this.sfxBus);
        o.start(t); o.stop(t + dur + 0.05);
      };
      const noise = (dur, vol, f, q) => {
        const s = ctx.createBufferSource();
        s.buffer = this._noiseBuf;
        s.playbackRate.value = 2.5;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q || 1;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        s.connect(bp).connect(g).connect(this.sfxBus);
        s.start(t); s.stop(t + dur);
      };
      switch (name) {
        case 'jump': quick('sine', 310, 540, 0.14, 0.05); break;
        case 'land': quick('triangle', 150, 95, 0.1, 0.045); noise(0.07, 0.02, 700, 0.8); break;
        case 'nearby': this._bell(1568, 0, 0.7, 0.035); break;
        case 'settle': this._bell(1318.5, 0, 0.8, 0.06); break;
        case 'place': noise(0.05, 0.05, 900, 2); quick('sine', 660, 700, 0.08, 0.05); break;
        case 'drift': quick('sine', 420, 310, 0.4, 0.03, 'linearRampToValueAtTime'); break;
        case 'hint': this._bell(1046.5, 0, 0.9, 0.05); break;
        case 'door':
          quick('sine', 70, 150, 1.4, 0.09, 'linearRampToValueAtTime');
          noise(1.3, 0.03, 300, 0.5);
          this._bell(523.25, 0.5, 1.6, 0.07);
          this._bell(659.25, 0.85, 1.6, 0.07);
          this._bell(784, 1.2, 1.8, 0.08);
          break;
        case 'splash': noise(0.35, 0.08, 900, 0.7); quick('sine', 300, 140, 0.3, 0.03); break;
        case 'flutter': noise(0.06, 0.03, 1800, 1.5); setTimeout(() => this.ctx && noise(0.06, 0.025, 2000, 1.5), 70); break;
        case 'tap': quick('sine', 880, 920, 0.05, 0.03); break;
        case 'unlockLevel':
          this._bell(783.99, 0, 1, 0.08);
          this._bell(1046.5, 0.12, 1.2, 0.08);
          break;
        case 'step': noise(0.04, 0.012, 500, 1); break;
        case 'bounce':
          quick('sine', 170, 640, 0.24, 0.07);
          noise(0.1, 0.03, 500, 0.8);
          break;
        case 'blossom': // finding a hidden Rahma blossom — a small golden fanfare
          this._bell(659.25, 0, 1.1, 0.09);
          this._bell(783.99, 0.14, 1.1, 0.09);
          this._bell(987.77, 0.28, 1.5, 0.1);
          this._bell(1318.5, 0.46, 1.8, 0.08);
          break;
        case 'praise': // the echo moment ends: warm, proud, tiny
          this._bell(1046.5, 0, 0.8, 0.06);
          this._bell(1318.5, 0.11, 1.1, 0.06);
          break;
        case 'yourTurn': // a soft "listening" cue
          this._bell(880, 0, 0.5, 0.04);
          this._bell(1174.7, 0.16, 0.7, 0.035);
          break;
        case 'veil': // a veiled gem revealing its true color
          noise(0.3, 0.025, 3200, 1.2);
          this._bell(1567.98, 0.02, 0.9, 0.05);
          break;
        case 'bloom': // flowers growing on the map
          this._bell(1318.5, 0, 0.6, 0.045);
          this._bell(1567.98, 0.1, 0.9, 0.04);
          break;
      }
    }
  };
  GOL.audio = A;
})();
