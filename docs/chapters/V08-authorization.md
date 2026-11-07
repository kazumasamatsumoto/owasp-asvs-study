# V8 認可（Authorization）

> 📘 原文: [0x17-V8-Authorization.md](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x17-V8-Authorization.md)
> 📊 要件数: **13**（L1: 4 / L2: 3 / L3: 6）
> ✅ 全要件のチェックリスト: [checklists/by-chapter/V8.md](../../checklists/by-chapter/V8.md)

## 1. この章の目的

認可（Authorization）とは、許可された利用者（ユーザー、サーバー、その他のクライアント。ASVS では「コンシューマー」と呼ぶ）だけがアクセスできるようにする仕組みです。この章は最小権限の原則（POLP: Principle of Least Privilege）を実現するために、大きく 2 つのことを求めています。1 つ目は、判断材料や環境コンテキストを含めて認可ルールを**文書化**すること。2 つ目は、コンシューマーが自分に定義された権限（エンタイトルメント）で許可されたリソースにだけアクセスできるよう**実装**することです。

認証（V6）が「あなたは誰か」を確かめるのに対し、認可は「あなたはそれをしてよいか」を毎回判断します。IDOR/BOLA（他人のデータを ID 書き換えで閲覧）のような認可不備（アクセス制御の不備）は、OWASP Top 10 2021 で A01「Broken Access Control」として筆頭に挙げられている、非常に多い脆弱性です。

## 2. セクション構成

| セクション | 日本語名 | 何を扱うか（1行） | 要件数 |
| --- | --- | --- | :---: |
| V8.1 | 認可の文書化 | 機能・データ・フィールド単位および環境属性に基づく認可ルールを文書に定義する | 4 |
| V8.2 | 認可の全般的な設計 | 機能・データ・フィールド単位の明示的な権限チェックと、適応型（アダプティブ）制御 | 4 |
| V8.3 | 操作レベルの認可 | 信頼できる層での強制、権限変更の即時反映、元の主体の権限に基づく判断 | 3 |
| V8.4 | その他の認可上の考慮事項 | マルチテナントのテナント間分離と、管理インターフェースの多層防御 | 2 |

## 3. 押さえるべき重要要件

### V8.2.1 — 機能レベルのアクセス制御（L1）

- **要件（意訳）**: 機能（エンドポイントや画面・操作）へのアクセスが、明示的な権限を持つコンシューマーに限定されていることを確認する。
- **なぜ重要か**: 管理画面のリンクを UI から隠しているだけだと、攻撃者が `/admin/users/delete` のような URL を直接叩くだけで管理機能を実行できてしまいます（機能レベルの認可不備）。
- **実装のポイント**: すべてのエンドポイントに「誰が実行できるか」を宣言的に付ける。デフォルト拒否（明示的に許可されていなければ拒否）にする。

```python
# ❌ NG 例: ログインしていれば誰でも管理機能を呼べる
@app.post("/admin/users/<int:user_id>/delete")
@login_required
def delete_user(user_id):
    User.query.get_or_404(user_id).delete()
    return "", 204

# ✅ OK 例: 明示的な権限を要求する
@app.post("/admin/users/<int:user_id>/delete")
@login_required
@require_permission("user:delete")   # 権限が無ければ 403
def delete_user(user_id):
    User.query.get_or_404(user_id).delete()
    return "", 204
```

### V8.2.2 — データ単位のアクセス制御（IDOR/BOLA 対策）（L1）

- **要件（意訳）**: 個々のデータ項目へのアクセスが、その特定のデータに対する明示的な権限を持つコンシューマーに限定されていることを確認する。これにより IDOR（Insecure Direct Object Reference）や BOLA（Broken Object Level Authorization）を防ぐ。
- **なぜ重要か**: `GET /api/orders/1001` を `1002` に変えるだけで他人の注文情報が見えてしまう、というのが典型的な IDOR です。ID が連番でなくても（UUID でも）、ID が漏れれば同じことが起きます。
- **実装のポイント**: 「ID でレコードを取る」のではなく「**このユーザーがアクセスできる範囲の中から** ID で取る」。クエリ条件に所有者やテナントを必ず含める。

