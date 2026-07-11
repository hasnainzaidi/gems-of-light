// Gems of Light — asr-worker.js
// Whisper listens away from the animation thread. Its model and runtime are
// local app assets, so a child's recitation stays on this device.
import { pipeline, env } from '../vendor/transformers.min.js';

env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = new URL('../models/', import.meta.url).href;
env.backends.onnx.wasm.wasmPaths = new URL('../vendor/ort/', import.meta.url).href;
env.backends.onnx.wasm.numThreads = 1;

let transcriberPromise = null;

function load(id) {
  if (!transcriberPromise) {
    transcriberPromise = pipeline('automatic-speech-recognition', 'whisper-tiny-ar-quran', {
      dtype: 'q4',
      progress_callback: (p) => {
        if (p.status === 'progress') {
          self.postMessage({ id, type: 'progress', file: p.file || '', loaded: p.loaded || 0, total: p.total || 0 });
        }
      }
    }).catch((err) => {
      transcriberPromise = null;
      throw err;
    });
  }
  return transcriberPromise;
}

async function transcribe(id, audio) {
  const transcriber = await load(id);
  const started = performance.now();
  let out = await transcriber(audio);
  let text = out && out.text ? out.text.trim() : '';
  if (!/[\u0600-\u06ff]/.test(text)) {
    out = await transcriber(audio, { language: 'arabic', task: 'transcribe' });
    text = out && out.text ? out.text.trim() : text;
  }
  self.postMessage({ id, type: 'result', text, ms: Math.round(performance.now() - started) });
}

self.onmessage = async (event) => {
  const msg = event.data || {};
  try {
    if (msg.type === 'load') {
      await load(msg.id);
      self.postMessage({ id: msg.id, type: 'ready' });
    } else if (msg.type === 'transcribe') {
      await transcribe(msg.id, msg.audio);
    }
  } catch (err) {
    self.postMessage({ id: msg.id, type: 'error', message: err && err.message ? err.message : String(err) });
  }
};
