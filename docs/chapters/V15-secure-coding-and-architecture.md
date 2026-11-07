# V15 セキュアコーディングとアーキテクチャ（Secure Coding and Architecture）

> 📘 原文: [0x24-V15-Secure-Coding-and-Architecture.md](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x24-V15-Secure-Coding-and-Architecture.md)
> 📊 要件数: **21**（L1: 3 / L2: 10 / L3: 8）
> ✅ 全要件のチェックリスト: [checklists/by-chapter/V15.md](../../checklists/by-chapter/V15.md)

## 1. この章の目的

ASVS の多くの要件は、認証・認可のような特定のセキュリティ領域や、ログ・ファイル処理のような特定の機能に紐づいています。V15 はそれらに当てはまらない、アプリケーションを設計・開発する際に全般的に考慮すべきセキュリティ要件をまとめた章です。

焦点は、クリーンなアーキテクチャやコード品質そのものだけでなく、アプリケーションセキュリティのために必要な具体的なアーキテクチャ・コーディングの実践にあります。具体的には、サードパーティ依存関係の管理（SBOM、更新期限、依存関係かく乱攻撃）、危険な機能の隔離、マスアサインメント・型ジャグリング・プロトタイプ汚染・HTTP パラメータ汚染といった言語やフレームワーク特有の脆弱性、そして競合状態（レースコンディション）などの並行処理の安全性を扱います。

## 2. セクション構成

| セクション | 日本語名 | 何を扱うか（1行） | 要件数 |
| --- | --- | --- | :---: |
| V15.1 | セキュアコーディングとアーキテクチャのドキュメント化 | 脆弱性対応期限、SBOM、高負荷機能、「リスクのあるコンポーネント」「危険な機能」の文書化 | 5 |
| V15.2 | セキュリティアーキテクチャと依存関係 | 期限内の更新、可用性の防御、不要機能の除去、依存関係かく乱対策、隔離 | 5 |
| V15.3 | 防御的コーディング | 必要なフィールドのみ返す、リダイレクト追従、マスアサインメント、元 IP、型ジャグリング、プロトタイプ汚染、HPP | 7 |
| V15.4 | 安全な並行処理 | スレッドセーフ、TOCTOU、ロックの一貫性、スレッド飢餓の防止 | 4 |

原文の用語定義（V15.1）:

- **危険な機能（dangerous functionality）**: 信頼できないデータのデシリアライズ、生のファイルやバイナリデータのパース、動的コード実行、直接的なメモリ操作などを行うコンポーネント（自社開発・サードパーティを問わない）。
- **リスクのあるコンポーネント（risky component）**: 開発プロセスや機能面のセキュリティ管理が欠けている、または不十分なサードパーティライブラリ。保守が不十分、サポート切れ、EOL、重大な脆弱性の履歴があるものなど。

## 3. 押さえるべき重要要件

### V15.1.1 / V15.2.1 — 脆弱な依存関係の対応期限を決め、守る（L1）

- **要件（意訳）**: 脆弱性のあるサードパーティコンポーネントのバージョンについて、またライブラリ全般の更新について、リスクに基づいた対応期限をアプリケーションのドキュメントで定めること（V15.1.1）。そしてアプリケーションには、文書化された更新・修正期限を超過していないコンポーネントだけが含まれていること（V15.2.1）。
- **なぜ重要か**: 既知脆弱性のあるライブラリ（例: Log4Shell の影響を受ける Log4j）は、公開されたエクスプロイトでそのまま攻撃されます。「いつまでに直すか」が決まっていないと、対応は後回しになりがちです。
- **実装のポイント**: 例えば「Critical は 7 日以内、High は 30 日以内」のように深刻度ごとの期限を決め、`pip-audit` や Dependabot などで継続的に検出し、期限超過をビルドで検知します。

```bash
# ✅ OK 例: CI で既知脆弱性を検出してビルドを失敗させる
pip-audit -r requirements.txt --strict
npm audit --audit-level=high
```

### V15.3.1 — データオブジェクトの必要なフィールドだけを返す（L1）

- **要件（意訳）**: アプリケーションはデータオブジェクトのうち必要なフィールドのサブセットだけを返すこと。例えば、一部のフィールドはユーザーにアクセスさせるべきではないため、データオブジェクト全体を返してはならない。
- **なぜ重要か**: ORM のモデルをそのまま JSON にすると、パスワードハッシュ、内部フラグ、他ユーザーのメールアドレスなどが API レスポンスに含まれてしまいます。画面に表示されなくても、開発者ツールで丸見えです。
- **実装のポイント**: レスポンス用のスキーマ（DTO）を明示的に定義し、許可したフィールドだけをシリアライズします。

