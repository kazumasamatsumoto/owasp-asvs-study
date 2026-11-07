# V1 エンコーディングとサニタイズ — L1 要件を開発の観点で読む

> 対象: L1 要件 8 件 ／ 章の解説: [../chapters/V01-encoding-and-sanitization.md](../chapters/V01-encoding-and-sanitization.md)

## この章の要件を一言でいうと

「外から来た文字列を、別の“解釈系”（HTML、URL、JavaScript、SQL、シェル、XML パーサなど）に渡すコードを書くとき」の話です。
バグの本質はどれも同じで、**データとして渡したつもりの文字列が、解釈系にとっての構文（タグ、クォート、`;`、`<!ENTITY>` など）として読まれてしまう**ことです。
対策の優先順位も共通しています。まず「データと構文を分けて渡せる安全な API」（自動エスケープするテンプレート、パラメータ化クエリ、引数配列でのプロセス起動）を使い、それができない場所だけ文脈に合ったエンコード／サニタイズを手で行います。
レビューでは「安全な API を迂回している箇所」を grep で探すのが最も効率的です。ハンズオンは [lab01（SQLi）](../../labs/lab01_sql_injection/) と [lab02（出力エンコード）](../../labs/lab02_output_encoding/) を参照してください。

## 要件ごとの読み解き

### V1.2.1 出力先の文脈に合ったエンコード `L1`

> **原文**: Verify that output encoding for an HTTP response, HTML document, or XML document is relevant for the context required, such as encoding the relevant characters for HTML elements, HTML attributes, HTML comments, CSS, or HTTP header fields, to avoid changing the message or document structure.

**ひとことで**: ユーザー由来の値を HTML や HTTP ヘッダに埋め込むときは、埋め込む「場所」に応じた正しいエスケープをすること。

**開発の現場で言うと**: 商品名やユーザー名を画面に出す、検索語を「◯◯ の検索結果」と表示する、ダウンロード時にファイル名を `Content-Disposition` ヘッダに入れる、ユーザーが選んだテーマ色を `style` 属性に入れる、といった場面です。
Django / Rails（ERB）/ Jinja2 / Thymeleaf / React の JSX などは **HTML 要素の中身とクォートされた属性値** については既定で自動エスケープします。ここは「デフォルトで守られる部分」です。
一方、崩れやすいのは次のような箇所です。
- 自動エスケープを明示的に外す API（`|safe`、`mark_safe`、`html_safe`、`raw`、`th:utext`、`dangerouslySetInnerHTML`、`v-html`）
- クォートされていない属性値、`<style>` や `style` 属性の中（CSS 文脈）、HTML コメントの中
- HTTP ヘッダ値（改行 `\r\n` が入ると別のヘッダやボディを注入できる）。多くの HTTP ライブラリは改行入りのヘッダ値を拒否しますが、自前でレスポンスを組み立てる場合は保証されません
- テンプレートを使わず文字列連結で HTML / XML を作っているコード（メール本文、PDF 生成用 HTML、XML エクスポートなど）

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | 「HTML はテンプレートエンジン経由でしか生成しない」「自動エスケープを無効にしない」をチームのルールにする。HTML メールや帳票など、画面以外で HTML / XML を作る箇所も洗い出す |
| 実装 | 属性値は必ずクォートで囲む。CSS 文脈にユーザー値を入れる場合は値を許可リスト（例: `#[0-9a-f]{6}`）で検証してから入れる。ヘッダ値は改行を含まないことを確認するか、`Content-Disposition` なら RFC 6266 / 5987 形式（`filename*=UTF-8''...`）でエンコードする |
| レビュー | `mark_safe`、`\|safe`、`html_safe`、`raw(`、`<%==`、`th:utext`、`dangerouslySetInnerHTML`、`v-html`、`{% autoescape off %}`、文字列連結や f-string で `<` を含む文字列を作る箇所を grep し、入る値の出所を確認する |
| テスト | 表示箇所に `"><img src=x onerror=alert(1)>`、`' onmouseover='alert(1)`、`</style><script>alert(1)</script>`、`--><script>alert(1)</script>` を入れ、ソース上でエスケープされ構造が変わっていないことを確認。ヘッダに入る値には `a%0d%0aSet-Cookie:%20x=1` を入れ、レスポンスヘッダが増えないことを確認 |

