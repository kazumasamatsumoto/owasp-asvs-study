"""Lab16 の handle を、直す前（exercise.py）と直した後（solution.py）で実際に動かして記録する。

設定値・データベースの中身・トークンは、すべて lab の中の作り物。
  1. ログインなしで /health
  2. ログインなしで /api/me
  3. ログインなしで /internal/env（設定の一覧）
  4. ログインなしで /internal/backup（データベースの写し）
  5. 会員の alice で /internal/env（クイズ用）
を呼び、返った中身／拒否の種類を記録する。結果は videos/recorded/lab16.json。

    python3 -I videos/scripts/record-lab16.py
"""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "labs" / "lab16_missing_authentication"
OUT = ROOT / "videos" / "recorded" / "lab16.json"
CASES = {
    "health": ("/health", None),
    "me_anon": ("/api/me", None),
    "env_anon": ("/internal/env", None),
    "backup_anon": ("/internal/backup", None),
    "quiz_env_member": ("/internal/env", "t-alice"),
}


def load(name):
    spec = importlib.util.spec_from_file_location(f"lab16_{name}", LAB / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def run(name):
    m = load(name)
    rec = {}
    for case, (path, token) in CASES.items():
        entry = {"path": path, "who": "会員の alice" if token == "t-alice" else "ログインなし"}
        try:
            entry |= {"ok": True, "body": m.handle(path, token)}
        except (m.Unauthorized, m.Forbidden, m.NotFound) as e:
            entry |= {"ok": False, "error": type(e).__name__, "reason": str(e)}
        rec[case] = entry
    return rec


record = {n: run(n) for n in ("exercise", "solution")}
OUT.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
print(OUT.read_text())
