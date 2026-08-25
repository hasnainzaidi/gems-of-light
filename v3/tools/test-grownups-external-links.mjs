// Focused contract: public web pages leave the full-screen game, while the
// working Contact mailto continues through the platform's mail handler.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/grownups.js', import.meta.url), 'utf8');
let scene;
const openedAnchors = [];
const location = { href: 'capacitor://localhost/v3/' };
const document = {
  createElement(tag) {
    assert.equal(tag, 'a');
    const anchor = { href: '', target: '', rel: '', click() { openedAnchors.push({ ...anchor }); } };
    return anchor;
  }
};
const GOL = {
  color: { alpha: () => '' }, INK: '', INK_SOFT: '', GOLD: '',
  SAFE: { l: 0, r: 0, t: 0, b: 20 },
  WORLDS3: [], orderedWorlds: () => [],
  store: { data: {}, level: () => ({}), save() {} },
  worldProgressOpen: () => false,
  isStandalone: () => true,
  homeButton: () => ({ x: -100, y: -100, r: 1, fn() {} }),
  dist: () => 999,
  Input: { drag: null, releases: [], taps: [] },
  audio: { sfx() {}, stopAmbience() {} },
  registerScene(name, value) { assert.equal(name, 'grownups'); scene = value; }
};
const window = { GOL, location };
vm.runInNewContext(source, { window, document, URL, console }, { filename: 'grownups.js' });

function clickFooter(label) {
  const link = scene.layout(390, 844).legalLinks.find((item) => item.label === label);
  assert.ok(link, `${label} link exists`);
  GOL.Input.drag = { id: 1, x: link.x + 2, y: link.y + 2, startX: link.x + 2, startY: link.y + 2 };
  GOL.Input.releases = [];
  scene.update(0, 390, 844);
  GOL.Input.drag = null;
  GOL.Input.releases = [{ x: link.x + link.w / 2, y: link.y + link.h / 2 }];
  scene.update(0, 390, 844);
  GOL.Input.releases = [];
}

scene.enter();
clickFooter('Company');
clickFooter('Privacy');
assert.deepEqual(openedAnchors.map(({ href, target, rel }) => ({ href, target, rel })), [
  { href: 'https://playgemsoflight.com/company/', target: '_blank', rel: 'noopener noreferrer external' },
  { href: 'https://playgemsoflight.com/privacy/', target: '_blank', rel: 'noopener noreferrer external' }
]);
assert.equal(location.href, 'capacitor://localhost/v3/', 'web links do not trap the player inside the game WebView');

clickFooter('Contact');
assert.equal(location.href, 'mailto:developer@playgemsoflight.com', 'Contact keeps its working mailto behavior');
assert.equal(openedAnchors.length, 2, 'Contact is not rerouted through a browser tab');

console.log('grownups external links: ok');
