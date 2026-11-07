"""Lab 06: セッション管理 — ここを修正してください。"""
import random
import time

IDLE_TIMEOUT = 30 * 60
ABSOLUTE_TIMEOUT = 12 * 60 * 60


class SessionStore:
    def __init__(self, clock=time.time):
        self._clock = clock
        self._sessions = {}  # token -> {"user_id", "created", "last_seen"}

    def login(self, user_id, old_token=None):
        # ❌ 予測可能な乱数 / 既存トークンの使い回し（セッション固定）
        token = old_token or str(random.randint(0, 10**6))
        now = self._clock()
        self._sessions[token] = {"user_id": user_id, "created": now, "last_seen": now}
        return token

    def get_user(self, token):
        # ❌ タイムアウトのチェックが無い
        s = self._sessions.get(token)
        return s["user_id"] if s else None

    def logout(self, token):
        # ❌ サーバー側で何もしていない（Cookie を消すだけでは不十分）
        pass

    def revoke_user(self, user_id):
        pass


def build_session_cookie(token: str) -> str:
    return f"session={token}; Path=/"
