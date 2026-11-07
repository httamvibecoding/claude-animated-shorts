import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { CharacterArt, createObeliskCast } from "./ObeliskCharacters";

const DURATION = 1906;
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (value: number) => {
  const amount = clamp(value);
  return amount * amount * (3 - 2 * amount);
};

type Vector3Tuple = [number, number, number];
type CameraKey = { frame: number; position: Vector3Tuple; lookAt: Vector3Tuple; fov: number; cut?: boolean };

const CAMERA_KEYS: CameraKey[] = [
  { frame: 0, position: [1, 8, 22], lookAt: [1, 3, 0], fov: 50 },
  { frame: 194, position: [20, 15, 20], lookAt: [0, 5, 0], fov: 48, cut: true },
  { frame: 320, position: [14, 10, 9], lookAt: [0, 5, 0], fov: 42 },
  { frame: 580, position: [0, 2.5, 11], lookAt: [0, 4, 0], fov: 42, cut: true },
  { frame: 657, position: [8, 6, 6], lookAt: [0, 7, 0], fov: 38 },
  { frame: 774, position: [5, 8, 6], lookAt: [0, 8, 0], fov: 34 },
  { frame: 894, position: [0, 3.6, 14], lookAt: [0, 1.2, 7], fov: 34, cut: true },
  { frame: 1014, position: [0, 3, 13], lookAt: [0, 1.1, 6.8], fov: 36 },
  { frame: 1089, position: [0, 3.2, 13], lookAt: [0, 1.1, 6.8], fov: 38 },
  { frame: 1212, position: [8, 5.8, 13], lookAt: [5.7, 1.3, 6.5], fov: 36, cut: true },
  { frame: 1419, position: [0, 6.5, 9], lookAt: [0, 6, 0], fov: 34, cut: true },
  { frame: 1738, position: [0, 10, 28], lookAt: [0, 5.5, 0], fov: 50, cut: true },
];

