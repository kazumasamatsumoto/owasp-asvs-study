"""各演習のテストから import して、exercise / solution を切り替えるヘルパー。"""
import importlib.util
import os
from pathlib import Path


def load(test_file: str):
    name = os.environ.get("ASVS_LAB_TARGET", "exercise")
    path = Path(test_file).resolve().parent / f"{name}.py"
    spec = importlib.util.spec_from_file_location(f"{Path(test_file).parent.name}_{name}", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod
