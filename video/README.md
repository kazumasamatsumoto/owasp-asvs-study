# ASVS ショート動画（Remotion）

1 要件 = 1 本、縦型 1080×1920・約 51 秒のショート動画を TypeScript で生成します。

## 使い方

```bash
cd video
npm install
npm run studio   # ブラウザでプレビュー
npm run render   # out/V11-4-2.mp4 を書き出し
```

## 構成

| ファイル | 役割 |
| --- | --- |
| `src/types.ts` | 台本の型 `ShortScript` |
| `src/scripts/*.ts` | 台本（1 要件 1 ファイル）。`scripts/index.ts` に登録すると Composition が増える |
| `src/theme.ts` | 色・フォント・シーンごとの秒数 |
| `src/components/Scenes.tsx` | つかみ → NG → なぜ危ない → 要件 → OK → 目安 → クイズ → 出典 の各シーン |
| `src/components/CodeBlock.tsx` | 行ごとに表示されるコード（NG 行は赤、OK 行は緑） |

画面の上下と右端には Shorts / TikTok の UI が重なるため、文字は中央寄り（上 260px・下 420px を空ける）に配置しています。

## ライセンス

要件文は OWASP ASVS 5.0.0（CC BY-SA 4.0）に基づきます。動画も CC BY-SA 4.0 で公開し、出典を明記してください（アウトロに表示されます）。
