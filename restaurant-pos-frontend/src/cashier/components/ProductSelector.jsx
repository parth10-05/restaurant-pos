import { useState, useEffect } from 'react';
import { api } from '../../config/api';

export default function ProductSelector({ onProductSelect, disabled }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategoriesAndProducts();
  }, []);

  const loadCategoriesAndProducts = async () => {
    setLoading(true);
    try {
      const [catResponse, prodResponse] = await Promise.all([
        api.get('/cashier/categories?includeInactive=false'),
        api.get('/cashier/products?includeInactive=false'),
      ]);

      const activeCategories = catResponse.data.data
        .filter(c => c.active)
        .sort((a, b) => a.sequence - b.sequence);
      
      const activeProducts = prodResponse.data.data.filter(p => p.isActive);

      setCategories(activeCategories);
      setProducts(activeProducts);

      if (activeCategories.length > 0) {
        setSelectedCategory(activeCategories[0].id);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter(p => p.categoryId === selectedCategory)
    : products;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-neutral-500">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Category Tabs */}
      <div>
        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              disabled={disabled}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${
                selectedCategory === category.id
                  ? 'bg-neutral-900 text-white shadow-lg'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-2 border-neutral-200'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div>
        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
          Select Product
        </label>
        {filteredProducts.length === 0 ? (
          <div className="text-sm font-medium text-neutral-500 text-center py-12 bg-neutral-50 rounded-lg">
            No products in this category
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => onProductSelect(product)}
                disabled={disabled}
                className={`p-4 rounded-xl border-2 border-neutral-200 bg-white hover:border-neutral-900 hover:shadow-lg transition-all text-left ${
                  disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <div className="font-bold text-sm text-neutral-900 line-clamp-2 mb-2">
                  {product.name}
                </div>
                <div className="text-xl font-bold text-neutral-900">
                  ₹{product.price.toFixed(2)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
