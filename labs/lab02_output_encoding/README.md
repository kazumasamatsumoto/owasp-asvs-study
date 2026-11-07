# Lab 02: 出力エンコーディングと安全な URL（V1.2.1 / V1.2.2 / V1.2.3）

## 対応する ASVS 要件
- **V1.2.1 (L1)** HTML 要素・属性などコンテキストに応じた出力エンコーディング
- **V1.2.2 (L1)** URL を動的に組み立てるときのエンコードと、安全なスキームのみ許可（`javascript:` / `data:` を拒否）
- **V1.2.3 (L1)** JavaScript / JSON を動的に生成するときのエスケープ

## 課題
`exercise.py` の 3 つの関数を修正してください。

1. `render_comment(author, body)` … `<div class="comment"><b>{author}</b>: {body}</div>` を返す。HTML として安全に。
2. `render_profile_link(name, url)` … `<a href="{url}">{name}</a>` を返す。`http` / `https` 以外のスキーム（相対 URL も含む）は `ValueError`。
3. `render_inline_state(state)` … `<script>window.__STATE__ = {json};</script>` を返す。`</script>` で抜けられないように。

## 実行
```bash
python3 labs/run.py lab02
```
