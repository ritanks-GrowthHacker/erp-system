'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/utils/token';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const VoiceCommand = dynamic(() => import('@/components/VoiceCommand'), {
  ssr: false,
});

export default function InventoryDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    activeSKUs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [showVoiceCommand, setShowVoiceCommand] = useState(false);
  const [voiceKey, setVoiceKey] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleMicrophoneClick = () => {
    setVoiceKey(prev => prev + 1); // Force fresh component mount
    setShowVoiceCommand(true);
  };

  const fetchStats = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      
      // Fetch products for stats
      const productsRes = await fetch('/api/erp/inventory/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (productsRes.ok) {
        const data = await productsRes.json();
        const products = data.products || [];
        
        setStats({
          totalProducts: products.length,
          lowStockItems: products.filter((p: any) => 
            parseFloat(p.reorderPoint || '0') > 0
          ).length,
          activeSKUs: products.filter((p: any) => p.isActive).length,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationCards = [
    {
      title: 'Stock Levels',
      subtitle: 'Manage your catalog',
      icon: '📦',
      path: '/erp/inventory/products',
      color: 'bg-blue-500',
    },
    {
      title: 'Stock Levels',
      subtitle: 'Real-time counts',
      icon: '📊',
      path: '/erp/inventory/stock-levels',
      color: 'bg-orange-500',
    },
    {
      title: 'Warehouses',
      subtitle: '',
      icon: '🏭',
      path: '/erp/inventory/warehouses',
      color: 'bg-indigo-500',
    },
    {
      title: 'Categories',
      subtitle: '',
      icon: '📁',
      path: '/erp/inventory/categories',
      color: 'bg-green-500',
    },
    {
      title: 'Alerts',
      subtitle: '',
      icon: '📈',
      path: '/erp/inventory/alerts',
      color: 'bg-red-500',
    },
    {
      title: 'All Products',
      subtitle: '',
      icon: '🔔',
      path: '/erp/inventory/products',
      color: 'bg-purple-500',
    },
    {
      title: 'Procurement',
      subtitle: 'Auto reordering',
      icon: '🛒',
      path: '/erp/inventory/procurement',
      color: 'bg-teal-500',
    },
    {
      title: 'Advanced Analytics',
      subtitle: 'Reports & insights',
      icon: '📊',
      path: '/erp/inventory/analytics/advanced',
      color: 'bg-pink-500',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-500 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products, command..."
              className="w-full px-5 py-3.5 pl-12 bg-white rounded-2xl shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Intelligence Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Intelligence</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Products */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="text-sm text-gray-600 mb-2">Total Products</div>
                  <div className="text-4xl font-bold text-gray-900 mb-3">{stats.totalProducts.toLocaleString()}</div>
                  <div className="flex items-center gap-2">
                    <svg className="w-16 h-12 text-green-500" viewBox="0 0 80 40" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        points="0,30 15,25 30,28 45,20 60,15 75,10"
                      />
                    </svg>
                  </div>
                  <div className="inline-block mt-2 px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    +12% last month
                  </div>
                </div>

                {/* Low Stock Items */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="text-sm text-gray-600 mb-2">Low Stock Items</div>
                  <div className="text-4xl font-bold text-gray-900 mb-3">{stats.lowStockItems}</div>
                  <div className="flex items-center gap-2">
                    <svg className="w-16 h-12 text-red-500" viewBox="0 0 80 40" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        points="0,20 15,22 30,18 45,25 60,28 75,32"
                      />
                    </svg>
                  </div>
                  <div className="inline-block mt-2 px-2.5 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                    -5 since yesterday
                  </div>
                </div>

                {/* Active SKUs */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="text-sm text-gray-600 mb-2">Active SKUs</div>
                  <div className="text-4xl font-bold text-gray-900 mb-3">{stats.activeSKUs}</div>
                  <div className="flex items-center gap-2">
                    <svg className="w-16 h-12 text-blue-500" viewBox="0 0 80 40" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        points="0,35 15,32 30,28 45,25 60,20 75,15"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Hub */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Navigation Hub</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {navigationCards.map((card, index) => (
                  <button
                    key={index}
                    onClick={() => router.push(card.path)}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-1 text-left group"
                  >
                    <div className={`w-14 h-14 ${card.color} bg-opacity-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <span className="text-3xl">{card.icon}</span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">{card.title}</h3>
                    {card.subtitle && (
                      <p className="text-sm text-gray-500">{card.subtitle}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Smart Assistant */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Smart Assistant</h2>
              
              {/* Microphone Button */}
              <div className="bg-gray-50 rounded-xl p-8 mb-6 flex flex-col items-center">
                <button
                  onClick={handleMicrophoneClick}
                  className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 bg-linear-to-br from-blue-400 to-cyan-500 hover:shadow-lg hover:scale-105 cursor-pointer`}
                >
                  {/* Sound Wave Animation - Left */}
                  {showVoiceCommand && (
                    <>
                      <div className="absolute -left-5 flex items-center gap-1">
                        <div className="w-1 bg-blue-400 rounded-full animate-pulse" style={{ height: '12px', animationDelay: '0ms' }}></div>
                        <div className="w-1 bg-blue-400 rounded-full animate-pulse" style={{ height: '20px', animationDelay: '150ms' }}></div>
                        <div className="w-1 bg-blue-400 rounded-full animate-pulse" style={{ height: '16px', animationDelay: '300ms' }}></div>
                      </div>
                      {/* Sound Wave Animation - Right */}
                      <div className="absolute -right-5 flex items-center gap-1">
                        <div className="w-1 bg-blue-400 rounded-full animate-pulse" style={{ height: '16px', animationDelay: '0ms' }}></div>
                        <div className="w-1 bg-blue-400 rounded-full animate-pulse" style={{ height: '20px', animationDelay: '150ms' }}></div>
                        <div className="w-1 bg-blue-400 rounded-full animate-pulse" style={{ height: '12px', animationDelay: '300ms' }}></div>
                      </div>
                    </>
                  )}
                  
                  {/* Microphone Icon */}
                  <svg className="w-12 h-12 text-white relative z-10" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
                  </svg>
                </button>
                
                {/* Dots Indicator */}
                <div className="flex justify-center gap-1.5 mt-4">
                  <div className={`w-2 h-2 rounded-full transition-all ${showVoiceCommand ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <div className={`w-2 h-2 rounded-full transition-all ${showVoiceCommand ? 'bg-blue-400' : 'bg-gray-300'}`}></div>
                  <div className={`w-2 h-2 rounded-full transition-all ${showVoiceCommand ? 'bg-blue-300' : 'bg-gray-300'}`}></div>
                </div>
              </div>

              {/* Available Commands */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Available Commands</h3>
                <button
                  onClick={() => router.push('/erp/inventory/products')}
                  className="w-full bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-left transition-colors flex items-center gap-3 border border-gray-200"
                >
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium text-gray-700">Add New Item</span>
                </button>
                <button 
                  onClick={() => router.push('/erp/inventory/stock-levels')}
                  className="w-full bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-left transition-colors flex items-center gap-3 border border-gray-200"
                >
                  <span className="text-lg">📦</span>
                  <span className="text-sm font-medium text-gray-700">View Stock</span>
                </button>
                <button 
                  onClick={() => router.push('/erp/inventory/alerts')}
                  className="w-full bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-left transition-colors flex items-center gap-3 border border-gray-200"
                >
                  <span className="text-lg">🔔</span>
                  <span className="text-sm font-medium text-gray-700">Check Alerts</span>
                </button>
              </div>

              <div className="mt-6 text-xs text-gray-500 text-center">
                Click the microphone to start voice commands
              </div>
            </div>
          </div>
        </div>
        
        {/* Voice Command Component */}
        {showVoiceCommand && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <VoiceCommand
                key={voiceKey}
                onResults={(products) => {
                  console.log('Voice search results:', products);
                  setShowVoiceCommand(false);
                }}
                onProductCreated={() => {
                  fetchStats();
                  setShowVoiceCommand(false);
                }}
              />
              <button
                onClick={() => setShowVoiceCommand(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
