"""Lab 12: 模範解答"""
import ipaddress
from urllib.parse import urlsplit

ALLOWED_HOSTS = {"images.example.com"}


class Forbidden(Exception):
    pass


def fetch_url(url: str, resolve, http_get) -> str:
    p = urlsplit(url)
    # V1.3.6: スキーム・ホスト・ポートを許可リストで確かめる
    if p.scheme != "https" or p.hostname not in ALLOWED_HOSTS or p.port not in (None, 443):
        raise Forbidden("not in allowlist")
    # 名前を引いた後の IP も確かめる（許可したホスト名が内部の IP を返しても行かない）
    ip = ipaddress.ip_address(resolve(p.hostname))
    if not ip.is_global:
        raise Forbidden("internal address")
    # 確かめた IP にそのまま取りに行く（もう一度名前を引かない）
    return http_get(str(ip), 443, p.path or "/")
