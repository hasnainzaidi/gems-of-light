# Worlds Plan — the phased memorization journey

Companion to `PLAN.md` (loop design, decisions log) and `GRAMMARS.md` (how to
build a world). This file is the roadmap for the four-phase memorization
ladder. File numbers are stable implementation details; `WORLD_ORDER` carries
the child-facing sequence, and absent recipes simply do not appear yet.

Reviewed 2026-07-12; the corrections from that review are folded in below.

---

## 1. Decisions taken (flag if you disagree)

- **Unlock order is data-driven, not file-driven.** One ordered list of world
  keys (in `worlds.js`) decides the child-facing sequence; world numbers/files
  never need renaming. The list now has four phases: prayer essentials;
  short-surah momentum; medium-length patience; then the remaining Juz 'Amma
  shortest-to-longest. A dated save migration preserves every world a child
  visited before the 2026-07-14 reorder without fabricating journey progress.
- **Memory stones are placed by the recipe, aimed by the engine.** Recipes
  call `b.memory(x)` with NO surah id; at ember-arm time the engine picks the
  **least-recently-remembered completed surah** (falling back to most recent
  Grand Gem). Hardcoded ids (W2's `b.memory(88, 113)`) keep working as an
  override. This is Wave 1 orchestrator plumbing — one small change in
  dsl/adventure, done before any new recipe lands.
- **THE STANZA SHRINE (designed 2026-07-12; the chunking gate is open).**
  The shrine was proven to 11 sockets (W3); long surahs break it — a fan of
  21 gems can't fit a 390px screen and 21-item recall is the wrong load for
  a child. The design mirrors how huffaz actually memorize: in maqati'
  (thematic stanzas).
  - A world may declare `stanzas: [4, 7, 5, 5]` (run lengths summing to its
    ayah count). No declaration + ≤12 ayat = exactly today's shrine,
    byte-identical behavior.
  - The shrine presents ONE STANZA at a time: only its gems float in the
    fan (4–7 — a legible set), only its sockets stand open. Recall runs
    within the stanza; order across stanzas is carried by the shrine, not
    the child's working memory.
  - Completing a stanza: its gems settle and MERGE into one bright star on
    the shrine's crest (the stanza, compressed), a short wordless breath,
    then the next stanza's gems drift in and its sockets fade up. Crest
    stars accumulate — progress reads at a glance, no numbers.
  - Full completion = normal bloom / Grand Gem / moon ceremony. Dreams use
    the same chunking automatically (same scene). Telemetry unchanged
    (tries/listens per socket still tell the truth).
  - The campfire breathes in the same stanzas: for stanza-worlds the "your
    turn" chime opens its breath at STANZA ENDS only (a 21-chime campfire
    would be the laborious echo all over again); within a stanza the ayat
    flow at the normal tight gap.
  - The world itself echoes the chunks: Al-Lail's climb pauses at small
    rest ledges ("night camps") between stanzas — the same rhythm felt in
    the legs, the fire, and the stone.
  (This unlocks every Level 3 surah of 20+ ayat later.)
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

| Journey | Phase | Surah | Key | Ayat | Status | Grammar / seed |
|---:|---:|---|---|---:|---|---|
| 1 | 1 | Al-Fatiha (1) | `fatiha` | 7 | ✅ W8 | Cozy Garden / straight path |
| 2 | 1 | Al-Ikhlas (112) | `ikhlas` | 4 | next new world | Landmark line / the One Light |
| 3 | 1 | Al-Falaq (113) | `falaq` | 5 | ✅ W1 | Cozy Garden / daybreak |
| 4 | 1 | An-Nas (114) | `nas` | 6 | ✅ W2 | Cozy Garden / mirror-twin village |
| 5 | 2 | Al-Kawthar (108) | `kawthar` | 3 | ✅ W5 | River Road / abundance |
| 6 | 2 | An-Nasr (110) | `nasr` | 3 | planned | Guided garden road / opening gate |
| 7 | 2 | Al-Masad (111) | `masad` | 5 | planned | Cozy Garden / palm grove |
| 8 | 2 | Quraish (106) | `quraish` | 4 | planned | River Road / two seasons |
| 9 | 2 | Al-Fil (105) | `fil` | 5 | planned | Cozy Garden / bird flocks |
| 10 | 2 | Al-Humazah (104) | `humazah` | 9 | planned | Cozy Garden / hoards bloom |
| 11 | 2 | Al-'Asr (103) | `asr` | 3 | planned | Guided Path / golden hour |
| 12 | 3 | At-Takathur (102) | `takathur` | 8 | planned | Cozy + occluders / true garden |
| 13 | 3 | Al-Qari'ah (101) | `qariah` | 11 | planned | Windy moor / balanced stone |
| 14 | 3 | Al-'Adiyat (100) | `adiyat` | 11 | ✅ W3 | River Road / momentum |
| 15 | 3 | Az-Zalzalah (99) | `zalzalah` | 8 | planned | Soft mounds / earth offers gems |
| 16 | 3 | Al-Bayyinah (98) | `bayyinah` | 8 | planned | Guided dusk lane / lanterns |
| 17 | 4 | Al-Kafirun (109) | `kafirun` | 6 | planned | Guided Path / reflection |
| 18 | 4 | Al-Ma'un (107) | `maun` | 7 | planned | Cozy Garden / small kindnesses |
| 19 | 4 | Al-Qadr (97) | `qadr` | 5 | ✅ W4 | The Climb / blessed night |
| 20 | 4 | Al-'Alaq (96) | `alaq` | 19 | planned | Stanza Climb / Hira light |
| 21 | 4 | At-Tin (95) | `tin` | 8 | planned | Orchard terraces / holy mount |
| 22 | 4 | Ash-Sharh (94) | `sharh` | 8 | planned | Terrain-opening / relief |
| 23 | 4 | Ad-Duha (93) | `duha` | 11 | ✅ W6 | Cozy Garden / Qadr's dawn |
| 24 | 4 | Al-Lail (92) | `lail` | 21 | ✅ W7 | The Climb / braided ways |

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

