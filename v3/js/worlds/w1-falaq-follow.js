// Al-Falaq (113) read-along — the one HAND-ALIGNED table in the game.
//
// Every other surah's timings are machine-estimated (follow-estimated.js);
// these word boundaries were aligned by ear against the exact local EveryAyah
// Alafasy_128kbps files. They are deliberately reciter-specific: another
// performance will drift, so a new voice needs its own pass (or falls back to
// proportional scaling in adventure.js).
// `from` / `to` are seconds on the verse <audio> element's currentTime clock.
//
// A hand-aligned Abdul Basit table lived here until 2026-08-15, when Basit was
// removed from the game; it stays recoverable in git history.
(function () {
  const GOL = window.GOL;

  GOL.WORD_FOLLOW = GOL.WORD_FOLLOW || {};
  GOL.WORD_FOLLOW.alafasy = GOL.WORD_FOLLOW.alafasy || {};
  GOL.WORD_FOLLOW.alafasy[113] = {
    provenance: 'hand-aligned: EveryAyah Alafasy_128kbps',
    audioDurations: [3.4743, 3.6310, 5.0416, 6.0081, 5.6686],
    verses: {
      1: [
        { text: 'قُلْ', from: 0.00, to: 0.36 },
        { text: 'أَعُوذُ', from: 0.36, to: 1.28 },
        { text: 'بِرَبِّ', from: 1.28, to: 2.32 },
        { text: 'ٱلْفَلَقِ', from: 2.32, to: 3.22 }
      ],
      2: [
        { text: 'مِن', from: 0.00, to: 0.45 },
        { text: 'شَرِّ', from: 0.45, to: 1.82 },
        { text: 'مَا', from: 1.82, to: 2.48 },
        { text: 'خَلَقَ', from: 2.48, to: 3.16 }
      ],
      3: [
        { text: 'وَمِن', from: 0.00, to: 0.45 },
        { text: 'شَرِّ', from: 0.45, to: 1.55 },
        { text: 'غَاسِقٍ', from: 1.55, to: 2.84 },
        { text: 'إِذَا', from: 2.84, to: 3.48 },
        { text: 'وَقَبَ', from: 3.48, to: 4.56 }
      ],
      4: [
        { text: 'وَمِن', from: 0.00, to: 0.45 },
        { text: 'شَرِّ', from: 0.45, to: 1.55 },
        { text: 'ٱلنَّفَّـٰثَـٰتِ', from: 1.55, to: 4.18 },
        { text: 'فِى', from: 4.18, to: 4.48 },
        { text: 'ٱلْعُقَدِ', from: 4.48, to: 5.54 }
      ],
      5: [
        { text: 'وَمِن', from: 0.00, to: 0.45 },
        { text: 'شَرِّ', from: 0.45, to: 1.45 },
        { text: 'حَاسِدٍ', from: 1.45, to: 2.72 },
        { text: 'إِذَا', from: 2.72, to: 3.38 },
        { text: 'حَسَدَ', from: 3.38, to: 4.48 }
      ]
    }
  };
})();
