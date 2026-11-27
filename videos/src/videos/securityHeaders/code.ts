import type { Snippet } from '../../parts/snippet';

export const BEFORE: Snippet = {
  repo: 'labs',
  file: 'lab07_security_headers/exercise.py',
  start: 6,
  code: `def security_headers(request_origin: str | None, nonce: str) -> dict[str, str]:
    headers = {
        "X-Frame-Options": "DENY",
        "Content-Security-Policy": "default-src * 'unsafe-inline' 'unsafe-eval'",
    }
    # ❌ リクエストの Origin を何でも反映し、資格情報も許可している
    if request_origin:
        headers["Access-Control-Allow-Origin"] = request_origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return headers`,
};

export const CORS: Snippet = {
  repo: 'labs',
  file: 'lab07_security_headers/solution.py',
  start: 21,
  code: `    # V3.4.2: 許可リストに一致した Origin だけを反映（完全一致で比較）
    if request_origin in ALLOWED_ORIGINS:
        headers["Access-Control-Allow-Origin"] = request_origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Vary"] = "Origin"`,
};

export const HEADERS: Snippet = {
  repo: 'labs',
  file: 'lab07_security_headers/solution.py',
  start: 7,
  code: `    csp = "; ".join([
        "default-src 'self'",
        f"script-src 'nonce-{nonce}' 'strict-dynamic'",  # V3.4.3
        "object-src 'none'",
        "base-uri 'none'",
        "frame-ancestors 'none'",                          # V3.4.6
    ])
    headers = {
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",  # V3.4.1
        "Content-Security-Policy": csp,
        "X-Content-Type-Options": "nosniff",                # V3.4.4
        "Referrer-Policy": "strict-origin-when-cross-origin",  # V3.4.5
        "Cross-Origin-Opener-Policy": "same-origin",       # V3.4.8
    }`,
};
