# V8 認可 — L1 要件を開発の観点で読む

> 対象: L1 要件 4 件 ／ 章の解説: [../chapters/V08-authorization.md](../chapters/V08-authorization.md)

## この章の要件を一言でいうと

「このユーザーは、この機能を使ってよいか」「このユーザーは、このデータ（ID 123 の注文）を見たり変えたりしてよいか」を判断するコード、つまりコントローラ・API ハンドラ・Server Action・GraphQL リゾルバ・クエリを書くときの話です。
認証（誰か）が済んでいても、認可（何をしてよいか）が抜けていれば、URL の ID を書き換えるだけで他人のデータが見えます。
L1 では、**ルールを文書化する / 機能単位で明示的に許可する / データ単位で明示的に許可する（IDOR・BOLA 対策）/ 判断はサーバー側で行う** の 4 点が求められます。
ハンズオンは [labs/lab04_idor](../../labs/lab04_idor/) で試せます。

## 要件ごとの読み解き

### V8.1.1 機能単位・データ単位の認可ルールを文書化する `L1`

> **原文**: Verify that authorization documentation defines rules for restricting function-level and data-specific access based on consumer permissions and resource attributes.

**ひとことで**: 「誰が・どの機能を使えるか」と「誰が・どのデータにアクセスできるか」のルールを、利用者の権限とリソースの属性に基づいて文書に定義する。

**開発の現場で言うと**: これは**ドキュメントを求める要件**です。文書化する内容の例:
- **機能単位**: ロール（一般会員・店舗スタッフ・管理者など）× 機能（注文作成、返金、ユーザー削除、CSV エクスポート）の可否表
- **データ単位**: リソースの属性に基づく条件。例:「注文は `owner_id` が本人のものだけ閲覧可」「サポート担当は担当店舗（`store_id`）の注文だけ閲覧可」「下書き状態（`status`）の記事は作成者だけ編集可」
- 「consumer」はユーザーだけでなく、他のサービスや API クライアントも含む点に注意（バッチや外部連携のクライアントの権限も書く）

形式は Markdown の表、OpenAPI の拡張属性、ポリシー定義ファイル（Pundit のポリシー、CASL、OPA など）でも構いませんが、開発者・テスト担当が読んで判定できることが大切です。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | 機能一覧と主要リソースごとに、上記のマトリクスと条件を作る。新機能の設計テンプレートに「認可ルール」欄を設ける |
| 実装 | 文書のルール名とコードのポリシー名（例: `order:refund`）を対応させ、追跡できるようにする |
| レビュー | 新しいエンドポイントや画面を追加する PR で、文書の更新が含まれているか |
| テスト | 文書のマトリクスの各セルをテストケースにできるか（できない＝文書が曖昧）。文書がない、またはデータ単位のルールが書かれていなければ fail |

**誤解しやすいポイント**: 「ロールの一覧（admin / user）を書いてある」だけでは、データ単位のルール（どの注文が見られるか）が抜けています。IDOR はまさにこの「データ単位」の考慮漏れから生まれるので、両方が必要です。

---

### V8.2.1 機能単位のアクセスを明示的な権限で制限する `L1`

> **原文**: Verify that the application ensures that function-level access is restricted to consumers with explicit permissions.

**ひとことで**: 各機能（エンドポイント・画面・操作）は、明示的に権限を与えられた利用者だけが使えるようにする。

**開発の現場で言うと**: 「ログインしていれば誰でも `/admin/users/delete` を呼べた」「一般ユーザーでも返金 API を叩けた」という不備です。「明示的な権限」とは、**許可が書かれていないものは拒否**（デフォルト拒否）ということです。
フレームワークの既定に注意します。例えば Django REST Framework の `DEFAULT_PERMISSION_CLASSES` は既定で `AllowAny` です。Next.js の Server Actions や Route Handlers は**直接呼び出せる公開エンドポイント**として扱い、中で権限を確認する必要があります。GraphQL では、クエリの入口だけでなくミューテーションや各リゾルバでの確認が漏れやすいです。
Spring Security の `authorizeHttpRequests`、Rails の Pundit / CanCanCan、Django の `permission_required` など、仕組みはどれも「書き忘れたエンドポイント」を守ってはくれません。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | デフォルト拒否を方針にする（全ルートで認証＋権限チェックを必須とし、公開するものだけ明示的に例外にする） |
| 実装 | 権限チェックをデコレータ・ミドルウェア・ポリシーで共通化する。Rails の Pundit なら `verify_authorized` のように「チェックを呼び忘れたら例外」にする仕組みを使う |
| レビュー | 新しいルート・コントローラ・Server Action（`"use server"`）・リゾルバに権限チェックがあるか。`AllowAny`、`permitAll()`、`skip_before_action :authenticate` を grep し、認可が外れている理由を確認 |
| テスト | 一般ユーザーのトークンで管理者専用 API を直接呼び、403 になること。権限のない利用者×全エンドポイントを総当たりする自動テスト（ルート一覧から生成）があると漏れに強い |

**誤解しやすいポイント**: 「管理画面のメニューは管理者にしか表示していない」は、URL を知っていれば呼べるので防御になりません（V8.3.1）。また「ログイン必須（`@login_required`）にしてある」は**認証**であって、機能単位の**認可**ではありません。

---

### V8.2.2 データ単位のアクセスを明示的な権限で制限する（IDOR / BOLA 対策） `L1`

