// Our Way, Elian, letter 1: "The Second Mirror" (vertical pilot, 63 s). See TREATMENT.md for the shot list.
// One three.js world (world.ts), SHOTS pick a set, a light and a camera per frame. Post chain reused from the Buddha
// short: ink -> lens blur -> bloom -> neutral tone map -> grade -> grain. Two looks: the future (golden grade, fine
// grain) and the 2020s as an old archive photograph (faded yellow grade, heavy grain, scratches, gate weave).
import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass } from "../buddha/ink";
import { LensBlur, GrainEffect } from "../buddha/lensblur";
import { GradeEffect, GRADES, GradeParams } from "../buddha/grade";
import { World, ORIGIN, SetName, LookName } from "./world";
import { FPS, TOTAL, EDGES, BEAT, LINES, TITLE_LINES, chunks } from "./timeline";
import { rng, SERIF } from "./paint";

export { FPS, TOTAL };

const PAST: GradeParams = {
  ky: [0.07, 0.14, 0.29, 0.55, 0.77, 0.87, 0.93],
  sat: [0.5, 0.58, 0.55],
  tintS: [-0.03, 0.03], tintM: [-0.05, 0.02], tintH: [-0.06, 0.015],
  vig: [0.42, 0.28],
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => { const u = clamp01(x); return u * u * u * (u * (6 * u - 15) + 10); };
const ease = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const L3 = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
type V3 = [number, number, number];
type Cam = { pos: V3; look: V3; fov: number; focus: V3; cInf: number };
type Shot = { a: number; b: number; set: SetName; look: LookName; past: boolean; cam: (u: number, t: number) => Cam; state?: (t: number) => Record<string, number> };
const blinkOn = (t: number) => (Math.floor(t * 1.9) % 2 === 0 ? 10 : 0);
const E = EDGES;

export const SHOTS: Shot[] = [
  // 1. "My name is Elian": the archive hall, crane down; Elian walks away between the shelves
  { a: E[0], b: E[1], set: "hall", look: "hall", past: false,
    cam: (u) => ({ pos: L3([0.4, 15, 15], [0.3, 3.4, 6.0], u), look: L3([0, 1, -24], [0, 2.2, -20], u), fov: 44, focus: [0, 1, -6], cInf: 3 }),
    state: (t) => ({ walk: (t * 1.6) % 1, elianZ: -2 - t * 1.05, sunZ: -6 }) },
  // 2. "This is letter number one": the envelope opens, the letter rises into the gold light
  { a: E[1], b: E[2], set: "desk", look: "desk", past: false,
    cam: (u) => ({ pos: L3([0, 0.95, 4.0], [0, 1.25, 3.3], u), look: L3([0, 0.55, 0], [0, 1.05, -0.2], u), fov: 40, focus: L3([0, 0.55, 0], [0, 1.1, -0.2], u), cInf: 7 }),
    state: (t) => { const open = smooth(ramp(t, BEAT.flapOpen[0], BEAT.flapOpen[1])); return { open, letter: smooth(ramp(t, 7.1, 11.4)), glow: open * (0.9 + 0.6 * ramp(t, 12.8, 13.6)) }; } },
  // 3. "most of you haven't even noticed": the endless aisle from high above
  { a: E[2], b: E[3], set: "hall", look: "hall", past: false,
    cam: (u) => ({ pos: L3([0, 24, 6], [0, 21, -1], u), look: L3([0, 0, -26], [0, 0, -36], u), fov: 42, focus: [0, 0, -20], cInf: 0 }),
    state: () => ({ elianZ: -8, sunZ: -14 }) },
  // 4. 2022: the calendar, the red circle round the 30th; slow push to it
  { a: E[3], b: E[4], set: "cal", look: "day", past: true,
    cam: (u) => ({ pos: L3([0.3, 1.85, 2.7], [-0.12, 1.36, 0.25], u), look: L3([0, 1.75, -1], [-0.16, 1.28, -1], u), fov: 36, focus: L3([0, 1.75, -1], [-0.16, 1.28, -1], u), cInf: 9 }),
    state: (t) => ({ circle: ramp(t, BEAT.circle[0], BEAT.circle[1]) }) },
  // 5. a dark room, an empty box, a blinking cursor; push into the screen
  { a: E[4], b: E[5], set: "room", look: "night", past: true,
    cam: (u) => ({ pos: L3([0.45, 1.42, 0.9], [0.04, 1.2, -1.55], u), look: [0, 1.18, -2.45], fov: 38, focus: [0, 1.18, -2.45], cInf: 9 }),
    state: (t) => ({ blink: blinkOn(t) }) },
  // 6. one window lights, then a city of them; long pull back
  { a: E[5], b: E[6], set: "city", look: "city", past: true,
    cam: (u, t) => { const k = Math.pow(ease((t - E[5]) / (E[6] - E[5])), 1.6); const [wx, wy, wz] = FW.p; return { pos: [lerp(wx, 8, k), lerp(wy, 30, k), lerp(wz + 3.2, 140, k)], look: [lerp(wx, 0, k), lerp(wy, 16, k), lerp(wz, -120, k)], fov: 40, focus: [wx, wy, wz], cInf: 0 }; },
    state: (t) => ({ lit: Math.pow(ramp(t, BEAT.windows[0], BEAT.windows[1]), 2.4) }) },
  // 7. a lateral track along three screens: a poem, code, an email
  { a: E[6], b: E[7], set: "row", look: "office", past: true,
    cam: (u) => { const x = lerp(-0.6, 6.1, u); return { pos: [x, 1.75, 2.7], look: [x + 0.15, 1.05, -0.95], fov: 38, focus: [x, 1.16, -0.95], cInf: 8 }; },
    state: (t) => ({ scr0: ramp(t, 30.2, 31.3) + blinkOn(t), scr1: ramp(t, 31.1, 32.3) + blinkOn(t), scr2: ramp(t, 32.3, 34.0) + blinkOn(t) }) },
  // 8. a lonely person talks to it all night ("maybe one of them was you"); the long pull back, then dark
  { a: E[7], b: E[8], set: "room", look: "night", past: true,
    cam: (u) => ({ pos: L3([0.8, 1.6, 0.3], [1.8, 2.0, 2.9], u), look: L3([0, 1.15, -2.4], [0.3, 1.35, -2.2], u), fov: 38, focus: [0, 1.15, -1.6], cInf: 6 }),
    state: (t) => ({ lonely: 1, night: ramp(t, 34.9, 37.6) + blinkOn(t) }) },
  // 9. back in 2140: Elian before the mirror, one continuous push until the glass fills the frame
  { a: E[8], b: E[9], set: "hall", look: "hall", past: false,
    cam: (u, t) => {
      const k1 = smooth(ramp(t, 40.7, 43.3)), k2 = smooth(ramp(t, 42.8, 47.2));
      const p1 = L3([1.0, 2.6, 3.0], [0.8, 1.95, -7.4], k1), p = L3(p1, [0.42, 1.88, -9.55], k2);
      return { pos: p, look: [0, lerp(1.75, 1.88, k2), -12], fov: lerp(42, 46, k2), focus: k2 > 0.3 ? [0, 1.85, -12] : [0, 1.5, -10.5], cInf: 8 };
    },
    state: (t) => {
      const mirror = t < BEAT.face[0] ? 0 : t < BEAT.face[1] ? 0.33 * ramp(t, BEAT.face[0], BEAT.face[1])
        : t < BEAT.words[0] ? 0.33 + 0.27 * ramp(t, BEAT.face[1], BEAT.words[0]) : 0.6 + 0.4 * ramp(t, BEAT.words[0], BEAT.words[1]);
      return { elianZ: -10.5, mirror, halo: 0.2 + 0.5 * ramp(t, 41.3, 42.9) + 0.4 * ramp(t, 46.2, 47.7), sunZ: -10 };
    } },
  // 10. "in my next letter": the keyboard in its glass case, two children staring; slow arc round it
  { a: E[9], b: E[10], set: "hall", look: "hall", past: false,
    cam: (u) => { const an = lerp(0.5, -0.2, u), r = lerp(4.6, 3.6, u); return { pos: [Math.sin(an) * r, lerp(1.3, 1.2, u), -30 + Math.cos(an) * r], look: [0, 1.0, -30], fov: 40, focus: [0, 1.05, -29.2], cInf: 8 }; },
    state: () => ({ elianZ: -10.5, sunZ: -28, mirror: 0 }) },
  // 11. the letter closes, the seal comes down: bookend
  { a: E[10], b: E[11], set: "desk", look: "desk", past: false,
    cam: (u) => ({ pos: L3([0, 1.2, 3.3], [0, 1.0, 4.4], u), look: L3([0, 0.95, -0.2], [0, 0.9, 0], u), fov: 40, focus: L3([0, 0.8, -0.2], [0, 0.55, 0.1], u), cInf: 7 }),
    state: (t) => {
      const open = 1 - smooth(ramp(t, BEAT.flapClose[0], BEAT.flapClose[1]));
      const drop = t < 55.5 ? 1 : 1 - ease(ramp(t, 55.5, BEAT.sealLand)) ** 1.6;
      const sq = t < BEAT.sealLand ? 0 : Math.max(0, 1 - (t - BEAT.sealLand) / 0.25) * Math.sin(ramp(t, BEAT.sealLand, BEAT.sealLand + 0.25) * Math.PI);
      return { open, letter: 0, sealDrop: drop, sealVis: t < 55.5 ? 0 : 1, squash: sq, glow: open * 0.9 + 0.18 };
    } },
];

export const shotAt = (t: number) => SHOTS.find((s) => t >= s.a && t < s.b) ?? SHOTS[SHOTS.length - 1];

const tmp = new THREE.Vector3(), fwd = new THREE.Vector3();
/** the first window of the city, read from the world once it is built */
const FW: { p: V3 } = { p: [0, 7.5, -4] };

const Inner: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const { camera, scene } = useThree();
  const world = useMemo(() => { const w = new World(); FW.p = w.firstWindow; return w; }, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.7, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.65 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.golden, 1),
    grain: new GrainEffect({ amount: 0.02, cellPx: 1.6 }),
  }), [camera, scene]);
  const s = shotAt(t);
  const u = smooth((t - s.a) / Math.max(0.01, s.b - s.a));
  const c = s.cam(u, t);
  const o = ORIGIN[s.set];
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(o.x + c.pos[0], o.y + c.pos[1], o.z + c.pos[2]);
  cam.fov = c.fov; cam.near = 0.05; cam.far = 2000;
  cam.updateProjectionMatrix();
  cam.lookAt(o.x + c.look[0], o.y + c.look[1], o.z + c.look[2]);
  const st = s.state ? s.state(t) : {};
  world.update(s.set, s.look, f, cam, scene, st);
  world.seal.visible = st.sealVis === undefined ? true : st.sealVis > 0;
  cam.getWorldDirection(fwd);
  tmp.set(o.x + c.focus[0], o.y + c.focus[1], o.z + c.focus[2]);
  fx.lens.focus = Math.max(0.2, tmp.sub(cam.position).dot(fwd));
  fx.lens.cInf = c.cInf;
  const tag = fx.grade as unknown as { _p?: boolean };
  if (tag._p !== s.past) { fx.grade.set(s.past ? PAST : GRADES.golden); tag._p = s.past; }
  fx.grain.seed = f;
  fx.grain.amount = s.past ? 0.075 : 0.018;
  return (
    <>
      <primitive object={world.root} dispose={null} />
      <EffectComposer multisampling={4}>
        <primitive object={fx.ink} dispose={null} />
        <primitive object={fx.lens.pre} dispose={null} />
        <primitive object={fx.lens.main} dispose={null} />
        <primitive object={fx.bloom} dispose={null} />
        <primitive object={fx.tone} dispose={null} />
        <primitive object={fx.grade} dispose={null} />
        <primitive object={fx.grain} dispose={null} />
      </EffectComposer>
    </>
  );
};

