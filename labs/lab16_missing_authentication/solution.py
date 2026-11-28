"""Lab 16: 模範解答"""

SESSIONS = {"t-alice": {"user": "alice", "role": "member"}, "t-admin": {"user": "root", "role": "admin"}}
CONFIG = {"DB_URL": "postgres://app:hunter2-sample@db/app", "API_KEY": "sk-sample-0000"}
DB = [{"id": 1, "name": "alice", "email": "alice@example.com"}, {"id": 2, "name": "bob", "email": "bob@example.com"}]


class Unauthorized(Exception):
    pass


class Forbidden(Exception):
    pass


class NotFound(Exception):
    pass


ROUTES = {
    "/health": lambda s: {"status": "ok"},
    "/api/me": lambda s: {"user": s["user"]},
    "/internal/env": lambda s: dict(CONFIG),
    "/internal/backup": lambda s: {"rows": list(DB)},
}
# 公開してよい道だけを書く。ここに無い道は、すべてログインを求める（既定で拒否）
PUBLIC_PATHS = {"/health"}


def handle(path: str, token: str | None) -> dict:
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
    return ROUTES[path](session)
