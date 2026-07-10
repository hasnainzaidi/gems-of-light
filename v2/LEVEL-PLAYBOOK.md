# Gems of Light — Level Playbook

Everything we learned building the Al-Kawthar level, written down so the next
level starts where this one finished. Al-Kawthar (`kawthar.html` + `js/kawthar.js`)
is the reference implementation — when in doubt, copy its patterns.

---

## 1. The asset pipeline (the big lesson)

**Procedural/code-drawn art cannot reach the target quality.** We tried; it
read as "cartoony and homespun." The winning recipe:

- **AI-generated painted assets** (gouache/watercolor storybook style) for
  everything visible; **code handles only motion and light** — parallax,
  particles, glow, water shimmer, camera.
- Generate cutouts on a **flat charcoal background (#222)**, then matte them:
  chroma-key + alpha decontamination (un-composite from the bg color) +
  edge-band luminance fade. Thresholds ~46/110 worked; dark fringes on
  edges mean re-matte, not blur.
- **Never splice generated images together raw** — seams always show. Either
  generate a full element at final proportions, or build seamless tiles in
  post (horizontal/vertical crossfade wrapping, ~140px crossfades). The wall
  texture is a pre-baked vertical tile of ground-top with depth darkening.
- Keep the style block from `ASSET-SPEC.md` verbatim in every prompt so new
  assets match the existing palette (creams #F5EDD4, greens #3E5340/#6B7D66,
  gold #B98A3E, deep green bg #2E4032).
- Processed assets live in `assets/paint/proc/`; raw generations in
  `assets/paint/`. Add every new proc asset to the **service-worker SHELL list**.

### Blending & proportions (hard-won taste calls)
- New structures must **share the wall's masonry course height** and color.
  Match colors by shifting the crop ~55% toward the wall palette, feather the
  bottom ~18%, and add a cast-shadow gradient — that's what made the coping
  ledge and basin sit naturally.
- A 2D wall should stay 2D: no fake 3D recesses or niches. If something sits
  proud of the wall, **the wall bulges / the object casts a shadow** — don't
  carve holes.
- When a strip looks "glued on," the fix is color-match + feather + overhang
  shadow, never a tighter crop.
- Sprite scale: hero is ~118px tall (SPRITE_H); keep props proportionate to
  him, and shrink masonry textures (wall at 0.36 scale) rather than letting
  giant blocks dominate.

## 2. Character rendering

- Sprite frames have **different canvas heights** — anchor each frame by its
  **foot baseline** (see `LL_BASE`), never by canvas bottom, or eyes/body
  jitter between frames.
- Our walk/jump frames were painted striding **left**; draw with
  `ctx.scale(-facing, 1)` for those frames only. If walking looks like a
  moonwalk, it's mirroring, not frame order.
- Two-frame walk is serviceable but minimal — a 4-frame strip is the first
  asset upgrade to request next level.
- **Contrast on small screens:** hero carries a breathing warm glow
  (radial, ~0.24 alpha, brighter during ceremonies) plus a dark green rim
  silhouette (`source-in` tint at 1.055 scale, alpha ~0.34) so he reads
  against pale backgrounds. Do this for any new hero/NPC.

## 3. Gameplay feel

- Physics that felt right for the 118px hero: accel 1600, max speed 340,
  jump vy −880, **variable gravity** (1450 rising while held / 820 floaty
  apex / ~1950–2300 falling), coyote time 0.12s, edge-triggered jump latch.
  "Sluggish/heavy" complaints = gravity too strong or jump too weak.
- A 5–8-year-old is the player: jumps must be **forgiving**. No pixel timing.
  Gem catch radii are generous (default 108; the falls gem needed **200** so
  any honest leap across collects it).
- **Meaningful choices, not punishments:** the falls gem vs. the high shelf is
  a route choice; both routes are survivable. Water has a rescue, not a death.
- Place pickups **on the natural arc** of the jump the level forces. Verify
  with the headless pilot — if the pilot misses, a child will too.
- Ceremonies (verse cards + recitation) **wait for landing**
  (`pendingCeremony` → promoted when grounded). Never freeze the hero mid-air.

## 4. Audio (iOS is the whole battle)

- **One persistent, gesture-blessed `<audio>` element**, reused for every
  clip. iOS blesses *elements*, not the page — `new Audio()` per verse fails
  intermittently. See `getPlayer()` / `K._blessPlayer()`.
- Bless it inside the **earliest possible gesture**: `unlockAudio()` bound to
  pointerdown/touchend/mousedown/keydown at document level, playing a silent
  WAV data-URI synchronously.
- Guard concurrent playback with a **playToken**; stale `ended`/`error`
  callbacks must check the token before firing.
- Fallback chain: local mp3 → everyayah.com Alafasy (`108NNN.mp3` pattern) —
  but the fallback must reuse the same blessed element.
- Any timed sequence (recite chains) must be **dt-driven state machines**,
  not setTimeout — timers stall headless and drift on throttled tabs.
- Recitations cache in the SW on first play, so a surah once heard works offline.

## 5. Mobile web & PWA

- **Camera:** fixed design height (`DESIGN_H = 800`,
  `scale = viewportH / 800`) so composition is identical at any aspect ratio.
- **UI is screen-space with a scale floor** (`uiScale = max(scale, 0.82)`) —
  HUD, verse cards, banners never shrink into miniatures on phones. World
  shrinks; interface doesn't.
- **Overlays must never cover interactive things.** Banners live along the
  bottom edge (over plain masonry) and fade to ~0.22 while dragging. Before
  shipping any overlay, look at the phone-size render and ask what it hides.
- Landscape only: rotate screen via
  `@media (pointer: coarse) and (orientation: portrait)`; pause ticking while
  portrait. (The rotate arrow must match the −90° tilt direction.)
- Touch pad (◀ ▶ + jump) appears only on coarse pointers and **only in the
  walking mode** — hide it during ordering/ceremonies.
- Viewport: `100dvh`, `visualViewport` for fit, `viewport-fit=cover` +
  `env(safe-area-inset-*)`, dpr capped at 1.5 on touch devices.
- PWA: per-page manifest, apple-touch-icon, A2HS nudge (iOS share-sheet
  instructions / Android `beforeinstallprompt`), 7-day dismissal memory.
- **iOS snapshots the home-screen icon at install** — icon changes require
  delete + re-add. Tell the user this every time icons change.
- Standalone app has no browser chrome → it carries its own **restart button**
  (top-right, two-tap confirm so a stray toddler tap can't wipe progress).
- SW updates: register with `updateViaCache:'none'`, reload on
  `controllerchange`, and precache **file-by-file with catch** — `addAll` is
  all-or-nothing and silently strands phones on old versions. **Bump the
  CACHE version on every change.**

## 6. UI & interaction patterns that worked

- **Ghost gem silhouettes** as drop targets (cream fill + dark rim +
  faint color hint + number) — rings and "dishes" were rejected as unreadable.
  Show, don't explain.
- **Tap-to-hear everywhere during ordering**: tapping any gem (floating or
  placed) replays its ayah with a pulse + sparkles. Tap vs drag threshold:
  <16px movement = tap.
- Verse cards: fade in over ~0.4s, fade **out** through the settle phase
  (don't reset the timer — that caused a flash). Draw the dim veil **before**
  the card so text stays crisp.
- Gems near busy art (the arch door) need extra glow to read.

## 7. Testing & verification

- **Headless harness is non-negotiable** (`tools/render-kawthar.mjs`):
  a demo pilot walks the level hands-free and snapshots at story beats with
  predicates. Run it at **desktop (1600×1050) and phone (800×380)** dims
  after every change. A stalled beat = a real design problem, not a test bug.
- Sim-time Audio shim (fires `ended` after ~1.6 sim-seconds) keeps recite
  chains testable.
- @napi-rs/canvas leaks ~20MB/frame in the sandbox — render GIFs in
  short-lived chunked processes.
- Actually **look at the rendered PNGs**, especially phone-size — every
  aesthetic bug we caught was caught by eyes, not asserts.

## 8. Checklist for the next level

1. Write/extend the asset prompt pack first (style block + charcoal-cutout
   rule); generate → matte → proc → add to SW SHELL.
2. Clone the kawthar.js module structure (world constants, S state, modes,
   screen-space UI block) rather than the old procedural engine files.
3. Reuse verbatim: audio player pattern, ceremony land-then-recite flow,
   ghost-target ordering, banner placement, rotate/touch-pad/A2HS/restart HTML.
4. Tune jumps with the pilot; place gems on natural arcs with generous radii.
5. Render both sizes headless, view the images, bump the SW cache, and on
   icon changes remind: delete + re-add the home-screen icon.

Known deferred items: 4-frame walk strip; straight-on regeneration of
spring.png (current one has slight top-down perspective); rolling this
pipeline out to the remaining four surahs (An-Nas, Al-Ikhlas, Al-'Asr,
Al-Fatiha).

---

## 9. What Al-Falaq added (level two learnings)

**Baked composites can stand in for generated art.** The stone hollow was
built in post from `wall.png` + the fringe moss (`tools/bake-falaq-assets.mjs`)
— same masonry, same palette, zero style drift. New gem colors are hue
rotations of the existing painted crystals (rotate strongly where saturated,
gently on pale highlights, so sparkles stay white). Optional-upgrade prompts
live in ASSET-SPEC §10–11; same filename = drop-in swap.

**A lighting arc can carry a level's theme.** The dawn (`dawnAt()`, driven by
camera x, smoothstepped) runs 0→1 across the walk. The recipe that worked:
(a) `multiply` indigo veil + a plain dark veil over the whole world, scaled by
(1−dawn); (b) a **light pass drawn after the veil** (`lighter`): lantern
flicker, uncollected-gem halos, hero glow — lights must punch through or the
night swallows them; (c) stars/moon drawn **above the veil too** — first
attempt drew them under it and they vanished; (d) horizon blush strongest at
mid-dawn (`sin(dawn·π)`), sun glow growing at the far end; (e) fireflies fade
out as motes fade in. Draw a crescent as a filled lune (two arcs, one path) —
a translucent shadow disc over a bright disc reads as a dead planet.

**Space stairs to the jump arc.** A full-speed held jump carries ~330–400px
per ~120px rise. Ascending shelves must put their landing zone where that arc
comes down (we used 410px x-spacing, 280px-wide shelves). For a gem overhead,
stop-and-jump-straight-up is the honest child move — the pilot releases
"right" mid-air (`_vhop`) and comes back down on the shelf.

**Jump-down ≠ jump.** The Kawthar pilot jumped whenever floor level changed
ahead; on descending shelf chains that megajump overshoots. Falaq's pilot
jumps only on true gaps (`floorAt === Infinity`, i.e. water) and walks off
descents.

**Five sockets need the iPad check.** Design-width on a 4:3 iPad is ~1067 —
the narrowest view. The whole ordering tableau (hero + bench + 5 sockets +
arch) must fit inside `[WORLD_W − 1067, WORLD_W]`… unless you give the camera
its own focus: we extended the world past the arch and pointed the order-mode
camera at `ARCH_X − 320` so the clamp no longer pins the view. Check the hero
is on-screen in order mode — ours fell off the left edge on iPad, twice.
Also: keep sockets off the arch doors (ghosts vanish against dark wood), and
scale the end-of-level walk distance to where the bench actually is.

**Verify with eyes at three sizes.** Desktop 1180×720, phone 800×380, iPad
1366×1024. The iPad pass caught everything the other two missed.
