// Gems of Light v3 — parent-preview.js
// A tiny, disposable garden for a grown-up to try before preparing the real
// journey. Everything in this scene is local scene state: no save is read or
// written, so the child's first gem remains entirely theirs.
(function () {
  const GOL = window.GOL;
  const { alpha } = GOL.color;

  const GEM = GOL.GEMS[0];

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function roundedCard(ctx, x, y, w, h) {
    ctx.save();
    ctx.shadowColor = 'rgba(24,48,38,0.22)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 9;
    ctx.fillStyle = 'rgba(255,251,237,0.96)';
    GOL.roundRect(ctx, x, y, w, h, 24); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(185,138,62,0.62)';
    ctx.lineWidth = 1.5;
    GOL.roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 23); ctx.stroke();
    ctx.restore();
  }

  function pill(ctx, b, label, primary) {
    ctx.save();
    ctx.fillStyle = primary ? '#3E6C4A' : 'rgba(255,255,255,0.78)';
    GOL.roundRect(ctx, b.x, b.y, b.w, b.h, b.h / 2); ctx.fill();
    ctx.strokeStyle = primary ? 'rgba(255,255,255,0.2)' : 'rgba(62,83,64,0.24)';
    ctx.lineWidth = 1.5;
    GOL.roundRect(ctx, b.x + 0.75, b.y + 0.75, b.w - 1.5, b.h - 1.5, b.h / 2); ctx.stroke();
    GOL.text(ctx, label, b.x + b.w / 2, b.y + b.h / 2, {
      size: Math.min(17, b.h * 0.36), weight: '800',
      color: primary ? '#FFF9E8' : '#3E5340', shadow: false
    });
    ctx.restore();
  }

  function hit(t, b) {
    return t.x >= b.x && t.x <= b.x + b.w && t.y >= b.y && t.y <= b.y + b.h;
  }

  function drawFlower(ctx, x, y, k, t, phase) {
    if (k <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k);
    ctx.rotate(Math.sin(t * 1.4 + phase) * 0.04);
    ctx.strokeStyle = '#5F954D';
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(0, 3); ctx.quadraticCurveTo(-2, -12, 0, -25); ctx.stroke();
    ctx.translate(0, -27);
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 + t * 0.05;
      ctx.fillStyle = i % 2 ? '#F7C6CF' : '#FFF2D0';
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 7, Math.sin(a) * 7, 7, 3.8, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#E9B956';
    ctx.beginPath(); ctx.arc(0, 0, 3.7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawNoor(ctx, fromX, toX, y, t, strength) {
    const span = toX - fromX;
    if (Math.abs(span) < 20) return;
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const p = (t * 0.14 + i / 6) % 1;
      const x = fromX + span * p;
      const yy = y - 30 - Math.sin(p * Math.PI) * 24 + Math.sin(t * 2 + i) * 3;
      const a = Math.sin(p * Math.PI) * (0.2 + 0.48 * strength);
      const g = ctx.createRadialGradient(x, yy, 0, x, yy, 11);
      g.addColorStop(0, alpha('#FFF9D9', a));
      g.addColorStop(1, alpha('#FFF9D9', 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, yy, 11, 0, Math.PI * 2); ctx.fill();
      GOL.star8(ctx, x, yy, 2.2 + a * 2, t * 0.25, alpha('#FFFDF0', a));
    }
    ctx.restore();
  }

  const scene = {
    ownsPortrait: true,
    t: 0,
    fx: null,
    bd: null,
    player: null,
    targetX: null,
    collected: 0,
    collectT: -1,
    recitationDone: true,
    bloom: 0,
    cardOpen: false,
    cardRound: 0,
    layout: null,

    enter() {
      this.t = 0;
      this.fx = GOL.makeFx();
      this.bd = GOL.buildBackdrop('falaq', 713);
      this.player = {
        x: 0, vx: 0, facing: 1, t: 0, idleT: 0, grounded: true,
        moving: false, squashX: 1, squashY: 1, blink: false, groundDist: 0
      };
      this.targetX = null;
      this.collected = 0;
      this.collectT = -1;
      this.recitationDone = true;
      this.bloom = 0;
      this.cardOpen = false;
      this.cardRound = 0;
      this.layout = null;
      GOL.Input.zones = null;
    },

    exit() {
      GOL.Input.zones = null;
      if (GOL.audio && GOL.audio.stopRecitation) GOL.audio.stopRecitation();
    },

    geometry(W, H) {
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
      const portrait = H > W;
      const groundY = H * (portrait ? 0.70 : 0.76);
      const left = 28 + sa.l, right = W - 28 - sa.r;
      if (!this.player.x) this.player.x = left + (right - left) * 0.18;
      // Keep "continue exploring" genuinely alive after either card: later
      // gems alternate across the clearing instead of respawning underfoot.
      const gemP = this.collected === 0 ? 0.65 : (this.collected % 2 ? 0.82 : 0.46);
      const gemX = left + (right - left) * gemP;
      const cardW = Math.min(portrait ? W - 34 - sa.l - sa.r : 510, W - 34 - sa.l - sa.r);
      const cardH = portrait ? 250 : Math.min(218, H - 44 - sa.t - sa.b);
      const cardX = (W - cardW) / 2;
      const cardY = clamp(portrait ? H * 0.42 : H * 0.5 - cardH / 2,
        18 + sa.t, H - cardH - 18 - sa.b);
      const gap = 12, pad = 22;
      const stacked = cardW < 440;
      const buttonH = 48;
      const buttonW = stacked ? cardW - pad * 2 : (cardW - pad * 2 - gap) / 2;
      const buttonY = cardY + cardH - pad - buttonH;
      const continueBtn = { x: cardX + pad, y: stacked ? buttonY - buttonH - gap : buttonY, w: buttonW, h: buttonH };
      const setupBtn = { x: stacked ? cardX + pad : cardX + pad + buttonW + gap, y: buttonY, w: buttonW, h: buttonH };
      return {
        sa, portrait, groundY, left, right, gemX,
        back: { x: 38 + sa.l, y: 38 + sa.t, r: 28 },
        card: { x: cardX, y: cardY, w: cardW, h: cardH },
        continueBtn, setupBtn, stacked
      };
    },

    leave() {
      if (GOL.onboarding && GOL.onboarding.open) GOL.onboarding.open('welcome');
      else GOL.go('onboarding', { stage: 'welcome' });
    },

    finish() {
      if (GOL.onboarding && GOL.onboarding.previewComplete) GOL.onboarding.previewComplete();
      else GOL.go('onboarding', { stage: 'method' });
    },

    update(dt, W, H) {
      this.t += dt;
      const L = (this.layout = this.geometry(W, H));
      const p = this.player;
      p.t += dt;
      p.blink = Math.sin(this.t * 0.71) > 0.985;

      // Back and the grown-up decision card own their taps. Nothing can leak
      // through and make the little wanderer move behind the card.
      for (const tap of GOL.Input.taps) {
        if (tap.ui) continue;
        if (GOL.dist(tap.x, tap.y, L.back.x, L.back.y) < L.back.r + 8) {
          tap.ui = true;
          if (GOL.audio) GOL.audio.sfx('tap');
          this.leave();
          return;
        }
        if (this.cardOpen) {
          tap.ui = true;
          if (hit(tap, L.continueBtn)) {
            if (GOL.audio) GOL.audio.sfx('tap');
            this.cardOpen = false;
            this.cardRound++;
            this.targetX = Math.min(L.gemX - 52, L.right - 52);
          } else if (hit(tap, L.setupBtn)) {
            if (GOL.audio) GOL.audio.sfx('tap');
            this.finish();
          }
          continue;
        }
        // The preview is deliberately forgiving: touching anywhere in the
        // garden gives the lightling a destination. Dragging keeps steering.
        if (tap.y > L.sa.t + 70) {
          tap.ui = true;
          this.targetX = clamp(tap.x, L.left + 10, L.right - 10);
        }
      }

      if (!this.cardOpen) {
        for (const pointer of GOL.Input.pointers.values()) {
          if (pointer.y > L.groundY * 0.42) this.targetX = clamp(pointer.x, L.left + 10, L.right - 10);
        }
        const keys = GOL.Input._keys || {};
        const keyDir = ((keys.ArrowRight || keys.d || keys.D) ? 1 : 0) -
          ((keys.ArrowLeft || keys.a || keys.A) ? 1 : 0);
        if (keyDir) this.targetX = clamp(p.x + keyDir * 90, L.left + 10, L.right - 10);
      }

      let dx = this.targetX == null ? 0 : this.targetX - p.x;
      if (Math.abs(dx) < 3 || this.cardOpen || this.collectT >= 0) dx = 0;
      const desired = clamp(dx * 4, -155, 155);
      p.vx += (desired - p.vx) * Math.min(1, dt * (dx ? 8 : 11));
      p.x = clamp(p.x + p.vx * dt, L.left + 8, L.right - 8);
      p.moving = Math.abs(p.vx) > 7;
      if (p.moving) { p.facing = p.vx > 0 ? 1 : -1; p.idleT = 0; }
      else p.idleT += dt;

      if (this.collectT < 0 && Math.abs(p.x - L.gemX) < 35) {
        this.collectT = 0;
        this.recitationDone = false;
        p.vx = 0;
        p.moving = false;
        p.eyesClosed = true;
        this.fx.burst(L.gemX, L.groundY - 53, GEM.base, 22);
        this.fx.spawn('ring', L.gemX, L.groundY - 53, { color: GEM.glow, size: 18 });
        if (GOL.audio) {
          GOL.audio.chime(this.collected);
          GOL.audio.playVerse(113, Math.min(2, this.collected + 1), () => {
            p.eyesClosed = false;
            this.recitationDone = true;
          });
        } else this.recitationDone = true;
      }

      if (this.collectT >= 0) {
        this.collectT += dt;
        this.bloom += (1 - this.bloom) * Math.min(1, dt * 3.2);
        // Let the ayah own the quiet before adult copy returns. The time cap
        // keeps a broken/offline media element from trapping the preview.
        if (this.collectT > 1.35 && (this.recitationDone || this.collectT > 8)) {
          this.collected++;
          this.collectT = -1;
          this.targetX = null;
          this.cardOpen = true;
          p.eyesClosed = false;
          if (GOL.audio) GOL.audio.sfx('unlockLevel');
        }
      }

      this.fx.update(dt);
      if (Math.random() < dt * 1.8) this.fx.spawn('mote', GOL.rnd(L.left, L.right), GOL.rnd(L.groundY - 170, L.groundY - 35), { color: '#FFF6DC' });
    },

    draw(ctx, W, H) {
      const L = this.layout || this.geometry(W, H);
      const gy = GOL.drawBackdrop(ctx, this.bd, W, H, this.t, this.t * 2, L.portrait ? 0.70 : 0.76);
      L.groundY = gy;

      // A few living plants make the miniature garden respond permanently
      // within this visit; none of this state leaves the scene.
      for (let i = 0; i < 7; i++) {
        const x = L.left + (L.right - L.left) * (0.12 + i * 0.13);
        const earned = i <= this.collected * 3 || (this.collectT >= 0 && i <= 3);
        drawFlower(ctx, x, gy + 2, earned ? this.bloom : 0, this.t, i);
      }

      const gemVisible = this.collectT < 0;
      if (gemVisible) {
        drawNoor(ctx, this.player.x + 18, L.gemX - 8, gy, this.t, 1);
        GOL.drawGem(ctx, L.gemX, gy - 53, 16, GEM, this.t, { phase: this.collected * 1.7, glow: 1 });
      } else {
        // The found gem rises and settles into a tiny memory star above the
        // garden while its ayah sounds.
        const k = GOL.ease.out(clamp(this.collectT / 1.15, 0, 1));
        const gx = L.gemX + (W / 2 - L.gemX) * k;
        const gemY = gy - 53 + (58 + L.sa.t - (gy - 53)) * k - Math.sin(k * Math.PI) * 62;
        GOL.drawGem(ctx, gx, gemY, 16 - k * 5, GEM, this.t, { glow: 1, phase: 0 });
      }

      const ps = this.player;
      GOL.drawSprite(ctx, ps.x, gy, ps);
      this.fx.draw(ctx);

      // Wordless invitation: the ground answers the next touch with a gentle
      // ring. It is visual teaching, not an instruction label.
      if (!this.cardOpen && this.collectT < 0) {
        const pulse = 0.5 + 0.5 * Math.sin(this.t * 2.2);
        ctx.strokeStyle = alpha('#FFF7CE', 0.24 + pulse * 0.25);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(L.gemX, gy - 2, 18 + pulse * 9, 0, Math.PI * 2); ctx.stroke();
      }

      GOL.drawButton(ctx, L.back.x, L.back.y, 23, 'back', { alpha: 0.82 });

      if (this.cardOpen) {
        ctx.fillStyle = 'rgba(35,57,44,0.23)';
        ctx.fillRect(0, 0, W, H);
        const c = L.card;
        roundedCard(ctx, c.x, c.y, c.w, c.h);
        const titleY = c.y + (L.stacked ? 40 : 45);
        GOL.text(ctx, this.cardRound ? 'The garden keeps growing' : 'That is the heart of it', W / 2, titleY, {
          size: L.portrait ? 22 : 24, weight: '900', color: '#36533E', shadow: false
        });
        GOL.text(ctx, 'Explore  →  listen  →  remember', W / 2, titleY + 38, {
          size: L.portrait ? 15 : 17, weight: '700', color: '#6B7D66', shadow: false
        });
        if (!L.stacked) {
          GOL.text(ctx, 'The real journey will begin fresh for your child.', W / 2, titleY + 70, {
            size: 13.5, weight: '700', color: '#7A806F', shadow: false
          });
        }
        pill(ctx, L.continueBtn, 'Continue exploring', false);
        pill(ctx, L.setupBtn, 'Set up for my child', true);
      }
    }
  };

  GOL.registerScene('parentPreview', scene);
})();
