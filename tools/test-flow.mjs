// Flow tests that need real timers: the full-surah recitation sequence and
// the gate ceremony advancing on its own.  node tools/test-flow.mjs
// Requires @napi-rs/canvas (same as preview.mjs).
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { createCanvas, Image } = require('@napi-rs/canvas');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const VIEW_W = 1180, VIEW_H = 820;
const main = createCanvas(VIEW_W, VIEW_H);
// These tests exercise logic, not pixels. @napi-rs/canvas retains a native
// snapshot per canvas-as-source drawImage (OOM over thousands of pumped
// frames), so blits of prebuilt canvases are skipped entirely here.
// preview.mjs is the pixel-accurate harness.
{
  const proto = Object.getPrototypeOf(main.getContext('2d'));
  const raw = proto.drawImage;
  proto.drawImage = function (src, ...args) {
    if (src && typeof src.toBuffer === 'function') return; // skip raster blit
    return raw.call(this, src, ...args);
  };
}
main.style = {};
main.addEventListener = () => {};
main.getBoundingClientRect = () => ({ left: 0, top: 0, width: VIEW_W, height: VIEW_H });
main.setPointerCapture = () => {};

let NOW = 0;
const rafQ = [];
global.window = global;
global.devicePixelRatio = 1;
global.innerWidth = VIEW_W;
global.innerHeight = VIEW_H;
global.performance = { now: () => NOW };
global.requestAnimationFrame = (fn) => rafQ.push(fn);
global.addEventListener = () => {};
global.location = { protocol: 'file:' };
global.document = { getElementById: () => main, createElement: () => createCanvas(1, 1) };
global.localStorage = { _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = v; }, removeItem(k) { delete this._m[k]; } };

class FakeAudio {
  constructor() { this.paused = true; this.readyState = 4; this.currentTime = 0; this._ls = {}; }
  addEventListener(ev, fn) { (this._ls[ev] = this._ls[ev] || []).push(fn); }
  removeEventListener(ev, fn) { if (this._ls[ev]) this._ls[ev] = this._ls[ev].filter((f) => f !== fn); }
  play() {
    this.paused = false;
    this._t = setTimeout(() => {
      if (this.paused) return;
      this.paused = true;
      (this._ls.ended || []).slice().forEach((f) => f());
    }, 120);
    return { catch() {} };
  }
  pause() { this.paused = true; clearTimeout(this._t); }
  load() {}
}
global.Audio = FakeAudio;

for (const f of ['data', 'voice-lines', 'art', 'props', 'actors', 'audio', 'engine', 'levels', 'scenes', 'level', 'gate', 'room', 'modes', 'main']) {
  require(path.join(ROOT, 'js', f + '.js'));
}
const GOL = global.GOL;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function pumpFor(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    NOW += 1000 / 60;
    rafQ.splice(0).forEach((fn) => fn(NOW));
    await sleep(8);
  }
}
let failures = 0;
const ONLY = process.argv[2] || "";
const runTest = (id) => !ONLY || ONLY.split(",").includes(String(id));
const check = (name, ok) => {
  console.log((ok ? '✓ ' : '✗ ') + name);
  if (!ok) failures++;
};

// ---- 1. playSurah runs every verse, then ends
if (runTest(1)) {
  const surah = GOL.GOL_DATA_SHIM || window.GOL_DATA.surahs[0]; // Al-Kawthar, 3 verses
  const verses = [];
  let ended = false;
  GOL.audio.playSurah(surah, { onVerse: (i) => verses.push(i), onend: () => (ended = true) });
  await sleep(3 * (120 + 420) + 800);
  check('playSurah recites all ' + surah.verses.length + ' verses (got ' + verses.join(',') + ')', verses.join(',') === '0,1,2');
  check('playSurah calls onend', ended);
}

// ---- 2. the gate ceremony advances by itself: ignite → recite → open → walk
if (runTest(2)) {
  GOL.go('gate', { index: 0 });
  await pumpFor(900); // transition + enter
  const gate = GOL.SCENES.gate;
  check('gate begins in sort', gate.phase === 'sort');
  for (const g of gate.gems) g.placed = g.ayah - 1;
  gate.checkDone();
  check('gate ignites when all placed', gate.phase === 'ignite');
  await pumpFor(2200);
  check('gate reaches recite', gate.phase === 'recite' || gate.phase === 'open' || gate.phase === 'walk');
  await pumpFor(3200);
  check('gate reaches open/walk after recitation (phase: ' + gate.phase + ')', gate.phase === 'open' || gate.phase === 'walk');
  await pumpFor(4200);
  const st = GOL.store.level(108);
  check('surah marked completed', st.completed === true);
  check('next level unlocked', GOL.store.data.unlocked >= 1);
}

