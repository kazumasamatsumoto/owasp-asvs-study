# V10 OAuth と OIDC — L1 要件を開発の観点で読む

> 対象: L1 要件 5 件 ／ 章の解説: [../chapters/V10-oauth-and-oidc.md](../chapters/V10-oauth-and-oidc.md)

## この章の要件を一言でいうと

L1 の 5 件はすべて **V10.4「OAuth 認可サーバー（AS）」** の要件です。つまり「トークンを発行する側」を作る・設定するときの話です。
多くのアプリ開発者は Keycloak、Auth0、Okta、Cognito、Entra ID、Spring Authorization Server などの既製の AS を使うので、実際の作業は「自前でコードを書く」よりも「**AS 製品のクライアント設定を正しく行う**」ことになります。
一方、社内向けに自前で AS（または OIDC プロバイダ）を実装している場合は、ここに書かれた振る舞いをすべて自分で実装・テストする必要があります。
OAuth クライアント（ログインボタンを置く側）やリソースサーバー（API 側）の要件は L2 以上に多くあるので、そちらは章の解説を参照してください。

## 要件ごとの読み解き

### V10.4.1 リダイレクト URI は事前登録＋完全一致 `L1`

> **原文**: Verify that the authorization server validates redirect URIs based on a client-specific allowlist of pre-registered URIs using exact string comparison.

**ひとことで**: 認可コードを返す先（redirect_uri）は、クライアントごとに事前登録した URI と文字列として完全一致するものだけ許可する。

**開発の現場で言うと**: AS の管理画面で新しいクライアント（例: 社内の Web アプリ、モバイルアプリ、プレビュー環境）を登録するときと、自前 AS の `/authorize` エンドポイントを実装するときです。
リダイレクト先の検証が緩いと、攻撃者は `redirect_uri=https://attacker.example/cb` を指定した認可リクエストのリンクを被害者に踏ませ、発行された認可コード（やトークン）を自分のサーバーに送らせることができます。
製品によってはワイルドカードや前方一致での登録を許す設定があり、「プレビュー環境の URL が毎回変わるから `https://*.example.com/*` で登録した」という運用が典型的な崩れ方です。
自前実装では `startsWith`、正規表現、ホスト部分だけの比較、URL のパース後に一部だけを比較する実装がよく問題になります。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | クライアントごとに許可するリダイレクト URI の一覧を決め、その登録・変更手順（誰が承認するか）を決める。動的に URL が変わる環境（PR プレビューなど）は専用クライアントを分けるか、別の方式を検討する。 |
| 実装 | 自前 AS では、受け取った `redirect_uri` を登録済みリストと `==` で比較する。正規化（大文字小文字、末尾スラッシュ、パーセントエンコード）してから比較するような「親切な」処理は入れない。 |
| レビュー | AS 設定（Terraform / IaC / エクスポートした設定 JSON）で `*` を含むリダイレクト URI を探す。自前実装では `startsWith`、`includes`、`match(`、`indexOf`、`urlparse(...).netloc` だけの比較を探す。 |
| テスト | 登録済み URI に対し、末尾に `/../evil`、`?x=`、`.attacker.example`、`@attacker.example`、スキーム違い（`http://`）、ポート違いを付けた値で認可リクエストを送り、すべてエラーになる（リダイレクトされない）こと。 |

**誤解しやすいポイント**: 「ドメインが自社なら安全」は誤りです。自社ドメイン配下にオープンリダイレクトがあるページや、ユーザーがコンテンツを置けるパスがあれば、そこ経由で認可コードが漏れます。だからこそ「ドメイン一致」ではなく「URI 全体の完全一致」が求められています。

---

### V10.4.2 認可コードは 1 回限り `L1`

> **原文**: Verify that, if the authorization server returns the authorization code in the authorization response, it can be used only once for a token request. For the second valid request with an authorization code that has already been used to issue an access token, the authorization server must reject a token request and revoke any issued tokens related to the authorization code.

**ひとことで**: 認可コードはトークン交換に 1 回しか使えないようにし、2 回目が来たら拒否したうえで、そのコードから発行済みのトークンも失効させる。

