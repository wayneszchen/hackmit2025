#!/usr/bin/env python3
"""
Simple CLI script to analyze Amazon product carbon footprint.
Usage: python analyze_product.py <amazon_url_or_asin_or_product_name>
"""

import sys
import asyncio
import json
import pandas as pd
import re
from backend.carbon import estimate_carbon, estimate_carbon_strict
from backend.llm_extract import extract_facts_claude
from backend.settings import settings
from backend.models import ProductInfo


def load_csv_data():
    """Load the Amazon CSV dataset"""
    try:
        df = pd.read_csv('amazon_com_best_sellers_2025_01_27.csv')
        print(f"Loaded CSV with {len(df)} products")
        return df
    except FileNotFoundError:
        print("ERROR: amazon_com_best_sellers_2025_01_27.csv not found in current directory")
        return None

def find_product_in_csv(df, search_term):
    """Find a product in the CSV by SKU/ASIN first, then URL, then name search"""
    if df is None:
        return None
    
    # Priority 1: Direct SKU/ASIN match (exact match, case insensitive)
    sku_matches = df[df['sku'].str.upper() == search_term.upper()]
    if not sku_matches.empty:
        print(f"   Found by SKU: {search_term}")
        return sku_matches.iloc[0]
    
    # Priority 2: Extract ASIN from URL if it's a URL
    asin_match = re.search(r'/dp/([A-Z0-9]{10})', search_term)
    if asin_match:
        asin = asin_match.group(1)
        product = df[df['sku'].str.upper() == asin.upper()]
        if not product.empty:
            print(f"   Found by URL ASIN: {asin}")
            return product.iloc[0]
    
    # Priority 3: If it looks like an ASIN (10 characters, alphanumeric), try exact match
    if len(search_term) == 10 and search_term.isalnum():
        product = df[df['sku'].str.upper() == search_term.upper()]
        if not product.empty:
            print(f"   Found by ASIN: {search_term}")
            return product.iloc[0]
    
    # Priority 4: Search by product name (case insensitive, partial match) - only as fallback
    name_matches = df[df['name'].str.contains(search_term, case=False, na=False)]
    if not name_matches.empty:
        print(f"   Found by name search: '{search_term}'")
        return name_matches.iloc[0]
    
    return None

def parse_weight_from_additional_properties(additional_props_str):
    """Extract weight from additionalProperties JSON string"""
    if pd.isna(additional_props_str):
        return None
    
    try:
        props = json.loads(additional_props_str)
        for prop in props:
            if prop.get('name', '').lower() in ['item weight', 'product dimensions']:
                value = prop.get('value', '')
                # Look for weight patterns like "2.4 ounces", "1.5 pounds", "500 grams"
                weight_match = re.search(r'(\d+\.?\d*)\s*(ounces?|pounds?|lbs?|grams?|kg)', value.lower())
                if weight_match:
                    weight_val = float(weight_match.group(1))
                    unit = weight_match.group(2)
                    
                    # Convert to kg
                    if unit in ['ounces', 'ounce']:
                        return weight_val * 0.0283495  # ounces to kg
                    elif unit in ['pounds', 'pound', 'lbs', 'lb']:
                        return weight_val * 0.453592  # pounds to kg
                    elif unit in ['grams', 'gram', 'g']:
                        return weight_val / 1000  # grams to kg
                    elif unit in ['kg', 'kilograms', 'kilogram']:
                        return weight_val
        return None
    except (json.JSONDecodeError, KeyError, ValueError):
        return None

