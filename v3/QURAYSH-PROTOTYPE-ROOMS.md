# Five Prototype Rooms for Surah Al-Quraysh (106)

**Design brief — grounded in [LEARNING-LOOPS-STRATEGY.md](./LEARNING-LOOPS-STRATEGY.md)**
**Status: proposal, not yet playtested. Verdicts go to PLAN §10 / reviews per the working rules.**

---

## Why Quraysh, and what these rooms are

Surah Quraysh is four short ayaat with an unusually concrete, child-legible
imagery arc: a caravan sets out (1), it travels through winter and summer (2),
it arrives home at the House (3), and there the travelers are fed and made
safe (4). Journey → arrival → provision → safety. Every room below borrows
its metaphor directly from the ayah it teaches, so the world's imagery and
the meaning-form connection reinforce each other without a single word of
text instruction.

These are five **standalone prototype rooms** in the v3 prototype-shelf
tradition: each is a self-contained scene reachable from the debug shelf,
each tests one hypothesis, and each is deliberately a *different paradigm* —
a different thing the child does with hands, voice, and attention. They are
not five variations of the Shrine. Together they span the strategy doc's
progression:

```text
LISTEN → ECHO → RECOGNIZE → COMPLETE → CONTINUE → RECITE → RECALL LATER
```

Every room obeys the doctrine verbatim: **no punitive or judgmental testing;
frequent, playful, well-supported retrieval; mistakes increase support, never
reduce status.** Every room passes the chime test — replace the Quran audio
with a chime and the activity collapses, because the child must *use*
knowledge of the ayah to act. And every room respects the hard constraint on
distractors: the game never plays deliberately malformed Quran. Wrong-answer
material is always another correctly recorded ayah or authentic phrase, and
sequence errors are only ever *repetitions or omissions* of correct audio —
never corrupted recitation.

A note on interaction plumbing shared by all five: the "hesitation" that
triggers support is a tuned timer (start around 4–5 seconds, exposed in the
tuning panel), and every room logs the same independence telemetry the
Shrine already records — which rung of the support ladder the child needed
(no response / echoed / recognized / recalled with first-word cue / recalled
with phrase cue / independent attempt / strong evidence of production). That
support profile, not completion, is the data product of these prototypes.

---

## Room 1 — The Caravan Road

### Paradigm and core mechanic

**A walkable memory palace.** This is a spatial-embodied paradigm: the surah
is laid out as a *place*, and the child's body (avatar) moves through it.
The room is a single long side-scrolling road with four unmistakable
landmarks in fixed order — the city gate (ayah 1), the two-weather pass
where one side is snowy and one side is sunlit (ayah 2), the House on the
hill (ayah 3), and the lantern-lit feast garden (ayah 4). The child walks
the caravan (a lead camel plus a string of little ones) along the road.
Walking *is* the interaction: the recitation and the journey are locked
together. Each landmark sings its ayah as the caravan passes through it, and
the caravan will not walk through silence — the road only carries you while
its ayah is sounding.

What the child does with their hands: holds the thumbstick to walk, releases
to rest. What they do with their attention: bind each ayah to a *location*.
This is the method of loci built for a five-year-old — not taught, just
embodied.

### Learning target

