#!/usr/bin/env node
// Quraysh verse 4 contains a verified silent tail. Its gem hold may release at
// the audible endpoint without changing ordinary verse playback or firing the
// completion callback twice.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const V3 = path.resolve(here, '..');

class FakeAudio {
  constructor() {
    this.currentTime = 0;
    this.paused = true;
    this.readyState = 4;
    this.muted = false;
    this.volume = 1;
    this._listeners = {};
  }
  load() {}
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
  addEventListener(type, fn) { (this._listeners[type] ||= []).push(fn); }
  removeEventListener(type, fn) {
    this._listeners[type] = (this._listeners[type] || []).filter((x) => x !== fn);
  }
  fire(type) {
    for (const fn of (this._listeners[type] || []).slice()) fn();
  }
}

const GOL = {
  EXPERIENCE: { recitation: true },
  V3: { reciter: 'alafasy' },
  RECITERS: { alafasy: { local: '../audio/alafasy/', remote: 'https://remote.invalid/' } }
};
const context = vm.createContext({
  window: { GOL }, Audio: FakeAudio, console, Math,
  setTimeout, clearTimeout
});
vm.runInContext(fs.readFileSync(path.join(V3, 'js/core/audio.js'), 'utf8'), context,
  { filename: 'js/core/audio.js' });

let ordinaryEnds = 0;
const ordinary = GOL.audio.playVerse(106, 3, () => ordinaryEnds++);
ordinary.el.currentTime = 99;
ordinary.el.fire('timeupdate');
assert.equal(ordinaryEnds, 0, 'ordinary verses must ignore timeupdate and end naturally');
ordinary.el.fire('ended');
ordinary.el.fire('ended');
assert.equal(ordinaryEnds, 1, 'ordinary verse callback must remain exactly once');

let trimmedEnds = 0;
const trimmed = GOL.audio.playVerse(106, 4, () => trimmedEnds++, { endAt: 12.69 });
trimmed.el.currentTime = 12.68;
trimmed.el.fire('timeupdate');
assert.equal(trimmedEnds, 0, 'Quraysh must preserve all audio before the measured endpoint');
trimmed.el.currentTime = 12.69;
trimmed.el.fire('timeupdate');
assert.equal(trimmedEnds, 1, 'Quraysh must release the gem hold at the audible endpoint');
assert.equal(trimmed.el.paused, true, 'the silent source tail must actually stop playing');
trimmed.el.fire('timeupdate');
trimmed.el.fire('ended');
assert.equal(trimmedEnds, 1, 'cutoff and later media events must not double-call completion');

// The recipe owns the exception, and the DSL carries it to the runtime level.
const require = createRequire(import.meta.url);
global.window = global;
global.addEventListener = () => {};
global.document = { createElement: () => ({ getContext: () => null }) };
require(path.join(V3, '..', 'js/data.js'));
require(path.join(V3, 'js/core/art.js'));
require(path.join(V3, 'js/dsl.js'));
global.GOL.V3 = { surah: null };
global.GOL.store = { data: {} };
require(path.join(V3, 'js/worlds.js'));
require(path.join(V3, 'js/worlds/w12-quraish.js'));
const level = global.GOL.buildPrototype(global.GOL.WORLDS3[11]);
assert.deepEqual(level.verseEndAt, { 4: 12.69 }, 'only Quraysh verse 4 should opt into cutoff');

const adventure = fs.readFileSync(path.join(V3, 'js/adventure.js'), 'utf8');
assert.match(adventure, /playVerse\(this\.L\.surahId, gp\.ayah,[\s\S]{0,400}\{ endAt \}/,
  'the gem-recitation path must pass the recipe cutoff to audio playback');

const follow = fs.readFileSync(path.join(V3, 'js/worlds/follow-estimated.js'), 'utf8');
assert.match(follow, /audioDurations: \[4\.6498, 8\.8816, 5\.982, 13\.4932\]/,
  'Quraysh follow metadata must match the measured file duration');

console.log('✓ Quraysh gem 4 releases at 12.69s; ordinary playback and callbacks stay intact');
