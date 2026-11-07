# Lab 08: JWT（自己完結型トークン）の検証（V9.1 / V9.2）

## 対応する ASVS 要件
- **V9.1.1 (L1)** 署名 / MAC を検証してから中身を信用する
- **V9.1.2 (L1)** 許可リストのアルゴリズムだけを使う（`none` は不可）
- **V9.2.1 (L1)** `nbf` / `exp` がある場合は有効期間を検証
- **V9.2.3 (L2)** `aud` が自サービス向けかを許可リストで検証

## 課題
`exercise.py` の `verify_token(token, key, audience, now)` を修正してください（HS256 のみ対応、標準ライブラリだけで実装）。
問題があれば `InvalidToken` を送出し、正しければ claims の dict を返します。

- ヘッダの `alg` は `HS256` のみ許可（`none`, `HS512`, `RS256` などは拒否）
- 署名は `hmac.compare_digest` で比較
- `exp` は `now` より未来、`nbf` は `now` 以前であること（許容誤差 `LEEWAY` 秒）
- `aud` は文字列またはリスト。`audience` を含まなければ拒否

> ⚠️ 本番では自作せず [PyJWT](https://pyjwt.readthedocs.io/) などのライブラリを使い、`algorithms=["HS256"]` と `audience=` を必ず指定してください。
> この演習は「ライブラリが内部で何を検証しているか」を理解するためのものです。

## 実行
```bash
python3 labs/run.py lab08
```
