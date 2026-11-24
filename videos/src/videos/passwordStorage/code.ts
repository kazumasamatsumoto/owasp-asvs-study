import type { Snippet } from '../../parts/snippet';

export const BEFORE: Snippet = {
  repo: 'labs',
  file: 'lab03_password_storage/exercise.py',
  start: 13,
  code: `def hash_password(pw: str) -> str:
    # ❌ 小文字化 + ソルトなし MD5
    return hashlib.md5(pw.lower().encode()).hexdigest()


def verify_password(pw: str, stored: str) -> bool:
    return hash_password(pw[:20]) == stored`,
};

export const AFTER: Snippet = {
  repo: 'labs',
  file: 'lab03_password_storage/solution.py',
  start: 31,
  code: `def _kdf(pw: str, salt: bytes, n: int, r: int, p: int) -> bytes:
    # V6.2.8: 切り詰めや大文字小文字変換をしない
    return hashlib.scrypt(pw.encode("utf-8"), salt=salt, n=n, r=r, p=p, maxmem=MAXMEM, dklen=32)


def hash_password(pw: str) -> str:
    salt = os.urandom(16)
    dk = _kdf(pw, salt, N, R, P)
    b64 = lambda b: base64.b64encode(b).decode()  # noqa: E731
    return f"scrypt\${N}\${R}\${P}\${b64(salt)}\${b64(dk)}"`,
};

export const PARAMS: Snippet = {
  repo: 'labs',
  file: 'lab03_password_storage/solution.py',
  start: 16,
  code: `# scrypt パラメータ（OWASP Cheat Sheet の推奨例: N=2^17, r=8, p=1）
N, R, P = 2**17, 8, 1
MAXMEM = 256 * 1024 * 1024`,
};
