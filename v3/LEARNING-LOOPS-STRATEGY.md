# Gems of Light: Memorization and Learning-Loop Strategy

## Executive conclusion

Gems of Light has probably been too restrictive about quizzes and testing.

The original instinct remains sound: the game should not make a young child feel examined, judged, shamed, or trapped in schoolwork. But the current principle conflates two different things:

- **Judgmental testing:** grades, red crosses, lost rewards, public comparison, harsh correction, or blocked progress.
- **Retrieval practice:** asking the child to remember something before supplying it again.

The first is inappropriate for Gems of Light. The second is likely essential if memorization is a genuine product goal.

The project doctrine should therefore change from **“no quizzes”** to:

> **No punitive or judgmental testing. Use frequent, playful, well-supported retrieval. Mistakes increase support; they never reduce status.**

The platformer does not need to carry the full learning burden. It can be the motivation and exposure layer, while Campfire, Shrine, and Remembering become progressively more explicit memorization experiences.

## A clearer division of labor

The game can assign a distinct educational job to each part of its existing loop:

1. **Adventure: desire and exposure**  
   The platformer gives the child a reason to enter, return, explore, and hear the ayahs.

2. **Campfire: guided acquisition**  
   The child hears the complete surah and can participate in short, legible call-and-response moments.

3. **Shrine: immediate retrieval**  
   The child identifies, anticipates, completes, or recites recently encountered material with responsive help.

4. **Remembering: delayed retrieval**  
   Earlier material returns after time has passed, with prompts selected according to the support previously required.

A child-facing explanation could be as simple as:

> In the Adventure, you find the ayahs. At the Campfire, you learn them. At the Shrine, you remember them.

The learning activity does not have to be disguised. Young children understand clear turn-taking when the world visibly listens and responds.

## The existing foundation

The current Shrine is already more than visual sorting. It is an auditory next-in-sequence exercise:

- One socket is presented at a time.
- Shuffled gems can play their associated ayahs.
- The child chooses which ayah belongs next.
- Incorrect choices return quietly.
- The game supplies increasing help and eventually places the answer.
- Telemetry records attempts, listening, misses, and assistance.

This is a legitimate recognition and sequencing activity. Its limitation is that it can be completed through repeated selection or brute force without the child producing Quran aloud.

Remembering also provides the beginnings of spaced review, but currently reuses the same Shrine interaction. The opportunity is to preserve this gentle structure while expanding the cognitive actions the child performs.

## The learning progression

Rather than building many unrelated minigames, Gems of Light should vary how much support surrounds the same ayah:

```text
LISTEN → ECHO → RECOGNIZE → COMPLETE → CONTINUE → RECITE → RECALL LATER
```

These are levels of independence, not merely different puzzle skins.

### Listen

The child hears a correct model with a clear relationship between the audio, gem, environment, and sequence position.

### Echo

The reciter performs a short phrase and the child repeats it during an unmistakable “your turn” moment.

### Recognize

The child identifies the correct ayah, continuation, or position among a small number of authentic audio choices.

### Complete

The reciter pauses before a final word or short phrase and the child supplies what is missing.

### Continue

The child hears ayah N and begins ayah N+1, initially with cues and later without them.

### Recite

The child attempts a complete ayah or short surah while the game follows, waits, and supplies help when needed.

### Recall later

The same material returns on a later session, including prompts from the middle rather than always starting at the beginning.

## Puzzle and practice families

All of the following can be auditory, wordless, and appropriate for pre-readers.

### 1. What comes next?

The child hears one ayah, explores two audible gems, and selects the next ayah. Later versions ask the child to say the opening of the next ayah instead of selecting it.

### 2. The missing light

A short sequence plays with one ayah omitted. The child identifies or recites what belongs in the gap.

### 3. Join the two halves

The child matches an authentic ayah opening with its authentic continuation. Early versions should contain only two or three distinct choices.

### 4. Catch the repeat

A short sequence contains an unintended repetition. The child notices where the sequence failed to advance.

### 5. Finish the echo

The reciter pauses before the final word or phrase. Support can fade from a nearly complete model to a first-word cue and eventually no cue.

### 6. Your turn comes next

