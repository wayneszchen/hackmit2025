// Offset Content Script - Detects product pages and shows carbon footprint
class OffsetDetector {
  constructor() {
    this.isProductPage = false;
    this.productData = null;
    this.widget = null;
    this.carbonData = null;
    this.currentASIN = null;
    this.init();
  }

  init() {
    // Load carbon footprint data
    this.loadCarbonData();
    
    // Check if this is a product page
    this.detectProductPage();
    
    if (this.isProductPage) {
      this.extractProductData();
      this.checkForEcoAlternatives();
      this.observePageChanges();
    }
  }

  detectProductPage() {
    const url = window.location.href;
    const hostname = window.location.hostname;

    // Amazon product page detection
    if (hostname.includes('amazon.com')) {
      this.isProductPage = url.includes('/dp/') || url.includes('/gp/product/');
      
      // Extract ASIN from URL
      const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
      if (asinMatch) {
        this.currentASIN = asinMatch[1];
      }
    }
    // Target product page detection
    else if (hostname.includes('target.com')) {
      this.isProductPage = url.includes('/p/') || document.querySelector('[data-test="product-title"]');
    }
    // Walmart product page detection
    else if (hostname.includes('walmart.com')) {
      this.isProductPage = url.includes('/ip/') || document.querySelector('[data-automation-id="product-title"]');
    }
  }

