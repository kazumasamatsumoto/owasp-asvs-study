"""Lab04 の InvoiceService を、直す前（exercise.py）と直した後（solution.py）で実際に動かして記録する。

アリス（id=1）としてログインし、請求書の番号だけを変えて取りに行く。結果は videos/recorded/lab04.json に書く。
動かすのは手元のメモリ上のデータだけで、ネットワークも本物の DB も使わない。

    python3 -I videos/scripts/record-lab04.py
"""
import dataclasses
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "labs" / "lab04_idor"
OUT = ROOT / "videos" / "recorded" / "lab04.json"
sys.path.insert(0, str(LAB))


def load(name):
    spec = importlib.util.spec_from_file_location(f"lab04_{name}", LAB / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def service(m):
    # test_lab.py と同じデータ: 100 はアリスの、200 はボブの請求書
    return m.InvoiceService([
        m.Invoice(id=100, owner_id=1, amount=5000),
        m.Invoice(id=200, owner_id=2, amount=8000),
    ])


def call(fn):
    try:
        r = fn()
        return {"ok": dataclasses.asdict(r) if r is not None else None}
    except Exception as e:  # NotFound / Forbidden をそのまま記録する
        return {"error": f"{type(e).__name__}: {e}"}


def run(target):
    m = load(target)
    alice = m.User(id=1, role="user")
    rec = {}
    for iid in (100, 200, 999):
        rec[f"get_{iid}"] = {"user": dataclasses.asdict(alice), "invoice_id": iid, **call(lambda: service(m).get_invoice(alice, iid))}
    # クイズ: 自分の請求書の memo を変えるついでに status を paid にする
    svc = service(m)
    changes = {"memo": "ok", "status": "paid"}
    r = call(lambda: svc.update_invoice(alice, 100, changes))
    after = dataclasses.asdict(svc._db[100])
    rec["update_paid"] = {"invoice_id": 100, "changes": changes, **r, "after": after}
    return rec


record = {t: run(t) for t in ("exercise", "solution")}
OUT.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
print(OUT.read_text())
