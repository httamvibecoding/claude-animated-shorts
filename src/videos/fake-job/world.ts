// The whole fake-job diorama as one three.js scene: sky + sun rig, a ground plaza, ONE back wall at z = -4.28 with
// the VAULT (left, x ~ -8.2) | OFFICE (centre, window over the desk) | DOORWAY (x 4.0) | HACKER DEN (right, x ~ 8.15),
// plus a painted skyline beyond the window. update(id, f, camera) poses everything for shot `id` at frame f: vault
// door swinging open, the office door ("opening the door from within"), three live screens (chat / video call / work
// IDE) redrawn per frame, the AI core takeover, and the flat-card cast + effects from cast.ts.
import * as THREE from "three";
import { lam, V, Kit, kitClone } from "./build";
import { ctex, stoneHD, planksHD, grassHD, cloudHD } from "./paint";
import { TONE, CHAR, untone } from "./shade";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage, CamInfo } from "./cast";
import { FPS, SHOTS, V3, sceneState, SceneState, camAt, ShotDef, Light, FOREGROUND, clamp01, smooth } from "./story";

// ---------------- fallback kit (no external assets: inline geometry stands in for every prop) ----------------
const KENNEY = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree_cone", "tree-high-round", "tree", "plant_bushLarge", "plant_bushDetailed",
  "plant_bush", "hedge", "flower_redA", "flower_yellowA", "flower_purpleA", "grass_large", "grass", "lily_large", "lantern", "cart", "stall-red",
  "stall-green", "stall-bench", "banner-red", "banner-green", "windmill", "canoe"];

const fallbackAsset = (name: string): THREE.Object3D => {
  const root = new THREE.Group();
  const mat = (color: string, emissive = "#000000") => new THREE.MeshLambertMaterial({ color, emissive });
  const addMesh = (geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, ry = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.rotation.y = ry;
    root.add(mesh);
  };

  if (/^tree/.test(name) || name === "tree") {
    addMesh(new THREE.CylinderGeometry(0.22, 0.42, 2.2, 10), mat("#8a5a3c"), 0, 1.1, 0);
    ["#4ea347", "#67b85d", "#5cae4d"].forEach((color, i) => {
      const scale = [1.8, 1.5, 1.25][i] ?? 1.1;
      addMesh(new THREE.SphereGeometry(1.2, 16, 12), mat(color), 0, 2.4 + i * 0.55, 0, scale, 0.9 + i * 0.1, scale, 0.4 * i);
    });
    return root;
  }

  if (/bush|hedge|grass/.test(name)) {
    const color = name.includes("grass") ? "#76b84f" : "#5d9a46";
    const count = name === "hedge" ? 4 : 3;
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * 0.5;
      addMesh(new THREE.SphereGeometry(0.7 + (i % 2) * 0.15, 16, 12), mat(color), x, 0.45, 0, 1.1, 0.9, 1.1, 0.6 * i);
    }
    return root;
  }

  if (/flower/.test(name) || name === "lily_large") {
    addMesh(new THREE.CylinderGeometry(0.05, 0.07, 0.8, 8), mat("#4d8f4d"), 0, 0.4, 0);
    addMesh(new THREE.SphereGeometry(0.18, 10, 10), mat(name.includes("red") ? "#d95d42" : name.includes("yellow") ? "#d7b64a" : "#a66fca"), 0, 0.9, 0);
    return root;
  }

  if (name === "lantern") {
    addMesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8), mat("#6b4c3b"), 0, 0.7, 0);
    addMesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), mat("#f7d87a"), 0, 1.5, 0);
    return root;
  }

  if (name === "cart") {
    addMesh(new THREE.BoxGeometry(1.4, 0.45, 1), mat("#a7683b"), 0, 0.55, 0);
    addMesh(new THREE.BoxGeometry(1.1, 0.7, 0.9), mat("#b97a44"), 0, 1.05, 0);
    for (const x of [-0.7, 0.7]) for (const z of [-0.45, 0.45]) addMesh(new THREE.CylinderGeometry(0.2, 0.2, 0.18, 12), mat("#3a2c2a"), x, 0.18, z);
    return root;
  }

  if (/stall/.test(name)) {
    addMesh(new THREE.BoxGeometry(1.8, 0.28, 1.2), mat(name.includes("red") ? "#b8573d" : name.includes("green") ? "#4d8c5e" : "#a67e5a"), 0, 1.1, 0);
    addMesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), mat("#5a3c2e"), -0.7, 0.55, -0.45);
    addMesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), mat("#5a3c2e"), 0.7, 0.55, -0.45);
    addMesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), mat("#5a3c2e"), -0.7, 0.55, 0.45);
    addMesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), mat("#5a3c2e"), 0.7, 0.55, 0.45);
    return root;
  }

  if (/banner/.test(name)) {
    addMesh(new THREE.PlaneGeometry(1.6, 2.2), mat(name.includes("red") ? "#b75441" : "#5d8d61"), 0, 1.1, 0);
    return root;
  }

  if (name === "windmill") {
    addMesh(new THREE.CylinderGeometry(0.3, 0.4, 2.2, 12), mat("#91887b"), 0, 1.1, 0);
    addMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), mat("#d0b077"), 0, 2.7, 0);
    for (let i = 0; i < 4; i++) addMesh(new THREE.BoxGeometry(1.7, 0.08, 0.25), mat("#d9d2bf"), 0, 2.8, 0, 1, 1, 1, (Math.PI / 2) * i);
    return root;
  }

  if (name === "canoe") {
    addMesh(new THREE.CylinderGeometry(0.4, 0.75, 2.6, 10, 1, true), mat("#918770"), 0, 0.35, 0, 1, 1, 1, Math.PI / 2);
    return root;
  }

  addMesh(new THREE.BoxGeometry(1, 1, 1), mat("#8e9a8a"), 0, 0.5, 0);
  return root;
};