def csv_row_to_product_info(row):
    """Convert a CSV row to ProductInfo object"""
    # Extract weight
    weight_kg = None
    if pd.notna(row.get('weight_value')) and pd.notna(row.get('weight_unit')):
        weight_val = row['weight_value']
        weight_unit = row['weight_unit']
        if weight_unit == 'kg':
            weight_kg = weight_val
        elif weight_unit in ['g', 'grams']:
            weight_kg = weight_val / 1000
        elif weight_unit in ['lbs', 'pounds']:
            weight_kg = weight_val * 0.453592
        elif weight_unit in ['oz', 'ounces']:
            weight_kg = weight_val * 0.0283495
    
    # If weight not found in weight columns, try additionalProperties
    if weight_kg is None:
        weight_kg = parse_weight_from_additional_properties(row.get('additionalProperties'))
    
    # Extract price
    price = row.get('salePrice') if pd.notna(row.get('salePrice')) else row.get('listedPrice')
    if pd.isna(price):
        price = 25.0  # Default price
    else:
        price = float(price)  # Ensure it's a Python float, not numpy float64
    
    # Extract category from breadcrumbs
    category = "General"
    if pd.notna(row.get('breadcrumbs')):
        try:
            breadcrumbs = json.loads(row['breadcrumbs'])
            if breadcrumbs and len(breadcrumbs) > 0:
                category = breadcrumbs[0].get('name', 'General')
        except (json.JSONDecodeError, KeyError):
            pass
    
    # Create raw data for LLM processing
    raw_text = ""
    if pd.notna(row.get('description')):
        raw_text += f"Description: {row['description']}\n"
    if pd.notna(row.get('additionalProperties')):
        raw_text += f"Additional Properties: {row['additionalProperties']}\n"
    
    # Ensure URL is valid or use a default
    url = row.get('url', '')
    if not url or pd.isna(url):
        # Create a default Amazon URL using the ASIN
        asin = row.get('sku', 'UNKNOWN')
        url = f"https://www.amazon.com/dp/{asin}"
    
    # Convert all fields to proper Python types to avoid Pydantic validation issues
    title = str(row.get('name', 'Unknown Product')) if pd.notna(row.get('name')) else 'Unknown Product'
    asin = str(row.get('sku', '')) if pd.notna(row.get('sku')) else ''
    currency = str(row.get('currency', 'USD')) if pd.notna(row.get('currency')) else 'USD'
    brand = str(row.get('brandName')) if pd.notna(row.get('brandName')) else None
    
    return ProductInfo(
        url=url,
        title=title,
        asin=asin,
        price=price,
        currency=currency,
        weight_kg=weight_kg,
        category=category,
        brand=brand,
        raw={"text": raw_text} if raw_text else {}
    )

