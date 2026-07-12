// Gems of Light v3 — adventure.js
// The playable world: wander, jump, find Ayah Gems. No cards, no rituals,
// no instructions — the ayah recites as its gem joins the child's orbit and
// the world visibly warms. When every gem is found, the campfire calls; the
// child sits, and the whole surah is heard once. Then the shrine door opens.
(function () {
  const GOL = window.GOL;
  const TILE = GOL.TILE;
  const { alpha, mix } = GOL.color;

  const adventure = {
    t: 0, L: null, P: null, endP: null, atlas: null, strips: null, strips2: null,
    sprites: null, player: null, cam: null, fx: null,
    found: [], paused: false, escDown: false, scale: 1,
    stoneTiles: null, waterRects: null, terrain: null,
    seeds: null, seedCount: 0, seedChain: 0, seedChainT: 0,
    pads: null, movers: null, blossomState: null, fly: null,
    orbit: null, restoreK: 0, glowAr: null, echoT: 0,
    phase: 'roam', fireT: 0, doorK: 0, reciteI: -1,

    enter(params) {
      const def = params.world ? GOL.WORLDS3[params.world - 1]
        : GOL.PROTOTYPES[params.proto || GOL.V3.proto];
      this.worldN = params.world || null;
      const L = (this.L = GOL.buildPrototype(def));
      this.t = 0;
      this.paused = false;
      this.found = [];
      this.orbit = [];
      this.fx = GOL.makeFx();
      this.phase = 'roam';
      this.fireT = 0;
      this.doorK = 0;
      this.reciteI = -1;
      this.restoreK = 0;
      this.glowAr = null;
      this.echoT = 5; // let the garden breathe before the first echo

      this.seeds = L.seeds.map((s, i) => ({ x: s.x, y: s.y, taken: false, phase: i * 0.9 }));
      this.seedCount = 0;
      this.seedChain = 0;
      this.seedChainT = 0;
      this.pads = L.pads.map((p) => ({ x: p.x, y: p.y, squish: 0, sqV: 0 }));
      this.movers = L.moverDefs.map((m) => {
        if (m.kind === 'h') return { kind: 'h', x0: m.x0, x1: m.x1, x: (m.x0 + m.x1) / 2, y: m.y, hw: m.hw, speed: m.speed, phase: m.phase, dx: 0, dip: 0, t: 0 };
        if (m.kind === 'raft') return { kind: 'raft', x0: m.x0, x1: m.x1, x: m.x0, y: m.y, hw: m.hw, speed: m.speed, dx: 0, dip: 0, t: 0 };
        return { kind: 'v', x: m.x, y0: m.y0, y1: m.y1, y: (m.y0 + m.y1) / 2, hw: m.hw, speed: m.speed, phase: m.phase, dx: 0, dip: 0, t: 0 };
      });
      // foreground curtains that soften when the wanderer steps behind them
      this.occs = (L.occluders || []).map((o) => ({ o, fade: 1 }));
      L.movers = this.movers;
      const stPre = GOL.store.level(L.surahId);
      this.blossomState = L.blossom ? { x: L.blossom.x, y: L.blossom.y, taken: false, everFound: stPre.blossom } : null;
      this.fly = { x: L.start.x - 40, y: L.start.y - 90, vx: 0, vy: 0, mode: 'follow', pulseT: 0, t: Math.random() * 7 };

      // palettes: the world warms as gems are found (restoration-driven),
      // not as the child walks east
      this.P = GOL.PALETTES[L.palette];
      this.endP = L.endPalette ? GOL.PALETTES[L.endPalette] : null;
      const tilePal = this.endP ? GOL.lerpPal(this.P, this.endP, 0.5) : this.P;
      this.atlas = GOL.buildTileAtlas(tilePal, 7 + L.id * 13);
      this.sprites = GOL.buildPropSprites(tilePal, 31 + L.id * 7);
      const mkStrips = (P, s) => ({
        far: GOL.buildHillStrip(1400, 260, { seed: s + 1, base: 150, amp: 40, color: P.hillFar, mist: P.mist, trees: 11, treeColor: GOL.color.shade(P.hillFar, 0.22) }),
        mid: GOL.buildHillStrip(1150, 230, { seed: s + 2, base: 118, amp: 50, color: P.hillMid, mist: P.mist, trees: 8, treeColor: GOL.color.shade(P.hillMid, 0.2) }),
        near: GOL.buildHillStrip(950, 205, { seed: s + 3, base: 90, amp: 46, color: P.hillNear, mist: P.mist, trees: 0 })
      });
      this.strips = mkStrips(this.P, 100 + L.id * 11);
      this.strips2 = this.endP ? mkStrips(this.endP, 100 + L.id * 11) : null;

      this.stoneTiles = new Set();
      for (const p of L.props) {
        if (p.type === 'stepStone') this.stoneTiles.add(Math.floor(p.x / TILE) + ',' + Math.floor(p.y / TILE));
      }

      // pre-compose all terrain once (same painting pass as v1)
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
      this.gemStates = L.gems.map(() => ({ near: false }));
      this.cam = null;

      const st = GOL.store.level(L.surahId);
      st.lastPlayed = Date.now();
      GOL.store.save();
      GOL.stamp('v3walkStart');

      GOL.audio.preloadSurah(L.surah);
      GOL.audio.startAmbience('garden');
      GOL.audio.enterFlourish();
    },

    exit() {
      GOL.Input.zones = null;
      GOL.audio.stopRecitation();
      GOL.audio.setWaterNearness(0);
      if (this.L) this.L.movers = null;
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
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
      this.scale = H / (GOL.V3.rows * TILE);
      const viewW = W / this.scale, viewH = H / this.scale;
      if (!this.cam) {
        this.cam = GOL.makeCamera(L, viewW, viewH);
        this.cam.x = Math.max(0, this.player.x - viewW / 2);
        this.cam.y = L.h * TILE - viewH;
      }
      this.cam.viewW = viewW; this.cam.viewH = viewH;

      const esc = !!GOL.Input._keys['Escape'];
      if (esc && !this.escDown) this.paused = !this.paused;
      this.escDown = esc;

      this.buttons = [
        { x: 40 + sa.l, y: 40 + sa.t * 0.5, r: 30, iconName: 'pause', fn: () => (this.paused = !this.paused) },
        Object.assign({}, GOL.muteButton(W))
      ];
      if (this.paused) {
        this.buttons = [
          { x: W / 2 - 90, y: H / 2 + 30, r: 34, iconName: 'play', fn: () => (this.paused = false) },
          { x: W / 2, y: H / 2 + 30, r: 34, iconName: 'back', fn: () => GOL.go('title') },
          { x: W / 2 + 90, y: H / 2 + 30, r: 34, icon: () => (GOL.store.data.settings.muted ? 'soundOff' : 'sound'), fn: GOL.muteButton(W).fn }
        ];
        GOL.hitButtons(GOL.Input.taps, this.buttons);
        return;
      }
      GOL.hitButtons(GOL.Input.taps, this.buttons);

      // the world's dawn follows the child's gathering, gently
      const targetK = L.gems.length ? this.found.length / L.gems.length : 0;
      this.restoreK += (targetK - this.restoreK) * Math.min(1, dt * 0.55);

      // the Arabic of the last-found ayah, glowing in the air
      if (this.glowAr) {
        this.glowAr.t += dt;
        if (this.glowAr.t > this.glowAr.dur) this.glowAr = null;
      }

      // campfire and beyond -------------------------------------------------
      if (this.phase !== 'roam') { this.updateCampfire(dt, W, H); return; }

      // input → movement (thumbstick + jump button, hugging the safe areas)
      GOL.Input.zones = GOL.touchZones(W, H);
      GOL.Input.poll(W, H);
      GOL.Input.routeTapsToJump();

      for (const m of this.movers) {
        m.t += dt;
        if (m.kind === 'h') {
          const mid = (m.x0 + m.x1) / 2, amp = (m.x1 - m.x0) / 2;
          const nx = mid + Math.sin(m.t * m.speed * Math.PI * 2 + m.phase) * amp;
          m.dx = nx - m.x;
          m.x = nx;
        } else if (m.kind === 'raft') {
          // a ferry: steady drift bank to bank, turning gently at each end
          m.dir = m.dir || 1;
          let nx = m.x + m.speed * dt * m.dir;
          if (nx > m.x1) { nx = m.x1; m.dir = -1; m.dip = 0.6; }
          else if (nx < m.x0) { nx = m.x0; m.dir = 1; m.dip = 0.6; }
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

      const pl = this.player;
      for (const p of this.pads) {
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
      this.updateOrbit(dt);

      // noor seeds
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

      // the hidden Rahma blossom — a wordless little fanfare
      const B = this.blossomState;
      if (B && !B.taken) {
        if (Math.abs(pl.x - B.x) < 44 && Math.abs(pl.y - 16 - B.y) < 48) {
          B.taken = true;
          const st = GOL.store.level(L.surahId);
          st.blossom = true;
          GOL.store.save();
          GOL.audio.sfx('blossom');
          this.fx.burst(B.x, B.y, '#F0C878', 26);
          this.fx.spawn('ring', B.x, B.y, { color: '#FFE9A8', size: 30 });
        }
      }

      this.updateFirefly(dt);

      if (Math.random() < dt * 2.2) {
        this.fx.spawn('mote', this.cam.x + Math.random() * viewW, this.cam.y + Math.random() * viewH * 0.7, {});
      }
      if (Math.random() < dt * 0.4) {
        this.fx.spawn('leaf', this.cam.x + Math.random() * viewW, this.cam.y - 10, { color: mix(this.P.leafLight, this.P.leaf, Math.random()) });
      }
      // rain thins as the world is restored — the storm gives way to sunrise
      if (L.weather === 'rain') {
        const strength = 1 - this.restoreK;
        for (let i = 0; i < 2; i++) {
          if (strength > 0.03 && Math.random() < dt * 70 * strength) {
            this.fx.spawn('rain', this.cam.x + Math.random() * (viewW + 120) - 40, this.cam.y - 10, {});
          }
        }
      }

      let nearWater = 0;
      for (const w of this.waterRects) {
        const dx = Math.max(w.x - pl.x, 0, pl.x - (w.x + w.w));
        nearWater = Math.max(nearWater, 1 - Math.min(1, dx / 420));
      }
      for (const wf of L.waterfalls) {
        const dx = Math.abs(wf.x - pl.x);
        nearWater = Math.max(nearWater, 1 - Math.min(1, dx / 380));
      }
      GOL.audio.setWaterNearness(nearWater);

      // gems wake in surah order: only the next ayah's gem is alight and
      // collectable; the ones after it sleep dimly, waiting their turn.
      // Touching a sleeping gem just sways it — no sound of blame.
      const nextAyah = this.found.length + 1;
      L.gems.forEach((g, i) => {
        if (this.found.includes(g.ayah)) return;
        const gy = g.y + Math.sin(this.t * 1.7 + i * 1.3) * 5;
        const d = Math.hypot(pl.x - g.x, pl.y - 16 - gy);
        const gs = this.gemStates[i];
        gs.no = Math.max(0, (gs.no || 0) - dt);
        if (g.ayah === nextAyah) {
          if (d < 250 && !gs.near) {
            gs.near = true;
            GOL.audio.sfx('nearby');
            this.fx.spawn('ring', g.x, gy, { color: GOL.GEMS[(g.ayah - 1) % 7].glow, size: 22 });
          } else if (d > 330) gs.near = false;
          if (Math.random() < dt * 2) this.fx.spawn('sparkle', g.x + GOL.rnd(-14, 14), gy + GOL.rnd(-16, 16), { color: GOL.GEMS[(g.ayah - 1) % 7].light });
          if (d < 44) this.collect(g, i);
        } else if (d < 44 && (!gs.noCd || this.t > gs.noCd)) {
          gs.noCd = this.t + 1.6;
          gs.no = 1;
          GOL.audio.sfx('drift');
        }
      });

      // ambient echo: the world softly calls toward an uncollected gem
      this.updateEcho(dt);

      // all found → the campfire begins to call
      if (this.found.length === L.gems.length && L.campfire) {
        if (Math.random() < dt * 6) {
          this.fx.spawn('sparkle', L.campfire.x + GOL.rnd(-26, 26), L.campfire.y - GOL.rnd(6, 60), { color: '#FFD9A0' });
        }
        const d = Math.abs(pl.x - L.campfire.x);
        if (d < 60 && pl.grounded && Math.abs(pl.y - L.campfire.y) < 60) {
          this.phase = 'settle';
          this.fireT = 0;
          GOL.Input.zones = null;
          // the gathered ayat leave the band and come to sit with the child
          this.orbit = this.found.slice().sort((a, b) => a - b).map((ayah, i) => ({
            ayah, C: GOL.GEMS[(ayah - 1) % 7],
            x: pl.x + GOL.rnd(-30, 30), y: pl.y - 140,
            join: 0, angle: (i / this.found.length) * Math.PI * 2
          }));
          GOL.stamp('v3campfire');
        }
      }
    },

    // The ambient echo. Modes: 'off' | 'near' (only when wandering close to a
    // hidden gem) | 'world' (periodic, wherever the child is, quieter with
    // distance). Never interrupts a recitation; long, gentle cooldowns.
    updateEcho(dt) {
      const mode = GOL.V3.echo;
      if (mode === 'off' || GOL.audio.reciting) return;
      this.echoT -= dt;
      if (this.echoT > 0) return;
      const pl = this.player;
      // the world only ever calls toward the NEXT ayah's gem
      const nextA = this.found.length + 1;
      const best = this.L.gems.find((g) => g.ayah === nextA);
      if (!best) return;
      const bd = Math.hypot(best.x - pl.x, best.y - pl.y);
      if (mode === 'near' && bd > 340) { this.echoT = 1.2; return; } // keep checking softly
      const vol = mode === 'near'
        ? 0.34 - 0.16 * Math.min(1, bd / 340)
        : Math.max(0.1, 0.3 - 0.2 * Math.min(1, bd / 1200));
      const h = GOL.audio.echoVerse(this.L.surahId, best.ayah, vol);
      if (h) {
        this.echoT = GOL.V3.echoEvery + GOL.rnd(0, 4);
        this.fx.spawn('ring', best.x, best.y, { color: '#FFF6DC', size: 18 });
      } else this.echoT = 2;
    },

    collect(g, i) {
      const C = GOL.GEMS[(g.ayah - 1) % 7];
      this.found.push(g.ayah);
      const st = GOL.store.level(this.L.surahId);
      st.found = st.found || [];
      if (!st.found.includes(g.ayah)) { st.found.push(g.ayah); st.found.sort((a, b) => a - b); }
      GOL.store.save();

      GOL.audio.chime((g.ayah - 1) % 8);
      this.fx.burst(g.x, g.y, C.base, 16);
      this.fx.spawn('ring', g.x, g.y, { color: C.glow, size: 26 });

      // the gem flies home to the band — a trail of light marks the way
      for (let k = 0; k < 8; k++) this.fx.spawn('trail', g.x + GOL.rnd(-8, 8), g.y + GOL.rnd(-8, 8), { color: C.base });

      // the world answers: flowers wake where the gem stood
      this.bloomAround(g.x);

      if (GOL.DEBUG) return; // speed runs skip the recitation
      GOL.audio.playVerse(this.L.surahId, g.ayah, null);
      const verse = this.L.surah.verses.find((v) => v.n === g.ayah);
      if (verse && GOL.V3.arabic) this.glowAr = { text: verse.ar, t: 0, dur: 5.2 };
    },

    // restoration: a few flowers and a butterfly bloom near a found gem's home
    bloomAround(x) {
      const L = this.L;
      const tx = Math.floor(x / TILE);
      let planted = 0;
      for (const dx of [-2, -1, 1, 2, 3]) {
        const cx = tx + dx;
        if (cx < 1 || cx >= L.w - 1) continue;
        const s = L.surface(cx);
        if (s >= L.h) continue;
        if (planted < 3 && Math.random() < 0.8) {
          L.props.push({ type: 'flowers', x: (cx + 0.5) * TILE, y: s * TILE, v: Math.floor(Math.random() * 3), born: this.t });
          this.fx.spawn('ring', (cx + 0.5) * TILE, s * TILE - 8, { color: '#F5B8C4', size: 10 });
          planted++;
        }
      }
      const s = L.surface(tx);
      if (s < L.h) {
        L.creatures.push({
          type: 'butterfly', x: x, y: (s - 2.4) * TILE, homeX: x, homeY: (s - 2.4) * TILE,
          phase: Math.random() * 7, t: 0, colA: ['#F0C878', '#E8896B', '#C9A8E0'][Math.floor(Math.random() * 3)], colB: '#F7EFDA'
        });
      }
      GOL.audio.sfx('bloom');
    },

    updateOrbit(dt) {
      const pl = this.player;
      const camp = this.phase !== 'roam';
      const n = this.orbit.length || 1;
      this.orbit.forEach((o, i) => {
        o.join = Math.min(1, o.join + dt / 0.9);
        o.angle += dt * (camp ? 0.55 : 0.85);
        const rad = camp ? 64 : 36 + n * 1.5;
        const a = o.angle + (i / n) * Math.PI * 2;
        const tx = pl.x + Math.cos(a) * rad;
        const ty = pl.y - (camp ? 34 : 40) + Math.sin(a) * rad * 0.55;
        o.x += (tx - o.x) * Math.min(1, dt * (o.join < 1 ? 2.2 : 6));
        o.y += (ty - o.y) * Math.min(1, dt * (o.join < 1 ? 2.2 : 6));
      });
    },

    updateFirefly(dt) {
      const f = this.fly, pl = this.player, L = this.L;
      f.t += dt;
      const allFound = this.found.length === L.gems.length;
      // the firefly always knows which ayah comes next
      const nextA = this.found.length + 1;
      let unfound = null;
      for (const g of L.gems) if (g.ayah === nextA) { unfound = g; break; }
      // once everything is gathered, the firefly leads to the campfire
      const goal = unfound || (allFound && L.campfire && Math.abs(pl.x - L.campfire.x) > 90
        ? { x: L.campfire.x, y: L.campfire.y - 40 } : null);
      const lost = (pl.idleT > 4.5 && unfound) || (allFound && goal);
      if (lost && f.mode !== 'guide') { f.mode = 'guide'; f.pulseT = 0; }
      else if (!lost && f.mode === 'guide' && pl.moving && !allFound) f.mode = 'follow';

      let tx, ty;
      if (f.mode === 'guide' && goal) {
        const maxLead = 430;
        const dx = goal.x - pl.x, dy = (goal.y - 30) - (pl.y - 40);
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
        tx = pl.x - pl.facing * 34 + Math.sin(f.t * 1.3) * 10;
        ty = pl.y - 58 + Math.sin(f.t * 2.1) * 8;
      }
      const spring = f.mode === 'guide' ? 2.2 : 3.4;
      f.vx += (tx - f.x) * spring * dt - f.vx * 2.6 * dt;
      f.vy += (ty - f.y) * spring * dt - f.vy * 2.6 * dt;
      f.x += f.vx * dt * 3.2;
      f.y += f.vy * dt * 3.2;
    },

    // -------------------------------------------------- campfire sequence --
    updateCampfire(dt, W, H) {
      const L = this.L, pl = this.player;
      this.fireT += dt;
      if (this.phase !== 'ember') pl.t += dt; // the seated sprite still breathes
      this.fx.update(dt);
      this.updateOrbit(dt);
      GOL.updateCreatures(L, pl, dt, this.t);
      GOL.updateCamera(this.cam, pl, dt);

      if (this.phase === 'settle') {
        // drift to the seat, then sit
        const seatX = L.campfire.x - 34;
        pl.x += (seatX - pl.x) * Math.min(1, dt * 3);
        pl.facing = 1;
        pl.idleT += dt;
        pl.moving = false;
        pl.vx = 0;
        if (this.fireT > 1.6) {
          this.phase = 'campfire';
          this.fireT = 0;
          GOL.audio.startAmbience('quiet');
          if (GOL.DEBUG) {
            setTimeout(() => { if (this.phase === 'campfire') this.openDoor(); }, 800);
          } else {
            GOL.audio.playSurah(L.surah, {
              onVerse: (i) => { this.reciteI = i; },
              onend: () => { if (this.phase === 'campfire') this.openDoor(); }
            });
          }
        }
      } else if (this.phase === 'campfire') {
        pl.idleT += dt;
        // embers rising
        if (Math.random() < dt * 8) {
          this.fx.spawn('sparkle', L.campfire.x + GOL.rnd(-10, 10), L.campfire.y - GOL.rnd(8, 30), { color: Math.random() < 0.5 ? '#F7D98C' : '#E8896B' });
        }
      } else if (this.phase === 'ember') {
        this.doorK = Math.min(1, this.doorK + dt / 1.4);
        pl.idleT = 0;
        // wandering resumes; the door glows and waits
        GOL.Input.zones = GOL.touchZones(W, H);
        GOL.Input.poll(W, H);
        GOL.Input.routeTapsToJump();
        GOL.updatePlayer(pl, L, GOL.Input, dt, this.fx);
        if (Math.random() < dt * 8 && L.door) {
          this.fx.spawn('sparkle', L.door.x + GOL.rnd(-40, 40), L.door.y - GOL.rnd(10, 170), { color: '#FFE9A8' });
        }
        if (L.door && Math.abs(pl.x - L.door.x) < 50 && Math.abs(pl.y - L.door.y) < 60) {
          GOL.go('shrine', { proto: this.L.id, world: this.worldN });
          return;
        }
      }
    },
    openDoor() {
      this.phase = 'ember';
      this.reciteI = -1;
      this.orbit = []; // the ayat settle back into the child; the band holds them
      const st = GOL.store.level(this.L.surahId);
      st.heardFull = (st.heardFull || 0) + 1;
      GOL.store.save();
      GOL.audio.sfx('door');
      GOL.audio.startAmbience('garden');
    },

    // debug helpers: G collects everything, E warps to the campfire
    debugCollectAll() {
      for (const g of this.L.gems) {
        if (!this.found.includes(g.ayah)) this.collect(g, g.ayah - 1);
      }
    },
    debugWarp() {
      const pl = this.player, L = this.L;
      const spot = this.phase === 'ember' && L.door ? L.door : L.campfire;
      pl.x = spot.x - 70;
      pl.y = spot.y;
      pl.vx = 0; pl.vy = 0;
      pl.grounded = true;
      pl.rescue = null;
      pl.lastSafe = { x: pl.x, y: pl.y };
    },

    // -------------------------------------------------------------- draw --
    draw(ctx, W, H) {
      const L = this.L, t = this.t, cam = this.cam || { x: 0, y: 0, viewW: W, viewH: H };
      let P = this.P;
      const dawnK = this.endP ? this.restoreK : 0;
      if (this.endP) P = GOL.lerpPal(this.P, this.endP, dawnK);
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
      dstrips(this.strips, 1);
      if (this.strips2) dstrips(this.strips2, dawnK);

      // ---- world space
      ctx.save();
      ctx.scale(this.scale, this.scale);
      ctx.translate(-cam.x, -cam.y);
      {
        const sx = Math.max(0, Math.floor(cam.x) - 8);
        const sw = Math.min(this.terrain.width - sx, cam.viewW + 16);
        ctx.drawImage(this.terrain, sx, 0, sw, this.terrain.height, sx, 0, sw, this.terrain.height);
      }
      for (const w of this.waterRects) GOL.drawWater(ctx, w.x, w.y, w.w, w.h, t, P);

      // the prototype's own landmark (a great tree, lighthouse, ruin…),
      // drawn behind the props so life gathers in front of it
      if (L.drawLandmark) L.drawLandmark(ctx, t, P, L);

      for (const p of L.props) {
        if (p.x < cam.x - 220 || p.x > cam.x + cam.viewW + 220) continue;
        this.drawProp(ctx, p, t, P);
      }

      // the campfire (sleeping until every gem is found)
      if (L.campfire) this.drawCampfire(ctx, L.campfire.x, L.campfire.y, t);
      // the shrine door, revealed by the ember light
      if (L.door && this.doorK > 0) {
        GOL.drawArch(ctx, L.door.x, L.door.y, t, P, 0.18 * this.doorK + 0.06 * Math.sin(t * 1.8) * this.doorK, this.doorK * (0.5 + 0.3 * Math.sin(t * 2.2)));
      }

      for (const c of L.creatures) {
        if (c.x < cam.x - 120 || c.x > cam.x + cam.viewW + 120) continue;
        if (c.type === 'bird') GOL.drawBird(ctx, c.x, c.y, t + c.phase, P, c);
        else if (c.type === 'butterfly') GOL.drawButterfly(ctx, c.x, c.y, t, c.phase, c.colA || '#F0C878', c.colB || '#F7EFDA');
        else if (c.type === 'tortoise') GOL.drawTortoise(ctx, c.x, c.y, t + c.phase, P, c.dir);
      }

      for (const p of this.pads) {
        if (p.x < cam.x - 120 || p.x > cam.x + cam.viewW + 120) continue;
        GOL.drawBounceBlossom(ctx, p.x, p.y, t, p.squish);
      }
      for (const m of this.movers) {
        GOL.drawDriftLeaf(ctx, m.x, m.y, m.hw, t, m.phase, m.dip);
      }
      for (const s of this.seeds) {
        if (s.taken || s.x < cam.x - 60 || s.x > cam.x + cam.viewW + 60) continue;
        GOL.drawSeed(ctx, s.x, s.y + Math.sin(t * 2.1 + s.phase) * 3, t, s.phase);
      }
      if (this.blossomState && !this.blossomState.taken) {
        const B = this.blossomState;
        if (B.x > cam.x - 90 && B.x < cam.x + cam.viewW + 90) {
          GOL.drawRahmaBlossom(ctx, B.x, B.y + Math.sin(t * 1.4) * 4, 13, t);
        }
      }

      const nextA = this.found.length + 1;
      L.gems.forEach((g, i) => {
        if (this.found.includes(g.ayah)) return;
        const gs = this.gemStates[i];
        const wob = gs && gs.no ? Math.sin(t * 26) * 4 * gs.no : 0;
        const gy = g.y + Math.sin(t * 1.7 + i * 1.3) * 5;
        if (g.ayah === nextA) {
          GOL.drawGem(ctx, g.x + wob, gy, 15, GOL.GEMS[(g.ayah - 1) % 7], t, { phase: i * 1.7 });
        } else {
          // asleep until its turn in the surah
          ctx.globalAlpha = 0.5;
          GOL.drawGem(ctx, g.x + wob, gy, 11, GOL.GEMS[(g.ayah - 1) % 7], t, { phase: i * 1.7, glow: 0.15 });
          ctx.globalAlpha = 1;
        }
      });
      for (const wf of L.waterfalls) GOL.drawWaterfall(ctx, wf.x, wf.y, 34, wf.h, t, P);

      // the wanderer (seated and peaceful during the campfire)
      const pl = this.player;
      const seated = this.phase === 'settle' || this.phase === 'campfire';
      GOL.drawSprite(ctx, pl.x, pl.y, {
        vx: seated ? 0 : pl.vx, vy: pl.vy, grounded: true, facing: pl.facing,
        t: pl.t, idleT: seated ? 3.5 : pl.idleT, blink: pl.blink,
        squashX: seated ? 1.06 : pl.squashX, squashY: seated ? 0.94 : pl.squashY,
        moving: seated ? false : pl.moving
      });

      // the orbit of gathered ayat
      const n = this.orbit.length;
      this.orbit.forEach((o, i) => {
        const behind = Math.sin(o.angle + (i / Math.max(1, n)) * Math.PI * 2) < 0;
        const r = (seated || this.phase === 'campfire' ? 12 : 8) * (0.7 + 0.3 * o.join);
        const lit = this.reciteI >= 0 && this.L.surah.verses[this.reciteI] && this.L.surah.verses[this.reciteI].n === o.ayah;
        if (lit) {
          ctx.strokeStyle = alpha(o.C.glow, 0.65 + 0.3 * Math.sin(t * 4));
          ctx.lineWidth = 2.4;
          ctx.beginPath(); ctx.arc(o.x, o.y, r + 9, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = behind ? 0.72 : 1;
        GOL.drawGem(ctx, o.x, o.y, lit ? r + 3 : r, o.C, t, { phase: i * 1.3, glow: lit ? 1 : 0.55 });
        ctx.globalAlpha = 1;
      });

      if (this.fly) GOL.drawFirefly(ctx, this.fly.x, this.fly.y, this.t + 2, this.fly.mode === 'guide' ? 1.25 : 1);
      this.fx.draw(ctx);

      // foreground curtains: opaque until the wanderer steps behind them
      for (const s of this.occs || []) {
        const o = s.o;
        const inside = pl && pl.x > o.x - 26 && pl.x < o.x + o.w + 26 && pl.y > o.y - 12 && pl.y < o.y + o.h + 44;
        s.fade += ((inside ? 0.12 : 1) - s.fade) * 0.1;
        if (o.x + o.w < cam.x - 60 || o.x > cam.x + cam.viewW + 60) continue;
        ctx.save();
        ctx.globalAlpha = 0.96 * s.fade;
        ctx.fillStyle = o.color;
        GOL.roundRect(ctx, o.x, o.y, o.w, o.h, 26);
        ctx.fill();
        // a soft organic fringe so the curtain reads as foliage/rock, not UI
        const r = GOL.rng(Math.floor(o.x));
        for (let i = 0; i < o.w / 30; i++) {
          const fx = o.x + 8 + r() * (o.w - 16);
          ctx.beginPath();
          ctx.arc(fx, o.y + (r() < 0.5 ? 4 : o.h - 4), 12 + r() * 16, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.restore();

      // night thinning into dawn as the world is restored
      if (this.endP && dawnK < 1) {
        ctx.fillStyle = alpha('#25333E', 0.26 * (1 - dawnK));
        ctx.fillRect(0, 0, W, H);
      }
      // the storm's grey veil, lifting with every gem
      if (L.weather === 'rain') {
        const k = 1 - this.restoreK;
        if (k > 0.01) {
          ctx.fillStyle = alpha('#2E3B48', 0.2 * k);
          ctx.fillRect(0, 0, W, H);
        }
      }
      // campfire hush
      if (this.phase === 'settle' || this.phase === 'campfire') {
        const k = Math.min(1, this.fireT / 1.2 + (this.phase === 'campfire' ? 1 : 0));
        ctx.fillStyle = alpha('#1E2B36', 0.22 * Math.min(1, k));
        ctx.fillRect(0, 0, W, H);
      }

      // the found ayah, glowing softly in the air — script, not a card
      if (this.glowAr) {
        const g = this.glowAr;
        const k = Math.min(1, g.t / 0.6) * Math.min(1, (g.dur - g.t) / 0.9);
        ctx.globalAlpha = Math.max(0, k);
        GOL.text(ctx, g.text, W / 2, H * 0.16, { size: Math.min(30, W * 0.045), ar: true, weight: '400', color: '#FFFBEE' });
        ctx.globalAlpha = 1;
      }

      // the gem band: collected ayat resting in their star settings — the
      // wordless answer to "how many so far, how many to go"
      if (this.phase === 'roam' || this.phase === 'ember') {
        const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
        GOL.drawHudBand(ctx, W / 2, 12 + sa.t * 0.5, L.gems.length, this.found.map((a) => a - 1), t, Math.min(W - 260, 330));
      }
      for (const b of this.buttons || []) {
        if (b.iconName === 'pause' || b.icon) GOL.drawButton(ctx, b.x, b.y, 22, b.icon ? b.icon() : b.iconName);
      }
      if (GOL.Input.touchMode && this.phase !== 'settle' && this.phase !== 'campfire') {
        GOL.drawTouchControls(ctx, W, H, GOL.Input);
      }
      if (this.paused) {
        ctx.fillStyle = 'rgba(34,53,42,0.55)';
        ctx.fillRect(0, 0, W, H);
        for (const b of this.buttons) GOL.drawButton(ctx, b.x, b.y, 30, b.icon ? b.icon() : b.iconName);
      }
      GOL.drawVignette(ctx, W, H, 0.14);
    },

    drawCampfire(ctx, x, y, t) {
      const lit = this.phase !== 'roam' || this.found.length === this.L.gems.length;
      ctx.save();
      ctx.translate(x, y);
      // ring of stones
      ctx.fillStyle = '#C9BC9A';
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * 26, -3 + Math.sin(a) * 7, 6.5, 4.5, a, 0, Math.PI * 2);
        ctx.fill();
      }
      // crossed logs
      ctx.strokeStyle = '#8A6B4F';
      ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-16, -4); ctx.lineTo(14, -14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(16, -4); ctx.lineTo(-14, -14); ctx.stroke();
      if (lit) {
        // flame: three breathing tongues of light
        const fl = (w, h, c, sp, ph) => {
          const sway = Math.sin(t * sp + ph) * 3;
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.moveTo(-w, -10);
          ctx.quadraticCurveTo(-w * 0.7, -10 - h * 0.5, sway, -10 - h);
          ctx.quadraticCurveTo(w * 0.7, -10 - h * 0.5, w, -10);
          ctx.closePath();
          ctx.fill();
        };
        const glow = ctx.createRadialGradient(0, -22, 4, 0, -22, 90);
        glow.addColorStop(0, alpha('#FFD98E', 0.4 + 0.08 * Math.sin(t * 5)));
        glow.addColorStop(1, alpha('#FFD98E', 0));
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(0, -22, 90, 0, Math.PI * 2); ctx.fill();
        fl(13, 30 + Math.sin(t * 4) * 3, alpha('#E8896B', 0.85), 3.4, 0);
        fl(9, 24 + Math.sin(t * 5.2) * 3, alpha('#F7D98C', 0.9), 4.2, 1.4);
        fl(5, 16 + Math.sin(t * 6) * 2, alpha('#FFFBEA', 0.95), 5, 2.6);
      } else {
        // unlit: a quiet promise
        ctx.strokeStyle = alpha('#C9BC9A', 0.5);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, -16, 8 + Math.sin(t * 1.4) * 1.5, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    },

    drawProp(ctx, p, t, P) {
      const S = this.sprites;
      // freshly bloomed restoration flowers grow in
      let grow = 1;
      if (p.born != null) grow = Math.min(1, (t - p.born) / 1.2);
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
        if (grow < 1) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.scale(0.3 + 0.7 * grow, 0.3 + 0.7 * grow);
          ctx.globalAlpha = grow;
          ctx.drawImage(c, -c._anchor.x, -c._anchor.y);
          ctx.restore();
        } else {
          ctx.drawImage(c, p.x - c._anchor.x, p.y - c._anchor.y);
        }
      }
    }
  };
  GOL.registerScene('adventure', adventure);
})();
