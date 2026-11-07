# V3 Web フロントエンドセキュリティ — L1 要件を開発の観点で読む

> 対象: L1 要件 8 件 ／ 章の解説: [../chapters/V03-web-frontend-security.md](../chapters/V03-web-frontend-security.md)

## この章の要件を一言でいうと

「ブラウザが受け取るレスポンス（ヘッダ・Cookie・ファイル）と、ブラウザから届くリクエストの扱いを書くとき」の話です。
ブラウザには Same Origin Policy、Cookie 属性、HSTS、CORS などの防御機能がありますが、**サーバーが正しいヘッダや属性を返さないと有効にならない** ものが大半です。
L1 の 8 件は大きく 3 グループに分かれます。①レスポンスが意図しない形で描画されない（V3.2）、②Cookie とヘッダでブラウザの防御機能を有効にする（V3.3, V3.4）、③他サイトから偽造されたリクエストで重要な操作が実行されない（V3.5、いわゆる CSRF）。
原文のとおり、この章はブラウザで使われるアプリが対象で、マシン間通信だけのシステムには適用されません。ヘッダのハンズオンは [lab07](../../labs/lab07_security_headers/)、Cookie 属性は [lab06](../../labs/lab06_session/) を参照してください。

## 要件ごとの読み解き

### V3.2.1 レスポンスが誤った文脈で描画されるのを防ぐ `L1`

> **原文**: Verify that security controls are in place to prevent browsers from rendering content or functionality in HTTP responses in an incorrect context (e.g., when an API, a user-uploaded file or other resource is requested directly). Possible controls could include: not serving the content unless HTTP request header fields (such as Sec-Fetch-\*) indicate it is the correct context, using the sandbox directive of the Content-Security-Policy header field or using the attachment disposition type in the Content-Disposition header field.

**ひとことで**: API のレスポンスやアップロードされたファイルを、ブラウザで直接開かれたときに「Web ページとして描画・実行」されないよう対策すること。

**開発の現場で言うと**: 典型例は次の 2 つです。
- **ユーザーアップロードファイルの配信**: プロフィール画像として HTML ファイルや、スクリプト入りの SVG をアップロードされ、`https://app.example.com/uploads/xxx.svg` を開くとアプリと同じオリジンでスクリプトが動く（保存型 XSS）
- **API のレスポンス**: `/api/search?q=<script>...` のようなレスポンスをブラウザのアドレスバーで直接開いたとき、内容が HTML として解釈される

原文が挙げる対策の候補は 3 つです（いずれか、または組み合わせ）。
1. `Sec-Fetch-Dest` / `Sec-Fetch-Mode` などのリクエストヘッダを見て、想定外の文脈（例: API に対するトップレベルのページ遷移 `Sec-Fetch-Dest: document`）なら返さない
2. `Content-Security-Policy: sandbox` を付けて、直接開かれても スクリプト実行などを制限する
3. `Content-Disposition: attachment` を付けて、表示ではなくダウンロードさせる

フレームワークがアップロードファイル配信にこれらを自動付与することは期待しにくく、**開発者が配信経路ごとに設定する部分** です。ストレージ（S3 など）から直接配信する場合はそちらのメタデータ設定も対象になります。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | ユーザーアップロードファイルの配信方式を決める（アプリと別ドメインから配信する、attachment で配信する、など）。API が「ブラウザで直接開かれる」ケースを想定するか決める |
| 実装 | アップロードファイルの配信レスポンスに `Content-Disposition: attachment` または `Content-Security-Policy: sandbox` を付ける。`Content-Type` はサーバー側で決め、アップロード時のクライアント申告値をそのまま使わない。API では `Sec-Fetch-Dest: document` のリクエストを拒否するなどを検討する（古いクライアントはこのヘッダを送らない点に注意） |
| レビュー | ファイル配信ハンドラ（`send_file`、`FileResponse`、`res.sendFile`、`ResponseEntity<Resource>`、署名付き URL の発行箇所）で、ヘッダ設定があるか。`Content-Type` にアップロード時の値（`file.content_type`、`mimetype`）を流用していないか |
| テスト | `<script>alert(document.domain)</script>` を含む `.html` や `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>` の `.svg` をアップロードし、その URL をブラウザで直接開いてスクリプトが実行されないこと。`curl -I` でレスポンスヘッダに `Content-Disposition: attachment` または CSP `sandbox` があること |