**誤解しやすいポイント**: 「テンプレートエンジンを使っているから XSS は起きない」は半分しか正しくありません。自動エスケープは基本的に **HTML 文脈用** です。`<script>` 内、`style` 内、`href` 内（V1.2.2）、ヘッダには別のルールが必要で、テンプレートエンジンはそれを自動判別しないことが多いです。また「保存時に HTML エスケープしておく」は二重エンコードや他の出力先（JSON、CSV）での破損を招くので、エンコードは **出力の直前** で行います。

---

### V1.2.2 URL の組み立てとスキーム制限 `L1`

> **原文**: Verify that when dynamically building URLs, untrusted data is encoded according to its context (e.g., URL encoding or base64url encoding for query or path parameters). Ensure that only safe URL protocols are permitted (e.g., disallow javascript: or data:).

**ひとことで**: URL にユーザー値を差し込むときは URL エンコードし、ユーザーが URL 全体を指定できる場合は `http:` / `https:` など安全なスキームだけ許可すること。

**開発の現場で言うと**: 2 つの場面があります。
1. **URL の一部に値を入れる**: 「`/users/{name}/profile` へのリンクを作る」「外部 API に `?q=検索語` を付けて呼ぶ」。`&` や `#`、`/`、`..` が入るとパラメータや経路が変わります。
2. **URL 全体をユーザーが決める**: プロフィールの「Web サイト」欄、Markdown のリンク、ログイン後の `return_to`。ここに `javascript:alert(1)` が入ると、HTML エスケープは正しくてもクリックでスクリプトが動きます。

フレームワークのルーティングヘルパ（Django の `reverse()`、Rails の `*_path`、Spring の `UriComponentsBuilder`、`URLSearchParams`）はパラメータをエンコードしてくれるので「デフォルトで守られる部分」です。**スキームの制限はほぼどのフレームワークもやってくれない**ので、開発者が自分で書く必要があります（React はバージョンによって `javascript:` URL に警告などを出しますが、それに依存すべきではありません）。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | ユーザーが URL を入力できる項目を一覧化し、許可するスキーム（通常 `https:`、必要なら `http:`、`mailto:`）を決める |
| 実装 | URL は文字列連結せず URL ビルダで組み立てる。ユーザー指定 URL は URL パーサでパースしてからスキームを許可リストで比較する（文字列の前方一致ではなく、パース結果の `protocol` / `scheme` を見る） |
| レビュー | `href={`、`:href=`、`href="{{`、`window.location =`、`location.href =`、`window.open(`、`redirect_to params[`、テンプレートリテラルで URL を組み立てている箇所（`` `${base}/${userInput}` ``）を grep |
| テスト | URL 欄に `javascript:alert(1)`、`JaVaScRiPt:alert(1)`、`  javascript:alert(1)`（先頭空白）、`java&#09;script:alert(1)`、`data:text/html,<script>alert(1)</script>` を入れ、保存拒否またはリンク無効化されること。パス／クエリに入る値に `a&admin=1`、`../`、`#x` を入れ、生成 URL がエンコードされていること |

**誤解しやすいポイント**: 「HTML エスケープしているから `href` も安全」は誤りです。`javascript:alert(1)` にはエスケープ対象の文字が 1 つもありません。また `if (!url.startsWith("javascript:"))` のような拒否リストは、大文字小文字や空白・制御文字で簡単に回避されます。**許可リスト + パーサ** が原則です。

