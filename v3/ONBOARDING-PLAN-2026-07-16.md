# Delightful Onboarding — Execution Plan

Status: approved direction; implementation branch
`codex/delightful-onboarding`.

## Product contract

Installation is not onboarding. A new family moves through one canonical
journey:

`welcome → playable explanation → make-it-theirs → handoff → child welcome`

The first three stages belong to a grown-up and may use concise text. After
handoff, the experience returns to the game's wordless child language.
Platform differences may change only the contents of the make-it-theirs card;
they must never reorder or replace stages.

## State contract

`GOL.store.data.onboarding` is additive and versioned:

```js
{
  v: 1,
  parentComplete: false,
  childStarted: false
}
```

- Preview activity never writes level, grand-gem, telemetry, settings, or
  journey progress.
- Completing handoff sets `parentComplete`.
- Entering the real first journey sets `childStarted`.
- Existing saves with any journey progress bypass the grown-up porch.
- `?onboarding=1` forces the porch for visual QA without clearing progress.
- Installation is optional. “Not now” advances to handoff, and does not cause a
  second prompt in the same visit.

## Scene and API contract

### `onboarding` scene

Owns the canonical grown-up shell and these internal stages:

1. `welcome`: postcard, one-sentence promise, a living garden vignette, and one
   required **See how it works** action.
2. `preview`: the parent performs the real Explore / Listen / Remember loop;
   hearing the ayah here proves sound without a separate checkpoint.
3. `setup`: the same card shell for every platform; uses the existing platform
   detector and illustrated step language; **Not now** is always available.
4. `handoff`: “Their garden is ready”; animated rotate-and-pass invitation.

Public hooks:

- `GOL.onboarding.open(stage?)`
- `GOL.onboarding.previewComplete()`
- `GOL.onboarding.finishHandoff()`

### `parentPreview` scene

A short, non-saving micro-garden built from the real engine's lightling, gem,
recitation, bloom, and particle language. It teaches by response, not a video
or a settings form. After the first gem settles, a grown-up card offers
**Continue exploring** and **Make it theirs**. Home/back returns to the
porch. It must never call `GOL.store.save()` or mutate `GOL.store.data`.

### Child handoff

- Handoff enters the postcard in child mode, not the grown-up porch.
- Child mode contains no install CTA, tuning gear, diagnostics, or explanatory
  copy.
- The first map entrance gives the first star exclusive visual priority: Noor
  traces the path once; the first valid tap/forward action visibly walks and
  enters the world.

## Parallel work ownership

### Wave 1 — independent implementation

1. **Grown-up porch** — owns `js/onboarding.js` only.
2. **Non-saving preview** — owns `js/parent-preview.js` only.
3. **Child handoff polish** — owns `js/ui.js` and `js/map.js` only.
4. **Orchestrator plumbing** — owns `js/boot.js`, both entry HTML files,
   automated tests, this plan, `PLAN.md`, and final integration.

Agents must not edit files outside their ownership. Every scene must use the
existing canvas helpers, safe areas, postcard/garden palette, and current
lightling anatomy. No old parchment/tutorial visual generation may return.

### Wave 2 — integration and verdict

- Wire scene order and cache-busting in both entry points.
- Add state-routing and preview-isolation tests.
- Run `node v3/tools/check.mjs` and syntax checks.
- Browser-test 390×844 and 844×390 for iOS Safari, iOS in-app, Android,
  desktop, already-installed, Not now, reload/resume, and returning-save paths.
- Record the verdict in `PLAN.md` §10.
- One commit per finished idea; open a PR to `staging` only when the required
  checker and deployed preview are green.

## Acceptance criteria

- A new visitor never sees an install banner or settings control before value.
- The parent can understand the loop before installing.
- Preview actions cannot consume the child's first discovery.
- Every platform traverses the same ordered stages.
- Text never overlaps at 390×844, 844×390, or safe-area edges.
- Declining installation remains respected for the visit.
- The final adult action becomes a visible handoff, then all adult copy leaves.
- The first child action always produces an immediate visible response.
- Existing saves continue directly to their journey.
- No console warnings/errors; root and `/v3/` load the same build.
