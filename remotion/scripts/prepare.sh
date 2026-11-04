#!/usr/bin/env bash
# Prépare public/ à partir de la vidéo source Trump et du MP3 voix off.
# Usage : scripts/prepare.sh SOURCE.mp4 VOIX.mp3
set -e
V="$1"; MP3="$2"; cd "$(dirname "$0")/.."
mkdir -p public/clips
ex(){ ffmpeg -v error -y -ss $2 -to $3 -i "$V" -an -vf "${4}scale=1080:1920:flags=lanczos,unsharp=5:5:0.6,setsar=1" -c:v libx264 -crf 16 -preset fast -pix_fmt yuv420p -g 1 public/clips/$1.mp4; }
ex trumpA 69.7 74.6 ""
ex trumpB 31.9 34.9 "delogo=x=398:y=172:w=118:h=48,"
ex capW 7.75 9.5 "delogo=x=18:y=104:w=170:h=56,"
ex voter 44.8 46.35 ""
ex wh 49.9 52.9 "delogo=x=8:y=98:w=310:h=56,"
ex capS 57.2 61.3 "delogo=x=20:y=100:w=250:h=60,"
cp "$MP3" public/voice.mp3
python3 scripts/sfx.py
