# The Morning Walk — a daily practice mode (2 + 1)

**Status: proposal — awaiting Hasnain's read. Verdicts → `PLAN.md` §10.**
**Grounded in [LEARNING-LOOPS-STRATEGY.md](./LEARNING-LOOPS-STRATEGY.md); reuses the
Remembering (dream-shrine, moons, `GOL.todayKey`) rather than adding a second economy.**

---

## One line

Every morning the game sets out **three doors** on a short walkable path —
**two refreshes** drawn from the surahs the child already knows and **one
newer one** a grown-up has marked as the current priority. The child walks
through them one by one; each door is a retrieval ceremony; finishing all
three earns the day's **practice star**.

## Why this mode exists

The map is exploration: the child goes where the star breathes and the moons
invite. That is the right *motivation* layer, but as a *practice schedule* it
has three gaps:

1. **Coverage is uneven.** Moon-taps are child-initiated per surah; a child
   gravitates to favorites, and the surahs that most need reps are exactly
   the ones least likely to be chosen.
2. **There is no dosage.** Nothing accumulates reps toward "this surah is
   secure"; the moon waxes four times and then carries no further schedule.
3. **Parents have no lever.** The grown-ups page can open worlds, but cannot
   say "this month she is working on Al-Fil — keep it warm."

The Morning Walk is the **scheduler**: a small, finite, daily ritual (three
doors, a few minutes) that guarantees rotation across everything known while
keeping one surah — the parent's pick — in daily focus. It is the "Recall
later" layer of the strategy doc given a fixed home in the day. Exploration
remains untouched beside it.

## The child's morning (wordless, as always)

