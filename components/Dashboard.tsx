'use client'

import { useState, useEffect } from 'react'
// Icons removed
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface DashboardData {
  monthly_co2: Array<{ month: string; co2_kg: number; savings_kg: number }>
  total_orders: number
  total_co2_kg: number
  total_savings_kg: number
  avg_co2_per_order: number
  city_percentile: number
  recent_orders: Array<{
    id: string
    product_name: string
    co2_kg: number
    date: string
    chosen_alternative: boolean
  }>
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('6months')

  useEffect(() => {
    // Mock data for demo - replace with API call
    const mockData: DashboardData = {
      monthly_co2: [
        { month: 'Apr', co2_kg: 15.2, savings_kg: 2.1 },
        { month: 'May', co2_kg: 12.8, savings_kg: 4.3 },
        { month: 'Jun', co2_kg: 18.5, savings_kg: 3.2 },
        { month: 'Jul', co2_kg: 9.1, savings_kg: 6.8 },
        { month: 'Aug', co2_kg: 11.3, savings_kg: 5.5 },
        { month: 'Sep', co2_kg: 7.9, savings_kg: 8.2 },
      ],
      total_orders: 47,
      total_co2_kg: 74.8,
      total_savings_kg: 30.1,
      avg_co2_per_order: 1.59,
      city_percentile: 72,
      recent_orders: [
        { id: '1', product_name: 'Wireless Mouse', co2_kg: 0.9, date: '2025-09-12', chosen_alternative: true },
        { id: '2', product_name: 'Phone Case', co2_kg: 2.1, date: '2025-09-10', chosen_alternative: false },
        { id: '3', product_name: 'USB Cable', co2_kg: 0.6, date: '2025-09-08', chosen_alternative: true },
        { id: '4', product_name: 'Notebook Set', co2_kg: 1.8, date: '2025-09-05', chosen_alternative: true },
      ]
    }
    
    setTimeout(() => {
      setData(mockData)
      setLoading(false)
    }, 1000)
  }, [timeRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eco-green"></div>
      </div>
    )
  }

  if (!data) return null

  const totalImpact = data.total_co2_kg + data.total_savings_kg
  const savingsPercentage = ((data.total_savings_kg / totalImpact) * 100).toFixed(1)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">Your Carbon Impact Dashboard</h2>
        <p className="text-lg text-gray-600 yc-mono">Track your progress towards greener shopping with detailed insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="clover-card p-6 text-center hover-lift">
          <div className="text-3xl font-bold text-gray-900 mb-2">{data.total_orders}</div>
          <div className="text-gray-600 font-medium">Total Orders</div>
        </div>

        <div className="clover-card p-6 text-center hover-lift">
          <div className="text-3xl font-bold text-gray-900 mb-2">{data.total_co2_kg.toFixed(1)} kg</div>
          <div className="text-gray-600 font-medium">CO₂ Emitted</div>
        </div>

        <div className="clover-card p-6 text-center hover-lift">
          <div className="text-3xl font-bold text-green-600 mb-2">{data.total_savings_kg.toFixed(1)} kg</div>
          <div className="text-gray-600 font-medium">CO₂ Saved</div>
        </div>

        <div className="clover-card p-6 text-center hover-lift">
          <div className="text-3xl font-bold text-gray-900 mb-2">{data.city_percentile}%</div>
          <div className="text-gray-600 font-medium">Better than Boston avg</div>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="clover-card p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-gray-900">Your Impact Summary</h3>
          <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">Last 6 months</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Average CO₂ per order</span>
              <span className="font-semibold text-gray-900 text-lg">{data.avg_co2_per_order.toFixed(2)} kg</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Total savings percentage</span>
              <span className="font-semibold text-green-600 text-lg">{savingsPercentage}%</span>
            </div>
          </div>
          
          <div className="p-6 rounded-2xl border border-green-100" style={{backgroundColor: '#BAC8B1'}}>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="font-semibold text-gray-900">Great Progress! </h4>
            </div>
            <p className="text-gray-700 leading-relaxed">
              You've saved <span className="font-semibold">{data.total_savings_kg.toFixed(1)} kg</span> of CO₂ with your purchases (on tree) 
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Trend */}
        <div className="clover-card p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Monthly CO₂</h3>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="clover-input py-2 px-3 text-sm w-auto"
            >
              <option value="3months">3 months</option>
              <option value="6months">6 months</option>
              <option value="1year">1 year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.monthly_co2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="co2_kg" 
                stroke="#ef4444" 
                strokeWidth={3}
                name="CO₂ Emitted (kg)"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="savings_kg" 
                stroke="#22c55e" 
                strokeWidth={3}
                name="CO₂ Saved (kg)"
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Savings Breakdown */}
        <div className="clover-card p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">CO₂ Savings by Month</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.monthly_co2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Bar 
                dataKey="savings_kg" 
                fill="url(#greenGradient)" 
                name="CO₂ Saved (kg)" 
                radius={[4, 4, 0, 0]}
              />
              <defs>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7B9669" />
                  <stop offset="100%" stopColor="#6B8659" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}
