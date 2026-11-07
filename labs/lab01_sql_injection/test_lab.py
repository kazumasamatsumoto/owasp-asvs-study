import sqlite3
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _target import load  # noqa: E402

M = load(__file__)


def make_db():
    conn = sqlite3.connect(":memory:")
    conn.executescript(
        """
        CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, role TEXT);
        INSERT INTO users (username, role) VALUES ('alice', 'admin'), ('bob', 'user');
        CREATE TABLE products (name TEXT, price INTEGER);
        INSERT INTO products VALUES ('apple', 100), ('banana', 50), ('100% juice', 300);
        """
    )
    return conn


class TestFindUser(unittest.TestCase):
    def setUp(self):
        self.conn = make_db()

    def test_normal_lookup(self):
        self.assertEqual(M.find_user(self.conn, "bob")[1], "bob")

    def test_unknown_user(self):
        self.assertIsNone(M.find_user(self.conn, "mallory"))

    def test_tautology_injection(self):
        # V1.2.4: ' OR '1'='1 で先頭ユーザー(admin)が取れてはいけない
        self.assertIsNone(M.find_user(self.conn, "' OR '1'='1"))

    def test_union_injection(self):
        payload = "x' UNION SELECT 1, name, price FROM products --"
        self.assertIsNone(M.find_user(self.conn, payload))

    def test_quote_in_name_does_not_crash(self):
        self.assertIsNone(M.find_user(self.conn, "o'reilly"))


class TestSearchProducts(unittest.TestCase):
    def setUp(self):
        self.conn = make_db()

    def test_search(self):
        self.assertEqual([r[0] for r in M.search_products(self.conn, "an")], ["banana"])

    def test_sort_by_price(self):
        rows = M.search_products(self.conn, "", "price")
        self.assertEqual([r[0] for r in rows], ["banana", "apple", "100% juice"])

    def test_keyword_injection(self):
        rows = M.search_products(self.conn, "zzz' OR '1'='1")
        self.assertEqual(rows, [])

    def test_sort_injection_rejected(self):
        with self.assertRaises(ValueError):
            M.search_products(self.conn, "", "price; DROP TABLE users")

    def test_wildcard_is_literal(self):
        self.assertEqual([r[0] for r in M.search_products(self.conn, "%")], ["100% juice"])


if __name__ == "__main__":
    unittest.main()
