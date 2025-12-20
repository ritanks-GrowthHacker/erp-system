'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/form';
import { getAuthToken } from '@/lib/utils/token';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { createPortal } from 'react-dom';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  poDate: string;
  status: string;
  totalAmount: string;
  supplier: {
    name: string;
  };
  warehouse: {
    name: string;
  };
}

interface Supplier {
  id: string;
  name: string;
  code: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  costPrice: string;
}

interface POLine {
  productId: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
  lineTotal: number;
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [sendingPO, setSendingPO] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [poLines, setPOLines] = useState<POLine[]>([]);
  const [formData, setFormData] = useState({
    supplierId: '',
    warehouseId: '',
    expectedDeliveryDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchWarehouses();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch('/api/erp/purchasing/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.purchaseOrders || []);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/erp/purchasing/suppliers', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.suppliers || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/erp/inventory/warehouses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data.warehouses || []);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/erp/inventory/products', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addLineItem = () => {
    setPOLines([...poLines, {
      productId: '',
      productName: '',
      quantity: '1',
      unitPrice: '0',
      taxRate: '0',
      lineTotal: 0,
    }]);
  };

  const updateLineItem = (index: number, field: string, value: string) => {
    const updated = [...poLines];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        updated[index].productName = product.name;
        updated[index].unitPrice = product.costPrice || '0';
      }
    }
    
    // Calculate line total
    const qty = parseFloat(updated[index].quantity) || 0;
    const price = parseFloat(updated[index].unitPrice) || 0;
    const tax = parseFloat(updated[index].taxRate) || 0;
    updated[index].lineTotal = qty * price * (1 + tax / 100);
    