The reciter completes one ayah and the child begins the next. This directly practices transitions, which can otherwise remain weak even when a child can recite from the beginning.

### 7. Recite and reveal

The landscape progressively awakens while the child recites. The response can initially reflect participation and later, if validated, likely progress through expected words.

### 8. Random starting points

Once a surah is relatively secure, Remembering begins from a middle ayah and asks the child to continue. This distinguishes flexible recall from a single memorized chain that only works from the beginning.

### 9. Someone needs your help

A creature from an older world sings an opening and waits for the child to continue. This gives spaced review a narrative reason to occur.

Pair matching, ordering, and recognition remain useful scaffolds. They should not be treated as the endpoint if independent oral recitation is the desired outcome.

The game should not repeatedly play deliberately malformed Quran as a distractor. Distractors should be other correctly recorded ayahs or phrases so that the child is not trained on plausible but incorrect forms.

## Voice checking: levels of evidence

The game must distinguish what its microphone system actually knows.

### Level 1: speech detected

The system detects vocal activity during the child’s turn. This can awaken a flower, character, gem, or part of the landscape.

This proves participation only. Humming, background media, a sibling, or unrelated speech could also trigger it. The response should mean **“I heard you join in,”** not **“your recitation was correct.”**

### Level 2: attempt shape detected

The system uses duration, pauses, rhythm, or energy to estimate whether the child made a phrase-shaped attempt.

This can make the response feel more alive but still does not establish that the correct Quran was recited.

### Level 3: expected words probably detected

A constrained recognizer looks for the expected words or compares the utterance against a small set of candidate ayahs.

This provides useful partial evidence, but young voices, accents, hesitation, room noise, shared phrases, microphone quality, and model hallucination can all cause errors. It should be used for gentle assistance and progress animation before it is used for firm correctness judgments.

### Level 4: full recitation, pronunciation, or tajweed assessment

This is a substantial research and validation system. It should not be an early product promise. Gems of Light should never tell a child that their Quran recitation is wrong based solely on an uncertain model.

When confidence is low, the response should be:

> Let’s hear this part together.

It should not be:

> You recited incorrectly.

## Existing v2 technical evidence

The v2 Recitation Room is a meaningful prototype foundation rather than merely a written proposal. It includes:

- Voice activity detection.
- Offline Quran-tuned speech recognition.
- Quran-specific normalization and fuzzy word alignment.
- A reusable engine-adapter structure.
- Gentle assistance after repeated attempts.
- Automated scoring and ASR tests.

The current automated tests pass, and clean adult reciter clips were identified successfully in the local test set. This does **not** establish reliability for children, noisy rooms, or target phones.

There is also a concrete false-acceptance problem: ayahs sharing common phrases can score above the current forgiving threshold. That threshold may be suitable for an encouraging “light the words you probably said” interaction, but it is not sufficient proof that the child supplied the correct next ayah.

The current local speech model is also too large to drop directly into the present Cloudflare staging deployment without a hosting, model-size, or asset-sharding solution.

The v2 work should therefore be treated as a laboratory and reusable starting point, not silently ported as a trusted assessment system.

## A gentle failure model

Retrieval requires the possibility that the child will not immediately remember. That does not require punishment.

A suitable interaction is:

1. The child receives a prompt.
2. The child attempts to remember.
3. After hesitation, the first word or opening sound is supplied.
4. If more help is needed, a larger phrase plays.
5. Eventually the complete correct model plays.
6. The item returns later with slightly less help.

Every child reaches a positive conclusion. Internally, the game records the degree of independence:

- No response; complete model needed.
- Participated in an echo.
- Recognized the correct option.
- Recalled with a first-word cue.
- Recalled with a partial phrase cue.
- Made an independent oral attempt.
- Produced the expected ayah or transition with strong evidence.

This support profile is more informative than a binary correct/incorrect result.

Main Adventure progression should not depend on machine-certified recitation until child-specific accuracy has been demonstrated. A short attempt can be part of the ceremony, while greater independence can brighten the Grand Gem, awaken additional details, or deepen the Shrine without blocking the journey.

## What to borrow from Duolingo

