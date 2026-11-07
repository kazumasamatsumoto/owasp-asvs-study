# V9 自己完結型トークン（Self-contained Tokens）

> 📘 原文: [0x18-V9-Self-contained-Tokens.md](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x18-V9-Self-contained-Tokens.md)
> 📊 要件数: **7**（L1: 4 / L2: 3 / L3: 0）
> ✅ 全要件のチェックリスト: [checklists/by-chapter/V9.md](../../checklists/by-chapter/V9.md)

## 1. この章の目的

「自己完結型トークン（self-contained token）」とは、受け取ったサービスがセキュリティ上の判断に使うデータ（クレーム）をトークン自体に含んでいるトークンのことです。この概念は 2012 年の OAuth 2.0（RFC 6749）で既に言及されています。識別子だけを含み、受け取り側がその識別子でサーバー側のデータを引く「参照型」のトークン（セッション ID など）とは区別されます。代表例は JWT（JSON Web Token）と SAML アサーションです。

自己完結型トークンは OAuth/OIDC 以外でも広く使われるようになりましたが、その安全性は「トークンの完全性（改ざんされていないこと）を検証できるか」と「トークンが特定のコンテキストで有効であることを確認できるか」にかかっています。この検証には多くの落とし穴があり、この章ではそれを防ぐための仕組みを具体的に定めています。

## 2. セクション構成

| セクション | 日本語名 | 何を扱うか（1行） | 要件数 |
| --- | --- | --- | :---: |
| V9.1 | トークンの発行元と完全性 | 署名/MAC の検証、アルゴリズムの allowlist、検証鍵の信頼できる取得元 | 3 |
| V9.2 | トークンの内容 | 有効期間、トークン種別・用途、audience（宛先）の検証 | 4 |

OAuth/OIDC 固有の要件は V10 にまとめられています。V9 は JWT や SAML を使うあらゆる場面に共通する土台です。

## 3. 押さえるべき重要要件

この章は要件が 7 個と少ないので、全要件を解説します。

### V9.1.1 — 署名/MAC を検証してから中身を信用する（L1）

- **要件（意訳）**: 自己完結型トークンは、その内容を受け入れる前に、デジタル署名または MAC を用いて検証し、改ざんから保護されていることを確認する。
- **なぜ重要か**: JWT のペイロードは Base64URL エンコードされているだけで、誰でも読めて書き換えられます。署名検証をせずに `payload["role"]` を信じると、攻撃者は `"role": "admin"` に書き換えたトークンを送るだけで権限昇格できます。
- **実装のポイント**: 「デコード」と「検証」を混同しない。ライブラリの「署名検証なしでデコード」するオプションを本番コードで使わない。

```python
import jwt  # PyJWT

# ❌ NG 例: 署名を検証せずにペイロードを読む
claims = jwt.decode(token, options={"verify_signature": False})
if claims["role"] == "admin":
    ...

# ✅ OK 例: 鍵とアルゴリズムを指定して検証してから使う
claims = jwt.decode(token, key=PUBLIC_KEY, algorithms=["RS256"])
```

### V9.1.2 — アルゴリズムを allowlist で固定し、none を許さない（L1）

- **要件（意訳）**: 特定のコンテキストにおいて、自己完結型トークンの作成・検証に使えるのは allowlist に載ったアルゴリズムだけであることを確認する。allowlist には許可するアルゴリズムを含め、理想的には対称鍵か非対称鍵のどちらか一方だけにし、`None` アルゴリズムを含めてはならない。対称・非対称の両方をサポートしなければならない場合は、鍵の混同（key confusion）を防ぐ追加の制御が必要。
- **なぜ重要か**:
  - **alg=none 攻撃**: ヘッダの `alg` を `none` にして署名を空にしたトークンを、検証側がそのまま受け入れてしまう。
  - **鍵混同（アルゴリズム混同）攻撃**: 検証側が RS256 用の**公開鍵**を持っているところに、攻撃者が `alg` を `HS256` に変えて、その公開鍵（公開情報）を HMAC の秘密鍵として署名したトークンを送る。トークンヘッダの `alg` をそのまま信じて検証する実装だと、これが通ってしまう。
- **実装のポイント**: 検証時のアルゴリズムはトークンヘッダから読むのではなく、サーバー側の設定で固定する。

