#!/usr/bin/env node
// At-Tin's title asset has 1.43s of dead tail. The map must finish entry
// after the spoken name while preserving the existing Kawthar exception.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.resolve(here, '..', 'js', 'map.js'), 'utf8');
let scene;
const calls = { stopped: [], entered: [] };
const GOL = {
  color: { alpha: (c) => c },
  EXPERIENCE: { recitation: true },
  surahForWorld: (n) => ({ slug: n === 20 ? 'tin' : 'kawthar' }),
  audio: {
    preloadVoice: () => {},
    speak: (id) => ({ id }),
    stopSpeakIf: (handle) => calls.stopped.push(handle.id)
  },
  registerScene: (_name, value) => { scene = value; }
};
const context = {
  window: { GOL },
  document: { currentScript: { src: 'https://example.test/v3/js/map.js' } },
  location: { href: 'https://example.test/v3/' },
  URL,
  Math,
  console
};
vm.runInNewContext(source, context, { filename: 'js/map.js' });
scene.enterWorld = (ri, j) => calls.entered.push([ri, j]);
scene.spotInfo = [[{ n: 20, open: true }, { n: 5, open: true }]];

scene._beginDwell(0, 0, 0);
scene._advanceDwell(1.7);
assert.deepEqual(calls.entered, [], 'At-Tin must still have time to say its name');
scene._advanceDwell(0.06);
assert.deepEqual(calls.stopped, ['surah-tin']);
assert.deepEqual(calls.entered, [[0, 0]], 'At-Tin enters before its dead tail ends');

scene.spotAnnouncement = null;
scene._beginDwell(0, 1, 0);
scene._advanceDwell(1.76);
assert.deepEqual(calls.stopped, ['surah-tin', 'surah-kawthar'],
  'At-Tin handling must preserve Kawthar\'s existing cap');
assert.deepEqual(calls.entered, [[0, 0], [0, 1]],
  'Kawthar remains responsive after adding At-Tin');

console.log('\u2713 At-Tin map entry skips its silent narration tail and preserves Kawthar');
