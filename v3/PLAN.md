# V3 Plan — Ten Prototype Worlds on the V1 Engine

Source of truth: `~/Notes/Gems v3/v3 Core Game Design Philosophy.md` and
`~/Notes/Gems v3/Prototype Exploration Brief.md`.

V3 is a reorientation, not a rewrite. The V1 engine (physics, art, audio,
level-builder DSL) is the general setup we keep. What changes is the loop
around it: V1's *collect → echo ritual → listening gate → extra modes* becomes
V3's single, invariant loop — **Adventure → Campfire → Shrine → Grand Gem** —
and everything instructional, textual, or quiz-shaped is removed.

> **Status (2026-07-12):** the prototype phase this plan describes is
> COMPLETE — all ten prototypes built, playtested, and reviewed
> (`reviews/p1–p10.md`), and their verdicts distilled into the real game:
> worlds W1–W4, the Remembering, journey tracker, grown-ups page, knowledge
> telemetry. §§1–6 and §8 are kept as the design record; current truth for
> *what exists* is `git log` + the directory itself, and the roadmap for the
> next twelve worlds is `WORLDS-PLAN.md`. §9 (git) and §10 (decisions log)
> remain live and current.

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
  prototype phase. (Silent local instrumentation stays; see §7.)
  *Later superseded in v3-native form:* the journey tracker (worlds.js) is the
  map, Remembering Moons are the moons, and `grownups.js` is the grown-ups
  page — all rebuilt to v3's wordless philosophy, none of them v1 code.

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

## 4. The ten prototypes ✅ (all built, playtested, reviewed — `reviews/`)

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
  will want a wider view) and nudges the camera look-ahead up. **Revised
  2026-07-14** (see §10): height-only scaling let a wide phone spill to ~25
  columns at half the iPad's tile size, and its shorter view showed a thick
  dead-dirt band the iPad's clamp hid. The camera now also caps the
  horizontal field of view (`GOL.V3.maxCols`, default 16) and keeps the
  vertical seat low (`GOL.V3.groundBias`, default 0.50) so the bottom clamp
  anchors the frame to the ground on every device — both tunable.
- **Performance:** keep the DPR clamp at 2 (a 3× canvas on a 6.1" screen is
  wasted work); pre-composed terrain and prop sprites carry over unchanged.
- **Testing:** playtests and headless QA run at 852×393; `tools/preview.mjs`
  renders at phone dimensions.

Orientation stays landscape (side-scrolling wants width); P2 Vertical Climb
is the natural place to prototype a portrait variant later if phones make
landscape feel cramped.

## 6. Directory shape (as built — differs from the original sketch)

