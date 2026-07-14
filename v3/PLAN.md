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
  horizontal field of view (`GOL.V3.maxCols`, default 16) and seats the
  sprite lower (`GOL.V3.groundBias`, default 0.74) — both tunable.
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
