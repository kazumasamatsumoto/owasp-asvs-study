import type { Snippet } from '../../parts/snippet';

export const BEFORE: Snippet = {
  repo: 'labs',
  file: 'lab04_idor/exercise.py',
  start: 13,
  code: `    def get_invoice(self, user: User, invoice_id: int) -> Invoice:
        # ❌ ID さえ分かれば誰の請求書でも取れる
        if invoice_id not in self._db:
            raise NotFound(invoice_id)
        return self._db[invoice_id]`,
};

export const AFTER: Snippet = {
  repo: 'labs',
  file: 'lab04_idor/solution.py',
  start: 19,
  code: `    def _can_access(self, user: User, inv: Invoice) -> bool:
        return user.role == "admin" or inv.owner_id == user.id

    def get_invoice(self, user: User, invoice_id: int) -> Invoice:
        inv = self._db.get(invoice_id)
        # V8.2.2: 他人のデータも「存在しない」と同じ応答にして列挙を防ぐ
        if inv is None or not self._can_access(user, inv):
            raise NotFound(invoice_id)
        return inv`,
};
