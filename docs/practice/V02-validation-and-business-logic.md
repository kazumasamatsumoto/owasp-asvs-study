# V2 検証とビジネスロジック — L1 要件を開発の観点で読む

> 対象: L1 要件 4 件 ／ 章の解説: [../chapters/V02-validation-and-business-logic.md](../chapters/V02-validation-and-business-logic.md)

## この章の要件を一言でいうと

「リクエストを受け取って、業務上の判断をするコード（金額計算、在庫引当、権限の付与、手続きの進行）を書くとき」の話です。
V1 が「データを別の解釈系に渡すときに構文を壊さない」話だったのに対し、V2 は「**その値・その順番は業務的にあり得るのか**」をサーバー側で確かめる話です。
L1 で求められるのは、①検証ルールを文書として定義する、②業務・セキュリティ上の判断に使う入力を許可リストで検証する、③その検証を信頼できるサーバー側で行う、④複数ステップの手続きを飛ばさせない、の 4 点です。
入力検証は SQL インジェクションや XSS の対策（V1）を **置き換えるものではない**、という点も原文が明記しています。

## 要件ごとの読み解き

### V2.1.1 入力検証ルールの文書化 `L1`

> **原文**: Verify that the application's documentation defines input validation rules for how to check the validity of data items against an expected structure. This could be common data formats such as credit card numbers, email addresses, telephone numbers, or it could be an internal data format.

**ひとことで**: 各入力項目について「何が正しい値か」をチェックするルールを、ドキュメントとして定義しておくこと（文書化の要件）。

**開発の現場で言うと**: この要件が求めているのは **コードではなくドキュメント** です。会員登録フォーム、注文 API、CSV 一括インポートなどを作るとき、「電話番号はどの形式を許すか（ハイフン有無、国番号）」「注文数量は 1〜99 の整数」「社員番号は `E` + 6 桁」のようなルールを、実装前に決めて書き残すことを指します。
文書化する内容の例:
- 項目名、型、必須／任意、最小・最大長、文字種、形式（正規表現や標準規格）、取りうる値の列挙、数値の範囲
- 内部フォーマット（注文番号、クーポンコード、独自 ID）の構造
- 複数項目の整合性（開始日 ≤ 終了日、配送先国と郵便番号形式の組み合わせ）

形式としては、API なら OpenAPI / JSON Schema がそのまま「文書」と「実装の元」を兼ねられるので有力です。画面なら項目定義書（スプレッドシートや設計書の表）でも構いません。フレームワークが自動でやってくれることはなく、**チームが決めて残す** 必要があります。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | 項目定義書または OpenAPI / JSON Schema に、全入力項目の型・長さ・形式・範囲・列挙値を書く。内部フォーマットは仕様（桁数、チェックディジットの有無など）を明記する |
| 実装 | 文書のルールとバリデータ（Django Forms / DRF Serializer、Rails の `validates`、Spring の Bean Validation、zod / Joi など）を 1 対 1 で対応させる。可能ならスキーマからバリデータを生成し、ずれを防ぐ |
| レビュー | 新しい入力項目を追加した PR で、項目定義（OpenAPI など）も更新されているか。ドキュメントとバリデータの値（最大長など）が一致しているか |
| テスト | 定義書の各ルールから境界値テストを作る（最大長ちょうど・+1 文字、範囲の下限−1・上限+1、列挙外の値）。ドキュメントのない入力項目が存在しないか、API 一覧と突き合わせて確認する |

**誤解しやすいポイント**: 「コードにバリデーションが書いてあるから文書は不要」と考えがちですが、要件は **documentation に定義されていること** を求めています。コードだけだと「どれが意図したルールで、どれが実装漏れか」をレビューやテストで判定できません。逆に「文書はあるが実装と食い違っている」状態も、検証の役に立たないので注意が必要です。

---

### V2.2.1 業務上の期待に沿った入力検証（許可リスト） `L1`

> **原文**: Verify that input is validated to enforce business or functional expectations for that input. This should either use positive validation against an allow list of values, patterns, and ranges, or be based on comparing the input to an expected structure and logical limits according to predefined rules. For L1, this can focus on input which is used to make specific business or security decisions. For L2 and up, this should apply to all input.

**ひとことで**: 入力値が業務的にあり得る値かを、「許可する値・形式・範囲」のリスト（または期待する構造）と照合して検証すること。L1 では、業務やセキュリティの判断に使う入力を重点的に。

