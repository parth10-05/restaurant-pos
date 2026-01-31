import React, { useState, useEffect } from 'react';
import { useReportFilters } from '../../hooks/useReportFilters';

export default function ReportFilters({ onApply, categories }) {
  const { filters, setFilters, resetFilters } = useReportFilters();
  
  const [localFilters, setLocalFilters] = useState({
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    sessionStatus: filters.sessionStatus,
    paymentMethods: filters.paymentMethods,
    categoryNames: filters.categoryNames,
  });

  // Sync with store
  useEffect(() => {
    setLocalFilters({
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      sessionStatus: filters.sessionStatus,
      paymentMethods: filters.paymentMethods,
      categoryNames: filters.categoryNames,
    });
  }, [filters]);

  const handleApply = () => {
    setFilters(localFilters);
    onApply();
  };

  const handleReset = () => {
    resetFilters();
    onApply();
  };

  const handlePaymentMethodToggle = (method) => {
    const updated = localFilters.paymentMethods.includes(method)
      ? localFilters.paymentMethods.filter(m => m !== method)
      : [...localFilters.paymentMethods, method];
    setLocalFilters({ ...localFilters, paymentMethods: updated });
  };

  const handleCategoryToggle = (categoryName) => {
    const updated = localFilters.categoryNames.includes(categoryName)
      ? localFilters.categoryNames.filter(name => name !== categoryName)
      : [...localFilters.categoryNames, categoryName];
    setLocalFilters({ ...localFilters, categoryNames: updated });
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-5 mb-6">
      <div className="space-y-4">
        {/* Date Range Row */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="fromDate" className="block text-sm font-medium text-neutral-700 mb-1.5">
              From Date
            </label>
            <input
              type="date"
              id="fromDate"
              value={localFilters.fromDate}
              onChange={(e) => setLocalFilters({ ...localFilters, fromDate: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent text-neutral-900"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label htmlFor="toDate" className="block text-sm font-medium text-neutral-700 mb-1.5">
              To Date
            </label>
            <input
              type="date"
              id="toDate"
              value={localFilters.toDate}
              onChange={(e) => setLocalFilters({ ...localFilters, toDate: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent text-neutral-900"
            />
          </div>

          <div className="flex-1 min-w-[180px]">
            <label htmlFor="sessionStatus" className="block text-sm font-medium text-neutral-700 mb-1.5">
              Session Status
            </label>
            <select
              id="sessionStatus"
              value={localFilters.sessionStatus}
              onChange={(e) => setLocalFilters({ ...localFilters, sessionStatus: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent text-neutral-900 bg-white"
            >
              <option value="all">All Sessions</option>
              <option value="open">Open Only</option>
              <option value="closed">Closed Only</option>
            </select>
          </div>
        </div>

        {/* Payment Methods Row */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Payment Methods
          </label>
          <div className="flex flex-wrap gap-2">
            {['cash', 'digital', 'upi'].map(method => (
              <button
                key={method}
                type="button"
                onClick={() => handlePaymentMethodToggle(method)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  localFilters.paymentMethods.includes(method)
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {method === 'digital' ? 'Digital/Card' : method.toUpperCase()}
              </button>
            ))}
          </div>
          {localFilters.paymentMethods.length === 0 && (
            <p className="text-xs text-neutral-500 mt-1">All payment methods included</p>
          )}
        </div>

        {/* Categories Row */}
        {categories && categories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Product Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryToggle(category.name)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    localFilters.categoryNames.includes(category.name)
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
            {localFilters.categoryNames.length === 0 && (
              <p className="text-xs text-neutral-500 mt-1">All categories included</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-neutral-200">
          <button
            onClick={handleApply}
            className="px-5 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={handleReset}
            className="px-5 py-2.5 bg-white text-neutral-700 text-sm font-medium border border-neutral-300 rounded-md hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 transition-colors"
          >
            Reset All
          </button>
        </div>
      </div>
    </div>
  );
}
