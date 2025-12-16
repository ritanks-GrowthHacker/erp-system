'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAuthToken } from '@/lib/utils/token';
import { Input, Textarea } from '@/components/ui/form';

interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  locations?: any[];
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    country: '',
    phone: '',
    email: '',
  });



  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch('/api/erp/inventory/warehouses', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setWarehouses(data.warehouses || []);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    try {
      const url = editingId
        ? `/api/erp/inventory/warehouses/${editingId}`
        : '/api/erp/inventory/warehouses';
      
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchWarehouses();
        resetForm();
        alert(editingId ? 'Warehouse updated successfully!' : 'Warehouse created successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save warehouse');
      }
    } catch (error) {
      console.error('Error saving warehouse:', error);
      alert('Failed to save warehouse');
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingId(warehouse.id);
    setFormData({
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address || '',
      city: warehouse.city || '',
      state: warehouse.state || '',
      country: warehouse.country || '',
      phone: warehouse.phone || '',
      email: warehouse.email || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) return;

    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`/api/erp/inventory/warehouses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchWarehouses();
        alert('Warehouse deleted successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete warehouse');
      }
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      alert('Failed to delete warehouse');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      country: '',
      phone: '',
      email: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading warehouses...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Warehouses</h1>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancel' : '+ Add Warehouse'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Warehouse' : 'Create New Warehouse'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Warehouse Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Warehouse Code *
                  </label>
                  <Input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Address
                  </label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <Input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <Input
                    type="text"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <Input
                    type="text"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'Update Warehouse' : 'Create Warehouse'}
                </Button>
                <Button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Warehouses ({warehouses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {warehouses.map((warehouse) => (
              <div
                key={warehouse.id}
                className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-200 bg-linear-to-br from-white to-gray-50"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{warehouse.name}</h3>
                    <p className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">
                      {warehouse.code}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      warehouse.isActive
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {warehouse.isActive ? '● Active' : '○ Inactive'}
                  </span>
                </div>

                <div className="space-y-2 mb-4 min-h-[120px]">
                  {warehouse.address && (
                    <div className="flex items-start gap-2">
                      <span className="text-blue-500 text-lg">📍</span>
                      <p className="text-sm text-gray-700 flex-1">{warehouse.address}</p>
                    </div>
                  )}

                  {warehouse.city && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 text-lg">🏙️</span>
                      <p className="text-sm text-gray-700">
                        {warehouse.city}
                        {warehouse.state && `, ${warehouse.state}`}
                        {warehouse.country && ` • ${warehouse.country}`}
                      </p>
                    </div>
                  )}

                  {warehouse.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-purple-500 text-lg">📞</span>
                      <p className="text-sm text-gray-700">{warehouse.phone}</p>
                    </div>
                  )}

                  {warehouse.email && (
                    <div className="flex items-center gap-2">
                      <span className="text-orange-500 text-lg">✉️</span>
                      <p className="text-sm text-gray-700">{warehouse.email}</p>
                    </div>
                  )}
                </div>

                {warehouse.locations && warehouse.locations.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-3">
                    <p className="text-sm font-semibold text-blue-700">
                      📦 {warehouse.locations.length} Storage Location{warehouse.locations.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleEdit(warehouse)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() =>
                      (window.location.href = `/erp/inventory/warehouses/${warehouse.id}`)
                    }
                    className="flex-1 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    👁️ View
                  </button>
                  <button
                    onClick={() => handleDelete(warehouse.id)}
                    className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {warehouses.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏭</div>
              <p className="text-gray-500 text-lg mb-2">No warehouses found</p>
              <p className="text-gray-400 text-sm">Create your first warehouse to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

