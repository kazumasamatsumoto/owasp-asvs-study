"""Lab 18: エラーで内部の情報が漏れる — ここを修正してください。"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from orders import get_order  # noqa: E402


def handle(order_id: str, log: list) -> tuple[int, dict]:
    try:
        return 200, get_order(order_id)
    except KeyError as e:
        return 404, {"error": f"order {e} not found"}
    except Exception as e:
        # ❌ 内部のエラーの中身を、そのまま利用者に返している
        return 500, {"error": f"{type(e).__name__}: {e}"}
