import React from 'react';

export default function CategorySidebar({
  categories,
  activeCategory,
  onSelectCategory,
  loading,
}) {
  if (loading) {
    return (
      <div className="w-72 bg-white border-r border-neutral-200 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-neutral-200 rounded"></div>
          <div className="h-10 bg-neutral-200 rounded"></div>
          <div className="h-10 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white border-r border-neutral-200 flex flex-col">
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
          Categories
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {categories.length === 0 ? (
          <div className="p-4 text-sm text-neutral-600">
            No categories found.
          </div>
        ) : (
          <div className="p-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors mb-1 ${
                  activeCategory?.id === category.id
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{category.name}</span>
                  <span
                    className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                      activeCategory?.id === category.id
                        ? 'bg-neutral-700 text-neutral-100'
                        : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {category._count?.products || 0}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
