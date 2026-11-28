"""Lab 09: CSRF — ここを修正してください。"""
import hmac
import secrets

ALLOWED_ORIGINS = {"https://bank.example.com"}
SESSIONS: dict[str, dict] = {}


class Forbidden(Exception):
    pass


def login(user: str) -> tuple[str, str]:
    """セッション ID と、そのセッションの CSRF トークンを作って返す。"""
    sid, csrf = secrets.token_urlsafe(16), secrets.token_urlsafe(32)
    SESSIONS[sid] = {"user": user, "csrf": csrf}
    return sid, csrf


def transfer(method: str, cookies: dict, headers: dict, form: dict) -> dict:
    session = SESSIONS.get(cookies.get("session", ""))
    if session is None:
        raise Forbidden("login required")
    # ❌ Cookie のセッションだけを見て、どこから来た要求かを確かめていない
    return {"from": session["user"], "to": form.get("to"), "amount": int(form.get("amount", 0))}
