// Gems of Light — room.js
// The Recitation Room: no objective, just shelves of collected light.
// And, behind a patient little gate, a quiet page for grown-ups.
(function () {
  const GOL = window.GOL;
  const { alpha, tint, shade } = GOL.color;

  // ================================================================= ROOM ==
  const room = {
    t: 0, fx: null, buttons: [], playing: null, playVerse: -1,
    enter() {
      this.t = 0;
      this.fx = GOL.makeFx();
      this.playing = null;
      this.playVerse = -1;
      GOL.audio.startAmbience('quiet');
      for (const L of GOL.LEVELS) GOL.audio.preloadSurah(L.surah);
    },
    exit() { GOL.audio.stopRecitation(); },

    rows(W, H) {
      const top = 92, bottom = H - 24;
      const rh = (bottom - top) / 6;
      return GOL.LEVELS.map((L, i) => ({ L, y: top + i * rh + rh / 2, rh }));
    },
    update(dt, W, H) {
      this.t += dt;
      this.fx.update(dt);
      this.buttons = [
        { x: 40, y: 40, r: 30, iconName: 'back', fn: () => GOL.go('map') },
        Object.assign({}, GOL.muteButton(W))
      ];
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
