# V4 API と Web サービス（API and Web Service）

> 📘 原文: [0x13-V4-API-and-Web-Service.md](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x13-V4-API-and-Web-Service.md)
> 📊 要件数: **16**（L1: 2 / L2: 8 / L3: 6）
> ✅ 全要件のチェックリスト: [checklists/by-chapter/V4.md](../../checklists/by-chapter/V4.md)

## 1. この章の目的

この章は、Web ブラウザやその他の利用者に向けて API を公開するアプリケーション（一般に JSON、XML、GraphQL を使うもの）に特有の考慮事項を扱います。API に適用すべきセキュリティ設定や仕組みがまとめられています。

ただし原文が強調しているとおり、認証、セッション管理、入力検証など他の章の要件も API にそのまま適用されます。そのため、この章だけを切り出して理解したりテストしたりすることはできません。「API だから V4 だけ見ればよい」のではなく、V4 は API ならではの追加要件と捉えてください。

## 2. セクション構成

| セクション | 日本語名 | 何を扱うか（1行） | 要件数 |
| --- | --- | --- | :---: |
| V4.1 | 汎用的な Web サービスセキュリティ | Content-Type、HTTP→HTTPS リダイレクト、中間層ヘッダ、HTTP メソッド、メッセージ署名 | 5 |
| V4.2 | HTTP メッセージ構造の検証 | リクエストスマグリング、ヘッダインジェクション、長すぎるメッセージによる DoS | 5 |
| V4.3 | GraphQL | 高コストなクエリによる DoS、本番でのイントロスペクション | 2 |
| V4.4 | WebSocket | WSS、Origin 検証、WebSocket 用のセッション管理 | 4 |

V4.2 は、HTTP メッセージの処理・生成全般に関係しますが、原文によると **異なる HTTP バージョン間でメッセージを変換するとき**（例: フロントの HTTP/2 をバックエンドの HTTP/1.1 に変換するロードバランサ）に特に重要です。

## 3. 押さえるべき重要要件

### V4.1.1 — Content-Type と charset を正しく付ける（L1）

- **要件（意訳）**: メッセージボディを持つすべての HTTP レスポンスに、実際の内容と一致する `Content-Type` ヘッダフィールドを含めること。IANA Media Types に従い、`text/*`、`*/*+xml`、`*/xml` などでは安全な文字エンコーディング（UTF-8、ISO-8859-1 など）を指定する `charset` パラメータも含めること。
- **なぜ重要か**: JSON を `text/html` で返すと、JSON 内の文字列に `<script>` が含まれていた場合にブラウザが HTML として解釈して XSS になり得ます。charset がないと、ブラウザが文字コードを推測して想定外の解釈をする余地が生まれます。
- **実装のポイント**: フレームワークの JSON レスポンス機能を使い、文字列を手で返すときは型と charset を明示します。

```python
# ❌ NG 例: JSON 文字列を text/html（Flask のデフォルト）で返す
@app.get("/api/user")
def user():
    return json.dumps(data)

# ✅ OK 例
from flask import jsonify
@app.get("/api/user")
def user():
    return jsonify(data)               # Content-Type: application/json

@app.get("/report.txt")
def report():
    return Response(text, content_type="text/plain; charset=utf-8")
```

### V4.4.1 — WebSocket は WSS を使う（L1）

- **要件（意訳）**: すべての WebSocket 接続に WebSocket over TLS（WSS）を使うこと。
- **なぜ重要か**: `ws://` は平文なので、チャットの内容やトークンが盗聴・改ざんされます。
- **実装のポイント**: クライアントの接続先は常に `wss://` にし、サーバー側（またはリバースプロキシ）で平文の WebSocket を受け付けないようにします。

```javascript
// ❌ NG 例
const ws = new WebSocket("ws://chat.example.com/socket");

// ✅ OK 例
const ws = new WebSocket("wss://chat.example.com/socket");
```

### V4.4.2 — WebSocket ハンドシェイクでの Origin 検証（L2）

- **要件（意訳）**: WebSocket の最初の HTTP ハンドシェイクで、`Origin` ヘッダフィールドをアプリに許可されたオリジンのリストと照合すること。
- **なぜ重要か**: WebSocket には CORS のような仕組みが適用されないため、Origin を確認しないと攻撃者のサイトから、被害者の Cookie を使って WebSocket 接続を確立されます（クロスサイト WebSocket ハイジャッキング）。
- **実装のポイント**: ハンドシェイク時に許可リストと完全一致で比較し、一致しなければ接続を拒否します。

```python
# ✅ OK 例（websockets ライブラリ）: 許可オリジン以外のハンドシェイクを拒否
import websockets

async def main():
    async with websockets.serve(
        handler, "0.0.0.0", 8765,
        origins=["https://app.example.com"],
    ):
        ...
```

