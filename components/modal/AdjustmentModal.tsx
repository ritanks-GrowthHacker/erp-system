'use client';
import React, { useState, useEffect, useRef } from 'react';
import { getAuthToken } from '@/lib/utils/token';
import { RefreshCw } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  quantity?: number;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface AdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdjustmentModal({ isOpen, onClose, onSuccess }: AdjustmentModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [referenceNumber, setReferenceNumber] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [systemQuantity, setSystemQuantity] = useState('0');
  const [actualQuantity, setActualQuantity] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('physical_count');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      generateReferenceNumber();
      fetchWarehouses();
    }
  }, [isOpen]);

  // Debounced product search
  useEffect(() => {
    if (selectedProduct) return;

    if (searchTerm.length < 2) {
      setProducts([]);
      setShowSuggestions(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchProducts(searchTerm);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, selectedProduct]);

  // Fetch system quantity when product and warehouse are selected
  useEffect(() => {
    if (selectedProduct && warehouseId) {
      fetchSystemQuantity(selectedProduct.id, warehouseId);
    }
  }, [selectedProduct, warehouseId]);

  const fetchWarehouses = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch('/api/erp/inventory/warehouses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWarehouses(data.warehouses || []);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const searchProducts = async (query: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/erp/inventory/products?search=${encodeURIComponent(query)}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemQuantity = async (productId: string, warehouseId: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/erp/inventory/stock-levels?productId=${productId}&warehouseId=${warehouseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const stockLevel = data.stockLevels?.[0];
        setSystemQuantity(stockLevel?.quantity?.toString() || '0');
      }
    } catch (error) {
      console.error('Error fetching system quantity:', error);
      setSystemQuantity('0');
    }
  };

  const generateReferenceNumber = () => {
    setGenerating(true);
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    setReferenceNumber(`ADJ-${timestamp}-${random}`);
    setGenerating(false);
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchTerm('');
    setShowSuggestions(false);
    setProducts([]);
  };

  const handleClearProduct = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    setShowSuggestions(false);
    setProducts([]);
    setSystemQuantity('0');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }

    if (!warehouseId) {
      alert('Please select a warehouse');
      return;
    }

    if (!actualQuantity) {
      alert('Please enter actual quantity');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert('No authentication token found');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/erp/inventory/adjustments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          referenceNumber,
          productId: selectedProduct.id,
          warehouseId,
          systemQuantity: parseFloat(systemQuantity),
          actualQuantity: parseFloat(actualQuantity),
          adjustmentType,
          reason,
          notes,
        }),
      });

      if (response.ok) {
        alert('Adjustment created successfully!');
        onSuccess();
        resetForm();
        onClose();
      } else {
        const error = await response.json();
        alert(`Failed to create adjustment: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating adjustment:', error);
      alert('Failed to create adjustment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    setReferenceNumber('');
    setWarehouseId('');
    setSystemQuantity('0');
    setActualQuantity('');
    setAdjustmentType('physical_count');
    setReason('');
    setNotes('');
  };

  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  const difference = parseFloat(actualQuantity || '0') - parseFloat(systemQuantity || '0');

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-xl max-w-3xl w-full mx-auto shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Create Inventory Adjustment</h3>
            <p className="text-sm text-slate-500 mt-1">Record stock discrepancies and adjustments</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Reference Number with Generate Button */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Reference Number <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="ADJ-2024-001"
              />
              <button
                type="button"
                onClick={generateReferenceNumber}
                disabled={generating}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
                Generate
              </button>
            </div>
          </div>

          {/* Product Search */}
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Product <span className="text-red-500">*</span>
            </label>
            
            {selectedProduct ? (
              <div className="flex items-center gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{selectedProduct.name}</div>
                  <div className="text-sm text-slate-600">SKU: {selectedProduct.sku}</div>
                </div>
                <button
                  type="button"
                  onClick={handleClearProduct}
                  className="px-3 py-1 text-sm bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Type to search products..."
                />
                
                {loading && (
                  <div className="absolute right-3 top-11 text-slate-400">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-blue-500"></div>
                  </div>
                )}

                {showSuggestions && products.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {products.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleProductSelect(product)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-slate-900">{product.name}</div>
                        <div className="text-sm text-slate-600">SKU: {product.sku}</div>
                      </button>
                    ))}
                  </div>
                )}

                {showSuggestions && searchTerm.length >= 2 && products.length === 0 && !loading && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 text-center text-slate-500">
                    No products found
                  </div>
                )}
              </>
            )}
          </div>

          {/* Warehouse */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Warehouse <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} ({warehouse.code})
                </option>
              ))}
            </select>
          </div>

          {/* Adjustment Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Adjustment Type
            </label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="physical_count">Physical Count</option>
              <option value="damage">Damage</option>
              <option value="theft">Theft</option>
              <option value="expiry">Expiry</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                System Quantity
              </label>
              <input
                type="number"
                value={systemQuantity}
                readOnly
                className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Actual Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={actualQuantity}
                onChange={(e) => setActualQuantity(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Difference
              </label>
              <input
                type="text"
                value={difference.toFixed(2)}
                readOnly
                className={`w-full px-4 py-3 border border-slate-200 rounded-lg font-semibold ${
                  difference > 0 ? 'bg-green-50 text-green-700' : difference < 0 ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600'
                }`}
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Explain the reason for this adjustment..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Additional notes or observations..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 px-6 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedProduct || !warehouseId}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
