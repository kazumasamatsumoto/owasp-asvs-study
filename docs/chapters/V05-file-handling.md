# V5 ファイル処理（File Handling）

> 📘 原文: [0x14-V5-File-Handling.md](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x14-V5-File-Handling.md)
> 📊 要件数: **13**（L1: 4 / L2: 5 / L3: 4）
> ✅ 全要件のチェックリスト: [checklists/by-chapter/V5.md](../../checklists/by-chapter/V5.md)

## 1. この章の目的

ファイルを扱う機能は、アプリケーションにさまざまなリスクをもたらします。原文が挙げる代表例は、サービス拒否（DoS）、不正アクセス、ストレージの枯渇の3つです。
ファイルアップロードは「信頼できないファイル」が入ってくる主要な入口で、ファイルの存在・量・中身のどれもがアプリを壊す原因になり得ます。
この章では、受け付けるファイルの仕様を文書化することから始め、アップロード時の検証、保存時の実行防止とパス制御、ダウンロード時のファイル名処理とマルウェア対策までを扱います。
「拡張子だけ見て信じる」「ユーザーが送ってきたファイル名をそのままパスに使う」といった、よくある手抜きを潰していくのがこの章の狙いです。

## 2. セクション構成

| セクション | 日本語名 | 何を扱うか（1行） | 要件数 |
| --- | --- | --- | :---: |
| V5.1 | ファイル処理の文書化 | 受け付けるファイルの種類・拡張子・最大サイズと、悪性ファイル検出時の挙動を文書化する | 1 |
| V5.2 | ファイルアップロードとコンテンツ | サイズ制限、拡張子と中身の一致確認、圧縮ファイル・シンボリックリンク・巨大画像への対策 | 6 |
| V5.3 | ファイルの保存 | アップロードファイルがサーバーで実行されないこと、保存パスにユーザー入力を使わないこと | 3 |
| V5.4 | ファイルのダウンロード | 配信時のファイル名の検証・エンコード、ウイルススキャン | 3 |

## 3. 押さえるべき重要要件

### V5.2.1 — 処理可能なサイズのファイルだけ受け付ける（L1）

- **要件（意訳）**: アプリケーションは、性能低下やサービス拒否攻撃を起こさずに処理できるサイズのファイルだけを受け付けること。
- **なぜ重要か**: サイズ上限がないと、攻撃者が数 GB のファイルを並列で送り付けるだけで、メモリ・ディスク・CPU が枯渇してサービスが止まります。
- **実装のポイント**:
  - Web サーバー / リバースプロキシ（例: nginx の `client_max_body_size`）とアプリの両方で上限を設定する。
  - ファイル全体をメモリに読み込む前に、ストリームで読みながらサイズを数えて超過したら打ち切る。

```python
# ❌ NG 例: 上限なしで全部メモリに読み込む
data = request.files["file"].read()

# ✅ OK 例: 上限を設けて読み込みを打ち切る（Flask）
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10MB を超えると 413

MAX = 10 * 1024 * 1024
f = request.files["file"]
data = f.stream.read(MAX + 1)
if len(data) > MAX:
    abort(413)
```

### V5.2.2 — 拡張子と中身の一致を確認する（L1）

- **要件（意訳）**: ファイルを受け付けるとき（単体でも zip などのアーカイブ内でも）、拡張子が想定どおりかを確認し、さらに中身がその拡張子の示す形式と一致することを検証すること。方法としては先頭の「マジックバイト」の確認、画像の再書き出し（re-writing）、専用ライブラリによる内容検証などがある。L1 では業務上・セキュリティ上の判断に使うファイルに絞ってよいが、L2 以上では受け付けるすべてのファイルが対象。
- **なぜ重要か**: `avatar.png` という名前で中身は HTML や PHP、というファイルを受け入れると、XSS やサーバー側でのコード実行につながります。`Content-Type` ヘッダはクライアントが自由に書き換えられるので根拠になりません。
- **実装のポイント**: 拡張子は許可リストで判定し、中身はマジックバイトや画像ライブラリで検証する。画像は一度デコードして再エンコードすると、埋め込まれた余計なデータも落とせる。

```python
# ❌ NG 例: クライアントが申告した Content-Type だけを信じる
if f.mimetype == "image/png":
    save(f)

# ✅ OK 例: 拡張子の許可リスト + 中身の検証 + 再書き出し
from pathlib import Path
from PIL import Image

ALLOWED = {".png", ".jpg", ".jpeg"}
ext = Path(f.filename).suffix.lower()
if ext not in ALLOWED:
    abort(400)

img = Image.open(f.stream)
img.verify()                      # 壊れた/偽装ファイルを検出
f.stream.seek(0)
img = Image.open(f.stream)
if img.format not in {"PNG", "JPEG"}:
    abort(400)
img.save(out_path, format=img.format)  # 再エンコードして保存
```

