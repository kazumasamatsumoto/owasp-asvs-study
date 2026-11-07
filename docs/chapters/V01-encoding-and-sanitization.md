# V1 エンコーディングとサニタイズ（Encoding and Sanitization）

> 📘 原文: [0x10-V1-Encoding-and-Sanitization.md](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x10-V1-Encoding-and-Sanitization.md)
> 📊 要件数: **30**（L1: 8 / L2: 19 / L3: 3）
> ✅ 全要件のチェックリスト: [checklists/by-chapter/V1.md](../../checklists/by-chapter/V1.md)

## 1. この章の目的

この章は、Web アプリケーションで最もよく見られる弱点である「信頼できないデータの安全でない処理」を扱います。信頼できないデータが SQL・HTML・シェルなどのインタプリタの構文として解釈されてしまうと、SQL インジェクションや XSS などの技術的な脆弱性が生まれます。

現代の Web アプリでは、パラメータ化クエリ、自動エスケープ、テンプレートフレームワークといった「より安全な API」を使うのが常に最善です。それができない場合は、注意深く行う出力エンコーディング・エスケープ・サニタイズがアプリのセキュリティを左右します。

なお、入力検証（バリデーション）は多層防御として役立ちますが、その主目的は「入力が業務・機能上の期待に合っているか」を確かめることなので、関連要件は V2「検証とビジネスロジック」にまとめられています。

## 2. セクション構成

| セクション | 日本語名 | 何を扱うか（1行） | 要件数 |
| --- | --- | --- | :---: |
| V1.1 | エンコーディングとサニタイズのアーキテクチャ | デコード・エンコードを「いつ・どこで」行うかの順序 | 2 |
| V1.2 | インジェクション防止 | 文脈に応じた出力エンコーディングとパラメータ化（SQL・OS コマンド・LDAP など） | 10 |
| V1.3 | サニタイズ | HTML・SVG・テンプレート・SSRF・ReDoS など、エンコードできない場面での無害化 | 12 |
| V1.4 | メモリ・文字列・アンマネージドコード | バッファオーバーフロー、整数オーバーフロー、解放後使用 | 3 |
| V1.5 | 安全なデシリアライズ | XXE、安全でないデシリアライズ、パーサ間の解釈差 | 3 |

ポイントは「エンコーディング（意味を保ったまま安全な形に変換）が理想、できないときにサニタイズ（危険な部分を除去）」という優先順位です。原文 V1.3 の冒頭でもこの順序が明示されています。

## 3. 押さえるべき重要要件

### V1.2.4 — データベースクエリのパラメータ化（L1）

- **要件（意訳）**: データ選択やデータベースクエリ（SQL、HQL、NoSQL、Cypher など）は、パラメータ化クエリ、ORM、エンティティフレームワークを使うか、その他の方法で SQL インジェクションや他のデータベースインジェクションから保護されていること。ストアドプロシージャを書く場合にも当てはまる。
- **なぜ重要か**: `' OR '1'='1` のような入力でクエリの構造が書き換えられ、認証回避・全件取得・データ改ざんにつながります。
- **実装のポイント**: 文字列連結でクエリを作らず、プレースホルダを使います。原文の注記にあるとおり、テーブル名・カラム名（`ORDER BY` のカラム名を含む）はパラメータ化もエスケープもできないので、許可リストで選ばせます。

```python
# ❌ NG 例: 文字列連結 / ORDER BY にユーザー入力を直接
cur.execute(f"SELECT * FROM users WHERE name = '{name}' ORDER BY {sort}")

# ✅ OK 例: 値はプレースホルダ、カラム名は許可リスト
ALLOWED_SORT = {"name", "created_at"}
sort_col = sort if sort in ALLOWED_SORT else "created_at"
cur.execute(f"SELECT * FROM users WHERE name = %s ORDER BY {sort_col}", (name,))
```

### V1.2.1 — 文脈に応じた出力エンコーディング（L1）

