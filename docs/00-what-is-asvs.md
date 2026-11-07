# 00. ASVS とは何か

> 📘 原文: [0x03-What-is-the-ASVS.md](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x03-What-is-the-ASVS.md) / [0x04-Assessment_and_Certification.md](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x04-Assessment_and_Certification.md)

## ひとことで

**OWASP ASVS（Application Security Verification Standard）** は、Web アプリケーションと Web サービスが満たすべき**セキュリティ要件のカタログ**です。
「何を検証すれば安全と言えるか」を、合格／不合格で判定できる形で列挙しています。

- 最新版: **5.0.0**（2025 年 5 月公開）
- 規模: **17 章・約 350 要件**（このリポジトリの [CSV](../data/asvs-5.0.0-en.csv) では 345 件）
- ライセンス: CC BY-SA 4.0

## OWASP Top 10 との違い

| | OWASP Top 10 | OWASP ASVS |
| --- | --- | --- |
| 性格 | **啓発文書**。「よくある危険」トップ 10 | **検証基準**。「満たすべき要件」の網羅的なリスト |
| 粒度 | カテゴリ単位（例: A01 Broken Access Control） | 要件単位（例: V8.2.2 データレベルの認可） |
| 使い方 | 意識づけ・教育の入口 | 設計・実装・テスト・監査・調達の基準 |
| 判定 | できない | 各要件を pass / fail で判定できる |

Top 10 が「やってはいけないこと」なら、ASVS は「やるべきこと（ポジティブな対策）」です。

## ASVS の 4 つのキーワード

原文はスコープを名前の 4 語で説明しています。

- **Application** — 開発しているソフトウェアそのもの。WAF やロードバランサなども、セキュリティ制御を担う範囲では含まれる。DNS やバックアップなどアプリの責任外のものは対象外。
- **Security** — 要件はすべてセキュリティに直接効くこと。コードスタイルや機能要件は対象外。
- **Verification** — 要件は検証可能で、結果が pass / fail になること。
- **Standard** — 「どう実装するか」ではなく「何を達成するか」を定める。実装方法は OWASP Cheat Sheet Series など他プロジェクトの役割。

## 3 つのレベル

| レベル | 位置づけ | 要件の割合（原文） | このリポジトリの CSV |
| --- | --- | --- | --- |
| **L1** | 最低限の出発点。他の脆弱性を前提とせずに悪用される一般的な攻撃への第一防御 | 約 20% | 70 件 |
| **L2** | **ほとんどのアプリが目指すべきレベル**。より巧妙な攻撃や複雑な防御 | 約 50%（L1+L2 で約 70%） | +183 件（累計 253） |
| **L3** | 最高水準を示したいアプリ向け。多層防御・実装の難しい対策 | 約 30% | +92 件（累計 345） |

ポイント:

- レベルは**累積**です。L2 準拠 = L1 と L2 の要件をすべて満たすこと。
- CSV の `L` 列は「その要件が**初めて必須になる**レベル」です。
- どのレベルを目指すかは ASVS が決めるのではなく、**組織がリスク分析して決める**。原文の例: 機微データの少ない初期スタートアップは L1、オンラインバンキングは L3 未満を正当化するのは難しい。
- L1 は「ブラックボックスのペネトレーションテストだけで検証できる」とは限らない（ドキュメントやコードの確認が必要な要件もある）。

## 要件 ID の読み方

```
v5.0.0-1.2.5
│      │ │ └─ 要件番号（requirement）
│      │ └─── セクション（V1.2 Injection Prevention）
│      └───── 章（V1 Encoding and Sanitization）
└──────────── ASVS のバージョン（v は小文字）
```

- 要件番号はバージョン間で変わりうるので、レポートやツールでは **`v5.0.0-1.2.5` のようにバージョン付きで書く**ことが推奨されています。
- バージョンなしの ID は「最新版」を指すとみなされます。

## 「ドキュメント要件」という考え方

多くの章の**最初のセクション**は「◯◯ Documentation」です（例: V6.1 Authentication Documentation）。
「すべてのデータを暗号化せよ」のような一律ルールではなく、

1. 組織として**どう実装するかを決めて文書化**する（ドキュメント要件）
2. その決定どおりに**実装されているか**を検証する（対応する実装要件）

という 2 段構えになっています。たとえばセッションタイムアウトの時間は ASVS が固定値で決めるのではなく、リスク分析に基づいて文書化した値を守っているかを検証します（V7.1.1 → V7.3.1 / V7.3.2）。

## 17 章の全体像

| 章 | 名前 | ざっくり言うと | 要件数 |
| --- | --- | --- | :---: |
| [V1](chapters/V01-encoding-and-sanitization.md) | Encoding and Sanitization | インジェクション対策・出力エンコード | 30 |
| [V2](chapters/V02-validation-and-business-logic.md) | Validation and Business Logic | 入力検証・業務ロジック・自動化対策 | 13 |
| [V3](chapters/V03-web-frontend-security.md) | Web Frontend Security | Cookie・セキュリティヘッダ・ブラウザ側の防御 | 31 |
| [V4](chapters/V04-api-and-web-service.md) | API and Web Service | HTTP メッセージ・GraphQL・WebSocket | 16 |
| [V5](chapters/V05-file-handling.md) | File Handling | アップロード・保存・ダウンロード | 13 |
| [V6](chapters/V06-authentication.md) | Authentication | パスワード・MFA・認証フロー | 47 |
| [V7](chapters/V07-session-management.md) | Session Management | セッショントークン・タイムアウト・終了 | 19 |
| [V8](chapters/V08-authorization.md) | Authorization | 機能・データ・フィールドレベルの認可 | 13 |
| [V9](chapters/V09-self-contained-tokens.md) | Self-contained Tokens | JWT などの検証 | 7 |
| [V10](chapters/V10-oauth-and-oidc.md) | OAuth and OIDC | クライアント・認可サーバー・RS・OP | 36 |
| [V11](chapters/V11-cryptography.md) | Cryptography | アルゴリズム・鍵管理・乱数・ハッシュ | 24 |
| [V12](chapters/V12-secure-communication.md) | Secure Communication | TLS・サービス間通信 | 12 |
| [V13](chapters/V13-configuration.md) | Configuration | シークレット管理・情報漏えい防止 | 21 |
| [V14](chapters/V14-data-protection.md) | Data Protection | 機微データの分類と保護 | 13 |
| [V15](chapters/V15-secure-coding-and-architecture.md) | Secure Coding and Architecture | 依存関係・危険な機能・並行処理 | 21 |
| [V16](chapters/V16-security-logging-and-error-handling.md) | Security Logging and Error Handling | セキュリティログ・エラー処理 | 17 |
| [V17](chapters/V17-webrtc.md) | WebRTC | TURN・メディア・シグナリング | 12 |

API だけのサービスなら V3 の大半、OAuth や WebRTC を使わないなら V10 / V17 は対象外にできます。
原文は、組織ごとに不要な部分を省いた**フォーク（独自版）を作る**ことも推奨しています（ただし要件 ID の追跡性は保つ）。

## ASVS の使いみち（原文より）

- セキュリティアーキテクチャの設計ガイド
- セキュアコーディング規約のベース
- **自動化されたユニットテスト・結合テストの指針**（→ このリポジトリの [labs/](../labs/) はこの発想）
- セキュア開発トレーニングのカリキュラム
- ソフトウェア調達時の要求事項（「ASVS レベル X で開発すること」）

## 次に読むもの

- 学習計画: [study-plan.md](study-plan.md)
- 最初の章: [V1 エンコーディングとサニタイズ](chapters/V01-encoding-and-sanitization.md)
