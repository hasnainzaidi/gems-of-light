import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const v3 = path.resolve(here, '..');
const context = {
  window: {
    GOL: {
      TILE: 32,
      registerWorld(n, def) {
        this.WORLDS3 = this.WORLDS3 || [];
        this.WORLDS3[n - 1] = def;
      }
    }
  }
};

for (const file of ['js/worlds/follow-estimated.js', 'js/worlds/w20-tin.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(v3, file), 'utf8'), context);
}

const { GOL } = context.window;
const tin = GOL.WORLDS3[19];
assert.equal(tin.surahId, 95, 'World 20 must request the At-Tin recitation');

// Mishary Alafasy is the shipped `alafasy` reciter. This is the same exact
// lookup adventure.enter performs before drawing the karaoke highlight.
const selectedReciter = 'alafasy';
const follow = GOL.WORD_FOLLOW[selectedReciter][tin.surahId];
assert.ok(follow, 'At-Tin must have a follow table for Mishary Alafasy');
assert.equal(Object.keys(follow.verses).length, 8, 'all eight At-Tin ayat need highlighting');
assert.equal(follow.audioDurations.length, 8);

const expectedArabic = [
  'وَٱلتِّينِ وَٱلزَّيْتُونِ',
  'وَطُورِ سِينِينَ',
  'وَهَـٰذَا ٱلْبَلَدِ ٱلْأَمِينِ',
  'لَقَدْ خَلَقْنَا ٱلْإِنسَـٰنَ فِىٓ أَحْسَنِ تَقْوِيمٍ',
  'ثُمَّ رَدَدْنَـٰهُ أَسْفَلَ سَـٰفِلِينَ',
  'إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّـٰلِحَـٰتِ فَلَهُمْ أَجْرٌ غَيْرُ مَمْنُونٍ',
  'فَمَا يُكَذِّبُكَ بَعْدُ بِٱلدِّينِ',
  'أَلَيْسَ ٱللَّهُ بِأَحْكَمِ ٱلْحَـٰكِمِينَ'
];

for (let ayah = 1; ayah <= 8; ayah++) {
  const words = follow.verses[ayah];
  const duration = follow.audioDurations[ayah - 1];
  assert.ok(words.length > 0, `ayah ${ayah} needs at least one timed word`);
  assert.equal(words.map((word) => word.text).join(' '), expectedArabic[ayah - 1],
    `ayah ${ayah} timed words must match the displayed Arabic`);
  assert.equal(words[0].from, 0, `ayah ${ayah} highlighting must start with its audio`);
  assert.ok(Math.abs(words.at(-1).to - duration) < 0.01,
    `ayah ${ayah} highlighting must cover the recording tail`);
  for (let i = 0; i < words.length; i++) {
    assert.ok(words[i].to > words[i].from, `ayah ${ayah}, word ${i + 1} needs a positive span`);
    if (i > 0) assert.equal(words[i - 1].to, words[i].from,
      `ayah ${ayah} has a timing gap or overlap before word ${i + 1}`);
  }
  const audioName = `095${String(ayah).padStart(3, '0')}.mp3`;
  assert.ok(fs.existsSync(path.resolve(v3, '../audio/alafasy', audioName)),
    `missing shipped Mishary recording ${audioName}`);
}

console.log('✓ At-Tin selects Mishary follow data with complete, continuous karaoke timing');
