import React from 'react';

export default function MetricsOverview({ data, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-neutral-200 p-5 animate-pulse">
            <div className="h-4 bg-neutral-200 rounded w-24 mb-3"></div>
            <div className="h-8 bg-neutral-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const metrics = [
    {
      label: 'Total Revenue',
      value: `₹${data.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'text-neutral-900',
    },
    {
      label: 'Total Orders',
      value: data.totalOrders.toLocaleString('en-IN'),
      color: 'text-neutral-900',
    },
    {
      label: 'Average Order Value',
      value: `₹${data.averageOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'text-neutral-900',
    },
    {
      label: 'Total Tax Collected',
      value: `₹${data.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'text-neutral-900',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white rounded-lg border border-neutral-200 p-5">
          <p className="text-sm font-medium text-neutral-600 mb-2">{metric.label}</p>
          <p className={`text-3xl font-semibold ${metric.color}`}>{metric.value}</p>
        </div>
      ))}
    </div>
  );
}
