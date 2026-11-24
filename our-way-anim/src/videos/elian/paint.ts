// Painted Canvas2D textures for "The Second Mirror": the bright archive of 2140 (pale stone, navy shelves, gold),
// the letter and its wax seal, and the 2020s (calendar, screens, chalkboard). Animated surfaces (screens, calendar
// circle, mirror) are DynTex: one canvas redrawn only when its parameter changes.
import * as THREE from "three";

type G = CanvasRenderingContext2D;
export const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return [c, c.getContext("2d")!] as const;
};
const tex = (c: HTMLCanvasElement, rep: [number, number] = [1, 1]) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep[0], rep[1]);
  t.anisotropy = 8;
  return t;
};
const mottle = (g: G, w: number, h: number, base: string, n: number, seed: number, amp = 0.06, light = "255,245,225", dark = "60,40,30") => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, s = 8 + r() * 50;
    g.fillStyle = r() > 0.5 ? `rgba(${light},${amp * r()})` : `rgba(${dark},${amp * r()})`;
    g.beginPath(); g.ellipse(x, y, s, s * (0.5 + r()), r() * 3, 0, Math.PI * 2); g.fill();
  }
};

export const SERIF = "Georgia, 'DejaVu Serif', serif";
export const SANS = "'Segoe UI', Arial, sans-serif";
export const MONO = "Consolas, 'Courier New', monospace";

/** A canvas texture redrawn on demand: set(v) redraws only when v changes (rounded to `step`). */
export class DynTex {
  c: HTMLCanvasElement; g: G; t: THREE.CanvasTexture; v = NaN; mesh?: THREE.Mesh;
  constructor(w: number, h: number, private draw: (g: G, v: number, w: number, h: number) => void, private step = 1 / 300) {
    [this.c, this.g] = canvas(w, h);
    this.t = new THREE.CanvasTexture(this.c);
    this.t.colorSpace = THREE.SRGBColorSpace;
    this.t.anisotropy = 8;
    this.set(0);
  }
  set(v: number) {
    const q = Math.round(v / this.step) * this.step;
    if (q === this.v) return;
    this.v = q;
    this.g.clearRect(0, 0, this.c.width, this.c.height);
    this.draw(this.g, q, this.c.width, this.c.height);
    this.t.needsUpdate = true;
  }
}

// ---------------------------------------------------------------- 2140
/** Pale warm stone floor of the archive, large tiles with faint veins. */
export const stoneTex = () => {
  const [c, g] = canvas(1024, 1024);
  mottle(g, 1024, 1024, "#e6dccb", 700, 3, 0.07);
  const r = rng(17);
  g.strokeStyle = "rgba(150,130,110,0.18)"; g.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    g.beginPath(); let x = r() * 1024, y = r() * 1024; g.moveTo(x, y);
    for (let k = 0; k < 8; k++) { x += (r() - 0.3) * 120; y += (r() - 0.5) * 90; g.lineTo(x, y); }
    g.stroke();
  }
  g.strokeStyle = "rgba(120,100,80,0.35)"; g.lineWidth = 3;
  for (let i = 0; i <= 2; i++) {
    g.beginPath(); g.moveTo(i * 512, 0); g.lineTo(i * 512, 1024); g.stroke();
    g.beginPath(); g.moveTo(0, i * 512); g.lineTo(1024, i * 512); g.stroke();
  }
  return tex(c, [16, 16]);
};

/** Navy shelves of bound volumes and archive boxes, gold labels, seen face on. */
export const shelfTex = () => {
  const [c, g] = canvas(512, 1024);
  g.fillStyle = "#1c2650"; g.fillRect(0, 0, 512, 1024);
  const r = rng(5);
  const spines = ["#e9dcc0", "#d8c39a", "#c9a35a", "#a9b6d6", "#e3d6b8", "#8e9cc4", "#f0e6cf"];
  for (let row = 0; row < 8; row++) {
    const y0 = row * 128 + 14, h0 = 104;
    let x = 6;
    while (x < 506) {
      const w = 10 + r() * 18, h = h0 * (0.78 + r() * 0.22);
      g.fillStyle = spines[Math.floor(r() * spines.length)];
      g.fillRect(x, y0 + h0 - h, w - 2, h);
      g.fillStyle = "rgba(201,163,90,0.9)";
      g.fillRect(x + 2, y0 + h0 - h + 12, w - 6, 4);
      g.fillStyle = "rgba(20,25,50,0.25)"; g.fillRect(x + w - 5, y0 + h0 - h, 3, h);
      x += w;
    }
    g.fillStyle = "#c9a35a"; g.fillRect(0, y0 + h0, 512, 6);
    g.fillStyle = "#121a3a"; g.fillRect(0, y0 + h0 + 6, 512, 8);
  }
  return tex(c, [1, 1]);
};

