// Our Way, Buddha season, part 1: "The Prophecy That Made a King Build a Golden Cage".
// One three.js world (world.ts) with a set per place; SHOTS pick the set, the light and a camera move per frame.
// Post chain from the bridge template: ink -> lens blur (pre + main) -> bloom -> NEUTRAL tone map -> warm grade.
// Captions (1-3 words) and the end card are HTML layers on top. Sound is muxed after the render (see audio/).
import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World, ORIGIN, SetName, LookName } from "./world";
import { InkPass } from "./ink";
import { LensBlur } from "./lensblur";
import { GradeEffect, GRADES } from "./grade";
import { CAPTIONS } from "./captions";

export const FPS = 30;
export const TOTAL = 1800;
export const END_CARD = 1763;
const FLASH_AT = 140;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => { const u = clamp01(x); return u * u * u * (u * (6 * u - 15) + 10); };
type V3 = [number, number, number];
type Cam = { pos: V3; look: V3; fov: number; focus: V3; cInf: number };
type Shot = { a: number; b: number; set: SetName; look: LookName; cam: (u: number, f: number) => Cam; state?: (f: number) => Record<string, number> };

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

export const SHOTS: Shot[] = [
  // 1-2: the archive of 2140
  { a: 0, b: 142, set: "archive", look: "archive", cam: (u) => ({ pos: [0.3, 1.9, lerp(14, 7, u)], look: [0, 1.5, -6], fov: 40, focus: [0, 1.3, -6], cInf: 4 }), state: (f) => ({ pulse: f / 60 }) },
  { a: 142, b: 269, set: "archive", look: "archive", cam: (u) => ({ pos: [lerp(1.3, 1.0, u), 1.85, lerp(-3.4, -3.9, u)], look: [0, 1.28, -6], fov: 30, focus: [0, 1.3, -6], cInf: 13 }), state: (f) => ({ pulse: f / 60 }) },
  // 3-4: the garden at dawn, the queen's hand on the sal branch
  { a: 269, b: 333, set: "garden", look: "dawn", cam: (u) => ({ pos: [lerp(3.2, 2.2, u), 1.6, 10], look: [0, 3.4, -4], fov: 40, focus: [0, 3, -4], cInf: 3 }) },
  { a: 333, b: 443, set: "garden", look: "dawn", cam: (u) => ({ pos: [lerp(-1.3, -1.6, u), lerp(2.2, 2.3, u), lerp(4.0, 3.5, u)], look: [-1.6, 2.3, 1.5], fov: 34, focus: [-1.6, 2.3, 1.5], cInf: 14 }) },
  // 5-6: seven small footprints, a lotus opening in each
  { a: 443, b: 510, set: "path", look: "dawn", cam: (u) => ({ pos: [0.35, 0.75, lerp(1.9, 0.5, u)], look: [0, 0, lerp(0.1, -1.3, u)], fov: 38, focus: [0, 0, lerp(0.4, -1.0, u)], cInf: 6 }), state: (f) => ({ lotus: (f - 443) / 145 }) },
  { a: 510, b: 588, set: "path", look: "dawn", cam: (u) => ({ pos: [lerp(0.45, 0.35, u), 0.32, lerp(-0.55, -0.65, u)], look: [0.05, 0.05, -1.2], fov: 32, focus: [0.1, 0.05, -1.1], cInf: 14 }), state: (f) => ({ lotus: (f - 443) / 145 }) },
  // 7: night, the lamp goes out
  { a: 588, b: 688, set: "room", look: "night", cam: (u) => ({ pos: [lerp(1.5, 1.3, u), 1.1, lerp(1.4, 1.1, u)], look: [-0.5, 0.55, -2], fov: 40, focus: [0.2, 0.67, -1.4], cInf: 9 }),
    state: (f) => ({ lamp: f < 640 ? 1 : f < 656 ? (1 - (f - 640) / 16) * (0.8 + 0.2 * Math.sin(f * 2.1)) : 0, smoke: f < 656 ? 0 : (f - 656) / 32 }) },
  // 8-10: the sage
  { a: 688, b: 780, set: "court", look: "golden", cam: (u) => ({ pos: [2.5, lerp(4, 2, u), 9], look: [-0.3, 1.5, 0], fov: 38, focus: [-0.3, 1.4, 0], cInf: 3 }) },
  { a: 780, b: 864, set: "court", look: "golden", cam: (u) => ({ pos: [lerp(0.55, 0.4, u), lerp(0.95, 1.0, u), lerp(3.7, 2.8, u)], look: [-0.45, 2.0, -2], fov: 42, focus: [-0.3, 1.4, 0], cInf: 11 }) },
  { a: 864, b: 931, set: "court", look: "golden", cam: (u) => ({ pos: [0.45, 1.38, lerp(1.5, 1.3, u)], look: [-0.22, 1.32, 0], fov: 30, focus: [-0.2, 1.35, 0], cInf: 12 }), state: (f) => ({ tear: (f - 870) / 45 }) },
  // 11-13: a crown or a begging bowl
  { a: 931, b: 1032, set: "crown", look: "studio", cam: (u) => ({ pos: [0, lerp(2.5, 2.3, u), lerp(5.8, 5.0, u)], look: [0, 1.15, 0], fov: 36, focus: [0, 1.1, 0], cInf: 6 }) },
  { a: 1032, b: 1115, set: "crown", look: "studio", cam: (u) => ({ pos: [lerp(-0.5, -0.6, u), 1.35, 0.9], look: [-0.85, 1.12, 0], fov: 30, focus: [-0.85, 1.12, 0], cInf: 13 }) },
  { a: 1115, b: 1160, set: "crown", look: "studio", cam: (u) => ({ pos: [1.05, 1.95, lerp(1.25, 1.1, u)], look: [0.85, 1.15, 0], fov: 30, focus: [0.85, 1.2, 0], cInf: 13 }) },
  // 14: a man walks away from everything
  { a: 1160, b: 1240, set: "path", look: "dawn", cam: () => ({ pos: [0.4, 1.4, -8], look: [0, 1.3, -20], fov: 36, focus: [0, 1.3, -15], cInf: 5 }), state: (f) => ({ walk: ((f - 1160) / 20) % 1, walkZ: ((f - 1160) / 30) * 1.2 }) },
  // 15: the throne of "a mighty king"
  { a: 1240, b: 1327, set: "court", look: "golden", cam: (u) => ({ pos: [0, 1.2, lerp(-6, -7, u)], look: [0, 2.4, -13.5], fov: 38, focus: [0, 2, -13.3], cInf: 6 }) },
  // 16: the council of elders under a tree
  { a: 1327, b: 1451, set: "garden", look: "dawn", cam: (u) => { const an = lerp(0.3, 0.75, u); return { pos: [30 + 7.5 * Math.sin(an), 3.0, 7.5 * Math.cos(an)], look: [30, 0.9, 0], fov: 38, focus: [30, 1, 0], cInf: 5 }; } },
  // 17: the father wants one future
  { a: 1451, b: 1534, set: "court", look: "golden", cam: (u) => ({ pos: [lerp(1.0, 0.8, u), 1.3, lerp(-1.4, -1.9, u)], look: [0, 1.7, -10], fov: 38, focus: [0.2, 1.4, -4.5], cInf: 8 }), state: () => ({ king: 1 }) },
  // 18-20: the golden cage
  { a: 1534, b: 1654, set: "gates", look: "golden", cam: (u) => ({ pos: [8, 6, lerp(40, 34, u)], look: [0, 3, -12], fov: 40, focus: [0, 3, -10], cInf: 0 }), state: (f) => ({ rise: (f - 1534) / 120, close: 0 }) },
  { a: 1654, b: 1733, set: "gates", look: "golden", cam: (u) => ({ pos: [0, 2.4, lerp(20, 17, u)], look: [0, 4, -2], fov: 40, focus: [0, 4, 1], cInf: 3 }), state: (f) => ({ rise: 1, close: smooth((f - 1658) / 66) }) },
  { a: 1733, b: 1763, set: "gates", look: "golden", cam: (u) => ({ pos: [0, lerp(2.6, 3.0, u), lerp(32, 30, u)], look: [0, 5.5, -8], fov: 40, focus: [0, 4, 1], cInf: 0 }), state: () => ({ rise: 1, close: 1 }) },
];

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];

