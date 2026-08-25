import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const V3 = join(dirname(fileURLToPath(import.meta.url)), '..');
const scales = [];

function context() {
  const gradient = { addColorStop() {} };
  return new Proxy({
    canvas: null,
    scale(x, y) { scales.push([x, y]); },
    createLinearGradient() { return gradient; },
    createRadialGradient() { return gradient; },
    measureText() { return { width: 10 }; }
  }, {
    get(target, prop) {
      if (!(prop in target)) target[prop] = () => {};
      return target[prop];
    }
  });
}

global.window = global;
global.addEventListener = () => {};
global.document = {
  createElement() {
    const ctx = context();
    const canvas = { width: 0, height: 0, getContext: () => ctx };
    ctx.canvas = canvas;
    return canvas;
  }
};

require(join(V3, 'js', 'core', 'art.js'));
const GOL = global.GOL;
const strip = GOL.buildHillStrip(100, 50, {
  pixelRatio: 2, seed: 1, base: 30, amp: 5,
  color: '#779977', mist: '#eeeecc', trees: 0
});
assert.equal(strip.width, 200, 'strip backing width should honor DPR');
assert.equal(strip.height, 100, 'strip backing height should honor DPR');
assert.equal(strip.golWidth, 100, 'logical width should remain in world units');
assert.equal(strip.golHeight, 50, 'logical height should remain in world units');
assert.deepEqual(scales[0], [2, 2], 'strip painter should work in logical units');

const draws = [];
GOL.drawStrip({ drawImage(...args) { draws.push(args); } }, strip, 0, 0.1, 12, 205);
assert.equal(draws.length, 3, 'logical width should control strip tiling');
for (const args of draws) {
  assert.equal(args.length, 9, 'retina strip should use source and destination rectangles');
  assert.equal(args[7], 100, 'destination width should remain logical');
  assert.equal(args[8], 50, 'destination height should remain logical');
}

GOL.V3 = {};
GOL.scenes = {};
GOL.registerScene = (name, scene) => { GOL.scenes[name] = scene; };
require(join(V3, 'js', 'adventure.js'));
const adventure = GOL.scenes.adventure;
const calls = [];
GOL.buildHillStrip = (w, h, options) => {
  calls.push({ w, h, pixelRatio: options.pixelRatio });
  return { width: w * options.pixelRatio, height: h * options.pixelRatio, golWidth: w, golHeight: h };
};
GOL.color = { shade: (color) => color };
global.devicePixelRatio = 2;
const scene = Object.assign(Object.create(adventure), {
  L: { id: 19 },
  P: { hillFar: '#aaa', hillMid: '#999', hillNear: '#888', mist: '#eee' },
  endP: null,
  strips: null,
  stripsDpr: null
});
scene.ensureHillStrips();
assert.equal(calls.length, 3, 'first use should build one three-layer cache');
assert.ok(calls.every((call) => call.pixelRatio === 2), 'cache build should include current DPR');
scene.ensureHillStrips();
assert.equal(calls.length, 3, 'same DPR should reuse the cache');
global.devicePixelRatio = 1;
scene.ensureHillStrips();
assert.equal(calls.length, 6, 'DPR change should replace the cached layers');
assert.ok(calls.slice(3).every((call) => call.pixelRatio === 1), 'rebuilt cache should use the new DPR');

console.log('✓ hill strips retain logical geometry and cache at device pixel density');
