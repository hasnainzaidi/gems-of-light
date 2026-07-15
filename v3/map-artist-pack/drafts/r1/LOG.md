# Map art direction — round log

Rules of the game: slivers before full maps; one axis varied per cell,
everything else held to the brief; identical prompts across cells except
the direction paragraph; fresh agents every explore round; losers get
parked outside the repo after each verdict so later rounds can't anchor
on them. Judge on phone-distance reads; record WHY, not just which.

## Round 1 — 2026-07-14 · style tiles, 7 cells × 2 variations (Fable)

**Question:** what kind of built object is the map, and whose hand drew it?

Axes: construction shape (monolith / archipelago / causeway) ×
edge language (crisp MV / soft gouache), plus one challenger cell:
natural-soft (no charbagh geometry anywhere — tests whether the
geometric hearts help or hurt; if natural wins, region shape-identity
must move to landmark character, a conscious trade).

Tile spec: Garden Valley vocabulary sample, 900×420, no anchor
contract. All under the built-object law (one construction, water only
in stone-edged channels, deletion test, single projection).

Gallery: `index.html` in this folder.

Contamination notes: mono-crisp glimpsed a sibling draft in a shared
browser tab and cause-crisp hit a stale sibling PNG under a colliding
filename — both after their geometry was already composed, both
self-reported. Treated as clean; noted for the record.

**VERDICTS (Hasnain, 2026-07-14):**
- **Edge language: SOFT, decisively.** Crisp read as "too angled and
  fake and precise — not aligned with our approach," in almost every
  execution. All crisp cells dead.
- **Construction shape: ARCHIPELAGO.** The islands "feel really nice";
  causeway's continuity argument didn't land in the looking. Champion
  tile: **arch-soft · 2** (the spring-court island), narrowly over
  arch-soft · 1 — "they both feel kind of similar; maybe they're two
  different islands on the same world." That reading is ADOPTED as the
  map's structure: islands ARE regions.
- **The charbagh SURVIVES.** The star basin embedded in the arch-soft
  build beat natural-soft directly: "we just never gave the geometry a
  chance to breathe." Geometric hearts stay; natural-soft dead.
- Craft fixes owed by round 2: the water-stair currently reads as
  "hot dogs overlapping" — it must read as ONE continuous stepped stone
  canal, a single connected water ribbon; and bridge junctions must
  meet island decks at matching levels (arch-soft · 2 had a bridge/
  island level discontinuity).
- Open questions carried forward: how the living layer (sprite, gems,
  moon) sits on this style — answered by the P19 harness the moment a
  full map lands; and whether toggling from this semi-3D map into the
  flat side-view levels feels coherent — Mario says yes, to be tested
  by wiring a harness tap into a real world entry.

Losers parked at ~/projects/Quran Learning/map-attempt-3-r1-cells/.

## Round 2 — 2026-07-14 · full-map composition, 3 draws (Fable)

**Question:** with vocabulary locked to arch-soft · 2, what is the
composition of the whole journey? Three walled garden islands on one
calm plain — valley (lower-left, star spring), orchard (center,
quatrefoil), courtyard heights (upper-right, octagon) — joined by
bridges and stepped water-canals, full §5 anchor contract, judged in
the P19 harness with the living layer running.

