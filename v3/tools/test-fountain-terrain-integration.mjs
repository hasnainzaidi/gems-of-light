// Fountain basins are 116px wide and their lower tray reaches 13px below the
// renderer anchor. Every authored fountain must sit on a flat three-tile run,
// with that tray's bottom exactly meeting (not painting over) the terrain.
import { createRequire } from 'module';
import { readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const V3 = join(dirname(fileURLToPath(import.meta.url)), '..');

global.window = global;
global.addEventListener = () => {};
global.document = { createElement: () => ({ getContext: () => null }) };

require(join(V3, '..', 'js', 'data.js'));
require(join(V3, 'js', 'core', 'art.js'));
require(join(V3, 'js', 'dsl.js'));

const GOL = global.GOL;
GOL.V3 = { surah: null };
GOL.store = { data: {} };
require(join(V3, 'js', 'worlds.js'));

for (const file of readdirSync(join(V3, 'js', 'worlds'))
  .filter((name) => /^w\d+-.*\.js$/.test(name))
  .sort((a, b) => Number(a.match(/^w(\d+)/)[1]) - Number(b.match(/^w(\d+)/)[1]))) {
  require(join(V3, 'js', 'worlds', file));
}

const TILE = GOL.TILE;
const TRAY_BOTTOM = 13;
const worlds = GOL.WORLDS3.filter((world) => world && world.build);
if (worlds.length !== 20) throw new Error(`expected 20 built worlds, found ${worlds.length}`);

let fountainCount = 0;
for (const world of worlds) {
  const level = GOL.buildPrototype(world);
  const fountains = level.props.filter((prop) => prop.type === 'fountain');
  fountainCount += fountains.length;

  for (const fountain of fountains) {
    const x = Math.floor(fountain.x / TILE);
    const row = level.surface(x);
    const expectedY = row * TILE - TRAY_BOTTOM;
    if (fountain.y !== expectedY) {
      throw new Error(
        `w${world.n} ${world.key}: fountain at x${x} tray ends at y${fountain.y + TRAY_BOTTOM}, ` +
        `not terrain y${row * TILE}`
      );
    }

    // The 116px tray extends beyond the centre tile in both directions.
    for (const supportX of [x - 1, x, x + 1]) {
      const supportRow = level.surface(supportX);
      const tile = level.tiles[supportRow * level.w + supportX];
      if (supportRow !== row || (tile !== 1 && tile !== 4 && tile !== 5)) {
        throw new Error(
          `w${world.n} ${world.key}: fountain at x${x} lacks flat solid support at x${supportX}`
        );
      }
    }
  }
}

if (fountainCount === 0) throw new Error('global audit found no authored fountains');
console.log(`✓ ${fountainCount} fountains across ${worlds.length} worlds sit flush on full-width terrain support`);
