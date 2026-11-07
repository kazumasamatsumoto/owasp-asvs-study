# ASVS を「開発の観点」で読む

ASVS の要件は、たとえば次のように書かれています。

> Verify that the application ensures that data-specific access is restricted to consumers with explicit permissions to specific data items to mitigate insecure direct object reference (IDOR) and broken object level authorization (BOLA). — **V8.2.2**

正しい文章ですが、これを読んだだけで「明日、自分が書くどのコードの、どこに気をつければいいか」までは分かりません。
このディレクトリは、**ASVS の要件文を開発現場の具体的な行動に読み替える**練習をするための教材です。

---

## 1. ASVS の文章はなぜ分かりにくいのか

理由は 3 つあります。

### ① 主語が「検証する人」になっている

ほぼすべての要件が **"Verify that ..."（〜であることを検証する）** で始まります。ASVS はもともと「監査する人・テストする人」が pass / fail を判定するための基準だからです。

開発者は、これを次のように**主語を入れ替えて**読みます。

> 「〜であることを検証する」
> ↓
> 「**検証されたときに pass するには、自分は何を決めて、何を作っておけばいいか**」

### ② わざと技術に依存しない書き方をしている

ASVS は Django でも Rails でも Spring でも使えるように、特定のフレームワークの名前や API を避けて書かれています。
そのため「パラメータ化クエリを使う」とは書いてあっても、「あなたのプロジェクトの、このファイルのこの書き方が危ない」とまでは書いてありません。**この最後の一歩を埋めるのが開発者の仕事**です。

### ③ 「どう実装するか」ではなく「何を達成するか」だけを書いている

原文は、ASVS の役割を「達成すべき目標を決めること」と定めていて、実装方法は OWASP Cheat Sheet Series など別のプロジェクトに任せています。
だから ASVS だけを読んでいても実装方法は分かりません。**ASVS で「何を守るか」を知り、Cheat Sheet やフレームワークのドキュメントで「どう守るか」を調べる**、という使い分けになります。

---

## 2. 要件を 4 つのタイプに分けて考える

このリポジトリでは、要件を次の 4 タイプに分けて読むことを勧めています（ASVS 公式の分類ではなく、開発者向けの読み方の補助です）。タイプによって、**誰が・いつ・何をするか**が変わります。

| タイプ | 見分け方 | 開発者がやること | いつ | 例 |
| --- | --- | --- | --- | --- |
| **① 文書化要件** | 各章の最初のセクション（`◯◯ Documentation`）。"documentation defines ..." | ルールを**決めて書き残す**。決めないと実装要件の pass / fail も判定できない | 要件定義・設計 | V8.1.1 認可ルールを文書化する |
| **② 実装要件** | アプリの振る舞いについての要件 | **コードで**守る。テストで確認できる | 実装・レビュー・テスト | V8.2.2 データ単位の認可 |
| **③ 設定・環境要件** | サーバー、TLS、デプロイ、ヘッダ、Cookie 属性など | **設定ファイル・インフラ定義**で守る | 構築・デプロイ | V12.1.1 TLS 1.2 以上だけを有効にする |
| **④ プロセス要件** | 期限・棚卸し・ローテーションなど、継続的な活動 | **チームの運用**として回す | 運用 | V15.1.1 脆弱な依存ライブラリの修正期限を決める |

### 文書化要件は「実装要件とペア」で読む

ASVS 5.0 の大きな特徴が文書化要件です。たとえば次の 2 つはペアになっています。

| 文書化要件（設計で決める） | 実装要件（コードで守る） |
| --- | --- |
| V8.1.1 機能・データごとのアクセスルールを文書化する | V8.2.1 / V8.2.2 そのルールどおりに機能・データへのアクセスを制限する |
| V2.1.1 入力値の検証ルールを文書化する | V2.2.1 そのルールに基づいて入力を検証する |
| V6.1.1 ブルートフォース対策の方針を文書化する | V6.3.1 その方針どおりに対策を実装する |
| V15.1.1 依存ライブラリの修正期限を決める | V15.2.1 その期限を超えた脆弱なライブラリを含めない |

「ドキュメントを書くのは面倒」と感じるかもしれませんが、開発の観点ではこう考えるとしっくりきます。

> **ルールが決まっていなければ、レビューでもテストでも「これは正しいのか？」を判定できない。**
> たとえば「一般ユーザーは他人の請求書を見られてはいけない」と誰も書いていなければ、IDOR を見つけても「仕様です」と言われて終わってしまう。

文書は立派な Word ファイルである必要はありません。原文も、共通ライブラリやコードとして決定を残す方法を認めています。実務では、たとえば次のような形で残せます。

- 設計ドキュメントや ADR（Architecture Decision Record）
- 権限マトリクスの表（ロール × 機能 × データ範囲）
- 共通のバリデーションスキーマ（OpenAPI、JSON Schema、Zod、Pydantic）
- 認可ポリシーのコード（`policies/invoice.py` のような形で一か所にまとめたもの）

