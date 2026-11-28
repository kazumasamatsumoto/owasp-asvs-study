import type { Snippet } from '../../parts/snippet';

export const BEFORE: Snippet = {
  repo: 'labs',
  file: 'lab17_rate_limit/exercise.py',
  start: 16,
  code: `def login(store: dict, user: str, password: str, now: float) -> bool:
    # ❌ 何回失敗しても、そのまま試し続けられる
    expected = store["passwords"].get(user, "")
    return hmac.compare_digest(password.encode(), expected.encode()) and expected != ""`,
};

export const FIX: Snippet = {
  repo: 'labs',
  file: 'lab17_rate_limit/solution.py',
  start: 16,
  code: `def login(store: dict, user: str, password: str, now: float) -> bool:
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
    return False`,
};
