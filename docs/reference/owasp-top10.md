# OWASP Top 10:2025

OWASP Top 10 は、Web アプリの代表的なセキュリティリスクを 10 個にまとめた**啓発用のランキング**です。数年ごとに改訂され、最新は 2025 年版です。

Top 10 は「何が危ないか」を知るためのものです。「具体的に何をすればよいか」を確認するときは ASVS を使います。

[← 一覧に戻る](README.md)

## 一覧

| ID | カテゴリ（原文） | 日本語の意味 | 典型的な例 | 主な CWE | ASVS の章 |
| --- | --- | --- | --- | --- | --- |
| A01 | Broken Access Control | アクセス制御の不備 | 他人のデータが見える（IDOR）、一般ユーザーが管理画面を使える、SSRF | 862, 863, 284, 639, 22, 352, 918, 200 | [V8](../chapters/V08-authorization.md) |
| A02 | Security Misconfiguration | セキュリティ設定のミス | デバッグモードのまま公開、デフォルトパスワード、不要な機能が有効、ヘッダー未設定 | 16, 611 | [V13](../chapters/V13-configuration.md), [V3](../chapters/V03-web-frontend-security.md) |
| A03 | Software Supply Chain Failures | ソフトウェアサプライチェーンの不備 | 脆弱・改ざんされた依存ライブラリ、ビルド環境の侵害 | 1104, 1395 | [V15](../chapters/V15-secure-coding-and-architecture.md) |
| A04 | Cryptographic Failures | 暗号の不備 | 平文での保存・通信、弱いアルゴリズム、鍵のハードコード | 327, 328, 798 | [V11](../chapters/V11-cryptography.md), [V12](../chapters/V12-secure-communication.md) |
| A05 | Injection | インジェクション | SQL インジェクション、XSS、OS コマンドインジェクション | 79, 89, 78, 77, 94 | [V1](../chapters/V01-encoding-and-sanitization.md) |
| A06 | Insecure Design | 安全でない設計 | 試行回数の制限がない、ビジネスロジックの抜け穴 | 434, 770, 840 | [V2](../chapters/V02-validation-and-business-logic.md), [V15](../chapters/V15-secure-coding-and-architecture.md) |
| A07 | Authentication Failures | 認証の不備 | 弱いパスワードを許可、総当たり対策なし、セッション固定 | 287, 306, 307, 384 | [V6](../chapters/V06-authentication.md), [V7](../chapters/V07-session-management.md) |
| A08 | Software or Data Integrity Failures | ソフトウェアやデータの完全性の不備 | 署名を検証しない更新、信頼できないデータのデシリアライズ | 502, 345, 494 | [V9](../chapters/V09-self-contained-tokens.md), [V15](../chapters/V15-secure-coding-and-architecture.md) |
| A09 | Security Logging and Alerting Failures | ログとアラートの不備 | ログイン失敗を記録しない、攻撃に気づけない、ログに機密情報 | 778, 532, 117 | [V16](../chapters/V16-security-logging-and-error-handling.md) |
| A10 | Mishandling of Exceptional Conditions | 例外的な状況の扱いの不備 | エラー時に認可チェックをスキップ（fail-open）、スタックトレースの表示 | 703, 755, 476, 209 | [V16](../chapters/V16-security-logging-and-error-handling.md) |

> 「主な CWE」は学習用に代表的なものを選んだものです。全件は各カテゴリの公式ページの「Mapped CWEs」を参照してください。

## 2021 年版からの主な変更

| 変更 | 内容 |
| --- | --- |
| **新規** | A03 Software Supply Chain Failures（2021 の「脆弱で古いコンポーネント」を拡張）、A10 Mishandling of Exceptional Conditions |
| **統合** | SSRF（2021 の A10）が A01 Broken Access Control に統合 |
| **順位上昇** | Security Misconfiguration が A05 → A02 |
| **名称変更** | Identification and Authentication Failures → Authentication Failures、Logging and Monitoring → Logging and Alerting |

## 確認問題

1. 本番環境でエラー画面にスタックトレースと SQL 文が表示されている。該当しそうなカテゴリを 2 つ挙げよ。
2. `npm install` した依存パッケージが乗っ取られ、悪意のあるコードが含まれていた。該当するカテゴリは何か。
3. 認可サーバーへの問い合わせがタイムアウトしたとき、「とりあえず許可」して処理を続けるコードがある。該当するカテゴリは何か。

<details>
<summary>答え</summary>

1. A02 Security Misconfiguration（本番でデバッグ表示が有効）と A10 Mishandling of Exceptional Conditions（エラー時の情報露出）
2. A03 Software Supply Chain Failures
3. A10 Mishandling of Exceptional Conditions（fail-open）。結果として A01 の認可の不備にもつながる。

</details>

出典：[OWASP Top 10:2025](https://top10.owasp.org/2025)
