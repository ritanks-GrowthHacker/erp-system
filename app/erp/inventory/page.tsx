'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { getAuthToken } from '@/lib/utils/token';

interface Product {
  id: string;
  name: string;
  sku: string;
  productType: string;
  costPrice: string;
  salePrice: string;
  isActive: boolean;
  category?: {
    name: string;
  };
}

export default function InventoryDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch('/api/erp/inventory/products', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Inventory Management
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your products, stock levels, and warehouse operations
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button
            onClick={() => (window.location.href = '/erp/inventory/products')}
            variant="primary"
            className="h-20 text-lg"
          >
            📦 Products
          </Button>
          <Button
            onClick={() => (window.location.href = '/erp/inventory/warehouses')}
            variant="primary"
            className="h-20 text-lg"
          >
            🏢 Warehouses
          </Button>
          <Button
            onClick={() => (window.location.href = '/erp/inventory/stock-levels')}
            variant="primary"
            className="h-20 text-lg"
          >
            📊 Stock Levels
          </Button>
          <Button
            onClick={() => (window.location.href = '/erp/inventory/movements')}
            variant="primary"
            className="h-20 text-lg"
          >
            🔄 Movements
          </Button>
          <Button
            onClick={() => (window.location.href = '/erp/inventory/adjustments')}
            variant="secondary"
            className="h-20 text-lg"
          >
            ✏️ Adjustments
          </Button>
          <Button
            onClick={() => (window.location.href = '/erp/inventory/categories')}
            variant="secondary"
            className="h-20 text-lg"
          >
            🗂️ Categories
          </Button>
          <Button
            onClick={() => (window.location.href = '/erp/inventory/analytics')}
            variant="secondary"
            className="h-20 text-lg"
          >
            📈 Analytics
          </Button>
          <Button
            onClick={() => (window.location.href = '/erp/inventory/alerts')}
            variant="danger"
            className="h-20 text-lg"
          >
            🔔 Alerts
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-sm font-medium text-gray-500">
                Total Products
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {products.length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-sm font-medium text-gray-500">
                Active Products
              </div>
              <div className="mt-2 text-3xl font-bold text-green-600">
                {products.filter(p => p.isActive).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-sm font-medium text-gray-500">
                Low Stock Alerts
              </div>
              <div className="mt-2 text-3xl font-bold text-orange-600">
                0
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-sm font-medium text-gray-500">
                Out of Stock
              </div>
              <div className="mt-2 text-3xl font-bold text-red-600">
                0
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Products</CardTitle>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">
                  Filter
                </Button>
                <Button size="sm">Add Product</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading products...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                Error: {error}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No products found. Add your first product to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Sale Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.sku}
                      </TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>
                        {product.category?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">
                          {product.productType}
                        </span>
                      </TableCell>
                      <TableCell>₹{product.costPrice}</TableCell>
                      <TableCell>₹{product.salePrice}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            product.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