// ---- 3. a lone verse replay still stops a running sequence cleanly
if (runTest(3)) {
  const surah = window.GOL_DATA.surahs[1]; // Al-Ikhlas
  let seqEnded = false;
  GOL.audio.playSurah(surah, { onend: () => (seqEnded = true) });
  await sleep(160);
  GOL.audio.playVerse(surah.id, 1, null); // tap replay interrupts
  await sleep(1200);
  check('interrupted sequence stays stopped', !seqEnded && !GOL.audio._seq);
  GOL.audio.stopRecitation();
}

// ---- 4. a parent can open a surah out of sequence
if (runTest(4)) {
  GOL.go('parents');
  await pumpFor(900);
  const parents = GOL.SCENES.parents;
  parents.open = true;
  await pumpFor(100);
  const iLocked = GOL.store.data.unlocked + 2; // definitely locked
  GOL.Input.taps.push({ x: VIEW_W * 0.9275, y: parents.rowY(iLocked, VIEW_H) });
  await pumpFor(100);
  check('parent unlock chip opens level ' + iLocked, GOL.store.data.opened.includes(iLocked));
  check('map now treats it as open', GOL.store.isOpen(iLocked));
  check('later levels stay locked', !GOL.store.isOpen(iLocked + 1));
  GOL.Input.taps.push({ x: VIEW_W * 0.9275, y: parents.rowY(iLocked, VIEW_H) });
  await pumpFor(100);
  check('tapping again relocks it', !GOL.store.data.opened.includes(iLocked));
}

// ---- 5. the garden journey: seeds gather, bounce blossoms spring, echo asks
if (runTest(5)) {
  GOL.store.reset();
  GOL.go('level', { index: 0 });
  await pumpFor(1100); // transition + enter
  const lvl = GOL.SCENES.level;
  check('level begins fresh with journey ingredients', lvl.found.length === 0 && lvl.seedCount === 0 &&
    lvl.seeds.length > 10 && lvl.pads.length === 1 && !!lvl.blossomState && !!lvl.fly);
  // wander onto a seed
  const s0 = lvl.seeds[0];
  lvl.player.x = s0.x; lvl.player.y = s0.y + 16;
  await pumpFor(220);
  check('noor seed gathered on touch (count: ' + lvl.seedCount + ')', lvl.seedCount >= 1);
  // land on the bounce blossom
  const pad = lvl.pads[0];
  lvl.player.x = pad.x; lvl.player.y = pad.y; lvl.player.vy = 0; lvl.player.grounded = true;
  await pumpFor(240);
  check('bounce blossom springs the wanderer skyward', lvl.player.y < pad.y - 60);
  // find the hidden blossom
  const B = lvl.blossomState;
  lvl.player.x = B.x; lvl.player.y = B.y + 16; lvl.player.vy = 0;
  await pumpFor(200);
  check('hidden Rahma blossom found and remembered', B.taken && GOL.store.level(108).blossom === true && !!lvl.toast);
  // touch a gem: fly → recite → echo (first learn) → settle
  lvl.player.rescue = null; lvl.player.vy = 0;
  const g0 = lvl.L.gems[0];
  lvl.player.x = g0.x; lvl.player.y = g0.y + 16;
  await pumpFor(150);
  check('gem touch opens the collect moment', !!lvl.overlay);
  await pumpFor(900);
  check('overlay recites', lvl.overlay && lvl.overlay.phase === 'recite');
  await pumpFor(2000);
  check('first-learn overlay reaches the echo moment', lvl.overlay && lvl.overlay.phase === 'echo');
  await pumpFor(1000);
  GOL.Input.taps.push({ x: 10, y: 10 }); // a tap elsewhere carries on
  await pumpFor(300);
  check('echo ends into settle and is counted', (!lvl.overlay || lvl.overlay.phase === 'settle') && GOL.store.level(108).echoes === 1);
  await pumpFor(900);
  check('world resumes after the moment', !lvl.overlay);
}

