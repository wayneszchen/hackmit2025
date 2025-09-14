# Carbon Footprint Backend

FastAPI service that scrapes an Amazon product page and estimates the carbon footprint of ordering that product.

## Endpoints

- GET `/api/health` → `{ "status": "ok" }`
- POST `/api/analyze`
  - Request body:
    {
      "url": "https://www.amazon.com/dp/B01741GFR4",
      "destination": "Boston",
      "shipping_mode": "auto" // one of: auto|ground|air|sea
    }
  - Response (example):
    {
      "product": { "title": "...", "weight_kg": 0.45, ... },
      "carbon": {
        "manufacturing_kgco2e": 2.72,
        "packaging_kgco2e": 0.245,
        "shipping_kgco2e": 0.054,
        "use_phase_kgco2e": 0.0,
        "end_of_life_kgco2e": 0.023
      },
      "total_kgco2e": 3.044,
      "confidence": 0.6,
      "assumptions": ["..."]
    }

## How it works

1. Scrapes the Amazon page via `aiohttp` + `BeautifulSoup` to extract title, brand, price, weight, dimensions, bullets, images, and ASIN.
2. Estimates emissions with simple heuristics:
   - Manufacturing: `6.0 kgCO2e/kg * item_weight_kg`
   - Packaging: `0.2 + 0.1 * item_weight_kg`
   - Shipping: `(per_kg_per_1000km) * item_weight_kg * (distance_km / 1000)`
     - `per_kg_per_1000km`: ground=0.1, air=0.6, sea=0.02; `auto` defaults to ground
     - `distance_km`: based on destination; defaults to regional distance if omitted
   - End-of-life: `0.05 * item_weight_kg`; Use-phase: `0.0`

These are rough, first-pass values intended for relative comparisons.

## Environment

- `.env` (optional):
  - `ENV`, `DEBUG`, `APP_NAME`
  - `USER_AGENT` (override UA string)
  - `REQUEST_TIMEOUT` (seconds)
  - `CORS_ALLOW_ORIGINS` (CSV)
  - `SCRAPER_API_KEY` and `SCRAPER_API_URL` (optional: if using a proxy/scraper provider)

## Run locally

Use the preconfigured VS Code task or run:

uvicorn backend.app:app --reload --port 8001

Then test:

curl -s -X POST http://127.0.0.1:8001/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://www.amazon.com/dp/B01741GFR4","destination":"Boston","shipping_mode":"auto"}' | jq

## Notes & next steps

- Amazon pages vary; scraping may fail due to anti-bot/SSL. Configure a scraping proxy via `SCRAPER_API_KEY` if needed.
- Add geocoding to refine shipping distances.
- Calibrate emission factors per category/materials, optionally using an LLM for better extraction.
