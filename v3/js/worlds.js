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
  // retuned by editing this line alone; files and saves never move
  // (WORLDS-PLAN §1: roughly the traditional bottom-up path, warnings late).
  GOL.WORLD_ORDER = ['falaq', 'nas', 'ikhlas', 'kawthar', 'asr', 'quraish',
    'fil', 'duha', 'adiyat', 'sharh', 'qadr', 'kafirun', 'takathur',
    'humazah', 'masad', 'lail'];

  // registered worlds in journey order; a key missing from the list keeps
  // its file order at the end (so nothing ever vanishes from the journey)
  GOL.orderedWorlds = function () {
    const pos = (w) => {
      const i = GOL.WORLD_ORDER.indexOf(w.key);
      return i < 0 ? GOL.WORLD_ORDER.length + w.n : i;
    };
    return GOL.WORLDS3.filter(Boolean).sort((a, b) => pos(a) - pos(b));
  };

  // a world is open when it's first in the journey, already earned (a Grand
  // Gem never re-locks, even if a new world is later planted before it), or
  // the nearest PLAYABLE world before it in the journey gave its Grand Gem
  // (still-growing buds don't gate the road)
  GOL.worldOpen = function (n) {
    const w = GOL.WORLDS3[n - 1];
    if (!w) return false;
    if (GOL.DEBUG) return true; // the lab: every grown world is playable
    if (GOL.worldDone(n)) return true;
    const seq = GOL.orderedWorlds();
    const i = seq.findIndex((x) => x.n === n);
    for (let j = i - 1; j >= 0; j--) {
      if (seq[j].build) return !!(GOL.store.data.grand && GOL.store.data.grand[seq[j].surahId]);
    }
    return true; // nothing playable stands before it
  };
  GOL.worldDone = function (n) {
    const w = GOL.WORLDS3[n - 1];
    return !!(w && GOL.store.data.grand && GOL.store.data.grand[w.surahId]);
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
