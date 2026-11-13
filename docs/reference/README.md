# 脆弱性の「ものさし」一覧 — CVE / CWE / CVSS / OWASP

セキュリティの話でよく出てくる 4 つの用語を、**学習用の一覧表**としてまとめたページです。

| 用語 | 一言でいうと | 何を答えるか | 一覧 |
| --- | --- | --- | --- |
| **CVE** | 個別の脆弱性につけた ID | 「**どの**脆弱性か」 | [代表的な CVE](cve-examples.md)（CVE は毎年 4 万件以上増えるので、有名どころだけ） |
| **CWE** | 弱点の**種類**の分類 | 「**どんな種類の**弱点か」 | [CWE Top 25（2025）](cwe-top25.md) |
| **CVSS** | 深刻度の採点ルール | 「**どのくらい**深刻か」 | [CVSS の評価項目一覧](cvss.md) |
| **OWASP Top 10** | Web アプリの代表的リスク | 「Web アプリで**何に**気をつけるか」 | [OWASP Top 10:2025](owasp-top10.md) |

> **注意 1**：OWASP は団体の名前です。「リスト」にあたるのは OWASP Top 10 で、このリポジトリで扱う ASVS は「対策の要件集」です。
>
> **注意 2**：CVSS の点数は脆弱性**そのもの**の深刻度です。自分の環境での危険度は、使っている機能か、外部に公開しているか、実際に悪用されているか（[CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) / [EPSS](https://www.first.org/epss/)）で変わります。

## 4 つの関係

```
          CWE（種類）            OWASP Top 10（リスク分類）       ASVS（対策要件）
        例: CWE-89 SQLi  ──────▶  A05 Injection  ──────────▶  V1 エンコーディングとサニタイズ
              ▲
              │ 「この CVE の原因はこの種類の弱点」
              │
    CVE（個別の脆弱性）  ───────▶  CVSS（深刻度スコア）
  例: CVE-2023-34362 MOVEit         9.8 Critical
```

- **作る側（開発者）**がまず覚えるもの：CWE と OWASP / ASVS（＝作るときに防ぐ）
- **運用する側**が毎日見るもの：CVE と CVSS（＝依存ライブラリなどの脆弱性を管理する）

## 練習：1 件の CVE を 4 つの観点で読む

[代表的な CVE](cve-examples.md) から 1 件選び、次の表を埋めてみましょう。

| 観点 | 記入欄 |
| --- | --- |
| CVE ID と対象製品 | |
| 原因の CWE（[NVD](https://nvd.nist.gov/) の「Weakness Enumeration」欄） | |
| CVSS ベクタと点数、各項目がなぜその値か | |
| 該当する OWASP Top 10 のカテゴリ | |
| 自分のコードで防ぐなら ASVS のどの章か | |

## 出典

- CVE: <https://www.cve.org/>
- CWE Top 25（2025）: <https://cwe.mitre.org/top25/archive/2025/2025_cwe_top25.html>
- CVSS v4.0 仕様: <https://www.first.org/cvss/v4.0/specification-document>
- CVSS v3.1 仕様: <https://www.first.org/cvss/v3.1/specification-document>
- OWASP Top 10:2025: <https://top10.owasp.org/2025>
