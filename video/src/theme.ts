export const theme = {
  bg: "#0d1117",
  panel: "#161b22",
  border: "#30363d",
  text: "#e6edf3",
  muted: "#8b949e",
  accent: "#58a6ff",
  bad: "#f85149",
  badBg: "rgba(248, 81, 73, 0.16)",
  good: "#3fb950",
  goodBg: "rgba(63, 185, 80, 0.16)",
  warn: "#d29922",
  font: '"Noto Sans CJK JP", "Noto Sans JP", "Hiragino Sans", sans-serif',
  mono: '"DejaVu Sans Mono", "JetBrains Mono", Menlo, monospace',
} as const;

export const FPS = 30;

/** シーンごとの長さ（秒）。合計がそのまま動画の長さになる。 */
export const SCENES = {
  hook: 3.5,
  ng: 7.5,
  why: 8,
  requirement: 6,
  ok: 9,
  checkpoints: 7,
  quiz: 7,
  outro: 3,
} as const;

export type SceneName = keyof typeof SCENES;

export const sceneFrames = (name: SceneName) => Math.round(SCENES[name] * FPS);

export const totalFrames = (Object.keys(SCENES) as SceneName[]).reduce(
  (sum, k) => sum + sceneFrames(k),
  0,
);
