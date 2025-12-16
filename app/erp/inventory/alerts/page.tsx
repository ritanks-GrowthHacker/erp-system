'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAuthToken } from '@/lib/utils/token';

interface StockAlert {
  id: string;
  alert_type: string;
  alert_level: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
  resolved_at: string | null;
  product_name: string;
  product_sku: string;
  warehouse_name: string;
  current_quantity: string;
  threshold_quantity: string;
}

export default function StockAlertsPage() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [showResolved]);

  const fetchAlerts = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (!showResolved) params.append('resolved', 'false');

      const response = await fetch(`/api/erp/inventory/alerts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`/api/erp/inventory/alerts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ alertId }),
      });

      if (response.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case 'low_stock':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'out_of_stock':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'reorder_point':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading alerts...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Stock Alerts</h1>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium">Show Resolved</span>
        </label>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{alerts.filter((a) => !a.is_resolved).length}</div>
            <p className="text-sm text-gray-600">Active Alerts</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-700">
              {alerts.filter((a) => a.alert_type === 'out_of_stock' && !a.is_resolved).length}
            </div>
            <p className="text-sm text-red-600">Out of Stock</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-700">
              {alerts.filter((a) => a.alert_type === 'low_stock' && !a.is_resolved).length}
            </div>
            <p className="text-sm text-yellow-600">Low Stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>All Alerts ({alerts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded border ${getAlertColor(alert.alert_type)} ${
                  alert.is_resolved ? 'opacity-50' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-white">
                        {alert.alert_type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        alert.alert_level === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.alert_level.toUpperCase()}
                      </span>
                      {alert.is_resolved && (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                          RESOLVED
                        </span>
                      )}
                    </div>
                    <p className="font-medium mb-1">{alert.message}</p>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="font-medium">Product:</span> {alert.product_name} (
                        {alert.product_sku})
                      </p>
                      <p>
                        <span className="font-medium">Warehouse:</span> {alert.warehouse_name}
                      </p>
                      <p>
                        <span className="font-medium">Current Stock:</span> {parseFloat(alert.current_quantity || '0').toFixed(2)} | 
                        <span className="font-medium"> Reorder Point:</span> {parseFloat(alert.threshold_quantity || '0').toFixed(2)}
                      </p>
                      <p className="text-gray-600">
                        Created: {new Date(alert.created_at).toLocaleString()}
                      </p>
                      {alert.resolved_at && (
                        <p className="text-gray-600">
                          Resolved: {new Date(alert.resolved_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {!alert.is_resolved && (
                    <Button
                      onClick={() => handleResolve(alert.id)}
                      variant="secondary"
                      className="ml-4"
                    >
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                {showResolved ? 'No alerts found' : 'No active alerts'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
