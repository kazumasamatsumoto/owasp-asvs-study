"""Lab05 の save_upload を、直す前（exercise.py）と直した後（solution.py）で実際に動かして記録する。

一時ディレクトリの中の uploads/ にだけ保存させ、保存された名前（uploads/ からの相対）と中身の先頭を
videos/recorded/lab05.json に書く。PHP などは実行しない（保存されたかどうかだけを見る）。

    python3 -I videos/scripts/record-lab05.py
"""
import importlib.util
import json
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "labs" / "lab05_file_upload"
OUT = ROOT / "videos" / "recorded" / "lab05.json"

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
PHP = b"<?php system($_GET['c']); ?>"  # test_lab.py と同じ中身
INPUTS = {
    "normal": ("cat.png", PNG),
    "attack": ("shell.php", PHP),
    "quiz": ("photo.png", PHP),  # 名前だけ写真、中身はプログラム
}


def load(name):
    spec = importlib.util.spec_from_file_location(f"lab05_{name}", LAB / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def show(b: bytes) -> str:
    return b[:8].hex(" ") if b.startswith(b"\x89PNG") else b.decode("utf-8", "replace")


def run(target, filename, data):
    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp).resolve() / "uploads"
        base.mkdir()
        rec = {"filename": filename, "data": show(data)}
        try:
            p = load(target).save_upload(base, filename, data)
            rec["saved"] = Path(p).resolve().relative_to(base).as_posix()
            rec["saved_data"] = show(Path(p).read_bytes())
        except ValueError as e:
            rec["error"] = f"ValueError: {e}"
        rec["files_in_uploads"] = sorted(q.relative_to(base).as_posix() for q in base.rglob("*"))
        return rec


record = {f"{t}_{k}": run(t, *v) for t in ("exercise", "solution") for k, v in INPUTS.items()}
OUT.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
print(OUT.read_text())
