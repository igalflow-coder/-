import React from "react";
import { Composition } from "remotion";
import { BuddhaPart1, TOTAL } from "./videos/buddha/Buddha";
import { ElianMirror, TOTAL as ELIAN_TOTAL } from "./videos/elian/Elian";
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="BuddhaPart1" component={BuddhaPart1} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="ElianMirror" component={ElianMirror} durationInFrames={ELIAN_TOTAL} fps={30} width={1080} height={1920} />
  </>
);
