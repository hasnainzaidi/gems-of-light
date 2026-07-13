// Al-Falaq read-along prototype — Abdul Basit Murattal only.
//
// These word boundaries were hand-aligned against the exact local EveryAyah
// Abdul_Basit_Murattal_192kbps files.  They are deliberately reciter-specific:
// another performance (including Abdul Basit's Mujawwad recording) will drift.
// `from` / `to` are seconds on the verse <audio> element's currentTime clock.
(function () {
  const GOL = window.GOL;

  GOL.WORD_FOLLOW = GOL.WORD_FOLLOW || {};
  GOL.WORD_FOLLOW.basit = GOL.WORD_FOLLOW.basit || {};
  GOL.WORD_FOLLOW.basit[113] = {
    provenance: 'hand-aligned: EveryAyah Abdul_Basit_Murattal_192kbps',
    audioDurations: [4.2057, 3.7094, 5.2506, 6.1649, 5.1461],
    verses: {
      1: [
        { text: 'قُلْ', from: 0.85, to: 1.18 },
        { text: 'أَعُوذُ', from: 1.18, to: 2.10 },
        { text: 'بِرَبِّ', from: 2.10, to: 3.08 },
        { text: 'ٱلْفَلَقِ', from: 3.08, to: 3.76 }
      ],
      2: [
        { text: 'مِن', from: 0.40, to: 1.42 },
        { text: 'شَرِّ', from: 1.42, to: 2.08 },
        { text: 'مَا', from: 2.08, to: 2.55 },
        { text: 'خَلَقَ', from: 2.55, to: 3.28 }
      ],
      3: [
        { text: 'وَمِن', from: 0.55, to: 1.62 },
        { text: 'شَرِّ', from: 1.62, to: 2.42 },
        { text: 'غَاسِقٍ', from: 2.42, to: 3.42 },
        { text: 'إِذَا', from: 3.42, to: 4.27 },
        { text: 'وَقَبَ', from: 4.27, to: 4.92 }
      ],
      4: [
        { text: 'وَمِن', from: 0.50, to: 1.62 },
        { text: 'شَرِّ', from: 1.62, to: 2.45 },
        { text: 'ٱلنَّفَّـٰثَـٰتِ', from: 2.45, to: 4.27 },
        { text: 'فِى', from: 4.27, to: 4.72 },
        { text: 'ٱلْعُقَدِ', from: 4.72, to: 5.74 }
      ],
      5: [
        { text: 'وَمِن', from: 0.45, to: 1.62 },
        { text: 'شَرِّ', from: 1.62, to: 2.13 },
        { text: 'حَاسِدٍ', from: 2.13, to: 3.08 },
        { text: 'إِذَا', from: 3.08, to: 3.76 },
        { text: 'حَسَدَ', from: 3.76, to: 4.72 }
      ]
    }
  };

  // The game's legacy local files are the EveryAyah Alafasy_128kbps set.
  // These boundaries were independently aligned to those exact recordings;
  // they are not scaled copies of Abdul Basit's performance.
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
