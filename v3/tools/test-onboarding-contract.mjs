#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (name) => fs.readFileSync(path.resolve(here, '..', name), 'utf8');

const preview = read('js/parent-preview.js');
assert.doesNotMatch(preview, /GOL\.store|localStorage|sessionStorage/,
  'parent preview must not touch the child save or browser storage');
assert.match(preview, /registerScene\(['"]parentPreview['"]/,
  'parent preview scene is not registered');

const onboarding = read('js/onboarding.js');
for (const stage of ['welcome', 'preview', 'knowledge', 'setup', 'handoff']) {
  assert.match(onboarding, new RegExp("['\"]" + stage + "['\"]"),
    `canonical onboarding stage missing: ${stage}`);
}
assert.doesNotMatch(onboarding, /stage === ['"]sound['"]|tap to change|I can hear it/,
  'the playable preview already proves sound; onboarding must not repeat it');
assert.match(onboarding, /completeParentOnboarding/,
  'handoff must persist the adult/child boundary');
assert.match(onboarding, /journeyStageDraft/,
  'parent journey placement must remain a draft until handoff');
assert.match(onboarding, /Where are they in their memorisation journey/,
  'placement should be one parent self-assessment, not a surah checklist');
assert.match(onboarding, /surahs below are just examples/,
  'surah examples must not read as the complete contents of a stage');
assert.match(onboarding, /Around:/,
  'each card must frame its surahs as an approximate journey neighbourhood');
assert.match(onboarding, /childMode|childWelcome|handoff/,
  'handoff must enter the child postcard explicitly');
assert.match(onboarding, /Explore\s+→\s+Collect\s+→\s+Restore/,
  'Showcase onboarding must explain its secular loop');
assert.match(onboarding, /Make Gems of Light yours/,
  'Showcase setup must speak to the guest directly');

assert.match(preview, /Explore\s+→\s+collect\s+→\s+restore/,
  'Showcase preview must reinforce its secular loop');
assert.match(preview, /GOL\.EXPERIENCE\.recitation/,
  'Showcase preview must never request verse playback');

const boot = read('js/boot.js');
assert.match(boot, /parentComplete/);
assert.match(boot, /childStarted/);
assert.match(boot, /hasJourneyProgress/,
  'existing saves need a backward-compatible porch bypass');
assert.match(boot, /q\.get\(['"]onboarding['"]\) === ['"]1['"]/,
  'visual QA must be able to force onboarding without clearing a save');

const map = read('js/map.js');
assert.match(map, /markChildStarted/,
  'child progress must begin at the real journey boundary');
assert.match(map, /firstInvite/,
  'fresh handoff must have a dedicated first-map invitation');
assert.match(map, /handoffStartSlot/,
  'prepared handoff must start on the previous island endpoint');

for (const entry of ['index.html', '../index.html']) {
  const html = fs.readFileSync(path.resolve(here, '..', entry), 'utf8');
  const onboardingAt = html.indexOf('onboarding.js');
  const previewAt = html.indexOf('parent-preview.js');
  const bootAt = html.indexOf('boot.js');
  assert.ok(onboardingAt >= 0 && previewAt >= 0, `${entry} is missing onboarding scenes`);
  assert.ok(onboardingAt < bootAt && previewAt < bootAt,
    `${entry} must register onboarding scenes before boot`);
}

console.log('✓ onboarding order, save isolation, resume safety, and entry wiring');
