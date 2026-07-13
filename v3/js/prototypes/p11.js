// Long-surah Prototype 11 — The Whole Night (control)
//
// Keep Al-Lail's existing 21-gem ascent intact and use the production stanza
// shrine. This is the control for experiments that change the adventure or
// recall structure: one continuous mountain, one summit campfire, then four
// compact shrine movements.
(function () {
  const GOL = window.GOL;
  const lail = GOL.WORLDS3[6];

  if (!lail || typeof lail.build !== 'function') {
    throw new Error('p11 requires World Seven (Al-Lail) to be registered first');
  }

  GOL.PROTOTYPES[11] = Object.assign({}, lail, {
    id: 111,
    key: 'whole-night',
    name: 'the whole night',
    longMode: 'stanzas',
    labSaveKey: 'lail-p11',
    stanzas: [4, 7, 5, 5],
    build: lail.build
  });
})();
