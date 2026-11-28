import type { Snippet } from '../../parts/snippet';

export const BEFORE: Snippet = {
  repo: 'labs',
  file: 'lab11_command_injection/exercise.py',
  start: 10,
  code: `def count_lines(base_dir: Path, name: str) -> str:
    # ❌ 利用者が渡した名前を文字列でつなげて、シェルに解釈させている
    r = subprocess.run(
        f"wc -l {name}",
        shell=True,
        cwd=base_dir, capture_output=True, text=True, stdin=subprocess.DEVNULL,
    )
    return r.stdout.strip()`,
};

export const FIX: Snippet = {
  repo: 'labs',
  file: 'lab11_command_injection/solution.py',
  start: 10,
  code: `def count_lines(base_dir: Path, name: str) -> str:
    # V1.2.5: シェルを通さず、引数をリストで渡す。名前は 1 つの引数のまま wc に届く
    # "--" の後ろは、- で始まっていてもオプションではなくファイル名として扱われる
    r = subprocess.run(
        ["wc", "-l", "--", name],
        cwd=base_dir, capture_output=True, text=True, stdin=subprocess.DEVNULL,
    )
    if r.returncode != 0:
        raise BadInput(r.stderr.strip())
    return r.stdout.strip()`,
};
