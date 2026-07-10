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
      GOL.drawVignette(ctx, W, H, 0.12);
    }
  };
  GOL.registerScene('title', title);

  // ================================================================== MAP ==
  const map = {
    t: 0, fx: null, bd: null, buttons: [], token: 0, tokenX: 0, tokenY: 0,
    hopping: null, pendingEnter: null, celebrateT: 0, celebrateNode: -1,
    enter(params) {
      params = params || {};
      this.t = 0;
      this.fx = this.fx || GOL.makeFx();
      this.bd = this.bd || buildBackdrop('ikhlas', 7);
      const unlocked = GOL.store.data.unlocked;
      this.token = Math.min(params.focus != null ? params.focus : unlocked, 5);
      this.hopping = null;
      this.pendingEnter = null;
      if (params.celebrate != null) {
        this.celebrateT = 2.6;
        this.celebrateNode = params.celebrate;
        this.token = Math.min(params.celebrate + 1, 5);
        if (GOL.audio) GOL.audio.sfx('unlockLevel');
      }
      if (GOL.audio && GOL.audio.unlocked) GOL.audio.startAmbience('garden');
    },
    nodes(W, H) {
      const out = [];
      for (let i = 0; i < 6; i++) {
        const fx = 0.12 + i * 0.152;
        out.push({
          i,
          x: W * fx,
          y: H * (0.6 + Math.sin(i * 1.9 + 0.6) * 0.075)
        });
      }
      return out;
    },
    update(dt, W, H) {
      this.t += dt;
      this.fx.update(dt);
      if (Math.random() < dt * 2) this.fx.spawn('mote', Math.random() * W, H * (0.25 + Math.random() * 0.55), {});
      if (this.celebrateT > 0) {
        this.celebrateT -= dt;
        const N = this.nodes(W, H)[this.celebrateNode];
        if (N && Math.random() < dt * 14) this.fx.burst(N.x + GOL.rnd(-16, 16), N.y + GOL.rnd(-16, 16), GOL.GEMS[this.celebrateNode % 7].base, 5);
      }
      const nodes = this.nodes(W, H);
      // token hop animation
      if (this.hopping) {
        this.hopping.t += dt / 0.55;
        const h = this.hopping;
        const a = nodes[h.from], b = nodes[h.to];
        const e = GOL.ease.inOut(Math.min(1, h.t));
        this.tokenX = a.x + (b.x - a.x) * e;
        this.tokenY = a.y + (b.y - a.y) * e - Math.sin(Math.PI * Math.min(1, h.t)) * 46;
        if (h.t >= 1) {
          this.token = h.to;
          this.hopping = null;
          this.pendingEnter = { at: this.t + 0.4, index: this.token };
          GOL.audio.sfx('land');
        }
      } else {
        this.tokenX = nodes[this.token].x;
        this.tokenY = nodes[this.token].y;
      }
      if (this.pendingEnter && this.t >= this.pendingEnter.at) {
        const idx = this.pendingEnter.index;
        this.pendingEnter = null;
        GOL.go('level', { index: idx });
        return;
      }
      // buttons
      this.buttons = [
        Object.assign({}, GOL.muteButton(W)),
        { x: 46, y: H - 46, r: 32, iconName: 'book', fn: () => GOL.go('room') }
      ];
      if (GOL.hitButtons(GOL.Input.taps, this.buttons)) return;
      // grown-ups link (text hit area)
      for (const tap of GOL.Input.taps) {
        if (tap.ui) continue;
        if (tap.x > W - 190 && tap.y > H - 64) {
          tap.ui = true;
          GOL.go('parents');
          return;
        }
        // node taps
        for (const n of nodes) {
          if (GOL.dist(tap.x, tap.y, n.x, n.y) < 44) {
            tap.ui = true;
            if (!GOL.store.isOpen(n.i)) { GOL.audio.sfx('drift'); return; }
            if (n.i === this.token && !this.hopping) {
              this.pendingEnter = { at: 0, index: n.i };
            } else if (!this.hopping) {
              this.hopping = { from: this.token, to: n.i, t: 0 };
              this.pendingEnter = null;
              GOL.audio.sfx('jump');
            }
            return;
          }
        }
      }
    },
    draw(ctx, W, H) {
      const t = this.t;
      GOL.drawBackdrop(ctx, this.bd, W, H, t, 30 + t * 4, 0.52);
      const nodes = this.nodes(W, H);
      // banner
      GOL.drawPanel(ctx, W / 2 - 210, 22, 420, 64, { radius: 30 });
      GOL.text(ctx, 'World One · The Garden', W / 2, 50, { size: 24, weight: '800' });
      GOL.text(ctx, 'six surahs are waiting among the leaves', W / 2, 72, { size: 13, weight: '600', color: INK_SOFT });
      // the winding path: little stones between nodes
      ctx.save();
      for (let i = 0; i < nodes.length - 1; i++) {
        const a = nodes[i], b = nodes[i + 1];
        const steps = 7;
        for (let s = 1; s < steps; s++) {
          const k = s / steps;
          const px = a.x + (b.x - a.x) * k;
          const py = a.y + (b.y - a.y) * k + Math.sin(k * Math.PI) * 14;
          const done = i < GOL.store.data.unlocked;
          ctx.fillStyle = done ? alpha('#F0E7CC', 0.9) : alpha('#F0E7CC', 0.38);
          ctx.beginPath();
          ctx.ellipse(px, py, 7, 4.5, (s % 3 - 1) * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      // nodes
      for (const n of nodes) {
        const L = GOL.LEVELS[n.i];
        const st = GOL.store.level(L.surahId);
        const isDone = st.completed;
        const isOpen = GOL.store.isOpen(n.i);
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
          GOL.drawGem(ctx, n.x, n.y, 15, GOL.GEMS[n.i % 7], t, { phase: n.i, glow: 0.8 });
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
        // label under the token's node
        if (n.i === this.token && !this.hopping) {
          GOL.drawPanel(ctx, n.x - 120, n.y + 44, 240, 62, { radius: 16, plain: true });
          GOL.text(ctx, L.surah.englishName, n.x, n.y + 66, { size: 19, weight: '800' });
          GOL.text(ctx, L.title + ' · ' + L.surah.verses.length + ' gems', n.x, n.y + 88, { size: 13, weight: '600', color: INK_SOFT });
        }
      }
      // the wanderer token
      GOL.drawSprite(ctx, this.tokenX, this.tokenY - 26, {
        vx: 0, vy: 0, grounded: true, facing: 1, t,
        idleT: this.hopping ? 0 : 1 + (t % 3),
        blink: Math.sin(t * 0.9 + 2) > 0.985,
        squashX: 1, squashY: 1, moving: !!this.hopping
      });
      this.fx.draw(ctx);
      // corner chrome
      for (const b of this.buttons) GOL.drawButton(ctx, b.x, b.y, b.r > 30 ? 26 : 22, b.icon ? b.icon() : b.iconName);
      GOL.text(ctx, 'Recitation Room', 84, H - 46, { size: 12.5, weight: '700', color: alpha('#FFFFFF', 0.85), align: 'left' });
      GOL.text(ctx, 'for grown-ups', W - 96, H - 34, { size: 13, weight: '600', color: alpha('#FFFFFF', 0.6), align: 'center' });
      GOL.drawVignette(ctx, W, H, 0.12);
    }
  };
  GOL.registerScene('map', map);
})();
