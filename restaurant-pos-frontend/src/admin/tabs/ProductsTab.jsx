import React, { useState, useEffect } from 'react';
import { categoryService, productService } from '../../services/product.service';
import CategorySidebar from '../components/CategorySidebar';
import ProductsTable from '../components/ProductsTable';
import ProductForm from '../components/ProductForm';

export default function ProductsTab() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch products when active category changes or search term changes
  useEffect(() => {
    if (activeCategory) {
      const timer = setTimeout(() => {
        fetchProducts(activeCategory.id, searchTerm);
      }, 300); // Debounce search

      return () => clearTimeout(timer);
    }
  }, [activeCategory, searchTerm]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    setError('');

    const result = await categoryService.getAll();

    if (result.success) {
      setCategories(result.data);
      // Set first active category as default
      if (result.data.length > 0 && !activeCategory) {
        setActiveCategory(result.data[0]);
      }
    } else {
      setError(result.error);
    }

    setLoadingCategories(false);
  };

  const fetchProducts = async (categoryId, search = '') => {
    setLoadingProducts(true);
    setError('');

    const filters = { isActive: true };
    
    // Global search: search across all categories
    // Category filter: show only products in selected category
    if (search && search.trim()) {
      filters.search = search.trim();
      // Don't filter by category when searching
    } else if (categoryId) {
      filters.categoryId = categoryId;
    }

    const result = await productService.getAll(filters);

    if (result.success) {
      setProducts(result.data);
    } else {
      setError(result.error);
    }

    setLoadingProducts(false);
  };

  const handleSelectCategory = (category) => {
    setActiveCategory(category);
    setSearchTerm(''); // Clear search when switching categories
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    const result = await productService.delete(product.id);

    if (result.success) {
      // Refresh products and categories (for count update)
      fetchCategories();
      if (activeCategory) {
        fetchProducts(activeCategory.id, searchTerm);
      }
    } else {
      setError(result.error);
    }
  };

  const handleFormSuccess = () => {
    // Refresh categories (for count) and products
    fetchCategories();
    if (activeCategory) {
      fetchProducts(activeCategory.id, searchTerm);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Category Sidebar */}
      <CategorySidebar
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        loading={loadingCategories}
      />

      {/* Products Panel */}
      <div className="flex-1 flex flex-col bg-white">
        {error && (
          <div className="mx-6 mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        {activeCategory ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    {searchTerm.trim() ? 'Search Results' : activeCategory.name}
                  </h2>
                  <p className="text-sm text-neutral-600 mt-0.5">
                    {products.length} {products.length === 1 ? 'product' : 'products'}
                    {searchTerm.trim() && ` matching "${searchTerm}"`}
                  </p>
                </div>
                <button
                  onClick={handleAddProduct}
                  className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 transition-colors"
                >
                  Add Product
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-10 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent text-sm"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Products Table */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <ProductsTable
                products={products}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                loading={loadingProducts}
                showCategory={!!searchTerm.trim()}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-600">
            {loadingCategories ? 'Loading...' : 'Select a category to view products'}
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onClose={() => setShowProductForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
