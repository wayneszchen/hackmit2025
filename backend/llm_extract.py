from __future__ import annotations

import json
from typing import Any, Dict, Optional
import aiohttp

from settings import settings


PROMPT = (
    "You are a strict information extraction tool. Given raw page text from an Amazon product, "
    "extract ONLY facts explicitly stated in the text. Do not infer or estimate. "
    "If a field is not clearly present, research and use relatively accurate estimates specific to the product. Convert units where needed. Return compact JSON.\n\n"
    "Fields to extract (null if not present):\n"
    "- item_weight_kg: number in kilograms (exactly as stated; convert lb/oz/g to kg).\n"
    "- shipping_weight_kg: number in kilograms (if a 'Shipping Weight' is explicitly stated).\n"
    "- materials: array of material strings exactly as listed (e.g., 'HDPE', 'PET', 'Glass').\n"
    "- materials_composition: array of { material: string, fraction: number in [0,1] } only if explicit percents/fractions are stated. Convert percent to fraction.\n"
    "- packaging_materials: array of material strings for packaging if explicitly stated (e.g., 'cardboard', 'paper', 'plastic film').\n"
    "- packaging_weight_kg: number in kilograms for packaging mass if explicitly stated.\n"
    "- country_of_origin: string if explicitly stated.\n"
    "Output keys: item_weight_kg, shipping_weight_kg, materials, materials_composition, packaging_materials, packaging_weight_kg, country_of_origin.\n"
)


async def extract_facts_claude(raw_text: str) -> Dict[str, Any]:
    if not settings.ANTHROPIC_API_KEY:
        return {"item_weight_kg": None, "shipping_weight_kg": None, "materials": [], "country_of_origin": None}

    headers = {
        "x-api-key": settings.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    body = {
        "model": "claude-3-haiku-20240307",
        "max_tokens": 400,
        "messages": [
            {"role": "user", "content": PROMPT + "\nTEXT:\n" + raw_text[:8000]},
        ],
        "temperature": 0.0,
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post("https://api.anthropic.com/v1/messages", headers=headers, data=json.dumps(body)) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    print(f"CLAUDE API ERROR: Status {resp.status} - {error_text}")
                    return {"item_weight_kg": None, "shipping_weight_kg": None, "materials": [], "country_of_origin": None}
                data = await resp.json()
                # Response content is an array of content blocks; take the first text block
                content = data.get("content", [])
                text = ""
                if content and isinstance(content, list) and content[0].get("type") == "text":
                    text = content[0].get("text", "")
                # Try parsing as JSON, else return empty
                try:
                    parsed = json.loads(text)
                    # Normalize types
                    return {
                        "item_weight_kg": parsed.get("item_weight_kg"),
                        "shipping_weight_kg": parsed.get("shipping_weight_kg"),
                        "materials": parsed.get("materials") or [],
                        "materials_composition": parsed.get("materials_composition") or [],
                        "packaging_materials": parsed.get("packaging_materials") or [],
                        "packaging_weight_kg": parsed.get("packaging_weight_kg"),
                        "country_of_origin": parsed.get("country_of_origin"),
                    }
                except Exception:
                    return {"item_weight_kg": None, "shipping_weight_kg": None, "materials": [], "country_of_origin": None}
    except Exception:
        return {"item_weight_kg": None, "shipping_weight_kg": None, "materials": [], "country_of_origin": None}