```
v3/
  index.html            entry point (title, journey, versioned ?v= script tags)
  js/
    core/               engine.js, art.js, audio.js, props.js, actors.js  (adapted from v1)
    boot.js             boot, render loop, scene transitions, safe areas, tunables, RECITERS
    ui.js               scene registry, shared UI helpers, title screen
    dsl.js              level-recipe builder (from v1 levels.js) + campfire/door/memory spots
    adventure.js        the playable world — INCLUDES the campfire phase and
                        restoration stages (no separate flow/campfire/echo/restore
                        modules; the flow lives in boot's scene registry)
    shrine.js           one-socket-at-a-time recall; also hosts the dream-shrine
                        (the Remembering)
    worlds.js           the journey: world registry, unlock chain, journey disc
    worlds/             wN-<key>.js — one shippable surah world per file
    (prototypes/ retired 2026-07-12 — the ten experiment recipes live in git
    history; their verdicts are in §10 and reviews/. Debug unlocks every
    grown world instead, which is the same lab with real content.)
    grownups.js         press-and-hold star page: pilot-study view of the local save
  reviews/              TEMPLATE.md + p1.md … p10.md (all filled in)
  tools/check.mjs       reachability/invariant checker — every world must pass
  PLAN.md               this file (design record + live decisions log)
  GRAMMARS.md           the three world grammars — how to build a new world
  WORLDS-PLAN.md        roadmap for the twelve Level 1–2 surah worlds
Surah data lives at repo root (js/data.js), shared with live v1 — additive
changes only. Abdul Basit audio: audio/basit/SSSAAA.mp3.
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

## 8. Order of work ✅ all four phases complete (2026-07-12)

1. ✅ **Vertical slice** — P5 Cozy + Al-Falaq, the whole loop end-to-end.
2. ✅ **Harness** — title picker, tunables, instrumentation, debug hotkeys,
   `tools/check.mjs`.
3. ✅ **Prototypes** — all ten, built by parallel agents, checker-green.
4. ✅ **Reviews** — `reviews/p1–p10.md` filled; verdicts distilled into §10
   and into the game itself (worlds W1–W4, the Remembering, return loop).

**Current order of work → `WORLDS-PLAN.md`** (twelve Level 1–2 surah worlds
in six playtest-gated waves; Wave 0 = content pipeline).

## 9. Git workflow (kept deliberately simple)

- **`main` is the live site** — every push deploys to playgemsoflight.com.
  Only merge what a child could play today. **Since 2026-07-12 the root URL
  IS v3** (root index.html loads v3/js/*; v1 archived at /v1/, v2 at /v2/);
  bump root sw.js CACHE whenever main changes.
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
  **KILLED in turn (playtested 2026-07-12):** the echo replay felt broken
  and heavy-handed — doubling every ayah is laborious with the shrine
  right after. Superseded by **YOUR TURN**: after each ayah a soft chime
  opens a short (2.2s) breath — the chime marks the pause as an
  invitation (fixing what sank the silent breath), listening rings ripple
  from the child, the script stays aglow, the just-heard gem pulses. No
  re-recitation, ~2s per ayah instead of ~2x. First learning only;
  tuning row `your turn: off/chime` (default chime, `?turn=`).
  **KILLED ENTIRELY (2026-07-12):** the whole "your turn" campfire beat —
  breath, per-ayah chime, listening rings, script-glow, gem-pulse, and its
  tuning row / `?turn=` param — is gone. With the shrine's one-socket recall
  immediately after, a pause at the campfire added no value; the campfire is
  now just one tight, unbroken recitation of the surah before the door opens.
  The focus-on-the-ayah moment moved to where it lands naturally: **the pause
  at each gem's collection** (below). All of the your-turn code (setCampAr,
  echoI, the stanza-cut breath map, the echo visuals) was removed with it.
- **PAUSE AT EACH GEM (approved 2026-07-12)** — collecting a gem now holds
  the game so the ayah can be *heard*, not skated past. If the child leapt to
  reach the gem, gravity still brings them down (input is frozen, no walk/no
  jump); the instant they land, the ayah begins and the Arabic script glows.
  A small ceremonial touch so the hold feels special, not stalled: the
  lightling softly shuts her eyes (two little smiling lashes), breathes
  gently, and glimmers — sparkles drift up around her — while she listens.
  Play resumes — and the script fades — only when the recitation ends. This
  replaces the old collect behavior,
  where the ayah started mid-air and gameplay never stopped. (DEBUG speed-runs
  still skip the recitation, so the pause is a real-playtest-only beat.)
- **AL-FALAQ WORD-FOLLOW PROTOTYPE (built 2026-07-12; awaiting playtest)** —
  the full Uthmani ayah remains visible during W1's gem pause while the current
  word turns berry and completed words stay jewel-violet, in time with the
  fixed Abdul Basit Murattal recording. It is attention support, never a
  reading test:
  no transliteration, cursor, bouncing karaoke text, or prompt. All 23 word
  boundaries were hand-aligned against the exact local EveryAyah files
  (`js/worlds/w1-falaq-follow.js`, expected tolerance about 100–200ms).
  Abdul Basit and Alafasy each have exact tables; any future selected reciter
  proportionally fits the Basit word map to its audio duration so the
  experiment never silently becomes an all-white ayah. Other surahs
  retain the whole-ayah glow. Expansion waits on a child playtest: watch
  whether eyes
  follow the illumination and whether mouthing/repetition increases without
  being requested.
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
  **VERDICT (playtested 2026-07-12): still not right.** Even ember-gated,
  another surah sounding inside the current world's space reads as an
  interruption — the stone idea has now failed twice in different forms.
  The lesson: the remembering must happen where the OLD surah lives, not
  inside the current walk. **Redesign (approved + built 2026-07-12): THE
  MOON IS THE DOOR.** On the journey, each completed disc's Remembering
  Moon breathes a moonlit halo while it can still wax today; tapping the
  MOON (not the disc) carries the child straight into that surah's
  dream-shrine; the ceremony waxes the moon and drifts home to the
  journey. Once waxed, the halo rests until tomorrow — the invitation
  itself carries the once-a-day rhythm. No interruption is possible:
  the dream never sounds inside another surah's world. Stones disarmed
  (plain scenery); dream-shrine scene, moons, telemetry all reused.
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
- **Prototypes retired, debug is the lab (2026-07-12):** the ten prototype
  files and the title shelf are deleted (git history keeps them; reviews/
  and §10 keep the verdicts). Debug — now toggleable from the tuning
  panel — unlocks every grown world for direct play instead.
- **Levels 1–2 world roadmap (2026-07-12):** twelve new surah worlds planned
  in `WORLDS-PLAN.md` — per-world sketches, wave order, and its own decision
  log (data-driven unlock order, engine-aimed memory stones, shrine-chunking
  gate before any 12+ ayah surah).
- **Al-Lail summit headroom (playtested twice 2026-07-12):** the final C2→C3
  jump was blocked by the carved-stone summit catching the hero's head even
  though the reachability checker connected the platform endpoints. The first
  fix (cap x13→x14) was too narrow: it passed one edge-start simulation but a
  centered phone jump still failed, as the second playtest showed. The final
  route gives C3 a broad open-ceiling porch (through x20), places the one-way
  crest rung safely to its right, and does not begin solid summit stone until
  x22 — four full tiles past C2. The jump to gem 19 now has visibly open sky,
  not merely enough measured clearance. Actual-physics trials succeed from
  every tested C2 starting position with an ordinary held jump.
- **Campfire orbit spacing (playtested 2026-07-12):** Al-Nas showed only three
  gems at the fire because six orbit objects were arranged with their index
  angle twice, collapsing them into three perfectly overlapping pairs. Orbit
  gems now share one spin phase and receive their spacing once; even-count
  surahs display every gathered gem.
- **AL-LAIL LONG-SURAH LAB (built, not yet child-playtested):** three isolated
  debug prototypes now compare the production stanza approach against two
  explicit alternatives while holding the mountain and audio constant. P11 is
  the `[4,7,5,5]` control; P12 overlaps the three stanza seams (`4→5`, `11→12`,
  `16→17`); P13 recalls only the four stanza openings (`1,5,12,17`) to test a
  lighter first-session ending. No verdict is claimed until child observation.
  Test URLs, tradeoffs, and decision rules: `reviews/LONG-SURAH-LAB.md`.
- **AL-FATIHA — THE STRAIGHT PATH (built + first-playtested 2026-07-13):**
  seven ayat stay in the normal short-surah loop — one continuous
  ordered-gem walk, one earned full recitation, then all seven sockets in the
  shrine. No stanza or checkpoint machinery: those solve fatigue at 13+ ayat
  and would interrupt a surah this size. The world is one unmistakable
  left-to-right garden path that opens into fuller morning light. A quiet
  spatial threshold after ayah 4 marks the turn from praise to direct address
  and request without adding a ceremony; ayah 7 rests on a broad still landing
  so its longer recitation is never crowded by another interaction. There is
  no literal fork or wrong way. **First verdict:** it feels quite easy and
  repeats many established garden patterns; that familiarity is a strength at
  the beginning, where the child is learning the game's language. Al-Fatiha is
  now the first journey world. Existing completed worlds remain playable
  because saves are keyed by surah, not journey position. Phone QA at
  852×393 caught the eighth disc pushing both ends of the journey half off the
  canvas; journey spacing now compresses within the safe width, keeping Falaq
  and Fatiha fully visible and tappable. All seven Abdul Basit ayat are local.
- **JOURNEY STAR COUNTS (fixed 2026-07-13):** the journey disc used to draw
  one tiny pip per ayah beneath every open world. That stayed neat for short
  surahs but Al-Lail's 21 pips stretched across neighboring discs and broke
  the map. Open, unfinished worlds now show the total ayah count beside one
  vertically aligned eight-point star (`3 ★`, `21 ★`); completed worlds still
  replace it with their Grand Gem. The contained count scales to long surahs
  without turning the journey into a dense progress chart.
- **MOBILE CAMERA — FOV CAP + SPRITE SEAT (fixed 2026-07-14):** reported that
  the game "looks great on iPad but too small / zoomed out on phone — a lot of
  the beautiful detail is getting lost." Root cause: the camera fixed the
  *vertical* framing (`GOL.V3.rows` ≈ 11.5 tile-rows tall) and let the *width*
  spill to whatever the aspect ratio allowed. iPad (1.33:1) shows ~15 columns
  at ~67px tiles; a phone (2.17:1) showed ~25 columns at ~34px — the child a
  speck in a vast field. The near/mid/wide control only moved the row count,
  which barely dents the width, so it "didn't work super well." **Fix:** take
  the more-constraining of a height-fit and a new width-fit,
  `scale = max(H/(rows·TILE), W/(maxCols·TILE))`, with `maxCols` default 16.
  iPad's ~15 columns never reach the cap, so iPad is pixel-for-pixel unchanged;
  a wide phone zooms back in to ~53px tiles / 16 columns. The near/mid/wide
  camera control now drives this cap (14/16/18). Trade accepted: the phone
  shows ~7.4 rows tall instead of 11.5 (the aspect ratios can't match both
  axes) — the child stays framed at the seat below and drop-offs still read.
  A second report — "reduce/cap the subterranean area, where the sprite walks"
  — traced to the vertical anchor, hardcoded at 0.62 (sprite 62% down, ~38% of
  the view dead dirt below). On iPad the shallow levels (3 dirt rows) hit the
  bottom clamp, which incidentally seats the sprite ~0.74 down — that IS the
  tidy iPad look. A shorter phone view never reaches the clamp, so it showed
  the raw 0.62. **Fix:** the anchor is now `GOL.V3.groundBias` (default 0.74,
  matching iPad's effective seat), with a `headroom` row in the tuning panel
  (less 0.62 / mid 0.74 / more 0.80), a `?groundY=` override, and cfg
  persistence — alongside the `?cols=` override for the FOV cap. Headless QA at
  852×393 across Falaq (pond/ledge) and the tall Al-Lail (h=72) confirmed no
  playability regression at the defaults: drops stay visible, gems above stay
  visible. Shipped to `main` (sw.js CACHE v23→v24); a real-device pass is still
  the final word, and both levers stay tunable if a specific world wants a
  different feel.
- **SPRITE SEAT — CORRECTION (fixed 2026-07-14, supersedes the seat half
  above):** the `groundBias` default of 0.74 was wrong. Real-device feedback:
  "too much headroom makes all the jumping scenes bad." The mistake was setting
  the bias to 0.74 to *match iPad's number* — but iPad's tidy seat comes from
  the camera's **bottom clamp** (`cam.y ≤ level.h·TILE − viewH`, never show
  below the floor), which its tall view always hits, NOT from the bias. On a
  short phone view a high bias floats the camera OFF the clamp, opening a dead
  sky band above the sprite; the sprite crams against the bottom edge and jumps
  launch into empty sky. **Correct model:** keep the bias LOW so the clamp
  governs on every device — each then self-frames (iPad identical, phone
  anchored to the ground with the jump target visible above). Default
  `groundBias` 0.74 → **0.50**. The `headroom` control is now five fine steps in
  the low range (`.50/.54/.58/.62/.66`, default .50) — the range that actually
  varies — replacing the old less/mid/more that reached the bad 0.80. Camera
  default stays mid (16) so iPad is untouched; `near` (14) is one tap and
  persists per device (playtester's preference on phone). Verified headless at
  the Falaq bounce-gem jump (standing + apex). Shipped to `main` (sw.js CACHE
  v24→v25).
- **THE GUIDING LIGHT — occlusion reframed as guidance (built 2026-07-14; on
  `claude/guiding-light-prototype-1vym54`, awaiting child playtest).** A
  requested new mechanic: the sprite opens a closed BOX OF LIGHT which releases
  an orb/angel of noor that flies ahead and kindles the noor-seed trail into a
  bright, then slowly-expiring, lit path through the dark toward the next ayah.
  This is P6's occluder darkness finally given the *meaningful* home §10 asked
  for — the dark is not there to hide secrets (the verdict that sank P6) but so
  a guiding light can reveal the way. Wedded to its surah: it prototypes on
  **Al-Falaq**, "the daybreak," whose own words seek refuge in the Lord of the
  dawn "from the evil of the darkness when it settles" — so the guiding light
  *is* the daybreak breaking, and gathering the ayat lifts the night
  (`falaqNoor` → `falaqEnd`) until the last gem is found in full dawn.
  **Invariants held:** no text, no quiz, and crucially **no failure** — the
  "expiring path" never traps. The child always carries a personal aura of
  light, Noor the firefly still points the way, and physics/terrain are
  unchanged; the darkness only softens *distant* seeing, and the boxes/dawn
  carry the darkest stretch. Gems stay ordered; the orb leads to the same goal
  the firefly knows. Ordered collection, the earned campfire, the hidden Rahma
  blossom, and the ≥14-seed trail all remain (the trail is literally the path
  the orb lights). **How it's wired:** `b.lightbox(x)` DSL primitive; a `night`
  (0..1) world flag; adventure `updateGuideLight`/`drawDarkness` (a
  destination-out light-mask punched by the child's aura, the kindled seeds,
  the orb, opened boxes, and a faint next-ayah beacon; base darkness =
  `night · (1 − restoreK·0.9)` so dawn lifts it globally). Lives in the debug
  lab as `?proto=15&debug=1` on its own `labSaveKey` ('falaq-noor'), so it never
  touches World One's real Al-Falaq Grand Gem. `check.mjs 15` green; a headless
  logic harness confirms box-open → orb → seed-kindle → expire → dawn-lift and
  that daylit worlds are wholly untouched. **Open questions for the nieces:**
  does the "follow the light while it lasts" read as inviting rather than
  anxious? Is opening-on-arrival (no button to hunt for) the right kid-simple
  gesture? If it lands, its natural shipping homes are the roadmap's guided-path
  surahs — At-Takathur's clutter-clearing (WORLDS-PLAN I) and Al-Kafirun's
  noor-lit road (E) — rather than a second Falaq.
- **GEM BAND MOVED TO THE BOTTOM + made self-windowing (2026-07-14; on
  `claude/gem-drawer-reposition-7htqtg`).** With the zoom/clamp work above, the
  low `groundBias` means the camera's bottom clamp always shows a strip of dead
  **subterranean soil** below the floor — unusable play space. Meanwhile the
  top-centre, where the wordless gem band lived, became a *critical* spot (the
  action now reaches the top of the frame). So the band moves down into that
  dead strip, tucked into the gap **between the thumbstick and the jump button**.
  Its slot/width are derived from `GOL.touchZones` (bandCx = midpoint of the two
  controls' inner edges; bandMax = that gap; bandY centres the 52px band on the
  controls' row) so band and controls can never collide on any screen, and the
  camp-progress pips ride just above it. **Scaling for long surahs (Al-Lail 21,
  Al-'Alaq 19):** the narrower bottom gap can't hold every slot, so `drawHudBand`
  now *windows*. If all slots fit it opens them to a comfortable gap; if not it
  shows a window of full-size slots that follows the collection **frontier**
  (centred on the next gem, clamped to the ends), with a little cluster of
  shrinking dots trailing off each side — deep gem-gold gathered gems behind,
  faint empty stars ahead. Still wordless, no numbers: the child feels "I've got
  a bunch, and a bunch are waiting." Ordered collection makes the window a clean
  gathered-then-empty reel. Verified headless (layout fits the control gap at
  568–844px widths, windowing 7/11/15/21 slots) and by rendering the real
  `drawHudBand` states to a screenshot. `check.mjs` all-green; sw.js CACHE
  v27→v28.
- **THE SKY ABOVE THE PATH LAB (P16 built 2026-07-13; awaiting child
  playtest):** the journey's answer to twenty surahs is a second ALTITUDE,
  not a second screen. The path below only ever holds the chapter being
  learned (five discs, today's language); finished chapters live overhead as
  constellation figures of Grand-Gem stars — the stanza-crest compression
  story one scale larger. Completing a chapter's last world runs the
  ascension (gems lift, join star to star, the figure's light wakes the next
  chapter's discs); tapping a sky figure brings those worlds back down for a
  visit while the learning chapter waits dimly above with Noor beside it.
  No zoom, both altitudes always visible — the hierarchy cannot read as a
  menu opening a menu (P15's failure mode; that flight-based two-scale lab
  was built and reverted the same morning, `git show 05bf455`). Chapter
  membership would be contiguous runs of `WORLD_ORDER` (`CHAPTERS = [5, 5,
  6]`, the stanza pattern one scale up). P16 is presentation-only: no real
  worlds launch, no production save state is read or changed. Direct lab:
  `?lab=16`. Hypothesis, observation questions, and keep/reject rule:
  `reviews/sky-path-p16.md`.
  **VERDICT (parent review 2026-07-14): the structure survives, the sky does
  not.** The chapter/shape/fill-with-light pattern felt right, but a
  constellation execution drags the whole map toward night — blues, purples,
  darkness — against the game's light-green, open, light-filled identity.
  The lesson: keep the pattern, move it out of the dark. Night stays where
  it already belongs (the dream-shrine, the Remembering moons).
- **THE GREAT GARDEN LAB (P17 built 2026-07-14; awaiting vibe check):** the
  daylight home for P16's surviving structure — a charbagh, the classical
  fourfold walled paradise garden, seen at storybook height in the game's
  fullest morning palette (`fatiha`). Each chapter is a geometric flowerbed
  with its own figure (eight-point star, quatrefoil, ring, crescent — the
  shape identity constellations gave for free); every finished world is a
  gem-hearted bloom in its bed; beds sit along one stone water channel, and
  the water flows exactly as far as the journey has opened. Completing a
  bed's last world runs the blooming (light traces the bed's figure, petals
  burst, the wooden gate folds open, and the water runs on to wake the next
  bed — which stays fully asleep until it arrives, P16's own rule). The
  Remembering moon hangs as a REAL DAYTIME MOON, pale in the morning sky
  over its finished bed — proof the moon-door idiom survives daylight.
  Presentation-only like P16: simulated progress, no saves, no real worlds.
  Direct lab: `?lab=17`. What to judge and against what:
  `reviews/great-garden-p17.md`.
  **VERDICT (parent review 2026-07-14): right palette, wrong composition.**
  Crowded; the four equal beds in a row read as forced — a diagram, not a
  place (the Super Mario World map named the gap: its worlds are places in
  one continuous geography). Superseded by P18.
- **THE TERRACED VALLEY LAB (P18 built 2026-07-14; awaiting vibe check):**
  P17 un-flattened into one continuous landscape. Three terraces climb a
  sunlit hillside — Garden valley, Orchard rise, Courtyard heights — each
  inheriting a world-palette family the game already owns (`fatiha`,
  `maun`, `zalzalah`), with the SKY lerping between them as the camera
  travels: regions read as different places without one border drawn.
  The camera drifts over a map ~3 screens wide (drag to look around; it
  eases home to the journey's edge) — no pages, just ground that
  continues, which is also the expansion story: REGIONS are data over
  contiguous `WORLD_ORDER` runs, so growing past 17 surahs appends terrain
  off the right edge and nothing a child knows ever moves. Each region
  keeps a geometric HEART as its shape identity (spring-star pool,
  quatrefoil clearing, octagon court); finished worlds are gem-hearted
  blooms along a stream that flows exactly as far as the journey has
  opened; stepped water-stairs (chadars) climb between terraces.
  Completing a region runs the blooming: light traces the heart, petals
  burst, and one bright ripple travels the stream and climbs the
  water-stair — water filling in behind it — to open the gate and wake
  the next terrace (asleep until the water arrives). The daytime moon
  rests over the valley's finished heart. Presentation-only: simulated
  progress, no saves, no real worlds. Direct lab: `?lab=18`. Judge sheet:
  `reviews/terraced-valley-p18.md`.
- **THE PAINTED JOURNEY LAB (P19 built 2026-07-14; awaiting phone verdict):**
  P18's surviving geography is now a single lean artist-contract SVG
  (`map-artist-pack/journey-map.svg`, 1800×860): a softly tilted aerial ground
  plane carries Garden Valley from the lower-left through Orchard Rise to the
  upper-right Courtyard Heights. Its winding path, stream, water layers,
  foreground occluders, 21 future-proof world spots, three hearts, two gates,
  and daytime-moon seat are all named for the engine. P19 pans in both axes,
  rasterizes the static layers once, and performs the living language between
  them — light-child, Noor, blooms/buds/next-star, moon, wake wash, and the
  water ceremony — over simulated `[5,4,0]` progress only; no real save is
  read or changed. The SVG deliberately keeps spare spots clear, paints no
  gate doors or engine effects, and exits through an open upper-right seam for
  later terrain. Direct lab: `?lab=19`. Art and judge sheet:
  `map-artist-pack/journey-map.svg`, `reviews/painted-journey-p19.md`.
- **PHONE PLAYTEST (Hasnain, 2026-07-15) — resequence+polish verdict:**
  the eight polished worlds (fatiha → falaq → nas → kawthar → adiyat →
  qadr → duha → lail) have "random world-specific issues, but nothing
  blocking." Ship as-is; a detailed per-world playtest follows and its
  specifics land here. Same session, the map↔world TOGGLE passed ("feels
  like one game") and the painted map took a direction change — canals
  out, fountain hearts + sky field in; islands re-cut 8/8/8 over the
  24-key WORLD_ORDER (Valley 1–8, Orchard 9–16, Heights 17–24 = Phase 4
  exactly; append-only ladder means no world ever moves islands). Full
  reasoning: `map-artist-pack/drafts/r1/LOG.md` rounds 3–4.
- **ISLAND CUT REVISED (2026-07-15, same-day supersession):** the 8/8/8
  three-island cut gave the gems no room to breathe on-road; Hasnain
  ordered a FOURTH island — the map is now 6/6/6/6 over the 24-key
  WORLD_ORDER (Valley = Fatiha…Nasr, II = Masad…Takathur, III =
  Qariah…Ma'un, Summit = Qadr…Lail, the six night-and-dawn surahs).
  Engine reads the region shape from the map itself, so both cuts load.
  Detail: `map-artist-pack/drafts/r1/LOG.md` round 4.
- **GEM BAND — PINNED TO THE WORLD, NOT THE SCREEN (fixed 2026-07-14).**
  First cut pinned the band to the viewport bottom, so when a jump panned the
  camera up the band stayed glued to the screen and hovered over the play area,
  hiding the landing. Fix: anchor its Y to the world's subterranean depth — the
  band sits a fixed distance above the world's lowest edge
  (`bandY = (L.h·TILE − cam.y)·scale − (H − stick.y) − 26`), which equals the
  old screen slot exactly when the camera rests on its bottom clamp (player
  grounded) and slides the band down off-screen as the camera rises. Accepted
  trade: during high airtime the tracker simply isn't visible — better than one
  that obscures where you're about to land. X stays screen-fixed between the
  controls; a cheap guard skips the draw once it's fully below the view.
  Verified in-engine (Al-Lail) at clamped / +3.5-tile / +7-tile camera. sw.js
  CACHE v29→v30.
- **THE MAP IS THE GAME'S HOME (promoted 2026-07-15, on Hasnain's "how
  do i promote that to be the main page"):** the painted four-island
  journey left the lab. `v3/js/map.js` (scene `journeyMap`) binds the
  P19 experience to the REAL save: blooms are earned Grand Gems, the
  breathing star is the next world of the natural journey, buds are
  worlds still growing, islands wake as their built worlds complete
  (ceremony plays on return with news), landing on the star enters its
  world, resting on an old bloom re-enters after the hesitation ring.
  The title's pedagogy moved onto the map spots: per-surah Remembering
  Moons (tap to dream, once a day), the missing-you golden ring with
  Noor beside it, Rahma-blossom brows. The title is now a splash — logo,
  settings, grown-ups star, tap-anywhere → map — and its disc row is
  DELETED (git history is its archive, per Hasnain's "proto branch or
  delete"). `GOL.homeScene`: home means the map everywhere once
  visited (worlds, shrines, dreams, grown-ups). The P19 lab stays for
  future art rounds.
- **THE MOMENTUM & PATIENCE WAVE — JOURNEYS 1–13 FULLY BUILT (2026-07-15,
  on Hasnain's "build all the worlds to get to the first 13 surahs"):**
  nine new worlds in one wave — W9 Ikhlas (One Light monument + prog-driven
  light rings), W10 Nasr (the opening gate, doors swing in thirds per gem),
  W11 Masad (palm grove — built twice as an Opus-vs-Sonnet bake-off on the
  same locked brief; SONNET WON on tile-delivered cluster variety, a data
  point for the model-tier rule: locked reskin briefs no longer need the
  top tier), W12 Quraish (quraishWinter→quraysh palette drift = the two
  seasons; the House constant at the end), W13 Fil (the ababil flock — new
  engine hook `flock:{x,y,max}`, birds grow ceil(max·prog) with a 3-bird
  floor; distant elephant-rock silhouette, resized once after browser
  review caught it huge), W14 Humazah (nine varied stoneBlock hoard-cairns,
  bloomScale 3 blooms each pile as its gem leaves), W15 'Asr (56-tile
  golden-hour path, asr→qariah drift, sundial landmark), W16 Takathur
  (occluders' first production home: six furnished veiled pockets + an
  unveiled finale), W17 Qari'ah (windy moor, 70 drifting seeds, balanced-
  stone skyline). Engine plumbing (one agent): drawLandmark grew a 5th
  `prog` arg; dsl passes `flock` through. Orchestrator: quraishWinter
  palette; 9 script tags ×2 entry points at ?v=363. Briefs:
  `BRIEFS-2026-07-15-momentum-patience.md` (anti-template guardrails
  distilled from the 2026-07-14 review). Checker green ×17 + 42-script
  parity; browser-verified: flock growth, gate thirds, monument rings,
  veil softening, map doors ×13, Mishary local audio 200s. ALSO: MISHARY
  ALAFASY IS THE DEFAULT RECITER (per Hasnain) — 185 local mp3s fetched
  (audio/alafasy/, 18 MB, everyayah 128kbps, all 24 journey surahs),
  registry local path fixed, CFG_V 2→3 so pre-switch saves adopt the new
  default; Abdul Basit stays one tap away in the tuning panel. The
  per-wave playtest gates were consolidated by Hasnain into ONE staging
  playtest of the whole 13-surah span — verdict pending, specifics to
  land here.
- **THE SPLASH IS A POSTCARD FROM THE GARDEN (2026-07-15, on Hasnain's
  request):** the title screen now opens on `v3/art/splash-postcard.svg`
  — the lightling beside the valley spring (the map's eight-point-star
  stone pool) in a morning garden, painted in the journey map's own
  gouache language (same palette families, stone/water/bloom grammar,
  and the exact `drawSprite` anatomy for the lightling). Drawn
  cover-fit inside a cream postcard frame; the old painted-in-code
  backdrop remains only as the first-frames stand-in and crossfades
  away. No text lives in the SVG — the canvas letters the title, so the
  painting is reusable. The same scene, with the title baked in, is the
  link-preview card: `assets/share-postcard-v1.jpg` (1200×630, ~127 KB),
  wired to og:image / twitter:image in the root index.html (new
  filename so crawler caches refresh). Compose page for regenerating it
  lives with the session notes; re-render = headless Chrome at 2×,
  downsample, JPEG 85.
- **ROTATING IS THE DOOR (2026-07-15, on Hasnain's request):** the splash
  now has a PORTRAIT composition (`v3/art/splash-postcard-portrait.svg`,
  900×1600 — same scene, same grammar, recomposed upright) and the title
  is the rotate nudge itself: in portrait it shows the postcard, the
  title, and a little phone pictogram that tips itself sideways ("turn
  me sideways" beneath, the curtain's old words); the moment the phone
  rotates to landscape the journey map opens (the rotation, not a tap,
  is the begin gesture — it also wakes audio). A tap in portrait only
  pulses the nudge and unlocks audio. A landscape arrival keeps the
  tap-anywhere door. boot.js's global sideways curtain now skips scenes
  that declare `ownsPortrait` (only the title, so far) — mid-game
  portrait still gets the curtain, protecting a child's place in a
  world rather than warping home. Verified: portrait boot, portrait
  tap, rotate→map, landscape boot, checker green.
  *r2 (same day, Hasnain's notes):* the nudge moved up into the open
  sky just under the title (never on the garden); the stone channel
  ("weird hot dog pipe") is gone from BOTH compositions; the spring is
  now a true fountain — stone pillar, falling arcs, droplets, ripples,
  the game's own drawFountain shape. Share card regenerated as
  assets/share-postcard-v2.jpg (v1 removed; fresh URL busts crawler
  caches).
- **FIRST VERDICTS ON THE MOMENTUM & PATIENCE WAVE (Hasnain, 2026-07-15
  staging playtest):** (1) IKHLAS: the out-and-back gem order ("the
  jumbled order is weird and unexpected") — REJECTED; the world reflows
  linearly, gems 1→4 left to right (x 19/41/55/67), campfire/door past
  the last gem; the monument keeps its center-stage pillar and
  prog-driven rings, and the final ring encloses the new campfire
  clearing. (2) HUMAZAH: two hoard-cairns (hoards 5 and 6 — the audit
  found the real pair) were sealed boxes with no way in — but "i like
  the mechanic," so the fix is the OFFERING STONE (Hasnain's "special
  box you step on that opens it"): tile 5 + `b.lid(x0,x1,y0,y1)` — pale
  carved stone with a breathing glow seam, solid until the child STANDS
  on it, then the whole contiguous group dissolves in a silent
  dust-sparkle burst and the child sinks gently into the pocket beside
  the gem. Standing on the hoard is what opens it. Per-visit reseal.
  The checker now opens lids from reachable tops in a fixpoint BFS and
  ERRORS on any never-openable lid — this class of sealed-box bug can't
  ship again. Hoard 5 is a whole-cairn lid, hoard 6 a capstone vault
  (two flavors on purpose). Verified end-to-end in-engine: land on lid
  → 0.25s beat → open → child settles at the gem.
- **FRESH-PLAYER ONBOARDING VERDICT (2026-07-16, Codex browser pass):**
  staging loaded without console errors across landscape, iPhone Safari,
  iPhone in-app-browser, Android-install, and portrait→landscape handoffs.
  The postcard, setup cards, one-tap escape, and rotation door all read
  cleanly at 390×844 / 844×390. Two papercuts were accepted for polish:
  (1) choosing “Just play — you can add it later” now defers the map's
  install ribbon for the rest of that visit instead of immediately asking
  again; a reload may invite again, while the grown-ups page remains an
  intentional route; (2) the `v3 · sound · echo` diagnostic is debug-only,
  keeping production's first postcard wholly in the child's voice.
