// Our Way, Elian, letter 3: "Why I Envy You" (vertical short, 47.3 s).
// Same world, post chain, captions and archive-print look as letters 1 and 2; its own shot list and timing.
// Narration: public/voice/elian_letter3.mp3 (ElevenLabs Starter, voice Jason), placed at VOICE_AT; line times from
// the pauses in the recording (silencedetect -38 dB, 0.18 s).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Inner, ArchivePrint, CaptionLayer, GOLD, Shot, pickShot, smooth, ease, lerp, L3, ramp, blinkOn, clamp01, FW } from "./Elian";
import { chunks, Line } from "./timeline";
import { LETTER } from "./paint";

export const FPS = 30;
export const DUR = 47.3;
export const TOTAL = Math.round(DUR * FPS);
export const VOICE_AT = 0.3;

/** caption phrases, one per stretch of speech between pauses (film time) */
const PHRASES: Line[] = [
  { a: 0.33, b: 1.37, text: "This is Elian," },
  { a: 1.68, b: 3.3, text: "from the year 2140." },
  { a: 4.2, b: 5.03, text: "Letter number three." },
  { a: 5.98, b: 8.36, text: "I promised to tell you why I envy you." },
  { a: 9.45, b: 10.16, text: "In my time," },
  { a: 10.43, b: 12.24, text: "everything is already invented." },
  { a: 12.75, b: 13.85, text: "The machines speak," },
  { a: 14.09, b: 15.65, text: "the doors open to anywhere," },
  { a: 16.0, b: 18.84, text: "and nobody remembers what it felt like when it was all new." },
  { a: 19.6, b: 20.13, text: "But you..." },
  { a: 20.72, b: 22.19, text: "you are there for the first time." },
  { a: 22.74, b: 24.08, text: "You get to be surprised." },
  { a: 24.41, b: 26.56, text: "You get to be afraid, and curious," },
  { a: 26.79, b: 28.32, text: "and decide what this will become." },
  { a: 29.15, b: 31.46, text: "We read about your decisions in our history books." },
  { a: 31.97, b: 33.21, text: "You get to make them." },
];
/** gold titles (not captions) */
const NEXT = { a: 34.7, b: 39.37 }, BYE = { a: 40.19, b: 42.77 };
const CAPS = chunks(PHRASES);

const E = [0, 3.9, 6.0, 9.3, 12.5, 16.0, 19.4, 24.3, 29.0, 34.4, DUR];

