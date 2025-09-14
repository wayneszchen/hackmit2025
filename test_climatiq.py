#!/usr/bin/env python3
import asyncio
import aiohttp
import json
from backend.settings import settings

async def test_climatiq_search():
    api_key = settings.CLIMATIQ_API_KEY
    
    async with aiohttp.ClientSession() as session:
        async with session.get(
            'https://api.climatiq.io/data/v1/search',
            headers={'Authorization': f'Bearer {api_key}'},
            params={'query': 'road freight', 'results_per_page': 5, 'data_version': '25.25'}
        ) as r:
            print(f'Search status: {r.status}')
            if r.status == 200:
                js = await r.json()
                results = js.get('results', [])
                print(f'Found {len(results)} results')
                for i, ef in enumerate(results[:3]):
                    print(f'Result {i+1}:')
                    print(f'  ID: {ef.get("id")}')
                    print(f'  Unit: {ef.get("unit")}')
                    print(f'  Name: {ef.get("name", "")}')
                    print()
                    
                    # Test estimate with first suitable factor
                    unit = ef.get('unit', '')
                    if 'km' in unit and ('kg' in unit or 'tonne' in unit):
                        ef_id = ef.get('id')
                        print(f'Testing estimate with factor: {ef_id}')
                        
                        # Convert kg to tonnes if needed
                        weight_val = 0.068
                        weight_unit = 'kg'
                        if 'tonne' in unit:
                            weight_val = 0.068 / 1000  # Convert to tonnes
                            weight_unit = 'tonne'
                        
                        payload = {
                            'emission_factor': {'id': ef_id},
                            'parameters': {
                                'weight': weight_val,
                                'weight_unit': weight_unit,
                                'distance': 5000,
                                'distance_unit': 'km',
                            },
                        }
                        
                        async with session.post(
                            'https://api.climatiq.io/data/v1/estimate',
                            headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
                            data=json.dumps(payload)
                        ) as r2:
                            print(f'Estimate status: {r2.status}')
                            text = await r2.text()
                            print(f'Response: {text[:200]}...')
                        break
            else:
                text = await r.text()
                print(f'Error: {text}')

if __name__ == "__main__":
    asyncio.run(test_climatiq_search())
