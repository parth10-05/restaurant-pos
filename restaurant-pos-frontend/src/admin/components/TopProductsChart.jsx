import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TopProductsChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Top Products by Revenue</h3>
        <div className="animate-pulse">
          <div className="h-64 bg-neutral-200 rounded mb-4"></div>
          <div className="h-10 bg-neutral-100 rounded mb-2"></div>
          <div className="h-10 bg-neutral-200 rounded mb-2"></div>
          <div className="h-10 bg-neutral-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Top Products by Revenue</h3>
        <div className="text-center py-8 text-neutral-500">
          No product data available for the selected period
        </div>
      </div>
    );
  }

  // Top 10 products for chart
  const topProducts = data.slice(0, 10);

  // Ensure numeric values for charting
  const chartData = topProducts.map(p => ({
    ...p,
    totalRevenue: Number(p.totalRevenue) || 0,
    quantitySold: Number(p.quantitySold) || 0,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-neutral-900">{payload[0].payload.productName}</p>
          <p className="text-sm text-neutral-600">
            Revenue: ₹{payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-neutral-500">
            Quantity: {payload[0].payload.quantitySold}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Top Products by Revenue</h3>
      
      {/* Bar Chart */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#737373', fontSize: 12 }}
              tickFormatter={(value) => value >= 1000 ? `₹${(value / 1000).toFixed(1)}k` : `₹${value}`}
            />
            <YAxis
              type="category"
              dataKey="productName"
              tick={{ fill: '#737373', fontSize: 12 }}
              width={150}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fafafa' }} />
            <Bar dataKey="totalRevenue" fill="#404040" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Full Product Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Rank</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Product Name</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Category</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-neutral-700">Quantity Sold</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-neutral-700">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.map((product, index) => (
              <tr key={product.productId} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="py-3 px-4 text-sm text-neutral-600 font-medium">{index + 1}</td>
                <td className="py-3 px-4 text-sm text-neutral-900">{product.productName}</td>
                <td className="py-3 px-4 text-sm text-neutral-600">{product.categoryName}</td>
                <td className="py-3 px-4 text-sm text-neutral-900 text-right font-medium">
                  {product.quantitySold}
                </td>
                <td className="py-3 px-4 text-sm text-neutral-900 text-right font-medium">
                  ₹{product.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
