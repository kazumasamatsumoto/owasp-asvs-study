import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import type { CodeScene, ShortScript } from "../types";
import { CodeBlock } from "./CodeBlock";

// ---- 共通部品 -------------------------------------------------------------

/** 下からふわっと出す */
const useEnter = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return { opacity: s, transform: `translateY(${(1 - s) * 40}px)` };
};

/** Shorts の UI（上部・下部・右側）に被らないよう、中央寄りに置くレイアウト */
const Stage: React.FC<{ children: React.ReactNode; justify?: "center" | "flex-start" }> = ({
  children,
  justify = "center",
}) => (
  <AbsoluteFill
    style={{
      padding: "260px 70px 420px",
      display: "flex",
      flexDirection: "column",
      justifyContent: justify,
      gap: 48,
      fontFamily: theme.font,
      color: theme.text,
    }}
  >
    {children}
  </AbsoluteFill>
);

const Caption: React.FC<{ children: React.ReactNode; color?: string; delay?: number }> = ({
  children,
  color = theme.text,
  delay = 0,
}) => (
  <div style={{ ...useEnter(delay), fontSize: 64, fontWeight: 800, color }}>{children}</div>
);

const Note: React.FC<{ children: React.ReactNode; delay: number }> = ({ children, delay }) => (
  <div
    style={{
      ...useEnter(delay),
      fontSize: 44,
      fontWeight: 700,
      lineHeight: 1.5,
      background: "rgba(255,255,255,0.06)",
      borderRadius: 20,
      padding: "28px 36px",
    }}
  >
    {children}
  </div>
);

// ---- 各シーン -------------------------------------------------------------

export const Hook: React.FC<{ s: ShortScript }> = ({ s }) => {
  const frame = useCurrentFrame();
  const shake = frame < 20 ? Math.sin(frame * 2.2) * (20 - frame) * 0.6 : 0;
  return (
    <Stage>
      <div
        style={{
          ...useEnter(0),
          fontSize: 92,
          fontWeight: 900,
          lineHeight: 1.3,
          whiteSpace: "pre-line",
          marginLeft: shake,
        }}
      >
        {s.hook.title}
      </div>
      <div style={{ ...useEnter(25), fontSize: 46, fontWeight: 700, color: theme.bad }}>
        ⚠ {s.hook.sub}
      </div>
    </Stage>
  );
};

const CodeSceneView: React.FC<{ scene: CodeScene; color: string }> = ({ scene, color }) => (
  <Stage>
    <Caption color={color}>{scene.caption}</Caption>
    <CodeBlock lines={scene.lines} startFrame={10} />
    <Note delay={10 + scene.lines.length * 6 + 20}>{scene.note}</Note>
  </Stage>
);

export const Ng: React.FC<{ s: ShortScript }> = ({ s }) => <CodeSceneView scene={s.ng} color={theme.bad} />;
export const Ok: React.FC<{ s: ShortScript }> = ({ s }) => <CodeSceneView scene={s.ok} color={theme.good} />;

export const Why: React.FC<{ s: ShortScript }> = ({ s }) => {
  const frame = useCurrentFrame();
  // 「試行回数」カウンター（演出用。毎秒数十億回のイメージ）
  const tries = Math.floor(interpolate(frame, [0, 200], [0, 9_870_000_000], { extrapolateRight: "clamp" }));
  return (
    <Stage>
      <Caption color={theme.warn}>{s.why.title}</Caption>
      <div
        style={{
          ...useEnter(5),
          fontFamily: theme.mono,
          fontSize: 60,
          fontWeight: 700,
          color: theme.bad,
          textAlign: "center",
          background: theme.badBg,
          borderRadius: 20,
          padding: "24px 0",
        }}
      >
        {tries.toLocaleString("en-US")} 回試行
      </div>
      {s.why.points.map((p, i) => (
        <div key={i} style={{ ...useEnter(30 + i * 45), fontSize: 46, fontWeight: 700, lineHeight: 1.5, display: "flex", gap: 20 }}>
          <span style={{ color: theme.bad }}>●</span>
          <span>{p}</span>
        </div>
      ))}
    </Stage>
  );
};

