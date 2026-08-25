// Every visible seed star must remain collectible before approaching the
// campfire can lock the player into the recitation ceremony.
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

for (const file of readdirSync(join(V3, 'js', 'worlds'))) {
  if (/^w\d+-.*\.js$/.test(file) && !file.includes('-follow')) {
    require(join(V3, 'js', 'worlds', file));
  }
}

const TILE = GOL.TILE;
const CAMPFIRE_TRIGGER_RADIUS = 60; // adventure.js: ceremony begins at < 60 px
const TWO_PLAYER_PACES = TILE * 2;
const MIN_CLEARANCE = CAMPFIRE_TRIGGER_RADIUS + TWO_PLAYER_PACES;
const worlds = (GOL.WORLDS3 || []).filter((world) => world && world.build);

if (worlds.length !== 20) {
  throw new Error(`expected to audit 20 built worlds, found ${worlds.length}`);
}

const failures = [];
for (const world of worlds) {
  const level = GOL.buildPrototype(world);
  const playerCenterAtFire = {
    x: level.campfire.x,
    y: level.campfire.y - 16
  };
  level.seeds.forEach((seed, index) => {
    const distance = Math.hypot(
      seed.x - playerCenterAtFire.x,
      seed.y - playerCenterAtFire.y
    );
    if (distance < MIN_CLEARANCE) {
      failures.push(
        `w${world.n} ${world.key} seed ${index + 1} at ` +
        `(${(seed.x / TILE - 0.5).toFixed(1)}, ${(seed.y / TILE - 0.5).toFixed(1)}) ` +
        `is only ${distance.toFixed(1)}px from the campfire approach`
      );
    }
  });
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`✓ all ${worlds.length} worlds keep seeds at least ${MIN_CLEARANCE}px from campfire approach`);
