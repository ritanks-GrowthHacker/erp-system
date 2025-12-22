'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/utils/token';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
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

  // Pagination
  const totalPages = Math.ceil(filteredStockLevels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStockLevels = filteredStockLevels.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
          <button
            onClick={() => setShowAssignForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            + Assign Product to Warehouse
          </button>
          <button
            onClick={() => (window.location.href = '/erp/inventory/adjustments')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
          >
            ✏️ Stock Adjustment
          </button>
        </div>
      </div>

      {/* Assign Stock Form Modal */}
      {showAssignForm && (
        <div className="bg-white rounded-xl border-2 border-blue-500 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900">Assign Product to Warehouse</h3>
              <button
                onClick={() => setShowAssignForm(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="p-6">
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
                <button
                  onClick={handleAssignStock}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Assign Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
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
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden p-6">
          <div className="text-2xl font-bold">{filteredStockLevels.length}</div>
          <p className="text-sm text-gray-600">Total Items</p>
        </div>

        <div className="bg-green-50 rounded-xl border border-green-300 overflow-hidden p-6">
          <div className="text-2xl font-bold text-green-700">
            {
              filteredStockLevels.filter((l) => {
                const avail = parseFloat(l.quantityOnHand) - parseFloat(l.quantityReserved);
                return avail > parseFloat(l.product.reorderPoint || '0');
              }).length
            }
          </div>
          <p className="text-sm text-green-600">In Stock</p>
        </div>

        <div className="bg-yellow-50 rounded-xl border border-yellow-300 overflow-hidden p-6">
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
        </div>

        <div className="bg-red-50 rounded-xl border border-red-300 overflow-hidden p-6">
          <div className="text-2xl font-bold text-red-700">
            {
              filteredStockLevels.filter((l) => {
                const avail = parseFloat(l.quantityOnHand) - parseFloat(l.quantityReserved);
                return avail <= 0;
              }).length
            }
          </div>
          <p className="text-sm text-red-600">Out of Stock</p>
        </div>
      </div>

      {/* Stock Levels Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Available Qty</TableHead>
                <TableHead className="text-right">Reserved Qty</TableHead>
                <TableHead className="text-right">Total Qty</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStockLevels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No stock levels found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStockLevels.map((level) => {
                  const status = getStockStatus(level);
                  const available = parseFloat(level.quantityOnHand) - parseFloat(level.quantityReserved);
                  
                  return (
                    <TableRow key={level.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium">{level.product.name}</TableCell>
                      <TableCell>{level.product.sku}</TableCell>
                      <TableCell>{level.warehouse.name}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {available.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">{parseFloat(level.quantityReserved).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{parseFloat(level.quantityOnHand).toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded border ${status.color}`}>
                          {status.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {filteredStockLevels.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredStockLevels.length)} of {filteredStockLevels.length} items
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
