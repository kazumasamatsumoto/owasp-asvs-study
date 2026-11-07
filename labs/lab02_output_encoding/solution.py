"""Lab 02: 模範解答"""
import html
import json
from urllib.parse import urlsplit

ALLOWED_SCHEMES = {"http", "https"}


def render_comment(author: str, body: str) -> str:
    # ✅ HTML 要素コンテキスト: & < > " ' をエスケープ（V1.2.1）
    return f'<div class="comment"><b>{html.escape(author)}</b>: {html.escape(body)}</div>'


def render_profile_link(name: str, url: str) -> str:
    # ✅ スキームを許可リストで検証（V1.2.2）。前後空白・制御文字による回避も考慮
    stripped = url.strip()
    if any(ord(c) < 0x20 for c in stripped):
        raise ValueError("control characters are not allowed in URL")
    parts = urlsplit(stripped)
    if parts.scheme.lower() not in ALLOWED_SCHEMES or not parts.netloc:
        raise ValueError(f"unsafe URL: {url!r}")
    # ✅ 属性値コンテキストでもエスケープ（quote=True で " と ' も変換）
    return f'<a href="{html.escape(stripped, quote=True)}">{html.escape(name)}</a>'


def render_inline_state(state: dict) -> str:
    # ✅ JSON を <script> に埋め込むときは < > & と U+2028/2029 を \\uXXXX に（V1.2.3）
    data = (
        json.dumps(state)
        .replace("<", "\\u003c")
        .replace(">", "\\u003e")
        .replace("&", "\\u0026")
        .replace(" ", "\\u2028")
        .replace(" ", "\\u2029")
    )
    return f"<script>window.__STATE__ = {data};</script>"
