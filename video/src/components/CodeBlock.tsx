import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import type { CodeLine } from "../types";

// 外部ライブラリを使わない、ごく簡単なトークン色分け（Python / TS 共通）
const KEYWORDS = new Set([
  "import", "from", "def", "return", "if", "else", "const", "let", "function",
  "async", "await", "class", "new", "export",
]);

type Token = { text: string; color: string };

const tokenize = (line: string): Token[] => {
  const tokens: Token[] = [];
  const re = /(#.*$|\/\/.*$)|("[^"]*"|'[^']*')|(\b\d[\d_]*\b)|([A-Za-z_]\w*)|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const [whole, comment, str, num, ident] = m;
    if (comment) tokens.push({ text: whole, color: theme.muted });
    else if (str) tokens.push({ text: whole, color: "#a5d6ff" });
    else if (num) tokens.push({ text: whole, color: "#79c0ff" });
    else if (ident) {
      const next = line[re.lastIndex];
      const color = KEYWORDS.has(ident) ? "#ff7b72" : next === "(" ? "#d2a8ff" : theme.text;
      tokens.push({ text: whole, color });
    } else tokens.push({ text: whole, color: theme.text });
  }
  return tokens;
};

export const CodeBlock: React.FC<{ lines: CodeLine[]; startFrame?: number; perLine?: number }> = ({
  lines,
  startFrame = 0,
  perLine = 6,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        background: theme.panel,
        border: `2px solid ${theme.border}`,
        borderRadius: 24,
        padding: "36px 0",
        fontFamily: theme.mono,
        fontSize: 34,
        lineHeight: 1.6,
        width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}
    >
      {lines.map((line, i) => {
        const appear = startFrame + i * perLine;
        const opacity = interpolate(frame, [appear, appear + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const bg = line.mark === "bad" ? theme.badBg : line.mark === "good" ? theme.goodBg : "transparent";
        const bar = line.mark === "bad" ? theme.bad : line.mark === "good" ? theme.good : "transparent";
        return (
          <div
            key={i}
            style={{
              opacity,
              background: bg,
              borderLeft: `8px solid ${bar}`,
              padding: "0 36px 0 28px",
              whiteSpace: "pre",
              minHeight: "1.6em",
            }}
          >
            {tokenize(line.text).map((t, j) => (
              <span key={j} style={{ color: t.color }}>
                {t.text}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
};
