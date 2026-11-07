#!/usr/bin/env python3
"""ASVS 5.0.0 の公式 CSV から学習・監査用のチェックリストを生成する。

使い方:
    python3 tools/generate_checklists.py

生成物:
    checklists/L1.md, L2.md, L3.md       レベル別チェックリスト（レベルは累積）
    checklists/by-chapter/V{N}.md        章別の全要件一覧
    checklists/assessment-template.csv   自分のアプリを評価するための記入用 CSV
"""
from __future__ import annotations

import csv
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "asvs-5.0.0-en.csv"
OUT = ROOT / "checklists"

CHAPTER_JA = {
    "V1": "エンコーディングとサニタイズ",
    "V2": "入力検証とビジネスロジック",
    "V3": "Web フロントエンドセキュリティ",
    "V4": "API と Web サービス",
    "V5": "ファイル処理",
    "V6": "認証",
    "V7": "セッション管理",
    "V8": "認可",
    "V9": "自己完結型トークン",
    "V10": "OAuth と OIDC",
    "V11": "暗号",
    "V12": "安全な通信",
    "V13": "設定",
    "V14": "データ保護",
    "V15": "セキュアコーディングとアーキテクチャ",
    "V16": "セキュリティログとエラー処理",
    "V17": "WebRTC",
}

HEADER_NOTE = (
    "> このファイルは `tools/generate_checklists.py` により "
    "[OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS) の公式 CSV から自動生成されています。"
    "直接編集しないでください。\n"
    "> 要件本文は原文（英語）のままです。ライセンス: CC BY-SA 4.0 (c) OWASP Foundation\n"
)


def load() -> list[dict[str, str]]:
    with SRC.open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


def chapter_slug(chapter_id: str) -> str:
    return chapter_id  # V1, V2, ... V17


def group(rows):
    """chapter -> section -> [rows] の順序付き辞書を返す。"""
    tree: "OrderedDict[str, OrderedDict[str, list]]" = OrderedDict()
    for r in rows:
        tree.setdefault(r["chapter_id"], OrderedDict()).setdefault(r["section_id"], []).append(r)
    return tree


def req_line(r) -> str:
    return f"- [ ] **{r['req_id']}** `L{r['L']}` {r['req_description']}"


def write_level(rows, level: int) -> None:
    selected = [r for r in rows if int(r["L"]) <= level]
    tree = group(selected)
    lines = [
        f"# ASVS 5.0.0 レベル {level} チェックリスト",
        "",
        HEADER_NOTE,
        f"レベル {level} では L1〜L{level} の要件がすべて対象です（累積）。対象要件数: **{len(selected)}**",
        "",
        "## 目次",
        "",
    ]
    for ch, secs in tree.items():
        n = sum(len(v) for v in secs.values())
        name = next(iter(secs.values()))[0]["chapter_name"]
        anchor = f"{ch}-{name}".lower().replace(" ", "-")
        lines.append(f"- [{ch} {name}（{CHAPTER_JA[ch]}）](#{anchor}) — {n} 件")
    lines.append("")
    for ch, secs in tree.items():
        name = next(iter(secs.values()))[0]["chapter_name"]
        lines += [f"## {ch} {name}", "", f"日本語解説: [docs/chapters]({chapter_doc_link(ch, '../docs/chapters/')})", ""]
        for sec_id, reqs in secs.items():
            lines += [f"### {sec_id} {reqs[0]['section_name']}", ""]
            lines += [req_line(r) for r in reqs]
            lines.append("")
    (OUT / f"L{level}.md").write_text("\n".join(lines), encoding="utf-8")


def chapter_doc_link(ch: str, prefix: str) -> str:
    n = int(ch[1:])
    matches = sorted((ROOT / "docs" / "chapters").glob(f"V{n:02d}-*.md"))
    return prefix + (matches[0].name if matches else "")


def write_by_chapter(rows) -> None:
    out = OUT / "by-chapter"
    out.mkdir(parents=True, exist_ok=True)
    for ch, secs in group(rows).items():
        all_reqs = [r for v in secs.values() for r in v]
        counts = {lv: sum(1 for r in all_reqs if r["L"] == lv) for lv in "123"}
        name = all_reqs[0]["chapter_name"]
        lines = [
            f"# {ch} {name}（{CHAPTER_JA[ch]}）— 全要件",
            "",
            HEADER_NOTE,
            f"要件数: **{len(all_reqs)}**（L1: {counts['1']} / L2: {counts['2']} / L3: {counts['3']}）",
            "",
            f"日本語解説: [{chapter_doc_link(ch, '')}]({chapter_doc_link(ch, '../../docs/chapters/')})",
            "",
        ]
        for sec_id, reqs in secs.items():
            lines += [f"## {sec_id} {reqs[0]['section_name']}", ""]
            lines += [req_line(r) for r in reqs]
            lines.append("")
        (out / f"{chapter_slug(ch)}.md").write_text("\n".join(lines), encoding="utf-8")


def write_assessment_template(rows) -> None:
    path = OUT / "assessment-template.csv"
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["req_id", "level", "chapter", "section", "requirement",
                    "status(pass/fail/na)", "evidence", "notes"])
        for r in rows:
            w.writerow([r["req_id"], r["L"], r["chapter_name"], r["section_name"],
                        r["req_description"], "", "", ""])


def main() -> None:
    rows = load()
    OUT.mkdir(exist_ok=True)
    for level in (1, 2, 3):
        write_level(rows, level)
    write_by_chapter(rows)
    write_assessment_template(rows)
    print(f"generated checklists from {len(rows)} requirements")


if __name__ == "__main__":
    main()
