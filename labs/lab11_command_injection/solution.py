"""Lab 11: 模範解答"""
import subprocess
from pathlib import Path


class BadInput(Exception):
    pass


def count_lines(base_dir: Path, name: str) -> str:
    # V1.2.5: シェルを通さず、引数をリストで渡す。名前は 1 つの引数のまま wc に届く
    # "--" の後ろは、- で始まっていてもオプションではなくファイル名として扱われる
    r = subprocess.run(["wc", "-l", "--", name], cwd=base_dir, capture_output=True, text=True, stdin=subprocess.DEVNULL)
    if r.returncode != 0:
        raise BadInput(r.stderr.strip())
    return r.stdout.strip()
