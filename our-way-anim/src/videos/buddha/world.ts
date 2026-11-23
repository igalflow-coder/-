// The worlds of part 1, each built as a "set" far from the others so one scene serves every shot. Only the set of
// the current shot is visible. Each shot also picks a light "look" (sky, sun, fill, fog).
import * as THREE from "three";
import { NOINK } from "./ink";
import { floorTex, wallTex, leafTex, blobTex, grassTex, earthTex, footTex, roomWallTex, shelfTex } from "./paint";
import { cardTexture, drawSage, makeCard, drawHandBranch, drawElderBack, drawKingBack, drawWandererBack } from "./figures";

export type SetName = "court" | "archive" | "garden" | "path" | "room" | "crown" | "gates";
export const ORIGIN: Record<SetName, THREE.Vector3> = {
  court: new THREE.Vector3(0, 0, 0),
  archive: new THREE.Vector3(400, 0, 0),
  garden: new THREE.Vector3(800, 0, 0),
  path: new THREE.Vector3(1200, 0, 0),
  room: new THREE.Vector3(1600, 0, 0),
  crown: new THREE.Vector3(2000, 0, 0),
  gates: new THREE.Vector3(2400, 0, 0),
};

export type LookName = "golden" | "dawn" | "night" | "archive" | "studio";
type Look = { top: string; hor: string; sun: string; sunI: number; sunDir: [number, number, number]; hemiS: string; hemiG: string; hemiI: number; fog: [number, number] };
const LOOKS: Record<LookName, Look> = {
  golden: { top: "#7183c4", hor: "#ffd29a", sun: "#ffc88e", sunI: 3.0, sunDir: [-14, 13, 12], hemiS: "#ffe7c8", hemiG: "#7a6aa0", hemiI: 1.7, fog: [30, 220] },
  dawn: { top: "#8ea5d6", hor: "#ffdcb8", sun: "#ffd9ad", sunI: 2.7, sunDir: [-12, 9, 14], hemiS: "#fff0dc", hemiG: "#6f7fa8", hemiI: 1.7, fog: [25, 200] },
  night: { top: "#0e1430", hor: "#2a2a55", sun: "#8fa6ff", sunI: 0.55, sunDir: [10, 12, 6], hemiS: "#2a3060", hemiG: "#120c1c", hemiI: 0.45, fog: [20, 120] },
  archive: { top: "#0b1026", hor: "#1b2446", sun: "#9fb7ff", sunI: 0.9, sunDir: [2, 20, 6], hemiS: "#4a5a9a", hemiG: "#120c1c", hemiI: 0.9, fog: [15, 90] },
  studio: { top: "#1c120e", hor: "#3a241a", sun: "#ffd9a0", sunI: 2.4, sunDir: [3, 10, 7], hemiS: "#7a5a40", hemiG: "#1a1014", hemiI: 0.7, fog: [20, 120] },
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

const toon = (color: THREE.ColorRepresentation, map?: THREE.Texture) =>
  new THREE.MeshToonMaterial({ color, map: map ?? null, gradientMap: toonRamp() });

/** Unlit glowing material; HDR colour (> 1) so the bloom picks it up. */
const glow = (r: number, g: number, b: number) => {
  const m = new THREE.MeshBasicMaterial({ toneMapped: false });
  m.color.setRGB(r, g, b);
  return m;
};

const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};

const radialTex = (inner: string, outer: string) => {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(128, 128, 4, 128, 128, 126);
  gr.addColorStop(0, inner);
  gr.addColorStop(1, outer);
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
};

/** A soft additive sprite-like plane (halo, smoke, light beam). Always on NOINK. */
const softPlane = (w: number, h: number, map: THREE.Texture, color: THREE.ColorRepresentation, opacity = 1, additive = true) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({
    map, color, transparent: true, opacity, depthWrite: false, toneMapped: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  }));
  m.layers.set(NOINK);
  return m;
};

