import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = fileURLToPath(new URL("../", import.meta.url));
const cpuMode = process.argv.includes("--cpu");
const unexpectedArgs = process.argv.slice(2).filter((arg) => arg !== "--cpu");

if (unexpectedArgs.length > 0) {
  console.error(`Unsupported argument(s): ${unexpectedArgs.join(" ")}`);
  console.error("Usage: npm run render[:cpu]");
  process.exit(2);
}

const requiredFiles = [
  ["public/voice.wav", path.join(projectDir, "public/voice.wav")],
  ["../templates/bridge/toon.ts", path.resolve(projectDir, "../templates/bridge/toon.ts")],
  ["node_modules/@remotion/cli/remotion-cli.js", path.join(projectDir, "node_modules/@remotion/cli/remotion-cli.js")],
];
const missingFiles = requiredFiles
  .filter(([, filePath]) => !existsSync(filePath))
  .map(([label]) => label);

if (missingFiles.length > 0) {
  console.error(`Cannot render; required files are missing: ${missingFiles.join(", ")}`);
  console.error("Keep video-project and templates/bridge/toon.ts in the original repository layout.");
  console.error("From video-project, run npm ci before rendering.");
  process.exit(1);
}

mkdirSync(path.join(projectDir, "out"), { recursive: true });

const cliPath = path.join(projectDir, "node_modules/@remotion/cli/remotion-cli.js");
const args = [
  cliPath,
  "render",
  "src/index.ts",
  "RopeShort",
  "out/rope-short.mp4",
  "--codec=h264",
  "--crf=18",
  "--overwrite",
];

if (cpuMode) {
  args.push("--gl=swangle");
}

const result = spawnSync(process.execPath, args, {
  cwd: projectDir,
  stdio: "inherit",
});

if (result.error) {
  console.error(`Could not start Remotion: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
