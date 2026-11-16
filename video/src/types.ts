/** ショート動画 1 本分の台本。1 要件 = 1 本。 */
export type ShortScript = {
  /** Remotion の Composition ID（英数字とハイフンのみ） */
  id: string;
  /** 要件 ID（例: V11.4.2） */
  requirement: string;
  level: 1 | 2 | 3;
  chapter: string;
  /** 0〜3 秒で見せる「つかみ」 */
  hook: { title: string; sub: string };
  ng: CodeScene;
  why: { title: string; points: string[] };
  /** 要件の意訳（短く） */
  requirementText: string;
  ok: CodeScene;
  checkpoints: { title: string; items: string[] };
  quiz: { question: string; choices: string[]; answerIndex: number; explanation: string };
};

export type CodeLine = { text: string; mark?: "bad" | "good" };

export type CodeScene = {
  caption: string;
  language: "python" | "typescript";
  lines: CodeLine[];
  /** コードの下に出す一言 */
  note: string;
};
