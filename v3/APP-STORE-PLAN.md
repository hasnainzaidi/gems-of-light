# App Store Plan — shipping Gems of Light to iOS

Goal: put the existing v3 web game on the Apple App Store WITHOUT a Swift
rewrite. The game is a self-contained client-side canvas app (no backend,
no login, no payments, no analytics), so the path is a native WebView
wrapper around the current code, not a rewrite. Effort is ~1 focused week
for a first submission once the decisions below are made.

This doc owns the detail; BACKLOG carries one pointer line. Decisions and
verdicts land in PLAN §10 as they're taken.

## Decisions needed before Phase 2 (flag if you disagree)

1. **Packaging tool → Capacitor (recommended).** Wraps the current
   `index.html` + `v3/js/*` in a real Xcode project (a `WKWebView`),
   keeping 100% of the codebase. PWABuilder is faster but gives less
   control over the bundling Apple's 4.2 check cares about. Needs a Mac +
   Xcode (have) and an Apple Developer account ($99/yr).
2. **Listing → Education / Reference, 4+ vs. opt into the Kids Category.**
   Both are allowed. Kids Category = better parent discovery but stricter
   review; Education 4+ = lower friction. Engineering work is identical
   either way (Phase 1 makes both viable). Leaning Kids Category — it's
   where our buyers look. Decide before submission, not before build.
3. **iPhone-only (per PLAN §5) vs. also iPad.** iPhone-only apps still run
   on iPad in compatibility mode, so iPhone-only is fine for v1. Confirm.

## Phase 1 — Make the WEB build fully self-contained

Ships to STAGING first via the normal PR/Checks flow, benefits the web
game too (faster first paint, true offline), and is a prerequisite for
every packaging path. No native tooling yet.

- [x] **Wire in the self-hosted fonts.** `fonts/` (woff2s + `fonts.css`,
      now with `OFL.txt`) is committed and linked from `index.html` and
      `v3/index.html`; the Google-CDN links + `fonts.gstatic` preconnects
      are gone. Zero third-party origins at load.
- [x] **Drop the fonts.g special-case in `sw.js`.** Fonts are same-origin
      now, so the cache-first branch matches `.woff2` by path (immutable,
      like the mp3s) instead of the `fonts.g` hostname. `CACHE` bumped v30→v31.
- [~] **Finish local audio for BOTH reciters.** `audio/basit/` complete;
      `audio/alafasy/` is committed on the `momentum-patience-wave` branch
      (delivered by that PR, not this one). Once both are on staging, the
      default voice plays fully local with no remote fetch.
- [x] **Add an offline-only flag to kill the remote fallback in the app.**
      `GOL.OFFLINE_ONLY` (boot.js) gates the `el.src = rec.remote` fallback
      in audio.js: the web build keeps everyayah.com as a safety net, the
      native build sets `window.GOL_OFFLINE_ONLY = true` (and `?offline=1`
      forces it for testing) so no third-party fetch is possible.
- [x] **CI origin-gate.** `v3/tools/check-origins.mjs` fails the Checks
      workflow if either HTML entry loads any `http(s)://` resource
      (`<link>`/`<script>`/preconnect). The Google-Fonts CDN can't sneak
      back. Runtime audio streaming is code-gated separately by OFFLINE_ONLY.
- [ ] **Verify `map.js` asset load works from `file://`.** `ASSET_URL`
      (map.js:15) is same-origin and bundled; the `cache:'no-cache'` fetch
      (117) should resolve to the bundled SVG under the app scheme. Test
      in Phase 2; fall back to an inline/`XMLHttpRequest` read if the
      scheme rejects `no-cache`. (SW registration is already gated to
      `http(s):` only, so it correctly stays dormant under the app scheme.)

## Phase 2 — Capacitor native shell

- [ ] Scaffold a Capacitor project; point `webDir` at the built root so
      the SAME files ship (index.html, v3/, audio/, fonts/, icons/,
      map-artist-pack/). Preserve the directory layout the game's `../`
      relative paths expect (root-clamped — see index.html header comment).
- [ ] Native config: lock **landscape**, safe-area insets (viewport-fit=
      cover already set), status bar style, launch/splash screen, and the
      full app-icon set from `icons/`.
- [ ] Confirm iOS audio unlock still works under WKWebView — the
      gesture-based `unlock()` + silent-media kick in `audio.js` already
      handle the hard parts; just re-verify on device.
- [ ] Decide the service worker's role: in the wrapper, offline comes from
      the bundle, not the SW. Ensure the game runs with the SW
      unregistered/absent under the app scheme (network-first SW is a
      web-only concern; don't let it 404 assets in the app).
- [ ] Build, run on a real device, playtest a full world end to end.

## Phase 3 — Kids / privacy compliance

- [ ] Confirm zero data collection → privacy nutrition label
      "Data Not Collected." (No accounts, no analytics, localStorage save
      is device-local — none of it leaves the phone.)
- [ ] Parental gate: the grown-ups page (hold-the-star) already is one;
      route any outbound link (privacy policy, support) behind it or omit.
- [ ] Confirm no third-party SDKs are linked by Capacitor plugins.
- [ ] Host a privacy policy page (even "we collect nothing" needs a URL)
      and a support URL.
- [ ] Set age rating 4+; finalize the Decision-1/#2 category choice.

## Phase 4 — App Store Connect submission

- [ ] Apple Developer account ($99/yr); signing certs + provisioning.
- [ ] App icon + screenshots (iPhone; iPad if Decision 3 says so),
      description, keywords, category, age-rating questionnaire.
- [ ] Guideline 4.2 framing: emphasize interactive gameplay, bundled
      content, full offline play — not a website wrapper.
- [ ] Submit; address review notes; log the verdict in PLAN §10.

## Why this is low-risk

- No backend, no auth, no payments, no tracking to build or defend.
- The two compliance blockers (Google Fonts CDN, everyayah.com fallback)
  are already half-solved: fonts are downloaded, second reciter is
  downloading. Phase 1 is wiring, not invention.
- The "feels native" work is done: standalone display, landscape lock,
  viewport-fit, no-select/callout, iOS audio unlock.
