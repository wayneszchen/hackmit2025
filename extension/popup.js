// Offset Extension Popup Script
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved data
  await loadUserData();
  await checkCurrentPage();
  
  // Set up event listeners
  document.getElementById('check-product').addEventListener('click', checkCurrentProduct);
});

async function loadUserData() {
  try {
    const data = await chrome.storage.local.get(['totalSavings', 'alternativesFound']);
    
    document.getElementById('total-savings').textContent = data.totalSavings?.toFixed(1) || '0.0';
    document.getElementById('alternatives-count').textContent = data.alternativesFound?.toLocaleString() || '0';
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

async function checkCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (isProductPage(tab.url)) {
      const asin = extractASIN(tab.url);
      const carbonData = getCarbonData();
      
      if (asin && carbonData[asin]) {
        const product = carbonData[asin];
        const alternatives = getEcoAlternatives(product, carbonData);
        
        document.getElementById('current-page').style.display = 'block';
        document.getElementById('no-product').style.display = 'none';
        document.getElementById('page-title').textContent = product.name;
        
        // Show carbon info
        const carbonInfo = document.getElementById('carbon-info');
        carbonInfo.innerHTML = `
          <span>Carbon Footprint:</span>
          <span class="carbon-footprint">${(product.carbon_footprint_kg * 1000).toFixed(0)}g CO₂</span>
        `;
        
        // Update alternatives count
        document.getElementById('alternatives-count').textContent = alternatives.length;
        
        document.getElementById('check-product').textContent = alternatives.length > 0 ? 
          `View ${alternatives.length} Eco Alternatives` : 'No Alternatives Available';
      } else {
        document.getElementById('current-page').style.display = 'none';
        document.getElementById('no-product').style.display = 'block';
        document.getElementById('check-product').textContent = 'Product Not in Database';
      }
    } else {
      document.getElementById('current-page').style.display = 'none';
      document.getElementById('no-product').style.display = 'block';
      document.getElementById('check-product').textContent = 'Open Offset';
    }
  } catch (error) {
    console.error('Error checking current page:', error);
  }
}

function isProductPage(url) {
  return url.includes('amazon.com/dp/') || 
         url.includes('amazon.com/gp/product/') ||
         url.includes('target.com/p/') ||
         url.includes('walmart.com/ip/');
}

function extractASIN(url) {
  const match = url.match(/\/dp\/([A-Z0-9]{10})/);
  return match ? match[1] : null;
}