```python
# ❌ NG 例: ID さえ分かれば誰の注文でも取れる
@app.get("/api/orders/<int:order_id>")
@login_required
def get_order(order_id):
    order = Order.query.get_or_404(order_id)
    return order.to_dict()

# ✅ OK 例: 所有者条件をクエリに含める
@app.get("/api/orders/<int:order_id>")
@login_required
def get_order(order_id):
    order = Order.query.filter_by(id=order_id, owner_id=current_user.id).first()
    if order is None:
        abort(404)  # 存在有無を漏らさないため 404 を返す設計もよくある
    return order.to_dict()
```

### V8.2.3 — フィールド単位のアクセス制御（BOPLA 対策）（L2）

- **要件（意訳）**: フィールド（オブジェクトのプロパティ）へのアクセスが、その特定フィールドへの明示的な権限を持つコンシューマーに限定されていることを確認する。これにより BOPLA（Broken Object Property Level Authorization）を防ぐ。
- **なぜ重要か**: 読み取り側では、API レスポンスに `password_hash` や `is_admin` など本来見せないフィールドが含まれてしまう（過剰なデータ露出）。書き込み側では、プロフィール更新 API に `{"role": "admin"}` を混ぜて送ると権限昇格できてしまう（マスアサインメント）。
- **実装のポイント**: 入出力ともに「許可するフィールドの allowlist」を定義する。ORM オブジェクトをそのまま返したり、リクエストボディをそのまま `update(**body)` したりしない。

```python
# ❌ NG 例: リクエストのキーを全部そのまま反映（role も書き換えられる）
@app.patch("/api/me")
@login_required
def update_me():
    for k, v in request.json.items():
        setattr(current_user, k, v)
    db.session.commit()
    return current_user.__dict__   # password_hash まで返ってしまう

# ✅ OK 例: 書き込み・読み取りそれぞれ allowlist
WRITABLE = {"display_name", "bio"}
READABLE = ("id", "display_name", "bio")

@app.patch("/api/me")
@login_required
def update_me():
    for k in WRITABLE & request.json.keys():
        setattr(current_user, k, request.json[k])
    db.session.commit()
    return {k: getattr(current_user, k) for k in READABLE}
```

なお V8.1.2 にあるとおり、フィールドの読み書き可否はデータの状態（例: 「承認済みの申請は金額を変更不可」）に依存する場合もあり、それもルールとして文書化します。

### V8.3.1 — 信頼できるサービス層での強制（L1）

- **要件（意訳）**: 認可ルールが信頼できるサービス層で強制されており、クライアント側 JavaScript のように信頼できないコンシューマーが改ざんできる制御に依存していないことを確認する。
- **なぜ重要か**: ブラウザ上の JS でボタンを非表示・無効化しても、攻撃者は DevTools や curl で API を直接呼べます。フロントエンドのチェックは UX のためのものであって、セキュリティ境界ではありません。
- **実装のポイント**: サーバー側（API・バックエンド）で必ず認可する。クライアントから送られる `isAdmin=true` や `role` などの値を判断材料にしない。

```javascript
// ❌ NG 例: フロントでボタンを隠すだけ（API 側にチェックなし）
if (user.role === "admin") showDeleteButton();

// ✅ OK 例: フロントの表示制御は UX 目的。API 側でも必ず権限チェックする
// （サーバー側の @require_permission("user:delete") が本当の防御）
```

### V8.1.1 — 認可ルールの文書化（L1）

- **要件（意訳）**: 認可ドキュメントに、コンシューマーの権限とリソースの属性に基づいて、機能レベルおよびデータ単位のアクセスを制限するルールが定義されていることを確認する。
- **なぜ重要か**: 「誰が何をできるか」が文書になっていないと、開発者ごとに判断がぶれ、テスト担当者も何が正しい挙動か判定できません。結果としてチェック漏れのエンドポイントが生まれます。
- **実装のポイント**: ロール × 機能、所有関係 × データのマトリクスを作り、コード（ポリシー定義）とテストケースの両方の元にする。

```python
# ✅ OK 例: 文書化したルールをそのままコードのポリシー定義に落とす
POLICY = {
    "order:read":   lambda user, order: order.owner_id == user.id or user.has_role("support"),
    "order:cancel": lambda user, order: order.owner_id == user.id and order.status == "pending",
    "user:delete":  lambda user, _: user.has_role("admin"),
}
```

### V8.4.1 — マルチテナントのテナント間制御（L2）