/** Old archive print on top of the 2020s: scratches, dust, flicker, burnt edges. Deterministic per frame. */
const ArchivePrint: React.FC<{ f: number }> = ({ f }) => {
  const r = rng(f * 7919 + 13);
  const scratches = Array.from({ length: 1 + Math.floor(r() * 3) }, () => ({ x: r() * 1080, w: 1 + r() * 2.5, o: 0.15 + r() * 0.35, y0: r() * 600, y1: 1300 + r() * 620 }));
  const dust = Array.from({ length: 6 + Math.floor(r() * 10) }, () => ({ x: r() * 1080, y: r() * 1920, s: 2 + r() * 7, d: r() > 0.5 }));
  const flick = 0.04 + r() * 0.07;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {scratches.map((s, i) => <line key={i} x1={s.x} y1={s.y0} x2={s.x + (r() - 0.5) * 8} y2={s.y1} stroke={i % 2 ? "#f5ecd8" : "#1a1206"} strokeOpacity={s.o} strokeWidth={s.w} />)}
        {dust.map((d, i) => <ellipse key={i} cx={d.x} cy={d.y} rx={d.s} ry={d.s * 0.6} fill={d.d ? "#140e06" : "#f4ead4"} fillOpacity={0.55} />)}
      </svg>
      <AbsoluteFill style={{ background: "#1a1206", opacity: flick }} />
      <AbsoluteFill style={{ boxShadow: "inset 0 0 160px 40px rgba(40,24,8,0.75)" }} />
    </AbsoluteFill>
  );
};

