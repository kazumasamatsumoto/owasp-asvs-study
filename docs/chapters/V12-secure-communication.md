# V12 安全な通信（Secure Communication）

> 📘 原文: [0x21-V12-Secure-Communication.md](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x21-V12-Secure-Communication.md)
> 📊 要件数: **12**（L1: 3 / L2: 6 / L3: 3）
> ✅ 全要件のチェックリスト: [checklists/by-chapter/V12.md](../../checklists/by-chapter/V12.md)

## 1. この章の目的

V12 は「転送中のデータ（data in transit）」を守るための章です。対象はエンドユーザーのクライアントとバックエンドの間の通信だけでなく、内部サービス同士・バックエンドサービス同士の通信も含みます。

原文が掲げる基本方針は次の 3 つです。

- 外部向けの通信は必ず暗号化し、理想的には内部通信も暗号化する。
- 暗号化の仕組みは最新のガイダンス（推奨アルゴリズム・暗号スイート）に従って設定する。
- 署名された証明書を使い、通信が第三者に傍受されていないことを保証する。

暗号強度の詳細な技術情報は、ASVS の付録 C（Cryptography Standards）にまとめられています。また原文は、ワイルドカード証明書自体は本質的に危険ではないものの、本番・ステージング・開発・テストなど全環境で同じ証明書を使い回すと、1 か所の漏えいが全環境に波及しうるため、可能なら環境ごとに別の証明書を使うよう勧めています。

## 2. セクション構成

| セクション | 日本語名 | 何を扱うか（1行） | 要件数 |
| --- | --- | --- | :---: |
| V12.1 | TLS の一般的なセキュリティガイダンス | TLS バージョン・暗号スイート・mTLS・失効確認・ECH | 5 |
| V12.2 | 外部公開サービスとの HTTPS 通信 | 外部向け HTTP サービスの TLS 必須化と公的に信頼された証明書 | 2 |
| V12.3 | サービス間通信の一般的なセキュリティ | DB・ミドルウェア・内部 API など HTTP 以外も含むサービス間通信の暗号化と認証 | 5 |

## 3. 押さえるべき重要要件

### V12.1.1 — 最新の推奨 TLS バージョンのみ有効にする（L1）

- **要件（意訳）**: TLS 1.2 や TLS 1.3 のような、最新の推奨バージョンの TLS プロトコルだけを有効にすること。最新バージョンの TLS を優先的に使う設定にすること。
- **なぜ重要か**: SSL 3.0 / TLS 1.0 / TLS 1.1 などの古いプロトコルには既知の弱点があります。古いバージョンを有効にしたままだと、攻撃者がダウングレードを誘発して弱いプロトコルで通信させ、盗聴や改ざんを試みる余地が生まれます。
- **実装のポイント**: Web サーバ／ロードバランサ／アプリのいずれで TLS を終端していても、最小バージョンを明示的に指定します。Mozilla の SSL Configuration Generator の推奨設定を出発点にすると安全です。

```python
import ssl

# ❌ NG 例: 古いプロトコルを許してしまう（最小バージョン未指定 / 明示的に TLS1.0 を許可）
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.minimum_version = ssl.TLSVersion.TLSv1

# ✅ OK 例: TLS 1.2 以上のみ。TLS 1.3 が使えれば優先される
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.minimum_version = ssl.TLSVersion.TLSv1_2
ctx.load_cert_chain("server.crt", "server.key")
```

```nginx
# nginx の例
ssl_protocols TLSv1.2 TLSv1.3;
```

### V12.1.2 — 推奨暗号スイートのみ有効にし、最強のものを優先する（L2）

- **要件（意訳）**: 推奨される暗号スイートだけを有効にし、最も強いものを優先するよう設定すること。L3 のアプリケーションは前方秘匿性（forward secrecy）を提供する暗号スイートのみをサポートしなければならない。
- **なぜ重要か**: TLS 1.2 でも、RC4・3DES・NULL 暗号・EXPORT 暗号など弱い暗号スイートが有効だと、プロトコルバージョンを絞った意味が薄れます。前方秘匿性がないと、将来サーバの秘密鍵が漏えいしたときに、過去に記録された通信まで復号されるおそれがあります。
- **実装のポイント**: ECDHE ベースの鍵交換と AEAD 暗号（AES-GCM、ChaCha20-Poly1305）を中心に構成します。具体的な許可リストは付録 C や Mozilla の推奨設定を参照し、定期的に見直します。

