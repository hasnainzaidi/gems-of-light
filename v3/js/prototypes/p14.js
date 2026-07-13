// Long-surah lab · P14 — Four Night Camps
//
// Keep Al-Lail's proven mountain and place a small recall shrine at each of
// its three intermediate rest ledges. The shared `night-camps` flow treats
// each completed camp as a resumable checkpoint before the climb continues.
(function () {
  const GOL = window.GOL;
  const lail = GOL.WORLDS3[6];

  if (!lail || typeof lail.build !== 'function') {
    throw new Error('p14 requires World Seven (Al-Lail) to be registered first');
  }

  GOL.PROTOTYPES[14] = Object.assign({}, lail, {
    id: 114,
    key: 'night-camps',
    name: 'four night camps',
    longMode: 'night-camps',
    labSaveKey: 'lail-p14',
    stanzas: [4, 7, 5, 5],
    campShrines: [
      { afterAyah: 4, x: 32, row: 54, approach: 'left' },
      { afterAyah: 11, x: 36, row: 35 },
      { afterAyah: 16, x: 34, row: 17 }
    ],
    // There is no fourth intermediate marker: `night-camps` handles the
    // fourth shrine at the summit as the final boundary-linked range 16–21.
    build: lail.build
  });
})();
