import type { Snippet } from '../../parts/snippet';

export const BEFORE: Snippet = {
  repo: 'labs',
  file: 'lab13_deserialization/exercise.py',
  start: 14,
  code: `def load_cart(cookie: str) -> dict:
    # ❌ 利用者から届いた Cookie を pickle で読み戻している（読み戻すだけでコードが動きうる）
    return pickle.loads(base64.urlsafe_b64decode(cookie))`,
};

export const JSON: Snippet = {
  repo: 'labs',
  file: 'lab13_deserialization/solution.py',
  start: 15,
  code: `def load_cart(cookie: str) -> dict:
    # V1.5.2: 信頼できない入力に pickle は使わない。JSON はデータだけを表し、コードを動かさない
    try:
        cart = json.loads(base64.urlsafe_b64decode(cookie))
    except (binascii.Error, ValueError) as e:
        raise BadCart("not a json cart") from e`,
};

export const SHAPE: Snippet = {
  repo: 'labs',
  file: 'lab13_deserialization/solution.py',
  start: 21,
  code: `    # 読み戻した後で、決めた形だけを受け付ける
    if not isinstance(cart, dict) or set(cart) != {"items"} or not isinstance(cart["items"], list):
        raise BadCart("bad shape")
    for item in cart["items"]:
        if not (isinstance(item, dict) and set(item) == {"id", "qty"} and isinstance(item["id"], str)):
            raise BadCart("bad item")
        if type(item["qty"]) is not int or not 1 <= item["qty"] <= 99:
            raise BadCart("bad qty")
    return cart`,
};
