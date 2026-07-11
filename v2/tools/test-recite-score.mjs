import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const scorer = require('../js/recite-score.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(new URL('../js/data.js', import.meta.url), 'utf8'), context);
const falaq = context.window.GOL_DATA.surahs.find((s) => s.id === 113);
const words = falaq.verses.map((v) => v.ar.split(/\s+/));

assert.deepEqual(Array.from(words, (v) => v.length), [4, 4, 5, 5, 5]);
for (let i = 0; i < 5; i++) assert.equal(scorer.score(falaq.verses[i].ar, words[i]).score, 1);

assert.equal(scorer.score('قل اعوذ برب الفلق', words[0]).score, 1);
assert.equal(scorer.score('الفلق', ['ٱلْفَلَقِ']).score, 1);
assert.equal(scorer.normalizeWord('ٱلنَّفَّـٰثَـٰتِ'), 'النفثت');
assert.equal(scorer.similarity(scorer.normalizeWord('النفاثات'), scorer.normalizeWord('ٱلنَّفَّـٰثَـٰتِ')), 0.75);
assert.equal(scorer.score('ومن شر النفاثات في العقد', words[3]).score, 1);
assert.equal(scorer.score('بسم الله الرحمن الرحيم قل اعوذ برب الفلق', words[0]).score, 1);

const missing = scorer.score('ومن شر غاسق اذا', words[2]);
assert.equal(missing.score, 0.8);
assert.deepEqual(missing.matched, [0, 1, 2, 3]);

assert.ok(scorer.score(falaq.verses[0].ar, words[4]).score <= 0.25);
assert.ok(scorer.score(falaq.verses[2].ar, words[3]).score <= 0.5);
assert.equal(scorer.score('', words[0]).score, 0);
assert.equal(scorer.score('hello 123', words[0]).score, 0);

console.log('recite-score: all normalization and alignment checks passed');
