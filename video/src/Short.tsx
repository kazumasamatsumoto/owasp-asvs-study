import React from "react";
import { AbsoluteFill, Series, useCurrentFrame, useVideoConfig } from "remotion";
import { Checkpoints, Hook, Ng, Ok, Outro, Quiz, Requirement, Why } from "./components/Scenes";
import { sceneFrames, theme } from "./theme";
import type { ShortScript } from "./types";

const Header: React.FC<{ s: ShortScript }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 0, left: 0, height: 12, width: `${(frame / durationInFrames) * 100}%`, background: theme.accent }} />
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 70,
          fontFamily: theme.font,
          fontSize: 34,
          fontWeight: 700,
          color: theme.muted,
          display: "flex",
          gap: 16,
        }}
      >
        <span style={{ color: theme.accent }}>1 分 ASVS</span>
        <span>|</span>
        <span>{s.requirement}</span>
      </div>
    </AbsoluteFill>
  );
};

export const Short: React.FC<{ script: ShortScript }> = ({ script: s }) => (
  <AbsoluteFill style={{ background: theme.bg }}>
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 80% 10%, rgba(88,166,255,0.15), transparent 45%),
                     radial-gradient(circle at 10% 90%, rgba(248,81,73,0.10), transparent 40%)`,
      }}
    />
    <Series>
      <Series.Sequence durationInFrames={sceneFrames("hook")}><Hook s={s} /></Series.Sequence>
      <Series.Sequence durationInFrames={sceneFrames("ng")}><Ng s={s} /></Series.Sequence>
      <Series.Sequence durationInFrames={sceneFrames("why")}><Why s={s} /></Series.Sequence>
      <Series.Sequence durationInFrames={sceneFrames("requirement")}><Requirement s={s} /></Series.Sequence>
      <Series.Sequence durationInFrames={sceneFrames("ok")}><Ok s={s} /></Series.Sequence>
      <Series.Sequence durationInFrames={sceneFrames("checkpoints")}><Checkpoints s={s} /></Series.Sequence>
      <Series.Sequence durationInFrames={sceneFrames("quiz")}><Quiz s={s} /></Series.Sequence>
      <Series.Sequence durationInFrames={sceneFrames("outro")}><Outro s={s} /></Series.Sequence>
    </Series>
    <Header s={s} />
  </AbsoluteFill>
);
