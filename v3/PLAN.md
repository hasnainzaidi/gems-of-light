# V3 Plan — Ten Prototype Worlds on the V1 Engine

Source of truth: `~/Notes/Gems v3/v3 Core Game Design Philosophy.md` and
`~/Notes/Gems v3/Prototype Exploration Brief.md`.

V3 is a reorientation, not a rewrite. The V1 engine (physics, art, audio,
level-builder DSL) is the general setup we keep. What changes is the loop
around it: V1's *collect → echo ritual → listening gate → extra modes* becomes
V3's single, invariant loop — **Adventure → Campfire → Shrine → Grand Gem** —
and everything instructional, textual, or quiz-shaped is removed.

---

## 1. What V1 gives us (keep, mostly as-is)

| V1 piece | Why it survives |
|---|---|
| `js/engine.js` — input, forgiving physics (coyote, buffer, step-up, water rescue), camera, particles | Exactly the "no failure" platforming V3 wants; nothing here is educational-mechanic-specific |
| `js/art.js` — palettes, gouache tile atlas, prop sprites, parallax hills, `lerpPal` | The visual language; `<key>End` palette drift is the seed of Prototype 7 |
| `js/audio.js` — ayah mp3 pipeline (local-first, everyayah fallback), WebAudio ambience/chimes, ducking, the whole iOS playbook | Recitation is the heart of the loop; hard-won iOS fixes must not be relearned |
| `js/levels.js` builder DSL — `ground/slab/water/gem/seed/bounce/leafH/leafV/blossom/waterfall/prop/creature` | Ten prototypes are cheap only if levels stay recipe-sized |
| `js/data.js` surah data (Uthmani text, per-ayah audio keys) | Content layer unchanged |
| `js/props.js`, `js/actors.js` — trees, water, creatures, gems, hero | Reusable set dressing + the gem/hero actors |
| Debug mode (`?debug=1`, hotkeys) and `tools/` (check-levels, test-flow, preview) | Ten playable prototypes need fast iteration and automated reachability checks more than ever |

## 2. What V1 has that V3 explicitly removes

These conflict with the philosophy doc's non-negotiables (no quizzes, no
dialogue teaching, no required reading, no text tutorials):

- **The listening gate** (`js/gate.js`) — "arrange everything" sorting. V3's
  shrine is the opposite mental motion: *one socket at a time, what comes next?*
- **The echo ritual** ("your turn, say it out loud") — an instructed moment.
  V3 exposure is ambient, not prompted.
- **Moon Trial** — a quiz, banned outright.
- **Story mode & Meaning Match** — dialogue/reading-based teaching.
- **Star Walk** — a second educational mechanic; V3 has one loop only.
- **Narration voice** (`js/voice-lines.js`, ElevenLabs lines) — spoken English
  instruction. V3 communicates through animation and environment only.
- **Toasts, parchment ayah cards with transliteration/meaning text,
  instructional UI** — no reading required.
- **World map, ways-in panel, moons, grown-ups page** — not needed for the
  prototype phase. (Silent local instrumentation stays; see §6.)

Nothing is deleted from the repo — V1 keeps running at the root. V3 lives in
`v3/` the way V2 lives in `v2/`.

## 3. The V3 core loop (new code)

One `v3/js/` module set, shared by all ten prototypes:

### 3.1 Adventure (adapt `level.js`)
- Wander, jump, collect Ayah Gems — **in surah order** (playtest 2026-07-12):
  only the next ayah's gem is alight and collectable; later gems sleep dimly,
  waiting their turn, and just sway if touched. The firefly always points at
  the next one. (Superseded: "any order" — order-freedom read as working
  against the sequence the child is meant to internalize.)
- On collect: the ayah is recited, the gem flies home to a **wordless star
  band** at the top of the screen (playtest: an orbit around the player hid
  how many were found/left; the v1-style band answers it without numbers),
  and the world visibly responds (§3.5). At the campfire the gathered gems
  leave the band and circle the seated child for the recitation.
- **Ambient echo (tested → off by default):** the idea was that while a gem
  remains uncollected its ayah softly hums from its direction, gently calling
  the child toward it. Playtested (2026-07-12) as **confusing/random** — it
  fires on a timer with no clear cause, and collecting a gem cuts off an
  in-progress echo then re-recites, which reads as a glitch. Verdict: the
  recitation should be **collect-triggered only** (which it already is). The
  ambient echo now defaults `off`; the tuning panel keeps `near`/`world` for
  future experiments, but the philosophy doc's "world gently calling" idea did
  not survive first contact in this form.
