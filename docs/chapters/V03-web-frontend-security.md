# V3 Web フロントエンドセキュリティ（Web Frontend Security）

> 📘 原文: [0x12-V3-Web-Frontend-Security.md](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x12-V3-Web-Frontend-Security.md)
> 📊 要件数: **31**（L1: 8 / L2: 11 / L3: 12）
> ✅ 全要件のチェックリスト: [checklists/by-chapter/V3.md](../../checklists/by-chapter/V3.md)

## 1. この章の目的

この章は、Web フロントエンド（ブラウザ）を経由して行われる攻撃から守るための要件をまとめています。対象は「ブラウザでアクセスされる Web アプリ」であり、原文が明記しているとおり、マシン間（machine-to-machine）の通信だけで完結するシステムには適用されません。

具体的には、Cookie の安全な設定、HSTS・CSP・CORS などのセキュリティヘッダ、CSRF などのクロスオリジン攻撃への対策、外部リソースの完全性、リダイレクトの扱いなど、「ブラウザが持つセキュリティ機能を正しく有効化し、ブラウザ経由の悪用を防ぐ」ことが主題です。

## 2. セクション構成

| セクション | 日本語名 | 何を扱うか（1行） | 要件数 |
| --- | --- | --- | :---: |
| V3.1 | Web フロントエンドセキュリティの文書化 | ブラウザに求めるセキュリティ機能と、非対応時の振る舞いの文書化 | 1 |
| V3.2 | 意図しないコンテンツ解釈 | API 応答やアップロードファイルが HTML として描画されること、DOM clobbering の防止 | 3 |
| V3.3 | Cookie の設定 | `Secure`、`__Host-` / `__Secure-` プレフィックス、`SameSite`、`HttpOnly`、サイズ | 5 |
| V3.4 | ブラウザのセキュリティ機構ヘッダ | HSTS、CORS、CSP、nosniff、Referrer-Policy、frame-ancestors、COOP | 8 |
| V3.5 | ブラウザのオリジン分離 | CSRF 対策、HTTP メソッド、postMessage、JSONP / XSSI、CORP | 8 |
| V3.6 | 外部リソースの完全性 | CDN 上の資産に対する Subresource Integrity（SRI） | 1 |
| V3.7 | その他のブラウザセキュリティ考慮事項 | 廃止技術の不使用、外部リダイレクト、HSTS preload | 5 |

L3 の要件が 12 個と多いのがこの章の特徴です。まずは L1 の 8 要件（V3.2.1, V3.2.2, V3.3.1, V3.4.1, V3.4.2, V3.5.1, V3.5.2, V3.5.3）を確実に押さえましょう。

## 3. 押さえるべき重要要件

### V3.3.1 / V3.3.4 — Cookie の Secure・プレフィックス・HttpOnly（L1 / L2）

- **要件（意訳）**:
  - V3.3.1（L1）: Cookie に `Secure` 属性が設定されていること。また Cookie 名に `__Host-` プレフィックスを使わない場合は `__Secure-` プレフィックスを使うこと。
  - V3.3.4（L2）: Cookie の値がクライアント側スクリプトからアクセスされる必要がない場合（セッショントークンなど）、`HttpOnly` 属性を設定し、その値（セッショントークンなど）は `Set-Cookie` ヘッダフィールドでのみクライアントに渡すこと。
- **なぜ重要か**: `Secure` がないと HTTP 通信でも Cookie が送られて盗聴され得ます。`HttpOnly` がないと XSS が 1 か所あるだけでセッショントークンを盗まれます。プレフィックスは、ブラウザに「`Secure` 付きで設定された Cookie か」（`__Host-` ならさらに「`Domain` 属性なし・`Path=/`」）を強制させ、サブドメインなどからの Cookie の上書き・注入を防ぎます。
- **実装のポイント**: 他のホストと共有する必要がなければ `__Host-` プレフィックス（V3.3.3, L2）を使います。

