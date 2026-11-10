// Timeline of "How a Fake Job Interview Stole $6.3 Billion": 13 beats timed to the voice (SCRIPT.md word timings),
// stretched to 1900 frames @ 30 fps (word-proportional). One continuous diorama world: VAULT (left) | OFFICE (centre)
// | HACKER DEN (right) along one back wall — the camera GLIDES between places (0 hard cuts; every shot's first key
// glides out of the previous shot's last pose via Key.from). Camera grammar measured in the reference study:
// symmetric smootherstep glides (20-55 f), continuous slow push-ins (0.15-0.35 %/f, 0.6 %/f on punch words), rolls
// (2-4 deg here; diorama distances are small), 7-frame impact kicks on punch words. No hand-held float.
// Metrics (sum of CAMS dur windows): 1598 moving / 96 silence (rate 0.0005 drifts) / 206 hold = 1900, 0 hard cuts.
export const FPS = 30;
export const TOTAL = 1900;
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

// ---------------- place constants (the diorama) ----------------
// office: floor y = 0, back wall z = -4.28 (h 3.15). desk top y .75 at z in [-1.75, -.55]; engineer sits (0, 0, -.05)
// facing -z; three monitors at z = -1.34, y ~ 1.2. vault door at (-8.2, 1.85, -4.24) (hinge x = -9.95); hacker den
// desk at z = -3.4, hoodies at x 6.6 / 8.1 / 9.6; doorway in the wall at x in [3.45, 4.55]; AI core (8.15, 1.72, -3.35).
export const DESK_SEAT: V3 = [0.35, 0, -0.15];
export const VAULT: V3 = [-8.2, 1.85, -4.24];
export const DOORWAY: V3 = [4.0, 1.07, -4.28];
export const AI_CORE: V3 = [8.15, 1.72, -3.35];

// ---------------- shot props physics (tau = story time in seconds) ----------------
// Door / money / AI progressions; shot 1 is the ENDING tease (everything already broken, money looping).
export type SceneState = {
  vaultDoor: number;   // 0 closed .. 1 swung open
  officeDoor: number;  // 0 closed .. 1 open ("opening the door from within")
  money: number;       // flying bills fullness (1 = full billow)
  vanish: number;      // bills dissolving into thin air (puff amount)
  check: number;       // test passed checkmark (0..1 pop)
  backdoor: number;    // IDE icon morphed into a backdoor
  glitch: number;      // screen glitch pulse ("no new job" reveal)
  ai: number;          // internal AI takeover progress
  refresh: number;     // inbox refresh spinner phase 0..1
  walk: number;        // hackers walking out with the money (0..1)
  hire: number;        // dream-salary chat bubble popped
};
export const sceneState = (id: number, t: number): SceneState => {
  const tease = id === 1;
  const vaultDoor = tease ? 1 : t < 32.75 ? 0 : Math.min(1, easeOut((t - 32.75) / 0.8));
  const money = tease ? 0.75 + 0.25 * Math.sin(t * 2.1) : t < 32.9 ? 0 : t < 35.2 ? Math.min(1, (t - 32.9) / 0.6) : Math.max(0, 1 - (t - 35.2) / 1.0);
  const vanish = tease ? 0 : t < 35.1 ? 0 : Math.max(0, 1 - (t - 35.1) / 1.7);
  const check = tease ? 1 : t < 28.6 ? 0 : Math.min(1, (t - 28.6) / 0.45);
  const backdoor = tease ? 1 : smooth((t - 50.2) / 1.4);
  const glitch = tease ? 0 : Math.sin(Math.PI * clamp01((t - 37.9) / 1.5));
  const ai = tease ? 1 : smooth((t - 53.4) / 2.2);
  const refresh = tease ? 0 : t < 57.3 ? 0 : ((t - 57.3) * 0.85) % 1;
  const walk = tease ? 0.35 : smooth((t - 58.6) / 4.2);
  const hire = tease ? 1 : smooth((t - 10.3) / 0.5);
  return { vaultDoor, officeDoor: smooth((t - 43.6) / 1.2), money, vanish, check, backdoor, glitch, ai, refresh, walk, hire };
};