**VERDICTS (Hasnain, 2026-07-15): r2B wins.**
- Why r2B: balanced island sizes; paths run CENTRALLY through each
  island (edge-hugging paths "waste the rich island" — r2C's sin);
  green everywhere, never paved over (r2A's paved summit rejected);
  no hard kinks (r2A's pointed path elbow on the middle island
  rejected); canal least-bad here of the three.
- Dead: r2A (paved final island, hard path kink), r2C (shrinking
  islands, "super weird" curved canal, edge-hugging paths). Parked.
- Punch list for the refinement (r3):
  1. CANALS still feel wrong everywhere — the island-edge descents
     ("rungs") read as arbitrary; needs one clear spatial logic,
     applied consistently.
  2. BRIDGES must be continuations of the path — no 90° elbows on
     and off; align with trail direction at both ends.
  3. HEARTS: star basin approved as-is. Quatrefoil/clover is the
     weirdest and most out of place as executed — rework into a real
     garden feature, not an outline logo. Octagon could work but must
     be FULL OF WATER.
  4. THE LIGHTLING reads as off for this world's language — the 2D
     side-view sprite pasted onto the oblique map. Needs a map-form
     of her (same character, high-angle proportions, grounded by
     shadow). Engine work, not map art.
  5. Walk motion + target markers slightly off; navigation mapping
     across levels still to be designed properly.
- Direction declared compelling enough to refine. Next checkpoint
  reviews BOTH: the refined r3 map and a wired map→real-world launch
  (the mode-toggle test).

## Round 3 — 2026-07-15 · exploit: refine r2B + wire the toggle

Track 1 (map): the r2B session continues in place — canals given one
honest spatial logic, bridges straightened into the path, hearts
reworked (star kept, clover rebuilt as a garden feature, octagon
filled with water), islands stay green with central paths. Output:
drafts/r3/.
Track 2 (engine): P19 harness gains a map-form lightling (high-angle
proportions, ground shadow, path-following walk) and a real toggle —
tapping a bloomed spot launches the actual current world; home
returns to the map with sim state preserved.

**VERDICTS (Hasnain, 2026-07-15, phone playtest):**
- **The toggle PASSES: "yes" — map→world→map feels like one game.**
  The mode-switch question (semi-3D oblique map into flat side-view
  levels) is settled; Track 2's map-form lightling + real-world launch
  + state-preserving return are adopted as the production pattern.
- **The watercourse is DEAD — as a concept, not just an execution.**
  Three strikes: (1) canal→heart joins read as "the hot dog sticking
  in" at the star pool instead of seamless boundaries; (2) the stepped
  ladders between islands still don't make sense even after r3's
  spatial-logic pass; (3) the meta question had no answer — what is
  the river FOR? It isn't a path, it doesn't interact, it only adds
  mild visual interest. Verdict: remove the river/canals entirely.
- **The hearts are PROMOTED to the map's only water.** Each island's
  geometric heart becomes a central FOUNTAIN with motion/play in it —
  the island's decorative centerpiece that the path goes around. The
  child is in star-world, clover-world, or octagon-world. ("I actually
  like that idea best.")
- **The field becomes SKY.** Make the background read as sky rather
  than a ground plain — less "islands on a plain," more "little
  sections, levels in heaven." Clarifies the island separation too.
- **Decoration density: the clover island is the standard.** It looks
  the best; the valley and courtyard islands read sparse — bring both
  up to its level of beauty.
- **Island boundaries over the resequenced 24-key WORLD_ORDER: 8/8/8
  ADOPTED** (recommended this session, approved by Hasnain). Spots bind
  to WORLD_ORDER positions permanently: Valley = 1–8 (Fatiha…Quraish),
  Orchard = 9–16 (Fil…Bayyinah), Heights = 17–24 (Kafirun…Lail =
  Phase 4 exactly). Why: (a) new keys only APPEND to the ladder, so no
  world ever changes island after a child has seen it; (b) all eight
  built worlds are on the painted map today (Qadr/Duha/Lail are Phase 4
  and live in real saves — the phase-aligned 4/7/5 cut would strand
  them off-map until the expansion panel); (c) the second bridge lands
  exactly on the Phase 3→4 milestone, and the open upper-right seam is
  literally where Phase 4 continues (Shams, Balad, Fajr … Naba).
  Cost: each island needs one more spot anchor (spot-R-8); harness
  REGIONS go 5/6/6 → 8/8/8.
- Worlds note (same playtest, logged in PLAN §10): the eight polished
  worlds have "random world-specific issues, but nothing blocking" —
  ship as-is; detailed per-world feedback comes from a later playtest.

r2B (r3's ancestor, same watercourse concept) parked outside the repo.
r3 stays in place as r4's base file until the r4 verdict.

## Round 4 — 2026-07-15 · direction change: sky field + fountain hearts

Direction change (not a refinement) → fresh agent per protocol, working
from r3's file as base. `MAP-ART-BRIEF.md` §3 (geography/water) and §5
(anchors) are amended by this round; the canonical brief gets rewritten
only after the r4 verdict.

**Track 1 (map, fresh Fable agent):** output `drafts/r4/`.
1. THE FIELD IS SKY — the three walled garden islands float complete
   in bright morning sky; bridges span open sky between them; the
   built-object law and single projection hold per island.
2. ALL WATER LIVES IN THE THREE HEARTS — star pool, clover pool,
   octagon court, each a central fountain the walk path circles, its
   water painted inside `water-R` so the engine can wake it. No other
   water anywhere.
3. DENSITY to the clover island's standard on all three islands.
4. Anchor contract v2: `walk`, `spot-R-1..8` (eight per island),
   `heart-1/2/3`, `gate-1/2` (gateway arch at each bridge's far
   threshold), `moon`, `water-1/2/3` (fountain water only), `over`.
   No `stream` anchor. Everything else per MAP-ART-BRIEF §5.

**Track 2 (engine, Opus agent):** `p19.js` + `drafts/stub/` to
contract v2 — REGIONS 8/8/8, ceremony light travels the WALK path to
the next gate (no stream), gate opens, the woken island's fountain
rises into engine-drawn play (gentle arcs + sparkle at `heart-R`);
asleep islands show dry basins. Toggle untouched.

**First run ABORTED mid-flight (2026-07-15), no art judged.** The
engine track changed the harness contract in the shared working tree
before any r4 painting existed — `?lab=19&map=r3` stopped loading
(v2 requires 8 spots; r3 has 7) and Hasnain, playtesting live, saw
the crude contract STUB instead of the champion and called stop.
This is NOT a verdict on the sky/fountain direction: no r4 art was
ever produced. Process rule earned: on the shared tree, the harness
must keep loading the current champion until the replacement art
exists — contract upgrades land together with (or behind) the art,
never ahead of it. Both tracks stopped; engine WIP salvaged outside
the repo; p19 + stub reverted; r3 loads as before.

**Re-run (2026-07-15, after the false alarm): direction RECONFIRMED —
"direction stands — go, sliver first."** New standing verdict from the
same call: **the walk path must read as one natural, curvy/sinusoidal
line** — pointy polyline direction-changes "don't make sense." (This
extends r2's no-hard-kinks verdict from single corners to the whole
path language: smooth continuous curvature everywhere, varied meander,
never segment-and-corner.)

Sliver spec (protocol: slivers before full maps): ONE finished island —
the clover orchard, whose density is already the approved standard —
floating in bright morning sky, its four-lobed pool as the fountain
centerpiece the path curves around, full gouache. Two variations from
one fresh agent, judged on the phone at 852×393 framing before any
full map or harness work resumes. Output: `drafts/r4/sliver/`.

**SLIVER VERDICT 1 (Hasnain, 2026-07-15, phone):**
- **Hull: A WINS** ("I like the round garden hulls better"); B (island
  shaped like its own heart) parked.
- **Hearts move OFF-CENTER.** A central fountain starves the path of
  real estate. Offset the water fixture and give the walk the room.
- **Path topology set by Hasnain's notebook sketch** (described here;
  the sketch is the spec): three starred circles chained by one
  continuous line — the path ORBITS each heart once and leaves at
  roughly 90° to how it entered ("go through each world at almost
  90°"), then chains on to the next island. The sketch allocates REAL
  ESTATE, not geometry — keep the drawn line meandering and soft, "not
  quite so crisp."
- **The path never touches the fountain.** It is purely decorative —
  no spur, no connection; the orbit passes near it, that's all.
- **Floating vibe MISSES as executed:** "feels like hovering over
  water, maybe" — the under-shadow is too strong. Wanted: floating and
  ethereal — softer underside, haze/cloud wisps beneath, no hard drop
  shadow.
- Orchestrator craft debts confirmed by Hasnain: popsicle bridge
  stubs, A's dead-end spur, B's detached wall arc, finish glossier
  than gouache — all owed in the next iteration.

**SLIVER VERDICT 2 (Hasnain, 2026-07-15, phone — on A2):**
- **The orbit is REJECTED.** "Don't lasso or kink around the water
  fixture. The path should never bend backwards. At most, it should
  be 90° from where it came in." The path through an island is a pure
  THROUGH-LINE: one gentle curve, total turn ≤90°, always flowing
  forward. (Verdict-1's sketch was allocation, not an orbit — the
  circles were the worlds, not the path.)
- **Composition law: the path BIFURCATES each island two-thirds /
  one-third.** The water fixture lives on the two-thirds side; the
  remaining third sits across the path. Trees and decor go on BOTH
  sides so neither reads empty.
- **The float still misses: these are HIGH UP IN THE SKY,** not a
  little above the ground. Establish a LANGUAGE OF ASCENSION — going
  island to island should read as traveling further and further out
  into the heavens. For the map: an altitude gradient across the
  three islands. For the tile: no ground-shadow of any kind, cloud
  layers receding far below, atmospheric depth beneath the island.

**SLIVER VERDICT 3 (Hasnain, 2026-07-15, phone — on A3): "feels
worse."** The flat left-to-right river missed. Path law refined into
**THE QUADRANT RULE:** think of the island as four quadrants — the
path must EXIT from the quadrant diagonally opposite the one it
enters, and it must get there by passing THROUGH one of the two
adjacent quadrants first (never straight across the middle, never any
lasso/doubling-back). E.g. enter SW → sweep through SE → curve up and
exit NE: the through-island turn the original sketch drew. Also: the
aggressive cloud banding hugging the island's front is too much —
dial it back. Priority declared: **get the path geometry and the
island division right FIRST; styling iterates after.**

**SLIVER VERDICT 4 (Hasnain, 2026-07-15, phone — on A4a/A4b): BOTH
PASS.** The quadrant-rule geometry is settled; the routings will
ALTERNATE across islands on the full map (south-bow, north-bow,
south-bow — the S-flow of the original sketch). Refinements ordered:
1. **Minimum path-to-edge margin** — the path currently runs too near
   the rim in places; set a real minimum and hold it everywhere.
2. **The fountain nestles in the path's ELBOW** — central, in the
   pocket of the sweep, so the path visibly "walks by the fountain"
   (near it, never touching it).
3. **A gardening language for the two sections:** the MAJOR (2/3)
   garden = the water fixture + larger trees; the MINOR (1/3) garden
   = flowers and bushes. Each side of the path gets its own
   consistent vocabulary, on every island.

**SLIVER VERDICT 5 (Hasnain, 2026-07-15, phone — on A5): "not
quite," three fixes:**
1. **The sweep must be a real ARC.** A5 reads as "a straight path
   with a little wobble." Cause named: the entry sits too close to
   the quadrant boundary, so the origin quadrant gets skimmed. Fix:
   the path enters CENTRALLY in its entry quadrant and must spend
   real time in all three quadrants — sustained curvature, a
   dramatic sweep, not end-turns on a straightaway.
2. **Nothing touches the path.** Parterres/bushes kissing the ribbon
   is wrong. And the MINOR garden grows: its width should be at
   least DOUBLE the path-edge minimum, so it holds its flowers and
   bushes with room to breathe.
3. **Flat/ground elements must lie IN the ground plane.** Trees read
   great (they stand up); but parterres, bloombeds, and the court
   read as vertical/superimposed — their aspect ratios ignore the
   projection. Everything flush with the ground gets the same
   foreshortening (vertical compression) as the island plate itself.

**VERDICTS (pending):**
