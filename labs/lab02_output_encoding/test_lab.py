import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _target import load  # noqa: E402

M = load(__file__)


class TestRenderComment(unittest.TestCase):
    def test_plain_text(self):
        self.assertEqual(
            M.render_comment("alice", "hello"),
            '<div class="comment"><b>alice</b>: hello</div>',
        )

    def test_script_tag_is_escaped(self):
        out = M.render_comment("mallory", "<script>alert(1)</script>")
        self.assertNotIn("<script>", out)
        self.assertIn("&lt;script&gt;", out)

    def test_author_is_escaped_too(self):
        out = M.render_comment('<img src=x onerror="alert(1)">', "hi")
        self.assertNotIn("<img", out)


class TestProfileLink(unittest.TestCase):
    def test_https_ok(self):
        self.assertEqual(
            M.render_profile_link("Alice", "https://example.com/a"),
            '<a href="https://example.com/a">Alice</a>',
        )

    def test_javascript_scheme_rejected(self):
        for url in ["javascript:alert(1)", " JavaScript:alert(1)", "java\tscript:alert(1)",
                    "data:text/html,<script>alert(1)</script>", "//evil.example"]:
            with self.subTest(url=url), self.assertRaises(ValueError):
                M.render_profile_link("x", url)

    def test_attribute_breakout(self):
        out = M.render_profile_link("x", 'https://example.com/" onmouseover="alert(1)')
        self.assertNotIn('" onmouseover="', out)

    def test_name_is_escaped(self):
        self.assertNotIn("<b>", M.render_profile_link("<b>x</b>", "https://example.com"))


class TestInlineState(unittest.TestCase):
    def test_script_breakout(self):
        out = M.render_inline_state({"bio": "</script><script>alert(1)</script>"})
        self.assertEqual(out.count("</script>"), 1)  # 末尾の閉じタグだけ

    def test_still_valid_json(self):
        state = {"bio": "</script>&<>", "n": 1}
        out = M.render_inline_state(state)
        payload = out[len("<script>window.__STATE__ = "): -len(";</script>")]
        self.assertEqual(json.loads(payload), state)


if __name__ == "__main__":
    unittest.main()
