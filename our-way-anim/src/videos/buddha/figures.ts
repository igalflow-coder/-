// Character cards drawn with Canvas2D: dignified, human proportions (about 7 heads tall), flat colour with a
// plum ink outline and one soft shade tone, like a painted miniature. Design canvas 600 x 1000, soles at y = 975.
import * as THREE from "three";

export const INK = "#241726";
const W = 600, H = 1000;

type G = CanvasRenderingContext2D;

const path = (g: G, pts: [number, number][], close = true) => {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  if (close) g.closePath();
};

const fillInk = (g: G, fill: string, w = 7) => {
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = w;
  g.lineJoin = "round";
  g.lineCap = "round";
  g.stroke();
};

const line = (g: G, pts: [number, number][], color = INK, w = 4) => {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.strokeStyle = color;
  g.lineWidth = w;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.stroke();
};

/** Old sage in profile (facing right), long white beard, saffron robe, holding a swaddled baby whose face is hidden. */
export type SageOpts = { tear?: number; blink?: number };
export const drawSage = (g: G, o: SageOpts = {}) => {
  const skin = "#b9805a", skinShade = "#93603f";
  const robe = "#c9772c", robeShade = "#9a5420", inner = "#efe2c4", beard = "#f3efe6", beardShade = "#d6d0c4";

  // back leg of the robe hem and sandals
  path(g, [[300, 960], [282, 975], [338, 975], [342, 958]]); fillInk(g, "#6b4a2e", 5);
  path(g, [[380, 958], [372, 975], [436, 975], [430, 956]]); fillInk(g, "#6b4a2e", 5);

  // inner cream robe visible at the hem
  g.beginPath();
  g.moveTo(250, 600); g.quadraticCurveTo(240, 800, 230, 962); g.lineTo(450, 962); g.quadraticCurveTo(430, 800, 405, 600); g.closePath();
  fillInk(g, inner);

  // saffron outer robe, draped over the left shoulder, slight forward lean
  g.beginPath();
  g.moveTo(262, 312);
  g.quadraticCurveTo(210, 420, 214, 600);
  g.quadraticCurveTo(212, 780, 236, 930);
  g.lineTo(420, 940);
  g.quadraticCurveTo(436, 760, 410, 560);
  g.quadraticCurveTo(398, 420, 372, 318);
  g.quadraticCurveTo(320, 296, 262, 312);
  g.closePath();
  fillInk(g, robe);
  // form shade on the back side of the robe
  g.save(); g.clip();
  g.fillStyle = robeShade;
  g.globalAlpha = 0.55;
  g.beginPath(); g.moveTo(200, 300); g.quadraticCurveTo(250, 600, 250, 950); g.lineTo(190, 950); g.closePath(); g.fill();
  g.globalAlpha = 1;
  g.restore();
  // drape folds
  line(g, [[300, 330], [270, 520], [262, 760], [270, 920]], robeShade, 5);
  line(g, [[340, 340], [330, 560], [344, 800], [352, 930]], robeShade, 4);
  line(g, [[262, 312], [330, 470], [410, 560]], INK, 5);

  // head: bald crown, white hair at the back, brown skin, profile to the right
  g.beginPath();
  g.moveTo(292, 290);
  g.quadraticCurveTo(268, 230, 286, 176);
  g.quadraticCurveTo(312, 132, 360, 146);
  g.quadraticCurveTo(392, 160, 396, 196);   // forehead
  g.quadraticCurveTo(394, 210, 404, 226);   // brow to nose bridge
  g.lineTo(412, 244);                        // nose tip
  g.quadraticCurveTo(404, 252, 398, 254);
  g.lineTo(396, 266);
  g.quadraticCurveTo(372, 300, 330, 300);
  g.closePath();
  fillInk(g, skin);
  // ear
  g.beginPath(); g.ellipse(322, 222, 12, 18, 0.2, 0, Math.PI * 2); fillInk(g, skinShade, 4);
  // white hair ring at the back of the head
  g.beginPath();
  g.moveTo(296, 160); g.quadraticCurveTo(268, 200, 282, 262); g.quadraticCurveTo(296, 250, 300, 220); g.quadraticCurveTo(298, 190, 312, 164); g.closePath();
  fillInk(g, beard, 4);
  // brow and eye: closed, sad slant
  line(g, [[362, 196], [386, 204]], beard, 7);
  line(g, [[366, 214], [384, 220]], INK, 4);
  // tear
  const tear = o.tear ?? 1;
  if (tear > 0) {
    g.globalAlpha = Math.min(1, tear);
    g.beginPath();
    const ty = 226 + 22 * Math.min(1, tear);
    g.moveTo(382, ty - 10); g.quadraticCurveTo(390, ty, 382, ty + 6); g.quadraticCurveTo(374, ty, 382, ty - 10);
    g.fillStyle = "#cfe9ff"; g.fill(); g.strokeStyle = "#4a6f9a"; g.lineWidth = 2; g.stroke();
    g.globalAlpha = 1;
  }

  // long white beard flowing over the chest
  g.beginPath();
  g.moveTo(338, 258);
  g.quadraticCurveTo(372, 262, 398, 258);
  g.quadraticCurveTo(410, 330, 392, 400);
  g.quadraticCurveTo(378, 450, 360, 488);
  g.quadraticCurveTo(346, 430, 330, 380);
  g.quadraticCurveTo(318, 320, 338, 258);
  g.closePath();
  fillInk(g, beard, 5);
  line(g, [[360, 280], [366, 380], [358, 460]], beardShade, 4);
  line(g, [[384, 280], [384, 360]], beardShade, 3);
  // moustache
  line(g, [[386, 258], [400, 266]], beardShade, 5);

  // the baby: swaddled bundle held in front of the chest, face hidden in the cloth
  g.save();
  g.translate(430, 440);
  g.rotate(-0.28);
  g.beginPath(); g.ellipse(0, 0, 96, 50, 0, 0, Math.PI * 2); fillInk(g, "#fbf7ee", 6);
  line(g, [[-70, -20], [-20, 10], [40, 30]], "#d9d1c0", 4);
  line(g, [[-40, -40], [10, -10], [70, 0]], "#d9d1c0", 4);
  // fold of cloth covering the head end
  g.beginPath(); g.ellipse(70, -6, 34, 34, 0, 0, Math.PI * 2); fillInk(g, "#f4ecdb", 5);
  line(g, [[52, -22], [76, 0], [62, 24]], "#d9d1c0", 3);
  g.restore();

  // near arm: saffron sleeve from the shoulder, forearm cradling under the bundle
  g.beginPath();
  g.moveTo(330, 330);
  g.quadraticCurveTo(372, 380, 380, 450);
  g.quadraticCurveTo(388, 500, 440, 500);
  g.lineTo(500, 486);
  g.lineTo(492, 458);
  g.lineTo(440, 466);
  g.quadraticCurveTo(414, 466, 410, 430);
  g.quadraticCurveTo(398, 360, 362, 318);
  g.closePath();
  fillInk(g, robe, 6);
  // hand under the bundle
  g.beginPath(); g.ellipse(506, 470, 22, 15, -0.3, 0, Math.PI * 2); fillInk(g, skin, 5);
  // far hand resting on top of the bundle
  g.beginPath(); g.ellipse(420, 402, 20, 13, -0.6, 0, Math.PI * 2); fillInk(g, skin, 5);
};

