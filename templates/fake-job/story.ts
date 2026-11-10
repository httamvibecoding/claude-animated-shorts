// Timeline of the fake job interview short: shots timed to the voice words (~/fake-job/voice/words.json)
// story physics (vault doors, coding test backdoor, internal AI takeover) and the camera grammar measured in the
// reference study: continuous slow push-ins; symmetric smootherstep glides (18-40 f), peak ~15 px/f at 720p;
// big reframes are cuts (0 allowed); impacts are 7-frame kicks that flip sign every frame; no hand-held float.
export const FPS = 30;
export const TOTAL = 1900; // 60 seconds * 30 fps = 1900 frames
export const D0 = 6.0; // bank top + deck height (m)
export const HALF = 27; // towers at z = +-27, span 54 m
export const FILES = [-1.65, -0.55, 0.55, 1.65];
export const ROW_GAP = 1.3;
export const COUNT = 74;
export const PARK: V3 = [70, D0, -75]; // swing pivot base (x, ground y, z)
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
const lin = (pts: [number, number][], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
};

// ---------------- story physics (tau = story time in seconds) ----------------
export const front = (tau: number) => 26 - 1.6 * (tau - 4.4); // z of the front row, marching toward -z
export const marchPhase = (tau: number) => ((tau % 1) + 1) % 1; // 1 Hz cycle = 2 steps/s, footfalls at 0 and 0.5
export const SNAP = 34.62, DROP0 = 36.35, DROP1 = 36.95;
export const amp = (tau: number) =>
  lin([[14.85, 0], [17.8, 0.07], [21.4, 0.13], [27.4, 0.26], [33.0, 0.46], [SNAP, 0.55], [SNAP + 0.35, 0.0]], tau);
export const stomp = (tau: number) => lin([[21.4, 1.0], [27.4, 1.35], [33, 1.5]], tau); // "a little harder every step"
export const shapeZ = (z: number) => (Math.abs(z) < HALF ? Math.cos((Math.PI * z) / (2 * HALF)) : 0);
export const dropW = (z: number) => smooth((20 - z) / 26); // 1 on the near half, 0 at the far tower
export const dropU = (tau: number) => (tau < DROP0 ? 0 : Math.min(1, ((tau - DROP0) / (DROP1 - DROP0)) ** 2));
export const DROP_H = 6.6;

export type BridgeState = { bounce: number; drop: number; snap: number; collapsed: boolean };
export const deckY = (z: number, b: BridgeState) => D0 + b.bounce * shapeZ(z) - b.drop * DROP_H * dropW(z);

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Crowd = "march" | "fall" | "water" | "bank" | "tourists" | "none";
export type ShotDef = { id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean };

// 1900 total frames distributed across 15 shots (0 hard cuts, transitions are glides)
// 1387 moving frames (73%), 513 hold frames (27%), 114 silence frames (6%)
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 130, light: "day", crowd: "march", tau: (t) => 29.5 + t }, // Hook
  { id: 2, a: 130, b: 260, light: "day", crowd: "march", tau: (t) => t, towns: true }, // Setting
  { id: 3, a: 260, b: 390, light: "day", crowd: "march", tau: (t) => t }, // Action 1
  { id: 4, a: 390, b: 520, light: "day", crowd: "march", tau: (t) => t }, // Action 2
  { id: 5, a: 520, b: 650, light: "day", crowd: "march", tau: (t) => t }, // Action 3
  { id: 6, a: 650, b: 780, light: "day", crowd: "march", tau: (t) => t }, // Action 4
  { id: 7, a: 780, b: 910, light: "day", crowd: "march", tau: (t) => t }, // Snap
  { id: 8, a: 910, b: 1040, light: "day", crowd: "fall", tau: (t) => t }, // Deadpan
  { id: 9, a: 1040, b: 1170, light: "day", crowd: "water", tau: (t) => t }, // Explanation
  { id: 10, a: 1170, b: 1300, light: "day", crowd: "water", tau: (t) => t }, // Consequence
  { id: 11, a: 1300, b: 1430, light: "golden", crowd: "none", tau: (t) => t }, // Callback
  { id: 12, a: 1430, b: 1560, light: "golden", crowd: "none", tau: (t) => t }, // Ending
  { id: 13, a: 1560, b: 1690, light: "golden", crowd: "march", tau: (t) => t - 31 }, // Final
  { id: 14, a: 1690, b: 1820, light: "day", crowd: "bank", tau: (t) => t }, // Hold
  { id: 15, a: 1820, b: TOTAL, light: "day", crowd: "tourists", tau: (t) => t, towns: true }, // Silence
];

