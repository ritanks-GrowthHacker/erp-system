'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getAuthToken } from '@/lib/utils/token';

interface Analytics {
  totalProducts: number;
  totalValue: string;
  lowStockCount: number;
  outOfStockCount: number;
  topProducts: Array<{
    name: string;
    sku: string;
    totalQuantity: string;
    value: string;
  }>;
  warehouseStock: Array<{
    warehouseName: string;
    totalProducts: number;
    totalQuantity: string;
    totalValue: string;
  }>;
  recentMovements: Array<{
    movementType: string;
    productName: string;
    quantity: string;
    warehouseName: string;
    createdAt: string;
  }>;
}

export default function InventoryAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const token = getAuthToken();
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/erp/inventory/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Analytics data:', data);
        // Map API response to component state
        setAnalytics({
          totalProducts: parseInt(data.summary?.total_products || '0'),
          totalValue: data.summary?.total_value || '0',
          lowStockCount: parseInt(data.summary?.low_stock_count || '0'),
          outOfStockCount: parseInt(data.summary?.out_of_stock_count || '0'),
          topProducts: (data.topValueProducts || []).map((p: any) => ({
            name: p.product_name,
            sku: p.sku,
            totalQuantity: p.total_quantity,
            value: p.total_value,
          })),
          warehouseStock: (data.stockByCategory || []).map((c: any) => ({
            warehouseName: c.category_name,
            totalProducts: c.product_count,
            totalQuantity: c.total_quantity,
            totalValue: c.total_value,
          })),
          recentMovements: [],
        });
      } else {
        setError(`Failed to load analytics: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Error fetching analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading analytics...</div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500">
          {error || 'Failed to load analytics'}
        </div>
        <div className="text-center mt-4">
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Inventory Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-700">{analytics.totalProducts}</div>
            <p className="text-sm text-blue-600">Total Products</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-700">
              ₹{parseFloat(analytics.totalValue).toLocaleString()}
            </div>
            <p className="text-sm text-green-600">Total Inventory Value</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-700">{analytics.lowStockCount}</div>
            <p className="text-sm text-yellow-600">Low Stock Items</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-700">{analytics.outOfStockCount}</div>
            <p className="text-sm text-red-600">Out of Stock</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topProducts?.map((product, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{parseFloat(product.totalQuantity).toFixed(2)} units</p>
                    <p className="text-sm text-gray-600">₹{parseFloat(product.value).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {(!analytics.topProducts || analytics.topProducts.length === 0) && (
                <p className="text-center text-gray-500 py-4">No products found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Warehouse Stock Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Stock by Warehouse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.warehouseStock?.map((wh, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{wh.warehouseName}</p>
                    <p className="text-sm text-gray-600">{wh.totalProducts} products</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{parseFloat(wh.totalQuantity).toFixed(2)} units</p>
                    <p className="text-sm text-gray-600">₹{parseFloat(wh.totalValue).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {(!analytics.warehouseStock || analytics.warehouseStock.length === 0) && (
                <p className="text-center text-gray-500 py-4">No warehouses found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Stock Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Product</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Warehouse</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold">Quantity</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.recentMovements?.map((movement, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          movement.movementType === 'in'
                            ? 'bg-green-100 text-green-800'
                            : movement.movementType === 'out'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {movement.movementType.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2">{movement.productName}</td>
                    <td className="px-4 py-2">{movement.warehouseName}</td>
                    <td className="px-4 py-2 text-right font-medium">
                      {parseFloat(movement.quantity).toFixed(2)}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(movement.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!analytics.recentMovements || analytics.recentMovements.length === 0) && (
              <p className="text-center text-gray-500 py-8">No recent movements</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}