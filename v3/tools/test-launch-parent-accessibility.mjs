#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (name) => fs.readFileSync(path.resolve(here, '..', name), 'utf8');

const onboarding = read('js/onboarding.js');
assert.match(onboarding, /mountAccessRegion\(['"]Gems of Light grown-up setup['"]\)/,
  'onboarding must expose a semantic region beside the canvas');
assert.match(onboarding, /aria-live=["']polite["']/,
  'onboarding stage changes need a polite announcement');
assert.match(onboarding, /aria-pressed/,
  'journey placement choices need selected-state semantics');
assert.match(onboarding, /GOL\.isStandalone[\s\S]{0,180}secondary:\s*null/,
  'native/installed setup must not offer the contradictory defer action');
assert.match(onboarding, /if \(a\.secondary\) drawButton/,
  'the visual setup card must tolerate the native single-action layout');

const preview = read('js/parent-preview.js');
assert.match(preview, /aria-label['"], ['"]Try the Gems of Light garden/,
  'parent preview needs an assistive-technology label');
assert.match(preview, /Explore toward the gem/,
  'switch control needs a deterministic way to perform the preview');
assert.match(preview, /canContinue\s*=\s*this\.cardRound\s*===\s*0/,
  'preview exploration must be bounded instead of repeating one ayah forever');
assert.match(preview, /if \(L\.canContinue\) pill/,
  'the visual card must remove Continue after the bounded second pass');

const grownups = read('js/grownups.js');
assert.match(grownups, /aria-label['"], ["']Your child's journey/,
  'grown-ups page needs a named semantic region');
for (const label of ['Company information', 'Privacy policy', 'Contact support']) {
  assert.ok(grownups.includes(label), `grown-ups semantic footer missing ${label}`);
}
assert.match(grownups, /aria-pressed/,
  'map-opening switches need their state exposed');
assert.match(grownups, /exit\(\)[\s\S]{0,100}this\.access\.remove/,
  'scene accessibility controls must be removed on exit');

console.log('✓ native setup, bounded preview, and parent accessibility contracts');
