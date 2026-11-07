#!/usr/bin/env python3
"""ASVS 5.0.0 の要件を使ったターミナル用フラッシュカード。

例:
    python3 tools/flashcards.py                 # 全章からランダムに 10 問（レベル当て）
    python3 tools/flashcards.py --mode chapter  # 要件文から章を当てる
    python3 tools/flashcards.py --chapter V6 -n 20
    python3 tools/flashcards.py --level 1       # L1 の要件だけ
"""
from __future__ import annotations

import argparse
import csv
import random
import sys
import textwrap
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent / "data" / "asvs-5.0.0-en.csv"


def load(chapter: str | None, level: int | None) -> list[dict[str, str]]:
    with SRC.open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if chapter:
        rows = [r for r in rows if r["chapter_id"].upper() == chapter.upper()]
    if level:
        rows = [r for r in rows if int(r["L"]) == level]
    return rows


def ask(prompt: str) -> str:
    try:
        return input(prompt).strip()
    except EOFError:
        print()
        sys.exit(0)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--mode", choices=["level", "chapter"], default="level",
                   help="level: 要件のレベル(1/2/3)を当てる / chapter: 章番号(1-17)を当てる")
    p.add_argument("--chapter", help="章で絞り込む (例: V6)")
    p.add_argument("--level", type=int, choices=[1, 2, 3], help="レベルで絞り込む")
    p.add_argument("-n", type=int, default=10, help="出題数 (default: 10)")
    p.add_argument("--seed", type=int, help="乱数シード")
    args = p.parse_args()

    rows = load(args.chapter, args.level)
    if not rows:
        sys.exit("該当する要件がありません")
    rng = random.Random(args.seed)
    cards = rng.sample(rows, min(args.n, len(rows)))
    chapters = sorted({(int(r["chapter_id"][1:]), r["chapter_name"]) for r in load(None, None)})

    score = 0
    for i, r in enumerate(cards, 1):
        print(f"\n─── Q{i}/{len(cards)} " + "─" * 40)
        print(textwrap.fill(r["req_description"], width=88))
        if args.mode == "level":
            answer, correct = ask("この要件のレベルは? [1/2/3] > "), r["L"]
        else:
            print("  " + "  ".join(f"{n}:{name}" for n, name in chapters))
            answer, correct = ask("どの章の要件? [1-17] > "), r["chapter_id"][1:]
        ok = answer == correct
        score += ok
        mark = "⭕ 正解" if ok else f"❌ 不正解（正解: {correct}）"
        print(f"{mark}  →  {r['req_id']} L{r['L']} / {r['chapter_name']} › {r['section_name']}")

    print(f"\nスコア: {score}/{len(cards)}")


if __name__ == "__main__":
    main()
