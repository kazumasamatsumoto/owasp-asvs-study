# V9 自己完結型トークン — L1 要件を開発の観点で読む

> 対象: L1 要件 4 件 ／ 章の解説: [../chapters/V09-self-contained-tokens.md](../chapters/V09-self-contained-tokens.md) ／ ハンズオン: [../../labs/lab08_jwt_verification/](../../labs/lab08_jwt_verification/)

## この章の要件を一言でいうと

JWT や SAML アサーションのように「トークンの中身そのものを信じて認可判断をする」コードを書くときの話です。
具体的には、API の認証ミドルウェア、`Authorization: Bearer ...` を読む処理、IdP から受け取った ID トークンの処理、サービス間連携で受け取る署名付きトークンの処理が該当します。
L1 の 4 件はすべて「中身を使う前に、本物か・いつのものかを確かめる」という受け入れ側（検証側）の責務です。
トークンを発行する側のロジックよりも、**受け取って検証する側の 1 か所（共通ミドルウェア）**を正しく作り、全エンドポイントがそこを通ることが要点です。

## 要件ごとの読み解き

### V9.1.1 署名/MAC を検証してから中身を使う `L1`

> **原文**: Verify that self-contained tokens are validated using their digital signature or MAC to protect against tampering before accepting the token's contents.

**ひとことで**: トークンのクレームを読んで判断する前に、必ず署名（または MAC）を検証する。

**開発の現場で言うと**: API サーバーで「JWT の `sub` からユーザーを特定し、`role` で管理者 API を許可する」処理を書くときです。JWT のペイロードは Base64URL でエンコードされているだけなので、誰でもデコードも書き換えもできます。
主要な JWT ライブラリ（PyJWT、jsonwebtoken、jose、Spring Security の Resource Server 機能など）は「検証してからクレームを返す」API を持っており、それを使えば署名検証は行われます。崩れやすいのは、開発者が「デコードだけする」関数（例: Node の `jwt.decode()`、フロントエンド向けの `jwt-decode`）をサーバー側で使ってしまう場合や、ログ出力・ルーティング判定などで「とりあえず中身を見る」コードが検証より先に走る場合です。
また、API ゲートウェイで検証しているから後段のサービスでは検証しない、という構成は「ゲートウェイを迂回できない」ことが前提になります。その前提を設計として明示しておく必要があります。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | どのコンポーネントがトークン検証の責任を持つか（ゲートウェイ / 各サービス / 共通ミドルウェア）を決め、検証前のトークンを扱う経路が無いことを構成図で確認する。 |
| 実装 | 検証付き API（`jwt.verify` / `jwt.decode(token, key, algorithms=[...])` など）の戻り値だけを後続処理に渡す。生トークンを再デコードする補助関数を作らない。 |
| レビュー | `jwt.decode(` （Node）、`jwt-decode`、`verify_signature": False`、`verify=False`、`parseClaimsJwt`／`parseUnsecuredClaims`（jjwt で未署名を扱う系）、`atob(token.split('.')[1])`、`base64` で JWT の 2 番目のセグメントを直接読むコードを grep する。 |
| テスト | 正規トークンのペイロードの `role` を `admin` に書き換え、署名部はそのままで送る → 401 になること。署名部を削った `header.payload.` も 401 になること。 |

**誤解しやすいポイント**: 「HTTPS で送られてきたトークンだから改ざんされていない」は誤りです。TLS が守るのは通信路だけで、トークンを作って送ってくるのはクライアント自身（攻撃者自身）です。また「`exp` を見ているから検証している」も誤りで、署名を確認しなければ `exp` も書き換えられます。

```js
// ❌ decode は署名を検証しない
const claims = jwt.decode(token);
// ✅ verify の戻り値だけを信じる
const claims = jwt.verify(token, publicKey, { algorithms: ["ES256"] });
```

---

### V9.1.2 アルゴリズムを allowlist で固定する `L1`

> **原文**: Verify that only algorithms on an allowlist can be used to create and verify self-contained tokens, for a given context. The allowlist must include the permitted algorithms, ideally only either symmetric or asymmetric algorithms, and must not include the 'None' algorithm. If both symmetric and asymmetric must be supported, additional controls will be needed to prevent key confusion.

