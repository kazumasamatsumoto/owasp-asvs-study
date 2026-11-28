import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _target import load  # noqa: E402

M = load(__file__)
ADMIN = {"user": "alice", "role": "admin"}
MEMBER = {"user": "bob", "role": "member"}


def users():
    return {
        "u1": {"name": "alice", "email": "alice@example.com"},
        "u2": {"name": "bob", "email": "bob@example.com"},
        "u3": {"name": "carol", "email": "carol@example.com"},
    }


class TestMissingAuthorization(unittest.TestCase):
    def bad(self, session, action, params, store=None):
        store = users() if store is None else store
        before = dict(store)
        with self.assertRaises(M.Forbidden):
            M.call_admin(session, store, action, params)
        self.assertEqual(store, before, "拒否するときは何も変えない")

    def test_admin_can_delete(self):
        store = users()
        self.assertEqual(M.call_admin(ADMIN, store, "delete_user", {"id": "u3"})["deleted"], "u3")
        self.assertNotIn("u3", store)

    def test_admin_can_export(self):
        self.assertEqual(len(M.call_admin(ADMIN, users(), "export_users", {})), 3)

    def test_not_logged_in(self):
        self.bad(None, "export_users", {})

    def test_member_cannot_delete(self):
        self.bad(MEMBER, "delete_user", {"id": "u3"})  # V8.2.1

    def test_member_cannot_export(self):
        self.bad(MEMBER, "export_users", {})

    def test_role_in_params_is_ignored(self):
        self.bad(MEMBER, "delete_user", {"id": "u3", "role": "admin"})  # V8.3.1

    def test_session_without_role(self):
        self.bad({"user": "dave"}, "export_users", {})

    def test_unknown_action(self):
        self.bad(ADMIN, "drop_database", {})


if __name__ == "__main__":
    unittest.main()
