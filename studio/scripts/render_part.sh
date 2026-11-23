#!/usr/bin/env bash
# Rend le morceau K (0..N-1) d'une composition, sans son (le son complet est ajouté par assembler.sh).
# Usage : scripts/render_part.sh K N [COMPOSITION=EP01] [TIMELINE=src/ep01.json] [PREFIXE=ep01]
set -e
K=$1; N=$2; COMP=${3:-EP01}; TL=${4:-src/ep01.json}; PFX=${5:-ep01}
cd "$(dirname "$0")/../anim"
[ -d node_modules ] || npm install --no-audit --no-fund
TOTAL=$(python3 -c "import json;d=json.load(open('$TL'));print(round(d['duration']*d['fps']))")
A=$(( TOTAL * K / N )); B=$(( TOTAL * (K + 1) / N - 1 ))
mkdir -p ../output/parts
BX=$(ls /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1)
npx remotion render src/index.ts $COMP ../output/parts/${PFX}_part$K.mp4 --gl=angle --muted --frames=$A-$B --concurrency=$(nproc) ${BX:+--browser-executable=$BX}
echo "PART $K OK ($A-$B)"