**開発の現場で言うと**: L1 で特に優先すべきなのは「その値によってお金・権限・状態が変わる入力」です。
- EC: 数量（負数や 0、小数、巨大な数）、割引率、クーポンコード、配送方法
- 送金・ポイント: 金額（負数で逆方向の送金になる）、通貨コード
- 権限や状態: `role`、`status`、`plan` といった列挙値、承認フラグ
- 処理量を決める値: ページサイズ `limit`、エクスポート期間（原文にもある「ループ回数を決める数値」）

フレームワークは「型変換」や「宣言したバリデーションの実行」はしてくれますが、**どの値を許すかは開発者が決めて書かないと何もチェックされません**。たとえば DRF の `IntegerField()` は整数であることは保証しますが、`min_value` を書かなければ `-100` を通します。zod の `z.number()` も同様です。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | 各入力が「何の判断に使われるか」を洗い出し、業務・セキュリティ判断に使うものから許可値・範囲を決める（例: 数量 1〜99 の整数、`status` は `draft/published` のみ、`limit` 最大 100） |
| 実装 | 列挙値は enum / choices で許可リスト化する。数値は型 + 最小／最大を必ず指定する。形式は全体一致（`^...$` / `\A...\z`）の正規表現で検証する。クライアントが送るべきでない値（価格、合計額、`role`）は受け取らずサーバーで決める |
| レビュー | `request.POST[`、`params[`、`req.body.`、`@RequestBody` から取り出した値が検証なしで計算・分岐・DB 更新に使われていないか。数値フィールドに最小／最大の指定があるか。正規表現にアンカーがあるか（Ruby の `^$` は行単位なので `\A\z` を使う） |
| テスト | 数量に `-1`、`0`、`1.5`、`1e9`、`"abc"`、`[]` を、`status` に `"deleted"`、`"PUBLISHED"` を送り、すべて 4xx で拒否されること。正規表現検証の項目に `valid\nmalicious` のような改行入りの値を送って通らないこと |

**誤解しやすいポイント**: 「型が合っていれば OK」「危険な文字（`<`, `'`）を拒否しているから OK」はどちらも不十分です。前者は業務的にあり得ない値（負の数量）を通し、後者は拒否リストなので抜け道が残るうえ、そもそも業務的な妥当性を見ていません。また入力検証をしても、SQL のパラメータ化や出力エンコード（V1）は依然として必要です。

```python
# DRF の例: 型だけでなく範囲と列挙を明示する
class OrderItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=99)
    shipping = serializers.ChoiceField(choices=["standard", "express"])
    # price は受け取らない（サーバー側で商品マスタから決める）
```

---

### V2.2.2 信頼できるサーバー側での入力検証 `L1`

> **原文**: Verify that the application is designed to enforce input validation at a trusted service layer. While client-side validation improves usability and should be encouraged, it must not be relied upon as a security control.

**ひとことで**: 入力検証はサーバー側（信頼できる層）で必ず行い、ブラウザやアプリ側の検証をセキュリティ対策として当てにしないこと。

**開発の現場で言うと**: フォームに `required` や `maxlength`、`pattern`、`<select>` の選択肢、React Hook Form + zod のクライアント検証を付けて「入力チェック完了」としてしまうケースです。攻撃者は curl やブラウザの開発者ツール、プロキシツールで、画面を通さずに任意のリクエストを送れます。
特に注意が必要な構成:
- **Next.js の Server Actions / Route Handlers**: フォームから呼ばれる関数でも外部から直接呼び出せるエンドポイントなので、関数の中で検証が必要
- **モバイルアプリ + API**: アプリ側の検証は改ざんしたクライアントで回避できる
- **BFF とバックエンド API の分割**: BFF で検証しているからとバックエンドが無検証だと、バックエンドに直接到達できた場合に無防備（どの層を「信頼できる層」とするか設計で決める必要がある）

Django Forms、Rails のモデルバリデーション、Spring の `@Valid` などはサーバー側で動くので、**正しく呼び出されていれば** 要件を満たす基盤になります。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | 「どの層で検証を強制するか」を決める（通常は API / サービス層）。クライアントとサーバーで同じスキーマ（zod を共有する、OpenAPI から生成する等）を使い、クライアント検証は UX 目的と位置づける |
| 実装 | 全エンドポイント・Server Action の入口でスキーマ検証を実行する。Spring なら `@Valid` / `@Validated` の付け忘れに注意。検証失敗時はサーバー側で 4xx を返し、処理を続行しない |
| レビュー | フォーム側にだけ `pattern` / `maxlength` / zod スキーマがあり、対応するサーバー側ハンドラに検証がない箇所。`"use server"` の関数、`@RequestBody` に `@Valid` がない引数、`form.is_valid()` を呼ばずに `request.POST` を直接使う Django ビュー |
| テスト | UI を通さず curl / Postman / Burp で、クライアント検証が弾く値（`maxlength` 超過、`<select>` にない値、`required` 項目の欠落）を直接送り、サーバーが 4xx で拒否すること。例: `curl -X POST /api/orders -H 'Content-Type: application/json' -d '{"quantity":-5}'` |

