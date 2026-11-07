"""Lab 06: 模範解答"""
import secrets
import time

IDLE_TIMEOUT = 30 * 60          # V7.3.1
ABSOLUTE_TIMEOUT = 12 * 60 * 60  # V7.3.2


class SessionStore:
    def __init__(self, clock=time.time):
        self._clock = clock
        self._sessions = {}

    def login(self, user_id, old_token=None):
        # V7.2.4: 認証のたびに新しいトークンを発行し、古いものは破棄
        if old_token is not None:
            self._sessions.pop(old_token, None)
        token = secrets.token_urlsafe(32)  # V7.2.3: CSPRNG, 256 bit
        now = self._clock()
        self._sessions[token] = {"user_id": user_id, "created": now, "last_seen": now}
        return token

    def get_user(self, token):
        s = self._sessions.get(token)
        if s is None:
            return None
        now = self._clock()
        if now - s["last_seen"] > IDLE_TIMEOUT or now - s["created"] > ABSOLUTE_TIMEOUT:
            del self._sessions[token]  # V7.4.1: 期限切れもサーバー側で無効化
            return None
        s["last_seen"] = now
        return s["user_id"]

    def logout(self, token):
        self._sessions.pop(token, None)  # V7.4.1

    def revoke_user(self, user_id):
        # V7.4.2: アカウント無効化時に全セッションを終了
        for t in [t for t, s in self._sessions.items() if s["user_id"] == user_id]:
            del self._sessions[t]


def build_session_cookie(token: str) -> str:
    # V3.3.1/V3.3.3: __Host- は Secure 必須・Domain 不可・Path=/ 必須
    # V3.3.4: HttpOnly / V3.3.2: SameSite
    return f"__Host-session={token}; Path=/; Secure; HttpOnly; SameSite=Lax"
