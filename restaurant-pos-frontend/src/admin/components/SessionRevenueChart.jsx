import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SessionRevenueChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Session-wise Revenue Performance</h3>
        <div className="animate-pulse">
          <div className="h-80 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Session-wise Revenue Performance</h3>
        <div className="text-center py-8 text-neutral-500">
          No closed sessions available for the selected period
        </div>
      </div>
    );
  }

  // Filter only CLOSED sessions and sort by revenue DESC
  const closedSessions = data
    .filter(session => session.status === 'closed')
    .map(session => ({
      ...session,
      totalRevenue: Number(session.totalRevenue) || 0,
      orderCount: Number(session.orderCount) || 0,
      shortId: session.sessionId.slice(0, 8),
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  if (closedSessions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Session-wise Revenue Performance</h3>
        <div className="text-center py-8 text-neutral-500">
          No closed sessions available for the selected period
        </div>
      </div>
    );
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const session = payload[0].payload;
      return (
        <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-neutral-900 mb-2">Session: {session.shortId}</p>
          <p className="text-xs text-neutral-600">
            Opened: {formatDateTime(session.openedAt)}
          </p>
          <p className="text-xs text-neutral-600 mb-2">
            Closed: {formatDateTime(session.closedAt)}
          </p>
          <p className="text-sm text-neutral-900 font-medium">
            Revenue: ₹{session.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-neutral-500">
            Orders: {session.orderCount}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Session-wise Revenue Performance</h3>
      <p className="text-sm text-neutral-600 mb-4">
        Showing {closedSessions.length} closed session{closedSessions.length !== 1 ? 's' : ''} sorted by revenue
      </p>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={closedSessions} margin={{ top: 10, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis
            dataKey="shortId"
            tick={{ fill: '#737373', fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
            label={{ value: 'Session ID', position: 'insideBottom', offset: -50, style: { fill: '#737373', fontSize: 12 } }}
          />
          <YAxis
            tick={{ fill: '#737373', fontSize: 12 }}
            tickFormatter={(value) => value >= 1000 ? `₹${(value / 1000).toFixed(1)}k` : `₹${value}`}
            label={{ value: 'Revenue', angle: -90, position: 'insideLeft', style: { fill: '#737373', fontSize: 12 } }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fafafa' }} />
          <Bar dataKey="totalRevenue" fill="#404040" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
