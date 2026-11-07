import * as THREE from "three";
import { bodyFront, Expr, FrontOpts, Outfit, Pen } from "../../templates/bridge/toon";

export type CharacterArt = {
  texture: THREE.CanvasTexture;
  frames: THREE.CanvasTexture[];
  aspect: number;
};

const workers: Outfit[] = [
  { jacket: "#3d7180", pants: "#55493e", boots: "#392f2a", hat: "cap", cap: "#385468", skin: "#f0c7a2" },
  { jacket: "#a84d3f", pants: "#55483d", boots: "#3a302b", hat: "hair", hair: "#493127", skin: "#e9c3a2" },
  { jacket: "#ba813e", pants: "#4b5048", boots: "#332c28", hat: "cap", cap: "#574239", skin: "#e7bb96" },
  { jacket: "#59704d", pants: "#55473e", boots: "#3a302b", hat: "cap", cap: "#46505a", skin: "#f2d1b4" },
  { jacket: "#73506d", pants: "#51473e", boots: "#332c28", hat: "hair", hair: "#493127", skin: "#dcae8c" },
];

const sailor: Outfit = {
  jacket: "#327a87",
  pants: "#4d5550",
  boots: "#302b2a",
  hat: "cap",
  cap: "#dfc58b",
  skin: "#eac19d",
  moustache: "#5b3928",
};

const guards: Outfit[] = [
  {
    jacket: "#38475c",
    pants: "#45434a",
    boots: "#2c2830",
    hat: "cap",
    cap: "#344158",
    belt: "#c5a15e",
    buttons: "#e2c47f",
    skin: "#f1c9a7",
  },
  {
    jacket: "#793d42",
    pants: "#474049",
    boots: "#2c2830",
    hat: "cap",
    cap: "#54363e",
    belt: "#c5a15e",
    buttons: "#e2c47f",
    skin: "#e4b58f",
  },
];

const cardinal: Outfit = {
  jacket: "#9b3544",
  pants: "#74313b",
  boots: "#3b2b31",
  hat: "cap",
  cap: "#b34250",
  belt: "#d9b75e",
  buttons: "#f0d47a",
  skin: "#f0c5a0",
};

const architect: Outfit = {
  jacket: "#96703f",
  pants: "#4b4945",
  boots: "#382f2b",
  hat: "cap",
  cap: "#4d4541",
  skin: "#e8bb98",
  moustache: "#554034",
};

const draw = (outfit: Outfit, expression: Expr, seed: number, poses: FrontOpts[]): CharacterArt => {
  const sourceFrames: HTMLCanvasElement[] = [];
  let left = 600;
  let top = 1000;
  let right = 0;
  let bottom = 0;

  for (const pose of poses) {
    const source = document.createElement("canvas");
    source.width = 600;
    source.height = 1000;
    const context = source.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("2D canvas is unavailable");
    bodyFront(new Pen(context), outfit, {
      mode: "stand",
      expr: expression,
      seed,
      light: -Math.PI / 2,
      ...pose,
    });

    const pixels = context.getImageData(0, 0, source.width, source.height).data;
    let frameLeft = source.width;
    let frameTop = source.height;
    let frameRight = 0;
    let frameBottom = 0;
    for (let y = 0; y < source.height; y += 3) {
      for (let x = 0; x < source.width; x += 3) {
        if (pixels[(y * source.width + x) * 4 + 3] < 8) continue;
        frameLeft = Math.min(frameLeft, x);
        frameTop = Math.min(frameTop, y);
        frameRight = Math.max(frameRight, x);
        frameBottom = Math.max(frameBottom, y);
      }
    }
    if (frameRight <= frameLeft || frameBottom <= frameTop) {
      throw new Error("Character drawing is empty");
    }
    left = Math.min(left, frameLeft);
    top = Math.min(top, frameTop);
    right = Math.max(right, frameRight);
    bottom = Math.max(bottom, frameBottom);
    sourceFrames.push(source);
  }

  const padding = 12;
  left = Math.max(0, left - padding);
  top = Math.max(0, top - padding);
  right = Math.min(600, right + padding + 1);
  bottom = Math.min(1000, bottom + padding + 1);
  const width = right - left;
  const height = bottom - top;
  const frames = sourceFrames.map((source) => {
    const cropped = document.createElement("canvas");
    cropped.width = width;
    cropped.height = height;
    const croppedContext = cropped.getContext("2d");
    if (!croppedContext) throw new Error("2D canvas is unavailable");
    croppedContext.drawImage(source, left, top, width, height, 0, 0, width, height);

    const texture = new THREE.CanvasTexture(cropped);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  });
  return { texture: frames[0], frames: frames.slice(1), aspect: width / height };
};

const haulPoses = Array.from({ length: 12 }, (_, index): FrontOpts => ({
  mode: "march",
  phase: index / 12,
  lift: 95,
  tilt: Math.sin((index / 12) * Math.PI * 2) * 4,
  headTilt: Math.cos((index / 12) * Math.PI * 2) * 3,
}));

const gesturePoses = Array.from({ length: 8 }, (_, index): FrontOpts => ({
  wave: 0.1 + (index / 7) * 0.7,
  headTilt: index < 4 ? -2 : 1,
}));

export const createObeliskCast = () => ({
  workers: workers.map((outfit, index) =>
    draw(outfit, index % 3 === 0 ? "stern" : "neutral", index + 1, [
      { mode: "stand" },
      ...haulPoses,
    ]),
  ),
  sailor: draw(sailor, "shock", 12, [{}, ...gesturePoses]),
  guards: guards.map((outfit, index) =>
    draw(outfit, "stern", index + 20, [{}, ...haulPoses]),
  ),
  cardinal: draw(cardinal, "stern", 32, [{}, ...gesturePoses]),
  architect: draw(architect, "nervous", 33, [{}, ...gesturePoses]),
});