**誤解しやすいポイント**: 「拡張子を画像に限定しているから安全」は不十分です。SVG は画像でありながらスクリプトを含められますし、ブラウザは `Content-Type` を基に解釈するため、拡張子チェックだけでは描画のされ方を制御できません。また「API は JSON しか返さないから関係ない」も、エラー時に `text/html` で入力値を返す実装があると崩れます（V4.1.1 も参照）。

---

### V3.2.2 テキストは安全な描画関数で表示する `L1`

> **原文**: Verify that content intended to be displayed as text, rather than rendered as HTML, is handled using safe rendering functions (such as createTextNode or textContent) to prevent unintended execution of content such as HTML or JavaScript.

**ひとことで**: 文字として表示したいだけの値は、`textContent` や `createTextNode` など HTML として解釈しない方法で DOM に入れること。

**開発の現場で言うと**: フロントエンドの JavaScript で、API から取得したコメント・ユーザー名・通知メッセージ・エラーメッセージを画面に差し込むときの話です（DOM ベース XSS の対策）。
React の `{value}`、Vue の `{{ value }}`、Angular の補間 `{{ value }}`、jQuery の `.text()` はテキストとして扱われるので「デフォルトで守られる部分」です。一方、以下は HTML として解釈されるため、テキストを入れる用途で使うと崩れます。
- 素の DOM: `innerHTML`、`outerHTML`、`insertAdjacentHTML`、`document.write`
- jQuery: `.html()`、`.append(文字列)`、`$("<div>" + value + "</div>")`
- React / Vue: `dangerouslySetInnerHTML`、`v-html`
- 「改行を `<br>` に変換したい」ために `innerHTML` を使う実装（CSS の `white-space: pre-wrap` で代替できることが多い）

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | 「HTML として描画してよいデータ」と「テキストとして表示するデータ」をデータ項目ごとに区別する。前者はサニタイズ（V1.3.1）を経たものだけに限る |
| 実装 | テキストは `textContent` / `createTextNode` / フレームワークの補間で入れる。改行は `white-space: pre-wrap` で表現する。トースト・モーダル・ツールチップなどの共通 UI ライブラリが内部で `innerHTML` を使っていないか確認する |
| レビュー | `innerHTML`、`outerHTML`、`insertAdjacentHTML`、`document.write`、`.html(`、`dangerouslySetInnerHTML`、`v-html`、`[innerHTML]`、`bypassSecurityTrust` を grep し、入る値がテキストなら安全な関数に置き換える。ESLint のルール（`react/no-danger`、`vue/no-v-html` など）の導入も有効 |
| テスト | 表示箇所に `<img src=x onerror=alert(1)>` を含む値（ユーザー名やコメント）を登録し、画面にその文字列がそのまま表示され、スクリプトが実行されないこと。DevTools の Elements で `img` 要素が生成されていないこと |

**誤解しやすいポイント**: 「サーバー側でエスケープ済みの値だから `innerHTML` でよい」は危険です。API が JSON で返す値は通常エスケープされていません（されるべきでもありません）。また「React を使っているから DOM XSS は起きない」も、`dangerouslySetInnerHTML` や `ref.current.innerHTML =` を使った瞬間に崩れます。

```js
// NG
toast.innerHTML = `保存しました: ${file.name}`;
// OK
toast.textContent = `保存しました: ${file.name}`;
```

---

### V3.3.1 Cookie の Secure 属性とプレフィックス `L1`

> **原文**: Verify that cookies have the 'Secure' attribute set, and if the '\__Host-' prefix is not used for the cookie name, the '__Secure-' prefix must be used for the cookie name.

**ひとことで**: Cookie には `Secure` 属性を付け、Cookie 名は `__Host-` か `__Secure-` で始めること。

