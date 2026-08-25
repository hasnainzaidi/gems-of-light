import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const V3 = join(dirname(fileURLToPath(import.meta.url)), '..');

global.window = global;
global.GOL = {
  TILE: 48,
  color: { alpha() {}, mix() {} },
  SAFE: { l: 44, r: 22, t: 0, b: 34 },
  touchZones(W, H) {
    const sa = this.SAFE;
    const y = H - 66 - sa.b * 0.5;
    return {
      stick: { x: 76 + sa.l, y, r: 58 },
      jump: { x: W - 72 - sa.r, y, r: 54 }
    };
  },
  registerScene(name, scene) { this.scene = scene; }
};

require(join(V3, 'js', 'adventure.js'));
const scene = Object.assign(Object.create(global.GOL.scene), {
  cam: { x: 0, y: 0 }
});

const grounded = scene.gemBandLayout(844, 390);
scene.cam.y = -1200;
const climbed = scene.gemBandLayout(844, 390);

assert.deepEqual(climbed, grounded,
  'vertical camera travel must not push the gem drawer below the viewport');
assert.equal(grounded.y, 281,
  'drawer should share the safe bottom control lane');
assert.ok(grounded.y + 52 < 390 - global.GOL.SAFE.b,
  'the complete drawer must remain above the home-indicator safe area');
assert.ok(grounded.cx > 120 && grounded.cx < 750,
  'drawer should remain centered between the touch controls');

console.log('✓ gem drawer follows the viewport through vertical climbs');
