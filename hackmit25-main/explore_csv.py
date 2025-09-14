#!/usr/bin/env python3
"""
Explore the Amazon CSV dataset structure
"""
import pandas as pd
import json

def explore_csv():
    # Read the CSV file
    df = pd.read_csv('amazon_com_best_sellers_2025_01_27.csv', nrows=5)
    
    print("Dataset Shape:", df.shape)
    print("\nColumns:")
    for i, col in enumerate(df.columns, 1):
        print(f"{i:2d}. {col}")
    
    print("\nSample data from first row:")
    important_cols = ['name', 'brandName', 'salePrice', 'listedPrice', 'currency', 
                     'weight_value', 'weight_unit', 'sku', 'description', 'material',
                     'additionalProperties', 'url', 'inStock']
    
    for col in important_cols:
        if col in df.columns:
            value = df[col].iloc[0]
            if pd.isna(value):
                print(f"{col}: None")
            elif isinstance(value, str) and len(value) > 100:
                print(f"{col}: {value[:100]}...")
            else:
                print(f"{col}: {value}")
    
    # Try to parse additionalProperties JSON
    if 'additionalProperties' in df.columns:
        print("\nParsing additionalProperties for first row:")
        try:
            additional = df['additionalProperties'].iloc[0]
            if pd.notna(additional):
                parsed = json.loads(additional)
                for item in parsed[:5]:  # Show first 5 items
                    print(f"  {item['name']}: {item['value']}")
        except Exception as e:
            print(f"  Error parsing: {e}")

if __name__ == "__main__":
    explore_csv()
