import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _target import load  # noqa: E402

M = load(__file__)


class FakeClock:
    def __init__(self):
        self.now = 1_700_000_000.0

    def __call__(self):
        return self.now

    def advance(self, seconds):
        self.now += seconds


class TestSessionStore(unittest.TestCase):
    def setUp(self):
        self.clock = FakeClock()
        self.store = M.SessionStore(clock=self.clock)

    def test_login_and_get(self):
        t = self.store.login("alice")
        self.assertEqual(self.store.get_user(t), "alice")

    def test_token_entropy(self):
        tokens = {self.store.login(f"u{i}") for i in range(200)}
        self.assertEqual(len(tokens), 200)
        # V7.2.3: 128 bit 以上 → base64url で 22 文字以上 / hex で 32 文字以上
        self.assertTrue(all(len(t) >= 22 for t in tokens))

    def test_session_fixation(self):
        attacker_token = self.store.login("anonymous")
        new = self.store.login("alice", old_token=attacker_token)
        self.assertNotEqual(new, attacker_token)  # V7.2.4
        self.assertIsNone(self.store.get_user(attacker_token))

    def test_logout_invalidates_server_side(self):
        t = self.store.login("alice")
        self.store.logout(t)
        self.assertIsNone(self.store.get_user(t))  # V7.4.1

    def test_idle_timeout(self):
        t = self.store.login("alice")
        self.clock.advance(M.IDLE_TIMEOUT + 1)
        self.assertIsNone(self.store.get_user(t))  # V7.3.1

    def test_activity_extends_idle(self):
        t = self.store.login("alice")
        for _ in range(3):
            self.clock.advance(M.IDLE_TIMEOUT - 60)
            self.assertEqual(self.store.get_user(t), "alice")

    def test_absolute_timeout(self):
        t = self.store.login("alice")
        for _ in range(int(M.ABSOLUTE_TIMEOUT // (M.IDLE_TIMEOUT - 60)) + 1):
            self.clock.advance(M.IDLE_TIMEOUT - 60)
            self.store.get_user(t)
        self.assertIsNone(self.store.get_user(t))  # V7.3.2

    def test_revoke_user(self):
        a1, a2 = self.store.login("alice"), self.store.login("alice")
        b = self.store.login("bob")
        self.store.revoke_user("alice")  # V7.4.2
        self.assertIsNone(self.store.get_user(a1))
        self.assertIsNone(self.store.get_user(a2))
        self.assertEqual(self.store.get_user(b), "bob")


class TestCookie(unittest.TestCase):
    def setUp(self):
        self.cookie = M.build_session_cookie("abc")
        self.parts = [p.strip() for p in self.cookie.split(";")]
        self.attrs = {p.split("=")[0].lower() for p in self.parts[1:]}

    def test_host_prefix(self):
        self.assertEqual(self.parts[0], "__Host-session=abc")  # V3.3.3
        self.assertNotIn("domain", self.attrs)
        self.assertIn("Path=/", self.parts)

    def test_secure_httponly(self):
        self.assertIn("secure", self.attrs)    # V3.3.1
        self.assertIn("httponly", self.attrs)  # V3.3.4

    def test_samesite(self):
        self.assertIn("samesite", self.attrs)  # V3.3.2
        self.assertFalse(any(p.lower() == "samesite=none" for p in self.parts))


if __name__ == "__main__":
    unittest.main()
