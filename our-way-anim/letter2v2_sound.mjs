// Sound for letter 2, version 2 (new opening). Builds the narration in new film time (the new opening at OPEN.at, then
// the old recording from 15.1 s, its "So I tell them", at LNEW), re-times the score with L2V2, mixes, loudnorms to -14 LUFS.
// Usage: node letter2v2_sound.mjs <video.mp4> <out.mp4>   (reads public/voice/elian_letter2_open.mp3 and elian_letter2.mp3)
// The numbers below must match OPEN in src/videos/elian/Letter2.tsx.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const OPEN = { at: 0.7, dur: 5.5, s1: 4.3 };
const LNEW = Math.round((OPEN.at + OPEN.dur + 0.45) * 30) / 30;
const [video, out] = process.argv.slice(2);
const bin = path.resolve("node_modules/@remotion/compositor-win32-x64-msvc");
const FF = fs.existsSync(path.join(bin, "ffmpeg.exe")) ? path.join(bin, "ffmpeg.exe") : "ffmpeg";
const ff = (args) => execFileSync(FF, ["-hide_banner", "-y", "-loglevel", "error", ...args], { stdio: ["ignore", "ignore", "inherit"] });
const TARGET = "I=-14:TP=-1.5:LRA=11";
const measure = (file) => { const r = spawnSync(FF, ["-hide_banner", "-i", file, "-vn", "-af", `loudnorm=${TARGET}:print_format=json`, "-f", "null", "-"], { encoding: "utf8" }); return JSON.parse(r.stderr.match(/\{[^{}]*"input_i"[^{}]*\}/)[0]); };
const ms = (s) => Math.round(s * 1000);
ff(["-i", "public/voice/elian_letter2_open.mp3", "-ss", "15.1", "-i", "public/voice/elian_letter2.mp3",
  "-filter_complex", `[0:a]aresample=48000,adelay=${ms(OPEN.at)}[a];[1:a]aresample=48000,afade=t=in:d=0.05,adelay=${ms(LNEW)}[b];[a][b]amix=inputs=2:normalize=0[v]`,
  "-map", "[v]", "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", "audio/letter2v2_voice.wav"]);
execFileSync(process.execPath, ["audio/letter2_music.mjs", "audio/letter2v2_voice.wav", "audio/letter2v2_mix.wav"], { stdio: "inherit", env: { ...process.env, L2V2: `${OPEN.at},${OPEN.dur},${OPEN.s1}` } });
const m = measure("audio/letter2v2_mix.wav");
const ln = `loudnorm=${TARGET}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
ff(["-i", video, "-i", "audio/letter2v2_mix.wav", "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-af", `${ln},aresample=48000`, "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out]);
const f = measure(out); console.log(`film: ${f.input_i} LUFS, peak ${f.input_tp} dBTP -> ${out}`);