### V5.2.3 — 圧縮ファイルは展開前にサイズとファイル数を確認する（L2）

- **要件（意訳）**: 圧縮ファイル（zip, gz, docx, odt など）について、展開する前に「展開後の最大サイズ」と「最大ファイル数」を確認すること。
- **なぜ重要か**: 数 KB の zip が展開すると数 GB〜PB になる「zip 爆弾」で、ディスクやメモリを使い果たします。docx や odt も中身は zip なので同じ攻撃が成立します。
- **実装のポイント**: 展開前にエントリ一覧を走査して合計サイズと件数をチェックする。ヘッダ上のサイズは偽装できるため、実際の展開中にも書き込んだバイト数を数えて上限で打ち切るとより安全。

```python
import zipfile

MAX_FILES = 100
MAX_TOTAL = 100 * 1024 * 1024

# ❌ NG 例: いきなり全部展開
zipfile.ZipFile(path).extractall(dest)

# ✅ OK 例: 展開前に件数と展開後サイズを確認
with zipfile.ZipFile(path) as z:
    infos = z.infolist()
    if len(infos) > MAX_FILES:
        raise ValueError("too many files")
    if sum(i.file_size for i in infos) > MAX_TOTAL:
        raise ValueError("too large when uncompressed")
```

### V5.3.1 — アップロードしたファイルをサーバー側コードとして実行させない（L1）

- **要件（意訳）**: 信頼できない入力からアップロード・生成され、公開フォルダに保存されたファイルが、HTTP リクエストで直接アクセスされたときにサーバー側のプログラムコードとして実行されないこと。
- **なぜ重要か**: `uploads/shell.php` を置かれて `https://example.com/uploads/shell.php` にアクセスされると、それだけでサーバーを乗っ取られます（Web シェル）。
- **実装のポイント**:
  - アップロード先はドキュメントルートの外、またはオブジェクトストレージにする。
  - どうしても公開ディレクトリに置くなら、そのディレクトリでスクリプト実行を無効化する。
  - 保存ファイル名はサーバー側で生成し、実行可能な拡張子を付けない。

```nginx
# ✅ OK 例: uploads 配下では PHP 等を実行させない（nginx）
location /uploads/ {
    location ~ \.(php|phtml|jsp|aspx?)$ { deny all; }
    add_header X-Content-Type-Options nosniff;
}
```

### V5.3.2 — ファイルパスにユーザー提供のファイル名を使わない（L1）

- **要件（意訳）**: ファイル操作のパスを組み立てるときは、ユーザーが送ったファイル名ではなく、内部で生成した値や信頼できるデータを使うこと。ユーザー提供のファイル名やメタデータをどうしても使う場合は、厳密な検証とサニタイズを行うこと。目的は、パストラバーサル、ローカル/リモートファイルインクルージョン（LFI, RFI）、SSRF を防ぐこと。
- **なぜ重要か**: ファイル名に `../../etc/passwd` や `../app/config.py` を入れられると、意図しない場所の読み書きが起こります。URL を受け取って取得する処理なら、内部ネットワークへのリクエスト（SSRF）にも悪用されます。
- **実装のポイント**: 保存名は UUID などで生成し、元のファイル名は DB に「表示用データ」としてだけ保存する。

```python
# ❌ NG 例: ユーザーのファイル名をそのままパスに使う
path = os.path.join(UPLOAD_DIR, request.form["filename"])
open(path, "wb").write(data)

# ✅ OK 例: サーバー側で名前を生成し、元の名前は DB に保持
import uuid
stored_name = f"{uuid.uuid4().hex}{ext}"   # ext は許可リストで検証済み
path = os.path.join(UPLOAD_DIR, stored_name)
db.save(file_id=stored_name, original_name=request.form["filename"])
```

### V5.3.3 — 展開処理でユーザー提供のパス情報を無視する（L3）

- **要件（意訳）**: ファイル展開などのサーバー側ファイル処理では、ユーザーが提供したパス情報を無視し、zip slip などの脆弱性を防ぐこと。
- **なぜ重要か**: zip 内のエントリ名が `../../var/www/html/evil.php` になっていると、展開時に展開先ディレクトリの外へファイルが書き込まれます（zip slip）。
- **実装のポイント**: エントリ名のディレクトリ部分を捨てる、または解決後のパスが展開先の内側にあることを確認する。

```python
# ❌ NG 例: エントリ名をそのまま結合
for name in z.namelist():
    with open(os.path.join(dest, name), "wb") as out:
        out.write(z.read(name))

# ✅ OK 例: 解決後のパスが dest の内側かを確認
base = os.path.realpath(dest)
for info in z.infolist():
    target = os.path.realpath(os.path.join(base, info.filename))
    if not target.startswith(base + os.sep):
        raise ValueError(f"zip slip detected: {info.filename}")
```

