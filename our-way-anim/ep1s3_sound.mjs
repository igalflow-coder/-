// Add the sound to a rendered video: narration + original score (audio/music.mjs), normalised for YouTube.
// Usage: node ep1s3_sound.mjs out/video.mp4 out/video_sound.mp4 [public/voice/ep1_short3.mp3]   (no voice file yet: score only)
// Steps: narration mp3 -> audio/voice.wav (48 kHz mono) -> audio/mix.wav -> two-pass loudnorm to -14 LUFS / -1.5 dBTP -> AAC, picture copied.
// Uses the ffmpeg that ships with Remotion, so nothing else needs installing.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [video, out, voice = "public/voice/ep1_short3.mp3"] = process.argv.slice(2);
if (!video || !out) { console.error("usage: node ep1s3_sound.mjs <video.mp4> <out.mp4> [voice.mp3]"); process.exit(2); }
const bin = path.resolve("node_modules/@remotion/compositor-win32-x64-msvc");
const FF = fs.existsSync(path.join(bin, "ffmpeg.exe")) ? path.join(bin, "ffmpeg.exe") : "ffmpeg";
const ff = (args) => execFileSync(FF, ["-hide_banner", "-y", ...args], { stdio: ["ignore", "ignore", "inherit"] });
const TARGET = "I=-14:TP=-1.5:LRA=11";
const measure = (file) => {
  const r = spawnSync(FF, ["-hide_banner", "-i", file, "-vn", "-af", `loudnorm=${TARGET}:print_format=json`, "-f", "null", "-"], { encoding: "utf8" });
  const m = r.stderr.match(/\{[^{}]*"input_i"[^{}]*\}/);
  if (!m) throw new Error("loudnorm measurement failed:\n" + r.stderr.slice(-800));
  return JSON.parse(m[0]);
};

const hasVoice = fs.existsSync(voice);
if (hasVoice) ff(["-loglevel", "error", "-i", voice, "-af", "adelay=300", "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", "audio/ep1s3_voice.wav"]);
else console.log(`no voice at ${voice}: score and sound design only`);
execFileSync(process.execPath, ["audio/ep1s3_music.mjs", hasVoice ? "audio/ep1s3_voice.wav" : "-", "audio/ep1s3_mix.wav"], { stdio: "inherit" });

const m = measure("audio/ep1s3_mix.wav");
console.log(`mix before: ${m.input_i} LUFS, peak ${m.input_tp} dBTP`);
const ln = `loudnorm=${TARGET}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
const tmp = out.replace(/\.mp4$/i, "") + ".part.mp4";
ff(["-loglevel", "error", "-i", video, "-i", "audio/ep1s3_mix.wav", "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
  "-af", `${ln},aresample=48000`, "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", tmp]);
fs.renameSync(tmp, out);
const f = measure(out);
console.log(`film: ${f.input_i} LUFS, peak ${f.input_tp} dBTP -> ${out}`);