**ひとことで**: 使ってよい署名アルゴリズムをサーバー側で決めて固定し、`none` は絶対に許さない。

**開発の現場で言うと**: 検証処理で「トークンのヘッダ `alg` に書いてあるアルゴリズムで検証する」実装にしてしまうと、攻撃者が `alg` を選べてしまいます。典型例は `alg: none`（署名なし）と、RS256 の公開鍵を HS256 の共有鍵として使わせる「鍵混同（key confusion）」攻撃です。
多くのライブラリは検証時にアルゴリズムの指定を求めるか、指定を強く推奨しています（たとえば PyJWT 2.x の `decode` では `algorithms` を渡す設計）。ただしライブラリやバージョンによって既定の挙動は異なるため、「ライブラリが守ってくれるはず」に頼らず、**呼び出し側で毎回明示する**のが確実です。
要件は「for a given context」と書いており、用途ごと（ユーザー向けアクセストークン、サービス間トークン、メール確認リンク用トークンなど）に allowlist を持つことを想定しています。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | トークン種別ごとに許可アルゴリズムを決めて設計書に書く（例: IdP 発行のアクセストークンは RS256/ES256 のみ、社内の短期トークンは HS256 のみ）。対称・非対称を混在させるなら、鍵ごとにアルゴリズムを紐付ける方式（`kid` → 鍵 → 許可 alg）を決める。 |
| 実装 | 検証関数に `algorithms=["ES256"]` のように 1 つまたは少数を明示する。設定ファイルから読む場合も `none` が混入しない形にする。 |
| レビュー | `algorithms` / `algorithm` 引数の有無、`header["alg"]` や `getAlgorithm()` を検証に流用しているコード、`"none"`、`HS256` と `RS256` が同じ検証呼び出しに並んでいる箇所を探す。 |
| テスト | ヘッダを `{"alg":"none"}`（`None`、`NONE` も）にして署名を空にしたトークン → 401。RS256 の公開鍵を HMAC 鍵として HS256 で署名したトークン → 401。 |

**誤解しやすいポイント**: 「有名なライブラリを使っているから `none` は通らない」と思いがちですが、古いバージョン、別ライブラリへの置き換え、`algorithms` 引数に設定値をそのまま渡す実装などで崩れます。テストで実際に `alg: none` を投げて確認するのが一番確実です。

---

### V9.1.3 検証鍵は事前設定した信頼できる取得元から `L1`

> **原文**: Verify that key material that is used to validate self-contained tokens is from trusted pre-configured sources for the token issuer, preventing attackers from specifying untrusted sources and keys. For JWTs and other JWS structures, headers such as 'jku', 'x5u', and 'jwk' must be validated against an allowlist of trusted sources.

**ひとことで**: 検証に使う公開鍵は「発行者ごとにこちらで決めた場所」からだけ取得し、トークン自身が指定する鍵や URL を信用しない。

**開発の現場で言うと**: Auth0 / Cognito / Keycloak / Entra ID などの IdP の JWKS エンドポイントから公開鍵を取ってきて JWT を検証する処理を書くときです。JWS ヘッダには `jku`（鍵セットの URL）、`x5u`（証明書の URL）、`jwk`（鍵そのもの）を入れられますが、これらをそのまま使うと、攻撃者は自分の鍵で署名し「この鍵で検証して」と指定するだけで通ってしまいます。
`kid` ヘッダで鍵を選ぶこと自体は一般的ですが、それは「事前設定した JWKS の中から選ぶ」場合に限ります。`kid` をファイルパスや SQL に流用するコードは別の脆弱性（パストラバーサル・SQLi）にもなります。
フレームワークの OIDC / Resource Server 機能（例: Spring Security の `issuer-uri` / `jwk-set-uri` 設定）を使う場合、鍵の取得元は設定値で固定されるのが通常です。自前でマルチテナント対応（テナントごとに IdP が違う）を作るときに崩れやすく、`iss` クレームの値から JWKS URL を組み立てる実装は、`iss` が検証前の値であるため危険です。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | 信頼する発行者（issuer）と、その JWKS URL / 公開鍵の一覧を設定として持つ。マルチテナントなら「テナント ID → 許可 issuer → JWKS URL」の対応表をサーバー側に持つ。 |
| 実装 | JWKS URL は設定値から取得する。`jku` / `x5u` / `jwk` を使う必要がある場合は allowlist と完全一致で照合する。`kid` は取得済み鍵セットの検索キーとしてだけ使う。 |
| レビュー | `header.jku`、`header.x5u`、`header.jwk`、`kid` の使われ方、`iss` から URL を組み立てる文字列連結、JWKS 取得の URL が変数由来になっていないかを確認。 |
| テスト | 攻撃者の鍵ペアで署名し、`jwk` ヘッダに攻撃者の公開鍵を埋め込んだトークン → 401。`jku` に攻撃者のサーバー URL を入れたトークン → 401 かつ、そのサーバーへのアクセスが発生しないこと。 |

