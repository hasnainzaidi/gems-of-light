// Generate the storyteller's voice with ElevenLabs — one mp3 per English
// line the game speaks (story pages + gentle instructions), cached in
// audio/voice/. Files that already exist are skipped, so re-runs only pay
// for what's new. The game never falls back to a synthetic voice: a missing
// file simply stays silent until this script has been run.
//
// Usage:
//   ELEVENLABS_API_KEY=sk-...  node tools/generate-narration.mjs [--names] [--only=slug] [--force] [--dry]
//
// Optional env:
//   ELEVEN_VOICE_ID   voice to use (default: Hope — a warm storyteller)
//   ELEVEN_MODEL_ID   default: eleven_multilingual_v2
//   ELEVEN_NAME_VOICE_ID  override the default Omar MSA voice
//   ELEVEN_NAME_MODEL_ID  default: eleven_multilingual_v2
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'audio', 'voice');

// pull the lines straight from the game's own files — one source of truth
global.window = global;
require(path.join(ROOT, 'js', 'data.js'));
require(path.join(ROOT, 'js', 'voice-lines.js'));
const GOL = global.GOL;
// ElevenLabs must never guess the vowels in a surah title. Keep these
// speech-only: shared arabicName remains the clean canonical display spelling,
// while every generated title gets an exact pausal pronunciation guide.
const SPOKEN_ARABIC_NAMES = {
  kawthar: 'الْكَوْثَر',
  kafirun: 'الْكَافِرُون',
  nasr: 'النَّصْر',
  masad: 'الْمَسَد',
  ikhlas: 'الْإِخْلَاص',
  asr: 'الْعَصْر',
  falaq: 'الْفَلَق',
  nas: 'النَّاس',
  fatiha: 'الْفَاتِحَة',
  maun: 'الْمَاعُون',
  quraysh: 'قُرَيْش',
  fil: 'الْفِيل',
  humazah: 'الْهُمَزَة',
  takathur: 'التَّكَاثُر',
  qariah: 'الْقَارِعَة',
  zalzalah: 'الزَّلْزَلَة',
  adiyat: 'الْعَادِيَات',
  bayyinah: 'الْبَيِّنَة',
  qadr: 'الْقَدْر',
  lail: 'اللَّيْل',
  duha: 'الضُّحَى',
  tin: 'التِّين',
  sharh: 'الشَّرْح',
  alaq: 'الْعَلَق',
  kursi: 'آيَةُ الْكُرْسِيّ'
};

// Ayat al-Kursi is an AYAH, not a surah — its welcome line must not carry
// the 'سُورَةُ' prefix. Slugs listed here speak their vocalized name alone.
const AYAH_SLUGS = new Set(['kursi']);

const missingSpokenNames = global.GOL_DATA.surahs
  .filter((s) => !SPOKEN_ARABIC_NAMES[s.slug])
  .map((s) => s.slug);
if (missingSpokenNames.length) {
  throw new Error('Missing vocalized Arabic surah names: ' + missingSpokenNames.join(', '));
}

const LINES = {};
for (const [id, text] of Object.entries(GOL.VOICE_LINES)) LINES[id] = text;
for (const s of global.GOL_DATA.surahs) {
  // A short, consistent welcome at the door of every v3 world. These ids are
  // also safe to generate ahead of recipes that have not been built yet. Feed
  // the model Arabic script, never English transliteration: the visible label
  // is for recognition, but it is not a pronunciation specification.
  // These phrases are unusually short, so preserve a small natural tail. It
  // keeps the final consonant from feeling chopped off when the clip ends.
  const spokenName = SPOKEN_ARABIC_NAMES[s.slug];
  LINES['surah-' + s.slug] = 'سُورَةُ ' + spokenName + '. <break time="0.45s" />';
  // an ayah passage (AYAH_SLUGS) speaks its name alone — no Surah prefix
  if (AYAH_SLUGS.has(s.slug)) LINES['surah-' + s.slug] = spokenName + '. <break time="0.45s" />';
  if (!s.story) continue;
  s.story.pages.forEach((text, i) => {
    LINES[GOL.storyVoiceId(s.slug, i)] = text;
  });
}

const FORCE = process.argv.includes('--force');
const DRY = process.argv.includes('--dry');
const NAMES_ONLY = process.argv.includes('--names');
const ONLY_ARG = process.argv.find((arg) => arg.startsWith('--only='));
const ONLY = ONLY_ARG
  ? new Set(ONLY_ARG.slice('--only='.length).split(',').map((slug) => 'surah-' + slug.trim()).filter((id) => id !== 'surah-'))
  : null;
