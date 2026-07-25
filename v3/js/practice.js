// Gems of Light v3 — practice.js
// The Morning Walk scheduler (DAILY-PRACTICE-PLAN.md, Wave 0). Pure logic
// over the save: which surahs get today's three doors, how reps accumulate,
// and the lazy once-a-day reset. No scene or draw code lives here — the walk
// scene (Wave 1) and the grown-ups page (Wave 2) read this surface.
//
// The walk is, mechanically, three curated moon-doors: it never invents a
// second reward economy. Refresh doors are the dream-shrine (earned surahs);
// the newer door is either a dream (earned priority/frontier) or the real
// world walk credited at the campfire (a surah still being learned).
//
// Load-order safe: nothing runs at load beyond defining the object. Every
// function tolerates worlds not yet registered and a missing/legacy save.
(function () {
  const GOL = window.GOL;

  // reps below this are "building" (still settling in); at/above is "keeping"
  // (secure, but never finished forever). Tunable — a grown-ups knob later.
  const REP_TARGET = 20;

  // --- small helpers over the save ------------------------------------------

  // per-level practice fields, defaulted lazily on the store's level object
  // (engine.js owns the other defaults; we only add ours, additive-only).
  function plevel(id) {
    const st = GOL.store.level(id);
    if (st.practiceReps == null) st.practiceReps = 0;
    if (st.lastPracticeDay == null) st.lastPracticeDay = '';
    return st;
  }

  // the practice object, created bare (no set) if absent — for setPriority,
  // which must be able to record a pick before any day has been built.
  function ensurePracticeObj() {
    const d = GOL.store.data;
    if (!d.practice) {
      d.practice = {
        day: null, set: [], done: [], star: false,
        priorityId: null, newerBaseline: null, newerRepCounted: false, log: []
      };
    }
    return d.practice;
  }

  // whole days between two 'YYYY-MM-DD' keys (UTC math, calendar days only).
  // A missing/never-practiced key reads as 999 so it sorts oldest-first.
  function dayNum(key) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || '');
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000 : null;
  }
  function daysSince(lastKey) {
    const a = dayNum(lastKey), b = dayNum(GOL.todayKey());
    if (a == null || b == null) return 999;
    return Math.round(b - a);
  }

  // journey-order index of a surah (for deterministic tie-breaks) and the
  // world number that carries it — both read live, so an unregistered world
  // simply falls to the end / returns null.
  function orderIndex(surahId) {
    const seq = GOL.orderedWorlds();
    for (let i = 0; i < seq.length; i++) if (seq[i].surahId === surahId) return i;
    return 1e9;
  }
  function worldNFor(surahId) {
    const w = GOL.orderedWorlds().find((x) => x.surahId === surahId);
    return w ? w.n : null;
  }

  // a surahId is a valid priority only if it belongs to a registered, built
  // world — a stale pick (world removed) reads as no pick at all.
  function validPriority(id) {
    if (id == null) return null;
    const w = GOL.orderedWorlds().find((x) => x.surahId === id && x.build);
    return w ? id : null;
  }

  // --- the scheduler signals ------------------------------------------------

  // recent honest signals PLAN §7 already trusts: over the last up-to-3 dream
  // runs, average tries-per-gem ((sockets+misses)/sockets). Never-dreamed
  // reads as 1.5 — a middling nudge, neither ignored nor over-weighted.
  function weakness(surahId) {
    const runs = plevel(surahId).shrineRuns || [];
    if (!runs.length) return 1.5;
    const last = runs.slice(-3);
    let sum = 0;
    for (const r of last) {
      const s = r.sockets || 0;
      sum += s > 0 ? (s + (r.misses || 0)) / s : 1.5;
    }
    return sum / last.length;
  }
  function band(surahId) {
    return (plevel(surahId).practiceReps || 0) < REP_TARGET ? 'building' : 'keeping';
  }
  // staleness is the spine (oldest-first guarantees rotation); a building
  // surah earns a small bonus so it outranks a keeping one of equal age.
  function score(surahId) {
    return Math.min(daysSince(plevel(surahId).lastPracticeDay), 60) +
      (band(surahId) === 'building' ? 3 : 0);
  }

  // surahs the child knows: earned Grand Gems plus the parent-declared
  // already-knew set, in journey order. Nothing else can seed a refresh.
  function pool() {
    return GOL.orderedWorlds()
      .filter((w) => w.build && w.surahId != null &&
        (GOL.worldEarned(w.n) || GOL.worldPriorKnown(w.n)))
      .map((w) => w.surahId);
  }

  // the natural frontier: the first still-open, not-yet-done world (the
  // growth edge), or — if the journey is all done — the most recently earned
  // world, so the newer door is never empty while anything is known.
  function frontierId() {
    const seq = GOL.orderedWorlds();
    for (const w of seq) {
      if (w.build && w.surahId != null && GOL.worldProgressOpen(w.n) && !GOL.worldDone(w.n)) {
        return w.surahId;
      }
    }
    let last = null;
    for (const w of seq) {
      if (w.build && w.surahId != null && GOL.worldEarned(w.n)) last = w.surahId;
    }
    return last;
  }

  // build today's doors: the two most-needed refreshes from the pool (newer
  // and this-morning's already-dreamed surahs removed), then the newer door
  // last. Fully deterministic — same save + same day always yields the same
  // walk, so a reload never reshuffles.
  function buildSet() {
    const newer = api.newerId();
    const today = GOL.todayKey();
    const candidates = pool().filter((id) =>
      id !== newer && plevel(id).moonWaxedDay !== today);
    candidates.sort((a, b) => {
      const sa = score(a), sb = score(b);
      if (sb !== sa) return sb - sa;             // stalest / building first
      const wa = weakness(a), wb = weakness(b);
      if (wb !== wa) return wb - wa;             // then the weaker recall
      const ra = plevel(a).practiceReps || 0, rb = plevel(b).practiceReps || 0;
      if (ra !== rb) return ra - rb;             // then the fewest lifetime reps
      return orderIndex(a) - orderIndex(b);      // then journey order, for stability
    });
    const set = candidates.slice(0, 2);
    if (newer != null) set.push(newer);
    return set.filter((id) => id != null);
  }

  // sync done[] with reality. Refresh (and earned-newer) doors are done once
  // their moon has waxed today; the unearned-newer door is done once its
  // campfire full-listen count rises past the morning's baseline — and that
  // rise is its rep, counted exactly once via the newerRepCounted guard.
  function refreshDone() {
    const p = GOL.store.data.practice;
    if (!p || !Array.isArray(p.set)) return;
    const today = GOL.todayKey();
    const unearnedNewer = (p.newerBaseline != null && p.set.length)
      ? p.set[p.set.length - 1] : null;
    p.done = p.done || [];
    let changed = false;
    for (const id of p.set) {
      if (p.done.includes(id)) continue;
      const st = plevel(id);
      let done = false;
      if (id === unearnedNewer) {
        if ((st.heardFull || 0) > p.newerBaseline) {
          done = true;
          if (!p.newerRepCounted) {
            st.practiceReps = (st.practiceReps || 0) + 1;
            st.lastPracticeDay = today;
            p.newerRepCounted = true;
          }
        }
      } else if (st.moonWaxedDay === today) {
        done = true;
      }
      if (done) { p.done.push(id); changed = true; }
    }
    if (changed) GOL.store.save();
  }

  const api = {
    REP_TARGET: REP_TARGET,

    // the gate only appears once there is something to practice — a surah
    // known, or a priority a grown-up chose on purpose. The frontier fallback
    // alone never opens it: a brand-new family's first world is the journey's
    // own invitation, not a practice door. Never in showcase (no remembering).
    enabled() {
      return !!(GOL.EXPERIENCE && GOL.EXPERIENCE.remembering) &&
        (pool().length > 0 || api.priorityId() != null);
    },

    pool: pool,
    frontierId: frontierId,
    refreshDone: refreshDone,

    priorityId() {
      const p = GOL.store.data.practice;
      return p ? validPriority(p.priorityId) : null;
    },
    // a grown-up's pick. Recorded now, but today's walk is already laid out —
    // a new pick takes effect tomorrow, never reshuffling the current path.
    setPriority(surahIdOrNull) {
      const p = ensurePracticeObj();
      p.priorityId = surahIdOrNull == null ? null : validPriority(surahIdOrNull);
      GOL.store.save();
    },

    // the newer door: the grown-up's valid pick, else the natural frontier.
    // May coincide with a pool member (an earned priority simply gets a dream).
    newerId() {
      const p = api.priorityId();
      return p != null ? p : frontierId();
    },

    // the lazy daily reset. Same day → keep today's walk (just re-sync done);
    // a new day → archive yesterday into the log and lay out a fresh path.
    ensureToday() {
      const d = GOL.store.data;
      const today = GOL.todayKey();
      let p = d.practice;
      if (p && p.day === today) { refreshDone(); return p; }

      // archive yesterday (only if it actually had a walk) before rebuilding
      const log = (p && Array.isArray(p.log)) ? p.log : [];
      if (p && Array.isArray(p.set) && p.set.length) {
        log.push({ day: p.day, set: p.set.slice(), done: (p.done || []).slice(), star: !!p.star });
        if (log.length > 60) log.splice(0, log.length - 60);
      }
      const priority = p ? p.priorityId : null;

      p = d.practice = {
        day: today, set: [], done: [], star: false,
        priorityId: priority, newerBaseline: null, newerRepCounted: false, log: log
      };
      p.set = buildSet();
      // record the newer's listen baseline ONLY when it is unearned — that is
      // the slot whose progress we measure at the campfire, not at a shrine.
      const newer = api.newerId();
      if (newer != null) {
        const nW = worldNFor(newer);
        if (nW != null && !GOL.worldDone(nW)) p.newerBaseline = plevel(newer).heardFull || 0;
      }
      GOL.store.save();
      refreshDone();
      return p;
    },

    // called by shrine.js on EVERY completed dream ceremony (walk or moon).
    // The door's flow works even for debug runs (marks done); only real runs
    // count a rep. A moon-tap outside the walk is still a rep for that surah.
    creditDream(surahId, opts) {
      opts = opts || {};
      const p = GOL.store.data.practice;
      const today = GOL.todayKey();
      const st = plevel(surahId);
      let changed = false;

      if (p && p.day === today && Array.isArray(p.set) &&
        p.set.includes(surahId) && !(p.done || []).includes(surahId)) {
        p.done = p.done || [];
        p.done.push(surahId);
        changed = true;
      }
      if (opts.counted) {
        st.practiceReps = (st.practiceReps || 0) + 1;
        st.lastPracticeDay = today;
        changed = true;
      }
      // tag the run this ceremony just recorded so walk/moon stay distinguishable
      if (opts.source) {
        const runs = st.shrineRuns;
        const r = runs && runs.length ? runs[runs.length - 1] : null;
        if (r && r.dream === true && !r.source) { r.source = opts.source; changed = true; }
      }
      if (changed) GOL.store.save();
    },

    // today's set as door descriptors, in walk order. earned marks a dream
    // door (the unearned-newer slot is the only false one); state lights just
    // the first unfinished arch — the sleeping-gem idiom.
    doors() {
      const p = api.ensureToday();
      const set = p.set || [], done = p.done || [];
      const unearnedNewer = (p.newerBaseline != null && set.length)
        ? set[set.length - 1] : null;
      let nextGiven = false;
      return set.map((surahId) => {
        const worldN = worldNFor(surahId);
        const earned = (worldN != null && GOL.worldDone(worldN)) || surahId !== unearnedNewer;
        let state;
        if (done.includes(surahId)) state = 'done';
        else if (!nextGiven) { state = 'next'; nextGiven = true; }
        else state = 'waiting';
        return { surahId: surahId, worldN: worldN, earned: earned, state: state };
      });
    },

    // has today's practice star already been earned? (a quiet read, no build)
    todayStar() {
      const p = GOL.store.data.practice;
      return !!(p && p.day === GOL.todayKey() && p.star);
    },
    // every door done, star not yet given — the moment to raise the star.
    starReady() {
      const p = GOL.store.data.practice;
      if (!p || p.day !== GOL.todayKey()) return false;
      const set = p.set || [], done = p.done || [];
      return set.length > 0 && set.every((id) => done.includes(id)) && !p.star;
    },
    awardStar() {
      if (!api.starReady()) return;
      GOL.store.data.practice.star = true;
      GOL.store.save();
      GOL.stamp('v3practiceStar');
    },

    // grown-ups truth: reps toward the target (the child never sees a number).
    reps(surahId) {
      return { reps: plevel(surahId).practiceReps || 0, target: REP_TARGET, band: band(surahId) };
    },

    // the last n archived days, most recent LAST. Today is never in the log
    // (it archives on rollover) — callers show today's walk live.
    recentLog(n) {
      const p = GOL.store.data.practice;
      if (!p || !Array.isArray(p.log)) return [];
      return n == null ? p.log.slice() : p.log.slice(Math.max(0, p.log.length - n));
    }
  };

  GOL.practice = api;
})();