/** Queen Maya's arm reaching up to hold a flowering sal branch (close-up card, branch painted in). */
export const drawHandBranch = (g: G) => {
  // branch from the top left to the right, with leaves and blossoms
  line(g, [[0, 250], [180, 230], [330, 260], [600, 210]], "#5a3b26", 22);
  line(g, [[0, 250], [180, 230], [330, 260], [600, 210]], INK, 4);
  line(g, [[330, 260], [420, 150], [470, 60]], "#5a3b26", 12);
  const leaf = (x: number, y: number, r: number, s = 1) => {
    g.save(); g.translate(x, y); g.rotate(r);
    g.beginPath(); g.ellipse(0, 0, 46 * s, 17 * s, 0, 0, Math.PI * 2); fillInk(g, "#5f8f42", 4);
    line(g, [[-38 * s, 0], [38 * s, 0]], "#3e6a2c", 3); g.restore();
  };
  const bloom = (x: number, y: number) => {
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; g.beginPath(); g.ellipse(x + Math.cos(a) * 12, y + Math.sin(a) * 12, 11, 7, a, 0, Math.PI * 2); fillInk(g, "#f7ead2", 3); }
    g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fillStyle = "#e3b23c"; g.fill();
  };
  leaf(90, 200, -0.4); leaf(130, 280, 0.5); leaf(250, 210, -0.2); leaf(270, 300, 0.7); leaf(420, 190, -0.9); leaf(470, 260, 0.3); leaf(560, 170, -0.3); leaf(440, 100, -1.2, 0.8);
  bloom(60, 240); bloom(205, 205); bloom(360, 230); bloom(500, 215); bloom(455, 70); bloom(560, 240); bloom(300, 300);
  // arm in a red silk sleeve with a gold border, rising from the bottom
  g.beginPath();
  g.moveTo(170, 1000); g.quadraticCurveTo(200, 700, 300, 420); g.lineTo(360, 440); g.quadraticCurveTo(300, 700, 300, 1000); g.closePath();
  fillInk(g, "#b8323a");
  line(g, [[300, 430], [262, 560], [236, 700]], "#e3b23c", 10);
  // forearm and hand
  g.beginPath();
  g.moveTo(300, 422); g.quadraticCurveTo(322, 330, 340, 290); g.lineTo(372, 296); g.quadraticCurveTo(362, 360, 358, 440); g.closePath();
  fillInk(g, "#c98d62");
  for (const y of [400, 418]) line(g, [[302, y], [358, y + 6]], "#e3b23c", 8);
  // fingers curled around the branch
  g.beginPath(); g.moveTo(336, 296); g.quadraticCurveTo(326, 250, 352, 238); g.quadraticCurveTo(388, 236, 392, 262); g.quadraticCurveTo(388, 292, 372, 298); g.closePath();
  fillInk(g, "#c98d62", 6);
  line(g, [[348, 252], [384, 258]], "#93603f", 3);
};

