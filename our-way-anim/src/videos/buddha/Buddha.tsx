// Our Way, Buddha season, part 1. One three.js world posed per frame; post chain copied from the bridge template:
// ink -> lens blur (pre + main) -> bloom -> NEUTRAL tone map -> warm grade, MSAA 4.
import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World } from "./world";
import { InkPass } from "./ink";
import { LensBlur } from "./lensblur";
import { GradeEffect, GRADES } from "./grade";

export const FPS = 30;
export const TOTAL = 150;

const smooth = (u: number) => { const x = Math.max(0, Math.min(1, u)); return x * x * (3 - 2 * x); };
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

type Cam = { pos: THREE.Vector3; look: THREE.Vector3; fov: number; focus: number; cInf: number };
/** Shot 5: the sage looks at the baby and weeps. Slow push-in from a medium shot, low and to his front. */
const camAt = (f: number): Cam => {
  const u = smooth(f / TOTAL);
  return {
    pos: V(0.55 - 0.15 * u, 0.95 + 0.05 * u, 3.7 - 0.9 * u),
    look: V(-0.45, 2.0, -2),
    fov: 42,
    focus: 0,
    cInf: 11,
  };
};

const Inner: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.golden, 1),
  }), [camera, scene]);
  const cam = camera as THREE.PerspectiveCamera;
  const c = camAt(f);
  cam.position.copy(c.pos);
  cam.fov = c.fov;
  cam.updateProjectionMatrix();
  cam.lookAt(c.look);
  world.update(cam, scene);
  const fwd = new THREE.Vector3();
  cam.getWorldDirection(fwd);
  fx.lens.focus = Math.max(0.3, world.sage.position.clone().add(V(0, 1.4, 0)).sub(cam.position).dot(fwd));
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

export const BuddhaPart1: React.FC = () => (
  <AbsoluteFill style={{ background: "#ffd29a" }}>
    <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 36, near: 0.1, far: 1500 }}>
      <Inner />
    </ThreeCanvas>
  </AbsoluteFill>
);
