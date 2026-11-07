# V11 暗号化（Cryptography）

> 📘 原文: [0x20-V11-Cryptography.md](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x20-V11-Cryptography.md)
> 📊 要件数: **24**（L1: 3 / L2: 11 / L3: 10）
> ✅ 全要件のチェックリスト: [checklists/by-chapter/V11.md](../../checklists/by-chapter/V11.md)

## 1. この章の目的

この章の目的は、暗号の一般的な利用におけるベストプラクティスを定めるとともに、暗号の基本原則の理解を促し、より堅牢で現代的なアプローチへの移行を後押しすることです。具体的には、安全に失敗し（fail securely）、進化する脅威に適応できる将来性のある暗号システムを実装すること、業界のベストプラクティスに沿った暗号メカニズムを使うこと、適切なアクセス制御と監査を備えた鍵管理を維持すること、暗号の動向を定期的に評価してアルゴリズムを見直すこと、そしてアプリケーションのライフサイクル全体で暗号の利用箇所を発見・管理することを求めています。

どのアルゴリズムやモードが「承認済み（approved）」かといった詳細は、**Appendix C（Cryptography Standards）** にまとめられています。なお、暗号を使って別の問題を解決する要件（シークレット管理や通信の保護など）は、この章ではなく他の章（V12 安全な通信、V13 設定 など）に置かれています。

### Appendix C の 3 区分（この章を読むための前提）

| 区分 | 意味 |
| --- | --- |
| Approved（A） | アプリケーションで使用してよい |
| Legacy（L） | 既存のレガシーとの互換性のためだけに使われ得る。それ自体が即脆弱性とはみなされないが、できるだけ早く置き換えるべき |
| Disallowed（D） | 破られている、または十分な安全性がないため使用してはならない |

例（Appendix C より）: ブロック暗号モードの GCM は A、CBC は L、ECB は D。ハッシュの MD5 は D、SHA-1 は L（HMAC・KDF・乱数生成・デジタル署名には不適）。

## 2. セクション構成

| セクション | 日本語名 | 何を扱うか（1行） | 要件数 |
| --- | --- | --- | :---: |
| V11.1 | 暗号の棚卸しと文書化 | 鍵管理ポリシー、暗号インベントリ、暗号利用箇所の発見、PQC への移行計画 | 4 |
| V11.2 | 安全な暗号実装 | 検証済み実装の利用、暗号アジリティ、128 ビット以上の強度、定数時間処理、安全な失敗 | 5 |
| V11.3 | 暗号化アルゴリズム | ECB・弱いパディングの禁止、承認済み暗号/モード、認証付き暗号、nonce/IV の一意性、encrypt-then-MAC | 5 |
| V11.4 | ハッシュとハッシュベースの関数 | 承認済みハッシュ、パスワード保存、衝突耐性と出力長、パスワードからの鍵導出 | 4 |
| V11.5 | 乱数 | CSPRNG と 128 ビット以上のエントロピー、高負荷時の安全性 | 2 |
| V11.6 | 公開鍵暗号 | 鍵生成・署名・鍵交換での承認済みアルゴリズムと安全なパラメータ | 2 |
| V11.7 | 使用中データの暗号保護 | フルメモリ暗号化、処理中のデータ最小化 | 2 |

L1 は V11.3.1、V11.3.2、V11.4.1 の 3 要件だけですが、パスワード保存（V11.4.2）や乱数（V11.5.1）など、実務で毎日のように関わる要件が L2 に並んでいます。

## 3. 押さえるべき重要要件

### V11.3.1 / V11.3.2 — ECB や弱いパディングを使わず、AES-GCM などの承認済み暗号を使う（L1）

- **要件（意訳）**:
  - V11.3.1: 安全でないブロックモード（例: ECB）や弱いパディング方式（例: PKCS#1 v1.5）が使われていないことを確認する。
  - V11.3.2: AES の GCM モードのような承認済みの暗号とモードだけが使われていることを確認する。
