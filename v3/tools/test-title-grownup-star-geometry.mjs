#!/usr/bin/env node
// Focused contract for the title/splash grown-up doorway. This intentionally
// excludes the journey-map star, which has separate geometry and ownership.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const GOL = {
  color: {
    alpha: (c) => c,
    tint: (c) => c,
    shade: (c) => c
  },
  EXPERIENCE: { grownups: true }
};
const document = { currentScript: null };
vm.runInNewContext(source, {
  window: { GOL }, document, location: { href: 'https://example.test/v3/' },
  URL, Image: class {}, console
}, { filename: 'ui.js' });

const title = GOL.SCENES.title;
assert.ok(title, 'title scene registers');

function checkGeometry(W, H, safe, label) {
  GOL.SAFE = safe;
  const button = title.grownButton(W, H);
  assert.ok(button, `${label}: grown-up doorway exists`);
  assert.ok(button.r >= 24, `${label}: visible circle is not full-size`);
  assert.ok(button.hitR >= 34, `${label}: touch target is too small`);
  assert.ok(button.hitR > button.r, `${label}: touch target must extend beyond the art`);
  assert.ok(button.x - button.hitR >= safe.l, `${label}: touch target crosses left safe area`);
  assert.ok(button.x + button.hitR <= W - safe.r, `${label}: touch target crosses right safe area`);
  assert.ok(button.y - button.hitR >= safe.t, `${label}: touch target crosses top safe area`);
  assert.ok(button.y + button.hitR <= H - safe.b, `${label}: touch target crosses bottom safe area`);
  assert.ok(button.y + button.r + 14 <= H - safe.b,
    `${label}: grown-up label crosses the home-indicator safe area`);

  const formerY = H - 40 - safe.b * 0.5;
  assert.ok(button.y <= formerY - 20, `${label}: doorway was not raised meaningfully`);
}

checkGeometry(390, 844, { l: 0, r: 0, t: 47, b: 34 }, 'portrait iPhone');
checkGeometry(844, 390, { l: 59, r: 59, t: 0, b: 21 }, 'landscape iPhone');
checkGeometry(320, 568, { l: 0, r: 0, t: 20, b: 20 }, 'compact portrait');

assert.match(source, /GOL\.dist\(tap\.x, tap\.y, gb\.x, gb\.y\) < gb\.hitR/,
  'tap input must use the enlarged touch radius');
assert.match(source, /ctx\.arc\(gb\.x, gb\.y, gb\.r, 0, Math\.PI \* 2\); ctx\.fill\(\)/,
  'visible star must have a contrasting full-size circular backing');
assert.match(source, /GOL\.dist\(tap\.x, tap\.y, gb\.x, gb\.y\) < gb\.hitR[\s\S]{0,180}GOL\.go\('grownups'\)/,
  'the enlarged target must remain wired to the grown-ups route');

console.log('✓ title grown-up star is raised, visible, safe-area-aware, and easy to touch');
