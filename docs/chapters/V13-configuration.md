# V13 設定（Configuration）

> 📘 原文: [0x22-V13-Configuration.md](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x22-V13-Configuration.md)
> 📊 要件数: **21**（L1: 1 / L2: 12 / L3: 8）
> ✅ 全要件のチェックリスト: [checklists/by-chapter/V13.md](../../checklists/by-chapter/V13.md)

## 1. この章の目的

V13 の大原則は「アプリケーションのデフォルト設定は、そのままインターネットで使って安全でなければならない」ということです。そのために、開発・ビルド・デプロイの各段階で必要となるさまざまな設定上の要件を扱います。

主なテーマは、意図しない情報漏えいの防止、アプリケーションを構成するコンポーネント間通信の安全な管理、そしてシークレット（パスワード・API キー・鍵など）の保護です。暗号化そのものは V11、通信の暗号化は V12 が担当し、V13 は「どう設定・管理するか」に焦点を当てています。

## 2. セクション構成

| セクション | 日本語名 | 何を扱うか（1行） | 要件数 |
| --- | --- | --- | :---: |
| V13.1 | 設定のドキュメント化 | 通信先・接続数上限・リソース管理戦略・シークレットのローテーション計画の文書化 | 4 |
| V13.2 | バックエンド通信の設定 | サービス間認証、最小権限、デフォルト認証情報の禁止、通信先の許可リスト | 6 |
| V13.3 | シークレット管理 | キーボールト／HSM の利用、アクセスの最小権限、鍵の隔離、期限とローテーション | 4 |
| V13.4 | 意図しない情報漏えい | .git の露出、デバッグモード、ディレクトリリスティング、TRACE、内部ドキュメント、バージョン情報 | 7 |

## 3. 押さえるべき重要要件

### V13.4.1 — ソース管理のメタデータをデプロイしない（L1）

- **要件（意訳）**: `.git` や `.svn` フォルダなどのソース管理メタデータを含めずにデプロイするか、それらのフォルダに外部からもアプリ自身からもアクセスできない形でデプロイすること。
- **なぜ重要か**: `https://example.com/.git/` が公開されていると、攻撃者はリポジトリ全体（過去のコミットを含む）を復元できます。ソースコードのロジック、ハードコードされたパスワード、過去に削除したはずの API キーまで漏えいします。本章で唯一の L1 要件です。
- **実装のポイント**: `git clone` したディレクトリをそのまま公開ディレクトリにしないこと。ビルド成果物（コンテナイメージ等）だけを配置し、`.dockerignore` で `.git` を除外します。念のため Web サーバでもドットファイルへのアクセスを拒否します。

```dockerfile
# ❌ NG 例: リポジトリをまるごとコピー（.git も入る）
COPY . /app

# ✅ OK 例: .dockerignore で除外したうえで必要なものだけコピー
# .dockerignore に:  .git  .svn  .env  tests/
COPY src/ /app/src/
COPY requirements.txt /app/
```

```nginx
# 多層防御: ドットで始まるパスへのアクセスを拒否
location ~ /\. { deny all; return 404; }
```

### V13.4.2 — 本番環境ではデバッグモードを無効化する（L2）

- **要件（意訳）**: デバッグ機能の露出や情報漏えいを防ぐため、本番環境ではすべてのコンポーネントのデバッグモードを無効にすること。
- **なぜ重要か**: Flask/Werkzeug のデバッガが有効だと、ブラウザ上で任意の Python コードを実行できるコンソールが開くことがあります。Django の `DEBUG=True` では、エラー時に設定値やスタックトレース、SQL などが詳細に表示されます。
- **実装のポイント**: デバッグ設定のデフォルトを「オフ」にし、開発環境でだけ明示的にオンにします（デフォルトが安全、という本章の大原則そのもの）。

```python
import os

# ❌ NG 例: デフォルトが True。環境変数を設定し忘れた本番でデバッグが有効になる
DEBUG = os.environ.get("DEBUG", "True") == "True"
app.run(debug=True)

# ✅ OK 例: デフォルトは False。開発時だけ明示的に有効化
DEBUG = os.environ.get("APP_DEBUG") == "1"
app.run(debug=DEBUG)
```

### V13.2.1 — バックエンドコンポーネント間の通信を認証する（L2）

