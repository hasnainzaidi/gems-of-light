# Level notes — pins dropped on the level map

One JSON file per world, named `wN-<key>.json` (e.g. `w4-qadr.json`). The
level map viewer (`/v3/level-map.html?w=4`) loads the file for the world on
screen and shows every note in it as a numbered pin, so a review lives in
the repo instead of in one person's browser.

## The loop

1. Open the map, press **＋ Pin** (or `N`), click the spot, type the note.
   Notes live in this browser's localStorage the moment they are saved —
   nothing is uploaded, and a note dropped here never touches the game.
2. Press **Copy** to put the whole level's notes on the clipboard as
   markdown (with a `json` block folded underneath) and paste it into the
   agent session. That is enough for an agent to work from: every note
   carries the tile coordinate it was dropped on.
3. Whoever does the fixing commits the notes here — either by pasting the
   json block into `wN-<key>.json`, or by using **⤓** to download the file
   and committing that. From then on anyone opening the map sees them.
4. Fixed something? Tick **fixed** on the note (it turns green and strikes
   through) and re-commit, so the file doubles as the review's record.

`⤒` imports a notes file back into the browser — useful for picking up
someone else's review, or restoring your own after clearing site data.

## Shape

```json
[
  {
    "id": "nlz4k2p9x",       // stable, generated when the pin is dropped
    "world": 4,               // world number
    "key": "qadr",            // world key, for sanity
    "tx": 26.4, "ty": 25.1,   // TILE coordinates (fractional — the exact spot)
    "text": "gem 3 reads as a dead end; the shoulder needs one more step",
    "author": "hasnain",
    "done": false,
    "ts": 1786000000000
  }
]
```

A local edit to a committed note wins in that browser (and a deletion
sticks, via a tombstone) — so pulling a newer file never resurrects notes
someone has already dealt with locally.
