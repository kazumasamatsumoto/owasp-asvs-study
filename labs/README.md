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
| [09](lab09_csrf/) | CSRF（Origin・偽造防止トークン・メソッド） | V3.5.1, V3.5.3 | V3 |
| [10](lab10_path_traversal/) | パストラバーサル（../・絶対パス） | V5.3.2 | V5 |
| [11](lab11_command_injection/) | OS コマンドインジェクション（shell=True） | V1.2.5 | V1 |
| [12](lab12_ssrf/) | SSRF（メタデータ・localhost・DNS で内部 IP） | V1.3.6 | V1 |
| [13](lab13_deserialization/) | 安全でないデシリアライズ（pickle → JSON と形の確認） | V1.5.2 | V1 |
| [14](lab14_missing_authorization/) | 認可チェックの欠如（会員が管理者の操作をできる） | V8.2.1, V8.3.1 | V8 |
| [15](lab15_code_injection/) | コードインジェクション（eval をやめて式を木で計算） | V1.3.2 | V1 |
| [16](lab16_missing_authentication/) | 重要な機能に認証がない（運用向けの道の守り忘れ） | V8.2.1, V13.4.5 | V8 / V13 |
| [17](lab17_rate_limit/) | 回数制限がない（パスワードの総当たり） | V6.3.1, V2.4.1 | V6 / V2 |

> ⚠️ これらは学習用の最小実装です。本番では実績あるフレームワーク・ライブラリの機能を使ってください。
