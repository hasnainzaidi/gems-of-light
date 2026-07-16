# Momentum & Patience — Orchestrator Briefs (2026-07-15)

Nine new worlds land in one wave: the journey's first thirteen surahs become
fully playable (through Al-Qari'ah, the first spot of the third island).
Hasnain approved building straight through — the per-wave nieces' playtest
gates of WORLDS-PLAN §4 are consolidated into ONE playtest of the whole span
on staging. Every brief below is a locked spec: the design thinking already
happened here. Builders execute; where a brief and a repo law collide, the
law wins and the collision is flagged to the orchestrator, never silently
resolved.

Read before building: `v3/GRAMMARS.md` (whole file), `v3/WORLDS-PLAN.md` §1
and your world's sketch in §3, plus the two exemplar recipes named in your
brief. `v3/PLAN.md` §9 holds the playtest laws behind these rules.

## 0.1 Standing laws (every agent, verbatim)

- No text instruction, no quizzes, no hazards, no failure, no punishment.
  Water rescues. Creatures are ambient. If a child can see a path they will
  try to walk it — nothing visible may be unreachable, and any "symbolic"
  imagery must be unambiguously non-walkable (background sky-shapes, murals).
- Gems == ayat, gathered in order, one `b.gem(ayah, x, row)` per verse. One
  loop: gems → campfire → shrine door. Campfire then door, ≥3 tiles apart,
  flat, headroom clear, NOTHING floating in the columns above either.
- One hidden blossom straight above a `b.bounce` pad (≤7 rows), ≥18 seeds
  tracing the route, seed-arcs over every leap and water crossing.
- **One agent = one file.** You own exactly `v3/js/worlds/<yourfile>.js`.
  Never touch another world file, the engine, dsl.js, worlds.js, art.js,
  index.html, or docs. If your design seems to need a shared-file change,
  STOP and report back instead of making it.
- Gate: `node v3/tools/check.mjs w<N>` (run from the repo root) must end ✓
  for your world. The checker loads EVERY file in `v3/js/worlds/` — if it
  crashes with an error in a file you don't own, a sibling agent is
  mid-edit: wait ~30 seconds and rerun. Never edit their file.
- Do NOT run git commands. The orchestrator owns commits, script tags, and
  `?v=` bumps.
- Quranic content: gems/audio/text all flow from `js/data.js` via surahId —
  never type Quranic text anywhere.

## 0.2 Anti-template guardrails (the 2026-07-14 review, distilled)

The first eight worlds collapsed into one template and had to be rebuilt.
These rules exist so that never happens again:

- **No opening flowered mound.** Six of eight old worlds began with the same
  flowered `block` mound at x≈9–11. Your first 20 tiles must not look like
  any other world's first 20 tiles. Open on YOUR surah's image.
- **The secret varies.** The bounce+blossom invariant stands, but vary where
  it lives along the journey and what frames it (behind the turn, off the
  raft's far bank, past the campfire clearing…). Not mid-world center-stage
  again.
- **Deliver the soul in tiles and hooks, not comments.** If your brief says
  the world does something per-gem, the recipe must actually declare the
  hook (`endPalette`, `bloomScale`/`bloomBanks`/`bloomAhead`, `gemFx`,
  `drawLandmark`, `flock`) — a comment promising it is a defect.
- **Vary the creature cast.** Not every world gets a tortoise. Use the cast
  your brief names.
- Decorate density is a dial (`density` on the def): still worlds LOW
  (~0.08), abundant worlds high (~0.2). Choose per brief.

## 0.3 DSL quick sheet (beyond GRAMMARS)

All in `v3/js/dsl.js` / consumed by `adventure.js` — read both signatures
before use: `b.occluder(x0,x1,y0,y1,color)` foreground curtain that softens
when the child steps behind it; `b.gallop(x0,x1)` wind-at-your-back stretch;
`b.lightbox(x)` noor-orb path-kindler (night worlds); `b.raft(x0,x1,row)`
deck EXACTLY one row above the waterline, run ends AT a bank;
`b.stone(x)`/`b.stoneBlock` carved grey stone; props: olive cypress palm
lantern wall column flowers bush fruit fountain sundial tuft; creatures:
tortoise butterfly bird. Def-level hooks: `palette`/`endPalette` (named in
art.js ONLY — never invent a palette name), `night`, `weather: 'rain'`,
`bloomScale`, `bloomBanks`, `bloomAhead`, `gemFx`, `drawLandmark(ctx,t,P,L,
prog)`, `flock` (§1 contract), `density`, `stanzas` (13+ ayat only; none of
this wave qualifies). Exemplars: `w5-kawthar.js` (River Road, bloomBanks),
`w6-duha.js` (bloomAhead, palette drift), `w4-qadr.js` (Climb, gemFx),
`w8-fatiha.js` (guided line).

## 1. Wave P — engine plumbing (ONE agent; owns adventure.js + dsl.js only)

Two small declarative features, consumed by w9/w10/w13 below. Zero behavior
change for existing worlds; full `node v3/tools/check.mjs` stays green and
the checker itself is not modified.

**P.1 — landmark progress.** `adventure.js` calls
`L.drawLandmark(ctx, t, P, L)` (draw pass, ~line 1258). Add a fifth
argument: `prog` = fraction of this world's gems already gathered this visit
(0..1; `this.found.length / L.gems.length`, guard divide-by-zero). No world
currently uses drawLandmark, so the signature extension is free.

**P.2 — the ababil flock.** A def-level ambient hook:

```js
flock: { x: 70, y: 4, max: 26 }   // anchor tile x/y, birds at full flock
```

- `dsl.js` buildPrototype passes it through (`flock: def.flock ? {...} : null`).
- `adventure.js`: bird count grows with collection — `ceil(max * prog)`,
  plus 3 birds always present once the world has a flock (the sky is never
  empty, and never dramatic: no diving at the child, no sound).
- Behavior: loose wheeling orbits around the anchor (world-space), gentle
  sinusoidal spread, individual phase offsets; every ~10s a subset sweeps a
  long arc across the visible sky and returns. Drawn BEHIND props, in front
  of hills (same layer as drawLandmark). Reuse/adapt the existing ambient
  'bird' drawing rather than inventing a new painter.
- Perf: cap 40; simple strokes; skip birds far outside the camera.
- Palette-driven colors (silhouette tones from P, e.g. shade(P.hillNear)),
  never hardcoded darks.

Verify by driving w13 manually in Node is impossible (canvas) — instead
confirm: full checker green, and a temporary `flock` stanza on w1 in YOUR
LOCAL EDIT SESSION ONLY is not acceptable (you don't own w1) — write a
10-line standalone smoke note in your final report describing what you
verified by code-reading. The orchestrator browser-verifies on w13.

## 2. The nine worlds

Slots and ids are locked (ids continue the 11–18 series):

| file | registerWorld | id | surah | ayat | palette → end |
|---|---:|---:|---|---:|---|
| `w9-ikhlas.js` | 9 | 19 | Al-Ikhlas (112) | 4 | `ikhlas` → `fatiha` |
| `w10-nasr.js` | 10 | 20 | An-Nasr (110) | 3 | `nas` → `fatiha` |
| `w11-masad.js` | 11 | 21 | Al-Masad (111) | 5 | `maun` (no drift) |
| `w12-quraish.js` | 12 | 22 | Quraish (106) | 4 | `quraishWinter` → `quraysh` |
| `w13-fil.js` | 13 | 23 | Al-Fil (105) | 5 | `fil` (no drift) |
| `w14-humazah.js` | 14 | 24 | Al-Humazah (104) | 9 | `humazah` → `maun` |
| `w15-asr.js` | 15 | 25 | Al-'Asr (103) | 3 | `asr` → `qariah` |
| `w16-takathur.js` | 16 | 26 | At-Takathur (102) | 8 | `takathur` → `fatiha` |
| `w17-qariah.js` | 17 | 27 | Al-Qari'ah (101) | 11 | `qariah` (no drift) |

Every def: `key` and `surahId` exactly as WORLDS-PLAN §2, `name` a lowercase
poetic phrase like the built worlds. Every world ends `node v3/tools/check.mjs wN` ✓.

### W9 — Al-Ikhlas · "the one light" (4 ayat, landmark line)

**Soul:** Oneness has no fork; it has a center. One radiant monument — a
pillar of light beside the Wise Tree — stands mid-world, seen from
everywhere; the journey walks out past it, turns, and comes home to it.

- Cozy Garden base but STILL and sparse: `w` 84, `h` 16, density ~0.08. No
  water. Long sightlines; small clusters of cypress framing empty air.
- **The monument** is `drawLandmark`: at world center (x≈42, in world px
  `42.5*TILE`), a tall soft pillar of light from ground to sky (gradient of
  P.ray/P.sunGlow, alpha-soft edges, gentle breathing with `t`), beside one
  LARGE olive (the Wise Tree — a `b.prop('olive')` at x 40, so life sits in
  front of the light). With `prog`, concentric rings of light expand
  outward along the ground plane — one new ring per gem (radii ~8/16/24/32
  tiles, drawn as soft ground-glow bands) — by the last gem the whole world
  is inside the light.
- **Out-and-back beats:** start x 2. Gem 1 x≈20 (outbound, a rise of two
  garden steps). Gem 2 x≈40 (at the monument's foot). Gem 3 x≈66 (the far
  turn: a quiet stone crescent — `stoneBlock` arc — that visually says
  "turn home"). Gem 4 x≈50 collected WALKING BACK LEFT (place its wake
  order naturally: the child returns along the same road). The return is
  the point: the only way onward is back to the center.
- Campfire x 44, door x 38 — both at the monument's base, the destination
  is the One Light. (Door left of campfire is fine; both flat, monument is
  background light, nothing floats above them.)
- Secret: bounce x≈72 past the far crescent, blossom straight above —
  the reward for touching the turn.
- Creatures: 2 butterflies only. No tortoise. Silence is the luxury here.

### W10 — An-Nasr · "the opening gate" (3 ayat, guided garden road)

**Soul:** Help arrives, the gate opens, everyone streams home. Victory as
homecoming, not conquest.

- Guided garden road, `w` 64, `h` 16, density 0.14. Three long gentle beats,
  each one low broad step up (rows 13 → 12 → 11 via `block` risers wide
  enough to feel like terraces, not stairs).
- **The great gate** is `drawLandmark` at the far end (x≈58): two tall
  stone pillars + arch spanning them, drawn in P.stone tones. Its doors are
  bands of light: with `prog` 0 → closed soft-dark; each gem swings one
  band open (⅓ per gem); at prog 1 the arch is fully open sky-light and
  rays (P.ray) pour through. Draw it big — it should be visible half the
  world away.
- **Streaming home:** creatures all MOVING TOWARD the gate — 3 birds spaced
  along the road (they drift right), 2 tortoises walking right with long
  range, butterflies near the gate. The road itself carries the feeling:
  `b.gallop(30, 52)` — wind at the child's back on the last stretch.
- Gems: 1 x≈14 (first terrace), 2 x≈32 (second, at a lantern pair), 3 x≈48
  (top terrace, the gate now looming). Campfire x 54, door x 58 — the door
  stands IN the gateway: walking through the opened gate is the way onward.
- Secret: bounce x≈8 near the start (look back before you set out),
  blossom above.
- Props: lantern-lined road (5–6), walls low along edges, olive + cypress
  pairs. No water.

### W11 — Al-Masad · "the palm grove" (5 ayat, Cozy Garden) — BAKE-OFF

**Soul:** The gentlest consequence-surah stance (WORLDS-PLAN §1): the world
never dramatizes the warning — it is simply a warm, quiet date-palm grove
where the surah is heard. Anchor image: the palm.

- Cozy Garden, `w` 78, `h` 16, density 0.12, palette `maun`, NO endPalette —
  this world rests; it does not transform.
- **Five palm clusters** carry the five beats: each gem rests near a palm
  (`b.prop('palm', …)`) with hanging date clusters (`b.prop('fruit', …)`
  nestled at the palm's foot or on an adjacent rise). Vary each cluster:
  one on flat ground, one atop a low dune-mound (`block` rise, NOT the old
  flowered-mound opening — make it read as sand-soft, pebble props), one
  across a small pond (2–3 stepping stones — the only water), one in a
  hollow between two palms, one by the campfire clearing.
- **Doves:** 4–5 'bird' creatures perched/drifting among the palms — the
  grove hums with quiet life. One tortoise allowed. Butterflies sparse.
- A low woven wall (`b.prop('wall', …)` run of 2–3) mid-world nods at the
  palm-fiber rope — scenery only, disarmed, nothing to read.
- Campfire x≈66, door x≈72, in a clearing framed by the last two palms.
- Secret: bounce hidden BEHIND the pond cluster (x just past it), blossom
  above.
- Bake-off note: two builders receive this identical brief independently.
  Build it straight; the orchestrator judges on soul-delivered-in-tiles,
  variety between the five clusters, and checker cleanliness.

### W12 — Quraish · "the caravan of two seasons" (4 ayat, River Road)

**Soul:** The winter and summer journeys, and the House that makes them
safe. The trip crosses from cool to warm; the destination is the House.

- River Road, `w` 100, `h` 16. palette `quraishWinter` → endPalette
  `quraysh` (the drift IS the two seasons — cool winter light warming to
  golden summer dust as gems are gathered). Density 0.13.
- **Winter half (x 0–48):** pale, still. Road props: lanterns, low walls.
  A narrow braid of water x 12–18 crossed on 3 stepping stones (gem 1 x≈15
  above the middle stone). Then a rolling `slab` ridge; gem 2 x≈34 on the
  ridge, beside a leaning cypress pair.
- **The wide reach (x 48–66):** the caravan's great crossing — `water(48,
  65, 13)`, `raft(49, 64, 12)` bank-to-bank; gem 3 x≈57 above mid-channel,
  gathered from the raft. Seed-arc the whole reach.
- **Summer half (x 66–99):** warmth arriving — flowers denser, fruit trees
  (`olive` + `fruit`), gem 4 x≈80 by a caravan rest (wall + lantern + two
  tortoises walking right in file — the caravan itself, ambient).
- **The House** is `drawLandmark` at x≈92: a noble, simple cube of warm
  stone (P.stone / P.stoneShade faces, a single gold band near its top —
  P.gold), quiet and unmistakable, drawn behind props. No prog needed —
  it stands constant; the SEASONS move, the House does not. Campfire x 88
  at its door; shrine door x 93. Nothing floats above either column.
- Secret: bounce on the summer bank right where the raft lands (x≈67) —
  step off and look up; blossom above.

### W13 — Al-Fil · "the birds" (5 ayat, Cozy Garden + flock)

**Soul:** Protection fills the sky. The most kid-delightful world of the
wave: each gem adds wings until the air is alive, wheeling around a still,
distant elephant-shaped rock. Nothing scary — the flock is joy.

- Cozy Garden, `w` 86, `h` 16, palette `fil`, density 0.15.
- **The flock hook (LOCKED contract, Wave P):**
  `flock: { x: 70, y: 4, max: 26 }` on the def. The anchor sits high over
  the world's far third, so the sky fills toward the journey's end.
- **The elephant rock** is `drawLandmark`: on the horizon beyond the far
  hills (background layer, small — reads as a distant grey hill that
  happens to hold an elephant's gentle silhouette: domed back, dropped
  trunk line). Unambiguously sky-scenery: it sits ABOVE the hill line,
  never touching walkable ground (playtest law). Still and constant; no
  prog.
- Beats, left→right: open on a bird-bath clearing (fountain prop + 2 birds
  ON the ground — the first wings are already here, close and friendly).
  Gem 1 x≈12. Garden steps up to gem 2 x≈28 on a rise with open sky (first
  flock birds appear overhead as it's taken). Gem 3 x≈44 past a shallow
  pond (stones). Gem 4 x≈60 atop a two-step terrace. Gem 5 x≈72 under the
  anchor — collecting it brings the flock to full wheel overhead.
  Campfire x 78, door x 82.
- Creatures: the 2 ground birds + butterflies. No tortoise here.
- Secret: bounce x≈50 behind the pond, blossom above.

### W14 — Al-Humazah · "gathered to give" (9 ayat, Cozy Garden)

**Soul:** Hoarded piles turn to gardens the moment their gem is carried
away. Generosity as the antidote, told entirely through restoration.
Gentle-consequence stance: the world never scolds; it blooms.

- Cozy Garden, `w` 108 (9 gems need room), `h` 16. palette `humazah` (deep
  shade) → endPalette `maun` (the shared table). Density 0.1 — the ground
  starts spare; the BLOOMS supply the flowers. `bloomScale: 3`.
- **Nine hoards, nine gems.** Each gem nests in a dull grey hoard-pile
  built from `stoneBlock` (tile 4 — carved grey): a low cairn 2–4 tiles
  wide with an OPEN pocket on the approach side (never a trap; the child
  walks in at ground level or hops one tile). Vary the nine relentlessly:
  a knee-high heap; twin heaps flanking; a pocket in a hollow; one atop a
  mound (reached by two garden steps); one behind a `wall` prop line; one
  half-ringed by column stubs (a hoard of fallen grandeur); one small and
  mean; one wide and sprawling; the last right beside the campfire
  clearing, so the final gift blooms over the resting place.
- On collect, the engine's bloom does the theology: flowers burst over the
  grey pile left behind (that's `bloomScale: 3` + tight gem placement
  INSIDE each pile). No other mechanic. No occluders (Takathur owns that
  trick). No new props.
- Spacing: ~10–12 tiles per hoard beat; two brief palate-cleanser
  stretches (x≈38, x≈74) of pure open ground with seeds only.
- Creatures: 1 tortoise, butterflies that gather near BLOOMED piles is not
  wireable — instead scatter butterflies mid-world. Campfire x 98, door
  x 103.
- Secret: bounce x≈76 in the second open stretch, blossom above — the one
  treasure that was never hoarded.

### W15 — Al-'Asr · "golden hour" (3 ayat, guided path)

**Soul:** Time as beauty, never as threat. The palette deepens gem by gem
(never by clock) from plain bright afternoon into glorious golden hour,
arriving at a magnificent sunset campfire. Decline reframed as glory.

- Short guided path, `w` 56, `h` 16 — the most cinematic, least busy world
  of the wave. palette `asr` → endPalette `qariah`. Density 0.12.
- **The sundial** (`b.prop('sundial', 26)`) is the mid-world landmark —
  'Asr is the afternoon prayer; the sundial says "time lives here"
  wordlessly. Frame it with two cypresses.
- Beats: a long level stretch (gem 1 x≈12 between two olives), one broad
  rise of two slabs to the sundial terrace (gem 2 x≈28 by the sundial),
  then a slow descent WEST-FACING: the road looks into the sun. Gem 3 x≈42
  on the descent, backlit.
- **The sunset headland:** the level ends on a small flat promontory (a
  2-row `block` rise, broad top): campfire x 48 framed by two cypresses,
  door x 52. The endPalette's deep golds do the sunset; place 3–4 `flowers`
  and a lantern so the clearing reads as a beloved place.
- Creatures: butterflies only, colA warm tones.
- Secret: bounce x≈6 BEFORE the first gem (the treasure behind you at the
  start — time you can still catch), blossom above.
- Keep it SHORT. Three ayat, ~40 seconds of walk. Resist adding beats.

### W16 — At-Takathur · "the true garden" (8 ayat, occluders)

**Soul:** A lovely garden buried under foreground clutter; walking into
each veiled stretch softens the veil and shows what was there all along.
Distraction → clarity, wordlessly. P6's occluder system gets its one
meaningful production home.

- Cozy Garden, `w` 96, `h` 16. palette `takathur` → endPalette `fatiha`
  (the laden gold clearing into the garden-gate light). Density 0.16 — the
  garden UNDER the veils is genuinely rich (this world's beauty must be
  real, not implied).
- **Six veiled pockets + one open finale.** Use `b.occluder(x0,x1,y0,y1,
  color)` with dull dusty tones (muted browns/greys — derive from the
  palette's stoneDark/soilDark family, e.g. '#8A7B62', '#75705C'; NEVER
  near-black). Each veil covers a 6–9 tile stretch from ~row 5 down to
  row 12 — the child walks in, the curtain softens (engine behavior), and
  the pocket's contents appear: gems 1–6 live one per veiled pocket
  (x≈10, 24, 38, 52, 64, 76), each pocket furnished BEHIND the veil with
  real garden furniture (flowers, fruit tree, a fountain in one, a column
  pair in another — vary all six).
- Gems 7 (x≈84) and 8 (x≈90) stand in OPEN air — the last stretch has no
  veil at all: the true garden, unhidden, in the endPalette's fullest
  light. The contrast is the message.
- Between pockets: piled `stoneBlock` heaps (the "increase") as low
  terrain rhythm — climbable, 1–2 rows, never walling the way.
- NO occluder within 8 tiles of the campfire (x 90 is fine: campfire x 88?
  — set campfire x 86, door x 92, both fully open sky. Re-check the
  floating rule).
- Creatures: butterflies inside two of the pockets (life behind the veil);
  1 tortoise in the open finale.
- Secret: bounce INSIDE the fourth veiled pocket (x≈53), blossom above —
  hidden inside the hidden.

### W17 — Al-Qari'ah · "the weighing light" (11 ayat, windy moor)

**Soul:** A high, windy moor where seed-lights drift like moths and a great
balanced stone reads as scales on the skyline. Awe without fear; the
child walks a vast, hushed place in shimmering pre-evening light.

- The wave's most atmospheric world. `w` 120, `h` 16, palette `qariah`, no
  drift (its shimmer is constant). Density 0.09 — moorland is spare:
  tufts and bushes over flowers.
- **The balanced stone** is `drawLandmark` on the far-third skyline
  (x≈100): a broad rounded stone resting on a slender pedestal stone —
  the scales, visual only, background layer above the hill line, never
  walkable, no prog.
- **Moor waves:** the ground rolls — 5 long low ridges via wide `slab`
  runs and 1–2-row `block` swells (each crossable in one easy jump or a
  walk-up; checker-tight). Two shallow tarns (`water` + stepping stones)
  in the dips.
- **Drifting lights:** this world leans hardest on seeds — 30+, placed in
  RISING ARCS off every ridge crest (`seedArc` with high lift) so the
  trail reads as lights adrift on wind, not a breadcrumb line. 6–8 pale
  butterflies (colA '#EDE6C8'-family set via opts) are the moths.
- Gems 1–11 ride the ridge rhythm: crest, dip, tarn-stone, crest… roughly
  every 9–10 tiles starting x≈8; gems 9–11 climb the final long rise
  toward the balanced stone's stretch of sky (they pass UNDER it — it
  stays far background). Campfire x 110, door x 115 on the flat summit
  meadow past the last ridge.
- One `leafH` wind-leaf ferries the widest tarn (x≈58–66, row 11) — wind
  made visible and rideable.
- Secret: bounce in the second tarn's dip (x≈40), blossom above.

## 3. After the wave (orchestrator only)

Judge the W11 bake-off; add nine script tags to BOTH `index.html` and
`v3/index.html` with a fresh `?v`; full `node v3/tools/check.mjs`; browser
verification (map doors through island 3's first spot, one world per
grammar driven manually, flock + gate + rings + occluders + both-season
lerp seen); WORLDS-PLAN §2 status flips; PLAN §10 log entry; BACKLOG prune;
commit with explicit pathspecs; PR → staging; merge on green Checks.
