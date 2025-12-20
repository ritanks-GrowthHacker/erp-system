'use client';

import { useState, useEffect } from 'react';
import { Input, Textarea } from '@/components/ui/form';
import { getAuthToken } from '@/lib/utils/token';

interface GoodsReceipt {
  id: string;
  receiptNumber: string;
  receiptDate: string;
  status: string;
  purchaseOrder: {
    poNumber: string;
  };
  supplier: {
    name: string;
  };
  warehouse: {
    name: string;
  };
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: {
    id: string;
    name: string;
  };
  warehouse: {
    id: string;
    name: string;
  };
  lines: POLine[];
}

interface POLine {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  quantityOrdered: string;
  quantityReceived: string;
}

interface ReceiptLine {
  purchaseOrderLineId: string;
  productId: string;
  productName: string;
  quantityOrdered: number;
  quantityAlreadyReceived: number;
  quantityReceived: string;
  quantityAccepted: string;
  quantityRejected: string;
  rejectionReason: string;
  warehouseLocationId: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface WarehouseLocation {
  id: string;
  name: string;
  code: string;
}

export default function GoodsReceiptsPage() {
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseLocations, setWarehouseLocations] = useState<WarehouseLocation[]>([]);
  const [receiptLines, setReceiptLines] = useState<ReceiptLine[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [formData, setFormData] = useState({
    purchaseOrderId: '',
    warehouseId: '',
    deliveryNoteNumber: '',
    vehicleNumber: '',
    driverName: '',
    notes: '',
  });

  useEffect(() => {
    fetchReceipts();
    fetchPurchaseOrders();
    fetchWarehouses();
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch('/api/erp/purchasing/goods-receipts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReceipts(data.receipts || []);
      }
    } catch (error) {
      console.error('Error fetching goods receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/erp/purchasing/orders?status=confirmed', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPurchaseOrders(data.purchaseOrders || []);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
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

  const fetchWarehouseLocations = async (warehouseId: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/erp/inventory/warehouses/${warehouseId}/locations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWarehouseLocations(data.locations || []);
      }
    } catch (error) {
      console.error('Error fetching warehouse locations:', error);
    }
  };

  const handlePOSelection = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    setSelectedPO(po || null);
    
    if (po) {
      setFormData({
        ...formData,
        purchaseOrderId: poId,
        warehouseId: po.warehouse.id,
      });
      
      // Initialize receipt lines from PO lines
      const lines: ReceiptLine[] = po.lines.map(line => ({
        purchaseOrderLineId: line.id,
        productId: line.product.id,
        productName: line.product.name,
        quantityOrdered: parseFloat(line.quantityOrdered),
        quantityAlreadyReceived: parseFloat(line.quantityReceived || '0'),
        quantityReceived: (parseFloat(line.quantityOrdered) - parseFloat(line.quantityReceived || '0')).toString(),
        quantityAccepted: '0',
        quantityRejected: '0',
        rejectionReason: '',
        warehouseLocationId: '',
      }));
      setReceiptLines(lines);
      
      // Fetch warehouse locations
      fetchWarehouseLocations(po.warehouse.id);
    }
  };

  const updateReceiptLine = (index: number, field: string, value: string) => {
    const updated = [...receiptLines];
    updated[index] = { ...updated[index], [field]: value };
    setReceiptLines(updated);
  };

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.purchaseOrderId || receiptLines.length === 0) {
      alert('Please select a purchase order');
      return;
    }
    
    // Validate quantities
    const invalidLines = receiptLines.filter(line => {
      const received = parseFloat(line.quantityReceived) || 0;
      return received <= 0;
    });
    
    if (invalidLines.length > 0) {
      alert('Please enter valid received quantities for all items');
      return;
    }
    
