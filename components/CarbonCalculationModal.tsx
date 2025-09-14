import React from 'react';
import { X, ExternalLink, Plus } from 'lucide-react';

interface CarbonCalculationResult {
  success: boolean;
  total_kgco2e?: number;
  product_title?: string;
  product_price?: number;
  confidence?: number;
  breakdown?: {
    manufacturing: number;
    packaging: number;
    shipping: number;
    use_phase: number;
    end_of_life: number;
  };
  assumptions?: string[];
  error?: string;
}

interface CarbonCalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CarbonCalculationResult | null;
  productUrl: string;
  onAddToPurchaseHistory: () => void;
}

const CarbonCalculationModal: React.FC<CarbonCalculationModalProps> = ({
  isOpen,
  onClose,
  result,
  productUrl,
  onAddToPurchaseHistory
}) => {
  if (!isOpen || !result) return null;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.7) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Carbon Footprint Analysis
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {result.success ? (
            <>
              {/* Product Info */}
              {result.product_title && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Product:</h3>
                  <p className="text-gray-800">{result.product_title}</p>
                  {result.product_price && (
                    <p className="text-sm text-gray-600 mt-1">Price: ${result.product_price}</p>
                  )}
                </div>
              )}

              {/* Carbon Footprint Results */}
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-red-600 mb-2">
                    {result.total_kgco2e?.toFixed(3)} kg CO2e
                  </div>
                  <div className="text-gray-600">Total Carbon Footprint</div>
                </div>

                {/* Breakdown */}
                {result.breakdown && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {result.breakdown.manufacturing.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-600">Manufacturing</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {result.breakdown.packaging.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-600">Packaging</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {result.breakdown.shipping.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-600">Shipping</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {result.breakdown.use_phase.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-600">Use Phase</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {result.breakdown.end_of_life.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-600">End of Life</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Assumptions */}
              {result.assumptions && result.assumptions.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Assumptions:</h3>
                  <ul className="space-y-1">
                    {result.assumptions.map((assumption, index) => (
                      <li key={index} className="text-sm text-blue-800">
                        • {assumption}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => window.open(productUrl, '_blank')}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-2"
                >
                  View Product
                  <ExternalLink className="h-4 w-4" />
                </button>
                <button
                  onClick={onAddToPurchaseHistory}
                  className="px-6 py-2 bg-eco-green text-white rounded-lg hover:bg-eco-green/90 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add to Purchase History
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Error State */}
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Analysis Failed</h3>
                <p className="text-red-800">{result.error || 'Unknown error occurred'}</p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarbonCalculationModal;
