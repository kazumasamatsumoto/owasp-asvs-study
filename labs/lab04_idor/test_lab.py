import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _target import load  # noqa: E402

M = load(__file__)

ALICE = M.User(id=1, role="user")
BOB = M.User(id=2, role="user")
ADMIN = M.User(id=99, role="admin")


def service():
    return M.InvoiceService([
        M.Invoice(id=100, owner_id=1, amount=5000),
        M.Invoice(id=200, owner_id=2, amount=8000),
    ])


class TestObjectLevel(unittest.TestCase):
    def test_owner_can_read(self):
        self.assertEqual(service().get_invoice(ALICE, 100).amount, 5000)

    def test_other_user_cannot_read(self):
        with self.assertRaises(M.NotFound):
            service().get_invoice(ALICE, 200)  # V8.2.2 IDOR

    def test_same_error_for_missing(self):
        with self.assertRaises(M.NotFound):
            service().get_invoice(ALICE, 999)

    def test_admin_can_read_all(self):
        self.assertEqual(service().get_invoice(ADMIN, 200).owner_id, 2)

    def test_other_user_cannot_update(self):
        with self.assertRaises(M.NotFound):
            service().update_invoice(BOB, 100, {"memo": "pwned"})


class TestFieldLevel(unittest.TestCase):
    def test_owner_can_update_memo(self):
        self.assertEqual(service().update_invoice(ALICE, 100, {"memo": "hi"}).memo, "hi")

    def test_owner_cannot_mark_paid(self):
        svc = service()
        with self.assertRaises(M.Forbidden):
            svc.update_invoice(ALICE, 100, {"memo": "ok", "status": "paid"})  # V8.2.3
        inv = svc.get_invoice(ALICE, 100)
        self.assertEqual((inv.status, inv.memo), ("unpaid", ""))  # 部分反映もしない

    def test_owner_cannot_change_owner(self):
        with self.assertRaises(M.Forbidden):
            service().update_invoice(ALICE, 100, {"owner_id": 2})

    def test_admin_can_update_status(self):
        self.assertEqual(service().update_invoice(ADMIN, 100, {"status": "paid"}).status, "paid")


class TestFunctionLevel(unittest.TestCase):
    def test_user_cannot_delete_even_own(self):
        with self.assertRaises(M.Forbidden):
            service().delete_invoice(ALICE, 100)  # V8.2.1

    def test_admin_can_delete(self):
        svc = service()
        svc.delete_invoice(ADMIN, 100)
        with self.assertRaises(M.NotFound):
            svc.get_invoice(ADMIN, 100)


if __name__ == "__main__":
    unittest.main()
