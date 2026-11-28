"""Lab15 の calc を、直す前（exercise.py）と直した後（solution.py）で実際に動かして記録する。

一時ディレクトリに移って、そこに secret.env（中身はこのスクリプトで作った作り物）を置いてから、
  1. 1 + 2 * 3（ふつうの計算式）
  2. open("secret.env").read()（ファイルを読むコード）
  3. __import__("pathlib").Path("pwned").touch()（ファイルを作るコード）
  4. 2 ** 10（べき乗。クイズ用）
を渡して、返った値／拒否の理由と、pwned が作られたかを記録する。結果は videos/recorded/lab15.json。

    python3 -I videos/scripts/record-lab15.py
"""
import importlib.util
import json
import os
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "labs" / "lab15_code_injection"
OUT = ROOT / "videos" / "recorded" / "lab15.json"
CASES = {
    "normal": "1 + 2 * 3",
    "read": 'open("secret.env").read()',
    "touch": '__import__("pathlib").Path("pwned").touch()',
    "quiz_pow": "2 ** 10",
}


def load(name):
    spec = importlib.util.spec_from_file_location(f"lab15_{name}", LAB / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def run(name):
    m = load(name)
    rec = {}
    old = os.getcwd()
    for case, expr in CASES.items():
        with tempfile.TemporaryDirectory() as t:
            os.chdir(t)
            try:
                Path("secret.env").write_text("DB_PASSWORD=hunter2-sample")
                entry = {"expr": expr}
                try:
                    entry |= {"ok": True, "value": repr(m.calc(expr))}
                except m.BadExpr as e:
                    entry |= {"ok": False, "reason": str(e)}
                entry["pwned_created"] = Path("pwned").exists()
                rec[case] = entry
            finally:
                os.chdir(old)
    return rec


record = {n: run(n) for n in ("exercise", "solution")}
OUT.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
print(OUT.read_text())