let kitP: Promise<Kit> | null = null;
export const loadKit = () => {
  if (!kitP) {
    kitP = Promise.resolve(Object.fromEntries(KENNEY.map((n) => [n, fallbackAsset(n)])) as Kit);
  }
  return kitP;
};

// ---------------- painted textures ----------------
const billsTex = () => ctex("billsStack", 256, 256, (g, r) => {
  g.fillStyle = "#3d5b2f"; g.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 8; row++) for (let col = 0; col < 4; col++) {
    const x = col * 64 + (row % 2) * 9, y = row * 32;
    g.fillStyle = ["#8fbf6a", "#a8d284", "#7fae5e"][Math.floor(r() * 3)];
    g.fillRect(x + 2, y + 3, 58, 25);
    g.fillStyle = "#e9f1da"; g.fillRect(x + 11, y + 9, 40, 11);
    g.fillStyle = "#4a6b3a"; g.fillRect(x + 27, y + 10, 6, 9);
  }
});
const windowTex = () => ctex("skylineWin", 256, 512, (g, r) => {
  g.fillStyle = "#5c7392"; g.fillRect(0, 0, 256, 512);
  for (let y = 14; y < 500; y += 34) for (let x = 12; x < 246; x += 30) {
    const lit = r() < 0.24;
    g.fillStyle = lit ? "#ffd98a" : "#2e4260";
    g.fillRect(x, y, 18, 22);
  }
});
const clockTex = () => ctex("clock", 256, 256, (g) => {
  g.fillStyle = "#f4f1ea"; g.beginPath(); g.arc(128, 128, 118, 0, 7); g.fill();
  g.strokeStyle = "#241726"; g.lineWidth = 12; g.beginPath(); g.arc(128, 128, 112, 0, 7); g.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.lineWidth = 8; g.beginPath();
    g.moveTo(128 + Math.cos(a) * 92, 128 + Math.sin(a) * 92);
    g.lineTo(128 + Math.cos(a) * 104, 128 + Math.sin(a) * 104); g.stroke();
  }
  g.lineWidth = 12; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + 52, 128 - 18); g.stroke(); // ~10:10
  g.lineWidth = 8; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 - 12, 128 - 62); g.stroke();
});
const yearTex = () => ctex("year2024", 512, 160, (g) => {
  g.fillStyle = "#24344d"; g.fillRect(0, 0, 512, 160);
  g.fillStyle = "#f4e9c8"; g.font = "bold 92px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("2 0 2 4", 256, 84);
});
const walletTex = () => ctex("walletCard", 128, 96, (g) => {
  g.fillStyle = "#c98be0"; g.fillRect(6, 18, 116, 70);
  g.fillStyle = "#8a5bb0"; g.fillRect(6, 40, 116, 12);
  g.fillStyle = "#ffd98a"; g.beginPath(); g.arc(96, 64, 12, 0, 7); g.fill();
  g.strokeStyle = "#241726"; g.lineWidth = 6; g.strokeRect(6, 18, 116, 70);
});

// ---------------- live screens ----------------
type ScreenDraw = (g: CanvasRenderingContext2D, t: number, st: SceneState) => void;
type Screen = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; mat: THREE.MeshBasicMaterial; mesh: THREE.Mesh; draw: ScreenDraw };
const makeScreen = (w: number, h: number, draw: ScreenDraw): Screen => {
  const cv = document.createElement("canvas");
  cv.width = 640; cv.height = 400;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.15, 1.15, 1.15) });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.layers.set(NOINK); // screens are painted faces: the ink pass never outlines them
  return { cv, tex, mat, mesh, draw };
};

