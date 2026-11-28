"""Lab10 の read_document を、直す前（exercise.py）と直した後（solution.py）で実際に動かして記録する。

一時ディレクトリに、資料の置き場所 docs/（manual.txt と reports/q1.txt）と、
置き場所の外に secret.env（中身はこのスクリプトで作った作り物）を置き、
  1. manual.txt（ふつうの資料）
  2. ../secret.env（1 つ上の階層）
  3. reports/../../secret.env（いったん中に入ってから外へ）
  4. secret.env の絶対パス
  5. reports/../manual.txt（中に留まる。クイズ用）
を渡して、読めた中身／拒否の理由を記録する。絶対パスは手元の一時ディレクトリの場所が入るので、記録では伏せる。
結果は videos/recorded/lab10.json。

    python3 -I videos/scripts/record-lab10.py
"""
import importlib.util
import json
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "labs" / "lab10_path_traversal"
OUT = ROOT / "videos" / "recorded" / "lab10.json"


def load(name):
    spec = importlib.util.spec_from_file_location(f"lab10_{name}", LAB / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def run(name):
    m = load(name)
    with tempfile.TemporaryDirectory() as t:
        root = Path(t)
        base = root / "docs"
        (base / "reports").mkdir(parents=True)
        (base / "manual.txt").write_text("使い方の説明書")
        (base / "reports" / "q1.txt").write_text("第 1 四半期の報告")
        (root / "secret.env").write_text("DB_PASSWORD=hunter2-sample")
        cases = {
            "normal": ("manual.txt", "manual.txt"),
            "parent": ("../secret.env", "../secret.env"),
            "inout": ("reports/../../secret.env", "reports/../../secret.env"),
            "absolute": (str(root / "secret.env"), "/（一時ディレクトリ）/secret.env"),
            "quiz_inside": ("reports/../manual.txt", "reports/../manual.txt"),
        }
        rec = {}
        for case, (arg, shown) in cases.items():
            try:
                rec[case] = {"name": shown, "read": True, "content": m.read_document(base, arg).decode()}
            except m.Forbidden as e:
                rec[case] = {"name": shown, "read": False, "reason": str(e)}
        return rec


record = {n: run(n) for n in ("exercise", "solution")}
OUT.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
print(OUT.read_text())
