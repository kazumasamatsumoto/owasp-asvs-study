import type { Snippet } from '../../parts/snippet';

export const BEFORE: Snippet = {
  repo: 'labs',
  file: 'lab18_error_disclosure/exercise.py',
  start: 9,
  code: `def handle(order_id: str, log: list) -> tuple[int, dict]:
    try:
        return 200, get_order(order_id)
    except KeyError as e:
        return 404, {"error": f"order {e} not found"}
    except Exception as e:
        # ❌ 内部のエラーの中身を、そのまま利用者に返している
        return 500, {"error": f"{type(e).__name__}: {e}"}`,
};

export const FIX: Snippet = {
  repo: 'labs',
  file: 'lab18_error_disclosure/solution.py',
  start: 10,
  code: `def handle(order_id: str, log: list) -> tuple[int, dict]:
    try:
        return 200, get_order(order_id)
    except KeyError:
        return 404, {"error": "not found"}
    except Exception as e:
        # V16.5.1: 詳しい中身は、問い合わせ番号と一緒にログへ。利用者には汎用的なメッセージだけ
        incident = secrets.token_hex(4)
        log.append({"incident": incident, "error": f"{type(e).__name__}: {e}"})
        return 500, {"error": "internal error", "incident": incident}`,
};

export const ORDERS: Snippet = {
  repo: 'labs',
  file: 'lab18_error_disclosure/orders.py',
  start: 10,
  code: `def get_order(order_id: str) -> dict:
    query = f"SELECT id, item, price, card_last4 FROM orders WHERE id = '{order_id}'"
    if "'" in order_id:
        # 作り物のデータベースが返す、ありがちなエラー
        raise DatabaseError(f'syntax error at or near "\\'" | query: {query} | server: db-primary.internal:5432 (PostgreSQL 15.2)')
    if order_id not in ORDERS:
        raise KeyError(order_id)
    return ORDERS[order_id]`,
};
