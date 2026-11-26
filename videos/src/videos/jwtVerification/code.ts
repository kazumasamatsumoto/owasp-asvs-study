import type { Snippet } from '../../parts/snippet';

export const BEFORE: Snippet = {
  repo: 'labs',
  file: 'lab08_jwt_verification/exercise.py',
  start: 16,
  code: `def verify_token(token: str, key: bytes, audience: str, now: float) -> dict:
    # ❌ 署名もアルゴリズムも期限も見ずに payload をデコードしているだけ
    try:
        _header, payload, _sig = token.split(".")
        return json.loads(_b64decode(payload))
    except ValueError as e:
        raise InvalidToken(str(e)) from e`,
};

export const ALG: Snippet = {
  repo: 'labs',
  file: 'lab08_jwt_verification/solution.py',
  start: 28,
  code: `    # V9.1.2: アルゴリズムはトークンではなくサーバー側の許可リストで決める
    if not isinstance(header, dict) or header.get("alg") not in ALLOWED_ALGS:
        raise InvalidToken("algorithm not allowed")`,
};

export const SIG: Snippet = {
  repo: 'labs',
  file: 'lab08_jwt_verification/solution.py',
  start: 32,
  code: `    # V9.1.1: 中身を使う前に署名を検証
    expected = hmac.new(key, f"{h_b64}.{p_b64}".encode(), hashlib.sha256).digest()
    if not hmac.compare_digest(expected, signature):
        raise InvalidToken("bad signature")`,
};

export const TIME: Snippet = {
  repo: 'labs',
  file: 'lab08_jwt_verification/solution.py',
  start: 44,
  code: `    # V9.2.1: 有効期間
    if "exp" in claims and now > float(claims["exp"]) + LEEWAY:
        raise InvalidToken("expired")
    if "nbf" in claims and now < float(claims["nbf"]) - LEEWAY:
        raise InvalidToken("not yet valid")

    # V9.2.3: audience
    aud = claims.get("aud")
    auds = [aud] if isinstance(aud, str) else (aud if isinstance(aud, list) else [])
    if audience not in auds:
        raise InvalidToken("audience mismatch")`,
};