The most transferable Duolingo principle is not its reward economy. It is the curriculum architecture: easier recognition gradually becomes harder production, multiple modalities surround the same material, and older material returns according to time and previous difficulty.

### Borrow

- Short, focused exercises.
- Frequent achievable successes.
- Gradual withdrawal of cues.
- Recognition followed by production.
- Immediate playback of the correct model.
- Review targeted at weak phrases and transitions.
- Spacing across days.
- A few high-information prompts rather than exhaustive testing.

### Do not automatically borrow

- Hearts or lives.
- Streak-loss anxiety.
- XP farming.
- Leagues and leaderboards.
- Timed pressure.
- Currency economies.
- Punitive error feedback.
- Treating completion as proof of learning.

## Recommended first experiments

### Prototype 1: echo and response

The reciter says one short phrase. A clear animation gives the child a turn. Detected vocal participation awakens the environment.

**Question:** Does the child sincerely echo, or merely produce any sound to trigger the response?

### Prototype 2: auditory “what comes next?”

The child hears one ayah and chooses between two audible continuations. A later version asks for the spoken opening of the next ayah.

**Question:** Does auditory recognition improve, and does it transfer to spoken recall?

### Prototype 3: finish the phrase

The reciter pauses before a final word or short phrase. The first version responds to participation; a later version cautiously looks for the constrained expected phrase.

**Question:** Can the system support genuine completion without frustrating false rejection?

### Prototype 4: gentle full recitation

The child attempts a known short surah. The world follows, waits, supplies audio support after hesitation, and records how much help was needed. Parent review can remain an option when automatic evidence is uncertain.

**Question:** Does assistance decrease across sessions, and does recall persist the following day?

## What to measure

Completion alone is not evidence of memorization. Useful measures include:

- Whether the child vocalizes voluntarily.
- Whether the child begins before the model or cue.
- The level of support required for each phrase or transition.
- Whether support decreases across sessions.
- Whether the child can continue from a middle ayah.
- Whether recognition exercises transfer to unaided speech.
- Next-day recall without an immediate replay.
- False acceptance and false rejection rates by age, device, and noise level.
- Confusion, requests for help, or distress after microphone feedback.
- Voluntary return to a learning activity.
- Parent confidence that the feedback is honest.

## Strategic product test

The “replace the Quran with a chime” test remains useful.

In the current Adventure, replacing the Quran with a chime might leave much of the platforming experience intact. That indicates that Adventure primarily supplies motivation and exposure.

In a well-designed memorization interaction, replacing the Quran with a chime would destroy the activity, because the child must use knowledge of the ayah to echo, anticipate, complete, continue, or recite.

This leads to a more defensible product position:

> **Gems of Light is an appealing platform adventure connected to a gentle, increasingly serious memorization practice. The platformer earns return; the learning loops perform the memorization work.**

## Research basis and cautions

Published learning research supports retrieval practice and spaced review, including benefits for young learners. It does not directly validate any specific Gems of Light puzzle, dosage, reward structure, or voice model. Those require controlled observation with children and delayed-recall measures.

Useful sources:

- [Roediger and Karpicke: retrieval practice and long-term retention](https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x)
- [Retrieval-practice evidence with elementary-age children](https://pmc.ncbi.nlm.nih.gov/articles/PMC4786565/)
- [Cepeda et al.: spacing meta-analysis](https://pubmed.ncbi.nlm.nih.gov/16719566/)
- [Duolingo practice modes and targeted review](https://blog.duolingo.com/guide-to-duolingo-practice-hub/)
- [Review of automatic speech recognition for children](https://www.mdpi.com/2076-3417/12/9/4419)
- [Quran ASR and adult/child generalization concerns](https://www.open-access.bcu.ac.uk/13502/)
- [Tarteel hide-and-recite functionality](https://support.tarteel.ai/en/articles/12414416-hide-ayahs)
- [Tarteel mistake-detection functionality](https://support.tarteel.ai/en/articles/12414419-how-to-activate-mistake-detection)

Current Quran products also demonstrate market interest in missing-word prompts, ayah ordering, next-ayah exercises, hidden-text recitation, recordings, parent review, and spaced revision. Their feature claims establish that these interaction patterns exist; they should not be treated as independent evidence of learning outcomes.

