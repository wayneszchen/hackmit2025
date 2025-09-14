#!/usr/bin/env python3
"""
API endpoint for product analysis using analyze_product.py
"""

import asyncio
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys
import os

# Add the parent directory to the path so we can import analyze_product
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from analyze_product import analyze_product

router = APIRouter()

class ProductAnalysisRequest(BaseModel):
    url: str
    destination: Optional[str] = "Boston"
    shipping_mode: Optional[str] = "auto"

class ProductAnalysisResponse(BaseModel):
    success: bool
    total_kgco2e: Optional[float] = None
    product_title: Optional[str] = None
    product_price: Optional[float] = None
    confidence: Optional[float] = None
    breakdown: Optional[dict] = None
    assumptions: Optional[list] = None
    error: Optional[str] = None

@router.post("/analyze-product", response_model=ProductAnalysisResponse)
async def analyze_product_endpoint(request: ProductAnalysisRequest):
    """
    Analyze a product's carbon footprint using the analyze_product.py script
    """
    try:
        # Run the analysis
        result = await analyze_product(
            search_term=request.url,
            destination=request.destination,
            shipping_mode=request.shipping_mode
        )
        
        if not result:
            raise HTTPException(status_code=400, detail="Failed to analyze product")
        
        # Extract breakdown from carbon object
        carbon = result.get("carbon")
        breakdown = {}
        if carbon:
            breakdown = {
                "manufacturing": carbon.manufacturing_kgco2e or 0,
                "packaging": carbon.packaging_kgco2e or 0,
                "shipping": carbon.shipping_kgco2e or 0,
                "use_phase": carbon.use_phase_kgco2e or 0,
                "end_of_life": carbon.end_of_life_kgco2e or 0
            }
        
        # Extract product info
        product = result.get("product")
        product_title = product.title if product else None
        product_price = product.price if product else None
        
        return ProductAnalysisResponse(
            success=True,
            total_kgco2e=result.get("total_kgco2e"),
            product_title=product_title,
            product_price=product_price,
            confidence=result.get("confidence"),
            breakdown=breakdown,
            assumptions=result.get("assumptions", [])
        )
        
    except Exception as e:
        return ProductAnalysisResponse(
            success=False,
            error=str(e)
        )
