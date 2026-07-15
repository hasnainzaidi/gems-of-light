# P18 — The Terraced Valley (journey overworld lab)

**Try it:** `http://hasnains-mac-mini.local:8437/v3/?lab=18` (phone,
landscape) — or from the title's debug shelf (`?debug=1`, lantern 18).
Drag sideways to look around; the camera drifts home on its own.

## What this is

P17's garden un-flattened, after its verdict (right palette, wrong
composition — four equal beds read as a diagram, not a place). One
continuous hillside instead: three terraces climbing toward the light,
regions the way Super Mario World does regions — places in one geography,
not slots in a frame.

- **Garden valley** (morning gold, `fatiha`) — the spring: a star-shaped
  pool, rushes, pink blooms. The water's own beginning.
- **Orchard rise** (afternoon, `maun`) — laden boughs, a quatrefoil
  clearing, gold blooms.
- **Courtyard heights** (warm stone, `zalzalah`) — stone arches, an
  octagon court, lilac blooms.

The sky's palette lerps between regions as the camera travels. Water flows
exactly as far as the journey has opened; classical stepped water-stairs
(chadars) climb between terraces, each crowned by a small wooden gate.
The daytime moon rests over the valley's finished heart (tap to wax).

## The simulation (tap-through)

Progress starts `[5, 4, 0]`. Tap the breathing star to finish a world.
Finishing a region's last world runs THE BLOOMING: light traces the
region's heart, petals burst, then one bright ripple leaves the heart,
rides the stream, climbs the water-stair (water filling in behind it),
opens the gate, and wakes the terrace above. ~5 seconds, camera follows.

No saves are read or written; nothing launches a real world.

## What to judge (against the P17 verdict)

1. **Place, not diagram:** does it feel like ONE landscape you travel,
   with room to breathe — or still like arranged units?
2. **The climb:** does rising terrain read as growth? Is the child's
   sense of "how far I've come" stronger than in the flat row?
3. **Region identity:** valley/orchard/courtyard — nameable at a glance?
   Does the sky's shifting light register, even subconsciously?
4. **The drag:** is panning discoverable and pleasant on the phone, and
   does the camera's ease-home feel like a hand, not a leash?
5. **The blooming journey:** the ripple's ride up the water-stair — does
   it beat P17's flat channel run? Is ~5s of ceremony too long?
6. **Scale check:** squint and imagine six regions winding higher up the
   mountain. Does this composition welcome that?

## Keep / reject rule

If this passes, the next step wires REAL journey structure underneath
(REGIONS as contiguous `WORLD_ORDER` runs — `[5, 6, 6]` — real progress,
tap-a-bloom-to-enter-its-world) and replaces the title journey's disc row.
If it fails, the surviving requirements remain: one continuous place, no
pagination chrome, chapter shape identity, earned light, daylight palette.