/** A tall arched window, transparent outside the arch; mullions in navy. Used as an HDR glowing plane. */
export const windowTex = () => {
  const [c, g] = canvas(256, 768);
  const arch = () => { g.beginPath(); g.moveTo(20, 760); g.lineTo(20, 140); g.arc(128, 140, 108, Math.PI, 0); g.lineTo(236, 760); g.closePath(); };
  arch();
  const gr = g.createLinearGradient(0, 0, 0, 768);
  gr.addColorStop(0, "#fff3d6"); gr.addColorStop(0.6, "#ffd894"); gr.addColorStop(1, "#ffc778");
  g.fillStyle = gr; g.fill();
  g.strokeStyle = "#1c2650"; g.lineWidth = 10;
  g.beginPath(); g.moveTo(128, 30); g.lineTo(128, 760); g.stroke();
  for (const y of [250, 420, 590]) { g.beginPath(); g.moveTo(20, y); g.lineTo(236, y); g.stroke(); }
  arch(); g.lineWidth = 16; g.stroke();
  return tex(c);
};

/** Envelope paper: warm cream with fibres and a soft edge burn. */
export const paperTex = (base = "#efe3c8", seed = 21) => {
  const [c, g] = canvas(1024, 1024);
  mottle(g, 1024, 1024, base, 500, seed, 0.06);
  const r = rng(seed + 1);
  g.strokeStyle = "rgba(120,95,60,0.12)"; g.lineWidth = 1;
  for (let i = 0; i < 900; i++) { const x = r() * 1024, y = r() * 1024, a = r() * 6.28; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); g.stroke(); }
  const v = g.createRadialGradient(512, 512, 300, 512, 512, 760);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(120,80,40,0.35)");
  g.fillStyle = v; g.fillRect(0, 0, 1024, 1024);
  return tex(c);
};

/** The envelope seen from the back (the side with the flap): the folded seams of the bottom and side flaps. */
export const envelopeFrontTex = () => {
  const [c, g] = canvas(1024, 683);
  mottle(g, 1024, 683, "#f1e5ca", 500, 25, 0.06);
  g.fillStyle = "rgba(150,110,60,0.10)";
  g.beginPath(); g.moveTo(0, 0); g.lineTo(470, 360); g.lineTo(0, 683); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(1024, 0); g.lineTo(554, 360); g.lineTo(1024, 683); g.closePath(); g.fill();
  g.strokeStyle = "rgba(110,75,35,0.55)"; g.lineWidth = 5; g.lineJoin = "round";
  g.beginPath(); g.moveTo(0, 683); g.lineTo(440, 330); g.quadraticCurveTo(512, 290, 584, 330); g.lineTo(1024, 683); g.stroke();
  g.strokeStyle = "rgba(110,75,35,0.3)"; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(470, 360); g.stroke();
  g.beginPath(); g.moveTo(1024, 0); g.lineTo(554, 360); g.stroke();
  g.strokeStyle = "rgba(110,75,35,0.45)"; g.lineWidth = 8; g.strokeRect(4, 4, 1016, 675);
  g.fillStyle = "rgba(43,42,74,0.85)"; g.font = `italic 64px ${SERIF}`;
  g.fillText("Letter No. 1", 70, 620);
  return tex(c);
};

