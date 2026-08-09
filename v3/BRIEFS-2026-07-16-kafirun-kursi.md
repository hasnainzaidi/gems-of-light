# Kafirun & Ayat al-Kursi — Orchestrator Briefs (2026-07-16)

Two worlds join the journey: Al-Kafirun (WORLDS-PLAN §3.E, executed at last)
and AYAT AL-KURSI — the game's first PASSAGE world (one great ayah, 2:255,
memorized in its nine traditional maqati'; Hasnain placed it at the end of
Phase 1, after An-Nas). Standing laws and anti-template guardrails from
`BRIEFS-2026-07-15-momentum-patience.md` §0.1–0.3 apply verbatim to every
agent below; read them first.

## 1. The passage concept (already landed in data)

`js/data.js` now holds a pseudo-surah `id: 255` (slug `kursi`): nine
`verses`, each one maqta' of 2:255 with canonical Uthmani text (split at the
mushaf's own pause marks), joined transliteration, a kid meaning, and
`win: { basit: [from,to], alafasy: [from,to] }` — estimated, contiguous
audio windows into ONE recording per reciter
(`audio/basit/002255.mp3`, `audio/alafasy/002255.mp3`, both fetched). The
surah-level key is `passage: { surah: 2, ayah: 255, file: "002255" }`.
Windows are estimates (mora-weighted, like follow-estimated.js) — refine by
ear later; segment tolerance is far looser than word tolerance.

## 2. Wave P2 — plumbing (ONE agent; owns core/audio.js + worlds.js only)

