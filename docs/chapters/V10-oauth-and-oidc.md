# V10 OAuth と OIDC（OAuth and OIDC）

> 📘 原文: [0x19-V10-OAuth-and-OIDC.md](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x19-V10-OAuth-and-OIDC.md)
> 📊 要件数: **36**（L1: 5 / L2: 24 / L3: 7）
> ✅ 全要件のチェックリスト: [checklists/by-chapter/V10.md](../../checklists/by-chapter/V10.md)

## 1. この章の目的

OAuth 2.0（この章では単に OAuth と呼ぶ）は、委任された認可（delegated authorization）のための業界標準フレームワークです。たとえばクライアントアプリが、ユーザーの許可のもとでユーザーに代わって API にアクセスできます。OAuth 自体はユーザー認証のための仕組みではなく、その上にユーザー ID の層を追加したのが OpenID Connect（OIDC）です。OIDC は OAuth の拡張なので、この章の OAuth 要件は OIDC にも適用されます。

この章は、Web アプリケーションと API に焦点を当て、OAuth/OIDC のベストカレントプラクティス（oauth.net や openid.net の仕様に準拠）を要件化しています。仕様は頻繁に更新されるため最新版に合わせること、そして領域が複雑なので**実績のある業界標準の認可サーバーを使い、推奨されるセキュリティ設定を適用すること**が極めて重要だと原文は強調しています。他の章の一般的な要件も常に適用され、この章だけを切り離して扱うことはできません。

### 登場する役割（ロール）

| 役割 | 説明 |
| --- | --- |
| OAuth クライアント | アクセストークンを取得して API を呼ぶアプリ。資格情報を秘匿できる**コンフィデンシャルクライアント**（例: サーバーサイドのバックエンド）と、秘匿できず `client_id` で名乗るだけの**パブリッククライアント**（例: SPA）がある |
| リソースサーバー（RS） | クライアントにリソースを公開する API |
| 認可サーバー（AS） | クライアントにアクセストークンを発行するサーバー |
| リソースオーナー（RO） | 認可を与えるエンドユーザー。AS とやり取りして同意する |
| リライングパーティ（RP） | OIDC で、OpenID Provider に認証を依頼するクライアント（＝ OAuth クライアント） |
| OpenID Provider（OP） | エンドユーザーを認証し、OIDC クレームを RP に提供する AS |

### この章での「トークン」

- **アクセストークン**: RS だけが消費する。イントロスペクションで検証する参照型、または鍵素材で検証する自己完結型がある。
- **リフレッシュトークン**: それを発行した AS だけが消費する。
- **ID トークン**: 認可フローを開始したクライアントだけが消費する。

一部の要件のリスクレベルは、クライアントがコンフィデンシャルかパブリックかで変わります。強力なクライアント認証は多くの攻撃を緩和するため、L1 ではコンフィデンシャルクライアントについて一部要件が緩和される場合があります。

## 2. セクション構成

| セクション | 日本語名 | 何を扱うか（1行） | 要件数 |
| --- | --- | --- | :---: |
| V10.1 | OAuth/OIDC 共通のセキュリティ | トークンを必要なコンポーネントにだけ渡す、フローとセッションの結び付け | 2 |
| V10.2 | OAuth クライアント | CSRF 対策（PKCE/state）、mix-up 攻撃対策、最小スコープ要求 | 3 |
| V10.3 | OAuth リソースサーバー | audience・委任クレーム・ユーザー識別・認証強度の検証、送信者制約付きトークン | 5 |
| V10.4 | OAuth 認可サーバー | リダイレクト URI 完全一致、認可コード、グラント制限、PKCE、リフレッシュトークン、クライアント認証など | 16 |
| V10.5 | OIDC クライアント | nonce、sub によるユーザー識別、issuer 検証、aud 検証、バックチャネルログアウト | 5 |
| V10.6 | OpenID Provider | 許可する response mode、強制ログアウトによる DoS 対策 | 2 |
| V10.7 | 同意管理 | 同意の取得、分かりやすい同意画面、同意の確認・変更・取り消し | 3 |

L1 の 5 要件はすべて V10.4（認可サーバー）にあります。自前で認可サーバーを作らず既製品を使う場合でも、その設定がこれらを満たしているかの確認が必要です。

## 3. 押さえるべき重要要件

