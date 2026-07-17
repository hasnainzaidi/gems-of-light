#!/usr/bin/env node
// Source-level safety contract for the alternate Showcase experience.
//
// This intentionally checks both halves of every branch: Showcase must be a
// quiet, isolated guest path, while the existing learning journey must remain
// present as the default. It is lightweight enough to run as part of every
// full level-integrity check.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (name) => fs.readFileSync(path.resolve(here, '..', name), 'utf8');

function between(source, start, end, label) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `${label}: could not locate ${start} ... ${end}`);
  return source.slice(from, to);
}

function assertCapabilityGate(source, marker, capability, label, radius = 700) {
  const at = source.indexOf(marker);
  assert.ok(at >= 0, `${label}: missing surface marker ${marker}`);
  const nearby = source.slice(Math.max(0, at - radius), Math.min(source.length, at + marker.length + radius));
  assert.match(nearby, new RegExp(`EXPERIENCE[\\s\\S]{0,180}${capability}|${capability}[\\s\\S]{0,180}EXPERIENCE`),
    `${label}: ${marker} must be gated by GOL.EXPERIENCE.${capability}`);
}

const engine = read('js/core/engine.js');
assert.match(engine, /URLSearchParams\(location\.search\)/,
  'experience selection must be derived from the page query');
assert.match(engine, /get\(['"]showcase['"]\)\s*===\s*['"]1['"]/,
  'Showcase must require the explicit ?showcase=1 query');
assert.match(engine, /Object\.freeze\(showcase\s*\?/,
  'experience profiles must be immutable and selected in one place');
const showcaseProfile = between(engine, "id: 'showcase'", "id: 'learning'", 'Showcase profile');
for (const capability of ['recitation', 'arabic', 'shrine', 'remembering', 'grownups']) {
  assert.match(showcaseProfile, new RegExp(`${capability}:\\s*false`),
    `Showcase profile must disable ${capability}`);
}
for (const capability of ['onboarding', 'install']) {
  assert.match(showcaseProfile, new RegExp(`${capability}:\\s*true`),
    `Showcase profile must retain ${capability}`);
}
assert.match(showcaseProfile, /progression:\s*['"]all-open['"]/,
  'Showcase profile must explicitly request all-open progression');
const learningProfile = engine.slice(engine.indexOf("id: 'learning'"), engine.indexOf('// ---------------------------------------------------------------- input'));
for (const capability of ['recitation', 'arabic', 'shrine', 'remembering', 'onboarding', 'grownups', 'install']) {
  assert.match(learningProfile, new RegExp(`${capability}:\\s*true`),
    `default learning profile must retain ${capability}`);
}
assert.match(learningProfile, /progression:\s*['"]journey['"]/,
  'default learning profile must retain journey progression');

// The guest namespace must never alias either learning namespace. Keeping all
// four literals here also protects backward compatibility for existing saves.
for (const key of [
  'gemsOfLight.v3.showcase',
  'gemsOfLight.v3.showcase.cfg',
  'gemsOfLight.v3',
  'gemsOfLight.v3cfg'
]) assert.ok(engine.includes(`'${key}'`) || engine.includes(`"${key}"`), `missing storage key ${key}`);
assert.match(engine, /const KEY\s*=\s*GOL\.EXPERIENCE\.saveKey/,
  'the store must select its namespace through the experience profile');
assert.match(engine, /localStorage\.getItem\(KEY\)/,
  'save reads must use the selected experience key');
assert.match(engine, /localStorage\.setItem\(KEY\s*,/,
  'save writes must use the selected experience key');
assert.doesNotMatch(engine, /localStorage\.(?:get|set)Item\(\s*['"]gemsOfLight/,
  'the store must not bypass the selected experience namespace');
assert.match(engine, /manifest-showcase\.webmanifest/,
  'Showcase must select its own install manifest');

for (const name of ['manifest-showcase.webmanifest', '../manifest-showcase.webmanifest']) {
  const manifest = JSON.parse(read(name));
  assert.equal(manifest.start_url, './?showcase=1', `${name} must reopen in Showcase`);
  assert.doesNotMatch(manifest.description, /qur|surah|ayah|memor/i,
    `${name} description must remain secular`);
}

const boot = read('js/boot.js');
assert.match(boot, /localStorage\.getItem\(GOL\.EXPERIENCE\.configKey\)/,
  'config reads must use the selected experience key');
assert.match(boot, /localStorage\.setItem\(GOL\.EXPERIENCE\.configKey\s*,/,
  'config writes must use the selected experience key');
assert.doesNotMatch(boot, /localStorage\.(?:get|set)Item\(\s*['"]gemsOfLight/,
  'config persistence must not bypass the selected experience namespace');
assert.match(boot, /GOL\.EXPERIENCE\.onboarding\s*&&[\s\S]{0,180}(?:needsPorch|forceOnboarding|parentComplete)/,
  'both experiences must route clean saves through their onboarding');
assert.match(boot, /needsPorch\s*\?\s*['"]onboarding['"]/,
  'clean saves must retain the onboarding route');
assert.match(boot, /GOL\.EXPERIENCE\.showcase[\s\S]{0,120}showcaseV[\s\S]{0,180}parentComplete\s*=\s*false/,
  'existing Showcase saves must receive the new onboarding once');

const audio = read('js/core/audio.js');
for (const [method, next] of [
  ['preloadSurah(surah)', 'playVerse(surahId'],
  ['playVerse(surahId', 'echoVerse(surahId'],
  ['echoVerse(surahId', '_verse(surahId'],
  ['playSurah(surah', 'stopSpeak()']
]) {
  const body = between(audio, method, next, `audio.${method}`);
  assert.match(body, /GOL\.EXPERIENCE[\s\S]{0,120}!GOL\.EXPERIENCE\.recitation/,
    `audio.${method} needs a central recitation-off guard`);
}
assert.match(between(audio, 'playVerse(surahId', 'echoVerse(surahId', 'audio.playVerse'),
  /setTimeout\(onend\s*,\s*0\)/,
  'blocked verse playback must still release scene callbacks');
assert.match(between(audio, 'playSurah(surah', 'stopSpeak()', 'audio.playSurah'),
  /cb[\s\S]{0,80}onend[\s\S]{0,80}setTimeout/,
  'blocked full-surah playback must still release scene callbacks');

const worlds = read('js/worlds.js');
const worldOpen = between(worlds, 'GOL.worldOpen = function', 'GOL.worldPracticeOnly = function', 'worldOpen');
assert.match(worldOpen, /GOL\.EXPERIENCE[\s\S]{0,140}progression\s*===\s*['"]all-open['"][\s\S]{0,100}w\.build/,
  'Showcase world access must expose every built world');
assert.match(worlds, /GOL\.worldProgressOpen = function/,
  'ordinary journey progression must remain available');
assert.match(worldOpen, /GOL\.worldProgressOpen\(n\)/,
  'ordinary world access must still consult journey progression');

const adventure = read('js/adventure.js');
assert.match(adventure, /GOL\.EXPERIENCE\.(?:showcase|shrine)/,
  'adventure needs an explicit Showcase ending branch');
assert.match(adventure, /GOL\.EXPERIENCE\.showcase[\s\S]{0,180}completeShowcase\(\)[\s\S]{0,180}else\s+GOL\.go\(['"]shrine['"]/,
  'the return portal must choose Showcase completion instead of the shrine');
const showcaseCompletion = between(adventure, 'completeShowcase() {', 'openDoor() {', 'completeShowcase');
assert.match(showcaseCompletion, /(?:grand|worldDone|completed|complete)/i,
  'Showcase completion must persist a bloom in its isolated save');
assert.match(showcaseCompletion, /GOL\.store\.save\(\)/,
  'Showcase completion must save through the experience-selected store');
assert.match(showcaseCompletion, /GOL\.go\((?:GOL\.homeScene|['"]journeyMap['"])/,
  'Showcase completion must return home to the journey map');
assert.match(adventure, /GOL\.go\(['"]shrine['"]/,
  'the ordinary learning journey must retain its shrine route');
assert.match(adventure, /GOL\.V3\.arabic/,
  'the ordinary learning journey must retain optional ayah script');

const ui = read('js/ui.js');
assertCapabilityGate(ui, "'جواهر النور'", '(?:showcase|arabic)', 'title Arabic subtitle');
assertCapabilityGate(ui, 'this.gearBtn =', 'grownups', 'title tuning control');
assertCapabilityGate(ui, 'this.grownBtn =', 'grownups', 'title grown-ups doorway');
assertCapabilityGate(ui, 'portraitInvite(W, H)', 'install', 'title install invitation');
assert.match(ui, /GOL\.go\(['"]grownups['"]/,
  'ordinary title must retain the grown-ups route');
assert.match(ui, /GOL\.go\(['"]install['"]/,
  'ordinary title must retain the install route');
assert.match(ui, /label:\s*['"]ayah script['"]/,
  'ordinary tuning must retain the ayah-script setting');

const map = read('js/map.js');
assertCapabilityGate(map, 'this.moonBtns =', 'remembering', 'Remembering Moons');
assertCapabilityGate(map, 'installNudge(W, H)', 'install', 'map install invitation');
assertCapabilityGate(map, 'this.grownBtn =', 'grownups', 'map grown-ups doorway');
assert.match(map, /GOL\.EXPERIENCE[\s\S]{0,180}(?:progression\s*===\s*['"]all-open['"]|showcase)[\s\S]{0,260}(?:awake|maxS|regionAwake)/,
  'the Showcase map must make the whole built journey navigable');
assert.match(map, /GOL\.go\(['"]shrine['"]\s*,\s*\{\s*memory:/,
  'ordinary map must retain the Remembering Moon route');
assert.match(map, /GOL\.go\(['"]grownups['"]/,
  'ordinary map must retain the grown-ups route');
assert.match(map, /GOL\.go\(['"]install['"]/,
  'ordinary map must retain the install route');

console.log('✓ Showcase isolation, guest flow, neutral surfaces, and learning-path preservation');
