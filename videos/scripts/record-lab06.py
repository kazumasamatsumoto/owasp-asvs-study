"""Lab06 の SessionStore / build_session_cookie を、直す前（exercise.py）と直した後（solution.py）で実際に動かして記録する。

セッション固定の流れを、手元のメモリ上のセッション置き場だけで再現する。
  1. 攻撃者がログイン前のセッションをもらう（login("anonymous")）
  2. 被害者（alice）が、そのトークンを持ったままログインする（login("alice", old_token=…)）
  3. 攻撃者が、最初のトークンのまま get_user する
時計は test_lab.py と同じ作り物の時計。直す前の乱数は再現できるように種を固定する。
結果は videos/recorded/lab06.json。

    python3 -I videos/scripts/record-lab06.py
"""
import importlib.util
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "labs" / "lab06_session"
OUT = ROOT / "videos" / "recorded" / "lab06.json"


class FakeClock:
    def __init__(self):
        self.now = 1_700_000_000.0

    def __call__(self):
        return self.now


def load(name):
    spec = importlib.util.spec_from_file_location(f"lab06_{name}", LAB / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def run(name):
    random.seed(6)
    m = load(name)
    clock = FakeClock()
    store = m.SessionStore(clock=clock)
    attacker = store.login("anonymous")
    victim = store.login("alice", old_token=attacker)
    rec = {
        "attacker_token": attacker,
        "victim_token": victim,
        "same": attacker == victim,
        "attacker_get_user": store.get_user(attacker),
        "victim_get_user": store.get_user(victim),
        "token_length": len(victim),
        "cookie": m.build_session_cookie(victim),
    }
    store.logout(victim)
    rec["after_logout_get_user"] = store.get_user(victim)
    clock.now += m.IDLE_TIMEOUT + 1
    t2 = store.login("bob")
    clock.now += m.IDLE_TIMEOUT + 1
    rec["after_idle_get_user"] = store.get_user(t2)
    return rec


record = {"idle_timeout_min": 30, **{n: run(n) for n in ("exercise", "solution")}}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
print(OUT.read_text())
