"""Lab 09: 模範解答"""
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
    # V3.5.3: 状態を変える操作は POST だけで受ける（GET の画像やリンクからは動かさない）
    if method != "POST":
        raise Forbidden("method not allowed")
    # V3.5.1: どのサイトから来た要求かを Origin で確かめる（完全一致・無ければ拒否）
    if headers.get("Origin") not in ALLOWED_ORIGINS:
        raise Forbidden("cross-site request")
    # V3.5.1: セッションに結び付いた CSRF トークンを照合する
    token = str(form.get("csrf_token", ""))
    if not hmac.compare_digest(token.encode(), session["csrf"].encode()):
        raise Forbidden("bad csrf token")
    return {"from": session["user"], "to": form.get("to"), "amount": int(form.get("amount", 0))}