- **要件（意訳）**: アプリケーションの通常のユーザーセッション機構をサポートしないバックエンドコンポーネント（API、ミドルウェア、データ層など）間の通信は認証されていること。認証には個別のサービスアカウント、短期間のトークン、または証明書ベースの認証を使い、パスワード・API キー・特権のある共有アカウントのような変化しない認証情報を使ってはならない。
- **なぜ重要か**: 全サービスで共通の固定パスワードや API キーを使っていると、1 か所から漏れただけで全バックエンドにアクセスされ、しかも誰が使ったのか追跡できません。
- **実装のポイント**: クラウドのワークロード ID（IAM ロール、マネージド ID）や、短期の DB 認証トークン、mTLS（V12.3.5）を活用します。

```python
# ❌ NG 例: 全サービス共通の固定 API キー
headers = {"X-Api-Key": "shared-static-key-123"}

# ✅ OK 例（概念）: サービスごとの ID で短期トークンを取得して使う
token = identity_provider.get_token(audience="orders-api")  # 数分〜1時間で失効
headers = {"Authorization": f"Bearer {token}"}
```

### V13.2.3 — デフォルトの認証情報を使わない（L2）

- **要件（意訳）**: サービス認証に認証情報を使う必要がある場合、利用側が使う認証情報がデフォルトのもの（例: root/root、admin/admin）でないこと。
- **なぜ重要か**: ミドルウェアや管理画面の初期パスワードは公開情報であり、攻撃者が最初に試すものです。
- **実装のポイント**: 構築手順にデフォルト認証情報の変更・無効化を必ず含め、構成スキャンで検出できるようにします。

### V13.2.4 / V13.2.5 — 通信先を許可リストで限定する（L2）

- **要件（意訳）**: アプリケーションが通信してよい外部リソースやシステム（外向きリクエスト、データ読み込み、ファイルアクセスなど）を許可リストで定義すること。許可リストはアプリケーション層、Web サーバ、ファイアウォール、またはその組み合わせで実装できる（V13.2.4）。Web サーバ／アプリケーションサーバも、リクエスト送信やデータ・ファイルの読み込みを行ってよい先の許可リストを持つよう設定すること（V13.2.5）。
- **なぜ重要か**: SSRF（サーバサイドリクエストフォージェリ）脆弱性があった場合でも、外向き通信先が限定されていれば、クラウドのメタデータサービス（例: `169.254.169.254`）や内部管理画面へのアクセスを防げます。
- **実装のポイント**: アプリコードでの URL チェック（V1.3.6 の SSRF 対策）に加え、ネットワーク層（egress ファイアウォール、プロキシ）でも制限する多層防御にします。

```python
from urllib.parse import urlparse

ALLOWED_HOSTS = {"api.partner.example.com", "hooks.slack.com"}

# ❌ NG 例: ユーザー指定の URL にそのままアクセス
def fetch_webhook(url):
    return requests.get(url, timeout=5)

# ✅ OK 例: 許可リストに含まれる HTTPS ホストのみ
def fetch_webhook(url):
    u = urlparse(url)
    if u.scheme != "https" or u.hostname not in ALLOWED_HOSTS:
        raise ValueError("destination not allowed")
    return requests.get(url, timeout=5, allow_redirects=False)
```

### V13.3.1 — シークレット管理ソリューションを使い、コードに埋め込まない（L2）

- **要件（意訳）**: キーボールトなどのシークレット管理ソリューションを使って、バックエンドのシークレットを安全に生成・保存・アクセス制御・破棄すること。対象には、パスワード、鍵素材、DB やサードパーティとの連携情報、時間ベーストークンの鍵やシード、その他の内部シークレット、API キーなどが含まれる。シークレットをソースコードやビルド成果物に含めてはならない。L3 アプリケーションではハードウェアベースのソリューション（HSM など）を使わなければならない。
- **なぜ重要か**: ソースコードにハードコードされたシークレットは、リポジトリへのアクセス権を持つ全員、さらに V13.4.1 のような漏えいやコンテナイメージの流出で第三者にも渡ります。Git の履歴から削除するのも困難です。
- **実装のポイント**: 実行時にボールト（AWS Secrets Manager、HashiCorp Vault、Azure Key Vault など）から取得します。アクセス権はサービスごとに必要なシークレットだけに絞ります（V13.3.2）。

```python
# ❌ NG 例: ソースコードにハードコード
DB_PASSWORD = "P@ssw0rd!"
STRIPE_KEY = "sk_live_xxxxxxxxxxxxxxxx"

# ✅ OK 例: 実行時にシークレットマネージャから取得
import boto3, json
sm = boto3.client("secretsmanager")
secret = json.loads(sm.get_secret_value(SecretId="prod/app/db")["SecretString"])
DB_PASSWORD = secret["password"]
```

