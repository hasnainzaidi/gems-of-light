#!/usr/bin/env node
// A listening beat must survive an iOS app interruption. Background time must
// not consume the media stall/guard timers and skip an ayah on foreground.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const listeners = {};
const timers = new Map();
let timerId = 0;
const setTimer = (fn, ms) => { const id = ++timerId; timers.set(id, { fn, ms }); return id; };
const clearTimer = (id) => timers.delete(id);

class FakeAudio {
  constructor(src = '') {
    this.src = src; this.paused = true; this.readyState = 4; this.currentTime = 0;
    this.muted = false; this.volume = 1; this.preload = ''; this.loop = false; this._l = {};
    this.plays = 0; this.pauses = 0;
  }
  load() {}
  play() { this.paused = false; this.plays++; return Promise.resolve(); }
  pause() { this.paused = true; this.pauses++; }
  addEventListener(k, f) { (this._l[k] ||= []).push(f); }
  removeEventListener(k, f) { this._l[k] = (this._l[k] || []).filter((x) => x !== f); }
  fire(k) { if (k === 'ended') this.paused = true; for (const f of (this._l[k] || []).slice()) f(); }
}
const document = {
  hidden: false,
  addEventListener(k, f) { (listeners[k] ||= []).push(f); }
};
const windowListeners = {};
const win = {
  GOL: {
    EXPERIENCE: { recitation: true }, V3: { reciter: 'alafasy' },
    RECITERS: { alafasy: { local: '../audio/alafasy/', remote: 'https://remote/' } }
  },
  Audio: FakeAudio,
  addEventListener(k, f) { (windowListeners[k] ||= []).push(f); }
};
const context = vm.createContext({
  window: win, document, Audio: FakeAudio, console, Math, Date, Promise,
  Uint8Array, DataView, Float32Array, btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  setTimeout: setTimer, clearTimeout: clearTimer
});
vm.runInContext(fs.readFileSync(path.resolve(here, '../js/core/audio.js'), 'utf8'), context);
const A = win.GOL.audio;
let ended = 0;
A.playVerse(113, 1, () => ended++);
const el = A._verseEl;
assert.equal(el.plays, 1);
assert.equal(timers.size, 2, 'the active ayah should own stall and guard timers');

document.hidden = true;
for (const f of listeners.visibilitychange || []) f();
assert.equal(el.paused, true, 'backgrounding did not pause the listening beat');
assert.equal(timers.size, 0, 'wall-clock timers remained armed in the background');
assert.equal(ended, 0);

document.hidden = false;
for (const f of listeners.visibilitychange || []) f();
assert.equal(el.paused, false, 'foregrounding did not resume the interrupted ayah');
assert.equal(el.plays, 2);
assert.equal(timers.size, 2, 'foregrounding did not give the ayah a fresh active-time guard');
el.fire('ended');
assert.equal(ended, 1);
assert.equal(timers.size, 0);

// The between-ayah breath is another race: a suspended timer must not launch
// the next verse while the app is hidden, nor launch it twice on pageshow.
const surah = { id: 113, verses: [{ n: 1 }, { n: 2 }] };
A.playSurah(surah, {});
assert.equal(el.plays, 3);
el.fire('ended');
assert.equal(timers.size, 1, 'the sequence did not enter its between-ayah gap');
document.hidden = true;
for (const f of listeners.visibilitychange || []) f();
assert.equal(timers.size, 0, 'the between-ayah timer survived backgrounding');
document.hidden = false;
for (const f of listeners.visibilitychange || []) f();
assert.equal(timers.size, 1, 'the pending sequence step was not restored');
const pending = [...timers.entries()][0];
timers.delete(pending[0]);
pending[1].fn();
assert.equal(el.plays, 4, 'the second ayah did not begin exactly once');
el.fire('ended');
A.stopRecitation();

console.log('✓ iOS background time cannot skip an active ayah');
