# Lab 09: CSRF（クロスサイトリクエストフォージェリ）（V3.5）

## 対応する ASVS 要件
- **V3.5.1 (L1)** 機密機能へのリクエストが、アプリ自身から出されたものであることを確かめる（偽造防止トークンなど）
- **V3.5.3 (L1)** 機密機能は POST などのメソッドで受け、GET などの「安全」なメソッドでは受けない

## 課題
`exercise.py` の `transfer(method, cookies, headers, form)` は送金の処理です。
今は Cookie のセッションだけを見ているので、ほかのサイトに置かれたフォームや画像からでも送金できてしまいます。

次のように直してください。問題があれば `Forbidden` を送出します。

- セッションが無ければ拒否（今のまま）
- メソッドが `POST` 以外なら拒否
- `Origin` ヘッダが `ALLOWED_ORIGINS` に完全一致しなければ拒否（ヘッダが無い場合も拒否）
- フォームの `csrf_token` が、そのセッションの CSRF トークンと一致しなければ拒否（`hmac.compare_digest` で比べる）

> ⚠️ 本番ではフレームワークの CSRF 対策（Django の `CsrfViewMiddleware` など）を使い、
> セッションの Cookie には `SameSite=Lax` 以上を付けてください。

## 実行
```bash
python3 labs/run.py lab09
```
