#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const levelCalls = [];
const GOL = {
  WORLDS3: [], DEBUG: false, EXPERIENCE: { progression: 'journey' },
  store: {
    data: { opened: [], grand: {}, levels: {}, onboarding: {} },
    level(id) { levelCalls.push(id); return (this.data.levels[id] ||= {}); },
    save() {}
  }
};
const context = vm.createContext({ window: { GOL }, console, Math, Date });
vm.runInContext(fs.readFileSync(path.resolve(here, '../js/worlds.js'), 'utf8'), context);

// Journey identity only; terrain recipes are irrelevant to placement.
const defs = [
  [8, 1, 'fatiha'], [9, 112, 'ikhlas'], [1, 113, 'falaq'], [2, 114, 'nas'],
  [5, 108, 'kawthar'], [10, 110, 'nasr'], [11, 111, 'masad'], [12, 106, 'quraish'],
  [13, 105, 'fil'], [14, 104, 'humazah'], [15, 103, 'asr'], [16, 102, 'takathur'],
  [17, 101, 'qariah'], [3, 100, 'adiyat'], [4, 97, 'qadr'], [6, 93, 'duha'], [7, 92, 'lail']
];
for (const [n, surahId, key] of defs) GOL.registerWorld(n, { surahId, key, build() {} });

assert.equal(GOL.JOURNEY_STAGE_CHOICES.length, 4, 'one choice is required per live island');

let plan = GOL.journeyStageHandoff(0);
assert.deepEqual(Array.from(plan.knownSurahs), []);
assert.equal(plan.recognitionSurahId, null);
assert.equal(plan.startSlot, null);
assert.equal(plan.nextSurahId, 1);

plan = GOL.applyJourneyStage(1, 1234);
assert.deepEqual(Array.from(plan.knownSurahs), [1, 112, 113, 114, 108, 110]);
assert.equal(plan.startSlot, 5, 'handoff should stand on the previous island endpoint');
assert.equal(plan.startSurahId, null);
assert.equal(plan.recognitionSurahId, null, 'placement must not force a replay detour');
assert.equal(plan.nextSurahId, 111, 'stage two should begin at island two');
assert.equal(GOL.worldDone(8), true, 'earlier-island world should paint as complete');
assert.equal(GOL.store.data.grand[1], undefined, 'placement fabricated an earned Grand Gem');
assert.equal(levelCalls.length, 0, 'placement fabricated level or knowledge telemetry');

plan = GOL.applyJourneyStage(2, 2345);
assert.equal(plan.startSlot, 11);
assert.equal(plan.recognitionSurahId, null);
assert.equal(plan.nextSurahId, 101, 'stage three should begin at island three');

// Unbuilt spots do not break the six-slot island boundary.
plan = GOL.applyJourneyStage(3, 3456);
assert.equal(plan.startSlot, 17, 'stage four starts from the final slot of island three');
assert.equal(plan.recognitionSurahId, null);
assert.equal(plan.nextSurahId, 97, 'stage four should begin at the first built world on island four');
assert.equal(plan.frontier, 18);
assert.equal(GOL.JOURNEY_STAGE_CHOICES[3].examples, "Al-Qadr · Al-'Alaq · At-Tin",
  'each card must show the selected island\'s first three surahs');
GOL.store.data.onboarding.parentComplete = true;
assert.equal(GOL.journeySlotAutoBloomed(17), true, 'last earlier-island slot should auto-bloom');
assert.equal(GOL.journeySlotAutoBloomed(18), false, 'selected island first slot must remain unbloomed');

// A real shrine reward remains distinct and survives repeated preparation.
GOL.store.data.grand[1] = 999;
GOL.applyJourneyStage(1, 4567);
assert.equal(GOL.store.data.grand[1], 999);

const map = fs.readFileSync(path.resolve(here, '../js/map.js'), 'utf8');
assert.match(map, /auto:\s*true/, 'unbuilt earlier-island spots need visual-only blooms');
assert.match(map, /!sp\.auto/, 'visual-only blooms must never become playable doors');
assert.match(map, /handoffStartSlot/, 'map handoff must start at the previous island endpoint');

console.log('✓ island-frontier placement, complete auto-blooms, and honest provenance');