---

## 3. 1 つの要件を読み替える 5 つの質問

どの要件も、次の 5 つの質問に答えると開発の観点に落とし込めます。

| # | 質問 | 狙い |
| --- | --- | --- |
| Q1 | **自分のアプリのどの機能・どのコードに関係する？** | 関係ない要件は対象外にしてよい（例: WebRTC を使っていなければ V17 は対象外） |
| Q2 | **フレームワークがデフォルトで守ってくれる部分はどこ？** | そこは「デフォルトを崩していないか」だけ確認すればよい |
| Q3 | **開発者が自分で書かないと守れない部分・うっかり崩せる部分はどこ？** | 本当に気をつけるべき場所。**穴ができるのはたいていここ** |
| Q4 | **pass / fail をどうやって確かめる？** | レビューで探すパターン、テストで送る入力値 |
| Q5 | **事前に決めておくべきこと（文書化すること）は何？** | 閾値・許可リスト・権限ルールなど |

### 例: V8.2.2（データ単位の認可）を 5 つの質問で読む

> Verify that the application ensures that data-specific access is restricted to consumers with explicit permissions to specific data items to mitigate insecure direct object reference (IDOR) and broken object level authorization (BOLA).

**Q1. どこに関係する？**
URL・パス・クエリ・ボディに **ID が含まれるすべてのエンドポイント**です。`/orders/:id`、`/users/:id/profile`、`/files/:fileId/download`、GraphQL の `node(id:)`、一括操作 API の `ids: [...]` など。

**Q2. フレームワークは守ってくれる？**
**ほぼ守ってくれません。** ログインしているかどうか（認証）はミドルウェアで一括チェックできても、「このユーザーがこのデータを触ってよいか」はアプリごとの業務ルールなので、フレームワークには分かりません。

**Q3. 開発者が崩しやすいのはどこ？**
- `Model.find(params[:id])` のように **ID だけでレコードを取る**書き方
- 一覧 API ではユーザーで絞り込んでいるのに、**詳細・更新・削除 API では絞り込み忘れ**
- 子リソース（`/projects/1/tasks/99`）で、親の `project_id` は確認しているが、**`task 99` が本当に `project 1` に属しているか**は確認していない
- ファイルのダウンロード URL、エクスポート機能、管理用の内部 API など、「画面から直接は見えない」入口

**Q4. どう確かめる？**
- レビュー: `find(` / `get(` / `findById` / `get_object_or_404` などで、**所有者・テナントの条件が付いているか**を見る
- テスト: ユーザー A でログインし、**ユーザー B のリソース ID** でアクセスするテストを、詳細・更新・削除のすべてに書く（→ [Lab 04](../../labs/lab04_idor/)）

**Q5. 決めておくことは？**
V8.1.1 の権限マトリクスです。「誰が、どのデータを、どの操作で」触れるかを表にしておきます。他人のデータにアクセスされたとき 403 と 404 のどちらを返すかも決めておきます。

---

## 4. 開発の流れのどこで ASVS を使うか

| 開発の段階 | ASVS の使い方 | 特に関係する章・セクション |
| --- | --- | --- |
| **要件定義・設計** | 各章の文書化要件（`*.1`）を「設計時に決めることリスト」として使う | V1.1, V2.1, V5.1, V6.1, V7.1, V8.1, V11.1, V13.1, V14.1, V15.1, V16.1 |
| **実装** | 機能を作るときに関係する章を読む（→ [01. 開発者向け: やりがちな穴](../01-developer-pitfalls.md) の付録 B） | 機能による |
| **コードレビュー** | 要件を「レビューで聞く質問」に変える（各ファイル末尾の質問集） | V1, V2, V8, V15.3 |
| **テスト** | 要件を「テストケース」に変える。ASVS 自身も、自動化された単体テスト・結合テストの指針として使うことを勧めている | V1, V3, V5, V6, V7, V8, V9 |
| **デプロイ・構築** | 設定・環境要件をインフラのチェックリストにする | V3.4, V12, V13.4 |
| **運用** | プロセス要件を定期タスクにする | V15.1, V15.2, V16, V13.3 |

---

## 5. L1 要件の読み解き（章別）

L1 の 70 要件を 1 件ずつ、次の形で読み解いています。

> **原文** → **ひとことで** → **開発の現場で言うと** → **設計／実装／レビュー／テストでやること** → **誤解しやすいポイント**

