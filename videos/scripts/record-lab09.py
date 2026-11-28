"""Lab09 の transfer を、直す前（exercise.py）と直した後（solution.py）で実際に動かして記録する。

alice がログインしている状態で（ブラウザは Cookie を自動で付けるので、どのサイトからの要求にもセッションが付く）、
  1. 銀行のサイトの正しいフォーム（POST・Origin は銀行・正しいトークン）
  2. 攻撃者のサイトに置いた隠しフォーム（POST・Origin は evil.example・トークンなし）
  3. 攻撃者のサイトの画像タグ（GET・Origin なし・トークンなし）
  4. 攻撃者がトークンを当て推量したフォーム（POST・Origin は evil.example・でたらめなトークン）
  5. 銀行の Origin と正しいトークンだが GET（クイズ用）
を送り、送金されたか／拒否されたか（Forbidden の理由）を記録する。結果は videos/recorded/lab09.json。

    python3 -I videos/scripts/record-lab09.py
"""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "labs" / "lab09_csrf"
OUT = ROOT / "videos" / "recorded" / "lab09.json"
APP = "https://bank.example.com"
EVIL = "https://evil.example"


def load(name):
    spec = importlib.util.spec_from_file_location(f"lab09_{name}", LAB / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def run(name):
    m = load(name)
    sid, csrf = m.login("alice")
    ck = {"session": sid}
    cases = {
        "legit": ("POST", {"Origin": APP}, {"to": "bob", "amount": "100", "csrf_token": csrf}),
        "evil_form": ("POST", {"Origin": EVIL}, {"to": "mallory", "amount": "500000"}),
        "evil_img": ("GET", {}, {"to": "mallory", "amount": "500000"}),
        "evil_guess": ("POST", {"Origin": EVIL}, {"to": "mallory", "amount": "500000", "csrf_token": "guess"}),
        "quiz_get": ("GET", {"Origin": APP}, {"to": "mallory", "amount": "500000", "csrf_token": csrf}),
    }
    rec = {}
    for case, (method, headers, form) in cases.items():
        shown = {k: ("（正しいトークン）" if k == "csrf_token" and v == csrf else v) for k, v in form.items()}
        entry = {"method": method, "origin": headers.get("Origin"), "form": shown}
        try:
            entry |= {"sent": True, "result": m.transfer(method, ck, headers, form)}
        except m.Forbidden as e:
            entry |= {"sent": False, "reason": str(e)}
        rec[case] = entry
    return rec


record = {n: run(n) for n in ("exercise", "solution")}
OUT.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
print(OUT.read_text())
