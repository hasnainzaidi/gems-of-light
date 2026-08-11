#!/usr/bin/env node
// Contract for the child-facing surah-name moments: the journey map SPEAKS
// the destination's name during the arrival dwell (a pre-reader can't use
// the caption), and world entrance shows the same canonical transliteration
// silently — the name was already heard on the map.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (name) => fs.readFileSync(path.resolve(here, '..', name), 'utf8');

const worlds = read('js/worlds.js');
const map = read('js/map.js');
const adventure = read('js/adventure.js');
const audio = read('js/core/audio.js');
const generator = fs.readFileSync(path.resolve(here, '..', '..', 'tools', 'generate-narration.mjs'), 'utf8');

assert.match(worlds, /GOL\.surahNameForWorld\s*=\s*function/,
  'surah names need one canonical shared-data lookup');
assert.match(worlds, /surah\.englishName/,
  'the canonical child-facing label must use shared englishName transliteration');

assert.match(map, /_beginDwell\(this\.star\.ri,\s*this\.star\.j\)/,
  'the next-world star must pause before opening so its name can be heard');
const arriveBody = map.match(/_onArrive\(\)\s*\{([\s\S]*?)\n    \},\n\n    \/\/ The arrival pause/);
assert.ok(arriveBody, 'the map arrival handler must remain inspectable');
assert.doesNotMatch(arriveBody[1], /enterWorld\(/,
  'crossing a bloom must never enter its world immediately');
assert.match(arriveBody[1], /this\._beginDwell\(ri,\s*j\)/,
  'finished and parent-opened blooms must use the same deliberate pause');
assert.match(map, /_beginDwell\(ri,\s*j\)\s*\{[\s\S]{0,700}GOL\.audio\.speak\(id/,
  'the arrival dwell must speak the human-voice surah name clip');
assert.match(map, /d\.speech = GOL\.audio\.speak\(id, \(\) => \{[\s\S]{0,80}d\.wait = 1\.0/,
  'the door must open one second AFTER the spoken name finishes');
assert.match(map, /if \(!d\.speech && d\.wait == null\) d\.wait = 1\.0/,
  'a silent dwell (Showcase, missing clip) must keep the old one-second beat');
assert.match(map, /_clearDwell\(\)\s*\{[\s\S]{0,220}stopSpeakIf/,
  'walking off a bloom must stop its spoken name with the dwell');
assert.match(map, /this\.hero\.sT\s*=\s*target;[\s\S]{0,180}this\._clearDwell\(\)/,
  'continuing along the trail must cancel a bloom pause');
assert.match(map, /exit\(\)\s*\{\s*this\._clearDwell\(\);\s*\},/,
  'leaving the map mid-announcement must not carry the voice along');
assert.match(map, /GOL\.surahNameForWorld\(sp\.n\)/,
  'the map arrival caption must use the canonical surah name');
assert.match(map, /if \(this\.dwell && GOL\.EXPERIENCE\.recitation\)/,
  'the learning-only map caption must not leak into Showcase');
assert.match(map, /_primeSpotVoice\(ri,\s*j\)\s*\{[\s\S]{0,320}GOL\.audio\.primeVoice\('surah-' \+ surah\.slug\)/,
  'the walk-starting gesture must prime the destination title for iOS');

assert.match(adventure, /this\.welcomeName\s*=.*englishName/,
  'world entrance must show the same shared transliteration');
assert.match(adventure, /this\.welcomeT > 0 && this\.welcomeName/,
  'world entrance needs a timed visible welcome title');
assert.doesNotMatch(adventure, /welcomeVoiceId|GOL\.audio\.speak\('surah-/,
  'world entrance must NOT re-announce the name the map already spoke');
assert.match(audio, /stopSpeakIf\(h\)\s*\{/,
  'the audio layer must let the dwell stop only its own spoken line');
assert.match(audio, /primeVoice\(id\)[\s\S]*?_voicePrimes\[id\]/,
  'the audio layer must support gesture-priming one named voice element');
assert.match(audio, /const prime = this\._voicePrimes\[id\][\s\S]{0,140}prime\.then\(start, start\)/,
  'welcome playback must wait for its silent Safari prime to settle');
assert.doesNotMatch(audio, /p\.catch\(\(\) => finish\(true\)\)/,
  'a transient autoplay rejection must never mark a valid title clip missing');

assert.match(generator, /missingSpokenNames[\s\S]*?throw new Error\('Missing vocalized Arabic surah names:/,
  'adding a surah must require an explicit vocalized Arabic title');
assert.match(generator, /const spokenName = SPOKEN_ARABIC_NAMES\[s\.slug\]/,
  'the narration batch must use the explicit vocalized title');
assert.match(generator, /LINES\['surah-' \+ s\.slug\]\s*=\s*'سُورَةُ ' \+ spokenName/,
  'the narration batch must speak Arabic script, never transliteration');
assert.match(generator, /AYAH_SLUGS[\s\S]{0,200}kursi/,
  'an ayah passage must speak its vocalized name without the Surah prefix');
assert.match(generator, /NAMES_ONLY[\s\S]*id\.startsWith\('surah-'\)/,
  'the short surah-name batch must be independently generatable');
assert.match(generator, /NAME_VOICE\s*=.*ELEVEN_NAME_VOICE_ID.*xvhpbk8otnNHtT3fjCpr/,
  'the Arabic-name batch must default to the selected Omar MSA voice');
assert.match(generator, /<break time="0\.45s" \/>/,
  'short Arabic-name clips must preserve a natural tail after the final word');
assert.match(generator, /humazah:\s*'الْهُمَزَة'/,
  'Al-Humazah must carry explicit hu-ma-zah vowels for TTS');
assert.equal((generator.match(/^  [a-z]+:\s*'[^']+',?$/gm) || []).length, 25,
  'every supported surah must have a vocalized TTS title (24 surahs + Ayat al-Kursi)');
assert.match(generator, /ONLY_ARG[\s\S]*?--only=[\s\S]*?!ONLY \|\| ONLY\.has\(id\)/,
  'one corrected name must be regeneratable without perturbing approved clips');

console.log('✓ surah-name onboarding contract');