- **なぜ重要か**: ECB は同じ平文ブロックが同じ暗号文ブロックになるため、データのパターンがそのまま見えてしまいます（有名な「ECB ペンギン」の画像）。RSA の PKCS#1 v1.5 暗号化パディングは Bleichenbacher 攻撃などのパディングオラクル攻撃の対象になります。
- **実装のポイント**: 低レベル API でモードを自分で組み立てず、AES-GCM や ChaCha20-Poly1305 などの認証付き暗号（AEAD）の高水準 API を使う。RSA で暗号化する場合は OAEP を使う。

```python
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

# ❌ NG 例: ECB モード（パターンが漏れる・改ざん検知なし）
encryptor = Cipher(algorithms.AES(key), modes.ECB()).encryptor()
ct = encryptor.update(padded_plaintext) + encryptor.finalize()

# ✅ OK 例: AES-GCM（認証付き暗号）
aesgcm = AESGCM(key)                 # key = AESGCM.generate_key(bit_length=256)
nonce = os.urandom(12)               # 鍵ごとに決して再利用しない（V11.3.4）
ct = aesgcm.encrypt(nonce, plaintext, associated_data)
stored = nonce + ct
```

### V11.4.1 — 承認済みハッシュ関数だけを使い、MD5 は暗号用途に使わない（L1）

- **要件（意訳）**: デジタル署名、HMAC、KDF、乱数ビット生成を含む一般的な暗号用途に、承認済みのハッシュ関数だけを使っていることを確認する。MD5 のような禁止されたハッシュ関数は、いかなる暗号用途にも使ってはならない。
- **なぜ重要か**: MD5 や SHA-1 は衝突攻撃が実用化されており、署名の偽造や改ざん検知のすり抜けにつながります。
- **実装のポイント**: SHA-256 以上の SHA-2 系、SHA-3 系などの承認済みハッシュを使う（詳細は Appendix C）。「ファイルの重複検出用」など非暗号用途でも、セキュリティ判断に使われていないかを確認する。

```python
import hashlib, hmac

# ❌ NG 例: MD5 で改ざん検知用の MAC を作る
mac = hashlib.md5(secret + message).hexdigest()

# ✅ OK 例: HMAC-SHA-256
mac = hmac.new(secret, message, hashlib.sha256).hexdigest()
```

### V11.4.2 — パスワードは計算コストの高い KDF で保存する（L2）

- **要件（意訳）**: パスワードが、承認済みで計算コストの高い鍵導出関数（「パスワードハッシュ関数」とも呼ばれる）を使って保存されており、そのパラメータが現在のガイダンスに基づいて設定されていることを確認する。設定は、必要なセキュリティレベルに対して総当たり攻撃が十分困難になるよう、セキュリティとパフォーマンスのバランスを取ること。
- **なぜ重要か**: DB が漏えいしたとき、SHA-256 などの高速ハッシュだけで保存されたパスワードは GPU で高速に総当たりされます。
- **実装のポイント**: Appendix C で承認されているのは argon2id、scrypt、bcrypt、PBKDF2-HMAC-SHA-512/256 など。たとえば argon2id は「t = 1 のとき m ≥ 47104（46 MiB）、p = 1」、bcrypt は「cost ≥ 10」、PBKDF2-HMAC-SHA-256 は「iterations ≥ 600,000」が目安として示されています。

```python
import hashlib
from argon2 import PasswordHasher   # argon2-cffi

# ❌ NG 例: 高速ハッシュ（ソルトなし）
stored = hashlib.sha256(password.encode()).hexdigest()

# ✅ OK 例: argon2id（ソルトは自動生成・ハッシュ文字列に埋め込まれる）
ph = PasswordHasher(time_cost=1, memory_cost=47104, parallelism=1)
stored = ph.hash(password)
ph.verify(stored, password)          # 不一致なら例外
if ph.check_needs_rehash(stored):    # パラメータ更新時の再ハッシュ（暗号アジリティ）
    stored = ph.hash(password)
```

### V11.5.1 — 推測されてはならない値は CSPRNG で 128 ビット以上（L2）