- **要件（意訳）**: HTTP レスポンス、HTML 文書、XML 文書の出力エンコーディングは、必要な文脈（HTML 要素、HTML 属性、HTML コメント、CSS、HTTP ヘッダフィールドなど）に合ったものであり、メッセージや文書の構造を変えてしまわないこと。
- **なぜ重要か**: HTML 本文用のエスケープを JavaScript 文字列や属性値の中で使っても防げないケースがあり、XSS の原因になります。
- **実装のポイント**: 自動エスケープが有効なテンプレートエンジン（Jinja2 の `autoescape=True` など）を使い、`|safe` や `Markup()` で無効化しないこと。

```python
# ❌ NG 例: 文字列連結で HTML を組み立てる
html = "<p>こんにちは " + username + "</p>"

# ✅ OK 例: 自動エスケープ付きテンプレート
from jinja2 import Environment, select_autoescape
env = Environment(autoescape=select_autoescape(["html", "xml"]))
html = env.from_string("<p>こんにちは {{ name }}</p>").render(name=username)
```

### V1.2.2 — URL 構築時のエンコードと安全なスキーム（L1）

- **要件（意訳）**: URL を動的に組み立てるとき、信頼できないデータは文脈に応じてエンコード（クエリやパスのパラメータには URL エンコードや base64url エンコード）すること。また安全な URL プロトコルのみを許可すること（例: `javascript:` や `data:` を禁止）。
- **なぜ重要か**: `<a href="{{ url }}">` に `javascript:alert(1)` が入ると、HTML エスケープしていてもクリックでスクリプトが実行されます。
- **実装のポイント**: パラメータは `urllib.parse.quote` / `urlencode` でエンコードし、ユーザー由来の URL はスキームを `http` / `https` に限定します。

```python
from urllib.parse import urlparse, quote

# ❌ NG 例: スキームを確認せずリンクに使う
link = user_supplied_url

# ✅ OK 例: スキームの許可リスト + パス部分のエンコード
def safe_link(url: str) -> str:
    if urlparse(url).scheme not in ("http", "https"):
        raise ValueError("unsupported scheme")
    return url

profile_url = "/users/" + quote(username, safe="")
```

### V1.2.5 — OS コマンドインジェクション対策（L1）

- **要件（意訳）**: アプリケーションが OS コマンドインジェクションから保護されており、OS 呼び出しはパラメータ化された OS クエリを使うか、文脈に応じたコマンドラインのエンコーディングを使うこと。
- **なぜ重要か**: `file.txt; rm -rf /` のような入力でシェルが任意のコマンドを実行します。
- **実装のポイント**: `shell=True` を避け、引数をリストで渡します。ファイル名がオプションとして解釈されないよう `--` も有効です。

```python
import subprocess

# ❌ NG 例
subprocess.run(f"convert {filename} out.png", shell=True)

# ✅ OK 例: 引数リスト（シェルを介さない）
subprocess.run(["convert", "--", filename, "out.png"], check=True)
```

### V1.3.1 — WYSIWYG などの HTML 入力のサニタイズ（L1）

- **要件（意訳）**: WYSIWYG エディタなどから来る信頼できない HTML 入力はすべて、よく知られた安全な HTML サニタイズライブラリまたはフレームワークの機能を使ってサニタイズすること。
- **なぜ重要か**: リッチテキストは HTML のまま表示するためエスケープできません。自作の正規表現フィルタは `<img src=x onerror=...>` などの回避手法で簡単に突破されます。
- **実装のポイント**: Python なら `nh3`（Rust 製 ammonia のバインディング）など、ブラウザ側なら原文の参考資料にある DOMPurify のような実績あるライブラリを使い、許可タグ・属性を最小限にします。

```python
# ❌ NG 例: 自作の除去
clean = raw_html.replace("<script>", "")

# ✅ OK 例: 実績あるサニタイザ + 許可タグを限定
import nh3
clean = nh3.clean(raw_html, tags={"p", "b", "i", "a", "ul", "li"})
```

