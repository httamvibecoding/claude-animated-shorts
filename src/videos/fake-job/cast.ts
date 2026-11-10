// Our cast as lit flat sprites in the 3D world: the engineer, hooded hackers, contact blobs and the flying-money
// effects. Each frame every character asks for a drawing (a key + a draw call); the pool keeps one canvas per distinct
// drawing. Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import { Pen, bodyFront, fxBurst, fxStars, fxShadow, fxContact, Outfit, Expr, FrontOpts, SideOpts } from "./toon";
import { FPS, SHOTS, V3, sceneState, clamp01, smooth, SceneState } from "./story";
import { LIGHTS } from "./lights";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
/** world roots that hold actors (to find the scene's sun when world.ts does not pass it) */
const ROOTS = new Set<THREE.Object3D>();

/** lit flat character: cardShade() material, receives shadows (dims to the bright floor only), casts its silhouette
 *  when world.ts says so (golden). Drawn after the contact blobs (renderOrder 1). */
export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    // rim width is in output pixels: tell the card shader the render height (1920 = 1080 x 1920 frame)
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
/** unlit effect card: hard cut-out (ink drawings), soft see-through (mist) or a multiply ground blob */
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false;
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    }
    else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };

// ---------------- helpers kept from the bridge kit ----------------
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
/** drawing resolution by distance: [canvas w, h, scale from the 600 x 1000 design]; sized for the 1440 x 2560 final */
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

// ---------------- light ----------------
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: "day" | "golden" = "day";
const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => { if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o; });
  return s as THREE.DirectionalLight | null;
};
const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null, err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos), e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) { err = e; best = s; }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};
/** canvas angle the sun comes FROM on an upright card facing the camera, in 45-degree steps (small texture cache) */
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

// ---------------- life: blinks ----------------
const LID = [0.5, 1, 1, 0.5];
const lidAt = (t: number, i: number) => {
  const f = Math.round(t * FPS);
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13)); // next blink 0.5-2.3 s later
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

// ---------------- outfits (fake job cast) ----------------
const SKINS = ["#ffe2c2", "#f5c9a0", "#ecd0b6", "#c99067"];
const engineerOutfit = (v = 0): Outfit => ({
  jacket: ["#3f6fb5", "#4a7fc4", "#3a6ca8", "#4474b8"][v % 4], pants: "#3b3f52", boots: "#4a3426",
  hat: "hair", hair: ["#2a201a", "#4a3426", "#1f1a17", "#5a4632"][v % 4], skin: SKINS[v % 4],
});
const ENGINEER = engineerOutfit(0);
const HACKER: Outfit = { jacket: "#2f3542", pants: "#232833", boots: "#16181e", hat: null, hair: null, skin: "#575d6b" };
const HACKER2: Outfit = { ...HACKER, jacket: "#343b4a", pants: "#1c2129" };

/** hooded hacker: bodyFront + a hood shell over the head (design-space head centre: stand y~309, sit y~576) */
const hooded = (p: Pen, o: Outfit, opts: FrontOpts) => {
  bodyFront(p, o, opts);
  const cy = opts.mode === "sit" ? 576 : 309;
  p.poly([[158, cy + 215], [150, cy + 55], [192, cy - 78], [300, cy - 142], [408, cy - 78], [450, cy + 55], [442, cy + 215],
    [388, cy + 160], [300, cy + 138], [212, cy + 160]], "#242a36", 10);
  p.ell(300, cy + 30, 92, 100, "#12151b", 0);                 // face void
  p.ell(261, cy + 25, 18, 12, "#7de8ff", 0); p.ell(339, cy + 25, 18, 12, "#7de8ff", 0); // glowing eyes
  p.poly([[142, cy + 265], [212, cy + 150], [388, cy + 150], [458, cy + 265]], "#242a36", 0); // shoulder cape
};
/** hacker carrying a money bag */
const hackerBag = (p: Pen, o: Outfit, opts: FrontOpts) => {
  hooded(p, o, opts);
  p.poly([[382, 585], [452, 585], [474, 665], [462, 748], [374, 748], [362, 665]], "#b98a4e", 9);
  p.line([[402, 590], [418, 560]], "#7a5a2e", 13); p.line([[436, 590], [418, 560]], "#7a5a2e", 13);
  p.stroke([[404, 645], [434, 645], [404, 680], [434, 712]], 8, "#f4e9c8"); // $ glyph
  p.line([[419, 632], [419, 724]], "#f4e9c8", 8);
};