### V5.4.1 / V5.4.2 — ダウンロード時のファイル名を自分で決め、エンコードする（L2）

- **要件（意訳）**:
  - 5.4.1: JSON・JSONP・URL パラメータなどで送られたユーザー提供のファイル名を検証または無視し、レスポンスの `Content-Disposition` ヘッダでファイル名を指定すること。
  - 5.4.2: 配信するファイル名（HTTP レスポンスヘッダやメール添付など）は、文書構造を保ちインジェクション攻撃を防ぐために、（例: RFC 6266 に従って）エンコードまたはサニタイズすること。
- **なぜ重要か**: `Content-Disposition` が無いと、ブラウザが URL 末尾などから勝手に名前や扱いを決め、危険な拡張子で保存させられることがあります（Reflected File Download など）。ファイル名に改行や `"` が含まれると、ヘッダインジェクションや値の切り詰めが起こり得ます。
- **実装のポイント**: ファイル名はサーバー側で決め、RFC 6266 / RFC 5987 形式（`filename*=UTF-8''...`）でエンコードする。

```python
# ❌ NG 例: ユーザー提供の名前をそのままヘッダに埋め込む
resp.headers["Content-Disposition"] = f'attachment; filename="{request.args["name"]}"'

# ✅ OK 例: サーバーが持つ名前を使い、RFC 6266 形式でエンコード
from urllib.parse import quote
name = record.original_name.replace("\r", "").replace("\n", "")
resp.headers["Content-Disposition"] = (
    f"attachment; filename=\"download\"; filename*=UTF-8''{quote(name)}"
)
# Flask なら send_file(path, as_attachment=True, download_name=name) が自動でエンコードする
```

### V5.4.3 — 信頼できないファイルはウイルススキャンする（L2）

- **要件（意訳）**: 信頼できないソースから取得したファイルをアンチウイルススキャナでスキャンし、既知の悪性コンテンツを配信しないようにすること。
- **なぜ重要か**: アプリ自身が壊れなくても、アップロードされたマルウェアを他のユーザーに配ってしまえば、アプリが攻撃の配布拠点になります。
- **実装のポイント**: ClamAV などで保存前または配信前にスキャンし、検出時の挙動（隔離・拒否・通知など）を V5.1.1 の文書に従って実装する。

## 4. よくある脆弱性・アンチパターン

- **`Content-Type` ヘッダや拡張子だけで種類を判定する**: どちらもクライアントが自由に偽装できます（V5.2.2）。
- **拡張子チェックの抜け道**: `shell.php.jpg`、`shell.pHp`、`shell.php%00.jpg` のような名前を想定していない判定ロジック。許可リスト方式で、最後の拡張子を小文字化して判定します。
- **アップロード先がドキュメントルート配下で、スクリプト実行も有効なまま**（V5.3.1）。
- **`os.path.join(UPLOAD_DIR, user_filename)`**: 絶対パスを渡されると前半が無視される、`../` で外に出られる、などの問題があります（V5.3.2）。
- **`ZipFile.extractall()` / `tarfile.extractall()` を無防備に使う**: zip slip、シンボリックリンク経由の任意ファイル読み取り、zip 爆弾の温床です（V5.2.3, V5.2.5, V5.3.3）。
- **画像サイズ（ピクセル数）を確認せずにデコードする**: ファイルは小さくても 50000×50000 ピクセルの画像をデコードするとメモリが枯渇します（ピクセルフラッド, V5.2.6）。Pillow の `Image.MAX_IMAGE_PIXELS` を適切に設定し、`width * height` を確認します。
- **ユーザーごとの容量制限がない**: 1 ユーザーが小さいファイルを大量に置くだけでストレージが埋まります（V5.2.4）。
- **ダウンロード時にユーザーが渡したファイル名をそのままヘッダに出す**（V5.4.1, V5.4.2）。

## 5. 検証（テスト）のヒント

