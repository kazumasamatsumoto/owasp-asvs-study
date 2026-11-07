"""Lab 08: JWT 検証 — ここを修正してください。"""
import base64
import json

LEEWAY = 30


class InvalidToken(Exception):
    pass


def _b64decode(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def verify_token(token: str, key: bytes, audience: str, now: float) -> dict:
    # ❌ 署名もアルゴリズムも期限も見ずに payload をデコードしているだけ
    try:
        _header, payload, _sig = token.split(".")
        return json.loads(_b64decode(payload))
    except ValueError as e:
        raise InvalidToken(str(e)) from e
