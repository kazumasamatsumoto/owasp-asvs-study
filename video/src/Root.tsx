import React from "react";
import { Composition } from "remotion";
import { Short } from "./Short";
import { FPS, totalFrames } from "./theme";
import { scripts } from "./scripts";

export const Root: React.FC = () => (
  <>
    {scripts.map((script) => (
      <Composition
        key={script.id}
        id={script.id}
        component={Short}
        defaultProps={{ script }}
        durationInFrames={totalFrames}
        fps={FPS}
        width={1080}
        height={1920}
      />
    ))}
  </>
);
