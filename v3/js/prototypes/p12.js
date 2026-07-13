// Long-surah lab · P12 — Linked Stars
//
// Keep Al-Lail's proven climb and its four thematic movements, but overlap
// each new shrine stanza with the final ayah of the stanza before it. The
// repeated edge makes the three transitions part of recall instead of leaving
// them hidden behind the stanza-change ceremony.
(function () {
  const GOL = window.GOL;
  const lail = GOL.WORLDS3[6];

  if (!lail || typeof lail.build !== 'function') return;

  GOL.PROTOTYPES[12] = Object.assign({}, lail, {
    id: 112,
    key: 'linked-stars',
    name: 'linked stars',
    longMode: 'bridges',
    labSaveKey: 'lail-p12',
    stanzas: [4, 7, 5, 5],
    build: lail.build
  });
})();