export const SHOTS3: Shot[] = [
  // 1. "This is Elian": the hall, crane down, Elian walking away between the shelves
  { a: E[0], b: E[1], set: "hall", look: "hall", past: false,
    cam: (u) => ({ pos: L3([0.4, 12, 13], [0.3, 3.6, 6.5], u), look: L3([0, 1, -24], [0, 2.2, -20], u), fov: 44, focus: [0, 1, -6], cInf: 3 }),
    state: (t) => ({ walk: (t * 1.6) % 1, elianZ: -2 - t * 1.05, sunZ: -6 }) },
  // 2. "Letter number three": the envelope opens, the letter rises into the light
  { a: E[1], b: E[2], set: "desk", look: "desk", past: false,
    cam: (u) => ({ pos: L3([0, 1.05, 3.8], [0, 1.25, 3.3], u), look: L3([0, 0.6, 0], [0, 1.0, -0.2], u), fov: 40, focus: [0, 0.8, -0.1], cInf: 7 }),
    state: (t) => { const open = smooth(ramp(t, 4.0, 4.9)); return { open, letter: smooth(ramp(t, 4.6, 5.8)), glow: open * (0.9 + 0.6 * ramp(t, 5.4, 5.8)) }; } },
  // 3. "I promised to tell you why I envy you": low behind Elian, standing still between the shelves; slow push
  { a: E[2], b: E[3], set: "hall", look: "hall", past: false,
    cam: (u) => ({ pos: L3([0.5, 2.1, 0.5], [0.4, 2.0, -1.3], u), look: L3([0, 1.3, -14], [0, 1.5, -14], u), fov: 42, focus: [0, 1.2, -8], cInf: 6 }),
    state: () => ({ elianZ: -8, sunZ: -10, halo: 0.3 }) },
  // 4. "everything is already invented": the endless hall from high above
  { a: E[3], b: E[4], set: "hall", look: "hall", past: false,
    cam: (u) => ({ pos: L3([0, 24, 6], [0, 21, -1], u), look: L3([0, 0, -26], [0, 0, -36], u), fov: 42, focus: [0, 0, -20], cInf: 0 }),
    state: () => ({ elianZ: -8, sunZ: -14 }) },
  // 5. "the machines speak, the doors open to anywhere": follow Elian walking toward the mirror's glow
  { a: E[4], b: E[5], set: "hall", look: "hall", past: false,
    cam: (u, t) => { const z = -5.2 - (t - E[4]) * 0.9; return { pos: [0.45, 2.2, z + 6.2], look: [0, 1.2, z - 6], fov: 42, focus: [0, 1.2, z], cInf: 6 }; },
    state: (t) => ({ walk: (t * 1.6) % 1, elianZ: -5.2 - (t - E[4]) * 0.9, sunZ: -12, halo: 0.35 }) },
  // 6. "nobody remembers what it felt like when it was all new": the museum keyboard, two children; slow arc
  { a: E[5], b: E[6], set: "hall", look: "hall", past: false,
    cam: (u) => { const an = lerp(-0.45, 0.1, u), r = lerp(4.9, 4.1, u); return { pos: [Math.sin(an) * r, lerp(1.45, 1.3, u), -30 + Math.cos(an) * r], look: [0, 1.0, -30], fov: 40, focus: [0, 1.1, -29.3], cInf: 8 }; },
    state: () => ({ elianZ: -10.5, sunZ: -28 }) },
  // 7. 2020s, "you are there for the first time": one window lights, then the whole city; long pull back
  { a: E[6], b: E[7], set: "city", look: "city", past: true,
    cam: (u, t) => { const k = Math.pow(ease((t - E[6]) / (E[7] - E[6])), 1.5); const [wx, wy, wz] = FW.p; return { pos: [lerp(wx, 8, k), lerp(wy, 30, k), lerp(wz + 3.2, 140, k)], look: [lerp(wx, 0, k), lerp(wy, 16, k), lerp(wz, -120, k)], fov: 40, focus: [wx, wy, wz], cInf: 0 }; },
    state: (t) => ({ lit: 0.02 + 0.98 * Math.pow(ramp(t, 20.7, 24.0), 2.0) }) },
  // 8. 2020s, "afraid, and curious": one person at a screen, typing the first question; push past the shoulder
  { a: E[7], b: E[8], set: "room", look: "night", past: true,
    cam: (u) => ({ pos: L3([0.9, 1.6, 0.6], [0.35, 1.45, -0.7], u), look: L3([0, 1.15, -2.4], [0, 1.18, -2.45], u), fov: 38, focus: [0, 1.18, -2.3], cInf: 7 }),
    state: (t) => ({ lonely: 1, night: ramp(t, 24.6, 28.4) + blinkOn(t) }) },
  // 9. back in 2140, "you get to make them": Elian before the mirror, a slow push; the glass stays empty
  { a: E[8], b: E[9], set: "hall", look: "hall", past: false,
    cam: (u, t) => { const k = smooth(ramp(t, 29.0, 34.4)); return { pos: L3([1.0, 2.6, 3.0], [0.8, 1.95, -6.6], k), look: [0, lerp(1.75, 1.85, k), -12], fov: 42, focus: [0, 1.5, -10.5], cInf: 8 }; },
    state: (t) => ({ elianZ: -10.5, mirror: 0, halo: 0.2 + 0.6 * ramp(t, 29.5, 33.0), sunZ: -10 }) },
  // 10. the letter closes, the seal comes down: bookend under the gold titles
  { a: E[9], b: E[10], set: "desk", look: "desk", past: false,
    cam: (u) => ({ pos: L3([0, 1.2, 3.3], [0, 1.0, 4.4], u), look: L3([0, 0.95, -0.2], [0, 0.9, 0], u), fov: 40, focus: L3([0, 0.8, -0.2], [0, 0.55, 0.1], u), cInf: 7 }),
    state: (t) => {
      const open = 1 - smooth(ramp(t, 34.5, 35.0));
      const drop = t < 34.8 ? 1 : 1 - ease(ramp(t, 34.8, 35.1)) ** 1.6;
      const sq = t < 35.1 ? 0 : Math.max(0, 1 - (t - 35.1) / 0.25) * Math.sin(ramp(t, 35.1, 35.35) * Math.PI);
      return { open, letter: 0, sealDrop: drop, sealVis: t < 34.8 ? 0 : 1, squash: sq, glow: open * 0.9 + 0.18 };
    } },
];

