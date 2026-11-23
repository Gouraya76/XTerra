"""Régénère des répliques jusqu'à N fois et garde la prise la mieux articulée (Whisper)."""
import sys, json, subprocess, shutil, re, difflib, os, tempfile, numpy as np
from faster_whisper import WhisperModel
ep, idx, N = sys.argv[1], [int(x) for x in sys.argv[2].split(",")], int(sys.argv[3]) if len(sys.argv) > 3 else 4
L = json.load(open(f"{ep}/dialogues.json"))["lines"]
m = WhisperModel("small", device="cpu", compute_type="int8")
n = lambda s: re.sub(r"[^a-zàâçéèêëîïôûùüÿœ ]", "", s.lower())
def score(i):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", f"{ep}/voix/{i:02d}.wav", "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True).stdout
    a = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
    tr = " ".join(s.text for s in m.transcribe(a, language="fr")[0])
    return difflib.SequenceMatcher(None, n(L[i]["text"]), n(tr)).ratio(), tr
for i in idx:
    best = (-1, "")
    for k in range(N):
        subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), "voix.py"), ep, str(i)], capture_output=True)
        s, tr = score(i)
        if s > best[0]:
            best = (s, tr); shutil.copy(f"{ep}/voix/{i:02d}.wav", os.path.join(tempfile.gettempdir(), f"best_{i}.wav"))
        if s >= 0.92: break
    shutil.copy(os.path.join(tempfile.gettempdir(), f"best_{i}.wav"), f"{ep}/voix/{i:02d}.wav")
    print(i, round(best[0], 2), best[1], flush=True)
