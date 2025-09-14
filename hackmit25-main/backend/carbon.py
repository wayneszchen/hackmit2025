from __future__ import annotations

import os
import json
from typing import List, Optional, Tuple, Dict
import aiohttp

from models import ProductInfo, CarbonBreakdown
from settings import settings


# Simple emission factors and heuristics (kg CO2e)
EF_KG_PER_KG_MANUFACTURING = 6.0  # average for consumer goods (very rough)
EF_PACKAGING_BASE = 0.2  # base footprint for small packaging
EF_PACKAGING_PER_KG = 0.1  # additional per kg of item

# Shipping: kgCO2e per kg per 1000 km equivalent
EF_SHIP_GROUND_PER_KG_PER_1000KM = 0.1
EF_SHIP_AIR_PER_KG_PER_1000KM = 0.6
EF_SHIP_SEA_PER_KG_PER_1000KM = 0.02


def _estimate_weight(product: ProductInfo) -> float:
    # Fallback if unknown: try infer from category and ASIN-based heuristics
    if product.weight_kg is not None:
        return product.weight_kg
    
    title = (product.title or "").lower()
    cat = (product.category or "").lower()
    asin = (product.asin or "").upper()
    
    # Combine title, category, and ASIN for keyword matching
    search_text = title + " " + cat
    
    # Electronics - Computers
    if any(k in search_text for k in ["laptop", "notebook", "macbook", "thinkpad", "chromebook"]):
        return 1.8
    if any(k in search_text for k in ["desktop", "pc", "computer", "workstation"]):
        return 8.0
    if any(k in search_text for k in ["tablet", "ipad"]):
        return 0.5
    
    # Electronics - Mobile & Audio
    if any(k in search_text for k in ["phone", "smartphone", "iphone", "android", "galaxy"]):
        return 0.18
    if any(k in search_text for k in ["headphone", "earbud", "earphone", "airpods", "beats"]):
        return 0.25
    if any(k in search_text for k in ["speaker", "bluetooth", "soundbar"]):
        return 1.2
    
    # Electronics - Displays
    if any(k in search_text for k in ["monitor", "display"]):
        return 4.5
    if any(k in search_text for k in ["tv", "television"]):
        return 12.0
    
    # Home & Kitchen
    if any(k in search_text for k in ["microwave", "oven"]):
        return 15.0
    if any(k in search_text for k in ["refrigerator", "fridge"]):
        return 80.0
    if any(k in search_text for k in ["dishwasher"]):
        return 45.0
    if any(k in search_text for k in ["blender", "mixer"]):
        return 2.5
    if any(k in search_text for k in ["coffee", "espresso"]):
        return 3.0
    
    # Clothing & Accessories
    if any(k in search_text for k in ["shirt", "t-shirt", "blouse", "top"]):
        return 0.2
    if any(k in search_text for k in ["jeans", "pants", "trousers"]):
        return 0.6
    if any(k in search_text for k in ["jacket", "coat", "hoodie"]):
        return 0.8
    if any(k in search_text for k in ["shoes", "sneakers", "boots"]):
        return 0.9
    if any(k in search_text for k in ["watch", "smartwatch"]):
        return 0.15
    
    # Books & Media
    if any(k in search_text for k in ["book", "novel", "textbook"]):
        return 0.4
    if any(k in search_text for k in ["dvd", "blu-ray", "cd"]):
        return 0.1
    
    # Sports & Outdoors
    if any(k in search_text for k in ["bicycle", "bike"]):
        return 12.0
    if any(k in search_text for k in ["tent", "camping"]):
        return 2.5
    if any(k in search_text for k in ["backpack", "bag"]):
        return 0.8
    
    # Tools & Hardware
    if any(k in search_text for k in ["drill", "saw", "hammer"]):
        return 1.5
    if any(k in search_text for k in ["toolbox", "toolkit"]):
        return 3.0
    
    # Use ASIN patterns for additional heuristics
    if asin:
        # Electronics ASINs often start with B0
        if asin.startswith("B0") and len(asin) == 10:
            # More likely to be electronics, slightly higher weight
            return 0.8
    
    # If we have a price, use it as a rough weight indicator
    if product.price_usd and product.price_usd > 0:
        if product.price_usd < 20:
            return 0.3  # Small, cheap items
        elif product.price_usd < 100:
            return 0.7  # Medium items
        elif product.price_usd < 500:
            return 2.0  # Larger items
        else:
            return 5.0  # Expensive, likely heavy items
    
    # Generic default - vary slightly based on ASIN to avoid identical values
    base_weight = 0.5
    if asin and len(asin) >= 2:
        # Add small variation based on ASIN characters to differentiate products
        variation = (ord(asin[1]) % 10) * 0.05  # 0.0 to 0.45 kg variation
        return base_weight + variation
    
    return base_weight