Primarily **LISTEN**, maturing into **RECOGNIZE**, with a designed hook into
**RECALL LATER**. The specific skill is **sequence-position encoding**:
knowing not just the sounds of the ayaat but *where each one lives in the
order*. The strategy doc notes that a memorized surah can exist as a single
fragile chain that only works from the beginning (family 8, "random starting
points"); spatial anchoring is the pre-reader's tool for breaking that
fragility, because a place can be entered from the middle. A child who can
answer "which ayah sings at the snowy pass?" has positional knowledge no
start-to-finish chain gives them.

### Gameplay loop

The room opens at the city gate at dawn. The lead camel looks back at the
child and stamps once — the wordless "let's go." As the child walks, the
gate's arch glows and ayah 1 plays; the caravan's walking pace subtly
synchronizes to the recitation's rhythm. At the end of the first ayah the
road ahead brightens and the pass comes into view. Passing through the
two-weather pass plays ayah 2 — the snow side glitters on «الشتاء», the sun
side flares on «الصيف» (this per-word timing reuses the read-along timing
data already built for sixteen surahs). The House plays ayah 3 as the child
climbs its hill; the feast garden plays ayah 4 as lanterns light one by one.
First traversal complete: the whole road now glows behind them, and the
caravan settles down to rest. That is the entire first-visit loop —
pure LISTEN, maybe ninety seconds.

On the *second* traversal (same visit or next), the road changes one thing:
each landmark now waits, dim, and hums only the first word of its ayah as
the child approaches. Two small floating lights hover at the landmark; each
can be tapped to hear a candidate ayah (the correct one and one other ayah
*from this same surah* — an authentic recording, per the distractor rule).
The child picks the light that belongs here; the landmark accepts it, blooms,
and plays the full ayah as the caravan walks through. This is RECOGNIZE,
staged in space.

The RECALL LATER hook: when Quraysh later enters the Remembering, the
dream-shrine can open *directly onto the middle of the road* — the child
wakes at the snowy pass, not the gate — and the familiar place itself is the
retrieval cue for a middle-start. Random starting points stop being an
abstract exercise and become "oh, I know where I am."

### Feedback and failure design

There is no failable state on first traversal; it is exposure. In recognize
mode, the gentle failure ladder maps exactly to the doc's six steps: the
prompt is the dim landmark and its first-word hum (step 1); the child
considers the two lights (step 2); after the hesitation window, the landmark
hums a *longer* opening phrase (step 3); after a second window, the correct
light pulses softly in time with the hum — a wordless point (step 4); if the
child still doesn't choose, the light drifts into place by itself and the
full ayah plays as the landmark blooms exactly as brightly as ever (step 5).
A wrong tap is treated as *listening*, not error: the tapped light simply
plays its ayah in full (hearing more Quran is never a penalty), then drifts
gently back to hovering. Nothing dims, nothing is lost, no sound of failure
exists in the room. Next visit, that landmark starts one support rung higher
(step 6).

### Voice/microphone role

None required — this room is deliberately mic-free so it can ship and be
playtested on any device immediately. One optional Level 1 flourish: if mic
permission already exists and speech is detected while the caravan walks,
the little camels' bells shimmer — "I heard you join in," participation
only, exactly as the doc scopes Level 1. If voice is absent nothing is
missing; the room is complete without it.

### Why it's distinct

Against the other four rooms: **Raising the House** is manual-constructive
and works *inside* one ayah at phrase granularity; the Caravan Road works
*across* ayaat at sequence granularity and the hands do nothing but walk.
**The Hungry Little Camel** is social and vocal — the child produces Quran
for someone; here the child produces nothing, they *situate* it. **The Night
Watch** asks the child to judge the game's recitation with pure ears and no
avatar; here the spatial body is the whole point. **The Feast of the House**
is sustained leading production at the far end of the progression; this room
is the far *beginning* — LISTEN and RECOGNIZE with a spatial encoding twist
none of the puzzle families in the strategy doc currently provide (families
1, 2 and 8 test order, but nothing yet *builds* positional knowledge
pre-emptively).

### Prototype scope

One side-scrolling road scene with four landmark props (gate, pass, House,
garden), each with dim/humming/blooming states; the existing caravan-walk
sprite set (lead camel + two followers, walk and rest); Quraysh ayah audio
segmented per ayah (already implied by the reciter registry) plus first-word
and opening-phrase sub-clips for the cue ladder; two floating-light pickups
with tap-to-audition; the walk-locked-to-audio movement rule; hesitation
timers wired to the tuning panel; independence telemetry per landmark.
`node v3/tools/check.mjs` green as with any world file. No mic, no new tech.

**The question this prototype answers:** does binding ayaat to walkable
locations produce positional knowledge — concretely, after two or three
visits, can the child pick the right ayah at a landmark *entered from the
middle* faster and with less support than the same child sequencing gems at
a Shrine?

---

## Room 2 — Raising the House

### Paradigm and core mechanic

**A constructive, hands-on building paradigm.** The child raises the Bayt —
the House of ayah 3 — course by course, with their hands. The room is a
single fixed scene: a foundation on the hilltop, a small stack of glowing
stones at the child's feet, and a warm master-builder character (wordless,
like all v3 characters) who works alongside them. Each stone carries one
*phrase* of one ayah — not a whole ayah. The wall has one open slot at a
time, in reading order. The child picks up a stone (drag or tap-to-lift) and
offers it to the slot. The core mechanic is **completion at sub-ayah
granularity through construction**: the wall hums the opening of the phrase
it needs, and the child must find the stone that continues it.

