// Launch gate for the short Arabic title clips that open each map door.
// The map waits for the media element's `ended` event, so surplus digital
// silence is an interaction stall, not harmless file padding.
//
// Requires ffmpeg/ffprobe, the same media tools used by the audio pipeline.
import { execFileSync, spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const V3 = join(dirname(fileURLToPath(import.meta.url)), '..');
const VOICE = join(V3, '..', 'audio', 'voice');
const MAX_TRAILING_SILENCE = 0.75; // intended 0.45s tail + 0.30s tolerance
const MIN_SILENCE = 0.12;

function output(command, args) {
  try {
    return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    const detail = String(error.stderr || error.message || error).trim();
    throw new Error(`${command} failed${detail ? `: ${detail}` : ''}`);
  }
}

const files = readdirSync(VOICE).filter((name) => /^surah-[a-z]+\.mp3$/.test(name)).sort();
if (files.length !== 25) throw new Error(`expected 25 surah title clips, found ${files.length}`);

const failures = [];
for (const name of files) {
  const file = join(VOICE, name);
  const duration = Number(output('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=nw=1:nk=1', file
  ]).trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    failures.push(`${name}: invalid duration`);
    continue;
  }

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

console.log(`✓ ${files.length} surah-title clips decode and end within ${MAX_TRAILING_SILENCE.toFixed(2)}s of speech`);
