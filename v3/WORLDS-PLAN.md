# Worlds Plan — Levels 1 & 2 (the next twelve surahs)

Companion to `PLAN.md` (loop design, decisions log) and `GRAMMARS.md` (how to
build a world). This file is the roadmap for the twelve new surah worlds drawn
from the "easiest first" memorization ladder: Level 1 (short, highly
repetitive) and Level 2 (short but varied). Al-Falaq (W1) and An-Nas (W2) are
already built; W3 'Adiyat and W4 Qadr predate this plan and stay as they are.

Reviewed 2026-07-12; the corrections from that review are folded in below.

---

## 1. Decisions taken (flag if you disagree)

- **Unlock order is data-driven, not file-driven.** One ordered list of world
  keys (in `worlds.js`) decides the child-facing sequence; world numbers/files
  never need renaming and saves are never touched by a reorder. Proposed
  sequence (roughly the traditional bottom-up memorization path, warnings
  late): falaq, nas, ikhlas, kawthar, asr, quraish, fil, duha, adiyat, sharh,
  qadr, kafirun, takathur, humazah, masad, lail.
- **Memory stones are placed by the recipe, aimed by the engine.** Recipes
  call `b.memory(x)` with NO surah id; at ember-arm time the engine picks the
  **least-recently-remembered completed surah** (falling back to most recent
  Grand Gem). Hardcoded ids (W2's `b.memory(88, 113)`) keep working as an
  override. This is Wave 1 orchestrator plumbing — one small change in
  dsl/adventure, done before any new recipe lands.
- **No world over 12 ayat ships before the shrine has a chunking design.**
  The shrine is proven to 11 sockets (W3). Al-Lail is 21 — a fan of 21 gems
  won't fit a 390px-tall screen, and a 21-recitation campfire is a long sit
  for a five-year-old. Likely shape: sockets light in stanzas of 5–7 with the
  fan showing only the current stanza, campfire recites in the same breaths.
  Design decision goes to PLAN §10 before Al-Lail is briefed. (This same wall
  guards Level 3's 20+ ayah surahs later.)
- **The consequence surahs (Masad, Humazah, Takathur) stay wordless-gentle.**
  The world is a gentle place to *be* while the surah is heard — it never
  dramatizes the warning. Each anchors to a soft image from the surah (the
  palm grove; hoards that bloom when gems leave them; clutter clearing to a
  true garden). They sit late in the unlock order; any framing a parent wants
  lives in the grown-ups page, not in play.
- **Restoration only ever improves the world.** No time-driven decline, no
  darkening baselines (this killed the first Al-Asr sketch — a fading day the
  gems "hold back" is two opposing light drivers and a soft timer, i.e. a
  punishment in disguise).
- **Nothing visible reads as unreachable.** Playtest law: if a child can see
  a path, they will try to walk it. Any "two ways" imagery must be
  unambiguously non-walkable (a reflection in water, a mural, a sky-shape).

## 2. The map

| # | Surah | Ayat | Grammar | Modality | One line |
|---|-------|------|---------|----------|----------|
| — | Al-Falaq (113) | 5 | Cozy Garden | — | ✅ built (W1) |
| — | An-Nas (114) | 6 | Cozy Garden | — | ✅ built (W2) |
| A | Al-Ikhlas (112) | 4 | Landmark line | P8 made meaningful | The One Light at the world's center |
| B | Al-Kawthar (108) | 3 | River Road | P4 raft + bloom surge | A short river of abundance |
| C | Al-Asr (103) | 3 | Guided Path | P7 palette, gem-driven | Golden hour, deepened gem by gem |
| D | Quraish (106) | 4 | River Road | P7 palette (winter→summer) | The caravan of two seasons, home to the House |
| E | Al-Kafirun (109) | 6 | Guided Path | reflection motif | Your lit path; its dim mirror in the river |
| F | Al-Masad (111) | 5 | Cozy Garden | grove dressing | A quiet date-palm grove |
| G | Al-Fil (105) | 5 | Cozy Garden | bird-flock restoration | The sky fills with ababil wings |
| H | Ash-Sharh (94) | 8 | Terrain-opening | headroom as relief | A low close passage that opens wide and bright |
| I | At-Takathur (102) | 8 | Cozy + occluders | P6 clutter-clearing | Piled clutter clears to the true garden |
| J | Al-Humazah (104) | 9 | Cozy Garden | hoards bloom | Gems freed from dull hoards that flower behind them |
| K | Ad-Duha (93) | 11 | Cozy Garden | P7 palette (night→morning) | Still night warming to golden forenoon |
| L | Al-Lail (92) | 21 | The Climb | P2 tall camera + **shrine chunking (new)** | The long night ascent; two ways that rejoin toward the light |

## 3. Per-world sketches

### A. Al-Ikhlas — The One Light (4 ayat, landmark line)
Oneness has no fork; it has a center. One radiant monument (a pillar of light
by the Wise Tree) stands mid-world, visible from everywhere via parallax —
this is P8's landmark finally made *meaningful* (PLAN §10's condition). The
geometry stays honest to the side-scroller: an out-and-back line whose gem
order walks the child past the monument, away, and home again, with the
**campfire and shrine at the monument's base** — the destination is the One
Light. Each collect pushes a ring of light one band further out from the
center. Small world, big stillness.

### B. Al-Kawthar — The River of Abundance (3 ayat, River Road)
Kawthar *is* a river. Short and generous: one bright stream crossed by a P4
ferry raft, and everywhere the water touches, flowers pour out — the
restoration flavor turned all the way up (abundance). Three gems, a gentle
brook rather than W3's long march, ending at a fountain campfire.

### C. Al-Asr — Golden Hour (3 ayat, Guided Path)
'Asr is the late-afternoon light. A short cinematic path where the palette
deepens **gem by gem** (never by time) from plain bright afternoon into more
and more glorious golden-hour, arriving at a magnificent sunset campfire.
Decline reframed as beauty; no clock exists.

### D. Quraish — The Caravan of Two Seasons (4 ayat, River Road)
"Their caravans of winter and summer… so let them worship the Lord of this
House." A journey road that crosses from a cool winter-blue stretch into warm
summer gold (P7 palette keyed to gem count), arriving at **the House** as the
endpoint landmark, campfire at its door. Safety-and-provision is the feeling;
the season shift is the trip.

### E. Al-Kafirun — Your Own Path (6 ayat, Guided Path)
The surah's soul is its parallel refusal, ending "for you is your way, for me
is mine." The child walks a bright noor-lit road beside a **still river**; in
the water runs the road's dim, inverted **reflection** — a second way that is
visibly there and unambiguously not walkable (playtest law above). The
firefly holds the child to their own lit path the whole way. Six gems pace
the surah's parallel beats.

### F. Al-Masad — The Palm Grove (5 ayat, Cozy Garden)
Anchored to the surah's soft image (the palm-fiber rope): a quiet, warm
**date-palm grove** — fronds, dates, doves. No fire, no menace; the world is
simply a gentle place to hear the surah. New props: palm trees, hanging date
clusters (recipe + prop work only).

### G. Al-Fil — The Birds (5 ayat, Cozy Garden + small feature)
The most kid-delightful of the set. Cozy Garden base; the restoration flavor
is **flocks of ababil** — each gem adds birds sweeping across the sky until
it is alive with wings, wheeling around a distant, still elephant-shaped rock
on the horizon. Nothing scary; the drama is protection filling the sky.
NOTE: the flock behavior is a small new creature/particle system — this world
belongs in the small-feature wave, not the recipe-only wave.

### H. Ash-Sharh — The Opening (8 ayat, terrain-opening)
"Did We not expand your breast… removed the burden from your back… with
hardship comes ease." Expressed as **headroom**: the level begins in a low,
close undercroft — ceiling near the child's head, near palette dim — and the
terrain physically opens taller and brighter with each beat until the last
stretch is open sky. Pure terrain + palette; no occluders (that trick belongs
to At-Takathur), no new engine work.

### I. At-Takathur — The True Garden (8 ayat, occluders)
"Distraction by increase, until…" A garden buried under foreground clutter —
piled shapes, dim veils (P6's occluder system, given its one meaningful home).
Each gem clears a layer; by the end the calm true garden stands revealed.
Distraction → clarity, wordlessly.

### J. Al-Humazah — Gathered to Give (9 ayat, Cozy Garden)
The gems (always the ayat — the invariant never bends) sit **within dull
grey hoard-piles**; when the child collects a gem, the hoard it leaves
blossoms into flowers behind them. Generosity as the antidote, told entirely
through restoration. Late in the unlock order per §1.

### K. Ad-Duha — The Morning Brightness (11 ayat, Cozy Garden)
"By the morning brightness, and the night when it grows still…" Begins in
deep-blue starlit stillness and warms **gem by gem** into golden forenoon
(P7's palette driver, night→morning). A gentle wander, not a trial; the
reassurance of the surah lives entirely in the warming light. 11 gems give
the dawn room to unfold (width ~W3 scale).

### L. Al-Lail — The Night and the Two Ways (21 ayat, The Climb) — LAST
A long night ascent under stars (P2 tall grid), switchbacking upward, the
two-ways motif appearing as forks that always rejoin toward the light — and
as the summit's view. **Blocked until the shrine-chunking design (§1) is
decided and built.** This world is the proving ground for every long surah
after it; treat it as a new-mechanic world, not a recipe.

## 4. Waves (orchestrator plumbing first; playtest gates between)

Repo law: verdicts land in PLAN §9 before or with the fix — so no wave starts
until the previous wave's worlds have been played by the nieces. 2–3 worlds
per wave; one bad assumption copied into twelve recipes is the expensive
failure mode.

- **Wave 0 — content pipeline (no recipes).** ✅ done 2026-07-12.
  1. `js/data.js`: add the five missing surahs — 92, 93, 94, 109, 111
     (Uthmani text fetched from a canonical source, never from memory;
     verse counts 21/11/8/6/5). The other seven already have entries.
  2. `audio/basit/`: fetch Abdul Basit per-ayah mp3s for all 12 surahs
     (87 files), verify sizes/format.
  3. This doc + GRAMMARS.md memory-stone correction.
- **Wave 1 — plumbing + first recipes.** ✅ built 2026-07-12 (plumbing,
  checker unaimed-stone fix, w5-kawthar, w6-duha — all checker-green and
  browser-verified). **→ awaiting the nieces' playtest before Wave 2.**
- **Wave 2 — the golden pair + the grove.** **Al-Asr (C)**, **Quraish (D)**
  (both P7-palette variants), **Al-Masad (F)** (palm props). → playtest.
- **Wave 3 — the meaningful landmark + the reflection.** **Al-Ikhlas (A)**
  and **Al-Kafirun (E)** — the two worlds whose *ideas* are new; build after
  the easy wins proved the pipeline. → playtest hard (both carry design
  risk).
- **Wave 4 — feature-bearing pair.** **Al-Fil (G)** (flock system) and
  **Ash-Sharh (H)** (undercroft terrain feel). → playtest.
- **Wave 5 — the late trio's remaining two.** **At-Takathur (I)** (occluder
  rework) and **Al-Humazah (J)** (hoard-bloom flavor). → playtest.
- **Wave 6 — shrine chunking, then Al-Lail (L).** Design → PLAN §10 →
  build → playtest. Unlocks Level 3 lengths for the future.

Every recipe brief carries the standing gates: `node v3/tools/check.mjs wN`
green, GRAMMARS invariants, disjoint file ownership (one agent = one
`wN-<key>.js`), Opus for creative recipe work, Sonnet/Haiku for mechanical.

## 5. Audit trail (what Wave 0 found, 2026-07-12)

- `js/data.js` covered 96–108 + 112–114; missing 92/93/94/109/111 → Wave 0.1.
- `audio/basit/` held only the four built worlds (097/100/113/114) →
  Wave 0.2 fetches the rest; everyayah remains the online fallback.
- GRAMMARS.md still said "no memory stone" from the parked-v1 era, while W2
  places `b.memory(88, 113)` under the approved Remembering → corrected.
