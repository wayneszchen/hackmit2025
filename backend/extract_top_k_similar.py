from __future__ import annotations

import json
import asyncio
from typing import List, Dict, Any, Optional
import aiohttp
from bs4 import BeautifulSoup

from models import ProductInfo
from settings import settings
from scrape import scrape_amazon_product
from llm_extract import extract_facts_claude


def get_exact_product_title(info: ProductInfo) -> str:
    """Get the exact product title from info for searching"""
    return info.title or "Unknown Product"


async def search_amazon_for_title(product_title: str, exclude_asin: str, limit: int = 5) -> List[str]:
    """Search Amazon with exact product title and get top 5 results"""
    
    # Use multiple scraping strategies like in scrape.py
    from scrape import fetch_html
    
    # Clean the title for search
    search_query = product_title.replace(" ", "+").replace(",", "").replace("(", "").replace(")", "")
    search_url = f"https://www.amazon.com/s?k={search_query}&ref=sr_pg_1"
    
    try:
        print(f"Searching Amazon for: {product_title}")
        html = await fetch_html(search_url)
        soup = BeautifulSoup(html, 'html.parser')
        
        product_urls = []
        
        # Look for product containers in search results
        # Amazon uses various selectors for search results
        selectors = [
            '[data-component-type="s-search-result"]',
            '.s-result-item',
            '[data-asin]'
        ]
        
        for selector in selectors:
            items = soup.select(selector)
            for item in items:
                asin = item.get('data-asin')
                if asin and len(asin) == 10 and asin != exclude_asin:
                    product_url = f"https://www.amazon.com/dp/{asin}"
                    if product_url not in product_urls:
                        product_urls.append(product_url)
                        if len(product_urls) >= limit:
                            break
            if len(product_urls) >= limit:
                break
        
        # Fallback: look for any /dp/ links
        if len(product_urls) < limit:
            for link in soup.find_all('a', href=True):
                href = link['href']
                if '/dp/' in href:
                    try:
                        asin = href.split('/dp/')[1].split('/')[0].split('?')[0]
                        if len(asin) == 10 and asin != exclude_asin:
                            product_url = f"https://www.amazon.com/dp/{asin}"
                            if product_url not in product_urls:
                                product_urls.append(product_url)
                                if len(product_urls) >= limit:
                                    break
                    except:
                        continue
        
        print(f"Found {len(product_urls)} similar products from search")
        return product_urls[:limit]
        
    except Exception as e:
        print(f"Amazon search failed: {e}")
        # Fallback to predefined similar products
        return get_fallback_similar_products(product_title, exclude_asin, limit)


def get_fallback_similar_products(product_title: str, exclude_asin: str, limit: int) -> List[str]:
    """Fallback function when Amazon search fails - return some similar products"""
    
    # Common similar products database
    similar_products_db = {
        'led_lights': [
            'B07S3R6MKJ', 'B0CW8XW3HV', 'B08JCBK7PY', 
            'B07QBPX4TZ', 'B08L3QN8K9'
        ],
        'beauty_care': [
            'B01741GFR4', 'B00A2X3BQE', 'B07FMJBQKX', 
            'B01MXGN7M4', 'B07RGBQZPX'
        ],
        'electronics': [
            'B01CU1EC6Y', 'B07QXV6N1B', 'B08LG2B1V7', 
            'B07DFBQZPX', 'B08JCMN4K7'
        ]
    }
    
    # Determine category based on product title
    title_lower = product_title.lower()
    
    if any(keyword in title_lower for keyword in ['led', 'light', 'fairy', 'string', 'bulb']):
        category_asins = similar_products_db['led_lights']
    elif any(keyword in title_lower for keyword in ['shower', 'gel', 'bath', 'soap', 'shampoo']):
        category_asins = similar_products_db['beauty_care']
    elif any(keyword in title_lower for keyword in ['charger', 'power', 'battery', 'cable', 'electronic']):
        category_asins = similar_products_db['electronics']
    else:
        # Default to LED lights for demo
        category_asins = similar_products_db['led_lights']
    
    # Filter out the excluded ASIN and convert to URLs
    filtered_asins = [asin for asin in category_asins if asin != exclude_asin][:limit]
    return [f"https://www.amazon.com/dp/{asin}" for asin in filtered_asins]