- No ayah card. Optionally the Arabic words glow briefly in-world as the gem
  is collected (script exposure without required reading) — also a tunable.

### 3.2 Campfire (new scene, ~small)
- Triggered when the last gem is collected: the path ahead warms, the player
  walks into a resting place, the character **sits by itself** (input released),
  gems drift into a slow orbit, ambience falls to embers, and the complete
  surah plays once, uninterrupted. One tap after it ends walks onward.
- Presentation is themed per prototype (campfire, lantern, overlook, pond,
  stump under stars, moonlit clearing) but functionally identical.

### 3.3 Shrine (new scene — the one piece of real design work)
- The shrine shows **one empty socket at a time**. The collected gems float
  in a loose fan; the child carries/taps one into the socket.
- Correct: light flows one segment further through the shrine, nature responds
  (vines retreat, a bloom opens), the next socket fades in. The placed gem's
  ayah recites — so a full shrine run is the surah heard in order, built by
  the child's own recall.
- Not-yet-correct: the gem drifts back without any negative sound; the socket
  pulses gently. After two quiet misses the correct gem begins to shimmer
  faintly (help arrives, blame never does). No streaks, no score, no retry
  counter visible.
- Interaction is `gate.js`'s drag/tap machinery re-aimed: keep its input and
  ceremony code as reference, rebuild the flow as socket-sequential.

### 3.4 Grand Gem
- When the last socket fills, the Wise Tree (witness, not teacher) blossoms;
  the Ayah Gems spiral together into one Grand Gem which settles beside the
  player. Persisted in a v3-scoped save (`gemsOfLight.v3`), carried visibly
  into any prototype launched afterwards — the hook for future "old Grand Gem
  begins glowing" moments (not built in this phase, but the save schema
  reserves it).

### 3.5 Environmental restoration (new, small system)
- A per-level `restoration` hook: each collect advances a stage
  (0..gemCount), and each stage triggers themed responses — flowers bloom,
  birds return, water starts flowing, light breaks through. Built on existing
  props/particles/palette-lerp; each prototype declares its own flavor.

## 4. The ten prototypes

All ten preserve Adventure → Campfire → Shrine → Grand Gem exactly. **Same
surah in all ten** (recommend **Al-Falaq** — 5 ayat, a meaty shrine, audio
already local) so level-design differences are the only variable. A second
surah can be swapped in via query param for longevity testing.

Grouped by what new engine capability they need:

**Reuse existing capabilities (build first):**
1. **P5 Cozy Exploration** — flat-ish garden, friendly creatures, zero danger.
   *This is the vertical slice*: the first prototype proves the whole loop.
2. **P1 Dense Forest** — branching elevation lanes, hidden clearings (`carve`),
   heavy environmental storytelling. Mostly recipe work.
3. **P9 Open World** — wide, ungated, all gems reachable from the start
   (V1 was already any-order; this maximizes it).
4. **P10 Guided Path** — linear, cinematic; noor-seed trails + the firefly do
   the directing. Direct counterpart to P9 per the brief.
5. **P3 Ancient Ruins** — carved-stone tile (4) exists; needs a few new props
   (broken statues, fallen columns, overgrown arch).

**Need one new engine feature each:**
6. **P2 Vertical Climb** — tall grids (h ≈ 60+ vs V1's 16) and a vertically
   biased camera; V1 camera already tracks y, just remove the wide-meadow
   assumptions. Bounce blossoms + leaf platforms + waterfalls do the climbing.
7. **P7 Storm to Sunrise** — drive `lerpPal` by restoration stage instead of
   x-position; rain/wind particles that thin as gems are collected.
8. **P4 River Journey** — new mover: a drifting raft (auto-advancing platform
   with hop-on/hop-off), continuous downstream pacing.
9. **P6 Hidden World** — foreground occluders (cave walls, leaf curtains)
   that soften/fade when the player steps behind them; secrets everywhere.
10. **P8 Landmark World** — one giant structure (lighthouse / great tree)
    rendered as a fixed world-space landmark visible from everywhere; paths
    orbit and return to it.

Campfire/shrine presentation is varied across the ten per the brief's lists
(temple, crystal cave, tree roots, mountain altar, stone circle, moon shrine,
river sanctuary) while the function stays byte-identical — one scene module,
themed by data.

## 5. Phone-first (iPhone 16/17), not iPad

V1 was tuned iPad-first; V3 targets phones held in landscape. Concretely:

- **Design viewport:** ~852×393 CSS px (iPhone 16) to ~874×402 (16/17 Pro),
  landscape. Everything must feel right in a ~390px-tall window — the iPad's
  ~810px of height is gone, so vertical composition (HUD, sky, ground) is
  re-tuned rather than shrunk.
- **Safe areas:** `viewport-fit=cover` stays, but v3 reads
  `env(safe-area-inset-*)` (via a CSS-probe div) and pushes all touch
  controls and buttons inside them — the Dynamic Island sits in the left or
  right inset in landscape, and the home-indicator strip must stay clear of
  the walk buttons.
- **Controls:** V1's layout (two walk buttons bottom-left, right half to
  jump) already matches phone thumb ergonomics; v3 keeps it but scales
  button size/position from viewport height and insets, not fixed px.