const chrome = (g: CanvasRenderingContext2D, title: string) => {
  g.fillStyle = "#141a26"; g.fillRect(0, 0, 640, 400);
  g.fillStyle = "#1d2534"; g.fillRect(0, 0, 640, 36);
  for (const [x, c] of [[22, "#e86a5a"], [46, "#e8c45a"], [70, "#7fd1a8"]] as const) {
    g.fillStyle = c; g.beginPath(); g.arc(x, 18, 7, 0, 7); g.fill();
  }
  g.fillStyle = "#8fa3bf"; g.font = "bold 16px monospace"; g.textAlign = "left"; g.textBaseline = "middle";
  g.fillText(title, 96, 19);
};

/** work IDE: code lines, download bar, test-passed check, backdoor morph, glitch */
const drawWork = (g: CanvasRenderingContext2D, t: number, st: SceneState) => {
  chrome(g, "work_code.py — secure");
  for (let i = 0; i < 11; i++) {
    const y = 70 + i * 28;
    g.fillStyle = "#26314a"; g.fillRect(40, y - 12, 30, 17);
    g.fillStyle = "#5b6b8c"; g.font = "13px monospace"; g.textAlign = "right"; g.fillText(String(1 + i + (Math.floor(t * 0.7) % 9)), 64, y - 3);
    g.fillStyle = ["#7fd1a8", "#8fb8f0", "#d8b46a", "#c98be0"][i % 4];
    g.fillRect(88, y - 8, 130 + ((i * 97) % 250), 9);
    g.fillStyle = "#39466b"; g.fillRect(88 + 130 + ((i * 97) % 250) + 14, y - 8, 60 + ((i * 53) % 90), 9);
  }
  // download bar (coding_test.zip)
  if (t >= 25.3 && t < 29.8) {
    const u = Math.min(1, (t - 25.3) / 3.3);
    g.fillStyle = "#0d1320"; g.fillRect(110, 320, 420, 52);
    g.strokeStyle = "#7de8ff"; g.lineWidth = 3; g.strokeRect(110, 320, 420, 52);
    g.fillStyle = "#26314a"; g.fillRect(128, 340, 384, 14);
    g.fillStyle = "#7fd1a8"; g.fillRect(128, 340, 384 * u, 14);
    g.fillStyle = "#c9d6ea"; g.font = "bold 15px monospace"; g.textAlign = "left";
    g.fillText(`Downloading coding_test.zip  ${Math.round(u * 100)}%`, 128, 330);
  }
  // test passed
  if (st.check > 0.02) {
    const s = 0.6 + 0.4 * st.check;
    g.save(); g.translate(470, 300); g.scale(s, s);
    g.strokeStyle = "#7fd1a8"; g.lineWidth = 16; g.lineCap = "round";
    g.beginPath(); g.moveTo(-42, 0); g.lineTo(-10, 34); g.lineTo(46, -36); g.stroke();
    g.restore();
    g.fillStyle = "#7fd1a8"; g.font = "bold 19px monospace"; g.textAlign = "center";
    if (st.backdoor < 0.5) g.fillText("ALL TESTS PASSED", 320, 372);
  }
  // the backdoor morph: the IDE icon quietly becomes a backdoor
  if (st.backdoor > 0.02) {
    const k = st.backdoor;
    g.save(); g.translate(470, 210);
    g.fillStyle = `rgba(36,23,38,${0.9 * k})`; g.fillRect(-52, -64, 104, 128);
    g.fillStyle = `rgba(125,232,255,${0.85 * k})`;
    g.beginPath(); g.arc(0, -18, 26, 0, 7); g.fill();                 // skull head
    g.fillStyle = "#141a26";
    g.beginPath(); g.arc(-10, -22, 7, 0, 7); g.fill(); g.beginPath(); g.arc(10, -22, 7, 0, 7); g.fill();
    g.fillRect(-16, 8, 32, 22);
    g.fillStyle = `rgba(125,232,255,${0.85 * k})`; g.fillRect(-4, 40, 8, 24); // door knob line
    g.restore();
    g.fillStyle = "#e86a5a"; g.font = "bold 18px monospace"; g.textAlign = "center";
    if (k > 0.55) g.fillText("sys_helper: SWAPPED (backdoor)", 320, 372);
  }
  // glitch slices ("there was no new job")
  if (st.glitch > 0.02) {
    for (let i = 0; i < 6; i++) {
      const y = ((i * 67 + Math.floor(t * 900)) % 380);
      g.fillStyle = i % 2 ? "rgba(125,232,255,0.28)" : "rgba(232,106,90,0.28)";
      g.fillRect(0, y, 640, 10 + (i % 3) * 7);
    }
  }
};

