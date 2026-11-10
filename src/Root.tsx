// "How a Fake Job Interview Stole $6.3 Billion" - Remotion Root Composition
import React from "react";
import { Composition } from "remotion";
import { FakeJobShort } from "./videos/fake-job/Bridge";
import { TOTAL as FAKE_JOB_TOTAL } from "./videos/fake-job/story";

export const Root: React.FC = () => (
  <Composition
    id="FakeJobShort"
    component={FakeJobShort}
    durationInFrames={FAKE_JOB_TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);

export default Root;