```python
# ❌ NG 例
resp.set_cookie("session", token)

# ✅ OK 例（Flask）: __Host- は Secure 必須・Domain 指定不可・Path=/ 必須
resp.set_cookie(
    "__Host-session", token,
    secure=True, httponly=True, samesite="Lax", path="/",
)
```

```http
Set-Cookie: __Host-session=abc123; Path=/; Secure; HttpOnly; SameSite=Lax
```

### V3.2.2 — テキストは安全な描画関数で表示（L1）

- **要件（意訳）**: HTML として描画するのではなくテキストとして表示すべきコンテンツは、`createTextNode` や `textContent` などの安全な描画関数で扱い、HTML や JavaScript などの意図しない実行を防ぐこと。
- **なぜ重要か**: `innerHTML` にユーザー入力を入れると、`<img src=x onerror=alert(1)>` で DOM ベース XSS が起こります。
- **実装のポイント**: テキストは `textContent` を使います。React などは `{value}` で自動的にテキスト扱いになりますが、`dangerouslySetInnerHTML` は例外です。

```javascript
// ❌ NG 例
el.innerHTML = comment;

// ✅ OK 例
el.textContent = comment;
```

### V3.2.1 — 誤った文脈での描画を防ぐ（L1）

- **要件（意訳）**: API の応答やユーザーがアップロードしたファイルなどのリソースが直接リクエストされたときに、ブラウザが HTTP レスポンスの内容や機能を誤った文脈で描画しないよう、セキュリティ制御を設けること。例えば、HTTP リクエストヘッダ（`Sec-Fetch-*` など）が正しい文脈を示さない限り配信しない、`Content-Security-Policy` の `sandbox` ディレクティブを使う、`Content-Disposition` ヘッダで `attachment` を使う、などが考えられる。
- **なぜ重要か**: ユーザーがアップロードした HTML や SVG を同一オリジンでブラウザに直接開かせると、そのオリジンの権限でスクリプトが動き、XSS と同じ被害が出ます。
- **実装のポイント**: ダウンロード用ファイルは `attachment` で返し、CSP `sandbox` を付けます。あわせて V3.4.4 の `X-Content-Type-Options: nosniff` も設定します。

```python
# ✅ OK 例: アップロードファイルの配信
resp = send_file(path, mimetype=stored_mimetype, as_attachment=True)
resp.headers["Content-Security-Policy"] = "sandbox"
resp.headers["X-Content-Type-Options"] = "nosniff"
```

### V3.4.1 — HSTS（L1）

- **要件（意訳）**: すべてのレスポンスに `Strict-Transport-Security` ヘッダフィールドを含め、HSTS ポリシーを強制すること。max-age は少なくとも 1 年とし、L2 以上ではサブドメインにも適用すること。
- **なぜ重要か**: 利用者が最初に `http://` でアクセスした瞬間を狙われ、HTTPS へのリダイレクト前に中間者攻撃（SSL ストリッピング）されるのを防ぎます。
- **実装のポイント**: 1 年 = 31536000 秒。L2 以上では `includeSubDomains` を付けます。

```http
# ❌ NG 例: 期間が短い / サブドメインが対象外（L2 以上の場合）
Strict-Transport-Security: max-age=3600

# ✅ OK 例
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### V3.4.2 — CORS の Access-Control-Allow-Origin（L1）

- **要件（意訳）**: CORS の `Access-Control-Allow-Origin` ヘッダフィールドはアプリが固定値として設定するか、`Origin` リクエストヘッダの値を使う場合は信頼できるオリジンの許可リストで検証すること。`Access-Control-Allow-Origin: *` を使う必要がある場合は、レスポンスに機密情報が含まれていないことを確認すること。
- **なぜ重要か**: `Origin` をそのまま反射すると、攻撃者のサイトからログイン中のユーザーのデータを読み取られます。
- **実装のポイント**: 許可リストと完全一致で比較します（前方一致・部分一致は `example.com.evil.net` などで突破されます）。

```python
ALLOWED_ORIGINS = {"https://app.example.com"}

# ❌ NG 例: Origin をそのまま反射
resp.headers["Access-Control-Allow-Origin"] = request.headers.get("Origin")