```python
# ❌ NG 例: トークン自身が申告する alg をそのまま使う
header = jwt.get_unverified_header(token)
claims = jwt.decode(token, key=KEY, algorithms=[header["alg"]])

# ✅ OK 例: このコンテキストで許可するアルゴリズムをサーバー側で固定
ALLOWED_ALGS = ["ES256"]          # 非対称鍵のみ。"none" や HS 系は入れない
claims = jwt.decode(token, key=PUBLIC_KEY, algorithms=ALLOWED_ALGS)
```

### V9.1.3 — 検証鍵は信頼できる事前設定済みの取得元から（L1）

- **要件（意訳）**: 自己完結型トークンの検証に使う鍵素材が、そのトークン発行者について事前に設定された信頼できる取得元から得られたものであり、攻撃者が信頼できない取得元や鍵を指定できないことを確認する。JWT などの JWS 構造では、`jku`、`x5u`、`jwk` といったヘッダは、信頼できる取得元の allowlist と照合して検証しなければならない。
- **なぜ重要か**: `jku`（JWK Set の URL）や `x5u`（証明書の URL）、`jwk`（公開鍵そのもの）はトークンのヘッダに入っており、攻撃者が自由に書けます。これを信じて鍵を取りに行くと、攻撃者が自分のサーバーに置いた鍵で署名したトークンが「正しく検証済み」になってしまいます。
- **実装のポイント**: 発行者（`iss`）ごとに JWKS の URL を設定ファイルで固定し、トークンヘッダの URL や埋め込み鍵は使わない（使う場合は allowlist と厳密照合）。

```python
from jwt import PyJWKClient

# ❌ NG 例: トークンヘッダの jku から鍵を取得
header = jwt.get_unverified_header(token)
key = PyJWKClient(header["jku"]).get_signing_key_from_jwt(token).key

# ✅ OK 例: 発行者ごとに事前設定した JWKS URL だけを使う
TRUSTED_JWKS = {"https://idp.example.com": "https://idp.example.com/.well-known/jwks.json"}
jwks_client = PyJWKClient(TRUSTED_JWKS["https://idp.example.com"])
key = jwks_client.get_signing_key_from_jwt(token).key
claims = jwt.decode(token, key=key, algorithms=["RS256"])
```

### V9.2.1 — 有効期間（nbf / exp）を検証する（L1）

- **要件（意訳）**: トークンデータに有効期間が含まれている場合、検証時刻がその期間内であるときに限り、トークンとその内容を受け入れることを確認する。たとえば JWT では `nbf` と `exp` クレームを検証しなければならない。
- **なぜ重要か**: 期限切れのトークンを受け入れると、漏えいしたトークンや失効させたつもりのトークンがいつまでも使えてしまいます。
- **実装のポイント**: ライブラリの期限検証を無効化しない。サーバー間の時刻ずれに備えた許容幅（leeway）は小さく保つ。`exp` を必須クレームにする。

```python
# ❌ NG 例: 期限チェックを無効化
claims = jwt.decode(token, key=KEY, algorithms=["ES256"],
                    options={"verify_exp": False})

# ✅ OK 例: exp を必須にし、許容ずれは小さく
claims = jwt.decode(token, key=KEY, algorithms=["ES256"],
                    options={"require": ["exp"]}, leeway=30)
```

### V9.2.2 — トークンの種類と用途を確認する（L2）

- **要件（意訳）**: トークンを受け取るサービスが、トークンの内容を受け入れる前に、それが正しい種類のトークンであり、意図された用途のためのものであることを検証することを確認する。たとえば、認可判断に使えるのはアクセストークンだけであり、ユーザー認証の証明に使えるのは ID トークンだけである。
- **なぜ重要か**: 同じ発行者・同じ鍵で署名されたトークンでも用途は異なります。ID トークンを API のアクセストークンとして受け入れたり、リフレッシュトークンやメール確認用トークンをログイン用として受け入れたりすると、想定外の権限が与えられます。
- **実装のポイント**: JWT の `typ` ヘッダ（例: アクセストークンの `at+jwt`）や、用途を示す独自クレームを検証する。用途ごとに鍵を分けるのも有効。

```python
# ✅ OK 例: アクセストークンとして発行されたものかを確認
header = jwt.get_unverified_header(token)   # 検証前ヘッダは「判定材料」としてのみ使う
if header.get("typ") != "at+jwt":
    raise InvalidToken("not an access token")
claims = jwt.decode(token, key=KEY, algorithms=["RS256"], audience="https://api.example.com")
```

### V9.2.3 — 自分宛て（audience）のトークンだけを受け入れる（L2）

