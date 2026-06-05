import json
import os
import re
import ssl
from pathlib import Path
from statistics import mean
from typing import Any
from urllib.parse import urlencode
from urllib.request import urlopen

import certifi

from fastapi import APIRouter, HTTPException, Query

pricing_router = APIRouter(prefix="/pricing", tags=["Pricing"])

SERP_ENDPOINT = "https://serpapi.com/search.json"
SERVER_DIR = Path(__file__).resolve().parents[2]
PROJECT_DIR = SERVER_DIR.parent


def _load_env_file(path: Path) -> None:
    if not path.exists():
        return
    with path.open("r", encoding="utf-8") as env_file:
        for line in env_file:
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, value = stripped.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_env_file(PROJECT_DIR / ".env")
_load_env_file(SERVER_DIR / ".env")


def _parse_price(value: Any) -> float | None:
    if isinstance(value, (int, float)) and value > 0:
        return float(value)
    if not isinstance(value, str):
        return None

    match = re.search(r"(\d[\d,]*(?:\.\d{1,2})?)", value.replace("\xa0", " "))
    if not match:
        return None

    price = float(match.group(1).replace(",", ""))
    if price <= 0:
        return None
    return price


def _extract_store(result: dict[str, Any]) -> str:
    return (
        result.get("source")
        or result.get("merchant")
        or result.get("seller")
        or result.get("displayed_link")
        or result.get("link")
        or "Unknown store"
    )


def _normalize_text(value: str) -> str:
    return " ".join(re.findall(r"[a-z0-9]+", value.lower()))


def _query_tokens(query: str) -> list[str]:
    return [token for token in _normalize_text(query).split() if len(token) >= 3]


def _requires_first_token(query: str) -> bool:
    raw_tokens = [token for token in re.findall(r"[A-Za-z0-9]+", query) if len(token) >= 3]
    if not raw_tokens:
        return False
    first_token = raw_tokens[0]
    return first_token.isupper() or any(char.isdigit() for char in first_token)


def _matches_query(result: dict[str, Any], query: str) -> bool:
    tokens = _query_tokens(query)
    if not tokens:
        return True

    searchable = _normalize_text(
        " ".join(
            str(result.get(key) or "")
            for key in ("title", "source", "merchant", "seller", "displayed_link")
        )
    )
    first_token = tokens[0]
    matched_count = sum(1 for token in tokens if token in searchable)

    if _requires_first_token(query):
        return first_token in searchable
    if len(first_token) >= 3 and first_token in searchable:
        return True
    return matched_count >= max(2, len(tokens) // 2)


def _extract_prices(payload: dict[str, Any], query: str) -> list[dict[str, Any]]:
    candidate_sections = [
        "shopping_results",
        "inline_shopping_results",
        "sellers_results",
        "organic_results",
    ]
    stores: list[dict[str, Any]] = []

    for section in candidate_sections:
        results = payload.get(section)
        if not isinstance(results, list):
            continue

        for result in results:
            if not isinstance(result, dict):
                continue

            if not _matches_query(result, query):
                continue

            raw_price = (
                result.get("extracted_price")
                or result.get("price")
                or result.get("price_from")
                or result.get("price_to")
            )
            price = _parse_price(raw_price)
            if price is None:
                continue

            stores.append(
                {
                    "title": result.get("title") or "Product result",
                    "store": _extract_store(result),
                    "price": round(price, 2),
                    "link": result.get("link") or result.get("product_link") or "",
                }
            )

    deduped: list[dict[str, Any]] = []
    seen: set[tuple[str, float]] = set()
    for store in stores:
        key = (str(store["store"]).lower(), float(store["price"]))
        if key in seen:
            continue
        seen.add(key)
        deduped.append(store)

    return deduped


@pricing_router.get("/estimate")
async def estimate_product_price(q: str = Query(..., min_length=2)):
    api_key = os.getenv("SERP_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="SERP_API_KEY is not configured")

    params = {
        "engine": "google_shopping",
        "q": q,
        "api_key": api_key,
        "gl": "us",
        "hl": "en",
    }
    url = f"{SERP_ENDPOINT}?{urlencode(params)}"

    try:
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        with urlopen(url, timeout=12, context=ssl_context) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"SERP API request failed: {exc}") from exc

    stores = _extract_prices(payload, q)
    prices = [store["price"] for store in stores]
    if not prices:
        raise HTTPException(status_code=404, detail="No valid prices found for this product")

    return {
        "query": q,
        "currency": "USD",
        "count": len(prices),
        "minimum": round(min(prices), 2),
        "average": round(mean(prices), 2),
        "maximum": round(max(prices), 2),
        "stores": stores,
    }
