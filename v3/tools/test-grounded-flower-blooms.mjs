import { createRequire } from 'module';
import { readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const V3 = join(dirname(fileURLToPath(import.meta.url)), '..');

global.window = global;
global.addEventListener = () => {};
global.document = { createElement: () => ({ getContext: () => null, width: 0, height: 0 }) };

require(join(V3, '..', 'js', 'data.js'));
require(join(V3, 'js', 'core', 'art.js'));
require(join(V3, 'js', 'dsl.js'));

const GOL = global.GOL;
GOL.V3 = { surah: null };
GOL.store = { data: { grand: {} }, level: () => ({}), save() {} };
GOL.scenes = {};
GOL.registerScene = (name, scene) => { GOL.scenes[name] = scene; };
require(join(V3, 'js', 'worlds.js'));
const worldDir = join(V3, 'js', 'worlds');
for (const file of readdirSync(worldDir)
  .filter((name) => /^w\d+-.*\.js$/.test(name))
  .sort((a, b) => Number(a.match(/^w(\d+)/)[1]) - Number(b.match(/^w(\d+)/)[1]))) {
  require(join(worldDir, file));
}
require(join(V3, 'js', 'adventure.js'));

const TILE = GOL.TILE;
const adventure = GOL.scenes.adventure;

function assertGrounded(L, flowers, label) {
  for (const p of flowers) {
    const x = Math.floor(p.x / TILE), y = Math.round(p.y / TILE);
    if (y !== L.groundBloomRow || L.surface(x) !== y ||
        L.tiles[y * L.w + x] !== 1 || L.tiles[(y - 1) * L.w + x] !== 0) {
      throw new Error(`${label}: flower at ${x},${y} is not on valid base ground row ${L.groundBloomRow}`);
    }
  }
}

const builtWorlds = GOL.WORLDS3.filter((w) => w && w.build);
if (builtWorlds.length !== 20) throw new Error(`expected 20 built worlds, found ${builtWorlds.length}`);

for (const def of builtWorlds) {
  const worldN = def.n;
  const L = GOL.buildPrototype(GOL.WORLDS3[worldN - 1]);
  if (!L.groundBloomsOnly) throw new Error(`w${worldN}: global grounded-bloom policy is off`);
  if (!Number.isInteger(L.groundBloomRow) || L.groundBloomRow >= L.h) {
    throw new Error(`w${worldN}: no valid base-ground row`);
  }

  const scene = Object.assign(Object.create(adventure), {
    L,
    t: 1,
    fx: { spawn() {} }
  });
  // Verify authored and deterministic decoration flowers after recipe build.
  assertGrounded(L, L.props.filter((p) => p.type === 'flowers'), `w${worldN} authored`);

  const originalRandom = Math.random;
  Math.random = () => 0.5;
  try {
    const before = L.props.length;
    for (let x = 2; x < L.w - 2; x++) scene.bloomAround((x + 0.5) * TILE, { sound: false });
    assertGrounded(L, L.props.slice(before).filter((p) => p.type === 'flowers'), `w${worldN} restoration`);

    L.bloomBanks = [[1, L.w - 2]];
    const bankBefore = L.props.length;
    scene.bloomBanks();
    assertGrounded(L, L.props.slice(bankBefore).filter((p) => p.type === 'flowers'), `w${worldN} bank`);

    const levelState = { replays: 1 };
    GOL.store.data.grand[L.surahId] = 1;
    GOL.store.level = () => levelState;
    const replayBefore = L.props.length;
    scene.applyReplayGrowth(L, true);
    assertGrounded(L, L.props.slice(replayBefore).filter((p) => p.type === 'flowers'), `w${worldN} replay`);
  } finally {
    Math.random = originalRandom;
  }
}

// Confirmed playtest regression: Quraysh's first-gem stepping stones and water
// must not become planting beds.
const quraish = GOL.buildPrototype(GOL.WORLDS3[11]);
const quraishScene = Object.assign(Object.create(adventure), { L: quraish });
for (const x of [13, 14, 15, 16, 17, 18]) {
  if (quraishScene.bloomSurface(x) < quraish.h) {
    throw new Error(`Quraysh crossing column ${x} incorrectly accepts flowers`);
  }
}

console.log(`✓ all ${builtWorlds.length} worlds keep authored, restoration, bank and replay flowers on valid base ground`);
