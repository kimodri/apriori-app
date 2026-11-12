from os import PathLike
from typing import BinaryIO

import pandas as pd


def parse_transactions(transactions: dict[int, set[str]]) -> pd.DataFrame:
    items = pd.Series(transactions, dtype=object).explode()
    encoded = pd.get_dummies(items, dtype=int)
    return encoded.groupby(level=0).max().reindex(transactions, fill_value=0)


def parse_csv(path: str | PathLike[str]) -> pd.DataFrame:
    return _parse_csv(path)


def parse_csv_stream(stream: BinaryIO) -> pd.DataFrame:
    return _parse_csv(stream)


def _parse_csv(source: str | PathLike[str] | BinaryIO) -> pd.DataFrame:
    data = pd.read_csv(source, header=None, dtype=str)
    data.index += 1
    items = data.stack().str.strip()
    items = items[items.ne("")]
    encoded = pd.get_dummies(items, dtype=int)
    return encoded.groupby(level=0).max().reindex(data.index, fill_value=0)


