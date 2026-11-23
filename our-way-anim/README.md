# Our Way: animated shorts

Animated vertical shorts for the Our Way channel, rendered with three.js inside Remotion (no AI video generator).
The post-processing passes (`ink.ts`, `lensblur.ts`, `grade.ts`) come from the MIT-licensed
[claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts) template.

- `src/videos/buddha/`: Buddha season, part 1 (palace courtyard world, character cards, camera, post chain).
- `public/voice/part1_amir.mp3`: narration for part 1.
- `node stills.mjs out/x_ 0,140 0.5`: test stills. `node media.mjs out/clip.mp4 0 149 0.5 3`: a clip.

Setup: `npm install`, then point the scripts at a Chromium build (they use the headless shell in /opt/pw-browsers).