const makeContactShadow = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable");
  const gradient = context.createRadialGradient(64, 64, 4, 64, 64, 64);
  gradient.addColorStop(0, "rgba(45, 37, 59, 0.38)");
  gradient.addColorStop(0.55, "rgba(45, 37, 59, 0.16)");
  gradient.addColorStop(1, "rgba(45, 37, 59, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

const makeSkyTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable");
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#3e7fd2");
  gradient.addColorStop(0.42, "#6a9fe0");
  gradient.addColorStop(0.72, "#9cbfea");
  gradient.addColorStop(1, "#c9cdee");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

const makeCloudTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable");

  const puffs = [
    [0.2, 0.67, 0.26, 0.25],
    [0.38, 0.48, 0.24, 0.4],
    [0.58, 0.43, 0.25, 0.44],
    [0.77, 0.62, 0.23, 0.27],
    [0.5, 0.73, 0.48, 0.2],
  ];
  for (const [x, y, rx, ry] of puffs) {
    context.save();
    context.translate(x * canvas.width, y * canvas.height);
    context.scale(rx * canvas.width, ry * canvas.height);
    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, "rgba(255, 249, 239, 0.82)");
    gradient.addColorStop(0.58, "rgba(255, 244, 229, 0.6)");
    gradient.addColorStop(1, "rgba(255, 239, 220, 0)");
    context.fillStyle = gradient;
    context.fillRect(-1, -1, 2, 2);
    context.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

const makePavingTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 768;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable");
  context.fillStyle = "#b88762";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const palette = ["#d9b48b", "#c99a72", "#e0bc92", "#ceaa82", "#d4a47b"];
  const rows = 8;
  const rowHeight = canvas.height / rows;
  const stoneWidth = canvas.width / 6;
  for (let row = -1; row <= rows; row += 1) {
    const offset = (row % 2) * stoneWidth * 0.5;
    for (let column = -1; column <= 6; column += 1) {
      const x = column * stoneWidth + offset;
      const y = row * rowHeight;
      const inset = 3;
      const variation = ((row * 7 + column * 11 + 50) % palette.length + palette.length) % palette.length;
      context.beginPath();
      context.moveTo(x + inset, y + inset);
      context.lineTo(x + stoneWidth * 0.58, y + inset * 0.6);
      context.lineTo(x + stoneWidth - inset, y + inset * 1.5);
      context.lineTo(x + stoneWidth - inset * 0.7, y + rowHeight * 0.57);
      context.lineTo(x + stoneWidth - inset * 1.8, y + rowHeight - inset);
      context.lineTo(x + stoneWidth * 0.34, y + rowHeight - inset * 0.7);
      context.lineTo(x + inset * 0.7, y + rowHeight * 0.66);
      context.closePath();
      context.fillStyle = palette[variation];
      context.fill();
      context.lineWidth = 2.2;
      context.strokeStyle = "#906d59";
      context.stroke();

      context.beginPath();
      context.moveTo(x + 14, y + 9);
      context.lineTo(x + stoneWidth * 0.62, y + 9);
      context.strokeStyle = "rgba(255, 230, 189, 0.2)";
      context.lineWidth = 2;
      context.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(15, 15);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
};

const makeStoneTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable");
  const wash = context.createLinearGradient(0, 0, canvas.width, 0);
  wash.addColorStop(0, "#b85b3e");
  wash.addColorStop(0.28, "#d47a50");
  wash.addColorStop(0.72, "#c66b46");
  wash.addColorStop(1, "#a94e37");
  context.fillStyle = wash;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < 12; index += 1) {
    const y = index * 91 + 18;
    context.beginPath();
    context.moveTo(0, y);
    context.bezierCurveTo(150, y - 10, 340, y + 9, canvas.width, y - 3);
    context.strokeStyle = index % 2 === 0 ? "rgba(255, 213, 158, 0.11)" : "rgba(93, 42, 37, 0.08)";
    context.lineWidth = index % 3 === 0 ? 14 : 7;
    context.stroke();
  }
  for (let index = 0; index < 8; index += 1) {
    const x = 32 + index * 68;
    context.beginPath();
    context.moveTo(x, 0);
    context.bezierCurveTo(x + 9, 250, x - 12, 700, x + 3, canvas.height);
    context.strokeStyle = "rgba(255, 227, 181, 0.055)";
    context.lineWidth = 19;
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
};

const makePlasterTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable");
  const wash = context.createLinearGradient(0, 0, 0, canvas.height);
  wash.addColorStop(0, "#f1d4a9");
  wash.addColorStop(0.55, "#e5bd8d");
  wash.addColorStop(1, "#d6a779");
  context.fillStyle = wash;
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 44; y < canvas.height; y += 86) {
    context.beginPath();
    context.moveTo(0, y);
    context.bezierCurveTo(170, y - 3, 340, y + 4, canvas.width, y);
    context.strokeStyle = "rgba(130, 87, 67, 0.18)";
    context.lineWidth = 2;
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 1);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
};

type PersonMotion = {
  start: number;
  end: number;
  frameDuration?: number;
  phaseOffset?: number;
  loop?: boolean;
  travel?: Vector3Tuple;
};

const Person = ({
  position,
  art,
  shadow,
  size = 1,
  motion,
}: {
  position: Vector3Tuple;
  art: CharacterArt;
  shadow: THREE.Texture;
  size?: number;
  motion?: PersonMotion;
}) => {
  const height = 2.25 * size;
  const frame = useCurrentFrame();
  const group = useRef<THREE.Group>(null);
  const sprite = useRef<THREE.Sprite>(null);
  const pose = motion && frame >= motion.start && frame < motion.end
    ? Math.floor((frame - motion.start + (motion.phaseOffset ?? 0)) / (motion.frameDuration ?? 3))
    : -1;
  const poseIndex = pose < 0
    ? -1
    : motion?.loop
      ? pose % art.frames.length
      : Math.min(pose, art.frames.length - 1);

  useFrame(() => {
    const idlePhase = frame * 0.035 + (motion?.phaseOffset ?? 0) * 0.3;
    if (group.current) {
      const progress = motion
        ? smooth((frame - motion.start) / (motion.end - motion.start))
        : 0;
      const cycleLength = motion ? (motion.frameDuration ?? 3) * art.frames.length : 0;
      const cyclePhase = motion?.loop && cycleLength > 0
        ? ((frame - motion.start + (motion.phaseOffset ?? 0)) % cycleLength) / cycleLength
        : 0;
      const effort = motion?.loop && frame >= motion.start && frame < motion.end
        ? Math.sin(cyclePhase * Math.PI * 2)
        : 0;
      group.current.position.set(
        position[0] + (motion?.travel?.[0] ?? 0) * progress + effort * 0.06,
        position[1] + (motion?.travel?.[1] ?? 0) * progress + effort * 0.04,
        position[2] + (motion?.travel?.[2] ?? 0) * progress,
      );
    }
    if (sprite.current) {
      const material = sprite.current.material;
      if (material instanceof THREE.SpriteMaterial) {
        const nextTexture = poseIndex >= 0 ? art.frames[poseIndex] : art.texture;
        if (material.map !== nextTexture) {
          material.map = nextTexture;
          material.needsUpdate = true;
        }
      }
    }
    if (sprite.current) {
      sprite.current.position.y = height / 2 + Math.sin(idlePhase) * 0.018;
      sprite.current.rotation.z = Math.sin(idlePhase * 0.7) * 0.006;
    }
  });

  return (
    <group ref={group} position={position}>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.82 * size, 0.48 * size, 1]} renderOrder={0.5}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} />
      </mesh>
      <sprite ref={sprite} position={[0, height / 2, 0]} scale={[height * art.aspect, height, 1]}>
        <spriteMaterial map={art.texture} transparent alphaTest={0.04} depthWrite={false} />
      </sprite>
    </group>
  );
};

