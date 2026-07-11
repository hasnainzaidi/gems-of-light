// Gems of Light — modes.js
// The bonus ways back into a surah, once it has been walked whole:
//   · the Moon Trial   — a gentle listening quiz; the moon waxes as recall grows
//   · the Story        — how the surah came down, told softly, page by page
//   · the Meaning Match — pair each ayah's sound with what it means (readers)
// None of them can be failed. All of them are more Quran, heard again.
(function () {
  const GOL = window.GOL;
  const { alpha, tint, shade } = GOL.color;

  // Wrap a string into lines that fit maxW at the given font.
  function wrapText(ctx, str, maxW, size, weight) {
    ctx.save();
    ctx.font = (weight || '600') + ' ' + size + 'px ' + GOL.fonts.ui;
    const words = String(str).split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const probe = line ? line + ' ' + w : w;
      if (ctx.measureText(probe).width > maxW && line) {
        lines.push(line);
        line = w;
      } else line = probe;
    }
    if (line) lines.push(line);
    ctx.restore();
    return lines;
  }
  GOL.wrapText = wrapText;

  // ============================================================ MOON TRIAL ==
  // "The moon remembers with you." Questions are pure listening:
  //   · which gem holds the ayah that comes NEXT?
  //   · which gem holds ayah k?
  // Wrong guesses just go softly to sleep. First-listen answers wax the moon.
  const trial = {
    t: 0, L: null, bd: null, fx: null, buttons: [],
    qs: null, qi: 0, q: null, phase: 'ask',
    picked: null, cleanQ: true, firstTries: 0,
    moonFrom: 0, moonTo: 0, moonT: 0, rewardT: 0,

    enter(params) {
      this.L = GOL.LEVELS[params.index];
      this.bd = GOL.buildBackdrop('falaq', 313 + params.index); // dusk — the moon's hour
      this.fx = GOL.makeFx();
      this.t = 0;
      this.qi = 0;
      this.phase = 'ask';
      this.firstTries = 0;
      this.qs = this.makeQuestions(5);
      GOL.audio.preloadVoice(['ui-trial-next', 'ui-praise', 'ui-moon-grows'].concat(
        this.L.surah.verses.map((v) => 'ui-find-' + v.n)));
      this.setQuestion(0);
      GOL.audio.startAmbience('quiet');
      GOL.audio.preloadSurah(this.L.surah);
      GOL.stamp('trialStart');
    },
    exit() { GOL.audio.stopRecitation(); GOL.audio.stopSpeak(); },

    makeQuestions(count) {
      const n = this.L.surah.verses.length;
      const rng = GOL.rng((Date.now() % 90000) + 7);
      const qs = [];
      for (let i = 0; i < count; i++) {
        const type = n >= 3 && rng() < 0.55 ? 'next' : 'find';
        if (type === 'next') {
          const p = 1 + Math.floor(rng() * (n - 1)); // prompt ayah 1..n-1
          const correct = p + 1;
          const pool = [];
          for (let a = 1; a <= n; a++) if (a !== correct && a !== p) pool.push(a);
          shuffle(pool, rng);
          const choices = [correct].concat(pool.slice(0, Math.min(2, pool.length)));
          shuffle(choices, rng);
          qs.push({ type, prompt: p, correct, choices });
        } else {
          const k = 1 + Math.floor(rng() * n);
          const pool = [];
          for (let a = 1; a <= n; a++) if (a !== k) pool.push(a);
          shuffle(pool, rng);
          const choices = [k].concat(pool.slice(0, Math.min(2, pool.length)));
          shuffle(choices, rng);
          qs.push({ type, prompt: k, correct: k, choices });
        }
      }
      return qs;
      function shuffle(arr, r) {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(r() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
      }
    },
    setQuestion(i) {
      this.qi = i;
      this.q = this.qs[i];
      this.picked = null;
      this.cleanQ = true;
      this.phase = 'ask';
      this.choiceState = this.q.choices.map((a, ci) => ({ ayah: a, heard: false, asleep: false, pulse: 0, phase: ci * 1.9 }));
      // the question speaks itself — in the reciter's voice for the ayah,
      // and the storyteller's voice for the asking
      if (this.q.type === 'next') {
        const qi = i;
        GOL.audio.playVerse(this.L.surahId, this.q.prompt, () => {
          if (this.qi === qi && this.phase === 'ask' && GOL.sceneName === 'trial') GOL.audio.speak('ui-trial-next');
        });
      } else {
        GOL.audio.stopRecitation();
        GOL.audio.sfx('yourTurn');
        GOL.audio.speak('ui-find-' + this.q.correct);
      }
    },

    layout(W, H) {
      const n = this.choiceState.length;
      const gap = Math.min(170, (W - 200) / n);
      return {
        promptX: W / 2, promptY: H * 0.3,
        choices: this.choiceState.map((c, i) => ({
          x: W / 2 + (i - (n - 1) / 2) * gap,
          y: H * 0.62 + Math.sin(this.t * 0.9 + i * 2.1) * 6,
          c
        })),
        okY: H * 0.62 + 86
      };
    },

    update(dt, W, H) {
      this.t += dt;
      this.fx.update(dt);
      if (Math.random() < dt * 2) this.fx.spawn('mote', Math.random() * W, Math.random() * H * 0.6, {});
      this.buttons = [
        { x: 40, y: 40, r: 30, iconName: 'map', fn: () => GOL.go('map', { focus: this.L.index }) },
        Object.assign({}, GOL.muteButton(W))
      ];
      if (GOL.hitButtons(GOL.Input.taps, this.buttons)) return;

      for (const c of this.choiceState) c.pulse = Math.max(0, c.pulse - dt * 0.6);

      if (this.phase === 'reward') {
        this.rewardT -= dt;
        if (Math.random() < dt * 8) this.fx.spawn('petal', W / 2 + GOL.rnd(-160, 160), H * 0.3, { color: Math.random() < 0.5 ? '#F5B8C4' : '#FFE9A8' });
        if (this.rewardT <= 0) {
          if (this.qi + 1 < this.qs.length) this.setQuestion(this.qi + 1);
          else this.finish();
        }
        return;
      }
      if (this.phase === 'moon') {
        this.moonT = Math.min(1, this.moonT + dt / (GOL.DEBUG ? 0.5 : 2.2));
        for (const tap of GOL.Input.taps) {
          if (tap.ui || this.moonT < 0.9) continue;
          // again / back
          if (Math.abs(tap.y - H * 0.82) < 30) {
            if (Math.abs(tap.x - (W / 2 - 90)) < 80) { tap.ui = true; GOL.go('trial', { index: this.L.index }); return; }
            if (Math.abs(tap.x - (W / 2 + 90)) < 80) { tap.ui = true; GOL.go('map', { focus: this.L.index }); return; }
          }
        }
        return;
      }

      // ask phase
      const lay = this.layout(W, H);
      for (const tap of GOL.Input.taps) {
        if (tap.ui) continue;
        // replay the prompt
        if (this.q.type === 'next' && GOL.dist(tap.x, tap.y, lay.promptX, lay.promptY) < 56) {
          tap.ui = true;
          GOL.audio.playVerse(this.L.surahId, this.q.prompt, null);
          this.fx.spawn('ring', lay.promptX, lay.promptY, { color: '#FFE9A8', size: 26 });
          continue;
        }
        // listen to a choice (and make it the picked one)
        for (const ch of lay.choices) {
          if (GOL.dist(tap.x, tap.y, ch.x, ch.y) < 46 && !ch.c.asleep) {
            tap.ui = true;
            ch.c.heard = true;
            ch.c.pulse = 1;
            this.picked = ch.c;
            GOL.audio.playVerse(this.L.surahId, ch.c.ayah, null);
            break;
          }
        }
        if (tap.ui) continue;
        // confirm the picked one
        if (this.picked && GOL.dist(tap.x, tap.y, W / 2, lay.okY) < 40) {
          tap.ui = true;
          this.judge(W, H);
        }
      }
    },

    judge(W, H) {
      const st = GOL.store.level(this.L.surahId);
      st.trialAsked++;
      if (this.picked.ayah === this.q.correct) {
        if (this.cleanQ) { st.trialFirstTry++; this.firstTries++; }
        GOL.store.save();
        GOL.audio.stopRecitation();
        GOL.audio.sfx('praise');
        GOL.audio.chime(this.q.correct - 1, { short: true });
        if (this.cleanQ) GOL.audio.speak('ui-praise');
        this.picked.revealed = true;
        this.phase = 'reward';
        this.rewardT = GOL.DEBUG ? 0.35 : 1.5;
        this.fx.burst(W / 2, H * 0.62, GOL.GEMS[(this.q.correct - 1) % 7].base, 20);
      } else {
        // no scolding: that gem simply goes to sleep, and the ear tries again
        st.trialAsked--; // only the final success is counted as asked
        GOL.store.save();
        this.cleanQ = false;
        this.picked.asleep = true;
        this.picked = null;
        GOL.audio.sfx('drift');
      }
    },
    finish() {
      const st = GOL.store.level(this.L.surahId);
      const rate = st.trialAsked ? st.trialFirstTry / st.trialAsked : 0;
      this.moonFrom = st.moon || 0;
      st.moon = Math.max(st.moon || 0, rate); // the child's moon never wanes
      this.moonTo = st.moon;
      GOL.store.save();
      GOL.stamp('trial');
      this.phase = 'moon';
      this.moonT = 0;
      GOL.audio.sfx('door');
      GOL.audio.speak('ui-moon-grows');
    },

    draw(ctx, W, H) {
      const t = this.t;
      GOL.drawBackdrop(ctx, this.bd, W, H, t, 20, 0.85);
      // deepen toward night, with stars
      ctx.fillStyle = alpha('#26324E', 0.32);
      ctx.fillRect(0, 0, W, H);
      const r = GOL.rng(31);
      for (let i = 0; i < 40; i++) {
        const sx = r() * W, sy = r() * H * 0.5;
        const tw = 0.5 + 0.5 * Math.sin(t * (0.7 + r()) + i);
        ctx.fillStyle = alpha('#FFF6DC', 0.2 + 0.5 * tw * (i % 3 === 0 ? 1 : 0.5));
        ctx.beginPath(); ctx.arc(sx, sy, 0.8 + r() * 1.4, 0, Math.PI * 2); ctx.fill();
      }
      const st = GOL.store.level(this.L.surahId);
      // the surah's moon, keeping watch
      GOL.drawMoon(ctx, W - 90, 92, 34, this.phase === 'moon' ? this.moonFrom + (this.moonTo - this.moonFrom) * GOL.ease.inOut(this.moonT) : (st.moon || 0), t);

      GOL.text(ctx, 'Moon Trial · ' + this.L.surah.englishName, W / 2, 40, { size: 22, weight: '800', color: '#F5EDD4' });

      if (this.phase === 'moon') {
        const k = GOL.ease.inOut(Math.min(1, this.moonT));
        GOL.drawMoon(ctx, W / 2, H * 0.4, 74, this.moonFrom + (this.moonTo - this.moonFrom) * k, t);
        if (this.moonT > 0.85 && Math.random() < 0.15) {
          this.fx.spawn('sparkle', W / 2 + GOL.rnd(-90, 90), H * 0.4 + GOL.rnd(-70, 70), { color: '#FFF6DC' });
        }
        GOL.text(ctx, this.firstTries + ' of ' + this.qs.length + ' known by heart tonight', W / 2, H * 0.62, { size: 19, weight: '800', color: '#F5EDD4' });
        GOL.text(ctx, 'the moon remembers with you — it only ever grows', W / 2, H * 0.62 + 30, { size: 14, weight: '600', color: 'rgba(245,237,212,0.7)' });
        if (this.moonT > 0.9) {
          GOL.drawPanel(ctx, W / 2 - 170, H * 0.82 - 26, 160, 52, { radius: 26, plain: true });
          GOL.text(ctx, 'once more', W / 2 - 90, H * 0.82, { size: 16, weight: '800' });
          GOL.drawPanel(ctx, W / 2 + 10, H * 0.82 - 26, 160, 52, { radius: 26, plain: true });
          GOL.text(ctx, 'the garden', W / 2 + 90, H * 0.82, { size: 16, weight: '800' });
        }
        this.fx.draw(ctx);
        for (const b of this.buttons) GOL.drawButton(ctx, b.x, b.y, 22, b.icon ? b.icon() : b.iconName);
        GOL.drawVignette(ctx, W, H, 0.2);
        return;
      }

      const lay = this.layout(W, H);
      // the question
      if (this.q.type === 'next') {
        GOL.drawVeiledGem(ctx, lay.promptX, lay.promptY, 40, t, 0.6, 0, true);
        GOL.drawFirefly(ctx, lay.promptX + 66 + Math.sin(t * 1.4) * 6, lay.promptY - 40 + Math.sin(t * 2.2) * 6, t, 1);
        GOL.text(ctx, 'listen… then find the ayah that comes NEXT', W / 2, lay.promptY + 74, { size: 17.5, weight: '800', color: '#F5EDD4' });
        GOL.text(ctx, 'tap the big gem to hear it again', W / 2, lay.promptY + 98, { size: 13, weight: '600', color: 'rgba(245,237,212,0.65)' });
      } else {
        // find ayah k: a numbered star, with k little stars for small readers
        GOL.star8Path(ctx, lay.promptX, lay.promptY, 40, Math.PI / 8);
        ctx.fillStyle = alpha('#FFE9A8', 0.9); ctx.fill();
        ctx.strokeStyle = alpha('#D9A44A', 0.95); ctx.lineWidth = 2.5; ctx.stroke();
        GOL.text(ctx, String(this.q.correct), lay.promptX, lay.promptY + 2, { size: 30, weight: '800', color: '#7A6238' });
        for (let i = 0; i < this.q.correct; i++) {
          GOL.star8(ctx, lay.promptX - (this.q.correct - 1) * 9 + i * 18, lay.promptY + 58, 5, Math.PI / 8, alpha('#FFE9A8', 0.85));
        }
        GOL.text(ctx, 'which gem holds ayah ' + this.q.correct + '?', W / 2, lay.promptY + 88, { size: 17.5, weight: '800', color: '#F5EDD4' });
        GOL.text(ctx, 'tap the gems to listen', W / 2, lay.promptY + 112, { size: 13, weight: '600', color: 'rgba(245,237,212,0.65)' });
      }
      // the choices
      for (const ch of lay.choices) {
        const c = ch.c;
        ctx.globalAlpha = c.asleep ? 0.28 : 1;
        if (c.revealed) {
          GOL.drawGem(ctx, ch.x, ch.y, 30, GOL.GEMS[(c.ayah - 1) % 7], t, { phase: c.phase });
        } else {
          GOL.drawVeiledGem(ctx, ch.x, ch.y, 28, t, c.phase, c.pulse, c.heard);
        }
        ctx.globalAlpha = 1;
        if (this.picked === c && !c.asleep) {
          ctx.strokeStyle = alpha('#FFE9A8', 0.75 + 0.25 * Math.sin(t * 4));
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(ch.x, ch.y, 40 + Math.sin(t * 4) * 2, 0, Math.PI * 2); ctx.stroke();
        }
      }
      // the "this one!" button
      if (this.picked && this.phase === 'ask') {
        GOL.drawButton(ctx, W / 2, lay.okY, 28, 'check');
        GOL.text(ctx, 'this one!', W / 2, lay.okY + 46, { size: 14, weight: '800', color: '#F5EDD4' });
      }
      // progress: little stars for each question
      for (let i = 0; i < this.qs.length; i++) {
        const px = W / 2 + (i - (this.qs.length - 1) / 2) * 26;
        GOL.star8Path(ctx, px, H - 34, 7, Math.PI / 8);
        ctx.fillStyle = i < this.qi ? alpha('#FFE9A8', 0.9) : 'rgba(245,237,212,0.25)';
        ctx.fill();
      }
      this.fx.draw(ctx);
      for (const b of this.buttons) GOL.drawButton(ctx, b.x, b.y, 22, b.icon ? b.icon() : b.iconName);
      GOL.drawVignette(ctx, W, H, 0.2);
    }
  };
  GOL.registerScene('trial', trial);

  // ================================================================ STORY ==
  // How the surah came down — a small storybook, read together.
  const story = {
    t: 0, L: null, page: 0, fx: null, buttons: [], pageK: 1, _done: false,
    enter(params) {
      this.L = GOL.LEVELS[params.index];
      this.story = this.L.surah.story;
      this.page = 0;
      this.pageK = 0;
      this.t = 0;
      this.fx = GOL.makeFx();
      this._done = false;
      GOL.audio.startAmbience('quiet');
      // the storyteller's voice, page by page (pre-generated, never robotic)
      GOL.audio.preloadVoice(this.story.pages.map((_, i) => GOL.storyVoiceId(this.L.surah.slug, i)));
      this.narrate();
      GOL.stamp('storyStart');
    },
    exit() { GOL.audio.stopRecitation(); GOL.audio.stopSpeak(); },
    narrate() {
      GOL.audio.speak(GOL.storyVoiceId(this.L.surah.slug, this.page));
    },
    turn(dir) {
      this.page += dir;
      this.pageK = 0;
      GOL.audio.sfx('tap');
      this.narrate();
    },
    update(dt, W, H) {
      this.t += dt;
      this.pageK = Math.min(1, this.pageK + dt / 0.45);
      this.fx.update(dt);
      if (Math.random() < dt * 1.4) this.fx.spawn('mote', Math.random() * W, Math.random() * H * 0.7, {});
      const last = this.page === this.story.pages.length - 1;
      this.buttons = [
        { x: 40, y: 40, r: 30, iconName: 'map', fn: () => GOL.go('map', { focus: this.L.index }) },
        Object.assign({}, GOL.muteButton(W))
      ];
      if (this.page > 0) this.buttons.push({ x: W * 0.14, y: H * 0.55, r: 34, iconName: 'back', fn: () => this.turn(-1) });
      if (!last) this.buttons.push({ x: W * 0.86, y: H * 0.55, r: 34, iconName: 'play', fn: () => this.turn(1) });
      if (last && !this._done) {
        this._done = true;
        const st = GOL.store.level(this.L.surahId);
        st.storyRead++;
        GOL.store.save();
        GOL.stamp('story');
        GOL.audio.sfx('praise');
      }
      if (last) {
        this.buttons.push({ x: W / 2, y: H * 0.82, r: 34, iconName: 'sound', fn: () => GOL.audio.playSurah(this.L.surah, {}) });
      }
      GOL.hitButtons(GOL.Input.taps, this.buttons);
    },
    draw(ctx, W, H) {
      const t = this.t;
      // a quiet evening room
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#EFE6CC'); bg.addColorStop(1, '#D9CCA8');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      // the storybook
      const pw = Math.min(760, W - 160), ph = Math.min(420, H - 200);
      const px = W / 2 - pw / 2, py = H * 0.5 - ph / 2;
      GOL.drawPanel(ctx, px, py, pw, ph, { radius: 26 });
      GOL.text(ctx, this.L.surah.englishName + ' · ' + this.L.surah.arabicName, W / 2, py - 40, { size: 24, weight: '800' });
      GOL.text(ctx, this.story.title, W / 2, py + 52, { size: 21, weight: '800', color: GOL.GOLD });
      // gem garland: one gem per ayah, glowing shyly along the top
      // (long surahs draw their garland closer together to stay on the page)
      {
        const gn = this.L.surah.verses.length;
        const gs = Math.min(34, (pw - 80) / Math.max(1, gn - 1));
        this.L.surah.verses.forEach((v, i) => {
          const gx = W / 2 + (i - (gn - 1) / 2) * gs;
          GOL.drawGem(ctx, gx, py + 90, Math.min(9, gs * 0.28 + 2), GOL.GEMS[i % 7], t, { phase: i, glow: 0.4 });
        });
      }
      // the page, fading in
      ctx.globalAlpha = GOL.ease.out(this.pageK);
      const lines = GOL.wrapText(ctx, this.story.pages[this.page], pw - 130, 19, '600');
      lines.forEach((ln, i) => {
        GOL.text(ctx, ln, W / 2, py + 150 + i * 32, { size: 19, weight: '600', color: GOL.INK });
      });
      ctx.globalAlpha = 1;
      // page dots
      this.story.pages.forEach((_, i) => {
        ctx.fillStyle = i === this.page ? alpha(GOL.GOLD, 0.95) : 'rgba(120,104,70,0.25)';
        ctx.beginPath();
        ctx.arc(W / 2 + (i - (this.story.pages.length - 1) / 2) * 22, py + ph - 34, i === this.page ? 5.5 : 4, 0, Math.PI * 2);
        ctx.fill();
      });
      const last = this.page === this.story.pages.length - 1;
      if (last) GOL.text(ctx, 'hear the whole surah', W / 2, H * 0.82 + 52, { size: 13.5, weight: '700', color: GOL.INK_SOFT });
      // Noor reads along
      GOL.drawFirefly(ctx, px + pw - 46 + Math.sin(t * 1.3) * 7, py + 44 + Math.sin(t * 2.1) * 5, t, 1);
      this.fx.draw(ctx);
      for (const b of this.buttons) GOL.drawButton(ctx, b.x, b.y, b.r > 30 ? 26 : 22, b.icon ? b.icon() : b.iconName);
      GOL.drawVignette(ctx, W, H, 0.1);
    }
  };
  GOL.registerScene('story', story);

  // ======================================================== MEANING MATCH ==
  // For growing readers: each veiled gem speaks an ayah — carry it to the
  // meaning it belongs to. Sound and sense, joined by hand.
  const meanings = {
    t: 0, L: null, fx: null, buttons: [], gems: null, cards: null,
    held: null, donePhase: null, reciteI: -1,
    enter(params) {
      this.L = GOL.LEVELS[params.index];
      this.fx = GOL.makeFx();
      this.t = 0;
      this.held = null;
      this.donePhase = null;
      this.reciteI = -1;
      const n = this.L.surah.verses.length;
      const rng = GOL.rng((Date.now() % 80000) + 3);
      const order = this.L.surah.verses.map((v) => v.n);
      const corder = order.slice();
      for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      for (let i = corder.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [corder[i], corder[j]] = [corder[j], corder[i]]; }
      this.gems = order.map((ayah, i) => ({ ayah, i, x: 0, y: 0, heard: false, matched: false, pulse: 0, phase: i * 1.7, drift: null }));
      this.cards = corder.map((ayah, i) => ({ ayah, i, matched: false, blush: 0 }));
      GOL.audio.startAmbience('quiet');
      GOL.audio.preloadSurah(this.L.surah);
      GOL.audio.preloadVoice(['ui-meanings']);
      GOL.audio.speak('ui-meanings');
      GOL.stamp('meaningsStart');
    },
    exit() { GOL.audio.stopRecitation(); GOL.audio.stopSpeak(); },

    layout(W, H) {
      const n = this.gems.length;
      const top = 120, bottom = H - 40;
      const rh = (bottom - top) / n;
      const gemX = W * 0.12;
      const cards = this.cards.map((c, i) => ({
        c, x: W * 0.24, y: top + i * rh + 4, w: W * 0.72, h: rh - 8
      }));
      const gems = this.gems.map((g, i) => ({ g, x: gemX + ((i % 2) - 0.5) * 34, y: top + i * rh + rh / 2 }));
      return { cards, gems, rh };
    },

    update(dt, W, H) {
      this.t += dt;
      this.fx.update(dt);
      this.buttons = [
        { x: 40, y: 40, r: 30, iconName: 'map', fn: () => GOL.go('map', { focus: this.L.index }) },
        Object.assign({}, GOL.muteButton(W))
      ];
      if (GOL.hitButtons(GOL.Input.taps, this.buttons)) return;
      const lay = this.layout(W, H);
      // home positions & drifting
      for (const gp of lay.gems) {
        const g = gp.g;
        if (g.matched) continue;
        g.pulse = Math.max(0, g.pulse - dt * 0.6);
        if (this.held === g) { const d = GOL.Input.drag; if (d) { g.x = d.x; g.y = d.y; } continue; }
        if (g.drift) {
          g.drift.t += dt / 0.6;
          const e = GOL.ease.out(Math.min(1, g.drift.t));
          g.x = g.drift.fromX + (gp.x - g.drift.fromX) * e;
          g.y = g.drift.fromY + (gp.y - g.drift.fromY) * e;
          if (g.drift.t >= 1) g.drift = null;
          continue;
        }
        g.x = gp.x + Math.sin(this.t * 0.9 + g.phase) * 5;
        g.y = gp.y + Math.sin(this.t * 1.2 + g.phase * 1.4) * 4;
      }
      for (const c of this.cards) c.blush = Math.max(0, c.blush - dt);

      if (this.donePhase) {
        this.donePhase.t += dt;
        if (this.donePhase.t > 1 && !this.donePhase.recited) {
          this.donePhase.recited = true;
          GOL.audio.playSurah(this.L.surah, {
            onVerse: (i) => (this.reciteI = i),
            onend: () => { this.reciteI = -1; }
          });
        }
        return;
      }

      // tap to listen; drag to carry
      if (GOL.Input.drag && !this.held) {
        const d = GOL.Input.drag;
        if (GOL.dist(d.x, d.y, d.startX, d.startY) > 10) {
          for (const g of this.gems) {
            if (g.matched || g.drift) continue;
            if (GOL.dist(d.startX, d.startY, g.x, g.y) < 40) {
              this.held = g;
              if (!g.heardHold) { g.heardHold = true; g.heard = true; g.pulse = 1; GOL.audio.playVerse(this.L.surahId, g.ayah, null); }
              break;
            }
          }
        }
      }
      if (!this.held) for (const g of this.gems) g.heardHold = false;
      for (const tap of GOL.Input.taps) {
        if (tap.ui) continue;
        for (const g of this.gems) {
          if (g.matched) continue;
          if (GOL.dist(tap.x, tap.y, g.x, g.y) < 38) {
            tap.ui = true;
            g.heard = true;
            g.pulse = 1;
            GOL.audio.playVerse(this.L.surahId, g.ayah, null);
            break;
          }
        }
      }
      for (const rel of GOL.Input.releases) {
        if (!this.held) break;
        const g = this.held;
        this.held = null;
        let hitCard = null;
        for (const cp of lay.cards) {
          if (cp.c.matched) continue;
          if (rel.x > cp.x && rel.x < cp.x + cp.w && rel.y > cp.y && rel.y < cp.y + cp.h) { hitCard = cp; break; }
        }
        if (hitCard && hitCard.c.ayah === g.ayah) {
          g.matched = true;
          hitCard.c.matched = true;
          g.x = hitCard.x + 34; g.y = hitCard.y + hitCard.h / 2;
          GOL.audio.sfx('veil');
          GOL.audio.chime(g.ayah - 1, { short: true });
          this.fx.burst(g.x, g.y, GOL.GEMS[(g.ayah - 1) % 7].base, 12);
          if (this.gems.every((x) => x.matched)) {
            this.donePhase = { t: 0, recited: false };
            const st = GOL.store.level(this.L.surahId);
            st.meanings++;
            GOL.store.save();
            GOL.stamp('meanings');
            GOL.audio.sfx('door');
          }
        } else {
          if (hitCard) { hitCard.c.blush = 1; GOL.audio.sfx('drift'); }
          g.drift = { t: 0, fromX: g.x, fromY: g.y };
        }
      }
    },

    draw(ctx, W, H) {
      const t = this.t;
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#EFE6CC'); bg.addColorStop(1, '#D6C9A4');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      GOL.text(ctx, 'Meaning Match · ' + this.L.surah.englishName, W / 2, 40, { size: 22, weight: '800' });
      GOL.text(ctx, this.donePhase ? 'sound and sense, joined — listen to it whole' : 'listen to a gem, then carry it to what it means', W / 2, 66, { size: 13.5, weight: '600', color: GOL.INK_SOFT });
      const lay = this.layout(W, H);
      // cards
      for (const cp of lay.cards) {
        const c = cp.c;
        const v = this.L.surah.verses.find((x) => x.n === c.ayah);
        const hot = this.donePhase && this.reciteI === c.ayah - 1;
        GOL.drawPanel(ctx, cp.x, cp.y, cp.w, cp.h, { radius: 14, plain: true, alpha: c.matched ? 0.98 : 0.8 });
        if (c.matched) {
          ctx.strokeStyle = alpha(GOL.GOLD, hot ? 0.95 : 0.55);
          ctx.lineWidth = hot ? 3 : 2;
          GOL.roundRect(ctx, cp.x + 3, cp.y + 3, cp.w - 6, cp.h - 6, 12);
          ctx.stroke();
        } else if (c.blush > 0) {
          ctx.strokeStyle = alpha('#D98F6C', 0.5 * c.blush);
          ctx.lineWidth = 2.5;
          GOL.roundRect(ctx, cp.x + 3, cp.y + 3, cp.w - 6, cp.h - 6, 12);
          ctx.stroke();
        }
        const maxW = cp.w - 110;
        const size = cp.h > 62 ? 15.5 : 13.5;
        const lines = GOL.wrapText(ctx, v.meaning, maxW, size, '700');
        const lh = size + 5;
        lines.slice(0, 2).forEach((ln, i) => {
          GOL.text(ctx, ln, cp.x + 64, cp.y + cp.h / 2 - ((Math.min(2, lines.length) - 1) * lh) / 2 + i * lh, { size, weight: '700', color: c.matched ? GOL.INK : GOL.INK_SOFT, align: 'left' });
        });
        if (hot) {
          GOL.text(ctx, v.ar, cp.x + cp.w - 24, cp.y + cp.h / 2, { size: Math.min(24, cp.h * 0.44), ar: true, weight: '400', color: '#2E4032', align: 'right' });
        }
      }
      // gems
      for (const g of this.gems) {
        if (g.matched) {
          GOL.drawGem(ctx, g.x, g.y, 15, GOL.GEMS[(g.ayah - 1) % 7], t, { phase: g.phase, glow: 0.7 });
        } else if (this.held === g) {
          GOL.drawVeiledGem(ctx, g.x, g.y, 26, t, g.phase, g.pulse, g.heard);
        } else {
          GOL.drawVeiledGem(ctx, g.x, g.y, 19, t, g.phase, g.pulse, g.heard);
        }
      }
      if (this.donePhase && this.donePhase.t > 0.4) {
        if (Math.random() < 0.12) this.fx.spawn('petal', Math.random() * W, -10, { color: Math.random() < 0.5 ? '#F5B8C4' : '#FFE9A8' });
      }
      this.fx.draw(ctx);
      for (const b of this.buttons) GOL.drawButton(ctx, b.x, b.y, 22, b.icon ? b.icon() : b.iconName);
      GOL.drawVignette(ctx, W, H, 0.1);
    }
  };
  GOL.registerScene('meanings', meanings);
})();
