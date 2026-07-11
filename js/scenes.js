// Gems of Light — scenes.js
// Scene registry, shared UI helpers, the Title screen and the World Map.
(function () {
  const GOL = window.GOL;
  const { alpha, tint, shade, mix } = GOL.color;
  const TILE = GOL.TILE;

  GOL.SCENES = {};
  GOL.registerScene = (name, s) => (GOL.SCENES[name] = s);

  GOL.fonts = {
    ui: 'Nunito, "Trebuchet MS", system-ui, sans-serif',
    ar: '"Scheherazade New", Amiri, "Geeza Pro", "Traditional Arabic", serif'
  };
  const INK = '#3E5340';        // deep garden green for text
  const INK_SOFT = '#6B7D66';
  const GOLD = '#B98A3E';
  GOL.INK = INK; GOL.INK_SOFT = INK_SOFT; GOL.GOLD = GOLD;

  // Some fonts lack the ʿayn/hamza modifier letters; a curly quote is safe.
  GOL.trFix = (s) => s.replace(/[ʿʾ]/g, '’');

  GOL.text = function (ctx, str, x, y, o) {
    o = o || {};
    ctx.save();
    ctx.font = (o.weight || '700') + ' ' + (o.size || 20) + 'px ' + (o.ar ? GOL.fonts.ar : GOL.fonts.ui);
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.baseline || 'middle';
    if (o.shadow !== false) {
      ctx.fillStyle = 'rgba(46,64,50,0.18)';
      ctx.fillText(str, x + 1.5, y + 2);
    }
    ctx.fillStyle = o.color || INK;
    ctx.fillText(str, x, y);
    ctx.restore();
  };

  // Circle-hit buttons; returns true if a tap was consumed.
  GOL.hitButtons = function (taps, buttons) {
    for (const t of taps) {
      if (t.ui) continue;
      for (const b of buttons) {
        if (GOL.dist(t.x, t.y, b.x, b.y) < b.r) {
          t.ui = true;
          if (GOL.audio) GOL.audio.sfx('tap');
          b.fn();
          return true;
        }
      }
    }
    return false;
  };

  // Shared mute toggle
  GOL.muteButton = function (W) {
    return {
      x: W - 40, y: 40, r: 30,
      icon: () => (GOL.store.data.settings.muted ? 'soundOff' : 'sound'),
      fn: () => {
        const s = GOL.store.data.settings;
        s.muted = !s.muted;
        GOL.audio.setMuted(s.muted);
        GOL.store.save();
      }
    };
  };

  // A soft scene backdrop used by menus (sky + hills + meadow floor).
  function buildBackdrop(paletteKey, seed) {
    const P = GOL.PALETTES[paletteKey];
    return {
      P,
      far: GOL.buildHillStrip(1400, 260, { seed: seed + 1, base: 150, amp: 42, color: P.hillFar, mist: P.mist, trees: 12, treeColor: shade(P.hillFar, 0.22) }),
      mid: GOL.buildHillStrip(1200, 230, { seed: seed + 2, base: 120, amp: 52, color: P.hillMid, mist: P.mist, trees: 9, treeColor: shade(P.hillMid, 0.22) }),
      near: GOL.buildHillStrip(1000, 200, { seed: seed + 3, base: 92, amp: 44, color: P.hillNear, mist: P.mist, trees: 0 })
    };
  }
  GOL.buildBackdrop = buildBackdrop;

  GOL.drawBackdrop = function (ctx, bd, W, H, t, camX, groundFrac) {
    const P = bd.P;
    GOL.drawSky(ctx, W, H, P, t, camX);
    const gy = H * (groundFrac || 0.78);
    GOL.drawStrip(ctx, bd.far, camX, 0.05, gy - 250, W);
    GOL.drawRays(ctx, W, H, P, t);
    GOL.drawStrip(ctx, bd.mid, camX, 0.12, gy - 190, W);
    GOL.drawStrip(ctx, bd.near, camX, 0.22, gy - 140, W);
    // meadow floor
    const g = ctx.createLinearGradient(0, gy - 40, 0, H);
    g.addColorStop(0, tint(P.grass, 0.16));
    g.addColorStop(0.25, P.grass);
    g.addColorStop(1, shade(P.grass, 0.22));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    for (let x = 0; x <= W; x += 24) ctx.lineTo(x, gy + Math.sin(x * 0.012 + 2) * 7 - 4);
    ctx.lineTo(W, H); ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    return gy;
  };

  // ================================================================ TITLE ==
  const title = {
    t: 0, fx: null, bd: null, buttons: [],
    enter() {
      this.t = 0;
      this.fx = GOL.makeFx();
      this.bd = buildBackdrop('fatiha', 44);
      this.blinkT = 0;
    },
    update(dt, W, H) {
      this.t += dt;
      this.fx.update(dt);
      if (Math.random() < dt * 3) this.fx.spawn('mote', Math.random() * W, H * (0.3 + Math.random() * 0.5), {});
      if (Math.random() < dt * 0.5) this.fx.spawn('leaf', Math.random() * W, -10, {});
      this.buttons = [Object.assign({}, GOL.muteButton(W), {})];
      if (GOL.hitButtons(GOL.Input.taps, this.buttons)) return;
      for (const tap of GOL.Input.taps) {
        if (!tap.ui && this.t > 0.6) {
          GOL.audio.unlock();
          GOL.audio.sfx('unlockLevel');
          GOL.go('map');
          return;
        }
      }
    },
    draw(ctx, W, H) {
      const t = this.t;
      const gy = GOL.drawBackdrop(ctx, this.bd, W, H, t, t * 12, 0.8);
      // the resting hero, looking up at the floating gem
      GOL.drawSprite(ctx, W / 2 - 150, gy + 26, {
        vx: 0, vy: 0, grounded: true, facing: 1, t, idleT: 3,
        blink: Math.sin(t * 0.7) > 0.98, squashX: 1, squashY: 1, moving: false
      });
      // the gem, slowly turning in the air
      const gemY = gy - 96 + Math.sin(t * 1.3) * 9;
      GOL.drawGem(ctx, W / 2 + 40, gemY, 40, GOL.GEMS[2], t, { phase: 1 });
      if (Math.random() < 0.1) this.fx.spawn('sparkle', W / 2 + 40 + GOL.rnd(-30, 30), gemY + GOL.rnd(-30, 30), { color: '#96E2B4' });
      // Noor the firefly, circling the light
      GOL.drawFirefly(ctx, W / 2 + 40 + Math.cos(t * 0.9) * 86, gemY - 20 + Math.sin(t * 1.7) * 34, t, 1);
      this.fx.draw(ctx);
      // wordmark
      const ty = H * 0.3;
      GOL.star8(ctx, W / 2 - 178, ty - 8, 7, Math.PI / 8, alpha(GOLD, 0.85));
      GOL.star8(ctx, W / 2 + 178, ty - 8, 7, Math.PI / 8, alpha(GOLD, 0.85));
      GOL.text(ctx, 'Gems of Light', W / 2, ty - 10, { size: Math.min(58, W * 0.07), weight: '800', color: INK });
      GOL.text(ctx, 'جواهر النور', W / 2, ty + 42, { size: 34, ar: true, color: GOLD });
      GOL.text(ctx, 'a garden of the Qur’an, one gem at a time', W / 2, ty + 84, { size: 16, weight: '600', color: INK_SOFT });
      // begin
      const pulse = 0.6 + 0.4 * Math.sin(t * 2.6);
      GOL.text(ctx, 'tap anywhere to begin', W / 2, H * 0.86, { size: 18, weight: '700', color: alpha('#FFFFFF', 0.55 + 0.4 * pulse) });
      for (const b of this.buttons) GOL.drawButton(ctx, b.x, b.y, 22, b.icon ? b.icon() : b.iconName);
      // tiny build/audio stamp for troubleshooting on real devices
      const st = GOL.audio.ctx ? GOL.audio.ctx.state : 'off';
      GOL.text(ctx, (GOL.VERSION || '') + ' · sound ' + st, 12, H - 14, { size: 10, weight: '600', color: 'rgba(255,255,255,0.45)', align: 'left', shadow: false });
      GOL.drawVignette(ctx, W, H, 0.12);
    }
  };
  GOL.registerScene('title', title);

  // A tiny meadow flower for the map's memory blooms.
  function drawMapFlower(ctx, x, y, r, t, color) {
    ctx.save();
    ctx.translate(x, y);
    const sway = Math.sin(t * 1.5 + x * 0.1) * 0.08;
    ctx.rotate(sway);
    ctx.strokeStyle = '#6DA84E';
    ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 4); ctx.quadraticCurveTo(0.5, -r * 0.4, 0, -r * 0.9); ctx.stroke();
    ctx.translate(0, -r * 1.15);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + t * 0.12;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.42, r * 0.24, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#FFF3C4';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ================================================================== MAP ==
  // The world map is itself a little walk: hold → / ← (or the same walk
  // buttons as the gardens) and the wanderer strolls the stone path between
  // levels. Coming to rest on a garden's disc walks in; taps still work as
  // a shortcut. Worlds come from GOL.WORLDS — gateway arches at the map's
  // edges lead to the neighbouring worlds, so a new world needs no map code.
  const GATE_DS = 0.55; // how far past the end discs the gateways stand (in path units)
  const map = {
    t: 0, fx: null, bd: null, buttons: [], wIndex: -1, wd: null,
    s: 0, token: 0, tokenX: 0, tokenY: 0, facing: 1, vpx: 0,
    walkTarget: null, _arrived: true, pendingEnter: null,
    celebrateT: 0, celebrateNode: -1, celebrateGate: false,
    missNode: -1, flyX: 0, flyY: 0, panelNode: -1, _panel: null,
    enter(params) {
      params = params || {};
      this.t = 0;
      this.fx = this.fx || GOL.makeFx();
      const unlocked = GOL.store.data.unlocked;
      const maxG = GOL.LEVELS.length - 1;
      let focusG = params.focus != null ? params.focus
        : params.celebrate != null ? params.celebrate
        : Math.min(unlocked, maxG);
      focusG = Math.max(0, Math.min(maxG, focusG));
      // a celebration anchors the map to the finished garden's world, even
      // when the focus (the next garden) lies through the gateway
      const anchorG = params.celebrate != null ? Math.max(0, Math.min(maxG, params.celebrate)) : focusG;
      const wIndex = params.world != null ? params.world : GOL.worldOfLevel(anchorG);
      this.wd = GOL.WORLDS[wIndex];
      if (this.wIndex !== wIndex) {
        this.bd = buildBackdrop(this.wd.palette, this.wd.seed);
        this.wIndex = wIndex;
      }
      const N = this.wd.levels.length;
      const nextW = GOL.WORLDS[wIndex + 1];
      const nextOpen = !!(nextW && GOL.store.isOpen(nextW.levels[0]));
      this.walkTarget = null;
      this.pendingEnter = null;
      this.panelNode = -1;
      this._panel = null;
      this._gateGo = false;
      this.celebrateT = 0;
      this.celebrateNode = -1;
      this.celebrateGate = false;
      let spawn = this.wd.levels.indexOf(focusG);
      if (spawn < 0) spawn = 0;
      if (params.celebrate != null) {
        const cl = this.wd.levels.indexOf(params.celebrate);
        this.celebrateT = 2.6;
        this.celebrateNode = cl;
        if (GOL.audio) GOL.audio.sfx('unlockLevel');
        if (cl >= 0) {
          spawn = Math.min(cl + 1, N - 1);
          // finishing a world's last garden opens the way onward
          if (cl === N - 1 && nextOpen) this.celebrateGate = true;
        }
      }
      this.s = spawn;
      this.facing = 1;
      // stepping through a gateway: appear at that edge and stroll in
      if (params.edge === 'left') { this.s = -GATE_DS + 0.05; this.walkTarget = { s: 0, enter: false }; }
      else if (params.edge === 'right') { this.s = N - 1 + GATE_DS - 0.05; this.walkTarget = { s: N - 1, enter: false }; this.facing = -1; }
      this.token = Math.max(0, Math.min(N - 1, Math.round(this.s)));
      this._arrived = true; // standing where you spawned shouldn't walk in
      // a completed garden not walked in a while quietly asks to be heard
      this.missNode = -1;
      let oldest = Infinity;
      this.wd.levels.forEach((g, i) => {
        const st = GOL.store.level(GOL.LEVELS[g].surahId);
        if (!st.completed) return;
        const age = Date.now() - (st.lastPlayed || 0);
        if (age > 20 * 3600 * 1000 && (st.lastPlayed || 0) < oldest) {
          oldest = st.lastPlayed || 0;
          this.missNode = i;
        }
      });
      this._flyInit = false;
      if (GOL.audio && GOL.audio.unlocked) GOL.audio.startAmbience('garden');
    },
    exit() {
      GOL.Input.zones = null;
    },
    // Discs, gateways and roaming limits for the current world, laid out for
    // this screen. Disc i sits at path position s = i; gateways stand GATE_DS
    // beyond the end discs.
    layout(W, H) {
      const N = this.wd.levels.length;
      const nodes = [];
      for (let i = 0; i < N; i++) {
        const fx = N > 1 ? 0.12 + (i / (N - 1)) * 0.76 : 0.5;
        nodes.push({ i, g: this.wd.levels[i], x: W * fx, y: H * (0.6 + Math.sin(i * 1.9 + 0.6) * 0.075) });
      }
      const gateL = this.wIndex > 0
        ? { s: -GATE_DS, x: W * 0.045, y: nodes[0].y - 28, open: true, world: this.wIndex - 1, name: GOL.WORLDS[this.wIndex - 1].name }
        : null;
      let gateR = null;
      if (this.wIndex < GOL.WORLDS.length - 1) {
        const nw = GOL.WORLDS[this.wIndex + 1];
        gateR = { s: N - 1 + GATE_DS, x: W * 0.955, y: nodes[N - 1].y - 28, open: GOL.store.isOpen(nw.levels[0]), world: this.wIndex + 1, name: nw.name };
      }
      // how far along the path the wanderer may roam
      let lastOpen = 0;
      this.wd.levels.forEach((g, i) => { if (GOL.store.isOpen(g)) lastOpen = i; });
      let maxS = lastOpen;
      if (lastOpen === N - 1 && gateR) maxS = gateR.open ? gateR.s : N - 1 + GATE_DS * 0.5;
      return { nodes, gateL, gateR, N, minS: gateL ? gateL.s : 0, maxS };
    },
    // feet position along the walking path (discs, stones, gateway stubs)
    pos(s, lay) {
      const nodes = lay.nodes, N = lay.N;
      if (s < 0 && lay.gateL) {
        const k = Math.min(1, -s / GATE_DS);
        const a = nodes[0], ay = a.y - 26;
        return { x: a.x + (lay.gateL.x - a.x) * k, y: ay + (lay.gateL.y - ay) * k + Math.sin(k * Math.PI) * 5 };
      }
      if (s > N - 1 && lay.gateR) {
        const k = Math.min(1, (s - (N - 1)) / GATE_DS);
        const a = nodes[N - 1], ay = a.y - 26;
        return { x: a.x + (lay.gateR.x - a.x) * k, y: ay + (lay.gateR.y - ay) * k + Math.sin(k * Math.PI) * 5 };
      }
      if (N < 2) return { x: nodes[0].x, y: nodes[0].y - 26 };
      const i = Math.max(0, Math.min(N - 2, Math.floor(s)));
      const k = Math.min(1, Math.max(0, s - i));
      const a = nodes[i], b = nodes[i + 1];
      const ee = Math.pow(Math.abs(k - 0.5) * 2, 1.5); // 1 at the discs, 0 mid-path
      return {
        x: a.x + (b.x - a.x) * k,
        y: a.y + (b.y - a.y) * k + Math.sin(k * Math.PI) * 14 - 8 - 18 * ee
      };
    },
    // pixels per path unit where the wanderer currently stands
    pxPerUnit(lay) {
      const nodes = lay.nodes, N = lay.N;
      if (this.s < 0 && lay.gateL) return Math.max(60, GOL.dist(nodes[0].x, nodes[0].y - 26, lay.gateL.x, lay.gateL.y) / GATE_DS);
      if (this.s > N - 1 && lay.gateR) return Math.max(60, GOL.dist(nodes[N - 1].x, nodes[N - 1].y - 26, lay.gateR.x, lay.gateR.y) / GATE_DS);
      if (N < 2) return 200;
      const i = Math.max(0, Math.min(N - 2, Math.floor(this.s)));
      return Math.max(60, GOL.dist(nodes[i].x, nodes[i].y, nodes[i + 1].x, nodes[i + 1].y));
    },
    // coming to rest on a disc: a fresh garden walks in, a finished one
    // offers its ways, a sleeping bud only stirs
    arrive(nLocal, quick) {
      const gi = this.wd.levels[nLocal];
      if (!GOL.store.isOpen(gi)) { GOL.audio.sfx('drift'); return; }
      if (GOL.store.level(GOL.LEVELS[gi].surahId).completed) {
        this.panelNode = nLocal;
        GOL.audio.sfx('land');
      } else {
        this.pendingEnter = { at: this.t + (quick ? 0.1 : 0.55), dur: quick ? 0.1 : 0.55, index: gi, node: nLocal };
        GOL.audio.sfx('land');
      }
    },
    goThrough(side) {
      if (this._gateGo) return;
      this._gateGo = true;
      GOL.audio.sfx('unlockLevel');
      GOL.go('map', { world: this.wIndex + side, edge: side > 0 ? 'left' : 'right' });
    },
    update(dt, W, H) {
      this.t += dt;
      this.fx.update(dt);
      const lay = this.layout(W, H);
      const nodes = lay.nodes;
      if (Math.random() < dt * 2) this.fx.spawn('mote', Math.random() * W, H * (0.25 + Math.random() * 0.55), {});
      if (this.celebrateT > 0) {
        this.celebrateT -= dt;
        const N = nodes[this.celebrateNode];
        if (N && Math.random() < dt * 14) this.fx.burst(N.x + GOL.rnd(-16, 16), N.y + GOL.rnd(-16, 16), GOL.GEMS[N.g % 7].base, 5);
        if (N && Math.random() < dt * 10) {
          this.fx.spawn('petal', N.x + GOL.rnd(-60, 60), N.y - 80, { color: Math.random() < 0.5 ? '#F5B8C4' : '#FFE9A8' });
        }
        if (N && this.celebrateT <= 0) GOL.audio.sfx('bloom');
      }
      // the opened gateway sparkles its invitation
      if (this.celebrateGate && lay.gateR && Math.random() < dt * 7) {
        this.fx.spawn('sparkle', lay.gateR.x + GOL.rnd(-30, 30), lay.gateR.y - GOL.rnd(10, 90), { color: '#FFE9A8' });
      }
      if (this.pendingEnter && this.t >= this.pendingEnter.at) {
        const idx = this.pendingEnter.index;
        this.pendingEnter = null;
        GOL.go('level', { index: idx });
        return;
      }
      // the firefly rests on the garden that misses its child, else keeps
      // the wanderer company
      // ---- walking the path (keyboard, or the same touch buttons as levels)
      const Input = GOL.Input;
      Input.zones = {
        btnL: { x: 78, y: H - 74, r: 62 },
        btnR: { x: 208, y: H - 74, r: 62 },
        jumpX: Infinity // no jumping on the map
      };
      Input.poll(W, H);
      Input.consumeJump(); // swallow stray jump presses so levels don't inherit them
      let dir = (Input.right ? 1 : 0) - (Input.left ? 1 : 0);
      if (dir !== 0) {
        // hands on the controls take over from any scripted walk
        this.walkTarget = null;
        this.pendingEnter = null;
        this.panelNode = -1;
        this._panel = null;
        this._arrived = false;
      } else if (this.walkTarget) {
        dir = Math.sign(this.walkTarget.s - this.s) || 0;
      }
      const prevPos = this.pos(this.s, lay);
      if (dir !== 0) {
        this.facing = dir;
        const step = dir * ((this.walkTarget ? 300 : 215) / this.pxPerUnit(lay)) * dt;
        if (this.walkTarget) {
          const d = this.walkTarget.s - this.s;
          if (Math.abs(d) <= Math.abs(step)) {
            this.s = this.walkTarget.s;
            const wt = this.walkTarget;
            this.walkTarget = null;
            this._arrived = true;
            if (lay.gateL && this.s <= lay.gateL.s + 0.01) return this.goThrough(-1);
            if (lay.gateR && lay.gateR.open && this.s >= lay.gateR.s - 0.01) return this.goThrough(1);
            const n = Math.round(this.s);
            if (n >= 0 && n < lay.N && Math.abs(this.s - n) < 0.02) {
              this.token = n;
              if (wt.enter) this.arrive(n, true);
            }
          } else this.s += step;
        } else {
          this.s = Math.max(lay.minS, Math.min(lay.maxS, this.s + step));
          this.token = Math.max(0, Math.min(lay.N - 1, Math.round(this.s)));
          // walking through an open gateway
          if (lay.gateL && this.s <= lay.gateL.s + 0.005) return this.goThrough(-1);
          if (lay.gateR && lay.gateR.open && this.s >= lay.gateR.s - 0.005) return this.goThrough(1);
        }
      } else if (!this._arrived) {
        // hands off near a disc: settle onto it and walk in
        const n = Math.max(0, Math.min(lay.N - 1, Math.round(this.s)));
        if (Math.abs(n - this.s) < 0.3) {
          this.s += (n - this.s) * Math.min(1, dt * 9);
          if (Math.abs(n - this.s) < 0.005) {
            this.s = n;
            this._arrived = true;
            this.token = n;
            this.arrive(n, false);
          }
        } else this._arrived = true; // resting between discs is fine too
      }
      const p = this.pos(this.s, lay);
      this.vpx = (p.x - prevPos.x) / Math.max(dt, 0.001);
      this.tokenX = p.x;
      this.tokenY = p.y + 26; // disc-centre line (the sprite's feet sit 26 above)
      // the firefly rests on the garden that misses its child, else keeps
      // the wanderer company
      {
        const nds = nodes;
        const target = this.missNode >= 0 ? nds[this.missNode] : null;
        const tx = target ? target.x + Math.sin(this.t * 1.4) * 12 : this.tokenX + 34 + Math.sin(this.t * 1.3) * 8;
        const ty = target ? target.y - 58 + Math.sin(this.t * 2.2) * 7 : this.tokenY - 64 + Math.sin(this.t * 2.1) * 7;
        if (!this._flyInit) { this.flyX = tx; this.flyY = ty; this._flyInit = true; }
        this.flyX += (tx - this.flyX) * Math.min(1, dt * 2.4);
        this.flyY += (ty - this.flyY) * Math.min(1, dt * 2.4);
        if (target && Math.random() < dt * 2.4) {
          this.fx.spawn('sparkle', target.x + GOL.rnd(-26, 26), target.y - GOL.rnd(10, 50), { color: '#FFE9A8' });
        }
      }
      // buttons (the book moved up top so the walk buttons own the corner)
      this.buttons = [
        Object.assign({}, GOL.muteButton(W)),
        { x: 40, y: 40, r: 30, iconName: 'book', fn: () => GOL.go('room') }
      ];
      if (GOL.hitButtons(GOL.Input.taps, this.buttons)) return;
      // the ways-into-a-surah panel (walk · star walk · trial · story · match)
      if (this.panelNode != null && this.panelNode >= 0) {
        const n = nodes[this.panelNode];
        const gi = n.g;
        const py = n.y - 150 < 130 ? n.y + 118 : n.y - 150;
        const modes = [
          { icon: 'play', label: 'walk', fn: () => GOL.go('level', { index: gi }) },
          { icon: 'star', label: 'star walk', fn: () => GOL.go('level', { index: gi, recall: true }) },
          { icon: 'moon', label: 'trial', fn: () => GOL.go('trial', { index: gi }) },
          { icon: 'story', label: 'story', fn: () => GOL.go('story', { index: gi }) },
          { icon: 'match', label: 'meanings', fn: () => GOL.go('meanings', { index: gi }) }
        ];
        const bx = Math.max(200, Math.min(W - 200, n.x));
        this._panel = { x: bx, y: py, modes, node: n.i };
        let consumed = false;
        for (const tap of GOL.Input.taps) {
          if (tap.ui) continue;
          modes.forEach((m, mi) => {
            const mx = bx + (mi - 2) * 64;
            if (GOL.dist(tap.x, tap.y, mx, py + 26) < 30) {
              tap.ui = true;
              consumed = true;
              GOL.audio.sfx('tap');
              this.panelNode = -1;
              this._panel = null;
              m.fn();
            }
          });
          if (!tap.ui) {
            // tapping anywhere else closes the panel (and may do other things)
            this.panelNode = -1;
            this._panel = null;
          }
        }
        if (consumed) return;
      } else this._panel = null;

      // grown-ups link (text hit area)
      for (const tap of GOL.Input.taps) {
        if (tap.ui) continue;
        if (tap.x > W - 190 && tap.y > H - 64) {
          tap.ui = true;
          GOL.go('parents');
          return;
        }
        // gateway taps: stroll over and step through
        for (const g of [lay.gateL, lay.gateR]) {
          if (g && GOL.dist(tap.x, tap.y, g.x, g.y - 44) < 54) {
            tap.ui = true;
            if (!g.open) { GOL.audio.sfx('drift'); return; }
            this.walkTarget = { s: g.s, enter: false };
            this.pendingEnter = null;
            this.panelNode = -1;
            this._panel = null;
            GOL.audio.sfx('tap');
            return;
          }
        }
        // disc taps still work: walk over, and in
        for (const n of nodes) {
          if (GOL.dist(tap.x, tap.y, n.x, n.y) < 44) {
            tap.ui = true;
            if (!GOL.store.isOpen(n.g)) { GOL.audio.sfx('drift'); return; }
            // debug: no walk, no wait — every garden offers all its ways at once
            if (GOL.DEBUG) {
              this.walkTarget = null;
              this.pendingEnter = null;
              this.s = n.i;
              this.token = n.i;
              this._arrived = true;
              this.panelNode = n.i;
              GOL.audio.sfx('tap');
              return;
            }
            if (Math.abs(this.s - n.i) < 0.05 && !this.walkTarget) {
              // a completed garden offers its ways; a fresh one begins at once
              if (GOL.store.level(GOL.LEVELS[n.g].surahId).completed) {
                this.panelNode = n.i;
                GOL.audio.sfx('tap');
              } else {
                this.pendingEnter = { at: 0, dur: 0.1, index: n.g, node: n.i };
              }
            } else {
              this.walkTarget = { s: n.i, enter: true };
              this.pendingEnter = null;
              this.panelNode = -1;
              this._panel = null;
              GOL.audio.sfx('tap');
            }
            return;
          }
        }
      }
    },
    draw(ctx, W, H) {
      const t = this.t;
      GOL.drawBackdrop(ctx, this.bd, W, H, t, 30 + t * 4, 0.52);
      const lay = this.layout(W, H);
      const nodes = lay.nodes;
      // banner
      GOL.drawPanel(ctx, W / 2 - 210, 22, 420, 64, { radius: 30 });
      GOL.text(ctx, this.wd.name, W / 2, 50, { size: 24, weight: '800' });
      GOL.text(ctx, this.wd.sub, W / 2, 72, { size: 13, weight: '600', color: INK_SOFT });
      // the winding path: little stones between nodes
      ctx.save();
      for (let i = 0; i < nodes.length - 1; i++) {
        const a = nodes[i], b = nodes[i + 1];
        const steps = 7;
        for (let s = 1; s < steps; s++) {
          const k = s / steps;
          const px = a.x + (b.x - a.x) * k;
          const py = a.y + (b.y - a.y) * k + Math.sin(k * Math.PI) * 14;
          const done = this.wd.levels[i] < GOL.store.data.unlocked;
          ctx.fillStyle = done ? alpha('#F0E7CC', 0.9) : alpha('#F0E7CC', 0.38);
          ctx.beginPath();
          ctx.ellipse(px, py, 7, 4.5, (s % 3 - 1) * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // stepping stones out to the gateways
      for (const g of [lay.gateL, lay.gateR]) {
        if (!g) continue;
        const a = g === lay.gateL ? nodes[0] : nodes[nodes.length - 1];
        for (let s = 1; s <= 3; s++) {
          const k = s / 4;
          const px = a.x + (g.x - a.x) * k;
          const py = (a.y - 26) + (g.y - (a.y - 26)) * k + Math.sin(k * Math.PI) * 5 + 26;
          ctx.fillStyle = alpha('#F0E7CC', g.open ? 0.85 : 0.3);
          ctx.beginPath();
          ctx.ellipse(px, py, 7, 4.5, (s % 3 - 1) * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      // gateway arches to the neighbouring worlds
      for (const g of [lay.gateL, lay.gateR]) {
        if (!g) continue;
        const glow = g.open ? 0.35 + 0.18 * Math.sin(t * 2.1) + (this.celebrateGate && g === lay.gateR ? 0.3 : 0) : 0.04;
        ctx.save();
        ctx.translate(g.x, g.y + 28);
        ctx.scale(0.52, 0.52);
        GOL.drawArch(ctx, 0, 0, t, this.bd.P, g.open ? 0.16 + 0.05 * Math.sin(t * 1.7) : 0, glow);
        ctx.restore();
        // a whisper of where the door leads, when the wanderer draws near
        const near = Math.abs(this.s - g.s) < 1 || (this.celebrateGate && g === lay.gateR);
        if (near) {
          GOL.text(ctx, g.open ? g.name : 'this doorway is still growing…', g.x + (g === lay.gateL ? 26 : -26), g.y - 92,
            { size: 13, weight: '700', color: alpha('#FFFFFF', g.open ? 0.7 + 0.25 * Math.sin(t * 2.4) : 0.55), align: g === lay.gateL ? 'left' : 'right' });
        }
      }
      // nodes
      for (const n of nodes) {
        const L = GOL.LEVELS[n.g];
        const st = GOL.store.level(L.surahId);
        const isDone = st.completed;
        const isOpen = GOL.store.isOpen(n.g);
        // memory blooms: every completion grows another flower at its node
        const blooms = Math.min(7, st.heardFull || 0);
        for (let f = 0; f < blooms; f++) {
          const a = (f / 7) * Math.PI + Math.PI; // arc above-ish the disc
          const fxp = n.x + Math.cos(a + 0.35) * (40 + (f % 2) * 9);
          const fyp = n.y + 30 + Math.sin(a * 1.7 + f) * 5 - (f % 2) * 3;
          drawMapFlower(ctx, fxp, fyp, 5.5 + (f % 3), t + f, f % 2 ? '#F5B8C4' : '#F0C878');
        }
        // stone disc
        ctx.fillStyle = alpha('#3E5340', 0.18);
        ctx.beginPath(); ctx.ellipse(n.x + 2, n.y + 26, 30, 9, 0, 0, Math.PI * 2); ctx.fill();
        const dg = ctx.createLinearGradient(n.x, n.y - 30, n.x, n.y + 30);
        dg.addColorStop(0, isOpen ? '#F5EDD4' : '#C9C2AC');
        dg.addColorStop(1, isOpen ? '#D8CBA6' : '#A8A28C');
        ctx.fillStyle = dg;
        ctx.beginPath(); ctx.arc(n.x, n.y, 30, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = alpha(isOpen ? GOLD : '#8C8672', 0.8);
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(n.x, n.y, 27, 0, Math.PI * 2); ctx.stroke();
        if (isDone) {
          GOL.drawGem(ctx, n.x, n.y, 15, GOL.GEMS[n.g % 7], t, { phase: n.g, glow: 0.8 });
        } else if (isOpen) {
          const p = 0.7 + 0.3 * Math.sin(t * 2.4 + n.i);
          GOL.star8Path(ctx, n.x, n.y, 13, Math.PI / 8);
          ctx.fillStyle = alpha('#F0C878', 0.35 + 0.4 * p);
          ctx.fill();
          ctx.strokeStyle = alpha(GOLD, 0.9);
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          // a closed bud for what's still to come
          ctx.fillStyle = '#96A382';
          ctx.beginPath(); ctx.ellipse(n.x, n.y + 2, 7, 11, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#7E8F6E';
          ctx.beginPath(); ctx.ellipse(n.x - 4, n.y + 3, 4, 9, 0.5, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(n.x + 4, n.y + 3, 4, 9, -0.5, 0, Math.PI * 2); ctx.fill();
        }
        // the hidden blossom, once found, blooms gold at the node's brow
        if (st.blossom) {
          GOL.drawRahmaBlossom(ctx, n.x + 24, n.y - 26, 6.5, t + n.i);
        }
        // the remembering moon, waxing with every trial known by heart
        if (isDone && (st.moon || 0) > 0.01) {
          GOL.drawMoon(ctx, n.x - 25, n.y - 26, 8.5, st.moon, t, { glow: false });
        }
        // a garden that misses its child glows softly
        if (n.i === this.missNode) {
          ctx.strokeStyle = alpha('#FFE9A8', 0.35 + 0.3 * Math.sin(t * 2.2));
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(n.x, n.y, 37 + Math.sin(t * 2.2) * 3, 0, Math.PI * 2); ctx.stroke();
        }
        // the walking-in ring: a fresh garden opens as the wanderer stands
        if (this.pendingEnter && this.pendingEnter.node === n.i) {
          const pe = this.pendingEnter;
          const k = Math.max(0, Math.min(1, 1 - (pe.at - t) / (pe.dur || 0.55)));
          ctx.strokeStyle = alpha('#FFE9A8', 0.85);
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 36, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2);
          ctx.stroke();
        }
        // label under the disc the wanderer is standing on
        if (n.i === this.token && Math.abs(this.s - n.i) < 0.12 && (this.panelNode == null || this.panelNode < 0)) {
          GOL.drawPanel(ctx, n.x - 120, n.y + 44, 240, 62, { radius: 16, plain: true });
          GOL.text(ctx, L.surah.englishName, n.x, n.y + 66, { size: 19, weight: '800' });
          GOL.text(ctx, L.title + ' · ' + L.surah.verses.length + ' gems', n.x, n.y + 88, { size: 13, weight: '600', color: INK_SOFT });
          if (st.completed) GOL.text(ctx, 'tap again for more ways in', n.x, n.y + 118, { size: 12, weight: '700', color: alpha('#FFFFFF', 0.55 + 0.25 * Math.sin(t * 2.4)) });
        }
      }
      // the ways-in panel for a completed surah
      if (this._panel) {
        const p = this._panel;
        const L = GOL.LEVELS[this.wd.levels[p.node]];
        GOL.drawPanel(ctx, p.x - 186, p.y - 24, 372, 116, { radius: 22 });
        GOL.text(ctx, L.surah.englishName, p.x, p.y - 2, { size: 16, weight: '800' });
        p.modes.forEach((m, mi) => {
          const mx = p.x + (mi - 2) * 64;
          GOL.drawButton(ctx, mx, p.y + 26, 22, m.icon);
          GOL.text(ctx, m.label, mx, p.y + 62, { size: 11, weight: '700', color: INK_SOFT });
        });
      }
      // the gentle call home
      if (this.missNode >= 0) {
        const L = GOL.LEVELS[this.wd.levels[this.missNode]];
        GOL.text(ctx, L.surah.englishName + ' would love to hear you again', W / 2, 108,
          { size: 14.5, weight: '700', color: alpha('#FFFFFF', 0.72 + 0.2 * Math.sin(t * 2)) });
      }
      // the wanderer, walking the path
      const walking = Math.abs(this.vpx) > 20;
      GOL.drawSprite(ctx, this.tokenX, this.tokenY - 26, {
        vx: this.vpx, vy: 0, grounded: true, facing: this.facing, t,
        idleT: walking ? 0 : 1 + (t % 3),
        blink: Math.sin(t * 0.9 + 2) > 0.985,
        squashX: 1, squashY: 1, moving: walking
      });
      // Noor the firefly
      GOL.drawFirefly(ctx, this.flyX, this.flyY, t + 1.4, this.missNode >= 0 ? 1.25 : 1);
      this.fx.draw(ctx);
      // corner chrome
      for (const b of this.buttons) GOL.drawButton(ctx, b.x, b.y, b.r > 30 ? 26 : 22, b.icon ? b.icon() : b.iconName);
      GOL.text(ctx, 'Recitation Room', 78, 40, { size: 12.5, weight: '700', color: alpha('#FFFFFF', 0.85), align: 'left' });
      GOL.text(ctx, 'for grown-ups', W - 96, H - 34, { size: 13, weight: '600', color: alpha('#FFFFFF', 0.6), align: 'center' });
      // how to wander: soft touch buttons, or a soft keyboard whisper
      if (GOL.Input.touchMode) GOL.drawTouchControls(ctx, W, H, GOL.Input, false);
      else if (this.t < 7) {
        GOL.text(ctx, '← → to walk the path', W / 2, H - 26,
          { size: 14, weight: '700', color: alpha('#FFFFFF', 0.55 + 0.25 * Math.sin(t * 2.2)) });
      }
      GOL.drawVignette(ctx, W, H, 0.12);
    }
  };
  GOL.registerScene('map', map);
})();
