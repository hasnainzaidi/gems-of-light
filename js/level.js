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
    archPulseT: 0, gemStates: null, firstVisit: false, firstLearn: false,
    seeds: null, seedCount: 0, seedChain: 0, seedChainT: 0,
    pads: null, movers: null, blossomState: null, toast: null, fly: null,

    enter(params) {
      const L = (this.L = GOL.LEVELS[params.index]);
      this.t = 0;
      this.paused = false;
      this.overlay = null;
      this.intro = GOL.DEBUG ? 0 : 2.6;
      this.found = [];
      this.fx = GOL.makeFx();
      this.toast = null;
      // Star Walk: the gems veil themselves and must be gathered in order —
      // the whole surah held in the head, ayah by ayah, on the move.
      this.recall = !!params.recall;
      this.whisperGem = -1; this.nudgeT = 0;

      // journey ingredients, fresh every walk
      this.seeds = L.seeds.map((s, i) => ({ x: s.x, y: s.y, taken: false, phase: i * 0.9 }));
      this.seedCount = 0;
      this.seedChain = 0;
      this.seedChainT = 0;
      this.pads = L.pads.map((p) => ({ x: p.x, y: p.y, squish: 0, sqV: 0 }));
      this.movers = L.moverDefs.map((m) => {
        if (m.kind === 'h') return { kind: 'h', x0: m.x0, x1: m.x1, x: (m.x0 + m.x1) / 2, y: m.y, hw: m.hw, speed: m.speed, phase: m.phase, dx: 0, dip: 0, t: 0 };
        return { kind: 'v', x: m.x, y0: m.y0, y1: m.y1, y: (m.y0 + m.y1) / 2, hw: m.hw, speed: m.speed, phase: m.phase, dx: 0, dip: 0, t: 0 };
      });
      L.movers = this.movers; // physics reads them from the level
      const stPre = GOL.store.level(L.surahId);
      this.blossomState = L.blossom ? { x: L.blossom.x, y: L.blossom.y, taken: false, everFound: stPre.blossom } : null;
      this.fly = { x: L.start.x - 40, y: L.start.y - 90, vx: 0, vy: 0, mode: 'follow', pulseT: 0, t: Math.random() * 7 };

      // palette + prebuilt art. A `<key>End` palette makes the light drift
      // across the level: falaq's daybreak, qadr's nightfall, alaq's first dawn.
      this.P = GOL.PALETTES[L.key];
      this.endP = GOL.PALETTES[L.key + 'End'] || null;
      const tilePal = this.endP ? GOL.lerpPal(this.P, this.endP, 0.5) : this.P;
      this.atlas = GOL.buildTileAtlas(tilePal, 7 + params.index * 13);
      this.sprites = GOL.buildPropSprites(tilePal, 31 + params.index * 7);
      const mkStrips = (P, s) => ({
        far: GOL.buildHillStrip(1400, 260, { seed: s + 1, base: 150, amp: 40, color: P.hillFar, mist: P.mist, trees: 11, treeColor: shade(P.hillFar, 0.22) }),
        mid: GOL.buildHillStrip(1150, 230, { seed: s + 2, base: 118, amp: 50, color: P.hillMid, mist: P.mist, trees: 8, treeColor: shade(P.hillMid, 0.2) }),
        near: GOL.buildHillStrip(950, 205, { seed: s + 3, base: 90, amp: 46, color: P.hillNear, mist: P.mist, trees: 0 })
      });
      this.strips = mkStrips(this.P, 100 + params.index * 11);
      this.strips2 = this.endP ? mkStrips(this.endP, 100 + params.index * 11) : null;

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
      this.firstLearn = !st.completed && !this.recall; // full echo ritual until the surah is theirs
      if (st.completed) st.replays++;
      st.lastPlayed = Date.now();
      GOL.store.save();
      GOL.stamp(this.recall ? 'starWalkStart' : 'walkStart');

      GOL.audio.preloadSurah(L.surah);
      GOL.audio.startAmbience('garden');
      GOL.audio.enterFlourish();
      // the storyteller's voice (pre-generated files; silent if absent)
      GOL.audio.preloadVoice(this.recall
        ? ['ui-star-walk', 'ui-not-yet']
        : ['ui-your-turn', 'ui-blossom']);
      if (this.recall) GOL.audio.speak('ui-star-walk');
      this._voiceNudgeAt = 0;
    },
    exit() {
      GOL.Input.zones = null;
      GOL.audio.stopRecitation();
      GOL.audio.stopSpeak();
      GOL.audio.setWaterNearness(0);
      if (this.L) this.L.movers = null;
      // release the big prepainted canvases — enter() rebuilds them fresh,
      // and holding a whole level's terrain while on the map wastes memory
      this.terrain = null;
      this.atlas = null;
      this.sprites = null;
      this.strips = null;
      this.strips2 = null;
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

      // drifting leaves move first, so they can carry the wanderer
      for (const m of this.movers) {
        m.t += dt;
        if (m.kind === 'h') {
          const mid = (m.x0 + m.x1) / 2, amp = (m.x1 - m.x0) / 2;
          const nx = mid + Math.sin(m.t * m.speed * Math.PI * 2 + m.phase) * amp;
          m.dx = nx - m.x;
          m.x = nx;
        } else {
          const mid = (m.y0 + m.y1) / 2, amp = (m.y1 - m.y0) / 2;
          m.y = mid + Math.sin(m.t * m.speed * Math.PI * 2 + m.phase) * amp;
          m.dx = 0;
        }
        m.dip = Math.max(0, m.dip - dt * 2.2);
      }

      GOL.updatePlayer(this.player, L, GOL.Input, dt, this.fx);

      // bounce blossoms: landing on one springs you high
      const pl = this.player;
      for (const p of this.pads) {
        // spring the petals back
        p.sqV += (0 - p.squish) * 140 * dt - p.sqV * 10 * dt;
        p.squish = Math.max(0, Math.min(1, p.squish + p.sqV * dt));
        if (pl.grounded && !pl.rescue && Math.abs(pl.x - p.x) < 34 && Math.abs(pl.y - p.y) < 14) {
          pl.vy = -800;
          pl.grounded = false;
          pl.coyote = 0;
          pl.sqVX = -4.2; pl.sqVY = 4.2;
          p.squish = 1; p.sqV = -2;
          GOL.audio.sfx('bounce');
          this.fx.spawn('ring', p.x, p.y - 18, { color: '#F5B8C4', size: 20 });
          for (let i = 0; i < 7; i++) this.fx.spawn('sparkle', p.x + GOL.rnd(-16, 16), p.y - 16, { color: i % 2 ? '#F5B8C4' : '#FFF3C4' });
        }
      }

      GOL.updateCamera(this.cam, this.player, dt);
      GOL.updateCreatures(L, this.player, dt, this.t);
      this.fx.update(dt);

      // noor seeds: gathered by touch, each tick climbing a little ladder of song
      this.seedChainT = Math.max(0, this.seedChainT - dt);
      if (this.seedChainT <= 0) this.seedChain = 0;
      for (const s of this.seeds) {
        if (s.taken) continue;
        const sy = s.y + Math.sin(this.t * 2.1 + s.phase) * 3;
        if (Math.abs(pl.x - s.x) < 30 && Math.abs(pl.y - 16 - sy) < 34) {
          s.taken = true;
          this.seedCount++;
          GOL.audio.seedTick(this.seedChain++);
          this.seedChainT = 1.4;
          this.fx.spawn('ring', s.x, sy, { color: '#FFE9A8', size: 8 });
          for (let i = 0; i < 3; i++) this.fx.spawn('sparkle', s.x + GOL.rnd(-8, 8), sy + GOL.rnd(-8, 8), { color: '#FFE9A8' });
        }
      }

      // the hidden Rahma blossom
      const B = this.blossomState;
      if (B && !B.taken) {
        if (Math.abs(pl.x - B.x) < 44 && Math.abs(pl.y - 16 - B.y) < 48) {
          B.taken = true;
          const st = GOL.store.level(L.surahId);
          const isNew = !st.blossom;
          st.blossom = true;
          GOL.store.save();
          GOL.audio.sfx('blossom');
          if (isNew) GOL.audio.speak('ui-blossom');
          this.fx.burst(B.x, B.y, '#F0C878', 26);
          this.fx.spawn('ring', B.x, B.y, { color: '#FFE9A8', size: 30 });
          this.toast = { t: 0, dur: 3.4, text: isNew ? 'you found a hidden Rahma blossom!' : 'the Rahma blossom, glad to see you again', sub: isNew ? 'there is one sleeping in every garden' : null };
        }
      }

      // Noor the firefly: follows, and gently leads when the child seems lost
      this.updateFirefly(dt);

      if (this.toast) {
        this.toast.t += dt;
        if (this.toast.t > this.toast.dur) this.toast = null;
      }

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
      const nextAyah = this.found.length + 1; // Star Walks gather in order
      L.gems.forEach((g, i) => {
        if (this.found.includes(g.ayah)) return;
        const gy = g.y + Math.sin(this.t * 1.7 + i * 1.3) * 5;
        const d = Math.hypot(this.player.x - g.x, this.player.y - 16 - gy);
        const gs = this.gemStates[i];
        gs.no = Math.max(0, (gs.no || 0) - dt);
        if (this.recall) {
          // veiled: coming close makes it speak its ayah — the only clue
          if (d < 165 && !gs.near) {
            gs.near = true;
            gs.pulse = 1;
            GOL.audio.playVerse(L.surahId, g.ayah, null);
            this.fx.spawn('ring', g.x, gy, { color: '#FFE9A8', size: 24 });
          } else if (d > 260) gs.near = false;
          gs.pulse = Math.max(0, (gs.pulse || 0) - dt * 0.5);
          if (Math.random() < dt * 1.2) this.fx.spawn('sparkle', g.x + GOL.rnd(-14, 14), gy + GOL.rnd(-16, 16), { color: '#FFF6DC' });
          if (d < 40) {
            if (g.ayah === nextAyah) this.collect(g, i, W, H);
            else if (!gs.noCd || this.t > gs.noCd) {
              // not yet — it slips back into its light, unbothered
              gs.noCd = this.t + 1.4;
              gs.no = 1;
              GOL.audio.sfx('drift');
              this.nudgeT = 2.6;
              if (this.t > (this._voiceNudgeAt || 0)) {
                this._voiceNudgeAt = this.t + 9; // gentle, not naggy
                GOL.audio.speak('ui-not-yet');
              }
            }
          }
        } else {
          if (d < 250 && !gs.near) {
            gs.near = true;
            GOL.audio.sfx('nearby');
            this.fx.spawn('ring', g.x, gy, { color: GOL.GEMS[(g.ayah - 1) % 7].glow, size: 22 });
          } else if (d > 330) gs.near = false;
          if (Math.random() < dt * 2) this.fx.spawn('sparkle', g.x + GOL.rnd(-14, 14), gy + GOL.rnd(-16, 16), { color: GOL.GEMS[(g.ayah - 1) % 7].light });
          if (d < 40) this.collect(g, i, W, H);
        }
      });
      this.nudgeT = Math.max(0, this.nudgeT - dt);

      // the arch: opens only when every gem is found
      const allFound = this.found.length === L.gems.length;
      if (allFound) {
        this.archPulseT += dt;
        const d = Math.abs(this.player.x - L.arch.x);
        if (d < 54 && this.player.grounded && Math.abs(this.player.y - L.arch.y) < 60) {
          // a Star Walk arrives already in order — straight to the ceremony
          GOL.go('gate', { index: L.index, seeds: this.seedCount, recall: this.recall, prePlaced: this.recall });
          return;
        }
      }
    },

    // Noor the firefly. It keeps the child company; when they idle a while
    // with gems still hidden, it drifts toward the nearest one and pulses.
    updateFirefly(dt) {
      const f = this.fly, pl = this.player, L = this.L;
      f.t += dt;
      let unfound = null, best = 1e9;
      for (const g of L.gems) {
        if (this.found.includes(g.ayah)) continue;
        const d = Math.hypot(g.x - pl.x, g.y - pl.y);
        if (d < best) { best = d; unfound = g; }
      }
      const lost = pl.idleT > 4.5 && unfound;
      if (lost && f.mode !== 'guide') { f.mode = 'guide'; f.pulseT = 0; }
      else if (!lost && f.mode === 'guide' && pl.moving) f.mode = 'follow';

      let tx, ty;
      if (f.mode === 'guide' && unfound) {
        // fly toward the hidden gem (as far as it can while staying seen)
        const maxLead = 430;
        const dx = unfound.x - pl.x, dy = (unfound.y - 30) - (pl.y - 40);
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, maxLead / d);
        tx = pl.x + dx * k;
        ty = pl.y - 40 + dy * k;
        f.pulseT += dt;
        if (f.pulseT > 0.9) {
          f.pulseT = 0;
          this.fx.spawn('ring', f.x, f.y, { color: '#FFE9A8', size: 10 });
        }
      } else {
        // hover just behind the wanderer's shoulder
        tx = pl.x - pl.facing * 34 + Math.sin(f.t * 1.3) * 10;
        ty = pl.y - 58 + Math.sin(f.t * 2.1) * 8;
      }
      const spring = f.mode === 'guide' ? 2.2 : 3.4;
      f.vx += (tx - f.x) * spring * dt - f.vx * 2.6 * dt;
      f.vy += (ty - f.y) * spring * dt - f.vy * 2.6 * dt;
      f.x += f.vx * dt * 3.2;
      f.y += f.vy * dt * 3.2;
      if (f.mode === 'guide' && Math.random() < dt * 6) {
        this.fx.spawn('sparkle', f.x + GOL.rnd(-4, 4), f.y + GOL.rnd(-4, 4), { color: '#FFE9A8' });
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

      // debug speed run: no card, no recitation, no echo — just the sparkle
      if (GOL.DEBUG) {
        GOL.audio.chime((g.ayah - 1) % 8, { short: true });
        this.fx.burst(g.x, g.y, C.base, 10);
        return;
      }

      const sx = (g.x - this.cam.x) * this.scale;
      const sy = (g.y - this.cam.y) * this.scale;
      this.overlay = {
        phase: 'fly', t: 0, gem: g, C,
        fromX: sx, fromY: sy,
        verse: this.L.surah.verses.find((v) => v.n === g.ayah),
        audioDone: false, minT: 0,
        echo: this.firstLearn, echoReplayed: false
      };
      GOL.audio.chime((g.ayah - 1) % 8);
      this.fx.burst(g.x, g.y, C.base, 16);
      this.player.vx = 0;
    },

    // debug helpers (the G and E keys): sweep up every gem, warp to the arch
    debugCollectAll() {
      const L = this.L;
      const st = GOL.store.level(L.surahId);
      st.found = st.found || [];
      for (const v of L.surah.verses) {
        if (this.found.includes(v.n)) continue;
        this.found.push(v.n);
        if (!st.found.includes(v.n)) st.found.push(v.n);
      }
      st.found.sort((a, b) => a - b);
      GOL.store.save();
      GOL.audio.chime(7, { short: true });
      for (const g of L.gems) this.fx.burst(g.x, g.y, GOL.GEMS[(g.ayah - 1) % 7].base, 6);
    },
    debugWarpArch() {
      const pl = this.player, L = this.L;
      pl.x = L.arch.x - 30;
      pl.y = L.arch.y;
      pl.vx = 0; pl.vy = 0;
      pl.grounded = true;
      pl.rescue = null;
      pl.lastSafe = { x: pl.x, y: pl.y };
      if (this.cam) {
        this.cam.x = Math.max(0, Math.min(L.w * TILE - this.cam.viewW, pl.x - this.cam.viewW / 2));
        this.cam.y = Math.max(-140, Math.min(L.h * TILE - this.cam.viewH + 8, pl.y - this.cam.viewH * 0.62));
      }
    },

    _endEcho(o) {
      o.phase = 'settle';
      o.t = 0;
      const st = GOL.store.level(this.L.surahId);
      st.echoes++;
      GOL.store.save();
      GOL.audio.sfx('praise');
      GOL.audio.sfx('settle');
    },

    updateOverlay(dt, W, H) {
      const o = this.overlay;
      o.t += dt;
      if (o.phase === 'fly' && o.t > 0.75) {
        o.phase = 'recite';
        o.t = 0;
        GOL.audio.playVerse(this.L.surahId, o.gem.ayah, () => { o.audioDone = true; });
      } else if (o.phase === 'recite') {
        const next = () => {
          if (o.echo) {
            o.phase = 'echo'; o.t = 0;
            GOL.audio.sfx('yourTurn');
            GOL.audio.speak('ui-your-turn');
          } else {
            o.phase = 'settle'; o.t = 0;
            GOL.audio.sfx('settle');
          }
        };
        if (o.audioDone && o.t > 1.6) next();
        // let an impatient replayer skip ahead once the words have landed
        for (const tap of GOL.Input.taps) {
          if (!tap.ui && o.t > 1.2) {
            tap.ui = true;
            GOL.audio.stopRecitation();
            next();
            break;
          }
        }
      } else if (o.phase === 'echo') {
        // the child's turn: say it out loud. Tapping the gem plays it once
        // more ("together!"); any other tap (or patience) carries on.
        const cx = W / 2, cy = H * 0.3;
        for (const tap of GOL.Input.taps) {
          if (tap.ui) continue;
          tap.ui = true;
          if (GOL.dist(tap.x, tap.y, cx, cy) < 70 && !o.echoReplayed) {
            o.echoReplayed = true;
            o.togetherUntil = o.t + 0.1;
            GOL.audio.playVerse(this.L.surahId, o.gem.ayah, () => { o.togetherDone = true; });
          } else if (o.t > 0.8 && (!o.echoReplayed || o.togetherDone)) {
            this._endEcho(o);
            break;
          }
        }
        if (o.phase !== 'echo') return;
        const waitFor = o.echoReplayed && !o.togetherDone ? 30 : 5.2;
        if (o.t > waitFor) this._endEcho(o);
      } else if (o.phase === 'settle' && o.t > 0.7) {
        this.overlay = null;
      }
    },

    // -------------------------------------------------------------- draw --
    draw(ctx, W, H) {
      const L = this.L, t = this.t, cam = this.cam || { x: 0, y: 0 };
      // drifting light: the palette walks from P to endP as the child goes
      // east (falaq's dawn, qadr's nightfall, alaq's revelation morning)
      let P = this.P, dawnK = 0;
      if (this.endP) {
        dawnK = Math.min(1, Math.max(0, (this.player ? this.player.x : 0) / (L.w * TILE) * 1.25));
        P = GOL.lerpPal(this.P, this.endP, dawnK);
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
      }

      // bounce blossoms
      for (const p of this.pads) {
        if (p.x < cam.x - 120 || p.x > cam.x + cam.viewW + 120) continue;
        GOL.drawBounceBlossom(ctx, p.x, p.y, t, p.squish);
      }
      // drifting leaves
      for (const m of this.movers) {
        GOL.drawDriftLeaf(ctx, m.x, m.y, m.hw, t, m.phase, m.dip);
      }
      // noor seeds
      for (const s of this.seeds) {
        if (s.taken || s.x < cam.x - 60 || s.x > cam.x + cam.viewW + 60) continue;
        GOL.drawSeed(ctx, s.x, s.y + Math.sin(t * 2.1 + s.phase) * 3, t, s.phase);
      }
      // the hidden Rahma blossom
      if (this.blossomState && !this.blossomState.taken) {
        const B = this.blossomState;
        if (B.x > cam.x - 90 && B.x < cam.x + cam.viewW + 90) {
          GOL.drawRahmaBlossom(ctx, B.x, B.y + Math.sin(t * 1.4) * 4, 13, t);
        }
      }

      // gems, then the waterfalls that sometimes veil them
      L.gems.forEach((g, i) => {
        if (this.found.includes(g.ayah)) return;
        const gs = this.gemStates[i];
        const wob = (gs && gs.no ? Math.sin(t * 26) * 4 * gs.no : 0);
        const gy = g.y + Math.sin(t * 1.7 + i * 1.3) * 5;
        if (this.recall) {
          GOL.drawVeiledGem(ctx, g.x + wob, gy, 15, t, i * 1.7, gs ? gs.pulse || 0 : 0, gs ? gs.near : false);
        } else {
          GOL.drawGem(ctx, g.x + wob, gy, 15, GOL.GEMS[(g.ayah - 1) % 7], t, { phase: i * 1.7 });
        }
      });
      for (const wf of L.waterfalls) GOL.drawWaterfall(ctx, wf.x, wf.y, 34, wf.h, t, P);

      // the wanderer
      const pl = this.player;
      if (pl) {
        GOL.drawSprite(ctx, pl.x, pl.y, {
          vx: pl.vx, vy: pl.vy, grounded: pl.grounded, facing: pl.facing,
          t: pl.t, idleT: pl.idleT, blink: pl.blink,
          squashX: pl.squashX, squashY: pl.squashY, moving: pl.moving
        });
      }
      // Noor the firefly, always nearby
      if (this.fly) GOL.drawFirefly(ctx, this.fly.x, this.fly.y, this.t + 2, this.fly.mode === 'guide' ? 1.25 : 1);
      this.fx.draw(ctx);
      ctx.restore();

      // Al-Falaq's lingering night, thinning toward the east
      if (L.key === 'falaq' && dawnK < 1) {
        ctx.fillStyle = alpha('#25333E', 0.26 * (1 - dawnK));
        ctx.fillRect(0, 0, W, H);
      }
      // Al-Qadr: the blessed night gathers — stars strengthen toward the arch
      if (L.key === 'qadr' && dawnK > 0.2 && !this.recall) {
        const sk = (dawnK - 0.2) / 0.8;
        ctx.fillStyle = alpha('#1E2B48', 0.14 * sk);
        ctx.fillRect(0, 0, W, H);
        const r = GOL.rng(53);
        for (let i = 0; i < 30; i++) {
          const sx = ((r() * 1.3 * W - cam.x * 0.05) % (W + 40) + W + 40) % (W + 40) - 20;
          const sy = r() * H * 0.4;
          const tw = 0.5 + 0.5 * Math.sin(t * (0.8 + r()) + i * 1.9);
          ctx.fillStyle = alpha('#FFF6DC', (0.15 + 0.5 * tw) * sk);
          ctx.beginPath(); ctx.arc(sx, sy, 0.8 + r() * 1.3, 0, Math.PI * 2); ctx.fill();
        }
      }
      // Star Walks happen in the hush of early evening
      if (this.recall) {
        ctx.fillStyle = alpha('#2E3B58', 0.16);
        ctx.fillRect(0, 0, W, H);
        const r = GOL.rng(77);
        for (let i = 0; i < 24; i++) {
          const sx = ((r() * 1.3 * W - cam.x * 0.04) % (W + 40) + W + 40) % (W + 40) - 20;
          const sy = r() * H * 0.34;
          const tw = 0.5 + 0.5 * Math.sin(t * (1 + r()) + i * 2.2);
          ctx.fillStyle = alpha('#FFF6DC', 0.25 + 0.45 * tw);
          ctx.beginPath(); ctx.arc(sx, sy, 1 + r() * 1.2, 0, Math.PI * 2); ctx.fill();
        }
      }

      // ---- interface
      const band = GOL.drawHudBand(ctx, W / 2, 14, L.gems.length, this.found.map((a) => a - 1), t, W - 200);
      this._band = band;
      // Star Walk: the next place in the surah glows, asking to be filled
      if (this.recall && this.found.length < L.gems.length) {
        const ni = this.found.length;
        ctx.strokeStyle = alpha('#FFE9A8', 0.55 + 0.4 * Math.sin(t * 3.2));
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(band.slotX(ni), band.slotY, 14 + Math.sin(t * 3.2) * 1.5, 0, Math.PI * 2);
        ctx.stroke();
        if (this.nudgeT > 0) {
          ctx.globalAlpha = Math.min(1, this.nudgeT);
          GOL.text(ctx, 'not yet — listen for ayah ' + (ni + 1), W / 2, 86, { size: 15.5, weight: '700', color: 'rgba(255,251,238,0.9)' });
          ctx.globalAlpha = 1;
        }
      }
      for (const b of this.buttons || []) {
        if (b.iconName === 'pause' || b.icon) GOL.drawButton(ctx, b.x, b.y, 22, b.icon ? b.icon() : b.iconName);
      }
      // gathered light: a little seed tally under the pause button
      if (this.seedCount > 0) {
        ctx.save();
        ctx.globalAlpha = 0.92;
        GOL.drawPanel(ctx, 16, 76, 86, 36, { radius: 18, plain: true, alpha: 0.7 });
        GOL.drawSeed(ctx, 38, 94, t, 0.5);
        GOL.text(ctx, '× ' + this.seedCount, 66, 95, { size: 15, weight: '800', color: GOL.GOLD });
        ctx.restore();
      }
      // a gentle toast (the Rahma blossom)
      if (this.toast) {
        const T = this.toast;
        const k = Math.min(1, T.t / 0.4) * Math.min(1, (T.dur - T.t) / 0.5);
        ctx.globalAlpha = Math.max(0, k);
        const tw = 470;
        GOL.drawPanel(ctx, W / 2 - tw / 2, H * 0.72, tw, T.sub ? 76 : 54, { radius: 20 });
        GOL.drawRahmaBlossom(ctx, W / 2 - tw / 2 + 38, H * 0.72 + (T.sub ? 38 : 27), 11, t);
        GOL.text(ctx, T.text, W / 2 + 16, H * 0.72 + 28, { size: 16.5, weight: '800' });
        if (T.sub) GOL.text(ctx, T.sub, W / 2 + 16, H * 0.72 + 53, { size: 13, weight: '600', color: GOL.INK_SOFT });
        ctx.globalAlpha = 1;
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
        GOL.text(ctx, this.recall ? 'Star Walk — gather the ayat in order' : this.L.title + ' — ' + this.L.subtitle, W / 2, H * 0.16 + 74, { size: 15, weight: '600', color: this.recall ? GOL.GOLD : GOL.INK_SOFT });
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
        stepStone: () => S.stepStone[p.v % 2],
        fruit: () => S.fruit[p.v % 3], palm: () => S.palm[p.v % 2],
        column: () => S.column[p.v % 2]
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
      if (o.phase === 'recite' || o.phase === 'echo') {
        const k = Math.min(1, o.t / 0.4);
        ctx.globalAlpha = o.phase === 'recite' ? k : 1;
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
      // the echo moment: the garden listens while the child says it aloud
      if (o.phase === 'echo') {
        const saying = o.echoReplayed && !o.togetherDone;
        const pulse = 0.5 + 0.5 * Math.sin(this.t * 3.4);
        // listening rings breathing out of the gem
        for (let i = 0; i < 3; i++) {
          const rk = ((this.t * 0.5 + i / 3) % 1);
          ctx.strokeStyle = alpha('#FFE9A8', 0.38 * (1 - rk));
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(gx, gy, gr + 12 + rk * 54, 0, Math.PI * 2);
          ctx.stroke();
        }
        GOL.text(ctx, saying ? 'say it together!' : 'your turn — say it out loud', cx, cy - 66,
          { size: 23, weight: '800', color: alpha('#FFFBEE', 0.75 + 0.25 * pulse) });
        GOL.text(ctx, saying ? '' : 'tap the gem to hear it once more', cx, cy - 38,
          { size: 14, weight: '600', color: alpha('#FFFBEE', 0.55) });
      }
      GOL.drawGem(ctx, gx, gy, gr + (o.phase === 'echo' ? Math.sin(this.t * 3.4) * 2.5 : 0), o.C, this.t, { phase: 2 });
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
