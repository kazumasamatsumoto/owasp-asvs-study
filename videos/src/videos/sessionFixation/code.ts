import type { Snippet } from '../../parts/snippet';

export const BEFORE: Snippet = {
  repo: 'labs',
  file: 'lab06_session/exercise.py',
  start: 14,
  code: `    def login(self, user_id, old_token=None):
        # ❌ 予測可能な乱数 / 既存トークンの使い回し（セッション固定）
        token = old_token or str(random.randint(0, 10**6))
        now = self._clock()
        self._sessions[token] = {"user_id": user_id, "created": now, "last_seen": now}
        return token`,
};

export const AFTER: Snippet = {
  repo: 'labs',
  file: 'lab06_session/solution.py',
  start: 14,
  code: `    def login(self, user_id, old_token=None):
        # V7.2.4: 認証のたびに新しいトークンを発行し、古いものは破棄
        if old_token is not None:
            self._sessions.pop(old_token, None)
        token = secrets.token_urlsafe(32)  # V7.2.3: CSPRNG, 256 bit
        now = self._clock()
        self._sessions[token] = {"user_id": user_id, "created": now, "last_seen": now}
        return token`,
};

export const LOGOUT: Snippet = {
  repo: 'labs',
  file: 'lab06_session/solution.py',
  start: 34,
  code: `    def logout(self, token):
        self._sessions.pop(token, None)  # V7.4.1`,
};

export const COOKIE: Snippet = {
  repo: 'labs',
  file: 'lab06_session/solution.py',
  start: 43,
  code: `def build_session_cookie(token: str) -> str:
    # V3.3.1/V3.3.3: __Host- は Secure 必須・Domain 不可・Path=/ 必須
    # V3.3.4: HttpOnly / V3.3.2: SameSite
    return f"__Host-session={token}; Path=/; Secure; HttpOnly; SameSite=Lax"`,
};
