// Gems of Light v3 — worlds.js
// The journey: each world is one surah, built from the prototype learnings.
// A world def is the same shape as a prototype def (worlds/wN-<key>.js files
// register the full recipes); a def without build() is still growing and
// shows as a closed bud. Finishing a world's shrine earns its Grand Gem,
// which opens the next world.
(function () {
  const GOL = window.GOL;

  GOL.WORLDS3 = [];
  GOL.registerWorld = function (n, def) {
    GOL.WORLDS3[n - 1] = Object.assign(GOL.WORLDS3[n - 1] || {}, def, { n });
  };

  // The child-facing journey is one ordered list of keys — pedagogy can be
  // retuned by editing this list alone; files and saves never move.
  GOL.WORLD_ORDER = [
    // Phase 1 — the essentials of prayer
    'fatiha', 'ikhlas', 'falaq', 'nas',
    // Phase 2 — short surahs that build momentum
    'kawthar', 'nasr', 'masad', 'quraish', 'fil', 'humazah', 'asr',
    // Phase 3 — medium lengths that ask for patience
    'takathur', 'qariah', 'adiyat', 'zalzalah', 'bayyinah',
    // Phase 4 — the rest of Juz 'Amma, shortest to longest
    'kafirun', 'maun', 'qadr', 'alaq', 'tin', 'sharh', 'duha', 'lail',
  ];

  // registered worlds in journey order; a key missing from the list keeps
  // its file order at the end (so nothing ever vanishes from the journey)
  GOL.orderedWorlds = function () {
    const pos = (w) => {
      const i = GOL.WORLD_ORDER.indexOf(w.key);
      return i < 0 ? GOL.WORLD_ORDER.length + w.n : i;
    };
    return GOL.WORLDS3.filter(Boolean).sort((a, b) => pos(a) - pos(b));
  };

  // Natural journey access, deliberately separate from a grown-up's practice
  // override. Only this path may award a progression Grand Gem.
  GOL.worldProgressOpen = function (n) {
    const w = GOL.WORLDS3[n - 1];
    if (!w) return false;
    if (GOL.worldDone(n)) return true;
    const seq = GOL.orderedWorlds();
    const i = seq.findIndex((x) => x.n === n);
    for (let j = i - 1; j >= 0; j--) {
      if (seq[j].build) return !!(GOL.store.data.grand && GOL.store.data.grand[seq[j].surahId]);
    }
    return true; // nothing playable stands before it
  };
  // A world is playable when naturally reached OR explicitly opened by a
  // grown-up. The latter is practice access, not fabricated journey progress.
  GOL.worldOpen = function (n) {
    const w = GOL.WORLDS3[n - 1];
    if (!w) return false;
    if (GOL.DEBUG) return true; // the lab: every grown world is playable
    if (GOL.worldProgressOpen(n)) return true;
    return !!(w.surahId != null && GOL.store.data.opened && GOL.store.data.opened.includes(w.surahId));
  };
  GOL.worldPracticeOnly = function (n) {
    const w = GOL.WORLDS3[n - 1];
    return !!(w && !GOL.worldProgressOpen(n) && w.surahId != null &&
      GOL.store.data.opened && GOL.store.data.opened.includes(w.surahId));
  };
  GOL.worldDone = function (n) {
    const w = GOL.WORLDS3[n - 1];
    return !!(w && GOL.store.data.grand && GOL.store.data.grand[w.surahId]);
  };

  // 2026-07-14 journey resequence: a child never loses a world they have
  // already visited. Practice-opening preserves access without fabricating
  // progression or awarding anything.
  GOL.preserveVisitedWorlds = function () {
    const d = GOL.store.data;
    d.migrations = d.migrations || {};
    if (d.migrations.resequence20260714) return;
    d.opened = [...new Set(d.opened || [])];
    for (const w of GOL.WORLDS3.filter((x) => x && x.build)) {
      const st = d.levels && d.levels[w.surahId];
      const visited = st && ((st.lastPlayed || 0) > 0 || (st.seeds || 0) > 0 ||
        (st.heardFull || 0) > 0);
      if (visited && !GOL.worldProgressOpen(w.n) && !d.opened.includes(w.surahId)) {
        d.opened.push(w.surahId);
      }
    }
    d.migrations.resequence20260714 = true;
    GOL.store.save();
  };

  // the world a fresh "tap anywhere" should enter: the furthest open one
  // along the journey that actually has a recipe
  GOL.currentWorld = function () {
    let best = null;
    for (const w of GOL.orderedWorlds()) {
      if (w.build && GOL.worldOpen(w.n)) best = w;
    }
    return best ? best.n : 1;
  };

  // the journey so far (full recipes land in worlds/wN-<key>.js)
  GOL.registerWorld(1, { surahId: 113, key: 'falaq', name: 'the daybreak' });
  GOL.registerWorld(2, { surahId: 114, key: 'nas', name: 'the village' });
  GOL.registerWorld(3, { surahId: 100, key: 'adiyat', name: 'the chargers' });
  GOL.registerWorld(4, { surahId: 97, key: 'qadr', name: 'the blessed night' });
})();
