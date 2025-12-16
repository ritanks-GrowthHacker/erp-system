'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export default function ErpDashboard() {
  const modules = [
    {
      title: 'Inventory Management',
      description: 'Manage products, stock levels, and warehouses',
      href: '/erp/inventory',
      icon: '📦',
      color: 'bg-blue-500',
    },
    {
      title: 'Purchasing',
      description: 'Create and manage purchase orders',
      href: '/erp/purchasing',
      icon: '🛒',
      color: 'bg-green-500',
    },
    {
      title: 'Sales',
      description: 'Track sales orders and customer relationships',
      href: '/erp/sales',
      icon: '💰',
      color: 'bg-purple-500',
    },
    {
      title: 'Manufacturing',
      description: 'Manage BOMs and production orders',
      href: '/erp/manufacturing',
      icon: '🏭',
      color: 'bg-orange-500',
    },
    {
      title: 'Reports',
      description: 'View analytics and generate reports',
      href: '/erp/reports',
      icon: '📊',
      color: 'bg-pink-500',
    },
    {
      title: 'Settings',
      description: 'Configure ERP system settings',
      href: '/erp/settings',
      icon: '⚙️',
      color: 'bg-gray-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">ERP Dashboard</h1>
          <p className="mt-2 text-lg text-gray-600">
            Welcome to your Enterprise Resource Planning system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Link key={module.href} href={module.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`${module.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}
                    >
                      {module.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {module.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {module.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Quick Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-medium text-gray-500">
                  Total Products
                </div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  0
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  No change from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-medium text-gray-500">
                  Pending Orders
                </div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  0
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  No pending orders
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-medium text-gray-500">
                  Active Warehouses
                </div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  0
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Add your first warehouse
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-medium text-gray-500">
                  Low Stock Items
                </div>
                <div className="mt-2 text-3xl font-bold text-orange-600">
                  0
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  No items below reorder point
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
