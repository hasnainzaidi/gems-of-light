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
      // the gate stands where the level's light ends — if the garden drifts
      // (falaq's daybreak, qadr's night, alaq's first dawn), use its End palette
      const palKey = GOL.PALETTES[this.L.key + 'End'] ? this.L.key + 'End' : this.L.key;
      this.P = GOL.PALETTES[palKey];
      this.bd = GOL.buildBackdrop(palKey, 900 + params.index);
      this.sprites = GOL.buildPropSprites(this.P, 555 + params.index);
      this.fx = GOL.makeFx();
      this.t = 0;
      this.phase = 'sort';
      this.attempts = 0; this.hintLevel = 0; this.autoT = 0;
      this.igniteT = 0; this.reciteI = -1; this.openT = 0; this.walkT = 0;
      this.heldGem = null;
      this._finished = false;
      this.seedsGathered = params.seeds || 0;
      this.recall = !!params.recall; // Star Walk: hints arrive more slowly
      // ordered on the walk — straight to the ceremony. Debug runs skip the
      // sorting entirely, the same way, so the whole gate takes ~a second.
      this.prePlaced = !!params.prePlaced || !!GOL.DEBUG;
      const n = this.L.surah.verses.length;
      // shuffle the display order so the cloud never spells the answer
      const order = this.L.surah.verses.map((v) => v.n);
      const rng = GOL.rng(Date.now() % 100000);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      // the gems arrive veiled in light: the child must LISTEN to know them.
      // veil lifts (true color blooms) when a gem finds its place.
      this.gems = order.map((ayah, i) => ({
        ayah, i, x: 0, y: 0, homeX: 0, homeY: 0,
        phase: Math.random() * 7, placed: -1, drift: null, pulse: 0,
        veiled: true, reveal: 0, heard: false
      }));
      if (this.prePlaced) {
        // the Star Walk gathered them in order — the gate honors that
        for (const g of this.gems) { g.placed = g.ayah - 1; g.veiled = false; g.reveal = 1; g.heard = true; }
        this.phase = 'ignite';
        this._lastLit = 0;
      }
      GOL.audio.startAmbience('quiet');
      GOL.audio.preloadSurah(this.L.surah);
      if (!this.prePlaced) {
        GOL.audio.preloadVoice(['ui-gate-veiled']);
        GOL.audio.speak('ui-gate-veiled');
      }
      const st = GOL.store.level(this.L.surahId);
      if (!this.prePlaced) st.sortAttempts++;
      GOL.store.save();
    },
    exit() { GOL.audio.stopRecitation(); GOL.audio.stopSpeak(); },

    layout(W, H) {
      const n = this.gems.length;
      const groundY = H * 0.66;
      // big surahs set their gems in two rows of settings, read like lines
      const twoRows = n > 9;
      const perRow = twoRows ? Math.ceil(n / 2) : n;
      const gap = Math.min(84, (W - 140) / perRow);
      const sockets = [];
      for (let i = 0; i < n; i++) {
        const row = twoRows ? Math.floor(i / perRow) : 0;
        const col = twoRows ? i % perRow : i;
        const inRow = twoRows ? (row === 0 ? perRow : n - perRow) : n;
        sockets.push({
          x: W / 2 + (col - (inRow - 1) / 2) * gap,
          y: twoRows ? H * (0.775 + row * 0.115) : H * 0.84,
          i
        });
      }
      // cloud homes: a loose arc; more rows as the surah grows
      const rows = n > 12 ? 3 : n > 5 ? 2 : 1;
      const perR = Math.ceil(n / rows);
      this.gems.forEach((g, i) => {
        const row = i % rows;
        const col = Math.floor(i / rows);
        const spread = Math.min(120, (W - 200) / perR);
        g.homeX = W / 2 + (col - (perR - 1) / 2) * spread + row * spread * (0.8 / rows);
        g.homeY = H * (0.2 + row * 0.105) + Math.sin(i * 2.1) * 10;
      });
      return { groundY, sockets, gap, twoRows, perRow };
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
      for (const g of this.gems) {
        if (!g.veiled) g.reveal = Math.min(1, g.reveal + dt * 2.2);
      }

      if (this.phase === 'sort') this.updateSort(dt, W, H, lay);
      else if (this.phase === 'ignite') {
        this.igniteT += dt;
        const per = GOL.DEBUG ? 0.07 : 0.36;
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
        this.openT = Math.min(1, this.openT + dt / (GOL.DEBUG ? 0.25 : 1.5));
        if (Math.random() < dt * 20) {
          this.fx.spawn('sparkle', W / 2 + GOL.rnd(-70, 70), H * 0.62 - GOL.rnd(0, 180), { color: '#FFE9A8' });
        }
        if (this.openT >= 1) { this.phase = 'walk'; this.walkT = 0; }
      } else if (this.phase === 'walk') {
        this.walkT += dt;
        // petals rain down — one for every seed of light gathered on the way
        const petalRate = Math.min(26, 8 + this.seedsGathered * 0.5);
        if (Math.random() < dt * petalRate) {
          this.fx.spawn('petal', Math.random() * W, -12, {
            color: ['#F5B8C4', '#FFE9A8', '#BFE8DC', '#F7D98C'][Math.floor(Math.random() * 4)]
          });
        }
        if (Math.random() < dt * 10) {
          this.fx.spawn('sparkle', W / 2 + GOL.rnd(-120, 120), H * 0.6 - GOL.rnd(0, 220), { color: '#FFE9A8' });
        }
        if (this.walkT > (GOL.DEBUG ? 0.4 : 2.4) && !this._finished) {
          this._finished = true;
          const st = GOL.store.level(this.L.surahId);
          const first = !st.completed;
          st.completed = true;
          st.heardFull = (st.heardFull || 0) + 1;
          st.seeds = Math.max(st.seeds || 0, this.seedsGathered);
          st.lastPlayed = Date.now();
          if (this.prePlaced) st.starWalks = (st.starWalks || 0) + 1;
          const lastL = GOL.LEVELS.length - 1;
          GOL.store.data.unlocked = Math.max(GOL.store.data.unlocked, Math.min(lastL, this.L.index + 1));
          GOL.store.save();
          GOL.stamp(this.prePlaced ? 'starWalk' : 'walk');
          GOL.go('map', { celebrate: this.L.index, focus: first ? Math.min(lastL, this.L.index + 1) : this.L.index });
        }
      }
    },

    updateSort(dt, W, H, lay) {
      const Input = GOL.Input;
      // pick up — and picking up a veiled gem tells you who it is
      if (Input.drag && !this.heldGem) {
        const d = Input.drag;
        const moved = GOL.dist(d.x, d.y, d.startX, d.startY);
        for (const g of this.gems) {
          if (g.placed >= 0 || g.drift) continue;
          if (GOL.dist(d.startX, d.startY, g.x, g.y) < 46) {
            if (moved > 10) {
              this.heldGem = g;
              if (!g.listenedThisHold) {
                g.listenedThisHold = true;
                g.heard = true;
                GOL.audio.playVerse(this.L.surahId, g.ayah, null);
              }
            }
            break;
          }
        }
      }
      if (!this.heldGem) {
        for (const g of this.gems) g.listenedThisHold = false;
      }
      // taps replay their ayah
      for (const tap of Input.taps) {
        if (tap.ui) continue;
        for (const g of this.gems) {
          if (GOL.dist(tap.x, tap.y, g.x, g.y) < 42) {
            tap.ui = true;
            g.pulse = 1;
            g.heard = true;
            GOL.audio.playVerse(this.L.surahId, g.ayah, null);
            this.fx.spawn('ring', g.x, g.y, { color: g.placed >= 0 ? GOL.GEMS[(g.ayah - 1) % 7].glow : '#FFE9A8', size: 22 });
            break;
          }
        }
      }
      // release
      for (const rel of Input.releases) {
        if (!this.heldGem) break;
        const g = this.heldGem;
        this.heldGem = null;
        // the nearest empty setting takes the gem — with two close-set rows,
        // "first within reach" would sometimes steal a neighbour's drop
        let hit = null, best = 56;
        for (const s of this.sockets) {
          if (this.gems.some((o) => o.placed === s.i)) continue;
          const d = GOL.dist(rel.x, rel.y, s.x, s.y);
          if (d < best) { best = d; hit = s; }
        }
        if (hit) {
          if (g.ayah === hit.i + 1) {
            g.placed = hit.i;
            g.drift = null;
            g.veiled = false; // the veil lifts — its true color blooms
            GOL.audio.sfx('place');
            GOL.audio.sfx('veil');
            GOL.audio.chime(hit.i, { short: true, soft: true });
            this.fx.spawn('ring', hit.x, hit.y, { color: '#FFF3C4', size: 18 });
            this.fx.burst(hit.x, hit.y, GOL.GEMS[(g.ayah - 1) % 7].base, 10);
            const done = this.checkDone();
            // hearing your placement confirms the chain — building the surah
            // aloud, ayah by ayah (the final one flows into the recitation)
            if (!done) GOL.audio.playVerse(this.L.surahId, g.ayah, null);
          } else {
            // no scolding — it just isn't its place; the gem floats home
            this.attempts++;
            const st = GOL.store.level(this.L.surahId);
            st.misorders[g.ayah] = (st.misorders[g.ayah] || 0) + 1;
            GOL.store.save();
            GOL.audio.sfx('drift');
            g.drift = { t: 0, fromX: g.x, fromY: g.y };
            const h1 = this.recall ? 5 : 3, h2 = this.recall ? 9 : 6;
            if (this.attempts === h1 || this.attempts === h2) GOL.audio.sfx('hint');
          }
        } else {
          g.drift = { t: 0, fromX: g.x, fromY: g.y };
        }
      }
      // on a Star Walk the garden trusts the child a while longer
      const h1 = this.recall ? 5 : 3, h2 = this.recall ? 9 : 6;
      this.hintLevel = this.attempts >= h2 ? 2 : this.attempts >= h1 ? 1 : 0;
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
            g.veiled = false;
            const st = GOL.store.level(this.L.surahId);
            st.hintsUsed++;
            GOL.store.save();
            GOL.audio.sfx('place');
            GOL.audio.chime(needed - 1, { short: true });
            this.fx.spawn('ring', this.sockets[needed - 1].x, this.sockets[needed - 1].y, { color: '#FFF3C4', size: 22 });
            const done = this.checkDone();
            if (!done) GOL.audio.playVerse(this.L.surahId, g.ayah, null);
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
        GOL.audio.stopRecitation(); // clear the way for the whole surah
        return true;
      }
      return false;
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

      // the settings ledge (two rows of settings for the long surahs)
      const n = this.gems.length;
      const twoRows = n > 9;
      const perRow = twoRows ? Math.ceil(n / 2) : n;
      const sgap = Math.min(84, (W - 140) / perRow);
      const lw = sgap * perRow + 60;
      const ledgeY = twoRows ? H * 0.775 : H * 0.84;
      const ledgeH = twoRows ? H * 0.115 + 78 : 80;
      GOL.drawPanel(ctx, W / 2 - lw / 2, ledgeY - 38, lw, ledgeH, { radius: 20, alpha: 0.9, plain: n > 5 });
      const sr = Math.max(11, Math.min(17, sgap * 0.42));
      const litCount = this.phase === 'ignite' ? this._lastLit || 0 : this.phase === 'recite' || this.phase === 'open' || this.phase === 'walk' ? n : 0;
      this.sockets.forEach((s, i) => {
        GOL.star8Path(ctx, s.x, s.y, sr, Math.PI / 8);
        const lit = i < litCount;
        ctx.fillStyle = lit ? alpha('#FFE9A8', 0.6 + 0.2 * Math.sin(t * 3 + i)) : 'rgba(120,104,70,0.13)';
        ctx.fill();
        ctx.strokeStyle = lit ? alpha('#D9A44A', 0.95) : 'rgba(150,128,84,0.4)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        if (!this.gems.some((g) => g.placed === i)) {
          GOL.text(ctx, String(i + 1), s.x, s.y + 1, { size: Math.min(13, sr), weight: '800', color: 'rgba(122,98,56,0.5)' });
        }
      });

      // guidance
      if (this.phase === 'sort') {
        const done = this.gems.filter((g) => g.placed >= 0).length;
        GOL.drawPanel(ctx, W / 2 - 250, 18, 500, 58, { radius: 26, plain: true, alpha: 0.85 });
        GOL.text(ctx, done === 0 ? 'the gems have veiled themselves in light' : done < n ? 'beautiful — keep listening' : '', W / 2, 40, { size: 17, weight: '800' });
        GOL.text(ctx, done === 0 ? 'listen to each one, and set them in the order of the surah' : 'tap a gem to hear which ayah it holds', W / 2, 61, { size: 13, weight: '600', color: GOL.INK_SOFT });
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
      const big = n > 12; // a 19-gem cloud needs slightly smaller lights
      for (const g of this.gems) {
        const C = GOL.GEMS[(g.ayah - 1) % 7];
        let r = g.placed >= 0 ? Math.min(big ? 11 : 15, sr * 0.85) : (big ? 17 : 21);
        if (this.heldGem === g) r = big ? 23 : 26;
        if (this.phase === 'recite' && g.placed === this.reciteI) {
          r = (big ? 18 : 24) + Math.sin(t * 6) * 1.5;
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
        const rr = r + (g.pulse || 0) * 6;
        if (g.veiled) {
          // wrapped in light: listen to know it
          GOL.drawVeiledGem(ctx, g.x, g.y, rr, t, g.phase, g.pulse || 0, g.heard);
        } else {
          if (g.reveal < 1) {
            // the veil lifting: a bloom of its true light
            const k = g.reveal;
            ctx.strokeStyle = alpha(C.glow, 0.7 * (1 - k));
            ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(g.x, g.y, rr + k * 40, 0, Math.PI * 2); ctx.stroke();
          }
          GOL.drawGem(ctx, g.x, g.y, rr, C, t, { phase: g.phase, glow: g.placed >= 0 ? 0.75 : 1 });
        }
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