  loadCarbonData() {
    // Hardcoded carbon footprint data from carbon_footprint_cache.json
    this.carbonData = {
      "B09JVCL7JR": {
        "name": "Wireless Bluetooth Earbuds Multipoint Charging Resistant",
        "price": 24.99,
        "link": "https://www.amazon.com/Wireless-Bluetooth-multipoint-charging-resistant/dp/B09JVCL7JR",
        "carbon_footprint_kg": 0.006,
        "similar_asins": ["B0BNXGDY9Y", "B0F2FFKM2L", "B0D1XD1ZV3"]
      },
      "B0D1XD1ZV3": {
        "name": "Apple AirPods Pro 2 Wireless Earbuds",
        "price": 199.0,
        "link": "https://www.amazon.com/Apple-Cancellation-Transparency-Personalized-High-Fidelity/dp/B0D1XD1ZV3",
        "carbon_footprint_kg": 0.048,
        "similar_asins": ["B09JVCL7JR", "B0BNXGDY9Y", "B0F2FFKM2L"]
      },
      "B0BNXGDY9Y": {
        "name": "Wireless Bluetooth Earbuds Waterproof",
        "price": 24.68,
        "link": "https://www.amazon.com/Wireless-Bluetooth-Playtime-Waterproof-Headphones/dp/B0BNXGDY9Y",
        "carbon_footprint_kg": 0.006,
        "similar_asins": ["B09JVCL7JR", "B0D1XD1ZV3", "B0F2FFKM2L"]
      },
      "B0F2FFKM2L": {
        "name": "Szwdo Bluetooth Multifunctional Cancelling Headphones",
        "price": 23.99,
        "link": "https://www.amazon.com/Szwdo-Bluetooth-Multifunctional-Cancelling-Headphones/dp/B0F2FFKM2L",
        "carbon_footprint_kg": 0.006,
        "similar_asins": ["B09JVCL7JR", "B0D1XD1ZV3", "B0BNXGDY9Y"]
      },
      "B07ZD56WL3": {
        "name": "Lay's Classic Potato Chips Party Size",
        "price": 4.99,
        "link": "https://www.amazon.com/Lays-Potato-Chips-Classic-Party/dp/B07ZD56WL3/",
        "carbon_footprint_kg": 0.003,
        "similar_asins": ["B0BZTFW2SZ", "B07X1KPLNB", "B074H5ZHFQ", "B01DIZT0KO"]
      },
      "B0BZTFW2SZ": {
        "name": "Humble Potato Chips Co. Original",
        "price": 16.99,
        "link": "https://www.amazon.com/Humble-Potato-Chips-Co-Original/dp/B0BZTFW2SZ/",
        "carbon_footprint_kg": 0.011,
        "similar_asins": ["B07ZD56WL3", "B07X1KPLNB", "B074H5ZHFQ", "B01DIZT0KO"]
      },
      "B07X1KPLNB": {
        "name": "Amazon Brand - Classic Salted Potato Chips",
        "price": 2.29,
        "link": "https://www.amazon.com/Amazon-Brand-Classic-Salted-Potato/dp/B07X1KPLNB/",
        "carbon_footprint_kg": 0.001,
        "similar_asins": ["B07ZD56WL3", "B0BZTFW2SZ", "B074H5ZHFQ", "B01DIZT0KO"]
      },
      "B074H5ZHFQ": {
        "name": "365 Everyday Value Organic Potato Chips",
        "price": 3.49,
        "link": "https://www.amazon.com/365-Everyday-Value-Organic-Potato/dp/B074H5ZHFQ/",
        "carbon_footprint_kg": 0.002,
        "similar_asins": ["B07ZD56WL3", "B0BZTFW2SZ", "B07X1KPLNB", "B01DIZT0KO"]
      },
      "B01DIZT0KO": {
        "name": "Boulder Canyon Potato Chips Avocado Oil",
        "price": 3.99,
        "link": "https://www.amazon.com/Boulder-Canyon-Chips-Potato-Avocado/dp/B01DIZT0KO/",
        "carbon_footprint_kg": 0.003,
        "similar_asins": ["B07ZD56WL3", "B0BZTFW2SZ", "B07X1KPLNB", "B074H5ZHFQ"]
      },
      "B008OL3UYK": {
        "name": "Avalon Organics B Complex Thickening Shampoo",
        "price": 13.69,
        "link": "https://www.amazon.com/Avalon-Organics-B-Complex-Thickening-Shampoo/dp/B008OL3UYK",
        "carbon_footprint_kg": 0.008,
        "similar_asins": ["B0849L3675", "B0BCR23QDG", "B0CGRZFCGP"]
      },
      "B0849L3675": {
        "name": "Botanic Hearth Tea Tree Shampoo",
        "price": 9.99,
        "link": "https://www.amazon.com/Botanic-Hearth-Tea-Tree-Shampoo/dp/B0849L3675",
        "carbon_footprint_kg": 0.006,
        "similar_asins": ["B008OL3UYK", "B0BCR23QDG", "B0CGRZFCGP"]
      },
      "B0BCR23QDG": {
        "name": "Paris Hydrating Dehydrated Hyaluronic Paraben-Free Shampoo",
        "price": 5.57,
        "link": "https://www.amazon.com/Paris-Hydrating-Dehydrated-Hyaluronic-Paraben-Free/dp/B0BCR23QDG",
        "carbon_footprint_kg": 0.003,
        "similar_asins": ["B008OL3UYK", "B0849L3675", "B0CGRZFCGP"]
      },
      "B0CGRZFCGP": {
        "name": "Moisture Strengthen Restorative HydroPlex Infusion Shampoo",
        "price": 12.37,
        "link": "https://www.amazon.com/Moisture-Strengthen-Restorative-HydroPlex-Infusion/dp/B0CGRZFCGP",
        "carbon_footprint_kg": 0.007,
        "similar_asins": ["B008OL3UYK", "B0849L3675", "B0BCR23QDG"]
      },
      "B0D2G6GNCP": {
        "name": "BlueAnt Soundblade Soundbar Bluetooth Streaming Speaker",
        "price": 129.99,
        "link": "https://www.amazon.com/BlueAnt-Soundblade-Soundbar-Bluetooth-Streaming/dp/B0D2G6GNCP",
        "carbon_footprint_kg": 0.083,
        "similar_asins": ["B0DV5H3S16", "B07N1C2556", "B08BCHKY52"]
      },
      "B0DV5H3S16": {
        "name": "Bose SoundLink Bluetooth Waterproof Dustproof Speaker",
        "price": 149.0,
        "link": "https://www.amazon.com/Bose-SoundLink-Bluetooth-Waterproof-Dustproof/dp/B0DV5H3S16",
        "carbon_footprint_kg": 0.095,
        "similar_asins": ["B0D2G6GNCP", "B07N1C2556", "B08BCHKY52"]
      },
      "B07N1C2556": {
        "name": "MIATONE Portable Bluetooth Wireless Waterproof Speaker",
        "price": 33.99,
        "link": "https://www.amazon.com/MIATONE-Portable-Bluetooth-Wireless-Waterproof/dp/B07N1C2556",
        "carbon_footprint_kg": 0.022,
        "similar_asins": ["B0D2G6GNCP", "B0DV5H3S16", "B08BCHKY52"]
      },
      "B08BCHKY52": {
        "name": "Soundcore Bluetooth Diaphragm Technology Waterproof Speaker",
        "price": 59.99,
        "link": "https://www.amazon.com/Soundcore-Bluetooth-Diaphragm-Technology-Waterproof/dp/B08BCHKY52",
        "carbon_footprint_kg": 0.038,
        "similar_asins": ["B0D2G6GNCP", "B0DV5H3S16", "B07N1C2556"]
      }
    };
  }

