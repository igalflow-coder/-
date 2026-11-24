// Node port of music.py (same score, for machines without Python/numpy).
// Original score for part 1: a tanpura-like drone on D (plucked Pa-Sa-Sa-low Sa cycle) plus singing-bowl strikes on
// the story beats, ducked under the voice. Reads a 48 kHz mono 16-bit voice WAV, writes mix.wav (48 kHz stereo, 60 s).
// Usage: node audio/music.mjs [voice.wav] [mix.wav]
import fs from "node:fs";

const [voicePath = "voice.wav", outPath = "mix.wav"] = process.argv.slice(2);
const SR = 48000, DUR = 60.0, N = Math.floor(SR * DUR);
const TAU = 2 * Math.PI;

function readWav(p) {
  const b = fs.readFileSync(p);
  let off = 12, fmt = null, data = null;
  while (off + 8 <= b.length) {
    const id = b.toString("ascii", off, off + 4), size = b.readUInt32LE(off + 4);
    if (id === "fmt ") fmt = { ch: b.readUInt16LE(off + 10), sr: b.readUInt32LE(off + 12), bits: b.readUInt16LE(off + 22) };
    if (id === "data") { data = b.subarray(off + 8, Math.min(b.length, off + 8 + size)); break; }
    off += 8 + size + (size & 1);
  }
  if (!fmt || !data || fmt.bits !== 16) throw new Error(`${p}: need a 16-bit PCM WAV`);
  if (fmt.sr !== SR) throw new Error(`${p}: need ${SR} Hz, got ${fmt.sr}`);
  const frames = Math.floor(data.length / (2 * fmt.ch)), x = new Float64Array(frames);
  for (let i = 0; i < frames; i++) {
    let s = 0;
    for (let c = 0; c < fmt.ch; c++) s += data.readInt16LE((i * fmt.ch + c) * 2) / 32768;
    x[i] = s / fmt.ch;
  }
  return x;
}

function addAt(dst, src, st) { const e = Math.min(dst.length, st + src.length); for (let i = st; i < e; i++) dst[i] += src[i - st]; }

function pluck(f0, dur, amp) {
  const n = Math.floor(SR * dur), s = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    let v = 0;
    for (let k = 1; k < 12; k++) // buzzy jawari: strong upper partials, slow beating
      v += 0.9 ** k * Math.sin(TAU * f0 * k * tt * (1 + 0.0007 * k)) * (1 + 0.3 * Math.sin(TAU * (0.7 + 0.13 * k) * tt));
    const env = (1 - Math.exp(-tt * 60)) * Math.exp(-tt / 2.6);
    s[i] = (amp * v * env) / 4;
  }
  return s;
}

function bowl(dur, amp) {
  const n = Math.floor(SR * dur), s = new Float64Array(n);
  const parts = [[220, 1, 6], [603, 0.6, 4], [1146, 0.35, 2.5], [1797, 0.2, 1.6]];
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    let v = 0;
    for (const [f, a, d] of parts) v += a * Math.sin(TAU * f * tt) * Math.exp(-tt / d);
    s[i] = amp * v * (1 - Math.exp(-tt * 200)) * (1 + 0.15 * Math.sin(TAU * 3.1 * tt));
  }
  return s;
}

function interp(x, xs, ys) {
  if (x <= xs[0]) return ys[0];
  for (let j = 1; j < xs.length; j++) if (x <= xs[j]) return ys[j - 1] + ((ys[j] - ys[j - 1]) * (x - xs[j - 1])) / (xs[j] - xs[j - 1]);
  return ys[ys.length - 1];
}

// np.convolve(x, ones(M)/M, mode="same")
function movingAvg(x, M) {
  const n = x.length, pre = new Float64Array(n + 1), y = new Float64Array(n), h = Math.floor((M - 1) / 2);
  for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + x[i];
  for (let i = 0; i < n; i++) {
    const hi = Math.min(n - 1, i + h), lo = Math.max(0, i + h - (M - 1));
    y[i] = hi >= lo ? (pre[hi + 1] - pre[lo]) / M : 0;
  }
  return y;
}

const mus = new Float64Array(N);
const SA = 146.83, PA = 220.0;
const cycle = [[PA, 0.0], [SA * 2, 0.9], [SA * 2, 1.8], [SA, 2.7]];
let c0 = 0.0;
while (c0 < DUR - 0.5) {
  for (const [f, off] of cycle) {
    const st = Math.floor(SR * (c0 + off));
    if (st >= N) continue;
    addAt(mus, pluck(f, 3.5, 1.0), st);
  }
  c0 += 3.6;
}
// fade the drone out under the lamp scene and back in for the sage
const gx = [0, 1.5, 19.5, 20.5, 22.5, 23.5, 58.5, 60], gy = [0, 1, 1, 0.35, 0.35, 1, 1, 0];
for (let i = 0; i < N; i++) mus[i] *= interp(i / SR, gx, gy);
for (const [at, a] of [[0.05, 0.9], [4.67, 0.8], [21.9, 1.0], [31.0, 0.8], [55.1, 1.0], [57.8, 1.2]]) addAt(mus, bowl(6, a), Math.floor(SR * at));

const vRaw = readWav(voicePath), voice = new Float64Array(N);
voice.set(vRaw.subarray(0, N));
// ducking: music sinks 7 dB while the voice speaks
const absV = voice.map(Math.abs);
const env = movingAvg(movingAvg(absV, Math.floor(SR * 0.05)), Math.floor(SR * 0.25));
let envMax = 0, musMax = 0;
for (let i = 0; i < N; i++) { envMax = Math.max(envMax, env[i]); musMax = Math.max(musMax, Math.abs(mus[i])); }
const mix = new Float64Array(N);
let mixMax = 0;
for (let i = 0; i < N; i++) {
  const duck = 1 - 0.55 * Math.min(1, Math.max(0, env[i] / (envMax * 0.25)));
  mix[i] = voice[i] * 0.95 + (mus[i] / (musMax + 1e-9)) * 0.22 * duck;
  mixMax = Math.max(mixMax, Math.abs(mix[i]));
}
const g = 1 / Math.max(1.0, mixMax / 0.97);
const out = Buffer.alloc(44 + N * 4);
out.write("RIFF", 0); out.writeUInt32LE(36 + N * 4, 4); out.write("WAVE", 8);
out.write("fmt ", 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34);
out.write("data", 36); out.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const s = Math.trunc(mix[i] * g * 32767);
  out.writeInt16LE(s, 44 + i * 4); out.writeInt16LE(s, 46 + i * 4);
}
fs.writeFileSync(outPath, out);
console.log("ok", N / SR);
