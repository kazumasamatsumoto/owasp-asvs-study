"""Lab 05: 模範解答"""
import io
import secrets
import stat
import zipfile
from pathlib import Path, PurePosixPath, PureWindowsPath

MAX_UPLOAD = 1 * 1024 * 1024
MAX_ENTRIES = 100
MAX_TOTAL_UNCOMPRESSED = 10 * 1024 * 1024

# 拡張子 -> 期待するマジックバイト（V5.2.2）
MAGIC = {
    ".png": [b"\x89PNG\r\n\x1a\n"],
    ".jpg": [b"\xff\xd8\xff"],
    ".jpeg": [b"\xff\xd8\xff"],
    ".pdf": [b"%PDF-"],
}


def save_upload(base_dir: Path, filename: str, data: bytes) -> Path:
    if len(data) > MAX_UPLOAD:  # V5.2.1
        raise ValueError("file too large")
    ext = PurePosixPath(filename.replace("\\", "/")).suffix.lower()
    if ext not in MAGIC:
        raise ValueError(f"extension not allowed: {ext!r}")
    if not any(data.startswith(m) for m in MAGIC[ext]):
        raise ValueError("file content does not match extension")
    base = Path(base_dir).resolve()
    base.mkdir(parents=True, exist_ok=True)
    # V5.3.2: 保存名はサーバー側で生成。元のファイル名は（必要なら）DB に別保存する
    path = base / f"{secrets.token_hex(16)}{ext}"
    path.write_bytes(data)
    return path


def _is_symlink(info: zipfile.ZipInfo) -> bool:
    return stat.S_ISLNK(info.external_attr >> 16)


def extract_zip(zip_bytes: bytes, dest_dir: Path) -> list[Path]:
    dest = Path(dest_dir).resolve()
    dest.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        infos = [i for i in zf.infolist() if not i.is_dir()]
        # V5.2.3: 展開「前」にヘッダ情報で上限チェック
        if len(infos) > MAX_ENTRIES:
            raise ValueError("too many entries")
        if sum(i.file_size for i in infos) > MAX_TOTAL_UNCOMPRESSED:
            raise ValueError("archive too large when uncompressed")
        if any(_is_symlink(i) for i in infos):  # V5.2.5
            raise ValueError("symlinks are not allowed")

        out, written = [], 0
        for info in infos:
            # V5.3.3: パス情報を捨ててファイル名だけ使う（/ と \ の両方を考慮）
            name = PureWindowsPath(PurePosixPath(info.filename).name).name
            if name in ("", ".", ".."):
                continue
            target = (dest / name).resolve()
            if target.parent != dest:  # 念のための二重チェック
                raise ValueError(f"unsafe entry: {info.filename!r}")
            # ヘッダの file_size は偽装できるので、実際に読んだ量でも上限を守る
            with zf.open(info) as src:
                data = src.read(MAX_TOTAL_UNCOMPRESSED - written + 1)
            written += len(data)
            if written > MAX_TOTAL_UNCOMPRESSED:
                raise ValueError("archive too large when uncompressed")
            target.write_bytes(data)
            out.append(target)
    return out
