// Gems of Light — gate.js
// The still place at the end of a level. The collected gems float loose;
// the child sets them in order, and the whole surah is recited back.
// Wrong answers drift gently away. Nobody is ever locked out.
(function () {
  const GOL = window.GOL;
  const TILE = GOL.TILE;
  const { alpha, tint, shade, mix } = GOL.color;

  const gate = {
    t: 0, L: null, P: null, bd: null, sprites: null, fx: null,
    gems: null, sockets: null, phase: 'sort',
    attempts: 0, hintLevel: 0, autoT: 0,
    igniteT: 0, reciteI: -1, openT: 0, walkT: 0, heldGem: null,
    buttons: [],

    enter(params) {
      this.L = GOL.LEVELS[params.index];
      this.P = GOL.PALETTES[this.L.key === 'falaq' ? 'falaqEnd' : this.L.key];
      this.bd = GOL.buildBackdrop(this.L.key === 'falaq' ? 'falaqEnd' : this.L.key, 900 + params.index);
      this.sprites = GOL.buildPropSprites(this.P, 555 + params.index);
      this.fx = GOL.makeFx();
      this.t = 0;
      this.phase = 'sort';
      this.attempts = 0; this.hintLevel = 0; this.autoT = 0;
      this.igniteT = 0; this.reciteI = -1; this.openT = 0; this.walkT = 0;
      this.heldGem = null;
      this._finished = false;
      const n = this.L.surah.verses.length;
      // shuffle the display order so the cloud never spells the answer
      const order = this.L.surah.verses.map((v) => v.n);
      const rng = GOL.rng(Date.now() % 100000);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      this.gems = order.map((ayah, i) => ({
        ayah, i, x: 0, y: 0, homeX: 0, homeY: 0,
        phase: Math.random() * 7, placed: -1, drift: null, pulse: 0
      }));
      GOL.audio.startAmbience('quiet');
      GOL.audio.preloadSurah(this.L.surah);
      const st = GOL.store.level(this.L.surahId);
      st.sortAttempts++;
      GOL.store.save();
    },
    exit() { GOL.audio.stopRecitation(); },

    layout(W, H) {
      const n = this.gems.length;
      const groundY = H * 0.66;
      const gap = Math.min(84, (W - 140) / n);
      const sockets = [];
      for (let i = 0; i < n; i++) {
        sockets.push({ x: W / 2 + (i - (n - 1) / 2) * gap, y: H * 0.84, i });
      }
      // cloud homes: a loose arc, two rows if many
      this.gems.forEach((g, i) => {
        const row = n > 5 ? i % 2 : 0;
        const perRow = n > 5 ? Math.ceil(n / 2) : n;
        const col = n > 5 ? Math.floor(i / 2) : i;
        const spread = Math.min(120, (W - 200) / perRow);
        g.homeX = W / 2 + (col - (perRow - 1) / 2) * spread + (row ? spread * 0.5 : 0);
        g.homeY = H * (0.24 + row * 0.15) + Math.sin(i * 2.1) * 12;
      });
      return { groundY, sockets, gap };
    },

    update(dt, W, H) {
      this.t += dt;
      this.fx.update(dt);
      const lay = this.layout(W, H);
      this.sockets = lay.sockets;
      if (Math.random() < dt * 2) this.fx.spawn('mote', Math.random() * W, Math.random() * H * 0.7, {});

      this.buttons = [
        { x: 40, y: 40, r: 30, iconName: 'map', fn: () => GOL.go('map', { focus: this.L.index }) },
        Object.assign({}, GOL.muteButton(W))
      ];
      // the way out stays open in every phase — no child gets trapped here
      if (this.phase !== 'walk') GOL.hitButtons(GOL.Input.taps, this.buttons);

      // free gems drift like slow fireflies
      for (const g of this.gems) {
        if (g.placed >= 0) {
          const s = this.sockets[g.placed];
          g.x = s.x; g.y = s.y;
          continue;
        }
        if (g.drift) {
          g.drift.t += dt / 0.7;
          const e = GOL.ease.out(Math.min(1, g.drift.t));
          g.x = g.drift.fromX + (g.homeX - g.drift.fromX) * e;
          g.y = g.drift.fromY + (g.homeY - g.drift.fromY) * e;
          if (g.drift.t >= 1) g.drift = null;
          continue;
        }
        if (this.heldGem === g) {
          const d = GOL.Input.drag;
          if (d) { g.x = d.x; g.y = d.y; }
          continue;
        }
        g.x = g.homeX + Math.sin(this.t * 0.7 + g.phase) * 14;
        g.y = g.homeY + Math.sin(this.t * 0.9 + g.phase * 1.7) * 10;
      }

      if (this.phase === 'sort') this.updateSort(dt, W, H, lay);
      else if (this.phase === 'ignite') {
        this.igniteT += dt;
        const per = 0.36;
        const lit = Math.floor(this.igniteT / per);
        if (lit > (this._lastLit || 0) && lit <= this.gems.length) {
          this._lastLit = lit;
          GOL.audio.chime(lit - 1, { short: true });
          const s = this.sockets[lit - 1];
          this.fx.spawn('ring', s.x, s.y, { color: '#FFF3C4', size: 20 });
        }
        if (this.igniteT > per * this.gems.length + 0.6) {
          this.phase = 'recite';
          GOL.audio.playSurah(this.L.surah, {
            onVerse: (i) => { this.reciteI = i; },
            onend: () => {
              this.phase = 'open';
              this.openT = 0;
              GOL.audio.sfx('door');
            }
          });
        }
      } else if (this.phase === 'open') {
        this.openT = Math.min(1, this.openT + dt / 1.5);
        if (Math.random() < dt * 20) {
          this.fx.spawn('sparkle', W / 2 + GOL.rnd(-70, 70), H * 0.62 - GOL.rnd(0, 180), { color: '#FFE9A8' });
        }
        if (this.openT >= 1) { this.phase = 'walk'; this.walkT = 0; }
      } else if (this.phase === 'walk') {
        this.walkT += dt;
        if (this.walkT > 2.4 && !this._finished) {
          this._finished = true;
          const st = GOL.store.level(this.L.surahId);
          const first = !st.completed;
          st.completed = true;
          st.heardFull = (st.heardFull || 0) + 1;
          GOL.store.data.unlocked = Math.max(GOL.store.data.unlocked, Math.min(5, this.L.index + 1));
          GOL.store.save();
          GOL.go('map', { celebrate: this.L.index, focus: first ? Math.min(5, this.L.index + 1) : this.L.index });
        }
      }
    },

    updateSort(dt, W, H, lay) {
      const Input = GOL.Input;
      // pick up
      if (Input.drag && !this.heldGem) {
        const d = Input.drag;
        const moved = GOL.dist(d.x, d.y, d.startX, d.startY);
        for (const g of this.gems) {
          if (g.placed >= 0 || g.drift) continue;
          if (GOL.dist(d.startX, d.startY, g.x, g.y) < 46) {
            if (moved > 10) this.heldGem = g;
            break;
          }
        }
      }
      // taps replay their ayah
      for (const tap of Input.taps) {
        if (tap.ui) continue;
        for (const g of this.gems) {
          if (GOL.dist(tap.x, tap.y, g.x, g.y) < 42) {
            tap.ui = true;
            g.pulse = 1;
            GOL.audio.playVerse(this.L.surahId, g.ayah, null);
            this.fx.spawn('ring', g.x, g.y, { color: GOL.GEMS[(g.ayah - 1) % 7].glow, size: 22 });
            break;
          }
        }
      }
      // release
      for (const rel of Input.releases) {
        if (!this.heldGem) break;
        const g = this.heldGem;
        this.heldGem = null;
        let hit = null;
        for (const s of this.sockets) {
          if (this.gems.some((o) => o.placed === s.i)) continue;
          if (GOL.dist(rel.x, rel.y, s.x, s.y) < 52) { hit = s; break; }
        }
        if (hit) {
          if (g.ayah === hit.i + 1) {
            g.placed = hit.i;
            g.drift = null;
            GOL.audio.sfx('place');
            GOL.audio.chime(hit.i, { short: true, soft: true });
            this.fx.spawn('ring', hit.x, hit.y, { color: '#FFF3C4', size: 18 });
            this.checkDone();
          } else {
            // no scolding — it just isn't its place; the gem floats home
            this.attempts++;
            const st = GOL.store.level(this.L.surahId);
            st.misorders[g.ayah] = (st.misorders[g.ayah] || 0) + 1;
            GOL.store.save();
            GOL.audio.sfx('drift');
            g.drift = { t: 0, fromX: g.x, fromY: g.y };
            if (this.attempts === 3 || this.attempts === 6) GOL.audio.sfx('hint');
          }
        } else {
          g.drift = { t: 0, fromX: g.x, fromY: g.y };
        }
      }
      this.hintLevel = this.attempts >= 6 ? 2 : this.attempts >= 3 ? 1 : 0;
      // after enough tries, the garden helps: gems find their own places
      if (this.hintLevel === 2) {
        this.autoT += dt;
        if (this.autoT > 2.4) {
          this.autoT = 0;
          const needed = this.neededAyah();
          const g = this.gems.find((x) => x.ayah === needed && x.placed < 0);
          if (g && this.heldGem !== g) {
            g.placed = needed - 1;
            g.drift = null;
            const st = GOL.store.level(this.L.surahId);
            st.hintsUsed++;
            GOL.store.save();
            GOL.audio.sfx('place');
            GOL.audio.chime(needed - 1, { short: true });
            this.fx.spawn('ring', this.sockets[needed - 1].x, this.sockets[needed - 1].y, { color: '#FFF3C4', size: 22 });
            this.checkDone();
          }
        }
      }
    },
    neededAyah() {
      for (let i = 0; i < this.gems.length; i++) {
        if (!this.gems.some((g) => g.placed === i)) return i + 1;
      }
      return -1;
    },
    checkDone() {
      if (this.gems.every((g) => g.placed >= 0)) {
        this.phase = 'ignite';
        this.igniteT = 0;
        this._lastLit = 0;
        this.heldGem = null;
      }
    },

    draw(ctx, W, H) {
      const t = this.t, P = this.P;
      const groundY = GOL.drawBackdrop(ctx, this.bd, W, H, t, 40, 0.6);
      // courtyard floor: broad cream flagstones
      ctx.save();
      const fg = ctx.createLinearGradient(0, groundY, 0, H);
      fg.addColorStop(0, tint(P.stone, 0.2));
      fg.addColorStop(1, P.stoneShade);
      ctx.fillStyle = fg;
      ctx.fillRect(0, groundY + 8, W, H - groundY);
      ctx.strokeStyle = alpha(P.stoneDark, 0.25);
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 5; i++) {
        const y = groundY + 22 + i * ((H - groundY) / 5);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      for (let i = 0; i < 10; i++) {
        const x = ((i + (i % 2 ? 0.5 : 0)) / 9) * W;
        ctx.beginPath(); ctx.moveTo(x, groundY + 12); ctx.lineTo(x - 30, H); ctx.stroke();
      }
      GOL.star8(ctx, W * 0.14, groundY + 46, 8, Math.PI / 8, alpha(P.stoneDark, 0.18));
      GOL.star8(ctx, W * 0.86, groundY + 46, 8, Math.PI / 8, alpha(P.stoneDark, 0.18));
      ctx.restore();

      // side dressing
      const cyp = this.sprites.cypress[0];
      ctx.drawImage(cyp, W * 0.08 - cyp._anchor.x, groundY + 14 - cyp._anchor.y);
      ctx.drawImage(this.sprites.cypress[1], W * 0.92 - cyp._anchor.x, groundY + 16 - cyp._anchor.y);
      const lan = this.sprites.lantern;
      ctx.drawImage(lan, W * 0.24 - lan._anchor.x, groundY + 12 - lan._anchor.y);
      ctx.drawImage(lan, W * 0.76 - lan._anchor.x, groundY + 12 - lan._anchor.y);

      // the arch, grand and waiting
      ctx.save();
      ctx.translate(W / 2, groundY + 10);
      ctx.scale(1.45, 1.45);
      GOL.drawArch(ctx, 0, 0, t, P, this.phase === 'open' || this.phase === 'walk' ? this.openT : this.phase === 'recite' || this.phase === 'ignite' ? 0.12 : 0.05,
        this.phase === 'sort' ? 0.25 : Math.min(1, 0.4 + this.openT));
      ctx.restore();

      // walking through, into the light
      if (this.phase === 'walk') {
        const k = Math.min(1, this.walkT / 2.2);
        const wx = W / 2, wy = groundY + 100 - k * 96;
        const sc = 1 - k * 0.55;
        ctx.save();
        ctx.globalAlpha = 1 - GOL.ease.in(k) * 0.9;
        ctx.translate(wx, wy);
        ctx.scale(sc, sc);
        GOL.drawSprite(ctx, 0, 0, { vx: 0, vy: 0, grounded: true, facing: 1, t, idleT: 0, blink: false, squashX: 1, squashY: 1, moving: true });
        ctx.restore();
      }

      // the settings ledge
      const n = this.gems.length;
      const lw = Math.min(84, (W - 140) / n) * n + 60;
      GOL.drawPanel(ctx, W / 2 - lw / 2, H * 0.84 - 40, lw, 80, { radius: 20, alpha: 0.9, plain: n > 5 });
      const litCount = this.phase === 'ignite' ? this._lastLit || 0 : this.phase === 'recite' || this.phase === 'open' || this.phase === 'walk' ? n : 0;
      this.sockets.forEach((s, i) => {
        GOL.star8Path(ctx, s.x, s.y, 17, Math.PI / 8);
        const lit = i < litCount;
        ctx.fillStyle = lit ? alpha('#FFE9A8', 0.6 + 0.2 * Math.sin(t * 3 + i)) : 'rgba(120,104,70,0.13)';
        ctx.fill();
        ctx.strokeStyle = lit ? alpha('#D9A44A', 0.95) : 'rgba(150,128,84,0.4)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        if (!this.gems.some((g) => g.placed === i)) {
          GOL.text(ctx, String(i + 1), s.x, s.y + 1, { size: 13, weight: '800', color: 'rgba(122,98,56,0.5)' });
        }
      });

      // guidance
      if (this.phase === 'sort') {
        const done = this.gems.filter((g) => g.placed >= 0).length;
        GOL.drawPanel(ctx, W / 2 - 250, 18, 500, 58, { radius: 26, plain: true, alpha: 0.85 });
        GOL.text(ctx, done === 0 ? 'set the gems in the order of the surah' : done < n ? 'beautiful — keep going' : '', W / 2, 40, { size: 17, weight: '800' });
        GOL.text(ctx, 'tap a gem to hear its ayah again', W / 2, 61, { size: 13, weight: '600', color: GOL.INK_SOFT });
      } else if (this.phase === 'recite') {
        const v = this.L.surah.verses[this.reciteI];
        if (v) {
          const pw = Math.min(620, W - 100);
          GOL.drawPanel(ctx, W / 2 - pw / 2, 16, pw, 86, { radius: 20, alpha: 0.94 });
          GOL.text(ctx, v.ar, W / 2, 52, { size: 27, ar: true, weight: '400', color: '#2E4032' });
          GOL.text(ctx, v.meaning, W / 2, 84, { size: 13.5, weight: '600', color: GOL.INK_SOFT });
        }
      } else if (this.phase === 'open' || this.phase === 'walk') {
        GOL.text(ctx, this.L.surah.englishName + ' — whole and in order. Walk through.', W / 2, 40, { size: 19, weight: '800', color: 'rgba(255,251,238,0.95)' });
      }

      // gems (free ones over everything)
      const needed = this.neededAyah();
      for (const g of this.gems) {
        const C = GOL.GEMS[(g.ayah - 1) % 7];
        let r = g.placed >= 0 ? 15 : 21;
        if (this.heldGem === g) r = 26;
        if (this.phase === 'recite' && g.placed === this.reciteI) {
          r = 24 + Math.sin(t * 6) * 1.5;
          const s = this.sockets[g.placed];
          const gl = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, 70);
          gl.addColorStop(0, alpha(C.glow, 0.5));
          gl.addColorStop(1, alpha(C.glow, 0));
          ctx.fillStyle = gl;
          ctx.beginPath(); ctx.arc(s.x, s.y, 70, 0, Math.PI * 2); ctx.fill();
        }
        g.pulse = Math.max(0, (g.pulse || 0) - 1 / 60);
        const hinted = this.phase === 'sort' && this.hintLevel >= 1 && g.placed < 0 && g.ayah === needed;
        if (hinted) {
          ctx.strokeStyle = alpha('#FFE9A8', 0.5 + 0.4 * Math.sin(t * 4));
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(g.x, g.y, 30 + Math.sin(t * 4) * 3, 0, Math.PI * 2); ctx.stroke();
        }
        GOL.drawGem(ctx, g.x, g.y, r + (g.pulse || 0) * 6, C, t, { phase: g.phase, glow: g.placed >= 0 ? 0.75 : 1 });
      }

      this.fx.draw(ctx);
      if (this.phase !== 'walk') for (const b of this.buttons) GOL.drawButton(ctx, b.x, b.y, 22, b.icon ? b.icon() : b.iconName);
      // light floods everything as the door opens
      if (this.phase === 'open' || this.phase === 'walk') {
        ctx.fillStyle = alpha('#FFF6D0', 0.22 * this.openT + (this.phase === 'walk' ? Math.min(0.55, this.walkT / 2.4 * 0.55) : 0));
        ctx.fillRect(0, 0, W, H);
      }
      GOL.drawVignette(ctx, W, H, 0.15);
    }
  };
  GOL.registerScene('gate', gate);
})();
