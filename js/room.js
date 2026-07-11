// Gems of Light — room.js
// The Recitation Room: no objective, just shelves of collected light.
// And, behind a patient little gate, a quiet page for grown-ups.
(function () {
  const GOL = window.GOL;
  const { alpha, tint, shade } = GOL.color;

  // ================================================================= ROOM ==
  // One shelf wall per world; little arrows lead to the neighbouring walls.
  const room = {
    t: 0, fx: null, buttons: [], playing: null, playVerse: -1, world: 0,
    enter(params) {
      params = params || {};
      this.t = 0;
      this.fx = GOL.makeFx();
      const unlocked = Math.min(GOL.store.data.unlocked, GOL.LEVELS.length - 1);
      this.setWorld(params.world != null ? params.world : GOL.worldOfLevel(unlocked));
      GOL.audio.startAmbience('quiet');
    },
    setWorld(w) {
      this.world = Math.max(0, Math.min(GOL.WORLDS.length - 1, w));
      this.wd = GOL.WORLDS[this.world];
      this.shelf = this.wd.levels.map((i) => GOL.LEVELS[i]);
      this.maxV = Math.max.apply(null, this.shelf.map((L) => L.surah.verses.length));
      this.playing = null;
      this.playVerse = -1;
      this._solo = null;
      GOL.audio.stopRecitation();
      for (const L of this.shelf) GOL.audio.preloadSurah(L.surah);
    },
    exit() { GOL.audio.stopRecitation(); },

    rows(W, H) {
      const top = 92, bottom = H - 24;
      const rh = (bottom - top) / this.shelf.length;
      return this.shelf.map((L, i) => ({ L, y: top + i * rh + rh / 2, rh }));
    },
    update(dt, W, H) {
      this.t += dt;
      this.fx.update(dt);
      this.buttons = [
        { x: 40, y: 40, r: 30, iconName: 'back', fn: () => GOL.go('map', { world: this.world }) },
        Object.assign({}, GOL.muteButton(W))
      ];
      // walk the shelf walls, world by world
      if (this.world > 0) {
        this.buttons.push({ x: W / 2 - 340, y: 40, r: 24, iconName: 'back', fn: () => this.setWorld(this.world - 1) });
      }
      if (this.world < GOL.WORLDS.length - 1) {
        this.buttons.push({ x: W / 2 + 340, y: 40, r: 24, iconName: 'play', fn: () => this.setWorld(this.world + 1) });
      }
      if (GOL.hitButtons(GOL.Input.taps, this.buttons)) return;
      const rows = this.rows(W, H);
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
          // individual gems: the nearest one on the shelf takes the tap
          // (long surahs sit close together — nearest beats first-in-reach)
          const verses = r.L.surah.verses.length;
          const spacing = this.gemX(W, 1) - this.gemX(W, 0);
          let bestV = -1, bestD = Math.max(16, Math.min(26, spacing * 0.55));
          for (let v = 0; v < verses; v++) {
            const d = GOL.dist(tap.x, tap.y, this.gemX(W, v), r.y);
            if (d < bestD) { bestD = d; bestV = v; }
          }
          if (bestV >= 0 && found.includes(bestV + 1)) {
            tap.ui = true;
            this.playing = null;
            this.playVerse = -1;
            this._solo = { surahId: r.L.surahId, v: bestV };
            GOL.audio.playVerse(r.L.surahId, bestV + 1, () => (this._solo = null));
            this.fx.spawn('ring', this.gemX(W, bestV), r.y, { color: GOL.GEMS[bestV % 7].glow, size: 18 });
            return;
          }
        }
      }
    },
    gemX(W, v) { return 280 + v * Math.min(62, (W - 330) / Math.max(7, this.maxV)); },

    draw(ctx, W, H) {
      const t = this.t;
      // interior: warm plaster, morning light through arched windows
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#EFE6CC');
      bg.addColorStop(1, '#D9CCA8');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      for (const wx of [W * 0.3, W * 0.7]) {
        ctx.save();
        ctx.translate(wx, 56);
        ctx.scale(0.9, 0.9);
        ctx.fillStyle = '#C8BB96';
        ctx.beginPath();
        ctx.moveTo(-40, 40); ctx.lineTo(-40, -6);
        ctx.quadraticCurveTo(-40, -34, 0, -34);
        ctx.quadraticCurveTo(40, -34, 40, -6);
        ctx.lineTo(40, 40); ctx.closePath(); ctx.fill();
        const sky = ctx.createLinearGradient(0, -30, 0, 36);
        sky.addColorStop(0, '#A9D8C8'); sky.addColorStop(1, '#F9E8B8');
        ctx.fillStyle = sky;
        ctx.beginPath();
        ctx.moveTo(-32, 34) ; ctx.lineTo(-32, -4);
        ctx.quadraticCurveTo(-32, -27, 0, -27);
        ctx.quadraticCurveTo(32, -27, 32, -4);
        ctx.lineTo(32, 34); ctx.closePath(); ctx.fill();
        ctx.fillStyle = alpha('#FFF4D6', 0.9);
        ctx.beginPath(); ctx.arc(12, -8, 7, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      GOL.text(ctx, 'The Recitation Room', W / 2, 40, { size: 26, weight: '800' });
      GOL.text(ctx, this.wd.name + ' — everything you have gathered, kept glowing', W / 2, 66, { size: 14, weight: '600', color: GOL.INK_SOFT });
      // this wall's windowsill of hidden Rahma blossoms
      {
        const found = this.shelf.filter((L) => GOL.store.level(L.surahId).blossom).length;
        const total = this.shelf.length;
        const bx = W - 178, by = 40;
        ctx.fillStyle = '#B99B6E';
        ctx.fillRect(bx - 24, by + 22, total * 22 + 34, 5);
        this.shelf.forEach((L, i) => {
          const has = GOL.store.level(L.surahId).blossom;
          const fx2 = bx + i * 22 - 8;
          if (has) GOL.drawRahmaBlossom(ctx, fx2, by + 10, 6, t + i);
          else {
            ctx.fillStyle = 'rgba(120,104,70,0.18)';
            ctx.beginPath(); ctx.ellipse(fx2, by + 12, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
          }
        });
        GOL.text(ctx, found ? 'hidden blossoms · ' + found + ' of ' + total : 'secret blossoms sleep in the gardens…', bx + total * 11 - 8, by + 42, { size: 11.5, weight: '700', color: found ? GOL.GOLD : '#9A9478' });
      }

      const rows = this.rows(W, H);
      for (const r of rows) {
        const st = GOL.store.level(r.L.surahId);
        const found = st.found || [];
        const all = found.length === r.L.surah.verses.length;
        // shelf plank
        ctx.fillStyle = '#B99B6E';
        ctx.fillRect(36, r.y + 26, W - 72, 7);
        ctx.fillStyle = alpha('#8A6B4F', 0.5);
        ctx.fillRect(36, r.y + 31, W - 72, 2.5);
        // name plate
        const isPlaying = this.playing === r.L;
        GOL.drawPanel(ctx, 40, r.y - 24, 188, 50, { radius: 12, plain: true, alpha: isPlaying ? 1 : 0.85 });
        GOL.text(ctx, r.L.surah.englishName, 134, r.y - 6, { size: 15.5, weight: '800', color: all ? GOL.INK : '#9A9478' });
        GOL.text(ctx, all ? '▶ hear it whole' : found.length ? found.length + ' of ' + r.L.surah.verses.length + ' gems' : 'still out in the garden', 134, r.y + 13, { size: 11.5, weight: '600', color: all ? GOL.GOLD : '#9A9478' });
        // gems on the shelf
        r.L.surah.verses.forEach((v, vi) => {
          const gx = this.gemX(W, vi);
          const has = found.includes(vi + 1);
          if (has) {
            const hot = (isPlaying && this.playVerse === vi) ||
              (this._solo && this._solo.surahId === r.L.surahId && this._solo.v === vi);
            GOL.drawGem(ctx, gx, r.y + (hot ? -4 : 0), hot ? 17 : 12, GOL.GEMS[vi % 7], t, { phase: vi, glow: hot ? 1 : 0.5 });
          } else {
            GOL.star8Path(ctx, gx, r.y, 9, Math.PI / 8);
            ctx.fillStyle = 'rgba(120,104,70,0.12)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(150,128,84,0.3)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        });
      }
      this.fx.draw(ctx);
      for (const b of this.buttons) GOL.drawButton(ctx, b.x, b.y, 22, b.icon ? b.icon() : b.iconName);
      GOL.drawVignette(ctx, W, H, 0.1);
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
        // per-surah unlock chips
        for (let i = 0; i < GOL.LEVELS.length; i++) {
          const y = this.rowY(i, H);
          if (i > GOL.store.data.unlocked && Math.abs(tap.y - y) < this.rowH(H) / 2 && tap.x > W * 0.87 && tap.x < W * 0.985) {
            tap.ui = true;
            const opened = GOL.store.data.opened;
            const at = opened.indexOf(i);
            if (at >= 0) { opened.splice(at, 1); GOL.audio.sfx('drift'); }
            else { opened.push(i); GOL.audio.sfx('unlockLevel'); }
            GOL.store.save();
            break;
          }
        }
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
    // seventeen gardens now share this page — rows shrink to fit the screen
    rowH(H) { return Math.min(42, (H - 214) / GOL.LEVELS.length); },
    rowY(i, H) { return 112 + (i + 0.5) * this.rowH(H); },
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
          { x: W * 0.135, label: 'surah', align: 'left' },
          { x: W * 0.315, label: 'done' },
          { x: W * 0.385, label: 'walks' },
          { x: W * 0.4575, label: 'star walks' },
          { x: W * 0.53, label: 'heard whole' },
          { x: W * 0.6, label: 'helps' },
          { x: W * 0.6675, label: 'moon' },
          { x: W * 0.775, label: 'trickiest ayah' },
          { x: W * 0.9275, label: 'open early' }
        ];
        for (const c of cols) GOL.text(ctx, c.label, c.x, 92, { size: 12.5, weight: '700', color: 'rgba(245,237,212,0.55)', align: c.align || 'center' });
        const rh = this.rowH(H);
        GOL.LEVELS.forEach((L, i) => {
          const st = GOL.store.level(L.surahId);
          const y = this.rowY(i, H);
          if (i % 2 === 0) {
            ctx.fillStyle = 'rgba(245,237,212,0.05)';
            ctx.fillRect(W * 0.08, y - rh / 2 + 1, W * 0.86, rh - 2);
          }
          let worst = '—', worstN = 0;
          for (const k in st.misorders) if (st.misorders[k] > worstN) { worstN = st.misorders[k]; worst = 'ayah ' + k + ' (' + worstN + '×)'; }
          const cells = [
            L.surah.englishName,
            st.completed ? '✓' : '·',
            String(st.replays || 0),
            String(st.starWalks || 0),
            String(st.heardFull || 0),
            String(st.hintsUsed || 0),
            st.trialAsked ? Math.round((st.trialFirstTry / st.trialAsked) * 100) + '%' : '—',
            worst
          ];
          const fs = rh < 34 ? 1.5 : 0; // shave text a touch when rows tighten
          cells.forEach((val, ci) => {
            GOL.text(ctx, val, cols[ci].x, y, {
              size: (ci === 0 ? 15 : 14) - fs, weight: ci === 0 ? '800' : '600',
              color: ci === 1 && st.completed ? '#A6DA8C' : '#F5EDD4',
              align: cols[ci].align || 'center'
            });
          });
          if (st.blossom) GOL.star8(ctx, W * 0.135 - 16, y, 5, Math.PI / 8, 'rgba(240,200,120,0.9)');
          // unlock chip: lets a parent open any surah out of sequence
          const ch = Math.min(28, rh - 4);
          if (i > GOL.store.data.unlocked) {
            const opened = GOL.store.data.opened.includes(i);
            const cx = W * 0.9275, cw = W * 0.105;
            ctx.fillStyle = opened ? 'rgba(240,200,120,0.22)' : 'rgba(245,237,212,0.1)';
            GOL.roundRect(ctx, cx - cw / 2, y - ch / 2, cw, ch, ch / 2);
            ctx.fill();
            ctx.strokeStyle = opened ? 'rgba(240,200,120,0.8)' : 'rgba(245,237,212,0.35)';
            ctx.lineWidth = 1.5;
            GOL.roundRect(ctx, cx - cw / 2, y - ch / 2, cw, ch, ch / 2);
            ctx.stroke();
            GOL.text(ctx, opened ? '✓ opened' : 'unlock', cx, y, { size: 12.5 - fs, weight: '700', color: opened ? '#F0C878' : 'rgba(245,237,212,0.75)' });
          } else {
            GOL.text(ctx, '—', W * 0.9275, y, { size: 13, weight: '600', color: 'rgba(245,237,212,0.3)' });
          }
        });
        let echoes = 0;
        for (const L of GOL.LEVELS) echoes += GOL.store.level(L.surahId).echoes || 0;
        const footY = this.rowY(GOL.LEVELS.length, H);
        GOL.text(ctx, '“Moon” is how often a trial answer was right on the first listen. ★ = found the hidden blossom.', W / 2, footY, { size: 12.5, weight: '600', color: 'rgba(245,237,212,0.5)' });
        const wk = 7 * 24 * 3600 * 1000;
        const weekly = 'this week: ' + GOL.stampCount('walk', wk) + ' walks · ' + GOL.stampCount('starWalk', wk) + ' star walks · ' +
          GOL.stampCount('trial', wk) + ' moon trials · ' + GOL.stampCount('meanings', wk) + ' meaning matches · ' + GOL.stampCount('story', wk) + ' stories';
        GOL.text(ctx, weekly + '  ·  say-it-out-loud moments so far: ' + echoes, W / 2, footY + 19, { size: 12.5, weight: '600', color: 'rgba(245,237,212,0.5)' });
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