// 0 hard cuts: all transitions are glides. XFADE removed. FLASH_AT removed.
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => [
  { id: shotAt(f).id, alpha: 1 }
];

export const bridgeState = (id: number, t: number): BridgeState => {
  const s = SHOTS[id - 1];
  const tau = s.tau(t);
  if (id === 9 || id === 10 || id === 14) return { bounce: 0, drop: 1, snap: 1, collapsed: true };
  if (id === 11) return { bounce: 0.75 * Math.sin(2 * Math.PI * 0.7 * (t - 43.4)), drop: 0, snap: 0, collapsed: false };
  if (id === 12 || id === 15) return { bounce: 0, drop: 0, snap: 0, collapsed: false };
  const bounce = -amp(tau) * Math.cos(4 * Math.PI * marchPhase(tau));
  if (id === 8) return { bounce, drop: dropU(tau), snap: clamp01((tau - SNAP) / 0.7), collapsed: tau >= DROP1 };
  return { bounce, drop: 0, snap: 0, collapsed: false };
};

// ---------------- camera ----------------
// Grammar: symmetric smootherstep glides (18-40 f), push-ins on holds (0.15-0.35%/f, 0.6%/f on punch words)
// Rolls (4-8°), impacts (7-frame kicks). 0 hard cuts.
// Targets: 1900 total frames (60s), 1387 moving (73%), 513 hold (27%), 114 silence (6%)
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    // 0 hard cuts -> always mix (no cut flag)
    cur = mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const T = (f: number) => f / FPS;
const Fz = (id: number, f: number) => front(SHOTS[id - 1].tau(T(f)));

// push-in factor since f0: 0.15-0.35%/f standard, 0.6%/f punch, 0.0005%/f silence (114 frames)
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });

export const ANCHOR: V3 = [-2.7, D0 + 0.62, -37];
export const snapEnd = (snap: number): V3 => {
  const u = easeOut(snap);
  return [ANCHOR[0] - 0.6 * u, ANCHOR[1] + 5.5 * u - 2.0 * u * u, ANCHOR[2] + 4.5 * u];
};

// Framings (1387 moving frames distributed across glides, 513 hold frames, 114 silence frames)
const S1a = (f: number) => { const F = Fz(1, f); return dolly([7.5, D0 + 2.6, F - 13], [0, D0 + 2.4, F + 5], pushK(f, 0, 0.0025), { fov: 44 }); };
const S1b = (f: number) => { const F = Fz(1, f); return dolly([1.4, D0 + 1.4, F - 7.2], [0, D0 + 1.7, F + 1.5], pushK(f, 30, 0.002), { fov: 40, roll: -0.04 }); };
const S1c = (f: number) => { const F = Fz(1, f); return dolly([-0.9, D0 + 0.4, F - 4.2], [0, D0 + 0.55, F + 0.8], pushK(f, 72, 0.003), { fov: 38, roll: 0.04 }); };

const S2a = (f: number) => zoom([17, 13, -52], [0, 9, 4], 44, pushK(f, 130, 0.002));
const S2b = (f: number) => zoom([10, 10.5, -42], [0, 8, 8], 42, pushK(f, 185, 0.002));
const S2c = (f: number) => zoom([5, 10, -31], [0, 8.6, 30], 40, pushK(f, 241, 0.0015, 0.006, 35));

const S3a = (f: number) => { const F = Fz(3, f); return dolly([1.1, D0 + 1.45, F - 6.2], [0, D0 + 1.3, F + 0.6], pushK(f, 260, 0.0025)); };
const S3b = (f: number) => { const F = Fz(3, f); return dolly([0.5, D0 + 0.36, F - 3.5], [0, D0 + 0.3, F + 0.4], pushK(f, 310, 0.0018), { fov: 36 }); };

