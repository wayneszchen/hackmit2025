from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, AnyUrl, Field


class AnalyzeRequest(BaseModel):
    url: AnyUrl = Field(..., description="Amazon product URL")
    html: Optional[str] = Field(
        None, description="Optional raw HTML of the product page to bypass fetching (useful if Amazon blocks fetch)"
    )
    destination: Optional[str] = Field(
        None, description="Destination city or country for shipping estimate (optional)"
    )
    origin: Optional[str] = Field(
        None, description="Origin city or country for shipping estimate (strict mode requires origin)"
    )
    shipping_mode: Optional[str] = Field(
        "auto", description="one of: auto, ground, air, sea"
    )


class ProductInfo(BaseModel):
    url: AnyUrl
    title: Optional[str] = None
    brand: Optional[str] = None
    asin: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    weight_kg: Optional[float] = None
    shipping_weight_kg: Optional[float] = None
    dimensions_cm: Optional[tuple[float, float, float]] = None
    category: Optional[str] = None
    bullets: list[str] = []
    materials: list[str] = []
    images: list[str] = []
    raw: dict[str, Any] = {}


class CarbonBreakdown(BaseModel):
    manufacturing_kgco2e: Optional[float] = None
    packaging_kgco2e: Optional[float] = None
    shipping_kgco2e: Optional[float] = None
    use_phase_kgco2e: Optional[float] = None
    end_of_life_kgco2e: Optional[float] = None
    sources: dict[str, list[str]] = Field(default_factory=dict, description="Citations or factor IDs per component")

    @property
    def total(self) -> float:
        parts = [
            self.manufacturing_kgco2e,
            self.packaging_kgco2e,
            self.shipping_kgco2e,
            self.use_phase_kgco2e,
            self.end_of_life_kgco2e,
        ]
        return float(sum(p for p in parts if isinstance(p, (int, float))))


class AnalyzeResponse(BaseModel):
    product: ProductInfo
    carbon: CarbonBreakdown
    total_kgco2e: float
    confidence: float = Field(0.6, ge=0.0, le=1.0)
    assumptions: list[str] = []
    notes: Optional[str] = None
