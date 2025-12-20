'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/utils/token';

export default function AdvancedAnalyticsPage() {
  const [reportType, setReportType] = useState('overview');
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [reportType]);

  const fetchAnalytics = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/erp/inventory/analytics/advanced?type=${reportType}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const responseData = await res.json();
        setData(responseData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const runBatchOperation = async (operation: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch('/api/erp/inventory/analytics/advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ operation }),
      });

      if (res.ok) {
        alert('Operation completed successfully!');
        fetchAnalytics();
      }
    } catch (error) {
      console.error('Error running operation:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-500 mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Advanced Analytics & Reporting</h1>

        {/* Report Type Selector */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Report Type</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'overview', label: '📊 Overview' },
              { value: 'turnover', label: '🔄 Turnover' },
              { value: 'abc_analysis', label: '📈 ABC Analysis' },
              { value: 'stock_aging', label: '⏰ Stock Aging' },
              { value: 'valuation', label: '💰 Valuation' },
              { value: 'cogs', label: '💵 COGS' },
              { value: 'expiry', label: '📅 Expiry' },
              { value: 'quality', label: '✓ Quality' },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setReportType(type.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  reportType === type.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Batch Operations */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Batch Operations</h3>
          <div className="flex gap-3">
            <button
              onClick={() => runBatchOperation('calculate_abc')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Calculate ABC Classification
            </button>
            <button
              onClick={() => runBatchOperation('update_expiry_alerts')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Update Expiry Alerts
            </button>
            <button
              onClick={() => runBatchOperation('generate_po_suggestions')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate PO Suggestions
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Overview Report */}
          {reportType === 'overview' && data.overview && (
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Inventory Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="text-sm text-blue-600 font-medium mb-2">Total Products</div>
                  <div className="text-4xl font-bold text-blue-900">{data.overview.total_products}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-6">
                  <div className="text-sm text-green-600 font-medium mb-2">Total Quantity</div>
                  <div className="text-4xl font-bold text-green-900">
                    {parseFloat(data.overview.total_quantity || 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="text-sm text-purple-600 font-medium mb-2">Total Value</div>
                  <div className="text-4xl font-bold text-purple-900">
                    ${parseFloat(data.overview.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-6">
                  <div className="text-sm text-orange-600 font-medium mb-2">Warehouses</div>
                  <div className="text-4xl font-bold text-orange-900">{data.overview.total_warehouses}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-6">
                  <div className="text-sm text-red-600 font-medium mb-2">Low Stock Products</div>
                  <div className="text-4xl font-bold text-red-900">{data.overview.low_stock_products}</div>
                </div>
              </div>
            </div>
          )}

          {/* ABC Analysis Report */}
          {reportType === 'abc_analysis' && data.abc_analysis && (
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-6">ABC Classification Analysis</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classification</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.abc_analysis.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-lg font-bold rounded ${
                            item.abc_classification === 'A' ? 'bg-green-100 text-green-800' :
                            item.abc_classification === 'B' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.abc_classification || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.product_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${parseFloat(item.total_value || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${parseFloat(item.total_revenue || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Valuation Report */}
          {reportType === 'valuation' && data.valuation && (
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Inventory Valuation (FIFO/LIFO)</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Unit Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.valuation.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.warehouse_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {parseFloat(item.quantity).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${parseFloat(item.average_unit_cost).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ${parseFloat(item.total_value).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quality Report */}
          {reportType === 'quality' && data.quality && (
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Quality Inspection Summary (Last 30 Days)</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inspected</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accepted</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rejected</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rejection Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.quality.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.inspection_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            item.inspection_status === 'passed' ? 'bg-green-100 text-green-800' :
                            item.inspection_status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.inspection_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.inspection_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {parseFloat(item.total_inspected || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {parseFloat(item.total_accepted || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {parseFloat(item.total_rejected || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                          <span className={`${
                            parseFloat(item.rejection_rate) > 10 ? 'text-red-600' :
                            parseFloat(item.rejection_rate) > 5 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {parseFloat(item.rejection_rate).toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Default message for other reports */}
          {!['overview', 'abc_analysis', 'valuation', 'quality'].includes(reportType) && (
            <div className="p-6 text-center text-gray-500">
              <p>Report data for "{reportType}" is available. Implement specific UI as needed.</p>
              <pre className="mt-4 text-left bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
