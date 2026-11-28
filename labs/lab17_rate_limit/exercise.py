"""Lab 17: 回数制限がない — ここを修正してください。"""
import hmac

MAX_FAILURES = 5
WINDOW = 15 * 60


class Locked(Exception):
    pass


def new_store(passwords: dict[str, str]) -> dict:
    return {"passwords": dict(passwords), "failures": {}, "locked_until": {}}


def login(store: dict, user: str, password: str, now: float) -> bool:
    # ❌ 何回失敗しても、そのまま試し続けられる
    expected = store["passwords"].get(user, "")
    return hmac.compare_digest(password.encode(), expected.encode()) and expected != ""
