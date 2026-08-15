# iOS App Store Plan

Decision (2026-08-15): ship to the App Store EARLY and improve in
parallel — do not "perfect the PWA first." The game stays ONE codebase:
the same `v3/js` sources serve playgemsoflight.com, staging, and the
iOS app. iOS is a *shell* around the web game, never a fork.

## Why early is right for this project

- The slow, unpredictable step is administrative, not creative: Apple
  Developer Program enrollment (days–weeks of identity checks) and the
  first App Review (~1–2 days). After the first approval, updates are
  routine. Starting enrollment costs nothing and runs in parallel with
  world-building.
- Content is already past launch-worthy: 21 worlds, the Remembering,
  journey map, grown-ups page. The backlog (Kafirun rework, At-Tin
  playtest, voice input) ships as ordinary updates, exactly as it does
  to staging today.
- v3 is the easy case for review: pure client-side canvas, no backend,
  no ads, no analytics, no third-party SDKs, no data collection, and
  all recitation audio local. The hard cases (accounts, tracking,
  server dependencies) simply don't exist here.

## Wrap, don't rewrite

Capacitor shell (WKWebView) over the unchanged game. A Swift or Unity
rewrite would fork the game in two and make "improve in parallel"
impossible — the exact trap this plan exists to avoid. The shell also
buys real gameplay wins the PWA can't reach:

- `AVAudioSession` category `playback` → recitation survives the iPhone
  silent switch (today's PWA pain).
- Durable saves (see blocker 1).
- Haptics on gem collection (later, optional).
- True fullscreen, no Safari chrome, no install friction.

## The launch blockers (everything else is NOT one)

1. **Save durability — the one hard requirement.** WKWebView
   `localStorage` is evictable under storage pressure; a child losing
   their whole journey is the unrecoverable 1-star bug. The shell must
   mirror both save keys (`gemsOfLight.v3` + the config key) into
   Capacitor Preferences (native-backed) on every write and restore
   them before the game boots. Do not submit until an evicted-storage
   test passes: clear website data, relaunch, journey intact.
2. **Guideline 4.2 (minimum functionality).** A wrapper that loads a
   website gets rejected; a wrapper that bundles all assets and plays
   fully in AIRPLANE MODE reads as a real app and passes. Never point
   the shell at playgemsoflight.com.
3. **Bundle: Mishary only.** One reciter ships — Mishary Alafasy
   (~19 MB) — landing the app around 30 MB. Verdict extended to the
   whole game, not just iOS: Abdul Basit is removed entirely (see
   PLAN §10, 2026-08-15). Narration voice clips (`audio/voice/`) ship
   too.
4. **Kids Category.** We qualify cleanly (no data collection, no ads;
   the hold-the-star gate is already the right parental-gate instinct).
   Needs: a privacy policy URL on playgemsoflight.com and a "no data
   collected" App Privacy declaration. Opt in at launch — opting out
   later looks bad. DONE 2026-08-15: `privacy.html` at the repo root
   (self-contained, zero third-party requests), linked from the
   grown-ups page's top-right corner; the App Privacy URL is
   https://www.playgemsoflight.com/privacy.html — live once staging
   promotes to main.
5. **Price model.** Decide before launch (free is the working
   assumption); easy to set, awkward to reverse once families have it.

## The shell (all inside `ios-shell/`, zero risk to the game)

Self-contained Capacitor project — its own `package.json` and
`capacitor.config.json`; the repo root stays a plain static site.

- `ios-shell/tools/build-www.mjs` assembles `ios-shell/www/` from the
  repo: root `index.html` (transformed), `js/data.js`, `v3/js`,
  `v3/art`, `icons`, `assets`, `audio/alafasy`, `audio/voice`. It
  EXCLUDES v1, v2, concept-art, the map-artist pack, and sw.js (the
  service worker is the web's concern; Capacitor serves from disk).
- The transform rewrites the game's `<script src>` tags into an
  ordered manifest loaded by `native-bridge.js`: restore saves from
  Preferences FIRST, then inject the game scripts in order
  (`async=false`). The web's index.html is untouched — the builder
  reads it at build time, so new worlds/scripts flow through with no
  shell edits.
- Everything Xcode-dependent runs on the Mac mini:
  `cd ios-shell && npm install && node tools/build-www.mjs &&
  npx cap add ios && npx cap open ios`. `ios-shell/README.md` walks
  Hasnain through it plainly (git-novice friendly), including the
  audio-session playback config and the evicted-storage test.

## Sequence

1. **Now (Hasnain, ~15 min + waiting):** enroll in the Apple Developer
   Program ($99/yr) at developer.apple.com — just start it; the wait is
   the long pole. The Mac mini covers the Xcode requirement.
2. **This branch:** Mishary-only + the shell scaffold + save bridge
   (built and checked in cloud), PR → staging as usual.
3. **Mac mini session:** run the four commands above, build in Xcode,
   put it on the family iPhones via TestFlight *internal* testing (no
   full review needed) — real-device playtests of the native shell
   long before the store sees it.
4. **Submit** with current content: screenshots, privacy policy page,
   Kids Category, done. Then every staging improvement reaches iOS as
   a rebuild + update.

## What stays PWA-only / iOS-only

- Web keeps: service worker, install banner (`install.js` — the shell
  should suppress it inside Capacitor), everyayah.com remote audio
  fallback.
- iOS adds (later, in the shell only): haptics, App Store review
  prompt via the grown-ups page — never interrupting play.
