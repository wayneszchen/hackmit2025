import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const Popup = () => {
  const [stats, setStats] = useState({ totalProducts: 0, averageFootprint: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const result = await chrome.storage.local.get(['carbonCache']);
      const carbonCache = result.carbonCache || {};
      
      const products = Object.values(carbonCache);
      const totalProducts = products.length;
      const averageFootprint = products.length > 0 
        ? Math.round(products.reduce((sum, p) => sum + p.carbon_footprint_g, 0) / products.length)
        : 0;

      setStats({ totalProducts, averageFootprint });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="w-80 p-4 bg-white">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <span className="text-2xl">🌱</span>
          <h1 className="text-xl font-bold text-gray-800">EcoTrack</h1>
        </div>
        <p className="text-sm text-gray-600">Carbon footprint tracker for your purchases</p>
      </div>

      <div className="space-y-3">
        <div className="bg-eco-green bg-opacity-10 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Products Tracked</span>
            <span className="font-semibold text-eco-green">{stats.totalProducts}</span>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Avg. Carbon Footprint</span>
            <span className="font-semibold text-blue-600">{stats.averageFootprint}g CO₂</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          Add items to cart on Amazon to see eco-friendly alternatives!
        </p>
      </div>
    </div>
  );
};

// Render the popup
const container = document.getElementById('popup-root');
const root = createRoot(container);
root.render(<Popup />);