**開発の現場で言うと**: 既製の AS では通常この挙動は組み込まれていますが、「2 回目で発行済みトークンまで失効させる」部分の挙動は製品ごとにドキュメントで確認する価値があります。
自前 AS を実装する場合、`/token` エンドポイントで認可コードを DB や Redis で引き、使用済みフラグを立てる処理になります。ここで「SELECT して未使用ならトークン発行 → UPDATE で使用済み」と書くと、並行リクエストで 2 回発行されるレースコンディションが起きます。
2 回目の使用は「コードが漏れて攻撃者が使った（または正規クライアントが後から使った）」兆候なので、要件はそのコードに紐づいて発行されたアクセストークン・リフレッシュトークンの失効まで求めています。そのためには **発行したトークンが、どの認可コードから生まれたか** を記録しておく必要があります。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | 認可コード → 発行トークン（アクセス・リフレッシュ）の紐付けを保存するデータモデルにする。自己完結型のアクセストークンを使う場合、即時失効をどう実現するか（短い有効期限、イントロスペクション併用など）を決める。 |
| 実装 | 「使用済みにする」操作を原子的に行う（`UPDATE ... SET used=true WHERE code=? AND used=false` の更新件数で判定、Redis の `GETDEL` など）。2 回目検出時は紐付くトークンを失効させる。 |
| レビュー | `/token` ハンドラで認可コードの検索と使用済み更新が別トランザクションになっていないか、使用済みコードの分岐でトークン失効処理が呼ばれているかを確認。 |
| テスト | 同じ認可コードで `/token` を 2 回呼ぶ → 2 回目は `invalid_grant`、かつ 1 回目で得たアクセストークン・リフレッシュトークンが使えなくなること。同時に 2 リクエストを投げても発行が 1 回だけであること。 |

**誤解しやすいポイント**: 「PKCE を使っているから認可コードの再利用は気にしなくてよい」は誤りです。PKCE は「コードを横取りした第三者」対策で、コードの 1 回限り使用や再利用時の失効とは別の防御です。両方必要です。

---

### V10.4.3 認可コードは短命に `L1`

> **原文**: Verify that the authorization code is short-lived. The maximum lifetime can be up to 10 minutes for L1 and L2 applications and up to 1 minute for L3 applications.

**ひとことで**: 認可コードの有効期限は L1/L2 では最大 10 分、L3 では最大 1 分にする。

**開発の現場で言うと**: 認可コードは、ブラウザがリダイレクトで受け取ってからクライアントのバックエンドが即座にトークンと交換するためのものなので、本来数秒〜数十秒で使われます。長くしておく理由はほとんどありません。
既製の AS では、認可コードの有効期間は設定項目として存在する場合と、固定値になっている場合があります。製品のドキュメントで値を確認し、10 分以内であることを記録しておきます。
自前 AS では、コード発行時に `expires_at` を保存し、`/token` で現在時刻と比較します。Redis に TTL 付きで保存する実装はシンプルで確実です。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | 認可コードの有効期限を決めて文書化する（L1 なら 10 分以内。実運用では 1 分程度でも困ることは少ない）。 |
| 実装 | 発行時に有効期限を付けて保存し、交換時に期限切れなら `invalid_grant` を返す。期限切れコードはストアから削除する。 |
| レビュー | 認可コードの TTL 設定値（`authorization_code_ttl`、`code_lifetime` など製品・実装ごとの名前）を確認し、10 分を超えていないか見る。 |
| テスト | 認可コードを取得し、設定した有効期限 + α 秒待ってから `/token` を呼ぶ → `invalid_grant` になること（テストでは時刻をモックするか、テスト環境だけ短い TTL にする）。 |

**誤解しやすいポイント**: 「コードは 1 回しか使えないから期限は長くても問題ない」は誤りです。漏えいしたコードが正規クライアントより先に使われる可能性は、有効期間が長いほど高くなります。1 回限り（V10.4.2）と短命（V10.4.3）は補い合う関係です。

---

### V10.4.4 クライアントごとに必要なグラントだけ許可 `L1`

> **原文**: Verify that for a given client, the authorization server only allows the usage of grants that this client needs to use. Note that the grants 'token' (Implicit flow) and 'password' (Resource Owner Password Credentials flow) must no longer be used.

**ひとことで**: クライアントごとに使ってよいグラントタイプを絞り、Implicit フローと ROPC（パスワード）フローは使わない。

**開発の現場で言うと**: AS の管理画面でクライアントを登録するとき、「とりあえず全部チェック」でグラントタイプ（authorization_code、client_credentials、refresh_token、implicit、password など）を有効にしてしまうのが典型的な崩れ方です。
SPA では以前 Implicit フロー（`response_type=token`）がよく使われていましたが、現在は Authorization Code + PKCE が推奨です。また「自社アプリのログイン画面で ID/パスワードを受け取り、AS に `grant_type=password` で投げる」ROPC は、移行中のレガシー構成で残りがちです。
バッチやサーバー間連携には client_credentials、ユーザーのログインには authorization_code、というように **用途 → 必要なグラント** を対応させて最小限にします。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | クライアント一覧と、それぞれが必要とするグラントタイプを表にする（例: Web アプリ = authorization_code + refresh_token、夜間バッチ = client_credentials）。Implicit / ROPC を使っている既存クライアントがあれば移行計画を立てる。 |
| 実装 | 自前 AS では、クライアント定義に許可グラントのリストを持たせ、`/token` と `/authorize` で `grant_type` / `response_type` を照合する。`password` と `implicit` はサーバー全体で無効にする。 |
| レビュー | AS 設定（IaC）で `implicit`、`password`、`response_type=token`、`grant_types` のリストを確認。クライアントコードで `grant_type=password` や `response_type=token` を送っている箇所を grep する。 |
| テスト | 各クライアントの `client_id` で、許可していないグラント（例: Web アプリのクライアントで `grant_type=client_credentials`、`grant_type=password`）を投げる → `unauthorized_client` などのエラーになること。`response_type=token` の認可リクエストが拒否されること。 |

