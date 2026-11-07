"""Lab 05: ファイル処理 — ここを修正してください。"""
import io
import zipfile
from pathlib import Path


def save_upload(base_dir: Path, filename: str, data: bytes) -> Path:
    # ❌ ユーザーのファイル名をそのまま使い、中身も検証しない
    path = Path(base_dir) / filename
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return path


def extract_zip(zip_bytes: bytes, dest_dir: Path) -> list[Path]:
    # ❌ エントリ名をそのまま使って展開（Zip Slip）、サイズも見ていない
    out = []
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        for info in zf.infolist():
            target = Path(dest_dir) / info.filename
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(zf.read(info))
            out.append(target)
    return out
