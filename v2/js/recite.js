// Gems of Light — recite.js
// The recitation checker is a dimmer, never a gate. Recognition can add light;
// silence and technical trouble simply lead to a gentler listening tier.
(function () {
  const GOL = window.GOL;

  // Keep every tunable together. The grown-up tuning strip may adjust the
  // first two for a real session; the child is never shown a score.
  const CONFIG = {
    THRESHOLD: 0.50,
    WORD_SIM: 0.70,
    MAX_TRIES: 3,
    SILENCE_MS: 1200,
    MAX_UTTERANCE_MS: 12000,
    READY_TIMEOUT_MS: 30000,
    RECITE_SURAHS: new Set([113])
  };
  const params = new URLSearchParams(location.search);
  const TUNE = params.get('tune') === '1';
  const KEEP_AUDIO = params.get('keepAudio') === '1';
  const LOG = (window.GOL_RECITE_LOG = window.GOL_RECITE_LOG || []);
  const recordings = [];

  function callbacks() {
    const cb = { level: () => {}, partial: () => {}, final: () => {}, error: () => {} };
    return {
      cb,
      onLevel(fn) { cb.level = fn || (() => {}); return this; },
      onPartial(fn) { cb.partial = fn || (() => {}); return this; },
      onFinal(fn) { cb.final = fn || (() => {}); return this; },
      onError(fn) { cb.error = fn || (() => {}); return this; }
    };
  }

  function downsample(chunks, inputRate) {
    const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const input = new Float32Array(length);
    let at = 0;
    for (const chunk of chunks) { input.set(chunk, at); at += chunk.length; }
    if (!length || inputRate === 16000) return input;
    const outLength = Math.max(1, Math.round(length * 16000 / inputRate));
    const out = new Float32Array(outLength);
    const ratio = inputRate / 16000;
    for (let i = 0; i < outLength; i++) {
      const p = i * ratio;
      const lo = Math.floor(p), hi = Math.min(length - 1, lo + 1), mix = p - lo;
      out[i] = input[lo] * (1 - mix) + input[hi] * mix;
    }
    return out;
  }

  function pcmToWav(pcm) {
    const buffer = new ArrayBuffer(44 + pcm.length * 2);
    const view = new DataView(buffer);
    const text = (offset, value) => { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)); };
    text(0, 'RIFF'); view.setUint32(4, 36 + pcm.length * 2, true); text(8, 'WAVE'); text(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, 16000, true); view.setUint32(28, 32000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    text(36, 'data'); view.setUint32(40, pcm.length * 2, true);
    for (let i = 0; i < pcm.length; i++) view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, pcm[i])) * 0x7fff, true);
    return new Blob([buffer], { type: 'audio/wav' });
  }

  class MicCapture {
    constructor(onLevel) {
      this.onLevel = onLevel;
      this.stream = null;
      this.ctx = null;
      this.chunks = [];
      this.listening = false;
      this.noiseFloor = 0.008;
    }
    async ensureStream() {
      if (this.stream && this.stream.active) return this.stream;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('microphone unavailable');
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }
      });
      return this.stream;
    }
    async start(onAutoStop) {
      await this.ensureStream();
      this.onAutoStop = onAutoStop;
      this.chunks = [];
      this.listening = true;
      this.startedAt = performance.now();
      this.speechStarted = false;
      this.voiceMs = 0;
      this.silenceMs = 0;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = this.ctx || new AudioCtx();
      if (this.ctx.state !== 'running') await this.ctx.resume();
      this.source = this.ctx.createMediaStreamSource(this.stream);
      const take = (chunk) => this._take(chunk);
      try {
        if (!this.ctx.audioWorklet) throw new Error('worklet unavailable');
        if (!this.workletReady) {
          const source = `class GardenMic extends AudioWorkletProcessor { process(inputs) { const c = inputs[0] && inputs[0][0]; if (c) { const copy = new Float32Array(c); this.port.postMessage(copy, [copy.buffer]); } return true; } } registerProcessor('garden-mic', GardenMic);`;
          this.workletUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
          await this.ctx.audioWorklet.addModule(this.workletUrl);
          this.workletReady = true;
        }
        this.node = new AudioWorkletNode(this.ctx, 'garden-mic');
        this.node.port.onmessage = (e) => take(e.data);
      } catch (e) {
        this.node = this.ctx.createScriptProcessor(4096, 1, 1);
        this.node.onaudioprocess = (event) => take(new Float32Array(event.inputBuffer.getChannelData(0)));
      }
      this.silent = this.ctx.createGain();
      this.silent.gain.value = 0;
      this.source.connect(this.node);
      this.node.connect(this.silent).connect(this.ctx.destination);
      return true;
    }
    _take(chunk) {
      if (!this.listening || !chunk || !chunk.length) return;
      this.chunks.push(new Float32Array(chunk));
      let sum = 0;
      for (let i = 0; i < chunk.length; i++) sum += chunk[i] * chunk[i];
      const rms = Math.sqrt(sum / chunk.length);
      this.onLevel(Math.min(1, rms * 9));
      const ms = chunk.length / this.ctx.sampleRate * 1000;
      const threshold = Math.max(0.015, this.noiseFloor * 3);
      if (!this.speechStarted) {
        this.noiseFloor = this.noiseFloor * 0.96 + Math.min(rms, 0.03) * 0.04;
        this.voiceMs = rms > threshold ? this.voiceMs + ms : 0;
        if (this.voiceMs >= 150) this.speechStarted = true;
      } else {
        this.silenceMs = rms > threshold ? 0 : this.silenceMs + ms;
        if (this.silenceMs >= CONFIG.SILENCE_MS) this._autoStop();
      }
      if (performance.now() - this.startedAt >= CONFIG.MAX_UTTERANCE_MS) this._autoStop();
    }
    _autoStop() {
      if (!this.listening) return;
      const fn = this.onAutoStop;
      Promise.resolve().then(() => fn && fn());
    }
    stop() {
      if (!this.listening) return new Float32Array();
      this.listening = false;
      try { this.source && this.source.disconnect(); } catch (e) {}
      try { this.node && this.node.disconnect(); } catch (e) {}
      try { this.silent && this.silent.disconnect(); } catch (e) {}
      this.onLevel(0);
      return downsample(this.chunks, this.ctx.sampleRate);
    }
    dispose() {
      this.stop();
      if (this.stream) this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
      if (this.ctx) this.ctx.close().catch(() => {});
      this.ctx = null;
      if (this.workletUrl) URL.revokeObjectURL(this.workletUrl);
    }
  }

  function makeOnDevice() {
    const event = callbacks();
    const engine = Object.assign(event, {
      kind: 'ondevice', worker: null, seq: 0, ready: false, listening: false,
      capture: new MicCapture((v) => event.cb.level(v)),
      ensureReady(onProgress) {
        this.progress = onProgress || (() => {});
        if (this.ready) return this.capture.ensureStream();
        if (!this.worker) {
          this.worker = new Worker('js/asr-worker.js', { type: 'module' });
          this.worker.onmessage = (e) => this._message(e.data || {});
          this.worker.onerror = (e) => this._fail(new Error(e.message || 'reciter worker'));
        }
        if (!this.readyPromise) {
          const id = ++this.seq;
          this.loadId = id;
          this.readyPromise = new Promise((resolve, reject) => { this.readyResolve = resolve; this.readyReject = reject; });
          this.worker.postMessage({ id, type: 'load' });
        }
        return Promise.all([this.readyPromise, this.capture.ensureStream()]).then(() => undefined);
      },
      async start(input) {
        this.current = input;
        this.listening = true;
        this.startedAt = performance.now();
        GOL.audio.duck(true);
        await this.capture.start(() => this.stop());
      },
      async stop() {
        if (!this.listening) return;
        this.listening = false;
        const audio = this.capture.stop();
        if (KEEP_AUDIO && audio.length) recordings.push(pcmToWav(audio));
        const id = ++this.seq;
        this.transcribeId = id;
        this.hangTimer = setTimeout(() => this._fail(new Error('reciter rested')), 20000);
        this.worker.postMessage({ id, type: 'transcribe', audio }, [audio.buffer]);
      },
      _message(msg) {
        if (msg.type === 'progress' && msg.id === this.loadId) this.progress(msg);
        else if (msg.type === 'ready' && msg.id === this.loadId) {
          this.ready = true;
          this.readyResolve && this.readyResolve();
        } else if (msg.type === 'result' && msg.id === this.transcribeId) {
          clearTimeout(this.hangTimer);
          GOL.audio.duck(false);
          const scored = GOL.reciteScore.score(msg.text || '', this.current.targetWords, { wordSim: CONFIG.WORD_SIM });
          event.cb.final({ matched: scored.matched, score: scored.score, transcription: msg.text || '', ms: msg.ms || Math.round(performance.now() - this.startedAt) });
        } else if (msg.type === 'error' && (msg.id === this.loadId || msg.id === this.transcribeId)) {
          this._fail(new Error(msg.message || 'reciter rested'));
        }
      },
      _fail(err) {
        clearTimeout(this.hangTimer);
        GOL.audio.duck(false);
        if (!this.ready && this.readyReject) this.readyReject(err);
        event.cb.error(err);
      },
      dispose() {
        clearTimeout(this.hangTimer);
        this.capture.dispose();
        if (this.worker) this.worker.terminate();
        this.worker = null;
        GOL.audio.duck(false);
      }
    });
    return engine;
  }

  function qrcSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem('gemsOfLight.qrc')) || {};
      return { key: saved.key || '', url: saved.url || 'wss://api.qurani.ai' };
    } catch (e) { return { key: '', url: 'wss://api.qurani.ai' }; }
  }

  function makeQrc() {
    const event = callbacks();
    const engine = Object.assign(event, {
      kind: 'qrc', listening: false, matched: new Set(),
      ensureReady() {
        const qrc = qrcSettings();
        if (!qrc.key || !window.WebSocket || !window.MediaRecorder) return Promise.reject(new Error('online reciter unavailable'));
        return Promise.resolve();
      },
      async start(input) {
        this.current = input;
        this.matched = new Set();
        this.stopping = false;
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
        const qrc = qrcSettings();
        const joiner = qrc.url.includes('?') ? '&' : '?';
        this.ws = new WebSocket(qrc.url + joiner + 'api_key=' + encodeURIComponent(qrc.key));
        this.ws.binaryType = 'arraybuffer';
        GOL.audio.duck(true);
        this.listening = true;
        this._monitorLevel();
        return new Promise((resolve, reject) => {
          this.startResolve = resolve; this.startReject = reject;
          this.startTimer = setTimeout(() => reject(new Error('online reciter rested')), 10000);
          this.ws.onopen = () => this.ws.send(JSON.stringify({
            method: 'StartTilawaSession', chapter_index: input.surahId, verse_index: input.verseN,
            word_index: 1, hafz_level: 2, tajweed_level: 1
          }));
          this.ws.onmessage = (message) => this._message(message);
          this.ws.onerror = () => this._fail(new Error('online reciter rested'));
          this.ws.onclose = () => { if (!this.stopping && this.listening) this._fail(new Error('online reciter rested')); };
        });
      },
      _message(message) {
        let reply;
        try { reply = JSON.parse(message.data); } catch (e) { return; }
        if (reply.event === 'start_tilawa_session') {
          const prefs = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];
          const mime = prefs.find((type) => MediaRecorder.isTypeSupported(type)) || '';
          this.media = new MediaRecorder(this.stream, mime ? { mimeType: mime } : undefined);
          this.media.ondataavailable = async (e) => {
            if (e.data && e.data.size && this.ws && this.ws.readyState === 1) {
              try { this.ws.send(await e.data.arrayBuffer()); } catch (err) {}
            }
          };
          this.media.start(20);
          clearTimeout(this.startTimer);
          this.startResolve && this.startResolve();
        } else if (reply.event === 'check_tilawa') {
          for (const word of reply.correct_words || []) {
            if (word.verse == null || Number(word.verse) === this.current.verseN) {
              const index = Number(word.word) - 1;
              if (index >= 0 && index < this.current.targetWords.length) this.matched.add(index);
            }
          }
          event.cb.partial({ matched: Array.from(this.matched).sort((a, b) => a - b) });
        }
      },
      _monitorLevel() {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        try {
          this.levelCtx = new AudioCtx();
          const source = this.levelCtx.createMediaStreamSource(this.stream);
          this.analyser = this.levelCtx.createAnalyser();
          this.analyser.fftSize = 512;
          source.connect(this.analyser);
          const data = new Float32Array(this.analyser.fftSize);
          const started = performance.now();
          let voiceMs = 0, silenceMs = 0, speech = false;
          this.levelTimer = setInterval(() => {
            if (!this.listening) return;
            this.analyser.getFloatTimeDomainData(data);
            let sum = 0; for (const sample of data) sum += sample * sample;
            const rms = Math.sqrt(sum / data.length);
            event.cb.level(Math.min(1, rms * 9));
            if (!speech) { voiceMs = rms > 0.015 ? voiceMs + 40 : 0; speech = voiceMs >= 160; }
            else { silenceMs = rms > 0.015 ? 0 : silenceMs + 40; if (silenceMs >= CONFIG.SILENCE_MS) this.stop(); }
            if (performance.now() - started >= CONFIG.MAX_UTTERANCE_MS) this.stop();
          }, 40);
        } catch (e) {}
      },
      async stop() {
        if (!this.listening) return;
        this.listening = false;
        this.stopping = true;
        clearInterval(this.levelTimer); clearTimeout(this.startTimer);
        event.cb.level(0);
        try { if (this.media && this.media.state === 'recording') this.media.stop(); } catch (e) {}
        await new Promise((resolve) => setTimeout(resolve, 260));
        const matched = Array.from(this.matched).sort((a, b) => a - b);
        this._close();
        event.cb.final({ matched, score: matched.length / this.current.targetWords.length, transcription: null, ms: null });
      },
      _fail(err) {
        if (!this.listening && this.stopping) return;
        this.listening = false; this.stopping = true;
        if (this.startReject) this.startReject(err);
        this._close();
        event.cb.error(err);
      },
      _close() {
        clearInterval(this.levelTimer); clearTimeout(this.startTimer);
        try { if (this.media && this.media.state === 'recording') this.media.stop(); } catch (e) {}
        try { this.stream && this.stream.getTracks().forEach((track) => track.stop()); } catch (e) {}
        try { this.ws && this.ws.readyState < 2 && this.ws.close(); } catch (e) {}
        try { this.levelCtx && this.levelCtx.close(); } catch (e) {}
        this.stream = null; this.ws = null; this.media = null;
        GOL.audio.duck(false);
      },
      dispose() { this.stopping = true; this.listening = false; this._close(); }
    });
    return engine;
  }

  function makeMock() {
    const event = callbacks();
    const engine = Object.assign(event, {
      kind: 'mock', listening: false, matched: new Set(), timers: [],
      ensureReady(onProgress) { if (onProgress) onProgress({ loaded: 1, total: 1 }); return Promise.resolve(); },
      start(input) {
        this.current = input; this.matched = new Set(); this.listening = true; this.startedAt = performance.now();
        const tick = (index) => {
          if (!this.listening) return;
          event.cb.level(0.18 + Math.random() * 0.55);
          if (Math.random() >= 0.12) this.matched.add(index);
          event.cb.partial({ matched: Array.from(this.matched).sort((a, b) => a - b) });
          if (index + 1 >= input.targetWords.length) this.stop();
          else this.timers.push(setTimeout(() => tick(index + 1), 380 + Math.random() * 260));
        };
        this.timers.push(setTimeout(() => tick(0), 260));
        return Promise.resolve();
      },
      stop() {
        if (!this.listening) return Promise.resolve();
        this.listening = false; this.timers.forEach(clearTimeout); this.timers = []; event.cb.level(0);
        const matched = Array.from(this.matched).sort((a, b) => a - b);
        event.cb.final({ matched, score: matched.length / this.current.targetWords.length, transcription: '[mock]', ms: Math.round(performance.now() - this.startedAt) });
        return Promise.resolve();
      },
      dispose() { this.listening = false; this.timers.forEach(clearTimeout); this.timers = []; }
    });
    return engine;
  }

  function makeEcho() {
    const event = callbacks();
    const engine = Object.assign(event, {
      kind: 'echo', listening: false, timers: [],
      ensureReady() { return Promise.resolve(); },
      start(input) {
        this.current = input; this.listening = true; this.startedAt = performance.now(); this.matched = [];
        GOL.audio.playVerse(input.surahId, input.verseN, () => {});
        input.targetWords.forEach((word, index) => {
          this.timers.push(setTimeout(() => {
            if (!this.listening) return;
            this.matched.push(index);
            event.cb.partial({ matched: this.matched.slice() });
            if (index === input.targetWords.length - 1) this.stop();
          }, 650 + index * 620));
        });
        return Promise.resolve();
      },
      stop() {
        if (!this.listening) return Promise.resolve();
        this.listening = false; this.timers.forEach(clearTimeout); this.timers = [];
        const matched = this.matched.length ? this.matched.slice() : this.current.targetWords.map((_, i) => i);
        event.cb.final({ matched, score: matched.length / this.current.targetWords.length, transcription: null, ms: Math.round(performance.now() - this.startedAt) });
        return Promise.resolve();
      },
      dispose() { this.listening = false; this.timers.forEach(clearTimeout); this.timers = []; GOL.audio.stopRecitation(); }
    });
    return engine;
  }

  function createEngine(kind) {
    if (kind === 'qrc') return makeQrc();
    if (kind === 'mock') return makeMock();
    if (kind === 'echo') return makeEcho();
    return makeOnDevice();
  }

  function preferredKind() {
    const forced = params.get('recite');
    if (['mock', 'ondevice', 'qrc', 'echo'].includes(forced)) return forced;
    const qrc = qrcSettings();
    return qrc.key && navigator.onLine && localStorage.getItem('gemsOfLight.reciteEngine') === 'qrc' ? 'qrc' : 'ondevice';
  }

  function fallbackKind(kind) {
    if (kind === 'qrc') return 'ondevice';
    if (kind === 'ondevice' || kind === 'mock') return 'echo';
    return null;
  }

  function log(entry) {
    LOG.push(Object.assign({ time: new Date().toISOString() }, entry));
  }

  function saveLog() {
    const blob = new Blob([JSON.stringify(LOG, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gems-of-light-recitation-log.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function saveQrc(key, url, enabled) {
    localStorage.setItem('gemsOfLight.qrc', JSON.stringify({ key: key || '', url: url || 'wss://api.qurani.ai' }));
    localStorage.setItem('gemsOfLight.reciteEngine', enabled ? 'qrc' : 'ondevice');
  }

  GOL.recite = {
    config: CONFIG, RECITE_SURAHS: CONFIG.RECITE_SURAHS, tune: TUNE, keepAudio: KEEP_AUDIO,
    recordings, createEngine, preferredKind, fallbackKind, qrcSettings, saveQrc, log, saveLog
  };
})();
