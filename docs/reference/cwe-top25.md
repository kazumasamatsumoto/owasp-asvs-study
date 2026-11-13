# CWE Top 25（2025 年版）

CWE（Common Weakness Enumeration）は、ソフトウェアの弱点の**種類**に番号をつけた分類です。MITRE が管理しており、全部で 900 種類以上あります。

CWE Top 25 は、実際に公開された CVE の原因として**多く、かつ影響が大きい**弱点を毎年ランキングにしたものです。2025 年版は、2024 年 6 月〜2025 年 6 月に公開された約 3.9 万件の CVE をもとにしています。

[← 一覧に戻る](README.md)

## 一覧

「Web 開発で特に重要」の列が ● のものは、Web アプリを作るなら必ず押さえておきたい弱点です。○ は主に C/C++ などのメモリ安全でない言語で起きる弱点です。

| 順位 | CWE | 名前（日本語） | 原文 | Web 開発で特に重要 | OWASP Top 10:2025 | ASVS の章 |
| :---: | --- | --- | --- | :---: | --- | --- |
| 1 | [CWE-79](https://cwe.mitre.org/data/definitions/79.html) | クロスサイトスクリプティング（XSS） | Cross-site Scripting | ● | A05 Injection | [V1](../chapters/V01-encoding-and-sanitization.md), [V3](../chapters/V03-web-frontend-security.md) |
| 2 | [CWE-89](https://cwe.mitre.org/data/definitions/89.html) | SQL インジェクション | SQL Injection | ● | A05 Injection | [V1](../chapters/V01-encoding-and-sanitization.md) |
| 3 | [CWE-352](https://cwe.mitre.org/data/definitions/352.html) | クロスサイトリクエストフォージェリ（CSRF） | Cross-Site Request Forgery | ● | A01 Broken Access Control | [V3](../chapters/V03-web-frontend-security.md) |
| 4 | [CWE-862](https://cwe.mitre.org/data/definitions/862.html) | 認可チェックの欠如 | Missing Authorization | ● | A01 Broken Access Control | [V8](../chapters/V08-authorization.md) |
| 5 | [CWE-787](https://cwe.mitre.org/data/definitions/787.html) | 範囲外への書き込み | Out-of-bounds Write | ○ | — | — |
| 6 | [CWE-22](https://cwe.mitre.org/data/definitions/22.html) | パストラバーサル | Path Traversal | ● | A01 Broken Access Control | [V5](../chapters/V05-file-handling.md) |
| 7 | [CWE-416](https://cwe.mitre.org/data/definitions/416.html) | 解放済みメモリの使用 | Use After Free | ○ | — | — |
| 8 | [CWE-125](https://cwe.mitre.org/data/definitions/125.html) | 範囲外の読み取り | Out-of-bounds Read | ○ | — | — |
| 9 | [CWE-78](https://cwe.mitre.org/data/definitions/78.html) | OS コマンドインジェクション | OS Command Injection | ● | A05 Injection | [V1](../chapters/V01-encoding-and-sanitization.md) |
| 10 | [CWE-94](https://cwe.mitre.org/data/definitions/94.html) | コードインジェクション | Code Injection | ● | A05 Injection | [V1](../chapters/V01-encoding-and-sanitization.md) |
| 11 | [CWE-120](https://cwe.mitre.org/data/definitions/120.html) | サイズ確認なしのバッファコピー | Classic Buffer Overflow | ○ | — | — |
| 12 | [CWE-434](https://cwe.mitre.org/data/definitions/434.html) | 危険な種類のファイルのアップロード | Unrestricted Upload of File with Dangerous Type | ● | A06 Insecure Design | [V5](../chapters/V05-file-handling.md) |
| 13 | [CWE-476](https://cwe.mitre.org/data/definitions/476.html) | NULL ポインタ参照 | NULL Pointer Dereference | ○ | A10 Mishandling of Exceptional Conditions | — |
| 14 | [CWE-121](https://cwe.mitre.org/data/definitions/121.html) | スタックバッファオーバーフロー | Stack-based Buffer Overflow | ○ | — | — |
| 15 | [CWE-502](https://cwe.mitre.org/data/definitions/502.html) | 信頼できないデータのデシリアライズ | Deserialization of Untrusted Data | ● | A08 Software or Data Integrity Failures | [V1](../chapters/V01-encoding-and-sanitization.md), [V15](../chapters/V15-secure-coding-and-architecture.md) |
| 16 | [CWE-122](https://cwe.mitre.org/data/definitions/122.html) | ヒープバッファオーバーフロー | Heap-based Buffer Overflow | ○ | — | — |
| 17 | [CWE-863](https://cwe.mitre.org/data/definitions/863.html) | 誤った認可 | Incorrect Authorization | ● | A01 Broken Access Control | [V8](../chapters/V08-authorization.md) |
| 18 | [CWE-20](https://cwe.mitre.org/data/definitions/20.html) | 不適切な入力検証 | Improper Input Validation | ● | A05 Injection など | [V2](../chapters/V02-validation-and-business-logic.md) |
| 19 | [CWE-284](https://cwe.mitre.org/data/definitions/284.html) | 不適切なアクセス制御 | Improper Access Control | ● | A01 Broken Access Control | [V8](../chapters/V08-authorization.md) |
| 20 | [CWE-200](https://cwe.mitre.org/data/definitions/200.html) | 権限のない者への機密情報の露出 | Exposure of Sensitive Information | ● | A01 Broken Access Control | [V14](../chapters/V14-data-protection.md), [V16](../chapters/V16-security-logging-and-error-handling.md) |
| 21 | [CWE-306](https://cwe.mitre.org/data/definitions/306.html) | 重要な機能に認証がない | Missing Authentication for Critical Function | ● | A07 Authentication Failures | [V6](../chapters/V06-authentication.md) |
| 22 | [CWE-918](https://cwe.mitre.org/data/definitions/918.html) | サーバーサイドリクエストフォージェリ（SSRF） | Server-Side Request Forgery | ● | A01 Broken Access Control | [V1](../chapters/V01-encoding-and-sanitization.md), [V4](../chapters/V04-api-and-web-service.md) |
| 23 | [CWE-77](https://cwe.mitre.org/data/definitions/77.html) | コマンドインジェクション | Command Injection | ● | A05 Injection | [V1](../chapters/V01-encoding-and-sanitization.md) |
| 24 | [CWE-639](https://cwe.mitre.org/data/definitions/639.html) | ユーザーが制御できるキーによる認可回避（IDOR） | Authorization Bypass Through User-Controlled Key | ● | A01 Broken Access Control | [V8](../chapters/V08-authorization.md)（[Lab04](../../labs/lab04_idor/)） |
| 25 | [CWE-770](https://cwe.mitre.org/data/definitions/770.html) | 制限のないリソース割り当て | Allocation of Resources Without Limits or Throttling | ● | A06 Insecure Design | [V2](../chapters/V02-validation-and-business-logic.md), [V4](../chapters/V04-api-and-web-service.md) |

> OWASP Top 10 と ASVS の対応は、学習用に代表的なものを選んだ目安です。公式の対応表は OWASP Top 10 の各カテゴリページにある「Mapped CWEs」を参照してください。

## 覚え方のコツ

25 個を丸暗記する必要はありません。Web 開発者は次の 4 グループで覚えると整理しやすいです。

| グループ | CWE | 一言でいうと |
| --- | --- | --- |
| **インジェクション** | 79, 89, 78, 77, 94, 502 | 入力をコードやコマンドとして解釈させてしまう |
| **認可・アクセス制御** | 862, 863, 284, 639, 352, 22, 918, 200 | 「誰が何をできるか」の確認漏れ |
| **認証** | 306 | 「誰か」の確認漏れ |
| **入力とリソースの扱い** | 20, 434, 770 | 想定外の入力・ファイル・量を受け入れてしまう |

## 確認問題

1. URL の `/orders/123` を `/orders/124` に変えたら他人の注文が見えた。最も近い CWE は何か。
2. 画像アップロード機能で `.php` ファイルがアップロードでき、サーバー上で実行された。最も近い CWE は何か。
3. 「URL を入力するとプレビュー画像を取得する」機能で `http://169.254.169.254/` を指定したら、クラウドの認証情報が取れた。最も近い CWE は何か。

<details>
<summary>答え</summary>

1. CWE-639（IDOR）。親カテゴリとして CWE-862 / CWE-863 も当てはまる。
2. CWE-434
3. CWE-918（SSRF）

</details>

出典：[2025 CWE Top 25 Most Dangerous Software Weaknesses](https://cwe.mitre.org/top25/archive/2025/2025_cwe_top25.html)