- **要件（意訳）**: サービスが、そのサービスで使われることを意図したトークン（audience）だけを受け入れることを確認する。JWT では、サービス側で定義した allowlist に対して `aud` クレームを検証することで実現できる。
- **なぜ重要か**: 同じ IdP が複数のサービス向けにトークンを発行している場合、`aud` を確認しないと、サービス A 向けに発行されたトークンをサービス B に持ち込んで使えてしまいます（悪意あるサービス A の運営者が、受け取ったトークンで B にアクセスする、など）。
- **実装のポイント**: `audience` 引数を必ず渡す。PyJWT は `aud` クレームがあるのに `audience` を指定しないと例外になるが、`aud` 自体が無いトークンもあるため `require` に `aud` を含める。

```python
# ❌ NG 例: aud を検証しない
claims = jwt.decode(token, key=KEY, algorithms=["RS256"],
                    options={"verify_aud": False})

# ✅ OK 例: 自サービスの識別子で aud を検証
claims = jwt.decode(token, key=KEY, algorithms=["RS256"],
                    audience=["https://api.example.com"],
                    options={"require": ["exp", "aud"]})
```

### V9.2.4 — 発行者側: 同じ鍵で複数の宛先に発行するなら audience を付ける（L2）

- **要件（意訳）**: トークン発行者が同じ秘密鍵で異なる audience 向けのトークンを発行する場合、発行するトークンに、意図した audience を一意に識別する audience 制限が含まれていることを確認する。これにより意図しない audience でのトークン再利用を防ぐ。audience の識別子が動的にプロビジョニングされる場合、発行者はそれらの audience を検証し、audience のなりすましにつながらないようにしなければならない。
- **なぜ重要か**: V9.2.3 は受け取り側の要件ですが、そもそも発行者が `aud` を入れていなければ受け取り側は判定できません。また、誰でも好きな audience 名を登録できる仕組みだと、攻撃者が既存サービスと同じ識別子を登録して「そのサービス宛て」のトークンを入手できてしまいます。
- **実装のポイント**: 発行時に必ず `aud` を設定する。動的登録で audience を作る場合は重複や既存サービスと紛らわしい値を拒否する。

```python
# ✅ OK 例: 発行時に一意な audience を入れる
token = jwt.encode(
    {"sub": user_id, "aud": "https://billing.example.com", "exp": now + 300, "iss": ISSUER},
    PRIVATE_KEY, algorithm="ES256",
)
```

## 4. よくある脆弱性・アンチパターン

- **デコード ＝ 検証と誤解**: `jwt.decode(..., verify_signature=False)` やフロントエンド用の「デコードだけ」するライブラリをバックエンドで使う（V9.1.1）。
- **alg=none を受け入れる / `algorithms` を指定しない**: 古いライブラリや自前実装で発生しやすい（V9.1.2）。
- **RS256 と HS256 を同じ検証コードで扱う**: 公開鍵を HMAC 鍵として使われる鍵混同攻撃（V9.1.2）。
- **`jku` / `x5u` / `jwk` ヘッダを信用**: 攻撃者が用意した鍵で検証してしまう（V9.1.3）。`kid` を使ったパス・SQL インジェクションにも注意（`kid` は鍵 ID の選択に使うだけで、ファイルパスやクエリに直接埋め込まない）。
- **exp を検証しない・巨大な leeway**: 期限切れトークンが使い回せる（V9.2.1）。
- **ID トークンで API を呼べてしまう**: トークン種別を確認していない（V9.2.2）。
- **aud を検証しない**: 他サービス向けトークンの流用を許す（V9.2.3）。
- **弱い HMAC 秘密鍵**: `secret` のような短い鍵はオフライン総当たりで破られる（鍵強度は V11 も参照）。
- **自己完結型トークンに機微情報を入れる**: 署名付き JWT（JWS）は暗号化されていないので誰でも中身を読める。

## 5. 検証（テスト）のヒント

