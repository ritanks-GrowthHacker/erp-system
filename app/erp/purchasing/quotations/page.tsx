'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/form';
import { getAuthToken } from '@/lib/utils/token';
import Link from 'next/link';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

interface Quotation {
  id: string;
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
  status: string;
  totalAmount: string;
  deliveryTime: number;
  supplier: {
    name: string;
  };
  rfq?: {
    rfqNumber: string;
    title: string;
  };
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch('/api/erp/purchasing/quotations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQuotations(data.quotations || []);
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuotation = async (quotationId: string) => {
    if (!confirm('Accept this quotation?')) return;
    
    try {
      const token = getAuthToken();
      const response = await fetch('/api/erp/purchasing/quotations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quotationId,
          status: 'accepted',
        }),
      });

      if (response.ok) {
        alert('Quotation accepted successfully!');
        fetchQuotations();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error accepting quotation:', error);
      alert('Failed to accept quotation');
    }
  };

  const handleRejectQuotation = async (quotationId: string) => {
    if (!confirm('Reject this quotation?')) return;
    
    try {
      const token = getAuthToken();
      const response = await fetch('/api/erp/purchasing/quotations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quotationId,
          status: 'rejected',
        }),
      });

      if (response.ok) {
        alert('Quotation rejected');
        fetchQuotations();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error rejecting quotation:', error);
      alert('Failed to reject quotation');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Quotations</h1>
          <p className="text-gray-600 mt-1">Review and compare supplier quotes</p>
        </div>
        <Link href="/erp/purchasing/rfq">
          <Button variant="secondary">View RFQs</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">Submitted</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {quotations.filter(q => q.status === 'submitted').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">Under Review</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {quotations.filter(q => q.status === 'under_review').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">Accepted</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {quotations.filter(q => q.status === 'accepted').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">Rejected</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {quotations.filter(q => q.status === 'rejected').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">Expired</div>
            <div className="text-2xl font-bold text-gray-600 mt-1">
              {quotations.filter(q => q.status === 'expired').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotations List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Quotations</CardTitle>
            <Input placeholder="Search quotations..." className="w-64" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading quotations...
            </div>
          ) : quotations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No quotations found. Suppliers will submit quotes in response to RFQs.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>RFQ Reference</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Delivery Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell className="font-medium">{quotation.quotationNumber}</TableCell>
                    <TableCell>{new Date(quotation.quotationDate).toLocaleDateString()}</TableCell>
                    <TableCell>{quotation.supplier.name}</TableCell>
                    <TableCell>
                      {quotation.rfq ? (
                        <div>
                          <div className="font-medium">{quotation.rfq.rfqNumber}</div>
                          <div className="text-xs text-gray-500">{quotation.rfq.title}</div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="font-semibold">₹{parseFloat(quotation.totalAmount).toFixed(2)}</TableCell>
                    <TableCell>{quotation.deliveryTime ? `${quotation.deliveryTime} days` : '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quotation.status)}`}>
                        {quotation.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">View</Button>
                        {quotation.status === 'submitted' || quotation.status === 'under_review' ? (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleAcceptQuotation(quotation.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              Accept
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleRejectQuotation(quotation.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Reject
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Comparison Section */}
      {quotations.filter(q => q.status === 'submitted' || q.status === 'under_review').length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Compare Quotations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {quotations
                .filter(q => q.status === 'submitted' || q.status === 'under_review')
                .slice(0, 3)
                .map((quotation) => (
                  <div key={quotation.id} className="border rounded-lg p-4">
                    <div className="font-semibold text-lg mb-2">{quotation.supplier.name}</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-semibold">₹{parseFloat(quotation.totalAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery:</span>
                        <span>{quotation.deliveryTime || '-'} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valid Until:</span>
                        <span>
                          {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleAcceptQuotation(quotation.id)}
                      >
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="flex-1"
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
