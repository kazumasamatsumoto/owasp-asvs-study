import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _target import load  # noqa: E402

M = load(__file__)


def lower(h):
    return {k.lower(): v for k, v in h.items()}


def csp_directives(h):
    out = {}
    for part in lower(h).get("content-security-policy", "").split(";"):
        tokens = part.split()
        if tokens:
            out[tokens[0].lower()] = tokens[1:]
    return out


class TestHeaders(unittest.TestCase):
    def setUp(self):
        self.h = lower(M.security_headers(None, "r4nd0m"))

    def test_hsts(self):
        v = self.h.get("strict-transport-security", "")
        m = re.search(r"max-age=(\d+)", v)
        self.assertTrue(m and int(m.group(1)) >= 31536000)  # V3.4.1
        self.assertIn("includesubdomains", v.lower())

    def test_nosniff(self):
        self.assertEqual(self.h.get("x-content-type-options", "").lower(), "nosniff")

    def test_referrer_policy(self):
        v = self.h.get("referrer-policy", "").lower()
        self.assertIn(v, {"no-referrer", "same-origin", "strict-origin",
                          "strict-origin-when-cross-origin"})  # V3.4.5

    def test_coop(self):
        self.assertIn(self.h.get("cross-origin-opener-policy"),
                      {"same-origin", "same-origin-allow-popups"})  # V3.4.8


class TestCSP(unittest.TestCase):
    def setUp(self):
        self.d = csp_directives(M.security_headers(None, "r4nd0m"))

    def test_minimum_directives(self):
        self.assertEqual(self.d.get("object-src"), ["'none'"])  # V3.4.3
        self.assertEqual(self.d.get("base-uri"), ["'none'"])

    def test_nonce_and_no_unsafe_inline(self):
        script = self.d.get("script-src", self.d.get("default-src", []))
        self.assertIn("'nonce-r4nd0m'", script)
        self.assertNotIn("'unsafe-inline'", script)
        self.assertNotIn("'unsafe-eval'", script)

    def test_frame_ancestors(self):
        self.assertIn("frame-ancestors", self.d)  # V3.4.6
        self.assertNotIn("*", self.d["frame-ancestors"])


class TestCORS(unittest.TestCase):
    def test_allowed_origin(self):
        h = lower(M.security_headers("https://app.example.com", "n"))
        self.assertEqual(h.get("access-control-allow-origin"), "https://app.example.com")
        self.assertIn("origin", h.get("vary", "").lower())

    def test_untrusted_origin_not_reflected(self):
        for origin in ["https://evil.example", "https://app.example.com.evil.example",
                       "null", "http://app.example.com"]:
            with self.subTest(origin=origin):
                h = lower(M.security_headers(origin, "n"))
                self.assertNotIn(h.get("access-control-allow-origin"), {origin, "*"})  # V3.4.2


if __name__ == "__main__":
    unittest.main()
