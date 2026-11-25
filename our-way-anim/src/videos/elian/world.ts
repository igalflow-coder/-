// The worlds of "The Second Mirror", one set per place, far apart in one scene; only the current shot's set is visible.
// 2140: the letter on Elian's desk, the bright archive hall with the mirror. The 2020s: the calendar wall, the dark
// room with the empty chat box, the city of lit windows, a row of screens, the classroom, the programmer's desk.
import * as THREE from "three";
import { NOINK } from "../buddha/ink";
import { cardTexture, makeCard } from "../buddha/figures";
import { blobTex } from "../buddha/paint";
import {
  DynTex, stoneTex, shelfTex, windowTex, paperTex, envelopeFrontTex, keyboardTex, keyboardDraw, LETTER, letterTex, sealTex, deskTex, wallTex, calendarDraw, screenDraw,
  chalkTex, moonWindowTex, facadeTex, mirrorDraw, rng, ScreenKind,
} from "./paint";
import { drawElianBack, drawTeacher, drawSeatedBack, drawChildBack, drawChildHands, drawHandTop } from "./figures";

export type SetName = "desk" | "hall" | "cal" | "room" | "city" | "row" | "class" | "typing";
export const ORIGIN: Record<SetName, THREE.Vector3> = {
  desk: new THREE.Vector3(0, 0, 0),
  hall: new THREE.Vector3(400, 0, 0),
  cal: new THREE.Vector3(800, 0, 0),
  room: new THREE.Vector3(1200, 0, 0),
  city: new THREE.Vector3(1600, 0, 0),
  row: new THREE.Vector3(2000, 0, 0),
  class: new THREE.Vector3(2400, 0, 0),
  typing: new THREE.Vector3(2800, 0, 0),
};

export type LookName = "desk" | "hall" | "day" | "night" | "city" | "office";
type Look = { top: string; hor: string; sun: string; sunI: number; sunDir: [number, number, number]; hemiS: string; hemiG: string; hemiI: number; fog: [number, number] };
const LOOKS: Record<LookName, Look> = {
  desk: { top: "#070b1e", hor: "#121a38", sun: "#9fb2ff", sunI: 0.5, sunDir: [-4, 10, 6], hemiS: "#3a4a8a", hemiG: "#0c0a14", hemiI: 0.7, fog: [8, 40] },
  hall: { top: "#f2e2c0", hor: "#f6e3bf", sun: "#ffcf86", sunI: 3.2, sunDir: [-26, 22, -8], hemiS: "#fff1d8", hemiG: "#7f8cc0", hemiI: 1.5, fog: [14, 120] },
  day: { top: "#cfc6b4", hor: "#ddd3c0", sun: "#ffe8c4", sunI: 2.0, sunDir: [-8, 8, 10], hemiS: "#f4ead8", hemiG: "#6a6258", hemiI: 1.3, fog: [20, 80] },
  night: { top: "#060a1c", hor: "#101834", sun: "#8ea2ff", sunI: 0.35, sunDir: [10, 12, 4], hemiS: "#25305e", hemiG: "#08060e", hemiI: 0.4, fog: [12, 60] },
  city: { top: "#050918", hor: "#1a2350", sun: "#8ea2ff", sunI: 0.25, sunDir: [10, 20, 10], hemiS: "#2a3468", hemiG: "#05040a", hemiI: 0.5, fog: [80, 420] },
  office: { top: "#3a3c48", hor: "#585a66", sun: "#dfe6ff", sunI: 0.9, sunDir: [6, 10, 8], hemiS: "#b8c0d8", hemiG: "#2a2830", hemiI: 0.9, fog: [10, 60] },
};

const toonRamp = (() => {
  let t: THREE.DataTexture | null = null;
  return () => {
    if (t) return t;
    const d = new Uint8Array([105, 105, 105, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
    t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
    t.minFilter = t.magFilter = THREE.NearestFilter;
    t.needsUpdate = true;
    return t;
  };
})();
const toon = (color: THREE.ColorRepresentation, map?: THREE.Texture) => new THREE.MeshToonMaterial({ color, map: map ?? null, gradientMap: toonRamp() });
/** Unlit HDR material (values > 1 bloom). */
const glow = (r: number, g: number, b: number, map?: THREE.Texture, transparent = false) => {
  const m = new THREE.MeshBasicMaterial({ toneMapped: false, map: map ?? null, transparent, depthWrite: !transparent });
  m.color.setRGB(r, g, b);
  return m;
};
const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
};
const radialTex = (inner: string, outer: string) => {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(128, 128, 4, 128, 128, 126);
  gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
};
const softPlane = (w: number, h: number, map: THREE.Texture, color: THREE.ColorRepresentation, opacity = 1) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({
    map, color, transparent: true, opacity, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending,
  }));
  m.layers.set(NOINK);
  return m;
};
const noInk = <T extends THREE.Object3D>(o: T) => { o.traverse((c) => c.layers.set(NOINK)); return o; };

