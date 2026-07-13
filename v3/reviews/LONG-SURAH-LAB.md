# Al-Lail Long-Surah Lab

Three debug-only builds reuse the same Al-Lail mountain, reciter, ordered
collection, campfire, and gentle shrine rules. The independent variable is the
shape of recall after a 21-ayah adventure. Production World 7 is unchanged.
Each build writes to its own lab save key (`lail-p11`, `lail-p12`, or
`lail-p13`), so none can earn or overwrite Al-Lail's real Grand Gem.

## Open each build directly

Run the project server from the repository root, then open:

- P11 Whole Night: `http://localhost:8437/v3/?debug=1&full=1&proto=11`
- P12 Linked Stars: `http://localhost:8437/v3/?debug=1&full=1&proto=12`
- P13 Four Lanterns: `http://localhost:8437/v3/?debug=1&full=1&proto=13`

`full=1` matters: it keeps the complete shrine instead of debug's normal
last-gem shortcut. For shrine-only inspection, append `&shrine=1`. The three
numbered lantern buttons also appear at the bottom of the title screen when
debug is on.

## Focused comparison — skip the identical climb

These links open at the first place the prototypes actually differ and always
show the complete experiment rather than debug's last-gem shortcut:

- P11 focused shrine: `http://localhost:8437/v3/?debug=1&proto=11&focus=1`
- P12 focused shrine: `http://localhost:8437/v3/?debug=1&proto=12&focus=1`
- P13 focused shrine: `http://localhost:8437/v3/?debug=1&proto=13&focus=1`

P11 and P12 open on the second stanza because that is their first meaningful
difference: P11 offers seven gems (5–11), while P12 brings ayah 4 back as an
eighth, haloed bridge into 5–11. P13 opens on its complete four-token macro
task (the stanza openings 1, 5, 12, and 17).

The three numbered buttons on the debug title screen now use these focused
entries too. The original full-adventure URLs above remain available when the
whole-session pacing is what you want to test.

## P14 Night Camps — the journey experiment

P14 changes the climb itself, so its button starts at the valley. For a real
morning playtest—with normal recitation and no debug acceleration—open:

`http://localhost:8437/v3/?lab=14&fresh=1`

`fresh=1` clears only P14's isolated lab progress once, then removes itself
from the address so ordinary refreshes continue from the latest lit camp.

The first three stanza boundaries become resumable ledge shrines. After the
last five new ayat, the summit still gives the earned full-surah recitation,
then a fourth small boundary-linked shrine forms the Grand Gem. There is no
additional 21-gem final shrine.

## What each build asserts

| Build | Recall task | Assertion | Main risk |
|---|---|---|---|
| P11 Whole Night | `[1–4] [5–11] [12–16] [17–21]` | One coherent adventure plus thematic chunking only at recall is enough. | Fatigue is merely postponed to the summit. |
| P12 Linked Stars | `[1–4] [4–11] [11–16] [16–21]` | Repeating each boundary ayah trains the three fragile stanza transitions. | 24 placements and an eight-gem fan feel repetitive or crowded. |
| P13 Four Lanterns | shuffled openings `[1,5,12,17]` | A first session should test the surah's macro shape and reach the reward quickly; detailed recall can move to later Remembering sessions. | Four choices flatter knowledge and may feel too slight. |

P11 is the control. P12 spends more attention for stronger chaining. P13
spends less attention for a shorter, clearer ending. None is presumed to win.

## Child-first test order

Do not explain the hypothesis or stanza numbers to the child. Start with one
build per session if possible; counterbalance the order across children so the
last build is not always punished by fatigue. Keep the reciter, audio setting,
device, and time of day as similar as practical.

Watch where attention first drops: early climb, late climb, full campfire, or
which shrine movement. Note attempts to leave, random dragging, repeated
listening, delight at a crest star, and voluntary replay. Completion by itself
is not evidence of learning because every shrine gently auto-helps.

Compare:

- first-try choices, misses, listens, and hints per socket;
- results specifically at 4→5, 11→12, and 16→17;
- shrine duration and the first visible fatigue point;
- whether the ending feels satisfying rather than abrupt or laborious;
- voluntary return, plus next-day performance in the Remembering.

The detailed briefs and keep/reject rules live in
`long-surah-p11.md`, `long-surah-p12.md`, and `long-surah-p13.md`.
