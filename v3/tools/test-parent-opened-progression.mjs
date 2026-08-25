#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const states = new Map();
const stamps = [];
let shrine;
const GOL = {
  DEBUG: false,
  WORLDS3: [],
  store: {
    data: { opened: [], grand: {} },
    level(id) { if (!states.has(id)) states.set(id, {}); return states.get(id); },
    save() {}
  },
  registerWorld(n, def) { this.WORLDS3[n - 1] = Object.assign(this.WORLDS3[n - 1] || {}, def, { n }); },
  color: { alpha: (x) => x, tint: (x) => x, shade: (x) => x },
  registerScene: (_name, value) => { shrine = value; },
  audio: { sfx() {} },
  stamp: (name) => stamps.push(name)
};
const context = vm.createContext({ window: { GOL }, console, Math, Date, setTimeout, clearTimeout });
vm.runInContext(fs.readFileSync(path.resolve(here, '../js/worlds.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.resolve(here, '../js/worlds/w8-fatiha.js'), 'utf8'), context);
for (const w of GOL.WORLDS3.filter(Boolean)) w.build = () => {};
vm.runInContext(fs.readFileSync(path.resolve(here, '../js/shrine.js'), 'utf8'), context);

// Al-Fatiha is the gentle onboarding world for a fresh journey. Reordering is
// save-safe because completion remains keyed by surah id, never list position.
assert.equal(GOL.orderedWorlds()[0].key, 'fatiha');
assert.equal(GOL.currentWorld(), 8);

// A grown-up may open W2 before the earlier journey is earned. It is the same
// standard destination and Wisdom Tree reward as a naturally reached world.
GOL.store.data.opened.push(114);
assert.equal(GOL.worldOpen(2), true);
assert.equal(GOL.worldPracticeOnly(2), false);
const afterNas = GOL.orderedWorlds()[GOL.orderedWorlds().findIndex((w) => w.n === 2) + 1];
assert.ok(afterNas && afterNas.build, 'test needs a built downstream world after An-Nas');
assert.equal(GOL.worldProgressOpen(afterNas.n), false, 'downstream world opened before An-Nas was earned');

Object.assign(shrine, {
  worldN: 2, storeId: 114, surahId: 114, firstTry: 6, missTotal: 0,
  listens: 6, runHints: 0, totalSockets: 6,
  stanzaRanges: [{ start: 0, len: 6 }], _debugAccel: false
});
shrine.finishRun();
assert.ok(GOL.store.data.grand[114], 'parent-opened Wisdom Tree withheld the Grand Gem');
assert.equal(states.get(114).completed, true, 'parent-opened completion was not canonical');
assert.equal(stamps.at(-1), 'v3grandGem');
assert.equal(states.get(114).shrineRuns.length, 1, 'knowledge telemetry was lost');
assert.equal(GOL.worldProgressOpen(afterNas.n), true,
  'earning the parent-opened Grand Gem did not reveal the downstream world');

console.log('✓ parent-opened worlds use standard Grand Gem progression');
