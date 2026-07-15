// Gems of Light v3 — adventure.js
// The playable world: wander, jump, find Ayah Gems. No cards, no rituals,
// no instructions — the ayah recites as its gem joins the child's orbit and
// the world visibly warms. When every gem is found, the campfire calls; the
// child sits, and the whole surah is heard once. Then the shrine door opens.
(function () {
  const GOL = window.GOL;
  const TILE = GOL.TILE;
  const { alpha, mix } = GOL.color;

  const GRAND = { base: '#F0C878', light: '#FFE9A8', lighter: '#FFF6DC', dark: '#D9A44A', darker: '#B98A3E', glow: '#FFE9A8' };

  // a frozen controller: gravity still pulls, but no walk and no jump — used
  // while a collected ayah plays so the child settles and holds still
  const NEUTRAL = { left: false, right: false, jumpHeld: false, consumeJump() { return false; } };

  // Paint one ayah as a quiet RTL read-along. The complete Arabic stays
  // visible, while light travels through each word from right to left using
  // timestamps from the world's own fixed recitation. Keeping the shaping
  // inside whole words preserves Arabic ligatures and diacritics; we never
  // split the script into individual letters.
  function drawFollowAyah(ctx, g, W, H, fade) {
    const words = g.words;
    if (!words || !words.length || !g.timings || g.timings.length !== words.length) return false;

    const sa = GOL.SAFE || { l: 0, r: 0 };
    const maxW = Math.max(260, Math.min(620, W - sa.l - sa.r - 190));
    let size = Math.min(32, H * 0.082, W * 0.045);
    ctx.save();
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '400 ' + size + 'px ' + GOL.fonts.ar;
    let gap = Math.max(8, ctx.measureText(' ').width * 1.15);
    let widths = words.map((word) => ctx.measureText(word).width);
    let total = widths.reduce((sum, width) => sum + width, 0) + gap * (words.length - 1);
    if (total > maxW) {
      size = Math.max(23, size * maxW / total);
      ctx.font = '400 ' + size + 'px ' + GOL.fonts.ar;
      gap = Math.max(7, ctx.measureText(' ').width * 1.15);
      widths = words.map((word) => ctx.measureText(word).width);
      total = widths.reduce((sum, width) => sum + width, 0) + gap * (words.length - 1);
    }

    const y = H * 0.31;
    let right = W / 2 + total / 2;
    let audioTime = g.audio && g.audio.el && Number.isFinite(g.audio.el.currentTime)
      ? g.audio.el.currentTime : 0;
    if (g.scaleTimings && g.sourceDuration && g.audio && g.audio.el &&
        Number.isFinite(g.audio.el.duration) && g.audio.el.duration > 0) {
      audioTime *= g.sourceDuration / g.audio.el.duration;
    }

    // Restoration makes W1's sky very bright by its final gems. A borderless
    // dusk aura keeps delicate tashkeel legible without turning the ayah into
    // a card or panel.
    const aura = ctx.createRadialGradient(W / 2, y, 8, W / 2, y, total / 2 + 64);
    aura.addColorStop(0, 'rgba(31,48,48,0.3)');
    aura.addColorStop(0.72, 'rgba(31,48,48,0.16)');
    aura.addColorStop(1, 'rgba(31,48,48,0)');
    ctx.globalAlpha = fade;
    ctx.fillStyle = aura;
    ctx.fillRect(W / 2 - total / 2 - 70, y - size * 1.25, total + 140, size * 2.5);

    for (let i = 0; i < words.length; i++) {
      const width = widths[i];
      const cx = right - width / 2;
      const start = g.timings[i][0], end = g.timings[i][1];
      const done = audioTime >= end;
      const active = !done && audioTime >= (i === 0 ? 0 : start);

      // All words are present from the beginning, giving the eyes somewhere
      // to travel before the voice reaches them.
      ctx.globalAlpha = fade * 0.52;
      ctx.shadowColor = 'rgba(20,34,33,0.72)';
      ctx.shadowBlur = 5;
      ctx.fillStyle = '#FFFBEE';
      ctx.fillText(words[i], cx, y);

      if (active || done) {
        // A categorical color change is easier to follow than a pale partial
        // fill: berry marks the word being heard now; completed words remain
        // violet so the ayah visibly accumulates from right to left.
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.shadowColor = 'rgba(38,25,67,0.42)';
        ctx.shadowBlur = 2;
        ctx.fillStyle = active ? '#C94F73' : '#6840A8';
        ctx.fillText(words[i], cx, y);
        ctx.restore();
      }
      right -= width + gap;
    }
    ctx.restore();
    return true;
  }

  const adventure = {
    t: 0, L: null, P: null, endP: null, atlas: null, strips: null, strips2: null,
    sprites: null, player: null, cam: null, fx: null,
    found: [], paused: false, escDown: false, scale: 1,
    stoneTiles: null, waterRects: null, terrain: null,
    seeds: null, seedCount: 0, seedChain: 0, seedChainT: 0,
    pads: null, movers: null, blossomState: null, fly: null,
    orbit: null, restoreK: 0, glowAr: null, echoT: 0,
    phase: 'roam', fireT: 0, doorK: 0, reciteI: -1,
    gemPause: null, memState: null, gallopFxT: 0,
    boxes: null, orb: null, darkBuf: null,
    protoN: null, campDone: 0, campEntering: false,

    enter(params) {
      // every entry names its world now (the ten-prototype lab retired
      // 2026-07-12; GOL.PROTOTYPES stays as the registry mechanism only)
      const def = params.world ? GOL.WORLDS3[params.world - 1]
        : GOL.PROTOTYPES[params.proto];
      this.worldN = params.world || null;
      this.protoN = params.proto || null;
      const exactFollow = GOL.WORD_FOLLOW && GOL.WORD_FOLLOW[GOL.V3.reciter]
        ? GOL.WORD_FOLLOW[GOL.V3.reciter][def.surahId] : null;
      const prototypeFollow = GOL.WORD_FOLLOW && GOL.WORD_FOLLOW.basit
        ? GOL.WORD_FOLLOW.basit[def.surahId] : null;
      // Never make the experiment silently disappear because a grown-up had
      // another reciter saved. Exact tables win; otherwise the prototype's
      // Basit word map is proportionally fitted to the selected recording.
      this.ayahFollow = exactFollow || prototypeFollow;
      this.ayahFollowScaled = !exactFollow && !!prototypeFollow;
      // waking from the dream (shrine.js's memory shrine) drops the child back
      // at their own campfire, ember-lit, everything as they left it
      const resume = params.resume === 'ember';
      const checkpointResume = params.resumeCheckpoint != null;
      const returning = resume || checkpointResume;
      const L = (this.L = GOL.buildPrototype(def));
      this.storeId = L.labSaveKey || L.surahId;
      // coming back to a world whose Grand Gem is already earned pre-grows the
      // garden — the same clearing, remembered fuller, as a reward for return.
      // A dream round-trip is NOT a new visit: grow, but don't count it.
      this.applyReplayGrowth(L, returning);
      this.t = 0;
      this.paused = false;
      this.found = [];
      this.orbit = [];
      this.fx = GOL.makeFx();
      this.phase = 'roam';
      this.fireT = 0;
      this.doorK = 0;
      this.reciteI = -1;
      this.gemPause = null;
      this.campEntering = false;
      this.restoreK = 0;
      this.glowAr = null;
      this.echoT = 5; // let the garden breathe before the first echo
      this.gallopFxT = 0;

      // `lit` (0..1) is a seed's guiding-light kindling: an orb flying past
      // sets it to 1, then it slowly expires — the charted path fading behind
      // the light. Zero in daylit worlds, where it is simply never raised.
      this.seeds = L.seeds.map((s, i) => ({ x: s.x, y: s.y, taken: false, phase: i * 0.9, lit: 0 }));
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
      // guiding-light boxes: closed until the wanderer reaches them, then each
      // releases one orb of noor that kindles the path ahead. `this.orb` holds
      // the single live orb (only one flies at a time). Inert in daylit worlds.
      this.boxes = (L.lightboxes || []).map((bx) => ({ x: bx.x, y: bx.y, tx: bx.tx, open: 0, spent: false }));
      this.orb = null;
      // the memory stone, if this world remembers an earlier surah. It stays
      // 'inert' scenery through roam/settle/campfire and only 'arms' at the
      // ember phase — the deliberate, never-mid-collection redesign (PLAN §9).
      // An unaimed stone (b.memory(x) with no surah) is aimed here by the
      // journey: the completed surah whose dream is longest ago (never-
      // dreamed counts as oldest; ties fall to the earliest-learned). With
      // nothing yet completed it stays plain stone — no shimmer, no hint.
      if (L.memory && !L.memory.surahId) L.memory.surahId = this.chooseMemorySurah(L.surahId);
      this.memState = L.memory ? { phase: 'inert', dwell: 0, travel: 0, from: null, litT: 0 } : null;
      L.movers = this.movers;
      const stPre = GOL.store.level(this.storeId);
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

      // NIGHT CAMPS: only completed camp shrines survive a return. Partial
      // climbing never pretends to be learned; a lit camp is the checkpoint.
      this.campDone = 0;
      if (L.campShrines && L.campShrines.length && !resume) {
        const labGrand = GOL.store.data.grand && GOL.store.data.grand[this.storeId];
        // An explicit return belongs to THIS run and is authoritative. Stale
        // campDone from an earlier completed replay must not jump 1 → 3.
        if (checkpointResume) {
          this.campDone = Math.min(L.campShrines.length, params.resumeCheckpoint);
        } else if (labGrand) {
          if (stPre.campReplayActive) {
            this.campDone = Math.min(L.campShrines.length, stPre.campDone || 0);
          } else {
            this.campDone = 0;
            stPre.campDone = 0;
            stPre.campReplayActive = true;
            GOL.store.save();
          }
        } else {
          this.campDone = Math.min(L.campShrines.length, stPre.campDone || 0);
        }
        if (this.campDone > 0) {
          const camp = L.campShrines[this.campDone - 1];
          for (let a = 1; a <= camp.afterAyah; a++) this.found.push(a);
          this.restoreK = this.found.length / L.gems.length;
          this.player.x = (camp.x + 0.5) * TILE;
          this.player.y = camp.row * TILE;
          this.player.lastSafe = { x: this.player.x, y: this.player.y };
        }
        // Visual QA / focused design review: arrive a few steps before the
        // requested ready gate without mutating its saved checkpoint state.
        if (params.viewGate && L.campShrines[params.viewGate - 1]) {
          const i = params.viewGate - 1, camp = L.campShrines[i];
          this.campDone = i;
          this.found = [];
          for (let a = 1; a <= camp.afterAyah; a++) this.found.push(a);
          this.restoreK = this.found.length / L.gems.length;
          const side = camp.approach === 'left' ? -1 : 1;
          this.player.x = (camp.x + 0.5) * TILE + side * 88;
          this.player.y = camp.row * TILE;
          this.player.lastSafe = { x: this.player.x, y: this.player.y };
        }
      }

      if (resume) {
        // everything as the child left it: gems gathered, world restored, the
        // door aglow — seated by the campfire's ember light, dream complete
        this.found = L.gems.map((g) => g.ayah).sort((a, b) => a - b);
        this.restoreK = 1;
        this.phase = 'ember';
        this.doorK = 1;
        this.orbit = [];
        const pl = this.player;
        pl.x = L.campfire.x + 60; // the door side of the fire
        pl.y = L.campfire.y;
        pl.lastSafe = { x: pl.x, y: pl.y };
        // (cam is null — the first update snaps it onto the player)
        // STONES DISARMED (PLAN §10 verdict 2026-07-12): even ember-gated,
        // the dream doorway inside the current world read as an interruption.
        // The doorway is moving to the old world's own shrine; until then the
        // stone stays plain scenery. (Was: re-arm if the Grand Gem is held.)
      }

      const st = GOL.store.level(this.storeId);
      st.lastPlayed = Date.now();
      GOL.store.save();
      if (!returning) GOL.stamp('v3walkStart');

      GOL.audio.preloadSurah(L.surah);
      GOL.audio.startAmbience('garden');
      if (!returning) GOL.audio.enterFlourish(); // waking at a checkpoint is quiet
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
      // Height fits `rows` tile-rows; width would otherwise spill to whatever
      // the aspect ratio allows — on a 2.17:1 phone that's ~25 columns at half
      // the iPad's tile size, i.e. "zoomed out, detail lost". Cap the horizontal
      // field of view at `maxCols` columns and take the more constraining fit:
      // on a narrow iPad the height wins (unchanged); on a wide phone the width
      // wins, zooming back in to legible tiles.
      const fitH = H / (GOL.V3.rows * TILE);
      const fitW = W / ((GOL.V3.maxCols || 99) * TILE);
      this.scale = Math.max(fitH, fitW);
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
          // home, not a hardcoded title exit: entered from the map, home IS
          // the map (GOL.homeButton is overridden for the round trip)
          Object.assign({}, GOL.homeButton(), { x: W / 2, y: H / 2 + 30, r: 34 }),
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

      // the held beat after collecting a gem — the child lands, then the ayah
      if (this.gemPause) { this.updateGemPause(dt); return; }

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
      this.updateGallopFx(dt);

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
          const st = GOL.store.level(this.storeId);
          st.blossom = true;
          GOL.store.save();
          GOL.audio.sfx('blossom');
          this.fx.burst(B.x, B.y, '#F0C878', 26);
          this.fx.spawn('ring', B.x, B.y, { color: '#FFE9A8', size: 30 });
        }
      }

      // the memory stone stays INERT scenery through roam — plain, no pulse,
      // no hint, cannot wake. It only arms after this world's campfire (the
      // 'ember' phase); see updateMemoryStone. This is the fix for the parked
      // v1 mechanic, whose walk-by trigger collided mid-collection (PLAN §9).

      // the guiding light: open a box, release the orb, kindle the path
      this.updateGuideLight(dt);

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
      const pendingCamp = this.pendingCamp();
      const nextAyah = pendingCamp ? -1 : this.found.length + 1;
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

      // The ledge itself is the invitation. Until its small shrine is whole,
      // later gems remain asleep and Noor waits at the lantern with the child.
      if (pendingCamp) this.updateCampShrine(pendingCamp, dt);

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
            // updateOrbit adds the per-gem spacing; start every gem from the
            // same spin phase so even counts do not collapse into pairs.
            join: 0, angle: 0
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
      if (this.pendingCamp()) return;
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
      const st = GOL.store.level(this.storeId);
      st.found = st.found || [];
      if (!st.found.includes(g.ayah)) { st.found.push(g.ayah); st.found.sort((a, b) => a - b); }
      GOL.store.save();

      GOL.audio.chime((g.ayah - 1) % 8);
      this.fx.burst(g.x, g.y, C.base, 16);
      this.fx.spawn('ring', g.x, g.y, { color: C.glow, size: 26 });

      // the gem flies home to the band — a trail of light marks the way
      for (let k = 0; k < 8; k++) this.fx.spawn('trail', g.x + GOL.rnd(-8, 8), g.y + GOL.rnd(-8, 8), { color: C.base });

      // the world answers: flowers wake where the gem stood
      this.bloomAround(g.x, { scale: this.L.bloomScale || 1 });
      const ahead = this.L.bloomAhead;
      if (ahead && g.ayah >= ahead.from) {
        this.bloomAround(g.x, { offset: ahead.tiles, sound: false });
      }
      this.bloomBanks();
      this.runGemFx(g);

      if (GOL.DEBUG_ACCEL) return; // speed runs skip the recitation
      // A held beat for the ayah: gameplay stops so the child can settle and
      // listen. The ayah does not begin until the wanderer is back on the
      // ground (they may have leapt to reach the gem) — see updateGemPause.
      this.gemPause = { ayah: g.ayah, stage: 'land' };
    },

    // The held beat after a gem is collected. First 'land': play is frozen
    // (no walk, no jump) but gravity still carries the child down if they
    // leapt for the gem. The moment they touch ground the ayah begins and we
    // 'hold' — perfectly still, script aglow — until the recitation ends,
    // then wandering resumes. The world keeps breathing throughout.
    updateGemPause(dt) {
      const L = this.L, pl = this.player, gp = this.gemPause;
      this.fx.update(dt);
      this.updateOrbit(dt);
      GOL.updateCreatures(L, pl, dt, this.t);
      GOL.updateCamera(this.cam, pl, dt);

      if (gp.stage === 'land') {
        // let momentum bleed off and gravity settle the child, ignoring input
        GOL.updatePlayer(pl, L, NEUTRAL, dt, this.fx);
        if (pl.grounded) {
          gp.stage = 'hold';
          pl.vx = 0; pl.moving = false; pl.idleT = 0;
          // she settles: a soft halo of light blooms as her eyes close
          this.fx.spawn('ring', pl.x, pl.y - 18, { color: '#FFF3C4', size: 30 });
          for (let k = 0; k < 6; k++) this.fx.spawn('sparkle', pl.x + GOL.rnd(-16, 16), pl.y - 18 + GOL.rnd(-10, 10), { color: k % 2 ? '#FFE9A8' : '#FFF6DC' });
          const audio = GOL.audio.playVerse(this.L.surahId, gp.ayah, () => {
            if (this.gemPause !== gp) return;
            this.gemPause = null;
            // let the script fade out gently as wandering resumes
            if (this.glowAr) this.glowAr.dur = Math.min(this.glowAr.dur, this.glowAr.t + 0.9);
          });
          // dur is a ceiling only — the script really ends with the ayah above
          const verse = this.L.surah.verses.find((v) => v.n === gp.ayah);
          if (verse && GOL.V3.arabic) {
            const follow = this.ayahFollow && this.ayahFollow.verses
              ? this.ayahFollow.verses[gp.ayah] : null;
            const words = follow ? follow.map((word) => word.text) : verse.ar.trim().split(/\s+/);
            // If the timing source and canonical Quran text ever disagree,
            // fall back to the existing whole-ayah glow instead of lighting
            // the wrong word.
            const timings = follow && words.join(' ') === verse.ar
              ? follow.map((word) => [word.from, word.to]) : null;
            this.glowAr = {
              text: verse.ar, words, timings,
              audio, color: GOL.GEMS[(gp.ayah - 1) % 7].glow,
              scaleTimings: this.ayahFollowScaled,
              sourceDuration: this.ayahFollow && this.ayahFollow.audioDurations
                ? this.ayahFollow.audioDurations[gp.ayah - 1] : null,
              t: 0, dur: 30
            };
          }
        }
      } else {
        // hold: still and listening, the ayah filling the air. She glimmers —
        // little sparkles drift up around her while the words are spoken.
        pl.t += dt;
        pl.idleT += dt;
        pl.vx = 0; pl.moving = false;
        if (Math.random() < dt * 6) {
          this.fx.spawn('sparkle', pl.x + GOL.rnd(-22, 22), pl.y - GOL.rnd(4, 40), { color: Math.random() < 0.5 ? '#FFF3C4' : '#FFE9A8' });
        }
      }
    },

    // restoration: a few flowers and butterflies bloom around (or ahead of) a gem
    bloomAround(x, opts = {}) {
      const L = this.L;
      const scale = Math.max(1, opts.scale || 1);
      const centerX = x + (opts.offset || 0) * TILE;
      const tx = Math.floor(centerX / TILE);
      const sweep = scale >= 2 ? [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5] : [-2, -1, 1, 2, 3];
      let planted = 0;
      for (const dx of sweep) {
        const cx = tx + dx;
        if (cx < 1 || cx >= L.w - 1) continue;
        const s = L.surface(cx);
        if (s >= L.h) continue;
        if (planted < 3 * scale && Math.random() < 0.8) {
          L.props.push({ type: 'flowers', x: (cx + 0.5) * TILE, y: s * TILE, v: Math.floor(Math.random() * 3), born: this.t });
          this.fx.spawn('ring', (cx + 0.5) * TILE, s * TILE - 8, { color: '#F5B8C4', size: 10 * scale });
          planted++;
        }
      }
      const butterflies = Math.min(2, Math.ceil(scale));
      for (let i = 0; i < butterflies; i++) {
        const bx = i ? centerX + GOL.rnd(-2, 2) * TILE : centerX;
        const s = L.surface(Math.floor(bx / TILE));
        if (s >= L.h) continue;
        L.creatures.push({
          type: 'butterfly', x: bx, y: (s - 2.4) * TILE, homeX: bx, homeY: (s - 2.4) * TILE,
          phase: Math.random() * 7, t: 0, colA: ['#F0C878', '#E8896B', '#C9A8E0'][Math.floor(Math.random() * 3)], colB: '#F7EFDA'
        });
      }
      if (opts.sound !== false) GOL.audio.sfx('bloom');
    },

    bloomBanks() {
      for (const range of this.L.bloomBanks || []) {
        const xs = [];
        for (let x = Math.max(1, Math.ceil(range[0])); x <= Math.min(this.L.w - 2, Math.floor(range[1])); x++) {
          if (this.L.surface(x) < this.L.h) xs.push(x);
        }
        if (!xs.length) continue;
        const count = 2 + (Math.random() < 0.5 ? 1 : 0);
        for (let i = 0; i < count; i++) {
          const x = xs[Math.floor(Math.random() * xs.length)], s = this.L.surface(x);
          this.L.props.push({ type: 'flowers', x: (x + 0.5) * TILE, y: s * TILE, v: Math.floor(Math.random() * 3), born: this.t });
        }
      }
    },

    runGemFx(g) {
      if (!this.L.gemFx || this.L.gemFx[g.ayah] !== 'descentLights') return;
      const cam = this.cam || { x: Math.max(0, this.player.x - 400), y: this.player.y - 500, viewW: 800 };
      const n = 8 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const x = cam.x + GOL.rnd(20, Math.max(21, cam.viewW - 20));
        const y = cam.y - GOL.rnd(20, 110), life = GOL.rnd(3.7, 4.3);
        const ground = Math.max(this.player.y + 24, this.L.surface(Math.floor(x / TILE)) * TILE) - GOL.rnd(2, 14);
        this.fx.spawn('descentLight', x, y, {
          color: i % 2 ? '#FFE9A8' : '#FFF3C4', life, vy: (ground - y) / life
        });
      }
    },

    updateGallopFx(dt) {
      const pl = this.player;
      if (!pl.gallopBoosted) { this.gallopFxT = 0; return; }
      this.gallopFxT -= dt;
      if (this.gallopFxT > 0) return;
      this.gallopFxT += 0.09;
      const heelX = pl.x - 9;
      this.fx.spawn('sparkle', heelX, pl.y - 5, { color: Math.random() < 0.5 ? '#E8896B' : '#F5D89A', vx: GOL.rnd(-58, -36), vy: GOL.rnd(-30, -12), life: 0.32, size: 2.5, grav: 45 });
      this.fx.spawn('dust', heelX - 3, pl.y - 2, { vx: GOL.rnd(-24, -10), vy: GOL.rnd(-18, -6), life: 0.38, size: 4, alpha: 0.25 });
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

    // ------------------------------------------------- the guiding light --
    // Al-Falaq's daybreak, made playable: through the settled darkness sit
    // closed boxes of light. Reaching one opens it and frees an orb of noor
    // that flies ahead along the seed trail toward the next ayah, kindling
    // each seed it passes into a bright, then slowly expiring, lit path — the
    // way shown, never forced. The child's own aura and Noor the firefly mean
    // the dark never traps: the orb leads, it does not gate. Inert unless the
    // world declares `night`.
    updateGuideLight(dt) {
      const L = this.L, pl = this.player;
      // the kindled path expires gently behind the light (slower while the orb
      // is still drawing it, so a segment reads as whole before it fades)
      for (const s of this.seeds) {
        if (s.lit > 0) s.lit = Math.max(0, s.lit - dt * (this.orb ? 0.12 : 0.26));
      }
      if (!L.night) return;

      // opening a box: a deliberate-feeling arrival (grounded, close), but no
      // button to hunt for — the vessel simply blooms as the child reaches it.
      for (const bx of this.boxes) {
        if (bx.spent) { bx.open = Math.min(1, bx.open + dt * 3); continue; }
        if (!this.orb && !this.gemPause && pl.grounded &&
            Math.abs(pl.x - bx.x) < 40 && Math.abs(pl.y - bx.y) < 56) {
          bx.spent = true;
          GOL.audio.sfx('blossom');
          this.fx.spawn('ring', bx.x, bx.y - 20, { color: '#FFF3C4', size: 26 });
          this.fx.spawn('ring', bx.x, bx.y - 20, { color: '#FFE9A8', size: 44 });
          for (let i = 0; i < 12; i++) this.fx.spawn('sparkle', bx.x + GOL.rnd(-14, 14), bx.y - 20 + GOL.rnd(-12, 6), { color: i % 2 ? '#FFE9A8' : '#FFF6DC' });
          this.orb = { x: bx.x, y: bx.y - 22, vx: 0, vy: 0, t: 0, life: 0, dissolve: 0 };
        }
      }

      // the orb leads toward the same goal the firefly knows — the next ayah's
      // gem, or the campfire once all are gathered — kindling seeds en route.
      const orb = this.orb;
      if (!orb) return;
      orb.t += dt;
      orb.life = Math.min(1, orb.life + dt * 3);

      const goal = this.guideGoal();
      if (orb.dissolve > 0 || !goal) {
        // its task shown, the orb settles into the light it led to and fades
        orb.dissolve += dt * 1.6;
        if (Math.random() < dt * 20) this.fx.spawn('sparkle', orb.x + GOL.rnd(-8, 8), orb.y + GOL.rnd(-8, 8), { color: '#FFE9A8' });
        if (orb.dissolve >= 1) this.orb = null;
        return;
      }

      const gx = goal.x, gy = goal.y - 26;
      const dx = gx - orb.x, dy = gy - orb.y;
      const d = Math.hypot(dx, dy) || 1;
      const speed = 250; // outruns the child, so the path is drawn ahead
      orb.vx += ((dx / d) * speed - orb.vx) * Math.min(1, dt * 4);
      orb.vy += ((dy / d) * speed - orb.vy) * Math.min(1, dt * 4);
      orb.x += orb.vx * dt;
      orb.y += orb.vy * dt;

      // kindle any seed the orb sweeps over, and drop a soft glimmer trail
      for (const s of this.seeds) {
        if (s.taken) continue;
        if (Math.hypot(s.x - orb.x, s.y - orb.y) < 46) s.lit = 1;
      }
      if (Math.random() < dt * 26) this.fx.spawn('mote', orb.x + GOL.rnd(-6, 6), orb.y + GOL.rnd(-4, 8), { color: '#FFF3C4' });

      // arrived at the goal: bloom, then dissolve into it
      if (d < 34) {
        orb.dissolve = 0.001;
        this.fx.spawn('ring', gx, gy, { color: '#FFE9A8', size: 22 });
      }
    },

    // where the guiding orb (and the firefly) should lead: the next unfound
    // ayah's gem, or the campfire once the surah is whole
    guideGoal() {
      const L = this.L;
      if (this.pendingCamp()) return this.campWorldPos(this.pendingCamp());
      if (this.found.length < L.gems.length) {
        const nextA = this.found.length + 1;
        for (const g of L.gems) if (g.ayah === nextA) return { x: g.x, y: g.y };
        return null;
      }
      return L.campfire ? { x: L.campfire.x, y: L.campfire.y } : null;
    },

    updateFirefly(dt) {
      const f = this.fly, pl = this.player, L = this.L;
      f.t += dt;
      const allFound = this.found.length === L.gems.length;
      // the firefly always knows which ayah comes next
      const pendingCamp = this.pendingCamp();
      const nextA = this.found.length + 1;
      let unfound = null;
      if (!pendingCamp) for (const g of L.gems) if (g.ayah === nextA) { unfound = g; break; }
      // once everything is gathered, the firefly leads to the campfire
      const goal = pendingCamp ? this.campWorldPos(pendingCamp)
        : unfound || (allFound && L.campfire && Math.abs(pl.x - L.campfire.x) > 90
        ? { x: L.campfire.x, y: L.campfire.y - 40 } : null);
      const lost = !!pendingCamp || (pl.idleT > 4.5 && unfound) || (allFound && goal);
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

    pendingCamp() {
      const camps = this.L && this.L.campShrines;
      if (!camps || this.campDone >= camps.length) return null;
      const c = camps[this.campDone];
      return this.found.length >= c.afterAyah ? Object.assign({ index: this.campDone }, c) : null;
    },

    campWorldPos(c) {
      return { x: (c.x + 0.5) * TILE, y: c.row * TILE - 42 };
    },

    updateCampShrine(c, dt) {
      const p = this.campWorldPos(c), pl = this.player;
      if (Math.random() < dt * 8) {
        this.fx.spawn('sparkle', p.x + GOL.rnd(-24, 24), p.y + GOL.rnd(-28, 18), { color: '#FFE9A8' });
      }
      if (this.campEntering) return;
      if (pl.grounded && Math.abs(pl.x - p.x) < 62 && Math.abs((pl.y - 24) - p.y) < 74) {
        this.campEntering = true;
        const start = c.index === 0 ? 1 : this.L.campShrines[c.index - 1].afterAyah;
        GOL.audio.sfx('yourTurn');
        GOL.go('shrine', {
          proto: this.protoN,
          checkpoint: {
            index: c.index, start,
            len: c.afterAyah - start + 1,
            afterAyah: c.afterAyah
          }
        });
      }
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
          // One tight recitation of the whole surah — a single voice per ayah
          // at the normal gap. The old "your turn" pause/breath (with its
          // listening rings and per-ayah chime) was cut 2026-07-12: with the
          // shrine's one-socket recall right after, it added no value. The
          // focus-on-the-ayah beat now lives at each gem's collection instead.
          if (GOL.DEBUG_ACCEL) {
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
        this.updateGallopFx(dt);
        // the memory stone can now be woken — deliberately, off to the side
        this.updateMemoryStone(dt);
        if (Math.random() < dt * 8 && L.door) {
          this.fx.spawn('sparkle', L.door.x + GOL.rnd(-40, 40), L.door.y - GOL.rnd(10, 170), { color: '#FFE9A8' });
        }
        if (L.door && Math.abs(pl.x - L.door.x) < 50 && Math.abs(pl.y - L.door.y) < 60) {
          GOL.go('shrine', { proto: this.protoN, world: this.worldN });
          return;
        }
      }
    },
    openDoor() {
      this.phase = 'ember';
      this.reciteI = -1;
      this.orbit = []; // the ayat settle back into the child; the band holds them
      const st = GOL.store.level(this.storeId);
      st.heardFull = (st.heardFull || 0) + 1;
      GOL.store.save();
      GOL.audio.sfx('door');
      GOL.audio.startAmbience('garden');
      // STONES DISARMED (PLAN §10 verdict 2026-07-12): the ember-phase
      // arming is gone — the Remembering's doorway is moving to the old
      // world's own shrine. The stone remains as quiet scenery (its
      // machinery below stays for whatever the redesign keeps).
    },

    // which surah should this world's unaimed stone remember? The completed
    // one (Grand Gem earned) that has gone longest without a dream — read
    // from st.shrineRuns' dream entries. Never-dreamed surahs count as
    // oldest; among those, journey order breaks the tie (earliest learned
    // first). The current world's own surah never remembers itself.
    chooseMemorySurah(currentId) {
      const grand = GOL.store.data.grand || {};
      const seq = GOL.orderedWorlds ? GOL.orderedWorlds() : (GOL.WORLDS3 || []).filter(Boolean);
      let best = null, bestAt = Infinity;
      for (const w of seq) {
        if (!w.surahId || w.surahId === currentId || !grand[w.surahId]) continue;
        let last = 0;
        for (const r of GOL.store.level(w.surahId).shrineRuns || []) {
          if (r.dream && r.at > last) last = r.at;
        }
        if (last < bestAt) { bestAt = last; best = w.surahId; }
      }
      return best;
    },

    // THE REMEMBERING (PLAN §9). Awake only in the ember phase. Armed, the
    // stone raises a level-wide beam (drawn in drawMemoryStone) and, on
    // approach, whispers the old surah's FIRST ayah — identity before consent.
    // Waking is DELIBERATE: ~40px for a 0.6s dwell (a ring fills as intent).
    // On wake the OLD surah's Grand Gem rises from the child and travels to
    // the socket over ~1.5s, sets with a chime, rests a beat — and then the
    // dream begins: the old surah's moonlit shrine (shrine.js owns the dream).
    updateMemoryStone(dt) {
      const ms = this.memState, m = this.L.memory;
      if (!ms || !m || ms.phase === 'inert') return;
      const pl = this.player;
      if (ms.phase === 'armed') {
        const d = Math.hypot(pl.x - m.x, (pl.y - 16) - (m.y - 30));
        // the whisper: coming near, the stone breathes the old surah's first
        // ayah once — and again only after truly leaving and returning
        if (d < 130 && !ms.whispered) {
          ms.whispered = true;
          GOL.audio.echoVerse(m.surahId, 1, 0.3);
        } else if (d > 260 && ms.whispered) {
          ms.whispered = false;
        }
        if (d < 40 && pl.grounded) {
          ms.dwell += dt;
          if (Math.random() < dt * 5) {
            this.fx.spawn('sparkle', m.x + GOL.rnd(-10, 10), m.y - 30 - GOL.rnd(0, 22), { color: '#FFE9A8' });
          }
          if (ms.dwell >= 0.6) {
            // intent confirmed: the old Grand Gem lifts from the child
            ms.phase = 'travel';
            ms.travel = 0;
            ms.from = { x: pl.x, y: pl.y - 40 };
            GOL.audio.sfx('yourTurn');
          }
        } else {
          ms.dwell = Math.max(0, ms.dwell - dt * 1.5); // drifting away lets it settle
        }
      } else if (ms.phase === 'travel') {
        ms.travel = Math.min(1, ms.travel + dt / 1.5);
        if (Math.random() < 0.5) {
          const k = GOL.ease.inOut(ms.travel);
          const gx = ms.from.x + (m.x - ms.from.x) * k;
          const gy = ms.from.y + ((m.y - 34) - ms.from.y) * k - Math.sin(Math.PI * ms.travel) * 30;
          this.fx.spawn('trail', gx, gy, { color: '#FFE9A8' });
        }
        if (ms.travel >= 1) {
          // the gem sets into the socket with a chime, and rests a beat
          ms.phase = 'set';
          ms.litT = 0;
          GOL.audio.sfx('settle');
          this.fx.burst(m.x, m.y - 34, '#F0C878', 20);
          this.fx.spawn('ring', m.x, m.y - 34, { color: '#FFE9A8', size: 30 });
          this.bloomAround(m.x);
        }
      } else if (ms.phase === 'set') {
        // a short settle beat with the gem glowing in its socket — legibility
        // before anything sounds — then the dream carries the child away
        ms.litT += dt;
        if (ms.litT >= 0.6) {
          if (this.worldN) {
            ms.phase = 'reciting'; // hold the set-gem look under the fade-out
            GOL.go('shrine', { memory: { surahId: m.surahId, returnWorld: this.worldN } });
          } else {
            // prototype mode — no journey to return to; fall back to the old
            // payoff: the surah recites in place, petals falling
            ms.phase = 'reciting';
            const s = window.GOL_DATA.surahs.find((x) => x.id === m.surahId);
            if (s && !GOL.DEBUG_ACCEL) GOL.audio.playSurah(s, {
              onVerse: () => {
                for (let k = 0; k < 5; k++) this.fx.spawn('petal', m.x + GOL.rnd(-42, 42), m.y - 62, { color: k % 2 ? '#F5B8C4' : '#FFE9A8' });
              }
            });
            const st = GOL.store.level(m.surahId);
            st.heardFull = (st.heardFull || 0) + 1;
            GOL.store.save();
            GOL.stamp('v3memory');
          }
        }
      } else if (ms.phase === 'reciting') {
        ms.litT += dt;
        if (this.worldN) return; // dream-bound: the fade-out is carrying us
        if (Math.random() < dt * 4) {
          this.fx.spawn('petal', m.x + GOL.rnd(-50, 50), m.y - 70, { color: Math.random() < 0.5 ? '#F5B8C4' : '#FFE9A8' });
        }
      }
    },

    // pre-grow the garden on return: 3 × min(replays, 6) extra flower/tuft
    // props on grassy surface tiles, drawn as a growing PREFIX of one fixed
    // deterministic stream — so each return is the same clearing, fuller.
    // A resume (waking from the dream) still grows, but doesn't count a visit.
    applyReplayGrowth(L, resume) {
      const grand = GOL.store.data.grand;
      const grandKey = L.labSaveKey || L.surahId;
      if (!grand || !grand[grandKey]) return;
      const st = GOL.store.level(grandKey);
      if (!resume) {
        st.replays = (st.replays || 0) + 1;
        GOL.store.save();
      }
      const extra = 3 * Math.min(st.replays || 0, 6);
      if (extra <= 0) return;
      const cols = [];
      for (let x = 1; x < L.w - 1; x++) {
        const s = L.surface(x);
        if (s >= L.h) continue;
        if (L.tiles[s * L.w + x] !== 1) continue;         // grassy ground only
        if (L.tiles[(s - 1) * L.w + x] !== 0) continue;   // open sky above
        cols.push(x);
      }
      if (!cols.length) return;
      const r = GOL.rng(9000 + L.id * 31); // fixed per level → prefix grows
      for (let i = 0; i < extra; i++) {
        const cx = cols[Math.floor(r() * cols.length)];
        const s = L.surface(cx);
        if (r() < 0.62) L.props.push({ type: 'flowers', x: (cx + 0.5) * TILE, y: s * TILE, v: Math.floor(r() * 3) });
        else L.props.push({ type: 'tuft', x: (cx + 0.5) * TILE, y: s * TILE, v: Math.floor(r() * 2) });
      }
    },

    // debug helpers: G collects everything, E warps to the campfire
    debugCollectAll() {
      const camp = this.L.campShrines && this.campDone < this.L.campShrines.length
        ? this.L.campShrines[this.campDone] : null;
      const through = camp ? camp.afterAyah : this.L.gems.length;
      for (const g of this.L.gems) {
        if (g.ayah <= through && !this.found.includes(g.ayah)) this.collect(g, g.ayah - 1);
      }
    },
    debugWarp() {
      const pl = this.player, L = this.L;
      const pending = this.pendingCamp();
      if (pending) {
        const gateX = (pending.x + 0.5) * TILE;
        // First E frames the doorway from a few steps away for inspection;
        // a second E enters it. Both positions stay on the camp ledge.
        const side = pending.approach === 'left' ? -1 : 1;
        pl.x = Math.abs(pl.x - gateX) > 80 ? gateX + side * 88 : gateX;
        pl.y = pending.row * TILE;
        pl.vx = 0; pl.vy = 0; pl.grounded = true; pl.rescue = null;
        pl.lastSafe = { x: pl.x, y: pl.y };
        return;
      }
      // A second E during the earned-fire ceremony skips its timer. This is
      // debug-only and makes long-surah shrine comparisons practical in the
      // embedded browser, whose animation clock advances mainly on input.
      if (this.phase === 'settle' || this.phase === 'campfire') this.openDoor();
      const spot = this.phase === 'ember' && L.door ? L.door : L.campfire;
      // At the open door, land inside its 50px entry radius; the old -70
      // offset made the documented second E warp stop just outside it.
      pl.x = spot.x - (this.phase === 'ember' ? 40 : 70);
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
      for (const c of L.creatures) {
        if (c.type === 'chargers' && c.sweep != null) {
          GOL.drawChargers(ctx, -90 + c.sweep * (W + 180), horizon - 72, t, P, c, this.scale);
        }
      }

      // ---- world space
      ctx.save();
      ctx.scale(this.scale, this.scale);
      ctx.translate(-cam.x, -cam.y);
      {
        const sx = Math.max(0, Math.floor(cam.x) - 8);
        const sw = Math.min(this.terrain.width - sx, cam.viewW + 16);
        ctx.drawImage(this.terrain, sx, 0, sw, this.terrain.height, sx, 0, sw, this.terrain.height);
        // belt-and-suspenders: the terrain is only painted down to L.h*TILE, so
        // if the camera ever shows below that edge (rounding, a tall phone),
        // let the earth simply continue instead of revealing the sky gradient.
        const worldBottom = L.h * TILE;
        const showBelow = cam.y + cam.viewH + 40;
        if (showBelow > worldBottom) {
          ctx.fillStyle = GOL.color.shade(P.soilDark || P.soil, 0.35);
          ctx.fillRect(sx, worldBottom, sw, showBelow - worldBottom);
        }
      }
      for (const w of this.waterRects) GOL.drawWater(ctx, w.x, w.y, w.w, w.h, t, P);

      // the prototype's own landmark (a great tree, lighthouse, ruin…),
      // drawn behind the props so life gathers in front of it
      if (L.drawLandmark) L.drawLandmark(ctx, t, P, L);

      for (const p of L.props) {
        if (p.x < cam.x - 220 || p.x > cam.x + cam.viewW + 220) continue;
        this.drawProp(ctx, p, t, P);
      }

      // the memory stone, holding a place for an earlier surah's Grand Gem
      if (L.memory) this.drawMemoryStone(ctx, L.memory, t);
      // the campfire (sleeping until every gem is found)
      if (L.campfire) this.drawCampfire(ctx, L.campfire.x, L.campfire.y, t);
      if (L.campShrines) this.drawCampShrines(ctx, t, P);
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
        const sy = s.y + Math.sin(t * 2.1 + s.phase) * 3;
        // a kindled seed glows a broad warm halo — the lit path through the dark
        if (s.lit > 0.01) {
          const rr = 15 + 22 * s.lit, k = 0.55 * s.lit * (0.82 + 0.18 * Math.sin(t * 4 + s.phase));
          const hg = ctx.createRadialGradient(s.x, sy, 1, s.x, sy, rr);
          hg.addColorStop(0, alpha('#FFF3C4', k));
          hg.addColorStop(1, alpha('#FFE9A8', 0));
          ctx.fillStyle = hg;
          ctx.beginPath(); ctx.arc(s.x, sy, rr, 0, Math.PI * 2); ctx.fill();
        }
        GOL.drawSeed(ctx, s.x, sy, t, s.phase);
      }
      // guiding-light boxes and the orb of noor they release
      if (this.boxes) for (const bx of this.boxes) {
        if (bx.x < cam.x - 90 || bx.x > cam.x + cam.viewW + 90) continue;
        this.drawLightbox(ctx, bx, t);
      }
      if (this.orb) this.drawOrb(ctx, this.orb, t);
      if (this.blossomState && !this.blossomState.taken) {
        const B = this.blossomState;
        if (B.x > cam.x - 90 && B.x < cam.x + cam.viewW + 90) {
          GOL.drawRahmaBlossom(ctx, B.x, B.y + Math.sin(t * 1.4) * 4, 13, t);
        }
      }

      const nextA = this.pendingCamp() ? -1 : this.found.length + 1;
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

      // the wanderer (seated and peaceful during the campfire; eyes softly
      // shut, breathing, while an earned ayah fills the air at collection)
      const pl = this.player;
      const seated = this.phase === 'settle' || this.phase === 'campfire';
      const holding = this.gemPause && this.gemPause.stage === 'hold';
      const still = seated || holding;
      // eyes softly shut while she listens — at each ayah's collection (hold)
      // and while the whole surah is recited at the campfire. Not during
      // 'settle', when she's still drifting to her seat.
      const listening = holding || this.phase === 'campfire';
      const breath = holding ? Math.sin(pl.t * 1.8) * 0.03 : 0;
      GOL.drawSprite(ctx, pl.x, pl.y, {
        vx: still ? 0 : pl.vx, vy: pl.vy, grounded: true, facing: pl.facing,
        t: pl.t, idleT: seated ? 3.5 : holding ? Math.max(2.6, pl.idleT) : pl.idleT, blink: pl.blink,
        squashX: seated ? 1.06 : holding ? 1 + breath : pl.squashX,
        squashY: seated ? 0.94 : holding ? 1 - breath : pl.squashY,
        moving: still ? false : pl.moving,
        eyesClosed: listening
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

      // the settled darkness — a night the guiding light and the coming dawn
      // both push back. Draws its own night→daybreak lift, so the generic dawn
      // veil below stands down for a `night` world.
      if (L.night) this.drawDarkness(ctx, W, H);

      // night thinning into dawn as the world is restored
      if (!L.night && this.endP && dawnK < 1) {
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
      // (drawn well below the gem band so the two never overlap)
      if (this.glowAr) {
        const g = this.glowAr;
        const k = Math.min(1, g.t / 0.6) * Math.min(1, (g.dur - g.t) / 0.9);
        const fade = Math.max(0, k);
        if (!drawFollowAyah(ctx, g, W, H, fade)) {
          ctx.globalAlpha = fade;
          GOL.text(ctx, g.text, W / 2, H * 0.32, { size: Math.min(30, W * 0.045), ar: true, weight: '400', color: '#FFFBEE' });
          ctx.globalAlpha = 1;
        }
      }

      // the gem band: collected ayat resting in their star settings — the
      // wordless answer to "how many so far, how many to go". It lives at the
      // BOTTOM now, over the dead subterranean strip the camera's bottom clamp
      // leaves unusable, tucked into the gap between the thumbstick and the jump
      // button (see §10). We derive its slot from touchZones so band and
      // controls can never collide, and the band windows itself for long surahs.
      if (this.phase === 'roam' || this.phase === 'ember') {
        const z = GOL.touchZones(W, H);
        const gapL = z.stick.x + z.stick.r + 16;      // inner edge of the thumbstick
        const gapR = z.jump.x - z.jump.r - 16;        // inner edge of the jump button
        const bandCx = (gapL + gapR) / 2;
        const bandMax = Math.max(120, gapR - gapL);
        const bandY = z.stick.y - 26;                 // centre the 52px band on the controls' row
        const starY = bandY - 15;                     // camp-progress pips ride just above
        if (L.campShrines && L.campShrines.length) {
          const start = this.campDone === 0 ? 1 : L.campShrines[this.campDone - 1].afterAyah + 1;
          const end = this.campDone < L.campShrines.length
            ? L.campShrines[this.campDone].afterAyah : L.gems.length;
          const foundHere = this.found.filter((a) => a >= start && a <= end).map((a) => a - start);
          GOL.drawHudBand(ctx, bandCx, bandY, end - start + 1, foundHere, t, bandMax);
          const totalCamps = L.campShrines.length + 1;
          const sx = bandCx - (totalCamps - 1) * 15;
          for (let i = 0; i < totalCamps; i++) {
            GOL.star8Path(ctx, sx + i * 30, starY, 6.5, Math.PI / 8);
            ctx.fillStyle = i < this.campDone ? '#FFF6DC' : alpha('#FFF6DC', 0.22);
            ctx.fill();
            ctx.strokeStyle = alpha('#D9A44A', i < this.campDone ? 0.9 : 0.35);
            ctx.lineWidth = 1.2; ctx.stroke();
          }
        } else {
          GOL.drawHudBand(ctx, bandCx, bandY, L.gems.length, this.found.map((a) => a - 1), t, bandMax);
        }
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

    // A small version of the final shrine doorway: unmistakably a place to
    // enter, but modest enough that the summit arch remains the grand arrival.
    // Closed ahead, warmly open when ready, constellation-lit once remembered.
    drawCampShrines(ctx, t, P) {
      const camps = this.L.campShrines || [];
      for (let i = 0; i < camps.length; i++) {
        const c = Object.assign({ index: i }, camps[i]);
        const p = { x: (c.x + 0.5) * TILE, y: c.row * TILE };
        const done = i < this.campDone;
        const ready = i === this.campDone && this.found.length >= c.afterAyah;
        const pulse = 0.5 + 0.5 * Math.sin(t * 2.4 + i);
        const open = done || ready;
        const gateW = 92, gateH = 116, innerW = 48;
        ctx.save();
        // Portal recess first: deep blue while sleeping, unmistakable warm
        // light once the child has earned entry.
        const portal = ctx.createLinearGradient(0, p.y - gateH, 0, p.y);
        portal.addColorStop(0, open ? alpha('#FFF6DC', 0.96) : alpha('#263947', 0.92));
        portal.addColorStop(1, open ? alpha('#F0C878', 0.72) : alpha('#182A35', 0.96));
        ctx.fillStyle = portal;
        ctx.beginPath();
        ctx.moveTo(p.x - innerW / 2, p.y);
        ctx.lineTo(p.x - innerW / 2, p.y - 62);
        ctx.quadraticCurveTo(p.x, p.y - 104, p.x + innerW / 2, p.y - 62);
        ctx.lineTo(p.x + innerW / 2, p.y);
        ctx.closePath(); ctx.fill();

        // Closed wooden leaves make an unready gate legible from a distance.
        if (!open) {
          ctx.fillStyle = P.trunk;
          ctx.fillRect(p.x - innerW / 2, p.y - 61, innerW / 2 - 1, 61);
          ctx.fillRect(p.x + 1, p.y - 61, innerW / 2 - 1, 61);
          ctx.strokeStyle = alpha(P.trunkDark, 0.8); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(p.x, p.y - 62); ctx.lineTo(p.x, p.y); ctx.stroke();
        }

        // Heavy outlined pillars + curved lintel: architecture, not sparkle.
        const stone = done ? GOL.color.tint(P.stone, 0.18) : P.stone;
        ctx.fillStyle = stone;
        ctx.strokeStyle = alpha(P.stoneDark, 0.92);
        ctx.lineWidth = 3;
        for (const x of [p.x - gateW / 2, p.x + gateW / 2 - 18]) {
          GOL.roundRect(ctx, x, p.y - 82, 18, 82, 5); ctx.fill(); ctx.stroke();
        }
        ctx.lineCap = 'round';
        ctx.strokeStyle = alpha(P.stoneDark, 0.95); ctx.lineWidth = 20;
        ctx.beginPath(); ctx.moveTo(p.x - 36, p.y - 70); ctx.quadraticCurveTo(p.x, p.y - gateH, p.x + 36, p.y - 70); ctx.stroke();
        ctx.strokeStyle = stone; ctx.lineWidth = 14; ctx.stroke();
        ctx.lineCap = 'butt';
        GOL.star8Path(ctx, p.x, p.y - 91, 8 + (ready ? pulse * 1.5 : 0), Math.PI / 8);
        ctx.fillStyle = open ? '#FFF6DC' : alpha('#B98A3E', 0.72); ctx.fill();
        ctx.strokeStyle = alpha('#8F6D39', 0.9); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();

        // The active doorway breathes a wide ground ring: this is the next
        // destination, not another piece of scenery.
        if (ready) {
          ctx.strokeStyle = alpha('#FFE9A8', 0.38 + pulse * 0.4);
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.ellipse(p.x, p.y - 2, 44 + pulse * 5, 12 + pulse * 2, 0, 0, Math.PI * 2); ctx.stroke();
          for (let k = 0; k < 3; k++) {
            const a = t * 0.55 + k * Math.PI * 2 / 3;
            ctx.fillStyle = alpha('#FFF6DC', 0.65 + 0.25 * Math.sin(t * 2 + k));
            ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * 28, p.y - 52 + Math.sin(a) * 18, 2.5, 0, Math.PI * 2); ctx.fill();
          }
        }

        // A completed gate stays physically open and wears its stanza as a
        // four-point constellation above the arch.
        if (done) {
          for (let k = 0; k < 4; k++) {
            const a = k * Math.PI / 2 + t * 0.12;
            ctx.fillStyle = alpha('#FFF6DC', 0.55 + 0.2 * Math.sin(t * 2 + k));
            ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * 18, p.y - 66 + Math.sin(a) * 11, 2.1, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
    },

    // A weathered standing stone with a star-shaped setting. Its look is driven
    // wholly by memState.phase: INERT is plain scenery (roam/settle/campfire),
    // ARMED raises a level-wide beam and breathes an invitation with a filling
    // dwell ring, TRAVEL shows the old Grand Gem gliding in, SET/RECITING hold
    // the set gem shining (under the fade into the dream).
    drawMemoryStone(ctx, m, t) {
      const ms = this.memState;
      const phase = ms ? ms.phase : 'inert';
      const socketY = -34;
      ctx.save();
      ctx.translate(m.x, m.y);
      // THE BEAM: while armed, a thin column of soft light rises from the
      // stone to the top of the world — a promise visible from far away.
      // It eases out as the gem travels in (the ceremony takes the stage).
      const beamK = phase === 'armed' ? 1 : phase === 'travel' ? 1 - ms.travel : 0;
      if (beamK > 0.01) {
        const pulse = 0.75 + 0.25 * Math.sin(t * 1.6);
        const topY = -m.y - 60; // past the top edge of the world
        const bg = ctx.createLinearGradient(0, socketY - 12, 0, topY);
        bg.addColorStop(0, alpha('#FFE9A8', 0.34 * beamK * pulse));
        bg.addColorStop(0.5, alpha('#FFF6DC', 0.16 * beamK * pulse));
        bg.addColorStop(1, alpha('#FFF6DC', 0));
        ctx.fillStyle = bg;
        const hw = 5 + Math.sin(t * 1.6) * 1.2;
        ctx.fillRect(-hw, topY, hw * 2, socketY - 12 - topY);
        // a faint wider halo so the beam reads as light, not a stripe
        ctx.fillStyle = alpha('#FFE9A8', 0.06 * beamK * pulse);
        ctx.fillRect(-hw * 2.6, topY, hw * 5.2, socketY - 12 - topY);
      }
      ctx.fillStyle = alpha('#3E5340', 0.16);
      ctx.beginPath(); ctx.ellipse(1, 2, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
      const g = ctx.createLinearGradient(0, -56, 0, 0);
      g.addColorStop(0, '#EAE0C6');
      g.addColorStop(1, '#CBBC97');
      ctx.fillStyle = g;
      GOL.roundRect(ctx, -15, -56, 30, 56, 10);
      ctx.fill();
      ctx.strokeStyle = alpha('#AB9C78', 0.8);
      ctx.lineWidth = 1.8;
      GOL.roundRect(ctx, -15, -56, 30, 56, 10);
      ctx.stroke();
      // the star setting
      GOL.star8Path(ctx, 0, socketY, 10, Math.PI / 8);
      if (phase === 'reciting' || phase === 'set') {
        ctx.fillStyle = alpha('#FFE9A8', 0.7);
        ctx.fill();
        GOL.drawGem(ctx, 0, socketY, 9, GRAND, t, { phase: 2, glow: 0.9 });
        ctx.strokeStyle = alpha('#FFE9A8', 0.3 + 0.2 * Math.sin(t * 3));
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, socketY, 18 + Math.sin(t * 3) * 2, 0, Math.PI * 2); ctx.stroke();
      } else if (phase === 'armed' || phase === 'travel') {
        // a soft invitation: the setting breathes (the child carries the gem)
        ctx.fillStyle = alpha('#B98A3E', 0.35 + 0.3 * Math.sin(t * 2.6));
        ctx.fill();
        ctx.strokeStyle = alpha('#FFE9A8', 0.35 + 0.25 * Math.sin(t * 2.6));
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, socketY, 16 + Math.sin(t * 2.6) * 2, 0, Math.PI * 2); ctx.stroke();
        // the dwell ring fills as the child lingers — intent, made visible
        if (phase === 'armed' && ms.dwell > 0) {
          const frac = Math.min(1, ms.dwell / 0.6);
          ctx.strokeStyle = alpha('#FFF6DC', 0.95);
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, socketY, 21, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
          ctx.stroke();
        }
      } else {
        // INERT: a plain weathered setting — no pulse, no hint, cannot wake
        ctx.fillStyle = alpha('#B98A3E', 0.15);
        ctx.fill();
        ctx.strokeStyle = alpha('#AB9C78', 0.5);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
      // the old Grand Gem in transit — rising from the child to the socket,
      // legible BEFORE any sound (drawn in world space, outside the translate)
      if (phase === 'travel' && ms.from) {
        const k = GOL.ease.inOut(ms.travel);
        const gx = ms.from.x + (m.x - ms.from.x) * k;
        const gy = ms.from.y + ((m.y + socketY) - ms.from.y) * k - Math.sin(Math.PI * ms.travel) * 30;
        GOL.drawGem(ctx, gx, gy, 9, GRAND, t, { phase: 2, glow: 0.95 });
      }
    },

    // a closed box of light: a small lantern-chest sealed with a glowing seam,
    // curiosity-inviting; once spent it stands open and empty, still warm.
    drawLightbox(ctx, bx, t) {
      const x = bx.x, y = bx.y, k = bx.open;
      const glow = bx.spent ? 0.5 : 0.35 + 0.15 * Math.sin(t * 2.4);
      ctx.save();
      ctx.translate(x, y);
      // ground halo
      const halo = ctx.createRadialGradient(0, -12, 2, 0, -12, 30 + 16 * k);
      halo.addColorStop(0, alpha('#FFE9A8', 0.4 * glow));
      halo.addColorStop(1, alpha('#FFE9A8', 0));
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(0, -12, 30 + 16 * k, 0, Math.PI * 2); ctx.fill();
      // the box body
      ctx.fillStyle = '#6C5A44';
      GOL.roundRect(ctx, -12, -22, 24, 22, 5); ctx.fill();
      ctx.strokeStyle = alpha('#3E3222', 0.8); ctx.lineWidth = 1.4;
      GOL.roundRect(ctx, -12, -22, 24, 22, 5); ctx.stroke();
      // gold banding
      ctx.strokeStyle = alpha('#E7C079', 0.9); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-12, -11); ctx.lineTo(12, -11); ctx.stroke();
      // the lid: shut and seam-lit, or flung open once spent
      const lidA = k * 1.5;
      ctx.save();
      ctx.translate(-12, -22);
      ctx.rotate(-lidA);
      ctx.fillStyle = '#7A6650';
      GOL.roundRect(ctx, 0, -5, 24, 6, 3); ctx.fill();
      ctx.strokeStyle = alpha('#E7C079', 0.9); ctx.lineWidth = 1.4;
      GOL.roundRect(ctx, 0, -5, 24, 6, 3); ctx.stroke();
      ctx.restore();
      // the light seam / the light within
      const seam = ctx.createLinearGradient(0, -20, 0, -8);
      seam.addColorStop(0, alpha('#FFFBEA', (bx.spent ? 0.9 : 0.6) * (0.7 + 0.3 * Math.sin(t * 3))));
      seam.addColorStop(1, alpha('#FFE9A8', 0.1));
      ctx.fillStyle = seam;
      GOL.roundRect(ctx, -9, -20, 18, 12, 3); ctx.fill();
      if (!bx.spent) {
        GOL.star8(ctx, 0, -13, 3.2 + Math.sin(t * 4) * 0.8, t * 0.6, alpha('#FFFBEA', 0.9));
      }
      ctx.restore();
    },

    // the released orb of noor — an angel of light, brighter and more radiant
    // than the firefly, leading the way and trailing a warm shimmer
    drawOrb(ctx, orb, t) {
      const fade = (1 - orb.dissolve) * orb.life;
      if (fade <= 0.01) return;
      const puff = 1 + orb.dissolve * 0.8;
      ctx.save();
      ctx.translate(orb.x, orb.y);
      const R = 20 * puff;
      const halo = ctx.createRadialGradient(0, 0, 1, 0, 0, R);
      halo.addColorStop(0, alpha('#FFFBEA', 0.85 * fade));
      halo.addColorStop(0.5, alpha('#FFE9A8', 0.45 * fade));
      halo.addColorStop(1, alpha('#FFE9A8', 0));
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
      // soft rays turning slowly — the "angel of light"
      ctx.globalAlpha = fade * 0.55;
      ctx.strokeStyle = alpha('#FFF6DC', 0.8); ctx.lineWidth = 1.4;
      for (let i = 0; i < 6; i++) {
        const a = t * 0.7 + i * Math.PI / 3;
        const r0 = 5, r1 = 9 + Math.sin(t * 3 + i) * 2.5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
        ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
        ctx.stroke();
      }
      ctx.globalAlpha = fade;
      const core = ctx.createRadialGradient(0.5, -0.5, 0.3, 0, 0, 5);
      core.addColorStop(0, '#FFFFFF'); core.addColorStop(1, '#FFE9A8');
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(0, 0, 4.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },

    // the settled darkness, punched through by every source of noor: the
    // child's carried aura, the kindled path, the orb, the opened boxes, and
    // the faint beacon of the next ayah. Lifts globally as the dawn breaks.
    drawDarkness(ctx, W, H) {
      const L = this.L;
      const base = (L.night || 0) * (1 - Math.min(1, this.restoreK) * 0.9);
      if (base < 0.02) return;
      const cam = this.cam || { x: 0, y: 0 }, sc = this.scale || 1;
      if (!this.darkBuf || this.darkBuf.width !== W || this.darkBuf.height !== H) {
        this.darkBuf = GOL.paint.makeCanvas(W, H);
      }
      const d = this.darkBuf.getContext('2d');
      d.setTransform(1, 0, 0, 1, 0, 0);
      d.clearRect(0, 0, W, H);
      d.globalCompositeOperation = 'source-over';
      d.globalAlpha = Math.min(0.9, base);
      d.fillStyle = '#0E1622';
      d.fillRect(0, 0, W, H);
      d.globalAlpha = 1;
      d.globalCompositeOperation = 'destination-out';
      const sx = (wx) => (wx - cam.x) * sc, sy = (wy) => (wy - cam.y) * sc;
      const hole = (wx, wy, wr, strength) => {
        const x = sx(wx), y = sy(wy), r = wr * sc;
        if (x < -r || x > W + r || y < -r || y > H + r) return;
        const g = d.createRadialGradient(x, y, 1, x, y, r);
        g.addColorStop(0, 'rgba(0,0,0,' + strength + ')');
        g.addColorStop(0.62, 'rgba(0,0,0,' + (strength * 0.42) + ')');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        d.fillStyle = g;
        d.beginPath(); d.arc(x, y, r, 0, Math.PI * 2); d.fill();
      };
      const pl = this.player;
      hole(pl.x, pl.y - 16, 150, 0.97); // the noor the child always carries
      const goal = this.guideGoal();    // the next ayah, a faint findable beacon
      if (goal) hole(goal.x, goal.y - 8, 62, 0.5);
      for (const s of this.seeds) if (!s.taken && s.lit > 0.02) hole(s.x, s.y, 20 + 26 * s.lit, 0.9 * s.lit);
      if (this.boxes) for (const bx of this.boxes) hole(bx.x, bx.y - 16, bx.spent ? 78 : 40, bx.spent ? 0.85 : 0.5);
      if (this.orb && this.orb.dissolve < 1) hole(this.orb.x, this.orb.y, 128 * (1 - this.orb.dissolve), 0.98);
      if (this.found.length === L.gems.length && L.campfire) hole(L.campfire.x, L.campfire.y - 20, 190, 0.95);
      d.globalCompositeOperation = 'source-over';
      ctx.drawImage(this.darkBuf, 0, 0, W, H);
    },

    drawCampfire(ctx, x, y, t) {
      const lit = this.phase !== 'roam' || this.found.length === this.L.gems.length;
      const sw = 0;
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
        const grow = 1 + 0.3 * sw; // the flame swells during the breath
        const glowR = 90 * (1 + 0.18 * sw);
        const glow = ctx.createRadialGradient(0, -22, 4, 0, -22, glowR);
        glow.addColorStop(0, alpha('#FFD98E', 0.4 + 0.08 * Math.sin(t * 5) + 0.12 * sw));
        glow.addColorStop(1, alpha('#FFD98E', 0));
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(0, -22, glowR, 0, Math.PI * 2); ctx.fill();
        fl(13 * grow, (30 + Math.sin(t * 4) * 3) * grow, alpha('#E8896B', 0.85), 3.4, 0);
        fl(9 * grow, (24 + Math.sin(t * 5.2) * 3) * grow, alpha('#F7D98C', 0.9), 4.2, 1.4);
        fl(5 * grow, (16 + Math.sin(t * 6) * 2) * grow, alpha('#FFFBEA', 0.95), 5, 2.6);
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
