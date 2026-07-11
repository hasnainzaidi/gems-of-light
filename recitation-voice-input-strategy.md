# Recitation as Progression — Voice Input Strategy

### A companion to the Gems of Light vision doc
*Prepared July 2026*

---

## TL;DR

The problem you've framed — kids, in Arabic, non-fluent, chanting rather than speaking — is real, but it is **the easy version of speech recognition**, because you always know exactly which ayah the child is attempting. That turns an open-ended transcription problem into a *matching* problem: "did this audio contain the right words, roughly in the right order?" Matching is far more forgiving than transcription, and it's exactly what you want.

You do **not** need to build or maintain a model or a dataset. Tarteel already open-sourced Quran-specialised speech models (Apache-2.0, free), and their own published ML journey is a cautionary tale about how expensive doing it yourself is. Stand on their models and, where you want a turnkey path, other people's APIs.

**Recommended path:**

- **Product:** Make recitation a *dimmer, not a switch.* It brightens the gem and moves progress forward when words land — but it can never fail a child, exactly like your existing gate ("nobody is ever locked out"). Ship it in three tiers of ambition (invite → record-and-play → real assessment) so you can prove the feeling before you prove the recognition.
- **Technology (default):** On-device **Tarteel `whisper-tiny/base-ar-quran`** running in the browser via Transformers.js, scored by word-level alignment against the known ayah. This fits your offline PWA, costs nothing per use, and — critically for parent trust — **the child's voice never leaves the iPad.**
- **Turnkey alternative for the pilot:** **Qurani.ai's QRC API** already streams back correct/skipped words per verse over a WebSocket. It is almost literally the mechanic you described, if you're willing to accept a subscription, a network dependency, and sending audio to a server.
- **Prove it narrow:** One short surah already in World One (Al-Kawthar or Al-Ikhlas), one HTML page, a tunable threshold, and a logging hook so real kid recordings tune the threshold for you.

The rest of this doc is the reasoning and the build plan.

---

## 1. The reframe: why this is the *easy* case

Your instinct in the brief is correct and worth stating plainly because it changes everything downstream:

> "The matching split is finite (you know exactly which ayah the child is trying to say) so it's less parsing/deciphering and more like proximity prediction / matching."

General ASR ("what did this person say?") has to choose among tens of thousands of words. Your problem is: *"The target is these 8 words in this order. How much of that is present in this audio?"* You are scoring proximity to a **known reference**, not decoding an unknown one. Every hard thing about your case — child voices, accents, chant cadence — degrades open transcription a lot but degrades *matching against a known target* much less, because you can be generous: partial credit, phonetic tolerance, and word-order-aware alignment all work in your favour.

This is also why your original plan — speech-to-text then a plain text search — is the *right shape*. It just needs two upgrades to be robust: **Arabic-aware normalisation** and **sequence alignment** instead of exact search. Modern techniques let you go further (forced alignment, closed-set rescoring), but the transcribe-then-align pipeline is the pragmatic 80/20 and everything else is an optional accuracy upgrade on top of it.

### The one non-negotiable constraint

Your vision doc draws a hard line, and the voice feature has to live inside it:

> "There are no lives. There is no death… Nothing about this experience should carry the emotional charge of failing at the Qur'an… **Nobody is ever locked out of a surah.**"

A naïve voice gate — "recite correctly or you can't pass" — violates this at the deepest level. It would make the game do the one thing the whole design refuses to do: let a child fail at the Qur'an, in the Qur'an's own words, judged by a machine that is *worse at hearing kids than adults*. So the design problem isn't "how do we grade recitation." It's **"how do we let recitation earn light, while making it impossible to be punished by it."** That constraint, more than any API choice, is what makes this design good.

---

## 2. Product design — recitation as a dimmer, not a switch

### 2.1 The core principle

Every place voice appears, it should **add light when it succeeds and cost nothing when it doesn't.** Concretely:

- Recognised words make the gem brighter / fill the ayah / advance progress. Success is *additive.*
- Unrecognised words don't buzz, don't scold, don't reset. The light simply *waits.*
- After a couple of gentle attempts, the ayah is played for the child to echo (a hint, exactly like the glowing gem hint at your gate).
- After a couple more, it **opens anyway.** The voice moment was an invitation to speak that the child got to take or leave. This is the identical forgiveness curve your gate already uses; you're reusing a proven pattern, not inventing a new emotional contract.

