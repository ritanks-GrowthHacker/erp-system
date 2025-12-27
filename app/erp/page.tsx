'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/ui/icons';
import { getAuthToken } from '@/lib/utils/token';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockItems: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    // Show loader for 5 seconds
    const loaderTimer = setTimeout(() => {
      setShowLoader(false);
    }, 5000);

    fetchDashboardData();

    return () => clearTimeout(loaderTimer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = getAuthToken();
      
      // Fetch products
      const productsResponse = await fetch('/api/erp/inventory/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        const products = productsData.products || [];
        
        setStats({
          totalProducts: products.length,
          activeProducts: products.filter((p: any) => p.isActive).length,
          lowStockItems: 0, // TODO: implement stock level checking
          pendingOrders: 0, // TODO: fetch from orders API
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showLoader && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500"
          >
            <div className="text-center">
              {/* Animated Logo */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.2
                }}
                className="mb-8"
              >
                <div className="w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto">
                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Icons.Inventory className="text-blue-600" size={64} />
                  </motion.div>
                </div>
              </motion.div>

              {/* Company Name */}
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-5xl font-bold text-white mb-4"
              >
                ERP System
              </motion.h1>

              {/* Tagline */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-xl text-white/90 mb-8"
              >
                Enterprise Resource Planning
              </motion.p>

              {/* Loading Animation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex justify-center gap-2"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -20, 0],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="w-3 h-3 bg-white rounded-full"
                  />
                ))}
              </motion.div>

              {/* Loading Text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-white/80 mt-6 text-sm"
              >
                Loading your workspace...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showLoader ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="p-6"
      >
      {/* Page Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Dashboard</h2>
        <p className="text-sm text-gray-500">Overview of your business operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Total Products</span>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Icons.Inventory className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {loading ? '...' : stats.totalProducts}
          </p>
          <p className="text-xs text-gray-500">Total items in inventory</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Active Products</span>
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Icons.CheckCircle className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {loading ? '...' : stats.activeProducts}
          </p>
          <p className="text-xs text-gray-500">Currently available</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Pending Orders</span>
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Icons.Shopping className="text-orange-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {loading ? '...' : stats.pendingOrders}
          </p>
          <p className="text-xs text-gray-500">Awaiting processing</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Low Stock Items</span>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <Icons.Alert className="text-red-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {loading ? '...' : stats.lowStockItems}
          </p>
          <p className="text-xs text-gray-500">Need reordering</p>
        </div>
      </div>

      {/* Quick Access Modules */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/erp/inventory">
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Inventory className="text-emerald-600" size={24} />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">Inventory</h4>
                  <p className="text-xs text-gray-500">{stats.totalProducts} products</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">Manage products, stock levels, and warehouses</p>
            </div>
          </Link>

          <Link href="/erp/purchasing">
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-sky-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Shopping className="text-sky-600" size={24} />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">Purchasing</h4>
                  <p className="text-xs text-gray-500">0 orders</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">Create and manage purchase orders</p>
            </div>
          </Link>

          <Link href="/erp/sales/orders">
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Sales className="text-indigo-600" size={24} />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">Sales</h4>
                  <p className="text-xs text-gray-500">0 orders</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">Track sales orders and customers</p>
            </div>
          </Link>

          <Link href="/erp/manufacturing">
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Manufacturing className="text-purple-600" size={24} />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">Manufacturing</h4>
                  <p className="text-xs text-gray-500">0 jobs</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">Manage BOMs and production orders</p>
            </div>
          </Link>

          <Link href="/erp/reports">
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-pink-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Reports className="text-pink-600" size={24} />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">Reports</h4>
                  <p className="text-xs text-gray-500">Analytics</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">View analytics and generate reports</p>
            </div>
          </Link>

          <Link href="/erp/settings">
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Settings className="text-slate-600" size={24} />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">Settings</h4>
                  <p className="text-xs text-gray-500">Configure</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">Configure ERP system settings</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Recent Activities</h3>
          </div>
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icons.Info className="text-gray-400" size={28} />
            </div>
            <p className="text-gray-600 font-medium">No recent activities</p>
            <p className="text-sm text-gray-500 mt-1">Start using the system to see activity here</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Alerts & Notifications</h3>
          </div>
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">All clear!</p>
            <p className="text-sm text-gray-500 mt-1">No alerts or notifications at the moment</p>
          </div>
        </div>
      </div>
    </motion.div>
    </>
  );
}
