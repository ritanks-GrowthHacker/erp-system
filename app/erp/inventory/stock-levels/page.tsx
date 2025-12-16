'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAuthToken } from '@/lib/utils/token';

interface StockLevel {
  id: string;
  quantityOnHand: string;
  quantityReserved: string;
  quantityAvailable: string;
  lastCountedAt: string | null;
  product: {
    id: string;
    name: string;
    sku: string;
    reorderPoint: string;
  };
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  location: {
    name: string;
    code: string;
  } | null;
}

export default function StockLevelsPage() {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignForm, setAssignForm] = useState({
    productId: '',
    warehouseId: '',
    quantity: '',
    locationId: '',
  });

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
    fetchStockLevels();
  }, [selectedWarehouse, lowStockOnly]);

  const fetchProducts = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch('/api/erp/inventory/products', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchWarehouses = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch('/api/erp/inventory/warehouses', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setWarehouses(data.warehouses || []);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchStockLevels = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedWarehouse) params.append('warehouseId', selectedWarehouse);
      if (lowStockOnly) params.append('lowStock', 'true');

      const response = await fetch(`/api/erp/inventory/stock-levels?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStockLevels(data.stockLevels || []);
      }
    } catch (error) {
      console.error('Error fetching stock levels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStock = async () => {
    const token = getAuthToken();
    if (!token) return;

    if (!assignForm.productId || !assignForm.warehouseId || !assignForm.quantity) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch('/api/erp/inventory/stock-levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: assignForm.productId,
          warehouseId: assignForm.warehouseId,
          quantityOnHand: assignForm.quantity,
          quantityReserved: '0',
          locationId: assignForm.locationId || null,
        }),
      });

      if (response.ok) {
        setShowAssignForm(false);
        setAssignForm({
          productId: '',
          warehouseId: '',
          quantity: '',
          locationId: '',
        });
        fetchStockLevels();
        alert('Product assigned to warehouse successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to assign product');
      }
    } catch (error) {
      console.error('Error assigning stock:', error);
      alert('Error assigning product to warehouse');
    }
  };

  const getStockStatus = (level: StockLevel) => {
    const available = parseFloat(level.quantityOnHand) - parseFloat(level.quantityReserved);
    const reorderPoint = parseFloat(level.product.reorderPoint || '0');

    if (available <= 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-300' };
    } else if (available <= reorderPoint) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    } else {
      return { label: 'In Stock', color: 'bg-green-100 text-green-800 border-green-300' };
    }
  };

  const filteredStockLevels = stockLevels.filter((level) =>
    level.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    level.product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading stock levels...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Stock Levels</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowAssignForm(true)} variant="primary">
            + Assign Product to Warehouse
          </Button>
          <Button onClick={() => (window.location.href = '/erp/inventory/adjustments')}>
            ✏️ Stock Adjustment
          </Button>
        </div>
      </div>

      {/* Assign Stock Form Modal */}
      {showAssignForm && (
        <Card className="border-blue-500">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Assign Product to Warehouse</CardTitle>
              <Button onClick={() => setShowAssignForm(false)} variant="ghost">
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product*</label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={assignForm.productId}
                  onChange={(e) => setAssignForm({ ...assignForm, productId: e.target.value })}
                >
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Warehouse*</label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={assignForm.warehouseId}
                  onChange={(e) => setAssignForm({ ...assignForm, warehouseId: e.target.value })}
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Initial Quantity*</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded"
                  value={assignForm.quantity}
                  onChange={(e) => setAssignForm({ ...assignForm, quantity: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="md:col-span-2">
                <Button onClick={handleAssignStock} variant="primary">
                  Assign Stock
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Search Products
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                placeholder="Product name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Warehouse</label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
              >
                <option value="">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Show Low Stock Only</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{filteredStockLevels.length}</div>
            <p className="text-sm text-gray-600">Total Items</p>
          </CardContent>
        </Card>

        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-700">
              {
                filteredStockLevels.filter((l) => {
                  const avail = parseFloat(l.quantityOnHand) - parseFloat(l.quantityReserved);
                  return avail > parseFloat(l.product.reorderPoint || '0');
                }).length
              }
            </div>
            <p className="text-sm text-green-600">In Stock</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-700">
              {
                filteredStockLevels.filter((l) => {
                  const avail = parseFloat(l.quantityOnHand) - parseFloat(l.quantityReserved);
                  const reorder = parseFloat(l.product.reorderPoint || '0');
                  return avail > 0 && avail <= reorder;
                }).length
              }
            </div>
            <p className="text-sm text-yellow-600">Low Stock</p>
          </CardContent>
        </Card>

        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-700">
              {
                filteredStockLevels.filter((l) => {
                  const avail = parseFloat(l.quantityOnHand) - parseFloat(l.quantityReserved);
                  return avail <= 0;
                }).length
              }
            </div>
            <p className="text-sm text-red-600">Out of Stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Levels Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Items ({filteredStockLevels.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Product</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">SKU</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Warehouse</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Location</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold">On Hand</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold">Reserved</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold">Available</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold">Reorder Point</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStockLevels.map((level) => {
                  const status = getStockStatus(level);
                  const available = parseFloat(level.quantityOnHand) - parseFloat(level.quantityReserved);
                  const warehouse = level.warehouse as any;
                  
                  return (
                    <tr key={level.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{level.product.name}</td>
                      <td className="px-4 py-2">{level.product.sku}</td>
                      <td className="px-4 py-2">{level.warehouse.name}</td>
                      <td className="px-4 py-2">{level.location?.name || `${warehouse?.city || ''}, ${warehouse?.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '') || 'General'}</td>
                      <td className="px-4 py-2 text-right">{parseFloat(level.quantityOnHand).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">{parseFloat(level.quantityReserved).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {available.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {parseFloat(level.product.reorderPoint).toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs rounded border ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredStockLevels.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No stock levels found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
