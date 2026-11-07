# V11 暗号化 — L1 要件を開発の観点で読む

> 対象: L1 要件 3 件 ／ 章の解説: [../chapters/V11-cryptography.md](../chapters/V11-cryptography.md)

## この章の要件を一言でいうと

アプリのコードで **暗号ライブラリを直接呼ぶとき** の話です。具体的には、DB に保存する個人情報やトークンを暗号化する、Webhook の署名（HMAC）を検証する、ファイルの改ざん検知用にハッシュを取る、署名付き URL を作る、といった場面です。
L1 の 3 件は「危険なアルゴリズム・モードを使わず、承認済みのものを使う」というアルゴリズム選択の要件です。何が「承認済み」かは ASVS の Appendix C（暗号標準）に一覧があり、A（Approved）／L（Legacy）／D（Disallowed）で区分されています。
TLS の設定（V12）やパスワード保存（V11.4.2、L2）は別の要件なので、ここでは「アプリコードから呼ぶ暗号」に絞って読みます。

## 要件ごとの読み解き

### V11.3.1 ECB や弱いパディングを使わない `L1`

> **原文**: Verify that insecure block modes (e.g., ECB) and weak padding schemes (e.g., PKCS#1 v1.5) are not used.

**ひとことで**: AES の ECB モードのような安全でない暗号モードや、RSA の PKCS#1 v1.5 のような弱いパディング方式を使わない。

**開発の現場で言うと**: 「顧客のマイナンバーを DB に暗号化して保存する」「外部システムとの連携ファイルを RSA で暗号化する」といったコードを書くときです。
暗号ライブラリの多くはモードやパディングを開発者に選ばせるため、**省略したときの既定値**が落とし穴になります。よく知られた例として、Java の `Cipher.getInstance("AES")` は一般的な JCE プロバイダでは `AES/ECB/PKCS5Padding` と解釈され、`Cipher.getInstance("RSA")` は `RSA/ECB/PKCS1Padding`（PKCS#1 v1.5）と解釈されます。Node.js や Python の `cryptography` ではモード名を明示的に指定する必要があるため、`aes-256-ecb` や `modes.ECB()` と書いた時点でレビューで発見できます。
ECB は同じ平文ブロックが同じ暗号文になるため、データのパターンが漏れます。PKCS#1 v1.5 の暗号化パディングは、パディングオラクル攻撃（Bleichenbacher 攻撃）で解読される既知の問題があります。なお Appendix C では、RSA の署名方式 RSA-SSA-PKCS#1 v1.5 も D（Disallowed）に分類されています。JWT の `RS256` はこの署名方式なので、新規設計では `PS256` や `ES256` などへの切り替えも検討対象になります（ただし外部 IdP の仕様に依存するため、影響範囲を確認してから判断してください）。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | アプリ内の暗号化処理をすべて洗い出し（何を・どのアルゴリズム・どのモードで）、暗号化は共通モジュールに集約する方針にする。RSA 暗号化が必要なら OAEP を使う前提にする。 |
| 実装 | モードとパディングを必ず明示する（`AES/GCM/NoPadding`、`RSA/ECB/OAEPWithSHA-256AndMGF1Padding` など）。可能なら libsodium / Tink のように安全な既定を持つ高水準 API を使う。 |
| レビュー | `ECB`、`getInstance("AES")`、`getInstance("RSA")`、`aes-128-ecb` / `aes-256-ecb`、`modes.ECB`、`MODE_ECB`、`PKCS1v15`、`PKCS1Padding`、`RSA_PKCS1_PADDING`、`DES`、`RC4` を grep する。 |
| テスト | 同じ平文を 2 回暗号化して暗号文が一致しないこと（ECB や固定 IV ならば一致する）を単体テストで確認する。依存ライブラリ・設定に ECB 等が含まれていないことは静的解析（Semgrep / CodeQL の暗号ルール）でも確認できる。 |

**誤解しやすいポイント**: 「AES を使っているから安全」は誤りです。AES はアルゴリズム（ブロック暗号）で、**どのモードで使うか**で安全性が大きく変わります。AES-ECB は AES であっても不合格です。

---

### V11.3.2 承認済みの暗号とモード（AES-GCM など）だけを使う `L1`

> **原文**: Verify that only approved ciphers and modes such as AES with GCM are used.

**ひとことで**: 暗号化には、AES-GCM のような承認済みのアルゴリズムとモードだけを使う。

**開発の現場で言うと**: V11.3.1 の裏返しで、「使ってはいけないもの」を避けるだけでなく「使ってよいもの」から選ぶ要件です。Appendix C の承認済み（A）一覧には AES-256、AES-192、ChaCha20、XChaCha20 などの暗号と、GCM・CCM といった認証付き暗号（AEAD）モードが載っています。CBC は L（Legacy、互換性目的のみ）、AES-128 も L に分類されている点に注意してください。
現場でよくあるのは、昔のサンプルコードをコピーして AES-CBC を MAC なしで使っているケースです。認証のない暗号は、暗号文を書き換えられても検知できません。
フレームワーク標準の暗号化機能（例: Rails の Active Record Encryption、Django ではサードパーティ製の暗号化フィールド、Laravel の `Crypt` など）を使う場合は、内部でどのアルゴリズム・モードが使われているかをドキュメントで確認して記録しておきます。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | プロジェクトで使ってよい暗号方式を 1〜2 種類に決める（例: AES-256-GCM、XChaCha20-Poly1305）。鍵の長さ、nonce の生成方法、暗号文の保存形式（nonce + 暗号文 + タグ）も決めておく。 |
| 実装 | AEAD を使い、nonce は暗号化ごとにランダム生成（または一意なカウンタ）する。復号時のタグ検証失敗は例外として扱い、部分的な平文を使わない。 |
| レビュー | `CBC`、`CFB`、`OFB`、`CTR`（MAC なし）、`3DES` / `DESede`、`Blowfish`、`AES-128`、独自 XOR 暗号を探す。暗号化の呼び出しが共通モジュール以外に散らばっていないか確認する。 |
| テスト | 暗号文の 1 バイトを書き換えて復号すると失敗（例外）すること。同じ平文・同じ鍵で 2 回暗号化して nonce と暗号文が異なること。 |

**誤解しやすいポイント**: 「暗号化ライブラリの既定設定を使っているから承認済みのはず」とは限りません。ライブラリの既定は後方互換性のために古い方式のままのことがあります。使っているモードを **名前で確認** してください。

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os
key = AESGCM.generate_key(bit_length=256)
nonce = os.urandom(12)                      # 暗号化ごとに新しく
ct = AESGCM(key).encrypt(nonce, plaintext, associated_data)
```

---

### V11.4.1 承認済みハッシュ関数を使い、MD5 は暗号用途に使わない `L1`

> **原文**: Verify that only approved hash functions are used for general cryptographic use cases, including digital signatures, HMAC, KDF, and random bit generation. Disallowed hash functions, such as MD5, must not be used for any cryptographic purpose.

**ひとことで**: 署名・HMAC・鍵導出・乱数生成などの暗号用途には SHA-256 以上などの承認済みハッシュ関数を使い、MD5 は暗号目的に一切使わない。

**開発の現場で言うと**: 「Webhook の署名を HMAC で検証する」「ダウンロードファイルの改ざん検知用ハッシュを出す」「API キーから署名を作る」「独自のトークンを生成する」コードを書くときです。
Appendix C では SHA-256、SHA-384、SHA-512、SHA-3 系、BLAKE2/BLAKE3 が承認済み（A）、SHA-1 や SHA-224 は L（HMAC・KDF・乱数生成・デジタル署名には不適）、MD5・MD4・CRC は D（禁止）です。
注意点は「暗号用途」の範囲です。キャッシュキーや ETag の生成、重複ファイル検出のように **改ざん耐性を期待しない用途** で MD5 を使うことはこの要件の対象外と読めます。ただし、それが後でセキュリティ判断（例: 「ハッシュが一致したら同一ファイルとして権限チェックを省く」）に使われ始めると暗号用途になります。用途をコメントで明示しておくとレビューしやすくなります。Python では `hashlib.md5(data, usedforsecurity=False)`（3.9 以降）で意図を表明できます。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | ハッシュを使う箇所を「暗号用途（改ざん検知・署名・HMAC・鍵導出・トークン生成）」と「非暗号用途（キャッシュキー等）」に分類する。暗号用途は SHA-256 以上に統一する。 |
| 実装 | HMAC は `HMAC-SHA-256` 以上を使い、比較は定数時間比較（`hmac.compare_digest`、`crypto.timingSafeEqual`、`MessageDigest.isEqual`）で行う。乱数はハッシュで自作せず、OS の CSPRNG（`secrets`、`crypto.randomBytes`、`SecureRandom`）を使う。 |
| レビュー | `md5`、`MD5`、`sha1`、`SHA1`、`SHA-1`、`HmacMD5`、`HmacSHA1`、`createHash('md5')`、`Digest::MD5`、`md5(` + `time()` / `rand()` のような自作トークン生成を grep する。見つけたら用途を確認する。 |
| テスト | HMAC 検証の単体テストで、SHA-256 で作った正しい署名は通り、1 文字変えた署名・MD5 で作った署名は拒否されること。外部連携先（決済、Webhook）の仕様が要求するハッシュ方式も確認する。 |

**誤解しやすいポイント**: 「MD5 は衝突が問題なだけで、HMAC-MD5 ならまだ安全と言われている」という議論はありますが、ASVS は MD5 を「いかなる暗号目的にも使ってはならない」と明記しており、HMAC-MD5 も Appendix C で D（禁止）です。議論の余地があるかではなく、要件として不合格になる点を押さえてください。

---

## この章のまとめ: PR レビューで聞く質問

- 暗号化のモードとパディングを明示していますか？ 既定値任せ（`Cipher.getInstance("AES")` など）になっていませんか？
- 暗号化は AES-GCM や ChaCha20-Poly1305 のような認証付き暗号を使い、nonce を毎回新しく生成していますか？
- RSA で暗号化する場合、PKCS#1 v1.5 ではなく OAEP を使っていますか？
- 署名・HMAC・トークン生成で MD5 や SHA-1 を使っていませんか？ 非暗号用途の MD5 は用途がコメントで明示されていますか？
- 暗号処理は共通モジュールに集約され、アルゴリズムの一覧（暗号インベントリ）に載っていますか？