const Segment = ({ start, end, thickness = 0.07, color = "#5c3827" }: { start: Vector3Tuple; end: Vector3Tuple; thickness?: number; color?: string }) => {
  const startVector = new THREE.Vector3(...start);
  const endVector = new THREE.Vector3(...end);
  const direction = endVector.clone().sub(startVector);
  const midpoint = startVector.clone().add(endVector).multiplyScalar(0.5);
  const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return (
    <mesh position={midpoint} quaternion={rotation} scale={[1, direction.length(), 1]}>
      <cylinderGeometry args={[thickness, thickness, 1, 7]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
};

const makeBraidGeometry = (phase: number) => {
  const points = Array.from({ length: 97 }, (_, index) => {
    const progress = index / 96;
    const angle = progress * Math.PI * 24 + phase;
    return new THREE.Vector3(Math.cos(angle) * 0.13, (progress - 0.5) * 4.8, Math.sin(angle) * 0.13);
  });
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 96, 0.055, 8, false);
};

const CameraRig = () => {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  useFrame(() => {
    let activeIndex = 0;
    for (let index = 1; index < CAMERA_KEYS.length; index += 1) {
      if (frame >= CAMERA_KEYS[index].frame) activeIndex = index;
    }
    const active = CAMERA_KEYS[activeIndex];
    const next = CAMERA_KEYS[activeIndex + 1];
    const position = new THREE.Vector3(...active.position);
    const lookAt = new THREE.Vector3(...active.lookAt);
    const transition = clamp((frame - active.frame) / 18);
    const eased = smooth(transition);
    if (activeIndex > 0 && !active.cut && transition < 1) {
      const previous = CAMERA_KEYS[activeIndex - 1];
      position.lerpVectors(new THREE.Vector3(...previous.position), position, eased);
      lookAt.lerpVectors(new THREE.Vector3(...previous.lookAt), lookAt, eased);
    }
    const shotProgress = next ? clamp((frame - active.frame) / (next.frame - active.frame)) : 0;
    position.lerp(lookAt, 0.018 + shotProgress * 0.055);
    camera.position.copy(position);
    camera.lookAt(lookAt);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = active.fov;
      camera.updateProjectionMatrix();
    }
  });
  return null;
};

