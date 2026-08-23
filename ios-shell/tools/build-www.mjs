#!/usr/bin/env node
// Gems of Light — ios-shell/tools/build-www.mjs
//
// Assembles ios-shell/www/ — the offline bundle WKWebView serves — from the
// repo, WITHOUT touching a single game file. The web game stays the truth;
// this reads it at build time, so new worlds and new script tags flow into
// the app with no shell edits (see v3/IOS-APP-STORE-PLAN.md, "The shell").
//
// Node >= 18, stdlib only. Rerunnable: www/ is wiped and rebuilt each time.
// It FAILS LOUDLY when something it expects is missing — a half-built bundle
// is a silently broken app on a child's phone.
//
// Run it:  cd ios-shell && npm run build-www

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHELL = path.resolve(HERE, '..');
const ROOT = path.resolve(SHELL, '..');
const WWW = path.join(SHELL, 'www');
const PRODUCTION_MAP = 'v3/map-artist-pack/journey-map.svg';

// ------------------------------------------------------------------ what --

// Everything the game needs on disk, in repo-relative paths. Directory
// structure is preserved exactly, because the game resolves its own assets
// relatively (v3/js/ui.js reaches '../art/', boot.js reaches '../audio/').
const COPY = [
  'js/data.js',        // the surah text — shared v1<->v3, lives at the root
  'v3/js',             // the whole game
  'v3/art',            // splash postcards
  PRODUCTION_MAP,       // the live journey map (drafts stay out)
  'icons',
  'assets',
  'company',           // public publisher identity, linked from grown-ups
  'privacy',           // canonical privacy policy, linked from grown-ups
  'legal.css',         // shared company/privacy page styling
  'audio/alafasy',     // Mishary — the one reciter that ships (plan blocker 3)
  'audio/voice'        // narration clips
];

// NOT copied, deliberately: v1/, v2/, concept-art/, map-artist drafts,
// sw.js (the service worker is the web's concern — Capacitor serves from
// disk), every *.md, every manifest*.webmanifest, and audio/basit/ (Abdul
// Basit is removed from the game entirely; the builder must never expect it).
const EXCLUDE_NAMES = new Set(['.DS_Store', 'sw.js']);
const EXCLUDE_RE = [
  /\.md$/i,
  /^manifest.*\.webmanifest$/i,
  /(^|\/)(v1|v2|concept-art|map-artist-pack|node_modules)(\/|$)/,
  /(^|\/)audio\/basit(\/|$)/
];

// The loose root audio/*.mp3 files are NOT copied. They are byte-identical
// duplicates of files already inside audio/alafasy/ (v1's copy of the same
// recitation, reached through v1's own 'audio/' base). v3 always resolves a
// reciter through GOL.RECITERS, so nothing in the app can ask for them —
// shipping them would add ~12 MB of duplicate mp3 to the download. The guard
// below re-checks that claim on every build; flip this to true if it ever
// starts warning and you want the belt-and-braces copy back.
const INCLUDE_ROOT_AUDIO_MP3S = false;

// If any of these fall out of the game's script list, the bundle is broken in
// a way no reviewer would catch before a child did. Fail instead.
const ESSENTIAL_SCRIPTS = [
  'js/data.js',
  'v3/js/core/engine.js',
  'v3/js/adventure.js',
  'v3/js/boot.js'
];

// ----------------------------------------------------------------- tools --

const warnings = [];
function warn(msg) { warnings.push(msg); console.warn('  ! ' + msg); }
function die(msg) {
  console.error('\nBUILD FAILED: ' + msg + '\n');
  process.exit(1);
}
function excluded(rel, name) {
  if (rel === PRODUCTION_MAP) return false;
  if (EXCLUDE_NAMES.has(name)) return true;
  return EXCLUDE_RE.some((re) => re.test(rel) || re.test(name));
}

let fileCount = 0;
let byteCount = 0;

function copyFile(rel) {
  const from = path.join(ROOT, rel);
  const to = path.join(WWW, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  fileCount++;
  byteCount += fs.statSync(from).size;
}

function copyTree(rel) {
  for (const entry of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })) {
    const childRel = rel + '/' + entry.name;
    if (excluded(childRel, entry.name)) continue;
    if (entry.isDirectory()) copyTree(childRel);
    else if (entry.isFile()) copyFile(childRel);
  }
}

