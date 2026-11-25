// Our Way, episode 1, short 3: "I Envy You" (vertical, 41 s). From the "moment of longing" in the episode 1 script.
// Built after the first numbers on the Second Mirror short: the strongest line first (no slow crane), under 45 s,
// and a question to the viewers before the hint at the long episode.
// Narration: public/voice/ep1_short3.mp3 (ElevenLabs Starter, voice Jason) at VOICE_AT; phrase times from the pauses.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Inner, ArchivePrint, CaptionLayer, GOLD, Shot, pickShot, smooth, ease, lerp, L3, ramp, clamp01 } from "./Elian";
import { chunks, Line } from "./timeline";
import { LETTER } from "./paint";

export const FPS = 30;
export const DUR = 41;
export const TOTAL = DUR * FPS;
export const VOICE_AT = 0.3;

/** caption phrases (film time), one per stretch of speech between pauses */
const PHRASES: Line[] = [
  { a: 0.33, b: 2.45, text: "Sometimes, here in the archive," },
  { a: 2.88, b: 3.66, text: "I envy you." },
  { a: 4.69, b: 5.33, text: "I'm Elian." },
  { a: 5.76, b: 7.79, text: "I write to you from the year 2140." },
  { a: 8.47, b: 10.64, text: "You still know the feeling of a blank page." },
  { a: 11.29, b: 12.48, text: "Of not knowing the answer," },
  { a: 12.81, b: 13.74, text: "and having to sit with it." },
  { a: 14.47, b: 15.5, text: "Of asking a friend" },
  { a: 15.69, b: 16.63, text: "instead of a machine." },
  { a: 17.43, b: 18.16, text: "In my time," },
  { a: 18.44, b: 20.63, text: "an answer is always one breath away." },
  { a: 21.38, b: 22.59, text: "But something got quieter." },
  { a: 23.2, b: 25.8, text: "The struggle that made your ideas truly yours." },
  { a: 26.33, b: 27.26, text: "So keep a little of it." },
  { a: 27.81, b: 29.07, text: "Write something by hand this week." },
];
/** gold titles instead of captions: the question, the hint at the long episode, the sign-off */
const ASK = { a: 29.79, b: 32.0 }, FULL = { a: 32.31, b: 34.3 }, BYE = { a: 34.56 };
const CAPS = chunks(PHRASES);

const E = [0, 4.4, 8.1, 14.2, 17.1, 22.9, 26.1, 32.1, DUR];

export const SHOTS_E1S3: Shot[] = [
  // 1. "Sometimes, here in the archive, I envy you": already moving, close behind Elian between the shelves
  { a: E[0], b: E[1], set: "hall", look: "hall", past: false,
    cam: (u) => ({ pos: L3([0.5, 2.9, -3.0], [0.3, 2.7, -4.8], u), look: L3([-0.1, 0.9, -11], [0, 1.0, -11], u), fov: 40, focus: [0, 1.4, -8], cInf: 7 }),
    state: () => ({ elianZ: -8, sunZ: -10, halo: 0.35 }) },
  // 2. "I'm Elian. I write to you from the year 2140": the envelope opens, the letter rises
  { a: E[1], b: E[2], set: "desk", look: "desk", past: false,
    cam: (u) => ({ pos: L3([0, 1.05, 3.8], [0, 1.25, 3.3], u), look: L3([0, 0.6, 0], [0, 1.0, -0.2], u), fov: 40, focus: [0, 0.8, -0.1], cInf: 7 }),
    state: (t) => { const open = smooth(ramp(t, 4.5, 5.3)); return { open, letter: smooth(ramp(t, 5.0, 7.4)), glow: open * (0.9 + 0.6 * ramp(t, 7.6, 8.1)) }; } },
  // 3. 2020s, "a blank page... not knowing the answer": an empty sheet under a lamp, slow push from above
  { a: E[2], b: E[3], set: "page", look: "night", past: true,
    cam: (u) => ({ pos: L3([0.15, 1.9, 1.1], [0.05, 1.25, 0.6], u), look: [0, 0, 0.0], fov: 40, focus: [0, 0, 0], cInf: 8 }),
    state: () => ({ write: 0 }) },
  // 4. 2020s, "asking a friend instead of a machine": two pupils at their desks, low behind them
  { a: E[3], b: E[4], set: "class", look: "day", past: true,
    cam: (u) => ({ pos: L3([-0.4, 1.05, 6.2], [-0.2, 1.0, 5.3], u), look: [0, 0.9, 1.0], fov: 42, focus: [0, 0.9, 2.5], cInf: 7 }),
    state: () => ({}) },
  // 5. back in 2140, "an answer is always one breath away... something got quieter": the endless hall from above
  { a: E[4], b: E[5], set: "hall", look: "hall", past: false,
    cam: (u) => ({ pos: L3([0, 24, 6], [0, 21, -1], u), look: L3([0, 0, -26], [0, 0, -36], u), fov: 42, focus: [0, 0, -20], cInf: 0 }),
    state: () => ({ elianZ: -8, sunZ: -14 }) },
  // 6. "the struggle that made your ideas truly yours": Elian before the empty mirror, slow push
  { a: E[5], b: E[6], set: "hall", look: "hall", past: false,
    cam: (u) => ({ pos: L3([1.0, 2.4, -2.0], [0.8, 1.95, -6.8], u), look: [0, 1.8, -12], fov: 42, focus: [0, 1.5, -10.5], cInf: 8 }),
    state: () => ({ elianZ: -10.5, mirror: 0, halo: 0.45, sunZ: -10 }) },
  // 7. 2020s, "write something by hand this week": the same sheet fills with handwriting; the question in gold
  { a: E[6], b: E[7], set: "page", look: "night", past: true,
    cam: (u) => ({ pos: L3([0.35, 1.5, 0.9], [0.15, 1.15, 0.65], u), look: [0, 0, 0.05], fov: 40, focus: [0, 0, 0.05], cInf: 8 }),
    state: (t) => ({ write: ramp(t, 27.4, 31.6) }) },
  // 8. the letter closes, the seal comes down; the hint at the long episode and the sign-off in gold
  { a: E[7], b: E[8], set: "desk", look: "desk", past: false,
    cam: (u) => ({ pos: L3([0, 1.2, 3.3], [0, 1.0, 4.4], u), look: L3([0, 0.95, -0.2], [0, 0.9, 0], u), fov: 40, focus: L3([0, 0.8, -0.2], [0, 0.55, 0.1], u), cInf: 7 }),
    state: (t) => {
      const open = 1 - smooth(ramp(t, 32.2, 32.7));
      const drop = t < 32.5 ? 1 : 1 - ease(ramp(t, 32.5, 32.8)) ** 1.6;
      const sq = t < 32.8 ? 0 : Math.max(0, 1 - (t - 32.8) / 0.25) * Math.sin(ramp(t, 32.8, 33.05) * Math.PI);
      return { open, letter: 0, sealDrop: drop, sealVis: t < 32.5 ? 0 : 1, squash: sq, glow: open * 0.9 + 0.18 };
    } },
];