// ---------------- one character drawing ----------------
type Who = { i: number; o: Outfit; okey: string; wrap?: (p: Pen, o: Outfit, fo: FrontOpts) => void };
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, fo: FrontOpts, scale = 1): Place & { tierKey: string } => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const light = light2D(cam, false), seed = 1 + (who.i % 7);
  const f2: FrontOpts = { ...fo, light, seed };
  const draw = who.wrap ?? ((p: Pen, o: Outfit, f: FrontOpts) => bodyFront(p, o, f));
  const key = `F|${who.okey}|${fkey(f2)}`;
  return {
    key, x, y, z, scale, mirror: false, tierKey: `${w}`,
    draw: (p) => draw(p, who.o, f2),
    size: [w, h, k],
  };
};

// ---------------- contact blobs ----------------
const CONTACT: Record<"day" | "golden", [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  if (LNAME === "day") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h;
    const tc = hexOf(TAIL, k);
    out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c,
      w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc,
    w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};

// ---------------- money + effect drawings ----------------
const fxBill = (p: Pen) => {
  p.poly([[12, 22], [248, 22], [248, 108], [12, 108]], "#e9f1da", 9);
  p.poly([[26, 34], [234, 34], [234, 96], [26, 96]], null, 5);
  p.ell(130, 65, 31, 31, "#cfe2b2", 6);
  p.stroke([[120, 50], [140, 50], [120, 62], [140, 78], [120, 81]], 7, "#4a6b3a");
  p.line([[130, 43], [130, 88]], "#4a6b3a", 7);
  p.ell(42, 65, 13, 13, "#cfe2b2", 5); p.ell(218, 65, 13, 13, "#cfe2b2", 5);
};
const fxPuff = (p: Pen) => {
  p.ell(88, 112, 72, 58, "#d8dce6", 0);
  p.ell(152, 88, 84, 68, "#eef1f6", 0);
  p.ell(208, 122, 62, 50, "#c9cfda", 0);
  p.ell(140, 140, 70, 44, "#dde2ec", 0);
};

// ---------------- staging ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };

const SEAT: V3 = [0.35, 0, -0.15];
const exprFor = (id: number, t: number, st: SceneState): Expr => {
  switch (id) {
    case 2: return t < 8.6 ? "neutral" : t < 13.4 ? "smile_closed" : "nervous";
    case 3: return st.hire > 0.5 ? "grin" : "neutral";
    case 4: return "smile";
    case 5: return "nervous";
    case 6: return t < 23.6 ? "neutral" : "grin";
    case 7: return st.check > 0.5 ? "relief" : "grin";
    case 8: return t < 32.7 ? "relief" : "shock";
    case 9: return "dazed";
    case 11: return "stern";
    default: return "neutral";
  }
};

/** the engineer by shot: seated at the desk (2-9, 11, 13), at the vault in the hook, at the doorway in shot 10 */
const engineer = (id: number, t: number, st: SceneState, cam: CamInfo, out: Stage) => {
  const who: Who = { i: 1, o: ENGINEER, okey: "eng" };
  const blink = lidAt(t, 1);
  if (id === 1) {
    out.places.push(person(cam, who, -3.9, 0, -1.8, { mode: "stand", expr: "shock", blink, look: -1 }));
    blob(out, -3.9, 0, -1.8);
    return;
  }
  if (id === 10) {
    const expr: Expr = st.officeDoor < 0.5 ? "nervous" : "shock";
    out.places.push(person(cam, who, 3.72, 0, -3.32, { mode: "stand", expr, blink, look: 1 }));
    blob(out, 3.72, 0, -3.32);
    return;
  }
  if (id === 12) return;
  const expr = exprFor(id, t, st);
  out.places.push(person(cam, who, SEAT[0], SEAT[1], SEAT[2], { mode: "sit", expr, blink, look: id === 13 ? 0 : -0.4 }));
};

/** hooded hackers: three at the den desk (10e, 12, 13), two waiting behind the office door (10), three walking
 *  out with the money (13) */
