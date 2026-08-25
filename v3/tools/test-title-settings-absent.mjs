#!/usr/bin/env node
// The title is child-facing: its former tuning gear and modal must not return.
// Runtime configuration remains a boot/query concern, outside this scene.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const calls = [];
const GOL = {
  color: { alpha: (c) => c, tint: (c) => c, shade: (c) => c },
  EXPERIENCE: { grownups: false, install: false, arabic: true, showcase: false },
  SAFE: { l: 59, r: 59, t: 0, b: 21 },
  DEBUG: true,
  V3: { echo: 'near' },
  Input: { taps: [], pointers: new Map() },
  audio: {
    ctx: null,
    unlock: () => calls.push('unlock'),
    sfx: (name) => calls.push(`sfx:${name}`)
  },
  dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
  makeFx: () => ({ update() {}, spawn() {} }),
  muteButton: (W) => ({ x: W - 99, y: 40, r: 30, fn: () => calls.push('mute') }),
  go: (name) => calls.push(`go:${name}`),
  hitButtons(taps, buttons) {
    for (const tap of taps) for (const button of buttons) {
      if (GOL.dist(tap.x, tap.y, button.x, button.y) < button.r) {
        tap.ui = true;
        button.fn();
        return true;
      }
    }
    return false;
  }
};

vm.runInNewContext(source, {
  window: { GOL }, document: { currentScript: null },
  location: { href: 'https://example.test/v3/?debug=1' }, URL,
  Image: class {}, console
}, { filename: 'ui.js' });

const title = GOL.SCENES.title;
assert.ok(title, 'title scene registers');
assert.equal(title.settingsSegs, undefined, 'title tuning geometry remains reachable');
assert.equal(title.drawSettings, undefined, 'title tuning renderer remains reachable');
assert.doesNotMatch(source, /settingsOpen|gearBtn|iconName:\s*['"]sliders['"]|drawSettings|settingsSegs/,
  'title settings state, gear, or modal code remains');

title.t = 1;
title.fx = GOL.makeFx();
title.wasPortrait = false;
title.childMode = false;
const formerGearTap = { x: 40 + GOL.SAFE.l, y: 40 };
GOL.Input.taps = [formerGearTap];
title.update(1 / 60, 844, 390);

assert.deepEqual(calls, ['unlock', 'sfx:unlockLevel', 'go:journeyMap'],
  'the former gear location should now follow the ordinary title doorway');
assert.match(source, /if \(GOL\.DEBUG[\s\S]{0,260}v3 · sound/,
  'query-configured debug diagnostics must remain available');

console.log('✓ title settings gear and tuning modal are absent; debug diagnostics remain');
