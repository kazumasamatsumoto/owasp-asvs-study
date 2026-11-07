"""Lab 04: 認可 — ここを修正してください。"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _model import Forbidden, Invoice, NotFound, User  # noqa: E402,F401


class InvoiceService:
    def __init__(self, invoices: list[Invoice]):
        self._db = {inv.id: inv for inv in invoices}

    def get_invoice(self, user: User, invoice_id: int) -> Invoice:
        # ❌ ID さえ分かれば誰の請求書でも取れる
        if invoice_id not in self._db:
            raise NotFound(invoice_id)
        return self._db[invoice_id]

    def update_invoice(self, user: User, invoice_id: int, changes: dict) -> Invoice:
        inv = self.get_invoice(user, invoice_id)
        # ❌ リクエストのフィールドをそのまま反映（Mass Assignment）
        for k, v in changes.items():
            setattr(inv, k, v)
        return inv

    def delete_invoice(self, user: User, invoice_id: int) -> None:
        # ❌ 機能レベルのチェックが無い
        self.get_invoice(user, invoice_id)
        del self._db[invoice_id]
