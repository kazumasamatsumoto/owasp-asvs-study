import type { Snippet } from '../../parts/snippet';

export const BEFORE: Snippet = {
  repo: 'labs',
  file: 'lab16_missing_authentication/exercise.py',
  start: 20,
  code: `def handle(path: str, token: str | None) -> dict:
    if path == "/health":
        return {"status": "ok"}
    if path == "/api/me":
        session = SESSIONS.get(token or "")
        if session is None:
            raise Unauthorized("login required")
        return {"user": session["user"]}
    # ❌ あとから足した運用向けの道。ログインを確かめ忘れている
    if path == "/internal/env":
        return dict(CONFIG)
    if path == "/internal/backup":
        return {"rows": list(DB)}
    raise NotFound(path)`,
};

export const PUBLIC: Snippet = {
  repo: 'labs',
  file: 'lab16_missing_authentication/solution.py',
  start: 26,
  code: `# 公開してよい道だけを書く。ここに無い道は、すべてログインを求める（既定で拒否）
PUBLIC_PATHS = {"/health"}`,
};

export const FIX: Snippet = {
  repo: 'labs',
  file: 'lab16_missing_authentication/solution.py',
  start: 30,
  code: `def handle(path: str, token: str | None) -> dict:
    if path not in ROUTES:
        raise NotFound(path)
    session = None
    # V8.2.1: 公開と決めた道以外は、ログインを確かめてから動かす
    if path not in PUBLIC_PATHS:
        session = SESSIONS.get(token or "")
        if session is None:
            raise Unauthorized("login required")
    # V13.4.5: 運用向けの道は、管理者だけ
    if path.startswith("/internal/") and session["role"] != "admin":
        raise Forbidden("admin only")
    return ROUTES[path](session)`,
};
