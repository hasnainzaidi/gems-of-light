#!/bin/bash
# Downloads the World One–Three verse recitations that aren't yet local
# (Mishary Rashid Alafasy, from everyayah.com) into ../audio.
# Run from anywhere:  bash tools/fetch-audio.sh
cd "$(dirname "$0")/../audio"
BASE="https://everyayah.com/data/Alafasy_128kbps"
# surah:verse-count for every garden across the three worlds
SURAHS="001:7 103:3 108:3 112:4 113:5 114:6 \
        107:7 106:4 105:5 104:9 102:8 101:11 \
        099:8 100:11 098:8 097:5 096:19"
for entry in $SURAHS; do
  s="${entry%%:*}"; n="${entry##*:}"
  v=1
  while [ "$v" -le "$n" ]; do
    key="$(printf '%s%03d' "$s" "$v")"
    if [ ! -f "$key.mp3" ]; then
      echo "fetching $key.mp3"
      curl -fsSL -o "$key.mp3" "$BASE/$key.mp3" || { echo "  failed: $key"; rm -f "$key.mp3"; }
    fi
    v=$((v + 1))
  done
done
echo "done. $(ls *.mp3 | wc -l | tr -d ' ') files present."