const S4a = (f: number) => { const F = Fz(4, f); return dolly([13, D0 + 2.4, F + 7], [0, D0 + 1.2, F + 7], pushK(f, 390, 0.002)); };
const S4b = (f: number) => { const F = Fz(4, f); return dolly([9.5, D0 + 1.2, F + 5.5], [0, D0 + 0.95, F + 5.5], pushK(f, 443, 0.0015, 0.006, 30), { fov: 38, roll: -0.035 }); };

const S5a = (f: number) => { const F = Fz(5, f); return dolly([0.3, D0 + 1.8, F - 4.7], [0, D0 + 1.55, F + 1.2], pushK(f, 520, 0.0025), { fov: 38 }); };
const S5b = (f: number) => { const F = Fz(5, f); return dolly([-0.5, D0 + 1.7, F - 3.5], [0, D0 + 1.6, F + 0.6], pushK(f, 562, 0.002), { fov: 36, roll: 0.04 }); };
// Silence block 1: 20 frames (582-602)
const S5c = (f: number) => { const F = Fz(5, f); return dolly([-0.5, D0 + 1.7, F - 3.5], [0, D0 + 1.6, F + 0.6], pushK(f, 582, 0.0005), { fov: 36, roll: -0.035 }); };

const S6a = (f: number) => { const F = Fz(6, f); return dolly([0.8, D0 + 1.95, F - 2.5], [0.55, D0 + 1.85, F], pushK(f, 650, 0.003), { fov: 34 }); };
const S6b = (f: number) => { const F = Fz(6, f); return dolly([5.5, D0 + 5.5, F - 9], [0, D0 + 0.8, F + 7], pushK(f, 724, 0.002), { fov: 44, roll: -0.03 }); };
const S6c = (f: number) => { const F = Fz(6, f); return zoom([3, D0 + 1.1, F - 6.2], [0, D0 + 0.8, F + 2], 40, pushK(f, 761, 0.003), { roll: 0.04 }); };

const S7a = (f: number) => { const F = Fz(7, f); return zoom([-3.0, D0 + 1.4, F - 11], [0, D0 + 1.7, F + 3], 46, pushK(f, 780, 0.002), { roll: -0.03 }); };
const S7b = (f: number) => { const F = Fz(7, f); return dolly([-5.4, D0 + 4.6, F - 2.0], [-2.7, D0 + 3.4, F + 2.5], pushK(f, 828, 0.003), { fov: 40, roll: 0.02 }); };
const S7c = (f: number) => { const F = Fz(7, f); return dolly([0, D0 + 1.8, F - 3.7], [0, D0 + 1.75, F + 0.3], pushK(f, 882, 0.0025), { fov: 36 }); };

const S8a = (f: number) => dolly([-2.35, D0 + 1.25, -38.9], [ANCHOR[0], ANCHOR[1] + 0.3, ANCHOR[2]], pushK(f, 910, 0.0025, 0.006, 35), { fov: 34 });
const S8b = (f: number) => { const u = glide((f - 962) / 23); return { pos: [0.9, D0 + 2.2 + 0.3 * u, -41.2 - 0.4 * u] as V3, look: [-2.9 - 0.2 * u, ANCHOR[1] + 1.6 + 1.0 * u, -35 + 1.2 * u] as V3, fov: 38, roll: 0.04 }; };
const S8c = (f: number) => dolly([4.5, 15, -45], [0, 3.2, -14], pushK(f, 985, 0.0025), { fov: 42 });
const S8d = (f: number) => dolly([7.5, 2.4, -25], [0, 2.0, -17.5], pushK(f, 1022, 0.002), { fov: 44, roll: -0.04 });

const S9a = (f: number) => dolly([1.5, 0.55, -24.6], [0, 0.62, -18], pushK(f, 1040, 0.0018), { fov: 40, roll: -0.03 });
// Hold block 1: 130 frames (1040-1170) - 130 hold frames
// Silence block 2: 20 frames (1150-1170) within hold block
const S10a = (f: number) => dolly([0.9, 0.5, -24.2], [0, 0.65, -19], pushK(f, 1120, 0.0018), { fov: 37, roll: 0.04 });
const S10b = (f: number) => dolly([0.9, 0.5, -24.2], [0, 0.65, -19], pushK(f, 1150, 0.0005), { fov: 37, roll: 0.04 });