const pavilion = (x: number, y: number, z: number, r: number, gold: THREE.Material, cream: THREE.Material) => {
  const g = new THREE.Group();
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(mesh(new THREE.CylinderGeometry(r * 0.08, r * 0.08, r * 1.1, 8), cream, dx * r * 0.6, r * 0.55, dz * r * 0.6));
  g.add(mesh(new THREE.BoxGeometry(r * 1.6, r * 0.18, r * 1.6), cream, 0, r * 1.15, 0));
  g.add(mesh(new THREE.SphereGeometry(r * 0.75, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), gold, 0, r * 1.24, 0));
  g.add(mesh(new THREE.ConeGeometry(r * 0.1, r * 0.5, 8), gold, 0, r * 2.2, 0));
  g.position.set(x, y, z);
  return g;
};

const tree = (x: number, z: number, s: number, leaves: THREE.Material) => {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.28 * s, 0.5 * s, 4.2 * s, 10), toon("#6b4a2e"), 0, 2.1 * s, 0));
  const blobs: [number, number, number, number][] = [[0, 5, 0, 1.8], [-1.2, 4.5, 0.4, 1.3], [1.1, 4.6, -0.4, 1.4], [-0.3, 6.1, -0.6, 1.3], [0.6, 5.8, 0.8, 1.1], [-0.9, 5.6, -1, 1.2]];
  for (const [bx, by, bz, r] of blobs) g.add(mesh(new THREE.IcosahedronGeometry(r * s, 1), leaves, bx * s, by * s, bz * s));
  g.position.set(x, 0, z);
  return g;
};