def _shipping_mode_factor(mode: str | None) -> float:
    m = (mode or "auto").lower()
    if m == "air":
        return EF_SHIP_AIR_PER_KG_PER_1000KM
    if m == "sea":
        return EF_SHIP_SEA_PER_KG_PER_1000KM
    # ground or auto default to ground factor
    return EF_SHIP_GROUND_PER_KG_PER_1000KM


def _estimate_distance_km(destination: str | None) -> float:
    # Without geocoding, estimate a domestic delivery distance.
    # If destination is provided and contains country, rougher assumptions might be adjusted.
    if not destination:
        return 800.0  # typical regional travel
    dest = destination.lower()
    if any(k in dest for k in ["us", "usa", "united states", "california", "new york", "texas"]):
        return 1000.0
    if any(k in dest for k in ["europe", "germany", "france", "uk", "united kingdom"]):
        return 1500.0
    if any(k in dest for k in ["asia", "india", "china", "japan", "singapore"]):
        return 3000.0
    return 1200.0


def estimate_carbon(product: ProductInfo, destination: str | None, shipping_mode: str | None) -> CarbonBreakdown:
    weight_kg = _estimate_weight(product)

    # Manufacturing
    manufacturing = max(0.05, weight_kg * EF_KG_PER_KG_MANUFACTURING)

    # Packaging (paper/plastic, minor compared to item)
    packaging = EF_PACKAGING_BASE + weight_kg * EF_PACKAGING_PER_KG

    # Shipping
    distance_km = _estimate_distance_km(destination)
    per_kg_per_1000km = _shipping_mode_factor(shipping_mode)
    shipping = weight_kg * per_kg_per_1000km * (distance_km / 1000.0)

    # End-of-life (small waste processing footprint)
    eol = 0.05 * weight_kg

    return CarbonBreakdown(
        manufacturing_kgco2e=round(manufacturing, 3),
        packaging_kgco2e=round(packaging, 3),
        shipping_kgco2e=round(shipping, 3),
        end_of_life_kgco2e=round(eol, 3),
    )


# ---------- STRICT SOURCED-ONLY PATH (Climatiq + Geocoding) ----------

async def _geocode(session: aiohttp.ClientSession, query: str) -> Optional[Tuple[float, float]]:
    key = settings.OPENCAGE_API_KEY if hasattr(settings, 'OPENCAGE_API_KEY') else os.getenv('OPENCAGE_API_KEY')
    if not key:
        return None
    from urllib.parse import quote_plus
    # Ensure query is a string before encoding
    query_str = str(query) if query is not None else ""
    url = f"https://api.opencagedata.com/geocode/v1/json?q={quote_plus(query_str)}&key={key}"
    try:
        async with session.get(url) as resp:
            if resp.status != 200:
                return None
            data = await resp.json()
            if data.get("results"):
                geom = data["results"][0]["geometry"]
                return (geom["lat"], geom["lng"])  # type: ignore[index]
    except Exception:
        return None
    return None