### V1.3.6 — SSRF 対策（L2）

- **要件（意訳）**: サーバーサイドリクエストフォージェリ（SSRF）から保護するため、信頼できないデータをプロトコル・ドメイン・パス・ポートの許可リストで検証し、別のサービスを呼び出す前に危険な文字をサニタイズすること。
- **なぜ重要か**: 「URL から画像を取り込む」機能に `http://169.254.169.254/` などを指定され、クラウドのメタデータや社内サービスにアクセスされます。
- **実装のポイント**: 拒否リスト（`localhost` を弾くなど）ではなく、許可リストで判定します。

```python
from urllib.parse import urlparse
import requests

ALLOWED_HOSTS = {"images.example-cdn.com"}

# ❌ NG 例: ユーザー指定 URL をそのまま取得
requests.get(user_url)

# ✅ OK 例: スキーム・ホスト・ポートを許可リストで検証し、リダイレクトも追わない
u = urlparse(user_url)
if u.scheme != "https" or u.hostname not in ALLOWED_HOSTS or u.port not in (None, 443):
    raise ValueError("URL not allowed")
requests.get(user_url, timeout=5, allow_redirects=False)
```

### V1.5.1 / V1.5.2 — XXE と安全でないデシリアライズ（L1 / L2）

- **要件（意訳）**:
  - V1.5.1（L1）: XML パーサを制限的な設定にし、外部エンティティの解決などの危険な機能を無効化して XXE 攻撃を防ぐこと。
  - V1.5.2（L2）: 信頼できないデータのデシリアライズでは、オブジェクト型の許可リストやクライアント指定の型の制限など、安全な入力処理を強制すること。明示的に安全でないと定義されているデシリアライズ機構は、信頼できない入力に対して使ってはならない。
- **なぜ重要か**: XXE ではサーバー上のファイル読み出しや SSRF が、安全でないデシリアライズではリモートコード実行が起こり得ます。
- **実装のポイント**: Python の `pickle` はドキュメントで信頼できないデータに使うべきでないと明記されています。XML は `defusedxml` を使うのが手軽です。

```python
# ❌ NG 例
import pickle
obj = pickle.loads(request.data)          # 任意コード実行の危険
import xml.etree.ElementTree as ET        # 標準ライブラリの XML パーサは悪意ある XML への耐性が不十分

# ✅ OK 例
import json
obj = json.loads(request.data)            # データのみを扱う形式に
from defusedxml.ElementTree import fromstring
root = fromstring(xml_bytes)              # 外部エンティティ等を拒否
```

### V1.1.1 / V1.1.2 — デコードは一度だけ・エンコードは最後に（L2）

- **要件（意訳）**:
  - V1.1.1: 入力は正規形へのデコード（アンエスケープ）を一度だけ行い、その形式でエンコードされたデータが想定される場合にのみデコードし、それ以降の処理の前に行うこと（例: 入力検証やサニタイズの後に行わない）。
  - V1.1.2: 出力エンコーディング・エスケープは、対象インタプリタで使われる直前の最終段階で行うか、インタプリタ自身に任せること。
- **なぜ重要か**: 検証の後にもう一度 URL デコードすると、`%252e%252e%252f`（二重エンコードされた `../`）が検証をすり抜けます。逆に保存時に HTML エスケープしておくと、別の出力先（JSON・CSV など）で二重エンコードや不適切なエンコードが起きます。原文 V1.1 も、データは元の状態で保存し、エンコード済みの形で保存しないよう求めています。
- **実装のポイント**: 「受け取ったらすぐ一度だけデコード → 検証 → 元の形で保存 → 出力直前に出力先の文脈でエンコード」という流れを守ります。

```python
from urllib.parse import unquote

# ❌ NG 例: 検証後に再デコード
if ".." not in path:
    path = unquote(path)   # ここで ../ が復活する

# ✅ OK 例: 先に一度だけデコードしてから検証
path = unquote(raw_path)
if ".." in path:
    raise ValueError("invalid path")
```