- **要件（意訳）**: 推測不能であることを意図したすべての乱数・ランダム文字列が、暗号論的に安全な疑似乱数生成器（CSPRNG）で生成され、少なくとも 128 ビットのエントロピーを持つことを確認する。UUID はこの条件を満たさない点に注意。
- **なぜ重要か**: Python の `random` モジュール（メルセンヌ・ツイスタ）は出力をいくつか観測すると内部状態を復元でき、以降の値を予測されます。パスワードリセットトークンやセッション ID が予測できれば、アカウント乗っ取りに直結します。
- **実装のポイント**: Python なら `secrets` モジュール、JS なら `crypto.getRandomValues()` / `crypto.randomBytes()` を使う。UUID（v4 でもランダム部分は 122 ビット）を秘密トークンとして使わない。

```python
import random, uuid, secrets

# ❌ NG 例
reset_token = "".join(random.choices("abcdef0123456789", k=32))  # 予測可能
api_key = str(uuid.uuid4())                                      # 128 ビット未満、用途外

# ✅ OK 例: 32 バイト = 256 ビット
reset_token = secrets.token_urlsafe(32)
```

### V11.3.4 — nonce/IV を同じ鍵で再利用しない（L3）

- **要件（意訳）**: nonce、初期化ベクトル（IV）、その他の一度だけ使う値が、同じ「暗号鍵とデータ要素」の組に対して 2 回以上使われないことを確認する。生成方法は使用するアルゴリズムに適したものでなければならない。
- **なぜ重要か**: AES-GCM で同じ鍵と nonce を再利用すると、2 つの平文の XOR が漏れるだけでなく、認証鍵が復元されて改ざん（偽造）まで可能になります。
- **実装のポイント**: 固定値やカウンタのリセットを避ける。ランダム nonce を使う場合は、1 つの鍵で暗号化できる回数の上限にも注意し、必要なら鍵をローテーションする（XChaCha20-Poly1305 のように nonce が長い方式を選ぶのも手）。

```python
# ❌ NG 例: 固定 nonce
nonce = b"\x00" * 12
ct = AESGCM(key).encrypt(nonce, plaintext, None)

# ✅ OK 例: 暗号化ごとに新しい nonce を生成し、暗号文と一緒に保存
nonce = os.urandom(12)
ct = AESGCM(key).encrypt(nonce, plaintext, None)
```

### V11.2.2 — 暗号アジリティ（L2）

- **要件（意訳）**: アプリケーションが暗号アジリティを考慮して設計されており、乱数、認証付き暗号、MAC、ハッシュのアルゴリズム、鍵長、ラウンド数、暗号方式、モードを、暗号の危殆化に備えていつでも再設定・アップグレード・交換できることを確認する。同様に、鍵やパスワードの置き換えとデータの再暗号化も可能でなければならない。これにより、承認済みの耐量子暗号（PQC）方式の高保証な実装が広く利用可能になったときに、PQC へスムーズに移行できる。
- **なぜ重要か**: アルゴリズムをコードにハードコードし、暗号文に「どの方式・どの鍵で暗号化したか」の情報を持たせていないと、危殆化したときに移行できません。
- **実装のポイント**: 暗号文・ハッシュにバージョンや鍵 ID を付けて保存する。鍵ローテーションと再暗号化の手順を用意する。

```python
# ✅ OK 例: バージョンと鍵 ID を先頭に付けて保存し、将来の方式変更に備える
def encrypt_v1(key_id: str, plaintext: bytes) -> bytes:
    nonce = os.urandom(12)
    ct = AESGCM(KEYS[key_id]).encrypt(nonce, plaintext, key_id.encode())
    return b"v1:" + key_id.encode() + b":" + nonce + ct
```

### V11.2.4 — 定数時間処理（L3）

- **要件（意訳）**: すべての暗号処理が定数時間で行われ、比較・計算・リターンに「ショートサーキット（早期終了）」がなく、情報が漏れないことを確認する。
- **なぜ重要か**: `==` による文字列比較は最初の不一致で処理を打ち切るため、応答時間の差から MAC や トークンを 1 バイトずつ推測するタイミング攻撃が成り立ち得ます。
- **実装のポイント**:

