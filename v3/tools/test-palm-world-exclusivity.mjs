// Date palms are the defining visual language of Surat al-Masad. No other
// world may author or procedurally acquire one, while Masad's grove stays
// exactly as designed.
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

const worlds = GOL.WORLDS3.filter((world) => world && world.build);
if (worlds.length !== 20) throw new Error(`expected 20 built worlds, found ${worlds.length}`);

const expectedMasadPalmTiles = [6, 20, 41, 51, 56, 64, 74];
for (const world of worlds) {
  const level = GOL.buildPrototype(world);
  const palmTiles = level.props
    .filter((prop) => prop.type === 'palm')
    .map((prop) => Math.floor(prop.x / GOL.TILE));

  if (world.key === 'masad') {
    if (JSON.stringify(palmTiles) !== JSON.stringify(expectedMasadPalmTiles)) {
      throw new Error(
        `w${world.n} ${world.key}: expected preserved palms at ` +
        `${expectedMasadPalmTiles.join(', ')}, found ${palmTiles.join(', ') || 'none'}`
      );
    }
  } else if (palmTiles.length) {
    throw new Error(`w${world.n} ${world.key}: palm found at tile ${palmTiles.join(', ')}`);
  }
}

console.log(`✓ palms are exclusive to Surat al-Masad; its ${expectedMasadPalmTiles.length} authored palms are preserved`);
