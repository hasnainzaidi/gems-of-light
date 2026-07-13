# Prototype 16 — The Sky Above the Path

Played on: (tbd) · child: (tbd) · sessions: (tbd)

Open directly:

`http://localhost:8437/v3/?lab=16`

## The hypothesis

P16 tests a one-screen, two-altitude journey: the path below holds only the
chapter currently being learned (five discs in the journey's existing
language), while every finished chapter lives overhead as a constellation
figure of Grand-Gem stars. There is no zoom and no scene change — both
altitudes are always visible at once, so the hierarchy can never read as a
menu opening another menu (P15's stated failure mode).

The compression story repeats one scale larger: ayah gems become a Grand
Gem; a chapter's five Grand Gems ascend and JOIN into a figure in the night
sky; the figure's light wakes the next chapter on the path. The sky is the
archive, the trophy, and the door back — all in one drawing.

## Simulated 4 × 5 state

Four five-world chapters stage a twenty-surah journey before the production
worlds exist:

- chapters 1 and 2 are complete: two figures shine in the sky; chapter 2's
  figure carries a moonlit haze (a Remembering Moon within is awake);
- chapter 3 is down on the path, mid-learning: three Grand Gems, one
  breathing next-star, one bud. Tapping the breathing star stands in for
  completing that world; finishing the fifth runs the full ascension;
- chapter 4 does not exist anywhere yet — dark sky is calm promise. After
  chapter 3's ascension its five discs breathe in and the loop continues to
  a second ascension, after which the path rests and all four figures shine.

Tapping a sky figure brings those five worlds gently back down for a visit
while the learning chapter waits overhead (dim stars, Noor beside it, the
way home). The haze on chapter 2's figure resolves — only once its worlds
are down — to one exact moon beside its own disc.

## What is intentionally fake

P16 isolates the two-altitude reading. Chapter membership, completion
states, the tap-to-complete stand-in, figure shapes, and the local
moon-waxing are simulated. It does not launch Adventure/Campfire/Shrine,
award real Grand Gems, alter knowledge telemetry, or decide final chapter
names and membership. Production's strict `WORLD_ORDER` remains the truth;
chapters would be contiguous runs of that one ordered list (the stanza
pattern, one scale up).

## Invariants

- No new task, score, token, currency, or collectible. A figure is made
  only from the Grand Gems already earned by completing surah worlds; the
  ascension ceremony IS the unlock — there is no gate.
- The individual surah's Remembering Moon remains the dream-shrine door.
  The sky haze says "a moon within is awake" and must lead the child down
  to the exact world and its own moon; it never becomes an aggregate door.
- Strict linear order is preserved: exactly one chapter is ever learnable,
  exactly one world within it is ever awake. Visits change nothing.
- P16 must not mutate `gemsOfLight.v3` or any production save data.
  Refreshing or leaving the lab returns the real journey exactly as it was.

## Child observation questions

Do not explain "chapter", "constellation", or what to tap. Ask for no
specific destination unless testing recovery after free exploration.

- On arrival, does the child find the breathing next-star on the path
  without scanning the sky first? (The sky should read as backdrop until
  it is wanted.)
- When the fifth gem is earned, does the child watch the ascension? Do they
  look from the joined figure back down to the newly woken path?
- After the ceremony, does the child understand the new discs are the next
  worlds — or do they search for the old ones?
- Can the child bring a sky figure down on purpose? Does the descent read
  as "those worlds came back to visit", or as a confusing replacement?
- During a visit, can they find the way home (the waiting dim stars with
  Noor beside them, or the back button)?
- Does the moonlit haze overhead lead them down to the one moon beside its
  own disc — or do they tap the haze expecting recitation in the sky?
- After two altitude swaps, is navigation faster and more intentional?
- Do the dark, empty parts of the sky feel like calm promise, or like
  something broken to poke at?

Record wrong taps, attempts to tap sky figures during ceremonies, loss of
the active location after a swap, whether the child voluntarily revisits a
figure, and any delight (or indifference) at the join.

## Keep / reject rule

Keep the sky-above-the-path pattern if children track the ascension as one
continuous story (gems → figure → light wakes the next path), can visit an
old figure and return home unaided, and the moon haze resolves correctly to
one moon. The path never holding more than five discs must feel like calm,
not loss.

Reject or redesign if children mourn the departed discs (search for old
worlds instead of accepting the sky), treat the swap as pagination, cannot
get home from a visit, or expect the sky haze itself to recite. A mixed
result should slow the ceremony and strengthen Noor's guidance before
adding labels, arrows, counts, or explanatory text.
