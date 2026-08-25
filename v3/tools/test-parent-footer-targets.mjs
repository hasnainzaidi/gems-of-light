#!/usr/bin/env node
// Focused geometry contract for parent-page public footer controls.
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

function verifyFooter(W, H, label) {
  const layout = scene.layout(W, H);
  const safeLeft = GOL.SAFE.l;
  const safeRight = W - GOL.SAFE.r;
  const safeBottom = H - GOL.SAFE.b;

  assert.equal(layout.legalLinks.length, 3, `${label}: all public links are present`);
  for (const link of layout.legalLinks) {
    assert.ok(link.w >= 44 && link.h >= 44, `${label}: ${link.label} has an accessible target`);
    assert.ok(link.x >= safeLeft && link.x + link.w <= safeRight,
      `${label}: ${link.label} stays within horizontal safe area`);
    assert.ok(link.y + link.h <= safeBottom - 8,
      `${label}: ${link.label} clears the bottom safe area`);
  }
  for (let i = 1; i < layout.legalLinks.length; i++) {
    const before = layout.legalLinks[i - 1];
    const after = layout.legalLinks[i];
    assert.ok(after.x >= before.x + before.w + 8, `${label}: adjacent footer targets do not overlap`);
  }
  assert.ok(layout.copyrightY < layout.legalLinks[0].y,
    `${label}: publisher line stays above footer controls`);
  assert.ok(layout.reassuranceY < layout.copyrightY,
    `${label}: reassurance stays above publisher line`);
  assert.ok(layout.panelTop + layout.panelH < layout.reassuranceY,
    `${label}: selector panel does not overlap footer content`);
}

verifyFooter(390, 844, 'portrait');
GOL.SAFE = { l: 59, r: 59, t: 0, b: 21 };
verifyFooter(844, 390, 'landscape');

console.log('parent footer targets: ok');
