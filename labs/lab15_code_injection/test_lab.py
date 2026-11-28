import os
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _target import load  # noqa: E402

M = load(__file__)


class TestCodeInjection(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.old = os.getcwd()
        os.chdir(self.tmp.name)
        Path("secret.env").write_text("SECRET=1")

    def tearDown(self):
        os.chdir(self.old)
        self.tmp.cleanup()

    def bad(self, expr):
        try:
            out = M.calc(expr)
        except M.BadExpr:
            out = None
        except Exception as e:  # noqa: BLE001
            self.fail(f"BadExpr 以外の例外: {e!r}")
        self.assertNotIn("SECRET", str(out))
        self.assertIsNone(out, f"{expr!r} が計算されてしまった: {out!r}")
        self.assertFalse(Path("pwned").exists(), "コードが動いた")

    def test_arithmetic(self):
        self.assertEqual(M.calc("1 + 2 * 3"), 7)
        self.assertEqual(M.calc("(1 + 2) * 3"), 9)
        self.assertEqual(M.calc("-4 / 2"), -2)
        self.assertEqual(M.calc("1.5 * 2"), 3.0)

    def test_code(self):
        self.bad('open("secret.env").read()')  # V1.3.2
        self.bad('__import__("pathlib").Path("pwned").touch()')
        self.bad("(1).__class__")

    def test_names_and_power(self):
        self.bad("x + 1")
        self.bad("2 ** 10")

    def test_errors(self):
        self.bad("1 +")
        self.bad("1 / 0")
        self.bad("1+" * 60 + "1")


if __name__ == "__main__":
    unittest.main()
