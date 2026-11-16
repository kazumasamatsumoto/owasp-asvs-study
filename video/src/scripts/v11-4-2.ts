import type { ShortScript } from "../types";

// 出典: docs/chapters/V11-cryptography.md（V11.4.2）, docs/01-developer-pitfalls.md
export const v11_4_2: ShortScript = {
  id: "V11-4-2",
  requirement: "V11.4.2",
  level: 2,
  chapter: "V11 暗号",
  hook: {
    title: "そのパスワード保存、\nSHA-256 で\n済ませていませんか？",
    sub: "DB が漏れた瞬間に、総当たりが始まります",
  },
  ng: {
    caption: "❌ よくある NG",
    language: "python",
    lines: [
      { text: "import hashlib" },
      { text: "" },
      { text: "def save_password(password: str) -> str:" },
      { text: "    # 高速ハッシュ・ソルトなし", mark: "bad" },
      { text: "    return hashlib.sha256(", mark: "bad" },
      { text: "        password.encode()", mark: "bad" },
      { text: "    ).hexdigest()", mark: "bad" },
    ],
    note: "「ハッシュ化しているから安全」…ではありません",
  },
  why: {
    title: "なぜ危ない？",
    points: [
      "SHA-256 は「速い」のが仕事。GPU なら毎秒数十億回試せる",
      "ソルトなし → 同じパスワードは同じハッシュ。まとめて破られる",
      "漏えいした DB は、攻撃者の手元で時間無制限に解析される",
    ],
  },
  requirementText:
    "パスワードは、承認済みで計算コストの高い\nパスワードハッシュ関数（KDF）で保存し、\nパラメータは最新のガイダンスに合わせる",
  ok: {
    caption: "✅ OK：argon2id",
    language: "python",
    lines: [
      { text: "from argon2 import PasswordHasher" },
      { text: "" },
      { text: "ph = PasswordHasher(", mark: "good" },
      { text: "    time_cost=1, memory_cost=47104,", mark: "good" },
      { text: "    parallelism=1)", mark: "good" },
      { text: "" },
      { text: "stored = ph.hash(password)  # ソルトは自動" },
      { text: "ph.verify(stored, password) # 不一致は例外" },
    ],
    note: "「わざと遅く・メモリを食う」ことで総当たりを割に合わなくする",
  },
  checkpoints: {
    title: "パラメータの目安",
    items: [
      "argon2id：m ≥ 46 MiB, t = 1, p = 1",
      "bcrypt：cost ≥ 10",
      "PBKDF2-HMAC-SHA-256：600,000 回以上",
      "自前で sha256 を何回も回さない",
    ],
  },
  quiz: {
    question: "Q. パスワード保存に\n使ってはいけないのは？",
    choices: ["argon2id", "bcrypt", "SHA-256 一回"],
    answerIndex: 2,
    explanation: "高速ハッシュは「パスワードハッシュ関数」ではありません",
  },
};