# ✅ OK 例: 許可リストと完全一致
origin = request.headers.get("Origin")
if origin in ALLOWED_ORIGINS:
    resp.headers["Access-Control-Allow-Origin"] = origin
    resp.headers["Vary"] = "Origin"
```

### V3.5.1 / V3.5.3 — CSRF 対策と HTTP メソッド（L1）

- **要件（意訳）**:
  - V3.5.1: 許可されていないクロスオリジンからの機密機能の利用を防ぐのに CORS プリフライトの仕組みに頼らない場合、そのリクエストがアプリ自身から発行されたものであることを検証すること。偽造防止トークン（anti-forgery token）を使って検証する、CORS セーフリストに含まれない追加の HTTP ヘッダを要求する、などの方法がある。これは CSRF への防御である。
  - V3.5.3: 機密機能への HTTP リクエストは POST・PUT・PATCH・DELETE などの適切なメソッドを使い、HTTP 仕様で「安全」とされる HEAD・OPTIONS・GET などを使わないこと。代わりに、`Sec-Fetch-*` リクエストヘッダを厳格に検証して、不適切なクロスオリジン呼び出し、ナビゲーション、想定外のリソース読み込み（画像の src など）からのリクエストでないことを確認する方法もある。
- **なぜ重要か**: `GET /account/delete` のような設計だと、`<img src="https://app.example.com/account/delete">` を含むページを見せるだけで処理が実行されます。
- **実装のポイント**: 状態を変える操作は POST 以上のメソッドにし、フレームワークの CSRF 保護（Django の CSRF ミドルウェア、Flask-WTF の `CSRFProtect` など）を有効にします。

```python
# ❌ NG 例: GET で状態変更、CSRF 保護なし
@app.get("/account/delete")
def delete_account(): ...

# ✅ OK 例: POST + CSRF トークン（Flask-WTF）
from flask_wtf.csrf import CSRFProtect
CSRFProtect(app)

@app.post("/account/delete")
def delete_account(): ...
```

### V3.4.3 / V3.4.6 — CSP と frame-ancestors（L2）

- **要件（意訳）**:
  - V3.4.3: HTTP レスポンスに `Content-Security-Policy` ヘッダを含め、ブラウザが信頼できるコンテンツやリソースだけを読み込み・実行するようにし、悪意ある JavaScript の実行を制限すること。最低でも、`object-src 'none'` と `base-uri 'none'` を含み、許可リストまたは nonce / ハッシュを定義するグローバルポリシーを使うこと。L3 のアプリでは、nonce またはハッシュを使ったレスポンスごとのポリシーを定義すること。
  - V3.4.6: すべての HTTP レスポンスで CSP の `frame-ancestors` ディレクティブを使い、デフォルトでは埋め込み不可とし、必要な特定のリソースだけ埋め込みを許可すること。`X-Frame-Options` はブラウザでサポートされているものの廃止扱いであり、頼るべきではない。
- **なぜ重要か**: CSP は XSS が残っていた場合の被害を抑える多層防御です。`frame-ancestors` はクリックジャッキング（UI redress）を防ぎます。
- **実装のポイント**: リクエストごとにランダムな nonce を生成してテンプレートの `<script nonce="...">` に埋め込みます。

```python
import secrets

@app.after_request
def set_csp(resp):
    nonce = g.csp_nonce  # before_request で secrets.token_urlsafe(16) を生成しておく
    resp.headers["Content-Security-Policy"] = (
        f"script-src 'nonce-{nonce}' 'strict-dynamic'; "
        "object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
    )
    return resp
```

### V3.7.2 — 外部ドメインへの自動リダイレクトは許可リストで（L2）

- **要件（意訳）**: アプリが制御していない別のホスト名やドメインへユーザーを自動的にリダイレクトするのは、リダイレクト先が許可リストに載っている場合だけにすること。
- **なぜ重要か**: `/login?next=https://evil.example/` のようなオープンリダイレクトは、正規ドメインの URL を使ったフィッシングに悪用されます。
- **実装のポイント**: 遷移先はアプリ内の相対パスに限定するか、ホストを許可リストで判定します。L3 では外部への遷移時に通知とキャンセルの選択肢を表示します（V3.7.3）。

