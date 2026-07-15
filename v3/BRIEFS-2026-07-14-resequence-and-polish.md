# Resequence & Polish — Orchestrator Briefs (2026-07-14)

This document is a complete, self-contained work order. It was produced by a
level-by-level design review of all eight built worlds (assessment summary in
§0.2). The orchestrator reading this runs the waves below with parallel agents
under the repo's standing laws. Read `CLAUDE.md`, `v3/PLAN.md` §10,
`v3/GRAMMARS.md`, and `v3/WORLDS-PLAN.md` §1 before starting. Nothing in this
document overrides those laws; where a brief and a law collide, the law wins
and the collision gets flagged to Hasnain instead of silently resolved.

## 0.1 Standing laws (recap — every agent gets these verbatim)

- No text instruction, no quizzes, no hazards, no failure, no punishment.
  Water rescues. Creatures are ambient. If a child can see a path they will
  try to walk it — nothing visible may be unreachable.
- Gems == ayat, gathered in order. One core loop: gems → campfire → shrine →
  Grand Gem.
- Every touched world must pass `node v3/tools/check.mjs wN` with zero
  errors, then be browser-verified (the embedded pane only pumps rAF during
  interactions — drive scenes manually via their enter/update/draw).
- One agent owns one file. Shared files (engine, dsl, worlds.js, data.js)
  are orchestrator/plumbing-wave work only.
- `js/data.js` is SHARED v1↔v3 — additive changes only. Quranic text is
  fetched from a canonical source (never typed from memory) and verified.
- Git: everything on `v3-prototypes`. One commit per finished idea. Never
  touch `main`. Bump `?v=NNN` on script tags when JS changes (orchestrator,
  once per wave). `sw.js` CACHE bumps only on main merges — not here.
- Playtest gate: after Wave R2, STOP. The nieces play; verdicts land in
  PLAN §9 territory before anything merges toward main.
- Model assignment: Opus for creative recipe/design work, Sonnet for
  mechanical plumbing and small recipes, Haiku only for trivial edits.

## 0.2 Why (the review, in one paragraph)

