import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { sessionService } from '../services/session.service';
import CreateOrderTab from '../cashier/tabs/CreateOrderTab';
import PaymentTab from '../cashier/tabs/PaymentTab';
import ReceiptsTab from '../cashier/tabs/ReceiptsTab';

export default function POSPage() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('create-order');
  const [currentSession, setCurrentSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const fetchCurrentSession = async () => {
    setLoadingSession(true);
    const result = await sessionService.getCurrentSession();
    if (result.success) {
      setCurrentSession(result.data);
    } else {
      setCurrentSession(null);
    }
    setLoadingSession(false);
  };

  useEffect(() => {
    fetchCurrentSession();
    
    // Refresh session status every 30 seconds
    const interval = setInterval(fetchCurrentSession, 30000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'order', label: 'Create Order' },
    { id: 'payment', label: 'Payment' },
    { id: 'receipts', label: 'Receipts' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'create-order':
        return <CreateOrderTab hasSession={!!currentSession} onSessionRequired={fetchCurrentSession} />;
      case 'payment':
        return <PaymentTab hasSession={!!currentSession} />;
      case 'receipts':
        return <ReceiptsTab hasSession={!!currentSession} onSessionRequired={fetchCurrentSession} />;
      default:
        return <CreateOrderTab hasSession={!!currentSession} onSessionRequired={fetchCurrentSession} />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b-2 border-neutral-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-neutral-900 uppercase tracking-wide">Point of Sale</h1>
              <p className="text-xs text-neutral-500 font-medium">Cashier Terminal</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Session Status Indicator */}
              {!loadingSession && (
                <div className="flex items-center gap-2">
                  {currentSession ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-2 border-green-200 rounded-lg">
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                      <span className="text-xs font-bold text-green-900 uppercase tracking-wide">Session Open</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-2 border-red-200 rounded-lg">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      <span className="text-xs font-bold text-red-900 uppercase tracking-wide">No Session</span>
                    </div>
                  )}
                </div>
              )}
              <div className="text-right">
                <div className="text-sm font-semibold text-neutral-900">{user?.name || user?.email}</div>
                <div className="text-xs text-neutral-500 font-medium uppercase tracking-wide">{user?.role}</div>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-bold text-neutral-700 hover:text-neutral-900 border-2 border-neutral-300 rounded-lg hover:bg-neutral-50 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Session Warning */}
        {!loadingSession && !currentSession && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-900">No Active POS Session</h3>
                <p className="text-sm text-red-700 mt-1">
                  An administrator must open a POS session before you can view orders and receipts. Please contact your manager to open a session.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-neutral-200 mb-6">
          <div className="flex border-b border-neutral-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-sm font-bold uppercase tracking-wide transition-all ${
                  activeTab === tab.id
                    ? 'text-neutral-900 border-b-2 border-neutral-900 bg-neutral-50'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-neutral-200 p-6">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}