```js
function safeHref(input) {
  try {
    const u = new URL(input);           // 相対 URL を許すなら第2引数に基準 URL
    return ["https:", "http:"].includes(u.protocol) ? u.href : null;
  } catch { return null; }
}
```

---

### V1.2.3 JavaScript / JSON を動的に組み立てるときのエンコード `L1`

> **原文**: Verify that output encoding or escaping is used when dynamically building JavaScript content (including JSON), to avoid changing the message or document structure (to avoid JavaScript and JSON injection).

**ひとことで**: JavaScript コードや JSON を文字列連結で作らず、適切なエンコーダを通すこと。

**開発の現場で言うと**: サーバーサイドのテンプレートで初期データを `<script>var user = "{{ name }}";</script>` のように埋め込む、JSON API のレスポンスを文字列連結で作る、`onclick="doSomething('{{ id }}')"` のようにイベントハンドラ属性に値を入れる、といった場面です。
`JSON.stringify` / `json.dumps` / Jackson / `to_json` を使えば JSON の構造自体は壊れません（デフォルトで守られる部分）。しかし **その JSON を HTML の `<script>` 内に埋め込む** と話が変わり、値に `</script>` が含まれるとスクリプトブロックが終了してしまいます。`JSON.stringify` は `<` をエスケープしません。Django の `json_script` フィルタのように HTML 埋め込み向けに `<` `>` `&` をエスケープしてくれる仕組みもあるので、使っているフレームワークの専用機能を確認してください。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | サーバーからフロントへのデータ受け渡しは「API で JSON を返す」か「`<script type="application/json">` や `data-*` 属性に入れてから読み出す」方式に統一し、インライン JS にデータを直接埋め込まない |
| 実装 | JSON は必ずシリアライザで生成する。HTML 内に埋め込む場合は `<`, `>`, `&`, U+2028/U+2029 をエスケープできる関数（Django `json_script` など）を使う。イベントハンドラ属性への値埋め込みはやめ、`addEventListener` と `data-*` 属性で渡す |
| レビュー | `<script>` 内のテンプレート展開（`{{`、`<%=`、`${`）、`'{"' +` や `"{\"" +` のような JSON の手組み、`onclick="...{{`、`json.dumps(...)\|safe`、`JSON.stringify(...)` を `innerHTML` や `<script>` 内へ出している箇所 |
| テスト | 埋め込まれる値に `</script><script>alert(1)</script>`、`";alert(1);//`、` `、`{"role":"admin"}` 的な文字列（`","role":"admin`）を入れ、スクリプトが実行されないこと、JSON のキーが増えていないことを確認 |

**誤解しやすいポイント**: 「JSON はシリアライザで作っているから安全」は、JSON を **単独のレスポンスとして返す** 場合の話です。HTML の中に入れた瞬間に HTML パーサの規則（`</script>` でブロック終了）が先に適用されます。また HTML エスケープ（`&quot;` 化）は `<script>` 内では効きません。

```html
<!-- NG: name に </script> が入ると壊れる -->
<script>const user = {{ user_json|safe }};</script>
<!-- OK (Django): <script id="user-data" type="application/json"> を安全に生成 -->
{{ user|json_script:"user-data" }}
<script>const user = JSON.parse(document.getElementById("user-data").textContent);</script>
```

---

### V1.2.4 パラメータ化クエリによる DB インジェクション対策 `L1`

> **原文**: Verify that data selection or database queries (e.g., SQL, HQL, NoSQL, Cypher) use parameterized queries, ORMs, entity frameworks, or are otherwise protected from SQL Injection and other database injection attacks. This is also relevant when writing stored procedures.

**ひとことで**: DB へのクエリは値をプレースホルダで渡し、SQL 文字列にユーザー値を連結しないこと（NoSQL や グラフ DB、ストアドプロシージャも同じ）。

