// Gems of Light v3 — shrine.js
// The world's memory: an ancient shrine with one empty socket at a time.
// The child asks "what comes next?", listens to the gems, and sets the
// surah back into the stone, ayah by ayah. Wrong gems drift home without
// a sound of blame; after two quiet misses the right gem begins to shimmer.
// When the shrine is whole, the Wise Tree blossoms and the Ayah Gems become
// one Grand Gem. The Tree is a witness, not a teacher.
(function () {
  const GOL = window.GOL;
  const { alpha, tint, shade } = GOL.color;

  const GRAND = { base: '#F0C878', light: '#FFE9A8', lighter: '#FFF6DC', dark: '#D9A44A', darker: '#B98A3E', glow: '#FFE9A8' };

  const shrine = {
    t: 0, L: null, P: null, bd: null, fx: null,
    gems: null, placed: 0, heldGem: null, miss: 0, autoT: 0,
    phase: 'place', bloomT: 0, grandK: 0, lightK: 0, reciteGem: null,
    buttons: [], firstTry: 0,

    enter(params) {
      const def = params.world ? GOL.WORLDS3[params.world - 1]
        : GOL.PROTOTYPES[params.proto || GOL.V3.proto];
      this.worldN = params.world || null;
      const surahId = GOL.V3.surah || def.surahId;
      this.surah = window.GOL_DATA.surahs.find((s) => s.id === surahId);
      this.surahId = surahId;
      const palKey = def.endPalette || def.palette;
      this.P = GOL.PALETTES[palKey];
      this.bd = GOL.buildBackdrop(palKey, 900 + def.id);
      this.fx = GOL.makeFx();
      this.t = 0;
      this.phase = 'place';
      this.placed = 0;
      this.miss = 0;
      this.autoT = 0;
      this.bloomT = 0;
      this.grandK = 0;
      this.lightK = 0;
      this.heldGem = null;
      this.reciteGem = null;
      this.firstTry = 0;
      this._socketMissed = false;

      // the gems arrive as themselves (they were gathered in the open);
      // shuffled so the cloud never spells the answer. Listening — a tap,
      // or picking one up — is how the child knows which ayah each holds.
      const order = this.surah.verses.map((v) => v.n);
      const rng = GOL.rng(Date.now() % 100000);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      this.gems = order.map((ayah, i) => ({
        ayah, i, x: 0, y: 0, homeX: 0, homeY: 0,
        phase: Math.random() * 7, placed: -1, drift: null, pulse: 0
      }));

      GOL.audio.startAmbience('quiet');
      GOL.audio.preloadSurah(this.surah);
      GOL.stamp('v3shrineStart');
    },
    exit() { GOL.audio.stopRecitation(); },

    // sockets climb the shrine steps toward the Wise Tree
    layout(W, H) {
      const n = this.gems.length;
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
      const treeX = W / 2, treeY = H * 0.52;
      const sockets = [];
      const spread = Math.min(64, (W - 220 - sa.l - sa.r) / Math.max(1, n - 1));
      for (let i = 0; i < n; i++) {
        sockets.push({
          i,
          x: treeX + (i - (n - 1) / 2) * spread,
          y: H * 0.6 - Math.sin((i / Math.max(1, n - 1)) * Math.PI) * H * 0.05
        });
      }
      // free gems rest in a loose bed of light along the bottom
      const per = Math.min(96, (W - 180 - sa.l - sa.r) / Math.max(1, n - 1) || 96);
      this.gems.forEach((g, i) => {
        g.homeX = W / 2 + (i - (n - 1) / 2) * per;
        g.homeY = H * 0.85 + Math.sin(i * 2.1) * 6;
      });
      return { sockets, treeX, treeY, groundY: H * 0.68 };
    },

    update(dt, W, H) {
      this.t += dt;
      this.fx.update(dt);
      const lay = this.layout(W, H);
      this.sockets = lay.sockets;
      if (Math.random() < dt * 2) this.fx.spawn('mote', Math.random() * W, Math.random() * H * 0.7, {});

      this.buttons = [Object.assign({}, GOL.homeButton()), Object.assign({}, GOL.muteButton(W))];
      if (this.phase !== 'done') GOL.hitButtons(GOL.Input.taps, this.buttons);

      // gems drift like slow fireflies; placed ones sit in their sockets
      // (during the bloom the spiral owns their motion instead)
      if (this.phase === 'place') for (const g of this.gems) {
        if (g.placed >= 0) {
          const s = this.sockets[g.placed];
          g.x = s.x; g.y = s.y;
          continue;
        }
        if (g.drift) {
          g.drift.t += dt / 0.7;
          const e = GOL.ease.out(Math.min(1, g.drift.t));
          g.x = g.drift.fromX + (g.homeX - g.drift.fromX) * e;
          g.y = g.drift.fromY + (g.homeY - g.drift.fromY) * e;
          if (g.drift.t >= 1) g.drift = null;
          continue;
        }
        if (this.heldGem === g) {
          const d = GOL.Input.drag;
          if (d) { g.x = d.x; g.y = d.y; }
          continue;
        }
        g.x = g.homeX + Math.sin(this.t * 0.7 + g.phase) * 12;
        g.y = g.homeY + Math.sin(this.t * 0.9 + g.phase * 1.7) * 8;
      }

      const n = this.gems.length;
      this.lightK += ((this.placed / n) - this.lightK) * Math.min(1, dt * 2);

      if (this.phase === 'place') this.updatePlace(dt, W, H);
      else if (this.phase === 'bloom') {
        this.bloomT += dt;
        // the gems spiral into the tree's heart
        const cx = lay.treeX, cy = lay.treeY - 60;
        const k = Math.min(1, this.bloomT / 2.4);
        this.gems.forEach((g, i) => {
          const a = (i / n) * Math.PI * 2 + this.bloomT * (1.5 + k * 2.5);
          const rad = 90 * (1 - GOL.ease.inOut(k));
          g.x = cx + Math.cos(a) * rad;
          g.y = cy + Math.sin(a) * rad * 0.6;
        });
        if (Math.random() < dt * 18) {
          this.fx.spawn('petal', Math.random() * W, -12, { color: ['#F5B8C4', '#FFE9A8', '#BFE8DC'][Math.floor(Math.random() * 3)] });
        }
        if (Math.random() < dt * 10) {
          this.fx.spawn('sparkle', cx + GOL.rnd(-80, 80), cy - GOL.rnd(0, 120), { color: '#FFE9A8' });
        }
        if (this.bloomT > 2.4) {
          this.phase = 'done';
          this.grandK = 0;
          GOL.audio.sfx('blossom');
          const st = GOL.store.level(this.surahId);
          const d = GOL.store.data;
          d.grand = d.grand || {};
          const first = !d.grand[this.surahId];
          d.grand[this.surahId] = Date.now();
          st.completed = true;
          st.shrineDone = (st.shrineDone || 0) + 1;
          st.shrineFirstTry = Math.max(st.shrineFirstTry || 0, this.firstTry);
          GOL.store.save();
          GOL.stamp(first ? 'v3grandGem' : 'v3grandGemAgain');
        }
      } else if (this.phase === 'done') {
        this.grandK = Math.min(1, this.grandK + dt / 1.2);
        if (Math.random() < dt * 6) {
          this.fx.spawn('petal', Math.random() * W, -12, { color: ['#F5B8C4', '#FFE9A8'][Math.floor(Math.random() * 2)] });
        }
        // one quiet tap, once the gem has fully formed, carries onward
        if (this.grandK >= 1) {
          for (const tap of GOL.Input.taps) {
            if (!tap.ui && this.bloomT > 3.6) {
              tap.ui = true;
              GOL.go('title', { celebrate: this.worldN });
              return;
            }
          }
        }
        this.bloomT += dt;
      }
    },

    neededAyah() { return this.placed + 1; },

    updatePlace(dt, W, H) {
      const Input = GOL.Input;
      const active = this.sockets[this.placed]; // the one open socket

      // pick up — and picking a gem up tells you who it is
      if (Input.drag && !this.heldGem) {
        const d = Input.drag;
        const moved = GOL.dist(d.x, d.y, d.startX, d.startY);
        for (const g of this.gems) {
          if (g.placed >= 0 || g.drift) continue;
          if (GOL.dist(d.startX, d.startY, g.x, g.y) < 46) {
            if (moved > 10) {
              this.heldGem = g;
              if (!g.listenedThisHold) {
                g.listenedThisHold = true;
                GOL.audio.playVerse(this.surahId, g.ayah, null);
              }
            }
            break;
          }
        }
      }
      if (!this.heldGem) {
        for (const g of this.gems) g.listenedThisHold = false;
      }
      // taps replay their ayah
      for (const tap of Input.taps) {
        if (tap.ui) continue;
        for (const g of this.gems) {
          if (GOL.dist(tap.x, tap.y, g.x, g.y) < 42) {
            tap.ui = true;
            g.pulse = 1;
            GOL.audio.playVerse(this.surahId, g.ayah, null);
            this.fx.spawn('ring', g.x, g.y, { color: GOL.GEMS[(g.ayah - 1) % 7].glow, size: 22 });
            break;
          }
        }
      }
      // release over the open socket
      for (const rel of Input.releases) {
        if (!this.heldGem) break;
        const g = this.heldGem;
        this.heldGem = null;
        if (active && GOL.dist(rel.x, rel.y, active.x, active.y) < 58) {
          if (g.ayah === this.neededAyah()) this.place(g, active);
          else {
            // not its place yet — it floats home, unbothered
            this.miss++;
            this._socketMissed = true;
            const st = GOL.store.level(this.surahId);
            st.misorders = st.misorders || {};
            st.misorders[g.ayah] = (st.misorders[g.ayah] || 0) + 1;
            GOL.store.save();
            GOL.audio.sfx('drift');
            g.drift = { t: 0, fromX: g.x, fromY: g.y };
          }
        } else {
          g.drift = { t: 0, fromX: g.x, fromY: g.y };
        }
      }
      // after four quiet misses the shrine helps: the gem finds its own place
      if (this.miss >= 4) {
        this.autoT += dt;
        if (this.autoT > 2.2) {
          this.autoT = 0;
          const g = this.gems.find((x) => x.ayah === this.neededAyah() && x.placed < 0);
          if (g && this.heldGem !== g) {
            const st = GOL.store.level(this.surahId);
            st.hintsUsed = (st.hintsUsed || 0) + 1;
            GOL.store.save();
            this.place(g, this.sockets[this.placed]);
          }
        }
      }
    },

    place(g, socket) {
      g.placed = socket.i;
      g.drift = null;
      if (!this._socketMissed) this.firstTry++;
      this._socketMissed = false;
      this.miss = 0;
      this.autoT = 0;
      this.placed++;
      GOL.audio.sfx('place');
      GOL.audio.chime(socket.i, { short: true, soft: true });
      this.fx.spawn('ring', socket.x, socket.y, { color: '#FFF3C4', size: 18 });
      this.fx.burst(socket.x, socket.y, GOL.GEMS[(g.ayah - 1) % 7].base, 10);
      // nature answers each remembering
      for (let i = 0; i < 5; i++) {
        this.fx.spawn('petal', socket.x + GOL.rnd(-40, 40), socket.y - GOL.rnd(20, 60), { color: Math.random() < 0.5 ? '#F5B8C4' : '#FFE9A8' });
      }
      this.reciteGem = g;
      if (this.placed >= this.gems.length) {
        // the shrine is whole — the last ayah rings out, then the Tree answers
        GOL.audio.playVerse(this.surahId, g.ayah, () => {
          if (this.phase === 'place') {
            this.phase = 'bloom';
            this.bloomT = 0;
            GOL.audio.sfx('door');
          }
        });
        if (GOL.DEBUG) { this.phase = 'bloom'; this.bloomT = 0; }
      } else if (!GOL.DEBUG) {
        GOL.audio.playVerse(this.surahId, g.ayah, null);
      }
    },

    // debug: G places the next correct gem instantly
    debugCollectAll() {
      const g = this.gems.find((x) => x.ayah === this.neededAyah() && x.placed < 0);
      if (g && this.phase === 'place') this.place(g, this.sockets[this.placed]);
    },

    // ---------------------------------------------------------------- draw --
    draw(ctx, W, H) {
      const t = this.t, P = this.P;
      const lay = this.layout(W, H);
      const groundY = GOL.drawBackdrop(ctx, this.bd, W, H, t, 40, 0.62);

      // mossy shrine floor
      const fg = ctx.createLinearGradient(0, groundY, 0, H);
      fg.addColorStop(0, tint(P.stone, 0.18));
      fg.addColorStop(1, P.stoneShade);
      ctx.fillStyle = fg;
      ctx.fillRect(0, groundY + 8, W, H - groundY);
      ctx.strokeStyle = alpha(P.stoneDark, 0.22);
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const y = groundY + 20 + i * ((H - groundY) / 4);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // the Wise Tree, waking with the shrine's light
      this.drawTree(ctx, lay.treeX, lay.treeY + 46, t, this.phase !== 'place' ? 1 : this.lightK);

      // light flows along the restored steps
      if (this.lightK > 0.01 && this.sockets.length > 1) {
        ctx.strokeStyle = alpha('#FFE9A8', 0.4 + 0.15 * Math.sin(t * 2.4));
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        const upto = Math.max(1, Math.floor(this.placed));
        for (let i = 0; i < upto; i++) {
          const s = this.sockets[i];
          if (i === 0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        }
        ctx.stroke();
      }

      // sockets: only the restored ones and the single open one exist
      const n = this.gems.length;
      this.sockets.forEach((s, i) => {
        if (i > this.placed && this.phase === 'place') return; // still sleeping in the stone
        const isActive = i === this.placed && this.phase === 'place';
        const appear = isActive ? Math.min(1, (this.t % 1000) * 0 + 1) : 1;
        // stone setting
        ctx.fillStyle = alpha(P.stoneDark, 0.28 * appear);
        ctx.beginPath(); ctx.ellipse(s.x, s.y + 16, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
        GOL.star8Path(ctx, s.x, s.y, isActive ? 15 + Math.sin(t * 3) * 1.5 : 13, Math.PI / 8);
        const filled = this.gems.some((g) => g.placed === i);
        ctx.fillStyle = filled
          ? alpha('#FFE9A8', 0.55 + 0.2 * Math.sin(t * 3 + i))
          : isActive ? alpha('#FFF6DC', 0.25 + 0.2 * Math.sin(t * 3)) : 'rgba(120,104,70,0.13)';
        ctx.fill();
        ctx.strokeStyle = filled || isActive ? alpha('#D9A44A', 0.95) : 'rgba(150,128,84,0.4)';
        ctx.lineWidth = isActive ? 2.4 : 1.6;
        ctx.stroke();
        if (isActive) {
          // a soft breathing ring asks, wordlessly: what comes next?
          ctx.strokeStyle = alpha('#FFE9A8', 0.45 + 0.3 * Math.sin(t * 2.6));
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(s.x, s.y, 26 + Math.sin(t * 2.6) * 3, 0, Math.PI * 2); ctx.stroke();
        }
      });

      // gems (the bloom block below owns them once the spiral begins)
      const needed = this.neededAyah();
      if (this.phase === 'place') for (const g of this.gems) {
        const C = GOL.GEMS[(g.ayah - 1) % 7];
        let r = g.placed >= 0 ? 12 : 20;
        if (this.heldGem === g) r = 25;
        g.pulse = Math.max(0, (g.pulse || 0) - 1 / 60);
        // after two quiet misses, the right gem begins to shimmer
        const shimmer = this.phase === 'place' && this.miss >= 2 && g.placed < 0 && g.ayah === needed;
        if (shimmer) {
          ctx.strokeStyle = alpha('#FFE9A8', 0.5 + 0.4 * Math.sin(t * 4));
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(g.x, g.y, 30 + Math.sin(t * 4) * 3, 0, Math.PI * 2); ctx.stroke();
        }
        GOL.drawGem(ctx, g.x, g.y, r + (g.pulse || 0) * 6, C, t, { phase: g.phase, glow: g.placed >= 0 ? 0.7 : 1 });
      }

      // gems spiraling in the bloom are drawn above; the Grand Gem forms
      if (this.phase === 'bloom') {
        for (const g of this.gems) {
          GOL.drawGem(ctx, g.x, g.y, 13, GOL.GEMS[(g.ayah - 1) % 7], t, { phase: g.phase });
        }
      }
      if (this.phase === 'done') {
        const k = GOL.ease.out(this.grandK);
        const gy = lay.treeY - 60 - k * 8 + Math.sin(t * 1.4) * 5;
        GOL.drawGem(ctx, lay.treeX, gy, 14 + 30 * k, GRAND, t, { phase: 0.5 });
        if (Math.random() < 0.3) {
          this.fx.spawn('sparkle', lay.treeX + GOL.rnd(-40, 40), gy + GOL.rnd(-40, 40), { color: '#FFE9A8' });
        }
      }

      this.fx.draw(ctx);
      if (this.phase !== 'done') {
        for (const b of this.buttons) GOL.drawButton(ctx, b.x, b.y, 22, b.icon ? b.icon() : b.iconName);
      }
      // light floods gently as the tree wakes
      if (this.phase !== 'place') {
        ctx.fillStyle = alpha('#FFF6D0', 0.14 + 0.1 * Math.min(1, this.bloomT / 2.4));
        ctx.fillRect(0, 0, W, H);
      }
      GOL.drawVignette(ctx, W, H, 0.15);
    },

    // The Wise Tree. k = 0 (asleep) .. 1 (in blossom).
    drawTree(ctx, x, baseY, t, k) {
      ctx.save();
      ctx.translate(x, baseY);
      const sway = Math.sin(t * 0.7) * 0.012;
      ctx.rotate(sway);
      // roots
      ctx.strokeStyle = '#6E5340';
      ctx.lineCap = 'round';
      for (const [dx, w] of [[-26, 7], [26, 7], [-10, 5], [12, 5]]) {
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(dx * 1.6, 4);
        ctx.quadraticCurveTo(dx * 0.7, -8, dx * 0.25, -26);
        ctx.stroke();
      }
      // trunk
      ctx.fillStyle = '#8A6B4F';
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.quadraticCurveTo(-10, -60, -7, -104);
      ctx.lineTo(7, -104);
      ctx.quadraticCurveTo(11, -60, 16, 0);
      ctx.closePath();
      ctx.fill();
      // limbs
      ctx.strokeStyle = '#8A6B4F';
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(-4, -92); ctx.quadraticCurveTo(-34, -112, -52, -128); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4, -92); ctx.quadraticCurveTo(36, -114, 56, -126); ctx.stroke();
      // canopy: sleeping green, waking gold-blossom
      const leaf = (dx, dy, r, base, litCol) => {
        ctx.fillStyle = GOL.color.mix(base, litCol, k * 0.55);
        ctx.beginPath();
        ctx.ellipse(dx, dy + Math.sin(t * 0.9 + dx * 0.03) * 2.5, r, r * 0.72, dx * 0.002, 0, Math.PI * 2);
        ctx.fill();
      };
      leaf(-58, -136, 40, '#54904D', '#A3D488');
      leaf(58, -134, 42, '#5A9852', '#A3D488');
      leaf(0, -158, 52, '#639F58', '#B7DE96');
      leaf(-26, -128, 34, '#77B368', '#C4E4A2');
      leaf(28, -126, 34, '#77B368', '#C4E4A2');
      // waking glow
      if (k > 0.02) {
        const g = ctx.createRadialGradient(0, -140, 10, 0, -140, 150);
        g.addColorStop(0, alpha('#FFE9A8', 0.22 * k));
        g.addColorStop(1, alpha('#FFE9A8', 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, -140, 150, 0, Math.PI * 2); ctx.fill();
        // blossoms open across the canopy as the light rises
        const r = GOL.rng(31);
        const count = Math.floor(k * 18);
        for (let i = 0; i < count; i++) {
          const bx = (r() - 0.5) * 150;
          const by = -120 - r() * 62;
          const br = 2.4 + r() * 2.4;
          const tw = 0.75 + 0.25 * Math.sin(t * 2 + i * 1.7);
          ctx.fillStyle = alpha(i % 3 ? '#F5B8C4' : '#FFE9A8', 0.9 * tw);
          for (let p = 0; p < 5; p++) {
            const a = (p / 5) * Math.PI * 2 + i;
            ctx.beginPath();
            ctx.ellipse(bx + Math.cos(a) * br, by + Math.sin(a) * br, br * 0.8, br * 0.45, a, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = alpha('#FFF6DC', 0.95 * tw);
          ctx.beginPath(); ctx.arc(bx, by, br * 0.5, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }
  };
  GOL.registerScene('shrine', shrine);
})();
