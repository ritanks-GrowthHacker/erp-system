'use client';

import React, { useEffect, useState } from 'react';
import { Input, Select } from '@/components/ui/form';

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface Location {
  id: string;
  name: string;
  code: string;
}

interface AddProductToWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  warehouseId: string;
  warehouseName: string;
  products: Product[];
  locations: Location[];
  formData: {
    productId: string;
    locationId: string;
    quantityOnHand: string;
    quantityReserved: string;
  };
  setFormData: (data: any) => void;
  loading: boolean;
}

export default function AddProductToWarehouseModal({
  isOpen,
  onClose,
  onSubmit,
  warehouseId,
  warehouseName,
  products,
  locations,
  formData,
  setFormData,
  loading,
}: AddProductToWarehouseModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div className="max-w-2xl w-full mx-auto mt-10 mb-10 bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Add Product to Warehouse
            </h3>
            <p className="text-sm text-gray-500 mt-1">{warehouseName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Select Product *
              </label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Location Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Storage Location *
              </label>
              <select
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a location...</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} ({location.code})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select the specific location where this product will be stored
              </p>
            </div>

            {/* Quantity on Hand */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Quantity on Hand *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.quantityOnHand}
                onChange={(e) => setFormData({ ...formData, quantityOnHand: e.target.value })}
                placeholder="0.00"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Available quantity in stock
              </p>
            </div>

            {/* Quantity Reserved */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Quantity Reserved
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.quantityReserved}
                onChange={(e) => setFormData({ ...formData, quantityReserved: e.target.value })}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Quantity reserved for orders (optional)
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Stock Level Information</p>
                  <p className="text-blue-700">
                    Available quantity = Quantity on Hand - Quantity Reserved
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button 
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Product to Warehouse'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