/** recruiter chat: bubbles, the FBI deadpan card, the inbox spinner */
const drawChat = (g: CanvasRenderingContext2D, t: number, st: SceneState) => {
  chrome(g, "SecureChat — Dream Recruiter");
  const bubble = (x: number, y: number, w: number, txt: string, col: string, mine = false) => {
    g.fillStyle = col;
    const r = 16;
    g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + 52 - r); g.quadraticCurveTo(x + w, y + 52, x + w - r, y + 52);
    g.lineTo(x + r, y + 52); g.quadraticCurveTo(x, y + 52, x, y + 52 - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.fill();
    g.fillStyle = mine ? "#eef1f6" : "#141a26"; g.font = "bold 16px sans-serif";
    g.textAlign = "left"; g.fillText(txt, x + 14, y + 31);
  };
  if (st.hire < 0.5 && t > 8.8) {
    g.fillStyle = "#39466b";
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(66 + i * 22, 300, 7, 0, 7); g.fill(); }
  }
  if (st.hire > 0.02) {
    bubble(36, 70, 330, "Dream salary: $450k + equity", "#2f8a4f");
    if (st.hire > 0.6) bubble(36, 136, 380, "Ready to leave your vault job?", "#2f8a4f");
  }
  if (t >= 22.2) bubble(36, 210, 360, "Final step: coding_test.zip", "#2f8a4f");
  if (t >= 20.1 && t < 22.3) {
    g.fillStyle = "#3a1420"; g.fillRect(330, 250, 280, 118);
    g.strokeStyle = "#e86a5a"; g.lineWidth = 4; g.strokeRect(330, 250, 280, 118);
    g.fillStyle = "#e86a5a"; g.font = "bold 19px monospace"; g.textAlign = "center";
    g.fillText("FBI WATCHLIST", 470, 285);
    g.fillStyle = "#7fd1a8"; g.font = "bold 22px monospace";
    g.fillText("YOU: NOT LISTED ✓", 470, 330);
    g.fillStyle = "#8fa3bf"; g.font = "13px monospace";
    g.fillText("(definitely)", 470, 355);
  }
  if (t >= 57.1) {
    g.fillStyle = "#0d1320"; g.fillRect(150, 240, 340, 110);
    g.strokeStyle = "#39466b"; g.lineWidth = 3; g.strokeRect(150, 240, 340, 110);
    g.fillStyle = "#c9d6ea"; g.font = "bold 19px monospace"; g.textAlign = "center";
    g.fillText("Inbox (0 new)", 320, 275);
    g.strokeStyle = "#7de8ff"; g.lineWidth = 6;
    const a = st.refresh * Math.PI * 2;
    g.beginPath(); g.arc(320, 318, 17, a, a + 4.6); g.stroke();
    g.fillStyle = "#5b6b8c"; g.font = "13px monospace";
    g.fillText("refreshing...", 320, 340);
  }
};

