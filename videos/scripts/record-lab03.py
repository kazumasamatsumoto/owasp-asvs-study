"""Lab03 の hash_password / verify_password / validate_password を、直す前（exercise.py）と
直した後（solution.py）で実際に動かして記録する。

「盗まれた保存値」は、この手元で作ったものだけを使う。辞書は labs の common_passwords.txt（28 件）。
1 回あたりの計算時間も、この PC で測った値を書く。結果は videos/recorded/lab03.json。

    python3 -I videos/scripts/record-lab03.py
"""
import importlib.util
import json
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "labs" / "lab03_password_storage"
OUT = ROOT / "videos" / "recorded" / "lab03.json"
WORDS = [w.strip() for w in (LAB / "common_passwords.txt").read_text().splitlines() if w.strip()]
PW = "Password1"  # 直す前のルール（6〜20 文字・大文字と数字）は通る
LONG = "Password1Password1ab"  # クイズ用。ちょうど 20 文字
LONG_TYPED = LONG + "XYZ"  # 後ろに別の文字を足して打つ


def load(name):
    spec = importlib.util.spec_from_file_location(f"lab03_{name}", LAB / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def per_sec(f, n):
    t = time.perf_counter()
    for i in range(n):
        f(f"guess{i}")
    return n / (time.perf_counter() - t)


def crack(mod, stored):
    t = time.perf_counter()
    for i, w in enumerate(WORDS, 1):
        if mod.verify_password(w, stored):
            return {"found": w, "tries": i, "seconds": round(time.perf_counter() - t, 6)}
    return {"found": None, "tries": len(WORDS), "seconds": round(time.perf_counter() - t, 6)}


def validate(mod, pw):
    try:
        mod.validate_password(pw)
        return "OK"
    except ValueError as e:
        return f"ValueError: {e}"


rec = {"password": PW, "dictionary_size": len(WORDS), "quiz_registered": LONG, "quiz_typed": LONG_TYPED}
for name in ("exercise", "solution"):
    m = load(name)
    alice, bob = m.hash_password(PW), m.hash_password(PW)
    rec[name] = {
        "validate": validate(m, PW),
        "alice": alice,
        "bob": bob,
        "same": alice == bob,
        "verify_lowercase": m.verify_password(PW.lower(), alice),
        "quiz_verify_longer": m.verify_password(LONG_TYPED, m.hash_password(LONG)),
        "crack": crack(m, alice),
        "hashes_per_sec": round(per_sec(m.hash_password, 200000 if name == "exercise" else 10)),
    }
OUT.write_text(json.dumps(rec, ensure_ascii=False, indent=2) + "\n")
print(OUT.read_text())