export const Requirement: React.FC<{ s: ShortScript }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12 } });
  return (
    <Stage>
      <div style={{ fontSize: 44, color: theme.muted, fontWeight: 700 }}>OWASP ASVS 5.0 の要件</div>
      <div style={{ display: "flex", alignItems: "center", gap: 28, transform: `scale(${pop})`, transformOrigin: "left center" }}>
        <div
          style={{
            fontFamily: theme.mono,
            fontSize: 110,
            fontWeight: 800,
            color: theme.accent,
          }}
        >
          {s.requirement}
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            background: theme.accent,
            color: theme.bg,
            borderRadius: 16,
            padding: "6px 22px",
          }}
        >
          L{s.level}
        </div>
      </div>
      <div style={{ ...useEnter(20), fontSize: 50, fontWeight: 700, lineHeight: 1.6, whiteSpace: "pre-line" }}>
        {s.requirementText}
      </div>
      <div style={{ ...useEnter(40), fontSize: 36, color: theme.muted }}>{s.chapter}</div>
    </Stage>
  );
};

export const Checkpoints: React.FC<{ s: ShortScript }> = ({ s }) => (
  <Stage>
    <Caption color={theme.accent}>{s.checkpoints.title}</Caption>
    {s.checkpoints.items.map((item, i) => (
      <div
        key={i}
        style={{
          ...useEnter(15 + i * 30),
          fontSize: 46,
          fontWeight: 700,
          display: "flex",
          gap: 24,
          alignItems: "center",
          background: theme.panel,
          border: `2px solid ${theme.border}`,
          borderRadius: 20,
          padding: "26px 32px",
        }}
      >
        <span style={{ color: theme.good, fontSize: 52 }}>✓</span>
        <span>{item}</span>
      </div>
    ))}
  </Stage>
);

export const Quiz: React.FC<{ s: ShortScript }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const revealAt = durationInFrames - Math.round(2.5 * fps);
  const revealed = frame >= revealAt;
  const countdown = Math.max(0, Math.ceil((revealAt - frame) / fps));
  return (
    <Stage>
      <div style={{ ...useEnter(0), fontSize: 70, fontWeight: 900, lineHeight: 1.35, whiteSpace: "pre-line" }}>
        {s.quiz.question}
      </div>
      {s.quiz.choices.map((c, i) => {
        const correct = i === s.quiz.answerIndex;
        const highlight = revealed && correct;
        return (
          <div
            key={i}
            style={{
              ...useEnter(15 + i * 10),
              fontSize: 52,
              fontWeight: 800,
              padding: "26px 36px",
              borderRadius: 20,
              border: `4px solid ${highlight ? theme.bad : theme.border}`,
              background: highlight ? theme.badBg : theme.panel,
              opacity: revealed && !correct ? 0.35 : 1,
            }}
          >
            {"ABC"[i]}. {c}
          </div>
        );
      })}
      <div style={{ fontSize: 44, fontWeight: 700, color: revealed ? theme.text : theme.muted, minHeight: 70 }}>
        {revealed ? `正解は ${"ABC"[s.quiz.answerIndex]}！ ${s.quiz.explanation}` : `考えてみてください… ${countdown}`}
      </div>
    </Stage>
  );
};

export const Outro: React.FC<{ s: ShortScript }> = ({ s }) => (
  <Stage>
    <div style={{ ...useEnter(0), fontSize: 64, fontWeight: 900, lineHeight: 1.4 }}>
      続きはリポジトリの
      <br />
      解説とハンズオンで
    </div>
    <div style={{ ...useEnter(10), fontFamily: theme.mono, fontSize: 34, color: theme.accent }}>
      github.com/kazumasamatsumoto/
      <br />
      owasp-asvs-study
    </div>
    <div style={{ ...useEnter(20), fontSize: 30, color: theme.muted, lineHeight: 1.6 }}>
      出典: OWASP Application Security Verification Standard 5.0.0 ({s.requirement})
      <br />
      CC BY-SA 4.0 / この動画も CC BY-SA 4.0 で公開
    </div>
  </Stage>
);