/** video call: the polite recruiter (later revealed as a hood), the five-years question, the AI takeover status */
const drawCall = (g: CanvasRenderingContext2D, t: number, st: SceneState) => {
  chrome(g, "Video Call — Future Employers");
  const bw = 300, bh = 240, bx = 170, by = 66;
  g.fillStyle = "#0d1320"; g.fillRect(bx, by, bw, bh);
  g.strokeStyle = "#39466b"; g.lineWidth = 4; g.strokeRect(bx, by, bw, bh);
  const cx = bx + bw / 2;
  const glitched = st.glitch > 0.25 || (id10(t));
  if (glitched) {
    // the polite recruiter is a hooded hacker
    g.fillStyle = "#242a36";
    g.beginPath(); g.moveTo(cx - 92, by + 225); g.lineTo(cx - 78, by + 96); g.quadraticCurveTo(cx, by + 22, cx + 78, by + 96);
    g.lineTo(cx + 92, by + 225); g.fill();
    g.fillStyle = "#12151b"; g.beginPath(); g.ellipse(cx, by + 118, 56, 62, 0, 0, 7); g.fill();
    g.fillStyle = "#7de8ff";
    g.beginPath(); g.ellipse(cx - 22, by + 112, 11, 7, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(cx + 22, by + 112, 11, 7, 0, 0, 7); g.fill();
    g.fillStyle = "#e86a5a"; g.font = "bold 20px monospace"; g.textAlign = "center";
    g.fillText("NO NEW JOB.", cx, by + 268);
  } else {
    // the polite recruiter bust
    g.fillStyle = "#f5c9a0";
    g.beginPath(); g.arc(cx, by + 96, 58, 0, 7); g.fill();
    g.fillStyle = "#5a3b2a";
    g.beginPath(); g.arc(cx, by + 72, 58, Math.PI, 0); g.fill();
    g.fillRect(cx - 58, by + 72, 116, 18);
    g.fillStyle = "#241726";
    g.beginPath(); g.arc(cx - 20, by + 98, 7, 0, 7); g.fill();
    g.beginPath(); g.arc(cx + 20, by + 98, 7, 0, 7); g.fill();
    g.strokeStyle = "#241726"; g.lineWidth = 6; g.lineCap = "round";
    g.beginPath(); g.arc(cx, by + 112, 24, 0.35, Math.PI - 0.35); g.stroke();
    g.fillStyle = "#8c3b4a";
    g.beginPath(); g.moveTo(cx - 105, by + 235); g.quadraticCurveTo(cx - 82, by + 150, cx, by + 148);
    g.quadraticCurveTo(cx + 82, by + 150, cx + 105, by + 235); g.fill();
    g.fillStyle = "#c9d6ea"; g.font = "15px sans-serif"; g.textAlign = "center";
    g.fillText("HR — Future Employers", cx, by + 262);
    if (t >= 14.4 && t < 20.3) {
      g.fillStyle = "rgba(13,19,32,0.92)"; g.fillRect(60, 330, 520, 48);
      g.fillStyle = "#eef1f6"; g.font = "bold 19px sans-serif";
      g.fillText('"Where do you see yourself in five years?"', 320, 358);
    }
  }
  // internal-AI takeover status
  if (t >= 52.5 && t < 57.2) {
    const u = st.ai;
    g.fillStyle = "#3a1420"; g.fillRect(80, 316, 480, 64);
    g.strokeStyle = "#e86a5a"; g.lineWidth = 3; g.strokeRect(80, 316, 480, 64);
    g.fillStyle = "#e86a5a"; g.font = "bold 18px monospace"; g.textAlign = "left";
    g.fillText("AI: WALLET ACCESS", 100, 340);
    g.fillStyle = "#26314a"; g.fillRect(100, 352, 420, 14);
    g.fillStyle = "#e86a5a"; g.fillRect(100, 352, 420 * u, 14);
    g.fillStyle = "#ffd98a"; g.textAlign = "right";
    g.fillText(u >= 1 ? "GRANTED" : `${Math.round(u * 100)}%`, 540, 340);
  }
};
const id10 = (t: number) => t >= 37.9 && t < 39.6;

/** den monitors: scrolling code columns */
const drawDen = (g: CanvasRenderingContext2D, t: number) => {
  g.fillStyle = "#0a0e18"; g.fillRect(0, 0, 640, 400);
  for (let i = 0; i < 13; i++) {
    const y = 30 + i * 28, off = Math.floor(t * 26 + i * 17);
    g.fillStyle = ["#2b6a8f", "#7de8ff", "#3c8f6a", "#8f6a3c"][i % 4];
    for (let c = 0; c < 4; c++) g.fillRect(24 + c * 152 + ((off * 7 + i * 31) % 40), y - 8, 70 + ((off + i * 53) % 70), 9);
  }
  g.fillStyle = "rgba(125,232,255,0.10)"; g.fillRect(0, (t * 60) % 400, 640, 26);
};

// ---------------- world ----------------
type Mats = Record<string, THREE.Material>;

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight; private fill: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private fgs: { o: THREE.Object3D; a: number; b: number }[] = [];
  private vaultDoor = new THREE.Group();
  private officeDoor = new THREE.Group();
  private screens: Screen[] = [];
  private denScreens: { tex: THREE.CanvasTexture; cv: HTMLCanvasElement }[] = [];
  private aiCore: THREE.Mesh; private aiRing1: THREE.Mesh; private aiRing2: THREE.Mesh;
  private wallets: THREE.Mesh[] = [];
  private aiLight: THREE.PointLight;
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root, M: Mats = {};
    // ---- sky + light (kept from the bridge kit) ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    const discTex = () => ctex("sunDisc", 128, 128, (g) => {
      const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    });
    const haloTex = () => ctex("sunHalo", 256, 256, (g) => {
      const im = g.createImageData(256, 256);
      for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
        const u = Math.hypot(x - 127.5, y - 127.5) / 128;
        const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
        const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
      }
      g.putImageData(im, 0, 0);
    });
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true,
      transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    this.fill = new THREE.DirectionalLight("#9fb8ff", 0.35);
    R.add(this.hemi, this.sun, this.sun.target, this.fill, this.fill.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- materials + ground ----
    M.grass = lam("grassHD", () => ({ map: grassHD() }));
    M.floor = lam("planksHD", () => ({ map: planksHD() }));
    M.wall = lam("officeWall", () => ({ map: stoneHD("officeWall", ["#d8cfc2", "#cfc5b6", "#e0d7ca", "#c6bcaa"], "#a99e8f") }));
    M.vaultWall = lam("vaultWall", () => ({ map: stoneHD("vaultWall", ["#9aa7b8", "#8f9daf", "#a6b2c2", "#8794a6"], "#6c7889") }));
    M.dark = lam("denDark", () => ({ color: "#1c222e" }));
    M.steel = lam("steel", () => ({ color: "#7d8088" }));
    M.gold = lam("gold", () => ({ color: "#e8b64c", emissive: "#7a5a1a" }));
    M.bills = lam("bills", () => ({ map: billsTex() }));
    M.desk = lam("deskWood", () => ({ map: planksHD(), color: "#c9a06a" }));
    M.black = lam("screenFrame", () => ({ color: "#2a2f3a" }));

    const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material, yaw = 0) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      mesh.position.set(x, y, z); mesh.rotation.y = yaw;
      mesh.castShadow = true; mesh.receiveShadow = true;
      R.add(mesh);
      return mesh;
    };

    // ground plaza + office floor slab
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), M.grass);
    grass.rotation.x = -Math.PI / 2; grass.position.y = -0.02; grass.receiveShadow = true; R.add(grass);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(23.2, 8.3), M.floor);
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.015, -1.55); floor.receiveShadow = true; R.add(floor);

    // ---- back wall (z = -4.28) with window + doorway ----
    const WZ = -4.28, WH = 3.15;
    box(5.8, WH, 0.22, -8.5, WH / 2, WZ, M.vaultWall);            // vault section x [-11.4, -5.6]
    box(2.85, WH, 0.22, -4.17, WH / 2, WZ, M.wall);               // x [-5.6, -2.75]
    box(5.5, 1.15, 0.22, 0, 1.15 / 2, WZ, M.wall);                // under window x [-2.75, 2.75]
    box(5.5, WH - 2.75, 0.22, 0, 2.75 + (WH - 2.75) / 2, WZ, M.wall); // over window
    box(0.7, WH, 0.22, 3.1, WH / 2, WZ, M.wall);                  // x [2.75, 3.45]
    box(1.0, WH - 2.15, 0.22, 4.0, 2.15 + (WH - 2.15) / 2, WZ, M.wall); // over doorway
    box(0.95, WH, 0.22, 5.02, WH / 2, WZ, M.wall);                // x [4.55, 5.5]
    box(5.9, WH, 0.22, 8.45, WH / 2, WZ, M.dark);                 // den section x [5.5, 11.4]
    // window frame + glass + sill
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(5.3, 1.52), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.72, 0.84, 1.0), transparent: true, opacity: 0.16 }));
    glass.position.set(0, 1.96, WZ + 0.02); glass.layers.set(NOINK); R.add(glass);
    box(5.5, 0.1, 0.3, 0, 1.17, WZ + 0.05, M.desk);               // sill
    box(5.5, 0.1, 0.3, 0, 2.74, WZ + 0.05, M.desk);
    box(0.1, 1.62, 0.3, -2.72, 1.96, WZ + 0.05, M.desk);
    box(0.1, 1.62, 0.3, 2.72, 1.96, WZ + 0.05, M.desk);
    box(0.08, 1.56, 0.12, 0, 1.96, WZ + 0.06, M.desk);
    // "2024" plaque + wall clock
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.53), new THREE.MeshBasicMaterial({ map: yearTex(), color: 0xd0d0d0 }));
    plaque.position.set(-3.95, 2.35, WZ + 0.13); plaque.layers.set(NOINK); R.add(plaque);
    const clock = new THREE.Mesh(new THREE.CircleGeometry(0.38, 28), new THREE.MeshBasicMaterial({ map: clockTex(), color: 0xe8e8e8 }));
    clock.position.set(2.15, 2.4, WZ + 0.13); clock.layers.set(NOINK); R.add(clock);

    // ---- skyline beyond the window ----
    const winTex = windowTex();
    for (let i = 0; i < 9; i++) {
      const h = 6 + ((i * 37) % 11), x = -21 + i * 5.2 + ((i * 13) % 3), z = -13.5 - (i % 3) * 4.4;
      const b = new THREE.Mesh(new THREE.BoxGeometry(3.6 + (i % 3), h, 3.4), new THREE.MeshLambertMaterial({ map: winTex }));
      b.position.set(x, h / 2 - 0.1, z); b.castShadow = true; b.receiveShadow = true; R.add(b);
    }

    // ---- the VAULT (left) ----
    const recess = box(3.6, 3.1, 1.1, -8.2, 1.55, -4.85, M.dark); recess.receiveShadow = true;
    // money stacks inside the recess
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      const s = box(0.78, 0.52, 0.62, -9.25 + c * 1.02, 0.3 + r * 0.54, -4.95, M.bills);
      s.rotation.y = (c - 1) * 0.06;
    }
    for (const [x, y] of [[-8.2, 2.5], [-8.95, 2.5], [-7.45, 2.5]] as const) box(0.62, 0.3, 0.5, x, y, -4.95, M.gold);
    // vault door: hinge at x = -9.95, swings toward the room
    this.vaultDoor.position.set(-9.95, 0, -4.12);
    const vdoor = new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.72, 0.24, 40), M.steel);
    vdoor.rotation.x = Math.PI / 2;
    vdoor.position.set(1.75, 1.85, 0);
    vdoor.castShadow = true; vdoor.receiveShadow = true;
    this.vaultDoor.add(vdoor);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const sp = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.16, 0.12), M.steel);
      sp.position.set(1.75 + Math.cos(a) * 0.72, 1.85 + Math.sin(a) * 0.72, 0.16);
      sp.rotation.z = a;
      sp.castShadow = true;
      this.vaultDoor.add(sp);
    }
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.075, 10, 28), M.steel);
    wheel.position.set(1.75, 1.85, 0.24); wheel.castShadow = true;
    this.vaultDoor.add(wheel);
    for (let i = 0; i < 4; i++) {
      const sp2 = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.07, 0.07), M.steel);
      sp2.position.copy(wheel.position); sp2.rotation.z = (i / 4) * Math.PI;
      this.vaultDoor.add(sp2);
    }
    R.add(this.vaultDoor);

    // ---- the OFFICE (centre) ----
    box(3.4, 0.07, 1.25, 0, 0.75, -1.15, M.desk);                  // desk top
    box(3.4, 0.55, 0.08, 0, 0.45, -1.72, M.desk);                  // modesty panel
    for (const [x, z] of [[-1.55, -0.62], [1.55, -0.62], [-1.55, -1.68], [1.55, -1.68]] as const) box(0.1, 0.72, 0.1, x, 0.36, z, M.steel);
    // chair (simple office chair under the engineer card at (0.35, 0, -0.15))
    box(0.56, 0.09, 0.56, 0.35, 0.42, -0.15, M.black);
    box(0.56, 0.85, 0.09, 0.35, 0.85, -0.42, M.black);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 10), M.steel);
    post.position.set(0.35, 0.2, -0.15); post.castShadow = true; R.add(post);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      box(0.34, 0.05, 0.07, 0.35 + Math.cos(a) * 0.17, 0.045, -0.15 + Math.sin(a) * 0.17, M.steel, -a);
    }
    // monitors (screens face +z, angled toward the engineer)
    const mkMonitor = (x: number, yaw: number, w: number, h: number, screen: Screen) => {
      box(w + 0.09, h + 0.09, 0.07, x, 1.32, -1.34, M.black, yaw);
      screen.mesh.position.set(x, 1.32, -1.34);
      screen.mesh.rotation.y = yaw;
      screen.mesh.translateZ(0.045);
      R.add(screen.mesh);
      box(0.09, 0.42, 0.09, x, 1.02, -1.36, M.steel, yaw);
      box(0.42, 0.045, 0.3, x, 0.8, -1.3, M.steel, yaw);
    };
    const scrWork = makeScreen(1.24, 0.78, drawWork);
    const scrChat = makeScreen(1.02, 0.64, drawChat);
    const scrCall = makeScreen(1.02, 0.64, drawCall);
    this.screens.push(scrWork, scrChat, scrCall);
    mkMonitor(0, 0, 1.32, 0.86, scrWork);
    mkMonitor(-1.22, 0.35, 1.1, 0.72, scrChat);
    mkMonitor(1.22, -0.35, 1.1, 0.72, scrCall);
    // keyboard, mug, papers, plant
    box(0.62, 0.035, 0.22, 0.35, 0.8, -0.72, M.black);
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.16, 14), lam("mug", () => ({ color: "#c95d4a" })));
    mug.position.set(1.18, 0.86, -0.88); mug.castShadow = true; R.add(mug);
    box(0.3, 0.012, 0.4, -1.2, 0.795, -0.85, lam("paper", () => ({ color: "#f2efe8" })), 0.35);
    const plant = kitClone(kit, "plant_bushDetailed", 0.9);
    if (plant) { plant.position.set(-2.35, 0, -2.0); plant.traverse((o) => { o.castShadow = true; o.receiveShadow = true; }); R.add(plant); }

    // ---- the DOORWAY + corridor alcove ----
    this.officeDoor.position.set(3.46, 0, WZ);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.08, 2.12, 0.07), M.desk);
    panel.position.set(0.54, 1.07, 0); panel.castShadow = true; panel.receiveShadow = true;
    this.officeDoor.add(panel);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), M.steel);
    knob.position.set(0.97, 1.07, 0.09); this.officeDoor.add(knob);
    R.add(this.officeDoor);
    box(1.7, 2.3, 0.12, 4.18, 1.15, -5.75, M.dark);               // alcove back
    box(0.12, 2.3, 1.5, 3.28, 1.15, -5.0, M.dark);                // alcove sides
    box(0.12, 2.3, 1.5, 5.08, 1.15, -5.0, M.dark);
    box(1.9, 0.06, 1.6, 4.18, 2.32, -5.0, M.dark);

    // ---- the HACKER DEN (right) ----
    box(5.2, 0.07, 1.15, 8.3, 0.75, -3.45, M.dark);               // den desk
    for (const x of [5.9, 8.3, 10.7]) box(0.09, 0.72, 0.09, x, 0.36, -3.1, M.steel);
    const denMon = (x: number) => {
      box(1.12, 0.72, 0.07, x, 1.32, -3.62, M.black);
      const cv = document.createElement("canvas"); cv.width = 640; cv.height = 400;
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.62), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.1, 1.15, 1.2) }));
      m.position.set(x, 1.32, -3.585); m.layers.set(NOINK);
      R.add(m);
      this.denScreens.push({ cv, tex });
    };
    denMon(6.6); denMon(8.1); denMon(9.6);
    // server racks with LED strips
    for (const x of [5.85, 10.95]) {
      box(0.8, 2.1, 0.7, x, 1.05, -3.85, M.black);
      const leds = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.8), new THREE.MeshBasicMaterial({
        map: ctex("leds" + x, 64, 192, (g) => {
          g.fillStyle = "#141a26"; g.fillRect(0, 0, 64, 192);
          for (let y = 10; y < 190; y += 16) { g.fillStyle = y % 32 ? "#7de8ff" : "#e8c45a"; g.fillRect(8, y, 48, 7); }
        }), color: new THREE.Color(1.3, 1.35, 1.4),
      }));
      leds.position.set(x, 1.05, -3.49); leds.layers.set(NOINK); R.add(leds);
    }
    // AI core: emissive orb + rings + orbiting wallet cards on a pedestal
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.45, 18), M.steel);
    ped.position.set(8.15, 1.0, -3.35); ped.castShadow = true; R.add(ped);
    this.aiCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.1, 1.5) }));
    this.aiCore.position.set(8.15, 1.72, -3.35); this.aiCore.layers.set(NOINK); R.add(this.aiCore);
    this.aiRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.028, 8, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.55, 1.15) }));
    this.aiRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.022, 8, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.3, 1.0) }));
    for (const [m, rx] of [[this.aiRing1, 0.5], [this.aiRing2, -0.9]] as const) {
      m.position.copy(this.aiCore.position); m.rotation.x = rx; m.layers.set(NOINK); R.add(m);
    }
    for (let i = 0; i < 4; i++) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.22), new THREE.MeshBasicMaterial({ map: walletTex(), color: new THREE.Color(1.4, 1.35, 1.3), side: THREE.DoubleSide }));
      w.layers.set(NOINK); R.add(w); this.wallets.push(w);
    }
    this.aiLight = new THREE.PointLight("#ffd98a", 0, 7, 1.8);
    this.aiLight.position.copy(this.aiCore.position); R.add(this.aiLight);

    // ---- foreground framing props ----
    for (const fg of FOREGROUND) {
      const o = kitClone(kit, fg.kit, fg.s ?? 1);
      if (!o) continue;
      o.position.set(...fg.pos); o.rotation.y = fg.yaw ?? 0; o.visible = false;
      this.fgs.push({ o, a: fg.a, b: fg.b }); R.add(o);
    }
  }

  /** camera-relative sun, frozen per shot (the shot's mean view direction turned by az toward screen right) */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(L.az), el = THREE.MathUtils.degToRad(L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], st = sceneState(id, t), L = LIGHTS[s.light];
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 40);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    this.fill.intensity = 0;
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term;
    TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun disc, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    // ---- story props: doors, screens, AI core ----
    this.vaultDoor.rotation.y = -1.9 * st.vaultDoor;
    this.officeDoor.rotation.y = -1.72 * st.officeDoor;
    for (const scr of this.screens) {
      const g = scr.cv.getContext("2d")!;
      scr.draw(g, t, st);
      scr.tex.needsUpdate = true;
    }
    for (const d of this.denScreens) {
      const g = d.cv.getContext("2d")!;
      drawDen(g, t + (d.cv.width % 7) * 0.31);
      d.tex.needsUpdate = true;
    }
    const aiK = st.ai;
    const pulse = 1 + 0.1 * Math.sin(t * 5.2) * aiK;
    this.aiCore.scale.setScalar((0.55 + 0.55 * aiK) * pulse);
    this.aiRing1.scale.setScalar(0.6 + 0.75 * aiK);
    this.aiRing2.scale.setScalar(0.55 + 0.9 * aiK);
    this.aiRing1.rotation.z = t * 1.4 * (0.3 + aiK); this.aiRing2.rotation.z = -t * 1.1 * (0.3 + aiK);
    this.aiLight.intensity = 26 * aiK;
    for (let i = 0; i < this.wallets.length; i++) {
      const w = this.wallets[i], a = t * (0.7 + 1.6 * aiK) + (i / this.wallets.length) * Math.PI * 2;
      const r = 0.85 + 0.55 * aiK + 0.12 * Math.sin(t * 2 + i);
      w.position.set(this.aiCore.position.x + Math.cos(a) * r, this.aiCore.position.y + 0.16 * Math.sin(t * 1.7 + i * 2), this.aiCore.position.z + Math.sin(a) * r * 0.6);
      w.lookAt(cam.position);
      w.visible = aiK > 0.03;
    }
    // ---- foreground framing objects ----
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.a < s.b && g.b > s.a;
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const stg = stage(id, t, { pos: cam.position, right });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const tint = s.light === "golden" ? "#ffcf9e" : "#ffffff";
    let ai = 0;
    const used: Actor[] = [];
    for (const p of stg.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      if (a.mat.emissiveMap) a.mat.emissive.set(tint);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of stg.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft);
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1);
      fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
    return focus;
  }
}
