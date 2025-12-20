'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getAuthToken } from '@/lib/utils/token';

interface Warehouse {
  id: string;
  name: string;
  code: string;
  type: string;
  isActive: boolean;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string | null;
  email: string | null;
}

interface Location {
  id: string;
  name: string;
  code: string;
  type: string;
  capacity: string | null;
  isActive: boolean;
  parentLocation: {
    name: string;
    code: string;
  } | null;
}

interface StockLevel {
  id: string;
  quantityOnHand: string;
  quantityReserved: string;
  product: {
    name: string;
    sku: string;
  };
  location: {
    name: string;
    code: string;
  } | null;
}

export default function WarehouseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params.id as string;

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationForm, setLocationForm] = useState({
    name: '',
    code: '',
    type: 'zone' as 'zone' | 'aisle' | 'rack' | 'shelf' | 'bin',
    parentLocationId: '',
    capacity: '',
  });

  useEffect(() => {
    fetchWarehouse();
    fetchLocations();
    fetchStockLevels();
  }, [warehouseId]);

  const fetchWarehouse = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`/api/erp/inventory/warehouses/${warehouseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setWarehouse(data.warehouse);
      }
    } catch (error) {
      console.error('Error fetching warehouse:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`/api/erp/inventory/warehouses/${warehouseId}/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setLocations(data.locations || []);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchStockLevels = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`/api/erp/inventory/stock-levels?warehouseId=${warehouseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStockLevels(data.stockLevels || []);
      }
    } catch (error) {
      console.error('Error fetching stock levels:', error);
    }
  };

  const handleCreateLocation = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`/api/erp/inventory/warehouses/${warehouseId}/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...locationForm,
          capacity: locationForm.capacity ? parseFloat(locationForm.capacity) : null,
          parentLocationId: locationForm.parentLocationId || null,
        }),
      });

      if (response.ok) {
        setShowLocationForm(false);
        setLocationForm({
          name: '',
          code: '',
          type: 'zone',
          parentLocationId: '',
          capacity: '',
        });
        fetchLocations();
      }
    } catch (error) {
      console.error('Error creating location:', error);
    }
  };

  const getLocationPath = (location: Location): string => {
    if (!location.parentLocation) return location.name;
    return `${location.parentLocation.name} > ${location.name}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading warehouse details...</div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500">Warehouse not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button onClick={() => router.back()} className="mb-2">
            ← Back
          </Button>
          <h1 className="text-3xl font-bold">
            {warehouse.name} ({warehouse.code})
          </h1>
        </div>
        <span
          className={`px-3 py-1 rounded ${
            warehouse.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {warehouse.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Warehouse Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Information</h3>
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium capitalize">{warehouse.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium">
                {warehouse.addressLine1}
                {warehouse.addressLine2 && `, ${warehouse.addressLine2}`}
                <br />
                {warehouse.city}, {warehouse.state} {warehouse.postalCode}
                <br />
                {warehouse.country}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{warehouse.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{warehouse.email || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div>
            <div className="text-2xl font-bold">{locations.length}</div>
            <p className="text-sm text-gray-600">Total Locations</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div>
            <div className="text-2xl font-bold">{stockLevels.length}</div>
            <p className="text-sm text-gray-600">Products Stored</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div>
            <div className="text-2xl font-bold">
              {stockLevels
                .reduce((sum, sl) => sum + parseFloat(sl.quantityOnHand), 0)
                .toFixed(2)}
            </div>
            <p className="text-sm text-gray-600">Total Units</p>
          </div>
        </div>
      </div>
}
      {/* Locations */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Warehouse Locations ({locations.length})</h3>
          <Button onClick={() => setShowLocationForm(!showLocationForm)}>
            {showLocationForm ? 'Cancel' : '+ Add Location'}
          </Button>
        </div>
        <div>
          {showLocationForm && (
            <div className="mb-6 p-4 border rounded bg-gray-50">
              <h3 className="font-semibold mb-4">Create New Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name*</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded"
                    value={locationForm.name}
                    onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Code*</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded"
                    value={locationForm.code}
                    onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Type*</label>
                  <select
                    className="w-full px-3 py-2 border rounded"
                    value={locationForm.type}
                    onChange={(e) =>
                      setLocationForm({
                        ...locationForm,
                        type: e.target.value as any,
                      })
                    }
                  >
                    <option value="zone">Zone</option>
                    <option value="aisle">Aisle</option>
                    <option value="rack">Rack</option>
                    <option value="shelf">Shelf</option>
                    <option value="bin">Bin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Parent Location</label>
                  <select
                    className="w-full px-3 py-2 border rounded"
                    value={locationForm.parentLocationId}
                    onChange={(e) =>
                      setLocationForm({ ...locationForm, parentLocationId: e.target.value })
                    }
                  >
                    <option value="">None (Top Level)</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {getLocationPath(loc)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Capacity</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded"
                    value={locationForm.capacity}
                    onChange={(e) => setLocationForm({ ...locationForm, capacity: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Button onClick={handleCreateLocation}>Create Location</Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Code</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Path</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold">Capacity</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {locations.map((location) => (
                  <tr key={location.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono">{location.code}</td>
                    <td className="px-4 py-2">{location.name}</td>
                    <td className="px-4 py-2 capitalize">{location.type}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {getLocationPath(location)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {location.capacity ? parseFloat(location.capacity).toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          location.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {location.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {locations.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No locations defined. Click "Add Location" to create one.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock in Warehouse */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock in this Warehouse ({stockLevels.length} products)</h3>
        <div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Product</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">SKU</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Location</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold">On Hand</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold">Reserved</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold">Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stockLevels.map((level) => {
                  const available = parseFloat(level.quantityOnHand) - parseFloat(level.quantityReserved);
                  
                  return (
                    <tr key={level.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{level.product.name}</td>
                      <td className="px-4 py-2 font-mono text-sm">{level.product.sku}</td>
                      <td className="px-4 py-2">{level.location?.name || '-'}</td>
                      <td className="px-4 py-2 text-right">{parseFloat(level.quantityOnHand).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">{parseFloat(level.quantityReserved).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-semibold">{available.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {stockLevels.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No stock in this warehouse
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