### V10.4.1 — リダイレクト URI は事前登録＋完全一致（L1）

- **要件（意訳）**: 認可サーバーが、クライアントごとに事前登録された URI の allowlist に基づき、**完全な文字列比較**でリダイレクト URI を検証していることを確認する。
- **なぜ重要か**: 前方一致やワイルドカード、正規表現で判定していると、`https://app.example.com.attacker.net/` や `https://app.example.com/callback/../open-redirect?to=...` のような URI に認可コードやトークンを送らせる攻撃が成立します。認可コードが攻撃者に渡れば、アカウント乗っ取りにつながります。
- **実装のポイント**: 登録済み URI と文字列として完全一致した場合のみ許可する。

```python
# ❌ NG 例: 前方一致・部分一致
if redirect_uri.startswith(client.redirect_uri_prefix):
    ...

# ✅ OK 例: 事前登録リストとの完全一致
if redirect_uri not in client.registered_redirect_uris:   # list/set の完全一致
    return error("invalid_request")
```

### V10.4.2 / V10.4.3 — 認可コードは 1 回限り・短命（L1）

- **要件（意訳）**:
  - V10.4.2: 認可サーバーが認可レスポンスで認可コードを返す場合、そのコードはトークンリクエストに 1 回だけ使えること。既にアクセストークン発行に使われたコードで 2 回目の有効なリクエストが来たら、拒否し、そのコードに関連して発行済みのトークンも失効させること。
  - V10.4.3: 認可コードの有効期間が短いこと。最大で L1/L2 は 10 分、L3 は 1 分まで。
- **なぜ重要か**: 認可コードはブラウザのリダイレクトを経由するため、ログ・Referer・履歴などから漏れる可能性があります。再利用できたり長寿命だったりすると、漏えいしたコードで攻撃者がトークンを取得できます。2 回目の使用はコード漏えいの兆候なので、関連トークンを失効させます。
- **実装のポイント**: コードを使用済みにする処理はアトミックに行い、発行したトークンとの関連を記録しておく。

```python
# ✅ OK 例（擬似コード）
def redeem_code(code, client):
    rec = codes.get(code)
    if rec is None or rec.client_id != client.id or rec.expires_at < now():
        raise InvalidGrant()
    if rec.used:                              # 2 回目の利用
        revoke_tokens_issued_from(rec)        # 関連トークンを失効
        raise InvalidGrant()
    rec.mark_used()                           # 実際は DB 上でアトミックに
    return issue_tokens(rec)

CODE_TTL_SECONDS = 60   # L3 は最大 1 分、L1/L2 は最大 10 分
```

### V10.4.4 — 必要なグラントだけを許可し、Implicit と ROPC は使わない（L1）

- **要件（意訳）**: 認可サーバーが、クライアントごとに、そのクライアントが必要とするグラントの使用だけを許可していることを確認する。`token`（Implicit フロー）と `password`（Resource Owner Password Credentials フロー）のグラントはもはや使用してはならない。
- **なぜ重要か**: Implicit フローはアクセストークンを URL フラグメントで直接返すため、漏えいしやすく送信者制約もできません。ROPC はユーザーのパスワードをクライアントに渡すため、OAuth の「パスワードを渡さずに委任する」という前提を壊します。
- **実装のポイント**: クライアント登録時に `grant_types` を最小限（多くの Web アプリは `authorization_code` と、必要なら `refresh_token`）に設定する。

### V10.4.5 — リフレッシュトークンのリプレイ対策（L1）

- **要件（意訳）**: 認可サーバーが、パブリッククライアントについてリフレッシュトークンのリプレイ攻撃を緩和していることを確認する。望ましいのは送信者制約付きリフレッシュトークン（DPoP、または mTLS による証明書バインド）を使うこと。L1/L2 ではリフレッシュトークンのローテーションでもよい。ローテーションを使う場合、使用後のリフレッシュトークンを無効化し、既に使用・無効化されたリフレッシュトークンが提示されたら、その認可に関するすべてのリフレッシュトークンを失効させなければならない。
- **なぜ重要か**: SPA などパブリッククライアントのリフレッシュトークンが盗まれると、長期間にわたり新しいアクセストークンを取得され続けます。
- **実装のポイント**: ローテーション方式なら「使用済みトークンの再提示＝盗難の兆候」として、そのトークンファミリーごと失効させる。