The two Climb worlds (Qadr 8.5, Lail 8) and Fatiha (8) are genuinely
designed. The flat worlds have collapsed into one template: six of eight open
with an identical flowered mound at x≈9–11; the bounce-pad-with-blossom-
straight-above "secret" appears in identical form in seven worlds; Kawthar
(6.5) and Duha (5) promise mechanics in their comments ("restoration turned
all the way up", the surah's reassurance arc) that the recipes never deliver;
Adiyat (6.5) is a surah about galloping horses staged as a stroll with four
tortoises; Nas (6) is a Falaq reskin that ignores the deepest available
homage (the two surahs are revealed twins). Lail has one real defect: gems
5–8 trace only the left fork arm, so a child who takes the right arm must
climb back DOWN to fetch a sleeping gem — geometry violating the
no-punishment law. These briefs fix all of it, plus resequence the journey
to the memorization ladder Hasnain approved (Phase 1 prayer essentials →
Phase 2 momentum → Phase 3 patience → Phase 4 the rest of Juz 'Amma
shortest-to-longest).

## 0.3 Wave map (dependencies are real; run in this order)

- **Wave R0 — sequence + pipeline.** Orchestrator alone, sequential. Small.
- **Wave R1 — engine plumbing.** One Sonnet agent. Four small features the
  recipes below consume. Must land before R2.
- **Wave R2 — the worlds.** Up to six parallel agents, disjoint recipe
  files. Priority order if budget bites: A (Duha) > B (Lail) > C (Adiyat) >
  D (Kawthar) > E (Nas) > F (polish trio).
- **Then: playtest gate.** No further waves until the nieces play.

---

# WAVE R0 — Sequencing + pipeline (orchestrator)

## R0.1 The new journey order — `v3/js/worlds.js`

Replace `GOL.WORLD_ORDER` with exactly:

```js
GOL.WORLD_ORDER = [
  // Phase 1 — the essentials of prayer
  'fatiha', 'ikhlas', 'falaq', 'nas',
  // Phase 2 — short surahs that build momentum
  'kawthar', 'nasr', 'masad', 'quraish', 'fil', 'humazah', 'asr',
  // Phase 3 — medium lengths that ask for patience
  'takathur', 'qariah', 'adiyat', 'zalzalah', 'bayyinah',
  // Phase 4 — the rest of Juz 'Amma, shortest to longest
  'kafirun', 'maun', 'qadr', 'alaq', 'tin', 'sharh', 'duha', 'lail',
];
```

(Phase 4 continues later — shams, balad, fajr … naba — added when those
worlds are sketched. Keys absent from the registry simply don't appear;
that is existing, tested behavior of `orderedWorlds()`.)

Resulting child-facing order of the eight BUILT worlds:
**fatiha → falaq → nas → kawthar → adiyat → qadr → duha → lail.**

Two deliberate gifts of this order — preserve them in all R2 work:

1. **Qadr → Duha is a palette handoff.** Qadr ends on its summit under full
   stars — "peace until the rising of dawn." Duha opens in that exact
   starred night (`qadrEnd`) and delivers the dawn. The sequence itself
   becomes the homage. (Brief A leans on this.)
2. **Kawthar → Adiyat is a skill handoff.** Kawthar introduces the raft
   gently; Adiyat immediately asks for stones + raft + ridge in one long
   road. Duha then sits between the two climbs as the breather.

## R0.2 Save migration — no visited world may close

Reordering can close a world a child was mid-way through (concretely: a
save with Kawthar's grand gem, playing Duha — under the new order Duha's
predecessor becomes Qadr, which that save hasn't done, so Duha would lock).
Add a one-time guard, run once after `GOL.store.load()` (in `worlds.js`
after `WORLD_ORDER` is defined, or in boot — orchestrator's call):

- For every registered world `w` with a `build` function: if
  `!GOL.worldProgressOpen(w.n)` AND the save shows the child has set foot
  in it (`store.data.levels[w.surahId]` exists with `lastPlayed > 0` or
  `seeds > 0` or `heardFull > 0`), push `w.surahId` into
  `store.data.opened` (dedupe) and save.
- `opened` is the existing parent-practice mechanism (`worldOpen` already
  honors it) — so this fabricates no journey progress, awards nothing, and
  is invisible except that nothing a child touched ever disappears.
- Note the asymmetric case and leave it alone: a save with Duha's grand gem
  will now find Lail progress-open without Qadr. That is a harmless
  jump-ahead, not a loss; the journey heals as they play Qadr.

## R0.3 Docs — WORLDS-PLAN.md, GRAMMARS.md

- `WORLDS-PLAN.md` §2: replace the map table with the four-phase structure
  above (all keys, built-status column, phase column). Rewrite §4's future
  waves to phase order, and add prominently: **the next NEW world to build
  is Al-Ikhlas alone** — it is a Phase 1 surah sitting second in the
  journey, the only gap in the child's first month. Its sketch (§3.A, the
  One Light landmark) stands.
- Append these one-line roadmap seeds for the surahs the new ladder adds
  (sketches only — DO NOT build in these waves):
  - **An-Nasr (110, 3):** the help and the opening — a garden road toward a
    great far gate that opens band by band as gems are found; creatures
    stream homeward past the child as they near it.
  - **Al-Ma'un (107, 7):** the small kindnesses — a humble-cozy garden where
    gems rest beside small good things (a bowl, a doorstep, a well), and
    restoration blooms ahead of the child (reuses Duha's bloom-ahead).
  - **Al-Qari'ah (101, 11):** the striking day, the scales — a high windy
    moor where seed-lights drift like scattered moths; a great balanced
    stone reads as scales on the skyline (visual only, never interactive).
  - **Az-Zalzalah (99, 8):** the earth tells its news — soft mounds that
    open and offer their gems as the child nears; the tiniest seeds
    sparkle brightest ("an atom's weight of good — he will see it").
  - **Al-Bayyinah (98, 8):** the clear evidence — a dusk lane that lights
    lantern by lantern, each gem kindling the next stretch.
  - **Al-Alaq (96, 19):** Read! — a stanza Climb (`stanzas: [5, 9, 5]`) to
    a cave high on the mountain; the first light blooms inside the cave at
    the summit (the Hira homage, wordless).
  - **At-Tin (95, 8):** the fig and the olive — an orchard-terrace world
    (fig and olive props) rising gently to a small holy mount.
- `GRAMMARS.md`: refresh the world-list table (order column = new journey
  order) and note the order now lives in phases.

## R0.4 Content — `js/data.js` (additive ONLY; shared with v1)

Missing for the new ladder: **110 (An-Nasr)** and **95 (At-Tin)**. Add both
entries following the existing schema exactly (Uthmani text fetched from a
canonical source — everyayah/tanzil-grade — verse counts 3 and 8, verified
against the fetched source). Write `kidIntro` in the established voice: read
three existing ones first (108, 109, 111); warm, concrete, one gentle idea,
no fear framing. Have Opus write these two texts even though the wave is
mechanical — kidIntro is child-facing prose.

## R0.5 Audio — `audio/basit/`

Present: 001, 092–094, 097, 100, 102–106, 108–109, 111–114. Fetch the
EveryAyah `Abdul_Basit_Murattal_192kbps` per-ayah files for the seven
missing ladder surahs: **095 (8), 096 (19), 098 (8), 099 (8), 101 (11),
107 (7), 110 (3)** — 64 files, named `SSSAAA.mp3` like the existing set.
Verify each file is nonzero, mp3, and the per-surah count matches the verse
count. everyayah stays the online fallback so nothing breaks if a fetch is
deferred — but say so in the commit if any are.

---

# WAVE R1 — Engine plumbing (one Sonnet agent, exact specs)

Owner files: `v3/js/adventure.js`, `v3/js/dsl.js`, `v3/js/core/engine.js`,
`v3/js/core/art.js` (this agent only; no recipe files). Keep every feature
inert unless a world opts in — byte-identical behavior for worlds that
don't. Each feature ≤ ~40 lines. Test with existing worlds before R2 lands.

### P1 — Bloom options (consumed by Kawthar, Duha)

`bloomAround(x)` in `adventure.js` (~line 681) grows an options argument:
`bloomAround(x, opts = {})` with:
- `scale` (default 1): multiplies flower count budget (dx sweep widens to
  ±5 at scale ≥ 2, plant cap `3 * scale`, up to 2 butterflies, ring fx size
  scaled). Bloom sfx unchanged (never louder).
- `offset` (default 0, tiles): center the bloom at `x + offset*TILE`
  instead of at the gem — this is "bloom AHEAD," flowers appearing on the
  path the child hasn't walked yet.
- World def opt-ins read at gem-collect time:
  - `world.bloomScale: N` → every gem collect blooms with `{scale: N}`.
  - `world.bloomBanks: [[x0,x1], …]` (tile ranges) → each collect ALSO
    plants 2–3 flowers at random surface positions inside each range
    (banks fill up over the level's life).
  - `world.bloomAhead: {from: ayahN, tiles: T}` → gems ≥ ayahN bloom with
    `{offset: T}` (plus a normal small bloom at the gem so the moment
    still reads).

### P2 — The gallop strip (consumed by Adiyat)

- DSL: `b.gallop(x0, x1)` records a zone on the level def.
- Engine (`core/engine.js` ~line 190 clamps `pl.vx` to `±P.WALK`): when the
  player is grounded, inside a gallop zone, and moving toward the zone's
  far end (+x), the clamp becomes `P.WALK * 1.5` and accel gets the same
  factor. Leaving the zone or reversing restores normal instantly. No
  input change — the stick just carries further. It must feel like wind at
  the back, not a different game.
- FX (`adventure.js`): while gallop-boosted, spawn a small heel spark every
  ~90ms (existing fx particles, ember colors `#E8896B` / `#F5D89A`, short
  life, slight backward drift) and a faint dust puff. Nothing on screen
  but the sparks — no meter, no icon.

### P3 — Gem-collect fx hook (consumed by Qadr)

World def option `gemFx: { <ayah>: '<effect>' }` checked in the gem-collect
path. One effect ships now: `'descentLights'` — 8–10 soft warm lights spawn
above the top of the viewport and drift slowly DOWN past the player over
~4s (gentle sway, fade at the ground). Pure particles, no audio, no pause.

### P4 — The distant chargers (consumed by Adiyat)

New ambient creature kind `'chargers'`: a low dark dust-line of 3–4 horse
silhouettes that sweeps across the FAR background near the horizon line,
drawn behind terrain with the distant-hill tint at ~50% alpha (see the
parallax strip machinery, `core/art.js` ~255 — anchor to its horizon).
Behavior: sweep left→right across the whole world over ~8s, then rest
offscreen 15–25s, repeat. Never in the foreground, never interactive,
small (≤ half player height). Recipe API: `b.creature('chargers', 0)`.

---

# WAVE R2 — The worlds (parallel Opus/Sonnet agents, one file each)

Shared acceptance bar for every brief: checker green; browser-verified
(collect every gem in order, ride every mover, reach the blossom, reach
campfire+door); the world's opening beat must no longer be the
flowered-mound-at-x≈9 template unless the brief says keep it; all standing
laws hold. Where a brief gives coordinates they are targets, not gospel —
tune to the checker's jump rules (`up: |dx|+|dy| ≤ 5`), but keep the
STRUCTURE and the meaning-mapping exactly.

## Brief A — Ad-Duha rebuild (`w6-duha.js`) — Opus, the big one

**Intent.** Duha's light concept (starlit stillness warming gem-by-gem to
golden forenoon) is the strongest in the game and the level under it is the
weakest — eleven copy-paste beats. Rebuild the middle so the terrain follows
the surah's own emotional turn, and honor the new sequencing gift: this
world now directly follows Qadr, whose summit promised "peace until the
rising of dawn." Duha IS that dawn arriving.

**Keep:** `palette: 'qadrEnd', endPalette: 'fatiha'`; w ≈ 150–160, h 16,
cozy-garden grammar; the unaimed memory stone near the campfire; the
west-asleep/east-awake creature gradient.

**The surah, precisely — three movements:**
- vv1–5, the oaths and the promise (night → first warmth)
- vv6–8, the three rememberings: orphan → sheltered, lost → guided,
  poor → enriched (SHELTER — terrain that holds you)
- vv9–11, the three turnings-outward: care for the orphan, welcome the
  asker, proclaim the blessing (GIVING — restoration that runs ahead)

**Movement I (gems 1–5, x ≈ 0–65):**
- Beat 1 (g1): **no mound.** The world opens on flat dark ground with one
  lantern — visually the SAME lantern that crowned Qadr's summit (the
  child's eye carries it over) — a sleeping tortoise beside it, and g1
  glowing low (row 11) as the brightest thing in the night.
- Beat 2 (g2): "the night when it grows still" — a still pond crossed on
  stepping stones under stars, g2 over the middle stone. Stillest beat in
  the game: no creatures here, seeds sparse.
- Beat 3 (g3): "your Lord has not forsaken you" — the turn. Two soft slab
  steps up; from this beat the seed trail visibly thickens and never thins
  again.
- Beat 4 (g4): "the Hereafter is better for you than the first" — the
  tallest mound so far, g4 on its crest; the land itself says the best is
  ahead.
- Beat 5 (g5): "your Lord will give, and you will be pleased" — a bounce
  lift to a high gem. **No blossom here** — this bounce is pure route (it
  breaks the fossilized pad+blossom pattern on purpose).

**Movement II (gems 6–8, x ≈ 70–115) — the three shelters.** Each gem sits
INSIDE a form that holds the child, arriving exactly as the sky first
warms:
- Beat 6 (g6, the orphan sheltered): a stone alcove — stoneBlock walls
  forming a hollow open to the east, a warm lantern inside, g6 within.
  Walkthrough must be trivial (no jump inside the hollow).
- Beat 7 (g7, the lost guided): a tree-lane — olives and cypresses flanking
  a flat stretch, and the seed trail running dense and dead-straight
  through its middle: guidance made visible. g7 mid-lane.
- Beat 8 (g8, the poor enriched): a walled garden nook — low wall props, a
  fruit tree, flowers thick, g8 among them.

**Movement III (gems 9–11, x ≈ 120–145) — the giving.** Open forenoon
ground, three gentle rises. Declare `bloomAhead: {from: 9, tiles: 7}` on
the world def (Wave R1 P1): from g9 on, each collect blooms the path AHEAD
of the child — the only world where restoration precedes you, because the
last ayat are about giving forward. By g11 the approach to the campfire is
already in flower.

**Secret:** bounce + blossom moved to the very end of the walk (x ≈ just
before the campfire clearing, open sky): the hidden Rahma blossom hangs
high in the fullest morning light — "and proclaim the blessing of your
Lord" as the level's last, brightest secret.

**Flourishes:** birds only exist east of ~x75 and butterflies east of
~x100 (the waking world); at g8 three birds lift at once. Campfire clearing
in full gold, sparse and calm.

**Do not:** add any text, any new mechanic beyond the P1 opt-in, or any
time-driven change (light moves ONLY on gem collect). Do not make the
shelters enclosing enough to read as caves/occluders — that trick belongs
to At-Takathur later.

## Brief B — Al-Lail braid (`w7-lail.js`) — Opus

**Intent.** Fix the order-stall: today gems 5–8 trace only the left fork
arm, so a right-arm child must climb back down — a punishment by geometry.
Replace the single long fork with a **braid**: the two ways part and rejoin
three times, and every gem sits at a MEETING point, so no route choice can
ever strand a gem behind the child. The meaning gets stronger: "your
striving is diverse" felt three times, and every parting arrives at the
same light.

**Keep:** everything outside stanza 2's middle face (trailhead terraces,
rest ledges, stanza 3/4 rungs, summit, secret, leaf lift, stanzas
`[4,7,5,5]`, palettes). Gem 4 ("indeed your striving is diverse") stays at
the top of the shoulder — the fork must begin immediately after it.

**The braid (replaces the current L1–L4/R1–R4/central-rock/rejoin span,
rows ~54 down to ~35):** From rest ledge 1, g5 on its lip (the fork mouth).
Then three cells, each cell = two single slabs at the same height — a left
way and a right way parting around a small rock knuckle — converging one
jump up on a shared meeting ledge that holds the next gem:
- Cell 1 → meeting ledge M1 with g6
- Cell 2 → M2 with g7
- Cell 3 → M3 with g8
Then the existing wide REJOIN ledge with g9 ("the ways meet toward the
light"), S1 (g10), S2 (g11), rest ledge 2. Tune rows so every up-jump obeys
`|dx|+|dy| ≤ 5`; heights keep ascending overall (gems on one meeting ledge
may share a row — order is the invariant, not strict height).

**Characterize the ways — texture, never judgment:** left arms lush (a
flower prop, an olive), right arms quiet stone (a bare slab, a small
column). BOTH equally wide, equally seeded, equally easy. The quiet way is
quieter, not worse — the game never punishes a choice, and a child must
never feel scolded for the arm they took.

**Verify hard:** walk BOTH arms of all three cells in the browser; every
gem collectable in order on any route combination; no descent ever
required. Re-check the summit clearance rules that were hard-won in git
history (three prior summit fixes — read those commit messages first).

## Brief C — Al-'Adiyat momentum (`w3-adiyat.js`) — Opus

**Intent.** The surah is charging war-horses striking sparks (v2, *qadḥan*)
— the level is currently a stroll guarded by four tortoises. Give it motion
without danger.

**Keep:** the four-beat macro structure (dunes / riverbed / caravan track /
ridge), all gem positions 1–11, both water crossings, the memory stone
(aimed at 114 — An-Nas still precedes it in the new order), the bounce+g11
beat as-is.

**Changes:**
1. **The gallop** (Wave R1 P2): `b.gallop(124, 133)` — after g11, when the
   surah is complete and the dust is settling, the run INTO the campfire
   clearing is the level's reward: the child becomes the charger. Ensure
   the strip is flat clear ground (move the x124–132 seedRun a row up so
   collected seeds burst across the run). Gallop ends ≥4 tiles before the
   campfire; the clearing stays calm.
2. **The distant chargers** (Wave R1 P4): `b.creature('chargers', 0)` — a
   dust-line of horses sweeping the horizon, seen from anywhere, never met.
3. **Creature swap:** keep ONE tortoise (the wayside-rest keeper at ~x95);
   replace the other three with birds. The slowest creature in the game
   should not chaperone the fastest surah.
4. **Spark styling:** in this world only, add 2–3 extra `b.seed` sparks
   low over the crest descent (x≈115–121) so the downhill into the gallop
   reads as struck sparks leading the charge.

**Do not:** make the gallop mandatory for anything, gate anything behind
speed, or let the boost operate leftward (a child wandering back must feel
normal ground).

## Brief D — Al-Kawthar abundance (`w5-kawthar.js`) — Sonnet

**Intent.** Deliver the promised soul: "everywhere the water touches,
flowers pour out." Also give the shortest surah a unique opening — the gift
is immediate.

**Changes:**
1. **Open AT the water.** Kill the mound-at-x≈8 template: the world begins
   on a short bank and g1 hangs over the FIRST stepping-stone crossing,
   only a few tiles in. "Indeed We gave you al-Kawthar" — the river is the
   first thing the child touches.
2. **Restructure to:** stones crossing (g1) → bank walk → the wide ferry
   reach with **g2 collected mid-raft** (gem over the channel like w3's
   g5) → far rise (g3) by the fountain → fountain-dressed campfire (the
   hawd), unaimed memory stone, door. Keep it SHORT (w ≈ 62–70) — brevity
   is its identity.
3. **The bloom surge** (Wave R1 P1): declare `bloomScale: 3` and
   `bloomBanks` covering both water reaches' banks. Three gems must be
   enough to leave the shores visibly crowded with flowers by the end —
   verify in-browser that the surge reads as abundance, not clutter, and
   tune scale down to 2 if it swamps the painterly look.
4. **Secret:** bounce pad on the far bank exactly where the raft lands,
   blossom straight above it — so the whole ferry ride visibly approaches
   the sparkle overhead. The tease is the point.

## Brief E — An-Nas mirror-twin (`w2-nas.js`) — Opus

**Intent.** Al-Falaq and An-Nas are the mu'awwidhatayn — revealed and
recited as a pair. Nas is currently an accidental clone of Falaq; make it a
DELIBERATE mirror instead, and let the village earn its name.

**Changes:**
1. **Mirror the beat order.** Falaq's beats run: mound → garden steps →
   pond/stones → bounce → steps → campfire. Nas walks (still left→right)
   through the same beat types in REVERSE order: steps → bounce → pond/
   fountain-square → steps → mound → campfire. A child who played Falaq
   feels the echo without a word — this place answers that place.
2. **Gems live at people-places** (the surah is mankind): a dooryard, the
   well/fountain square, a rooftop (keep the rooftop hop pair), a lantern
   lane, the village-edge mound. Rework gem spots to sit IN the village
   fabric rather than on generic garden mounds.
3. **Secret varied:** the bounce lifts from the lane to a ROOFTOP blossom
   (pad in the street, blossom straight above at rooftop height, open sky).
4. **Keep:** `b.memory(x, 113)` near the campfire (Falaq still precedes),
   the fountain square, palette, w ≈ 100.

**Do not** literally reverse the world (no right→left walking) and do not
add any signage of the twinning — the echo IS the design.

## Brief F — Polish trio (Sonnet; three small disjoint edits)

1. **Fatiha threshold felt (`w8-fatiha.js`):** before the columns
   (x < 58): beats close together, props denser, seed trail at row 11 with
   tight spacing. After (x > 63): stretch the remaining beats a little
   wider apart, props sparser and taller (cypress over bush), seed trail
   rising to row 9 with looser spacing. Pure rhythm — no new objects. The
   surah pivots from praise to petition at ayah 4 and the SPACE should
   breathe wider past it.
2. **Falaq vantage (`w1-falaq.js`):** widen the world slightly (78 → ~84,
   shifting campfire/door right) to fit one low east-facing rise just
   before the campfire clearing — two slabs and a flower prop where the
   child stands above the gardens they restored with the dawn fully broken
   behind them. One bird takes off as they arrive. No gem, no gate — a
   wordless "look what you did."
3. **Qadr's descending lights (`w4-qadr.js`):** declare
   `gemFx: { 4: 'descentLights' }` (Wave R1 P3). Ayah 4 is "the angels
   descend" — the only verse whose direction opposes the climb, and the
   moment the sky sends something down to meet the child.

---

# Ship checklist (orchestrator, end of R2)

- [ ] `node v3/tools/check.mjs` green for w1–w8 (all touched worlds).
- [ ] Browser pass per touched world: full gem order, movers, blossom,
      campfire, door; drive scenes manually (rAF pump quirk).
- [ ] A world that opts into nothing behaves byte-identically (regression:
      play w8 fatiha before touching it in F, after R1 lands).
- [ ] `?v=NNN` bumped once on the script tags.
- [ ] Save migration verified: seed a fake save with kawthar grand +
      duha `lastPlayed`, load, confirm duha stays open under new order.
- [ ] `GOL.store.reset()` before handing the phone to the nieces.
- [ ] Commits on `v3-prototypes` only; one per finished idea; plain-English
      messages (Hasnain reads them).
- [ ] STOP at the playtest gate. Wave R3+ (Ikhlas, then Phase 2 worlds)
      waits for verdicts.
