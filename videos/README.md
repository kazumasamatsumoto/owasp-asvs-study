# セキュリティ解説動画

1 本につき 1 テーマ。「何が弱点か → どう悪用されるか → どう防ぐか」を、**身近な例え**と、**手元のテスト用アプリを実際に動かした記録**で 3〜5 分で解説します。
YouTube チャンネル「のんかろりー2」に、毎日 7:00（日本時間）に 1 本ずつ予約投稿します（Angular の動画と同じ時刻）。

- 進み具合：[PROGRESS.md](PROGRESS.md)
- 公開予定：[PUBLISH-SCHEDULE.json](PUBLISH-SCHEDULE.json)

## シリーズ構成

| シリーズ | 1 本の単位 | 例 |
| --- | --- | --- |
| **A. 弱点編（メイン）** | CWE 1 項目 | SQL インジェクション、XSS、IDOR、SSRF |
| **B. 事件編** | 有名な CVE 1 件 | Log4Shell、Heartbleed |
| **C. ものさし編** | CVSS の評価項目 1 つ | 攻撃元区分（AV）、必要な特権（PR） |

CVE は「個別の事件」、CWE は「弱点の種類」なので、対策を教えるのは CWE 単位にします。CVE は弱点編の中で「実際に起きた事件」として紹介します。

## 1 本の流れ

| パート | 内容 |
| --- | --- |
| つかみ | 攻撃が成功する瞬間を記録で見せる |
| 1. 例え | 日常の場面に置き換えて、弱点の正体をイメージさせる |
| 2. 実際に動かす | `labs/` の脆弱なコードを動かし、入力 → 届いた命令 → 結果を記録で見せる |
| 3. 実際の事件 | 関連する CVE と CVSS（NVD で確認した値） |
| 4. 防ぐには | 例えに戻って説明 → 直したコードで同じ入力を記録 → 多層防御 |
| まとめ・クイズ | 2 行まとめ、CWE / OWASP Top 10 / ASVS の番号、クイズと答え（1 本で完結させる） |

## 作り方

道具：Remotion 4.0.544（React）、VOICEVOX（話者は青山龍星、手元のエンジン http://127.0.0.1:50021）。BGM なし。

```bash
cd videos
npm install

# 1. 手元のテスト用アプリで記録を録る（攻撃は自分のメモリ上の DB にだけ行う）
python3 -I scripts/record-lab01.py            # → recorded/lab01.json

# 2. 画面に出すコードを labs/ から切り出し、一字一句一致を確かめる
node scripts/code-sqlInjection.mjs
node scripts/verify-code.mjs                 # 「すべて一致」になること

# 3. 台本 src/videos/<名前>/script.ts を書き、声を作る（場面の長さは声の長さで決まる）
SPEED=1.05 node scripts/voice.mjs sqlInjection

# 4. 場面 Scenes.tsx を作り、src/Root.tsx に登録して書き出す
npx tsc --noEmit
npx remotion still SqlInjection out/stills/x.jpg --frame=<n>   # 何枚か目で確かめる
npx remotion render SqlInjection out/sql-injection.mp4

# 5. 10MB 未満に縮める（Chrome 拡張のアップロードは 1 回 10MB まで）
#    動画のビットレート ≒ 9.3MB × 8 ÷ 秒数 − 64k
npx remotion ffmpeg -i out/X.mp4 -c:v libx264 -preset slow -b:v <kbps> -pass 1 -passlogfile out/p2 -an -f mp4 /dev/null
npx remotion ffmpeg -i out/X.mp4 -c:v libx264 -preset slow -b:v <kbps> -pass 2 -passlogfile out/p2 -c:a aac -b:a 64k -movflags +faststart out/X-upload.mp4
```

### 守ること

- 字幕（`text`）に `'` を入れない（`voice.mjs` が `'` で区切って読むため）。攻撃の文字列は画面に出す。
- 読み（`yomi`）に英字を残さない（SQL →「エスキューエル」）。
- 攻撃は `labs/` の手元のテスト用アプリにだけ行い、その記録を見せる。他人のシステムへの手順にしない。
- CVE の CVSS や CWE は NVD で確かめた値を使う。
- 1 本で完結させる（「前回の」「次回の」と言わない。クイズの答えも同じ動画で出す）。
- 画面・字幕に個人のパスやメールアドレスを出さない。

### YouTube へのアップロード

- 必ず https://studio.youtube.com/channel/UC2vH2sKsZKshRb2Y-QlNsUQ/videos/upload?d=ud から上げる（youtube.com/upload は別のチャンネルに飛ぶことがある）。
- タイトル・説明に山かっこ（`<` `>`）は使えない。
- 説明：紹介 1〜2 文、0:00 から始まるチャプター、「画面のコードは … のソースそのままです」、演習の URL、関連する CWE / OWASP / ASVS、`VOICEVOX:青山龍星`。
- 子ども向けは「いいえ」。公開設定は**予約投稿**。日付は `PUBLISH-SCHEDULE.json` の最後の日の翌日、7:00、タイムゾーン (GMT+0900)。
  時刻はリストを座標でクリックせず、`role=option` の「7:00」を文字で選ぶ。
- チェックが「問題は検出されませんでした」になってから「スケジュールを設定」で保存する。
- 保存したら `PROGRESS.md` と `PUBLISH-SCHEDULE.json` に追記する。

## 台本の下書き

[drafts/](drafts/) に、場面ごとの「画面」と「ナレーション」の下書きを置きます。