## 4. よくある脆弱性・アンチパターン

- **f-string / 文字列連結での SQL 組み立て**（V1.2.4）。ORM を使っていても `raw()` や `text()` で連結すれば同じことです。
- **`ORDER BY` やテーブル名にユーザー入力をそのまま入れる**。プレースホルダは使えないので許可リストが必要です（V1.2.4 の注記）。
- **テンプレートの自動エスケープを `|safe` / `Markup()` / `dangerouslySetInnerHTML` で無効化**（V1.2.1）。
- **`href` に任意 URL を許す**ことで `javascript:` スキームが通る（V1.2.2）。
- **`<script>` 内に JSON を埋め込む際のエスケープ漏れ**。`</script>` を含む値で script 要素から抜け出されます（V1.2.3）。
- **`subprocess` の `shell=True`、`os.system`**（V1.2.5）。
- **`eval()` / `exec()` で式や設定を評価する**（V1.3.2）。
- **ユーザー入力から Jinja2 テンプレート自体を組み立てる**（`Template(user_input)`）ことによるサーバーサイドテンプレートインジェクション（V1.3.7）。
- **ユーザーアップロードの SVG をそのまま同一オリジンで配信**し、SVG 内の `<script>` や `foreignObject` が実行される（V1.3.4）。
- **`re.compile(user_input)`** でメタ文字がそのまま解釈される（V1.2.9。`re.escape()` を使う）、または `(a+)+$` のような指数的バックトラックを起こす正規表現（V1.3.12, L3）。
- **CSV エクスポートで `=` `+` `-` `@` などから始まる値を無加工で出力**し、表計算ソフトで数式として実行される（V1.2.10, L3）。
- **`pickle` / `yaml.load`（非 safe ローダ）で外部データを読み込む**（V1.5.2）。
- **XML パーサのデフォルト設定任せ**で外部エンティティを解決してしまう（V1.5.1）。
- **URL の検証と実際のリクエストで別のパーサを使う**ため、解釈差を突かれて SSRF 対策を回避される（V1.5.3, L3）。

## 5. 検証（テスト）のヒント

- **コードレビューで grep する箇所**: `execute(f"`, `+ "' "`, `shell=True`, `os.system`, `eval(`, `exec(`, `pickle.loads`, `yaml.load(`, `|safe`, `Markup(`, `innerHTML`, `Template(`, `re.compile(` に変数が渡っている箇所、`requests.get(` に外部入力が渡っている箇所。
- **SAST ツール**: Python なら Bandit や Semgrep のルールで上記パターンの多くを自動検出できます。
- **DAST / 手動テスト**: OWASP ZAP や Burp Suite で、各入力欄に `'`, `"`, `<script>`, `{{7*7}}`, `; id`, `../` などを入れて応答の変化を見ます。`{{7*7}}` が `49` と表示されればテンプレートインジェクションの疑いがあります。
- **SSRF**: URL を受け付ける機能に `http://127.0.0.1:port/`、`http://169.254.169.254/`、リダイレクトを返す外部 URL などを与えて、内部への到達やリダイレクト追従が起きないか確認します。
- **XXE**: XML を受け付けるエンドポイントに `<!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]>` を含む文書を送り、エラーや応答に内容が出ないかを見ます（検証環境で実施）。
- **出力の文脈ごとの確認**: 同じ値が HTML 本文・属性・`<script>` 内・URL・HTTP ヘッダのどこに出るかを洗い出し、それぞれに正しいエンコードがあるか表にして確認すると漏れが減ります。
- **CSV エクスポート**: `=1+1` や `@SUM(1+1)` を含むデータを登録してエクスポートし、表計算ソフトで開いたときに数式として評価されないか確認します。

## 6. 確認問題

**Q1.** 次のうち、パラメータ化クエリ（プレースホルダ）だけでは安全にできず、許可リストなどの別の対策が必要なのはどれか。
(a) `WHERE` 句の値 (b) `INSERT` する値 (c) `ORDER BY` のカラム名 (d) `LIMIT` の数値

