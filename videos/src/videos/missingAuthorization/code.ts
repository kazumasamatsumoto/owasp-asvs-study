import type { Snippet } from '../../parts/snippet';

export const BEFORE: Snippet = {
  repo: 'labs',
  file: 'lab14_missing_authorization/exercise.py',
  start: 20,
  code: `def call_admin(session: dict | None, users: dict, action: str, params: dict):
    if session is None:
        raise Forbidden("login required")
    # ❌ ログインしているかだけを見て、管理者かどうかを確かめていない
    return ACTIONS[action](users, params)`,
};

export const FIX: Snippet = {
  repo: 'labs',
  file: 'lab14_missing_authorization/solution.py',
  start: 20,
  code: `def call_admin(session: dict | None, users: dict, action: str, params: dict):
    if session is None:
        raise Forbidden("login required")
    # V8.2.1 / V8.3.1: 役割はサーバー側のセッションで確かめる（params の role は信じない）
    if session.get("role") != "admin":
        raise Forbidden("admin only")
    # 決めた操作だけを許可する（知らない操作は拒否）
    if action not in ACTIONS:
        raise Forbidden("unknown action")
    return ACTIONS[action](users, params)`,
};