const Titles3: React.FC<{ t: number }> = ({ t }) => {
  const fade = (a: number, b: number, d = 0.35) => clamp01(Math.min((t - a) / d, (b - t) / d));
  const n = fade(NEXT.a, 39.7, 0.4);
  const e1 = fade(BYE.a, DUR + 0.5, 0.5), e2 = fade(41.3, DUR + 0.5, 0.6), e3 = fade(42.9, DUR + 0.5, 0.6);
  return (
    <>
      {n > 0 && (
        <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 230, opacity: n }}>
          <div style={{ ...GOLD, fontSize: 46, letterSpacing: 16 }}>IN MY NEXT LETTER</div>
          <div style={{ ...GOLD, fontSize: 84, fontStyle: "italic", marginTop: 22, lineHeight: 1.15, padding: "0 70px" }}>The job you do today<br />that no child here<br />has ever heard of</div>
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

export const ElianLetter3: React.FC = () => {
  LETTER.no = 3; LETTER.label = undefined;
  const f = useCurrentFrame();
  const t = f / FPS;
  const s = pickShot(SHOTS3, t);
  const cut = s.past && f - Math.round(s.a * FPS) < 2;
  const weave = s.past ? (cut ? -36 : Math.sin(f * 0.9) * 1.5 + Math.sin(f * 2.3) * 1) : 0;
  // gold flashes: into the letter, back from the 2020s, into the closing letter
  const goldIn = Math.max(0.6 * ramp(t, 3.65, 3.9) * (1 - ramp(t, 3.9, 4.3)), ramp(t, 5.4, 5.8) * (1 - ramp(t, 5.8, 6.3)),
    (1 - ramp(t, 29.0, 29.8)) * (t >= 29.0 ? 1 : 0), 0.6 * ramp(t, 34.15, 34.4) * (1 - ramp(t, 34.4, 34.8)));
  // the projector burn into the 2020s, and a dip to black out of them
  const burn = ramp(t, 19.2, 19.4) * (1 - ramp(t, 19.4, 19.75));
  const dark = ramp(t, 28.5, 28.95) * (t < 29.0 ? 1 : 0);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `translateY(${weave}px)` }}>
        <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.05, far: 2000 }}>
          <Inner shots={SHOTS3} />
        </ThreeCanvas>
      </AbsoluteFill>
      {s.past && <ArchivePrint f={f} />}
      {dark > 0 && <AbsoluteFill style={{ background: "#000", opacity: dark }} />}
      {burn > 0 && <AbsoluteFill style={{ background: "radial-gradient(circle at 60% 40%, #fff1c8 0%, #ff9a3a 45%, #5a1a00 100%)", opacity: burn * 0.9, mixBlendMode: "screen" }} />}
      {goldIn > 0 && <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #fffaf0 0%, #ffd890 50%, #c88a30 100%)", opacity: goldIn * 0.95 }} />}
      <CaptionLayer t={t} caps={CAPS} />
      <Titles3 t={t} />
    </AbsoluteFill>
  );
};
