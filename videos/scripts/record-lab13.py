"""Lab13 の load_cart を、直す前（exercise.py）と直した後（solution.py）で実際に動かして記録する。

一時ディレクトリの中だけで試す。攻撃の Cookie は、読み戻されると一時ディレクトリに pwned というファイルを作るだけの作り物。
  1. その版の save_cart で作った、ふつうのカート
  2. pickle で作った細工したカート（読み戻すと pwned を作る）
  3. 中身を書き換えたカート（qty が -3）。exercise は pickle、solution は JSON で作る（クイズ用）
を渡して、読み戻せた中身／拒否の理由と、pwned が作られたかを記録する。結果は videos/recorded/lab13.json。

    python3 -I videos/scripts/record-lab13.py
"""
import base64
import importlib.util
import json
import pickle
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "labs" / "lab13_deserialization"
OUT = ROOT / "videos" / "recorded" / "lab13.json"


class Evil:
    def __init__(self, path):
        self.path = path

    def __reduce__(self):
        return (Path.touch, (Path(self.path),))


def load(name):
    spec = importlib.util.spec_from_file_location(f"lab13_{name}", LAB / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def run(name):
    m = load(name)
    rec = {}
    with tempfile.TemporaryDirectory() as t:
        pwned = Path(t) / "pwned"
        normal = {"items": [{"id": "A1", "qty": 2}]}
        tampered = {"items": [{"id": "A1", "qty": -3}]}
        cases = {
            "normal": m.save_cart(normal),
            "evil": base64.urlsafe_b64encode(pickle.dumps({"items": [Evil(pwned)]})).decode(),
            "quiz_negative": m.save_cart(tampered),
        }
        for case, cookie in cases.items():
            pwned.unlink(missing_ok=True)
            entry = {"cookie_head": cookie[:24] + "…"}
            try:
                got = m.load_cart(cookie)
                entry |= {"loaded": True, "cart": json.loads(json.dumps(got, default=lambda o: None))}
            except m.BadCart as e:
                entry |= {"loaded": False, "reason": str(e)}
            entry["pwned_created"] = pwned.exists()
            rec[case] = entry
    return rec


record = {n: run(n) for n in ("exercise", "solution")}
OUT.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
print(OUT.read_text())
