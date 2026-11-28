import type { Snippet } from '../../parts/snippet';

export const BEFORE: Snippet = {
  repo: 'labs',
  file: 'lab15_code_injection/exercise.py',
  start: 8,
  code: `def calc(expr: str) -> float:
    # ❌ 利用者が入力した文字列を、そのまま Python のコードとして実行している
    return eval(expr)`,
};

export const CALC: Snippet = {
  repo: 'labs',
  file: 'lab15_code_injection/solution.py',
  start: 23,
  code: `def calc(expr: str) -> float:
    # V1.3.2: eval() は使わない。式を木にして、許可した形だけを計算する
    if len(expr) > 100:
        raise BadExpr("too long")
    try:
        tree = ast.parse(expr, mode="eval")
        return _eval(tree.body)
    except (SyntaxError, ZeroDivisionError) as e:
        raise BadExpr(type(e).__name__) from e`,
};

export const TREE: Snippet = {
  repo: 'labs',
  file: 'lab15_code_injection/solution.py',
  start: 12,
  code: `def _eval(node):
    # 許可した形だけを、自分で計算する（それ以外はすべて拒否）
    if isinstance(node, ast.Constant) and type(node.value) in (int, float):
        return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in OPS:
        return OPS[type(node.op)](_eval(node.left), _eval(node.right))
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
        return -_eval(node.operand)
    raise BadExpr(f"not allowed: {type(node).__name__}")`,
};
