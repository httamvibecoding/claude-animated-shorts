// Alternate .tsx entry for tools that expect one. Same registration as index.ts.
import { registerRoot } from "remotion";
import { Root } from "./Root";

registerRoot(Root);