**P2.1 — windowed segment playback.** In `v3/js/core/audio.js`: when the
surah entry carries `passage`, every verse resolves to the SAME file key
(`passage.file`) and `_verse` plays only that verse's window —
`win[GOL.V3.reciter]` (fall back to `win.basit` for an unknown reciter):
seek to `from` once the element is ready (iOS: seek after
loadedmetadata/canplay, re-try the seek on 'canplay' if it didn't stick),
finish at `to` (timeupdate watch + a guard timer of window length + slack;
'ended' also finishes). The remote-fallback path uses the same file key.
`preloadSurah` fetches the one passage file once. `playSurah` (campfire)
must chain the nine windows seamlessly — they are contiguous, so
verse-by-verse chaining IS the full recitation with its natural pauses;
verify the echo-breath "your turn" flow needs no change. Duck/serial/mute
behavior unchanged.

**P2.2 — the journey insert.** In `v3/js/worlds.js`: `WORLD_ORDER` gains
`'kursi'` right after `'nas'` (end of Phase 1). Add migration flag
`kursiInsert20260716` beside the existing `resequence20260714` pattern:
rerun the visited-worlds sweep under the new flag so no world a child has
visited ever locks (same body as `preserveVisitedWorlds`, new flag).

**P2.3 — collateral sweep (read, verify, report — expect zero changes).**
Confirm by reading that shrine/adventure/grownups/telemetry handle
`surahId: 255` generically (WORD_FOLLOW absent → whole-ayah glow fallback;
9 sockets is under the 12-socket shrine ceiling; store keys are plain ids).
Report anything that assumes id ≤ 114 instead of silently patching it.

Gate: full `node v3/tools/check.mjs` green, existing worlds byte-identical.
No world files, no checker changes, no git.

## 3. W18 — Al-Kafirun · "your own path" (6 ayat, guided path)

registerWorld(18), id 28, key `kafirun`, surahId 109, file
`v3/js/worlds/w18-kafirun.js`. Palette `bayyinah` (the luminous dusk lane),
**NO endPalette — deliberately**: the theology is steadfastness; this road
never becomes the other road. `w` 88, `h` 16, density 0.12.

**Soul (WORLDS-PLAN §3.E):** "for you is your way, for me is mine" — the
child walks a bright, lantern-lit road; beside it, in still water, runs the
road's dim reflection: a second way that is visibly there and unambiguously
not walkable.

- **The road:** a gently raised bank — long level stretches on a low
  terrace rhythm (slab/block risers of 1 row), lantern-lined (7 lanterns
  pacing the whole walk). This is the noor-lit way.
- **The still river + reflection is `drawLandmark`** (constant, 4-arg): a
  horizontal water band painted in the BACKGROUND (world rows ≈ 8.5–10.5 —
  up-screen of the walk row, reading as "across the water behind the
  road"). In it: dim INVERTED mirrors of the road's own features — 3–4
  upside-down lantern posts, a faint path line, two mirrored cypress
  silhouettes — cool-shifted, alpha ≈ 0.35, with a slow sine ripple so it
  reads as water, plus a brighter bank line separating it from the
  playfield. NO water tiles anywhere in this world — the river is pure
  painting, so it is unwalkable by construction (the playtest law's
  approved form for two-ways imagery).
- Gems 1–6 at x ≈ 12, 24, 37, 50, 63, 74 pacing the surah's parallel
  beats: odd gems on small lantern-pair rises (the lit way affirmed), even
  gems on flat road directly opposite a reflected feature (the other way
  passed, never taken).
- **Fireflies:** 3 butterflies with warm glow tones (colA `#FFE9A8`
  family) drifting the road ahead of the child; one roosting bird.
- Campfire x 80, door x 84; secret bounce x 44 mid-road, blossom above.
- Exemplars: `w15-asr.js` (restrained guided path), `w12-quraish.js` and
  `w13-fil.js` (drawLandmark composition).

## 4. W19 — Ayat al-Kursi · "the guarded night" (9 segments)

registerWorld(19), id 29, key `kursi`, surahId 255, file
`v3/js/worlds/w19-kursi.js`. Palette `falaqNoor` (the settled darkness),
endPalette `qadrEnd` — the night NEVER becomes day; it becomes a guarded,
peaceful, starred night. `w` 104, `h` 16, density 0.1.

**Soul:** the child walks the night utterly safe. Nothing here fears the
dark, because the Guardian never sleeps. Wordless, no figures, no throne
imagery — the Kursi is expressed only as vastness of light.

- **REQUIRED READING before building:** the `night` def key and darkness
  mask in adventure.js, and the lightbox flow (dsl `b.lightbox` +
  adventure's noor orb). Choose the night intensity the guiding-light
  passage proved out (study how the mask + aura + kindled seeds carry the
  seeing); the world must never be frustrating-dark.
- **THE VAST LIGHT is `drawLandmark(ctx, t, P, L, prog)`:** an aurora
  ribbon across the sky. At prog 0, a faint shimmer high over center; each
  gathered segment EXTENDS and brightens it; at prog 1 it arcs horizon to
  horizon over the entire world ("His Kursi encompasses the heavens and
  the earth") — 2–3 layered sine-wobbled bands of P.ray/P.gold alphas,
  breathing gently with t. Abstract light only. Behind props.
- **Lightboxes** at x ≈ 8, 38, 70 — one at the head of each dark stretch,
  kindling the seed trail onward.
- Gems 1–9 at x ≈ 10, 20, 31, 42, 52, 62, 72, 82, 92 over gentle ground:
  two low rises, one shallow dip, NO water (night and water don't mix for
  a five-year-old).
- **The guarded sleepers:** one sleeping tortoise (range ~0), two roosting
  birds on a low wall, pale moth-butterflies (`#EDE6C8` family) gathered
  near the lightbox glows. The world sleeps safely around the child.
- Campfire x 97, door x 101; secret bounce x 56, blossom above — a star
  within reach.
- Gems == the nine data segments; the checker validates the count against
  `verses.length` for surahId 255.
- Exemplars: `w17-qariah.js` (atmosphere via seeds), `w4-qadr.js` (night
  palette drift).

## 5. After the wave (orchestrator)

Script tags ×2 entry points (fresh ?v), full checker, browser pass with
REAL AUDIO on the segment windows (collect kursi gems, hear each maqta'
start/stop sanely; campfire = seamless full recitation), docs
(WORLDS-PLAN, GRAMMARS list, PLAN §10, BACKLOG), worktree commit off
origin/staging, PR, merge on green Checks.
