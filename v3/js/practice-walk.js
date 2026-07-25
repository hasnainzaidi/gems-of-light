// Gems of Light v3 — practice-walk.js
// The Morning Walk: a short dawn-lit garden path with a few standing arches,
// one per surah the day's practice has chosen. The lightling walks the path;
// only the first unfinished arch is alight. Walking into it, she stands and
// listens as the surah's first ayah whispers and a consent ring closes —
// identity before consent, the memory-stone lesson — then the door opens into
// its dream-shrine (or, for a surah still being learned, its world walk).
// When every arch has bloomed, their small stars gather into one practice star
// that settles on the garland. Wordless throughout: no text, no number, no
// failure — only Arabic, light, and the whisper. The scheduler (practice.js)
// owns the day's set, the reps, and the star; this scene is only its face.
(function () {
  const GOL = window.GOL;
  const { alpha, tint, shade, mix } = GOL.color;

  // the arch's stone frame + the ground path she walks
  const ARCH_W = 96;      // outer width of one arch
  const ARCH_H = 134;     // foot to crown
  const LEG_W = 16;       // stone thickness
  const RITUAL_T = 1.4;   // the consent ring's slow growth, in seconds
  const WALK_SPEED = 244; // path-walk px/s (the map's unhurried step feel)

  // the practice-star ceremony, unhurried like the shrine's Grand-Gem spiral,
  // one scale smaller: gather → merge → drift-to-garland → settled
  const CER_GATHER = 1.2, CER_MERGE = 2.2, CER_DRIFT = 3.4;
  const GARLAND_STEP = 30, GARLAND_MAX = 7;

  // a warm gem-color built from a world's own gold, so each Grand Gem glyph
  // wears its world's light (the ayah gems are per-verse; the Grand Gem is gold)
  function gemColorFor(P) {
    const g = P.gold || '#F0C878';
    return {
      base: g, light: tint(g, 0.5), lighter: tint(g, 0.8),
      dark: shade(g, 0.3), darker: shade(g, 0.5), glow: tint(g, 0.35)
    };
  }

  // a few small blossoms at a bloomed arch's feet
  function drawFootFlowers(ctx, x, y, t, seed) {
    const cols = ['#F5B8C4', '#FFE9A8', '#BFE8DC'];
    for (let i = 0; i < 3; i++) {
      const fx = x + (i - 1) * 15;
      const fy = y - Math.abs(((i * 7) % 3)) - 1;
      const sway = Math.sin(t * 1.5 + seed + i) * 0.12;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(sway);
      ctx.strokeStyle = '#6DA84E';
      ctx.lineWidth = 1.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 2); ctx.quadraticCurveTo(0.5, -3, 0, -6); ctx.stroke();
      ctx.translate(0, -8);
      const col = cols[(i + seed) % 3];
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2 + t * 0.1;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * 3.4, Math.sin(a) * 3.4, 2.8, 1.6, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#FFF3C4';
      ctx.beginPath(); ctx.arc(0, 0, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  const practiceWalk = {
    t: 0, fx: null, bd: null, buttons: [],
    doors: null, art: null, log: null,
    hero: null, approach: null, ritual: null, whisper: null,
    ceremony: null, rest: false, settleGuard: 0, archSway: null,

    enter(params) {
      // the walk lives only where the Remembering does, and only once the
      // scheduler is present and enabled (a brand-new player never sees it)
      if (!GOL.EXPERIENCE.remembering || !GOL.practice || !GOL.practice.enabled()) {
        GOL.go(GOL.homeScene || 'title');
        return;
      }
      this.t = 0;
      this.fx = GOL.makeFx();
      // a fixed dawn: the fullest morning palette, one steady seed so the
      // garden is the same every day (this is a place, not a level)
      this.bd = GOL.buildBackdrop('fatiha', 3141);
      this.approach = null;
      this.ritual = null;
      this.whisper = null;
      this.ceremony = null;
      this.rest = false;
      this.settleGuard = 0;

      GOL.practice.ensureToday();
      GOL.practice.refreshDone();
      this.doors = GOL.practice.doors() || [];
      this.log = GOL.practice.recentLog ? (GOL.practice.recentLog(GARLAND_MAX) || []) : [];

      // per-door art: its world palette tints the stone, its gold makes the
      // Grand Gem glyph. Resolve the world by slot first, else by surah.
      this.art = this.doors.map((d) => {
        let def = (d.worldN && GOL.WORLDS3[d.worldN - 1]) || null;
        if (!def) def = (GOL.WORLDS3 || []).find((w) => w && w.surahId === d.surahId) || null;
        let palKey = (def && (def.palette || def.endPalette)) || 'fatiha';
        if (!GOL.PALETTES[palKey]) palKey = 'fatiha';
        const P = GOL.PALETTES[palKey];
        const stone = P.stone || '#EAE0C6', gold = P.gold || '#F0C878';
        return {
          light: tint(mix(stone, gold, 0.28), 0.12),
          base: mix(stone, gold, 0.32),
          dark: shade(mix(stone, gold, 0.4), 0.28),
          gem: gemColorFor(P)
        };
      });
      this.archSway = this.doors.map(() => 0);

      // if the day's star is already earned, the path rests: everything
      // bloomed, the garland whole, one tap home — no ceremony replay
      if (GOL.practice.todayStar && GOL.practice.todayStar()) this.rest = true;

      // place her: fresh in, she stands before the first arch; back from a
      // dream, she stands at the arch that just bloomed and it blooms again
      const lay0 = this.layout(852, 393); // provisional; re-placed on first update
      let startX = lay0.arches.length ? lay0.arches[0].x : 426;
      if (params && params.from === 'dream' && params.surahId != null) {
        const idx = this.doors.findIndex((d) => d.surahId === params.surahId);
        if (idx >= 0 && lay0.arches[idx]) {
          startX = lay0.arches[idx].x;
          this._bloomAt = idx; // spawn the bloom on the first frame we have real geometry
        }
      }
      this.hero = { x: startX, tx: startX, facing: 1, idleT: 3 };

      // a hushed dawn garden: soft breeze, no birds (the 'quiet' ambience the
      // shrine uses) — the whisper and the chimes carry the scene, not birdsong
      if (GOL.audio && GOL.audio.startAmbience) GOL.audio.startAmbience('quiet');
    },

    exit() { this.stopWhisper(); },

    // stop the first-ayah whisper cleanly so a later door may whisper again
    // (echoVerse parks itself as the 'current' recitation until it ends)
    stopWhisper() {
      const h = this.whisper;
      this.whisper = null;
      if (!h) return;
      try { h.el && h.el.pause(); } catch (e) { /* ignore */ }
      try { if (h.finish) h.finish(); } catch (e) { /* ignore */ }
    },

    // one shared geometry for update (hit-testing) and draw. Arches spread
    // across the safe width; the path sits low; the garland hangs by the gate.
    layout(W, H) {
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
      const groundY = Math.round(H * 0.72);
      const pathY = groundY + 20; // where her feet rest on the path
      const n = this.doors ? this.doors.length : 0;
      let innerL = sa.l + 128, innerR = W - sa.r - 128;
      if (innerR < innerL) { innerL = sa.l + 40; innerR = W - sa.r - 40; }
      const arches = [];
      for (let i = 0; i < n; i++) {
        const x = n <= 1 ? (innerL + innerR) / 2
          : innerL + (innerR - innerL) * (i / (n - 1));
        arches.push({ i, door: this.doors[i], x, baseY: groundY });
      }
      return { sa, groundY, pathY, arches, walkL: sa.l + 40, walkR: W - sa.r - 40 };
    },

    // the star hanging above a bloomed arch's crown
    archStarPos(a) { return { x: a.x, y: a.baseY - ARCH_H - 12 }; },
    // the k-th garland slot (slot 0 = nearest the gate, most recent)
    garlandPos(k, W, H) {
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
      return { x: sa.l + 72 + k * GARLAND_STEP, y: sa.t * 0.5 + 48 };
    },

    // ── input + motion ─────────────────────────────────────────────
    update(dt, W, H) {
      this.t += dt;
      this.fx.update(dt);
      const lay = this.layout(W, H);

      // deferred dream-bloom: now that we have real geometry, bloom the arch
      // she returned to (it just completed its dream)
      if (this._bloomAt != null && lay.arches[this._bloomAt]) {
        const a = lay.arches[this._bloomAt];
        this.bloomArch(a);
        this._bloomAt = null;
      }

      this.buttons = [Object.assign({}, GOL.homeButton())];

      // sway impulses on tapped waiting arches ease back to rest
      if (this.archSway) for (let i = 0; i < this.archSway.length; i++) {
        this.archSway[i] = Math.max(0, this.archSway[i] - dt * 2.4);
      }

      // ── the star ceremony owns the screen once it begins ──
      if (this.ceremony) {
        this.ceremony.t += dt;
        this.updateCeremony(W, H);
        // while it plays, swallow taps; once settled, one tap anywhere → home
        for (const tap of GOL.Input.taps) {
          if (tap.ui) continue;
          tap.ui = true;
          if (this.ceremony.settled) { GOL.go(GOL.homeScene || 'title'); return; }
        }
        return;
      }

      // ── resting: the day is done; a tap returns home ──
      if (this.rest) {
        if (GOL.hitButtons(GOL.Input.taps, this.buttons)) return;
        for (const tap of GOL.Input.taps) {
          if (tap.ui) continue;
          tap.ui = true;
          GOL.go(GOL.homeScene || 'title');
          return;
        }
        return;
      }

      // the day's star may become ready the moment the last arch blooms
      // (e.g. right after a dream return). Let the bloom breathe, then gather.
      this.settleGuard += dt;
      if (this.settleGuard > 0.9 && GOL.practice.starReady && GOL.practice.starReady()) {
        this.beginCeremony(W, H);
        return;
      }

      // chrome first — the home button swallows its own tap
      if (GOL.hitButtons(GOL.Input.taps, this.buttons)) { this.stopWhisper(); this.ritual = null; return; }

      // ── taps: walk to a spot, or approach the one alight arch ──
      for (const tap of GOL.Input.taps) {
        if (tap.ui) continue;
        tap.ui = true;
        // a tap during the ritual cancels it (she may wander off)
        if (this.ritual) { this.stopWhisper(); this.ritual = null; }
        const hit = this.archAtPoint(lay, tap.x, tap.y);
        if (hit) {
          const st = hit.door.state;
          if (st === 'next') {
            // walk to this arch, then the door ritual begins on arrival
            this.hero.tx = hit.x;
            this.approach = hit.i;
          } else if (st === 'waiting') {
            // a sleeping arch only sways — it never opens
            this.archSway[hit.i] = 1;
            if (GOL.audio) GOL.audio.sfx('tap');
          } else {
            // a bloomed arch is done: harmless — she may wander over to it
            this.hero.tx = hit.x;
            this.approach = null;
          }
        } else {
          // harmless wandering anywhere on the path
          this.hero.tx = Math.max(lay.walkL, Math.min(lay.walkR, tap.x));
          this.approach = null;
          if (GOL.audio) GOL.audio.sfx('tap');
        }
      }

      // ── walk the path with a gentle ease + step bob ──
      const h = this.hero;
      const d = h.tx - h.x;
      const moving = Math.abs(d) > 1;
      if (moving) {
        h.x += Math.sign(d) * Math.min(Math.abs(d), dt * WALK_SPEED);
        h.facing = d < 0 ? -1 : 1;
        h.idleT = 0;
      } else {
        h.x = h.tx;
        h.idleT += dt;
      }
      h.moving = moving;

      // ── arrival at the alight arch begins the door ritual ──
      if (!moving && this.approach != null && !this.ritual) {
        const a = lay.arches[this.approach];
        if (a && a.door.state === 'next' && Math.abs(h.x - a.x) < 3) {
          this.beginRitual(a);
        }
      }

      // ── the ritual: she stands, listens, the consent ring closes ──
      if (this.ritual) {
        // a step away (her target moved off the arch) cancels it
        if (Math.abs(this.hero.tx - this.ritual.x) > 4) {
          this.stopWhisper();
          this.ritual = null;
        } else {
          this.ritual.t += dt;
          if (this.ritual.t >= RITUAL_T) {
            this.openDoor(this.ritual.door);
            return;
          }
        }
      }
    },

    // which arch (if any) a tap fell on — its stone frame + a little slack
    archAtPoint(lay, x, y) {
      for (const a of lay.arches) {
        if (Math.abs(x - a.x) <= ARCH_W / 2 + 8 &&
            y <= a.baseY + 10 && y >= a.baseY - ARCH_H - 20) {
          return a;
        }
      }
      return null;
    },

    beginRitual(a) {
      this.ritual = { door: a.door, i: a.i, x: a.x, t: 0 };
      this.approach = null;
      // identity before consent: the surah's first ayah whispers as she
      // arrives (null if recitation is off or something is already sounding —
      // then the ring simply closes in silence, which is fine)
      if (GOL.audio && GOL.audio.echoVerse) {
        this.whisper = GOL.audio.echoVerse(a.door.surahId, 1, 0.25);
      }
    },

    // the ring has closed: cross the threshold
    openDoor(door) {
      this.stopWhisper();
      this.ritual = null;
      if (GOL.audio) { GOL.audio.unlock(); GOL.audio.sfx('door'); }
      if (door.earned === false) {
        // still being learned: the real world walk (ordered gems → campfire).
        // The scheduler credits this door at the campfire via heardFull.
        GOL.go('adventure', { world: door.worldN });
      } else {
        // an earned surah: its dream-shrine. The dream returns here with
        // { from:'dream', surahId } and its arch will bloom.
        GOL.go('shrine', {
          memory: {
            surahId: door.surahId, returnWorld: null,
            returnScene: 'practiceWalk', source: 'walk'
          }
        });
      }
    },

    // a bloom answers a returned door: a soft ring, petals, a gentle chime
    bloomArch(a) {
      if (GOL.audio) GOL.audio.sfx('bloom');
      this.fx.spawn('ring', a.x, a.baseY - ARCH_H * 0.5, { color: '#FFE9A8', size: 26 });
      for (let i = 0; i < 10; i++) {
        this.fx.spawn('petal', a.x + GOL.rnd(-40, 40), a.baseY - ARCH_H - GOL.rnd(0, 30),
          { color: ['#F5B8C4', '#FFE9A8', '#BFE8DC'][i % 3] });
      }
      for (let i = 0; i < 6; i++) {
        this.fx.spawn('sparkle', a.x + GOL.rnd(-30, 30), a.baseY - ARCH_H * 0.5 + GOL.rnd(-20, 20),
          { color: '#FFF6DC' });
      }
    },

    // ── the star ceremony ──────────────────────────────────────────
    beginCeremony(W, H) {
      const lay = this.layout(W, H);
      GOL.practice.awardStar();
      this.stopWhisper();
      this.ritual = null;
      this.approach = null;
      // the small stars above each bloomed arch are the ceremony's sources;
      // they spiral to a center point, merge, then drift to the garland gate
      const sources = lay.arches.map((a) => {
        const p = this.archStarPos(a);
        return { x0: p.x, y0: p.y };
      });
      // where the new star lands: the gate-side garland slot (slot 0)
      const land = this.garlandPos(0, W, H);
      this.ceremony = {
        t: 0, settled: false, chimed: false,
        sources, center: { x: W / 2, y: H * 0.36 }, land
      };
      if (GOL.audio) GOL.audio.sfx('yourTurn');
    },

    updateCeremony(W, H) {
      const c = this.ceremony;
      if (!c.chimed && c.t >= CER_GATHER) {
        c.chimed = true;
        if (GOL.audio) GOL.audio.sfx('blossom');
        for (let i = 0; i < 8; i++) {
          this.fx.spawn('sparkle', c.center.x + GOL.rnd(-26, 26), c.center.y + GOL.rnd(-26, 26),
            { color: '#FFF6DC' });
        }
      }
      // gentle petals through the whole rite
      if (Math.random() < 0.14) {
        this.fx.spawn('petal', Math.random() * W, -12,
          { color: ['#F5B8C4', '#FFE9A8', '#BFE8DC'][Math.floor(Math.random() * 3)] });
      }
      if (c.t >= CER_DRIFT && !c.settled) {
        c.settled = true;
        this.rest = true; // the path now rests; a tap returns home
        if (GOL.audio) GOL.audio.sfx('praise');
        this.fx.spawn('ring', c.land.x, c.land.y, { color: '#FFE9A8', size: 18 });
      }
    },

    // ── draw ───────────────────────────────────────────────────────
    draw(ctx, W, H) {
      const t = this.t;
      const lay = this.layout(W, H);
      const groundY = GOL.drawBackdrop(ctx, this.bd, W, H, t, 30, 0.72);

      // a soft warm path band over the meadow — the garden walk
      const P = this.bd.P;
      const bandTop = groundY + 6;
      const pg = ctx.createLinearGradient(0, bandTop, 0, H);
      pg.addColorStop(0, alpha(tint(P.soil || '#C4A981', 0.32), 0.55));
      pg.addColorStop(1, alpha(P.soil || '#C4A981', 0.16));
      ctx.fillStyle = pg;
      ctx.fillRect(0, bandTop, W, H - bandTop);

      // the garland along the gate-line
      this.drawGarland(ctx, W, H);

      // the arches, back to front (left to right)
      for (const a of lay.arches) this.drawArch(ctx, a, t);

      // the lightling on the path, in front of the arches
      if (this.hero) {
        const h = this.hero;
        GOL.drawSprite(ctx, h.x, lay.pathY, {
          vx: h.moving ? h.facing * WALK_SPEED : 0, vy: 0,
          grounded: true, facing: h.facing, t,
          idleT: h.idleT, blink: Math.sin(t * 0.7) > 0.98,
          squashX: 1, squashY: 1, moving: !!h.moving,
          eyesClosed: !!this.ritual // she closes her eyes to listen at the door
        });
      }

      // the consent ring, growing around the arch while she listens
      if (this.ritual) {
        const a = lay.arches[this.ritual.i];
        if (a) {
          const k = Math.min(1, this.ritual.t / RITUAL_T);
          const cx = a.x, cy = a.baseY - ARCH_H * 0.5;
          ctx.strokeStyle = alpha('#FFE9A8', 0.3 + 0.5 * k);
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.arc(cx, cy, ARCH_W * 0.62 - k * (ARCH_W * 0.24), 0, Math.PI * 2);
          ctx.stroke();
          // a closing sweep marks how near the threshold is
          ctx.strokeStyle = alpha('#FFF6DC', 0.85);
          ctx.lineWidth = 3; ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(cx, cy, ARCH_W * 0.52, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2);
          ctx.stroke();
          ctx.lineCap = 'butt';
        }
      }

      this.fx.draw(ctx);

      // the ceremony rides above everything
      if (this.ceremony) this.drawCeremony(ctx, W, H);

      // chrome
      for (const b of this.buttons) GOL.drawButton(ctx, b.x, b.y, 22, b.iconName);
      GOL.drawVignette(ctx, W, H, 0.14);
    },

    drawArch(ctx, a, t) {
      const art = this.art[a.i];
      const st = a.door.state;
      const dim = st === 'waiting';
      const shoulderY = a.baseY - (ARCH_H - ARCH_W / 2);
      const halfIn = ARCH_W / 2 - LEG_W; // inner opening half-width
      const sway = (this.archSway && this.archSway[a.i]) || 0;

      ctx.save();
      if (dim) ctx.globalAlpha = 0.52;
      // a sleeping arch sways gently about its base when tapped
      if (sway > 0.001) {
        ctx.translate(a.x, a.baseY);
        ctx.rotate(Math.sin(this.t * 9) * sway * 0.045);
        ctx.translate(-a.x, -a.baseY);
      }

      // breathing glow behind the alight ('next') arch
      if (st === 'next') {
        const br = 0.5 + 0.5 * Math.sin(t * 2.2);
        const gy = a.baseY - ARCH_H * 0.5;
        const g = ctx.createRadialGradient(a.x, gy, 8, a.x, gy, ARCH_W * 1.2);
        g.addColorStop(0, alpha('#FFE9A8', 0.18 + 0.16 * br));
        g.addColorStop(1, alpha('#FFE9A8', 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(a.x, gy, ARCH_W * 1.2, 0, Math.PI * 2); ctx.fill();
      }

      // stone frame: two legs + a rounded crown, painted in the world's tint
      const grad = ctx.createLinearGradient(a.x - ARCH_W / 2, 0, a.x + ARCH_W / 2, 0);
      grad.addColorStop(0, dim ? shade(art.base, 0.28) : art.dark);
      grad.addColorStop(0.5, dim ? shade(art.base, 0.14) : art.light);
      grad.addColorStop(1, dim ? shade(art.base, 0.28) : art.base);
      ctx.fillStyle = grad;
      ctx.beginPath();
      // outer silhouette (up the left, over the crown, down the right)
      ctx.moveTo(a.x - ARCH_W / 2, a.baseY);
      ctx.lineTo(a.x - ARCH_W / 2, shoulderY);
      ctx.arc(a.x, shoulderY, ARCH_W / 2, Math.PI, 0, false);
      ctx.lineTo(a.x + ARCH_W / 2, a.baseY);
      ctx.lineTo(a.x + halfIn, a.baseY);
      // inner opening (down the right of the hole, under the crown, up the left)
      ctx.lineTo(a.x + halfIn, shoulderY);
      ctx.arc(a.x, shoulderY, halfIn, 0, Math.PI, true);
      ctx.lineTo(a.x - halfIn, a.baseY);
      ctx.closePath();
      ctx.fill();
      // a fine warm rim
      ctx.strokeStyle = alpha(dim ? '#8A7A55' : '#C89B55', 0.6);
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // the Grand Gem glyph floating in the archway
      const gemY = a.baseY - ARCH_H * 0.5 + Math.sin(t * 1.3 + a.i) * 4;
      const glow = st === 'waiting' ? 0.28 : st === 'done' ? 0.85 : 1;
      GOL.drawGem(ctx, a.x, gemY, 15, art.gem, t, { phase: a.i * 0.7, glow });

      ctx.restore();

      // a bloomed arch: flowers at its feet + a small star above the crown
      // (the star is hidden while the ceremony carries it aloft)
      if (st === 'done') {
        drawFootFlowers(ctx, a.x, a.baseY + 6, t, a.i);
        if (!this.ceremony) {
          const sp = this.archStarPos(a);
          GOL.star8(ctx, sp.x, sp.y, 7, Math.PI / 8 + t * 0.14, alpha('#F0C878', 0.9));
        }
      }
    },

    drawGarland(ctx, W, H) {
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
      // stars earned on past days (newest first), plus today's once earned
      const past = (this.log || []).filter((e) => e && e.star).length;
      const hasToday = this.rest || (this.ceremony && this.ceremony.settled);
      const total = Math.min(GARLAND_MAX, past + (hasToday ? 1 : 0));
      if (total <= 0 && !this.ceremony) return;

      // a gentle hanging string from the gate
      const first = this.garlandPos(0, W, H);
      const lastK = Math.max(0, total - 1);
      const last = this.garlandPos(lastK, W, H);
      ctx.save();
      ctx.strokeStyle = alpha('#C89B55', 0.5);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(first.x - 14, first.y - 6);
      ctx.quadraticCurveTo((first.x + last.x) / 2, last.y + 8, last.x + 14, last.y - 6);
      ctx.stroke();
      ctx.restore();

      for (let k = 0; k < total; k++) {
        const p = this.garlandPos(k, W, H);
        // a tiny stem from the string
        ctx.strokeStyle = alpha('#C89B55', 0.4);
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(p.x, p.y - 8); ctx.lineTo(p.x, p.y - 2); ctx.stroke();
        GOL.star8(ctx, p.x, p.y, 6, Math.PI / 8 + this.t * 0.1, alpha('#F0C878', 0.9));
        GOL.star8(ctx, p.x, p.y, 3, Math.PI / 8, alpha('#FFF6DC', 0.9));
      }
    },

    drawCeremony(ctx, W, H) {
      const c = this.ceremony;
      const eio = GOL.ease.inOut;
      if (c.t < CER_GATHER) {
        // the arch-stars spiral inward toward the center
        const k = eio(Math.min(1, c.t / CER_GATHER));
        for (let i = 0; i < c.sources.length; i++) {
          const s = c.sources[i];
          const a = i * 1.7 + c.t * (3 + i);
          const rad = (1 - k) * 26;
          const x = s.x0 + (c.center.x - s.x0) * k + Math.cos(a) * rad;
          const y = s.y0 + (c.center.y - s.y0) * k + Math.sin(a) * rad;
          GOL.star8(ctx, x, y, 6 + k * 2, Math.PI / 8 + this.t * 0.2, alpha('#F0C878', 0.9));
        }
        return;
      }
      // one bright practice star: grows at the center, then drifts to the garland
      let px = c.center.x, py = c.center.y, r = 11;
      if (c.t < CER_MERGE) {
        const g = eio((c.t - CER_GATHER) / (CER_MERGE - CER_GATHER));
        r = 11 + g * 11;
      } else {
        const g = eio(Math.min(1, (c.t - CER_MERGE) / (CER_DRIFT - CER_MERGE)));
        px = c.center.x + (c.land.x - c.center.x) * g;
        py = c.center.y + (c.land.y - c.center.y) * g;
        r = 22 - g * 15;
      }
      const glow = ctx.createRadialGradient(px, py, 2, px, py, r * 2.6);
      glow.addColorStop(0, alpha('#FFE9A8', 0.5));
      glow.addColorStop(1, alpha('#FFE9A8', 0));
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(px, py, r * 2.6, 0, Math.PI * 2); ctx.fill();
      GOL.star8(ctx, px, py, r, Math.PI / 8 + this.t * 0.25, alpha('#FFF6DC', 0.96));
      GOL.star8(ctx, px, py, r * 0.5, Math.PI / 8, alpha('#F0C878', 0.95));
      if (Math.random() < 0.3) {
        this.fx.spawn('sparkle', px + GOL.rnd(-r, r), py + GOL.rnd(-r, r), { color: '#FFE9A8' });
      }
    }
  };

  GOL.registerScene('practiceWalk', practiceWalk);
})();
