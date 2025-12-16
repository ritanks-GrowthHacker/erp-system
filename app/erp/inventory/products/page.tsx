'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/form';
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
  reorderPoint: string;
  reorderQuantity: string;
  category?: {
    name: string;
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    productType: 'storable',
    trackingType: 'none',
    costPrice: '',
    salePrice: '',
    reorderPoint: '',
    reorderQuantity: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const token = getAuthToken();
    if (!token) {
      console.error('No token available');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/erp/inventory/products', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        console.error('Failed to fetch products:', response.status);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = getAuthToken();
    if (!token) {
      alert('Not authenticated');
      return;
    }
    
    try {
      const url = editingProduct 
        ? `/api/erp/inventory/products/${editingProduct.id}`
        : '/api/erp/inventory/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        resetForm();
        fetchProducts();
        alert(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
      } else {
        const error = await response.json();
        alert(error.error || `Failed to ${editingProduct ? 'update' : 'create'} product`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: '',
      productType: product.productType,
      trackingType: 'none',
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      reorderPoint: product.reorderPoint,
      reorderQuantity: product.reorderQuantity,
    });
    setShowForm(true);
  };

  const handleView = (product: Product) => {
    setViewingProduct(product);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      description: '',
      productType: 'storable',
      trackingType: 'none',
      costPrice: '',
      salePrice: '',
      reorderPoint: '',
      reorderQuantity: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Create Product'}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingProduct ? 'Edit Product' : 'New Product'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Product Name *"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
                <Input
                  label="SKU *"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  required
                />
                <Select
                  label="Product Type *"
                  value={formData.productType}
                  onChange={(e) =>
                    setFormData({ ...formData, productType: e.target.value })
                  }
                  options={[
                    { value: 'storable', label: 'Storable Product' },
                    { value: 'consumable', label: 'Consumable' },
                    { value: 'service', label: 'Service' },
                  ]}
                />
                <Select
                  label="Tracking"
                  value={formData.trackingType}
                  onChange={(e) =>
                    setFormData({ ...formData, trackingType: e.target.value })
                  }
                  options={[
                    { value: 'none', label: 'No Tracking' },
                    { value: 'serial', label: 'By Serial Number' },
                    { value: 'lot', label: 'By Lot Number' },
                  ]}
                />
                <Input
                  label="Cost Price (₹)"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, costPrice: e.target.value })
                  }
                />
                <Input
                  label="Sale Price (₹)"
                  type="number"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, salePrice: e.target.value })
                  }
                />
                <Input
                  label="Reorder Point"
                  type="number"
                  value={formData.reorderPoint}
                  onChange={(e) =>
                    setFormData({ ...formData, reorderPoint: e.target.value })
                  }
                />
                <Input
                  label="Reorder Quantity"
                  type="number"
                  value={formData.reorderQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reorderQuantity: e.target.value,
                    })
                  }
                />
              </div>
              <Textarea
                label="Description"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button type="submit">{editingProduct ? 'Update Product' : 'Create Product'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Products List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Product List</CardTitle>
            <Input
              placeholder="Search products..."
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No products found. Create your first product to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Cost Price</TableHead>
                  <TableHead>Sale Price</TableHead>
                  <TableHead>Reorder Point</TableHead>
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
                    <TableCell className="capitalize">
                      {product.productType}
                    </TableCell>
                    <TableCell>₹{parseFloat(product.costPrice).toFixed(2)}</TableCell>
                    <TableCell>₹{parseFloat(product.salePrice).toFixed(2)}</TableCell>
                    <TableCell>{product.reorderPoint}</TableCell>
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
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleView(product)}>
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

      {/* View Modal */}
      {showViewModal && viewingProduct && (
        <div className="fixed inset-0  bg-opacity-150 flex items-center justify-center z-50" onClick={() => setShowViewModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{viewingProduct.name}</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">SKU</label>
                  <p className="text-lg">{viewingProduct.sku}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Product Type</label>
                  <p className="text-lg capitalize">{viewingProduct.productType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Cost Price</label>
                  <p className="text-lg font-semibold text-blue-600">₹{parseFloat(viewingProduct.costPrice).toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Sale Price</label>
                  <p className="text-lg font-semibold text-green-600">₹{parseFloat(viewingProduct.salePrice).toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Reorder Point</label>
                  <p className="text-lg">{viewingProduct.reorderPoint}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Reorder Quantity</label>
                  <p className="text-lg">{viewingProduct.reorderQuantity}</p>
                </div>
                {viewingProduct.category && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Category</label>
                    <p className="text-lg">{viewingProduct.category.name}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="text-lg">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                      viewingProduct.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {viewingProduct.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button onClick={() => { setShowViewModal(false); handleEdit(viewingProduct); }}>Edit Product</Button>
                <Button variant="secondary" onClick={() => setShowViewModal(false)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
