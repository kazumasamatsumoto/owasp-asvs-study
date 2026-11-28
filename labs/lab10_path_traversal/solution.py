"""Lab 10: 模範解答"""
from pathlib import Path


class Forbidden(Exception):
    pass


def read_document(base_dir: Path, name: str) -> bytes:
    base = Path(base_dir).resolve()
    # V5.3.2: NUL 文字や絶対パスは、名前として受け付けない
    if "\x00" in name or Path(name).is_absolute():
        raise Forbidden("bad name")
    # V5.3.2: ../ などを解決した後で、置き場所の中にあるかを確かめる
    target = (base / name).resolve()
    if not target.is_relative_to(base):
        raise Forbidden("outside of base")
    return target.read_bytes()