```python
# ❌ NG 例: 何でも許す
ctx.set_ciphers("ALL")

# ✅ OK 例: ECDHE（前方秘匿性あり）+ AEAD に限定（TLS 1.2 向けの指定。TLS 1.3 のスイートは別管理）
ctx.set_ciphers("ECDHE+AESGCM:ECDHE+CHACHA20")
```

### V12.2.1 — 外部向け HTTP サービスは常に TLS、平文へフォールバックしない（L1）

- **要件（意訳）**: クライアントと外部公開の HTTP ベースのサービスとの間のすべての接続で TLS を使い、安全でない通信や暗号化されていない通信にフォールバックしないこと。
- **なぜ重要か**: 一部のページだけ HTTP のまま、あるいは HTTPS 失敗時に HTTP で再試行する、といった実装があると、公衆 Wi-Fi などでセッション Cookie や認証情報が盗聴・改ざんされます。
- **実装のポイント**: ブラウザ向けの画面では HTTP アクセスを HTTPS にリダイレクトし、HSTS（`Strict-Transport-Security`、V3.4.1）でブラウザに HTTPS を強制させます。なお API など人がブラウザで直接開かないエンドポイントは、透過的なリダイレクトをしない（平文で送られたリクエストを受け付けない）ことが V4.1.2 で求められています。クライアント側コードで「HTTPS がダメなら HTTP」というフォールバックを書かないこと。

```python
import requests

# ❌ NG 例: TLS 失敗時に平文 HTTP へフォールバック
def fetch(path):
    try:
        return requests.get(f"https://api.example.com{path}", timeout=5)
    except requests.exceptions.SSLError:
        return requests.get(f"http://api.example.com{path}", timeout=5)

# ✅ OK 例: HTTPS のみ。失敗したらエラーとして扱う
def fetch(path):
    return requests.get(f"https://api.example.com{path}", timeout=5)
```

### V12.2.2 — 外部向けサービスには公的に信頼された証明書を使う（L1）

- **要件（意訳）**: 外部公開サービスは、公的に信頼された TLS 証明書を使用すること。
- **なぜ重要か**: 自己署名証明書を外部公開すると、利用者は警告を無視して接続することに慣れてしまい、中間者攻撃（MITM）用の偽証明書と区別できなくなります。
- **実装のポイント**: 公的 CA（Let's Encrypt など）から証明書を取得し、自動更新を仕組み化して期限切れを防ぎます。

### V12.3.1 — すべての入出力接続で暗号化プロトコルを使う（L2）

- **要件（意訳）**: 監視システム、管理ツール、リモートアクセスや SSH、ミドルウェア、データベース、メインフレーム、パートナーシステム、外部 API など、アプリケーションに出入りするすべての接続で TLS などの暗号化プロトコルを使うこと。サーバは安全でない／暗号化されていないプロトコルにフォールバックしてはならない。
- **なぜ重要か**: 「内部ネットワークだから平文で良い」という前提は、攻撃者がネットワーク内に足場を得た時点で崩れます。DB 接続が平文だと、認証情報やクエリ結果がそのまま盗聴されます。
- **実装のポイント**: DB ドライバや各種クライアントで TLS を「必須」モードにします（「可能なら TLS」では不十分）。

```python
import psycopg2

# ❌ NG 例: sslmode=prefer は TLS が使えなければ平文で接続してしまう
conn = psycopg2.connect("host=db.internal dbname=app user=app sslmode=prefer")

# ✅ OK 例: TLS 必須 + サーバ証明書とホスト名を検証
conn = psycopg2.connect(
    "host=db.internal dbname=app user=app "
    "sslmode=verify-full sslrootcert=/etc/ssl/internal-ca.pem"
)
```

### V12.3.2 — TLS クライアントは証明書を検証する（L2）

- **要件（意訳）**: TLS クライアントは、TLS サーバと通信する前に、受け取った証明書を検証すること。
- **なぜ重要か**: 証明書検証を無効にした TLS は、暗号化されていても「誰と話しているか」が保証されません。攻撃者が自分の証明書で割り込めば、通信内容をすべて読み書きできます。開発時の `verify=False` が本番に残る事故は非常によくあります。
- **実装のポイント**: 検証を無効化するオプションを使わないこと。社内 CA を使う場合は、その CA を信頼ストアとして明示的に指定します（V12.3.4）。