// ---- 6. the listening gate: veiled gems, placement recites, seeds persist
if (runTest(6)) {
  GOL.go('gate', { index: 0, seeds: 12 });
  await pumpFor(900);
  const gate = GOL.SCENES.gate;
  check('gate gems arrive veiled', gate.gems.every((g) => g.veiled));
  // drop ayah 1 into its socket by hand (drag release path)
  const lay = gate.layout(VIEW_W, VIEW_H);
  const g1 = gate.gems.find((g) => g.ayah === 1);
  gate.heldGem = g1;
  GOL.Input.releases.push({ x: lay.sockets[0].x, y: lay.sockets[0].y });
  await pumpFor(45);
  check('correct placement lifts the veil', g1.placed === 0 && !g1.veiled);
  check('correct placement recites its ayah', GOL.audio.reciting);
  // finish the rest
  for (const g of gate.gems) g.placed = g.ayah - 1;
  gate.checkDone();
  await pumpFor(6500);
  check('ceremony completes (phase: ' + gate.phase + ')', gate.phase === 'open' || gate.phase === 'walk');
  await pumpFor(4200);
  const st = GOL.store.level(108);
  check('best seed gathering is remembered', st.seeds === 12);
  check('completion is stamped for memory blooms', st.completed && st.lastPlayed > 0);
}

// ---- 7. the Star Walk: gems only settle in surah order, gate honors it
if (runTest(7)) {
  GOL.go('level', { index: 0, recall: true });
  await pumpFor(1000);
  const lvl = GOL.SCENES.level;
  check('star walk enters recall mode', lvl.recall === true && lvl.firstLearn === false);
  const g2 = lvl.L.gems.find((g) => g.ayah === 2);
  lvl.player.x = g2.x; lvl.player.y = g2.y + 16; lvl.player.vy = 0;
  await pumpFor(200);
  check('out-of-order gem refuses gently', lvl.found.length === 0 && !lvl.overlay && lvl.nudgeT > 0);
  for (const ayah of [1, 2, 3]) {
    const g = lvl.L.gems.find((x) => x.ayah === ayah);
    lvl.player.rescue = null; lvl.player.vy = 0;
    lvl.player.x = g.x; lvl.player.y = g.y + 16;
    await pumpFor(200);
    check('star walk accepts ayah ' + ayah + ' in order', !!lvl.overlay || lvl.found.includes(ayah));
    // skip through the overlay quickly
    for (let s = 0; s < 40 && lvl.overlay; s++) {
      GOL.Input.taps.push({ x: 10, y: 10 });
      await pumpFor(140);
    }
  }
  check('all gems gathered in order', lvl.found.join(',') === '1,2,3');
  // walk to the arch → gate should be pre-placed, straight to ceremony
  lvl.player.x = lvl.L.arch.x; lvl.player.y = lvl.L.arch.y;
  await pumpFor(700);
  const gate = GOL.SCENES.gate;
  check('gate honors the walked order (phase: ' + gate.phase + ')', gate.phase !== 'sort' && gate.prePlaced);
  await pumpFor(9000);
  check('star walk completion recorded', GOL.store.level(108).starWalks >= 1);
  // leave for the map to settle
  await pumpFor(1500);
}

// ---- 8. the Moon Trial: listening questions, first-listen answers wax the moon
if (runTest(8)) {
  GOL.go('trial', { index: 0 });
  await pumpFor(900);
  const tr = GOL.SCENES.trial;
  check('trial asks 5 questions', tr.qs.length === 5);
  const okShapes = tr.qs.every((q) =>
    q.choices.includes(q.correct) &&
    q.choices.length >= 2 &&
    (q.type !== 'next' || (q.correct === q.prompt + 1 && !q.choices.includes(q.prompt))));
  check('questions are well-formed (next follows prompt, no prompt among choices)', okShapes);
  const st0 = { asked: GOL.store.level(108).trialAsked, ft: GOL.store.level(108).trialFirstTry };
  // answer first wrong (if possible), then right — no first-try credit
  let wrongPick = tr.choiceState.find((c) => c.ayah !== tr.q.correct);
  if (wrongPick) {
    tr.picked = wrongPick;
    tr.judge(VIEW_W, VIEW_H);
    check('wrong pick sleeps, question stays', wrongPick.asleep && tr.phase === 'ask');
  }
  tr.picked = tr.choiceState.find((c) => c.ayah === tr.q.correct);
  tr.judge(VIEW_W, VIEW_H);
  check('right pick rewards', tr.phase === 'reward');
  const st1 = GOL.store.level(108);
  check('asked counted once, no first-try credit after a miss',
    st1.trialAsked === st0.asked + 1 && st1.trialFirstTry === st0.ft + (wrongPick ? 0 : 1));
  // burn through remaining questions correctly
  for (let qi = 1; qi < 5; qi++) {
    await pumpFor(1700); // reward → next question
    if (tr.phase !== 'ask') break;
    tr.picked = tr.choiceState.find((c) => c.ayah === tr.q.correct);
    tr.judge(VIEW_W, VIEW_H);
  }
  await pumpFor(1900);
  check('trial ends at the moon', tr.phase === 'moon');
  check('the moon waxes and never wanes', GOL.store.level(108).moon >= st1.moon && GOL.store.level(108).moon > 0);
}

