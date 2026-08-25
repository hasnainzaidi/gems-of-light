#!/usr/bin/env node
// The shared corner audio control must remain wholly inside the usable phone
// rectangle. Title, adventure, and shrine all inherit this geometry; the
// centered pause-modal control intentionally borrows only the mute action.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const ui = fs.readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const adventure = fs.readFileSync(new URL('../js/adventure.js', import.meta.url), 'utf8');
const shrine = fs.readFileSync(new URL('../js/shrine.js', import.meta.url), 'utf8');
const GOL = {
  color: { alpha: (c) => c, tint: (c) => c, shade: (c) => c },
  store: { data: { settings: { muted: false } }, save() {} },
  audio: { setMuted() {} }
};

vm.runInNewContext(ui, {
  window: { GOL }, document: { currentScript: null },
  location: { href: 'https://example.test/v3/' }, URL,
  Image: class {}, console
}, { filename: 'ui.js' });

function check(W, H, safe, label) {
  GOL.SAFE = safe;
  const b = GOL.muteButton(W);
  assert.ok(b.x - b.r >= safe.l, `${label}: mute target crosses left safe area`);
  assert.ok(b.x + b.r <= W - safe.r, `${label}: mute target crosses right safe area`);
  assert.ok(b.y - b.r >= safe.t, `${label}: mute target crosses top safe area`);
  assert.ok(b.y + b.r <= H - safe.b, `${label}: mute target crosses bottom safe area`);
  assert.equal(b.x + b.r, W - safe.r - 10, `${label}: right gutter changed`);
  assert.equal(b.y - b.r, safe.t + 10, `${label}: top gutter must follow the full inset`);
}

check(390, 844, { l: 0, r: 0, t: 47, b: 34 }, 'portrait top rail');
check(844, 390, { l: 59, r: 0, t: 0, b: 21 }, 'landscape left island');
check(844, 390, { l: 0, r: 59, t: 0, b: 21 }, 'landscape right island');
check(932, 430, { l: 62, r: 62, t: 12, b: 20 }, 'top and side insets');

assert.match(ui, /this\.buttons = \[Object\.assign\(\{\}, GOL\.muteButton\(W\)\)\]/,
  'title must use the shared safe-area-aware mute geometry');
assert.match(adventure, /Object\.assign\(\{\}, GOL\.muteButton\(W\)\)/,
  'adventure must use the shared safe-area-aware mute geometry');
assert.match(shrine, /Object\.assign\(\{\}, GOL\.muteButton\(W\)\)/,
  'shrine must use the shared safe-area-aware mute geometry');
assert.match(adventure,
  /x: W \/ 2 \+ 90, y: H \/ 2 \+ 30, r: 34,[\s\S]{0,180}fn: GOL\.muteButton\(W\)\.fn/,
  'pause modal must preserve its explicit centered geometry');

console.log('✓ mute control clears iPhone top/side safe areas in every corner usage');