```python
from urllib.parse import urlparse

# ❌ NG 例
return redirect(request.args["next"])

# ✅ OK 例: 相対パス（同一サイト内）または許可済みホストのみ
ALLOWED_REDIRECT_HOSTS = {"docs.example.com"}
nxt = request.args.get("next", "/")
u = urlparse(nxt)
if (u.scheme or u.netloc) and u.hostname not in ALLOWED_REDIRECT_HOSTS:
    nxt = "/"
if nxt.startswith("//") or "\\" in nxt:   # スキーム相対 URL 等の抜け道を塞ぐ
    nxt = "/"
return redirect(nxt)
```

## 4. よくある脆弱性・アンチパターン

- **`Origin` ヘッダの反射 + `Access-Control-Allow-Credentials: true`**。どのサイトからでも認証付きでデータを読めてしまう（V3.4.2）。
- **Origin の検証を `endswith("example.com")` や部分一致で行う**（`evil-example.com` で突破）。
- **状態変更を GET で受け付ける**（V3.5.3）。
- **`Content-Type: application/json` の API なら CSRF は起きない、と思い込む**。サーバーが `text/plain` やフォーム形式でも同じ処理を受け付けると、プリフライトなしのリクエストで呼び出せてしまいます（V3.5.2 は `Origin` や `Content-Type` の確認を求めています）。
- **セッション Cookie に `HttpOnly` / `Secure` がない**、またはセッショントークンをレスポンスボディでも返して JS から扱っている（V3.3.1, V3.3.4）。
- **`innerHTML` / `document.write` / jQuery の `.html()` にユーザー入力**（V3.2.2）。
- **ユーザーのアップロードファイルを `inline` で同一オリジンから配信**（V3.2.1）。
- **`X-Content-Type-Options: nosniff` の未設定**による MIME スニッフィング（V3.4.4）。
- **CSP に `'unsafe-inline'` や広すぎる `https:` を許可**して実質的に無効化している（V3.4.3）。
- **`X-Frame-Options` だけでクリックジャッキング対策をしている**（V3.4.6 は `frame-ancestors` を要求）。
- **`window.addEventListener("message", ...)` で `event.origin` を確認しない**（V3.5.5）。
- **JSONP エンドポイントが残っている**（V3.5.6, L3）。
- **CDN の JS を SRI なしで読み込む**（V3.6.1, L3）。
- **`id` 属性や `name` 属性で `window.xxx` / `document.xxx` が上書きされる DOM clobbering**（V3.2.3, L3）。

## 5. 検証（テスト）のヒント

