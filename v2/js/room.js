// Gems of Light — room.js
// The Recitation Room: no objective, just shelves of collected light.
// And, behind a patient little gate, a quiet page for grown-ups.
(function () {
  const GOL = window.GOL;
  const { alpha, tint, shade } = GOL.color;

  // ================================================================= ROOM ==
  const room = {
    t: 0, fx: null, buttons: [], playing: null, playVerse: -1, recite: null,
    enter() {
      this.t = 0;
      this.fx = GOL.makeFx();
      this.playing = null;
      this.playVerse = -1;
      this.recite = null;
      GOL.audio.startAmbience('quiet');
      for (const L of GOL.LEVELS) GOL.audio.preloadSurah(L.surah);
    },
    exit() {
      this.closeRecite(false);
      GOL.audio.stopRecitation();
    },

    rows(W, H) {
      const top = 92, bottom = H - 24;
      const rh = (bottom - top) / 6;
      return GOL.LEVELS.map((L, i) => ({ L, y: top + i * rh + rh / 2, rh }));
    },
    update(dt, W, H) {
      this.t += dt;
      this.fx.update(dt);
      if (this.recite) {
        this.updateRecite(dt, W, H);
        return;
      }
      const rows = this.rows(W, H);
      this.buttons = [
        { x: 40, y: 40, r: 30, iconName: 'back', fn: () => GOL.go('map') },
        Object.assign({}, GOL.muteButton(W))
      ];
      for (const r of rows) {
        if (!GOL.recite.RECITE_SURAHS.has(r.L.surahId)) continue;
        this.buttons.push({
          x: W - 84, y: r.y, r: 25, drawR: 17, iconName: 'mic', reciteEntry: true,
          fn: () => this.startRecite(r.L)
        });
      }
      if (GOL.hitButtons(GOL.Input.taps, this.buttons)) return;
      for (const tap of GOL.Input.taps) {
        if (tap.ui) continue;
        for (const r of rows) {
          if (Math.abs(tap.y - r.y) > r.rh / 2) continue;
          const st = GOL.store.level(r.L.surahId);
          const found = st.found || [];
          // name plate: play the whole surah (once every gem is on the shelf)
          if (tap.x < 236) {
            tap.ui = true;
            if (found.length === r.L.surah.verses.length) {
              this.playing = r.L;
              this.playVerse = -1;
              GOL.audio.playSurah(r.L.surah, {
                onVerse: (i) => (this.playVerse = i),
                onend: () => { this.playing = null; this.playVerse = -1; }
              });
            } else if (found.length) {
              GOL.audio.sfx('drift');
            }
            return;
          }
          // individual gems
          const verses = r.L.surah.verses.length;
          for (let v = 0; v < verses; v++) {
            const gx = this.gemX(W, v);
            if (GOL.dist(tap.x, tap.y, gx, r.y) < 26 && found.includes(v + 1)) {
              tap.ui = true;
              this.playing = null;
              this.playVerse = -1;
              this._solo = { surahId: r.L.surahId, v };
              GOL.audio.playVerse(r.L.surahId, v + 1, () => (this._solo = null));
              this.fx.spawn('ring', gx, r.y, { color: GOL.GEMS[v % 7].glow, size: 18 });
              return;
            }
          }
        }
      }
    },
    gemX(W, v) { return 280 + v * Math.min(62, (W - 330) / 7); },

    startRecite(L) {
      GOL.audio.stopRecitation();
      this.playing = null;
      const st = GOL.store.level(L.surahId);
      st.recite = st.recite || { sessions: 0, ayahsPassed: 0, ayahsCarried: 0, bestScores: {}, wordMisses: {}, engine: '' };
      this.recite = {
        L, st, verseIndex: 0, attempts: 0, lit: new Set(), litAt: {}, complete: L.surah.verses.map(() => false),
        phase: 'loading', status: 'getting your reciter ready… (just this once)', level: 0,
        engine: null, engineKind: GOL.recite.preferredKind(), hadAttempt: false, sessionCounted: false,
        lastTranscription: '', progress: 0, wordRects: [], celebrationVerse: -1, disposed: false
      };
      this.setupReciteEngine(this.recite.engineKind);
    },

    setupReciteEngine(kind) {
      const R = this.recite;
      if (!R || R.disposed) return;
      clearTimeout(R.readyTimer);
      if (R.engine) R.engine.dispose();
      R.engineKind = kind;
      R.st.recite.engine = kind;
      R.phase = 'loading';
      R.status = kind === 'echo' ? 'listen… then say it back' : 'getting your reciter ready… (just this once)';
      const engine = (R.engine = GOL.recite.createEngine(kind));
      engine
        .onLevel((level) => { if (this.recite === R) R.level = level; })
        .onPartial((result) => { if (this.recite === R) this.lightReciteWords(result.matched || []); })
        .onFinal((result) => { if (this.recite === R) this.finishReciteAttempt(result); })
        .onError((err) => {
          if (this.recite !== R || R.engine !== engine) return;
          this.noteReciteEngineIssue(err, kind);
          this.fallbackReciteEngine();
        });
      const ready = engine.ensureReady((progress) => {
        if (this.recite !== R || !progress.total) return;
        R.progress = Math.max(R.progress, progress.loaded / progress.total);
      });
      const timeout = new Promise((resolve, reject) => {
        R.readyTimer = setTimeout(() => reject(new Error('reciter readiness timed out')), GOL.recite.config.READY_TIMEOUT_MS);
      });
      Promise.race([ready, timeout]).then(() => {
        if (this.recite !== R || R.engine !== engine) return;
        clearTimeout(R.readyTimer);
        R.phase = 'idle';
        R.status = kind === 'echo' ? 'listen… then say it back' : 'tap the light, then recite';
      }).catch((err) => {
        if (this.recite === R && R.engine === engine) {
          this.noteReciteEngineIssue(err, kind);
          this.fallbackReciteEngine();
        }
      });
    },

    noteReciteEngineIssue(err, kind) {
      const R = this.recite;
      if (!R) return;
      const message = err && err.message ? err.message : String(err || 'unavailable');
      R.lastError = kind + ': ' + message;
      console.warn('[recite] ' + R.lastError);
    },

    fallbackReciteEngine() {
      const R = this.recite;
      if (!R) return;
      const next = GOL.recite.fallbackKind(R.engineKind) || 'echo';
      this.setupReciteEngine(next);
    },

    reciteVerse() {
      const R = this.recite;
      return R && R.L.surah.verses[R.verseIndex];
    },

    async toggleReciteMic() {
      const R = this.recite;
      if (!R || !R.engine) return;
      if (R.phase === 'listening') {
        const engine = R.engine;
        R.phase = 'scoring';
        R.status = 'gathering the light…';
        try { await engine.stop(); } catch (e) { if (this.recite === R && R.engine === engine) this.fallbackReciteEngine(); }
        return;
      }
      if (R.phase !== 'idle') return;
      const verse = this.reciteVerse();
      const engine = R.engine;
      R.phase = 'listening';
      R.status = R.engineKind === 'echo' ? 'listen… then say it back' : 'listening…';
      R.hadAttempt = true;
      try {
        await engine.start({ surahId: R.L.surahId, verseN: verse.n, targetWords: verse.ar.split(/\s+/) });
      } catch (e) {
        if (this.recite === R && R.engine === engine) this.fallbackReciteEngine();
      }
    },

    lightReciteWords(indices, carry) {
      const R = this.recite;
      if (!R) return;
      const now = performance.now();
      let stagger = 0;
      for (const index of indices) {
        if (R.lit.has(index)) continue;
        R.lit.add(index);
        R.litAt[index] = now + stagger * (carry ? 90 : 60);
        stagger++;
        const rect = R.wordRects[index];
        if (rect) this.fx.spawn('ring', rect.x, rect.y, { color: GOL.GEMS[index % 7].glow, size: 16 });
      }
    },

    finishReciteAttempt(result) {
      const R = this.recite;
      if (!R) return;
      const verse = this.reciteVerse();
      const words = verse.ar.split(/\s+/);
      const matched = Array.from(new Set(result.matched || [])).filter((i) => i >= 0 && i < words.length);
      this.lightReciteWords(matched);
      R.level = 0;
      R.lastTranscription = result.transcription || '';
      R.st.recite.bestScores[verse.n] = Math.max(R.st.recite.bestScores[verse.n] || 0, Number(result.score) || 0);
      for (let i = 0; i < words.length; i++) {
        if (matched.includes(i)) continue;
        const key = verse.n + ':' + i;
        R.st.recite.wordMisses[key] = (R.st.recite.wordMisses[key] || 0) + 1;
      }
      if (!R.sessionCounted) { R.st.recite.sessions++; R.sessionCounted = true; }
      const fraction = R.lit.size / words.length;
      let outcome = 'below-threshold';
      if (fraction >= GOL.recite.config.THRESHOLD) outcome = 'voice-lit';
      else if (R.attempts + 1 >= GOL.recite.config.MAX_TRIES) outcome = 'carried';
      GOL.recite.log({
        engine: R.engineKind, verse: verse.n, transcription: result.transcription || null,
        score: Number(result.score) || 0, matched, total: words.length, ms: result.ms, outcome
      });
      if (fraction >= GOL.recite.config.THRESHOLD) {
        R.st.recite.ayahsPassed++;
        this.completeReciteAyah(false);
      } else {
        R.attempts++;
        if (R.attempts >= GOL.recite.config.MAX_TRIES) {
          R.st.recite.ayahsCarried++;
          this.lightReciteWords(words.map((_, i) => i), true);
          this.completeReciteAyah(true);
        } else {
          R.phase = 'hint';
          R.status = "let's hear it once — then you try";
          GOL.audio.playVerse(R.L.surahId, verse.n, () => {
            if (this.recite !== R || R.phase !== 'hint') return;
            R.phase = 'idle';
            R.status = R.engineKind === 'echo' ? 'listen… then say it back' : 'tap the light, then recite';
          });
        }
      }
      GOL.store.save();
    },

    completeReciteAyah(carried) {
      const R = this.recite;
      R.complete[R.verseIndex] = true;
      R.phase = 'pause';
      R.status = carried ? 'the garden carries you through' : '✦ the words are glowing';
      if (carried) GOL.audio.sfx('hint'); else GOL.audio.chime(R.verseIndex);
      R.advanceAt = performance.now() + 1200;
    },

    advanceReciteAyah() {
      const R = this.recite;
      if (!R) return;
      if (R.verseIndex >= R.L.surah.verses.length - 1) {
        R.phase = 'celebration';
        R.status = 'Al-Falaq, whole — from your own voice';
        GOL.audio.playSurah(R.L.surah, {
          onVerse: (index) => { if (this.recite === R) R.celebrationVerse = index; },
          onend: () => {
            if (this.recite !== R) return;
            R.status = 'kept glowing on the shelf';
            R.returnAt = performance.now() + 1500;
          }
        });
        return;
      }
      R.verseIndex++;
      R.attempts = 0;
      R.lit = new Set();
      R.litAt = {};
      R.wordRects = [];
      R.phase = 'idle';
      R.status = R.engineKind === 'echo' ? 'listen… then say it back' : 'tap the light, then recite';
    },

    closeRecite(save) {
      const R = this.recite;
      if (!R) return;
      R.disposed = true;
      clearTimeout(R.readyTimer);
      if (R.engine) R.engine.dispose();
      GOL.audio.stopRecitation();
      if (save !== false) GOL.store.save();
      this.recite = null;
    },

    updateRecite(dt, W, H) {
      const R = this.recite;
      if (!R) return;
      if (R.advanceAt && performance.now() >= R.advanceAt) { R.advanceAt = 0; this.advanceReciteAyah(); }
      if (R.returnAt && performance.now() >= R.returnAt) { this.closeRecite(true); return; }
      const pw = Math.min(W - 120, 860), ph = H - 140, px = (W - pw) / 2, py = 70;
      const micY = py + ph - (GOL.recite.tune ? 90 : 76);
      this.buttons = [
        { x: px + 34, y: py + 34, r: 28, iconName: 'back', fn: () => this.closeRecite(true) },
        { x: W / 2, y: micY, r: 46, drawR: 34, iconName: R.phase === 'listening' ? 'pause' : 'mic', fn: () => this.toggleReciteMic() }
      ];
      if (GOL.hitButtons(GOL.Input.taps, this.buttons)) return;
      if (!GOL.recite.tune) return;
      const controls = this.reciteTuneControls(px, py, pw);
      for (const tap of GOL.Input.taps) {
        if (tap.ui) continue;
        if (tap.y >= controls.threshold.y - 12 && tap.y <= controls.threshold.y + 12 && tap.x >= controls.threshold.x && tap.x <= controls.threshold.x + controls.threshold.w) {
          tap.ui = true;
          GOL.recite.config.THRESHOLD = 0.2 + 0.8 * (tap.x - controls.threshold.x) / controls.threshold.w;
        } else if (tap.y >= controls.wordSim.y - 12 && tap.y <= controls.wordSim.y + 12 && tap.x >= controls.wordSim.x && tap.x <= controls.wordSim.x + controls.wordSim.w) {
          tap.ui = true;
          GOL.recite.config.WORD_SIM = 0.5 + 0.45 * (tap.x - controls.wordSim.x) / controls.wordSim.w;
        } else if (GOL.dist(tap.x, tap.y, controls.log.x, controls.log.y) < 35) {
          tap.ui = true; GOL.recite.saveLog();
        } else if (GOL.dist(tap.x, tap.y, controls.qrc.x, controls.qrc.y) < 35) {
          tap.ui = true;
          const current = GOL.recite.qrcSettings();
          const key = window.prompt('Qurani.ai API key (leave blank for on-device only)', current.key);
          if (key != null) {
            const url = key ? window.prompt('Qurani.ai WebSocket URL', current.url) : current.url;
            GOL.recite.saveQrc(key, url || current.url, !!key);
          }
        }
      }
    },

    reciteTuneControls(px, py, pw) {
      return {
        threshold: { x: px + 100, y: py + 78, w: 145 },
        wordSim: { x: px + 350, y: py + 78, w: 145 },
        log: { x: px + pw - 140, y: py + 78 },
        qrc: { x: px + pw - 60, y: py + 78 }
      };
    },

    draw(ctx, W, H) {
      const t = this.t;
      // interior: warm plaster walls holding a wall of little arched alcoves,
      // as in the final board panel — every gem kept glowing in its niche.
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#F0E7CD');
      bg.addColorStop(0.7, '#E2D5AF');
      bg.addColorStop(1, '#D2C49C');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      // morning light leaning in from the upper right
      const shaft = ctx.createLinearGradient(W, 0, W * 0.45, H * 0.7);
      shaft.addColorStop(0, alpha('#FFF2C8', 0.32));
      shaft.addColorStop(1, alpha('#FFF2C8', 0));
      ctx.fillStyle = shaft;
      ctx.fillRect(0, 0, W, H);
      // carved border framing the alcove wall
      ctx.strokeStyle = alpha('#B49E72', 0.5);
      ctx.lineWidth = 2;
      GOL.roundRect(ctx, 26, 80, W - 52, H - 104, 14);
      ctx.stroke();
      for (const cx2 of [26 + 14, W - 26 - 14]) {
        GOL.star8Path(ctx, cx2, 80 + 14, 5, Math.PI / 8);
        ctx.fillStyle = alpha('#B49E72', 0.6); ctx.fill();
      }
      // vines slipping in along the ceiling
      for (const side of [0, 1]) {
        for (let v = 0; v < 3; v++) {
          const vx = (side ? W - 40 : 40) + (side ? -1 : 1) * v * 30;
          const len = 30 + ((v * 29 + side * 13) % 34);
          const sway = Math.sin(t * 0.8 + v * 1.9 + side * 2.4) * 3.5;
          ctx.strokeStyle = alpha('#4C7A45', 0.6);
          ctx.lineWidth = 1.6; ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(vx, -3);
          ctx.quadraticCurveTo(vx + sway * 0.5, len * 0.55, vx + sway, len);
          ctx.stroke();
          for (let li = 1; li <= 2; li++) {
            GOL.paint.leafShape(ctx, vx + sway * 0.6, (len / 2) * li - 4, 7, 2.6, li % 2 ? 0.9 : 2.3, alpha(li % 2 ? '#79B369' : '#54904D', 0.75));
          }
        }
      }
      GOL.text(ctx, 'The Recitation Room', W / 2, 40, { size: 26, weight: '800' });
      GOL.text(ctx, 'everything you have gathered, kept glowing', W / 2, 66, { size: 14, weight: '600', color: GOL.INK_SOFT });

      const rows = this.rows(W, H);
      const gap = Math.min(62, (W - 330) / 7);
      const nw = Math.min(46, gap - 6);
      for (const r of rows) {
        const st = GOL.store.level(r.L.surahId);
        const found = st.found || [];
        const all = found.length === r.L.surah.verses.length;
        const isPlaying = this.playing === r.L;
        // name plate: a small carved plaque
        GOL.drawPanel(ctx, 40, r.y - 24, 188, 50, { radius: 12, plain: true, alpha: isPlaying ? 1 : 0.85 });
        GOL.text(ctx, r.L.surah.englishName, 134, r.y - 6, { size: 15.5, weight: '800', color: all ? GOL.INK : '#9A9478' });
        GOL.text(ctx, all ? '▶ hear it whole' : found.length ? found.length + ' of ' + r.L.surah.verses.length + ' gems' : 'still out in the garden', 134, r.y + 13, { size: 11.5, weight: '600', color: all ? GOL.GOLD : '#9A9478' });
        // one arched niche per ayah
        r.L.surah.verses.forEach((v, vi) => {
          const gx = this.gemX(W, vi);
          const has = found.includes(vi + 1);
          const hot = has && ((isPlaying && this.playVerse === vi) ||
            (this._solo && this._solo.surahId === r.L.surahId && this._solo.v === vi));
          const topY = r.y - 30, botY = r.y + 22;
          const nichePath = () => {
            ctx.beginPath();
            ctx.moveTo(gx - nw / 2, botY);
            ctx.lineTo(gx - nw / 2, topY + nw * 0.42);
            ctx.quadraticCurveTo(gx - nw / 2, topY, gx, topY);
            ctx.quadraticCurveTo(gx + nw / 2, topY, gx + nw / 2, topY + nw * 0.42);
            ctx.lineTo(gx + nw / 2, botY);
            ctx.closePath();
          };
          // recess
          const rg = ctx.createLinearGradient(0, topY, 0, botY);
          rg.addColorStop(0, has ? '#C9B587' : '#CBB98D');
          rg.addColorStop(1, has ? '#B39D6E' : '#BAA678');
          nichePath();
          ctx.fillStyle = rg;
          ctx.fill();
          // inner shadow along the top of the recess
          ctx.save();
          nichePath(); ctx.clip();
          const ish = ctx.createLinearGradient(0, topY, 0, topY + 18);
          ish.addColorStop(0, 'rgba(90,74,46,0.4)');
          ish.addColorStop(1, 'rgba(90,74,46,0)');
          ctx.fillStyle = ish;
          ctx.fillRect(gx - nw / 2, topY, nw, 20);
          // the glow a kept gem casts on its alcove
          if (has) {
            const gl = ctx.createRadialGradient(gx, r.y + 2, 2, gx, r.y + 2, nw * 0.75);
            gl.addColorStop(0, alpha(GOL.GEMS[vi % 7].glow, hot ? 0.5 : 0.28));
            gl.addColorStop(1, alpha(GOL.GEMS[vi % 7].glow, 0));
            ctx.fillStyle = gl;
            ctx.fillRect(gx - nw, topY, nw * 2, botY - topY);
          }
          ctx.restore();
          // rim: shadow left/top, warm light right/bottom
          nichePath();
          ctx.strokeStyle = 'rgba(122,98,56,0.4)';
          ctx.lineWidth = 1.6;
          ctx.stroke();
          ctx.strokeStyle = alpha('#FFF6DC', 0.75);
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(gx - nw / 2 - 1.5, botY + 1.5);
          ctx.lineTo(gx + nw / 2 + 1.5, botY + 1.5);
          ctx.stroke();
          // sill shadow under the niche
          ctx.fillStyle = 'rgba(90,74,46,0.14)';
          ctx.beginPath(); ctx.ellipse(gx, botY + 5, nw * 0.55, 3, 0, 0, Math.PI * 2); ctx.fill();
          if (has) {
            GOL.drawGem(ctx, gx, r.y + (hot ? -2 : 2), hot ? 16 : 11.5, GOL.GEMS[vi % 7], t, { phase: vi, glow: hot ? 1 : 0.45 });
            // light pooling on the sill
            ctx.fillStyle = alpha(GOL.GEMS[vi % 7].glow, hot ? 0.35 : 0.18);
            ctx.beginPath(); ctx.ellipse(gx, botY - 2, nw * 0.34, 2.6, 0, 0, Math.PI * 2); ctx.fill();
          } else {
            GOL.star8Path(ctx, gx, r.y + 1, 8, Math.PI / 8);
            ctx.fillStyle = 'rgba(120,104,70,0.14)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(150,128,84,0.32)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        });
        // Lightling settles in to listen when a surah is playing
        if (isPlaying) {
          ctx.save();
          ctx.translate(W - 52, r.y + 22);
          ctx.scale(0.72, 0.72);
          // a little round cushion
          ctx.fillStyle = '#C8A76B';
          ctx.beginPath(); ctx.ellipse(0, 2, 22, 7.5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = alpha('#E5C98F', 0.85);
          ctx.beginPath(); ctx.ellipse(0, 0, 20, 6.5, 0, 0, Math.PI * 2); ctx.fill();
          GOL.drawSprite(ctx, 0, 0, {
            vx: 0, vy: 0, grounded: true, facing: -1, t,
            idleT: 3, blink: false, squashX: 1.04, squashY: 0.94, moving: false,
            happy: true, glow: 0.5
          });
          ctx.restore();
        }
      }
      this.fx.draw(ctx);
      if (!this.recite) {
        for (const b of this.buttons) {
          if (b.reciteEntry) {
            const glow = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, 30 + Math.sin(t * 2.2) * 3);
            glow.addColorStop(0, alpha('#F0C878', 0.30));
            glow.addColorStop(1, alpha('#F0C878', 0));
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(b.x, b.y, 34, 0, Math.PI * 2); ctx.fill();
          }
          GOL.drawButton(ctx, b.x, b.y, b.drawR || 22, b.icon ? b.icon() : b.iconName);
        }
      }
      GOL.drawVignette(ctx, W, H, 0.1);
      if (this.recite) this.drawRecite(ctx, W, H);
    },

    drawRecite(ctx, W, H) {
      const R = this.recite;
      const verse = this.reciteVerse();
      if (!R || !verse) return;
      const words = verse.ar.split(/\s+/);
      const pw = Math.min(W - 120, 860), ph = H - 140, px = (W - pw) / 2, py = 70;
      const now = performance.now();

      ctx.fillStyle = 'rgba(46,64,50,0.45)';
      ctx.fillRect(0, 0, W, H);
      GOL.drawPanel(ctx, px, py, pw, ph, { radius: 24, alpha: 0.98 });

      const gemGap = 34;
      const gemStart = W / 2 - gemGap * 2;
      for (let i = 0; i < R.complete.length; i++) {
        const current = i === R.verseIndex && R.phase !== 'celebration';
        const lit = R.complete[i] || (R.phase === 'celebration' && i <= R.celebrationVerse);
        GOL.drawGem(ctx, gemStart + i * gemGap, py + 35 + (current ? Math.sin(this.t * 4) * 2 : 0), lit ? 10 : 8,
          GOL.GEMS[i % 7], this.t, { phase: i, glow: lit ? 0.9 : current ? 0.45 : 0.08 });
      }

      if (GOL.recite.tune) this.drawReciteTuning(ctx, px, py, pw);

      ctx.save();
      ctx.font = '400 34px ' + GOL.fonts.ar;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.direction = 'rtl';
      const gap = 15, maxWidth = pw - 120;
      const measured = words.map((word) => Math.ceil(ctx.measureText(word).width));
      const lines = [];
      let line = [], width = 0;
      for (let i = 0; i < words.length; i++) {
        const next = measured[i] + (line.length ? gap : 0);
        if (line.length && width + next > maxWidth) { lines.push({ items: line, width }); line = []; width = 0; }
        line.push(i); width += measured[i] + (line.length > 1 ? gap : 0);
      }
      if (line.length) lines.push({ items: line, width });
      const baseY = py + ph * (GOL.recite.tune ? 0.42 : 0.37) - (lines.length - 1) * 36;
      R.wordRects = [];
      lines.forEach((entry, lineIndex) => {
        let right = W / 2 + entry.width / 2;
        for (const index of entry.items) {
          const x = right - measured[index] / 2;
          const y = baseY + lineIndex * 72;
          right -= measured[index] + gap;
          R.wordRects[index] = { x, y, w: measured[index], h: 46 };
          const lit = R.lit.has(index) && now >= (R.litAt[index] || 0);
          ctx.save();
          if (lit) {
            ctx.shadowBlur = 14;
            ctx.shadowColor = 'rgba(217,164,65,0.55)';
            ctx.fillStyle = '#2E4032';
            ctx.fillText(words[index], x, y - 1);
            ctx.shadowBlur = 0;
            ctx.fillText(words[index], x, y - 1);
          } else {
            ctx.fillStyle = '#B9B09A';
            ctx.fillText(words[index], x, y);
          }
          ctx.restore();
        }
      });
      ctx.restore();

      const textY = baseY + lines.length * 72 + 10;
      GOL.text(ctx, GOL.trFix(verse.tr), W / 2, textY, { size: 15, weight: '600', color: GOL.INK_SOFT });
      GOL.text(ctx, verse.meaning, W / 2, textY + 30, { size: Math.min(15, pw / 48), weight: '600', color: GOL.INK_SOFT });

      const micY = py + ph - (GOL.recite.tune ? 90 : 76);
      if (R.phase === 'listening') {
        const pulse = 40 + R.level * 26 + Math.sin(this.t * 5) * 3;
        for (let i = 0; i < 2; i++) {
          ctx.strokeStyle = alpha('#D9A441', 0.34 - i * 0.12);
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(W / 2, micY, pulse + i * 12, 0, Math.PI * 2); ctx.stroke();
        }
      }
      for (const b of this.buttons) GOL.drawButton(ctx, b.x, b.y, b.drawR || 22, b.icon ? b.icon() : b.iconName);
      let status = R.status;
      if (R.phase === 'loading' && R.progress > 0 && R.progress < 1) status += ' ' + Math.round(R.progress * 100) + '%';
      GOL.text(ctx, status, W / 2, micY + 49, { size: 14, weight: '700', color: GOL.INK_SOFT });
      if (GOL.recite.keepAudio) {
        GOL.text(ctx, 'recordings kept this session · ' + GOL.recite.recordings.length, px + pw - 18, py + ph - 18,
          { size: 10.5, weight: '700', color: '#9A6B40', align: 'right' });
      }
    },

    drawReciteTuning(ctx, px, py, pw) {
      const R = this.recite;
      const C = this.reciteTuneControls(px, py, pw);
      const slider = (control, value, min, max, label) => {
        GOL.text(ctx, label + ' ' + value.toFixed(2), control.x - 8, control.y, { size: 10.5, weight: '700', color: GOL.INK_SOFT, align: 'right' });
        ctx.strokeStyle = alpha(GOL.GOLD, 0.5); ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(control.x, control.y); ctx.lineTo(control.x + control.w, control.y); ctx.stroke();
        const x = control.x + control.w * (value - min) / (max - min);
        ctx.fillStyle = GOL.GOLD; ctx.beginPath(); ctx.arc(x, control.y, 6, 0, Math.PI * 2); ctx.fill();
      };
      slider(C.threshold, GOL.recite.config.THRESHOLD, 0.2, 1, 'threshold');
      slider(C.wordSim, GOL.recite.config.WORD_SIM, 0.5, 0.95, 'word sim');
      GOL.drawPanel(ctx, C.log.x - 34, C.log.y - 14, 68, 28, { radius: 12, plain: true, alpha: 0.65 });
      GOL.text(ctx, 'save log', C.log.x, C.log.y, { size: 10.5, weight: '700' });
      GOL.drawPanel(ctx, C.qrc.x - 34, C.qrc.y - 14, 68, 28, { radius: 12, plain: true, alpha: 0.65 });
      GOL.text(ctx, 'QRC setup', C.qrc.x, C.qrc.y, { size: 10.5, weight: '700' });
      const heard = R.lastTranscription ? R.lastTranscription.slice(0, 54) : '—';
      GOL.text(ctx, 'attempts ' + R.attempts + ' · engine ' + R.engineKind + ' · heard ' + heard,
        px + pw / 2, py + 105, { size: 10.5, weight: '600', color: '#877B66' });
      if (R.lastError) GOL.text(ctx, 'last engine issue · ' + R.lastError.slice(0, 90),
        px + pw / 2, py + 121, { size: 10, weight: '600', color: '#9A6B40' });
    }
  };
  GOL.registerScene('room', room);

  // ============================================================== PARENTS ==
  const parents = {
    t: 0, gateP: 0, open: false, buttons: [], confirmT: 0,
    enter() { this.t = 0; this.gateP = 0; this.open = false; this.confirmT = 0; GOL.audio.stopAmbience(); },
    update(dt, W, H) {
      this.t += dt;
      this.buttons = [{ x: 40, y: 40, r: 30, iconName: 'back', fn: () => GOL.go('map') }];
      if (GOL.hitButtons(GOL.Input.taps, this.buttons)) return;
      this.confirmT = Math.max(0, this.confirmT - dt);
      if (!this.open) {
        // hold the star to enter — trivial for a parent, patient for a child
        const d = GOL.Input.drag;
        const inStar = d && GOL.dist(d.x, d.y, W / 2, H * 0.55) < 62;
        this.gateP = inStar ? Math.min(1, this.gateP + dt / 2.6) : Math.max(0, this.gateP - dt * 1.4);
        if (this.gateP >= 1) { this.open = true; GOL.audio.sfx('unlockLevel'); }
        return;
      }
      for (const tap of GOL.Input.taps) {
        if (tap.ui) continue;
        if (tap.y > H - 70 && Math.abs(tap.x - W / 2) < 130) {
          tap.ui = true;
          if (this.confirmT > 0) {
            GOL.store.reset();
            GOL.audio.sfx('drift');
            GOL.go('title');
          } else {
            this.confirmT = 4;
          }
        }
      }
    },
    draw(ctx, W, H) {
      ctx.fillStyle = '#2E4032';
      ctx.fillRect(0, 0, W, H);
      if (!this.open) {
        GOL.text(ctx, 'For grown-ups', W / 2, H * 0.3, { size: 26, weight: '800', color: '#F5EDD4' });
        GOL.text(ctx, 'rest your finger on the star until it fills', W / 2, H * 0.3 + 34, { size: 15, weight: '600', color: 'rgba(245,237,212,0.7)' });
        GOL.star8Path(ctx, W / 2, H * 0.55, 46, Math.PI / 8);
        ctx.strokeStyle = 'rgba(240,200,120,0.7)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        if (this.gateP > 0) {
          ctx.save();
          GOL.star8Path(ctx, W / 2, H * 0.55, 46, Math.PI / 8);
          ctx.clip();
          ctx.fillStyle = alpha('#F0C878', 0.85);
          const fh = 100 * this.gateP;
          ctx.fillRect(W / 2 - 60, H * 0.55 + 50 - fh, 120, fh);
          ctx.restore();
        }
      } else {
        GOL.text(ctx, 'How the garden is growing', W / 2, 46, { size: 24, weight: '800', color: '#F5EDD4' });
        const cols = [
          { x: W * 0.16, label: 'surah', align: 'left' },
          { x: W * 0.4, label: 'completed' },
          { x: W * 0.52, label: 'walks' },
          { x: W * 0.64, label: 'heard whole' },
          { x: W * 0.76, label: 'helps' },
          { x: W * 0.89, label: 'trickiest ayah' }
        ];
        for (const c of cols) GOL.text(ctx, c.label, c.x, 92, { size: 12.5, weight: '700', color: 'rgba(245,237,212,0.55)', align: c.align || 'center' });
        GOL.LEVELS.forEach((L, i) => {
          const st = GOL.store.level(L.surahId);
          const y = 128 + i * 42;
          if (i % 2 === 0) {
            ctx.fillStyle = 'rgba(245,237,212,0.05)';
            ctx.fillRect(W * 0.08, y - 17, W * 0.86, 34);
          }
          let worst = '—', worstN = 0;
          for (const k in st.misorders) if (st.misorders[k] > worstN) { worstN = st.misorders[k]; worst = 'ayah ' + k + ' (' + worstN + '×)'; }
          const cells = [
            L.surah.englishName,
            st.completed ? '✓' : '·',
            String(st.replays || 0),
            String(st.heardFull || 0),
            String(st.hintsUsed || 0),
            worst
          ];
          cells.forEach((val, ci) => {
            GOL.text(ctx, val, cols[ci].x, y, {
              size: ci === 0 ? 15 : 14, weight: ci === 0 ? '800' : '600',
              color: ci === 1 && st.completed ? '#A6DA8C' : '#F5EDD4',
              align: cols[ci].align || 'center'
            });
          });
        });
        GOL.text(ctx, '“Walks” counts replays of finished surahs — wandering back is the whole idea.', W / 2, 128 + 6 * 42 + 14, { size: 12.5, weight: '600', color: 'rgba(245,237,212,0.5)' });
        const falaqLevel = GOL.LEVELS.find((L) => L.surahId === 113);
        const falaqStats = GOL.store.level(113).recite;
        if (falaqLevel && falaqStats.sessions > 0) {
          let trickyKey = '', trickyCount = -1;
          for (const key in falaqStats.wordMisses) {
            if (falaqStats.wordMisses[key] > trickyCount) { trickyKey = key; trickyCount = falaqStats.wordMisses[key]; }
          }
          let tricky = '—';
          if (trickyKey) {
            const parts = trickyKey.split(':').map(Number);
            const trickyVerse = falaqLevel.surah.verses[parts[0] - 1];
            if (trickyVerse) tricky = trickyVerse.ar.split(/\s+/)[parts[1]] || '—';
          }
          const summary = 'Recitation Room — Al-Falaq: ' + falaqStats.sessions + ' sessions · ' +
            falaqStats.ayahsPassed + ' ayahs lit by voice, ' + falaqStats.ayahsCarried + ' carried · trickiest word:';
          GOL.text(ctx, summary, W / 2 - 24, 128 + 6 * 42 + 44, { size: 12.5, weight: '600', color: 'rgba(245,237,212,0.72)' });
          GOL.text(ctx, tricky, W / 2 + 370, 128 + 6 * 42 + 44, { size: 17, weight: '400', color: '#F0C878', ar: true });
        }
        // reset
        const warm = this.confirmT > 0;
        GOL.drawPanel(ctx, W / 2 - 130, H - 66, 260, 46, { radius: 22, plain: true, alpha: warm ? 1 : 0.25 });
        GOL.text(ctx, warm ? 'tap again to really start over' : 'start the whole garden over', W / 2, H - 43, { size: 13.5, weight: '700', color: warm ? '#B0532E' : GOL.INK_SOFT });
      }
      for (const b of this.buttons) GOL.drawButton(ctx, b.x, b.y, 22, b.iconName);
    }
  };
  GOL.registerScene('parents', parents);
})();