```python
import requests

# ❌ NG 例: 証明書検証を無効化
requests.get("https://internal-api.example.local/items", verify=False)

# ✅ OK 例: 社内 CA のみを信頼して検証する
requests.get(
    "https://internal-api.example.local/items",
    verify="/etc/ssl/internal-ca.pem",
    timeout=5,
)
```

### V12.3.4 — 内部サービス間でも信頼された証明書を使う（L2）

- **要件（意訳）**: 内部サービス間の TLS 接続でも信頼された証明書を使うこと。内部で生成した証明書や自己署名証明書を使う場合、利用側サービスは特定の内部 CA と特定の自己署名証明書だけを信頼するよう設定しなければならない。
- **なぜ重要か**: 「内部だから何でも信頼する」設定にすると、内部ネットワークに侵入した攻撃者が任意の証明書でなりすませます。
- **実装のポイント**: OS 全体の信頼ストアに社内 CA を追加するより、接続ごとに信頼する CA バンドルを限定する方が影響範囲を小さくできます。

### V12.3.5 — サービス間通信で強力な相互認証を行う（L3）

- **要件（意訳）**: システム内部で通信するサービス同士は、各エンドポイントが検証されるよう強力な認証を使うこと。公開鍵基盤（PKI）を使い、リプレイ攻撃に耐性のある TLS クライアント認証（mTLS）などの方式を用いなければならない。マイクロサービスでは、証明書管理を簡素化するためにサービスメッシュの利用も検討する。
- **なぜ重要か**: サーバ証明書の検証だけでは「接続してきたクライアントが誰か」は分かりません。侵害された 1 つのサービスや攻撃者のプロセスが、他の内部 API を自由に呼び出せてしまいます。
- **実装のポイント**: mTLS でクライアント証明書を要求し、さらに V12.1.3 にあるとおり、その証明書が信頼されたものであることを検証してから、証明書のアイデンティティを認証・認可に使います。

```python
import ssl

# ✅ OK 例: サーバ側で mTLS を必須化（信頼できる内部 CA が発行したクライアント証明書のみ受け入れ）
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.minimum_version = ssl.TLSVersion.TLSv1_2
ctx.load_cert_chain("svc.crt", "svc.key")
ctx.load_verify_locations("/etc/ssl/internal-ca.pem")
ctx.verify_mode = ssl.CERT_REQUIRED   # クライアント証明書がなければハンドシェイク失敗
```

## 4. よくある脆弱性・アンチパターン

- **証明書検証の無効化**: `verify=False`、`ssl._create_unverified_context()`、Node.js の `NODE_TLS_REJECT_UNAUTHORIZED=0`、`rejectUnauthorized: false` などが本番コードに残っている（V12.3.2）。
- **「可能なら TLS」設定**: DB の `sslmode=prefer`、メールの STARTTLS 失敗時の平文送信など、TLS が使えないと平文にフォールバックする設定（V12.2.1, V12.3.1）。
- **古いプロトコル・弱い暗号スイートの残存**: 互換性のために TLS 1.0/1.1 や CBC 系・3DES が有効なまま（V12.1.1, V12.1.2）。
- **内部通信は平文**: ロードバランサで TLS を終端した後、アプリサーバや DB までは HTTP / 平文（V12.3.1, V12.3.3）。
- **全環境で同じワイルドカード証明書**: 開発環境から秘密鍵が漏れると本番もなりすまされる（V12.1 の解説文）。
- **外部公開サービスに自己署名証明書**: 利用者が証明書警告を無視する習慣を作る（V12.2.2）。
- **mTLS のクライアント証明書を検証せずに信頼**: ヘッダで渡された証明書情報やサブジェクト名を、チェーン検証なしで認証に使う（V12.1.3）。

## 5. 検証（テスト）のヒント

- **TLS 設定スキャン**: `testssl.sh`、`sslyze`、`nmap --script ssl-enum-ciphers`、OWASP O-Saft などで、有効なプロトコル・暗号スイート・前方秘匿性・OCSP Stapling の有無を確認します。原文も「最新のツールで継続的に TLS 設定をレビューすべき」としています。
  ```bash
  testssl.sh https://www.example.com
  nmap --script ssl-enum-ciphers -p 443 www.example.com
  ```
