"""Lab 07: セキュリティヘッダ — ここを修正してください。"""

ALLOWED_ORIGINS = {"https://app.example.com", "https://admin.example.com"}


def security_headers(request_origin: str | None, nonce: str) -> dict[str, str]:
    headers = {
        "X-Frame-Options": "DENY",
        "Content-Security-Policy": "default-src * 'unsafe-inline' 'unsafe-eval'",
    }
    # ❌ リクエストの Origin を何でも反映し、資格情報も許可している
    if request_origin:
        headers["Access-Control-Allow-Origin"] = request_origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return headers
