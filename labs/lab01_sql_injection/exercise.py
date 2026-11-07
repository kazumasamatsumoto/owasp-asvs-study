"""Lab 01: SQL インジェクション — ここを修正してください。"""
import sqlite3


def find_user(conn: sqlite3.Connection, username: str):
    # ❌ 文字列連結で SQL を組み立てている
    sql = f"SELECT id, username, role FROM users WHERE username = '{username}'"
    return conn.execute(sql).fetchone()


def search_products(conn: sqlite3.Connection, keyword: str, sort: str = "name"):
    # ❌ keyword も sort もそのまま埋め込んでいる
    sql = f"SELECT name, price FROM products WHERE name LIKE '%{keyword}%' ORDER BY {sort}"
    return conn.execute(sql).fetchall()
