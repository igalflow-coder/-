// Original score and sound design for Elian letter 2, "The Keyboard in the Museum" (48 s), all synthesised here.
// 2140: a night-blue pad and a gold music-box motif. The 2020s: a projector bed, a muted wobbly pulse, foley (cursor,
// keys, notification pings, chalk). Two silences: the empty chat box (12.8-17.0, cursor only) and 36.9-37.85 before
// the glass bell. The mirror's chimes ring over the cut into the last shot (L-cut); the projector comes in early (J-cut).
// Usage: node audio/elian_music.mjs [voice.wav|-] [mix.wav]   (voice: 48 kHz mono 16-bit; "-" = no voice, no ducking)
import fs from "node:fs";

const [voicePath = "-", outPath = "audio/letter2_mix.wav"] = process.argv.slice(2);
const SR = 48000, DUR = 48.0, TAU = 2 * Math.PI;
let N = Math.floor(SR * DUR);
let L = new Float64Array(N), R = new Float64Array(N);
let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

function readWav(p) {
  const b = fs.readFileSync(p);
  let off = 12, fmt = null, data = null;
  while (off + 8 <= b.length) {
    const id = b.toString("ascii", off, off + 4), size = b.readUInt32LE(off + 4);
    if (id === "fmt ") fmt = { ch: b.readUInt16LE(off + 10), sr: b.readUInt32LE(off + 12), bits: b.readUInt16LE(off + 22) };
    if (id === "data") { data = b.subarray(off + 8, Math.min(b.length, off + 8 + size)); break; }
    off += 8 + size + (size & 1);
  }
  if (!fmt || !data || fmt.bits !== 16 || fmt.sr !== SR) throw new Error(`${p}: need 48 kHz 16-bit PCM`);
  const frames = Math.floor(data.length / (2 * fmt.ch)), x = new Float64Array(frames);
  for (let i = 0; i < frames; i++) { let s = 0; for (let c = 0; c < fmt.ch; c++) s += data.readInt16LE((i * fmt.ch + c) * 2) / 32768; x[i] = s / fmt.ch; }
  return x;
}
/** add a mono buffer at time t (s) with gain and pan (-1..1) */
const put = (buf, t, gain = 1, pan = 0) => {
  const st = Math.floor(t * SR), gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < buf.length; i++) { const k = st + i; if (k < 0 || k >= N) continue; L[k] += buf[i] * gl; R[k] += buf[i] * gr; }
};
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const lowpass = (x, fc) => { const a = 1 - Math.exp(-TAU * fc / SR); let y = 0; for (let i = 0; i < x.length; i++) { y += a * (x[i] - y); x[i] = y; } return x; };
const highpass = (x, fc) => { const a = 1 - Math.exp(-TAU * fc / SR); let y = 0; for (let i = 0; i < x.length; i++) { y += a * (x[i] - y); x[i] -= y; } return x; };
const noise = (dur) => { const n = Math.floor(dur * SR), x = new Float64Array(n); for (let i = 0; i < n; i++) x[i] = rnd() * 2 - 1; return x; };
const env = (x, a, d) => { for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] *= (1 - Math.exp(-t / Math.max(1e-4, a))) * Math.exp(-t / d); } return x; };