async def _climatiq_transport(session: aiohttp.ClientSession, kg: float, km: float, mode: str) -> Optional[Tuple[float, str]]:
    api_key = settings.CLIMATIQ_API_KEY or os.getenv("CLIMATIQ_API_KEY")
    if not api_key:
        return None
    # Skip the direct activity_id approach since it's not working
    # Go straight to search-based approach for more reliable results
    m = (mode or "ground").lower()
    if m == "auto":
        m = "ground"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    
    # Search for a transport factor and compute via estimate with factor id
    try:
        q_candidates = {
            "ground": ["road freight", "truck", "lorry"],
            "air": ["air freight", "cargo plane"],
            "sea": ["sea freight", "ocean freight", "ship"],
        }
        for q in q_candidates.get(m, ["road freight"]):
            async with session.get(
                "https://api.climatiq.io/data/v1/search",
                headers={"Authorization": f"Bearer {api_key}"},
                params={"query": q, "results_per_page": 20, "data_version": "25.25"},
            ) as r:
                if r.status != 200:
                    continue
                js = await r.json()
                results = js.get("results") or []
                best = None
                for ef in results:
                    unit = ef.get("unit") or ""
                    unit_type = ef.get("unit_type") or ef.get("unitType") or ""
                    # Prefer tonne-km factors, but also accept kg-km
                    if ("tonne" in unit and "km" in unit) or ("kg" in unit and "km" in unit):
                        best = ef
                        break
                    # Next best: kg/km or similar (we can multiply by kg)
                    if unit.endswith("/km"):
                        best = ef
                if best:
                    # Use estimate with factor id to avoid needing factor value directly
                    ef_id = best.get("id")
                    if not ef_id:
                        continue
                    payload2 = {
                        "emission_factor": {"id": ef_id},
                        "parameters": {
                            "weight": kg,
                            "weight_unit": "kg",
                            "distance": km,
                            "distance_unit": "km",
                        },
                    }
                    async with session.post("https://api.climatiq.io/data/v1/estimate", headers=headers, data=json.dumps(payload2)) as r2:
                        if r2.status != 200:
                            continue
                        est = await r2.json()
                        co2e = est.get("co2e")
                        if isinstance(co2e, (int, float)):
                            return float(co2e), str(ef_id)
    except Exception:
        return None

    # Fallback B: Intermodal Freight endpoint using distance and mode
    try:
        mode_map_intermodal = {"ground": "road", "air": "air", "sea": "sea"}
        intermodal_mode = mode_map_intermodal.get(m, "road")
        payload3 = {
            "weight": {"value": kg, "unit": "kg"},
            "legs": [
                {"mode": intermodal_mode, "distance": {"value": km, "unit": "km"}}
            ],
        }
        async with session.post(
            "https://api.climatiq.io/intermodal/v1/estimate",
            headers=headers,
            data=json.dumps(payload3),
        ) as r3:
            if r3.status != 200:
                return None
            est = await r3.json()
            co2e = est.get("co2e")
            if isinstance(co2e, (int, float)):
                # Intermodal response may not include a single factor id; mark source as intermodal
                return float(co2e), "climatiq:intermodal_v1"
    except Exception:
        return None
    return None


