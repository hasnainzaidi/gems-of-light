# Gems of Light — iOS-First Launch Readiness

Status: active launch program, started 2026-08-23. The iOS app is the release
priority; the PWA remains the same game code and must not regress. Detailed
findings live here. `BACKLOG.md` carries only short pointers to unresolved
items, and accepted product verdicts land in `PLAN.md` §10.

## 1. Release objective

Reach these two milestones in order:

1. **TestFlight-ready:** a signed build installs on a physical iPhone, launches
   and completes the core loop in airplane mode, keeps recitation audible with
   the silent switch on, survives interruption and storage-eviction tests, and
   restores progress after force quit.
2. **App Store “Prepare for Submission”:** the App Store Connect record exists
   for `com.playgemsoflight.app`, the build and store metadata are present, Kids
   Category and privacy answers are truthful, external links are behind the
   parental gate, and the review notes explain the offline/no-account design.

Do not promote to `main` or submit for App Review merely because an archive
builds. A child must be able to finish the complete loop on a real iPhone.

## 2. Severity and ship policy

| Level | Meaning | Ship policy |
|---|---|---|
| S0 | Crash, data loss, wrong/missing Qur'an content, security/privacy breach, or core loop cannot complete | Blocks TestFlight |
| S1 | Duplicate/skipped/overlapping recitation, repeatable progression failure, native offline failure, unusable first run, or likely App Review rejection | Blocks App Store candidate; normally blocks TestFlight family rollout |
| S2 | Serious confusion, accessibility gap, layout defect, or interruption/recovery friction with a safe workaround | Fix before submission when reproducible; otherwise carry with named owner and manual gate |
| S3 | Polish, dormant code, low-frequency cosmetic issue, or post-launch enhancement | May ship after explicit triage |

Every issue needs: audience, platform, clean/returning save, exact starting
state, reproduction steps, expected/actual result, severity, evidence, owner,
and verification status. “Feels buggy” is a signal to investigate, not a
backlog item by itself.

## 3. Audience and workflow map

### A. First-time grown-up — iOS app

`cold launch → grown-up porch → playable preview → journey placement → native
setup card suppressed/appropriate → handoff → child postcard → journey map`

Check:

- The app never asks the parent to install the already-installed native app.
- The preview produces sound from a user gesture but writes no journey,
  learning, reciter, Grand Gem, or shrine progress.
- Journey placement blooms only earlier islands; it does not fabricate earned
  Grand Gems, listens, recall attempts, or Remembering moons.
- Portrait explains rotation; landscape uses Dynamic Island and home-indicator
  safe areas with no clipped action.
- The handoff removes grown-up copy and gives the first star sole priority.
- Backgrounding or rotating at every stage resumes the same stage once.

### B. First-time grown-up — Safari/PWA

`browser visit → porch/preview/placement → full-screen invitation → handoff →
child play → later browser relaunch checkpoint → installed-PWA relaunch`

Check all iOS workflow expectations plus:

- “Remind me later” continues now and is respected for the visit.
- A later uninstalled browser visit may ask again; a true standalone PWA does
  not.
- Service-worker update and stale-cache behavior never mix script versions.
- The game remains usable after the first complete cache in airplane mode;
  uncached failure is gentle and honest.

### C. New/pre-reader child

`postcard → first-star invitation → map walk/dwell → world name → ordered gems
→ held ayah recitation → campfire full surah → ember door → shrine one-socket
recall → Grand Gem → map celebration/next world`

Check:

- Touch-only play at iPhone landscape sizes; no reading is required.
- Only the next gem collects; a later gem cannot corrupt order.
- One collection causes exactly one ayah, with no overlap from names, ambience,
  echo, SFX, campfire, or shrine.
- Rapid tap-to-drag in the shrine is one gesture and one recitation.
- Help after misses is gentle and cannot place the wrong gem.
- Leaving, pausing, rotating, locking, answering a call, invoking Siri, opening
  Control Center, or changing audio route never advances a verse while hidden.
- The Grand Gem and next world save before any celebratory transition can be
  interrupted.

### D. Returning child

`cold/resumed launch → restored map position and settings → incomplete or next
world → replay growth → core loop`

Check:

- Native Preferences restores both save keys before the first game script.
- Unknown old reciter values fall back silently to Mishary.
- A short-world force quit may restart the current walk, but never corrupts the
  journey; long-world camp checkpoints restore only banked progress.
