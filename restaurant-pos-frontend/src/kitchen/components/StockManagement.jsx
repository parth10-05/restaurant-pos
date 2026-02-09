import React, { useState, useEffect } from 'react';
import kitchenService from '../../services/kitchen.service';

/**
 * Stock Management Component for Kitchen Dashboard
 * Allows kitchen staff to view and update ingredient stock levels
 */
export default function StockManagement({ isOpen, onClose }) {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [addingId, setAddingId] = useState(null);
  const [addValue, setAddValue] = useState('');
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [historyId, setHistoryId] = useState(null);
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);

  // Fetch stock data
  const fetchStock = async () => {
    try {
      setLoading(true);
      const data = await kitchenService.getStock();
      setStock(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch stock:', err);
      setError(err.response?.data?.message || 'Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStock();
    }
  }, [isOpen]);

  // Fetch history for an ingredient
  const fetchHistory = async (ingredientId) => {
    try {
      const data = await kitchenService.getStockHistory(ingredientId, 10);
      setHistory(data);
      setHistoryId(ingredientId);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  // Filter stock based on search and low stock filter
  const filteredStock = stock.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = !showLowOnly || item.isLowStock;
    return matchesSearch && matchesLowStock;
  });

  // Handle updating stock to specific value
  const handleUpdateStock = async (ingredientId) => {
    const quantity = parseFloat(editValue);
    if (isNaN(quantity) || quantity < 0) {
      setError('Please enter a valid quantity');
      return;
    }

    try {
      setSaving(true);
      await kitchenService.updateStock(ingredientId, quantity, 'Manual adjustment from kitchen');
      await fetchStock();
      setEditingId(null);
      setEditValue('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  // Handle adding stock
  const handleAddStock = async (ingredientId) => {
    const quantity = parseFloat(addValue);
    if (isNaN(quantity) || quantity <= 0) {
      setError('Please enter a positive quantity');
      return;
    }

    try {
      setSaving(true);
      await kitchenService.addStock(ingredientId, quantity, 'Stock added from kitchen');
      await fetchStock();
      setAddingId(null);
      setAddValue('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add stock');
    } finally {
      setSaving(false);
    }
  };

  // Count low stock items
  const lowStockCount = stock.filter(item => item.isLowStock).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Stock Management</h2>
            <p className="text-sm text-neutral-500 mt-1">
              View and update ingredient stock levels
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-neutral-200 flex gap-4 items-center">
          <div className="flex-1 relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowLowOnly(!showLowOnly)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              showLowOnly 
                ? 'bg-red-100 text-red-700 border-2 border-red-300' 
                : 'bg-neutral-100 text-neutral-700 border-2 border-transparent hover:bg-neutral-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${lowStockCount > 0 ? 'bg-red-500' : 'bg-green-500'}`}></span>
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={fetchStock}
            disabled={loading}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 font-medium"
          >
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
          </div>
        )}

        {/* Stock Table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-neutral-500">Loading stock...</div>
            </div>
          ) : filteredStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-neutral-500">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <span>No ingredients found</span>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-neutral-50 sticky top-0">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-900">Ingredient</th>
                  <th className="text-right py-3 px-4 font-semibold text-neutral-900">Current Stock</th>
                  <th className="text-right py-3 px-4 font-semibold text-neutral-900">Min Stock</th>
                  <th className="text-center py-3 px-4 font-semibold text-neutral-900">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-neutral-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredStock.map((item) => (
                  <tr key={item.id} className={`hover:bg-neutral-50 ${item.isLowStock ? 'bg-red-50/50' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="font-medium text-neutral-900">{item.name}</div>
                      <div className="text-sm text-neutral-500">₹{item.costPerUnit}/{item.unit}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {editingId === item.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24 px-2 py-1 border border-neutral-300 rounded text-right"
                            autoFocus
                          />
                          <span className="text-neutral-500">{item.unit}</span>
                        </div>
                      ) : (
                        <span className={`font-mono text-lg ${item.isLowStock ? 'text-red-600 font-bold' : 'text-neutral-900'}`}>
                          {item.currentStock.toFixed(2)} {item.unit}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-600">
                      {item.minStock} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                          </svg>
                          Low
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                          OK
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {editingId === item.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateStock(item.id)}
                              disabled={saving}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditValue(''); }}
                              className="px-3 py-1 bg-neutral-200 text-neutral-700 text-sm rounded hover:bg-neutral-300"
                            >
                              Cancel
                            </button>
                          </>
                        ) : addingId === item.id ? (
                          <>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Qty"
                              value={addValue}
                              onChange={(e) => setAddValue(e.target.value)}
                              className="w-20 px-2 py-1 border border-neutral-300 rounded text-right text-sm"
                              autoFocus
                            />
                            <button
                              onClick={() => handleAddStock(item.id)}
                              disabled={saving}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => { setAddingId(null); setAddValue(''); }}
                              className="px-3 py-1 bg-neutral-200 text-neutral-700 text-sm rounded hover:bg-neutral-300"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditingId(item.id); setEditValue(item.currentStock.toString()); }}
                              className="px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded hover:bg-neutral-200"
                              title="Edit stock"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => { setAddingId(item.id); setAddValue(''); }}
                              className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200"
                              title="Add stock"
                            >
                              + Add
                            </button>
                            <button
                              onClick={() => fetchHistory(item.id)}
                              className="px-3 py-1 bg-neutral-100 text-neutral-600 text-sm rounded hover:bg-neutral-200"
                              title="View history"
                            >
                              📜
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* History Sidebar */}
        {historyId && (
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl border-l border-neutral-200 flex flex-col">
            <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900">Stock History</h3>
              <button onClick={() => setHistoryId(null)} className="p-1 hover:bg-neutral-100 rounded">
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {history.length === 0 ? (
                <div className="text-center text-neutral-500 py-8">No history found</div>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className={`p-3 rounded-lg border ${
                    entry.changeQty < 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                  }`}>
                    <div className={`font-bold ${entry.changeQty < 0 ? 'text-red-700' : 'text-green-700'}`}>
                      {entry.changeQty > 0 ? '+' : ''}{entry.changeQty.toFixed(2)}
                    </div>
                    <div className="text-sm text-neutral-600">
                      Balance: {entry.balanceAfter.toFixed(2)}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {entry.source.replace(/_/g, ' ')}
                    </div>
                    {entry.notes && (
                      <div className="text-xs text-neutral-500 italic mt-1">{entry.notes}</div>
                    )}
                    <div className="text-xs text-neutral-400 mt-1">
                      {new Date(entry.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex justify-between items-center">
          <div className="text-sm text-neutral-600">
            Showing {filteredStock.length} of {stock.length} ingredients
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
