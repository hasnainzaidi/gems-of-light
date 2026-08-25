import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

function journey(save) {
  let saves = 0;
  const GOL = {
    store: {
      data: structuredClone(save),
      save() { saves++; }
    }
  };
  const context = vm.createContext({
    window: { GOL },
    Date,
    console
  });
  vm.runInContext(fs.readFileSync(path.resolve(here, '../js/worlds.js'), 'utf8'), context);
  GOL.registerWorld(8, { key: 'fatiha', surahId: 1, build() {} });
  GOL.registerWorld(9, { key: 'ikhlas', surahId: 112, build() {} });
  return { GOL, saves: () => saves };
}

// Current saves: earning Al-Fatiha's Grand Gem opens Al-Ikhlas.
{
  const { GOL } = journey({ levels: { 1: { completed: true } }, grand: { 1: 123 }, opened: [] });
  assert.equal(GOL.worldDone(8), true);
  assert.equal(GOL.worldProgressOpen(9), true);
  assert.equal(GOL.currentWorld(), 9);
}

// Migrated iOS saves may have the genuine level completion but no Grand-Gem
// ledger row. They must unlock immediately, then be repaired canonically.
{
  const completedAt = 456;
  const { GOL, saves } = journey({
    levels: { 1: { completed: true, completedAt } },
    opened: [],
    migrations: {
      resequence20260714: true,
      kursiInsert20260716: true,
      resequence20260810: true
    }
  });
  assert.equal(GOL.worldEarned(8), true, 'legacy completion evidence was ignored');
  assert.equal(GOL.worldProgressOpen(9), true, 'Al-Ikhlas stayed locked after Al-Fatiha');
  assert.equal(GOL.currentWorld(), 9, 'journey still pointed at completed Al-Fatiha');

  GOL.preserveVisitedWorlds();
  assert.equal(GOL.store.data.grand[1], completedAt, 'canonical Grand-Gem row was not restored');
  assert.equal(GOL.store.data.migrations.completionEvidence20260824, true);
  assert.equal(saves(), 1, 'completion repair should persist exactly once');

  GOL.preserveVisitedWorlds();
  assert.equal(saves(), 1, 'completion repair should be idempotent');
}

console.log('✓ Al-Fatiha completion opens Al-Ikhlas for current and migrated saves');
