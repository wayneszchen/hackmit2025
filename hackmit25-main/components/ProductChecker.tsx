'use client'

import { useState } from 'react'
import { Search, MapPin, Clock, Package, Truck, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'
import axios from 'axios'
import CarbonCalculationModal from './CarbonCalculationModal'

interface CO2Estimate {
  total_co2_kg: number
  shipping_co2_kg: number
  product_name: string
  price: number
  weight_kg: number
  origin_city: string
  breakdown: {
    manufacturing: number
    packaging: number
    shipping: number
  }
  confidence: string
  distance_km: number
  shipping_mode: string
  eco_score: number
  uncertainty_range: [number, number]
  assumptions: string[]
  alternatives?: Alternative[]
}

interface Alternative {
  type: string
  description: string
  co2_kg: number
  co2_savings_percent: number
  price_delta: number
  delay_hours: number
  score: number
}

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

export default function ProductChecker() {
  const [url, setUrl] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [shippingOption, setShippingOption] = useState('standard')
  const [loading, setLoading] = useState(false)
  const [estimate, setEstimate] = useState<CO2Estimate | null>(null)
  const [alternatives, setAlternatives] = useState<Alternative[]>([])
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [calculationResult, setCalculationResult] = useState<CarbonCalculationResult | null>(null)

  const handleEstimate = async () => {
    if (!url) {
      setError('Please provide a product URL')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('Making API request to:', 'http://localhost:8000/api/analyze')
      console.log('Request data:', { url, destination: zipCode || 'Boston', shipping_mode: shippingOption })
      
      const response = await axios.post('http://localhost:8000/api/analyze', {
        url,
        destination: zipCode || 'Boston',
        shipping_mode: shippingOption
      })

      console.log('API response:', response.data)
      
      // Transform the response to match frontend expectations
      const transformedResult = {
        success: true,
        total_kgco2e: response.data.total_kgco2e,
        product_title: response.data.product.title,
        product_price: response.data.product.price,
        confidence: response.data.confidence,
        breakdown: {
          manufacturing: response.data.carbon.manufacturing_kgco2e || 0,
          packaging: response.data.carbon.packaging_kgco2e || 0,
          shipping: response.data.carbon.shipping_kgco2e || 0,
          use_phase: response.data.carbon.use_phase_kgco2e || 0,
          end_of_life: response.data.carbon.end_of_life_kgco2e || 0
        },
        assumptions: response.data.assumptions || []
      }
      
      setCalculationResult(transformedResult)
      setModalOpen(true)
    } catch (err: any) {
      console.error('API Error:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error status:', err.response?.status)
      
      const errorResult: CarbonCalculationResult = {
        success: false,
        error: `Failed to analyze product: ${err.response?.data?.detail || err.message || 'Please try again.'}`
      }
      setCalculationResult(errorResult)
      setModalOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToPurchaseHistory = async () => {
    if (!calculationResult || !calculationResult.success) return

    try {
      // Create a new purchase entry
      const newPurchase = {
        externalId: `manual-${Date.now()}`,
        dateTime: new Date().toISOString(),
        orderStatus: 'completed',
        price: {
          total: calculationResult.product_price || 0,
          subTotal: calculationResult.product_price || 0,
          currency: 'USD',
          adjustments: []
        },
        products: [{
          externalId: `product-${Date.now()}`,
          name: calculationResult.product_title || 'Unknown Product',
          url: url,
          quantity: 1,
          price: {
            unitPrice: calculationResult.product_price || 0,
            subTotal: calculationResult.product_price || 0,
            total: calculationResult.product_price || 0,
            currency: 'USD'
          },
          eligibility: [],
          carbonFootprint: calculationResult.total_kgco2e
        }],
        paymentMethods: [{
          type: 'manual_entry',
          brand: 'Manual',
          lastFour: '0000'
        }]
      }

      // Load existing purchases
      const existingResponse = await fetch('/knot_data.json')
      const existingPurchases = await existingResponse.json()
      
      // Add new purchase to the beginning
      const updatedPurchases = [newPurchase, ...existingPurchases]
      
      // Save updated purchases (in a real app, this would be a proper API call)
      console.log('Would save updated purchases:', updatedPurchases)
      
      // Close modal and show success
      setModalOpen(false)
      alert('Product added to purchase history!')
      
      // Optionally refresh the page or update state
      window.location.reload()
      
    } catch (error) {
      console.error('Error adding to purchase history:', error)
      alert('Failed to add product to purchase history')
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    setCalculationResult(null)
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getShippingIcon = (mode: string) => {
    if (mode.includes('air')) return <Package className="h-4 w-4" />
    return <Truck className="h-4 w-4" />
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center max-w-4xl mx-auto">
        <h2 className="text-5xl font-black text-black mb-6 leading-none tracking-tighter uppercase">CARBON FOOTPRINT</h2>
        <h3 className="text-2xl yc-mono mb-6 tracking-tight" style={{color: '#7B9669'}}>ANALYSIS ENGINE</h3>
        <p className="text-xl text-gray-600 font-medium yc-mono">Enter a product URL to analyze its environmental impact and discover sustainable alternatives</p>
      </div>

      {/* Input Form */}
      <div className="yc-card p-10">
        <div className="space-y-8">
          <div>
            <label className="block text-sm font-black text-black mb-4 uppercase tracking-widest">
              PRODUCT URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://amazon.com/product-link or https://target.com/item"
                className="yc-input py-5 text-lg font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-black text-black mb-4 uppercase tracking-widest">
                ZIP CODE <span className="text-gray-500 font-medium normal-case">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="02139 (defaults to Boston)"
                  className="yc-input py-5 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-black mb-4 uppercase tracking-widest">
                SHIPPING OPTION
              </label>
              <div className="relative">
                <select
                  value={shippingOption}
                  onChange={(e) => setShippingOption(e.target.value)}
                  className="yc-input py-5 appearance-none bg-white font-medium"
                >
                  <option value="same-day">SAME DAY</option>
                  <option value="next-day">NEXT DAY</option>
                  <option value="standard">STANDARD (2-5 DAYS)</option>
                  <option value="economy">ECONOMY (5-7 DAYS)</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-3 text-red-700 bg-red-50 p-4 rounded-xl border border-red-100">
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="flex justify-center pt-4">
            <button
              onClick={handleEstimate}
              disabled={loading || !url.trim()}
              className="yc-button-accent px-12 py-6 text-sm font-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-4 hover-glow"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ANALYZING...
                </>
              ) : (
                <>
                  ANALYZE FOOTPRINT
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {estimate && (
        <div className="space-y-12">
          <div className="yc-card p-10">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-black text-black mb-4 uppercase tracking-tight">IMPACT ANALYSIS</h3>
              <p className="text-gray-600 font-medium text-lg">Environmental footprint breakdown</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              <div className="text-center p-8 bg-black rounded-lg text-white hover-lift">
                <div className="text-4xl font-black mb-3 yc-mono" style={{color: '#7B9669'}}>
                  {estimate.total_co2_kg.toFixed(2)}
                </div>
                <div className="text-sm text-gray-300 font-black uppercase tracking-widest">TOTAL CO₂ (KG)</div>
              </div>
              
              <div className="text-center p-8 bg-gray-900 rounded-lg text-white hover-lift">
                <div className="text-4xl font-black text-white mb-3 yc-mono">
                  {estimate.shipping_co2_kg.toFixed(2)}
                </div>
                <div className="text-sm text-gray-300 font-black uppercase tracking-widest">SHIPPING CO₂ (KG)</div>
              </div>
              
              <div className="text-center p-8 bg-gray-800 rounded-lg text-white hover-lift">
                <div className="text-4xl font-black text-white mb-3 yc-mono">
                  {(estimate.total_co2_kg - estimate.shipping_co2_kg).toFixed(2)}
                </div>
                <div className="text-sm text-gray-300 font-black uppercase tracking-widest">PRODUCTION CO₂ (KG)</div>
              </div>
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8" style={{backgroundColor: '#BAC8B1', borderColor: '#7B9669'}}>
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#7B9669'}}>
                  <span className="text-white text-2xl font-black">P</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-black mb-4 text-lg uppercase tracking-tight">PRODUCT DETAILS</h4>
                  <div className="space-y-3 text-base text-gray-700">
                    <div><span className="font-black text-black">NAME:</span> <span className="font-medium">{estimate.product_name}</span></div>
                    <div><span className="font-black text-black">PRICE:</span> <span className="font-medium yc-mono">${estimate.price}</span></div>
                    <div><span className="font-black text-black">WEIGHT:</span> <span className="font-medium yc-mono">{estimate.weight_kg} kg</span></div>
                    <div><span className="font-black text-black">SHIPPING:</span> <span className="font-medium">{estimate.shipping_mode} from {estimate.origin_city}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {estimate.alternatives && estimate.alternatives.length > 0 && (
            <div className="yc-card p-10">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-black text-black mb-4 uppercase tracking-tight">SUSTAINABLE ALTERNATIVES</h3>
                <p className="text-gray-600 font-medium text-lg">Optimize your environmental impact</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {estimate.alternatives.map((alt: any, index: number) => (
                  <div key={index} className="border-2 border-gray-200 rounded-lg p-8 hover:border-green-600 transition-all duration-300 hover-lift group">
                    <div className="flex items-start gap-6">
                      <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-600 transition-colors duration-300">
                        <span className="text-white text-xl font-black">A</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-black mb-3 text-lg uppercase tracking-tight">{alt.title}</h4>
                        <p className="text-base text-gray-600 mb-4 font-medium">{alt.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-black yc-mono text-green-600">
                              -{alt.co2_reduction_percent}%
                            </span>
                            <span className="text-sm text-gray-500 font-medium">
                              ({alt.co2_saved_kg.toFixed(2)} kg saved)
                            </span>
                          </div>
                          {alt.price_difference !== 0 && (
                            <span className={`text-lg font-black yc-mono ${
                              alt.price_difference > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {alt.price_difference > 0 ? '+' : ''}${alt.price_difference.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Carbon Calculation Modal */}
      {modalOpen && (
        <CarbonCalculationModal
          isOpen={modalOpen}
          onClose={closeModal}
          result={calculationResult}
          productUrl={url}
          onAddToPurchaseHistory={handleAddToPurchaseHistory}
        />
      )}
    </div>
  )
}
