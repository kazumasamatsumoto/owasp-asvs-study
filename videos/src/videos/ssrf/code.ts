import type { Snippet } from '../../parts/snippet';

export const BEFORE: Snippet = {
  repo: 'labs',
  file: 'lab12_ssrf/exercise.py',
  start: 12,
  code: `def fetch_url(url: str, resolve, http_get) -> str:
    # ❌ 利用者が渡した URL に、確かめずにそのまま取りに行っている
    p = urlsplit(url)
    return http_get(resolve(p.hostname), p.port or 80, p.path or "/")`,
};

export const ALLOW: Snippet = {
  repo: 'labs',
  file: 'lab12_ssrf/solution.py',
  start: 13,
  code: `    p = urlsplit(url)
    # V1.3.6: スキーム・ホスト・ポートを許可リストで確かめる
    if p.scheme != "https" or p.hostname not in ALLOWED_HOSTS or p.port not in (None, 443):
        raise Forbidden("not in allowlist")`,
};

export const IP: Snippet = {
  repo: 'labs',
  file: 'lab12_ssrf/solution.py',
  start: 17,
  code: `    # 名前を引いた後の IP も確かめる（許可したホスト名が内部の IP を返しても行かない）
    ip = ipaddress.ip_address(resolve(p.hostname))
    if not ip.is_global:
        raise Forbidden("internal address")
    # 確かめた IP にそのまま取りに行く（もう一度名前を引かない）
    return http_get(str(ip), 443, p.path or "/")`,
};