```python
import hmac

# ❌ NG 例
if received_mac == expected_mac:
    ...

# ✅ OK 例: 定数時間比較
if hmac.compare_digest(received_mac, expected_mac):
    ...
```

### V11.1.2 — 暗号インベントリ（L2）

- **要件（意訳）**: 暗号インベントリが作成・維持・定期的に更新され、アプリケーションで使われるすべての暗号鍵、アルゴリズム、証明書を含んでいることを確認する。インベントリには、システム内で鍵を使ってよい場所・使ってはならない場所、鍵で保護してよいデータ・保護してはならないデータの種類も記載しなければならない。
- **なぜ重要か**: どこで何の暗号を使っているか分からなければ、アルゴリズムが危殆化したときや、鍵が漏えいしたときに影響範囲を特定できず、PQC への移行計画（V11.1.4）も立てられません。
- **実装のポイント**: 鍵・アルゴリズム・証明書・用途・保管場所・ローテーション周期・所有者を一覧化する。鍵の用途を限定し（暗号化用の鍵を署名に流用しない等）、それを文書に明記する。

## 4. よくある脆弱性・アンチパターン

- **自前の暗号実装**: 独自アルゴリズムや、低レベル API でのモード・パディングの手組み（V11.2.1, V11.3）。
- **ECB モード / 認証なしの CBC**: パターン漏えい、改ざん検知なし、パディングオラクル（V11.3.1, V11.3.3, V11.2.5）。
- **MAC-then-encrypt や encrypt-and-MAC**: 暗号と MAC を組み合わせるなら encrypt-then-MAC にする（V11.3.5）。
- **固定 IV / nonce の再利用**: 特に GCM では致命的（V11.3.4）。
- **MD5 / SHA-1 を署名や改ざん検知に使う**（V11.4.1, V11.4.3）。
- **パスワードを SHA-256 一回やソルトなしで保存**、または暗号化（可逆）して保存（V11.4.2）。
- **パスワードをそのまま鍵として使う**: `AES(key=password.ljust(32))` のような実装。鍵導出関数でストレッチングする（V11.4.4）。
- **`random` モジュールや `Math.random()` でトークン生成**、UUID を秘密値として使う（V11.5.1）。
- **短い鍵**: RSA 2048 ビットは約 112 ビット強度で、V11.2.3 の「128 ビット以上」を満たすには RSA 3072 ビット以上（または 256 ビット ECC）が必要。
- **`==` で MAC やトークンを比較**（V11.2.4）。
- **復号エラーの詳細を返す**: 「パディング不正」と「MAC 不一致」を区別して返すとオラクルになる（V11.2.5）。
- **鍵の使い回し・共有しすぎ**: 秘密鍵を複数システムで共有する（V11.1.1）。

## 5. 検証（テスト）のヒント

- **コード検索（SAST）**: `MD5`、`SHA1`、`ECB`、`DES`、`RC4`、`PKCS1v15`、`random.`、`Math.random`、`uuid4`（秘密値用途）、固定の IV/nonce、ハードコードされた鍵などを grep や Semgrep/CodeQL のルールで洗い出す。
- **暗号インベントリとの突き合わせ**: Appendix C の A/L/D 区分と照らして、L や D のアルゴリズムが残っていないか確認する（V11.1.2, V11.1.3）。
- **パスワードハッシュのパラメータ確認**: DB に保存されたハッシュ文字列のプレフィックス（`$argon2id$v=19$m=...,t=...,p=...`、`$2b$12$` など）から、アルゴリズムとパラメータを確認する（V11.4.2）。
- **暗号文の観察**: 同じ平文を 2 回暗号化して同じ暗号文になるなら、ECB や IV/nonce 固定の疑いがある（V11.3.1, V11.3.4）。
- **改ざんテスト**: 暗号文や MAC を 1 ビット変えて送り、拒否されるか、エラーメッセージや応答時間に差がないか確認する（V11.3.3, V11.2.5, V11.2.4）。
- **鍵長の確認**: 証明書や公開鍵の鍵長・曲線を確認する（V11.2.3, V11.6.1）。
- **乱数のサンプリング**: トークンを大量に取得し、長さ・文字種から推定されるエントロピーが 128 ビット以上あるか、規則性がないか確認する（V11.5.1）。

