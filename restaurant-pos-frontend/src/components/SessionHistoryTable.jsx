import React from 'react';
import { formatDuration, formatCurrency } from '../utils/formatters';

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
    <div className="bg-white border-2 border-neutral-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b-2 border-neutral-200 bg-neutral-50">
        <h3 className="text-base font-bold text-neutral-900 uppercase tracking-wide">Recent Sessions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-6 py-4 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">
                Session ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">
                Opened At
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">
                Closed At
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold text-neutral-600 uppercase tracking-wider">
                Orders
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-neutral-600 uppercase tracking-wider">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {sessions.map((session) => (
              <tr key={session.sessionId} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold font-mono text-neutral-900">
                    #{session.sessionId.toString().padStart(6, '0')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-neutral-900">
                    {new Date(session.openedAt).toLocaleString('en-US', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-neutral-900">
                    {session.closedAt
                      ? new Date(session.closedAt).toLocaleString('en-US', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : '—'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-neutral-900">
                    {formatDuration(
                      (session.closedAt ? new Date(session.closedAt) : new Date()) - new Date(session.openedAt)
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded-lg ${
                      session.status === 'open'
                        ? 'bg-green-50 text-green-900 border border-green-200'
                        : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                    }`}
                  >
                    {session.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-sm font-bold text-neutral-900">
                    {session.orderCount || 0}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm font-bold text-neutral-900">
                    {formatCurrency(session.totalRevenue || 0)}
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