// ---------------------------------------------------------------- instruments
/** music box / celesta: bell partials, quick attack, ringing decay */
const musicBox = (m, dur = 2.5, amp = 0.2) => {
  const f = mtof(m), n = Math.floor(dur * SR), x = new Float64Array(n);
  const parts = [[1, 1, 1.6], [2.0, 0.25, 0.7], [3.01, 0.18, 0.4], [5.43, 0.08, 0.18]];
  for (let i = 0; i < n; i++) { const t = i / SR; let v = 0; for (const [k, a, d] of parts) v += a * Math.sin(TAU * f * k * t) * Math.exp(-t / d); x[i] = amp * v * (1 - Math.exp(-t * 900)); }
  return x;
};
/** soft pad chord: detuned sines with slow swell */
const pad = (notes, dur, amp = 0.05, att = 1.2, rel = 1.5) => {
  const n = Math.floor(dur * SR), x = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR; let v = 0;
    for (const m of notes) { const f = mtof(m); v += Math.sin(TAU * f * t) + 0.6 * Math.sin(TAU * f * 1.003 * t + 1) + 0.25 * Math.sin(TAU * f * 2.001 * t); }
    const e = Math.min(1, t / att) * Math.min(1, (dur - t) / rel) * (1 + 0.08 * Math.sin(TAU * 0.2 * t));
    x[i] = amp * v * e / notes.length;
  }
  return x;
};
/** muted, slightly wobbly pluck (an old record), for the 2020s pulse */
const oldPluck = (m, dur = 0.6, amp = 0.12) => {
  const f = mtof(m), n = Math.floor(dur * SR), x = new Float64Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR, w = 1 + 0.004 * Math.sin(TAU * 0.7 * t); x[i] = amp * (Math.sin(TAU * f * w * t) + 0.3 * Math.sin(TAU * 2 * f * w * t)) * Math.exp(-t / 0.22) * (1 - Math.exp(-t * 300)); }
  return x;
};
/** glass bell (the first sound after the silence) */
const glassBell = (f0, dur = 5, amp = 0.3) => {
  const n = Math.floor(dur * SR), x = new Float64Array(n);
  const parts = [[1, 1, 3.5], [2.32, 0.5, 2.2], [4.25, 0.3, 1.2], [6.63, 0.15, 0.7]];
  for (let i = 0; i < n; i++) { const t = i / SR; let v = 0; for (const [k, a, d] of parts) v += a * Math.sin(TAU * f0 * k * t * (1 + 0.0004 * Math.sin(TAU * 4 * t))) * Math.exp(-t / d); x[i] = amp * v * (1 - Math.exp(-t * 500)); }
  return x;
};
/** a soft breath of air that swells and stops on the beat (a reversed shimmer), lowpassed so it never hisses */
const swell = (dur, amp = 0.05) => { const x = lowpass(lowpass(noise(dur), 1800), 2400); for (let i = 0; i < x.length; i++) { const u = i / x.length; x[i] *= amp * u * u * u * (1 - Math.exp(-(1 - u) * 60)); } return x; };
/** a warm low chime: few, low partials, slow bloom, no metallic top */
const warmChime = (f0, dur = 4, amp = 0.16) => { const n = Math.floor(dur * SR), x = new Float64Array(n); for (let i = 0; i < n; i++) { const t = i / SR; x[i] = amp * (Math.sin(TAU * f0 * t) * Math.exp(-t / 1.8) + 0.35 * Math.sin(TAU * f0 * 2 * t) * Math.exp(-t / 0.9) + 0.12 * Math.sin(TAU * f0 * 3 * t) * Math.exp(-t / 0.5)) * (1 - Math.exp(-t * 120)); } return x; };
const click = (amp = 0.25, fc = 3000, d = 0.01) => env(highpass(noise(0.05), fc), 0.0004, d).map((v) => v * amp);
const paper = (dur, amp = 0.2) => {
  const x = lowpass(highpass(noise(dur), 1200), 6000);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] *= amp * Math.sin(Math.PI * t / dur) * (0.5 + 0.5 * Math.abs(Math.sin(TAU * 7 * t + 3 * Math.sin(TAU * 2 * t)))); }
  return x;
};
const thud = (amp = 0.6) => {
  const n = Math.floor(0.7 * SR), x = new Float64Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; x[i] = amp * Math.sin(TAU * (70 + 60 * Math.exp(-t * 30)) * t) * Math.exp(-t / 0.16); }
  const c = click(0.35, 1500, 0.02); for (let i = 0; i < c.length; i++) x[i] += c[i];
  return x;
};
const ping = (f, amp = 0.06) => { const n = Math.floor(0.35 * SR), x = new Float64Array(n); for (let i = 0; i < n; i++) { const t = i / SR; x[i] = amp * (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2 * t)) * Math.exp(-t / 0.08) * (1 - Math.exp(-t * 2000)); } return x; };

