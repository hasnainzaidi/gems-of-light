import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const V3 = path.resolve(here, '..');
const require = createRequire(import.meta.url);

class FakeCanvas {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.shapes = [];
    const gradient = { addColorStop() {} };
    this.context = new Proxy({
      canvas: this,
      arc: (x, y, radius) => this.shapes.push({ x, radiusX: radius }),
      ellipse: (x, y, radiusX) => this.shapes.push({ x, radiusX }),
      createLinearGradient: () => gradient,
      createRadialGradient: () => gradient,
      measureText: () => ({ width: 0 })
    }, {
      get(target, property) {
        if (property in target) return target[property];
        return () => {};
      },
      set(target, property, value) {
        target[property] = value;
        return true;
      }
    });
  }

  getContext() { return this.context; }
}

global.window = global;
global.document = { createElement: (tag) => {
  assert.equal(tag, 'canvas');
  return new FakeCanvas();
} };

require(path.join(V3, 'js/core/art.js'));
require(path.join(V3, 'js/core/props.js'));

const worldDir = path.join(V3, 'js/worlds');
const ids = fs.readdirSync(worldDir)
  .filter((file) => /^w\d+-.*\.js$/.test(file))
  .map((file) => ({ file, source: fs.readFileSync(path.join(worldDir, file), 'utf8') }))
  .filter(({ source }) => /registerWorld\s*\(/.test(source))
  .map(({ file, source }) => {
    const match = source.match(/\bid:\s*(\d+)/);
    assert(match, `${file} must declare its prototype id`);
    return Number(match[1]);
  });

assert.equal(new Set(ids).size, ids.length, 'world prototype ids must be unique');

for (const id of ids) {
  const seed = 31 + id * 7; // adventure.js and level-map.js use this seed
  const sprites = GOL.buildPropSprites(GOL.PALETTES.falaq, seed);
  assert.equal(sprites.bush.length, 3, `world id ${id} must build three bush variants`);

  sprites.bush.forEach((canvas, variant) => {
    assert(canvas.shapes.length >= 13, `world id ${id} bush ${variant} must paint its canopy and highlights`);
    for (const { x, radiusX } of canvas.shapes) {
      assert(
        x - radiusX > 0 && x + radiusX < canvas.width,
        `world id ${id} bush ${variant} clips horizontally: mark ${x - radiusX}..${x + radiusX} in 0..${canvas.width}`
      );
    }
    assert.equal(canvas._anchor.x, canvas.width / 2, `world id ${id} bush ${variant} must stay bottom-centred`);
  });
}

console.log(`✓ all bush sprites stay inside their canvases across ${ids.length} shipped world seeds`);
