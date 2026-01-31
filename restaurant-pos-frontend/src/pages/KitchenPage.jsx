import React from 'react';
import { useAuthStore } from '../store/auth.store';
import KitchenDashboard from '../kitchen/KitchenDashboard';

export default function KitchenPage() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header with Logout */}
      <header className="bg-white border-b-2 border-neutral-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-neutral-900 uppercase tracking-wide">Kitchen Display</h1>
              <p className="text-xs text-neutral-500 font-medium">Order Management</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-semibold text-neutral-900">{user?.email}</div>
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
      
      {/* Kitchen Dashboard */}
      <KitchenDashboard />
    </div>
  );
}
