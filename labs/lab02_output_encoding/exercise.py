"""Lab 02: 出力エンコーディング — ここを修正してください。"""
import json


def render_comment(author: str, body: str) -> str:
    return f'<div class="comment"><b>{author}</b>: {body}</div>'


def render_profile_link(name: str, url: str) -> str:
    return f'<a href="{url}">{name}</a>'


def render_inline_state(state: dict) -> str:
    return f"<script>window.__STATE__ = {json.dumps(state)};</script>"