/** An old beige keyboard, seen from above: rows of square keys with letters, a long space bar. */
export const keyboardTex = () => {
  const [c, g] = canvas(1024, 360);
  mottle(g, 1024, 360, "#cfc5ae", 200, 41, 0.06);
  const rows = ["1234567890", "QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  g.textAlign = "center"; g.textBaseline = "middle"; g.font = `bold 30px ${SANS}`;
  rows.forEach((r, y) => { const off = 40 + y * 26; for (let i = 0; i < r.length; i++) { const x = off + i * 82, yy = 30 + y * 72;
    g.fillStyle = "#e9e2d0"; g.fillRect(x, yy, 70, 62); g.strokeStyle = "rgba(60,50,40,0.5)"; g.lineWidth = 3; g.strokeRect(x, yy, 70, 62);
    g.fillStyle = "#3a3430"; g.fillText(r[i], x + 35, yy + 31); } });
  g.fillStyle = "#e9e2d0"; g.fillRect(250, 318, 480, 34); g.strokeRect(250, 318, 480, 34);
  return tex(c);
};

/** The letter inside: handwritten lines in iron-gall ink, the date "2140" at the top. */
export const letterTex = () => {
  const [c, g] = canvas(1024, 732);
  mottle(g, 1024, 732, "#f6edd8", 300, 33, 0.05);
  g.fillStyle = "#2b2a4a";
  g.font = `italic 56px ${SERIF}`;
  g.fillText("Archive of the Future, 2140", 80, 110);
  g.font = `italic 50px ${SERIF}`;
  g.fillText("Dear people of 2026,", 80, 200);
  const r = rng(8);
  g.strokeStyle = "rgba(43,42,74,0.75)"; g.lineWidth = 3; g.lineCap = "round";
  for (let i = 0; i < 7; i++) {
    const y = 280 + i * 56; let x = 80; g.beginPath(); g.moveTo(x, y);
    const end = i === 6 ? 500 : 940 - r() * 80;
    while (x < end) { x += 8; g.lineTo(x, y + Math.sin(x * 0.21 + i) * 4 + (r() - 0.5) * 3); }
    g.stroke();
  }
  g.font = `italic 54px ${SERIF}`; g.fillText("Elian", 760, 690);
  return tex(c);
};

/** Gold wax seal, face on: irregular rim, embossed ring and "2140". */
export const sealTex = () => {
  const [c, g] = canvas(512, 512);
  const r = rng(77);
  g.beginPath();
  for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2, rr = 230 + (r() - 0.5) * 26; g.lineTo(256 + Math.cos(a) * rr, 256 + Math.sin(a) * rr); }
  g.closePath();
  const gr = g.createRadialGradient(200, 190, 20, 256, 256, 250);
  gr.addColorStop(0, "#ffe7a0"); gr.addColorStop(0.5, "#d9a43c"); gr.addColorStop(1, "#8a5a18");
  g.fillStyle = gr; g.fill();
  g.lineWidth = 10; g.strokeStyle = "rgba(90,55,10,0.6)";
  g.beginPath(); g.arc(256, 256, 170, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 4; g.strokeStyle = "rgba(255,240,190,0.7)";
  g.beginPath(); g.arc(252, 252, 176, Math.PI * 0.9, Math.PI * 1.6); g.stroke();
  g.textAlign = "center"; g.textBaseline = "middle";
  g.font = `bold 120px ${SERIF}`;
  g.fillStyle = "rgba(90,55,10,0.75)"; g.fillText("2140", 260, 264);
  g.fillStyle = "rgba(255,236,170,0.85)"; g.fillText("2140", 253, 257);
  const t = tex(c);
  return t;
};

/** Dark walnut desk top of the archive. */
export const deskTex = () => {
  const [c, g] = canvas(1024, 512);
  g.fillStyle = "#3a2618"; g.fillRect(0, 0, 1024, 512);
  const r = rng(12);
  for (let i = 0; i < 160; i++) {
    const y = r() * 512; g.strokeStyle = `rgba(${r() > 0.5 ? "120,80,50" : "20,10,5"},${0.15 + r() * 0.2})`; g.lineWidth = 1 + r() * 3;
    g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 32) g.lineTo(x, y + Math.sin(x * 0.006 + i) * 6); g.stroke();
  }
  return tex(c, [2, 1]);
};