**誤解しやすいポイント**: 「自社のファーストパーティアプリだから ROPC でも問題ない」と考えがちですが、要件は例外なく「must no longer be used」です。ROPC はアプリにパスワードを直接扱わせるため、MFA やフィッシング耐性のある認証方式と組み合わせにくくなります。

---

### V10.4.5 パブリッククライアントのリフレッシュトークン再利用対策 `L1`

> **原文**: Verify that the authorization server mitigates refresh token replay attacks for public clients, preferably using sender-constrained refresh tokens, i.e., Demonstrating Proof of Possession (DPoP) or Certificate-Bound Access Tokens using mutual TLS (mTLS). For L1 and L2 applications, refresh token rotation may be used. If refresh token rotation is used, the authorization server must invalidate the refresh token after usage, and revoke all refresh tokens for that authorization if an already used and invalidated refresh token is provided.

**ひとことで**: SPA やモバイルアプリ（パブリッククライアント）に渡すリフレッシュトークンは、盗まれて使い回されないよう、DPoP/mTLS で送信者に縛るか、L1/L2 ならローテーション＋再利用検知を行う。

**開発の現場で言うと**: クライアントシークレットを安全に持てない SPA やネイティブアプリがリフレッシュトークンを受け取る構成のときです。ブラウザに保存したリフレッシュトークンが XSS などで盗まれると、攻撃者は長期間アクセストークンを取り続けられます。
L1 では「ローテーション」で要件を満たせます。ローテーションとは、リフレッシュトークンを使うたびに新しいものを発行し古いものを無効にする方式で、**すでに使われた古いトークンが再提示されたら、その認可に紐づくリフレッシュトークンをすべて失効させる**（再利用検知）ところまでが要件です。
既製の AS ではこの機能は「Refresh Token Rotation」「Reuse detection」などの名前の設定として提供されていることが多いですが、既定で有効かどうかは製品・バージョンによるので、クライアント設定で明示的に確認します。なお、バックエンドで動く BFF（コンフィデンシャルクライアント）にトークンを持たせる構成なら、そもそもブラウザにリフレッシュトークンを渡さずに済みます。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | どのクライアントがパブリッククライアントかを洗い出し、方式（DPoP / mTLS / ローテーション）を決める。ローテーションなら「認可（グラント）単位でトークン系列を管理する」データモデルにする。 |
| 実装 | 自前 AS では、リフレッシュ時に旧トークンを使用済みにし、新トークンを同じ系列 ID で発行する。使用済みトークンが来たら系列全体を失効させる。使用済み判定はアトミックに行う。 |
| レビュー | AS のクライアント設定でローテーション・再利用検知が有効か。自前実装ではリフレッシュ処理で旧トークンを無効化しているか、使用済みトークン受信時の分岐で系列失効を呼んでいるか。 |
| テスト | リフレッシュトークン RT1 で更新して RT2 を得る → 再度 RT1 を送る → エラーになり、さらに RT2 も使えなくなっていること。 |

**誤解しやすいポイント**: 「リフレッシュのたびに新しいトークンを返しているからローテーション済み」は不十分です。古いトークンを無効化していない、または古いトークンの再利用を検知しても系列全体を失効させていないと、要件を満たしません。

---

## この章のまとめ: PR レビューで聞く質問

- AS に登録したリダイレクト URI にワイルドカードや前方一致の指定はありませんか？ 自前実装なら完全一致で比較していますか？
- 認可コードは 1 回しか使えず、再利用時には紐づくトークンが失効しますか？ 並行リクエストでも 2 回発行されませんか？
- 認可コードの有効期限は 10 分以内（L3 なら 1 分以内）に設定・文書化されていますか？
- 各クライアントに許可しているグラントタイプは必要最小限で、Implicit と ROPC は無効になっていますか？
- パブリッククライアントのリフレッシュトークンは、DPoP/mTLS またはローテーション＋再利用検知で守られていますか？