**誤解しやすいポイント**: 「署名を検証しているから安全」は不十分です。**どの鍵で**検証しているかが攻撃者に選べるなら、署名検証は意味を失います。また「`jku` のホストが自社ドメインか前方一致で見ている」程度のチェックは、`https://example.com.attacker.net/` のような URL で破られることがあります。

---

### V9.2.1 有効期間（nbf / exp）を検証する `L1`

> **原文**: Verify that, if a validity time span is present in the token data, the token and its content are accepted only if the verification time is within this validity time span. For example, for JWTs, the claims 'nbf' and 'exp' must be verified.

**ひとことで**: トークンに有効期間が書かれているなら、今がその期間内であるときだけ受け入れる。

**開発の現場で言うと**: 主要な JWT ライブラリは、検証付きの API を使えば `exp`（とライブラリによっては `nbf`）を既定でチェックすることが多いです。崩れるのは、テストで期限切れトークンを使い回すために `verify_exp: False` / `ignoreExpiration: true` を入れ、それが本番コードに残るケースや、時刻ずれ対策の許容値（leeway / clock skew）を「とりあえず 1 日」のように大きくしてしまうケースです。
また SAML アサーションでは `NotBefore` / `NotOnOrAfter` が同じ役割を持ちます。メール認証リンクやパスワードリセット用に自前で署名付きトークンを作る場合も、有効期限を入れたならそれを検証する必要があります。
なお、この要件は「有効期間が存在するなら」検証せよという書き方です。`exp` を必須にするかどうか（期限のないトークンを拒否するか）は、別途設計で決めるべき事項で、多くの場合は必須にするのが妥当です。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | トークン種別ごとの有効期間と、許容する時刻ずれ（数十秒〜数分程度が一般的）を決める。`exp` を必須にするかを決める。サーバーの時刻同期（NTP）を前提条件として運用に組み込む。 |
| 実装 | ライブラリの既定検証を無効化しない。`exp` 必須にするならライブラリの「必須クレーム」オプション（例: PyJWT の `options={"require": ["exp"]}`）を使う。 |
| レビュー | `verify_exp`、`ignoreExpiration`、`clockTolerance`、`leeway`、`setAllowedClockSkewSeconds`、`acceptExpiresAt` などの値を grep し、異常に大きくないか、テスト用設定が本番に混入していないかを見る。 |
| テスト | `exp` を過去にしたトークン（正しく署名）→ 401。`nbf` を 1 時間後にしたトークン → 401。許容値ちょうど前後の境界も確認する。 |

**誤解しやすいポイント**: 「アクセストークンは 15 分で切れる設定にしたから大丈夫」は発行側の設定の話で、**受け取る側が `exp` を検証していなければ**期限切れトークンは永久に使えます。発行側と検証側の両方を確認してください。

---

## この章のまとめ: PR レビューで聞く質問

- トークンのクレームを読む前に、検証付き API（`verify` 系）を必ず通していますか？ `decode` だけの経路はありませんか？
- 検証時に許可アルゴリズムをコード（または設定）で明示し、`none` が入り得ない形になっていますか？
- 検証鍵の取得元は設定で固定されていて、`jku` / `x5u` / `jwk` / `iss` などトークン由来の値で鍵の場所が変わらないようになっていますか？
- `exp` / `nbf` の検証を無効化していませんか？ 時刻ずれの許容値は妥当な小ささですか？
- 改ざん・`alg: none`・期限切れ・攻撃者鍵の 4 種類の不正トークンを使った自動テストがありますか？
