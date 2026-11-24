// Character cards for "The Second Mirror", drawn in the same Canvas2D card language as the Buddha shorts (600 x 1000
// design canvas, soles at y = 975, plum ink outline, one shade tone). Nobody shows a face: Elian is always seen from
// behind, the people of the 2020s from behind or in profile silhouette.
import { INK } from "../buddha/figures";

type G = CanvasRenderingContext2D;
const fillInk = (g: G, fill: string, w = 7) => {
  g.fillStyle = fill; g.fill();
  g.strokeStyle = INK; g.lineWidth = w; g.lineJoin = "round"; g.lineCap = "round"; g.stroke();
};
const line = (g: G, pts: [number, number][], color = INK, w = 4) => {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.strokeStyle = color; g.lineWidth = w; g.lineCap = "round"; g.lineJoin = "round"; g.stroke();
};
const shade = (g: G, x: number, w: number, color = "rgba(20,15,40,0.28)") => { g.save(); g.clip(); g.fillStyle = color; g.fillRect(x, 0, w, 1000); g.restore(); };

/** Elian from behind: long night-blue archivist's coat with a gold hem, silver hair tied low, hands behind the back.
 *  step 0..1 = walk cycle (feet and hem sway); 0 when standing. */
export const drawElianBack = (g: G, step = 0) => {
  const s = Math.sin(step * Math.PI * 2);
  g.beginPath(); g.moveTo(262 + 12 * s, 930); g.lineTo(256 + 12 * s, 975); g.lineTo(300 + 12 * s, 975); g.lineTo(300 + 12 * s, 930); g.closePath(); fillInk(g, "#1a1424", 4);
  g.beginPath(); g.moveTo(314 - 12 * s, 930); g.lineTo(310 - 12 * s, 975); g.lineTo(352 - 12 * s, 975); g.lineTo(350 - 12 * s, 930); g.closePath(); fillInk(g, "#1a1424", 4);
  // coat
  g.beginPath();
  g.moveTo(232, 300);
  g.quadraticCurveTo(196, 560, 186 + 6 * s, 944);
  g.lineTo(414 + 6 * s, 944);
  g.quadraticCurveTo(404, 560, 368, 300);
  g.quadraticCurveTo(300, 278, 232, 300);
  g.closePath();
  fillInk(g, "#22305e");
  shade(g, 318, 140);
  // gold hem and centre vent
  line(g, [[190 + 6 * s, 930], [410 + 6 * s, 930]], "#d6a94a", 10);
  line(g, [[300, 640], [300 + 3 * s, 940]], "#121a3a", 4);
  // collar
  g.beginPath(); g.moveTo(240, 300); g.quadraticCurveTo(300, 330, 360, 300); g.lineTo(352, 262); g.quadraticCurveTo(300, 280, 248, 262); g.closePath(); fillInk(g, "#2c3a70", 5);
  // arms folded behind: forearms crossing at the small of the back
  g.beginPath(); g.moveTo(238, 330); g.quadraticCurveTo(214, 450, 250, 540); g.lineTo(300, 520); g.lineTo(270, 470); g.quadraticCurveTo(262, 400, 272, 330); g.closePath(); fillInk(g, "#2a3870", 5);
  g.beginPath(); g.moveTo(362, 330); g.quadraticCurveTo(386, 450, 350, 540); g.lineTo(300, 520); g.lineTo(330, 470); g.quadraticCurveTo(338, 400, 328, 330); g.closePath(); fillInk(g, "#26336a", 5);
  g.beginPath(); g.ellipse(300, 528, 26, 18, 0, 0, Math.PI * 2); fillInk(g, "#c9a07a", 4);
  // head from behind, silver hair tied low
  g.beginPath(); g.ellipse(300, 214, 50, 58, 0, 0, Math.PI * 2); fillInk(g, "#c9ccd8", 6);
  line(g, [[268, 190], [300, 250]], "rgba(120,125,150,0.6)", 3);
  line(g, [[332, 190], [300, 250]], "rgba(120,125,150,0.6)", 3);
  g.beginPath(); g.ellipse(300, 268, 14, 18, 0, 0, Math.PI * 2); fillInk(g, "#b4b8c8", 4);
  line(g, [[290, 270], [310, 270]], "#d6a94a", 5);
};

/** A child of 2140 from behind, looking up at something: short tunic, hands clasped behind. */
export const drawChildBack = (g: G, tunic: string, hair: string) => {
  g.beginPath(); g.rect(262, 900, 30, 72); fillInk(g, "#3a3346", 4); g.beginPath(); g.rect(308, 900, 30, 72); fillInk(g, "#3a3346", 4);
  g.beginPath(); g.moveTo(236, 560); g.quadraticCurveTo(214, 760, 226, 910); g.lineTo(374, 910); g.quadraticCurveTo(386, 760, 364, 560); g.quadraticCurveTo(300, 540, 236, 560); g.closePath();
  fillInk(g, tunic); shade(g, 312, 70);
  line(g, [[230, 880], [370, 880]], "#d6a94a", 8);
  g.beginPath(); g.ellipse(300, 470, 74, 84, 0, 0, Math.PI * 2); fillInk(g, hair, 6);
};

