import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _target import load  # noqa: E402

M = load(__file__)


class TestCommandInjection(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.base = Path(self.tmp.name)
        (self.base / "report.txt").write_text("a\nb\nc\n")
        (self.base / "secret.env").write_text("SECRET=1\n")

    def tearDown(self):
        self.tmp.cleanup()

    def run_bad(self, name):
        try:
            out = M.count_lines(self.base, name)
        except M.BadInput:
            out = ""
        self.assertNotIn("SECRET", out)
        self.assertFalse((self.base / "pwned").exists())

    def test_normal(self):
        out = M.count_lines(self.base, "report.txt")
        self.assertEqual(out.split()[0], "3")

    def test_semicolon(self):
        self.run_bad("report.txt; cat secret.env")  # V1.2.5
        self.run_bad("report.txt; touch pwned")

    def test_and(self):
        self.run_bad("report.txt && touch pwned")

    def test_subshell(self):
        self.run_bad("$(touch pwned)")
        self.run_bad("`touch pwned`")

    def test_missing_file(self):
        with self.assertRaises(M.BadInput):
            M.count_lines(self.base, "nothing.txt")

    def test_option_like_name(self):
        with self.assertRaises(M.BadInput):
            M.count_lines(self.base, "--version")


if __name__ == "__main__":
    unittest.main()
