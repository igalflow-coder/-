// Test shot (5 s, vertical), asked by Dor in the team room on 27.11: the museum keyboard in its glass case,
// to compare with the shot in letter 2. Three depth layers (sharp keyboard, soft case edges, very soft shelves),
// one warm ray from the high windows with dust drifting in it, a slow push-in that eases out, and Elian's silhouette
// behind the case in the last second. No children, no faces, no logos.
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Inner, Shot, L3, ramp, clamp01 } from "./Elian";
import { ORIGIN } from "./world";
import { NOINK } from "../buddha/ink";

export const FPS = 30;
export const DUR = 5;
export const TOTAL = DUR * FPS;

const outCubic = (u: number) => 1 - Math.pow(1 - clamp01(u), 3);

export const SHOTS_TEST: Shot[] = [
  { a: 0, b: DUR, set: "hall", look: "hall", past: false,
    cam: (_u, t) => {
      const k = outCubic(t / DUR);
      const an = 0.34 - 0.2 * k; // a slight turn while pushing in
      const r = 2.7 - 0.95 * k;
      return { pos: [Math.sin(an) * r, 1.78 - 0.16 * k, -30 + Math.cos(an) * r], look: [0, 1.28 - 0.06 * k, -30.1], fov: 38, focus: [0, 1.14, -30.0], cInf: 13 };
    },
    state: (t) => ({ noKids: 1, walk: (t * 1.1) % 1, elianZ: -33.2 - t * 0.45, sunZ: -28 }) },
];

const glowTex = () => {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d")!; const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,240,205,1)"); gr.addColorStop(0.35, "rgba(255,220,160,0.55)"); gr.addColorStop(1, "rgba(255,200,130,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
const rayTex = () => {
  const c = document.createElement("canvas"); c.width = 64; c.height = 256;
  const g = c.getContext("2d")!; const across = g.createLinearGradient(0, 0, 64, 0);
  across.addColorStop(0, "rgba(255,215,150,0)"); across.addColorStop(0.5, "rgba(255,196,120,1)"); across.addColorStop(1, "rgba(255,215,150,0)");
  g.fillStyle = across; g.fillRect(0, 0, 64, 256);
  g.globalCompositeOperation = "destination-in"; const along = g.createLinearGradient(0, 0, 0, 256);
  along.addColorStop(0, "rgba(0,0,0,0.9)"); along.addColorStop(0.7, "rgba(0,0,0,0.5)"); along.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = along; g.fillRect(0, 0, 64, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

/** the light ray from the high windows and the dust in it, placed in hall coordinates */
const RayAndDust: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const o = ORIGIN.hall;
  const { ray, dust, pos, seeds } = useMemo(() => {
    const ray = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 5.5), new THREE.MeshBasicMaterial({ map: rayTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0.0 }));
    const N = 260, pos = new Float32Array(N * 3), seeds = new Float32Array(N * 4);
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < N; i++) { seeds[i * 4] = r(); seeds[i * 4 + 1] = r(); seeds[i * 4 + 2] = r(); seeds[i * 4 + 3] = r(); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(geo, new THREE.PointsMaterial({ map: glowTex(), size: 0.026, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: "#ffe2a8" }));
    ray.layers.set(NOINK); dust.layers.set(NOINK);
    return { ray, dust, pos, seeds };
  }, []);
  // the ray comes down from upper left, across the case; it brightens over the first two seconds
  const on = 0.35 + 0.65 * ramp(t, 1.6, 2.8);
  (ray.material as THREE.MeshBasicMaterial).opacity = 1.0 * on;
  ray.position.set(o.x - 0.75, o.y + 3.3, o.z - 30.25);
  ray.rotation.set(0, 0.25, -0.38);
  // dust: a slow drift and a little swirl, denser and brighter inside the ray
  const N = pos.length / 3;
  for (let i = 0; i < N; i++) {
    const a = seeds[i * 4], b = seeds[i * 4 + 1], c = seeds[i * 4 + 2], d = seeds[i * 4 + 3];
    const along = (b + t * (0.018 + 0.02 * d)) % 1;                    // position along the ray, drifting down
    const x = -1.75 + along * 2.1 + (a - 0.5) * 0.6 + Math.sin(t * 0.7 + d * 9) * 0.04;
    const y = 5.0 - along * 3.7 + Math.cos(t * 0.6 + a * 7) * 0.03;
    const z = -30.15 + (c - 0.5) * 0.9;
    pos[i * 3] = o.x + x; pos[i * 3 + 1] = o.y + y; pos[i * 3 + 2] = o.z + z;
  }
  dust.geometry.attributes.position.needsUpdate = true;
  (dust.material as THREE.PointsMaterial).opacity = 0.55 + 0.45 * on;
  return (<><primitive object={ray} /><primitive object={dust} /></>);
};

export const TestKeyboard: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 34, near: 0.05, far: 2000 }}>
      <Inner shots={SHOTS_TEST} />
      <RayAndDust />
    </ThreeCanvas>
  </AbsoluteFill>
);

/** the existing museum shot from letter 2 (old film 5.6-11.6 s) is the comparison; see Letter2 SHOTS2[2] */
export const TEST_NOTE = "compare with ElianLetter2 frames 0-99";
export { L3 };