// The key comes from the environment, or from a git-ignored .env at the
// repo root (KEY=value lines; no export needed) so Hasnain never has to
// paste it inline again.
function envFileKey() {
  try {
    const line = fs.readFileSync(path.join(ROOT, '.env'), 'utf8')
      .split('\n').find((l) => l.startsWith('ELEVENLABS_API_KEY='));
    return line ? line.slice('ELEVENLABS_API_KEY='.length).trim() : null;
  } catch (e) { return null; }
}
const KEY = process.env.ELEVENLABS_API_KEY || envFileKey();
// Omar: warm male Modern Standard Arabic with a light Saudi character. A
// caller can override this without changing the checked-in default, but every
// resulting clip still needs a native-speaker listening pass.
const NAME_VOICE = process.env.ELEVEN_NAME_VOICE_ID || 'xvhpbk8otnNHtT3fjCpr';
const VOICE = NAMES_ONLY ? NAME_VOICE
  : (process.env.ELEVEN_VOICE_ID || 'uYXf8XasLslADfZ2MB4u'); // "Hope", warm & calm
const MODEL = NAMES_ONLY
  ? (process.env.ELEVEN_NAME_MODEL_ID || 'eleven_multilingual_v2')
  : (process.env.ELEVEN_MODEL_ID || 'eleven_multilingual_v2');

// ElevenLabs sometimes appends seconds of digital silence after the explicit
// 0.45s break. The map waits for `ended` before opening the world door, so
// normalize that tail here instead of making a child wait for inaudible audio.
// Stream-copying keeps the spoken MP3 frames untouched; the cut lands inside
// silence and is allowed one MP3-frame of timing tolerance.
function trimSurahTail(file) {
  const probe = spawnSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=nw=1:nk=1', file
  ], { encoding: 'utf8' });
  const duration = Number(probe.stdout);
  if (probe.error || probe.status !== 0 || !Number.isFinite(duration)) {
    throw new Error('ffprobe could not validate ' + path.basename(file));
  }

  const scan = spawnSync('ffmpeg', [
    '-hide_banner', '-nostats', '-i', file,
    '-af', 'silencedetect=n=-60dB:d=0.12', '-f', 'null', '-'
  ], { encoding: 'utf8' });
  if (scan.error || scan.status !== 0) throw new Error('ffmpeg could not scan ' + path.basename(file));
  const starts = [...String(scan.stderr).matchAll(/silence_start:\s*([0-9.]+)/g)]
    .map((match) => Number(match[1]));
  const speechEnd = starts.at(-1);
  if (!Number.isFinite(speechEnd)) throw new Error('no quiet title tail found in ' + path.basename(file));

  const trailing = duration - speechEnd;
  if (trailing <= 0.75) return;
  const target = speechEnd + 0.45;
  const temp = file + '.trim.mp3';
  const trim = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', file,
    '-t', target.toFixed(3), '-c', 'copy', temp
  ], { encoding: 'utf8' });
  if (trim.error || trim.status !== 0) {
    try { fs.unlinkSync(temp); } catch (e) {}
    throw new Error('ffmpeg could not trim ' + path.basename(file));
  }
  fs.renameSync(temp, file);
  console.log('    trimmed ' + trailing.toFixed(2) + 's tail to the intended 0.45s');
}

// Names are deliberately a separate batch: the ordinary English narration
// command must never generate them accidentally with its English storyteller.
const ids = Object.keys(LINES)
  .filter((id) => NAMES_ONLY ? id.startsWith('surah-') : !id.startsWith('surah-'))
  .filter((id) => !ONLY || ONLY.has(id));
const todo = ids.filter((id) => FORCE || !fs.existsSync(path.join(OUT, id + '.mp3')));
console.log(ids.length + ' lines total · ' + (ids.length - todo.length) + ' already cached · ' + todo.length + ' to generate');
if (DRY || todo.length === 0) {
  for (const id of todo) console.log('  would generate ' + id + ': "' + LINES[id].slice(0, 60) + '…"');
  process.exit(0);
}
if (!KEY) {
  console.error('\nELEVENLABS_API_KEY is not set. Run:\n  ELEVENLABS_API_KEY=sk-... node tools/generate-narration.mjs');
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let made = 0, failed = 0;
for (const id of todo) {
  const text = LINES[id];
  const outputFile = path.join(OUT, id + '.mp3');
  const generatedFile = outputFile + '.generated.mp3';
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + VOICE + '?output_format=mp3_44100_128', {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        // The surah names are invitations, not announcements: slightly slower,
        // steadier, and less stylized than the English storyteller.
        voice_settings: NAMES_ONLY
          ? { stability: 0.68, similarity_boost: 0.78, style: 0.08, speed: 0.92, use_speaker_boost: true }
          : { stability: 0.55, similarity_boost: 0.75, style: 0.25, use_speaker_boost: true }
      })
    });
    if (!res.ok) throw new Error(res.status + ' ' + (await res.text()).slice(0, 140));
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(generatedFile, buf);
    if (id.startsWith('surah-')) trimSurahTail(generatedFile);
    fs.renameSync(generatedFile, outputFile);
    made++;
    console.log('  ✓ ' + id + ' (' + Math.round(fs.statSync(outputFile).size / 1024) + ' kB)');
    await sleep(350); // be a polite API citizen
  } catch (e) {
    try { fs.unlinkSync(generatedFile); } catch (cleanupError) {}
    failed++;
    console.error('  ✗ ' + id + ': ' + e.message);
  }
}
console.log('\ndone — ' + made + ' generated, ' + failed + ' failed, kept in audio/voice/');
process.exit(failed ? 1 : 0);