- **フォールバック確認**: `http://` でアクセスしたときに平文でコンテンツが返らないか、HTTPS へリダイレクトされるか、HSTS ヘッダがあるかを確認します。
- **コードレビュー**: `verify=False`、`CERT_NONE`、`check_hostname = False`、`rejectUnauthorized`、`InsecureSkipVerify`（Go）などの文字列を grep します。
- **内部通信の棚卸し**: DB・キャッシュ・メッセージキュー・監視エージェント・SSH・管理画面などの接続設定を一覧化し、それぞれが TLS 必須か、証明書を検証しているかを確認します（V13.1.1 の通信要件ドキュメントと突き合わせると効率的です）。
- **中間者テスト**: テスト環境で mitmproxy などの自己署名証明書を挟み、クライアントが接続を拒否するかを確認します。拒否しなければ証明書検証が機能していません。
- **mTLS**: クライアント証明書なし、別 CA 発行の証明書、期限切れ証明書で接続を試み、すべて拒否されることを確認します。

## 6. 確認問題

**Q1.** V12.1.1 で有効化が想定されている TLS のバージョンとして、原文が例示しているものを 2 つ挙げてください。また、どちらを優先すべきですか。

<details><summary>答えと解説</summary>

TLS 1.2 と TLS 1.3。最新バージョン（TLS 1.3）を優先的な選択肢にする必要があります（V12.1.1, L1）。古いバージョンを残すとダウングレード攻撃の余地が生まれます。

</details>

**Q2.** PostgreSQL への接続で `sslmode=prefer` を使っています。どの要件の観点で問題がありますか。

<details><summary>答えと解説</summary>

`prefer` は TLS が使えない場合に平文接続へフォールバックするため、「暗号化されていないプロトコルにフォールバックしてはならない」とする V12.3.1（L2）に反します。さらにサーバ証明書の検証も行わないため V12.3.2（L2）の観点でも不十分です。`verify-full` などで TLS 必須かつ証明書・ホスト名検証を行うべきです。

</details>

**Q3.** 次のうち、L3 アプリケーションに対して V12.1.2 が追加で求めていることはどれですか。
(a) TLS 1.3 のみをサポートする (b) 前方秘匿性を提供する暗号スイートのみをサポートする (c) EV 証明書を使う

<details><summary>答えと解説</summary>

(b)。V12.1.2（L2）は推奨暗号スイートのみを有効にし最強のものを優先することを求め、L3 では前方秘匿性（forward secrecy）を提供する暗号スイートのみをサポートしなければならないとしています。

</details>

**Q4.** 社内 API が自己署名証明書を使っています。呼び出し側で `verify=False` にする以外に、どう対処すべきですか。該当する要件 ID も答えてください。

<details><summary>答えと解説</summary>

呼び出し側で、その特定の内部 CA（または特定の自己署名証明書）だけを信頼するよう設定し、証明書検証を有効にしたまま接続します（例: `requests.get(url, verify="/etc/ssl/internal-ca.pem")`）。V12.3.4（L2）は内部生成・自己署名証明書を使う場合に特定の内部 CA と特定の自己署名証明書のみを信頼することを求め、V12.3.2（L2）は TLS クライアントが証明書を検証することを求めています。

</details>

**Q5.** Encrypted Client Hello（ECH）を有効にすると何が守られますか。また、その要件のレベルは何ですか。

<details><summary>答えと解説</summary>

TLS ハンドシェイク中に露出する Server Name Indication（SNI）などの機微なメタデータの露出を防ぎます。V12.1.5 で、レベルは L3 です。

</details>

## 7. 関連リソース

- OWASP Cheat Sheet: [Transport Layer Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html)
- OWASP Cheat Sheet: [HTTP Strict Transport Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Microservices Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Microservices_Security_Cheat_Sheet.html)
- Mozilla: [Server Side TLS](https://wiki.mozilla.org/Security/Server_Side_TLS) / [SSL Configuration Generator](https://ssl-config.mozilla.org/)
- OWASP: [O-Saft（TLS 設定検証ツール）](https://owasp.org/www-project-o-saft/)
- 関連する章: V11（暗号化）、V13（設定: バックエンド通信の認証・最小権限）、V3（Web フロントエンド: HSTS など）、V17（WebRTC: DTLS）
