"""Lab 18 の共通部分：注文を 1 件読む（作り物のデータベース）。"""

ORDERS = {"1001": {"id": "1001", "item": "ノート", "price": 300}}


class DatabaseError(Exception):
    pass


def get_order(order_id: str) -> dict:
    query = f"SELECT id, item, price, card_last4 FROM orders WHERE id = '{order_id}'"
    if "'" in order_id:
        # 作り物のデータベースが返す、ありがちなエラー
        raise DatabaseError(f'syntax error at or near "\'" | query: {query} | server: db-primary.internal:5432 (PostgreSQL 15.2)')
    if order_id not in ORDERS:
        raise KeyError(order_id)
    return ORDERS[order_id]
