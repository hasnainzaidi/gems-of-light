// Gems of Light v3 — install.js
// The PWA install gate: a soft block. When the game is opened in a browser
// tab (not installed to the home screen), boot shows THIS scene instead of the
// game — a warm, wordless-game-adjacent invitation to add Gems of Light to the
// home screen, where it gets the full landscape screen with no Safari chrome.
//
// This page is GROWN-UP-FACING (same precedent as grownups.js): short, gentle
// text IS welcome here. It never guilts and never hard-blocks — a quiet
// hold-to-continue star lets an adult slip past into the browser build.
//
// Contract with boot (boot wires the standalone check + entry separately):
//   • boot switches here at startup when NOT running standalone.
//   • Exits: (a) escape hatch → sessionStorage 'golInstallSkip'='1' then
//     GOL.go('title');  (b) Android native install accepted → GOL.go('title').
//   • This file loads BEFORE boot.js, so the beforeinstallprompt capture below
//     is armed in time to catch Android's event.
(function () {
  const GOL = window.GOL;
  const { alpha } = GOL.color;

  // -- capture Android's install prompt as early as possible (module scope) --
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  // ---------------------------------------------------------- platform (os) --
  // UA-based, defensive. We resolve to a coarse OS bucket here; the Android
  // sub-branch (native prompt vs. manual steps) is decided each frame because
  // beforeinstallprompt can fire after this scene is already on screen.
  const q = new URLSearchParams(location.search);
  // Pure classifier, kept UA-in/branch-out so it's testable without a real
  // device: every iOS UA contains "Safari" (even Chrome/Firefox/Edge-on-iOS,
  // which wrap WebKit and tack their own token on top), so a naive /Safari/
  // test misreports them as real Safari. We must check the OTHER browsers'
  // tokens (CriOS, FxiOS, ...) before falling through to "real Safari".
  // Exposed on GOL for console/unit testing — not part of the render path.
  function classifyIOSBrowser(ua) {
    if (/CriOS/i.test(ua)) return 'iosChrome'; // Chrome on iOS: A2HS works (iOS 16.4+), share sits top-right
    // Firefox / Edge / Opera on iOS: A2HS support is inconsistent — route to Safari
    if (/FxiOS|EdgiOS|OPiOS|OPT\//i.test(ua)) return 'iosInApp';
    // known in-app webview embedders, or WebKit with no "Safari" token at all
    const inApp = /(Instagram|FBAN|FBAV|FB_IAB|GSA|Line|Twitter|Snapchat|Pinterest|TikTok|MicroMessenger|wv\))/i.test(ua) || !/Safari/i.test(ua);
    return inApp ? 'iosInApp' : 'ios';
  }
  function detectOS() {
    const forced = q.get('installPlatform'); // dev/phone override: ios|iosChrome|iosInApp|android|desktop
    if (forced === 'ios' || forced === 'iosChrome' || forced === 'iosInApp' || forced === 'android' || forced === 'desktop') return forced;
    const ua = navigator.userAgent || '';
    const iPadOS = navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1;
    // require an actual iOS device signal FIRST — desktop Chrome/Edge UAs
    // also contain "Safari", so without this gate they'd misclassify as iOS.
    const isIOS = /iPad|iPhone|iPod/.test(ua) || iPadOS;
    if (isIOS) return classifyIOSBrowser(ua);
    if (/Android/i.test(ua)) return 'android';
    return 'desktop';
  }
  GOL.classifyIOSBrowser = classifyIOSBrowser; // console-testable, not used in draw/update
  const FORCED_ANDROID = q.get('installPlatform') === 'android';

  // ------------------------------------------------------------ palette -----
  const GOLD_D = '#B98A3E', GOLD = '#D9A44A', GOLD_L = '#FFE9A8', CREAM = '#FAF4E0';
  const INK = GOL.INK, INK_SOFT = GOL.INK_SOFT;
  const HOLD_SECS = 1.2;

  // =========================================================== glyphs (paths) =
  // All drawn with canvas paths — no images, no emoji. Each takes a center and
  // a size s (roughly the half-height). Gold ink so they sit on the parchment.
  function glyphShare(ctx, cx, cy, s) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = GOLD_D; ctx.lineWidth = Math.max(1.6, s * 0.16);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // the open-topped tray (three sides)
    const bw = s * 1.2, top = -s * 0.05, bot = s * 0.95, r = s * 0.22;
    ctx.beginPath();
    ctx.moveTo(-bw / 2, top);
    ctx.lineTo(-bw / 2, bot - r);
    ctx.quadraticCurveTo(-bw / 2, bot, -bw / 2 + r, bot);
    ctx.lineTo(bw / 2 - r, bot);
    ctx.quadraticCurveTo(bw / 2, bot, bw / 2, bot - r);
    ctx.lineTo(bw / 2, top);
    ctx.stroke();
    // the up-arrow rising out of it
    ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(1.8, s * 0.18);
    ctx.beginPath();
    ctx.moveTo(0, s * 0.55); ctx.lineTo(0, -s * 0.95);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.34, -s * 0.55);
    ctx.lineTo(0, -s * 0.98);
    ctx.lineTo(s * 0.34, -s * 0.55);
    ctx.stroke();
    ctx.restore();
  }

  // a menu row (rounded rect) carrying a plus-in-square + a label bar
  function glyphPlusRow(ctx, cx, cy, s) {
    ctx.save();
    ctx.translate(cx, cy);
    const rw = s * 2.7, rh = s * 1.5;
    ctx.strokeStyle = alpha(GOLD_D, 0.7); ctx.lineWidth = Math.max(1.4, s * 0.12);
    GOL.roundRect(ctx, -rw / 2, -rh / 2, rw, rh, s * 0.28); ctx.stroke();
    // plus-in-square at the left
    const bx = -rw / 2 + s * 0.62, sq = s * 0.86;
    ctx.strokeStyle = GOLD_D; ctx.lineWidth = Math.max(1.6, s * 0.15);
    GOL.roundRect(ctx, bx - sq / 2, -sq / 2, sq, sq, s * 0.16); ctx.stroke();
    ctx.strokeStyle = GOLD; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bx - sq * 0.28, 0); ctx.lineTo(bx + sq * 0.28, 0);
    ctx.moveTo(bx, -sq * 0.28); ctx.lineTo(bx, sq * 0.28);
    ctx.stroke();
    // the label bar
    ctx.strokeStyle = alpha(GOLD_D, 0.5); ctx.lineWidth = Math.max(1.4, s * 0.14);
    ctx.beginPath();
    ctx.moveTo(bx + sq * 0.9, 0); ctx.lineTo(rw / 2 - s * 0.35, 0);
    ctx.stroke();
    ctx.restore();
  }

  // a small app icon (rounded square, gold) wearing a sparkle
  function glyphAppIcon(ctx, cx, cy, s, t) {
    ctx.save();
    ctx.translate(cx, cy);
    const w = s * 1.7;
    const g = ctx.createLinearGradient(0, -w / 2, 0, w / 2);
    g.addColorStop(0, '#F0C878'); g.addColorStop(1, GOLD);
    ctx.fillStyle = g;
    GOL.roundRect(ctx, -w / 2, -w / 2, w, w, s * 0.42); ctx.fill();
    ctx.strokeStyle = alpha(GOLD_D, 0.9); ctx.lineWidth = Math.max(1.2, s * 0.1);
    GOL.roundRect(ctx, -w / 2, -w / 2, w, w, s * 0.42); ctx.stroke();
    // a little gem-star on the icon face
    GOL.star8Path(ctx, 0, 0, s * 0.52, Math.PI / 8 + t * 0.4);
    ctx.fillStyle = CREAM; ctx.fill();
    // the sparkle at the upper-right
    const tw = 0.6 + 0.4 * Math.sin(t * 3);
    GOL.star8(ctx, w * 0.42, -w * 0.42, s * (0.26 + 0.08 * tw), Math.PI / 8, alpha(GOLD_L, 0.9));
    ctx.restore();
  }

  // a Safari-ish compass (circle + needle) — "open in Safari"
  function glyphCompass(ctx, cx, cy, s, t) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = GOLD_D; ctx.lineWidth = Math.max(1.6, s * 0.14);
    ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.stroke();
    // tick marks
    ctx.strokeStyle = alpha(GOLD_D, 0.5); ctx.lineWidth = Math.max(1, s * 0.08);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * s * 0.82, Math.sin(a) * s * 0.82);
      ctx.lineTo(Math.cos(a) * s * 0.98, Math.sin(a) * s * 0.98);
      ctx.stroke();
    }
    // the needle, drifting gently
    ctx.rotate(-0.5 + Math.sin(t * 0.9) * 0.28);
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.7); ctx.lineTo(s * 0.22, 0); ctx.lineTo(0, s * 0.15); ctx.lineTo(-s * 0.22, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = alpha(CREAM, 0.9);
    ctx.beginPath();
    ctx.moveTo(0, s * 0.7); ctx.lineTo(s * 0.22, 0); ctx.lineTo(0, -s * 0.15); ctx.lineTo(-s * 0.22, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // the three-dot overflow menu (Android)
  function glyphDots(ctx, cx, cy, s) {
    ctx.save();
    ctx.fillStyle = GOLD_D;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.arc(cx, cy + i * s * 0.62, s * 0.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawGlyph(ctx, name, cx, cy, s, t) {
    if (name === 'share') glyphShare(ctx, cx, cy, s);
    else if (name === 'plusrow') glyphPlusRow(ctx, cx, cy, s);
    else if (name === 'appicon') glyphAppIcon(ctx, cx, cy, s, t);
    else if (name === 'compass') glyphCompass(ctx, cx, cy, s, t);
    else if (name === 'dots') glyphDots(ctx, cx, cy, s);
  }

  // a small gold numbered badge (0..3)
  function drawBadge(ctx, cx, cy, r, label) {
    const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    g.addColorStop(0, GOLD_L); g.addColorStop(1, GOLD);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = alpha(GOLD_D, 0.9); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    GOL.text(ctx, label, cx, cy + 0.5, { size: r * 1.15, weight: '800', color: '#5A431C', shadow: false });
  }

  // wrap a string to at most `maxLines`, returning the lines (last one clipped)
  function wrapLines(ctx, str, maxW, font, maxLines) {
    ctx.save(); ctx.font = font;
    const words = str.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line); line = w;
        if (lines.length === maxLines - 1) { line = w; }
      } else line = test;
    }
    if (line) lines.push(line);
    ctx.restore();
    return lines.slice(0, maxLines);
  }

  // ============================================================== the scene ===
  const install = {
    t: 0, hold: 0, shimmer: 0, fx: null, os: 'desktop', branch: 'desktop',

    enter() {
      this.t = 0; this.hold = 0; this.shimmer = 0;
      this.os = detectOS();
      this.fx = GOL.makeFx ? GOL.makeFx() : null;
    },

    // the illustrated steps for the current branch
    steps(branch) {
      if (branch === 'ios') {
        return [
          { n: '1', glyph: 'share', text: 'Tap Share below' },
          { n: '2', glyph: 'plusrow', text: 'Add to Home Screen' },
          { n: '3', glyph: 'appicon', text: 'Open Gems of Light from your home screen' }
        ];
      }
      if (branch === 'iosInApp') {
        return [
          { n: '0', glyph: 'compass', text: 'First, open this page in Safari' },
          { n: '1', glyph: 'share', text: 'Tap Share' },
          { n: '2', glyph: 'plusrow', text: 'Add to Home Screen' },
          { n: '3', glyph: 'appicon', text: 'Open it from the home screen' }
        ];
      }
      if (branch === 'iosChrome') {
        return [
          { n: '1', glyph: 'share', text: 'Tap Share, top right' },
          { n: '2', glyph: 'plusrow', text: 'Add to Home Screen' },
          { n: '3', glyph: 'appicon', text: 'Open Gems of Light from your home screen' }
        ];
      }
      if (branch === 'androidSteps') {
        return [
          { n: '1', glyph: 'dots', text: 'Open the browser menu' },
          { n: '2', glyph: 'plusrow', text: 'Tap Add to Home screen' }
        ];
      }
      return [];
    },

    // resolve the coarse OS into the drawable branch (Android splits by prompt)
    resolveBranch() {
      const os = this.os;
      if (os === 'ios') return 'ios';
      if (os === 'iosChrome') return 'iosChrome';
      if (os === 'iosInApp') return 'iosInApp';
      if (os === 'android') return (deferredPrompt || FORCED_ANDROID) ? 'androidPrompt' : 'androidSteps';
      return 'desktop';
    },

    // one source of geometry, shared by update (hit-testing) and draw
    layout(W, H) {
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
      const portrait = H > W;
      const branch = this.resolveBranch();
      const cardW = Math.min(W - 34, portrait ? 440 : 560);
      const cardX = (W - cardW) / 2;

      let cardH, steps = [], rowH = 0, note = '';
      if (branch === 'androidPrompt') {
        cardH = 148;
      } else if (branch === 'desktop') {
        cardH = 150;
      } else {
        steps = this.steps(branch);
        const n = steps.length;
        rowH = Math.max(44, Math.min(66, (H * 0.60) / Math.max(3, n)));
        cardH = 14 + n * rowH + 14;
        if (branch === 'ios' || branch === 'iosInApp') note = 'Share sits at the bottom of Safari on iPhone';
        else if (branch === 'iosChrome') note = 'Share sits at the top of Chrome on iPhone';
      }

      const headBlock = 52;
      const noteH = note ? 22 : 0;
      const blockH = headBlock + 16 + cardH + noteH;
      const startY = Math.max(sa.t * 0.5 + 14, (H - blockH) / 2 - 6);
      const headY = startY + 14;
      const subY = headY + 22;
      const cardY = subY + 22;

      const lay = {
        portrait, branch, cardX, cardY, cardW, cardH, steps, rowH, note,
        headY, subY, noteY: cardY + cardH + 15
      };

      // the quiet hold-to-continue star, bottom-right (grown-ups idiom)
      lay.star = { x: W - 46 - sa.r, y: H - 42 - sa.b * 0.5, r: 15 };

      // Android native-install button (inside the card)
      if (branch === 'androidPrompt') {
        const bw = Math.min(cardW - 44, 340), bh = 52;
        lay.installBtn = { x: cardX + (cardW - bw) / 2, y: cardY + cardH - bh - 20, w: bw, h: bh };
      }
      // Desktop plain continue button (inside the card) — prominent, no hold
      if (branch === 'desktop') {
        const bw = 210, bh = 46;
        lay.contBtn = { x: cardX + (cardW - bw) / 2, y: cardY + cardH - bh - 18, w: bw, h: bh };
      }
      return lay;
    },

    skip() {
      try { sessionStorage.setItem('golInstallSkip', '1'); } catch (e) { /* private mode */ }
      if (GOL.audio) GOL.audio.sfx('tap');
      GOL.go('title');
    },

    androidInstall() {
      const dp = deferredPrompt;
      if (!dp) { return; } // forced-android eyeball mode: nothing to prompt
      deferredPrompt = null;
      if (GOL.audio) GOL.audio.sfx('tap');
      try {
        dp.prompt();
        Promise.resolve(dp.userChoice).then((choice) => {
          if (choice && choice.outcome === 'accepted') GOL.go('title');
          // dismissed → deferredPrompt is now null, so the branch falls back
          // to the manual steps on the next frame. No guilt, no block.
        }).catch(() => {});
      } catch (e) { /* ignore */ }
    },

    update(dt, W, H) {
      this.t += dt;
      if (this.fx) {
        this.fx.update(dt);
        if (Math.random() < dt * 2) this.fx.spawn('mote', Math.random() * W, H * (0.25 + Math.random() * 0.5), {});
      }
      const lay = this.layout(W, H);
      const branch = lay.branch;

      const hitRect = (b, tap) => b && tap.x >= b.x && tap.x <= b.x + b.w && tap.y >= b.y && tap.y <= b.y + b.h;

      // Android: the one warm install button
      if (branch === 'androidPrompt') {
        for (const tap of GOL.Input.taps) {
          if (tap.ui) continue;
          if (hitRect(lay.installBtn, tap)) { tap.ui = true; this.androidInstall(); return; }
        }
      }
      // Desktop: a plain tappable continue (no hold needed)
      if (branch === 'desktop') {
        for (const tap of GOL.Input.taps) {
          if (tap.ui) continue;
          if (hitRect(lay.contBtn, tap)) { tap.ui = true; this.skip(); return; }
        }
        return; // desktop has no hold-star
      }

      // Mobile paths: the press-and-hold escape star
      const star = lay.star;
      let holding = false;
      for (const [, p] of GOL.Input.pointers) {
        if (GOL.dist(p.x, p.y, star.x, star.y) < star.r + 18) { holding = true; break; }
      }
      for (const tap of GOL.Input.taps) {
        if (tap.ui) continue;
        if (GOL.dist(tap.x, tap.y, star.x, star.y) < star.r + 18) { tap.ui = true; this.shimmer = 1; }
      }
      this.hold = holding ? Math.min(1, this.hold + dt / HOLD_SECS) : Math.max(0, this.hold - dt * 2.2);
      this.shimmer = Math.max(0, this.shimmer - dt * 2.5);
      if (this.hold >= 1) { this.hold = 0; if (GOL.audio) GOL.audio.sfx('unlockLevel'); this.skip(); }
    },

    draw(ctx, W, H) {
      const t = this.t;
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };

      // soft green-dusk backdrop (the grown-ups page's calmer voice)
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#33473A'); bg.addColorStop(1, '#25362C');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      if (this.fx) this.fx.draw(ctx);
      GOL.drawVignette(ctx, W, H, 0.16);

      const lay = this.layout(W, H);
      const branch = lay.branch;
      const cx = W / 2;

      // heading + subline (adult-facing warmth)
      GOL.text(ctx, 'Add Gems of Light to your home screen', cx, lay.headY,
        { size: Math.min(21, W * 0.05), weight: '800', color: '#F5EDD4' });
      GOL.text(ctx, 'so it opens full-screen, the way it wants to be played', cx, lay.subY,
        { size: Math.min(13, W * 0.033), weight: '600', color: alpha('#F5EDD4', 0.6), shadow: false });

      // a small Noor firefly hovering by the heading
      GOL.drawFirefly(ctx, cx + Math.min(180, W * 0.42) + Math.sin(t * 1.2) * 8,
        lay.headY - 4 + Math.sin(t * 1.9) * 5, t, 0.9);

      // the parchment card
      GOL.drawPanel(ctx, lay.cardX, lay.cardY, lay.cardW, lay.cardH, { radius: 20 });

      if (branch === 'androidPrompt') {
        GOL.text(ctx, 'one tap and it lives on your home screen', cx, lay.cardY + 34,
          { size: 13.5, weight: '700', color: INK_SOFT, shadow: false });
        this.drawPillButton(ctx, lay.installBtn, 'Add to home screen', true);
      } else if (branch === 'desktop') {
        GOL.text(ctx, 'Gems of Light is made for a phone.', cx, lay.cardY + 40,
          { size: 15, weight: '800', color: INK });
        GOL.text(ctx, 'Visit playgemsoflight.com on your phone to play.', cx, lay.cardY + 66,
          { size: 12.5, weight: '600', color: INK_SOFT, shadow: false });
        this.drawPillButton(ctx, lay.contBtn, 'continue here', false);
      } else {
        // the illustrated steps
        const steps = lay.steps, rowH = lay.rowH;
        const tSize = Math.max(12.5, Math.min(16, rowH * 0.27));
        const gS = Math.min(15, rowH * 0.3);
        const badgeR = Math.min(13, rowH * 0.24);
        const badgeX = lay.cardX + 34;
        const glyphX = lay.cardX + 78;
        const textX = lay.cardX + 108;
        const textMaxW = lay.cardX + lay.cardW - textX - 16;
        const font = '700 ' + tSize + 'px ' + GOL.fonts.ui;
        steps.forEach((s, i) => {
          const ry = lay.cardY + 14 + i * rowH + rowH / 2;
          if (i > 0) {
            ctx.strokeStyle = alpha(INK, 0.1); ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(lay.cardX + 20, lay.cardY + 14 + i * rowH);
            ctx.lineTo(lay.cardX + lay.cardW - 20, lay.cardY + 14 + i * rowH);
            ctx.stroke();
          }
          drawBadge(ctx, badgeX, ry, badgeR, s.n);
          drawGlyph(ctx, s.glyph, glyphX, ry, gS, t);
          const lines = wrapLines(ctx, s.text, textMaxW, font, 2);
          const lh = tSize * 1.18;
          const startTy = ry - (lines.length - 1) * lh / 2;
          lines.forEach((ln, li) => {
            GOL.text(ctx, ln, textX, startTy + li * lh,
              { size: tSize, weight: '700', color: INK, align: 'left', shadow: false });
          });
        });
      }

      // the small locating note under the card (iOS)
      if (lay.note) {
        GOL.text(ctx, lay.note, cx, lay.noteY,
          { size: 11.5, weight: '600', color: alpha('#F5EDD4', 0.55), shadow: false });
      }

      // the hold-to-continue star (mobile paths only)
      if (branch !== 'desktop') this.drawHoldStar(ctx, lay.star, t);
    },

    drawPillButton(ctx, b, label, warm) {
      if (!b) return;
      const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
      if (warm) { g.addColorStop(0, GOLD_L); g.addColorStop(1, GOLD); }
      else { g.addColorStop(0, alpha(GOLD_L, 0.9)); g.addColorStop(1, alpha(GOLD, 0.85)); }
      ctx.fillStyle = g;
      GOL.roundRect(ctx, b.x, b.y, b.w, b.h, b.h / 2); ctx.fill();
      ctx.strokeStyle = alpha(GOLD_D, 0.9); ctx.lineWidth = 1.6;
      GOL.roundRect(ctx, b.x, b.y, b.w, b.h, b.h / 2); ctx.stroke();
      GOL.text(ctx, label, b.x + b.w / 2, b.y + b.h / 2,
        { size: warm ? 16 : 15, weight: '800', color: '#5A431C', shadow: false });
    },

    drawHoldStar(ctx, star, t) {
      const gp = this.hold;
      // a soft shimmer on a quick tap
      if (this.shimmer > 0) {
        ctx.strokeStyle = alpha(GOLD_L, 0.45 * this.shimmer); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(star.x, star.y, star.r + 6 + (1 - this.shimmer) * 8, 0, Math.PI * 2); ctx.stroke();
      }
      GOL.star8Path(ctx, star.x, star.y, star.r * 0.62, Math.PI / 8 + t * 0.12);
      ctx.fillStyle = alpha(CREAM, 0.42 + 0.14 * Math.sin(t * 1.4)); ctx.fill();
      ctx.strokeStyle = alpha(GOLD, 0.6); ctx.lineWidth = 1.3; ctx.stroke();
      // the ring fills as it's held, drains when released early
      if (gp > 0.01) {
        ctx.strokeStyle = alpha(GOLD_L, 0.9); ctx.lineWidth = 2.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(star.x, star.y, star.r + 5, -Math.PI / 2, -Math.PI / 2 + gp * Math.PI * 2); ctx.stroke();
        ctx.lineCap = 'butt';
      }
      GOL.text(ctx, 'continue in browser (hold)', star.x - star.r - 12, star.y,
        { size: 10.5, weight: '700', color: alpha('#F5EDD4', 0.5), align: 'right', shadow: false });
    }
  };

  GOL.registerScene('install', install);
})();