function getCarbonData() {
  // Same hardcoded data as in content script
  return {
    "B09JVCL7JR": {
      "name": "Wireless Bluetooth Earbuds Multipoint Charging Resistant",
      "price": 24.99,
      "carbon_footprint_kg": 0.006,
      "similar_asins": ["B0BNXGDY9Y", "B0F2FFKM2L", "B0D1XD1ZV3"]
    },
    "B0D1XD1ZV3": {
      "name": "Apple AirPods Pro 2 Wireless Earbuds",
      "price": 199.0,
      "carbon_footprint_kg": 0.048,
      "similar_asins": ["B09JVCL7JR", "B0BNXGDY9Y", "B0F2FFKM2L"]
    },
    "B0BNXGDY9Y": {
      "name": "Wireless Bluetooth Earbuds Waterproof",
      "price": 24.68,
      "carbon_footprint_kg": 0.006,
      "similar_asins": ["B09JVCL7JR", "B0D1XD1ZV3", "B0F2FFKM2L"]
    },
    "B0F2FFKM2L": {
      "name": "Szwdo Bluetooth Multifunctional Cancelling Headphones",
      "price": 23.99,
      "carbon_footprint_kg": 0.006,
      "similar_asins": ["B09JVCL7JR", "B0D1XD1ZV3", "B0BNXGDY9Y"]
    },
    "B07ZD56WL3": {
      "name": "Lay's Classic Potato Chips Party Size",
      "price": 4.99,
      "carbon_footprint_kg": 0.003,
      "similar_asins": ["B0BZTFW2SZ", "B07X1KPLNB", "B074H5ZHFQ", "B01DIZT0KO"]
    },
    "B0BZTFW2SZ": {
      "name": "Humble Potato Chips Co. Original",
      "price": 16.99,
      "carbon_footprint_kg": 0.011,
      "similar_asins": ["B07ZD56WL3", "B07X1KPLNB", "B074H5ZHFQ", "B01DIZT0KO"]
    },
    "B07X1KPLNB": {
      "name": "Amazon Brand - Classic Salted Potato Chips",
      "price": 2.29,
      "carbon_footprint_kg": 0.001,
      "similar_asins": ["B07ZD56WL3", "B0BZTFW2SZ", "B074H5ZHFQ", "B01DIZT0KO"]
    },
    "B074H5ZHFQ": {
      "name": "365 Everyday Value Organic Potato Chips",
      "price": 3.49,
      "carbon_footprint_kg": 0.002,
      "similar_asins": ["B07ZD56WL3", "B0BZTFW2SZ", "B07X1KPLNB", "B01DIZT0KO"]
    },
    "B01DIZT0KO": {
      "name": "Boulder Canyon Potato Chips Avocado Oil",
      "price": 3.99,
      "carbon_footprint_kg": 0.003,
      "similar_asins": ["B07ZD56WL3", "B0BZTFW2SZ", "B07X1KPLNB", "B074H5ZHFQ"]
    },
    "B008OL3UYK": {
      "name": "Avalon Organics B Complex Thickening Shampoo",
      "price": 13.69,
      "carbon_footprint_kg": 0.008,
      "similar_asins": ["B0849L3675", "B0BCR23QDG", "B0CGRZFCGP"]
    },
    "B0849L3675": {
      "name": "Botanic Hearth Tea Tree Shampoo",
      "price": 9.99,
      "carbon_footprint_kg": 0.006,
      "similar_asins": ["B008OL3UYK", "B0BCR23QDG", "B0CGRZFCGP"]
    },
    "B0BCR23QDG": {
      "name": "Paris Hydrating Dehydrated Hyaluronic Paraben-Free Shampoo",
      "price": 5.57,
      "carbon_footprint_kg": 0.003,
      "similar_asins": ["B008OL3UYK", "B0849L3675", "B0CGRZFCGP"]
    },
    "B0CGRZFCGP": {
      "name": "Moisture Strengthen Restorative HydroPlex Infusion Shampoo",
      "price": 12.37,
      "carbon_footprint_kg": 0.007,
      "similar_asins": ["B008OL3UYK", "B0849L3675", "B0BCR23QDG"]
    },
    "B0D2G6GNCP": {
      "name": "BlueAnt Soundblade Soundbar Bluetooth Streaming Speaker",
      "price": 129.99,
      "carbon_footprint_kg": 0.083,
      "similar_asins": ["B0DV5H3S16", "B07N1C2556", "B08BCHKY52"]
    },
    "B0DV5H3S16": {
      "name": "Bose SoundLink Bluetooth Waterproof Dustproof Speaker",
      "price": 149.0,
      "carbon_footprint_kg": 0.095,
      "similar_asins": ["B0D2G6GNCP", "B07N1C2556", "B08BCHKY52"]
    },
    "B07N1C2556": {
      "name": "MIATONE Portable Bluetooth Wireless Waterproof Speaker",
      "price": 33.99,
      "carbon_footprint_kg": 0.022,
      "similar_asins": ["B0D2G6GNCP", "B0DV5H3S16", "B08BCHKY52"]
    },
    "B08BCHKY52": {
      "name": "Soundcore Bluetooth Diaphragm Technology Waterproof Speaker",
      "price": 59.99,
      "carbon_footprint_kg": 0.038,
      "similar_asins": ["B0D2G6GNCP", "B0DV5H3S16", "B07N1C2556"]
    }
  };
}

function getEcoAlternatives(currentProduct, carbonData) {
  const alternatives = [];
  const currentFootprint = currentProduct.carbon_footprint_kg;
  
  currentProduct.similar_asins.forEach(asin => {
    const altProduct = carbonData[asin];
    if (altProduct && altProduct.carbon_footprint_kg < currentFootprint) {
      alternatives.push(altProduct);
    }
  });
  
  return alternatives.sort((a, b) => a.carbon_footprint_kg - b.carbon_footprint_kg);
}

async function checkCurrentProduct() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (isProductPage(tab.url)) {
      const asin = extractASIN(tab.url);
      const carbonData = getCarbonData();
      
      if (asin && carbonData[asin]) {
        // Send message to content script to show widget
        chrome.tabs.sendMessage(tab.id, {
          action: 'showEcoWidget',
          asin: asin
        });
      } else {
        // Open EcoTrack with current product
        const params = new URLSearchParams({
          url: tab.url,
          title: tab.title
        });
        
        chrome.tabs.create({
          url: `http://localhost:3000?${params.toString()}`
        });
      }
      
      // Open Offset with current product
      const params = new URLSearchParams({
        url: tab.url,
        title: tab.title,
        zip: zipCode
      });
      
      chrome.tabs.create({
        url: `http://localhost:3000?${params.toString()}`
      });
    } else {
      // Just open Offset dashboard
      chrome.tabs.create({
        url: 'http://localhost:3000'
      });
    }
    
    window.close();
  } catch (error) {
    console.error('Error checking product:', error);
  }
}

