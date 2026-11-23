// The palace courtyard of Kapilavastu at golden hour: sandstone floor, arcades of cream columns, an ochre palace
// facade with arches, a parapet of small gold-domed pavilions, a great dome behind, and a flowering sal tree.
import * as THREE from "three";
import { NOINK } from "./ink";
import { floorTex, wallTex, leafTex, blobTex } from "./paint";
import { cardTexture, drawSage, makeCard } from "./figures";

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

const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};

const SKY_TOP = new THREE.Color("#7183c4");
const SKY_HOR = new THREE.Color("#ffd29a");

const sky = () => {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: SKY_TOP }, hor: { value: SKY_HOR } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 hor; varying vec3 vP;
      void main(){ float h = clamp(vP.y * 1.6, 0.0, 1.0); vec3 c = mix(hor, top, pow(h, 0.7)); gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
      }`,
  });
  const s = new THREE.Mesh(new THREE.SphereGeometry(800, 32, 16), mat);
  s.layers.set(NOINK);
  return s;
};

const pavilion = (x: number, y: number, z: number, r: number, gold: THREE.Material, cream: THREE.Material) => {
  const g = new THREE.Group();
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(mesh(new THREE.CylinderGeometry(r * 0.08, r * 0.08, r * 1.1, 8), cream, dx * r * 0.6, r * 0.55, dz * r * 0.6));
  g.add(mesh(new THREE.BoxGeometry(r * 1.6, r * 0.18, r * 1.6), cream, 0, r * 1.15, 0));
  const dome = mesh(new THREE.SphereGeometry(r * 0.75, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), gold, 0, r * 1.24, 0);
  g.add(dome);
  g.add(mesh(new THREE.ConeGeometry(r * 0.1, r * 0.5, 8), gold, 0, r * 2.2, 0));
  g.position.set(x, y, z);
  return g;
};

export class World {
  root = new THREE.Group();
  sun: THREE.DirectionalLight;
  sage: THREE.Mesh;

  constructor() {
    const R = this.root;
    R.add(sky());

    const cream = toon("#efe0bf");
    const gold = toon("#e0ac43");
    const ochre = toon("#ffffff", wallTex(true));
    const plain = toon("#ffffff", wallTex(false));

    // floor
    const floor = mesh(new THREE.PlaneGeometry(160, 160), toon("#ffffff", floorTex()));
    floor.rotation.x = -Math.PI / 2;
    floor.castShadow = false;
    R.add(floor);

    // palace facade with arches (texture repeats one arch per 4 m)
    const facadeTex = (ochre.map as THREE.Texture);
    facadeTex.repeat.set(9, 1);
    R.add(mesh(new THREE.BoxGeometry(36, 8, 2), ochre, 0, 4, -16));
    R.add(mesh(new THREE.BoxGeometry(37, 0.5, 2.6), cream, 0, 8.2, -16));
    for (let i = -7; i <= 7; i++) R.add(pavilion(i * 2.4, 8.45, -16, 0.9, gold, cream));

    // great dome behind the facade
    R.add(mesh(new THREE.CylinderGeometry(5.2, 5.6, 4, 32), plain, 0, 10, -24));
    R.add(mesh(new THREE.SphereGeometry(5.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), toon("#f0d79e"), 0, 12, -24));
    R.add(mesh(new THREE.ConeGeometry(0.5, 2.6, 12), gold, 0, 18.4, -24));

    // side arcades: cream columns with capitals and a beam
    for (const sx of [-1, 1]) {
      for (let z = -12; z <= 8; z += 4) {
        R.add(mesh(new THREE.CylinderGeometry(0.32, 0.38, 4.6, 16), cream, sx * 7.5, 2.3, z));
        R.add(mesh(new THREE.BoxGeometry(1, 0.35, 1), cream, sx * 7.5, 4.75, z));
        R.add(mesh(new THREE.BoxGeometry(1.1, 0.3, 1.1), cream, sx * 7.5, 0.15, z));
      }
      R.add(mesh(new THREE.BoxGeometry(1.2, 0.7, 22), ochre, sx * 7.5, 5.25, -2));
      R.add(mesh(new THREE.BoxGeometry(0.6, 6, 22), plain, sx * 10.5, 3, -2));
    }

    // flowering sal tree, left of centre
    const trunk = mesh(new THREE.CylinderGeometry(0.28, 0.5, 4.2, 10), toon("#6b4a2e"), -7.2, 2.1, -10);
    R.add(trunk);
    const leaves = toon("#ffffff", leafTex());
    const blobs: [number, number, number, number][] = [[-7.2, 5, -10, 1.8], [-8.4, 4.5, -9.6, 1.3], [-6.1, 4.6, -10.4, 1.4], [-7.5, 6.1, -10.6, 1.3], [-6.6, 5.8, -9.2, 1.1], [-8.1, 5.6, -11, 1.2]];
    for (const [x, y, z, r] of blobs) R.add(mesh(new THREE.IcosahedronGeometry(r, 1), leaves, x, y, z));

    // a low stone step / dais in front of the facade
    R.add(mesh(new THREE.BoxGeometry(14, 0.4, 4), cream, 0, 0.2, -13));

    // the sage card and his contact shadow
    this.sage = makeCard(cardTexture((g) => drawSage(g, { tear: 1 })), 1.78);
    this.sage.position.set(-0.3, 0, 0);
    this.sage.layers.set(NOINK);
    R.add(this.sage);
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.7), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2;
    blob.position.set(-0.25, 0.01, 0);
    blob.layers.set(NOINK);
    R.add(blob);

    // golden-hour light: low warm sun from the back left, violet sky fill in the shade
    this.sun = new THREE.DirectionalLight("#ffc88e", 3.0);
    this.sun.position.set(-14, 13, 12);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera as THREE.OrthographicCamera;
    sc.left = -20; sc.right = 20; sc.top = 20; sc.bottom = -20; sc.near = 1; sc.far = 80;
    this.sun.shadow.bias = -0.0005;
    R.add(this.sun);
    R.add(new THREE.HemisphereLight("#ffe7c8", "#7a6aa0", 1.7));
  }

  /** Pose the world for a frame: billboard the cards toward the camera (yaw only). */
  update(cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    scene.fog = scene.fog ?? new THREE.Fog(SKY_HOR, 30, 220);
    const p = this.sage.position;
    this.sage.rotation.y = Math.atan2(cam.position.x - p.x, cam.position.z - p.z);
  }
}
