# 🧪 ハンズオン演習

ASVS の要件を**テストで確かめながら**実装して学ぶ演習です。Python 3.10 以上・標準ライブラリだけで動きます。

各ディレクトリの構成:

| ファイル | 内容 |
| --- | --- |
| `README.md` | 課題と対応する ASVS 要件 |
| `exercise.py` | ✏️ **あなたが直すファイル**（脆弱な実装） |
| `test_lab.py` | 要件を検証するテスト（編集しない） |
| `solution.py` | 模範解答（解き終わってから見る） |

## 実行方法

```bash
python3 labs/run.py              # 全演習（最初は全部失敗します）
python3 labs/run.py lab01        # 1 つだけ
python3 labs/run.py --solution   # 模範解答がテストを通ることの確認
```

## 演習一覧

| Lab | テーマ | 主な要件 | 章 |
| --- | --- | --- | --- |
| [01](lab01_sql_injection/) | SQL インジェクション | V1.2.4 | V1 |
| [02](lab02_output_encoding/) | XSS・出力エンコード・URL スキーム | V1.2.1–V1.2.3 | V1 |
| [03](lab03_password_storage/) | パスワードポリシーとハッシュ保存 | V6.2.x, V11.4.2 | V6 / V11 |
| [04](lab04_idor/) | IDOR / BOLA / Mass Assignment | V8.2.1–V8.2.3 | V8 |
| [05](lab05_file_upload/) | アップロード検証・Zip Slip・Zip 爆弾 | V5.2.x, V5.3.2–3 | V5 |
| [06](lab06_session/) | セッション固定・タイムアウト・Cookie 属性 | V7.2–V7.4, V3.3.x | V7 / V3 |
| [07](lab07_security_headers/) | HSTS・CSP・CORS などのヘッダ | V3.4.x | V3 |
| [08](lab08_jwt_verification/) | JWT の署名・alg・exp・aud 検証 | V9.1.x, V9.2.x | V9 |

> ⚠️ これらは学習用の最小実装です。本番では実績あるフレームワーク・ライブラリの機能を使ってください。
