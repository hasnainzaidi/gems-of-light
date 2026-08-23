# The iOS shell 🍎

This folder turns the game you already have into an iPhone app — without
changing the game at all. Nothing in here edits `v3/js`. It *copies* the game
into a folder called `www/`, wraps it in a small native app (Capacitor), and
hands that to Xcode.

That is the whole idea: **one game, three doors.** playgemsoflight.com,
the staging site on your phone, and the App Store all serve the same
`v3/js` files. When you build a new world, it flows into the app with no
work here beyond rebuilding.

The plan behind all of this — why we're shipping early, what App Review
needs — is `v3/IOS-APP-STORE-PLAN.md`. This file is just the doing.

---

## Before you start

Three things, once:

1. **Xcode** — installed on this Mac mini on 2026-08-23. It lives in the
   standard `/Applications/Xcode.app` location used by the sync command.
2. **Node** — you already have it (it's what runs the checker). Type
   `node -v` in Terminal; anything 18 or higher is fine.
3. **An Apple Developer account** ($99/yr, developer.apple.com). You can do
   steps 1–5 below *without* it — building onto your own iPhone only needs
   a free Apple ID. You need the paid account for TestFlight and the store.

All of this happens on the Mac mini. Nothing here works on the cloud
sessions — Xcode is Mac-only.

---

## 1. Build it (the native project is already generated)

Open Terminal and paste these one at a time, waiting for each to finish:

```bash
cd ~/gems-of-light/ios-shell     # wherever your copy of the repo lives
npm install                      # fetches the locked Capacitor versions
npm run sync                     # rebuilds www/ and copies it into ios/
npx cap open ios                 # opens Xcode
```

What just happened, in plain terms:

- `npm run build-www` ran `tools/build-www.mjs`. It copied `js/data.js`,
  `v3/js`, `v3/art`, `icons`, `assets`, `audio/alafasy` and `audio/voice`
  into `www/`, rewrote `index.html` so the app loads the save bridge first,
  and left out everything the app doesn't need (v1, v2, concept art, the
  service worker, all the notes). It prints what it did and how big the
  result is — around 20 MB.
- The real Xcode project is already committed in `ios/`. It was generated on
  2026-08-23; **do not run `npx cap add ios` again.** From now on it is always
  `npm run sync` (see step 7).

If a command complains, read the message — the builder is written to say
plainly what it couldn't find rather than quietly make a broken app.

---

## 2. Silent-switch audio (already configured)

`AppDelegate.swift` already configures `AVAudioSession` with the `.playback`
category. That tells iOS that recitation is core app content and should remain
audible when the iPhone's Ring/Silent switch is set to silent. There is nothing
to paste; verify the behavior in the real-device checklist below.

---

## 3. Signing (telling Xcode who you are)

In Xcode, click the blue **App** icon at the very top of the left sidebar,
then the **Signing & Capabilities** tab.

- Tick **Automatically manage signing**.
- Choose your name (or your developer account) in **Team**. If the dropdown
  is empty: Xcode → Settings → Accounts → **+** → sign in with your Apple
  ID, then come back.
- The **Bundle Identifier** should read `com.playgemsoflight.app`. Leave it.
  It is the app's permanent name to Apple — changing it later means a new
  app, so we set it now and never touch it.

Red text here is normal until a team is chosen; it should go quiet after.

---

## 4. Run it on your iPhone