// ---------------- shots (13 beats, SCRIPT.md) ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; beat: string };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 154, light: "day", beat: "hook" },          // "He accidentally helped hackers steal 6.3 billion..."
  { id: 2, a: 154, b: 299, light: "day", beat: "setting" },     // "An engineer at Binance guards the biggest crypto vault... 2024"
  { id: 3, a: 299, b: 436, light: "day", beat: "recruiter" },   // "A recruiter messages him with a dream salary..."
  { id: 4, a: 436, b: 606, light: "day", beat: "hr-calls" },    // "...polite HR questions on video calls, like 'five years?'"
  { id: 5, a: 606, b: 671, light: "day", beat: "fbi" },         // "Definitely not on the FBI investigation list."
  { id: 6, a: 671, b: 760, light: "day", beat: "test" },        // "To pass the final round, they send a quick coding test."
  { id: 7, a: 760, b: 922, light: "day", beat: "snap" },        // "He downloads the file... nails the test... waits."
  { id: 8, a: 922, b: 1084, light: "day", beat: "deadpan" },    // "Luckily the code runs perfectly. Unluckily, the vault doors fly open..."
  { id: 9, a: 1084, b: 1197, light: "day", beat: "how" },       // "Wait, how does a coding test rob a bank? ...no new job."
  { id: 10, a: 1197, b: 1472, light: "day", beat: "hackers" },  // "...North Korean hackers... opening the door from within."
  { id: 11, a: 1472, b: 1577, light: "day", beat: "backdoor" }, // "That coding test quietly swapped his software with a backdoor."
  { id: 12, a: 1577, b: 1714, light: "golden", beat: "ai" },    // "...hijacked Binance's internal AI... take over the wallets."
  { id: 13, a: 1714, b: TOTAL, light: "golden", beat: "final" },// "...refreshing his inbox... walked out with six billion dollars."
];
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
// 0 hard cuts: the camera glides continuously across shot boundaries (Key.from), so one canvas is enough.
export const layersAt = (f: number): { id: number; alpha: number }[] => [{ id: shotAt(f).id, alpha: 1 }];

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur: number; from?: (f: number) => Shot; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  const k0 = keys[0];
  let cur = full(k0.s(f));
  if (k0.from) cur = mix(full(k0.from(f)), cur, glide((f - k0.f) / k0.dur));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = mix(cur, full(k.s(f)), glide((f - k.f) / k.dur));
  }
  return cur;
};
const T = (f: number) => f / FPS;

// push-in factor since f0: 0.15-0.35 %/f standard, 0.6 %/f punch (first ~35 f), 0.0005 %/f silence drift
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

