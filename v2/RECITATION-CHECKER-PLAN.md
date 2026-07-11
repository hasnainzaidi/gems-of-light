# Recitation Checker for Surat Al-Falaq — Implementation Plan

**Handoff plan for an autonomous coding agent. Execute the steps in order; each has its own verification.**

---

## 0. What you are building

A voice recitation checker for **Surat Al-Falaq (113)** inside the **Recitation Room** of the full Gems of Light game (`index-full.html`). The child taps a mic on the Al-Falaq shelf row, recites ayah by ayah, and the words of the ayah light up as they are recognized. Recognition runs **on-device by default** (Tarteel's Quran-tuned Whisper via Transformers.js in a Web Worker — offline, free, audio never leaves the device), with an **optional Qurani.ai QRC online engine** behind the same adapter interface, plus a mock engine for development and a no-recognition "echo" fallback so the feature degrades gracefully on any failure.

### The product contract (non-negotiable)

This game has a hard design rule: **no failure**. The recitation checker is a *dimmer, not a switch*:

1. Recognized words **add** light. Unrecognized words simply stay dim — no red, no buzz, no underline, no "wrong," no score shown to the child.
2. Words that light **stay lit** across attempts within an ayah (additive; never un-light).
3. Below-threshold attempt → the ayah is **played** for the child to echo (the hint *is* hearing it again), then they try again.
4. After **3** attempts, the remaining words light anyway ("the garden carries you through") and the child advances. **Nobody is ever blocked.**
5. Tune to almost never wrongly withhold light (false-reject ≈ the enemy); a generous false-accept is harmless.
6. Any technical failure (model won't load, mic denied, engine error) falls back to a lower tier silently — never an error message to the child.

---

## 1. Codebase orientation

Repo root = this folder (`gems-of-light/v2`). Vanilla JS, **no build step, no framework, no modules** (except the new worker). Canvas-rendered scenes on a shared `GOL` namespace via IIFEs. Offline-first PWA. Primary device: iPad Safari, installed to home screen. Deployed as static files (assume GitHub Pages — **no COOP/COEP headers**, so no SharedArrayBuffer).

Two apps live here — do not confuse them:

- `index-full.html` — **the full game**: loads `js/data.js → art.js → props.js → actors.js → audio.js → engine.js → levels.js → scenes.js → level.js → gate.js → room.js → main.js`. Scenes: title → map → level/gate → **room (the Recitation Room)** → parents. **This is the app you modify.**
- `index.html`, `kawthar.html`, `falaq.html` — standalone painterly one-page levels. **Do not touch them.**

Read these files before writing code:

| File | Why |
|---|---|
| `js/room.js` | The Recitation Room scene you are extending. Scene contract: `enter()/exit()/update(dt,W,H)/draw(ctx,W,H)`, registered via `GOL.registerScene('room', …)`. Rows per surah, per-ayah gem niches, `gemX(W,v)` layout, tap handling via `GOL.Input.taps` + `tap.ui` consumption. |
| `js/data.js` | `window.GOL_DATA.surahs` — Al-Falaq is id `113`, 5 verses, Uthmani text (contains U+0671 ٱ, dagger-alif `ـٰ`, full diacritics), plus `tr` transliteration and kid `meaning`. |
| `js/audio.js` | `GOL.audio.playVerse(surahId, n, onend)` (never stalls; guard timers), `playSurah(surah, {onVerse, onend})`, `duck(on)`, `sfx(name)` (`'settle'|'hint'|'drift'|'tap'|'door'|'unlockLevel'`), `chime(i)`. Local mp3s `audio/113001.mp3 … 113005.mp3` exist; everyayah.com fallback built in. |
| `js/scenes.js` | `GOL.text(ctx, str, x, y, {size, weight, color, align, ar:true})` — `ar:true` uses the Arabic font stack (`GOL.fonts.ar`); `GOL.hitButtons`, `GOL.muteButton`, `GOL.trFix`. |
| `js/actors.js` | `GOL.drawButton(ctx,x,y,r,icon)` (icons: pause/play/sound/soundOff/map/back/book — you'll add `'mic'`), `GOL.drawPanel`, `GOL.drawGem`. |
| `js/engine.js` | `GOL.store` (localStorage key `gemsOfLight.v1`): `store.level(id)` returns per-surah stats object; `store.save()`. `GOL.makeFx()` particle helper. |
| `js/gate.js` | The forgiveness pattern to mirror (attempts → hint at 3 → garden auto-helps), `hintsUsed` accounting. |
| `qrc-lab.html` | Standalone recitation harness that already exists: mock recognizer, **live QRC WebSocket protocol** (`StartTilawaSession` / `check_tilawa` with `correct_words[]` per verse/word), MediaRecorder 20 ms chunking, threshold slider, attempt log. **Port its QRC logic; leave the file itself unchanged.** |
| `sw.js` | Service worker: tolerant per-file precache (`SHELL`, misses only warn), cache-first runtime handler that caches same-origin fetches on first use. Bump `CACHE` name when shipping. |
| `js/main.js` | Boot, scene loop, audio unlock on gesture, SW registration. No changes needed here. |

Conventions to follow: IIFE + `const GOL = window.GOL;` at top; 2-space indent; lowercase sfx/scene names; comments in the game's calm narrative voice; no external network calls at runtime except the existing everyayah fallback and (opt-in) QRC.

---

## 2. Architecture

```
room.js (UI: shelf mic button + recite overlay panel)
   │  uses
   ▼
js/recite.js          GOL.recite — session controller + engine adapters
   ├─ engine "ondevice"  → js/asr-worker.js (module Worker)
   │        mic PCM → Float32Array 16 kHz → worker → Arabic text
   │        → GOL.reciteScore.score(text, targetWords) → matched word indices
   ├─ engine "qrc"       → WebSocket wss://api.qurani.ai (ported from qrc-lab.html)
   │        MediaRecorder chunks → streaming check_tilawa → word indices directly
   ├─ engine "mock"      → timer that lights words (dev only, ?recite=mock)
   └─ tier-0 "echo"      → no recognition; invitation + replay (auto-fallback)

js/recite-score.js    GOL.reciteScore — pure functions: normalize / align / score
                      (no DOM, no audio; also loadable in Node for tests)

vendor/               transformers.min.js + onnxruntime WASM files (vendored, offline)
models/whisper-tiny-ar-quran/   ONNX weights + tokenizer/config (local, offline)
```

**Engine adapter interface** (all four engines implement it):

```js
// GOL.recite.createEngine(kind, opts) -> engine
{
  ensureReady(onProgress) -> Promise,  // load model / open socket; resolve when listening can start
  start({surahId, verseN, targetWords}) -> Promise, // begin capturing
  stop() -> Promise,                   // stop capture; final result will still arrive
  onLevel(cb),                         // cb(rms 0..1) ~30/s while listening (for the pulsing ring)
  onPartial(cb),                       // cb({matched:[wordIdx...]}) streaming engines only (qrc, mock)
  onFinal(cb),                         // cb({matched:[wordIdx...], score, transcription|null, ms})
  onError(cb),                         // cb(err) -> controller falls back a tier, child sees nothing scary
  dispose()                            // stop mic tracks, terminate worker/socket
}
```

`matched` = indices into the **target ayah's word array** (0-based). The on-device engine derives them via `reciteScore`; QRC maps its 1-based `correct_words[{verse, word}]` down to `word-1` for the current verse.

---

## 3. Step-by-step work plan

Do the steps in order. Each is commit-sized. Run the step's verification before moving on.

---

### Step 1 — Scoring module: `js/recite-score.js` (+ Node tests)

Pure text pipeline: **normalize → word-align → score**. No DOM, no audio, no GOL dependencies. Dual-environment export:

```js
(function (root) {
  const reciteScore = { normalizeWord, normalizeText, splitWords, align, score };
  if (typeof module !== 'undefined' && module.exports) module.exports = reciteScore;
  if (root && root.GOL) root.GOL.reciteScore = reciteScore;
})(typeof window !== 'undefined' ? window : null);
```

(Loaded after the file that creates `window.GOL`; scoring always runs on the main thread — it is microseconds for ≤ 6 words — so the worker never needs this file.)

**3.1.1 Normalization** — applied identically to the ASR transcription and to each target word. Order matters:

1. Remove combining diacritics & Quranic annotation marks: `/[ً-ٰٟۖ-ۭ]/g` (tanwīn, ḥarakāt, sukūn, shadda, dagger alif U+0670, waqf/annotation marks).
2. Remove tatwīl: `/ـ/g`.
3. Unify letters: `[أإآٱ] → ا` (**must include U+0671 ٱ — the game's Uthmani text uses it throughout**), `ة → ه`, `ى → ي`, `ؤ → و`, `ئ → ي`, drop standalone `ء`.
4. Strip everything that is not an Arabic letter `[ء-ي]` or whitespace (kills Latin, digits, punctuation the model may emit).
5. Collapse whitespace, trim.

Normalization is per-word-safe (never merges or splits words), so the display words (original Uthmani tokens, split on `/\s+/`) and the normalized matching words stay index-aligned.

**3.1.2 Alignment & score** — word-level, order-preserving DP (Needleman–Wunsch / LCS style) between hypothesis words and target words:

- Per-word similarity: `sim(a,b) = 1 - levenshtein(a,b) / max(a.length, b.length)` on normalized words.
- A DP cell may "match" only when `sim ≥ WORD_SIM` (default **0.70**); maximize total matched similarity, monotonic in both sequences (this is what makes it "right words in the right order").
- Insertions in the hypothesis are free (a child adding *bismillah* first, repeating a word, or the model hallucinating a filler must not reduce the score).
- Return `{ matched: [targetIdx…], score: matchedCount / targetWordCount, pairs }`.

**3.1.3 Reference target data** (from `js/data.js`, surah 113 — word counts you can assert against): v1 = 4 words, v2 = 4, v3 = 5, v4 = 5, v5 = 5 (23 total).

**3.1.4 Tests — `tools/test-recite-score.mjs`** (plain Node asserts, `node tools/test-recite-score.mjs`). This exact spec (normalization regexes + DP alignment) has already been prototyped against the real `js/data.js` strings and every case below passed, including cross-verse scores of 0.00 (v1↔v5) and 0.40 (v3↔v4) — implement to the spec and the tests will pass:

- Identity: every Falaq ayah scores `1.0` against itself.
- Diacritics-free ASR-style output matches: e.g. hyp `"قل اعوذ برب الفلق"` vs target v1 → `1.0`.
- Alef-wasla / hamza variants match (`الفلق` vs `ٱلْفَلَقِ`).
- **Dagger-alif spelling divergence (the sharpest case):** target v4 word `ٱلنَّفَّـٰثَـٰتِ` normalizes to `النفثت`, but ASR will emit plain-spelled `النفاثات`; their similarity is exactly 0.75, so hyp `"ومن شر النفاثات في العقد"` vs target v4 must score `1.0` at `WORD_SIM = 0.70`. (This is why the cutoff must not be raised above ~0.75 without re-running this test.)
- Bismillah prefix then v1 → still `1.0` for v1.
- One word wrong/missing in v3 → score `0.8`, and `matched` identifies exactly which 4 lit.
- Wrong ayah: hyp v1 vs target v5 → score `≤ 0.25`.
- Sibling verses (v3 hyp vs v4 target — they share `ومن شر`) → score `≤ 0.5` (documents expected cross-talk).
- Empty / non-Arabic hyp → `0`.

---

### Step 2 — Model + runtime assets (build-time, not runtime)

Goal: fully local, offline inference. Nothing downloads from HuggingFace at runtime.

**3.2.1 Vendor Transformers.js + ONNX runtime WASM**

- `npm i -D @huggingface/transformers@^3` (dev dependency; the repo currently has only `@napi-rs/canvas`).
- Copy the browser ESM bundle to `vendor/transformers.min.js` and the onnxruntime WASM artifacts it ships (e.g. `ort-wasm-simd.*`) to `vendor/ort/`. Pin the version; note it in a comment.

**3.2.2 Get ONNX weights for `tarteel-ai/whisper-tiny-ar-quran`** into `models/whisper-tiny-ar-quran/`:

- **Path A (try first):** the HF repo (or a community conversion — search the HF API for `whisper-tiny-ar-quran`) may already contain an `onnx/` folder with quantized weights. If so, download just: `config.json`, `generation_config.json`, `preprocessor_config.json`, `tokenizer.json`, `tokenizer_config.json`, `onnx/encoder_model_quantized.onnx`, `onnx/decoder_model_merged_quantized.onnx`.
- **Path B (convert yourself):** use the Transformers.js conversion script (`scripts/convert.py` in the huggingface/transformers.js repo) with `--quantize --model_id tarteel-ai/whisper-tiny-ar-quran --task automatic-speech-recognition`, then copy its output (same layout as Path A).
- Write whichever procedure worked into `tools/fetch-asr-model.md` (exact commands) so it is reproducible. Record file sizes; quantized total should be roughly 40–60 MB. `.gitignore` the `models/` dir **only if** the repo must stay slim — otherwise commit it (preferred: it is part of the app shell).

**3.2.3 Verify:** files exist, sizes sane, and Step 3's test passes (that is the real verification of this step).

---

### Step 3 — ASR worker + end-to-end Node proof: the checker can hear

**3.3.1 `js/asr-worker.js`** — a **module** worker (`new Worker('js/asr-worker.js', { type: 'module' })`; Safari 15+ supports this):

```js
import { pipeline, env } from '../vendor/transformers.min.js';
env.allowRemoteModels = false;
env.localModelPath = new URL('../models/', import.meta.url).href;
env.backends.onnx.wasm.wasmPaths = new URL('../vendor/ort/', import.meta.url).href;
env.backends.onnx.wasm.numThreads = 1;   // no SharedArrayBuffer on GitHub Pages (no COOP/COEP)
```

Protocol (all messages carry a client `id`):

- in: `{id, type:'load'}` → progress out: `{id, type:'progress', file, loaded, total}` … `{id, type:'ready'}`
- in: `{id, type:'transcribe', audio: Float32Array /*16 kHz mono, transferred*/}` → out: `{id, type:'result', text, ms}`
- any failure → `{id, type:'error', message}` (worker must never throw unhandled).

Use `pipeline('automatic-speech-recognition', 'whisper-tiny-ar-quran')` and call it directly on the Float32Array. The fine-tune should emit Arabic without needing options; if output is empty or Latin, retry once with `{ language: 'arabic', task: 'transcribe' }` — keep whichever the Step-3 test proves out. Keep the pipeline cached in worker scope after first load; transcription is one-shot per attempt (Whisper is not streaming — the UI's "gathering the light…" state covers the wait).

**3.3.2 `tools/test-asr.mjs` — the no-human end-to-end test.** The repo already contains perfect test audio: Mishary Alafasy reciting each Falaq ayah (`audio/113001.mp3 … 113005.mp3`) — clean adult recitation, exactly the model's home turf. In Node (`@huggingface/transformers` npm package reads the same local `models/` dir):

1. Decode each mp3 to 16 kHz mono Float32 via ffmpeg: `ffmpeg -i audio/11300N.mp3 -f f32le -ac 1 -ar 16000 -` (spawn, read stdout). Document ffmpeg as a dev prerequisite.
2. Transcribe, then score against **all five** target ayahs with `recite-score`.
3. Assert for every N: `argmax_over_targets(score) === N` and `score(correct target) ≥ 0.6`.
4. Print a 5×5 score matrix + per-file latency (informational).

**This test gates the whole feature.** If it fails, fix model conversion / generation options before touching any UI. It also becomes your regression harness when later tuning normalization or thresholds.

---

### Step 4 — `js/recite.js`: mic capture, engines, session controller

One IIFE exposing `GOL.recite`.

**3.4.1 Mic capture (shared by ondevice engine; level-only for echo tier)**

- `getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })`.
- Tap PCM with an `AudioWorklet` (inline via Blob URL) and fall back to `ScriptProcessorNode(4096)` where worklets fail — both work on iOS Safari.
- Accumulate Float32 chunks at context rate; on stop, downsample to 16 kHz mono (linear interpolation) into one Float32Array.
- Per chunk compute RMS → `onLevel(rms)`; simple VAD: speech has started when RMS > `max(0.015, noiseFloor × 3)` sustained 150 ms; **auto-stop** after `1200 ms` of post-speech silence, or `12 s` hard cap, or manual tap.
- Acquire the stream when the recite panel opens; **stop all tracks** when it closes (`dispose()`). While listening, call `GOL.audio.duck(true)` (restore after) so ambience doesn't bleed into the mic.

**3.4.2 Engines**

- **`ondevice` (default):** lazy-create the worker on first use; `ensureReady` sends `load` and surfaces progress (first run downloads nothing — files are local/cached, but WASM init still takes seconds; show progress anyway). On auto-stop → transfer the Float32Array → `result` → `GOL.reciteScore.score(text, targetWords)` → `onFinal({matched, score, transcription: text, ms})`.
- **`qrc`:** port from `qrc-lab.html` verbatim where possible: open `wss://api.qurani.ai?api_key=KEY`, send `StartTilawaSession {chapter_index: 113, verse_index: <current ayah n>, word_index: 1, hafz_level: 2, tajweed_level: 1}`, stream `MediaRecorder` 20 ms chunks (`audio/mp4` preference on Safari — reuse the lab's mime-pref logic and its single `transport.send()` adapter point), map `check_tilawa.correct_words` for the current verse to 0-based indices → `onPartial`; on stop compute final. Config from `localStorage['gemsOfLight.qrc'] = {key, url}` (set via the tune panel, Step 8 — never child-facing). Any socket/mic error → `onError` → controller transparently recreates an `ondevice` engine and continues; ignore `tajweed_mistakes` entirely.
- **`mock`:** port the lab's mock — light target words on a 380–640 ms timer with ~12% skips; `onPartial` streaming; no mic. Active only via `?recite=mock`.
- **Selection:** URL param `?recite=mock|ondevice|qrc` overrides; else `qrc` iff a key is stored **and** `navigator.onLine` **and** `localStorage['gemsOfLight.reciteEngine']==='qrc'`; else `ondevice`.

**3.4.3 Tier-0 “echo” fallback (never an error screen)** — used when the ondevice model fails to initialize or mic permission is denied:

- Panel and flow stay identical, but the mic moment becomes *listen-and-echo*: play the ayah, invite the child to say it back; if a mic level is available, any sustained voice activity lights the whole ayah softly after they finish; with no mic at all, the words light along with a replay, evenly timed. Attempts/advance flow unchanged. Record `engine:'echo'` in stats. Copy never mentions failure.

---

### Step 5 — Recitation Room UI (`js/room.js` + one icon in `js/actors.js`)

**3.5.1 `'mic'` icon** in `drawButton` (js/actors.js): rounded-rect capsule + stand arc + base line, stroke style matching existing icons. Update the icon list comment.

**3.5.2 Shelf entry point.** `const RECITE_SURAHS = new Set([113]);` In the room's `update`, for rows whose `L.surahId` is in the set, add a button `{x: W - 84, y: r.y, r: 17, iconName: 'mic', fn: () => this.startRecite(r.L)}` (clear of the rightmost Fatiha niche at ~`gemX(W,6)` and the listening-Lightling spot at `W - 52`; verify no overlap at 1024×768). Draw it with a soft glow pulse so it reads as inviting. Gems do **not** need to be collected first — the Room is the no-stakes sandbox.

**3.5.3 Recite overlay** — a sub-mode of the room scene (`this.recite = {…}` state object; when set, `update/draw` route to recite handlers; back button restores the shelf). Do not add a new scene.

Layout (canvas, landscape ~1024×768 but resolution-independent):

- Dim the room (`rgba(46,64,50,0.45)` veil), then `GOL.drawPanel` centered, ~`min(W-120, 860)` × ~`H-140`.
- Top: 5 mini progress gems (`GOL.drawGem`, size 9, `GOL.GEMS[i%7]`), lit as ayahs complete; current one pulsing.
- Middle: the current ayah, **word by word, RTL**: split the original Uthmani `v.ar` on `/\s+/`, `ctx.measureText` each token at ~34 px `GOL.fonts.ar` (weight 400), lay out from the panel's right edge leftward, wrap onto centered lines (line height ~2.1 em; per-word rendering is shaping-safe because spaces already break Arabic joining). Store per-word rects in state for glow drawing and sparkle anchors.
  - Unlit: `#B9B09A`. Lit: ink `#2E4032` with a gold halo (draw twice: `shadowBlur≈14`, `shadowColor rgba(217,164,65,0.55)`), 1 px lift, 60 ms stagger when a batch lights, `fx.spawn('ring', …)` per newly-lit word.
- Below: transliteration (`GOL.trFix(v.tr)`, italic-ish, small) and the kid `meaning` line, `GOL.INK_SOFT`.
- Bottom center: big mic button (r ≈ 34). While listening, draw 1–2 expanding rings scaled by `onLevel` RMS. Status line under it (copy table §5).
- Top-left of panel: back (returns to shelf, disposes session). Room's own back/mute buttons hidden while the overlay is up.

**3.5.4 Flow (the dimmer):**

```
open panel → engine.ensureReady (progress copy if slow) → ayah i (start at 1, attempts=0, lit=∅)
tap mic → listening (auto-stop via VAD, or tap again) → "gathering the light…"
final result → lit ∪= matched → animate newly lit
  frac = |lit| / targetWords
  frac ≥ THRESHOLD (0.5)  → sfx chime(i) + progress gem i lights → pause 1.2 s → next ayah
  else attempts += 1
    attempts < 3 → status "let's hear it once — then you try" → playVerse(113, i) → child taps mic again
    attempts ≥ 3 → light remaining words (soft stagger) → sfx 'hint' → "the garden carries you through" → advance
after ayah 5 → celebration: playSurah(GOL_DATA falaq, {onVerse: highlight progress gem}) with sparkles;
              then "kept glowing on the shelf" and return to the shelf view
```

Partial results (`onPartial`, qrc/mock) light words live during listening — same additive rule. An engine error or a >20 s hang mid-attempt does **not** increment `attempts`; the controller silently swaps to the next tier down and re-invites. If the game is muted, hints are silent (existing `playVerse` behavior) — acceptable, do not special-case. `room.exit()` must `dispose()` any active session (mic released, worker/socket closed).

---

### Step 6 — Persistence + grown-ups page (small)

On `GOL.store.level(113)` add:

```js
st.recite = st.recite || { sessions: 0, ayahsPassed: 0, ayahsCarried: 0,
                           bestScores: {}, wordMisses: {}, engine: '' };
```

- `sessions++` per panel open that produces ≥ 1 attempt; `ayahsPassed`/`ayahsCarried` per outcome; `bestScores[n] = max(...)`; on every final result, for each target word **not** matched: `wordMisses['n:w']++`. `store.save()` at session end and on scene exit.
- Parents scene (`js/room.js`, parents `draw`): below the existing table, when `st.recite.sessions > 0`, one line: `Recitation Room — Al-Falaq: N sessions · M ayahs lit by voice, K carried · trickiest word: <word>` (render the Arabic word with `ar:true`; pick argmax of `wordMisses`). Nothing else changes.

---

### Step 7 — Wiring: `index-full.html` + `sw.js`

- `index-full.html`: add `<script src="js/recite-score.js"></script>` right after `js/data.js`, and `<script src="js/recite.js"></script>` after `js/audio.js` (both before `js/room.js`). The worker is not a script tag.
- `sw.js`: bump `CACHE` (e.g. `…-r12`, comment what shipped). Append to `SHELL`: `./js/recite-score.js`, `./js/recite.js`, `./js/asr-worker.js`, `./vendor/transformers.min.js`, each `./vendor/ort/*` file, and every file in `./models/whisper-tiny-ar-quran/` (list explicitly — the existing per-file `catch` keeps one big miss from failing the install, and the runtime cache-first handler self-heals any miss on first recite).
- Sanity: `qrc-lab.html` stays out of the precache; standalone pages untouched.

---

### Step 8 — Tuning panel + attempt log (dev/parent-only)

When `index-full.html` is opened with `?tune=1`, the recite overlay additionally shows a compact strip: sliders for `THRESHOLD` (0.2–1, default 0.5) and `WORD_SIM` (0.5–0.95, default 0.7) with live values; the last transcription text; attempts count. Keep an in-memory log — `{time, engine, verse, transcription, score, matched, total, ms, outcome}` — mirrored to `window.GOL_RECITE_LOG`, with a small "save log" tap target that downloads JSON (same spirit as qrc-lab's log; this is how real-kid sessions tune the thresholds). The QRC key/url fields also live here (writes `localStorage['gemsOfLight.qrc']` and `gemsOfLight.reciteEngine`). **No audio is retained**; only add WAV-blob capture behind `?keepAudio=1` with a visible "recordings kept this session" note (parent consent), discarded on page close.

---

### Step 9 — Final verification

Automated (all must pass):

1. `node tools/test-recite-score.mjs` — scorer suite green.
2. `node tools/test-asr.mjs` — 5/5 Alafasy clips: argmax correct, correct-target score ≥ 0.6.
3. Existing tools still run (`node tools/check-levels.mjs` etc. — do not break them).

Manual QA checklist:

- [ ] `npx serve .` → `index-full.html?recite=mock` → map → book button → room → mic on Al-Falaq row: full flow with mock lighting, pass, hint replay after a weak attempt (stop early to force it), carry-through after 3, whole-surah celebration.
- [ ] Default engine (ondevice): first open shows the "getting your reciter ready" progress; recite ayah 1 aloud → words light; game stays ≥ ~50 fps while the worker transcribes (no main-thread stall).
- [ ] Play `audio/113001.mp3` from another device at the laptop mic → high score (poor-man's e2e without reciting).
- [ ] Offline: after one successful load, go offline (devtools) → reload → recitation checker fully works.
- [ ] Deny mic permission → echo tier engages, copy stays warm, no error UI.
- [ ] `?tune=1`: sliders live-adjust, log downloads.
- [ ] QRC (if a key is available): `?tune=1` set key + engine → streaming word lights; kill network mid-attempt → silent fallback to ondevice.
- [ ] iPad Safari, installed to home screen (standalone): mic permission prompt appears and works (iPadOS 16.4+), model initializes, second launch works offline, portrait shows the existing "turn me sideways" nudge, mute toggle behaves.
- [ ] `room.exit()` releases the mic (mic indicator goes off) and no audio keeps playing after leaving the room.

Acceptance criteria:

- Al-Falaq row (and only that row) shows a mic; the checker never appears in levels, the gate, or standalone pages.
- A reasonable adult recitation of each ayah lights ≥ threshold and advances; a silent attempt never blocks progress past 3 tries.
- No child-visible failure states anywhere (no red, no "wrong", no error dialogs); every degradation lands on a warm tier.
- Voice audio never leaves the device unless the QRC engine was explicitly configured in the tune panel.
- All tunables in one place at the top of `js/recite.js`: `THRESHOLD 0.5`, `WORD_SIM 0.70`, `MAX_TRIES 3`, `SILENCE_MS 1200`, `MAX_UTTERANCE_MS 12000`, `RECITE_SURAHS {113}`.

---

## 4. Copy (kid-facing strings — keep this voice)

| Moment | Copy |
|---|---|
| Panel idle | `tap the light, then recite` |
| Model loading | `getting your reciter ready… (just this once)` |
| Listening | `listening…` |
| Scoring | `gathering the light…` |
| Ayah passed | `✦ the words are glowing` *(brief, then auto-advance)* |
| Below threshold | `let's hear it once — then you try` |
| Carried through | `the garden carries you through` |
| All five done | `Al-Falaq, whole — from your own voice` |
| Echo tier invite | `listen… then say it back` |

Never: "wrong", "failed", "try harder", "incorrect", scores/percentages, or anything that marks the Qur'an attempt as judged. Unlit words haven't lit *yet*.

## 5. Non-goals (do not build)

- No voice at the gate ceremony, in levels, or per-world challenges (future work; the adapter interface is the extension point).
- No tajweed feedback (ignore QRC's `tajweed_mistakes`).
- No surahs beyond Al-Falaq enabled (keep the code data-driven; enabling later = adding an id to `RECITE_SURAHS`).
- No server, no telemetry, no accounts; no audio persisted by default.
- No frameworks, bundlers, or build steps in the runtime app (vendored static files only).
- No changes to `falaq.html`, `kawthar.html`, `index.html`, or `qrc-lab.html`.

## 6. Known risks baked into this plan

- **Kid voices score lower than the model's headline WER** (it was tuned on adult reciters). That's why THRESHOLD starts at a generous 0.5, matching is fuzzy at 0.70, misses only replay the ayah, and 3 tries always carry through. Tune with `?tune=1` logs from real sessions, false-rejects matter, false-accepts don't.
- **iOS standalone-PWA mic quirks** — use `getUserMedia` (never the Web Speech API); test installed-to-home-screen early (QA list).
- **No SharedArrayBuffer on static hosting** — worker pins `numThreads = 1`; expect a few seconds per transcription on older iPads; the "gathering the light…" state absorbs it. If it's painful, try `device: 'webgpu'` opportunistically with WASM fallback (optional).
- **Model init cost** — one-time; precached by the SW; progress copy covers it.
