# World Grammars — a builder's guide

Each v3 world is one surah, one recipe file (`js/worlds/wN-<key>.js`) that calls
`GOL.registerWorld(N, { id, key, name, surahId, palette, endPalette?, w, h, build(b){…} })`.
The `build(b)` body draws the level with the DSL in `js/dsl.js`. Three grammars
are playtested; pick the one whose shape fits the surah's character, then follow
its recipe. Verify every world with `node v3/tools/check.mjs wN` (zero errors).

## The invariants (every grammar keeps these)

- **Gems == ayat, gathered IN ORDER.** One `b.gem(ayah, x, row)` per verse,
  numbered `1..n`. The engine wakes only the next ayah's gem; place them so the
  natural path meets them in order (left→right, or low→high on a climb).
- **Ending: `b.campfire(x)` then `b.door(x)`, ≥3 tiles apart**, both on flat
  ground with headroom (campfire 3 rows clear, door 4) and NOTHING floating in
  the columns above them (`b.surface` must land on the cap they sit on).
- **One hidden blossom** off a `b.bounce(x)` pad: `b.blossom(x, row)` straight
  above the pad, ≤7 rows up, open sky above the pad.
- **A singing seed trail:** ≥18 `b.seed`/`b.seedRun`/`b.seedArc` sparks (checker
  hard-floor is 14) tracing the route; arcs mark the leaps.
- **No text, no hazards, no failure.** Water is safe (rescue, never death). No
  quizzes, dialogue, or instructional UI. Creatures are ambient only.
- **No memory stone in new worlds** (2026-07-12): the Remembering's doorway
  moved to the journey screen — a completed disc's moonlit moon is the way
  into the dream-shrine (PLAN §10). In-world stones are disarmed scenery;
  the ones already placed (w2/w5/w6) stay as quiet set dressing only.
- **Long surahs (13+ ayat) declare stanzas:** `stanzas: [..]` on the world
  def — run lengths summing to the ayah count — and the shrine, campfire,
  and level layout all breathe in those chunks (WORLDS-PLAN §1, "the
  stanza shrine"). Put a small flat rest ledge between stanza stretches.
- **Palette drift is optional soul:** set `endPalette` and the sky lerps from
  `palette` → `endPalette` as gems are gathered.

---

## 1. COZY GARDEN — the w1/w2 idiom

**Choose it for** gentle, sheltering surahs (refuge, daybreak, the everyday):
a stroll, not a trial. Al-Falaq, An-Nas.

**Recipe:** flat and wide. `w` 78–100, `h = 16`. One `b.ground(0, w-1, 13)`;
the walkable surface row is **13**. Read the world **left→right in rhythm beats**
of ~1 gem each: a flowered mound (`block(x0,x1,12,12)` + gem), two garden steps
(`slab` at rows 11 then 9), a shallow pond (`water` + `stone` stepping stones or
a `raft`), a `bounce` to a high gem with the hidden blossom above it, a last step,
then the campfire clearing and door. Sprinkle `prop`/`creature` per beat.

**Gotchas:** keep steps within one jump (≈3 up, 4 across). Stepping stones must
sit over water (checker enforces). Don't float anything above the campfire/door.

---

## 2. THE CLIMB — the p2/w4 idiom

**Choose it for** surahs of ascent, night, revelation, height — where rising IS
the meaning. Al-Qadr (the night arriving overhead as you climb), Al-'Alaq.

**Recipe:** tall grid, `w ≈ h ≈ 44`. One base floor `b.ground(0, w-1, h-3)`.
The mountain grows UP in a single readable switchback (never a maze): solid
`b.block`/`b.stoneBlock` terraces climbing up-and-right on the lower face, then
`b.slab` ledges switching back up-and-left on the upper face, each rung ~3 rows
higher and ≤2 tiles sideways of the last. Cap it with a broad flat
`b.stoneBlock(x0,x1,5,7)` summit under stars; put `campfire` and `door` on it.
Gems ascend in order (increasing height). `b.waterfall`s pour past the ledges
into a safe pool. A `b.leafV` lift welcomes at the base; the `bounce`+blossom
secret hides on the far side (climb, then drop down the back).

**Gotchas:**
- **`block(x0,x1,y0,y1)` iterates y0..y1 ascending — y0 is the TOP (walkable)
  row.** Getting this backwards buries your terrace.
- **Ascent jumps are tight:** the checker allows `|dx|+|dy| ≤ 5` going up, so a
  3-row rise must be within 2 tiles sideways (a 2-row rise within 3).
- **Summit-surface rule:** nothing may float in the columns above the campfire/
  door, and the summit cap's top row must be the surface — don't let a slab or
  waterfall column intrude above it.

---

## 3. THE RIVER ROAD — the p4/w3 idiom

**Choose it for** surahs that move, run, or journey — a road with momentum.
Al-'Adiyat (the charging horses), any long march.

**Recipe:** flat and long like the garden (`h = 16`, surface row 13), but broken
by **water reaches** between banks. Walk left→right in beats of 3–4 gems. Cross
narrow braids on `b.stone` stepping stones; ferry wider channels on a `b.raft`.
A raft rides **exactly ONE ROW ABOVE the waterline** (`raft(x0, x1, 12)` over
`water(x0,x1,13)`) and its run **ends AT a bank** so riders step off — it is a
bank-to-bank ferry, not a respawning drift. Use `b.block` mounds and a `b.slab`
ridge for rolling elevation, `bridge`/`wall`/`lantern` props for road dressing,
then the quiet campfire clearing and door.

**Gotchas:**
- **Raft deck underwater = the rescue bug.** Deck row must be air with water
  directly beneath (checker fails a deck row inside tile 3).
- **End raft runs at a bank**, never mid-water, or the rider strands.
- Seed-arc over each water reach so the crossing reads as intended.

---

## World list

| # | surah | key | grammar |
|---|-------|-----|---------|
| 1 | Al-Falaq (113) | falaq | Cozy Garden |
| 2 | An-Nas (114) | nas | Cozy Garden |
| 3 | Al-'Adiyat (100) | adiyat | River Road |
| 4 | Al-Qadr (97) | qadr | The Climb |

New world: pick the grammar that fits the surah's character, copy its recipe,
keep every invariant, and run `node v3/tools/check.mjs wN` until it is ✓.
