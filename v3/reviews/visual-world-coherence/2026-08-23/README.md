# Gems of Light — Visual World Coherence Review

## Purpose and method

This bundle reviews environmental composition, object anchoring, water logic, landmark legibility, depth separation, set-piece progression, and route storytelling across every currently playable Gems of Light world.

The method was explicitly revised during the audit. The final review is **map-led**, using the real flattened level-map renderer plus recipe comparison. It is **not a comprehensive live traversal or camera/usability playtest**. The native iOS app was launched in Apple Simulator, but sustained multi-touch control could not be driven reliably enough for systematic traversal. Earlier browser gameplay screenshots are retained as auxiliary material and are not counted as gameplay evidence.

- Tested date: 2026-08-23
- Map-audit revision: `cccb40b6635ef572214356218b9a3bee3a3ee8c3` (`staging`)
- Native-launch auxiliary revision: earlier session state; not used for world verdicts
- Playable worlds discovered: 20
- Configured but unbuilt: `zalzalah`, `bayyinah`, `maun`, `alaq`, `sharh`
- Findings: 0 S1, 2 S2, 5 S3, 0 S4

No game code, world recipe, camera behavior, gameplay configuration, or production art was changed during the audit itself. After the audit bundle was completed, a user-requested implementation follow-up corrected all seven finding-backed world recipes. Camera logic and shared production art remain unchanged.

## Implementation follow-up

- Status: all seven findings implemented on 2026-08-23.
- Production scope: `w4-qadr.js`, `w7-lail.js`, `w9-ikhlas.js`, `w13-fil.js`, `w17-qariah.js`, `w18-kafirun.js`, and `w20-tin.js`, plus script-cache version references.
- Verification: fresh-origin flattened-map comparison and targeted integrity check for every affected world.
- Evidence: each affected world has a `resolved/` frame. Original and annotated audit evidence remains untouched.
- Still deferred: native traversal, touch usability, and camera continuity.

## World discovery

Playable scope came from the actual child journey configuration in `js/worlds.js`: `GOL.WORLD_ORDER` supplies journey order, `GOL.orderedWorlds()` resolves registered worlds, and a world is playable only when its registered definition has both `build` and `surahId`. The review IDs use the stable registered world number (`W01`–`W20`), while this journey order was recorded before review:

1. W08 Al-Fatiha
2. W09 Al-Ikhlas
3. W01 Al-Falaq
4. W02 An-Nas
5. W05 Al-Kawthar
6. W19 Ayat al-Kursi
7. W15 Al-'Asr
8. W11 Al-Masad
9. W18 Al-Kafirun
10. W10 An-Nasr
11. W12 Quraysh
12. W20 At-Tin
13. W13 Al-Fil
14. W04 Al-Qadr
15. W17 Al-Qari'ah
16. W14 Al-Humazah
17. W16 At-Takathur
18. W03 Al-'Adiyat
19. W06 Ad-Duha
20. W07 Al-Lail

## Open the report

Open [`index.html`](index.html) directly in a browser. It uses relative local paths, inline CSS, and small optional inline JavaScript; no server, build, package install, CDN, or network connection is required.

## Folder structure

```text
2026-08-23/
├── index.html
├── ACTION-BACKLOG.md
├── findings.json
├── README.md
└── evidence/
    └── wNN-world-key/
        ├── originals/
        ├── annotated/
        └── resolved/    # affected worlds only
```

## Evidence naming

- `WNN-M01-flat-map.jpg`: flattened map with beats and route overlays; coverage and coordinates.
- `WNN-M02-art-only-flat-map.jpg`: flattened map with beats and route overlays disabled; primary composition evidence.
- `WNN-FNN-1280x720-flat-map-annotated.jpg`: finding evidence with stable ID and numbered callouts. The editable annotation overlay is retained beside it as SVG.
- `WNN-FNN-resolved-1280x720-flat-map.jpg`: clean-origin post-fix verification frame.
- `WNN-CNN-...png` or `.jpg`: auxiliary browser capture retained from the abandoned browser-play method; not counted as live coverage.

The local browser exported the flattened-map captures as JPEG. Their `.jpg` extensions match the encoded data; changing the extension did not alter the original image bytes.

Original screenshots were not overwritten. Annotated JPEGs were rendered from separate SVG overlays and preserve the underlying original evidence.

## Annotation conventions

