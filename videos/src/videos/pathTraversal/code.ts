import type { Snippet } from '../../parts/snippet';

export const BEFORE: Snippet = {
  repo: 'labs',
  file: 'lab10_path_traversal/exercise.py',
  start: 10,
  code: `def read_document(base_dir: Path, name: str) -> bytes:
    # ❌ 利用者が渡した名前を、そのまま置き場所につなげて開いている
    with open(os.path.join(base_dir, name), "rb") as f:
        return f.read()`,
};

export const NAME: Snippet = {
  repo: 'labs',
  file: 'lab10_path_traversal/solution.py',
  start: 9,
  code: `def read_document(base_dir: Path, name: str) -> bytes:
    base = Path(base_dir).resolve()
    # V5.3.2: NUL 文字や絶対パスは、名前として受け付けない
    if "\\x00" in name or Path(name).is_absolute():
        raise Forbidden("bad name")`,
};

export const RESOLVE: Snippet = {
  repo: 'labs',
  file: 'lab10_path_traversal/solution.py',
  start: 14,
  code: `    # V5.3.2: ../ などを解決した後で、置き場所の中にあるかを確かめる
    target = (base / name).resolve()
    if not target.is_relative_to(base):
        raise Forbidden("outside of base")
    return target.read_bytes()`,
};