// ---------------------------------------------------------------- 2140: Elian, letter two, the museum (0-15.8)
put(pad([47, 54, 59, 62], 4.2, 0.045, 1.2, 1.2), 0.0);               // Bm(add9): the hall
put(pad([35], 4.2, 0.04, 1.5, 1.5), 0.0);
put(musicBox(83, 3, 0.1), 0.8, 1, 0.3);
put(pad([50, 57, 62, 66], 2.6, 0.05, 0.4, 1.2), 3.7);                 // D: letter number two
put(paper(1.0, 0.22), 3.8, 1, 0.1);
const motif = [78, 81, 86, 85];
motif.forEach((m, i) => put(musicBox(m, 2.2), 4.0 + i * 0.32, 1, -0.2 + i * 0.13));
put(pad([42, 49, 54, 57, 61], 10.6, 0.045, 1.2, 1.8), 5.6);           // F#m(add9): the museum
[73, 78, 76, 73, 71, 73, 74, 73].forEach((m, i) => put(musicBox(m, 2.4, 0.06), 6.0 + i * 1.15, 1, -0.15 + (i % 2) * 0.3));
put(warmChime(mtof(66), 3, 0.06), 14.1, 1, 0.1);                      // "what was it for?"

// ---------------------------------------------------------------- the 2020s (15.8-33.2): projector bed, J-cut at 15.4
const typing = (a, b, rate = 11, amp = 0.12) => { for (let t = a; t < b; t += (0.5 + rnd()) / rate) put(click(amp * (0.6 + rnd() * 0.5), 2500, 0.012), t, 1, rnd() * 0.4 - 0.2); };
{
  const st = 15.4, en = 32.9, n = Math.floor((en - st) * SR);
  const bed = lowpass(noise(en - st), 900);
  for (let i = 0; i < n; i++) {
    const t = i / SR, fadeIn = Math.min(1, t / 0.4), fadeOut = Math.min(1, (en - st - t) / 0.3);
    bed[i] *= 0.05 * (0.6 + 0.4 * Math.max(0, Math.sin(TAU * 24 * t)) ** 8) * fadeIn * fadeOut;
  }
  put(bed, st, 1, 0);
}
put(pad([45, 52, 57, 60], 6.6, 0.03, 0.4, 1.2), 15.8);               // Am, muted
// the keys under the fingers: quick, then one letter at a time
for (let t = 17.0; t < 20.4; t += 1 / 7) put(click(0.16, 2200, 0.014), t, 1, (rnd() - 0.5) * 0.3);
for (let t = 20.4; t < 22.2; t += 1 / 2.4) put(click(0.2, 2000, 0.02), t, 1, 0);
// a muted pulse under the screens and the city
const BPM = 100, beat = 60 / BPM, bass = [45, 45, 41, 43];
for (let k = 0, t = 22.3; t < 32.9; k++, t += beat) {
  put(oldPluck(bass[Math.floor(k / 4) % 4] - 12, 0.6, 0.14), t, 1, 0);
  if (k % 2 === 1) put(oldPluck([69, 72, 76, 74][k % 4], 0.4, 0.05), t, 1, 0.3);
}
typing(22.6, 23.4); typing(25.0, 25.6); typing(26.8, 27.6);
// billions of fingers: tapping that spreads across the whole stereo field and thickens
for (let i = 0; i < 900; i++) { const u = Math.pow(rnd(), 0.6), t = 29.4 + u * 3.3; put(click(0.03 + 0.05 * rnd(), 1800 + rnd() * 2500, 0.01), t, 1, rnd() * 2 - 1); }