- Solid red outline: affected rendered object or ambiguous layer.
- Yellow dashed outline: expected source, ground connection, receiver, or missing context.
- Translucent red region: visually misleading or insufficiently separated area.
- Numbered circles: references used by the finding caption in `index.html`.

## Test environments

- Flattened-map review: local real renderer at a 1280×720 browser viewport, full restoration, once with map overlays and once art-only.
- Native modern iPhone Simulator: iPhone 17 Pro on iOS 26.5; raw screenshot 2622×1206 landscape, equivalent to 874×402 points/CSS pixels. Native app launch was verified, but no traversal is counted.
- Small Simulator: iPhone SE (3rd generation) device was created, but systematic control and traversal were not completed.
- Requested 852×393 and 667×375 gameplay passes: not tested.

After implementation, the rebuilt bundle was launched again on the same iPhone 17 Pro Simulator. The untouched launch capture is [`evidence/native-fixed-launch-874x402.png`](evidence/native-fixed-launch-874x402.png). This confirms packaging and startup only, not traversal coverage.

## Coverage matrix

Abbreviations are expanded in the header. `Not tested` is intentional: flat-map inspection does not count as exercising gameplay. `Not present` is used only for movers when the rendered recipe contains none.

| World | Full ordinary route | All ordered gems | Major jumps | Major climbs | Major elevations | Major drops | Direction reversals | Movers | Campfire | Door/transition | Shrine | Grand Gem | Return to map | Camera boundaries | Falling/recovery | 852×393 | 667×375 | Flattened map | Recipe |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| W01 Al-Falaq | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not present | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Complete | Complete |
| W02 An-Nas | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not present | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Complete | Complete |
| W03 Al-'Adiyat | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Complete | Complete |
| W04 Al-Qadr | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Complete | Complete |
| W05 Al-Kawthar | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Complete | Complete |
| W06 Ad-Duha | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not present | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Complete | Complete |
| W07 Al-Lail | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Complete | Complete |
| W08 Al-Fatiha | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not present | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Complete | Complete |
| W09 Al-Ikhlas | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not present | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Complete | Complete |
| W10 An-Nasr | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not present | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Complete | Complete |
| W11 Al-Masad | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not present | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Complete | Complete |
| W12 Quraysh | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Complete | Complete |
| W13 Al-Fil | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not present | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Complete | Complete |
| W14 Al-Humazah | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not present | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Complete | Complete |
| W15 Al-'Asr | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not present | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Complete | Complete |
| W16 At-Takathur | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not present | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Complete | Complete |
| W17 Al-Qari'ah | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Complete | Complete |
| W18 Al-Kafirun | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not present | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Complete | Complete |
| W19 Ayat al-Kursi | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not present | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Complete | Complete |
| W20 At-Tin | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not present | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested | Complete | Complete |

## Known limitations

- No ordinary route was completed in native Simulator, so child orientation, held jumps, falling recovery, mover timing, camera boundaries, shrine flow, Grand Gem collection, and return-to-map continuity are not judged.
- Flattened maps show the entire world awake at once, paint the screen-anchored sky once, and ghost W16 foreground curtains. Those documented departures limit conclusions about motion and occlusion.
- Findings W09-F01, W18-F01, and W20-F01 have medium confidence because close-range gameplay could strengthen or weaken the map-derived interpretation.
- The review does not claim that a source-accepted recipe is visually correct; recipe intent is kept separate from the rendered observation.

## Validation performed

- Captured two flattened-map screenshots for each of 20 playable worlds.
- Inspected every world recipe after the rendered map pass.
- Preserved original evidence and generated separate annotated copies.
- Parsed `findings.json` successfully.
- Cross-checked stable IDs and evidence paths across JSON, backlog, filenames, and report.
- Checked repository status and confirmed review-bundle-only changes from this audit; unrelated pre-existing files were preserved.
- Opened and visually checked the report at desktop and phone widths; verified local links and images.
- Re-rendered every affected world from a clean local origin after implementation.
- Ran targeted `node tools/check.mjs wN` validation for W04, W07, W09, W13, W17, W18, and W20.
- Ran the full 20-world integrity checker successfully.
- Rebuilt and synchronized the zero-network Capacitor bundle, completed a successful iPhone 17 Pro Simulator build with Xcode, installed it, and verified native title-screen launch.

No game fixes were implemented during the audit pass. The subsequent user-requested implementation follow-up is documented above and in the resolution fields of `findings.json`.
