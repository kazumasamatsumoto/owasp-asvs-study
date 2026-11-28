"""Lab 13: 安全でないデシリアライズ — ここを修正してください。"""
import base64
import pickle


class BadCart(Exception):
    pass


def save_cart(cart: dict) -> str:
    return base64.urlsafe_b64encode(pickle.dumps(cart)).decode()


def load_cart(cookie: str) -> dict:
    # ❌ 利用者から届いた Cookie を pickle で読み戻している（読み戻すだけでコードが動きうる）
    return pickle.loads(base64.urlsafe_b64decode(cookie))
