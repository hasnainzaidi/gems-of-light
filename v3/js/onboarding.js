// Gems of Light v3 — onboarding.js
// The grown-up porch: one calm, canonical journey before the child's first
// garden. Platform differences live only inside the setup card.
(function () {
  'use strict';
  const GOL = window.GOL;
  const { alpha } = GOL.color;
  const STAGES = ['welcome', 'preview', 'knowledge', 'setup', 'handoff'];
  const DRAWABLE = new Set(['welcome', 'knowledge', 'setup', 'handoff']);
  const CREAM = '#FAF4E0', INK = GOL.INK || '#3E5340';
  const SOFT = GOL.INK_SOFT || '#6B7D66', GOLD = '#B98A3E', GOLD_L = '#FFE9A8';
  const q = new URLSearchParams(location.search);

  function qaStage() {
    const s = q.get('onboardingStage');
    return DRAWABLE.has(s) ? s : null;
  }

  function platform() {
    const forced = q.get('installPlatform');
    if (['ios', 'iosChrome', 'iosInApp', 'android', 'desktop'].includes(forced)) return forced;
    const ua = navigator.userAgent || '';
    const ipad = navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1;
    if (/iPad|iPhone|iPod/.test(ua) || ipad) {
      if (/CriOS/i.test(ua)) return 'iosChrome';
      if (/FxiOS|EdgiOS|OPiOS|OPT\//i.test(ua) || !/Safari/i.test(ua) || /(Instagram|FBAN|FBAV|GSA|TikTok)/i.test(ua)) return 'iosInApp';
      return 'ios';
    }
    return /Android/i.test(ua) ? 'android' : 'desktop';
  }

  function hit(b, t) {
    return b && t.x >= b.x && t.x <= b.x + b.w && t.y >= b.y && t.y <= b.y + b.h;
  }

  function wrapped(ctx, str, x, y, maxW, size, color, weight, maxLines, lineH) {
    const words = str.split(/\s+/), lines = [];
    let line = '';
    ctx.save();
    ctx.font = (weight || '700') + ' ' + size + 'px ' + GOL.fonts.ui;
    for (const word of words) {
      const next = line ? line + ' ' + word : word;
      if (line && ctx.measureText(next).width > maxW) { lines.push(line); line = word; }
      else line = next;
    }
    if (line) lines.push(line);
    const shown = lines.slice(0, maxLines || 3);
    ctx.restore();
    const lh = lineH || size * 1.25;
    shown.forEach((ln, i) => GOL.text(ctx, ln, x, y + i * lh, {
      size, weight: weight || '700', color: color || INK, shadow: false
    }));
    return shown.length * lh;
  }

  function drawButton(ctx, b, label, primary) {
    const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
    if (primary) { g.addColorStop(0, GOLD_L); g.addColorStop(1, '#D9A44A'); }
    else { g.addColorStop(0, 'rgba(253,246,228,.94)'); g.addColorStop(1, 'rgba(242,231,200,.94)'); }
    ctx.fillStyle = g; GOL.roundRect(ctx, b.x, b.y, b.w, b.h, b.h / 2); ctx.fill();
    ctx.strokeStyle = alpha(GOLD, primary ? .9 : .55); ctx.lineWidth = 1.5;
    GOL.roundRect(ctx, b.x, b.y, b.w, b.h, b.h / 2); ctx.stroke();
    GOL.text(ctx, label, b.x + b.w / 2, b.y + b.h / 2, {
      size: Math.min(16, b.h * .36), weight: '800', color: primary ? '#5A431C' : '#725B31', shadow: false
    });
  }

  function drawBackdrop(ctx, W, H, t, bd) {
    if (bd && GOL.drawBackdrop) {
      GOL.drawBackdrop(ctx, bd, W, H, t, t * 3, H > W ? .73 : .78);
      ctx.fillStyle = alpha('#263A2E', .12); ctx.fillRect(0, 0, W, H);
      return;
    }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#819F88'); g.addColorStop(.52, '#B8C9A0'); g.addColorStop(1, '#607D58');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = alpha('#F5E8B7', .12 + .03 * Math.sin(t));
    ctx.beginPath(); ctx.arc(W * .72, H * .17, Math.min(W, H) * .24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6F8D62';
    ctx.beginPath(); ctx.moveTo(0, H * .72);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, H * (.68 + .035 * Math.sin(x * .012 + t * .08)));
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    for (let i = 0; i < 8; i++) GOL.star8(ctx, (i + .5) * W / 8, H * (.74 + .08 * Math.sin(i * 2.1)), 2.5, t + i, alpha(GOLD_L, .55));
    ctx.fillStyle = alpha('#263A2E', .16); ctx.fillRect(0, 0, W, H);
  }

  function setupCopy(os) {
    if (GOL.EXPERIENCE.showcase) {
      if (GOL.isStandalone && GOL.isStandalone()) return { title: 'Already at home', note: 'Gems of Light is ready to open full-screen.', steps: ['Your garden is ready'], primary: 'Continue' };
      if (os === 'ios') return { title: 'On iPhone with Safari', note: 'A little home of its own, easy to find.', steps: ['Tap Share below', 'Choose Add to Home Screen', 'Open Gems of Light from its new icon'], primary: "I've added it" };
      if (os === 'iosChrome') return { title: 'On iPhone with Chrome', note: 'The Share button is at the top right.', steps: ['Tap Share', 'Choose Add to Home Screen', 'Open Gems of Light from its new icon'], primary: "I've added it" };
      if (os === 'iosInApp') return { title: 'Open in Safari first', note: 'In-app browsers cannot make the full-screen garden.', steps: ['Open this page in Safari', 'Tap Share', 'Choose Add to Home Screen'], primary: "I've added it" };
      if (os === 'android' && GOL.installGuide && GOL.installGuide.canPrompt()) return { title: 'On your Android phone', note: 'One tap makes the garden full-screen and easy to find.', steps: ['Add Gems of Light to your home screen'], primary: 'Add to home screen' };
      if (os === 'android') return { title: 'On your Android phone', note: 'Keep the garden full-screen and close at hand.', steps: ['Open the browser menu', 'Tap Add to Home screen', 'Open Gems of Light from its new icon'], primary: "I've added it" };
      return { title: 'Keep it close', note: 'The garden is made for a phone, but you can continue here.', steps: ['Open this Showcase link on your phone'], primary: 'Continue here' };
    }
    if (GOL.isStandalone && GOL.isStandalone()) return { title: 'Already at home', note: 'Gems of Light is ready to open full-screen.', steps: ['The garden is ready for your child'], primary: 'Continue' };
    if (os === 'ios') return { title: 'On iPhone with Safari', note: 'A little home of its own, easy for your child to find.', steps: ['Tap Share below', 'Choose Add to Home Screen', 'Open Gems of Light from its new icon'], primary: "I've added it" };
    if (os === 'iosChrome') return { title: 'On iPhone with Chrome', note: 'The Share button is at the top right.', steps: ['Tap Share', 'Choose Add to Home Screen', 'Open Gems of Light from its new icon'], primary: "I've added it" };
    if (os === 'iosInApp') return { title: 'Open in Safari first', note: 'In-app browsers cannot make the full-screen garden.', steps: ['Open this page in Safari', 'Tap Share', 'Choose Add to Home Screen'], primary: "I've added it" };
    if (os === 'android' && GOL.installGuide && GOL.installGuide.canPrompt()) return { title: 'On your Android phone', note: 'One tap makes the garden full-screen and easy to find.', steps: ['Add Gems of Light to your home screen'], primary: 'Add to home screen' };
    if (os === 'android') return { title: 'On your Android phone', note: 'Keep the garden full-screen and close at hand.', steps: ['Open the browser menu', 'Tap Add to Home screen', 'Open Gems of Light from its new icon'], primary: "I've added it" };
    return { title: 'Keep it close', note: 'The garden is made for a phone, but you can continue here.', steps: ['Visit playgemsoflight.com on your phone'], primary: 'Continue here' };
  }

  const scene = {
    ownsPortrait: true,
    stage: 'welcome', t: 0, stageT: 0, os: 'desktop', buttons: {}, installPending: false, bd: null,
    journeyStage: null,
    enter(params) {
      this.t = 0; this.stageT = 0; this.installPending = false; this.os = platform();
      this.bd = GOL.buildBackdrop ? GOL.buildBackdrop('falaq', 814) : null;
      const ob = GOL.onboardingStatus ? GOL.onboardingStatus() : {};
      const draft = ob.journeyStageDraft != null ? ob.journeyStageDraft : ob.journeyStage;
      this.journeyStage = Number.isInteger(draft) ? draft : null;
      const requested = params && params.stage;
      this.stage = DRAWABLE.has(requested) ? requested : (qaStage() || 'welcome');
    },
    exit() { if (GOL.audio && GOL.audio.stopRecitation) GOL.audio.stopRecitation(); },
    setStage(stage) {
      if (!DRAWABLE.has(stage)) return;
      this.stage = stage; this.stageT = 0; this.buttons = {};
      if (GOL.audio) GOL.audio.sfx('tap');
    },
    layout(W, H) {
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
      const portrait = H > W;
      const marginX = Math.max(18, sa.l + 14, sa.r + 14);
      const pw = Math.min(portrait ? 390 : 680, W - marginX * 2);
      const knowledge = this.stage === 'knowledge';
      const top = Math.max(sa.t + 14, portrait ? (knowledge ? H * .09 : H * .16) : (knowledge ? 22 : 46));
      const bottom = Math.max(sa.b + 16, 18);
      const ph = Math.min(portrait ? (knowledge ? 560 : 490) : (knowledge ? 340 : 270), H - top - bottom);
      const px = (W - pw) / 2, py = top;
      const bh = Math.max(40, Math.min(50, ph * .15));
      const by = py + ph - bh - 20;
      return { sa, portrait, px, py, pw, ph, cx: W / 2, bh, by, inner: pw - 54 };
    },
    actions(L) {
      const max = Math.min(270, L.pw - 56), gap = 10;
      if (this.stage === 'setup') {
        const w = Math.min(210, (L.pw - 64 - gap) / 2);
        return { secondary: { x: L.cx - w - gap / 2, y: L.by, w, h: L.bh }, primary: { x: L.cx + gap / 2, y: L.by, w, h: L.bh } };
      }
      return { primary: { x: L.cx - max / 2, y: L.by, w: max, h: L.bh } };
    },
    stageCards(L) {
      const choices = GOL.JOURNEY_STAGE_CHOICES || [];
      const cols = L.portrait ? 1 : 2;
      const rows = Math.ceil(choices.length / cols);
      const gapX = 10, gapY = 9;
      const gridX = L.px + 26;
      const gridY = L.py + (L.portrait ? 135 : 104);
      const gridW = L.pw - 52;
      const availableH = Math.max(80, L.by - gridY - 14);
      const h = Math.min(L.portrait ? 74 : 68, (availableH - gapY * (rows - 1)) / rows);
      const w = (gridW - gapX * (cols - 1)) / cols;
      return choices.map((choice, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        return { choice, x: gridX + col * (w + gapX), y: gridY + row * (h + gapY), w, h };
      });
    },
    saveJourneyStage() {
      const ob = GOL.onboardingStatus ? GOL.onboardingStatus() : null;
      if (!ob) return;
      ob.journeyStageDraft = this.journeyStage;
      GOL.store.save();
    },
    finish() {
      if (GOL.completeParentOnboarding) GOL.completeParentOnboarding();
      GOL.go('title', { childMode: true, handoff: true });
    },
    finishSetup() {
      if (this.installPending) return;
      if (this.os === 'android' && GOL.installGuide && GOL.installGuide.canPrompt()) {
        this.installPending = true;
        GOL.installGuide.prompt().then(() => {
          this.installPending = false;
          this.setStage('handoff');
        });
        return;
      }
      this.setStage('handoff');
    },
    update(dt, W, H) {
      this.t += dt; this.stageT += dt;
      const L = this.layout(W, H), a = this.actions(L); this.buttons = a;
      for (const tap of GOL.Input.taps) {
        if (tap.ui) continue;
        if (this.stage === 'knowledge') {
          const card = this.stageCards(L).find((b) => hit(b, tap));
          if (card) {
            tap.ui = true;
            this.journeyStage = card.choice.index;
            this.saveJourneyStage();
            if (GOL.audio) GOL.audio.sfx('tap');
            return;
          }
        }
        if (hit(a.primary, tap)) {
          tap.ui = true;
          if (this.stage === 'welcome') GOL.go('parentPreview');
          else if (this.stage === 'knowledge') {
            if (this.journeyStage == null) return;
            this.saveJourneyStage(); this.setStage('setup');
          }
          else if (this.stage === 'setup') this.finishSetup();
          else if (this.stage === 'handoff') this.finish();
          return;
        }
        if (hit(a.secondary, tap)) {
          tap.ui = true;
          if (this.stage === 'setup') this.setStage('handoff');
          return;
        }
      }
    },
    draw(ctx, W, H) {
      drawBackdrop(ctx, W, H, this.t, this.bd);
      const L = this.layout(W, H), a = this.actions(L);
      GOL.drawPanel(ctx, L.px, L.py, L.pw, L.ph, { radius: 22 });
      const titleY = L.py + (L.portrait ? 42 : 34);
      const contentY = titleY + (L.portrait ? 43 : 34);
      const titleSize = Math.min(L.portrait ? 27 : 24, L.pw * .075);
      const bodySize = L.portrait ? 15 : 13.5;

      if (this.stage === 'welcome') {
        GOL.star8(ctx, L.cx, titleY - 1, 12 + Math.sin(this.t * 2) * 1.2, Math.PI / 8 + this.t * .08, GOLD);
        GOL.text(ctx, 'Gems of Light', L.cx, titleY + 36, { size: titleSize + 4, weight: '800', color: INK, shadow: false });
        wrapped(ctx, GOL.EXPERIENCE.showcase
          ? 'A gentle platform adventure through living gardens.'
          : 'A gentle Quran memorisation adventure for young children.',
        L.cx, contentY + 52, L.inner, bodySize, SOFT, '700', 2);
        const gardenY = L.portrait ? contentY + 180 : contentY + 77;
        const gardenW = Math.min(L.inner - 24, L.portrait ? 250 : 300);
        ctx.fillStyle = alpha('#7BA267', .16);
        ctx.beginPath(); ctx.ellipse(L.cx, gardenY + 27, gardenW / 2, L.portrait ? 43 : 31, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = alpha(GOLD, .28); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(L.cx - gardenW * .28, gardenY + 18);
        ctx.quadraticCurveTo(L.cx, gardenY - 35, L.cx + gardenW * .28, gardenY + 4); ctx.stroke();
        for (let i = 0; i < 4; i++) {
          const p = (this.t * .1 + i / 4) % 1;
          const x = L.cx - gardenW * .28 + gardenW * .56 * p;
          const y = gardenY + 18 - Math.sin(p * Math.PI) * 38;
          GOL.star8(ctx, x, y, 2.5 + Math.sin(this.t * 2 + i), this.t + i, alpha(GOLD_L, .85));
        }
        GOL.drawSprite(ctx, L.cx - gardenW * .31, gardenY + 30, {
          facing: 1, moving: false, grounded: true, idleT: this.t, t: this.t,
          squashX: 1, squashY: 1, blink: Math.sin(this.t * .71) > .985, groundDist: 0
        });
        if (GOL.GEMS && GOL.GEMS[0]) GOL.drawGem(ctx, L.cx + gardenW * .31, gardenY - 4, 14, GOL.GEMS[0], this.t, { glow: 1 });
        GOL.text(ctx, GOL.EXPERIENCE.showcase
          ? 'Explore  →  Collect  →  Restore'
          : 'Explore  →  Listen  →  Remember', L.cx, gardenY + (L.portrait ? 83 : 56), {
          size: L.portrait ? 13 : 11.5, weight: '800', color: SOFT, shadow: false
        });
        drawButton(ctx, a.primary, 'See how it works', true);
      } else if (this.stage === 'knowledge') {
        GOL.text(ctx, 'Make it their garden', L.cx, titleY, { size: titleSize, weight: '800', color: INK, shadow: false });
        GOL.text(ctx, 'Where are they in their memorisation journey?', L.cx, contentY, {
          size: bodySize, weight: '700', color: SOFT, shadow: false
        });
        GOL.text(ctx, 'Choose the closest fit — the surahs below are just examples.', L.cx, contentY + (L.portrait ? 23 : 18), {
          size: L.portrait ? 11.5 : 10.5, weight: '700', color: alpha(SOFT, .78), shadow: false
        });
        for (const b of this.stageCards(L)) {
          const selected = this.journeyStage === b.choice.index;
          ctx.fillStyle = selected ? alpha('#DCEBCB', .98) : alpha('#F7EFD9', .72);
          GOL.roundRect(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
          ctx.strokeStyle = selected ? alpha('#4E8C52', .9) : alpha(GOLD, .35);
          ctx.lineWidth = selected ? 1.8 : 1.1;
          GOL.roundRect(ctx, b.x, b.y, b.w, b.h, 12); ctx.stroke();
          if (selected) GOL.star8(ctx, b.x + 18, b.y + b.h / 2, 6.5, Math.PI / 8, '#D09B38');
          const tx = b.x + (selected ? 34 : 18);
          GOL.text(ctx, b.choice.label, tx, b.y + b.h * .36, {
            size: L.portrait ? 14.5 : 14, weight: '800', color: selected ? '#355F3B' : INK,
            align: 'left', shadow: false
          });
          GOL.text(ctx, 'Around: ' + b.choice.examples, tx, b.y + b.h * .69, {
            size: L.portrait ? 11.5 : 10.5, weight: '700', color: selected ? alpha('#355F3B', .72) : SOFT,
            align: 'left', shadow: false
          });
        }
        drawButton(ctx, a.primary, this.journeyStage == null ? 'Choose one to continue' : 'Continue', this.journeyStage != null);
      } else if (this.stage === 'setup') {
        const c = setupCopy(this.os);
        GOL.text(ctx, GOL.EXPERIENCE.showcase ? 'Make Gems of Light yours' : 'Make Gems of Light theirs',
          L.cx, titleY, { size: titleSize, weight: '800', color: INK, shadow: false });
        GOL.text(ctx, c.title, L.cx, contentY, { size: 15, weight: '800', color: GOLD, shadow: false });
        const rowH = Math.min(L.portrait ? 52 : 38, (L.by - contentY - 58) / Math.max(1, c.steps.length));
        c.steps.forEach((s, i) => {
          const y = contentY + 37 + i * rowH;
          ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(L.px + 47, y, 12, 0, Math.PI * 2); ctx.fill();
          GOL.text(ctx, String(i + 1), L.px + 47, y, { size: 10.5, weight: '800', color: CREAM, shadow: false });
          GOL.text(ctx, s, L.px + 70, y, { size: 12.5, weight: '700', color: INK, align: 'left', shadow: false });
        });
        GOL.text(ctx, c.note, L.cx, L.by - 17, { size: 10.5, weight: '600', color: SOFT, shadow: false });
        drawButton(ctx, a.secondary, 'Not now', false); drawButton(ctx, a.primary, c.primary, true);
      } else {
        GOL.text(ctx, GOL.EXPERIENCE.showcase ? 'Your garden is ready' : 'Their garden is ready',
          L.cx, titleY, { size: titleSize + 2, weight: '800', color: INK, shadow: false });
        const py = contentY + (L.portrait ? 62 : 45);
        ctx.save(); ctx.translate(L.cx + Math.sin(this.t * .8) * 10, py); ctx.rotate(-Math.PI / 2 * (.5 + .5 * Math.sin(this.t * .75)));
        ctx.strokeStyle = GOLD; ctx.lineWidth = 3; GOL.roundRect(ctx, -17, -29, 34, 58, 8); ctx.stroke(); ctx.restore();
        wrapped(ctx, GOL.EXPERIENCE.showcase
          ? 'Turn the phone sideways, then begin the adventure.'
          : 'Turn the phone sideways, then hand the adventure to your child.',
        L.cx, py + 56, L.inner, bodySize, SOFT, '700', 2);
        drawButton(ctx, a.primary, GOL.EXPERIENCE.showcase ? 'Begin adventure' : 'Hand it over', true);
      }
      GOL.drawVignette(ctx, W, H, .12);
    }
  };

  GOL.onboarding = {
    stages: STAGES.slice(),
    open(stage) {
      if (stage === 'preview') { GOL.go('parentPreview'); return; }
      GOL.go('onboarding', { stage: DRAWABLE.has(stage) ? stage : 'welcome' });
    },
    previewComplete() {
      GOL.go('onboarding', { stage: GOL.EXPERIENCE.showcase ? 'setup' : 'knowledge' });
    },
    finishHandoff() { scene.finish(); }
  };
  GOL.registerScene('onboarding', scene);
})();