  extractProductData() {
    const hostname = window.location.hostname;
    let productTitle = '';
    let price = '';

    try {
      if (hostname.includes('amazon.com')) {
        productTitle = document.querySelector('#productTitle')?.textContent?.trim() || '';
        const priceElement = document.querySelector('.a-price-whole, .a-offscreen, .a-price .a-offscreen');
        price = priceElement?.textContent?.trim() || '';
      }
      else if (hostname.includes('target.com')) {
        productTitle = document.querySelector('[data-test="product-title"]')?.textContent?.trim() || '';
        price = document.querySelector('[data-test="product-price"]')?.textContent?.trim() || '';
      }
      else if (hostname.includes('walmart.com')) {
        productTitle = document.querySelector('[data-automation-id="product-title"]')?.textContent?.trim() || '';
        price = document.querySelector('[data-automation-id="product-price"]')?.textContent?.trim() || '';
      }

      this.productData = {
        title: productTitle,
        price: price,
        url: window.location.href,
        asin: this.currentASIN,
        retailer: hostname.split('.')[hostname.split('.').length - 2]
      };
    } catch (error) {
      console.error('Offset: Error extracting product data:', error);
    }
  }

  checkForEcoAlternatives() {
    if (!this.currentASIN || !this.carbonData[this.currentASIN]) {
      return; // Product not in our database
    }

    const currentProduct = this.carbonData[this.currentASIN];
    const alternatives = this.getEcoFriendlyAlternatives(currentProduct);
    
    if (alternatives.length > 0) {
      this.createEcoWidget(currentProduct, alternatives);
    }
  }

  getEcoFriendlyAlternatives(currentProduct) {
    const alternatives = [];
    const currentFootprint = currentProduct.carbon_footprint_kg;
    
    // Get similar products with lower carbon footprint
    currentProduct.similar_asins.forEach(asin => {
      const altProduct = this.carbonData[asin];
      if (altProduct && altProduct.carbon_footprint_kg < currentFootprint) {
        alternatives.push({
          ...altProduct,
          asin: asin,
          savings: ((currentFootprint - altProduct.carbon_footprint_kg) / currentFootprint * 100).toFixed(1)
        });
      }
    });
    
    // Sort by carbon footprint (lowest first)
    return alternatives.sort((a, b) => a.carbon_footprint_kg - b.carbon_footprint_kg);
  }

