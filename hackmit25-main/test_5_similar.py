#!/usr/bin/env python3
"""
Test extract_top_k_similar with k=5 to get 5 similar products
"""

import asyncio
from backend.models import ProductInfo
from backend.extract_top_k_similar import extract_top_k_similar

async def test_5_similar_products():
    # Test with LED lights product
    test_info = ProductInfo(
        url="https://www.amazon.com/dp/B0CYLKRRQX",
        title="Minetom Curtain Lights, 300 LED Dimmable Fairy Lights with Remote and Timer",
        brand="Minetom",
        asin="B0CYLKRRQX",
        price=7.89,
        currency="USD"
    )
    
    print("TESTING 5 SIMILAR PRODUCTS EXTRACTION")
    print("=" * 50)
    print(f"Original Product: {test_info.title}")
    print(f"ASIN: {test_info.asin}")
    print(f"Price: ${test_info.price}")
    print()
    
    # Extract 5 similar products
    similar_products = await extract_top_k_similar(test_info, k=5)
    
    print(f"FOUND {len(similar_products)} SIMILAR PRODUCTS:")
    print("=" * 50)
    
    for i, product in enumerate(similar_products, 1):
        print(f"{i}. ASIN: {product.get('asin', 'N/A')}")
        print(f"   Title: {product.get('title', 'N/A')}")
        print(f"   Price: ${product.get('price', 'N/A')} {product.get('currency', '')}")
        print(f"   Brand: {product.get('brand', 'N/A')}")
        print(f"   Weight: {product.get('weight_kg', 'N/A')} kg")
        print(f"   URL: {product.get('url', 'N/A')}")
        print()
    
    # Verify we got 5 products
    success = len(similar_products) == 5
    print(f"SUCCESS: {'✓' if success else '✗'} Got {len(similar_products)}/5 similar products")
    
    return similar_products

if __name__ == "__main__":
    asyncio.run(test_5_similar_products())