| 章 | L1 要件数 | 読み解き |
| --- | :---: | --- |
| V1 エンコーディングとサニタイズ | 8 | [V01](V01-encoding-and-sanitization.md) |
| V2 入力検証とビジネスロジック | 4 | [V02](V02-validation-and-business-logic.md) |
| V3 Web フロントエンドセキュリティ | 8 | [V03](V03-web-frontend-security.md) |
| V4 API と Web サービス | 2 | [V04](V04-api-and-web-service.md) |
| V5 ファイル処理 | 4 | [V05](V05-file-handling.md) |
| V6 認証 | 13 | [V06](V06-authentication.md) |
| V7 セッション管理 | 6 | [V07](V07-session-management.md) |
| V8 認可 | 4 | [V08](V08-authorization.md) |
| V9 自己完結型トークン | 4 | [V09](V09-self-contained-tokens.md) |
| V10 OAuth と OIDC | 5 | [V10](V10-oauth-and-oidc.md) |
| V11 暗号 | 3 | [V11](V11-cryptography.md) |
| V12 安全な通信 | 3 | [V12](V12-secure-communication.md) |
| V13 設定 | 1 | [V13](V13-configuration.md) |
| V14 データ保護 | 2 | [V14](V14-data-protection.md) |
| V15 セキュアコーディングとアーキテクチャ | 3 | [V15](V15-secure-coding-and-architecture.md) |
| V16 / V17 | 0 | L1 要件なし（章の解説を参照） |

**おすすめの読み方**: 自分のプロジェクトのコードを横に開いて、1 要件ごとに「うちのコードではどこにあたる？」を探しながら読んでください。読むだけより何倍も身につきます。

---

## 6. 練習問題: L2 の要件を自分で読み替えてみる

L1 の読み解きを読んだら、次の L2 要件を 5 つの質問（Q1〜Q5）で読み替えてみましょう。

### 練習 1: V3.3.4

> Verify that if the value of a cookie is not meant to be accessible to client-side scripts (such as a session token), the cookie must have the 'HttpOnly' attribute set and the same value (e. g. session token) must only be transferred to the client via the 'Set-Cookie' header field.

<details><summary>読み替えの例</summary>

- **Q1 どこ？** ログイン処理と、Cookie を発行するすべての箇所。SPA なら「ログイン API のレスポンス」も関係します。
- **Q2 フレームワークは？** 多くのフレームワークはセッション Cookie に `HttpOnly` を付ける設定を持っています。ただし既定値はフレームワークやバージョンによって違うので、**自分の設定で確認**します。
- **Q3 崩しやすいところ** 後半の「**同じ値を Set-Cookie 以外で渡さない**」が見落とされがちです。たとえば SPA でログイン API がレスポンスボディにもトークンを入れて返すと、JS から読めてしまうので `HttpOnly` の意味がなくなります。
- **Q4 確かめ方** ブラウザの開発者ツールで Cookie の属性を確認します。ログイン API のレスポンスボディにセッショントークンが含まれていないことをテストで確認します。
- **Q5 決めること** どの Cookie が JS から読める必要があるか（CSRF トークン用の Cookie など）の一覧。

</details>

### 練習 2: V2.4.1

> Verify that anti-automation controls are in place to protect against excessive calls to application functions that could lead to data exfiltration, garbage-data creation, quota exhaustion, rate-limit breaches, denial-of-service, or overuse of costly resources.

<details><summary>読み替えの例</summary>

- **Q1 どこ？** 「大量に呼ばれると困る機能」の洗い出しから始めます。SMS・メール送信（費用がかかる）、LLM API の呼び出し（費用がかかる）、検索・エクスポート（データを抜き出せる）、会員登録・投稿（ゴミデータが作れる）、パスワードリセット。
- **Q2 フレームワークは？** 基本的には守ってくれません。WAF・API ゲートウェイ・ライブラリ（`django-ratelimit`、`express-rate-limit`、`rack-attack` など）で実装します。
- **Q3 崩しやすいところ** IP アドレスだけで制限すると、プロキシの背後では全員が同じ IP に見えたり、`X-Forwarded-For` を偽装されたりします（→ V15.3.4）。ユーザー単位・機能単位の制限も組み合わせます。
- **Q4 確かめ方** 短時間に同じリクエストを連続で送り、429 が返る・処理が止まることを確認します。
- **Q5 決めること** 機能ごとの上限値（1 分あたり何回、1 日あたり何通など）と、超えたときの挙動。

</details>

### 練習 3: V5.1.1（文書化要件）

> Verify that the documentation defines the permitted file types, expected file extensions, and maximum size (including unpacked size) for each upload feature. Additionally, ensure that the documentation specifies how files are made safe for end-users to download and process, such as how the application behaves when a malicious file is detected.

<details><summary>読み替えの例</summary>

- **Q1 どこ？** アップロード機能の**仕様書**です。コードではありません。「アバター画像」「請求書 PDF」「CSV インポート」のように機能ごとに分けて決めます。
- **Q2/Q3** 文書化要件なので、フレームワークは関係ありません。崩しやすいのは「全部まとめて 10MB まで」のように**機能ごとに分けずに決めてしまう**ことと、zip などの**展開後のサイズ**を決め忘れることです。
- **Q4 確かめ方** 設計レビューで、機能ごとに「許可する形式・拡張子・最大サイズ・展開後の最大サイズ・ウイルス検出時の挙動」が埋まっているかを確認します。そのうえで、実装要件（V5.2.1, V5.2.2 など）のテストの期待値として使います。
- **Q5** これ自体が「決めること」です。

</details>
