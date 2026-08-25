#!/usr/bin/env node
// Focused geometry contract for the grown-ups journey/Surah selector.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/grownups.js', import.meta.url), 'utf8');
let scene;
const worlds = Array.from({ length: 12 }, (_, i) => ({ n: i + 1, surahId: i, build() {} }));
const GOL = {
  color: { alpha: (c) => c }, INK: '#000', INK_SOFT: '#555', GOLD: '#fc0',
  SAFE: { l: 0, r: 0, t: 47, b: 34 },
  WORLDS3: worlds, orderedWorlds: () => worlds,
  isStandalone: () => true,
  worldProgressOpen: () => false,
  store: { data: { opened: [] } },
  registerScene: (_name, value) => { scene = value; }
};

vm.runInNewContext(source, { window: { GOL }, console }, { filename: 'grownups.js' });
assert.ok(scene, 'grown-ups scene registers');

const portrait = scene.layout(390, 844);
assert.equal(portrait.px, 20, 'iPhone portrait selector has a 20px left gutter');
assert.equal(portrait.pw, 350, 'iPhone portrait selector has balanced readable width');
assert.equal(390 - portrait.px - portrait.pw, 20, 'portrait selector is centred');
assert.equal(portrait.panelTop - (portrait.titleY + 20), 22,
  'portrait selector follows the header subtitle without a loose gap');
assert.ok(portrait.rows.every((row) => row.hit.x >= portrait.px &&
  row.hit.x + row.hit.w <= portrait.px + portrait.pw),
  'portrait Surah controls remain within the narrowed selector');

GOL.SAFE = { l: 59, r: 59, t: 0, b: 21 };
const landscape = scene.layout(844, 390);
assert.equal(landscape.pw, 640, 'landscape selector line length is capped');
assert.equal(landscape.px, 102, 'landscape selector is centred in the safe viewport');
assert.equal(landscape.panelTop - (landscape.titleY + 20), 18,
  'landscape selector remains closely grouped with its subtitle');
assert.ok(landscape.px >= GOL.SAFE.l && landscape.px + landscape.pw <= 844 - GOL.SAFE.r,
  'landscape selector respects both safe-area rails');

console.log('parent selector layout: ok');
