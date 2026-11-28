"""Lab 16: 重要な機能に認証がない — ここを修正してください。"""

SESSIONS = {"t-alice": {"user": "alice", "role": "member"}, "t-admin": {"user": "root", "role": "admin"}}
CONFIG = {"DB_URL": "postgres://app:hunter2-sample@db/app", "API_KEY": "sk-sample-0000"}
DB = [{"id": 1, "name": "alice", "email": "alice@example.com"}, {"id": 2, "name": "bob", "email": "bob@example.com"}]


class Unauthorized(Exception):
    pass


class Forbidden(Exception):
    pass


class NotFound(Exception):
    pass


def handle(path: str, token: str | None) -> dict:
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
    raise NotFound(path)