**開発の現場で言うと**: 一覧画面の検索・絞り込み・並び替え、管理画面のレポート、MongoDB の `find` に リクエスト JSON をそのまま渡す箇所、ストアドプロシージャ内で動的 SQL（`EXEC`/`EXECUTE IMMEDIATE`）を組む箇所です。
ORM の標準的な API（Django の `filter()`、Rails の `where(name: x)`、JPA の名前付きパラメータ、Prisma の通常クエリ）は値をバインドするので「デフォルトで守られる部分」です。崩れるのは次の場所です。
- ORM の「生 SQL」逃げ道: Django `raw()` / `extra()` / `RawSQL` / `cursor.execute(f"...")`、Rails `where("name = '#{x}'")` / `find_by_sql` / `order(params[:sort])`、Sequelize `sequelize.query` に文字列連結、Prisma `$queryRawUnsafe`、JPA で JPQL を文字列連結
- **プレースホルダにできない部分**: テーブル名、カラム名、`ORDER BY` の列名や `ASC/DESC`、`LIMIT` を構文として埋める場合。原文の注記にあるとおり、ここはエスケープしても守れません
- NoSQL: MongoDB で `{"password": {"$ne": null}}` のように **演算子を含むオブジェクト** を受け取ってしまう（オペレータインジェクション）、`$where` に文字列を渡す

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | 並び替え・絞り込み項目は「受け付けるキーの許可リスト → 実際のカラム名」の対応表で設計する（例: `sort=price` → `products.unit_price`）。生 SQL を書く場合のレビュー必須ルールを決める |
| 実装 | 値は必ずバインドパラメータで渡す。識別子は許可リストで写像する。NoSQL ではクエリに使う値が想定型（文字列・数値）であることを確認し、オブジェクトや `$` で始まるキーを拒否する。ストアド内の動的 SQL も `sp_executesql` 等のパラメータ付き実行を使う |
| レビュー | `execute(f"`、`execute("..." %`、`execute("..." +`、`.raw(`、`.extra(`、`RawSQL(`、`find_by_sql`、`where("` 内の `#{`、`order(params`、`$queryRawUnsafe`、`$executeRawUnsafe`、`createQuery("..." +`、`$where`、`EXEC(`、`EXECUTE IMMEDIATE` を grep |
| テスト | 検索欄やパラメータに `'`、`' OR '1'='1`、`1; SELECT pg_sleep(5)--` を入れ、エラーや応答遅延・結果件数の変化がないこと。`sort=name;DROP TABLE x`、`sort=(SELECT 1)` が拒否されること。JSON API に `{"email":"a@example.com","password":{"$ne":null}}` を送ってログインできないこと |

**誤解しやすいポイント**: 「ORM を使っているから SQL インジェクションはない」は、生 SQL・識別子・`ORDER BY` を見落とす典型です。また「シングルクォートをエスケープしている」は DB ごとの方言や数値文脈（`id = 1 OR 1=1`）で破られるので、パラメータ化の代わりにはなりません。

---

### V1.2.5 OS コマンドインジェクション対策 `L1`

> **原文**: Verify that the application protects against OS command injection and that operating system calls use parameterized OS queries or use contextual command line output encoding.

**ひとことで**: 外部コマンドを呼ぶときはシェルを経由させず、引数を配列で渡すこと（どうしてもシェルを使うなら正しくエスケープすること）。

