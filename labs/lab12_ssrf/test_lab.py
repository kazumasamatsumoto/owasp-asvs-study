import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _target import load  # noqa: E402

M = load(__file__)

DNS = {
    "images.example.com": "93.184.216.34",
    "169.254.169.254": "169.254.169.254",
    "localhost": "127.0.0.1",
    "127.0.0.1": "127.0.0.1",
    "2130706433": "127.0.0.1",
    "evil.example": "198.51.100.7",
}
PAGES = {"93.184.216.34": "cat.png", "169.254.169.254": "SECRET-KEY", "127.0.0.1": "admin panel", "10.0.0.5": "internal"}


class TestSSRF(unittest.TestCase):
    def setUp(self):
        self.dns = dict(DNS)
        self.calls = []

    def resolve(self, host):
        return self.dns[host]

    def http_get(self, ip, port, path):
        self.calls.append((ip, port, path))
        return PAGES.get(ip, "page")

    def get(self, url):
        return M.fetch_url(url, self.resolve, self.http_get)

    def bad(self, url):
        with self.assertRaises(M.Forbidden):
            self.get(url)
        self.assertEqual(self.calls, [], "拒否するときは取りに行かない")

    def test_allowed(self):
        self.assertEqual(self.get("https://images.example.com/cat.png"), "cat.png")
        self.assertEqual(self.calls, [("93.184.216.34", 443, "/cat.png")])

    def test_metadata(self):
        self.bad("http://169.254.169.254/latest/meta-data/")  # V1.3.6

    def test_localhost(self):
        self.bad("http://localhost:8080/admin")
        self.bad("https://127.0.0.1/")
        self.bad("http://2130706433/")

    def test_other_host(self):
        self.bad("https://evil.example/")
        self.bad("https://images.example.com.evil.example/")

    def test_scheme_and_port(self):
        self.bad("http://images.example.com/cat.png")
        self.bad("https://images.example.com:8443/cat.png")
        self.bad("file:///etc/passwd")

    def test_allowed_host_resolving_internal(self):
        self.dns["images.example.com"] = "10.0.0.5"
        self.bad("https://images.example.com/cat.png")


if __name__ == "__main__":
    unittest.main()
