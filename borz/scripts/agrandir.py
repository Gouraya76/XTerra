"""Agrandissement x4 Real-ESRGAN (ONNX, tuiles 64 px avec chevauchement et fondu)."""
import sys, numpy as np, onnxruntime as ort
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
model = sys.argv[3] if len(sys.argv) > 3 else "/root/models/esr.onnx"
sess = ort.InferenceSession(model, providers=["CPUExecutionProvider"])
inp = sess.get_inputs()[0].name
T, O = 64, 12                       # tuile, chevauchement
img = np.asarray(Image.open(src).convert("RGB")).astype(np.float32) / 255
H, W, _ = img.shape
pad = np.pad(img, ((O, O + T), (O, O + T), (0, 0)), mode="reflect")
out = np.zeros(((H + 2 * O + T) * 4, (W + 2 * O + T) * 4, 3), np.float32)
wsum = np.zeros(out.shape[:2] + (1,), np.float32)
r = np.ones(T * 4, np.float32); ramp = np.linspace(0, 1, O * 4); r[:O * 4] = ramp; r[-O * 4:] = ramp[::-1]
wt = np.maximum(np.outer(r, r), 1e-3)[..., None]
step = T - O
ys = list(range(0, H + O, step)); xs = list(range(0, W + O, step))
n = 0
for y in ys:
    for x in xs:
        tile = pad[y:y + T, x:x + T].transpose(2, 0, 1)[None]
        res = sess.run(None, {inp: tile})[0][0].transpose(1, 2, 0).clip(0, 1)
        out[y * 4:(y + T) * 4, x * 4:(x + T) * 4] += res * wt
        wsum[y * 4:(y + T) * 4, x * 4:(x + T) * 4] += wt
        n += 1
    print(f"{y}/{H}", flush=True) if y % 240 == 0 else None
out = out / np.maximum(wsum, 1e-6)
out = out[O * 4:(O + H) * 4, O * 4:(O + W) * 4]
Image.fromarray((out * 255 + 0.5).clip(0, 255).astype(np.uint8)).save(dst)
print("ok", n, "tuiles", out.shape)