**開発の現場で言うと**: 画像・動画の変換（ImageMagick、ffmpeg）、PDF 生成（wkhtmltopdf）、`git` や `zip` の実行、`ping` / `nslookup` を叩く管理画面の診断機能などで、ファイル名やホスト名などユーザー由来の値を引数に入れる場面です。
「シェル経由（文字列 1 本）」か「直接起動（引数配列）」かで安全性が大きく変わります。危険なのは Python `os.system` / `subprocess.*(..., shell=True)`、Node.js `child_process.exec` / `execSync`、Ruby のバッククォート・`system("...#{x}")`（文字列 1 本の場合）、PHP `shell_exec` / `system` など。引数配列で起動する Python `subprocess.run([...])`、Node.js `execFile` / `spawn`（`shell` オプションなし）、Ruby `system("cmd", arg1, arg2)`、Java `ProcessBuilder` はシェルのメタ文字（`;` `|` `$()`）が解釈されません。
ただし配列で渡しても、値が `-` で始まると **コマンドのオプションとして解釈される（引数インジェクション）** 問題は残るので、開発者が気をつける部分です。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | そもそも外部コマンドが必要かを検討する（言語のライブラリで代替できないか）。必要なら呼び出し箇所を 1 つのラッパー関数に集約する |
| 実装 | シェルを使わず引数配列で起動する。ユーザー値の前に `--` を置いてオプション終端を明示する（対応コマンドの場合）。ファイル名はサーバー側で生成した ID を使い、ユーザー指定名をそのまま引数にしない。ホスト名などは形式を検証する |
| レビュー | `os.system`、`os.popen`、`shell=True`、`child_process.exec(`、`execSync(`、`` ` ``（Ruby / シェルのバッククォート）、`%x(`、`Runtime.getRuntime().exec(`、`shell_exec`、`passthru`、`proc_open`、`popen` を grep し、引数に外部入力が入るかを確認 |
| テスト | 引数に入る値に `; id`、`$(id)`、`` `id` ``、`\| sleep 5`、`&& whoami` を入れて、コマンドが実行されない（出力や遅延が出ない）こと。`-oProxyCommand=...` や `--output=/tmp/x` のように `-` 始まりの値がオプション扱いされないこと |

**誤解しやすいポイント**: 「`shlex.quote` などでクォートしているから安全」は、シェルの種類（`sh`、`cmd.exe`、PowerShell）ごとに規則が違うため危うく、まず引数配列化を優先すべきです。また「配列で渡しているから安全」も引数インジェクションには無力で、`git`、`tar`、`curl` などオプションで任意ファイルを書けるコマンドでは特に注意が必要です。

---

### V1.3.1 リッチテキスト HTML のサニタイズ `L1`

> **原文**: Verify that all untrusted HTML input from WYSIWYG editors or similar is sanitized using a well-known and secure HTML sanitization library or framework feature.

**ひとことで**: ユーザーが入力した HTML（リッチテキスト）を表示するなら、実績のある HTML サニタイズライブラリで危険な要素を取り除くこと。

**開発の現場で言うと**: ブログ・掲示板・社内 Wiki の本文、問い合わせフォームのリッチテキスト、メールテンプレートエディタ、Markdown を HTML に変換して表示する機能など、「HTML として表示したい」ためにエスケープできない場面です。
フレームワークの自動エスケープはこの場面では使えない（使うとタグがそのまま文字で見える）ため、**開発者が明示的にサニタイザを入れないと必ず穴になる** 領域です。代表的なライブラリは DOMPurify（JS）、OWASP Java HTML Sanitizer、Rails の `sanitize` ヘルパ（rails-html-sanitizer / Loofah）、Python の nh3 などです（Python の bleach は非推奨化が発表されています）。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | 許可するタグ・属性を仕様として決める（例: `p, b, i, ul, li, a[href], img[src]`）。サニタイズを「保存前」「表示前」のどちらで行うか決め、表示前なら全表示経路（Web、メール、モバイル API）で必ず通す設計にする |
| 実装 | 許可リスト方式でライブラリを設定する。`a[href]` / `img[src]` を許可するなら URL スキームも制限する。**サニタイズ後に文字列を加工しない**（置換や連結で構造が変わるとサニタイズが無効化されうる）。ライブラリを定期的に更新する |
| レビュー | `v-html`、`dangerouslySetInnerHTML`、`innerHTML =`、`\|safe`、`html_safe`、`raw(` に入る値がサニタイザを通っているか。自作の正規表現サニタイザ（`replace(/<script.*?>/` など）がないか。Markdown レンダラの「生 HTML 許可」設定（例: `html: true`）を確認 |
| テスト | 本文に `<img src=x onerror=alert(1)>`、`<svg onload=alert(1)>`、`<a href="javascript:alert(1)">x</a>`、`<iframe src=...>`、`<scr<script>ipt>alert(1)</script>`、`<style>` 経由の CSS を入れ、保存・表示後に実行されず、許可外の要素や属性が除去されていること |

**誤解しやすいポイント**: 「`<script>` タグを消しているから大丈夫」は典型的な誤りで、イベントハンドラ属性、SVG、`javascript:` URL など抜け道は大量にあります。自作の正規表現は避け、「well-known and secure」なライブラリを使うのが要件の主旨です。また「フロントのエディタが危険なタグを入れない」もサーバー側の保証にはなりません（API を直接叩けば任意の HTML を送れます）。

---

### V1.3.2 eval などの動的コード実行を避ける `L1`

> **原文**: Verify that the application avoids the use of eval() or other dynamic code execution features such as Spring Expression Language (SpEL). Where there is no alternative, any user input being included must be sanitized before being executed.

**ひとことで**: 文字列をコードとして実行する機能（`eval`、SpEL など）は使わないこと。どうしても使うなら、含めるユーザー入力をサニタイズしてから実行すること。

**開発の現場で言うと**: 「ユーザーが入力した計算式で料金を計算する」「管理画面で条件式を設定できるようにする」「設定ファイルの文字列を式として評価する」「動的にメソッド名を決めて呼ぶ」といった柔軟さを求める機能で出てきます。
該当する機能の例: JavaScript の `eval`、`new Function(...)`、文字列を渡す `setTimeout("...")`、Python の `eval` / `exec` / `compile`、Ruby の `eval` / `instance_eval`（文字列）/ `send(params[:method])`、Java の SpEL（`SpelExpressionParser`）や OGNL、スクリプトエンジン、PHP の `eval` / `assert`（文字列）。ユーザー入力をテンプレートそのものとして処理する（Flask の `render_template_string(user_input)` など）のも同じ種類の危険です。
フレームワークがこれを防いでくれることはないため、**使わない設計にするのが開発者の責任** です。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | 「式を入力させたい」要件には、用途を限定した DSL・選択式 UI・安全な式評価ライブラリ（四則演算だけのパーサなど）で代替できないか検討する。動的メソッド呼び出しは許可リストのマップで置き換える |
| 実装 | 動的ディスパッチは `{"csv": export_csv, "pdf": export_pdf}[kind]` のような対応表で行う。SpEL を使う場合は信頼できない入力を式として評価しない（必要なら機能を制限した評価コンテキストを使う）。どうしても入力を含めるなら、許可文字・構文を厳格に絞ってから評価する |
| レビュー | `eval(`、`exec(`、`new Function(`、`setTimeout("`、`setInterval("`、`instance_eval`、`class_eval`、`.send(params`、`public_send(params`、`SpelExpressionParser`、`parseExpression(`、`ScriptEngine`、`render_template_string(`、`Template(` にユーザー入力が入っていないかを grep |
| テスト | 式や名前を受け取る入力に `__import__('os').system('id')`、`7*7`、`${7*7}`、`#{7*7}`、`{{7*7}}`、`T(java.lang.Runtime).getRuntime().exec('id')` を入れ、評価結果（49 など）が返らないこと、コマンドが実行されないことを確認 |

**誤解しやすいポイント**: 「社内の管理者しか入力しないから大丈夫」は、管理者アカウントの乗っ取りや、別経路（CSV インポートや外部 API の値）から入力が混入する可能性を無視しています。また Python の `eval(expr, {"__builtins__": {}})` のような「サンドボックス化」は回避手法が知られており、安全とはみなせません。

---

### V1.5.1 XML パーサの XXE 対策 `L1`

> **原文**: Verify that the application configures XML parsers to use a restrictive configuration and that unsafe features such as resolving external entities are disabled to prevent XML eXternal Entity (XXE) attacks.

**ひとことで**: XML を解析するときは、外部エンティティの解決など危険な機能を無効にした制限的な設定でパーサを使うこと。

**開発の現場で言うと**: SOAP / XML API の受信、SAML によるシングルサインオン、XML 形式の設定ファイルやデータのインポート、**XML を内部に持つファイル**（SVG 画像、Office 文書の DOCX / XLSX は中身が XML の ZIP）のアップロード処理など、「XML を扱っている自覚がない」場所にも現れます。
既定値は言語・ライブラリ・バージョンによって大きく異なります。たとえば .NET の新しいバージョンや PHP 8 系は既定で外部エンティティを読み込まない方向になっている一方、Java の `DocumentBuilderFactory` / `SAXParserFactory` / `XMLInputFactory` などは明示的に機能を無効化する設定が必要とされるケースが多いです。Python では `defusedxml` の利用が推奨されています。**使っているパーサの既定値を自分で確認し、明示的に設定する** のが安全です。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | アプリ内で XML を解析している箇所（直接・ライブラリ経由とも）を洗い出す。DTD が不要なら「DTD を一切受け付けない」方針にする |
| 実装 | パーサ生成を共通関数に集約し、DOCTYPE 宣言の禁止、外部一般／パラメータエンティティの無効化、外部 DTD 読み込みの無効化、ネットワークアクセスの禁止、エンティティ展開数の制限（Billion Laughs 対策）を設定する。Python なら `defusedxml`、Java なら `disallow-doctype-decl` 機能を `true` にする等 |
| レビュー | `DocumentBuilderFactory.newInstance`、`SAXParserFactory`、`XMLInputFactory`、`TransformerFactory`、`SchemaFactory`、`xml.etree`、`lxml.etree.XMLParser`、`xml.dom.minidom`、`Nokogiri::XML`（`NOENT` オプション）、`simplexml_load_string`、`XmlDocument`、`libxmljs` の生成箇所で、制限設定が入っているか |
| テスト | XML 受付箇所（SVG / DOCX アップロード含む）に `<?xml version="1.0"?><!DOCTYPE r [<!ENTITY x SYSTEM "file:///etc/passwd">]><r>&x;</r>` を送り、ファイル内容が返らない・エラーで拒否されること。`SYSTEM "http://<自分の受信サーバ>/"` で外部への通信が発生しないこと。エンティティの多重展開（Billion Laughs）でサーバーが固まらないこと |

**誤解しやすいポイント**: 「JSON API だから XML は関係ない」と思っていても、`Content-Type: application/xml` を送ると XML として受け付けてしまうフレームワーク設定や、SVG / Office ファイル処理、SAML ライブラリ内部で XML を解析していることがあります。また「XML の値を検証しているから安全」は誤りで、XXE は値の検証より前、**パースの時点** で発生します。

---

## この章のまとめ: PR レビューで聞く質問

- 自動エスケープを外す API（`|safe`、`html_safe`、`dangerouslySetInnerHTML`、`v-html` など）を使っている箇所で、入る値の出所とサニタイズを説明できますか？
- ユーザーが指定する URL を `href` やリダイレクト先に使うとき、スキームを許可リストで制限していますか？
- `<script>` 内やイベントハンドラ属性にサーバー側の値を直接埋め込んでいませんか？
- 生 SQL・`ORDER BY`・カラム名・NoSQL のクエリオブジェクトにユーザー値が直接入っていませんか？
- 外部コマンドをシェル経由で呼んでいませんか？ `-` で始まる値がオプションとして解釈される可能性を考えましたか？
- 新しく追加した XML 処理（SVG・Office ファイル・SAML を含む）で、パーサの外部エンティティ解決を明示的に無効化していますか？