const CAPS = chunks(LINES.filter((_, i) => !TITLE_LINES.includes(i)));

const Caption: React.FC<{ t: number }> = ({ t }) => {
  const c = CAPS.find((x) => t >= x.a && t < x.b);
  if (!c) return null;
  const age = (t - c.a) * FPS;
  const pop = age < 3 ? 0.85 + 0.05 * age : 1;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: "1180px" }}>
      <div style={{
        fontFamily: "'Segoe UI', Arial, sans-serif", fontWeight: 800, fontSize: 84, color: "#ffffff",
        WebkitTextStroke: "14px #0b0a0c", paintOrder: "stroke fill", textAlign: "center", maxWidth: 900, lineHeight: 1.05,
        transform: `scale(${pop})`, letterSpacing: 1,
      }}>{c.text}</div>
    </AbsoluteFill>
  );
};

/** Gold serif titles: "The Second Mirror" over the glass, and the sign-off over the sealed letter. */
const Title: React.FC<{ t: number }> = ({ t }) => {
  const gold = { fontFamily: SERIF, color: "#f2cf7a", textShadow: "0 0 24px rgba(255,190,90,0.65), 0 3px 0 #2a1a08", textAlign: "center" as const };
  const fade = (a: number, b: number, d = 0.35) => clamp01(Math.min((t - a) / d, (b - t) / d));
  const m = fade(LINES[10].a, LINES[10].b + 0.7);
  const e1 = fade(LINES[14].a, 63.5, 0.5), e2 = fade(57.1, 63.5, 0.6), e3 = fade(58.7, 63.5, 0.6);
  return (
    <>
      {m > 0 && (
        <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 300, opacity: m }}>
          <div style={{ ...gold, fontSize: 52, letterSpacing: 18, opacity: 0.9 }}>WE CALL IT</div>
          <div style={{ ...gold, fontSize: 118, fontStyle: "italic", marginTop: 20, transform: `translateY(${(1 - m) * 20}px)` }}>The Second Mirror</div>
        </AbsoluteFill>
      )}
      {e1 > 0 && (
        <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 260 }}>
          <div style={{ ...gold, fontSize: 92, fontStyle: "italic", opacity: e1 }}>See you in the future.</div>
          <div style={{ ...gold, fontSize: 64, marginTop: 34, opacity: e2 }}>You're already on your way.</div>
          <div style={{ ...gold, fontSize: 34, letterSpacing: 14, marginTop: 120, opacity: e3 * 0.85 }}>OUR WAY · LETTERS FROM 2140</div>
        </AbsoluteFill>
      )}
    </>
  );
};

