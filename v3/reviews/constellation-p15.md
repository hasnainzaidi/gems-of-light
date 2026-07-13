# Prototype 15 — Constellation Journey Lab

Played on: (tbd) · child: (tbd) · sessions: (tbd)

Open directly:

`http://localhost:8437/v3/?lab=15`

## The hypothesis

P15 tests a two-scale journey: a small sky of broader constellations, then a
familiar path of individual surah worlds inside the chosen constellation.
The assertion is that a child can understand “these worlds belong together”
and move between the two scales through light, motion, and location alone —
without pagination, labels, instructions, or a second kind of game task.

The same compression story repeats at a larger scale: ayah gems form a Grand
Gem; Grand Gems light a constellation. The test succeeds only if that feels
like one continuous journey rather than a menu opening another menu.

## Simulated 4 × 5 state

The lab presents four constellations with five world sockets each, simulating
a twenty-surah journey before all twenty production worlds exist. Their states
are staged solely for the visual/navigation test:

- constellation 1 is complete: five Grand Gems and a fully joined figure;
- constellation 2 is the active chapter: some worlds complete, one inviting,
  and later worlds asleep;
- constellation 3 is closed but visible, with its path not yet awake;
- constellation 4 is distant and sleeping.

Choosing a constellation moves into a five-world local path. Returning moves
back to the same constellation in the larger sky. The active world and the
route onward should remain legible at both scales.

## What is intentionally fake

P15 isolates hierarchy comprehension. Its twenty sockets, completion states,
constellation art, unlock ceremony, and any Grand Gem flight used to stage the
comparison are simulated. It does not represent twenty playable surahs, award
real Grand Gems, run Adventure/Campfire/Shrine, alter knowledge telemetry, or
decide final constellation names and membership.

The lab does not test memorization order, difficulty grouping, reward balance,
or whether several worlds should open at once. Production's strict world order
remains the truth. No production unlock rule is replaced by this prototype.

## Invariants

- There is no new task, score, token, currency, or collectible. A
  constellation is made only from the Grand Gems already earned by completing
  surah worlds.
- The individual surah's Remembering Moon remains the dream-shrine door. A
  constellation may carry a moonlit haze that says “a moon within is awake,”
  but it must lead the child to the exact world and its own moon; it never
  becomes an aggregate replacement door.
- Production keeps strict `WORLD_ORDER`. P15 may stage apparent states, but it
  does not introduce branches, choice gates, thresholds, or skipped surahs.
- P15 must not mutate `gemsOfLight.v3`, real Grand Gems, per-surah levels,
  `opened`, moon state, or any other production save data. Refreshing or
  leaving the lab returns the real journey exactly as it was.

## Child observation questions

Do not explain “constellation,” the two scales, or what to tap. Ask for no
specific destination unless testing recovery after free exploration.

- On arrival, what does the child tap first? Do they identify the breathing
  active constellation without scanning every object randomly?
- Does the move into five worlds read as going *inside that place*, or as an
  unrelated screen change?
- After entering, can they find the inviting world without adult help?
- Can they return to the larger sky, and do they recognize the constellation
  they just left?
- When a Grand Gem joins the larger figure, does the child watch the flight
  and look toward the newly lit connection or next constellation?
- Do dark future constellations feel like calm promise, or like tappable places
  that are broken?
- Can the child deliberately revisit the completed first constellation?
- If a constellation has a moonlit haze, does the child enter it and then tap
  the specific Remembering Moon, rather than expecting the haze itself to
  start recitation?
- After moving between scales twice, does navigation become faster and more
  intentional without explanation?

Record wrong taps, repeated taps, requests for help, attempts to swipe as if
through pages, loss of the active location, delight at the join ceremony, and
whether the child voluntarily revisits an old constellation.

## Keep / reject rule

Keep the two-scale constellation pattern if children independently enter the
active constellation, find its next world, return to the larger sky, and
re-enter an older constellation while maintaining a clear sense of location.
The Grand Gem join must read as the same restoration story at a larger scale,
and the moonlit cue must still resolve to one individual Remembering Moon.

Reject or redesign it if children treat the outer sky as pagination, cannot
predict which object opens, repeatedly lose their place after zooming, mistake
the constellation for a new reward/task, or expect its haze to bypass the
surah's own moon. A mixed result should simplify camera motion and outer-scale
choices before adding labels, arrows, counts, or explanatory text.