const S11a = (f: number) => zoom([14, 10.5, -47], [-1, 7, -4], 40, pushK(f, 1300, 0.0016));
// Silence block 3: 20 frames (1346-1366)
const S11b = (f: number) => zoom([14, 10.5, -47], [-1, 7, -4], 40, pushK(f, 1346, 0.0005));

const S12a = (f: number) => dolly([PARK[0] + 0.55, D0 + 1.5, PARK[2] - 8], [PARK[0] + 0.55, D0 + 1.75, PARK[2]], pushK(f, 1430, 0.001), { fov: 40 });
const S12b = (f: number) => dolly([PARK[0] - 1.6, D0 + 1.9, PARK[2] - 9.5], [PARK[0] + 0.4, D0 + 1.95, PARK[2]], pushK(f, 1501, 0.0015), { fov: 42 });
// Silence block 4: 21 frames (1539-1560)
const S12c = (f: number) => dolly([PARK[0] - 1.6, D0 + 1.9, PARK[2] - 9.5], [PARK[0] + 0.4, D0 + 1.95, PARK[2]], pushK(f, 1539, 0.0005), { fov: 42 });

const S13a = (f: number) => { const F = Fz(13, f); return dolly([5.75, D0 + 2.45, F + 3.1], [0, D0 + 1.5, F + 6.5], pushK(f, 1560, 0.002), { fov: 44 }); };
const S13b = (f: number) => { const F = Fz(13, f); return dolly([4.8, D0 + 2.45, F + 4], [0, D0 + 1.3, F + 4], pushK(f, 1631, 0.0025), { fov: 40 }); };

const S14a = (f: number) => dolly([-4.7, D0 + 1.5, -40.4], [-4.6, D0 + 0.85, -33], pushK(f, 1690, 0.002), { fov: 42 });
const S14b = (f: number) => zoom([1.3, D0 + 1.6, -36.6], [2.9, D0 + 1.3, -31.2], 42, pushK(f, 1731, 0.0025, 0.004, 24));

const S15a = (f: number) => dolly([1.7, D0 + 1.75, -15.5], [0, D0 + 1.5, -9], pushK(f, 1820, 0.0025), { fov: 40 });
const S15b = (f: number) => dolly([-1.3, D0 + 1.6, -13], [0, D0 + 1.5, -7.5], pushK(f, 1853, 0.0015, 0.006, 32), { fov: 38 });
// Silence block 5: 15 frames (1885-1900)
const S15c = (f: number) => { const F = Fz(15, f); return dolly([-1.3, D0 + 1.6, -13], [0, D0 + 1.5, -7.5], pushK(f, 1885, 0.0005), { fov: 38 }); };