async def analyze_product(search_term: str, destination: str = "Boston", shipping_mode: str = "auto"):
    """Complete pipeline: CSV lookup -> LLM -> carbon calculation"""
    
    print(f"Analyzing product: {search_term}")
    print(f"Destination: {destination}")
    print(f"Shipping mode: {shipping_mode}")
    print("-" * 50)
    
    try:
        # Step 1: Load CSV and find product
        has_climatiq = bool(settings.CLIMATIQ_API_KEY)
        has_anthropic = bool(settings.ANTHROPIC_API_KEY)
        strict_requested = bool(settings.STRICT_SOURCED_ONLY)
        strict = (strict_requested or has_climatiq) and has_climatiq
    
        print("Loading product data from CSV...")
        print(f"   API Keys available - Climatiq: {has_climatiq}, Anthropic: {has_anthropic}")
        print(f"   Strict mode: {strict}")
        
        df = load_csv_data()
        if df is None:
            return None
        
        product_row = find_product_in_csv(df, search_term)
        if product_row is None:
            print(f"   ERROR: Product not found in CSV for search term: {search_term}")
            print("   Try searching by:")
            print("   - Amazon URL (e.g., https://www.amazon.com/dp/B01741GFR4)")
            print("   - ASIN (e.g., B01741GFR4)")
            print("   - Product name (e.g., 'Sonic Hedgehog')")
            return None
        
        # Convert CSV row to ProductInfo
        info = csv_row_to_product_info(product_row)
        
        print(f"   Found: {info.title}")
        print(f"   Price: ${info.price} {info.currency}")
        print(f"   Weight: {info.weight_kg} kg" if info.weight_kg else "   Weight: Not specified")
        print(f"   ASIN: {info.asin}")
        print(f"   Brand: {info.brand}" if info.brand else "   Brand: Not specified")
        
        # Step 2: LLM extraction (if API key available)
        # Use strict mode with real APIs
        strict = settings.STRICT_SOURCED_ONLY or bool(settings.CLIMATIQ_API_KEY)
        if strict and info.raw and info.raw.get("text") and settings.ANTHROPIC_API_KEY:
            print("Extracting facts with Claude LLM...")
            try:
                extracted = await extract_facts_claude(info.raw.get("text") or "")
            except Exception as e:
                print(f"   CLAUDE API ERROR: {e}")
                extracted = {}
            
            # Update info with LLM extracted data
            if not info.weight_kg and extracted.get("item_weight_kg"):
                info.weight_kg = extracted.get("item_weight_kg")
                print(f"   LLM found weight: {info.weight_kg} kg")
            
            if not info.shipping_weight_kg and extracted.get("shipping_weight_kg"):
                info.shipping_weight_kg = extracted.get("shipping_weight_kg")
                print(f"   LLM found shipping weight: {info.shipping_weight_kg} kg")
            
            # Attach extracted data to raw for carbon calculation
            extra_raw = info.raw or {}
            extra_raw["extracted_materials"] = extracted.get("materials") or []
            extra_raw["extracted_materials_composition"] = extracted.get("materials_composition") or []
            extra_raw["extracted_packaging_materials"] = extracted.get("packaging_materials") or []
            extra_raw["extracted_origin"] = extracted.get("country_of_origin")
            info.raw = extra_raw
            
            print(f"   Materials: {extracted.get('materials', [])}")
            print(f"   Origin: {extracted.get('country_of_origin', 'Unknown')}")
        else:
            print("Skipping LLM extraction (no API key or using simple mode)")
        
        # Step 3: Calculate carbon footprint
        print("Calculating carbon footprint...")
        if strict:
            # Use default origin for strict mode shipping calculations
            origin = "China"  # Most Amazon products ship from China/Asia
            carbon = await estimate_carbon_strict(info, destination=destination, origin=origin, shipping_mode=shipping_mode)
            
            # If strict mode returns all zeros, fall back to simple mode
            if carbon.total == 0.0:
                print("   WARNING: Strict mode failed, falling back to simple heuristics...")
                carbon = estimate_carbon(info, destination, shipping_mode)
        else:
            carbon = estimate_carbon(info, destination, shipping_mode)
        
        # Step 4: Display results
        print("\nCARBON FOOTPRINT ANALYSIS")
        print("=" * 50)
        print(f"Manufacturing:  {carbon.manufacturing_kgco2e or 'N/A'} kg CO2e")
        print(f"Packaging:      {carbon.packaging_kgco2e or 'N/A'} kg CO2e")
        print(f"Shipping:       {carbon.shipping_kgco2e or 'N/A'} kg CO2e")
        print(f"End of Life:    {carbon.end_of_life_kgco2e or 'N/A'} kg CO2e")
        print("-" * 50)
        print(f"TOTAL:          {carbon.total:.3f} kg CO2e")
        
        # Calculate confidence and assumptions
        assumptions = []
        if info.weight_kg is None and not strict:
            assumptions.append("Estimated item weight based on category heuristics")
        if shipping_mode == "auto" and not strict:
            assumptions.append("Assumed ground shipping by default for 'auto'")
        if destination is None and not strict:
            assumptions.append("Assumed regional delivery distance due to missing destination")
        
        if strict:
            present = sum(1 for c in [carbon.manufacturing_kgco2e, carbon.packaging_kgco2e, 
                         carbon.shipping_kgco2e, carbon.end_of_life_kgco2e] 
                         if isinstance(c, (int, float)))
            confidence = min(0.2 + 0.15 * present, 0.95)
        else:
            confidence = 0.6 - (0.1 if info.weight_kg is None else 0.0)
        confidence = max(0.3, min(0.9, confidence))
        
        print(f"Confidence:     {confidence:.1%}")
        
        if assumptions:
            print("\nASSUMPTIONS:")
            for assumption in assumptions:
                print(f"   • {assumption}")
        
        if carbon.sources:
            print("\nSOURCES:")
            for category, sources in carbon.sources.items():
                print(f"   {category}: {', '.join(sources)}")
        
        return {
            "product": info,
            "carbon": carbon,
            "total_kgco2e": carbon.total,
            "confidence": confidence,
            "assumptions": assumptions
        }
        
    except Exception as e:
        print(f"ERROR: {e}")
        return None


def main():
    if len(sys.argv) != 2:
        print("Usage: python analyze_product.py <amazon_url_or_asin_or_product_name>")
        print("Examples:")
        print("  python analyze_product.py https://www.amazon.com/dp/B0DTQCFGX3")
        print("  python analyze_product.py B0DTQCFGX3")
        print("  python analyze_product.py 'Sonic Hedgehog'")
        sys.exit(1)
    
    search_term = sys.argv[1]
    
    # Run the analysis with the search term (can be URL, ASIN, or product name)
    result = asyncio.run(analyze_product(search_term))
    
    if result:
        print(f"\nAnalysis complete! Total footprint: {result['total_kgco2e']:.3f} kg CO2e")
    else:
        print("\nAnalysis failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