// ---- shot 1: hook tease (vault blast frozen + money loop), wide -> vault money -> engineer shock ----
const S1a = (f: number) => dolly([3.2, 2.6, 6.2], [-2.5, 1.6, -2.5], pushK(f, 0, 0.0025), { fov: 44 });
const S1b = (f: number) => dolly([0.8, 2.1, 3.2], [-5.5, 1.8, -3.2], pushK(f, 44, 0.0022), { fov: 42, roll: -0.03 });
const S1c = (f: number) => dolly([-1.4, 1.9, 1.6], [-7.8, 1.9, -3.6], pushK(f, 94, 0.0028, 0.006, 35), { fov: 40, roll: 0.03 });
// ---- shot 2: setting (office wide -> engineer at his desk) ----
const S2a = (f: number) => dolly([3.6, 2.4, 5.6], [0, 1.25, -1.2], pushK(f, 154, 0.0022), { fov: 44 });
const S2b = (f: number) => dolly([1.9, 1.75, 3.1], [0.35, 1.25, -0.5], pushK(f, 192, 0.0018), { fov: 40 });
const S2c = (f: number) => dolly([1.05, 1.55, 1.9], [0.35, 1.3, -0.55], pushK(f, 229, 0.0022), { fov: 38, roll: 0.025 });
// ---- shot 3: recruiter message (left monitor chat; camera left of the engineer's card) ----
const S3a = (f: number) => dolly([-1.85, 1.85, 1.6], [-1.05, 1.28, -1.3], pushK(f, 299, 0.0025), { fov: 40 });
const S3b = (f: number) => dolly([-1.55, 1.8, 0.95], [-1.08, 1.27, -1.32], pushK(f, 339, 0.002), { fov: 37, roll: -0.03 });
const S3c = (f: number) => dolly([-1.35, 1.76, 0.5], [-1.1, 1.26, -1.33], pushK(f, 378, 0.003, 0.006, 35), { fov: 34 });
// ---- shot 4: HR video calls (right monitor; camera right of the engineer's card) ----
const S4a = (f: number) => dolly([2.35, 1.85, 1.55], [1.25, 1.28, -1.3], pushK(f, 436, 0.0022), { fov: 40 });
const S4b = (f: number) => dolly([2.05, 1.8, 0.95], [1.28, 1.27, -1.32], pushK(f, 482, 0.0018), { fov: 37, roll: 0.03 });
const S4c = (f: number) => dolly([1.85, 1.76, 0.5], [1.3, 1.26, -1.33], pushK(f, 528, 0.0025, 0.006, 30), { fov: 35 });
// ---- shot 5: FBI deadpan (centre monitor from the left) + punch ----
const S5a = (f: number) => dolly([-0.95, 1.82, 0.8], [-0.05, 1.3, -1.34], pushK(f, 606, 0.003), { fov: 38 });
const S5b = (f: number) => dolly([-0.85, 1.76, 0.3], [-0.05, 1.28, -1.36], pushK(f, 638, 0.0025, 0.006, 35), { fov: 33, roll: -0.025 });
// ---- shot 6: the coding test arrives ----
const S6a = (f: number) => dolly([-0.75, 1.8, 0.85], [0, 1.3, -1.34], pushK(f, 671, 0.0025), { fov: 38 });
const S6b = (f: number) => dolly([-0.85, 1.75, 0.35], [0, 1.28, -1.36], pushK(f, 709, 0.0022), { fov: 35, roll: 0.03 });
// ---- shot 7: download, nails it, sits back waiting ----
const S7a = (f: number) => dolly([-0.8, 1.8, 0.8], [0, 1.29, -1.35], pushK(f, 760, 0.0022), { fov: 38 });
const S7b = (f: number) => dolly([1.45, 1.68, 1.95], [0.35, 1.32, -0.4], pushK(f, 805, 0.0018), { fov: 41, roll: -0.03 });
const S7c = (f: number) => dolly([1.25, 1.6, 1.35], [0.4, 1.3, -0.75], pushK(f, 849, 0.0022), { fov: 38 });
// ---- shot 8: deadpan double - code runs perfectly / vault doors fly open ----
const S8a = (f: number) => dolly([-0.85, 1.78, 0.6], [0, 1.29, -1.35], pushK(f, 922, 0.003), { fov: 36 });
const S8b = (f: number) => dolly([2.2, 2.3, 4.6], [-3.5, 1.7, -2.6], pushK(f, 970, 0.002), { fov: 44 });
const S8c = (f: number) => dolly([0.2, 2.15, 2.6], [-7.2, 1.9, -3.4], pushK(f, 1015, 0.0025, 0.006, 35), { fov: 46, roll: -0.035 });
// ---- shot 9: "wait, how?" - silence drift, then the reveal question ----
const S9sil = (f: number) => dolly([0.2, 2.15, 2.6], [-7.2, 1.9, -3.4], pushK(f, 1084, 0.0005), { fov: 46, roll: -0.035 });
const S9a = (f: number) => dolly([2.4, 2.05, 3.6], [0.35, 1.35, -1.4], pushK(f, 1104, 0.0022), { fov: 42 });
const S9b = (f: number) => dolly([1.25, 1.85, 2.2], [0.6, 1.35, -1.6], pushK(f, 1137, 0.0025, 0.006, 35), { fov: 40, roll: 0.03 });
// ---- shot 10: North Korean hackers + the door opened from within (long reveal) ----
const S10a = (f: number) => dolly([2.6, 1.85, 2.9], [3.9, 1.5, -3.6], pushK(f, 1197, 0.002), { fov: 42 });
const S10b = (f: number) => dolly([2.9, 1.7, 1.1], [3.95, 1.45, -3.9], pushK(f, 1249, 0.0018), { fov: 38, roll: -0.03 });
const S10c = (f: number) => dolly([3.35, 1.62, -0.6], [4.0, 1.5, -4.6], pushK(f, 1299, 0.0022), { fov: 38 });
const S10d = (f: number) => dolly([4.6, 1.75, -0.4], [7.6, 1.5, -3.9], pushK(f, 1349, 0.0018), { fov: 42, roll: 0.03 });
const S10e = (f: number) => dolly([6.2, 1.95, 0.2], [8.4, 1.55, -3.6], pushK(f, 1400, 0.0025, 0.006, 35), { fov: 42, roll: -0.03 });
const S10sil = (f: number) => dolly([6.2, 1.95, 0.2], [8.4, 1.55, -3.6], pushK(f, 1452, 0.0005), { fov: 42, roll: -0.03 });
// ---- shot 11: the secret backdoor (work monitor close-up from the left) ----
const S11a = (f: number) => dolly([-0.75, 1.8, 1.0], [0, 1.29, -1.35], pushK(f, 1472, 0.0022), { fov: 37 });
const S11b = (f: number) => dolly([-0.85, 1.74, 0.4], [0, 1.28, -1.36], pushK(f, 1514, 0.003, 0.006, 35), { fov: 33 });
const S11sil = (f: number) => dolly([-0.85, 1.74, 0.4], [0, 1.28, -1.36], pushK(f, 1557, 0.0005), { fov: 33 });
// ---- shot 12: internal AI hijacked (golden, the den's AI core) ----
const S12a = (f: number) => dolly([6.0, 1.9, 1.5], [8.2, 1.7, -3.4], pushK(f, 1577, 0.0022), { fov: 42 });
const S12b = (f: number) => dolly([7.0, 1.8, 0.2], [8.15, 1.72, -3.35], pushK(f, 1613, 0.0018), { fov: 38 });
const S12c = (f: number) => dolly([7.6, 1.75, -1.0], [8.15, 1.72, -3.35], pushK(f, 1649, 0.0025, 0.006, 32), { fov: 35, roll: 0.025 });
const S12sil = (f: number) => dolly([7.6, 1.75, -1.0], [8.15, 1.72, -3.35], pushK(f, 1693, 0.0005), { fov: 35, roll: 0.025 });
// ---- shot 13: refreshing the inbox while they walk out with $6.3B (golden finale) ----
const S13a = (f: number) => dolly([1.8, 1.75, 2.6], [0.35, 1.3, -1.1], pushK(f, 1714, 0.0022), { fov: 42 });
const S13b = (f: number) => dolly([3.4, 2.15, 4.3], [1.5, 1.5, -2.2], pushK(f, 1769, 0.0018), { fov: 44, roll: -0.025 });
const S13c = (f: number) => dolly([5.2, 2.6, 6.4], [1.0, 1.5, -2.6], pushK(f, 1824, 0.0025, 0.006, 35), { fov: 46 });
const S13sil = (f: number) => dolly([5.2, 2.6, 6.4], [1.0, 1.5, -2.6], pushK(f, 1885, 0.0005), { fov: 46 });

