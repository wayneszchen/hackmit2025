'use client';

import React, { useState, useEffect } from 'react';
import CarbonFootprintModal from './CarbonFootprintModal';
import { carbonFootprintRecommendations, ProductRecommendation } from '../data/carbonFootprintData';

interface Product {
  externalId: string;
  name: string;
  url: string;
  quantity: number;
  price: {
    subTotal: number;
    total: number;
    currency: string;
    unitPrice: number;
  };
  eligibility: string[];
}

interface PaymentMethod {
  externalId: string;
  type: string;
  brand?: string;
  lastFour?: string;
  transactionAmount: string | number;
  name?: string;
}

interface PriceAdjustment {
  type: string;
  label: string;
  amount: number;
}

interface Purchase {
  externalId: string;
  dateTime: string;
  url: string;
  orderStatus: string;
  paymentMethods: PaymentMethod[];
  price: {
    subTotal: number;
    adjustments: PriceAdjustment[];
    total: number;
    currency: string;
  };
  products: Product[];
}

interface RecurrenceStats {
  productName: string;
  count: number;
  totalSpent: number;
  lastPurchased: string;
}

export default function PurchaseHistory() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [displayedPurchases, setDisplayedPurchases] = useState<Purchase[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [recurrenceStats, setRecurrenceStats] = useState<RecurrenceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [productImages, setProductImages] = useState<{[key: string]: string}>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<ProductRecommendation | null>(null);

  useEffect(() => {
    loadPurchaseData();
  }, []);

  const loadPurchaseData = async () => {
    try {
      const [purchaseResponse, imageResponse] = await Promise.all([
        fetch('/knot_data.json'),
        fetch('/images/product-mapping.json')
      ]);
      
      const data: Purchase[] = await purchaseResponse.json();
      const imageMapping = await imageResponse.json();
      
      // Sort by date (most recent first)
      const sortedPurchases = data.sort((a, b) => 
        new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
      );
      
      console.log('Image mapping loaded:', imageMapping);
      console.log('First 5 purchases product IDs:', 
        sortedPurchases.slice(0, 5).flatMap(p => p.products.map(prod => prod.externalId))
      );
      
      setPurchases(sortedPurchases);
      setDisplayedPurchases(sortedPurchases.slice(0, 5));
      setProductImages(imageMapping);
      calculateRecurrenceStats(sortedPurchases);
      setLoading(false);
    } catch (error) {
      console.error('Error loading purchase data:', error);
      setLoading(false);
    }
  };

  const calculateRecurrenceStats = (purchases: Purchase[]) => {
    const productMap = new Map<string, {count: number, totalSpent: number, lastPurchased: string}>();
    
    purchases.forEach(purchase => {
      purchase.products.forEach(product => {
        const key = product.name;
        const existing = productMap.get(key);
        
        if (existing) {
          productMap.set(key, {
            count: existing.count + product.quantity,
            totalSpent: existing.totalSpent + product.price.total,
            lastPurchased: purchase.dateTime > existing.lastPurchased ? purchase.dateTime : existing.lastPurchased
          });
        } else {
          productMap.set(key, {
            count: product.quantity,
            totalSpent: product.price.total,
            lastPurchased: purchase.dateTime
          });
        }
      });
    });

    const stats: RecurrenceStats[] = Array.from(productMap.entries())
      .filter(([_, data]) => data.count > 1)
      .map(([productName, data]) => ({
        productName,
        count: data.count,
        totalSpent: data.totalSpent,
        lastPurchased: data.lastPurchased
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setRecurrenceStats(stats);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'shipped': return 'text-blue-600 bg-blue-100';
      case 'picked_up': return 'text-purple-600 bg-purple-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'billed': return 'text-orange-600 bg-orange-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleShowAll = () => {
    setShowAll(!showAll);
    setDisplayedPurchases(showAll ? purchases.slice(0, 5) : purchases);
  };

  const handleProductClick = (productName: string) => {
    // Find a matching recommendation based on product name
    const matchingKey = Object.keys(carbonFootprintRecommendations).find(key => 
      productName.toLowerCase().includes(key.toLowerCase()) || 
      key.toLowerCase().includes(productName.toLowerCase())
    );
    
    if (matchingKey) {
      setSelectedRecommendation(carbonFootprintRecommendations[matchingKey]);
      setModalOpen(true);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedRecommendation(null);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="animate-pulse">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <div className="h-12 bg-gray-200 rounded-xl w-80 mx-auto mb-4"></div>
            <div className="h-6 bg-gray-100 rounded-lg w-96 mx-auto"></div>
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="clover-card p-8">
                <div className="h-6 bg-gray-200 rounded-lg w-64 mb-6"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-100 rounded-lg w-full"></div>
                  <div className="h-4 bg-gray-100 rounded-lg w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded-lg w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">Purchase History</h1>
        <p className="text-lg text-gray-600 yc-mono">Track your shopping patterns and carbon footprint over time</p>
      </div>

      {/* Recurrence Statistics */}
      {recurrenceStats.length > 0 && (
        <div className="clover-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Most Frequently Purchased Items</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recurrenceStats.map((stat, index) => {
              const hasRecommendation = Object.keys(carbonFootprintRecommendations).some(key => 
                stat.productName.toLowerCase().includes(key.toLowerCase()) || 
                key.toLowerCase().includes(stat.productName.toLowerCase())
              );
              
              return (
                <div 
                  key={index} 
                  className={`clover-card p-6 hover-lift ${hasRecommendation ? 'cursor-pointer hover:border-green-200 hover:shadow-lg' : ''}`}
                  onClick={() => hasRecommendation && handleProductClick(stat.productName)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 text-base line-clamp-2 flex-1">{stat.productName}</h3>
                    {hasRecommendation }
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Purchased</span>
                      <span className="font-semibold text-gray-900">{stat.count} times</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total spent</span>
                      <span className="font-semibold text-gray-900">{formatPrice(stat.totalSpent)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Last bought</span>
                      <span className="font-semibold text-gray-900">{new Date(stat.lastPurchased).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {hasRecommendation && (
                    <div className="mt-4 text-xs text-green-600 font-medium bg-green-50 p-2 rounded-lg text-center">
                      Past Eco-Friendly Alternative
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Purchase List */}
      <div className="space-y-6">
        {displayedPurchases.map((purchase, purchaseIndex) => (
          <div key={purchase.externalId} className="clover-card overflow-hidden hover-lift">
              {/* Purchase Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Order #{purchase.externalId}</h3>
                    <p className="text-gray-600">{formatDate(purchase.dateTime)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(purchase.orderStatus)}`}>
                    {purchase.orderStatus.replace('_', ' ')}
                  </span>
                  <div className="text-right">
                    <p className="font-bold text-2xl text-gray-900">{formatPrice(purchase.price.total)}</p>
                    <p className="text-sm text-gray-500">Total</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="p-8">
              <div className="space-y-6">
                {purchase.products.map((product, index) => (
                  <div key={`${product.externalId}-${index}`} className="flex gap-6 p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    {/* Product image - only show for first 5 purchases */}
                    {purchaseIndex < 5 && (
                      <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden relative shadow-sm border border-gray-200">
                          {productImages[product.externalId] ? (
                            <>
                              <img 
                                src={productImages[product.externalId]} 
                                alt={product.name}
                                className="w-full h-full object-cover rounded-xl"
                                onError={(e) => {
                                  // Fallback to package icon if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.parentElement?.querySelector('.fallback-icon');
                                  if (fallback) fallback.classList.remove('hidden');
                                }}
                              />
                              <div className="fallback-icon h-8 w-8 text-gray-400 hidden absolute bg-gray-100 rounded"></div>
                            </>
                          ) : (
                            <div className="h-8 w-8 text-gray-400 bg-gray-100 rounded"></div>
                          )}
                        </div>
                      )}
                    
                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-2 text-lg line-clamp-2">{product.name}</h4>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="text-gray-600">Qty: <span className="font-medium text-gray-900">{product.quantity}</span></span>
                        <span className="text-gray-600">Unit Price: <span className="font-medium text-gray-900">{formatPrice(product.price.unitPrice)}</span></span>
                        {product.eligibility.length > 0 && (
                          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                            {product.eligibility.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Product Price */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-xl text-gray-900">{formatPrice(product.price.total)}</p>
                    </div>
                    </div>
                  ))}
                </div>

              {/* Payment Method */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600 font-medium">Payment:</span>
                  {purchase.paymentMethods.map((method, index) => (
                    <span key={index} className="font-semibold text-gray-900">
                      {method.brand && `${method.brand} `}
                      {method.type}
                      {method.lastFour && ` ****${method.lastFour}`}
                      {method.name && ` (${method.name})`}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              {purchase.price.adjustments.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Subtotal</span>
                      <span className="text-gray-900 font-semibold">{formatPrice(purchase.price.subTotal)}</span>
                    </div>
                    {purchase.price.adjustments.map((adjustment, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">{adjustment.label}</span>
                        <span className={`font-semibold ${adjustment.amount < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          {adjustment.amount < 0 ? '-' : ''}{formatPrice(Math.abs(adjustment.amount))}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center font-bold pt-3 border-t border-gray-200 text-lg">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">{formatPrice(purchase.price.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Show All Button */}
      {purchases.length > 5 && (
        <div className="text-center">
          <button
            onClick={handleShowAll}
            className="clover-button-primary inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold"
          >
            {showAll ? 'Show Less' : `Show All ${purchases.length} Purchases`}
          </button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="clover-card p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Purchase Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900 mb-2">{purchases.length}</p>
            <p className="text-gray-600 font-medium">Total Orders</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900 mb-2">
              {formatPrice(purchases.reduce((sum, p) => sum + p.price.total, 0))}
            </p>
            <p className="text-gray-600 font-medium">Total Spent</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900 mb-2">
              {purchases.reduce((sum, p) => sum + p.products.length, 0)}
            </p>
            <p className="text-gray-600 font-medium">Items Purchased</p>
          </div>
        </div>
      </div>

      {/* Carbon Footprint Modal */}
      <CarbonFootprintModal
        isOpen={modalOpen}
        onClose={closeModal}
        recommendation={selectedRecommendation}
      />
    </div>
  );
}