### V4.1.3 — 中間層が付けるヘッダをユーザーに上書きさせない（L2）

- **要件（意訳）**: ロードバランサ、Web プロキシ、BFF（backend-for-frontend）サービスなどの中間層が設定し、アプリが利用する HTTP ヘッダフィールドを、エンドユーザーが上書きできないこと。例としては `X-Real-IP`、`X-Forwarded-*`、`X-User-ID` などがある。
- **なぜ重要か**: 攻撃者が自分で `X-Forwarded-For: 127.0.0.1` や `X-User-ID: 1` を付けて送ると、IP 制限・レート制限の回避や、他人へのなりすましができてしまいます。
- **実装のポイント**: 信頼できるプロキシの段数を明示し、その数だけヘッダを信頼します。プロキシ側ではクライアント由来の同名ヘッダを削除・上書きします。

```python
# ❌ NG 例: クライアントが自由に付けられるヘッダをそのまま信頼
client_ip = request.headers.get("X-Forwarded-For")
user_id = request.headers.get("X-User-ID")

# ✅ OK 例（Flask）: 前段のプロキシが 1 段であることを明示
from werkzeug.middleware.proxy_fix import ProxyFix
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)
client_ip = request.remote_addr     # ProxyFix が信頼できる段からのみ取得
```

```nginx
# プロキシ側: クライアントから来た X-User-ID は捨て、自分で設定した値だけを渡す
proxy_set_header X-User-ID "";
proxy_set_header X-Real-IP $remote_addr;
```

### V4.1.2 — 自動 HTTPS リダイレクトはユーザー向けエンドポイントだけ（L2）

- **要件（意訳）**: HTTP から HTTPS への自動リダイレクトは、ユーザーが Web ブラウザで手動アクセスすることを想定したエンドポイントだけで行い、その他のサービスやエンドポイントでは透過的なリダイレクトを実装しないこと。これは、クライアントが誤って暗号化されていない HTTP リクエストを送っているのに、自動リダイレクトで HTTPS に転送されるために機密データの漏えいが発覚しない状況を避けるためである。
- **なぜ重要か**: API クライアントが `http://api.example.com` に API キー付きで送り続けても、リダイレクトで動いてしまえば誰も設定ミスに気付かず、平文のキーがネットワーク上を流れ続けます。
- **実装のポイント**: API のホストやパスでは HTTP を受けたらリダイレクトせずエラーにする（あるいは HTTP ポートを開けない）ようにします。

```nginx
# ブラウザ向けサイト: リダイレクトしてよい
server { listen 80; server_name www.example.com; return 301 https://$host$request_uri; }

# API: リダイレクトせず拒否する
server { listen 80; server_name api.example.com; return 403; }
```

### V4.2.1 — リクエストスマグリング対策（L2）

- **要件（意訳）**: ロードバランサ、ファイアウォール、アプリケーションサーバーを含むすべてのコンポーネントが、HTTP バージョンに応じた適切な仕組みで受信 HTTP メッセージの境界を決定し、HTTP リクエストスマグリングを防ぐこと。HTTP/1.x では、`Transfer-Encoding` ヘッダがある場合は RFC 2616 に従い `Content-Length` を無視すること。HTTP/2 や HTTP/3 では、`Content-Length` ヘッダがある場合、それが DATA フレームの長さと一致することを受信側が確認すること。
- **なぜ重要か**: フロントのプロキシとバックエンドでリクエストの終わりの判断が食い違うと、攻撃者は 1 つのリクエストの中に別のリクエストを「密輸」でき、他のユーザーのリクエストに自分の内容を混ぜたり、プロキシ側のアクセス制御を回避したりできます。
- **実装のポイント**: 自前で HTTP をパースしないこと。プロキシ・サーバーを最新に保ち、`Content-Length` と `Transfer-Encoding` が両方あるような曖昧なリクエストを拒否する設定を検討します。

```http
# 攻撃例の形: CL と TE が両方ある曖昧なリクエスト
POST / HTTP/1.1
Host: example.com
Content-Length: 13
Transfer-Encoding: chunked

0

SMUGGLED
```

### V4.3.1 / V4.3.2 — GraphQL の DoS 対策とイントロスペクション（L2）

- **要件（意訳）**:
  - V4.3.1: 高コストな入れ子クエリによる GraphQL やデータ層の式の DoS を防ぐため、クエリの許可リスト、深さ制限、量の制限、クエリのコスト分析のいずれかを使うこと。
  - V4.3.2: GraphQL API が他者に使われることを意図していない限り、本番環境では GraphQL のイントロスペクションクエリを無効にすること。
