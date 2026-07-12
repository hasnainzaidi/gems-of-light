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

  // a world is open when it's first, or the one before it gave its Grand Gem
  GOL.worldOpen = function (n) {
    if (n <= 1) return true;
    const prev = GOL.WORLDS3[n - 2];
    return !!(prev && GOL.store.data.grand && GOL.store.data.grand[prev.surahId]);
  };
  GOL.worldDone = function (n) {
    const w = GOL.WORLDS3[n - 1];
    return !!(w && GOL.store.data.grand && GOL.store.data.grand[w.surahId]);
  };
  // the world a fresh "tap anywhere" should enter: the furthest open one
  // that actually has a recipe
  GOL.currentWorld = function () {
    let best = 1;
    GOL.WORLDS3.forEach((w) => {
      if (w && w.build && GOL.worldOpen(w.n)) best = w.n;
    });
    return best;
  };

  // the journey so far (full recipes land in worlds/wN-<key>.js)
  GOL.registerWorld(1, { surahId: 113, key: 'falaq', name: 'the daybreak' });
  GOL.registerWorld(2, { surahId: 114, key: 'nas', name: 'the village' });
  GOL.registerWorld(3, { surahId: 100, key: 'adiyat', name: 'the chargers' });
})();
