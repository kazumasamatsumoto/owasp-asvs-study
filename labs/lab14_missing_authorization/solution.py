"""Lab 14: 模範解答"""


class Forbidden(Exception):
    pass


def _delete_user(users: dict, params: dict) -> dict:
    removed = users.pop(params["id"])
    return {"deleted": params["id"], "name": removed["name"]}


def _export_users(users: dict, params: dict) -> list:
    return [{"id": k, **v} for k, v in users.items()]


ACTIONS = {"delete_user": _delete_user, "export_users": _export_users}


def call_admin(session: dict | None, users: dict, action: str, params: dict):
    if session is None:
        raise Forbidden("login required")
    # V8.2.1 / V8.3.1: 役割はサーバー側のセッションで確かめる（params の role は信じない）
    if session.get("role") != "admin":
        raise Forbidden("admin only")
    # 決めた操作だけを許可する（知らない操作は拒否）
    if action not in ACTIONS:
        raise Forbidden("unknown action")
    return ACTIONS[action](users, params)
