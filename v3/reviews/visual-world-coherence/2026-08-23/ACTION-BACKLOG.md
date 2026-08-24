# Gems of Light — Visual World Coherence Action Backlog

This is the implementation handoff for the 2026-08-23 map-led review. It is self-contained, but every item links to the matching report anchor and evidence. Camera and touch work is intentionally absent because live traversal coverage was not completed.

## Implementation follow-up — 2026-08-23

All seven finding-backed world items below are implemented and pass fresh-origin flattened-map comparison plus their targeted integrity checks. Post-fix evidence is stored in each affected world's `resolved/` folder and linked from the item. The optional cross-world authoring rule remains open; native traversal and camera framing remain a separate deferred audit and were not used to overstate these resolution verdicts.

## Five highest-impact fixes

1. **Recompose Al-Qadr's waterfall network** — W04-F01. Highest child-facing coherence impact because the three largest vertical elements contradict the mountain's terrain and the sole pool.
2. **Recompose Al-Lail's waterfall network** — W07-F01. The same visible failure is repeated through a much longer climb and undermines the valley-to-summit story.
3. **Ground the custom skyline landmarks** — W13-F01, W17-F01, W20-F01. Treat these as three world-owned fixes under one art-direction rule: a background landmark must either meet a horizon or be unmistakably magical.
4. **Strengthen the One Light landmark** — W09-F01. The world's central organizing image should remain recognizable before and after arrival.
5. **Make the reflected road unmistakably water** — W18-F01. This protects the one-path metaphor and prevents background paint from competing with the traversable route.

Recommended order: W04 → W07 → W13/W17/W20 in parallel → W09 and W18 in parallel → native phone retest. The two waterfall fixes should establish the visual rule before any optional shared authoring check is added.

## Coordination, preservation, and uncertainty

- **Shared-system work first:** none is justified yet. Fix composition in the owning recipes before deciding whether `js/dsl.js` or `js/core/art.js` needs a validation or rendering change.
- **Safe parallel work:** W04 and W07 may run in parallel if each owns only its world recipe. W13, W17, and W20 may also run in parallel with one recipe per workstream. W09 and W18 are disjoint.
- **Do not parallelize overlapping ownership:** any change to `js/dsl.js`, `js/core/art.js`, `js/adventure.js`, or `js/level-map.js` must be a separate shared-system workstream after world-specific patches are integrated.
- **Preserve deliberate choices:** floating slab climbs in W04/W07; W13's small gentle elephant suggestion; W17's distant non-collidable weighing image; W18's single true path and inverted reflection; W20's small hazed safe city; W09's non-figurative light.
- **Uncertain fixes:** W09-F01, W18-F01, and W20-F01 require native phone spot-checks before final art values are locked. Their map evidence is real, but close-range gameplay may change the severity.

## Batch 1 — Shared camera or framing behavior

No implementation item. Camera boundaries, reversal continuity, off-screen landings, falling recovery, and small-viewport framing were not tested. Do not change camera code from this review. Schedule a separate native Simulator camera pass.

## Batch 2 — Shared rendering, anchoring, or layer behavior

<a id="backlog-horizon-rule"></a>
### Establish a background-landmark horizon rule after world fixes

