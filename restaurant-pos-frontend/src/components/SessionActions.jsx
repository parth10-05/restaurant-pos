import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionService } from '../services/session.service';

export default function SessionActions({ session, onSessionChange }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isActive = session && session.status === 'open';

  const handleOpenSession = async () => {
    setLoading(true);
    setError('');

    const result = await sessionService.openSession();

    if (result.success) {
      onSessionChange();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleCloseSession = async () => {
    if (!confirm('Are you sure you want to close the current POS session?')) {
      return;
    }

    setLoading(true);
    setError('');

    const result = await sessionService.closeSession();

    if (result.success) {
      onSessionChange();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleGoToPOS = () => {
    navigate('/pos');
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6">
      <h3 className="text-sm font-semibold text-neutral-900 mb-4">Actions</h3>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        {!isActive ? (
          <button
            onClick={handleOpenSession}
            disabled={loading}
            className="px-4 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Opening...' : 'Open POS Session'}
          </button>
        ) : (
          <>
            <button
              onClick={handleGoToPOS}
              disabled={loading}
              className="px-4 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Go to Cashier POS
            </button>
            <button
              onClick={handleCloseSession}
              disabled={loading}
              className="px-4 py-2.5 bg-white text-neutral-700 text-sm font-medium rounded-md border border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Closing...' : 'Close POS Session'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
