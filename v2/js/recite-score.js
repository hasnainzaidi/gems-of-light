// Gems of Light — recite-score.js
// A small, forgiving bridge between written Uthmani words and the words a
// reciter may hear. Display text is never changed; only matching is softened.
(function (root) {
  const DEFAULT_WORD_SIM = 0.70;

  function normalizeWord(word) {
    return String(word || '')
      .replace(/[ً-ٰٟۖ-ۭ]/g, '')
      .replace(/ـ/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/ء/g, '')
      .replace(/[^ء-ي\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeText(text) {
    return normalizeWord(text);
  }

  function splitWords(text) {
    const normalized = normalizeText(text);
    return normalized ? normalized.split(/\s+/) : [];
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const row = [i];
      for (let j = 1; j <= b.length; j++) {
        row[j] = Math.min(
          row[j - 1] + 1,
          prev[j] + 1,
          prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
      prev = row;
    }
    return prev[b.length];
  }

  function similarity(a, b) {
    const longest = Math.max(a.length, b.length);
    return longest ? 1 - levenshtein(a, b) / longest : 1;
  }

  function align(hypothesisWords, targetWords, opts) {
    opts = opts || {};
    const wordSim = opts.wordSim == null ? DEFAULT_WORD_SIM : opts.wordSim;
    const hyp = hypothesisWords.map(normalizeWord).filter(Boolean);
    const target = targetWords.map(normalizeWord);
    const m = hyp.length, n = target.length;
    const dp = Array.from({ length: m + 1 }, () => new Float64Array(n + 1));
    const move = Array.from({ length: m + 1 }, () => new Uint8Array(n + 1));

    for (let i = 1; i <= m; i++) move[i][0] = 1; // skip a heard word
    for (let j = 1; j <= n; j++) move[0][j] = 2; // leave a target word dim

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        let best = dp[i - 1][j];
        let bestMove = 1;
        if (dp[i][j - 1] > best) {
          best = dp[i][j - 1];
          bestMove = 2;
        }
        const sim = target[j - 1] ? similarity(hyp[i - 1], target[j - 1]) : 0;
        const matched = sim >= wordSim ? dp[i - 1][j - 1] + sim : -1;
        // Prefer a real match on ties so exact zero-cost skips cannot hide it.
        if (matched >= best) {
          best = matched;
          bestMove = 3;
        }
        dp[i][j] = best;
        move[i][j] = bestMove;
      }
    }

    const pairs = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
      const step = move[i][j];
      if (step === 3) {
        pairs.push({ hypothesis: i - 1, target: j - 1, similarity: similarity(hyp[i - 1], target[j - 1]) });
        i--; j--;
      } else if (step === 1) i--;
      else if (step === 2) j--;
      else break;
    }
    pairs.reverse();
    const matched = pairs.map((pair) => pair.target);
    return { matched, score: n ? matched.length / n : 0, pairs };
  }

  function score(hypothesis, targetWords, opts) {
    const hyp = Array.isArray(hypothesis) ? hypothesis : splitWords(hypothesis);
    const target = Array.isArray(targetWords) ? targetWords : String(targetWords || '').split(/\s+/).filter(Boolean);
    return align(hyp, target, opts);
  }

  const reciteScore = { normalizeWord, normalizeText, splitWords, align, score, similarity, DEFAULT_WORD_SIM };
  if (typeof module !== 'undefined' && module.exports) module.exports = reciteScore;
  if (root) (root.GOL = root.GOL || {}).reciteScore = reciteScore;
})(typeof window !== 'undefined' ? window : null);
