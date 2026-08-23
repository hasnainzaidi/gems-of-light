#!/usr/bin/env node
// Deterministic pre-Xcode checks for the generated Gems of Light iOS app.
// Real-device airplane-mode, silent-switch, and eviction tests still gate
// TestFlight; this catches packaging regressions before we reach the phone.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHELL = path.resolve(HERE, '..');
const ROOT = path.resolve(SHELL, '..');
const WWW = path.join(SHELL, 'www');
const IOS = path.join(SHELL, 'ios', 'App', 'App');

function fail(message) {
  console.error('\nNATIVE CHECK FAILED: ' + message + '\n');
  process.exit(1);
}
function need(condition, message) { if (!condition) fail(message); }
function read(rel) { return fs.readFileSync(path.join(SHELL, rel), 'utf8'); }

need(fs.existsSync(IOS), 'ios/App/App is missing. The committed Xcode project must be present.');

const html = fs.readFileSync(path.join(WWW, 'index.html'), 'utf8');
need(html.includes('game-manifest.js') && html.includes('native-bridge.js'), 'the shell loader is missing from www/index.html.');
need(!/rel=["']manifest["']/i.test(html), 'the PWA manifest leaked into the native bundle.');
need(!/serviceWorker\s*\.\s*register/.test(html), 'service-worker registration leaked into the native bundle.');
need(!fs.existsSync(path.join(WWW, 'sw.js')), 'sw.js leaked into the native bundle.');
need(!fs.existsSync(path.join(WWW, 'audio', 'basit')), 'the removed Basit reciter leaked into the native bundle.');

const sourceAudio = fs.readdirSync(path.join(ROOT, 'audio', 'alafasy')).filter((name) => name.endsWith('.mp3')).sort();
const bundledAudio = fs.readdirSync(path.join(WWW, 'audio', 'alafasy')).filter((name) => name.endsWith('.mp3')).sort();
need(JSON.stringify(sourceAudio) === JSON.stringify(bundledAudio), 'the Mishary audio set in www/ differs from the source set.');

const bundledBoot = fs.readFileSync(path.join(WWW, 'v3', 'js', 'boot.js'), 'utf8');
need(bundledBoot.includes('window.GOL_NATIVE === true'), 'native mode no longer suppresses the PWA installation experience.');

const delegate = fs.readFileSync(path.join(IOS, 'AppDelegate.swift'), 'utf8');
need(delegate.includes('import AVFAudio') && /setCategory\(\.playback/.test(delegate), 'AppDelegate no longer configures playback through the silent switch.');

const project = fs.readFileSync(path.join(SHELL, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj'), 'utf8');
need(project.includes('PRODUCT_BUNDLE_IDENTIFIER = com.playgemsoflight.app;'), 'the permanent bundle identifier changed.');

const icon = fs.readFileSync(path.join(IOS, 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png'));
need(icon.subarray(1, 4).toString() === 'PNG', 'the App Store icon is not a PNG.');
need(icon.readUInt32BE(16) === 1024 && icon.readUInt32BE(20) === 1024, 'the App Store icon must be 1024x1024.');
need(icon[25] === 2, 'the App Store icon must be opaque RGB (no alpha channel).');

// Exercise native-bridge.js with a tiny WKWebView/Capacitor model: native
// Preferences must restore before the first game script is appended, and a
// later localStorage save must mirror back to Preferences.
class MockStorage {
  constructor(seed = {}) { this.map = new Map(Object.entries(seed)); }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
}
const native = new Map([
  ['gemsOfLight.v3', '{"journey":"safe"}'],
  ['gemsOfLight.v3cfg', '{"v":3}']
]);
const prefs = {
  async keys() { return { keys: [...native.keys()] }; },
  async get({ key }) { return { value: native.has(key) ? native.get(key) : null }; },
  async set({ key, value }) { native.set(key, value); },
  async remove({ key }) { native.delete(key); }
};
const localStorage = new MockStorage();
const appended = [];
const context = {
  console,
  Promise,
  Date,
  setInterval,
  clearInterval,
  Storage: MockStorage,
  localStorage,
  GAME_SCRIPTS: ['first.js', 'second.js'],
  Capacitor: { isNativePlatform: () => true, Plugins: { Preferences: prefs } },
  navigator: {},
  document: {
    createElement: () => ({}),
    head: { appendChild(el) { appended.push({ src: el.src, restored: localStorage.getItem('gemsOfLight.v3') }); } }
  }
};
context.window = context;
vm.runInNewContext(read('www-src/native-bridge.js'), context, { filename: 'native-bridge.js' });
await new Promise((resolve) => setTimeout(resolve, 20));
need(appended.length === 2 && appended[0].restored === '{"journey":"safe"}', 'the game began before its native save was restored.');
localStorage.setItem('gemsOfLight.v3', '{"journey":"new"}');
await new Promise((resolve) => setTimeout(resolve, 0));
need(native.get('gemsOfLight.v3') === '{"journey":"new"}', 'a game save did not mirror into native Preferences.');

console.log('✓ offline bundle: ' + bundledAudio.length + ' Mishary files, no web-only cache or Basit assets');
console.log('✓ native identity, opaque App Store icon, and silent-switch audio configuration');
console.log('✓ native launch restores durable saves before boot and mirrors later writes');
console.log('\nNative preflight passed. Real-device tests still required before TestFlight.\n');
