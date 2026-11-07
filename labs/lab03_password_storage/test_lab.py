import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _target import load  # noqa: E402

M = load(__file__)


class TestValidate(unittest.TestCase):
    def test_passphrase_without_upper_or_digit_is_allowed(self):
        M.validate_password("correct horse battery staple")  # V6.2.5

    def test_too_short(self):
        with self.assertRaises(ValueError):
            M.validate_password("a1B2c3")  # V6.2.1

    def test_eight_chars_ok(self):
        M.validate_password("zq8vkx2m")

    def test_common_password_rejected(self):
        for pw in ["password", "PASSWORD1", "P@ssw0rd", "12345678"]:
            with self.subTest(pw=pw), self.assertRaises(ValueError):
                M.validate_password(pw)  # V6.2.4

    def test_long_passwords_allowed(self):
        M.validate_password("x" * 64)   # V6.2.9
        M.validate_password("あ" * 128)

    def test_unicode_and_symbols_allowed(self):
        M.validate_password("パスワードは長い方が良い🔐")


class TestHashing(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = "Correct Horse Battery Staple " + "z" * 40
        cls.h1 = M.hash_password(cls.pw)
        cls.h2 = M.hash_password(cls.pw)

    def test_not_plain_md5(self):
        self.assertIsNone(re.fullmatch(r"[0-9a-f]{32}", self.h1))
        self.assertNotIn(self.pw, self.h1)

    def test_salted(self):
        self.assertNotEqual(self.h1, self.h2)

    def test_verify_ok(self):
        self.assertTrue(M.verify_password(self.pw, self.h1))

    def test_case_sensitive(self):
        self.assertFalse(M.verify_password(self.pw.lower(), self.h1))  # V6.2.8

    def test_no_truncation(self):
        self.assertFalse(M.verify_password(self.pw[:-1] + "y", self.h1))  # V6.2.8

    def test_garbage_stored_value(self):
        self.assertFalse(M.verify_password(self.pw, "not-a-hash"))


if __name__ == "__main__":
    unittest.main()
