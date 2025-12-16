'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAuthToken } from '@/lib/utils/token';

interface StockMovement {
  id: string;
  movementType: string;
  status: string;
  scheduledDate: string | null;
  completedDate: string | null;
  notes: string | null;
  createdAt: string;
  lines: Array<{
    product: {
      name: string;
      sku: string;
    };
    quantityOrdered: string;
    quantityProcessed: string;
  }>;
}

export default function MovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');



  useEffect(() => {
    fetchMovements();
  }, [selectedType, selectedStatus]);

  const fetchMovements = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedType) params.append('movementType', selectedType);
      if (selectedStatus) params.append('status', selectedStatus);

      const response = await fetch(`/api/erp/inventory/movements?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMovements(data.movements || []);
      }
    } catch (error) {
      console.error('Error fetching movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      receipt: '📥 Receipt',
      delivery: '📤 Delivery',
      internal_transfer: '🔄 Transfer',
      adjustment: '✏️ Adjustment',
      return: '↩️ Return',
      scrap: '🗑️ Scrap',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading stock movements...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Stock Movements</h1>
        <Button onClick={() => (window.location.href = '/erp/inventory/movements/new')}>
          + New Movement
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Movement Type
              </label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="receipt">Receipt</option>
                <option value="delivery">Delivery</option>
                <option value="internal_transfer">Internal Transfer</option>
                <option value="adjustment">Adjustment</option>
                <option value="return">Return</option>
                <option value="scrap">Scrap</option>
              </select>
            </div>

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
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movements List */}
      <Card>
        <CardHeader>
          <CardTitle>Movements ({movements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {movements.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No stock movements found
              </div>
            ) : (
              movements.map((movement) => (
                <div
                  key={movement.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">
                          {getMovementTypeLabel(movement.movementType)}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded ${getStatusColor(
                            movement.status
                          )}`}
                        >
                          {movement.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Created: {new Date(movement.createdAt).toLocaleString()}
                      </div>
                      {movement.scheduledDate && (
                        <div className="text-sm text-gray-600">
                          Scheduled: {new Date(movement.scheduledDate).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        (window.location.href = `/erp/inventory/movements/${movement.id}`)
                      }
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Details →
                    </button>
                  </div>

                  {movement.notes && (
                    <div className="text-sm text-gray-700 mb-3">
                      📝 {movement.notes}
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="text-sm font-medium mb-2">
                      Products ({movement.lines?.length || 0}):
                    </div>
                    <div className="space-y-1">
                      {movement.lines?.slice(0, 3).map((line, idx) => (
                        <div key={idx} className="text-sm text-gray-600 flex justify-between">
                          <span>
                            {line.product.name} ({line.product.sku})
                          </span>
                          <span>
                            Qty: {line.quantityOrdered}
                            {movement.status === 'completed' &&
                              ` (Processed: ${line.quantityProcessed})`}
                          </span>
                        </div>
                      ))}
                      {movement.lines && movement.lines.length > 3 && (
                        <div className="text-sm text-gray-500">
                          + {movement.lines.length - 3} more items
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

