# Showcase Mode — implementation plan

Status: initial runtime merged to `staging` on 2026-07-16; secular onboarding
and PWA setup follow-up on `codex/showcase-onboarding`.

## Goal

Add a religion-neutral, shareable Showcase experience without changing the
default Quran-learning game. Showcase keeps the real worlds, movement,
ordered gems, restoration, campfire, map, and return celebrations. It removes
recitation, ayah script, the shrine/Remembering, progression locks, grown-ups
controls, and developer chrome from the guest flow. It retains the parent porch
and optional installation journey with secular copy and a Showcase-specific PWA
launch target.

The first delivery is `?showcase=1` on the existing staging entry. A dedicated
`/showcase/` entry with neutral social metadata is a follow-up after the runtime
experience passes phone review.

## Non-negotiable safety contracts

1. With no `showcase=1` query, behavior and save data remain byte-for-byte
   compatible with the current staging game.
2. Showcase uses `gemsOfLight.v3.showcase`; it never reads or writes
   `gemsOfLight.v3` or `gemsOfLight.v3cfg`.
3. Recitation is blocked centrally in Showcase, not merely hidden in one scene.
4. Every built world is open in Showcase, but this never fabricates progress in
   the learning save.
5. Completing a Showcase world ends at its campfire/return portal and never
   enters the shrine or Remembering.
6. `node v3/tools/check.mjs` remains green, including entry parity and existing
   onboarding contracts.
7. Installing from Showcase launches back into `?showcase=1`; it must never
   silently open the Quran-learning profile.

## Delegation waves

### Wave 0 — orchestrator-owned shared plumbing

Files: `js/core/engine.js`, `js/core/audio.js`, `js/boot.js`, `js/worlds.js`.

- Define one immutable experience profile selected by `?showcase=1`.
- Select isolated save/config keys before storage loads.
- Add central recitation/preload guards.
- Expose all built worlds only for Showcase. The initial delivery bypassed the
  grown-up porch; the follow-up restores it with neutral copy and isolated
  one-time migration state.
- Keep the normal experience as the default branch through every decision.

Wave 0 lands before scene agents begin, so they consume one stable contract.

### Wave 1 — parallel, disjoint scene work

**Adventure ending agent — `js/adventure.js` only**

- Keep normal collection/recitation/campfire/shrine flow unchanged.
- In Showcase: collect with chime/restoration only; campfire becomes a short
  ambience-led World Gem ceremony; the existing arch returns to the map,
  records Showcase-only completion, and never calls the shrine.
- Suppress Arabic follow/script visuals in Showcase.

**Guest surfaces agent — `js/ui.js` and `js/map.js` only**

- Give Showcase neutral title treatment and no Arabic subtitle.
- Hide tuning, grown-ups, Remembering Moons, and debug chrome from the guest
  flow. Installation remains available through the neutral parent porch.
- Make all regions and built-world doors navigable; preserve map bloom/arrival
  feedback from the isolated Showcase completion state.

**Contract-test agent — `tools/test-showcase-contract.mjs` and checker wiring**

- Assert isolated keys, central audio guards, secular porch wiring, all-open
  access, shrine bypass, neutral-surface gates, and the dedicated manifest
  launch target.
- Add the test to the full checker without weakening existing tests.

### Wave 2 — orchestrator integration

- Review each patch against this contract and reconcile only overlapping shared
  assumptions, not agent-owned implementation details.
- Run syntax checks, `node v3/tools/check.mjs`, the focused Showcase contract,
  and existing progression/shrine tests.
- Exercise both `?showcase=1` and ordinary mode in the browser or equivalent
  scene harness, including a complete world return.
- Log the resulting verdict in `PLAN.md` section 10 and remove any temporary
  workstream backlog line if one is added.

## Commit and delivery

One finished-idea commit with explicit pathspecs. Push the feature branch and
open a PR to `staging` only after all checks pass. Phone review happens on the
staging deployment; promotion to `main` remains a separate user-approved step.