### V13.4.4 / V13.4.5 — TRACE メソッドや内部ドキュメント・監視エンドポイントを公開しない（L2）

- **要件（意訳）**: 本番環境で HTTP TRACE メソッドをサポートしないこと（V13.4.4）。内部 API のドキュメントや監視エンドポイントは、明示的に意図した場合を除き公開しないこと（V13.4.5）。
- **なぜ重要か**: Swagger UI や `/actuator`、`/metrics`、`/debug/pprof` などが公開されていると、攻撃者は内部 API の一覧や環境変数・ヒープダンプなどを入手できます。
- **実装のポイント**: 管理系エンドポイントは別ポート・内部ネットワークのみにバインドするか、認証を必須にします。

```python
from fastapi import FastAPI

# ❌ NG 例: 本番でも /docs, /redoc, /openapi.json が公開される
app = FastAPI()

# ✅ OK 例: 本番ではドキュメントを無効化
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None) if IS_PROD else FastAPI()
```

### V13.1.3 / V13.2.6 — 外部リソースのタイムアウト・リトライ戦略を定め、守る（L3）

- **要件（意訳）**: 利用するすべての外部システムやサービス（DB、ファイルハンドル、スレッド、HTTP 接続など）について、リソース解放手順、タイムアウト設定、障害時の扱い、リトライを実装する場合はその回数上限・待機時間・バックオフアルゴリズムを文書化すること。同期的な HTTP リクエスト／レスポンス処理では、短いタイムアウトを必須とし、リトライは無効化するか厳しく制限すること（V13.1.3）。そして実装が、最大並列接続数、上限到達時の挙動、接続タイムアウト、リトライ戦略など、接続ごとに文書化された設定に従っていること（V13.2.6）。
- **なぜ重要か**: タイムアウトなしの外部呼び出しや無制限のリトライは、依存先の遅延が連鎖してスレッドや接続プールを使い果たし、サービス全体の停止（自己 DoS）につながります。
- **実装のポイント**: 文書で決めた値をコードに反映し、ずれがないことをレビューで確認します。

```python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ❌ NG 例: タイムアウトなし（応答が来るまで永遠に待つ）
requests.get("https://slow.partner.example.com/api")

# ✅ OK 例: 短いタイムアウト + 回数制限付き指数バックオフ（文書化した値に合わせる）
s = requests.Session()
s.mount("https://", HTTPAdapter(max_retries=Retry(total=2, backoff_factor=0.5),
                                pool_maxsize=10))
s.get("https://slow.partner.example.com/api", timeout=(3, 5))
```

## 4. よくある脆弱性・アンチパターン

- **`.git` の公開**: ドキュメントルートで `git pull` してデプロイしている（V13.4.1）。
- **`.env` や設定ファイルの公開**: Web サーバがあらゆる拡張子のファイルを配信してしまい、`.env`、`config.yml.bak`、`.php~` などが読める（V13.4.7）。
- **本番でのデバッグモード**: `DEBUG=True`、Flask の `debug=True`、Spring Boot Actuator の全公開（V13.4.2, V13.4.5）。
- **ディレクトリリスティング**: nginx の `autoindex on`、Apache の `Options +Indexes`（V13.4.3）。
- **詳細なバージョン情報の露出**: `Server: Apache/2.4.41 (Ubuntu)`、`X-Powered-By: PHP/7.4.3` などのヘッダ（V13.4.6）。ただし原文が述べるとおり、バージョンを隠してもパッチ適用が不要になるわけではありません。
- **シークレットのハードコード**: ソースコード、Dockerfile の `ENV`、CI ログ、フロントエンドのバンドルに API キーが入っている（V13.3.1）。
- **共有の特権アカウント**: 全マイクロサービスが DB の `root` / `postgres` ユーザーで接続している（V13.2.1, V13.2.2）。
- **デフォルト認証情報の放置**: 管理コンソールやメッセージブローカの初期パスワード（V13.2.3）。
- **外向き通信が無制限**: アプリサーバからインターネット・内部ネットワークの任意の宛先に接続できる（V13.2.4, V13.2.5）。
- **シークレットのローテーションなし**: 何年も同じ API キーを使い続けている（V13.1.4, V13.3.4）。

## 5. 検証（テスト）のヒント

- **情報漏えいの確認**: 以下のようなパスにアクセスし、内容が返らないことを確認します。
  ```bash
  for p in /.git/HEAD /.svn/entries /.env /swagger-ui.html /docs /openapi.json \
           /actuator /actuator/env /metrics /server-status /debug/pprof/; do
    printf "%s %s\n" "$(curl -s -o /dev/null -w '%{http_code}' https://example.com$p)" "$p"
  done
  ```