// ---------------------------------------------------------------- 2140 again (33.2-48)
put(swell(0.8, 0.06), 32.4, 1, 0);
put(warmChime(mtof(62), 5, 0.16), 33.2, 1, -0.1);
put(warmChime(mtof(69), 4, 0.06), 33.32, 1, 0.15);
put(pad([42, 49, 54, 57, 61], 4.6, 0.045, 1.0, 1.4), 33.3);           // F#m: the children's hands
[78, 76, 73].forEach((m, i) => put(musicBox(m, 2.6, 0.06), 34.0 + i * 0.9, 1, -0.1 + i * 0.1));
put(paper(0.7, 0.2), 37.7, 1, -0.1);
put(thud(0.7), 38.3, 1, 0);
put(pad([38, 50, 57, 62, 66], 9.4, 0.06, 0.3, 2.4), 38.4);            // D major
[74, 78, 81, 86].forEach((m, i) => put(musicBox(m, 3, 0.14), 41.2 + i * 0.5, 1, -0.2 + i * 0.13));

// ---------------------------------------------------------------- version 2: re-time the score to the new opening
// L2V2="at,dur,s1" (film seconds of the new opening, as in Letter2.tsx OPEN): the score is laid out in old film time and
// read through the same time map as the picture (oldT), with a 30 ms crossfade at the one jump.
if (process.env.L2V2) {
  const [at, dur, s1] = process.env.L2V2.split(",").map(Number);
  const T0 = 15.4, LNEW = Math.round((at + dur + 0.45) * 30) / 30, SHIFT = LNEW - T0, A = 11.6 - s1;
  const N2 = Math.floor(SR * (DUR + SHIFT)), L2 = new Float64Array(N2), R2 = new Float64Array(N2);
  const xf = Math.floor(0.03 * SR), b = Math.floor(s1 * SR), get = (X, k) => (k >= 0 && k < N ? X[k] : 0);
  for (let i = 0; i < N2; i++) {
    const t = i / SR, k = Math.floor((t < s1 ? t + A : t - SHIFT) * SR);
    let l = get(L, k), r = get(R, k);
    if (i >= b - xf && i < b) { const k2 = Math.floor((t - SHIFT) * SR), w = (i - (b - xf)) / xf; l = l * (1 - w) + get(L, k2) * w; r = r * (1 - w) + get(R, k2) * w; }
    L2[i] = l; R2[i] = r;
  }
  L = L2; R = R2; N = N2;
}

// ---------------------------------------------------------------- duck under the voice, mix, write
let voice = null;
if (voicePath !== "-") voice = readWav(voicePath);
if (voice) {
  const win = Math.floor(0.05 * SR); let acc = 0; const envv = new Float64Array(N);
  for (let i = 0; i < N; i++) { const v = i < voice.length ? voice[i] : 0; acc += v * v; if (i >= win) { const w = i - win < voice.length ? voice[i - win] : 0; acc -= w * w; } envv[i] = Math.sqrt(Math.max(0, acc) / win); }
  let g = 1;
  for (let i = 0; i < N; i++) {
    const target = envv[i] > 0.01 ? 0.45 : 1;
    g += (target - g) * (target < g ? 0.002 : 0.0002);
    const v = i < voice.length ? voice[i] : 0;
    L[i] = L[i] * g + v * 0.9; R[i] = R[i] * g + v * 0.9;
  }
}
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const k = peak > 0.95 ? 0.95 / peak : 1;
const out = Buffer.alloc(44 + N * 4);
out.write("RIFF", 0); out.writeUInt32LE(36 + N * 4, 4); out.write("WAVE", 8); out.write("fmt ", 12);
out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34);
out.write("data", 36); out.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * k)) * 32767), 44 + i * 4); out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * k)) * 32767), 46 + i * 4); }
fs.writeFileSync(outPath, out);
console.log(`wrote ${outPath} (peak ${peak.toFixed(3)}${voice ? ", with voice" : ", no voice"})`);
