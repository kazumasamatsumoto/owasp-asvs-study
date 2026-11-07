"""Lab 04: 模範解答"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _model import Forbidden, Invoice, NotFound, User  # noqa: E402,F401

# V8.2.3: ロールごとに書き込み可能なフィールドを許可リストで定義
WRITABLE_FIELDS = {
    "user": {"memo"},
    "admin": {"memo", "status", "amount"},
}


class InvoiceService:
    def __init__(self, invoices: list[Invoice]):
        self._db = {inv.id: inv for inv in invoices}

    def _can_access(self, user: User, inv: Invoice) -> bool:
        return user.role == "admin" or inv.owner_id == user.id

    def get_invoice(self, user: User, invoice_id: int) -> Invoice:
        inv = self._db.get(invoice_id)
        # V8.2.2: 他人のデータも「存在しない」と同じ応答にして列挙を防ぐ
        if inv is None or not self._can_access(user, inv):
            raise NotFound(invoice_id)
        return inv

    def update_invoice(self, user: User, invoice_id: int, changes: dict) -> Invoice:
        inv = self.get_invoice(user, invoice_id)
        allowed = WRITABLE_FIELDS.get(user.role, set())
        denied = set(changes) - allowed
        if denied:  # 一部だけ反映せず、全体を拒否
            raise Forbidden(f"cannot modify: {sorted(denied)}")
        for k, v in changes.items():
            setattr(inv, k, v)
        return inv

    def delete_invoice(self, user: User, invoice_id: int) -> None:
        # V8.2.1: 機能レベルの権限チェックはデータ取得より先に
        if user.role != "admin":
            raise Forbidden("delete requires admin")
        self.get_invoice(user, invoice_id)
        del self._db[invoice_id]