**開発の現場で言うと**: セッション Cookie、CSRF トークン Cookie、「ログイン状態を保持する」Cookie などを発行するときの話です。`Secure` がないと HTTP 通信時にも Cookie が送られ盗聴されえます。プレフィックスを付けると、ブラウザが「`Secure` 付きで HTTPS から設定された Cookie だけをその名前で受け入れる」ことを強制し（`__Host-` はさらに `Domain` 指定なし・`Path=/` を強制）、サブドメインなどからの Cookie 上書きを防ぎます。
フレームワークの既定の Cookie 名はプレフィックスなしのものが多く（例: Django の `sessionid` / `csrftoken`、express-session の `connect.sid`、Java サーブレットの `JSESSIONID`）、`Secure` も設定で有効にする必要があることが一般的です。つまり **名前と Secure の両方を開発者が明示的に設定しないと要件を満たさない** と考えたほうが安全です。設定項目の例: Django `SESSION_COOKIE_SECURE` / `SESSION_COOKIE_NAME`、express-session の `cookie.secure` / `name`、Spring Boot の `server.servlet.session.cookie.secure` / `name`、Rails のセッションストアの `key:` / `secure:`。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | アプリが発行する Cookie を一覧化し、名前・属性を決める。サブドメインと共有する必要がなければ `__Host-`、共有が必要なら `__Secure-`。開発環境も HTTPS で動かすか、ローカルの扱いを決める |
| 実装 | セッション・CSRF・独自 Cookie すべてに `Secure` を付け、名前を `__Host-xxx` / `__Secure-xxx` にする。`__Host-` の場合は `Domain` を指定せず `Path=/` にする（守らないとブラウザが Cookie を拒否する）。TLS 終端がロードバランサの場合、アプリが HTTPS と認識できるよう proxy 設定も確認する |
| レビュー | `set_cookie(`、`cookies[`、`res.cookie(`、`new Cookie(`、`ResponseCookie.from(`、`document.cookie =` の箇所と、フレームワークのセッション／CSRF Cookie 設定。`secure: false` や `secure: process.env.NODE_ENV === "production"` のような条件付き設定が本番で確実に true になるか |
| テスト | ログイン後に DevTools の Application → Cookies、または `curl -I` の `Set-Cookie` で、全 Cookie に `Secure` があり名前が `__Host-` / `__Secure-` で始まることを確認。例: `Set-Cookie: __Host-session=...; Path=/; Secure; HttpOnly; SameSite=Lax` |

**誤解しやすいポイント**: 「サイトは全部 HTTPS だから `Secure` は不要」は誤りです。攻撃者が利用者を `http://` の URL に誘導すれば、`Secure` のない Cookie は平文で送られます。また L1 の時点で **プレフィックスも必須** である点は見落とされがちです。`Secure` を付けただけでは要件の後半を満たしません。

---

### V3.4.1 HSTS ヘッダ（max-age 1 年以上） `L1`

> **原文**: Verify that a Strict-Transport-Security header field is included on all responses to enforce an HTTP Strict Transport Security (HSTS) policy. A maximum age of at least 1 year must be defined, and for L2 and up, the policy must apply to all subdomains as well.

**ひとことで**: すべてのレスポンスに `Strict-Transport-Security` ヘッダを付け、`max-age` を 1 年（31536000 秒）以上にすること（`includeSubDomains` は L2 から）。