// ---------------------------------------------------------------- the 2020s
/** Wall of a 2020s room: plain off-white paint, a little uneven. */
export const wallTex = (base = "#d9d2c3") => {
  const [c, g] = canvas(512, 512);
  mottle(g, 512, 512, base, 400, 61, 0.05);
  return tex(c, [4, 2]);
};

/** Paper wall calendar, November 2022. v 0..1 = the red pen circle round the 30th being drawn. */
export const calendarDraw = (g: G, v: number, W: number, H: number) => {
  mottle(g, W, H, "#f3ecdc", 200, 91, 0.04);
  g.fillStyle = "#b8463a"; g.fillRect(0, 0, W, 150);
  g.fillStyle = "#fbf3e6"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = `bold 78px ${SANS}`; g.fillText("NOVEMBER", W / 2, 70);
  g.fillStyle = "#3a3330"; g.font = `bold 56px ${SANS}`; g.fillText("2022", W / 2, 205);
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const cw = (W - 60) / 7, top = 270, rh = 118;
  g.font = `bold 30px ${SANS}`; g.fillStyle = "#7a706a";
  days.forEach((d, i) => g.fillText(d, 30 + cw * (i + 0.5), top));
  g.strokeStyle = "rgba(80,70,60,0.35)"; g.lineWidth = 2;
  for (let rI = 0; rI <= 5; rI++) { g.beginPath(); g.moveTo(30, top + 30 + rI * rh); g.lineTo(W - 30, top + 30 + rI * rh); g.stroke(); }
  // November 2022 starts on a Tuesday
  let pos30: [number, number] = [0, 0];
  g.font = `44px ${SANS}`;
  for (let d = 1; d <= 30; d++) {
    const idx = d; const col = idx % 7, row = Math.floor(idx / 7);
    const x = 30 + cw * (col + 0.5), y = top + 30 + row * rh + rh * 0.42;
    g.fillStyle = col >= 5 ? "#b8463a" : "#3a3330";
    g.fillText(String(d), x, y);
    if (d === 30) pos30 = [x, y];
  }
  if (v > 0) {
    g.strokeStyle = "#c8201c"; g.lineWidth = 9; g.lineCap = "round";
    g.beginPath();
    const n = Math.floor(70 * Math.min(1, v));
    for (let i = 0; i <= n; i++) {
      const a = -2.2 + (i / 70) * Math.PI * 2.25;
      const rr = 62 + Math.sin(i * 0.4) * 3 + (i / 70) * 8;
      const x = pos30[0] + Math.cos(a) * rr * 1.1, y = pos30[1] + Math.sin(a) * rr * 0.85;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }
};

/** Generic chat window (no real product): title strip, empty area, input box. kind selects the content; v = progress. */
export type ScreenKind = "empty" | "poem" | "code" | "email" | "night";
const SCREEN_TEXT: Record<Exclude<ScreenKind, "empty">, [string, string[]]> = {
  poem: ["write a birthday poem for my mom", ["Sixty candles, one small light,", "you taught me how to hold it right.", "Happy birthday, Mom."]],
  code: ["fix my code, it crashes", ["for (let i = 0; i < n; i++) {", "  total += items[i].price;", "}", "// fixed: i <= n read past the end"]],
  email: ["help me write the email I'm afraid to send", ["Dear Dana,", "I've been meaning to say this", "for a long time. I'm sorry."]],
  night: ["are you still there?", ["I'm here.", "Tell me about your day."]],
};
export const screenDraw = (kind: ScreenKind) => (g: G, v: number, W: number, H: number) => {
  // v = progress (0..1) + 10 while the cursor is shown
  const blink = v >= 9.99; v = blink ? v - 10 : v;
  g.fillStyle = "#f4f6fa"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#e3e7ef"; g.fillRect(0, 0, W, 64);
  for (let i = 0; i < 3; i++) { g.fillStyle = ["#e0806f", "#e8c26a", "#86c48a"][i]; g.beginPath(); g.arc(34 + i * 30, 32, 10, 0, Math.PI * 2); g.fill(); }
  // input box
  const bx = 60, by = H - 150, bw = W - 120, bh = 90;
  g.fillStyle = "#ffffff"; g.strokeStyle = "#b9c1d0"; g.lineWidth = 3;
  g.beginPath(); g.roundRect(bx, by, bw, bh, 22); g.fill(); g.stroke();
  g.font = `34px ${SANS}`; g.textBaseline = "middle";
  if (kind === "empty") {
    if (blink) { g.fillStyle = "#1a1d26"; g.fillRect(bx + 30, by + 24, 4, 42); }
    return;
  }
  const [prompt, reply] = SCREEN_TEXT[kind];
  // v 0..0.4: typing the prompt; 0.4..1: the reply appears line by line
  const typed = prompt.slice(0, Math.floor(prompt.length * Math.min(1, v / 0.4)));
  if (v < 0.42) {
    g.fillStyle = "#1a1d26"; g.fillText(typed, bx + 30, by + bh / 2);
    if (blink) { const w = g.measureText(typed).width; g.fillRect(bx + 34 + w, by + 24, 4, 42); }
    return;
  }
  // user bubble
  g.font = `32px ${SANS}`;
  const pw = Math.min(W - 200, g.measureText(prompt).width + 50);
  g.fillStyle = "#dfe6f5"; g.beginPath(); g.roundRect(W - 60 - pw, 110, pw, 70, 30); g.fill();
  g.fillStyle = "#1a1d26"; g.fillText(prompt, W - 60 - pw + 25, 145);
  const k = (v - 0.42) / 0.58;
  const lines = Math.ceil(reply.length * Math.min(1, k * 1.2));
  g.font = kind === "code" ? `32px ${MONO}` : `36px ${SANS}`;
  for (let i = 0; i < lines; i++) {
    g.fillStyle = kind === "code" && reply[i].startsWith("//") ? "#3f8a4e" : "#1a1d26";
    g.fillText(reply[i], 70, 240 + i * 56);
  }
};

/** Green chalkboard with chalk notes, slightly smudged. */
export const chalkTex = () => {
  const [c, g] = canvas(1024, 512);
  mottle(g, 1024, 512, "#2f4a3c", 500, 71, 0.08, "230,240,230", "10,20,15");
  g.fillStyle = "rgba(240,240,230,0.85)"; g.font = `italic 46px ${SERIF}`;
  g.fillText("Essay due Monday:", 60, 100);
  g.fillText("\"What I learned this year\"", 60, 165);
  g.font = `40px ${SANS}`;
  g.fillText("min. 1,000 words", 60, 240);
  g.fillText("in your OWN words", 60, 300);
  g.strokeStyle = "rgba(240,240,230,0.8)"; g.lineWidth = 4;
  g.beginPath(); g.moveTo(60, 320); g.lineTo(420, 316); g.stroke();
  return tex(c);
};

/** Night window: deep blue sky, a moon, far city lights. */
export const moonWindowTex = () => {
  const [c, g] = canvas(512, 768);
  const gr = g.createLinearGradient(0, 0, 0, 768);
  gr.addColorStop(0, "#0c1638"); gr.addColorStop(1, "#24305e");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 768);
  const r = rng(3);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,${200 + r() * 50},150,${0.4 + r() * 0.5})`; g.fillRect(r() * 512, 560 + r() * 200, 3, 3); }
  const m = g.createRadialGradient(340, 200, 10, 340, 200, 110);
  m.addColorStop(0, "rgba(255,250,230,1)"); m.addColorStop(0.35, "rgba(255,245,215,1)"); m.addColorStop(0.42, "rgba(220,230,255,0.35)"); m.addColorStop(1, "rgba(200,210,255,0)");
  g.fillStyle = m; g.fillRect(200, 60, 280, 280);
  return tex(c);
};

/** Building facade at night (dark concrete); the windows are separate instanced quads. */
export const facadeTex = () => {
  const [c, g] = canvas(256, 256);
  mottle(g, 256, 256, "#232838", 150, 81, 0.08, "120,130,160", "0,0,0");
  return tex(c, [6, 10]);
};

// ---------------------------------------------------------------- the mirror
const MIRROR_WORDS = ["happy birthday, mom", "fix my code", "dear dana, I'm sorry", "are you still there?", "write me a poem",
  "explain it simply", "help me say it", "I'm here", "tell me about your day", "what should I do?", "thank you", "good night"];

/** The mirror's surface. v 0..1 = face appears (0..0.33), the face is made of words (0.33..0.6), words flow out (0.6..1). */
export const mirrorDraw = (g: G, v: number, W: number, H: number) => {
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#2a3a6e"); bg.addColorStop(0.5, "#111a3c"); bg.addColorStop(1, "#1d2a58");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // soft diagonal sheen
  const sh = g.createLinearGradient(0, H * 0.2, W, H * 0.6);
  sh.addColorStop(0.35, "rgba(255,255,255,0)"); sh.addColorStop(0.5, "rgba(220,230,255,0.12)"); sh.addColorStop(0.65, "rgba(255,255,255,0)");
  g.fillStyle = sh; g.fillRect(0, 0, W, H);
  const face = Math.min(1, v / 0.33);
  const wordsIn = Math.max(0, Math.min(1, (v - 0.3) / 0.3));
  const out = Math.max(0, Math.min(1, (v - 0.6) / 0.4));
  // a human profile (facing left), centred: forehead, nose, lips, chin, neck
  const head = () => {
    const s = W / 600, ox = W * 0.5 - 300 * s, oy = H * 0.5 - 420 * s;
    const P = (x: number, y: number): [number, number] => [ox + x * s, oy + y * s];
    g.beginPath();
    g.moveTo(...P(400, 120));
    g.bezierCurveTo(...P(300, 90), ...P(220, 150), ...P(215, 250));
    g.bezierCurveTo(...P(212, 290), ...P(200, 320), ...P(185, 350));   // brow to nose
    g.lineTo(...P(205, 372));
    g.bezierCurveTo(...P(215, 380), ...P(212, 395), ...P(205, 405));    // lips
    g.bezierCurveTo(...P(215, 415), ...P(212, 430), ...P(208, 440));
    g.bezierCurveTo(...P(215, 480), ...P(240, 500), ...P(270, 505));    // chin
    g.lineTo(...P(290, 600));
    g.bezierCurveTo(...P(280, 660), ...P(250, 700), ...P(200, 740));    // neck to shoulder
    g.lineTo(...P(520, 740));
    g.bezierCurveTo(...P(480, 650), ...P(470, 560), ...P(480, 470));
    g.bezierCurveTo(...P(520, 380), ...P(500, 160), ...P(400, 120));
    g.closePath();
  };
  if (face > 0 && out < 1) {
    g.save();
    g.globalAlpha = face * (1 - out);
    head();
    const fg = g.createRadialGradient(W * 0.45, H * 0.4, 20, W * 0.5, H * 0.5, W * 0.6);
    fg.addColorStop(0, "rgba(255,226,160,0.95)"); fg.addColorStop(1, "rgba(220,160,80,0.5)");
    g.fillStyle = fg;
    g.globalAlpha = face * (1 - wordsIn) * (1 - out);
    g.fill();
    g.globalAlpha = face * (1 - out);
    g.lineWidth = 5; g.strokeStyle = "rgba(255,236,190,0.9)"; g.stroke();
    g.restore();
  }
  // words: inside the head while wordsIn grows, then drift outward and upward to fill the glass
  if (wordsIn > 0) {
    const r = rng(404);
    g.textBaseline = "middle";
    for (let i = 0; i < 120; i++) {
      const word = MIRROR_WORDS[i % MIRROR_WORDS.length];
      const fx = W * (0.3 + r() * 0.42), fy = H * (0.2 + r() * 0.56);
      const tx = W * (0.05 + r() * 0.9), ty = H * (0.04 + r() * 0.92);
      const e = out * out * (3 - 2 * out);
      const x = fx + (tx - fx) * e, y = fy + (ty - fy) * e;
      const size = 22 + r() * 18;
      g.font = `italic ${size}px ${SERIF}`;
      const appear = Math.max(0, Math.min(1, wordsIn * 1.6 - (i / 120) * 0.6));
      head();
      const inside = g.isPointInPath(fx, fy);
      g.globalAlpha = appear * (inside ? 1 : out);
      g.fillStyle = i % 5 === 0 ? "#fff6dc" : "#ffd47a";
      g.fillText(word, x - g.measureText(word).width / 2, y);
    }
    g.globalAlpha = 1;
  }
};
