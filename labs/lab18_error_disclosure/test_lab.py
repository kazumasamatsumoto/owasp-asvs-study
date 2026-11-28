import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _target import load  # noqa: E402

M = load(__file__)
LEAKS = ["SELECT", "orders", "db-primary", "5432", "PostgreSQL", "syntax", "DatabaseError"]


class TestErrorDisclosure(unittest.TestCase):
    def test_ok(self):
        self.assertEqual(M.handle("1001", []), (200, {"id": "1001", "item": "ノート", "price": 300}))

    def test_internal_error_is_generic(self):
        log = []
        status, body = M.handle("1001'", log)
        self.assertEqual(status, 500)
        text = json.dumps(body, ensure_ascii=False)
        for word in LEAKS:
            self.assertNotIn(word, text)  # V16.5.1
        self.assertEqual(body.get("error"), "internal error")
        self.assertTrue(body.get("incident"))

    def test_details_go_to_log(self):
        log = []
        _status, body = M.handle("1001'", log)
        self.assertEqual(len(log), 1)
        self.assertEqual(log[0]["incident"], body["incident"])
        self.assertIn("SELECT", log[0]["error"])

    def test_not_found(self):
        status, body = M.handle("<b>999</b>", [])
        self.assertEqual(status, 404)
        self.assertEqual(body, {"error": "not found"})


if __name__ == "__main__":
    unittest.main()
