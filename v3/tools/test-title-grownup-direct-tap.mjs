#!/usr/bin/env node
// Interaction contract for the title-only grown-ups doorway. The map doorway
// has separate behavior and ownership.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const calls = [];
const GOL = {
  color: { alpha: (c) => c, tint: (c) => c, shade: (c) => c },
  EXPERIENCE: { grownups: true, install: false, arabic: true, showcase: false },
  SAFE: { l: 0, r: 59, t: 0, b: 21 },
  Input: { taps: [], pointers: new Map() },
  audio: {
    unlock: () => calls.push('unlock'),
    sfx: (name) => calls.push(`sfx:${name}`)
  },
  dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
  makeFx: () => ({ update() {}, spawn() {} }),
  muteButton: () => ({ x: 0, y: 0, r: 1 }),
  go: (name) => calls.push(`go:${name}`),
  hitButtons: () => false
};

vm.runInNewContext(source, {
  window: { GOL }, document: { currentScript: null },
  location: { href: 'https://example.test/v3/' }, URL, Image: class {}, console
}, { filename: 'ui.js' });

const title = GOL.SCENES.title;
assert.ok(title, 'title scene registers');
title.t = 1;
title.fx = GOL.makeFx();
title.childMode = false;
title.wasPortrait = false;
title.settingsOpen = false;

const button = title.grownButton(844, 390);
const tap = { x: button.x, y: button.y };
GOL.Input.taps = [tap];
title.update(1 / 60, 844, 390);

assert.equal(tap.ui, true, 'grown-ups tap was not claimed');
assert.deepEqual(calls, ['unlock', 'sfx:unlockLevel', 'go:grownups'],
  'one tap must immediately open the grown-ups page');
assert.doesNotMatch(source, /grownHold|press-and-hold|held to open|hold-the-star/,
  'stale hold-only state or guidance remains on the title');

console.log('✓ title grown-ups doorway opens on one clear tap');
