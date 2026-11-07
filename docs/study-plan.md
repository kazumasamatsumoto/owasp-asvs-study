# 学習計画（目安: 6 週間）

1 日 30〜60 分を想定しています。各週の終わりに [フラッシュカード](../tools/flashcards.py) で復習しましょう。

## 進め方（各章共通）

1. 章の日本語解説（`docs/chapters/`）を読む
2. 原文（英語）の該当章を斜め読みして、要件の言い回しに慣れる
3. 章末の確認問題を解く
4. 対応するハンズオン（`labs/`）があれば解く
5. [チェックリスト](../checklists/) で、自分が関わるアプリについて pass / fail を考えてみる

## Week 0: 全体像

- [ ] [00. ASVS とは何か](00-what-is-asvs.md)
- [ ] [01. アプリを作るときに「穴」を作らないために](01-developer-pitfalls.md)（各章を読み終えたあとにも読み返す）
- [ ] `python3 tools/flashcards.py --level 1 -n 10` で L1 要件の雰囲気をつかむ

## Week 1: インジェクションと入力（最頻出）

- [ ] [V1 エンコーディングとサニタイズ](chapters/V01-encoding-and-sanitization.md) → 🧪 Lab 01, Lab 02
- [ ] [V2 入力検証とビジネスロジック](chapters/V02-validation-and-business-logic.md)
- [ ] [V5 ファイル処理](chapters/V05-file-handling.md) → 🧪 Lab 05

## Week 2: 認証とセッション

- [ ] [V6 認証](chapters/V06-authentication.md) → 🧪 Lab 03
- [ ] [V7 セッション管理](chapters/V07-session-management.md) → 🧪 Lab 06

## Week 3: 認可とトークン

- [ ] [V8 認可](chapters/V08-authorization.md) → 🧪 Lab 04
- [ ] [V9 自己完結型トークン](chapters/V09-self-contained-tokens.md) → 🧪 Lab 08
- [ ] [V10 OAuth と OIDC](chapters/V10-oauth-and-oidc.md)

## Week 4: ブラウザと API

- [ ] [V3 Web フロントエンドセキュリティ](chapters/V03-web-frontend-security.md) → 🧪 Lab 07
- [ ] [V4 API と Web サービス](chapters/V04-api-and-web-service.md)
- [ ] [V17 WebRTC](chapters/V17-webrtc.md)（使っていなければ流し読みで OK）

## Week 5: 暗号・通信・データ

- [ ] [V11 暗号](chapters/V11-cryptography.md)
- [ ] [V12 安全な通信](chapters/V12-secure-communication.md)
- [ ] [V14 データ保護](chapters/V14-data-protection.md)

## Week 6: 運用とアーキテクチャ

- [ ] [V13 設定](chapters/V13-configuration.md)
- [ ] [V15 セキュアコーディングとアーキテクチャ](chapters/V15-secure-coding-and-architecture.md)
- [ ] [V16 セキュリティログとエラー処理](chapters/V16-security-logging-and-error-handling.md)

## 卒業課題

- [ ] 自分が開発しているアプリ（または OSS）を 1 つ選び、[assessment-template.csv](../checklists/assessment-template.csv) で **L1 の 70 要件**を評価する
- [ ] fail になった要件から 3 つ選び、修正 PR（またはテストコード）を書く
- [ ] L2 に進むなら、まず各章の「Documentation」セクション（ドキュメント要件）を自分の組織向けに書いてみる
