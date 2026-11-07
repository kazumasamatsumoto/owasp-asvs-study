"""Lab 03: パスワード — ここを修正してください。"""
import hashlib


def validate_password(pw: str) -> None:
    # ❌ 古い「複雑性ルール」と短すぎる上限
    if len(pw) < 6 or len(pw) > 20:
        raise ValueError("password must be 6-20 chars")
    if not any(c.isupper() for c in pw) or not any(c.isdigit() for c in pw):
        raise ValueError("password must contain an uppercase letter and a digit")


def hash_password(pw: str) -> str:
    # ❌ 小文字化 + ソルトなし MD5
    return hashlib.md5(pw.lower().encode()).hexdigest()


def verify_password(pw: str, stored: str) -> bool:
    return hash_password(pw[:20]) == stored
