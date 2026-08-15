// Gems of Light — ios-shell/www-src/native-bridge.js
//
// The durable-save bridge, and the game's loader inside the iOS app.
//
// WKWebView's localStorage is EVICTABLE: iOS may clear it under storage
// pressure, and a child losing their whole journey is the one unrecoverable
// bug (v3/IOS-APP-STORE-PLAN.md, launch blocker 1). So on the phone:
//
//   Capacitor Preferences (native, durable) = the truth
//   localStorage                            = the working copy
//
// Before any game script runs we copy anything the working copy is missing
// back from the truth; from then on every save mirrors out to it.
//
// Outside the app — a plain browser opening ios-shell/www/index.html — this
// file is a transparent no-op that just loads the game, so the bundle can be
// smoke-tested on a laptop. The game itself is never modified, and never
// knows any of this happened (beyond a harmless window.GOL_NATIVE flag).
(function () {
  'use strict';

  var PREFIX = 'gemsOfLight';   // gemsOfLight.v3, gemsOfLight.v3cfg, showcase…
  var PLUGIN_WAIT_MS = 3000;

  // -------------------------------------------------------------- loader --
  // The game's tags were lifted out of index.html into game-manifest.js.
  // async = false makes dynamically inserted scripts run in insertion order,
  // exactly as the document's own tags did.
  //
  // Safe because nothing in the game waits for DOMContentLoaded or load —
  // every file is a parse-time IIFE, and boot.js reads document.body and
  // #game directly. Those already exist when this runs (this script sits at
  // the end of <body>), so injected-late scripts see the same DOM the
  // original tags saw. If a future game file ever gates on those events, it
  // must use document.readyState — a bare addEventListener('load', …) would
  // register after the event has fired and never run.
  function loadGame() {
    var list = window.GAME_SCRIPTS;
    if (!list || !list.length) {
      console.error('[shell] game-manifest.js did not load — the game has no scripts to run. Rebuild with `npm run build-www`.');
      return;
    }
    var host = document.head || document.documentElement;
    for (var i = 0; i < list.length; i++) {
      var el = document.createElement('script');
      el.src = list[i];
      el.async = false;   // keep document order
      host.appendChild(el);
    }
  }

  // ------------------------------------------------------------- capacitor --
  function isNative() {
    try {
      return !!(window.Capacitor &&
        typeof window.Capacitor.isNativePlatform === 'function' &&
        window.Capacitor.isNativePlatform());
    } catch (e) { return false; }
  }

  function prefsPlugin() {
    try {
      return (window.Capacitor && window.Capacitor.Plugins &&
        window.Capacitor.Plugins.Preferences) || null;
    } catch (e) { return null; }
  }

  // The native bridge normally has the plugins registered before this runs;
  // wait a beat rather than boot into a save-less game if it is a frame late.
  function waitForPrefs(timeoutMs) {
    return new Promise(function (resolve) {
      var found = prefsPlugin();
      if (found) return resolve(found);
      var started = Date.now();
      var poll = setInterval(function () {
        var p = prefsPlugin();
        if (p || Date.now() - started > timeoutMs) {
          clearInterval(poll);
          resolve(p || null);
        }
      }, 25);
    });
  }

  // ------------------------------------------------------------- restore --
  // Preferences wins only where localStorage has nothing: an existing working
  // copy is either identical or newer (the mirror below keeps them in step),
  // and overwriting live play with stale native data would be its own bug.
  function restore(prefs) {
    return prefs.keys().then(function (res) {
      var keys = (res && res.keys) || [];
      var restored = 0;
      var chain = Promise.resolve();
      keys.forEach(function (key) {
        chain = chain.then(function () {
          if (localStorage.getItem(key) !== null) return null;
          return prefs.get({ key: key }).then(function (got) {
            var value = got && got.value;
            if (value == null) return;
            localStorage.setItem(key, value);
            restored++;
          });
        });
      });
      return chain.then(function () {
        if (restored) console.log('[shell] restored ' + restored + ' saved key(s) from native storage.');
      });
    });
  }

  // -------------------------------------------------------------- mirror --
  // Every game save goes through localStorage.setItem (GOL.store.save and
  // GOL.saveV3cfg). Wrapping Storage.prototype catches all of them without
  // the game knowing, now and for any key a future feature adds.
  function installMirror(prefs) {
    var proto = window.Storage && window.Storage.prototype;
    if (!proto || proto.__golMirrored) return;

    var setItem = proto.setItem;
    var removeItem = proto.removeItem;
    var ours = function (store, key) {
      try {
        return store === window.localStorage && String(key).indexOf(PREFIX) === 0;
      } catch (e) { return false; }
    };
    var quiet = function () { /* fire and forget: a failed mirror must never break play */ };

    proto.setItem = function (key, value) {
      var out = setItem.apply(this, arguments);
      if (ours(this, key)) {
        try { prefs.set({ key: String(key), value: String(value) }).catch(quiet); } catch (e) { /* play on */ }
      }
      return out;
    };
    proto.removeItem = function (key) {
      var out = removeItem.apply(this, arguments);
      if (ours(this, key)) {
        try { prefs.remove({ key: String(key) }).catch(quiet); } catch (e) { /* play on */ }
      }
      return out;
    };
    proto.__golMirrored = true;
  }

  // ------------------------------------------------------------ no worker --
  // sw.js is not in the bundle (Capacitor serves from disk). The registration
  // snippet is stripped from index.html by the builder; this covers the case
  // where a game file we must not edit registers one itself.
  function neutraliseServiceWorker() {
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.register) {
        navigator.serviceWorker.register = function () { return Promise.resolve(undefined); };
      }
    } catch (e) { /* nothing to neutralise */ }
  }

  // ---------------------------------------------------------------- boot --
  function start() {
    neutraliseServiceWorker();

    if (!isNative()) { loadGame(); return; }   // plain browser: pass straight through

    window.GOL_NATIVE = true;                  // a flag for later shell-only touches

    waitForPrefs(PLUGIN_WAIT_MS).then(function (prefs) {
      if (!prefs) {
        console.warn('[shell] Capacitor Preferences is unavailable — this launch saves to localStorage only.');
        return null;
      }
      return restore(prefs).then(function () { installMirror(prefs); });
    }).catch(function (err) {
      console.error('[shell] save bridge stumbled — the game still boots.', err);
    }).then(function () {
      loadGame();                              // the game ALWAYS boots
    });
  }

  start();
})();
