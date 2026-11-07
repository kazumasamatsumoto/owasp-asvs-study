# Lab 04: 認可 — IDOR / BOLA / BOPLA（V8.2.1〜V8.2.3）

## 対応する ASVS 要件
- **V8.2.1 (L1)** 機能レベルのアクセス制御（明示的な権限を持つ利用者だけが機能を使える）
- **V8.2.2 (L1)** データレベルのアクセス制御（IDOR / BOLA 対策）
- **V8.2.3 (L2)** フィールドレベルのアクセス制御（BOPLA 対策 = Mass Assignment など）

## 課題
請求書 API のサービス層 `InvoiceService` を修正してください。ルール:

| 操作 | 一般ユーザー (`role="user"`) | 管理者 (`role="admin"`) |
| --- | --- | --- |
| `get_invoice` | 自分の請求書のみ | 全件 |
| `update_invoice` | 自分の請求書の `memo` だけ変更可 | `memo` / `status` / `amount` を変更可 |
| `delete_invoice` | ❌ 不可 | ✅ 可 |

- 他人の請求書・存在しない請求書は**どちらも** `NotFound`（存在の有無を漏らさない）
- 機能・フィールドの権限がない場合は `Forbidden`
- 許可されていないフィールドを 1 つでも含む更新は**丸ごと**拒否（一部だけ反映しない）

## 実行
```bash
python3 labs/run.py lab04
```
