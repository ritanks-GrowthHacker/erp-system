'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/utils/token';
import { Plus, Trash2, Edit, Copy } from 'lucide-react';
import BOMFormModal from '@/components/modal/BOMFormModal';

interface BOM {
  id: string;
  bomNumber: string;
  productId: string;
  product: {
    name: string;
    sku: string;
  };
  version: number;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  scrapPercentage: number;
  notes: string;
  createdAt: string;
}

export default function BOMPage() {
  const [boms, setBOMs] = useState<BOM[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [bomDetails, setBomDetails] = useState<any>(null);

  useEffect(() => {
    fetchBOMs();
  }, []);

  const fetchBOMs = async () => {
    const token = getAuthToken();
    try {
      setLoading(true);
      const response = await fetch('/api/erp/manufacturing/bom', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBOMs(data.boms || []);
      }
    } catch (error) {
      console.error('Error fetching BOMs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (bomId: string) => {
    if (expandedRow === bomId) {
      setExpandedRow(null);
      setBomDetails(null);
    } else {
      setExpandedRow(bomId);
      await fetchBOMDetails(bomId);
    }
  };

  const fetchBOMDetails = async (bomId: string) => {
    const token = getAuthToken();
    try {
      const response = await fetch(`/api/erp/manufacturing/bom/${bomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBomDetails(data);
      }
    } catch (error) {
      console.error('Error fetching BOM details:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2"></div>
          <div className="text-gray-600">Loading BOMs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bill of Materials (BOM)</h1>
          <p className="text-sm text-gray-500 mt-1">Manage product manufacturing recipes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
        >
          <Plus size={18} />
          Create BOM
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600 mb-2">Total BOMs</div>
          <div className="text-3xl font-bold text-gray-900">{boms.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600 mb-2">Active BOMs</div>
          <div className="text-3xl font-bold text-green-600">
            {boms.filter(b => b.isActive).length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600 mb-2">Multi-Level</div>
          <div className="text-3xl font-bold text-blue-600">
            {boms.filter(b => bomDetails?.lines?.some((l: any) => l.component?.hasBom)).length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600 mb-2">Avg Scrap %</div>
          <div className="text-3xl font-bold text-yellow-600">
            {boms.length > 0 ? (boms.reduce((sum, b) => sum + b.scrapPercentage, 0) / boms.length).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* BOM Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">BOM #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Version</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Effective From</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Scrap %</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {boms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No BOMs found. Create your first BOM to get started.
                  </td>
                </tr>
              ) : (
                boms.map((bom) => (
                  <>
                    <tr key={bom.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(bom.id)}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">
                        <div className="flex items-center gap-2">
                          <span>{expandedRow === bom.id ? '▼' : '▶'}</span>
                          {bom.bomNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{bom.product.name}</div>
                        <div className="text-sm text-gray-500">{bom.product.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">v{bom.version}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(bom.effectiveFrom).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                        {bom.scrapPercentage}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          bom.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {bom.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <button className="text-blue-600 hover:text-blue-800 font-medium" title="Edit">
                            <Edit size={16} />
                          </button>
                          <button className="text-green-600 hover:text-green-800 font-medium" title="Copy">
                            <Copy size={16} />
                          </button>
                          <button className="text-red-600 hover:text-red-800 font-medium" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRow === bom.id && bomDetails && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <div className="grid grid-cols-4 gap-4 mb-4">
                              <div>
                                <div className="text-xs text-gray-500">Effective To</div>
                                <div className="text-sm font-medium">{bomDetails.effectiveTo ? new Date(bomDetails.effectiveTo).toLocaleDateString('en-IN') : 'N/A'}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Notes</div>
                                <div className="text-sm font-medium">{bomDetails.notes || 'N/A'}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Components</div>
                                <div className="text-sm font-medium">{bomDetails.lines?.length || 0}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Created</div>
                                <div className="text-sm font-medium">{new Date(bomDetails.createdAt).toLocaleString('en-IN')}</div>
                              </div>
                            </div>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                              <table className="min-w-full">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold">Component</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold">Quantity</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold">UOM</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold">Scrap %</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold">Type</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {bomDetails.lines?.map((line: any, idx: number) => (
                                    <tr key={idx}>
                                      <td className="px-4 py-2 text-sm">
                                        <div className="font-medium">{line.component?.name || 'N/A'}</div>
                                        <div className="text-xs text-gray-500">{line.component?.sku}</div>
                                      </td>
                                      <td className="px-4 py-2 text-sm text-right">{parseFloat(line.quantity).toFixed(2)}</td>
                                      <td className="px-4 py-2 text-sm text-right">{line.uom || 'Units'}</td>
                                      <td className="px-4 py-2 text-sm text-right">{line.scrapPercentage || 0}%</td>
                                      <td className="px-4 py-2 text-sm">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                          line.componentType === 'raw_material' ? 'bg-blue-100 text-blue-800' :
                                          line.componentType === 'semi_finished' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {line.componentType?.replace('_', ' ').toUpperCase()}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOM Creation Modal */}
      <BOMFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={fetchBOMs}
      />
    </div>
  );
}
