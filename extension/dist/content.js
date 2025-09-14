// EcoTrack Chrome Extension - Content Script
// Vanilla JavaScript version for Amazon carbon footprint tracking

class CarbonFootprintModal {
  constructor(asin, onClose) {
    this.asin = asin;
    this.onClose = onClose;
    this.productData = null;
    this.alternatives = [];
    this.loading = true;
    this.init();
  }

  async init() {
    await this.loadCarbonData();
    this.render();
  }

  async loadCarbonData() {
    try {
      const result = await chrome.storage.local.get(['carbonCache']);
      const carbonCache = result.carbonCache || {};
      
      const currentProduct = carbonCache[this.asin];
      if (!currentProduct) {
        this.loading = false;
        return;
      }

      this.productData = currentProduct;

      // Find better alternatives (lower carbon footprint)
      this.alternatives = currentProduct.similar_asins
        .map(similarAsin => carbonCache[similarAsin])
        .filter(product => product && product.carbon_footprint_g < currentProduct.carbon_footprint_g)
        .sort((a, b) => a.carbon_footprint_g - b.carbon_footprint_g)
        .slice(0, 3);

      this.loading = false;
    } catch (error) {
      console.error('Error loading carbon data:', error);
      this.loading = false;
    }
  }

  getCarbonColor(carbonFootprint) {
    if (carbonFootprint <= 10) return 'text-eco-green';
    if (carbonFootprint <= 30) return 'text-eco-yellow';
    return 'text-eco-red';
  }

  getCarbonBadgeColor(carbonFootprint) {
    if (carbonFootprint <= 10) return 'bg-eco-green';
    if (carbonFootprint <= 30) return 'bg-eco-yellow';
    return 'bg-eco-red';
  }

  render() {
    const modalHtml = this.loading ? this.renderLoading() : 
                     !this.productData ? this.renderNoData() : 
                     this.renderModal();

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    modalContainer.className = 'ecotrack-modal';
    
    // Add event listeners
    this.addEventListeners(modalContainer);
    
    return modalContainer;
  }

  renderLoading() {
    return `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-eco-green mx-auto"></div>
          <p class="text-center mt-4 text-gray-600">Loading carbon footprint data...</p>
        </div>
      </div>
    `;
  }

  renderNoData() {
    return `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-800">🌱 EcoTrack</h3>
            <button class="close-btn text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p class="text-gray-600">Carbon footprint data not available for this product yet.</p>
          <p class="text-sm text-gray-500 mt-2">We're working on expanding our database!</p>
        </div>
      </div>
    `;
  }

