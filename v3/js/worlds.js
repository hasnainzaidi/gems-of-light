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

  // One parent-facing choice per painted island. The value is the first
  // WORLD_ORDER slot on that island (six spots per island in the live map).
  // Examples describe the neighbourhood, so the grown-up can recognise a
  // fit without auditing every surah their child knows.
  GOL.JOURNEY_STAGE_CHOICES = [
    { index: 0, frontier: 0, label: 'Planting the first seeds', examples: 'Al-Fatihah · Al-Ikhlas · Al-Falaq' },
    { index: 1, frontier: 6, label: 'Finding their rhythm', examples: 'Al-Masad · Quraysh · Al-Fil' },
    { index: 2, frontier: 12, label: 'Growing in confidence', examples: "Al-Qari'ah · Al-'Adiyat · Az-Zalzalah" },
    { index: 3, frontier: 18, label: 'Taking on longer surahs', examples: "Al-Qadr · Al-'Alaq · At-Tin" }
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

  // A grown-up may tell us which surahs were already known before this
  // garden existed. Keep that claim separate from an earned Grand Gem:
  // parent preparation may paint a world complete, but it must never invent
  // shrine runs, listens, misses, or a completion timestamp.
  GOL.normaliseKnownSurahs = function (ids) {
    const wanted = new Set((ids || []).map(Number));
    return GOL.orderedWorlds()
      .filter((w) => w.build && w.surahId != null && wanted.has(w.surahId))
      .map((w) => w.surahId);
  };
  GOL.worldPriorKnown = function (n) {
    const w = GOL.WORLDS3[n - 1];
    const ob = GOL.store && GOL.store.data && GOL.store.data.onboarding;
    return !!(w && ob && Array.isArray(ob.knownSurahs) && ob.knownSurahs.includes(w.surahId));
  };
  GOL.worldEarned = function (n) {
    const w = GOL.WORLDS3[n - 1];
    return !!(w && GOL.store.data.grand && GOL.store.data.grand[w.surahId]);
  };
  GOL.knownSurahHandoff = function (ids) {
    const seq = GOL.orderedWorlds().filter((w) => w.build && w.surahId != null);
    const known = new Set(GOL.normaliseKnownSurahs(ids));
    let prefix = 0;
    while (prefix < seq.length && known.has(seq[prefix].surahId)) prefix++;
    return {
      knownSurahs: seq.filter((w) => known.has(w.surahId)).map((w) => w.surahId),
      // Re-enter the last familiar world, beginning one bloom behind it. A
      // gap ends the familiar runway even if later surahs were also checked.
      startSurahId: prefix > 1 ? seq[prefix - 2].surahId : null,
      recognitionSurahId: prefix > 0 ? seq[prefix - 1].surahId : null,
      nextSurahId: prefix < seq.length ? seq[prefix].surahId : null
    };
  };
  GOL.journeyStageHandoff = function (stageIndex) {
    const stage = Math.max(0, Math.min(GOL.JOURNEY_STAGE_CHOICES.length - 1,
      Number.isFinite(Number(stageIndex)) ? Math.floor(Number(stageIndex)) : 0));
    const frontier = GOL.JOURNEY_STAGE_CHOICES[stage].frontier;
    const ids = GOL.orderedWorlds()
      .filter((w) => w.build && w.surahId != null && GOL.WORLD_ORDER.indexOf(w.key) < frontier)
      .map((w) => w.surahId);
    const plan = GOL.knownSurahHandoff(ids);
    // Placement begins at the final MAP SLOT of the previous island. It is
    // deliberately not another world replay: the very next step is the first
    // surah on the selected island.
    plan.startSlot = frontier > 0 ? frontier - 1 : null;
    plan.startSurahId = null;
    plan.recognitionSurahId = null;
    plan.journeyStage = stage;
    plan.frontier = frontier;
    return plan;
  };
  GOL.applyKnownSurahs = function (ids, at) {
    const ob = (GOL.store.data.onboarding = GOL.store.data.onboarding || {});
    const plan = GOL.knownSurahHandoff(ids);
    ob.knownSurahs = plan.knownSurahs;
    ob.knownSelectedAt = at || Date.now();
    ob.handoffStartSurahId = plan.startSurahId;
    ob.handoffRecognitionSurahId = plan.recognitionSurahId;
    ob.handoffNextSurahId = plan.nextSurahId;
    return plan;
  };
  GOL.applyJourneyStage = function (stageIndex, at) {
    const plan = GOL.journeyStageHandoff(stageIndex);
    GOL.applyKnownSurahs(plan.knownSurahs, at);
    const ob = GOL.store.data.onboarding;
    ob.journeyStage = plan.journeyStage;
    ob.placementFrontier = plan.frontier;
    ob.handoffStartSlot = plan.startSlot;
    ob.handoffStartSurahId = null;
    ob.handoffRecognitionSurahId = null;
    ob.handoffNextSurahId = plan.nextSurahId;
    return plan;
  };
  GOL.journeySlotAutoBloomed = function (slot) {
    const ob = GOL.store && GOL.store.data && GOL.store.data.onboarding;
    return !!(ob && ob.parentComplete && Number.isFinite(ob.placementFrontier) &&
      slot >= 0 && slot < ob.placementFrontier);
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
      if (seq[j].build && !GOL.worldDone(seq[j].n)) return false;
    }
    return true; // every built world before it is complete (or none exists)
  };
  // A world is playable when naturally reached OR explicitly opened by a
  // grown-up. The latter is practice access, not fabricated journey progress.
  GOL.worldOpen = function (n) {
    const w = GOL.WORLDS3[n - 1];
    if (!w) return false;
    if (GOL.EXPERIENCE && GOL.EXPERIENCE.progression === 'all-open') return !!w.build;
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
    return GOL.worldEarned(n) || GOL.worldPriorKnown(n);
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
