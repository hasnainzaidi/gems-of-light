#!/usr/bin/env node
// A destination visit may be observed by both approach and landing handlers,
// but its gesture-time iOS prime stays silent and its name is spoken once.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.resolve(here, '..', 'js', 'map.js'), 'utf8');
let scene;
const calls = { prime: [], preload: [], speak: [] };
const GOL = {
  color: { alpha: (c) => c },
  EXPERIENCE: { recitation: true },
  surahForWorld: () => ({ slug: 'fatiha' }),
  audio: {
    primeVoice: (id) => calls.prime.push(id),
    preloadVoice: (ids) => calls.preload.push(...ids),
    speak: (id) => { calls.speak.push(id); return { id }; },
    stopSpeakIf: () => {}
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

scene.spotInfo = [[{ n: 1, open: true }]];
scene.dwell = null;
scene.spotAnnouncement = null;

// Repeated pointer/key callbacks while travelling prime only one element.
scene._primeSpotVoice(0, 0);
scene._primeSpotVoice(0, 0);
assert.deepEqual(calls.prime, ['surah-fatiha']);

// Arrival owns the one audible title.
scene._beginDwell(0, 0, 0.5);
scene._dwellSpeak(scene.dwell);
assert.deepEqual(calls.speak, ['surah-fatiha']);

// A duplicate approach/landing edge for the same visit opens without replay.
scene.dwell = null;
scene._beginDwell(0, 0);
assert.deepEqual(calls.speak, ['surah-fatiha']);
assert.equal(scene.dwell.wait, 0);

// A later, deliberate return is a new visit and announces once again.
scene.dwell = null;
scene._primeSpotVoice(0, 0);
scene._beginDwell(0, 0);
assert.deepEqual(calls.prime, ['surah-fatiha', 'surah-fatiha']);
assert.deepEqual(calls.speak, ['surah-fatiha', 'surah-fatiha']);

console.log('✓ each map destination visit speaks its surah name exactly once');
