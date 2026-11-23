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
