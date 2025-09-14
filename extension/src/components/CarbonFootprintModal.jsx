import React, { useState, useEffect } from 'react';

const CarbonFootprintModal = ({ asin, onClose }) => {
  const [productData, setProductData] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCarbonData();
  }, [asin]);

  const loadCarbonData = async () => {
    try {
      // Load carbon footprint cache from extension storage
      const result = await chrome.storage.local.get(['carbonCache']);
      const carbonCache = result.carbonCache || {};
      
      const currentProduct = carbonCache[asin];
      if (!currentProduct) {
        setLoading(false);
        return;
      }

      setProductData(currentProduct);

      // Find better alternatives (lower carbon footprint)
      const betterAlternatives = currentProduct.similar_asins
        .map(similarAsin => carbonCache[similarAsin])
        .filter(product => product && product.carbon_footprint_g < currentProduct.carbon_footprint_g)
        .sort((a, b) => a.carbon_footprint_g - b.carbon_footprint_g)
        .slice(0, 3);

      setAlternatives(betterAlternatives);
      setLoading(false);
    } catch (error) {
      console.error('Error loading carbon data:', error);
      setLoading(false);
    }
  };

  const getCarbonColor = (carbonFootprint) => {
    if (carbonFootprint <= 10) return 'text-eco-green';
    if (carbonFootprint <= 30) return 'text-eco-yellow';
    return 'text-eco-red';
  };

  const getCarbonBadgeColor = (carbonFootprint) => {
    if (carbonFootprint <= 10) return 'bg-eco-green';
    if (carbonFootprint <= 30) return 'bg-eco-yellow';
    return 'bg-eco-red';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999] ecotrack-modal">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eco-green mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Loading carbon footprint data...</p>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999] ecotrack-modal">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">🌱 EcoTrack</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600">Carbon footprint data not available for this product yet.</p>
          <p className="text-sm text-gray-500 mt-2">We're working on expanding our database!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999] ecotrack-modal">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🌱</span>
            <h3 className="text-xl font-semibold text-gray-800">EcoTrack Carbon Impact</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Product */}
        <div className="p-6 border-b bg-gray-50">
          <h4 className="font-medium text-gray-800 mb-2">Current Product</h4>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">{productData.name}</p>
              <p className="text-lg font-semibold">${productData.price}</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${getCarbonBadgeColor(productData.carbon_footprint_g)}`}>
                {productData.carbon_footprint_g}g CO₂
              </div>
            </div>
          </div>
        </div>

        {/* Better Alternatives */}
        {alternatives.length > 0 ? (
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl">🌿</span>
              <h4 className="font-medium text-gray-800">Better Eco-Friendly Alternatives</h4>
            </div>
            <div className="space-y-4">
              {alternatives.map((alternative, index) => {
                const savings = productData.carbon_footprint_g - alternative.carbon_footprint_g;
                const savingsPercent = Math.round((savings / productData.carbon_footprint_g) * 100);
                
                return (
                  <div key={alternative.link} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {index === 0 && <span className="text-sm bg-eco-green text-white px-2 py-1 rounded-full">Best Choice</span>}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getCarbonBadgeColor(alternative.carbon_footprint_g)}`}>
                          {alternative.carbon_footprint_g}g CO₂
                        </span>
                        <span className="text-sm text-eco-green font-medium">
                          -{savingsPercent}% carbon
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-gray-800">${alternative.price}</p>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{alternative.name}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Save {savings}g CO₂ vs current choice
                      </div>
                      <a 
                        href={alternative.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-eco-green text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
                      >
                        View Product
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">🌱</span>
              <h4 className="font-medium text-gray-800 mb-2">Great Choice!</h4>
              <p className="text-gray-600">This product already has one of the lowest carbon footprints in its category.</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>Powered by EcoTrack</p>
            <p>Help reduce your carbon footprint 🌍</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarbonFootprintModal;
