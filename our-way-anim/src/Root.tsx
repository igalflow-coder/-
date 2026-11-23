import React from "react";
import { Composition } from "remotion";
import { BuddhaPart1, TOTAL } from "./videos/buddha/Buddha";
export const RemotionRoot: React.FC = () => (
  <Composition id="BuddhaPart1" component={BuddhaPart1} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
);
