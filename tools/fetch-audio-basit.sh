#!/bin/bash
# Downloads per-ayah verse recitations that aren't yet local
# (Abdul Basit, Murattal, from everyayah.com) into ../audio/basit.
# Run from anywhere:  bash tools/fetch-audio-basit.sh
cd "$(dirname "$0")/../audio/basit" || exit 1
RECITER_DIR="Abdul_Basit_Murattal_192kbps"
BASE="https://everyayah.com/data/$RECITER_DIR"

# surah:verse-count pairs — add more entries here as needed
SURAHS="113:5 114:6 100:11"

ok=0
fail=0

for entry in $SURAHS; do
  s="${entry%%:*}"; n="${entry##*:}"
  v=1
  while [ "$v" -le "$n" ]; do
    key="$(printf '%s%03d' "$s" "$v")"
    file="$key.mp3"
    if [ -f "$file" ] && [ "$(wc -c < "$file" | tr -d ' ')" -gt 20000 ]; then
      echo "skip (exists): $file"
    else
      curl -f --retry 3 -sS -o "$file" "$BASE/$file" || rm -f "$file"
    fi
    if [ -f "$file" ] && [ "$(wc -c < "$file" | tr -d ' ')" -gt 20000 ]; then
      echo "✓ $file"
      ok=$((ok + 1))
    else
      echo "✗ $file"
      fail=$((fail + 1))
    fi
    v=$((v + 1))
  done
done

echo "done. $ok ok, $fail failed."