- Map migration never relocks a visited world.
- App upgrade, PWA service-worker update, and storage pressure preserve progress.

### E. Child using the Remembering

`map fountain/moon → neediest completed surah → dream shrine → one-socket
recall → moon growth → return`

Check:

- Review never fabricates a new Grand Gem or unlocks the main journey.
- Once-per-day/reward rules survive clock/day and background transitions.
- Interruption during placement or its recitation resumes once with no overlap.
- Exiting through every route returns to the same sensible map/world state.

### F. Child in long worlds and replays

`ordered segment → camp shrine/checkpoint → resumed segment → final campfire →
shrine`, plus `completed-world replay → environmental growth → return`

Check W7 and other long worlds specifically: checkpoint saves, no gem duplication,
no replay telemetry inflation, no clipped ayah, no unreachable post-resume route,
and a force quit never loses already-banked checkpoints.

### G. Returning grown-up / parent mode

`hold star → progress overview → practice-open/close surah → sound/settings →
install help on web only → company/privacy/contact/terms → return`

Check:

- The hold gate is deliberate, reachable, and does not open on an ordinary tap.
- Parent-opened practice is visibly and structurally separate from child-earned
  progression.
- Labels explain local-only progress and destructive reset before action.
- Native app hides web-install actions.
- Every external link is inside this parental area, opens the intended first-
  party HTTPS page, and has an obvious path back to the game.
- Text, links, focus order, contrast, touch targets, VoiceOver names, Dynamic
  Type/zoom behavior where applicable, and landscape scrolling are usable.

### H. App Review / privacy reviewer

`install → airplane-mode launch → complete sample loop → parental gate → privacy
and company identity → data/privacy declarations → review notes`

Check:

- Bundle contains all runtime scripts, the production journey map, 194 Mishary
  recitations, and approved narration; no Basit, drafts, service worker, remote
  dependency, analytics, ads, accounts, purchases, or tracking SDKs.
- App behavior matches “Data Not Collected” and the public privacy policy.
- Kids Category external links and settings are behind a parental gate.
- Review notes explain that the app is a fully bundled game, where the grown-up
  gate lives, and how to reach the core loop without an account.

### I. Internal tester / release operator

`sync bundle → automated checks → unsigned simulator build → signed physical
device build → archive/validate → upload → processing/compliance → internal
TestFlight group → smoke test exact build`

Check:

- `npm run check`, `node v3/tools/check.mjs`, all launch regression tests, root
  and `/v3/` entry parity, and a clean Xcode build pass from the exact commit.
- Marketing version and build number are intentionally incremented.
- Archive uses `com.playgemsoflight.app`, the correct Apple team, iPhone-only
  landscape orientations, production icon/launch art, and no debug flags.
- The exact uploaded build is tested from TestFlight, not only from Xcode.

## 4. Cross-cutting platform matrix

Run each critical workflow on:

| Surface | Minimum coverage |
|---|---|
| iPhone 16/17 physical, native | Clean install, upgrade, airplane cold launch, silent switch, lock/unlock, call/Siri, Bluetooth route, force quit, storage eviction |
| iPhone 17 Pro Simulator | Clean onboarding, both orientations, safe areas, core loop via debug helpers, legal links, offline bundle/network denial, console/build logs |
| iOS Safari | First browser visit, install invitation, refresh, background/resume, service-worker update, offline after cache |
| Installed iOS PWA | Standalone routing, no install prompt, background/resume, viewport repair, offline, save migration |
| Desktop browser | Keyboard/focus smoke test, legal pages, root `/` versus `/v3/` parity; not a release-design target |

For native and PWA, repeat at least one run with a clean save and one with a
realistic old save containing progress, onboarding state, an unknown reciter,
and parent-opened practice worlds.

## 5. Release gates

### Automated gate

- [ ] `node v3/tools/check.mjs`
- [ ] every `v3/tools/test-*.mjs`
- [ ] `cd ios-shell && npm run check`
- [ ] clean Capacitor sync and unsigned simulator/generic-device Xcode build
- [ ] all 194 Mishary MP3s present, decodable, and mapped to shipped content
- [ ] no native runtime URL depends on the network
- [ ] root and `/v3/` load identical ordered script manifests and bumped versions

### Simulator gate

