// Original score and sound design for Elian letter 3, "Why I Envy You" (47.3 s), all synthesised here.
// 2140: a warm pad in D, a soft music box and low warm chimes (no glass bells). The 2020s: a projector bed, a muted
// pulse from "surprised" on, the first question typed key by key. Swells lead into each change of time.
// Usage: node audio/letter3_music.mjs [voice.wav|-] [mix.wav]   (voice: 48 kHz mono 16-bit; "-" = no voice, no ducking)
import fs from "node:fs";

const [voicePath = "-", outPath = "audio/letter3_mix.wav"] = process.argv.slice(2);
const SR = 48000, DUR = 47.3, N = Math.floor(SR * DUR), TAU = 2 * Math.PI;
const L = new Float64Array(N), R = new Float64Array(N);
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

// ---------------------------------------------------------------- 2140: Elian, letter three (0-19.4)
put(pad([50, 57, 62, 66], 4.3, 0.045, 1.2, 1.2), 0.0);               // D(add9): the hall
put(pad([38], 4.3, 0.04, 1.5, 1.5), 0.0);
put(musicBox(81, 3, 0.07), 0.8, 1, 0.3);
put(swell(0.7, 0.05), 3.2, 1, 0);
put(paper(1.0, 0.2), 4.0, 1, 0.1);                                   // letter number three
put(pad([55, 62, 67, 71], 2.4, 0.045, 0.4, 1.0), 3.9);
[79, 83, 86, 83].forEach((m, i) => put(musicBox(m, 2.2, 0.08), 4.3 + i * 0.34, 1, -0.2 + i * 0.13));
put(warmChime(mtof(62), 3.5, 0.08), 5.6, 1, 0);
put(pad([43, 55, 62, 67, 69], 3.6, 0.045, 0.8, 1.2), 6.0);            // G(add9): "I promised"
put(pad([47, 54, 59, 62, 66], 3.5, 0.045, 0.8, 1.2), 9.3);            // Bm(add11): everything is invented
put(warmChime(mtof(59), 3.5, 0.08), 10.45, 1, -0.1);
put(pad([42, 54, 57, 62, 66], 3.8, 0.045, 0.8, 1.4), 12.5);           // D/F#: machines, doors
[74, 78, 81].forEach((m, i) => put(musicBox(m, 2.2, 0.05), 12.9 + i * 1.2, 1, -0.15 + i * 0.15));
put(pad([40, 52, 59, 64, 67], 3.8, 0.045, 0.8, 1.0), 16.0);           // Em(add9): nobody remembers
[71, 67, 64].forEach((m, i) => put(musicBox(m, 2.4, 0.05), 16.4 + i * 1.0, 1, 0.1 - i * 0.1));
put(swell(0.8, 0.06), 18.6, 1, 0);

// ---------------------------------------------------------------- the 2020s (19.4-29.0): projector bed, J-cut at 19.1
{
  const st = 19.1, en = 28.8, n = Math.floor((en - st) * SR);
  const bed = lowpass(noise(en - st), 900);
  for (let i = 0; i < n; i++) {
    const t = i / SR, fadeIn = Math.min(1, t / 0.4), fadeOut = Math.min(1, (en - st - t) / 0.4);
    bed[i] *= 0.045 * (0.6 + 0.4 * Math.max(0, Math.sin(TAU * 24 * t)) ** 8) * fadeIn * fadeOut;
  }
  put(bed, st, 1, 0);
}
put(pad([45, 52, 57, 60, 64], 5.2, 0.03, 0.6, 1.2), 19.4);            // Am(add9), muted: "but you..."
put(warmChime(mtof(57), 4, 0.07), 20.72, 1, 0);                       // "for the first time": the first window
put(pad([41, 53, 57, 60, 64], 4.9, 0.03, 0.6, 1.4), 24.3);            // Fmaj7: afraid, curious
// a soft pulse from "surprised" on, the bass rising toward "decide"
const beat = 60 / 90, bass = [45, 45, 41, 43];
for (let k = 0, t = 22.74; t < 28.6; k++, t += beat) {
  put(oldPluck(bass[Math.floor(k / 4) % 4] - 12, 0.6, 0.12), t, 1, 0);
  if (k % 2 === 1) put(oldPluck([69, 72, 76, 74][k % 4], 0.4, 0.04), t, 1, 0.3);
}
// the first question, typed slowly; a soft ping when the answer comes
for (let t = 24.65; t < 26.1; t += 0.16 + rnd() * 0.12) put(click(0.12, 2200, 0.014), t, 1, (rnd() - 0.5) * 0.3);
put(ping(1320, 0.04), 26.25, 1, 0.1);

// ---------------------------------------------------------------- 2140 again (29.0-47.3)
put(swell(0.8, 0.06), 28.2, 1, 0);
put(warmChime(mtof(62), 5, 0.15), 29.0, 1, -0.1);
put(warmChime(mtof(69), 4, 0.05), 29.12, 1, 0.15);
put(pad([50, 57, 62, 66, 69], 5.6, 0.045, 1.0, 1.4), 29.1);           // D(add9): the mirror
put(warmChime(mtof(66), 4, 0.07), 32.0, 1, 0.1);                      // "you get to make them"
put(paper(0.7, 0.2), 34.5, 1, -0.1);
put(thud(0.6), 35.1, 1, 0);
put(pad([38, 50, 57, 62, 66], 12.1, 0.055, 0.3, 3.0), 35.2);          // D major to the end
[74, 78, 81, 86].forEach((m, i) => put(musicBox(m, 3, 0.1), 40.2 + i * 0.5, 1, -0.2 + i * 0.13));
put(warmChime(mtof(50), 5, 0.08), 42.9, 1, 0);

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
