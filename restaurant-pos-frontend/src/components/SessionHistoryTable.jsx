import React from 'react';

export default function SessionHistoryTable({ sessions, loading }) {
  if (loading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">Recent Sessions</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-neutral-200 rounded"></div>
          <div className="h-10 bg-neutral-200 rounded"></div>
          <div className="h-10 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">Recent Sessions</h3>
        <p className="text-sm text-neutral-600">No sessions found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-900">Recent Sessions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Session ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Opened At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Closed At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Orders
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {sessions.map((session) => (
              <tr key={session.sessionId} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-mono text-neutral-900">
                    #{session.sessionId.toString().padStart(6, '0')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-neutral-900">
                    {new Date(session.openedAt).toLocaleString('en-US', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-neutral-900">
                    {session.closedAt
                      ? new Date(session.closedAt).toLocaleString('en-US', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : '—'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                      session.status === 'open'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                    }`}
                  >
                    {session.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-sm text-neutral-900">
                    {session.orderCount || 0}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm font-semibold text-neutral-900">
                    ₹{session.totalRevenue?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