```python
from pydantic import BaseModel

# ❌ NG 例: モデルの全属性をそのまま返す（password_hash, is_admin なども含まれる）
@app.get("/users/{uid}")
def get_user(uid: int):
    return db.get(User, uid).__dict__

# ✅ OK 例: 返すフィールドをスキーマで限定
class UserOut(BaseModel):
    id: int
    display_name: str

@app.get("/users/{uid}", response_model=UserOut)
def get_user(uid: int):
    return db.get(User, uid)
```

### V15.3.3 — マスアサインメントを防ぐ（L2）

- **要件（意訳）**: コントローラやアクションごとに許可するフィールドを制限し、そのアクションで意図していないフィールド値を挿入・更新できないようにすることで、マスアサインメント攻撃への対策を講じること。
- **なぜ重要か**: プロフィール更新 API がリクエストボディをそのままモデルに反映すると、攻撃者が `{"name": "x", "is_admin": true}` を送るだけで管理者になれます。
- **実装のポイント**: 入力用スキーマで更新可能なフィールドだけを定義し、未定義のフィールドは拒否（または無視）します。

```python
from pydantic import BaseModel, ConfigDict

# ❌ NG 例: リクエストの全キーをモデルに代入
@app.patch("/me")
def update_me(body: dict):
    for k, v in body.items():
        setattr(current_user, k, v)    # is_admin, balance なども書き換え可能

# ✅ OK 例: このアクションで更新してよいフィールドだけを許可
class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")   # 想定外のフィールドはエラー
    display_name: str | None = None
    bio: str | None = None

@app.patch("/me")
def update_me(body: ProfileUpdate):
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(current_user, k, v)
```

### V15.3.2 — 外部 URL 呼び出しでリダイレクトを追従しない（L2）

- **要件（意訳）**: アプリケーションのバックエンドが外部 URL を呼び出す場合、意図した機能でない限りリダイレクトを追従しないよう設定すること。
- **なぜ重要か**: 許可リストで外部ホストをチェックしても、そのホストが `302 Location: http://169.254.169.254/...` を返せば、内部やクラウドメタデータへのリクエストに誘導されます（SSRF の回避手口）。

```python
# ❌ NG 例: requests はデフォルトでリダイレクトを追従する
requests.get(validated_url, timeout=5)

# ✅ OK 例
requests.get(validated_url, timeout=5, allow_redirects=False)
```

### V15.3.4 — 元のクライアント IP を信頼できる方法で扱う（L2）

- **要件（意訳）**: すべてのプロキシやミドルウェアが、エンドユーザーが改ざんできない信頼できるデータフィールドを使ってユーザーの元の IP アドレスを正しく転送し、アプリケーションと Web サーバがその正しい値をログやレート制限などのセキュリティ判断に使うこと。ただし、動的 IP・VPN・企業のファイアウォールなどにより、元の IP アドレスでさえ信頼できない場合があることを考慮すること。
- **なぜ重要か**: `X-Forwarded-For` をそのまま信じると、攻撃者はヘッダを書き換えるだけでレート制限や IP 制限を回避し、ログに偽の IP を残せます。
- **実装のポイント**: 信頼するプロキシの段数を固定し、その段数分だけ右側から値を採用します。

```python
# ❌ NG 例: クライアントが送った X-Forwarded-For の先頭をそのまま信用
client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0]

# ✅ OK 例（Flask）: 前段のリバースプロキシ 1 段だけを信頼する
from werkzeug.middleware.proxy_fix import ProxyFix
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1)
client_ip = request.remote_addr
```

### V15.3.5 / V15.3.6 — 型ジャグリングとプロトタイプ汚染を防ぐ（L2）

- **要件（意訳）**: 変数が正しい型であることを明示的に確認し、厳密な等価・比較演算を使うこと。コードが変数の型を仮定することによる型ジャグリングや型の混同の脆弱性を避けるため（V15.3.5）。JavaScript のコードは、例えばオブジェクトリテラルの代わりに `Set()` や `Map()` を使うなどして、プロトタイプ汚染を防ぐように書くこと（V15.3.6）。
- **なぜ重要か**: JSON で `{"token": true}` や `{"pin": ["1234"]}` のように想定外の型を送られると、緩い比較で認証チェックをすり抜けることがあります。JavaScript では `{"__proto__": {"isAdmin": true}}` のようなキーでオブジェクトのプロトタイプが汚染され、全オブジェクトの挙動が変わります。

