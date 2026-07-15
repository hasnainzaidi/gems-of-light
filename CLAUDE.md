# Gems of Light — Project Notes for Claude Code

A gentle platformer for children (5–8) that teaches Quran memorization.
This file onboards a fresh session (any model). Read it, then the docs below.
Check `git log` / `git status` first — this file describes conventions, not
current state.

## The three eras in this repo

- **v3 IS THE ROOT GAME (since 2026-07-12):** root `index.html` loads
  `v3/js/*` — playgemsoflight.com serves v3; the same build also answers at
  `/v3/` (the dev URL). Root `sw.js` (network-first; mp3s cache-first) and
  root `manifest.webmanifest` belong to v3.
- **v1** (`v1/index.html` + engine files still at root `js/`) — the original
  game, ARCHIVED at /v1/ (a `<base href="../">` page; its save untouched).
  Root `js/data.js` is SHARED v1↔v3 — additive changes only.
- **v2** (`v2/`) — earlier standalone level prototypes + the recitation-
  checker lab (`RECITATION-CHECKER-PLAN.md`, `qrc-lab.html`) — relevant when
  voice input work begins. Archived in place at /v2/.
- **v3** (`v3/`) — THE ACTIVE GAME. One core loop per world/surah:
  ordered gem collection → earned campfire (full recitation, echo-breaths) →
  shrine (one-socket recall) → Grand Gem → next world unlocks. Plus: the
  Remembering (dream-shrine review of old surahs, Remembering Moons),
  journey tracker, grown-ups page (hold the star), tuning panel, reciter
  registry (Abdul Basit default).

## Read before acting (v3 work)

- `v3/BACKLOG.md` — the shared forward-looking list (Now/Next/Later),
  one line per item pointing at its owning doc. Pick from NOW; log the
  verdict in PLAN §10 or the workstream log, then delete the line.
- `v3/PLAN.md` — every design decision and playtest verdict (§9), the
  Remembering spec, knowledge telemetry rationale (§7). THE source of truth.
- `v3/GRAMMARS.md` — the three world-building grammars + gotchas; new surah
  worlds are one recipe file each (`v3/js/worlds/wN-<key>.js`).
- `v3/reviews/` — per-prototype playtest notes.
- Auto-loaded memory (user profile, wave workflow, pointers) supplements this.

## Working rules (user-approved; keep them)

- **Git:** `main` = live site (push deploys via Pages; bump `CACHE` in
  `sw.js` when it changes). `v3-prototypes` = all v3 work. One commit per
  finished idea. Merge to main only what a child could play today. The user
  is a git novice — drive git for him, explain plainly.
- **Waves of parallel agents with disjoint file ownership.** Orchestrator
  does shared plumbing first; follow-ups go to the same agent via
  SendMessage. Opus for creative work, Sonnet/Haiku for mechanical. Every
  level-building brief requires `node v3/tools/check.mjs <target>` green.
- **Design philosophy is enforced:** no text instruction, no quizzes, no
  punishment; one loop; ordered collection; wordless visual language.
  Playtest verdicts land in PLAN §9 before/with the fix.

## Dev mechanics

- Server: `python3 -m http.server 8437` at repo root; phone tests at
  http://hasnains-mac-mini.local:8437/v3/ (landscape).
- Script tags carry `?v=NNN` — bump on JS changes. Root `sw.js` is
  network-first for `/v3/`.
- `?debug=1`: prototype shelf on title, hotkeys (G collect/place, E warp,
  M title), fast fades. Debug shares the real `gemsOfLight.v3` save — reset
  via `GOL.store.reset()` before real playtests if tests dirtied it.
- Embedded browser pane only pumps rAF during interactions — drive scenes
  manually (`enter/update/draw` loops in JS) to verify; not a game bug.

## Session log (condensed)

- **2026-07-10/11 (Cowork):** v1 built and shipped (17 gardens, modes, map);
  v2 level prototypes; iOS audio playbook; domain setup.
- **2026-07-12 (Claude Code):** v3 built end-to-end on `v3-prototypes` —
  ten prototype worlds by parallel agents, playtests distilled into the
  game (thumbstick+jump, gem band, ordered collection, echo/secrets/landmark
  parked), worlds 1–4 (Falaq/Nas/Adiyat/Qadr), reciter registry, journey
  tracker + grown-ups page, shrine knowledge telemetry, return loop
  (replay growth, missing-you glow), the Remembering (dream-shrine + moons),
  campfire echo-breath. See `git log` and PLAN §9 for the full trail.
