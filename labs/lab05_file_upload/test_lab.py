import io
import stat
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _target import load  # noqa: E402

M = load(__file__)

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
PDF = b"%PDF-1.7\n" + b"0" * 64


def make_zip(entries, symlink=None):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, data in entries:
            zf.writestr(name, data)
        if symlink:
            info = zipfile.ZipInfo(symlink[0])
            info.external_attr = (stat.S_IFLNK | 0o777) << 16
            zf.writestr(info, symlink[1])
    return buf.getvalue()


class Base(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name).resolve()
        # 未修正コードの Zip Slip が一時ディレクトリの外に書き込まないよう、深い階層を使う
        self.base = self.root / "a" / "b" / "uploads"
        self.base.mkdir(parents=True)

    def tearDown(self):
        self._tmp.cleanup()

    def assert_inside_base(self, p):
        self.assertEqual(Path(p).resolve().parent, self.base)


class TestSaveUpload(Base):
    def test_valid_png(self):
        p = M.save_upload(self.base, "cat.png", PNG)
        self.assert_inside_base(p)
        self.assertEqual(Path(p).read_bytes(), PNG)

    def test_server_generated_name(self):
        p = M.save_upload(self.base, "cat.png", PNG)
        self.assertNotEqual(Path(p).name, "cat.png")  # V5.3.2
        self.assertEqual(Path(p).suffix, ".png")

    def test_path_traversal(self):
        try:
            p = M.save_upload(self.base, "../../evil.png", PNG)
        except ValueError:
            return
        self.assert_inside_base(p)
        self.assertFalse((self.root / "a" / "evil.png").exists())

    def test_disallowed_extension(self):
        for name in ["shell.php", "x.html", "a.png.exe", "noext"]:
            with self.subTest(name=name), self.assertRaises(ValueError):
                M.save_upload(self.base, name, PNG)

    def test_magic_bytes_mismatch(self):
        with self.assertRaises(ValueError):
            M.save_upload(self.base, "fake.png", b"<?php system($_GET['c']); ?>")  # V5.2.2
        with self.assertRaises(ValueError):
            M.save_upload(self.base, "doc.pdf", PNG)

    def test_size_limit(self):
        with self.assertRaises(ValueError):
            M.save_upload(self.base, "big.pdf", PDF + b"0" * (1024 * 1024))  # V5.2.1


class TestExtractZip(Base):
    def test_normal(self):
        out = M.extract_zip(make_zip([("a.txt", b"A"), ("b.txt", b"B")]), self.base)
        self.assertEqual(sorted(Path(p).name for p in out), ["a.txt", "b.txt"])

    def test_zip_slip(self):
        data = make_zip([("../../escaped.txt", b"pwn"), ("..\\win.txt", b"pwn")])
        try:
            out = M.extract_zip(data, self.base)
        except ValueError:
            out = []
        self.assertFalse((self.root / "a" / "escaped.txt").exists())  # V5.3.3
        for p in out:
            self.assert_inside_base(p)

    def test_zip_bomb(self):
        data = make_zip([("bomb.txt", b"\x00" * (11 * 1024 * 1024))])
        self.assertLess(len(data), 100 * 1024)  # 圧縮後は小さい
        with self.assertRaises(ValueError):
            M.extract_zip(data, self.base)  # V5.2.3
        self.assertEqual(list(self.base.iterdir()), [])  # 展開前に止める

    def test_too_many_entries(self):
        with self.assertRaises(ValueError):
            M.extract_zip(make_zip([(f"f{i}.txt", b"x") for i in range(101)]), self.base)

    def test_symlink_rejected(self):
        with self.assertRaises(ValueError):
            M.extract_zip(make_zip([("ok.txt", b"x")], symlink=("link", "/etc/passwd")), self.base)


if __name__ == "__main__":
    unittest.main()
