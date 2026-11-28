"""Lab12 の fetch_url を、直す前（exercise.py）と直した後（solution.py）で実際に動かして記録する。

ネットワークは使わない。名前を IP にする resolve と、取りに行く http_get は、このスクリプトの作り物
（IP ごとに決まった中身を返すだけ）を渡す。中身はすべて作り物。
  1. https://images.example.com/cat.png（許可した画像の置き場）
  2. http://169.254.169.254/latest/meta-data/iam/（クラウドのメタデータ）
  3. http://localhost:8080/admin（同じサーバーの管理画面）
  4. http://2130706433/（127.0.0.1 を 10 進の数で書いたもの）
  5. https://images.example.com/cat.png だが、名前を引くと 10.0.0.5 が返る（クイズ用）
を渡して、返った中身／拒否の理由と、実際に取りに行った先（IP・ポート）を記録する。結果は videos/recorded/lab12.json。

    python3 -I videos/scripts/record-lab12.py
"""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "labs" / "lab12_ssrf"
OUT = ROOT / "videos" / "recorded" / "lab12.json"

DNS = {"images.example.com": "93.184.216.34", "169.254.169.254": "169.254.169.254", "localhost": "127.0.0.1", "2130706433": "127.0.0.1"}
PAGES = {
    "93.184.216.34": "（猫の画像）",
    "169.254.169.254": "AccessKeyId=ASIA-SAMPLE / SecretAccessKey=sample-secret",
    "127.0.0.1": "管理画面：利用者を削除する",
    "10.0.0.5": "社内の在庫システム",
}
CASES = {
    "image": ("https://images.example.com/cat.png", {}),
    "metadata": ("http://169.254.169.254/latest/meta-data/iam/", {}),
    "localhost": ("http://localhost:8080/admin", {}),
    "decimal": ("http://2130706433/", {}),
    "quiz_rebind": ("https://images.example.com/cat.png", {"images.example.com": "10.0.0.5"}),
}


def load(name):
    spec = importlib.util.spec_from_file_location(f"lab12_{name}", LAB / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def run(name):
    m = load(name)
    rec = {}
    for case, (url, override) in CASES.items():
        dns = DNS | override
        went = []

        def http_get(ip, port, path):
            went.append(f"{ip}:{port}{path}")
            return PAGES.get(ip, "")

        entry = {"url": url, "resolved": dns.get(url.split("/")[2].split(":")[0])}
        try:
            entry |= {"fetched": True, "body": m.fetch_url(url, dns.__getitem__, http_get)}
        except m.Forbidden as e:
            entry |= {"fetched": False, "reason": str(e)}
        entry["went_to"] = went
        rec[case] = entry
    return rec


record = {n: run(n) for n in ("exercise", "solution")}
OUT.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
print(OUT.read_text())
