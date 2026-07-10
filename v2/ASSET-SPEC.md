# Gems of Light — Painterly Asset Spec (vertical slice)

Goal: prove the asset pipeline on **one scene** — the opening stretch of The Spring
(Al-Kawthar): Lightling walking through the garden, one gem, one platform hop.
If it hits the quality bar, we extend the same recipe to the rest of the game.

## How this works

Generate each image below with the same workflow that produced the concept boards.
Save with the exact filename into `assets/paint/`. Then tell Claude — the renderer
gets rewritten to composite these paintings, with code keeping only what *should*
be code: animation, water shimmer, glow, particles, parallax movement.

## Shared style block (paste at the start of every prompt)

> Soft gouache and watercolor on warm cream paper, a children's storybook garden
> in early morning light. Layered greens — sage, moss, deep pine — with warm
> cream-tan stone and restrained gold accents. Light from the upper right. Soft
> brush edges, visible paper grain, no hard black outlines, no text, no logos,
> no watermark. Muted, gentle, reverent.

## Transparency rule

Assets marked **[cutout]** need an empty background. If the tool supports
transparent PNG output, use it. If not, generate on a **flat solid dark charcoal
(#222222) background** — Claude will matte it out cleanly (charcoal works best
against the cream/green subjects).

---

## The assets (9 images)

### 1. `bg-far.png` — sky and distant hills · 2048×1152 · opaque
Style block, then:
> Wide panoramic garden vista: soft blue-green morning sky fading to warm cream
> at the horizon, a gentle sun glowing in the upper right, two or three distant
> rolling hills with tiny round trees and slim cypresses, light morning mist in
> the valleys. No foreground, no characters, bottom third kept simple and hazy.

### 2. `bg-mid.png` — nearer hill line · 2048×640 · **[cutout]**
> A single ridge of soft green garden hills seen from a distance, dotted with
> round-canopy trees and cypresses, morning mist at its base. Nothing above the
> ridge line (empty background above), the ridge fills the lower half.

### 3. `ground-top.png` — walkable ground strip · 2048×512 · opaque, **horizontally seamless**
> A long horizontal strip of ancient cream-tan stone wall seen straight on:
> weathered brick courses with soft mortar lines, moss in the joints, and a lush
> crown of grass, tiny white blossoms and dew along the top edge. The left and
> right edges must tile seamlessly. Straight-on orthographic view, even lighting.

### 4. `ground-fill.png` — deep earth fill · 1024×1024 · opaque, **seamless both directions**
> Weathered cream-tan stone brickwork in shadow, quiet and dark, moss flecks.
> Perfectly tileable in all directions, straight-on view, no vignette.

### 5. `platform.png` — floating stone slab · 1024×384 · **[cutout]**
> A single long garden shelf of cream stone, mossy top edge, small ferns
> trailing from both rounded ends, seen straight on. Isolated object.

### 6. `tree-olive.png` — the big tree · 1024×1280 · **[cutout]**
> One generous old olive tree with a gently S-curved trunk and a broad layered
> canopy catching golden morning light, a few dew sparkles. Isolated object.

### 7. `bush-flowers.png` — ground dressing sheet · 1536×512 · **[cutout]**
> Three separate small garden plants in a row with space between them: a mounded
> leafy bush with white blossoms, a clump of lavender spikes, a tuft of tall
> grass with golden buttercups. Each isolated, straight-on view.

### 8. `gem.png` — the ayah gem · 512×512 · **[cutout]**
> A single luminous green crystal gem, elongated hexagonal cut, glowing softly
> from within as if holding light, painted with love, the brightest thing in the
> scene. Isolated object. (Code adds the pulse, halo and sparkles on top.)

### 9. `lightling-sheet.png` — the hero · 2048×640 · **[cutout]** — THE IMPORTANT ONE
> Character model sheet: the same small round creature painted five times in a
> horizontal row, identical design each time. It has a matte cream rounded body,
> two simple dark bead eyes, a tiny content smile, small tan-brown feet, one
> sprout leaf on a short stem on top of its head, and a small mantle of green
> leaves draped on its back like a cape. The five poses, left to right:
> (1) standing calm, (2) mid-step walking with one foot lifted, (3) mid-step on
> the other foot, (4) leaping upward with the leaf cape lifting, (5) eyes closed
> in a peaceful smile, body glowing faintly warm. Even spacing, same size, feet
> on a common baseline.

*Consistency tip: generate #9 in one image (not five separate ones) — that's what
keeps the five poses looking like the same creature. Claude slices it into frames.*

---

## What stays code (and why it'll still feel alive)

Water shimmer and waterfall streaks, gem pulse/halo, drifting pollen motes,
falling leaves, cape/leaf flutter (drawn as subtle overlays), parallax scrolling,
day-glow at collection. Static paintings + living light on top — that's the trick
most storybook games use.

## Acceptance check

Drop the files in `assets/paint/`, then Claude builds the slice and renders
screenshots. Judge against `concept-art/storyboards/core-gameplay-loop.png`
panel 1. If any single asset reads wrong, regenerate just that one.
