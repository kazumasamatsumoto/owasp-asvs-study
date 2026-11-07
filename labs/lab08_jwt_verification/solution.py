"""Lab 08: 模範解答"""
import base64
import binascii
import hashlib
import hmac
import json

LEEWAY = 30
ALLOWED_ALGS = {"HS256"}  # V9.1.2


class InvalidToken(Exception):
    pass


def _b64decode(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def verify_token(token: str, key: bytes, audience: str, now: float) -> dict:
    try:
        h_b64, p_b64, s_b64 = token.split(".")
        header = json.loads(_b64decode(h_b64))
        signature = _b64decode(s_b64)
    except (ValueError, binascii.Error) as e:
        raise InvalidToken("malformed token") from e

    # V9.1.2: アルゴリズムはトークンではなくサーバー側の許可リストで決める
    if not isinstance(header, dict) or header.get("alg") not in ALLOWED_ALGS:
        raise InvalidToken("algorithm not allowed")

    # V9.1.1: 中身を使う前に署名を検証
    expected = hmac.new(key, f"{h_b64}.{p_b64}".encode(), hashlib.sha256).digest()
    if not hmac.compare_digest(expected, signature):
        raise InvalidToken("bad signature")

    try:
        claims = json.loads(_b64decode(p_b64))
    except (ValueError, binascii.Error) as e:
        raise InvalidToken("malformed payload") from e
    if not isinstance(claims, dict):
        raise InvalidToken("malformed payload")

    # V9.2.1: 有効期間
    if "exp" in claims and now > float(claims["exp"]) + LEEWAY:
        raise InvalidToken("expired")
    if "nbf" in claims and now < float(claims["nbf"]) - LEEWAY:
        raise InvalidToken("not yet valid")

    # V9.2.3: audience
    aud = claims.get("aud")
    auds = [aud] if isinstance(aud, str) else (aud if isinstance(aud, list) else [])
    if audience not in auds:
        raise InvalidToken("audience mismatch")
    return claims
