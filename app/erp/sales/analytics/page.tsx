'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/utils/token';

interface AnalyticsData {
  revenue: {
    total: number;
    growth: number;
    byMonth: { month: string; revenue: number }[];
  };
  orders: {
    total: number;
    growth: number;
    avgOrderValue: number;
  };
  topCustomers: Array<{
    id: string;
    name: string;
    totalOrders: number;
    totalRevenue: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    unitsSold: number;
    revenue: number;
  }>;
}

export default function SalesAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/erp/sales/analytics?days=${timeRange}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2"></div>
          <div className="text-gray-600">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">No analytics data available</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Track sales performance and trends</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Revenue</div>
            <div className={`text-xs font-semibold ${data.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.revenue.growth >= 0 ? '↑' : '↓'} {Math.abs(data.revenue.growth).toFixed(1)}%
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            ₹{data.revenue.total.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Orders</div>
            <div className={`text-xs font-semibold ${data.orders.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.orders.growth >= 0 ? '↑' : '↓'} {Math.abs(data.orders.growth).toFixed(1)}%
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {data.orders.total.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600 mb-2">Avg Order Value</div>
          <div className="text-3xl font-bold text-gray-900">
            ₹{data.orders.avgOrderValue.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600 mb-2">Conversion Rate</div>
          <div className="text-3xl font-bold text-gray-900">
            {((data.orders.total / (data.orders.total + 100)) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h2>
        <div className="space-y-3">
          {data.revenue.byMonth.map((item, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium text-gray-600">{item.month}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{
                    width: `${(item.revenue / Math.max(...data.revenue.byMonth.map(m => m.revenue))) * 100}%`
                  }}
                />
              </div>
              <div className="w-32 text-sm font-semibold text-gray-900 text-right">
                ₹{item.revenue.toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Top Customers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Avg Order
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.topCustomers.slice(0, 15).map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {customer.totalOrders}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ₹{customer.totalRevenue.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    ₹{(customer.totalRevenue / customer.totalOrders).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Units Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Avg Price
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.topProducts.slice(0, 15).map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {product.unitsSold}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ₹{product.revenue.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    ₹{(product.revenue / product.unitsSold).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