  createEcoWidget(currentProduct, alternatives) {
    if (this.widget) return; // Widget already exists

    // Create the Honey-style floating widget
    this.widget = document.createElement('div');
    this.widget.id = 'ecotrack-widget';
    this.widget.innerHTML = `
      <div class="ecotrack-header">
        <span class="ecotrack-title">Offset</span>
        <button class="ecotrack-close">×</button>
      </div>
      <div class="ecotrack-content">
        <div class="ecotrack-current-product">
          <div class="current-product-info">
            <span class="current-footprint">${(currentProduct.carbon_footprint_kg * 1000).toFixed(0)}g CO₂</span>
          </div>
        </div>
        <div class="ecotrack-alternatives">
          ${alternatives.map(alt => `
            <div class="ecotrack-alternative" data-link="${alt.link}">
              <div class="alt-info">
                <div class="alt-name">${alt.name}</div>
                <div class="alt-price">$${alt.price}</div>
              </div>
              <div class="alt-savings">
                <div class="savings-percent">${alt.savings}% less CO₂</div>
                <div class="alt-footprint">${(alt.carbon_footprint_kg * 1000).toFixed(0)}g CO₂</div>
              </div>
              <button class="alt-button">Shop Now</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(this.widget);

    // Add event listeners
    this.widget.querySelector('.ecotrack-close').addEventListener('click', () => {
      this.widget.style.display = 'none';
    });
    
    // Add view details functionality if needed
    // this.widget.querySelector('.ecotrack-view-details')?.addEventListener('click', () => {
    //   this.openOffsetApp();
    // });

    // Add click handlers for alternatives
    this.widget.querySelectorAll('.ecotrack-alternative').forEach(altEl => {
      altEl.addEventListener('click', () => {
        const link = altEl.dataset.link;
        window.open(link, '_blank');
      });
    });

    // Add click handlers for shop now buttons
    this.widget.querySelectorAll('.alt-button').forEach((btn, index) => {
      const altProduct = alternatives[index];
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Shop Now clicked for:', altProduct.name, altProduct.link);
        window.open(altProduct.link, '_blank');
      });
    });
  }

  async calculateCarbonFootprint() {
    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: window.location.href,
          mode: 'simple'
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error('Failed to calculate carbon footprint: ' + text);
      }

      const data = await response.json(); // { product, carbon, total_kgco2e, ... }
      this.displayResults(data);

    } catch (error) {
      console.error('Offset: Error calculating carbon footprint:', error);
      this.showError('Unable to calculate carbon footprint');
    }
  }

  displayResults(data) {
    const loadingEl = this.widget.querySelector('.ecotrack-loading');
    const resultsEl = this.widget.querySelector('.ecotrack-results');
    const co2ValueEl = this.widget.querySelector('.ecotrack-co2-value');
    const alternativesEl = this.widget.querySelector('.ecotrack-alternatives');

    loadingEl.style.display = 'none';
    resultsEl.style.display = 'block';

    // Display CO2 value from new API shape
    const total = (data && typeof data.total_kgco2e === 'number') ? data.total_kgco2e : 0;
    co2ValueEl.textContent = total.toFixed(2);

    // Clear alternatives area (not used with new backend yet)
    alternativesEl.innerHTML = '';

    // Store the data for the detailed view
    this.estimateData = data;
  }

  showError(message) {
    const loadingEl = this.widget.querySelector('.ecotrack-loading');
    loadingEl.innerHTML = `<span class="ecotrack-error">${message}</span>`;
  }

  openOffsetApp() {
    // Open the main Offset app with pre-filled data
    const params = new URLSearchParams({
      url: this.productData.url,
      title: this.productData.title,
      retailer: this.productData.retailer
    });
    
    window.open(`http://localhost:3000?${params.toString()}`, '_blank');
  }

  observePageChanges() {
    // Watch for page changes (for SPAs)
    let currentUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        
        // Remove existing widget
        if (this.widget) {
          this.widget.remove();
          this.widget = null;
        }
        
        // Reset current ASIN
        this.currentASIN = null;
        
        // Re-initialize on new page
        setTimeout(() => this.init(), 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showEcoWidget') {
    // Force show widget for specific ASIN
    const detector = new OffsetDetector();
    detector.currentASIN = request.asin;
    detector.checkForEcoAlternatives();
  }
});

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new OffsetDetector();
  });
} else {
  new OffsetDetector();
}
