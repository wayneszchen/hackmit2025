from __future__ import annotations

import re
from typing import Optional, Tuple


_PRICE_RE = re.compile(r"([\$£€])\s*([0-9]+(?:\.[0-9]{1,2})?)")
_WEIGHT_RE = re.compile(
    r"(?P<val>[0-9]+(?:\.[0-9]+)?)\s*(?P<unit>pounds|pound|lbs|lb|ounces|ounce|oz|kilograms|kilogram|kg|grams|gram|g)",
    re.I,
)
_DIM_RE = re.compile(
    r"([0-9]+(?:\.[0-9]+)?)\s*[x×]\s*([0-9]+(?:\.[0-9]+)?)\s*[x×]\s*([0-9]+(?:\.[0-9]+)?)\s*(inches|inch|in|cm|millimeters|millimeter|mm)",
    re.I,
)


def parse_price(text: str) -> tuple[float | None, str | None]:
    m = _PRICE_RE.search(text)
    if not m:
        return None, None
    sym, amt = m.groups()
    currency = {"$": "USD", "£": "GBP", "€": "EUR"}.get(sym, "USD")
    return float(amt), currency


def parse_weight_kg(text: str) -> Optional[float]:
    m = _WEIGHT_RE.search(text)
    if not m:
        return None
    val = float(m.group("val"))
    unit = m.group("unit").lower()
    if unit in {"kg", "kilogram", "kilograms"}:
        return val
    if unit in {"g", "gram", "grams"}:
        return val / 1000.0
    if unit in {"lb", "lbs", "pound", "pounds"}:
        return val * 0.453592
    if unit in {"oz", "ounce", "ounces"}:
        return val * 0.0283495
    return None


def parse_dimensions_cm(text: str) -> Optional[Tuple[float, float, float]]:
    m = _DIM_RE.search(text)
    if not m:
        return None
    a, b, c, unit = m.groups()
    dims = [float(a), float(b), float(c)]
    unit = unit.lower()
    if unit in {"in", "inch", "inches"}:
        dims = [d * 2.54 for d in dims]
    elif unit in {"mm", "millimeter", "millimeters"}:
        dims = [d / 10.0 for d in dims]
    return tuple(dims)  # type: ignore[return-value]


def clean_text(s: str | None) -> str | None:
    if s is None:
        return None
    return re.sub(r"\s+", " ", s).strip()