## 6. 確認問題

**Q1.** 次のうち、Appendix C で **Disallowed（使用禁止）** とされているブロック暗号モードはどれですか。
(a) GCM　(b) CBC　(c) ECB　(d) CCM

<details><summary>答えと解説</summary>

**(c) ECB** です。Appendix C では GCM は Approved、CBC は Legacy、ECB は Disallowed です。**V11.3.1**（L1）は ECB のような安全でないブロックモードを使わないことを求め、**V11.3.2**（L1）は AES-GCM のような承認済みの暗号とモードだけを使うことを求めています。

</details>

**Q2.** パスワードリセット用トークンを `str(uuid.uuid4())` で生成している。どの要件の観点で問題がありますか。

<details><summary>答えと解説</summary>

**V11.5.1**（L2）です。推測不能であるべき値は CSPRNG で生成し、少なくとも 128 ビットのエントロピーを持つ必要があり、原文は「UUID はこの条件を満たさない」と明記しています。`secrets.token_urlsafe(32)` などを使います。

</details>

**Q3.** 128 ビットのセキュリティ強度を得るために必要な RSA の鍵長と、ほぼ同等の強度を持つ ECC の鍵長を答えてください。また、これに関係する要件 ID は何ですか。

<details><summary>答えと解説</summary>

RSA は **3072 ビット**、ECC は **256 ビット** です。**V11.2.3**（L2）は、すべての暗号プリミティブが最低 128 ビットのセキュリティ強度を持つことを求めており、原文でこの例が挙げられています。

</details>

**Q4.** AES-GCM で暗号化する際、プログラムの簡略化のため nonce を固定値にした。どの要件に違反し、何が起こり得ますか。

<details><summary>答えと解説</summary>

**V11.3.4**（L3）違反です。nonce や IV は、同じ鍵とデータ要素の組で 2 回以上使ってはいけません。GCM で nonce を再利用すると、平文同士の XOR が漏れるほか、認証用の鍵が復元されてメッセージの偽造が可能になるおそれがあります。

</details>

**Q5.** 次の記述のうち、ASVS 5.0 の V11 の内容として**誤っている**ものを選んでください。
(a) パスワードは承認済みで計算コストの高い KDF で保存する（V11.4.2）
(b) 暗号化と MAC を組み合わせる場合は encrypt-then-MAC にする（V11.3.5）
(c) 衝突耐性が必要なハッシュの出力長は 128 ビット以上あれば十分である（V11.4.3）
(d) 暗号処理は定数時間で行い、比較で早期終了しない（V11.2.4）

<details><summary>答えと解説</summary>

**(c)** が誤りです。**V11.4.3**（L2）では、衝突耐性が必要な場合の出力長は**少なくとも 256 ビット**、第二原像耐性だけが必要な場合は少なくとも 128 ビットとされています。

</details>

## 7. 関連リソース

- OWASP Cheat Sheet: [Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
- OWASP WSTG: [Testing for Weak Cryptography](https://owasp.org/www-project-web-security-testing-guide/stable/4-Web_Application_Security_Testing/09-Testing_for_Weak_Cryptography)
- [NIST SP 800-57 Part 1 Rev. 5](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final) / [FIPS 140-3](https://csrc.nist.gov/pubs/fips/140-3/final)
- ASVS 5.0 Appendix C: [0x92-Appendix-C_Cryptography.md](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x92-Appendix-C_Cryptography.md)
- 関連する章: V6（認証 ― パスワード）、V7（セッション管理）、V9（自己完結型トークン）、V12（安全な通信）、V13（設定 ― シークレット管理）、V14（データ保護）
