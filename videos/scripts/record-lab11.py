"""Lab11 の count_lines を、直す前（exercise.py）と直した後（solution.py）で実際に動かして記録する。

一時ディレクトリに report.txt（3 行）と secret.env（中身はこのスクリプトで作った作り物）を置き、
  1. report.txt（ふつうの名前）
  2. report.txt; cat secret.env（; で 2 つ目のコマンド）
  3. report.txt && touch pwned（&& でファイルを作る）
  4. $(touch pwned)（$( ) の中を先に実行してファイルを作る）
  5. --version（クイズ用。オプションに見える名前）
を渡して、返った出力／拒否の理由と、pwned というファイルが作られたかを記録する。
出力に一時ディレクトリの場所は入らない（wc は渡された名前だけを表示する）。結果は videos/recorded/lab11.json。

    python3 -I videos/scripts/record-lab11.py
"""
import importlib.util
import json
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "labs" / "lab11_command_injection"
OUT = ROOT / "videos" / "recorded" / "lab11.json"
CASES = {
    "normal": "report.txt",
    "semicolon": "report.txt; cat secret.env",
    "and": "report.txt && touch pwned",
    "subshell": "$(touch pwned)",
    "quiz_option": "--version",
}


def load(name):
    spec = importlib.util.spec_from_file_location(f"lab11_{name}", LAB / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def run(name):
    m = load(name)
    rec = {}
    for case, arg in CASES.items():
        with tempfile.TemporaryDirectory() as t:
            base = Path(t)
            (base / "report.txt").write_text("1 行目\n2 行目\n3 行目\n")
            (base / "secret.env").write_text("DB_PASSWORD=hunter2-sample\n")
            entry = {"name": arg}
            try:
                out = m.count_lines(base, arg)
                entry |= {"ok": True, "output": [" ".join(l.split()) for l in out.splitlines()]}
            except m.BadInput as e:
                entry |= {"ok": False, "error": " ".join(str(e).split())}
            entry["pwned_created"] = (base / "pwned").exists()
            rec[case] = entry
    return rec


record = {n: run(n) for n in ("exercise", "solution")}
OUT.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
print(OUT.read_text())
