'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAuthToken } from '@/lib/utils/token';
import Link from 'next/link';

export default function PurchasingDashboard() {
  const [stats, setStats] = useState({
    purchaseOrders: { total: 0, draft: 0, confirmed: 0, received: 0 },
    invoices: { total: 0, pending: 0, approved: 0, paid: 0, overdue: 0 },
    receipts: { total: 0, received: 0, accepted: 0 },
    suppliers: { total: 0, active: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      // Fetch all data in parallel
      const [ordersRes, invoicesRes, receiptsRes, suppliersRes] = await Promise.all([
        fetch('/api/erp/purchasing/orders', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/erp/purchasing/invoices', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/erp/purchasing/goods-receipts', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/erp/purchasing/suppliers', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        const orders = data.purchaseOrders || [];
        setStats(prev => ({
          ...prev,
          purchaseOrders: {
            total: orders.length,
            draft: orders.filter((o: any) => o.status === 'draft').length,
            confirmed: orders.filter((o: any) => o.status === 'confirmed').length,
            received: orders.filter((o: any) => o.status === 'received').length,
          }
        }));
      }

      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        const invoices = data.invoices || [];
        setStats(prev => ({
          ...prev,
          invoices: {
            total: invoices.length,
            pending: invoices.filter((i: any) => i.status === 'pending').length,
            approved: invoices.filter((i: any) => i.status === 'approved').length,
            paid: invoices.filter((i: any) => i.status === 'paid').length,
            overdue: invoices.filter((i: any) => i.status === 'overdue').length,
          }
        }));
      }

      if (receiptsRes.ok) {
        const data = await receiptsRes.json();
        const receipts = data.receipts || [];
        setStats(prev => ({
          ...prev,
          receipts: {
            total: receipts.length,
            received: receipts.filter((r: any) => r.status === 'received').length,
            accepted: receipts.filter((r: any) => r.status === 'accepted').length,
          }
        }));
      }

      if (suppliersRes.ok) {
        const data = await suppliersRes.json();
        const suppliers = data.suppliers || [];
        setStats(prev => ({
          ...prev,
          suppliers: {
            total: suppliers.length,
            active: suppliers.filter((s: any) => s.isActive).length,
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Purchasing Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage purchase orders, supplier invoices, and goods receipts</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        <Link href="/erp/purchasing/rfq">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">RFQs</div>
                  <div className="text-3xl font-bold text-purple-600 mt-2">
                    {loading ? '...' : 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Request quotes
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/erp/purchasing/quotations">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Quotations</div>
                  <div className="text-3xl font-bold text-orange-600 mt-2">
                    {loading ? '...' : 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Compare quotes
                  </div>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/erp/purchasing/orders">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Purchase Orders</div>
                  <div className="text-3xl font-bold text-blue-600 mt-2">
                    {loading ? '...' : stats.purchaseOrders.total}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {stats.purchaseOrders.confirmed} confirmed
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/erp/purchasing/invoices">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Vendor Invoices</div>
                  <div className="text-3xl font-bold text-yellow-600 mt-2">
                    {loading ? '...' : stats.invoices.total}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {stats.invoices.pending} pending
                  </div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/erp/purchasing/goods-receipts">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Goods Receipts</div>
                  <div className="text-3xl font-bold text-green-600 mt-2">
                    {loading ? '...' : stats.receipts.total}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {stats.receipts.accepted} accepted
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="bg-linear-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-purple-100">Active Suppliers</div>
                <div className="text-3xl font-bold mt-2">
                  {loading ? '...' : stats.suppliers.active}
                </div>
                <div className="text-xs text-purple-100 mt-2">
                  of {stats.suppliers.total} total
                </div>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-6">
        {/* Purchase Orders Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-700">Draft</span>
                </div>
                <span className="font-semibold">{stats.purchaseOrders.draft}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Confirmed</span>
                </div>
                <span className="font-semibold">{stats.purchaseOrders.confirmed}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Received</span>
                </div>
                <span className="font-semibold">{stats.purchaseOrders.received}</span>
              </div>
              <div className="pt-4 border-t">
                <Link href="/erp/purchasing/orders">
                  <Button className="w-full" variant="secondary">
                    View All Orders
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Invoices Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Pending</span>
                </div>
                <span className="font-semibold">{stats.invoices.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Approved</span>
                </div>
                <span className="font-semibold">{stats.invoices.approved}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Overdue</span>
                </div>
                <span className="font-semibold text-red-600">{stats.invoices.overdue}</span>
              </div>
              <div className="pt-4 border-t">
                <Link href="/erp/purchasing/invoices">
                  <Button className="w-full" variant="secondary">
                    View All Invoices
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <Link href="/erp/purchasing/rfq">
              <Button className="w-full h-20 flex flex-col items-center justify-center gap-2" variant="secondary">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                <span>Create RFQ</span>
              </Button>
            </Link>

            <Link href="/erp/purchasing/orders">
              <Button className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create Purchase Order</span>
              </Button>
            </Link>
            
            <Link href="/erp/purchasing/goods-receipts">
              <Button className="w-full h-20 flex flex-col items-center justify-center gap-2" variant="secondary">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>Receive Goods</span>
              </Button>
            </Link>
            
            <Link href="/erp/purchasing/invoices">
              <Button className="w-full h-20 flex flex-col items-center justify-center gap-2" variant="secondary">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Record Invoice</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
