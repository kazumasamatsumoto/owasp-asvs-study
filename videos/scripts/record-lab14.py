"""Lab14 の call_admin を、直す前（exercise.py）と直した後（solution.py）で実際に動かして記録する。

利用者 3 人（alice は管理者、bob と carol は会員。名前とメールは作り物）の名簿を毎回作り直し、
  1. 管理者の alice が、全員を書き出す
  2. 会員の bob が、carol を削除する
  3. 会員の bob が、全員を書き出す（メールアドレスの一覧）
  4. 会員の bob が、params に role=admin を付けて carol を削除する（クイズ用）
を試し、結果／拒否の理由と、名簿が変わったかを記録する。結果は videos/recorded/lab14.json。

    python3 -I videos/scripts/record-lab14.py
"""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "labs" / "lab14_missing_authorization"
OUT = ROOT / "videos" / "recorded" / "lab14.json"
ADMIN = {"user": "alice", "role": "admin"}
MEMBER = {"user": "bob", "role": "member"}
CASES = {
    "admin_export": (ADMIN, "export_users", {}),
    "member_delete": (MEMBER, "delete_user", {"id": "u3"}),
    "member_export": (MEMBER, "export_users", {}),
    "quiz_role_param": (MEMBER, "delete_user", {"id": "u3", "role": "admin"}),
}


def users():
    return {
        "u1": {"name": "alice", "email": "alice@example.com"},
        "u2": {"name": "bob", "email": "bob@example.com"},
        "u3": {"name": "carol", "email": "carol@example.com"},
    }


def load(name):
    spec = importlib.util.spec_from_file_location(f"lab14_{name}", LAB / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def run(name):
    m = load(name)
    rec = {}
    for case, (session, action, params) in CASES.items():
        store = users()
        entry = {"who": f"{session['user']}（{session['role']}）", "action": action, "params": params}
        try:
            entry |= {"allowed": True, "result": m.call_admin(session, store, action, params)}
        except m.Forbidden as e:
            entry |= {"allowed": False, "reason": str(e)}
        entry["users_left"] = sorted(v["name"] for v in store.values())
        rec[case] = entry
    return rec


record = {n: run(n) for n in ("exercise", "solution")}
OUT.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
print(OUT.read_text())