- **TRACE メソッド**: `curl -X TRACE -i https://example.com/` が 405 などで拒否されることを確認します（V13.4.4）。
- **レスポンスヘッダ**: `Server`、`X-Powered-By`、`X-AspNet-Version` などに詳細なバージョンが含まれていないかを確認します（V13.4.6）。
- **デバッグモード**: 存在しないパスや不正な入力でエラーを起こし、スタックトレースやデバッガ画面が出ないことを確認します（V13.4.2）。
- **シークレットスキャン**: gitleaks、trufflehog などでリポジトリ履歴とコンテナイメージをスキャンします（V13.3.1）。
- **設定レビュー**: DB・キャッシュ・キューの接続ユーザーと権限、デフォルトパスワードの有無、egress ファイアウォールのルールを確認します（V13.2.x）。
- **ドキュメントとの突き合わせ（L2/L3）**: 通信要件（V13.1.1）、接続上限やタイムアウト（V13.1.2, V13.1.3）、シークレットとローテーション計画（V13.1.4）が文書化されているか、そして実装・運用がそれに従っているか（V13.2.6, V13.3.4）を照合します。

## 6. 確認問題

**Q1.** V13 で唯一の L1 要件は何ですか。要件 ID と内容を答えてください。

<details><summary>答えと解説</summary>

V13.4.1。`.git` や `.svn` などのソース管理メタデータを含めずにデプロイするか、それらに外部からもアプリ自身からもアクセスできないようにすることです。露出するとリポジトリ全体（履歴を含む）が復元され、ソースコードやシークレットが漏えいします。

</details>

**Q2.** 次のうち、V13.2.1 がバックエンドコンポーネント間の認証方法として「使ってはならない」としているものをすべて選んでください。
(a) 個別のサービスアカウント (b) 変化しないパスワード (c) 短期間のトークン (d) 特権のある共有アカウント (e) 証明書ベースの認証

<details><summary>答えと解説</summary>

(b) と (d)。V13.2.1（L2）は、個別のサービスアカウント・短期間のトークン・証明書ベースの認証を使い、パスワード・API キー・特権のある共有アカウントのような変化しない認証情報を使ってはならないとしています。

</details>

**Q3.** V13.3.1 において、L2 と L3 で求められるシークレット管理の違いは何ですか。

<details><summary>答えと解説</summary>

L2 ではキーボールトなどのシークレット管理ソリューションでシークレットを生成・保存・アクセス制御・破棄し、ソースコードやビルド成果物に含めないことが求められます。L3 ではさらに HSM のようなハードウェアベースのソリューションを使わなければなりません。また L3 では V13.3.3 により、すべての暗号処理を隔離されたセキュリティモジュール内で行うことも求められます。

</details>

**Q4.** 「サーバのバージョン情報を隠したので、そのサーバへのパッチ適用は急がなくてよい」という意見について、原文の立場から反論してください。関連する要件 ID も挙げてください。

<details><summary>答えと解説</summary>

原文の V13.4 の解説は、バックエンドコンポーネントのバージョンを隠しても全コンポーネントにパッチを当てる必要性はなくならず、攻撃のハードルを上げるにすぎないと明記しています。関連要件は V13.4.6（L3: バックエンドコンポーネントの詳細なバージョン情報を露出しない）。パッチ適用については V15.2.1（文書化した更新期限を超過したコンポーネントを含まない）が求めています。

</details>

**Q5.** 同期的な HTTP リクエスト／レスポンス処理のタイムアウトとリトライについて、V13.1.3 はどのような方針を文書で定めるよう求めていますか。

<details><summary>答えと解説</summary>

短いタイムアウトを必須とし、リトライは無効にするか厳しく制限すること。これにより遅延の連鎖やリソース枯渇を防ぎます（V13.1.3, L3）。さらに V13.2.6（L3）で、実際の接続がその文書化された設定に従っていることが求められます。

</details>

## 7. 関連リソース

- OWASP Cheat Sheet: [Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Server Side Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
- OWASP WSTG: [Configuration and Deployment Management Testing](https://owasp.org/www-project-web-security-testing-guide/stable/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing)
- 関連する章: V1（SSRF 対策 V1.3.6）、V11（暗号化・鍵管理）、V12（安全な通信）、V15（依存関係・不要機能の除去）、V16（エラー処理）
