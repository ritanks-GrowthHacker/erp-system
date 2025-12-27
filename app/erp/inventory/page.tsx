'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/utils/token';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  Boxes, 
  AlertCircle, 
  TrendingUp, 
  Package,
  Mic
} from 'lucide-react';

const VoiceCommand = dynamic(() => import('@/components/VoiceCommand'), {
  ssr: false,
});

export default function InventoryDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    activeSKUs: 0,
    totalStockValue: 0,
    totalCustomers: 0
  });
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const [showVoiceCommand, setShowVoiceCommand] = useState(false);
  const [voiceKey, setVoiceKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 3000);
    fetchStats();
    return () => clearTimeout(timer);
  }, []);

  const handleMicrophoneClick = () => {
    setVoiceKey(prev => prev + 1);
    setShowVoiceCommand(true);
  };

  const fetchStats = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      
      const productsRes = await fetch('/api/erp/inventory/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (productsRes.ok) {
        const data = await productsRes.json();
        const products = data.products || [];
        
        const totalValue = products.reduce((sum: number, p: any) => {
          return sum + (parseFloat(p.costPrice || 0) * (p.availableQuantity || 0));
        }, 0);
        
        setStats({
          totalProducts: products.length,
          lowStockItems: products.filter((p: any) => 
            p.availableQuantity <= parseFloat(p.reorderPoint || '0')
          ).length,
          activeSKUs: products.filter((p: any) => p.isActive).length,
          totalStockValue: totalValue,
          totalCustomers: stats.totalCustomers, 
        });
      }
      
      const customersRes = await fetch('/api/erp/sales/customers', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (customersRes.ok) {
        const data = await customersRes.json();
        const customers = data.customers || [];
        setStats(prevStats => ({
          ...prevStats,
          totalCustomers: customers.length,
        }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-500 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <AnimatePresence>
        {showLoader && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-linear-to-br from-emerald-600 via-green-600 to-teal-600"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="mb-6"
              >
                <div className="w-24 h-24 bg-white rounded-2xl shadow-2xl flex items-center justify-center mx-auto">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Boxes className="text-emerald-600" size={48} />
                  </motion.div>
                </div>
              </motion.div>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold text-white mb-2"
              >
                Inventory
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-white/80"
              >
                Loading your products...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showLoader ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Inventory Overview</h2>
              <p className="text-sm text-gray-500 mt-1 italic">Real-time inventory insights and metrics</p>
            </div>
            <button
              onClick={handleMicrophoneClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
            >
              <Mic size={18} />
              Voice Command
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Total Customers */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Box className="text-blue-600" size={20} />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  +12%
                </span>
              </div>
              <div className="text-sm font-medium text-gray-600 mb-1">Customers</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalCustomers.toLocaleString()}</div>
            </div>

            {/* Active SKUs */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="text-green-600" size={20} />
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600 mb-1">Active SKUs</div>
              <div className="text-2xl font-bold text-gray-900">{stats.activeSKUs.toLocaleString()}</div>
            </div>

            {/* Low Stock Items */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="text-red-600" size={20} />
                </div>
                {stats.lowStockItems > 0 && (
                  <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                    Action Required
                  </span>
                )}
              </div>
              <div className="text-sm font-medium text-gray-600 mb-1">Low Stock Items</div>
              <div className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</div>
            </div>

            {/* Total Stock Value */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="text-purple-600" size={20} />
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600 mb-1">Stock Value</div>
              <div className="text-2xl font-bold text-gray-900">
                ₹{stats.totalStockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => router.push('/erp/inventory/products')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <Box className="text-blue-600 mb-2" size={20} />
                <div className="text-sm font-medium text-gray-900">View Products</div>
                <div className="text-xs text-gray-500 mt-1">Manage catalog</div>
              </button>
              <button
                onClick={() => router.push('/erp/inventory/stock-levels')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <Boxes className="text-green-600 mb-2" size={20} />
                <div className="text-sm font-medium text-gray-900">Stock Levels</div>
                <div className="text-xs text-gray-500 mt-1">Check quantities</div>
              </button>
              <button
                onClick={() => router.push('/erp/inventory/procurement')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <Package className="text-orange-600 mb-2" size={20} />
                <div className="text-sm font-medium text-gray-900">Procurement</div>
                <div className="text-xs text-gray-500 mt-1">Auto reordering</div>
              </button>
              <button
                onClick={() => router.push('/erp/inventory/analytics')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <TrendingUp className="text-purple-600 mb-2" size={20} />
                <div className="text-sm font-medium text-gray-900">Analytics</div>
                <div className="text-xs text-gray-500 mt-1">View insights</div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Voice Command Modal */}
        {showVoiceCommand && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Voice Command</h3>
                <button
                  onClick={() => setShowVoiceCommand(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
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
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}