const Titles: React.FC<{ t: number }> = ({ t }) => {
  const fade = (a: number, b: number, d = 0.35) => clamp01(Math.min((t - a) / d, (b - t) / d));
  const q = fade(ASK.a, ASK.b + 0.1, 0.3), full = fade(FULL.a, FULL.b + 0.2, 0.35);
  const e1 = fade(BYE.a, DUR + 0.5, 0.5), e2 = fade(35.9, DUR + 0.5, 0.6), e3 = fade(37.4, DUR + 0.5, 0.6);
  return (
    <>
      {q > 0 && (
        <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1080, opacity: q, background: "linear-gradient(180deg, rgba(8,10,24,0) 48%, rgba(8,10,24,0.82) 56%, rgba(8,10,24,0.82) 76%, rgba(8,10,24,0) 84%)" }}>
          <div style={{ ...GOLD, fontSize: 92, fontStyle: "italic", lineHeight: 1.12, padding: "0 70px", textShadow: "0 0 30px rgba(0,0,0,0.9), 0 3px 0 #2a1a08" }}>When did you last<br />write by hand?</div>
          <div style={{ ...GOLD, fontSize: 46, letterSpacing: 10, marginTop: 30, opacity: clamp01((t - 31.1) / 0.3), textShadow: "0 0 24px rgba(0,0,0,0.9)" }}>TELL ME BELOW</div>
        </AbsoluteFill>
      )}
      {full > 0 && (
        <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 260, opacity: full }}>
          <div style={{ ...GOLD, fontSize: 46, letterSpacing: 16 }}>MY FULL LETTER</div>
          <div style={{ ...GOLD, fontSize: 104, fontStyle: "italic", marginTop: 22 }}>This Sunday</div>
        </AbsoluteFill>
      )}
      {e1 > 0 && (
        <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 260 }}>
          <div style={{ ...GOLD, fontSize: 92, fontStyle: "italic", opacity: e1 }}>See you in the future.</div>
          <div style={{ ...GOLD, fontSize: 64, marginTop: 34, opacity: e2 }}>You're already on your way.</div>
          <div style={{ ...GOLD, fontSize: 34, letterSpacing: 14, marginTop: 120, opacity: e3 * 0.85 }}>OUR WAY · LETTERS FROM 2140</div>
        </AbsoluteFill>
      )}
    </>
  );
};

export const Ep1Short3: React.FC = () => {
  LETTER.no = 3;
  LETTER.label = "Episode 1 · Short 3";
  const f = useCurrentFrame();
  const t = f / FPS;
  const s = pickShot(SHOTS_E1S3, t);
  const cut = s.past && f - Math.round(s.a * FPS) < 2;
  const weave = s.past ? (cut ? -36 : Math.sin(f * 0.9) * 1.5 + Math.sin(f * 2.3) * 1) : 0;
  const goldIn = Math.max(0.6 * ramp(t, 4.15, 4.4) * (1 - ramp(t, 4.4, 4.8)), (1 - ramp(t, 17.1, 17.8)) * (t >= 17.1 && t < 18 ? 1 : 0),
    0.6 * ramp(t, 31.85, 32.1) * (1 - ramp(t, 32.1, 32.5)));
  const burn = Math.max(ramp(t, 7.9, 8.1) * (1 - ramp(t, 8.1, 8.45)), ramp(t, 25.9, 26.1) * (1 - ramp(t, 26.1, 26.45)));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `translateY(${weave}px)` }}>
        <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.05, far: 2000 }}>
          <Inner shots={SHOTS_E1S3} />
        </ThreeCanvas>
      </AbsoluteFill>
      {s.past && <ArchivePrint f={f} />}
      {burn > 0 && <AbsoluteFill style={{ background: "radial-gradient(circle at 60% 40%, #fff1c8 0%, #ff9a3a 45%, #5a1a00 100%)", opacity: burn * 0.9, mixBlendMode: "screen" }} />}
      {goldIn > 0 && <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #fffaf0 0%, #ffd890 50%, #c88a30 100%)", opacity: goldIn * 0.95 }} />}
      <CaptionLayer t={t} caps={CAPS} />
      <Titles t={t} />
    </AbsoluteFill>
  );
};
