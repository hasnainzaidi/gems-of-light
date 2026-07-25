#!/usr/bin/env node
// Contract for the Morning Walk scheduler (v3/js/practice.js). Builds a fake
// GOL in a vm context, loads the real worlds.js + practice.js against it, and
// drives days forward with a mutable todayKey. Asserts the public surface the
// scene (Wave 1) and grown-ups page (Wave 2) are being built against.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const worldsSrc = fs.readFileSync(path.resolve(here, '../js/worlds.js'), 'utf8');
const practiceSrc = fs.readFileSync(path.resolve(here, '../js/practice.js'), 'utf8');

// Real surahIds/keys from WORLD_ORDER, all contiguous at the journey's front
// so journey order == this list. n numbering follows that order for clarity.
const WORLDS = [
  [1, 1, 'fatiha'], [2, 112, 'ikhlas'], [3, 113, 'falaq'], [4, 114, 'nas'],
  [5, 108, 'kawthar'], [6, 110, 'nasr'], [7, 111, 'masad'], [8, 106, 'quraish']
];

// Build a fresh, isolated game world. `earned` is a list of surahIds whose
// Grand Gems are won; `remembering` toggles the experience flag.
function makeGOL({ earned = [], remembering = true } = {}) {
  const stamps = [];
  const state = { today: '2026-07-25' };
  const GOL = {
    WORLDS3: [], DEBUG: false,
    EXPERIENCE: { progression: 'journey', remembering },
    store: {
      data: { opened: [], grand: {}, levels: {}, onboarding: {} },
      level(id) { return (this.data.levels[id] ||= {}); },
      save() {}
    },
    todayKey() { return state.today; },
    stamp(kind) { stamps.push(kind); }
  };
  const context = vm.createContext({ window: { GOL }, console, Math, Date });
  vm.runInContext(worldsSrc, context);
  vm.runInContext(practiceSrc, context);
  for (const [n, surahId, key] of WORLDS) GOL.registerWorld(n, { surahId, key, build() {} });
  for (const id of earned) GOL.store.data.grand[id] = 1;
  return {
    GOL, stamps,
    setToday: (d) => { state.today = d; },
    lvl: (id) => GOL.store.level(id)
  };
}

// advance a 'YYYY-MM-DD' key by one day (UTC calendar math)
function nextDay(key) {
  const [y, m, d] = key.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d) + 86400000;
  const dt = new Date(t);
  const p = (n) => String(n).padStart(2, '0');
  return dt.getUTCFullYear() + '-' + p(dt.getUTCMonth() + 1) + '-' + p(dt.getUTCDate());
}

// ---------------------------------------------------------------------------
// 1. Day reset: build, determinism, archive-on-rollover.
// ---------------------------------------------------------------------------
{
  // seven earned (pool) + quraish still being learned (the frontier newer).
  const { GOL, setToday } = makeGOL({ earned: [1, 112, 113, 114, 108, 110, 111] });
  const p1 = GOL.practice.ensureToday();
  assert.ok(p1.set.length >= 1, 'ensureToday builds a set');
  assert.equal(p1.day, '2026-07-25');
  assert.deepEqual(GOL.practice.ensureToday().set, p1.set,
    'same save + same day returns the identical set (no reshuffle)');

  const firstSet = p1.set.slice();
  setToday('2026-07-26');
  const p2 = GOL.practice.ensureToday();
  assert.equal(p2.day, '2026-07-26');
  assert.equal(p2.log.length, 1, 'rolling to a new day archives yesterday');
  assert.deepEqual(p2.log[0].set, firstSet, 'the archived entry carries yesterday\'s set');
}

