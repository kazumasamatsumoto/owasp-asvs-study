"""Lab02 の render_comment を、直す前（exercise.py）と直した後（solution.py）で実際に動かして記録する。

返ってきた HTML と、それをブラウザと同じ規則（html.parser）で読んだときの部品（タグか、ただの文字か）を
videos/recorded/lab02.json に書く。動かすのは手元の関数だけで、ブラウザもネットワークも使わない。

    python3 -I videos/scripts/record-lab02.py
"""
import importlib.util
import json
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "labs" / "lab02_output_encoding"
OUT = ROOT / "videos" / "recorded" / "lab02.json"

INPUTS = {
    "normal": ("bob", "おいしかったです"),
    "attack": ("mallory", "<script>alert(document.cookie)</script>"),
}


def load(name):
    spec = importlib.util.spec_from_file_location(f"lab02_{name}", LAB / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class Parts(HTMLParser):
    """読んだ HTML を [種類, 中身] の列にする。tag はタグ、text は画面に出る文字。"""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []

    def handle_starttag(self, tag, attrs):
        self.parts.append(["tag", tag])

    def handle_endtag(self, tag):
        self.parts.append(["end", tag])

    def handle_data(self, data):
        self.parts.append(["script" if self.lasttag == "script" and self.parts and self.parts[-1] == ["tag", "script"] else "text", data])


def run(target, author, body):
    html = load(target).render_comment(author, body)
    p = Parts()
    p.feed(html)
    p.close()
    return {"author": author, "body": body, "html": html, "parts": p.parts,
            "script_tags": sum(1 for k, v in p.parts if k == "tag" and v == "script")}


record = {f"{t}_{k}": run(t, *v) for t in ("exercise", "solution") for k, v in INPUTS.items()}

# クイズ: URL を html.escape するだけでは javascript: は残る。直した render_profile_link は拒否する
QUIZ_URL = "javascript:alert(document.cookie)"
try:
    load("solution").render_profile_link("mallory", QUIZ_URL)
    rejected = None
except ValueError as e:
    rejected = str(e)
record["quiz"] = {"url": QUIZ_URL, "escaped": __import__("html").escape(QUIZ_URL, quote=True), "solution_error": rejected}
OUT.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
print(OUT.read_text())
