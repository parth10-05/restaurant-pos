import React, { useState, useEffect } from 'react';
import { sessionService } from '../../services/session.service';
import PosStatusPanel from '../../components/PosStatusPanel';
import SessionActions from '../../components/SessionActions';
import SessionHistoryTable from '../../components/SessionHistoryTable';

export default function PosTab() {
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const [currentResult, historyResult] = await Promise.all([
        sessionService.getCurrentSession(),
        sessionService.getSessionHistory(),
      ]);

      if (currentResult.success) {
        setCurrentSession(currentResult.data);
      } else {
        setError(currentResult.error);
      }

      if (historyResult.success) {
        setSessionHistory(historyResult.data || []);
      }
    } catch (err) {
      setError('Failed to load POS data');
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSessionChange = () => {
    fetchData();
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Section 1: POS Status */}
      <PosStatusPanel session={currentSession} loading={loading} />

      {/* Section 2: Actions */}
      <SessionActions session={currentSession} onSessionChange={handleSessionChange} />

      {/* Section 3: Recent Sessions */}
      <SessionHistoryTable sessions={sessionHistory} loading={loading} />
    </div>
  );
}