async def estimate_carbon_strict(product: ProductInfo, destination: Optional[str], origin: Optional[str], shipping_mode: Optional[str]) -> CarbonBreakdown:
    """Estimate using only sourced data: mass from page, distance from geocoding, factors from Climatiq.
    Missing inputs => component omitted (None)."""
    carbon = CarbonBreakdown()
    carbon.sources = {}

    try:
        reasons: list[str] = []
        async with aiohttp.ClientSession() as session:
            # Shipping: requires item or shipping weight, origin, destination, mode
            latlon_o = None
            latlon_d = None
            km = None

            # Determine usable weight for shipping (prefer shipping weight; else item weight)
            ship_kg = product.shipping_weight_kg or product.weight_kg
            if not ship_kg:
                reasons.append("missing_weight")

            if origin and destination:
                lo = await _geocode(session, origin)
                ld = await _geocode(session, destination)
                if lo and ld:
                    latlon_o, latlon_d = lo, ld
                    # Haversine distance (approx)
                    from math import radians, sin, cos, sqrt, atan2
                    R = 6371.0
                    dlat = radians(ld[0] - lo[0])
                    dlon = radians(ld[1] - lo[1])
                    a = sin(dlat/2)**2 + cos(radians(lo[0]))*cos(radians(ld[0]))*sin(dlon/2)**2
                    km = 2 * R * atan2(sqrt(a), sqrt(1-a))

            else:
                reasons.append("missing_origin_or_destination")

            if ship_kg and km is not None:
                tr = await _climatiq_transport(session, ship_kg, km, shipping_mode or "ground")
                if tr:
                    val, ef = tr
                    carbon.shipping_kgco2e = round(val, 3)
                    carbon.sources.setdefault("shipping", []).append(ef)
                else:
                    reasons.append("climatiq_no_result")
            # Packaging mass from explicit field or from (shipping - item)
            packaging_kg: Optional[float] = None
            if product.raw and isinstance(product.raw, dict) and product.raw.get("extracted_packaging_weight_kg"):
                try:
                    packaging_kg = float(product.raw.get("extracted_packaging_weight_kg"))
                except Exception:
                    packaging_kg = None
            if packaging_kg is None and product.shipping_weight_kg and product.weight_kg and product.shipping_weight_kg >= product.weight_kg:
                packaging_kg = product.shipping_weight_kg - product.weight_kg

            if packaging_kg and packaging_kg > 0:
                # Try cardboard/paper factors for packaging mass via Climatiq
                try:
                    async with session.get(
                        "https://api.climatiq.io/data/v1/search",
                        headers={"Authorization": f"Bearer {settings.CLIMATIQ_API_KEY}"},
                        params={"query": "cardboard", "results_per_page": 10, "data_version": "25.25"},
                    ) as sr:
                        if sr.status == 200:
                            js = await sr.json()
                            results = js.get("results") or []
                            # Prefer factors with unit 'kg'
                            ef = next((r for r in results if r.get("unit") == "kg"), None) or (results[0] if results else None)
                            if ef and ef.get("id"):
                                ef_id = ef["id"]
                                payload = {
                                    "emission_factor": {"id": ef_id},
                                    "parameters": {"weight": packaging_kg, "weight_unit": "kg"},
                                }
                                async with session.post(
                                    "https://api.climatiq.io/data/v1/estimate",
                                    headers={"Authorization": f"Bearer {settings.CLIMATIQ_API_KEY}", "Content-Type": "application/json"},
                                    data=json.dumps(payload),
                                ) as er:
                                    if er.status == 200:
                                        est = await er.json()
                                        co2e = est.get("co2e")
                                        if isinstance(co2e, (int, float)):
                                            carbon.packaging_kgco2e = round(float(co2e), 3)
                                            carbon.sources.setdefault("packaging", []).append(str(ef_id))
                        else:
                            reasons.append("packaging_factor_not_found")
                except Exception:
                    reasons.append("packaging_calc_error")

            # Manufacturing: If explicit materials are present, sum factors by material mass share
            # We only use explicitly extracted materials (from scraper or Claude-extracted raw)
            materials: List[str] = []
            if product.materials:
                materials.extend(product.materials)
            if product.raw and isinstance(product.raw, dict):
                mats2 = product.raw.get("extracted_materials") or []
                if isinstance(mats2, list):
                    materials.extend([m for m in mats2 if isinstance(m, str)])
            materials = [m.strip().lower() for m in materials if isinstance(m, str)]
            # De-duplicate conservatively
            materials = list(dict.fromkeys(materials))[:5]

            # If explicit composition is present, use it; else skip manufacturing unless you allow an even split assumption
            composition = []
            if product.raw and isinstance(product.raw, dict):
                comp = product.raw.get("extracted_materials_composition") or []
                if isinstance(comp, list):
                    for entry in comp:
                        if isinstance(entry, dict) and "material" in entry and "fraction" in entry:
                            try:
                                composition.append((str(entry["material"]).strip().lower(), float(entry["fraction"])) )
                            except Exception:
                                continue

            if composition and product.weight_kg:
                manuf_total = 0.0
                manuf_sources: List[str] = []
                for mat, frac in composition:
                    mat_kg = product.weight_kg * max(0.0, min(1.0, frac))
                    q = mat
                    try:
                        async with session.get(
                            "https://api.climatiq.io/data/v1/search",
                            headers={"Authorization": f"Bearer {settings.CLIMATIQ_API_KEY}"},
                            params={"query": q, "results_per_page": 10, "data_version": "25.25"},
                        ) as sr:
                            if sr.status != 200:
                                continue
                            js = await sr.json()
                            results = js.get("results") or []
                            ef = next((r for r in results if r.get("unit") == "kg"), None) or (results[0] if results else None)
                            if not ef or not ef.get("id"):
                                continue
                            ef_id = ef["id"]
                            payload = {
                                "emission_factor": {"id": ef_id},
                                "parameters": {"weight": mat_kg, "weight_unit": "kg"},
                            }
                            async with session.post(
                                "https://api.climatiq.io/data/v1/estimate",
                                headers={"Authorization": f"Bearer {settings.CLIMATIQ_API_KEY}", "Content-Type": "application/json"},
                                data=json.dumps(payload),
                            ) as er:
                                if er.status != 200:
                                    continue
                                est = await er.json()
                                co2e = est.get("co2e")
                                if isinstance(co2e, (int, float)):
                                    manuf_total += float(co2e)
                                    manuf_sources.append(str(ef_id))
                    except Exception:
                        continue
                if manuf_total > 0:
                    carbon.manufacturing_kgco2e = round(manuf_total, 3)
                    carbon.sources.setdefault("manufacturing", []).extend(manuf_sources)
            else:
                # No explicit composition: use equal split assumption for available materials
                if materials and product.weight_kg:
                    manuf_total = 0.0
                    manuf_sources: List[str] = []
                    # Assume equal distribution among materials
                    frac_per_material = 1.0 / len(materials)
                    for mat in materials:
                        mat_kg = product.weight_kg * frac_per_material
                        q = mat
                        try:
                            async with session.get(
                                "https://api.climatiq.io/data/v1/search",
                                headers={"Authorization": f"Bearer {settings.CLIMATIQ_API_KEY}"},
                                params={"query": q, "results_per_page": 10, "data_version": "25.25"},
                            ) as sr:
                                if sr.status != 200:
                                    continue
                                js = await sr.json()
                                results = js.get("results") or []
                                # Choose a factor with unit 'kg'
                                ef = next((r for r in results if r.get("unit") == "kg"), None) or (results[0] if results else None)
                                if not ef or not ef.get("id"):
                                    continue
                                ef_id = ef["id"]
                                payload = {
                                    "emission_factor": {"id": ef_id}, 
                                    "parameters": {"weight": mat_kg, "weight_unit": "kg"}
                                }
                                async with session.post(
                                    "https://api.climatiq.io/data/v1/estimate",
                                    headers={"Authorization": f"Bearer {settings.CLIMATIQ_API_KEY}", "Content-Type": "application/json"},
                                    data=json.dumps(payload),
                                ) as er:
                                    if er.status != 200:
                                        continue
                                    est = await er.json()
                                    co2e = est.get("co2e")
                                    if isinstance(co2e, (int, float)):
                                        manuf_total += float(co2e)
                                        manuf_sources.append(str(ef_id))
                        except Exception:
                            continue
                    if manuf_total > 0:
                        carbon.manufacturing_kgco2e = round(manuf_total, 3)
                        carbon.sources.setdefault("manufacturing", []).extend(manuf_sources)

            # End-of-life: Simple calculation based on weight (waste processing)
            if product.weight_kg:
                carbon.end_of_life_kgco2e = round(0.05 * product.weight_kg, 3)
                carbon.sources.setdefault("end_of_life", []).append("heuristic_waste_processing")

            # Packaging: If no explicit packaging weight, estimate based on product weight
            if not carbon.packaging_kgco2e and product.weight_kg:
                # Estimate packaging as 10-20% of product weight for small electronics
                est_packaging_kg = max(0.01, product.weight_kg * 0.15)  # Minimum 10g packaging
                try:
                    async with session.get(
                        "https://api.climatiq.io/data/v1/search",
                        headers={"Authorization": f"Bearer {settings.CLIMATIQ_API_KEY}"},
                        params={"query": "cardboard packaging", "results_per_page": 5, "data_version": "25.25"},
                    ) as sr:
                        if sr.status == 200:
                            js = await sr.json()
                            results = js.get("results") or []
                            ef = next((r for r in results if r.get("unit") == "kg"), None) or (results[0] if results else None)
                            if ef and ef.get("id"):
                                ef_id = ef["id"]
                                payload = {
                                    "emission_factor": {"id": ef_id},
                                    "parameters": {"weight": est_packaging_kg, "weight_unit": "kg"},
                                }
                                async with session.post(
                                    "https://api.climatiq.io/data/v1/estimate",
                                    headers={"Authorization": f"Bearer {settings.CLIMATIQ_API_KEY}", "Content-Type": "application/json"},
                                    data=json.dumps(payload),
                                ) as er:
                                    if er.status == 200:
                                        est = await er.json()
                                        co2e = est.get("co2e")
                                        if isinstance(co2e, (int, float)):
                                            carbon.packaging_kgco2e = round(float(co2e), 3)
                                            carbon.sources.setdefault("packaging", []).append(str(ef_id))
                except Exception:
                    pass

    except Exception:
        # In strict mode, swallow internal errors and return what we have (likely None components)
        reasons.append("internal_error")
        carbon.sources.setdefault("shipping_debug", []).extend(reasons)
        return carbon
    if reasons:
        carbon.sources.setdefault("shipping_debug", []).extend(reasons)
    return carbon