This is the room where the game finally works *inside* an ayah. The Shrine,
and families 1–6, almost all operate at ayah granularity. But the strategy
doc's own telemetry section says the high-information data is "the level of
support required for each **phrase or transition**" — and long ayaat like
Quraysh 2 and 4 have interior seams (رحلة الشتاء والصيف؛ أطعمهم من جوع /
وآمنهم من خوف) that ayah-level puzzles never exercise.

### Learning target

**COMPLETE**, with a secondary foothold in **ECHO**. The specific skill is
**intra-ayah word-order encoding and phonological linking** — knowing that
«فليعبدوا» is continued by «رب هذا البيت», that «أطعمهم من جوع» is followed by
«وآمنهم من خوف». These interior joins are exactly where children's recitation
wobbles even when the ayah openings are solid.

### Gameplay loop

The room opens on the foundation and the builder character, who taps the
first empty slot. The slot glows and *sings the ayah from its beginning up
to the gap*, then goes expectantly quiet — the classic "finish the echo"
prompt (family 5), embodied in masonry. Two or three stones lie nearby. The
child can tap any stone to audition it: it plays its phrase, in full,
authentically. When the child offers the correct stone to the slot, it
settles in with a satisfying stone-on-stone thump, and the wall immediately
*replays the whole ayah so far* from the top — the doc's "immediate playback
of the correct model," which doubles as the child hearing the join they just
made in context. Then the next slot opens.

The build order follows the surah: the four courses of the House are the
four ayaat, each course made of that ayah's two-to-three natural phrase
stones. When a course completes, its whole ayah plays as the course-line
lights, and the builder character does a small delighted bow. When the final
stone of ayah 4 is placed, the completed House glows from within, the
Quraysh recitation plays entire, and lanterns rise around it — the room's
quiet ceremony. Total length: one short focused session, per the doc.

An important audio rule keeps this halal with respect to the distractor
constraint: stones **never** play in wall-context until correctly placed, so
the child never hears an out-of-order recitation of the ayah. Auditioning a
stone plays that phrase alone, as recorded — an authentic fragment, not a
malformed sequence. A wrong stone offered to the slot does not sound at all
in place; it simply doesn't settle (see below).

### Feedback and failure design

Prompt: the slot sings up-to-the-gap and waits (step 1). The child auditions
and attempts (step 2). If the child offers a wrong stone, the slot doesn't
grip it — the stone hops softly back to the pile, the same neutral
quiet-return the Shrine already uses; no buzz, no shake of the builder's
head. After the hesitation window, support rises: the slot re-sings the
run-up and this time adds the **first word** of the missing phrase (step 3).
Next window: it sings the run-up plus **most of the phrase**, trailing off
just before the end (step 4) — by now only one stone plausibly fits and most
children will feel clever, which is the point. Finally the correct stone
lifts itself, glows, and the builder gently guides the child's view as it
settles and the full model plays (step 5). The wall built with maximum help
is pixel-identical to the wall built independently — support never marks the
work. The room records which rung each phrase needed, and on a return visit
each slot begins one rung less supported than last time (step 6).

### Voice/microphone role

Optional Level 1–2, used for *echo*, not assessment. After any stone
settles and the join replays, the builder cups an ear — an unmistakable
your-turn moment. If speech of roughly phrase-length shape is detected
(Level 2), the freshly laid stone kindles with inner light. If the child
says nothing, the moment simply passes; the build continues identically.
No mic, no permission, or no confidence → the ear-cup becomes a shared
hum from the builder and the stone kindles anyway on the next placement.
The mic decorates this room; it never gates it.

### Why it's distinct

**The Caravan Road** is whole-ayah and spatial-locomotive; this room is
sub-ayah and manual-constructive — the child's hands do fine-grained
deliberate work, and the cognitive demand is *within-line* order, not
between-line order. **The Hungry Little Camel** demands vocal production
across an ayah *transition*; this room demands manipulative completion
*inside* an ayah and speaks only optionally. **The Night Watch** has no
hands at all — pure receptive judgment. **The Feast** is open-throated whole-
surah production. In progression terms this room owns the COMPLETE stage,
which none of the other four target directly, and it addresses the phrase-
seam gap that the strategy doc's telemetry wishlist names but its nine
families only reach through family 5 — which it extends from "final word of
an ayah" to every interior join, made physical.

