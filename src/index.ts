// Entry point for the Remotion bundler (templates/scripts/bridge-stills.mjs defaults to src/index.ts).
// This file must stay JSX-free: esbuild parses .ts without JSX support. All JSX lives in Root.tsx.
import { registerRoot } from "remotion";
import { Root } from "./Root";

registerRoot(Root);
