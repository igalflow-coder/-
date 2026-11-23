# Original score for part 1: a tanpura-like drone on D (plucked Pa-Sa-Sa-low Sa cycle) plus singing-bowl strikes on
# the story beats, ducked under the voice. Writes mix.wav (48 kHz stereo, 60 s).
import numpy as np, wave
SR = 48000; DUR = 60.0; N = int(SR * DUR)
t = np.arange(N) / SR

def read_wav(p):
    with wave.open(p) as w:
        sr, ch, n = w.getframerate(), w.getnchannels(), w.getnframes()
        x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768
    if ch > 1: x = x.reshape(-1, ch).mean(1)
    if sr != SR: x = np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x)
    return x

def pluck(f0, dur, amp):
    n = int(SR * dur); tt = np.arange(n) / SR
    s = np.zeros(n)
    for k in range(1, 12):  # buzzy jawari: strong upper partials, slow beating
        s += (0.9 ** k) * np.sin(2 * np.pi * f0 * k * tt * (1 + 0.0007 * k)) * (1 + 0.3 * np.sin(2 * np.pi * (0.7 + 0.13 * k) * tt))
    env = (1 - np.exp(-tt * 60)) * np.exp(-tt / 2.6)
    return amp * s * env / 4

def bowl(dur, amp):
    n = int(SR * dur); tt = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / d) for f, a, d in [(220, 1, 6), (603, 0.6, 4), (1146, 0.35, 2.5), (1797, 0.2, 1.6)])
    return amp * s * (1 - np.exp(-tt * 200)) * (1 + 0.15 * np.sin(2 * np.pi * 3.1 * tt))

mus = np.zeros(N)
SA, PA = 146.83, 220.0
cycle = [(PA, 0.0), (SA * 2, 0.9), (SA * 2, 1.8), (SA, 2.7)]
c0 = 0.0
while c0 < DUR - 0.5:
    for f, off in cycle:
        st = int(SR * (c0 + off))
        if st >= N: continue
        p = pluck(f, 3.5, 1.0)
        e = min(N, st + len(p)); mus[st:e] += p[: e - st]
    c0 += 3.6
# fade the drone out under the lamp scene and back in for the sage
gain = np.interp(t, [0, 1.5, 19.5, 20.5, 22.5, 23.5, 58.5, 60], [0, 1, 1, 0.35, 0.35, 1, 1, 0])
mus *= gain
for at, a in [(0.05, 0.9), (4.67, 0.8), (21.9, 1.0), (31.0, 0.8), (55.1, 1.0), (57.8, 1.2)]:
    st = int(SR * at); b = bowl(6, a); e = min(N, st + len(b)); mus[st:e] += b[: e - st]

voice = read_wav("voice.wav")
voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
# ducking: music sinks 7 dB while the voice speaks
env = np.convolve(np.abs(voice), np.ones(int(SR * 0.05)) / (SR * 0.05), mode="same")
env = np.convolve(env, np.ones(int(SR * 0.25)) / (SR * 0.25), mode="same")
duck = 1 - 0.55 * np.clip(env / (env.max() * 0.25), 0, 1)
mus = mus / (np.abs(mus).max() + 1e-9) * 0.22 * duck
mix = voice * 0.95 + mus
mix = mix / max(1.0, np.abs(mix).max() / 0.97)
stereo = np.stack([mix, mix], 1)
with wave.open("mix.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((stereo * 32767).astype(np.int16).tobytes())
print("ok", len(mix) / SR)
