import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _target import load  # noqa: E402

M = load(__file__)
APP = "https://bank.example.com"


class TestCSRF(unittest.TestCase):
    def setUp(self):
        self.sid, self.csrf = M.login("alice")
        self.cookies = {"session": self.sid}

    def form(self, **kw):
        base = {"to": "bob", "amount": "100", "csrf_token": self.csrf}
        base.update(kw)
        return {k: v for k, v in base.items() if v is not None}

    def bad(self, method="POST", headers=None, form=None, cookies=None):
        with self.assertRaises(M.Forbidden):
            M.transfer(method, self.cookies if cookies is None else cookies, {"Origin": APP} if headers is None else headers, self.form() if form is None else form)

    def test_legit(self):
        r = M.transfer("POST", self.cookies, {"Origin": APP}, self.form())
        self.assertEqual(r, {"from": "alice", "to": "bob", "amount": 100})

    def test_no_session(self):
        self.bad(cookies={})

    def test_get_rejected(self):
        self.bad(method="GET")  # V3.5.3
        self.bad(method="HEAD")

    def test_cross_origin(self):
        self.bad(headers={"Origin": "https://evil.example"})  # V3.5.1
        self.bad(headers={"Origin": "https://bank.example.com.evil.example"})
        self.bad(headers={"Origin": "http://bank.example.com"})

    def test_missing_origin(self):
        self.bad(headers={})
        self.bad(headers={"Origin": "null"})

    def test_token_required(self):
        self.bad(form=self.form(csrf_token=None))  # V3.5.1
        self.bad(form=self.form(csrf_token="guess"))

    def test_token_of_other_session(self):
        _sid, other = M.login("mallory")
        self.bad(form=self.form(csrf_token=other))


if __name__ == "__main__":
    unittest.main()
