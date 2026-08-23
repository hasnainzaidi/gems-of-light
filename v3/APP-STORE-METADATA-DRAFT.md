# Gems of Light — App Store Connect Draft

Status: prepared locally; enter only after the signed candidate and public URLs
match these claims. The App Store Connect account was not authenticated during
this pass.

## App record

| Field | Draft |
|---|---|
| Platforms | iOS |
| Name | Gems of Light |
| Primary language | English (U.S.) |
| Bundle ID | `com.playgemsoflight.app` |
| SKU | `gems-of-light-ios-001` |
| User access | Full Access |
| Developer name | Confirm deliberately when the first app record is created; Apple may make this permanent |
| Price | Free (working launch decision; confirm before submission) |
| Primary category | Games |
| Games subcategory | Family |
| Secondary category | Education |
| Made for Kids | Yes — 6–8 |
| Copyright | 2026 Ashna Holdings, LLC |
| License agreement | No custom EULA; use Apple's Standard EULA unless counsel/product deliberately chooses otherwise |

## Product-page copy

**Subtitle** (30-character limit)

> A Quran memorization journey

**Promotional text**

> Explore gentle gardens, hear each ayah in order, and return to remember—an offline-first Quran memorization adventure for families.

**Description**

> Gems of Light turns Quran memorization into a gentle journey through painted gardens.
>
> Children explore each world at their own pace, discover glowing ayah gems in order, listen to Mishary Alafasy’s recitation, rest for the complete surah, and rebuild the sequence in a calm one-socket remembering shrine. There are no scores, punishments, ads, accounts, or social features.
>
> A grown-up begins with a short playable preview, chooses a comfortable starting place, and hands the garden to the child. The grown-ups area keeps practice access, local progress, company information, and privacy details behind a patient hold.
>
> The complete game and recitation library are bundled for offline play. Learning progress and settings stay on the device.
>
> Features:
> • 20 hand-painted surah worlds
> • Ordered listening through exploration
> • Full-surah campfire rests
> • Gentle sequence recall with help and no penalties
> • Remembering visits for completed surahs
> • Parent-guided first setup and practice access
> • Offline play with no account, ads, analytics, or tracking

**Keywords** (100-byte limit; verify in App Store Connect)

> quran,memorization,surah,islam,muslim,arabic,recitation,learning,family,children

## URLs

| Field | URL |
|---|---|
| Marketing | `https://playgemsoflight.com/` |
| Support | `https://playgemsoflight.com/company/` |
| Privacy policy | `https://playgemsoflight.com/privacy/` |
| Privacy choices | Leave blank while no account or remotely held user data exists |

Before entry, verify production—not only staging—serves the current policy. The
policy must cover both the website/PWA and native iOS app, including local
browser storage and native-backed on-device save restoration.

## App privacy draft

- “No, we do not collect data from this app.”
- No tracking.
- No accounts, analytics, ads, forms, location, camera, microphone, contacts,
  or remote learning telemetry.

This answer is valid only if the final native binary makes no unsolicited
third-party requests. The shell gate therefore strips web font loads and
disables web-only remote audio fallback; re-audit the final archive before
publishing the privacy answer.

## Age-rating draft

Answer the live Apple questionnaire from the candidate build. Expected content
profile: no violence, fear, sexual content, profanity, drugs, gambling,
contests, loot boxes, unrestricted web access, user-generated content, chat,
ads, purchases, or location sharing. Select **Made for Kids — 6–8** only after
confirming all external links and grown-up controls remain behind the parental
gate. This choice cannot be removed after approval without continuing to meet
Kids Category requirements.

## Export-compliance draft

The app implements no proprietary cryptography. If the final dependency audit
confirms that it uses only operating-system-standard/exempt encryption, set
`ITSAppUsesNonExemptEncryption` to `NO` in the app `Info.plist` and answer the
App Store Connect flow consistently. Do not treat this draft as legal/export
advice; use Apple's live questionnaire for the uploaded binary.

## Content-rights gate

Do **not** mark the Content Rights answer complete or submit this metadata until
the release evidence file covers the exact binary. The current repository does
not contain a license granting Ashna Holdings commercial, worldwide, offline
redistribution of the bundled Mishary Alafasy recordings. The nine Ayat
al-Kursi phrase cuts and the trimmed `095008.mp3` additionally need permission
to edit, excerpt, split, and distribute derivatives.

Before submission:

- obtain a signed grant from the actual recording rights holder covering the
  App Store bundle, playback, territories, term, attribution, Apple/end-user
  distribution, and the edits; or replace the recordings with an expressly
  compatible corpus;
- establish written commercial/offline permission for the bundled Quran text,
  or re-source it from an explicitly licensed canonical corpus and verify every
  code point; remove unneeded transliteration/meaning/story fields from native;
- retain ElevenLabs generation history, paid-plan invoices and applicable
  voice/model terms for all title clips, or regenerate them under documented
  commercial terms; and
- keep a versioned asset/license manifest with source URLs, notices, original
  and shipped hashes, and the audio edit/cut record.

This is a release-evidence requirement, not a legal opinion; the rights holders
or counsel should confirm that the documents cover the shipped use.

## App Review notes

> Gems of Light is a fully bundled, offline-capable children’s game. It requires no account, demo credentials, subscription, purchase, network service, or special hardware.
>
> On first launch, a grown-up sees a short setup porch and playable preview. Continue through the handoff, rotate the phone to landscape, select the first glowing star on the journey map, and enter the first garden. Collect the glowing gems in order; each plays one ayah. After the last gem, the full surah plays at the campfire, followed by a one-socket-at-a-time remembering shrine and Grand Gem.
>
> The grown-ups area is behind a parental gate: on the title or journey map, press and hold the small star until its ring completes. It contains local progress/practice controls and first-party Company, Privacy, and Contact links. The child-facing game has no external links.
>
> Recitation audio is essential app content and uses the iOS playback audio category, so it remains audible with the Ring/Silent switch enabled. All game and recitation assets are included in the binary for airplane-mode play.
>
> The app collects no data and includes no ads, analytics, tracking, accounts, or third-party SDKs that receive child data. Progress and settings remain on the device.

## TestFlight information

**Beta description**

> A gentle offline Quran memorization adventure. This beta focuses on first-family setup, ordered recitation, the campfire and shrine loop, durable progress, and iPhone audio behavior.

**What to test**

> Please test on a physical iPhone in landscape. Complete one world in Airplane Mode; check the Ring/Silent switch; background and resume during a gem, campfire gap, and shrine; try a call/Siri and Bluetooth route change; force quit and relaunch; then verify progress survives the storage-eviction test in the release checklist. Report any skipped, repeated, clipped, overlapping, or silent recitation and the exact scene/ayah.

## Screenshot plan

Capture the exact candidate build in landscape at an accepted 6.9-inch size,
with no debug UI or real family progress. Minimum story:

1. Painted journey map and Lightling.
2. Ordered-gem exploration in a distinctive garden.
3. Ayah listening/read-along moment.
4. Full-surah campfire.
5. One-socket remembering shrine.
6. Grand Gem/map restoration payoff.

Use one to ten screenshots, PNG/JPEG without alpha. Do not add promises or
features absent from the binary.

## Account-only fields still needed

- Apple Developer Program/account-holder membership status and current agreements.
- Registered bundle identifier and signing team.
- Developer display name decision if this is the account's first app.
- App Review contact name, company email, and international-format phone number.
- Availability territories and any local content-rights requirements.
- Final content-rights evidence for recitation, Quran text, and narration.
- Final price confirmation.
- Candidate archive/build number and export-compliance result.