const hackers = (id: number, t: number, st: SceneState, cam: CamInfo, out: Stage) => {
  const den: V3[] = [[6.6, 0, -3.02], [8.1, 0, -3.02], [9.6, 0, -3.02]];
  const atDen = id === 10 || id === 12 || id === 13;
  if (atDen && !(id === 10 && st.officeDoor < 0.25)) {
    den.forEach(([x, y, z], i) => {
      const who: Who = { i: 10 + i, o: i === 1 ? HACKER2 : HACKER, okey: `hk${i}`, wrap: hooded };
      const expr: Expr = id === 12 ? (st.ai > 0.6 ? "grin" : "neutral") : "neutral";
      out.places.push(person(cam, who, x, y, z, { mode: "sit", expr, blink: lidAt(t, 10 + i), look: -0.6 }));
    });
  }
  if (id === 10 && st.officeDoor > 0.35) {
    const k = smooth((st.officeDoor - 0.35) / 0.65);
    ([[4.02, -4.95], [4.62, -5.15]] as [number, number][]).forEach(([x, z], i) => {
      const who: Who = { i: 20 + i, o: i ? HACKER2 : HACKER, okey: `hc${i}`, wrap: hooded };
      out.places.push(person(cam, who, x, 0, z, { mode: "stand", expr: "neutral", blink: lidAt(t, 20 + i), look: 0 }, 0.92 + 0.08 * k));
    });
  }
  if (id === 13 && st.walk > 0.01) {
    ([0, 1, 2] as const).forEach((i) => {
      const w = clamp01(st.walk * 1.18 - i * 0.13);
      if (w <= 0.01) return;
      const x = 4.3 + 7.4 * w + (hh(i, 3) - 0.5) * 0.5, z = -3.1 + 4.4 * w + (hh(i, 4) - 0.5) * 0.5;
      const who: Who = { i: 30 + i, o: i === 1 ? HACKER2 : HACKER, okey: `hw${i}`, wrap: hackerBag };
      const phase = q(((t * 1.55 + i * 0.37) % 1), 120);
      out.places.push(person(cam, who, x, 0, z, { mode: "march", phase, expr: "neutral", blink: lidAt(t, 30 + i), look: 0 }));
      blob(out, x, 0, z);
    });
  }
};

/** flying money out of the vault (shots 1 tease + 8) and the vanish puffs */
const money = (id: number, t: number, st: SceneState, out: Stage) => {
  const full = st.money;
  if (full > 0.02) {
    for (let i = 0; i < 16; i++) {
      const u = ((t * 0.5 + hh(i) * 1.7) % 1);
      const pop = Math.min(1, u * 6) * (u > 0.85 ? (1 - u) / 0.15 : 1) * full;
      if (pop <= 0.02) continue;
      const ang = hh(i, 2) * Math.PI * 2, r = 0.6 + u * (2.6 + hh(i, 3) * 3.4);
      const x = -8.2 + Math.cos(ang) * r * 1.15 + u * 1.4;
      const y = 0.8 + u * (2.4 + hh(i, 5) * 1.6) + 0.35 * Math.sin(u * 7 + i);
      const z = -4.0 + u * (2.2 + hh(i, 4) * 2.6);
      out.fx.push({ key: `bill${q(pop, 20)}`, cw: 260, ch: 130, draw: fxBill,
        x, y, z, w: 0.42 * pop * (0.8 + hh(i, 6) * 0.6), h: 0.21 * pop * (0.8 + hh(i, 6) * 0.6),
        rot: (hh(i, 7) - 0.5) * 2 + u * (hh(i, 8) - 0.5) * 4 });
    }
  }
  if (st.vanish > 0.02) {
    for (let i = 0; i < 7; i++) {
      const u = 1 - st.vanish;
      const x = -8.2 + (hh(i, 9) - 0.5) * 4.2 + u * 1.2, y = 1.4 + hh(i, 10) * 2.2 + u * 1.1, z = -3.4 + hh(i, 11) * 3.6;
      out.fx.push({ key: `puff${q(st.vanish, 20)}`, cw: 300, ch: 190, draw: fxPuff,
        x, y, z, w: 1.3 + 0.8 * st.vanish, h: 0.82 + 0.5 * st.vanish, soft: true, rot: (hh(i, 12) - 0.5) * 1.2 });
    }
  }
};

/** everything with a face (and every bill) in shot `id` at time t */
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const st = sceneState(id, t);
  LNAME = SHOTS[id - 1].light;
  findSun(cam, SUN);
  engineer(id, t, st, cam, out);
  hackers(id, t, st, cam, out);
  money(id, t, st, out);
  // test-passed sparkle on the work monitor (shots 7-8)
  if (st.check > 0.02 && id >= 7 && id <= 8) {
    const u = q(st.check, 30);
    out.fx.push({ key: `burst${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, "#b8f0c8", 12, 30, 235), x: 0, y: 1.32, z: -1.22, w: 0.9, h: 0.9 });
  }
  // "there was no new job" glitch stars near the call monitor (shot 9)
  if (id === 9 && st.glitch > 0.05) {
    const u = q((t * 1.4) % 1, 30);
    out.fx.push({ key: `stars${u}`, cw: 420, ch: 210, draw: (p) => fxStars(p, u), x: 1.55, y: 1.72, z: -1.15, w: 0.7, h: 0.35, rot: -0.15 });
  }
  return out;
};

export { FPS };
