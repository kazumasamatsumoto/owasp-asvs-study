import base64
import json
import pickle
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _target import load  # noqa: E402

M = load(__file__)


class Evil:
    """読み戻されると、決めた場所に pwned というファイルを作る（作り物の攻撃）。"""

    def __init__(self, path):
        self.path = path

    def __reduce__(self):
        return (Path.touch, (Path(self.path),))


def b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode()


class TestDeserialization(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.pwned = Path(self.tmp.name) / "pwned"

    def tearDown(self):
        self.tmp.cleanup()

    def bad(self, cookie):
        try:
            M.load_cart(cookie)
        except M.BadCart:
            pass
        except Exception as e:  # noqa: BLE001
            self.fail(f"BadCart 以外の例外: {e!r}")
        else:
            self.fail("BadCart が送出されなかった")
        self.assertFalse(self.pwned.exists(), "読み戻すだけでコードが動いた")

    def test_roundtrip(self):
        cart = {"items": [{"id": "A1", "qty": 2}]}
        self.assertEqual(M.load_cart(M.save_cart(cart)), cart)

    def test_pickle_payload(self):
        self.bad(b64(pickle.dumps({"items": [Evil(self.pwned)]})))  # V1.5.2

    def test_not_json(self):
        self.bad("!!!")
        self.bad(b64(b"not json"))

    def test_shape(self):
        self.bad(b64(json.dumps([1, 2]).encode()))
        self.bad(b64(json.dumps({"items": [], "price": 0}).encode()))
        self.bad(b64(json.dumps({"items": [{"id": 1, "qty": 1}]}).encode()))

    def test_qty(self):
        for q in (0, -3, 100, "2", 1.5, True):
            with self.subTest(q=q):
                self.bad(b64(json.dumps({"items": [{"id": "A1", "qty": q}]}).encode()))


if __name__ == "__main__":
    unittest.main()