    try {
      const token = getAuthToken();
      const response = await fetch('/api/erp/purchasing/goods-receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          purchaseOrderId: formData.purchaseOrderId,
          warehouseId: formData.warehouseId,
          deliveryNoteNumber: formData.deliveryNoteNumber,
          vehicleNumber: formData.vehicleNumber,
          driverName: formData.driverName,
          notes: formData.notes,
          lines: receiptLines.map(line => ({
            purchaseOrderLineId: line.purchaseOrderLineId,
            productId: line.productId,
            warehouseLocationId: line.warehouseLocationId || null,
            quantityOrdered: line.quantityOrdered,
            quantityReceived: parseFloat(line.quantityReceived),
          })),
        }),
      });

      if (response.ok) {
        alert('Goods receipt created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchReceipts();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating goods receipt:', error);
      alert('Failed to create goods receipt');
    }
  };

  const handleAcceptReceipt = async (receiptId: string) => {
    // Fetch receipt details first
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/erp/purchasing/goods-receipts?id=${receiptId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const receipt = data.receipts[0];
        setSelectedReceipt(receipt);
        
        // Initialize acceptance lines
        const lines: ReceiptLine[] = receipt.lines?.map((line: any) => ({
          purchaseOrderLineId: line.purchaseOrderLineId,
          productId: line.product.id,
          productName: line.product.name,
          quantityOrdered: parseFloat(line.quantityOrdered),
          quantityAlreadyReceived: 0,
          quantityReceived: line.quantityReceived,
          quantityAccepted: line.quantityReceived,
          quantityRejected: '0',
          rejectionReason: '',
          warehouseLocationId: line.warehouseLocationId || '',
        })) || [];
        
        setReceiptLines(lines);
        setShowAcceptModal(true);
      }
    } catch (error) {
      console.error('Error fetching receipt details:', error);
    }
  };

  const handleUpdateAcceptance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReceipt) return;
    
    // Update acceptance quantities in lines
    const updatedLines = receiptLines.map(line => ({
      purchaseOrderLineId: line.purchaseOrderLineId,
      quantityAccepted: parseFloat(line.quantityAccepted) || 0,
      quantityRejected: parseFloat(line.quantityRejected) || 0,
      rejectionReason: line.rejectionReason,
      warehouseLocationId: line.warehouseLocationId || null,
    }));
    
    try {
      const token = getAuthToken();
      const response = await fetch('/api/erp/purchasing/goods-receipts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiptId: selectedReceipt.id,
          status: 'accepted',
          lines: updatedLines,
        }),
      });

      if (response.ok) {
        alert('Goods receipt accepted! Stock levels have been updated.');
        setShowAcceptModal(false);
        setSelectedReceipt(null);
        fetchReceipts();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error accepting receipt:', error);
      alert('Failed to accept receipt');
    }
  };

  const resetForm = () => {
    setFormData({
      purchaseOrderId: '',
      warehouseId: '',
      deliveryNoteNumber: '',
      vehicleNumber: '',
      driverName: '',
      notes: '',
    });
    setReceiptLines([]);
    setSelectedPO(null);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      received: 'bg-blue-100 text-blue-800',
      quality_check: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      partially_accepted: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goods Receipts</h1>
          <p className="text-gray-600 mt-1">Receive and quality check incoming inventory</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          + Receive Goods
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Received</div>
          <div className="text-2xl font-bold text-blue-600">
            {receipts.filter(r => r.status === 'received').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Quality Check</div>
          <div className="text-2xl font-bold text-yellow-600">
            {receipts.filter(r => r.status === 'quality_check').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Accepted</div>
          <div className="text-2xl font-bold text-green-600">
            {receipts.filter(r => r.status === 'accepted').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Rejected</div>
          <div className="text-2xl font-bold text-red-600">
            {receipts.filter(r => r.status === 'rejected').length}
          </div>
        </div>
      </div>

      {/* Receipts List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Goods Receipts</h2>
            <Input placeholder="Search receipts..." className="w-64" />
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading goods receipts...
            </div>
          ) : receipts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No receipts found. Receive goods from purchase orders.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Receipt #</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">PO Number</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Supplier</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Warehouse</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {receipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{receipt.receiptNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(receipt.receiptDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-600">{receipt.purchaseOrder.poNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{receipt.supplier.name}</td>
                      <td className="px-4 py-3 text-gray-600">{receipt.warehouse.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(receipt.status)}`}>
                          {receipt.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">View</button>
                          {receipt.status === 'received' && (
                            <button 
                              onClick={() => handleAcceptReceipt(receipt.id)}
                              className="text-sm text-green-600 hover:text-green-800 font-medium"
                            >
                              Accept/Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Receipt Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Receive Goods</h2>
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

            <form onSubmit={handleCreateReceipt} className="p-6 space-y-6">
              {/* Header Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Order *
                  </label>
                  <select
                    value={formData.purchaseOrderId}
                    onChange={(e) => handlePOSelection(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Purchase Order</option>
                    {purchaseOrders.map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.poNumber} - {po.supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warehouse
                  </label>
                  <Input
                    type="text"
                    value={selectedPO?.warehouse.name || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Note Number
                  </label>
                  <Input
                    type="text"
                    value={formData.deliveryNoteNumber}
                    onChange={(e) => setFormData({ ...formData, deliveryNoteNumber: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Number
                  </label>
                  <Input
                    type="text"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Driver Name
                  </label>
                  <Input
                    type="text"
                    value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
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

              {/* Receipt Items */}
              {receiptLines.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Items to Receive</h3>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ordered</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Already Received</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Qty Receiving</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {receiptLines.map((line, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 font-medium">{line.productName}</td>
                            <td className="px-4 py-3">{line.quantityOrdered}</td>
                            <td className="px-4 py-3">{line.quantityAlreadyReceived}</td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                value={line.quantityReceived}
                                onChange={(e) => updateReceiptLine(index, 'quantityReceived', e.target.value)}
                                min="0"
                                step="0.01"
                                required
                                className="w-24"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={line.warehouseLocationId}
                                onChange={(e) => updateReceiptLine(index, 'warehouseLocationId', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Default</option>
                                {warehouseLocations.map((location) => (
                                  <option key={location.id} value={location.id}>
                                    {location.name} ({location.code})
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Receive Goods
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accept/Reject Modal */}
      {showAcceptModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Quality Check - {selectedReceipt.receiptNumber}</h2>
              <button
                onClick={() => {
                  setShowAcceptModal(false);
                  setSelectedReceipt(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateAcceptance} className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Accept/Reject Items</h3>
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Received</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Accepted</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rejected</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rejection Reason</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {receiptLines.map((line, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 font-medium">{line.productName}</td>
                          <td className="px-4 py-3">{line.quantityReceived}</td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              value={line.quantityAccepted}
                              onChange={(e) => {
                                updateReceiptLine(index, 'quantityAccepted', e.target.value);
                                const accepted = parseFloat(e.target.value) || 0;
                                const received = parseFloat(line.quantityReceived.toString());
                                const rejected = received - accepted;
                                updateReceiptLine(index, 'quantityRejected', rejected.toString());
                              }}
                              min="0"
                              max={line.quantityReceived.toString()}
                              step="0.01"
                              required
                              className="w-24"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              value={line.quantityRejected}
                              onChange={(e) => {
                                updateReceiptLine(index, 'quantityRejected', e.target.value);
                                const rejected = parseFloat(e.target.value) || 0;
                                const received = parseFloat(line.quantityReceived.toString());
                                const accepted = received - rejected;
                                updateReceiptLine(index, 'quantityAccepted', accepted.toString());
                              }}
                              min="0"
                              max={line.quantityReceived.toString()}
                              step="0.01"
                              className="w-24"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="text"
                              value={line.rejectionReason}
                              onChange={(e) => updateReceiptLine(index, 'rejectionReason', e.target.value)}
                              placeholder="If rejected..."
                              className="w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={line.warehouseLocationId}
                              onChange={(e) => updateReceiptLine(index, 'warehouseLocationId', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Default</option>
                              {warehouseLocations.map((location) => (
                                <option key={location.id} value={location.id}>
                                  {location.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Accepting this receipt will automatically update stock levels in the warehouse for accepted quantities.
                </p>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAcceptModal(false);
                    setSelectedReceipt(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Accept Receipt & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
