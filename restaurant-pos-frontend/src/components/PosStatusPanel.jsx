import React from 'react';

export default function PosStatusPanel({ session, loading }) {
  if (loading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-200 rounded w-32 mb-4"></div>
          <div className="h-4 bg-neutral-200 rounded w-48"></div>
        </div>
      </div>
    );
  }

  const isActive = session && session.status === 'open';

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">POS Status</h2>
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                isActive
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
              }`}
            >
              {isActive ? 'ACTIVE SESSION' : 'NO ACTIVE SESSION'}
            </span>
          </div>

          {isActive ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                    Session ID
                  </p>
                  <p className="text-sm font-mono text-neutral-900">
                    #{session.id.toString().padStart(6, '0')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                    Opened By
                  </p>
                  <p className="text-sm text-neutral-900">{session.user?.email || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                    Opened At
                  </p>
                  <p className="text-sm text-neutral-900">
                    {new Date(session.openedAt).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                    Active Since
                  </p>
                  <p className="text-sm font-semibold text-neutral-900">
                    {Math.floor((new Date() - new Date(session.openedAt)) / 60000)} min
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-600">
              No active POS session. Open a new session to begin operations.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