- **Entry — the practice gate.** A small lantern-gate stands on the map (near
  the valley fountain; exact seat is an art/playtest question). While today's
  walk is unfinished it breathes a warm gold — the same invitation idiom as
  the moon halo. Resting on it (the map's usual pause-before-entry) enters
  the Morning Walk. Once the day's star is earned the gate rests, today's
  star hanging in it, until tomorrow.
- **The path.** One screen: a dawn-lit garden path with three standing arches
  in a row. Each arch carries its surah's identity without a word: the
  world's own palette tints the stone, its Grand Gem floats in the archway,
  and on approach the arch **whispers the surah's first ayah** — identity
  before consent, the rule the memory stone taught us.
- **One door at a time.** Only the first unfinished arch is alight (the
  sleeping-gem language); walking into it enters that surah's practice
  ceremony. On return the arch has bloomed and a small star hangs above it;
  the path invites the next arch.
- **The third door closes the ritual.** The three door-stars rise, join into
  one bright practice star (the Grand-Gem spiral idiom, one scale smaller),
  and it settles into the gate. Back to the map.
- **Past stars hang as a garland** along the path fence — the most recent
  handful, purely additive. A missed day adds nothing and *shows* nothing:
  no gap, no grey slot, no broken chain. Stars only ever accumulate.

## What is behind each door

- **The two refresh doors** open the surah's **dream-shrine ceremony** —
  already built, gated, and telemetered. Completing it waxes that surah's
  Remembering Moon exactly as a moon-tap does (same once-a-day rule, same
  `moonWaxedDay`). The walk is, mechanically, **three curated moon-doors** —
  no parallel reward economy, no second kind of review.
- **The newer door** (the parent's priority, or the natural frontier):
  - If its Grand Gem is **earned** → its dream-shrine too, same as a refresh.
  - If it is **still being learned** → the door leads into the real world
    walk (ordered gems → campfire). The door credits when the campfire's
    full recitation completes (`heardFull`) — for material still being
    acquired, the guided walk and the complete listen *are* the right
    practice; retrieval would be premature. Continuing into the shrine
    stays open and welcome, but is not required for the day's star.
- **Door order:** refresh, refresh, newer — warm up on known ground, end on
  the growth edge, and let the star ceremony land right after the hardest
  door. (Tunable; a playtest may say the newer one deserves the freshest
  attention and should go first.)

## Picking the three (the scheduler)

- **The pool** = surahs the child knows: earned Grand Gems plus the
  parent-declared already-knew set (`worldEarned` ∪ `worldPriorKnown`).
- **The newer one** = `practice.priorityId` if a grown-up has set it;
  otherwise the journey's natural frontier (the breathing-star surah if
  started, else the most recently earned world).
- **The two refreshes** are chosen by need, not pure chance, and **stored at
  first computation for the day** (so a reload never reshuffles):
  1. rank the pool by **days since last practiced** (oldest first — this
     alone guarantees full rotation: nothing can starve),
  2. break ties toward **weakness** — recent `shrineRuns` tries-per-gem and
     listens-per-gem (the honest signals PLAN §7 already trusts),
  3. then toward **fewest lifetime reps**.
- **Two bands make "enough reps" real.** Each surah is either **building**
  (reps below target — default 20, tunable) or **keeping** (at/above
  target). Building surahs outrank keeping surahs on any tie; keeping
  surahs still return at least every ~7 days (staleness outranks band), so
  nothing is ever "finished forever." This is spacing a parent can read at
  a glance, not an opaque SRS.
- **Guards:** no surah twice in one day's set; the priority surah never
  occupies a refresh slot; a surah whose moon already waxed today (a
  morning moon-tap) is skipped at set-build time; a pool smaller than three
  simply builds a shorter path (one or two arches). The gate first appears
  once anything is in the pool or a priority is set — a brand-new player
  never sees it.

## Reps, counted honestly

- Completing any practice ceremony — via the walk **or** a direct moon-tap
  (they are the same act) — increments that surah's `practiceReps` and
  stamps `lastPracticeDay`.
- Run quality keeps recording through the existing `st.shrineRuns`
  (`dream:true`), now tagged with `source:'walk'|'moon'` so the two entries
  are distinguishable in the pilot data. v1 counts reps plainly; weighting a
  rep by cleanliness (tries/gem ≤ ~1.5 = full, else half) is a later knob,
  already expressible from the recorded runs.
- The child never sees a number. The moon remains the child-facing memory
  image; reps and targets are grown-ups-page truth only.

## The grown-ups page (additions)

1. **"Practicing now"** — one surah markable as the priority (a small sun
   glyph per row, one at a time; tap to move it). Writes
   `practice.priorityId`. Clearing it returns to the natural frontier.
2. **Per-surah reps** — in each existing row, a slim progress bar toward the
   rep target with the plain count (`13 of 20 practices`), fed by
   `practiceReps` and colored by the recent-quality signal.
3. **The walk log** — the last ~14 days as quiet rows: date, the three
   surah names, and whether the star was earned. Reads
   `practice.log`; nothing leaves the device, as ever.

## Save schema (additive only, `gemsOfLight.v3`)

```js
data.practice = {
  day: '2026-07-25',        // todayKey the current set was built for
  set: [113, 105, 106],     // today's doors, in walk order (newer last)
  done: [113],              // completed today (walk or matching moon-tap)
  star: false,              // all doors done → today's practice star
  priorityId: null,         // grown-up's pick; null = natural frontier
  log: [{ day, set, done, star }]   // capped at 60 days
}
// per-level (inside store.level(id), defaulted like every other field):
st.practiceReps = 0;        // completed practice ceremonies, lifetime
st.lastPracticeDay = '';    // todayKey of the most recent one
```

Reset is lazy: the first look at `data.practice` on a new `todayKey` archives
yesterday into `log` and builds the new set. The day boundary is the same
calendar-day key the moons already use — if late-evening play ever makes
"tomorrow" arrive at midnight mid-session, moving BOTH boundaries to ~4 a.m.
is one shared change in `GOL.todayKey`, never a practice-only fork.

## What this mode deliberately does not do

- **No streaks, no loss, no gate.** The journey never waits for practice;
  an unfinished walk just rests; door progress holds for the day; nothing
  punishes, nothing decays on screen.
- **No new retrieval mechanic in v1.** The dream-shrine carries the doors.
  The Quraysh rooms (`?lab=20`–`24`) are the pipeline for richer practice
  paradigms; whichever rooms survive playtest become alternative door
  interiors later — the walk is the *frame*, not the activity.
- **No third entry point.** Moon-taps stay; the walk curates them. Showcase
  mode never shows the gate (keyed off the same `EXPERIENCE.remembering`
  flag that already hides the moons).

## Build plan (lab-first, wave pattern, disjoint files)

**Wave 0 — the scheduler (pure logic + contract).**
`v3/js/practice.js`: pool, set-building, reps accounting, lazy day-reset —
pure functions over the save, no scene code. New
`v3/tools/test-practice-contract.mjs`: day reset archives + rebuilds;
determinism (same save + same day = same set); no-duplicate and
priority-slot guards; pool-of-1/2 shrink; a 30-simulated-day run asserting
every pool surah is practiced at least once every K days and building
surahs outnumber keeping ones in slots. Checker stays the merge gate.

**Wave 1 — the Morning Walk scene + gate.**
`v3/js/practice-walk.js` (scene) + the map's gate presence. Built as a lab
first (`?lab=25`, own `labSaveKey`, simulated pool) in the house tradition —
arches, whisper-on-approach, door ceremony, star garland — then wired to the
real save behind the gate once the vibe passes.

**Wave 2 — grown-ups additions.**
Priority picker, reps bars, walk log. Text welcome (adult page).

**Wave 3 — promote.**
Real-save wiring, `?v=` bump, staging PR, phone playtest with a fresh save
(the [fresh-save rule](../v3/PLAN.md) from the Al-Fatiha stuck-lightling
lesson), verdicts → PLAN §10.

Model tiers per the working rule: this doc is the invention; Waves 0–2 are
execution against it (Opus-class with locked briefs; the contract file makes
Wave 0 machine-checkable).

## Open questions for Hasnain

1. **Gate seat and look** — a lantern-gate near the valley fountain, or Noor
   waiting with the three stars? (Recommend the gate: places stay, guides
   move.)
2. **Newer-door interior for an unearned surah** — world walk credited at
   the campfire (recommended above), or its shrine with extra help?
3. **Rep target** — is 20 the right default, and should parents see/change
   it, or only see progress toward it?
4. **Door order** — newer one last (recommended) or first?
5. **The garland** — enough of a child-facing trace, or does the practice
   star deserve a seat on the map itself?
