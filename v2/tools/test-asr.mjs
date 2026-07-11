import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { pipeline, env } from '@huggingface/transformers';
import ffmpegPath from 'ffmpeg-static';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const require = createRequire(import.meta.url);
const scorer = require('../js/recite-score.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8'), context);
const falaq = context.window.GOL_DATA.surahs.find((s) => s.id === 113);
const targets = Array.from(falaq.verses, (v) => v.ar.split(/\s+/));

env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = path.join(ROOT, 'models') + path.sep;
env.backends.onnx.wasm.numThreads = 1;

function decodeMp3(file) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath || 'ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-']);
    const chunks = [];
    let stderr = '';
    ffmpeg.stdout.on('data', (chunk) => chunks.push(chunk));
    ffmpeg.stderr.on('data', (chunk) => { stderr += chunk; });
    ffmpeg.on('error', (err) => reject(new Error('ffmpeg is required for this test: ' + err.message)));
    ffmpeg.on('close', (code) => {
      if (code) return reject(new Error(stderr || `ffmpeg exited ${code}`));
      const buf = Buffer.concat(chunks);
      resolve(new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4)).slice());
    });
  });
}

console.log('loading local Quran Whisper model…');
const transcriber = await pipeline('automatic-speech-recognition', 'whisper-tiny-ar-quran', { dtype: 'q4' });
const matrix = [];
const latencies = [];

for (let verse = 1; verse <= 5; verse++) {
  const audio = await decodeMp3(path.join(ROOT, 'audio', `11300${verse}.mp3`));
  const started = performance.now();
  let output = await transcriber(audio);
  if (!/[\u0600-\u06ff]/.test(output.text || '')) {
    output = await transcriber(audio, { language: 'arabic', task: 'transcribe' });
  }
  latencies.push(Math.round(performance.now() - started));
  const row = targets.map((target) => scorer.score(output.text || '', target).score);
  matrix.push(row);
  const argmax = row.indexOf(Math.max(...row)) + 1;
  console.log(`ayah ${verse}: ${JSON.stringify(output.text)} (${latencies.at(-1)} ms)`);
  assert.equal(argmax, verse, `ayah ${verse} should match itself most closely`);
  assert.ok(row[verse - 1] >= 0.6, `ayah ${verse} score ${row[verse - 1]} is below 0.6`);
}

console.log('\nscore matrix (heard ayah × target ayah)');
console.table(matrix.map((row, i) => Object.fromEntries(row.map((v, j) => [`v${j + 1}`, v.toFixed(2)]))));
console.log('latency ms:', latencies.join(', '));
console.log('asr: 5/5 clips identified');
