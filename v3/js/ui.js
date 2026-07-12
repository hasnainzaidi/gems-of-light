// Gems of Light v3 — ui.js
// Scene registry, shared UI helpers, and the minimal prototype title screen.
// v3 speaks through animation and environment: the only text on screen during
// play is the Arabic of the ayah itself (and dev chrome on the title page).
(function () {
  const GOL = window.GOL;
  const { alpha, tint, shade } = GOL.color;

  GOL.SCENES = {};
  GOL.registerScene = (name, s) => (GOL.SCENES[name] = s);

  GOL.fonts = {
    ui: 'Nunito, "Trebuchet MS", system-ui, sans-serif',
    ar: '"Scheherazade New", Amiri, "Geeza Pro", "Traditional Arabic", serif'
  };
  const INK = '#3E5340';
  const INK_SOFT = '#6B7D66';
  const GOLD = '#B98A3E';
  GOL.INK = INK; GOL.INK_SOFT = INK_SOFT; GOL.GOLD = GOLD;

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

  // corner chrome respects the phone's safe areas (Dynamic Island sits in
  // the left or right inset in landscape; home indicator in the bottom one)
  GOL.muteButton = function (W) {
    const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
    return {
      x: W - 40 - sa.r, y: 40 + sa.t * 0.5, r: 30,
      icon: () => (GOL.store.data.settings.muted ? 'soundOff' : 'sound'),
      fn: () => {
        const s = GOL.store.data.settings;
        s.muted = !s.muted;
        GOL.audio.setMuted(s.muted);
        GOL.store.save();
      }
    };
  };
  GOL.homeButton = function () {
    const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
    return { x: 40 + sa.l, y: 40 + sa.t * 0.5, r: 30, iconName: 'back', fn: () => GOL.go('title') };
  };

  // Thumbstick + jump-button geometry, in one place so the input reader and
  // the on-screen drawing always agree. Hugs the phone's safe areas.
  GOL.touchZones = function (W, H) {
    const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
    const y = H - 66 - sa.b * 0.5;
    return {
      stick: { x: 76 + sa.l, y, r: 50 },
      jump: { x: W - 72 - sa.r, y, r: 46 }
    };
  };

  // menu backdrop (sky + hills + meadow floor), same as v1's
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
  // Dev-facing doorway into the prototypes. Tap anywhere to begin.
  const title = {
    t: 0, fx: null, bd: null, buttons: [], settingsOpen: false,
    enter() {
      this.t = 0;
      this.fx = GOL.makeFx();
      this.bd = buildBackdrop('falaq', 44);
      this.settingsOpen = false;
    },
    // The tuning rows and their segmented option buttons. One source of
    // geometry, used by both hit-testing and drawing.
    settingsSegs(W, H) {
      const rows = [
        { label: 'ambient echo', opts: ['off', 'near', 'world'], get: () => GOL.V3.echo, set: (v) => { GOL.V3.echo = v; } },
        { label: 'ayah script', opts: ['off', 'on'], get: () => (GOL.V3.arabic ? 'on' : 'off'), set: (v) => { GOL.V3.arabic = (v === 'on'); } },
        { label: 'camera', opts: ['near', 'mid', 'wide'], get: () => (GOL.V3.rows <= 10.5 ? 'near' : GOL.V3.rows >= 12.5 ? 'wide' : 'mid'), set: (v) => { GOL.V3.rows = v === 'near' ? 10 : v === 'wide' ? 13 : 11.5; } }
      ];
      const pw = Math.min(400, W - 60);
      const px = W / 2 - pw / 2;
      const top = H * 0.28;
      const rowH = 44;
      const out = [];
      rows.forEach((row, ri) => {
        const ry = top + 44 + ri * rowH;
        const segAreaX = px + pw * 0.4;
        const segAreaW = pw * 0.52;
        const sw = (segAreaW - (row.opts.length - 1) * 6) / row.opts.length;
        row.opts.forEach((opt, oi) => {
          out.push({
            x: segAreaX + oi * (sw + 6), y: ry - 15, w: sw, h: 30,
            opt, active: row.get() === opt,
            set: () => { row.set(opt); if (GOL.saveV3cfg) GOL.saveV3cfg(); }
          });
        });
        row._lx = px + 18; row._ly = ry;
      });
      return { rows, out, pw, px, top, rowH };
    },
    drawSettings(ctx, W, H) {
      ctx.fillStyle = 'rgba(34,53,42,0.5)';
      ctx.fillRect(0, 0, W, H);
      const s = this.settingsSegs(W, H);
      const panelH = 44 + s.rows.length * s.rowH + 24;
      GOL.drawPanel(ctx, s.px, s.top, s.pw, panelH, { radius: 20 });
      GOL.text(ctx, 'tuning', W / 2, s.top + 24, { size: 15, weight: '800', color: GOL.INK });
      for (const row of s.rows) {
        GOL.text(ctx, row.label, row._lx, row._ly, { size: 12.5, weight: '700', color: GOL.INK_SOFT, align: 'left' });
      }
      for (const seg of s.out) {
        GOL.roundRect(ctx, seg.x, seg.y, seg.w, seg.h, 9);
        ctx.fillStyle = seg.active ? 'rgba(185,138,62,0.9)' : 'rgba(120,104,70,0.14)';
        ctx.fill();
        ctx.strokeStyle = seg.active ? 'rgba(185,138,62,0.95)' : 'rgba(150,128,84,0.4)';
        ctx.lineWidth = 1.4; ctx.stroke();
        GOL.text(ctx, seg.opt, seg.x + seg.w / 2, seg.y + seg.h / 2, { size: 11.5, weight: '800', color: seg.active ? '#FFF8E8' : GOL.INK_SOFT });
      }
      GOL.text(ctx, 'tap a chip to change it · tap outside to close', W / 2, s.top + panelH - 13, { size: 10.5, weight: '600', color: GOL.INK_SOFT });
    },
    update(dt, W, H) {
      this.t += dt;
      this.fx.update(dt);
      if (Math.random() < dt * 3) this.fx.spawn('mote', Math.random() * W, H * (0.3 + Math.random() * 0.5), {});
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
      this.buttons = [Object.assign({}, GOL.muteButton(W))];
      this.gearBtn = { x: 40 + sa.l, y: 40 + sa.t * 0.5, r: 30, iconName: 'sliders', fn: () => { this.settingsOpen = !this.settingsOpen; } };
      // one chip per registered prototype — all ten live in this build
      const ids = Object.keys(GOL.PROTOTYPES).map(Number).sort((a, b) => a - b);
      this.protoBtns = ids.map((id, i) => ({
        id, key: GOL.PROTOTYPES[id].key,
        x: W / 2 + (i - (ids.length - 1) / 2) * 64, y: H * 0.64, r: 26,
        fn: () => {
          GOL.audio.unlock();
          GOL.audio.sfx('unlockLevel');
          GOL.go('adventure', { proto: id });
        }
      }));
      // the tuning panel owns all input while it is open
      if (this.settingsOpen) {
        const segs = this.settingsSegs(W, H).out;
        for (const tap of GOL.Input.taps) {
          if (tap.ui) continue;
          tap.ui = true;
          if (GOL.dist(tap.x, tap.y, this.gearBtn.x, this.gearBtn.y) < this.gearBtn.r) { GOL.audio.sfx('tap'); this.settingsOpen = false; break; }
          const seg = segs.find((s) => tap.x >= s.x && tap.x <= s.x + s.w && tap.y >= s.y && tap.y <= s.y + s.h);
          if (seg) { GOL.audio.sfx('tap'); seg.set(); }
          else this.settingsOpen = false; // a tap outside closes it
        }
        return;
      }
      if (GOL.hitButtons(GOL.Input.taps, [this.gearBtn])) return;
      if (GOL.hitButtons(GOL.Input.taps, this.buttons)) return;
      if (GOL.hitButtons(GOL.Input.taps, this.protoBtns)) return;
      for (const tap of GOL.Input.taps) {
        if (!tap.ui && this.t > 0.5) {
          GOL.audio.unlock();
          GOL.audio.sfx('unlockLevel');
          GOL.go('adventure', { proto: GOL.V3.proto });
          return;
        }
      }
    },
    draw(ctx, W, H) {
      const t = this.t;
      const gy = GOL.drawBackdrop(ctx, this.bd, W, H, t, t * 12, 0.8);
      GOL.drawSprite(ctx, W / 2 - 120, gy + 22, {
        vx: 0, vy: 0, grounded: true, facing: 1, t, idleT: 3,
        blink: Math.sin(t * 0.7) > 0.98, squashX: 1, squashY: 1, moving: false
      });
      const gemY = gy - 80 + Math.sin(t * 1.3) * 8;
      GOL.drawGem(ctx, W / 2 + 40, gemY, 32, GOL.GEMS[2], t, { phase: 1 });
      GOL.drawFirefly(ctx, W / 2 + 40 + Math.cos(t * 0.9) * 70, gemY - 16 + Math.sin(t * 1.7) * 26, t, 1);
      this.fx.draw(ctx);
      const ty = H * 0.26;
      GOL.star8(ctx, W / 2 - 150, ty - 6, 6, Math.PI / 8, alpha(GOLD, 0.85));
      GOL.star8(ctx, W / 2 + 150, ty - 6, 6, Math.PI / 8, alpha(GOLD, 0.85));
      GOL.text(ctx, 'Gems of Light', W / 2, ty - 8, { size: Math.min(46, W * 0.06), weight: '800', color: INK });
      GOL.text(ctx, 'جواهر النور', W / 2, ty + 34, { size: 27, ar: true, color: GOLD });
      const proto = GOL.PROTOTYPES[GOL.V3.proto];
      GOL.text(ctx, 'v3 prototype ' + GOL.V3.proto + ' · ' + (proto ? proto.name : '?'), W / 2, ty + 68, { size: 13, weight: '700', color: INK_SOFT });
      // the prototype shelf: every registered world, one chip each
      for (const b of this.protoBtns || []) {
        const isDefault = b.id === GOL.V3.proto;
        ctx.fillStyle = alpha('#FAF4E0', isDefault ? 0.95 : 0.72);
        ctx.beginPath(); ctx.arc(b.x, b.y, 24, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = alpha(GOLD, isDefault ? 0.95 : 0.45);
        ctx.lineWidth = isDefault ? 2.6 : 1.6;
        ctx.beginPath(); ctx.arc(b.x, b.y, 22, 0, Math.PI * 2); ctx.stroke();
        GOL.text(ctx, String(b.id), b.x, b.y + 1, { size: 17, weight: '800', color: isDefault ? INK : INK_SOFT });
        GOL.text(ctx, b.key, b.x, b.y + 38, { size: 10, weight: '700', color: alpha('#FFFFFF', 0.6) });
      }
      const pulse = 0.6 + 0.4 * Math.sin(t * 2.6);
      GOL.text(ctx, 'tap anywhere to begin', W / 2, H * 0.84, { size: 16, weight: '700', color: alpha('#FFFFFF', 0.55 + 0.4 * pulse) });
      for (const b of this.buttons) GOL.drawButton(ctx, b.x, b.y, 22, b.icon ? b.icon() : b.iconName);
      if (this.gearBtn) GOL.drawButton(ctx, this.gearBtn.x, this.gearBtn.y, 22, 'sliders');
      const st = GOL.audio.ctx ? GOL.audio.ctx.state : 'off';
      GOL.text(ctx, 'v3 · sound ' + st + ' · echo ' + GOL.V3.echo, 12 + (GOL.SAFE ? GOL.SAFE.l : 0), H - 12, { size: 10, weight: '600', color: 'rgba(255,255,255,0.45)', align: 'left', shadow: false });
      if (this.settingsOpen) this.drawSettings(ctx, W, H);
      GOL.drawVignette(ctx, W, H, 0.12);
    }
  };
  GOL.registerScene('title', title);
})();
