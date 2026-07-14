# P17 — The Great Garden (journey overworld lab)

**Try it:** `http://hasnains-mac-mini.local:8437/v3/?lab=17` (phone,
landscape) — or from the title's debug shelf (`?debug=1`, lantern 17).

## What this is

The daylight replacement for P16's constellation sky. Same structural idea —
chapters of ~5 surahs, each with a shape identity, filling with earned
light — but the pattern lives in a sunlit walled garden (a charbagh, the
classical fourfold paradise garden) instead of a night sky.

- Four geometric flowerbeds along one stone water channel: eight-point
  star, quatrefoil, ring, crescent. The bed's SHAPE is the chapter's
  identity ("the star bed we finished first").
- Every finished world is a gem-hearted bloom in the bed's own petal color.
- Water flows exactly as far as the journey has opened; beyond, the channel
  waits dry and the little wooden gate is closed.
- The active bed shows the journey's usual language: blooms behind,
  a breathing gold star for NEXT, pale buds ahead, Noor beside the star.
- A pale **daytime moon** rests in the sky over the first finished bed —
  the Remembering's door, unchanged, surviving the morning. Tap to wax.

## The simulation (tap-through)

Progress starts at `[5, 5, 3, 0]`. Tapping the breathing star "finishes"
that world (petals, blossom chime). The fifth starts **the blooming**:

1. Golden light traces the bed's figure (~1.6s) — the constellation
   join, transposed into grass.
2. Petal burst + praise chime.
3. The gate folds open; one bright ripple runs down the channel with the
   water filling in behind it; the next bed wakes only when it arrives.

No saves are read or written; nothing launches a real world.

## What to judge (against the P16 verdict)

The P16 verdict said: structure right, palette wrong — night pulled the
whole map away from the game's light-green open identity. So:

1. **Vibe first:** does this feel like OUR game — morning, green, open?
   Is there anywhere it drifts dark or heavy?
2. **Shape identity:** with beds instead of star figures, can you still
   tell chapters apart at a glance? Would a child remember "the star bed"?
3. **The blooming vs. the ascension:** does bed-completion carry the same
   emotional weight the gem-ascension had, without the night?
4. **The daytime moon:** does it read as the same moon-door from the
   journey, or does it get lost in the bright sky?
5. **Scale:** four beds fit one screen. At 20+ surahs this becomes several
   garden "courts" — decide zoom/pan/walled-court structure only if the
   vibe passes.

## Keep / reject rule

If the vibe check passes, the next lab wires REAL journey structure under
it (contiguous `WORLD_ORDER` runs as beds, real progress, tap-bed-to-enter)
and explores how more than four beds live (courts along the channel, or a
gentle sideways drift). If it fails, the surviving requirement for any
successor stays: chapter shape identity + earned light + light-filled
daylight palette, no pagination chrome.