/** A camera-facing character card plus its soft contact shadow. */
class Actor {
  card: THREE.Mesh;
  blob: THREE.Mesh;
  constructor(tex: THREE.Texture, height: number, parent: THREE.Object3D, x: number, z: number, shadow = true) {
    this.card = makeCard(tex, height);
    this.card.layers.set(NOINK);
    this.card.position.set(x, 0, z);
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

export class World {
  root = new THREE.Group();
  sets = {} as Record<SetName, THREE.Group>;
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  skyMat: THREE.ShaderMaterial;
  sky: THREE.Mesh;
  actors: Actor[] = [];

  // animated parts
  sage!: Actor;
  king!: Actor;
  sageTex: THREE.Texture[] = [];
  wanderer!: Actor;
  walkTex: THREE.Texture[] = [];
  handCard!: THREE.Mesh;
  flame!: THREE.Mesh;
  lampLight!: THREE.PointLight;
  smoke: THREE.Mesh[] = [];
  lotus: THREE.Group[] = [];
  halo!: THREE.Mesh;
  scrollLight!: THREE.PointLight;
  beam!: THREE.Mesh;
  walls: THREE.Mesh[] = [];
  doors: THREE.Group[] = [];

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
    sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 90;
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
    this.buildCourt();
    this.buildArchive();
    this.buildGarden();
    this.buildPath();
    this.buildRoom();
    this.buildCrown();
    this.buildGates();
  }

  private buildCourt() {
    const R = this.sets.court;
    const cream = toon("#efe0bf"), gold = toon("#e0ac43");
    const ochre = toon("#ffffff", wallTex(true)), plain = toon("#ffffff", wallTex(false));
    (ochre.map as THREE.Texture).repeat.set(9, 1);
    const floor = mesh(new THREE.PlaneGeometry(160, 160), toon("#ffffff", floorTex()));
    floor.rotation.x = -Math.PI / 2; floor.castShadow = false; R.add(floor);
    R.add(mesh(new THREE.BoxGeometry(36, 8, 2), ochre, 0, 4, -16));
    R.add(mesh(new THREE.BoxGeometry(37, 0.5, 2.6), cream, 0, 8.2, -16));
    for (let i = -7; i <= 7; i++) R.add(pavilion(i * 2.4, 8.45, -16, 0.9, gold, cream));
    R.add(mesh(new THREE.CylinderGeometry(5.2, 5.6, 4, 32), plain, 0, 10, -24));
    R.add(mesh(new THREE.SphereGeometry(5.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), toon("#f0d79e"), 0, 12, -24));
    R.add(mesh(new THREE.ConeGeometry(0.5, 2.6, 12), gold, 0, 18.4, -24));
    for (const sx of [-1, 1]) {
      for (let z = -12; z <= 8; z += 4) {
        R.add(mesh(new THREE.CylinderGeometry(0.32, 0.38, 4.6, 16), cream, sx * 7.5, 2.3, z));
        R.add(mesh(new THREE.BoxGeometry(1, 0.35, 1), cream, sx * 7.5, 4.75, z));
        R.add(mesh(new THREE.BoxGeometry(1.1, 0.3, 1.1), cream, sx * 7.5, 0.15, z));
      }
      R.add(mesh(new THREE.BoxGeometry(1.2, 0.7, 22), ochre, sx * 7.5, 5.25, -2));
      R.add(mesh(new THREE.BoxGeometry(0.6, 6, 22), plain, sx * 10.5, 3, -2));
    }
    R.add(tree(-7.2, -10, 1, toon("#ffffff", leafTex())));
    // dais with the throne
    R.add(mesh(new THREE.BoxGeometry(14, 0.4, 4), cream, 0, 0.2, -13));
    R.add(mesh(new THREE.BoxGeometry(5, 0.3, 2.4), cream, 0, 0.55, -13));
    const red = toon("#a02a32");
    R.add(mesh(new THREE.BoxGeometry(1.8, 0.9, 1.2), gold, 0, 1.15, -13.2));
    R.add(mesh(new THREE.BoxGeometry(1.6, 0.25, 1.05), red, 0, 1.7, -13.15));
    R.add(mesh(new THREE.BoxGeometry(1.9, 2.6, 0.25), gold, 0, 2.6, -13.75));
    R.add(mesh(new THREE.SphereGeometry(0.95, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), gold, 0, 3.9, -13.75));
    R.add(mesh(new THREE.BoxGeometry(1.5, 2.0, 0.1), red, 0, 2.5, -13.6));
    // the sage (three tear stages) and the king
    this.sageTex = [0, 0.5, 1].map((t) => cardTexture((g) => drawSage(g, { tear: t })));
    this.sage = new Actor(this.sageTex[0], 1.78, R, -0.3, 0);
    this.king = new Actor(cardTexture((g) => drawKingBack(g)), 1.9, R, 0.2, -4.5);
    this.actors.push(this.sage, this.king);
  }

  private buildArchive() {
    const R = this.sets.archive;
    const floor = mesh(new THREE.PlaneGeometry(120, 120), toon("#1d2547"));
    floor.rotation.x = -Math.PI / 2; floor.castShadow = false; R.add(floor);
    const shelf = toon("#ffffff", shelfTex());
    const navy = toon("#2c3770"), trim = toon("#c9a35a");
    for (const sx of [-1, 1]) {
      for (let z = -60; z <= 4; z += 8) {
        R.add(mesh(new THREE.BoxGeometry(1.5, 14, 6.6), shelf, sx * 6, 7, z));
        R.add(mesh(new THREE.BoxGeometry(1.0, 16, 1.0), navy, sx * 5.2, 8, z + 3.8));
        R.add(mesh(new THREE.BoxGeometry(1.2, 0.3, 1.2), trim, sx * 5.2, 16.1, z + 3.8));
      }
    }
    // the pedestal and the palm-leaf manuscript
    R.add(mesh(new THREE.BoxGeometry(1.3, 1.1, 0.9), toon("#262c52"), 0, 0.55, -6));
    R.add(mesh(new THREE.BoxGeometry(1.45, 0.12, 1.05), trim, 0, 1.16, -6));
    const leaf = toon("#d8b06a");
    for (let i = 0; i < 6; i++) R.add(mesh(new THREE.BoxGeometry(0.95, 0.025, 0.2), leaf, 0, 1.24 + i * 0.027, -6));
    R.add(mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 16), toon("#7a3b22"), 0, 1.32, -6));
    this.halo = softPlane(2.4, 2.4, radialTex("rgba(255,210,130,0.9)", "rgba(255,180,90,0)"), "#ffffff", 0.9);
    this.halo.position.set(0, 1.45, -6);
    R.add(this.halo);
    this.scrollLight = new THREE.PointLight("#ffc77a", 6, 10, 2);
    this.scrollLight.position.set(0, 1.9, -5.6);
    R.add(this.scrollLight);
    // light shafts from above
    const shaft = radialTex("rgba(160,190,255,0.35)", "rgba(160,190,255,0)");
    for (const z of [-30, -18, -6]) {
      const p = softPlane(3, 22, shaft, "#ffffff", 0.5);
      p.position.set(0, 11, z);
      R.add(p);
    }
  }

  private buildGarden() {
    const R = this.sets.garden;
    const ground = mesh(new THREE.PlaneGeometry(200, 200), toon("#ffffff", grassTex()));
    ground.rotation.x = -Math.PI / 2; ground.castShadow = false; R.add(ground);
    const leaves = toon("#ffffff", leafTex());
    R.add(tree(0, -4, 1.2, leaves));
    R.add(tree(-9, -14, 1, leaves));
    R.add(tree(10, -18, 1.1, leaves));
    for (const [x, z, r] of [[-4, -2, 0.9], [4, -6, 1.1], [-6, -8, 0.8], [7, -3, 0.7]] as const) R.add(mesh(new THREE.IcosahedronGeometry(r, 1), leaves, x, r * 0.7, z));
    // distant palace on the horizon
    R.add(mesh(new THREE.CylinderGeometry(4, 4.4, 4, 24), toon("#d9b27a"), 6, 2, -70));
    R.add(mesh(new THREE.SphereGeometry(4.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon("#f0d79e"), 6, 4, -70));
    // the queen's hand on the branch: a close-up card
    this.handCard = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.0), new THREE.MeshBasicMaterial({ map: cardTexture(drawHandBranch), alphaTest: 0.5, side: THREE.DoubleSide, color: "#fff4e4" }));
    this.handCard.layers.set(NOINK);
    this.handCard.position.set(-1.6, 2.2, 1.5);
    R.add(this.handCard);
    // council of elders under a tree around a simple wooden chair (at x = 30)
    const E = new THREE.Group();
    E.position.set(30, 0, 0);
    R.add(E);
    E.add(tree(0, -3, 1.3, leaves));
    const wood = toon("#8a5a34");
    E.add(mesh(new THREE.BoxGeometry(0.6, 0.08, 0.6), wood, 0, 0.5, 0));
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) E.add(mesh(new THREE.BoxGeometry(0.07, 0.5, 0.07), wood, dx * 0.26, 0.25, dz * 0.26));
    E.add(mesh(new THREE.BoxGeometry(0.6, 0.6, 0.07), wood, 0, 0.84, -0.27));
    const robes = ["#7a4a8a", "#2f6b6a", "#a8562c", "#4a5a9a", "#8a7a3a", "#6b2f3a"];
    const turbans = ["#efe2c4", "#e3b23c", "#efe2c4", "#c0353a", "#efe2c4", "#e3b23c"];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const el = new Actor(cardTexture((g) => drawElderBack(g, robes[i], turbans[i])), 1.72, E, Math.cos(a) * 2.2, Math.sin(a) * 2.2);
      this.actors.push(el);
    }
  }

  private buildPath() {
    const R = this.sets.path;
    const ground = mesh(new THREE.PlaneGeometry(200, 200), toon("#ffffff", grassTex()));
    ground.rotation.x = -Math.PI / 2; ground.castShadow = false; R.add(ground);
    const road = mesh(new THREE.PlaneGeometry(3.2, 120), toon("#ffffff", earthTex()));
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, -50); road.castShadow = false; R.add(road);
    const leaves = toon("#ffffff", leafTex());
    for (let z = -10; z > -100; z -= 12) { R.add(tree(-5 - (z % 7) * 0.3, z, 0.9, leaves)); R.add(tree(5.5, z - 6, 0.8, leaves)); }
    // seven baby footprints, a lotus in each
    const ft = footTex();
    const pink = toon("#f2a6b8"), pinkLight = toon("#fbd3dc"), gold = toon("#e3b23c");
    for (let i = 0; i < 7; i++) {
      const z = 1 - i * 0.42, x = (i % 2 ? 0.1 : -0.1);
      const fp = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.28), new THREE.MeshBasicMaterial({ map: ft, transparent: true, depthWrite: false }));
      fp.rotation.x = -Math.PI / 2; fp.position.set(x, 0.015, z); fp.layers.set(NOINK); R.add(fp);
      const L = new THREE.Group();
      for (let k = 0; k < 8; k++) {
        const pet = mesh(new THREE.SphereGeometry(0.06, 10, 6), k % 2 ? pink : pinkLight);
        pet.scale.set(0.55, 0.35, 1.3);
        const a = (k / 8) * Math.PI * 2;
        pet.position.set(Math.cos(a) * 0.06, 0.035, Math.sin(a) * 0.06);
        pet.rotation.y = -a + Math.PI / 2;
        pet.rotation.x = -0.5;
        L.add(pet);
      }
      L.add(mesh(new THREE.SphereGeometry(0.025, 8, 6), gold, 0, 0.05, 0));
      L.position.set(x, 0.02, z);
      L.scale.setScalar(0.001);
      R.add(L);
      this.lotus.push(L);
    }
    // the man who walks away (far down the road)
    this.walkTex = [0, 0.25, 0.5, 0.75].map((p) => cardTexture((g) => drawWandererBack(g, p)));
    this.wanderer = new Actor(this.walkTex[0], 1.78, R, 0, -20);
    this.actors.push(this.wanderer);
  }

  private buildRoom() {
    const R = this.sets.room;
    const wall = toon("#ffffff", roomWallTex());
    R.add(mesh(new THREE.BoxGeometry(12, 0.2, 12), toon("#4a3a2e"), 0, -0.1, 0));
    R.add(mesh(new THREE.BoxGeometry(12, 6, 0.3), wall, 0, 3, -4));
    R.add(mesh(new THREE.BoxGeometry(0.3, 6, 12), wall, -4, 3, 0));
    // window with moonlight
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.8), glow(0.35, 0.45, 0.9));
    win.position.set(1.8, 3, -3.84); R.add(win);
    for (const dx of [-0.32, 0, 0.32]) R.add(mesh(new THREE.BoxGeometry(0.06, 1.8, 0.08), toon("#2a1f3a"), 1.8 + dx, 3, -3.8));
    // bed with white cloth, empty
    R.add(mesh(new THREE.BoxGeometry(2.2, 0.45, 1.3), toon("#6b4a2e"), -1.8, 0.25, -2.6));
    R.add(mesh(new THREE.BoxGeometry(2.1, 0.18, 1.25), toon("#f3ede0"), -1.8, 0.56, -2.6));
    R.add(mesh(new THREE.BoxGeometry(0.5, 0.15, 0.9), toon("#ffffff"), -2.6, 0.72, -2.6));
    // the oil lamp on a low table
    R.add(mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.5, 16), toon("#5a3b26"), 0.2, 0.25, -1.4));
    R.add(mesh(new THREE.SphereGeometry(0.11, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon("#b86a3a"), 0.2, 0.6, -1.4));
    this.flame = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 12), glow(6, 3.6, 1.2));
    this.flame.position.set(0.2, 0.67, -1.4);
    this.flame.layers.set(NOINK);
    R.add(this.flame);
    this.lampLight = new THREE.PointLight("#ffb766", 5, 9, 2);
    this.lampLight.position.set(0.2, 0.95, -1.3);
    this.lampLight.castShadow = false;
    R.add(this.lampLight);
    const sm = radialTex("rgba(200,200,220,0.6)", "rgba(200,200,220,0)");
    for (let i = 0; i < 3; i++) {
      const p = softPlane(0.25, 0.25, sm, "#ffffff", 0, false);
      p.position.set(0.2, 0.75, -1.4);
      R.add(p);
      this.smoke.push(p);
    }
  }

  private buildCrown() {
    const R = this.sets.crown;
    R.add(mesh(new THREE.BoxGeometry(40, 0.2, 40), toon("#2a1a14"), 0, -0.1, 0));
    R.add(mesh(new THREE.BoxGeometry(3.2, 0.9, 1.3), toon("#3a2420"), 0, 0.45, 0));
    const velvet = toon("#8e2430");
    R.add(mesh(new THREE.BoxGeometry(0.9, 0.14, 0.7), velvet, -0.85, 0.97, 0));
    R.add(mesh(new THREE.BoxGeometry(0.9, 0.14, 0.7), toon("#6b5a3e"), 0.85, 0.97, 0));
    const gold = toon("#e3b23c");
    const crown = new THREE.Group();
    crown.add(mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.16, 24, 1, true), gold, 0, 0.08, 0));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      crown.add(mesh(new THREE.ConeGeometry(0.04, 0.16, 6), gold, Math.cos(a) * 0.21, 0.24, Math.sin(a) * 0.21));
      crown.add(mesh(new THREE.SphereGeometry(0.022, 8, 6), i % 2 ? toon("#c0353a") : toon("#2f8a6a"), Math.cos(a) * 0.215, 0.08, Math.sin(a) * 0.215));
    }
    crown.position.set(-0.85, 1.04, 0);
    R.add(crown);
    const bowl = mesh(new THREE.SphereGeometry(0.2, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon("#7a4a28"), 0.85, 1.24, 0);
    R.add(bowl);
    R.add(mesh(new THREE.CircleGeometry(0.19, 20), toon("#4a2c18"), 0.85, 1.241, 0).rotateX(-Math.PI / 2));
    this.beam = softPlane(0.5, 6, radialTex("rgba(255,230,170,0.9)", "rgba(255,200,120,0)"), "#ffffff", 0.8);
    this.beam.position.set(0, 3, 0.05);
    R.add(this.beam);
  }

  private buildGates() {
    const R = this.sets.gates;
    const floor = mesh(new THREE.PlaneGeometry(200, 200), toon("#ffffff", floorTex()));
    floor.rotation.x = -Math.PI / 2; floor.castShadow = false; R.add(floor);
    const gold = toon("#e9b545"), cream = toon("#efe0bf");
    // the palace in the middle
    R.add(mesh(new THREE.CylinderGeometry(4, 4.4, 5, 24), toon("#ffffff", wallTex(false)), 0, 2.5, -14));
    R.add(mesh(new THREE.SphereGeometry(4.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon("#f0d79e"), 0, 5, -14));
    // golden walls in a ring, they rise out of the ground
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const w = mesh(new THREE.BoxGeometry(6.2, 9, 1.2), gold, Math.sin(a) * 15, -9, -14 + Math.cos(a) * 15);
      w.rotation.y = a;
      w.userData.base = -4.5;
      if (i === 0) continue; // the gap facing the camera holds the gate
      R.add(w);
      this.walls.push(w);
      for (let k = -1; k <= 1; k += 2) {
        const t = mesh(new THREE.ConeGeometry(0.4, 1.2, 4), gold, 0, 5.1, 0);
        t.position.x = k * 2.2;
        w.add(t);
      }
    }
    // the gate: two doors on hinges, open at the start
    for (const s of [-1, 1]) {
      const hinge = new THREE.Group();
      hinge.position.set(s * 3, 0, 1);
      const door = mesh(new THREE.BoxGeometry(3, 8, 0.4), gold, -s * 1.5, 4, 0);
      hinge.add(door);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) hinge.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), cream, -s * (0.8 + c * 1.4), 1.2 + r * 1.9, 0.25));
      R.add(hinge);
      this.doors.push(hinge);
    }
    R.add(mesh(new THREE.BoxGeometry(8, 1.2, 1.6), gold, 0, 8.6, 1));
    R.add(mesh(new THREE.BoxGeometry(1.2, 9.8, 1.6), gold, -3.6, 4.9, 1));
    R.add(mesh(new THREE.BoxGeometry(1.2, 9.8, 1.6), gold, 3.6, 4.9, 1));
  }

  /** Pose everything for frame f of a shot in the given set and look. */
  update(set: SetName, look: LookName, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene, state: Record<string, number>) {
    for (const k of Object.keys(this.sets) as SetName[]) this.sets[k].visible = k === set;
    const L = LOOKS[look];
    (this.skyMat.uniforms.top.value as THREE.Color).set(L.top);
    (this.skyMat.uniforms.hor.value as THREE.Color).set(L.hor);
    this.sky.position.copy(cam.position);
    const o = ORIGIN[set];
    this.sun.color.set(L.sun);
    this.sun.intensity = L.sunI;
    this.sun.position.set(o.x + L.sunDir[0], o.y + L.sunDir[1], o.z + L.sunDir[2]);
    this.sun.target.position.copy(o);
    this.hemi.color.set(L.hemiS);
    this.hemi.groundColor.set(L.hemiG);
    this.hemi.intensity = L.hemiI;
    if (!scene.fog) scene.fog = new THREE.Fog("#000000", 1, 2);
    const fog = scene.fog as THREE.Fog;
    fog.color.set(L.hor);
    fog.near = L.fog[0];
    fog.far = L.fog[1];
    for (const a of this.actors) a.face(cam);

    // animated parts, driven by the shot's state
    this.king.card.visible = this.king.blob.visible = !!state.king;
    const tear = state.tear ?? 0;
    this.setMap(this.sage.card, this.sageTex[tear > 0.66 ? 2 : tear > 0.2 ? 1 : 0]);
    if (state.walk !== undefined) {
      this.setMap(this.wanderer.card, this.walkTex[Math.floor(state.walk * 4) % 4]);
      this.wanderer.card.position.z = this.wanderer.blob.position.z = -14 - state.walkZ;
      this.wanderer.card.position.y = Math.abs(Math.sin(state.walk * Math.PI * 2)) * 0.03;
    }
    const lamp = state.lamp ?? 1;
    this.flame.scale.set(lamp, Math.max(0.001, lamp), lamp);
    this.flame.visible = lamp > 0.02;
    this.lampLight.intensity = 5 * lamp;
    const smoke = state.smoke ?? 0;
    this.smoke.forEach((p, i) => {
      const t = Math.max(0, smoke - i * 0.18);
      p.position.y = 0.75 + t * 1.2;
      p.position.x = 0.2 + Math.sin(t * 6 + i) * 0.05;
      p.scale.setScalar(1 + t * 2.5);
      (p.material as THREE.MeshBasicMaterial).opacity = t > 0 ? 0.55 * (1 - t) : 0;
      p.lookAt(cam.position);
    });
    const bloom = state.lotus ?? 0;
    this.lotus.forEach((L2, i) => L2.scale.setScalar(Math.max(0.001, Math.min(1, bloom * 7 - i)) * 2.4));
    const pulse = state.pulse ?? 0;
    (this.halo.material as THREE.MeshBasicMaterial).opacity = 0.65 + 0.25 * Math.sin(pulse * 6.283);
    this.halo.lookAt(cam.position);
    this.beam.lookAt(cam.position.x, this.beam.getWorldPosition(new THREE.Vector3()).y, cam.position.z);
    const rise = state.rise ?? 1;
    this.walls.forEach((w, i) => { const u = Math.max(0, Math.min(1, rise * 1.6 - Math.abs(i - 7.5) * 0.06)); w.position.y = -4.7 + u * 9.2; });
    const close = state.close ?? 0;
    this.doors.forEach((d, i) => { d.rotation.y = (i ? -1 : 1) * (1 - close) * 1.35; });
  }

  private setMap(m: THREE.Mesh, t: THREE.Texture) {
    const mat = m.material as THREE.MeshBasicMaterial;
    if (mat.map !== t) { mat.map = t; mat.needsUpdate = true; (m.customDepthMaterial as THREE.MeshDepthMaterial).map = t; }
  }
}