1. Plug the iPhone into the Mac with a cable. Unlock it, tap **Trust**.
2. At the top of the Xcode window, next to the App name, there's a dropdown
   of devices. Pick your iPhone (not a simulator — the simulator's audio and
   touch aren't the real thing).
3. Press the ▶ **Play** button (or ⌘R).
4. The first time, the iPhone will refuse to open it: Settings → General →
   VPN & Device Management → your Apple ID → **Trust**. Then press ▶ again.

Now turn on **Airplane Mode** and play. Everything must work: worlds,
recitation, the shrine, the map. That's not just a nice check — App Review
Guideline 4.2 is exactly this question, and a wrapper that needs the
internet gets rejected.

---

## 5. The evicted-storage test (do not skip this one)

The one thing that would be unforgivable is a child losing their whole
journey. iOS is allowed to wipe a web view's `localStorage` whenever it
wants space. So the shell mirrors every save into native storage
(`native-bridge.js`), and restores it before the game boots.

That has to be *proven*, and the usual trick doesn't apply: Settings →
Safari → Clear History touches Safari, not our app. And deleting the app
deletes the native storage too, so that proves nothing either. Here is the
honest test.

**a. Play a little.** Finish a world, or at least collect some gems, so
there's a journey to lose. Then close the app fully (swipe it away).

**b. Temporarily add one destroying line.** Back in `AppDelegate.swift`,
add `import WebKit` at the top, and paste this just before `return true`:

```swift
        // TEMPORARY — wipes the web view's storage on every launch.
        WKWebsiteDataStore.default().removeData(
            ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(),
            modifiedSince: Date(timeIntervalSince1970: 0)
        ) { }
```

This is iOS's eviction, on demand.

**c. Run it again (▶).** The web view starts with nothing at all —
the same state as an evicted app.

**d. Look.** The journey should be exactly as you left it: same worlds
open, same moons, same reciter. The bridge read it back from native storage
before the game started. If it's gone, **stop** — do not submit; that is
launch blocker 1 in the plan, and it needs fixing first.

**e. Delete those lines** (and `import WebKit`), save, and run once more to
confirm normal play. The wipe line must never ship.

Worth repeating this test after any change to `native-bridge.js`.

---

## 6. TestFlight — the family phones

Once the paid developer account is active, this is how the app reaches
Hasnain's and the kids' phones without waiting on App Review:

1. In Xcode: **Product → Archive** (choose "Any iOS Device" in the device
   dropdown first — Archive is greyed out with a simulator selected).
2. When the Organizer window appears, **Distribute App → App Store Connect
   → Upload**.
3. Go to appstoreconnect.apple.com → your app → **TestFlight**. The build
   takes a few minutes to finish processing.
4. Add yourself and family under **Internal Testing** (up to 100 people on
   your team, no review needed). They install Apple's **TestFlight** app and
   get the build there.

Real playtests on real phones, long before the store sees anything.

---

## 7. Every update after that

The game changes constantly; the app should be a rebuild, not a project.

```bash
cd ~/gems-of-light
git pull                     # get the latest game (whatever branch you play)
cd ios-shell
npm run sync                 # = build-www + cap sync ios  (rebuilds www/)
npx cap open ios
```

Then in Xcode, before uploading: click the blue **App** icon → **General**
→ raise **Build** by one (1 → 2 → 3 …). Apple rejects a re-upload of the
same build number. Raise **Version** (1.0 → 1.1) when it's a release you'd
describe to a family; the Build number just has to keep climbing.

Then Product → Archive → Distribute, as in step 6.

You never re-run `npx cap add ios`, and you never edit anything inside
`www/` — it is rewritten from scratch every build.

---

## What's in this folder (and what git keeps)

| | |
|---|---|
| `tools/build-www.mjs` | assembles `www/` from the repo. Reads the real `index.html`, so new script tags flow through automatically. |
| `www-src/native-bridge.js` | the durable-save bridge + the script loader. **The launch blocker lives here** — change it carefully, then redo step 5. |
| `capacitor.config.json` | app id, name, background colour. |
| `package.json` | the Capacitor dependencies and build/check/sync commands. |
| `www/` | **generated.** Not in git — rebuilt by every `npm run build-www`. |
| `node_modules/` | **not in git.** `npm install` brings it back. |
| `ios/` | **committed to git** — the generated Xcode project and native configuration. |

That last row matters. The project — icons, launch art, and the audio-session
edit — is part of the repo like everything else and can be restored on any
Mac. Signing remains local to Xcode and your Apple account.

---

## Small things worth knowing

- **Mishary only.** The app bundles one reciter (`audio/alafasy`, ~19 MB).
  Abdul Basit is gone from the game everywhere, not just here.
- **The loose `audio/*.mp3` files aren't bundled** — they're byte-for-byte
  copies of files already inside `audio/alafasy/`, kept for the archived v1
  game. The builder re-checks that on every run and warns if it ever stops
  being true.
- **The install nudge** ("add me to your home screen") is suppressed inside
  the app. The shell sets `window.GOL_NATIVE = true` before the game loads,
  and native mode is treated as already installed.
- **Fonts.** `index.html` still links Google Fonts. With no network they
  simply fail and the system font stands in — the game plays fine. Bundling
  the two fonts locally is a nice later polish, not a blocker.
- **`?debug=1` and the tuning panel** work in the app exactly as on the web;
  there's no address bar, so you'd add the query to the config's start path
  if you ever need it there.
- **The service worker is web-only.** It's stripped from the app's
  `index.html`, and the bridge also blocks any registration attempt, so the
  app never tries to cache itself — it's already all on disk.
