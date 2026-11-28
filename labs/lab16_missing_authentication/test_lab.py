import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _target import load  # noqa: E402

M = load(__file__)


class TestMissingAuthentication(unittest.TestCase):
    def test_health_is_public(self):
        self.assertEqual(M.handle("/health", None), {"status": "ok"})

    def test_me(self):
        self.assertEqual(M.handle("/api/me", "t-alice"), {"user": "alice"})
        with self.assertRaises(M.Unauthorized):
            M.handle("/api/me", None)

    def test_internal_requires_login(self):
        for path in ("/internal/env", "/internal/backup"):
            with self.subTest(path=path), self.assertRaises(M.Unauthorized):
                M.handle(path, None)  # V8.2.1
            with self.subTest(path=path), self.assertRaises(M.Unauthorized):
                M.handle(path, "t-wrong")

    def test_internal_requires_admin(self):
        for path in ("/internal/env", "/internal/backup"):
            with self.subTest(path=path), self.assertRaises(M.Forbidden):
                M.handle(path, "t-alice")  # V13.4.5

    def test_admin_can_use_internal(self):
        self.assertIn("DB_URL", M.handle("/internal/env", "t-admin"))
        self.assertEqual(len(M.handle("/internal/backup", "t-admin")["rows"]), 2)

    def test_unknown(self):
        with self.assertRaises(M.NotFound):
            M.handle("/nothing", "t-admin")


if __name__ == "__main__":
    unittest.main()
