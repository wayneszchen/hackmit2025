#!/usr/bin/env python3
import asyncio
import pandas as pd
import sys
sys.path.append('.')
from backend.carbon import estimate_carbon_strict
from backend.models import ProductInfo

async def debug_strict_components():
    # Test with Arduino data
    info = ProductInfo(
        url='https://www.amazon.com/dp/B0C8V88Z9D',
        title='Arduino UNO R4 WiFi',
        asin='B0C8V88Z9D',
        price=27.99,
        currency='USD',
        weight_kg=0.0199863975,
        category='Electronics',
        brand='Arduino',
        raw={'text': 'Arduino electronics board', 'extracted_materials': ['HDPE', 'PET', 'Glass'], 'extracted_origin': 'Italy'}
    )
    
    print('Testing strict mode components:')
    print(f'  Weight: {info.weight_kg} kg')
    print(f'  Materials: {info.raw.get("extracted_materials")}')
    print(f'  Raw data: {bool(info.raw)}')
    
    carbon = await estimate_carbon_strict(info, destination='Boston', origin='Italy', shipping_mode='auto')
    
    print(f'\nStrict mode detailed results:')
    print(f'  Manufacturing: {carbon.manufacturing_kgco2e}')
    print(f'  Packaging: {carbon.packaging_kgco2e}')
    print(f'  Shipping: {carbon.shipping_kgco2e}')
    print(f'  End of Life: {carbon.end_of_life_kgco2e}')
    print(f'  Sources: {carbon.sources}')

if __name__ == "__main__":
    asyncio.run(debug_strict_components())