**開発の現場で言うと**: HSTS は「このサイトには今後 HTTPS でしかアクセスしない」とブラウザに覚えさせる仕組みで、HTTP へのダウングレードや、`http://` リンク経由での盗聴を防ぎます。
設定場所は アプリ（Django の `SECURE_HSTS_SECONDS`、Rails の `config.force_ssl`、Express の helmet、Spring Security のヘッダ設定）、リバースプロキシ（nginx の `add_header`）、CDN / ロードバランサのいずれでも構いませんが、**「all responses」** が求められている点が重要です。
フレームワークによっては既定で HSTS を出すもの（Spring Security、helmet など）もあれば、明示的に秒数を設定しないと出ないもの（Django は既定値 0）もあります。既定の `max-age` もバージョンで変わりうるので、実際のレスポンスで確認してください。崩れやすいのは次の箇所です。
- 静的ファイル、エラーページ（404 / 500）、リダイレクトレスポンス、ヘルスチェック、API が別サーバーの場合
- nginx の `add_header` が `location` ブロックで上書きされて消える、エラー応答に付かない（`always` パラメータの有無）

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | HSTS をどの層で付与するか（アプリ / プロキシ / CDN）を 1 か所に決め、全レスポンスを網羅できることを確認する。サブドメインに HTTP のみのサービスがないか把握する（L2 の `includeSubDomains` に備える） |
| 実装 | `Strict-Transport-Security: max-age=31536000`（以上）を設定する。導入初期は短い値で試し、問題がないことを確認してから 1 年以上に上げる運用もありうる。HTTPS レスポンスに付ける（HTTP のレスポンスに付けてもブラウザは無視する） |
| レビュー | `SECURE_HSTS_SECONDS`、`force_ssl`、`hsts`、`Strict-Transport-Security`、`add_header` の設定値。`max-age` が 31536000 未満になっていないか。環境変数で本番だけ無効になっていないか |
| テスト | `curl -sI https://example.com/`、`/static/app.js`、`/not-found`、`/api/health`、エラーを起こす URL で、すべてに `Strict-Transport-Security: max-age=31536000` 以上が含まれることを確認する。ヘッダ確認を CI の E2E テストに組み込む |

**誤解しやすいポイント**: 「HTTP は HTTPS にリダイレクトしているから HSTS は不要」は誤りです。リダイレクトは最初の HTTP リクエストが平文で送られた後の対処で、その 1 回目を攻撃者に横取りされると防げません。HSTS があればブラウザは最初から HTTPS で接続します。また「トップページで確認できた」だけでは「all responses」の確認になりません。

---

### V3.4.2 CORS の Access-Control-Allow-Origin を固定値か許可リストに `L1`

> **原文**: Verify that the Cross-Origin Resource Sharing (CORS) Access-Control-Allow-Origin header field is a fixed value by the application, or if the Origin HTTP request header field value is used, it is validated against an allowlist of trusted origins. When 'Access-Control-Allow-Origin: *' needs to be used, verify that the response does not include any sensitive information.

**ひとことで**: CORS で許可するオリジンは固定値か許可リストで決め、リクエストの `Origin` をそのまま返さないこと。`*` を使うなら機密情報を返さないこと。

**開発の現場で言うと**: SPA（`app.example.com`）から API（`api.example.com`）を呼ぶ、パートナー企業のサイトから API を呼ばせる、といった構成で CORS 設定を書くときの話です。
「開発中に CORS エラーが出たので、とりあえず全部許可した」設定が本番に残るのが典型的な事故です。特に危険なのは **リクエストの `Origin` をそのまま `Access-Control-Allow-Origin` に反射し、かつ `Access-Control-Allow-Credentials: true` を返す** 組み合わせで、任意のサイトからログイン中ユーザーの Cookie 付きで API を読めてしまいます。
ライブラリの設定例: Express `cors` の `origin: true`（反射）、Spring の `allowedOriginPatterns("*")` + `allowCredentials(true)`、django-cors-headers の `CORS_ALLOW_ALL_ORIGINS = True`。ブラウザは `*` と credentials の組み合わせを拒否しますが、反射ならその制限をすり抜けてしまう点に注意が必要です。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | API を呼んでよいオリジンを列挙する（本番・ステージング・パートナー）。Cookie 認証の API で credentials を許可するかを決める。誰でも呼べる公開 API（`*`）と認証付き API を分ける |
| 実装 | オリジンは完全一致の許可リストで比較する（スキーム・ホスト・ポートまで）。正規表現を使うならアンカーとドットのエスケープを忘れない。`Origin` によってレスポンスを変える場合は `Vary: Origin` を付ける。`null` オリジンを許可しない |
| レビュー | `Access-Control-Allow-Origin`、`cors(`、`origin: true`、`origin: "*"`、`allowedOrigins`、`allowedOriginPatterns`、`@CrossOrigin`、`CORS_ALLOW_ALL_ORIGINS`、`CORS_ALLOWED_ORIGIN_REGEXES` を grep。`endsWith("example.com")` や `includes("example.com")` のような部分一致の判定がないか |
| テスト | `curl -sI -H 'Origin: https://evil.example' https://api.example.com/me` で、`Access-Control-Allow-Origin` に `https://evil.example` が返らないこと。`Origin: https://example.com.evil.example`、`Origin: https://evilexample.com`、`Origin: null` でも同様。`*` を返すエンドポイントのレスポンスに個人情報やトークンが含まれないこと |

