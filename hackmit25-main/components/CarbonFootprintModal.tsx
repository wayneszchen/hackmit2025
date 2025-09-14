import React from 'react';
import { X, ExternalLink } from 'lucide-react';

interface ProductRecommendation {
  currentProduct: {
    name: string;
    carbonFootprint: number;
  };
  recommendedProduct: {
    name: string;
    carbonFootprint: number;
    amazonUrl: string;
    image: string;
  };
}

interface CarbonFootprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: ProductRecommendation | null;
}

const CarbonFootprintModal: React.FC<CarbonFootprintModalProps> = ({
  isOpen,
  onClose,
  recommendation
}) => {
  if (!isOpen || !recommendation) return null;

  const handleRecommendedProductClick = () => {
    window.open(recommendation.recommendedProduct.amazonUrl, '_blank');
  };

  const carbonSavings = recommendation.currentProduct.carbonFootprint - recommendation.recommendedProduct.carbonFootprint;
  const percentSavings = ((carbonSavings / recommendation.currentProduct.carbonFootprint) * 100).toFixed(1);

  return (
    <div className="fixed inset-0 bg-gray-50 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Better Carbon Footprint Alternative
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Current Product */}
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Product:</h3>
            <p className="text-gray-800 mb-2">{recommendation.currentProduct.name}</p>
            <p className="text-lg">
              Carbon Footprint: <span className="text-gray-900 font-bold">
                {recommendation.currentProduct.carbonFootprint} kg CO2e
              </span>
            </p>
          </div>

          {/* Recommended Product */}
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Alternative:</h3>
            <div className="flex gap-4 items-start">
              {/* Product Image */}
              <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img 
                  src={recommendation.recommendedProduct.image} 
                  alt={recommendation.recommendedProduct.name}
                  className="w-full h-full object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleRecommendedProductClick}
                />
              </div>
              
              {/* Product Details */}
              <div className="flex-1">
                <button
                  onClick={handleRecommendedProductClick}
                  className="text-left w-full group hover:bg-gray-100 p-2 rounded transition-colors"
                >
                  <p className="text-gray-800 mb-2 group-hover:text-gray-900 font-medium">
                    {recommendation.recommendedProduct.name}
                    <ExternalLink className="inline h-4 w-4 ml-1" />
                  </p>
                </button>
                <p className="text-lg px-2">
                  Carbon Footprint: <span className="text-gray-900 font-bold">
                    {recommendation.recommendedProduct.carbonFootprint} kg CO2e
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Savings Summary */}
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Savings Summary:</h3>
            <div className="space-y-2">
              <p className="text-gray-800">
                <span className="font-bold">Carbon Savings: {carbonSavings.toFixed(3)} kg CO2e</span>
              </p>
              <p className="text-gray-800">
                <span className="font-bold">{percentSavings}% reduction</span> in carbon footprint
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleRecommendedProductClick}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              View on Amazon
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarbonFootprintModal;
