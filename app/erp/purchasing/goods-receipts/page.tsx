'use client';

import { useState, useEffect } from 'react';
import { Input, Textarea } from '@/components/ui/form';
import { getAuthToken } from '@/lib/utils/token';
import ReceiveGoodsModal from '@/components/modal/ReceiveGoodsModal';
import { useAlert } from '@/components/common/CustomAlert';

interface GoodsReceipt {
  id: string;
  receiptNumber: string;
  receipt_number?: string; // For supplier invoice receipts
  receiptDate: string;
  created_at?: string; // For supplier invoice receipts
  receipt_date?: string;
  status: string;
  purchaseOrder?: {
    poNumber: string;
  };
  po_number?: string;
  supplier?: {
    name: string;
  };
  supplier_name?: string;
  warehouse?: {
    name: string;
  };
  warehouse_name?: string;
  invoice_id?: string; // For supplier invoice receipts
  invoice_number?: string;
  receipt_type?: string; // 'purchase_order' or 'supplier_invoice'
  amount?: string;
  payment_method?: string;
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
  const { showAlert } = useAlert();
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
        setReceipts(data.goodsReceipts || []);
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
      showAlert({ type: 'error', title: 'Validation Error', message: 'Please select a purchase order' });
      return;
    }
    
    // Validate quantities
    const invalidLines = receiptLines.filter(line => {
      const received = parseFloat(line.quantityReceived) || 0;
      return received <= 0;
    });
    
    if (invalidLines.length > 0) {
      showAlert({ type: 'error', title: 'Validation Error', message: 'Please enter valid received quantities for all items' });
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
        showAlert({ type: 'success', title: 'Success', message: 'Goods receipt created successfully!' });
        setShowCreateModal(false);
        resetForm();
        fetchReceipts();
      } else {
        const data = await response.json();
        showAlert({ type: 'error', title: 'Error', message: data.error });
      }
    } catch (error) {
      console.error('Error creating goods receipt:', error);
      showAlert({ type: 'error', title: 'Error', message: 'Failed to create goods receipt' });
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Receipts</div>
          <div className="text-2xl font-bold text-gray-900">
            {receipts.length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">PO Receipts</div>
          <div className="text-2xl font-bold text-blue-600">
            {receipts.filter(r => r.receipt_type === 'purchase_order').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Invoice Receipts</div>
          <div className="text-2xl font-bold text-teal-600">
            {receipts.filter(r => r.receipt_type === 'supplier_invoice').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Accepted</div>
          <div className="text-2xl font-bold text-green-600">
            {receipts.filter(r => r.status === 'accepted' || r.status === 'downloaded').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {receipts.filter(r => r.status === 'received' || r.status === 'quality_check' || r.status === 'pending').length}
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
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">PO/Invoice</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Supplier</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Warehouse</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {receipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {receipt.receiptNumber || receipt.receipt_number}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(receipt.receiptDate || receipt.created_at || receipt.receipt_date || '').toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          receipt.receipt_type === 'supplier_invoice' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {receipt.receipt_type === 'supplier_invoice' ? 'Invoice' : 'PO'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {receipt.receipt_type === 'supplier_invoice' 
                          ? (receipt.invoice_number || 'N/A')
                          : (receipt.purchaseOrder?.poNumber || receipt.po_number || 'N/A')}
                        {receipt.invoice_id && (
                          <div className="text-xs text-gray-500">ID: {receipt.invoice_id.substring(0, 8)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {receipt.supplier?.name || receipt.supplier_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {receipt.warehouse?.name || receipt.warehouse_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(receipt.status)}`}>
                          {receipt.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {receipt.receipt_type === 'supplier_invoice' ? (
                            <button 
                              onClick={async () => {
                                const token = getAuthToken();
                                const response = await fetch(`/api/erp/purchasing/receipts/${receipt.id}/download`, {
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                
                                if (response.ok) {
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `Receipt_${receipt.receipt_number}.html`;
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  document.body.removeChild(a);
                                }
                              }}
                              className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                            >
                              Download
                            </button>
                          ) : (
                            <>
                              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">View</button>
                              {receipt.status === 'received' && (
                                <button 
                                  onClick={() => handleAcceptReceipt(receipt.id)}
                                  className="text-sm text-green-600 hover:text-green-800 font-medium"
                                >
                                  Accept/Reject
                                </button>
                              )}
                            </>
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
      <ReceiveGoodsModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchReceipts}
      />

      {/* Accept Receipt Modal */}
      {showAcceptModal && selectedReceipt && (
        <div>Placeholder for accept modal</div>
      )}
    </div>
  );
}
