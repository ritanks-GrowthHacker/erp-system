'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

interface Supplier {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  taxId: string;
  paymentTerms: number;
  currencyCode: string;
  isActive: boolean;
  notes: string;
  createdAt: string;
  contacts?: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    position: string;
    isPrimary: boolean;
  }>;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  poDate: string;
  status: string;
  totalAmount: string;
  expectedDeliveryDate: string;
  lines: any[];
}

interface RFQ {
  id: string;
  rfqNumber: string;
  rfqDate: string;
  title: string;
  status: string;
  deadlineDate: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: string;
  status: string;
}

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params?.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'pos' | 'rfqs' | 'invoices'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [showPOModal, setShowPOModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showRFQModal, setShowRFQModal] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);

  useEffect(() => {
    if (supplierId) {
      fetchSupplierDetails();
    }
  }, [supplierId]);

  const fetchSupplierDetails = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch(`/api/erp/purchasing/suppliers/${supplierId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSupplier(data.supplier);
        setPurchaseOrders(data.purchaseOrders || []);
        setRfqs(data.rfqs || []);
        setInvoices(data.invoices || []);
        setStatistics(data.statistics);
      } else {
        alert('Failed to fetch supplier details');
      }
    } catch (error) {
      console.error('Failed to fetch supplier details:', error);
      alert('Failed to fetch supplier details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    if (supplier) {
      setEditFormData({
        name: supplier.name,
        code: supplier.code,
        email: supplier.email,
        phone: supplier.phone,
        website: supplier.website,
        address: supplier.address,
        city: supplier.city,
        state: supplier.state,
        country: supplier.country,
        postalCode: supplier.postalCode,
        taxId: supplier.taxId,
        paymentTerms: supplier.paymentTerms,
        currencyCode: supplier.currencyCode,
        notes: supplier.notes,
        isActive: supplier.isActive,
      });
      setShowEditModal(true);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/erp/purchasing/suppliers/${supplierId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchSupplierDetails();
        alert('Supplier updated successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update supplier');
      }
    } catch (error) {
      console.error('Failed to update supplier:', error);
      alert('Failed to update supplier');
    }
  };

  const handleViewPO = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setShowPOModal(true);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const handleViewRFQ = (rfq: RFQ) => {
    setSelectedRFQ(rfq);
    setShowRFQModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      confirmed: 'bg-blue-100 text-blue-800',
      partially_received: 'bg-yellow-100 text-yellow-800',
      received: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      in_progress: 'bg-purple-100 text-purple-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading supplier details...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Supplier not found</p>
          <Button onClick={() => router.push('/erp/purchasing/suppliers')}>
            Back to Suppliers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push('/erp/purchasing/suppliers')}
            >
              ← Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{supplier.name}</h1>
              <p className="text-gray-500 mt-1">Supplier Code: {supplier.code}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleEditClick}>
            ✏️ Edit
          </Button>
          <span
            className={`px-3 py-2 rounded-full text-sm font-medium ${
              supplier.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {supplier.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {statistics?.totalPurchaseOrders || 0}
            </div>
            <div className="text-sm text-gray-500">Total Purchase Orders</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {statistics?.pendingPurchaseOrders || 0}
            </div>
            <div className="text-sm text-gray-500">Pending POs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {statistics?.totalRFQs || 0}
            </div>
            <div className="text-sm text-gray-500">RFQs Sent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              ₹{parseFloat(statistics?.totalPurchaseValue || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-sm text-gray-500">Total Purchase Value</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('pos')}
            className={`pb-3 px-1 font-medium text-sm ${
              activeTab === 'pos'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Purchase Orders ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('rfqs')}
            className={`pb-3 px-1 font-medium text-sm ${
              activeTab === 'rfqs'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            RFQs ({rfqs.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-3 px-1 font-medium text-sm ${
              activeTab === 'invoices'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Invoices ({invoices.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium">{supplier.email || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <div className="font-medium">{supplier.phone || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Website</div>
                <div className="font-medium">{supplier.website || '—'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Street Address</div>
                <div className="font-medium">{supplier.address || '—'}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-gray-500">City</div>
                  <div className="font-medium">{supplier.city || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">State</div>
                  <div className="font-medium">{supplier.state || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Country</div>
                  <div className="font-medium">{supplier.country || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Postal Code</div>
                  <div className="font-medium">{supplier.postalCode || '—'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Tax ID / GST</div>
                <div className="font-medium">{supplier.taxId || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Payment Terms</div>
                <div className="font-medium">{supplier.paymentTerms} days</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Currency</div>
                <div className="font-medium">{supplier.currencyCode}</div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Persons */}
          {supplier.contacts && supplier.contacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Persons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supplier.contacts.map((contact) => (
                    <div key={contact.id} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-sm text-gray-500">{contact.position}</div>
                        </div>
                        {contact.isPrimary && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {contact.email} • {contact.phone}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {supplier.notes && (
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{supplier.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'pos' && (
        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {purchaseOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No purchase orders found for this supplier.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow
                      key={po.id}
                      onClick={() => handleViewPO(po)}
                      className="cursor-pointer hover:bg-gray-100"
                    >
                      <TableCell className="font-medium">{po.poNumber}</TableCell>
                      <TableCell>{new Date(po.poDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {po.expectedDeliveryDate
                          ? new Date(po.expectedDeliveryDate).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell>{po.lines?.length || 0}</TableCell>
                      <TableCell className="font-medium">
                        ₹{parseFloat(po.totalAmount).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            po.status
                          )}`}
                        >
                          {po.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'rfqs' && (
        <Card>
          <CardHeader>
            <CardTitle>Request for Quotations</CardTitle>
          </CardHeader>
          <CardContent>
            {rfqs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No RFQs sent to this supplier.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RFQ Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfqs.map((rfq) => (
                    <TableRow
                      key={rfq.id}
                      onClick={() => handleViewRFQ(rfq)}
                      className="cursor-pointer hover:bg-gray-100"
                    >
                      <TableCell className="font-medium">{rfq.rfqNumber}</TableCell>
                      <TableCell>{new Date(rfq.rfqDate).toLocaleDateString()}</TableCell>
                      <TableCell>{rfq.title}</TableCell>
                      <TableCell>
                        {rfq.deadlineDate
                          ? new Date(rfq.deadlineDate).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            rfq.status
                          )}`}
                        >
                          {rfq.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'invoices' && (
        <Card>
          <CardHeader>
            <CardTitle>Purchase Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No invoices found for this supplier.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      onClick={() => handleViewInvoice(invoice)}
                      className="cursor-pointer hover:bg-gray-100"
                    >
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">
                        ₹{parseFloat(invoice.totalAmount).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            invoice.status
                          )}`}
                        >
                          {invoice.status.toUpperCase()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Purchase Order Modal */}
      {showPOModal &&
        selectedPO &&
        typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Purchase Order Details</h2>
                  <p className="text-gray-500 mt-1">PO #{selectedPO.poNumber}</p>
                </div>
                <button
                  onClick={() => setShowPOModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-sm text-gray-500">PO Date</div>
                  <div className="font-medium">{new Date(selectedPO.poDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Expected Delivery</div>
                  <div className="font-medium">
                    {selectedPO.expectedDeliveryDate
                      ? new Date(selectedPO.expectedDeliveryDate).toLocaleDateString()
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      selectedPO.status
                    )}`}
                  >
                    {selectedPO.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Amount</div>
                  <div className="text-xl font-bold text-green-600">
                    ₹{parseFloat(selectedPO.totalAmount).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {selectedPO.lines && selectedPO.lines.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Order Items</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Product</th>
                          <th className="px-4 py-2 text-right text-sm font-semibold">Quantity</th>
                          <th className="px-4 py-2 text-right text-sm font-semibold">Unit Price</th>
                          <th className="px-4 py-2 text-right text-sm font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedPO.lines.map((line: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2">{line.productName || line.product_name || 'N/A'}</td>
                            <td className="px-4 py-2 text-right">
                              {parseFloat(line.quantityOrdered || line.quantity_ordered || '0').toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              ₹{parseFloat(line.unitPrice || line.unit_price || '0').toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold">
                              ₹
                              {(
                                parseFloat(line.quantityOrdered || line.quantity_ordered || '0') *
                                parseFloat(line.unitPrice || line.unit_price || '0')
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
                <Button onClick={() => setShowPOModal(false)}>Close</Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Invoice Modal */}
      {showInvoiceModal &&
        selectedInvoice &&
        typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Invoice Details</h2>
                  <p className="text-gray-500 mt-1">Invoice #{selectedInvoice.invoiceNumber}</p>
                </div>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-sm text-gray-500">Invoice Date</div>
                  <div className="font-medium">
                    {new Date(selectedInvoice.invoiceDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Due Date</div>
                  <div className="font-medium">
                    {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      selectedInvoice.status
                    )}`}
                  >
                    {selectedInvoice.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Amount</div>
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{parseFloat(selectedInvoice.totalAmount).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2">Payment Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium">
                      {selectedInvoice.status === 'paid' ? '✅ Paid' : '⏳ Pending Payment'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days Until Due</span>
                    <span className="font-medium">
                      {Math.ceil(
                        (new Date(selectedInvoice.dueDate).getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{' '}
                      days
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={() => setShowInvoiceModal(false)}>Close</Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* RFQ Modal */}
      {showRFQModal &&
        selectedRFQ &&
        typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Request for Quotation Details</h2>
                  <p className="text-gray-500 mt-1">RFQ #{selectedRFQ.rfqNumber}</p>
                </div>
                <button
                  onClick={() => setShowRFQModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-sm text-gray-500">RFQ Date</div>
                  <div className="font-medium">{new Date(selectedRFQ.rfqDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Deadline</div>
                  <div className="font-medium">
                    {selectedRFQ.deadlineDate
                      ? new Date(selectedRFQ.deadlineDate).toLocaleDateString()
                      : '—'}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-gray-500">Title</div>
                  <div className="font-medium text-lg">{selectedRFQ.title}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      selectedRFQ.status
                    )}`}
                  >
                    {selectedRFQ.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-semibold mb-2">RFQ Progress</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium">
                      {selectedRFQ.status === 'sent'
                        ? '📤 Sent to Supplier'
                        : selectedRFQ.status === 'received'
                        ? '✅ Quotation Received'
                        : selectedRFQ.status === 'in_progress'
                        ? '🔄 In Progress'
                        : selectedRFQ.status === 'closed'
                        ? '🔒 Closed'
                        : '📝 Draft'}
                    </span>
                  </div>
                  {selectedRFQ.deadlineDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days Until Deadline</span>
                      <span className="font-medium">
                        {Math.ceil(
                          (new Date(selectedRFQ.deadlineDate).getTime() - new Date().getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{' '}
                        days
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={() => setShowRFQModal(false)}>Close</Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Edit Modal */}
      {showEditModal &&
        editFormData &&
        typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Edit Supplier</h2>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                {/* Basic Information */}
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-3">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Supplier Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editFormData.name}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Supplier Code</label>
                      <input
                        type="text"
                        value={editFormData.code}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, code: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <input
                        type="text"
                        value={editFormData.phone}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, phone: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Website</label>
                      <input
                        type="text"
                        value={editFormData.website}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, website: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-3">Address</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Street Address</label>
                      <textarea
                        value={editFormData.address}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, address: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">City</label>
                        <input
                          type="text"
                          value={editFormData.city}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, city: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">State</label>
                        <input
                          type="text"
                          value={editFormData.state}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, state: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Country</label>
                        <input
                          type="text"
                          value={editFormData.country}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, country: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Postal Code</label>
                        <input
                          type="text"
                          value={editFormData.postalCode}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, postalCode: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial */}
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-3">Financial Information</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tax ID / GST</label>
                      <input
                        type="text"
                        value={editFormData.taxId}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, taxId: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Payment Terms (days)</label>
                      <input
                        type="number"
                        value={editFormData.paymentTerms}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            paymentTerms: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Currency</label>
                      <select
                        value={editFormData.currencyCode}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, currencyCode: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Status and Notes */}
                <div>
                  <div className="mb-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editFormData.isActive}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, isActive: e.target.checked })
                        }
                      />
                      <span className="text-sm font-medium">Active Supplier</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      value={editFormData.notes}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, notes: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