export const ElianMirror: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const s = shotAt(t);
  // gate weave: the 2020s print jumps for 2 frames on each cut and drifts a little
  const cut = s.past && f - Math.round(s.a * FPS) < 2;
  const weave = s.past ? (cut ? -36 : Math.sin(f * 0.9) * 1.5 + Math.sin(f * 2.3) * 1) : 0;
  // light transitions: letter light into the hall, film burn into the past, gold return, words into light
  const goldIn = Math.max(0.6 * ramp(t, 5.3, 5.55) * (1 - ramp(t, 5.55, 5.95)), ramp(t, 13.1, 13.6) * (1 - ramp(t, 13.6, 14.1)), (1 - ramp(t, 40.7, 41.5)) * (t >= 40.7 ? 1 : 0), ramp(t, 47.4, 47.9) * (1 - ramp(t, 47.9, 48.4)));
  const burn = ramp(t, 16.0, 16.2) * (1 - ramp(t, 16.2, 16.55));
  const dark = ramp(t, 39.9, 40.6) * (t < 40.7 ? 1 : 0);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `translateY(${weave}px)` }}>
        <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.05, far: 2000 }}>
          <Inner />
        </ThreeCanvas>
      </AbsoluteFill>
      {s.past && <ArchivePrint f={f} />}
      {dark > 0 && <AbsoluteFill style={{ background: "#000", opacity: dark }} />}
      {burn > 0 && <AbsoluteFill style={{ background: "radial-gradient(circle at 60% 40%, #fff1c8 0%, #ff9a3a 45%, #5a1a00 100%)", opacity: burn * 0.9, mixBlendMode: "screen" }} />}
      {goldIn > 0 && <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #fffaf0 0%, #ffd890 50%, #c88a30 100%)", opacity: goldIn * 0.95 }} />}
      <Caption t={t} />
      <Title t={t} />
    </AbsoluteFill>
  );
};
