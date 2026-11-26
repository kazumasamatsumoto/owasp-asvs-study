"""Lab08 の verify_token を、直す前（exercise.py）と直した後（solution.py）で実際に動かして記録する。

手元で作った JWT（HS256、鍵はこのスクリプトの中だけの作り物）に対して、
  1. 正しいトークン
  2. 中身の sub を alice から admin に書き換えたトークン（署名はそのまま）
  3. alg を none にして署名を空にしたトークン
  4. 期限切れのトークン
  5. 別のサービス向け（aud が違う）トークン
  6. ヘッダの alg だけを HS512 にしたトークン（クイズ用）
を渡し、受け入れたか（返った sub）／拒否したか（InvalidToken の理由）を記録する。
結果は videos/recorded/lab08.json。

    python3 -I videos/scripts/record-lab08.py
"""
import base64
import hashlib
import hmac
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "labs" / "lab08_jwt_verification"
OUT = ROOT / "videos" / "recorded" / "lab08.json"

KEY = b"k" * 32
NOW = 1_700_000_000
AUD = "https://api.example.com"


def b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def make(claims, alg="HS256", key=KEY, sign=True):
    h = b64(json.dumps({"alg": alg, "typ": "JWT"}).encode())
    p = b64(json.dumps(claims).encode())
    sig = b64(hmac.new(key, f"{h}.{p}".encode(), hashlib.sha256).digest()) if sign else ""
    return f"{h}.{p}.{sig}"


def claims(**kw):
    base = {"sub": "alice", "aud": AUD, "exp": NOW + 300, "iat": NOW}
    base.update(kw)
    return base


def load(name):
    spec = importlib.util.spec_from_file_location(f"lab08_{name}", LAB / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


valid = make(claims())
h, _p, s = valid.split(".")
forged = f"{h}.{b64(json.dumps(claims(sub='admin')).encode())}.{s}"
CASES = {
    "valid": valid,
    "tampered": forged,
    "alg_none": make(claims(sub="admin"), alg="none", sign=False),
    "expired": make(claims(exp=NOW - 3600)),
    "wrong_aud": make(claims(aud="https://other.example.com")),
    "alg_hs512": make(claims(), alg="HS512"),
}


def run(name):
    m = load(name)
    rec = {}
    for case, tok in CASES.items():
        try:
            rec[case] = {"accepted": True, "sub": m.verify_token(tok, KEY, AUD, NOW)["sub"]}
        except m.InvalidToken as e:
            rec[case] = {"accepted": False, "reason": str(e)}
    return rec


record = {
    "tokens": {"valid": valid, "tampered": forged, "alg_none": CASES["alg_none"]},
    "payload_valid": json.loads(base64.urlsafe_b64decode(_p + "=" * (-len(_p) % 4))),
    **{n: run(n) for n in ("exercise", "solution")},
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
print(OUT.read_text())
