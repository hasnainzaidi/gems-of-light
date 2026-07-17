#!/usr/bin/env node
// Contract for the two child-facing surah-name moments: destination on the
// journey map, then the same canonical transliteration on world entrance.
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

assert.match(map, /this\.dwell\s*=\s*\{\s*t:\s*0,\s*ri:\s*this\.star\.ri/,
  'the next-world star must pause before opening so its name can be read');
const arriveBody = map.match(/_onArrive\(\)\s*\{([\s\S]*?)\n    \},\n\n    \/\/ Keyboard navigation/);
assert.ok(arriveBody, 'the map arrival handler must remain inspectable');
assert.doesNotMatch(arriveBody[1], /enterWorld\(/,
  'crossing a bloom must never enter its world immediately');
assert.match(arriveBody[1], /this\.dwell\s*=\s*\{\s*t:\s*0,\s*ri,\s*j\s*\}/,
  'finished and parent-opened blooms must use the same deliberate pause');
assert.match(map, /this\.hero\.sT\s*=\s*target;[\s\S]{0,180}this\.dwell\s*=\s*null/,
  'continuing along the trail must cancel a bloom pause');
assert.match(map, /GOL\.surahNameForWorld\(sp\.n\)/,
  'the map arrival caption must use the canonical surah name');
assert.match(map, /if \(this\.dwell && GOL\.EXPERIENCE\.recitation\)/,
  'the learning-only map caption must not leak into Showcase');

assert.match(adventure, /this\.welcomeName\s*=.*englishName/,
  'world entrance must show the same shared transliteration');
assert.match(adventure, /this\.welcomeVoiceId\s*=\s*entranceSurah\s*&&\s*GOL\.EXPERIENCE\.recitation/,
  'Showcase must never announce the surah name');
assert.match(adventure, /GOL\.audio\.speak\(this\.welcomeVoiceId\)/,
  'world entrance must attempt the matching human-voice name clip');
assert.match(adventure, /this\.welcomeT > 0 && this\.welcomeName/,
  'world entrance needs a timed visible welcome title');
assert.match(map, /GOL\.audio\.primeVoice\(voiceId\)[\s\S]{0,180}GOL\.go\('adventure'/,
  'the exact title clip must be primed during the map gesture before the scene fade');
assert.match(audio, /primeVoice\(id\)[\s\S]*?_voicePrimes\[id\]/,
  'the audio layer must support gesture-priming one named voice element');
assert.match(audio, /const prime = this\._voicePrimes\[id\][\s\S]{0,140}prime\.then\(start, start\)/,
  'welcome playback must wait for its silent Safari prime to settle');
assert.doesNotMatch(audio, /p\.catch\(\(\) => finish\(true\)\)/,
  'a transient autoplay rejection must never mark a valid title clip missing');

assert.match(generator, /LINES\['surah-' \+ s\.slug\]\s*=\s*'سُورَةُ ' \+ s\.arabicName/,
  'the narration batch must speak the canonical Arabic name, never transliteration');
assert.match(generator, /NAMES_ONLY[\s\S]*id\.startsWith\('surah-'\)/,
  'the short surah-name batch must be independently generatable');
assert.match(generator, /NAME_VOICE\s*=.*ELEVEN_NAME_VOICE_ID.*xvhpbk8otnNHtT3fjCpr/,
  'the Arabic-name batch must default to the selected Omar MSA voice');
assert.match(generator, /<break time="0\.45s" \/>/,
  'short Arabic-name clips must preserve a natural tail after the final word');

console.log('✓ surah-name onboarding contract');
