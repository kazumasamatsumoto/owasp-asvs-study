"""Lab 12: SSRF — ここを修正してください。"""
import ipaddress
from urllib.parse import urlsplit

ALLOWED_HOSTS = {"images.example.com"}


class Forbidden(Exception):
    pass


def fetch_url(url: str, resolve, http_get) -> str:
    # ❌ 利用者が渡した URL に、確かめずにそのまま取りに行っている
    p = urlsplit(url)
    return http_get(resolve(p.hostname), p.port or 80, p.path or "/")
