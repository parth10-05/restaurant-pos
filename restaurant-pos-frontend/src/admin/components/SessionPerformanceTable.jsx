import React from 'react';

export default function SessionPerformanceTable({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Session Performance</h3>
        <div className="animate-pulse">
          <div className="h-10 bg-neutral-200 rounded mb-2"></div>
          <div className="h-10 bg-neutral-100 rounded mb-2"></div>
          <div className="h-10 bg-neutral-200 rounded mb-2"></div>
          <div className="h-10 bg-neutral-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Session Performance</h3>
        <div className="text-center py-8 text-neutral-500">
          No session data available for the selected period
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Session Performance</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Session ID</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Opened At</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Closed At</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Status</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-neutral-700">Orders</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-neutral-700">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.map((session) => (
              <tr key={session.sessionId} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="py-3 px-4 text-sm text-neutral-600 font-mono">{session.sessionId.slice(0, 8)}</td>
                <td className="py-3 px-4 text-sm text-neutral-600">{formatDateTime(session.openedAt)}</td>
                <td className="py-3 px-4 text-sm text-neutral-600">{formatDateTime(session.closedAt)}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                      session.status === 'open'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    {session.status.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-neutral-900 text-right font-medium">
                  {session.orderCount}
                </td>
                <td className="py-3 px-4 text-sm text-neutral-900 text-right font-medium">
                  ₹{session.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