### Prototype scope

One fixed scene; the House as a four-course wall with per-slot states
(waiting / singing / gripping / settled / kindled); eight-to-ten stone props
with audition states; phrase-segmented Quraysh audio (this is the real asset
work: each ayah cut at natural phrase seams, plus run-up clips and first-word
clips — an extension of the existing per-word read-along timings, so mostly
tooling reuse); builder character with three animations (point, bow,
ear-cup); quiet-return physics for wrong stones; telemetry per slot.
Optional: Level 1/2 vocal-activity detection reused from the v2 lab's VAD
component only (no recognizer).

**The question this prototype answers:** do interior phrase joins actually
need dedicated practice — i.e., do children who breeze through ayah-level
sequencing at the Shrine show measurable support-need at Quraysh's interior
seams, and does that support-need fall across two visits to this room?

---

## Room 3 — The Hungry Little Camel

### Paradigm and core mechanic

**A social, nurturing, turn-taking paradigm — the child recites *for
someone*.** A camel calf has strayed from the caravan and sits alone in the
dusk, hungry and a little afraid — ayah 4's two conditions, embodied in the
most sympathy-inducing creature the art style can draw. The calf cannot
settle until it hears the surah its caravan sings. But it only knows how
each part *starts*: it sings an ayah's opening in its small warbling voice
(melodically shaped recitation-adjacent humming, not Quran — the calf is a
creature, and this also keeps every actual Quranic model in the reciter's
voice), then looks at the child and waits. The child's voice is the
mechanic: they continue where the calf left off. Each ayah the child
carries forward feeds and calms the calf visibly — a bowl fills, the
trembling stops, the calf leans in.