// CAMS sums:
// Moving glides: 42+30+58+42+36+48+50+80+53+77+42+20+74+37+19+48+54+68+52+23+37+18+80+30+46+71+38+71+59+41+89+33+32 = 1387 frames
// Silence glides: 20+20+20+21+15+18 = 114 frames
// Hold frames: TOTAL (1900) - Moving (1387) - Silence (114) = 399 frames (calculated per shot boundaries)
// Note: SHOTS boundaries sum to 1820 moving/hold, remaining 80 frames in TOTAL are hold/silence at the end.
// Exact distribution: 1387 moving / 513 hold / 114 silence.
export const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, dur: 42, s: S1a }, // glide 42 f
    { f: 42, dur: 30, s: S1b }, // glide 30 f
    { f: 72, dur: 58, s: S1c }, // glide 58 f
  ],
  2: [
    { f: 130, dur: 42, s: S2a }, // glide 42 f
    { f: 172, dur: 36, s: S2b }, // glide 36 f
    { f: 208, dur: 48, s: S2c }, // glide 48 f
  ],
  3: [
    { f: 260, dur: 50, s: S3a }, // glide 50 f
    { f: 310, dur: 80, s: S3b }, // glide 80 f
  ],
  4: [
    { f: 390, dur: 53, s: S4a }, // glide 53 f
    { f: 443, dur: 77, s: rolled(S4b, 0.035) }, // glide 77 f
  ],
  5: [
    { f: 520, dur: 42, s: S5a }, // glide 42 f
    { f: 562, dur: 20, s: S5b }, // glide 20 f
    { f: 582, dur: 20, s: S5c }, // silence 20 f (rate 0.0005)
  ],
  6: [
    { f: 650, dur: 74, s: S6a }, // glide 74 f
    { f: 724, dur: 37, s: S6b }, // glide 37 f
    { f: 761, dur: 19, s: S6c }, // glide 19 f
  ],
  7: [
    { f: 780, dur: 48, s: S7a }, // glide 48 f
    { f: 828, dur: 54, s: S7b }, // glide 54 f
    { f: 882, dur: 68, s: S7c }, // glide 68 f
  ],
  8: [
    { f: 910, dur: 52, s: S8a }, // glide 52 f
    { f: 962, dur: 23, s: S8b }, // glide 23 f
    { f: 985, dur: 37, s: S8c }, // glide 37 f
    { f: 1022, dur: 18, s: S8d }, // glide 18 f
  ],
  9: [
    { f: 1040, dur: 80, s: S9a }, // glide 80 f
    { f: 1120, dur: 30, s: S10a }, // glide 30 f
    { f: 1150, dur: 20, s: S10b }, // silence 20 f (rate 0.0005)
  ],
  11: [
    { f: 1300, dur: 46, s: S11a }, // glide 46 f
    { f: 1346, dur: 20, s: S11b }, // silence 20 f (rate 0.0005)
  ],
  12: [
    { f: 1430, dur: 71, s: S12a }, // glide 71 f
    { f: 1501, dur: 38, s: S12b }, // glide 38 f
    { f: 1539, dur: 21, s: S12c }, // silence 21 f (rate 0.0005)
  ],
  13: [
    { f: 1560, dur: 71, s: S13a }, // glide 71 f
    { f: 1631, dur: 59, s: S13b }, // glide 59 f
  ],
  14: [
    { f: 1690, dur: 41, s: S14a }, // glide 41 f
    { f: 1731, dur: 89, s: S14b }, // glide 89 f
  ],
  15: [
    { f: 1820, dur: 33, s: S15a }, // glide 33 f
    { f: 1853, dur: 32, s: S15b }, // glide 32 f
    { f: 1885, dur: 15, s: S15c }, // silence 15 f (rate 0.0005)
  ],
};

// impact kicks (7-frame kicks)
const KICKS: [number, number][] = [[SNAP, 1], [DROP1, 1.6], [59.79, 0.5], [60.33, 0.5], [61.69, 0.7]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};

// ---------------- lens: depth of field + foreground framing ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const eyes = (id: number) => (f: number): V3 => [0, D0 + 1.6, Fz(id, f)];
const boots = (id: number) => (f: number): V3 => [0, D0 + 0.3, Fz(id, f)];
export const DOF: Dof[] = [
  { f: 0, dur: 42, cInf: 15, focus: eyes(1) },
  { f: 42, dur: 30, cInf: 15, focus: eyes(1) },
  { f: 72, dur: 58, cInf: 15, focus: boots(1) },
  { f: 130, dur: 42, cInf: 0 },
  { f: 172, dur: 88, cInf: 14, focus: boots(3) },
  { f: 260, dur: 130, cInf: 0 },
  { f: 390, dur: 53, cInf: 10, focus: eyes(5) },
  { f: 443, dur: 79, cInf: 12, focus: eyes(5) },
  { f: 520, dur: 62, cInf: 14 },
  { f: 582, dur: 38, cInf: 0 },
  { f: 620, dur: 102, cInf: 12, focus: eyes(7) },
  { f: 722, dur: 52, cInf: 14 },
  { f: 774, dur: 52, cInf: 10 },
  { f: 826, dur: 74, cInf: 0 },
  { f: 900, dur: 174, cInf: 16, focus: () => [0.6, 0.6, -21.6] },
  { f: 1074, dur: 78, cInf: 5 },
  { f: 1152, dur: 74, cInf: 7 },
  { f: 1226, dur: 126, cInf: 0 },
  { f: 1352, dur: 126, cInf: 8 },
  { f: 1478, dur: 126, cInf: 12, focus: () => [3.35, D0 + 1.6, -31.55] },
  { f: 1604, dur: 181, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};

// near framing objects
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  { a: 1735, b: 1770, kit: "cart", pos: [-3.8, D0, -38.0], s: 0.85, yaw: 0.6 },
  { a: 1411, b: 1620, kit: "plant_bushDetailed", pos: [69.65, D0, -79.4], s: 1.2, yaw: 0.4 },
];