/** An elder of the Shakya council seen from behind: turban, shawl, long robe. */
export const drawElderBack = (g: G, robe: string, turban: string) => {
  g.beginPath(); g.moveTo(230, 300); g.quadraticCurveTo(190, 600, 200, 962); g.lineTo(400, 962); g.quadraticCurveTo(410, 600, 370, 300); g.quadraticCurveTo(300, 280, 230, 300); g.closePath();
  fillInk(g, robe);
  g.save(); g.clip(); g.fillStyle = "rgba(60,30,40,0.25)"; g.fillRect(320, 280, 120, 700); g.restore();
  // shawl over the shoulders
  g.beginPath(); g.moveTo(210, 340); g.quadraticCurveTo(300, 300, 390, 340); g.lineTo(380, 470); g.quadraticCurveTo(300, 500, 220, 470); g.closePath(); fillInk(g, "#efe2c4", 6);
  line(g, [[300, 320], [300, 960]], "rgba(36,23,38,0.35)", 3);
  // neck and head with turban
  g.beginPath(); g.ellipse(300, 250, 42, 52, 0, 0, Math.PI * 2); fillInk(g, "#a8724e", 6);
  g.beginPath(); g.ellipse(300, 214, 58, 44, 0, 0, Math.PI * 2); fillInk(g, turban, 6);
  line(g, [[248, 220], [352, 196]], "rgba(36,23,38,0.4)", 4);
  line(g, [[250, 238], [350, 214]], "rgba(36,23,38,0.4)", 4);
  path(g, [[250, 962], [246, 975], [296, 975], [292, 960]]); fillInk(g, "#6b4a2e", 4);
  path(g, [[312, 960], [308, 975], [356, 975], [352, 960]]); fillInk(g, "#6b4a2e", 4);
};

