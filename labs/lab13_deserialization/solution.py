"""Lab 13: 模範解答"""
import base64
import binascii
import json


class BadCart(Exception):
    pass


def save_cart(cart: dict) -> str:
    return base64.urlsafe_b64encode(json.dumps(cart).encode()).decode()


def load_cart(cookie: str) -> dict:
    # V1.5.2: 信頼できない入力に pickle は使わない。JSON はデータだけを表し、コードを動かさない
    try:
        cart = json.loads(base64.urlsafe_b64decode(cookie))
    except (binascii.Error, ValueError) as e:
        raise BadCart("not a json cart") from e
    # 読み戻した後で、決めた形だけを受け付ける
    if not isinstance(cart, dict) or set(cart) != {"items"} or not isinstance(cart["items"], list):
        raise BadCart("bad shape")
    for item in cart["items"]:
        if not (isinstance(item, dict) and set(item) == {"id", "qty"} and isinstance(item["id"], str)):
            raise BadCart("bad item")
        if type(item["qty"]) is not int or not 1 <= item["qty"] <= 99:
            raise BadCart("bad qty")
    return cart
