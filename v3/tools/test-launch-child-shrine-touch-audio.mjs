#!/usr/bin/env node
// One iPhone touch begins as a tap and becomes a drag after it moves. The
// shrine must not treat those two phases as two requests to restart the ayah.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const heard = [];
let scene;
const GOL = {
  DEBUG: false,
  color: { alpha: (x) => x, tint: (x) => x, shade: (x) => x },
  registerScene: (_name, value) => { scene = value; },
  audio: {
    playVerse: (surah, ayah) => { heard.push([surah, ayah]); },
    sfx() {}, chime() {}
  },
  store: { level: () => ({}), save() {} },
  dist: (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by),
  rnd: () => 0,
  GEMS: Array.from({ length: 7 }, () => ({ base: '#fff', glow: '#fff' })),
  Input: { drag: null, taps: [], releases: [] }
};
const context = vm.createContext({ window: { GOL }, console, Math, Date, setTimeout, clearTimeout });
vm.runInContext(fs.readFileSync(path.resolve(here, '../js/shrine.js'), 'utf8'), context);

const fx = { spawn() {}, burst() {} };
const reset = () => {
  const g = { ayah: 2, placed: -1, drift: null, x: 100, y: 100 };
  Object.assign(scene, {
    phase: 'place', placementListening: false, heldGem: null,
    gems: [g], sockets: [{ i: 0, x: 400, y: 100 }], placed: 0,
    stanzaStart: 0, stanzaIdx: 0, stanzaRanges: [{ start: 0, len: 1 }],
    firstTry: 0, miss: 0, missTotal: 0, runHints: 0, autoT: 0,
    _socketMissed: false, fx, surahId: 113
  });
  heard.length = 0;
  GOL.Input.drag = null;
  GOL.Input.taps = [];
  GOL.Input.releases = [];
  return g;
};

// Normal iOS progression: pointerdown is a tap on frame one; movement crosses
// the drag threshold on frame two. It is still one listening request.
let g = reset();
GOL.Input.drag = { id: 7, startX: 100, startY: 100, x: 100, y: 100 };
GOL.Input.taps = [{ id: 7, x: 100, y: 100 }];
scene.updatePlace(0.016, 852, 393);
assert.equal(heard.length, 1, 'the initial gem tap should recite once');
GOL.Input.taps = [];
GOL.Input.drag.x = 120;
scene.updatePlace(0.016, 852, 393);
assert.equal(scene.heldGem, g, 'the moved touch did not pick up its gem');
assert.equal(heard.length, 1, 'turning a tap into a drag restarted the same ayah');

// A low-frame-rate device can see pointerdown and threshold-crossing in the
// same update. That must also produce exactly one recitation.
g = reset();
GOL.Input.drag = { id: 9, startX: 100, startY: 100, x: 120, y: 100 };
GOL.Input.taps = [{ id: 9, x: 100, y: 100 }];
scene.updatePlace(0.016, 852, 393);
assert.equal(scene.heldGem, g);
assert.equal(heard.length, 1, 'one threshold-crossing touch recited twice in one frame');

console.log('✓ shrine tap-to-drag gestures recite each gem exactly once');