```python
# ✅ OK 例: リフレッシュトークンのローテーション（擬似コード）
def refresh(rt_value):
    rt = refresh_tokens.get(rt_value)
    if rt is None:
        raise InvalidGrant()
    if rt.used:
        refresh_tokens.revoke_family(rt.family_id)   # 再利用検知 → 全部失効
        raise InvalidGrant()
    rt.mark_used()
    return issue_access_token(rt), refresh_tokens.issue(family_id=rt.family_id)
```

### V10.2.1 / V10.4.6 — PKCE（L2）

- **要件（意訳）**:
  - V10.2.1（クライアント）: コードフローを使う場合、OAuth クライアントは、トークンリクエストを引き起こすブラウザ経由のリクエストフォージェリ（CSRF）への対策を持つこと。PKCE の機能を使うか、認可リクエストで送った `state` パラメータを確認する。
  - V10.4.6（認可サーバー）: コードグラントを使う場合、認可サーバーは PKCE を必須にして認可コード横取り攻撃を緩和すること。認可リクエストでは有効な `code_challenge` を必須とし、`code_challenge_method` に `plain` を受け入れてはならない。トークンリクエストでは `code_verifier` の検証を必須とする。
- **なぜ重要か**: PKCE が無いと、認可コードを横取りした攻撃者がそれをトークンと交換できます。また、攻撃者のアカウントで取得した認可コードを被害者のブラウザに送り込む CSRF（ログイン CSRF）も成立します。
- **実装のポイント**: `code_verifier` は推測不能な乱数で生成し、ユーザーのセッションに結び付けて保存する（V10.1.2）。メソッドは `S256` のみ。

```python
import secrets, hashlib, base64

# ❌ NG 例: plain メソッド、固定値の verifier
code_verifier = "fixed-verifier"
params = {"code_challenge": code_verifier, "code_challenge_method": "plain"}

# ✅ OK 例: S256、トランザクションごとの乱数をセッションに保存
code_verifier = secrets.token_urlsafe(64)
challenge = base64.urlsafe_b64encode(
    hashlib.sha256(code_verifier.encode()).digest()).rstrip(b"=").decode()
session["pkce_verifier"] = code_verifier
session["oauth_state"] = secrets.token_urlsafe(32)
params = {"code_challenge": challenge, "code_challenge_method": "S256",
          "state": session["oauth_state"]}
```

### V10.1.1 — トークンは必要なコンポーネントにだけ渡す（BFF パターン）（L2）

- **要件（意訳）**: トークンが、それを厳密に必要とするコンポーネントにだけ送られることを確認する。たとえばブラウザベースの JavaScript アプリで BFF（Backend For Frontend）パターンを使う場合、アクセストークンとリフレッシュトークンはバックエンドからのみアクセスできるようにする。
- **なぜ重要か**: ブラウザの JavaScript（localStorage など）にトークンを置くと、XSS 1 つでトークンが盗まれます。
- **実装のポイント**: OAuth の処理は BFF で行い、ブラウザとは `HttpOnly; Secure; SameSite` 付きのセッション Cookie でやり取りする。BFF が API を呼ぶときにだけトークンを付与する。

### V10.3.1 / V10.3.3 — リソースサーバーでの audience 検証とユーザー識別（L2）

- **要件（意訳）**:
  - V10.3.1: リソースサーバーが、そのサービス向けに発行されたアクセストークン（audience）だけを受け入れること。audience は構造化アクセストークン（JWT の `aud` など）に含まれる場合もあれば、トークンイントロスペクションエンドポイントで確認できる場合もある。
  - V10.3.3: アクセス制御判断でアクセストークン（JWT や関連するイントロスペクション応答）から一意のユーザーを識別する必要がある場合、リソースサーバーは、他のユーザーに再割り当てされることのないクレームでユーザーを識別すること。通常は `iss` と `sub` の組み合わせを使う。
- **なぜ重要か**: `email` や `preferred_username` は変更・再利用されることがあり、複数 IdP を扱う場合は `sub` だけでは衝突し得ます。別人を同一ユーザーとみなすとアカウント乗っ取りになります。
- **実装のポイント**:

