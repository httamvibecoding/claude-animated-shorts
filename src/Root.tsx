// "How a Fake Job Interview Stole $6.3 Billion" - Remotion Root Composition
import React from "react";
import { Composition, Still, Folder, getRemotionEnvironment } from "remotion";
import { FakeJobShort } from "./videos/fake-job/Bridge"; // Renamed to FakeJobShort
import { BRIDGE_FRAMES as BRIDGE_TOTAL } from "./templates/bridge/story";
import { TOTAL as FAKE_JOB_TOTAL } from "./videos/fake-job/story";

export const Root: React.FC = () => {
  // Register the new composition for the fake job interview short
  return (
    <>
      <Composition
        id="FakeJobShort"
        component={FakeJobShort}
        durationInFrames={FAKE_JOB_TOTAL}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* Keep the original bridge composition if needed, or comment it out */}
      {/* <Composition
        id="BridgeShort"
        component={BridgeShort}
        durationInFrames={BRIDGE_TOTAL}
        fps={30}
        width={1080}
        height={1920}
      /> */}
    </>
  );
};

export default Root;