```javascript
// ❌ NG 例: 緩い比較と、ユーザー入力キーでのオブジェクトへの代入
if (req.body.pin == storedPin) { /* ... */ }
const prefs = {};
for (const [k, v] of Object.entries(input)) prefs[k] = v;   // "__proto__" が来ると危険

// ✅ OK 例: 型を確認して厳密比較、キー・値ストアには Map を使う
if (typeof req.body.pin === "string" && req.body.pin === storedPin) { /* ... */ }
const prefs = new Map();
for (const [k, v] of Object.entries(input)) prefs.set(k, v);
```

```python
# Python でも型の確認は重要（例: リストや dict が来ることを想定していない）
# ❌ NG 例
if body["code"] in valid_codes: ...        # body["code"] がリストや dict でも動いてしまう
# ✅ OK 例
code = body.get("code")
if not isinstance(code, str):
    abort(400)
if hmac.compare_digest(code, expected_code): ...
```

### V15.4.2 — チェックと操作をアトミックに行う（TOCTOU 対策）（L3）

- **要件（意訳）**: リソースの状態（存在や権限など）のチェックと、それに依存する操作を単一のアトミックな操作として実行し、TOCTOU（time-of-check to time-of-use）競合状態を防ぐこと。例えば、ファイルが存在するか確認してから開く処理や、ユーザーのアクセス権を確認してから付与する処理。
- **なぜ重要か**: 「残高を確認 → 引き落とし」を別々に行うと、同時リクエストで残高以上に引き出せます。「ファイルが存在しないことを確認 → 作成」の間に、攻撃者がシンボリックリンクを置くこともできます。

```python
# ❌ NG 例: チェックと更新が分かれている（同時実行で二重に引き落とされる）
acct = db.query(Account).get(aid)
if acct.balance >= amount:
    acct.balance -= amount
    db.commit()

# ✅ OK 例: 条件付き UPDATE で 1 つのアトミックな操作にする
result = db.execute(
    text("UPDATE accounts SET balance = balance - :amt "
         "WHERE id = :id AND balance >= :amt"),
    {"amt": amount, "id": aid},
)
if result.rowcount != 1:
    raise InsufficientFunds()
db.commit()
```

```python
import os
# ❌ NG 例
if not os.path.exists(path):
    f = open(path, "w")
# ✅ OK 例: 作成と存在チェックを OS にアトミックに行わせる
fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
```

## 4. よくある脆弱性・アンチパターン

- **依存関係の放置**: 脆弱性アラートが何か月も未対応、EOL のフレームワークを使い続けている（V15.1.1, V15.2.1）。
- **SBOM がない**: 新しい脆弱性が公表されたとき、自社のどのアプリが影響を受けるか即答できない（V15.1.2）。
- **依存関係かく乱（dependency confusion）**: 社内パッケージ名と同名のパッケージが公開リポジトリに登録され、ビルドがそちらを取得してしまう（V15.2.4）。
- **本番に残ったテスト・サンプルコード**: `/test`、`/sample`、デバッグ用エンドポイント、シードデータ投入 API（V15.2.3）。
- **重い処理への無防備**: レポート生成や画像変換を同期処理し、少数のリクエストでサーバが応答不能になる（V15.1.3, V15.2.2）。
- **危険な機能を隔離せずに実行**: 信頼できないファイルのパーサや変換ツールを、メインアプリと同じ権限・ネットワークで実行する（V15.1.5, V15.2.5）。
- **ORM オブジェクトの丸ごと返却・丸ごと更新**（V15.3.1, V15.3.3）。
- **`X-Forwarded-For` の無条件な信頼**（V15.3.4）。
- **緩い比較（`==`）による認証回避**（V15.3.5）。
- **`obj[userKey] = value` やディープマージによるプロトタイプ汚染**（V15.3.6）。
- **同名パラメータの解釈の不一致（HTTP パラメータ汚染）**: `?role=user&role=admin` を WAF は先頭、アプリは末尾で解釈する。クエリ・ボディ・Cookie を区別しないフレームワーク（V15.3.7）。
- **共有オブジェクトへの非同期アクセス**: マルチスレッドで dict のキャッシュを無保護で更新する（V15.4.1）。

## 5. 検証（テスト）のヒント