```python
# ❌ NG 例: メールアドレスでユーザーを特定
user = User.query.filter_by(email=claims["email"]).first()

# ✅ OK 例: (iss, sub) の組で特定し、aud も検証済みであること
claims = jwt.decode(token, key=key, algorithms=["RS256"],
                    audience="https://api.example.com")
user = User.query.filter_by(issuer=claims["iss"], subject=claims["sub"]).first()
```

### V10.5.1 / V10.5.4 — OIDC クライアントの nonce と aud 検証（L2）

- **要件（意訳）**:
  - V10.5.1: クライアント（RP）が ID トークンのリプレイ攻撃を緩和すること。たとえば、ID トークン内の `nonce` クレームが、OpenID Provider への認証リクエストで送った `nonce` 値と一致することを確認する。
  - V10.5.4: クライアントが、ID トークンの `aud` クレームが自分の `client_id` と等しいことを確認し、そのトークンが自分向けであることを検証すること。
- **なぜ重要か**: 別の RP 向けに発行された ID トークンや、過去に取得した ID トークンを攻撃者が流し込むと、他人としてログインできてしまう可能性があります。
- **実装のポイント**: 認証リクエストごとに推測不能な `nonce` を生成しセッションに保存（V10.1.2）、ID トークン検証時に照合し、使用後は破棄する。

```python
# ✅ OK 例
claims = jwt.decode(id_token, key=op_key, algorithms=["RS256"],
                    audience=CLIENT_ID, issuer=EXPECTED_ISSUER)
if not secrets.compare_digest(claims.get("nonce", ""), session.pop("oidc_nonce", "")):
    abort(401)
```

## 4. よくある脆弱性・アンチパターン

- **リダイレクト URI のワイルドカード/前方一致**: 認可コード・トークンの窃取（V10.4.1）。
- **Implicit フロー・ROPC の継続利用**: 古いチュートリアルのままの実装（V10.4.4）。
- **PKCE なし、`state` なし、または固定値**: ログイン CSRF、認可コード横取り（V10.2.1, V10.4.6, V10.1.2）。
- **`code_challenge_method=plain` の許可**: PKCE の効果が大きく下がる（V10.4.6）。
- **SPA の localStorage にアクセストークン・リフレッシュトークン**: XSS で窃取される（V10.1.1）。
- **複数 AS を扱うクライアントで `iss` を検証しない**: mix-up 攻撃で、正規 AS の認可コードを攻撃者の AS に送らされる（V10.2.2）。
- **ID トークンを API のアクセストークン代わりに使う / API で aud を見ない**（V10.3.1、V9.2.2）。
- **email でアカウントを紐付け**: IdP 側でメールを変更・再利用されると乗っ取り（V10.3.3, V10.5.2）。
- **リフレッシュトークンが無期限**: スライディング期限のみで絶対期限がない（V10.4.8）。
- **スコープの付けすぎ**: クライアントが不要なスコープを要求する、AS がクライアントに不要なスコープを割り当てる（V10.2.3, V10.4.11）。
- **同意画面が不明瞭・同意を取り消せない**（V10.7.2, V10.7.3）。

## 5. 検証（テスト）のヒント

- **リダイレクト URI の改変**: 登録 URI に対して、パスの追加・サブドメイン追加・`@` や `..` を含む URI・クエリ追加などを試し、すべて拒否されるか（V10.4.1）。
- **認可コードの再利用と期限**: 同じコードで 2 回トークンリクエストを送り、2 回目が拒否されるか、さらに 1 回目で発行されたトークンが失効するか。発行から一定時間後に使って拒否されるか（V10.4.2, V10.4.3）。
- **PKCE**: `code_challenge` なしの認可リクエスト、`plain` メソッド、誤った `code_verifier` を試す（V10.4.6）。
- **state/nonce**: `state` を削除・改変・他セッションの値に差し替える。ID トークンの `nonce` が違う場合に拒否されるか（V10.2.1, V10.1.2, V10.5.1）。
- **グラントタイプ**: `grant_type=password` や `response_type=token` が拒否されるか（V10.4.4, V10.6.1）。
- **リフレッシュトークン**: 使用済みのリフレッシュトークンを再送し、トークンファミリー全体が失効するか（V10.4.5）。
- **トークン流用**: 別クライアント・別 API 向けのトークン、ID トークンを API に送る（V10.3.1, V10.5.4）。
- **設定レビュー**: 既製の AS（Keycloak など）を使う場合は、クライアントごとの許可グラント、リダイレクト URI、PKCE 必須化、トークン寿命、スコープ割り当てを設定画面で確認する。
- **メタデータ**: クライアントが、`/.well-known/openid-configuration` の `issuer` が事前設定値と完全一致しない場合に拒否するか（V10.5.3）。