> **原文**: Verify that the application ensures that data-specific access is restricted to consumers with explicit permissions to specific data items to mitigate insecure direct object reference (IDOR) and broken object level authorization (BOLA).

**ひとことで**: 個々のデータ（ID 123 の注文、ID 456 のファイル）へのアクセスは、そのデータに対する権限を持つ利用者だけに許す。

**開発の現場で言うと**: `GET /api/orders/123` の `123` を `124` に変えたら他人の注文が見えた、というのが IDOR / BOLA です。OWASP API Security Top 10 で最上位に挙げられている典型的な脆弱性です。
`Order.objects.get(id=pk)`、`Order.find(params[:id])`、`findById(id)` のように **ID だけで取得する**コードはすべて要注意です。どのフレームワークも、取得したデータが本人のものかは**自動では確認しません**。
閲覧だけでなく、更新・削除、ファイルのダウンロード、ネストしたリソース（`/projects/1/tasks/99` で task 99 が project 1 に属するか）、一括操作（`ids=[1,2,3]`）、エクスポート、GraphQL の `node(id:)` なども対象です。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | リソースごとに「誰のものか」（所有者・テナント・組織）を判定する属性を決める（V8.1.1 の文書）。ID を推測困難にする（UUID 化）は補助であり、認可の代わりにはならないと共有する |
| 実装 | 取得クエリ自体に条件を入れる（`current_user.orders.find(id)`、`Order.objects.get(id=pk, owner=request.user)`）か、取得後にポリシーで確認する。見つからない・権限がない場合の応答（404 か 403 か）も統一 |
| レビュー | `params[:id]`・`req.params.id`・`pk`・`@PathVariable` を使った `find`/`get`/`findById`/`findOne` で、所有者条件やポリシー呼び出しがないものを grep。一覧 API のフィルタ条件にユーザーが含まれているか |
| テスト | ユーザー A と B を用意し、B のトークンで A のリソース ID に対して GET / PUT / PATCH / DELETE を送り、すべて拒否されること。一括操作に A の ID を混ぜるケースも試す |

**誤解しやすいポイント**: 「ID を UUID にしたから推測されない」は不十分です。UUID は URL・ログ・共有リンク・他の API のレスポンスなどから漏れます。また「一覧画面には自分のデータしか出していない」のに、詳細 API・更新 API では所有者を確認していないケースが非常に多いです。

```ruby
# ❌ ID だけで取得
@order = Order.find(params[:id])
# ✅ 本人のデータの範囲から取得（他人の ID なら RecordNotFound）
@order = current_user.orders.find(params[:id])
```

---

### V8.3.1 認可はサーバー側の信頼できる層で強制する `L1`

> **原文**: Verify that the application enforces authorization rules at a trusted service layer and doesn't rely on controls that an untrusted consumer could manipulate, such as client-side JavaScript.

**ひとことで**: 認可の判断と強制は、利用者が改ざんできないサーバー側で行い、クライアント側の JavaScript などに頼らない。

**開発の現場で言うと**: SPA・モバイルアプリ・BFF 構成でよく崩れます。
- ボタンを `disabled` にしたり非表示にしたりするだけで、API 側では確認していない
- リクエストボディやクエリの `role=admin`・`isAdmin=true`・`userId=...` を、サーバーがそのまま判断に使っている
- 認可の結果を Cookie や localStorage（`localStorage.role`）に保存し、それを信じている
- Next.js の middleware だけで保護し、Server Action や Route Handler 側では確認していない
- モバイルアプリの画面制御だけで、API はアプリ以外からも呼べることを考慮していない

「信頼できる層」とは、利用者の手が届かないサーバー側（API サーバー、サービス層、API ゲートウェイなど）のことです。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | 認可を強制する層（例: 全 API はサービス層のポリシーを通す）を決める。フロントの表示制御は UX 目的と位置付ける |
| 実装 | 判断に使うユーザー ID・ロール・テナントは、サーバー側で検証したセッション／トークンから取り出す。リクエストの値は使わない |
| レビュー | `req.body.userId`、`req.body.role`、`params[:user_id]`、`isAdmin` などクライアント由来の値が認可判断に使われていないか。フロントだけにある権限チェック（`if (user.role === "admin")`）に対応するサーバー側チェックがあるか |
| テスト | ブラウザの DevTools や curl / Burp で、UI では押せない操作の API を直接送る。`role` や `userId` をリクエストに追加・改ざんして送り、結果が変わらないこと |

**誤解しやすいポイント**: 「API はうちのフロントからしか呼ばれない」は成り立ちません。ブラウザの通信は誰でも見て再現できます。また「JWT に `role` が入っているから改ざんできない」は、サーバーが署名を検証している場合に限ります（V7.2.1 / V9 章）。

---

## この章のまとめ: PR レビューで聞く質問

- この機能・リソースの認可ルール（誰が何をできるか、どのデータにアクセスできるか）は文書のどこに書かれていますか？
- 新しく追加したエンドポイント・Server Action・リゾルバに、ログイン確認とは別の権限チェックがありますか？ チェックがない場合は拒否されるデフォルト拒否になっていますか？
- ID を受け取ってデータを取得する箇所で、そのデータが現在のユーザー（またはテナント）のものかを確認していますか？
- 認可の判断に、リクエストボディやクエリから来た `userId`・`role` などの値を使っていませんか？
- 別ユーザーのトークンで他人のリソースを GET / PUT / DELETE するテストがありますか？
