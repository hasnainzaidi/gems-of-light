// Gems of Light — level.js
// The playable garden: wandering, jumping, finding gems, hearing ayat.
(function () {
  const GOL = window.GOL;
  const TILE = GOL.TILE;
  const { alpha, tint, shade, mix } = GOL.color;

  const level = {
    t: 0, L: null, P: null, atlas: null, strips: null, strips2: null,
    sprites: null, player: null, cam: null, fx: null,
    found: [], overlay: null, paused: false, intro: 0,
    stoneTiles: null, waterRects: null, scale: 1, escDown: false,
    archPulseT: 0, gemStates: null, firstVisit: false,

    enter(params) {
      const L = (this.L = GOL.LEVELS[params.index]);
      this.t = 0;
      this.paused = false;
      this.overlay = null;
      this.intro = 2.6;
      this.found = [];
      this.fx = GOL.makeFx();

      // palette + prebuilt art
      const isFalaq = L.key === 'falaq';
      this.P = GOL.PALETTES[L.key];
      const tilePal = isFalaq ? GOL.lerpPal(GOL.PALETTES.falaq, GOL.PALETTES.falaqEnd, 0.5) : this.P;
      this.atlas = GOL.buildTileAtlas(tilePal, 7 + params.index * 13);
      this.sprites = GOL.buildPropSprites(tilePal, 31 + params.index * 7);
      const mkStrips = (P, s) => ({
        far: GOL.buildHillStrip(1400, 260, { seed: s + 1, base: 150, amp: 40, color: P.hillFar, mist: P.mist, trees: 11, treeColor: shade(P.hillFar, 0.22) }),
        mid: GOL.buildHillStrip(1150, 230, { seed: s + 2, base: 118, amp: 50, color: P.hillMid, mist: P.mist, trees: 8, treeColor: shade(P.hillMid, 0.2) }),
        near: GOL.buildHillStrip(950, 205, { seed: s + 3, base: 90, amp: 46, color: P.hillNear, mist: P.mist, trees: 0 })
      });
      this.strips = mkStrips(this.P, 100 + params.index * 11);
      this.strips2 = isFalaq ? mkStrips(GOL.PALETTES.falaqEnd, 100 + params.index * 11) : null;

      // stepping-stone tiles are drawn as stones, not slabs
      this.stoneTiles = new Set();
      for (const p of L.props) {
        if (p.type === 'stepStone') this.stoneTiles.add(Math.floor(p.x / TILE) + ',' + Math.floor(p.y / TILE));
      }

      // pre-compose all terrain once, at 1:1 — one seamless painting
      this.terrain = GOL.paint.makeCanvas(L.w * TILE, L.h * TILE);
      const tctx = this.terrain.getContext('2d');
      for (let x = 0; x < L.w; x++) {
        for (let y = 0; y < L.h; y++) {
          const v = L.tiles[y * L.w + x];
          if (v === 4) {
            const h = (x * 7 + y * 13) % 5;
            tctx.drawImage(h === 0 ? this.atlas.block : h % 2 ? this.atlas.blockPlain : this.atlas.blockPlain2, x * TILE, y * TILE);
          } else if (v === 1) {
            const solid = (xx, yy) => {
              if (xx < 0 || xx >= L.w) return true;
              if (yy < 0) return false;
              if (yy >= L.h) return true;
              const tt = L.tiles[yy * L.w + xx];
              return tt === 1 || tt === 4;
            };
            let mask = 0;
            if (!solid(x, y - 1)) mask |= 1;
            if (!solid(x + 1, y)) mask |= 2;
            if (!solid(x, y + 1)) mask |= 4;
            if (!solid(x - 1, y)) mask |= 8;
            const deepDown = solid(x, y - 1) && solid(x, y - 2);
            tctx.drawImage(mask === 0 && deepDown ? this.atlas.deep : this.atlas['g' + mask], x * TILE, y * TILE);
          } else if (v === 2 && !this.stoneTiles.has(x + ',' + y)) {
            const isSlab = (xx) => xx >= 0 && xx < L.w && L.tiles[y * L.w + xx] === 2 && !this.stoneTiles.has(xx + ',' + y);
            const l = isSlab(x - 1), r = isSlab(x + 1);
            const kind = l && r ? 'M' : l ? 'R' : r ? 'L' : 'S';
            tctx.drawImage(this.atlas['slab' + kind], x * TILE, y * TILE);
          }
        }
      }
      // depth shading that follows the surface line, column by column —
      // the earth settles gently into darkness the deeper it goes
      tctx.save();
      tctx.globalCompositeOperation = 'source-atop';
      for (let x = 0; x < L.w; x++) {
        let surf = L.h;
        for (let y = 0; y < L.h; y++) {
          const t = L.tiles[y * L.w + x];
          if (t === 1 || t === 4) { surf = y; break; }
        }
        if (surf >= L.h) continue;
        const top = (surf + 0.6) * TILE;
        const g = tctx.createLinearGradient(0, top, 0, L.h * TILE);
        g.addColorStop(0, 'rgba(38,50,40,0)');
        g.addColorStop(1, 'rgba(38,50,40,0.34)');
        tctx.fillStyle = g;
        tctx.fillRect(x * TILE, top, TILE, L.h * TILE - top);
      }
      tctx.restore();
      // contiguous water rectangles for drawing
      this.waterRects = [];
      const seen = new Set();
      for (let y = 0; y < L.h; y++) {
        for (let x = 0; x < L.w; x++) {
          if (L.tiles[y * L.w + x] !== 3 || seen.has(x + ',' + y)) continue;
          if (y > 0 && L.tiles[(y - 1) * L.w + x] === 3) { seen.add(x + ',' + y); continue; }
          let x1 = x;
          while (x1 + 1 < L.w && L.tiles[y * L.w + x1 + 1] === 3 && !(y > 0 && L.tiles[(y - 1) * L.w + x1 + 1] === 3)) x1++;
          for (let xx = x; xx <= x1; xx++) seen.add(xx + ',' + y);
          this.waterRects.push({ x: x * TILE, y: y * TILE, w: (x1 - x + 1) * TILE, h: (L.h - y) * TILE });
        }
      }

      this.player = GOL.makePlayer(L.start.x, L.start.y);
      this.gemStates = L.gems.map((g) => ({ near: false }));
      this.cam = null; // sized on first update (needs W,H)

      const st = GOL.store.level(L.surahId);
      this.firstVisit = !st.completed && st.replays === 0;
      if (st.completed) { st.replays++; GOL.store.save(); }

      GOL.audio.preloadSurah(L.surah);
      GOL.audio.startAmbience('garden');
    },
    exit() {
      GOL.Input.zones = null;
      GOL.audio.stopRecitation();
      GOL.audio.setWaterNearness(0);
    },

    // ------------------------------------------------------------ update --
    update(dt, W, H) {
      this.t += dt;
      const L = this.L;
      this.scale = H / (13 * TILE);
      const viewW = W / this.scale, viewH = H / this.scale;
      if (!this.cam) {
        this.cam = GOL.makeCamera(L, viewW, viewH);
        this.cam.x = Math.max(0, this.player.x - viewW / 2);
        this.cam.y = L.h * TILE - viewH;
      }
      this.cam.viewW = viewW; this.cam.viewH = viewH;

      // escape toggles pause
      const esc = !!GOL.Input._keys['Escape'];
      if (esc && !this.escDown) this.paused = !this.paused;
      this.escDown = esc;

      // chrome buttons (always active)
      this.buttons = [
        { x: 40, y: 40, r: 30, iconName: 'pause', fn: () => (this.paused = !this.paused) },
        Object.assign({}, GOL.muteButton(W))
      ];
      if (this.paused) {
        this.buttons = [
          { x: W / 2 - 90, y: H / 2 + 30, r: 34, iconName: 'play', fn: () => (this.paused = false) },
          { x: W / 2, y: H / 2 + 30, r: 34, iconName: 'map', fn: () => GOL.go('map', { focus: this.L.index }) },
          { x: W / 2 + 90, y: H / 2 + 30, r: 34, icon: () => (GOL.store.data.settings.muted ? 'soundOff' : 'sound'), fn: GOL.muteButton(W).fn }
        ];
        GOL.hitButtons(GOL.Input.taps, this.buttons);
        return;
      }
      GOL.hitButtons(GOL.Input.taps, this.buttons);

      // the collect moment: the world holds its breath
      if (this.overlay) { this.updateOverlay(dt, W, H); this.fx.update(dt); return; }

      // input → movement
      GOL.Input.zones = {
        btnL: { x: 78, y: H - 74, r: 62 },
        btnR: { x: 208, y: H - 74, r: 62 },
        jumpX: W * 0.45
      };
      GOL.Input.poll(W, H);
      GOL.Input.routeTapsToJump();
      GOL.updatePlayer(this.player, L, GOL.Input, dt, this.fx);
      GOL.updateCamera(this.cam, this.player, dt);
      GOL.updateCreatures(L, this.player, dt, this.t);
      this.fx.update(dt);

      // ambient drift
      if (Math.random() < dt * 2.2) {
        this.fx.spawn('mote', this.cam.x + Math.random() * viewW, this.cam.y + Math.random() * viewH * 0.7, {});
      }
      if (Math.random() < dt * 0.4) {
        this.fx.spawn('leaf', this.cam.x + Math.random() * viewW, this.cam.y - 10, { color: mix(this.P.leafLight, this.P.leaf, Math.random()) });
      }

      // water nearness (for the burble)
      let nearWater = 0;
      for (const w of this.waterRects) {
        const dx = Math.max(w.x - this.player.x, 0, this.player.x - (w.x + w.w));
        nearWater = Math.max(nearWater, 1 - Math.min(1, dx / 420));
      }
      for (const wf of L.waterfalls) {
        const dx = Math.abs(wf.x - this.player.x);
        nearWater = Math.max(nearWater, 1 - Math.min(1, dx / 380));
      }
      GOL.audio.setWaterNearness(nearWater);

      // gems: bob, whisper when near, collect on touch
      L.gems.forEach((g, i) => {
        if (this.found.includes(g.ayah)) return;
        const gy = g.y + Math.sin(this.t * 1.7 + i * 1.3) * 5;
        const d = Math.hypot(this.player.x - g.x, this.player.y - 16 - gy);
        const gs = this.gemStates[i];
        if (d < 250 && !gs.near) {
          gs.near = true;
          GOL.audio.sfx('nearby');
          this.fx.spawn('ring', g.x, gy, { color: GOL.GEMS[(g.ayah - 1) % 7].glow, size: 22 });
        } else if (d > 330) gs.near = false;
        if (Math.random() < dt * 2) this.fx.spawn('sparkle', g.x + GOL.rnd(-14, 14), gy + GOL.rnd(-16, 16), { color: GOL.GEMS[(g.ayah - 1) % 7].light });
        if (d < 40) this.collect(g, i, W, H);
      });

      // the arch: opens only when every gem is found
      const allFound = this.found.length === L.gems.length;
      if (allFound) {
        this.archPulseT += dt;
        const d = Math.abs(this.player.x - L.arch.x);
        if (d < 54 && this.player.grounded && Math.abs(this.player.y - L.arch.y) < 60) {
          GOL.go('gate', { index: L.index });
          return;
        }
      }
    },

    collect(g, i, W, H) {
      const C = GOL.GEMS[(g.ayah - 1) % 7];
      this.found.push(g.ayah);
      // remember forever (for the Recitation Room)
      const st = GOL.store.level(this.L.surahId);
      st.found = st.found || [];
      if (!st.found.includes(g.ayah)) { st.found.push(g.ayah); st.found.sort((a, b) => a - b); }
      GOL.store.save();

      const sx = (g.x - this.cam.x) * this.scale;
      const sy = (g.y - this.cam.y) * this.scale;
      this.overlay = {
        phase: 'fly', t: 0, gem: g, C,
        fromX: sx, fromY: sy,
        verse: this.L.surah.verses.find((v) => v.n === g.ayah),
        audioDone: false, minT: 0
      };
      GOL.audio.chime((g.ayah - 1) % 8);
      this.fx.burst(g.x, g.y, C.base, 16);
      this.player.vx = 0;
    },

    updateOverlay(dt, W, H) {
      const o = this.overlay;
      o.t += dt;
      if (o.phase === 'fly' && o.t > 0.75) {
        o.phase = 'recite';
        o.t = 0;
        GOL.audio.playVerse(this.L.surahId, o.gem.ayah, () => { o.audioDone = true; });
      } else if (o.phase === 'recite') {
        if (o.audioDone && o.t > 1.6) {
          o.phase = 'settle';
          o.t = 0;
          GOL.audio.sfx('settle');
        }
        // let an impatient replayer skip ahead once the words have landed
        for (const tap of GOL.Input.taps) {
          if (!tap.ui && o.t > 1.2) {
            tap.ui = true;
            GOL.audio.stopRecitation();
            o.phase = 'settle'; o.t = 0;
            GOL.audio.sfx('settle');
            break;
          }
        }
      } else if (o.phase === 'settle' && o.t > 0.7) {
        this.overlay = null;
      }
    },

    // -------------------------------------------------------------- draw --
    draw(ctx, W, H) {
      const L = this.L, t = this.t, cam = this.cam || { x: 0, y: 0 };
      // Al-Falaq: dawn brightens as you walk east
      let P = this.P, dawnK = 0;
      if (L.key === 'falaq') {
        dawnK = Math.min(1, Math.max(0, (this.player ? this.player.x : 0) / (L.w * TILE) * 1.25));
        P = GOL.lerpPal(GOL.PALETTES.falaq, GOL.PALETTES.falaqEnd, dawnK);
      }
      GOL.drawSky(ctx, W, H, P, t, cam.x);
      const horizon = (13.4 * TILE - cam.y) * this.scale;
      const dstrips = (S, a) => {
        if (a <= 0) return;
        ctx.globalAlpha = a;
        GOL.drawStrip(ctx, S.far, cam.x, 0.06, horizon - 258, W);
        ctx.globalAlpha = 1;
        if (a === 1 || !this.strips2) GOL.drawRays(ctx, W, H, P, t);
        ctx.globalAlpha = a;
        GOL.drawStrip(ctx, S.mid, cam.x, 0.14, horizon - 208, W);
        GOL.drawStrip(ctx, S.near, cam.x, 0.26, horizon - 158, W);
        ctx.globalAlpha = 1;
      };
      dstrips(this.strips, this.strips2 ? 1 : 1);
      if (this.strips2) dstrips(this.strips2, dawnK);

      // ---- world space
      ctx.save();
      ctx.scale(this.scale, this.scale);
      ctx.translate(-cam.x, -cam.y);
      // terrain: one pre-composed painting, blitted in a single call
      {
        const sx = Math.max(0, Math.floor(cam.x) - 8);
        const sw = Math.min(this.terrain.width - sx, cam.viewW + 16);
        ctx.drawImage(this.terrain, sx, 0, sw, this.terrain.height, sx, 0, sw, this.terrain.height);
        // the earth continues below the last row — no sky under the world
        ctx.fillStyle = shade(P.mortar || P.soilDark, 0.3);
        ctx.fillRect(sx, this.terrain.height - 1, sw, 120);
      }
      // water
      for (const w of this.waterRects) GOL.drawWater(ctx, w.x, w.y, w.w, w.h, t, P);

      // props
      for (const p of L.props) {
        if (p.x < cam.x - 220 || p.x > cam.x + cam.viewW + 220) continue;
        this.drawProp(ctx, p, t, P);
      }
      // the arch at the level's end
      const allFound = this.found.length === L.gems.length;
      const archGlow = allFound ? 0.5 + 0.3 * Math.sin(t * 2.2) : 0.06;
      GOL.drawArch(ctx, L.arch.x, L.arch.y, t, P, allFound ? 0.22 + 0.05 * Math.sin(t * 1.8) : 0, archGlow);
      if (!allFound && Math.abs(this.player.x - L.arch.x) < 170) {
        // gentle reminder: dim stars for gems still hiding
        const n = L.gems.length;
        for (let i = 0; i < n; i++) {
          const gx = L.arch.x + (i - (n - 1) / 2) * 26;
          const gy = L.arch.y - 216 + Math.sin(t * 2 + i) * 3;
          GOL.star8Path(ctx, gx, gy, 8, Math.PI / 8);
          const has = this.found.includes(L.gems[i].ayah);
          ctx.fillStyle = has ? alpha(GOL.GEMS[i % 7].base, 0.95) : 'rgba(255,251,238,0.28)';
          ctx.fill();
        }
      }

      // creatures
      for (const c of L.creatures) {
        if (c.x < cam.x - 120 || c.x > cam.x + cam.viewW + 120) continue;
        if (c.type === 'bird') GOL.drawBird(ctx, c.x, c.y, t + c.phase, P, c);
        else if (c.type === 'butterfly') GOL.drawButterfly(ctx, c.x, c.y, t, c.phase, c.colA || '#F0C878', c.colB || '#F7EFDA');
        else if (c.type === 'tortoise') GOL.drawTortoise(ctx, c.x, c.y, t + c.phase, P, c.dir);
        else if (c.type === 'snail') GOL.drawSnail(ctx, c.x, c.y, t + c.phase, P, c.facing || c.dir);
        else if (c.type === 'rabbit') GOL.drawRabbit(ctx, c.x, c.y, t + c.phase, P, c);
      }

      // gems, then the waterfalls that sometimes veil them
      L.gems.forEach((g, i) => {
        if (this.found.includes(g.ayah)) return;
        const gy = g.y + Math.sin(t * 1.7 + i * 1.3) * 5;
        GOL.drawGem(ctx, g.x, gy, 15, GOL.GEMS[(g.ayah - 1) % 7], t, { phase: i * 1.7 });
      });
      for (const wf of L.waterfalls) GOL.drawWaterfall(ctx, wf.x, wf.y, 34, wf.h, t, P);

      // the wanderer
      const pl = this.player;
      if (pl) {
        // during the collect hush, Lightling closes its eyes and warms
        const hush = this.overlay && this.overlay.phase !== 'settle';
        GOL.drawSprite(ctx, pl.x, pl.y, {
          vx: pl.vx, vy: pl.vy, grounded: pl.grounded, facing: pl.facing,
          t: pl.t, idleT: pl.idleT, blink: pl.blink,
          squashX: pl.squashX, squashY: pl.squashY, moving: pl.moving,
          happy: hush, glow: hush ? 1 : allFound ? 0.45 + 0.2 * Math.sin(t * 2) : 0
        });
      }
      this.fx.draw(ctx);
      ctx.restore();

      // Al-Falaq's lingering night, thinning toward the east
      if (L.key === 'falaq' && dawnK < 1) {
        ctx.fillStyle = alpha('#25333E', 0.26 * (1 - dawnK));
        ctx.fillRect(0, 0, W, H);
      }

      // ---- interface
      const band = GOL.drawHudBand(ctx, W / 2, 14, L.gems.length, this.found.map((a) => a - 1), t);
      this._band = band;
      for (const b of this.buttons || []) {
        if (b.iconName === 'pause' || b.icon) GOL.drawButton(ctx, b.x, b.y, 22, b.icon ? b.icon() : b.iconName);
      }
      if (GOL.Input.touchMode && !this.overlay) GOL.drawTouchControls(ctx, W, H, GOL.Input, this.firstVisit && this.t < 9);
      if (!GOL.Input.touchMode && this.firstVisit && this.t < 8 && !this.overlay) {
        GOL.text(ctx, '← → to wander · space to jump', W / 2, H - 30, { size: 15, weight: '700', color: 'rgba(255,251,238,0.8)' });
      }

      // level intro card
      if (this.intro > 0 && !this.overlay) {
        this.intro -= 1 / 60;
        const k = Math.min(1, this.intro / 0.5);
        ctx.globalAlpha = Math.min(1, k);
        GOL.drawPanel(ctx, W / 2 - 240, H * 0.16, 480, 110, { radius: 22 });
        GOL.text(ctx, this.L.surah.englishName + '  ·  ' + this.L.surah.arabicName, W / 2, H * 0.16 + 38, { size: 26, weight: '800' });
        GOL.text(ctx, this.L.title + ' — ' + this.L.subtitle, W / 2, H * 0.16 + 74, { size: 15, weight: '600', color: GOL.INK_SOFT });
        ctx.globalAlpha = 1;
      }

      if (this.overlay) this.drawOverlay(ctx, W, H);
      if (this.paused) this.drawPause(ctx, W, H);
      GOL.drawVignette(ctx, W, H, 0.14);
    },

    drawProp(ctx, p, t, P) {
      const S = this.sprites;
      const spr = {
        olive: () => S.olive[p.v % 3], cypress: () => S.cypress[p.v % 2],
        bush: () => S.bush[p.v % 3], flowers: () => S.flowers[p.v % 3],
        lantern: () => S.lantern, sundial: () => S.sundial,
        stepStone: () => S.stepStone[p.v % 2]
      }[p.type];
      if (p.type === 'wall') {
        const c = p._c || (p._c = S.wall(p.n || 2));
        ctx.drawImage(c, p.x - c._anchor.x, p.y - c._anchor.y);
      } else if (p.type === 'fountain') {
        GOL.drawFountain(ctx, p.x, p.y, t, P, 1);
      } else if (p.type === 'tuft') {
        // living grass, drawn fresh so it can sway
        const sway = Math.sin(t * 1.6 + p.x * 0.05) * 2.5;
        ctx.strokeStyle = alpha(p.v === 1 ? P.grassLight : P.grass, 0.95);
        ctx.lineWidth = 2; ctx.lineCap = 'round';
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(p.x + i * 3, p.y);
          ctx.quadraticCurveTo(p.x + i * 3 + sway * 0.4, p.y - 8, p.x + i * 2.2 + sway, p.y - 13 - Math.abs(i));
          ctx.stroke();
        }
      } else if (spr) {
        const c = spr();
        ctx.drawImage(c, p.x - c._anchor.x, p.y - c._anchor.y);
      }
    },

    drawOverlay(ctx, W, H) {
      const o = this.overlay;
      // hush: the world dims
      const dim = o.phase === 'fly' ? Math.min(1, o.t / 0.5) : o.phase === 'settle' ? Math.max(0, 1 - o.t / 0.6) : 1;
      ctx.fillStyle = alpha('#22352A', 0.5 * dim);
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2, cy = H * 0.3;
      let gx = cx, gy = cy, gr = 34;
      if (o.phase === 'fly') {
        const e = GOL.ease.inOut(Math.min(1, o.t / 0.75));
        gx = o.fromX + (cx - o.fromX) * e;
        gy = o.fromY + (cy - o.fromY) * e - Math.sin(Math.PI * e) * 40;
        gr = 15 * this.scale + (34 - 15 * this.scale) * e;
      } else if (o.phase === 'settle') {
        const band = this._band;
        const slotX = band ? band.slotX(o.gem.ayah - 1) : W / 2;
        const slotY = band ? band.slotY : 40;
        const e = GOL.ease.inOut(Math.min(1, o.t / 0.6));
        gx = cx + (slotX - cx) * e;
        gy = cy + (slotY - cy) * e;
        gr = 34 - (34 - 10) * e;
      }
      // the ayah, held up with dignity
      if (o.phase === 'recite') {
        const k = Math.min(1, o.t / 0.4);
        ctx.globalAlpha = k;
        const pw = Math.min(660, W - 80);
        GOL.drawPanel(ctx, cx - pw / 2, cy + 52, pw, 168, { radius: 20 });
        // ayah star badge
        GOL.star8Path(ctx, cx, cy + 52, 15, Math.PI / 8);
        ctx.fillStyle = '#F5EDD4'; ctx.fill();
        ctx.strokeStyle = alpha(GOL.GOLD, 0.9); ctx.lineWidth = 2; ctx.stroke();
        GOL.text(ctx, String(o.gem.ayah), cx, cy + 53, { size: 14, weight: '800', color: GOL.GOLD });
        GOL.text(ctx, o.verse.ar, cx, cy + 106, { size: 34, ar: true, weight: '400', color: '#2E4032' });
        GOL.text(ctx, GOL.trFix(o.verse.tr), cx, cy + 150, { size: 15, weight: '600', color: GOL.GOLD });
        GOL.text(ctx, o.verse.meaning, cx, cy + 182, { size: 15.5, weight: '700', color: GOL.INK_SOFT });
        ctx.globalAlpha = 1;
      }
      GOL.drawGem(ctx, gx, gy, gr, o.C, this.t, { phase: 2 });
      if (o.phase !== 'settle' && Math.random() < 0.25) {
        this.fx.spawn('sparkle', gx + GOL.rnd(-gr, gr), gy + GOL.rnd(-gr, gr), { color: o.C.light });
      }
      if (o.phase === 'settle') {
        // a trail of light going home to the band
        for (let i = 0; i < 2; i++) this.fx.spawn('trail', gx + GOL.rnd(-6, 6), gy + GOL.rnd(-6, 6), { color: o.C.base });
      }
      this.fx.draw(ctx);
    },

    drawPause(ctx, W, H) {
      ctx.fillStyle = 'rgba(34,53,42,0.55)';
      ctx.fillRect(0, 0, W, H);
      GOL.drawPanel(ctx, W / 2 - 190, H / 2 - 88, 380, 176, { radius: 24 });
      GOL.text(ctx, 'resting', W / 2, H / 2 - 44, { size: 24, weight: '800' });
      for (const b of this.buttons) GOL.drawButton(ctx, b.x, b.y, 30, b.icon ? b.icon() : b.iconName);
    }
  };
  GOL.registerScene('level', level);
})();