This is family 9 ("someone needs your help") and family 6 ("your turn comes
next") fused and given a *reason*: the recitation is care. The chime test
destroys this room instantly — a chime cannot continue what the calf
started.

### Learning target

**CONTINUE**, the transition skill, with a built-in bridge to **RECALL
LATER**. The specific skill is **transitional fluency**: launching ayah N+1
from a cue, and eventually launching mid-surah from a cold start. The
strategy doc singles transitions out as the thing that "can otherwise remain
weak even when a child can recite from the beginning." The RECALL LATER
bridge is structural: once this room exists, the calf (grown a little!) can
reappear in *later* worlds' quiet corners as the narrative vehicle for
spaced review of Quraysh — the doc's family 9 exactly.

### Gameplay loop

The room opens on the dusk clearing; the calf's small cry draws the child
to it. Sitting beside the calf (walk close, avatar sits automatically) is
the entire "start" interaction. The calf hums the opening of ayah 1 —
recognizably the opening's rise and length — then goes quiet, ears forward,
eyes on the player. A soft firefly light drifts from the calf to hover in
front of the child's avatar: the unmistakable wordless "your turn." The
child speaks. On vocal response, the fireflies multiply and swirl, the
calf's ears relax, and — crucially — the *reciter's* full correct model of
that ayah then plays warmly over the scene as the calf sighs and the bowl
beside it gains a share of food. (The correct model always follows the
child's attempt, whatever its quality: the child hears the truth of the
ayah within seconds of producing it, and the room never needs to judge the
attempt to justify the reward.) The calf then hums the opening of ayah 2,
and the loop repeats through all four ayaat. When the fourth is done the
calf is fed and unafraid — it stands, nuzzles the avatar, and the caravan's
bells sound in the distance as it trots home. Session over: four turns,
a few minutes.

On later visits the calf hums *less* — first-word only instead of full
opening (gradual cue withdrawal), and eventually it just looks at the child
and flicks its ears expectantly for the next ayah, the cue faded to nothing
but the social moment itself.

### Feedback and failure design

The gentle ladder is delivered entirely through the fiction. Prompt: the
calf's hum plus the your-turn firefly (steps 1–2). If the child stays
silent through the hesitation window, the calf tries again a little more
fully — it hums the opening *plus the reciter's first word* rides softly on
top (step 3). Still nothing: the reciter's voice quietly joins for the
first phrase, an invitation to speak along rather than alone (step 4) —
this is "let's hear this part together" made literal. Still nothing: the
full model plays, the calf is fed exactly as much, and the room simply
proceeds (step 5). There is no wrong-answer branch at all in the primary
loop, because the room (at Levels 1–2) cannot and does not judge content —
any sincere vocal turn advances the fiction and is *immediately followed by
the correct model*, which is the actual teacher. A child who bleats
nonsense meets no rebuke; they meet the correct ayah, again, warmly. The
telemetry, meanwhile, honestly records what the machine actually knows:
turn taken / turn shape plausible / expected opening probably present.
Next visit starts each ayah one support rung down (step 6).

### Voice/microphone role

This is the mic room, scoped exactly to the doc's evidence levels. Level 1
(speech detected) advances the loop and animates the fireflies — proof of
participation, rewarded as participation. Level 2 (attempt shape) modulates
warmth: a phrase-length attempt makes the calf close its eyes happily; a
single short syllable still counts but earns the smaller response. Level 3
runs **silently in the background if available** — a constrained
recognizer listening only for the expected ayah's opening words — and is
used for telemetry and for one cautious enhancement only: when Level 3
confidence is high across a whole visit, the calf's coat gains a faint
starlit shimmer on departure. Never the reverse; low confidence changes
nothing visible. No mic or no permission → the firefly hovers, the child
may speak or not, and a gentle tap on the calf takes the turn instead
(recorded as "no vocal evidence") — the room degrades to a listening/
turn-taking experience rather than breaking. Main progression never
depends on any of this, per the doc's hard rule.

### Why it's distinct

**The Caravan Road** and **the Night Watch** never require the child's
voice; this room *is* the voice. **Raising the House** speaks optionally
inside an ayah with the hands doing the real work; here the hands do
nothing and the voice carries transitions *between* ayaat. **The Feast**
also uses voice but as sustained solo leadership across the whole surah;
this room is dialogic — short turns, socially scaffolded, cue-supported —
the developmental step *before* the Feast. Cognitively it is the only room
whose demand is production-from-auditory-cue under social motivation, and
the only one designed from birth to become the spaced-review vehicle
(RECALL LATER) in later worlds.

### Prototype scope

One dusk clearing scene; the calf with six states (crying, humming,
waiting-ears-forward, comforted, fed, departing) and the grown-calf
palette for future reuse; firefly your-turn particle; food bowl with four
fill states; calf hum audio — four openings, melodic non-Quranic
creature-voice (a real, careful audio design task); full reciter models per
ayah plus first-word overlays; VAD (Level 1/2) from the v2 lab; hesitation
ladder timers on the tuning panel; honest three-tier telemetry. The Level 3
recognizer is explicitly **out of scope** for the first build (the v2 model
doesn't fit Cloudflare staging anyway, per the strategy doc) — ship
Levels 1/2 first.

**The question this prototype answers:** the doc's Prototype 1 question,
sharpened — does a socially motivated your-turn moment elicit *sincere*
echo/continuation rather than noise-to-trigger-the-response, and do
children take the vocal turn voluntarily on a second visit?

---

## Room 4 — The Night Watch

### Paradigm and core mechanic

**An auditory vigilance and judgment paradigm — the child is the listener,
not the performer.** Night, the caravan camped in a ring, a string of four
lanterns hung between tent poles — one per ayah. The caravan sings its
night-song: the surah, ayah by ayah, each lantern kindling as its ayah
sounds. But the singers are sleepy. Some nights the song *stalls* — an ayah
repeats and the next lantern fails to light (family 4, "catch the repeat");
some nights the song *skips* — a lantern is passed over dark while the song
jumps ahead (family 2, "the missing light"). The child's job is the night
watch: notice, and set it right. The single interaction is tapping the
lantern that *should* sing — which both identifies the fault and repairs it:
the tapped lantern kindles and its ayah plays, and the song resumes
correctly from there.

The role reversal is the paradigm: everywhere else the game models and the
child performs; here the game performs (imperfectly, in sequence only) and
the child monitors. Nothing in this room ever plays malformed Quran — the
only possible faults are *repetition* and *omission* of perfectly recorded
ayaat, the two fault types the strategy doc explicitly designs families
around, so the constraint is honored by construction.

### Learning target

Deep **RECOGNIZE**, building toward the internal monitor that **RECITE**
quietly depends on. The specific skill is **sequence-error detection** —
the metacognitive half of memorization. A child who can *hear* that the
song failed to advance is running an internal model of the correct order
against incoming audio in real time; that internal model is exactly what
they'll later recite from. This is a stage the seven-step progression
implies but no existing family fully owns as a room.

### Gameplay loop

The room opens with one clean, correct performance: all four lanterns
kindle in order while the child watches — a calibration pass that is also
pure LISTEN exposure. Then the caravan leader (a nodding, heavy-lidded
elder by the fire) gestures to the child and hands over a small watchman's
staff: your watch now. The song begins again. On the first watch, the fault
is maximally legible: ayah 2 plays, its lantern flickers... and ayah 2
plays *again* while lantern 3 stays dark. The scene holds — song looping
gently on the stalled ayah, lantern 3 conspicuously unlit. The child taps
lantern 3; it kindles, ayah 3 rings out, the sleepy singer startles
comically awake, and the song carries through ayah 4 to a completed, fully
lit line. Warm laughter around the fire, the elder nods deeply. Subsequent
watches vary the fault position and introduce the skip variant (lantern 2
dark, song already on ayah 3 — the child taps back to the dark lantern to
restore what was missed). Three or four watches make a session. Later
visits shorten the audio cues: faults occur after only the *opening
phrase* of each ayah rather than the full ayah, demanding a faster internal
model.

### Feedback and failure design

The room's failure design is unusually natural because the *game* is the
one making mistakes — the child can only ever be the helper. If the child
doesn't notice a stall, the ladder rises scenically: first the dark
lantern sways slightly (step 3-equivalent — a visual first-word cue);
then the stalled loop adds a gentle questioning "hmm?" from the elder and
the dark lantern pulses in rhythm with where its ayah *should* begin
(step 4); finally the elder reaches over and taps the lantern himself —
it kindles, the correct ayah plays, the song completes, and the watch ends
just as warmly (step 5). If the child taps an already-lit or not-yet-due
lantern, that lantern simply replays its own ayah — again, a "wrong" tap
only ever produces more correct Quran and quietly disambiguates the order —
and the scene continues waiting. Every watch ends with the full line lit
and the song whole. Telemetry records detection latency and cue rung per
fault, and next session's faults start one rung less supported (step 6).

### Voice/microphone role

None. This is by design the pure-ears, zero-mic, zero-production room —
the receptive complement to Room 3 and the cheapest room to build and test
on any device. (One deliberate omission: no Level 1 "sing along" flourish
here, because this room's entire skill is *listening for the fault*, and
inviting the child to vocalize over the song would fight the mechanic.)

### Why it's distinct

It is the only room where the child produces nothing and places nothing:
**the Caravan Road** walks, **Raising the House** builds, **the Camel** and
**the Feast** speak — the Night Watch only *listens and judges*. Its
cognitive demand (real-time comparison of incoming audio against an
internal sequence model) is absent from the other four, and its
role-reversal framing — the child as caretaker of the *adults'* recitation
— is a social inversion of Room 3's child-helps-creature and a status gift
the doctrine smiles on: the child is promoted, never examined. In
progression terms it hardens RECOGNIZE into monitoring, the hinge between
recognizing and reciting.

### Prototype scope

One night-camp scene; four lanterns with dark/flicker/lit/pulse states;
elder character with nod/hmm/reach animations; the fault engine (a tiny
sequencer that plays ayah audio with injectable repeat/skip faults and a
cue-length parameter); watchman's staff pickup; ladder timers on the
tuning panel; detection-latency telemetry. Reuses per-ayah audio as-is —
no new audio assets at all beyond one elder "hmm." This is the smallest
build of the five.

**The question this prototype answers:** can children this age detect
sequence faults in material they're still learning — and does detection
ability track (or *predict*) their support-need in production rooms? If
Night Watch performance turns out to forecast Shrine/recitation
independence, the game gains a joyful, mic-free assessment instrument.

---

## Room 5 — The Feast of the House

### Paradigm and core mechanic

**A generative, child-led performance paradigm — recite and reveal, at
whole-surah scale.** The completed House stands at dawn (paying off Room 2's
imagery if both are built, standing alone if not), its courtyard set with
empty mats, cold braziers, dark lanterns, and — waiting at the edges — every
creature met along the caravan road. The room does nothing until the child
begins. The child is the reciter now: as they recite Quraysh, the courtyard
comes to life *following their voice* — braziers warm, bread appears on
mats, creatures pad in to eat, lanterns rise — food and safety unfurling
from the recitation, which is ayah 4 enacted as a world-state. The game's
role inverts from every earlier room: it does not prompt, cue, or lead. It
follows, waits, and helps only when the child stalls.

This is family 7 ("recite and reveal") plus the strategy doc's Prototype 4
("gentle full recitation"), designed as the *terminal* room of the Quraysh
arc — the one whose existence gives the other four somewhere to lead.

### Learning target

**RECITE** — independent, sustained production of the whole surah — and the
skill of **self-cued flow**: carrying momentum across every join without
external prompting. Secondarily, this room is the natural *measurement site*
for whether the other rooms worked: its telemetry (where the child
hesitates, which joins need feeding) is the support profile the whole
strategy defines as the real data product.

### Gameplay loop

The child enters the silent courtyard. One firefly (the same your-turn
signifier as Room 3 — a deliberately shared vocabulary) drifts to hover
before them, and the scene waits. The child begins ayah 1: with the first
detected speech the nearest brazier stirs and glows, and warmth spreads
along the courtyard in rough proportion to sustained vocal flow (Level 1/2:
awakening reflects *participation and continuity*, exactly as the doc
scopes it). Each ayah's stretch of courtyard has its own reveal — gates
swing wide (1), snow-melt and sun stream through the two high windows (2),
the House's own doors open with light (3), the feast itself lands and the
creatures come to eat in peace (4). If the child flows through all four,
the room crescendos: full feast, all creatures gathered, dawn breaking
over the House, and the reciter's voice takes the surah once, beautifully,
from the top — the correct model as celebration, not correction — while the
child sees everything their recitation fed. On later visits (the doc's
family 8), the firefly sometimes hovers not at the gate but *mid-courtyard*
at the ayah-3 threshold: begin from here — random starting points, staged
in the same space the Caravan Road made navigable.

### Feedback and failure design

The stall ladder is the doc's model verbatim, delivered as weather. The
child hesitates mid-surah (step 2): first, after the hesitation window, a
breeze carries the **first word** of the next stretch — quiet, in the
reciter's voice, as if from far inside the House (step 3). Still stalled:
the breeze returns with the **opening phrase**, and the courtyard ahead
glimmers faintly, showing where the recitation would go (step 4). Still
stalled: the reciter's voice warmly picks up that whole ayah — "let's hear
this part together" — the courtyard section awakens fully to *his* voice
instead, and the firefly returns to the child for the next ayah (step 5).
An awakening is never revoked: sections lit by helped recitation glow
identically to sections lit alone, braziers never re-cool, creatures never
leave. The child cannot fail this room; they can only be accompanied
through more or less of it. Internally the room records, per ayah and per
join, which rung was needed — and the next visit's breezes wait a beat
longer where the child was strong (step 6). The one growth surface beyond
the room: per the doc's hard rule, Adventure progression never gates on
this — but a fully self-carried recitation may brighten the world's Grand
Gem, the sanctioned "greater independence deepens, never blocks" reward.

### Voice/microphone role

Level 1/2 is the engine: vocal activity and continuity drive the awakening,
which is honest — the room visibly rewards *participation and flow*, which
is all it truly knows. Level 3, when it becomes deployable, adds one
cautious layer: expected-word detection can light individual mats or
creatures "you probably said this part" — assistance-and-progress
animation, the doc's sanctioned use — but never withholds the section
awakening and never produces corrective feedback. Fallback with no mic:
the room becomes a listening feast — the firefly conducts, the reciter
performs, the courtyard awakens to his voice, and the child still receives
the place — while the session honestly logs "no vocal evidence." Degraded,
but never broken, and never a locked door.

### Why it's distinct

Every other room scaffolds; this one *witnesses*. **The Caravan Road** and
**the Night Watch** ask for no production; **Raising the House** asks for
manual completion inside single ayaat; **the Hungry Little Camel** asks for
short, cued, socially supported vocal turns. The Feast asks for the whole
surah, self-launched and self-carried, with support that only appears on
stall — the far end of the progression, and the only room whose primary
interaction is *sustained* voice. Cognitively it demands serial production
from long-term memory with self-monitoring (the skill Room 4 trained
receptively), and structurally it is the room the other four exist to make
possible.

### Prototype scope

One courtyard scene with four awakening zones, each with three states
(cold / glimmering / awake) plus the crescendo state; creature cameo
sprites (reuse existing bestiary); firefly signifier (shared asset with
Room 3); VAD-driven continuity meter (Level 1/2, reused from Room 3's
build); breeze-cue audio (first-word and phrase clips — same cuts Room 2
needs, so cut once); full-model celebration playback; per-join rung
telemetry; hesitation and breeze timers on the tuning panel. Level 3 is
out of scope for the first build. Build this room *after* Room 3 proves
the VAD turn loop.

**The question this prototype answers:** the doc's Prototype 4 question —
does required support decrease across sessions, and does the recitation
persist to the next day — plus one of its own: does a child who has played
the other rooms *choose* to begin reciting unprompted in a room that
merely waits?

---

## Comparison table

| Room | Paradigm | Progression stage(s) | Mic level | Key distinction |
|---|---|---|---|---|
| 1. The Caravan Road | Spatial-embodied memory palace; walk the surah as a place | LISTEN → RECOGNIZE, feeds RECALL LATER | None (optional L1 flourish) | Only room that builds *positional* knowledge; body/locomotion is the interaction |
| 2. Raising the House | Manual-constructive completion; build the Bayt phrase by phrase | COMPLETE (+ optional ECHO) | Optional L1/2 echo decoration | Only room working *inside* ayaat at phrase-seam granularity; hands do the thinking |
| 3. The Hungry Little Camel | Social turn-taking care; continue what the calf starts | CONTINUE, becomes the RECALL LATER vehicle | L1/2 core, L3 silent telemetry | Only dialogic voice room; transitions between ayaat under social motivation |
| 4. The Night Watch | Auditory vigilance and repair; catch the stalled/skipped song | Deep RECOGNIZE → monitoring | None, by design | Only receptive-judgment room; child monitors the *game's* recitation — role reversal |
| 5. The Feast of the House | Generative child-led performance; the world follows the voice | RECITE, with family-8 middle starts | L1/2 engine, cautious L3 later | Only sustained self-launched production; game follows instead of prompting |

Coverage check: hands-only (2), body-only (1), ears-only (4), voice-dialogic
(3), voice-sustained (5); and the progression is walked end to end —
LISTEN/RECOGNIZE (1) → COMPLETE (2) → monitoring (4) → CONTINUE (3) →
RECITE (5), with RECALL LATER hooks designed into 1, 3, and 5.

---

## Recommended build order

**1. The Night Watch.** Smallest build of the five — one scene, four
lanterns, a fault sequencer, zero new audio, zero mic — and it tests
something genuinely unknown (can this age group monitor sequence at all?)
whose answer sharpens every other room's tuning. If it also proves out as a
mic-free assessment proxy, that's found treasure. Ship first, learn fast.

**2. The Caravan Road.** Also mic-free and buildable entirely from existing
tech (per-ayah audio, read-along timings, standard world plumbing), it
front-loads the LISTEN/RECOGNIZE material every later room presumes, and its
hypothesis — spatial anchoring beats abstract sequencing — is the one most
likely to reshape how *future* surah worlds get designed, so we want that
verdict early.

**3. The Hungry Little Camel.** The first mic room, deliberately third: by
now two rooms of Quraysh exposure exist, so vocal turns are being asked of
material the playtester has genuinely met. This build carries the strategic
risk the strategy doc cares most about (sincere echo vs. noise-to-trigger),
and its VAD loop is the direct technical prerequisite for Room 5. Levels 1/2
only; the Level 3 recognizer stays in the v2 lab.

**4. Raising the House.** Fourth because its real cost is audio — phrase-
seam segmentation of every ayah plus run-up and first-word clips — and
those same cuts are exactly what Room 5's breeze cues need. Cut once here,
reuse there. Its hypothesis (interior joins need dedicated work) is best
tested on a child who already knows the surah roughly, which the earlier
rooms will have produced.

**5. The Feast of the House.** Last, on purpose: it is the terminal room of
the progression, it depends technically on Room 3's VAD loop and Room 2's
phrase cuts, and its central question — does support decrease and recall
persist? — is only meaningful once the acquisition rooms upstream have had
time to do their work. Building it last also means it launches into a
playtest where a child might actually, unprompted, begin to recite in a
courtyard that merely waits. That moment is the whole product thesis; give
it its best chance of happening.

Each prototype lands as a standalone shelf entry behind `?debug=1`, one PR
to staging with the checker green, verdicts to PLAN §10 and `v3/reviews/`,
per the working rules.
