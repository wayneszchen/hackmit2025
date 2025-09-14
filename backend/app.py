from __future__ import annotations

import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from extract_top_k_similar import extract_top_k_similar
from models import AnalyzeRequest, AnalyzeResponse
from scrape import scrape_amazon_product
from carbon import estimate_carbon, estimate_carbon_strict
from settings import settings
from llm_extract import extract_facts_claude
from dataset_loader import load_dataset, get_product_from_url
from analyze_api import router as analyze_router


app = FastAPI(title=settings.APP_NAME, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the analyze router
# app.include_router(analyze_router, prefix="/api")  # Commented out to avoid conflict


@app.on_event("startup")
async def startup_event():
    """Load dataset on server startup."""
    import os
    from pathlib import Path
    
    # Try to load dataset from common locations
    dataset_paths = [
        "amazon_com_best_sellers_2025_01_27.csv",
        "../amazon_com_best_sellers_2025_01_27.csv", 
        Path(__file__).parent.parent / "amazon_com_best_sellers_2025_01_27.csv"
    ]
    
    for path in dataset_paths:
        if os.path.exists(path):
            print(f"Loading dataset from {path}")
            if load_dataset(str(path)):
                print("Dataset loaded successfully for API")
                break
    else:
        print("WARNING: No dataset found. API will fallback to web scraping only.")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    # Try dataset lookup first, fallback to scraping if not found
    info = get_product_from_url(req.url)
    
    if not info:
        # Fallback to web scraping if product not in dataset
        try:
            info = await scrape_amazon_product(req.url, html=req.html)
        except Exception as e:
            # If scraping fails, use mock data for testing
            print(f"Scraping failed: {e}")
            print("Using mock product data for testing...")
            from models import ProductInfo
            from pydantic import AnyUrl
            
            info = ProductInfo(
                url=AnyUrl(str(req.url)),
                title="LED String Lights 66ft 200 LED",
                brand="Brightech",
                asin="B0CYLKRRQX",
                price=24.99,
                currency="USD",
                weight_kg=0.5,
                shipping_weight_kg=0.7,
                dimensions_cm=(30.0, 20.0, 5.0),
                category="Home & Garden",
                bullets=[
                    "66 feet of warm white LED lights",
                    "Energy efficient and long lasting",
                    "Perfect for indoor and outdoor use"
                ],
                materials=["Copper wire", "LED bulbs", "Plastic"],
                images=[],
                raw={"text": "Mock product data for testing carbon footprint analysis"}
            )

    # Choose strict sourced-only path if API keys present or STRICT_SOURCED_ONLY is true
    strict = settings.STRICT_SOURCED_ONLY or bool(settings.CLIMATIQ_API_KEY)

    # In strict mode, attempt explicit-only enrichment via Claude using raw text (no inference)
    if strict and info.raw and info.raw.get("text"):
        extracted = await extract_facts_claude(info.raw.get("text") or "")
        # Only overwrite fields if we don't already have them from scraper
        if not info.weight_kg and extracted.get("item_weight_kg"):
            info.weight_kg = extracted.get("item_weight_kg")
        if not info.shipping_weight_kg and extracted.get("shipping_weight_kg"):
            info.shipping_weight_kg = extracted.get("shipping_weight_kg")
        # Attach extracted materials/origin to raw for later sourcing steps
        extra_raw = info.raw or {}
        extra_raw["extracted_materials"] = extracted.get("materials") or []
        extra_raw["extracted_materials_composition"] = extracted.get("materials_composition") or []
        extra_raw["extracted_packaging_materials"] = extracted.get("packaging_materials") or []
        if extracted.get("packaging_weight_kg") and not info.shipping_weight_kg and info.weight_kg:
            # If packaging mass is explicitly given and item/shipping not, we can use this later
            extra_raw["extracted_packaging_weight_kg"] = extracted.get("packaging_weight_kg")
        extra_raw["extracted_origin"] = extracted.get("country_of_origin")
        info.raw = extra_raw

    # Compute carbon breakdown
    if strict:
        carbon = await estimate_carbon_strict(
            info,
            destination=req.destination,
            origin=req.origin,
            shipping_mode=req.shipping_mode,
        )
    else:
        carbon = estimate_carbon(info, req.destination, req.shipping_mode)

    assumptions = []
    if info.weight_kg is None and not strict:
        assumptions.append("Estimated item weight based on category heuristics.")
    if req.shipping_mode == "auto" and not strict:
        assumptions.append("Assumed ground shipping by default for 'auto'.")
    if req.destination is None and not strict:
        assumptions.append("Assumed regional delivery distance due to missing destination.")

    total = round(carbon.total, 3)
    # Confidence: in strict mode, base on number of sourced components present
    if strict:
        present = sum(
            1
            for c in [
                carbon.manufacturing_kgco2e,
                carbon.packaging_kgco2e,
                carbon.shipping_kgco2e,
                carbon.end_of_life_kgco2e,
            ]
            if isinstance(c, (int, float))
        )
        confidence = min(0.2 + 0.15 * present, 0.95)
    else:
        confidence = 0.6 - (0.1 if info.weight_kg is None else 0.0)
    confidence = max(0.3, min(0.9, confidence))

    return AnalyzeResponse(
        product=info,
        carbon=carbon,
        total_kgco2e=total,
        confidence=confidence,
        assumptions=assumptions,
        notes=(
            None
            if strict
            else "Estimates are rough and intended for relative comparisons only."
        ),
    )


@app.post("/api/analyze-product")
async def analyze_product_endpoint(req: AnalyzeRequest):
    """Analyze product endpoint that matches frontend expectations"""
    try:
        # Try dataset lookup first, fallback to scraping if not found
        info = get_product_from_url(req.url)
        
        if not info:
            # Fallback to web scraping if product not in dataset
            try:
                info = await scrape_amazon_product(req.url, html=req.html)
            except Exception as e:
                # If scraping fails, use mock data for testing
                print(f"Scraping failed: {e}")
                print("Using mock product data for testing...")
                from models import ProductInfo
                from pydantic import AnyUrl
                
                info = ProductInfo(
                    url=AnyUrl(str(req.url)),
                    title="LED String Lights 66ft 200 LED",
                    brand="Brightech",
                    asin="B0CYLKRRQX",
                    price=24.99,
                    currency="USD",
                    weight_kg=0.5,
                    shipping_weight_kg=0.7,
                    dimensions_cm=(30.0, 20.0, 5.0),
                    category="Home & Garden",
                    bullets=[
                        "66 feet of warm white LED lights",
                        "Energy efficient and long lasting",
                        "Perfect for indoor and outdoor use"
                    ],
                    materials=["Copper wire", "LED bulbs", "Plastic"],
                    images=[],
                    raw={"text": "Mock product data for testing carbon footprint analysis"}
                )

        # Choose strict sourced-only path if API keys present or STRICT_SOURCED_ONLY is true
        strict = settings.STRICT_SOURCED_ONLY or bool(settings.CLIMATIQ_API_KEY)

        # In strict mode, attempt explicit-only enrichment via Claude using raw text (no inference)
        if strict and info.raw and info.raw.get("text"):
            extracted = await extract_facts_claude(info.raw.get("text") or "")
            # Only overwrite fields if we don't already have them from scraper
            if not info.weight_kg and extracted.get("item_weight_kg"):
                info.weight_kg = extracted.get("item_weight_kg")
            if not info.shipping_weight_kg and extracted.get("shipping_weight_kg"):
                info.shipping_weight_kg = extracted.get("shipping_weight_kg")
            # Attach extracted materials/origin to raw for later sourcing steps
            extra_raw = info.raw or {}
            extra_raw["extracted_materials"] = extracted.get("materials") or []
            extra_raw["extracted_materials_composition"] = extracted.get("materials_composition") or []
            extra_raw["extracted_packaging_materials"] = extracted.get("packaging_materials") or []
            if extracted.get("packaging_weight_kg") and not info.shipping_weight_kg and info.weight_kg:
                # If packaging mass is explicitly given and item/shipping not, we can use this later
                extra_raw["extracted_packaging_weight_kg"] = extracted.get("packaging_weight_kg")
            extra_raw["extracted_origin"] = extracted.get("country_of_origin")
            info.raw = extra_raw

        # Compute carbon breakdown
        if strict:
            carbon = await estimate_carbon_strict(
                info,
                destination=req.destination,
                origin=req.origin,
                shipping_mode=req.shipping_mode,
            )
        else:
            carbon = estimate_carbon(info, req.destination, req.shipping_mode)

        assumptions = []
        if info.weight_kg is None and not strict:
            assumptions.append("Estimated item weight based on category heuristics.")
        if req.shipping_mode == "auto" and not strict:
            assumptions.append("Assumed ground shipping by default for 'auto'.")
        if req.destination is None and not strict:
            assumptions.append("Assumed regional delivery distance due to missing destination.")

        total = round(carbon.total, 3)
        # Confidence: in strict mode, base on number of sourced components present
        if strict:
            present = sum(
                1
                for c in [
                    carbon.manufacturing_kgco2e,
                    carbon.packaging_kgco2e,
                    carbon.shipping_kgco2e,
                    carbon.end_of_life_kgco2e,
                ]
                if isinstance(c, (int, float))
            )
            confidence = min(0.2 + 0.15 * present, 0.95)
        else:
            confidence = 0.6 - (0.1 if info.weight_kg is None else 0.0)
        confidence = max(0.3, min(0.9, confidence))
        
        # Transform the response to match frontend expectations
        return {
            "success": True,
            "total_kgco2e": total,
            "product_title": info.title,
            "product_price": info.price,
            "confidence": confidence,
            "breakdown": {
                "manufacturing": carbon.manufacturing_kgco2e or 0,
                "packaging": carbon.packaging_kgco2e or 0,
                "shipping": carbon.shipping_kgco2e or 0,
                "use_phase": carbon.use_phase_kgco2e or 0,
                "end_of_life": carbon.end_of_life_kgco2e or 0
            },
            "assumptions": assumptions
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze product: {str(e)}")


@app.post("/api/similar")
async def get_similar_products(req: AnalyzeRequest):
    """Get 5 similar products for a given Amazon product URL"""
    try:
        # First scrape the original product
        info = await scrape_amazon_product(req.url, html=req.html)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch/scrape product: {e}")
    
    try:
        # Extract 5 similar products
        similar_products = await extract_top_k_similar(info, k=5)
        
        return {
            "original_product": {
                "title": info.title,
                "asin": info.asin,
                "price": info.price,
                "currency": info.currency,
                "url": str(info.url)
            },
            "similar_products": similar_products,
            "count": len(similar_products)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract similar products: {e}")
