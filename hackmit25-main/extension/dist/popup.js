// Popup script for EcoTrack extension
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const result = await chrome.storage.local.get(['carbonCache', 'cartItems']);
    const carbonCache = result.carbonCache || {};
    const cartItems = result.cartItems || [];
    
    // Only show products that are actually in cart
    const cartProducts = cartItems.map(asin => carbonCache[asin]).filter(Boolean);
    const totalProducts = cartProducts.length;
    const averageFootprint = cartProducts.length > 0 
      ? Math.round(cartProducts.reduce((sum, p) => sum + p.carbon_footprint_g, 0) / cartProducts.length)
      : 0;

    // Update the popup content
    const popupContent = `
      <div class="w-80 p-4 bg-white">
        <div class="text-center mb-4">
          <div class="flex items-center justify-center space-x-2 mb-2">
            <span class="text-2xl">🌱</span>
            <h1 class="text-xl font-bold text-gray-800">EcoTrack</h1>
          </div>
          <p class="text-sm text-gray-600">Carbon footprint tracker for your purchases</p>
        </div>

        <div class="space-y-3">
          <div class="bg-eco-green bg-opacity-10 p-3 rounded-lg">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Products Tracked</span>
              <span class="font-semibold text-eco-green">${totalProducts}</span>
            </div>
          </div>

          <div class="bg-blue-50 p-3 rounded-lg">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Avg. Carbon Footprint</span>
              <span class="font-semibold text-blue-600">${averageFootprint}g CO₂</span>
            </div>
          </div>
        </div>

        <div class="mt-4 p-3 bg-gray-50 rounded-lg">
          <p class="text-xs text-gray-600 text-center">
            Add items to cart on Amazon to see eco-friendly alternatives!
          </p>
        </div>
      </div>
    `;

    document.body.innerHTML = popupContent;
  } catch (error) {
    console.error('Error loading popup stats:', error);
    document.body.innerHTML = `
      <div class="w-80 p-4 bg-white">
        <div class="text-center">
          <span class="text-2xl">🌱</span>
          <h1 class="text-xl font-bold text-gray-800">EcoTrack</h1>
          <p class="text-sm text-gray-600 mt-2">Loading...</p>
        </div>
      </div>
    `;
  }
});
