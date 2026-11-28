"""Lab 11: OS コマンドインジェクション — ここを修正してください。"""
import subprocess
from pathlib import Path


class BadInput(Exception):
    pass


def count_lines(base_dir: Path, name: str) -> str:
    # ❌ 利用者が渡した名前を文字列でつなげて、シェルに解釈させている
    r = subprocess.run(f"wc -l {name}", shell=True, cwd=base_dir, capture_output=True, text=True, stdin=subprocess.DEVNULL)
    return r.stdout.strip()
