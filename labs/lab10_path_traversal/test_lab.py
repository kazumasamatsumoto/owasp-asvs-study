import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _target import load  # noqa: E402

M = load(__file__)


class TestPathTraversal(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.base = root / "docs"
        (self.base / "reports").mkdir(parents=True)
        (self.base / "manual.txt").write_bytes(b"manual")
        (self.base / "reports" / "q1.txt").write_bytes(b"q1")
        (root / "secret.env").write_bytes(b"SECRET=1")
        (root / "docs-old").mkdir()
        (root / "docs-old" / "x.txt").write_bytes(b"old")
        self.secret = root / "secret.env"

    def tearDown(self):
        self.tmp.cleanup()

    def bad(self, name):
        with self.assertRaises(M.Forbidden):
            M.read_document(self.base, name)

    def test_normal(self):
        self.assertEqual(M.read_document(self.base, "manual.txt"), b"manual")
        self.assertEqual(M.read_document(self.base, "reports/q1.txt"), b"q1")

    def test_dotdot_inside_is_ok(self):
        self.assertEqual(M.read_document(self.base, "reports/../manual.txt"), b"manual")

    def test_parent(self):
        self.bad("../secret.env")  # V5.3.2
        self.bad("reports/../../secret.env")

    def test_absolute(self):
        self.bad(str(self.secret))

    def test_prefix_sibling(self):
        self.bad("../docs-old/x.txt")

    def test_nul(self):
        self.bad("manual.txt\x00.pdf")


if __name__ == "__main__":
    unittest.main()
