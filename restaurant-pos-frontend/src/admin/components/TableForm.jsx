import { useState, useEffect } from 'react';

export default function TableForm({ table, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    number: '',
    seats: 2,
    active: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (table) {
      setFormData({
        number: table.number || '',
        seats: table.seats || 2,
        active: table.active !== undefined ? table.active : true
      });
    }
  }, [table]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.number || formData.number < 1) {
      newErrors.number = 'Table number is required and must be positive';
    }
    
    if (formData.seats < 1) {
      newErrors.seats = 'Seating capacity must be at least 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          {table ? 'Edit Table' : 'Add Table'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Table Number */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Table Number *
            </label>
            <input
              type="number"
              min="1"
              value={formData.number}
              onChange={(e) => handleChange('number', parseInt(e.target.value) || '')}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="e.g., 1, 2, 3"
              disabled={loading}
            />
            {errors.number && (
              <p className="text-sm text-red-600 mt-1">{errors.number}</p>
            )}
          </div>

          {/* Seating Capacity */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Seating Capacity *
            </label>
            <select
              value={formData.seats}
              onChange={(e) => handleChange('seats', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
              disabled={loading}
            >
              {[2, 4, 6, 8, 10, 12].map(num => (
                <option key={num} value={num}>{num} seats</option>
              ))}
            </select>
            {errors.seats && (
              <p className="text-sm text-red-600 mt-1">{errors.seats}</p>
            )}
          </div>

          {/* Active Toggle */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => handleChange('active', e.target.checked)}
                className="w-4 h-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-900"
                disabled={loading}
              />
              <span className="text-sm text-neutral-700">Active (available for orders)</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 disabled:opacity-50"
            >
              {loading ? 'Saving...' : table ? 'Update Table' : 'Create Table'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
