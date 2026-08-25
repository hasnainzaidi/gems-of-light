#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (file) => fs.readFileSync(path.resolve(here, '..', file), 'utf8');

function game(save = {}) {
  const states = new Map(Object.entries(save.levels || {}).map(([id, st]) => [Number(id), st]));
  const stamps = [];
  let shrine;
  const GOL = {
    DEBUG: false,
    WORLDS3: [],
    store: {
      data: { opened: [], grand: {}, ...structuredClone(save) },
      level(id) {
        if (!states.has(id)) states.set(id, {});
        return states.get(id);
      },
      save() {}
    },
    color: { alpha: (x) => x, tint: (x) => x, shade: (x) => x },
    registerScene: (_name, value) => { shrine = value; },
    audio: { sfx() {} },
    stamp: (name) => stamps.push(name)
  };
  const context = vm.createContext({ window: { GOL }, console, Math, Date, setTimeout, clearTimeout });
  vm.runInContext(read('js/worlds.js'), context);
  for (const [n, key, surahId] of [
    [8, 'fatiha', 1], [9, 'ikhlas', 112], [1, 'falaq', 113], [2, 'nas', 114]
  ]) GOL.registerWorld(n, { key, surahId, build() {} });
  vm.runInContext(read('js/shrine.js'), context);
  return { GOL, shrine, states, stamps };
}

// A parent-opened world is the same normal destination as a naturally opened
// one: no practice-only contract and no withheld Wisdom Tree reward.
{
  const { GOL, shrine, states, stamps } = game({ opened: [113] });
  assert.equal(GOL.worldOpen(1), true, 'parent-opened Al-Falaq was not playable');
  assert.equal(GOL.worldPracticeOnly(1), false, 'parent-opened world remained second-class practice');
  assert.equal(GOL.worldProgressOpen(2), false, 'next world opened before the Wisdom Tree was completed');

  Object.assign(shrine, {
    worldN: 1, storeId: 113, surahId: 113, firstTry: 5, missTotal: 0,
    listens: 5, runHints: 0, totalSockets: 5,
    stanzaRanges: [{ start: 0, len: 5 }], _debugAccel: false,
    _usedDebugAssist: false, longMode: null
  });
  shrine.finishRun();

  assert.ok(GOL.store.data.grand[113], 'Wisdom Tree did not award the Grand golden gem');
  assert.equal(states.get(113).completed, true, 'parent-opened completion was not canonical');
  assert.equal(stamps.at(-1), 'v3grandGem', 'first Grand Gem ceremony stamp was withheld');
  assert.equal(GOL.worldProgressOpen(2), true, 'Grand Gem did not reveal the downstream world');
  assert.equal(GOL.currentWorld(), 2, 'journey did not advance from the parent-selected anchor');
}

// The ordinary from-the-beginning route remains unchanged.
{
  const { GOL } = game({ levels: { 1: { completed: true } }, grand: { 1: 123 } });
  assert.equal(GOL.worldProgressOpen(9), true, 'natural Al-Fatiha completion no longer opens Al-Ikhlas');
  assert.equal(GOL.currentWorld(), 9);
}

// Map presentation has one gold-star language for every open unfinished world.
{
  const map = read('js/map.js');
  assert.match(map, /isStar\s*\|\|\s*this\.isOpenStar\(ri, j\)[\s\S]{0,300}#F0C878/,
    'additional parent-opened destinations do not share the standard gold star');
  assert.doesNotMatch(map, /#BFE0A6/,
    'legacy green practice-star styling is still present');
}

console.log('✓ parent-opened worlds use standard rewards, progression, and gold map state');
