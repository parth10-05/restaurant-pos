import React, { useState, useEffect } from 'react';
import { productService } from '../../services/product.service';
import { ingredientService } from '../../services/ingredient.service';

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
    kitchenStation: 'GENERAL',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Ingredient state
  const [ingredients, setIngredients] = useState([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [ingredientResults, setIngredientResults] = useState([]);
  const [showIngredientResults, setShowIngredientResults] = useState(false);
  const [showNewIngredientForm, setShowNewIngredientForm] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    unit: '',
    costPerUnit: 0,
    minStock: 0,
  });

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
        kitchenStation: product.kitchenStation || 'GENERAL',
      });
      
      // Load existing ingredients
      if (product.ingredients && product.ingredients.length > 0) {
        setIngredients(
          product.ingredients.map(ing => ({
            ingredientId: ing.id,
            name: ing.name,
            unit: ing.unit,
            quantity: ing.quantity,
          }))
        );
      }
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

  // Ingredient search handler
  const handleIngredientSearch = async (e) => {
    const value = e.target.value;
    setIngredientSearch(value);

    if (value.trim().length > 0) {
      const result = await ingredientService.search(value);
      if (result.success) {
        setIngredientResults(result.data);
        setShowIngredientResults(true);
      }
    } else {
      setIngredientResults([]);
      setShowIngredientResults(false);
    }
  };

  // Select ingredient from search results
  const handleSelectIngredient = (ingredient) => {
    // Check if already added
    if (ingredients.find(ing => ing.ingredientId === ingredient.id)) {
      setError('This ingredient is already added');
      return;
    }

    setIngredients([
      ...ingredients,
      {
        ingredientId: ingredient.id,
        name: ingredient.name,
        unit: ingredient.unit,
        quantity: 1,
      },
    ]);

    // Reset search
    setIngredientSearch('');
    setIngredientResults([]);
    setShowIngredientResults(false);
  };

  // Update ingredient quantity
  const handleIngredientQuantityChange = (index, value) => {
    const updated = [...ingredients];
    updated[index].quantity = parseFloat(value) || 0;
    setIngredients(updated);
  };

  // Remove ingredient
  const handleRemoveIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Show new ingredient form
  const handleShowNewIngredientForm = () => {
    setNewIngredient({
      name: ingredientSearch,
      unit: '',
      costPerUnit: 0,
      minStock: 0,
    });
    setShowNewIngredientForm(true);
    setShowIngredientResults(false);
  };

  // Create new ingredient
  const handleCreateIngredient = async () => {
    if (!newIngredient.name || !newIngredient.unit) {
      setError('Ingredient name and unit are required');
      return;
    }

    const result = await ingredientService.create(newIngredient);
    if (result.success) {
      // Add to ingredients list
      setIngredients([
        ...ingredients,
        {
          ingredientId: result.data.id,
          name: result.data.name,
          unit: result.data.unit,
          quantity: 1,
        },
      ]);

      // Reset
      setShowNewIngredientForm(false);
      setIngredientSearch('');
      setNewIngredient({
        name: '',
        unit: '',
        costPerUnit: 0,
        minStock: 0,
      });
    } else {
      setError(result.error);
    }
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
      kitchenStation: formData.kitchenStation,
      ingredients: ingredients.map(ing => ({
        ingredientId: ing.ingredientId,
        quantity: ing.quantity,
      })),
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

    // Validate ingredients
    for (const ing of ingredients) {
      if (!ing.quantity || ing.quantity <= 0) {
        setError('All ingredient quantities must be greater than 0');
        setLoading(false);
        return;
      }
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

          {/* Ingredients Section */}
          <div className="border-t border-neutral-200 pt-5 mt-2">
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Ingredients
            </label>
            
            {/* Ingredient Search */}
            <div className="relative mb-3">
              <input
                type="text"
                value={ingredientSearch}
                onChange={handleIngredientSearch}
                placeholder="Search ingredients..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent text-neutral-900"
                disabled={loading}
              />
              
              {/* Search Results Dropdown */}
              {showIngredientResults && ingredientResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {ingredientResults.map((ingredient) => (
                    <button
                      key={ingredient.id}
                      type="button"
                      onClick={() => handleSelectIngredient(ingredient)}
                      className="w-full px-3 py-2 text-left hover:bg-neutral-100 focus:outline-none focus:bg-neutral-100 text-sm"
                    >
                      <div className="font-medium text-neutral-900">{ingredient.name}</div>
                      <div className="text-xs text-neutral-600">Unit: {ingredient.unit}</div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* No results - option to add new */}
              {showIngredientResults && ingredientResults.length === 0 && ingredientSearch.trim().length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-300 rounded-md shadow-lg">
                  <div className="px-3 py-2 text-sm text-neutral-600">
                    No ingredients found
                  </div>
                  <button
                    type="button"
                    onClick={handleShowNewIngredientForm}
                    className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 focus:outline-none focus:bg-blue-50"
                  >
                    + Add new ingredient "{ingredientSearch}"
                  </button>
                </div>
              )}
            </div>

            {/* New Ingredient Form */}
            {showNewIngredientForm && (
              <div className="mb-3 p-3 bg-neutral-50 border border-neutral-300 rounded-md">
                <div className="text-sm font-medium text-neutral-700 mb-2">Add New Ingredient</div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newIngredient.name}
                    onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                    placeholder="Ingredient name"
                    className="w-full px-2 py-1.5 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
                  />
                  <input
                    type="text"
                    value={newIngredient.unit}
                    onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                    placeholder="Unit (e.g., kg, g, l, ml, pcs)"
                    className="w-full px-2 py-1.5 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newIngredient.costPerUnit}
                      onChange={(e) => setNewIngredient({ ...newIngredient, costPerUnit: parseFloat(e.target.value) || 0 })}
                      placeholder="Cost per unit"
                      className="flex-1 px-2 py-1.5 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
                      min="0"
                      step="0.01"
                    />
                    <input
                      type="number"
                      value={newIngredient.minStock}
                      onChange={(e) => setNewIngredient({ ...newIngredient, minStock: parseFloat(e.target.value) || 0 })}
                      placeholder="Min stock"
                      className="flex-1 px-2 py-1.5 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowNewIngredientForm(false)}
                      className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateIngredient}
                      className="px-3 py-1.5 text-sm bg-neutral-900 text-white rounded hover:bg-neutral-800"
                    >
                      Add Ingredient
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Ingredients List */}
            {ingredients.length > 0 && (
              <div className="space-y-2">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-md">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-neutral-900">{ingredient.name}</div>
                      <div className="text-xs text-neutral-600">Unit: {ingredient.unit}</div>
                    </div>
                    <input
                      type="number"
                      value={ingredient.quantity}
                      onChange={(e) => handleIngredientQuantityChange(index, e.target.value)}
                      className="w-24 px-2 py-1 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
                      min="0.01"
                      step="0.01"
                      placeholder="Qty"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(index)}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {ingredients.length === 0 && (
              <div className="text-sm text-neutral-500 italic">
                No ingredients added yet. Search above to add ingredients.
              </div>
            )}
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

            {formData.sendToKitchen && (
              <div>
                <label htmlFor="kitchenStation" className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Kitchen Station
                </label>
                <select
                  id="kitchenStation"
                  name="kitchenStation"
                  value={formData.kitchenStation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent text-neutral-900 bg-white"
                  disabled={loading}
                >
                  <option value="GENERAL">General</option>
                  <option value="GRILL">Grill</option>
                  <option value="FRYER">Fryer</option>
                  <option value="DRINKS">Drinks</option>
                  <option value="DESSERT">Dessert</option>
                </select>
              </div>
            )}
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
