"""Génère les répliques avec Fish Audio (modèle gratuit) + léger pitch cartoon."""
import json, sys, os, subprocess, urllib.request
ep = sys.argv[1]
ONLY = {int(x) for x in sys.argv[2].split(",")} if len(sys.argv) > 2 else None  # régénérer seulement ces répliques
d = json.load(open(f"{ep}/dialogues.json"))
os.makedirs(f"{ep}/voix", exist_ok=True)
def tts(text, ref, out):
    if os.path.exists(out): return
    req = urllib.request.Request("https://api.fish.audio/v1/tts", method="POST",
        data=json.dumps({"text": text, "reference_id": ref, "format": "wav"}).encode(),
        headers={"Authorization": "Bearer x", "Content-Type": "application/json", "model": "s2.1-pro-free"})
    open(out, "wb").write(urllib.request.urlopen(req, timeout=180).read())
def pitch(src, dst, semis):
    r = 2 ** (semis / 12)
    af = f"asetrate=44100*{r},aresample=44100,atempo={1/r}," if semis else ""
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af",
        af + "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-16:TP=-1.5",
        "-ar", "44100", "-ac", "1", dst], check=True)
from concurrent.futures import ThreadPoolExecutor
def _pre(il):
    i, l = il
    if ONLY is not None and i not in ONLY: return
    if ONLY is None and os.path.exists(f"{ep}/voix/{i:02d}.wav"): return
    for w in l["who"].split("+"):
        r = f"{ep}/voix/raw_{i:02d}_{w}.wav"
        if ONLY is not None and os.path.exists(r): os.remove(r)
        import time
        for k in range(8):
            try: tts(l["text"], d["voices"][w]["ref"], r); break
            except Exception as e: print("retry", i, e, flush=True); time.sleep(5 * (k + 1))
with ThreadPoolExecutor(4) as ex: list(ex.map(_pre, enumerate(d["lines"])))
for i, l in enumerate(d["lines"]):
    if ONLY is not None and i not in ONLY: continue
    elif ONLY is None and os.path.exists(f"{ep}/voix/{i:02d}.wav"): continue
    who = l["who"].split("+")
    parts = []
    for w in who:
        v = d["voices"][w]; raw = f"{ep}/voix/raw_{i:02d}_{w}.wav"; fin = f"{ep}/voix/{i:02d}_{w}.wav"
        tts(l["text"], v["ref"], raw); pitch(raw, fin, v["pitch"]); parts.append(fin)
    out = f"{ep}/voix/{i:02d}.wav"
    if len(parts) > 1:
        subprocess.run(["ffmpeg", "-v", "error", "-y", *sum([["-i", p] for p in parts], []), "-filter_complex",
            f"amix=inputs={len(parts)}:normalize=0", out], check=True)
    else:
        os.replace(parts[0], out)
    print(i, l["who"], subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], capture_output=True, text=True).stdout.strip())