- **レスポンスヘッダの確認**: ブラウザの開発者ツール、`curl -I https://...`、または OWASP ZAP のパッシブスキャンで、HSTS・CSP・`X-Content-Type-Options`・`Referrer-Policy`・`Cross-Origin-Opener-Policy` が **すべてのレスポンス**（エラーページや静的ファイルを含む）に付いているかを確認します。
- **CSP の評価**: Google の CSP Evaluator などのツールで、`object-src 'none'` と `base-uri 'none'` の有無、`'unsafe-inline'` の混入を確認します。
- **Cookie の確認**: 開発者ツールの Application タブで、各 Cookie の `Secure` / `HttpOnly` / `SameSite` / プレフィックス / サイズを一覧で確認します。
- **CORS**: `Origin: https://evil.example` を付けたリクエストを送り、`Access-Control-Allow-Origin` に反射されないか、`null` オリジンを許可していないかを試します。
- **CSRF**: 別オリジンの HTML から自動送信フォームや `fetch(..., {mode: "no-cors"})` を発行し、状態変更が成功しないか確認します。`Content-Type` を `text/plain` に変えても処理されないかも確認します。
- **オープンリダイレクト**: `next=` / `redirect=` / `return_url=` 系のパラメータに `https://evil.example`、`//evil.example`、`/\evil.example` などを入れて試します。
- **アップロードファイル**: HTML・SVG をアップロードしてそのファイル URL を直接開き、スクリプトが実行されないか確認します。
- **コードレビュー**: `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `dangerouslySetInnerHTML`, `v-html`, `postMessage`, `addEventListener("message"` を grep します。

## 6. 確認問題

**Q1.** 次の Cookie 設定のうち、V3.3.1（L1）を満たすものをすべて選べ。
(a) `Set-Cookie: sid=x; Secure; HttpOnly`
(b) `Set-Cookie: __Secure-sid=x; Secure; HttpOnly`
(c) `Set-Cookie: __Host-sid=x; Path=/; Secure; HttpOnly`
(d) `Set-Cookie: __Host-sid=x; Path=/; HttpOnly`

<details><summary>答えと解説</summary>

**(b) と (c)**。V3.3.1 は `Secure` 属性に加え、`__Host-` プレフィックスを使わない場合は `__Secure-` プレフィックスを使うことを求めます。(a) はプレフィックスがなく、(d) は `Secure` がありません（ブラウザも `Secure` なしの `__Host-` Cookie を受け付けません）。なお L2 の V3.3.3 では、他ホストと共有する設計でない限り `__Host-` が求められるので、(c) が最も望ましい形です。

</details>

**Q2.** HSTS ヘッダ `Strict-Transport-Security: max-age=31536000` は L1 と L2 それぞれで V3.4.1 を満たすか。

<details><summary>答えと解説</summary>

L1 では満たします（max-age が 1 年以上）。L2 以上ではポリシーがすべてのサブドメインにも適用される必要があるため、`includeSubDomains` がないと満たしません。

</details>

**Q3.** V3.4.3 で、CSP のグローバルポリシーに最低限含めるべきディレクティブを 2 つ答えよ。また L3 で追加で求められることは何か。

<details><summary>答えと解説</summary>

`object-src 'none'` と `base-uri 'none'` です。あわせて許可リストか nonce / ハッシュを定義します。L3 のアプリでは、nonce またはハッシュを使った **レスポンスごとの** ポリシーを定義する必要があります。

</details>

**Q4.** クリックジャッキング対策として `X-Frame-Options: DENY` だけを設定している。ASVS 5.0 の観点で問題はあるか。

<details><summary>答えと解説</summary>

あります。V3.4.6（L2）はすべての HTTP レスポンスで CSP の `frame-ancestors` ディレクティブを使うことを求め、`X-Frame-Options` はブラウザでサポートされているものの廃止扱いであり頼るべきではないと明記しています。`Content-Security-Policy: frame-ancestors 'none'`（必要なリソースのみ許可）を設定します。

</details>

**Q5.** `postMessage` でメッセージを受け取る処理について、V3.5.5 が求めていることは何か。

<details><summary>答えと解説</summary>

V3.5.5（L2）は、メッセージの送信元オリジンが信頼できない場合、またはメッセージの構文が不正な場合、そのメッセージを破棄することを求めています。実装では `event.origin` を許可リストと完全一致で比較し、`event.data` の形式も検証してから処理します。

</details>

## 7. 関連リソース

- OWASP Cheat Sheet: [Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Cross-Site Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- OWASP Cheat Sheet: [HTTP Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)
- OWASP Cheat Sheet: [HTTP Strict Transport Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Clickjacking Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html)
- OWASP Cheat Sheet: [DOM Clobbering Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/DOM_Clobbering_Prevention_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Unvalidated Redirects and Forwards Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Third Party JavaScript Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Javascript_Management_Cheat_Sheet.html)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN: Set-Cookie（Cookie プレフィックス）](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#cookie_prefixes)
- [HSTS Preload List 登録フォーム](https://hstspreload.org/)
- 関連する章: [V1 エンコーディングとサニタイズ](V01-encoding-and-sanitization.md)（XSS の根本対策）、[V4 API と Web サービス](V04-api-and-web-service.md)、[V7 セッション管理](V07-session-management.md)、[V12 安全な通信](V12-secure-communication.md)
