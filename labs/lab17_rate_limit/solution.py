"""Lab 17: 模範解答"""
import hmac

MAX_FAILURES = 5
WINDOW = 15 * 60


class Locked(Exception):
    pass


def new_store(passwords: dict[str, str]) -> dict:
    return {"passwords": dict(passwords), "failures": {}, "locked_until": {}}


def login(store: dict, user: str, password: str, now: float) -> bool:
    # V6.3.1: ロック中は、正しいパスワードでも通さない（当たったかどうかを教えない）
    if store["locked_until"].get(user, 0) > now:
        raise Locked("too many failures")
    expected = store["passwords"].get(user, "")
    if expected and hmac.compare_digest(password.encode(), expected.encode()):
        store["failures"].pop(user, None)
        return True
    # 15 分の間の失敗だけを数え、5 回に達したらロックする
    recent = [t for t in store["failures"].get(user, []) if now - t < WINDOW] + [now]
    store["failures"][user] = recent
    if len(recent) >= MAX_FAILURES:
        store["locked_until"][user] = now + WINDOW
        store["failures"][user] = []
    return False
