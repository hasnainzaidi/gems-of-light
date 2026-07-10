# Gems of Light 💎

A gentle side-scrolling platformer where children (5–8) collect glowing gems — each one an ayah —
and arrange them into a complete surah. Built from the [vision doc](../gems-of-light-vision-doc.md).

**v2 — concept-art edition.** All graphics rebuilt to match the storyboards in `concept-art/`:
Lightling (option A) is the hero — matte cream body, sprout leaf, leaf mantle, a warmth that
brightens at discovery. The garden is now cream masonry with mossy crowns, ivy and dew; each ayah
gem has its own crystal cut; the gate got its carved socket-bench, the Recitation Room its arched
alcoves; snails and rabbits joined the inhabitants. The title screen wears the concept painting
itself (`assets/key-art.jpg`). Gameplay, levels and audio are unchanged from v1.

**World One — The Garden** (this release): Al-Kawthar, Al-Ikhlas, Al-'Asr, Al-Falaq, An-Nas, Al-Fatiha.

**Painterly levels shipped so far** (the AI-painted pipeline, one page per surah;
`index.html` is the little gate between them):

- `kawthar.html` — **Al-Kawthar**, the reference implementation (see `LEVEL-PLAYBOOK.md`)
- `falaq.html` — **Al-Falaq**, Daybreak Hollow: the level starts in pre-dawn dark
  (stars, an old moon, lanterns, fireflies) and the sky warms as you walk — five
  dawn-colored gems, a stone hollow, the waterfall, three shelves into the morning
  air, and the arch at full sunrise. The dark→light walk *is* the surah's meaning.

## Design positions (from the vision doc)

- **No failure.** No lives, no death, no timer. Water lifts you gently back to the bank. Creatures are inhabitants, not enemies.
- **Collect in any order; order at the gate.** Each level ends at a stone arch where the gems are set into the surah's sequence. Wrong gems drift back without a sound of blame; after a few tries the garden starts helping. Nobody is ever locked out.
- **The reward is hearing it whole.** No score, no stars, no streaks.
- **The Recitation Room** keeps every collected gem on shelves, forever replayable.
- **A quiet page for grown-ups** (world map → "for grown-ups", hold the star): completions, replays, hints, and which ayah gets misordered most.

## Run it

Any static server:

```
npx serve .
```

Or just open `index.html` in a browser (audio for not-yet-local surahs streams from everyayah.com).

## Controls

- **Keyboard:** ← → / A D to walk, Space / ↑ to jump, Esc to rest.
- **Touch (iPad-first):** two soft buttons bottom-left to walk; tap anywhere on the right half to jump.

Landscape only — the garden is wide, like a meadow.

## Audio

Recitation: Mishary Rashid Alafasy. Local files in `audio/` are used first
(named `SSSAAA.mp3`), falling back to streaming from everyayah.com. To make all
of World One fully offline, run:

```
bash tools/fetch-audio.sh
```

Ambience (breeze, birdsong, water) and chimes are synthesized in WebAudio —
no audio assets needed — and duck to near-silence whenever an ayah is recited.

As a PWA (served over https), the app shell precaches and each recitation is
cached the first time it is heard.

## Structure

```
index.html            the gate: pick a painterly level (old engine: index-full.html)
kawthar.html          Al-Kawthar, painterly pipeline (js/kawthar.js)
falaq.html            Al-Falaq — Daybreak Hollow (js/falaq.js)
tools/bake-falaq-assets.mjs  bakes hollow/lantern/dawn-gem recolors from existing paint
tools/render-falaq.mjs       headless Falaq pilot — story-beat PNGs (SHOT_W/SHOT_H env)
js/data.js            World One surah data (Uthmani text, transliteration, kid meanings)
js/art.js             palettes, gouache helpers, skies, parallax hills, tile atlas
js/props.js           trees, walls, water, waterfall, fountain, the arch, creatures
js/actors.js          gems, the light-sprite hero, parchment UI
js/engine.js          input, forgiving physics, camera, particles, saving
js/levels.js          six levels as small builder recipes
js/scenes.js          scene registry, Title, World Map
js/level.js           the playable garden + the gem-collect moment
js/gate.js            the sorting ceremony + completion recitation
js/room.js            Recitation Room + grown-ups page
js/main.js            boot, loop, transitions
tools/check-levels.mjs  reachability + integrity checker (node)
tools/fetch-audio.sh    localize remaining recitations
tools/preview.mjs       headless visual QA — renders real PNG frames of every scene
                        (npm i @napi-rs/canvas, then: node tools/preview.mjs)
```

## Verify levels

```
node tools/check-levels.mjs
```

Builds a platform graph with the game's generous jump physics and confirms every
gem and the arch are reachable in all six levels.

## Adding worlds later

Add surah data to `js/data.js`, a palette to `js/art.js`, and a recipe to
`js/levels.js` — then run the checker. World Two (The Orchard), Three (The
Courtyard) and Four (The Night Sky) are sketched in the vision doc.
