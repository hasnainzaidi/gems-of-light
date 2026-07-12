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

  // THE STANZA SHRINE (WORLDS-PLAN §1): long surahs are recalled in maqati'
  // (thematic stanzas), one at a time. A world may declare `stanzas: [4,7,5,5]`
  // (run lengths summing to the ayah count). No declaration + ≤12 ayat = a
  // single stanza = exactly today's shrine (regression-free). Over 12 with no
  // declaration, auto-chunk into balanced groups of ≤7 as a safety net.
  function autoChunk(n) {
    const groups = Math.ceil(n / 7);
    const base = Math.floor(n / groups), rem = n % groups;
    const arr = [];
    for (let i = 0; i < groups; i++) arr.push(base + (i < rem ? 1 : 0));
    return arr;
  }
  function computeStanzas(n, declared) {
    if (Array.isArray(declared) && declared.length &&
        declared.every((x) => Number.isInteger(x) && x > 0)) {
      const sum = declared.reduce((a, b) => a + b, 0);
      if (sum === n) return declared.slice(); // valid declaration
    }
    // invalid / absent declaration: fall back, never crash
    if (n > 12) return autoChunk(n);
    return [n];
  }

  const shrine = {
    t: 0, L: null, P: null, bd: null, fx: null,
    gems: null, placed: 0, heldGem: null, miss: 0, autoT: 0,
    phase: 'place', bloomT: 0, grandK: 0, lightK: 0, reciteGem: null,
    buttons: [], firstTry: 0,
    // stanza chunking: the shrine holds one stanza at a time
    stanzas: null, stanzaRanges: null, stanzaIdx: 0, stanzaStart: 0,
    stanzaInT: 999, mergeT: 0, totalSockets: 0,
    // DREAM MODE (the Remembering): reconstructing an EARLIER surah from
    // memory. Set when params.memory is present; absent = the normal shrine.
    dream: false, memory: null, moonT: 0, moonFrom: 0, moonTo: 0, moonK: 0, moonRise: 0,

    enter(params) {
      // A dream is a memory, not a place: the OLD surah, drawn from its own
      // world's palette. When params.memory is absent, everything below is
      // exactly the normal shrine (regression-free).
      this.dream = !!(params.memory && params.memory.surahId);
      this.memory = this.dream ? params.memory : null;

      let def, surahId, palKey, seed;
      if (this.dream) {
        surahId = params.memory.surahId;
        const wdef = GOL.WORLDS3.find((w) => w && w.surahId === surahId);
        palKey = (wdef && (wdef.endPalette || wdef.palette)) || 'falaq';
        if (!GOL.PALETTES[palKey]) palKey = 'falaq';
        seed = 900 + (wdef && wdef.id ? wdef.id : surahId);
        this.worldN = null; // a dream earns no Grand Gem, opens no world
      } else {
        def = params.world ? GOL.WORLDS3[params.world - 1]
          : GOL.PROTOTYPES[params.proto];
        this.worldN = params.world || null;
        surahId = GOL.V3.surah || def.surahId;
        palKey = def.endPalette || def.palette;
        seed = 900 + def.id;
      }
      this.surah = window.GOL_DATA.surahs.find((s) => s.id === surahId);
      this.surahId = surahId;
      this.P = GOL.PALETTES[palKey];
      this.bd = GOL.buildBackdrop(palKey, seed);
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
      this.moonT = 0; this.moonFrom = 0; this.moonTo = 0; this.moonK = 0; this.moonRise = 0;
      this._dreamRecorded = false;
      this._socketMissed = false;
      // knowledge telemetry: the shrine can be brute-forced, so completion
      // alone means little — tries-per-gem and listens-per-gem tell the truth
      this.missTotal = 0;
      this.listens = 0;
      this.runHints = 0;

      // stanza chunking: split the surah into maqati'. A normal short surah
      // is one stanza (regression-free). Dreams find their declaration on the
      // remembered world's def; the live shrine on its own def.
      const totalAyat = this.surah.verses.length;
      const declared = this.dream
        ? (GOL.WORLDS3.find((w) => w && w.surahId === surahId) || {}).stanzas
        : (def && def.stanzas);
      this.stanzas = computeStanzas(totalAyat, declared);
      this.stanzaRanges = [];
      let acc = 0;
      for (const len of this.stanzas) { this.stanzaRanges.push({ start: acc, len }); acc += len; }
      this.totalSockets = totalAyat;
      this.stanzaIdx = 0;
      this.stanzaStart = 0;
      this.stanzaInT = 999; // the first stanza is already present (no fade-up)
      this.mergeT = 0;
      this._mergeChimed = false;
      // debug-accelerated runs never record telemetry (meaningless) and open
      // on the FINAL stanza with only the last gem left to place
      this._debugAccel = !!GOL.DEBUG;
      if (this._debugAccel) this.debugPrefill();
      else this.buildStanzaGems(0);

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
      // during a ceremony the child taps anywhere to move on — don't let the
      // buttons swallow that tap ('moon' is the dream's equivalent of 'done')
      if (this.phase !== 'done' && this.phase !== 'moon') GOL.hitButtons(GOL.Input.taps, this.buttons);

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

      if (this.phase === 'place') { this.stanzaInT += dt; this.updatePlace(dt, W, H); }
      else if (this.phase === 'merge') {
        // a completed stanza compresses into one bright star on the crest,
        // a soft chime, a short wordless breath, then the next stanza drifts in
        this.mergeT += dt;
        const target = this.crestStarPos(this.stanzaIdx, W, H);
        for (const g of this.gems) {
          g.x += (target.x - g.x) * Math.min(1, dt * 6);
          g.y += (target.y - g.y) * Math.min(1, dt * 6);
        }
        if (!this._mergeChimed && this.mergeT > 0.4) {
          this._mergeChimed = true;
          GOL.audio.sfx('praise');
          this.fx.spawn('ring', target.x, target.y, { color: '#FFE9A8', size: 26 });
          for (let i = 0; i < 6; i++) {
            this.fx.spawn('sparkle', target.x + GOL.rnd(-24, 24), target.y + GOL.rnd(-24, 24), { color: '#FFF6DC' });
          }
        }
        if (this.mergeT > 1.7) this.advanceStanza(W, H);
      }
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
          if (this.dream) { this.beginRemembering(); return; }
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
          // debug-accelerated runs are meaningless — never record them
          if (!this._debugAccel) {
            st.shrineRuns = st.shrineRuns || [];
            st.shrineRuns.push({
              at: Date.now(), sockets: this.totalSockets,
              firstTry: this.firstTry, misses: this.missTotal,
              listens: this.listens, hints: this.runHints,
              stanzas: this.stanzaRanges.length
            });
            if (st.shrineRuns.length > 20) st.shrineRuns.splice(0, st.shrineRuns.length - 20);
          }
          GOL.store.save();
          GOL.stamp(first ? 'v3grandGem' : 'v3grandGemAgain');
        }
      } else if (this.phase === 'moon') {
        // THE REMEMBERING MOON — the dream's reward. It rises center-screen and
        // waxes from the old fullness toward the new (once a calendar day).
        this.moonT += dt;
        this.moonRise = GOL.ease.out(Math.min(1, this.moonT / 1.2));
        const waxT = GOL.ease.inOut(Math.min(1, Math.max(0, (this.moonT - 1.3) / 1.2)));
        this.moonK = this.moonFrom + (this.moonTo - this.moonFrom) * waxT;
        if (Math.random() < dt * 9) {
          this.fx.spawn('petal', Math.random() * W, -12, { color: ['#F5B8C4', '#FFF6DC', '#BFE8DC'][Math.floor(Math.random() * 3)] });
        }
        const mx = W / 2, my = this.moonY(H);
        if (Math.random() < dt * 5) {
          this.fx.spawn('sparkle', mx + GOL.rnd(-70, 70), my + GOL.rnd(-70, 70), { color: '#FFF6DC' });
        }
        // once the moon has settled, one tap anywhere carries the dream home
        if (this.moonT > 3) {
          for (const tap of GOL.Input.taps) {
            if (tap.ui) continue;
            tap.ui = true;
            // a dream entered from a world's ember returns to that ember;
            // one entered from the journey's moon door drifts home to the
            // journey, where the freshly waxed moon rests by its disc
            if (this.memory.returnWorld) {
              GOL.go('adventure', { world: this.memory.returnWorld, resume: 'ember' });
            } else {
              GOL.go('title');
            }
            return;
          }
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

    // within the current stanza: the next ayah the open socket wants
    neededAyah() { return this.stanzaStart + this.placed + 1; },
    isLastStanza() { return this.stanzaIdx >= this.stanzaRanges.length - 1; },

    // the gems for one stanza arrive as themselves (gathered in the open),
    // shuffled so the fan never spells the answer. Listening — a tap or a
    // pick-up — is how the child knows which ayah each holds.
    buildStanzaGems(k) {
      const { start, len } = this.stanzaRanges[k];
      const order = [];
      for (let i = 0; i < len; i++) order.push(start + 1 + i);
      const rng = GOL.rng(Date.now() % 100000);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      this.gems = order.map((ayah, i) => ({
        ayah, i, x: 0, y: 0, homeX: 0, homeY: 0,
        phase: Math.random() * 7, placed: -1, drift: null, pulse: 0
      }));
      this.stanzaStart = start;
      this.placed = 0;
      this.miss = 0;
      this.autoT = 0;
      this.heldGem = null;
      this.reciteGem = null;
    },

    // debug acceleration: open on the final stanza with every prior stanza
    // already merged (crest stars lit) and every gem of this stanza placed
    // except the last — silently, no recitations, no per-gem ceremonies.
    debugPrefill() {
      const L = this.stanzaRanges.length;
      this.stanzaIdx = L - 1;
      this.buildStanzaGems(L - 1);
      const { start, len } = this.stanzaRanges[L - 1];
      const lastAyah = start + len;
      this.gems.filter((g) => g.ayah !== lastAyah)
        .sort((a, b) => a.ayah - b.ayah)
        .forEach((g, idx) => { g.placed = idx; });
      this.placed = len - 1; // one socket open, one gem waiting in the fan
    },

    // where stanza k's crest star sits — a row centered over the tree, one
    // slot per stanza boundary (the last stanza blooms instead), left-to-right
    crestStarPos(k, W, H) {
      const total = Math.max(1, this.stanzaRanges.length - 1);
      const y = H * 0.30;
      const spacing = Math.min(52, (W * 0.5) / total);
      return { x: W / 2 + (k - (total - 1) / 2) * spacing, y };
    },

    // a stanza (not the last) is whole: begin the merge-to-crest ceremony
    beginMerge() {
      this.phase = 'merge';
      this.mergeT = 0;
      this._mergeChimed = false;
    },

    // the next stanza's gems drift in from the freshly formed crest star,
    // its sockets fade up (stanzaInT), and recall resumes within it
    advanceStanza(W, H) {
      const from = this.crestStarPos(this.stanzaIdx, W, H);
      this.stanzaIdx++;
      this.buildStanzaGems(this.stanzaIdx);
      this.stanzaInT = 0;
      this.layout(W, H); // seed homeX/homeY so the drift has a destination
      for (const g of this.gems) {
        g.x = from.x + GOL.rnd(-22, 22);
        g.y = from.y + GOL.rnd(-12, 12);
        g.drift = { t: 0, fromX: g.x, fromY: g.y };
      }
      this.phase = 'place';
    },

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
                this.listens++;
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
            this.listens++;
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
            this.missTotal++;
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
            this.runHints++;
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
      const stanzaDone = this.placed >= this.gems.length;
      if (stanzaDone && this.isLastStanza()) {
        // the shrine is whole — the last ayah rings out, then the Tree answers
        GOL.audio.playVerse(this.surahId, g.ayah, () => {
          if (this.phase === 'place') {
            this.phase = 'bloom';
            this.bloomT = 0;
            GOL.audio.sfx('door');
          }
        });
        if (GOL.DEBUG) { this.phase = 'bloom'; this.bloomT = 0; }
      } else if (stanzaDone) {
        // a stanza is whole (not the last): its final ayah rings, then it
        // compresses into a crest star and the next stanza drifts in
        if (!GOL.DEBUG) GOL.audio.playVerse(this.surahId, g.ayah, null);
        this.beginMerge();
      } else if (!GOL.DEBUG) {
        GOL.audio.playVerse(this.surahId, g.ayah, null);
      }
    },

    // debug: G places the next correct gem instantly (works in the dream too,
    // since dream mode shares the identical 'place' phase)
    debugCollectAll() {
      const g = this.gems.find((x) => x.ayah === this.neededAyah() && x.placed < 0);
      if (g && this.phase === 'place') this.place(g, this.sockets[this.placed]);
    },

    // where the Remembering Moon sits, rising as the ceremony opens
    moonY(H) { return H * 0.42 + (1 - (this.moonRise || 0)) * H * 0.22; },

    // a local calendar-day key ('2026-07-12') — the once-a-day wax schedule
    // (shared with the journey's moon door via GOL.todayKey in ui.js)
    todayKey() { return GOL.todayKey(); },

    // Enter the moon ceremony: NO Grand Gem, NO world unlock — only the OLD
    // surah's Remembering Moon waxes a quarter (capped at 1), at most once per
    // calendar day. All the run telemetry still records, tagged dream:true.
    beginRemembering() {
      this.phase = 'moon';
      this.moonT = 0;
      if (this._dreamRecorded) return; // guard against a double-entry
      this._dreamRecorded = true;
      GOL.audio.sfx('blossom');

      const st = GOL.store.level(this.surahId);
      this.moonFrom = st.moon || 0;
      const today = this.todayKey();
      if (st.moonWaxedDay !== today) {
        st.moon = Math.min(1, (st.moon || 0) + 0.25);
        st.moonWaxedDay = today;
      }
      // already remembered today: the ceremony still plays, the moon simply
      // glows at its current fullness — no double-wax, no punishment
      this.moonTo = st.moon;
      this.moonK = this.moonFrom;

      // knowledge telemetry: same shape as a normal run, marked as a dream —
      // but never d.grand, st.completed, nor a v3grandGem stamp
      st.shrineDone = (st.shrineDone || 0) + 1;
      st.shrineFirstTry = Math.max(st.shrineFirstTry || 0, this.firstTry);
      // debug-accelerated runs are meaningless — never record them
      if (!this._debugAccel) {
        st.shrineRuns = st.shrineRuns || [];
        st.shrineRuns.push({
          at: Date.now(), sockets: this.totalSockets,
          firstTry: this.firstTry, misses: this.missTotal,
          listens: this.listens, hints: this.runHints, dream: true,
          stanzas: this.stanzaRanges.length
        });
        if (st.shrineRuns.length > 20) st.shrineRuns.splice(0, st.shrineRuns.length - 20);
      }
      GOL.store.save();
      GOL.stamp('v3remember');
    },

    // ---------------------------------------------------------------- draw --
    draw(ctx, W, H) {
      const t = this.t, P = this.P;
      const lay = this.layout(W, H);
      const groundY = GOL.drawBackdrop(ctx, this.bd, W, H, t, 40, 0.62);

      // a dream is hushed and moonlit: a deep-blue veil over the remembered
      // world, and a field of quietly twinkling stars in the upper sky
      if (this.dream) this.drawDreamSky(ctx, W, H, groundY, t);

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

      // the Wise Tree. Awake in the shrine; in the dream it sleeps — a darker
      // silhouette, greens shaded down, never blossoming (k stays 0).
      this.drawTree(ctx, lay.treeX, lay.treeY + 46, t,
        this.dream ? 0 : (this.phase !== 'place' ? 1 : this.lightK), this.dream);

      // completed stanzas, compressed to bright stars along the crest
      this.drawCrestStars(ctx, W, H, t);

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
        // a new stanza's sockets fade up gently (stanzaInT); older ones are 1
        const sf = this.phase === 'place' ? Math.min(1, this.stanzaInT / 0.6) : 1;
        ctx.save();
        ctx.globalAlpha = sf;
        // stone setting
        ctx.fillStyle = alpha(P.stoneDark, 0.28);
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
        ctx.restore();
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
      // a stanza's gems shrink as they converge into their crest star
      if (this.phase === 'merge') {
        const shrink = 1 - GOL.ease.inOut(Math.min(1, this.mergeT / 1.2));
        for (const g of this.gems) {
          GOL.drawGem(ctx, g.x, g.y, Math.max(2, 13 * shrink), GOL.GEMS[(g.ayah - 1) % 7], t, { phase: g.phase, glow: 0.8 });
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

      // THE REMEMBERING MOON rises center-screen and waxes (drawn above fx so
      // its halo reads clearly, below the vignette)
      if (this.phase === 'moon') {
        const my = this.moonY(H);
        GOL.drawMoon(ctx, W / 2, my, 66, this.moonK, t);
      }

      this.fx.draw(ctx);
      if (this.phase !== 'done' && this.phase !== 'moon') {
        for (const b of this.buttons) GOL.drawButton(ctx, b.x, b.y, 22, b.icon ? b.icon() : b.iconName);
      }
      // a warm light floods gently as the tree wakes — but a dream stays cool,
      // lit only by its moon
      if (!this.dream && this.phase !== 'place') {
        ctx.fillStyle = alpha('#FFF6D0', 0.14 + 0.1 * Math.min(1, this.bloomT / 2.4));
        ctx.fillRect(0, 0, W, H);
      }
      GOL.drawVignette(ctx, W, H, 0.15);
    },

    // A moonlit veil + a field of quietly twinkling stars, over the remembered
    // world. Deterministic star positions (fixed rng seed), gentle twinkle.
    drawDreamSky(ctx, W, H, groundY, t) {
      ctx.fillStyle = alpha('#2E3B58', 0.25);
      ctx.fillRect(0, 0, W, H);
      const r = GOL.rng(20260712);
      const top = Math.min(groundY - 10, H * 0.62);
      for (let i = 0; i < 64; i++) {
        const sx = r() * W;
        const sy = r() * top;
        const rad = 0.7 + r() * 1.5;
        const base = 0.3 + r() * 0.55;
        const tw = base * (0.55 + 0.45 * Math.sin(t * 2 + i * 1.7));
        ctx.fillStyle = alpha('#FFF6DC', Math.max(0, tw));
        ctx.beginPath(); ctx.arc(sx, sy, rad, 0, Math.PI * 2); ctx.fill();
      }
    },

    // Completed stanzas ride the crest as bright accumulated stars (no numbers,
    // progress read at a glance). The one currently merging grows in.
    drawCrestStars(ctx, W, H, t) {
      if (!this.stanzaRanges || this.stanzaRanges.length < 2) return;
      const done = this.stanzaIdx; // stanzas 0..done-1 are already whole
      for (let k = 0; k < done; k++) {
        const p = this.crestStarPos(k, W, H);
        this.drawCrestStar(ctx, p.x, p.y, 1, t, k);
      }
      if (this.phase === 'merge') {
        const p = this.crestStarPos(this.stanzaIdx, W, H);
        this.drawCrestStar(ctx, p.x, p.y, GOL.ease.out(Math.min(1, this.mergeT / 1.4)), t, this.stanzaIdx);
      }
    },
    drawCrestStar(ctx, x, y, k, t, seed) {
      if (k <= 0.01) return;
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.4 + seed * 1.3);
      const g = ctx.createRadialGradient(x, y, 0, x, y, 28 * k);
      g.addColorStop(0, alpha('#FFE9A8', 0.5 * k));
      g.addColorStop(1, alpha('#FFE9A8', 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 28 * k, 0, Math.PI * 2); ctx.fill();
      GOL.star8Path(ctx, x, y, (7 + 3 * k) * (0.9 + 0.15 * pulse), Math.PI / 8);
      ctx.fillStyle = alpha('#FFF6DC', (0.7 + 0.22 * pulse) * k);
      ctx.fill();
      ctx.strokeStyle = alpha('#D9A44A', 0.9 * k);
      ctx.lineWidth = 1.6;
      ctx.stroke();
    },

    // The Wise Tree. k = 0 (asleep) .. 1 (in blossom). `muted` = the dream's
    // sleeping silhouette: greens and bark shaded down, blossoms never open.
    drawTree(ctx, x, baseY, t, k, muted) {
      const bark = muted ? shade('#8A6B4F', 0.42) : '#8A6B4F';
      const rootCol = muted ? shade('#6E5340', 0.42) : '#6E5340';
      ctx.save();
      ctx.translate(x, baseY);
      const sway = Math.sin(t * 0.7) * 0.012;
      ctx.rotate(sway);
      // roots
      ctx.strokeStyle = rootCol;
      ctx.lineCap = 'round';
      for (const [dx, w] of [[-26, 7], [26, 7], [-10, 5], [12, 5]]) {
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(dx * 1.6, 4);
        ctx.quadraticCurveTo(dx * 0.7, -8, dx * 0.25, -26);
        ctx.stroke();
      }
      // trunk
      ctx.fillStyle = bark;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.quadraticCurveTo(-10, -60, -7, -104);
      ctx.lineTo(7, -104);
      ctx.quadraticCurveTo(11, -60, 16, 0);
      ctx.closePath();
      ctx.fill();
      // limbs
      ctx.strokeStyle = bark;
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(-4, -92); ctx.quadraticCurveTo(-34, -112, -52, -128); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4, -92); ctx.quadraticCurveTo(36, -114, 56, -126); ctx.stroke();
      // canopy: sleeping green, waking gold-blossom
      const leaf = (dx, dy, r, base, litCol) => {
        ctx.fillStyle = GOL.color.mix(muted ? shade(base, 0.42) : base, litCol, k * 0.55);
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
