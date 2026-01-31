import React, { useState, useEffect } from 'react';
import { productService } from '../../services/product.service';

export default function ProductForm({ product, categories, onClose, onSuccess }) {
  const isEditing = !!product;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    taxPercent: '',
    categoryId: '',
    isActive: true,
    sendToKitchen: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        taxPercent: product.taxPercent || '',
        categoryId: product.categoryId || '',
        isActive: product.isActive ?? true,
        sendToKitchen: product.sendToKitchen ?? true,
      });
    } else if (categories.length > 0) {
      // Set first category as default
      setFormData(prev => ({
        ...prev,
        categoryId: categories[0].id,
      }));
    }
  }, [product, categories]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Prepare data
    const data = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price: parseFloat(formData.price),
      taxPercent: parseFloat(formData.taxPercent),
      categoryId: formData.categoryId,
      isActive: formData.isActive,
      sendToKitchen: formData.sendToKitchen,
    };

    // Validation
    if (!data.name) {
      setError('Product name is required');
      setLoading(false);
      return;
    }

    if (isNaN(data.price) || data.price < 0) {
      setError('Valid price is required');
      setLoading(false);
      return;
    }

    if (isNaN(data.taxPercent) || data.taxPercent < 0 || data.taxPercent > 100) {
      setError('Tax percentage must be between 0 and 100');
      setLoading(false);
      return;
    }

    if (!data.categoryId) {
      setError('Category is required');
      setLoading(false);
      return;
    }

    let result;
    if (isEditing) {
      result = await productService.update(product.id, data);
    } else {
      result = await productService.create(data);
    }

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-semibold text-neutral-900">
            {isEditing ? 'Edit Product' : 'Add Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded-lg hover:bg-neutral-100"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent text-neutral-900"
              placeholder="Enter product name"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent text-neutral-900 resize-none"
              placeholder="Optional description"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-neutral-700 mb-1.5">
              Category *
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent text-neutral-900 bg-white"
              disabled={loading}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Price (₹) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent text-neutral-900"
                placeholder="0.00"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="taxPercent" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Tax Percentage (%) *
              </label>
              <input
                type="number"
                id="taxPercent"
                name="taxPercent"
                value={formData.taxPercent}
                onChange={handleChange}
                required
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent text-neutral-900"
                placeholder="0"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-500"
                disabled={loading}
              />
              <label htmlFor="isActive" className="ml-2.5 text-sm text-neutral-700">
                Active (visible in POS)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="sendToKitchen"
                name="sendToKitchen"
                checked={formData.sendToKitchen}
                onChange={handleChange}
                className="w-4 h-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-500"
                disabled={loading}
              />
              <label htmlFor="sendToKitchen" className="ml-2.5 text-sm text-neutral-700">
                Send to Kitchen Display
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-neutral-200 bg-white flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
