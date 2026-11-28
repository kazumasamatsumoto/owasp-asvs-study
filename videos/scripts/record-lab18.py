"""Lab18 の handle を、直す前（exercise.py）と直した後（solution.py）で実際に動かして記録する。

注文の中身・SQL 文・データベースのサーバー名は、すべて lab の中の作り物（orders.py）。
  1. 1001（ある注文）
  2. 1001'（引用符を足して、わざとエラーを起こす）
  3. 999（無い注文）
を頼み、状態コードと、利用者に返った本文と、サーバーのログに残ったものを記録する。
問い合わせ番号は毎回ちがう乱数なので、記録では 1 回分をそのまま残す。結果は videos/recorded/lab18.json。

    python3 -I videos/scripts/record-lab18.py
"""
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "labs" / "lab18_error_disclosure"
OUT = ROOT / "videos" / "recorded" / "lab18.json"
CASES = {"ok": "1001", "quote": "1001'", "missing": "999"}


def load(name):
    spec = importlib.util.spec_from_file_location(f"lab18_{name}", LAB / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def run(name):
    m = load(name)
    rec = {}
    for case, oid in CASES.items():
        log = []
        status, body = m.handle(oid, log)
        rec[case] = {"order_id": oid, "status": status, "body": body, "log": log}
    return rec


record = {n: run(n) for n in ("exercise", "solution")}
sys.path.pop(0) if sys.path and sys.path[0] == str(LAB) else None
OUT.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
print(OUT.read_text())
