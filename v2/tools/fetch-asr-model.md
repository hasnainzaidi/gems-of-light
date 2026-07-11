# Fetching the local Quran recitation model

The browser runtime is pinned to `@huggingface/transformers@3.8.1` and the
ONNX conversion is pinned to Hugging Face revision
`8e071f899dc821ef01e9a373b5b149a4624491f2` of
`omartariq612/tarteel-ai-whisper-tiny-ar-quran-onnx`. That conversion is of
Tarteel's Apache-2.0 `tarteel-ai/whisper-tiny-ar-quran` checkpoint.

```sh
npm install --save-dev @huggingface/transformers@3.8.1 ffmpeg-static@5.2.0
mkdir -p vendor/ort models/whisper-tiny-ar-quran/onnx
cp node_modules/@huggingface/transformers/dist/transformers.min.js vendor/
cp node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded{,.jsep}.{mjs,wasm} vendor/ort/

base=https://huggingface.co/omartariq612/tarteel-ai-whisper-tiny-ar-quran-onnx/resolve/8e071f899dc821ef01e9a373b5b149a4624491f2
for f in config.json generation_config.json preprocessor_config.json tokenizer.json tokenizer_config.json added_tokens.json merges.txt normalizer.json special_tokens_map.json vocab.json; do
  curl -L --fail -o "models/whisper-tiny-ar-quran/$f" "$base/$f"
done
for f in encoder_model_q4.onnx decoder_model_merged_q4.onnx; do
  curl -L --fail -o "models/whisper-tiny-ar-quran/onnx/$f" "$base/onnx/$f"
done
```

Artifact sizes at this pinned revision are about 9 MB for the q4 encoder,
87 MB for the merged q4 decoder, 3.8 MB for tokenizer/config files, 32 MB for
ONNX Runtime WASM, and 0.9 MB for Transformers.js. The source conversion is
larger than the early 40–60 MB estimate in the plan, but every individual file
fits normal GitHub hosting and is verified by `node tools/test-asr.mjs`.

The project-local `ffmpeg-static` development dependency decodes the five
checked-in Alafasy MP3 clips to 16 kHz mono float PCM for the ASR test.