/** The king (the boy's father) seen from behind: tall gold crown, red cape with a gold border. */
export const drawKingBack = (g: G) => {
  g.beginPath(); g.moveTo(200, 330); g.quadraticCurveTo(140, 640, 150, 962); g.lineTo(450, 962); g.quadraticCurveTo(460, 640, 400, 330); g.quadraticCurveTo(300, 300, 200, 330); g.closePath();
  fillInk(g, "#8e2430");
  g.save(); g.clip(); g.fillStyle = "rgba(40,10,30,0.3)"; g.fillRect(320, 300, 160, 700); g.restore();
  line(g, [[158, 940], [442, 940]], "#e3b23c", 16);
  line(g, [[205, 340], [170, 940]], "#e3b23c", 10);
  line(g, [[395, 340], [430, 940]], "#e3b23c", 10);
  // shoulders and head with dark hair
  g.beginPath(); g.ellipse(300, 246, 50, 58, 0, 0, Math.PI * 2); fillInk(g, "#2b1d1a", 6);
  // crown
  path(g, [[246, 210], [250, 120], [270, 160], [286, 100], [300, 150], [314, 100], [330, 160], [350, 120], [354, 210]]); fillInk(g, "#e3b23c", 6);
  g.beginPath(); g.arc(300, 178, 9, 0, Math.PI * 2); g.fillStyle = "#c0353a"; g.fill();
  line(g, [[246, 206], [354, 206]], "#b8861f", 6);
};

/** A man walking away from us on a road: simple cream robe, dark hair in a knot, a staff. phase 0..1 = walk cycle. */
export const drawWandererBack = (g: G, phase: number) => {
  const s = Math.sin(phase * Math.PI * 2);
  // legs (only the feet show under the robe)
  path(g, [[262 + 10 * s, 940], [258 + 10 * s, 975], [300 + 10 * s, 975], [300 + 10 * s, 940]]); fillInk(g, "#9c6a48", 4);
  path(g, [[312 - 10 * s, 940], [308 - 10 * s, 975], [350 - 10 * s, 975], [350 - 10 * s, 940]]); fillInk(g, "#9c6a48", 4);
  // staff in the right hand
  line(g, [[400, 260], [418 + 6 * s, 975]], "#6b4a2e", 10);
  line(g, [[400, 260], [418 + 6 * s, 975]], INK, 3);
  g.beginPath(); g.moveTo(240, 320); g.quadraticCurveTo(210, 620, 230, 948); g.lineTo(380, 948); g.quadraticCurveTo(396, 620, 362, 320); g.quadraticCurveTo(300, 300, 240, 320); g.closePath();
  fillInk(g, "#efe2c4");
  g.save(); g.clip(); g.fillStyle = "rgba(120,80,60,0.25)"; g.fillRect(300, 300, 120, 700); g.restore();
  line(g, [[250, 340], [330, 620], [372, 940]], "#d8c49c", 5);
  g.beginPath(); g.ellipse(398, 470, 18, 22, 0, 0, Math.PI * 2); fillInk(g, "#9c6a48", 5);
  g.beginPath(); g.ellipse(300, 256, 44, 52, 0, 0, Math.PI * 2); fillInk(g, "#2b1d1a", 6);
  g.beginPath(); g.arc(300, 196, 20, 0, Math.PI * 2); fillInk(g, "#2b1d1a", 5);
};

/** Make a camera-facing card texture from a drawing function. */
export const cardTexture = (draw: (g: G) => void) => {
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};

/** A character card: plane of the given height (m) with its soles at y = 0, lit by the scene, casting a cut-out shadow. */
export const makeCard = (map: THREE.Texture, height: number) => {
  const w = (height * W) / H;
  const geo = new THREE.PlaneGeometry(w, height);
  geo.translate(0, height / 2 - (height * 25) / H, 0);
  const mat = new THREE.MeshBasicMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide, color: "#fff4e4" });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.5 });
  return mesh;
};