// ---------------------------------------------------------------------------
// 2. Composition: no dupes, newer last, priority never a refresh, baseline.
// ---------------------------------------------------------------------------
{
  const { GOL, lvl } = makeGOL({ earned: [1, 112, 113, 114, 108, 110, 111] });
  const p = GOL.practice.ensureToday();
  assert.equal(new Set(p.set).size, p.set.length, 'no surah appears twice');
  assert.equal(p.set[p.set.length - 1], GOL.practice.newerId(), 'the newer door is last');
  assert.equal(p.set.length, 3, 'full pool + a newer builds three doors');
  // quraish (106) is the unearned frontier → its listen baseline is recorded.
  assert.equal(GOL.practice.newerId(), 106);
  assert.equal(p.newerBaseline, lvl(106).heardFull || 0, 'unearned newer records heardFull baseline');

  // an EARNED priority becomes the newer door and must never take a refresh slot.
  const { GOL: G2 } = makeGOL({ earned: [1, 112, 113, 114, 108, 110, 111] });
  G2.practice.setPriority(113); // falaq, an earned pool surah
  const q = G2.practice.ensureToday();
  assert.equal(G2.practice.newerId(), 113);
  assert.equal(q.set[q.set.length - 1], 113, 'earned priority is the newer door');
  assert.equal(q.set.slice(0, -1).includes(113), false, 'priority never occupies a refresh slot');
  assert.equal(q.newerBaseline, null, 'an earned newer gets a dream door, no baseline');

  // setPriority does NOT retroactively rewrite today's already-laid path.
  const { GOL: G3, setToday: s3 } = makeGOL({ earned: [1, 112, 113, 114, 108, 110, 111] });
  const before = G3.practice.ensureToday().set.slice();
  G3.practice.setPriority(112); // ikhlas
  assert.deepEqual(G3.practice.ensureToday().set, before, 'a new pick leaves today\'s walk intact');
  s3(nextDay('2026-07-25'));
  assert.equal(G3.practice.ensureToday().newerId ? true : true, true);
  assert.equal(G3.practice.newerId(), 112, 'the pick takes effect the next day');
}

// ---------------------------------------------------------------------------
// 3. Shrink: pool sizes 2 / 1 / 0, and the enabled() gate.
// ---------------------------------------------------------------------------
{
  const two = makeGOL({ earned: [1, 112] });          // pool 2 (+ frontier newer)
  const sTwo = two.GOL.practice.ensureToday().set;
  assert.ok(sTwo.length <= 3 && sTwo.length >= 1, 'pool of 2 stays valid');
  assert.equal(new Set(sTwo).size, sTwo.length, 'pool of 2 still de-duplicated');

  const one = makeGOL({ earned: [1] });               // pool 1
  const sOne = one.GOL.practice.ensureToday().set;
  assert.ok(sOne.length <= 2, 'pool of 1 builds a shorter set (one refresh + newer)');

  const none = makeGOL({ earned: [] });               // pool 0, but a frontier exists
  const sNone = none.GOL.practice.ensureToday().set;
  assert.equal(sNone.length, 1, 'pool of 0 with a frontier is a single newer door');
  assert.equal(none.GOL.practice.enabled(), false,
    'a frontier alone never opens the gate — a brand-new family must not see it');
  none.GOL.practice.setPriority(1);
  assert.equal(none.GOL.practice.enabled(), true,
    'a priority a grown-up chose on purpose opens the walk even with an empty pool');

  // strip every world of a recipe → nothing in the pool, no frontier.
  const empty = makeGOL({ earned: [] });
  for (const w of empty.GOL.WORLDS3) if (w) w.build = null;
  assert.equal(empty.GOL.practice.ensureToday().set.length, 0, 'nothing known → empty set');
  assert.equal(empty.GOL.practice.enabled(), false, 'no pool and no newer → disabled');

  const off = makeGOL({ earned: [1, 112, 113], remembering: false });
  assert.equal(off.GOL.practice.enabled(), false, 'remembering off (showcase) → always disabled');
}

// ---------------------------------------------------------------------------
// 4. Rotation over 30 simulated days: coverage + building priority.
// ---------------------------------------------------------------------------
{
  const { GOL, lvl, setToday } = makeGOL({ earned: [1, 112, 113, 114, 108, 110, 111] });
  const poolIds = GOL.practice.pool();
  const K = Math.max(7, Math.ceil(poolIds.length / 2) + 3);
  const lastSeen = {};
  let buildingSlots = 0, keepingSlots = 0;

  let day = '2026-07-25';
  for (let i = 0; i < 30; i++) {
    setToday(day);
    const p = GOL.practice.ensureToday();
    const newer = GOL.practice.newerId();
    // count how each REFRESH slot's band stood when the day was laid out.
    for (const id of p.set) {
      if (id === newer && p.newerBaseline != null) continue; // the newer door isn't a refresh
      const r = GOL.practice.reps(id);
      if (r.band === 'building') buildingSlots++; else keepingSlots++;
    }
    // practise every door: earned members via a dream rep, the unearned newer
    // via a campfire full-listen that refreshDone then credits.
    for (const id of p.set) {
      if (id === newer && p.newerBaseline != null) {
        lvl(id).heardFull = (lvl(id).heardFull || 0) + 1; // campfire listen
      } else {
        GOL.practice.creditDream(id, { source: 'walk', counted: true });
      }
      lastSeen[id] = i;
    }
    GOL.practice.refreshDone();
    day = nextDay(day);
  }

  for (const id of poolIds) {
    assert.ok(lastSeen[id] != null && lastSeen[id] >= 30 - K - 1,
      `pool surah ${id} practised within the last ${K} days`);
  }
  assert.ok(buildingSlots >= keepingSlots,
    `building surahs fill at least as many refresh slots (${buildingSlots} vs ${keepingSlots})`);
}

