#!/usr/bin/env python3
"""ハンズオン演習のテストランナー（Python 3.10+ / 標準ライブラリのみ）。

    python3 labs/run.py                # 全演習を exercise.py に対して実行
    python3 labs/run.py lab01          # 特定の演習だけ
    python3 labs/run.py --solution     # 模範解答 solution.py に対して実行（CI 用）
"""
from __future__ import annotations

import argparse
import os
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("labs", nargs="*", help="lab01 など（省略時は全部）")
    p.add_argument("--solution", action="store_true", help="solution.py をテストする")
    args = p.parse_args()

    os.environ["ASVS_LAB_TARGET"] = "solution" if args.solution else "exercise"
    lab_dirs = sorted(d for d in HERE.glob("lab*_*") if d.is_dir())
    if args.labs:
        lab_dirs = [d for d in lab_dirs if any(d.name.startswith(x) for x in args.labs)]

    total_ok = True
    for d in lab_dirs:
        print(f"\n===== {d.name} ({os.environ['ASVS_LAB_TARGET']}.py) =====")
        suite = unittest.defaultTestLoader.discover(str(d), pattern="test_*.py", top_level_dir=str(d))
        result = unittest.TextTestRunner(verbosity=1).run(suite)
        total_ok &= result.wasSuccessful()
        sys.path.remove(str(d)) if str(d) in sys.path else None
        for mod in ("exercise", "solution", "test_lab", "_target"):
            sys.modules.pop(mod, None)
    print("\n✅ すべて合格" if total_ok else "\n❌ 失敗したテストがあります")
    return 0 if total_ok else 1


if __name__ == "__main__":
    sys.exit(main())
