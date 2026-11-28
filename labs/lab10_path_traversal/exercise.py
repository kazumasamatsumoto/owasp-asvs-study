"""Lab 10: パストラバーサル — ここを修正してください。"""
import os
from pathlib import Path


class Forbidden(Exception):
    pass


def read_document(base_dir: Path, name: str) -> bytes:
    # ❌ 利用者が渡した名前を、そのまま置き場所につなげて開いている
    with open(os.path.join(base_dir, name), "rb") as f:
        return f.read()