- **要件（意訳）**: マルチテナントのアプリケーションが、テナント間の制御（クロステナント制御）を用いて、コンシューマーの操作が、操作権限を持たないテナントに決して影響しないようにしていることを確認する。
- **なぜ重要か**: SaaS で A 社のユーザーが `tenant_id` を書き換えて B 社のデータを閲覧・更新できれば、一件で全顧客に影響する重大インシデントになります。
- **実装のポイント**: テナント ID はリクエストパラメータではなく認証済みセッション/トークンから取得する。全クエリにテナント条件を自動付与する仕組み（リポジトリ層、行レベルセキュリティなど）を使う。

```python
# ❌ NG 例: テナントをクライアント指定値から取る
tenant_id = request.args["tenant_id"]
docs = Document.query.filter_by(tenant_id=tenant_id).all()

# ✅ OK 例: 認証済みコンテキストからテナントを決定
docs = Document.query.filter_by(tenant_id=current_user.tenant_id).all()
```

### V8.3.2 — 認可に関わる値の変更の即時反映（L3）

- **要件（意訳）**: 認可判断の元になる値の変更が即座に反映されることを確認する。即時反映できない場合（自己完結型トークン内のデータに依存している場合など）は、権限を失ったコンシューマーが操作を行ったときに警告し、その変更を元に戻す緩和策が必要。ただしこの代替策では情報漏えいは防げない点に注意。
- **なぜ重要か**: 退職者や権限を剥奪されたユーザーが、有効期限の長い JWT を持ち続けていると、剥奪後もしばらく操作を続けられてしまいます。
- **実装のポイント**: 権限はリクエストごとにサーバー側のデータから評価する。JWT に権限を埋め込む場合は有効期限を短くし、失効リストや検知・ロールバックの仕組みを用意する。

### V8.3.3 — 元の主体の権限で判断する（L3）

- **要件（意訳）**: オブジェクトへのアクセスが、仲介するサービスの権限ではなく、元の主体（コンシューマー）の権限に基づいて判断されることを確認する。たとえば、コンシューマーが自己完結型トークンでサービス A を呼び、A がさらにサービス B にデータを要求する場合、B は A のマシン間（M2M）トークンではなく、コンシューマーのトークンを使って権限を判断する。
- **なぜ重要か**: 内部サービスが強い M2M 権限で下流を呼ぶと、上流の認可漏れがそのまま下流の全データへのアクセスにつながります（いわゆる「混乱した代理人（confused deputy）」問題）。
- **実装のポイント**: 下流呼び出しにユーザーのトークン（またはユーザー主体を保持したトークン）を伝搬させ、下流でも同じ主体で認可する。

## 4. よくある脆弱性・アンチパターン

- **UI で隠すだけ**: メニュー非表示・ボタン無効化だけで、API に権限チェックがない（V8.2.1, V8.3.1）。
- **ID を受け取ってそのまま検索**: `Model.get(id)` の後に所有者チェックを忘れる。一覧 API ではフィルタしているのに詳細・更新・削除 API で漏れる、というパターンが特に多い（V8.2.2）。
- **「UUID だから推測できないので安全」**: ID の推測困難性は認可の代わりになりません。ログや URL 共有などで ID は漏れます（V8.2.2）。
- **マスアサインメント / 過剰なデータ露出**: リクエストボディを丸ごとモデルに反映、モデルを丸ごと JSON で返す（V8.2.3）。
- **テナント ID をクライアントから受け取る**: ヘッダやクエリの `tenant_id` を信用する（V8.4.1）。
- **権限を長寿命トークンに焼き込む**: ロール変更や退職が反映されない（V8.3.2）。
- **社内ネットワークからなら管理画面に入れる**: ネットワーク位置だけを認可の根拠にする（V8.4.2 は L3 だが、考え方として重要）。
- **チェックが各ハンドラに散在**: 新規エンドポイント追加時に書き忘れる。ミドルウェアやデコレータで「デフォルト拒否」にする。

## 5. 検証（テスト）のヒント

