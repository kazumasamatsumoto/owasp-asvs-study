# Lab 01: SQL インジェクション（V1.2.4）

## 対応する ASVS 要件
- **V1.2.4 (L1)** データベースクエリはパラメータ化クエリ / ORM などで SQL インジェクションから保護されていること

## 課題
`exercise.py` の `find_user()` と `search_products()` は文字列連結で SQL を組み立てています。
パラメータ化クエリを使って安全にしてください。

- `find_user(conn, username)` … ユーザー名完全一致で 1 件返す（無ければ `None`）
- `search_products(conn, keyword, sort)` … 商品名の部分一致検索。`sort` は `"name"` か `"price"` のみ許可（それ以外は `ValueError`）

> 💡 ヒント: カラム名や ORDER BY 句はプレースホルダ（`?`）にできません。許可リストで検証しましょう。

## 実行
```bash
python3 labs/run.py lab01
```
