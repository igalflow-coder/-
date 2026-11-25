# Our Way: animated shorts

Animated vertical shorts for the Our Way channel, rendered with three.js inside Remotion (no AI video generator).
The post-processing passes (`ink.ts`, `lensblur.ts`, `grade.ts`) come from the MIT-licensed
[claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts) template.

- `src/videos/buddha/`: Buddha season, part 1 (palace courtyard world, character cards, camera, post chain).
- `public/voice/part1_amir.mp3`: narration for part 1.
- `src/videos/elian/`: Elian, letter 1, "The Second Mirror" (vertical short, 63 s; shot list in `TREATMENT.md`). Narration `public/voice/elian_mirror.mp3` (ElevenLabs Starter, voice Jason). `COMP=ElianMirror node media.mjs out/elian/full.mp4 0 1889 1 3`, then `node elian_sound.mjs out/elian/full.mp4 renders/OurWay_Elian_SecondMirror_master.mp4` (score: `audio/elian_music.mjs`).
- `src/videos/elian/Letter3.tsx`: Elian, letter 3, "Why I Envy You" (47.3 s). Narration `public/voice/elian_letter3.mp3`. `COMP=ElianLetter3 node media.mjs out/elian/l3_full.mp4 0 1418 1 3`, then `node letter3_sound.mjs out/elian/l3_full.mp4 renders/OurWay_Elian_Letter3_master.mp4` (score: `audio/letter3_music.mjs`).
- `node stills.mjs out/x_ 0,140 0.5`: test stills. `node media.mjs out/clip.mp4 0 149 0.5 3`: a clip.
- `node sound.mjs out/full.mp4 out/full_sound.mp4`: adds narration + score (`audio/music.mjs`, a Node port of `music.py`) at -14 LUFS, using the ffmpeg bundled with Remotion.

Setup: `npm install`. The render scripts use Google Chrome on Windows (`C:/Program Files/Google/Chrome/Application/chrome.exe`) with `gl: "angle"`, so WebGL runs on the GPU.
