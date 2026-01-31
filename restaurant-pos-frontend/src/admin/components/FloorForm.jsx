import { useState, useEffect } from 'react';

export default function FloorForm({ floor, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    sequence: 1,
    active: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (floor) {
      setFormData({
        name: floor.name || '',
        sequence: floor.sequence || 1,
        active: floor.active !== undefined ? floor.active : true
      });
    }
  }, [floor]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Floor name is required';
    }
    
    if (formData.sequence < 1) {
      newErrors.sequence = 'Sequence must be at least 1';
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
          {floor ? 'Edit Floor' : 'Add Floor'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Floor Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Floor Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="e.g., Ground Floor, First Floor"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Sequence */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Display Order
            </label>
            <input
              type="number"
              min="1"
              value={formData.sequence}
              onChange={(e) => handleChange('sequence', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
              disabled={loading}
            />
            {errors.sequence && (
              <p className="text-sm text-red-600 mt-1">{errors.sequence}</p>
            )}
            <p className="text-xs text-neutral-500 mt-1">
              Lower numbers appear first
            </p>
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
              <span className="text-sm text-neutral-700">Active (visible in POS)</span>
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
              {loading ? 'Saving...' : floor ? 'Update Floor' : 'Create Floor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
