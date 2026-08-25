#!/usr/bin/env node
// Focused contract for the journey-map grown-up doorway. Its circular art and
// forgiving target must match the neighboring back button without changing
// the map's patient hold-to-open gesture.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/map.js', import.meta.url), 'utf8');
let scene;
const GOL = {
  color: { alpha: (c) => c },
  EXPERIENCE: { grownups: true },
  registerScene(name, value) {
    assert.equal(name, 'journeyMap');
    scene = value;
  }
};

vm.runInNewContext(source, {
  window: { GOL },
  document: { currentScript: null },
  location: { href: 'https://example.test/v3/' },
  URL,
  console
}, { filename: 'map.js' });

assert.ok(scene, 'journey map registers');
scene.firstFocus = () => false;

for (const [label, W, H, safe] of [
  ['landscape iPhone', 844, 390, { l: 59, r: 59, t: 0, b: 21 }],
  ['portrait fallback', 390, 844, { l: 0, r: 0, t: 47, b: 34 }]
]) {
  GOL.SAFE = safe;
  const button = scene.grownButton(W, H);
  assert.ok(button, `${label}: grown-up control exists`);
  assert.equal(button.r, 22, `${label}: visible circle must match the map back button`);
  assert.equal(button.hitR, 31, `${label}: target must match the map back button`);
  assert.equal(button.x, safe.l + 98, `${label}: control stays beside the safe-area-aware back button`);
  assert.equal(button.y, safe.t * 0.5 + 34, `${label}: control stays aligned with the back button`);
}

scene.firstFocus = () => true;
assert.equal(scene.grownButton(844, 390), null, 'first-journey focus still hides the control');

assert.match(source, /GOL\.dist\(p\.x, p\.y, gb\.x, gb\.y\) < gb\.hitR[\s\S]{0,100}holding = true/,
  'the full target must drive the existing hold gesture');
assert.match(source, /this\.grownHold >= 1[\s\S]{0,120}GOL\.go\('grownups'\)/,
  'the map doorway must remain hold-to-open');
assert.match(source, /GOL\.dist\(clickAt\.x, clickAt\.y, gb\.x, gb\.y\) < gb\.hitR/,
  'plain taps must use the full target for pulse feedback');

console.log('✓ map grown-up star matches the back button circle and touch target');