const tmp = new THREE.Vector3(), fwd = new THREE.Vector3();

const Inner: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.6, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.golden, 1),
  }), [camera, scene]);
  const s = shotAt(Math.min(f, END_CARD - 1));
  const u = smooth((f - s.a) / Math.max(1, s.b - s.a));
  const c = s.cam(u, f);
  const o = ORIGIN[s.set];
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(o.x + c.pos[0], o.y + c.pos[1], o.z + c.pos[2]);
  cam.fov = c.fov;
  cam.near = 0.05;
  cam.updateProjectionMatrix();
  cam.lookAt(o.x + c.look[0], o.y + c.look[1], o.z + c.look[2]);
  world.update(s.set, s.look, f, cam, scene, s.state ? s.state(f) : {});
  cam.getWorldDirection(fwd);
  tmp.set(o.x + c.focus[0], o.y + c.focus[1], o.z + c.focus[2]);
  fx.lens.focus = Math.max(0.2, tmp.sub(cam.position).dot(fwd));
  fx.lens.cInf = c.cInf;
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
      </EffectComposer>
    </>
  );
};

const Caption: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS;
  const c = CAPTIONS.find((x) => t >= x.a && t < x.b);
  if (!c) return null;
  const age = (t - c.a) * FPS;
  const pop = age < 3 ? 0.85 + 0.05 * age : 1;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: "1180px" }}>
      <div style={{
        fontFamily: "Liberation Sans, DejaVu Sans, Arial, sans-serif", fontWeight: 700, fontSize: 84, color: "#ffffff",
        WebkitTextStroke: "14px #0b0a0c", paintOrder: "stroke fill", textAlign: "center", maxWidth: 900, lineHeight: 1.05,
        transform: `scale(${pop})`, letterSpacing: 1,
      }}>{c.text}</div>
    </AbsoluteFill>
  );
};

export const BuddhaPart1: React.FC = () => {
  const f = useCurrentFrame();
  const flash = f >= FLASH_AT && f < FLASH_AT + 4 ? [0.9, 0.65, 0.4, 0.15][f - FLASH_AT] : 0;
  if (f >= END_CARD) {
    return (
      <AbsoluteFill style={{ background: "#0b0a0c", justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: "DejaVu Serif, serif", fontWeight: 700, fontSize: 96, color: "#e8c45a", opacity: Math.min(1, (f - END_CARD) / 6) }}>Part 2 tomorrow</div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 36, near: 0.05, far: 2000 }}>
        <Inner />
      </ThreeCanvas>
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      <Caption f={f} />
    </AbsoluteFill>
  );
};
