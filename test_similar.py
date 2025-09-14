#!/usr/bin/env python3
"""
Test script for extract_top_k_similar functionality
"""

import asyncio
from backend.models import ProductInfo
from backend.extract_top_k_similar import extract_top_k_similar

async def test_extract_similar():
    # Create a test ProductInfo object with LED lights
    test_info = ProductInfo(
        url="https://www.amazon.com/dp/B0CYLKRRQX",
        title="Minetom Curtain Lights, 300 LED Dimmable Fairy Lights with Remote and Timer, 8 Modes, USB Powered String Lights for Room Wall Party Xmas Indoor Decor, Warm White",
        brand="Minetom",
        asin="B0CYLKRRQX",
        price=7.89,
        currency="USD",
        weight_kg=0.089
    )
    
    print("TESTING EXTRACT_TOP_K_SIMILAR")
    print("=" * 50)
    print(f"Original Product: {test_info.title}")
    print(f"ASIN: {test_info.asin}")
    print(f"Price: ${test_info.price}")
    print()
    
    # Test the function
    similar_products = await extract_top_k_similar(test_info, k=3)
    
    print(f"FOUND {len(similar_products)} SIMILAR PRODUCTS:")
    print("=" * 50)
    
    for i, product in enumerate(similar_products, 1):
        print(f"{i}. Title: {product.get('title', 'N/A')}")
        print(f"   ASIN: {product.get('asin', 'N/A')}")
        print(f"   Price: ${product.get('price', 'N/A')} {product.get('currency', '')}")
        print(f"   Weight: {product.get('weight_kg', 'N/A')} kg")
        print(f"   Materials: {product.get('materials', [])}")
        print(f"   Brand: {product.get('brand', 'N/A')}")
        print()
    
    return similar_products

if __name__ == "__main__":
    asyncio.run(test_extract_similar())