This reframing dissolves the "kids are hard to recognise" anxiety on the product side. If the recogniser is uncertain, the worst outcome is *the child hears the ayah again and moves on* — which is literally your definition of success ("a reason to hear it again"). **You should tune the whole system to almost never wrongly block a child, and not worry much about wrongly letting one through.** A false "well done" is harmless in a game whose only reward is hearing the surah whole; a false "not yet" is corrosive. (Section 4 turns this into a concrete metric.)

### 2.2 Where to attach it (in ascending order of ambition)

**a) The gem charge (lightest touch).** When the child touches a gem, instead of (or after) simply hearing the ayah, they're invited to say it back. Recognised words travel up into the gem as light. This is low-stakes, happens many times per level, and is the most natural fit for "hear it, repeat it, hear it again."

**b) The gate ceremony (the strong fit).** Your gate already asks the child to *order* the ayahs. Add a mode where each setting is lit not by dragging a gem but by **reciting** that ayah into it. This is where "right words in right order" matters most, and it's the moment the child is already being asked to demonstrate the sequence — so voice fits the existing ritual instead of bolting a quiz onto it. Keep drag-to-order as the fallback the game slides into after a couple of tries.

**c) Practice / Recitation Room (the safe sandbox).** The Recitation Room is the perfect place for a *no-stakes* recite-and-see-it-glow toy, and the perfect place to *collect the recordings that let you tune the system* (with parent consent). Nothing here gates anything, so you can be more experimental.

**d) A "final challenge" per world.** Once the mechanic is trusted, a gentle end-of-world moment where the child recites a whole short surah to light the world's lantern. Still never a hard fail — but a peak, celebratory use.

### 2.3 Ship it in three tiers so you de-risk the *feeling* first

You do not have to solve recognition before you learn whether kids enjoy being asked to speak. Ship the interaction in three increasingly ambitious tiers; each is independently valuable and each is a fallback for the one above it.

**Tier 0 — Invitation (no recognition at all).** The gem asks the child to recite; it listens for *any* sound (simple microphone volume / voice-activity detection) and rewards the *act* of speaking. This ships in a day, works offline, has zero recognition risk, and immediately kills the "passive Mario" problem you named — the child now *has* to speak to progress, even if nothing is graded. Many kids' apps stop here and it's genuinely effective. Use it to validate that kids like it and parents are comfortable with the mic.

**Tier 1 — Record-and-echo.** Record the attempt and let the child (or parent, on the parent page) play it back next to the reciter's version. Still no grading, but now there's a mirror. Great for the Recitation Room and quietly builds your recordings library.

**Tier 2 — Real assessment.** Now you turn on the recogniser and the word-by-word lighting. Everything above is the graceful fallback the moment the recogniser is unsure or unavailable. Because Tiers 0–1 already shipped the loop, Tier 2 is a quality upgrade, not a dependency.

### 2.4 The parent page basically already spec's this

Your vision doc's grown-ups page already promises "which ayahs they consistently misorder." Voice extends it for free to **which *words* the child consistently misses** — which is a genuinely useful, screen-time-worth-something artefact for a parent, and it's a natural home for the consent toggle that lets you keep recordings for tuning.

---

## 3. Technical approach

### 3.1 The pipeline (the pragmatic default)

Four stages. Everything hard is contained and swappable.

