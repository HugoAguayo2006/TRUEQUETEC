import asyncio
import json
import os
import re
import ssl
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from statistics import mean
from typing import Any

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Query

try:
    import certifi
except ModuleNotFoundError:
    certifi = None

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

pricing_router = APIRouter(prefix="/pricing", tags=["Pricing"])

SERP_API_URL = "https://serpapi.com/search.json"
DEFAULT_USD_TO_MXN_RATE = 18.5
STOPWORDS = {
    "a",
    "an",
    "and",
    "de",
    "del",
    "el",
    "la",
    "las",
    "los",
    "the",
    "with",
}


def normalize_text(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def query_tokens(value: str) -> list[str]:
    return [token for token in normalize_text(value).split() if token not in STOPWORDS and len(token) >= 2]


def title_matches_query(title: str, query: str) -> bool:
    title_norm = normalize_text(title)
    query_norm = normalize_text(query)
    if not title_norm or not query_norm:
        return False
    if query_norm in title_norm:
        return True

    search_tokens = query_tokens(query)
    title_tokens = query_tokens(title)
    if not search_tokens or not title_tokens:
        return False

    matched = 0
    for search_token in search_tokens:
        if any(
            title_token == search_token
            or title_token.startswith(search_token)
            or search_token.startswith(title_token)
            for title_token in title_tokens
        ):
            matched += 1

    required = max(1, round(len(search_tokens) * 0.5))
    return matched >= required


def parse_price(value: Any) -> float | None:
    if isinstance(value, (int, float)) and value > 0:
        return float(value)
    if not isinstance(value, str):
        return None

    match = re.search(r"(\d+(?:[,\s]\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)", value)
    if not match:
        return None

    try:
        price = float(match.group(1).replace(",", "").replace(" ", ""))
    except ValueError:
        return None
    return price if price > 0 else None


def detect_currency(result: dict[str, Any]) -> str:
    currency = result.get("currency")
    if isinstance(currency, str) and currency.strip():
        return currency.strip().upper()

    price_text = str(result.get("price") or "")
    if "mx$" in price_text.lower() or "mxn" in price_text.lower():
        return "MXN"
    if "usd" in price_text.lower() or "us$" in price_text.lower():
        return "USD"
    return "MXN"


def usd_to_mxn_rate() -> float:
    try:
        return float(os.getenv("USD_TO_MXN_RATE", DEFAULT_USD_TO_MXN_RATE))
    except ValueError:
        return DEFAULT_USD_TO_MXN_RATE


def convert_to_mxn(price: float, currency: str) -> float:
    if currency.upper() == "MXN":
        return price
    if currency.upper() == "USD":
        return price * usd_to_mxn_rate()
    return price


def fetch_serp(query: str, api_key: str) -> dict[str, Any]:
    params = urllib.parse.urlencode(
        {
            "engine": "google_shopping",
            "q": query,
            "google_domain": "google.com.mx",
            "gl": "mx",
            "hl": "es",
            "api_key": api_key,
        }
    )
    request = urllib.request.Request(f"{SERP_API_URL}?{params}", headers={"Accept": "application/json"})
    context = ssl.create_default_context(cafile=certifi.where() if certifi else None)
    with urllib.request.urlopen(request, timeout=12, context=context) as response:
        return json.loads(response.read().decode("utf-8"))


@pricing_router.get("/estimate", summary="Estimar precio real de un producto")
async def estimate_price(q: str = Query(..., min_length=2)):
    api_key = os.getenv("SERP_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Falta SERP_API_KEY en server/.env")

    try:
        payload = await asyncio.to_thread(fetch_serp, q, api_key)
    except urllib.error.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"SERP API falló con estado {exc.code}") from exc
    except urllib.error.URLError as exc:
        reason = str(exc.reason)
        if "CERTIFICATE_VERIFY_FAILED" in reason:
            raise HTTPException(
                status_code=502,
                detail="No se pudo verificar el certificado SSL de SERP API. Instala las dependencias del backend de nuevo.",
            ) from exc
        raise HTTPException(status_code=502, detail=f"No se pudo conectar con SERP API: {reason}") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"SERP API falló: {str(exc)}") from exc

    if payload.get("error"):
        raise HTTPException(status_code=502, detail=f"SERP API falló: {payload['error']}")

    valid_results: list[dict[str, Any]] = []
    for result in payload.get("shopping_results") or []:
        title = result.get("title") or ""
        if not title_matches_query(title, q):
            continue

        price = parse_price(result.get("extracted_price")) or parse_price(result.get("price"))
        if price is None:
            continue
        source_currency = detect_currency(result)
        price_mxn = convert_to_mxn(price, source_currency)

        valid_results.append(
            {
                "title": title,
                "store": result.get("source") or result.get("seller") or "Tienda no especificada",
                "price": round(price_mxn, 2),
                "link": result.get("link") or result.get("product_link") or "",
                "currency": "MXN",
            }
        )

    if not valid_results:
        raise HTTPException(status_code=404, detail=f"No hay precios válidos para '{q}' en SERP API")

    prices = [result["price"] for result in valid_results]
    currency = "MXN"

    return {
        "query": q,
        "currency": currency,
        "count": len(valid_results),
        "minimum": round(min(prices), 2),
        "average": round(mean(prices), 2),
        "maximum": round(max(prices), 2),
        "stores": [
            {
                "title": result["title"],
                "store": result["store"],
                "price": result["price"],
                "link": result["link"],
            }
            for result in valid_results
        ],
    }
