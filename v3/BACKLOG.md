# V3 Backlog

The single forward-looking list, shared by every session and tool
(Claude Code, Codex, cloud). One line per item, pointing at the doc
that owns the detail. Decisions and verdicts do NOT live here — they
land in `PLAN.md` §10 or the owning workstream log; this file only
says what's next and in what order. Any session may pick from NOW;
move lines between bands as reality changes; delete items when their
verdict is logged.

## Now

- [ ] Voice-clip babble gate: ElevenLabs hallucinated a trailing
      utterance after the break tag on the kursi title (caught by ear
      2026-08-10, trimmed). Teach generate-narration.mjs to
      silence-scan its output and flag/trim any speech after the final
      break — the whisper check pattern from PLAN §10


- [ ] Playtest the 2026-08-10 journey resequence on staging (PLAN §10):
      island order, kursi still island-1 summit, stage cards' new
      examples, existing-save migration (nothing a child visited locks);
      note: Pages deploys can finish out of order — verify the live
      build serves worlds.js?v=386 before judging

- [ ] Playtest the FOUNTAIN STONE on staging: the memory stone floats
      over island 1's star fountain, gold star while a dream still
      waits, tap → the neediest surah's dream-shrine; per-disc moons
      unchanged beside it — verdict → `PLAN.md` §9 fountain-stone entry
      (and decide whether moon taps retire)

- [ ] Playtest AT-TIN (journey #21, `w20-tin.js`: fig & olive
      orchard, safe-city skyline, spring hollow, holy-mount summit)
      on staging — verdict → `PLAN.md` §10

- [ ] Rework Kafirun (#18) — playtested 2026-08-09: kept, needs work
      (verdict `PLAN.md` §10). Gather Hasnain's specific notes on WHAT
      to improve, then fix on staging. (Ayat al-Kursi is DONE: cuts +
      read-along confirmed "works great" on phone 2026-08-09.)

- [ ] Phone-verdict Showcase mode ON STAGING (`?showcase=1`): neutral title,
      all-open map, silent ordered collection, World Gem campfire, return portal,
      secular parent porch + installed-PWA relaunch, and ordinary-mode
      regression — verdicts → `PLAN.md` §10; contract: `SHOWCASE-PLAN.md`
- [ ] Playtest the momentum & patience wave ON STAGING: journeys 1–13
      now fully built (W9–W17 new: Ikhlas, Nasr, Masad, Quraish, Fil,
      Humazah, 'Asr, Takathur, Qari'ah) + Mishary as default reciter —
      verdicts → `PLAN.md` §10 (briefs:
      `BRIEFS-2026-07-15-momentum-patience.md`)
- [ ] Phone-verdict the round-4 map ON STAGING (`?lab=19`): four
      islands 6/6/6/6, waypoint walk, arrival entry, rail camera,
      eight wired surah doors — verdicts →
      `map-artist-pack/drafts/r1/LOG.md`
- [ ] Detailed per-world playtest with the girls (first pass 2026-07-15:
      "nothing blocking", shipped as-is); specifics → `PLAN.md` §10

## Next

- [ ] Map polish once the promotion settles: port the disc row's two
      remaining dressings to map spots (memory-bloom arcs from
      heardFull, ayah-count pips on the open world) — see PLAN §10
- [ ] Ship ritual for the next deploy: `git fetch origin` FIRST,
      reconcile via `origin/main`, merge only child-playable work,
      bump `sw.js` CACHE, run `node v3/tools/check.mjs` parity gate

## Later

- [ ] New surah worlds per `WORLDS-PLAN.md` waves (audio pipeline
      already fed for the next batch)
- [ ] Map expansion panel when the journey grows past the third island
      (the open upper-right seam is the join; brief §3)
- [ ] Guiding-light mechanic verdict (P15, from the cloud sessions —
      needs a child playtest before it's adopted or parked)
- [ ] The Moonveil cape (design in `PLAN.md` §9, after the fountain
      stone's verdict): first full moon weaves a cape at the stone;
      moonbeam updrafts + one high sleeping Rahma bud per finished
      world wake with it
- [ ] Voice input / recitation checking (v2's QRC lab is the starting
      point: `v2/RECITATION-CHECKER-PLAN.md`)
