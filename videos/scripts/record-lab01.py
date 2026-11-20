"""Lab01 の find_user を、直す前（exercise.py）と直した後（solution.py）で実際に動かして記録する。

DB に届いた SQL（sqlite3 の trace callback）と、返ってきた行を videos/recorded/lab01.json に書く。
対象は手元のメモリ上の DB だけ（test_lab.py と同じ中身）。

    python3 -I videos/scripts/record-lab01.py
"""
import importlib.util
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "labs" / "lab01_sql_injection"
OUT = ROOT / "videos" / "recorded" / "lab01.json"

INPUTS = {"normal": "bob", "attack": "' OR '1'='1"}


def load(name):
    spec = importlib.util.spec_from_file_location(f"lab01_{name}", LAB / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def make_db():
    conn = sqlite3.connect(":memory:")
    conn.executescript(
        """
        CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, role TEXT);
        INSERT INTO users (username, role) VALUES ('alice', 'admin'), ('bob', 'user');
        """
    )
    return conn


def run(target, username):
    conn = make_db()
    sent = []
    conn.set_trace_callback(sent.append)
    row = load(target).find_user(conn, username)
    return {"input": username, "sql": sent, "row": list(row) if row else None}


record = {
    "users": [list(r) for r in make_db().execute("SELECT id, username, role FROM users")],
    **{f"{t}_{k}": run(t, v) for t in ("exercise", "solution") for k, v in INPUTS.items()},
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
print(OUT.read_text())
