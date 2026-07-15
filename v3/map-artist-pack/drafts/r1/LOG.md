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

**VERDICTS (pending):**
