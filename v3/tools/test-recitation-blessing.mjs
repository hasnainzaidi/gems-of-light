#!/usr/bin/env node
// Contract: THE RECITATION ELEMENT IS BLESSED BY A TAP.
//
// Safari grants media playback per ELEMENT, to elements first played inside a
// user gesture, and withdraws the grant again after an audio-session
// interruption (a call, Siri, another app). The one reused verse element is
// otherwise only ever played outside a gesture — the first gem of a world —
// and a refusal there is SILENT: no 'error' event fires, so the held listening
// beat runs its stall timeout out and the child walks on having heard no ayah.
// (Reported 2026-08-13 from a phone playtest of Al-Fil.) Every unlock tap must
// therefore bless the element, without ever pausing an ayah that is sounding.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const log = [];
let refusePlay = false;
const short = (s) => (s.startsWith('data:') ? 'SILENT' : s);

class FakeAudio {
  constructor(src) {
    this._src = src || ''; this.muted = false; this.volume = 1; this.currentTime = 0;
    this.paused = true; this.readyState = 4; this.loop = false; this.preload = ''; this._l = {};
  }
  set src(v) { this._src = v; }
  get src() { return this._src; }
  load() {}
  play() {
    if (refusePlay) { this.paused = true; log.push('refused ' + short(this._src)); return Promise.reject(new Error('NotAllowedError')); }
    this.paused = false;
    log.push('play ' + short(this._src) + (this.muted ? ' muted' : ''));
    return Promise.resolve();
  }
  pause() { this.paused = true; log.push('pause ' + short(this._src)); }
  addEventListener(k, f) { (this._l[k] = this._l[k] || []).push(f); }
  removeEventListener(k, f) { if (this._l[k]) this._l[k] = this._l[k].filter((x) => x !== f); }
  fire(k) { if (k === 'ended') this.paused = true; for (const f of (this._l[k] || []).slice()) f(); }
}
const silentNode = () => ({
  gain: { value: 0, setTargetAtTime() {}, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} },
  connect(x) { return x; }
});
class FakeCtx {
  constructor() { this.state = 'running'; this.currentTime = 0; this.sampleRate = 44100; this.destination = {}; }
  createGain() { return silentNode(); }
  createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; }
  createBufferSource() { return { buffer: null, loop: false, playbackRate: { value: 1 }, connect(x) { return x; }, start() {}, stop() {} }; }
  createBiquadFilter() { return { type: '', frequency: { value: 0 }, Q: { value: 0 }, connect(x) { return x; } }; }
  createOscillator() { return { type: '', frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, connect(x) { return x; }, start() {}, stop() {} }; }
  resume() { return Promise.resolve(); }
}

const GOL = {
  EXPERIENCE: { recitation: true },
  V3: { reciter: 'alafasy' },
  RECITERS: { alafasy: { local: '../audio/alafasy/', remote: 'https://remote/' } },
  AUDIO_BASE: '../audio/'
};
const win = { GOL, Audio: FakeAudio, AudioContext: FakeCtx };
const context = vm.createContext({
  window: win, console, Math, Date, Promise, Uint8Array, DataView, Float32Array,
  setTimeout, clearTimeout, Audio: FakeAudio,
  btoa: (s) => Buffer.from(s, 'binary').toString('base64')
});
vm.runInContext(fs.readFileSync(path.resolve(here, '../js/core/audio.js'), 'utf8'), context);
const A = GOL.audio;
const settled = async () => { await null; await null; await null; };

// 1 — the tap blesses the element, soundlessly, and hands it back unmuted
A.unlock();
await settled();
assert.ok(log.includes('play SILENT muted'), 'the unlock tap never played the verse element');
assert.ok(log.includes('pause SILENT'), 'the blessing was left sounding instead of paused');
assert.equal(A._verseEl.muted, false, 'the verse element was left muted');

// 2 — an ordinary ayah still plays, and a late-resolving blessing must never
//     pause it (a jump tap sits right before the gem it reaches)
log.length = 0;
A._versePrimed = false;
A.unlock();                    // the jump tap starts a blessing...
A.playVerse(113, 1, () => {}); // ...and the gem claims the element the same frame
await settled();
assert.ok(log.includes('play ../audio/alafasy/113001.mp3'), 'the ayah did not play');
assert.ok(!log.includes('pause ../audio/alafasy/113001.mp3'), 'a resolving blessing paused the Qur\'an');
assert.equal(A._verseEl.paused, false, 'the ayah was silenced by its own blessing');
A._verseEl.fire('ended');

// 3 — a withdrawn grant: the refusal re-arms, and the next tap resumes that
//     very ayah rather than clobbering it with the silent blessing
refusePlay = true;
A._versePrimed = true;
log.length = 0;
A.playVerse(113, 2, () => {});
await settled();
assert.ok(log.includes('refused ../audio/alafasy/113002.mp3'), 'the refusal never happened');
assert.equal(A._versePrimed, false, 'a refused ayah must drop the blessing so a tap wins it back');
refusePlay = false;
A.unlock();
await settled();
assert.ok(log.includes('play ../audio/alafasy/113002.mp3'), 'the next tap did not resume the refused ayah');
assert.ok(!log.includes('play SILENT muted'), 'the tap clobbered a waiting ayah with the blessing');

console.log('✓ every tap blesses the recitation element, and never silences an ayah');