- **依存関係スキャン**: `pip-audit`、`npm audit`、OWASP Dependency-Check、OWASP Dependency-Track などで既知脆弱性と更新状況を確認し、文書化した期限と比較します（V15.1.1, V15.2.1）。CycloneDX 形式などで SBOM を生成できるか確認します（V15.1.2）。
- **パッケージ取得元**: `pip.conf` / `.npmrc` / ロックファイルを確認し、すべての依存（推移的依存を含む）が想定したリポジトリから取得されているか、社内パッケージ名がスコープや固定インデックスで保護されているかを確認します（V15.2.4）。
- **API レスポンスの比較**: 画面の表示項目とレスポンスの JSON を比較し、余分なフィールドがないか確認します（V15.3.1）。
- **マスアサインメント**: 更新 API に `is_admin`、`role`、`owner_id`、`balance` などのフィールドを追加して送信し、反映されないことを確認します（V15.3.3）。
- **型のファジング**: 文字列を期待するパラメータに `true`、`0`、`[]`、`{}`、`null` を送って挙動を見ます（V15.3.5）。
- **プロトタイプ汚染**: JSON ボディやクエリに `__proto__[x]=1`、`constructor[prototype][x]=1` を送ります（V15.3.6）。
- **HTTP パラメータ汚染**: 同名パラメータを複数回、またはクエリとボディの両方に送り、どの値が採用されるかを確認します（V15.3.7）。
- **IP 偽装**: `X-Forwarded-For: 1.2.3.4` を付けてリクエストし、ログやレート制限の判定に使われないことを確認します（V15.3.4）。
- **競合状態**: 同じリクエスト（クーポン適用、送金、いいね）を並列で大量送信し、二重処理が起きないか確認します。Burp Suite の Repeater の並列送信や、Python の `asyncio` / `ThreadPoolExecutor` で再現できます（V15.4.x）。

## 6. 確認問題

**Q1.** V15.1 で定義されている「危険な機能（dangerous functionality）」の例を 2 つ以上挙げてください。また、L3 で求められるそれへの追加防御策（V15.2.5）の例も答えてください。

<details><summary>答えと解説</summary>

例: 信頼できないデータのデシリアライズ、生のファイル／バイナリデータのパース、動的コード実行、直接的なメモリ操作。V15.1.5（L3）でこれらの箇所を文書で明示し、V15.2.5（L3）でサンドボックス化、カプセル化、コンテナ化、ネットワークレベルの隔離などの追加防御を行い、一部が侵害されても他へ横展開されにくくします。

</details>

**Q2.** 次のコードの問題点と、対応する要件 ID を答えてください。

```python
@app.post("/users/me")
def update(body: dict):
    current_user.update(**body)
```

<details><summary>答えと解説</summary>

リクエストボディの全キーをそのままモデルに反映しているため、`is_admin` や `role` などの本来更新させるべきでないフィールドを攻撃者が書き換えられます（マスアサインメント）。V15.3.3（L2）に該当します。アクションごとに更新可能なフィールドを限定したスキーマを使うべきです。

</details>

**Q3.** 外部 URL の許可リストチェックをしているにもかかわらず SSRF が成立するケースとして、V15.3.2 が防ごうとしているのはどのような状況ですか。

<details><summary>答えと解説</summary>

許可されたホストがリダイレクト（例: `302 Location: http://169.254.169.254/`）を返し、バックエンドがそれを自動的に追従してしまう状況です。V15.3.2（L2）は、意図した機能でない限りリダイレクトを追従しないよう設定することを求めています。

</details>

**Q4.** JavaScript でプロトタイプ汚染を防ぐ方法として、V15.3.6 が例示しているものは何ですか。

<details><summary>答えと解説</summary>

オブジェクトリテラルの代わりに `Set()` や `Map()` を使うことです（V15.3.6, L2）。ユーザー入力をキーとして通常のオブジェクトに代入すると `__proto__` などの特殊なキーでプロトタイプが汚染されるおそれがあります。

</details>

**Q5.** 「ファイルが存在するか確認してから開く」処理にはどのような問題があり、どの要件で扱われていますか。レベルも答えてください。

<details><summary>答えと解説</summary>

チェックと操作の間に状態が変わりうる TOCTOU（time-of-check to time-of-use）競合状態の問題があります。V15.4.2（L3）で、リソースの状態チェックとそれに依存する操作を単一のアトミックな操作として行うことが求められています。Python なら `os.open(path, O_CREAT | O_EXCL)` のように OS にアトミックに処理させる、DB なら条件付き UPDATE を使うなどの方法があります。

</details>

## 7. 関連リソース

- OWASP Cheat Sheet: [Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Prototype Pollution Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Prototype_Pollution_Prevention_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Vulnerable Dependency Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Vulnerable_Dependency_Management_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Deserialization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Denial of Service Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- OWASP: [CycloneDX Bill of Materials Specification](https://owasp.org/www-project-cyclonedx/)
- OWASP WSTG: [Testing for HTTP Parameter Pollution](https://owasp.org/www-project-web-security-testing-guide/stable/4-Web_Application_Security_Testing/07-Input_Validation_Testing/04-Testing_for_HTTP_Parameter_Pollution)
- 関連する章: V1（安全なデシリアライズ）、V2（ビジネスロジック・アンチオートメーション）、V8（フィールドレベルの認可 V8.2.3）、V13（設定・許可リスト）、V14（最小限のデータ返却）