// CAMS accounting (sums of dur windows): moving 1598 / silence 96 (five 0.0005 drifts: 20+20+20+21+15) / hold 206.
export const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, dur: 44, s: S1a },                                    // glide 44 f
    { f: 44, dur: 50, from: S1a, s: S1b },                        // glide 50 f
    { f: 94, dur: 44, from: S1b, s: S1c },                        // glide 44 f  (hold 16 f: 138-154)
  ],
  2: [
    { f: 154, dur: 38, from: S1c, s: S2a },                       // glide 38 f (transition = glide)
    { f: 192, dur: 37, from: S2a, s: S2b },                       // glide 37 f
    { f: 229, dur: 38, from: S2b, s: S2c },                       // glide 38 f  (hold 32 f: 267-299)
  ],
  3: [
    { f: 299, dur: 40, from: S2c, s: S3a },                       // glide 40 f
    { f: 339, dur: 39, from: S3a, s: S3b },                       // glide 39 f
    { f: 378, dur: 40, from: S3b, s: S3c },                       // glide 40 f  (hold 18 f: 418-436)
  ],
  4: [
    { f: 436, dur: 46, from: S3c, s: S4a },                       // glide 46 f
    { f: 482, dur: 46, from: S4a, s: S4b },                       // glide 46 f
    { f: 528, dur: 46, from: S4b, s: S4c },                       // glide 46 f  (hold 32 f: 574-606)
  ],
  5: [
    { f: 606, dur: 32, from: S4c, s: S5a },                       // glide 32 f
    { f: 638, dur: 27, from: S5a, s: S5b },                       // glide 27 f  (hold 6 f: 665-671)
  ],
  6: [
    { f: 671, dur: 38, from: S5b, s: S6a },                       // glide 38 f
    { f: 709, dur: 37, from: S6a, s: S6b },                       // glide 37 f  (hold 14 f: 746-760)
  ],
  7: [
    { f: 760, dur: 45, from: S6b, s: S7a },                       // glide 45 f
    { f: 805, dur: 44, from: S7a, s: S7b },                       // glide 44 f
    { f: 849, dur: 43, from: S7b, s: S7c },                       // glide 43 f  (hold 30 f: 892-922)
  ],
  8: [
    { f: 922, dur: 48, from: S7c, s: S8a },                       // glide 48 f
    { f: 970, dur: 45, from: S8a, s: S8b },                       // glide 45 f
    { f: 1015, dur: 45, from: S8b, s: S8c },                      // glide 45 f  (hold 24 f: 1060-1084)
  ],
  9: [
    { f: 1084, dur: 20, from: S8c, s: S9sil },                    // silence 20 f (rate 0.0005)
    { f: 1104, dur: 33, from: S9sil, s: S9a },                    // glide 33 f
    { f: 1137, dur: 40, from: S9a, s: S9b },                      // glide 40 f  (hold 20 f: 1177-1197)
  ],
  10: [
    { f: 1197, dur: 52, from: S9b, s: S10a },                     // glide 52 f
    { f: 1249, dur: 50, from: S10a, s: S10b },                    // glide 50 f
    { f: 1299, dur: 50, from: S10b, s: S10c },                    // glide 50 f
    { f: 1349, dur: 51, from: S10c, s: S10d },                    // glide 51 f
    { f: 1400, dur: 52, from: S10d, s: S10e },                    // glide 52 f
    { f: 1452, dur: 20, from: S10e, s: S10sil },                  // silence 20 f (rate 0.0005)
  ],
  11: [
    { f: 1472, dur: 42, from: S10sil, s: S11a },                  // glide 42 f
    { f: 1514, dur: 43, from: S11a, s: S11b },                    // glide 43 f
    { f: 1557, dur: 20, from: S11b, s: S11sil },                  // silence 20 f (rate 0.0005)
  ],
  12: [
    { f: 1577, dur: 36, from: S11sil, s: S12a },                  // glide 36 f
    { f: 1613, dur: 36, from: S12a, s: S12b },                    // glide 36 f
    { f: 1649, dur: 36, from: S12b, s: S12c },                    // glide 36 f  (hold 8 f: 1685-1693)
    { f: 1693, dur: 21, from: S12c, s: S12sil },                  // silence 21 f (rate 0.0005)
  ],
  13: [
    { f: 1714, dur: 55, from: S12sil, s: S13a },                  // glide 55 f
    { f: 1769, dur: 55, from: S13a, s: S13b },                    // glide 55 f
    { f: 1824, dur: 55, from: S13b, s: S13c },                    // glide 55 f  (hold 6 f: 1879-1885)
    { f: 1885, dur: 15, from: S13c, s: S13sil },                  // silence 15 f (rate 0.0005)
  ],
};
// NOTE: the "silence" windows are the five keys whose framing functions are the slow-drift *sil series (pushK rate
// 0.0005): S9sil/S10sil/S11sil/S12sil/S13sil. verify_metrics.js sums the CAMS windows: 1598 moving / 96 silence /
// 206 hold.

