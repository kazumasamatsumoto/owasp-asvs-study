"""Lab 01: 模範解答"""
import sqlite3

ALLOWED_SORT = {"name": "name", "price": "price"}


def find_user(conn: sqlite3.Connection, username: str):
    # ✅ プレースホルダで値を渡す（V1.2.4）
    return conn.execute(
        "SELECT id, username, role FROM users WHERE username = ?", (username,)
    ).fetchone()


def search_products(conn: sqlite3.Connection, keyword: str, sort: str = "name"):
    # ✅ 識別子はプレースホルダにできないので許可リストで検証する
    column = ALLOWED_SORT.get(sort)
    if column is None:
        raise ValueError(f"invalid sort key: {sort!r}")
    # LIKE のワイルドカード文字もエスケープして「文字どおり」の部分一致にする
    escaped = keyword.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return conn.execute(
        f"SELECT name, price FROM products WHERE name LIKE ? ESCAPE '\\' ORDER BY {column}",
        (f"%{escaped}%",),
    ).fetchall()
