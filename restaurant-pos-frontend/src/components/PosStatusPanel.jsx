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
    <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-lg font-bold text-neutral-900 uppercase tracking-wide">POS Status</h2>
            <span
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg ${
                isActive
                  ? 'bg-green-50 text-green-900 border-2 border-green-200'
                  : 'bg-neutral-100 text-neutral-700 border-2 border-neutral-200'
              }`}
            >
              {isActive ? 'Active Session' : 'No Active Session'}
            </span>
          </div>

          {isActive ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                    Session ID
                  </p>
                  <p className="text-base font-bold font-mono text-neutral-900">
                    #{session.id.toString().padStart(6, '0')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                    Opened By
                  </p>
                  <p className="text-base font-semibold text-neutral-900">{session.user?.email || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                    Opened At
                  </p>
                  <p className="text-base font-semibold text-neutral-900">
                    {new Date(session.openedAt).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                    Active Since
                  </p>
                  <p className="text-base font-bold text-neutral-900">
                    {Math.floor((new Date() - new Date(session.openedAt)) / 60000)} min
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm font-medium text-neutral-600">
              No active POS session. Open a new session to begin operations.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
