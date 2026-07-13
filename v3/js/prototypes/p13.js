// Long-surah lab · P13 — Four Lanterns
//
// Keep Al-Lail's full 21-gem climb and earned summit campfire, then ask only
// for the four stanza-opening ayat at the shrine. The four shuffled gems test
// whether a young child can hold the surah's large-scale sequence without
// turning the final ceremony into another 21-step task.
(function () {
  const GOL = window.GOL;
  const lail = GOL.WORLDS3[6];

  if (!lail || typeof lail.build !== 'function') {
    throw new Error('p13 requires World Seven (Al-Lail) to be registered first');
  }

  GOL.PROTOTYPES[13] = Object.assign({}, lail, {
    id: 113,
    key: 'four-lanterns',
    name: 'four lanterns',
    longMode: 'constellations',
    labSaveKey: 'lail-p13',
    stanzas: [4, 7, 5, 5],
    build: lail.build
  });
})();