**誤解しやすいポイント**: 「画面からは不正な値を入力できないようにしている」は、攻撃者が画面を使うという前提に立った誤りです。また「サーバーにも検証はある」場合でも、クライアントでだけ検証している **一部の項目** が漏れていることがよくあります。クライアントとサーバーの検証ルールが一致しているか、項目単位で確かめましょう。

---

### V2.3.1 業務フローの手順を飛ばさせない `L1`

> **原文**: Verify that the application will only process business logic flows for the same user in the expected sequential step order and without skipping steps.

**ひとことで**: 複数ステップからなる手続きは、同じユーザーが、決められた順番どおりに、途中を飛ばさずに進めた場合にだけ処理すること。

**開発の現場で言うと**: 次のような「ウィザード型」「多段階」の処理で問題になります。
- 購入: カート → 配送先 → 支払い → 確認 → 確定。支払いステップを飛ばして確定 API を直接呼べないか
- パスワードリセット: メールのコード検証 → 新パスワード設定。コード検証を飛ばして設定 API を呼べないか
- 多要素認証: パスワード認証 → MFA → ログイン完了。MFA 画面の時点でもう認証済みセッションになっていないか
- 申請・承認ワークフロー: 申請 → 上長承認 → 経理承認。承認前に「支払い済み」へ状態遷移できないか

「同じユーザー」という点も重要で、A さんが途中まで進めた手続きを B さんのリクエストで完了できてはいけません。
フレームワークにはこの制御の既定機能は基本的にないため、**開発者がサーバー側で状態を持って制御する必要があります**。画面遷移の順番（フロントのルーティング）だけで順序を守っているつもりの実装が典型的な穴です。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | 手続きを状態遷移図（ステートマシン）として書き、「どの状態からどの状態へ、どのステップで遷移できるか」を定義する。状態はサーバー側（セッションや DB）に保持し、誰の手続きかを紐付ける |
| 実装 | 各ステップのハンドラ冒頭で「現在の状態が期待どおりか」「手続きの所有者がリクエストユーザーか」を検証する。状態はクライアントの hidden フィールドや URL パラメータ（`step=3`、`verified=true`）に持たせない。完了したら状態を破棄し、同じ手続きを再利用させない |
| レビュー | 確定・完了系のエンドポイントで、前ステップの完了確認が入っているか。`hidden` の `step`、`verified`、`paid` などのフラグをクライアントから受け取っていないか。手続き ID（`order_id`、`reset_token`）とログインユーザーの紐付け確認があるか |
| テスト | ステップ 1 だけ実行した状態で、最終ステップの API を直接呼ぶ（例: 支払い未完了で `POST /checkout/confirm`）→ 拒否されること。ステップ 2 → 1 → 3 の順に呼ぶ。ユーザー A の手続き ID を使ってユーザー B のセッションで次ステップを呼ぶ → 拒否されること。完了済み手続きの最終ステップを再送 → 二重処理されないこと |

**誤解しやすいポイント**: 「画面にはステップ 1 からしか進めない導線しかない」は、URL や API を直接叩かれることを考慮していません。また「最終ステップで全項目を再検証しているから大丈夫」という場合も、**途中ステップでしか行っていない処理**（支払い、本人確認、コード検証）が飛ばされていないかを別途確認する必要があります。

```python
# 状態をサーバー側に持ち、所有者と現在状態をチェックする例
def confirm_checkout(request, checkout_id):
    co = Checkout.objects.get(id=checkout_id, user=request.user)  # 所有者チェック
    if co.state != "PAYMENT_AUTHORIZED":                           # 前ステップ完了チェック
        return HttpResponseBadRequest("invalid step")
    co.transition_to("CONFIRMED")
```

---

## この章のまとめ: PR レビューで聞く質問

- 新しく追加した入力項目のルール（型・長さ・範囲・形式）は、項目定義書や OpenAPI などのドキュメントに書かれていますか？
- 金額・数量・権限・状態など、業務判断に使う値に許可リスト（列挙・範囲・全体一致の形式）での検証がありますか？
- クライアント側の検証と同じルールが、サーバー側（Server Action や API ハンドラの中）でも強制されていますか？
- 価格や合計額、ロールなど、本来サーバーが決めるべき値をクライアントから受け取っていませんか？
- 多段階の手続きで、各ステップが「前のステップが完了していること」と「同じユーザーの手続きであること」をサーバー側で確認していますか？