**誤解しやすいポイント**: 「CORS を設定したからセキュリティ対策になっている」は逆で、CORS は Same Origin Policy の制限を **緩める** 仕組みです。設定が広いほど危険が増えます。また「`*` はブラウザが credentials と併用させないから安全」は、Cookie を使わない認証（URL 内トークン、社内ネットワーク内の IP 制限 API など）では成り立たず、原文も `*` の場合は機密情報を含まないことを求めています。

---

### V3.5.1 CSRF 対策（プリフライトに頼らない場合） `L1`

> **原文**: Verify that, if the application does not rely on the CORS preflight mechanism to prevent disallowed cross-origin requests to use sensitive functionality, these requests are validated to ensure they originate from the application itself. This may be done by using and validating anti-forgery tokens or requiring extra HTTP header fields that are not CORS-safelisted request-header fields. This is to defend against browser-based request forgery attacks, commonly known as cross-site request forgery (CSRF).

**ひとことで**: 重要な操作へのリクエストが本当に自分のアプリから来たものかを、CSRF トークンや独自ヘッダで確かめること（CORS プリフライトで防ぐ設計でない場合）。

**開発の現場で言うと**: Cookie でログイン状態を管理しているアプリで、フォーム送信や API 呼び出しによってパスワード変更・送金・投稿・削除・設定変更などを行う箇所です。原文のセクション説明によれば、「重要な機能」には **未認証のフォーム送信（ログインなど）、状態変更、データエクスポートのような重い処理** も含まれます。
フレームワークの状況:
- Django: `CsrfViewMiddleware` が既定で有効。`@csrf_exempt` を付けた箇所が抜け穴になる
- Rails: `ActionController::Base` では既定で有効。`skip_forgery_protection` / `protect_from_forgery except:`、および CSRF 保護を含まない `ActionController::API` ベースで Cookie 認証している場合に注意
- Spring Security: 既定で有効。`csrf().disable()` / `csrf(c -> c.disable())` が抜け穴
- Express: 既定の保護はないため、自分でミドルウェアや独自ヘッダチェックを入れる必要がある
- Next.js: Server Actions には Origin と Host を比較する仕組みがあると公式に説明されていますが、Route Handlers（`app/api/...`）には自分で対策が必要

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | 認証方式（Cookie か、`Authorization` ヘッダのトークンか）を確認し、Cookie 方式なら CSRF 対策の方式（同期トークン、ダブルサブミット、独自ヘッダ `X-Requested-With` など非セーフリストヘッダの必須化）を決める。重要な操作の一覧を作る |
| 実装 | フレームワークの CSRF 保護を有効のまま使い、フォームと AJAX 両方でトークンを送る。独自ヘッダ方式なら、サーバーは「ヘッダがなければ拒否」を全対象エンドポイントで行う。`SameSite=Lax/Strict` は追加の防御として併用する |
| レビュー | `csrf_exempt`、`skip_forgery_protection`、`protect_from_forgery`、`csrf().disable`、`csrf(AbstractHttpConfigurer::disable)`、`ignoringRequestMatchers`、Express で Cookie 認証なのに CSRF チェックがないルーター。除外したエンドポイントに正当な理由（Webhook で別の署名検証がある等）があるか |
| テスト | 別オリジンの HTML に `<form action="https://app.example.com/settings/email" method="POST"><input name="email" value="evil@example.com"></form><script>document.forms[0].submit()</script>` を置き、ログイン状態で開いて変更が成功しないこと。トークンなし・不正トークン・他ユーザーのトークンでのリクエストが 403 になること |

