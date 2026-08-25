#!/usr/bin/env node
// Contract test for the grown-ups scene's responsive orientation, safe-area
// geometry, scrolling, and home navigation. Canvas rendering is intentionally
// left to the shared checker; this exercises the layout used by draw + input.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/grownups.js', import.meta.url), 'utf8');
let scene;
const worlds = Array.from({ length: 12 }, (_, i) => ({
  n: i + 1, surahId: i, build() {}
}));
let wentHome = false;
const makeNode = (tag) => ({
  tag, children: [], style: {},
  appendChild(child) { this.children.push(child); },
  replaceChildren() { this.children = []; }, remove() {}, setAttribute() {},
  addEventListener() {}
});
const document = {
  getElementById() { return null; },
  head: { appendChild() {} },
  body: { appendChild() {} },
  createElement: makeNode
};
const GOL = {
  color: { alpha: (c) => c }, INK: '#000', INK_SOFT: '#555', GOLD: '#fc0',
  SAFE: { l: 0, r: 0, t: 47, b: 34 },
  WORLDS3: worlds, orderedWorlds: () => worlds,
  EXPERIENCE: { grownups: true },
  isStandalone: () => true,
  worldProgressOpen: () => false,
  worldDone: () => false,
  store: {
    data: { opened: [], settings: {} },
    level: () => ({}), save() {}
  },
  Input: { drag: null, releases: [], taps: [] },
  homeButton: () => ({ x: 40, y: 63.5, r: 30, iconName: 'back', fn: () => { wentHome = true; } }),
  audio: { stopAmbience() {}, sfx() {}, unlock() {} },
  dist: (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2),
  registerScene: (_name, value) => { scene = value; }
};

vm.runInNewContext(source, { window: { GOL }, document, console }, { filename: 'grownups.js' });
assert.ok(scene, 'grown-ups scene registers');
assert.equal(scene.ownsPortrait, true, 'scene opts out of the rotate curtain');

const portrait = scene.layout(390, 844);
assert.equal(portrait.portrait, true);
assert.ok(portrait.titleY > GOL.SAFE.t + 20, 'title clears portrait safe-area/navigation corner');
assert.ok(portrait.panelTop > portrait.titleY + 35, 'panel clears title and subtitle');
assert.ok(portrait.panelTop + portrait.panelH < portrait.reassuranceY,
  'scroll panel clears the portrait footer copy');
assert.ok(portrait.viewH > 300, 'portrait list remains meaningfully usable');
assert.ok(portrait.maxScroll > 0, 'long journeys scroll in portrait');
for (const row of portrait.rows) {
  assert.ok(row.hit.x >= portrait.px, 'toggle hit target stays inside portrait panel');
  assert.ok(row.hit.x + row.hit.w <= portrait.px + portrait.pw, 'toggle hit target does not spill right');
}

scene.enter();
GOL.Input.drag = { id: 1, x: 190, y: 500, startX: 190, startY: 500 };
scene.update(0.016, 390, 844);
GOL.Input.drag = { id: 1, x: 190, y: 360, startX: 190, startY: 500 };
scene.update(0.016, 390, 844);
assert.ok(scene.scroll > 0, 'portrait drag scrolls the journey list');
assert.ok(scene.scroll <= scene.layout(390, 844).maxScroll, 'portrait scroll remains clamped');

// A clean release over home still navigates after the page gains portrait
// ownership. Establish a drag record first, matching the runtime input model.
scene.enter();
GOL.Input.drag = { id: 2, x: 40, y: 63.5, startX: 40, startY: 63.5 };
GOL.Input.releases = [];
scene.update(0.016, 390, 844);
GOL.Input.drag = null;
GOL.Input.releases = [{ x: 40, y: 63.5 }];
scene.update(0.016, 390, 844);
assert.equal(wentHome, true, 'portrait home control remains operable');

GOL.SAFE = { l: 59, r: 59, t: 0, b: 21 };
const landscape = scene.layout(844, 390);
assert.equal(landscape.portrait, false);
assert.ok(landscape.px >= GOL.SAFE.l, 'landscape panel clears the left safe area');
assert.ok(landscape.px + landscape.pw <= 844 - GOL.SAFE.r, 'landscape panel clears the right safe area');
assert.ok(landscape.panelH >= 80, 'landscape layout remains viable');

console.log('grown-ups portrait layout: ok');
