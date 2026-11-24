// Channel banner for Our Way (2048 x 1152): the bright archive hall of 2140, rendered with the same world and post
// chain as the letters. YouTube's safe area for text and logo is the centre 1235 x 338.
import React from "react";
import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Inner, Shot, GOLD } from "./Elian";

const W = 2048, H = 1152;

const HALL: Shot[] = [{
  a: 0, b: 1, set: "hall", look: "hall", past: false,
  cam: () => ({ pos: [0, 5.2, 9], look: [0, 2.4, -40], fov: 42, focus: [0, 1.5, -12], cInf: 2 }),
  state: () => ({ elianZ: -9, sunZ: -10, halo: 0.45 }),
}];

export const Banner: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <ThreeCanvas width={W} height={H} shadows gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 42, near: 0.05, far: 2000 }}>
      <Inner shots={HALL} />
    </ThreeCanvas>
    {/* a soft dark band behind the title so it reads on the bright hall */}
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 34% 22% at 50% 43%, rgba(10,14,40,0.72) 0%, rgba(10,14,40,0) 100%)" }} />
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 110 }}>
      <div style={{ ...GOLD, fontSize: 120, fontStyle: "italic", lineHeight: 1 }}>Our Way</div>
      <div style={{ ...GOLD, fontSize: 34, letterSpacing: 14, marginTop: 18 }}>LETTERS FROM 2140</div>
    </AbsoluteFill>
  </AbsoluteFill>
);