function walk(dir, onFile, base = dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, onFile, base);
    else if (entry.isFile()) onFile(path.relative(base, full).split(path.sep).join('/'));
  }
}

function human(bytes) {
  if (bytes > 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
}

// ------------------------------------------------------------------ 1. www --

console.log('Gems of Light — building the iOS bundle');
console.log('  repo:   ' + ROOT);
console.log('  output: ' + WWW + '\n');

fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(WWW, { recursive: true });

for (const rel of COPY) {
  const from = path.join(ROOT, rel);
  if (!fs.existsSync(from)) {
    die('expected ' + rel + ' in the repo and it is not there.\n' +
      '  Either the game moved it (update COPY in this file) or you are not\n' +
      '  running from a full checkout.');
  }
  const before = fileCount;
  if (fs.statSync(from).isDirectory()) copyTree(rel);
  else copyFile(rel);
  console.log('  copied ' + rel + '  (' + (fileCount - before) + ' file' +
    (fileCount - before === 1 ? '' : 's') + ')');
}

// The duplicate-mp3 claim above, re-checked. Cheap, and it means a future
// loose file that is NOT a duplicate cannot slip out of the bundle unseen.
{
  const loose = fs.readdirSync(path.join(ROOT, 'audio'), { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.mp3'))
    .map((e) => e.name);
  if (INCLUDE_ROOT_AUDIO_MP3S) {
    for (const name of loose) copyFile('audio/' + name);
    console.log('  copied audio/*.mp3  (' + loose.length + ' files)');
  } else {
    const orphans = loose.filter((name) => {
      const a = path.join(ROOT, 'audio', name);
      const b = path.join(ROOT, 'audio', 'alafasy', name);
      return !fs.existsSync(b) || fs.statSync(a).size !== fs.statSync(b).size;
    });
    if (orphans.length) {
      warn('audio/ has ' + orphans.length + ' loose mp3 not mirrored in audio/alafasy/ (' +
        orphans.slice(0, 4).join(', ') + (orphans.length > 4 ? ', …' : '') +
        '). They are NOT in the bundle — check whether the game needs them, ' +
        'and set INCLUDE_ROOT_AUDIO_MP3S = true in this file if it does.');
    } else if (loose.length) {
      console.log('  skipped audio/*.mp3  (' + loose.length +
        ' duplicates of audio/alafasy — nothing in v3 asks for them)');
    }
  }
}

// The save bridge — hand-written, lives in www-src/ so www/ stays disposable.
{
  const bridge = path.join(SHELL, 'www-src', 'native-bridge.js');
  if (!fs.existsSync(bridge)) die('ios-shell/www-src/native-bridge.js is missing — it is the save bridge, the launch blocker.');
  fs.copyFileSync(bridge, path.join(WWW, 'native-bridge.js'));
  fileCount++;
  byteCount += fs.statSync(bridge).size;
  console.log('  copied www-src/native-bridge.js');
}

// ------------------------------------------------------- 2. index.html --

const indexPath = path.join(ROOT, 'index.html');
if (!fs.existsSync(indexPath)) die('the repo root index.html is missing — that is the game\'s front door.');
let html = fs.readFileSync(indexPath, 'utf8');

// (a) the ordered script list, exactly as the browser would run it
const SRC_TAG = /([ \t]*)<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>\s*<\/script>[ \t]*\n?/g;
const scripts = [];
let indent = '  ';
let first = true;

html = html.replace(SRC_TAG, (match, pad, src) => {
  const clean = src.split('?')[0].split('#')[0];   // ?v=NNN cache-busters are
  // meaningless off a local disk — Capacitor serves files, not HTTP caches.
  const onDisk = path.join(WWW, clean);
  if (!fs.existsSync(onDisk)) {
    // Tolerated on purpose: a script tag and its file get removed in two
    // steps (and by two people). A loud warning, not a dead build.
    warn('index.html loads ' + clean + ' but that file is not in the bundle — ' +
      'dropped from the manifest. (Fine if it is being removed right now; ' +
      'otherwise the game is about to be missing a piece.)');
    return '';
  }
  scripts.push(clean);
  if (first) { first = false; indent = pad; return ' SHELL_SCRIPTS '; }
  return '';
});

if (!scripts.length) die('found no <script src> tags in index.html — the transform found nothing to do.');
for (const need of ESSENTIAL_SCRIPTS) {
  if (!scripts.includes(need)) die(need + ' is not in index.html\'s script list. The game cannot boot without it.');
}

// (b) the bridge takes their place — save first, then the game, in order
const injection = [
  indent + '<!-- iOS shell (ios-shell/tools/build-www.mjs): the game\'s script tags',
  indent + '     became game-manifest.js. native-bridge.js restores the save from',
  indent + '     native storage FIRST, then injects them in this exact order. -->',
  indent + '<script src="game-manifest.js"></script>',
  indent + '<script src="native-bridge.js"></script>'
].join('\n') + '\n';
html = html.replace(' SHELL_SCRIPTS ', injection);

// (c) the web-only bits: the PWA manifest link and the service-worker
// registration. Capacitor serves from disk; both are noise (or a 404) here.
let strippedManifest = 0;
html = html.replace(/[ \t]*<link\b[^>]*\brel\s*=\s*["']manifest["'][^>]*>[ \t]*\n?/gi, () => {
  strippedManifest++;
  return '';
});
if (!strippedManifest) warn('no <link rel="manifest"> found in index.html — nothing to strip (harmless, but the transform expected one).');

let strippedSW = 0;
html = html.replace(/[ \t]*<script\b(?![^>]*\bsrc\s*=)[^>]*>[\s\S]*?<\/script>[ \t]*\n?/gi, (block) => {
  if (!/serviceWorker/.test(block)) return block;
  strippedSW++;
  return '';
});
if (!strippedSW) {
  warn('no service-worker registration found in index.html. If registration moved into a game JS file, native-bridge.js already neutralises navigator.serviceWorker.register — no action needed.');
}

// (d) everything else is left exactly as the web serves it.
if (/<script\b[^>]*\bsrc\s*=\s*["'](?!game-manifest\.js|native-bridge\.js)/i.test(html)) {
  die('a game <script src> survived the transform — the bridge would be bypassed.');
}
if (!html.includes('game-manifest.js') || !html.includes('native-bridge.js')) {
  die('the shell scripts were not injected into index.html.');
}

fs.writeFileSync(path.join(WWW, 'index.html'), html);
fileCount++;
byteCount += Buffer.byteLength(html);

const manifestJs =
  '// GENERATED by ios-shell/tools/build-www.mjs — do not edit by hand.\n' +
  '// The game\'s script tags from the repo root index.html, in load order.\n' +
  '// native-bridge.js injects them (async=false) once the save is restored.\n' +
  'window.GAME_SCRIPTS = [\n' +
  scripts.map((s) => '  ' + JSON.stringify(s)).join(',\n') +
  '\n];\n';
fs.writeFileSync(path.join(WWW, 'game-manifest.js'), manifestJs);
fileCount++;
byteCount += Buffer.byteLength(manifestJs);
console.log('  wrote  index.html + game-manifest.js  (' + scripts.length + ' game scripts, in order)');

// -------------------------------------------------------- 3. the sweep --

const leaks = [];
walk(WWW, (rel) => {
  const name = rel.split('/').pop();
  if (excluded(rel, name)) leaks.push(rel);
});
if (leaks.length) {
  die('files that must never ship reached www/:\n  ' + leaks.slice(0, 10).join('\n  '));
}

let total = 0;
let count = 0;
walk(WWW, (rel) => { total += fs.statSync(path.join(WWW, rel)).size; count++; });

console.log('\n  ' + count + ' files, ' + human(total) + ' in www/');
if (warnings.length) {
  console.log('  ' + warnings.length + ' warning' + (warnings.length === 1 ? '' : 's') + ' above — read them.');
}
console.log('\nDone. Next:  npx cap sync ios   (then npx cap open ios)\n');
