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
  
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch products when active category changes
  useEffect(() => {
    if (activeCategory) {
      fetchProducts(activeCategory.id);
    }
  }, [activeCategory]);

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

  const fetchProducts = async (categoryId) => {
    setLoadingProducts(true);
    setError('');

    const result = await productService.getAll({ categoryId });

    if (result.success) {
      setProducts(result.data);
    } else {
      setError(result.error);
    }

    setLoadingProducts(false);
  };

  const handleSelectCategory = (category) => {
    setActiveCategory(category);
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
        fetchProducts(activeCategory.id);
      }
    } else {
      setError(result.error);
    }
  };

  const handleFormSuccess = () => {
    // Refresh categories (for count) and products
    fetchCategories();
    if (activeCategory) {
      fetchProducts(activeCategory.id);
    }
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
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  {activeCategory.name}
                </h2>
                <p className="text-sm text-neutral-600 mt-0.5">
                  {products.length} {products.length === 1 ? 'product' : 'products'}
                </p>
              </div>
              <button
                onClick={handleAddProduct}
                className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 transition-colors"
              >
                Add Product
              </button>
            </div>

            {/* Products Table */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <ProductsTable
                products={products}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                loading={loadingProducts}
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
