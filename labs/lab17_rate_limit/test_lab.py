import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _target import load  # noqa: E402

M = load(__file__)
T0 = 1_700_000_000


class TestRateLimit(unittest.TestCase):
    def setUp(self):
        self.s = M.new_store({"alice": "sunshine2024"})

    def try_(self, pw, t):
        try:
            return M.login(self.s, "alice", pw, t)
        except M.Locked:
            return "locked"

    def test_normal(self):
        self.assertTrue(M.login(self.s, "alice", "sunshine2024", T0))
        self.assertFalse(M.login(self.s, "alice", "wrong", T0))
        self.assertFalse(M.login(self.s, "nobody", "", T0))

    def test_lock_after_five(self):
        for i in range(5):
            self.assertFalse(self.try_(f"guess{i}", T0 + i))
        self.assertEqual(self.try_("guess5", T0 + 5), "locked")  # V6.3.1

    def test_locked_even_with_right_password(self):
        for i in range(5):
            self.try_(f"guess{i}", T0 + i)
        self.assertEqual(self.try_("sunshine2024", T0 + 10), "locked")

    def test_brute_force_fails(self):
        words = [f"pw{i}" for i in range(40)] + ["sunshine2024"]
        found = [w for i, w in enumerate(words) if self.try_(w, T0 + i) is True]
        self.assertEqual(found, [])

    def test_unlock_after_window(self):
        for i in range(5):
            self.try_(f"guess{i}", T0 + i)
        self.assertTrue(self.try_("sunshine2024", T0 + 4 + M.WINDOW + 1))

    def test_old_failures_expire(self):
        for i in range(4):
            self.try_(f"guess{i}", T0 + i)
        self.assertFalse(self.try_("again", T0 + M.WINDOW + 10))
        self.assertFalse(self.try_("again2", T0 + M.WINDOW + 11))

    def test_success_resets(self):
        for i in range(4):
            self.try_(f"guess{i}", T0 + i)
        self.assertTrue(self.try_("sunshine2024", T0 + 5))
        for i in range(4):
            self.assertFalse(self.try_(f"again{i}", T0 + 6 + i))


if __name__ == "__main__":
    unittest.main()