/** A camera-facing character card plus its soft contact shadow. */
class Actor {
  card: THREE.Mesh; blob: THREE.Mesh;
  constructor(tex: THREE.Texture, height: number, parent: THREE.Object3D, x: number, z: number, y = 0, shadow = true) {
    this.card = makeCard(tex, height);
    this.card.layers.set(NOINK);
    this.card.position.set(x, y, z);
    parent.add(this.card);
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(height * 0.7, height * 0.38), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false }));
    this.blob.rotation.x = -Math.PI / 2;
    this.blob.position.set(x, 0.012, z);
    this.blob.layers.set(NOINK);
    this.blob.visible = shadow;
    parent.add(this.blob);
  }
  face(cam: THREE.Camera) {
    const p = new THREE.Vector3();
    this.card.getWorldPosition(p);
    this.card.rotation.y = Math.atan2(cam.position.x - p.x, cam.position.z - p.z);
  }
}

const setMap = (m: THREE.Mesh, t: THREE.Texture) => {
  const mat = m.material as THREE.MeshBasicMaterial;
  if (mat.map !== t) { mat.map = t; mat.needsUpdate = true; (m.customDepthMaterial as THREE.MeshDepthMaterial).map = t; }
};

/** A desk monitor whose screen is a DynTex; returns the screen texture. */
const monitor = (parent: THREE.Object3D, x: number, y: number, z: number, kind: ScreenKind, w = 1.05, h = 0.66) => {
  const dark = toon("#1e1f26");
  parent.add(mesh(new THREE.BoxGeometry(w + 0.06, h + 0.06, 0.05), dark, x, y, z));
  parent.add(mesh(new THREE.BoxGeometry(0.08, y - 0.78, 0.06), dark, x, (y + 0.78) / 2 - 0.02, z - 0.04));
  parent.add(mesh(new THREE.BoxGeometry(0.36, 0.02, 0.22), dark, x, 0.79, z - 0.02));
  const dt = new DynTex(1024, 640, screenDraw(kind));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glow(0.82, 0.84, 0.9, dt.t));
  scr.position.set(x, y, z + 0.03);
  scr.layers.set(NOINK);
  parent.add(scr);
  dt.mesh = scr;
  return dt;
};
const desk = (parent: THREE.Object3D, x: number, z: number, w = 1.8, d = 0.8, wood = "#7a5a3e") => {
  const m = toon(wood);
  parent.add(mesh(new THREE.BoxGeometry(w, 0.05, d), m, x, 0.76, z));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) parent.add(mesh(new THREE.BoxGeometry(0.05, 0.74, 0.05), m, x + sx * (w / 2 - 0.06), 0.37, z + sz * (d / 2 - 0.06)));
};

export class World {
  root = new THREE.Group();
  sets = {} as Record<SetName, THREE.Group>;
  sun: THREE.DirectionalLight; hemi: THREE.HemisphereLight;
  skyMat: THREE.ShaderMaterial; sky: THREE.Mesh;
  actors: Actor[] = [];

  // desk
  flap!: THREE.Group; seal!: THREE.Mesh; letter!: THREE.Mesh; envGlow!: THREE.Mesh; envLight!: THREE.PointLight;
  // hall
  elian!: Actor; elianTex: THREE.Texture[] = []; kids: Actor[] = []; kidTex: THREE.Texture[][] = []; museumHalo!: THREE.Mesh;
  keys!: DynTex; hands: THREE.Mesh[] = []; mirror!: DynTex; mirrorGlass!: THREE.Mesh; mirrorHalo!: THREE.Mesh;
  // present
  calendar!: DynTex; roomScreen!: DynTex; nightScreen!: DynTex; rowScreens: DynTex[] = []; codeScreen!: DynTex;
  lonely!: Actor; teacher!: Actor; teacherTex: THREE.Texture[] = []; coder!: Actor; coderTex: THREE.Texture[] = [];
  windows!: THREE.InstancedMesh; winThr: number[] = []; winLit = -1;

