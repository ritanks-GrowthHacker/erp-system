'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/form';
import { getAuthToken } from '@/lib/utils/token';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

interface RFQ {
  id: string;
  rfqNumber: string;
  rfqDate: string;
  deadlineDate: string;
  title: string;
  status: string;
  suppliers: any[];
  lines: any[];
}

interface Product {
  id: string;
  name: string;
  sku: string;
  costPrice: string;
}

interface Supplier {
  id: string;
  name: string;
  code: string;
}

interface RFQLine {
  productId: string;
  productName: string;
  quantityRequested: string;
  targetPrice: string;
  description: string;
}

export default function RFQPage() {
  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sendingRFQ, setSendingRFQ] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [rfqLines, setRFQLines] = useState<RFQLine[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadlineDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchRFQs();
    fetchProducts();
    fetchSuppliers();
  }, []);

  const fetchRFQs = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch('/api/erp/purchasing/rfq', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRFQs(data.rfqs || []);
      }
    } catch (error) {
      console.error('Error fetching RFQs:', error);
    } finally {
      setLoading(false);
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

  const addLineItem = () => {
    setRFQLines([...rfqLines, {
      productId: '',
      productName: '',
      quantityRequested: '1',
      targetPrice: '',
      description: '',
    }]);
  };

  const updateLineItem = (index: number, field: string, value: string) => {
    const updated = [...rfqLines];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        updated[index].productName = product.name;
        updated[index].description = product.name;
        updated[index].targetPrice = product.costPrice || '';
      }
    }
    
    setRFQLines(updated);
  };

  const removeLineItem = (index: number) => {
    setRFQLines(rfqLines.filter((_, i) => i !== index));
  };

  const toggleSupplier = (supplierId: string) => {
    if (selectedSuppliers.includes(supplierId)) {
      setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplierId));
    } else {
      setSelectedSuppliers([...selectedSuppliers, supplierId]);
    }
  };

  const handleCreateRFQ = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || rfqLines.length === 0 || selectedSuppliers.length === 0) {
      alert('Please fill in title, add items, and select at least one supplier');
      return;
    }
    
    try {
      const token = getAuthToken();
      const response = await fetch('/api/erp/purchasing/rfq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          lines: rfqLines.map(line => ({
            productId: line.productId,
            quantityRequested: parseFloat(line.quantityRequested),
            targetPrice: line.targetPrice ? parseFloat(line.targetPrice) : null,
            description: line.description,
          })),
          supplierIds: selectedSuppliers,
        }),
      });

      if (response.ok) {
        alert('RFQ created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchRFQs();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating RFQ:', error);
      alert('Failed to create RFQ');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      deadlineDate: '',
      notes: '',
    });
    setRFQLines([]);
    setSelectedSuppliers([]);
  };

  const handleSendRFQ = async (rfqId: string) => {
    if (!confirm('Send this RFQ to all invited suppliers via email?')) {
      return;
    }

    try {
      setSendingRFQ(rfqId);
      const token = getAuthToken();
      const response = await fetch(`/api/erp/purchasing/rfq/${rfqId}/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchRFQs(); // Refresh to show updated status
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending RFQ:', error);
      alert('Failed to send RFQ');
    } finally {
      setSendingRFQ(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      received: 'bg-green-100 text-green-800',
      closed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request for Quotations (RFQ)</h1>
          <p className="text-gray-600 mt-1">Request quotes from multiple suppliers</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>+ Create RFQ</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">Draft</div>
            <div className="text-2xl font-bold text-gray-600 mt-1">
              {rfqs.filter(r => r.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">Sent</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {rfqs.filter(r => r.status === 'sent').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">In Progress</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {rfqs.filter(r => r.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">Received</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {rfqs.filter(r => r.status === 'received').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RFQ List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Request for Quotations</CardTitle>
            <Input placeholder="Search RFQs..." className="w-64" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading RFQs...
            </div>
          ) : rfqs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No RFQs found. Create your first request for quotation.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RFQ #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Suppliers</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfqs.map((rfq) => (
                  <TableRow key={rfq.id}>
                    <TableCell className="font-medium">{rfq.rfqNumber}</TableCell>
                    <TableCell>{new Date(rfq.rfqDate).toLocaleDateString()}</TableCell>
                    <TableCell>{rfq.title}</TableCell>
                    <TableCell>
                      {rfq.deadlineDate ? new Date(rfq.deadlineDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>{rfq.suppliers?.length || 0}</TableCell>
                    <TableCell>{rfq.lines?.length || 0}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rfq.status)}`}>
                        {rfq.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {rfq.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendRFQ(rfq.id)}
                            disabled={sendingRFQ === rfq.id}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {sendingRFQ === rfq.id ? 'Sending...' : '📧 Send'}
                          </Button>
                        )}
                        {rfq.status === 'sent' && (
                          <span className="text-green-600 text-sm">✓ Sent</span>
                        )}
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create RFQ Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Create Request for Quotation</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateRFQ} className="p-6 space-y-6">
              {/* Header Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g., Office Furniture Request"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder="Describe what you're requesting..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deadline Date
                  </label>
                  <Input
                    type="date"
                    value={formData.deadlineDate}
                    onChange={(e) => setFormData({ ...formData, deadlineDate: e.target.value })}
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
                  <h3 className="text-lg font-semibold">Items Requested</h3>
                  <Button type="button" onClick={addLineItem} variant="secondary">
                    + Add Item
                  </Button>
                </div>

                {rfqLines.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                    No items added. Click "Add Item" to start.
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Target Price (₹)</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {rfqLines.map((line, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3">
                              <select
                                value={line.productId}
                                onChange={(e) => updateLineItem(index, 'productId', e.target.value)}
                                required
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                type="text"
                                value={line.description}
                                onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                className="w-full text-sm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                value={line.quantityRequested}
                                onChange={(e) => updateLineItem(index, 'quantityRequested', e.target.value)}
                                min="0"
                                step="0.01"
                                required
                                className="w-24 text-sm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                value={line.targetPrice}
                                onChange={(e) => updateLineItem(index, 'targetPrice', e.target.value)}
                                min="0"
                                step="0.01"
                                placeholder="Optional"
                                className="w-24 text-sm"
                              />
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

              {/* Suppliers Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Select Suppliers to Invite *</h3>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                  {suppliers.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No suppliers available
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {suppliers.map((supplier) => (
                        <label
                          key={supplier.id}
                          className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSuppliers.includes(supplier.id)}
                            onChange={() => toggleSupplier(supplier.id)}
                            className="w-4 h-4"
                          />
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-xs text-gray-500">{supplier.code}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {selectedSuppliers.length} supplier(s) selected
                </div>
              </div>

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
                  Create RFQ
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