**誤解しやすいポイント**: 「`SameSite=Lax` が既定だから CSRF 対策は不要」は不十分です。ブラウザの対応差、同一サイト（サブドメイン）からの攻撃、GET で状態変更する実装（V3.5.3）では防げません。また「JSON API だから CSRF は起きない」も、サーバーが `text/plain` やフォーム形式の本文を受け付けると成り立ちません（V3.5.2）。

---

### V3.5.2 CORS プリフライトに頼るなら、プリフライトなしで呼べないこと `L1`

> **原文**: Verify that, if the application relies on the CORS preflight mechanism to prevent disallowed cross-origin use of sensitive functionality, it is not possible to call the functionality with a request which does not trigger a CORS-preflight request. This may require checking the values of the 'Origin' and 'Content-Type' request header fields or using an extra header field that is not a CORS-safelisted header-field.

**ひとことで**: 「JSON API なのでクロスオリジンからはプリフライトが飛び、許可しなければ呼べない」という設計に頼るなら、プリフライトが起きない形式（シンプルリクエスト）では呼べないようにすること。

**開発の現場で言うと**: SPA + JSON API で CSRF トークンを使わず、「`Content-Type: application/json` のリクエストは別オリジンからだとプリフライトが必要になるから安全」と考えている構成です。
ブラウザがプリフライトを **送らない** のは、メソッドが GET / HEAD / POST で、`Content-Type` が `application/x-www-form-urlencoded`、`multipart/form-data`、`text/plain` のいずれかで、独自ヘッダがない場合などです。つまり、次のような実装だと前提が崩れます。
- `Content-Type: text/plain` で送られた本文も JSON としてパースしてしまう（Express で `express.json({ type: "*/*" })` のように全タイプをパースする設定など）
- フォーム形式（`application/x-www-form-urlencoded`）でも同じ処理を受け付ける（多くのフレームワークは複数形式を受け付けられる）
- 重要な操作を GET でも受け付ける

フレームワークは「JSON 以外は受け付けない」を既定で強制するとは限らないため、**開発者が `Content-Type` を明示的に制限する必要がある部分** です。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | CSRF 対策を「トークン（V3.5.1）」と「プリフライト依存（本要件）」のどちらで行うか明確にする。プリフライト依存なら「重要な API は `application/json` のみ受け付ける」「独自ヘッダを必須にする」をルール化する |
| 実装 | 重要なエンドポイントで `Content-Type` が `application/json` でなければ 415 を返す（Spring なら `consumes = MediaType.APPLICATION_JSON_VALUE`）。または `X-Requested-With` などの非セーフリストヘッダを必須にする。`Origin` ヘッダがある場合は許可リストと照合する |
| レビュー | ボディパーサの設定（`express.json({ type`、`bodyParser.text`、`express.urlencoded`）、`@RequestMapping` の `consumes` 指定の有無、`request.data` が複数形式を受け付ける設定（DRF の `parser_classes`）を確認 |
| テスト | 別オリジンから `fetch("https://api.example.com/transfer", {method:"POST", credentials:"include", headers:{"Content-Type":"text/plain"}, body:'{"to":"evil","amount":100}'})` を実行し、処理が実行されない（415 / 403）こと。同じ内容を `<form enctype="text/plain">` や `application/x-www-form-urlencoded` で送っても拒否されること |

**誤解しやすいポイント**: 「CORS で許可していないオリジンからはレスポンスが読めないから安全」は誤りです。シンプルリクエストは **送信自体はされ、サーバー側で処理も実行される** ため、読めないのはレスポンスだけです。状態変更が目的の攻撃では、レスポンスが読めなくても被害は発生します。

---

### V3.5.3 重要な操作に GET などの「安全な」メソッドを使わない `L1`

