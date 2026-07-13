#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const callbacks = [];
let scene;
const levelState = {};
const GOL = {
  DEBUG: false,
  color: { alpha: (x) => x, tint: (x) => x, shade: (x) => x },
  registerScene: (_name, value) => { scene = value; },
  audio: {
    playVerse: (_surah, _ayah, onend) => { callbacks.push(onend); },
    sfx() {}, chime() {}
  },
  store: { level: () => levelState, save() {} },
  dist: (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by),
  rnd: () => 0,
  GEMS: Array.from({ length: 7 }, () => ({ base: '#fff', glow: '#fff' })),
  Input: { drag: null, taps: [], releases: [] }
};
const context = vm.createContext({ window: { GOL }, console, Math, Date, setTimeout, clearTimeout });
vm.runInContext(fs.readFileSync(path.resolve(here, '../js/shrine.js'), 'utf8'), context);

function fx() { return { spawn() {}, burst() {} }; }
function gem(ayah) { return { ayah, placed: -1, drift: null, x: ayah * 10, y: 100 }; }
function socket(i) { return { i, x: (i + 1) * 100, y: 100 }; }

// A second placement is ignored until the first ayah's completion callback.
const g1 = gem(1), g2 = gem(2);
Object.assign(scene, {
  phase: 'place', placementListening: false, reciteGem: null,
  gems: [g1, g2], sockets: [socket(0), socket(1)], placed: 0,
  stanzaStart: 0, stanzaIdx: 0, stanzaRanges: [{ start: 0, len: 2 }],
  firstTry: 0, miss: 0, missTotal: 0, runHints: 0, autoT: 0,
  _socketMissed: false, heldGem: null, fx: fx(), surahId: 113
});
scene.place(g1, scene.sockets[0]);
assert.equal(scene.placementListening, true);
assert.equal(scene.placed, 1);

scene.heldGem = g2;
GOL.Input.releases = [{ x: scene.sockets[1].x, y: scene.sockets[1].y }];
scene.updatePlace(0.016, 852, 393);
assert.equal(scene.placed, 1, 'next socket accepted input during the previous ayah');

callbacks.shift()();
assert.equal(scene.placementListening, false);
scene.updatePlace(0.016, 852, 393);
assert.equal(scene.placed, 2, 'next socket did not wake after the ayah finished');
assert.equal(scene.phase, 'place', 'final ceremony began before the final ayah finished');
callbacks.shift()();
assert.equal(scene.phase, 'bloom');

// A stanza boundary likewise waits for its final ayah before merging.
const stanzaGem = gem(1);
Object.assign(scene, {
  phase: 'place', placementListening: false, reciteGem: null,
  gems: [stanzaGem], sockets: [socket(0)], placed: 0,
  stanzaStart: 0, stanzaIdx: 0,
  stanzaRanges: [{ start: 0, len: 1 }, { start: 1, len: 1 }],
  firstTry: 0, miss: 0, autoT: 0, _socketMissed: false,
  heldGem: null, fx: fx()
});
scene.place(stanzaGem, scene.sockets[0]);
assert.equal(scene.phase, 'place');
callbacks.shift()();
assert.equal(scene.phase, 'merge');

console.log('✓ shrine waits for each placed ayah before accepting or advancing');