// ---- 9. the Meaning Match: sound carried to sense
if (runTest(9)) {
  GOL.go('meanings', { index: 0 });
  await pumpFor(900);
  const mm = GOL.SCENES.meanings;
  check('meaning match lays out all ayat', mm.gems.length === 3 && mm.cards.length === 3);
  const lay = mm.layout(VIEW_W, VIEW_H);
  // wrong drop drifts back
  const g1 = mm.gems.find((g) => g.ayah === 1);
  const wrongCard = lay.cards.find((cp) => cp.c.ayah !== 1);
  mm.held = g1;
  GOL.Input.releases.push({ x: wrongCard.x + 20, y: wrongCard.y + 10 });
  await pumpFor(80);
  check('wrong meaning blushes and gem drifts home', !g1.matched && wrongCard.c.blush > 0);
  // match all three correctly
  for (const ayah of [1, 2, 3]) {
    const g = mm.gems.find((x) => x.ayah === ayah);
    const cp = mm.layout(VIEW_W, VIEW_H).cards.find((c) => c.c.ayah === ayah);
    mm.held = g;
    GOL.Input.releases.push({ x: cp.x + 20, y: cp.y + 10 });
    await pumpFor(80);
    check('gem ' + ayah + ' joins its meaning', g.matched === true);
  }
  check('completed match is remembered', GOL.store.level(108).meanings === 1 && !!mm.donePhase);
}

// ---- 10. the Story: pages turn, the reading is remembered
if (runTest(10)) {
  GOL.go('story', { index: 0 });
  await pumpFor(900);
  const sc = GOL.SCENES.story;
  const pages = sc.story.pages.length;
  check('story has pages', pages >= 3);
  for (let i = 0; i < pages - 1; i++) {
    const nextBtn = sc.buttons.find((b) => b.iconName === 'play');
    check('page ' + (i + 1) + ' offers a next arrow', !!nextBtn);
    if (nextBtn) nextBtn.fn();
    await pumpFor(80);
  }
  check('reaching the last page marks the story read', sc.page === pages - 1 && GOL.store.level(108).storyRead === 1);
  const hearBtn = sc.buttons.find((b) => b.iconName === 'sound');
  check('last page offers to hear the surah whole', !!hearBtn);
}

// ---- 11. the world map is walked, not tapped
if (runTest(11)) {
  const kb = (key, down) => { GOL.Input._keys[key] = down; GOL.Input._syncKeys(); };
  const covered = GOL.WORLDS.flatMap((w) => w.levels);
  check('every level lives in exactly one world',
    covered.length === GOL.LEVELS.length && new Set(covered).size === GOL.LEVELS.length);
  GOL.store.reset();
  GOL.store.data.unlocked = 1;
  GOL.store.level(108).completed = true; // the first garden is finished
  GOL.store.save();
  GOL.go('map', { focus: 0 });
  await pumpFor(900);
  const map = GOL.SCENES.map;
  check('map wakes with the wanderer on the focused disc', map.wIndex === 0 && map.s === 0);
  kb('ArrowRight', true);
  await pumpFor(400);
  check('holding → walks the wanderer along the path (s=' + map.s.toFixed(2) + ')', map.s > 0.15);
  await pumpFor(1400);
  check('the path ends at the last open garden (s=' + map.s.toFixed(2) + ')', map.s <= 1 + 1e-6);
  kb('ArrowRight', false);
  await pumpFor(1800); // settle on the disc → the fresh garden walks in
  const lvl = GOL.SCENES.level;
  check('coming to rest on a fresh garden walks in', !!lvl.L && lvl.L.index === 1);
  // stroll off a finished garden and back: it offers its ways instead
  GOL.go('map', { focus: 0 });
  await pumpFor(900);
  kb('ArrowRight', true);
  await pumpFor(60); // a short stroll off the disc, then hands off nearby
  kb('ArrowRight', false);
  await pumpFor(800);
  check('resting on a finished garden offers its ways', map.panelNode === 0 && !!map._panel);
  // taps still work as a shortcut: walk over and in
  const n1 = map.layout(VIEW_W, VIEW_H).nodes[1];
  GOL.SCENES.level.L = null;
  GOL.Input.taps.push({ x: n1.x, y: n1.y });
  await pumpFor(1600);
  check('tapping a far disc strolls over and walks in', !!GOL.SCENES.level.L && GOL.SCENES.level.L.index === 1);
}

