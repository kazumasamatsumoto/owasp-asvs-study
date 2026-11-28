"""Lab 14: 認可チェックの欠如 — ここを修正してください。"""


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
    # ❌ ログインしているかだけを見て、管理者かどうかを確かめていない
    return ACTIONS[action](users, params)