- **文書の確認**: 各アップロード機能について、許可する種類・拡張子・最大サイズ（展開後サイズを含む）、悪性ファイル検出時の挙動が文書化されているか（V5.1.1）。テストはこの文書を基準に行います。
- **サイズ系**: 上限ぎりぎり・上限 +1 バイト・非常に大きなファイルを送り、適切に 413 などで拒否されるか。
- **種類偽装**: 拡張子 `.png` で中身が HTML / SVG（スクリプト入り）/ PHP のファイル、`Content-Type` だけ `image/png` にしたファイル、二重拡張子、大文字小文字混在を送る。
- **圧縮ファイル**: zip 爆弾、大量エントリの zip、`../` を含むエントリ名の zip（zip slip）、シンボリックリンクを含む zip（`ln -s /etc/passwd link && zip --symlinks evil.zip link`）を送る。
- **画像**: 巨大なピクセル寸法を持つ小さな画像ファイル（ピクセルフラッド）を送る。
- **実行**: アップロードしたファイルの URL を直接叩いて、スクリプトとして実行されないか、`Content-Type` がどうなっているか。
- **パス**: ファイル名パラメータに `../`、URL エンコード版（`%2e%2e%2f`）、絶対パス、`http://` や `file://` を入れる。
- **ダウンロード**: `Content-Disposition` が常に付いているか、ファイル名に改行・`"`・`;`・非 ASCII 文字を含めたときに壊れないか。
- **マルウェア**: 無害なテスト用ファイル EICAR をアップロードして、スキャンと検出時の挙動を確認する（V5.4.3）。
- **コードレビュー**: `open(`, `os.path.join`, `extractall`, `send_file`, `Content-Disposition` を grep して、ユーザー入力が流れ込んでいないか追う。

## 6. 確認問題

**Q1.** アップロードされたファイルの `Content-Type` が `image/png` で、拡張子も `.png` だった。これだけで PNG 画像として受け入れてよいか。理由も答えよ。

<details><summary>答えと解説</summary>

よくありません。`Content-Type` も拡張子もクライアントが自由に決められます。**V5.2.2** は、拡張子が想定どおりかの確認に加えて、中身がその形式と一致することの検証（マジックバイトの確認、画像の再書き出し、専用ライブラリでの検証など）を求めています。L2 以上では受け付けるすべてのファイルが対象です。

</details>

**Q2.** 次のうち、zip ファイルの展開前に確認すべきと V5.2.3 が定めている項目をすべて選べ。
(a) 展開後の最大サイズ　(b) zip 内の最大ファイル数　(c) zip のファイル名の長さ　(d) zip の作成日時

<details><summary>答えと解説</summary>

**(a) と (b)** です。**V5.2.3**（L2）は、圧縮ファイル（zip, gz, docx, odt など）を展開する前に、展開後の最大サイズと最大ファイル数を確認することを求めています。zip 爆弾への対策です。

</details>

**Q3.** zip を展開するとき、エントリ名に `../../var/www/html/x.php` が含まれていた。この攻撃の名前と、対応する ASVS 要件 ID を答えよ。

<details><summary>答えと解説</summary>

**zip slip** です。対応するのは **V5.3.3**（L3）で、展開などのサーバー側ファイル処理ではユーザーが提供したパス情報を無視することを求めています。より一般的に、ファイルパスの組み立てにユーザー提供のファイル名を使わないという **V5.3.2**（L1）にも関係します。

</details>

**Q4.** ファイルサイズは 100KB しかないのに、画像処理サーバーがメモリ不足で落ちた。考えられる攻撃と、それを防ぐ要件 ID は何か。

<details><summary>答えと解説</summary>

**ピクセルフラッド攻撃**です。ファイルは小さくても、ヘッダ上のピクセル寸法が巨大な画像をデコードすると大量のメモリを使います。**V5.2.6**（L3）は、最大ピクセルサイズを超える画像を拒否することを求めています。

</details>

**Q5.** ファイルダウンロード機能で、レスポンスヘッダに関して V5.4.1 と V5.4.2 が求めていることを簡潔に説明せよ。

<details><summary>答えと解説</summary>

- **V5.4.1**（L2）: JSON・JSONP・URL パラメータなどで送られたユーザー提供のファイル名を検証または無視し、レスポンスの `Content-Disposition` ヘッダでファイル名を指定する。
- **V5.4.2**（L2）: 配信するファイル名（レスポンスヘッダやメール添付など）を、文書構造を保ちインジェクションを防ぐために（例: RFC 6266 に従って）エンコードまたはサニタイズする。

</details>

## 7. 関連リソース

- OWASP Cheat Sheet: [File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Server Side Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- 原文の参考リンク: [Example of using symlinks for arbitrary file read (HackerOne)](https://hackerone.com/reports/1439593)、[List of file signatures (Wikipedia)](https://en.wikipedia.org/wiki/List_of_file_signatures)
- 関連する章: [V1 エンコーディングとサニタイズ](./V01-encoding-and-sanitization.md)（ファイル名のエンコード）、[V2 検証とビジネスロジック](./V02-validation-and-business-logic.md)（入力検証）、[V3 Web フロントエンドセキュリティ](./V03-web-frontend-security.md)（`Content-Type` / `nosniff` などのヘッダ）、[V13 設定](./V13-configuration.md)（サーバー設定）
