# Gems of Light 💎

A gentle side-scrolling platformer where children (5–8, journey modes reaching to 10) collect
glowing gems — each one an ayah — and arrange them into a complete surah. Built from the
[vision doc](../gems-of-light-vision-doc.md).

**World One — The Garden** (morning): Al-Kawthar, Al-Ikhlas, Al-'Asr, Al-Falaq, An-Nas, Al-Fatiha.
**World Two — The Orchard** (afternoon): Al-Ma'un, Quraysh, Al-Fil, Al-Humazah, At-Takathur, Al-Qari'ah.
**World Three — The Courtyard** (late light): Az-Zalzalah, Al-'Adiyat, Al-Bayyinah, Al-Qadr, Al-'Alaq.

Seventeen gardens in all. Al-Qadr walks from dusk into a starred night; Al-'Alaq — the
epic finale — climbs the Mountain of Light to the cave of Hira, nineteen gems long, and
its listening gate sets the surah in two rows of settings.

## Design positions (from the vision doc)

- **No failure.** No lives, no death, no timer. Water lifts you gently back to the bank. Creatures are inhabitants, not enemies.
- **Collect in any order; order at the gate.** Each level ends at a stone arch where the gems are set into the surah's sequence. Wrong gems drift back without a sound of blame; after a few tries the garden starts helping. Nobody is ever locked out.
- **The reward is hearing it whole.** No score screens, no leaderboards, no streaks.
- **The Recitation Room** keeps every collected gem on shelves, forever replayable.
- **A quiet page for grown-ups** (world map → "for grown-ups", hold the star): completions, replays, hints, and which ayah gets misordered most.

## The memorization loop

Every ayah is now heard 4–6 times per first playthrough, and spoken once:

1. **Collect** — the gem's ayah is recited while its words are shown.
2. **Echo** — "your turn, say it out loud": the gem pulses and listens; tapping it
   plays the ayah once more to say together (talqeen, as a ritual, not a test).
3. **The listening gate** — the gems arrive *veiled in light*, all alike. The child must
   listen (tap, or pick up) to know each one, then set them in order. Ordering is done
   by ear and memory, not by color-matching.
4. **The chain** — every correct placement recites its ayah, so the surah is heard
   building itself in order; then the whole surah plays as the arch opens.