async def extract_similar_product_info(url: str) -> Optional[Dict[str, Any]]:
    """Scrape and extract key info from a similar product"""
    try:
        # Scrape the product page
        info = await scrape_amazon_product(url)
        print(f"Scraped info - Title: {info.title}, ASIN: {info.asin}, Price: {info.price}")
        
        # Extract facts using Claude LLM
        extracted_facts = {}
        if info.raw and info.raw.get("text") and settings.ANTHROPIC_API_KEY:
            extracted_facts = await extract_facts_claude(info.raw.get("text") or "")
            print(f"LLM extracted facts: {len(extracted_facts)} fields")
        
        # Combine scraped info with LLM extracted facts
        result = {
            "url": str(info.url),
            "title": info.title,
            "brand": info.brand,
            "asin": info.asin,
            "price": info.price,
            "currency": info.currency,
            "weight_kg": info.weight_kg or extracted_facts.get("item_weight_kg"),
            "shipping_weight_kg": info.shipping_weight_kg or extracted_facts.get("shipping_weight_kg"),
            "dimensions_cm": info.dimensions_cm,
            "materials": info.materials or extracted_facts.get("materials", []),
            "materials_composition": extracted_facts.get("materials_composition", []),
            "packaging_materials": extracted_facts.get("packaging_materials", []),
            "packaging_weight_kg": extracted_facts.get("packaging_weight_kg"),
            "country_of_origin": extracted_facts.get("country_of_origin"),
            "bullets": info.bullets[:3] if info.bullets else [],  # First 3 bullets
            "category": info.category,
        }
        
        # If basic scraping failed, try to use fallback data
        if not result["title"] and not result["asin"]:
            print(f"Basic scraping failed for {url}, trying fallback...")
            # Extract ASIN from URL as fallback
            import re
            asin_match = re.search(r'/dp/([A-Z0-9]{10})', url)
            if asin_match:
                result["asin"] = asin_match.group(1)
                result["url"] = url
                print(f"Extracted ASIN from URL: {result['asin']}")
        
        return result
        
    except Exception as e:
        print(f"Failed to extract info from {url}: {e}")
        return None


async def extract_top_k_similar(info: ProductInfo, k: int = 5) -> List[Dict[str, Any]]:
    """
    Main function: Extract top K similar products with their key information
    
    Args:
        info: ProductInfo object from the original product
        k: Number of similar products to find (default 5)
    
    Returns:
        List of dictionaries containing similar product information
    """
    print(f"Finding {k} similar products...")
    
    # Step 1: Get exact product title from info
    product_title = get_exact_product_title(info)
    print(f"Using exact product title: {product_title}")
    
    # Step 2: Search Amazon for that exact title
    print("Searching Amazon for exact title...")
    similar_urls = await search_amazon_for_title(product_title, info.asin or "", k)
    print(f"Found {len(similar_urls)} similar products")
    
    # Step 3: Extract info from each similar product using llm_extract logic
    print("Extracting information from similar products...")
    similar_products = []
    
    for i, url in enumerate(similar_urls, 1):
        print(f"Processing product {i}/{len(similar_urls)}: {url}")
        product_info = await extract_similar_product_info(url)
        if product_info:
            similar_products.append(product_info)
        
        # Add small delay to avoid overwhelming Amazon
        await asyncio.sleep(1)
    
    print(f"Successfully extracted info from {len(similar_products)} products")
    return similar_products


# Example usage function
async def demo_extract_similar():
    """Demo function to test the similar product extraction"""
    from scrape import scrape_amazon_product
    
    # Test with a sample product
    test_url = "https://www.amazon.com/dp/B0CYLKRRQX"  # LED lights
    print(f"Testing with: {test_url}")
    
    # Get original product info
    print("Scraping original product...")
    original_info = await scrape_amazon_product(test_url)
    print(f"Original product title: {original_info.title}")
    print(f"Original product ASIN: {original_info.asin}")
    
    # Find similar products
    similar_products = await extract_top_k_similar(original_info, k=3)
    
    # Display results
    print("\nSIMILAR PRODUCTS FOUND:")
    print("=" * 50)
    for i, product in enumerate(similar_products, 1):
        print(f"{i}. {product.get('title', 'N/A')}")
        print(f"   Price: ${product.get('price', 'N/A')} {product.get('currency', 'N/A')}")
        print(f"   Weight: {product.get('weight_kg', 'N/A')} kg")
        print(f"   Materials: {product.get('materials', [])}")
        print(f"   ASIN: {product.get('asin', 'N/A')}")
        print()
    
    return similar_products


