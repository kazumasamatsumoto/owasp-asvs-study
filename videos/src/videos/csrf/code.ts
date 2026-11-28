import type { Snippet } from '../../parts/snippet';

export const BEFORE: Snippet = {
  repo: 'labs',
  file: 'lab09_csrf/exercise.py',
  start: 20,
  code: `def transfer(method: str, cookies: dict, headers: dict, form: dict) -> dict:
    session = SESSIONS.get(cookies.get("session", ""))
    if session is None:
        raise Forbidden("login required")
    # ❌ Cookie のセッションだけを見て、どこから来た要求かを確かめていない
    return {"from": session["user"], "to": form.get("to"), "amount": int(form.get("amount", 0))}`,
};

export const METHOD: Snippet = {
  repo: 'labs',
  file: 'lab09_csrf/solution.py',
  start: 24,
  code: `    # V3.5.3: 状態を変える操作は POST だけで受ける（GET の画像やリンクからは動かさない）
    if method != "POST":
        raise Forbidden("method not allowed")
    # V3.5.1: どのサイトから来た要求かを Origin で確かめる（完全一致・無ければ拒否）
    if headers.get("Origin") not in ALLOWED_ORIGINS:
        raise Forbidden("cross-site request")`,
};

export const TOKEN: Snippet = {
  repo: 'labs',
  file: 'lab09_csrf/solution.py',
  start: 30,
  code: `    # V3.5.1: セッションに結び付いた CSRF トークンを照合する
    token = str(form.get("csrf_token", ""))
    if not hmac.compare_digest(token.encode(), session["csrf"].encode()):
        raise Forbidden("bad csrf token")
    return {"from": session["user"], "to": form.get("to"), "amount": int(form.get("amount", 0))}`,
};