- Finding IDs: W13-F01, W17-F01, W20-F01
- Priority: P2
- Highest severity: S3
- World/shared system: authoring convention across W13, W17, W20
- Player-facing problem: painted landmarks either float above the horizon or disappear into it.
- Evidence: [W13 annotated](evidence/w13-fil/annotated/W13-F01-1280x720-flat-map-annotated.jpg), [W17 annotated](evidence/w17-qariah/annotated/W17-F01-1280x720-flat-map-annotated.jpg), [W20 annotated](evidence/w20-tin/annotated/W20-F01-1280x720-flat-map-annotated.jpg), [report synthesis](index.html#cross-world)
- Recommended change: after the three recipe fixes are accepted, document or machine-check one rule: a non-magical background landmark must visibly merge into a horizon shoulder or mist base at the target viewports. A deliberately floating magical landmark must have an explicit emitter/support language.
- Likely files: documentation or checker location to be chosen; possibly `GRAMMARS.md` and a non-visual check near `js/level-map.js`. Do not change shared rendering merely to satisfy a checker.
- Non-goals: no global opacity multiplier; no shared parallax rewrite; no camera changes; no automatic movement of every custom landmark.
- Acceptance criteria: all three corrected landmarks pass the visible outcomes in their world items, and the documented rule can distinguish a legitimate magical float from accidental missing ground contact.
- Retest viewports: 874×402 native modern simulator, nearest available SE landscape to 667×375, plus the flattened map.
- Retest scenes: W13 ayah 4–5 approach, W17 ayah 9–11 approach, W20 ayah 2–4 approach.
- Risks: a rigid shared rule could erase intentional dreamlike imagery or force unrelated art changes.
- Dependencies: complete the three world-specific items below first.
- Parallel: no; this follows accepted world patches.
- Ownership boundary: documentation/checker only; no recipe ownership during this item.
- Confidence: medium.

## Batch 3 — World-specific terrain and route corrections

<a id="backlog-w04-f01"></a>
### Recompose Al-Qadr's three waterfalls

- Finding ID: W04-F01
- Status: Implemented 2026-08-23 — magical spring emitters and explicit receivers added; route/collision unchanged.
- Priority: P0
- Highest severity: S2
- World: W04 Al-Qadr
- Player-facing problem: three dominant waterfall shafts start in open air; two terminate on dry ground despite a single pool at the far right.
- Evidence: [annotated](evidence/w04-qadr/annotated/W04-F01-1280x720-flat-map-annotated.jpg), [original](evidence/w04-qadr/originals/W04-M02-art-only-flat-map.jpg), [report](index.html#W04-F01), [resolved](evidence/w04-qadr/resolved/W04-F01-resolved-1280x720-flat-map.jpg)
- Recommended change: compose a source lip/basin and receiver for each retained fall. Prefer a single connected system using the existing pool; remove or convert any shaft that cannot be integrated. If a fall is magical, show an emitter and a dissipating mist end.
- Likely files: `js/worlds/w4-qadr.js`. Only consider `js/dsl.js` or `js/core/art.js` in a later shared workstream.
- Non-goals: do not flatten the climb, remove the deliberate floating slab grammar, change gem order, move the campfire/door, or tune camera values.
- Acceptance criteria:
  - At the lower valley, the child can identify where each visible shaft ends.
  - From the upper ledges, each visible shaft has an implied source before the top leaves frame.
  - No waterfall visibly stops on dry ground without basin, channel, or mist treatment.
  - The system remains legible at both target phone viewports and in the flattened map.
- Retest viewports: 874×402, nearest SE landscape to 667×375, flattened map.
- Retest route: spawn → gem 1 lower face → shoulder gem 3 → upper switchback gem 4 → summit; pause wherever each waterfall enters/exits frame.
- Risks: added terrain can obstruct jump arcs or become misleading collision; extra water can imply hazards.
- Dependencies: none.
- Parallel: yes, with W07 if ownership stays in `w4-qadr.js`.
- Ownership boundary: `js/worlds/w4-qadr.js` only.
- Confidence: high.

<a id="backlog-w07-f01"></a>
### Recompose Al-Lail's valley water system

- Finding ID: W07-F01
- Status: Implemented 2026-08-23 — cascades moved to existing ledge lips with shelf/pool receivers; route/collision unchanged.
- Priority: P0
- Highest severity: S2
- World: W07 Al-Lail
- Player-facing problem: two shafts stop on dry valley terrain and all three lack visible sources, contradicting the only pool and the long ascent story.
- Evidence: [annotated](evidence/w07-lail/annotated/W07-F01-1280x720-flat-map-annotated.jpg), [original](evidence/w07-lail/originals/W07-M02-art-only-flat-map.jpg), [report](index.html#W07-F01), [resolved](evidence/w07-lail/resolved/W07-F01-resolved-1280x720-flat-map.jpg)
- Recommended change: route the retained falls from ledge edges toward the far-right pool, or deliberately turn dry-ending shafts into mist falls with source emitters and dissipating bases.
- Likely files: `js/worlds/w7-lail.js`.
- Non-goals: do not simplify the four stanza movements, erase the two-way middle braid, change gem ordering, or alter camera behavior.
- Acceptance criteria:
  - The left, centre, and right water elements each have source and termination logic.
  - From the valley floor, the water directs the eye upward without looking mechanically stamped in.
  - From each rest ledge, the water reinforces—not contradicts—the route's elevation story.
  - The far-right pool visibly receives at least the fall presented as feeding it.
- Retest viewports: 874×402, nearest SE landscape to 667×375, flattened map.
- Retest route: spawn/leaf lift → stanza 1 terraces → three two-way cells → high slab face → final summit rungs.
- Risks: new cliffs or basins can hide fork landings, create false routes, or obscure stanza-rest ledges.
- Dependencies: none.
- Parallel: yes, with W04 if ownership stays in `w7-lail.js`.
- Ownership boundary: `js/worlds/w7-lail.js` only.
- Confidence: high.

## Batch 4 — World-specific prop and landmark corrections

<a id="backlog-w09-f01"></a>
### Strengthen the One Light's central identity

- Finding ID: W09-F01
- Status: Implemented 2026-08-23 — translucent light spine, veils, and hearth strengthened.
- Priority: P1
- Highest severity: S3
- World: W09 Al-Ikhlas
- Player-facing problem: at full restoration the Wise Tree reads, but the defining pillar of light nearly disappears into the sky and hills.
- Evidence: [annotated](evidence/w09-ikhlas/annotated/W09-F01-1280x720-flat-map-annotated.jpg), [original](evidence/w09-ikhlas/originals/W09-M02-art-only-flat-map.jpg), [report](index.html#W09-F01), [resolved](evidence/w09-ikhlas/resolved/W09-F01-resolved-1280x720-flat-map.jpg)
- Recommended change: strengthen the vertical core, ground hearth, or local edge contrast. Preserve softness; do not solve by washing out the whole screen.
- Likely files: `js/worlds/w9-ikhlas.js`.
- Non-goals: no new text or icon; no solid monument; no collision; no change to the quiet sparse route.
- Acceptance criteria: the same central landmark is identifiable from the western approach and after passing it at 0/4 and 4/4 gems; it remains visibly light, not a wall.
- Retest viewports: 874×402, nearest SE landscape to 667×375, flattened map at 0/4 and 4/4.
- Retest route: spawn → gem 1 rise → central tree/gem 2 → gem 3 east side → look back from the crescent.
- Risks: excessive contrast can obscure the player, tree, gem, or landing line.
- Dependencies: none.
- Parallel: yes; owns only W09.
- Ownership boundary: `js/worlds/w9-ikhlas.js`.
- Confidence: medium.

<a id="backlog-w13-f01"></a>
### Seat the elephant rock into Al-Fil's far hills

- Finding ID: W13-F01
- Status: Implemented 2026-08-23 — elephant rock seated into a hazed far-hill shoulder.
- Priority: P1
- Highest severity: S3
- World: W13 Al-Fil
- Player-facing problem: the grey elephant-shaped rock has a clean floating underside and initially reads as a suspended capsule.
- Evidence: [annotated](evidence/w13-fil/annotated/W13-F01-1280x720-flat-map-annotated.jpg), [original](evidence/w13-fil/originals/W13-M02-art-only-flat-map.jpg), [report](index.html#W13-F01), [resolved](evidence/w13-fil/resolved/W13-F01-resolved-1280x720-flat-map.jpg)
- Recommended change: merge its lower contour into a far-hill shoulder or stronger mist bridge while preserving the small, gentle silhouette.
- Likely files: `js/worlds/w13-fil.js`.
- Non-goals: do not enlarge it into a focal character, make it collidable, darken it into a threat, or compete with the flock.
- Acceptance criteria: no clean air gap remains under the silhouette; it reads as distant landscape at both phone viewports; the flock remains the primary moving sky story.
- Retest viewports: 874×402, nearest SE landscape to 667×375, flattened map.
- Retest route: pond exit → gem 4 terrace → gem 5 under flock anchor.
- Risks: too much contrast can make the rock frightening or route-critical.
- Dependencies: none.
- Parallel: yes, with W17 and W20 under disjoint recipe ownership.
- Ownership boundary: `js/worlds/w13-fil.js`.
- Confidence: high.

<a id="backlog-w17-f01"></a>
### Give the weighing stone a visible skyline base

- Finding ID: W17-F01
- Status: Implemented 2026-08-23 — weighing pedestal seated into a hazed skyline shoulder.
- Priority: P1
- Highest severity: S3
- World: W17 Al-Qari'ah
- Player-facing problem: the stone and its short pedestal float above the hills, weakening the visual idea of weight held in balance.
- Evidence: [annotated](evidence/w17-qariah/annotated/W17-F01-1280x720-flat-map-annotated.jpg), [original](evidence/w17-qariah/originals/W17-M02-art-only-flat-map.jpg), [report](index.html#W17-F01), [resolved](evidence/w17-qariah/resolved/W17-F01-resolved-1280x720-flat-map.jpg)
- Recommended change: extend the pedestal into a distinct far-hill shoulder or add a hazed base silhouette that carries it.
- Likely files: `js/worlds/w17-qariah.js`.
- Non-goals: no reachable platform, no large scales icon, no animation beyond the existing subtle breath, no route change.
- Acceptance criteria: the pedestal visibly meets distant terrain; the landmark remains background-only; the final three-gem rise gains a stable skyline reference.
- Retest viewports: 874×402, nearest SE landscape to 667×375, flattened map.
- Retest route: wind-leaf crossing → gems 7–8 → long rise gems 9–11 → campfire.
- Risks: a tall solid base may look climbable or dominate the summit.
- Dependencies: none.
- Parallel: yes, with W13 and W20.
- Ownership boundary: `js/worlds/w17-qariah.js`.
- Confidence: high.

<a id="backlog-w20-f01"></a>
### Recover At-Tin's safe-city landmark

- Finding ID: W20-F01
- Status: Implemented 2026-08-23 — safe-city silhouette/windows strengthened and grounded into the horizon.
- Priority: P1
- Highest severity: S3
- World: W20 At-Tin
- Player-facing problem: the city and its fully kindled windows disappear into the restored sky/hills, collapsing the intended orchard → city → hollow → summit progression.
- Evidence: [annotated](evidence/w20-tin/annotated/W20-F01-1280x720-flat-map-annotated.jpg), [original](evidence/w20-tin/originals/W20-M02-art-only-flat-map.jpg), [report](index.html#W20-F01), [resolved](evidence/w20-tin/resolved/W20-F01-resolved-1280x720-flat-map.jpg)
- Recommended change: strengthen the city silhouette/window cluster and seat it into a distinct far-hill shoulder. Keep it small and hazed.
- Likely files: `js/worlds/w20-tin.js`.
- Non-goals: no large city set piece, no collision, no new route, no reduction of the final holy-mount emphasis.
- Acceptance criteria: the city is perceptible on the ayah-3 approach at 0/8 and 8/8 gems; it remains clearly background; all four route chapters retain distinct identities.
- Retest viewports: 874×402, nearest SE landscape to 667×375, flattened map at 0/8 and 8/8.
- Retest route: first stone rise → safe-city road → orchard crown → hollow → final mount.
- Risks: increased contrast may compete with gems 2–4 or make the city look traversable.
- Dependencies: none.
- Parallel: yes, with W13 and W17.
- Ownership boundary: `js/worlds/w20-tin.js`.
- Confidence: medium.

<a id="backlog-w18-f01"></a>
### Make Al-Kafirun's reflected road unmistakably water

- Finding ID: W18-F01
- Status: Implemented 2026-08-23 — water band tapered and irregularized; reflected path and bank lines broken into ripples.
- Priority: P1
- Highest severity: S3
- World: W18 Al-Kafirun
- Player-facing problem: the long rectangular reflection band resembles a suspended bridge or alternate route.
- Evidence: [annotated](evidence/w18-kafirun/annotated/W18-F01-1280x720-flat-map-annotated.jpg), [original](evidence/w18-kafirun/originals/W18-M02-art-only-flat-map.jpg), [report](index.html#W18-F01), [resolved](evidence/w18-kafirun/resolved/W18-F01-resolved-1280x720-flat-map.jpg)
- Recommended change: soften and irregularize the band ends and shores, emphasize ripples/inversion, and reduce the continuity of the internal horizontal path line.
- Likely files: `js/worlds/w18-kafirun.js`.
- Non-goals: do not create water collision, a second route, a fork, or a palette drift; preserve the one-path theology.
- Acceptance criteria: children see water/reflection before bridge/platform at both phone viewports; only the lower road reads as traversable; inverted lantern/cypress cues remain visible.
- Retest viewports: 874×402, nearest SE landscape to 667×375, flattened map.
- Retest route: spawn → gems 1–3 → turn around near secret → gems 4–6 → return gaze toward the reflection.
- Risks: excessive softness may erase the metaphor; excessive ripple contrast may compete with gems.
- Dependencies: none.
- Parallel: yes; owns only W18.
- Ownership boundary: `js/worlds/w18-kafirun.js`.
- Confidence: medium.

## Batch 5 — Low-priority polish

No S4 work was created. The review intentionally avoids inventing cosmetic tasks for worlds that already compose coherently.
