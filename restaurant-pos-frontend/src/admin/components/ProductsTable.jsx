import React from 'react';

export default function ProductsTable({
  products,
  onEdit,
  onDelete,
  loading,
}) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-12 bg-neutral-200 rounded"></div>
        <div className="h-12 bg-neutral-200 rounded"></div>
        <div className="h-12 bg-neutral-200 rounded"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-neutral-600">No products in this category.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
              Product Name
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider">
              Price
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-neutral-700 uppercase tracking-wider">
              Tax %
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-neutral-700 uppercase tracking-wider">
              Active
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-neutral-700 uppercase tracking-wider">
              Send to Kitchen
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider w-32">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
              <td className="px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-neutral-900">
                    {product.name}
                  </div>
                  {product.description && (
                    <div className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                      {product.description}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-semibold text-neutral-900">
                  ₹{product.price.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="text-sm text-neutral-900">
                  {product.taxPercent}%
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                    product.isActive
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                  }`}
                >
                  {product.isActive ? 'Yes' : 'No'}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                    product.sendToKitchen
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                  }`}
                >
                  {product.sendToKitchen ? 'Yes' : 'No'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(product)}
                    className="px-3 py-1.5 text-xs font-medium text-neutral-700 border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(product)}
                    className="px-3 py-1.5 text-xs font-medium text-red-700 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
