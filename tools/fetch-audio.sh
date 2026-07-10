#!/bin/bash
# Downloads the World One verse recitations that aren't yet local
# (Mishary Rashid Alafasy, from everyayah.com) into ../audio.
# Run from anywhere:  bash tools/fetch-audio.sh
cd "$(dirname "$0")/../audio"
BASE="https://everyayah.com/data/Alafasy_128kbps"
for key in 001002 108001 108002 108003 112001 112002 112003 112004 \
           114001 114002 114003 114004 114005 114006; do
  if [ ! -f "$key.mp3" ]; then
    echo "fetching $key.mp3"
    curl -fsSL -o "$key.mp3" "$BASE/$key.mp3" || echo "  failed: $key"
  fi
done
echo "done. $(ls *.mp3 | wc -l | tr -d ' ') files present."