- **改ざんテスト**: ペイロードのクレーム（`sub`、`role` など）を書き換え、署名はそのままで送る → 拒否されるべき（V9.1.1）。
- **alg=none テスト**: ヘッダを `{"alg":"none"}` にし、署名部を空にしたトークンを送る（大文字小文字違いの `None`、`NONE` なども）（V9.1.2）。
- **鍵混同テスト**: RS256 の公開鍵を入手し、`alg=HS256` でその公開鍵を秘密鍵として署名したトークンを送る（V9.1.2）。
- **jku/x5u/jwk 注入**: 自分の管理する URL や埋め込み JWK を指定したトークンを送る（V9.1.3）。
- **期限テスト**: `exp` が過去、`nbf` が未来のトークン、`exp` が無いトークンを送る（V9.2.1）。
- **流用テスト**: 同じ IdP の別サービス向けトークン（`aud` 違い）、ID トークン、リフレッシュトークンを API に送る（V9.2.2, V9.2.3）。
- **ツール**: Burp Suite の JWT 系拡張（JWT Editor など）や jwt_tool を使うと、上記テストを効率的に行えます。
- **コードレビュー**: JWT ライブラリ呼び出し箇所を grep し、`algorithms`・`audience`・`verify_*` オプション・鍵の取得元を確認する。

## 6. 確認問題

**Q1.** 「自己完結型トークン」と「参照型トークン（識別子だけのトークン）」の違いを説明し、自己完結型トークンの代表例を 2 つ挙げてください。

<details><summary>答えと解説</summary>

自己完結型トークンは、受け取ったサービスがセキュリティ判断に使うデータ（クレーム）をトークン自体に含むものです。参照型トークンは識別子だけを含み、受け取り側がその識別子でローカルにデータを引きます。代表例は **JWT** と **SAML アサーション** です。自己完結型はトークン自体を信用するため、完全性と有効コンテキストの検証（V9.1, V9.2）が欠かせません。

</details>

**Q2.** 次のコードの問題点と、違反している要件 ID を答えてください。

```python
alg = jwt.get_unverified_header(token)["alg"]
claims = jwt.decode(token, key=KEY, algorithms=[alg])
```

<details><summary>答えと解説</summary>

検証アルゴリズムをトークン自身のヘッダ（攻撃者が制御可能）から決めているため、`alg=none` や鍵混同攻撃（RS256 → HS256）を許す可能性があります。**V9.1.2**（L1）は、コンテキストごとにアルゴリズムの allowlist を定め、`None` を含めないことを求めています。`algorithms=["RS256"]` のようにサーバー側で固定します。

</details>

**Q3.** JWT ヘッダに `"jku": "https://attacker.example/keys.json"` が入っていた。V9.1.3 に従う実装ならどう扱うべきですか。

<details><summary>答えと解説</summary>

`jku` の値を、事前に設定した信頼できる取得元の allowlist と照合し、一致しなければトークンを拒否します。そもそもヘッダの `jku` を使わず、発行者ごとに事前設定した JWKS URL だけから鍵を取得する実装がより安全です（**V9.1.3**、L1）。

</details>

**Q4.** 同じ IdP が「ブログサービス」と「決済サービス」向けにトークンを発行している。ブログ向けトークンが決済 API で受け入れられてしまう問題を防ぐのに関係する要件を、受け取り側と発行側それぞれ答えてください。

<details><summary>答えと解説</summary>

- 受け取り側: **V9.2.3**（L2）。決済サービスは `aud` クレームを自サービスの allowlist と照合し、自分宛てのトークンだけを受け入れる。
- 発行側: **V9.2.4**（L2）。同じ秘密鍵で複数の audience 向けに発行するなら、トークンに audience を一意に識別する制限（`aud`）を入れる。

</details>

**Q5.** 次のうち、V9.2.2 の考え方として正しいものを選んでください。
(a) 同じ発行者が署名したトークンなら、種類を問わず API の認可に使ってよい
(b) 認可判断にはアクセストークンだけを使い、ユーザー認証の証明には ID トークンだけを使う
(c) ID トークンは有効期限が短いので、API のアクセストークンとして使うのがより安全である

<details><summary>答えと解説</summary>

**(b)** です。V9.2.2（L2）は、受け取り側がトークンの種類と意図された用途を確認してから内容を受け入れることを求めており、原文の例として「認可判断にはアクセストークンのみ、ユーザー認証の証明には ID トークンのみ」が挙げられています。

</details>

## 7. 関連リソース

- OWASP Cheat Sheet: [JSON Web Token Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html)（原文の References に掲載）
- RFC: [RFC 8725 JSON Web Token Best Current Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- RFC: [RFC 9068 JWT Profile for OAuth 2.0 Access Tokens](https://datatracker.ietf.org/doc/html/rfc9068)（`at+jwt` の定義）
- 関連する章: V8（認可）、V10（OAuth と OIDC）、V11（暗号化）、V7（セッション管理）
