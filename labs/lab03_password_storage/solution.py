"""Lab 03: 模範解答（標準ライブラリの scrypt を使用）"""
import base64
import hashlib
import hmac
import os
from pathlib import Path

MIN_LEN = 8          # V6.2.1（15 以上を強く推奨）
MAX_LEN = 1024       # V6.2.9: 64 以上を許可しつつ、巨大入力による DoS を防ぐ上限
_COMMON = {
    line.strip().lower()
    for line in (Path(__file__).parent / "common_passwords.txt").read_text().splitlines()
    if line.strip()
}

# scrypt パラメータ（OWASP Cheat Sheet の推奨例: N=2^17, r=8, p=1）
N, R, P = 2**17, 8, 1
MAXMEM = 256 * 1024 * 1024


def validate_password(pw: str) -> None:
    if len(pw) < MIN_LEN:
        raise ValueError(f"password must be at least {MIN_LEN} characters")
    if len(pw) > MAX_LEN:
        raise ValueError("password is too long")
    if pw.lower() in _COMMON:  # V6.2.4
        raise ValueError("this password is too common")
    # V6.2.5: 文字種の組み合わせルールは課さない


def _kdf(pw: str, salt: bytes, n: int, r: int, p: int) -> bytes:
    # V6.2.8: 切り詰めや大文字小文字変換をしない
    return hashlib.scrypt(pw.encode("utf-8"), salt=salt, n=n, r=r, p=p, maxmem=MAXMEM, dklen=32)


def hash_password(pw: str) -> str:
    salt = os.urandom(16)
    dk = _kdf(pw, salt, N, R, P)
    b64 = lambda b: base64.b64encode(b).decode()  # noqa: E731
    return f"scrypt${N}${R}${P}${b64(salt)}${b64(dk)}"


def verify_password(pw: str, stored: str) -> bool:
    try:
        algo, n, r, p, salt, dk = stored.split("$")
    except ValueError:
        return False
    if algo != "scrypt":
        return False
    actual = _kdf(pw, base64.b64decode(salt), int(n), int(r), int(p))
    return hmac.compare_digest(actual, base64.b64decode(dk))  # 定数時間比較
