// Generate the storyteller's voice with ElevenLabs — one mp3 per English
// line the game speaks (story pages + gentle instructions), cached in
// audio/voice/. Files that already exist are skipped, so re-runs only pay
// for what's new. The game never falls back to a synthetic voice: a missing
// file simply stays silent until this script has been run.
//
// Usage:
//   ELEVENLABS_API_KEY=sk-...  node tools/generate-narration.mjs [--force] [--dry]
//
// Optional env:
//   ELEVEN_VOICE_ID   voice to use (default: Hope — a warm storyteller)
//   ELEVEN_MODEL_ID   default: eleven_multilingual_v2 (handles the Arabic
//                     names inside English sentences gracefully)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'audio', 'voice');

// pull the lines straight from the game's own files — one source of truth
global.window = global;
require(path.join(ROOT, 'js', 'data.js'));
require(path.join(ROOT, 'js', 'voice-lines.js'));
const GOL = global.GOL;

const LINES = {};
for (const [id, text] of Object.entries(GOL.VOICE_LINES)) LINES[id] = text;
for (const s of global.GOL_DATA.surahs) {
  if (!s.story) continue;
  s.story.pages.forEach((text, i) => {
    LINES[GOL.storyVoiceId(s.slug, i)] = text;
  });
}

const FORCE = process.argv.includes('--force');
const DRY = process.argv.includes('--dry');
const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = process.env.ELEVEN_VOICE_ID || 'uYXf8XasLslADfZ2MB4u'; // "Hope", warm & calm
const MODEL = process.env.ELEVEN_MODEL_ID || 'eleven_multilingual_v2';

const ids = Object.keys(LINES);
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
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + VOICE + '?output_format=mp3_44100_128', {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        // calm, even, storybook delivery
        voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.25, use_speaker_boost: true }
      })
    });
    if (!res.ok) throw new Error(res.status + ' ' + (await res.text()).slice(0, 140));
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(OUT, id + '.mp3'), buf);
    made++;
    console.log('  ✓ ' + id + ' (' + Math.round(buf.length / 1024) + ' kB)');
    await sleep(350); // be a polite API citizen
  } catch (e) {
    failed++;
    console.error('  ✗ ' + id + ': ' + e.message);
  }
}
console.log('\ndone — ' + made + ' generated, ' + failed + ' failed, kept in audio/voice/');
process.exit(failed ? 1 : 0);