// ---- 12. worlds beyond: gateway arches walk between world maps
if (runTest(12)) {
  const kb = (key, down) => { GOL.Input._keys[key] = down; GOL.Input._syncKeys(); };
  const savedWorlds = GOL.WORLDS;
  GOL.WORLDS = [
    { index: 0, name: 'World One · Test', sub: 'three little gardens', palette: 'ikhlas', seed: 7, levels: [0, 1, 2] },
    { index: 1, name: 'World Two · Test', sub: 'three more beyond the arch', palette: 'fatiha', seed: 21, levels: [3, 4, 5] }
  ];
  GOL.store.reset();
  GOL.store.data.unlocked = 3; // world one done; world two's first garden open
  GOL.store.level(GOL.LEVELS[3].surahId).completed = true; // resting there should offer ways, not re-enter
  GOL.store.save();
  GOL.go('map', { focus: 2 });
  await pumpFor(900);
  const map = GOL.SCENES.map;
  check('map anchors to the finished world', map.wIndex === 0);
  const lay = map.layout(VIEW_W, VIEW_H);
  check('an open gateway stands past the last disc', !!lay.gateR && lay.gateR.open === true);
  check('no gateway west of the first world', !lay.gateL);
  kb('ArrowRight', true);
  await pumpFor(2000); // through the arch and into the next world
  kb('ArrowRight', false);
  await pumpFor(900);
  check('walking east through the arch reaches world two', map.wIndex === 1);
  check('world two shows its own gardens', map.wd.levels[0] === 3);
  kb('ArrowLeft', true);
  await pumpFor(2400); // and the western arch walks home again
  kb('ArrowLeft', false);
  await pumpFor(300);
  check('walking west returns to world one', map.wIndex === 0);
  GOL.WORLDS = savedWorlds;
}

// ---- 13. the long-surah gate: Al-'Alaq's 19 gems in two rows of settings
if (runTest(13)) {
  const iAlaq = GOL.LEVELS.findIndex((L) => L.key === 'alaq');
  check('Al-\'Alaq garden exists', iAlaq >= 0);
  GOL.go('gate', { index: iAlaq });
  await pumpFor(900);
  const gate = GOL.SCENES.gate;
  check('alaq gate deals 19 veiled gems', gate.gems.length === 19 && gate.gems.every((g) => g.veiled));
  const lay = gate.layout(VIEW_W, VIEW_H);
  check('settings sit in two rows', new Set(lay.sockets.map((s) => Math.round(s.y))).size === 2);
  check('every setting has its own place', new Set(lay.sockets.map((s) => s.x + ',' + s.y)).size === 19);
  let minGap = 1e9;
  for (let i = 0; i < lay.sockets.length; i++) {
    for (let j = i + 1; j < lay.sockets.length; j++) {
      minGap = Math.min(minGap, GOL.dist(lay.sockets[i].x, lay.sockets[i].y, lay.sockets[j].x, lay.sockets[j].y));
    }
  }
  check('settings keep breathing room (min ' + Math.round(minGap) + 'px)', minGap >= 40);
  // a drop lands in the NEAREST empty setting, not the first within reach
  const g7 = gate.gems.find((g) => g.ayah === 7);
  gate.heldGem = g7;
  GOL.Input.releases.push({ x: lay.sockets[6].x + 8, y: lay.sockets[6].y + 4 });
  await pumpFor(60);
  check('a drop near setting 7 takes setting 7', g7.placed === 6 && !g7.veiled);
  // and the whole surah still builds and ignites like any other
  for (const g of gate.gems) g.placed = g.ayah - 1;
  gate.checkDone();
  await pumpFor(250);
  check('the long gate ignites like any other', gate.phase === 'ignite');
  GOL.audio.stopRecitation();
}

console.log(failures ? failures + ' FAILURES' : 'all flow tests passed');
process.exit(failures ? 1 : 0);
