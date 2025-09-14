"""
Dataset loader for ecommerce product data from Octaprice GitHub repository.
Replaces web scraping with structured dataset access.
"""

import pandas as pd
import json
import re
from typing import Optional, List, Dict, Any
from pathlib import Path

import requests
import zipfile
import io

from models import ProductInfo
from utils import parse_price, parse_weight_kg, clean_text


class DatasetLoader:
    """Loads and manages ecommerce product datasets from Octaprice repository."""
    
    def __init__(self, dataset_path: Optional[str] = None):
        self.dataset_path = dataset_path
        self.df = None
        self.metadata = None
        
    def load_local_dataset(self, csv_path: str, metadata_path: Optional[str] = None) -> bool:
        """Load dataset from local CSV file."""
        try:
            self.df = pd.read_csv(csv_path)
            if metadata_path and Path(metadata_path).exists():
                with open(metadata_path, 'r') as f:
                    self.metadata = json.load(f)
            print(f"Loaded dataset with {len(self.df)} products")
            return True
        except Exception as e:
            print(f"Error loading dataset: {e}")
            return False
    
    def download_dataset(self, dataset_url: str) -> bool:
        """Download and load dataset from GitHub repository."""
        try:
            print(f"Downloading dataset from {dataset_url}")
            response = requests.get(dataset_url)
            response.raise_for_status()
            
            # Extract ZIP file
            with zipfile.ZipFile(io.BytesIO(response.content)) as zip_file:
                # Find CSV and JSON files
                csv_files = [f for f in zip_file.namelist() if f.endswith('.csv')]
                json_files = [f for f in zip_file.namelist() if f.endswith('.json')]
                
                if not csv_files:
                    print("No CSV file found in dataset")
                    return False
                
                # Load CSV
                with zip_file.open(csv_files[0]) as csv_file:
                    self.df = pd.read_csv(csv_file)
                
                # Load metadata if available
                if json_files:
                    with zip_file.open(json_files[0]) as json_file:
                        self.metadata = json.load(json_file)
                
            print(f"Downloaded and loaded dataset with {len(self.df)} products")
            return True
        except Exception as e:
            print(f"Error downloading dataset: {e}")
            return False
    
    def get_product_by_sku(self, sku: str) -> Optional[ProductInfo]:
        """Get product information by SKU (ASIN)."""
        if self.df is None:
            return None
        
        # Find product by SKU
        product_row = self.df[self.df['sku'] == sku]
        if product_row.empty:
            return None
        
        return self._row_to_product_info(product_row.iloc[0])
    
    def get_product_by_url(self, url: str) -> Optional[ProductInfo]:
        """Get product information by Amazon URL."""
        if self.df is None:
            return None
        
        # Extract ASIN from URL
        asin_match = re.search(r'/dp/([A-Z0-9]{10})', url)
        if not asin_match:
            return None
        
        asin = asin_match.group(1)
        return self.get_product_by_sku(asin)
    
    def search_products(self, query: str, limit: int = 10) -> List[ProductInfo]:
        """Search products by name or description."""
        if self.df is None:
            return []
        
        # Search in name and description columns
        mask = (
            self.df['name'].str.contains(query, case=False, na=False) |
            self.df['description'].str.contains(query, case=False, na=False)
        )
        
        results = self.df[mask].head(limit)
        return [self._row_to_product_info(row) for _, row in results.iterrows()]
    
    def get_random_products(self, count: int = 10) -> List[ProductInfo]:
        """Get random products from the dataset."""
        if self.df is None:
            return []
        
        sample_df = self.df.sample(n=min(count, len(self.df)))
        return [self._row_to_product_info(row) for _, row in sample_df.iterrows()]
    
    def _row_to_product_info(self, row: pd.Series) -> ProductInfo:
        """Convert a pandas row to ProductInfo object."""
        # Extract weight information
        weight_kg = None
        if pd.notna(row.get('weight_value')) and pd.notna(row.get('weight_unit')):
            weight_value = float(row['weight_value'])
            weight_unit = str(row['weight_unit']).lower()
            
            # Convert to kg
            if weight_unit in ['ounce', 'ounces', 'oz']:
                weight_kg = weight_value * 0.0283495  # ounces to kg
            elif weight_unit in ['pound', 'pounds', 'lb', 'lbs']:
                weight_kg = weight_value * 0.453592  # pounds to kg
            elif weight_unit in ['gram', 'grams', 'g']:
                weight_kg = weight_value / 1000  # grams to kg
            elif weight_unit in ['kilogram', 'kilograms', 'kg']:
                weight_kg = weight_value
        
        # Extract dimensions from size field
        dimensions_cm = None
        if pd.notna(row.get('size')):
            dimensions_cm = parse_dimensions_cm(str(row['size']))
        
        # Extract materials from additionalProperties or material field
        materials = []
        if pd.notna(row.get('material')):
            materials.append(str(row['material']))
        
        # Try to extract additional materials from additionalProperties
        if pd.notna(row.get('additionalProperties')):
            try:
                additional_props = json.loads(str(row['additionalProperties']))
                for prop in additional_props:
                    if isinstance(prop, dict) and prop.get('name', '').lower() in ['material', 'materials']:
                        materials.append(prop.get('value', ''))
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Extract features/bullets
        bullets = []
        if pd.notna(row.get('features')):
            try:
                features = json.loads(str(row['features']))
                if isinstance(features, list):
                    bullets = [str(f) for f in features[:10]]  # Limit to 10 features
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Extract images
        images = []
        if pd.notna(row.get('imageUrls')):
            try:
                image_urls = json.loads(str(row['imageUrls']))
                if isinstance(image_urls, list):
                    images = [str(url) for url in image_urls[:5]]  # Limit to 5 images
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Extract category from breadcrumbs or nodeName
        category = None
        if pd.notna(row.get('breadcrumbs')):
            try:
                breadcrumbs = json.loads(str(row['breadcrumbs']))
                if isinstance(breadcrumbs, list) and breadcrumbs:
                    category = ' > '.join([b.get('name', '') for b in breadcrumbs if isinstance(b, dict)])
            except (json.JSONDecodeError, TypeError):
                pass
        
        if not category and pd.notna(row.get('nodeName')):
            category = str(row['nodeName'])
        
        # Determine price (prefer salePrice over listedPrice)
        price = None
        if pd.notna(row.get('salePrice')):
            price = float(row['salePrice'])
        elif pd.notna(row.get('listedPrice')):
            price = float(row['listedPrice'])
        
        # Build URL if not present
        url = str(row.get('url', ''))
        if not url and pd.notna(row.get('sku')):
            url = f"https://www.amazon.com/dp/{row['sku']}"
        
        return ProductInfo(
            url=url,
            title=clean_text(str(row.get('name', ''))) if pd.notna(row.get('name')) else None,
            brand=clean_text(str(row.get('brandName', ''))) if pd.notna(row.get('brandName')) else None,
            asin=str(row.get('sku', '')) if pd.notna(row.get('sku')) else None,
            price=price,
            currency=str(row.get('currency', 'USD')) if pd.notna(row.get('currency')) else 'USD',
            weight_kg=weight_kg,
            shipping_weight_kg=None,  # Not available in dataset
            dimensions_cm=dimensions_cm,
            category=category,
            materials=materials if materials else [],
            bullets=bullets if bullets else [],
            images=images if images else [],
            raw={
                "dataset_row": row.to_dict(),
                "text": str(row.get('description', '')) + ' ' + str(row.get('features', '')),
                "html": str(row.get('descriptionRaw', ''))
            }
        )
    
    def get_dataset_info(self) -> Dict[str, Any]:
        """Get information about the loaded dataset."""
        if self.df is None:
            return {"loaded": False}
        
        info = {
            "loaded": True,
            "total_products": len(self.df),
            "columns": list(self.df.columns),
            "sample_categories": self.df['nodeName'].value_counts().head(10).to_dict() if 'nodeName' in self.df.columns else {},
        }
        
        if self.metadata:
            info["metadata"] = self.metadata
        
        return info


# Global dataset loader instance
dataset_loader = DatasetLoader()


def load_dataset(csv_path: str, metadata_path: Optional[str] = None) -> bool:
    """Load dataset from local files."""
    return dataset_loader.load_local_dataset(csv_path, metadata_path)


def get_product_from_url(url: str) -> Optional[ProductInfo]:
    """Get product information from Amazon URL using dataset."""
    return dataset_loader.get_product_by_url(url)


def get_product_by_asin(asin: str) -> Optional[ProductInfo]:
    """Get product information by ASIN using dataset."""
    return dataset_loader.get_product_by_sku(asin)


def search_products_by_name(query: str, limit: int = 10) -> List[ProductInfo]:
    """Search products by name in the dataset."""
    return dataset_loader.search_products(query, limit)


def get_random_products_sample(count: int = 10) -> List[ProductInfo]:
    """Get random products from the dataset for testing."""
    return dataset_loader.get_random_products(count)
