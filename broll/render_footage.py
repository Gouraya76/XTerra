#!/usr/bin/env python3
"""Montage d'une vidéo source + voix off : segments [debut, fin, vitesse] mis bout à bout,
son d'origine baissé sous la voix (coupé sur les ralentis). Sortie 1080x1920 30 i/s.
Usage : python3 render_footage.py montage.json sortie.mp4"""
import json, subprocess, sys, os
cfg = json.load(open(sys.argv[1])); out = sys.argv[2]
base = os.path.dirname(os.path.abspath(sys.argv[1]))
src = os.path.join(base, cfg['source']); voice = os.path.join(base, cfg['voice'])
vol = cfg.get('orig_volume', 0.12)
fv, fa = [], []
for i, (a, b, sp, *_ ) in enumerate(cfg['segments']):
    fv.append(f"[0:v]trim={a}:{b},setpts=(PTS-STARTPTS)/{sp},scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1[v{i}]")
    d = (b - a) / sp
    if sp == 1.0:
        fa.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,volume={vol},aformat=sample_rates=44100:channel_layouts=stereo[a{i}]")
    else:
        fa.append(f"anullsrc=r=44100:cl=stereo,atrim=0:{d:.3f}[a{i}]")
n = len(cfg['segments'])
fc = ';'.join(fv + fa) + ';' + ''.join(f'[v{i}][a{i}]' for i in range(n)) + f'concat=n={n}:v=1:a=1[v][oa];' \
     '[1:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=1.0[vo];[oa][vo]amix=inputs=2:duration=shortest:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=44100[a]'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-i', voice, '-filter_complex', fc, '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
    '-shortest', '-movflags', '+faststart', out], check=True)
print('OK', out)
