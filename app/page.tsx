'use client'

import { useState } from 'react'
import { Leaf, Calculator, TrendingDown, Award, History, ArrowRight, Sparkles } from 'lucide-react'
import ProductChecker from '@/components/ProductChecker'
import Dashboard from '@/components/Dashboard'
import Rewards from '@/components/Rewards'
import PurchaseHistory from '@/components/PurchaseHistory'

export default function Home() {
  const [activeTab, setActiveTab] = useState('checker')

  return (
    <div className="min-h-screen yc-hero-gradient">
      {/* Spline 3D Scene */}
      <main className="h-screen">
        <iframe src='https://my.spline.design/plane-08S9wlnBnEvzhsbihBTZXo1W/' frameBorder='0' width='100%' height='100%'></iframe>
      </main>
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center animate-pulse-slow">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-black text-black tracking-tight">OFFSET</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button className="yc-button-secondary text-xs py-3 px-6">
                SIGN IN
              </button>
              <button className="yc-button-primary text-xs py-3 px-6">
                SIGN UP
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/images/wallpaper.png)',
            filter: 'brightness(0.7)'
          }}
        />
        
        {/* Content Overlay */}
        <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
          {/* White Text Box */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 mb-12 shadow-2xl animate-fade-in-up">
            <h1 className="text-6xl md:text-7xl font-black text-black mb-6 leading-none tracking-tighter">
              CARBON FOOTPRINT
              <br />
              <span className="yc-mono" style={{color: '#7B9669'}}>OPTIMIZATION</span>
            </h1>
            <p className="text-xl text-gray-600 font-medium max-w-3xl mx-auto">
              Real-time carbon impact analysis for every purchase decision.
              <br />
              Discover sustainable alternatives. Track your environmental impact.
            </p>
          </div>
        </div>

      </section>

      {/* Feature Cards Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="yc-card p-8 text-left hover-lift animate-fade-in-up group">
            <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-black text-black mb-3 text-lg tracking-tight uppercase">ANALYSIS</h3>
            <p className="text-gray-600 font-medium">Real-time carbon impact estimates for every purchase decision.</p>
          </div>
          
          <div className="yc-card p-8 text-left hover-lift animate-fade-in-up animate-delay-100 group">
            <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
              <TrendingDown className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-black text-black mb-3 text-lg tracking-tight uppercase">INSIGHTS</h3>
            <p className="text-gray-600 font-medium">Advanced analytics and detailed environmental impact tracking.</p>
          </div>
          
          <div className="yc-card p-8 text-left hover-lift animate-fade-in-up animate-delay-200 group">
            <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
              <Award className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-black text-black mb-3 text-lg tracking-tight uppercase">REWARDS</h3>
            <p className="text-gray-600 font-medium">Achievement system for sustainable purchasing decisions.</p>
          </div>
          
          <div className="yc-card p-8 text-left hover-lift animate-fade-in-up animate-delay-300 group">
            <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
              <History className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-black text-black mb-3 text-lg tracking-tight uppercase">HISTORY</h3>
            <p className="text-gray-600 font-medium">Complete purchase tracking with alternative recommendations.</p>
          </div>
        </div>
      </section>

      {/* Scrolling Ticker */}
      <section className="bg-black border-y border-gray-800 py-6 mb-20">
        <div className="ticker-container">
          <div className="ticker text-white font-black text-lg tracking-wider yc-mono">
            USING: YC • ANTHROPIC • CEREBRAS AI • WINDSURF • KNOT • AMAZON • TARGET • WALMART • YC • ANTHROPIC • CEREBRAS AI • WINDSURF • AMAZON • TARGET • WALMART
          </div>
        </div>
      </section>

      {/* Navigation */}
      <nav className="bg-white border-b-2 border-black sticky top-[97px] z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-0">
            <button
              onClick={() => setActiveTab('checker')}
              className={`py-6 px-8 border-b-4 font-black text-xs uppercase tracking-widest transition-all duration-300 ${
                activeTab === 'checker'
                  ? 'text-black'
                  : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-50'
              }`}
              style={activeTab === 'checker' ? {borderColor: '#7B9669', backgroundColor: '#BAC8B1'} : {}}
            >
              CHECKER
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-6 px-8 border-b-4 font-black text-xs uppercase tracking-widest transition-all duration-300 ${
                activeTab === 'dashboard'
                  ? 'text-black'
                  : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-50'
              }`}
              style={activeTab === 'dashboard' ? {borderColor: '#7B9669', backgroundColor: '#BAC8B1'} : {}}
            >
              DASHBOARD
            </button>
            <button
              onClick={() => setActiveTab('rewards')}
              className={`py-6 px-8 border-b-4 font-black text-xs uppercase tracking-widest transition-all duration-300 ${
                activeTab === 'rewards'
                  ? 'text-black'
                  : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-50'
              }`}
              style={activeTab === 'rewards' ? {borderColor: '#7B9669', backgroundColor: '#BAC8B1'} : {}}
            >
              REWARDS
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-6 px-8 border-b-4 font-black text-xs uppercase tracking-widest transition-all duration-300 ${
                activeTab === 'history'
                  ? 'text-black'
                  : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-50'
              }`}
              style={activeTab === 'history' ? {borderColor: '#7B9669', backgroundColor: '#BAC8B1'} : {}}
            >
              HISTORY
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {activeTab === 'checker' && <ProductChecker />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'rewards' && <Rewards />}
        {activeTab === 'history' && <PurchaseHistory />}
      </main>

      {/* Footer */}
      <footer className="bg-black mt-32" style={{borderTop: '4px solid #7B9669'}}>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse-slow" style={{backgroundColor: '#7B9669'}}>
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <span className="font-black text-white text-2xl tracking-tight">OFFSET</span>
            </div>
            <p className="mb-3 font-black uppercase tracking-widest text-sm yc-mono" style={{color: '#7B9669'}}>HACKMIT 2025 - SUSTAINABILITY TRACK</p>
            <p className="text-gray-400 font-medium">Optimizing carbon footprints through intelligent purchasing decisions</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