- [ ] native cold boot reaches onboarding/map with no loader stall
- [ ] first-time parent and child handoff in portrait and landscape
- [ ] one complete world through Grand Gem
- [ ] parent gate and all first-party legal links
- [ ] suspend/resume during gem, campfire gap, shrine, and map-name audio
- [ ] network denied after install; all core assets and audio still work
- [ ] no console errors, layout bands, clipped safe-area controls, or duplicate loops

### Physical-iPhone gate

- [ ] airplane-mode cold launch and complete loop
- [ ] Ring/Silent switch still permits recitation
- [ ] Control Center, lock/unlock, incoming call/Siri, and AirPods/Bluetooth route
      changes resume the same ayah exactly once
- [ ] eviction simulation wipes WKWebView data and native Preferences restores
      journey/config before boot
- [ ] touch ergonomics and Dynamic Island/home-indicator clearances
- [ ] TestFlight install/update retains the real family save

### Store gate

- [ ] paid Apple Developer membership active; current agreements accepted by the
      account holder
- [ ] App Store Connect app record created for `com.playgemsoflight.app`
- [ ] price decision recorded (working assumption: free)
- [ ] Kids Category age band chosen deliberately (product target: 6–8)
- [ ] privacy answer “Data Not Collected” reverified against the final binary
- [ ] privacy URL live on production and all first-party identity/contact links work
- [ ] screenshots from the actual candidate build, metadata, review notes, support
      URL, export-compliance answer, content rights, and age rating complete
- [ ] signed provenance/permission file covers commercial offline redistribution
      of every Mishary recording and modification of the ten edited recordings
- [ ] Quran text, transliteration, meaning, narration, font, code, and art sources
      have a release manifest with the applicable permission and file hashes
- [ ] processed build assigned to an internal TestFlight group and smoke-tested

## 6. Active findings and fixes

| ID | Severity | Surface/workflow | Finding | Status/evidence |
|---|---:|---|---|---|
| LR-001 | S1 | Native + PWA, shrine | A touch that began as a tap and crossed the drag threshold could call `playVerse` again, restarting/duplicating the ayah. | Fixed in `fa7fd82`; regression `test-launch-child-shrine-touch-audio.mjs` green. |
| LR-002 | S1 | Native + PWA, background/resume | Wall-clock verse/fallback and between-verse timers could expire while suspended, then skip or advance recitation on foreground. | Fixed in `3374d36`; regression `test-launch-audio-lifecycle.mjs` green. |
| LR-003 | S1 manual gate | Physical iPhone audio | Call/Siri/Control Center and Bluetooth route changes cannot be proven in Simulator; same ayah must resume once without overlap. | Open; physical-device gate. |
| LR-004 | S2 | Returning child | Force quit during a short-world walk restarts that walk's unbanked gems. Data remains consistent, but longer walks may feel frustrating. | Open product/UX playtest; long-world checkpoints remain durable by design. |
| LR-005 | S2 | PWA offline | A local/remote ayah unavailable on an incompletely cached PWA advances gently after timeout. | Open manual failure-mode playtest; native bundle is complete. |
| LR-006 | S2 | Pause semantics | Pause overlay pauses gameplay but intentionally does not stop an already-playing Qur'an track. | Open product verdict/manual child test. |
| LR-007 | S2 | Audio corpus | File integrity does not prove clean cuts, silence, loudness, or pronunciation for all 194 Mishary clips. | Open ear audit; prioritize Kursi `255001`–`255009` and longest surahs. |
| LR-008 | S2 | Returning/configured families | Ambient echo lost its playtest but saved `near/world` values could persist and recreate apparently random/restarted audio. | Fixed in `ae2e101`: production forces and persists `off`; explicit debug/lab experiments remain available. |
| LR-009 | S1 manual gate | Native durable save | Automated bridge test passes, but WKWebView eviction → Preferences restore has not yet been reconfirmed on the current physical build. | Open; mandatory before TestFlight family rollout. |
| LR-010 | S1 external gate | App Store Connect | App record, agreements, team membership, signing, and paid-program state require authenticated account inspection. | Open; Apple sign-in required. |
| LR-011 | S1 | Native privacy/offline | Generated native HTML retained Google Fonts requests and native audio code retained the EveryAyah web fallback, contradicting the fully offline/“Data Not Collected” release claim. | Fixed in `97e53d1`: native generation strips remote resources/fallbacks and unused social assets, prunes dormant text fields, and fails preflight if they return. |
| LR-012 | S1 | First-time parent, native | Native onboarding offered “Remind me later” even though the app was already installed. | Fixed in `4971795`; focused and full contracts green. |
| LR-013 | S1 | Parent preview | “Continue exploring” could replay the second ayah indefinitely instead of converging on handoff. | Fixed in `4971795`: at most two distinct passes, then one handoff action. |
| LR-014 | S2 | Parent/onboarding accessibility | Canvas-only onboarding, preview, and grown-ups controls were absent from the accessibility tree and keyboard/Switch activation. | Fixed in `4971795` with scene-scoped semantic controls and live status; physical VoiceOver/Switch gate remains. |
| LR-015 | S1 external/store gate | Content rights | The repo has no commercial offline-redistribution grant for bundled Alafasy recordings; the nine Kursi cuts and trimmed `095008` also require explicit adaptation rights. Public download availability is not a license. | **Open; blocks App Store submission.** Obtain rights-holder documentation or replace the corpus; preserve correspondence, source files, edit manifest, and hashes. |
| LR-016 | S1 external/store gate | Text/narration provenance | Permanently bundled QDC Arabic/transliteration, unused Clear Quran-derived fields, and ElevenLabs title clips lack a complete commercial/offline evidence file. | Open. Prune unused native fields now; secure written QF rights or re-source and byte-audit an expressly licensed Arabic corpus; prove or regenerate narration under documented paid terms. |
| LR-017 | S2 | Child/title/map accessibility | Parent surfaces now have semantic controls, but the wider child-facing canvas/title/map still lacks a complete VoiceOver/Switch model. | Open accessibility design/playtest; do not imply the whole game is screen-reader complete. |
| LR-018 | S2 | Parent data control | Parent mode explains local-only storage but has no explicit in-app erase/reset journey control. | Open product/safety design; platform app/site-data deletion remains available. |