## 6. 確認問題

**Q1.** 認可サーバーがリダイレクト URI を `redirect_uri.startswith("https://app.example.com")` で検証している。何が問題で、どの要件に違反していますか。

<details><summary>答えと解説</summary>

`https://app.example.com.attacker.net/...` のような攻撃者のドメインも前方一致で通ってしまい、認可コードやトークンが攻撃者に送られる可能性があります。**V10.4.1**（L1）は、クライアントごとに事前登録した URI の allowlist と**完全な文字列比較**で検証することを求めています。

</details>

**Q2.** L3 アプリケーションの認可コードの最大有効期間はどれですか。
(a) 30 秒　(b) 1 分　(c) 10 分　(d) 1 時間

<details><summary>答えと解説</summary>

**(b) 1 分** です。**V10.4.3** では、認可コードは短命であるべきとし、最大で L1/L2 は 10 分、L3 は 1 分としています。

</details>

**Q3.** ASVS 5.0 の V10.4.4 で「もはや使用してはならない」とされている 2 つのグラントは何ですか。

<details><summary>答えと解説</summary>

`token`（**Implicit フロー**）と `password`（**Resource Owner Password Credentials フロー**）です。**V10.4.4**（L1）は、クライアントごとに必要なグラントだけを許可することも求めています。

</details>

**Q4.** パブリッククライアント（SPA）向けに、L2 アプリケーションでリフレッシュトークンのローテーションを採用した。V10.4.5 を満たすために、使用済みのリフレッシュトークンが再度提示されたとき認可サーバーは何をすべきですか。

<details><summary>答えと解説</summary>

その要求を拒否するだけでなく、**その認可に関するすべてのリフレッシュトークンを失効させる**必要があります。また、ローテーションでは使用後のリフレッシュトークンを無効化しなければなりません（**V10.4.5**）。なお、望ましい対策は DPoP や mTLS による送信者制約付きリフレッシュトークンで、ローテーションは L1/L2 で許容される代替手段です。

</details>

**Q5.** API（リソースサーバー）が、アクセストークンの `email` クレームでユーザーを特定している。どの要件の観点で問題があり、何を使うべきですか。

<details><summary>答えと解説</summary>

**V10.3.3**（L2）の観点で問題があります。ユーザーの特定には、他のユーザーに再割り当てされることのないクレームを使う必要があり、通常は **`iss` と `sub` の組み合わせ**を使います。メールアドレスは変更や再利用が起こり得るため、別人を同一ユーザーとみなす危険があります。OIDC クライアント側の同様の要件は V10.5.2 です。

</details>

## 7. 関連リソース

- OWASP Cheat Sheet: [OAuth 2.0 Protocol Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)
- OWASP Cheat Sheet: [JSON Web Token Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html)
- [oauth.net](https://oauth.net/)
- RFC: [RFC 9700 Best Current Practice for OAuth 2.0 Security](https://datatracker.ietf.org/doc/html/rfc9700)
- RFC: [RFC 7636 Proof Key for Code Exchange (PKCE)](https://datatracker.ietf.org/doc/html/rfc7636)
- RFC: [RFC 9449 OAuth 2.0 Demonstrating Proof of Possession (DPoP)](https://datatracker.ietf.org/doc/html/rfc9449)
- RFC: [RFC 9126 OAuth 2.0 Pushed Authorization Requests (PAR)](https://datatracker.ietf.org/doc/html/rfc9126)
- RFC: [RFC 9207 OAuth 2.0 Authorization Server Issuer Identification](https://datatracker.ietf.org/doc/html/rfc9207)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html) / [FAPI 2.0 Security Profile](https://openid.net/specs/fapi-security-profile-2_0-final.html)
- 関連する章: V6（認証 ― IdP による認証のセクション）、V7（セッション管理）、V8（認可）、V9（自己完結型トークン）、V12（安全な通信）