- **なぜ重要か**: `user { friends { friends { friends { ... } } } }` のような深い入れ子クエリ 1 本でサーバーやデータベースを過負荷にできます。イントロスペクションが有効だと、攻撃者に全スキーマ（隠しフィールドや管理用ミューテーション）を教えてしまいます。
- **実装のポイント**: ライブラリのバリデーションルールで深さやコストを制限し、本番ではイントロスペクションを無効化します。

```python
# ✅ OK 例（Strawberry GraphQL）: 深さ制限 + 本番でイントロスペクション無効化
import strawberry
from strawberry.extensions import QueryDepthLimiter, AddValidationRules
from graphql.validation import NoSchemaIntrospectionCustomRule

extensions = [QueryDepthLimiter(max_depth=5)]
if IS_PRODUCTION:
    extensions.append(AddValidationRules([NoSchemaIntrospectionCustomRule]))

schema = strawberry.Schema(query=Query, extensions=extensions)
```

### V4.4.3 / V4.4.4 — WebSocket のセッション管理（L2）

- **要件（意訳）**:
  - V4.4.3: アプリの標準のセッション管理を使えない場合は専用のトークンを使い、そのトークンが関連するセッション管理のセキュリティ要件（V7）を満たすこと。
  - V4.4.4: 既存の HTTPS セッションから WebSocket チャネルに移行するとき、専用の WebSocket セッション管理トークンは、事前に認証済みの HTTPS セッションを通じて最初に取得または検証されること。
- **なぜ重要か**: WebSocket 接続時に認証を確認しないと、未認証の利用者がリアルタイムのデータを受信できてしまいます。推測可能なトークンや期限のないトークンを使うと、それ自体が弱点になります。
- **実装のポイント**: 認証済みの HTTPS API で短命・使い捨てのチケットを発行し、WebSocket 接続時にそのチケットを検証します。

```python
# ✅ OK 例: 認証済み HTTPS セッションで短命チケットを発行し、WS 接続時に検証
@app.post("/ws-ticket")
@login_required
def issue_ticket():
    ticket = secrets.token_urlsafe(32)
    redis.setex(f"ws:{ticket}", 30, current_user.id)  # 30 秒有効
    return {"ticket": ticket}

async def handler(ws):
    ticket = await ws.recv()
    user_id = redis.getdel(f"ws:{ticket}")             # 一度だけ使える
    if user_id is None:
        await ws.close(code=4401)
        return
```

## 4. よくある脆弱性・アンチパターン

- **`return json.dumps(...)` で JSON を返し、`Content-Type: text/html` になっている**（V4.1.1）。
- **`text/*` のレスポンスに charset を付けない**（V4.1.1）。
- **API でも HTTP→HTTPS の自動リダイレクトを有効にしている**ため、クライアントの設定ミスによる平文送信に気付けない（V4.1.2）。
- **`X-Forwarded-For` / `X-User-ID` / `X-Real-IP` をそのまま信頼**し、IP 制限・レート制限・認証を回避される（V4.1.3）。
- **TRACE や想定外のメソッドが有効**なまま（V4.1.4, L3 は使わないメソッドのブロックを要求）。
- **フロントのプロキシとバックエンドのサーバーで HTTP の解釈が異なる**構成を放置し、リクエストスマグリングを許す（V4.2.1）。
- **HTTP/2 → HTTP/1.1 の変換時に CR/LF を含むヘッダ値をそのまま通す**（V4.2.4, L3）。
- **バックエンドから外部 API を呼ぶとき、ユーザー入力で URL や Cookie ヘッダが際限なく長くなる**（V4.2.5, L3）。
- **GraphQL で深さ・コストの制限がない**、**本番でイントロスペクションが有効**（V4.3.1, V4.3.2）。
- **`ws://` を使っている**（V4.4.1）。
- **WebSocket ハンドシェイクで Origin を確認しない**ことによるクロスサイト WebSocket ハイジャッキング（V4.4.2）。
- **WebSocket 接続後に認証を確認しない**、または URL のクエリに長期有効なトークンを載せる（V4.4.3, V4.4.4）。

## 5. 検証（テスト）のヒント

- **Content-Type の確認**: 全エンドポイントのレスポンスヘッダを収集し（ZAP や Burp の履歴から一覧化すると楽です）、実際の内容と `Content-Type` が一致し、`text/*` に charset があるかを確認します。
- **HTTP リダイレクト**: `curl -v http://api.example.com/...` で API が 301/302 を返していないかを確認します。
- **中間層ヘッダ**: `X-Forwarded-For: 127.0.0.1` や `X-User-ID: 1` を付けたリクエストを送り、アプリの判断（ログ上の IP、レート制限、ユーザー識別）が変わらないことを確認します。
- **HTTP メソッド**: `OPTIONS` / `TRACE` / `PUT` / `DELETE` などを各エンドポイントに送り、想定外のメソッドが 405 などで拒否されるかを確認します（V4.1.4）。
- **リクエストスマグリング**: Burp Suite の HTTP Request Smuggler 拡張などで、CL.TE / TE.CL / H2 ダウングレード系のパターンを検証環境で試します。本番での試験は他ユーザーに影響し得るので注意します。
- **GraphQL**: `{ __schema { types { name } } }` を送ってイントロスペクションが無効か確認し、深い入れ子クエリや大量のエイリアスを含むクエリで制限がかかるかを確認します。OWASP WSTG の GraphQL テストの章が参考になります。
- **WebSocket**: ブラウザの開発者ツールで接続先が `wss://` か確認し、`Origin` を書き換えたハンドシェイク（Burp の WebSocket 機能など）が拒否されるか、未認証で接続・受信できないかを確認します。

