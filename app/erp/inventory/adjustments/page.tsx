'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAuthToken } from '@/lib/utils/token';

interface StockAdjustment {
  id: string;
  adjustmentType: string;
  status: string;
  adjustmentDate: string;
  notes: string | null;
  warehouse: {
    name: string;
  };
  lines: Array<{
    product: {
      name: string;
      sku: string;
    };
    countedQuantity: string;
    systemQuantity: string;
  }>;
}

export default function AdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');



  useEffect(() => {
    fetchAdjustments();
  }, [selectedStatus]);

  const fetchAdjustments = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);

      const response = await fetch(`/api/erp/inventory/adjustments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAdjustments(data.adjustments || []);
      }
    } catch (error) {
      console.error('Error fetching adjustments:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmAdjustment = async (id: string) => {
    if (!confirm('Are you sure you want to confirm this adjustment? This will update stock levels.')) {
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`/api/erp/inventory/adjustments/${id}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchAdjustments();
        alert('Stock adjustment confirmed successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to confirm adjustment');
      }
    } catch (error) {
      console.error('Error confirming adjustment:', error);
      alert('Failed to confirm adjustment');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getAdjustmentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      cycle_count: '🔢 Cycle Count',
      write_off: '📝 Write Off',
      damage: '💔 Damage',
      found: '🔍 Found',
      correction: '✏️ Correction',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading stock adjustments...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Stock Adjustments</h1>
        <Button onClick={() => (window.location.href = '/erp/inventory/adjustments/new')}>
          + New Adjustment
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adjustments List */}
      <Card>
        <CardHeader>
          <CardTitle>Adjustments ({adjustments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {adjustments.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No stock adjustments found
              </div>
            ) : (
              adjustments.map((adjustment) => (
                <div
                  key={adjustment.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">
                          {getAdjustmentTypeLabel(adjustment.adjustmentType)}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded ${getStatusColor(
                            adjustment.status
                          )}`}
                        >
                          {adjustment.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Warehouse: {adjustment.warehouse.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        Date: {new Date(adjustment.adjustmentDate).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {adjustment.status === 'draft' && (
                        <button
                          onClick={() => confirmAdjustment(adjustment.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Confirm
                        </button>
                      )}
                      <button
                        onClick={() =>
                          (window.location.href = `/erp/inventory/adjustments/${adjustment.id}`)
                        }
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>

                  {adjustment.notes && (
                    <div className="text-sm text-gray-700 mb-3">
                      📝 {adjustment.notes}
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="text-sm font-medium mb-2">
                      Items ({adjustment.lines?.length || 0}):
                    </div>
                    <div className="space-y-1">
                      {adjustment.lines?.slice(0, 3).map((line, idx) => {
                        const difference =
                          parseFloat(line.countedQuantity) - parseFloat(line.systemQuantity);
                        return (
                          <div
                            key={idx}
                            className="text-sm text-gray-600 flex justify-between"
                          >
                            <span>
                              {line.product.name} ({line.product.sku})
                            </span>
                            <span
                              className={
                                difference !== 0
                                  ? difference > 0
                                    ? 'text-green-600 font-medium'
                                    : 'text-red-600 font-medium'
                                  : ''
                              }
                            >
                              System: {line.systemQuantity} → Counted: {line.countedQuantity}
                              {difference !== 0 && ` (${difference > 0 ? '+' : ''}${difference})`}
                            </span>
                          </div>
                        );
                      })}
                      {adjustment.lines && adjustment.lines.length > 3 && (
                        <div className="text-sm text-gray-500">
                          + {adjustment.lines.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

