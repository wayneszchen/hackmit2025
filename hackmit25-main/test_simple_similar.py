#!/usr/bin/env python3
"""
Simple test to verify extract_top_k_similar core functionality
"""

import asyncio
from backend.models import ProductInfo
from backend.extract_top_k_similar import extract_top_k_similar

async def test_core_functionality():
    # Test with a well-known product
    test_info = ProductInfo(
        url="https://www.amazon.com/dp/B0CYLKRRQX",
        title="LED String Lights",
        brand="TestBrand",
        asin="B0CYLKRRQX",
        price=10.99,
        currency="USD"
    )
    
    print("Testing extract_top_k_similar core functionality...")
    print(f"Input product: {test_info.title} (ASIN: {test_info.asin})")
    
    # Test with k=2 for faster execution
    similar_products = await extract_top_k_similar(test_info, k=2)
    
    print(f"\nResults: Found {len(similar_products)} similar products")
    
    # Check if we got results
    if len(similar_products) > 0:
        print("✓ Function successfully returned similar products")
        
        # Check if at least some data is extracted
        has_data = False
        for i, product in enumerate(similar_products, 1):
            asin = product.get('asin')
            url = product.get('url')
            
            print(f"{i}. ASIN: {asin}")
            print(f"   URL: {url}")
            
            if asin or url:
                has_data = True
        
        if has_data:
            print("✓ At least some product data was extracted")
        else:
            print("⚠ Products found but no data extracted (scraping issues)")
            
    else:
        print("✗ No similar products found")
    
    return len(similar_products) > 0

if __name__ == "__main__":
    success = asyncio.run(test_core_functionality())
    print(f"\nTest result: {'PASSED' if success else 'FAILED'}")