// ---------------------------------------------------------------------------
// 5. Moon-tap sync: a morning moon-tap lands in done; an off-set tap only reps.
// ---------------------------------------------------------------------------
{
  const { GOL, lvl } = makeGOL({ earned: [1, 112, 113, 114, 108, 110, 111] });
  const p = GOL.practice.ensureToday();
  const member = p.set[0];
  lvl(member).moonWaxedDay = GOL.todayKey(); // moon already waxed this morning
  GOL.practice.refreshDone();
  assert.ok(p.done.includes(member), 'a set member whose moon waxed today lands in done[]');

  // 107 (Al-Ma'un) is not a registered world here — an off-set moon-tap.
  const offId = 107;
  const before = lvl(offId).practiceReps || 0;
  GOL.practice.creditDream(offId, { source: 'moon', counted: true });
  assert.equal(lvl(offId).practiceReps, before + 1, 'an off-set tap still counts a rep');
  assert.equal(p.done.includes(offId), false, 'an off-set tap never touches done[]');
}

// ---------------------------------------------------------------------------
// 6. Star: ready only when all done; awarded once; today flag; next-day reset.
// ---------------------------------------------------------------------------
{
  const { GOL, stamps, setToday } = makeGOL({ earned: [1, 112, 113, 114, 108, 110, 111] });
  const p = GOL.practice.ensureToday();
  assert.equal(GOL.practice.starReady(), false, 'not ready before any door is done');
  const newer = GOL.practice.newerId();
  for (const id of p.set) {
    if (id === newer && p.newerBaseline != null) {
      GOL.store.level(id).heardFull = (GOL.store.level(id).heardFull || 0) + 1;
      GOL.practice.refreshDone();
    } else {
      GOL.practice.creditDream(id, { source: 'walk', counted: true });
    }
  }
  assert.equal(GOL.practice.starReady(), true, 'ready once every door is done');
  GOL.practice.awardStar();
  assert.equal(GOL.practice.todayStar(), true, 'the star is awarded for today');
  assert.equal(GOL.practice.starReady(), false, 'no longer ready after awarding (idempotent)');
  assert.equal(stamps.filter((s) => s === 'v3practiceStar').length, 1, 'the star stamps exactly once');
  GOL.practice.awardStar();
  assert.equal(stamps.filter((s) => s === 'v3practiceStar').length, 1, 'a second award is a no-op');

  setToday('2026-07-26');
  GOL.practice.ensureToday();
  assert.equal(GOL.practice.todayStar(), false, 'a new day resets the star');
}

// ---------------------------------------------------------------------------
// 7. Log cap and shape over many days.
// ---------------------------------------------------------------------------
{
  const { GOL, setToday } = makeGOL({ earned: [1, 112, 113, 114, 108, 110, 111] });
  let day = '2026-07-25';
  for (let i = 0; i < 70; i++) { setToday(day); GOL.practice.ensureToday(); day = nextDay(day); }
  const p = GOL.store.data.practice;
  assert.equal(p.log.length, 60, 'the log is capped at 60 days');
  const e = p.log[0];
  assert.equal(Object.keys(e).sort().join(','), 'day,done,set,star',
    'each log entry carries {day,set,done,star}');
  assert.equal(GOL.practice.recentLog(5).length, 5, 'recentLog returns the last n entries');
}

// ---------------------------------------------------------------------------
// 8. creditDream counted:false marks the door done but never reps.
// ---------------------------------------------------------------------------
{
  const { GOL, lvl } = makeGOL({ earned: [1, 112, 113, 114, 108, 110, 111] });
  const p = GOL.practice.ensureToday();
  const member = p.set[0];
  const before = lvl(member).practiceReps || 0;
  GOL.practice.creditDream(member, { source: 'walk', counted: false });
  assert.ok(p.done.includes(member), 'a debug (uncounted) run still completes the door');
  assert.equal(lvl(member).practiceReps, before, 'an uncounted run never increments reps');
}

console.log('✓ morning-walk scheduler: reset, composition, shrink, rotation, sync, star, log');
