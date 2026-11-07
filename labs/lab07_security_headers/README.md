# Lab 07: セキュリティヘッダと CORS（V3.4）

## 対応する ASVS 要件
- **V3.4.1 (L1)** `Strict-Transport-Security`（max-age 1 年以上。L2 以上は `includeSubDomains`）
- **V3.4.2 (L1)** CORS の `Access-Control-Allow-Origin` は固定値か、許可リストで検証した Origin
- **V3.4.3 (L2)** `Content-Security-Policy`（最低限 `object-src 'none'` と `base-uri 'none'`、nonce/hash か許可リスト）
- **V3.4.4 (L2)** `X-Content-Type-Options: nosniff`
- **V3.4.5 (L2)** `Referrer-Policy`
- **V3.4.6 (L2)** CSP の `frame-ancestors` でフレーム埋め込みを制限
- **V3.4.8 (L3)** HTML レスポンスに `Cross-Origin-Opener-Policy: same-origin`

## 課題
`exercise.py` の `security_headers(request_origin, nonce)` を修正し、レスポンスに付けるヘッダの dict を返してください。

- CORS 許可リスト: `ALLOWED_ORIGINS`。リストに無い Origin には `Access-Control-Allow-Origin` を付けない
- Origin を反映する場合は `Vary: Origin` も付ける
- CSP は `script-src 'nonce-{nonce}'` を使う（`'unsafe-inline'` は使わない）

## 実行
```bash
python3 labs/run.py lab07
```
