// Channel picture for Our Way: Elian's gold wax seal "2140" on night blue with a soft gold glow.
// 800 x 800, round composition (YouTube crops channel pictures to a circle).
import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { rng, SERIF } from "./paint";

const S = 800;

const draw = (g: CanvasRenderingContext2D) => {
  // night-blue ground with a warm glow behind the seal
  const bg = g.createRadialGradient(S / 2, S / 2, 40, S / 2, S / 2, S * 0.72);
  bg.addColorStop(0, "#2c3770"); bg.addColorStop(0.55, "#141c40"); bg.addColorStop(1, "#070b1e");
  g.fillStyle = bg; g.fillRect(0, 0, S, S);
  const glow = g.createRadialGradient(S / 2, S / 2, 150, S / 2, S / 2, 360);
  glow.addColorStop(0, "rgba(255,200,110,0.55)"); glow.addColorStop(1, "rgba(255,180,90,0)");
  g.fillStyle = glow; g.fillRect(0, 0, S, S);
  // a few gold motes
  const r = rng(2140);
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI * 2, d = 300 + r() * 120;
    g.fillStyle = `rgba(255,220,150,${0.15 + r() * 0.35})`;
    g.beginPath(); g.arc(S / 2 + Math.cos(a) * d, S / 2 + Math.sin(a) * d, 1.5 + r() * 2.5, 0, Math.PI * 2); g.fill();
  }
  // the seal: irregular wax rim, embossed ring, "2140"
  const c = S / 2, R = 250;
  g.save();
  g.shadowColor = "rgba(0,0,0,0.55)"; g.shadowBlur = 40; g.shadowOffsetY = 14;
  g.beginPath();
  for (let i = 0; i <= 72; i++) { const a = (i / 72) * Math.PI * 2, rr = R + Math.sin(i * 1.7) * 6 + (r() - 0.5) * 8; g.lineTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr); }
  g.closePath();
  const wax = g.createRadialGradient(c - 70, c - 80, 20, c, c, R + 10);
  wax.addColorStop(0, "#ffe9a6"); wax.addColorStop(0.45, "#dba63e"); wax.addColorStop(1, "#7f5214");
  g.fillStyle = wax; g.fill();
  g.restore();
  g.lineWidth = 14; g.strokeStyle = "rgba(90,55,10,0.6)";
  g.beginPath(); g.arc(c, c, 180, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 5; g.strokeStyle = "rgba(255,240,190,0.75)";
  g.beginPath(); g.arc(c - 4, c - 4, 186, Math.PI * 0.9, Math.PI * 1.6); g.stroke();
  g.textAlign = "center"; g.textBaseline = "middle";
  g.font = `bold 150px ${SERIF}`;
  g.fillStyle = "rgba(90,55,10,0.8)"; g.fillText("2140", c + 5, c + 9);
  g.fillStyle = "rgba(255,238,176,0.95)"; g.fillText("2140", c - 2, c + 2);
};

export const Avatar: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [handle] = useState(() => delayRender("draw avatar"));
  useLayoutEffect(() => {
    const g = ref.current!.getContext("2d")!;
    document.fonts.ready.then(() => { draw(g); continueRender(handle); });
  }, [handle]);
  return (
    <AbsoluteFill>
      <canvas ref={ref} width={S} height={S} />
    </AbsoluteFill>
  );
};