## 7. Current evidence

As of the program start:

- All 20 production worlds pass reachability/invariant checks.
- Root and `/v3/` have identical 48-script entry order.
- Existing onboarding isolation, parent-opened progression, render-loop,
  viewport, recitation blessing, shrine lock, and Showcase contracts pass.
- Native preflight rebuilds a 20.1 MB, 281-file bundle with the production
  journey map, 194 Mishary recitations, 25 title voice clips, native save
  bridge, opaque icon, and silent-switch audio-session configuration.
- Launch regressions now cover shrine touch/drag audio, suspend/resume audio,
  production echo migration, native onboarding action choice, bounded preview,
  and semantic parent controls.
- The public privacy policy now describes the PWA and iOS storage/offline paths
  separately. Its native no-request claim remains gated by LR-011's binary check.
- Xcode 26.6 built the synchronized iPhone-only target successfully without
  signing. The build installed and launched as `com.playgemsoflight.app` on an
  iPhone 17 Pro / iOS 26.5 Simulator and visibly reached the first-run garden.
  Full interaction/device verdicts and signed archive evidence remain above.

## 8. Integration and staging sequence

1. Reproduce and fix S0/S1 issues on narrowly owned files with regression tests.
2. Bump both entry points' script query versions for changed JavaScript and bump
   root `sw.js` cache when cached web behavior changes.
3. Run the automated gate from a clean generated native bundle.
4. Commit one finished idea at a time with explicit pathspecs; preserve unrelated
   local files.
5. Push only green commits to `staging`; verify the staging deployment serves the
   new script/cache versions before phone judgment.
6. Sync that exact staging commit into Xcode, run Simulator and physical-device
   gates, then upload a numbered archive to TestFlight.
7. Promote `staging → main` only after Hasnain approves the child-playable build
   on his phone. Production privacy/support URLs must be live before submission.

## 9. Workstream ownership

- **Native shell/build:** `ios-shell/**`; signing-independent build, bundle,
  save bridge, Xcode metadata, Simulator evidence.
- **Child loop/audio:** `v3/js/core/audio.js`, `adventure.js`, `shrine.js`, and
  launch-specific regression tests.
- **Parent/onboarding/legal/accessibility:** `onboarding.js`,
  `parent-preview.js`, `grownups.js`, company/privacy/legal pages, and focused
  tests.
- **Coordinator:** this plan, shared backlog/decision log, entry/cache versions,
  integration checks, staging push, App Store record, and collision prevention.

No two active workstreams may edit the same file. Findings outside a lane are
handed to the coordinator rather than patched across ownership boundaries.
