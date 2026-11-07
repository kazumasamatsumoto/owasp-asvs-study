# OWASP ASVS 5.0 を日本語で学ぶ

[OWASP Application Security Verification Standard (ASVS) 5.0.0](https://github.com/OWASP/ASVS) を、**日本語の解説・確認問題・手を動かす演習**で学ぶためのリポジトリです。

> ASVS は「Web アプリが満たすべきセキュリティ要件」を 17 章・約 350 項目にまとめた OWASP の検証基準です。
> OWASP Top 10 が「よくある危険」なら、ASVS は「やるべき対策のチェックリスト」です。

## このリポジトリでできること

| | 内容 | 場所 |
| --- | --- | --- |
| 📖 | 全 17 章の日本語解説（重要要件・NG/OK コード例・よくある脆弱性・テスト観点） | [docs/chapters/](docs/chapters/) |
| ❓ | 各章 5 問の確認問題（答え・解説付き） | 各章の末尾 |
| 🧪 | 脆弱なコードを直してテストを通すハンズオン 8 本（Python 標準ライブラリのみ） | [labs/](labs/) |
| ✅ | レベル別・章別チェックリストと、自分のアプリを評価する CSV テンプレート | [checklists/](checklists/) |
| 🃏 | 要件のレベル／章を当てるターミナル用フラッシュカード | [tools/flashcards.py](tools/flashcards.py) |

## はじめかた

```bash
git clone https://github.com/kazumasamatsumoto/owasp-asvs-study.git
cd owasp-asvs-study

# 1. 全体像を読む → 開発でやりがちな穴を知る
open docs/00-what-is-asvs.md
open docs/01-developer-pitfalls.md

# 2. ハンズオン（最初は全部失敗します。exercise.py を直して緑にしましょう）
python3 labs/run.py lab01

# 3. フラッシュカードで復習
python3 tools/flashcards.py --level 1
```

学習の順番は [docs/study-plan.md](docs/study-plan.md)（6 週間プラン）を参照してください。

## 目次

### 入門
- [00. ASVS とは何か — レベル・要件 ID・Top 10 との違い](docs/00-what-is-asvs.md)
- [01. アプリを作るときに「穴」を作らないために — 機能別のやりがちなミスと対策](docs/01-developer-pitfalls.md) ⭐ 開発者はまずここ
- [学習計画](docs/study-plan.md)

### 章別解説

| 章 | テーマ | 要件数 | L1 | L2 | L3 | 演習 |
| --- | --- | :---: | :---: | :---: | :---: | --- |
| [V1](docs/chapters/V01-encoding-and-sanitization.md) | エンコーディングとサニタイズ | 30 | 8 | 19 | 3 | [Lab01](labs/lab01_sql_injection/) [Lab02](labs/lab02_output_encoding/) |
| [V2](docs/chapters/V02-validation-and-business-logic.md) | 入力検証とビジネスロジック | 13 | 4 | 7 | 2 | |
| [V3](docs/chapters/V03-web-frontend-security.md) | Web フロントエンドセキュリティ | 31 | 8 | 11 | 12 | [Lab06](labs/lab06_session/) [Lab07](labs/lab07_security_headers/) |
| [V4](docs/chapters/V04-api-and-web-service.md) | API と Web サービス | 16 | 2 | 8 | 6 | |
| [V5](docs/chapters/V05-file-handling.md) | ファイル処理 | 13 | 4 | 5 | 4 | [Lab05](labs/lab05_file_upload/) |
| [V6](docs/chapters/V06-authentication.md) | 認証 | 47 | 13 | 22 | 12 | [Lab03](labs/lab03_password_storage/) |
| [V7](docs/chapters/V07-session-management.md) | セッション管理 | 19 | 6 | 12 | 1 | [Lab06](labs/lab06_session/) |
| [V8](docs/chapters/V08-authorization.md) | 認可 | 13 | 4 | 3 | 6 | [Lab04](labs/lab04_idor/) |
| [V9](docs/chapters/V09-self-contained-tokens.md) | 自己完結型トークン（JWT 等） | 7 | 4 | 3 | 0 | [Lab08](labs/lab08_jwt_verification/) |
| [V10](docs/chapters/V10-oauth-and-oidc.md) | OAuth と OIDC | 36 | 5 | 24 | 7 | |
| [V11](docs/chapters/V11-cryptography.md) | 暗号 | 24 | 3 | 11 | 10 | [Lab03](labs/lab03_password_storage/) |
| [V12](docs/chapters/V12-secure-communication.md) | 安全な通信 | 12 | 3 | 6 | 3 | |
| [V13](docs/chapters/V13-configuration.md) | 設定 | 21 | 1 | 12 | 8 | |
| [V14](docs/chapters/V14-data-protection.md) | データ保護 | 13 | 2 | 7 | 4 | |
| [V15](docs/chapters/V15-secure-coding-and-architecture.md) | セキュアコーディングとアーキテクチャ | 21 | 3 | 10 | 8 | |
| [V16](docs/chapters/V16-security-logging-and-error-handling.md) | セキュリティログとエラー処理 | 17 | 0 | 16 | 1 | |
| [V17](docs/chapters/V17-webrtc.md) | WebRTC | 12 | 0 | 7 | 5 | |
| | **合計** | **345** | **70** | **183** | **92** | |

> レベルは累積です。L2 準拠 = L1 + L2 の 253 要件、L3 準拠 = 全 345 要件。

### チェックリスト
- [L1（70 件）](checklists/L1.md) / [L2（253 件）](checklists/L2.md) / [L3（345 件）](checklists/L3.md)
- [章別の全要件](checklists/by-chapter/)
- [評価用 CSV テンプレート](checklists/assessment-template.csv) — コピーして `status` / `evidence` 列を埋めて使う

## リポジトリ構成

```
.
├── docs/
│   ├── 00-what-is-asvs.md      # 入門
│   ├── 01-developer-pitfalls.md # 開発者向け: 機能別のやりがちな穴
│   ├── study-plan.md           # 学習計画
│   └── chapters/V01..V17-*.md  # 章別解説 + 確認問題
├── labs/                       # ハンズオン（exercise.py を直す → test_lab.py が通る）
├── checklists/                 # 自動生成チェックリスト（編集しない）
├── data/                       # ASVS 5.0.0 公式 CSV / JSON（英語原文）
└── tools/
    ├── generate_checklists.py  # data/ → checklists/ を生成
    └── flashcards.py           # フラッシュカード
```

## 注意事項

- 解説は学習目的の**非公式な日本語要約**です。正確な要件文は必ず[原文](https://github.com/OWASP/ASVS/tree/master/5.0/en)を参照してください。
- 要件データは OWASP/ASVS リポジトリ（コミット `62981c6`）の `5.0/docs_en` から取得しています。
- 演習コードは学習用の最小実装です。本番ではフレームワークや実績あるライブラリを使ってください。

## ライセンス

- ドキュメント・データ: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)（OWASP ASVS © OWASP Foundation の派生物）
- コード（`tools/`, `labs/`）: MIT

詳細は [LICENSE](LICENSE) を参照してください。
