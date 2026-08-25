# Gems of Light V3 — Live Playtest Issues

Authoritative lightweight tracker for the current iOS playtest. Update status and verification here; do not create GitHub issues for this workstream.

## Release blocker

- [x] **P0 — Progression after Al-Fatiha:** Completing Surat al-Fatiha did not reveal the next path level on migrated iOS saves. Fixed by accepting legacy `levels[surahId].completed` evidence and idempotently backfilling the canonical Grand-Gem ledger; focused fresh/current/migrated-save coverage passes. Staging iPhone regression remains the release confirmation.
- [x] **P0 — Parent unlock equivalence:** Parent-opened worlds now use the standard gold map state, canonical Wisdom Tree completion and visible Grand Gem ceremony, and unlock the next built world without fabricating completion of skipped surahs. Focused/full checks and the updated standard-equivalence regression pass.

## Open

- [x] **P1 — Grown-ups splash star:** Raised and rebuilt as a high-contrast 50px circular control with a 72px safe-area-contained touch target and clearer label in portrait/landscape; focused/full checks pass.
- [x] **P1 — Grown-ups entry gesture:** Replaced hold-only entry with a direct tap on the enlarged star; removed hold state/progress visuals and added focused interaction coverage.
- [x] **P1 — Settings overlap:** Removed the title Settings gear/modal/state/input/rendering and retired stale showcase assertions; debug URL/config behavior remains and the full suite passes.
- [x] **P1 — Audio safe area:** Central mute-button geometry now clears the full top/right iPhone safe area across title, adventure, and shrine; focused/full checks pass.
- [x] **P1 — Parent page orientation:** Added scene-owned, safe-area-aware portrait layout with responsive header/footer, taller scroll rows, and verified portrait/landscape navigation and scrolling.
- [x] **P2 — Parent selector layout:** Tightened header spacing, balanced portrait gutters, and centered/capped the landscape selector width; portrait and full layout checks pass.
- [x] **P1 — Parent footer targets:** Rebuilt as separated 44px-high visible pill controls and raised the row 12px above the safe-area boundary in portrait and landscape; focused/full checks pass.
- [x] **P1 — Company/Privacy navigation:** Company/Privacy now open canonical HTTPS pages externally via Capacitor Browser when available or a synchronous noopener web fallback; Contact's working `mailto:` behavior is unchanged.
- [x] **P1 — Duplicate map narration:** Added a per-destination visit guard so iOS priming plus approach/landing/tap/keyboard produce exactly one announcement, while later deliberate revisits speak once again.
- [x] **P2 — Ikra background treatment:** Hill strips now render/cache at capped device pixel density with unchanged logical geometry and DPR-aware invalidation; focused DPR, Ikhlas, and full checks pass.
- [x] **P1 — Al-Fatiha final ayah highlight:** Fixed the underweighted six-count final cadence; `ٱلضَّآلِّينَ` now highlights from 7.90s through the 13.27s audio tail, with focused continuity and duration coverage.
- [x] **P2 — End-level gem drawer:** Re-anchored as a camera-independent, safe-area-aware viewport overlay in the quiet lane between touch controls; climb/home-indicator regression coverage and full checks pass.
- [x] **P2 — Al-Falaq terrain overlap:** Moved the offending bush one tile east, clearing the first-gem mound while preserving the open approach to the first slabs; narrow and full world checks pass.
- [x] **P1 — Global grounded flower blooms:** Enforced one base-soil-only rule across all 20 worlds for authored/decorated, restoration, bank, memory, and replay blooms; water, air, slabs, stepping stones, and box tops are rejected, including Quraysh's gem-one crossing.
- [x] **P1 — Map grown-up tap target:** Matched the neighboring back control with a 22px visible radius, 31px touch radius, and safe-area alignment; focused geometry/interaction coverage passes.
- [x] **P2 — An-Nas false-platform props:** Removed all five ambient wall/brick-pile props while preserving traversable stone terrain; targeted and full checks pass.
- [x] **P2 — An-Nas fountain/brick overlap:** Removed the fountain at x=51 and confirmed the overlapping brick pile at x=52 is absent; targeted and full checks pass.
- [x] **P1 — Al-Kawthar map entry delay:** Measured 2.85s of dead tail in the 4.13s title clip and added a Kawthar-only 1.75s dwell cap while preserving natural tail and healthy clip behavior; focused/map/full checks pass.
- [x] **P2 — Al-Kawthar upper fountain:** Removed only the first post–gem-three fountain at x46 and preserved the near-end x54 fountain with its flush terrain alignment; focused/global/full checks pass.
- [x] **P2 — Al-Kawthar flower density:** Removed only the authored x49 cluster after gem three, preserved x52 as one visual beat and left global flower generation unchanged; targeted/global/full checks pass.
- [x] **P2 — Al-Kawthar lower ellipse alignment:** Confirmed the ellipse is the preserved end fountain's lower tray; its anchor now compensates for the exact 13px overhang so the tray meets the terrain seam, with focused/full checks green.
- [x] **P1 — Ayat al-Kursi turtle moonwalk:** Replaced the zero-range in-place walk with a 24px patrol contained on the raised shoulder; targeted and full checks pass.
- [x] **P2 — Ayat al-Kursi bush overlap:** Moved the post–gem-three bush from x=44 to x=43 so its sprite sits within the raised platform; preserved other Kursi edits and passed targeted/full checks.
- [x] **P2 — Ayat al-Kursi final-bush crop:** Replaced the clipping variant-2 final-gem bush with clean variant 1; preserved other Kursi edits and passed targeted/full checks. This confirmed case remains evidence for the global audit.
- [x] **P1 — Cross-level campfire seed traps:** Audited all 20 worlds and enforced 156px terminal clearance (60px trigger + two 48px paces); fixed 15 recipes including Asr/Kursi, with focused/affected/full checks green.
- [x] **P2 — Surat al-Masad tree density:** Removed all four non-palm orchard trees, preserved all seven palms, the single Rahma blossom, and non-tree props; targeted/full checks pass.
- [x] **P1 — Surat al-Kafirun elevated false path:** Removed the entire elevated painted false-path/reflection system and its associated inverted props/shimmer while preserving the real route and collectibles; targeted/full checks pass.
- [x] **P1 — Global bush crop audit:** Fixed intrinsic sprite-canvas clipping with transparent horizontal padding and unchanged bottom-center anchors/scale; real-builder coverage verifies all 20 world seeds × three variants stay in bounds.
- [x] **P1 — Surat al-Quraysh raft readiness:** Added opt-in off-screen-right sleep/wake semantics: Quraysh's raft wakes at player x46, appears in ~0.76s, and reaches the near bank in ~3.33s; all other raft defaults remain unchanged.
- [x] **P1 — Surat al-Quraysh post–gem-four pause:** Measured and removed ~0.80s of terminal silence with an opt-in verse-4 playback cutoff at 12.69s; exactly-once callback/default behavior and full checks pass.
- [x] **P1 — Surat al-Quraysh duplicate turtle:** Removed the x86 clone and retained one grounded x84 tortoise with a bounded 46px patrol; shared translation/leg timing stays synchronized and full checks pass.
- [x] **P1 — Main-map global tree depth:** Added deterministic per-island back-to-front grounded-Y sorting for all 26 orchard trees; confirmed island-one/three inversions and full checks pass.
- [x] **P1 — Main-map island-two planter depth:** Rear in-ground planters are normalized before nearer same-island trees without changing tree order; focused SVG/map/full checks pass.
- [x] **P1 — At-Tin map entry delay:** Measured ~1.43s of dead tail and added a Tin-specific 1.75s entry ceiling alongside preserved Kawthar behavior; focused map/narration/full checks pass.
- [x] **P1 — At-Tin karaoke highlighting:** Added the missing complete eight-ayah Mishary timing table for surah 95; focused selection/word-order/continuity/tail/audio and full checks pass.
- [x] **P1 — Global fountain terrain integration:** Audited four fountains across all worlds and lifted each anchor by the renderer's exact 13px tray overhang; all trays now meet flat three-tile terrain support, with focused/full/all tests green.
- [x] **P1 — Global palm exclusivity:** Removed the sole non-Masad palm from Al-Fil and locked Masad's seven palms with a 20-world/procedural audit; full checks pass.
- [x] **P2 — Surat al-Fil elephant rock:** Removed the entire floating elephant-rock renderer and its exclusive artifacts/comments while preserving route/content; targeted/full checks pass.

## Verification notes

- Every code fix must pass `node tools/check.mjs` from this directory (or the narrow target supported by the checker) and receive an iPhone-focused regression check.
- The P0 progression fix must be verified from a fresh save and an existing/migrated save before release.

## Investigation notes (not requested fixes)

- Surat an-Nas contains a memory stone immediately before the campfire. Investigate and document what it does; do not change it solely because of this note.
- [x] Verified Surat al-Masad's Rahma count: the intended rule is one hidden blossom per world, and Masad has exactly one (`b.blossom(46, 7)`). The apparent second is a decorative `flowers` prop, so no blossom change is warranted.
- In Surat al-Qadr, clarify and document the purpose and visual intention of the apparent second horizon. Do not change it solely based on this note.