  constructor() {
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() } },
      vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 top; uniform vec3 hor; varying vec3 vP;
        void main(){ float h = clamp(vP.y * 1.6, 0.0, 1.0); vec3 c = mix(hor, top, pow(h, 0.7)); gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
        }`,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), this.skyMat);
    this.sky.layers.set(NOINK);
    this.root.add(this.sky);
    this.sun = new THREE.DirectionalLight("#ffffff", 1);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera as THREE.OrthographicCamera;
    sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -24; sc.near = 1; sc.far = 120;
    this.sun.shadow.bias = -0.0005;
    this.root.add(this.sun, this.sun.target);
    this.hemi = new THREE.HemisphereLight("#ffffff", "#000000", 1);
    this.root.add(this.hemi);
    for (const k of Object.keys(ORIGIN) as SetName[]) {
      const g = new THREE.Group();
      g.position.copy(ORIGIN[k]);
      g.visible = false;
      this.sets[k] = g;
      this.root.add(g);
    }
    this.buildDesk(); this.buildHall(); this.buildCal(); this.buildRoom(); this.buildCity(); this.buildRow(); this.buildClass(); this.buildTyping();
  }

  private buildDesk() {
    const R = this.sets.desk;
    const top = mesh(new THREE.PlaneGeometry(14, 10), toon("#ffffff", deskTex()));
    top.rotation.x = -Math.PI / 2; top.castShadow = false; R.add(top);
    // the envelope stands on the desk, leaning back a little, its face to the camera: built lying flat in its own
    // group (flap hinged on the far edge), then stood up, so the flap opens upward and the letter slides out of the top
    const env = new THREE.Group();
    env.position.set(0, 0.5, 0); env.rotation.x = Math.PI / 2 - 0.26; env.scale.setScalar(0.62);
    R.add(env);
    const paper = toon("#ffffff", paperTex()), front = toon("#ffffff", envelopeFrontTex());
    env.add(mesh(new THREE.BoxGeometry(2.4, 0.04, 1.6), [paper, paper, front, paper, paper, paper], 0, 0.02, 0));
    // the letter, inside the envelope, slides out of the top edge into the light
    this.letter = mesh(new THREE.PlaneGeometry(2.1, 1.5), toon("#ffffff", letterTex()));
    this.letter.material = new THREE.MeshToonMaterial({ map: (this.letter.material as THREE.MeshToonMaterial).map, gradientMap: toonRamp(), side: THREE.DoubleSide });
    this.letter.rotation.x = -Math.PI / 2;
    env.add(this.letter);
    // the flap, hinged on the back edge; closed it points to the camera
    this.flap = new THREE.Group();
    this.flap.position.set(0, 0.045, -0.8);
    const sh = new THREE.Shape();
    sh.moveTo(-1.2, 0); sh.lineTo(1.2, 0); sh.lineTo(0.08, 1.12); sh.quadraticCurveTo(0, 1.17, -0.08, 1.12); sh.closePath();
    const fg = new THREE.ShapeGeometry(sh);
    fg.rotateX(Math.PI / 2);
    const uv = fg.attributes.uv as THREE.BufferAttribute, pos = fg.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + 1.2) / 2.4, pos.getZ(i) / 1.6);
    const flapMat = new THREE.MeshToonMaterial({ map: paperTex("#e9dcc0", 23), gradientMap: toonRamp(), side: THREE.DoubleSide });
    const flapMesh = mesh(fg, flapMat);
    this.flap.add(flapMesh);
    const sealM = new THREE.MeshToonMaterial({ map: sealTex(), gradientMap: toonRamp() });
    const sealSide = toon("#a8761e");
    this.seal = mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.06, 40), [sealSide, sealM, sealSide], 0, 0.03, 0.9);
    this.seal.rotation.y = Math.PI / 2; // read "2140" upright from the camera side
    this.flap.add(this.seal);
    env.add(this.flap);
    this.envGlow = softPlane(4, 4, radialTex("rgba(255,214,140,1)", "rgba(255,170,80,0)"), "#ffffff", 0);
    this.envGlow.position.set(0, 1.05, -0.35);
    R.add(this.envGlow);
    this.envLight = new THREE.PointLight("#ffc874", 0, 8, 2);
    this.envLight.position.set(0, 1.25, -0.45);
    R.add(this.envLight);
    // a quill and an ink pot at the edge of the light
    R.add(mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.36, 20), toon("#151a34"), 2.1, 0.18, -0.9));
    const quill = mesh(new THREE.ConeGeometry(0.05, 1.5, 6), toon("#efe6d6"), 1.4, 0.06, 0.9);
    quill.rotation.set(Math.PI / 2, 0, 1.1); R.add(quill);
  }

  private buildHall() {
    const R = this.sets.hall;
    const floor = mesh(new THREE.PlaneGeometry(60, 260), toon("#ffffff", stoneTex()));
    floor.rotation.x = -Math.PI / 2; floor.position.z = -100; floor.castShadow = false; R.add(floor);
    const shelf = toon("#ffffff", shelfTex()), navy = toon("#1c2650"), gold = toon("#d6a94a"), wall = toon("#efe2c8");
    for (const sx of [-1, 1]) {
      for (let z = 10; z > -200; z -= 7.4) {
        R.add(mesh(new THREE.BoxGeometry(1.4, 9, 6.2), shelf, sx * 5.4, 4.5, z));
        R.add(mesh(new THREE.BoxGeometry(1.6, 0.35, 6.4), gold, sx * 5.4, 9.15, z));
        R.add(mesh(new THREE.BoxGeometry(0.5, 10.5, 0.5), navy, sx * 4.8, 5.25, z + 3.45));
      }
      R.add(mesh(new THREE.BoxGeometry(1, 30, 260), wall, sx * 13, 15, -100));
      const wt = windowTex();
      for (let z = 6; z > -200; z -= 14.8) {
        const w = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 13.2), glow(2.4, 2.0, 1.45, wt, true));
        w.position.set(sx * 12.45, 14, z); w.rotation.y = -sx * Math.PI / 2; w.layers.set(NOINK); R.add(w);
      }
    }
    // shafts of window light falling across the aisle from the left
    const shaftT = radialTex("rgba(255,214,150,0.5)", "rgba(255,200,130,0)");
    for (let z = 6; z > -120; z -= 14.8) {
      const p = softPlane(5, 34, shaftT, "#ffffff", 0.38);
      p.position.set(-2, 8, z - 3); p.rotation.set(0, 0.25, 0.75); R.add(p);
    }
    // the mirror: a tall gold oval on a stand, its glass a DynTex
    const M = new THREE.Group();
    M.position.set(0, 0, -12);
    const ring = mesh(new THREE.TorusGeometry(1, 0.07, 14, 80), gold, 0, 1.85, 0);
    ring.scale.set(0.9, 1.42, 1); M.add(ring);
    this.mirror = new DynTex(640, 1024, mirrorDraw, 1 / 240);
    this.mirrorGlass = new THREE.Mesh(new THREE.CircleGeometry(1, 80), glow(1.15, 1.15, 1.2, this.mirror.t));
    this.mirrorGlass.scale.set(0.88, 1.4, 1); this.mirrorGlass.position.set(0, 1.85, 0.01); this.mirrorGlass.layers.set(NOINK); M.add(this.mirrorGlass);
    for (const sx of [-1, 1]) { const leg = mesh(new THREE.BoxGeometry(0.08, 1.2, 0.08), gold, sx * 0.62, 0.3, -0.25); leg.rotation.x = 0.25; M.add(leg); }
    M.add(mesh(new THREE.BoxGeometry(1.6, 0.06, 0.6), navy, 0, 0.03, -0.1));
    this.mirrorHalo = softPlane(4.5, 6, radialTex("rgba(255,214,140,0.8)", "rgba(255,190,110,0)"), "#ffffff", 0);
    this.mirrorHalo.position.set(0, 1.9, -0.3); M.add(this.mirrorHalo);
    R.add(M);
    // the museum, further down the aisle: an old keyboard in a glass case on a navy pedestal, two children looking
    const K = new THREE.Group();
    K.position.set(0, 0, -30);
    K.add(mesh(new THREE.BoxGeometry(1.3, 1.0, 0.8), navy, 0, 0.5, 0));
    K.add(mesh(new THREE.BoxGeometry(1.42, 0.06, 0.92), gold, 0, 1.03, 0));
    const kb = mesh(new THREE.BoxGeometry(0.95, 0.05, 0.34), [toon("#bdb39c"), toon("#bdb39c"), toon("#ffffff", keyboardTex()), toon("#bdb39c"), toon("#bdb39c"), toon("#bdb39c")], 0, 1.12, 0.02);
    kb.rotation.x = 0.22; K.add(kb);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.7), new THREE.MeshBasicMaterial({ color: "#cfe0ff", transparent: true, opacity: 0.1, depthWrite: false }));
    glass.position.set(0, 1.41, 0); glass.layers.set(NOINK); K.add(glass);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.add(mesh(new THREE.BoxGeometry(0.03, 0.7, 0.03), gold, sx * 0.6, 1.41, sz * 0.35));
    K.add(mesh(new THREE.BoxGeometry(1.24, 0.03, 0.74), gold, 0, 1.77, 0));
    const kh = softPlane(2.2, 2.2, radialTex("rgba(255,214,150,0.7)", "rgba(255,190,110,0)"), "#ffffff", 0.5);
    kh.position.set(0, 1.4, -0.5); K.add(kh); this.museumHalo = kh;
    R.add(K);
    const kidLook: [string, string][] = [["#7a4a8a", "#2b1d1a"], ["#2f6b6a", "#8a6a3a"]];
    this.kidTex = kidLook.map(([t, h]) => [cardTexture((g) => drawChildBack(g, t, h)), cardTexture((g) => drawChildHands(g, t, h))]);
    this.kids = [
      new Actor(this.kidTex[0][0], 1.15, R, -0.55, -28.7),
      new Actor(this.kidTex[1][0], 1.05, R, 0.5, -28.85),
    ];
    this.actors.push(...this.kids);
    this.elianTex = [0, 0.25, 0.5, 0.75].map((p) => cardTexture((g) => drawElianBack(g, p)));
    this.elian = new Actor(this.elianTex[0], 1.8, R, 0, -10.5);
    this.actors.push(this.elian);
  }

  private buildCal() {
    const R = this.sets.cal;
    R.add(mesh(new THREE.BoxGeometry(14, 7, 0.2), toon("#ffffff", wallTex("#d8cdb6")), 0, 3.5, -1.1));
    R.add(mesh(new THREE.BoxGeometry(14, 0.2, 8), toon("#6b5a48"), 0, -0.1, 2));
    this.calendar = new DynTex(768, 1024, calendarDraw, 1 / 200);
    const p = mesh(new THREE.PlaneGeometry(1.2, 1.6), new THREE.MeshToonMaterial({ map: this.calendar.t, gradientMap: toonRamp() }), 0, 1.75, -0.99);
    R.add(p);
    R.add(mesh(new THREE.SphereGeometry(0.025, 8, 6), toon("#5a5048"), 0, 2.6, -0.98));
    // edge of a window frame and a light switch for scale
    R.add(mesh(new THREE.BoxGeometry(0.12, 2.4, 0.12), toon("#e8e0d0"), -1.6, 1.8, -0.95));
    R.add(mesh(new THREE.BoxGeometry(0.1, 0.16, 0.03), toon("#efe9de"), 1.0, 1.2, -0.99));
  }

  private buildRoom() {
    const R = this.sets.room;
    const wall = toon("#ffffff", wallTex("#3e4258"));
    R.add(mesh(new THREE.BoxGeometry(10, 0.2, 10), toon("#2a2630"), 0, -0.1, 0));
    R.add(mesh(new THREE.BoxGeometry(10, 5, 0.2), wall, 0, 2.5, -3));
    R.add(mesh(new THREE.BoxGeometry(0.2, 5, 10), wall, -3, 2.5, 0));
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.7), glow(1.1, 1.1, 1.2, moonWindowTex()));
    win.position.set(1.7, 1.9, -2.89); win.layers.set(NOINK); R.add(win);
    for (const dx of [-0.6, 0, 0.6]) R.add(mesh(new THREE.BoxGeometry(0.05, 1.75, 0.06), toon("#15151e"), 1.7 + dx, 1.9, -2.86));
    desk(R, 0, -2.2, 2.0, 0.9, "#4a3a2e");
    this.roomScreen = monitor(R, 0, 1.18, -2.45, "empty");
    this.nightScreen = new DynTex(1024, 640, screenDraw(LETTER.no === 3 ? "first" : "night"));
    R.add(mesh(new THREE.BoxGeometry(0.6, 0.02, 0.2), toon("#2a2a32"), 0, 0.8, -2.0));
    R.add(mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.11, 14), toon("#c9b8a0"), 0.6, 0.84, -2.0));
    const L = new THREE.PointLight("#aac0ff", 2.4, 4, 2);
    L.position.set(0, 1.2, -1.9); R.add(L);
    this.lonely = new Actor(cardTexture((g) => drawSeatedBack(g, { top: "#3a4a6a", hair: "#2b1d1a", hood: true })), 1.5, R, -0.05, -1.45, 0.25, false);
    this.actors.push(this.lonely);
  }

  private buildCity() {
    const R = this.sets.city;
    const ground = mesh(new THREE.PlaneGeometry(900, 900), toon("#0c0e18"));
    ground.rotation.x = -Math.PI / 2; ground.castShadow = false; R.add(ground);
    const fac = toon("#ffffff", facadeTex());
    const r = rng(1234);
    const winGeo = new THREE.PlaneGeometry(0.9, 1.1);
    const wins: [number, number, number][] = [];
    for (let gz = 0; gz < 12; gz++) {
      for (let gx = -6; gx <= 6; gx++) {
        const x = gx * 16 + (gz % 2) * 8, z = -gz * 22 - 4;
        if (gz === 0 && gx !== 0 && Math.abs(gx) < 2) continue;
        const w = 9 + r() * 4, h = gz === 0 && gx === 0 ? 16 : 10 + r() * 46;
        R.add(mesh(new THREE.BoxGeometry(w, h, 9), fac, x, h / 2, z - 4.5));
        const cols = Math.floor(w / 1.8), rows = Math.floor((h - 2) / 2.2);
        for (let c = 0; c < cols; c++) for (let rr = 0; rr < rows; rr++) wins.push([x - w / 2 + 1.2 + c * 1.8, 1.8 + rr * 2.2, z + 0.02]);
      }
    }
    this.windows = new THREE.InstancedMesh(winGeo, new THREE.MeshBasicMaterial({ toneMapped: false }), wins.length);
    const m = new THREE.Matrix4();
    // the first window to light: the one in the middle of the nearest building at eye height
    let first = 0, best = 1e9;
    wins.forEach((p, i) => {
      m.makeTranslation(p[0], p[1], p[2]); this.windows.setMatrixAt(i, m);
      const d = Math.abs(p[0]) + Math.abs(p[1] - 7.5) + Math.abs(p[2] + 4) * 3;
      if (d < best) { best = d; first = i; }
      this.winThr.push(r());
    });
    this.winThr[first] = -1;
    this.windows.userData.first = wins[first];
    this.windows.setColorAt(0, new THREE.Color());
    this.windows.layers.set(NOINK);
    R.add(this.windows);
  }

  /** world position (in set space) of the first window, for the camera */
  get firstWindow(): [number, number, number] { return this.windows.userData.first; }

  private buildRow() {
    const R = this.sets.row;
    R.add(mesh(new THREE.BoxGeometry(40, 0.2, 12), toon("#4a4650"), 10, -0.1, 0));
    R.add(mesh(new THREE.BoxGeometry(40, 5, 0.2), toon("#ffffff", wallTex("#8a8a96")), 10, 2.5, -1.4));
    const people = [
      { top: "#b8584a", hair: "#3a2418" }, { top: "#3f6a5a", hair: "#1a1414", headphones: true }, { top: "#6a5a8a", hair: "#8a6a3a" },
    ];
    ((LETTER.no === 2 ? ["love", "argue", "search"] : ["poem", "code", "email"]) as ScreenKind[]).forEach((k, i) => {
      const x = i * 2.8;
      desk(R, x, -0.75, 1.9, 0.8, "#8a7058");
      this.rowScreens.push(monitor(R, x, 1.16, -0.95, k));
      const a = new Actor(cardTexture((g) => drawSeatedBack(g, people[i])), 1.5, R, x - 0.62, 0.15, 0.22, false);
      this.actors.push(a);
    });
    // the programmer's corner at x = 20: two screens of code, headphones
    desk(R, 20, -0.75, 2.4, 0.8, "#5a5058");
    this.codeScreen = monitor(R, 19.45, 1.16, -0.95, "code");
    monitor(R, 20.6, 1.16, -0.95, "code").set(1);
    this.coderTex = [0, -0.5, -1].map((l) => cardTexture((g) => drawSeatedBack(g, { top: "#2f3a4a", hair: "#2b1d1a", headphones: true, lean: l })));
    this.coder = new Actor(this.coderTex[0], 1.5, R, 20, 0.05, 0.22, false);
    this.actors.push(this.coder);
    const L = new THREE.PointLight("#c8d6ff", 2.0, 4, 2); L.position.set(20, 1.2, -0.3); R.add(L);
  }

  private buildTyping() {
    const R = this.sets.typing;
    R.add(mesh(new THREE.BoxGeometry(6, 0.1, 4), toon("#5a4232"), 0, -0.05, 0));
    R.add(mesh(new THREE.BoxGeometry(1.75, 0.06, 0.62), toon("#bdb39c"), 0, 0.03, 0));
    this.keys = new DynTex(1024, 360, (g, v) => keyboardDraw(g, v), 1);
    const top = mesh(new THREE.PlaneGeometry(1.7, 0.6), new THREE.MeshToonMaterial({ map: this.keys.t, gradientMap: toonRamp() }), 0, 0.062, 0);
    top.rotation.x = -Math.PI / 2; R.add(top);
    for (const side of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.7), new THREE.MeshBasicMaterial({ map: cardTexture((g) => drawHandTop(g, side)), alphaTest: 0.5, color: "#fff4e4" }));
      h.rotation.x = -Math.PI / 2; h.position.set(side * 0.27, 0.12, 0.36); h.layers.set(NOINK); R.add(h); this.hands.push(h);
    }
    const glowS = softPlane(3, 2, radialTex("rgba(190,210,255,0.6)", "rgba(190,210,255,0)"), "#ffffff", 0.5);
    glowS.position.set(0, 0.6, -0.9); R.add(glowS);
    const L = new THREE.PointLight("#cfe0ff", 2.2, 4, 2); L.position.set(0, 0.8, -0.6); R.add(L);
  }

  private buildClass() {
    const R = this.sets.class;
    R.add(mesh(new THREE.BoxGeometry(16, 0.2, 14), toon("#8a6a4a"), 0, -0.1, 2));
    R.add(mesh(new THREE.BoxGeometry(16, 5, 0.2), toon("#ffffff", wallTex("#c9c0a8")), 0, 2.5, -2.2));
    R.add(mesh(new THREE.BoxGeometry(4.2, 2.1, 0.06), toon("#ffffff", chalkTex()), -0.4, 1.9, -2.08));
    R.add(mesh(new THREE.BoxGeometry(4.4, 0.08, 0.14), toon("#6b4a2e"), -0.4, 0.84, -2.02));
    this.teacherTex = [0, 1].map((p) => cardTexture((g) => drawTeacher(g, p)));
    this.teacher = new Actor(this.teacherTex[0], 1.7, R, 1.0, -1.4);
    this.actors.push(this.teacher);
    for (let row = 0; row < 3; row++) for (let c = -1; c <= 1; c++) {
      const x = c * 1.6, z = 1.0 + row * 1.5;
      desk(R, x, z, 1.1, 0.55, "#b08a5a");
      if (row === 2 && c === 1) continue;
      const a = new Actor(cardTexture((g) => drawSeatedBack(g, { top: ["#c06a4a", "#4a7aa0", "#7a8a4a", "#a04a6a"][(row + c + 4) % 4], hair: ["#2b1d1a", "#6a4a2a", "#1a1414"][(row * 3 + c + 3) % 3] })), 1.25, R, x, z + 0.45, 0.2, false);
      this.actors.push(a);
    }
  }

  /** Pose everything for frame f of a shot. */
  update(set: SetName, look: LookName, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene, st: Record<string, number>) {
    for (const k of Object.keys(this.sets) as SetName[]) this.sets[k].visible = k === set;
    const L = LOOKS[look];
    (this.skyMat.uniforms.top.value as THREE.Color).set(L.top);
    (this.skyMat.uniforms.hor.value as THREE.Color).set(L.hor);
    this.sky.position.copy(cam.position);
    const o = ORIGIN[set];
    const tz = st.sunZ ?? 0;
    this.sun.color.set(L.sun); this.sun.intensity = L.sunI;
    this.sun.position.set(o.x + L.sunDir[0], o.y + L.sunDir[1], o.z + tz + L.sunDir[2]);
    this.sun.target.position.set(o.x, o.y, o.z + tz);
    this.hemi.color.set(L.hemiS); this.hemi.groundColor.set(L.hemiG); this.hemi.intensity = L.hemiI;
    if (!scene.fog) scene.fog = new THREE.Fog("#000000", 1, 2);
    const fog = scene.fog as THREE.Fog;
    fog.color.set(L.hor); fog.near = L.fog[0]; fog.far = L.fog[1];
    for (const a of this.actors) a.face(cam);

    // desk: flap 0 = closed, 1 = open; letter rise; seal drop height
    const open = st.open ?? 0;
    this.flap.rotation.x = -3.22 * open; // past flat, so the open flap lies behind the letter
    const lt = st.letter ?? 0;
    this.letter.position.set(0, 0.022, -lt * 1.3);
    this.letter.visible = lt > 0.01;
    const drop = st.sealDrop ?? 0;
    this.seal.position.y = 0.03 + drop * 1.4;
    const squash = st.squash ?? 0;
    this.seal.scale.set(1 + squash * 0.12, 1 - squash * 0.4, 1 + squash * 0.12);
    const gl = st.glow ?? open;
    (this.envGlow.material as THREE.MeshBasicMaterial).opacity = gl;
    this.envGlow.lookAt(cam.position);
    this.envLight.intensity = 3.5 * gl;
    (this.envGlow.material as THREE.MeshBasicMaterial).opacity = gl * 0.7;

    // hall
    if (st.walk !== undefined) {
      setMap(this.elian.card, this.elianTex[Math.floor(st.walk * 4) % 4]);
      this.elian.card.position.y = Math.abs(Math.sin(st.walk * Math.PI * 2)) * 0.02;
    } else { setMap(this.elian.card, this.elianTex[0]); this.elian.card.position.y = 0; }
    this.elian.card.position.z = this.elian.blob.position.z = st.elianZ ?? -10.5;
    this.mirror.set(st.mirror ?? 0);
    (this.mirrorHalo.material as THREE.MeshBasicMaterial).opacity = st.halo ?? 0.25;
    this.mirrorHalo.lookAt(cam.position);
    this.museumHalo.lookAt(cam.position);
    this.kids.forEach((k, i) => setMap(k.card, this.kidTex[i][st.hands ? 1 : 0]));
    // typing: one key down at a time, the hands bob in turn
    this.keys.set(st.key ?? -1);
    this.hands.forEach((h, i) => { h.position.y = 0.12 + Math.max(0, Math.sin((st.tap ?? 0) * Math.PI * 2 + i * Math.PI)) * 0.05; });

    // present
    this.calendar.set(st.circle ?? 0);
    this.roomScreen.set(st.blink ?? 0);
    this.lonely.card.visible = !!st.lonely;
    const scr = this.roomScreen.mesh!.material as THREE.MeshBasicMaterial;
    const want = st.lonely ? this.nightScreen.t : this.roomScreen.t;
    if (scr.map !== want) { scr.map = want; scr.needsUpdate = true; }
    this.nightScreen.set(st.night ?? 1);
    this.rowScreens.forEach((s, i) => s.set(st[`scr${i}`] ?? 0));
    this.codeScreen.set(1);
    setMap(this.coder.card, this.coderTex[st.lean ?? 0]);
    this.coder.card.position.y = 0.22 + (st.bob ?? 0) * 0.02;
    setMap(this.teacher.card, this.teacherTex[st.panic ? 1 : 0]);
    this.teacher.card.position.y = (st.panic ?? 0) * Math.max(0, Math.sin((st.hop ?? 0) * Math.PI)) * 0.06;

    // city: lit fraction
    if (st.lit !== undefined && Math.abs(st.lit - this.winLit) > 1e-4) {
      this.winLit = st.lit;
      const c = new THREE.Color();
      const r = rng(99);
      for (let i = 0; i < this.winThr.length; i++) {
        const on = this.winThr[i] < st.lit;
        const warm = r();
        if (on) c.setRGB(1.6 + warm * 0.6, 1.75 + warm * 0.3, 2.3 - warm * 0.5); else c.setRGB(0.035, 0.04, 0.06);
        this.windows.setColorAt(i, c);
      }
      this.windows.instanceColor!.needsUpdate = true;
    }
  }
}
