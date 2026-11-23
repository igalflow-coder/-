// Painted Canvas2D textures for the Buddha world: warm sandstone, ochre walls with arches, leaves with blossoms.
import * as THREE from "three";

const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

const tex = (c: HTMLCanvasElement, rep: [number, number] = [1, 1]) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep[0], rep[1]);
  t.anisotropy = 4;
  return t;
};

const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
};

/** Mottled paint: many soft blotches of slightly lighter and darker tints over a base colour. */
const mottle = (g: CanvasRenderingContext2D, w: number, h: number, base: string, n: number, seed: number, amp = 0.06) => {
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, s = 10 + r() * 60;
    const light = r() > 0.5;
    g.fillStyle = light ? `rgba(255,240,210,${amp * r()})` : `rgba(80,40,20,${amp * r()})`;
    g.beginPath();
    g.ellipse(x, y, s, s * (0.5 + r()), r() * 3, 0, Math.PI * 2);
    g.fill();
  }
};

/** Sandstone floor tiles: 4x4 tiles per texture repeat, dark seams painted in. */
export const floorTex = () => {
  const [c, g] = canvas(1024, 1024);
  mottle(g, 1024, 1024, "#d9b07a", 900, 7, 0.08);
  g.strokeStyle = "rgba(90,50,25,0.55)";
  g.lineWidth = 5;
  for (let i = 0; i <= 4; i++) {
    g.beginPath(); g.moveTo(i * 256, 0); g.lineTo(i * 256, 1024); g.stroke();
    g.beginPath(); g.moveTo(0, i * 256); g.lineTo(1024, i * 256); g.stroke();
  }
  return tex(c, [10, 10]);
};

/** Ochre palace wall with cream trim bands and a row of dark arch recesses (one arch per texture repeat). */
export const wallTex = (arches = true) => {
  const [c, g] = canvas(512, 1024);
  mottle(g, 512, 1024, "#c98a45", 500, 11, 0.07);
  g.fillStyle = "#efdcb4";
  g.fillRect(0, 0, 512, 60);
  g.fillRect(0, 980, 512, 44);
  g.fillStyle = "rgba(120,60,30,0.35)";
  g.fillRect(0, 60, 512, 8);
  if (arches) {
    const ax = 256, top = 300, bot = 900, half = 120;
    g.fillStyle = "#efdcb4";
    g.beginPath();
    g.moveTo(ax - half - 22, bot);
    g.lineTo(ax - half - 22, top + 40);
    g.quadraticCurveTo(ax - half - 22, top - 140, ax, top - 170);
    g.quadraticCurveTo(ax + half + 22, top - 140, ax + half + 22, top + 40);
    g.lineTo(ax + half + 22, bot);
    g.closePath();
    g.fill();
    g.fillStyle = "#5a3424";
    g.beginPath();
    g.moveTo(ax - half, bot);
    g.lineTo(ax - half, top + 40);
    g.quadraticCurveTo(ax - half, top - 110, ax, top - 140);
    g.quadraticCurveTo(ax + half, top - 110, ax + half, top + 40);
    g.lineTo(ax + half, bot);
    g.closePath();
    g.fill();
    g.strokeStyle = "#241726";
    g.lineWidth = 6;
    g.stroke();
  }
  return tex(c);
};

/** Foliage: deep green with lighter leaf strokes and cream-pink sal blossoms. */
export const leafTex = () => {
  const [c, g] = canvas(512, 512);
  mottle(g, 512, 512, "#4c7438", 400, 21, 0.12);
  const r = rng(5);
  for (let i = 0; i < 260; i++) {
    const x = r() * 512, y = r() * 512;
    g.fillStyle = r() > 0.5 ? "#6c9a48" : "#3a5e2c";
    g.beginPath();
    g.ellipse(x, y, 14, 5, r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 70; i++) {
    const x = r() * 512, y = r() * 512;
    g.fillStyle = r() > 0.4 ? "#f6e6c8" : "#f2c4b0";
    g.beginPath();
    g.arc(x, y, 4 + r() * 4, 0, Math.PI * 2);
    g.fill();
  }
  return tex(c, [2, 2]);
};

/** Soft round contact shadow for the feet of character cards. */
export const blobTex = () => {
  const [c, g] = canvas(256, 256);
  const gr = g.createRadialGradient(128, 128, 10, 128, 128, 124);
  gr.addColorStop(0, "rgba(40,25,40,0.55)");
  gr.addColorStop(1, "rgba(40,25,40,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  return t;
};

/** Dawn garden grass with small flowers. */
export const grassTex = () => {
  const [c, g] = canvas(512, 512);
  mottle(g, 512, 512, "#7c9a48", 500, 31, 0.12);
  const r = rng(9);
  for (let i = 0; i < 500; i++) {
    const x = r() * 512, y = r() * 512;
    g.strokeStyle = r() > 0.5 ? "#93b25a" : "#5f7f38";
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y - 8 - r() * 8); g.stroke();
  }
  for (let i = 0; i < 40; i++) {
    g.fillStyle = r() > 0.5 ? "#f6e6c8" : "#e7a3b6";
    g.beginPath(); g.arc(r() * 512, r() * 512, 3, 0, Math.PI * 2); g.fill();
  }
  return tex(c, [24, 24]);
};

/** Soft reddish earth of a path; one texture covers the whole path strip. */
export const earthTex = () => {
  const [c, g] = canvas(512, 2048);
  mottle(g, 512, 2048, "#b98758", 1800, 41, 0.09);
  const r = rng(4);
  for (let i = 0; i < 300; i++) {
    g.fillStyle = `rgba(90,55,30,${0.25 * r()})`;
    g.beginPath(); g.arc(r() * 512, r() * 2048, 2 + r() * 4, 0, Math.PI * 2); g.fill();
  }
  return tex(c, [1, 1]);
};

/** One small bare footprint (sole down), for decals. */
export const footTex = () => {
  const [c, g] = canvas(128, 256);
  g.fillStyle = "rgba(60,32,18,0.9)";
  g.beginPath(); g.ellipse(64, 150, 34, 70, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(64, 70, 30, 26, 0, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(32 + i * 16, 30 - Math.abs(i - 1) * 4, 8 - i, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c);
  return t;
};

/** Night room wall: deep indigo with a painted gold vine border. */
export const roomWallTex = () => {
  const [c, g] = canvas(512, 512);
  mottle(g, 512, 512, "#3d2f5a", 300, 51, 0.1);
  g.strokeStyle = "#b88a3a"; g.lineWidth = 6;
  g.beginPath(); g.moveTo(0, 60); g.lineTo(512, 60); g.stroke();
  for (let x = 16; x < 512; x += 64) { g.beginPath(); g.arc(x + 16, 90, 16, Math.PI, 0); g.stroke(); }
  return tex(c, [4, 1]);
};

/** Archive of 2140: shelves of scroll ends, seen as round glowing caps in rows. */
export const shelfTex = () => {
  const [c, g] = canvas(512, 512);
  g.fillStyle = "#1a2142"; g.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 8; row++) {
    g.fillStyle = "#2b3463"; g.fillRect(0, row * 64 + 56, 512, 8);
    for (let col = 0; col < 16; col++) {
      const x = col * 32 + 16, y = row * 64 + 32;
      g.fillStyle = (row * 7 + col * 3) % 5 === 0 ? "#f2c77a" : "#c79b5c";
      g.beginPath(); g.arc(x, y, 12, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#0b0a0c"; g.lineWidth = 2; g.stroke();
    }
  }
  return tex(c, [3, 2]);
};