    setPOLines(updated);
  };

  const removeLineItem = (index: number) => {
    setPOLines(poLines.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = poLines.reduce((sum, line) => {
      const qty = parseFloat(line.quantity) || 0;
      const price = parseFloat(line.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);
    
    const taxAmount = poLines.reduce((sum, line) => {
      const qty = parseFloat(line.quantity) || 0;
      const price = parseFloat(line.unitPrice) || 0;
      const tax = parseFloat(line.taxRate) || 0;
      return sum + (qty * price * tax / 100);
    }, 0);
    
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplierId || !formData.warehouseId || poLines.length === 0) {
      alert('Please fill in all required fields and add at least one line item');
      return;
    }
    
    try {
      const token = getAuthToken();
      const response = await fetch('/api/erp/purchasing/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          lines: poLines.map(line => ({
            productId: line.productId,
            quantity: parseFloat(line.quantity),
            unitPrice: parseFloat(line.unitPrice),
            taxRate: parseFloat(line.taxRate),
          })),
        }),
      });

      if (response.ok) {
        alert('Purchase Order created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchOrders();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      alert('Failed to create purchase order');
    }
  };

  const resetForm = () => {
    setFormData({
      supplierId: '',
      warehouseId: '',
      expectedDeliveryDate: '',
      notes: '',
    });
    setPOLines([]);
  };

  const handleSendPO = async (orderId: string) => {
    if (!confirm('Send this Purchase Order to the supplier via email?')) {
      return;
    }

    try {
      setSendingPO(orderId);
      const token = getAuthToken();
      const response = await fetch(`/api/erp/purchasing/orders/${orderId}/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Purchase Order sent successfully!');
        fetchOrders(); // Refresh to show updated status
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending purchase order:', error);
      alert('Failed to send purchase order');
    } finally {
      setSendingPO(null);
    }
  };

  const handleViewOrder = async (orderId: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/erp/purchasing/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data);
        setShowViewModal(true);
      } else {
        alert('Failed to load order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Failed to load order details');
    }
  };

  const handleEditOrder = async (orderId: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/erp/purchasing/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data);
        setFormData({
          supplierId: data.supplierId,
          warehouseId: data.warehouseId,
          expectedDeliveryDate: data.expectedDeliveryDate?.split('T')[0] || '',
          notes: data.notes || '',
        });
        setPOLines(
          data.lines.map((line: any) => ({
            productId: line.productId,
            productName: line.productName || line.product?.name,
            quantity: line.quantityOrdered.toString(),
            unitPrice: line.unitPrice.toString(),
            taxRate: line.taxRate?.toString() || '0',
            lineTotal:
              parseFloat(line.quantityOrdered) *
              parseFloat(line.unitPrice) *
              (1 + (parseFloat(line.taxRate || '0') / 100)),
          }))
        );
        setShowEditModal(true);
      } else {
        alert('Failed to load order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Failed to load order details');
    }
  };

  const handleUpdatePO = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplierId || !formData.warehouseId || poLines.length === 0) {
      alert('Please fill in all required fields and add at least one line item');
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/erp/purchasing/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          lines: poLines.map((line) => ({
            productId: line.productId,
            quantity: parseFloat(line.quantity),
            unitPrice: parseFloat(line.unitPrice),
            taxRate: parseFloat(line.taxRate),
          })),
        }),
      });

      if (response.ok) {
        alert('Purchase Order updated successfully!');
        setShowEditModal(false);
        resetForm();
        fetchOrders();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating purchase order:', error);
      alert('Failed to update purchase order');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      partially_received: 'bg-yellow-100 text-yellow-800',
      received: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const totals = calculateTotals();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Purchase Orders</h2>
          <p className="text-sm text-gray-500 mt-1">Manage supplier orders and deliveries</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          + Create Purchase Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Draft</div>
          <div className="text-2xl font-bold text-gray-900">
            {orders.filter(o => o.status === 'draft').length}
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Confirmed</div>
          <div className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.status === 'confirmed').length}
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">In Progress</div>
          <div className="text-2xl font-bold text-blue-600">
            {orders.filter(o => o.status === 'partially_received').length}
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Received</div>
          <div className="text-2xl font-bold text-purple-600">
            {orders.filter(o => o.status === 'received').length}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-base font-semibold text-gray-900">Purchase Orders</h3>
          <input 
            type="text"
            placeholder="Search orders..." 
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
          />
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Loading purchase orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No purchase orders found. Create your first purchase order.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">PO Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Warehouse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.poNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(order.poDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.supplier.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.warehouse.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">₹{order.totalAmount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {order.status === 'draft' && (
                          <button
                            onClick={() => handleSendPO(order.id)}
                            disabled={sendingPO === order.id}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {sendingPO === order.id ? 'Sending...' : 'Send'}
                          </button>
                        )}
                        {order.status === 'sent' && (
                          <span className="text-green-600 text-sm">✓ Sent</span>
                        )}
                        <button
                          onClick={() => handleViewOrder(order.id)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View
                        </button>
                        {(order.status === 'draft' || order.status === 'sent') && (
                          <button
                            onClick={() => handleEditOrder(order.id)}
                            className="text-gray-600 hover:text-gray-700 font-medium"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create PO Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-semibold text-gray-900">Create Purchase Order</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="p-6 space-y-6">
              {/* Header Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier *
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} ({supplier.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warehouse *
                  </label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Delivery Date
                  </label>
                  <Input
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={1}
                  />
                </div>
              </div>

              {/* Line Items Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">Order Items</h3>
                  <Button type="button" onClick={addLineItem} variant="secondary">
                    + Add Item
                  </Button>
                </div>

                {poLines.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                    No items added. Click "Add Item" to start.
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Unit Price (₹)</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tax %</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total (₹)</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {poLines.map((line, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3">
                              <select
                                value={line.productId}
                                onChange={(e) => updateLineItem(index, 'productId', e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Product</option>
                                {products.map((product) => (
                                  <option key={product.id} value={product.id}>
                                    {product.name} ({product.sku})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                value={line.quantity}
                                onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                                min="0"
                                step="0.01"
                                required
                                className="w-24"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                value={line.unitPrice}
                                onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                                min="0"
                                step="0.01"
                                required
                                className="w-28"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                value={line.taxRate}
                                onChange={(e) => updateLineItem(index, 'taxRate', e.target.value)}
                                min="0"
                                step="0.01"
                                className="w-20"
                              />
                            </td>
                            <td className="px-4 py-3 font-medium">
                              {line.lineTotal.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => removeLineItem(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Totals Section */}
              {poLines.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="max-w-md ml-auto space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax Amount:</span>
                      <span className="font-medium">₹{totals.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>₹{totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create Purchase Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View PO Modal */}
      {showViewModal &&
        selectedOrder &&
        typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Purchase Order Details</h2>
                  <p className="text-gray-500 mt-1">PO #{selectedOrder.poNumber}</p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-sm text-gray-500">Supplier</div>
                  <div className="font-medium">{selectedOrder.supplier?.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Warehouse</div>
                  <div className="font-medium">{selectedOrder.warehouse?.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">PO Date</div>
                  <div className="font-medium">
                    {new Date(selectedOrder.poDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Expected Delivery</div>
                  <div className="font-medium">
                    {selectedOrder.expectedDeliveryDate
                      ? new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString()
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Amount</div>
                  <div className="text-xl font-bold text-green-600">
                    ₹{parseFloat(selectedOrder.totalAmount).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mb-6">
                  <div className="text-sm text-gray-500">Notes</div>
                  <div className="font-medium">{selectedOrder.notes}</div>
                </div>
              )}

              {selectedOrder.lines && selectedOrder.lines.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Order Items</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Product</th>
                          <th className="px-4 py-2 text-right text-sm font-semibold">Quantity</th>
                          <th className="px-4 py-2 text-right text-sm font-semibold">Unit Price</th>
                          <th className="px-4 py-2 text-right text-sm font-semibold">Tax %</th>
                          <th className="px-4 py-2 text-right text-sm font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.lines.map((line: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2">
                              {line.product?.name || line.productName || 'N/A'}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {parseFloat(line.quantityOrdered || '0').toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              ₹{parseFloat(line.unitPrice || '0').toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {parseFloat(line.taxRate || '0').toFixed(2)}%
                            </td>
                            <td className="px-4 py-2 text-right font-semibold">
                              ₹
                              {(
                                parseFloat(line.quantityOrdered || '0') *
                                parseFloat(line.unitPrice || '0') *
                                (1 + parseFloat(line.taxRate || '0') / 100)
                              ).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <Button onClick={() => setShowViewModal(false)}>Close</Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Edit PO Modal */}
      {showEditModal &&
        selectedOrder &&
        typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full m-4 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Edit Purchase Order</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdatePO} className="p-6 space-y-6">
                {/* Header Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier *
                    </label>
                    <select
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name} ({supplier.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Warehouse *
                    </label>
                    <select
                      value={formData.warehouseId}
                      onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} ({warehouse.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Delivery Date
                    </label>
                    <Input
                      type="date"
                      value={formData.expectedDeliveryDate}
                      onChange={(e) =>
                        setFormData({ ...formData, expectedDeliveryDate: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={1}
                    />
                  </div>
                </div>

                {/* Line Items Section */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">Order Items</h3>
                    <Button type="button" onClick={addLineItem} variant="secondary">
                      + Add Item
                    </Button>
                  </div>

                  {poLines.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                      No items added. Click "Add Item" to start.
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                              Product
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                              Quantity
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                              Unit Price (₹)
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                              Tax %
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                              Total (₹)
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {poLines.map((line, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3">
                                <select
                                  value={line.productId}
                                  onChange={(e) =>
                                    updateLineItem(index, 'productId', e.target.value)
                                  }
                                  required
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select Product</option>
                                  {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                      {product.name} ({product.sku})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  value={line.quantity}
                                  onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                                  min="0"
                                  step="0.01"
                                  required
                                  className="w-24"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  value={line.unitPrice}
                                  onChange={(e) =>
                                    updateLineItem(index, 'unitPrice', e.target.value)
                                  }
                                  min="0"
                                  step="0.01"
                                  required
                                  className="w-28"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  value={line.taxRate}
                                  onChange={(e) => updateLineItem(index, 'taxRate', e.target.value)}
                                  min="0"
                                  step="0.01"
                                  className="w-20"
                                />
                              </td>
                              <td className="px-4 py-3 font-medium">{line.lineTotal.toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => removeLineItem(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Totals Section */}
                {poLines.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="max-w-md ml-auto space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax Amount:</span>
                        <span className="font-medium">₹{totals.taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total:</span>
                        <span>₹{totals.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Update Purchase Order</Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