1. **Capture.** `MediaRecorder` in the browser grabs the attempt (16 kHz mono is plenty).
2. **Recognise.** Feed the audio to a Quran-tuned speech model and get back Arabic text (a rough transcription is fine — you're about to match it, not display it).
3. **Normalise.** Strip tashkīl/diacritics; unify the alif/hamza forms (أ إ آ ا), tā' marbūṭa vs hā' (ة/ه), and yā'/alif maqṣūra (ي/ى); drop tatwīl. Do this to *both* the transcription and the known target so cosmetic spelling differences don't count as errors. This one step removes a large fraction of naïve mismatches.
4. **Align & score.** Align the normalised transcription to the **known** normalised target with a word-level sequence alignment (Needleman–Wunsch / longest-common-subsequence), allowing per-word fuzzy matches (Levenshtein, or a light phonetic key) so "close enough" words count. Score = *words correctly matched, in order ÷ target length.* Because you kept order in the alignment, "right words in the right order" falls out directly, and you can surface exactly which words lit up (that's your per-word gem lighting and your parent-page data, for free).

```
score(audio, targetAyah):
    hyp   = normalize(recognise(audio))          # rough Arabic transcription
    tgt   = normalize(targetAyah)                 # known reference
    align = sequenceAlign(hyp.words, tgt.words,   # order-preserving
                          wordSim = 1 - levenshtein/maxlen)   # fuzzy per word
    matched = count(align where wordSim >= 0.7)
    return matched / len(tgt.words)               # 0..1, "right words in order"

# gate: pass if score >= THRESHOLD (start generous, e.g. 0.5), else hint,
# then after N tries open anyway. THRESHOLD is a tuning dial, never a wall.
```

This is deliberately simple, fully inspectable, and runs anywhere. Start here.

### 3.2 The optional upgrade: closed-set / forced scoring

Because you know the target, you can do better than transcribe-then-compare when you want more robustness for the hardest kids:

- **Reference-forced alignment.** Instead of asking the model "what was said?", ask "align *this known text* to this audio and tell me the per-word confidence and timing." (CTC forced alignment, or Whisper cross-attention alignment.) You get a per-word score directly, which is more stable for messy child audio than free transcription.
- **Closed-set rescoring.** In a given level there are only a handful of candidate ayahs (the ones in that surah). You can score the audio against *just those candidates* and pick the best — a tiny classification problem rather than open transcription. This is the most direct expression of your "proximity prediction among a finite split" intuition, and it's very robust.

Treat these as accuracy dials you reach for if Section 3.1 isn't generous enough in testing — not as prerequisites.

### 3.3 The landscape — who does the recognising

| Option | What it is | Fit for you | Cost / privacy | Verdict |
|---|---|---|---|---|
| **Tarteel `whisper-tiny/base-ar-quran`** (open, Apache-2.0) | Quran-specialised Whisper *fine-tunes published Dec 2022*, WER ~5.75% (base) / ~7.1% (tiny) on adult reciters; `tiny` ≈ 75 MB, `base` ≈ 145 MB | Purpose-built for Quran; runs **on-device** via Transformers.js (ONNX + WebGPU, WASM fallback), so it fits your offline PWA | **Free**; audio **never leaves device** | **Recommended default.** One-time cost: convert the HF model to ONNX. *Not* the model in Tarteel's app — see caveat below. |
| **Qurani.ai QRC API** | WebSocket "tilawa session"; returns `correct_words`, `skipped_words`, `tajweed_mistakes` **per word**, indexed to chapter/verse/word | Almost exactly your mechanic, already word-indexed; fastest way to a convincing pilot | Subscription + network; audio sent to server | **Best turnkey / premium-online tier.** |
| **ElevenLabs Scribe** | Best-in-class general Arabic ASR (~3.1% WER FLEURS); realtime available | Strong raw accuracy but **not** Quran-tuned; you'd still do your own alignment | ~$0.22–0.40 / audio-hour; network; audio to server | High-accuracy cloud fallback if on-device underperforms. |
| **OpenAI Whisper / gpt-4o-transcribe** | General multilingual ASR | Same shape as Scribe, weaker on Arabic in benchmarks | ~$0.36 / hr; network | Serviceable cloud fallback, not first choice. |
| **Azure Pronunciation Assessment** | Scores speech vs a **reference text** (accuracy/fluency/completeness) | Conceptually perfect, **but** phoneme-level scoring isn't fully supported for Arabic (ar-SA returns accuracy/offset/duration only) | Paid; network | Watch it mature; not reliable enough for Arabic yet. |
| **Web Speech API** (`webkitSpeechRecognition`) | Browser built-in STT | Tempting (zero deps) **but** requires network, and is **unreliable in a standalone home-screen PWA on iOS** — which is exactly how your game runs | Free; audio to Apple | Fine for a quick Safari-tab experiment; **not** a foundation for this app. |
| **Roll your own model + dataset** | Train a Quran ASR from scratch | — | Enormous | **No.** See 3.4. |

**Caveat on the open Tarteel models — verified July 2026.** Both `whisper-base-ar-quran` (apache-2.0, ~24k downloads/month) and `whisper-tiny-ar-quran` (apache-2.0) are genuinely open and free to use commercially. But they are the *older, smaller fine-tunes Tarteel chose to release in December 2022* — **not** the proprietary, far stronger model that powers the live Tarteel app (their "~4% WER, state-of-the-art" model, which is not downloadable and would require a partnership). A recent thread on the model page — *"Quran Transcription Results Differ from Mobile App"* — confirms the open model underperforms the app, and the cards are thinly documented ("trained on the None dataset / more information needed"). Practical implication: the published WER (~5.75%) is on *clean adult reciters*; expect meaningfully worse on young, accented, chanting voices. This is not a reason to avoid it — it's a real, legal, on-device way to prove the mechanic now — but it is the reason the product must be a forgiving *dimmer* and the reason the cloud tiers exist as accuracy upgrades. Tarteel's open **datasets** (`everyayah`, `tlog`) are also available if you later want to tune.

### 3.4 Why not build your own (in your own words: "I obviously can't")

You're right, and Tarteel's published ML journey is the receipt. To get to their accuracy they ran a crowdsourced-then-outsourced-then-in-house annotation operation: ~50 vetted annotators producing **500+ hours of labelled recitation per month**, an annotation-tooling odyssey (LabelStudio → AWS GroundTruth → a custom Retool app), and a from-scratch re-architecture after their first pipeline "rendered a lot of our annotation efforts moot." That is a company, not a feature. The correct move is to **consume** their open models (they literally published them for this) and other vendors' APIs, and spend your energy on the game.

### 3.5 The recommendation, and why (you asked me to choose)

**Default to on-device Tarteel Quran-Whisper**, with a graceful ladder around it:

1. **On-device Tarteel `-ar-quran` (tiny first, base if the device allows)** as the everyday recogniser. It is the only option that honours *all* of your design commitments at once: offline (your PWA works with no signal), free (no per-recitation cost as you scale to many kids), private (a child's voice never leaves the family's iPad — the single biggest parent-trust factor in a Qur'an app), and Quran-specialised. Run it in a Web Worker so the game never stutters; precache the model in your service worker so it's a one-time download.
2. **Qurani.ai QRC as an optional online tier** — for the pilot (fastest path to something convincing) and later perhaps a "connected mode" that adds tajwīd feedback the on-device model can't. Gate it behind explicit parent opt-in because audio leaves the device.
3. **Scribe as the break-glass cloud fallback** if on-device accuracy for young voices proves too low even after generous thresholds and the closed-set upgrade.
4. **Never** let any of them *block* — all of them feed the same forgiving dimmer from Section 2.

The reason on-device wins the *default* even though a cloud API might score a few points higher: your game's whole promise is "a link, shared between parents, that simply works" offline, made "with care by someone who understands what is being handled." An offline, private, free recogniser is congruent with that promise. Sending five-year-olds' voices to a server by default is not — so keep that behind a door the parent opens on purpose.

---

## 4. The narrow pilot — prove it on one surah

You asked to "prove it in a narrow use case, then leverage it in lots of places." Here's the narrowest test that actually proves the hard part.

### 4.1 Pick the surah

Use **Al-Kawthar** (3 short ayahs) or **Al-Ikhlas** (4). Both are already in World One, both already have Mishary Alafasy audio in your `audio/` folder, and both have real multi-word ayahs — so "right words in right order" is genuinely exercised, unlike a one-word test. Al-Kawthar's `kawthar.html` is already your reference implementation, which makes it the path of least resistance.

### 4.2 Prototype spec (single page, matches your vanilla-JS stack)

One self-contained HTML page — no framework, consistent with `kawthar.html`/`falaq.html`:

- **UI:** the ayah shown large (RTL), one big soft "speak" button (your two-button, low-dexterity input language), and the ayah's words rendered as separate spans that **light up** as they're matched — reusing your gem-light visual vocabulary.
- **Capture:** `MediaRecorder` → 16 kHz mono blob.
- **Recognise:** Transformers.js loading the ONNX-converted `tarteel-ai/whisper-tiny-ar-quran`, in a Web Worker. (For the very first spike you can prove the *scoring* half against Qurani QRC or even a text box you type the "heard" words into — the recogniser is swappable behind the same interface.)
- **Score:** the Section 3.1 pipeline — normalise, align, per-word match, `score` 0–1.
- **Behave:** show the lit words + score; `score ≥ THRESHOLD` → gem charges / gate opens; below → play the ayah as a hint; after N tries → open anyway. **Expose `THRESHOLD` and the per-word fuzzy cutoff as on-screen sliders** so you can tune live while a real child uses it.
- **Learn:** with a consent toggle, save `{audio, transcription, score, passed}` locally (or to a file) so a session with a few kids becomes your tuning set.

Because you specified "strategy doc, no running code," this is the spec to hand to whoever builds the spike (or to me next). It's a day or two of work and it answers the only question that matters: *do real kids get lit up and let through often enough, and blocked almost never?*

### 4.3 The metric that decides success

Track two numbers, and weight them very unequally:

- **False-reject rate** — child recited acceptably but the system withheld light. **This is the enemy.** Because of your no-failure philosophy, drive it toward zero, even at the cost of…
- **False-accept rate** — child recited poorly but got through. **Tolerable.** In a game whose only reward is hearing the surah whole, a generous pass just means a child who'll hear it correctly again next time.

If false-rejects are low at a threshold that still feels meaningful to the child, the mechanic works. If not, reach for the Section 3.2 upgrades (closed-set rescoring first) before you touch the product design — the product design is already correct.

### 4.4 From pilot to platform

Once one surah works, the capability generalises with almost no new risk, because the target text is the only thing that changes per ayah. Wire the same scorer into: gem-charge on pickup, the gate ceremony (recite-to-place), the Recitation Room sandbox, and the parent page's "words most missed." That's the "leverage in lots of places" you're after — one recogniser, one scorer, many moments.

---

## 5. Risks and how the design already absorbs them

- **Kid voices vs adult-trained models.** The models are trained on adult reciters, so raw accuracy on five-year-olds will be lower than the headline WER. *Absorbed by:* the dimmer-not-switch product design (a miss just replays the ayah), generous thresholds tuned to minimise false-rejects, and the closed-set upgrade if needed.
- **Noise, mic quality, chant cadence.** Real living rooms are loud; chanting isn't the speech these models saw most of. *Absorbed by:* Tier 0 voice-activity fallback, per-word partial credit, and never requiring a full clean pass.
- **iOS standalone-PWA microphone quirks.** Mic permission and the Web Speech API misbehave in home-screen PWA mode on iOS. *Absorbed by:* using `getUserMedia`/`MediaRecorder` + an on-device model rather than Web Speech; test in true standalone mode early.
- **First-run model download.** 75–145 MB on first use. *Absorbed by:* service-worker precache (you already precache the shell and recitations), a one-time "getting your reciter ready" moment, and preferring `tiny` on constrained iPads.
- **Privacy / parent trust.** The make-or-break for a Qur'an app aimed at kids. *Absorbed by:* on-device by default (nothing transmitted), any cloud tier strictly parent-opt-in, and recordings kept only with explicit consent.
- **Adab — a machine judging Qur'an.** Handle with care in copy and behaviour: the game *invites* and *celebrates*, it never "marks wrong." The words that don't light simply haven't lit *yet.* Keep the reciter's voice, not a score, as the thing the child is reaching toward.

---

## Sources

- [Tarteel `whisper-base-ar-quran` model card (Apache-2.0, WER 5.75%)](https://huggingface.co/tarteel-ai/whisper-base-ar-quran) · [`whisper-tiny-ar-quran`](https://huggingface.co/tarteel-ai/whisper-tiny-ar-quran) · [Tarteel AI on Hugging Face](https://huggingface.co/tarteel-ai)
- [Tarteel's ML Journey Part 2 — Data Annotation](https://tarteel.ai/blog/tarteels-ml-journey-part-2/) (why building your own dataset is a company, not a feature)
- [Qurani.ai QRC — Real-Time Recitation Correction API](https://qurani.ai/en/docs/2-advanced-tools/qrc) (word-indexed `correct_words`/`skipped_words` over WebSocket)
- [Transformers.js v3 — WebGPU, on-device inference](https://huggingface.co/blog/transformersjs-v3) · [Xenova whisper-web (in-browser Whisper)](https://github.com/xenova/whisper-web)
- [ElevenLabs Scribe — Arabic STT accuracy & pricing](https://elevenlabs.io/speech-to-text) · [Scribe accuracy (Arabic WER)](https://venturebeat.com/ai/elevenlabs-new-speech-to-text-model-scribe-is-here-with-highest-accuracy-rate-so-far-96-7-for-english)
- [Azure Pronunciation Assessment](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment) · [Arabic phoneme-support limitation](https://learn.microsoft.com/en-us/answers/questions/2283242/azure-speech-pronunciation-assessment-empty-phonem)
- [Web Speech API `SpeechRecognition` — iOS/offline limitations (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [The Tarteel Dataset (crowd-sourced labelled recitation, paper)](https://openreview.net/pdf?id=TAdzPkgnnV8) · [`obadx/recitation-segmenter-v2` (2025 pronunciation-error work)](https://huggingface.co/obadx/recitation-segmenter-v2)