- **Camera:** V1 scales the view so 13 tile-rows fill the screen height —
  on a phone that makes the world feel right but fingers cover more of it,
  so v3 exposes the rows-visible constant per prototype (P2 Vertical Climb
  will want a wider view) and nudges the camera look-ahead up.
- **Performance:** keep the DPR clamp at 2 (a 3× canvas on a 6.1" screen is
  wasted work); pre-composed terrain and prop sprites carry over unchanged.
- **Testing:** playtests and headless QA run at 852×393; `tools/preview.mjs`
  renders at phone dimensions.

Orientation stays landscape (side-scrolling wants width); P2 Vertical Climb
is the natural place to prototype a portrait variant later if phones make
landscape feel cramped.

## 6. Directory shape

```
v3/
  index.html            prototype picker (dev-facing, plain list of 10)
  js/
    core/               engine.js, art.js, audio.js, props.js, actors.js  (adapted from v1)
    flow.js             the world state machine: adventure → campfire → shrine → grand gem
    adventure.js        the playable level (from level.js, stripped of ritual/text)
    campfire.js         the resting scene (new)
    shrine.js           one-socket-at-a-time restoration (new)
    echo.js             ambient ayah echo, fully tunable (new)
    restore.js          environmental restoration stages (new)
    data.js             surah data (shared with v1 where possible)
    prototypes/         p1.js … p10.js — one recipe file each + theme decl
  reviews/
    TEMPLATE.md         the brief's 5 evaluation questions
    p1.md … p10.md      filled in after playtesting each
  tools/                check-levels + test-flow adapted to the v3 flow
PLAN.md                 this file
```

## 7. Instrumentation (silent, local-only)

**Knowledge metric (2026-07-12):** the shrine is brute-forceable, so
completion alone proves nothing. `st.shrineRuns` records each run's
first-try count, total misses, listens, and hints; the honest signals are
**tries per gem** ((sockets+misses)/sockets, 1.0 = perfect) and **listens
per gem** (low = recall, higher = recognition-by-ear — both legitimate,
different depths of knowing). `st.shrineFirstTry` is a max-of-runs and can
be flattered by one lucky run — prefer shrineRuns.

To answer the brief's questions with data, not vibes — reusing V1's `stamp`
pattern, never shown to the child:

