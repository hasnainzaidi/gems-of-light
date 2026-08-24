// Launch gate for the short Arabic title clips that open each map door.
// The map waits for the media element's `ended` event, so surplus digital
// silence is an interaction stall, not harmless file padding.
//
// Requires ffmpeg/ffprobe, the same media tools used by the audio pipeline.
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const V3 = join(dirname(fileURLToPath(import.meta.url)), '..');
const VOICE = join(V3, '..', 'audio', 'voice');
const MAX_TRAILING_SILENCE = 0.75; // intended 0.45s tail + 0.30s tolerance
const MIN_SILENCE = 0.12;

// Speech-end envelopes measured from the reviewed 2026-08-23 clips, with the
// same 0.75s maximum tail. They let the ordinary dependency-free CI runner
// catch regenerated stalls; when ffmpeg is installed we additionally decode
// and measure the actual digital-silence boundary below.
const MAX_DURATION = {
  'surah-adiyat.mp3': 2.548, 'surah-alaq.mp3': 1.987,
  'surah-asr.mp3': 2.050, 'surah-bayyinah.mp3': 2.024,
  'surah-duha.mp3': 1.961, 'surah-falaq.mp3': 2.072,
  'surah-fatiha.mp3': 2.101, 'surah-fil.mp3': 1.966,
  'surah-humazah.mp3': 2.344, 'surah-ikhlas.mp3': 2.287,
  'surah-kafirun.mp3': 2.366, 'surah-kawthar.mp3': 2.104,
  'surah-kursi.mp3': 2.088, 'surah-lail.mp3': 1.972,
  'surah-masad.mp3': 2.122, 'surah-maun.mp3': 2.240,
  'surah-nas.mp3': 2.001, 'surah-nasr.mp3': 1.961,
  'surah-qadr.mp3': 2.071, 'surah-qariah.mp3': 2.141,
  'surah-quraysh.mp3': 2.075, 'surah-sharh.mp3': 1.943,
  'surah-takathur.mp3': 2.248, 'surah-tin.mp3': 2.145,
  'surah-zalzalah.mp3': 2.222
};

function mp3Duration(file) {
  const data = readFileSync(file);
  let offset = 0;
  if (data.length >= 10 && data.toString('ascii', 0, 3) === 'ID3') {
    const size = ((data[6] & 0x7f) << 21) | ((data[7] & 0x7f) << 14) |
      ((data[8] & 0x7f) << 7) | (data[9] & 0x7f);
    offset = 10 + size;
  }
  const mpeg1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
  const mpeg2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
  const rates = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };
  let duration = 0, frames = 0;
  while (offset + 4 <= data.length) {
    const header = data.readUInt32BE(offset);
    const version = (header >>> 19) & 3;
    const layer = (header >>> 17) & 3;
    const bitrateIndex = (header >>> 12) & 15;
    const rateIndex = (header >>> 10) & 3;
    if ((header >>> 21) !== 0x7ff || version === 1 || layer !== 1 ||
        bitrateIndex === 0 || bitrateIndex === 15 || rateIndex === 3) {
      offset++;
      continue;
    }
    const bitrate = (version === 3 ? mpeg1 : mpeg2)[bitrateIndex] * 1000;
    const sampleRate = rates[version][rateIndex];
    const padding = (header >>> 9) & 1;
    const frameLength = Math.floor((version === 3 ? 144 : 72) * bitrate / sampleRate) + padding;
    if (frameLength < 24 || offset + frameLength > data.length) break;
    duration += (version === 3 ? 1152 : 576) / sampleRate;
    frames++;
    offset += frameLength;
  }
  if (frames < 2) throw new Error(`could not parse MP3 frames in ${file}`);
  return duration;
}

const files = readdirSync(VOICE).filter((name) => /^surah-[a-z]+\.mp3$/.test(name)).sort();
if (files.length !== 25) throw new Error(`expected 25 surah title clips, found ${files.length}`);
if (Object.keys(MAX_DURATION).sort().join('\n') !== files.join('\n')) {
  throw new Error('title duration envelopes do not match the 25 shipped clips');
}

const ffmpegAvailable = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;

const failures = [];
for (const name of files) {
  const file = join(VOICE, name);
  const duration = mp3Duration(file);
  if (!Number.isFinite(duration) || duration <= 0) {
    failures.push(`${name}: invalid duration`);
    continue;
  }
  if (duration > MAX_DURATION[name] + 0.03) {
    failures.push(`${name}: ${duration.toFixed(3)}s exceeds reviewed ${MAX_DURATION[name].toFixed(3)}s envelope`);
  }
  if (!ffmpegAvailable) continue;

  const scan = spawnSync('ffmpeg', [
    '-hide_banner', '-nostats', '-i', file,
    '-af', `silencedetect=n=-60dB:d=${MIN_SILENCE}`,
    '-f', 'null', '-'
  ], { encoding: 'utf8', stdio: ['ignore', 'ignore', 'pipe'] });
  const stderr = String(scan.stderr || '');
  if (scan.error || scan.status !== 0 || !stderr.includes('silence_start')) {
    failures.push(`${name}: could not decode or find the intended quiet tail`);
  }
  const starts = [...stderr.matchAll(/silence_start:\s*([0-9.]+)/g)].map((match) => Number(match[1]));
  const tailStart = starts.at(-1);
  const trailing = Number.isFinite(tailStart) ? duration - tailStart : Infinity;
  if (trailing > MAX_TRAILING_SILENCE + 0.01) {
    failures.push(`${name}: ${trailing.toFixed(3)}s trailing silence (max ${MAX_TRAILING_SILENCE.toFixed(2)}s)`);
  }
}

if (failures.length) {
  console.error('Surah-title audio launch gate failed:');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(`✓ ${files.length} surah-title clips parse within reviewed duration envelopes` +
  (ffmpegAvailable ? ` and end within ${MAX_TRAILING_SILENCE.toFixed(2)}s of speech` : ' (ffmpeg silence scan unavailable)'));
