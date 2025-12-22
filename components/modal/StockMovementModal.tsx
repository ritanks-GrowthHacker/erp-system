'use client';

import { useState, useEffect, useRef } from 'react';
import { getAuthToken } from '@/lib/utils/token';
import { RefreshCw, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  costPrice: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StockMovementModal({ isOpen, onClose, onSuccess }: StockMovementModalProps) {
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    sourceWarehouseId: '',
    destinationWarehouseId: '',
    movementType: 'transfer',
    quantity: '',
    unitCost: '',
    notes: '',
    movementDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isOpen) {
      generateReferenceNumber();
      fetchWarehouses();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
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
  }, [searchTerm]);

  // Auto-populate unit cost when product is selected
  useEffect(() => {
    if (selectedProduct?.costPrice) {
      setFormData(prev => ({ ...prev, unitCost: selectedProduct.costPrice }));
    }
  }, [selectedProduct]);

  const generateReferenceNumber = () => {
    setGenerating(true);
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    setReferenceNumber(`MOV-${timestamp}-${random}`);
    setGenerating(false);
  };

  const searchProducts = async (term: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`/api/erp/inventory/products?search=${encodeURIComponent(term)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const fetchWarehouses = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch('/api/erp/inventory/warehouses', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setWarehouses(data.warehouses || []);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setShowSuggestions(false);
  };

  const handleClearProduct = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    setFormData(prev => ({ ...prev, unitCost: '' }));
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const resetForm = () => {
    setFormData({
      sourceWarehouseId: '',
      destinationWarehouseId: '',
      movementType: 'transfer',
      quantity: '',
      unitCost: '',
      notes: '',
      movementDate: new Date().toISOString().split('T')[0],
    });
    setSelectedProduct(null);
    setSearchTerm('');
    setProducts([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }

    if (!formData.sourceWarehouseId || !formData.destinationWarehouseId) {
      alert('Please select both source and destination warehouses');
      return;
    }

    if (formData.sourceWarehouseId === formData.destinationWarehouseId) {
      alert('Source and destination warehouses must be different');
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    setSubmitting(true);
    const token = getAuthToken();

    try {
      const response = await fetch('/api/erp/inventory/movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          referenceNumber,
          productId: selectedProduct.id,
          ...formData,
          quantity: parseFloat(formData.quantity),
          unitCost: parseFloat(formData.unitCost || '0'),
        }),
      });

      if (response.ok) {
        alert('Stock movement created successfully!');
        resetForm();
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to create stock movement'}`);
      }
    } catch (error) {
      console.error('Error creating stock movement:', error);
      alert('Failed to create stock movement');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalValue = (parseFloat(formData.quantity) || 0) * (parseFloat(formData.unitCost) || 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-50/50 backdrop-blur-sm px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Create Stock Movement</h2>
            <p className="text-sm text-slate-500 mt-0.5">Transfer inventory between warehouses</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Movement Reference <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={referenceNumber}
                readOnly
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
              />
              <button
                type="button"
                onClick={generateReferenceNumber}
                disabled={generating}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                Generate
              </button>
            </div>
          </div>

          {/* Product Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Product <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => products.length > 0 && setShowSuggestions(true)}
                placeholder="Search products by name or SKU..."
                disabled={submitting || !!selectedProduct}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
              {selectedProduct && (
                <button
                  type="button"
                  onClick={handleClearProduct}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {showSuggestions && products.length > 0 && !selectedProduct && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleProductSelect(product)}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                  >
                    <div className="font-medium text-slate-900">{product.name}</div>
                    <div className="text-sm text-slate-500">SKU: {product.sku}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Source Warehouse */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                From Warehouse <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.sourceWarehouseId}
                onChange={(e) => setFormData({ ...formData, sourceWarehouseId: e.target.value })}
                required
                disabled={submitting}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
              >
                <option value="">Select source warehouse</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Warehouse */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                To Warehouse <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.destinationWarehouseId}
                onChange={(e) => setFormData({ ...formData, destinationWarehouseId: e.target.value })}
                required
                disabled={submitting}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
              >
                <option value="">Select destination warehouse</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Movement Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Movement Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.movementType}
                onChange={(e) => setFormData({ ...formData, movementType: e.target.value })}
                required
                disabled={submitting}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
              >
                <option value="transfer">Transfer</option>
                <option value="reallocation">Reallocation</option>
                <option value="return">Return</option>
              </select>
            </div>

            {/* Movement Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Movement Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.movementDate}
                onChange={(e) => setFormData({ ...formData, movementDate: e.target.value })}
                required
                disabled={submitting}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                min="0.01"
                disabled={submitting}
                placeholder="Enter quantity"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
              />
            </div>

            {/* Unit Cost - Auto-populated */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Unit Cost
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                min="0"
                disabled={submitting}
                placeholder="Auto-populated"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 bg-blue-50"
              />
              <p className="text-xs text-slate-500 mt-1">Auto-populated from product cost price</p>
            </div>
          </div>

          {/* Total Value Display */}
          {totalValue > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Total Movement Value:</span>
                <span className="text-lg font-semibold text-blue-600">
                  ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={submitting}
              rows={3}
              placeholder="Add any notes or comments..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedProduct}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'Creating...' : 'Create Movement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