- time to each gem, wander-vs-beeline ratio (P9 vs P10 comparison)
- shrine: first-try placements per socket, shimmer-help incidence
- voluntary replays per prototype (the brief's success criterion)
- session length, campfire skipped-early or watched-through
- echo setting in effect (so A/B results are attributable)

## 8. Order of work

1. **Vertical slice** — extract `v3/js/core/`, build flow.js + adventure +
   campfire + shrine + grand gem on the P5 Cozy layout with Al-Falaq,
   end-to-end playable on iPad. Everything after this is content.
2. **Harness** — picker page, query-param tunables, instrumentation,
   v3 debug hotkeys, adapted reachability checker.
3. **Prototypes in reuse order** — P1, P9, P10, P3 (recipe-only), then the
   feature-bearing five: P2 (tall camera), P7 (progress-driven palette),
   P4 (raft), P6 (occluders), P8 (landmark).
4. **Reviews** — playtest each, fill `reviews/pN.md` (emotion optimized for,
   what worked, what distracted from memorization, does it scale to 30–40
   surahs, what carries forward), with the P9-vs-P10 comparison the brief
   calls out.

## 9. Git workflow (kept deliberately simple)

- **`main` is the live site** — every push deploys to playgemsoflight.com.
  Only merge what a child could play today.
- **`v3-prototypes` is where all v3 work happens** — every prototype, one
  branch. Prototypes are *files* (`js/prototypes/pN.js`), not branches: they
  must coexist so they can be compared in one build from the title-screen
  picker (or `?p=N`).
- **One commit per finished idea** ("P2 vertical climb recipe", "raft
  mover"), so any single idea can be reverted later without disturbing the
  rest.
- **Combining winners is code work, not Git work**: winning mechanics live
  in shared modules (palette driver, occluders, movers) that any recipe can
  use; a "combined" world is just a new recipe using several of them, and
  losing prototypes are deleted files.
- Optional: a short-lived branch off `v3-prototypes` for a genuinely risky
  engine experiment, merged back or deleted within a few days. Nothing
  longer-lived than that.

## 10. Decisions taken (flag if you disagree)

- **Same surah (Al-Falaq) across all ten** — isolates the level-design
  variable, which is the brief's actual question.
- **Ambient echo defaults off** (playtested 2026-07-12) — recitation is
  collect-triggered; the wandering echo read as random. Toggle kept in the
  tuning panel for future experiments. See §3.1.
- **Gems collect in surah order** (playtested 2026-07-12) — sleeping-gem
  visual language; see §3.1. This retires P9's order-freedom hypothesis
  (its open *layout* remains a valid spatial test).
- **Star-band tracker restored** (playtested 2026-07-12) — the player-orbit
  as sole progress display hid collected/remaining; the band shows it
  wordlessly. Orbit kept for the campfire ceremony only.
- **Rafts are ferries** (playtested 2026-07-12) — bank-to-bank ping-pong;
  the respawn-at-start drift read as a glitch.
- **Campfire echo-breath REPLACED by "the world echoes"** (playtested
  2026-07-12): the 2.4s silent breath read as "the recording got stuck" —
  an invitation made of silence pattern-matches to a stall. New design
  (approved): after each ayah at the campfire, the same ayah immediately
  plays again SOFT (an echo off the hills, ~0.3 vol) while listening rings
  ripple from the seated child and the ayah's script glows — talqeen
  modeled, nothing ever silent. Gated to the world's FIRST completion
  (replays get the tight single recitation) and to a new tuning row
  `campfire echo: off/gentle` (default gentle) so it can be A/B'd with the
  nieces. Fallback if they fidget: remove, and let the mic feature carry
  voice production later.
- **Playtest positives to protect**: the campfire being *earned* (unlit until
  every gem is found), and the flowers blooming where a gem is collected.
- **Playtest doubts**: P6's occluder-veiled secrets ("feels weird — unclear
  value"); P8's landmark ("fine but kinda random" — if landmarks return,
  they should be *meaningful*, e.g. the Wise Tree/shrine visible from afar,
  not an arbitrary tower).
- **THE REMEMBERING (approved 2026-07-12)** — memory stone v3, replacing the
  parked v1 and superseding v2's recite-in-place payoff. The stone is a
  prominent monument on a short SPUR off the main line (visible from the
  path, reached on purpose). It arms ONLY in the ember phase — after the
  current walk's campfire, including on replays (arming any earlier would
  put the old surah's whisper inside an active collection: the v1 bug);
  armed, a
  thin beam of light rises from it, visible level-wide. On approach it
  whispers the old surah's FIRST ayah (identity before consent); a 0.6s
  dwell + the Grand Gem traveling to its socket enters **the dream**: the
  old surah's shrine, moonlit and starlit, same one-socket mechanic —
  retrieval practice disguised as a dream. Completing it waxes that surah's
  **Remembering Moon** by a quarter, at most once per day (the once-a-day
  rule IS the spaced-repetition schedule; the moon never wanes). The moon
  shows on the journey disc beside the Grand Gem, on the stone itself, and
  in the grown-ups page. Dream runs record into st.shrineRuns with
  dream:true. Entry contract: GOL.go('shrine', { memory: { surahId,
  returnWorld } }); completion returns via GOL.go('adventure', { world:
  returnWorld, resume: 'ember' }).
- **Memory stone v1 PARKED** (playtested 2026-07-12): a proximity-triggered
  full recitation of an *earlier* surah, mid-collection of the *current*
  one, fires by accident and collides two surahs — very confusing. The
  engine hook (`b.memory`, adventure's stone) stays dormant; no world uses
  it. Redesign constraints for v2 of the idea: the callback must be
  **deliberate** (an explicit act, not a walk-by), must **never overlap**
  the current surah's collection (e.g. only wakeable after this world's
  campfire, or in its own small side-chamber/scene), and should make WHICH
  surah is about to sound legible before it starts.
- **Arabic script may appear as ambient glow on collect, no transliteration,
  no meanings, no English text anywhere in play** — script exposure without
  required reading; also behind a toggle.
- **v3 save is separate** (`gemsOfLight.v3`) — a child's V1 garden is never
  touched by prototype churn.
- **V1 stays live at the repo root**; v3 deploys under `/v3` like v2 does.