> **原文**: Verify that HTTP requests to sensitive functionality use appropriate HTTP methods such as POST, PUT, PATCH, or DELETE, and not methods defined by the HTTP specification as "safe" such as HEAD, OPTIONS, or GET. Alternatively, strict validation of the Sec-Fetch-* request header fields can be used to ensure that the request did not originate from an inappropriate cross-origin call, a navigation request, or a resource load (such as an image source) where this is not expected.

**ひとことで**: 状態を変えるなどの重要な操作は POST / PUT / PATCH / DELETE で受け付け、GET / HEAD / OPTIONS では実行しないこと（代替として `Sec-Fetch-*` ヘッダの厳格な検証も可）。

**開発の現場で言うと**: `GET /logout`、`GET /items/123/delete`、`GET /users/5/promote`、メール内リンクの `GET /subscription/cancel?id=...`、`GET /export.csv`（重いエクスポート）のような実装です。GET で状態変更できると、攻撃者は `<img src="https://app.example.com/items/123/delete">` を埋め込むだけでリクエストを送らせることができ、`SameSite=Lax` のトップレベル遷移では Cookie も送られます。
フレームワークの既定の挙動として注意すべき点:
- Django の関数ビューは、`@require_POST` などを付けないと任意のメソッドを受け付ける
- Spring の `@RequestMapping` は `method` を指定しないと全メソッドを受け付ける
- Express の `app.all()`、Rails の `match ... via: :all`
- 多くのフレームワークは HEAD リクエストを GET ハンドラで処理するため、GET で状態変更していると HEAD でも実行されうる

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | API 設計時に「この操作は状態を変えるか」を判定し、メソッドを割り当てる。メール内リンクのワンクリック操作は、GET では確認画面を表示するだけにし、実行は POST で行う設計にする |
| 実装 | ルーティングでメソッドを明示する（`@PostMapping`、`@require_POST`、`router.post`、Rails の `delete`/`post` ルート）。GET を残す必要がある場合は、`Sec-Fetch-Site`・`Sec-Fetch-Mode`・`Sec-Fetch-Dest` を厳格に検証し、クロスサイトや画像読み込みなど想定外の文脈からのリクエストを拒否する |
| レビュー | `@RequestMapping(` で `method` 指定のないもの、`@GetMapping` で更新系サービスを呼んでいるもの、Django ビューで `request.method` のチェックがないもの、`app.all(`、`app.get(` 内の `save` / `update` / `delete` / `destroy` 呼び出し、`via: :all` を grep |
| テスト | 重要な操作を GET と HEAD で呼び出し（`curl -X GET`、`curl -I`）、405 で拒否されて状態が変わらないこと。`<img src="https://app.example.com/logout">` を別オリジンのページに置き、ログイン状態で開いても操作が実行されないこと |

**誤解しやすいポイント**: 「画面からは POST フォームでしか呼ばない」は、サーバー側が GET でも受け付けているなら意味がありません。ルーティング定義で **受け付けるメソッド自体を制限** しているかが要点です。また「GET でも CSRF トークンをクエリに付けている」設計は、URL がログやリファラ経由で漏れやすいため推奨されません。

---

## この章のまとめ: PR レビューで聞く質問

- ユーザーがアップロードしたファイルや API のレスポンスを直接ブラウザで開いたとき、HTML / SVG として実行されない設定（`attachment` / CSP `sandbox` / `Sec-Fetch-*` 検証）になっていますか？
- テキストを表示するのに `innerHTML` や `dangerouslySetInnerHTML` を使っていませんか？
- 新しく発行する Cookie に `Secure` 属性と `__Host-` / `__Secure-` プレフィックスが付いていますか？
- HSTS（`max-age` 1 年以上）は、エラーページや静的ファイルを含むすべてのレスポンスに付いていますか？
- CORS で `Origin` を反射していませんか？ 許可オリジンは完全一致の許可リストですか？
- 状態を変える操作は POST 等で受け付け、CSRF トークンまたはプリフライト依存（`Content-Type` / 独自ヘッダの強制）のどちらで守るか明確になっていますか？
