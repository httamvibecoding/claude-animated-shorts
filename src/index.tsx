import React from "react";
import { Composition, registerRoot } from "remotion";
import { FakeJobShort, FAKE_JOB_FRAMES } from "./videos/fake-job/Bridge";

const Root: React.FC = () => (
  <Composition
    id="FakeJobShort"
    component={FakeJobShort}
    durationInFrames={FAKE_JOB_FRAMES}
    fps={30}
    width={1080}
    height={1920}
  />
);
registerRoot(Root);