/** A teacher at the board, side silhouette facing left. pose 0 = arm raised with chalk, 1 = both hands on the head. */
export const drawTeacher = (g: G, pose: number) => {
  const body = "#5a4a5e", hair = "#2b1d1a", skin = "#c99a78";
  // skirt and legs
  g.beginPath(); g.moveTo(250, 600); g.lineTo(220, 900); g.lineTo(380, 900); g.lineTo(350, 600); g.closePath(); fillInk(g, "#3a3346");
  g.beginPath(); g.rect(256, 896, 30, 70); fillInk(g, skin, 4); g.beginPath(); g.rect(316, 896, 30, 70); fillInk(g, skin, 4);
  g.beginPath(); g.moveTo(246, 960); g.lineTo(292, 960); g.lineTo(296, 975); g.lineTo(236, 975); g.closePath(); fillInk(g, "#1a1424", 4);
  g.beginPath(); g.moveTo(306, 960); g.lineTo(352, 960); g.lineTo(356, 975); g.lineTo(296, 975); g.closePath(); fillInk(g, "#1a1424", 4);
  // torso (cardigan)
  g.beginPath(); g.moveTo(250, 330); g.quadraticCurveTo(226, 470, 246, 620); g.lineTo(356, 620); g.quadraticCurveTo(372, 470, 350, 330); g.quadraticCurveTo(300, 310, 250, 330); g.closePath();
  fillInk(g, body); shade(g, 320, 80);
  // head in profile (facing left), hair in a bun
  g.beginPath(); g.ellipse(300, 240, 50, 60, 0, 0, Math.PI * 2); fillInk(g, skin, 6);
  g.beginPath(); g.moveTo(262, 210); g.quadraticCurveTo(300, 168, 352, 206); g.quadraticCurveTo(360, 260, 344, 290); g.quadraticCurveTo(336, 240, 300, 222); g.quadraticCurveTo(276, 214, 262, 210); g.closePath(); fillInk(g, hair, 5);
  g.beginPath(); g.arc(352, 196, 24, 0, Math.PI * 2); fillInk(g, hair, 5);
  // nose bump on the left edge
  g.beginPath(); g.moveTo(252, 238); g.lineTo(240, 256); g.lineTo(252, 262); fillInk(g, skin, 4);
  if (pose < 0.5) {
    // right arm up to the board with chalk, left arm down
    g.beginPath(); g.moveTo(268, 350); g.lineTo(170, 230); g.lineTo(190, 214); g.lineTo(292, 336); g.closePath(); fillInk(g, body, 5);
    g.beginPath(); g.arc(176, 218, 16, 0, Math.PI * 2); fillInk(g, skin, 4);
    g.beginPath(); g.moveTo(330, 350); g.quadraticCurveTo(350, 460, 336, 560); g.lineTo(310, 556); g.quadraticCurveTo(318, 460, 306, 350); g.closePath(); fillInk(g, body, 5);
  } else {
    // both hands on the head, elbows out
    for (const sx of [-1, 1]) {
      g.beginPath(); g.moveTo(300 + sx * 40, 350); g.lineTo(300 + sx * 120, 270); g.lineTo(300 + sx * 46, 190); g.lineTo(300 + sx * 30, 206); g.lineTo(300 + sx * 92, 270); g.lineTo(300 + sx * 22, 336); g.closePath(); fillInk(g, body, 5);
      g.beginPath(); g.arc(300 + sx * 36, 196, 17, 0, Math.PI * 2); fillInk(g, skin, 4);
    }
  }
};

/** Someone at a desk seen from behind, from the waist up (the desk hides the rest): hoodie or shirt, headphones optional.
 *  lean -1..1 tilts the back (laughing back = -1). Canvas rows 300..975 show the torso; the desk is in the world. */
export const drawSeatedBack = (g: G, o: { top: string; hair: string; headphones?: boolean; hood?: boolean; lean?: number }) => {
  const L = (o.lean ?? 0) * 26;
  // chair back
  g.beginPath(); g.roundRect(196, 560, 208, 330, 30); fillInk(g, "#2a2a32", 6);
  // torso
  g.beginPath();
  g.moveTo(214 + L * 0.6, 470); g.quadraticCurveTo(196, 700, 200, 975); g.lineTo(400, 975); g.quadraticCurveTo(404, 700, 386 + L * 0.6, 470); g.quadraticCurveTo(300 + L, 440, 214 + L * 0.6, 470); g.closePath();
  fillInk(g, o.top); shade(g, 320 + L, 110);
  if (o.hood) { g.beginPath(); g.moveTo(240 + L, 470); g.quadraticCurveTo(300 + L, 520, 360 + L, 470); g.quadraticCurveTo(300 + L, 455, 240 + L, 470); g.closePath(); fillInk(g, o.top, 5); }
  // head
  g.beginPath(); g.ellipse(300 + L, 395, 52, 62, L * 0.004, 0, Math.PI * 2); fillInk(g, o.hair, 6);
  if (o.headphones) {
    g.beginPath(); g.arc(300 + L, 392, 62, Math.PI * 1.05, Math.PI * 1.95); g.strokeStyle = "#1a1424"; g.lineWidth = 12; g.stroke();
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(300 + L + sx * 56, 400, 16, 26, 0, 0, Math.PI * 2); fillInk(g, "#3a3a46", 4); }
  }
};
