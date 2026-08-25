#!/usr/bin/env node
// Kawthar's title asset has a long silent tail. The map must finish entry
// after the spoken name without changing the dwell of healthy title clips.
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
  surahForWorld: (n) => ({ slug: n === 5 ? 'kawthar' : 'fatiha' }),
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
scene.spotInfo = [[{ n: 5, open: true }, { n: 1, open: true }]];

scene._beginDwell(0, 0, 0);
scene._advanceDwell(1.7);
assert.deepEqual(calls.entered, [], 'Kawthar must still have time to say its name');
scene._advanceDwell(0.06);
assert.deepEqual(calls.stopped, ['surah-kawthar']);
assert.deepEqual(calls.entered, [[0, 0]], 'Kawthar enters before its dead tail ends');

scene.spotAnnouncement = null;
scene._beginDwell(0, 1, 0);
scene._advanceDwell(5);
assert.deepEqual(calls.stopped, ['surah-kawthar'], 'healthy clips keep normal ended-event timing');
assert.deepEqual(calls.entered, [[0, 0]], 'another title is not cut off by Kawthar policy');

console.log('\u2713 Kawthar map entry skips only its silent narration tail');
