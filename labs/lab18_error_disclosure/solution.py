"""Lab 18: 模範解答"""
import secrets
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from orders import get_order  # noqa: E402


def handle(order_id: str, log: list) -> tuple[int, dict]:
    try:
        return 200, get_order(order_id)
    except KeyError:
        return 404, {"error": "not found"}
    except Exception as e:
        # V16.5.1: 詳しい中身は、問い合わせ番号と一緒にログへ。利用者には汎用的なメッセージだけ
        incident = secrets.token_hex(4)
        log.append({"incident": incident, "error": f"{type(e).__name__}: {e}"})
        return 500, {"error": "internal error", "incident": incident}
