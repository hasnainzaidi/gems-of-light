#!/usr/bin/env node
// Ambient echo lost its child playtest. Production must stay collect-triggered
// even for returning saves that persisted the old near/world experiment.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const boot = fs.readFileSync(path.resolve(here, '../js/boot.js'), 'utf8');
const ui = fs.readFileSync(path.resolve(here, '../js/ui.js'), 'utf8');
const tunables = boot.slice(
  boot.indexOf('  const q = new URLSearchParams(location.search);'),
  boot.indexOf('  // ----------------------------------------------------------- safe area --')
);

function load(search, saved) {
  let written = null;
  const GOL = {
    RECITERS: { alafasy: {} },
    EXPERIENCE: { showcase: false, configKey: 'gemsOfLight.v3cfg' }
  };
  const context = vm.createContext({
    GOL, URLSearchParams, location: { search },
    localStorage: {
      getItem: () => JSON.stringify(saved || {}),
      setItem: (_key, value) => { written = JSON.parse(value); }
    }
  });
  vm.runInContext(tunables, context);
  return { GOL, written };
}

let run = load('', { v: 3, echo: 'world', debug: false });
assert.equal(run.GOL.V3.echo, 'off', 'a stale saved echo reactivated in production');
assert.equal(run.written.echo, 'off', 'the stale setting was not migrated to off');

run = load('?echo=near', {});
assert.equal(run.GOL.V3.echo, 'off', 'a production URL enabled the debug experiment');

run = load('?debug=1&echo=near', {});
assert.equal(run.GOL.V3.echo, 'near', 'the explicit debug experiment was lost');
run.GOL.DEBUG = false;
run.GOL.applyDebug();
assert.equal(run.GOL.V3.echo, 'off', 'leaving debug did not disable ambient echo');

run = load('?lab=20&echo=world', {});
assert.equal(run.GOL.V3.echo, 'world', 'the explicit lab experiment was lost');

assert.equal((ui.match(/label: 'ambient echo'/g) || []).length, 0,
  'the retired title Settings UI still exposes ambient echo');

console.log('✓ production ignores and migrates stale echo; debug/lab remains explicit');
