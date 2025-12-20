'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/utils/token';
import { useRouter } from 'next/navigation';
import ReorderRuleModal from '@/components/modal/ReorderRuleModal';

export default function ProcurementDashboard() {
  const router = useRouter();
  const [reorderRules, setReorderRules] = useState([]);
  const [poSuggestions, setPOSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [showRuleModal, setShowRuleModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      
      // Fetch PO suggestions
      const suggestionsRes = await fetch('/api/erp/inventory/procurement/po-suggestions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (suggestionsRes.ok) {
        const data = await suggestionsRes.json();
        setPOSuggestions(data.suggestions || []);
      }

      // Fetch reorder rules
      const rulesRes = await fetch('/api/erp/inventory/procurement/reorder-rules', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (rulesRes.ok) {
        const data = await rulesRes.json();
        setReorderRules(data.rules || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch('/api/erp/inventory/procurement/po-suggestions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Generated suggestions:', data);
        
        // Refresh data to show new suggestions
        await fetchData();
        
        alert(`✅ Generated ${data.count || 0} purchase order suggestions successfully!`);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'Failed to generate suggestions'}`);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      alert('Error generating suggestions. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const updateSuggestionStatus = async (id: string, status: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch('/api/erp/inventory/procurement/po-suggestions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error updating suggestion:', error);
    }
  };

  const createReorderRule = async (
    productId: string,
    warehouseId: string | null,
    reorderPoint: string,
    reorderQuantity: string,
    leadTimeDays: string | null,
    priority: string | null
  ) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch('/api/erp/inventory/procurement/reorder-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          warehouseId: warehouseId || null,
          reorderPoint: parseFloat(reorderPoint),
          reorderQuantity: parseFloat(reorderQuantity),
          leadTimeDays: leadTimeDays ? parseInt(leadTimeDays) : 7,
          priority: priority || 'normal',
        }),
      });

      if (res.ok) {
        alert('Reorder rule created successfully!');
        fetchData();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'Failed to create reorder rule'}`);
      }
    } catch (error) {
      console.error('Error creating reorder rule:', error);
      alert('Error creating reorder rule. Check console for details.');
    }
  };

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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Procurement Automation</h1>
          <button
            onClick={generateSuggestions}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Generate Suggestions
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'suggestions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Purchase Order Suggestions
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'rules'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reorder Rules
              </button>
            </nav>
          </div>
        </div>

        {/* PO Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Purchase Order Suggestions</h2>
              <p className="text-gray-600 mb-6">
                Automatically generated suggestions based on current stock levels and reorder rules.
              </p>
            </div>

            {poSuggestions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No purchase order suggestions available. Click "Generate Suggestions" to create new ones.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Suggested Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Remaining</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {poSuggestions.map((suggestion: any) => (
                      <tr key={suggestion.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{suggestion.product_name}</div>
                          <div className="text-sm text-gray-500">{suggestion.product_sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {parseFloat(suggestion.current_stock || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {parseFloat(suggestion.suggested_quantity).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {suggestion.days_of_stock_remaining || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            suggestion.priority === 'critical' ? 'bg-red-100 text-red-800' :
                            suggestion.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            suggestion.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {suggestion.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            suggestion.status === 'approved' ? 'bg-green-100 text-green-800' :
                            suggestion.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {suggestion.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {suggestion.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateSuggestionStatus(suggestion.id, 'approved')}
                                className="text-green-600 hover:text-green-900"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => updateSuggestionStatus(suggestion.id, 'rejected')}
                                className="text-red-600 hover:text-red-900"
                              >
                                ✗ Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Reorder Rules Tab */}
        {activeTab === 'rules' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold mb-4">Reorder Rules</h2>
                <p className="text-gray-600 mb-6">
                  Configure automatic reorder points and quantities for each product.
                </p>
              </div>
              <button
                onClick={() => setShowRuleModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                + New Rule
              </button>
            </div>

            {reorderRules.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No reorder rules configured. Click "+ New Rule" to create one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Point</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reorderRules.map((rule: any) => (
                      <tr key={rule.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{rule.product_name}</div>
                          <div className="text-sm text-gray-500">{rule.product_sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {rule.warehouse_name || 'All Warehouses'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`${
                            parseFloat(rule.current_stock) <= parseFloat(rule.reorder_point)
                              ? 'text-red-600 font-semibold'
                              : 'text-gray-900'
                          }`}>
                            {parseFloat(rule.current_stock || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {parseFloat(rule.reorder_point).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                          {parseFloat(rule.reorder_quantity).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {rule.lead_time_days} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reorder Rule Modal */}
      <ReorderRuleModal
        isOpen={showRuleModal}
        onClose={() => setShowRuleModal(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
