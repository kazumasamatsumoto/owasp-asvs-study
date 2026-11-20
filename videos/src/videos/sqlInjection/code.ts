import type { Snippet } from '../../parts/snippet';

export const BEFORE: Snippet = {
  repo: 'labs',
  file: 'lab01_sql_injection/exercise.py',
  start: 5,
  code: `def find_user(conn: sqlite3.Connection, username: str):
    # ❌ 文字列連結で SQL を組み立てている
    sql = f"SELECT id, username, role FROM users WHERE username = '{username}'"
    return conn.execute(sql).fetchone()`,
};

export const AFTER: Snippet = {
  repo: 'labs',
  file: 'lab01_sql_injection/solution.py',
  start: 7,
  code: `def find_user(conn: sqlite3.Connection, username: str):
    # ✅ プレースホルダで値を渡す（V1.2.4）
    return conn.execute(
        "SELECT id, username, role FROM users WHERE username = ?", (username,)
    ).fetchone()`,
};
