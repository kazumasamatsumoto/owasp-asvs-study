import base64
import hashlib
import hmac
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _target import load  # noqa: E402

M = load(__file__)

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
    return {k: v for k, v in base.items() if v is not None}


class TestJWT(unittest.TestCase):
    def ok(self, tok):
        return M.verify_token(tok, KEY, AUD, NOW)

    def bad(self, tok):
        with self.assertRaises(M.InvalidToken):
            M.verify_token(tok, KEY, AUD, NOW)

    def test_valid(self):
        self.assertEqual(self.ok(make(claims()))["sub"], "alice")

    def test_aud_list(self):
        self.assertEqual(self.ok(make(claims(aud=["other", AUD])))["sub"], "alice")

    def test_tampered_payload(self):
        h, _p, s = make(claims()).split(".")
        forged = b64(json.dumps(claims(sub="admin")).encode())
        self.bad(f"{h}.{forged}.{s}")  # V9.1.1

    def test_wrong_key(self):
        self.bad(make(claims(), key=b"x" * 32))

    def test_alg_none(self):
        self.bad(make(claims(), alg="none", sign=False))  # V9.1.2
        self.bad(make(claims(), alg="None", sign=False))

    def test_alg_not_in_allowlist(self):
        self.bad(make(claims(), alg="HS512"))

    def test_expired(self):
        self.bad(make(claims(exp=NOW - 3600)))  # V9.2.1

    def test_leeway(self):
        self.ok(make(claims(exp=NOW - 10)))

    def test_not_before(self):
        self.bad(make(claims(nbf=NOW + 3600)))

    def test_wrong_audience(self):
        self.bad(make(claims(aud="https://other.example.com")))  # V9.2.3
        self.bad(make(claims(aud=None)))

    def test_malformed(self):
        for tok in ["", "a.b", "!!!.@@@.###", "a.b.c.d"]:
            with self.subTest(tok=tok):
                self.bad(tok)


if __name__ == "__main__":
    unittest.main()