// impact kicks (7-frame alternating kicks) on punch words
const KICKS: [number, number][] = [[2.4, 0.6], [20.9, 0.55], [31.2, 0.7], [32.8, 1.3], [35.1, 1.5], [47.4, 0.7], [53.6, 0.9], [62.0, 0.8]];
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

// ---------------- lens: depth of field + foreground framing ----------------
export type Dof = { f: number; dur: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, dur: 94, cInf: 0 },                                            // hook wides: everything sharp
  { f: 94, dur: 60, cInf: 12, focus: () => [-7.8, 1.9, -3.6] },          // money close
  { f: 154, dur: 75, cInf: 0 },                                          // setting wide
  { f: 229, dur: 70, cInf: 13, focus: () => [0.35, 1.3, -0.55] },         // engineer
  { f: 299, dur: 137, cInf: 11, focus: () => [-1.1, 1.26, -1.33] },      // chat monitor
  { f: 436, dur: 138, cInf: 11, focus: () => [1.3, 1.26, -1.33] },       // call monitor
  { f: 574, dur: 97, cInf: 8, focus: () => [-0.05, 1.28, -1.35] },       // FBI + test monitors
  { f: 671, dur: 121, cInf: 9, focus: () => [0, 1.29, -1.35] },
  { f: 792, dur: 130, cInf: 12, focus: () => [0.35, 1.32, -0.7] },       // engineer leaning back
  { f: 922, dur: 48, cInf: 10, focus: () => [0, 1.29, -1.35] },          // checkmark close
  { f: 970, dur: 134, cInf: 0 },                                         // vault blast wide
  { f: 1104, dur: 93, cInf: 10, focus: () => [0.4, 1.35, -1.5] },
  { f: 1197, dur: 275, cInf: 0 },                                        // the long hacker reveal: deep
  { f: 1472, dur: 105, cInf: 9, focus: () => [0, 1.28, -1.36] },         // backdoor close
  { f: 1577, dur: 137, cInf: 7, focus: () => [8.15, 1.72, -3.35] },      // AI core
  { f: 1714, dur: 186, cInf: 0 },                                        // finale wide
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = Math.min(1, (f - d.f) / d.dur);
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};

// near framing objects (kit fallback props, world.ts toggles them per frame)
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  { a: 154, b: 299, kit: "plant_bushDetailed", pos: [2.45, 0, 1.62], s: 1.15, yaw: 0.5 },
  { a: 1714, b: 1900, kit: "plant_bushDetailed", pos: [2.45, 0, 1.62], s: 1.15, yaw: 0.5 },
];
