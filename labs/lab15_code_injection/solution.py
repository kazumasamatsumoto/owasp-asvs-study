"""Lab 15: 模範解答"""
import ast
import operator

OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv}


class BadExpr(Exception):
    pass


def _eval(node):
    # 許可した形だけを、自分で計算する（それ以外はすべて拒否）
    if isinstance(node, ast.Constant) and type(node.value) in (int, float):
        return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in OPS:
        return OPS[type(node.op)](_eval(node.left), _eval(node.right))
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
        return -_eval(node.operand)
    raise BadExpr(f"not allowed: {type(node).__name__}")


def calc(expr: str) -> float:
    # V1.3.2: eval() は使わない。式を木にして、許可した形だけを計算する
    if len(expr) > 100:
        raise BadExpr("too long")
    try:
        tree = ast.parse(expr, mode="eval")
        return _eval(tree.body)
    except (SyntaxError, ZeroDivisionError) as e:
        raise BadExpr(type(e).__name__) from e