5. **Return hooks** — completed gardens grow visible flowers with each replay; after a
   day away, the garden that misses its child glows on the map ("Al-Kawthar would love
   to hear you again"), with Noor the firefly resting there.

## More ways in (unlocked once a surah is completed)

Tap a completed garden on the map to choose:

- **Walk** — the ordinary stroll, breezy on replays (echo ritual retired once learned).
- **Star Walk** — the recall mode: dusk falls, every gem is veiled, and they only settle
  if gathered **in surah order**. Coming near a veiled gem whispers its ayah — the only
  clue. Arrive at the arch and the gate honors the walked order, going straight to the
  ceremony. Hints arrive more slowly here.
- **Moon Trial** — a five-question listening quiz under the stars: *which gem holds the
  ayah that comes next?* and *which gem holds ayah k?* Wrong picks just go to sleep;
  first-listen answers wax that surah's **remembering moon**, which never wanes and
  shows beside the map node.
- **Story** — how the surah came down, told softly in four pages (carefully within
  well-established narrations), ending with "hear the whole surah".
- **Meaning Match** — for growing readers (7–10): veiled gems speak; carry each to the
  meaning it belongs to. Completing it recites the surah with meanings highlighted.

## The journey itself (platformer grammar, garden temperament)

- **Noor seeds** — little star-lights trace the paths, arc over streams, and climb the
  slabs, classic coin-trail wayfinding with a rising pentatonic chime; gathered seeds
  fall as petals at the gate ceremony.
- **Bounce blossoms** — springy flower pads that launch you high with a petal puff.
- **Drifting leaves** — slow-moving leaf platforms (horizontal and bobbing) that carry you.
- **Hidden Rahma blossoms** — one secret golden flower sleeps in every garden (behind a
  waterfall, above the bounce, off the leaf path). Found ones bloom on the map node and
  gather on the Recitation Room windowsill.
- **Noor the firefly** — a companion light; when a child idles with gems still hidden,
  it drifts toward the nearest one and pulses. It also keeps watch on the map and title.

## For grown-ups (and pilot testing with older kids)

The grown-ups page now shows, per surah: walks, star walks, heard-whole count, helps,
**moon** (share of trial answers right on the first listen), trickiest ayah, hidden-blossom
star, plus a weekly line — walks · star walks · trials · matches · stories this week —
and the running count of say-it-out-loud moments. All local, nothing leaves the device;
it doubles as the engagement dashboard for pilot sessions.

## Run it

Any static server:

```
npx serve .
```

Or just open `index.html` in a browser (audio for not-yet-local surahs streams from everyayah.com).

## Deploy

Pushing to `main` deploys to GitHub Pages via `.github/workflows/pages.yml`
(the workflow also fetches the remaining recitations, so the published site
is fully offline-capable). When you ship an update, bump the `CACHE` name in
`sw.js` so devices that installed the app pick up the new version.

## Controls

- **Keyboard:** ← → / A D to walk, Space / ↑ to jump, Esc to rest.
- **Touch (iPad-first):** two soft buttons bottom-left to walk; tap anywhere on the right half to jump.

Landscape only — the garden is wide, like a meadow.

## Debug mode (speed runs)

Open the game with `?debug=1` (e.g. `http://localhost:3000/?debug=1`) to test
mechanics end to end without the rituals. In debug mode:

- every level and every mode (walk, star walk, trial, story, meanings) is open
  from the map — tapping any node offers all its ways at once;
- collecting a gem skips the ayah card, recitation, and echo entirely;
- the gate skips the sorting: gems arrive placed, and the whole ceremony
  (ignite → recite → open → walk) compresses to about a second;
- scene fades, intro cards, trial rewards, and the moon fill are near-instant;
- **hotkeys:** `1`–`6` jump straight into a level, `G` collects every gem,
  `E` warps to the arch, `M` returns to the map, and holding `Shift` sprints.

Nothing is written to the real save — debug progress lives in memory only, so
a child's garden is never touched by a test run. A red DEBUG badge in the
corner shows the mode is on.

## Audio

Recitation: Mishary Rashid Alafasy. Local files in `audio/` are used first
(named `SSSAAA.mp3`), falling back to streaming from everyayah.com. To make all
three worlds fully offline, run:

```
bash tools/fetch-audio.sh
```

Ambience (breeze, birdsong, water) and chimes are synthesized in WebAudio —
no audio assets needed — and duck to near-silence whenever an ayah is recited.

**Narration (the storyteller's voice).** Every English line the game speaks —
story pages, "your turn, say it out loud", the gate and trial instructions —
is a pre-generated ElevenLabs recording in `audio/voice/` (one warm human
voice; **never** a synthetic/robot browser voice). The lines live in
`js/voice-lines.js` and the surah stories in `js/data.js`; generate the audio
once with:

```
ELEVENLABS_API_KEY=sk-...  node tools/generate-narration.mjs
```

Re-runs skip files that already exist (`--force` regenerates, `--dry` lists).
Commit `audio/voice/` so deploys ship it. If a file is missing the game simply
stays silent for that line — narration always yields to the Qur'an, and
recitation always interrupts narration, never the other way around.

As a PWA (served over https), the app shell precaches and each recitation (and
narration line) is cached the first time it is heard.

## Structure

```
index.html            shell + script loading
js/data.js            Worlds One–Three surah data (Uthmani text, transliteration, kid meanings, stories)
js/voice-lines.js     every spoken English line (ids → text), one source of truth
js/art.js             palettes, gouache helpers, skies, parallax hills, tile atlas
js/props.js           trees, walls, water, waterfall, fountain, the arch, creatures,
                      bounce blossoms, drifting leaves, Rahma blossoms, seeds, firefly
js/actors.js          gems (true + veiled), the light-sprite hero, the moon, parchment UI
js/engine.js          input, forgiving physics, moving-platform carry, camera, particles,
                      saving + local engagement stamps
js/levels.js          seventeen levels as small builder recipes + the worlds table
js/scenes.js          scene registry, Title, World Map (blooms, moons, ways-in panel)
js/level.js           the playable garden + collect/echo moments + Star Walk recall mode
js/gate.js            the veiled sorting ceremony + completion recitation
js/room.js            Recitation Room + grown-ups page
js/modes.js           Moon Trial, Story, and Meaning Match scenes
js/main.js            boot, loop, transitions
tools/check-levels.mjs  reachability + integrity checker, journey-aware (node)
tools/test-flow.mjs     headless flow tests for every mode (node tools/test-flow.mjs [ids])
tools/fetch-audio.sh    localize remaining recitations
tools/generate-narration.mjs  ElevenLabs storyteller voice → audio/voice/ (cached)
tools/preview.mjs       headless visual QA — renders real PNG frames of every scene
                        (npm i @napi-rs/canvas, then: node tools/preview.mjs)
```

## Verify levels

```
node tools/check-levels.mjs
```

Builds a platform graph with the game's generous jump physics and confirms every
gem and the arch are reachable in all seventeen levels.

## Adding worlds later

Add surah data to `js/data.js`, a palette to `js/art.js` (`<key>End` if the light
should drift across the level), and a recipe plus a `worldDefs` entry to
`js/levels.js` — then run the checker. The map, room, and grown-ups page read
everything else from `GOL.WORLDS`. World Four (The Night Sky) is sketched in
the vision doc.