<details><summary>答えと解説</summary>

**(c)**。原文 V1.2 の注記のとおり、テーブル名やカラム名（`ORDER BY` のカラム名を含む）はエスケープもパラメータ化もできません。ユーザーには選択肢の識別子だけを選ばせ、サーバー側で許可リストと照合します（V1.2.4）。

</details>

**Q2.** 「入力受付時に HTML エスケープしてから DB に保存しておけば、出力時に何もしなくてよい」という設計の問題点を、V1.1 の要件 ID を挙げて説明せよ。

<details><summary>答えと解説</summary>

V1.1.2 は、出力エンコーディングを対象インタプリタで使われる直前の最終段階で行う（またはインタプリタに任せる）ことを求めています。保存時に HTML エスケープすると、JSON や CSV、JavaScript 文脈など別の出力先では不適切・不十分なエンコードになり、二重エンコードも起きます。V1.1 の導入文も、データはエンコードせず元の状態で保存するよう求めています。

</details>

**Q3.** 次のコードの問題点と、対応する要件 ID を答えよ。
```python
subprocess.run("ping -c 1 " + host, shell=True)
```

<details><summary>答えと解説</summary>

`host` に `8.8.8.8; cat /etc/passwd` のような値が入るとシェルが任意のコマンドを実行する、OS コマンドインジェクションです。V1.2.5（L1）に該当します。`subprocess.run(["ping", "-c", "1", host])` のように引数をリストで渡し、シェルを介さないようにします（あわせて `host` を IP アドレスやホスト名の形式で検証するとよりよい）。

</details>

**Q4.** SSRF 対策として「`localhost` と `127.0.0.1` を含む URL を拒否する」実装は十分か。V1.3.6 の文言に照らして答えよ。

<details><summary>答えと解説</summary>

不十分です。V1.3.6 は、プロトコル・ドメイン・パス・ポートの **許可リスト** で検証することを求めています。拒否リストでは `0.0.0.0`、IPv6 表記、10 進表記の IP、内部 DNS 名、クラウドのメタデータアドレスなど回避手段が多数あります。接続先は許可リストで限定し、リダイレクトの自動追従にも注意します。

</details>

**Q5.** CSV エクスポート機能について、V1.2.10 が求めていることを 2 点挙げよ。また、この要件のレベルはいくつか。

<details><summary>答えと解説</summary>

レベルは **L3** です。
1. CSV を出力する際に RFC 4180 の 2.6 節・2.7 節のエスケープ規則（フィールドのダブルクォート囲みや、ダブルクォートの二重化など）に従うこと。
2. CSV や他の表計算形式（XLS、XLSX、ODF など）に出力する際、フィールド値の先頭文字が `=`, `+`, `-`, `@`, タブ, ヌル文字などの特殊文字であれば、シングルクォートでエスケープすること（CSV / 数式インジェクション対策）。

</details>

## 7. 関連リソース

- OWASP Cheat Sheet: [Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- OWASP Cheat Sheet: [DOM based XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html)
- OWASP Cheat Sheet: [SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Query Parameterization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Query_Parameterization_Cheat_Sheet.html)
- OWASP Cheat Sheet: [OS Command Injection Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html)
- OWASP Cheat Sheet: [LDAP Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/LDAP_Injection_Prevention_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Server Side Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- OWASP Cheat Sheet: [XML External Entity Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Deserialization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html)
- [DOMPurify](https://github.com/cure53/DOMPurify)（原文の参考資料に掲載されているクライアントサイド HTML サニタイザ）
- [RFC 4180 - CSV ファイルの形式](https://datatracker.ietf.org/doc/html/rfc4180#section-2)
- 関連する章: [V2 検証とビジネスロジック](V02-validation-and-business-logic.md)（入力検証）、[V3 Web フロントエンドセキュリティ](V03-web-frontend-security.md)（CSP・DOM 上の安全な描画）、[V5 ファイル処理](V05-file-handling.md)
