#!/usr/bin/env bash
# Rend le morceau K (0..N-1) de la composition EP02, sans son (le son complet est ajouté à l'assemblage).
# Usage : scripts/render_part.sh K N
set -e
K=$1; N=$2
cd "$(dirname "$0")/../anim"
[ -d node_modules ] || npm install --no-audit --no-fund
TOTAL=$(python3 -c "import json;d=json.load(open('src/ep02.json'));print(round(d['duration']*d['fps']))")
A=$(( TOTAL * K / N )); B=$(( TOTAL * (K + 1) / N - 1 ))
mkdir -p ../output/parts
B_EXE=$(ls /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1)
npx remotion render src/index.ts EP02 ../output/parts/ep02_part$K.mp4 --gl=angle --muted --frames=$A-$B --concurrency=$(nproc) ${B_EXE:+--browser-executable=$B_EXE}
echo "PART $K OK ($A-$B)"