  renderModal() {
    const alternativesHtml = this.alternatives.length > 0 ? this.renderAlternatives() : this.renderGreatChoice();
    
    return `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-90vh overflow-y-auto">
          <!-- Header -->
          <div class="flex justify-between items-center p-6 border-b">
            <div class="flex items-center space-x-2">
              <span class="text-2xl">🌱</span>
              <h3 class="text-xl font-semibold text-gray-800">EcoTrack Carbon Impact</h3>
            </div>
            <button class="close-btn text-gray-500 hover:text-gray-700 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Current Product -->
          <div class="p-6 border-b bg-gray-50">
            <h4 class="font-medium text-gray-800 mb-2">Current Product</h4>
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-sm text-gray-600 mb-1">${this.productData.name}</p>
                <p class="text-lg font-semibold">$${this.productData.price}</p>
              </div>
              <div class="text-right">
                <div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${this.getCarbonBadgeColor(this.productData.carbon_footprint_g)}">
                  ${this.productData.carbon_footprint_g}g CO₂
                </div>
              </div>
            </div>
          </div>

          ${alternativesHtml}

          <!-- Footer -->
          <div class="p-6 border-t bg-gray-50">
            <div class="flex items-center justify-between text-sm text-gray-500">
              <p>Powered by EcoTrack</p>
              <p>Help reduce your carbon footprint 🌍</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderAlternatives() {
    const alternativesItems = this.alternatives.map((alternative, index) => {
      const savings = this.productData.carbon_footprint_g - alternative.carbon_footprint_g;
      const savingsPercent = Math.round((savings / this.productData.carbon_footprint_g) * 100);
      
      return `
        <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-2">
              ${index === 0 ? '<span class="text-sm bg-eco-green text-white px-2 py-1 rounded-full">Best Choice</span>' : ''}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${this.getCarbonBadgeColor(alternative.carbon_footprint_g)}">
                ${alternative.carbon_footprint_g}g CO₂
              </span>
              <span class="text-sm text-eco-green font-medium">
                -${savingsPercent}% carbon
              </span>
            </div>
            <p class="text-lg font-semibold text-gray-800">$${alternative.price}</p>
          </div>
          <p class="text-sm text-gray-600 mb-3">${alternative.name}</p>
          <div class="flex items-center justify-between">
            <div class="text-xs text-gray-500">
              Save ${savings}g CO₂ vs current choice
            </div>
            <a href="${alternative.link}" target="_blank" rel="noopener noreferrer"
               class="bg-eco-green text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-600 transition-colors">
              View Product
            </a>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="p-6">
        <div class="flex items-center space-x-2 mb-4">
          <span class="text-xl">🌿</span>
          <h4 class="font-medium text-gray-800">Better Eco-Friendly Alternatives</h4>
        </div>
        <div class="space-y-4">
          ${alternativesItems}
        </div>
      </div>
    `;
  }

  renderGreatChoice() {
    return `
      <div class="p-6">
        <div class="text-center py-8">
          <span class="text-4xl mb-4 block">🌱</span>
          <h4 class="font-medium text-gray-800 mb-2">Great Choice!</h4>
          <p class="text-gray-600">This product already has one of the lowest carbon footprints in its category.</p>
        </div>
      </div>
    `;
  }

  addEventListeners(container) {
    const closeBtn = container.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', this.onClose);
    }

    // Close on backdrop click
    const backdrop = container.querySelector('.fixed');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.onClose();
        }
      });
    }
  }
}

class AmazonCartTracker {
  constructor() {
    this.modalRoot = null;
    this.modal = null;
    this.init();
  }

  init() {
    this.loadCarbonCache();
    this.setupCartButtonListeners();
    this.observePageChanges();
  }

  async loadCarbonCache() {
    try {
      const response = await fetch(chrome.runtime.getURL('dist/carbon_footprint_cache.json'));
      const carbonCache = await response.json();
      
      // Initialize cart tracking if not exists
      const result = await chrome.storage.local.get(['cartItems']);
      if (!result.cartItems) {
        await chrome.storage.local.set({ cartItems: [] });
      }
      
      await chrome.storage.local.set({ carbonCache });
      console.log('EcoTrack: Carbon cache loaded,', Object.keys(carbonCache).length, 'products');
    } catch (error) {
      console.error('EcoTrack: Failed to load carbon cache:', error);
    }
  }

  extractASINFromURL() {
    const url = window.location.href;
    const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
    return asinMatch ? asinMatch[1] : null;
  }

  extractASINFromElement(element) {
    const possibleSelectors = [
      '[data-asin]',
      '[data-parent-asin]',
      '[data-csa-c-asin]'
    ];

    for (const selector of possibleSelectors) {
      const asinElement = element.closest(selector) || element.querySelector(selector);
      if (asinElement) {
        const asin = asinElement.getAttribute(selector.slice(1, -1));
        if (asin && asin.length === 10) {
          return asin;
        }
      }
    }

    return this.extractASINFromURL();
  }

  setupCartButtonListeners() {
    const cartButtonSelectors = [
      '#add-to-cart-button',
      '[name="submit.add-to-cart"]',
      '[data-action="add-to-cart"]',
      '.a-button-primary[name="submit.add-to-cart"]',
      '#buy-now-button',
      'input[name="submit.add-to-cart"]',
      'button[name="submit.add-to-cart"]',
      '.a-button-input[name="submit.add-to-cart"]',
      '#attach-sidesheet-checkout-button',
      '#sw-atc-details-single-container button'
    ];

    const addListeners = () => {
      console.log('EcoTrack: Setting up cart button listeners...');
      let buttonsFound = 0;
      
      cartButtonSelectors.forEach(selector => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach(button => {
          if (!button.hasAttribute('data-ecotrack-listener')) {
            button.setAttribute('data-ecotrack-listener', 'true');
            button.addEventListener('click', (e) => this.handleAddToCart(e), true);
            buttonsFound++;
            console.log('EcoTrack: Added listener to button:', selector, button);
          }
        });
      });
      
      console.log('EcoTrack: Found', buttonsFound, 'cart buttons');
      
      // Also add a general click listener for any button that might be an add-to-cart
      document.addEventListener('click', (e) => {
        const target = e.target;
        const buttonText = target.textContent?.toLowerCase() || '';
        const buttonId = target.id?.toLowerCase() || '';
        const buttonName = target.name?.toLowerCase() || '';
        
        if (buttonText.includes('add to cart') || 
            buttonText.includes('add to basket') ||
            buttonId.includes('add-to-cart') ||
            buttonName.includes('add-to-cart')) {
          console.log('EcoTrack: Detected potential cart button click:', target);
          this.handleAddToCart(e);
        }
      }, true);
    };

    addListeners();
    this.addListenersInterval = setInterval(addListeners, 3000);
  }

  async handleAddToCart(event) {
    console.log('EcoTrack: Add to cart clicked!', event.target);
    
    const asin = this.extractASINFromElement(event.target);
    
    if (asin) {
      console.log('EcoTrack: Detected ASIN:', asin);
      
      // Add to cart tracking
      try {
        const result = await chrome.storage.local.get(['cartItems']);
        const cartItems = result.cartItems || [];
        
        // Add item if not already in cart
        if (!cartItems.includes(asin)) {
          cartItems.push(asin);
          await chrome.storage.local.set({ cartItems });
          console.log('EcoTrack: Added to cart tracking:', asin);
        }
      } catch (error) {
        console.error('EcoTrack: Error tracking cart item:', error);
      }
      
      setTimeout(() => {
        this.showCarbonModal(asin);
      }, 1000);
    } else {
      console.log('EcoTrack: Could not extract ASIN from page');
    }
  }

  showCarbonModal(asin) {
    this.hideCarbonModal();

    this.modalRoot = document.createElement('div');
    this.modalRoot.id = 'ecotrack-modal-root';
    document.body.appendChild(this.modalRoot);

    this.modal = new CarbonFootprintModal(asin, () => this.hideCarbonModal());
    const modalElement = this.modal.render();
    this.modalRoot.appendChild(modalElement);
  }

  hideCarbonModal() {
    if (this.modalRoot) {
      this.modalRoot.remove();
      this.modalRoot = null;
    }
    this.modal = null;
  }

  observePageChanges() {
    const observer = new MutationObserver((mutations) => {
      let shouldResetListeners = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const hasCartButton = node.querySelector && (
                node.querySelector('#add-to-cart-button') ||
                node.querySelector('[name="submit.add-to-cart"]') ||
                node.matches('#add-to-cart-button') ||
                node.matches('[name="submit.add-to-cart"]')
              );
              
              if (hasCartButton) {
                shouldResetListeners = true;
              }
            }
          });
        }
      });

      if (shouldResetListeners) {
        setTimeout(() => this.setupCartButtonListeners(), 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize the tracker when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AmazonCartTracker();
  });
} else {
  new AmazonCartTracker();
}
