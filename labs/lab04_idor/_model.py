"""演習共通のデータモデル（編集不要）"""
from dataclasses import dataclass


class NotFound(Exception):
    pass


class Forbidden(Exception):
    pass


@dataclass
class User:
    id: int
    role: str  # "user" | "admin"


@dataclass
class Invoice:
    id: int
    owner_id: int
    amount: int
    status: str = "unpaid"
    memo: str = ""
