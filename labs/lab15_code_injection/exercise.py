"""Lab 15: コードインジェクション — ここを修正してください。"""


class BadExpr(Exception):
    pass


def calc(expr: str) -> float:
    # ❌ 利用者が入力した文字列を、そのまま Python のコードとして実行している
    return eval(expr)
