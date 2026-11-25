// Our Way, Elian, letter 2: "The Keyboard in the Museum" (vertical short, 48 s).
// Same world, post chain, captions and archive-print look as letter 1 (Elian.tsx); its own shot list and timing.
// Narration: public/voice/elian_letter2.mp3 (ElevenLabs Starter, voice Jason), placed at VOICE_AT; line times from
// the pauses in the recording.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Inner, ArchivePrint, CaptionLayer, GOLD, Shot, pickShot, smooth, ease, lerp, L3, ramp, blinkOn, clamp01, FW } from "./Elian";
import { chunks, Line } from "./timeline";
import { LETTER } from "./paint";

export const FPS = 30;
export const DUR = 48;
export const TOTAL = DUR * FPS;
export const VOICE_AT = 0.3;

export const LINES2: Line[] = [
  { a: 0.33, b: 3.1, text: "This is Elian, from the year 2140." },
  { a: 4.01, b: 4.91, text: "Letter number two." },
  { a: 5.77, b: 8.57, text: "In our museum, there's a keyboard in a glass case." },
  { a: 9.04, b: 11.38, text: "The children stand in front of it for a long time." },
  { a: 11.91, b: 15.31, text: "And they always ask the same question: what was it for?" },
  { a: 15.91, b: 16.58, text: "So I tell them." },
  { a: 17.19, b: 21.94, text: "In your time, every thought had to travel through your fingers... one letter at a time." },
  { a: 22.53, b: 28.87, text: "You pressed these little squares to write love letters, to argue with strangers, to search for answers in the middle of the night." },
  { a: 29.43, b: 32.66, text: "Billions of fingers, tapping, all over the world." },
  { a: 33.48, b: 36.84, text: "Then the children look down at their own hands... and they don't believe me." },
  { a: 37.99, b: 40.42, text: "In my next letter: why I envy you." },
  { a: 41.12, b: 43.77, text: "See you in the future. You're already on your way." },
];
const TITLES = [10, 11];
const CAPS = chunks(LINES2.filter((_, i) => !TITLES.includes(i)));

/** lateral track that settles on each screen while it is named: love letters, strangers, the night */
const TK: [number, number][] = [[22.3, -0.35], [24.5, 0.05], [25.0, 2.75], [26.4, 2.9], [26.85, 5.55], [29.2, 5.75]];
const track = (t: number) => { for (let i = 1; i < TK.length; i++) if (t <= TK[i][0]) return lerp(TK[i - 1][1], TK[i][1], smooth((t - TK[i - 1][0]) / (TK[i][0] - TK[i - 1][0]))); return TK[TK.length - 1][1]; };

const E = [0, 3.7, 5.6, 11.6, 15.8, 22.3, 29.2, 33.2, 37.6, 48];

export const SHOTS2: Shot[] = [
  // 1. "This is Elian": the hall, crane down, Elian walking
  { a: E[0], b: E[1], set: "hall", look: "hall", past: false,
    cam: (u) => ({ pos: L3([0.4, 12, 13], [0.3, 3.6, 6.5], u), look: L3([0, 1, -24], [0, 2.2, -20], u), fov: 44, focus: [0, 1, -6], cInf: 3 }),
    state: (t) => ({ walk: (t * 1.6) % 1, elianZ: -2 - t * 1.05, sunZ: -6 }) },
  // 2. "Letter number two": the envelope opens, the letter rises into the light
  { a: E[1], b: E[2], set: "desk", look: "desk", past: false,
    cam: (u) => ({ pos: L3([0, 1.05, 3.8], [0, 1.25, 3.3], u), look: L3([0, 0.6, 0], [0, 1.0, -0.2], u), fov: 40, focus: [0, 0.8, -0.1], cInf: 7 }),
    state: (t) => { const open = smooth(ramp(t, 3.8, 4.8)); return { open, letter: smooth(ramp(t, 4.5, 5.6)), glow: open * (0.9 + 0.6 * ramp(t, 5.2, 5.6)) }; } },
  // 3. the keyboard in its glass case, two children staring; slow arc
  { a: E[2], b: E[3], set: "hall", look: "hall", past: false,
    cam: (u) => { const an = lerp(0.55, 0.05, u), r = lerp(4.8, 3.9, u); return { pos: [Math.sin(an) * r, lerp(1.4, 1.25, u), -30 + Math.cos(an) * r], look: [0, 1.0, -30], fov: 40, focus: [0, 1.1, -29.3], cInf: 8 }; },
    state: () => ({ elianZ: -10.5, sunZ: -28 }) },
  // 4. "what was it for?": low, behind the children, push toward the case
  { a: E[3], b: E[4], set: "hall", look: "hall", past: false,
    cam: (u) => ({ pos: L3([0.1, 1.0, -25.4], [0.05, 1.1, -26.5], u), look: L3([0, 1.0, -30], [0, 1.1, -30], u), fov: 42, focus: [0, 1.1, -29.5], cInf: 9 }),
    state: () => ({ elianZ: -10.5, sunZ: -28 }) },
  // 5. 2020s: hands on a keyboard, one key at a time
  { a: E[4], b: E[5], set: "typing", look: "night", past: true,
    cam: (u) => ({ pos: L3([0.2, 1.75, 1.9], [0.05, 1.2, 1.35], u), look: L3([0, 0, 0.25], [0, 0, 0.2], u), fov: 38, focus: [0, 0.08, 0.2], cInf: 10 }),
    state: (t) => {
      const fast = t < 20.4, rate = fast ? 7 : 2.4, n = Math.floor((t - 17.0) * rate);
      const typing = t > 17.0;
      return { key: typing ? (n * 7 + 3) % 37 : -1, tap: typing ? (t - 17.0) * rate * 0.5 : 0 };
    } },
  // 6. love letters, arguments, searches at night: a lateral track along three screens
  { a: E[5], b: E[6], set: "row", look: "office", past: true,
    cam: (u, t) => { const x = track(t); return { pos: [x, 1.75, 2.7], look: [x + 0.15, 1.05, -0.95], fov: 38, focus: [x, 1.16, -0.95], cInf: 8 }; },
    state: (t) => ({ scr0: ramp(t, 22.5, 24.6) + blinkOn(t), scr1: ramp(t, 24.9, 26.4) + blinkOn(t), scr2: ramp(t, 26.7, 28.7) + blinkOn(t) }) },
  // 7. "billions of fingers": the city of windows lighting up, pull back
  { a: E[6], b: E[7], set: "city", look: "city", past: true,
    cam: (u, t) => { const k = Math.pow(ease((t - E[6]) / (E[7] - E[6])), 1.4); const [wx, wy, wz] = FW.p; return { pos: [lerp(wx, 8, k), lerp(wy, 30, k), lerp(wz + 3.2, 140, k)], look: [lerp(wx, 0, k), lerp(wy, 16, k), lerp(wz, -120, k)], fov: 40, focus: [wx, wy, wz], cInf: 0 }; },
    state: (t) => ({ lit: 0.02 + 0.98 * Math.pow(ramp(t, 29.4, 32.6), 1.8) }) },
  // 8. back in 2140: the children look down at their own hands
  { a: E[7], b: E[8], set: "hall", look: "hall", past: false,
    cam: (u) => ({ pos: L3([1.4, 1.5, -26.4], [0.9, 1.35, -27.2], u), look: [0, 0.75, -28.9], fov: 40, focus: [0, 0.8, -28.8], cInf: 8 }),
    state: (t) => ({ elianZ: -10.5, sunZ: -28, hands: t > 33.7 ? 1 : 0 }) },
  // 9. the letter closes, the seal comes down: bookend
  { a: E[8], b: E[9], set: "desk", look: "desk", past: false,
    cam: (u) => ({ pos: L3([0, 1.2, 3.3], [0, 1.0, 4.4], u), look: L3([0, 0.95, -0.2], [0, 0.9, 0], u), fov: 40, focus: L3([0, 0.8, -0.2], [0, 0.55, 0.1], u), cInf: 7 }),
    state: (t) => {
      const open = 1 - smooth(ramp(t, 37.7, 38.2));
      const drop = t < 38.0 ? 1 : 1 - ease(ramp(t, 38.0, 38.3)) ** 1.6;
      const sq = t < 38.3 ? 0 : Math.max(0, 1 - (t - 38.3) / 0.25) * Math.sin(ramp(t, 38.3, 38.55) * Math.PI);
      return { open, letter: 0, sealDrop: drop, sealVis: t < 38.0 ? 0 : 1, squash: sq, glow: open * 0.9 + 0.18 };
    } },
];