const ObeliskWorld = () => {
  const frame = useCurrentFrame();
  const cast = useMemo(createObeliskCast, []);
  const contactShadow = useMemo(makeContactShadow, []);
  const skyTexture = useMemo(makeSkyTexture, []);
  const cloudTexture = useMemo(makeCloudTexture, []);
  const paving = useMemo(makePavingTexture, []);
  const obeliskStone = useMemo(makeStoneTexture, []);
  const churchPlaster = useMemo(makePlasterTexture, []);
  const crew = useMemo(
    () =>
      Array.from({ length: 40 }, (_, index) => {
        const side = index < 20 ? -1 : 1;
        const row = index % 20;
        return {
          position: [side * (4.8 + Math.floor(row / 10) * 2), 0.08, ((row % 10) - 4.5) * 1.15] as Vector3Tuple,
          variant: index % 5,
          size: 0.9 + (index % 3) * 0.06,
        };
      }),
    [],
  );
  const tilt = frame < 1738 ? -0.44 : -0.44 * (1 - smooth((frame - 1738) / (DURATION - 1738)));
  const tension = smooth((frame - 540) / 150) * (1 - smooth((frame - 1212) / 90));
  const smoke = smooth((frame - 740) / 35) * (1 - smooth((frame - 1260) / 90));
  const water = smooth((frame - 1240) / 55) * (1 - smooth((frame - 1510) / 70));
  const tipX = Math.sin(tilt) * 12;
  const tipY = 0.5 + Math.cos(tilt) * 12;
  const anchors: Vector3Tuple[] = [
    [-11, 0.6, -7], [-9, 0.6, -3], [-9, 0.6, 3], [-11, 0.6, 7],
    [11, 0.6, -7], [9, 0.6, -3], [9, 0.6, 3], [11, 0.6, 7],
  ];
  const baseGeometry = useMemo(() => new THREE.CylinderGeometry(0.9, 1.15, 10.8, 4), []);
  const capGeometry = useMemo(() => new THREE.ConeGeometry(0.9, 1.7, 4), []);
  const outlineGeometry = useMemo(() => new THREE.EdgesGeometry(baseGeometry), [baseGeometry]);
  const capOutlineGeometry = useMemo(() => new THREE.EdgesGeometry(capGeometry), [capGeometry]);
  const pavingGeometry = useMemo(() => new THREE.BoxGeometry(90, 0.04, 90), []);
  const skyGeometry = useMemo(() => new THREE.SphereGeometry(120, 32, 24), []);
  const churchWallGeometry = useMemo(() => new THREE.BoxGeometry(42, 9, 4), []);
  const churchOutlineGeometry = useMemo(() => new THREE.EdgesGeometry(churchWallGeometry), [churchWallGeometry]);
  const skylineBuildingGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const skylineRoofGeometry = useMemo(() => new THREE.ConeGeometry(1, 1, 4), []);
  const cypressGeometry = useMemo(() => new THREE.ConeGeometry(1, 1, 8), []);
  const windowArchGeometry = useMemo(
    () => new THREE.SphereGeometry(0.55, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    [],
  );
  const cloudBanks = useMemo(
    () => [
      { position: [-14, 21, -48] as Vector3Tuple, scale: 2.4 },
      { position: [0, 24, -52] as Vector3Tuple, scale: 3.1 },
      { position: [14, 19, -46] as Vector3Tuple, scale: 2.2 },
    ],
    [],
  );
  const skyline = useMemo(
    () => [
      { x: -34, width: 8, height: 8.5, color: "#b9694e" },
      { x: -25, width: 7, height: 6.5, color: "#d18b5d" },
      { x: 25, width: 7, height: 7.5, color: "#c47451" },
      { x: 34, width: 9, height: 9.5, color: "#a95848" },
    ],
    [],
  );
  const trees = useMemo(
    () => [
      { x: -13.5, z: -6, scale: 1.15 },
      { x: 13.5, z: -6, scale: 1.3 },
      { x: -15, z: -15, scale: 0.95 },
      { x: 15, z: -15, scale: 1.05 },
    ],
    [],
  );
  const lowerPlinthGeometry = useMemo(() => new THREE.BoxGeometry(4.8, 0.8, 4.8), []);
  const lowerPlinthOutline = useMemo(() => new THREE.EdgesGeometry(lowerPlinthGeometry), [lowerPlinthGeometry]);
  const upperPlinthGeometry = useMemo(() => new THREE.BoxGeometry(3.5, 0.5, 3.5), []);
  const upperPlinthOutline = useMemo(() => new THREE.EdgesGeometry(upperPlinthGeometry), [upperPlinthGeometry]);
  const domeGeometry = useMemo(
    () => new THREE.SphereGeometry(4.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    [],
  );
  const domeRibs = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => {
        const azimuth = (index / 10) * Math.PI * 2;
        const points = Array.from({ length: 25 }, (_, step) => {
          const angle = (step / 24) * (Math.PI / 2);
          const radius = 4.2 * Math.sin(angle);
          return new THREE.Vector3(
            radius * Math.cos(azimuth),
            11.15 + 4.2 * Math.cos(angle),
            0.8 + radius * Math.sin(azimuth),
          );
        });
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, 0.035, 6, false);
      }),
    [],
  );
  const braidGeometries = useMemo(() => [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map(makeBraidGeometry), []);
  const macroProgress = smooth((frame - 1508) / (1738 - 1508));
  const macroVisible = frame >= 1419 && frame < 1738;

  return (
    <>
      <color attach="background" args={["#b8d0ec"]} />
      <fog attach="fog" args={["#b0c0e8", 25, 90]} />
      <mesh geometry={skyGeometry} renderOrder={-1}>
        <meshBasicMaterial map={skyTexture} side={THREE.BackSide} depthWrite={false} fog={false} toneMapped={false} />
      </mesh>
      {cloudBanks.map((cloud, index) => {
        const drift = Math.sin(frame * 0.002 + index * 2.1) * 0.7;
        return (
          <sprite
            key={`cloud-${index}`}
            position={[cloud.position[0] + drift, cloud.position[1], cloud.position[2]]}
            scale={[cloud.scale * 3.2, cloud.scale * 1.55, 1]}
          >
            <spriteMaterial map={cloudTexture} transparent depthWrite={false} fog={false} />
          </sprite>
        );
      })}
      <ambientLight intensity={1.1} color="#dcecff" />
      <directionalLight position={[9, 16, 11]} intensity={2.2} color="#fff3e0" castShadow />
      <directionalLight position={[-9, 9, -8]} intensity={0.85} color="#87a9e3" />

      {skyline.map((building, index) => (
        <group key={`skyline-${index}`} position={[building.x, 0, -37]}>
          <mesh geometry={skylineBuildingGeometry} position={[0, building.height / 2, 0]} scale={[building.width, building.height, 7]} castShadow>
            <meshStandardMaterial color={building.color} roughness={0.95} />
          </mesh>
          <mesh geometry={skylineRoofGeometry} position={[0, building.height + 0.7, 0]} rotation={[0, Math.PI / 4, 0]} scale={[building.width * 0.72, 1.4, 6]} castShadow>
            <meshStandardMaterial color="#75483f" roughness={0.92} />
          </mesh>
          {[-1.8, 0, 1.8].map((window, windowIndex) => (
            <mesh key={`skyline-window-${windowIndex}`} position={[window, building.height * 0.48, 3.56]}>
              <boxGeometry args={[0.72, 1.1, 0.1]} />
              <meshStandardMaterial color="#526986" roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}

      {trees.map((tree, index) => (
        <group key={`cypress-${index}`} position={[tree.x, 0, tree.z]} scale={tree.scale}>
          <mesh position={[0, 1.15, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.24, 2.3, 8]} />
            <meshStandardMaterial color="#70503b" roughness={0.95} />
          </mesh>
          <mesh geometry={cypressGeometry} position={[0, 4.8, 0]} scale={[0.74, 5.6, 0.74]} castShadow>
            <meshStandardMaterial color="#44684f" roughness={0.94} />
          </mesh>
        </group>
      ))}

      <mesh geometry={pavingGeometry} position={[0, -0.25, 0]} receiveShadow>
        <meshStandardMaterial map={paving} color="#fff4e5" roughness={1} />
      </mesh>

      <group position={[0, 0, -18]}>
        <mesh position={[0, 4.5, -1]}>
          <primitive object={churchWallGeometry} attach="geometry" />
          <meshStandardMaterial map={churchPlaster} color="#fff4e5" roughness={0.95} />
        </mesh>
        <lineSegments geometry={churchOutlineGeometry} position={[0, 4.5, -1]}>
          <lineBasicMaterial color="#44303a" transparent opacity={0.78} />
        </lineSegments>
        {Array.from({ length: 10 }, (_, index) => (
          <group key={`window-${index}`} position={[(index - 4.5) * 3.9, 4.8, 1.15]}>
            <mesh>
              <boxGeometry args={[1.1, 1.7, 0.12]} />
              <meshStandardMaterial color="#344e70" roughness={0.85} />
            </mesh>
            <mesh geometry={windowArchGeometry} position={[0, 0.85, 0.01]}>
              <meshStandardMaterial color="#344e70" roughness={0.85} />
            </mesh>
            <mesh position={[-0.67, 0, -0.06]}>
              <boxGeometry args={[0.12, 1.95, 0.2]} />
              <meshStandardMaterial color="#e5c28f" roughness={0.9} />
            </mesh>
            <mesh position={[0.67, 0, -0.06]}>
              <boxGeometry args={[0.12, 1.95, 0.2]} />
              <meshStandardMaterial color="#e5c28f" roughness={0.9} />
            </mesh>
            <mesh position={[0, -0.92, 0]}>
              <boxGeometry args={[1.45, 0.16, 0.3]} />
              <meshStandardMaterial color="#d49d69" roughness={0.9} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 7.3, 1.2]}>
          <boxGeometry args={[43, 0.22, 0.28]} />
          <meshStandardMaterial color="#f3d9ae" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.1, 1.2]}>
          <boxGeometry args={[43, 0.34, 0.28]} />
          <meshStandardMaterial color="#b98559" roughness={0.9} />
        </mesh>
        <mesh position={[0, 9.1, 0.9]}>
          <boxGeometry args={[44, 0.45, 4.2]} />
          <meshStandardMaterial color="#d49d69" />
        </mesh>
        <mesh position={[0, 10.3, 0.8]}>
          <cylinderGeometry args={[3.05, 3.35, 1.7, 16]} />
          <meshStandardMaterial color="#dbad78" roughness={0.9} />
        </mesh>
        <mesh geometry={domeGeometry} position={[0, 11.15, 0.8]} castShadow>
          <meshStandardMaterial color="#c97855" roughness={0.86} />
        </mesh>
        {domeRibs.map((geometry, index) => (
          <mesh key={`dome-rib-${index}`} geometry={geometry}>
            <meshStandardMaterial color="#9d5548" roughness={0.85} />
          </mesh>
        ))}
        {Array.from({ length: 9 }, (_, index) => (
          <group key={index} position={[(index - 4) * 4.8, 3.8, 1.35]}>
            <mesh position={[0, 3.8, 0]} castShadow>
              <cylinderGeometry args={[0.48, 0.62, 7.6, 12]} />
              <meshStandardMaterial color="#f0d2a5" roughness={0.8} />
            </mesh>
            <mesh position={[0, 7.8, 0]}>
              <boxGeometry args={[1.45, 0.35, 1.45]} />
              <meshStandardMaterial color="#f5d9ad" />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 8, 2.2]}>
          <boxGeometry args={[44, 0.7, 2.2]} />
          <meshStandardMaterial color="#d49d69" />
        </mesh>
      </group>

      <mesh geometry={lowerPlinthGeometry} position={[0, 0.25, 0]}>
        <meshStandardMaterial color="#98745f" roughness={0.95} />
      </mesh>
      <lineSegments geometry={lowerPlinthOutline} position={[0, 0.25, 0]}>
        <lineBasicMaterial color="#44303a" transparent opacity={0.8} />
      </lineSegments>
      <mesh geometry={upperPlinthGeometry} position={[0, 0.85, 0]}>
        <meshStandardMaterial color="#d3ae86" roughness={0.9} />
      </mesh>
      <lineSegments geometry={upperPlinthOutline} position={[0, 0.85, 0]}>
        <lineBasicMaterial color="#44303a" transparent opacity={0.72} />
      </lineSegments>
      <group position={[0, 0.5, 0]} rotation={[0, 0, tilt]}>
        <mesh geometry={baseGeometry} position={[0, 5.4, 0]} castShadow>
          <meshStandardMaterial map={obeliskStone} color="#fff5e9" roughness={0.82} flatShading />
        </mesh>
        <lineSegments geometry={outlineGeometry} position={[0, 5.4, 0]}>
          <lineBasicMaterial color="#302230" />
        </lineSegments>
        <mesh geometry={capGeometry} position={[0, 11.65, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <meshStandardMaterial map={obeliskStone} color="#fff5e9" roughness={0.8} flatShading />
        </mesh>
        <lineSegments geometry={capOutlineGeometry} position={[0, 11.65, 0]} rotation={[0, Math.PI / 4, 0]}>
          <lineBasicMaterial color="#302230" />
        </lineSegments>
        {[1.4, 3.7, 6.1, 8.5].map((height) => (
          <mesh key={height} position={[0, height, 0]}>
            <boxGeometry args={[1.72 - height * 0.045, 0.08, 1.72 - height * 0.045]} />
            <meshStandardMaterial color="#e4a36f" roughness={0.75} />
          </mesh>
        ))}
      </group>

      {!macroVisible && anchors.map((anchor, index) => {
        const flutter = Math.sin(frame * 0.7 + index) * tension * 0.025;
        const ropeEnd: Vector3Tuple = [tipX + flutter, tipY, anchor[2] * 0.08];
        return <Segment key={index} start={anchor} end={ropeEnd} thickness={0.075 + tension * 0.025} color={smoke > 0.2 ? "#50372c" : "#76503b"} />;
      })}

      {crew.map((person, index) => (
        <Person
          key={`crew-${index}`}
          position={person.position}
          art={cast.workers[person.variant]}
          shadow={contactShadow}
          size={person.size}
          motion={{ start: 320, end: 1212, phaseOffset: index * 3, loop: true, frameDuration: 3 }}
        />
      ))}
      <Person position={[0, 0.1, 7]} art={cast.sailor} shadow={contactShadow} size={1.12} motion={{ start: 894, end: 1212, frameDuration: 3 }} />
      <Person position={[-0.95, 0.1, 6.2]} art={cast.guards[0]} shadow={contactShadow} size={1.04} motion={{ start: 1014, end: 1089, phaseOffset: 3, frameDuration: 3, travel: [0.2, 0, 0.35] }} />
      <Person position={[0.95, 0.1, 6.2]} art={cast.guards[1]} shadow={contactShadow} size={1.04} motion={{ start: 1014, end: 1089, phaseOffset: 9, frameDuration: 3, travel: [-0.2, 0, 0.35] }} />
      <Person position={[-1.2, 0.1, -12]} art={cast.cardinal} shadow={contactShadow} size={1.16} />
      <Person position={[5.7, 0.1, 6.5]} art={cast.architect} shadow={contactShadow} size={1.06} motion={{ start: 1212, end: 1419, frameDuration: 4 }} />

      {Array.from({ length: 7 }, (_, index) => {
        const offset = (index - 3) * 0.52;
        const opacity = smoke * (0.25 + (index % 3) * 0.09);
        return (
          <mesh key={`smoke-${index}`} position={[tipX * 0.55 + offset, tipY * 0.6 + index * 0.42, offset * 0.35]} scale={[0.45 + index * 0.055, 0.35 + index * 0.05, 0.4]}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshStandardMaterial color="#59585c" transparent opacity={opacity} depthWrite={false} />
          </mesh>
        );
      })}

      {Array.from({ length: 6 }, (_, index) => {
        const drop = (frame * 0.085 + index * 1.7) % 4;
        return (
          <mesh key={`water-${index}`} position={[6.2 + (index - 2.5) * 0.12, 4.5 - drop * 0.3, 4.2 + (index - 2.5) * 0.1]} scale={[0.11, 0.18, 0.11]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color="#6abce3" transparent opacity={water * 0.9} roughness={0.25} />
          </mesh>
        );
      })}

      <mesh position={[6.2, 5.1, 4.2]} rotation={[0, 0, Math.PI / 2 - water * 0.28]} scale={[0.42, 0.75, 0.42]} visible={frame >= 1261 && frame < 1419}>
        <cylinderGeometry args={[0.62, 0.68, 1.2, 12]} />
        <meshStandardMaterial color="#765039" roughness={0.9} />
      </mesh>
      <group position={[0, 6, 0]} scale={[1 + macroProgress * 0.1, 1 - macroProgress * 0.05, 1 + macroProgress * 0.1]} visible={macroVisible}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.1, 4.6, 12]} />
          <meshStandardMaterial color="#a06b49" roughness={1} />
        </mesh>
        {braidGeometries.map((geometry, index) => (
          <mesh key={index} geometry={geometry}>
            <meshStandardMaterial color={["#c09268", "#a77653", "#b88961"][index]} roughness={0.88} />
          </mesh>
        ))}
      </group>
      <CameraRig />
    </>
  );
};

export const RopeShort: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#83b9df" }}>
    <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: true, powerPreference: "high-performance" }} camera={{ fov: 40, near: 0.1, far: 180 }}>
      <ObeliskWorld />
    </ThreeCanvas>
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background:
          "radial-gradient(ellipse 75% 74% at 50% 48%, transparent 58%, rgba(47, 30, 51, 0.14) 100%)",
      }}
    />
    <Audio src={staticFile("voice.wav")} />
  </AbsoluteFill>
);

export const ROPE_SHORT_FRAMES = DURATION;