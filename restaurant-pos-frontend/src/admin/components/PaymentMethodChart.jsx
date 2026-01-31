import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
  cash: '#404040',      // neutral-700
  digital: '#737373',   // neutral-500
  upi: '#a3a3a3',       // neutral-400
};

const LABELS = {
  cash: 'Cash',
  digital: 'Digital/Card',
  upi: 'UPI',
};

export default function PaymentMethodChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Revenue by Payment Method</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="w-48 h-48 bg-neutral-200 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Revenue by Payment Method</h3>
        <div className="h-64 flex items-center justify-center text-neutral-500">
          No payment data available
        </div>
      </div>
    );
  }

  // Filter out methods with zero values
  const chartData = data
    .filter(item => item.total > 0)
    .map(item => ({
      name: LABELS[item.method] || item.method,
      value: item.total,
      method: item.method,
    }));

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Revenue by Payment Method</h3>
        <div className="h-64 flex items-center justify-center text-neutral-500">
          No payment data available
        </div>
      </div>
    );
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const percentage = ((payload[0].value / total) * 100).toFixed(1);
      return (
        <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-neutral-900">{payload[0].name}</p>
          <p className="text-sm text-neutral-600">
            ₹{payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-neutral-500">{percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <div className="flex justify-center gap-6 mt-4">
        {payload.map((entry, index) => {
          const percentage = ((entry.payload.value / total) * 100).toFixed(1);
          return (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-neutral-700">
                {entry.value} ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Revenue by Payment Method</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.method] || '#a3a3a3'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