async def interactive_similar_analyzer():
    """Interactive CLI to find similar products and analyze their carbon footprints"""
    import sys
    
    print("AMAZON PRODUCT SIMILARITY & CARBON ANALYZER")
    print("=" * 50)
    
    # Get input from user or command line
    if len(sys.argv) > 1:
        input_arg = sys.argv[1]
    else:
        input_arg = input("Enter Amazon URL or ASIN: ").strip()
    
    if not input_arg:
        print("No input provided. Exiting.")
        return
    
    # Convert ASIN to URL if needed
    if len(input_arg) == 10 and input_arg.isalnum():
        url = f"https://www.amazon.com/dp/{input_arg}"
        print(f"Converting ASIN {input_arg} to URL: {url}")
    elif "amazon.com" in input_arg or "amazon." in input_arg:
        url = input_arg
    else:
        print("ERROR: Please provide either a valid Amazon URL or ASIN")
        return
    
    try:
        # Step 1: Analyze the original product
        print(f"\n1. ANALYZING ORIGINAL PRODUCT...")
        print("-" * 30)
        original_info = await scrape_amazon_product(url)
        
        if not original_info.title:
            print("Failed to scrape original product. Exiting.")
            return
            
        print(f"Product: {original_info.title}")
        print(f"ASIN: {original_info.asin}")
        
        # Calculate carbon footprint for original
        from carbon import estimate_carbon, estimate_carbon_strict
        from llm_extract import extract_facts_claude
        
        strict = bool(settings.CLIMATIQ_API_KEY)
        if strict and original_info.raw and original_info.raw.get("text") and settings.ANTHROPIC_API_KEY:
            extracted = await extract_facts_claude(original_info.raw.get("text") or "")
            if not original_info.weight_kg and extracted.get("item_weight_kg"):
                original_info.weight_kg = extracted.get("item_weight_kg")
        
        if strict:
            original_carbon = await estimate_carbon_strict(original_info, "Boston", None, "auto")
        else:
            original_carbon = estimate_carbon(original_info, "Boston", "auto")
        
        original_total = original_carbon.total
        print(f"Carbon Footprint: {original_total:.3f} kg CO2e")
        
        # Step 2: Find 5 similar products
        print(f"\n2. FINDING 5 SIMILAR PRODUCTS...")
        print("-" * 30)
        similar_products = await extract_top_k_similar(original_info, k=5)
        
        if not similar_products:
            print("No similar products found.")
            return
        
        print(f"Found {len(similar_products)} similar products")
        
        # Step 3: Analyze each similar product
        print(f"\n3. ANALYZING SIMILAR PRODUCTS...")
        print("-" * 30)
        
        analyzed_products = []
        
        for i, product in enumerate(similar_products, 1):
            product_url = product.get('url')
            if not product_url:
                continue
                
            print(f"\nAnalyzing product {i}/5: {product.get('asin', 'Unknown')}")
            
            try:
                # Scrape the similar product
                similar_info = await scrape_amazon_product(product_url)
                
                if not similar_info.title:
                    print(f"  Failed to scrape product {i}")
                    continue
                
                # LLM extraction if available
                if strict and similar_info.raw and similar_info.raw.get("text") and settings.ANTHROPIC_API_KEY:
                    extracted = await extract_facts_claude(similar_info.raw.get("text") or "")
                    if not similar_info.weight_kg and extracted.get("item_weight_kg"):
                        similar_info.weight_kg = extracted.get("item_weight_kg")
                
                # Calculate carbon footprint
                if strict:
                    similar_carbon = await estimate_carbon_strict(similar_info, "Boston", None, "auto")
                else:
                    similar_carbon = estimate_carbon(similar_info, "Boston", "auto")
                
                analyzed_products.append({
                    'info': similar_info,
                    'carbon': similar_carbon,
                    'total': similar_carbon.total
                })
                
                print(f"  {similar_info.title[:60]}...")
                print(f"  Carbon: {similar_carbon.total:.3f} kg CO2e")
                
            except Exception as e:
                print(f"  Error analyzing product {i}: {e}")
                continue
        
        # Step 4: Find the best alternative
        print(f"\n4. RECOMMENDATION")
        print("=" * 50)
        
        if not analyzed_products:
            print("No similar products could be analyzed.")
            return
        
        # Find the product with lowest carbon footprint
        best_alternative = min(analyzed_products, key=lambda x: x['total'])
        
        print(f"ORIGINAL PRODUCT:")
        print(f"  Title: {original_info.title}")
        print(f"  Carbon: {original_total:.3f} kg CO2e")
        print(f"  ASIN: {original_info.asin}")
        print()
        
        if best_alternative['total'] < original_total:
            savings = original_total - best_alternative['total']
            percent_savings = (savings / original_total) * 100
            
            print(f"✅ BETTER ALTERNATIVE FOUND:")
            print(f"  Title: {best_alternative['info'].title}")
            print(f"  Carbon: {best_alternative['total']:.3f} kg CO2e")
            print(f"  ASIN: {best_alternative['info'].asin}")
            print(f"  URL: {best_alternative['info'].url}")
            print(f"  SAVINGS: {savings:.3f} kg CO2e ({percent_savings:.1f}% reduction)")
        else:
            print(f"✅ CURRENT PRODUCT IS THE BEST CHOICE")
            print(f"Your original product has the lowest carbon footprint among similar options.")
        
        print(f"\nALL ANALYZED PRODUCTS (sorted by carbon footprint):")
        print("-" * 50)
        
        all_products = [{'info': original_info, 'total': original_total, 'is_original': True}] + \
                      [{'info': p['info'], 'total': p['total'], 'is_original': False} for p in analyzed_products]
        
        all_products.sort(key=lambda x: x['total'])
        
        for i, product in enumerate(all_products, 1):
            marker = "🟢 ORIGINAL" if product['is_original'] else f"   #{i}"
            print(f"{marker} {product['info'].title[:50]}...")
            print(f"     Carbon: {product['total']:.3f} kg CO2e | ASIN: {product['info'].asin}")
            print()
        
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    # Run interactive analyzer
    asyncio.run(interactive_similar_analyzer())
