import * as THREE from "three";
import { bodyFront, Expr, Outfit, Pen } from "../../templates/bridge/toon";

export type CharacterArt = {
  texture: THREE.CanvasTexture;
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

const draw = (outfit: Outfit, expression: Expr, seed: number, wave?: number): CharacterArt => {
  const source = document.createElement("canvas");
  source.width = 600;
  source.height = 1000;
  const context = source.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable");

  bodyFront(new Pen(context), outfit, {
    mode: "stand",
    expr: expression,
    seed,
    light: -Math.PI / 2,
    wave,
  });

  const pixels = context.getImageData(0, 0, source.width, source.height).data;
  let left = source.width;
  let top = source.height;
  let right = 0;
  let bottom = 0;
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      if (pixels[(y * source.width + x) * 4 + 3] < 8) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right <= left || bottom <= top) {
    throw new Error("Character drawing is empty");
  }

  const padding = 12;
  left = Math.max(0, left - padding);
  top = Math.max(0, top - padding);
  right = Math.min(source.width, right + padding + 1);
  bottom = Math.min(source.height, bottom + padding + 1);
  const width = right - left;
  const height = bottom - top;
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
  return { texture, aspect: width / height };
};

export const createObeliskCast = () => ({
  workers: workers.map((outfit, index) => draw(outfit, index % 3 === 0 ? "stern" : "neutral", index + 1)),
  sailor: draw(sailor, "shock", 12, 0.8),
  guards: guards.map((outfit, index) => draw(outfit, "stern", index + 20)),
  cardinal: draw(cardinal, "stern", 32),
  architect: draw(architect, "nervous", 33),
});
