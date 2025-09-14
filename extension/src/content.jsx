import React from 'react';
import { createRoot } from 'react-dom/client';
import CarbonFootprintModal from './components/CarbonFootprintModal';

class AmazonCartTracker {
  constructor() {
    this.modalRoot = null;
    this.reactRoot = null;
    this.init();
  }

  init() {
    // Load carbon cache into extension storage
    this.loadCarbonCache();
    
    // Set up cart button monitoring
    this.setupCartButtonListeners();
    
    // Monitor for dynamic content changes
    this.observePageChanges();
  }

  async loadCarbonCache() {
    try {
      // Fetch carbon cache from the project file
      const response = await fetch(chrome.runtime.getURL('carbon_footprint_cache.json'));
      const carbonCache = await response.json();
      
      // Store in extension storage
      await chrome.storage.local.set({ carbonCache });
      console.log('Carbon cache loaded:', Object.keys(carbonCache).length, 'products');
    } catch (error) {
      console.error('Failed to load carbon cache:', error);
    }
  }

  extractASINFromURL() {
    // Extract ASIN from current page URL
    const url = window.location.href;
    const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
    return asinMatch ? asinMatch[1] : null;
  }

  extractASINFromElement(element) {
    // Try to extract ASIN from various data attributes
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

    // Fallback to URL extraction
    return this.extractASINFromURL();
  }

  setupCartButtonListeners() {
    // Common selectors for Amazon add to cart buttons
    const cartButtonSelectors = [
      '#add-to-cart-button',
      '[name="submit.add-to-cart"]',
      '[data-action="add-to-cart"]',
      '.a-button-primary[name="submit.add-to-cart"]',
      '#buy-now-button'
    ];

    const addListeners = () => {
      cartButtonSelectors.forEach(selector => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach(button => {
          if (!button.hasAttribute('data-ecotrack-listener')) {
            button.setAttribute('data-ecotrack-listener', 'true');
            button.addEventListener('click', (e) => this.handleAddToCart(e), true);
          }
        });
      });
    };

    // Add listeners immediately
    addListeners();

    // Re-add listeners when page content changes
    this.addListenersInterval = setInterval(addListeners, 2000);
  }

  handleAddToCart(event) {
    console.log('Add to cart clicked!', event.target);
    
    // Extract ASIN from the clicked element or page
    const asin = this.extractASINFromElement(event.target);
    
    if (asin) {
      console.log('Detected ASIN:', asin);
      
      // Small delay to let Amazon process the add to cart
      setTimeout(() => {
        this.showCarbonModal(asin);
      }, 1000);
    } else {
      console.log('Could not extract ASIN from page');
    }
  }

  showCarbonModal(asin) {
    // Remove existing modal if present
    this.hideCarbonModal();

    // Create modal container
    this.modalRoot = document.createElement('div');
    this.modalRoot.id = 'ecotrack-modal-root';
    document.body.appendChild(this.modalRoot);

    // Create React root and render modal
    this.reactRoot = createRoot(this.modalRoot);
    this.reactRoot.render(
      <CarbonFootprintModal 
        asin={asin} 
        onClose={() => this.hideCarbonModal()} 
      />
    );
  }

  hideCarbonModal() {
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
    
    if (this.modalRoot) {
      this.modalRoot.remove();
      this.modalRoot = null;
    }
  }

  observePageChanges() {
    // Observe DOM changes to handle dynamic content
    const observer = new MutationObserver((mutations) => {
      let shouldResetListeners = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any cart buttons were added
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
        // Re-setup listeners for new buttons
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
