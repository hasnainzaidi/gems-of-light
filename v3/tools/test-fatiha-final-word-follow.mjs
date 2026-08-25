import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const context = { window: { GOL: {} } };
vm.runInNewContext(
  fs.readFileSync(path.resolve(here, '../js/worlds/follow-estimated.js'), 'utf8'),
  context
);

const follow = context.window.GOL.WORD_FOLLOW.alafasy[1];
const finalAyah = follow.verses[7];
const finalWord = finalAyah.at(-1);

assert.equal(finalWord.text, 'ٱلضَّآلِّينَ');
assert.equal(finalAyah.at(-2).to, finalWord.from,
  'the read-along handoff into the final word must be continuous');
assert.ok(Math.abs(finalWord.to - follow.audioDurations[6]) < 0.01,
  'the held final word must remain active through the recording tail');

const heldSpan = finalWord.to - finalWord.from;
assert.ok(heldSpan >= 5,
  'the six-count final cadence must own its extended spoken span');
assert.ok(heldSpan / follow.audioDurations[6] >= 0.4,
  'the final cadence must not regress to generic letter-weight timing');

for (let i = 1; i < finalAyah.length; i++) {
  assert.equal(finalAyah[i - 1].to, finalAyah[i].from,
    `ayah 7 timing gap or overlap before word ${i + 1}`);
}

console.log('✓ Al-Fatiha ayah 7 follows the held final-word cadence through its audio tail');
