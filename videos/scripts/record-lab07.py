"""Lab07 の security_headers を、直す前（exercise.py）と直した後（solution.py）で実際に動かして記録する。

いくつかの Origin（自社のアプリ、攻撃者のサイト、自社のドメインに似せた名前、Origin なし）で呼び、
返ったヘッダをそのまま記録する。
「攻撃者のページの JavaScript が、利用者の Cookie 付きの応答を読めるか」は、
ブラウザの CORS の判定（Access-Control-Allow-Origin がその Origin と一致し、
Access-Control-Allow-Credentials が true のときだけ読める）を、返ったヘッダに当てはめて求める。
ネットワークには出ない。結果は videos/recorded/lab07.json。

    python3 -I videos/scripts/record-lab07.py
"""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "labs" / "lab07_security_headers"
OUT = ROOT / "videos" / "recorded" / "lab07.json"

NONCE = "r4nd0m"
ORIGINS = {
    "app": "https://app.example.com",
    "evil": "https://evil.example",
    "lookalike": "https://app.example.com.evil.example",
    "http_app": "http://app.example.com",
    "none": None,
}
CHECK = [
    "Strict-Transport-Security",
    "Content-Security-Policy",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Cross-Origin-Opener-Policy",
]


def load(name):
    spec = importlib.util.spec_from_file_location(f"lab07_{name}", LAB / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def can_read_with_cookie(origin, h):
    return origin is not None and h.get("Access-Control-Allow-Origin") == origin and h.get("Access-Control-Allow-Credentials") == "true"


def run(name):
    m = load(name)
    rec = {}
    for key, origin in ORIGINS.items():
        h = m.security_headers(origin, NONCE)
        rec[key] = {
            "origin": origin,
            "headers": h,
            "can_read_with_cookie": can_read_with_cookie(origin, h),
        }
    base = m.security_headers(None, NONCE)
    rec["missing"] = [k for k in CHECK if k not in base]
    rec["csp"] = base.get("Content-Security-Policy")
    return rec


record = {"nonce": NONCE, **{n: run(n) for n in ("exercise", "solution")}}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
print(OUT.read_text())