- **2 アカウント法**: ユーザー A と B を用意し、A で作成したリソースの ID を使って B のセッションで参照・更新・削除を試す。GET だけでなく PUT/PATCH/DELETE も必ず試す。
- **ロール横断テスト**: 一般ユーザーのセッションで管理者用エンドポイントを直接呼ぶ。Burp Suite の拡張機能（Autorize、AuthMatrix など）を使うと、セッションを差し替えて全リクエストを再送し、レスポンス差分で漏れを見つけやすい。
- **フィールド操作**: 更新 API に `role`、`is_admin`、`owner_id`、`tenant_id`、`price` などのフィールドを追加して送り、反映されないか確認する。レスポンスに不要なフィールドが含まれていないかも見る。
- **テナント越境**: テナント A のユーザーで、テナント B のリソース ID・テナント ID を指定してアクセスする。
- **権限剥奪後の挙動**: ロールを外した直後に、既存セッション/既存トークンで操作できるか確認する（V8.3.2）。
- **コードレビュー**: ルーティング一覧と認可デコレータ/ポリシーの対応表を作り、チェックの無いエンドポイントを洗い出す。DB クエリに所有者・テナント条件が入っているかを見る。
- **自動テスト**: 認可マトリクス（V8.1.1）から「このロールはこの操作で 403 になるべき」というテストを生成し CI で回す。

## 6. 確認問題

**Q1.** `GET /api/invoices/{id}` で、ログイン中のユーザーが `id` を書き換えると他人の請求書が取得できる。この脆弱性の名前と、対応する ASVS 要件 ID を答えてください。

<details><summary>答えと解説</summary>

IDOR（Insecure Direct Object Reference）/ BOLA（Broken Object Level Authorization）です。対応要件は **V8.2.2**（L1、データ単位のアクセスは特定データへの明示的権限を持つコンシューマーに限定）。クエリに所有者条件を入れるなど、「アクセス可能な範囲の中から」取得するよう修正します。

</details>

**Q2.** 次のうち V8.3.1 の観点で**不十分**な対策はどれですか。
(a) サーバー側のミドルウェアでロールをチェックする
(b) 管理者以外にはフロントエンドの JavaScript で削除ボタンを表示しない
(c) API ゲートウェイの後段サービスでも認可ポリシーを評価する

<details><summary>答えと解説</summary>

**(b)** です。クライアント側 JavaScript は攻撃者が改ざん・回避できるため、認可の強制手段として依存してはいけません（V8.3.1）。UX のために表示を制御するのは構いませんが、サーバー側でのチェックが必須です。

</details>

**Q3.** プロフィール更新 API に `{"display_name": "x", "role": "admin"}` を送ったら管理者になれた。これはどの要件に違反し、何と呼ばれる脆弱性クラスですか。

<details><summary>答えと解説</summary>

**V8.2.3**（L2、フィールド単位のアクセス制御）違反で、BOPLA（Broken Object Property Level Authorization）に該当します。いわゆるマスアサインメントです。書き込み可能なフィールドを allowlist で制限します。なお、フィールド単位のルールを文書化することは V8.1.2 で求められています。

</details>

**Q4.** マイクロサービス構成で、フロントの API サービスがユーザーのリクエストを受け、下流のデータサービスを**自分自身の強力なサービスアカウントトークン**で呼び出している。L3 アプリケーションで問題となる要件 ID と理由を答えてください。

<details><summary>答えと解説</summary>

**V8.3.3**（L3）です。オブジェクトへのアクセスは、仲介サービスではなく元の主体（コンシューマー）の権限で判断しなければなりません。下流サービスはユーザーのトークンを使って権限判断する必要があります。そうしないと、上流の認可漏れが下流の全データへのアクセスにつながります。

</details>

**Q5.** 権限情報を埋め込んだ JWT（有効期限 24 時間）を使っており、ユーザーのロールを剥奪してもトークンの期限が切れるまで操作できてしまう。V8.3.2 はこの状況で何を求めていますか。

<details><summary>答えと解説</summary>

**V8.3.2**（L3）は、認可判断の元になる値の変更を即座に反映することを求めています。自己完結型トークンなどで即時反映できない場合は、権限を失ったコンシューマーが操作したときに**警告し、その変更を元に戻す**緩和策が必要です。ただし原文が注記しているとおり、この代替策では情報漏えい（読み取りによる漏えい）は防げません。

</details>

## 7. 関連リソース

- OWASP Cheat Sheet: [Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Insecure Direct Object Reference Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html)
- OWASP WSTG: [Authorization Testing](https://owasp.org/www-project-web-security-testing-guide/stable/4-Web_Application_Security_Testing/05-Authorization_Testing)
- 関連する章: V6（認証）、V7（セッション管理）、V9（自己完結型トークン）、V10（OAuth と OIDC）
