"""Lab17 の login を、直す前（exercise.py）と直した後（solution.py）で実際に動かして記録する。

alice のパスワードを sunshine2024 にした作り物の名簿で、
  1. 本人が正しいパスワードでログイン
  2. 攻撃者が、よく使われるパスワード 30 個（このスクリプトで作った一覧。29 番目が当たり）を 1 秒ごとに順に試す
  3. 2 の直後に、本人が正しいパスワードでログイン（クイズ用）
  4. 2 から 15 分と 1 秒たってから、本人が正しいパスワードでログイン
を試し、成功・失敗・ロックを記録する。結果は videos/recorded/lab17.json。

    python3 -I videos/scripts/record-lab17.py
"""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "labs" / "lab17_rate_limit"
OUT = ROOT / "videos" / "recorded" / "lab17.json"
T0 = 1_700_000_000
WORDS = ["123456", "password", "qwerty", "111111", "abc123", "letmein", "welcome", "monkey", "dragon", "iloveyou",
         "admin", "princess", "football", "baseball", "master", "shadow", "superman", "michael", "sunshine", "trustno1",
         "hello123", "freedom", "whatever", "qazwsx", "passw0rd", "starwars", "summer2024", "winter2024", "sunshine2024", "zaq12wsx"]


def load(name):
    spec = importlib.util.spec_from_file_location(f"lab17_{name}", LAB / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def attempt(m, store, pw, t):
    try:
        return "success" if m.login(store, "alice", pw, t) else "fail"
    except m.Locked:
        return "locked"


def run(name):
    m = load(name)
    store = m.new_store({"alice": "sunshine2024"})
    normal = attempt(m, m.new_store({"alice": "sunshine2024"}), "sunshine2024", T0)
    tries = [{"n": i + 1, "password": w, "result": attempt(m, store, w, T0 + i)} for i, w in enumerate(WORDS)]
    end = T0 + len(WORDS)
    hit = next((t for t in tries if t["result"] == "success"), None)
    return {
        "normal": normal,
        "tries": tries,
        "found_at": hit["n"] if hit else None,
        "counts": {r: sum(t["result"] == r for t in tries) for r in ("fail", "locked", "success")},
        "quiz_owner_right_after": attempt(m, store, "sunshine2024", end),
        "owner_after_15min": attempt(m, store, "sunshine2024", end + 15 * 60 + 1),
    }


record = {"words": len(WORDS), **{n: run(n) for n in ("exercise", "solution")}}
OUT.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({k: (v if k == "words" else {kk: vv for kk, vv in v.items() if kk != "tries"}) for k, v in record.items()}, ensure_ascii=False, indent=1))