### L. Al-Lail — The Night and the Two Ways (21 ayat, The Climb)
A long night ascent under stars (tall grid, h ≈ 60+), switchbacking upward,
the two-ways motif appearing as forks that always rejoin toward the light.
Built on the STANZA SHRINE (§1) with `stanzas: [4, 7, 5, 5]`, the surah's
own thematic movements:
1. **vv1–4, the oaths** — night, day, the making of two — "your striving
   is diverse": the trailhead rise, four gems in the dark.
2. **vv5–11, the two ways** — the giver eased, the withholder hardened:
   the long middle face, where the path forks and rejoins, seven gems.
3. **vv12–16, the guidance and the warning**: the high slab face, five.
4. **vv17–21, the giver pleased** — "and he will surely be pleased": the
   last rungs to the starred summit, five.
Between stanzas: small flat REST LEDGES (night camps — a lantern, a still
moment) so the climb breathes in the same maqati' as the campfire and
shrine. This world proves the long-surah machinery for all of Level 3.

### M. An-Nasr — The Help and the Opening (3 ayat)
A garden road approaches a great far gate that opens band by band as gems are
found; creatures stream homeward past the child as they near it.

### N. Al-Ma'un — The Small Kindnesses (7 ayat)
A humble-cozy garden where gems rest beside small good things — a bowl, a
doorstep, a well — and restoration blooms ahead of the child, reusing Duha's
bloom-ahead language.

### O. Al-Qari'ah — The Striking Day, the Scales (11 ayat)
A high windy moor where seed-lights drift like scattered moths; a great
balanced stone reads as scales on the skyline, visual only and never
interactive.

### P. Az-Zalzalah — The Earth Tells Its News (8 ayat)
Soft mounds open and offer their gems as the child nears; the tiniest seeds
sparkle brightest: "an atom's weight of good — he will see it."

### Q. Al-Bayyinah — The Clear Evidence (8 ayat)
A dusk lane lights lantern by lantern, each gem kindling the next stretch.

### R. Al-'Alaq — Read! (19 ayat, stanza Climb)
A stanza Climb (`stanzas: [5, 9, 5]`) rises to a cave high on the mountain;
the first light blooms inside the cave at the summit — the Hira homage,
wordless.

### S. At-Tin — The Fig and the Olive (8 ayat)
An orchard-terrace world with fig and olive props rises gently to a small
holy mount.

## 4. Waves (orchestrator plumbing first; playtest gates between)

Repo law: verdicts land in PLAN §9 before or with the fix — so no wave starts
until the previous wave's worlds have been played by the nieces. Build in
phase order so the earliest gap in the child's path always gets attention
first; one bad assumption copied into later recipes is the expensive failure.

> **NEXT NEW WORLD: AL-IKHLAS, ALONE.** It sits second in Phase 1 and is the
> only gap in the child's first month. Build its existing One Light sketch,
> playtest it, and record the verdict before opening Phase 2 work.

- **Phase 1 gate — Al-Ikhlas alone.** The meaningful-landmark idea carries
  real design risk and earns an isolated child playtest.
- **Phase 2A — An-Nasr, then Al-Masad.** Fill the first two gaps after built
  Kawthar; the opening gate and palm grove each get a verdict.
- **Phase 2B — Quraish, then Al-Fil.** The two-seasons road precedes the
  bird-flock world exactly as it does in the journey.
- **Phase 2C — Al-Humazah, then Al-'Asr.** Finish the momentum phase with
  gentle consequence imagery and gem-driven golden hour.
- **Phase 3A — At-Takathur, then Al-Qari'ah.** Prove occluder clarity before
  the windy moor; built Al-'Adiyat follows them in the journey.
- **Phase 3B — Az-Zalzalah, then Al-Bayyinah.** Finish the patience phase
  with offering earth and the lantern-lit clear lane.
- **Phase 4A — Al-Kafirun, then Al-Ma'un.** Build the reflection path before
  the small-kindness garden; built Qadr follows.
- **Phase 4B — Al-'Alaq alone.** Its 19-ayah stanza climb and Hira summit get
  an isolated long-surah gate.
- **Phase 4C — At-Tin, then Ash-Sharh.** Orchard terraces lead to the world
  of opening; built Duha and Lail complete the current ladder.

Every bullet above ends in a nieces' playtest and a verdict in PLAN §9
territory before the next begins. The current resequence-and-polish work also
stops after R2 for its own required playtest gate.

Every recipe brief carries the standing gates: `node v3/tools/check.mjs wN`
green, GRAMMARS invariants, disjoint file ownership (one agent = one
`wN-<key>.js`), Opus for creative recipe work, Sonnet/Haiku for mechanical.

## 5. Audit trail (what Wave 0 found, 2026-07-12)

- 2026-07-14 ladder extension: the new phases added An-Nasr and At-Tin to
  `js/data.js` from Quran Foundation/Quran.com Uthmani source text, and added
  the 64 missing Abdul Basit files for 95/96/98/99/101/107/110 from EveryAyah.
- `js/data.js` covered 96–108 + 112–114; missing 92/93/94/109/111 → Wave 0.1.
- `audio/basit/` held only the four built worlds (097/100/113/114) →
  Wave 0.2 fetches the rest; everyayah remains the online fallback.
- GRAMMARS.md still said "no memory stone" from the parked-v1 era, while W2
  places `b.memory(88, 113)` under the approved Remembering → corrected.
