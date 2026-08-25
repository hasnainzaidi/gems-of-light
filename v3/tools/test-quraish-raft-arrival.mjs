#!/usr/bin/env node
// Quraysh's ferry should arrive from just beyond the phone view, without
// changing the bank-to-bank route or the default behavior of other rafts.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const V3 = join(dirname(fileURLToPath(import.meta.url)), '..');

global.window = global;
global.addEventListener = () => {};
global.document = { createElement: () => ({ getContext: () => null }) };

require(join(V3, '..', 'js', 'data.js'));
require(join(V3, 'js', 'core', 'art.js'));
require(join(V3, 'js', 'dsl.js'));
global.GOL.V3 = { surah: null };
global.GOL.store = { data: {} };
require(join(V3, 'js', 'worlds.js'));
require(join(V3, 'js', 'worlds', 'w12-quraish.js'));

const { GOL } = global;
const TILE = GOL.TILE;
const world = GOL.WORLDS3[11];
const level = GOL.buildPrototype(world);
const rafts = level.moverDefs.filter((m) => m.kind === 'raft');
assert.equal(rafts.length, 1, 'Quraysh should have exactly one ferry');

const raft = rafts[0];
assert.equal(raft.x0, 49.5 * TILE, 'left-bank landing must remain unchanged');
assert.equal(raft.x1, 64.5 * TILE, 'far-bank landing must remain unchanged');
assert.equal(raft.startX, 59.5 * TILE, 'ferry must stage near the approaching view');
assert.equal(raft.startDir, -1, 'staged ferry must initially travel toward the child');
assert.equal(raft.wakeX, 46.5 * TILE, 'ferry must wait for the child to reach the crossing');

// Default play shows 16 columns and may look 74px ahead. At the last dry tile,
// the raft (including its full half-width) must still begin beyond the right
// edge, then reveal itself promptly and reach the bank without a long wait.
const approachX = raft.wakeX;
const viewRight = approachX + 8 * TILE + 74;
const raftLeftEdge = raft.startX - raft.hw;
assert(raftLeftEdge > viewRight, 'ferry must spawn fully off-screen-right');
const revealSeconds = (raftLeftEdge - viewRight) / raft.speed;
const arrivalSeconds = (raft.startX - raft.x0) / raft.speed;
assert(revealSeconds < 1, `ferry should appear promptly (got ${revealSeconds.toFixed(2)}s)`);
assert(arrivalSeconds <= 3.5, `ferry should reach the near bank promptly (got ${arrivalSeconds.toFixed(2)}s)`);

// The generic DSL remains backward-compatible: an ordinary raft has no custom
// start fields and therefore uses adventure.js's x0/+1 fallbacks.
const ordinary = GOL.makeBuilder(20, 16);
ordinary.raft(2, 10, 12);
assert.equal(ordinary.moverDefs[0].startX, undefined);
assert.equal(ordinary.moverDefs[0].startDir, undefined);
assert.equal(ordinary.moverDefs[0].wakeX, undefined);
const adventureSource = fs.readFileSync(join(V3, 'js', 'adventure.js'), 'utf8');
assert.match(adventureSource, /Number\.isFinite\(m\.startX\) \? m\.startX : m\.x0/,
  'runtime must fall back to x0 for ordinary rafts');
assert.match(adventureSource, /dir: m\.startDir === -1 \? -1 : 1/,
  'runtime must fall back to forward travel for ordinary rafts');
assert.match(adventureSource, /waiting: Number\.isFinite\(m\.wakeX\)/,
  'runtime must hold an opted-in raft at its staging point');
assert.match(adventureSource, /if \(this\.player\.x < m\.wakeX\)[\s\S]{0,160}continue;/,
  'staged raft must remain still until the child reaches its wake point');

console.log(`✓ Quraysh ferry appears in ${revealSeconds.toFixed(2)}s and reaches the near bank in ${arrivalSeconds.toFixed(2)}s`);
