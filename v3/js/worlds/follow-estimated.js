// Gems of Light v3 — follow-estimated.js  (AUTO-GENERATED, do not hand-edit)
//
// Read-along word timings for every surah EXCEPT Al-Falaq (113), whose
// table is hand-aligned in w1-falaq-follow.js. These are ESTIMATES: each
// ayah's true mp3 duration (measured locally) is split across its words by a
// recitation-length heuristic (letters + madd/shadda/dagger-alef elongation),
// with the last word held to the audio's end and a ~12% trailing tail excluded
// from the spoken span. On Al-Falaq this lands within ~0.27s of the hand-aligned
// handoffs — good enough for the gentle highlight, NOT frame-accurate. Refine a
// surah by ear (tap-align) and it graduates to its own hand-aligned table.
//
// Regenerate: scratchpad/build.py  (tunables TRAIL/LEAD in gen_follow.py)
// Alafasy is the only shipped reciter (2026-08-15) — the parallel Abdul Basit
// tables were pruned by hand here, so a regeneration must emit alafasy only.
(function () {
  const GOL = window.GOL;
  GOL.WORD_FOLLOW = GOL.WORD_FOLLOW || {};
  GOL.WORD_FOLLOW.alafasy = GOL.WORD_FOLLOW.alafasy || {};

  // nas (surah 114)
  GOL.WORD_FOLLOW.alafasy[114] = {
    provenance: "ESTIMATED (mora-weighted, unvalidated) from local alafasy mp3 durations; refine by ear",
    audioDurations: [6.1388, 5.3029, 5.3812, 8.0196, 7.9412, 8.2808],
    verses: {
      1: [
        { text: "قُلْ", from: 0.00, to: 0.64 },
        { text: "أَعُوذُ", from: 0.64, to: 2.12 },
        { text: "بِرَبِّ", from: 2.12, to: 3.34 },
        { text: "ٱلنَّاسِ", from: 3.34, to: 6.14 }
      ],
      2: [
        { text: "مَلِكِ", from: 0.00, to: 1.49 },
        { text: "ٱلنَّاسِ", from: 1.49, to: 5.30 }
      ],
      3: [
        { text: "إِلَـٰهِ", from: 0.00, to: 2.12 },
        { text: "ٱلنَّاسِ", from: 2.12, to: 5.38 }
      ],
      4: [
        { text: "مِن", from: 0.00, to: 0.67 },
        { text: "شَرِّ", from: 0.67, to: 1.61 },
        { text: "ٱلْوَسْوَاسِ", from: 1.61, to: 4.57 },
        { text: "ٱلْخَنَّاسِ", from: 4.57, to: 8.02 }
      ],
      5: [
        { text: "ٱلَّذِى", from: 0.00, to: 1.46 },
        { text: "يُوَسْوِسُ", from: 1.46, to: 3.30 },
        { text: "فِى", from: 3.30, to: 4.01 },
        { text: "صُدُورِ", from: 4.01, to: 5.25 },
        { text: "ٱلنَّاسِ", from: 5.25, to: 7.94 }
      ],
      6: [
        { text: "مِنَ", from: 0.00, to: 0.92 },
        { text: "ٱلْجِنَّةِ", from: 0.92, to: 3.60 },
        { text: "وَٱلنَّاسِ", from: 3.60, to: 8.28 }
      ]
    }
  };
  // adiyat (surah 100)
  GOL.WORD_FOLLOW.alafasy[100] = {
    provenance: "ESTIMATED (mora-weighted, unvalidated) from local alafasy mp3 durations; refine by ear",
    audioDurations: [3.3176, 3.2914, 3.1086, 3.1086, 3.3437, 7.7061, 6.7918, 7.1314, 7.1314, 4.911, 10.5796],
    verses: {
      1: [
        { text: "وَٱلْعَـٰدِيَـٰتِ", from: 0.00, to: 2.09 },
        { text: "ضَبْحًا", from: 2.09, to: 3.32 }
      ],
      2: [
        { text: "فَٱلْمُورِيَـٰتِ", from: 0.00, to: 2.01 },
        { text: "قَدْحًا", from: 2.01, to: 3.29 }
      ],
      3: [
        { text: "فَٱلْمُغِيرَٰتِ", from: 0.00, to: 1.81 },
        { text: "صُبْحًا", from: 1.81, to: 3.11 }
      ],
      4: [
        { text: "فَأَثَرْنَ", from: 0.00, to: 1.14 },
        { text: "بِهِۦ", from: 1.14, to: 1.60 },
        { text: "نَقْعًا", from: 1.60, to: 3.11 }
      ],
      5: [
        { text: "فَوَسَطْنَ", from: 0.00, to: 1.31 },
        { text: "بِهِۦ", from: 1.31, to: 1.77 },
        { text: "جَمْعًا", from: 1.77, to: 3.34 }
      ],
      6: [
        { text: "إِنَّ", from: 0.00, to: 0.87 },
        { text: "ٱلْإِنسَـٰنَ", from: 0.87, to: 3.42 },
        { text: "لِرَبِّهِۦ", from: 3.42, to: 4.91 },
        { text: "لَكَنُودٌ", from: 4.91, to: 7.71 }
      ],
      7: [
        { text: "وَإِنَّهُۥ", from: 0.00, to: 1.58 },
        { text: "عَلَىٰ", from: 1.58, to: 2.99 },
        { text: "ذَٰلِكَ", from: 2.99, to: 4.22 },
        { text: "لَشَهِيدٌ", from: 4.22, to: 6.79 }
      ],
      8: [
        { text: "وَإِنَّهُۥ", from: 0.00, to: 1.63 },
        { text: "لِحُبِّ", from: 1.63, to: 2.78 },
        { text: "ٱلْخَيْرِ", from: 2.78, to: 4.47 },
        { text: "لَشَدِيدٌ", from: 4.47, to: 7.13 }
      ],
      9: [
        { text: "أَفَلَا", from: 0.00, to: 1.01 },
        { text: "يَعْلَمُ", from: 1.01, to: 2.02 },
        { text: "إِذَا", from: 2.02, to: 2.81 },
        { text: "بُعْثِرَ", from: 2.81, to: 3.69 },
        { text: "مَا", from: 3.69, to: 4.26 },
        { text: "فِى", from: 4.26, to: 4.83 },
        { text: "ٱلْقُبُورِ", from: 4.83, to: 7.13 }
      ],
      10: [
        { text: "وَحُصِّلَ", from: 0.00, to: 1.30 },
        { text: "مَا", from: 1.30, to: 1.92 },
        { text: "فِى", from: 1.92, to: 2.54 },
        { text: "ٱلصُّدُورِ", from: 2.54, to: 4.91 }
      ],
      11: [
        { text: "إِنَّ", from: 0.00, to: 1.09 },
        { text: "رَبَّهُم", from: 1.09, to: 2.95 },
        { text: "بِهِمْ", from: 2.95, to: 4.11 },
        { text: "يَوْمَئِذٍ", from: 4.11, to: 6.67 },
        { text: "لَّخَبِيرٌۢ", from: 6.67, to: 10.58 }
      ]
    }
  };
  // qadr (surah 97)
  GOL.WORD_FOLLOW.alafasy[97] = {
    provenance: "ESTIMATED (mora-weighted, unvalidated) from local alafasy mp3 durations; refine by ear",
    audioDurations: [7.9935, 6.0343, 5.5641, 11.102, 5.2506],
    verses: {
      1: [
        { text: "إِنَّآ", from: 0.00, to: 1.47 },
        { text: "أَنزَلْنَـٰهُ", from: 1.47, to: 3.71 },
        { text: "فِى", from: 3.71, to: 4.42 },
        { text: "لَيْلَةِ", from: 4.42, to: 5.67 },
        { text: "ٱلْقَدْرِ", from: 5.67, to: 7.99 }
      ],
      2: [
        { text: "وَمَآ", from: 0.00, to: 1.14 },
        { text: "أَدْرَىٰكَ", from: 1.14, to: 2.63 },
        { text: "مَا", from: 2.63, to: 3.20 },
        { text: "لَيْلَةُ", from: 3.20, to: 4.21 },
        { text: "ٱلْقَدْرِ", from: 4.21, to: 6.03 }
      ],
      3: [
        { text: "لَيْلَةُ", from: 0.00, to: 0.99 },
        { text: "ٱلْقَدْرِ", from: 0.99, to: 2.06 },
        { text: "خَيْرٌ", from: 2.06, to: 2.92 },
        { text: "مِّنْ", from: 2.92, to: 3.52 },
        { text: "أَلْفِ", from: 3.52, to: 4.17 },
        { text: "شَهْرٍ", from: 4.17, to: 5.56 }
      ],
      4: [
        { text: "تَنَزَّلُ", from: 0.00, to: 0.99 },
        { text: "ٱلْمَلَـٰٓئِكَةُ", from: 0.99, to: 3.39 },
        { text: "وَٱلرُّوحُ", from: 3.39, to: 5.04 },
        { text: "فِيهَا", from: 5.04, to: 6.11 },
        { text: "بِإِذْنِ", from: 6.11, to: 6.93 },
        { text: "رَبِّهِم", from: 6.93, to: 7.92 },
        { text: "مِّن", from: 7.92, to: 8.49 },
        { text: "كُلِّ", from: 8.49, to: 9.07 },
        { text: "أَمْرٍ", from: 9.07, to: 11.10 }
      ],
      5: [
        { text: "سَلَـٰمٌ", from: 0.00, to: 1.13 },
        { text: "هِىَ", from: 1.13, to: 1.66 },
        { text: "حَتَّىٰ", from: 1.66, to: 2.80 },
        { text: "مَطْلَعِ", from: 2.80, to: 3.61 },
        { text: "ٱلْفَجْرِ", from: 3.61, to: 5.25 }
      ]
    }
  };
  // kawthar (surah 108)
  GOL.WORD_FOLLOW.alafasy[108] = {
    provenance: "ESTIMATED (mora-weighted, unvalidated) from local alafasy mp3 durations; refine by ear",
    audioDurations: [6.7396, 3.5788, 5.2767],
    verses: {
      1: [
        { text: "إِنَّآ", from: 0.00, to: 1.54 },
        { text: "أَعْطَيْنَـٰكَ", from: 1.54, to: 4.05 },
        { text: "ٱلْكَوْثَرَ", from: 4.05, to: 6.74 }
      ],
      2: [
        { text: "فَصَلِّ", from: 0.00, to: 0.84 },
        { text: "لِرَبِّكَ", from: 0.84, to: 1.91 },
        { text: "وَٱنْحَرْ", from: 1.91, to: 3.58 }
      ],
      3: [
        { text: "إِنَّ", from: 0.00, to: 0.76 },
        { text: "شَانِئَكَ", from: 0.76, to: 2.29 },
        { text: "هُوَ", from: 2.29, to: 3.00 },
        { text: "ٱلْأَبْتَرُ", from: 3.00, to: 5.28 }
      ]
    }
  };
  // duha (surah 93)
  GOL.WORD_FOLLOW.alafasy[93] = {
    provenance: "ESTIMATED (mora-weighted, unvalidated) from local alafasy mp3 durations; refine by ear",
    audioDurations: [1.8808, 3.0563, 4.4408, 5.1984, 5.0416, 5.2506, 7.1314, 6.1388, 4.9371, 6.2694, 5.9037],
    verses: {
      1: [
        { text: "وَٱلضُّحَىٰ", from: 0.00, to: 1.88 }
      ],
      2: [
        { text: "وَٱلَّيْلِ", from: 0.00, to: 1.22 },
        { text: "إِذَا", from: 1.22, to: 1.85 },
        { text: "سَجَىٰ", from: 1.85, to: 3.06 }
      ],
      3: [
        { text: "مَا", from: 0.00, to: 0.49 },
        { text: "وَدَّعَكَ", from: 0.49, to: 1.50 },
        { text: "رَبُّكَ", from: 1.50, to: 2.22 },
        { text: "وَمَا", from: 2.22, to: 3.01 },
        { text: "قَلَىٰ", from: 3.01, to: 4.44 }
      ],
      4: [
        { text: "وَلَلْـَٔاخِرَةُ", from: 0.00, to: 1.59 },
        { text: "خَيْرٌ", from: 1.59, to: 2.29 },
        { text: "لَّكَ", from: 2.29, to: 2.77 },
        { text: "مِنَ", from: 2.77, to: 3.12 },
        { text: "ٱلْأُولَىٰ", from: 3.12, to: 5.20 }
      ],
      5: [
        { text: "وَلَسَوْفَ", from: 0.00, to: 1.08 },
        { text: "يُعْطِيكَ", from: 1.08, to: 2.16 },
        { text: "رَبُّكَ", from: 2.16, to: 2.82 },
        { text: "فَتَرْضَىٰٓ", from: 2.82, to: 5.04 }
      ],
      6: [
        { text: "أَلَمْ", from: 0.00, to: 0.61 },
        { text: "يَجِدْكَ", from: 0.61, to: 1.54 },
        { text: "يَتِيمًا", from: 1.54, to: 3.00 },
        { text: "فَـَٔاوَىٰ", from: 3.00, to: 5.25 }
      ],
      7: [
        { text: "وَوَجَدَكَ", from: 0.00, to: 2.01 },
        { text: "ضَآلًّا", from: 2.01, to: 4.40 },
        { text: "فَهَدَىٰ", from: 4.40, to: 7.13 }
      ],
      8: [
        { text: "وَوَجَدَكَ", from: 0.00, to: 1.63 },
        { text: "عَآئِلًا", from: 1.63, to: 3.62 },
        { text: "فَأَغْنَىٰ", from: 3.62, to: 6.14 }
      ],
      9: [
        { text: "فَأَمَّا", from: 0.00, to: 1.16 },
        { text: "ٱلْيَتِيمَ", from: 1.16, to: 2.71 },
        { text: "فَلَا", from: 2.71, to: 3.48 },
        { text: "تَقْهَرْ", from: 3.48, to: 4.94 }
      ],
      10: [
        { text: "وَأَمَّا", from: 0.00, to: 1.50 },
        { text: "ٱلسَّآئِلَ", from: 1.50, to: 3.61 },
        { text: "فَلَا", from: 3.61, to: 4.51 },
        { text: "تَنْهَرْ", from: 4.51, to: 6.27 }
      ],
      11: [
        { text: "وَأَمَّا", from: 0.00, to: 1.59 },
        { text: "بِنِعْمَةِ", from: 1.59, to: 2.92 },
        { text: "رَبِّكَ", from: 2.92, to: 3.92 },
        { text: "فَحَدِّثْ", from: 3.92, to: 5.90 }
      ]
    }
  };
  // lail (surah 92)
  GOL.WORD_FOLLOW.alafasy[92] = {
    provenance: "ESTIMATED (mora-weighted, unvalidated) from local alafasy mp3 durations; refine by ear",
    audioDurations: [3.3437, 4.4408, 5.0416, 4.3102, 4.8065, 2.978, 3.8139, 4.9894, 2.8996, 3.631, 7.0008, 3.8139, 5.7208, 5.7992, 5.6163, 4.0751, 4.6498, 4.9633, 7.9151, 6.4522, 4.0751],
    verses: {
      1: [
        { text: "وَٱلَّيْلِ", from: 0.00, to: 1.21 },
        { text: "إِذَا", from: 1.21, to: 1.83 },
        { text: "يَغْشَىٰ", from: 1.83, to: 3.34 }
      ],
      2: [
        { text: "وَٱلنَّهَارِ", from: 0.00, to: 1.83 },
        { text: "إِذَا", from: 1.83, to: 2.56 },
        { text: "تَجَلَّىٰ", from: 2.56, to: 4.44 }
      ],
      3: [
        { text: "وَمَا", from: 0.00, to: 0.75 },
        { text: "خَلَقَ", from: 0.75, to: 1.28 },
        { text: "ٱلذَّكَرَ", from: 1.28, to: 2.32 },
        { text: "وَٱلْأُنثَىٰٓ", from: 2.32, to: 5.04 }
      ],
      4: [
        { text: "إِنَّ", from: 0.00, to: 0.71 },
        { text: "سَعْيَكُمْ", from: 0.71, to: 2.12 },
        { text: "لَشَتَّىٰ", from: 2.12, to: 4.31 }
      ],
      5: [
        { text: "فَأَمَّا", from: 0.00, to: 1.07 },
        { text: "مَنْ", from: 1.07, to: 1.46 },
        { text: "أَعْطَىٰ", from: 1.46, to: 2.61 },
        { text: "وَٱتَّقَىٰ", from: 2.61, to: 4.81 }
      ],
      6: [
        { text: "وَصَدَّقَ", from: 0.00, to: 1.00 },
        { text: "بِٱلْحُسْنَىٰ", from: 1.00, to: 2.98 }
      ],
      7: [
        { text: "فَسَنُيَسِّرُهُۥ", from: 0.00, to: 1.68 },
        { text: "لِلْيُسْرَىٰ", from: 1.68, to: 3.81 }
      ],
      8: [
        { text: "وَأَمَّا", from: 0.00, to: 1.29 },
        { text: "مَنۢ", from: 1.29, to: 1.72 },
        { text: "بَخِلَ", from: 1.72, to: 2.37 },
        { text: "وَٱسْتَغْنَىٰ", from: 2.37, to: 4.99 }
      ],
      9: [
        { text: "وَكَذَّبَ", from: 0.00, to: 0.97 },
        { text: "بِٱلْحُسْنَىٰ", from: 0.97, to: 2.90 }
      ],
      10: [
        { text: "فَسَنُيَسِّرُهُۥ", from: 0.00, to: 1.66 },
        { text: "لِلْعُسْرَىٰ", from: 1.66, to: 3.63 }
      ],
      11: [
        { text: "وَمَا", from: 0.00, to: 0.80 },
        { text: "يُغْنِى", from: 0.80, to: 1.80 },
        { text: "عَنْهُ", from: 1.80, to: 2.37 },
        { text: "مَالُهُۥٓ", from: 2.37, to: 3.73 },
        { text: "إِذَا", from: 3.73, to: 4.42 },
        { text: "تَرَدَّىٰٓ", from: 4.42, to: 7.00 }
      ],
      12: [
        { text: "إِنَّ", from: 0.00, to: 0.59 },
        { text: "عَلَيْنَا", from: 0.59, to: 1.91 },
        { text: "لَلْهُدَىٰ", from: 1.91, to: 3.81 }
      ],
      13: [
        { text: "وَإِنَّ", from: 0.00, to: 0.87 },
        { text: "لَنَا", from: 0.87, to: 1.57 },
        { text: "لَلْـَٔاخِرَةَ", from: 1.57, to: 3.07 },
        { text: "وَٱلْأُولَىٰ", from: 3.07, to: 5.72 }
      ],
      14: [
        { text: "فَأَنذَرْتُكُمْ", from: 0.00, to: 2.02 },
        { text: "نَارًا", from: 2.02, to: 3.44 },
        { text: "تَلَظَّىٰ", from: 3.44, to: 5.80 }
      ],
      15: [
        { text: "لَا", from: 0.00, to: 0.54 },
        { text: "يَصْلَىٰهَآ", from: 0.54, to: 2.64 },
        { text: "إِلَّا", from: 2.64, to: 3.56 },
        { text: "ٱلْأَشْقَى", from: 3.56, to: 5.62 }
      ],
      16: [
        { text: "ٱلَّذِى", from: 0.00, to: 1.08 },
        { text: "كَذَّبَ", from: 1.08, to: 1.83 },
        { text: "وَتَوَلَّىٰ", from: 1.83, to: 4.08 }
      ],
      17: [
        { text: "وَسَيُجَنَّبُهَا", from: 0.00, to: 2.52 },
        { text: "ٱلْأَتْقَى", from: 2.52, to: 4.65 }
      ],
      18: [
        { text: "ٱلَّذِى", from: 0.00, to: 1.01 },
        { text: "يُؤْتِى", from: 1.01, to: 1.98 },
        { text: "مَالَهُۥ", from: 1.98, to: 2.84 },
        { text: "يَتَزَكَّىٰ", from: 2.84, to: 4.96 }
      ],
      19: [
        { text: "وَمَا", from: 0.00, to: 1.04 },
        { text: "لِأَحَدٍ", from: 1.04, to: 2.13 },
        { text: "عِندَهُۥ", from: 2.13, to: 3.12 },
        { text: "مِن", from: 3.12, to: 3.62 },
        { text: "نِّعْمَةٍ", from: 3.62, to: 4.91 },
        { text: "تُجْزَىٰٓ", from: 4.91, to: 7.92 }
      ],
      20: [
        { text: "إِلَّا", from: 0.00, to: 0.92 },
        { text: "ٱبْتِغَآءَ", from: 0.92, to: 2.50 },
        { text: "وَجْهِ", from: 2.50, to: 3.26 },
        { text: "رَبِّهِ", from: 3.26, to: 4.05 },
        { text: "ٱلْأَعْلَىٰ", from: 4.05, to: 6.45 }
      ],
      21: [
        { text: "وَلَسَوْفَ", from: 0.00, to: 1.76 },
        { text: "يَرْضَىٰ", from: 1.76, to: 4.08 }
      ]
    }
  };
  // fatiha (surah 1)
  GOL.WORD_FOLLOW.alafasy[1] = {
    provenance: "ESTIMATED (mora-weighted, unvalidated) from local alafasy mp3 durations; refine by ear",
    audioDurations: [6.1127, 5.6163, 4.6498, 4.6759, 6.7396, 5.6163, 13.2702],
    verses: {
      1: [
        { text: "بِسْمِ", from: 0.00, to: 0.67 },
        { text: "ٱللَّهِ", from: 0.67, to: 1.73 },
        { text: "ٱلرَّحْمَـٰنِ", from: 1.73, to: 3.73 },
        { text: "ٱلرَّحِيمِ", from: 3.73, to: 6.11 }
      ],
      2: [
        { text: "ٱلْحَمْدُ", from: 0.00, to: 1.15 },
        { text: "لِلَّهِ", from: 1.15, to: 2.03 },
        { text: "رَبِّ", from: 2.03, to: 2.68 },
        { text: "ٱلْعَـٰلَمِينَ", from: 2.68, to: 5.62 }
      ],
      3: [
        { text: "ٱلرَّحْمَـٰنِ", from: 0.00, to: 2.25 },
        { text: "ٱلرَّحِيمِ", from: 2.25, to: 4.65 }
      ],
      4: [
        { text: "مَـٰلِكِ", from: 0.00, to: 1.35 },
        { text: "يَوْمِ", from: 1.35, to: 2.45 },
        { text: "ٱلدِّينِ", from: 2.45, to: 4.68 }
      ],
      5: [
        { text: "إِيَّاكَ", from: 0.00, to: 1.47 },
        { text: "نَعْبُدُ", from: 1.47, to: 2.45 },
        { text: "وَإِيَّاكَ", from: 2.45, to: 4.31 },
        { text: "نَسْتَعِينُ", from: 4.31, to: 6.74 }
      ],
      6: [
        { text: "ٱهْدِنَا", from: 0.00, to: 1.31 },
        { text: "ٱلصِّرَٰطَ", from: 1.31, to: 2.94 },
        { text: "ٱلْمُسْتَقِيمَ", from: 2.94, to: 5.62 }
      ],
      7: [
        { text: "صِرَٰطَ", from: 0.00, to: 0.93 },
        { text: "ٱلَّذِينَ", from: 0.93, to: 2.34 },
        { text: "أَنْعَمْتَ", from: 2.34, to: 3.44 },
        { text: "عَلَيْهِمْ", from: 3.44, to: 4.67 },
        { text: "غَيْرِ", from: 4.67, to: 5.46 },
        { text: "ٱلْمَغْضُوبِ", from: 5.46, to: 7.14 },
        { text: "عَلَيْهِمْ", from: 7.14, to: 8.37 },
        { text: "وَلَا", from: 8.37, to: 9.30 },
        { text: "ٱلضَّآلِّينَ", from: 9.30, to: 13.27 }
      ]
    }
  };
  // ikhlas (surah 112)
  GOL.WORD_FOLLOW.alafasy[112] = {
    provenance: "ESTIMATED (mora-weighted, unvalidated) from local alafasy mp3 durations; refine by ear",
    audioDurations: [3.0041, 2.56, 3.0041, 4.8849],
    verses: {
      1: [
        { text: "قُلْ", from: 0.00, to: 0.41 },
        { text: "هُوَ", from: 0.41, to: 0.95 },
        { text: "ٱللَّهُ", from: 0.95, to: 1.94 },
        { text: "أَحَدٌ", from: 1.94, to: 3.00 }
      ],
      2: [
        { text: "ٱللَّهُ", from: 0.00, to: 1.02 },
        { text: "ٱلصَّمَدُ", from: 1.02, to: 2.56 }
      ],
      3: [
        { text: "لَمْ", from: 0.00, to: 0.37 },
        { text: "يَلِدْ", from: 0.37, to: 1.03 },
        { text: "وَلَمْ", from: 1.03, to: 1.69 },
        { text: "يُولَدْ", from: 1.69, to: 3.00 }
      ],
      4: [
        { text: "وَلَمْ", from: 0.00, to: 0.81 },
        { text: "يَكُن", from: 0.81, to: 1.63 },
        { text: "لَّهُۥ", from: 1.63, to: 2.26 },
        { text: "كُفُوًا", from: 2.26, to: 3.53 },
        { text: "أَحَدٌۢ", from: 3.53, to: 4.88 }
      ]
    }
  };
  // nasr (surah 110)
  GOL.WORD_FOLLOW.alafasy[110] = {
    provenance: "ESTIMATED (mora-weighted, unvalidated) from local alafasy mp3 durations; refine by ear",
    audioDurations: [6.9486, 8.2024, 10.0833],
    verses: {
      1: [
        { text: "إِذَا", from: 0.00, to: 0.91 },
        { text: "جَآءَ", from: 0.91, to: 2.46 },
        { text: "نَصْرُ", from: 2.46, to: 3.22 },
        { text: "ٱللَّهِ", from: 3.22, to: 4.44 },
        { text: "وَٱلْفَتْحُ", from: 4.44, to: 6.95 }
      ],
      2: [
        { text: "وَرَأَيْتَ", from: 0.00, to: 1.15 },
        { text: "ٱلنَّاسَ", from: 1.15, to: 2.33 },
        { text: "يَدْخُلُونَ", from: 2.33, to: 3.66 },
        { text: "فِى", from: 3.66, to: 4.15 },
        { text: "دِينِ", from: 4.15, to: 4.81 },
        { text: "ٱللَّهِ", from: 4.81, to: 5.70 },
        { text: "أَفْوَاجًا", from: 5.70, to: 8.20 }
      ],
      3: [
        { text: "فَسَبِّحْ", from: 0.00, to: 1.14 },
        { text: "بِحَمْدِ", from: 1.14, to: 2.10 },
        { text: "رَبِّكَ", from: 2.10, to: 3.01 },
        { text: "وَٱسْتَغْفِرْهُ", from: 3.01, to: 5.06 },
        { text: "ۚ", from: 5.06, to: 5.20 },
        { text: "إِنَّهُۥ", from: 5.20, to: 6.11 },
        { text: "كَانَ", from: 6.11, to: 6.97 },
        { text: "تَوَّابًۢا", from: 6.97, to: 10.08 }
      ]
    }
  };
  // masad (surah 111)
  GOL.WORD_FOLLOW.alafasy[111] = {
    provenance: "ESTIMATED (mora-weighted, unvalidated) from local alafasy mp3 durations; refine by ear",
    audioDurations: [7.4188, 7.1837, 5.1984, 5.6163, 6.4784],
    verses: {
      1: [
        { text: "تَبَّتْ", from: 0.00, to: 1.22 },
        { text: "يَدَآ", from: 1.22, to: 2.88 },
        { text: "أَبِى", from: 2.88, to: 4.03 },
        { text: "لَهَبٍ", from: 4.03, to: 5.12 },
        { text: "وَتَبَّ", from: 5.12, to: 7.42 }
      ],
      2: [
        { text: "مَآ", from: 0.00, to: 0.94 },
        { text: "أَغْنَىٰ", from: 0.94, to: 2.46 },
        { text: "عَنْهُ", from: 2.46, to: 3.24 },
        { text: "مَالُهُۥ", from: 3.24, to: 4.44 },
        { text: "وَمَا", from: 4.44, to: 5.54 },
        { text: "كَسَبَ", from: 5.54, to: 7.18 }
      ],
      3: [
        { text: "سَيَصْلَىٰ", from: 0.00, to: 1.69 },
        { text: "نَارًا", from: 1.69, to: 2.97 },
        { text: "ذَاتَ", from: 2.97, to: 3.80 },
        { text: "لَهَبٍ", from: 3.80, to: 5.20 }
      ],
      4: [
        { text: "وَٱمْرَأَتُهُۥ", from: 0.00, to: 1.98 },
        { text: "حَمَّالَةَ", from: 1.98, to: 3.64 },
        { text: "ٱلْحَطَبِ", from: 3.64, to: 5.62 }
      ],
      5: [
        { text: "فِى", from: 0.00, to: 0.77 },
        { text: "جِيدِهَا", from: 0.77, to: 2.61 },
        { text: "حَبْلٌ", from: 2.61, to: 3.62 },
        { text: "مِّن", from: 3.62, to: 4.45 },
        { text: "مَّسَدٍۭ", from: 4.45, to: 6.48 }
      ]
    }
  };
  // quraish (surah 106)
  GOL.WORD_FOLLOW.alafasy[106] = {
    provenance: "ESTIMATED (mora-weighted, unvalidated) from local alafasy mp3 durations; refine by ear",
    audioDurations: [4.6498, 8.8816, 5.982, 13.5837],
    verses: {
      1: [
        { text: "لِإِيلَـٰفِ", from: 0.00, to: 2.49 },
        { text: "قُرَيْشٍ", from: 2.49, to: 4.65 }
      ],
      2: [
        { text: "إِۦلَـٰفِهِمْ", from: 0.00, to: 2.04 },
        { text: "رِحْلَةَ", from: 2.04, to: 3.17 },
        { text: "ٱلشِّتَآءِ", from: 3.17, to: 5.55 },
        { text: "وَٱلصَّيْفِ", from: 5.55, to: 8.88 }
      ],
      3: [
        { text: "فَلْيَعْبُدُوا۟", from: 0.00, to: 2.15 },
        { text: "رَبَّ", from: 2.15, to: 2.76 },
        { text: "هَـٰذَا", from: 2.76, to: 4.04 },
        { text: "ٱلْبَيْتِ", from: 4.04, to: 5.98 }
      ],
      4: [
        { text: "ٱلَّذِىٓ", from: 0.00, to: 2.65 },
        { text: "أَطْعَمَهُم", from: 2.65, to: 4.65 },
        { text: "مِّن", from: 4.65, to: 5.59 },
        { text: "جُوعٍ", from: 5.59, to: 6.93 },
        { text: "وَءَامَنَهُم", from: 6.93, to: 9.68 },
        { text: "مِّنْ", from: 9.68, to: 10.61 },
        { text: "خَوْفٍۭ", from: 10.61, to: 13.58 }
      ]
    }
  };
  // fil (surah 105)
  GOL.WORD_FOLLOW.alafasy[105] = {
    provenance: "ESTIMATED (mora-weighted, unvalidated) from local alafasy mp3 durations; refine by ear",
    audioDurations: [7.9673, 6.2955, 6.9224, 9.3518, 9.0645],
    verses: {
      1: [
        { text: "أَلَمْ", from: 0.00, to: 0.75 },
        { text: "تَرَ", from: 0.75, to: 1.24 },
        { text: "كَيْفَ", from: 1.24, to: 2.14 },
        { text: "فَعَلَ", from: 2.14, to: 2.88 },
        { text: "رَبُّكَ", from: 2.88, to: 3.83 },
        { text: "بِأَصْحَـٰبِ", from: 3.83, to: 5.62 },
        { text: "ٱلْفِيلِ", from: 5.62, to: 7.97 }
      ],
      2: [
        { text: "أَلَمْ", from: 0.00, to: 0.76 },
        { text: "يَجْعَلْ", from: 0.76, to: 1.93 },
        { text: "كَيْدَهُمْ", from: 1.93, to: 3.35 },
        { text: "فِى", from: 3.35, to: 4.02 },
        { text: "تَضْلِيلٍ", from: 4.02, to: 6.30 }
      ],
      3: [
        { text: "وَأَرْسَلَ", from: 0.00, to: 1.42 },
        { text: "عَلَيْهِمْ", from: 1.42, to: 2.84 },
        { text: "طَيْرًا", from: 2.84, to: 4.26 },
        { text: "أَبَابِيلَ", from: 4.26, to: 6.92 }
      ],
      4: [
        { text: "تَرْمِيهِم", from: 0.00, to: 2.45 },
        { text: "بِحِجَارَةٍ", from: 2.45, to: 5.04 },
        { text: "مِّن", from: 5.04, to: 6.08 },
        { text: "سِجِّيلٍ", from: 6.08, to: 9.35 }
      ],
      5: [
        { text: "فَجَعَلَهُمْ", from: 0.00, to: 2.78 },
        { text: "كَعَصْفٍ", from: 2.78, to: 4.82 },
        { text: "مَّأْكُولٍۭ", from: 4.82, to: 9.06 }
      ]
    }
  };
  // humazah (surah 104)
  GOL.WORD_FOLLOW.alafasy[104] = {
    provenance: "ESTIMATED (mora-weighted, unvalidated) from local alafasy mp3 durations; refine by ear",
    audioDurations: [4.6237, 5.4073, 6.6873, 6.7657, 5.0416, 3.5265, 4.4669, 5.6947, 5.6947],
    verses: {
      1: [
        { text: "وَيْلٌ", from: 0.00, to: 1.00 },
        { text: "لِّكُلِّ", from: 1.00, to: 1.99 },
        { text: "هُمَزَةٍ", from: 1.99, to: 2.94 },
        { text: "لُّمَزَةٍ", from: 2.94, to: 4.62 }
      ],
      2: [
        { text: "ٱلَّذِى", from: 0.00, to: 1.26 },
        { text: "جَمَعَ", from: 1.26, to: 1.96 },
        { text: "مَالًا", from: 1.96, to: 3.27 },
        { text: "وَعَدَّدَهُۥ", from: 3.27, to: 5.41 }
      ],
      3: [
        { text: "يَحْسَبُ", from: 0.00, to: 1.39 },
        { text: "أَنَّ", from: 1.39, to: 2.23 },
        { text: "مَالَهُۥٓ", from: 2.23, to: 4.38 },
        { text: "أَخْلَدَهُۥ", from: 4.38, to: 6.69 }
      ],
      4: [
        { text: "كَلَّا", from: 0.00, to: 1.25 },
        { text: "ۖ", from: 1.25, to: 1.42 },
        { text: "لَيُنۢبَذَنَّ", from: 1.42, to: 3.52 },
        { text: "فِى", from: 3.52, to: 4.25 },
        { text: "ٱلْحُطَمَةِ", from: 4.25, to: 6.77 }
      ],
      5: [
        { text: "وَمَآ", from: 0.00, to: 1.12 },
        { text: "أَدْرَىٰكَ", from: 1.12, to: 2.58 },
        { text: "مَا", from: 2.58, to: 3.14 },
        { text: "ٱلْحُطَمَةُ", from: 3.14, to: 5.04 }
      ],
      6: [
        { text: "نَارُ", from: 0.00, to: 0.70 },
        { text: "ٱللَّهِ", from: 0.70, to: 1.63 },
        { text: "ٱلْمُوقَدَةُ", from: 1.63, to: 3.53 }
      ],
      7: [
        { text: "ٱلَّتِى", from: 0.00, to: 1.02 },
        { text: "تَطَّلِعُ", from: 1.02, to: 1.93 },
        { text: "عَلَى", from: 1.93, to: 2.61 },
        { text: "ٱلْأَفْـِٔدَةِ", from: 2.61, to: 4.47 }
      ],
      8: [
        { text: "إِنَّهَا", from: 0.00, to: 1.57 },
        { text: "عَلَيْهِم", from: 1.57, to: 3.20 },
        { text: "مُّؤْصَدَةٌ", from: 3.20, to: 5.69 }
      ],
      9: [
        { text: "فِى", from: 0.00, to: 1.00 },
        { text: "عَمَدٍ", from: 1.00, to: 2.31 },
        { text: "مُّمَدَّدَةٍۭ", from: 2.31, to: 5.69 }
      ]
    }
  };
  // asr (surah 103)
  GOL.WORD_FOLLOW.alafasy[103] = {
    provenance: "ESTIMATED (mora-weighted, unvalidated) from local alafasy mp3 durations; refine by ear",
    audioDurations: [1.8024, 5.8253, 12.5649],
    verses: {
      1: [
        { text: "وَٱلْعَصْرِ", from: 0.00, to: 1.80 }
      ],
      2: [
        { text: "إِنَّ", from: 0.00, to: 0.80 },
        { text: "ٱلْإِنسَـٰنَ", from: 0.80, to: 3.13 },
        { text: "لَفِى", from: 3.13, to: 4.16 },
        { text: "خُسْرٍ", from: 4.16, to: 5.83 }
      ],
      3: [
        { text: "إِلَّا", from: 0.00, to: 0.69 },
        { text: "ٱلَّذِينَ", from: 0.69, to: 1.70 },
        { text: "ءَامَنُوا۟", from: 1.70, to: 2.93 },
        { text: "وَعَمِلُوا۟", from: 2.93, to: 4.16 },
        { text: "ٱلصَّـٰلِحَـٰتِ", from: 4.16, to: 5.92 },
        { text: "وَتَوَاصَوْا۟", from: 5.92, to: 7.50 },
        { text: "بِٱلْحَقِّ", from: 7.50, to: 8.41 },
        { text: "وَتَوَاصَوْا۟", from: 8.41, to: 9.99 },
        { text: "بِٱلصَّبْرِ", from: 9.99, to: 12.56 }
      ]
    }
  };
  // takathur (surah 102)
  GOL.WORD_FOLLOW.alafasy[102] = {
    provenance: "ESTIMATED (mora-weighted, unvalidated) from local alafasy mp3 durations; refine by ear",
    audioDurations: [3.4482, 4.049, 5.4073, 6.7657, 6.609, 6.1127, 8.0718, 12.5649],
    verses: {
      1: [
        { text: "أَلْهَىٰكُمُ", from: 0.00, to: 1.46 },
        { text: "ٱلتَّكَاثُرُ", from: 1.46, to: 3.45 }
      ],
      2: [
        { text: "حَتَّىٰ", from: 0.00, to: 1.16 },
        { text: "زُرْتُمُ", from: 1.16, to: 1.99 },
        { text: "ٱلْمَقَابِرَ", from: 1.99, to: 4.05 }
      ],
      3: [
        { text: "كَلَّا", from: 0.00, to: 1.43 },
        { text: "سَوْفَ", from: 1.43, to: 2.61 },
        { text: "تَعْلَمُونَ", from: 2.61, to: 5.41 }
      ],
      4: [
        { text: "ثُمَّ", from: 0.00, to: 0.96 },
        { text: "كَلَّا", from: 0.96, to: 2.46 },
        { text: "سَوْفَ", from: 2.46, to: 3.70 },
        { text: "تَعْلَمُونَ", from: 3.70, to: 6.77 }
      ],
      5: [
        { text: "كَلَّا", from: 0.00, to: 1.08 },
        { text: "لَوْ", from: 1.08, to: 1.71 },
        { text: "تَعْلَمُونَ", from: 1.71, to: 3.32 },
        { text: "عِلْمَ", from: 3.32, to: 4.06 },
        { text: "ٱلْيَقِينِ", from: 4.06, to: 6.61 }
      ],
      6: [
        { text: "لَتَرَوُنَّ", from: 0.00, to: 2.65 },
        { text: "ٱلْجَحِيمَ", from: 2.65, to: 6.11 }
      ],
      7: [
        { text: "ثُمَّ", from: 0.00, to: 0.88 },
        { text: "لَتَرَوُنَّهَا", from: 0.88, to: 3.71 },
        { text: "عَيْنَ", from: 3.71, to: 4.84 },
        { text: "ٱلْيَقِينِ", from: 4.84, to: 8.07 }
      ],
      8: [
        { text: "ثُمَّ", from: 0.00, to: 1.21 },
        { text: "لَتُسْـَٔلُنَّ", from: 1.21, to: 4.15 },
        { text: "يَوْمَئِذٍ", from: 4.15, to: 7.00 },
        { text: "عَنِ", from: 7.00, to: 7.86 },
        { text: "ٱلنَّعِيمِ", from: 7.86, to: 12.56 }
      ]
    }
  };
  // qariah (surah 101)
  GOL.WORD_FOLLOW.alafasy[101] = {
    provenance: "ESTIMATED (mora-weighted, unvalidated) from local alafasy mp3 durations; refine by ear",
    audioDurations: [2.351, 2.3249, 5.6163, 7.8106, 7.6278, 5.7469, 3.8922, 5.0939, 3.5004, 4.5192, 5.0678],
    verses: {
      1: [
        { text: "ٱلْقَارِعَةُ", from: 0.00, to: 2.35 }
      ],
      2: [
        { text: "مَا", from: 0.00, to: 0.52 },
        { text: "ٱلْقَارِعَةُ", from: 0.52, to: 2.32 }
      ],
      3: [
        { text: "وَمَآ", from: 0.00, to: 1.16 },
        { text: "أَدْرَىٰكَ", from: 1.16, to: 2.67 },
        { text: "مَا", from: 2.67, to: 3.25 },
        { text: "ٱلْقَارِعَةُ", from: 3.25, to: 5.62 }
      ],
      4: [
        { text: "يَوْمَ", from: 0.00, to: 0.93 },
        { text: "يَكُونُ", from: 0.93, to: 2.08 },
        { text: "ٱلنَّاسُ", from: 2.08, to: 3.50 },
        { text: "كَٱلْفَرَاشِ", from: 3.50, to: 5.19 },
        { text: "ٱلْمَبْثُوثِ", from: 5.19, to: 7.81 }
      ],
      5: [
        { text: "وَتَكُونُ", from: 0.00, to: 1.58 },
        { text: "ٱلْجِبَالُ", from: 1.58, to: 3.25 },
        { text: "كَٱلْعِهْنِ", from: 3.25, to: 4.78 },
        { text: "ٱلْمَنفُوشِ", from: 4.78, to: 7.63 }
      ],
      6: [
        { text: "فَأَمَّا", from: 0.00, to: 1.38 },
        { text: "مَن", from: 1.38, to: 1.89 },
        { text: "ثَقُلَتْ", from: 1.89, to: 2.91 },
        { text: "مَوَٰزِينُهُۥ", from: 2.91, to: 5.75 }
      ],
      7: [
        { text: "فَهُوَ", from: 0.00, to: 0.66 },
        { text: "فِى", from: 0.66, to: 1.14 },
        { text: "عِيشَةٍ", from: 1.14, to: 2.06 },
        { text: "رَّاضِيَةٍ", from: 2.06, to: 3.89 }
      ],
      8: [
        { text: "وَأَمَّا", from: 0.00, to: 1.33 },
        { text: "مَنْ", from: 1.33, to: 1.78 },
        { text: "خَفَّتْ", from: 1.78, to: 2.62 },
        { text: "مَوَٰزِينُهُۥ", from: 2.62, to: 5.09 }
      ],
      9: [
        { text: "فَأُمُّهُۥ", from: 0.00, to: 1.23 },
        { text: "هَاوِيَةٌ", from: 1.23, to: 3.50 }
      ],
      10: [
        { text: "وَمَآ", from: 0.00, to: 1.14 },
        { text: "أَدْرَىٰكَ", from: 1.14, to: 2.62 },
        { text: "مَا", from: 2.62, to: 3.19 },
        { text: "هِيَهْ", from: 3.19, to: 4.52 }
      ],
      11: [
        { text: "نَارٌ", from: 0.00, to: 1.68 },
        { text: "حَامِيَةٌۢ", from: 1.68, to: 5.07 }
      ]
    }
  };

  // kursi (pseudo-surah 255, Ayat al-Kursi's nine maqati')
  GOL.WORD_FOLLOW.alafasy[255] = {
    provenance: "ESTIMATED (mora-weighted, unvalidated) from local alafasy mp3 durations; refine by ear",
    audioDurations: [7.917, 5.764, 4.414, 7.683, 4.422, 9.761, 4.348, 3.433, 4.176],
    verses: {
      1: [
        { text: "ٱللَّهُ", from: 0.00, to: 1.12 },
        { text: "لَآ", from: 1.12, to: 2.06 },
        { text: "إِلَـٰهَ", from: 2.06, to: 3.10 },
        { text: "إِلَّا", from: 3.10, to: 4.13 },
        { text: "هُوَ", from: 4.13, to: 4.70 },
        { text: "ٱلْحَىُّ", from: 4.70, to: 5.92 },
        { text: "ٱلْقَيُّومُ", from: 5.92, to: 7.92 }
      ],
      2: [
        { text: "لَا", from: 0.00, to: 1.01 },
        { text: "تَأْخُذُهُۥ", from: 1.01, to: 2.34 },
        { text: "سِنَةٌۭ", from: 2.34, to: 3.15 },
        { text: "وَلَا", from: 3.15, to: 4.49 },
        { text: "نَوْمٌۭ", from: 4.49, to: 5.76 }
      ],
      3: [
        { text: "لَّهُۥ", from: 0.00, to: 0.60 },
        { text: "مَا", from: 0.60, to: 0.95 },
        { text: "فِى", from: 0.95, to: 1.29 },
        { text: "ٱلسَّمَـٰوَٰتِ", from: 1.29, to: 2.71 },
        { text: "وَمَا", from: 2.71, to: 3.28 },
        { text: "فِى", from: 3.28, to: 3.62 },
        { text: "ٱلْأَرْضِ", from: 3.62, to: 4.41 }
      ],
      4: [
        { text: "مَن", from: 0.00, to: 0.65 },
        { text: "ذَا", from: 0.65, to: 1.30 },
        { text: "ٱلَّذِى", from: 1.30, to: 2.71 },
        { text: "يَشْفَعُ", from: 2.71, to: 3.79 },
        { text: "عِندَهُۥٓ", from: 3.79, to: 5.09 },
        { text: "إِلَّا", from: 5.09, to: 6.28 },
        { text: "بِإِذْنِهِۦ", from: 6.28, to: 7.68 }
      ],
      5: [
        { text: "يَعْلَمُ", from: 0.00, to: 0.78 },
        { text: "مَا", from: 0.78, to: 1.17 },
        { text: "بَيْنَ", from: 1.17, to: 1.70 },
        { text: "أَيْدِيهِمْ", from: 1.70, to: 2.75 },
        { text: "وَمَا", from: 2.75, to: 3.41 },
        { text: "خَلْفَهُمْ", from: 3.41, to: 4.42 }
      ],
      6: [
        { text: "وَلَا", from: 0.00, to: 1.09 },
        { text: "يُحِيطُونَ", from: 1.09, to: 3.05 },
        { text: "بِشَىْءٍۢ", from: 3.05, to: 4.14 },
        { text: "مِّنْ", from: 4.14, to: 4.90 },
        { text: "عِلْمِهِۦٓ", from: 4.90, to: 6.21 },
        { text: "إِلَّا", from: 6.21, to: 7.41 },
        { text: "بِمَا", from: 7.41, to: 8.28 },
        { text: "شَآءَ", from: 8.28, to: 9.76 }
      ],
      7: [
        { text: "وَسِعَ", from: 0.00, to: 0.67 },
        { text: "كُرْسِيُّهُ", from: 0.67, to: 1.61 },
        { text: "ٱلسَّمَـٰوَٰتِ", from: 1.61, to: 3.17 },
        { text: "وَٱلْأَرْضَ", from: 3.17, to: 4.35 }
      ],
      8: [
        { text: "وَلَا", from: 0.00, to: 1.07 },
        { text: "يَـُٔودُهُۥ", from: 1.07, to: 2.15 },
        { text: "حِفْظُهُمَا", from: 2.15, to: 3.43 }
      ],
      9: [
        { text: "وَهُوَ", from: 0.00, to: 1.15 },
        { text: "ٱلْعَلِىُّ", from: 1.15, to: 2.57 },
        { text: "ٱلْعَظِيمُ", from: 2.57, to: 4.18 }
      ]
    }
  };
  // kafirun (surah 109)
  GOL.WORD_FOLLOW.alafasy[109] = {
    provenance: "ESTIMATED (mora-weighted, unvalidated) from local alafasy mp3 durations; refine by ear",
    audioDurations: [7.4611, 7.4045, 8.1744, 6.6006, 8.3782, 6.2003],
    verses: {
      1: [
        { text: "قُلْ", from: 0.00, to: 0.63 },
        { text: "يَـٰٓأَيُّهَا", from: 0.63, to: 4.18 },
        { text: "ٱلْكَـٰفِرُونَ", from: 4.18, to: 7.46 }
      ],
      2: [
        { text: "لَآ", from: 0.00, to: 0.97 },
        { text: "أَعْبُدُ", from: 0.97, to: 2.72 },
        { text: "مَا", from: 2.72, to: 4.03 },
        { text: "تَعْبُدُونَ", from: 4.03, to: 7.40 }
      ],
      3: [
        { text: "وَلَآ", from: 0.00, to: 1.48 },
        { text: "أَنتُمْ", from: 1.48, to: 2.84 },
        { text: "عَـٰبِدُونَ", from: 2.84, to: 5.74 },
        { text: "مَآ", from: 5.74, to: 6.42 },
        { text: "أَعْبُدُ", from: 6.42, to: 8.17 }
      ],
      4: [
        { text: "وَلَآ", from: 0.00, to: 1.08 },
        { text: "أَنَا۠", from: 1.08, to: 2.07 },
        { text: "عَابِدٌ", from: 2.07, to: 3.31 },
        { text: "مَّا", from: 3.31, to: 4.42 },
        { text: "عَبَدتُّمْ", from: 4.42, to: 6.60 }
      ],
      5: [
        { text: "وَلَآ", from: 0.00, to: 1.49 },
        { text: "أَنتُمْ", from: 1.49, to: 2.88 },
        { text: "عَـٰبِدُونَ", from: 2.88, to: 5.84 },
        { text: "مَآ", from: 5.84, to: 6.53 },
        { text: "أَعْبُدُ", from: 6.53, to: 8.38 }
      ],
      6: [
        { text: "لَكُمْ", from: 0.00, to: 0.79 },
        { text: "دِينُكُمْ", from: 0.79, to: 2.37 },
        { text: "وَلِىَ", from: 2.37, to: 3.68 },
        { text: "دِينِ", from: 3.68, to: 6.20 }
      ]
    }
  };
})();
