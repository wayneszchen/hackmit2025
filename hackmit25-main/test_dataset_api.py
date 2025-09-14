#!/usr/bin/env python3
"""
Test script to verify the dataset-based carbon footprint analysis system.
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent / "backend"))

from backend.dataset_loader import load_dataset, get_product_from_url, get_product_by_asin
from backend.carbon import estimate_carbon


def test_dataset_integration():
    """Test the complete dataset integration."""
    print("Testing Dataset-Based Carbon Footprint Analysis System")
    print("=" * 60)
    
    # Load dataset
    dataset_path = "amazon_com_best_sellers_2025_01_27.csv"
    if not Path(dataset_path).exists():
        print(f"ERROR: Dataset file '{dataset_path}' not found")
        return False
    
    print("Loading dataset...")
    if not load_dataset(dataset_path):
        print("ERROR: Failed to load dataset")
        return False
    
    print(f"✓ Dataset loaded successfully")
    
    # Test different lookup methods
    test_cases = [
        {
            "name": "URL Lookup",
            "method": "url",
            "input": "https://www.amazon.com/dp/B0DTQCFGX3",
            "expected_asin": "B0DTQCFGX3"
        },
        {
            "name": "ASIN Lookup", 
            "method": "asin",
            "input": "B00MW8G62E",
            "expected_asin": "B00MW8G62E"
        }
    ]
    
    results = []
    
    for test_case in test_cases:
        print(f"\n{test_case['name']}:")
        print("-" * 30)
        
        # Get product
        if test_case["method"] == "url":
            product = get_product_from_url(test_case["input"])
        else:
            product = get_product_by_asin(test_case["input"])
        
        if not product:
            print(f"✗ Failed to find product: {test_case['input']}")
            continue
        
        print(f"✓ Found product: {product.title}")
        print(f"  ASIN: {product.asin}")
        print(f"  Price: ${product.price} {product.currency}")
        print(f"  Weight: {product.weight_kg} kg" if product.weight_kg else "  Weight: Not specified")
        
        # Calculate carbon footprint
        carbon = estimate_carbon(product, "Boston", "auto")
        
        if carbon:
            print(f"  Carbon footprint: {carbon.total:.3f} kg CO2e")
            print(f"    Manufacturing: {carbon.manufacturing_kgco2e} kg CO2e")
            print(f"    Packaging: {carbon.packaging_kgco2e} kg CO2e") 
            print(f"    Shipping: {carbon.shipping_kgco2e} kg CO2e")
            print(f"    End of Life: {carbon.end_of_life_kgco2e} kg CO2e")
            
            results.append({
                "product": product.title,
                "asin": product.asin,
                "carbon_total": carbon.total,
                "success": True
            })
            print("✓ Carbon footprint calculated successfully")
        else:
            print("✗ Carbon footprint calculation failed")
            results.append({
                "product": product.title,
                "asin": product.asin,
                "success": False
            })
    
    # Summary
    print(f"\n{'='*60}")
    print("TEST SUMMARY")
    print(f"{'='*60}")
    
    successful_tests = sum(1 for r in results if r["success"])
    total_tests = len(results)
    
    print(f"Tests passed: {successful_tests}/{total_tests}")
    
    if successful_tests == total_tests:
        print("✓ All tests passed! Dataset-based system is working correctly.")
        
        # Show carbon footprint differences
        if len(results) >= 2:
            print(f"\nCarbon footprint comparison:")
            for result in results:
                if result["success"]:
                    print(f"  {result['asin']}: {result['carbon_total']:.3f} kg CO2e")
        
        return True
    else:
        print("✗ Some tests failed. Please check the implementation.")
        return False


if __name__ == "__main__":
    success = test_dataset_integration()
    sys.exit(0 if success else 1)