const Titles2: React.FC<{ t: number }> = ({ t }) => {
  const fade = (a: number, b: number, d = 0.35) => clamp01(Math.min((t - a) / d, (b - t) / d));
  const n = fade(LINES2[10].a, 41.0, 0.4);
  const e1 = fade(LINES2[11].a, 48.5, 0.5), e2 = fade(42.4, 48.5, 0.6), e3 = fade(44.0, 48.5, 0.6);
  return (
    <>
      {n > 0 && (
        <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 260, opacity: n }}>
          <div style={{ ...GOLD, fontSize: 46, letterSpacing: 16 }}>IN MY NEXT LETTER</div>
          <div style={{ ...GOLD, fontSize: 104, fontStyle: "italic", marginTop: 22 }}>Why I envy you</div>
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

export const ElianLetter2: React.FC = () => {
  LETTER.no = 2; LETTER.label = undefined;
  const f = useCurrentFrame();
  const t = f / FPS;
  const s = pickShot(SHOTS2, t);
  const cut = s.past && f - Math.round(s.a * FPS) < 2;
  const weave = s.past ? (cut ? -36 : Math.sin(f * 0.9) * 1.5 + Math.sin(f * 2.3) * 1) : 0;
  const goldIn = Math.max(0.6 * ramp(t, 3.45, 3.7) * (1 - ramp(t, 3.7, 4.1)), ramp(t, 5.2, 5.6) * (1 - ramp(t, 5.6, 6.1)), (1 - ramp(t, 33.2, 34.0)) * (t >= 33.2 ? 1 : 0), 0.6 * ramp(t, 37.35, 37.6) * (1 - ramp(t, 37.6, 38.0)));
  const burn = ramp(t, 15.6, 15.8) * (1 - ramp(t, 15.8, 16.15));
  const dark = ramp(t, 32.7, 33.15) * (t < 33.2 ? 1 : 0);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `translateY(${weave}px)` }}>
        <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.05, far: 2000 }}>
          <Inner shots={SHOTS2} />
        </ThreeCanvas>
      </AbsoluteFill>
      {s.past && <ArchivePrint f={f} />}
      {dark > 0 && <AbsoluteFill style={{ background: "#000", opacity: dark }} />}
      {burn > 0 && <AbsoluteFill style={{ background: "radial-gradient(circle at 60% 40%, #fff1c8 0%, #ff9a3a 45%, #5a1a00 100%)", opacity: burn * 0.9, mixBlendMode: "screen" }} />}
      {goldIn > 0 && <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #fffaf0 0%, #ffd890 50%, #c88a30 100%)", opacity: goldIn * 0.95 }} />}
      <CaptionLayer t={t} caps={CAPS} />
      <Titles2 t={t} />
    </AbsoluteFill>
  );
};
