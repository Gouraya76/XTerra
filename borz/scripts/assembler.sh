#!/usr/bin/env bash
# Assemble les morceaux rendus + la bande son complète.
# Usage : scripts/assembler.sh ep02 6 "BORZ_EP02_100_jours.mp4"
set -e
EP=$1; N=$2; OUT=$3
cd "$(dirname "$0")/.."
LIST=$(mktemp)
for k in $(seq 0 $((N - 1))); do echo "file '$PWD/output/parts/${EP}_part$k.mp4'" >> "$LIST"; done
ffmpeg -v error -y -f concat -safe 0 -i "$LIST" -c copy output/parts/${EP}_video.mp4
ffmpeg -v error -y -i output/parts/${EP}_video.mp4 -i anim/public/${EP}/audio.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "output/$OUT"
ffprobe -v error -show_entries format=duration -of csv=p=0 "output/$OUT"