## 6. 確認問題

**Q1.** 次の Flask コードはどの要件に反しているか。また修正方法を答えよ。
```python
@app.get("/api/items")
def items():
    return json.dumps(load_items())
```

<details><summary>答えと解説</summary>

V4.1.1（L1）です。Flask は文字列を返すと `Content-Type: text/html; charset=utf-8` になるため、実際の内容（JSON）と一致しません。`jsonify(load_items())` を使って `application/json` で返すように修正します。

</details>

**Q2.** 「API サーバーでも、HTTP でアクセスされたら HTTPS に 301 リダイレクトするのが親切だ」という意見について、V4.1.2 の観点から評価せよ。

<details><summary>答えと解説</summary>

望ましくありません。V4.1.2（L2）は、HTTP→HTTPS の自動リダイレクトはブラウザで手動アクセスされるユーザー向けエンドポイントだけに限定し、他のサービスやエンドポイントでは透過的なリダイレクトをしないよう求めています。API でリダイレクトすると、クライアントが誤って平文で機密データ（API キーなど）を送っていても動いてしまい、漏えいが発覚しないからです。

</details>

**Q3.** アプリが `X-Forwarded-For` ヘッダの値をクライアント IP としてレート制限に使っている。どんな攻撃が考えられ、どの要件に関係するか。

<details><summary>答えと解説</summary>

攻撃者がリクエストごとに異なる `X-Forwarded-For` を自分で付けて送ることで、IP 単位のレート制限を回避したり、IP 許可リストを `127.0.0.1` などで突破したりできます。V4.1.3（L2）は、中間層が設定するヘッダ（`X-Real-IP`、`X-Forwarded-*`、`X-User-ID` など）をエンドユーザーが上書きできないことを求めています。信頼できるプロキシの段数を固定し、プロキシ側でクライアント由来の値を上書きします。

</details>

**Q4.** GraphQL API について、V4.3 の 2 つの要件を挙げ、それぞれ何を防ぐためのものか説明せよ。

<details><summary>答えと解説</summary>

- **V4.3.1（L2）**: クエリの許可リスト、深さ制限、量の制限、クエリのコスト分析のいずれかを使い、高コストな入れ子クエリによる DoS を防ぐ。
- **V4.3.2（L2）**: GraphQL API が他者に使われることを意図していない限り、本番環境でイントロスペクションクエリを無効にする。スキーマ全体が攻撃者に知られることを防ぐ。

</details>

**Q5.** WebSocket について、L1 で必須の要件と、ハンドシェイク時に L2 で求められる確認をそれぞれ答えよ。

<details><summary>答えと解説</summary>

- **L1**: V4.4.1 — すべての WebSocket 接続に WSS（WebSocket over TLS）を使うこと。
- **L2**: V4.4.2 — 最初の HTTP ハンドシェイクで `Origin` ヘッダを許可オリジンのリストと照合すること。これによりクロスサイト WebSocket ハイジャッキングを防ぎます。

</details>

## 7. 関連リソース

- OWASP Cheat Sheet: [REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- OWASP Cheat Sheet: [GraphQL Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html)
- OWASP Cheat Sheet: [HTTP Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Denial of Service Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [OWASP Web Security Testing Guide: GraphQL Testing](https://owasp.org/www-project-web-security-testing-guide/stable/4-Web_Application_Security_Testing/12-API_Testing/01-Testing_GraphQL)
- [OWASP Web Security Testing Guide: Testing WebSockets](https://owasp.org/www-project-web-security-testing-guide/stable/4-Web_Application_Security_Testing/11-Client-side_Testing/10-Testing_WebSockets)
- [GraphQL 公式: Authorization](https://graphql.org/learn/authorization/)
- 関連する章: [V2 検証とビジネスロジック](V02-validation-and-business-logic.md)（入力検証・自動化対策）、[V3 Web フロントエンドセキュリティ](V03-web-frontend-security.md)（CORS・CSRF）、[V6 認証](V06-authentication.md)、[V7 セッション管理](V07-session-management.md)、[V12 安全な通信](V12-secure-communication.md)
