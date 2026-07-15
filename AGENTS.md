# Gems of Light — Project Notes (all agent tools)

A gentle platformer for children (5–8) that teaches Quran memorization.
This file onboards a fresh session in ANY agent tool — Codex reads it
natively; Claude Code imports it via CLAUDE.md (which is only a shim —
edit THIS file, never the shim). Read it, then the docs below. Check
`git log` / `git status` first — this file describes conventions, not
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
- Claude Code sessions also get auto-loaded memory (user profile, wave
  workflow, pointers) supplementing this; other tools rely on this file
  and the docs above alone.

## Working rules (user-approved; keep them)

- **Git — prod/staging model (since 2026-07-15):** `main` = PROD
  (playgemsoflight.com; push deploys via the Pages workflow; bump
  `CACHE` in `sw.js` when it changes). `staging` = the always-playable
  integration branch (renamed from `v3-prototypes`), auto-deployed by
  Cloudflare Pages to the staging URL Hasnain playtests on his phone.
  ALL work lands on staging first — via PRs with the Checks workflow
  green (`.github/workflows/checks.yml` runs `node v3/tools/check.mjs`);
  never leave staging broken. Promotion = merge staging → main after
  Hasnain approves on his phone (merge only what a child could play
  today). Cloud sessions target STAGING, never main directly; `git
  fetch origin` before any reconcile and diff against origin/staging.
  One commit per finished idea. The user is a git novice — drive git
  for him, explain plainly. Parallel sessions stage files concurrently —
  commit with explicit pathspecs (`git commit -- <paths>`), never a
  bare commit after `git add`.
- **Waves of parallel agents with disjoint file ownership.** Orchestrator
  does shared plumbing first; follow-ups go to the same agent via
  SendMessage. Every level-building brief requires
  `node v3/tools/check.mjs <target>` green.
- **Model selection: pay for judgment, not keystrokes.** Strongest model
  (Fable-class) for INVENTION and ORCHESTRATION — blank-page design,
  briefs, judging, pedagogy, merges (errors at the top multiply
  downward). Opus-class for EXECUTION against a locked spec — building
  from finished briefs, punch lists, contract work. Cheapest for
  MECHANICAL machine-verifiable tasks — bumps, pipelines, checker runs.
  Tie-breakers: if a machine catches the mistake, drop a tier; if only
  Hasnain's eyes catch it, or the mistake is silent-and-compounding,
  stay high. When a workstream shifts invention→execution, run a
  one-round same-prompt bake-off before assuming the tier still needs
  to be top.
- **Design philosophy is enforced:** no text instruction, no quizzes, no
  punishment; one loop; ordered collection; wordless visual language.
  Playtest verdicts land in PLAN §9 before/with the fix.

## Dev mechanics

- Phone playtests happen on STAGING: https://gems-of-light.pages.dev/
  (Cloudflare Pages, deploys `staging` on every push; build strips
  files >25 MiB — Pages' limit — so the v2 lab's whisper model is
  absent there). Separate origin from prod, so it has its own save +
  service worker.
- Local server (live co-design sessions only): `python3 -m http.server
  8437` at repo root; phone at
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
- **2026-07-12 (Claude Code + Codex):** v3 built end-to-end on
  `v3-prototypes` — ten prototype worlds by parallel agents, playtests
  distilled into the game (thumbstick+jump, gem band, ordered collection,
  echo/secrets/landmark parked), worlds 1–4 (Falaq/Nas/Adiyat/Qadr), reciter
  registry, journey tracker + grown-ups page, shrine knowledge telemetry,
  return loop (replay growth, missing-you glow), the Remembering
  (dream-shrine + moons), campfire echo-breath.
- **2026-07-14/15:** journey resequenced + all eight worlds polished
  (Codex, `v3/BRIEFS-2026-07-14-resequence-and-polish.md`); mobile
  camera/controls/gem-band fixes shipped via cloud sessions; the painted
  journey map program ran its verdict rounds (champion `drafts/r3`,
  living harness `?lab=19` with the map↔world toggle) — see
  `v3/map-artist-pack/drafts/r1/LOG.md`. Full trail: `git log`, PLAN §10.
- **2026-07-15 (infra):** prod/staging split adopted — `v3-prototypes`
  renamed `staging`, Checks CI added (checker green gates every PR),
  Cloudflare Pages serves staging on its own origin; promotion is
  merge staging → main. See the Git working rule above.
