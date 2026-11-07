# Lab 03: パスワードポリシーと安全な保存（V6.2 / V11.4.2）

## 対応する ASVS 要件
- **V6.2.1 (L1)** 8 文字以上（15 文字以上を強く推奨）
- **V6.2.4 (L1)** よく使われるパスワード（上位 3000 件以上）と照合して拒否
- **V6.2.5 (L1)** 文字種の組み合わせルール（大文字・数字・記号必須など）を課さない
- **V6.2.8 (L1)** 受け取ったパスワードを切り詰めたり大文字小文字変換したりせずに検証
- **V6.2.9 (L2)** 64 文字以上のパスワードを許可
- **V11.4.2 (L2)** 計算コストの高いパスワードハッシュ関数（KDF）で保存

## 課題
`exercise.py` は「よくあるダメな実装」です。以下を満たすように直してください。

- `validate_password(pw)` … 問題があれば `ValueError`。8 文字未満・`common_passwords.txt` に含まれる（大文字小文字無視）ものを拒否。文字種ルールは**課さない**。最大長は 64 文字以上を許可すること（DoS 対策の上限は 1024 程度に）。
- `hash_password(pw)` … ソルト付きで低速な KDF（`hashlib.scrypt` または `hashlib.pbkdf2_hmac`）を使い、パラメータも含めた文字列を返す。
- `verify_password(pw, stored)` … 定数時間比較（`hmac.compare_digest`）で検証。

> ⚠️ 本番では `argon2-cffi` や `bcrypt` などの実績あるライブラリを使い、パラメータは
> [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) に従ってください。
> `common_passwords.txt` は演習用の縮小版です（要件は上位 3000 件以上）。

## 実行
```bash
python3 labs/run.py lab03
```
