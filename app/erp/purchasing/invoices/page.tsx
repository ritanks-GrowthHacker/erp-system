'use client';

import { useState, useEffect } from 'react';
import VendorInvoiceModal from '@/components/modal/VendorInvoiceModal';
import { Input, Textarea } from '@/components/ui/form';
import { getAuthToken } from '@/lib/utils/token';

interface VendorInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: string;
  totalAmount: string;
  amountPaid: string;
  supplier: {
    name: string;
  };
  purchaseOrder?: {
    poNumber: string;
  };
}

interface Supplier {
  id: string;
  name: string;
  code: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  totalAmount: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface InvoiceLine {
  productId: string;
  productName: string;
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
  discountPercentage: string;
  lineTotal: number;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLine[]>([]);
  const [formData, setFormData] = useState({
    supplierId: '',
    purchaseOrderId: '',
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    shippingCharges: '0',
    discountAmount: '0',
    notes: '',
  });

  useEffect(() => {
    fetchInvoices();
    fetchSuppliers();
    fetchPurchaseOrders();
    fetchProducts();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch('/api/erp/purchasing/invoices', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
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

  const fetchPurchaseOrders = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/erp/purchasing/orders', {
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
    setInvoiceLines([...invoiceLines, {
      productId: '',
      productName: '',
      description: '',
      quantity: '1',
      unitPrice: '0',
      taxRate: '0',
      discountPercentage: '0',
      lineTotal: 0,
    }]);
  };

  const updateLineItem = (index: number, field: string, value: string) => {
    const updated = [...invoiceLines];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        updated[index].productName = product.name;
        updated[index].description = product.name;
      }
    }
    
    // Calculate line total: qty * price * (1 - discount/100) * (1 + tax/100)
    const qty = parseFloat(updated[index].quantity) || 0;
    const price = parseFloat(updated[index].unitPrice) || 0;
    const discount = parseFloat(updated[index].discountPercentage) || 0;
    const tax = parseFloat(updated[index].taxRate) || 0;
    const subtotal = qty * price * (1 - discount / 100);
    updated[index].lineTotal = subtotal * (1 + tax / 100);
    
    setInvoiceLines(updated);
  };

  const removeLineItem = (index: number) => {
    setInvoiceLines(invoiceLines.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = invoiceLines.reduce((sum, line) => {
      const qty = parseFloat(line.quantity) || 0;
      const price = parseFloat(line.unitPrice) || 0;
      const discount = parseFloat(line.discountPercentage) || 0;
      return sum + (qty * price * (1 - discount / 100));
    }, 0);
    
    const taxAmount = invoiceLines.reduce((sum, line) => {
      const qty = parseFloat(line.quantity) || 0;
      const price = parseFloat(line.unitPrice) || 0;
      const discount = parseFloat(line.discountPercentage) || 0;
      const tax = parseFloat(line.taxRate) || 0;
      const lineSubtotal = qty * price * (1 - discount / 100);
      return sum + (lineSubtotal * tax / 100);
    }, 0);
    
    const shipping = parseFloat(formData.shippingCharges) || 0;
    const invoiceDiscount = parseFloat(formData.discountAmount) || 0;
    
    return { 
      subtotal, 
      taxAmount, 
      shipping,
      invoiceDiscount,
      total: subtotal + taxAmount + shipping - invoiceDiscount 
    };
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplierId || !formData.invoiceNumber || invoiceLines.length === 0) {
      alert('Please fill in all required fields and add at least one line item');
      return;
    }
    
    try {
      const token = getAuthToken();
      const totals = calculateTotals();
      
      const response = await fetch('/api/erp/purchasing/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          supplierId: formData.supplierId,
          purchaseOrderId: formData.purchaseOrderId || null,
          invoiceNumber: formData.invoiceNumber,
          invoiceDate: formData.invoiceDate,
          dueDate: formData.dueDate,
          shippingCharges: parseFloat(formData.shippingCharges),
          discountAmount: parseFloat(formData.discountAmount),
          notes: formData.notes,
          lines: invoiceLines.map(line => ({
            productId: line.productId,
            description: line.description,
            quantity: parseFloat(line.quantity),
            unitPrice: parseFloat(line.unitPrice),
            taxRate: parseFloat(line.taxRate),
            discountPercentage: parseFloat(line.discountPercentage),
          })),
        }),
      });

      if (response.ok) {
        alert('Invoice created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchInvoices();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    }
  };

  const resetForm = () => {
    setFormData({
      supplierId: '',
      purchaseOrderId: '',
      invoiceNumber: '',
      invoiceDate: '',
      dueDate: '',
      shippingCharges: '0',
      discountAmount: '0',
      notes: '',
    });
    setInvoiceLines([]);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const totals = calculateTotals();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Vendor Invoices</h2>
          <p className="text-sm text-gray-500 mt-1">Manage supplier bills and payments</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          + Record Invoice
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {invoices.filter(i => i.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Approved</div>
          <div className="text-2xl font-bold text-blue-600">
            {invoices.filter(i => i.status === 'approved').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Paid</div>
          <div className="text-2xl font-bold text-green-600">
            {invoices.filter(i => i.status === 'paid').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Overdue</div>
          <div className="text-2xl font-bold text-red-600">
            {invoices.filter(i => i.status === 'overdue').length}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-base font-semibold text-gray-900">Invoices</h3>
          <input placeholder="Search invoices..." className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Loading invoices...
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No invoices found. Record your first invoice.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">PO Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Amount Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.supplier.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.purchaseOrder?.poNumber || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{parseFloat(invoice.totalAmount).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{parseFloat(invoice.amountPaid).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800 font-medium">View</button>
                        <button className="text-green-600 hover:text-green-800 font-medium">Pay</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Vendor Invoice Modal */}
      <VendorInvoiceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchInvoices();
        }}
      />
    </div>
  );
}
