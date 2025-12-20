'use client';

import { useState, useEffect } from 'react';
import { Input, Textarea } from '@/components/ui/form';
import { getAuthToken } from '@/lib/utils/token';

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
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);
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

  const handleViewRFQ = async (rfqId: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/erp/purchasing/rfq/${rfqId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedRFQ(data.rfq);
        setShowViewModal(true);
      } else {
        alert('Failed to fetch RFQ details');
      }
    } catch (error) {
      console.error('Error fetching RFQ:', error);
      alert('Failed to fetch RFQ details');
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
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Request for Quotations (RFQ)</h2>
          <p className="text-sm text-gray-500 mt-1">Request quotes from multiple suppliers</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          + Create RFQ
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Draft</div>
          <div className="text-2xl font-bold text-gray-600">
            {rfqs.filter(r => r.status === 'draft').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Sent</div>
          <div className="text-2xl font-bold text-blue-600">
            {rfqs.filter(r => r.status === 'sent').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">In Progress</div>
          <div className="text-2xl font-bold text-yellow-600">
            {rfqs.filter(r => r.status === 'in_progress').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Received</div>
          <div className="text-2xl font-bold text-green-600">
            {rfqs.filter(r => r.status === 'received').length}
          </div>
        </div>
      </div>

      {/* RFQ Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-base font-semibold text-gray-900">Request for Quotations</h3>
          <input placeholder="Search RFQs..." className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Loading RFQs...
            </div>
          ) : rfqs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No RFQs found. Create your first request for quotation.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">RFQ #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Suppliers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rfqs.map((rfq) => (
                  <tr key={rfq.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rfq.rfqNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(rfq.rfqDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rfq.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rfq.deadlineDate ? new Date(rfq.deadlineDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rfq.suppliers?.length || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rfq.lines?.length || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rfq.status)}`}>
                        {rfq.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2 items-center">
                        {rfq.status === 'draft' && (
                          <button
                            onClick={() => handleSendRFQ(rfq.id)}
                            disabled={sendingRFQ === rfq.id}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {sendingRFQ === rfq.id ? 'Sending...' : '📧 Send'}
                          </button>
                        )}
                        {rfq.status === 'sent' && (
                          <span className="text-green-600 text-sm flex items-center">✓ Sent</span>
                        )}
                        <button onClick={() => handleViewRFQ(rfq.id)} className="text-blue-600 hover:text-blue-800 font-medium">View</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* View RFQ Modal */}
      {showViewModal && selectedRFQ && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-semibold text-gray-900">RFQ Details: {selectedRFQ.rfqNumber}</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header Information */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <div className="text-sm text-gray-500">RFQ Number</div>
                  <div className="font-semibold">{selectedRFQ.rfqNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRFQ.status)}`}>
                    {selectedRFQ.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-500">RFQ Date</div>
                  <div className="font-semibold">{new Date(selectedRFQ.rfqDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Deadline</div>
                  <div className="font-semibold">
                    {selectedRFQ.deadlineDate ? new Date(selectedRFQ.deadlineDate).toLocaleDateString() : '—'}
                  </div>
                </div>
              </div>

              {/* Title and Description */}
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedRFQ.title}</h3>
                {selectedRFQ.description && (
                  <p className="text-gray-600">{selectedRFQ.description}</p>
                )}
              </div>

              {/* Line Items */}
              <div>
                <h4 className="font-semibold mb-3">Requested Items</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">#</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Quantity</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Target Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedRFQ.lines && selectedRFQ.lines.map((line: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm">{index + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium">{line.product?.name || 'Unknown'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{line.description || '—'}</td>
                          <td className="px-4 py-3 text-sm text-right">{parseFloat(line.quantityRequested).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            {line.targetPrice ? `₹${parseFloat(line.targetPrice).toLocaleString('en-IN')}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invited Suppliers */}
              <div>
                <h4 className="font-semibold mb-3">Invited Suppliers ({selectedRFQ.suppliers?.length || 0})</h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedRFQ.suppliers && selectedRFQ.suppliers.map((supplier: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="font-medium">{supplier.supplier?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{supplier.supplier?.code || '—'}</div>
                      <div className="text-sm text-gray-600 mt-1">{supplier.supplier?.email || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedRFQ.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded">{selectedRFQ.notes}</p>
                </div>
              )}
            </div>

            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <button 
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create RFQ Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-semibold text-gray-900">Create Request for Quotation</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
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
                  <button 
                    type="button" 
                    onClick={addLineItem}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors text-sm"
                  >
                    + Add Item
                  </button>
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
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Create RFQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
